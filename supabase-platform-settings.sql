-- ============================================================
-- Patzi v2 — Platform Settings table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed defaults
INSERT INTO public.platform_settings (key, value) VALUES
  ('platform_name', 'Patzi'),
  ('logo_url', '')
ON CONFLICT (key) DO NOTHING;

-- Public read access (logo/name visible to all)
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Supabase Storage bucket for brand assets
-- Run this separately if the bucket doesn't exist yet:
-- ============================================================
-- In Supabase Dashboard → Storage → New bucket
--   Name: brand
--   Public: ✅ (checked)
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand', 'brand', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public brand assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand');

CREATE POLICY "Admin upload brand" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'brand');

CREATE POLICY "Admin update brand" ON storage.objects
  FOR UPDATE USING (bucket_id = 'brand');
