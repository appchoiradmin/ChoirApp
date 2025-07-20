import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './ChordProViewer.css';

interface ChordProViewerProps {
  source: string;
}

interface Segment {
  chord: string | null;
  lyric: string;
}

interface ParsedLine {
  type: 'lyrics' | 'directive';
  segments?: Segment[];
  directive?: string;
  value?: string;
}

const ChordProViewer: React.FC<ChordProViewerProps> = ({ source }) => {
  const { t } = useTranslation();
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

  const parsedSong = parseChordPro(source);

  if (!source) {
    return <div className="chord-pro-viewer">{t('chordProViewer.noContent')}</div>;
  }

  return (
    <div className="chord-pro-viewer" data-testid="chord-pro-viewer">
      {parsedSong.map((line, lineIndex) => {
        if (line.type === 'directive') {
          if (line.directive === 'title') {
            return <h2 key={lineIndex} className="song-title">{line.value}</h2>;
          }
          if (line.directive === 'comment') {
            return <div key={lineIndex} className="comment"><em>{line.value}</em></div>;
          }
          return null;
        }

        return (
          <div key={lineIndex} className="line">
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
