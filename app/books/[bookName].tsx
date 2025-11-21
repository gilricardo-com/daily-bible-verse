import React, { useState, useEffect } from 'react';
import { Dimensions, View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BookDetailView } from '../../src/components/BookDetailView';
import { usePreferences } from '../../src/contexts/PreferencesContext';
import { useBible } from '../../src/contexts/BibleContext';
import { createStyles } from '../../src/styles';
import { translations } from '../../src/constants';

export default function BookDetailScreen() {
    const router = useRouter();
    const { bookName } = useLocalSearchParams();
    const { language, isDark } = usePreferences();
    const { downloadedBooks, toggleFavorite, isFavorite } = useBible();

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

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const selectedBook = downloadedBooks.find(b => b.bookName === bookName);

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={isDark ? '#8B7355' : '#4A5D4E'} />
            </View>
        );
    }

    if (!selectedBook) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Book not found</Text>
                </View>
            </View>
        );
    }

    return (
        <BookDetailView
            selectedBook={selectedBook}
            onBack={() => router.back()}
            t={t}
            styles={styles}
            toggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
        />
    );
}
