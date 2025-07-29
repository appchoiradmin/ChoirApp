# PWA Playlist Song Caching for ChoirApp

## Overview

This implementation provides offline access to all songs in a playlist for choir members during presentations when network connectivity is poor or unavailable. When a playlist is loaded, all individual songs in that playlist are automatically pre-cached for instant offline access.

## How It Works

### 1. Service Worker Enhancement (`public/sw.js`)

The service worker has been enhanced with playlist-specific caching logic:

- **Playlist Detection**: Intercepts requests to `/api/playlists/{playlistId}`
- **Automatic Pre-caching**: When a playlist is fetched, automatically fetches and caches all songs in that playlist
- **Offline-First for Songs**: Song detail requests (`/api/songs/{songId}`) check playlist cache first for instant loading
- **Dedicated Cache**: Uses separate `PLAYLIST_SONGS_CACHE` for playlist-related song data

### 2. Cache Strategy

```
1. User loads playlist → Service worker intercepts request
2. Playlist data fetched from network → Cached in DYNAMIC_CACHE  
3. Service worker extracts all song IDs from playlist sections
4. All songs pre-cached in background → Stored in PLAYLIST_SONGS_CACHE
5. User navigates to any song → Served instantly from cache (even offline)
```

### 3. Client-Side Integration

- **PWA Manager** (`src/utils/pwaUtils.ts`): Handles service worker communication and cache status
- **React Hook** (`usePWAStatus`): Provides cache status to React components
- **UI Components** (`src/components/OfflineStatus.tsx`): Shows offline status and cached playlist info

## Key Features

### ✅ Automatic Pre-caching
- No user action required
- Happens in background when playlist is loaded
- Caches all songs in playlist sections

### ✅ Offline-First Song Access
- Songs load instantly from cache when available
- Graceful fallback to network if not cached
- Works completely offline after initial caching

### ✅ User Feedback
- Real-time notifications when playlists are cached
- Visual indicators showing offline-ready status
- Cache storage usage information

### ✅ Performance Optimized
- Non-blocking background caching
- Deduplication prevents re-caching same songs
- Efficient cache management and cleanup

## Implementation Files

### Core Service Worker
- `public/sw.js` - Enhanced with playlist caching logic

### Client-Side Utilities
- `src/utils/pwaUtils.ts` - PWA manager and React hooks
- `src/components/OfflineStatus.tsx` - UI components for status display
- `src/components/OfflineStatus.scss` - Styles for offline indicators

### Integration Points
- Any page that loads playlists will trigger automatic caching
- Song detail pages benefit from instant cache-first loading
- Navigation components can show offline status

## Usage Examples

### Basic Offline Status Display
```tsx
import { OfflineStatus } from '../components/OfflineStatus';

function PlaylistPage() {
  return (
    <div>
      <OfflineStatus showDetails={true} />
      {/* Your playlist content */}
    </div>
  );
}
```

### Playlist-Specific Status
```tsx
import { PlaylistOfflineStatus } from '../components/OfflineStatus';

function PlaylistHeader({ playlistId }: { playlistId: string }) {
  return (
    <div>
      <h1>My Playlist</h1>
      <PlaylistOfflineStatus playlistId={playlistId} />
    </div>
  );
}
```

### React Hook Usage
```tsx
import { usePWAStatus } from '../utils/pwaUtils';

function MyComponent() {
  const { pwaStatus, cachedPlaylists, isPlaylistCached } = usePWAStatus();
  
  return (
    <div>
      <p>Network: {pwaStatus.isOnline ? 'Online' : 'Offline'}</p>
      <p>Cached Playlists: {cachedPlaylists.size}</p>
    </div>
  );
}
```

## Testing Guide

### 1. Basic Functionality Test
1. **Load a playlist** with multiple songs
2. **Check browser console** for caching logs:
   ```
   🎵 Handling playlist request: [playlist-id]
   🚀 Pre-caching songs for playlist: [playlist-id]
   🎵 Found X unique songs to cache for playlist [playlist-id]
   ✅ Cached song [song-id] for playlist [playlist-id]
   🎉 Finished pre-caching songs for playlist [playlist-id]
   ```

### 2. Offline Navigation Test
1. **Load a playlist** (ensure caching completes)
2. **Go offline** (disable network in DevTools)
3. **Navigate to individual songs** in the playlist
4. **Verify instant loading** without network requests
5. **Navigate back to playlist** - should work offline

