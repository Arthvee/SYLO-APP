import React from 'react';

/**
 * Skeleton shimmer placeholder primitive for perceived performance during API fetches (FR-39).
 *
 * @param {'text' | 'card' | 'avatar' | 'table-row' | 'rect'} [variant='rect']
 * @param {string} [width] - Custom width class
 * @param {string} [height] - Custom height class
 * @param {number} [count=1] - Number of skeleton elements to render
 */
export default function Skeleton({
  variant = 'rect',
  width,
  height,
  count = 1,
  className = '',
}) {
  const baseClasses = 'animate-pulse bg-surface-container rounded-xl shrink-0';

  const variantPresets = {
    text: 'h-4 w-3/4 rounded-md',
    avatar: 'h-8 w-8 rounded-full',
    card: 'h-36 w-full rounded-2xl',
    'table-row': 'h-12 w-full rounded-xl',
    rect: 'h-6 w-full rounded-lg',
  };

  const styleOverride = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  const items = Array.from({ length: count });

  if (count === 1) {
    return (
      <div
        className={`${baseClasses} ${variantPresets[variant] || ''} ${className}`}
        style={styleOverride}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="space-y-2 w-full" aria-hidden="true">
      {items.map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variantPresets[variant] || ''} ${className}`}
          style={styleOverride}
        />
      ))}
    </div>
  );
}
