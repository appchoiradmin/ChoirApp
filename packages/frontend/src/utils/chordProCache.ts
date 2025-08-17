// Global ChordPro parsing cache shared across all component instances
interface ParsedLine {
  type: 'lyrics' | 'directive';
  segments?: Segment[];
  directive?: string;
  value?: string;
}

interface Segment {
  chord: string | null;
  lyric: string;
}

interface CacheEntry {
  parsedContent: ParsedLine[];
  timestamp: number;
}

class ChordProCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  private generateKey(content: string): string {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.TTL;
  }

  get(content: string): ParsedLine[] | null {
    const key = this.generateKey(content);
    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }
    
    return entry.parsedContent;
  }

  set(content: string, parsedContent: ParsedLine[]): void {
    const key = this.generateKey(content);
    this.cache.set(key, {
      parsedContent,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global singleton instance
export const globalChordProCache = new ChordProCache();
export type { ParsedLine, Segment };
