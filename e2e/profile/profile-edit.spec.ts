/**
 * E2E Test: Birth Details Editing
 * Reference: Task 5.0.2 - Birth details editing flow
 *
 * Tests:
 * - User can edit birth details
 * - Form validation works correctly
 * - Changes persist to Firestore
 * - Success message displays
 */

import { test, expect } from '@playwright/test';

test.describe('Birth Details Editing', () => {
  test.skip(
    () => !process.env.E2E_AUTH_ENABLED,
    'E2E authentication not configured. Set E2E_AUTH_ENABLED=true after auth setup.'
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('should open birth details form when Edit is clicked', async ({ page }) => {
    // Click Edit button
    await page.getByRole('button', { name: /edit/i }).click();

    // Form inputs should be visible
    await expect(page.getByLabel(/date of birth/i)).toBeVisible();
    await expect(page.getByLabel(/time of birth/i)).toBeVisible();
    await expect(page.getByLabel(/place of birth/i)).toBeVisible();

    // Save and Cancel buttons should be visible
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('should cancel editing without saving', async ({ page }) => {
    // Click Edit
    await page.getByRole('button', { name: /edit/i }).click();

    // Get original place value (for comparison later)
    const placeInput = page.getByLabel(/place of birth/i);
    const originalPlace = await placeInput.inputValue();

    // Change a value
    await placeInput.fill('New Place');

    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Form should be hidden
    await expect(page.getByLabel(/date of birth/i)).not.toBeVisible();

    // Original value should still be displayed
    await expect(page.getByText(originalPlace)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click Edit
    await page.getByRole('button', { name: /edit/i }).click();

    // Clear place of birth
    const placeInput = page.getByLabel(/place of birth/i);
    await placeInput.fill('');

    // Try to submit
    await page.getByRole('button', { name: /save changes/i }).click();

    // Error message should appear
    await expect(page.getByText(/place of birth is required/i)).toBeVisible();
  });

  test('should validate time format (HH:mm)', async ({ page }) => {
    // Click Edit
    await page.getByRole('button', { name: /edit/i }).click();

    // Enter invalid time format
    const timeInput = page.getByLabel(/time of birth/i);
    await timeInput.fill('25:99'); // Invalid time

    // Try to submit
    await page.getByRole('button', { name: /save changes/i }).click();

    // Error message should appear
    await expect(page.getByText(/time must be in HH:mm format/i)).toBeVisible();
  });

  test('should successfully save birth details', async ({ page }) => {
    // Click Edit
    await page.getByRole('button', { name: /edit/i }).click();

    // Fill in form with valid data
    await page.getByLabel(/date of birth/i).fill('1990-01-15');
    await page.getByLabel(/time of birth/i).fill('14:30');
    await page.getByLabel(/place of birth/i).fill('Mumbai, India');

    // Submit form
    await page.getByRole('button', { name: /save changes/i }).click();

    // Success message should appear
    await expect(page.getByText(/birth details updated successfully/i)).toBeVisible();

    // Form should be hidden (back to view mode)
    await expect(page.getByLabel(/date of birth/i)).not.toBeVisible();

    // Updated values should be displayed
    await expect(page.getByText('1/15/1990')).toBeVisible(); // US date format
    await expect(page.getByText('14:30')).toBeVisible();
    await expect(page.getByText('Mumbai, India')).toBeVisible();
  });

  test('should persist changes after page reload', async ({ page }) => {
    // Click Edit
    await page.getByRole('button', { name: /edit/i }).click();

    // Update place of birth
    const uniquePlace = `Test City ${Date.now()}`;
    await page.getByLabel(/place of birth/i).fill(uniquePlace);

    // Save
    await page.getByRole('button', { name: /save changes/i }).click();

    // Wait for success message
    await expect(page.getByText(/birth details updated successfully/i)).toBeVisible();

    // Reload page
    await page.reload();

    // Updated value should still be visible
    await expect(page.getByText(uniquePlace)).toBeVisible();
  });

  test('should show loading state while saving', async ({ page }) => {
    // Click Edit
    await page.getByRole('button', { name: /edit/i }).click();

    // Fill form
    await page.getByLabel(/place of birth/i).fill('Delhi, India');

    // Click save and immediately check for loading state
    await page.getByRole('button', { name: /save changes/i }).click();

    // Button should show "Saving..." text
    await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();
  });
});
