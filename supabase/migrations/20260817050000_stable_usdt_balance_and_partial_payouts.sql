begin;

alter table public.stable_operations
  add column if not exists deposit_date date;

update public.stable_operations
set deposit_date = (created_at at time zone 'UTC')::date
where deposit_date is null;

alter table public.stable_operations
  alter column deposit_date set default current_date,
  alter column deposit_date set not null,
  alter column wallet_address drop not null,
  alter column asset set default 'USDT';

create table if not exists public.stable_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  address text not null check (address ~ '^0x[0-9A-Fa-f]{40}$'),
  network text not null default 'ethereum_erc20' check (network = 'ethereum_erc20'),
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stable_payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  requested_amount numeric(18, 2) not null check (requested_amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.stable_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(18, 2) not null check (amount > 0),
  asset text not null default 'USDT' check (asset = 'USDT'),
  wallet_address text not null check (wallet_address ~ '^0x[0-9A-Fa-f]{40}$'),
  network text not null default 'ethereum_erc20' check (network = 'ethereum_erc20'),
  proof_path text not null,
  proof_name text not null,
  proof_mime_type text not null check (proof_mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  proof_size bigint not null check (proof_size > 0 and proof_size <= 10485760),
  payout_request_id uuid unique references public.stable_payout_requests(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists stable_payouts_user_paid_idx
  on public.stable_payouts (user_id, paid_at desc);
create index if not exists stable_payout_requests_user_created_idx
  on public.stable_payout_requests (user_id, created_at desc);
create index if not exists stable_operations_deposit_date_idx
  on public.stable_operations (deposit_date desc, created_at desc);

alter table public.stable_wallets enable row level security;
alter table public.stable_payouts enable row level security;
alter table public.stable_payout_requests enable row level security;

drop policy if exists "Users view own Stable wallet" on public.stable_wallets;
create policy "Users view own Stable wallet"
  on public.stable_wallets for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users view own Stable payouts" on public.stable_payouts;
create policy "Users view own Stable payouts"
  on public.stable_payouts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users view own Stable payout requests" on public.stable_payout_requests;
create policy "Users view own Stable payout requests"
  on public.stable_payout_requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create or replace function public.set_stable_wallet(p_address text)
returns public.stable_wallets
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_address text := btrim(p_address);
  current_wallet public.stable_wallets%rowtype;
  result public.stable_wallets%rowtype;
begin
  if auth.uid() is null then raise exception 'Tu sesión ha caducado'; end if;
  if normalized_address !~ '^0x[0-9A-Fa-f]{40}$' then
    raise exception 'Introduce una wallet Ethereum válida';
  end if;
  if not exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid() and profile.is_active = true
      and profile.stable_eligible = true and profile.kyc_status = 'approved'
  ) then
    raise exception 'Tu cuenta no está habilitada para Patzi Stable';
  end if;

  select * into current_wallet
  from public.stable_wallets wallet
  where wallet.user_id = auth.uid()
  for update;

  if current_wallet.id is null then
    insert into public.stable_wallets (user_id, address)
    values (auth.uid(), normalized_address)
    returning * into result;
  elsif lower(current_wallet.address) = lower(normalized_address) then
    result := current_wallet;
  else
    update public.stable_wallets
    set address = normalized_address,
        is_verified = false,
        verified_at = null,
        verified_by = null,
        updated_at = now()
    where user_id = auth.uid()
    returning * into result;
  end if;

  return result;
end;
$$;

create or replace function public.admin_verify_stable_wallet(
  p_user_id uuid,
  p_verified boolean
)
returns public.stable_wallets
language plpgsql
security definer
set search_path = ''
as $$
declare result public.stable_wallets%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;

  update public.stable_wallets
  set is_verified = p_verified,
      verified_at = case when p_verified then now() else null end,
      verified_by = case when p_verified then auth.uid() else null end,
      updated_at = now()
  where user_id = p_user_id
  returning * into result;

  if result.id is null then raise exception 'El cliente todavía no ha guardado una wallet'; end if;
  return result;
end;
$$;

create or replace function public.create_stable_deposit(
  p_usd_amount numeric,
  p_deposit_date date,
  p_sender_legal_name text,
  p_sender_email text,
  p_sender_phone text,
  p_sender_bank_name text,
  p_payment_rail text,
  p_receiving_account_id uuid
)
returns public.stable_operations
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_account public.payment_accounts%rowtype;
  selected_sender public.stable_senders%rowtype;
  created_operation public.stable_operations%rowtype;
  normalized_amount numeric(18, 2) := round(p_usd_amount, 2);
  normalized_rail text := upper(btrim(p_payment_rail));
  normalized_name text := btrim(p_sender_legal_name);
  normalized_email text := lower(btrim(p_sender_email));
  normalized_phone text := btrim(p_sender_phone);
  normalized_bank text := btrim(p_sender_bank_name);
begin
  if auth.uid() is null then raise exception 'Tu sesión ha caducado'; end if;
  if normalized_amount is null or normalized_amount <= 0 then raise exception 'Introduce un monto válido en USD'; end if;
  if p_deposit_date is null or p_deposit_date > current_date then raise exception 'Selecciona una fecha de depósito válida'; end if;
  if char_length(normalized_name) < 3 then raise exception 'Escribe el nombre completo de quien envía'; end if;
  if normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'Introduce un correo válido'; end if;
  if char_length(regexp_replace(normalized_phone, '[^0-9]', '', 'g')) < 7 then raise exception 'Introduce un teléfono válido'; end if;
  if char_length(normalized_bank) < 2 then raise exception 'Indica el banco de origen'; end if;
  if normalized_rail not in ('ACH', 'WIRE') then raise exception 'Selecciona ACH o Wire'; end if;
  if p_receiving_account_id is null then raise exception 'Selecciona la cuenta receptora Patzi'; end if;

  if not exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid() and profile.is_active = true
      and profile.stable_eligible = true and profile.kyc_status = 'approved'
  ) then raise exception 'Tu cuenta no está habilitada para Patzi Stable'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('patzi_stable_account_assignment')::bigint
  );

  select account.* into selected_account
  from public.payment_accounts account
  where account.id = p_receiving_account_id
    and account.currency = 'USD' and account.method_type = 'bank'
    and account.for_deposits = true and account.is_active = true
    and ((normalized_rail = 'ACH' and account.ach_enabled = true)
      or (normalized_rail = 'WIRE' and account.wire_enabled = true))
    and account.weekly_limit - public.stable_account_weekly_usage(account.id) >= normalized_amount
  for update;

  if selected_account.id is null then
    raise exception 'La cuenta seleccionada no está disponible o no tiene cupo suficiente';
  end if;

  select * into selected_sender
  from public.stable_senders sender
  where sender.user_id = auth.uid()
    and lower(sender.legal_name) = lower(normalized_name)
    and lower(sender.email) = normalized_email
    and sender.phone = normalized_phone
    and sender.is_active = true
  order by sender.created_at
  limit 1;

  if selected_sender.id is null then
    insert into public.stable_senders (
      user_id, sender_type, legal_name, email, phone, bank_name
    ) values (
      auth.uid(), 'person', normalized_name, normalized_email, normalized_phone, normalized_bank
    ) returning * into selected_sender;
  elsif selected_sender.bank_name is distinct from normalized_bank then
    update public.stable_senders
    set bank_name = normalized_bank, updated_at = now()
    where id = selected_sender.id
    returning * into selected_sender;
  end if;

  insert into public.stable_operations (
    user_id, usd_amount, deposit_date, asset, wallet_address,
    receiving_account_id, payment_rail,
    sender_id, sender_type, sender_legal_name, sender_email, sender_phone,
    sender_bank_name, sender_account_last4, sender_confirmed_at
  ) values (
    auth.uid(), normalized_amount, p_deposit_date, 'USDT', null,
    selected_account.id, normalized_rail,
    selected_sender.id, selected_sender.sender_type, selected_sender.legal_name,
    selected_sender.email, selected_sender.phone, normalized_bank,
    selected_sender.account_last4, now()
  ) returning * into created_operation;

  return created_operation;
