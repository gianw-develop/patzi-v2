begin;

alter table public.payment_accounts
  add column if not exists ach_enabled boolean not null default true,
  add column if not exists wire_enabled boolean not null default false,
  add column if not exists wire_routing_number text;

alter table public.payment_accounts
  drop constraint if exists payment_accounts_usd_rail_check,
  drop constraint if exists payment_accounts_ach_routing_check,
  drop constraint if exists payment_accounts_wire_routing_check,
  add constraint payment_accounts_usd_rail_check check (
    not (currency = 'USD' and method_type = 'bank' and for_deposits = true)
    or ach_enabled = true
    or wire_enabled = true
  ),
  add constraint payment_accounts_ach_routing_check check (
    not (currency = 'USD' and method_type = 'bank' and for_deposits = true and ach_enabled = true)
    or routing_number ~ '^[0-9]{9}$'
  ),
  add constraint payment_accounts_wire_routing_check check (
    not (currency = 'USD' and method_type = 'bank' and for_deposits = true and wire_enabled = true)
    or wire_routing_number ~ '^[0-9]{9}$'
  );

alter table public.stable_operations
  add column if not exists payment_rail text not null default 'ACH';

alter table public.stable_operations
  drop constraint if exists stable_operations_payment_rail_check,
  add constraint stable_operations_payment_rail_check check (payment_rail in ('ACH', 'WIRE'));

drop function if exists public.get_stable_receiving_accounts();
create function public.get_stable_receiving_accounts()
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

drop function if exists public.create_stable_operation(numeric, text, text);
create function public.create_stable_operation(
  p_usd_amount numeric,
  p_asset text,
  p_wallet_address text,
  p_payment_rail text
)
returns public.stable_operations
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_account public.payment_accounts%rowtype;
  created_operation public.stable_operations%rowtype;
  normalized_rail text := upper(p_payment_rail);
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

  if normalized_rail not in ('ACH', 'WIRE') then
    raise exception 'Selecciona ACH o Wire';
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
    and (
      (normalized_rail = 'ACH' and account.ach_enabled = true)
      or (normalized_rail = 'WIRE' and account.wire_enabled = true)
    )
    and account.weekly_limit - public.stable_account_weekly_usage(account.id) >= p_usd_amount
  order by
    public.stable_account_weekly_usage(account.id) / account.weekly_limit,
    public.stable_account_weekly_usage(account.id),
    account.created_at
  for update skip locked
  limit 1;

  if selected_account.id is null then
    raise exception 'No hay una cuenta USD compatible con % y con cupo suficiente. Contacta con soporte.', normalized_rail;
  end if;

  insert into public.stable_operations (
    user_id,
    usd_amount,
    asset,
    wallet_address,
    receiving_account_id,
    payment_rail
  ) values (
    auth.uid(),
    round(p_usd_amount, 2),
    p_asset,
    p_wallet_address,
    selected_account.id,
    normalized_rail
  )
  returning * into created_operation;

  return created_operation;
end;
$$;

-- Keep the previous three-argument contract available while the web deployment
-- rolls over. Existing sessions safely default to ACH.
create function public.create_stable_operation(
  p_usd_amount numeric,
  p_asset text,
  p_wallet_address text
)
returns public.stable_operations
language sql
security definer
set search_path = ''
as $$
  select *
  from public.create_stable_operation(p_usd_amount, p_asset, p_wallet_address, 'ACH');
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
  rail_available boolean;
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
     new.payment_rail is distinct from old.payment_rail or
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

  select
    account.weekly_limit,
    account.is_active,
    case when old.payment_rail = 'ACH' then account.ach_enabled else account.wire_enabled end
  into account_limit, account_active, rail_available
  from public.payment_accounts account
  where account.id = old.receiving_account_id
  for update;

  if account_active is not true or rail_available is not true then
    raise exception 'Esta cuenta USD ya no acepta %. Contacta con soporte para reasignar tu operación.', old.payment_rail;
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

revoke all on function public.get_stable_receiving_accounts() from public, anon;
grant execute on function public.get_stable_receiving_accounts() to authenticated;
revoke all on function public.create_stable_operation(numeric, text, text, text) from public, anon;
grant execute on function public.create_stable_operation(numeric, text, text, text) to authenticated;
revoke all on function public.create_stable_operation(numeric, text, text) from public, anon;
grant execute on function public.create_stable_operation(numeric, text, text) to authenticated;
revoke all on function public.protect_stable_user_update() from public, anon, authenticated;

commit;
