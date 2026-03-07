-- Run this ONCE in Supabase SQL Editor
-- Creates a simple key-value table for platform settings (logo, name, etc.)

create table if not exists public.platform_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz default now()
);

insert into public.platform_settings (key, value) values
  ('logo_url', ''),
  ('platform_name', 'Patzi')
on conflict (key) do nothing;

alter table public.platform_settings disable row level security;
