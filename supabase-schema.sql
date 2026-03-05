-- ============================================================
-- PATZI - Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  kyc_status TEXT NOT NULL DEFAULT 'not_submitted'
    CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
  kyc_document_url TEXT,
  kyc_rejection_reason TEXT,
  kyc_submitted_at TIMESTAMPTZ,
  kyc_reviewed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('EUR', 'USD')),
  balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, currency)
);

-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer_out', 'transfer_in')),
  amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL CHECK (currency IN ('EUR', 'USD')),
  description TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BENEFICIARIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('EUR', 'USD', 'PEN', 'VES')),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('bank', 'cash', 'mobile_money', 'home_delivery')),
  bank_name TEXT,
  account_number TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXCHANGE RATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency TEXT NOT NULL CHECK (from_currency IN ('EUR', 'USD', 'PEN', 'VES')),
  to_currency TEXT NOT NULL CHECK (to_currency IN ('EUR', 'USD', 'PEN', 'VES')),
  rate DECIMAL(18, 6) NOT NULL CHECK (rate > 0),
  markup_percent DECIMAL(5, 2) NOT NULL DEFAULT 1.50,
  fee_fixed DECIMAL(10, 2) NOT NULL DEFAULT 2.99,
  fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_currency, to_currency)
);

-- ============================================================
-- TRANSFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  beneficiary_id UUID REFERENCES public.beneficiaries(id),
  beneficiary_name TEXT NOT NULL,
  beneficiary_country TEXT NOT NULL,
  send_currency TEXT NOT NULL CHECK (send_currency IN ('EUR', 'USD', 'PEN', 'VES')),
  receive_currency TEXT NOT NULL CHECK (receive_currency IN ('EUR', 'USD', 'PEN', 'VES')),
  send_amount DECIMAL(18, 2) NOT NULL CHECK (send_amount > 0),
  receive_amount DECIMAL(18, 2) NOT NULL CHECK (receive_amount >= 0),
  exchange_rate DECIMAL(18, 6) NOT NULL,
  fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_charged DECIMAL(18, 2) NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('bank', 'cash', 'mobile_money', 'home_delivery')),
  speed TEXT NOT NULL DEFAULT 'express' CHECK (speed IN ('express', 'economy')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference TEXT NOT NULL UNIQUE,
  note TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transfer status history
CREATE TABLE IF NOT EXISTS public.transfer_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  note TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate reference
CREATE OR REPLACE FUNCTION public.generate_transfer_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'PTZ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('transfer_ref_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS transfer_ref_seq START 1000;

DROP TRIGGER IF EXISTS set_transfer_reference ON public.transfers;
CREATE TRIGGER set_transfer_reference
  BEFORE INSERT ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.generate_transfer_reference();

-- Auto-insert status history on transfer create/update
CREATE OR REPLACE FUNCTION public.log_transfer_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status <> OLD.status) THEN
    INSERT INTO public.transfer_status_history (transfer_id, status)
    VALUES (NEW.id, NEW.status);
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_transfer_status_change ON public.transfers;
CREATE TRIGGER log_transfer_status_change
  BEFORE INSERT OR UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.log_transfer_status();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Wallets
CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own wallets" ON public.wallets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins manage all wallets" ON public.wallets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Wallet transactions
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.wallets WHERE id = wallet_id AND user_id = auth.uid())
);

-- Beneficiaries
CREATE POLICY "Users can manage own beneficiaries" ON public.beneficiaries FOR ALL USING (user_id = auth.uid());

-- Transfers
CREATE POLICY "Users can view own transfers" ON public.transfers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create transfers" ON public.transfers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage all transfers" ON public.transfers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Transfer history
CREATE POLICY "Users can view own transfer history" ON public.transfer_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.transfers WHERE id = transfer_id AND user_id = auth.uid())
);

-- Exchange rates (public read)
CREATE POLICY "Anyone can view exchange rates" ON public.exchange_rates FOR SELECT USING (TRUE);
CREATE POLICY "Only admins can modify rates" ON public.exchange_rates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- SEED: Initial exchange rates
-- ============================================================
INSERT INTO public.exchange_rates (from_currency, to_currency, rate, markup_percent, fee_fixed) VALUES
  ('EUR', 'USD', 1.085,  0.5,  0.99),
  ('EUR', 'PEN', 4.120,  1.5,  2.99),
  ('EUR', 'VES', 39.500, 2.0,  3.99),
  ('USD', 'EUR', 0.921,  0.5,  0.99),
  ('USD', 'PEN', 3.790,  1.2,  1.99),
  ('USD', 'VES', 36.400, 2.0,  2.99),
  ('PEN', 'USD', 0.263,  1.2,  1.99),
  ('PEN', 'EUR', 0.242,  1.5,  2.99),
  ('VES', 'USD', 0.0274, 2.0,  2.99),
  ('VES', 'EUR', 0.0253, 2.0,  3.99)
ON CONFLICT (from_currency, to_currency) DO NOTHING;
