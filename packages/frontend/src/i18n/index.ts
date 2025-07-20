import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations }
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    supportedLngs: ['en', 'es'],
    load: 'languageOnly', // Convert 'en-US' to 'en', 'es-ES' to 'es'
    cleanCode: true,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'choirapp-language'
    }
  })
  .then(() => {
    console.log('i18next initialized successfully');
    console.log('Current language:', i18n.language);
    console.log('Available resources:', Object.keys(i18n.store.data));
  })
  .catch((err) => {
    console.error('i18next initialization failed:', err);
  });

export default i18n;
