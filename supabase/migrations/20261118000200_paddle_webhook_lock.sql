-- Paso 7b · Serializa los eventos de un mismo usuario en apply_subscription_event.
-- Problema visto en el sandbox: subscription.created y subscription.activated llegan casi a la vez
-- (misma occurred_at). Sin fila previa, `FOR UPDATE` no bloquea nada y los dos inserts compiten;
-- el segundo puede fallar por el índice único de paddle_subscription_id (ON CONFLICT solo arbitra
-- user_id) → 500 y reintento de Paddle. Con un advisory lock por usuario se aplican de a uno.
-- Mismo cuerpo que 20261118000100 + el lock; los permisos se conservan.

create or replace function public.apply_subscription_event(
  p_event_id text,
  p_event_type text,
  p_occurred_at timestamptz,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_status text,
  p_billing_interval text default null,
  p_current_period_end timestamptz default null,
  p_cancel_at_period_end boolean default false
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_last timestamptz;
begin
  -- Clave distinta de la de las cuotas (semilla 1 vs 0): no se bloquean entre sí.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));

  insert into public.paddle_webhook_events (event_id, event_type, occurred_at)
  values (p_event_id, p_event_type, p_occurred_at)
  on conflict (event_id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    return 'unknown_user';
  end if;

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
