-- =============================================================================
-- Migration: 001_create_scans
-- =============================================================================
--
-- RLS Decision (MVP):
--   Row Level Security is DISABLED on the `scans` table.
--   All database access goes through server-side services (Next.js API routes
--   and the Worker) using the Supabase service-role key, which is never
--   exposed to the browser.
--
--   Before adding any user-facing direct database access or making the project
--   public, re-enable RLS and define appropriate policies per user.
-- =============================================================================

create table if not exists public.scans (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null    default now(),
  url           text        not null,
  status        text        not null    check (status in ('queued', 'running', 'done', 'error')),
  result        jsonb,
  error_message text
);

-- RLS explicitly disabled (see decision above)
alter table public.scans disable row level security;

-- Index: fast lookup by id (used for status polling)
create index if not exists scans_id_idx on public.scans (id);

-- Index: useful for queue workers filtering by status
create index if not exists scans_status_idx on public.scans (status);
