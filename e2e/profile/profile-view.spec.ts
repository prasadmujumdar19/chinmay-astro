/**
 * E2E Test: Profile Viewing
 * Reference: Task 5.0.1 - Profile viewing flow
 *
 * Tests:
 * - User can view their profile page
 * - Profile displays correct user data (name, email, birth details)
 * - Profile displays persona image or placeholder
 */

import { test, expect } from '@playwright/test';

/**
 * SETUP INSTRUCTIONS:
 *
 * 1. Create a test user in Firebase Console (if not already exists)
 * 2. Manually sign in once to generate auth state:
 *    - Run: npx playwright test --headed --project=chromium
 *    - Navigate to /login
 *    - Sign in with Google using test account
 *    - Auth state will be saved automatically
 *
 * 3. Ensure test user has profile data:
 *    - dateOfBirth, timeOfBirth, placeOfBirth filled in Firestore
 *
 * OR use Playwright auth storage (recommended):
 *    - Create auth.setup.ts with manual login flow
 *    - Save authenticated state for reuse
 */

test.describe('Profile Viewing', () => {
  test.beforeEach(async ({ page }) => {
    // Auth state is loaded automatically from .auth/user.json
    await page.goto('/profile');
  });

  test('should display profile page when authenticated', async ({ page }) => {
    // Check page heading
    await expect(page.locator('h1')).toContainText('Profile');

    // Check that profile sections are visible
    await expect(page.getByText('Basic Information')).toBeVisible();
    await expect(page.getByText('Birth Details')).toBeVisible();
    await expect(page.getByText('Persona Image')).toBeVisible();
  });

  test('should display user basic information', async ({ page }) => {
    // Check name field
    await expect(page.getByText('Name')).toBeVisible();

    // Check email field
    await expect(page.getByText('Email')).toBeVisible();

    // Check role field
    await expect(page.getByText('Role')).toBeVisible();
  });

  test('should display birth details', async ({ page }) => {
    const birthDetailsSection = page.getByText('Birth Details').locator('..');

    // Check Date of Birth
    await expect(birthDetailsSection.getByText('Date of Birth')).toBeVisible();

    // Check Time of Birth
    await expect(birthDetailsSection.getByText('Time of Birth')).toBeVisible();

    // Check Place of Birth
    await expect(birthDetailsSection.getByText('Place of Birth')).toBeVisible();
  });

  test('should show Edit button for birth details', async ({ page }) => {
    // Find edit button in birth details section
    const editButton = page.getByRole('button', { name: /edit/i });
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
  });

  test('should display persona image or placeholder', async ({ page }) => {
    const personaSection = page.getByText('Persona Image').locator('..');

    // Check that either persona image or placeholder is displayed
    const images = personaSection.locator('img');
    await expect(images.first()).toBeVisible();
  });

  test('should redirect to login if not authenticated', async ({ page, context }) => {
    // Clear auth state
    await context.clearCookies();
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
