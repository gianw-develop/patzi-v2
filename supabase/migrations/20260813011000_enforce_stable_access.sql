-- Stable eligibility can only be granted after an approved KYC review.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_update_user_access(
  target_user_id UUID,
  new_stable_eligible BOOLEAN DEFAULT NULL,
  new_kyc_status TEXT DEFAULT NULL,
  new_is_active BOOLEAN DEFAULT NULL,
  new_risk_level TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.profiles;
  current_kyc_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF new_kyc_status IS NOT NULL AND new_kyc_status NOT IN ('not_submitted', 'pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid KYC status';
  END IF;
  IF new_risk_level IS NOT NULL AND new_risk_level NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'Invalid risk level';
  END IF;

  SELECT kyc_status INTO current_kyc_status
  FROM public.profiles
  WHERE id = target_user_id;

  IF new_stable_eligible IS TRUE AND COALESCE(new_kyc_status, current_kyc_status) <> 'approved' THEN
    RAISE EXCEPTION 'KYC approval is required before Stable access';
  END IF;

  UPDATE public.profiles
  SET stable_eligible = CASE
        WHEN new_kyc_status IS NOT NULL AND new_kyc_status <> 'approved' THEN FALSE
        ELSE COALESCE(new_stable_eligible, stable_eligible)
      END,
      stable_approved_at = CASE
        WHEN new_kyc_status IS NOT NULL AND new_kyc_status <> 'approved' THEN NULL
        WHEN new_stable_eligible IS TRUE THEN NOW()
        WHEN new_stable_eligible IS FALSE THEN NULL
        ELSE stable_approved_at
      END,
      stable_approved_by = CASE
        WHEN new_stable_eligible IS NOT NULL OR (new_kyc_status IS NOT NULL AND new_kyc_status <> 'approved') THEN auth.uid()
        ELSE stable_approved_by
      END,
      kyc_status = COALESCE(new_kyc_status, kyc_status),
      kyc_reviewed_at = CASE WHEN new_kyc_status IS NOT NULL THEN NOW() ELSE kyc_reviewed_at END,
      is_active = COALESCE(new_is_active, is_active),
      risk_level = COALESCE(new_risk_level, risk_level)
  WHERE id = target_user_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_access(UUID, BOOLEAN, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_access(UUID, BOOLEAN, TEXT, BOOLEAN, TEXT) TO authenticated;

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
      kyc_rejection_reason = CASE WHEN review_status = 'rejected' THEN LEFT(BTRIM(rejection_reason), 500) ELSE NULL END,
      kyc_reviewed_at = NOW(),
      stable_eligible = CASE WHEN review_status = 'rejected' THEN FALSE ELSE stable_eligible END,
      stable_approved_at = CASE WHEN review_status = 'rejected' THEN NULL ELSE stable_approved_at END
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

COMMIT;
