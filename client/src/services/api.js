import axios from 'axios';

/**
 * Centralized Axios client instance configured for Sylo API communication.
 * Automatically injects Bearer JWT and handles 401 unauthenticated session purges.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Injects active Bearer JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sylo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catches 401 Unauthorized and purges stale session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Invalidate stored session credentials
      localStorage.removeItem('sylo_token');
      localStorage.removeItem('sylo_user');

      // Dispatch global custom event for AuthContext to sync state cleanly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sylo:session-expired'));

        // Redirect to login only if not already on an authentication page
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/verify-email')) {
          window.location.href = `/login?expired=true&redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
