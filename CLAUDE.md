# CLAUDE.md - Context Guide for Chinmay Astro Development

> **Purpose**: This file provides essential context for AI assistants (Claude) working on Chinmay Astro feature development. Read this file at the start of each session to understand the project structure, conventions, and best practices.

**Last Updated**: November 2, 2025
**Project**: Chinmay Astro - Astrology Consultation Web Application
**Status**: Feature 1 (Authentication) Complete ✅ | Quality Gates Implemented ✅

---

## 🎯 Project Overview

**Chinmay Astro** is a web-based astrology consultation platform for a single-practitioner business model.

**Core Purpose:**

- Enable clients to purchase and consume fortune-telling consultations through chat, audio, or video sessions
- Operate on a pay-per-session model with bundle discounts
- Support small user base (few hundred users) primarily in India

**Key Principles:**

- 🏗️ **Simplicity First**: Budget-friendly architecture for small scale
- 💬 **Relationship-Focused**: Asynchronous chat-first with natural back-and-forth dialogue
- 🔄 **Flexible Credits**: 1 credit = 1 topic with full conversation flow
- 🧪 **TDD Always**: Test-Driven Development for all features
- 🤖 **AI-Assisted**: Built using Claude Code with automated workflows

**Business Model:**

- Single fortune teller/jyotish consultant (not an aggregator platform)
- Target market: India-based users with international payment acceptance
- Scale: Few hundred users maximum
- Revenue: Pay-per-session (chat/audio/video) with bundles (buy 2 get 3, buy 4 get 6, buy 8 get 12)

---

## 📂 Project Structure

```
chinmay-astro/
├── app/                         # Next.js 14 App Router
│   ├── (auth)/                 # Auth-related routes
│   │   └── login/
│   ├── (dashboard)/            # Protected routes
│   │   ├── dashboard/          # User dashboard
│   │   └── admin/              # Admin dashboard
│   ├── (public)/               # Public pages
│   ├── layout.tsx              # Root layout
│   └── providers.tsx           # Client providers (auth, etc.)
├── components/
│   ├── auth/                   # Authentication components
│   ├── ui/                     # Reusable UI components
│   └── ErrorBoundary.tsx       # Error handling
├── lib/
│   ├── firebase/               # Firebase integration
│   │   ├── config.ts          # Firebase initialization
│   │   ├── auth.ts            # Auth utilities
│   │   ├── firestore.ts       # Firestore utilities
│   │   └── users.ts           # User operations
│   ├── auth/                   # Auth logic
│   │   └── redirects.ts       # Role-based routing
│   └── constants/              # App constants
│       └── routes.ts          # Route definitions
├── stores/
│   └── authStore.ts            # Zustand auth state
├── hooks/
│   └── useAuthObserver.ts      # Firebase auth observer
├── types/
│   └── auth.ts                 # TypeScript types
├── __tests__/                  # Unit tests (Vitest)
│   ├── fixtures/               # Test data
│   ├── mocks/                  # Mock implementations
│   └── utils/                  # Test utilities
├── e2e/                        # E2E tests (Playwright)
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       └── auth/
│           └── onUserCreate.ts # User creation trigger
├── tasks/                      # Product requirements (PRD, TDD, task lists)
│   ├── prd-chinmay-astro-web-app.md           # Product requirements
│   ├── tdd-chinmay-astro-web-app.md           # Technical design
│   ├── tasks-chinmay_astro-feature-1-*.md     # Feature 1-8 task lists
│   └── tasks-chinmay_astro-feature-99-tech-debt.md  # Feature 99: Tech debt cleanup
└── .claude/                    # Claude Code agent configurations
```

---

## 🔑 Key Files to Reference

### Product & Design Documents (Read First!)

- **[tasks/prd-chinmay-astro-web-app.md](tasks/prd-chinmay-astro-web-app.md)** - Core product vision and requirements
- **[tasks/tdd-chinmay-astro-web-app.md](tasks/tdd-chinmay-astro-web-app.md)** - Technical architecture and design decisions
- **[tasks/tasks-chinmay_astro-feature-1-authentication.md](tasks/tasks-chinmay_astro-feature-1-authentication.md)** - Current feature tasks

### Configuration Files

- **[package.json](package.json)** - Dependencies and scripts (when created)
- **[tsconfig.json](tsconfig.json)** - TypeScript strict mode configuration
- **[vitest.config.ts](vitest.config.ts)** - Vitest test runner config
- **[playwright.config.ts](playwright.config.ts)** - E2E test configuration
- **[next.config.js](next.config.js)** - Next.js configuration (static export)
- **[.env.local.example](.env.local.example)** - Environment variables template

