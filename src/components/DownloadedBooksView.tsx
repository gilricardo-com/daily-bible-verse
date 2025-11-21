import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { DownloadedBook, Language } from '../types';
import { availableVersions } from '../constants';

interface DownloadedBooksViewProps {
    downloadedBooks: DownloadedBook[];
    onBack: () => void;
    t: any;
    styles: any;
    onSelectBook: (book: DownloadedBook) => void;
    onDeleteBook: (book: DownloadedBook) => void;
    downloadProgress: { [key: string]: number };
    bibleBooks: any[];
    language: Language;
    downloadBook: (book: any, translation?: string) => void;
    showBookSelector: boolean;
    setShowBookSelector: (show: boolean) => void;
    isDark: boolean;
    selectedVersion: { [key: string]: string };
}

export const DownloadedBooksView: React.FC<DownloadedBooksViewProps> = ({
    downloadedBooks,
    onBack,
    t,
    styles,
    onSelectBook,
    onDeleteBook,
    downloadProgress,
    bibleBooks,
    language,
    downloadBook,
    showBookSelector,
    setShowBookSelector,
    isDark,
    selectedVersion,
}) => {
    const [downloadVersion, setDownloadVersion] = React.useState(selectedVersion[language]);

    React.useEffect(() => {
        setDownloadVersion(selectedVersion[language]);
    }, [selectedVersion, language, showBookSelector]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← {t.back}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t.downloadedBooks}</Text>
            </View>

            <ScrollView style={styles.favoritesContainer}>
                {downloadedBooks.length === 0 ? (
                    <Text style={styles.noFavoritesText}>{t.noBooks}</Text>
                ) : (
                    downloadedBooks.map((book, index) => (
                        <View key={index} style={styles.bookItem}>
                            <TouchableOpacity
                                style={styles.bookItemContent}
                                onPress={() => book.verses.length > 0 && onSelectBook(book)}
                                disabled={book.verses.length === 0}
                            >
                                <Text style={styles.bookItemTitle}>{book.bookName}</Text>
                                {book.verses.length === 0 ? (
                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${downloadProgress[book.bookName] || 0}%`,
                                                        backgroundColor: isDark ? '#8B7355' : '#4A5D4E'
                                                    }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.progressText}>
                                            {downloadProgress[book.bookName] || 0}%
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.bookItemSubtitle}>
                                        {`${book.verses.length} ${t.chapters} • ${book.translation} • ${book.language
                                                ? (book.language === 'es' ? t.spanish : t.english)
                                                : (['RV1960', 'LBLA', 'NVI', 'RV2004', 'PDT'].includes(book.translation) ? t.spanish : t.english)
                                            }`}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            {book.verses.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => onDeleteBook(book)}
                                    style={styles.deleteButton}
                                >
                                    <Text style={styles.deleteButtonText}>🗑️</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>

            <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => setShowBookSelector(true)}
            >
                <Text style={styles.buttonText}>
                    + {t.downloadBook}
                </Text>
            </TouchableOpacity>

            {/* Book Selector Modal */}
            <Modal
                visible={showBookSelector}
                transparent
                animationType="slide"
                onRequestClose={() => setShowBookSelector(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{t.selectBook}</Text>
                                <Text style={styles.modalSubtitle}>
                                    {language === 'es' ? 'Español' : 'English'} • {downloadVersion}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowBookSelector(false)}>
                                <Text style={styles.modalCloseButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.versionList}>
                            <Text style={[styles.modalSubtitle, { textAlign: 'left', paddingHorizontal: 0 }]}>{t.selectVersion}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {availableVersions[language].map((v) => (
                                    <TouchableOpacity
                                        key={v.code}
                                        style={[
                                            styles.versionButton,
                                            downloadVersion === v.code && { backgroundColor: isDark ? '#8B7355' : '#4A5D4E' }
                                        ]}
                                        onPress={() => setDownloadVersion(v.code)}
                                    >
                                        <Text style={[
                                            styles.versionButtonText,
                                            downloadVersion === v.code && { color: '#FFFFFF' }
                                        ]}>
                                            {v.code}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.modalDivider} />

                        <ScrollView style={styles.bookList}>
                            {bibleBooks.map((book, index) => {
                                const bookName = language === 'es' ? book.spanish : book.name;
                                const alreadyDownloaded = downloadedBooks.some(
                                    b => b.bookName === bookName && b.translation === downloadVersion
                                );

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.bookListItem,
                                            alreadyDownloaded && styles.bookListItemDisabled,
                                        ]}
                                        onPress={() => !alreadyDownloaded && downloadBook(book, downloadVersion)}
                                        disabled={alreadyDownloaded}
                                    >
                                        <Text style={[
                                            styles.bookListItemText,
                                            alreadyDownloaded && styles.bookListItemTextDisabled,
                                        ]}>
                                            {bookName}
                                        </Text>
                                        <Text style={styles.bookListItemChapters}>
                                            {book.chapters} {t.chapters}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
