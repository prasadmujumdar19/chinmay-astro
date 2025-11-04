# Manual Auth State Creation - Workaround for Google OAuth Blocking

Since Google keeps blocking automated browsers, here's a **manual workaround** to create the auth state file that E2E tests need.

## 🎯 Overview

We'll use your regular browser's DevTools to extract the authentication cookies and localStorage, then create the auth file manually.

## 📋 Steps

### Step 1: Sign in with Your Regular Browser

1. Open **Google Chrome** (your regular browser, not automated)
2. Navigate to: `http://localhost:3000/login`
3. Sign in with Google normally
4. Wait until you see the dashboard

### Step 2: Open DevTools

1. Press `F12` or `Right-click → Inspect`
2. Go to the **Application** tab (or **Storage** in Firefox)

### Step 3: Copy Cookies

1. In the left sidebar, expand **Cookies**
2. Click on `http://localhost:3000`
3. You'll see a list of cookies

**Copy the following information for EACH cookie:**

- Name
- Value
- Domain
- Path
- Expires
- HttpOnly
- Secure
- SameSite

### Step 4: Copy localStorage

1. In the left sidebar, expand **Local Storage**
2. Click on `http://localhost:3000`
3. You'll see key-value pairs

**Copy all localStorage items**

### Step 5: Create Auth File

1. Create directory:

   ```bash
   mkdir -p .auth
   ```

2. Create file `.auth/user.json` with this structure:

```json
{
  "cookies": [
    {
      "name": "cookie-name-here",
      "value": "cookie-value-here",
      "domain": "localhost",
      "path": "/",
      "expires": 1234567890,
      "httpOnly": false,
      "secure": false,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "http://localhost:3000",
      "localStorage": [
        {
          "name": "key-name-here",
          "value": "value-here"
        }
      ]
    }
  ]
}
```

### Step 6: Fill in the Auth File

Replace the placeholder values with the actual cookies and localStorage you copied.

**Important cookies to look for:**

- Any Firebase-related cookies (usually start with `__session` or similar)
- Authentication tokens
- Session cookies

**Important localStorage items:**

- Firebase auth tokens (usually keys like `firebase:authUser:...`)
- Any session-related data

---

## 🤖 Automated Helper Script

I can create a script that helps you build this file interactively. Would you like me to create that?

---

## 💡 Alternative: Skip E2E Auth Tests for Now

If this is too complex, we can:

1. Skip the E2E tests that require authentication
2. Test the profile features manually
3. Complete Feature 2 without E2E coverage
4. Revisit E2E testing in a later feature

**To skip auth-required E2E tests**, we can add back the skip logic:

```typescript
test.skip(() => !fs.existsSync('.auth/user.json'), 'Auth state not available');
```

---

## 🆘 Which Option Do You Prefer?

1. **Manual auth file creation** (I'll guide you through it)
2. **Interactive helper script** (I'll create a script that prompts you for cookies/localStorage)
3. **Skip E2E tests for now** (complete Feature 2 without E2E coverage)
4. **Try one more automated approach** (I have one more idea using a Chrome extension)

Let me know which option you'd like to pursue!
