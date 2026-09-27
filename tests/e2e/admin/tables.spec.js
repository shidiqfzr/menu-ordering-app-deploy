import { test, expect } from '@playwright/test';

test.describe('E2E Admin: Tables Management & 1-Click Kosongkan Meja', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept admin session check and order APIs for instant, isolated E2E tests
    await page.route('**/api/user/admin-check', async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'k1', name: 'Kasir Bujang', role: 'kasir', email: 'kasir@bujangcafe.com' }
        })
      });
    });

    await page.route('**/api/order/list', async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    await page.route('**/api/order/status', async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Status meja berhasil diupdate' })
      });
    });

    // Seed authenticated admin session into localStorage
    await page.addInitScript(() => {
      localStorage.setItem('adminToken', 'mock_jwt_kasir_token');
      localStorage.setItem('adminUser', JSON.stringify({
        id: 'k1',
        name: 'Kasir Bujang',
        role: 'kasir',
        email: 'kasir@bujangcafe.com'
      }));
    });

    await page.goto('/tables', { waitUntil: 'domcontentloaded' });
  });

  test('TC-E2E-TAB-01: Tables page loads table cards and status pills', async ({ page }) => {
    // Verify title and page header
    const title = page.locator('h2.tables-title');
    await expect(title).toBeVisible({ timeout: 15000 });
    await expect(title).toHaveText('Manajemen Meja & QR Code');

    // Verify filter pills (Semua, Kosong, Menunggu, dll.)
    await expect(page.locator('.tables-toolbar-filters')).toBeVisible();

    // Verify table grid and cards exist
    const cards = page.locator('.table-card');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-E2E-TAB-02: Table capacity stepper adjusts total table count', async ({ page }) => {
    const stepperVal = page.locator('.stepper-val');
    await expect(stepperVal).toBeVisible({ timeout: 15000 });
    const initialText = await stepperVal.innerText();

    // Click "+" button to increment table count
    const plusBtn = page.locator('button[title="Tambah 1 Meja"]');
    await plusBtn.click();

    // Check that count changed
    const updatedText = await stepperVal.innerText();
    expect(updatedText).not.toEqual(initialText);

    // Revert back by clicking "-"
    const minusBtn = page.locator('button[title="Kurangi 1 Meja"]');
    await minusBtn.click();
  });

  test('TC-E2E-TAB-03: QR Code modal opens and can be closed', async ({ page }) => {
    // Click "QR Meja" on the first card
    const qrBtn = page.locator('button:has-text("QR Meja")').first();
    await expect(qrBtn).toBeVisible({ timeout: 15000 });
    await qrBtn.click();

    // QR modal should be visible
    const modal = page.locator('.table-qr-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Close modal using .tq-close-btn
    const closeBtn = page.locator('.tq-close-btn, button[title="Tutup"]').first();
    await expect(closeBtn).toBeVisible({ timeout: 5000 });
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('TC-E2E-TAB-04: Filter tabs correctly switch table views', async ({ page }) => {
    // Click "Kosong" filter pill
    const kosongPill = page.locator('.sub-filter-pill.available');
    await expect(kosongPill).toBeVisible({ timeout: 15000 });
    await kosongPill.click();
    await expect(kosongPill).toHaveClass(/active/);

    // Click "Semua" filter pill to reset
    const semuaPill = page.locator('.sub-filter-pill').first();
    await semuaPill.click();
    await expect(semuaPill).toHaveClass(/active/);
  });
});
