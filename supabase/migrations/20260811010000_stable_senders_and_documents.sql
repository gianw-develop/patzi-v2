begin;

create table if not exists public.stable_senders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  sender_type text not null default 'person' check (sender_type in ('person', 'business')),
  legal_name text not null check (char_length(trim(legal_name)) between 2 and 160),
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  phone text not null check (char_length(trim(phone)) between 6 and 30),
  bank_name text,
  account_last4 text check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stable_senders_user_name_idx
  on public.stable_senders (user_id, legal_name);

alter table public.stable_senders enable row level security;

drop policy if exists "Users view own stable senders" on public.stable_senders;
create policy "Users view own stable senders"
  on public.stable_senders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Eligible users create stable senders" on public.stable_senders;
create policy "Eligible users create stable senders"
  on public.stable_senders for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles profile
      where profile.id = auth.uid()
        and profile.is_active = true
        and profile.stable_eligible = true
        and profile.kyc_status = 'approved'
    )
  );

drop policy if exists "Eligible users update own stable senders" on public.stable_senders;
create policy "Eligible users update own stable senders"
  on public.stable_senders for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles profile
      where profile.id = auth.uid()
        and profile.is_active = true
        and profile.stable_eligible = true
        and profile.kyc_status = 'approved'
    )
  );

drop policy if exists "Admins manage stable senders" on public.stable_senders;
create policy "Admins manage stable senders"
  on public.stable_senders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists stable_senders_updated_at on public.stable_senders;
create trigger stable_senders_updated_at
  before update on public.stable_senders
  for each row execute function public.set_updated_at();

alter table public.stable_operations
  add column if not exists sender_id uuid references public.stable_senders(id) on delete restrict,
  add column if not exists sender_type text check (sender_type is null or sender_type in ('person', 'business')),
  add column if not exists sender_legal_name text,
  add column if not exists sender_email text,
  add column if not exists sender_phone text,
  add column if not exists sender_bank_name text,
  add column if not exists sender_account_last4 text check (sender_account_last4 is null or sender_account_last4 ~ '^[0-9]{4}$'),
  add column if not exists sender_confirmed_at timestamptz;

create index if not exists stable_operations_sender_idx
  on public.stable_operations (sender_id, created_at desc);

create table if not exists public.stable_operation_documents (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.stable_operations(id) on delete cascade,
  document_type text not null check (document_type in ('invoice', 'contract')),
  storage_path text not null,
  file_name text not null,
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operation_id, document_type)
);

alter table public.stable_operation_documents enable row level security;

drop policy if exists "Users view own stable documents" on public.stable_operation_documents;
create policy "Users view own stable documents"
  on public.stable_operation_documents for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.stable_operations operation
      where operation.id = operation_id and operation.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage stable documents" on public.stable_operation_documents;
create policy "Admins manage stable documents"
  on public.stable_operation_documents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists stable_operation_documents_updated_at on public.stable_operation_documents;
create trigger stable_operation_documents_updated_at
  before update on public.stable_operation_documents
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stable-documents', 'stable-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users read own stable operation documents" on storage.objects;
create policy "Users read own stable operation documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'stable-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Admins manage stable operation documents" on storage.objects;
create policy "Admins manage stable operation documents"
  on storage.objects for all to authenticated
  using (bucket_id = 'stable-documents' and public.is_admin())
  with check (bucket_id = 'stable-documents' and public.is_admin());

