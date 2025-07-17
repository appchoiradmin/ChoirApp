import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.scss';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

const Card = ({ className, children, hover = true, padding = 'md', onClick }: CardProps) => {
  return (
    <div
      className={clsx(
        styles.card,
        {
          [styles.hover]: hover,
          [styles[`padding-${padding}`]]: padding !== 'md',
          'cursor-pointer': onClick,
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className, children }: CardHeaderProps) => {
  return (
    <header className={clsx(styles.header, className)}>
      {children}
    </header>
  );
};

const CardContent = ({ className, children }: CardContentProps) => {
  return (
    <div className={clsx(styles.content, className)}>
      {children}
    </div>
  );
};

const CardFooter = ({ className, children }: CardFooterProps) => {
  return (
    <footer className={clsx(styles.footer, className)}>
      {children}
    </footer>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
