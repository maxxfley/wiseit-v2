-- Paso 7a · Planes: suscripciones, Premium decidido en la base, cuotas por tipo y plan, y bloqueos.
-- 1) subscriptions + paddle_webhook_events: solo las escribe el webhook (service role).
-- 2) is_premium(): la base decide; ningún bloqueo depende de la UI.
-- 3) ai_usage: tipo de uso + tokens reales; reserve_ai_usage(kind, límite gratis, límite Premium).
-- 4) Progreso Premium (el gratis solo en el primer tema de cada ruta); se cierra la escritura
--    directa de progreso y de aristas.
-- 5) Plan gratis: máximo de rutas guardadas (trigger).
-- Compatible con el código desplegado: reserve_generation(integer) sigue existiendo (cuenta solo
-- generaciones) y create_roadmap_with_nodes no cambia de firma. Se limpian en una migración posterior.

-- ─── 1. subscriptions ─────────────────────────────────────────────────────────
create table public.subscriptions (
  user_id                uuid primary key references public.profiles (id) on delete cascade,
  paddle_customer_id     text,
  paddle_subscription_id text unique,
  status                 text not null
    constraint subscriptions_status_check
    check (status in ('active', 'trialing', 'past_due', 'paused', 'canceled')),
  billing_interval       text constraint subscriptions_interval_check check (billing_interval in ('month', 'year')),
  current_period_end     timestamptz,
  past_due_since         timestamptz,
  cancel_at_period_end   boolean not null default false,
  -- Fecha del último evento aplicado: los webhooks pueden llegar desordenados y se ignoran los viejos.
  last_event_at          timestamptz not null,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

-- El usuario solo puede LEER la suya. Sin insert/update/delete: nadie se da Premium a sí mismo.
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- Eventos de Paddle ya procesados (idempotencia). Sin políticas: solo el service role.
create table public.paddle_webhook_events (
  event_id     text primary key,
  event_type   text not null,
  occurred_at  timestamptz not null,
  processed_at timestamptz not null default now()
);

alter table public.paddle_webhook_events enable row level security;
revoke all on public.paddle_webhook_events from anon, authenticated;

-- ─── 2. is_premium ────────────────────────────────────────────────────────────
-- Premium = suscripción activa dentro del período pagado (+1 día de margen por si el webhook
-- de renovación se demora), o cobro fallido hace menos de 10 días (Paddle sigue reintentando).
-- Al cancelar, Paddle mantiene `active` hasta el fin del período: no hace falta un caso aparte.
create function public.is_premium()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = (select auth.uid())
      and (
        (s.status in ('active', 'trialing')
          and (s.current_period_end is null or s.current_period_end + interval '1 day' > now()))
        or (s.status = 'past_due' and s.past_due_since + interval '10 days' > now())
      )
  );
$$;

-- ─── 3. ai_usage: tipo de uso y tokens ────────────────────────────────────────
alter table public.ai_usage
  add column kind text not null default 'generation'
    constraint ai_usage_kind_check check (kind in ('generation', 'material', 'extension', 'preview')),
  add column model text,
  add column input_tokens integer constraint ai_usage_input_tokens_check check (input_tokens >= 0),
  add column output_tokens integer constraint ai_usage_output_tokens_check check (output_tokens >= 0);

drop index public.ai_usage_user_id_created_at_idx;
create index ai_usage_user_kind_created_at_idx on public.ai_usage (user_id, kind, created_at desc);

-- Reserva un uso del día (UTC) del tipo pedido, con el límite según el plan. Devuelve el id de la
-- reserva (para registrar tokens después) o null si no hay cupo. Límite 0 = función no disponible.
-- Los límites los pasa el servidor (config/plans.ts); llamarla a mano solo gasta cupo propio.
create function public.reserve_ai_usage(p_kind text, p_free_limit integer, p_premium_limit integer)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user  uuid := (select auth.uid());
  v_limit integer;
  v_used  integer;
  v_id    uuid;
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if p_free_limit is null or p_premium_limit is null or p_free_limit < 0 or p_premium_limit < 0 then
    raise exception 'Límite inválido' using errcode = '22023';
  end if;

  v_limit := case when public.is_premium() then p_premium_limit else p_free_limit end;
  if v_limit = 0 then
    return null;
  end if;

  -- Mismo lock por usuario que reserve_generation: pedidos simultáneos no pasan el límite.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select count(*) into v_used
  from public.ai_usage
  where user_id = v_user
    and kind = p_kind
    and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';

  if v_used >= v_limit then
    return null;
  end if;

  insert into public.ai_usage (user_id, kind) values (v_user, p_kind) returning id into v_id;
  return v_id;
end;
$$;

