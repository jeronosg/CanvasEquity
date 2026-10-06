import type { Artwork, HistoricalPoint } from '../types'

export const today = () => new Date().toISOString().slice(0, 10)

export function money(value: number, currency: string, compact = false) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      ...(compact && Math.abs(value) >= 100000 ? { notation: 'compact', maximumFractionDigits: 2 } : {}),
    }).format(value)
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`
  }
}

export const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

export function ticker(a: Pick<Artwork, 'artist' | 'title'>) {
  const clean = (s: string, n: number) => s.replace(/[^a-z]/gi, '').slice(0, n).toUpperCase()
  return `${clean(a.artist, 3) || 'UNK'}.${clean(a.title, 3) || 'ART'}`
}

/** Change between the latest and previous valuation, if any. */
export function lastChange(a: Artwork) {
  const h = a.valuationHistory
  if (h.length < 2) return { abs: 0, pct: 0, has: false }
  const prev = h[h.length - 2].value
  const abs = a.currentEstimatedValue - prev
  return { abs, pct: prev ? (abs / prev) * 100 : 0, has: true }
}

/** Gain/loss vs purchase price. */
export function totalReturn(a: Artwork) {
  if (!a.purchasePrice) return null
  const abs = a.currentEstimatedValue - a.purchasePrice
  return { abs, pct: (abs / a.purchasePrice) * 100 }
}

/** Aggregate portfolio value by date, carrying each artwork's last known value forward. */
export function portfolioSeries(artworks: Artwork[]): HistoricalPoint[] {
  const dates = [...new Set(artworks.flatMap((a) => a.valuationHistory.map((h) => h.date)))].sort()
  return dates.map((date) => {
    let value = 0
    for (const a of artworks) {
      const pts = a.valuationHistory.filter((h) => h.date <= date)
      if (pts.length) value += pts[pts.length - 1].value
    }
    return { date, value }
  })
}
