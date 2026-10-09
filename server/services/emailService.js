/**
 * Mock Email Service Bypass for Sylo Development & Testing.
 *
 * Temporarily replaces Nodemailer/SMTP network calls to prevent 15000ms timeouts
 * caused by local port blocks or unconfigured third-party providers.
 * Outputs clickable verification and password reset links directly to the terminal.
 */

const dispatchedEmails = [];

/**
 * Dispatch mock verification email with terminal link output.
 * @param {object} user - User object containing email, name, username
 * @param {string} rawToken - Unhashed verification token
 * @returns {Promise<boolean>} Resolves immediately with true
 */
const sendVerificationEmail = async (user, rawToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${clientUrl}/verify-email/${rawToken}`;
  const subject = 'Verify your Sylo account';

  console.log('\n======================================================================');
  console.log('📧 [EMAIL MOCK] Verification Email Dispatched');
  console.log(`👤 Recipient : ${user.name || user.username} <${user.email}>`);
  console.log(`🔗 Click to verify: ${verifyUrl}`);
  console.log('======================================================================\n');

  dispatchedEmails.push({
    to: user.email,
    subject,
    html: `<h1>Verify your Sylo account</h1><p>Hi ${user.name || user.username},</p><p><a href="${verifyUrl}">Verify Email Address</a></p>`,
    text: `Hi ${user.name || user.username},\nVerify your account: ${verifyUrl}`,
    token: rawToken,
    url: verifyUrl,
    timestamp: new Date(),
  });

  return true;
};

/**
 * Dispatch mock welcome email upon email verification.
 * @param {object} user - User object
 * @returns {Promise<boolean>} Resolves immediately with true
 */
const sendWelcomeEmail = async (user) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginUrl = `${clientUrl}/login`;
  const subject = 'Welcome to Sylo — Account Activated!';

  console.log('\n======================================================================');
  console.log('📧 [EMAIL MOCK] Welcome Email Dispatched');
  console.log(`👤 Recipient : ${user.name || user.username} <${user.email}>`);
  console.log(`🎉 Account is verified and active. Login at: ${loginUrl}`);
  console.log('======================================================================\n');

  dispatchedEmails.push({
    to: user.email,
    subject,
    html: `<h1>Welcome to Sylo — Account Activated!</h1><p><a href="${loginUrl}">Go to Sylo Dashboard</a></p>`,
    text: `Welcome to Sylo! Log in at: ${loginUrl}`,
    timestamp: new Date(),
  });

  return true;
};

/**
 * Dispatch mock password reset email with terminal link output.
 * @param {object} user - User object
 * @param {string} rawToken - Unhashed password reset token
 * @returns {Promise<boolean>} Resolves immediately with true
 */
const sendPasswordResetEmail = async (user, rawToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;
  const subject = 'Reset your Sylo password';

  console.log('\n======================================================================');
  console.log('📧 [EMAIL MOCK] Password Reset Email Dispatched');
  console.log(`👤 Recipient : ${user.name || user.username} <${user.email}>`);
  console.log(`🔑 Click to reset password: ${resetUrl}`);
  console.log('======================================================================\n');

  dispatchedEmails.push({
    to: user.email,
    subject,
    html: `<h1>Reset your password</h1><p>Hi ${user.name || user.username},</p><p><a href="${resetUrl}">Reset Password</a></p>`,
    text: `Hi ${user.name || user.username},\nReset your password: ${resetUrl}`,
    token: rawToken,
    url: resetUrl,
    timestamp: new Date(),
  });

  return true;
};

/**
 * Dispatch mock overdue task reminder email.
 * @param {object} recipient - User assigned or project owner
 * @param {object} task - Overdue task document
 * @param {object} project - Parent project document
 * @returns {Promise<boolean>} Resolves immediately with true
 */
const sendOverdueTaskAlert = async (recipient, task, project) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const projectUrl = `${clientUrl}/projects/${project._id || project.id}`;
  const subject = `Overdue Task Alert: "${task.title}"`;

  console.log('\n======================================================================');
  console.log(`📧 [EMAIL MOCK] Overdue Task Alert: "${task.title}"`);
  console.log(`👤 Recipient : ${recipient.name || recipient.username} <${recipient.email}>`);
  console.log(`📁 Project   : ${project.title} (${projectUrl})`);
  console.log('======================================================================\n');

  dispatchedEmails.push({
    to: recipient.email,
    subject,
    html: `<h1>Overdue Task Alert: "${task.title}"</h1><p><a href="${projectUrl}">View Task in Sylo</a></p>`,
    text: `Task "${task.title}" in project "${project.title}" is overdue: ${projectUrl}`,
    timestamp: new Date(),
  });

  return true;
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOverdueTaskAlert,
  dispatchedEmails,
};
