import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup/db.js';

let app;
let managerToken;
let kasirToken;
let customerToken;

beforeAll(async () => {
  await connectTestDB();
  const module = await import('../../backend/index.js');
  app = module.default;
}, 30000);

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // 1. Manager login
  const mRes = await request(app)
    .post('/api/user/admin-login')
    .send({ email: 'manager@bujangcafe.com', password: 'manager12345' });
  managerToken = mRes.body.token;

  // 2. Kasir login
  const kRes = await request(app)
    .post('/api/user/admin-login')
    .send({ email: 'kasir@bujangcafe.com', password: 'kasir12345' });
  kasirToken = kRes.body.token;

  // 3. Customer register
  const cRes = await request(app)
    .post('/api/user/register')
    .send({ name: 'Customer Test', email: 'cust@test.com', password: 'password123' });
  customerToken = cRes.body.token;
});

describe('API Tests: Food Catalog & RBAC Security (/api/food)', () => {
  test('TC-API-FOOD-01: Public GET /api/food/list returns empty list when no items', async () => {
    const res = await request(app).get('/api/food/list');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('TC-API-FOOD-02: RBAC - Kasir role is blocked (403) from adding food (Manager-only)', async () => {
    const res = await request(app)
      .post('/api/food/add')
      .set('token', kasirToken)
      .send({
        name: 'Menu Baru',
        description: 'Enak',
        price: '25000',
        category: 'Makanan'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Akses ditolak/i);
  });

  test('TC-API-FOOD-03: RBAC - Customer role is blocked (403) from removing food', async () => {
    const res = await request(app)
      .post('/api/food/remove')
      .set('token', customerToken)
      .send({ id: 'any_id_123' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('TC-API-FOOD-04: Kasir can toggle food availability (Tersedia / Stok Habis)', async () => {
    // Directly insert food into database via foodModel
    const { default: foodModel } = await import('../../backend/models/foodModel.js');
    const food = await foodModel.create({
      name: 'Kopi Susu Gula Aren',
      description: 'Espresso dengan susu dan aren',
      price: '18000',
      image: 'kopi.jpg',
      category: 'Minuman',
      available: true
    });

    // Kasir toggles to false
    const toggleRes1 = await request(app)
      .post('/api/food/toggle-availability')
      .set('token', kasirToken)
      .send({ id: food._id, available: false });

    expect(toggleRes1.status).toBe(200);
    expect(toggleRes1.body.success).toBe(true);
    expect(toggleRes1.body.data.available).toBe(false);

    // Kasir toggles back to true
    const toggleRes2 = await request(app)
      .post('/api/food/toggle-availability')
      .set('token', kasirToken)
      .send({ id: food._id, available: true });

    expect(toggleRes2.status).toBe(200);
    expect(toggleRes2.body.success).toBe(true);
    expect(toggleRes2.body.data.available).toBe(true);
  });

  test('TC-API-FOOD-05: Manager can remove a food item', async () => {
    const { default: foodModel } = await import('../../backend/models/foodModel.js');
    const food = await foodModel.create({
      name: 'Menu Hapus',
      description: 'Akan dihapus',
      price: '10000',
      image: 'hapus.jpg',
      category: 'Makanan',
      available: true
    });

    const res = await request(app)
      .post('/api/food/remove')
      .set('token', managerToken)
      .send({ id: food._id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await foodModel.findById(food._id);
    expect(check).toBeNull();
  });
});
