/**
 * Interactive Auth File Creator
 *
 * This script helps you create the .auth/user.json file manually
 * by copying cookies and localStorage from your browser's DevTools.
 *
 * Usage:
 *   1. Sign in at http://localhost:3000/login with your regular browser
 *   2. Open DevTools (F12)
 *   3. Run: npx ts-node e2e/create-auth-manually.ts
 *   4. Follow the prompts
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔐 Manual Auth File Creator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('This script will help you create .auth/user.json manually.');
  console.log('');
  console.log('📋 PREREQUISITES:');
  console.log('   1. Sign in at http://localhost:3000/login (regular browser)');
  console.log('   2. Open DevTools (F12)');
  console.log('   3. Go to Application tab → Cookies → http://localhost:3000');
  console.log('');

  const ready = await question('✅ Are you signed in and have DevTools open? (yes/no): ');

  if (ready.toLowerCase() !== 'yes') {
    console.log('');
    console.log('Please complete the prerequisites first, then run this script again.');
    console.log('');
    rl.close();
    return;
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 STEP 1: Copy All Cookies');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('In DevTools Application tab:');
  console.log('   1. Click: Cookies → http://localhost:3000');
  console.log('   2. You will see a table with cookies');
  console.log('   3. Right-click on the cookie table');
  console.log('   4. Select "Copy all as JSON" (if available)');
  console.log('');
  console.log('If "Copy all as JSON" is not available, run this in Console tab:');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('copy(JSON.stringify(document.cookie.split("; ").map(c => {');
  console.log('  const [name, ...rest] = c.split("=");');
  console.log(
    '  return { name, value: rest.join("="), domain: "localhost", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" };'
  );
  console.log('}), null, 2));');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log("Then paste the result (it's already in your clipboard)");
  console.log('');

  const cookiesInput = await question('Paste the cookies JSON here (or type SKIP): ');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cookies: any[] = [];
  if (cookiesInput.trim().toUpperCase() !== 'SKIP') {
    try {
      cookies = JSON.parse(cookiesInput);
      console.log(`✅ Parsed ${cookies.length} cookies`);
    } catch {
      console.error('❌ Invalid JSON. Using empty cookies array.');
    }
  } else {
    console.log('⚠️  Skipped cookies - tests may not work!');
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 STEP 2: Copy localStorage');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('In DevTools Console tab, run this command:');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('copy(JSON.stringify(Object.keys(localStorage).map(key => ({');
  console.log('  name: key,');
  console.log('  value: localStorage.getItem(key)');
  console.log('})), null, 2));');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log("Then paste the result (it's already in your clipboard)");
  console.log('');

  const localStorageInput = await question('Paste the localStorage JSON here (or type SKIP): ');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let localStorage: any[] = [];
  if (localStorageInput.trim().toUpperCase() !== 'SKIP') {
    try {
      localStorage = JSON.parse(localStorageInput);
      console.log(`✅ Parsed ${localStorage.length} localStorage items`);
    } catch {
      console.error('❌ Invalid JSON. Using empty localStorage array.');
    }
  } else {
    console.log('⚠️  Skipped localStorage - tests may not work!');
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 Creating auth file...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const authState = {
    cookies,
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage,
      },
    ],
  };

  const authDir = path.join(__dirname, '../.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const authFile = path.join(authDir, 'user.json');
  fs.writeFileSync(authFile, JSON.stringify(authState, null, 2));

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SUCCESS! Auth file created!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`📁 File: ${authFile}`);
  console.log(`📊 Cookies: ${cookies.length}`);
  console.log(`💾 localStorage items: ${localStorage.length}`);
  console.log('');
  console.log('✅ You can now run E2E tests:');
  console.log('   npx playwright test e2e/profile/');
  console.log('');
  console.log('💡 If tests fail with auth errors, you may need to:');
  console.log('   1. Make sure you copied ALL cookies (especially Firebase ones)');
  console.log('   2. Make sure you copied ALL localStorage items');
  console.log('   3. Run this script again with complete data');
  console.log('');

  rl.close();
}

main().catch(error => {
  console.error('');
  console.error('❌ Error:', error.message);
  console.error('');
  rl.close();
  process.exit(1);
});
