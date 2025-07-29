import React, { useState, useEffect } from 'react';

/**
 * Simple test component to verify PWA offline status display
 * Shows basic online/offline status without complex PWA manager
 */
export const SimpleOfflineTest: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false);

  useEffect(() => {
    // Check service worker status
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setServiceWorkerActive(true);
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusIcon = () => {
    if (isOnline) {
      return '🌐'; // Online
    } else {
      return '⚠️'; // Offline
    }
  };

  const getStatusText = () => {
    if (isOnline) {
      return 'Online';
    } else {
      return 'Offline';
    }
  };

  const getStatusColor = () => {
    if (isOnline) {
      return '#52c41a'; // Green
    } else {
      return '#ff4d4f'; // Red
    }
  };

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '0.25rem',
        border: `1px solid ${getStatusColor()}`,
        fontSize: '0.875rem'
      }}
    >
      <span style={{ fontSize: '1rem' }}>{getStatusIcon()}</span>
      <span style={{ color: getStatusColor(), fontWeight: '500' }}>
        {getStatusText()}
      </span>
      {serviceWorkerActive && (
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          • SW Active
        </span>
      )}
    </div>
  );
};

export default SimpleOfflineTest;
