const request = require('supertest');
const mongoose = require('mongoose');

// Server import se pehle env load karo
require('dotenv').config();

const app = require('../server');

let tenantToken;
let ownerToken;
let createdPropertyId;

beforeAll(async () => {
  // MongoDB connect karo
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  // Wait for connection
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Register tenant
  const tenantRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Property Test Tenant',
      email: `prop_tenant_${Date.now()}@test.com`,
      password: 'test123456',
      role: 'tenant',
    });
  tenantToken = tenantRes.body.token;

  // Register owner
  const ownerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Property Test Owner',
      email: `prop_owner_${Date.now()}@test.com`,
      password: 'test123456',
      role: 'owner',
    });
  ownerToken = ownerRes.body.token;

}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

describe('PROPERTY TESTS', () => {

  describe('POST /api/properties', () => {

    it('should create a property as owner', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Test House Auckland',
          description: 'A nice test property in Auckland city',
          address: '123 Test Street',
          city: 'Auckland',
          rentPerWeek: 500,
          bedrooms: 3,
          bathrooms: 2,
          propertyType: 'house',
          amenities: ['WiFi', 'Parking'],
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.property.title).toBe('Test House Auckland');
      createdPropertyId = res.body.property._id;
    });

    it('should NOT allow tenant to create property', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          title: 'Tenant Property',
          description: 'test description here',
          address: '456 Test Road',
          city: 'Wellington',
          rentPerWeek: 400,
          bedrooms: 2,
          bathrooms: 1,
        });
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should NOT create property without token', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ title: 'No Auth Property' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

  });

  describe('GET /api/properties', () => {

    it('should get all available properties', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.properties)).toBe(true);
    });

    it('should filter by city', async () => {
      const res = await request(app).get('/api/properties?city=Auckland');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter by bedrooms', async () => {
      const res = await request(app).get('/api/properties?bedrooms=3');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

  });

  describe('GET /api/properties/:id', () => {

    it('should get a property by valid ID', async () => {
      // Skip if property was not created
      if (!createdPropertyId) {
        console.log('Skipping: no property created');
        return;
      }
      const res = await request(app).get(`/api/properties/${createdPropertyId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent property', async () => {
      const res = await request(app).get('/api/properties/000000000000000000000000');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

  });

  describe('PUT /api/properties/:id', () => {

    it('should update property as owner', async () => {
      if (!createdPropertyId) return;
      const res = await request(app)
        .put(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rentPerWeek: 600 });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.property.rentPerWeek).toBe(600);
    });

    it('should NOT update property as tenant', async () => {
      if (!createdPropertyId) return;
      const res = await request(app)
        .put(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ rentPerWeek: 999 });
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

  });

  describe('DELETE /api/properties/:id', () => {

    it('should NOT delete property as tenant', async () => {
      if (!createdPropertyId) return;
      const res = await request(app)
        .delete(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${tenantToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should delete property as owner', async () => {
      if (!createdPropertyId) return;
      const res = await request(app)
        .delete(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

  });

});