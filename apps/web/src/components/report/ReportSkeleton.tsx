import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn('bg-zinc-200 rounded-lg animate-pulse', className)} />
  )
}

interface ReportSkeletonProps {
  status: 'queued' | 'running'
  url?: string
}

const STEPS = [
  { label: 'Seite laden', desc: 'Browser startet' },
  { label: 'Netzwerk beobachten', desc: '15 Sek. Analyse' },
  { label: 'Auswerten', desc: 'Ergebnis aufbereiten' },
]

export function ReportSkeleton({ status, url }: ReportSkeletonProps) {
  const activeStep = status === 'queued' ? 0 : 1

  return (
    <div className="space-y-5">
      {/* Progress stepper card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
        {/* Status line */}
        <div className="flex items-center gap-2 mb-5">
          <Loader2 className="h-4 w-4 text-zinc-400 animate-spin flex-shrink-0" />
          <p className="text-sm text-zinc-600 font-medium">
            {status === 'queued'
              ? 'Scan wird gestartet…'
              : 'Seite wird geladen und Netzwerkaktivität beobachtet…'}
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center flex-1 min-w-0">
              {/* Step dot */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  i < activeStep
                    ? 'bg-emerald-500 text-white'
                    : i === activeStep
                    ? 'bg-zinc-900 text-white ring-4 ring-zinc-200'
                    : 'bg-zinc-200 text-zinc-400'
                )}>
                  {i < activeStep ? '✓' : (
                    i === activeStep
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <span>{i + 1}</span>
                  )}
                </div>
                <p className={cn(
                  'text-[10px] font-semibold mt-1.5 text-center hidden sm:block',
                  i === activeStep ? 'text-zinc-800' : 'text-zinc-400'
                )}>
                  {step.label}
                </p>
                <p className="text-[9px] text-zinc-400 text-center hidden sm:block">{step.desc}</p>
              </div>

              {/* Connector line (not after last) */}
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 sm:mx-3 transition-all duration-500',
                  i < activeStep ? 'bg-emerald-300' : 'bg-zinc-200'
                )} />
              )}
            </div>
          ))}
        </div>

        {url && (
          <p className="text-xs text-zinc-400 mt-4 font-mono truncate border-t border-zinc-100 pt-3">
            {url}
          </p>
        )}
      </div>

      {/* Skeleton hero */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4 shadow-card">
        <div className="flex items-center gap-3">
          <Bone className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Bone className="h-6 w-36" />
            <Bone className="h-3.5 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Bone className="h-4 w-3/4" />
      </div>

      {/* Skeleton monitor card */}
      <Bone className="h-32 rounded-2xl" />

      {/* Skeleton accordion */}
      <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white divide-y divide-zinc-100 shadow-card">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-3">
            <Bone className="h-4 w-4 rounded-full flex-shrink-0" />
            <Bone className={cn('h-4', i === 0 ? 'w-2/3' : i === 1 ? 'w-1/2' : 'w-3/5')} />
            <Bone className="h-4 w-20 ml-auto flex-shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
