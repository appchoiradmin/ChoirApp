const CACHE_NAME = 'choirapp-v1.5';
const STATIC_CACHE = 'choirapp-static-v1.5';
const DYNAMIC_CACHE = 'choirapp-dynamic-v1.5';
const PLAYLIST_SONGS_CACHE = 'choirapp-playlist-songs-v1.5';

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
  /\/api\//  // API calls (except cached playlist songs)
];

// Playlist-related API patterns for special handling
const playlistPatterns = {
  playlistDetail: /\/api\/playlists\/([a-f0-9-]+)$/,
  songDetail: /\/api\/songs\/([a-f0-9-]+)$/,
  choirPlaylists: /\/api\/choirs\/([a-f0-9-]+)\/playlists$/,
  choirSongs: /\/api\/choirs\/([a-f0-9-]+)\/songs$/
};

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

// Fetch event - intelligent caching strategy with playlist support
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Check if this is a playlist detail request
  const playlistMatch = url.pathname.match(playlistPatterns.playlistDetail);
  if (playlistMatch) {
    event.respondWith(handlePlaylistRequest(request, playlistMatch[1]));
    return;
  }
  
  // Check if this is a song detail request that might be cached from playlist
  const songMatch = url.pathname.match(playlistPatterns.songDetail);
  if (songMatch) {
    event.respondWith(handleSongRequest(request, songMatch[1]));
    return;
  }
  
  // Check if this is a choir playlists request (PlaylistsPage)
  const choirPlaylistsMatch = url.pathname.match(playlistPatterns.choirPlaylists);
  if (choirPlaylistsMatch) {
    event.respondWith(handleChoirPlaylistsRequest(request, choirPlaylistsMatch[1]));
    return;
  }
  
  // Check if this is a choir songs request (PlaylistsPage)
  const choirSongsMatch = url.pathname.match(playlistPatterns.choirSongs);
  if (choirSongsMatch) {
    event.respondWith(handleChoirSongsRequest(request, choirSongsMatch[1]));
    return;
  }
  
  // Network-first strategy for other API calls and HTML documents
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
      // Only cache http/https requests (avoid chrome-extension errors)
      const url = new URL(request.url);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
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
            if (![STATIC_CACHE, DYNAMIC_CACHE, PLAYLIST_SONGS_CACHE].includes(cacheName)) {
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

// ===== PLAYLIST SONG PRE-CACHING FUNCTIONALITY =====

// Handle playlist detail requests with poor connection handling
async function handlePlaylistRequest(request, playlistId) {
  console.log('🎵 Handling playlist request:', playlistId);
  
  // Get cached version first
  const cachedResponse = await caches.match(request);
  
  // For poor connections: serve cache immediately if available, update in background
  if (cachedResponse) {
    console.log('⚡ Serving cached playlist immediately:', playlistId);
    
    // Update cache in background (stale-while-revalidate pattern)
    updatePlaylistInBackground(request, playlistId);
    
    return cachedResponse;
  }
  
  // No cache available, try network with timeout
  try {
    const networkResponse = await fetchWithTimeout(request, 5000); // 5 second timeout
    
    if (networkResponse.ok) {
      const playlistData = await networkResponse.clone().json();
      
      // Cache the playlist response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      
      // Pre-cache all songs in this playlist
      preCachePlaylistSongs(playlistData, playlistId);
      
      console.log('🌐 Served fresh playlist from network:', playlistId);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('❌ Playlist network request failed/timeout:', error.message);
    
    // Final fallback to cache (in case we missed it above)
    const fallbackCache = await caches.match(request);
    if (fallbackCache) {
      console.log('📱 Serving cached playlist (fallback):', playlistId);
      return fallbackCache;
    }
    
    throw new Error('Playlist not available - no network or cache');
  }
}

// Handle song detail requests with cache-first and timeout for poor connections
async function handleSongRequest(request, songId) {
  console.log('🎵 Handling song request:', songId);
  
  // Always check cache first for instant loading
  const playlistCache = await caches.open(PLAYLIST_SONGS_CACHE);
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  
  const cachedSong = await playlistCache.match(request) || await dynamicCache.match(request);
  
  if (cachedSong) {
    console.log('⚡ Serving cached song instantly:', songId);
    
    // Update in background if network is available (stale-while-revalidate)
    updateSongInBackground(request, songId);
    
    return cachedSong;
  }
  
  // No cache available, try network with timeout
  try {
    const networkResponse = await fetchWithTimeout(request, 3000); // 3 second timeout for songs
    
    if (networkResponse.ok) {
      // Cache in both locations for future use
      dynamicCache.put(request, networkResponse.clone());
      
      console.log('🌐 Served fresh song from network:', songId);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('❌ Song network request failed/timeout:', error.message);
    
    // Final check for any cached version
    const finalCache = await playlistCache.match(request) || await dynamicCache.match(request);
    if (finalCache) {
      console.log('📱 Serving stale cached song (network timeout):', songId);
      return finalCache;
    }
    
    throw new Error('Song not available - no network or cache');
  }
}

// Pre-cache all songs in a playlist for offline access
async function preCachePlaylistSongs(playlistData, playlistId) {
  console.log('🚀 Pre-caching songs for playlist:', playlistId);
  
  if (!playlistData.sections || !Array.isArray(playlistData.sections)) {
    console.log('⚠️ No sections found in playlist data');
    return;
  }
  
  const cache = await caches.open(PLAYLIST_SONGS_CACHE);
  const songIds = new Set();
  
  // Collect all unique song IDs from all sections
  playlistData.sections.forEach(section => {
    if (section.songs && Array.isArray(section.songs)) {
      section.songs.forEach(song => {
        if (song.songId) {
          songIds.add(song.songId);
        }
      });
    }
  });
  
  console.log(`🎵 Found ${songIds.size} unique songs to cache for playlist ${playlistId}`);
  
  // Pre-cache each song
  const cachePromises = Array.from(songIds).map(async (songId) => {
    try {
      // Build the song detail URL (assuming same origin as playlist)
      const songUrl = new URL(`/api/songs/${songId}`, self.location.origin);
      const songRequest = new Request(songUrl.toString());
      
      // Check if already cached
      const cached = await cache.match(songRequest);
      if (cached) {
        console.log(`✅ Song ${songId} already cached`);
        return;
      }
      
      // Fetch and cache the song
      const response = await fetch(songRequest);
      
      if (response.ok) {
        await cache.put(songRequest, response.clone());
        console.log(`✅ Cached song ${songId} for playlist ${playlistId}`);
      } else {
        console.log(`⚠️ Failed to fetch song ${songId}: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Error caching song ${songId}:`, error);
    }
  });
  
  // Wait for all songs to be cached (with a reasonable timeout)
  try {
    await Promise.allSettled(cachePromises);
    console.log(`🎉 Finished pre-caching songs for playlist ${playlistId}`);
    
    // Notify clients that playlist is ready for offline use
    notifyClientsPlaylistCached(playlistId, songIds.size);
    
  } catch (error) {
    console.log('❌ Error during batch song caching:', error);
  }
}

// Notify clients that a playlist has been cached
async function notifyClientsPlaylistCached(playlistId, songCount) {
  try {
    const clients = await self.clients.matchAll();
    const message = {
      type: 'PLAYLIST_CACHED',
      playlistId: playlistId,
      songCount: songCount,
      timestamp: Date.now()
    };
    
    clients.forEach(client => {
      client.postMessage(message);
    });
    
    console.log(`📢 Notified ${clients.length} clients about cached playlist ${playlistId}`);
    
  } catch (error) {
    console.log('❌ Error notifying clients:', error);
  }
}

// Fetch with timeout for poor connection handling
async function fetchWithTimeout(request, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(request, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Update playlist in background (stale-while-revalidate pattern)
async function updatePlaylistInBackground(request, playlistId) {
  try {
    console.log('🔄 Updating playlist in background:', playlistId);
    
    const networkResponse = await fetchWithTimeout(request, 10000); // Longer timeout for background
    
    if (networkResponse.ok) {
      const playlistData = await networkResponse.clone().json();
      
      // Update cache
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      
      // Update song cache if needed
      preCachePlaylistSongs(playlistData, playlistId);
      
      console.log('✅ Background playlist update completed:', playlistId);
    }
  } catch (error) {
    console.log('⚠️ Background playlist update failed (using stale cache):', error.message);
  }
}

// Update song in background (stale-while-revalidate pattern)
async function updateSongInBackground(request, songId) {
  try {
    console.log('🔄 Updating song in background:', songId);
    
    const networkResponse = await fetchWithTimeout(request, 8000); // Background timeout
    
    if (networkResponse.ok) {
      // Update dynamic cache
      const dynamicCache = await caches.open(DYNAMIC_CACHE);
      await dynamicCache.put(request, networkResponse.clone());
      
      console.log('✅ Background song update completed:', songId);
    }
  } catch (error) {
    console.log('⚠️ Background song update failed (using stale cache):', error.message);
  }
}

// Handle choir playlists request (PlaylistsPage) with cache-first
async function handleChoirPlaylistsRequest(request, choirId) {
  console.log('📋 Handling choir playlists request:', choirId);
  
  // Check cache first for instant loading
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('⚡ Serving cached choir playlists instantly:', choirId);
    
    // Update in background (stale-while-revalidate)
    updateChoirPlaylistsInBackground(request, choirId);
    
    return cachedResponse;
  }
  
  // No cache available, try network with timeout
  try {
    const networkResponse = await fetchWithTimeout(request, 5000);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      
      console.log('🌐 Served fresh choir playlists from network:', choirId);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('❌ Choir playlists network request failed/timeout:', error.message);
    
    // Final fallback to cache
    const fallbackCache = await caches.match(request);
    if (fallbackCache) {
      console.log('📱 Serving stale cached choir playlists:', choirId);
      return fallbackCache;
    }
    
    throw new Error('Choir playlists not available - no network or cache');
  }
}

// Handle choir songs request (PlaylistsPage) with cache-first
async function handleChoirSongsRequest(request, choirId) {
  console.log('🎵 Handling choir songs request:', choirId);
  
  // Check cache first for instant loading
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('⚡ Serving cached choir songs instantly:', choirId);
    
    // Update in background (stale-while-revalidate)
    updateChoirSongsInBackground(request, choirId);
    
    return cachedResponse;
  }
  
  // No cache available, try network with timeout
  try {
    const networkResponse = await fetchWithTimeout(request, 5000);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      
      console.log('🌐 Served fresh choir songs from network:', choirId);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('❌ Choir songs network request failed/timeout:', error.message);
    
    // Final fallback to cache
    const fallbackCache = await caches.match(request);
    if (fallbackCache) {
      console.log('📱 Serving stale cached choir songs:', choirId);
      return fallbackCache;
    }
    
    throw new Error('Choir songs not available - no network or cache');
  }
}

// Update choir playlists in background
async function updateChoirPlaylistsInBackground(request, choirId) {
  try {
    console.log('🔄 Updating choir playlists in background:', choirId);
    
    const networkResponse = await fetchWithTimeout(request, 10000);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      
      console.log('✅ Background choir playlists update completed:', choirId);
    }
  } catch (error) {
    console.log('⚠️ Background choir playlists update failed:', error.message);
  }
}

// Update choir songs in background
async function updateChoirSongsInBackground(request, choirId) {
  try {
    console.log('🔄 Updating choir songs in background:', choirId);
    
    const networkResponse = await fetchWithTimeout(request, 10000);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      
      console.log('✅ Background choir songs update completed:', choirId);
    }
  } catch (error) {
    console.log('⚠️ Background choir songs update failed:', error.message);
  }
}

// Clean up old playlist song caches (optional - call periodically)
async function cleanupPlaylistCache() {
  try {
    const cache = await caches.open(PLAYLIST_SONGS_CACHE);
    const requests = await cache.keys();
    
    console.log(`🧹 Playlist cache contains ${requests.length} cached songs`);
    
    // You could implement logic here to remove old cached songs
    // based on timestamp, usage, or storage limits
    
  } catch (error) {
    console.log('❌ Error during cache cleanup:', error);
  }
}
