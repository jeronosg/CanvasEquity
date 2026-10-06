import { get, set } from 'idb-keyval'
import type { Artwork, Settings } from '../types'

const ART_KEY = 'canvasequity:artworks'
const SET_KEY = 'canvasequity:settings'

export const defaultSettings: Settings = { geminiApiKey: '', autoRefreshDaily: false, currency: 'USD' }

export async function loadArtworks(): Promise<Artwork[]> {
  return (await get<Artwork[]>(ART_KEY)) ?? []
}

export async function saveArtworks(artworks: Artwork[]) {
  await set(ART_KEY, artworks)
}

export function loadSettings(): Settings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SET_KEY) ?? '{}') }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SET_KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable */
  }
}

/** Downscale an image file to a JPEG data URL so it stays small in IndexedDB. */
export function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = url
  })
}
