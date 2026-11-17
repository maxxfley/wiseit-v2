-- Verificación de la base (Pasos 2, 4, 6, 8 y 7a, solo lectura). Ejecutar en el SQL Editor de Supabase.
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
    ('nodes',    'nodes_delete_own'),
    ('ai_usage', 'ai_usage_select_own'),
    ('ai_usage', 'ai_usage_insert_own'),
    ('node_edges', 'node_edges_select_own'),
    ('node_edges', 'node_edges_insert_own'),
    ('subscriptions', 'subscriptions_select_own')
)
select 'RLS habilitado: ' || c.relname as check_name, c.relrowsecurity as ok
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'roadmaps', 'nodes', 'ai_usage', 'node_edges', 'subscriptions', 'paddle_webhook_events')

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
from (values ('profiles'), ('roadmaps'), ('nodes'), ('ai_usage'), ('node_edges'), ('subscriptions'), ('paddle_webhook_events')) as t(table_name)

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
from (values ('reserve_generation'), ('create_roadmap_with_nodes'), ('reserve_ai_usage'), ('is_premium'), ('enforce_roadmap_limit')) as f(fname)

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
select 'create_roadmap_with_nodes v2 (4 argumentos) eliminado',
       to_regprocedure('public.create_roadmap_with_nodes(text, text, text, jsonb)') is null

union all
select 'roadmaps.language existe con check de formato',
       exists (
         select 1 from pg_constraint c
         where c.conrelid = 'public.roadmaps'::regclass and c.conname = 'roadmaps_language_format'
       )

union all
select 'EXECUTE solo para authenticated: ' || f.fname,
       has_function_privilege('authenticated', f.sig, 'execute')
       and not has_function_privilege('anon', f.sig, 'execute')
from (values
  ('reserve_generation', 'public.reserve_generation(integer)'),
  ('create_roadmap_with_nodes', 'public.create_roadmap_with_nodes(text, text, text, jsonb, text)'),
  ('update_node_progress', 'public.update_node_progress(uuid, smallint[], boolean)'),
  ('is_premium', 'public.is_premium()'),
  ('reserve_ai_usage', 'public.reserve_ai_usage(text, integer, integer)'),
  ('record_ai_usage_tokens', 'public.record_ai_usage_tokens(uuid, text, integer, integer)')
) as f(fname, sig)

-- ─── Paso 7a · planes ─────────────────────────────────────────────────────────
union all
select 'Función SECURITY DEFINER con search_path fijo: ' || f.fname,
       exists (
         select 1 from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = f.fname
           and p.prosecdef and p.proconfig @> array['search_path=""']
       )
from (values ('update_node_progress'), ('record_ai_usage_tokens')) as f(fname)

union all
select 'authenticated sin UPDATE en nodes (el progreso solo pasa por el RPC)',
       not has_table_privilege('authenticated', 'public.nodes', 'update')

union all
select 'authenticated sin DELETE en node_edges (no puede quitar prerrequisitos)',
       not has_table_privilege('authenticated', 'public.node_edges', 'delete')

union all
select 'subscriptions: authenticated solo lee (sin insert/update/delete)',
       has_table_privilege('authenticated', 'public.subscriptions', 'select')
       and not has_table_privilege('authenticated', 'public.subscriptions', 'insert')
       and not has_table_privilege('authenticated', 'public.subscriptions', 'update')
       and not has_table_privilege('authenticated', 'public.subscriptions', 'delete')

union all
select 'paddle_webhook_events sin acceso para authenticated',
       not has_table_privilege('authenticated', 'public.paddle_webhook_events', 'select')
       and not has_table_privilege('authenticated', 'public.paddle_webhook_events', 'insert')

union all
select 'Trigger roadmaps_enforce_limit activo',
       exists (
         select 1 from pg_trigger t
         where t.tgrelid = 'public.roadmaps'::regclass and t.tgname = 'roadmaps_enforce_limit' and t.tgenabled <> 'D'
       )

union all
select 'enforce_roadmap_limit no ejecutable directamente por authenticated',
       not has_function_privilege('authenticated', 'public.enforce_roadmap_limit()', 'execute')

union all
select 'ai_usage.kind con check de valores',
       exists (
         select 1 from pg_constraint c
         where c.conrelid = 'public.ai_usage'::regclass and c.conname = 'ai_usage_kind_check'
       );
