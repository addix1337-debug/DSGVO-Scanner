/**
 * Demo-Script: führt einen Scan ohne Supabase aus und gibt das Ergebnis aus.
 * Verwendung: pnpm --filter worker scan:demo https://example.com
 */
import { runScan } from './scanEngine'

const url = process.argv[2]

if (!url) {
  console.error('Verwendung: pnpm --filter worker scan:demo <url>')
  console.error('Beispiel:   pnpm --filter worker scan:demo https://example.com')
  process.exit(1)
}

console.log(`\nScanne: ${url}\n${'─'.repeat(60)}`)

runScan(url)
  .then((result) => {
    console.log('\nErgebnis:\n')
    console.log(JSON.stringify(result, null, 2))
    console.log('\n' + '─'.repeat(60))
    console.log('Scan abgeschlossen.')
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error('\nScan fehlgeschlagen:', message)
    process.exit(1)
  })
