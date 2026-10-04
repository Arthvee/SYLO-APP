import api from './api';

/**
 * Authentication service wrapping Sylo /api/auth endpoints (FR-01 through FR-08)
 */
export const authService = {
  /**
   * Register a new user account (FR-01, FR-02)
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Authenticate user credentials and retrieve JWT (FR-06)
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Verify account via email token (FR-04, FR-05)
   */
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  /**
   * Resend verification email for an unverified account
   */
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  /**
   * Get current authenticated user session profile (FR-07)
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Initiate password recovery email (FR-08)
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with valid reset token (FR-08)
   */
  resetPassword: async (token, passwords) => {
    const response = await api.post(`/auth/reset-password/${token}`, passwords);
    return response.data;
  },
};

export default authService;
