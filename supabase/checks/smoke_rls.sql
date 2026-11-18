-- Smoke test: trigger de profiles, aislamiento RLS, cuota, RPC de creación, grafo + progreso (Paso 6)
-- y planes (Paso 7a: Premium, cuotas por tipo, límite de rutas, bloqueo de progreso, past_due;
-- Paso 7b: eventos del webhook de Paddle; Paso 7c: búsqueda de material).
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
  rid_lang uuid; -- ruta del caso de idioma: no pisa `rid`, que usan los pasos de progreso
  n int;
begin
  -- 1. El trigger creó ambos perfiles.
  select count(*) into n from public.profiles where id in (user_a, user_b);
  if n <> 2 then raise exception 'FALLO trigger: % perfiles creados (esperado 2)', n; end if;

  -- 1b. (Paso 7a) A es Premium; B es gratis. Lo escribe el "webhook" (rol con privilegios).
  insert into public.subscriptions (user_id, status, billing_interval, current_period_end, last_event_at)
  values (user_a, 'active', 'month', now() + interval '30 days', now());

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
  select count(*) into n from public.roadmaps where id = rid and theme = 'cosmos' and language = 'es';
  if n <> 1 then raise exception 'FALLO grafo: el tema o el idioma por defecto no se guardó'; end if;

  -- 8b. Idioma explícito (Paso 8): la ruta queda marcada con el idioma pedido.
  rid_lang := public.create_roadmap_with_nodes('Ruso', 'Ruta Ruso', null,
    '[{"title":"n0","description":"d","difficulty":"Básico","order_index":0,"requires":[]}]'::jsonb, 'ru');
  select count(*) into n from public.roadmaps where id = rid_lang and language = 'ru';
  if n <> 1 then raise exception 'FALLO idioma: no se guardó language = ru'; end if;

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

    -- 11b. (Paso 7a) Nadie escribe progreso ni quita prerrequisitos por fuera del RPC.
    perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
    begin
      update public.nodes set completed_at = now() where id = n2;
      raise exception 'FALLO: A actualizó un nodo directamente (saltando el RPC)';
    exception when insufficient_privilege then
      raise notice 'ok: update directo de nodos bloqueado';
    end;
    begin
      delete from public.node_edges where node_id = n2;
      raise exception 'FALLO: A borró un prerrequisito directamente';
    exception when insufficient_privilege then
      raise notice 'ok: borrar aristas directamente bloqueado';
    end;

    -- 12. Borrar el roadmap arrastra nodos y aristas.
    delete from public.roadmaps where id = rid;
    select count(*) into n from public.node_edges where roadmap_id = rid;
    if n <> 0 then raise exception 'FALLO: quedaron % aristas tras borrar el roadmap', n; end if;
  end;

  -- 13. (Paso 7a) Planes. A es Premium y B gratis.
  declare
    u1 uuid; u2 uuid; b_node uuid;
  begin
    if not public.is_premium() then raise exception 'FALLO planes: A debería ser Premium'; end if;
    begin
      update public.subscriptions set status = 'active' where user_id = user_a;
      raise exception 'FALLO: A modificó su suscripción';
    exception when insufficient_privilege then
      raise notice 'ok: el usuario no puede escribir su suscripción';
    end;

    -- Cuota por tipo y plan: A (Premium, límite 2) reserva 2 veces; la tercera no.
    u1 := public.reserve_ai_usage('material', 0, 2);
    u2 := public.reserve_ai_usage('material', 0, 2);
    if u1 is null or u2 is null then raise exception 'FALLO cuota: reserva Premium rechazada'; end if;
    if public.reserve_ai_usage('material', 0, 2) is not null then raise exception 'FALLO cuota: A superó el límite'; end if;
    -- Los tokens se registran una sola vez.
    perform public.record_ai_usage_tokens(u1, 'openai/gpt-oss-120b', 1000, 500);
    perform public.record_ai_usage_tokens(u1, 'otro', 1, 1);
    select count(*) into n from public.ai_usage where id = u1 and model = 'openai/gpt-oss-120b' and input_tokens = 1000;
    if n <> 1 then raise exception 'FALLO tokens: no se registraron o se pisaron'; end if;

    -- B (gratis): límite 0 = función no disponible; no puede tocar los tokens de A.
    perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
    if public.is_premium() then raise exception 'FALLO planes: B no debería ser Premium'; end if;
    if public.reserve_ai_usage('material', 0, 15) is not null then raise exception 'FALLO cuota: B gratis reservó material'; end if;
    perform public.record_ai_usage_tokens(u2, 'hack', 9, 9);

    -- B gratis: máximo 4 rutas guardadas; la quinta se rechaza.
    for i in 1..4 loop
      insert into public.roadmaps (user_id, topic, title) values (user_b, 'B' || i, 'Ruta B') returning id into rid;
    end loop;
    begin
      insert into public.roadmaps (user_id, topic, title) values (user_b, 'B5', 'Ruta B');
      raise exception 'FALLO: B gratis creó una quinta ruta';
    exception when sqlstate 'WS409' then
      raise notice 'ok: límite de rutas del plan gratis';
    end;

    -- B gratis: guarda progreso en el primer tema; en los demás es Premium.
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index, metadata)
    values (rid, 'b0', 'd', 'Básico', 0, '{"key_concepts":["x"]}') returning id into b_node;
    perform public.update_node_progress(b_node, '{0}', false);
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index, metadata)
    values (rid, 'b1', 'd', 'Básico', 1, '{"key_concepts":["x"]}') returning id into b_node;
    begin
      perform public.update_node_progress(b_node, '{0}', false);
      raise exception 'FALLO: B gratis guardó progreso';
    exception when sqlstate 'WS402' then
      raise notice 'ok: progreso bloqueado en el plan gratis';
    end;

    -- Cobro fallido: Premium durante 10 días; después, no.
    execute 'reset role';
    select count(*) into n from public.ai_usage where id = u2 and model is null;
    if n <> 1 then raise exception 'FALLO tokens: B escribió tokens de una reserva de A'; end if;
    update public.subscriptions set status = 'past_due', past_due_since = now() - interval '2 days' where user_id = user_a;
    perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    if not public.is_premium() then raise exception 'FALLO planes: past_due de 2 días debería seguir Premium'; end if;
    execute 'reset role';
    update public.subscriptions set past_due_since = now() - interval '11 days' where user_id = user_a;
    execute 'set local role authenticated';
    if public.is_premium() then raise exception 'FALLO planes: past_due de 11 días no debería ser Premium'; end if;
  end;

  execute 'reset role';

  -- 14. (Paso 7b) Webhook: apply_subscription_event (corre como el rol con privilegios, como el
  -- service role). Aplica, descarta duplicados y eventos viejos, y no acepta usuarios inexistentes.
  declare
    r text;
    t0 timestamptz := now();
  begin
    r := public.apply_subscription_event('evt_1', 'subscription.created', t0, user_b, 'ctm_1', 'sub_1',
                                         'active', 'month', t0 + interval '30 days', false);
    if r <> 'applied' then raise exception 'FALLO webhook: primer evento = %', r; end if;
    r := public.apply_subscription_event('evt_1', 'subscription.created', t0, user_b, 'ctm_1', 'sub_1',
                                         'active', 'month', t0 + interval '30 days', false);
    if r <> 'duplicate' then raise exception 'FALLO webhook: duplicado = %', r; end if;
    r := public.apply_subscription_event('evt_2', 'subscription.past_due', t0 + interval '1 hour', user_b, 'ctm_1', 'sub_1',
                                         'past_due', 'month', t0 + interval '30 days', false);
    if r <> 'applied' then raise exception 'FALLO webhook: past_due = %', r; end if;
    r := public.apply_subscription_event('evt_3', 'subscription.updated', t0 - interval '1 hour', user_b, 'ctm_1', 'sub_1',
                                         'active', 'month', t0 + interval '30 days', false);
    if r <> 'stale' then raise exception 'FALLO webhook: evento viejo = %', r; end if;
    r := public.apply_subscription_event('evt_4', 'subscription.created', t0, gen_random_uuid(), 'ctm_x', 'sub_x',
                                         'active', 'month', null, false);
    if r <> 'unknown_user' then raise exception 'FALLO webhook: usuario inexistente = %', r; end if;

    -- El segundo aviso de cobro fallido NO reinicia los 10 días de gracia.
    r := public.apply_subscription_event('evt_5', 'subscription.past_due', t0 + interval '2 days', user_b, 'ctm_1', 'sub_1',
                                         'past_due', 'month', t0 + interval '30 days', false);
    select count(*) into n from public.subscriptions
    where user_id = user_b and status = 'past_due' and past_due_since = t0 + interval '1 hour';
    if n <> 1 then raise exception 'FALLO webhook: past_due_since se reinició'; end if;

    -- Un usuario no puede llamarlo.
    perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    begin
      perform public.apply_subscription_event('evt_6', 'subscription.created', now(), user_b, 'c', 's',
                                              'active', 'year', now() + interval '1 year', false);
      raise exception 'FALLO: un usuario se aplicó un evento de suscripción';
    exception when insufficient_privilege then
      raise notice 'ok: apply_subscription_event solo para el service role';
    end;
    execute 'reset role';
  end;

  -- 15. (Paso 7c) Buscar material: caché, cupo gratis (1 por ruta, N por cuenta, borrar no
  -- devuelve), cuota Premium, nodos ajenos y escritura directa bloqueada.
  declare
    r1 uuid; r2 uuid; r3 uuid; n1 uuid; n2 uuid; m1 uuid; m3 uuid; pa1 uuid; pa2 uuid;
    st text; u uuid; used int;
  begin
    -- Estado conocido: B gratis y sin rutas; A Premium.
    delete from public.subscriptions where user_id = user_b;
    delete from public.roadmaps where user_id = user_b;
    update public.subscriptions set status = 'active', past_due_since = null,
      current_period_end = now() + interval '30 days' where user_id = user_a;

    perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into public.roadmaps (user_id, topic, title) values (user_b, 'Material', 'M1') returning id into r1;
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
    values (r1, 'n1', 'd', 'Básico', 0) returning id into n1;
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
    values (r1, 'n2', 'd', 'Básico', 1) returning id into n2;
    insert into public.roadmaps (user_id, topic, title) values (user_b, 'Material', 'M2') returning id into r2;
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
    values (r2, 'm1', 'd', 'Básico', 0) returning id into m1;

    select s.status, s.usage_id into st, u from public.reserve_material_search(n1, 15, 2) s;
    if st <> 'granted' or u is null then raise exception 'FALLO material: gratis primer link = %', st; end if;
    select s.status into st from public.reserve_material_search(n2, 15, 2) s;
    if st <> 'roadmap_used' then raise exception 'FALLO material: segundo nodo de la misma ruta = %', st; end if;

    perform public.save_node_materials(u, n1, '[{"url":"https://example.com"}]', 'm');
    perform public.save_node_materials(u, n1, '[{"url":"https://example.org"}]', 'm'); -- repetido: no hace nada
    select s.status into st from public.reserve_material_search(n1, 15, 2) s;
    if st <> 'cached' then raise exception 'FALLO material: nodo con caché = %', st; end if;
    select count(*) into n from public.node_materials where node_id = n1 and items->0->>'url' = 'https://example.com';
    if n <> 1 then raise exception 'FALLO material: caché no guardada o pisada'; end if;

    -- Cupo por cuenta: con tope 1 ya está usado; borrar la ruta no lo devuelve.
    select s.status into st from public.reserve_material_search(m1, 15, 1) s;
    if st <> 'account_used' then raise exception 'FALLO material: tope por cuenta = %', st; end if;
    delete from public.roadmaps where id = r1;
    select s.status into st from public.reserve_material_search(m1, 15, 1) s;
    if st <> 'account_used' then raise exception 'FALLO material: borrar la ruta devolvió el link (%)', st; end if;
    select s.status into st from public.reserve_material_search(m1, 15, 2) s;
    if st <> 'granted' then raise exception 'FALLO material: segundo link de la cuenta = %', st; end if;
    insert into public.roadmaps (user_id, topic, title) values (user_b, 'Material', 'M3') returning id into r3;
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
    values (r3, 'm3', 'd', 'Básico', 0) returning id into m3;
    select s.status into st from public.reserve_material_search(m3, 15, 2) s;
    if st <> 'account_used' then raise exception 'FALLO material: tercer link con tope 2 = %', st; end if;

    -- Escritura directa bloqueada.
    begin
      insert into public.node_materials (node_id, roadmap_id, user_id, usage_id, items, model)
      values (m3, r3, user_b, u, '[{"url":"https://evil.example"}]', 'm');
      raise exception 'FALLO: B escribió node_materials directamente';
    exception when insufficient_privilege then
      raise notice 'ok: node_materials sin escritura directa';
    end;

    -- A (Premium): no puede usar nodos ajenos; su cuota diaria se respeta.
    perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
    select s.status into st from public.reserve_material_search(m3, 15, 4) s;
    if st <> 'not_found' then raise exception 'FALLO material: A reservó en un nodo de B (%)', st; end if;
    begin
      perform public.save_node_materials(u, m3, '[{"url":"https://example.com"}]', 'm');
      raise exception 'FALLO: A guardó material en un nodo de B';
    exception when insufficient_privilege then
      raise notice 'ok: save_node_materials solo en nodos propios';
    end;
    select count(*) into n from public.free_material_grants;
    if n <> 0 then raise exception 'FALLO: A ve % cupos gratis de B', n; end if;

    insert into public.roadmaps (user_id, topic, title) values (user_a, 'Premium', 'P') returning id into rid;
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
    values (rid, 'p1', 'd', 'Básico', 0) returning id into pa1;
    insert into public.nodes (roadmap_id, title, description, difficulty, order_index)
    values (rid, 'p2', 'd', 'Básico', 1) returning id into pa2;
    select count(*) into used from public.ai_usage
    where kind = 'material' and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
    select s.status into st from public.reserve_material_search(pa1, used + 1, 0) s;
    if st <> 'granted' then raise exception 'FALLO material: Premium con cuota = %', st; end if;
    select s.status into st from public.reserve_material_search(pa2, used + 1, 0) s;
    if st <> 'exhausted' then raise exception 'FALLO material: Premium sin cuota = %', st; end if;
    execute 'reset role';
  end;
end;
$$;

select 'OK: trigger + RLS + cuota + RPC + grafo + progreso + planes + webhook + material verificados' as resultado;

rollback;
