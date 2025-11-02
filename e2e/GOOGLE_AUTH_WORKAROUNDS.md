# Google OAuth Authentication Workarounds for E2E Testing

Google blocks automated browsers from signing in with OAuth for security. Here are solutions:

---

## ✅ Solution 1: Use Chrome Channel (Recommended - Try This First)

Already configured in `playwright.config.ts` and `auth.setup.ts`.

**Try running:**

```bash
npx playwright test --project=setup --headed
```

If still blocked, try Solution 2 or 3 below.

---

## ✅ Solution 2: Manual Auth State Capture (Most Reliable)

This method manually captures your auth cookies from a real browser.

### Steps:

#### 1. Sign in manually in Chrome DevTools

```bash
# Start your dev server
pnpm dev

# Open Chrome (not Playwright) and navigate to:
open http://localhost:3000/login

# Sign in with Google normally
```

#### 2. Extract auth cookies

After signing in successfully:

1. Open Chrome DevTools (Cmd+Option+I)
2. Go to **Application** tab → **Cookies** → `http://localhost:3000`
3. Copy these cookies:
   - Look for Firebase auth cookies (starts with `__session` or similar)
   - Google OAuth cookies

#### 3. Create auth state manually

Create `.auth/user.json`:

```json
{
  "cookies": [
    {
      "name": "__session",
      "value": "your-cookie-value-here",
      "domain": "localhost",
      "path": "/",
      "expires": -1,
      "httpOnly": true,
      "secure": false,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "http://localhost:3000",
      "localStorage": []
    }
  ]
}
```

#### 4. Better Approach: Use Playwright to Capture

Create a script `e2e/manual-auth-capture.ts`:

```typescript
import { chromium } from '@playwright/test';
import path from 'path';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // Use real Chrome
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Opening http://localhost:3000/login');
  console.log('📝 Please sign in with Google manually');
  console.log('⏳ Waiting for you to complete sign-in...');

  await page.goto('http://localhost:3000/login');

  // Wait for navigation to dashboard (indicates successful login)
  await page.waitForURL('**/dashboard', { timeout: 300000 }); // 5 min timeout

  console.log('✅ Sign-in detected!');
  console.log('💾 Saving auth state...');

  // Save the auth state
  const authFile = path.join(__dirname, '../.auth/user.json');
  await context.storageState({ path: authFile });

  console.log(`✅ Auth state saved to ${authFile}`);
  console.log('🎉 You can now run: npx playwright test');

  await browser.close();
})();
```

Run it:

```bash
# Make sure dev server is running
pnpm dev

# In another terminal:
npx ts-node e2e/manual-auth-capture.ts
```

---

## ✅ Solution 3: Skip E2E Google Auth Tests (Temporary)

If Google OAuth remains blocked, you can:

1. **Test manually** instead of automated E2E
2. **Skip profile E2E tests** for now
3. **Use Firebase Emulator** (no real OAuth needed)

### Skip Profile Tests

Update `playwright.config.ts`:

```typescript
projects: [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      // Comment out storage state to skip auth
      // storageState: '.auth/user.json',
    },
    testIgnore: /profile.*\.spec\.ts/, // Skip profile tests
  },
];
```

Then run only non-auth tests:

```bash
npx playwright test e2e/auth/ e2e/navigation/
```

---

## ✅ Solution 4: Firebase Emulator Suite (Advanced)

Use Firebase local emulators - no real Google OAuth needed.

### Setup:

```bash
# Install Firebase tools
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Select: Authentication, Firestore, Storage

# Start emulators
firebase emulators:start
```

### Update Firebase config for emulator:

```typescript
// lib/firebase/config.ts
if (process.env.NODE_ENV === 'test') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

### Create emulator users programmatically:

```typescript
// No Google OAuth needed - create users directly
const auth = getAuth();
await createUserWithEmailAndPassword(auth, 'test@example.com', 'password');
```

**Pros:**

- ✅ No Google OAuth blocking
- ✅ Fast, isolated tests
- ✅ Works in CI/CD

**Cons:**

- ⚠️ Requires setup time (1-2 hours)
- ⚠️ Different from production flow

---

## ✅ Solution 5: Use Incognito/Private Mode

Sometimes private mode is less restricted:

Update `auth.setup.ts`:

```typescript
const context = await browser.newContext({
  // Use incognito mode
  ...playwright.devices['Desktop Chrome'],
  userAgent: 'Mozilla/5.0 ...',
  // Add these flags
  launchOptions: {
    args: ['--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'],
  },
});
```

---

## 🎯 Recommended Path Forward

**For MVP (Quick):**

1. ✅ Try Solution 1 (already configured) - **Try this now**
2. ✅ If blocked, use Solution 2 (manual capture) - **Most reliable**
3. ✅ Skip E2E tests temporarily, proceed with PR

**For Production (Later):**

1. ✅ Implement Firebase Emulator Suite (Solution 4)
2. ✅ Automated CI/CD testing
3. ✅ No Google OAuth dependency

---

## 🚀 Quick Decision Guide

**Need tests to pass NOW?**
→ Use **Solution 2** (manual auth capture) - 5 minutes

**Want proper long-term solution?**
→ Use **Solution 4** (Firebase Emulator) - 1-2 hours

**Just want to merge Feature 2?**
→ Use **Solution 3** (skip E2E tests) - Mark as future work

---

## Next Steps

Choose your approach and let me know which solution you'd like to try!
