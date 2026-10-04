import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sylo_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sylo_token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('sylo_token')));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('sylo_token');
    localStorage.removeItem('sylo_user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  // Verify active session on initial mount (FR-07)
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = localStorage.getItem('sylo_token');
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setUser(null);
        }
        return;
      }

      try {
        const response = await authService.getMe();
        if (isMounted && response.success && response.data?.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          localStorage.setItem('sylo_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    // Listen for 401 session expiration triggered by Axios interceptor
    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener('sylo:session-expired', handleSessionExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('sylo:session-expired', handleSessionExpired);
    };
  }, [logout]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        const { user: authUser, token: authToken } = response.data;
        localStorage.setItem('sylo_token', authToken);
        localStorage.setItem('sylo_user', JSON.stringify(authUser));

        setUser(authUser);
        setToken(authToken);
        setIsAuthenticated(true);
        return response.data;
      }
      throw new Error(response.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const verifyEmail = async (verificationToken) => {
    return await authService.verifyEmail(verificationToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        verifyEmail,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
