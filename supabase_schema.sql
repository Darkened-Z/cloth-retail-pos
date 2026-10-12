-- ============================================================
-- Hafiz Fabrics POS — Supabase Schema & Permissions
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_data (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant full table permissions to API roles
GRANT ALL ON TABLE public.app_data TO anon, authenticated, service_role;

-- Allow public read/write policy (works even if RLS is enabled)
DROP POLICY IF EXISTS "Allow all access to app_data" ON public.app_data;
CREATE POLICY "Allow all access to app_data"
  ON public.app_data
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Disable Row Level Security for frictionless sync
ALTER TABLE public.app_data DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_app_data_updated ON public.app_data (updated_at DESC);
