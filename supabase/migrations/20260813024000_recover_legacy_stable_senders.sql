begin;

create or replace function public.attach_stable_sender(
  p_operation_id uuid,
  p_sender_id uuid,
  p_sender_account_confirmed boolean
)
returns public.stable_operations
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_operation public.stable_operations%rowtype;
  selected_sender public.stable_senders%rowtype;
begin
  if auth.uid() is null then raise exception 'Tu sesión ha caducado'; end if;
  if p_sender_account_confirmed is not true then
    raise exception 'Confirma quién es el titular de la cuenta que enviará los USD';
  end if;

  select * into selected_operation
  from public.stable_operations operation
  where operation.id = p_operation_id
    and operation.user_id = auth.uid()
  for update;

  if selected_operation.id is null then raise exception 'Operación no encontrada'; end if;
  if selected_operation.sender_id is not null then return selected_operation; end if;
  if selected_operation.status not in ('waiting_payment', 'correction_requested') then
    raise exception 'El remitente ya no puede cambiarse en este estado';
  end if;
  if selected_operation.proof_path is not null then
    raise exception 'Contacta con soporte para corregir el remitente de esta operación';
  end if;

  if not exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid() and profile.is_active = true
      and profile.stable_eligible = true and profile.kyc_status = 'approved'
  ) then
    raise exception 'Tu cuenta no está habilitada para operar con Stablecoin';
  end if;

  select * into selected_sender
  from public.stable_senders sender
  where sender.id = p_sender_id
    and sender.user_id = auth.uid()
    and sender.is_active = true;

  if selected_sender.id is null then raise exception 'Selecciona un remitente USD válido'; end if;

  perform pg_catalog.set_config('patzi.attach_stable_sender', 'on', true);

  update public.stable_operations
  set sender_id = selected_sender.id,
      sender_type = selected_sender.sender_type,
      sender_legal_name = selected_sender.legal_name,
      sender_email = selected_sender.email,
      sender_phone = selected_sender.phone,
      sender_bank_name = selected_sender.bank_name,
      sender_account_last4 = selected_sender.account_last4,
      sender_confirmed_at = now(),
      updated_at = now()
  where id = selected_operation.id
  returning * into selected_operation;

  insert into public.stable_operation_history (
    operation_id, status, label, actor_id, actor_name
  ) values (
    selected_operation.id, selected_operation.status, 'Remitente USD registrado',
    auth.uid(), selected_sender.legal_name
  );

  return selected_operation;
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
  ) then raise exception 'Tu acceso Stablecoin ya no está activo'; end if;

  if attaching_sender then
    if old.sender_id is not null or new.sender_id is null
       or old.status not in ('waiting_payment', 'correction_requested')
       or new.status is distinct from old.status
       or new.proof_path is distinct from old.proof_path then
      raise exception 'Invalid sender recovery';
    end if;
    new.updated_at := now();
    return new;
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

  if old.sender_id is null then
    raise exception 'Registra el remitente USD antes de cargar el comprobante';
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

alter table public.stable_operations
  drop constraint if exists stable_sender_required_for_processing;
alter table public.stable_operations
  add constraint stable_sender_required_for_processing
  check (
    status in ('waiting_payment', 'correction_requested', 'blocked')
    or sender_id is not null
  ) not valid;

revoke all on function public.attach_stable_sender(uuid, uuid, boolean) from public, anon;
grant execute on function public.attach_stable_sender(uuid, uuid, boolean) to authenticated;
revoke all on function public.protect_stable_user_update() from public, anon, authenticated;

commit;
