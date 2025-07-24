import React, { useState } from 'react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useTranslation } from '../../hooks/useTranslation';
import './FloatingInstallButton.scss';

interface FloatingInstallButtonProps {
  className?: string;
}

export const FloatingInstallButton: React.FC<FloatingInstallButtonProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { isInstallable, installApp } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if not installable or dismissed
  if (!isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        // Installation successful - component will disappear due to isInstallable becoming false
      } else {
        // User cancelled or installation failed
        setIsInstalling(false);
      }
    } catch (error) {
      console.error('Installation error:', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className={`floating-install-button ${className}`}>
      <div className="install-card">
        <button 
          className="dismiss-button"
          onClick={handleDismiss}
          aria-label={t('pwa.dismissInstall')}
        >
          <XMarkIcon className="dismiss-icon" />
        </button>
        
        <div className="install-content">
          <div className="install-icon">
            <ArrowDownTrayIcon />
          </div>
          
          <div className="install-text">
            <h3 className="install-title">{t('pwa.installTitle')}</h3>
            <p className="install-description">{t('pwa.installDescription')}</p>
          </div>
          
          <button
            className={`install-button ${isInstalling ? 'installing' : ''}`}
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <>
                <div className="loading-spinner" />
                {t('pwa.installing')}
              </>
            ) : (
              t('pwa.installButton')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
