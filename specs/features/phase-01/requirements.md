# Phase 1 Technical Specification: Requirements & API Contracts
## Database Foundation, Authentication & Notification Engine

**Project**: Sylo (Project & Task Management App)  
**Phase**: Phase 1  
**Status**: Approved Specification  
**Version**: 1.0  
**PRD Traceability**: FR-01 through FR-08, BR-16, AC-01, AC-02, Section 10 (Non-Functional Requirements)  

---

## 1. Domain Model Specification: User Entity

The `User` model is the foundational identity record for Sylo. It encapsulates credential management, profile metadata, email verification state, and time-limited security tokens.

### 1.1 Data Schema Dictionary

| Field Name | Type | Required | Constraints & Indexing | Default | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Primary Key (BSON ObjectId) | Auto | Unique document identifier. |
| `name` | `String` | Yes | Trimmed, 2–100 characters | None | Full personal or company display name. |
| `username` | `String` | Yes | Unique, Lowercase, Trimmed, 3–20 chars, Regex: `^[a-z0-9_-]{3,20}$` | None | Unique system handle used for collaborator invitations (FR-02, BR-16). Indexed uniquely. |
| `email` | `String` | Yes | Unique, Lowercase, Trimmed, Valid RFC 5322 Email regex | None | Primary communication & login identity. Indexed uniquely. |
| `password` | `String` | Yes | Min 8 chars, hashed via `bcryptjs` (salt 10), `select: false` | None | Hashed password credential. Never exposed in API queries. |
| `isVerified` | `Boolean` | Yes | Boolean flag | `false` | Gatekeeper flag for authentication access (FR-04). |
| `verificationToken` | `String` | No | SHA-256 Hex Hash (64 chars), Sparse Index | `null` | Cryptographic hash of the email verification token. |
| `verificationExpires`| `Date` | No | Timestamp | `null` | Expiration deadline for email verification (24 hours). |
| `resetPasswordToken` | `String` | No | SHA-256 Hex Hash (64 chars), Sparse Index | `null` | Cryptographic hash of the password reset token. |
| `resetPasswordExpires`| `Date` | No | Timestamp | `null` | Expiration deadline for password reset (1 hour). |
| `createdAt` | `Date` | Auto | Managed by Mongoose `timestamps: true` | Auto | Record creation timestamp. |
| `updatedAt` | `Date` | Auto | Managed by Mongoose `timestamps: true` | Auto | Record last modification timestamp. |

---

### 1.2 Exact Mongoose Schema Implementation (`server/models/User.js`)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name or company name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [
      /^[a-z0-9_-]{3,20}$/,
      'Username may only contain lowercase letters, numbers, underscores, and hyphens'
    ],
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email address'
    ],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Strict protection: excluded from queries by default
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null,
    select: false
  },
  verificationExpires: {
    type: Date,
    default: null,
    select: false
  },
  resetPasswordToken: {
    type: String,
    default: null,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
    select: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.verificationToken;
      delete ret.verificationExpires;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save hook: Hash password prior to storage if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method: Verify candidate password against stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Generate and hash email verification token (24h lifespan)
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return rawToken;
};

// Instance method: Generate and hash password reset token (1h lifespan)
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return rawToken;
};

module.exports = mongoose.model('User', userSchema);
```

---

## 2. Global API Standards & Envelope Structure

All responses from the `/api/auth` subsystem conform to a uniform envelope format (FR-38, Section 10).

### 2.1 Standard Success Envelope (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Human-readable summary of successful action",
  "data": { ... }
}
```

### 2.2 Standard Error Envelope (HTTP 400 / 401 / 403 / 404 / 429 / 500)
```json
{
  "success": false,
  "message": "Primary error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is already in use by another account"
    }
  ]
}
```

---

## 3. Authentication REST API Contracts

Base Endpoint Prefix: `/api/auth`

```
POST   /api/auth/register               Register account & dispatch verification email
GET    /api/auth/verify-email/:token    Verify email token, activate account & dispatch welcome email
POST   /api/auth/resend-verification    Resend verification email to unverified user
POST   /api/auth/login                  Authenticate credentials & issue JWT session
GET    /api/auth/me                     Retrieve current authenticated user profile
POST   /api/auth/forgot-password        Request password reset link via email
POST   /api/auth/reset-password/:token  Submit new password using token
```

