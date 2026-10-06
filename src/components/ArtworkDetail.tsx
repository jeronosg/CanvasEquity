import { ExternalLink, Loader2, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import type { Artwork } from '../types'
import { lastChange, money, ticker, totalReturn } from '../lib/format'
import { Delta, Modal } from './ui'
import ValueChart from './ValueChart'

interface Props {
  artwork: Artwork
  currency: string
  busy: boolean
  onRefresh: () => void
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

const confColor = { High: 'text-emerald-400 border-emerald-500/30', Medium: 'text-amber-400 border-amber-500/30', Low: 'text-zinc-400 border-zinc-600/40' }

export default function ArtworkDetail({ artwork: a, currency, busy, onRefresh, onEdit, onDelete, onClose }: Props) {
  const c = lastChange(a)
  const r = totalReturn(a)
  const vals = a.valuationHistory.map((h) => h.value)
  const meta = [a.medium, a.dimensions, a.yearCreated, a.purchaseDate && `Bought ${a.purchaseDate}`].filter(Boolean)

  return (
    <Modal title={`${a.title} · ${ticker(a)}`} onClose={onClose} wide>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div>
          {a.imageUrl ? (
            <img src={a.imageUrl} alt={a.title} className="w-full rounded-lg object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-lg bg-zinc-900 text-sm text-zinc-600">No image</div>
          )}
          <div className="mt-3 text-sm text-zinc-300">{a.artist}</div>
          <div className="mt-1 text-xs leading-relaxed text-zinc-500">{meta.join(' · ')}</div>
          {a.notes && <p className="mt-3 whitespace-pre-wrap text-xs text-zinc-500">{a.notes}</p>}
        </div>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="num text-3xl font-semibold text-zinc-50">{money(a.currentEstimatedValue, currency)}</div>
              <div className="mt-1 flex gap-4 text-sm">
                {c.has && <span className="text-zinc-500">Last <Delta value={c.pct} /></span>}
                {r && <span className="text-zinc-500">Total <Delta value={r.pct} /></span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onRefresh} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh valuation
              </button>
              <button onClick={onEdit} className="rounded-lg border border-line p-2 text-zinc-400 hover:bg-zinc-800" title="Edit"><Pencil size={16} /></button>
              <button onClick={onDelete} className="rounded-lg border border-line p-2 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400" title="Delete"><Trash2 size={16} /></button>
            </div>
          </div>

          <ValueChart data={a.valuationHistory} currency={currency} up={vals[vals.length - 1] >= vals[0]} height={220} />

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Valuation history</h3>
            <ul className="space-y-2">
              {[...a.valuationHistory].reverse().map((h, i) => (
                <li key={h.date + i} className="rounded-lg border border-line bg-ink/60 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="num text-zinc-500">{h.date}</span>
                    <span className="flex items-center gap-2">
                      {h.confidenceScore && <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${confColor[h.confidenceScore]}`}>{h.confidenceScore}</span>}
                      <span className="num font-medium text-zinc-100">{money(h.value, currency)}</span>
                    </span>
                  </div>
                  {h.rationale && <p className="mt-2 text-xs leading-relaxed text-zinc-400">{h.rationale}</p>}
                  {!!h.sources?.length && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {h.sources.map((s) => (
                        <a key={s} href={s} target="_blank" rel="noreferrer noopener" className="inline-flex max-w-[16rem] items-center gap-1 truncate text-xs text-emerald-500/80 hover:text-emerald-400">
                          <ExternalLink size={11} className="shrink-0" />
                          <span className="truncate">{hostname(s)}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function hostname(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
}
