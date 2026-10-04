import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      {/* Toast Render Viewport */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const icon = isError ? 'error' : isSuccess ? 'check_circle' : 'info';
          const badgeClass = isError
            ? 'bg-error-container text-on-error-container border border-error/20'
            : isSuccess
            ? 'bg-surface-container-lowest text-on-surface border-l-4 border-tertiary shadow-card'
            : 'bg-surface-container-lowest text-on-surface border-l-4 border-primary shadow-card';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl p-4 transition-all duration-300 transform translate-y-0 opacity-100 ${badgeClass}`}
            >
              <span className={`material-symbols-outlined text-xl shrink-0 ${isError ? 'text-error' : isSuccess ? 'text-tertiary' : 'text-primary'}`}>
                {icon}
              </span>
              <div className="flex-1 text-sm font-medium leading-5">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-outline hover:text-on-surface transition-colors p-0.5 rounded"
                aria-label="Dismiss alert"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
