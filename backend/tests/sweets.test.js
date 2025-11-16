import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import sweetRoutes from '../routes/sweetRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import Sweet from '../models/sweetModel.js';
import User from '../models/userModel.js';
import { generateToken } from '../config/jwt.js';

// Create test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/sweets', sweetRoutes);

// Helper function to create a test user and get token
const createTestUser = async (role = 'user') => {
  const user = await User.create({
    username: `testuser_${Date.now()}_${Math.random()}`,
    password: 'password123',
    role,
  });
  // Ensure user is fully saved and persisted
  await user.save();
  // Reload user from database to ensure it's persisted
  const savedUser = await User.findById(user._id);
  if (!savedUser) {
    throw new Error('User was not saved properly');
  }
  const token = generateToken(savedUser);
  return { user: savedUser, token };
};

// Helper function to create a test sweet
const createTestSweet = async () => {
  return await Sweet.create({
    name: 'Test Sweet',
    category: 'Candy',
    price: 10.50,
    quantity: 100,
  });
};

describe('Sweet Routes', () => {
  let userToken;
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    // Create regular user
    const userData = await createTestUser('user');
    userToken = userData.token;

    // Create admin user
    const adminData = await createTestUser('admin');
    adminToken = adminData.token;
    adminUser = adminData.user;
  });

  describe('GET /api/sweets', () => {
    it('should get all sweets when authenticated', async () => {
      // Create some test sweets
      await createTestSweet();
      await Sweet.create({
        name: 'Another Sweet',
        category: 'Chocolate',
        price: 15.75,
        quantity: 50,
      });

      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('quantity');
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/sweets')
        .expect(401);
    });

    it('should return empty array if no sweets exist', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/sweets/search', () => {
    beforeEach(async () => {
      // Create test sweets
      await Sweet.create({ name: 'Chocolate Bar', category: 'Chocolate', price: 20, quantity: 10 });
      await Sweet.create({ name: 'Gummy Bears', category: 'Candy', price: 15, quantity: 20 });
      await Sweet.create({ name: 'Lollipop', category: 'Candy', price: 5, quantity: 30 });
    });

    it('should search sweets by name', async () => {
      const response = await request(app)
        .get('/api/sweets/search?name=Chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toContain('Chocolate');
    });

    it('should search sweets by category', async () => {
      const response = await request(app)
        .get('/api/sweets/search?category=Candy')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every(s => s.category.toLowerCase().includes('candy'))).toBe(true);
    });

    it('should search sweets by price range', async () => {
      const response = await request(app)
        .get('/api/sweets/search?minPrice=10&maxPrice=20')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every(s => s.price >= 10 && s.price <= 20)).toBe(true);
    });

    it('should return 400 if minPrice is greater than maxPrice', async () => {
      const response = await request(app)
        .get('/api/sweets/search?minPrice=20&maxPrice=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.message).toContain('minPrice cannot be greater than maxPrice');
    });

    it('should return 400 if minPrice is negative', async () => {
      const response = await request(app)
        .get('/api/sweets/search?minPrice=-10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.message).toContain('non-negative number');
    });

    it('should return all sweets if no search parameters provided', async () => {
      const response = await request(app)
        .get('/api/sweets/search')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.length).toBe(3);
    });
  });

  describe('POST /api/sweets', () => {
    it('should create a new sweet as admin', async () => {
      const sweetData = {
        name: 'New Sweet',
        category: 'Candy',
        price: '12.50',
        quantity: '50',
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', sweetData.name)
        .field('category', sweetData.category)
        .field('price', sweetData.price)
        .field('quantity', sweetData.quantity)
        .expect(201);

      expect(response.body.name).toBe(sweetData.name);
      expect(response.body.category).toBe(sweetData.category);
      expect(response.body.price).toBe(12.50);
      expect(response.body.quantity).toBe(50);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Test Sweet')
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should return 400 if price is negative', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Test Sweet')
        .field('category', 'Candy')
        .field('price', '-10')
        .field('quantity', '10')
        .expect(400);

      expect(response.body.message).toContain('non-negative');
    });

    it('should return 400 if quantity is not an integer', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Test Sweet')
        .field('category', 'Candy')
        .field('price', '10')
        .field('quantity', '10.5')
        .expect(400);

      expect(response.body.message).toContain('integer');
    });

    it('should return 409 if sweet name already exists', async () => {
      await createTestSweet();

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Test Sweet')
        .field('category', 'Candy')
        .field('price', '10')
        .field('quantity', '10')
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/sweets')
        .field('name', 'Test Sweet')
        .field('category', 'Candy')
        .field('price', '10')
        .field('quantity', '10')
        .expect(401);
    });
  });

  describe('PUT /api/sweets/:id', () => {
    let sweetId;

    beforeEach(async () => {
      const sweet = await createTestSweet();
      sweetId = sweet._id.toString();
    });

    it('should update a sweet as admin', async () => {
      const response = await request(app)
        .put(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Updated Sweet')
        .field('price', '15.75')
        .expect(200);

      expect(response.body.name).toBe('Updated Sweet');
      expect(response.body.price).toBe(15.75);
    });

    it('should return 404 if sweet not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/sweets/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Updated Sweet')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 if invalid ID format', async () => {
      const response = await request(app)
        .put('/api/sweets/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Updated Sweet')
        .expect(400);

      expect(response.body.message).toContain('Invalid sweet ID format');
    });

    it('should return 409 if updated name already exists', async () => {
      await Sweet.create({ name: 'Existing Sweet', category: 'Candy', price: 10, quantity: 10 });

      const response = await request(app)
        .put(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Existing Sweet')
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('DELETE /api/sweets/:id', () => {
    let sweetId;

    beforeEach(async () => {
      const sweet = await createTestSweet();
      sweetId = sweet._id.toString();
    });

    it('should delete a sweet as admin', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');

      // Verify sweet is deleted
      const deletedSweet = await Sweet.findById(sweetId);
      expect(deletedSweet).toBeNull();
    });

    it('should return 404 if sweet not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/sweets/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Admin access required');
    });

    it('should return 400 if invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/sweets/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid sweet ID format');
    });
  });

  describe('POST /api/sweets/:id/purchase', () => {
    let sweetId;

    beforeEach(async () => {
      const sweet = await createTestSweet();
      sweetId = sweet._id.toString();
    });

    it('should purchase a sweet and decrease quantity', async () => {
      const sweet = await Sweet.findById(sweetId);
      const initialQuantity = sweet.quantity;

      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.quantity).toBe(initialQuantity - 1);

      // Verify in database
      const updatedSweet = await Sweet.findById(sweetId);
      expect(updatedSweet.quantity).toBe(initialQuantity - 1);
    });

    it('should return 400 if sweet is out of stock', async () => {
      // Set quantity to 0
      await Sweet.findByIdAndUpdate(sweetId, { quantity: 0 });

      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.message).toContain('out of stock');
    });

    it('should return 404 if sweet not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/sweets/${fakeId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 if invalid ID format', async () => {
      const response = await request(app)
        .post('/api/sweets/invalid-id/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid sweet ID format');
    });
  });

  describe('POST /api/sweets/:id/restock', () => {
    let sweetId;

    beforeEach(async () => {
      const sweet = await createTestSweet();
      sweetId = sweet._id.toString();
    });

    it('should restock a sweet as admin', async () => {
      const sweet = await Sweet.findById(sweetId);
      const initialQuantity = sweet.quantity;
      const restockAmount = 50;

      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: restockAmount })
        .expect(200);

      expect(response.body.quantity).toBe(initialQuantity + restockAmount);

      // Verify in database
      const updatedSweet = await Sweet.findById(sweetId);
      expect(updatedSweet.quantity).toBe(initialQuantity + restockAmount);
    });

    it('should return 400 if amount is missing', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Amount is required');
    });

    it('should return 400 if amount is not a positive integer', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -10 })
        .expect(400);

      expect(response.body.message).toContain('positive integer');
    });

    it('should return 404 if sweet not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/sweets/${fakeId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 10 })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 10 })
        .expect(403);

      expect(response.body.message).toContain('Admin access required');
    });

    it('should return 400 if invalid ID format', async () => {
      const response = await request(app)
        .post('/api/sweets/invalid-id/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 10 })
        .expect(400);

      expect(response.body.message).toContain('Invalid sweet ID format');
    });
  });
});

