const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();
const app = require('../server');

let user1Token, user2Token, adminToken;
let user1Id, user2Id;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  await new Promise(resolve => setTimeout(resolve, 2000));
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

describe('AUTH TESTS', () => {

  // ── REGISTER ──────────────────────────────────────────
  describe('POST /api/auth/register', () => {

    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Manish Kumar',
        email: `manish_${Date.now()}@test.com`,
        password: 'test123456',
        role: 'user',
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('user');
      user1Token = res.body.token;
      user1Id = res.body.user.id;
    });

    it('should register second user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Sarah Wilson',
        email: `sarah_${Date.now()}@test.com`,
        password: 'test123456',
        role: 'user',
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      user2Token = res.body.token;
      user2Id = res.body.user.id;
    });

    it('should register admin successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Admin User',
        email: `admin_${Date.now()}@test.com`,
        password: 'admin123456',
        role: 'admin',
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.token;
    });

    it('should NOT register with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'notanemail',
        password: 'test123456',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT register with short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@test.com',
        password: '123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT register with invalid role', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: `roletest_${Date.now()}@test.com`,
        password: 'test123456',
        role: 'superadmin',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT register with missing name', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: `noname_${Date.now()}@test.com`,
        password: 'test123456',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

  });

  // ── LOGIN ──────────────────────────────────────────────
  describe('POST /api/auth/login', () => {

    it('should login with valid credentials', async () => {
      // Register fresh user for login test
      const email = `logintest_${Date.now()}@test.com`;
      await request(app).post('/api/auth/register').send({
        name: 'Login Test', email, password: 'test123456',
      });

      const res = await request(app).post('/api/auth/login').send({
        email, password: 'test123456',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(email);
    });

    it('should NOT login with wrong password', async () => {
      const email = `wrongpw_${Date.now()}@test.com`;
      await request(app).post('/api/auth/register').send({
        name: 'Wrong PW', email, password: 'correctpassword',
      });

      const res = await request(app).post('/api/auth/login').send({
        email, password: 'wrongpassword',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should NOT login with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'doesnotexist99999@test.com',
        password: 'test123456',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should NOT login without email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        password: 'test123456',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT login without password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

  });

  // ── GET PROFILE ───────────────────────────────────────
  describe('GET /api/auth/me', () => {

    it('should get profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
    });

    it('should DENY access without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should DENY with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

  });

  // ── UPDATE PROFILE ────────────────────────────────────
  describe('PUT /api/auth/update-profile', () => {

    it('should update profile successfully', async () => {
      const res = await request(app)
        .put('/api/auth/update-profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Manish Updated', phone: '021123456' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Manish Updated');
    });

    it('should NOT update with short name', async () => {
      const res = await request(app)
        .put('/api/auth/update-profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'A' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT update without auth', async () => {
      const res = await request(app)
        .put('/api/auth/update-profile')
        .send({ name: 'No Auth User' });
      expect(res.statusCode).toBe(401);
    });

  });

  // ── CHANGE PASSWORD ───────────────────────────────────
  describe('PUT /api/auth/change-password', () => {

    it('should change password successfully', async () => {
      // Register fresh user
      const email = `changepw_${Date.now()}@test.com`;
      const regRes = await request(app).post('/api/auth/register').send({
        name: 'PW Change User', email, password: 'oldpassword123',
      });
      const token = regRes.body.token;

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'oldpassword123', newPassword: 'newpassword456' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should NOT change with wrong current password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ currentPassword: 'wrongcurrent', newPassword: 'newpassword456' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should NOT change with short new password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ currentPassword: 'test123456', newPassword: '123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

  });

});

module.exports = { getUserTokens: () => ({ user1Token, user2Token, adminToken, user1Id, user2Id }) };