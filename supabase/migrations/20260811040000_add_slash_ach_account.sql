begin;

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
)
select
  gen_random_uuid(),
  'USD',
  'bank',
  'Slash Bank · ACH',
  'MarketCreatorPro Media & Digital LLC',
  'Slash / Column N.A., Member FDIC',
  '953711271941788',
  '121145307',
  true,
  false,
  null,
  'checking',
  'Beneficiary address: 30 N Gould St, Sheridan, WY 82801-6317, US.',
  true,
  false,
  true,
  20000
where not exists (
  select 1
  from public.payment_accounts
  where currency = 'USD'
    and iban_account = '953711271941788'
);

commit;
