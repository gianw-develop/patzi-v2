begin;

do $$
declare
  test_admin_id uuid;
  test_account_id uuid;
  test_sender_id uuid;
  test_operation public.stable_operations;
  usage_before numeric;
  usage_after numeric;
begin
  select id into test_admin_id
  from public.profiles
  where role = 'admin' and is_active = true
  limit 1;

  if test_admin_id is null then
    raise exception 'Capacity test requires an active admin profile';
  end if;

  perform set_config('request.jwt.claim.sub', test_admin_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  update public.profiles
  set stable_eligible = true, kyc_status = 'approved', role = 'user'
  where id = test_admin_id;

  update public.payment_accounts
  set is_active = false
  where currency = 'USD' and method_type = 'bank' and for_deposits = true;

  insert into public.stable_senders (
    user_id, sender_type, legal_name, email, phone, bank_name, account_last4
  ) values (
    test_admin_id, 'business', 'Patzi Capacity Sender',
    'capacity-test@patzi.net', '+12025550123', 'Test Origin Bank', '0123'
  ) returning id into test_sender_id;

  insert into public.payment_accounts (
    currency, method_type, method_name, account_holder, bank_name,
    iban_account, routing_number, wire_enabled, wire_routing_number,
    for_deposits, for_payouts, is_active, weekly_limit
  ) values (
    'USD', 'bank', 'Transferencia bancaria', 'Patzi Capacity Test', 'Test Bank',
    'TEST-0001', '021000021', true, '026009593', true, false, true, 20000
  ) returning id into test_account_id;

  usage_before := public.stable_account_weekly_usage(test_account_id);
  if usage_before <> 0 then
    raise exception 'Expected zero initial usage, got %', usage_before;
  end if;

  test_operation := public.create_stable_operation(
    1000,
    'USDT',
    '0x0000000000000000000000000000000000000000',
    'WIRE',
    test_sender_id,
    true
  );

  if test_operation.receiving_account_id <> test_account_id then
    raise exception 'Balanced assignment selected an unexpected account';
  end if;

  if test_operation.payment_rail <> 'WIRE' then
    raise exception 'Expected a Wire operation, got %', test_operation.payment_rail;
  end if;

  usage_after := public.stable_account_weekly_usage(test_account_id);
  if usage_after <> 1000 then
    raise exception 'Expected a 1000 USD reservation, got %', usage_after;
  end if;

  update public.stable_operations
  set proof_path = 'test/proof.pdf',
      proof_name = 'proof.pdf',
      proof_mime_type = 'application/pdf',
      proof_size = 1000,
      status = 'proof_submitted'
  where id = test_operation.id;

  usage_after := public.stable_account_weekly_usage(test_account_id);
  if usage_after <> 1000 then
    raise exception 'Proof confirmation double-counted capacity: %', usage_after;
  end if;

  begin
    perform public.create_stable_operation(
      19500,
      'USDC',
      '0x1111111111111111111111111111111111111111',
      'WIRE',
      test_sender_id,
      true
    );
    raise exception 'Expected capacity overflow to be blocked';
  exception
    when others then
      if sqlerrm not like 'No hay una cuenta USD compatible con WIRE y con cupo suficiente%' then
        raise;
      end if;
  end;

  raise notice 'PASS: 20k weekly capacity, sender snapshot, reservation, proof consolidation and overflow block';
end;
$$;

rollback;
