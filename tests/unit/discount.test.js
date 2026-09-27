import { describe, test, expect } from '@jest/globals';

/**
 * Pure function unit tests matching StoreContext discount logic:
 * - "MERDEKA": 30% discount
 * - "SPECIAL20": 20% discount
 * - Any other code or invalid string: 0 discount
 */
export function calculateDiscount(promoCode, totalAmount) {
  if (typeof totalAmount !== 'number' || totalAmount <= 0) return 0;
  
  const code = (promoCode || '').trim().toUpperCase();
  if (code === 'MERDEKA') {
    return Math.round(totalAmount * 0.30);
  } else if (code === 'SPECIAL20') {
    return Math.round(totalAmount * 0.20);
  }
  return 0;
}

export function calculateGrandTotal(totalAmount, discount) {
  return Math.max(0, totalAmount - discount);
}

describe('Unit Tests: Discount & Promo Code Calculation', () => {
  test('MERDEKA promo code applies 30% discount correctly', () => {
    const total = 100000;
    const discount = calculateDiscount('MERDEKA', total);
    expect(discount).toBe(30000);
    expect(calculateGrandTotal(total, discount)).toBe(70000);
  });

  test('SPECIAL20 promo code applies 20% discount correctly', () => {
    const total = 50000;
    const discount = calculateDiscount('SPECIAL20', total);
    expect(discount).toBe(10000);
    expect(calculateGrandTotal(total, discount)).toBe(40000);
  });

  test('Invalid promo code returns 0 discount', () => {
    const total = 50000;
    expect(calculateDiscount('DISCOUNT50', total)).toBe(0);
    expect(calculateDiscount('merdeka_salah', total)).toBe(0);
    expect(calculateDiscount('', total)).toBe(0);
    expect(calculateDiscount(null, total)).toBe(0);
  });

  test('Case insensitivity handles lowercase input gracefully', () => {
    const total = 80000;
    expect(calculateDiscount('merdeka', total)).toBe(24000);
    expect(calculateDiscount('special20', total)).toBe(16000);
  });

  test('Zero or negative total returns 0 discount', () => {
    expect(calculateDiscount('MERDEKA', 0)).toBe(0);
    expect(calculateDiscount('MERDEKA', -5000)).toBe(0);
  });
});
