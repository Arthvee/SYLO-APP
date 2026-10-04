import React from 'react';

/**
 * Universal Badge & Status Pill component for Sylo application.
 * Enforces PRD status badges (FR-30, FR-33) and priority styling.
 *
 * @param {'Active' | 'Almost Done' | 'Completed' | 'Overdue' | 'High' | 'Medium' | 'Low' | 'Admin' | 'Collaborator' | 'To Do' | 'In Progress' | 'default'} [variant]
 * @param {'sm' | 'md' | 'lg'} [size='md']
 * @param {boolean} [dot=false]
 * @param {string} [icon] - Material Symbol icon
 */
export default function Badge({
  children,
  variant,
  status,
  priority,
  role,
  size = 'md',
  dot = false,
  icon,
  className = '',
}) {
  // Determine variant from props
  const resolvedVariant = variant || status || priority || role || children || 'default';

  const variantStyles = {
    // Project status tokens (FR-33, BR-13)
    Active: 'bg-primary-fixed text-on-primary-fixed border-transparent',
    'Almost Done': 'bg-tertiary-fixed text-on-tertiary-fixed border-transparent',
    Completed: 'bg-[#e6f4ea] text-[#137333] border-transparent font-semibold',
    Overdue: 'bg-error-container text-on-error-container font-semibold animate-pulse border-transparent',

    // Task workflow statuses (FR-26, BR-11)
    'To Do': 'bg-surface-container text-on-surface-variant border-surface-container-high',
    'In Progress': 'bg-primary-fixed text-on-primary-fixed border-transparent',

    // Priority levels
    High: 'bg-error-container text-on-error-container font-semibold border-transparent',
    Medium: 'bg-primary-fixed text-on-primary-fixed border-transparent',
    Low: 'bg-surface-container-high text-on-surface-variant border-transparent',

    // Project roles
    Admin: 'bg-primary-fixed text-on-primary-fixed font-semibold border-transparent',
    admin: 'bg-primary-fixed text-on-primary-fixed font-semibold border-transparent',
    Collaborator: 'bg-surface-container text-on-surface-variant border-transparent',
    collaborator: 'bg-surface-container text-on-surface-variant border-transparent',
    Owner: 'bg-primary-container text-on-primary font-semibold border-transparent',

    // Default neutral
    default: 'bg-surface-container text-on-surface-variant border-transparent',
  };

  const dotColors = {
    Active: 'bg-primary',
    'Almost Done': 'bg-tertiary',
    Completed: 'bg-[#137333]',
    Overdue: 'bg-error',
    High: 'bg-error',
    Medium: 'bg-primary',
    Low: 'bg-outline',
    default: 'bg-outline',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs px-3 py-1 gap-1.5',
  };

  const style = variantStyles[resolvedVariant] || variantStyles.default;
  const dotColor = dotColors[resolvedVariant] || dotColors.default;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium leading-none whitespace-nowrap transition-colors border ${sizes[size] || sizes.md} ${style} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`}
          aria-hidden="true"
        />
      )}
      {icon && (
        <span className="material-symbols-outlined text-[13px] leading-none shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children || resolvedVariant}</span>
    </span>
  );
}