### 3. Cache Storage Verification
1. **Open DevTools** → Application → Storage → Cache Storage
2. **Find cache**: `choirapp-playlist-songs-v1.3`
3. **Verify song responses** are cached with correct URLs
4. **Check cache size** and storage usage

### 4. Service Worker Communication Test
1. **Open browser console**
2. **Load a playlist**
3. **Look for client notification**:
   ```
   📢 Notified X clients about cached playlist [playlist-id]
   ```
4. **Check PWA status components** update in real-time

### 5. Error Handling Test
1. **Simulate network errors** during playlist loading
2. **Verify graceful fallback** to cached data
3. **Test partial song caching** (some songs fail to cache)
4. **Ensure app remains functional** with mixed cache states

## Browser Console Logs

When working correctly, you should see these logs:

### Playlist Loading
```
🎵 Handling playlist request: abc123-def456
🚀 Pre-caching songs for playlist: abc123-def456
🎵 Found 8 unique songs to cache for playlist abc123-def456
```

### Song Caching
```
✅ Cached song song-id-1 for playlist abc123-def456
✅ Cached song song-id-2 for playlist abc123-def456
...
🎉 Finished pre-caching songs for playlist abc123-def456
📢 Notified 1 clients about cached playlist abc123-def456
```

### Song Loading (Cached)
```
🎵 Handling song request: song-id-1
⚡ Serving cached playlist song: song-id-1
```

### Song Loading (Network)
```
🎵 Handling song request: song-id-new
📱 Serving cached song from dynamic cache: song-id-new
```

## Cache Management

### Storage Locations
- **Static Cache**: `choirapp-static-v1.3` - App shell resources
- **Dynamic Cache**: `choirapp-dynamic-v1.3` - General API responses
- **Playlist Songs Cache**: `choirapp-playlist-songs-v1.3` - Pre-cached playlist songs

### Cache Cleanup
- Old cache versions automatically cleaned up on service worker activation
- Playlist cache can be manually cleared via `pwaManager.clearPlaylistCache()`
- Storage usage monitored via `getCacheStorageInfo()`

## Performance Considerations

### Efficient Caching
- Songs are only cached once (deduplication)
- Background caching doesn't block UI
- Promise.allSettled() prevents one failed song from blocking others

### Storage Management
- Monitor cache storage usage
- Implement cache size limits if needed
- Consider cache expiration for very old playlists

### Network Optimization
- Network-first for playlist metadata (always fresh)
- Cache-first for song content (performance priority)
- Graceful degradation when offline

## Troubleshooting

### Common Issues

1. **Songs not caching**
   - Check network connectivity during playlist load
   - Verify song IDs exist in playlist sections
   - Check browser console for error logs

2. **Offline navigation fails**
   - Ensure service worker is active
   - Verify cache contains expected song responses
   - Check for CORS issues with cached responses

3. **Cache not updating**
   - Clear browser cache and reload
   - Check service worker version numbers
   - Verify cache cleanup on activation

### Debug Commands

```javascript
// Check cache contents
caches.open('choirapp-playlist-songs-v1.3').then(cache => 
  cache.keys().then(keys => console.log('Cached songs:', keys.length))
);

// Check PWA status
console.log(pwaManager.getPWAStatus());

// Manually trigger playlist cache
pwaManager.triggerPlaylistCache('your-playlist-id');
```

## Future Enhancements

### Potential Improvements
- **Background Sync**: Update cached songs when network available
- **Selective Caching**: Allow users to choose which playlists to cache
- **Cache Compression**: Reduce storage usage for large song content
- **Offline Indicators**: More prominent UI feedback for offline readiness
- **Cache Analytics**: Track cache hit rates and usage patterns

### Advanced Features
- **Playlist Sharing**: Share cached playlists between devices
- **Smart Prefetching**: Predict and cache likely-to-be-accessed playlists
- **Differential Updates**: Only cache changed songs in playlist updates
- **Storage Quotas**: Implement intelligent cache eviction policies

## Conclusion

This PWA playlist caching implementation ensures choir members can access all songs in a playlist instantly, even with poor or no network connectivity during presentations. The solution is automatic, efficient, and provides clear user feedback about offline readiness.

The implementation follows PWA best practices and provides a foundation for further offline functionality enhancements in ChoirApp.
