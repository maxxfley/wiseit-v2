-- Paso 7d · "Avanzar más".
-- 1) roadmap_extensions: cada extensión aplicada a una ruta (tope por ruta).
-- 2) roadmap_previews: títulos "fantasma" del plan gratis, generados UNA vez por ruta.
-- 3) reserve_extension / append_roadmap_nodes: reserva (dueño, Premium, tope por ruta, cuota diaria)
--    ANTES de llamar a la IA y alta atómica de nodos + aristas con esa reserva.
-- 4) reserve_preview / save_roadmap_preview: lo mismo para los títulos fantasma.
-- Todas SECURITY DEFINER: escriben tablas sin permisos de escritura para el usuario y verifican
-- dueño y reserva. Los nodos nuevos son siempre 'Avanzado' (sin migrar el enum).

-- ─── 1. roadmap_extensions ────────────────────────────────────────────────────
create table public.roadmap_extensions (
  id         uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  usage_id   uuid not null unique references public.ai_usage (id) on delete cascade,
  node_count smallint not null constraint roadmap_extensions_node_count_check check (node_count between 1 and 6),
  created_at timestamptz not null default now()
);

create index roadmap_extensions_roadmap_id_idx on public.roadmap_extensions (roadmap_id);
create index roadmap_extensions_user_id_idx on public.roadmap_extensions (user_id);

alter table public.roadmap_extensions enable row level security;
revoke all on public.roadmap_extensions from anon, authenticated;
grant select on public.roadmap_extensions to authenticated;

create policy roadmap_extensions_select_own on public.roadmap_extensions
  for select to authenticated using ((select auth.uid()) = user_id);

