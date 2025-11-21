import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

import { BibleVerse, SavedVerse, DownloadedBook, Language, ThemeMode, ViewMode } from './src/types';
import { availableVersions, translations, bibleBooks } from './src/constants';
import { createStyles } from './src/styles';
import { BookDetailView } from './src/components/BookDetailView';
import { FavoritesView } from './src/components/FavoritesView';
import { DownloadedBooksView } from './src/components/DownloadedBooksView';

export default function App() {
  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [selectedVersion, setSelectedVersion] = useState<{ en: string; es: string }>({
    en: 'WEB',
    es: 'RV1960',
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [favorites, setFavorites] = useState<SavedVerse[]>([]);
  const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [downloadingBooks, setDownloadingBooks] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [selectedBook, setSelectedBook] = useState<DownloadedBook | null>(null);

  const isDark = themeMode === 'dark';

  const t = translations[language];

  // Responsive layout
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const isSmallDevice = dimensions.width < 375;
  const isTablet = dimensions.width >= 768;

  // Load saved data
  useEffect(() => {
    loadPreferences();
    loadFavorites();
    loadDownloadedBooks();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      const savedVersionEn = await AsyncStorage.getItem('version_en');
      const savedVersionEs = await AsyncStorage.getItem('version_es');
      const savedTheme = await AsyncStorage.getItem('theme');

      if (savedLanguage) setLanguage(savedLanguage as Language);
      if (savedVersionEn || savedVersionEs) {
        setSelectedVersion({
          en: savedVersionEn || 'WEB',
          es: savedVersionEs || 'RV1960',
        });
      }
      if (savedTheme) setThemeMode(savedTheme as ThemeMode);
      else setThemeMode('light'); // Default to light mode
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

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

  const changeLanguage = async (newLang: Language) => {
    setLanguage(newLang);
    setShowLanguageModal(false);
    await AsyncStorage.setItem('language', newLang);

    // Reload current verse in new language if we have verse data
    if (verse?.book && verse?.chapter && verse?.verse) {
      fetchSpecificVerse(verse.book, verse.chapter, verse.verse, newLang);
    } else {
      fetchVerse(newLang);
    }
  };

  const changeVersion = async (versionCode: string) => {
    const newVersions = { ...selectedVersion, [language]: versionCode };
    setSelectedVersion(newVersions);
    setShowVersionModal(false);
    await AsyncStorage.setItem(`version_${language}`, versionCode);

    // Reload current verse with new version
    if (verse?.book && verse?.chapter && verse?.verse) {
      fetchSpecificVerse(verse.book, verse.chapter, verse.verse, language, versionCode);
    } else {
      fetchVerse(language, versionCode);
    }
  };

  const cycleTheme = async () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    await AsyncStorage.setItem('theme', newMode);
  };

  const fetchVerse = async (lang: Language = language, version?: string) => {
    setLoading(true);
    setError(false);

    try {
      const translationCode = version || selectedVersion[lang];
      const url = `https://bolls.life/get-random-verse/${translationCode}/`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();

      // Clean HTML tags from text
      const cleanText = data.text.replace(/<[^>]*>/g, '');

      setVerse({
        text: cleanText.trim(),
        reference: `${data.book} ${data.chapter}:${data.verse}`,
        translation_id: translationCode,
        book: data.book,
        chapter: data.chapter,
        verse: data.verse,
      });
    } catch (err) {
      setError(true);
      console.error('Error fetching verse:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificVerse = async (
    book: number | string,
    chapter: number,
    verseNum: number,
    lang: Language = language,
    version?: string
  ) => {
    setLoading(true);
    setError(false);

    try {
      const translationCode = version || selectedVersion[lang];
      const url = `https://bolls.life/get-verse/${translationCode}/${book}/${chapter}/${verseNum}/`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();

      // Clean HTML tags from text
      const cleanText = data.text.replace(/<[^>]*>/g, '');

      setVerse({
        text: cleanText.trim(),
        reference: `${data.book} ${data.chapter}:${data.verse}`,
        translation_id: translationCode,
        book: data.book,
        chapter: data.chapter,
        verse: data.verse,
      });
    } catch (err) {
      setError(true);
      console.error('Error fetching specific verse:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadBook = async (book: typeof bibleBooks[0]) => {
    const bookName = language === 'es' ? book.spanish : book.name;
    const translation = selectedVersion[language];
    const bookId = bibleBooks.findIndex(b => b.name === book.name) + 1; // 1-66

    // Add placeholder
    const placeholder: DownloadedBook = {
      bookName,
      translation,
      verses: [],
      downloadedAt: Date.now(),
    };
    setDownloadedBooks(prev => [...prev, placeholder]);
    setDownloadingBooks(prev => new Set(prev).add(bookName));
    setDownloadProgress(prev => ({ ...prev, [bookName]: 0 }));
    setShowBookSelector(false);

    try {
      const allVerses: BibleVerse[] = [];

      // Download chapter by chapter
      for (let ch = 1; ch <= book.chapters; ch++) {
        let v = 1;
        let chapterOk = true;

        while (chapterOk && v <= 250) { // Safety ceiling
          const url = `https://bolls.life/get-verse/${translation}/${bookId}/${ch}/${v}/`;
          const res = await fetch(url); // No timeout option

          if (!res.ok) {
            // 404 = end of chapter
            chapterOk = false;
            break;
          }

          const data = await res.json();
          const clean = data.text?.replace(/<[^>]*>/g, '').trim() ?? '';

          if (clean) {
            allVerses.push({
              text: clean,
              reference: `${bookName} ${ch}:${v}`, // Use localized book name
              translation_id: translation,
              book: bookId, // Optional: Add for consistency
              chapter: ch,
              verse: v,
            });
          }
          v++;
          // Polite delay
          await new Promise(r => setTimeout(r, 50));
        }

        // Update progress
        const progress = Math.round((ch / book.chapters) * 100);
        setDownloadProgress(prev => ({ ...prev, [bookName]: progress }));

        // Live progress (verses so far)
        setDownloadedBooks(prev =>
          prev.map(b =>
            b.bookName === bookName && b.verses.length === 0
              ? { ...b, verses: [...allVerses] } // Copy for re-render
              : b
          )
        );
      }

      // Final save
      const finalBook: DownloadedBook = {
        bookName,
        translation,
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
      // Clean up placeholder
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
    if (selectedBook === bookToDelete) {
      setSelectedBook(null);
    }
  };

  const handleShare = async () => {
    if (!verse) return;

    try {
      await Share.share({
        message: `${verse.text}\n\n— ${verse.reference} (${verse.translation_id})`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopy = async () => {
    if (!verse) return;

    try {
      await Clipboard.setStringAsync(`${verse.text}\n\n— ${verse.reference} (${verse.translation_id})`);
      Alert.alert('✓', t.copied);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const toggleFavorite = async (verseToToggle?: BibleVerse) => {
    const targetVerse = verseToToggle || verse;
    if (!targetVerse) return;

    const verseId = `${targetVerse.reference}-${targetVerse.translation_id}`;
    const existingIndex = favorites.findIndex(fav => fav.id === verseId);

    if (existingIndex >= 0) {
      const newFavorites = favorites.filter((_, i) => i !== existingIndex);
      await saveFavorites(newFavorites);
    } else {
      const newFavorite: SavedVerse = {
        ...targetVerse,
        id: verseId,
        savedAt: Date.now(),
      };
      await saveFavorites([newFavorite, ...favorites]);
    }
  };

  const isFavorite = (verseToCheck?: BibleVerse) => {
    const targetVerse = verseToCheck || verse;
    if (!targetVerse) return false;
    const verseId = `${targetVerse.reference}-${targetVerse.translation_id}`;
    return favorites.some(fav => fav.id === verseId);
  };

  useEffect(() => {
    fetchVerse();
  }, []);

  const styles = createStyles(isDark, isSmallDevice, isTablet);

  // Book Detail View
  if (selectedBook) {
    return (
      <BookDetailView
        selectedBook={selectedBook}
        onBack={() => setSelectedBook(null)}
        t={t}
        styles={styles}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
      />
    );
  }

  // Downloaded Books View
  if (viewMode === 'books') {
    return (
      <DownloadedBooksView
        downloadedBooks={downloadedBooks}
        onBack={() => setViewMode('main')}
        t={t}
        styles={styles}
        onSelectBook={setSelectedBook}
        onDeleteBook={deleteBook}
        downloadProgress={downloadProgress}
        bibleBooks={bibleBooks}
        language={language}
        downloadBook={downloadBook}
        showBookSelector={showBookSelector}
        setShowBookSelector={setShowBookSelector}
        isDark={isDark}
      />
    );
  }

  // Favorites View
  if (viewMode === 'favorites') {
    return (
      <FavoritesView
        favorites={favorites}
        onBack={() => setViewMode('main')}
        t={t}
        styles={styles}
        toggleFavorite={toggleFavorite}
      />
    );
  }

  // Main View
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowLanguageModal(true)} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>{language === 'en' ? '🇺🇸' : '🇪🇸'} ▼</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={cycleTheme} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>
              {themeMode === 'light' ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={isDark ? '#8B7355' : '#4A5D4E'} />
        ) : error ? (
          <>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t.error}</Text>
              <Text style={styles.errorSubtext}>You can still access your favorites and downloaded books below</Text>
              <TouchableOpacity style={styles.button} onPress={() => fetchVerse()}>
                <Text style={styles.buttonText}>{t.tryAgain}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={styles.viewFavoritesButton}
                onPress={() => setViewMode('favorites')}
              >
                <Text style={styles.viewFavoritesText}>
                  {t.viewFavorites} ({favorites.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewFavoritesButton}
                onPress={() => setViewMode('books')}
              >
                <Text style={styles.viewFavoritesText}>
                  📚 {t.viewBooks} ({downloadedBooks.length})
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : verse ? (
          <>
            <ScrollView style={styles.verseContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.verseText}>{verse.text}</Text>
              <Text style={styles.reference}>
                {verse.reference} ({verse.translation_id})
              </Text>
            </ScrollView>

            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>📤 {t.share}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>📋 {t.copy}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => toggleFavorite()} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>
                  {isFavorite() ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => fetchVerse()}>
              <Text style={styles.buttonText}>{t.newVerse}</Text>
            </TouchableOpacity>

            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={styles.viewFavoritesButton}
                onPress={() => setViewMode('favorites')}
              >
                <Text style={styles.viewFavoritesText}>
                  {t.viewFavorites} ({favorites.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewFavoritesButton}
                onPress={() => setViewMode('books')}
              >
                <Text style={styles.viewFavoritesText}>
                  📚 {t.viewBooks} ({downloadedBooks.length})
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>



      {/* Language Selector Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.dropdownModal}>
            <TouchableOpacity
              style={[
                styles.modalOption,
                language === 'en' && styles.modalOptionSelected
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[
                styles.modalOptionText,
                language === 'en' && styles.modalOptionTextSelected
              ]}>
                🇺🇸 {t.english}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalOption,
                language === 'es' && styles.modalOptionSelected
              ]}
              onPress={() => changeLanguage('es')}
            >
              <Text style={[
                styles.modalOptionText,
                language === 'es' && styles.modalOptionTextSelected
              ]}>
                🇪🇸 {t.spanish}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.versionButton}
              onPress={() => {
                setShowLanguageModal(false);
                setShowVersionModal(true);
              }}
            >
              <Text style={styles.versionButtonText}>{t.selectVersion}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Version Selector Modal */}
      <Modal
        visible={showVersionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVersionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowVersionModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectVersion}</Text>
              <TouchableOpacity onPress={() => setShowVersionModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.versionList}>
              <Text style={styles.modalSubtitle}>
                {language === 'en' ? t.english : t.spanish}
              </Text>

              {availableVersions[language].map((version) => (
                <TouchableOpacity
                  key={version.code}
                  style={[
                    styles.modalOption,
                    selectedVersion[language] === version.code && styles.modalOptionSelected
                  ]}
                  onPress={() => changeVersion(version.code)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedVersion[language] === version.code && styles.modalOptionTextSelected
                  ]}>
                    {version.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
