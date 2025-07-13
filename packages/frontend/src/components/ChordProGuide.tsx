import React, { useState } from 'react';
import styles from './ChordProGuide.module.scss';

const ChordProGuide: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.guideContainer}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide ChordPro Guide' : 'Show ChordPro Guide'}
      </button>
      
      {isExpanded && (
        <div className={styles.guideContent}>
          <h3 className={styles.guideTitle}>ChordPro Format Guide</h3>
          
          <div className={styles.guideSection}>
            <h4>Basic Syntax</h4>
            <p>ChordPro is a simple text format that allows you to add chords above lyrics:</p>
            <pre className={styles.codeExample}>
              [C]This is a [G]sample lyric with [Am]chords
            </pre>
          </div>
          
          <div className={styles.guideSection}>
            <h4>Song Title and Metadata</h4>
            <pre className={styles.codeExample}>
              {'{title: Your Song Title}\n{artist: Artist Name}\n{key: C}'}
            </pre>
          </div>
          
          <div className={styles.guideSection}>
            <h4>Song Sections</h4>
            <pre className={styles.codeExample}>
              {'{start_of_chorus}\n[G]This is the [D]chorus\n{end_of_chorus}\n\n{start_of_verse}\n[C]This is the [Am]verse\n{end_of_verse}'}
            </pre>
          </div>
          
          <div className={styles.guideSection}>
            <h4>Complete Example</h4>
            <pre className={styles.codeExample}>
              {'{title: Amazing Grace}\n{artist: John Newton}\n{key: G}\n\n{start_of_verse}\n[G]Amazing [D]grace how [G]sweet the [D]sound\nThat [G]saved a wretch [D]like [G]me\nI [G]once was [D]lost but [G]now am [D]found\nWas [G]blind but [D]now I [G]see\n{end_of_verse}'}
            </pre>
          </div>
          
          <div className={styles.guideSection}>
            <h4>Tips</h4>
            <ul>
              <li>Place chords in square brackets [C] directly before the syllable they belong to</li>
              <li>Use curly braces for directives like {'{title: Song Name}'}</li>
              <li>Separate verses and choruses with blank lines</li>
              <li>Mark sections with {'{start_of_verse}'} and {'{end_of_verse}'}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChordProGuide;
