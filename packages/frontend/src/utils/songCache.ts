import { SongDto } from '../types/song';

interface CachedSong {
  song: SongDto;
  timestamp: number;
  ttl: number;
}

/**
 * Global song cache to prevent redundant API calls when navigating between pages
 * Implements TTL-based caching with automatic cleanup
 */
class SongCache {
  private cache: Map<string, CachedSong> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get a song from cache if it exists and hasn't expired
   */
  get(songId: string): SongDto | null {
    const cached = this.cache.get(songId);
    
    if (!cached) {
      console.log('🎵 Song Cache: MISS', { songId, reason: 'not_found' });
      return null;
    }

    const now = Date.now();
    const isExpired = now > (cached.timestamp + cached.ttl);
    
    if (isExpired) {
      console.log('🎵 Song Cache: MISS', { songId, reason: 'expired', age: now - cached.timestamp });
      this.cache.delete(songId);
      return null;
    }

    console.log('🎵 Song Cache: HIT', { songId, age: now - cached.timestamp });
    return cached.song;
  }

  /**
   * Store a song in cache with TTL
   */
  set(songId: string, song: SongDto, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(songId, {
      song,
      timestamp: Date.now(),
      ttl
    });
    
    console.log('🎵 Song Cache: SET', { songId, ttl });
    
    // Cleanup expired entries periodically
    this.cleanup();
  }

  /**
   * Remove a specific song from cache
   */
  delete(songId: string): boolean {
    const deleted = this.cache.delete(songId);
    if (deleted) {
      console.log('🎵 Song Cache: DELETE', { songId });
    }
    return deleted;
  }

  /**
   * Clear all cached songs
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log('🎵 Song Cache: CLEAR', { clearedCount: size });
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanupCount = 0;
    
    for (const [songId, cached] of this.cache.entries()) {
      const isExpired = now > (cached.timestamp + cached.ttl);
      if (isExpired) {
        this.cache.delete(songId);
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      console.log('🎵 Song Cache: CLEANUP', { expiredCount: cleanupCount, remainingCount: this.cache.size });
    }
  }
}

// Export singleton instance
export const globalSongCache = new SongCache();
