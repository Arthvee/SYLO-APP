# Phase 1 Technical Specification: Validation & Verification Criteria
## Database Foundation, Authentication & Notification Engine

**Project**: Sylo (Project & Task Management App)  
**Phase**: Phase 1  
**Status**: Approved Specification  
**Version**: 1.0  
**PRD Traceability**: FR-01 to FR-08, BR-16, AC-01, AC-02, Appendix A  

---

## 1. Overview & Quality Gate Philosophy

Before any development begins on **Phase 2 (Core REST API & Project-Task Engine)**, Phase 1 must pass a non-negotiable **Verification Gate**. Authentication, identity governance, cryptographic security, and transactional email automation constitute the security perimeter of the entire platform. Any flaw or ambiguity here compromises all downstream project and task access controls.

### 1.1 Acceptance Sign-Off Criteria
* 100% pass rate across all automated unit and integration tests.
* Full execution of the Manual Verification Runbook without developer intervention or direct database mutations.
* Zero leakage of password hashes or sensitive security tokens in API responses.
* Zero unverified accounts allowed to authenticate or obtain JWT tokens.
* Complete delivery and verification of transactional emails via Nodemailer (Ethereal or SMTP).

---

## 2. Acceptance Criteria & Verification Matrix

| ID | PRD Acceptance Criterion | Verification Method | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **AC-01** | A new user can register, receive a verification email, verify the account, receive a welcome email, and log in. | Automated Integration Test + E2E Runbook | Registration returns 201; verification email contains valid token; GET `/verify-email/:token` returns 200 and triggers welcome email; unverified login fails (403); post-verification login returns 200 with JWT. |
| **AC-02** | A user can complete the forgot-password and password-reset flow by email. | Automated Integration Test + E2E Runbook | Requesting forgot-password dispatches email with token; POST `/reset-password/:token` updates hash; old credentials fail (401); new credentials succeed (200). |
| **BR-16** | Usernames must be unique because collaborator invitations use usernames. | Model Validation + Controller Test | Duplicate username registration returns HTTP 400 with field-specific error. Case variations (`AlexChen` vs `alexchen`) are normalized and rejected as duplicates. |
| **FR-04** | User shall verify registered email before account is active. | Auth Middleware Test | `User.isVerified === false` strictly prevents login and blocks all authenticated routes with HTTP 403. |
| **FR-07** | Only authenticated users shall access private functionality. | Route Guard Test | Requests to `/api/auth/me` without Bearer token or with forged token return HTTP 401. |

---

## 3. Automated Test Suite Specifications

The test suite is organized into unit tests (model & utility logic) and end-to-end API integration tests using **Jest**, **Supertest**, and **mongodb-memory-server**.

### 3.1 Unit Test Suites

#### Suite 1: `User` Model & Schema Constraints (`tests/unit/userModel.test.js`)
* **U-01 (Required Fields)**: Attempting to save user without `name`, `username`, `email`, or `password` fails validation.
* **U-02 (Username Formatting)**:
  * Rejects usernames < 3 characters (e.g., `al`).
  * Rejects usernames > 20 characters.
  * Rejects usernames containing spaces or special characters (e.g., `alex@sylo`, `user!name`).
  * Accepts valid alphanumeric slugs (e.g., `alex_chen-99`).
* **U-03 (Username & Email Normalization)**:
  * Saving `ALEXCHEN` stores `alexchen` in the database.
  * Saving `USER@EXAMPLE.COM` stores `user@example.com` in the database.
* **U-04 (Duplicate Prevention)**:
  * Attempting to save two users with identical lowercase usernames throws Mongoose duplicate key error (code 11000).
  * Attempting to save two users with identical emails throws duplicate key error.
* **U-05 (Password Hashing)**:
  * Pre-save hook hashes raw password using `bcryptjs`.
  * Stored password does not match raw plaintext.
  * Stored password starts with standard bcrypt prefix (`$2a$` or `$2b$`).
  * Saving user without modifying password does not re-hash the existing password hash.
* **U-06 (Password Comparison Method)**:
  * `user.comparePassword('correctPassword')` resolves to `true`.
  * `user.comparePassword('wrongPassword')` resolves to `false`.
* **U-07 (Cryptographic Token Generation)**:
  * `createEmailVerificationToken()` returns a 64-character hex string.
  * Stored `verificationToken` matches SHA-256 hash of returned string.
  * Stored `verificationExpires` is approximately 24 hours in the future.
  * `createPasswordResetToken()` stores SHA-256 hash with 1-hour expiration.

