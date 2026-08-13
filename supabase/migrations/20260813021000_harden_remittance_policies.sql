DROP POLICY IF EXISTS "Users can create transfers" ON public.transfers;
DROP POLICY IF EXISTS "Users can insert own transfers" ON public.transfers;

DROP POLICY IF EXISTS "Admins manage all transfers" ON public.transfers;
CREATE POLICY "Admins manage all transfers"
ON public.transfers
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own transfers" ON public.transfers;
CREATE POLICY "Users can view own transfers"
ON public.transfers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.transfers FROM authenticated;
GRANT SELECT, UPDATE ON public.transfers TO authenticated;
