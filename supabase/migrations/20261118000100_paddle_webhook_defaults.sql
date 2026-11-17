-- Paso 7b · Valores por defecto en apply_subscription_event.
-- Paddle puede mandar el intervalo o el fin de período vacíos (ej. una suscripción cancelada o
-- pausada). Con DEFAULT, los tipos generados los marcan como opcionales y el webhook los omite
-- en vez de forzar un valor. Mismo cuerpo que 20261118000000; los permisos se conservan
-- (CREATE OR REPLACE no los cambia).

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
