begin;

alter table public.payment_accounts
  add column if not exists weekly_limit numeric(18, 2) not null default 10000;

alter table public.payment_accounts
  drop constraint if exists payment_accounts_weekly_limit_check,
  add constraint payment_accounts_weekly_limit_check check (weekly_limit > 0);

create or replace function public.stable_week_start(p_at timestamptz default now())
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select (
    date_trunc('week', timezone('Europe/Madrid', p_at) + interval '1 day')
    - interval '1 day'
  ) at time zone 'Europe/Madrid';
$$;

create or replace function public.stable_account_weekly_usage(
  p_account_id uuid,
  p_exclude_operation_id uuid default null
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(operation.usd_amount), 0)::numeric
  from public.stable_operations operation
  where operation.receiving_account_id = p_account_id
    and (p_exclude_operation_id is null or operation.id <> p_exclude_operation_id)
    and (
      operation.proof_uploaded_at >= public.stable_week_start(now())
      or (
        operation.proof_uploaded_at is null
        and operation.status = 'waiting_payment'
        and operation.created_at >= greatest(
          public.stable_week_start(now()),
          now() - interval '24 hours'
        )
      )
    );
$$;

create or replace function public.get_stable_receiving_accounts()
returns table (
  account_id uuid,
  bank_name text,
  account_holder text,
  account_number text,
  routing_number text,
  account_type text,
  swift text,
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
    account.account_type,
    account.swift,
    account.method_name,
    account.instructions,
    account.is_active,
    account.weekly_limit,
    usage.amount,
    greatest(account.weekly_limit - usage.amount, 0),
    least(round((usage.amount / account.weekly_limit) * 100, 2), 100),
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
    usage.amount / account.weekly_limit,
    account.created_at;
end;
$$;

create or replace function public.create_stable_operation(
  p_usd_amount numeric,
  p_asset text,
  p_wallet_address text
)
returns public.stable_operations
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_account public.payment_accounts%rowtype;
  created_operation public.stable_operations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Tu sesión ha caducado';
  end if;

  if p_usd_amount is null or p_usd_amount <= 0 then
    raise exception 'Introduce un monto válido en USD';
  end if;

  if p_asset not in ('USDT', 'USDC') then
    raise exception 'Stablecoin no admitida';
  end if;

  if p_wallet_address is null or p_wallet_address !~ '^0x[0-9A-Fa-f]{40}$' then
    raise exception 'Introduce una wallet Ethereum válida';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_active = true
      and profile.stable_eligible = true
      and profile.kyc_status = 'approved'
  ) then
    raise exception 'Tu cuenta no está habilitada para operar con Stablecoin';
  end if;

  select account.*
  into selected_account
  from public.payment_accounts account
  where account.currency = 'USD'
    and account.method_type = 'bank'
    and account.for_deposits = true
    and account.is_active = true
    and account.weekly_limit - public.stable_account_weekly_usage(account.id) >= p_usd_amount
  order by
    public.stable_account_weekly_usage(account.id) / account.weekly_limit,
    public.stable_account_weekly_usage(account.id),
    account.created_at
  for update skip locked
  limit 1;

  if selected_account.id is null then
    raise exception 'No hay una cuenta USD con cupo suficiente para este monto. Contacta con soporte.';
  end if;

  insert into public.stable_operations (
    user_id,
    usd_amount,
    asset,
    wallet_address,
    receiving_account_id
  ) values (
    auth.uid(),
    round(p_usd_amount, 2),
    p_asset,
    p_wallet_address,
    selected_account.id
  )
  returning * into created_operation;

  return created_operation;
end;
$$;

create or replace function public.protect_stable_user_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_limit numeric;
  account_active boolean;
  other_usage numeric;
begin
  if public.is_admin() then
    new.updated_at := now();
    return new;
  end if;

  if auth.uid() is null or old.user_id <> auth.uid() then
    raise exception 'Operation access denied';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_active = true
      and profile.stable_eligible = true
      and profile.kyc_status = 'approved'
  ) then
    raise exception 'Tu acceso Stablecoin ya no está activo';
  end if;

  if new.user_id is distinct from old.user_id or
     new.usd_amount is distinct from old.usd_amount or
     new.fee_percent is distinct from old.fee_percent or
     new.asset is distinct from old.asset or
     new.network is distinct from old.network or
     new.wallet_address is distinct from old.wallet_address or
     new.receiving_account_id is distinct from old.receiving_account_id or
     new.risk is distinct from old.risk or
     new.tx_hash is distinct from old.tx_hash or
     new.admin_note is distinct from old.admin_note then
    raise exception 'Only proof fields can be changed by the customer';
  end if;

  if old.status not in ('waiting_payment', 'correction_requested') or new.status <> 'proof_submitted' then
    raise exception 'Invalid customer status transition';
  end if;

  if new.proof_path is null or new.proof_name is null or new.proof_mime_type <> 'application/pdf' then
    raise exception 'A PDF proof is required';
  end if;

  select account.weekly_limit, account.is_active
  into account_limit, account_active
  from public.payment_accounts account
  where account.id = old.receiving_account_id
  for update;

  if account_active is not true then
    raise exception 'Esta cuenta USD está pausada. Contacta con soporte para reasignar tu operación.';
  end if;

  other_usage := public.stable_account_weekly_usage(old.receiving_account_id, old.id);
  if other_usage + old.usd_amount > account_limit then
    raise exception 'Esta cuenta alcanzó su límite semanal. Contacta con soporte para reasignar tu operación.';
  end if;

  new.proof_uploaded_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop policy if exists "Users view active payment accounts" on public.payment_accounts;
create policy "Eligible users view active payment accounts"
  on public.payment_accounts
  for select
  to authenticated
  using (
    is_active = true
    and (
      currency <> 'USD'
      or for_deposits = false
      or exists (
        select 1
        from public.profiles profile
        where profile.id = auth.uid()
          and profile.is_active = true
          and profile.stable_eligible = true
          and profile.kyc_status = 'approved'
      )
    )
  );

revoke insert on public.stable_operations from authenticated;

revoke all on function public.stable_week_start(timestamptz) from public, anon, authenticated;
revoke all on function public.stable_account_weekly_usage(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_stable_receiving_accounts() from public, anon;
grant execute on function public.get_stable_receiving_accounts() to authenticated;
revoke all on function public.create_stable_operation(numeric, text, text) from public, anon;
grant execute on function public.create_stable_operation(numeric, text, text) to authenticated;
revoke all on function public.protect_stable_user_update() from public, anon, authenticated;

commit;
