/**
 * PWA Utilities for ChoirApp
 * Handles service worker communication and offline playlist caching
 */

import React from 'react';

export interface PlaylistCacheStatus {
  playlistId: string;
  songCount: number;
  timestamp: number;
  isOfflineReady: boolean;
}

export interface PWAStatus {
  isOnline: boolean;
  isServiceWorkerSupported: boolean;
  isServiceWorkerActive: boolean;
  cachedPlaylists: Map<string, PlaylistCacheStatus>;
}

class PWAManager {
  private listeners: Map<string, Function[]> = new Map();
  private cachedPlaylists: Map<string, PlaylistCacheStatus> = new Map();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.initializeServiceWorkerListeners();
    this.initializeNetworkListeners();
  }

  /**
   * Initialize service worker message listeners
   */
  private initializeServiceWorkerListeners() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { data } = event;
        
        if (data.type === 'PLAYLIST_CACHED') {
          this.handlePlaylistCached(data);
        }
      });
    }
  }

  /**
   * Initialize network status listeners
   */
  private initializeNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('networkStatus', { isOnline: true });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('networkStatus', { isOnline: false });
    });
  }

  /**
   * Handle playlist cached notification from service worker
   */
  private handlePlaylistCached(data: any) {
    const cacheStatus: PlaylistCacheStatus = {
      playlistId: data.playlistId,
      songCount: data.songCount,
      timestamp: data.timestamp,
      isOfflineReady: true
    };

    this.cachedPlaylists.set(data.playlistId, cacheStatus);
    
    console.log(`🎉 Playlist ${data.playlistId} is now available offline (${data.songCount} songs)`);
    
    // Notify listeners
    this.emit('playlistCached', cacheStatus);
  }

  /**
   * Check if a playlist is cached and ready for offline use
   */
  public isPlaylistCached(playlistId: string): boolean {
    const status = this.cachedPlaylists.get(playlistId);
    return status?.isOfflineReady || false;
  }

  /**
   * Get cache status for a specific playlist
   */
  public getPlaylistCacheStatus(playlistId: string): PlaylistCacheStatus | null {
    return this.cachedPlaylists.get(playlistId) || null;
  }

  /**
   * Get overall PWA status
   */
  public getPWAStatus(): PWAStatus {
    return {
      isOnline: this.isOnline,
      isServiceWorkerSupported: 'serviceWorker' in navigator,
      isServiceWorkerActive: navigator.serviceWorker?.controller !== null,
      cachedPlaylists: new Map(this.cachedPlaylists)
    };
  }

  /**
   * Add event listener for PWA events
   */
  public addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Manually trigger playlist caching (for testing or manual cache refresh)
   */
  public async triggerPlaylistCache(playlistId: string): Promise<void> {
    try {
      // This would trigger a fresh fetch of the playlist, which should trigger caching
      const response = await fetch(`/api/playlists/${playlistId}`);
      if (response.ok) {
        console.log(`🔄 Triggered cache refresh for playlist ${playlistId}`);
      }
    } catch (error) {
      console.error('Failed to trigger playlist cache:', error);
    }
  }

  /**
   * Clear cached playlist data
   */
  public async clearPlaylistCache(playlistId?: string): Promise<void> {
    try {
      if ('caches' in window) {
        const cache = await caches.open('choirapp-playlist-songs-v1.3');
        
        if (playlistId) {
          // Clear specific playlist songs (this is approximate - actual implementation would need more sophisticated tracking)
          console.log(`🧹 Clearing cache for playlist ${playlistId}`);
          this.cachedPlaylists.delete(playlistId);
        } else {
          // Clear all playlist caches
          const keys = await cache.keys();
          await Promise.all(keys.map(key => cache.delete(key)));
          this.cachedPlaylists.clear();
          console.log('🧹 Cleared all playlist caches');
        }
      }
    } catch (error) {
      console.error('Failed to clear playlist cache:', error);
    }
  }

  /**
   * Get cache storage usage information
   */
  public async getCacheStorageInfo(): Promise<{ usage: number; quota: number } | null> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
    return null;
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

/**
 * React hook for PWA status and playlist caching
 */
export function usePWAStatus() {
  const [pwaStatus, setPWAStatus] = React.useState<PWAStatus>(pwaManager.getPWAStatus());
  const [cachedPlaylists, setCachedPlaylists] = React.useState<Map<string, PlaylistCacheStatus>>(new Map());

  React.useEffect(() => {
    const handlePlaylistCached = (status: PlaylistCacheStatus) => {
      setCachedPlaylists(prev => new Map(prev.set(status.playlistId, status)));
    };

    const handleNetworkStatus = () => {
      setPWAStatus(pwaManager.getPWAStatus());
    };

    pwaManager.addEventListener('playlistCached', handlePlaylistCached);
    pwaManager.addEventListener('networkStatus', handleNetworkStatus);

    return () => {
      pwaManager.removeEventListener('playlistCached', handlePlaylistCached);
      pwaManager.removeEventListener('networkStatus', handleNetworkStatus);
    };
  }, []);

  return {
    pwaStatus,
    cachedPlaylists,
    isPlaylistCached: (playlistId: string) => pwaManager.isPlaylistCached(playlistId),
    getPlaylistCacheStatus: (playlistId: string) => pwaManager.getPlaylistCacheStatus(playlistId),
    triggerPlaylistCache: (playlistId: string) => pwaManager.triggerPlaylistCache(playlistId),
    clearPlaylistCache: (playlistId?: string) => pwaManager.clearPlaylistCache(playlistId),
    getCacheStorageInfo: () => pwaManager.getCacheStorageInfo()
  };
}

/**
 * Utility function to show offline status indicator
 */
export function getOfflineStatusMessage(isOnline: boolean, cachedPlaylistsCount: number): string {
  if (isOnline) {
    return cachedPlaylistsCount > 0 
      ? `Online • ${cachedPlaylistsCount} playlist${cachedPlaylistsCount === 1 ? '' : 's'} cached for offline use`
      : 'Online';
  } else {
    return cachedPlaylistsCount > 0
      ? `Offline • ${cachedPlaylistsCount} playlist${cachedPlaylistsCount === 1 ? '' : 's'} available`
      : 'Offline • Limited functionality';
  }
}


