import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScanStatus = 'queued' | 'running' | 'done' | 'error'

export type ScanErrorCode =
  | 'blocked_url'
  | 'navigation_timeout'
  | 'dns_failed'
  | 'playwright_failed'
  | 'unknown'

export interface ScanResultMeta {
  finalUrl: string
  httpStatus: number | null
  scanDurationMs: number
  requestsCount: number
  externalDomainsCount: number
  cookiesCount: number
}

export interface ScanResult {
  googleFontsUsed: boolean
  googleAnalyticsDetected: boolean
  facebookPixelDetected: boolean
  trackingCookiesSet: boolean
  hasImprint: boolean
  hasPrivacyPolicy: boolean
  externalDomains: string[]
  cookies: Array<{ name: string; domain: string; value: string }>
  meta: ScanResultMeta
}

export interface Database {
  public: {
    Tables: {
      scans: {
        Row: {
          id: string
          created_at: string
          url: string
          status: ScanStatus
          result: ScanResult | null
          error_message: string | null
          requester_ip: string | null
        }
        Insert: {
          url: string
          status: ScanStatus
          result?: ScanResult | null
          error_message?: string | null
          requester_ip?: string | null
        }
        Update: {
          status?: ScanStatus
          result?: ScanResult | null
          error_message?: string | null
        }
      }
      monitored_sites: {
        Row: {
          id: string
          url: string
          email: string
          last_scan_id: string | null
          created_at: string
          last_checked_at: string | null
        }
        Insert: {
          url: string
          email: string
          last_scan_id?: string | null
          last_checked_at?: string | null
        }
        Update: {
          last_scan_id?: string | null
          last_checked_at?: string | null
        }
      }
    }
  }
}

export type ScanRow = Database['public']['Tables']['scans']['Row']
export type MonitoredSite = Database['public']['Tables']['monitored_sites']['Row']

// ---------------------------------------------------------------------------
// Error format helpers
// ---------------------------------------------------------------------------

export function parseErrorCode(errorMessage: string | null): {
  code: ScanErrorCode
  technical: string
} {
  if (!errorMessage) return { code: 'unknown', technical: '' }

  const colonIdx = errorMessage.indexOf(':')
  if (colonIdx === -1) return { code: 'unknown', technical: errorMessage }

  const maybeCode = errorMessage.slice(0, colonIdx).trim() as ScanErrorCode
  const validCodes: ScanErrorCode[] = [
    'blocked_url',
    'navigation_timeout',
    'dns_failed',
    'playwright_failed',
    'unknown',
  ]
  const code = validCodes.includes(maybeCode) ? maybeCode : 'unknown'
  return { code, technical: errorMessage.slice(colonIdx + 1).trim() }
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

export function getSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    )
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
