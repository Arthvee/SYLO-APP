import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Route guard restricting member routes to authenticated sessions (FR-36).
 * Unauthenticated users are redirected to /login with target destination query memory.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-sm font-medium text-on-surface-variant">
            Loading workspace...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTarget = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTarget)}`} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
