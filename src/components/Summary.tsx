import type { ReactNode } from "react"
import type { Artwork } from '../types'
import { money, portfolioSeries, totalReturn } from '../lib/format'
import { Delta } from './ui'
import ValueChart from './ValueChart'

export default function Summary({ artworks, currency }: { artworks: Artwork[]; currency: string }) {
  const total = artworks.reduce((s, a) => s + a.currentEstimatedValue, 0)
  const withCost = artworks.filter((a) => a.purchasePrice)
  const cost = withCost.reduce((s, a) => s + (a.purchasePrice ?? 0), 0)
  const value = withCost.reduce((s, a) => s + a.currentEstimatedValue, 0)
  const gain = value - cost
  const gainPct = cost ? (gain / cost) * 100 : 0
  const series = portfolioSeries(artworks)
  const up = series.length < 2 || series[series.length - 1].value >= series[0].value
  const best = artworks.filter(totalReturn).sort((a, b) => totalReturn(b)!.pct - totalReturn(a)!.pct)[0]

  const Stat = ({ label, children }: { label: string; children: ReactNode }) => (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  )

  return (
    <section className="grid gap-6 rounded-2xl border border-line bg-panel p-5 lg:grid-cols-[minmax(260px,1fr)_2fr]">
      <div className="flex flex-col justify-between gap-6">
        <Stat label="Portfolio value">
          <div className="num text-4xl font-semibold tracking-tight text-zinc-50">{money(total, currency)}</div>
        </Stat>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Cost basis">
            <div className="num text-lg text-zinc-200">{cost ? money(cost, currency) : '—'}</div>
          </Stat>
          <Stat label="Total return">
            {cost ? (
              <div className="num text-lg">
                <span className={gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{gain >= 0 ? '+' : '−'}{money(Math.abs(gain), currency)}</span>
                <div className="text-sm"><Delta value={gainPct} /></div>
              </div>
            ) : <div className="text-lg text-zinc-600">—</div>}
          </Stat>
          <Stat label="Works">
            <div className="num text-lg text-zinc-200">{artworks.length}</div>
          </Stat>
          <Stat label="Top performer">
            <div className="truncate text-sm text-zinc-200">{best ? best.title : '—'}</div>
            {best && <Delta value={totalReturn(best)!.pct} className="text-sm" />}
          </Stat>
        </div>
      </div>
      <ValueChart data={series} currency={currency} up={up} height={230} />
    </section>
  )
}
