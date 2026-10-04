const express = require('express');
const request = require('supertest');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../../middleware/validate');

const createTestApp = (validator) => {
  const app = express();
  app.use(express.json());
  app.post('/test', validator, (req, res) => {
    res.status(200).json({ success: true, data: req.body });
  });
  return app;
};

describe('Validation Middleware Unit Tests (TG-4)', () => {
  describe('registerValidator', () => {
    const app = createTestApp(registerValidator);

    it('VAL-01: should pass with completely valid registration payload', async () => {
      const res = await request(app)
        .post('/test')
        .send({
          name: 'Alex Vance',
          username: 'alexvance',
          email: 'alex.vance@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('VAL-02: should reject missing or short name', async () => {
      const res = await request(app)
        .post('/test')
        .send({
          name: 'A',
          username: 'alexvance',
          email: 'alex.vance@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('VAL-03: should reject invalid username with uppercase or special symbols', async () => {
      const res = await request(app)
        .post('/test')
        .send({
          name: 'Alex Vance',
          username: 'alex!vance',
          email: 'alex.vance@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'username')).toBe(true);
    });

    it('VAL-04: should reject invalid email format', async () => {
      const res = await request(app)
        .post('/test')
        .send({
          name: 'Alex Vance',
          username: 'alexvance',
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('VAL-05: should reject weak passwords lacking numbers or uppercase', async () => {
      const res = await request(app)
        .post('/test')
        .send({
          name: 'Alex Vance',
          username: 'alexvance',
          email: 'alex.vance@example.com',
          password: 'weakpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });
  });

  describe('loginValidator', () => {
    const app = createTestApp(loginValidator);

    it('VAL-06: should pass with valid login and password', async () => {
      const res = await request(app)
        .post('/test')
        .send({
          login: 'alexvance',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('VAL-07: should reject missing login or password', async () => {
      const res = await request(app)
        .post('/test')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('resetPasswordValidator', () => {
    const app = createTestApp(resetPasswordValidator);

    it('VAL-08: should reject mismatched password and confirmPassword', async () => {
      const res = await request(app)
        .post('/test')
        .send({
          password: 'Password123!',
          confirmPassword: 'DifferentPassword456!',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'confirmPassword')).toBe(true);
    });
  });
});