### Type Definitions (Always Use!)

- **[types/auth.ts](types/auth.ts)** - Authentication types (when created)
- **[lib/firebase/users.ts](lib/firebase/users.ts)** - UserProfile interface

---

## 🛠️ Tech Stack & Tools

### Frontend

- **Framework**: Next.js 14+ (App Router, static export)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (lightweight alternative to Redux)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components with Tailwind

### Backend

- **Platform**: Firebase
  - **Authentication**: Firebase Auth (Google OAuth 2.0)
  - **Database**: Firestore (NoSQL, real-time)
  - **Functions**: Cloud Functions (Node.js 20)
  - **Storage**: Cloud Storage (persona images)
  - **Email**: Firebase Trigger Email Extension
- **Payment**: Razorpay (UPI support for India)

### Development Tools

- **Package Manager**: pnpm (faster than npm, more efficient)
- **Testing**: Vitest + React Testing Library (unit/integration)
- **E2E Testing**: Playwright (cross-browser)
- **Linting**: ESLint (next/core-web-vitals + Prettier integration)
- **Formatting**: Prettier (standard web defaults)
- **Git Hooks**: Husky + lint-staged (pre-commit & pre-push automation)
- **Secret Detection**: detect-secrets (baseline scanner)
- **CI/CD**: GitHub Actions (4 workflows: CI, E2E, Secret Scan, Firebase Deploy)

### Deployment

- **Hosting**: Hostinger (static files from Next.js export) - Manual FTP/SFTP
- **Backend**: Firebase Cloud Functions - Automated via GitHub Actions on `main` push

---

## 🔧 Development Quality Gates

### Local Git Hooks (Husky)

**Pre-commit Hook** (runs automatically before every commit):

- 🔍 **Secret detection** via detect-secrets
  - Scans staged files against `.secrets.baseline`
  - Blocks commit if new secrets detected
- 🧹 **Lint-staged** - Only processes staged files
  - ESLint --fix on `.ts`, `.tsx`, `.js`, `.jsx` files
  - Prettier --write on all files
  - Auto-stages fixes

**Pre-push Hook** (runs automatically before every push):

- 🔎 **TypeScript type-check** (`pnpm type-check`)
- 🧪 **Unit tests** (`pnpm test:run`)
- Blocks push if either fails

**Manual Commands:**

```bash
pnpm lint          # Run ESLint
pnpm lint:fix      # Auto-fix ESLint issues
pnpm format        # Auto-format with Prettier
pnpm format:check  # Check formatting without changes
pnpm type-check    # TypeScript validation
pnpm test          # Run tests in watch mode
pnpm test:run      # Run tests once
pnpm test:coverage # Run tests with coverage report
```

### CI/CD Pipeline (GitHub Actions)

**Workflow 1: ci.yml** (Runs on: all pushes/PRs to develop, staging, main)

- Install dependencies (pnpm with caching)
- Type-check (tsc --noEmit)
- Lint (pnpm lint)
- Format check (prettier --check)
- Unit tests with coverage (75% threshold enforced)
- Build Next.js (pnpm build)

**Workflow 2: e2e.yml** (Runs on: PRs to staging, main only)

- Install dependencies
- Install Playwright browsers
- Build Next.js app
- Run Playwright E2E tests
- Upload test results on failure (7-day retention)

**Workflow 3: secret-scan.yml** (Runs on: all pushes/PRs)

- Install detect-secrets
- Scan for new secrets against baseline
- Fail if new secrets detected

**Workflow 4: deploy-firebase.yml** (Runs on: push to main only)

- Install Firebase CLI
- Install Functions dependencies
- Deploy Firebase Functions to production
- Requires `FIREBASE_TOKEN` GitHub secret

### Branch Protection Rules

**develop Branch:**

- Require PR before merge
- Require 1 approval
- Require `lint-and-test` + `scan-secrets` to pass
- Require conversation resolution

**staging Branch:**

- Require PR before merge
- Require 1 approval
- Require `lint-and-test` + `e2e-tests` + `scan-secrets` to pass
- Require conversation resolution

**main Branch (Production):**

- Require PR before merge
- Require 1 approval
- Require `lint-and-test` + `e2e-tests` + `scan-secrets` to pass
- Require conversation resolution
- Require linear history

