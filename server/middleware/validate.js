const { body, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return formatted 400 Bad Request envelope
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  next();
};

/**
 * Validation rules for user registration (FR-01, FR-02, BR-16)
 */
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name or company name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-z0-9_-]{3,20}$/).withMessage('Username may only contain lowercase letters, numbers, underscores, and hyphens')
    .toLowerCase(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  handleValidationErrors,
];

/**
 * Validation rules for user login (FR-06)
 */
const loginValidator = [
  body('login')
    .trim()
    .notEmpty().withMessage('Username or email is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

/**
 * Validation rules for forgot password request (FR-08)
 */
const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),

  handleValidationErrors,
];

/**
 * Validation rules for password reset submission (FR-08)
 */
const resetPasswordValidator = [
  body('password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validation rules for resending verification email
 */
const resendVerificationValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),

  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendVerificationValidator,
};
