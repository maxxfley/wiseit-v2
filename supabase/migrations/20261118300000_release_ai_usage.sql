-- Paso 7d · Devolver el cupo cuando la IA rechaza el pedido sin procesarlo.
-- Si Groq responde "saturado" o "no disponible" antes de trabajar, no hubo tokens ni costo: cobrarle
-- el intento al usuario sería castigarlo por un problema ajeno. Si el modelo SÍ trabajó (salida
-- inválida), el intento se sigue consumiendo.
-- 1) free_material_grants.usage_id (FK con cascade): al liberar la reserva se libera también el
--    link gratis de la ruta. reserve_material_search ahora lo completa (mismo cuerpo + usage_id).
-- 2) release_ai_usage: borra una reserva PROPIA, reciente y SIN tokens registrados. Con esas
--    condiciones no sirve para reiniciar la cuota: una reserva usada siempre tiene tokens.

-- ─── 1. free_material_grants.usage_id ─────────────────────────────────────────
alter table public.free_material_grants
  add column usage_id uuid unique references public.ai_usage (id) on delete cascade;

create or replace function public.reserve_material_search(p_node_id uuid, p_premium_daily integer, p_free_total integer)
returns table (status text, usage_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := (select auth.uid());
  v_roadmap uuid;
  v_used    integer;
  v_id      uuid;
  v_premium boolean;
begin
  if v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if p_premium_daily is null or p_free_total is null or p_premium_daily < 0 or p_free_total < 0 then
    raise exception 'Límite inválido' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select n.roadmap_id into v_roadmap
  from public.nodes n
  join public.roadmaps r on r.id = n.roadmap_id
  where n.id = p_node_id and r.user_id = v_user;
  if v_roadmap is null then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  if exists (select 1 from public.node_materials m where m.node_id = p_node_id) then
    return query select 'cached'::text, null::uuid;
    return;
  end if;

  v_premium := public.is_premium();
  if v_premium then
    select count(*) into v_used
    from public.ai_usage a
    where a.user_id = v_user
      and a.kind = 'material'
      and a.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
    if v_used >= p_premium_daily then
      return query select 'exhausted'::text, null::uuid;
      return;
    end if;
  else
    if exists (select 1 from public.free_material_grants g where g.user_id = v_user and g.roadmap_id = v_roadmap) then
      return query select 'roadmap_used'::text, null::uuid;
      return;
    end if;
    if (select count(*) from public.free_material_grants g where g.user_id = v_user) >= p_free_total then
      return query select 'account_used'::text, null::uuid;
      return;
    end if;
  end if;

  insert into public.ai_usage (user_id, kind) values (v_user, 'material') returning id into v_id;
  if not v_premium then
    insert into public.free_material_grants (user_id, roadmap_id, node_id, usage_id)
    values (v_user, v_roadmap, p_node_id, v_id);
  end if;
  return query select 'granted'::text, v_id;
end;
$$;

-- ─── 2. release_ai_usage ──────────────────────────────────────────────────────
create function public.release_ai_usage(p_usage_id uuid)
returns boolean
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

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  delete from public.ai_usage a
  where a.id = p_usage_id
    and a.user_id = v_user
    and a.model is null
    and a.input_tokens is null
    and a.output_tokens is null
    and a.created_at > now() - interval '15 minutes';
  return found;
end;
$$;

revoke execute on function public.release_ai_usage(uuid) from public, anon;
grant execute on function public.release_ai_usage(uuid) to authenticated;