For complete branching strategy, see [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)

---

## 📐 Development Conventions

### TypeScript Best Practices

1. **Always use strict mode** - Enabled in tsconfig.json
2. **Define types for all props, state, and functions**:

   ```typescript
   // ✅ Good
   interface GoogleSignInButtonProps {
     onSuccess: (user: UserProfile) => void;
     onError: (error: string) => void;
   }

   export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
     onSuccess,
     onError,
   }) => { ... };

   // ❌ Bad - no types
   export const GoogleSignInButton = ({ onSuccess, onError }) => { ... };
   ```

3. **Import types from centralized location**:

   ```typescript
   import type { UserProfile, UserRole } from '@/types/auth';
   ```

4. **Use type inference where obvious**:

   ```typescript
   // ✅ Good - inferred
   const [isLoading, setIsLoading] = useState(false);

   // ✅ Good - explicit when needed
   const [user, setUser] = useState<UserProfile | null>(null);
   ```

### Component Structure

Follow this pattern for all React components:

```typescript
'use client'; // Only if using hooks/interactivity

import { useState, useEffect } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  // 1. Hooks first
  const [state, setState] = useState<string>('');

  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 3. Event handlers
  const handleAction = () => {
    onAction();
  };

  // 4. Render
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
}
```

### File Naming Conventions

- **Components**: PascalCase - `GoogleSignInButton.tsx`, `ProtectedRoute.tsx`
- **Pages**: PascalCase - `page.tsx`, `layout.tsx` (Next.js App Router convention)
- **Utilities**: camelCase - `redirects.ts`, `config.ts`
- **Hooks**: camelCase with "use" prefix - `useAuthObserver.ts`, `useAuth.ts`
- **Stores**: camelCase with "Store" suffix - `authStore.ts`
- **Types**: camelCase - `auth.ts`, `index.ts`
- **Tests**: Same as source + `.test.ts` - `auth.test.ts`, `GoogleSignInButton.test.tsx`

### Folder Organization

When creating new features:

1. **Create feature folder in** `app/` (if route needed)
2. **Create components in** `components/[feature-name]/`
3. **Create utilities in** `lib/[feature-name]/`
4. **Create hooks in** `hooks/`
5. **Add types to** `types/` (separate files for each domain)
6. **Add tests to** `__tests__/` (mirror source structure)

---

## 🔐 Security Guidelines

### Firebase Security

**Authentication:**

- Use Firebase Auth tokens (1-hour expiry with auto-refresh)
- Never store passwords (Google OAuth only)
- Validate user roles server-side (Firestore rules + Cloud Functions)

**Firestore Security Rules:**

```javascript
// Development mode (will be tightened later)
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Admins can read all users
      allow read: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

**Environment Variables:**

- ✅ Store Firebase config in `.env.local` (gitignored)
- ✅ Use `NEXT_PUBLIC_*` prefix for client-side vars
- ❌ Never commit `.env.local` to git
- ✅ Provide `.env.local.example` as template

### Data Privacy

**User Data:**

- Store only essential fields: uid, email, name, birth details, role
- Admin role stored in Firestore (not in Firebase Auth custom claims for simplicity)
- Persona images stored in Cloud Storage with proper access rules

---

## 🧪 Testing Guidelines

### TDD Methodology (CRITICAL)

**We follow strict Test-Driven Development. Always write tests BEFORE implementation!**

#### TDD Workflow:

1. **🔴 RED Phase** - Write failing tests first
2. **🟢 GREEN Phase** - Write minimal code to pass tests
3. **🔵 REFACTOR Phase** - Improve code while keeping tests green
4. **REPEAT**

#### Test Scripts:

```bash
pnpm test                # Run all tests
pnpm test:watch          # TDD mode (auto-run on save)
pnpm test:coverage       # Coverage report (enforced: 75% threshold)
pnpm exec playwright test # E2E tests
```

#### Coverage Requirements:

**Enforced in CI:**

- **Lines**: 75% minimum
- **Functions**: 75% minimum
- **Branches**: 75% minimum
- **Statements**: 75% minimum

CI will fail if coverage drops below these thresholds. Run `pnpm test:coverage` locally to check before pushing.

#### Test Structure:

```typescript
// __tests__/lib/firebase/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { signInWithGoogle } from '@/lib/firebase/auth';