end;
$$;

create or replace function public.admin_approve_stable_deposit(
  p_operation_id uuid,
  p_bank_received_amount numeric
)
returns public.stable_operations
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_operation public.stable_operations%rowtype;
  approved_operation public.stable_operations%rowtype;
  normalized_amount numeric(18, 2) := round(p_bank_received_amount, 2);
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;

  select * into selected_operation
  from public.stable_operations
  where id = p_operation_id
  for update;

  if selected_operation.id is null then raise exception 'Depósito no encontrado'; end if;
  if selected_operation.status not in ('proof_submitted', 'verifying', 'correction_requested') then
    raise exception 'Este depósito ya fue decidido';
  end if;
  if selected_operation.proof_path is null then raise exception 'El depósito no tiene comprobante'; end if;
  if normalized_amount is null or normalized_amount <= 0 or normalized_amount > selected_operation.usd_amount then
    raise exception 'El monto real debe ser mayor que cero y no superar el monto declarado';
  end if;

  update public.stable_operations
  set bank_received_amount = normalized_amount,
      asset = 'USDT',
      status = 'payment_received',
      admin_note = null
  where id = p_operation_id
  returning * into approved_operation;

  return approved_operation;
end;
$$;

create or replace function public.admin_reject_stable_deposit(
  p_operation_id uuid,
  p_reason text default null
)
returns public.stable_operations
language plpgsql
security definer
set search_path = ''
as $$
declare result public.stable_operations%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;

  update public.stable_operations
  set status = 'blocked',
      admin_note = coalesce(nullif(btrim(p_reason), ''), 'Depósito no aprobado por Patzi')
  where id = p_operation_id
    and status in ('proof_submitted', 'verifying', 'correction_requested')
  returning * into result;

  if result.id is null then raise exception 'Este depósito ya fue decidido o no existe'; end if;
  return result;
