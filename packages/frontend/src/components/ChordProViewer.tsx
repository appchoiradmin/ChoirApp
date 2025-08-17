import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { globalChordProCache, ParsedLine, Segment } from '../utils/chordProCache';
import './ChordProViewer.css';

type ChordFontWeight = 'normal' | 'bold' | 'extra-bold';
type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface ChordProViewerProps {
  source: string;
  showFontControls?: boolean;
}

const ChordProViewer: React.FC<ChordProViewerProps> = ({ source, showFontControls = true }) => {
  const { t } = useTranslation();
  
  // Initialize font weight from localStorage or default to 'bold'
  const [fontWeight, setFontWeight] = useState<ChordFontWeight>(() => {
    try {
      const saved = localStorage.getItem('choirapp-font-weight');
      if (saved && ['normal', 'bold', 'extra-bold'].includes(saved)) {
        return saved as ChordFontWeight;
      }
    } catch (error) {
      console.warn('Failed to load font weight preference:', error);
    }
    return 'bold';
  });
  
  // Initialize font size from localStorage or default to 'medium'
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try {
      const saved = localStorage.getItem('choirapp-font-size');
      if (saved && ['small', 'medium', 'large', 'extra-large'].includes(saved)) {
        return saved as FontSize;
      }
    } catch (error) {
      console.warn('Failed to load font size preference:', error);
    }
    return 'medium';
  });
  
  // State for toggling font controls visibility
  const [showControls, setShowControls] = useState(false);
  
  // Save font weight preference to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('choirapp-font-weight', fontWeight);
    } catch (error) {
      console.warn('Failed to save font weight preference:', error);
    }
  }, [fontWeight]);
  
  // Save font size preference to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('choirapp-font-size', fontSize);
    } catch (error) {
      console.warn('Failed to save font size preference:', error);
    }
  }, [fontSize]);
  
  // Generate unique instance ID to track component lifecycle
  const instanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  // Add render tracking to verify cache effectiveness
  console.log('🎵 ChordPro: Component render', { 
    instanceId,
    sourceLength: source?.length || 0,
    timestamp: new Date().toISOString()
  });
  
  // Use global cache to share parsed content between component instances
  const parsedSong = useMemo(() => {
    // Check global cache first
    const cached = globalChordProCache.get(source);
    if (cached) {
      console.log('🎵 ChordPro: Using cached content (cache HIT)', { 
        instanceId,
        sourceLength: source?.length || 0,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    
    console.log('🎵 ChordPro: Parsing content (cache MISS)', { 
      instanceId,
      sourceLength: source?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    const parseChordPro = (text: string): ParsedLine[] => {
      if (!text) return [];
      const lines = text.split('\n');

      return lines.map(line => {
        if (line.trim().startsWith('{')) {
          const match = line.match(/\{(.*?):(.*)\}/);
          if (match) {
            const [, directive, value] = match;
            const trimmedDirective = directive.trim().toLowerCase();
            if (trimmedDirective === 'c' || trimmedDirective === 'comment') {
              return { type: 'directive', directive: 'comment', value: value.trim() };
            }
            if (trimmedDirective === 't' || trimmedDirective === 'title') {
              return { type: 'directive', directive: 'title', value: value.trim() };
            }
          }
        }

        const parts = line.split(/(\[[^\]]+\])/g).filter(p => p);
        if (parts.length === 0) {
          return { type: 'lyrics', segments: [{ chord: null, lyric: '' }] };
        }

        const segments: Segment[] = [];
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part.startsWith('[')) {
            const chord = part.substring(1, part.length - 1);
            const lyric = (parts[i + 1] && !parts[i + 1].startsWith('[')) ? parts[i + 1] : '';
            segments.push({ chord, lyric });
            if (lyric) {
              i++;
            }
          } else {
            segments.push({ chord: null, lyric: part });
          }
        }
        return { type: 'lyrics', segments };
      });
    };

    const parsed = parseChordPro(source);
    
    // Store in global cache for other instances
    globalChordProCache.set(source, parsed);
    
    return parsed;
  }, [source, instanceId]); // Only re-parse when source content changes

  if (!source) {
    return <div className="chord-pro-viewer">{t('chordProViewer.noContent')}</div>;
  }

  const getFontWeightClass = (weight: ChordFontWeight): string => {
    switch (weight) {
      case 'normal': return 'font-weight-normal';
      case 'bold': return 'font-weight-bold';
      case 'extra-bold': return 'font-weight-extra-bold';
      default: return 'font-weight-bold';
    }
  };
  
  const getFontSizeClass = (size: FontSize): string => {
    switch (size) {
      case 'small': return 'font-size-small';
      case 'medium': return 'font-size-medium';
      case 'large': return 'font-size-large';
      case 'extra-large': return 'font-size-extra-large';
      default: return 'font-size-medium';
    }
  };

  return (
    <div className={`chord-pro-viewer ${getFontSizeClass(fontSize)}`} data-testid="chord-pro-viewer">
      {showFontControls && (
        <div className="font-controls-container">
          <button 
            className="toggle-controls-btn"
            onClick={() => setShowControls(!showControls)}
            type="button"
            aria-expanded={showControls}
          >
            <span className="toggle-icon">{showControls ? '▼' : '▶'}</span>
            {t('chordProViewer.fontSettings')}
          </button>
          
          {showControls && (
            <div className="font-controls">
              <div className="control-group">
                <span className="control-label">{t('chordProViewer.fontSize')}</span>
                <div className="size-buttons">
                  <button 
                    className={`size-btn ${fontSize === 'small' ? 'active' : ''}`}
                    onClick={() => setFontSize('small')}
                    type="button"
                  >
                    {t('chordProViewer.small')}
                  </button>
                  <button 
                    className={`size-btn ${fontSize === 'medium' ? 'active' : ''}`}
                    onClick={() => setFontSize('medium')}
                    type="button"
                  >
                    {t('chordProViewer.medium')}
                  </button>
                  <button 
                    className={`size-btn ${fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => setFontSize('large')}
                    type="button"
                  >
                    {t('chordProViewer.large')}
                  </button>
                  <button 
                    className={`size-btn ${fontSize === 'extra-large' ? 'active' : ''}`}
                    onClick={() => setFontSize('extra-large')}
                    type="button"
                  >
                    {t('chordProViewer.extraLarge')}
                  </button>
                </div>
              </div>
              
              <div className="control-group">
                <span className="control-label">{t('chordProViewer.fontWeight')}</span>
                <div className="weight-buttons">
                  <button 
                    className={`weight-btn ${fontWeight === 'normal' ? 'active' : ''}`}
                    onClick={() => setFontWeight('normal')}
                    type="button"
                  >
                    {t('chordProViewer.normal')}
                  </button>
                  <button 
                    className={`weight-btn ${fontWeight === 'bold' ? 'active' : ''}`}
                    onClick={() => setFontWeight('bold')}
                    type="button"
                  >
                    {t('chordProViewer.bold')}
                  </button>
                  <button 
                    className={`weight-btn ${fontWeight === 'extra-bold' ? 'active' : ''}`}
                    onClick={() => setFontWeight('extra-bold')}
                    type="button"
                  >
                    {t('chordProViewer.extraBold')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {parsedSong.map((line, lineIndex) => {
        if (line.type === 'directive') {
          if (line.directive === 'title') {
            return <h2 key={lineIndex} className={`song-title ${getFontWeightClass(fontWeight)}`}>{line.value}</h2>;
          }
          if (line.directive === 'comment') {
            return <div key={lineIndex} className={`comment ${getFontWeightClass(fontWeight)}`}><em>{line.value}</em></div>;
          }
          return null;
        }

        return (
          <div key={lineIndex} className={`line ${getFontWeightClass(fontWeight)}`}>
            {line.segments && line.segments.map((segment, segIndex) => (
              <div key={segIndex} className="segment">
                <span className="chord">{segment.chord || ''}</span>
                <span className="lyric">{segment.lyric}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ChordProViewer;