describe('Google Sign-In', () => {
  it('should call signInWithPopup with GoogleAuthProvider', async () => {
    // Arrange
    const mockSignInWithPopup = vi.fn();

    // Act
    await signInWithGoogle();

    // Assert
    expect(mockSignInWithPopup).toHaveBeenCalled();
  });
});
```

### Testing Checklist

Before committing:

- [ ] All unit tests pass (`pnpm test`)
- [ ] Coverage is 80%+ for new code
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format`)

---

## 🌐 Firebase Integration

### Initialization Pattern

```typescript
// lib/firebase/client-config.ts
export const firebaseClientConfig = {
  apiKey: 'AIza...', // Your Firebase API key
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abc123',
};

// lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { firebaseClientConfig } from './client-config';

// Singleton pattern
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseClientConfig) : getApps()[0];
```

**Note:** Firebase web config keys are meant to be public (browser-exposed). Security is enforced via Firestore Rules and Firebase Auth, not by hiding these values.

### Error Handling Pattern

```typescript
try {
  const result = await signInWithGoogle();
  return result;
} catch (error: any) {
  if (error.code === 'auth/popup-closed-by-user') {
    throw new Error('Sign-in cancelled');
  }
  if (error.code === 'auth/popup-blocked') {
    throw new Error('Popup blocked by browser. Please allow popups.');
  }
  throw error;
}
```

---

## 📝 Development Workflow

### Branching Strategy

We use a **three-branch strategy**:

- **`develop`** - Active development (fast CI: lint, test, build)
- **`staging`** - Pre-production testing (full CI: lint, test, E2E, build)
- **`main`** - Production (full CI + Firebase deployment)

**Merge Flow**: `feature/*` → `develop` → `staging` → `main`

**For complete details, see [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)**

### Local Development

**Pre-commit hook (automatic):**

- Secret detection (detect-secrets)
- ESLint + Prettier on staged files

**Pre-push hook (automatic):**

- TypeScript type-check
- Unit tests (Vitest)

**Manual commands:**

- `pnpm lint` - Run ESLint
- `pnpm format` - Auto-format with Prettier
- `pnpm type-check` - TypeScript validation
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once

### Feature Development Workflow

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Develop with TDD
# - Write tests first (RED)
# - Implement code (GREEN)
# - Refactor (REFACTOR)

# 4. Commit (pre-commit hook runs automatically)
git add .
git commit -m "feat: add my feature

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
# Hook will run: detect-secrets + lint-staged

# 5. Push (pre-push hook runs automatically)
git push origin feature/my-feature
# Hook will run: type-check + tests

# 6. Create PR to develop on GitHub
# GitHub Actions will run: ci.yml + secret-scan.yml
```

### Quick Branch Reference

| Branch    | CI Actions                 | E2E Tests | Firebase Deploy |
| --------- | -------------------------- | --------- | --------------- |
| `develop` | ✅ Lint, Type, Test, Build | ❌ No     | ❌ No           |
| `staging` | ✅ All from develop        | ✅ Yes    | ❌ No           |
| `main`    | ✅ All from staging        | ✅ Yes    | ✅ Yes          |

---

## 🎨 UI/UX Guidelines

### Design Principles

1. **Clean & Simple**: Avoid clutter, use whitespace effectively
2. **Mobile-First**: Responsive design with Tailwind breakpoints
3. **Accessible**: WCAG 2.1 AA compliance (color contrast, ARIA labels)
4. **Consistent**: Reusable components with consistent styling

### Tailwind Conventions

```typescript
// ✅ Good - utility classes
<button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
  Sign In
</button>

// ❌ Bad - inline styles
<button style={{ padding: '8px 16px', backgroundColor: '#4F46E5' }}>
  Sign In
