import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className 
}) => {
  const colorClasses = {
    primary: 'has-text-primary',
    secondary: 'has-text-secondary', 
    accent: 'has-text-accent',
    white: 'has-text-white'
  };

  const pixelSizes = {
    sm: '16px',
    md: '24px', 
    lg: '32px',
    xl: '48px'
  };

  return (
    <motion.div
      className={clsx(
        'inline-block',
        colorClasses[color],
        className
      )}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: pixelSizes[size], height: pixelSizes[size] }}
    >
      <img
        src="/icons/icon-32x32.png"
        alt="Loading..."
        className="w-full h-full"
        style={{ 
          filter: color === 'white' ? 'brightness(0) invert(1)' : 'none',
          opacity: 0.8
        }}
      />
    </motion.div>
  );
};

export default LoadingSpinner;