end;
$$;

create or replace function public.get_stable_balance(p_user_id uuid default null)
returns table (
  user_id uuid,
  credited_usdt numeric,
  paid_usdt numeric,
  available_usdt numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare target_user uuid := coalesce(p_user_id, auth.uid());
begin
  if auth.uid() is null then raise exception 'Tu sesión ha caducado'; end if;
  if target_user <> auth.uid() and not public.is_admin() then raise exception 'Access denied'; end if;

  return query
  select target_user,
    coalesce((
      select sum(operation.settlement_delivery_amount)
      from public.stable_operations operation
      where operation.user_id = target_user
        and operation.status in ('payment_received', 'preparing', 'completed')
        and operation.bank_received_amount is not null
    ), 0)::numeric,
    coalesce((
      select sum(payout.amount)
      from public.stable_payouts payout
      where payout.user_id = target_user
    ), 0)::numeric,
    (
      coalesce((
        select sum(operation.settlement_delivery_amount)
        from public.stable_operations operation
        where operation.user_id = target_user
          and operation.status in ('payment_received', 'preparing', 'completed')
          and operation.bank_received_amount is not null
      ), 0)
      - coalesce((select sum(payout.amount) from public.stable_payouts payout where payout.user_id = target_user), 0)
    )::numeric;
end;
$$;

create or replace function public.request_stable_payout(p_amount numeric)
returns public.stable_payout_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  available numeric;
  normalized_amount numeric(18, 2) := round(p_amount, 2);
  result public.stable_payout_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Tu sesión ha caducado'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('patzi_stable_balance:' || auth.uid()::text)::bigint);

  if not exists (
    select 1 from public.stable_wallets wallet
    where wallet.user_id = auth.uid() and wallet.is_verified = true
  ) then raise exception 'Tu wallet USDT debe estar verificada antes de solicitar un pago'; end if;

  select balance.available_usdt into available
  from public.get_stable_balance(auth.uid()) balance;

  if normalized_amount is null or normalized_amount <= 0 or normalized_amount > available then
    raise exception 'El monto solicitado supera tu saldo USDT disponible';
  end if;

  insert into public.stable_payout_requests (user_id, requested_amount)
  values (auth.uid(), normalized_amount)
  returning * into result;
  return result;
end;
$$;

create or replace function public.admin_record_stable_payout(
  p_user_id uuid,
  p_amount numeric,
  p_proof_path text,
  p_proof_name text,
  p_proof_mime_type text,
  p_proof_size bigint,
  p_payout_request_id uuid default null
)
returns public.stable_payouts
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_wallet public.stable_wallets%rowtype;
  selected_request public.stable_payout_requests%rowtype;
  available numeric;
  normalized_amount numeric(18, 2) := round(p_amount, 2);
  result public.stable_payouts%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('patzi_stable_balance:' || p_user_id::text)::bigint);

  select * into selected_wallet
  from public.stable_wallets wallet
  where wallet.user_id = p_user_id and wallet.is_verified = true
  for update;
  if selected_wallet.id is null then raise exception 'La wallet USDT del cliente no está verificada'; end if;

  select balance.available_usdt into available
  from public.get_stable_balance(p_user_id) balance;
  if normalized_amount is null or normalized_amount <= 0 or normalized_amount > available then
    raise exception 'El abono supera el saldo USDT disponible';
  end if;
  if p_proof_mime_type not in ('application/pdf', 'image/png', 'image/jpeg') then
    raise exception 'El comprobante debe ser PDF, JPG o PNG';
  end if;
  if p_proof_size is null or p_proof_size <= 0 or p_proof_size > 10485760 then
    raise exception 'El comprobante supera el límite de 10 MB';
  end if;
  if position(p_user_id::text || '/' in p_proof_path) <> 1 then
    raise exception 'Ruta de comprobante inválida';
  end if;

  if p_payout_request_id is not null then
    select * into selected_request
    from public.stable_payout_requests request
    where request.id = p_payout_request_id and request.user_id = p_user_id and request.status = 'pending'
    for update;
    if selected_request.id is null then raise exception 'La solicitud de pago no está disponible'; end if;
  end if;

  insert into public.stable_payouts (
    user_id, amount, wallet_address, proof_path, proof_name,
    proof_mime_type, proof_size, payout_request_id, created_by
  ) values (
    p_user_id, normalized_amount, selected_wallet.address, p_proof_path,
    p_proof_name, p_proof_mime_type, p_proof_size, p_payout_request_id, auth.uid()
  ) returning * into result;

  if p_payout_request_id is not null then
    update public.stable_payout_requests
    set status = 'paid', resolved_at = now()
    where id = p_payout_request_id;
  end if;

  return result;
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
  rail_available boolean;
  other_usage numeric;
  attaching_sender boolean := coalesce(pg_catalog.current_setting('patzi.attach_stable_sender', true), '') = 'on';
