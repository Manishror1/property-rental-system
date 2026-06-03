const request = require('supertest');
const mongoose = require('mongoose');

require('dotenv').config();
const app = require('../server');

let user1Token;  // property list karega
let user2Token;  // property book karega
let createdPropertyId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // User 1 — property list karega
  const user1Res = await request(app).post('/api/auth/register').send({
    name: 'Property Lister',
    email: `lister_${Date.now()}@test.com`,
    password: 'test123456',
    role: 'user',
  });
  user1Token = user1Res.body.token;

  // User 2 — property book karega
  const user2Res = await request(app).post('/api/auth/register').send({
    name: 'Property Booker',
    email: `booker_${Date.now()}@test.com`,
    password: 'test123456',
    role: 'user',
  });
  user2Token = user2Res.body.token;

}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

describe('PROPERTY TESTS', () => {

  describe('POST /api/properties', () => {

    it('should create a property as user', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test House Auckland',
          description: 'A nice test property in Auckland',
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
      createdPropertyId = res.body.property._id;
    });

    it('should NOT create property without token', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ title: 'No Auth Property' });
      expect(res.statusCode).toBe(401);
    });

  });

  describe('GET /api/properties', () => {

    it('should get all available properties', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.properties)).toBe(true);
    });

    it('should filter by city', async () => {
      const res = await request(app).get('/api/properties?city=Auckland');
      expect(res.statusCode).toBe(200);
    });

    it('should filter by bedrooms', async () => {
      const res = await request(app).get('/api/properties?bedrooms=3');
      expect(res.statusCode).toBe(200);
    });

  });

  describe('GET /api/properties/:id', () => {

    it('should get property by ID', async () => {
      if (!createdPropertyId) return;
      const res = await request(app).get(`/api/properties/${createdPropertyId}`);
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 for invalid ID', async () => {
      const res = await request(app).get('/api/properties/000000000000000000000000');
      expect(res.statusCode).toBe(404);
    });

  });

  describe('PUT /api/properties/:id', () => {

    it('should update property as owner', async () => {
      if (!createdPropertyId) return;
      const res = await request(app)
        .put(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ rentPerWeek: 600 });
      expect(res.statusCode).toBe(200);
      expect(res.body.property.rentPerWeek).toBe(600);
    });

    it('should NOT update property as different user', async () => {
      if (!createdPropertyId) return;
      const res = await request(app)
        .put(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ rentPerWeek: 999 });
      expect(res.statusCode).toBe(403);
    });

  });

  describe('DELETE /api/properties/:id', () => {

    it('should NOT delete as different user', async () => {
      if (!createdPropertyId) return;
      const res = await request(app)
        .delete(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.statusCode).toBe(403);
    });

    it('should delete as owner', async () => {
      if (!createdPropertyId) return;
      const res = await request(app)
        .delete(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toBe(200);
    });

  });

});