import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        className={clsx(
          'button',
          `is-${variant}`,
          `is-${size}`,
          {
            'is-loading': loading,
            'is-disabled': disabled || loading,
          },
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {leftIcon && <span className="icon">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="icon">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
