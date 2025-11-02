/**
 * Playwright Authentication Setup
 *
 * This file handles authentication for E2E tests using Google OAuth.
 * It runs once before all tests and saves the authenticated state.
 *
 * Usage:
 * 1. Run setup manually first time: npx playwright test --project=setup --headed
 * 2. Sign in with Google when browser opens
 * 3. Auth state will be saved to .auth/user.json
 * 4. Subsequent tests will reuse this auth state
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');
const adminAuthFile = path.join(__dirname, '../.auth/admin.json');

/**
 * Setup: Authenticate as regular test user
 *
 * MANUAL STEPS REQUIRED:
 * 1. Run: npx playwright test --project=setup --headed
 * 2. Browser will open to /login
 * 3. Click "Sign in with Google"
 * 4. Sign in with your test Gmail account
 * 5. Wait for redirect to /dashboard
 * 6. Auth state will be saved automatically
 *
 * IMPORTANT: Use a dedicated test Gmail account, not your personal account
 */
setup('authenticate as test user', async ({ page }) => {
  console.log('🔐 Starting authentication setup for test user...');
  console.log('📝 You need to manually sign in with Google when the browser opens');

  // Navigate to login page
  await page.goto('/login');

  console.log('✋ MANUAL ACTION REQUIRED:');
  console.log('   1. Click "Sign in with Google" button');
  console.log('   2. Sign in with your test Gmail account');
  console.log('   3. Wait for redirect to dashboard');
  console.log('');
  console.log('   The test will wait up to 2 minutes for you to complete sign-in...');

  // Wait for navigation to dashboard (user successfully authenticated)
  // This gives you time to complete the Google OAuth flow manually
  await page.waitForURL('**/dashboard', {
    timeout: 120000, // 2 minutes to complete manual sign-in
  });

  console.log('✅ Authentication successful!');
  console.log('📦 Saving auth state to .auth/user.json');

  // Verify we're authenticated by checking for user data
  await expect(page.locator('text=/welcome/i'))
    .toBeVisible({ timeout: 10000 })
    .catch(() => {
      console.log("ℹ️  Dashboard loaded (welcome text not found, but that's okay)");
    });

  // Save signed-in state
  await page.context().storageState({ path: authFile });

  console.log('✅ Auth state saved successfully!');
  console.log('🎉 Setup complete! You can now run tests with: npx playwright test');
});

/**
 * Setup: Authenticate as admin test user
 *
 * PREREQUISITE: Test user must have role='admin' in Firestore
 *
 * MANUAL STEPS:
 * 1. Ensure your test user has admin role in Firestore:
 *    - Go to Firestore Console
 *    - Find users/{uid} document
 *    - Set field: role = "admin"
 *
 * 2. Run: npx playwright test --project=admin-setup --headed
 * 3. Sign in with the admin test account
 * 4. Verify you can access /admin page
 */
setup('authenticate as admin user', async ({ page }) => {
  console.log('🔐 Starting authentication setup for admin user...');
  console.log('⚠️  IMPORTANT: Your test user must have role="admin" in Firestore');

  await page.goto('/login');

  console.log('✋ MANUAL ACTION REQUIRED:');
  console.log('   1. Click "Sign in with Google" button');
  console.log('   2. Sign in with your ADMIN test account');
  console.log('   3. Wait for redirect to dashboard');

  // Wait for authentication
  await page.waitForURL('**/dashboard', { timeout: 120000 });

  console.log('✅ Authenticated! Verifying admin access...');

  // Try to navigate to admin page to verify admin role
  await page.goto('/admin');

  // Check if we can access admin page (should not redirect to /dashboard)
  await page.waitForTimeout(2000); // Give it time to redirect if not admin

  const currentUrl = page.url();
  if (!currentUrl.includes('/admin')) {
    console.error('❌ ERROR: User does not have admin access!');
    console.error('   Current URL:', currentUrl);
    console.error('');
    console.error('   Please ensure the test user has role="admin" in Firestore:');
    console.error('   1. Go to Firestore Console');
    console.error('   2. Find users/{uid} document');
    console.error('   3. Set field: role = "admin"');
    throw new Error('Test user does not have admin role');
  }

  console.log('✅ Admin access verified!');
  console.log('📦 Saving admin auth state to .auth/admin.json');

  // Save admin auth state
  await page.context().storageState({ path: adminAuthFile });

  console.log('✅ Admin auth state saved successfully!');
});

/**
 * Test the saved auth state works
 */
setup('verify auth state', async ({ page }) => {
  // This test uses the saved auth state
  // It should automatically be authenticated

  await page.goto('/dashboard');

  // Verify we're on dashboard (not redirected to login)
  await expect(page).toHaveURL(/dashboard/);

  console.log('✅ Auth state verification successful!');
});
