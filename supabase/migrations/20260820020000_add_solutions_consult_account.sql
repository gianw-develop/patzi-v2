begin;

do $$
begin
  update public.payment_accounts
  set
    currency = 'USD',
    method_type = 'bank',
    method_name = 'Mercury · ACH / Wire',
    account_holder = 'SOLUTIONS CONSULT LLC',
    bank_name = 'Column N.A. (Mercury)',
    routing_number = '121145433',
    ach_enabled = true,
    wire_enabled = true,
    wire_routing_number = '121145433',
    account_type = 'checking',
    instructions = 'Bank address: 1 Letterman Drive, Building A, Suite A4-700, San Francisco, CA 94129, US. Beneficiary address: 30 North Gould Street, STE N, Sheridan, WY 82801, US.',
    for_deposits = true,
    for_payouts = false,
    is_active = true,
    weekly_limit = 20000,
    updated_at = now()
  where currency = 'USD'
    and iban_account = '112432057337771';

  if not found then
    insert into public.payment_accounts (
      id,
      currency,
      method_type,
      method_name,
      account_holder,
      bank_name,
      iban_account,
      routing_number,
      ach_enabled,
      wire_enabled,
      wire_routing_number,
      account_type,
      instructions,
      for_deposits,
      for_payouts,
      is_active,
      weekly_limit
    ) values (
      gen_random_uuid(),
      'USD',
      'bank',
      'Mercury · ACH / Wire',
      'SOLUTIONS CONSULT LLC',
      'Column N.A. (Mercury)',
      '112432057337771',
      '121145433',
      true,
      true,
      '121145433',
      'checking',
      'Bank address: 1 Letterman Drive, Building A, Suite A4-700, San Francisco, CA 94129, US. Beneficiary address: 30 North Gould Street, STE N, Sheridan, WY 82801, US.',
      true,
      false,
      true,
      20000
    );
  end if;
end
$$;

commit;
