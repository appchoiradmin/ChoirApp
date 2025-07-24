const CACHE_NAME = 'choirapp-v1.2';
const STATIC_CACHE = 'choirapp-static-v1.2';
const DYNAMIC_CACHE = 'choirapp-dynamic-v1.2';

// Static resources that rarely change
const staticAssets = [
  '/manifest.json',
  '/icons/icon-16x16.png',
  '/icons/icon-32x32.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Resources that should always be fetched from network first
const networkFirstPatterns = [
  /\/$/, // Root path
  /\.html$/, // HTML files
  /\/api\//  // API calls
];

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(staticAssets);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Network-first strategy for HTML documents and API calls
  const shouldUseNetworkFirst = networkFirstPatterns.some(pattern => 
    pattern.test(url.pathname)
  );
  
  if (shouldUseNetworkFirst) {
    event.respondWith(networkFirst(request));
  } else {
    // Cache-first for static assets (JS, CSS, images)
    event.respondWith(cacheFirst(request));
  }
});

// Network-first strategy
async function networkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response and return it
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    return await caches.match(request) || networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page or error
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch resource:', request.url, error);
    throw error;
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Handle offline actions when connection is restored
  }
});

// Handle messages from the main thread (for cache management)
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('All caches cleared');
        // Notify the client that cache has been cleared
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      })
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push notification data:', data);
    
    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      requireInteraction: true, // Keep notification visible until user interacts
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/icon-32x32.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: {
        url: data.url || '/',
        type: data.data?.type || 'general',
        dateOfArrival: Date.now(),
        ...data.data
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'AppChoir', options)
    );
  } else {
    // Fallback for push notifications without data
    event.waitUntil(
      self.registration.showNotification('AppChoir', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
