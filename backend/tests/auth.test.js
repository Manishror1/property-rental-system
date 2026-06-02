const request = require('supertest');
const mongoose = require('mongoose');

require('dotenv').config();

const app = require('../server');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

describe('AUTH TESTS', () => {

  describe('POST /api/auth/register', () => {

    it('should register a new tenant successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Tenant',
          email: `tenant_${Date.now()}@test.com`,
          password: 'test123456',
          role: 'tenant',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('tenant');
    });

    it('should register a new owner successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Owner',
          email: `owner_${Date.now()}@test.com`,
          password: 'test123456',
          role: 'owner',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('owner');
    });

    it('should NOT register with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad User',
          email: 'not-valid-email',
          password: 'test123456',
          role: 'tenant',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT register with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'shortpass@test.com',
          password: '123',
          role: 'tenant',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT register with duplicate email', async () => {
      const email = `dup_${Date.now()}@test.com`;
      await request(app).post('/api/auth/register').send({
        name: 'First', email, password: 'test123456', role: 'tenant',
      });
      const res = await request(app).post('/api/auth/register').send({
        name: 'Second', email, password: 'test123456', role: 'tenant',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email already registered.');
    });

  });

  describe('POST /api/auth/login', () => {
    const testEmail = `login_${Date.now()}@test.com`;

    beforeAll(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Login Tester', email: testEmail, password: 'test123456', role: 'tenant',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'test123456' });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should NOT login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should NOT login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'test123456' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should NOT login without email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123456' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

  });

  describe('GET /api/auth/me', () => {
    let authToken;
    const testEmail = `me_${Date.now()}@test.com`;

    beforeAll(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Me Tester', email: testEmail, password: 'test123456', role: 'tenant',
      });
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail, password: 'test123456',
      });
      authToken = res.body.token;
    });

    it('should get profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should DENY access without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('should DENY with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.statusCode).toBe(401);
    });

  });

});