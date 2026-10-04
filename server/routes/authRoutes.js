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

const authenticate = require('../middleware/auth');

// Public endpoints
router.post('/register', registerValidator, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationValidator, resendVerification);
router.post('/login', loginValidator, login);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, resetPassword);

// Protected endpoint (Requires valid JWT Bearer header)
router.get('/me', authenticate, getMe);

module.exports = router;
