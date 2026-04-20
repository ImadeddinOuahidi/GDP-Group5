import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import translations, { SUPPORTED_LANGUAGES, SPEECH_LANG_MAP } from '../i18n/translations';

const LANGUAGE_KEY = 'setting_language';
const DEFAULT_LOCALE = 'en';

const I18nContext = createContext(null);

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function interpolate(template, variables = {}) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (variables[key] === undefined || variables[key] === null) {
      return `{{${key}}}`;
    }
    return String(variables[key]);
  });
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (stored && translations[stored]) {
          setLocale(stored);
        }
      } catch (error) {
        console.error('Failed to load preferred language:', error);
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = useCallback(async (langCode) => {
    if (!translations[langCode]) {
      return false;
    }

    setLocale(langCode);
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, langCode);
      return true;
    } catch (error) {
      console.error('Failed to save preferred language:', error);
      return false;
    }
  }, []);

  const t = useCallback((key, variables = {}) => {
    const activeTranslation = getNestedValue(translations[locale], key);
    if (typeof activeTranslation === 'string') {
      return interpolate(activeTranslation, variables);
    }

    const fallbackTranslation = getNestedValue(translations[DEFAULT_LOCALE], key);
    if (typeof fallbackTranslation === 'string') {
      return interpolate(fallbackTranslation, variables);
    }

    return key;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    t,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    speechLanguage: SPEECH_LANG_MAP[locale] || SPEECH_LANG_MAP[DEFAULT_LOCALE],
  }), [locale, t, changeLanguage]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nContext;
