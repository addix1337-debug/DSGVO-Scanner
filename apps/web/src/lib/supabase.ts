import { createClient } from '@supabase/supabase-js'

/**
 * Server-side only Supabase client (service role, untyped).
 * Results are typed at the call site via explicit type annotations.
 * Using an untyped client avoids cross-package generic inference issues
 * between @dsgvo/db and the Supabase JS library.
 *
 * Never import this in client components.
 */
export function getServerSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
