/**
 * Centralized error-handling middleware enforcing standard JSON error envelopes
 * PRD Mapping: FR-38 (understandable error messages instead of raw internal errors)
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = [];

  // 1. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered`;
    errors = [
      {
        field,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already taken`,
      },
    ];
  }

  // 2. Mongoose Schema Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // 3. Mongoose Invalid ObjectId Cast Error
  else if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id of ${err.value}`;
    errors = [];
  }

  // 4. JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication token is invalid or corrupted';
    errors = [];
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication session has expired. Please log in again.';
    errors = [];
  }

  // Log unexpected internal errors in development
  if (statusCode === 500 && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.error('[ServerError]', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = errorHandler;
