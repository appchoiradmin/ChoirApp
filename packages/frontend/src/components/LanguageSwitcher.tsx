import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './LanguageSwitcher.scss';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'buttons';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  variant = 'dropdown' 
}) => {
  const { 
    t, 
    changeLanguage, 
    getCurrentLanguage, 
    getAvailableLanguages, 
    getLanguageName 
  } = useTranslation();

  const currentLanguage = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();

  const handleLanguageChange = (language: string) => {
    changeLanguage(language);
  };

  if (variant === 'buttons') {
    return (
      <div className={`language-switcher language-switcher--buttons ${className}`}>
        <span className="language-switcher__label">{t('settings.language')}:</span>
        <div className="language-switcher__buttons">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              className={`language-switcher__button ${
                currentLanguage === lang ? 'language-switcher__button--active' : ''
              }`}
              onClick={() => handleLanguageChange(lang)}
              aria-label={`Switch to ${getLanguageName(lang)}`}
            >
              {getLanguageName(lang)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`language-switcher language-switcher--dropdown ${className}`}>
      <label htmlFor="language-select" className="language-switcher__label">
        {t('settings.language')}:
      </label>
      <select
        id="language-select"
        className="language-switcher__select"
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value)}
        aria-label={t('settings.selectLanguage')}
      >
        {availableLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {getLanguageName(lang)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
