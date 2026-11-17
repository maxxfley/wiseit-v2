-- Paso 8 · i18n: idioma del contenido generado por la IA.
-- 1) roadmaps.language: en qué idioma se escribió la ruta (las previas quedan en 'es').
-- 2) create_roadmap_with_nodes v3: recibe el idioma como último parámetro, con 'es' por defecto,
--    así las llamadas de 4 argumentos siguen funcionando.

-- ─── 1. roadmaps.language ─────────────────────────────────────────────────────
-- Solo formato (dos letras minúsculas), igual que `theme`: la lista de idiomas vive en la app
-- (src/lib/i18n/config.ts) y sumar uno no exige migración.
alter table public.roadmaps
  add column language text not null default 'es'
  constraint roadmaps_language_format check (language ~ '^[a-z]{2}$');

-- ─── 2. create_roadmap_with_nodes v3 ─────────────────────────────────────────
-- Mismo cuerpo que la v2 (20261115000000_roadmap_graph.sql) más la columna language.
drop function public.create_roadmap_with_nodes(text, text, text, jsonb);

create function public.create_roadmap_with_nodes(
  p_topic text,
  p_title text,
  p_theme text,
  p_nodes jsonb,
  p_language text default 'es'
)
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

  insert into public.roadmaps (user_id, topic, title, theme, language)
  values ((select auth.uid()), p_topic, p_title, coalesce(p_theme, 'default'), coalesce(p_language, 'es'))
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

-- Solo usuarios autenticados pueden ejecutarla (por defecto Postgres da EXECUTE a PUBLIC).
revoke execute on function public.create_roadmap_with_nodes(text, text, text, jsonb, text) from public, anon;
grant execute on function public.create_roadmap_with_nodes(text, text, text, jsonb, text) to authenticated;
