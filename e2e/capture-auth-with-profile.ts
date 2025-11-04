/**
 * Auth Capture Using Your Chrome Profile
 *
 * This script uses your ACTUAL Chrome profile where you're already signed into Google.
 * No need to sign in again - just click through to the dashboard!
 *
 * Usage:
 *   npx ts-node e2e/capture-auth-with-profile.ts
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureAuthState() {
  console.log('🚀 Auth Capture Using Your Chrome Profile');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('This script uses your Chrome profile where you are');
  console.log('already signed into Google - no need to sign in again!');
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

  // Determine Chrome user data directory based on OS
  const homeDir = os.homedir();
  let chromeUserDataDir: string;

  if (process.platform === 'darwin') {
    // macOS
    chromeUserDataDir = path.join(homeDir, 'Library/Application Support/Google/Chrome');
  } else if (process.platform === 'win32') {
    // Windows
    chromeUserDataDir = path.join(homeDir, 'AppData/Local/Google/Chrome/User Data');
  } else {
    // Linux
    chromeUserDataDir = path.join(homeDir, '.config/google-chrome');
  }

  console.log('🔍 Detected Chrome profile location:');
  console.log(`   ${chromeUserDataDir}`);
  console.log('');

  if (!fs.existsSync(chromeUserDataDir)) {
    console.error('❌ Chrome profile not found!');
    console.error('');
    console.error('Please install Google Chrome or specify the correct profile path.');
    console.error('');
    process.exit(1);
  }

  console.log('🌐 Launching Chrome with your profile...');
  console.log('');
  console.log('💡 TIP: If Chrome is already running, close it first!');
  console.log('   Chrome can only use a profile in one instance at a time.');
  console.log('');

  try {
    // Launch Chrome with the user's actual profile
    const browser = await chromium.launchPersistentContext(chromeUserDataDir, {
      headless: false,
      channel: 'chrome',
      args: [
        '--disable-blink-features=AutomationControlled', // Hide automation flags
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
    });

    const page = browser.pages()[0] || (await browser.newPage());

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
      console.error('   Terminal 2: npx ts-node e2e/capture-auth-with-profile.ts');
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
    console.log('   2. You should ALREADY be signed into Google!');
    console.log('   3. Select your account (if prompted)');
    console.log('   4. Wait until you see the dashboard page');
    console.log('');
    console.log('⏳ This script will wait up to 5 minutes...');
    console.log('');

    try {
      // Wait for navigation to dashboard (indicates successful login)
      await page.waitForURL('**/dashboard', {
        timeout: 300000, // 5 minutes
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
      await browser.storageState({ path: authFile });

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
      console.error('  - Google still blocked the sign-in');
      console.error('');
      console.error('Please try again:');
      console.error('  npx ts-node e2e/capture-auth-with-profile.ts');
      console.error('');
    }

    // Close browser
    await browser.close();
    console.log('🔒 Browser closed');
    console.log('');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to launch')) {
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ Could not launch Chrome with profile');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
      console.error('SOLUTION: Close all Chrome windows and try again!');
      console.error('');
      console.error('Chrome can only use a profile in one instance at a time.');
      console.error('Please close all Chrome windows, then run this script again.');
      console.error('');
      process.exit(1);
    }
    throw error;
  }
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
