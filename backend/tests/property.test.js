const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();
const app = require('../server');

let user1Token, user2Token, adminToken;
let propertyId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Register users
  const u1 = await request(app).post('/api/auth/register').send({
    name: 'Property Owner',
    email: `propowner_${Date.now()}@test.com`,
    password: 'test123456', role: 'user',
  });
  user1Token = u1.body.token;

  const u2 = await request(app).post('/api/auth/register').send({
    name: 'Property Tenant',
    email: `proptenant_${Date.now()}@test.com`,
    password: 'test123456', role: 'user',
  });
  user2Token = u2.body.token;

  const a1 = await request(app).post('/api/auth/register').send({
    name: 'Property Admin',
    email: `propadmin_${Date.now()}@test.com`,
    password: 'test123456', role: 'admin',
  });
  adminToken = a1.body.token;

}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

describe('PROPERTY TESTS', () => {

  // ── CREATE ────────────────────────────────────────────
  describe('POST /api/properties', () => {

    it('should create a property as user', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Modern 3 Bedroom House Auckland',
          description: 'Beautiful house near city centre',
          address: '123 Queen Street',
          city: 'Auckland',
          rentPerWeek: 550,
          bedrooms: 3,
          bathrooms: 2,
          propertyType: 'house',
          amenities: ['WiFi', 'Parking'],
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.property.title).toBe('Modern 3 Bedroom House Auckland');
      propertyId = res.body.property._id;
    });

    it('should NOT create property without authentication', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ title: 'No Auth Property', city: 'Auckland', rentPerWeek: 500 });
      expect(res.statusCode).toBe(401);
    });

    it('should NOT create property without title', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          description: 'No title property',
          address: '456 Test St',
          city: 'Wellington',
          rentPerWeek: 400,
          bedrooms: 2,
          bathrooms: 1,
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should NOT create property without city', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'No City Property',
          description: 'Test desc',
          address: '456 Test St',
          rentPerWeek: 400,
          bedrooms: 2,
          bathrooms: 1,
        });
      expect(res.statusCode).toBe(400);
    });

    it('should NOT create property with zero rent', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Zero Rent Property',
          description: 'Test desc',
          address: '456 Test St',
          city: 'Auckland',
          rentPerWeek: 0,
          bedrooms: 2,
          bathrooms: 1,
        });
      expect(res.statusCode).toBe(400);
    });

  });

  // ── READ ALL ──────────────────────────────────────────
  describe('GET /api/properties', () => {

    it('should get all available properties', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.properties)).toBe(true);
    });

    it('should filter properties by city', async () => {
      const res = await request(app).get('/api/properties?city=Auckland');
      expect(res.statusCode).toBe(200);
      res.body.properties.forEach(p => {
        expect(p.city.toLowerCase()).toContain('auckland');
      });
    });

    it('should filter properties by bedrooms', async () => {
      const res = await request(app).get('/api/properties?bedrooms=3');
      expect(res.statusCode).toBe(200);
      res.body.properties.forEach(p => {
        expect(p.bedrooms).toBe(3);
      });
    });

    it('should filter by property type', async () => {
      const res = await request(app).get('/api/properties?propertyType=house');
      expect(res.statusCode).toBe(200);
      res.body.properties.forEach(p => {
        expect(p.propertyType).toBe('house');
      });
    });

  });

  // ── READ ONE ──────────────────────────────────────────
  describe('GET /api/properties/:id', () => {

    it('should get property by valid ID', async () => {
      const res = await request(app).get(`/api/properties/${propertyId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.property._id).toBe(propertyId);
    });

    it('should return 404 for non-existent property', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/properties/${fakeId}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

  });

  // ── GET MY LISTINGS ───────────────────────────────────
  describe('GET /api/properties/my-listings', () => {

    it('should get my listings with valid token', async () => {
      const res = await request(app)
        .get('/api/properties/my-listings')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.properties)).toBe(true);
    });

    it('should NOT get listings without token', async () => {
      const res = await request(app).get('/api/properties/my-listings');
      expect(res.statusCode).toBe(401);
    });

  });

  // ── UPDATE ────────────────────────────────────────────
  describe('PUT /api/properties/:id', () => {

    it('should update property as owner', async () => {
      const res = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ rentPerWeek: 600, title: 'Updated Auckland House' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.property.rentPerWeek).toBe(600);
    });

    it('should NOT update property as different user', async () => {
      const res = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ rentPerWeek: 999 });
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should NOT update property without auth', async () => {
      const res = await request(app)
        .put(`/api/properties/${propertyId}`)
        .send({ rentPerWeek: 100 });
      expect(res.statusCode).toBe(401);
    });

    it('should allow admin to update any property', async () => {
      const res = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Updated Property' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

  });

  // ── DELETE ────────────────────────────────────────────
  describe('DELETE /api/properties/:id', () => {

    it('should NOT delete property as different user', async () => {
      const res = await request(app)
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.statusCode).toBe(403);
    });

    it('should delete property as owner', async () => {
      // Create a new property to delete
      const createRes = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Property To Delete',
          description: 'Will be deleted',
          address: '999 Delete St',
          city: 'Christchurch',
          rentPerWeek: 300,
          bedrooms: 1,
          bathrooms: 1,
        });
      const deleteId = createRes.body.property._id;

      const res = await request(app)
        .delete(`/api/properties/${deleteId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should NOT delete without auth', async () => {
      const res = await request(app).delete(`/api/properties/${propertyId}`);
      expect(res.statusCode).toBe(401);
    });

  });

});