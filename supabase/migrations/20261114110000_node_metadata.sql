-- Wiseit v0.2 · Afinado de la IA: cada nodo guarda conceptos clave y práctica en `nodes.metadata`.
-- Reemplaza el RPC (misma firma, así que los privilegios se conservan) para leer `metadata`.
-- p_nodes: [{ "title", "description", "difficulty", "order_index", "metadata": { ... } }, ...]
create or replace function public.create_roadmap_with_nodes(p_topic text, p_title text, p_nodes jsonb)
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

  insert into public.nodes (roadmap_id, title, description, difficulty, order_index, metadata)
  select v_roadmap_id, n.title, n.description, n.difficulty, n.order_index, coalesce(n.metadata, '{}'::jsonb)
  from jsonb_to_recordset(p_nodes)
    as n (title text, description text, difficulty public.difficulty_level, order_index integer, metadata jsonb);

  return v_roadmap_id;
end;
$$;
