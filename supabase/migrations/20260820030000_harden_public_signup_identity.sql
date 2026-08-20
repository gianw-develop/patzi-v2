begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_name text := regexp_replace(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '\s+', ' ', 'g');
  normalized_phone text := trim(coalesce(new.raw_user_meta_data->>'phone', ''));
  phone_digits text := regexp_replace(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '[^0-9]', '', 'g');
  initial_role text := 'user';
begin
  if normalized_name !~ '^[[:alpha:]][[:alpha:]''’.-]+( [[:alpha:]][[:alpha:]''’.-]+)+$'
    or char_length(normalized_name) < 5
    or char_length(normalized_name) > 100 then
    raise exception 'Introduce tu nombre y apellido reales';
  end if;

  if char_length(phone_digits) < 8 or char_length(phone_digits) > 15 then
    raise exception 'Introduce un teléfono válido';
  end if;

  if exists (
    select 1
    from public.admin_email_allowlist
    where lower(email) = lower(new.email)
  ) then
    initial_role := 'admin';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    country,
    role,
    kyc_status,
    stable_eligible,
    is_active
  ) values (
    new.id,
    coalesce(new.email, ''),
    normalized_name,
    normalized_phone,
    nullif(new.raw_user_meta_data->>'country', ''),
    initial_role,
    'not_submitted',
    false,
    initial_role = 'admin'
  ) on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

commit;
