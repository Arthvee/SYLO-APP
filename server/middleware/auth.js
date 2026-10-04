const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT tokens and enforce account verification
 * PRD Mapping: FR-04, FR-06, FR-07
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
        errors: [],
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication token is empty.',
        errors: [],
      });
    }

    // Decode and verify signature
    const decoded = verifyToken(token);

    // Retrieve active user record
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session token: user does not exist.',
        errors: [],
      });
    }

    // Enforce email verification boundary (FR-04, FR-07)
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your email address has not been verified. Please verify your email before accessing your workspace.',
        errors: [
          {
            field: 'isVerified',
            message: 'Email unverified',
          },
        ],
      });
    }

    // Attach verified user instance to request context
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please log in again.',
        errors: [],
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication session invalid or corrupted token.',
      errors: [],
    });
  }
};

module.exports = authenticate;
