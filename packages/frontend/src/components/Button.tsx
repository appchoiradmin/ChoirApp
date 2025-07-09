import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  primary?: boolean;
  secondary?: boolean;
  danger?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  primary,
  secondary,
  danger,
  className = '',
  ...props
}) => {
  let variantClass = '';
  if (primary) variantClass = styles['is-primary'];
  else if (secondary) variantClass = styles['is-secondary'];
  else if (danger) variantClass = styles['is-danger'];

  return (
    <button
      className={`${styles.button} ${variantClass} ${className}`.trim()}
      {...props}
    />
  );
};

export default Button;
