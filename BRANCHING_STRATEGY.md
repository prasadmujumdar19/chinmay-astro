# Branching Strategy - Chinmay Astro

**Last Updated**: November 2, 2025

This document outlines the Git branching strategy and CI/CD workflows for the Chinmay Astro project.

---

## 🎯 Overview

We follow a **three-branch strategy** optimized for feature development while preventing premature deployments:

- **`develop`** - Active development branch
- **`staging`** - Pre-production testing
- **`main`** - Production-ready code only

---

## 🌲 Branch Structure

```
main (production)
  ↓
  ├── staging (pre-production)
        ↓
        ├── develop (active development)
              ↓
              ├── feature/* (feature branches)
```

### Branch Details

#### 1. `develop` Branch

- **Purpose**: Active development work
- **Protected**: Yes (require PR reviews)
- **CI/CD Actions**:
  - ✅ Linting (ESLint)
  - ✅ Type checking (TypeScript)
  - ✅ Code formatting check (Prettier)
  - ✅ Unit tests (Vitest with 75% coverage threshold)
  - ✅ Build verification (Next.js static export)
  - ❌ **No E2E tests**
  - ❌ **No deployments**

**When to use:**

- Daily development work
- Merging feature branches
- Integration of multiple features

#### 2. `staging` Branch

- **Purpose**: Pre-production testing and QA
- **Protected**: Yes (require PR reviews)
- **CI/CD Actions**:
  - ✅ All checks from `develop`
  - ✅ **E2E tests** (Playwright)
  - ❌ **No deployments** (Hostinger deployment is manual)

**When to use:**

- Testing features before production
- QA validation
- Integration testing

#### 3. `main` Branch (Production)

- **Purpose**: Production-ready code only
- **Protected**: Yes (require PR reviews + status checks)
- **CI/CD Actions**:
  - ✅ All checks from `develop`
  - ✅ **E2E tests** (Playwright)
  - ✅ **Firebase Functions deployment** (automated)

**When to use:**

- Releasing to production
- Deploying backend changes

---

## 🔄 Workflow & Merge Flow

### Standard Development Workflow

```
1. Create feature branch from develop
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature

2. Develop and commit changes
   # Pre-commit hook runs automatically:
   # - detect-secrets scan
   # - ESLint + Prettier on staged files
   git add .
   git commit -m "feat: add my feature"

3. Push to remote
   # Pre-push hook runs automatically:
   # - TypeScript type-check
   # - Unit tests
   git push origin feature/my-feature

4. Create PR to develop on GitHub
   # GitHub Actions run:
   # - Lint, type-check, format-check
   # - Unit tests with coverage
   # - Next.js build
   # - Secret scan

5. After PR approval, merge to develop
   # No E2E tests, no deployments

6. When ready for testing, create PR from develop → staging
   # GitHub Actions run:
   # - All checks from step 4
   # - E2E tests (Playwright)

7. After QA approval, create PR from staging → main
   # GitHub Actions run:
   # - All checks from step 6
   # - Firebase Functions deployment (automated)

8. Manual: Deploy frontend to Hostinger
   # Build: pnpm build
   # Upload: FTP/SFTP upload of out/ directory
```

### Quick Reference

| From Branch | To Branch | Trigger  | Actions                                            |
| ----------- | --------- | -------- | -------------------------------------------------- |
| `feature/*` | `develop` | PR merge | Lint, Type Check, Format, Test, Build, Secret Scan |
| `develop`   | `develop` | Push     | Same as above                                      |
| `develop`   | `staging` | PR       | All above + **E2E Tests**                          |
| `staging`   | `staging` | Push     | All above + **E2E Tests**                          |
| `staging`   | `main`    | PR       | All above + **E2E Tests** + **Firebase Deploy**    |
| `main`      | `main`    | Push     | All above + **E2E Tests** + **Firebase Deploy**    |

---

## 🛠️ Feature Development Guide

### Starting a New Feature

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/user-dashboard

# 3. Develop your feature
# ... make changes ...

# 4. Commit your work
# Pre-commit hook runs: detect-secrets + lint-staged
git add .
git commit -m "feat: implement user dashboard"

# 5. Push to remote
# Pre-push hook runs: type-check + tests
git push origin feature/user-dashboard

# 6. Create Pull Request on GitHub
# - Base: develop
# - Compare: feature/user-dashboard
# - CI will run: lint, type-check, format-check, tests, build
```

### Feature Branch Naming Convention

Use descriptive names with prefixes:

- `feature/` - New features (e.g., `feature/payment-integration`)
- `fix/` - Bug fixes (e.g., `fix/auth-redirect`)
- `refactor/` - Code refactoring (e.g., `refactor/firebase-config`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `chore/` - Maintenance tasks (e.g., `chore/update-deps`)

---

## 📦 Release Process

### Releasing to Staging

```bash
# 1. Ensure develop is stable and tested locally
git checkout develop
git pull origin develop

