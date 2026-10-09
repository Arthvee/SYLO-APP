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

    const primaryMessage =
      formattedErrors.length > 0 ? formattedErrors[0].message : 'Validation failed';

    return res.status(400).json({
      success: false,
      message: primaryMessage,
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
    .toLowerCase()
    .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-z0-9_-]{3,20}$/).withMessage('Username may only contain lowercase letters, numbers, underscores, and hyphens'),

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

/**
 * Validation rules for project creation (FR-09)
 */
const createProjectValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Project title is required')
    .isLength({ min: 1, max: 120 }).withMessage('Project title must be between 1 and 120 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('deadline')
    .optional({ nullable: true })
    .isISO8601().withMessage('Deadline must be a valid ISO 8601 date string'),

  handleValidationErrors,
];

/**
 * Validation rules for project updates (FR-12)
 */
const updateProjectValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 120 }).withMessage('Project title must be between 1 and 120 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('deadline')
    .optional({ nullable: true })
    .isISO8601().withMessage('Deadline must be a valid ISO 8601 date string'),

  handleValidationErrors,
];

/**
 * Validation rules for adding collaborators by username (FR-14, BR-16)
 */
const addCollaboratorValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .matches(/^[a-z0-9_-]{3,20}$/).withMessage('Username must be 3-20 characters long and contain only lowercase letters, numbers, hyphens, and underscores')
    .toLowerCase(),

  handleValidationErrors,
];

/**
 * Validation rules for task creation (FR-19, FR-22)
 */
const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 1, max: 200 }).withMessage('Task title must be between 1 and 200 characters'),

  body('description')
    .optional()
    .trim(),

  body('assignees')
    .optional()
    .isArray().withMessage('Assignees must be an array of user IDs'),

  body('deadline')
    .optional({ nullable: true })
    .isISO8601().withMessage('Deadline must be a valid ISO 8601 date string'),

  handleValidationErrors,
];

/**
 * Validation rules for updating task details (FR-21)
 */
const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Task title must be between 1 and 200 characters'),

  body('description')
    .optional()
    .trim(),

  body('assignees')
    .optional()
    .isArray().withMessage('Assignees must be an array of user IDs'),

  body('deadline')
    .optional({ nullable: true })
    .isISO8601().withMessage('Deadline must be a valid ISO 8601 date string'),

  handleValidationErrors,
];

/**
 * Validation rules for updating task status (FR-26, BR-11)
 */
const updateTaskStatusValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['To Do', 'In Progress', 'Completed'])
    .withMessage('Status must be one of: To Do, In Progress, Completed'),

  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendVerificationValidator,
  createProjectValidator,
  updateProjectValidator,
  addCollaboratorValidator,
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
};