---

### Endpoint 1: Register User
* **Purpose**: Creates an inactive user account, hashes credentials, generates a 24-hour verification token, and dispatches a verification email.
* **PRD Mapping**: FR-01, FR-02, FR-03, BR-16, AC-01
* **Method**: `POST`
* **Route**: `/api/auth/register`
* **Auth**: Public (None)
* **Headers**: `Content-Type: application/json`

#### Request Payload
```json
{
  "name": "Alex Chen",
  "username": "alexchen",
  "email": "alex.chen@example.com",
  "password": "Password123!"
}
```

#### Validation Rules (`express-validator`)
* `name`: string, required, trimmed, length 2–100.
* `username`: string, required, trimmed, lowercase, 3–20 chars, regex `^[a-z0-9_-]{3,20}$`. Must be unique in database.
* `email`: string, required, trimmed, lowercase, valid email syntax. Must be unique in database.
* `password`: string, required, min 8 chars, must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit.

#### Response: 201 Created
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "userId": "6700c8f5e7149a4e9b9c0001",
    "username": "alexchen",
    "email": "alex.chen@example.com",
    "isVerified": false
  }
}
```

#### Response: 400 Bad Request (Validation Failure / Duplicate Conflict)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username is already taken"
    }
  ]
}
```

---

### Endpoint 2: Verify Email Address
* **Purpose**: Validates the SHA-256 hash of the verification token, checks expiration, transitions `isVerified` to `true`, nullifies token fields, and dispatches a welcome confirmation email.
* **PRD Mapping**: FR-04, FR-05, AC-01
* **Method**: `GET`
* **Route**: `/api/auth/verify-email/:token`
* **Auth**: Public (None)
* **URL Parameters**:
  * `token`: 64-character raw hex string received via email link.

#### Response: 200 OK
```json
{
  "success": true,
  "message": "Email address verified successfully. Your account is now active.",
  "data": {
    "userId": "6700c8f5e7149a4e9b9c0001",
    "username": "alexchen",
    "email": "alex.chen@example.com",
    "isVerified": true
  }
}
```

#### Response: 400 Bad Request (Invalid or Expired Token)
```json
{
  "success": false,
  "message": "Verification link is invalid or has expired. Please request a new verification link.",
  "errors": []
}
```

---

### Endpoint 3: Resend Verification Email
* **Purpose**: Generates a fresh verification token and dispatches a new email if the user is unverified.
* **PRD Mapping**: FR-03, FR-04
* **Method**: `POST`
* **Route**: `/api/auth/resend-verification`
* **Auth**: Public (None)
* **Headers**: `Content-Type: application/json`

#### Request Payload
```json
{
  "email": "alex.chen@example.com"
}
```

#### Response: 200 OK
```json
{
  "success": true,
  "message": "If the account exists and is unverified, a new verification link has been sent.",
  "data": null
}
```

---

### Endpoint 4: User Login
* **Purpose**: Validates credentials, verifies active email status (`isVerified === true`), and issues a signed JSON Web Token (JWT).
* **PRD Mapping**: FR-04, FR-06, FR-07, AC-01
* **Method**: `POST`
* **Route**: `/api/auth/login`
* **Auth**: Public (None)
* **Headers**: `Content-Type: application/json`

#### Request Payload
```json
{
  "login": "alexchen", // Supports either username or email
  "password": "Password123!"
}
```

#### Validation Rules
* `login`: string, required, trimmed.
* `password`: string, required.

