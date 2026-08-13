DROP POLICY IF EXISTS "Admins can view all transfer history" ON public.transfer_status_history;
CREATE POLICY "Admins can view all transfer history"
ON public.transfer_status_history
FOR SELECT
TO authenticated
USING (public.is_admin());

GRANT SELECT ON public.transfer_status_history TO authenticated;