#### Suite 2: JWT Security Utilities (`tests/unit/jwt.test.js`)
* **U-08 (Token Signing)**: Generates a valid three-part JWT (`header.payload.signature`).
* **U-09 (Payload Integrity)**: Decoded token contains `id`, `username`, `email`.
* **U-10 (Signature Verification)**: Valid token decodes successfully; token signed with invalid secret throws `JsonWebTokenError`.
* **U-11 (Token Expiration)**: Token with expired `exp` claim throws `TokenExpiredError`.

---

### 3.2 Integration Test Suites (`tests/integration/authApi.test.js`)

#### Suite 3: Registration (`POST /api/auth/register`)
```javascript
describe('POST /api/auth/register', () => {
  it('should register a new user successfully and return 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sarah Connor',
        username: 'sarahc',
        email: 'sarah@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('sarahc');
    expect(res.body.data.isVerified).toBe(false);
    expect(res.body.data.password).toBeUndefined(); // Sensitive field excluded
    expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if username is already registered', async () => {
    await createUser({ username: 'sarahc', email: 'other@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Sarah',
        username: 'sarahc',
        email: 'newemail@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].field).toBe('username');
  });

  it('should return 400 if password does not meet complexity policy', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Pass',
        username: 'weakuser',
        email: 'weak@example.com',
        password: 'weak' // Less than 8 chars, no uppercase/number
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].field).toBe('password');
  });
});
```

#### Suite 4: Email Verification (`GET /api/auth/verify-email/:token`)
* **I-01**: Accessing endpoint with valid unexpired token activates account (`isVerified = true`), clears token fields, returns 200, and triggers `sendWelcomeEmail`.
* **I-02**: Accessing endpoint with forged or tampered token returns 400 with invalid token message.
* **I-03**: Accessing endpoint with expired token (> 24h) returns 400 with expired token advisory.
* **I-04**: Reusing an already-verified token returns 400 (token already consumed and cleared).

#### Suite 5: User Login (`POST /api/auth/login`)
* **I-05**: Logging in with valid credentials for verified user returns 200 with JWT and user profile.
* **I-06**: Logging in with valid credentials for **unverified user** returns 403 Forbidden with prompt to verify email (FR-04).
* **I-07**: Logging in with invalid password returns 401 Unauthorized with generic error message.
* **I-08**: Logging in with non-existent username/email returns 401 Unauthorized.
* **I-09**: Supports logging in with either username OR email interchangeably.

#### Suite 6: Protected Session Profile (`GET /api/auth/me`)
* **I-10**: Sending valid `Authorization: Bearer <token>` returns 200 and user data.
* **I-11**: Omitting `Authorization` header returns 401 Unauthorized.
* **I-12**: Sending malformed header (e.g., `Basic 123` or missing `Bearer ` prefix) returns 401.
* **I-13**: Sending expired JWT returns 401 with session expired message.

#### Suite 7: Password Recovery Flow (`forgot-password` & `reset-password`)
* **I-14**: Requesting reset for valid email generates 1h token, stores SHA-256 hash, returns 200, and calls `sendPasswordResetEmail`.
* **I-15**: Requesting reset for non-existent email returns 200 (prevents user enumeration attack).
* **I-16**: Submitting new password with valid reset token updates password, clears token fields, returns 200.
* **I-17**: Logging in immediately after reset succeeds with new password and fails with old password.
* **I-18**: Submitting reset with mismatched `password` and `confirmPassword` returns 400 validation error.
* **I-19**: Submitting reset with expired token (> 1h) returns 400.
* **I-20**: Attempting to reuse an already-consumed reset token returns 400.

---

## 4. Security & Negative Boundary Verification

| Test Case | Attack / Failure Scenario | Target Vector | Enforced System Defense |
| :--- | :--- | :--- | :--- |
| **SEC-01** | **NoSQL Injection on Login** | Payload: `{"login": {"$ne": null}, "password": {"$ne": null}}` | Express validator enforces string type; Mongoose queries type-cast strictly, rejecting object predicates. Result: 400 Bad Request. |
| **SEC-02** | **Credential Enumeration** | Timing discrepancy or distinct error messages between valid vs invalid emails on password reset. | Controller returns identical generic 200 response in both cases with constant-time execution profile. |
| **SEC-03** | **Data Leakage in API** | Querying `/api/auth/me` or `/api/auth/login`. | Schema has `select: false` on `password`, `verificationToken`, and `resetPasswordToken`; Mongoose JSON transform strips internal fields. |
| **SEC-04** | **Token Tampering** | Manipulating characters in the verification or reset token. | Token validation relies on SHA-256 hash matching stored hex digest. Altering one byte results in hash mismatch $\rightarrow$ 400 Invalid Token. |
| **SEC-05** | **Token Expiration Tampering** | Changing client clock or submitting request 24h + 1m after issuance. | Server evaluates `verificationExpires > Date.now()` using server timestamp $\rightarrow$ 400 Expired Token. |
| **SEC-06** | **Unauthenticated Route Access** | Accessing protected APIs without JWT. | Auth middleware intercepts request prior to controller execution, emitting 401 envelope. |
| **SEC-07** | **Case Sensitivity Bypass** | Attacking username collision (e.g. creating `Admin` when `admin` exists). | Schema enforces `lowercase: true` on both username and email before querying or saving. |

