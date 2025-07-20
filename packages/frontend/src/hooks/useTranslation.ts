import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = (language: string) => {
    // Manually update localStorage to ensure persistence
    localStorage.setItem('choirapp-language', language);
    i18n.changeLanguage(language);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const getAvailableLanguages = () => {
    return ['en', 'es'];
  };

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      en: 'English',
      es: 'Español'
    };
    return names[code] || code;
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    getLanguageName,
    isLoading: !i18n.isInitialized
  };
};

export default useTranslation;
