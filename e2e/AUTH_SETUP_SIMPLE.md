# E2E Authentication Setup - Simple Method

**Problem:** Google blocks automated browsers from OAuth sign-in.

**Solution:** Use a real Chrome browser to sign in manually, then save the auth state.

---

## 🚀 3-Step Setup

### Step 1: Start Dev Server

```bash
# Terminal 1
pnpm dev
```

Leave this running!

---

### Step 2: Run Auth Capture Script

```bash
# Terminal 2
npx ts-node e2e/manual-auth-capture.ts
```

**What happens:**

1. ✅ Chrome browser opens (real Chrome, not automated)
2. ✅ Navigates to `http://localhost:3000/login`
3. ⏳ **You manually sign in with Google**
4. ✅ After successful login → auth state saved to `.auth/user.json`
5. ✅ Browser closes automatically

**Expected output:**

```
🚀 Manual Auth State Capture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Launching Chrome browser...
🔗 Navigating to http://localhost:3000/login

✋ MANUAL ACTION REQUIRED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 In the browser window that just opened:

   1. Click "Sign in with Google" button
   2. Complete the Google sign-in flow normally
   3. Wait until you see the dashboard page

⏳ This script will wait up to 5 minutes for you to sign in...

[You sign in with Google...]

✅ Sign-in successful!
💾 Saving authentication state...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 SUCCESS! Auth state saved!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Auth state saved to: .auth/user.json

✅ You can now run E2E tests:
   npx playwright test e2e/profile/
```

---

### Step 3: Run E2E Tests

```bash
npx playwright test e2e/profile/
```

Tests will automatically use your saved auth state!

---

## 🎯 That's It!

Auth state is saved in `.auth/user.json` (gitignored, safe).

Tests will reuse this auth state - no need to sign in again.

---

## 🔄 When to Re-run Auth Capture

Auth state expires after ~1 hour (Firebase default).

If tests start failing with "not authenticated" errors:

```bash
# Re-run the capture script
npx ts-node e2e/manual-auth-capture.ts
```

---

## 🛠️ Troubleshooting

### "Could not connect to dev server"

**Fix:** Start dev server first

```bash
pnpm dev
```

### "Timeout: Sign-in not completed"

**Fix:** You have 5 minutes to complete sign-in. Try again:

```bash
npx ts-node e2e/manual-auth-capture.ts
```

### "ts-node: command not found"

**Fix:** Install ts-node globally

```bash
npm install -g ts-node
```

Or use npx:

```bash
npx ts-node e2e/manual-auth-capture.ts
```

### Google still blocks sign-in

This method uses REAL Chrome (not Playwright), so Google should allow it.

If still blocked:

1. Try using a different Google account
2. Check that Chrome is installed (`which chrome`)
3. Try signing out of all Google accounts first

---

## 📊 Expected Test Results

After auth setup, running tests should show:

```bash
npx playwright test e2e/profile/

Running 25 tests using 5 workers

  ✓ [chromium] › profile/profile-view.spec.ts:44:7 (1.2s)
  ✓ [chromium] › profile/profile-view.spec.ts:54:7 (0.8s)
  ✓ [chromium] › profile/profile-edit.spec.ts:24:7 (1.5s)
  ...

22 passed, 3 skipped (15.3s)
```

---

## ✅ Next Steps

After tests pass:

1. View HTML report: `npx playwright show-report`
2. Push changes: `git push`
3. Create PR to `develop`
4. Merge and celebrate! 🎉

---

## 📝 Files Created

- ✅ `.auth/user.json` - Your saved auth state (gitignored)
- ✅ `e2e/manual-auth-capture.ts` - The capture script

---

**Ready?** Run the script and follow the prompts! 🚀
