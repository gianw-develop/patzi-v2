begin;

-- Historical bank-reconciled deposits supplied by Patzi administration.
-- They remain pending until an admin explicitly approves each one.
do $$
declare
  target_user constant uuid := '7c69cdfa-8b02-4971-b31c-0cb3e455cb16';
  nexo_account uuid;
  forge_account uuid;
  gotravel_account uuid;
  sender_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = target_user and stable_eligible = true and kyc_status = 'approved'
  ) then raise exception 'Hamza is not eligible for Stable'; end if;

  select id into nexo_account from public.payment_accounts
  where account_holder = 'NexoMind AI LLC' and currency = 'USD' and is_active = true
  limit 1;
  select id into forge_account from public.payment_accounts
  where account_holder = 'AWFORGE LLC' and currency = 'USD' and is_active = true
  limit 1;
  select id into gotravel_account from public.payment_accounts
  where account_holder = 'AW Gotravel LLC' and currency = 'USD' and is_active = true
  limit 1;

  if nexo_account is null or forge_account is null or gotravel_account is null then
    raise exception 'One or more historical receiving accounts are missing';
  end if;

  -- Farhan K Siddiqui Or Mariam Siddi
  select id into sender_id from public.stable_senders where user_id = target_user and lower(legal_name) = lower('Farhan K Siddiqui Or Mariam Siddi') order by created_at limit 1;
  if sender_id is null then
    insert into public.stable_senders (user_id, sender_type, legal_name, email, phone, bank_name)
    values (target_user, 'person', 'Farhan K Siddiqui Or Mariam Siddi', 'abdul786nyc@gmail.com', '+1 347-251-7911', 'No registrado') returning id into sender_id;
  else
    update public.stable_senders set email='abdul786nyc@gmail.com', phone='+1 347-251-7911' where id=sender_id;
  end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-04082601',target_user,6000,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Farhan K Siddiqui Or Mariam Siddi','abdul786nyc@gmail.com','+1 347-251-7911','No registrado',timestamptz '2026-08-04 12:00:00+00',5965,date '2026-08-04','Importación histórica autorizada por administración',timestamptz '2026-08-04 12:00:00+00',now()
  where not exists (select 1 from public.stable_operations where reference='PTZ-04082601');

  -- Rashid Mehmood Zaidi Or Roohi Ras
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Rashid Mehmood Zaidi Or Roohi Ras') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Rashid Mehmood Zaidi Or Roohi Ras','rashidzaidi@gmail.com','+1 862-251-2839','No registrado') returning id into sender_id;
  else update public.stable_senders set email='rashidzaidi@gmail.com',phone='+1 862-251-2839' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-04082602',target_user,4000,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Rashid Mehmood Zaidi Or Roohi Ras','rashidzaidi@gmail.com','+1 862-251-2839','No registrado',timestamptz '2026-08-04 12:01:00+00',3965,date '2026-08-04','Importación histórica autorizada por administración',timestamptz '2026-08-04 12:01:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-04082602');

  -- Abdullah Azizi
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Abdullah Azizi') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Abdullah Azizi','786.azizi@gmail.com','+1 737-203-0470','No registrado') returning id into sender_id;
  else update public.stable_senders set email='786.azizi@gmail.com',phone='+1 737-203-0470' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-10082601',target_user,1500,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Abdullah Azizi','786.azizi@gmail.com','+1 737-203-0470','No registrado',timestamptz '2026-08-10 12:00:00+00',1465,date '2026-08-10','Importación histórica autorizada por administración',timestamptz '2026-08-10 12:00:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-10082601');

  -- Nivine Mukhales
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Nivine Mukhales') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Nivine Mukhales','nivinemukh@gmail.com','+1 786-809-7788','No registrado') returning id into sender_id;
  else update public.stable_senders set email='nivinemukh@gmail.com',phone='+1 786-809-7788' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-10082602',target_user,3000,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Nivine Mukhales','nivinemukh@gmail.com','+1 786-809-7788','No registrado',timestamptz '2026-08-10 12:01:00+00',2965,date '2026-08-10','Importación histórica autorizada por administración',timestamptz '2026-08-10 12:01:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-10082602');

  -- Hasan S Zia
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Hasan S Zia') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Hasan S Zia','ziahasan217@gmail.com','+1 516-507-8651','No registrado') returning id into sender_id;
  else update public.stable_senders set email='ziahasan217@gmail.com',phone='+1 516-507-8651' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-11082601',target_user,8000,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Hasan S Zia','ziahasan217@gmail.com','+1 516-507-8651','No registrado',timestamptz '2026-08-11 12:00:00+00',7965,date '2026-08-11','Importación histórica autorizada por administración',timestamptz '2026-08-11 12:00:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-11082601');

  -- Shayan Patel
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Shayan Patel') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Shayan Patel','theiqbalpatel786@gmail.com','+1 310-923-1474','No registrado') returning id into sender_id;
  else update public.stable_senders set email='theiqbalpatel786@gmail.com',phone='+1 310-923-1474' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-12082601',target_user,4000,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Shayan Patel','theiqbalpatel786@gmail.com','+1 310-923-1474','No registrado',timestamptz '2026-08-12 12:00:00+00',3965,date '2026-08-12','Importación histórica autorizada por administración',timestamptz '2026-08-12 12:00:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-12082601');

  -- Quang Cong Thanh
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Quang Cong Thanh') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Quang Cong Thanh','congquang1272@gmail.com','+1 408-382-1517','No registrado') returning id into sender_id;
  else update public.stable_senders set email='congquang1272@gmail.com',phone='+1 408-382-1517' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-12082602',target_user,3000,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Quang Cong Thanh','congquang1272@gmail.com','+1 408-382-1517','No registrado',timestamptz '2026-08-12 12:01:00+00',2965,date '2026-08-12','Importación histórica autorizada por administración',timestamptz '2026-08-12 12:01:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-12082602');

  -- Muhammad Umar Iqbal (bank descriptor: Muhammad U Unia)
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Muhammad Umar Iqbal') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Muhammad Umar Iqbal','umar7072@gmail.com','+1 714-814-8408','No registrado') returning id into sender_id;
  else update public.stable_senders set email='umar7072@gmail.com',phone='+1 714-814-8408' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-12082603',target_user,7500,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Muhammad Umar Iqbal','umar7072@gmail.com','+1 714-814-8408','No registrado',timestamptz '2026-08-12 12:02:00+00',7465,date '2026-08-12','Importación histórica autorizada por administración',timestamptz '2026-08-12 12:02:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-12082603');

  -- Tyrone T Oglesby
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Tyrone T Oglesby') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Tyrone T Oglesby','teeoh1974@gmail.com','+1 215-669-6205','No registrado') returning id into sender_id;
  else update public.stable_senders set email='teeoh1974@gmail.com',phone='+1 215-669-6205' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-12082604',target_user,5000,10,'USDT','ethereum_erc20',forge_account,'proof_submitted','low','WIRE',sender_id,'person','Tyrone T Oglesby','teeoh1974@gmail.com','+1 215-669-6205','No registrado',timestamptz '2026-08-12 12:03:00+00',4965,date '2026-08-12','Importación histórica autorizada por administración',timestamptz '2026-08-12 12:03:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-12082604');

  -- Kazeem Ur Rehman Qazi
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Kazeem Ur Rehman Qazi') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Kazeem Ur Rehman Qazi','kazeemqazi@yahoo.com','+1 810-348-7078','No registrado') returning id into sender_id;
  else update public.stable_senders set email='kazeemqazi@yahoo.com',phone='+1 810-348-7078' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-13082601',target_user,2000,10,'USDT','ethereum_erc20',gotravel_account,'proof_submitted','low','WIRE',sender_id,'person','Kazeem Ur Rehman Qazi','kazeemqazi@yahoo.com','+1 810-348-7078','No registrado',timestamptz '2026-08-13 12:00:00+00',1965,date '2026-08-13','Importación histórica autorizada por administración',timestamptz '2026-08-13 12:00:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-13082601');

  -- Mohammad S Shaikh (bank descriptor: Mohammed S Shaikh)
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Mohammad S Shaikh') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Mohammad S Shaikh','munirasheikh076@gmail.com','+1 224-607-8167','No registrado') returning id into sender_id;
  else update public.stable_senders set email='munirasheikh076@gmail.com',phone='+1 224-607-8167' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-14082601',target_user,3965,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Mohammad S Shaikh','munirasheikh076@gmail.com','+1 224-607-8167','No registrado',timestamptz '2026-08-14 12:00:00+00',3930,date '2026-08-14','Importación histórica autorizada por administración',timestamptz '2026-08-14 12:00:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-14082601');

  -- Sohaib Pasha
  select id into sender_id from public.stable_senders where user_id=target_user and lower(legal_name)=lower('Sohaib Pasha') order by created_at limit 1;
  if sender_id is null then insert into public.stable_senders (user_id,sender_type,legal_name,email,phone,bank_name) values (target_user,'person','Sohaib Pasha','13spasha@gmail.com','+1 832-758-6896','No registrado') returning id into sender_id;
  else update public.stable_senders set email='13spasha@gmail.com',phone='+1 832-758-6896' where id=sender_id; end if;
  insert into public.stable_operations (reference,user_id,usd_amount,fee_percent,asset,network,receiving_account_id,status,risk,payment_rail,sender_id,sender_type,sender_legal_name,sender_email,sender_phone,sender_bank_name,sender_confirmed_at,bank_received_amount,deposit_date,admin_note,created_at,updated_at)
  select 'PTZ-17082601',target_user,3000,10,'USDT','ethereum_erc20',nexo_account,'proof_submitted','low','WIRE',sender_id,'person','Sohaib Pasha','13spasha@gmail.com','+1 832-758-6896','No registrado',timestamptz '2026-08-17 12:00:00+00',2965,date '2026-08-17','Importación histórica autorizada por administración',timestamptz '2026-08-17 12:00:00+00',now() where not exists (select 1 from public.stable_operations where reference='PTZ-17082601');
