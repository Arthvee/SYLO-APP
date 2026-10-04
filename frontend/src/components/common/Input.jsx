import React, { forwardRef } from 'react';

/**
 * Universal Input & TextArea primitive for Sylo application.
 * Incorporates Stitch typography, focus states, leading icons, and validation indicators.
 *
 * @param {string} [label] - Input caption
 * @param {string} [error] - Validation error message
 * @param {string} [helperText] - Subtext guidance
 * @param {string} [icon] - Material Symbol icon name for leading adornment
 * @param {boolean} [required=false]
 * @param {boolean} [isTextarea=false]
 * @param {number} [rows=3]
 */
const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon,
      required = false,
      isTextarea = false,
      rows = 3,
      disabled = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const baseInputStyles =
      'w-full rounded-xl border bg-surface px-3 py-2 text-xs sm:text-sm text-on-surface placeholder:text-outline transition-colors focus:outline-none';

    const stateStyles = error
      ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
      : 'border-surface-container focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-outline/40';

    const disabledStyles = disabled
      ? 'bg-surface-container-low text-outline opacity-60 cursor-not-allowed'
      : '';

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold text-on-surface"
            >
              {label}
              {required && <span className="text-error ml-1">*</span>}
            </label>
          </div>
        )}

        <div className="relative">
          {icon && (
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-outline pointer-events-none">
              {icon}
            </span>
          )}

          {isTextarea ? (
            <textarea
              id={inputId}
              ref={ref}
              rows={rows}
              disabled={disabled}
              className={`
                ${baseInputStyles}
                ${stateStyles}
                ${disabledStyles}
                ${icon ? 'pl-9' : ''}
                ${className}
              `}
              {...props}
            />
          ) : (
            <input
              id={inputId}
              ref={ref}
              disabled={disabled}
              className={`
                ${baseInputStyles}
                ${stateStyles}
                ${disabledStyles}
                ${icon ? 'pl-9' : ''}
                ${className}
              `}
              {...props}
            />
          )}
        </div>

        {error ? (
          <p className="flex items-center gap-1 text-[11px] font-medium text-error">
            <span className="material-symbols-outlined text-xs">error</span>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-on-surface-variant">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
