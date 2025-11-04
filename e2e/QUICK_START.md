# E2E Testing Quick Start Guide

This guide will help you set up and run E2E tests in **5 simple steps**.

## Prerequisites

✅ Test fixtures created (already done)
✅ Firebase project configured
✅ Dev server can run: `pnpm dev`
✅ Test Gmail account ready

---

## Step 1: One-Time Authentication Setup

Run this command to authenticate your test user:

```bash
npx playwright test --project=setup --headed
```

**What will happen:**

1. A browser window will open to `/login`
2. You manually sign in with Google (use your test Gmail account)
3. After successful login, Playwright saves your auth state to `.auth/user.json`
4. Browser will close automatically

**Expected output:**

```
🔐 Starting authentication setup for test user...
✋ MANUAL ACTION REQUIRED:
   1. Click "Sign in with Google" button
   2. Sign in with your test Gmail account
   3. Wait for redirect to dashboard
✅ Authentication successful!
✅ Auth state saved successfully!
```

**Troubleshooting:**

- If timeout occurs, you have 2 minutes to complete sign-in
- If it fails, check that dev server is running on http://localhost:3000
- Auth state is saved to `.auth/user.json` (gitignored, safe)

---

## Step 2: (Optional) Setup Admin User

Only needed if you want to run admin upload tests.

### 2a. Set Admin Role in Firestore

1. Go to Firebase Console → Firestore
2. Find your test user: `users/{your-uid}`
3. Edit the document
4. Set field: `role` = `"admin"` (string)
5. Save

### 2b. Authenticate as Admin

```bash
npx playwright test --project=admin-setup --headed
```

Sign in with the same Gmail account (now with admin role).

Auth state will be saved to `.auth/admin.json`

---

## Step 3: Run E2E Tests

Now you're ready to run tests!

### Run All Tests

```bash
npx playwright test
```

### Run Only Profile Tests (Feature 2)

```bash
npx playwright test e2e/profile/
```

### Run Specific Test File

```bash
npx playwright test e2e/profile/profile-view.spec.ts
```

### Run in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run with Browser Visible

```bash
npx playwright test --headed
```

---

## Step 4: View Test Results

### HTML Report

After tests run, view the report:

```bash
npx playwright show-report
```

Opens at: http://localhost:9323

### Console Output

Tests will show pass/fail in terminal:

```
Running 25 tests using 5 workers

  ✓ [chromium] › profile/profile-view.spec.ts:44:7 (1.2s)
  ✓ [chromium] › profile/profile-view.spec.ts:54:7 (0.8s)
  ...

25 passed (15.3s)
```

---

## Step 5: Re-authenticate When Needed

Auth state expires after ~1 hour (Firebase default).

If tests start failing with "not authenticated" errors:

```bash
# Re-run setup
npx playwright test --project=setup --headed
```

This refreshes your auth state.

---

## Test Organization

### Regular User Tests (Profile Viewing, Editing)

- Project: `chromium`
- Auth state: `.auth/user.json`
- Tests: All tests EXCEPT admin tests

### Admin Tests (Persona Upload)

- Project: `chromium-admin`
- Auth state: `.auth/admin.json`
- Tests: `*admin*.spec.ts` files

---

## Common Commands Cheat Sheet

```bash
# First time setup
npx playwright test --project=setup --headed

# Run all tests
npx playwright test

# Run only profile tests
npx playwright test e2e/profile/

# Run in UI mode (best for development)
npx playwright test --ui

# Run with visible browser
npx playwright test --headed

# View last test report
npx playwright show-report

# Debug a specific test
npx playwright test --debug e2e/profile/profile-view.spec.ts

# Update Playwright browsers
npx playwright install
```

---

## Expected Test Results

### Feature 2 Profile Tests

**profile-view.spec.ts** (6 tests)

- ✅ Display profile page when authenticated
- ✅ Display user basic information
- ✅ Display birth details
- ✅ Show Edit button for birth details
- ✅ Display persona image or placeholder
- ✅ Redirect to login if not authenticated

**profile-edit.spec.ts** (7 tests)

- ✅ Open birth details form when Edit is clicked
- ✅ Cancel editing without saving
- ✅ Validate required fields
- ✅ Validate time format (HH:mm)
- ✅ Successfully save birth details
- ✅ Persist changes after page reload
- ✅ Show loading state while saving

**persona-upload.spec.ts** (7 tests, admin only)

- ✅ Show upload section for admin users
- ✅ Validate file type
- ✅ Validate file size (max 5MB)
- ✅ Display selected file info
- ✅ Allow removing selected file
- ⏭️ Compress and upload image successfully (skipped - needs real upload)
- ✅ Show cancel button during upload
- ⏭️ Allow canceling upload in progress (skipped - needs real upload)

**persona-placeholder.spec.ts** (5 tests)

- ✅ Display placeholder for user without persona image
- ✅ Have accessible alt text for placeholder
- ✅ Display placeholder with proper styling
- ✅ Not show "Updated" timestamp for placeholder
- ⏭️ Show persona image when available (skipped - requires image upload first)

**Total:** ~22 tests passing, 3 skipped (require file upload setup)

---

## Troubleshooting

### Tests Skip with "No auth state found"

**Fix:** Run setup first

```bash
npx playwright test --project=setup --headed
```

### "Dev server not running"

**Fix:** Start dev server in another terminal

```bash
pnpm dev
```

### Auth state expired

**Symptom:** Tests redirect to /login

**Fix:** Re-authenticate

```bash
npx playwright test --project=setup --headed
```

### Admin tests fail "Upload section not visible"

**Fix:** Verify admin role in Firestore

1. Check `users/{uid}.role` = `"admin"`
2. Re-run admin setup

### Browser doesn't close after setup

**Fix:** This is normal during setup - close manually after seeing "Auth state saved"

---

## Next Steps

After E2E tests pass:

1. ✅ Commit the auth setup changes
2. ✅ Run full test suite: `npx playwright test`
3. ✅ Generate report: `npx playwright show-report`
4. ✅ Create PR for Feature 2
5. ✅ Proceed to Feature 3

---

## Need Help?

- **Playwright Docs:** https://playwright.dev/docs/intro
- **Auth Guide:** https://playwright.dev/docs/auth
- **Debugging:** https://playwright.dev/docs/debug

**Good luck! 🚀**
