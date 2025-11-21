import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedVerse, DownloadedBook, BibleVerse } from '../types';
import { bibleBooks, translations } from '../constants';
import { usePreferences } from './PreferencesContext';

interface BibleContextType {
    favorites: SavedVerse[];
    downloadedBooks: DownloadedBook[];
    downloadProgress: { [key: string]: number };
    downloadingBooks: Set<string>;
    toggleFavorite: (verse: BibleVerse) => Promise<void>;
    isFavorite: (verse: BibleVerse) => boolean;
    downloadBook: (book: typeof bibleBooks[0], specificTranslation?: string) => Promise<void>;
    deleteBook: (book: DownloadedBook) => Promise<void>;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export const BibleProvider = ({ children }: { children: ReactNode }) => {
    const { language, selectedVersion } = usePreferences();
    const [favorites, setFavorites] = useState<SavedVerse[]>([]);
    const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>([]);
    const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
    const [downloadingBooks, setDownloadingBooks] = useState<Set<string>>(new Set());

    const t = translations[language];

    useEffect(() => {
        loadFavorites();
        loadDownloadedBooks();
    }, []);

    const loadFavorites = async () => {
        try {
            const saved = await AsyncStorage.getItem('favorites');
            if (saved) {
                setFavorites(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    };

    const loadDownloadedBooks = async () => {
        try {
            const saved = await AsyncStorage.getItem('downloadedBooks');
            if (saved) {
                setDownloadedBooks(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading downloaded books:', error);
        }
    };

    const saveFavorites = async (newFavorites: SavedVerse[]) => {
        try {
            await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
            setFavorites(newFavorites);
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    };

    const saveDownloadedBooks = async (books: DownloadedBook[]) => {
        try {
            await AsyncStorage.setItem('downloadedBooks', JSON.stringify(books));
            setDownloadedBooks(books);
        } catch (error) {
            console.error('Error saving downloaded books:', error);
        }
    };

    const toggleFavorite = async (verse: BibleVerse) => {
        const verseId = `${verse.reference}-${verse.translation_id}`;
        const existingIndex = favorites.findIndex(fav => fav.id === verseId);

        if (existingIndex >= 0) {
            const newFavorites = favorites.filter((_, i) => i !== existingIndex);
            await saveFavorites(newFavorites);
        } else {
            const newFavorite: SavedVerse = {
                ...verse,
                id: verseId,
                savedAt: Date.now(),
            };
            await saveFavorites([newFavorite, ...favorites]);
        }
    };

    const isFavorite = (verse: BibleVerse) => {
        const verseId = `${verse.reference}-${verse.translation_id}`;
        return favorites.some(fav => fav.id === verseId);
    };

    const downloadBook = async (book: typeof bibleBooks[0], specificTranslation?: string) => {
        const bookName = language === 'es' ? book.spanish : book.name;
        const translation = specificTranslation || selectedVersion[language];
        const bookId = bibleBooks.findIndex(b => b.name === book.name) + 1;

        const placeholder: DownloadedBook = {
            bookName,
            translation,
            language,
            verses: [],
            downloadedAt: Date.now(),
        };

        setDownloadedBooks(prev => [...prev, placeholder]);
        setDownloadingBooks(prev => new Set(prev).add(bookName));
        setDownloadProgress(prev => ({ ...prev, [bookName]: 0 }));

        try {
            const allVerses: BibleVerse[] = [];

            for (let ch = 1; ch <= book.chapters; ch++) {
                let v = 1;
                let chapterOk = true;

                while (chapterOk && v <= 250) {
                    const url = `https://bolls.life/get-verse/${translation}/${bookId}/${ch}/${v}/`;
                    const res = await fetch(url);

                    if (!res.ok) {
                        chapterOk = false;
                        break;
                    }

                    const data = await res.json();
                    const clean = data.text?.replace(/<[^>]*>/g, '').trim() ?? '';

                    if (clean) {
                        allVerses.push({
                            text: clean,
                            reference: `${bookName} ${ch}:${v}`,
                            translation_id: translation,
                            book: bookId,
                            chapter: ch,
                            verse: v,
                        });
                    }
                    v++;
                    await new Promise(r => setTimeout(r, 50));
                }

                const progress = Math.round((ch / book.chapters) * 100);
                setDownloadProgress(prev => ({ ...prev, [bookName]: progress }));

                setDownloadedBooks(prev =>
                    prev.map(b =>
                        b.bookName === bookName && b.verses.length === 0
                            ? { ...b, verses: [...allVerses] }
                            : b
                    )
                );
            }

            const finalBook: DownloadedBook = {
                bookName,
                translation,
                language,
                verses: allVerses,
                downloadedAt: Date.now(),
            };

            const newList = downloadedBooks
                .filter(b => !(b.bookName === bookName && b.verses.length === 0))
                .concat(finalBook);

            await saveDownloadedBooks(newList);
            Alert.alert(t.downloadComplete, `${bookName} – ${allVerses.length} verses`);
        } catch (e: any) {
            console.error('downloadBook error:', e);
            const cleaned = downloadedBooks.filter(
                b => !(b.bookName === bookName && b.verses.length === 0)
            );
            await saveDownloadedBooks(cleaned);
            Alert.alert('Error', t.error);
        } finally {
            setDownloadingBooks(prev => {
                const s = new Set(prev);
                s.delete(bookName);
                return s;
            });
            setDownloadProgress(prev => {
                const updated = { ...prev };
                delete updated[bookName];
                return updated;
            });
        }
    };

    const deleteBook = async (bookToDelete: DownloadedBook) => {
        const updatedBooks = downloadedBooks.filter(b => b !== bookToDelete);
        await saveDownloadedBooks(updatedBooks);
    };

    return (
        <BibleContext.Provider
            value={{
                favorites,
                downloadedBooks,
                downloadProgress,
                downloadingBooks,
                toggleFavorite,
                isFavorite,
                downloadBook,
                deleteBook,
            }}
        >
            {children}
        </BibleContext.Provider>
    );
};

export const useBible = () => {
    const context = useContext(BibleContext);
    if (context === undefined) {
        throw new Error('useBible must be used within a BibleProvider');
    }
    return context;
};