# 2. Create PR from develop to staging on GitHub
# Title: "Release to Staging - [Date or Version]"
# Description: List of features/fixes included

# 3. After PR approval and merge:
# - GitHub Actions will automatically:
#   ✅ Run linting and type checks
#   ✅ Run unit tests with coverage
#   ✅ Run E2E tests (Playwright)
#   ✅ Build Next.js app

# 4. Test on staging environment
# - Verify all features work as expected
# - Validate Firebase integration
```

### Releasing to Production

```bash
# 1. Ensure staging is fully tested and approved
git checkout staging
git pull origin staging

# 2. Create PR from staging to main on GitHub
# Title: "Production Release - v[X.Y.Z]"
# Description:
#   - Release notes
#   - Features included
#   - Bug fixes
#   - Breaking changes (if any)

# 3. After PR approval and merge:
# - GitHub Actions will automatically:
#   ✅ Run linting and type checks
#   ✅ Run unit tests with coverage
#   ✅ Run E2E tests (Playwright)
#   ✅ Build Next.js app
#   ✅ Deploy Firebase Functions to production

# 4. Manual: Deploy frontend to Hostinger
pnpm build
# Upload out/ directory via FTP/SFTP

# 5. Monitor deployment
# - Check GitHub Actions logs
# - Verify Firebase Functions deployed correctly
# - Test production site
```

---

## 🔒 Branch Protection Rules

### Recommended Settings (GitHub)

#### `develop` Branch

- [x] Require pull request before merging
- [x] Require approvals (1)
- [x] Require status checks to pass
  - `lint-and-test` (from ci.yml)
  - `scan-secrets` (from secret-scan.yml)
- [x] Require conversation resolution before merging
- [ ] Do not allow bypassing settings

#### `staging` Branch

- [x] Require pull request before merging
- [x] Require approvals (1)
- [x] Require status checks to pass
  - `lint-and-test` (from ci.yml)
  - `e2e-tests` (from e2e.yml)
  - `scan-secrets` (from secret-scan.yml)
- [x] Require conversation resolution before merging
- [ ] Do not allow bypassing settings

#### `main` Branch

- [x] Require pull request before merging
- [x] Require approvals (1)
- [x] Require status checks to pass
  - `lint-and-test` (from ci.yml)
  - `e2e-tests` (from e2e.yml)
  - `scan-secrets` (from secret-scan.yml)
- [x] Require conversation resolution before merging
- [x] Require linear history
- [ ] Do not allow bypassing settings

---

## 🚀 CI/CD Pipeline Details

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**

- Push to `develop`, `staging`, `main`
- Pull requests to `develop`, `staging`, `main`

**Jobs:**

1. **lint-and-test** (Runs on all branches)
   - Type-check (tsc --noEmit)
   - ESLint
   - Prettier format check
   - Unit tests with coverage (75% threshold)
   - Next.js build

**Caching Strategy:**

- pnpm store cached based on pnpm-lock.yaml hash
- Speeds up CI runs by ~3-4x

### E2E Workflow (`.github/workflows/e2e.yml`)

**Triggers:**

- Pull requests to `staging`, `main` only

**Jobs:**

1. **e2e-tests**
   - Install Playwright browsers
   - Build Next.js app
   - Run Playwright E2E tests
   - Upload test results on failure (7-day retention)

### Secret Scan Workflow (`.github/workflows/secret-scan.yml`)

**Triggers:**

- All pushes and pull requests

**Jobs:**

1. **scan-secrets**
   - Install detect-secrets
   - Scan for new secrets against baseline
   - Fail if new secrets detected

### Firebase Deployment (`.github/workflows/deploy-firebase.yml`)

**Triggers:**

- Push to `main` only

**Jobs:**

1. **deploy**
   - Install Firebase CLI
   - Install Functions dependencies
   - Deploy to Firebase using FIREBASE_TOKEN

**Note:** Requires `FIREBASE_TOKEN` secret in GitHub repository settings.

---

## ⚠️ Important Notes

### 1. **Never Push Directly to Protected Branches**

Always use Pull Requests, even for small fixes. This ensures:

- Code review happens
- CI/CD checks pass
- Audit trail is maintained

### 2. **Keep Branches In Sync**

After merging to `main`, sync changes back to `staging` and `develop`:

```bash
# After production release, sync changes back
git checkout staging
git merge main
git push origin staging

