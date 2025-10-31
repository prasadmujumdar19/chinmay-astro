# CLAUDE.md - Context Guide for Chinmay Astro Development

> **Purpose**: This file provides essential context for AI assistants (Claude) working on Chinmay Astro feature development. Read this file at the start of each session to understand the project structure, conventions, and best practices.

**Last Updated**: October 31, 2025
**Project**: Chinmay Astro - Astrology Consultation Web Application
**Status**: Feature 1 (Authentication) Complete ✅

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
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions

### Deployment
- **Hosting**: Hostinger (static files from Next.js export)
- **Backend**: Firebase (fully managed, serverless)

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
pnpm test:coverage       # Coverage report (target: 80%+)
pnpm exec playwright test # E2E tests
```

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
// lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

// Singleton pattern
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
```

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
- **`main`** - Production (protected, requires PR)
- **`staging`** - Pre-production testing
- **`develop`** - Active development (default branch for features)

**Merge Flow**: `feature/*` → `develop` → `staging` → `main`

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

# 4. Before committing
pnpm type-check
pnpm lint
pnpm test

# 5. Commit (Husky will run pre-commit hooks)
git add .
git commit -m "feat: add my feature

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# 6. Push and create PR to develop
git push origin feature/my-feature
# Create PR on GitHub targeting 'develop' branch
```

### Quick Branch Reference

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production | Requires PR approval |
| `staging` | Pre-production testing | Requires PR from develop |
| `develop` | Active development | Default for feature branches |
| `feature/*` | Individual features | Merges to develop |

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
- Environment variable validation in config
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
