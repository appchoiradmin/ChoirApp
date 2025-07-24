import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import UserProfileDropdown from './UserProfileDropdown';
import { useTranslation } from '../../hooks/useTranslation';
import './Navigation.scss';

interface NavigationProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  actions?: React.ReactNode;
  showUserProfile?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  title = 'AppChoir',
  showBackButton = false,
  onBackClick,
  actions,
  showUserProfile = true
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <nav className="navbar is-primary" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          {showBackButton && (
            <button
              className="navbar-item button is-ghost has-text-white"
              onClick={handleBackClick}
              aria-label={t('common.back')}
            >
              <ArrowLeftIcon className="icon" style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          )}
          
          <div className="navbar-item has-text-white is-size-5 has-text-weight-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img 
              src="/icons/icon-32x32.png" 
              alt="ChoirApp" 
              className="navbar-logo"
              style={{ width: '24px', height: '24px' }}
            />
            <span>{title}</span>
          </div>
          
          {/* Custom actions */}
          {actions && (
            <div className="navbar-item">
              {actions}
            </div>
          )}
          
          {/* User profile on the right side of navbar-brand */}
          {showUserProfile && (
            <div className="navbar-item" style={{ marginLeft: 'auto' }}>
              <UserProfileDropdown />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
