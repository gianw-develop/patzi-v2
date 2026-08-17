do $$
declare
  item record;
begin
  for item in
    select
      operation.id,
      operation.reference,
      profile.full_name as patzi_user,
      operation.sender_legal_name as sender,
      operation.usd_amount,
      operation.bank_received_amount,
      operation.status,
      operation.payment_rail,
      account.account_holder,
      account.bank_name,
      right(account.iban_account, 4) as account_last4,
      operation.created_at,
      operation.proof_uploaded_at,
      operation.proof_name
    from public.stable_operations operation
    join public.profiles profile on profile.id = operation.user_id
    left join public.payment_accounts account on account.id = operation.receiving_account_id
    where lower(coalesce(profile.full_name, '')) like '%hamza%'
    order by coalesce(operation.proof_uploaded_at, operation.created_at), operation.created_at
  loop
    raise notice 'HAMZA_ROW|%|%|%|%|%|%|%|%|%|%|%|%|%|%',
      item.id,
      item.reference,
      item.patzi_user,
      coalesce(item.sender, ''),
      item.usd_amount,
      coalesce(item.bank_received_amount::text, ''),
      item.status,
      item.payment_rail,
      coalesce(item.account_holder, ''),
      coalesce(item.bank_name, ''),
      coalesce(item.account_last4, ''),
      item.created_at,
      coalesce(item.proof_uploaded_at::text, ''),
      coalesce(item.proof_name, '');
  end loop;
end;
$$;