end;
$$;

-- Admin approval normally requires a client proof. Historical imports are
-- explicitly tagged and may be approved from the reconciled bank record.
create or replace function public.admin_approve_stable_deposit(
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
  approved_operation public.stable_operations%rowtype;
  normalized_amount numeric(18, 2) := round(p_bank_received_amount, 2);
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
  select * into selected_operation from public.stable_operations where id = p_operation_id for update;
  if selected_operation.id is null then raise exception 'Depósito no encontrado'; end if;
  if selected_operation.status not in ('proof_submitted', 'verifying', 'correction_requested') then raise exception 'Este depósito ya fue decidido'; end if;
  if selected_operation.proof_path is null
     and selected_operation.admin_note is distinct from 'Importación histórica autorizada por administración'
  then raise exception 'El depósito no tiene comprobante'; end if;
  if normalized_amount is null or normalized_amount <= 0 or normalized_amount > selected_operation.usd_amount then
    raise exception 'El monto real debe ser mayor que cero y no superar el monto declarado';
  end if;
  update public.stable_operations
  set bank_received_amount = normalized_amount, asset = 'USDT', status = 'payment_received', admin_note = null
  where id = p_operation_id returning * into approved_operation;
  return approved_operation;
end;
$$;

revoke all on function public.admin_approve_stable_deposit(uuid, numeric) from public, anon;
grant execute on function public.admin_approve_stable_deposit(uuid, numeric) to authenticated;

commit;
