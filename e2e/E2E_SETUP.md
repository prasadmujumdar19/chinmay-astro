# E2E Testing Setup Guide

This guide explains how to set up and run E2E tests for Chinmay Astro using Playwright with real Firebase authentication.

## Prerequisites

- Firebase project (already configured)
- Node.js and pnpm installed
- Playwright installed (`pnpm install` should handle this)

## 1. Create Test Users in Firebase

### Regular Test User

1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Email: `test-user@chinmayastro.com` (or your preferred test email)
4. Password: Create a strong password
5. Click "Add User"

### Admin Test User

1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Email: `admin-test@chinmayastro.com`
4. Password: Create a strong password
5. Click "Add User"
6. Go to Firestore → `users` collection → find admin user document
7. Set `role: "admin"`

## 2. Configure Environment Variables

Add these to `.env.local`:

```bash
# E2E Test Configuration
E2E_AUTH_ENABLED=true
E2E_ADMIN_ENABLED=true

# Test User Credentials
E2E_TEST_USER_EMAIL=test-user@chinmayastro.com
E2E_TEST_USER_PASSWORD=your-test-user-password

# Admin Test User Credentials
E2E_TEST_ADMIN_EMAIL=admin-test@chinmayastro.com
E2E_TEST_ADMIN_PASSWORD=your-admin-test-password

# Optional: Set if test user has persona image
E2E_USER_HAS_PERSONA=false
```

⚠️ **Security Note:** Never commit `.env.local` to git. It's already in `.gitignore`.

## 3. Set Up Test User Profile Data

### Option A: Manual Setup (Recommended for First Time)

1. Sign in to the app manually as test user
2. Navigate to `/profile`
3. Fill in birth details:
   - Date of Birth: 1990-01-15
   - Time of Birth: 14:30
   - Place of Birth: Mumbai, India
4. Save

### Option B: Direct Firestore Edit

1. Go to Firestore Console
2. Find `users/{test-user-uid}` document
3. Add/update fields:
   ```json
   {
     "dateOfBirth": "1990-01-15T00:00:00Z",
     "timeOfBirth": "14:30",
     "placeOfBirth": "Mumbai, India"
   }
   ```

## 4. Create Test Image Fixtures

Create these test images in `e2e/fixtures/`:

### Small Test Image (test-image.jpg)

- Size: < 1MB
- Dimensions: Any (e.g., 500x500)
- Format: JPEG

### Large Test Image (large-image-2000x2000.jpg)

- Size: 2-4 MB
- Dimensions: 2000x2000 pixels
- Format: JPEG
- **Purpose:** Test image compression

### Invalid File (test.txt)

- Create a simple text file for file type validation tests

**Quick way to create test images:**

```bash
cd e2e/fixtures

# Create small test image (macOS with ImageMagick)
convert -size 500x500 xc:blue test-image.jpg

# Create large test image
convert -size 2000x2000 xc:red large-image-2000x2000.jpg

# Create text file
echo "This is not an image" > test.txt
```

**Without ImageMagick:** Download sample images from https://picsum.photos/

## 5. Playwright Authentication Setup

### Option A: Automatic Auth State (Recommended)

Create `playwright.config.ts` with auth project:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // ... existing config

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use auth state from setup
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

Create `e2e/auth.setup.ts`:

```typescript
import { test as setup } from '@playwright/test';

const authFile = '.auth/user.json';

setup('authenticate as test user', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');

  // Sign in with Google
  // Note: This requires manual intervention for Google OAuth
  // OR implement email/password auth for E2E testing

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');

  // Save auth state
  await page.context().storageState({ path: authFile });
});
```

### Option B: Manual Auth State (Simpler for Now)

1. Run Playwright in headed mode: `npx playwright test --headed`
2. Manually sign in during first test
3. Auth cookies will be saved automatically

## 6. Running E2E Tests

### Run All Profile Tests

```bash
pnpm exec playwright test e2e/profile/
```

### Run Specific Test File

```bash
pnpm exec playwright test e2e/profile/profile-view.spec.ts
```

### Run in Headed Mode (See Browser)

```bash
pnpm exec playwright test --headed
```

### Run with UI (Interactive)

```bash
pnpm exec playwright test --ui
```

### Debug Mode

```bash
pnpm exec playwright test --debug
```

## 7. Test Coverage

### Profile View (profile-view.spec.ts)

- ✅ Profile page displays correctly
- ✅ Basic information visible
- ✅ Birth details visible
- ✅ Edit button present
- ✅ Persona image/placeholder visible
- ✅ Redirects to login when not authenticated

### Birth Details Edit (profile-edit.spec.ts)

- ✅ Edit form opens/closes
- ✅ Form validation (required fields, time format)
- ✅ Save functionality
- ✅ Data persistence
- ✅ Loading states

### Persona Upload (persona-upload.spec.ts)

- ✅ Admin-only visibility
- ✅ File type validation
- ✅ File size validation
- ✅ Upload progress indicator
- ✅ Image compression (CRITICAL - validates unit test gap)
- ✅ Cancel upload

### Persona Placeholder (persona-placeholder.spec.ts)

- ✅ Placeholder displays for users without persona
- ✅ Persona image displays when available
- ✅ Accessible alt text
- ✅ Proper styling

## 8. CI/CD Integration

For GitHub Actions, you'll need to:

1. Add Firebase test project credentials as GitHub Secrets
2. Set up Playwright in CI
3. Use Firebase Emulator Suite (recommended for CI)

See `.github/workflows/e2e.yml` for configuration.

## 9. Troubleshooting

### Tests Skipped

If tests show "skipped", check:

- `E2E_AUTH_ENABLED=true` in `.env.local`
- Environment variables are loaded correctly

### Authentication Failures

- Verify test user exists in Firebase Console
- Check credentials in `.env.local`
- Clear browser storage: `rm -rf .auth/`

### Image Upload Tests Fail

- Verify admin user has `role: "admin"` in Firestore
- Check Firebase Storage rules allow admin uploads
- Ensure test images exist in `e2e/fixtures/`

### Rate Limiting (Google OAuth)

If Google blocks automated sign-ins:

- Use Playwright's `storageState` to persist auth between test runs
- Consider implementing email/password auth for E2E tests only

## 10. Best Practices

1. **Isolated Test Data:** Use dedicated test users, don't test on production data
2. **Clean Up:** Delete uploaded test images periodically from Firebase Storage
3. **Stable Selectors:** Use `getByRole`, `getByLabel` over CSS selectors
4. **Wait Strategies:** Use Playwright's auto-waiting, avoid fixed timeouts
5. **Parallel Execution:** Keep tests independent so they can run in parallel

## 11. Next Steps

After E2E tests pass:

1. ✅ Run full test suite: `pnpm exec playwright test`
2. ✅ Generate HTML report: `pnpm exec playwright show-report`
3. ✅ Update CLAUDE.md with E2E patterns learned
4. ✅ Create PR for Feature 2
5. ✅ Merge to develop → staging → main

---

**Questions?** Check Playwright docs: https://playwright.dev/docs/intro
