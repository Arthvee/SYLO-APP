process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
process.env.JWT_EXPIRES_IN = '1h';

const { generateToken, verifyToken } = require('../../utils/jwt');

describe('JWT Utility Unit Tests (TG-2)', () => {

  const mockUser = {
    _id: '6700c8f5e7149a4e9b9c0001',
    username: 'alexvance',
    email: 'alex.vance@example.com',
  };

  it('JWT-01: should generate a valid JWT with user payload', () => {
    const token = generateToken(mockUser);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // header.payload.signature
  });

  it('JWT-02: should verify and decode the token successfully', () => {
    const token = generateToken(mockUser);
    const decoded = verifyToken(token);

    expect(decoded.id).toBe(mockUser._id);
    expect(decoded.username).toBe(mockUser.username);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.exp).toBeDefined();
  });

  it('JWT-03: should reject tampered tokens', () => {
    const token = generateToken(mockUser);
    const tampered = token.slice(0, -5) + 'abcde';

    expect(() => verifyToken(tampered)).toThrow();
  });
});
