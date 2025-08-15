import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { UserProvider } from './contexts/UserContext.tsx';
import './utils/cacheManager'; // Make cache manager available globally

// Initialize i18n
import './i18n';

import './theme.scss';
import './index.css';
import './styles/mobile-responsive.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Handle service worker updates for critical cache fixes
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available - force activation for cache fix
                console.log('🔄 New service worker available - activating for cache fix');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                
                // Optionally show user notification
                if (confirm('A critical update is available to fix playlist loading. Refresh now?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
        
        // Handle service worker activation
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('✅ Service worker updated - cache fix active');
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
