import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Card, Layout, Navigation } from '../components/ui';
import { 
  GlobeAltIcon,
  UserIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import './SettingsPage.scss';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Layout 
      navigation={<Navigation title={t('settings.title')} showBackButton={true} />}
    >
      <div className="settings-container">
        {/* Settings Header */}
        <div className="settings-header">
          <div className="header-content">
            <div className="settings-welcome">
              <h1 className="settings-title">{t('settings.title')}</h1>
              <p className="settings-subtitle">
                Manage your account preferences and application settings
              </p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {/* Language Settings */}
          <Card className="settings-card">
            <div className="settings-card-header">
              <div className="card-icon-wrapper">
                <GlobeAltIcon className="card-icon" />
              </div>
              <div className="card-header-content">
                <h2 className="card-title">{t('settings.language')}</h2>
                <p className="card-description">
                  {t('settings.selectLanguage')}
                </p>
              </div>
            </div>
            <div className="settings-card-content">
              <LanguageSwitcher variant="buttons" />
            </div>
          </Card>

          {/* Profile Settings */}
          <Card className="settings-card">
            <div className="settings-card-header">
              <div className="card-icon-wrapper">
                <UserIcon className="card-icon" />
              </div>
              <div className="card-header-content">
                <h2 className="card-title">{t('settings.profile')}</h2>
                <p className="card-description">
                  Update your personal information and preferences
                </p>
              </div>
            </div>
            <div className="settings-card-content">
              <div className="coming-soon">
                <p className="coming-soon-text">
                  Coming soon...
                </p>
              </div>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card className="settings-card">
            <div className="settings-card-header">
              <div className="card-icon-wrapper">
                <BellIcon className="card-icon" />
              </div>
              <div className="card-header-content">
                <h2 className="card-title">{t('settings.notifications')}</h2>
                <p className="card-description">
                  Configure how you receive notifications
                </p>
              </div>
            </div>
            <div className="settings-card-content">
              <div className="coming-soon">
                <p className="coming-soon-text">
                  Coming soon...
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
