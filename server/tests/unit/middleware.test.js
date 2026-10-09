process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const errorHandler = require('../../middleware/errorHandler');
const authenticate = require('../../middleware/auth');
const { generateToken } = require('../../utils/jwt');
const User = require('../../models/User');

// Mock User model for middleware testing without DB
jest.mock('../../models/User');

describe('Middleware Unit Tests (TG-4)', () => {
  describe('Centralized Error Handler', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it('ERR-01: should format Mongoose duplicate key error (code 11000) as 400 with field error', () => {
      const duplicateError = {
        code: 11000,
        keyValue: { username: 'alexvance' },
      };

      errorHandler(duplicateError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username is already registered',
        errors: [
          {
            field: 'username',
            message: "Username 'alexvance' is already taken",
          },
        ],
      });
    });

    it('ERR-02: should format Mongoose ValidationError as 400', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          email: { path: 'email', message: 'Please provide a valid email' },
          password: { path: 'password', message: 'Password is too short' },
        },
      };

      errorHandler(validationError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Please provide a valid email' },
          { field: 'password', message: 'Password is too short' },
        ],
      });
    });

    it('ERR-03: should format CastError as 404', () => {
      const castError = {
        name: 'CastError',
        value: 'invalid_id_123',
      };

      errorHandler(castError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found with id of invalid_id_123',
        errors: [],
      });
    });

    it('ERR-04: should format JWT token errors as 401', () => {
      const jwtError = { name: 'JsonWebTokenError' };
      errorHandler(jwtError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication token is invalid or corrupted',
        errors: [],
      });

      const expiredError = { name: 'TokenExpiredError' };
      errorHandler(expiredError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication session has expired. Please log in again.',
        errors: [],
      });
    });

    it('ERR-05: should format generic error with default 500 status', () => {
      const genericError = new Error('Unexpected crash');
      errorHandler(genericError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unexpected crash',
        errors: [],
      });
    });
  });

  describe('JWT Authentication Middleware (auth.js)', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      jest.clearAllMocks();
      mockReq = {
        header: jest.fn(),
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it('AUTH-01: should return 401 if Authorization header is missing', async () => {
      mockReq.header.mockReturnValue(null);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access denied. No authentication token provided.',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('AUTH-02: should return 401 if token is not Bearer format', async () => {
      mockReq.header.mockReturnValue('Basic 12345');

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('AUTH-03: should automatically activate user and call next() even if user was previously unverified (deferred verification)', async () => {
      const unverifiedUser = {
        _id: '6700c8f5e7149a4e9b9c0001',
        username: 'alexvance',
        email: 'alex@example.com',
        isVerified: false,
        save: jest.fn().mockResolvedValue(true),
      };

      const token = generateToken(unverifiedUser);
      mockReq.header.mockReturnValue(`Bearer ${token}`);
      User.findById.mockResolvedValue(unverifiedUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(unverifiedUser.isVerified).toBe(true);
      expect(mockReq.user).toEqual(unverifiedUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('AUTH-04: should attach user to req and call next() if user is verified', async () => {
      const verifiedUser = {
        _id: '6700c8f5e7149a4e9b9c0001',
        username: 'alexvance',
        email: 'alex@example.com',
        isVerified: true,
      };

      const token = generateToken(verifiedUser);
      mockReq.header.mockReturnValue(`Bearer ${token}`);
      User.findById.mockResolvedValue(verifiedUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(verifiedUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rate Limiter Middleware', () => {
    it('RATE-01: should export loginLimiter, registerLimiter, and passwordResetLimiter middleware', () => {
      const { loginLimiter, registerLimiter, passwordResetLimiter } = require('../../middleware/rateLimiter');
      expect(typeof loginLimiter).toBe('function');
      expect(typeof registerLimiter).toBe('function');
      expect(typeof passwordResetLimiter).toBe('function');
    });

    it('RATE-02: should skip rate limiting when NODE_ENV is test', async () => {
      const { loginLimiter } = require('../../middleware/rateLimiter');
      const req = {};
      const res = {};
      const next = jest.fn();
      await loginLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
