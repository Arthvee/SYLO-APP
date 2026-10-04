import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function SplashPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-on-primary shadow-card mb-6">
        <span className="material-symbols-outlined text-3xl">hub</span>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl max-w-xl">
        Manage Projects and Tasks with Velocity
      </h1>
      <p className="mt-4 text-base text-on-surface-variant max-w-md">
        Sylo empowers teams to collaborate across sprints, automate overdue deadline alerts, and track deliverable progress in real time.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="rounded-xl bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary shadow-subtle hover:bg-primary transition-colors"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-xl bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary shadow-subtle hover:bg-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-surface-container-low px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors border border-surface-container"
            >
              Create Account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
