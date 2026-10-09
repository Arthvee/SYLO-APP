const express = require('express');
const router = express.Router();

const {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendVerificationValidator,
} = require('../middleware/validate');

const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiter');

const authenticate = require('../middleware/auth');

// Public endpoints
router.post('/register', registerLimiter, registerValidator, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', passwordResetLimiter, resendVerificationValidator, resendVerification);
router.post('/login', loginLimiter, loginValidator, login);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPasswordValidator, resetPassword);

// Protected endpoint (Requires valid JWT Bearer header)
router.get('/me', authenticate, getMe);

module.exports = router;
