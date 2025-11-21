import React, { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { DownloadedBooksView } from '../../src/components/DownloadedBooksView';
import { usePreferences } from '../../src/contexts/PreferencesContext';
import { useBible } from '../../src/contexts/BibleContext';
import { createStyles } from '../../src/styles';
import { translations, bibleBooks } from '../../src/constants';
import { DownloadedBook } from '../../src/types';

export default function BooksScreen() {
    const router = useRouter();
    const { language, isDark } = usePreferences();
    const { downloadedBooks, downloadProgress, downloadBook, deleteBook } = useBible();
    const [showBookSelector, setShowBookSelector] = useState(false);

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

    const styles = createStyles(isDark, isSmallDevice, isTablet);

    const handleSelectBook = (book: DownloadedBook) => {
        // Encode book name to handle spaces and special chars
        router.push(`/books/${encodeURIComponent(book.bookName)}`);
    };

    return (
        <DownloadedBooksView
            downloadedBooks={downloadedBooks}
            onBack={() => router.back()}
            t={t}
            styles={styles}
            onSelectBook={handleSelectBook}
            onDeleteBook={deleteBook}
            downloadProgress={downloadProgress}
            bibleBooks={bibleBooks}
            language={language}
            downloadBook={downloadBook}
            showBookSelector={showBookSelector}
            setShowBookSelector={setShowBookSelector}
            isDark={isDark}
            selectedVersion={usePreferences().selectedVersion}
        />
    );
}
