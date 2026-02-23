import React, { createContext, useContext, useState, useCallback } from 'react';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

// All available translations
const translations = { en, fr, es };

// Supported languages with display names
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

// Speech recognition language codes mapped to i18n codes
export const SPEECH_LANG_MAP = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};

const I18nContext = createContext(null);

/**
 * Get a nested translation value by dot-notation key
 * Supports interpolation with {{variable}} syntax
 */
function getNestedValue(obj, path, variables = {}) {
  const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
  if (typeof value !== 'string') return path; // fallback to key
  // Replace {{variable}} placeholders
  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });

  const t = useCallback((key, variables = {}) => {
    // Try current locale, then fall back to English
    const result = getNestedValue(translations[locale], key, variables);
    if (result !== key) return result;
    return getNestedValue(translations.en, key, variables);
  }, [locale]);

  const changeLanguage = useCallback((langCode) => {
    if (translations[langCode]) {
      setLocale(langCode);
      localStorage.setItem('preferredLanguage', langCode);
      document.documentElement.lang = langCode;
    }
  }, []);

  const value = {
    locale,
    t,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    speechLang: SPEECH_LANG_MAP[locale] || 'en-US',
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access the i18n context
 * Usage: const { t, locale, changeLanguage } = useI18n();
 *        t('dashboard.welcomeBack', { name: 'John' })
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nContext;
