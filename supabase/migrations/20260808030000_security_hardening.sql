BEGIN;

-- Public configuration can be read by the landing page, but only an active
-- administrator may modify it.
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Only admins can modify platform settings" ON public.platform_settings;
CREATE POLICY "Only admins can modify platform settings"
  ON public.platform_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;

-- Pin the trigger function's object resolution to trusted schemas.
CREATE OR REPLACE FUNCTION public.generate_transfer_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'PTZ-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('public.transfer_ref_seq'::REGCLASS)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger-only SECURITY DEFINER functions must not be reachable as RPCs.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_stable_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_transfer_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_deposit_review() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_stable_user_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- These two functions are intentionally exposed only to authenticated users:
-- policies use is_admin(), and the admin RPC performs its own admin check.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_update_user_access(UUID, BOOLEAN, TEXT, BOOLEAN, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_access(UUID, BOOLEAN, TEXT, BOOLEAN, TEXT)
  TO authenticated;

COMMIT;
