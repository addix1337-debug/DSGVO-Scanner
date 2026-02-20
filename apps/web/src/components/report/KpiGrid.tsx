import { Globe, Cookie, ShieldAlert, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  icon: React.ReactNode
  value: number | string
  label: string
  highlight?: boolean
}

function KpiCard({ icon, value, label, highlight }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 flex flex-col gap-1.5 transition-colors shadow-card',
        highlight
          ? 'bg-red-50 border-red-200'
          : 'bg-zinc-50 border-zinc-200'
      )}
    >
      <div className={cn('flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide', highlight ? 'text-red-400' : 'text-zinc-400')}>
        {icon}
        {label}
      </div>
      <div
        className={cn(
          'text-3xl font-black tracking-tight leading-none',
          highlight ? 'text-red-700' : 'text-zinc-900'
        )}
      >
        {value}
      </div>
    </div>
  )
}

interface KpiGridProps {
  externalDomains: number
  cookies: number
  trackingCount: number
  scanDurationMs?: number
}

export function KpiGrid({ externalDomains, cookies, trackingCount, scanDurationMs }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <KpiCard
        icon={<Globe className="h-3 w-3" />}
        value={externalDomains}
        label="Ext. Dienste"
        highlight={externalDomains > 5}
      />
      <KpiCard
        icon={<Cookie className="h-3 w-3" />}
        value={cookies}
        label="Cookies"
        highlight={cookies > 3}
      />
      <KpiCard
        icon={<ShieldAlert className="h-3 w-3" />}
        value={trackingCount}
        label="Tracking"
        highlight={trackingCount > 0}
      />
      {scanDurationMs !== undefined ? (
        <KpiCard
          icon={<Timer className="h-3 w-3" />}
          value={`${(scanDurationMs / 1000).toFixed(0)}s`}
          label="Scan-Dauer"
        />
      ) : (
        /* Placeholder so grid stays 4-col */
        <div className="rounded-xl border border-dashed border-zinc-200 p-3.5" />
      )}
    </div>
  )
}
