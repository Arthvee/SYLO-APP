const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name or company name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [
      /^[a-z0-9_-]{3,20}$/,
      'Username may only contain lowercase letters, numbers, underscores, and hyphens'
    ],
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email address'
    ],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Strict protection: excluded from queries by default
  },
  isVerified: {
    type: Boolean,
    default: true // Temporarily set to true while email verification is deferred (see todo.md)
  },
  verificationToken: {
    type: String,
    default: null,
    select: false
  },
  verificationExpires: {
    type: Date,
    default: null,
    select: false
  },
  resetPasswordToken: {
    type: String,
    default: null,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
    select: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.verificationToken;
      delete ret.verificationExpires;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save hook: Hash password prior to storage if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method: Verify candidate password against stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Generate and hash email verification token (24h lifespan)
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return rawToken;
};

// Instance method: Generate and hash password reset token (1h lifespan)
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return rawToken;
};

module.exports = mongoose.model('User', userSchema);
