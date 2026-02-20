import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import type { ScanRow } from '@dsgvo/db'

// Never cache this route — the client polls it to track live scan status.
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ScanSummary = Pick<ScanRow, 'id' | 'status' | 'result' | 'error_message' | 'url' | 'created_at'>

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // Basic UUID format guard to avoid unnecessary DB round-trips
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Ungültige Scan-ID' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('scans')
    .select('id, status, result, error_message, url, created_at')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Scan nicht gefunden' }, { status: 404 })
    }
    console.error('Supabase select error:', error)
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }

  return NextResponse.json(data as ScanSummary, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
