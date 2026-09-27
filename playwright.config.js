import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 15000
  },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: './tests/reports/playwright-html-report', open: 'never' }],
    ['json', { outputFile: './tests/reports/e2e-results.json' }]
  ],
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'Customer App',
      testMatch: /customer\/.*\.spec\.js/,
      use: {
        baseURL: 'http://localhost:5173',
      },
    },
    {
      name: 'Admin App',
      testMatch: /admin\/.*\.spec\.js/,
      use: {
        baseURL: 'http://localhost:5174',
      },
    },
  ],
});
