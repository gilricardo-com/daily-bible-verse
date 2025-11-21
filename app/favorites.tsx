import React, { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FavoritesView } from '../src/components/FavoritesView';
import { usePreferences } from '../src/contexts/PreferencesContext';
import { useBible } from '../src/contexts/BibleContext';
import { createStyles } from '../src/styles';
import { translations } from '../src/constants';

export default function FavoritesScreen() {
    const router = useRouter();
    const { language, isDark } = usePreferences();
    const { favorites, toggleFavorite } = useBible();

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

    return (
        <FavoritesView
            favorites={favorites}
            onBack={() => router.back()}
            t={t}
            styles={styles}
            toggleFavorite={toggleFavorite}
        />
    );
}
