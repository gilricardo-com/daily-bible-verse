import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    useColorScheme,
    ScrollView,
    Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

interface BibleVerse {
    text: string;
    reference: string;
    translation_id: string;
}

interface SavedVerse extends BibleVerse {
    id: string;
    savedAt: number;
}

type Language = 'en' | 'es';
type ThemeMode = 'light' | 'dark' | 'system';

const translations = {
    en: {
        title: 'Daily Bible Verse',
        newVerse: 'New Verse',
        loading: 'Loading verse...',
        error: 'Failed to load verse',
        tryAgain: 'Try Again',
        share: 'Share',
        copy: 'Copy',
        copied: 'Verse copied to clipboard!',
        favorites: 'Favorites',
        viewFavorites: 'View Favorites',
        noFavorites: 'No favorite verses yet',
        back: 'Back',
    },
    es: {
        title: 'Versículo Bíblico Diario',
        newVerse: 'Nuevo Versículo',
        loading: 'Cargando versículo...',
        error: 'Error al cargar versículo',
        tryAgain: 'Intentar de nuevo',
        share: 'Compartir',
        copy: 'Copiar',
        copied: '¡Versículo copiado al portapapeles!',
        favorites: 'Favoritos',
        viewFavorites: 'Ver Favoritos',
        noFavorites: 'Aún no hay versículos favoritos',
        back: 'Volver',
    },
};

// Spanish Bible API book mappings
const spanishBookMap: { [key: string]: string } = {
    'John': 'juan',
    'Psalm': 'salmos',
    'Jeremiah': 'jeremias',
    'Philippians': 'filipenses',
    'Romans': 'romanos',
    'Proverbs': 'proverbios',
    'Isaiah': 'isaias',
    'Matthew': 'mateo',
    'Joshua': 'josue',
    'Galatians': 'galatas',
    'Ephesians': 'efesios',
    'Colossians': 'colosenses',
    '1 Corinthians': '1-corintios',
    'Hebrews': 'hebreos',
    'James': 'santiago',
};

// Fallback Spanish verses (RVR1960)
const spanishVersesFallback = [
    {
        text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
        reference: 'Juan 3:16',
    },
    {
        text: 'Jehová es mi pastor; nada me faltará.',
        reference: 'Salmos 23:1',
    },
    {
        text: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',
        reference: 'Jeremías 29:11',
    },
    {
        text: 'Todo lo puedo en Cristo que me fortalece.',
        reference: 'Filipenses 4:13',
    },
    {
        text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.',
        reference: 'Romanos 8:28',
    },
    {
        text: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.',
        reference: 'Proverbios 3:5-6',
    },
    {
        text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.',
        reference: 'Isaías 41:10',
    },
    {
        text: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.',
        reference: 'Mateo 6:33',
    },
    {
        text: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.',
        reference: 'Romanos 12:2',
    },
    {
        text: 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.',
        reference: 'Salmos 46:1',
    },
    {
        text: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.',
        reference: 'Josué 1:9',
    },
    {
        text: 'Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza; contra tales cosas no hay ley.',
        reference: 'Gálatas 5:22-23',
    },
    {
        text: 'Vosotros sois la luz del mundo; una ciudad asentada sobre un monte no se puede esconder.',
        reference: 'Mateo 5:14',
    },
    {
        text: 'Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.',
        reference: 'Juan 14:6',
    },
    {
        text: 'Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.',
        reference: 'Romanos 5:8',
    },
    {
        text: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.',
        reference: 'Efesios 2:8-9',
    },
    {
        text: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.',
        reference: 'Salmos 119:105',
    },
    {
        text: 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.',
        reference: 'Mateo 11:28',
    },
    {
        text: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.',
        reference: 'Colosenses 3:23',
    },
    {
        text: 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece.',
        reference: '1 Corintios 13:4',
    },
    {
        text: 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.',
        reference: 'Hebreos 11:1',
    },
    {
        text: 'Hermanos míos, tened por sumo gozo cuando os halléis en diversas pruebas.',
        reference: 'Santiago 1:2',
    },
    {
        text: 'Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.',
        reference: 'Salmos 139:14',
    },
    {
        text: 'Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.',
        reference: 'Proverbios 16:3',
    },
    {
        text: 'Amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con toda tu mente.',
        reference: 'Mateo 22:37',
    },
    {
        text: 'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.',
        reference: 'Juan 1:1',
    },
    {
        text: 'Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús Señor nuestro.',
        reference: 'Romanos 6:23',
    },
];

