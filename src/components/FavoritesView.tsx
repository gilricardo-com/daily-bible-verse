import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Share } from 'react-native';
import { SavedVerse } from '../types';
import { availableVersions } from '../constants';

interface FavoritesViewProps {
    favorites: SavedVerse[];
    onBack: () => void;
    t: any;
    styles: any;
    toggleFavorite: (verse: SavedVerse) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
    favorites,
    onBack,
    t,
    styles,
    toggleFavorite,
}) => {
    const [filterLanguage, setFilterLanguage] = React.useState<'all' | 'en' | 'es'>('all');

    const getLanguageFromTranslation = (translationId: string): 'en' | 'es' => {
        if (availableVersions.es.some(v => v.code === translationId)) return 'es';
        return 'en';
    };

    const filteredFavorites = favorites.filter(fav => {
        if (filterLanguage === 'all') return true;
        return getLanguageFromTranslation(fav.translation_id) === filterLanguage;
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← {t.back}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t.favorites}</Text>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, filterLanguage === 'all' && styles.actionButtonSelected]}
                    onPress={() => setFilterLanguage('all')}
                >
                    <Text style={[styles.actionButtonText, filterLanguage === 'all' && styles.actionButtonTextSelected]}>
                        {t.language === 'Idioma' ? 'Todos' : 'All'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, filterLanguage === 'en' && styles.actionButtonSelected]}
                    onPress={() => setFilterLanguage('en')}
                >
                    <Text style={[styles.actionButtonText, filterLanguage === 'en' && styles.actionButtonTextSelected]}>
                        {t.english}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, filterLanguage === 'es' && styles.actionButtonSelected]}
                    onPress={() => setFilterLanguage('es')}
                >
                    <Text style={[styles.actionButtonText, filterLanguage === 'es' && styles.actionButtonTextSelected]}>
                        {t.spanish}
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredFavorites}
                keyExtractor={(item) => item.id}
                renderItem={({ item: fav }) => (
                    <View style={styles.bookVerseCard}>
                        <Text style={styles.bookVerseText}>{fav.text}</Text>
                        <Text style={styles.bookVerseReference}>
                            {fav.reference} ({fav.translation_id})
                        </Text>

                        <View style={styles.bookVerseActions}>
                            <TouchableOpacity
                                onPress={() => toggleFavorite(fav)}
                                style={styles.bookVerseActionButton}
                            >
                                <Text style={styles.bookVerseActionText}>
                                    ❤️ {t.removeFavorite}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        await Share.share({
                                            message: `${fav.text}\n\n— ${fav.reference} (${fav.translation_id})`,
                                        });
                                    } catch (error) {
                                        console.error('Error sharing:', error);
                                    }
                                }}
                                style={styles.bookVerseActionButton}
                            >
                                <Text style={styles.bookVerseActionText}>📤 {t.share}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.noFavoritesText}>{t.noFavorites}</Text>
                }
                style={styles.bookContent}
            />
        </View>
    );
};
