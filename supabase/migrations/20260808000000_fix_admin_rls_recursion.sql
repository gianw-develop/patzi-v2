-- Prevent recursive evaluation of the profiles RLS policy.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage all wallets" ON public.wallets;
CREATE POLICY "Admins manage all wallets"
  ON public.wallets
  FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage all transfers" ON public.transfers;
CREATE POLICY "Admins manage all transfers"
  ON public.transfers
  FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can modify rates" ON public.exchange_rates;
CREATE POLICY "Only admins can modify rates"
  ON public.exchange_rates
  FOR ALL
  USING (public.is_admin());
