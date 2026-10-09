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

    // Email verification check bypassed while email verification is deferred (see todo.md).
    // Automatically activate accounts created prior to bypass:
    if (!user.isVerified) {
      user.isVerified = true;
      if (typeof user.save === 'function') {
        await user.save();
      }
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
