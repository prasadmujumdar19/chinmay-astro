# Setup Walkthrough - Action Steps

**Date:** 2025-10-31
**Status:** In Progress

---

## Important Confirmations Before We Start

### ✅ Confirmed Understanding:

1. **Node.js from Tap2Gab:** You installed Node.js for the Tap2Gab project via Homebrew
2. **.claude and tasks folders:** Will be added to .gitignore (not pushed to GitHub)
3. **Git initialization:** Will NOT delete or overwrite existing files
4. **Firebase setup:** You'll do it in the Firebase Console UI (I'll guide you step-by-step)
5. **GitHub repo creation:** Using Method 2 (Web UI) from section 5.3

---

## Step 1: Verify Node.js Installation (From Your Terminal)

**Action Required:** Open your terminal (outside Claude Code) and run these commands:

```bash
# 1. Check Node.js version
node --version

# 2. Check npm version
npm --version

# 3. Check where Node is installed
which node

# 4. Check Homebrew packages
brew list | grep node
```

**Expected Results:**
- `node --version` should show: `v18.x.x` or `v20.x.x`
- `npm --version` should show: `9.x.x` or `10.x.x`
- `which node` should show: `/opt/homebrew/bin/node` or `/usr/local/bin/node`
- `brew list | grep node` should show: `node` or `node@20`

**✅ Report back with the output so we can confirm Node.js is properly installed.**

---

## Step 2: Install pnpm (From Your Terminal)

Since Node.js is installed, we just need to add pnpm:

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

**Expected Result:** `9.x.x` or `8.x.x`

**✅ Report back with the pnpm version.**

---

## Step 3: Verify Git Configuration (From Your Terminal)

```bash
# Check Git version
git --version

# Check Git identity
git config --global user.name
git config --global user.email
```

**If name/email are NOT set, run:**

```bash
# Set your name
git config --global user.name "Prasad Mujumdar"

# Set your email (use your GitHub email)
git config --global user.email "your.email@example.com"

# Set default branch to main
git config --global init.defaultBranch main
```

**✅ Confirm your git identity is set correctly.**

---

## Step 4: Update .gitignore (I'll do this now in Claude)

**What I'm doing:**
- Adding `.claude/` folder to .gitignore
- Adding `tasks/` folder to .gitignore
- This ensures these folders stay local and don't get pushed to GitHub

**Verification after I do this:**
You can check the .gitignore file to confirm both folders are listed.

---

## Step 5: Initialize Git Repository (SAFE - Won't Delete Files)

**IMPORTANT:** Git init is SAFE. It only creates a hidden `.git/` folder to track changes. It does NOT delete or modify any existing files.

**What happens:**
```
Before:
ChinmayAstro/
├── .claude/          ← Stays exactly as is
├── tasks/            ← Stays exactly as is
└── other files...    ← Stays exactly as is

After git init:
ChinmayAstro/
├── .git/             ← NEW: Hidden folder for version control
├── .claude/          ← UNCHANGED
├── tasks/            ← UNCHANGED
└── other files...    ← UNCHANGED
```

**Action:** I'll run `git init` now in Claude Code.

---

## Step 6: Create Initial Commit (Preserving Everything)

**What will be committed:**
- `.gitignore` (with .claude/ and tasks/ excluded)
- `PREREQUISITES_TO_PROCESS_TASKS.md`
- `SETUP_WALKTHROUGH.md` (this file)
- Any other documentation files

**What will NOT be committed (because of .gitignore):**
- `.claude/` folder
- `tasks/` folder

**Action:** I'll create the initial commit after updating .gitignore.

---

## Step 7: Firebase Project Setup (You'll do this in UI)

### Step 7.1: Create Firebase Project

**Action Required:**

1. Open your browser and go to: https://console.firebase.google.com/
2. Sign in with your Google account
3. Click **"Add project"** or **"Create a project"**

**I'll wait for you to confirm you're on the Firebase Console.**

### Step 7.2: Project Configuration

**Once you're ready, I'll guide you through:**
- Project name
- Google Analytics setup
- Web app registration
- Enabling Google Sign-In
- Creating Firestore database
- Setting up Cloud Storage
- Getting Firebase config values

**We'll do this step-by-step together.**

---

## Step 8: GitHub Repository Setup (Web UI Method)

### Step 8.1: Create Repository on GitHub.com

**Action Required:**

1. Open your browser and go to: https://github.com/new
2. Fill in:
   - **Repository name:** `chinmay-astro`
   - **Description:** `Chinmay Astro - Astrology consultation web application`
   - **Visibility:** Public (or Private if you prefer)
3. **IMPORTANT - DO NOT CHECK:**
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
4. Click **"Create repository"**

**I'll wait for you to confirm the repo is created.**

### Step 8.2: Connect Local to Remote

Once you confirm, I'll run these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/chinmay-astro.git
git branch -M main
git push -u origin main
```

**Note:** You may need to authenticate with GitHub (personal access token or SSH key).

---

## Step 9: Create Environment Variables File

After Firebase setup is complete, I'll create the `.env.local` file with the Firebase config values you provide.

---

## Current Status: Waiting for Step 1 Verification

**Next Action:** Please run the Node.js verification commands from Step 1 and report back the output.

---

## Quick Reference - What We're NOT Pushing to GitHub

```
.gitignore will include:
- .claude/          # Claude Code configuration
- tasks/            # Task lists and PRD
- .env.local        # Environment variables (secrets)
- node_modules/     # Dependencies
- .next/            # Build output
```

**Your .claude and tasks folders are 100% safe and will remain local only.**

---

## Questions or Concerns?

If at any point you have questions or concerns, **STOP** and ask me before proceeding. We can verify each step before moving to the next.
