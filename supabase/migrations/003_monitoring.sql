-- =============================================================================
-- Migration: 003_monitoring
-- =============================================================================
-- Adds monitored_sites table for scheduled re-scan + email alerts.
--
-- Design decisions:
--   - No auth: email + URL is the identity. Simple opt-in, no account needed.
--   - Unique constraint on (email, url): prevents duplicate subscriptions.
--   - last_scan_id: reference to last completed scan for diff comparison.
--   - last_checked_at: NULL means "never checked" → highest priority in queue.
--   - RLS disabled (matches scans table — server-side access only).
--   - Max 20 sites per email enforced at application level (API route).
-- =============================================================================

create table if not exists public.monitored_sites (
  id               uuid        primary key default gen_random_uuid(),
  url              text        not null,
  email            text        not null,
  last_scan_id     uuid        null references public.scans(id) on delete set null,
  created_at       timestamptz not null default now(),
  last_checked_at  timestamptz null
);

alter table public.monitored_sites disable row level security;

-- Unique: one subscription per email+url combination
create unique index if not exists monitored_sites_email_url_idx
  on public.monitored_sites (email, url);

-- Fast lookup by url (monitor all emails for a given domain)
create index if not exists monitored_sites_url_idx
  on public.monitored_sites (url);

-- Fast lookup by email (check subscription count per user)
create index if not exists monitored_sites_email_idx
  on public.monitored_sites (email);

-- Cron query: find sites due for re-check (ORDER BY last_checked_at ASC NULLS FIRST)
create index if not exists monitored_sites_last_checked_idx
  on public.monitored_sites (last_checked_at asc nulls first);
