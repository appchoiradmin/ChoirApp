import React from 'react';
import { usePWAStatus, getOfflineStatusMessage } from '../utils/pwaUtils';
import './OfflineStatus.scss';

interface OfflineStatusProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Component to display PWA offline status and playlist caching information
 * Shows users when playlists are available offline for presentations
 */
export const OfflineStatus: React.FC<OfflineStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { 
    pwaStatus, 
    cachedPlaylists, 
    getCacheStorageInfo 
  } = usePWAStatus();

  const [storageInfo, setStorageInfo] = React.useState<{ usage: number; quota: number } | null>(null);

  React.useEffect(() => {
    getCacheStorageInfo().then(setStorageInfo);
  }, [getCacheStorageInfo]);

  const cachedPlaylistsCount = cachedPlaylists.size;
  const statusMessage = getOfflineStatusMessage(pwaStatus.isOnline, cachedPlaylistsCount);

  const getStatusIcon = () => {
    if (pwaStatus.isOnline) {
      return cachedPlaylistsCount > 0 ? '🎵' : '🌐';
    } else {
      return cachedPlaylistsCount > 0 ? '📱' : '⚠️';
    }
  };

  const getStatusClass = () => {
    if (pwaStatus.isOnline) {
      return cachedPlaylistsCount > 0 ? 'status-online-cached' : 'status-online';
    } else {
      return cachedPlaylistsCount > 0 ? 'status-offline-cached' : 'status-offline';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`offline-status ${getStatusClass()} ${className}`}>
      <div className="status-indicator">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{statusMessage}</span>
      </div>

      {showDetails && (
        <div className="status-details">
          {cachedPlaylistsCount > 0 && (
            <div className="cached-playlists">
              <h4>Offline-Ready Playlists:</h4>
              <ul>
                {Array.from(cachedPlaylists.values()).map((playlist) => (
                  <li key={playlist.playlistId}>
                    <span className="playlist-id">
                      {playlist.playlistId.substring(0, 8)}...
                    </span>
                    <span className="song-count">
                      {playlist.songCount} songs
                    </span>
                    <span className="cache-time">
                      {new Date(playlist.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {storageInfo && (
            <div className="storage-info">
              <p>
                Cache Storage: {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                {' '}({Math.round((storageInfo.usage / storageInfo.quota) * 100)}% used)
              </p>
            </div>
          )}

          <div className="pwa-info">
            <p>
              Service Worker: {pwaStatus.isServiceWorkerActive ? '✅ Active' : '❌ Inactive'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for use in navigation or status bars
 */
export const OfflineStatusCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { pwaStatus, cachedPlaylists } = usePWAStatus();
  
  const cachedCount = cachedPlaylists.size;
  const icon = pwaStatus.isOnline 
    ? (cachedCount > 0 ? '🎵' : '🌐')
    : (cachedCount > 0 ? '📱' : '⚠️');

  return (
    <div className={`offline-status-compact ${className}`} title={getOfflineStatusMessage(pwaStatus.isOnline, cachedCount)}>
      <span className="compact-icon">{icon}</span>
      {cachedCount > 0 && <span className="compact-count">{cachedCount}</span>}
    </div>
  );
};

/**
 * Playlist-specific offline status indicator
 */
export const PlaylistOfflineStatus: React.FC<{ playlistId: string; className?: string }> = ({ 
  playlistId, 
  className = '' 
}) => {
  const { isPlaylistCached, getPlaylistCacheStatus } = usePWAStatus();
  
  const isCached = isPlaylistCached(playlistId);
  const cacheStatus = getPlaylistCacheStatus(playlistId);

  if (!isCached) {
    return null;
  }

  return (
    <div className={`playlist-offline-status ${className}`}>
      <span className="offline-icon">📱</span>
      <span className="offline-text">
        Available offline ({cacheStatus?.songCount} songs)
      </span>
    </div>
  );
};

export default OfflineStatus;
