-- Paso 7b · Webhook de Paddle: aplica un evento de suscripción de forma atómica.
-- Un solo RPC hace todo en la misma transacción, así un fallo a mitad de camino no deja el evento
-- marcado como procesado sin haber actualizado la suscripción (Paddle lo reintentaría en vano):
--   1) duplicado (event_id ya visto)        → 'duplicate'
--   2) usuario inexistente                   → 'unknown_user' (se registra y no se reintenta)
--   3) evento más viejo que el último aplicado → 'stale' (los webhooks llegan desordenados)
--   4) si no, upsert de la suscripción       → 'applied'
-- Solo lo ejecuta el service role (la ruta del webhook); ningún usuario puede llamarlo.

create function public.apply_subscription_event(
  p_event_id text,
  p_event_type text,
  p_occurred_at timestamptz,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_status text,
  p_billing_interval text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_last timestamptz;
begin
  insert into public.paddle_webhook_events (event_id, event_type, occurred_at)
  values (p_event_id, p_event_type, p_occurred_at)
  on conflict (event_id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    return 'unknown_user';
  end if;

  -- FOR UPDATE: dos eventos simultáneos del mismo usuario se aplican en orden.
  select s.last_event_at into v_last from public.subscriptions s where s.user_id = p_user_id for update;
  if v_last is not null and v_last > p_occurred_at then
    return 'stale';
  end if;

  insert into public.subscriptions as s (
    user_id, paddle_customer_id, paddle_subscription_id, status, billing_interval,
    current_period_end, past_due_since, cancel_at_period_end, last_event_at, updated_at
  )
  values (
    p_user_id, p_customer_id, p_subscription_id, p_status, p_billing_interval,
    p_current_period_end, case when p_status = 'past_due' then p_occurred_at end,
    coalesce(p_cancel_at_period_end, false), p_occurred_at, now()
  )
  on conflict (user_id) do update set
    paddle_customer_id     = excluded.paddle_customer_id,
    paddle_subscription_id = excluded.paddle_subscription_id,
    status                 = excluded.status,
    billing_interval       = excluded.billing_interval,
    current_period_end     = excluded.current_period_end,
    -- Los 10 días de gracia se cuentan desde el PRIMER aviso de cobro fallido, no desde el último.
    past_due_since         = case when excluded.status = 'past_due'
                                  then coalesce(s.past_due_since, excluded.past_due_since) end,
    cancel_at_period_end   = excluded.cancel_at_period_end,
    last_event_at          = excluded.last_event_at,
    updated_at             = now();

  return 'applied';
end;
$$;

revoke execute on function public.apply_subscription_event(
  text, text, timestamptz, uuid, text, text, text, text, timestamptz, boolean
) from public, anon, authenticated;
grant execute on function public.apply_subscription_event(
  text, text, timestamptz, uuid, text, text, text, text, timestamptz, boolean
) to service_role;
