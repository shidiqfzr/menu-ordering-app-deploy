import { test, expect } from '@playwright/test';

test.describe('E2E Admin: Authentication & Role-Based Access Control', () => {
  let currentLoggedInRole = 'kasir';

  test.beforeEach(async ({ page }) => {
    // 1. Intercept admin-login API
    await page.route('**/api/user/admin-login', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      const { email, password } = postData;

      if (password === 'passwordsalah') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Email atau kata sandi salah. Silakan coba lagi.'
          })
        });
      }

      if (email === 'manager@bujangcafe.com') {
        currentLoggedInRole = 'manager';
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock_jwt_manager_token_123',
            user: {
              id: 'm1',
              name: 'Manager Bujang',
              email: 'manager@bujangcafe.com',
              role: 'manager'
            }
          })
        });
      }

      // Default Kasir
      currentLoggedInRole = 'kasir';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock_jwt_kasir_token_123',
          user: {
            id: 'k1',
            name: 'Kasir Bujang',
            email: 'kasir@bujangcafe.com',
            role: 'kasir'
          }
        })
      });
    });

    // 2. Intercept admin-check session verification API
    await page.route('**/api/user/admin-check', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: currentLoggedInRole === 'manager' ? 'm1' : 'k1',
            name: currentLoggedInRole === 'manager' ? 'Manager Bujang' : 'Kasir Bujang',
            email: currentLoggedInRole === 'manager' ? 'manager@bujangcafe.com' : 'kasir@bujangcafe.com',
            role: currentLoggedInRole
          }
        })
      });
    });

    // 3. Mock dashboard and orders data calls so pages render immediately
    await page.route('**/api/order/list', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    await page.route('**/api/food/list', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
  });

  test('TC-E2E-ADM-01: Kasir logs in and redirects to Orders (POS) page', async ({ page }) => {
    await page.fill('input[type="email"]', 'kasir@bujangcafe.com');
    await page.fill('input[type="password"]', 'kasir12345');
    await page.click('button[type="submit"]');

    // Assert URL redirects to /orders
    await expect(page).toHaveURL(/.*orders/, { timeout: 15000 });

    // Verify sidebar exists
    await expect(page.locator('.sidebar')).toBeVisible({ timeout: 10000 });
  });

  test('TC-E2E-ADM-02: Manager logs in and redirects to Dashboard page', async ({ page }) => {
    await page.fill('input[type="email"]', 'manager@bujangcafe.com');
    await page.fill('input[type="password"]', 'manager12345');
    await page.click('button[type="submit"]');

    // Assert URL redirects to /dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Verify dashboard metrics section exists (.dashboard-page)
    await expect(page.locator('.dashboard-page')).toBeVisible({ timeout: 10000 });
  });

  test('TC-E2E-ADM-03: Invalid credentials show error toast/message', async ({ page }) => {
    await page.fill('input[type="email"]', 'kasir@bujangcafe.com');
    await page.fill('input[type="password"]', 'passwordsalah');
    await page.click('button[type="submit"]');

    // Should stay on login page
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*login/);
  });

  test('TC-E2E-ADM-04: Kasir role cannot access Manager Dashboard (RBAC check)', async ({ page }) => {
    // 1. Log in as Kasir
    await page.fill('input[type="email"]', 'kasir@bujangcafe.com');
    await page.fill('input[type="password"]', 'kasir12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*orders/, { timeout: 15000 });

    // 2. Try to directly navigate to /dashboard
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // ProtectedRoute redirects unauthorized roles away from /dashboard
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/dashboard');
  });
});
