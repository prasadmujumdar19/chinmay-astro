# Tech Debt Register: Chinmay Astro

**Purpose:** Track technical debt and deferred fixes that need to be addressed before production deployment.

**Last Updated:** November 1, 2025
**Status:** Active - 1 item(s) pending

---

## How to Use This Register

### For Developers/Agents Working on Features:
When you encounter a workaround, quick fix, or deferred improvement during development:

1. Add a new entry to the "Pending Tech Debt" section below
2. Use the task format (see examples)
3. Include:
   - **Priority:** `P0` (critical), `P1` (high), `P2` (medium), `P3` (low)
   - **Category:** `Security`, `Performance`, `Code Quality`, `Infrastructure`, `Testing`, `Documentation`
   - **Affected Files:** List specific files
   - **Details:** What's the issue and why was it deferred?
   - **Fix Required:** What needs to be done?
   - **Validation:** How to verify the fix works

### For Processing Tech Debt:
After all 8 features are complete (or when priorit reaches P0/P1), use the `process-tasks` agent:

```bash
/process-tasks tasks/tech-debt-register.md
```

---

## Tech Debt Summary

| Priority | Category | Count |
|----------|----------|-------|
| P0 (Critical) | - | 0 |
| P1 (High) | - | 0 |
| P2 (Medium) | - | 0 |
| P3 (Low) | - | 0 |

**Total Pending:** 0

---

## Pending Tech Debt

_(No pending tech debt items)_

---

## Completed Tech Debt

### TD-001: Environment Variables Hardcoded in Firebase Config [P1] ✅

**Added:** November 1, 2025
**Feature Context:** Feature 1 (Authentication)
**Category:** Security
**Priority:** P1 (High) - Must fix before production

**Problem:**
Firebase configuration values are hardcoded directly in `lib/firebase/config.ts` instead of being loaded from environment variables. This occurred due to a Next.js 16 + Turbopack bug where `.env` and `.env.local` files are not being loaded properly during development.

**Affected Files:**
- `lib/firebase/config.ts` (lines 5-12)
- `next.config.js` (lines 14-20) - Contains duplicate hardcoded values in `env` config

**Why Deferred:**
- Blocked by Next.js 16 + Turbopack environment variable loading bug
- Needed to unblock Feature 1 development and testing
- API keys are public Firebase web config (not sensitive secrets), but still bad practice

