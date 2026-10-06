import { useRef, useState } from 'react'
import { Download, Eye, EyeOff, Upload } from 'lucide-react'
import type { Settings } from '../types'
import { Field, Modal, inputCls } from './ui'

interface Props {
  settings: Settings
  onSave: (s: Settings) => void
  onExport: () => void
  onImport: (file: File) => void
  onClose: () => void
}

export default function SettingsModal({ settings, onSave, onExport, onImport, onClose }: Props) {
  const [s, setS] = useState(settings)
  const [show, setShow] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="space-y-5">
        <Field label="Gemini API key" hint="Stored only in this browser's localStorage. Requests go directly from your browser to Google. Get a key at aistudio.google.com.">
          <div className="flex gap-2">
            <input type={show ? 'text' : 'password'} className={inputCls} value={s.geminiApiKey} onChange={(e) => setS({ ...s, geminiApiKey: e.target.value.trim() })} placeholder="AIza…" autoComplete="off" />
            <button type="button" onClick={() => setShow(!show)} className="rounded-lg border border-line px-3 text-zinc-400 hover:bg-zinc-800">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Currency">
          <select className={inputCls} value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}>
            {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 accent-emerald-500" checked={s.autoRefreshDaily} onChange={(e) => setS({ ...s, autoRefreshDaily: e.target.checked })} />
          <span>
            <span className="block text-sm text-zinc-200">Auto-refresh daily</span>
            <span className="block text-xs text-zinc-500">When you open the app, re-value any work not yet valued today. Uses API quota.</span>
          </span>
        </label>

        <div className="border-t border-line pt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Data</div>
          <div className="flex gap-2">
            <button onClick={onExport} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"><Download size={16} /> Export JSON</button>
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"><Upload size={16} /> Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = '' }} />
          </div>
          <p className="mt-2 text-xs text-zinc-600">All data lives in your browser's IndexedDB. Export regularly — clearing site data erases it.</p>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancel</button>
          <button onClick={() => { onSave(s); onClose() }} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400">Save</button>
        </div>
      </div>
    </Modal>
  )
}
