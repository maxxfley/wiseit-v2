-- Wiseit v0.2 · Paso 4: motor de generación IA.
-- 1) ai_usage: cuota diaria por usuario.  2) reserve_generation: reserva atómica de cuota.
-- 3) create_roadmap_with_nodes: guarda roadmap + nodos en una sola transacción.
-- Ambas funciones son SECURITY INVOKER: RLS se aplica como si el usuario hiciera los inserts.

-- ─── ai_usage ─────────────────────────────────────────────────────────────────
create table public.ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index ai_usage_user_id_created_at_idx on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon;

-- Solo lectura e inserción de lo propio. Sin update/delete: el usuario no puede reiniciar su cuota.
create policy ai_usage_select_own on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);
create policy ai_usage_insert_own on public.ai_usage
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ─── reserve_generation ───────────────────────────────────────────────────────
-- Cuenta las reservas del día (UTC) y registra una nueva si hay cupo. Devuelve true/false.
-- El lock por usuario serializa pedidos simultáneos: dos requests no pueden pasar el límite.
create function public.reserve_generation(p_daily_limit integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_used integer;
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if p_daily_limit is null or p_daily_limit < 1 then
    raise exception 'Límite inválido' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select count(*) into v_used
  from public.ai_usage
  where user_id = v_user
    and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';

  if v_used >= p_daily_limit then
    return false;
  end if;

  insert into public.ai_usage (user_id) values (v_user);
  return true;
end;
$$;

-- ─── create_roadmap_with_nodes ────────────────────────────────────────────────
-- p_nodes: [{ "title", "description", "difficulty", "order_index" }, ...]
create function public.create_roadmap_with_nodes(p_topic text, p_title text, p_nodes jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_roadmap_id uuid;
begin
  if jsonb_typeof(p_nodes) is distinct from 'array' or jsonb_array_length(p_nodes) = 0 then
    raise exception 'p_nodes debe ser un arreglo no vacío' using errcode = '22023';
  end if;

  insert into public.roadmaps (user_id, topic, title)
  values ((select auth.uid()), p_topic, p_title)
  returning id into v_roadmap_id;

  insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
  select v_roadmap_id, n.title, n.description, n.difficulty, n.order_index
  from jsonb_to_recordset(p_nodes)
    as n (title text, description text, difficulty public.difficulty_level, order_index integer);

  return v_roadmap_id;
end;
$$;

-- Solo usuarios autenticados pueden ejecutarlas (por defecto Postgres da EXECUTE a PUBLIC).
revoke execute on function public.reserve_generation(integer) from public, anon;
revoke execute on function public.create_roadmap_with_nodes(text, text, jsonb) from public, anon;
grant execute on function public.reserve_generation(integer) to authenticated;
grant execute on function public.create_roadmap_with_nodes(text, text, jsonb) to authenticated;
