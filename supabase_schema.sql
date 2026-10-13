-- ============================================================
-- Hafiz Fabrics POS — Supabase Schema & RLS Policy
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_data (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON TABLE public.app_data TO anon, authenticated, service_role;

ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_sync_policy"
ON public.app_data
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_app_data_updated ON public.app_data (updated_at DESC);
