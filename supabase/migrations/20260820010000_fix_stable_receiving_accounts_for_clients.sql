begin;

create or replace function public.get_stable_receiving_accounts()
returns table (
  account_id uuid,
  bank_name text,
  account_holder text,
  account_number text,
  routing_number text,
  swift text,
  ach_enabled boolean,
  ach_routing_number text,
  wire_enabled boolean,
  wire_routing_number text,
  account_type text,
  method_name text,
  instructions text,
  is_active boolean,
  weekly_limit numeric,
  weekly_used numeric,
  weekly_available numeric,
  utilization_percent numeric,
  capacity_available boolean,
  week_starts_at timestamptz,
  week_ends_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_is_admin boolean := public.is_admin();
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not caller_is_admin and not exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_active = true
      and profile.stable_eligible = true
      and profile.kyc_status = 'approved'
  ) then
    return;
  end if;

  return query
  select
    account.id,
    account.bank_name,
    account.account_holder,
    account.iban_account,
    account.routing_number,
    account.swift,
    account.ach_enabled,
    account.routing_number,
    account.wire_enabled,
    account.wire_routing_number,
    account.account_type,
    account.method_name,
    account.instructions,
    account.is_active,
    account.weekly_limit,
    usage.amount,
    greatest(account.weekly_limit - usage.amount, 0),
    least(round((usage.amount / nullif(account.weekly_limit, 0)) * 100, 2), 100),
    account.is_active and usage.amount < account.weekly_limit,
    public.stable_week_start(now()),
    public.stable_week_start(now()) + interval '7 days'
  from public.payment_accounts account
  cross join lateral (
    select public.stable_account_weekly_usage(account.id) as amount
  ) usage
  where account.currency = 'USD'
    and account.method_type = 'bank'
    and account.for_deposits = true
    and (caller_is_admin or account.is_active = true)
  order by
    case when account.is_active and usage.amount < account.weekly_limit then 0 else 1 end,
    usage.amount / nullif(account.weekly_limit, 0),
    account.created_at;
end;
$$;

revoke all on function public.get_stable_receiving_accounts() from public, anon;
grant execute on function public.get_stable_receiving_accounts() to authenticated;

commit;
