import React from 'react';
import clsx from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
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
        'card',
        {
          'card-hover': hover,
          [`card-padding-${padding}`]: padding !== 'md',
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
    <header className={clsx('card-header', className)}>
      <div className="card-header-title">{children}</div>
    </header>
  );
};

const CardContent = ({ className, children }: CardContentProps) => {
  return (
    <div className={clsx('card-content', className)}>
      {children}
    </div>
  );
};

const CardFooter = ({ className, children }: CardFooterProps) => {
  return (
    <footer className={clsx('card-footer', className)}>
      {children}
    </footer>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
