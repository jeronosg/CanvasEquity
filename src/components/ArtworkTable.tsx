import { Loader2, RefreshCw, ImageOff } from 'lucide-react'
import type { Artwork } from '../types'
import { lastChange, money, ticker, totalReturn } from '../lib/format'
import { Delta, Sparkline } from './ui'

interface Props {
  artworks: Artwork[]
  currency: string
  refreshing: Set<string>
  onOpen: (a: Artwork) => void
  onRefresh: (a: Artwork) => void
}

export default function ArtworkTable({ artworks, currency, refreshing, onOpen, onRefresh }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-3 font-medium">Work</th>
            <th className="px-4 py-3 text-right font-medium">Value</th>
            <th className="px-4 py-3 text-right font-medium">Last chg</th>
            <th className="px-4 py-3 text-right font-medium">Return</th>
            <th className="px-4 py-3 font-medium">Trend</th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {artworks.map((a) => {
            const c = lastChange(a)
            const r = totalReturn(a)
            const busy = refreshing.has(a.id)
            const vals = a.valuationHistory.map((h) => h.value)
            return (
              <tr key={a.id} onClick={() => onOpen(a)} className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt="" className="h-11 w-11 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-zinc-900 text-zinc-700"><ImageOff size={16} /></div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-100">{a.title}</div>
                      <div className="truncate text-xs text-zinc-500">
                        <span className="num mr-2 text-zinc-600">{ticker(a)}</span>{a.artist}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="num px-4 py-3 text-right text-zinc-100">{money(a.currentEstimatedValue, currency)}</td>
                <td className="px-4 py-3 text-right">{c.has ? <Delta value={c.pct} /> : <span className="text-zinc-600">—</span>}</td>
                <td className="px-4 py-3 text-right">{r ? <Delta value={r.pct} /> : <span className="text-zinc-600">—</span>}</td>
                <td className="px-4 py-3"><Sparkline values={vals} up={vals[vals.length - 1] >= vals[0]} /></td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRefresh(a) }}
                    disabled={busy}
                    title="Refresh valuation with Gemini"
                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-emerald-400 disabled:opacity-60"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
