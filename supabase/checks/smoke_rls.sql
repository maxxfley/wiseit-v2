-- Smoke test: trigger de profiles, aislamiento RLS, cuota, RPC de creación y grafo + progreso (Paso 6).
-- Todo ocurre dentro de una transacción que termina en ROLLBACK: no deja datos.
-- Si algo falla, aborta con 'FALLO: ...'. Si todo pasa, devuelve 'OK'.

begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'smoke-a@wiseit.test'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'smoke-b@wiseit.test');

do $$
declare
  user_a constant uuid := '11111111-1111-4111-8111-111111111111';
  user_b constant uuid := '22222222-2222-4222-8222-222222222222';
  rid uuid;
  n int;
begin
  -- 1. El trigger creó ambos perfiles.
  select count(*) into n from public.profiles where id in (user_a, user_b);
  if n <> 2 then raise exception 'FALLO trigger: % perfiles creados (esperado 2)', n; end if;

  -- 2. Actuando como A: crea su roadmap y un nodo.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.roadmaps (user_id, topic, title) values (user_a, 'SQL', 'Ruta A') returning id into rid;
  insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
  values (rid, 'Nodo 1', 'Descripción', 'Básico', 0);

  -- 3. A no puede crear un roadmap a nombre de B.
  begin
    insert into public.roadmaps (user_id, topic, title) values (user_b, 'x', 'x');
    raise exception 'FALLO: A pudo insertar un roadmap a nombre de B';
  exception when insufficient_privilege then
    raise notice 'ok: insert a nombre de otro usuario bloqueado';
  end;

  -- 4. Actuando como B: no ve ni modifica nada de A.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.roadmaps;
  if n <> 0 then raise exception 'FALLO: B ve % roadmaps ajenos', n; end if;
  select count(*) into n from public.nodes;
  if n <> 0 then raise exception 'FALLO: B ve % nodos ajenos', n; end if;
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'FALLO: B ve % perfiles (esperado 1, el propio)', n; end if;

  update public.roadmaps set title = 'hack' where id = rid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B modificó el roadmap de A'; end if;

  delete from public.nodes where roadmap_id = rid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B borró nodos de A'; end if;

  begin
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
    values (rid, 'Intruso', 'x', 'Básico', 1);
    raise exception 'FALLO: B insertó un nodo en el roadmap de A';
  exception when insufficient_privilege then
    raise notice 'ok: insert de nodo en roadmap ajeno bloqueado';
  end;

  -- 5. A sigue viendo exactamente lo suyo.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.nodes where roadmap_id = rid;
  if n <> 1 then raise exception 'FALLO: A ve % nodos propios (esperado 1)', n; end if;

  -- 6. Cuota: con límite 2, A reserva 2 veces y la tercera se rechaza; B no se ve afectado.
  if not public.reserve_generation(2) then raise exception 'FALLO: 1ª reserva rechazada'; end if;
  if not public.reserve_generation(2) then raise exception 'FALLO: 2ª reserva rechazada'; end if;
  if public.reserve_generation(2) then raise exception 'FALLO: A superó el límite diario'; end if;
  begin
    delete from public.ai_usage;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FALLO: A pudo borrar su uso y reiniciar la cuota'; end if;
  exception when insufficient_privilege then
    raise notice 'ok: borrar ai_usage bloqueado';
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  if not public.reserve_generation(2) then raise exception 'FALLO: la cuota de A afectó a B'; end if;
  select count(*) into n from public.ai_usage;
  if n <> 1 then raise exception 'FALLO: B ve % filas de ai_usage (esperado 1)', n; end if;

  -- 7. RPC atómico: guarda roadmap + nodos; con nodos inválidos no deja nada a medias.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  rid := public.create_roadmap_with_nodes('Rust', 'Ruta Rust', null,
    '[{"title":"a","description":"d","difficulty":"Básico","order_index":0,
       "metadata":{"key_concepts":["x","y","z"],"practice":"hacé algo"}},
      {"title":"b","description":"d","difficulty":"Avanzado","order_index":1}]'::jsonb);
  select count(*) into n from public.nodes where roadmap_id = rid;
  if n <> 2 then raise exception 'FALLO RPC: % nodos (esperado 2)', n; end if;
  select count(*) into n from public.nodes
    where roadmap_id = rid and order_index = 0 and metadata->>'practice' = 'hacé algo'
      and jsonb_array_length(metadata->'key_concepts') = 3;
  if n <> 1 then raise exception 'FALLO RPC: la metadata del nodo no se guardó'; end if;
  select count(*) into n from public.nodes where roadmap_id = rid and order_index = 1 and metadata = '{}'::jsonb;
  if n <> 1 then raise exception 'FALLO RPC: un nodo sin metadata debe quedar en {}'; end if;

  begin
    perform public.create_roadmap_with_nodes('Go', 'Ruta Go', 'default',
      '[{"title":"a","description":"d","difficulty":"Básico","order_index":0},
        {"title":"b","description":"d","difficulty":"Inexistente","order_index":1}]'::jsonb);
    raise exception 'FALLO: el RPC aceptó una dificultad inválida';
  exception when invalid_text_representation then
    raise notice 'ok: dificultad inválida rechazada';
  end;
  select count(*) into n from public.roadmaps where topic = 'Go';
  if n <> 0 then raise exception 'FALLO RPC: quedó un roadmap huérfano'; end if;

  -- 8. Grafo: n2 requiere n0 y n1 (convergencia), n1 requiere n0. Tema guardado.
  rid := public.create_roadmap_with_nodes('Grafos', 'Ruta Grafos', 'cosmos',
    '[{"title":"n0","description":"d","difficulty":"Básico","order_index":0,"requires":[],
       "metadata":{"key_concepts":["a","b"],"practice":"p"}},
      {"title":"n1","description":"d","difficulty":"Básico","order_index":1,"requires":[0],
       "metadata":{"key_concepts":["a","b","c"],"practice":"p"}},
      {"title":"n2","description":"d","difficulty":"Intermedio","order_index":2,"requires":[0,1]}]'::jsonb);
  select count(*) into n from public.node_edges where roadmap_id = rid;
  if n <> 3 then raise exception 'FALLO grafo: % aristas (esperado 3)', n; end if;
  select count(*) into n from public.roadmaps where id = rid and theme = 'cosmos';
  if n <> 1 then raise exception 'FALLO grafo: el tema no se guardó'; end if;

  -- 9. Prerrequisito inexistente o auto-referencia: se rechaza sin dejar nada a medias.
  begin
    perform public.create_roadmap_with_nodes('Roto', 'Ruta Rota', null,
      '[{"title":"a","description":"d","difficulty":"Básico","order_index":0,"requires":[7]}]'::jsonb);
    raise exception 'FALLO: el RPC aceptó un prerrequisito inexistente';
  exception when invalid_parameter_value then
    raise notice 'ok: prerrequisito inexistente rechazado';
  end;
  begin
    perform public.create_roadmap_with_nodes('Roto', 'Ruta Rota', null,
      '[{"title":"a","description":"d","difficulty":"Básico","order_index":0,"requires":[0]}]'::jsonb);
    raise exception 'FALLO: el RPC aceptó una auto-referencia';
  exception when check_violation then
    raise notice 'ok: auto-referencia rechazada';
  end;
  select count(*) into n from public.roadmaps where topic = 'Roto';
  if n <> 0 then raise exception 'FALLO grafo: quedó un roadmap huérfano'; end if;

  -- 10. Progreso: n1 está bloqueado hasta completar n0.
  declare
    n0 uuid; n1 uuid; n2 uuid;
  begin
    select id into n0 from public.nodes where roadmap_id = rid and order_index = 0;
    select id into n1 from public.nodes where roadmap_id = rid and order_index = 1;
    select id into n2 from public.nodes where roadmap_id = rid and order_index = 2;

    begin
      perform public.update_node_progress(n1, '{0}', false);
      raise exception 'FALLO: se pudo avanzar un nodo bloqueado';
    exception when sqlstate 'WS423' then
      raise notice 'ok: nodo bloqueado rechazado';
    end;

    perform public.update_node_progress(n0, '{0}', false);
    select count(*) into n from public.nodes
      where id = n0 and started_at is not null and completed_at is null and completed_concepts = '{0}';
    if n <> 1 then raise exception 'FALLO progreso: n0 debería estar en proceso'; end if;

    begin
      perform public.update_node_progress(n0, '{0,5}', false);
      raise exception 'FALLO: se aceptó un índice de concepto inválido';
    exception when invalid_parameter_value then
      raise notice 'ok: índice inválido rechazado';
    end;

    -- Tildar todos los conceptos completa el nodo (con duplicados y desorden normalizados).
    perform public.update_node_progress(n0, '{1,0,1}', false);
    select count(*) into n from public.nodes where id = n0 and completed_at is not null and completed_concepts = '{0,1}';
    if n <> 1 then raise exception 'FALLO progreso: n0 debería estar completado'; end if;

    -- n1 se desbloquea; n2 sigue bloqueado (le falta n1).
    perform public.update_node_progress(n1, '{}', true);
    select count(*) into n from public.nodes where id = n1 and completed_at is not null and completed_concepts = '{0,1,2}';
    if n <> 1 then raise exception 'FALLO progreso: marcar completo debe tildar todos los conceptos'; end if;

    -- Destildar un concepto reabre el nodo.
    perform public.update_node_progress(n1, '{0,1}', false);
    select count(*) into n from public.nodes where id = n1 and completed_at is null;
    if n <> 1 then raise exception 'FALLO progreso: destildar debe reabrir el nodo'; end if;
    begin
      perform public.update_node_progress(n2, '{}', true);
      raise exception 'FALLO: n2 avanzó con un prerrequisito abierto';
    exception when sqlstate 'WS423' then
      raise notice 'ok: convergencia bloquea hasta completar todos los requisitos';
    end;

    -- 11. B no ve las aristas de A, no puede insertar en su roadmap ni tocar su progreso.
    perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
    select count(*) into n from public.node_edges;
    if n <> 0 then raise exception 'FALLO: B ve % aristas ajenas', n; end if;
    begin
      insert into public.node_edges (roadmap_id, node_id, requires_node_id) values (rid, n1, n2);
      raise exception 'FALLO: B insertó una arista en el roadmap de A';
    exception when insufficient_privilege then
      raise notice 'ok: arista en roadmap ajeno bloqueada';
    end;
    begin
      perform public.update_node_progress(n0, '{}', false);
      raise exception 'FALLO: B modificó el progreso de A';
    exception when sqlstate 'WS404' then
      raise notice 'ok: progreso ajeno inaccesible';
    end;

    -- 12. Borrar el roadmap arrastra nodos y aristas.
    perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
    delete from public.roadmaps where id = rid;
    select count(*) into n from public.node_edges where roadmap_id = rid;
    if n <> 0 then raise exception 'FALLO: quedaron % aristas tras borrar el roadmap', n; end if;
  end;

  execute 'reset role';
end;
$$;

select 'OK: trigger + RLS + cuota + RPC + grafo + progreso verificados' as resultado;

rollback;