</button>
```

### Accessibility

All interactive elements must have:

- `accessibilityLabel` or `aria-label`
- Proper semantic HTML (`<button>`, `<nav>`, `<main>`)
- Sufficient color contrast (4.5:1 minimum)
- Keyboard navigation support

---

## 📦 Deployment

### Frontend (Hostinger)

**Method**: Manual FTP/SFTP upload

**Build Command**:

```bash
pnpm build
```

**Output**: `out/` directory (Next.js static export)

**Upload**:

- Use FTP/SFTP client to upload `out/` contents to Hostinger
- Ensure all files are uploaded to the correct directory

**When to Deploy**:

- After merging to `main` branch
- After successful CI checks pass
- After Firebase Functions are deployed

---

### Backend (Firebase Cloud Functions)

**Method**: Automated via GitHub Actions

**Trigger**: Push to `main` branch

**Workflow**: `.github/workflows/deploy-firebase.yml`

**What Gets Deployed**:

- All functions in `/functions` directory
- Currently: `onUserCreate` auth trigger

**Manual Deployment** (if needed):

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

### Firebase CI Token Setup (One-time)

**Generate token for CI/CD**:

```bash
firebase login:ci
```

**Copy the token output**, then:

1. Go to GitHub repository Settings → Secrets → Actions
2. Click "New repository secret"
3. Name: `FIREBASE_TOKEN`
4. Value: [paste token from above]
5. Click "Add secret"

**Test deployment**:

```bash
# Dry run to verify token works
firebase deploy --only functions --token [your-token] --dry-run
```

---

## 🚨 Important Notes

### Key Decisions & Gotchas

1. **Firebase Auth Token Refresh**
   - Tokens expire after 1 hour
   - Auto-refresh handled by Firebase SDK
   - Use `onAuthStateChanged` listener to keep state synced

2. **Static Export Limitation**
   - Next.js deployed as static files to Hostinger
   - No server-side API routes (use Firebase Functions instead)
   - No server-side rendering at runtime (SSG only)

3. **Role-Based Access**
   - Role stored in Firestore `users` collection (not Firebase Auth custom claims)
   - Simpler for single-admin model
   - Checked client-side + Firestore rules for security

4. **Payment Flow**
   - Razorpay integration required for production
   - Webhook handling via Firebase Cloud Function
   - Credit allocation after payment confirmation

5. **Claude Code Sandbox PATH Requirements** (Feature 1 Learning)
   - Homebrew's `/opt/homebrew/bin` NOT in default PATH
   - Solution: Prefix commands with `export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH" &&`
   - Git commands require full path: `/usr/bin/git`
   - Affects: node, npm, pnpm, git, grep, sort

6. **Firebase Cloud Functions v2 API** (Feature 1 Learning)
   - Initially tried v2 `onUserCreated` but had import issues
   - Reverted to v1 `functions.auth.user().onCreate()` - stable and well-documented
   - Works perfectly for auth triggers

7. **Firebase Configuration Pattern** (Feature 1 - Resolved)
   - Firebase web config keys are public by design (browser-exposed)
   - Using direct config import: `lib/firebase/client-config.ts`
   - **Why not env vars?**: Next.js 15/16 has bugs loading `NEXT_PUBLIC_*` vars in dev mode
   - **Security**: Protected by Firestore Rules + Firebase Auth, not by hiding config
   - **Multiple environments**: If needed later, create `client-config.dev.ts`, `client-config.prod.ts` and import based on `process.env.NODE_ENV`
   - See: https://firebase.google.com/docs/projects/learn-more#config-object-explained

8. **Test Separation Strategy** (Feature 1 - Established)
   - **Frontend Tests** (vitest): 51 tests for Next.js components, hooks, and utilities
   - **E2E Tests** (Playwright): Excluded from vitest via `exclude: ['**/e2e/**']`, run separately via `.github/workflows/e2e.yml`
   - **Functions Tests**: Excluded from vitest via `exclude: ['**/functions/**']` - Cloud Functions have separate environment with own `package.json` and dependencies
   - **Why separate?**: Different test runners, different environments, different dependency trees
   - **CI Strategy**: Unit tests run on all branches; E2E tests only on PRs to `staging` and `main` (see BRANCHING_STRATEGY.md)

9. **Vitest Configuration Pattern** (Feature 1 - Established)
   - Exclude patterns in `vitest.config.ts`:
     - `**/e2e/**` - Playwright tests (different runner)
     - `**/functions/**` - Cloud Functions (separate package.json, own tsconfig.json)
     - `**/node_modules/**`, `**/dist/**` - Standard exclusions
   - Coverage excludes: `__tests__/`, `**/*.config.*`, `**/*.d.ts`, `**/types/**`, `e2e/**`, `functions/**`
   - Mirrors TypeScript and Prettier exclusion patterns for `functions/` directory (see commits af17005, 7484157)

### Tech Debt Register (Feature 99)

**Purpose:** Track deferred fixes, workarounds, and improvements that need to be addressed before production.

**File:** [tasks-chinmay_astro-feature-99-tech-debt.md](tasks/tasks-chinmay_astro-feature-99-tech-debt.md)

**When to add tech debt:**

- Implemented a workaround instead of proper solution
- Found issue but fixing would derail current feature
- Deferred optimization or improvement
- Missing test coverage or documentation

