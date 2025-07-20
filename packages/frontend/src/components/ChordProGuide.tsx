import React, { useState } from 'react';
import styles from './ChordProGuide.module.scss';
import { useTranslation } from '../hooks/useTranslation';

const ChordProGuide: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.guideContainer}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? t('chordProGuide.toggleHide') : t('chordProGuide.toggleShow')}
      </button>
      
      {isExpanded && (
        <div className={styles.guideContent}>
          <h3 className={styles.guideTitle}>{t('chordProGuide.title')}</h3>
          
          <div className={styles.guideSection}>
            <h4>{t('chordProGuide.basicSyntax.title')}</h4>
            <p>{t('chordProGuide.basicSyntax.description')}</p>
            <pre className={styles.codeExample}>
              {t('chordProGuide.basicSyntax.example')}
            </pre>
          </div>
          
          <div className={styles.guideSection}>
            <h4>{t('chordProGuide.metadata.title')}</h4>
            <pre className={styles.codeExample}>
              {t('chordProGuide.metadata.example')}
            </pre>
          </div>
          
          <div className={styles.guideSection}>
            <h4>{t('chordProGuide.sections.title')}</h4>
            <pre className={styles.codeExample}>
              {t('chordProGuide.sections.example')}
            </pre>
          </div>
          
          <div className={styles.guideSection}>
            <h4>{t('chordProGuide.completeExample.title')}</h4>
            <pre className={styles.codeExample}>
              {t('chordProGuide.completeExample.example')}
            </pre>
          </div>
          
          <div className={styles.guideSection}>
            <h4>{t('chordProGuide.tips.title')}</h4>
            <ul>
              <li>{t('chordProGuide.tips.tip1')}</li>
              <li>{t('chordProGuide.tips.tip2')}</li>
              <li>{t('chordProGuide.tips.tip3')}</li>
              <li>{t('chordProGuide.tips.tip4')}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChordProGuide;
