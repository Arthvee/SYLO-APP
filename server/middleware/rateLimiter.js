const rateLimit = require('express-rate-limit');

/**
 * Standard JSON envelope for rate-limited requests matching Sylo error formatting
 */
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
    errors: [],
  });
};

/**
 * Login rate limiter: max 10 attempts per 15 minutes per IP
 * Protects against automated brute-force attacks and credential stuffing
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler('Too many login attempts. Please try again after 15 minutes.'),
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Registration rate limiter: max 10 accounts created per hour per IP
 * Protects against mass fake account creation
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many account creation attempts from this IP. Please try again later.'),
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Password reset / recovery limiter: max 5 attempts per 15 minutes per IP
 * Protects against email spam and token exhaustion
 */
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many password reset requests. Please try again after 15 minutes.'),
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
};
