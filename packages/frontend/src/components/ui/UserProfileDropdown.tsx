import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useTranslation } from '../../hooks/useTranslation';
import { 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import './UserProfileDropdown.scss';

interface UserProfileDropdownProps {
  className?: string;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ className = '' }) => {
  const { user, token, signOut } = useUser();
  const navigate = useNavigate();
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        portalRef.current &&
        !portalRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]); // Re-run when dropdown opens/closes

  const handleSignOut = () => {
    // Store current URL with parameters to restore after re-authentication
    let currentUrl = window.location.pathname + window.location.search;
    
    // For general dashboard context (songs page without choir), remove showAll parameter
    // so users default back to "My Songs" after re-authentication
    if (window.location.pathname === '/songs') {
      const urlParams = new URLSearchParams(window.location.search);
      // Check if we're in general dashboard context (no choir context)
      const hasChoirContext = urlParams.has('choirId') || window.location.pathname.includes('/choir/');
      
      if (!hasChoirContext && urlParams.has('showAll')) {
        urlParams.delete('showAll');
        currentUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      }
    }
    
    sessionStorage.setItem('redirectAfterAuth', currentUrl);
    
    signOut();
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  if (!user || !token) {
    return null;
  }

  // Get user initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`user-profile-dropdown ${className}`} ref={dropdownRef}>
      <button
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('navigation.profile')}
      >
        <div className="user-avatar">
          {user.name ? (
            <span className="avatar-initials">{getInitials(user.name)}</span>
          ) : (
            <UserCircleIcon className="avatar-icon" />
          )}
        </div>
        <div className="user-info">
          <span className="user-name">{user.name || t('navigation.profile')}</span>
          <span className="user-email">{user.email}</span>
        </div>
        <ChevronDownIcon className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          ref={portalRef}
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            zIndex: 999999,
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            borderRadius: '12px',
            minWidth: '280px',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {user.name ? getInitials(user.name) : '?'}
              </div>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '4px'
                }}>
                  {user.name || 'User'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '4px'
                }}>
                  {user.email}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#0ea5e9',
                  backgroundColor: 'rgba(14, 165, 233, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  {user.role}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '8px 0' }}>
            <button
              onClick={handleProfileClick}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <UserCircleIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              {t('navigation.profile')}
            </button>

            <button
              onClick={handleSettingsClick}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Cog6ToothIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              {t('navigation.settings')}
            </button>

            {/* Quick Language Switcher */}
            <div style={{ padding: '8px 20px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                {t('settings.language')}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => { changeLanguage('en'); setIsOpen(false); }}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    background: getCurrentLanguage() === 'en' ? '#0ea5e9' : 'white',
                    color: getCurrentLanguage() === 'en' ? 'white' : '#374151',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  EN
                </button>
                <button
                  onClick={() => { changeLanguage('es'); setIsOpen(false); }}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    background: getCurrentLanguage() === 'es' ? '#0ea5e9' : 'white',
                    color: getCurrentLanguage() === 'es' ? 'white' : '#374151',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ES
                </button>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' }} />

            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              {t('navigation.logout')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserProfileDropdown;
