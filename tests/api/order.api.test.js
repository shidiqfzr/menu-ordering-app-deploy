import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup/db.js';

let app;
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

  // Register customer to get valid token
  const res = await request(app)
    .post('/api/user/register')
    .send({
      name: 'Budi Santoso',
      email: 'budi@test.com',
      password: 'password123'
    });

  customerToken = res.body.token;
});

describe('API Tests: Order Lifecycle & POS Management (/api/order)', () => {
  test('TC-API-ORD-01: Place manual/cash order returns orderId and M- invoice format', async () => {
    const orderData = {
      items: [
        { name: 'Kopi Bujang', price: 18000, quantity: 2 },
        { name: 'Roti Bakar', price: 15000, quantity: 1 }
      ],
      amount: 51000,
      tableNumber: '5',
      note: 'Gula sedikit',
      discount: 0
    };

    const res = await request(app)
      .post('/api/order/manual')
      .set('token', customerToken)
      .send(orderData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.invoiceNumber).toMatch(/^M-\d{8}-[0-9A-F]{4}$/);

    // Verify stored order details
    const orderCheck = await request(app).get(`/api/order/${res.body.orderId}`);
    expect(orderCheck.status).toBe(200);
    expect(orderCheck.body.success).toBe(true);
    expect(Number(orderCheck.body.order.tableNumber)).toBe(5);
    expect(orderCheck.body.order.status).toBe('Pending');
    expect(orderCheck.body.order.payment).toBe(false);
    expect(orderCheck.body.order.paymentMethod).toBe('Tunai');
  });

  test('TC-API-ORD-02: Place order with discount records correct amount and discount', async () => {
    const orderData = {
      items: [{ name: 'Nasi Goreng Spesial', price: 30000, quantity: 2 }],
      amount: 42000, // 60,000 - 30% MERDEKA discount (18,000)
      discount: 18000,
      tableNumber: '2',
      note: 'Pedas sedang'
    };

    const res = await request(app)
      .post('/api/order/manual')
      .set('token', customerToken)
      .send(orderData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await request(app).get(`/api/order/${res.body.orderId}`);
    expect(check.body.order.amount).toBe(42000);
    expect(check.body.order.discount).toBe(18000);
  });

  test('TC-API-ORD-03: Update order status workflow (Pending -> Dimasak -> Disajikan -> Selesai)', async () => {
    // 1. Create order
    const orderRes = await request(app)
      .post('/api/order/manual')
      .set('token', customerToken)
      .send({
        items: [{ name: 'Mie Goreng', price: 20000, quantity: 1 }],
        amount: 20000,
        tableNumber: '3'
      });

    const orderId = orderRes.body.orderId;
    expect(orderId).toBeDefined();

    // 2. Status: Dimasak (Kitchen preparing)
    const resDimasak = await request(app)
      .post('/api/order/status')
      .send({ orderId, status: 'Dimasak' });
    expect(resDimasak.status).toBe(200);
    expect(resDimasak.body.success).toBe(true);

    // 3. Status: Disajikan (Food served to table)
    const resDisajikan = await request(app)
      .post('/api/order/status')
      .send({ orderId, status: 'Disajikan' });
    expect(resDisajikan.status).toBe(200);
    expect(resDisajikan.body.success).toBe(true);

    // 4. Status: Selesai (Completed / Table cleared)
    const resSelesai = await request(app)
      .post('/api/order/status')
      .send({ orderId, status: 'Selesai' });
    expect(resSelesai.status).toBe(200);
    expect(resSelesai.body.success).toBe(true);

    const finalCheck = await request(app).get(`/api/order/${orderId}`);
    expect(finalCheck.body.order.status).toBe('Selesai');
  });

  test('TC-API-ORD-04: Confirm payment updates payment to true', async () => {
    // Create order
    const orderRes = await request(app)
      .post('/api/order/manual')
      .set('token', customerToken)
      .send({
        items: [{ name: 'Es Kopi Susu', price: 20000, quantity: 1 }],
        amount: 20000,
        tableNumber: '7'
      });

    const orderId = orderRes.body.orderId;

    // Confirm payment (Cashier received cash)
    const payRes = await request(app)
      .post('/api/order/payment')
      .send({ orderId, payment: true });

    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.message).toMatch(/berhasil/i);

    const check = await request(app).get(`/api/order/${orderId}`);
    expect(check.body.order.payment).toBe(true);
  });

  test('TC-API-ORD-05: Fetch user orders returns order history for authenticated customer', async () => {
    // Place 2 orders for this customer
    await request(app)
      .post('/api/order/manual')
      .set('token', customerToken)
      .send({
        items: [{ name: 'Kopi Hitam', price: 12000, quantity: 1 }],
        amount: 12000,
        tableNumber: '1'
      });

    await request(app)
      .post('/api/order/manual')
      .set('token', customerToken)
      .send({
        items: [{ name: 'Kentang Goreng', price: 15000, quantity: 1 }],
        amount: 15000,
        tableNumber: '1'
      });

    const historyRes = await request(app)
      .post('/api/order/userorders')
      .set('token', customerToken)
      .send({});

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.success).toBe(true);
    expect(Array.isArray(historyRes.body.data)).toBe(true);
    expect(historyRes.body.data.length).toBe(2);
  });

  test('TC-API-ORD-06: Kosongkan Meja workflow marks all active dining orders for table as Selesai', async () => {
    // Table 4 has 2 dining orders with status 'Disajikan'
    const order1 = await request(app)
      .post('/api/order/manual')
      .set('token', customerToken)
      .send({ items: [{ name: 'Food A', price: 20000, quantity: 1 }], amount: 20000, tableNumber: '4' });
    
    const order2 = await request(app)
      .post('/api/order/manual')
      .set('token', customerToken)
      .send({ items: [{ name: 'Food B', price: 25000, quantity: 1 }], amount: 25000, tableNumber: '4' });

    const id1 = order1.body.orderId;
    const id2 = order2.body.orderId;

    // Both served
    await request(app).post('/api/order/status').send({ orderId: id1, status: 'Disajikan' });
    await request(app).post('/api/order/status').send({ orderId: id2, status: 'Disajikan' });

    // Kosongkan Meja: admin marks all orders for table 4 as Selesai
    const complete1 = await request(app).post('/api/order/status').send({ orderId: id1, status: 'Selesai' });
    const complete2 = await request(app).post('/api/order/status').send({ orderId: id2, status: 'Selesai' });

    expect(complete1.body.success).toBe(true);
    expect(complete2.body.success).toBe(true);

    // Verify order statuses
    const listRes = await request(app).get('/api/order/list');
    expect(listRes.body.success).toBe(true);
    const updatedOrder1 = listRes.body.data.find(o => o._id === id1);
    const updatedOrder2 = listRes.body.data.find(o => o._id === id2);
    expect(updatedOrder1.status).toBe('Selesai');
    expect(updatedOrder2.status).toBe('Selesai');
  });
});