drop function if exists public.create_stable_operation(numeric, text, text, text, uuid, boolean);
create function public.create_stable_operation(
  p_usd_amount numeric,
  p_asset text,
  p_wallet_address text,
  p_payment_rail text,
  p_sender_id uuid,
  p_sender_account_confirmed boolean
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
  normalized_rail text := upper(p_payment_rail);
begin
  if auth.uid() is null then raise exception 'Tu sesión ha caducado'; end if;
  if p_usd_amount is null or p_usd_amount <= 0 then raise exception 'Introduce un monto válido en USD'; end if;
  if p_asset not in ('USDT', 'USDC') then raise exception 'Stablecoin no admitida'; end if;
  if normalized_rail not in ('ACH', 'WIRE') then raise exception 'Selecciona ACH o Wire'; end if;
  if p_wallet_address is null or p_wallet_address !~ '^0x[0-9A-Fa-f]{40}$' then raise exception 'Introduce una wallet Ethereum válida'; end if;
  if p_sender_account_confirmed is not true then raise exception 'Confirma quién es el titular de la cuenta que enviará los USD'; end if;

  if not exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid() and profile.is_active = true
      and profile.stable_eligible = true and profile.kyc_status = 'approved'
  ) then
    raise exception 'Tu cuenta no está habilitada para operar con Stablecoin';
  end if;

  select * into selected_sender
  from public.stable_senders sender
  where sender.id = p_sender_id and sender.user_id = auth.uid() and sender.is_active = true;

  if selected_sender.id is null then raise exception 'Selecciona un remitente USD válido'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('patzi_stable_account_assignment')::bigint
  );

  select account.* into selected_account
  from public.payment_accounts account
  where account.currency = 'USD' and account.method_type = 'bank'
    and account.for_deposits = true and account.is_active = true
    and ((normalized_rail = 'ACH' and account.ach_enabled = true)
      or (normalized_rail = 'WIRE' and account.wire_enabled = true))
    and account.weekly_limit - public.stable_account_weekly_usage(account.id) >= p_usd_amount
  order by public.stable_account_weekly_usage(account.id) / account.weekly_limit,
    public.stable_account_weekly_usage(account.id), account.created_at
  for update skip locked limit 1;

  if selected_account.id is null then
    raise exception 'No hay una cuenta USD compatible con % y con cupo suficiente. Contacta con soporte.', normalized_rail;
  end if;

  insert into public.stable_operations (
    user_id, usd_amount, asset, wallet_address, receiving_account_id, payment_rail,
    sender_id, sender_type, sender_legal_name, sender_email, sender_phone,
    sender_bank_name, sender_account_last4, sender_confirmed_at
  ) values (
    auth.uid(), round(p_usd_amount, 2), p_asset, p_wallet_address, selected_account.id, normalized_rail,
    selected_sender.id, selected_sender.sender_type, selected_sender.legal_name,
    selected_sender.email, selected_sender.phone, selected_sender.bank_name,
    selected_sender.account_last4, now()
  ) returning * into created_operation;

  return created_operation;
end;
$$;

create or replace function public.create_stable_operation(
  p_usd_amount numeric, p_asset text, p_wallet_address text, p_payment_rail text
)
returns public.stable_operations
language plpgsql security definer set search_path = ''
as $$
begin
  raise exception 'Actualiza Patzi y registra el remitente USD antes de crear la operación';
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
begin
  if public.is_admin() then new.updated_at := now(); return new; end if;
  if auth.uid() is null or old.user_id <> auth.uid() then raise exception 'Operation access denied'; end if;

  if not exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid() and profile.is_active = true
      and profile.stable_eligible = true and profile.kyc_status = 'approved'
  ) then raise exception 'Tu acceso Stablecoin ya no está activo'; end if;

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
     new.admin_note is distinct from old.admin_note or
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

  if old.status not in ('waiting_payment', 'correction_requested') or new.status <> 'proof_submitted' then
    raise exception 'Invalid customer status transition';
  end if;
  if new.proof_path is null or new.proof_name is null or new.proof_mime_type <> 'application/pdf' then
    raise exception 'A PDF proof is required';
  end if;

  select account.weekly_limit, account.is_active,
    case when old.payment_rail = 'ACH' then account.ach_enabled else account.wire_enabled end
  into account_limit, account_active, rail_available
  from public.payment_accounts account where account.id = old.receiving_account_id for update;

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

revoke all on function public.create_stable_operation(numeric, text, text, text, uuid, boolean) from public, anon;
grant execute on function public.create_stable_operation(numeric, text, text, text, uuid, boolean) to authenticated;
revoke all on function public.create_stable_operation(numeric, text, text, text) from public, anon;
grant execute on function public.create_stable_operation(numeric, text, text, text) to authenticated;
revoke all on function public.protect_stable_user_update() from public, anon, authenticated;

revoke all on public.stable_senders from authenticated;
grant select, insert on public.stable_senders to authenticated;
grant update (sender_type, legal_name, email, phone, bank_name, account_last4, is_active)
  on public.stable_senders to authenticated;
grant select, insert, update, delete on public.stable_operation_documents to authenticated;

commit;
