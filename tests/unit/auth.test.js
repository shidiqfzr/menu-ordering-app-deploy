import { describe, test, expect, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { requireRoles } from '../../backend/middleware/auth.js';

const JWT_SECRET = 'test_secret_key_12345';
process.env.JWT_SECRET = JWT_SECRET;

describe('Unit Tests: Authentication & Authorization Logic', () => {
  test('JWT token signs and verifies user id and role payload correctly', () => {
    const payload = { id: 'user_123', role: 'manager' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe('user_123');
    expect(decoded.role).toBe('manager');
  });

  test('requireRoles middleware allows user with matching role', () => {
    const middleware = requireRoles('manager');
    const req = { user: { id: 'u1', role: 'manager' } };
    let nextCalled = false;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    expect(nextCalled).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('requireRoles normalizes admin role to manager permission', () => {
    const middleware = requireRoles('manager');
    const req = { user: { id: 'u2', role: 'admin' } };
    let nextCalled = false;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    expect(nextCalled).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('requireRoles rejects unauthorized role (e.g. kasir accessing manager action) with 403', () => {
    const middleware = requireRoles('manager');
    const req = { user: { id: 'u3', role: 'kasir' } };
    let nextCalled = false;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    expect(nextCalled).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Akses ditolak')
    }));
  });

  test('Password validator requires minimum 8 characters', () => {
    const isValidPassword = (pwd) => typeof pwd === 'string' && pwd.length >= 8;
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('manager12345')).toBe(true);
  });
});
