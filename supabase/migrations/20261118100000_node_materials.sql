-- Paso 7c · "Buscar material".
-- 1) node_materials: caché de las fuentes encontradas por nodo (una búsqueda no se paga dos veces).
--    Guarda hasta 5 fuentes; el recorte por plan (gratis ve 1) lo hace el servidor al leer.
-- 2) free_material_grants: el link gratis usado en cada ruta (1 por ruta, 4 por cuenta, para
--    siempre). Sin FK a la ruta: borrarla NO devuelve el link (misma regla que ai_usage).
-- 3) reserve_material_search: decide si se puede buscar (caché, cuota Premium o cupo gratis) y
--    reserva el uso ANTES de llamar a la IA. save_node_materials guarda el resultado de esa reserva.
-- Las dos funciones son SECURITY DEFINER porque escriben tablas sin permisos de escritura para el
-- usuario; ambas verifican que el nodo sea suyo.

-- ─── 1. node_materials ────────────────────────────────────────────────────────
create table public.node_materials (
  node_id    uuid primary key references public.nodes (id) on delete cascade,
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  -- Una reserva = un guardado: impide escribir la caché sin haber pasado por la búsqueda.
  usage_id   uuid not null unique references public.ai_usage (id) on delete cascade,
  items      jsonb not null
    constraint node_materials_items_check
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 5),
  model      text not null,
  created_at timestamptz not null default now()
);

create index node_materials_roadmap_id_idx on public.node_materials (roadmap_id);
create index node_materials_user_id_idx on public.node_materials (user_id);

alter table public.node_materials enable row level security;
revoke all on public.node_materials from anon, authenticated;
grant select on public.node_materials to authenticated;

create policy node_materials_select_own on public.node_materials
  for select to authenticated using ((select auth.uid()) = user_id);

-- ─── 2. free_material_grants ──────────────────────────────────────────────────
create table public.free_material_grants (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  roadmap_id uuid not null, -- sin FK a propósito (ver encabezado)
  node_id    uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, roadmap_id)
);

alter table public.free_material_grants enable row level security;
revoke all on public.free_material_grants from anon, authenticated;
-- Lectura propia: la UI muestra directamente la invitación a Premium si el cupo ya se usó.
grant select on public.free_material_grants to authenticated;

create policy free_material_grants_select_own on public.free_material_grants
  for select to authenticated using ((select auth.uid()) = user_id);

-- ─── 3. reserve_material_search ───────────────────────────────────────────────
-- status: 'granted' (usage_id para registrar tokens y guardar), 'cached' (ya hay resultado, no
-- se cobra), 'exhausted' (Premium sin cuota hoy), 'roadmap_used' / 'account_used' (gratis sin
-- cupo) o 'not_found' (nodo inexistente o ajeno).
create function public.reserve_material_search(p_node_id uuid, p_premium_daily integer, p_free_total integer)
returns table (status text, usage_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := (select auth.uid());
  v_roadmap uuid;
  v_used    integer;
  v_id      uuid;
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if p_premium_daily is null or p_free_total is null or p_premium_daily < 0 or p_free_total < 0 then
    raise exception 'Límite inválido' using errcode = '22023';
  end if;

  -- Mismo lock que reserve_ai_usage: pedidos simultáneos no pasan ningún límite.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select n.roadmap_id into v_roadmap
  from public.nodes n
  join public.roadmaps r on r.id = n.roadmap_id
  where n.id = p_node_id and r.user_id = v_user;
  if v_roadmap is null then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  if exists (select 1 from public.node_materials m where m.node_id = p_node_id) then
    return query select 'cached'::text, null::uuid;
    return;
  end if;

  if public.is_premium() then
    select count(*) into v_used
    from public.ai_usage a
    where a.user_id = v_user
      and a.kind = 'material'
      and a.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
    if v_used >= p_premium_daily then
      return query select 'exhausted'::text, null::uuid;
      return;
    end if;
  else
    if exists (select 1 from public.free_material_grants g where g.user_id = v_user and g.roadmap_id = v_roadmap) then
      return query select 'roadmap_used'::text, null::uuid;
      return;
    end if;
    if (select count(*) from public.free_material_grants g where g.user_id = v_user) >= p_free_total then
      return query select 'account_used'::text, null::uuid;
      return;
    end if;
    insert into public.free_material_grants (user_id, roadmap_id, node_id) values (v_user, v_roadmap, p_node_id);
  end if;

  insert into public.ai_usage (user_id, kind) values (v_user, 'material') returning id into v_id;
  return query select 'granted'::text, v_id;
end;
$$;

-- ─── 4. save_node_materials ───────────────────────────────────────────────────
-- Guarda la caché de una reserva propia, reciente (10 min) y sin usar. Si otra búsqueda del mismo
-- nodo ganó la carrera, no hace nada: la primera queda.
create function public.save_node_materials(p_usage_id uuid, p_node_id uuid, p_items jsonb, p_model text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := (select auth.uid());
  v_roadmap uuid;
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;

  select n.roadmap_id into v_roadmap
  from public.nodes n
  join public.roadmaps r on r.id = n.roadmap_id
  where n.id = p_node_id and r.user_id = v_user;

  if v_roadmap is null or not exists (
    select 1 from public.ai_usage a
    where a.id = p_usage_id
      and a.user_id = v_user
      and a.kind = 'material'
      and a.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'Reserva inválida' using errcode = '42501';
  end if;

  insert into public.node_materials (node_id, roadmap_id, user_id, usage_id, items, model)
  values (p_node_id, v_roadmap, v_user, p_usage_id, p_items, p_model)
  on conflict do nothing;
end;
$$;

revoke execute on function public.reserve_material_search(uuid, integer, integer) from public, anon;
revoke execute on function public.save_node_materials(uuid, uuid, jsonb, text) from public, anon;
grant execute on function public.reserve_material_search(uuid, integer, integer) to authenticated;
grant execute on function public.save_node_materials(uuid, uuid, jsonb, text) to authenticated;