-- Registra modelo y tokens de una reserva propia, una sola vez. SECURITY DEFINER porque ai_usage
-- no tiene UPDATE para usuarios (la cuota no se puede reiniciar); aquí solo se tocan estas columnas.
create function public.record_ai_usage_tokens(
  p_usage_id uuid,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ai_usage
  set model = left(p_model, 100),
      input_tokens = greatest(coalesce(p_input_tokens, 0), 0),
      output_tokens = greatest(coalesce(p_output_tokens, 0), 0)
  where id = p_usage_id
    and user_id = (select auth.uid())
    and model is null;
end;
$$;

-- Compatibilidad con el código desplegado: ahora cuenta solo generaciones.
create or replace function public.reserve_generation(p_daily_limit integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return public.reserve_ai_usage('generation', p_daily_limit, p_daily_limit) is not null;
end;
$$;

-- ─── 4. Progreso Premium (gratis: primer tema) + cierre de escritura directa ──
-- Pasa a SECURITY DEFINER con verificación explícita de dueño, para poder quitar el UPDATE de
-- `nodes` a los usuarios (antes podían escribir su progreso por la API y saltear el RPC).
-- Errores: WS402 (requiere Premium) · WS404 (no existe o es ajeno) · WS423 (bloqueado) · 22023.
create or replace function public.update_node_progress(
  p_node_id uuid,
  p_completed_concepts smallint[],
  p_mark_complete boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total    integer;
  v_concepts smallint[];
  v_roadmap  uuid;
  v_order    integer;
begin
  -- Sin RLS (definer): el dueño se verifica a mano. FOR UPDATE serializa clics simultáneos.
  select case when jsonb_typeof(n.metadata -> 'key_concepts') = 'array'
              then jsonb_array_length(n.metadata -> 'key_concepts') else 0 end,
         n.roadmap_id, n.order_index
    into v_total, v_roadmap, v_order
  from public.nodes n
  where n.id = p_node_id and public.owns_roadmap(n.roadmap_id)
  for update;

  if not found then
    raise exception 'node_not_found' using errcode = 'WS404';
  end if;

  -- Plan gratis: puede guardar progreso solo en el primer tema de la ruta (para probar la función).
  if not public.is_premium()
     and v_order > (select min(n2.order_index) from public.nodes n2 where n2.roadmap_id = v_roadmap) then
    raise exception 'premium_required' using errcode = 'WS402';
  end if;

  if exists (
    select 1
    from public.node_edges e
    join public.nodes req on req.id = e.requires_node_id
    where e.node_id = p_node_id and req.completed_at is null
  ) then
    raise exception 'node_locked' using errcode = 'WS423';
  end if;

  if coalesce(p_mark_complete, false) then
    select coalesce(array_agg(i::smallint order by i), '{}') into v_concepts
    from generate_series(0, v_total - 1) as i;
  else
    select coalesce(array_agg(distinct c order by c), '{}') into v_concepts
    from unnest(coalesce(p_completed_concepts, '{}'::smallint[])) as c;

    if exists (select 1 from unnest(v_concepts) as c where c < 0 or c >= v_total) then
      raise exception 'Índice de concepto inválido' using errcode = '22023';
    end if;
  end if;

  update public.nodes
  set completed_concepts = v_concepts,
      started_at = coalesce(started_at, now()),
      completed_at = case
        when coalesce(p_mark_complete, false) or (v_total > 0 and cardinality(v_concepts) = v_total)
          then coalesce(completed_at, now())
        else null
      end
  where id = p_node_id;
end;
$$;

-- Nadie actualiza nodos directo (el progreso pasa por el RPC). Nadie borra aristas directo
-- (borrar un prerrequisito desbloquearía nodos); al borrar la ruta caen por ON DELETE CASCADE.
drop policy nodes_update_own on public.nodes;
revoke update on public.nodes from authenticated;
drop policy node_edges_delete_own on public.node_edges;
revoke delete on public.node_edges from authenticated;

-- ─── 5. Máximo de rutas guardadas en el plan gratis ───────────────────────────
-- 4 = PLAN_LIMITS.free.maxSavedRoadmaps (src/config/plans.ts). Cubre el RPC y los inserts directos.
-- Las rutas que ya existían no se tocan: solo se impide crear más (decisión del usuario).
create function public.enforce_roadmap_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_premium()
     and (select count(*) from public.roadmaps r where r.user_id = new.user_id) >= 4 then
    raise exception 'roadmap_limit' using errcode = 'WS409';
  end if;
  return new;
end;
$$;

create trigger roadmaps_enforce_limit
  before insert on public.roadmaps
  for each row execute function public.enforce_roadmap_limit();

-- ─── Permisos de ejecución ────────────────────────────────────────────────────
revoke execute on function public.is_premium() from public, anon;
revoke execute on function public.reserve_ai_usage(text, integer, integer) from public, anon;
revoke execute on function public.record_ai_usage_tokens(uuid, text, integer, integer) from public, anon;
revoke execute on function public.update_node_progress(uuid, smallint[], boolean) from public, anon;
revoke execute on function public.enforce_roadmap_limit() from public, anon, authenticated;
grant execute on function public.is_premium() to authenticated;
grant execute on function public.reserve_ai_usage(text, integer, integer) to authenticated;
grant execute on function public.record_ai_usage_tokens(uuid, text, integer, integer) to authenticated;
grant execute on function public.update_node_progress(uuid, smallint[], boolean) to authenticated;
