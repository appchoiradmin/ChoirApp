import React from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import { useTranslation } from '../../hooks/useTranslation';
import './LoadingState.scss';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message,
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const { t } = useTranslation();
  
  const defaultMessage = message || t('common.loading');
  
  // Simple animation props
  const animationProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };

  // Minimal variant - just spinner and text inline
  if (variant === 'minimal') {
    return (
      <motion.div
        className={`loading-state loading-state--minimal ${className}`}
        {...animationProps}
      >
        <LoadingSpinner size={size} />
        <span className="loading-state__text">{defaultMessage}</span>
      </motion.div>
    );
  }

  // Card variant - centered in a card-like container
  if (variant === 'card') {
    return (
      <motion.div
        className={`loading-state loading-state--card ${className}`}
        {...animationProps}
      >
        <div className="loading-state__content">
          <LoadingSpinner size={size} />
          <p className="loading-state__message">{defaultMessage}</p>
        </div>
      </motion.div>
    );
  }

  // Fullscreen variant - covers entire viewport
  if (variant === 'fullscreen') {
    return (
      <motion.div
        className={`loading-state loading-state--fullscreen ${className}`}
        {...animationProps}
      >
        <div className="loading-state__content">
          <LoadingSpinner size="xl" />
          <p className="loading-state__message">{defaultMessage}</p>
        </div>
      </motion.div>
    );
  }

  // Default variant - centered with nice spacing
  return (
    <motion.div
      className={`loading-state loading-state--default ${className}`}
      {...animationProps}
    >
      <div className="loading-state__content">
        <LoadingSpinner size={size} />
        <p className="loading-state__message">{defaultMessage}</p>
      </div>
    </motion.div>
  );
};

export default LoadingState;
