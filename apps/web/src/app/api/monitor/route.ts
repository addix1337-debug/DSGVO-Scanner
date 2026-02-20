import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

const MAX_SITES_PER_EMAIL = 20

function isValidEmail(email: string): boolean {
  // Minimal check: has @, has something before and after, no spaces
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  return at > 0 && at < trimmed.length - 1 && !trimmed.includes(' ')
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const { email: rawEmail, scanId } =
    (body as { email?: unknown; scanId?: unknown }) ?? {}

  // Validate email
  if (typeof rawEmail !== 'string' || !isValidEmail(rawEmail)) {
    return NextResponse.json(
      { error: 'Gültige E-Mail-Adresse erforderlich' },
      { status: 400 }
    )
  }

  if (typeof scanId !== 'string' || !scanId) {
    return NextResponse.json({ error: 'scanId ist erforderlich' }, { status: 400 })
  }

  const email = rawEmail.trim().toLowerCase()
  const supabase = getServerSupabase()

  // Load scan to get URL and verify it completed
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('id, url, status')
    .eq('id', scanId)
    .single()

  if (scanError || !scan) {
    return NextResponse.json({ error: 'Scan nicht gefunden' }, { status: 404 })
  }

  const scanRow = scan as { id: string; url: string; status: string }

  if (scanRow.status !== 'done') {
    return NextResponse.json(
      { error: 'Überwachung ist nur für abgeschlossene Scans möglich' },
      { status: 400 }
    )
  }

  // Check max sites per email
  const { count, error: countError } = await supabase
    .from('monitored_sites')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)

  if (countError) {
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }

  if ((count ?? 0) >= MAX_SITES_PER_EMAIL) {
    return NextResponse.json(
      { error: `Maximal ${MAX_SITES_PER_EMAIL} URLs pro E-Mail-Adresse erlaubt` },
      { status: 400 }
    )
  }

  // Upsert — unique constraint on (email, url) prevents duplicates
  const { error: upsertError } = await supabase
    .from('monitored_sites')
    .upsert(
      {
        url: scanRow.url,
        email,
        last_scan_id: scanId,
      },
      { onConflict: 'email,url' }
    )

  if (upsertError) {
    console.error('monitored_sites upsert error:', upsertError)
    return NextResponse.json({ error: 'Datenbankfehler beim Speichern' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
