const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();
const app = require('../server');

let ownerToken, tenantToken, adminToken;
let propertyId, bookingId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Register owner
  const owner = await request(app).post('/api/auth/register').send({
    name: 'Booking Owner',
    email: `bkowner_${Date.now()}@test.com`,
    password: 'test123456', role: 'user',
  });
  ownerToken = owner.body.token;

  // Register tenant
  const tenant = await request(app).post('/api/auth/register').send({
    name: 'Booking Tenant',
    email: `bktenant_${Date.now()}@test.com`,
    password: 'test123456', role: 'user',
  });
  tenantToken = tenant.body.token;

  // Register admin
  const admin = await request(app).post('/api/auth/register').send({
    name: 'Booking Admin',
    email: `bkadmin_${Date.now()}@test.com`,
    password: 'test123456', role: 'admin',
  });
  adminToken = admin.body.token;

  // Create property as owner
  const prop = await request(app)
    .post('/api/properties')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      title: 'Booking Test Property',
      description: 'Property for booking tests',
      address: '99 Test Lane',
      city: 'Auckland',
      rentPerWeek: 450,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'apartment',
    });
  propertyId = prop.body.property._id;

}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

describe('BOOKING TESTS', () => {

  // ── CREATE BOOKING ────────────────────────────────────
  describe('POST /api/bookings', () => {

    it('should create a booking request successfully', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId,
          preferredDate: '2026-09-15',
          message: 'I am very interested in this property!',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toBe('pending');
      bookingId = res.body.booking._id;
    });

    it('should NOT allow booking own property', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          propertyId,
          preferredDate: '2026-09-20',
          message: 'Trying to book own property',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('You cannot book your own property!');
    });

    it('should NOT create duplicate pending booking', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId,
          preferredDate: '2026-10-01',
          message: 'Second booking attempt',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT book without authentication', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ propertyId, preferredDate: '2026-09-15' });
      expect(res.statusCode).toBe(401);
    });

    it('should NOT book without date', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ propertyId });
      expect(res.statusCode).toBe(400);
    });

    it('should NOT book non-existent property', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ propertyId: fakeId, preferredDate: '2026-09-15' });
      expect(res.statusCode).toBe(404);
    });

  });

  // ── GET MY BOOKINGS ───────────────────────────────────
  describe('GET /api/bookings/my-bookings', () => {

    it('should get tenant my-bookings', async () => {
      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${tenantToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.bookings)).toBe(true);
      expect(res.body.bookings.length).toBeGreaterThan(0);
    });

    it('should NOT get bookings without auth', async () => {
      const res = await request(app).get('/api/bookings/my-bookings');
      expect(res.statusCode).toBe(401);
    });

  });

  // ── GET OWNER REQUESTS ────────────────────────────────
  describe('GET /api/bookings/requests', () => {

    it('should get owner booking requests', async () => {
      const res = await request(app)
        .get('/api/bookings/requests')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bookings.length).toBeGreaterThan(0);
    });

    it('should NOT get requests without auth', async () => {
      const res = await request(app).get('/api/bookings/requests');
      expect(res.statusCode).toBe(401);
    });

  });

  // ── UPDATE BOOKING STATUS ─────────────────────────────
  describe('PUT /api/bookings/:id/status', () => {

    it('should approve booking as owner', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'approved', ownerNote: 'Please come at 10am sharp!' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toBe('approved');
    });

    it('should NOT allow tenant to approve booking', async () => {
      // Create new booking for this test
      const newProp = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Reject Test Property',
          description: 'For reject test',
          address: '77 Reject St',
          city: 'Wellington',
          rentPerWeek: 380,
          bedrooms: 1,
          bathrooms: 1,
        });

      const newBook = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ propertyId: newProp.body.property._id, preferredDate: '2026-10-15' });

      if (newBook.body.booking) {
        const res = await request(app)
          .put(`/api/bookings/${newBook.body.booking._id}/status`)
          .set('Authorization', `Bearer ${tenantToken}`)
          .send({ status: 'approved' });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('should allow tenant to cancel booking', async () => {
      // Create fresh property + booking
      const freshProp = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Cancel Test Property',
          description: 'For cancel test',
          address: '88 Cancel Ave',
          city: 'Hamilton',
          rentPerWeek: 320,
          bedrooms: 2,
          bathrooms: 1,
        });

      const freshBook = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ propertyId: freshProp.body.property._id, preferredDate: '2026-11-10' });

      if (freshBook.body.booking) {
        const res = await request(app)
          .put(`/api/bookings/${freshBook.body.booking._id}/status`)
          .set('Authorization', `Bearer ${tenantToken}`)
          .send({ status: 'cancelled' });
        expect(res.statusCode).toBe(200);
        expect(res.body.booking.status).toBe('cancelled');
      }
    });

    it('should reject booking as owner', async () => {
      // Create property + booking for rejection
      const rejProp = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Reject Property',
          description: 'For rejection test',
          address: '55 Reject Rd',
          city: 'Tauranga',
          rentPerWeek: 490,
          bedrooms: 3,
          bathrooms: 2,
        });

      const rejBook = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ propertyId: rejProp.body.property._id, preferredDate: '2026-12-01' });

      if (rejBook.body.booking) {
        const res = await request(app)
          .put(`/api/bookings/${rejBook.body.booking._id}/status`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ status: 'rejected', ownerNote: 'Not available at that time.' });
        expect(res.statusCode).toBe(200);
        expect(res.body.booking.status).toBe('rejected');
      }
    });

    it('should NOT update non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/bookings/${fakeId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'approved' });
      expect(res.statusCode).toBe(404);
    });

  });

  // ── ADMIN GET ALL BOOKINGS ────────────────────────────
  describe('GET /api/bookings (admin)', () => {

    it('should get all bookings as admin', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.bookings)).toBe(true);
    });

    it('should NOT get all bookings as regular user', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`);
      expect(res.statusCode).toBe(403);
    });

  });

});