-- Smoke test del Paso 2: trigger de profiles + aislamiento RLS entre dos usuarios.
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
  rid := public.create_roadmap_with_nodes('Rust', 'Ruta Rust',
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
    perform public.create_roadmap_with_nodes('Go', 'Ruta Go',
      '[{"title":"a","description":"d","difficulty":"Básico","order_index":0},
        {"title":"b","description":"d","difficulty":"Inexistente","order_index":1}]'::jsonb);
    raise exception 'FALLO: el RPC aceptó una dificultad inválida';
  exception when invalid_text_representation then
    raise notice 'ok: dificultad inválida rechazada';
  end;
  select count(*) into n from public.roadmaps where topic = 'Go';
  if n <> 0 then raise exception 'FALLO RPC: quedó un roadmap huérfano'; end if;

  execute 'reset role';
end;
$$;

select 'OK: trigger + RLS + cuota + RPC verificados' as resultado;

rollback;
