import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    className = '',
    disabled,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
        disabled={disabled || isLoading}
        aria-label={ariaLabel || (isLoading ? 'Loading...' : undefined)}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className={styles.spinner} />
        ) : null}
        <span className={isLoading ? styles.hidden : ''}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

