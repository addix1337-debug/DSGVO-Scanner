import type { Metadata } from 'next'
import './globals.css'
import { Shield, ScanSearch } from 'lucide-react'

export const metadata: Metadata = {
  title: 'DSGVO Scanner – Technischer Website-Check',
  description:
    'Erkennt externe Dienste, Tracking-Indikatoren und Cookies auf deiner Website – kostenlos, ohne Registrierung.',
  verification: {
    google: 'ZM5ehEh-P5zsO-DwghIvnIsHkpPC5BrW00rJ62c3_9I',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased" style={{ backgroundColor: '#F2F2F5', color: '#09090b' }}>
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800" />

        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Brand */}
            <a href="/scan" className="flex items-center gap-2.5 group">
              <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm group-hover:bg-zinc-700 transition-colors duration-150">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm tracking-tight text-zinc-900 group-hover:text-zinc-700 transition-colors">
                  DSGVO Scanner
                </span>
                <span className="text-[9px] font-medium text-zinc-400 tracking-wide uppercase">
                  Technischer Check
                </span>
              </div>
            </a>

            {/* Nav */}
            <a
              href="/scan"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all px-3 py-1.5 rounded-lg border border-transparent hover:border-zinc-200"
            >
              <ScanSearch className="h-3.5 w-3.5" />
              Neuer Scan
            </a>
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}
