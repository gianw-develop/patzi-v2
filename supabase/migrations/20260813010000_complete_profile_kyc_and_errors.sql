-- Complete the customer profile, KYC and operational error flows.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"email_transfers":true,"email_promotions":false,"push_transfers":true,"push_rates":false}'::JSONB;

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  kyc_submission_allowed BOOLEAN := FALSE;
BEGIN
  kyc_submission_allowed :=
    auth.uid() = OLD.id
    AND current_setting('patzi.kyc_submission', TRUE) = 'on'
    AND OLD.kyc_status IN ('not_submitted', 'rejected')
    AND NEW.kyc_status = 'pending'
    AND NEW.kyc_document_url LIKE auth.uid()::TEXT || '/%'
    AND NEW.kyc_rejection_reason IS NULL
    AND NEW.kyc_submitted_at IS NOT NULL
    AND NEW.kyc_reviewed_at IS NULL;

  IF NOT public.is_admin() AND (
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.is_active IS DISTINCT FROM OLD.is_active OR
    NEW.stable_eligible IS DISTINCT FROM OLD.stable_eligible OR
    NEW.stable_approved_at IS DISTINCT FROM OLD.stable_approved_at OR
    NEW.stable_approved_by IS DISTINCT FROM OLD.stable_approved_by OR
    NEW.risk_level IS DISTINCT FROM OLD.risk_level OR
    (
      (
        NEW.kyc_status IS DISTINCT FROM OLD.kyc_status OR
        NEW.kyc_document_url IS DISTINCT FROM OLD.kyc_document_url OR
        NEW.kyc_rejection_reason IS DISTINCT FROM OLD.kyc_rejection_reason OR
        NEW.kyc_submitted_at IS DISTINCT FROM OLD.kyc_submitted_at OR
        NEW.kyc_reviewed_at IS DISTINCT FROM OLD.kyc_reviewed_at
      )
      AND NOT kyc_submission_allowed
    )
  ) THEN
    RAISE EXCEPTION 'Sensitive profile fields can only be changed by an administrator';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_my_kyc_document(document_path TEXT)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF document_path IS NULL OR document_path NOT LIKE auth.uid()::TEXT || '/%' THEN
    RAISE EXCEPTION 'Invalid KYC document path';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = 'kyc-documents'
      AND name = document_path
      AND owner_id = auth.uid()::TEXT
  ) THEN
    RAISE EXCEPTION 'KYC document not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = TRUE
      AND kyc_status IN ('not_submitted', 'rejected')
  ) THEN
    RAISE EXCEPTION 'KYC cannot be submitted in the current state';
  END IF;

  PERFORM set_config('patzi.kyc_submission', 'on', TRUE);

  UPDATE public.profiles
  SET kyc_status = 'pending',
      kyc_document_url = document_path,
      kyc_rejection_reason = NULL,
      kyc_submitted_at = NOW(),
      kyc_reviewed_at = NULL
  WHERE id = auth.uid()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_my_kyc_document(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_my_kyc_document(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_kyc(
  target_user_id UUID,
  review_status TEXT,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF review_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Review status must be approved or rejected';
  END IF;

  IF review_status = 'rejected' AND NULLIF(BTRIM(rejection_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A rejection reason is required';
  END IF;

  UPDATE public.profiles
  SET kyc_status = review_status,
      kyc_rejection_reason = CASE
        WHEN review_status = 'rejected' THEN LEFT(BTRIM(rejection_reason), 500)
        ELSE NULL
      END,
      kyc_reviewed_at = NOW()
  WHERE id = target_user_id
    AND kyc_status = 'pending'
    AND kyc_document_url IS NOT NULL
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Pending KYC request not found';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_kyc(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_kyc(UUID, TEXT, TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS public.account_closure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS account_closure_active_user_unique
  ON public.account_closure_requests(user_id)
  WHERE status IN ('pending', 'reviewing');

ALTER TABLE public.account_closure_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users create own closure requests" ON public.account_closure_requests;
CREATE POLICY "Users create own closure requests"
  ON public.account_closure_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Users view own closure requests" ON public.account_closure_requests;
CREATE POLICY "Users view own closure requests"
  ON public.account_closure_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage closure requests" ON public.account_closure_requests;
CREATE POLICY "Admins manage closure requests"
  ON public.account_closure_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.account_closure_requests TO authenticated;

CREATE TABLE IF NOT EXISTS public.client_error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (CHAR_LENGTH(message) BETWEEN 1 AND 500),
  digest TEXT CHECK (digest IS NULL OR CHAR_LENGTH(digest) <= 120),
  path TEXT CHECK (path IS NULL OR CHAR_LENGTH(path) <= 300),
  user_agent TEXT CHECK (user_agent IS NULL OR CHAR_LENGTH(user_agent) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_error_reports_created_idx
  ON public.client_error_reports (created_at DESC);

ALTER TABLE public.client_error_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users report own client errors" ON public.client_error_reports;
CREATE POLICY "Users report own client errors"
  ON public.client_error_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view client errors" ON public.client_error_reports;
CREATE POLICY "Admins view client errors"
  ON public.client_error_reports FOR SELECT TO authenticated
  USING (public.is_admin());

GRANT INSERT, SELECT ON public.client_error_reports TO authenticated;

DROP POLICY IF EXISTS "Users delete own KYC documents" ON storage.objects;
CREATE POLICY "Users delete own KYC documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

COMMIT;
