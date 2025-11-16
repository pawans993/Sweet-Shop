import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import User from '../models/userModel.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {
  // Test data
  const validUser = {
    username: 'testuser',
    password: 'password123',
  };

  const adminUser = {
    username: 'adminuser',
    password: 'password123',
    role: 'admin',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(validUser.username);
      expect(response.body.user.role).toBe('user');
    });

    it('should register a new admin user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(adminUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('admin');
    });

    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should return 400 if username is too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123' })
        .expect(400);

      expect(response.body.message).toContain('at least 3 characters');
    });

    it('should return 400 if password is too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '12345' })
        .expect(400);

      expect(response.body.message).toContain('at least 6 characters');
    });

    it('should return 400 if role is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123', role: 'invalid' })
        .expect(400);

      expect(response.body.message).toContain('Invalid role');
    });

    it('should return 409 if username already exists', async () => {
      // Create user first
      await User.create({
        username: validUser.username,
        password: validUser.password,
      });

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(409);

      expect(response.body.message).toContain('already taken');
    });

    it('should trim username whitespace', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: '  testuser  ', password: 'password123' })
        .expect(201);

      expect(response.body.user.username).toBe('testuser');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await User.create(validUser);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validUser)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(validUser.username);
    });

    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should return 401 if username does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password123' })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: validUser.username, password: 'wrongpassword' })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should trim username when logging in', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: '  testuser  ', password: validUser.password })
        .expect(200);

      expect(response.body.user.username).toBe(validUser.username);
    });
  });
});

