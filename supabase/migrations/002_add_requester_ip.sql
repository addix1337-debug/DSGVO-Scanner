-- =============================================================================
-- Migration: 002_add_requester_ip
-- =============================================================================
-- Adds requester_ip to support:
--   1. Idempotency: reuse recent scans from same IP for same URL (2-min window)
--   2. Abuse analysis (no auth in MVP, IP is best proxy for identity)
--
-- Privacy note: IPs are stored unmasked for MVP simplicity. Before going
-- public, consider hashing (SHA-256 + salt) or truncating (last octet zero).
-- =============================================================================

ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS requester_ip text;

-- Composite index: supports idempotency query
-- (requester_ip, url, created_at DESC) → fast lookup for recent scans per IP+URL
CREATE INDEX IF NOT EXISTS scans_ip_url_created_idx
  ON public.scans (requester_ip, url, created_at DESC);
