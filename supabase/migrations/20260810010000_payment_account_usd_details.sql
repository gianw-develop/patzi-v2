begin;

alter table public.payment_accounts
  add column if not exists routing_number text,
  add column if not exists account_type text;

alter table public.payment_accounts
  drop constraint if exists payment_accounts_account_type_check,
  add constraint payment_accounts_account_type_check
    check (account_type is null or account_type in ('checking', 'savings', 'current', 'other'));

commit;
