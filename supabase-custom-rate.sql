-- Añadir soporte para tasa personalizada (mercado paralelo VES, etc.)
ALTER TABLE public.exchange_rates
  ADD COLUMN IF NOT EXISTS custom_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS use_custom_rate BOOLEAN DEFAULT false;
