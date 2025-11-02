/**
 * E2E Test: Persona Image Placeholder
 * Reference: Task 5.0.4 - Image placeholder fallback
 *
 * Tests:
 * - New user without persona image sees placeholder
 * - Placeholder image displays correctly
 * - Placeholder has appropriate alt text
 */

import { test, expect } from '@playwright/test';

test.describe('Persona Image Placeholder', () => {
  test.skip(
    () => !process.env.E2E_AUTH_ENABLED,
    'E2E authentication not configured. Set E2E_AUTH_ENABLED=true after auth setup.'
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('should display placeholder for user without persona image', async ({ page }) => {
    /**
     * Prerequisite: Test user must NOT have a persona image
     * - Check Firestore: users/{userId}.personaImageUrl should be null
     * - Or use a fresh test user account
     */

    const personaSection = page.getByText('Persona Image').locator('..');

    // Image element should exist
    const image = personaSection.locator('img').first();
    await expect(image).toBeVisible();

    // Image src should point to placeholder
    const imgSrc = await image.getAttribute('src');
    expect(imgSrc).toContain('placeholder'); // Placeholder image path

    // Should NOT contain firebasestorage URL
    expect(imgSrc).not.toContain('firebasestorage.googleapis.com');
  });

  test('should have accessible alt text for placeholder', async ({ page }) => {
    const personaSection = page.getByText('Persona Image').locator('..');
    const image = personaSection.locator('img').first();

    // Check alt text exists and is meaningful
    const altText = await image.getAttribute('alt');
    expect(altText).toBeTruthy();
    expect(altText).toContain('Persona'); // Should describe what it is
  });

  test('should display placeholder with proper styling', async ({ page }) => {
    const personaSection = page.getByText('Persona Image').locator('..');
    const image = personaSection.locator('img').first();

    // Check image has rounded styling (border-radius)
    const borderRadius = await image.evaluate(el => {
      return window.getComputedStyle(el).borderRadius;
    });

    // Should have some border radius (exact value may vary)
    expect(borderRadius).not.toBe('0px');
  });

  test('should not show "Updated" timestamp for placeholder', async ({ page }) => {
    const personaSection = page.getByText('Persona Image').locator('..');

    // Should NOT show upload timestamp
    await expect(personaSection.getByText(/updated:/i)).not.toBeVisible();
  });

  test('should show persona image when available (not placeholder)', async ({ page }) => {
    /**
     * Prerequisite: Test user MUST have a persona image uploaded
     * - Use different test user with personaImageUrl set in Firestore
     * - Or skip this test if current test user has no image
     */

    test.skip(
      () => !process.env.E2E_USER_HAS_PERSONA,
      'Test user does not have persona image. Upload one via admin to enable this test.'
    );

    const personaSection = page.getByText('Persona Image').locator('..');
    const image = personaSection.locator('img').first();

    // Image src should be from Firebase Storage
    const imgSrc = await image.getAttribute('src');
    expect(imgSrc).toContain('firebasestorage.googleapis.com');

    // Should NOT be placeholder
    expect(imgSrc).not.toContain('placeholder');

    // Should show upload timestamp
    await expect(personaSection.getByText(/updated:/i)).toBeVisible();
  });
});

/**
 * Test Setup Notes:
 *
 * 1. Placeholder Image Location:
 *    - public/images/placeholder-persona.svg (or .png)
 *    - Verify this file exists before running tests
 *
 * 2. Test User States Needed:
 *    a) User WITHOUT persona image (for tests 1-4)
 *    b) User WITH persona image (for test 5)
 *
 * 3. Running Tests:
 *    - For tests 1-4: Use fresh test account or ensure personaImageUrl is null
 *    - For test 5: Upload persona image via admin first, then set E2E_USER_HAS_PERSONA=true
 */
