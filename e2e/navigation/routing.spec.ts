import { test, expect } from '@playwright/test';

test.describe('Application Routing', () => {
  test('should load homepage and show loading state', async ({ page }) => {
    await page.goto('/');

    // Should show loading spinner initially
    const spinner = page.locator('.animate-spin');
    await expect(spinner).toBeVisible();
  });

  test('should navigate to login page directly', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Chinmay Astro');
  });

  test('login page should have proper meta information', async ({ page }) => {
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle(/Chinmay Astro/);
  });
});
