import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Share,
    Modal,
    Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

import { BibleVerse } from '../src/types';
import { availableVersions, translations } from '../src/constants';
import { createStyles } from '../src/styles';
import { usePreferences } from '../src/contexts/PreferencesContext';
import { useBible } from '../src/contexts/BibleContext';

export default function Home() {
    const router = useRouter();
    const { language, selectedVersion, themeMode, isDark, changeLanguage, changeVersion, cycleTheme } = usePreferences();
    const { favorites, downloadedBooks, toggleFavorite, isFavorite } = useBible();

    const [verse, setVerse] = useState<BibleVerse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showVersionModal, setShowVersionModal] = useState(false);

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

    const fetchVerse = async (lang = language, version?: string) => {
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
            // Alert.alert('✓', t.copied); // Removed Alert for cleaner UX, maybe add toast later
        } catch (error) {
            console.error('Error copying:', error);
        }
    };

    useEffect(() => {
        fetchVerse();
    }, []);

    const styles = createStyles(isDark, isSmallDevice, isTablet);

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
                                onPress={() => router.push('/favorites')}
                            >
                                <Text style={styles.viewFavoritesText}>
                                    {t.viewFavorites} ({favorites.length})
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.viewFavoritesButton}
                                onPress={() => router.push('/books')}
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

                            <TouchableOpacity onPress={() => toggleFavorite(verse)} style={styles.actionButton}>
                                <Text style={styles.actionButtonText}>
                                    {isFavorite(verse) ? '❤️' : '🤍'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.button} onPress={() => fetchVerse()}>
                            <Text style={styles.buttonText}>{t.newVerse}</Text>
                        </TouchableOpacity>

                        <View style={styles.bottomButtons}>
                            <TouchableOpacity
                                style={styles.viewFavoritesButton}
                                onPress={() => router.push('/favorites')}
                            >
                                <Text style={styles.viewFavoritesText}>
                                    {t.viewFavorites} ({favorites.length})
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.viewFavoritesButton}
                                onPress={() => router.push('/books')}
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
                            onPress={() => {
                                changeLanguage('en');
                                setShowLanguageModal(false);
                                fetchVerse('en');
                            }}
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
                            onPress={() => {
                                changeLanguage('es');
                                setShowLanguageModal(false);
                                fetchVerse('es');
                            }}
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
                                    onPress={() => {
                                        changeVersion(version.code);
                                        setShowVersionModal(false);
                                        fetchVerse(language, version.code);
                                    }}
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