begin
  if public.is_admin() then new.updated_at := now(); return new; end if;
  if auth.uid() is null or old.user_id <> auth.uid() then raise exception 'Operation access denied'; end if;

  if not exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid() and profile.is_active = true
      and profile.stable_eligible = true and profile.kyc_status = 'approved'
  ) then raise exception 'Tu acceso Stable ya no está activo'; end if;

  if attaching_sender then
    if old.sender_id is not null or new.sender_id is null
       or old.status not in ('waiting_payment', 'correction_requested')
       or new.status is distinct from old.status
       or new.proof_path is distinct from old.proof_path
       or new.bank_received_amount is distinct from old.bank_received_amount then
      raise exception 'Invalid sender recovery';
    end if;
    new.updated_at := now();
    return new;
  end if;

  if new.user_id is distinct from old.user_id or
     new.usd_amount is distinct from old.usd_amount or
     new.deposit_date is distinct from old.deposit_date or
     new.fee_percent is distinct from old.fee_percent or
     new.asset is distinct from old.asset or
     new.network is distinct from old.network or
     new.wallet_address is distinct from old.wallet_address or
     new.receiving_account_id is distinct from old.receiving_account_id or
     new.payment_rail is distinct from old.payment_rail or
     new.risk is distinct from old.risk or
     new.tx_hash is distinct from old.tx_hash or
     new.admin_note is distinct from old.admin_note or
     new.bank_received_amount is distinct from old.bank_received_amount or
     new.sender_id is distinct from old.sender_id or
     new.sender_type is distinct from old.sender_type or
     new.sender_legal_name is distinct from old.sender_legal_name or
     new.sender_email is distinct from old.sender_email or
     new.sender_phone is distinct from old.sender_phone or
     new.sender_bank_name is distinct from old.sender_bank_name or
     new.sender_account_last4 is distinct from old.sender_account_last4 or
     new.sender_confirmed_at is distinct from old.sender_confirmed_at then
    raise exception 'Only proof fields can be changed by the customer';
  end if;

  if old.sender_id is null then raise exception 'El depósito no tiene remitente identificado'; end if;
  if old.status not in ('waiting_payment', 'correction_requested') or new.status <> 'proof_submitted' then
    raise exception 'Invalid customer status transition';
  end if;
  if new.proof_path is null or new.proof_name is null
     or new.proof_mime_type not in ('application/pdf', 'image/png', 'image/jpeg') then
    raise exception 'Se requiere un comprobante PDF, JPG o PNG';
  end if;

  select account.weekly_limit, account.is_active,
    case when old.payment_rail = 'ACH' then account.ach_enabled else account.wire_enabled end
  into account_limit, account_active, rail_available
  from public.payment_accounts account where account.id = old.receiving_account_id for update;

  if account_active is not true or rail_available is not true then
    raise exception 'Esta cuenta USD ya no acepta %. Contacta con soporte.', old.payment_rail;
  end if;
  other_usage := public.stable_account_weekly_usage(old.receiving_account_id, old.id);
  if other_usage + old.usd_amount > account_limit then
    raise exception 'Esta cuenta alcanzó su límite semanal. Selecciona otra cuenta.';
  end if;

  new.proof_uploaded_at := now();
  new.updated_at := now();
  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stable-payout-proofs', 'stable-payout-proofs', false, 10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

