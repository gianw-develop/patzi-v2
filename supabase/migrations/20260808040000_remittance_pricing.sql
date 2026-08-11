BEGIN;

ALTER TABLE public.exchange_rates
  ADD COLUMN IF NOT EXISTS custom_rate NUMERIC(18, 6),
  ADD COLUMN IF NOT EXISTS use_custom_rate BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fee_fixed NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO public.exchange_rates (
  from_currency,
  to_currency,
  rate,
  markup_percent,
  fee_fixed,
  fee_percent,
  is_active
)
VALUES
  ('EUR', 'PEN', 4.120000, 3, 0, 0, TRUE),
  ('EUR', 'VES', 39.500000, 8, 0, 0, TRUE),
  ('EUR', 'USD', 1.085000, 1, 0, 0, TRUE),
  ('USD', 'PEN', 3.790000, 3, 0, 0, TRUE),
  ('USD', 'VES', 36.400000, 8, 0, 0, TRUE),
  ('USD', 'EUR', 0.921000, 1, 0, 0, TRUE)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

COMMIT;
