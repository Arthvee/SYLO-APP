import React from 'react';
import { calculateProgress } from '../../utils/formatters';

/**
 * Universal ProgressBar primitive for visualizing project completion (BR-12, Section 9.1).
 *
 * @param {number} progress - Completion percentage (0 - 100)
 * @param {'sm' | 'md' | 'lg'} [size='md']
 * @param {boolean} [showLabel=false]
 * @param {string} [label] - Optional custom caption (e.g. "Progress")
 */
export default function ProgressBar({
  progress = 0,
  size = 'md',
  showLabel = false,
  label = 'Progress',
  className = '',
}) {
  const normalizedProgress = calculateProgress(progress, 100);

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  // Color thresholding according to BR-13
  const getBarColor = (val) => {
    if (val >= 100) return 'bg-[#137333]';
    if (val >= 75) return 'bg-tertiary';
    return 'bg-primary';
  };

  const getTextColor = (val) => {
    if (val >= 100) return 'text-[#137333]';
    if (val >= 75) return 'text-tertiary';
    return 'text-primary';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold mb-1">
          <span className="text-on-surface-variant">{label}</span>
          <span className={`font-bold ${getTextColor(normalizedProgress)}`}>
            {normalizedProgress}%
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={normalizedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full overflow-hidden rounded-full bg-surface-container ${sizes[size] || sizes.md}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor(
            normalizedProgress
          )}`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
}
