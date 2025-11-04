/**
 * E2E Test Authentication Helpers
 *
 * Provides utilities for authenticating test users in Playwright tests
 * Uses real Firebase project with dedicated test user credentials
 */

import { Page } from '@playwright/test';

/**
 * Test user credentials (from environment variables)
 *
 * Setup Instructions:
 * 1. Create a test user in Firebase Console
 * 2. Add credentials to .env.local:
 *    E2E_TEST_USER_EMAIL=test@example.com
 *    E2E_TEST_USER_PASSWORD=testpassword123
 * 3. For admin tests, create admin test user:
 *    E2E_TEST_ADMIN_EMAIL=admin@example.com
 *    E2E_TEST_ADMIN_PASSWORD=adminpassword123
 */
export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL || '',
  password: process.env.E2E_TEST_USER_PASSWORD || '',
};

export const TEST_ADMIN = {
  email: process.env.E2E_TEST_ADMIN_EMAIL || '',
  password: process.env.E2E_TEST_ADMIN_PASSWORD || '',
};

/**
 * Sign in as regular test user
 *
 * @param page - Playwright page object
 * @returns Promise that resolves when authentication is complete
 */
export async function signInAsTestUser(page: Page): Promise<void> {
  if (!TEST_USER.email || !TEST_USER.password) {
    throw new Error('E2E test user credentials not configured. Check .env.local');
  }

  // Navigate to login page
  await page.goto('/login');

  // Click Google Sign-In button
  // Note: This assumes we'll add email/password auth for E2E testing
  // OR we manually authenticate in beforeAll and save auth state
  // For now, we'll use Playwright's authentication state storage

  // TODO: Implement actual sign-in flow once auth method is decided
  // Options:
  // 1. Add email/password auth to login page (dev only)
  // 2. Use Playwright auth state storage with manual first-time login
  // 3. Use Firebase Admin SDK to create custom tokens
}

/**
 * Sign in as admin test user
 *
 * @param page - Playwright page object
 * @returns Promise that resolves when authentication is complete
 */
export async function signInAsAdmin(page: Page): Promise<void> {
  if (!TEST_ADMIN.email || !TEST_ADMIN.password) {
    throw new Error('E2E admin user credentials not configured. Check .env.local');
  }

  // Navigate to login page
  await page.goto('/login');

  // TODO: Implement admin sign-in flow
}

/**
 * Sign out current user
 *
 * @param page - Playwright page object
 */
export async function signOut(page: Page): Promise<void> {
  // Navigate to a page with sign-out functionality
  await page.goto('/dashboard');

  // Find and click sign-out button
  // TODO: Update selector once logout button is implemented
  // await page.getByRole('button', { name: /sign out/i }).click();
}
