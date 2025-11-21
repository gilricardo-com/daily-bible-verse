import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, ThemeMode } from '../types';

interface PreferencesContextType {
    language: Language;
    selectedVersion: { en: string; es: string };
    themeMode: ThemeMode;
    isDark: boolean;
    changeLanguage: (lang: Language) => Promise<void>;
    changeVersion: (version: string) => Promise<void>;
    cycleTheme: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('en');
    const [selectedVersion, setSelectedVersion] = useState<{ en: string; es: string }>({
        en: 'WEB',
        es: 'RV1960',
    });
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');

    const isDark = themeMode === 'dark';

    useEffect(() => {
        loadPreferences();
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
            else setThemeMode('light');
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    };

    const changeLanguage = async (newLang: Language) => {
        setLanguage(newLang);
        await AsyncStorage.setItem('language', newLang);
    };

    const changeVersion = async (versionCode: string) => {
        const newVersions = { ...selectedVersion, [language]: versionCode };
        setSelectedVersion(newVersions);
        await AsyncStorage.setItem(`version_${language}`, versionCode);
    };

    const cycleTheme = async () => {
        const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newMode);
        await AsyncStorage.setItem('theme', newMode);
    };

    return (
        <PreferencesContext.Provider
            value={{
                language,
                selectedVersion,
                themeMode,
                isDark,
                changeLanguage,
                changeVersion,
                cycleTheme,
            }}
        >
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
};