const popularVerses = [
    { book: 'John', chapter: 3, verse: '16' },
    { book: 'Psalm', chapter: 23, verse: '1' },
    { book: 'Jeremiah', chapter: 29, verse: '11' },
    { book: 'Philippians', chapter: 4, verse: '13' },
    { book: 'Romans', chapter: 8, verse: '28' },
    { book: 'Proverbs', chapter: 3, verse: '5-6' },
    { book: 'Isaiah', chapter: 41, verse: '10' },
    { book: 'Matthew', chapter: 6, verse: '33' },
    { book: 'Romans', chapter: 12, verse: '2' },
    { book: 'Psalm', chapter: 46, verse: '1' },
    { book: 'Joshua', chapter: 1, verse: '9' },
    { book: 'Galatians', chapter: 5, verse: '22-23' },
    { book: 'Matthew', chapter: 5, verse: '14' },
    { book: 'John', chapter: 14, verse: '6' },
    { book: 'Romans', chapter: 5, verse: '8' },
    { book: 'Ephesians', chapter: 2, verse: '8-9' },
    { book: 'Psalm', chapter: 119, verse: '105' },
    { book: 'Matthew', chapter: 11, verse: '28' },
    { book: 'Colossians', chapter: 3, verse: '23' },
    { book: '1 Corinthians', chapter: 13, verse: '4' },
    { book: 'Hebrews', chapter: 11, verse: '1' },
    { book: 'James', chapter: 1, verse: '2' },
    { book: 'Psalm', chapter: 139, verse: '14' },
    { book: 'Proverbs', chapter: 16, verse: '3' },
    { book: 'Matthew', chapter: 22, verse: '37' },
    { book: 'John', chapter: 1, verse: '1' },
    { book: 'Romans', chapter: 6, verse: '23' },
];

