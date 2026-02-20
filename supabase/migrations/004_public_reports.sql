-- =============================================================================
-- Migration: 004_public_reports
-- =============================================================================
-- Adds `public` flag to scans table for publicly accessible /report/[host]
-- pages.
--
-- Security model:
--   The scans table previously had RLS disabled (service_role access only).
--   We now enable RLS and add a SELECT policy so that the Supabase anon key
--   can only read rows with public=true.
--   The service_role key (used by all existing API routes + worker) continues
--   to bypass RLS by design — no existing functionality is affected.
-- =============================================================================

-- ── Step 1: Add the column ────────────────────────────────────────────────
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS public boolean NOT NULL DEFAULT false;

-- Partial index: fast lookup for public report pages
CREATE INDEX IF NOT EXISTS scans_public_done_created_idx
  ON public.scans (url, created_at DESC)
  WHERE public = true AND status = 'done';

-- ── Step 2: Enable RLS (idempotent) ──────────────────────────────────────
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- ── Step 3: Policies ─────────────────────────────────────────────────────
-- Drop first so re-running is safe
DROP POLICY IF EXISTS "anon_select_public_scans" ON public.scans;

-- Anon users may only SELECT rows where public = true
CREATE POLICY "anon_select_public_scans"
  ON public.scans
  FOR SELECT
  TO anon
  USING (public = true);

-- service_role bypasses RLS — no policy needed for it.

-- ── Seed example (run manually to test /report/example.com) ─────────────
-- INSERT INTO public.scans (url, status, result, public) VALUES (
--   'https://example.com/',
--   'done',
--   '{
--     "googleFontsUsed": false,
--     "googleAnalyticsDetected": false,
--     "facebookPixelDetected": false,
--     "trackingCookiesSet": false,
--     "hasImprint": true,
--     "hasPrivacyPolicy": true,
--     "externalDomains": ["www.iana.org"],
--     "cookies": [],
--     "meta": {
--       "finalUrl": "https://example.com/",
--       "httpStatus": 200,
--       "scanDurationMs": 4200,
--       "requestsCount": 3,
--       "externalDomainsCount": 1,
--       "cookiesCount": 0
--     }
--   }',
--   true
-- );
