begin;

alter table public.stable_operations
  add column if not exists bank_received_amount numeric(18, 2),
  add column if not exists bank_fee_amount numeric(18, 2)
    generated always as (
      case when bank_received_amount is null then null
      else round(usd_amount - bank_received_amount, 2) end
    ) stored,
  add column if not exists settlement_fee_amount numeric(18, 2)
    generated always as (
      case when bank_received_amount is null then null
      else round(bank_received_amount * (fee_percent / 100), 2) end
    ) stored,
  add column if not exists settlement_delivery_amount numeric(18, 2)
    generated always as (
      case when bank_received_amount is null then null
      else round(bank_received_amount * (1 - fee_percent / 100), 2) end
    ) stored;

alter table public.stable_operations
  drop constraint if exists stable_operations_bank_received_amount_check,
  add constraint stable_operations_bank_received_amount_check
  check (
    bank_received_amount is null
    or (bank_received_amount > 0 and bank_received_amount <= usd_amount)
  );

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
  select coalesce(sum(coalesce(operation.bank_received_amount, operation.usd_amount)), 0)::numeric
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

create or replace function public.admin_reconcile_stable_operation(
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
  reconciled_operation public.stable_operations%rowtype;
  normalized_amount numeric(18, 2) := round(p_bank_received_amount, 2);
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select * into selected_operation
  from public.stable_operations
  where id = p_operation_id
  for update;

  if selected_operation.id is null then
    raise exception 'Operación no encontrada';
  end if;
  if selected_operation.status not in ('proof_submitted', 'verifying', 'payment_received') then
    raise exception 'Solo puedes conciliar una operación antes de preparar la entrega Stable';
  end if;
  if selected_operation.proof_path is null then
    raise exception 'La operación no tiene comprobante';
  end if;
  if selected_operation.sender_id is null then
    raise exception 'La operación no tiene remitente identificado';
  end if;
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Introduce el monto que realmente llegó al banco';
  end if;
  if normalized_amount > selected_operation.usd_amount then
    raise exception 'El monto recibido no puede superar el monto enviado';
  end if;

  update public.stable_operations
  set bank_received_amount = normalized_amount,
      status = case
        when selected_operation.status in ('proof_submitted', 'verifying') then 'payment_received'
        else selected_operation.status
      end
  where id = p_operation_id
  returning * into reconciled_operation;

  return reconciled_operation;
end;
$$;

create or replace function public.admin_delete_stable_operation(p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_operation public.stable_operations%rowtype;
  document_paths jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select * into selected_operation
  from public.stable_operations
  where id = p_operation_id
  for update;

  if selected_operation.id is null then
    raise exception 'Operación no encontrada';
  end if;

  select coalesce(jsonb_agg(storage_path), '[]'::jsonb)
  into document_paths
  from public.stable_operation_documents
  where operation_id = p_operation_id;

  delete from public.stable_operations where id = p_operation_id;

  return jsonb_build_object(
    'reference', selected_operation.reference,
    'proof_path', selected_operation.proof_path,
    'document_paths', document_paths
  );
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
       or new.proof_path is distinct from old.proof_path
       or new.bank_received_amount is distinct from old.bank_received_amount then
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

  if old.sender_id is null then raise exception 'Registra el remitente USD antes de cargar el comprobante'; end if;
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

revoke all on function public.admin_reconcile_stable_operation(uuid, numeric) from public, anon;
grant execute on function public.admin_reconcile_stable_operation(uuid, numeric) to authenticated;
revoke all on function public.admin_delete_stable_operation(uuid) from public, anon;
grant execute on function public.admin_delete_stable_operation(uuid) to authenticated;
revoke all on function public.protect_stable_user_update() from public, anon, authenticated;

commit;
