import { describe, test, expect } from '@jest/globals';
import crypto from 'crypto';

/**
 * Invoice number generator replicating orderController.js logic
 */
export function generateInvoiceNumber(type = 'manual', date = new Date()) {
  const prefix = type === 'online' ? 'E' : 'M';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();

  return `${prefix}-${year}${month}${day}-${shortId}`;
}

export function parseInvoiceNumber(invoice) {
  if (!invoice || typeof invoice !== 'string') return null;
  const match = invoice.match(/^([EM])-(\d{4})(\d{2})(\d{2})-([0-9A-F]{4})$/);
  if (!match) return null;
  return {
    type: match[1] === 'E' ? 'online' : 'manual',
    year: parseInt(match[2], 10),
    month: parseInt(match[3], 10),
    day: parseInt(match[4], 10),
    shortId: match[5]
  };
}

describe('Unit Tests: Invoice Number Generator & Parser', () => {
  test('generateInvoiceNumber for manual order matches M-YYYYMMDD-XXXX format', () => {
    const fixedDate = new Date('2026-09-26T12:00:00Z');
    const invoice = generateInvoiceNumber('manual', fixedDate);

    expect(invoice).toMatch(/^M-20260926-[0-9A-F]{4}$/);
    const parsed = parseInvoiceNumber(invoice);
    expect(parsed).not.toBeNull();
    expect(parsed.type).toBe('manual');
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(9);
    expect(parsed.day).toBe(26);
    expect(parsed.shortId).toHaveLength(4);
  });

  test('generateInvoiceNumber for online order matches E-YYYYMMDD-XXXX format', () => {
    const fixedDate = new Date('2026-09-26T12:00:00Z');
    const invoice = generateInvoiceNumber('online', fixedDate);

    expect(invoice).toMatch(/^E-20260926-[0-9A-F]{4}$/);
    const parsed = parseInvoiceNumber(invoice);
    expect(parsed).not.toBeNull();
    expect(parsed.type).toBe('online');
  });

  test('multiple generated invoices produce unique identifiers', () => {
    const set = new Set();
    for (let i = 0; i < 50; i++) {
      set.add(generateInvoiceNumber('manual'));
    }
    // High probability of 50 unique hex IDs
    expect(set.size).toBe(50);
  });

  test('parseInvoiceNumber rejects malformed invoice strings', () => {
    expect(parseInvoiceNumber('INVALID-INVOICE')).toBeNull();
    expect(parseInvoiceNumber('X-20260926-ABCD')).toBeNull(); // wrong prefix
    expect(parseInvoiceNumber('M-2026926-ABCD')).toBeNull();  // wrong date digits
    expect(parseInvoiceNumber('M-20260926-ABC')).toBeNull();   // 3 chars shortId instead of 4
    expect(parseInvoiceNumber(null)).toBeNull();
  });
});
