import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup/db.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  // Dynamically import app after DB is connected to memory server
  const module = await import('../../backend/index.js');
  app = module.default;
}, 30000);

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('API Tests: User & Admin Authentication (/api/user)', () => {
  describe('POST /api/user/register', () => {
    test('TC-API-REG-01: Successfully register new customer with valid credentials', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({
          name: 'Pelanggan Baru',
          email: 'pelanggan@test.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.message).toMatch(/berhasil/i);
    });

    test('TC-API-REG-02: Rejects duplicate email registration with 400', async () => {
      // First registration
      await request(app)
        .post('/api/user/register')
        .send({
          name: 'Pelanggan 1',
          email: 'duplikat@test.com',
          password: 'password123'
        });

      // Duplicate attempt
      const res = await request(app)
        .post('/api/user/register')
        .send({
          name: 'Pelanggan Duplikat',
          email: 'duplikat@test.com',
          password: 'password456'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/sudah terdaftar/i);
    });

    test('TC-API-REG-03: Rejects invalid email format with 400', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({
          name: 'User Salah Email',
          email: 'email-tidak-valid',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid/i);
    });

    test('TC-API-REG-04: Rejects password under 8 characters with 400', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({
          name: 'User Password Pendek',
          email: 'pendek@test.com',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/minimal 8 karakter/i);
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      // Register customer account for testing login
      await request(app)
        .post('/api/user/register')
        .send({
          name: 'Customer Terdaftar',
          email: 'customer@test.com',
          password: 'password123'
        });
    });

    test('TC-API-LOG-01: Successfully login with registered customer email and password', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'customer@test.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    test('TC-API-LOG-02: Rejects wrong password with 400', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'customer@test.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/salah/i);
    });

    test('TC-API-LOG-03: Rejects non-existent email with 400', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'tidakada@test.com',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/salah/i);
    });
  });

  describe('POST /api/user/admin-login', () => {
    test('TC-API-ADM-01: Manager login returns manager role and token', async () => {
      const res = await request(app)
        .post('/api/user/admin-login')
        .send({
          email: 'manager@bujangcafe.com',
          password: 'manager12345'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('manager');
    });

    test('TC-API-ADM-02: Kasir login returns kasir role and token', async () => {
      const res = await request(app)
        .post('/api/user/admin-login')
        .send({
          email: 'kasir@bujangcafe.com',
          password: 'kasir12345'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('kasir');
    });

    test('TC-API-ADM-03: Rejects wrong admin password with 400', async () => {
      const res = await request(app)
        .post('/api/user/admin-login')
        .send({
          email: 'manager@bujangcafe.com',
          password: 'passwordsalah'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/salah/i);
    });

    test('TC-API-ADM-04: Rejects empty credentials with 400', async () => {
      const res = await request(app)
        .post('/api/user/admin-login')
        .send({
          email: '',
          password: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
