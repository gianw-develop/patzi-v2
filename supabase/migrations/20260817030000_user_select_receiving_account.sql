begin;

create or replace function public.create_stable_operation(
  p_usd_amount numeric,
  p_asset text,
  p_wallet_address text,
  p_payment_rail text,
  p_sender_id uuid,
  p_sender_account_confirmed boolean,
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
  normalized_rail text := upper(p_payment_rail);
begin
  if auth.uid() is null then raise exception 'Tu sesión ha caducado'; end if;
  if p_usd_amount is null or p_usd_amount <= 0 then raise exception 'Introduce un monto válido en USD'; end if;
  if p_asset not in ('USDT', 'USDC') then raise exception 'Stablecoin no admitida'; end if;
  if normalized_rail not in ('ACH', 'WIRE') then raise exception 'Selecciona ACH o Wire'; end if;
  if p_wallet_address is null or p_wallet_address !~ '^0x[0-9A-Fa-f]{40}$' then raise exception 'Introduce una wallet Ethereum válida'; end if;
  if p_sender_account_confirmed is not true then raise exception 'Confirma quién es el titular de la cuenta que enviará los USD'; end if;
  if p_receiving_account_id is null then raise exception 'Selecciona la cuenta bancaria donde realizarás el depósito'; end if;

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
  where account.id = p_receiving_account_id
    and account.currency = 'USD' and account.method_type = 'bank'
    and account.for_deposits = true and account.is_active = true
    and ((normalized_rail = 'ACH' and account.ach_enabled = true)
      or (normalized_rail = 'WIRE' and account.wire_enabled = true))
    and account.weekly_limit - public.stable_account_weekly_usage(account.id) >= p_usd_amount
  for update;

  if selected_account.id is null then
    raise exception 'La cuenta seleccionada ya no está disponible para % o no tiene cupo suficiente. Elige otra cuenta.', normalized_rail;
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

revoke all on function public.create_stable_operation(numeric, text, text, text, uuid, boolean, uuid) from public, anon;
grant execute on function public.create_stable_operation(numeric, text, text, text, uuid, boolean, uuid) to authenticated;

commit;
