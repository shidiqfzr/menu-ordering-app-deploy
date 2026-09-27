import { test, expect } from '@playwright/test';

test.describe('E2E Customer: Homepage & Authentication Modal', () => {
  test('TC-E2E-CUST-01: Homepage loads successfully with branding and navbar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check navbar brand logo
    const logo = page.locator('.navbar img.logo');
    await expect(logo).toBeVisible({ timeout: 15000 });

    // Check navigation links
    await expect(page.locator('.navbar-menu')).toBeVisible();

    // Check cart button
    const cartBtn = page.locator('.navbar-cart-btn');
    await expect(cartBtn).toBeVisible();
  });

  test('TC-E2E-CUST-02: Sign In button opens Login popup and close button dismisses it', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Click Sign In button
    const signInBtn = page.locator('button.navbar-signin-btn');
    await expect(signInBtn).toBeVisible({ timeout: 15000 });
    await signInBtn.click();

    // Modal popup should be visible
    const loginPopup = page.locator('.login-popup');
    await expect(loginPopup).toBeVisible({ timeout: 10000 });
    await expect(loginPopup.locator('h2')).toHaveText('Login');

    // Email and Password inputs should be visible
    await expect(loginPopup.locator('input[name="email"]')).toBeVisible();
    await expect(loginPopup.locator('input[name="password"]')).toBeVisible();

    // Click Close icon
    const closeBtn = loginPopup.locator('img[alt="Close"]');
    await closeBtn.click();

    // Modal popup should disappear
    await expect(loginPopup).not.toBeVisible();
  });
});
