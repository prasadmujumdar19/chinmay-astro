import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login page with Google sign-in button', async ({ page }) => {
    await page.goto('/login');

    // Check page title and description
    await expect(page.locator('h1')).toContainText('Welcome to Chinmay Astro');
    await expect(page.getByText('Your trusted astrology consultation platform')).toBeVisible();

    // Check Google Sign-In button
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();

    // Check description text
    await expect(page.getByText('Get personalized astrology consultations')).toBeVisible();
  });

  test('should show Google sign-in button with correct styling', async ({ page }) => {
    await page.goto('/login');

    const signInButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();

    // Check that Google logo SVG is present
    await expect(signInButton.locator('svg')).toBeVisible();
  });
});
