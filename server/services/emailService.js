const nodemailer = require('nodemailer');

let cachedTransporter = null;
const dispatchedEmails = []; // Holds dispatched email metadata for test assertions

/**
 * Initialize or retrieve the active Nodemailer transporter.
 * In development without explicit SMTP credentials, auto-generates an Ethereal sandbox account.
 */
const getTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Test mode in-memory transporter
  if (process.env.NODE_ENV === 'test') {
    cachedTransporter = {
      sendMail: async (options) => {
        dispatchedEmails.push(options);
        return { messageId: `mock-${Date.now()}`, envelope: options };
      }
    };
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If explicit credentials are provided, use standard SMTP configuration
  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host: host || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
    return cachedTransporter;
  }

  // Development Fallback: Auto-provision Ethereal test account
  console.log('[EmailService] No SMTP credentials provided. Creating Ethereal sandbox account...');
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  console.log(`[EmailService] Ethereal sandbox initialized (User: ${testAccount.user})`);
  return cachedTransporter;
};

/**
 * Base Sylo email layout wrapper applying brand styling tokens
 */
const renderEmailLayout = ({ title, bodyHtml, footerHtml }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8f9ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0b1c30; }
    .wrapper { width: 100%; max-width: 580px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.04); border: 1px solid #e5eeff; }
    .header { padding: 24px 32px; background-color: #ffffff; border-bottom: 1px solid #eff4ff; display: flex; align-items: center; }
    .logo-badge { display: inline-block; width: 32px; height: 32px; background-color: #0052ff; border-radius: 8px; color: #ffffff; font-weight: bold; text-align: center; line-height: 32px; font-size: 16px; margin-right: 10px; }
    .brand-name { font-size: 20px; font-weight: 700; color: #0b1c30; vertical-align: middle; }
    .content { padding: 36px 32px; }
    h1 { font-size: 22px; font-weight: 600; color: #0b1c30; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 24px; color: #434656; margin: 0 0 16px; }
    .button-container { margin: 28px 0; }
    .button { display: inline-block; padding: 12px 28px; background-color: #0052ff; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center; }
    .footer { padding: 24px 32px; background-color: #eff4ff; border-top: 1px solid #e5eeff; font-size: 12px; color: #737688; line-height: 18px; }
    .link-fallback { word-break: break-all; color: #0052ff; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="logo-badge">&#9670;</span>
      <span class="brand-name">Sylo</span>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      ${footerHtml || 'You are receiving this notification because you created or requested an action on your Sylo workspace.'}
      <br>&copy; ${new Date().getFullYear()} Sylo Project Management. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Dispatch verification email with token link (24h lifespan)
 */
const sendVerificationEmail = async (user, rawToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${clientUrl}/verify-email/${rawToken}`;
  const from = process.env.EMAIL_FROM || 'Sylo Workspace <no-reply@sylo.io>';

  const bodyHtml = `
    <h1>Verify your Sylo account</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>Thanks for creating an account with Sylo. To activate your workspace and start collaborating with your team, please confirm your email address.</p>
    <div class="button-container">
      <a href="${verifyUrl}" class="button" target="_blank">Verify Email Address</a>
    </div>
    <p>This verification link will expire in <strong>24 hours</strong>.</p>
    <p>If the button above does not work, copy and paste this URL into your browser:</p>
    <p><a href="${verifyUrl}" class="link-fallback">${verifyUrl}</a></p>
  `;

  const text = `Hi ${user.name || user.username},\n\nPlease verify your Sylo account by opening the following link:\n${verifyUrl}\n\nThis link will expire in 24 hours.`;

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from,
    to: user.email,
    subject: 'Verify your Sylo account',
    html: renderEmailLayout({ title: 'Verify your Sylo account', bodyHtml }),
    text
  });

  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log(`📧 [Ethereal Sandbox] Verification email preview: ${preview}`);
    }
  }

  return info;
};

/**
 * Dispatch welcome confirmation email post-verification
 */
const sendWelcomeEmail = async (user) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginUrl = `${clientUrl}/login`;
  const from = process.env.EMAIL_FROM || 'Sylo Workspace <no-reply@sylo.io>';

  const bodyHtml = `
    <h1>Welcome to Sylo, ${user.name || user.username}! &#127881;</h1>
    <p>Your email address has been successfully verified, and your workspace is fully active.</p>
    <p>You can now create projects, invite team members using their unique usernames, assign tasks, and track real-time progress across sprints.</p>
    <div class="button-container">
      <a href="${loginUrl}" class="button" target="_blank">Go to Sylo Dashboard</a>
    </div>
    <p>Need help getting started? Check out the guided checklist in your dashboard.</p>
  `;

  const text = `Welcome to Sylo, ${user.name || user.username}!\n\nYour account is now active. Log in at ${loginUrl} to start managing your projects.`;

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from,
    to: user.email,
    subject: 'Welcome to Sylo — Account Activated!',
    html: renderEmailLayout({ title: 'Welcome to Sylo', bodyHtml }),
    text
  });

  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log(`📧 [Ethereal Sandbox] Welcome email preview: ${preview}`);
    }
  }

  return info;
};

/**
 * Dispatch password reset email with token link (1h lifespan)
 */
const sendPasswordResetEmail = async (user, rawToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;
  const from = process.env.EMAIL_FROM || 'Sylo Workspace <no-reply@sylo.io>';

  const bodyHtml = `
    <h1>Reset your password</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>We received a request to reset your Sylo password. Click the button below to choose a new password.</p>
    <div class="button-container">
      <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
    </div>
    <p>For your security, this password reset link will expire in <strong>1 hour</strong>.</p>
    <p>If you did not make this request, you can safely ignore this email; your existing password will remain active.</p>
    <p><a href="${resetUrl}" class="link-fallback">${resetUrl}</a></p>
  `;

  const text = `Hi ${user.name || user.username},\n\nYou requested a password reset. Open the following link to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.`;

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from,
    to: user.email,
    subject: 'Reset your Sylo password',
    html: renderEmailLayout({ title: 'Reset your Sylo password', bodyHtml }),
    text
  });

  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log(`📧 [Ethereal Sandbox] Password reset preview: ${preview}`);
    }
  }

  return info;
};

module.exports = {
  getTransporter,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  dispatchedEmails
};