update storage.buckets
set allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg']
where id = 'stable-proofs';

drop policy if exists "Users read own Stable payout proofs" on storage.objects;
create policy "Users read own Stable payout proofs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'stable-payout-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Admins manage Stable payout proofs" on storage.objects;
create policy "Admins manage Stable payout proofs"
  on storage.objects for all to authenticated
  using (bucket_id = 'stable-payout-proofs' and public.is_admin())
  with check (bucket_id = 'stable-payout-proofs' and public.is_admin());

revoke all on function public.create_stable_operation(numeric, text, text, text, uuid, boolean, uuid) from authenticated;
revoke all on function public.set_stable_wallet(text) from public, anon;
grant execute on function public.set_stable_wallet(text) to authenticated;
revoke all on function public.admin_verify_stable_wallet(uuid, boolean) from public, anon;
grant execute on function public.admin_verify_stable_wallet(uuid, boolean) to authenticated;
revoke all on function public.create_stable_deposit(numeric, date, text, text, text, text, text, uuid) from public, anon;
grant execute on function public.create_stable_deposit(numeric, date, text, text, text, text, text, uuid) to authenticated;
revoke all on function public.admin_approve_stable_deposit(uuid, numeric) from public, anon;
grant execute on function public.admin_approve_stable_deposit(uuid, numeric) to authenticated;
revoke all on function public.admin_reject_stable_deposit(uuid, text) from public, anon;
grant execute on function public.admin_reject_stable_deposit(uuid, text) to authenticated;
revoke all on function public.get_stable_balance(uuid) from public, anon;
grant execute on function public.get_stable_balance(uuid) to authenticated;
revoke all on function public.request_stable_payout(numeric) from public, anon;
grant execute on function public.request_stable_payout(numeric) to authenticated;
revoke all on function public.admin_record_stable_payout(uuid, numeric, text, text, text, bigint, uuid) from public, anon;
grant execute on function public.admin_record_stable_payout(uuid, numeric, text, text, text, bigint, uuid) to authenticated;

grant select on public.stable_wallets, public.stable_payouts, public.stable_payout_requests to authenticated;
revoke insert, update, delete on public.stable_wallets, public.stable_payouts, public.stable_payout_requests from authenticated;

commit;
