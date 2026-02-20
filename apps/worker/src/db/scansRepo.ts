import { createClient } from '@supabase/supabase-js'
import type { ScanResult, ScanRow, ScanStatus } from '@dsgvo/db'

/**
 * Worker uses an untyped Supabase client directly to avoid cross-package
 * generic type inference issues with tsc across pnpm workspace boundaries.
 * Input/output types are still enforced by this module's function signatures.
 */
function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein')
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function getScanById(id: string): Promise<ScanRow> {
  const { data, error } = await db()
    .from('scans')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`getScanById(${id}) fehlgeschlagen: ${error.message}`)
  if (!data) throw new Error(`Scan nicht gefunden: ${id}`)

  return data as ScanRow
}

export async function markScanRunning(id: string): Promise<void> {
  const payload: { status: ScanStatus } = { status: 'running' }
  const { error } = await db().from('scans').update(payload).eq('id', id)
  if (error) throw new Error(`markScanRunning(${id}) fehlgeschlagen: ${error.message}`)
}

export async function markScanDone(id: string, result: ScanResult): Promise<void> {
  const payload: { status: ScanStatus; result: ScanResult } = { status: 'done', result }
  const { error } = await db().from('scans').update(payload).eq('id', id)
  if (error) throw new Error(`markScanDone(${id}) fehlgeschlagen: ${error.message}`)
}

export async function markScanError(id: string, message: string): Promise<void> {
  const payload: { status: ScanStatus; error_message: string } = {
    status: 'error',
    error_message: message,
  }
  const { error } = await db().from('scans').update(payload).eq('id', id)
  if (error) {
    // Don't throw — we're already in an error path
    console.error(`markScanError(${id}) fehlgeschlagen: ${error.message}`)
  }
}
