import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import { pct } from '../lib/format'

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} rounded-2xl border border-line bg-panel shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Delta({ value, className = '' }: { value: number; className?: string }) {
  const color = value > 0 ? 'text-emerald-400' : value < 0 ? 'text-rose-400' : 'text-zinc-500'
  return <span className={`num ${color} ${className}`}>{pct(value)}</span>
}

export function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  if (values.length < 2) return <div className="h-8 w-24 text-center text-xs leading-8 text-zinc-700">—</div>
  const data = values.map((v, i) => ({ i, v }))
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line type="monotone" dataKey="v" stroke={up ? '#34d399' : '#fb7185'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-600">{hint}</span>}
    </label>
  )
}
