import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PreferencesProvider, usePreferences } from '../src/contexts/PreferencesContext';
import { BibleProvider } from '../src/contexts/BibleContext';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function RootLayoutNav() {
    const { isDark } = usePreferences();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1C1C1C' : '#F5F5F0' }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Slot />
        </SafeAreaView>
    );
}

export default function RootLayout() {
    return (
        <PreferencesProvider>
            <BibleProvider>
                <RootLayoutNav />
            </BibleProvider>
        </PreferencesProvider>
    );
}
