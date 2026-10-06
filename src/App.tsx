import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, LineChart, Plus, Settings as Cog, X } from 'lucide-react'
import type { Artwork, Settings } from './types'
import { defaultSettings, loadArtworks, loadSettings, saveArtworks, saveSettings } from './lib/storage'
import { fetchValuation } from './lib/gemini'
import { today } from './lib/format'
import TickerTape from './components/TickerTape'
import Summary from './components/Summary'
import ArtworkTable from './components/ArtworkTable'
import ArtworkForm, { type FormValues } from './components/ArtworkForm'
import ArtworkDetail from './components/ArtworkDetail'
import SettingsModal from './components/SettingsModal'

type Dialog = { kind: 'add' } | { kind: 'edit'; id: string } | { kind: 'detail'; id: string } | { kind: 'settings' } | null

/** Replace today's history point if present, otherwise append. */
function withPoint(a: Artwork, point: Artwork['valuationHistory'][number]): Artwork {
  const history = a.valuationHistory.filter((h) => h.date !== point.date).concat(point).sort((x, y) => x.date.localeCompare(y.date))
  return { ...a, currentEstimatedValue: point.value, lastUpdated: new Date().toISOString(), valuationHistory: history }
}

export default function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [ready, setReady] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const artworksRef = useRef(artworks)
  artworksRef.current = artworks

  useEffect(() => {
    setSettings(loadSettings())
    loadArtworks().then((a) => { setArtworks(a); setReady(true) }).catch(() => { setError('Could not read local storage.'); setReady(true) })
  }, [])

  useEffect(() => {
    if (ready) saveArtworks(artworks).catch(() => setError('Could not save to IndexedDB.'))
  }, [artworks, ready])

  const refresh = useCallback(async (id: string, key = settings.geminiApiKey) => {
    const target = artworksRef.current.find((a) => a.id === id)
    if (!target) return
    setRefreshing((s) => new Set(s).add(id))
    try {
      const point = await fetchValuation(key, target, settings.currency)
      setArtworks((list) => list.map((a) => (a.id === id ? withPoint(a, point) : a)))
    } catch (e) {
      setError(`${target.title}: ${(e as Error).message}`)
    } finally {
      setRefreshing((s) => { const n = new Set(s); n.delete(id); return n })
    }
  }, [settings.geminiApiKey, settings.currency])

  // Optional daily auto-refresh, run once after load.
  const autoRan = useRef(false)
  useEffect(() => {
    if (!ready || autoRan.current || !settings.autoRefreshDaily || !settings.geminiApiKey) return
    autoRan.current = true
    ;(async () => {
      for (const a of artworksRef.current) {
        if (a.valuationHistory.at(-1)?.date !== today()) await refresh(a.id)
      }
    })()
  }, [ready, settings.autoRefreshDaily, settings.geminiApiKey, refresh])

  function addArtwork(v: FormValues) {
    const id = crypto.randomUUID()
    const { currentEstimatedValue, ...rest } = v
    const value = currentEstimatedValue ?? v.purchasePrice ?? 0
    const art: Artwork = {
      id, ...rest,
      currentEstimatedValue: value,
      lastUpdated: new Date().toISOString(),
      valuationHistory: [{ date: today(), value, rationale: currentEstimatedValue ? 'Manual entry.' : v.purchasePrice ? 'Initial value set to purchase price.' : undefined }],
    }
    setArtworks((l) => [art, ...l])
    setDialog(null)
    artworksRef.current = [art, ...artworksRef.current]
    if (currentEstimatedValue === undefined && settings.geminiApiKey) refresh(id)
  }

  function editArtwork(id: string, v: FormValues) {
    setArtworks((list) => list.map((a) => {
      if (a.id !== id) return a
      const { currentEstimatedValue, ...rest } = v
      const next = { ...a, ...rest }
      if (currentEstimatedValue !== undefined && currentEstimatedValue !== a.currentEstimatedValue) {
        return withPoint(next, { date: today(), value: currentEstimatedValue, rationale: 'Manual adjustment.' })
      }
      return next
    }))
    setDialog({ kind: 'detail', id })
  }

  function deleteArtwork(id: string) {
    const a = artworks.find((x) => x.id === id)
    if (a && confirm(`Remove "${a.title}" from your portfolio? This cannot be undone.`)) {
      setArtworks((l) => l.filter((x) => x.id !== id))
      setDialog(null)
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'CanvasEquity', exportedAt: new Date().toISOString(), artworks }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `canvasequity-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File) {
    try {
      const data = JSON.parse(await file.text())
      const list: Artwork[] = Array.isArray(data) ? data : data.artworks
      if (!Array.isArray(list) || list.some((a) => !a.id || !a.title || !Array.isArray(a.valuationHistory))) throw new Error('Unrecognised file format.')
      if (!confirm(`Import ${list.length} artworks? Works with matching IDs will be overwritten; others are kept.`)) return
      setArtworks((cur) => [...list, ...cur.filter((c) => !list.some((l) => l.id === c.id))])
      setDialog(null)
    } catch (e) {
      setError(`Import failed: ${(e as Error).message}`)
    }
  }

  const current = dialog && 'id' in dialog ? artworks.find((a) => a.id === dialog.id) : undefined
  const hasKey = !!settings.geminiApiKey

  return (
    <div className="min-h-screen">
      <TickerTape artworks={artworks} currency={settings.currency} />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><LineChart size={20} /></div>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-zinc-50">CanvasEquity</h1>
            <p className="text-xs text-zinc-500">Local-first fine art portfolio intelligence.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDialog({ kind: 'settings' })} className="rounded-lg border border-line p-2 text-zinc-400 hover:bg-zinc-800" title="Settings"><Cog size={18} /></button>
          <button onClick={() => setDialog({ kind: 'add' })} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"><Plus size={16} /> Add artwork</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1 break-words">{error}</span>
            <button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        {!hasKey && ready && (
          <button onClick={() => setDialog({ kind: 'settings' })} className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-left text-sm text-amber-300 hover:bg-amber-500/10">
            Add your Gemini API key in Settings to fetch live valuations. Without one you can still track values manually.
          </button>
        )}

        {!ready ? null : artworks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-20 text-center">
            <p className="text-lg font-medium text-zinc-200">Your portfolio is empty</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">Add your first work to start tracking its value like a stock. Everything stays in this browser.</p>
            <button onClick={() => setDialog({ kind: 'add' })} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"><Plus size={16} /> Add artwork</button>
          </div>
        ) : (
          <>
            <Summary artworks={artworks} currency={settings.currency} />
            <ArtworkTable
              artworks={artworks}
              currency={settings.currency}
              refreshing={refreshing}
              onOpen={(a) => setDialog({ kind: 'detail', id: a.id })}
              onRefresh={(a) => refresh(a.id)}
            />
          </>
        )}
        <p className="pt-4 text-center text-xs text-zinc-700">Valuations are AI-generated estimates from public web data, not appraisals or financial advice.</p>
      </main>

      {dialog?.kind === 'add' && <ArtworkForm hasApiKey={hasKey} onSave={addArtwork} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && current && <ArtworkForm initial={current} hasApiKey={hasKey} onSave={(v) => editArtwork(current.id, v)} onClose={() => setDialog({ kind: 'detail', id: current.id })} />}
      {dialog?.kind === 'detail' && current && (
        <ArtworkDetail
          artwork={current}
          currency={settings.currency}
          busy={refreshing.has(current.id)}
          onRefresh={() => refresh(current.id)}
          onEdit={() => setDialog({ kind: 'edit', id: current.id })}
          onDelete={() => deleteArtwork(current.id)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'settings' && (
        <SettingsModal settings={settings} onSave={(s) => { setSettings(s); saveSettings(s) }} onExport={exportData} onImport={importData} onClose={() => setDialog(null)} />
      )}
    </div>
  )
}
