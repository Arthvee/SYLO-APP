import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-card border border-surface-container max-w-md w-full">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-container text-on-error-container">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>

        <h1 className="text-3xl font-extrabold text-on-surface mb-2 tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-on-surface mb-2">Page Not Found</h2>
        <p className="text-xs text-on-surface-variant mb-6">
          The requested page or resource could not be found. It may have been moved, renamed, or deleted.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2.5 text-xs font-semibold text-on-primary hover:bg-primary transition-colors shadow-subtle"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
