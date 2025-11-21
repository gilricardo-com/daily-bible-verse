import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Share } from 'react-native';
import { DownloadedBook, BibleVerse } from '../types';

interface BookDetailViewProps {
    selectedBook: DownloadedBook;
    onBack: () => void;
    t: any;
    styles: any;
    toggleFavorite: (verse: BibleVerse) => void;
    isFavorite: (verse: BibleVerse) => boolean;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
    selectedBook,
    onBack,
    t,
    styles,
    toggleFavorite,
    isFavorite,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← {t.back}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{selectedBook.bookName}</Text>
            </View>

            <FlatList
                data={selectedBook.verses}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item: verse }) => (
                    <View style={styles.bookVerseCard}>
                        <Text style={styles.bookVerseText}>{verse.text}</Text>
                        <Text style={styles.bookVerseReference}>{verse.reference}</Text>

                        <View style={styles.bookVerseActions}>
                            <TouchableOpacity
                                onPress={() => toggleFavorite(verse)}
                                style={styles.bookVerseActionButton}
                            >
                                <Text style={styles.bookVerseActionText}>
                                    {isFavorite(verse) ? '❤️' : '🤍'} {isFavorite(verse) ? t.removeFavorite : t.addFavorite}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        await Share.share({
                                            message: `${verse.text}\n\n— ${verse.reference} (${verse.translation_id})`,
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
                style={styles.bookContent}
            />
        </View>
    );
};
