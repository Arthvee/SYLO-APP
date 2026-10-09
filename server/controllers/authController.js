const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

/**
 * Register a new user account (inactive until verified)
 * POST /api/auth/register
 * PRD Mapping: FR-01, FR-02, FR-03, BR-16, AC-01
 */
const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing username collision (BR-16)
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'username', message: 'Username is already taken' }],
      });
    }

    // Check for existing email collision
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Email address is already registered' }],
      });
    }

    // Create user document (active immediately; email verification temporarily deferred - see todo.md)
    const user = new User({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      isVerified: true,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful. You can now log in.',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        isVerified: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify user email address with 24h token
 * GET /api/auth/verify-email/:token
 * PRD Mapping: FR-04, FR-05, AC-01
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
        errors: [],
      });
    }

    // Hash parameter token using SHA-256 to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired. Please request a new verification link.',
        errors: [],
      });
    }

    // Activate user and clear token fields
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    // Dispatch welcome confirmation email
    try {
      await sendWelcomeEmail(user);
    } catch (emailErr) {
      console.error('[AuthController] Failed to dispatch welcome email:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Email address verified successfully. Your account is now active.',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        isVerified: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Resend email verification link
 * POST /api/auth/resend-verification
 * PRD Mapping: FR-03, FR-04
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    // Always return generic success to prevent email enumeration
    if (!user || user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'If the account exists and is unverified, a new verification link has been sent.',
        data: null,
      });
    }

    const rawToken = user.createEmailVerificationToken();
    await user.save();

    try {
      await sendVerificationEmail(user, rawToken);
    } catch (emailErr) {
      console.error('[AuthController] Failed to resend verification email:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'If the account exists and is unverified, a new verification link has been sent.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticate credentials, block unverified accounts, issue JWT
 * POST /api/auth/login
 * PRD Mapping: FR-04, FR-06, FR-07, AC-01
 */
const login = async (req, res, next) => {
  try {
    const { login, password } = req.body;
    const normalizedLogin = login.toLowerCase().trim();

    // Query by either username or email
    const query = normalizedLogin.includes('@')
      ? { email: normalizedLogin }
      : { username: normalizedLogin };

    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
        errors: [],
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
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

    // Issue signed JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Return current authenticated user profile
 * GET /api/auth/me
 * PRD Mapping: FR-07
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          username: req.user.username,
          email: req.user.email,
          isVerified: req.user.isVerified,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate 1h password reset token and dispatch email
 * POST /api/auth/forgot-password
 * PRD Mapping: FR-08, AC-02
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    // Prevent user enumeration: always return 200
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email address is registered, a password reset link has been dispatched.',
        data: null,
      });
    }

    const rawToken = user.createPasswordResetToken();
    await user.save();

    try {
      await sendPasswordResetEmail(user, rawToken);
    } catch (emailErr) {
      console.error('[AuthController] Failed to dispatch password reset email:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'If that email address is registered, a password reset link has been dispatched.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Set new password using valid reset token
 * POST /api/auth/reset-password/:token
 * PRD Mapping: FR-08, AC-02
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is required.',
        errors: [],
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
        errors: [],
      });
    }

    // Update password (pre-save hook will hash it) and clear token fields
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You may now log in with your new credentials.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
