begin;

alter table public.payment_accounts
  alter column weekly_limit set default 20000;

update public.payment_accounts
set weekly_limit = 20000
where currency = 'USD'
  and method_type = 'bank'
  and for_deposits = true;

commit;
