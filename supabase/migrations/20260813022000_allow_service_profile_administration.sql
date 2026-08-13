CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  kyc_submission_allowed BOOLEAN := FALSE;
  privileged_actor BOOLEAN := auth.role() = 'service_role' OR public.is_admin();
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

  IF NOT privileged_actor AND (
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
      ) AND NOT kyc_submission_allowed
    )
  ) THEN
    RAISE EXCEPTION 'Sensitive profile fields can only be changed by an administrator';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;
