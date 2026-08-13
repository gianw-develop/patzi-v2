-- Finalize the remittance model and retire the obsolete balance/deposit module.
ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS beneficiary_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB;

UPDATE public.transfers AS transfer
SET beneficiary_snapshot = jsonb_strip_nulls(jsonb_build_object(
  'full_name', beneficiary.full_name,
  'country', beneficiary.country,
  'currency', beneficiary.currency,
  'delivery_method', beneficiary.delivery_method,
  'delivery_app', beneficiary.delivery_app,
  'bank_name', beneficiary.bank_name,
  'account_number', beneficiary.account_number,
  'phone', beneficiary.phone,
  'email', beneficiary.email,
  'cedula', beneficiary.cedula
))
FROM public.beneficiaries AS beneficiary
WHERE transfer.beneficiary_id = beneficiary.id
  AND transfer.beneficiary_snapshot = '{}'::JSONB;

CREATE OR REPLACE FUNCTION public.create_remittance_request(
  p_beneficiary_id UUID,
  p_send_currency TEXT,
  p_send_amount NUMERIC,
  p_quoted_exchange_rate NUMERIC
)
RETURNS public.transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_beneficiary public.beneficiaries%ROWTYPE;
  v_rate public.exchange_rates%ROWTYPE;
  v_base_rate NUMERIC;
  v_effective_rate NUMERIC;
  v_fee NUMERIC;
  v_receive NUMERIC;
  v_result public.transfers%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user;
  IF NOT FOUND OR NOT COALESCE(v_profile.is_active, FALSE) THEN RAISE EXCEPTION 'Your account is not active'; END IF;

  p_send_currency := upper(trim(p_send_currency));
  IF p_send_currency NOT IN ('EUR', 'USD') THEN RAISE EXCEPTION 'Unsupported source currency'; END IF;
  IF p_send_amount IS NULL OR p_send_amount < 1 OR p_send_amount > 100000 THEN
    RAISE EXCEPTION 'Amount must be between 1 and 100000';
  END IF;

  SELECT * INTO v_beneficiary FROM public.beneficiaries
  WHERE id = p_beneficiary_id AND user_id = v_user AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Beneficiary is not available'; END IF;
  IF p_send_currency = v_beneficiary.currency THEN RAISE EXCEPTION 'Currencies must be different'; END IF;

  SELECT * INTO v_rate FROM public.exchange_rates
  WHERE from_currency = p_send_currency AND to_currency = v_beneficiary.currency AND is_active = TRUE LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'This corridor is not available'; END IF;

  v_base_rate := CASE
    WHEN COALESCE(v_rate.use_custom_rate, FALSE) AND v_rate.custom_rate IS NOT NULL THEN v_rate.custom_rate
    ELSE v_rate.rate
  END;
  IF v_base_rate IS NULL OR v_base_rate <= 0 THEN RAISE EXCEPTION 'The exchange rate is not available'; END IF;

  v_effective_rate := round(v_base_rate * (1 - COALESCE(v_rate.markup_percent, 0) / 100), 8);
  IF p_quoted_exchange_rate IS NULL OR abs(p_quoted_exchange_rate - v_effective_rate) / v_effective_rate > 0.005 THEN
    RAISE EXCEPTION 'The quote changed. Please review the updated amount';
  END IF;

  v_fee := round(GREATEST(0, COALESCE(v_rate.fee_fixed, 0) + p_send_amount * COALESCE(v_rate.fee_percent, 0) / 100), 2);
  IF v_fee >= p_send_amount THEN RAISE EXCEPTION 'The amount does not cover the fee'; END IF;
  v_receive := round((p_send_amount - v_fee) * v_effective_rate, 2);

  INSERT INTO public.transfers (
    user_id, beneficiary_id, beneficiary_name, beneficiary_country, send_currency, receive_currency,
    send_amount, receive_amount, exchange_rate, fee, total_charged, delivery_method, delivery_app,
    speed, status, reference, beneficiary_snapshot
  ) VALUES (
    v_user, v_beneficiary.id, v_beneficiary.full_name, v_beneficiary.country, p_send_currency,
    v_beneficiary.currency, round(p_send_amount, 2), v_receive, v_effective_rate, v_fee,
    round(p_send_amount, 2), v_beneficiary.delivery_method, v_beneficiary.delivery_app,
    'express', 'pending', 'PTZ-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10)),
    jsonb_strip_nulls(jsonb_build_object(
      'full_name', v_beneficiary.full_name, 'country', v_beneficiary.country,
      'currency', v_beneficiary.currency, 'delivery_method', v_beneficiary.delivery_method,
      'delivery_app', v_beneficiary.delivery_app, 'bank_name', v_beneficiary.bank_name,
      'account_number', v_beneficiary.account_number, 'phone', v_beneficiary.phone,
      'email', v_beneficiary.email, 'cedula', v_beneficiary.cedula
    ))
  ) RETURNING * INTO v_result;
  RETURN v_result;
END;
$$;

DROP POLICY IF EXISTS "Users can insert own transfers" ON public.transfers;
REVOKE ALL ON public.transfers FROM anon;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.transfers FROM authenticated;
GRANT SELECT, UPDATE ON public.transfers TO authenticated;
REVOKE ALL ON public.beneficiaries FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.beneficiaries FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.beneficiaries TO authenticated;
REVOKE ALL ON FUNCTION public.create_remittance_request(UUID, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_remittance_request(UUID, TEXT, NUMERIC, NUMERIC) TO authenticated;

-- Retire legacy deposit/balance writes while retaining historical rows for auditability.
DROP TRIGGER IF EXISTS process_deposit_review_trigger ON public.deposit_requests;
DROP FUNCTION IF EXISTS public.process_deposit_review();
REVOKE ALL ON public.deposit_requests FROM anon, authenticated;
REVOKE ALL ON public.wallet_transactions FROM anon, authenticated;
REVOKE ALL ON public.wallets FROM anon, authenticated;
COMMENT ON TABLE public.deposit_requests IS 'Deprecated. Historical records only; Patzi uses remittance and stable operation flows.';
COMMENT ON TABLE public.wallet_transactions IS 'Deprecated. Historical records only.';
COMMENT ON TABLE public.wallets IS 'Deprecated. Historical records only.';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, country)
  VALUES (
    NEW.id, COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''), NULLIF(NEW.raw_user_meta_data->>'country', '')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
