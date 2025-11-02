# E2E Testing Setup Guide

This guide walks you through setting up E2E tests for Chinmay Astro using Playwright.

## Overview

Our E2E tests use **manual Google OAuth authentication** with saved auth state. This approach:

- ✅ Works with existing Google OAuth login flow
- ✅ Saves auth state after first manual login
- ✅ Reuses auth for subsequent test runs (fast!)
- ✅ No need for Email/Password authentication setup

---

## Prerequisites

- Firebase project configured (already done)
- Node.js and pnpm installed
- Playwright installed (`pnpm install` handles this)
- Google account for testing

---

## Step 1: Create Test Fixtures

Test fixtures are sample images used for testing profile image upload functionality.

### Run the fixture creation script:

```bash
bash e2e/create-test-fixtures.sh
```

This creates:

- `e2e/fixtures/test-image.jpg` (500x500, ~22KB)
- `e2e/fixtures/large-image-2000x2000.jpg` (2000x2000, ~175KB for compression tests)
- `e2e/fixtures/test.txt` (invalid file for file type validation tests)

### Verify fixtures were created:

```bash
ls -lh e2e/fixtures/
```

---

## Step 2: Sign In Manually (One-Time Setup)

Since our app uses Google OAuth, you'll need to sign in manually the first time to save your auth state.

### Option A: Use Your Personal Google Account

1. Start the dev server:

   ```bash
   pnpm dev
   ```

2. Open browser to `http://localhost:3000`

3. Sign in with your Google account

4. Navigate to `/profile` and fill in your birth details:
   - Date of Birth: Any date
   - Time of Birth: Any time
   - Place of Birth: Any place

5. Save the profile

6. **Important:** Keep this browser session open or note your auth cookies

### Option B: Create a Dedicated Test Google Account (Recommended)

1. Create a new Google account specifically for E2E testing (e.g., `chinmayastro.test@gmail.com`)

2. Follow steps from Option A with this test account

3. **Benefits:**
   - Isolated test data
   - Won't affect your personal Firebase data
   - Can share credentials with team (if needed)

---

## Step 3: Run E2E Tests (First Time)

The first time you run E2E tests, Playwright will use your browser's saved auth state.

### Run tests in headed mode (see the browser):

```bash
pnpm exec playwright test --headed
```

### What happens:

1. Playwright opens a browser window
2. If you're already logged in (from Step 2), tests will proceed
3. If not logged in, Playwright will pause - sign in manually with Google
4. Playwright saves the auth state to `.auth/` directory (gitignored)
5. Tests run using your authenticated session

---

## Step 4: Run E2E Tests (Subsequent Runs)

After the first successful run with saved auth state, you can run tests in headless mode:

### Run all E2E tests:

```bash
pnpm test:e2e
```

### Run specific test file:

```bash
pnpm exec playwright test e2e/profile/profile-view.spec.ts
```

### Run in headed mode (see browser):

```bash
pnpm exec playwright test --headed
```

### Run with UI mode (interactive debugging):

```bash
pnpm test:e2e:ui
```

---

## Troubleshooting

### Tests fail with "not authenticated" errors

**Solution:** Delete saved auth state and re-run in headed mode:

```bash
rm -rf .auth/
pnpm exec playwright test --headed
```

Then sign in manually with Google when the browser opens.

---

### Google OAuth popup blocked

**Solution:** Run in headed mode first:

```bash
pnpm exec playwright test --headed --project=chromium
```

Allow popups in the browser if prompted.

---

### "Could not find fixtures" errors

**Solution:** Re-run the fixture creation script:

```bash
bash e2e/create-test-fixtures.sh
ls -lh e2e/fixtures/  # Verify files exist
```

---

### Auth state expires

Google auth tokens expire after some time. If tests fail with auth errors:

**Solution:**

```bash
rm -rf .auth/
pnpm exec playwright test --headed
```

Sign in again manually.

---

## File Structure

```
e2e/
├── E2E_SETUP.md                    # This file
├── create-test-fixtures.sh         # Script to create test images
├── create-test-users.ts           # (DEPRECATED - not used with Google OAuth)
├── fixtures/                       # Test image files
│   ├── test-image.jpg             # Small image (500x500)
│   ├── large-image-2000x2000.jpg  # Large image for compression tests
│   └── test.txt                   # Invalid file for validation tests
├── profile/                        # Profile feature E2E tests
│   ├── profile-view.spec.ts       # Test: View profile
│   ├── profile-edit.spec.ts       # Test: Edit profile
│   └── profile-image.spec.ts      # Test: Upload/compress profile image
└── auth/                          # Auth feature E2E tests
    └── login.spec.ts              # Test: Google OAuth login flow
```

---

## CI/CD Considerations

### GitHub Actions E2E Workflow

The E2E tests in CI will need to handle authentication differently:

**Option 1:** Skip E2E tests in CI (run manually only)

- Simplest approach for now
- Good for MVP

**Option 2:** Use saved auth state in CI

- Save `.auth/user.json` as GitHub secret
- Inject it before running tests
- **Caution:** Auth tokens expire, needs periodic refresh

**Option 3:** Mock authentication for E2E

- Create mock auth provider for testing
- Bypass real Google OAuth in test environment
- More complex but fully automated

**Current approach:** E2E tests run on PRs to `staging` and `main`, but may require manual intervention for auth.

---

## Quick Reference

### Create fixtures:

```bash
bash e2e/create-test-fixtures.sh
```

### First-time E2E run (manual auth):

```bash
pnpm exec playwright test --headed
```

### Subsequent E2E runs:

```bash
pnpm test:e2e
```

### Debug tests:

```bash
pnpm test:e2e:ui
```

### Reset auth state:

```bash
rm -rf .auth/
```

---

## Notes

- ✅ Test fixtures are committed to git (they're just sample images)
- ✅ `.auth/` directory is gitignored (contains sensitive auth tokens)
- ✅ No need for Firebase Email/Password authentication
- ✅ Uses existing Google OAuth flow
- ✅ Auth state is saved and reused across test runs
- ⚠️ `create-test-users.ts` is deprecated (was for Email/Password auth)

---

**Need help?** Check the troubleshooting section above or refer to [Playwright authentication docs](https://playwright.dev/docs/auth).
