# Sylo Project — Deferred Features & Technical Debt (TODO)

## 1. Email Verification & Production Email Provider Integration

### Status
**Temporarily Deferred (Active Bypass)**  
*Deferred on:* Phase 4 (UI Implementation & Polish)  
*Reason:* Local ISP and firewall network port restrictions blocked outbound SMTP ports (587 / 465) to test mailers (Ethereal), causing 15,000ms Axios request timeouts on the client. To eliminate friction during local development and allow immediate testing of the full workspace, registration and login email verification checks are bypassed.

---

### PRD Functional Requirements & Acceptance Criteria
- **FR-03 (Token Generation & Dispatch):** The system must generate a secure, single-use, 24-hour expiring email verification token and send a verification link upon user registration.
- **FR-04 (Mandatory Verification Gate):** New accounts must remain inactive (`isVerified: false`) until email verification is confirmed. Any login or access attempt by an unverified account must be rejected with HTTP `403 Forbidden` (`Email address has not been verified`).
- **FR-05 (Verification Link Handling & Welcome Email):** Visiting `/api/auth/verify-email/:token` must validate the token, mark `isVerified: true`, expire the token, and dispatch a welcome confirmation email.
- **AC-01 (End-to-End Registration & Verification Flow):** Verified user lifecycle: Register &rarr; Receive link &rarr; Block unverified login &rarr; Confirm link &rarr; Activate account &rarr; Receive welcome email &rarr; Successfully log in.

---

### Current Temporary Workarounds & Bypasses in Place
1. **User Schema (`server/models/User.js`):**
   - `isVerified` field defaults to `true` instead of `false`.
2. **Registration Controller (`server/controllers/authController.js` - `register`):**
   - New user accounts are created with `isVerified: true` immediately.
   - Email dispatch during registration is bypassed.
3. **Login Controller (`server/controllers/authController.js` - `login`):**
   - The HTTP `403 Forbidden` check on `!user.isVerified` has been removed.
   - Legacy users created prior to the bypass (with `isVerified: false`) are automatically updated to `isVerified: true` and saved upon entering valid credentials.
4. **Authentication Middleware (`server/middleware/auth.js`):**
   - Removed the `403 Forbidden` verification check; all authenticated requests with a valid JWT token proceed directly.
   - Automatically activates legacy accounts if `!user.isVerified`.
5. **Email Service (`server/services/emailService.js`):**
   - Replaced SMTP/Nodemailer transport with an instant non-blocking mock service.
   - Mock service logs actionable verification and password reset URLs directly to the server terminal.
6. **Frontend Registration (`frontend/src/pages/RegisterPage.jsx`):**
   - Registration automatically toasts success and redirects immediately to `/login` without blocking the user on a "check email" screen.

---

### Production Re-Enablement Checklist
Follow these steps when ready to implement production email verification:

1. **Select & Provision a Cloud Email Provider:**
   - **Recommended:** [Resend](https://resend.com/) or [SendGrid](https://sendgrid.com/) using HTTPS REST APIs (avoids local port 587/465 SMTP blocking).
   - Configure sending domain DNS (DKIM, SPF, DMARC) in production.
2. **Configure Environment Secrets:**
   - Add provider credentials to `.env` (e.g. `RESEND_API_KEY`, `EMAIL_FROM=noreply@sylo.io`).
3. **Update Email Service (`server/services/emailService.js`):**
   - Install SDK (`npm install resend` or `@sendgrid/mail`).
   - Implement real HTML transactional templates for:
     - `sendVerificationEmail(user, token)`
     - `sendWelcomeEmail(user)`
     - `sendPasswordResetEmail(user, token)`
     - `sendOverdueTaskAlert(task, assignee)`
4. **Restore User Model (`server/models/User.js`):**
   - Change `isVerified: { type: Boolean, default: false }`.
5. **Restore Authentication Gate in Backend:**
   - In `server/controllers/authController.js`:
     - In `register`: set `isVerified: false`, create verification token, and call `await sendVerificationEmail(user, rawToken)`.
     - In `login`: restore the `if (!user.isVerified)` check returning HTTP `403 Forbidden`.
   - In `server/middleware/auth.js`:
     - Restore the `if (!user.isVerified)` check returning HTTP `403 Forbidden`.
6. **Restore Frontend Verification Flows:**
   - In `frontend/src/pages/RegisterPage.jsx`:
     - Restore the verification screen prompting users to check their email inbox.
   - In `frontend/src/pages/VerifyEmailPage.jsx`:
     - Test frontend handling of `/verify-email/:token` and redirect to `/login`.
7. **Update Test Suites:**
   - Re-enable the AC-01 unverified login assertions in `server/tests/integration/auth.integration.test.js`.
   - Re-enable the unverified user 403 test in `server/tests/unit/middleware.test.js`.
   - Re-enable `expect(user.isVerified).toBe(false)` in `server/tests/unit/userModel.test.js`.
