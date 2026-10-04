import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Centered authentication layout shell for login, registration, and password recovery.
 * Redirects already-authenticated users directly to /dashboard.
 */
const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5 mb-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-subtle group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-on-surface">Sylo</span>
          </Link>
          <p className="text-sm text-on-surface-variant">
            Intelligent project and task management workspace
          </p>
        </div>

        {/* Auth Content Card */}
        <div className="rounded-2xl bg-surface-container-lowest p-6 sm:p-8 shadow-card border border-surface-container">
          <Outlet />
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-outline">
          &copy; {new Date().getFullYear()} Sylo Project Management. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
