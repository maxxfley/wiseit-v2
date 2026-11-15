-- Wiseit v0.2 · Paso 6: roadmap visual e interactivo.
-- 1) roadmaps.theme: preset visual elegido por la IA.
-- 2) nodes: progreso (conceptos tildados, inicio y fin).
-- 3) node_edges: grafo de prerrequisitos (un nodo puede requerir varios).
-- 4) create_roadmap_with_nodes v2: guarda roadmap + nodos + aristas en una transacción.
-- 5) update_node_progress: actualiza el progreso validando en la base que el nodo no esté bloqueado.

-- ─── 1. roadmaps.theme ───────────────────────────────────────────────────────
-- Solo formato: la lista de presets vive en la app (config/roadmap-visuals.ts) y un valor
-- desconocido se renderiza con el estilo neutro. Así sumar presets no exige migración.
alter table public.roadmaps
  add column theme text not null default 'default'
  constraint roadmaps_theme_format check (theme ~ '^[a-z]{1,24}$');

-- ─── 2. Progreso en nodes ────────────────────────────────────────────────────
-- El estado (bloqueado / disponible / en proceso / completado) NO se guarda: se deriva de
-- estas columnas y de las aristas, así nunca queda inconsistente.
alter table public.nodes
  add column completed_concepts smallint[] not null default '{}',
  add column started_at timestamptz,
  add column completed_at timestamptz,
  add constraint nodes_completed_concepts_size check (cardinality(completed_concepts) <= 10),
  add constraint nodes_completed_after_start check (completed_at is null or started_at is not null);

-- ─── 3. node_edges ───────────────────────────────────────────────────────────
-- "node_id requiere requires_node_id". Las FK compuestas obligan a que ambos nodos
-- pertenezcan al mismo roadmap; al borrar un nodo o el roadmap, las aristas caen en cascada.
create table public.node_edges (
  roadmap_id       uuid not null,
  node_id          uuid not null,
  requires_node_id uuid not null,
  created_at       timestamptz not null default now(),
  primary key (node_id, requires_node_id),
  constraint node_edges_node_fkey
    foreign key (roadmap_id, node_id) references public.nodes (roadmap_id, id) on delete cascade,
  constraint node_edges_requires_fkey
    foreign key (roadmap_id, requires_node_id) references public.nodes (roadmap_id, id) on delete cascade,
  constraint node_edges_not_self check (node_id <> requires_node_id)
);

create index node_edges_roadmap_id_idx on public.node_edges (roadmap_id);
create index node_edges_requires_node_id_idx on public.node_edges (requires_node_id);

alter table public.node_edges enable row level security;
revoke all on public.node_edges from anon;

-- Sin política de UPDATE: las aristas son inmutables (se crean con la ruta y caen con ella).
create policy node_edges_select_own on public.node_edges
  for select to authenticated using (public.owns_roadmap(roadmap_id));
create policy node_edges_insert_own on public.node_edges
  for insert to authenticated with check (public.owns_roadmap(roadmap_id));
create policy node_edges_delete_own on public.node_edges
  for delete to authenticated using (public.owns_roadmap(roadmap_id));

-- ─── 4. create_roadmap_with_nodes v2 ─────────────────────────────────────────
-- p_nodes: [{ "title", "description", "difficulty", "order_index", "metadata": {...},
--             "requires": [order_index, ...] }, ...]
-- La app garantiza un grafo acíclico; aquí se valida que cada prerrequisito exista.
drop function public.create_roadmap_with_nodes(text, text, jsonb);

create function public.create_roadmap_with_nodes(p_topic text, p_title text, p_theme text, p_nodes jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_roadmap_id uuid;
  v_expected   integer;
  v_inserted   integer;
begin
  if jsonb_typeof(p_nodes) is distinct from 'array' or jsonb_array_length(p_nodes) = 0 then
    raise exception 'p_nodes debe ser un arreglo no vacío' using errcode = '22023';
  end if;

  insert into public.roadmaps (user_id, topic, title, theme)
  values ((select auth.uid()), p_topic, p_title, coalesce(p_theme, 'default'))
  returning id into v_roadmap_id;

  insert into public.nodes (roadmap_id, title, description, difficulty, order_index, metadata)
  select v_roadmap_id, n.title, n.description, n.difficulty, n.order_index, coalesce(n.metadata, '{}'::jsonb)
  from jsonb_to_recordset(p_nodes)
    as n (title text, description text, difficulty public.difficulty_level, order_index integer, metadata jsonb);

  select count(*) into v_expected
  from jsonb_to_recordset(p_nodes) as n (requires integer[])
  cross join lateral unnest(coalesce(n.requires, '{}'::integer[])) as r (req);

  insert into public.node_edges (roadmap_id, node_id, requires_node_id)
  select v_roadmap_id, child.id, parent.id
  from jsonb_to_recordset(p_nodes) as n (order_index integer, requires integer[])
  cross join lateral unnest(coalesce(n.requires, '{}'::integer[])) as r (req)
  join public.nodes child on child.roadmap_id = v_roadmap_id and child.order_index = n.order_index
  join public.nodes parent on parent.roadmap_id = v_roadmap_id and parent.order_index = r.req;

  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then
    raise exception 'p_nodes contiene prerrequisitos inexistentes' using errcode = '22023';
  end if;

  return v_roadmap_id;
end;
$$;

-- ─── 5. update_node_progress ─────────────────────────────────────────────────
-- p_completed_concepts: conjunto COMPLETO de índices de key_concepts tildados.
-- p_mark_complete: marca todos los conceptos y completa el nodo.
-- Errores: WS404 (no existe o es ajeno, por RLS) · WS423 (bloqueado) · 22023 (índices inválidos).
create function public.update_node_progress(
  p_node_id uuid,
  p_completed_concepts smallint[],
  p_mark_complete boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total    integer;
  v_concepts smallint[];
begin
  -- RLS limita la búsqueda a nodos propios; FOR UPDATE serializa clics simultáneos.
  select case when jsonb_typeof(n.metadata -> 'key_concepts') = 'array'
              then jsonb_array_length(n.metadata -> 'key_concepts') else 0 end
    into v_total
  from public.nodes n
  where n.id = p_node_id
  for update;

  if not found then
    raise exception 'node_not_found' using errcode = 'WS404';
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

-- Solo usuarios autenticados pueden ejecutarlas (por defecto Postgres da EXECUTE a PUBLIC).
revoke execute on function public.create_roadmap_with_nodes(text, text, text, jsonb) from public, anon;
revoke execute on function public.update_node_progress(uuid, smallint[], boolean) from public, anon;
grant execute on function public.create_roadmap_with_nodes(text, text, text, jsonb) to authenticated;
grant execute on function public.update_node_progress(uuid, smallint[], boolean) to authenticated;
