-- Verificación de la base (Pasos 2, 4 y 6, solo lectura). Ejecutar en el SQL Editor de Supabase.
-- Resultado esperado: todas las filas con ok = true.

with expected_policies(table_name, policy_name) as (
  values
    ('profiles', 'profiles_select_own'),
    ('roadmaps', 'roadmaps_select_own'),
    ('roadmaps', 'roadmaps_insert_own'),
    ('roadmaps', 'roadmaps_update_own'),
    ('roadmaps', 'roadmaps_delete_own'),
    ('nodes',    'nodes_select_own'),
    ('nodes',    'nodes_insert_own'),
    ('nodes',    'nodes_update_own'),
    ('nodes',    'nodes_delete_own'),
    ('ai_usage', 'ai_usage_select_own'),
    ('ai_usage', 'ai_usage_insert_own'),
    ('node_edges', 'node_edges_select_own'),
    ('node_edges', 'node_edges_insert_own'),
    ('node_edges', 'node_edges_delete_own')
)
select 'RLS habilitado: ' || c.relname as check_name, c.relrowsecurity as ok
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles', 'roadmaps', 'nodes', 'ai_usage', 'node_edges')

union all
select 'Política: ' || e.policy_name,
       exists (
         select 1 from pg_policies p
         where p.schemaname = 'public' and p.tablename = e.table_name and p.policyname = e.policy_name
       )
from expected_policies e

union all
select 'Trigger on_auth_user_created',
       exists (
         select 1 from pg_trigger t
         join pg_class c on c.oid = t.tgrelid
         join pg_namespace n on n.oid = c.relnamespace
         where t.tgname = 'on_auth_user_created' and n.nspname = 'auth'
           and c.relname = 'users' and t.tgenabled <> 'D'
       )

union all
select 'handle_new_user es SECURITY DEFINER con search_path fijo',
       exists (
         select 1 from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'handle_new_user'
           and p.prosecdef and p.proconfig @> array['search_path=""']
       )

union all
select 'anon sin privilegios en ' || t.table_name,
       not exists (
         select 1 from information_schema.role_table_grants g
         where g.grantee = 'anon' and g.table_schema = 'public' and g.table_name = t.table_name
       )
from (values ('profiles'), ('roadmaps'), ('nodes'), ('ai_usage'), ('node_edges')) as t(table_name)

union all
select 'ai_usage sin update/delete para usuarios (la cuota no se reinicia)',
       not exists (
         select 1 from pg_policies p
         where p.schemaname = 'public' and p.tablename = 'ai_usage' and p.cmd in ('UPDATE', 'DELETE')
       )

union all
select 'Función SECURITY INVOKER con search_path fijo: ' || f.fname,
       exists (
         select 1 from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = f.fname
           and not p.prosecdef and p.proconfig @> array['search_path=""']
       )
from (values ('reserve_generation'), ('create_roadmap_with_nodes'), ('update_node_progress')) as f(fname)

union all
select 'node_edges sin update para usuarios (aristas inmutables)',
       not exists (
         select 1 from pg_policies p
         where p.schemaname = 'public' and p.tablename = 'node_edges' and p.cmd = 'UPDATE'
       )

union all
select 'create_roadmap_with_nodes v1 (3 argumentos) eliminado',
       to_regprocedure('public.create_roadmap_with_nodes(text, text, jsonb)') is null

union all
select 'EXECUTE solo para authenticated: ' || f.fname,
       has_function_privilege('authenticated', f.sig, 'execute')
       and not has_function_privilege('anon', f.sig, 'execute')
from (values
  ('reserve_generation', 'public.reserve_generation(integer)'),
  ('create_roadmap_with_nodes', 'public.create_roadmap_with_nodes(text, text, text, jsonb)'),
  ('update_node_progress', 'public.update_node_progress(uuid, smallint[], boolean)')
) as f(fname, sig);
