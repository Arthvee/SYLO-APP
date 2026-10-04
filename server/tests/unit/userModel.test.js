const User = require('../../models/User');
require('../setup');

describe('User Model Unit Tests (TG-2)', () => {
  const validUserData = {
    name: 'Alex Vance',
    username: 'alexvance',
    email: 'alex.vance@example.com',
    password: 'Password123!',
  };

  it('U-01: should create and save a user successfully with valid fields', async () => {
    const user = new User(validUserData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('Alex Vance');
    expect(savedUser.username).toBe('alexvance');
    expect(savedUser.email).toBe('alex.vance@example.com');
    expect(savedUser.isVerified).toBe(false);
  });

  it('U-02: should reject usernames violating length and character constraints', async () => {
    // Too short (< 3 chars)
    const shortUser = new User({ ...validUserData, username: 'al' });
    await expect(shortUser.save()).rejects.toThrow();

    // Invalid characters (spaces, special symbols)
    const invalidCharUser = new User({ ...validUserData, username: 'alex!vance' });
    await expect(invalidCharUser.save()).rejects.toThrow();
  });

  it('U-03: should normalize username and email to lowercase', async () => {
    const user = new User({
      ...validUserData,
      username: 'ALEX_VANCE',
      email: 'ALEX.VANCE@EXAMPLE.COM',
    });
    const savedUser = await user.save();

    expect(savedUser.username).toBe('alex_vance');
    expect(savedUser.email).toBe('alex.vance@example.com');
  });

  it('U-04: should enforce uniqueness on username and email', async () => {
    await new User(validUserData).save();

    // Duplicate username
    const dupUsername = new User({
      ...validUserData,
      email: 'different@example.com',
    });
    await expect(dupUsername.save()).rejects.toThrow();

    // Duplicate email
    const dupEmail = new User({
      ...validUserData,
      username: 'differentuser',
    });
    await expect(dupEmail.save()).rejects.toThrow();
  });

  it('U-05: should hash password with bcrypt on save', async () => {
    const user = new User(validUserData);
    await user.save();

    // Query raw document with password selected
    const fetched = await User.findById(user._id).select('+password');
    expect(fetched.password).not.toBe(validUserData.password);
    expect(fetched.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
  });

  it('U-06: should correctly compare valid and invalid passwords via comparePassword()', async () => {
    const user = new User(validUserData);
    await user.save();

    const fetched = await User.findById(user._id).select('+password');
    const isMatch = await fetched.comparePassword('Password123!');
    const isWrongMatch = await fetched.comparePassword('WrongPassword999!');

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });

  it('U-07: should generate SHA-256 hashed email verification token with 24h expiration', async () => {
    const user = new User(validUserData);
    const rawToken = user.createEmailVerificationToken();

    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBe(64); // 32 bytes hex = 64 chars
    expect(user.verificationToken).toBeDefined();
    expect(user.verificationToken).not.toBe(rawToken); // Hashed, not raw
    expect(user.verificationExpires.getTime()).toBeGreaterThan(Date.now() + 23 * 3600 * 1000);
  });

  it('U-08: should generate SHA-256 hashed password reset token with 1h expiration', async () => {
    const user = new User(validUserData);
    const rawToken = user.createPasswordResetToken();

    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBe(64);
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordToken).not.toBe(rawToken);
    expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now() + 50 * 60 * 1000);
  });

  it('U-09: should exclude sensitive fields in toJSON output', async () => {
    const user = new User(validUserData);
    user.createEmailVerificationToken();
    user.createPasswordResetToken();
    await user.save();

    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.verificationToken).toBeUndefined();
    expect(json.verificationExpires).toBeUndefined();
    expect(json.resetPasswordToken).toBeUndefined();
    expect(json.resetPasswordExpires).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });
});
