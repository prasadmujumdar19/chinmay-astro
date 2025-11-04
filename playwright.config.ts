import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Use Chrome channel to avoid Google OAuth blocking
    channel: 'chrome',
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      teardown: 'cleanup',
    },

    // Cleanup project (runs after setup)
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/,
    },

    // Main test project (uses authenticated state)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use saved auth state for regular user tests
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Admin test project (uses admin auth state)
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        // Use saved admin auth state
        storageState: '.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /.*admin.*\.spec\.ts/, // Only run tests with 'admin' in filename
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
