import type { Artwork } from '../types'
import { lastChange, ticker, money, pct } from '../lib/format'
import { TrendingDown, TrendingUp } from 'lucide-react'

export default function TickerTape({ artworks, currency }: { artworks: Artwork[]; currency: string }) {
  if (!artworks.length) return null
  const items = artworks.map((a) => {
    const c = lastChange(a)
    return (
      <span key={a.id} className="inline-flex items-center gap-2 px-6 text-xs">
        <span className="num font-semibold text-zinc-300">{ticker(a)}</span>
        <span className="num text-zinc-400">{money(a.currentEstimatedValue, currency)}</span>
        <span className={`num inline-flex items-center gap-1 ${c.abs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {c.abs >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {c.has ? pct(c.pct) : 'NEW'}
        </span>
      </span>
    )
  })
  return (
    <div className="overflow-hidden border-b border-line bg-black/40 py-2">
      <div className="marquee flex w-max whitespace-nowrap">
        <div className="flex">{items}</div>
        <div className="flex" aria-hidden>{items}</div>
      </div>
    </div>
  )
}
