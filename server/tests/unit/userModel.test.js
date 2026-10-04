const bcrypt = require('bcryptjs');
const User = require('../../models/User');

describe('User Model & Schema Unit Tests (TG-2)', () => {
  const validUserData = {
    name: 'Alex Vance',
    username: 'alexvance',
    email: 'alex.vance@example.com',
    password: 'Password123!',
  };

  it('U-01: should validate successfully with all required valid fields', async () => {
    const user = new User(validUserData);
    await expect(user.validate()).resolves.toBeUndefined();

    expect(user.name).toBe('Alex Vance');
    expect(user.username).toBe('alexvance');
    expect(user.email).toBe('alex.vance@example.com');
    expect(user.isVerified).toBe(false);
  });

  it('U-02: should reject usernames violating length and character constraints', async () => {
    // Too short (< 3 chars)
    const shortUser = new User({ ...validUserData, username: 'al' });
    await expect(shortUser.validate()).rejects.toThrow();

    // Too long (> 20 chars)
    const longUser = new User({ ...validUserData, username: 'thisusernameiswaytoolongtofit' });
    await expect(longUser.validate()).rejects.toThrow();

    // Invalid characters (spaces, special symbols)
    const invalidCharUser = new User({ ...validUserData, username: 'alex!vance' });
    await expect(invalidCharUser.validate()).rejects.toThrow();
  });

  it('U-03: should normalize username and email to lowercase', () => {
    const user = new User({
      ...validUserData,
      username: 'ALEX_VANCE',
      email: 'ALEX.VANCE@EXAMPLE.COM',
    });

    expect(user.username).toBe('alex_vance');
    expect(user.email).toBe('alex.vance@example.com');
  });

  it('U-04: should reject invalid email format during validation', async () => {
    const invalidEmailUser = new User({
      ...validUserData,
      email: 'not-a-valid-email',
    });

    await expect(invalidEmailUser.validate()).rejects.toThrow(/valid email/);
  });

  it('U-05: should reject password shorter than 8 characters', async () => {
    const shortPassUser = new User({
      ...validUserData,
      password: 'short',
    });

    await expect(shortPassUser.validate()).rejects.toThrow();
  });

  it('U-06: should correctly compare valid and invalid passwords via comparePassword()', async () => {
    const rawPassword = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const user = new User({
      ...validUserData,
      password: hashedPassword,
    });

    const isMatch = await user.comparePassword('Password123!');
    const isWrongMatch = await user.comparePassword('WrongPassword999!');

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });

  it('U-07: should generate SHA-256 hashed email verification token with 24h expiration', () => {
    const user = new User(validUserData);
    const rawToken = user.createEmailVerificationToken();

    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBe(64); // 32 bytes hex = 64 chars
    expect(user.verificationToken).toBeDefined();
    expect(user.verificationToken).not.toBe(rawToken); // Hashed, not raw
    expect(user.verificationExpires.getTime()).toBeGreaterThan(Date.now() + 23 * 3600 * 1000);
  });

  it('U-08: should generate SHA-256 hashed password reset token with 1h expiration', () => {
    const user = new User(validUserData);
    const rawToken = user.createPasswordResetToken();

    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBe(64);
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordToken).not.toBe(rawToken);
    expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now() + 50 * 60 * 1000);
  });

  it('U-09: should exclude sensitive fields in toJSON output', () => {
    const user = new User(validUserData);
    user.createEmailVerificationToken();
    user.createPasswordResetToken();

    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.verificationToken).toBeUndefined();
    expect(json.verificationExpires).toBeUndefined();
    expect(json.resetPasswordToken).toBeUndefined();
    expect(json.resetPasswordExpires).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });
});