#### Response: 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6700c8f5e7149a4e9b9c0001",
      "name": "Alex Chen",
      "username": "alexchen",
      "email": "alex.chen@example.com",
      "isVerified": true,
      "createdAt": "2026-10-04T12:00:00.000Z"
    }
  }
}
```

#### Response: 401 Unauthorized (Invalid Credentials)
```json
{
  "success": false,
  "message": "Invalid email/username or password",
  "errors": []
}
```

#### Response: 403 Forbidden (Unverified Email)
```json
{
  "success": false,
  "message": "Your email address has not been verified. Please verify your email before logging in.",
  "errors": [
    {
      "field": "isVerified",
      "message": "Email unverified"
    }
  ]
}
```

---

### Endpoint 5: Get Authenticated User Profile (`/me`)
* **Purpose**: Validates Bearer JWT token from header and returns current user details.
* **PRD Mapping**: FR-07
* **Method**: `GET`
* **Route**: `/api/auth/me`
* **Auth**: Protected (Requires `Bearer <token>`)
* **Headers**:
  * `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Response: 200 OK
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "6700c8f5e7149a4e9b9c0001",
      "name": "Alex Chen",
      "username": "alexchen",
      "email": "alex.chen@example.com",
      "isVerified": true,
      "createdAt": "2026-10-04T12:00:00.000Z"
    }
  }
}
```

#### Response: 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. Authentication token missing or invalid.",
  "errors": []
}
```

---

### Endpoint 6: Forgot Password Request
* **Purpose**: Generates a 1-hour password reset token and sends an email with the reset link.
* **PRD Mapping**: FR-08, AC-02
* **Method**: `POST`
* **Route**: `/api/auth/forgot-password`
* **Auth**: Public (None)
* **Headers**: `Content-Type: application/json`

#### Request Payload
```json
{
  "email": "alex.chen@example.com"
}
```

#### Response: 200 OK (Always returns success to prevent user enumeration)
```json
{
  "success": true,
  "message": "If that email address is registered, a password reset link has been dispatched.",
  "data": null
}
```

---

### Endpoint 7: Reset Password
* **Purpose**: Validates the reset token and expiration, hashes the new password, clears the reset token fields, and updates the user record.
* **PRD Mapping**: FR-08, AC-02
* **Method**: `POST`
* **Route**: `/api/auth/reset-password/:token`
* **Auth**: Public (None)
* **Headers**: `Content-Type: application/json`
* **URL Parameters**:
  * `token`: 64-character raw hex string received via email link.

#### Request Payload
```json
{
  "password": "NewStrongPassword456!",
  "confirmPassword": "NewStrongPassword456!"
}
```

#### Validation Rules
* `password`: string, required, min 8 chars, must contain 1 uppercase letter, 1 lowercase letter, 1 digit.
* `confirmPassword`: string, required, must strictly match `password`.

#### Response: 200 OK
```json
{
  "success": true,
  "message": "Password reset successful. You may now log in with your new credentials.",
  "data": null
}
```

#### Response: 400 Bad Request (Invalid/Expired Token or Password Mismatch)
```json
{
  "success": false,
  "message": "Password reset token is invalid or has expired.",
  "errors": []
}
```

---

## 4. Transactional Email Delivery Contracts (Nodemailer)

All transactional emails utilize HTML formatting aligned with the Sylo brand tokens (Primary: `#0052ff`, Background: `#f8f9ff`, Text: `#0b1c30`).

### 4.1 Email Verification Contract
* **Trigger**: Immediately upon successful execution of `POST /api/auth/register` or `resend-verification`.
* **Subject**: `Verify your Sylo account`
* **Recipient**: `user.email`
* **Variables**: `user.name`, `verifyUrl` (`${CLIENT_URL}/verify-email/${rawToken}`)
* **Token Expiry**: 24 hours.

### 4.2 Welcome Confirmation Contract
* **Trigger**: Immediately upon successful execution of `GET /api/auth/verify-email/:token`.
* **Subject**: `Welcome to Sylo — Account Activated!`
* **Recipient**: `user.email`
* **Variables**: `user.name`, `loginUrl` (`${CLIENT_URL}/login`)

### 4.3 Password Reset Contract
* **Trigger**: Upon successful request to `POST /api/auth/forgot-password` (for existing registered email).
* **Subject**: `Reset your Sylo password`
* **Recipient**: `user.email`
* **Variables**: `user.name`, `resetUrl` (`${CLIENT_URL}/reset-password/${rawToken}`)
* **Token Expiry**: 1 hour.
