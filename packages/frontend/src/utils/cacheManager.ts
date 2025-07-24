/**
 * Cache Management Utilities for ChoirApp
 * These utilities help manage service worker cache and resolve loading issues
 */

export class CacheManager {
  /**
   * Clear all service worker caches
   * Useful when the app fails to load due to stale cache
   */
  static async clearCache(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Send message to service worker to clear cache
        if (registration.active) {
          registration.active.postMessage({ type: 'CLEAR_CACHE' });
          console.log('Cache clear request sent to service worker');
          
          // Listen for confirmation
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_CLEARED') {
              console.log('✅ Cache cleared successfully');
              // Optionally reload the page
              window.location.reload();
            }
          });
        }
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    } else {
      console.log('Service Worker not supported');
    }
  }

  /**
   * Force update the service worker
   * Useful when a new version is available
   */
  static async forceUpdate(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          console.log('✅ Service worker update requested');
          
          // If there's a waiting service worker, activate it
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      } catch (error) {
        console.error('Failed to update service worker:', error);
      }
    }
  }

  /**
   * Get cache information for debugging
   */
  static async getCacheInfo(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        console.log('📦 Available caches:', cacheNames);
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          console.log(`📁 Cache "${cacheName}" contains ${keys.length} items:`, 
            keys.map(req => req.url));
        }
      } catch (error) {
        console.error('Failed to get cache info:', error);
      }
    }
  }

  /**
   * Complete cache reset - clears everything and reloads
   * Use this as a last resort when the app won't load
   */
  static async emergencyReset(): Promise<void> {
    console.log('🚨 Performing emergency cache reset...');
    
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ All caches deleted');
      }
      
      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('✅ Service worker unregistered');
      }
      
      // Clear local storage (optional - uncomment if needed)
      // localStorage.clear();
      // sessionStorage.clear();
      
      console.log('🔄 Reloading page...');
      window.location.reload();
      
    } catch (error) {
      console.error('Emergency reset failed:', error);
      console.log('💡 Try manually clearing browser data for this site');
    }
  }
}

// Make it available globally for console debugging
declare global {
  interface Window {
    cacheManager: typeof CacheManager;
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.cacheManager = CacheManager;
}

export default CacheManager;