---

## 5. Transactional Email Delivery Verification

### 5.1 Nodemailer Ethereal Sandbox Inspection Protocol
When running in development (`NODE_ENV=development` with no production SMTP configured):
1. **Transporter Initialization**:
   * Nodemailer dynamically calls `nodemailer.createTestAccount()`.
   * Credentials logged in server startup debug log.
2. **Dispatch & Capture**:
   * Every email dispatch returns an `info` object.
   * Server outputs:  
     `📧 [Ethereal Sandbox] Preview Verification Email: https://ethereal.email/message/WaQKMgK...`
3. **Inspector Validation Rules**:
   * Developer opens preview URL in browser.
   * Verify sender matches configured `EMAIL_FROM`.
   * Verify recipient matches target `user.email`.
   * Click verification button; verify browser redirects to `${CLIENT_URL}/verify-email/${rawToken}`.
   * Inspect HTML rendering: Verify button styling, typography, Sylo branding, and absence of raw template placeholders (`undefined`, `NaN`).

---

## 6. Manual E2E Validation Runbook (Curl & REST Client)

Follow this manual protocol to verify the end-to-end user journey from scratch.

### Step 1: Clean Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Vance",
    "username": "alexvance",
    "email": "alex.vance@example.com",
    "password": "SecurePassword123!"
  }'
```
* **Expected Output**: HTTP 201 Created. Console displays Ethereal preview link for Verification Email. Copy the 64-char token from the URL.

### Step 2: Attempt Login While Unverified
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "alexvance",
    "password": "SecurePassword123!"
  }'
```
* **Expected Output**: HTTP 403 Forbidden (`Account email address has not been verified`).

### Step 3: Verify Email
```bash
curl -X GET http://localhost:5000/api/auth/verify-email/<PASTE_TOKEN_HERE>
```
* **Expected Output**: HTTP 200 OK (`Email address verified successfully`). Console displays Ethereal preview link for Welcome Email.

### Step 4: Login Post-Verification
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "alexvance",
    "password": "SecurePassword123!"
  }'
```
* **Expected Output**: HTTP 200 OK. Body contains JWT token (`data.token`). Copy the token string.

### Step 5: Access Protected Profile (`/me`)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <PASTE_JWT_TOKEN_HERE>"
```
* **Expected Output**: HTTP 200 OK returning `name`, `username`, `email`, and `isVerified: true`.

### Step 6: Trigger Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.vance@example.com"
  }'
```
* **Expected Output**: HTTP 200 OK. Console outputs Ethereal preview link for Password Reset. Copy the reset token.

### Step 7: Submit New Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password/<PASTE_RESET_TOKEN_HERE> \
  -H "Content-Type: application/json" \
  -d '{
    "password": "BrandNewPassword789!",
    "confirmPassword": "BrandNewPassword789!"
  }'
```
* **Expected Output**: HTTP 200 OK (`Password reset successful`).

### Step 8: Confirm Old Password Fails and New Password Succeeds
```bash
# Old Password -> Expected 401
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "login": "alexvance", "password": "SecurePassword123!" }'

# New Password -> Expected 200
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "login": "alexvance", "password": "BrandNewPassword789!" }'
```

---

## 7. Phase 1 Exit Sign-Off Checklist (Team Lead Gate)

Before the team begins **Phase 2 (Core REST API & Project-Task Engine)**, the Lead Systems Architect must review and check off every item:

- [ ] **Mongoose User Model**: Schema enforces unique lowercase `username` and `email`, password hashing, and token fields.
- [ ] **Password Security**: Bcrypt uses 10+ salt rounds; password field is excluded from queries by default (`select: false`).
- [ ] **Email Verification Gate**: Unverified users receive HTTP 403 upon login attempt; verified users receive signed JWT.
- [ ] **Transactional Email Pipeline**: Nodemailer sends verification, welcome, and password-reset emails using Sylo HTML templates.
- [ ] **Password Reset Resilience**: Reset tokens expire in 1 hour; tokens are single-use; password history invalidates old hash.
- [ ] **Structured Error Envelope**: All error responses return `{ success: false, message, errors: [...] }`.
- [ ] **Automated Test Results**: All unit and integration test suites pass with 100% success rate (`npm test`).
- [ ] **Manual Runbook Passed**: Steps 1 through 8 completed successfully in the development environment.
- [ ] **No Hardcoded Secrets**: All keys, ports, secrets, and URLs isolated in `.env` and `.env.example`.
