export interface BibleVerse {
  text: string;
  reference: string;
  translation_id: string;
  book?: number;
  chapter?: number;
  verse?: number;
}

export interface SavedVerse extends BibleVerse {
  id: string;
  savedAt: number;
}

export interface DownloadedBook {
  bookName: string;
  translation: string;
  language: Language;
  verses: BibleVerse[];
  downloadedAt: number;
}

export type Language = 'en' | 'es';
export type ThemeMode = 'light' | 'dark';
export type ViewMode = 'main' | 'favorites' | 'books';
