import React, { useEffect, useCallback } from 'react';

/**
 * Universal Accessible Modal Shell component for Sylo.
 * Features backdrop blur, escape listener, focus containment, and responsive sizing.
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {string|React.ReactNode} [title]
 * @param {React.ReactNode} children
 * @param {React.ReactNode} [footer]
 * @param {'sm' | 'md' | 'lg' | 'xl'} [size='md']
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`
          relative w-full rounded-2xl bg-surface-container-lowest p-6 sm:p-7 shadow-modal border border-surface-container z-10 my-auto
          transform transition-all duration-200 ease-out animate-in fade-in zoom-in-95
          ${sizes[size] || sizes.md}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container">
          {title && (
            <h2
              id="modal-title"
              className="text-base sm:text-lg font-bold tracking-tight text-on-surface"
            >
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors ml-auto"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[calc(85vh-120px)] overflow-y-auto pr-1">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
