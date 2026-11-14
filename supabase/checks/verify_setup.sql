-- Verificación del Paso 2 (solo lectura). Ejecutar en el SQL Editor de Supabase.
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
    ('nodes',    'nodes_delete_own')
)
select 'RLS habilitado: ' || c.relname as check_name, c.relrowsecurity as ok
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles', 'roadmaps', 'nodes')

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
from (values ('profiles'), ('roadmaps'), ('nodes')) as t(table_name);
