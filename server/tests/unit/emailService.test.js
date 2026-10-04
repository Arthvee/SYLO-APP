process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.EMAIL_FROM = 'Sylo Workspace <no-reply@sylo.io>';

const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  dispatchedEmails
} = require('../../services/emailService');

describe('Email Service Unit Tests (TG-3)', () => {
  beforeEach(() => {
    dispatchedEmails.length = 0; // Clear recorded emails
  });

  const mockUser = {
    name: 'Alex Vance',
    username: 'alexvance',
    email: 'alex.vance@example.com'
  };

  it('EMAIL-01: should dispatch verification email with token link and Sylo template', async () => {
    const rawToken = 'mock_raw_verification_token_12345';
    await sendVerificationEmail(mockUser, rawToken);

    expect(dispatchedEmails.length).toBe(1);
    const email = dispatchedEmails[0];
    expect(email.to).toBe(mockUser.email);
    expect(email.subject).toBe('Verify your Sylo account');
    expect(email.html).toContain('http://localhost:5173/verify-email/mock_raw_verification_token_12345');
    expect(email.html).toContain('Verify Email Address');
    expect(email.html).toContain('Alex Vance');
  });

  it('EMAIL-02: should dispatch welcome email upon account activation', async () => {
    await sendWelcomeEmail(mockUser);

    expect(dispatchedEmails.length).toBe(1);
    const email = dispatchedEmails[0];
    expect(email.to).toBe(mockUser.email);
    expect(email.subject).toBe('Welcome to Sylo — Account Activated!');
    expect(email.html).toContain('http://localhost:5173/login');
    expect(email.html).toContain('Go to Sylo Dashboard');
  });

  it('EMAIL-03: should dispatch password reset email with 1h token link', async () => {
    const rawToken = 'mock_raw_reset_token_67890';
    await sendPasswordResetEmail(mockUser, rawToken);

    expect(dispatchedEmails.length).toBe(1);
    const email = dispatchedEmails[0];
    expect(email.to).toBe(mockUser.email);
    expect(email.subject).toBe('Reset your Sylo password');
    expect(email.html).toContain('http://localhost:5173/reset-password/mock_raw_reset_token_67890');
    expect(email.html).toContain('Reset Password');
  });
});