**How agents should use it:**

```bash
# When encountering a tech debt item during development:
# Add entry to tasks/tasks-chinmay_astro-feature-99-tech-debt.md
# Follow the template format in the file
# Include: Priority (P0-P3), Category, Affected Files, Fix Required, Validation

# After all 8 features complete (or when P0/P1 items accumulate):
/process-tasks tasks/tasks-chinmay_astro-feature-99-tech-debt.md
```

**Current Status:** 1 pending item

- TD-002: Firebase CI Authentication Using Deprecated login:ci Method [P2]

**Process As:** Feature 99 (after Features 1-8 or when critical)

### Feature 1 Patterns Established

**Authentication Patterns:**

- `useAuthObserver` hook syncs Firebase Auth → Zustand store
- Centralized error handling in `lib/utils/errors.ts`
- Route constants in `lib/constants/routes.ts`
- Protected routes use `ProtectedRoute` HOC with role-based access

**State Management:**

- Zustand store for auth state (user, loading)
- Actions: `setUser`, `setLoading`, `clearAuth`
- Store accessed via `useAuthStore` hook

**Firebase Integration:**

- Singleton pattern for Firebase app initialization
- Direct config import from `lib/firebase/client-config.ts` (no env vars needed)
- Firebase web config keys are public by design (security via Firestore Rules)
- Firestore Timestamp → Date conversion in user operations
- Cloud Function creates user profile + sessionCredits on signup

**Component Patterns:**

- 'use client' directive for hooks/interactivity
- Loading states with spinner
- Error messages displayed in UI
- Accessibility: ARIA labels, semantic HTML

**Testing Strategy:**

- Unit tests with Vitest + React Testing Library
- E2E tests with Playwright (login flow, protected routes, navigation)
- Mocks in `__tests__/mocks/`, fixtures in `__tests__/fixtures/`
- Test scripts: `pnpm test`, `pnpm test:e2e`

### Parked Issues

(None - Feature 1 complete and working)

---

## 🔍 Where to Find Answers

### Code Questions

1. Check existing similar components first (when available)
2. Refer to Next.js docs: https://nextjs.org/docs
3. Check Firebase docs: https://firebase.google.com/docs
4. Check React docs: https://react.dev

### Product Questions

1. **Feature requirements**: Check PRD in `tasks/prd-chinmay-astro-web-app.md`
2. **User flows**: See PRD User Stories section
3. **Technical architecture**: See `tasks/tdd-chinmay-astro-web-app.md`

### Testing Questions

1. **Unit testing**: Vitest docs: https://vitest.dev
2. **Component testing**: React Testing Library: https://testing-library.com/react
3. **E2E testing**: Playwright: https://playwright.dev

---

## ✅ Before Starting Each Feature

1. **Read the relevant task file** from `tasks/` directory
2. **Review this CLAUDE.md** for context and conventions
3. **Check existing code** for similar patterns
4. **Run tests** to ensure clean start: `pnpm test`
5. **Create feature branch**: `git checkout -b feature/feature-name`

---

## 🌟 Remember

1. **TDD Always**: Write tests before implementation (RED → GREEN → REFACTOR)
2. **Type Safety**: Use TypeScript strict mode, no `any` types
3. **Clean Code**: Follow ESLint and Prettier rules
4. **Accessible UI**: WCAG 2.1 AA compliance
5. **Security First**: Validate on both client and server (Firestore rules)
6. **Document Decisions**: Add important notes to this file
7. **Ask Questions**: Better to clarify than assume
8. **Reference PRD/TDD**: Product and technical docs are source of truth

---

## 🚨 Need Help?

When asking for help, provide:

1. **Context**: What feature are you working on?
2. **What you've tried**: Show your code attempts
3. **Error messages**: Full error output
4. **Related files**: Mention which files you're working with
5. **PRD/TDD reference**: Which section relates to this?

---

**Last Updated**: October 31, 2025
**Version**: 1.0
**Project Status**: Initial setup complete, starting Feature 1 (Authentication)

---

**Quick Start for New Session:**

1. Read this file (CLAUDE.md)
2. Review relevant task file from `tasks/` directory
3. Check PRD (`tasks/prd-chinmay-astro-web-app.md`) for feature requirements
4. Check TDD (`tasks/tdd-chinmay-astro-web-app.md`) for technical decisions
5. Start coding following TDD and conventions above

**Happy Building! 🚀**
