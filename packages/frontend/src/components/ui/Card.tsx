import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.scss';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  role?: string;
  tabIndex?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  'aria-label'?: string;
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

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ 
  className, 
  children, 
  hover = true, 
  padding = 'md', 
  onClick,
  role,
  tabIndex,
  onKeyDown,
  'aria-label': ariaLabel,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
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
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </div>
  );
});

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

// Add display name for debugging
Card.displayName = 'Card';

// Create compound component with sub-components
const CardWithSubComponents = Card as typeof Card & {
  Header: typeof CardHeader;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
};

CardWithSubComponents.Header = CardHeader;
CardWithSubComponents.Content = CardContent;
CardWithSubComponents.Footer = CardFooter;

export default CardWithSubComponents;