-- ─── 2. roadmap_previews ──────────────────────────────────────────────────────
create table public.roadmap_previews (
  roadmap_id uuid primary key references public.roadmaps (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  usage_id   uuid not null unique references public.ai_usage (id) on delete cascade,
  titles     jsonb not null
    constraint roadmap_previews_titles_check
    check (jsonb_typeof(titles) = 'array' and jsonb_array_length(titles) between 1 and 3),
  model      text not null,
  created_at timestamptz not null default now()
);

create index roadmap_previews_user_id_idx on public.roadmap_previews (user_id);

alter table public.roadmap_previews enable row level security;
revoke all on public.roadmap_previews from anon, authenticated;
grant select on public.roadmap_previews to authenticated;

create policy roadmap_previews_select_own on public.roadmap_previews
  for select to authenticated using ((select auth.uid()) = user_id);

-- ─── 3. reserve_extension ─────────────────────────────────────────────────────
-- status: 'granted' (con usage_id), 'not_found', 'premium_required', 'roadmap_max', 'exhausted'.
create function public.reserve_extension(p_roadmap_id uuid, p_daily integer, p_per_roadmap integer)
returns table (status text, usage_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_used integer;
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if p_daily is null or p_per_roadmap is null or p_daily < 0 or p_per_roadmap < 0 then
    raise exception 'Límite inválido' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  if not exists (select 1 from public.roadmaps r where r.id = p_roadmap_id and r.user_id = v_user) then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;
  if not public.is_premium() then
    return query select 'premium_required'::text, null::uuid;
    return;
  end if;
  if (select count(*) from public.roadmap_extensions e where e.roadmap_id = p_roadmap_id) >= p_per_roadmap then
    return query select 'roadmap_max'::text, null::uuid;
    return;
  end if;

  select count(*) into v_used
  from public.ai_usage a
  where a.user_id = v_user
    and a.kind = 'extension'
    and a.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if v_used >= p_daily then
    return query select 'exhausted'::text, null::uuid;
    return;
  end if;

  insert into public.ai_usage (user_id, kind) values (v_user, 'extension') returning id into v_id;
  return query select 'granted'::text, v_id;
end;
$$;

-- ─── 4. append_roadmap_nodes ──────────────────────────────────────────────────
-- p_nodes: [{ title, description, metadata, requires_new: int[] (índices ANTERIORES de este mismo
-- arreglo), requires_existing: uuid[] (nodos que la ruta ya tenía) }]. El orden y el nivel los
-- pone la base; los prerrequisitos se validan (grafo acíclico por construcción).
create function public.append_roadmap_nodes(p_usage_id uuid, p_roadmap_id uuid, p_nodes jsonb, p_per_roadmap integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := (select auth.uid());
  v_max   integer;
  v_len   integer;
  v_ids   uuid[] := '{}';
  v_node  jsonb;
  v_id    uuid;
  v_req   integer;
  v_reqid uuid;
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if jsonb_typeof(p_nodes) is distinct from 'array' or jsonb_array_length(p_nodes) not between 1 and 6 then
    raise exception 'p_nodes debe tener entre 1 y 6 nodos' using errcode = '22023';
  end if;
  v_len := jsonb_array_length(p_nodes);

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  if not exists (select 1 from public.roadmaps r where r.id = p_roadmap_id and r.user_id = v_user)
     or not exists (
       select 1 from public.ai_usage a
       where a.id = p_usage_id and a.user_id = v_user and a.kind = 'extension'
         and a.created_at > now() - interval '15 minutes'
     )
     or exists (select 1 from public.roadmap_extensions e where e.usage_id = p_usage_id) then
    raise exception 'Reserva inválida' using errcode = '42501';
  end if;
  -- Segunda barrera del tope (dos reservas simultáneas de la misma ruta).
  if (select count(*) from public.roadmap_extensions e where e.roadmap_id = p_roadmap_id) >= p_per_roadmap then
    raise exception 'Tope de extensiones alcanzado' using errcode = 'WS409';
  end if;

  select coalesce(max(n.order_index), -1) into v_max from public.nodes n where n.roadmap_id = p_roadmap_id;

  for i in 0 .. v_len - 1 loop
    v_node := p_nodes -> i;
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index, metadata)
    values (p_roadmap_id, v_node ->> 'title', v_node ->> 'description', 'Avanzado', v_max + 1 + i,
            coalesce(v_node -> 'metadata', '{}'::jsonb))
    returning id into v_id;
    v_ids := v_ids || v_id;

    for v_req in select value::integer from jsonb_array_elements_text(coalesce(v_node -> 'requires_new', '[]'::jsonb)) loop
      if v_req < 0 or v_req >= i then
        raise exception 'Prerrequisito nuevo inválido' using errcode = '22023';
      end if;
      insert into public.node_edges (roadmap_id, node_id, requires_node_id)
      values (p_roadmap_id, v_id, v_ids[v_req + 1]) on conflict do nothing;
    end loop;

    for v_reqid in select value::uuid from jsonb_array_elements_text(coalesce(v_node -> 'requires_existing', '[]'::jsonb)) loop
      if not exists (select 1 from public.nodes n where n.id = v_reqid and n.roadmap_id = p_roadmap_id and n.order_index <= v_max) then
        raise exception 'Prerrequisito existente inválido' using errcode = '22023';
      end if;
      insert into public.node_edges (roadmap_id, node_id, requires_node_id)
      values (p_roadmap_id, v_id, v_reqid) on conflict do nothing;
    end loop;
  end loop;

  insert into public.roadmap_extensions (roadmap_id, user_id, usage_id, node_count)
  values (p_roadmap_id, v_user, p_usage_id, v_len);
  return v_len;
end;
$$;

-- ─── 5. Títulos fantasma (plan gratis) ────────────────────────────────────────
-- status: 'granted' (con usage_id), 'cached', 'exhausted' (tope diario) o 'not_found'.
create function public.reserve_preview(p_roadmap_id uuid, p_daily integer)
returns table (status text, usage_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if p_daily is null or p_daily < 0 then
    raise exception 'Límite inválido' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  if not exists (select 1 from public.roadmaps r where r.id = p_roadmap_id and r.user_id = v_user) then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;
  if exists (select 1 from public.roadmap_previews p where p.roadmap_id = p_roadmap_id) then
    return query select 'cached'::text, null::uuid;
    return;
  end if;
  if (select count(*) from public.ai_usage a
      where a.user_id = v_user and a.kind = 'preview'
        and a.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc') >= p_daily then
    return query select 'exhausted'::text, null::uuid;
    return;
  end if;

  insert into public.ai_usage (user_id, kind) values (v_user, 'preview') returning id into v_id;
  return query select 'granted'::text, v_id;
end;
$$;

create function public.save_roadmap_preview(p_usage_id uuid, p_roadmap_id uuid, p_titles jsonb, p_model text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if not exists (select 1 from public.roadmaps r where r.id = p_roadmap_id and r.user_id = v_user)
     or not exists (
       select 1 from public.ai_usage a
       where a.id = p_usage_id and a.user_id = v_user and a.kind = 'preview'
         and a.created_at > now() - interval '10 minutes'
     ) then
    raise exception 'Reserva inválida' using errcode = '42501';
  end if;

  insert into public.roadmap_previews (roadmap_id, user_id, usage_id, titles, model)
  values (p_roadmap_id, v_user, p_usage_id, p_titles, p_model)
  on conflict do nothing;
end;
$$;

revoke execute on function public.reserve_extension(uuid, integer, integer) from public, anon;
revoke execute on function public.append_roadmap_nodes(uuid, uuid, jsonb, integer) from public, anon;
revoke execute on function public.reserve_preview(uuid, integer) from public, anon;
revoke execute on function public.save_roadmap_preview(uuid, uuid, jsonb, text) from public, anon;
grant execute on function public.reserve_extension(uuid, integer, integer) to authenticated;
grant execute on function public.append_roadmap_nodes(uuid, uuid, jsonb, integer) to authenticated;
grant execute on function public.reserve_preview(uuid, integer) to authenticated;
grant execute on function public.save_roadmap_preview(uuid, uuid, jsonb, text) to authenticated;
