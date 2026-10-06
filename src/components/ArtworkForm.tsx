import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import type { Artwork } from '../types'
import { fileToDataUrl } from '../lib/storage'
import { Field, Modal, inputCls } from './ui'

export interface FormValues {
  title: string
  artist: string
  medium?: string
  dimensions?: string
  yearCreated?: string
  purchasePrice?: number
  purchaseDate?: string
  notes?: string
  imageUrl?: string
  currentEstimatedValue?: number
}

interface Props {
  initial?: Artwork
  hasApiKey: boolean
  onSave: (v: FormValues) => void
  onClose: () => void
}

export default function ArtworkForm({ initial, hasApiKey, onSave, onClose }: Props) {
  const [v, setV] = useState({
    title: initial?.title ?? '',
    artist: initial?.artist ?? '',
    medium: initial?.medium ?? '',
    dimensions: initial?.dimensions ?? '',
    yearCreated: initial?.yearCreated ?? '',
    purchasePrice: initial?.purchasePrice?.toString() ?? '',
    purchaseDate: initial?.purchaseDate ?? '',
    notes: initial?.notes ?? '',
    imageUrl: initial?.imageUrl ?? '',
    value: initial?.currentEstimatedValue?.toString() ?? '',
  })
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }))
  const num = (s: string) => (s.trim() === '' || isNaN(Number(s)) ? undefined : Number(s))

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      setV((p) => ({ ...p, imageUrl: '' }))
      const url = await fileToDataUrl(f)
      setV((p) => ({ ...p, imageUrl: url }))
    } catch (x) {
      setErr((x as Error).message)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!v.title.trim() || !v.artist.trim()) return setErr('Title and artist are required.')
    onSave({
      title: v.title.trim(),
      artist: v.artist.trim(),
      medium: v.medium.trim() || undefined,
      dimensions: v.dimensions.trim() || undefined,
      yearCreated: v.yearCreated.trim() || undefined,
      purchasePrice: num(v.purchasePrice),
      purchaseDate: v.purchaseDate || undefined,
      notes: v.notes.trim() || undefined,
      imageUrl: v.imageUrl.trim() || undefined,
      currentEstimatedValue: num(v.value),
    })
  }

  return (
    <Modal title={initial ? 'Edit artwork' : 'Add artwork'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title *"><input className={inputCls} value={v.title} onChange={set('title')} autoFocus /></Field>
          <Field label="Artist *"><input className={inputCls} value={v.artist} onChange={set('artist')} /></Field>
          <Field label="Medium"><input className={inputCls} value={v.medium} onChange={set('medium')} placeholder="Oil on canvas" /></Field>
          <Field label="Dimensions"><input className={inputCls} value={v.dimensions} onChange={set('dimensions')} placeholder='24 x 36 in' /></Field>
          <Field label="Year created"><input className={inputCls} value={v.yearCreated} onChange={set('yearCreated')} placeholder="1998" /></Field>
          <Field label="Purchase date"><input type="date" className={inputCls} value={v.purchaseDate} onChange={set('purchaseDate')} /></Field>
          <Field label="Purchase price"><input type="number" min="0" step="any" className={inputCls} value={v.purchasePrice} onChange={set('purchasePrice')} /></Field>
          <Field
            label="Estimated value"
            hint={!initial ? (hasApiKey ? 'Leave blank to fetch a valuation with Gemini.' : 'Leave blank to default to purchase price.') : undefined}
          >
            <input type="number" min="0" step="any" className={inputCls} value={v.value} onChange={set('value')} />
          </Field>
        </div>

        <Field label="Image">
          <div className="flex items-center gap-3">
            {v.imageUrl ? <img src={v.imageUrl} alt="" className="h-16 w-16 rounded-md object-cover" /> : null}
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
              <ImagePlus size={16} /> Upload
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            <input className={inputCls} placeholder="…or paste an image URL" value={v.imageUrl.startsWith('data:') ? '' : v.imageUrl} onChange={set('imageUrl')} />
          </div>
        </Field>

        <Field label="Notes"><textarea rows={3} className={inputCls} value={v.notes} onChange={set('notes')} placeholder="Provenance, condition, signed/numbered…" /></Field>

        {err && <p className="text-sm text-rose-400">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancel</button>
          <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400">
            {initial ? 'Save changes' : 'Add to portfolio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
