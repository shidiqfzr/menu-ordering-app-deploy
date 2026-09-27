import { test, expect } from '@playwright/test';

test.describe('E2E Customer: Menu Exploration & Cart Workflow', () => {
  test('TC-E2E-CUST-03: Explore Menu section displays categories and food list', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check header banner carousel
    await expect(page.locator('.carousel')).toBeVisible({ timeout: 15000 });

    // Check Explore Menu section
    const exploreMenu = page.locator('#explore-menu');
    await expect(exploreMenu).toBeVisible();

    // Check menu category list exists
    const categoryList = page.locator('.explore-menu-list');
    await expect(categoryList).toBeVisible();
  });

  test('TC-E2E-CUST-04: Cart page displays empty state or checkout fields properly', async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });

    // Cart page should load
    await expect(page).toHaveURL(/.*cart/, { timeout: 15000 });

    // Verify presence of cart container
    const cartContainer = page.locator('.cart');
    await expect(cartContainer).toBeVisible({ timeout: 15000 });
  });

  test('TC-E2E-CUST-05: Table number query parameter auto-populates table number', async ({ page }) => {
    // Customer scans QR code for Table 7: /?table=7
    await page.goto('/?table=7', { waitUntil: 'domcontentloaded' });

    // Navbar table pill should show Table 7
    const tablePill = page.locator('.navbar-table-pill');
    await expect(tablePill).toBeVisible({ timeout: 15000 });
    await expect(tablePill).toContainText('Meja 7');
  });
});
