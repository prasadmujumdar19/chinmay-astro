import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  test('unauthenticated user accessing root should redirect to login', async ({ page }) => {
    await page.goto('/');

    // Should redirect to /login
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user accessing /dashboard should redirect to /login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to /login
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user accessing /admin should redirect to /login', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to /login
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });

  test('login page should be accessible without authentication', async ({ page }) => {
    await page.goto('/login');

    // Should stay on /login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Welcome to Chinmay Astro');
  });
});
