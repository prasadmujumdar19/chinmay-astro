# Prerequisites to Running process-tasks Agent

**Document Version:** 1.1
**Last Updated:** 2025-11-02
**Project:** Chinmay Astro Web Application

---

## Overview

This document provides **complete step-by-step instructions** for setting up your development environment before running the `process-tasks` agent. Follow these steps in order to ensure a smooth implementation process.

**Estimated Time:** 30-45 minutes (first time setup)

---

## Table of Contents

1. [System Requirements Check](#1-system-requirements-check)
2. [Node.js Installation](#2-nodejs-installation)
3. [pnpm Package Manager Installation](#3-pnpm-package-manager-installation)
4. [Git Configuration](#4-git-configuration)
5. [GitHub Repository Setup](#5-github-repository-setup)
6. [Firebase Project Setup](#6-firebase-project-setup)
7. [Environment Variables Configuration](#7-environment-variables-configuration)
8. [Final Verification](#8-final-verification)
9. [Ready to Run process-tasks](#9-ready-to-run-process-tasks)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. System Requirements Check

### 1.1 Check Current Versions

Open your terminal and run these commands to check what you already have:

```bash
# Check Node.js version
node --version

# Check npm (comes with Node.js)
npm --version

# Check pnpm
pnpm --version

# Check Git
git --version

# Check your operating system
uname -a
```

### 1.2 Minimum Required Versions

| Tool    | Minimum Version | Recommended Version | Your Version     |
| ------- | --------------- | ------------------- | ---------------- |
| Node.js | 18.0.0          | 20.x.x              | \***\*\_\_\*\*** |
| pnpm    | 8.0.0           | 9.x.x               | \***\*\_\_\*\*** |
| Git     | 2.30.0          | Latest              | \***\*\_\_\*\*** |
| macOS   | 11.0 (Big Sur)  | Latest              | \***\*\_\_\*\*** |

**Action Required:**

- [ ] Note your current versions above
- [ ] Proceed to installation sections if versions are outdated or missing

---

## 2. Node.js Installation

### 2.1 Check if Node.js is Installed

```bash
node --version
```

**Expected Output:** `v20.x.x` or `v18.x.x`

If you get `command not found`, proceed with installation.

### 2.2 Installation Method 1: Using Homebrew (Recommended)

**Step 1: Install Homebrew (if not installed)**

```bash
# Check if Homebrew is installed
brew --version

# If not installed, install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Step 2: Install Node.js**

```bash
# Install Node.js 20 (LTS version)
brew install node@20

# Link it to your PATH
brew link node@20

# Verify installation
node --version
npm --version
```

**Expected Output:**

```
node --version: v20.x.x
npm --version: 10.x.x
```

### 2.3 Installation Method 2: Using NVM (Node Version Manager)

**Recommended if you work on multiple Node.js projects with different versions.**

**Step 1: Install NVM**

```bash
# Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Add NVM to your shell profile
# For zsh (default on modern macOS):
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc

# For bash:
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bash_profile
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bash_profile

# Reload shell configuration
source ~/.zshrc  # or source ~/.bash_profile
```

**Step 2: Install Node.js via NVM**

```bash
# Install Node.js 20 LTS
nvm install 20

# Set it as default
nvm alias default 20

# Use it
nvm use 20

# Verify
node --version
npm --version
```

**Expected Output:**

```
node --version: v20.x.x
npm --version: 10.x.x
```

### 2.4 Verify Installation

```bash
# Test Node.js
node -e "console.log('Node.js works!')"

# Test npm
npm -v
```

**Expected Output:**

```
Node.js works!
10.x.x
```

**Action Required:**

- [ ] Node.js installed successfully
- [ ] Version is 18.x or higher
- [ ] npm is working

---

## 3. pnpm Package Manager Installation

### 3.1 Why pnpm?

**pnpm** is a fast, disk space-efficient package manager. Unlike Python's pip, Node.js has multiple package managers:

- **npm** (default, comes with Node.js)
- **yarn** (popular alternative)
- **pnpm** (fastest, most efficient) ← **We're using this**

Think of it as a better pip for JavaScript.

### 3.2 Install pnpm

**Method 1: Using npm (Recommended)**

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

**Expected Output:** `9.x.x` or `8.x.x`

**Method 2: Using Homebrew**

```bash
# Install pnpm via Homebrew
brew install pnpm

# Verify installation
pnpm --version
```

**Method 3: Using Standalone Script**

```bash
# Download and install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Reload shell
source ~/.zshrc  # or source ~/.bash_profile

# Verify
pnpm --version
```

### 3.3 Configure pnpm (Optional but Recommended)

```bash
# Set up pnpm store location (saves disk space across projects)
pnpm config set store-dir ~/.pnpm-store

# Verify configuration
pnpm config list
```

### 3.4 Test pnpm

```bash
# Test pnpm
pnpm --version

# Test pnpm help
pnpm help
```

**Action Required:**

- [ ] pnpm installed successfully
- [ ] Version is 8.x or higher
- [ ] `pnpm --version` works

---

## 4. Git Configuration

### 4.1 Check Git Installation

```bash
# Check Git version
git --version
```

**Expected Output:** `git version 2.x.x`

If not installed:

```bash
# Install Git via Homebrew
brew install git

# Verify
git --version
```

### 4.2 Configure Git Identity

**This is required for commits to work.**

```bash
# Set your name (will appear in commits)
git config --global user.name "Your Full Name"

# Set your email (should match your GitHub email)
git config --global user.email "your.email@example.com"

# Set default branch name to 'main'
git config --global init.defaultBranch main

# Verify configuration
git config --global --list
```

**Expected Output:**

```
user.name=Your Full Name
user.email=your.email@example.com
init.defaultbranch=main
```

### 4.3 Configure Git Editor (Optional)

```bash
# Set VS Code as default editor (if you use VS Code)
git config --global core.editor "code --wait"

# OR set nano (simpler, terminal-based)
git config --global core.editor "nano"

# OR set vim (if you're comfortable with vim)
git config --global core.editor "vim"
```

### 4.4 Initialize Git Repository (Local)

**Navigate to your project directory:**

```bash
cd /Users/prasadmujumdar/Downloads/ChinmayAstro

# Check if git is already initialized
git status
```

**If you see:** `fatal: not a git repository`

```bash
# Initialize git repository
git init

# Verify
git status
```

**Expected Output:**

```
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        tasks/
        ...
```

### 4.5 Create .gitignore File

```bash
# Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env*.local

# Testing
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# Playwright
test-results/
playwright-report/
EOF

# Verify .gitignore was created
cat .gitignore
```

### 4.6 Create Initial Commit

```bash
# Add all files
git add .

# Create initial commit
git commit -m "docs: add PRD and Feature 1 task list

Initial project setup with:
- Product Requirements Document (PRD)
- Technical Design Document (TDD)
- Feature 1 (Authentication) task list
- Prerequisites documentation

Generated with Claude Code task-generator agent."

# Verify commit
git log --oneline
```

**Expected Output:**

```
a1b2c3d (HEAD -> main) docs: add PRD and Feature 1 task list
```

**Action Required:**

- [ ] Git installed and configured
- [ ] Git identity set (name and email)
- [ ] Local repository initialized
- [ ] .gitignore created
- [ ] Initial commit created

---

## 5. GitHub Repository Setup

### 5.1 Create GitHub Account (if needed)

If you don't have a GitHub account:

1. Go to [github.com](https://github.com)
2. Click "Sign up"
3. Follow the registration process
4. Verify your email

### 5.2 Install GitHub CLI (Optional but Recommended)

**GitHub CLI** makes it easy to create repositories from the command line.

```bash
# Install GitHub CLI via Homebrew
brew install gh

# Verify installation
gh --version
```

**Expected Output:** `gh version 2.x.x`

**Authenticate with GitHub:**

```bash
# Login to GitHub
gh auth login

# Follow the interactive prompts:
# 1. Select: GitHub.com
# 2. Select: HTTPS
# 3. Select: Login with a web browser
# 4. Copy the one-time code shown
# 5. Press Enter to open browser
# 6. Paste code and authorize

# Verify authentication
gh auth status
```

**Expected Output:**

```
✓ Logged in to github.com as YOUR_USERNAME
```

### 5.3 Create Remote GitHub Repository

**Method 1: Using GitHub CLI (Recommended)**

```bash
# Navigate to project directory
cd /Users/prasadmujumdar/Downloads/ChinmayAstro

# Create repository
gh repo create chinmay-astro \
  --public \
  --source=. \
  --remote=origin \
  --description="Chinmay Astro - Astrology consultation web application"

# Verify remote was added
git remote -v
```

**Expected Output:**

```
origin  https://github.com/YOUR_USERNAME/chinmay-astro.git (fetch)
origin  https://github.com/YOUR_USERNAME/chinmay-astro.git (push)
```

**Method 2: Using GitHub Web UI**

**Step 1: Create repository on GitHub.com**

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `chinmay-astro`
3. Description: `Chinmay Astro - Astrology consultation web application`
4. Visibility: **Public** (or Private if you prefer)
5. **DO NOT** check:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
6. Click "Create repository"

**Step 2: Connect local repository to remote**

```bash
# Navigate to project directory
cd /Users/prasadmujumdar/Downloads/ChinmayAstro

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/chinmay-astro.git

# Verify remote
git remote -v
```

### 5.4 Push Initial Commit to GitHub

```bash
# Ensure you're on main branch
git branch -M main

# Push to GitHub
git push -u origin main

# Verify push succeeded
git log --oneline
```

**If you encounter authentication issues:**

```bash
# Use personal access token (PAT)
# 1. Go to: https://github.com/settings/tokens
# 2. Generate new token (classic)
# 3. Select scopes: repo, workflow
# 4. Copy the token
# 5. Use it as password when pushing

# OR configure credential helper
git config --global credential.helper osxkeychain
```

### 5.5 Verify Repository on GitHub

1. Go to `https://github.com/YOUR_USERNAME/chinmay-astro`
2. You should see:
   - `tasks/` directory
   - `.gitignore` file
   - Initial commit message

**Action Required:**

- [ ] GitHub account created/available
- [ ] GitHub CLI installed and authenticated (optional)
- [ ] Remote repository created
- [ ] Local repository connected to remote
- [ ] Initial commit pushed successfully
- [ ] Repository visible on GitHub.com

---

## 6. Firebase Project Setup

### 6.1 Create Firebase Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. If first time, accept Terms of Service

### 6.2 Create Firebase Project

**Step 1: Create Project**

1. Click "Add project" or "Create a project"
2. Project name: `chinmay-astro` (or `chinmay-astro-prod`)
3. Click "Continue"
4. Google Analytics: **Enable** (recommended)
5. Select or create Analytics account
6. Click "Create project"
7. Wait for project creation (30-60 seconds)
8. Click "Continue"

**Step 2: Register Web App**

1. In Firebase Console, click the **Web** icon (`</>`)
2. App nickname: `Chinmay Astro Web`
3. **DO NOT** check "Also set up Firebase Hosting"
4. Click "Register app"
5. **IMPORTANT:** Copy the `firebaseConfig` object shown

**You'll see something like this:**

```javascript
const firebaseConfig = {
  apiKey: 'AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567',
  authDomain: 'chinmay-astro.firebaseapp.com',
  projectId: 'chinmay-astro',
  storageBucket: 'chinmay-astro.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890abcdef',
};
```

**COPY THIS TO A SAFE PLACE** (you'll need it in step 7)

6. Click "Continue to console"

### 6.3 Enable Firebase Authentication

**Step 1: Navigate to Authentication**

1. In Firebase Console sidebar, click "Authentication"
2. Click "Get started"

**Step 2: Enable Google Sign-In**

1. Click "Sign-in method" tab
2. Click "Google" provider
3. Toggle "Enable"
4. Project support email: Select your email
5. Click "Save"

**Verification:**

- [ ] Google provider shows "Enabled" status

### 6.4 Create Firestore Database

**Step 1: Navigate to Firestore**

1. In Firebase Console sidebar, click "Firestore Database"
2. Click "Create database"

**Step 2: Configure Database**

1. Location: Select closest to your users (e.g., `asia-south1` for India)
2. Click "Next"
3. Security rules: Select "Start in **test mode**"
   - ⚠️ **Note:** We'll update security rules later in development
4. Click "Create"
5. Wait for database creation (30-60 seconds)

**Verification:**

- [ ] Firestore database created
- [ ] You see the empty Data tab

### 6.5 Set Up Cloud Storage

**Step 1: Navigate to Storage**

1. In Firebase Console sidebar, click "Storage"
2. Click "Get started"

**Step 2: Configure Storage**

1. Security rules: Select "Start in **test mode**"
   - ⚠️ **Note:** We'll update security rules later
2. Click "Next"
3. Storage location: Same as Firestore (e.g., `asia-south1`)
4. Click "Done"

**Verification:**

- [ ] Cloud Storage created
- [ ] Default bucket exists

### 6.6 Upgrade to Blaze Plan (Optional)

**Firebase free tier (Spark plan) is sufficient for development.**

For production with Cloud Functions, you'll need Blaze plan:

1. In Firebase Console, click "Upgrade" (bottom left)
2. Select "Blaze" plan (pay as you go)
3. Set up billing in Google Cloud Console
4. **Note:** You won't be charged unless you exceed free tier limits

**For now:** You can stay on Spark plan and upgrade later.

### 6.7 Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

**Expected Output:** `13.x.x` or higher

**Login to Firebase:**

```bash
# Login to Firebase
firebase login

# Follow the interactive prompts:
# 1. Browser window will open
# 2. Select your Google account
# 3. Allow Firebase CLI to access your account

# Verify login
firebase projects:list
```

**Expected Output:**

```
✔ Projects:
│ chinmay-astro (chinmay-astro)
```

### 6.8 Initialize Firebase in Project (Optional Now)

**You can skip this step** - the process-tasks agent will do it.

But if you want to set it up now:

```bash
cd /Users/prasadmujumdar/Downloads/ChinmayAstro

# Initialize Firebase
firebase init

# Select features:
# - Firestore ✓
# - Functions ✓
# - Hosting (skip for now)
# - Storage ✓

# Follow prompts:
# - Select "Use an existing project"
# - Choose "chinmay-astro"
# - Accept defaults for file names

# Verify
ls -la
# You should see: firebase.json, .firebaserc
```

**Action Required:**

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Firebase config values copied
- [ ] Google Sign-In enabled
- [ ] Firestore database created
- [ ] Cloud Storage created
- [ ] Firebase CLI installed and authenticated

---

## 7. Environment Variables Configuration

### 7.1 Create Environment Variables File

**Navigate to project directory:**

```bash
cd /Users/prasadmujumdar/Downloads/ChinmayAstro
```

**Create `.env.local` file:**

```bash
# Create the file
touch .env.local

# Open in your text editor (VS Code, nano, vim, etc.)
code .env.local  # if using VS Code
# OR
nano .env.local
```

### 7.2 Add Firebase Configuration

**Copy and paste this template into `.env.local`:**

```env
# Firebase Web Configuration (from Step 6.2)
# Replace the values with YOUR actual Firebase config

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=chinmay-astro.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=chinmay-astro
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=chinmay-astro.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef

# Firebase Project ID (for Cloud Functions)
FIREBASE_PROJECT_ID=chinmay-astro

# Environment
NODE_ENV=development
```

**IMPORTANT:** Replace ALL values with your actual Firebase config from step 6.2.

### 7.3 Create Environment Variables Example File

**This file will be committed to git as a template for others:**

```bash
# Create example file
cat > .env.local.example << 'EOF'
# Firebase Web Configuration
# Copy this file to .env.local and fill in your actual values

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Project ID (for Cloud Functions)
FIREBASE_PROJECT_ID=your_project_id

# Environment
NODE_ENV=development
EOF
```

### 7.4 Verify .env.local is Gitignored

```bash
# Check if .env.local is in .gitignore
grep ".env.local" .gitignore
```

**Expected Output:** `.env.local` should be listed.

If not:

```bash
# Add to .gitignore
echo ".env.local" >> .gitignore
```

### 7.5 Commit Environment Example File

```bash
# Add example file to git
git add .env.local.example

# Commit
git commit -m "chore: add environment variables example file"

# Push to GitHub
git push origin main
```

**Action Required:**

- [ ] `.env.local` file created with actual Firebase values
- [ ] `.env.local.example` file created
- [ ] `.env.local` is in .gitignore
- [ ] Example file committed and pushed

---

### 7.5 Install detect-secrets (Secret Scanner)

**What it does:** Prevents accidentally committing secrets (API keys, passwords) to Git

**Install Python tool for secret detection:**

```bash
# Install detect-secrets (requires Python 3.x)
pip3 install detect-secrets

# Verify installation
detect-secrets --version
```

**Expected Output:** `1.x.x` or higher

**Note:** macOS comes with Python 3 pre-installed. If not available:

```bash
brew install python3
```

**Create baseline (will be done by process-tasks agent):**

The agent will run this command after initial setup:

```bash
# Scan existing files and create baseline
detect-secrets scan > .secrets.baseline
```

**What this does:**

- Scans all files in repository
- Creates `.secrets.baseline` with known "secrets"
- Firebase config in `lib/firebase/client-config.ts` will be recorded as known (public by design)
- Future commits will only flag NEW secrets

**Important:** This baseline prevents false positives for Firebase config keys, which are meant to be public (browser-exposed). Security is enforced via Firestore Rules, not by hiding these keys.

**Action Required:**

- [ ] detect-secrets installed via pip3
- [ ] Version verified (1.x.x or higher)

---

### 7.6 Firebase CI Token Setup (For GitHub Actions)

**What it does:** Allows GitHub Actions to deploy Firebase Functions automatically

#### 7.6.1 Generate Firebase CI Token

**Run this command in your terminal:**

```bash
# Login to Firebase and generate CI token
firebase login:ci
```

**Expected Output:**

```
✔  Success! Use this token to login on a CI server:

1//0abcd1234567890xyz...

Example: firebase deploy --token "$FIREBASE_TOKEN"
```

**⚠️ IMPORTANT:** Copy this token somewhere safe - you'll need it in the next step.

#### 7.6.2 Add Token to GitHub Secrets

**Steps:**

1. Go to your GitHub repository: `https://github.com/[your-username]/chinmay-astro`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Fill in:
   - Name: `FIREBASE_TOKEN`
   - Value: [paste the token from step 7.6.1]
5. Click **"Add secret"**

**Verify:**

- You should see `FIREBASE_TOKEN` in the list of repository secrets
- The value will be hidden (shows as `***`)

#### 7.6.3 Test Token (Optional)

**Verify the token works:**

```bash
# Test deployment with token (dry run - doesn't actually deploy)
firebase deploy --only functions --token [your-token] --dry-run
```

**Expected Output:** Should show what would be deployed without errors.

**Action Required:**

- [ ] Firebase CI token generated
- [ ] Token added to GitHub Secrets as `FIREBASE_TOKEN`
- [ ] (Optional) Token tested with dry run

---

## 8. Final Verification

### 8.1 Verify All Tools

Run these commands to verify everything is set up:

```bash
# 1. Node.js
node --version
# Expected: v20.x.x or v18.x.x

# 2. pnpm
pnpm --version
# Expected: 9.x.x or 8.x.x

# 3. Git
git --version
# Expected: 2.x.x

# 4. Git configuration
git config --global user.name
git config --global user.email
# Expected: Your name and email

# 5. GitHub CLI (optional)
gh --version
# Expected: gh version 2.x.x

# 6. Firebase CLI
firebase --version
# Expected: 13.x.x

# 7. Firebase login status
firebase projects:list
# Expected: Your chinmaya-jyotish project listed
```

### 8.2 Verify Repository Setup

```bash
cd /Users/prasadmujumdar/Downloads/ChinmayAstro

# Check git status
git status
# Expected: "On branch main, nothing to commit, working tree clean"

# Check remote
git remote -v
# Expected: origin pointing to your GitHub repo

# Check branches
git branch -a
# Expected: * main, remotes/origin/main
```

### 8.3 Verify Firebase Project

```bash
# Check Firebase project
firebase projects:list

# Expected output:
# ✔ Projects:
# │ chinmay-astro (chinmay-astro)
```

### 8.4 Verify Environment Variables

```bash
# Check if .env.local exists (but don't print it - contains secrets!)
ls -la .env.local
# Expected: File exists

# Count number of variables (should be 7+)
grep -c "^[A-Z]" .env.local
# Expected: 7 or more
```

### 8.5 Verify Project Structure

```bash
# Check current directory structure
ls -la

# Expected files/directories:
# - tasks/
# - .git/
# - .gitignore
# - .env.local
# - .env.local.example
# - PREREQUISITES_TO_PROCESS_TASKS.md
# - README.md (if created)
```

### 8.6 Final Checklist

**Print this checklist and verify each item:**

**System Requirements:**

- [ ] Node.js 18+ installed
- [ ] pnpm 8+ installed
- [ ] Git installed and configured
- [ ] GitHub CLI installed (optional)
- [ ] Firebase CLI installed

**Git & GitHub:**

- [ ] Local git repository initialized
- [ ] .gitignore file created
- [ ] Git identity configured (name, email)
- [ ] GitHub remote repository created
- [ ] Local repository connected to GitHub
- [ ] Initial commit pushed successfully

**Firebase:**

- [ ] Firebase project created
- [ ] Web app registered in Firebase
- [ ] Google Sign-In enabled
- [ ] Firestore database created
- [ ] Cloud Storage created
- [ ] Firebase CLI authenticated
- [ ] Firebase config values copied

**Environment:**

- [ ] .env.local file created with actual values
- [ ] .env.local.example file created and committed
- [ ] .env.local is gitignored

**Verification:**

- [ ] All verification commands run successfully
- [ ] No errors in git status
- [ ] Firebase projects:list shows your project

---

## 9. Ready to Run process-tasks

### 9.1 Current Project State

At this point, your project should look like this:

```
ChinmayAstro/
├── .git/                                      # Git repository
├── .gitignore                                 # Git ignore rules
├── .env.local                                 # Environment variables (not committed)
├── .env.local.example                         # Environment template (committed)
├── PREREQUISITES_TO_PROCESS_TASKS.md          # This document
├── tasks/
│   ├── prd-chinmay-astro-web-app.md       # Product requirements
│   ├── tdd-chinmay-astro-web-app.md       # Technical design
│   └── tasks-chinmay_astro-feature-1-authentication.md  # Feature 1 tasks
└── README.md (optional)

# Not yet created (process-tasks will create):
# - package.json
# - node_modules/
# - app/
# - components/
# - lib/
# - etc.
```

### 9.2 Run process-tasks Agent

**You are now ready to run the process-tasks agent!**

```bash
# Navigate to project directory
cd /Users/prasadmujumdar/Downloads/ChinmayAstro

# Run process-tasks agent (in Claude Code)
/process-tasks tasks/tasks-chinmay_astro-feature-1-authentication.md
```

### 9.3 What the Agent Will Do

The process-tasks agent will:

1. **Phase 1: Setup Test Infrastructure**
   - Run `pnpm create next-app` to initialize Next.js project
   - Install all dependencies (`firebase`, `vitest`, `playwright`, etc.)
   - Configure TypeScript, Vitest, Playwright
   - Create Firebase config files using your `.env.local` values
   - Set up git hooks (husky)

2. **Phase 2: Write Tests (RED)**
   - Create test files for all authentication features
   - Run tests (they should fail - this is expected!)

3. **Phase 3: Implementation (GREEN)**
   - Implement authentication code to make tests pass
   - Create Firebase utilities
   - Build Google Sign-In button
   - Create login page
   - Set up protected routes

4. **Phase 4: Refactor**
   - Improve code quality
   - Add error boundaries
   - Extract constants

5. **Phase 5: Integration Testing**
   - Run E2E tests with Playwright
   - Test mobile responsive design

6. **Phase 6: Documentation**
   - Generate coverage reports
   - Update documentation
   - Create final commit

### 9.4 Expected Duration

**Feature 1 (Authentication) implementation:**

- Automated time: 20-30 minutes
- Your review time: 10-15 minutes
- Total: ~45 minutes

### 9.5 During Execution

**The agent will:**

- ✅ Create commits after each phase
- ✅ Push to GitHub after feature completion
- ✅ Run tests continuously
- ✅ Show progress updates

**You should:**

- ✅ Monitor the terminal output
- ✅ Approve any interactive prompts
- ✅ Review code after completion
- ✅ Test the application manually

### 9.6 After process-tasks Completes

**Verify the implementation:**

```bash
# 1. Check git commits
git log --oneline

# 2. Verify tests pass
pnpm test

# 3. Start dev server
pnpm dev

# 4. Open browser to http://localhost:3000
# Test Google Sign-In flow

# 5. Check GitHub repo
# All commits should be pushed
```

---

## 10. Troubleshooting

### 10.1 Node.js Issues

**Problem:** `node: command not found`

**Solution:**

```bash
# Reinstall Node.js via Homebrew
brew install node@20
brew link node@20

# OR use NVM
nvm install 20
nvm use 20
```

---

**Problem:** Wrong Node.js version

**Solution:**

```bash
# If using NVM
nvm use 20

# If using Homebrew
brew unlink node
brew link node@20
```

---

### 10.2 pnpm Issues

**Problem:** `pnpm: command not found`

**Solution:**

```bash
# Reinstall pnpm
npm install -g pnpm

# Reload shell
source ~/.zshrc

# Verify
pnpm --version
```

---

**Problem:** pnpm is slow or hangs

**Solution:**

```bash
# Clear pnpm cache
pnpm store prune

# Try again
pnpm install
```

---

### 10.3 Git Issues

**Problem:** `fatal: not a git repository`

**Solution:**

```bash
cd /Users/prasadmujumdar/Downloads/ChinmayAstro
git init
git add .
git commit -m "Initial commit"
```

---

**Problem:** Git push authentication fails

**Solution:**

```bash
# Use personal access token
# 1. Go to https://github.com/settings/tokens
# 2. Generate new token (classic)
# 3. Select: repo, workflow
# 4. Copy token
# 5. Use as password when pushing

# OR configure SSH
ssh-keygen -t ed25519 -C "your.email@example.com"
# Add public key to GitHub: https://github.com/settings/keys
```

---

### 10.4 Firebase Issues

**Problem:** `firebase: command not found`

**Solution:**

```bash
npm install -g firebase-tools
source ~/.zshrc
firebase --version
```

---

**Problem:** Firebase login fails

**Solution:**

```bash
# Logout and re-login
firebase logout
firebase login --reauth

# If browser doesn't open
firebase login --no-localhost
```

---

**Problem:** Can't find Firebase project

**Solution:**

```bash
# List projects
firebase projects:list

# If not listed, create project in console:
# https://console.firebase.google.com/
```

---

### 10.5 Environment Variables Issues

**Problem:** `.env.local` values not loading

**Solution:**

```bash
# Verify file exists
ls -la .env.local

# Check contents (be careful not to share these!)
cat .env.local

# Restart dev server
# Next.js only loads .env.local on server start
pnpm dev
```

---

**Problem:** Firebase config error

**Solution:**

```bash
# Verify all required variables are set
grep "NEXT_PUBLIC_FIREBASE" .env.local

# Should have 6 variables:
# - NEXT_PUBLIC_FIREBASE_API_KEY
# - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# - NEXT_PUBLIC_FIREBASE_PROJECT_ID
# - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# - NEXT_PUBLIC_FIREBASE_APP_ID
```

---

### 10.6 GitHub Issues

**Problem:** Remote repository connection fails

**Solution:**

```bash
# Check remote URL
git remote -v

# If wrong or missing, reset:
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/chinmay-astro.git

# Verify
git remote -v
```

---

**Problem:** Push rejected (non-fast-forward)

**Solution:**

```bash
# Pull first
git pull origin main --rebase

# Then push
git push origin main
```

---

### 10.7 Getting Help

If you encounter issues not covered here:

1. **Check Claude Code Documentation**
   - Run `/help` in Claude Code

2. **Check Tool Documentation**
   - Node.js: https://nodejs.org/docs
   - pnpm: https://pnpm.io/
   - Firebase: https://firebase.google.com/docs
   - Next.js: https://nextjs.org/docs

3. **Search for Error Messages**
   - Copy exact error message
   - Search on Stack Overflow or GitHub Issues

4. **Ask for Help**
   - Provide full error message
   - Include steps to reproduce
   - Share relevant configuration (without secrets!)

---

## Summary

### ✅ You're Ready When:

1. ✅ Node.js 18+ installed
2. ✅ pnpm 8+ installed
3. ✅ Git configured with your identity
4. ✅ GitHub repository created and connected
5. ✅ Firebase project set up with:
   - Web app registered
   - Google Sign-In enabled
   - Firestore database created
   - Cloud Storage created
6. ✅ Firebase CLI authenticated
7. ✅ `.env.local` created with Firebase config
8. ✅ All verification commands pass

### 🚀 Next Command:

```bash
cd /Users/prasadmujumdar/Downloads/ChinmayAstro
/process-tasks tasks/tasks-chinmay_astro-feature-1-authentication.md
```

---

**Good luck with your implementation! 🎉**

**Estimated total setup time:** 30-45 minutes
**Estimated Feature 1 implementation time:** 45 minutes
**Total time to working authentication:** ~90 minutes

---

**Document End**
