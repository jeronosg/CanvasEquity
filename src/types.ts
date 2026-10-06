export interface Artwork {
  id: string; // crypto.randomUUID()
  title: string;
  artist: string;
  medium?: string; // e.g., Oil on Canvas, Print, Sculpture
  dimensions?: string;
  yearCreated?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  imageUrl?: string;
  currentEstimatedValue: number;
  lastUpdated: string; // ISO String
  valuationHistory: HistoricalPoint[];
}

export interface HistoricalPoint {
  date: string; // YYYY-MM-DD
  value: number;
  confidenceScore?: 'High' | 'Medium' | 'Low';
  sources?: string[];
  rationale?: string;
}

export interface Settings {
  geminiApiKey: string;
  autoRefreshDaily: boolean;
  currency: string; // USD, EUR, GBP
}
