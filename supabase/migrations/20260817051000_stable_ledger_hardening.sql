begin;

-- Deposits must be created through the new, validated USDT-only RPC.
revoke insert on public.stable_operations from authenticated;

-- Retire every historical overload, not only the most recent signature.
do $$
declare
  legacy_function regprocedure;
begin
  for legacy_function in
    select p.oid::regprocedure
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_stable_operation'
  loop
    execute format('revoke all on function %s from authenticated', legacy_function);
  end loop;
end;
$$;

-- Pending requests also reserve balance, preventing clients from requesting
-- the same available USDT several times before an admin processes it.
create or replace function public.request_stable_payout(p_amount numeric)
returns public.stable_payout_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  available numeric;
  reserved numeric;
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

  select coalesce(sum(request.requested_amount), 0)
  into reserved
  from public.stable_payout_requests request
  where request.user_id = auth.uid() and request.status = 'pending';

  if normalized_amount is null or normalized_amount <= 0 or normalized_amount > available - reserved then
    raise exception 'El monto solicitado supera tu saldo USDT disponible';
  end if;

  insert into public.stable_payout_requests (user_id, requested_amount)
  values (auth.uid(), normalized_amount)
  returning * into result;
  return result;
end;
$$;

revoke all on function public.request_stable_payout(numeric) from public, anon;
grant execute on function public.request_stable_payout(numeric) to authenticated;

commit;