git checkout develop
git merge staging
git push origin develop
```

### 3. **Hotfix Process**

For urgent production fixes:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix the bug
git add .
git commit -m "fix: critical bug in production"

# 3. Create PR to main
git push origin hotfix/critical-bug
# Create PR targeting 'main'

# 4. After merge, sync back to staging and develop
git checkout staging
git merge main
git push origin staging

git checkout develop
git merge staging
git push origin develop
```

### 4. **Local Git Hooks**

Pre-commit hook (automatic):

- Secret detection via detect-secrets
- ESLint + Prettier on staged files

Pre-push hook (automatic):

- TypeScript type-check
- Unit tests (Vitest)

**To bypass hooks** (not recommended):

```bash
git commit --no-verify  # Skip pre-commit
git push --no-verify    # Skip pre-push
```

---

## 🧪 Testing Strategy by Branch

### `develop` Branch

- **Unit tests** (Vitest, 75% coverage required)
- **Local manual testing**
- **TypeScript strict mode compliance**
- **Secret detection**

### `staging` Branch

- All tests from `develop`
- **E2E tests** (Playwright)
- **Integration testing** with Firebase backend
- **Feature validation**

### `main` Branch

- All tests from `staging`
- **Final smoke testing** on production build
- **Production monitoring** (post-deployment)

---

## ✅ Deployment Checklist

### Before Merging to Staging

- [ ] All features tested locally
- [ ] TypeScript strict mode passes
- [ ] Linting passes (no errors)
- [ ] Code formatted with Prettier
- [ ] Unit tests pass with 75%+ coverage
- [ ] No secrets detected
- [ ] Code reviewed by at least 1 person
- [ ] No merge conflicts with `staging`

### Before Merging to Production

- [ ] All checks from staging checklist
- [ ] E2E tests pass on staging
- [ ] Firebase Functions tested on staging
- [ ] Release notes prepared
- [ ] Version number updated (if applicable)
- [ ] Breaking changes documented
- [ ] Rollback plan defined
- [ ] Hostinger deployment plan ready

---

## 🔧 Troubleshooting

### GitHub Actions Failing on `develop`

**Symptom:** Linting, type-check, or test failures

**Fix:**

```bash
# Check locally
pnpm lint          # Check for linting errors
pnpm type-check    # Check for TypeScript errors
pnpm format        # Auto-fix formatting
pnpm test:run      # Run tests
pnpm test:coverage # Check coverage
```

### E2E Tests Failing on `staging`

**Symptom:** Playwright test failures

**Fix:**

1. Run E2E tests locally:
   ```bash
   pnpm build
   pnpm test:e2e
   ```
2. Check test reports in `playwright-report/`
3. Update tests or fix application bugs

### Firebase Deployment Failing

**Symptom:** deploy-firebase.yml workflow errors

**Fix:**

1. Check GitHub Actions logs for detailed error
2. Verify `FIREBASE_TOKEN` secret is set correctly:
   - Go to GitHub repo Settings → Secrets → Actions
   - Ensure `FIREBASE_TOKEN` exists and is valid
3. Test deployment locally:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```
4. Check Firebase Console for function deployment status

### Pre-commit Hook Failing

**Symptom:** Commit blocked by detect-secrets or lint-staged

**Fix:**

```bash
# If secrets detected (false positive):
# Add to .secrets.baseline and commit it

# If linting errors:
pnpm lint:fix      # Auto-fix linting issues
pnpm format        # Auto-format code

# Then try committing again
```

### Pre-push Hook Failing

**Symptom:** Push blocked by type-check or tests

**Fix:**

```bash
# Fix type errors
pnpm type-check

# Fix failing tests
pnpm test:watch  # Run tests in watch mode
pnpm test:coverage  # Check coverage

# Then try pushing again
```

---

## 📚 Additional Resources

- [GitHub Flow Documentation](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Next.js Static Export](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Playwright Documentation](https://playwright.dev)
- [Project Context Guide](CLAUDE.md)
- [Prerequisites Guide](PREREQUISITES_TO_PROCESS_TASKS.md)

---

## 🔄 Keeping This Document Updated

When making changes to the branching strategy or CI/CD workflows:

1. Update this document (`BRANCHING_STRATEGY.md`)
2. Update [CLAUDE.md](CLAUDE.md) development workflow section
3. Commit changes with descriptive message
4. Notify collaborators if working in a team

---

**Questions or Issues?**

- Check [CLAUDE.md](CLAUDE.md) for development guidelines
- Review GitHub Actions logs for CI/CD issues
- Consult Firebase documentation for backend-specific issues

---

**Last Updated**: November 2, 2025
**Version**: 1.0
**Project**: Chinmay Astro - Astrology Consultation Web Application