**Security Impact:**
- Low immediate risk: Firebase web config keys are meant to be public (browser-exposed)
- Medium long-term risk: Violates principle of least privilege, makes credential rotation harder
- Version control exposure: Credentials are now committed to git (even though they're public)

**Fix Required:**

- [ ] **TD-001.1** Investigate Next.js 16 + Turbopack .env loading issue
  - **Details:** Research if this is a known bug, check Next.js GitHub issues
  - **Possible Solutions:**
    - Downgrade to Next.js 15 (stable)
    - Use webpack instead of Turbopack for development
    - Wait for Next.js 16.x patch release
    - Use a custom env loading solution (e.g., dotenv package)
  - **Validation:**
    - [ ] Environment variables from `.env.local` are available in `process.env.NEXT_PUBLIC_*`
    - [ ] Browser console shows available env vars (use debug logging)

- [ ] **TD-001.2** Revert Firebase config to use environment variables
  - **Files:** `lib/firebase/config.ts`
  - **Changes:**
    ```typescript
    // Revert to:
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    ```
  - **Validation:**
    - [ ] Remove hardcoded values from `lib/firebase/config.ts`
    - [ ] App loads successfully: `pnpm dev` → http://localhost:3000
    - [ ] No "Missing Firebase environment variables" errors in browser console
    - [ ] Firebase Auth works (Google Sign-In flow)

- [ ] **TD-001.3** Remove hardcoded env values from next.config.js
  - **Files:** `next.config.js`
  - **Changes:** Remove or update the `env` config block (lines 13-20)
  - **Validation:**
    - [ ] Config validation: `pnpm type-check`
    - [ ] Dev server starts: `pnpm dev`
    - [ ] Production build works: `pnpm build`

- [ ] **TD-001.4** Add environment variable validation
  - **Files:** `lib/firebase/config.ts`
  - **Details:** Re-add validation logic that was removed
  - **Code:**
    ```typescript
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ] as const;

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Missing required Firebase environment variables: ${missingEnvVars.join(', ')}`
      );
    }
    ```
  - **Validation:**
    - [ ] Validation works: Temporarily remove `.env.local` → expect error on dev server start
    - [ ] Restore `.env.local` → server starts successfully

- [ ] **TD-001.5** Document environment setup in README
  - **Files:** Create or update `README.md`
  - **Details:** Add section on environment variable setup for new developers
  - **Include:**
    - Copy `.env.local.example` to `.env.local`
    - Where to get Firebase config values
    - Link to TDD section 2.2.1 "Firebase Setup"
  - **Validation:**
    - [ ] README includes env setup instructions
    - [ ] `.env.local.example` exists and is up-to-date

**References:**
- TDD section 2.2.1 "Firebase Setup" (lines 254-276)
- CLAUDE.md "Firebase Integration" section (lines 271-291)
- Current implementation: `lib/firebase/config.ts` (lines 1-16)

**Estimated Effort:** 2-4 hours (depending on Next.js fix complexity)

**Resolution:** November 2, 2025
- ✅ Used `next.config.js` `env` block as official workaround for Turbopack bug
- ✅ Reverted `lib/firebase/config.ts` to use `process.env.*` pattern
- ✅ Added environment variable validation with helpful error messages
- ✅ Removed hardcoded values from both files
- ✅ Values now loaded from `.env.local` (gitignored)
- ✅ Application code follows best practices
- ✅ Dev server starts successfully, type checking passes
**Solution:** The `next.config.js` `env` block acts as a bridge, reading from `.env.local` and exposing vars to the client-side code. This is a proper Next.js pattern and will work until Turbopack bug is fixed, at which point the `env` block can simply be removed without changing application code.

---

## Notes for Agents

### When Adding New Tech Debt:

Use this template:

```markdown
### TD-XXX: [Brief Description] [Priority]

**Added:** [Date]
**Feature Context:** Feature X ([Name])
**Category:** [Security|Performance|Code Quality|Infrastructure|Testing|Documentation]
**Priority:** P0-P3

**Problem:**
[What's wrong and why it matters]

**Affected Files:**
- `path/to/file.ts` (lines X-Y)

**Why Deferred:**
- [Reason 1]
- [Reason 2]

**Fix Required:**

- [ ] **TD-XXX.1** [Task name]
  - **Details:** [What to do]
  - **Validation:**
    - [ ] [How to verify]
```

### Priority Guidelines:

- **P0 (Critical):** Blocking issue, security vulnerability, data loss risk → Fix immediately
- **P1 (High):** Must fix before production, significant security/quality concern → Fix before deployment
- **P2 (Medium):** Should fix, but not blocking → Fix when convenient
- **P3 (Low):** Nice to have, minor improvement → Fix if time permits

### When to Add Tech Debt:

1. **Workarounds:** You implemented a quick fix instead of proper solution
2. **Deferred Features:** Skipped optional requirements due to time/complexity
3. **Code Quality:** Found issues but fixing would derail current feature
4. **Performance:** Known optimization opportunities
5. **Testing:** Missing test coverage, skipped edge cases
6. **Documentation:** Missing or incomplete docs
7. **Security:** Non-critical security improvements

### When NOT to Add Tech Debt:

1. **Critical Bugs:** Fix immediately, don't defer
2. **Feature Requirements:** If it's in the PRD, it's not tech debt - it's a task
3. **Typos/Formatting:** Just fix them
4. **Personal Preferences:** Stick to project conventions

---

**Version:** 1.0
**Maintained By:** Development team + AI agents
**Review Frequency:** After each feature completion + before production deployment
