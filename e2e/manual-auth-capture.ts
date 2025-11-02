/**
 * Manual Auth State Capture Script
 *
 * This script opens a REAL Chrome browser (not automated) where you can
 * sign in with Google normally. After you sign in, it saves your auth state
 * for E2E tests to reuse.
 *
 * This bypasses Google's automated browser detection.
 *
 * Usage:
 *   npx ts-node e2e/manual-auth-capture.ts
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function captureAuthState() {
  console.log('🚀 Manual Auth State Capture');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('This script will:');
  console.log('1. Open a Chrome browser');
  console.log('2. Navigate to /login');
  console.log('3. You manually sign in with Google');
  console.log('4. After successful login, auth state is saved');
  console.log('');
  console.log('⚠️  IMPORTANT: Make sure dev server is running!');
  console.log('   Run: pnpm dev (in another terminal)');
  console.log('');

  // Create .auth directory if it doesn't exist
  const authDir = path.join(__dirname, '../.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`✅ Created ${authDir} directory`);
  }

  console.log('🌐 Launching Chrome browser...');
  console.log('');

  // Launch Chrome (not Chromium) in non-headless mode
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // Use real Chrome browser
    slowMo: 100, // Slow down actions for visibility
  });

  // Create a new browser context
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  console.log('🔗 Navigating to http://localhost:3000/login');
  console.log('');

  try {
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  } catch {
    console.error('❌ Error: Could not connect to dev server!');
    console.error('');
    console.error('Make sure your dev server is running:');
    console.error('   Terminal 1: pnpm dev');
    console.error('   Terminal 2: npx ts-node e2e/manual-auth-capture.ts');
    console.error('');
    await browser.close();
    process.exit(1);
  }

  console.log('✋ MANUAL ACTION REQUIRED:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📝 In the browser window that just opened:');
  console.log('');
  console.log('   1. Click "Sign in with Google" button');
  console.log('   2. Complete the Google sign-in flow normally');
  console.log('   3. Wait until you see the dashboard page');
  console.log('');
  console.log('⏳ This script will wait up to 5 minutes for you to sign in...');
  console.log('');

  try {
    // Wait for navigation to dashboard (indicates successful login)
    await page.waitForURL('**/dashboard', {
      timeout: 300000, // 5 minutes - plenty of time for manual sign-in
    });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Sign-in successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Give the page a moment to fully load
    console.log('⏱️  Waiting for page to fully load...');
    await page.waitForTimeout(2000);

    console.log('💾 Saving authentication state...');

    // Save the auth state
    const authFile = path.join(authDir, 'user.json');
    await context.storageState({ path: authFile });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! Auth state saved!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`📁 Auth state saved to: ${authFile}`);
    console.log('');
    console.log('✅ You can now run E2E tests:');
    console.log('   npx playwright test e2e/profile/');
    console.log('');
    console.log('💡 Tests will automatically use your saved auth state');
    console.log('');
  } catch {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Timeout: Sign-in not completed');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Possible reasons:');
    console.error('  - Sign-in was not completed within 5 minutes');
    console.error('  - Did not reach dashboard page');
    console.error('  - Google blocked the sign-in');
    console.error('');
    console.error('Please try again:');
    console.error('  npx ts-node e2e/manual-auth-capture.ts');
    console.error('');
  }

  // Close browser
  await browser.close();
  console.log('🔒 Browser closed');
  console.log('');
}

// Run the capture
captureAuthState()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Error running auth capture:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error(error);
    console.error('');
    process.exit(1);
  });