export default function App() {
    const [verse, setVerse] = useState<BibleVerse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [language, setLanguage] = useState<Language>('en');
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const [favorites, setFavorites] = useState<SavedVerse[]>([]);
    const [showFavorites, setShowFavorites] = useState(false);

    const systemColorScheme = useColorScheme();
    const activeTheme = themeMode === 'system' ? systemColorScheme : themeMode;
    const isDark = activeTheme === 'dark';

    const t = translations[language];

    useEffect(() => {
        loadPreferences();
        loadFavorites();
    }, []);

    const loadPreferences = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('language');
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedLanguage) setLanguage(savedLanguage as Language);
            if (savedTheme) setThemeMode(savedTheme as ThemeMode);
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

    const saveFavorites = async (newFavorites: SavedVerse[]) => {
        try {
            await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
            setFavorites(newFavorites);
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    };

    const toggleLanguage = async () => {
        const newLang: Language = language === 'en' ? 'es' : 'en';
        setLanguage(newLang);
        await AsyncStorage.setItem('language', newLang);
        fetchVerse(newLang);
    };

    const cycleTheme = async () => {
        const modes: ThemeMode[] = ['light', 'dark', 'system'];
        const currentIndex = modes.indexOf(themeMode);
        const newMode = modes[(currentIndex + 1) % modes.length];
        setThemeMode(newMode);
        await AsyncStorage.setItem('theme', newMode);
    };

    const getRandomVerse = () => {
        return popularVerses[Math.floor(Math.random() * popularVerses.length)];
    };

    const getRandomSpanishVerseFallback = () => {
        return spanishVersesFallback[Math.floor(Math.random() * spanishVersesFallback.length)];
    };

    const fetchVerse = async (lang: Language = language) => {
        setLoading(true);
        setError(false);

        try {
            if (lang === 'es') {
                // Try Spanish Bible API first
                const randomVerse = getRandomVerse();
                const bookId = spanishBookMap[randomVerse.book];

                if (!bookId) {
                    throw new Error('Book mapping not found');
                }

                // Format range: "chapter:verse" (e.g., "3:16")
                const range = `${randomVerse.chapter}:${randomVerse.verse}`;
                const url = `https://ajphchgh0i.execute-api.us-west-2.amazonaws.com/dev/api/books/${bookId}/verses/${range}`;

                console.log('Fetching Spanish verse from:', url);

                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`API returned ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Spanish API response:', data);

                    if (data && Array.isArray(data) && data.length > 0) {
                        // Concatenate multiple verses if range includes multiple verses
                        const verseText = data.map((v: any) => v.text || v.cleanText).join(' ');
                        const reference = data[0].reference || `${randomVerse.book} ${randomVerse.chapter}:${randomVerse.verse}`;

                        setVerse({
                            text: verseText.trim(),
                            reference: reference,
                            translation_id: 'RVR1960',
                        });
                        setLoading(false);
                        return;
                    }

                    throw new Error('No verse data in response');
                } catch (apiError) {
                    console.log('Spanish API failed, using fallback:', apiError);
                    // Fallback to embedded verses
                    const fallbackVerse = getRandomSpanishVerseFallback();
                    setVerse({
                        text: fallbackVerse.text,
                        reference: fallbackVerse.reference,
                        translation_id: 'RVR1960',
                    });
                    setLoading(false);
                }
            } else {
                // Fetch English verse from API
                const randomVerse = getRandomVerse();
                const verseRef = `${randomVerse.book} ${randomVerse.chapter}:${randomVerse.verse}`;
                const response = await fetch(`https://bible-api.com/${encodeURIComponent(verseRef)}?translation=kjv`);

                if (!response.ok) {
                    throw new Error('Failed to fetch');
                }

                const data = await response.json();

                setVerse({
                    text: data.text.trim(),
                    reference: data.reference,
                    translation_id: data.translation_id || 'KJV',
                });
                setLoading(false);
            }
        } catch (err) {
            setError(true);
            console.error('Error fetching verse:', err);
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

    const styles = createStyles(isDark);

    if (showFavorites) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowFavorites(false)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← {t.back}</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{t.favorites}</Text>
                </View>

                <ScrollView style={styles.favoritesContainer}>
                    {favorites.length === 0 ? (
                        <Text style={styles.noFavoritesText}>{t.noFavorites}</Text>
                    ) : (
                        favorites.map((fav) => (
                            <View key={fav.id} style={styles.favoriteItem}>
                                <View style={styles.favoriteContent}>
                                    <Text style={styles.favoriteVerse}>{fav.text}</Text>
                                    <Text style={styles.favoriteReference}>
                                        {fav.reference} ({fav.translation_id})
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => toggleFavorite(fav)}
                                    style={styles.favoriteButton}
                                >
                                    <Text style={styles.favoriteIcon}>❤️</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t.title}</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={toggleLanguage} style={styles.iconButton}>
                        <Text style={styles.iconButtonText}>{language === 'en' ? '🇺🇸' : '🇪🇸'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={cycleTheme} style={styles.iconButton}>
                        <Text style={styles.iconButtonText}>
                            {themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '⚙️'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color={isDark ? '#8B7355' : '#4A5D4E'} />
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{t.error}</Text>
                        <TouchableOpacity style={styles.button} onPress={() => fetchVerse()}>
                            <Text style={styles.buttonText}>{t.tryAgain}</Text>
                        </TouchableOpacity>
                    </View>
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

                        <TouchableOpacity
                            style={styles.viewFavoritesButton}
                            onPress={() => setShowFavorites(true)}
                        >
                            <Text style={styles.viewFavoritesText}>
                                {t.viewFavorites} ({favorites.length})
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : null}
            </View>
        </View>
    );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#1C1C1C' : '#F5F5F0',
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    iconButton: {
        padding: 8,
    },
    iconButtonText: {
        fontSize: 24,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: isDark ? '#8B7355' : '#4A5D4E',
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: isDark ? '#F5F5F0' : '#2C2C2C',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    verseContainer: {
        maxHeight: '50%',
        marginBottom: 20,
    },
    verseText: {
        fontSize: 20,
        lineHeight: 32,
        color: isDark ? '#E8E8E8' : '#2C2C2C',
        textAlign: 'center',
        marginBottom: 20,
    },
    reference: {
        fontSize: 16,
        color: isDark ? '#8B7355' : '#4A5D4E',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: isDark ? '#2C2C2C' : '#FFFFFF',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: isDark ? '#444' : '#DDD',
    },
    actionButtonText: {
        fontSize: 16,
        color: isDark ? '#E8E8E8' : '#2C2C2C',
    },
    button: {
        backgroundColor: isDark ? '#8B7355' : '#4A5D4E',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    viewFavoritesButton: {
        marginTop: 20,
        padding: 10,
    },
    viewFavoritesText: {
        color: isDark ? '#8B7355' : '#4A5D4E',
        fontSize: 16,
        textDecoration: 'underline',
    },
    errorContainer: {
        alignItems: 'center',
    },
    errorText: {
        color: isDark ? '#E88B8B' : '#C44',
        fontSize: 16,
        marginBottom: 20,
    },
    favoritesContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    noFavoritesText: {
        color: isDark ? '#888' : '#666',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
    favoriteItem: {
        backgroundColor: isDark ? '#2C2C2C' : '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isDark ? '#444' : '#E0E0E0',
    },
    favoriteContent: {
        flex: 1,
    },
    favoriteVerse: {
        fontSize: 16,
        color: isDark ? '#E8E8E8' : '#2C2C2C',
        marginBottom: 8,
        lineHeight: 24,
    },
    favoriteReference: {
        fontSize: 14,
        color: isDark ? '#8B7355' : '#4A5D4E',
        fontStyle: 'italic',
    },
    favoriteButton: {
        padding: 10,
    },
    favoriteIcon: {
        fontSize: 24,
    },
});