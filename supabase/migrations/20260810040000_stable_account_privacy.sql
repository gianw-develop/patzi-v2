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
    case when caller_is_admin then account.weekly_limit else 0::numeric end,
    case when caller_is_admin then usage.amount else 0::numeric end,
    case when caller_is_admin then greatest(account.weekly_limit - usage.amount, 0) else 0::numeric end,
    case when caller_is_admin then least(round((usage.amount / account.weekly_limit) * 100, 2), 100) else 0::numeric end,
    case when caller_is_admin then account.is_active and usage.amount < account.weekly_limit else false end,
    public.stable_week_start(now()),
    public.stable_week_start(now()) + interval '7 days'
  from public.payment_accounts account
  cross join lateral (
    select public.stable_account_weekly_usage(account.id) as amount
  ) usage
  where account.currency = 'USD'
    and account.method_type = 'bank'
    and account.for_deposits = true
    and (
      caller_is_admin
      or exists (
        select 1
        from public.stable_operations operation
        where operation.user_id = auth.uid()
          and operation.receiving_account_id = account.id
      )
    )
  order by
    case when account.is_active and usage.amount < account.weekly_limit then 0 else 1 end,
    usage.amount / account.weekly_limit,
    account.created_at;
end;
$$;

drop function if exists public.get_stable_capacity_summary();
create function public.get_stable_capacity_summary()
returns table (
  payment_rail text,
  capacity_available boolean,
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
  with rails(payment_rail) as (
    values ('ACH'::text), ('WIRE'::text)
  )
  select
    rail.payment_rail,
    coalesce(bool_or(
      account.id is not null
      and public.stable_account_weekly_usage(account.id) < account.weekly_limit
    ), false),
    public.stable_week_start(now()) + interval '7 days'
  from rails rail
  left join public.payment_accounts account
    on account.currency = 'USD'
    and account.method_type = 'bank'
    and account.for_deposits = true
    and account.is_active = true
    and (
      (rail.payment_rail = 'ACH' and account.ach_enabled = true)
      or (rail.payment_rail = 'WIRE' and account.wire_enabled = true)
    )
  group by rail.payment_rail
  order by rail.payment_rail;
end;
$$;

revoke all on function public.get_stable_receiving_accounts() from public, anon;
grant execute on function public.get_stable_receiving_accounts() to authenticated;
revoke all on function public.get_stable_capacity_summary() from public, anon;
grant execute on function public.get_stable_capacity_summary() to authenticated;

commit;
