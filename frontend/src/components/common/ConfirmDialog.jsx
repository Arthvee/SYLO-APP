import React from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * Accessible Destructive/Action Confirmation Dialog.
 * Used for project deletion, task deletion, collaborator removal, and leaving projects.
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onConfirm
 * @param {string} [title='Confirm Action']
 * @param {string|React.ReactNode} message
 * @param {string} [confirmText='Confirm']
 * @param {string} [cancelText='Cancel']
 * @param {'danger' | 'primary'} [variant='danger']
 * @param {boolean} [isLoading=false]
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-2">
        {/* Warning Icon Badge */}
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
            isDanger
              ? 'bg-error-container text-on-error-container'
              : 'bg-primary-fixed text-on-primary-fixed'
          }`}
        >
          <span className="material-symbols-outlined text-2xl">
            {isDanger ? 'warning' : 'help'}
          </span>
        </div>

        <h3 className="text-base font-bold text-on-surface mb-2">{title}</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex items-center gap-2.5 w-full">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="md"
            fullWidth
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
