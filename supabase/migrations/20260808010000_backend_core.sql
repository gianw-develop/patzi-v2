-- Patzi production backend: authenticated profiles, payment accounts,
-- Stable operations, private proofs and wallet deposits.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stable_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stable_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stable_approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high'));

CREATE TABLE IF NOT EXISTS public.admin_email_allowlist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_email_allowlist (email)
VALUES ('giancarlosweill@gmail.com')
ON CONFLICT (email) DO NOTHING;

ALTER TABLE public.admin_email_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage allowlist" ON public.admin_email_allowlist;
CREATE POLICY "Admins manage allowlist"
  ON public.admin_email_allowlist
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  initial_role TEXT := 'user';
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.admin_email_allowlist
    WHERE LOWER(email) = LOWER(NEW.email)
  ) THEN
    initial_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, country, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    initial_role
  );

  INSERT INTO public.wallets (user_id, currency)
  VALUES (NEW.id, 'USD'), (NEW.id, 'EUR')
  ON CONFLICT (user_id, currency) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() AND (
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.kyc_status IS DISTINCT FROM OLD.kyc_status OR
    NEW.kyc_document_url IS DISTINCT FROM OLD.kyc_document_url OR
    NEW.kyc_rejection_reason IS DISTINCT FROM OLD.kyc_rejection_reason OR
    NEW.kyc_submitted_at IS DISTINCT FROM OLD.kyc_submitted_at OR
    NEW.kyc_reviewed_at IS DISTINCT FROM OLD.kyc_reviewed_at OR
    NEW.is_active IS DISTINCT FROM OLD.is_active OR
    NEW.stable_eligible IS DISTINCT FROM OLD.stable_eligible OR
    NEW.stable_approved_at IS DISTINCT FROM OLD.stable_approved_at OR
    NEW.stable_approved_by IS DISTINCT FROM OLD.stable_approved_by OR
    NEW.risk_level IS DISTINCT FROM OLD.risk_level
  ) THEN
    RAISE EXCEPTION 'Sensitive profile fields can only be changed by an administrator';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

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

  UPDATE public.profiles
  SET stable_eligible = COALESCE(new_stable_eligible, stable_eligible),
      stable_approved_at = CASE
        WHEN new_stable_eligible IS TRUE THEN NOW()
        WHEN new_stable_eligible IS FALSE THEN NULL
        ELSE stable_approved_at
      END,
      stable_approved_by = CASE
        WHEN new_stable_eligible IS NOT NULL THEN auth.uid()
        ELSE stable_approved_by
      END,
      kyc_status = COALESCE(new_kyc_status, kyc_status),
      kyc_reviewed_at = CASE WHEN new_kyc_status IS NOT NULL THEN NOW() ELSE kyc_reviewed_at END,
      is_active = COALESCE(new_is_active, is_active),
      risk_level = COALESCE(new_risk_level, risk_level)
  WHERE id = target_user_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_access(UUID, BOOLEAN, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_access(UUID, BOOLEAN, TEXT, BOOLEAN, TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency TEXT NOT NULL CHECK (currency IN ('EUR', 'USD', 'PEN', 'VES')),
  method_type TEXT NOT NULL CHECK (method_type IN ('bank', 'mobile')),
  method_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  bank_name TEXT,
  iban_account TEXT,
  swift TEXT,
  phone TEXT,
  email TEXT,
  instructions TEXT,
  for_deposits BOOLEAN NOT NULL DEFAULT TRUE,
  for_payouts BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  daily_limit NUMERIC(18, 2) NOT NULL DEFAULT 50000 CHECK (daily_limit > 0),
  received_today NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (received_today >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view active payment accounts" ON public.payment_accounts;
CREATE POLICY "Users view active payment accounts"
  ON public.payment_accounts
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage payment accounts" ON public.payment_accounts;
CREATE POLICY "Admins manage payment accounts"
  ON public.payment_accounts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_accounts_updated_at ON public.payment_accounts;
CREATE TRIGGER payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_stable_reference()
RETURNS TEXT
LANGUAGE SQL
VOLATILE
SET search_path = ''
AS $$
  SELECT 'PTZ-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8));
$$;

CREATE TABLE IF NOT EXISTS public.stable_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT NOT NULL UNIQUE DEFAULT public.generate_stable_reference(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  usd_amount NUMERIC(18, 2) NOT NULL CHECK (usd_amount > 0),
  fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 10 CHECK (fee_percent = 10),
  fee_amount NUMERIC(18, 2) GENERATED ALWAYS AS (ROUND(usd_amount * 0.10, 2)) STORED,
  asset TEXT NOT NULL CHECK (asset IN ('USDT', 'USDC')),
  delivery_amount NUMERIC(18, 2) GENERATED ALWAYS AS (ROUND(usd_amount * 0.90, 2)) STORED,
  network TEXT NOT NULL DEFAULT 'ethereum_erc20' CHECK (network = 'ethereum_erc20'),
  wallet_address TEXT NOT NULL CHECK (wallet_address ~ '^0x[0-9A-Fa-f]{40}$'),
  receiving_account_id UUID NOT NULL REFERENCES public.payment_accounts(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'waiting_payment'
    CHECK (status IN ('waiting_payment', 'proof_submitted', 'verifying', 'payment_received', 'preparing', 'completed', 'correction_requested', 'blocked')),
  risk TEXT NOT NULL DEFAULT 'low' CHECK (risk IN ('low', 'medium', 'high')),
  proof_path TEXT,
  proof_name TEXT,
  proof_mime_type TEXT,
  proof_size BIGINT,
  proof_uploaded_at TIMESTAMPTZ,
  tx_hash TEXT CHECK (tx_hash IS NULL OR tx_hash ~ '^0x[0-9A-Fa-f]{64}$'),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stable_operations_user_created_idx
  ON public.stable_operations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stable_operations_status_created_idx
  ON public.stable_operations (status, created_at);

CREATE TABLE IF NOT EXISTS public.stable_operation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_id UUID NOT NULL REFERENCES public.stable_operations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  label TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  actor_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stable_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stable_operation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own stable operations" ON public.stable_operations;
CREATE POLICY "Users view own stable operations"
  ON public.stable_operations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Eligible users create stable operations" ON public.stable_operations;
CREATE POLICY "Eligible users create stable operations"
  ON public.stable_operations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND stable_eligible = TRUE
        AND kyc_status = 'approved'
        AND is_active = TRUE
    )
    AND EXISTS (
      SELECT 1 FROM public.payment_accounts
      WHERE id = receiving_account_id
        AND currency = 'USD'
        AND for_deposits = TRUE
        AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Users attach own stable proof" ON public.stable_operations;
CREATE POLICY "Users attach own stable proof"
  ON public.stable_operations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage stable operations" ON public.stable_operations;
CREATE POLICY "Admins manage stable operations"
  ON public.stable_operations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users view own stable history" ON public.stable_operation_history;
CREATE POLICY "Users view own stable history"
  ON public.stable_operation_history
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.stable_operations
      WHERE id = operation_id AND user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.protect_stable_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.is_admin() THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR OLD.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Operation access denied';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR
     NEW.usd_amount IS DISTINCT FROM OLD.usd_amount OR
     NEW.fee_percent IS DISTINCT FROM OLD.fee_percent OR
     NEW.asset IS DISTINCT FROM OLD.asset OR
     NEW.network IS DISTINCT FROM OLD.network OR
     NEW.wallet_address IS DISTINCT FROM OLD.wallet_address OR
     NEW.receiving_account_id IS DISTINCT FROM OLD.receiving_account_id OR
     NEW.risk IS DISTINCT FROM OLD.risk OR
     NEW.tx_hash IS DISTINCT FROM OLD.tx_hash OR
     NEW.admin_note IS DISTINCT FROM OLD.admin_note THEN
    RAISE EXCEPTION 'Only proof fields can be changed by the customer';
  END IF;

  IF OLD.status NOT IN ('waiting_payment', 'correction_requested') OR NEW.status <> 'proof_submitted' THEN
    RAISE EXCEPTION 'Invalid customer status transition';
  END IF;

  IF NEW.proof_path IS NULL OR NEW.proof_name IS NULL OR NEW.proof_mime_type <> 'application/pdf' THEN
    RAISE EXCEPTION 'A PDF proof is required';
  END IF;

  NEW.proof_uploaded_at := NOW();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_stable_user_update_trigger ON public.stable_operations;
CREATE TRIGGER protect_stable_user_update_trigger
  BEFORE UPDATE ON public.stable_operations
  FOR EACH ROW EXECUTE FUNCTION public.protect_stable_user_update();

CREATE OR REPLACE FUNCTION public.log_stable_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  status_label TEXT;
  actor_label TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  status_label := CASE NEW.status
    WHEN 'waiting_payment' THEN 'Operación creada'
    WHEN 'proof_submitted' THEN 'Comprobante subido'
    WHEN 'verifying' THEN 'Verificando comprobante'
    WHEN 'payment_received' THEN 'Pago recibido'
    WHEN 'preparing' THEN 'Preparando stablecoin'
    WHEN 'completed' THEN 'Stablecoin enviada'
    WHEN 'correction_requested' THEN 'Corrección solicitada'
    WHEN 'blocked' THEN 'Operación bloqueada'
    ELSE NEW.status
  END;

  SELECT COALESCE(full_name, email)
  INTO actor_label
  FROM public.profiles
  WHERE id = auth.uid();

  actor_label := COALESCE(actor_label, CASE WHEN TG_OP = 'INSERT' THEN 'Cliente' ELSE 'Sistema' END);

  INSERT INTO public.stable_operation_history (
    operation_id, status, label, actor_id, actor_name
  ) VALUES (
    NEW.id, NEW.status, status_label, auth.uid(), actor_label
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stable_operations_updated_at ON public.stable_operations;
CREATE TRIGGER stable_operations_updated_at
  BEFORE UPDATE ON public.stable_operations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS log_stable_status_trigger ON public.stable_operations;
CREATE TRIGGER log_stable_status_trigger
  AFTER INSERT OR UPDATE OF status ON public.stable_operations
  FOR EACH ROW EXECUTE FUNCTION public.log_stable_status();

CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  payment_account_id UUID REFERENCES public.payment_accounts(id) ON DELETE SET NULL,
  currency TEXT NOT NULL CHECK (currency IN ('EUR', 'USD')),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('bank', 'mobile')),
  method_label TEXT NOT NULL,
  proof_path TEXT NOT NULL,
  proof_file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ
);

ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own deposit requests" ON public.deposit_requests;
CREATE POLICY "Users view own deposit requests"
  ON public.deposit_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users create own deposit requests" ON public.deposit_requests;
CREATE POLICY "Users create own deposit requests"
  ON public.deposit_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage deposit requests" ON public.deposit_requests;
CREATE POLICY "Admins manage deposit requests"
  ON public.deposit_requests FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.process_deposit_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_at := NOW();
  END IF;

  IF NEW.status = 'approved' AND OLD.status <> 'approved' AND OLD.credited_at IS NULL THEN
    INSERT INTO public.wallets (user_id, currency, balance)
    VALUES (NEW.user_id, NEW.currency, NEW.amount)
    ON CONFLICT (user_id, currency)
    DO UPDATE SET balance = public.wallets.balance + EXCLUDED.balance;

    NEW.credited_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS process_deposit_review_trigger ON public.deposit_requests;
CREATE TRIGGER process_deposit_review_trigger
  BEFORE UPDATE ON public.deposit_requests
  FOR EACH ROW EXECUTE FUNCTION public.process_deposit_review();

ALTER TABLE public.beneficiaries
  ADD COLUMN IF NOT EXISTS delivery_app TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS cedula TEXT;

ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS delivery_app TEXT,
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_note TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('stable-proofs', 'stable-proofs', FALSE, 5242880, ARRAY['application/pdf']),
  ('deposit-proofs', 'deposit-proofs', FALSE, 5242880, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('remittance-proofs', 'remittance-proofs', FALSE, 5242880, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('kyc-documents', 'kyc-documents', FALSE, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload own private files" ON storage.objects;
CREATE POLICY "Users upload own private files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('stable-proofs', 'deposit-proofs', 'kyc-documents')
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Users read own private files" ON storage.objects;
CREATE POLICY "Users read own private files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('stable-proofs', 'deposit-proofs', 'kyc-documents')
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Admins manage Patzi private files" ON storage.objects;
CREATE POLICY "Admins manage Patzi private files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id IN ('stable-proofs', 'deposit-proofs', 'remittance-proofs', 'kyc-documents')
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id IN ('stable-proofs', 'deposit-proofs', 'remittance-proofs', 'kyc-documents')
    AND public.is_admin()
  );

GRANT SELECT, INSERT, UPDATE ON public.stable_operations TO authenticated;
GRANT SELECT ON public.stable_operation_history TO authenticated;
GRANT SELECT ON public.payment_accounts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.deposit_requests TO authenticated;
GRANT SELECT ON public.admin_email_allowlist TO authenticated;

COMMIT;
