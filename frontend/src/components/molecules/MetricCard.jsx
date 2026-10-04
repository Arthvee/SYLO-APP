import React from 'react';
import Skeleton from '../common/Skeleton';

/**
 * MetricCard molecule for dashboard KPI metrics.
 *
 * @param {string} title
 * @param {number|string} value
 * @param {string} icon - Material Symbol icon name
 * @param {'primary' | 'tertiary' | 'secondary' | 'default'} [variant='default']
 * @param {string} [subtitle]
 * @param {boolean} [isLoading=false]
 */
export default function MetricCard({
  title,
  value,
  icon,
  variant = 'default',
  subtitle,
  isLoading = false,
  className = '',
}) {
  const iconVariants = {
    primary: 'bg-primary-fixed text-on-primary-fixed',
    tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed',
    secondary: 'bg-secondary-fixed text-on-secondary-fixed',
    default: 'bg-surface-container-high text-on-surface',
  };

  if (isLoading) {
    return (
      <div className={`rounded-2xl bg-surface-container-lowest p-5 border border-surface-container shadow-card ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton variant="text" width="60%" height="14px" />
          <Skeleton variant="avatar" width="32px" height="32px" />
        </div>
        <Skeleton variant="text" width="40%" height="28px" className="mb-2" />
        {subtitle && <Skeleton variant="text" width="50%" height="12px" />}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-surface-container-lowest p-5 border border-surface-container shadow-card hover:shadow-subtle transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {title}
        </span>
        {icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
              iconVariants[variant] || iconVariants.default
            }`}
          >
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </div>
        )}
      </div>

      <div className="text-3xl font-extrabold tracking-tight text-on-surface">
        {value ?? 0}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-on-surface-variant">
          {subtitle}
        </div>
      )}
    </div>
  );
}
