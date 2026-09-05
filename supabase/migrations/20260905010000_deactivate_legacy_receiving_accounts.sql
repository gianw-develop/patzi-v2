begin;

do $$
declare
  matched_count integer;
begin
  update public.payment_accounts
  set is_active = false
  where currency = 'USD'
    and method_type = 'bank'
    and (
      lower(trim(account_holder)) = 'aw gotravel llc'
      or lower(trim(account_holder)) = 'solutions consult llc'
      or lower(account_holder) like '%orbis%'
    );

  get diagnostics matched_count = row_count;
  if matched_count = 0 then
    raise exception 'No matching legacy receiving accounts were found';
  end if;

  if exists (
    select 1
    from public.payment_accounts
    where currency = 'USD'
      and method_type = 'bank'
      and is_active = true
      and (
        lower(trim(account_holder)) = 'aw gotravel llc'
        or lower(trim(account_holder)) = 'solutions consult llc'
        or lower(account_holder) like '%orbis%'
      )
  ) then
    raise exception 'One or more legacy receiving accounts remain active';
  end if;

  raise notice 'Deactivated % legacy receiving account(s)', matched_count;
end;
$$;

commit;
