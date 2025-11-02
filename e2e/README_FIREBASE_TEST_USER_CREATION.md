# Scripts Directory

Utility scripts for Chinmay Astro development and testing.

## Available Scripts

### `create-test-users.ts`

Creates test users in Firebase Auth for E2E testing with Playwright.

**Purpose:**

- Workaround for deprecated Firebase Console "Add User" functionality
- Automates creation of test users with proper roles and test data
- Sets up both regular user and admin user accounts

**Prerequisites:**

1. Firebase Service Account Key (one of):
   - File: `firebase-service-account-key.json` in project root
   - OR environment variable: `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string) in `.env.local`

**How to get Service Account Key:**

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the downloaded JSON file as `firebase-service-account-key.json` in project root
4. **IMPORTANT:** Never commit this file! (It's already in `.gitignore`)

**Usage:**

```bash
npx tsx scripts/create-test-users.ts
```

**What it does:**

1. Creates (or verifies) two test users in Firebase Auth:
   - `test-user@chinmayastro.com` (regular user)
   - `admin-test@chinmayastro.com` (admin user)

2. Creates Firestore user profiles with:
   - Appropriate roles (user/admin)
   - Test birth details for profile E2E tests
   - Session credits initialized to 0

3. Outputs credentials to use in `.env.local`

**Generated Credentials:**

- Test User Password: `TestUser123!@#` <!-- pragma: allowlist secret -->
- Admin Password: `AdminTest123!@#` <!-- pragma: allowlist secret -->

**After running:**
Add these to `.env.local`:

```bash
E2E_TEST_USER_EMAIL=test-user@chinmayastro.com
E2E_TEST_USER_PASSWORD=TestUser123!@#
E2E_TEST_ADMIN_EMAIL=admin-test@chinmayastro.com
E2E_TEST_ADMIN_PASSWORD=AdminTest123!@#
```

**Safety features:**

- Checks if users already exist before creating (idempotent)
- Marks emails as verified for E2E testing
- Updates roles if they've changed
- Ensures birth details exist for profile tests

**Troubleshooting:**

If you get "Could not load the default credentials":

1. Verify service account key file exists
2. Check JSON is valid (no extra characters)
3. Ensure file is in project root
4. Try setting `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local` instead

If you get "Permission denied":

1. Ensure service account has "Firebase Admin" role
2. Check Firebase project ID matches your config
3. Verify you're using the correct Firebase project

---

## Adding New Scripts

When adding new scripts:

1. Use TypeScript (`.ts` extension)
2. Run with `npx tsx scripts/your-script.ts`
3. Add documentation to this README
4. Add error handling and clear output messages
5. Make scripts idempotent when possible (safe to run multiple times)

---

**Questions?** See [e2e/E2E_SETUP.md](../e2e/E2E_SETUP.md) for full E2E testing setup guide.
