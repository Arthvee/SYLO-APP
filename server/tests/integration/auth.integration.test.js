process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_integration_jwt_secret_98765';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';

const request = require('supertest');
const app = require('../../app');
const { dispatchedEmails } = require('../../services/emailService');

// In-memory document store simulating MongoDB for integration testing
const mockUsers = [];

// Mock the User model with functional in-memory operations backed by bcrypt and crypto
jest.mock('../../models/User', () => {
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');

  function MockUser(data) {
    this._id = data._id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.name = data.name;
    this.username = data.username ? data.username.toLowerCase().trim() : '';
    this.email = data.email ? data.email.toLowerCase().trim() : '';
    this.password = data.password;
    this.isVerified = data.isVerified !== undefined ? data.isVerified : true; // Default true while deferred (see todo.md)
    this.verificationToken = data.verificationToken || null;
    this.verificationExpires = data.verificationExpires || null;
    this.resetPasswordToken = data.resetPasswordToken || null;
    this.resetPasswordExpires = data.resetPasswordExpires || null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this._isPasswordModified = true;

    this.createEmailVerificationToken = function () {
      const rawToken = crypto.randomBytes(32).toString('hex');
      this.verificationToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return rawToken;
    };

    this.createPasswordResetToken = function () {
      const rawToken = crypto.randomBytes(32).toString('hex');
      this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      return rawToken;
    };

    this.comparePassword = async function (candidate) {
      return await bcrypt.compare(candidate, this.password);
    };

    this.save = async function () {
      if (!this.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
      const existingIdx = mockUsers.findIndex(
        (u) => u._id.toString() === this._id.toString()
      );
      if (existingIdx >= 0) {
        mockUsers[existingIdx] = this;
      } else {
        mockUsers.push(this);
      }
      return this;
    };

    this.toJSON = function () {
      const clone = { ...this };
      delete clone.password;
      delete clone.verificationToken;
      delete clone.verificationExpires;
      delete clone.resetPasswordToken;
      delete clone.resetPasswordExpires;
      return clone;
    };
  }

  MockUser.findOne = jest.fn().mockImplementation((query) => {
    let found = mockUsers.find((u) => {
      if (query.username && u.username !== query.username) return false;
      if (query.email && u.email !== query.email) return false;
      if (query.verificationToken && u.verificationToken !== query.verificationToken) return false;
      if (query.resetPasswordToken && u.resetPasswordToken !== query.resetPasswordToken) return false;
      if (query.verificationExpires && query.verificationExpires.$gt) {
        if (!u.verificationExpires || u.verificationExpires <= query.verificationExpires.$gt) return false;
      }
      if (query.resetPasswordExpires && query.resetPasswordExpires.$gt) {
        if (!u.resetPasswordExpires || u.resetPasswordExpires <= query.resetPasswordExpires.$gt) return false;
      }
      return true;
    });

    const chainable = {
      select: jest.fn().mockResolvedValue(found || null),
      then: (resolve) => resolve(found || null),
    };
    return chainable;
  });

  MockUser.findById = jest.fn().mockImplementation((id) => {
    const found = mockUsers.find((u) => u._id.toString() === id.toString());
    return Promise.resolve(found || null);
  });

  return MockUser;
});

const User = require('../../models/User');

describe('Phase 1 Authentication & Notification API Integration Tests (TG-6)', () => {
  beforeEach(() => {
    mockUsers.length = 0;
    dispatchedEmails.length = 0;
  });

  describe('AC-01: End-to-End Registration & Immediate Login Workflow (Email Verification Deferred)', () => {
    it('should complete the registration and immediate login lifecycle (deferred verification)', async () => {
      // 1. Register new user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alex Vance',
          username: 'alexvance',
          email: 'alex.vance@example.com',
          password: 'Password123!',
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.data.username).toBe('alexvance');
      expect(registerRes.body.data.isVerified).toBe(true);

      // 2. Login immediately post-registration with signed JWT (FR-04 bypassed - see todo.md)
      const verifiedLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'alex.vance@example.com', // Test login with email
          password: 'Password123!',
        });

      expect(verifiedLoginRes.status).toBe(200);
      expect(verifiedLoginRes.body.success).toBe(true);
      expect(verifiedLoginRes.body.data.token).toBeDefined();
      const jwtToken = verifiedLoginRes.body.data.token;

      // 3. Access protected profile (/api/auth/me) with Bearer token (FR-07)
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.username).toBe('alexvance');
      expect(meRes.body.data.user.email).toBe('alex.vance@example.com');
      expect(meRes.body.data.user.isVerified).toBe(true);
      expect(meRes.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate username or duplicate email on registration (BR-16)', async () => {
      // Register initial user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Original User',
          username: 'firstuser',
          email: 'first@example.com',
          password: 'Password123!',
        });

      // Attempt duplicate username
      const dupUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          username: 'FIRSTUSER', // Case-insensitive collision
          email: 'different@example.com',
          password: 'Password123!',
        });

      expect(dupUserRes.status).toBe(400);
      expect(dupUserRes.body.errors.some((e) => e.field === 'username')).toBe(true);

      // Attempt duplicate email
      const dupEmailRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          username: 'seconduser',
          email: 'FIRST@EXAMPLE.COM',
          password: 'Password123!',
        });

      expect(dupEmailRes.status).toBe(400);
      expect(dupEmailRes.body.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should reject email verification with invalid or expired token', async () => {
      const invalidTokenRes = await request(app)
        .get('/api/auth/verify-email/tampered_token_abcdef1234567890');

      expect(invalidTokenRes.status).toBe(400);
      expect(invalidTokenRes.body.success).toBe(false);
      expect(invalidTokenRes.body.message).toContain('invalid or has expired');
    });
  });

  describe('AC-02: End-to-End Forgot Password & Password Reset Workflow', () => {
    it('should complete the entire AC-02 password recovery lifecycle', async () => {
      // 1. Pre-register and verify user
      const user = new User({
        name: 'Sarah Connor',
        username: 'sarahc',
        email: 'sarah@example.com',
        password: 'OldPassword123!',
        isVerified: true,
      });
      await user.save();

      // 2. Request forgot-password email
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'sarah@example.com' });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);

      // Check reset email was dispatched
      expect(dispatchedEmails.length).toBe(1);
      const resetEmail = dispatchedEmails[0];
      expect(resetEmail.to).toBe('sarah@example.com');
      expect(resetEmail.subject).toBe('Reset your Sylo password');

      // Extract raw reset token
      const tokenMatch = resetEmail.html.match(/\/reset-password\/([a-f0-9]{64})/);
      expect(tokenMatch).not.toBeNull();
      const rawResetToken = tokenMatch[1];

      // 3. Submit new password with token
      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${rawResetToken}`)
        .send({
          password: 'NewStrongPassword456!',
          confirmPassword: 'NewStrongPassword456!',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 4. Confirm login with OLD password fails (401)
      const oldLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'sarahc',
          password: 'OldPassword123!',
        });

      expect(oldLoginRes.status).toBe(401);
      expect(oldLoginRes.body.success).toBe(false);

      // 5. Confirm login with NEW password succeeds (200)
      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'sarahc',
          password: 'NewStrongPassword456!',
        });

      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.success).toBe(true);
      expect(newLoginRes.body.data.token).toBeDefined();
    });

    it('should return 200 for non-existent email on forgot-password (prevent user enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(dispatchedEmails.length).toBe(0); // No email sent, but client receives success
    });
  });

  describe('Session Security & Negative Boundary Checks', () => {
    it('should reject access to protected /me endpoint without Bearer token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No authentication token provided');
    });

    it('should reject login with wrong password', async () => {
      const user = new User({
        name: 'Alex Vance',
        username: 'alexvance',
        email: 'alex.vance@example.com',
        password: 'Password123!',
        isVerified: true,
      });
      await user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'alexvance',
          password: 'IncorrectPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow resending verification email for unverified user', async () => {
      const user = new User({
        name: 'Unverified User',
        username: 'unverified',
        email: 'unverified@example.com',
        password: 'Password123!',
        isVerified: false,
      });
      await user.save();

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'unverified@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(dispatchedEmails.length).toBe(1);
    });
  });
});
