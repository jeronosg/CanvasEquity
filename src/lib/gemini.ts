import { GoogleGenAI } from '@google/genai'
import type { Artwork, HistoricalPoint } from '../types'
import { today } from './format'

export const GEMINI_MODEL = 'gemini-3.8-flash'

function buildPrompt(a: Artwork, currency: string) {
  const details = [
    `Title: ${a.title}`,
    `Artist: ${a.artist}`,
    a.medium && `Medium: ${a.medium}`,
    a.dimensions && `Dimensions: ${a.dimensions}`,
    a.yearCreated && `Year created: ${a.yearCreated}`,
    a.purchasePrice && `Owner purchase price: ${a.purchasePrice} ${currency}${a.purchaseDate ? ` (${a.purchaseDate})` : ''}`,
    a.notes && `Owner notes: ${a.notes}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `You are an art market analyst. Using Google Search, find recent auction results, gallery listings, and comparable sales for the artwork below, and estimate its current fair market resale value in ${currency}.

${details}

If this exact work is not documented, base the estimate on comparable works by the same artist (similar medium, size, period). Be conservative; do not invent sources.

Respond with ONLY a JSON object (no markdown fences, no commentary) of this exact shape:
{"value": <number in ${currency}, no formatting>, "confidence": "High" | "Medium" | "Low", "rationale": "<2-3 sentences citing the comparables used>"}`
}

function parseJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Gemini returned no JSON valuation.')
  return JSON.parse(match[0])
}

export async function fetchValuation(apiKey: string, artwork: Artwork, currency: string): Promise<HistoricalPoint> {
  if (!apiKey) throw new Error('Add a Gemini API key in Settings first.')
  const ai = new GoogleGenAI({ apiKey })
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPrompt(artwork, currency),
    config: { tools: [{ googleSearch: {} }] },
  })

  const parsed = parseJson(res.text ?? '')
  const value = Number(String(parsed.value).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(value) || value <= 0) throw new Error('Gemini could not produce a usable value.')

  const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
  const sources = [...new Set(chunks.map((c) => c.web?.uri).filter((u): u is string => !!u))].slice(0, 6)
  const confidence = ['High', 'Medium', 'Low'].includes(parsed.confidence) ? parsed.confidence : 'Low'

  return {
    date: today(),
    value: Math.round(value),
    confidenceScore: confidence,
    sources,
    rationale: typeof parsed.rationale === 'string' ? parsed.rationale : undefined,
  }
}
