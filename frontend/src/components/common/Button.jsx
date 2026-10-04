import React, { forwardRef } from 'react';

/**
 * Universal Button primitive for Sylo application.
 * Styled with Google Stitch tokens and responsive interaction micro-states.
 *
 * @param {'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'} [variant='primary']
 * @param {'sm' | 'md' | 'lg'} [size='md']
 * @param {boolean} [isLoading=false]
 * @param {boolean} [disabled=false]
 * @param {string} [icon] - Material Symbol icon name
 * @param {'left' | 'right'} [iconPosition='left']
 * @param {boolean} [fullWidth=false]
 */
const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none select-none';

    const variants = {
      primary:
        'bg-primary-container text-on-primary hover:bg-primary active:scale-[0.98] shadow-subtle focus-visible:ring-2 focus-visible:ring-primary/40',
      secondary:
        'bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-outline/20',
      danger:
        'bg-error text-on-error hover:bg-error/90 active:scale-[0.98] shadow-subtle focus-visible:ring-2 focus-visible:ring-error/40',
      ghost:
        'bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface active:scale-[0.98]',
      outline:
        'border border-surface-container bg-surface text-on-surface hover:bg-surface-container-low shadow-subtle active:scale-[0.98]',
    };

    const sizes = {
      sm: 'py-1.5 px-3 text-xs gap-1.5 rounded-lg min-h-[32px]',
      md: 'py-2 px-4 text-xs font-semibold gap-2 rounded-xl min-h-[38px]',
      lg: 'py-2.5 px-5 text-sm font-semibold gap-2.5 rounded-xl min-h-[44px]',
    };

    const iconSizes = {
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`
          ${baseStyles}
          ${variants[variant] || variants.primary}
          ${sizes[size] || sizes.md}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className={`material-symbols-outlined shrink-0 ${iconSizes[size]}`}>
                {icon}
              </span>
            )}
            <span>{children}</span>
            {icon && iconPosition === 'right' && (
              <span className={`material-symbols-outlined shrink-0 ${iconSizes[size]}`}>
                {icon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
