# Artefact Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all skill-generated artefacts under `docs/artefacts/`, retire `docs/superpowers/`, reduce `.methodology/` to plugin metadata, and update all skills + project docs so future sessions write to the new layout directly.

**Architecture:** Two coordinated changes that ship together — (a) `n8n-whatsapp-methodology` plugin v1.12.0 → v1.13.0 with all 10 skills + template + Python script repointed to `docs/artefacts/`, plus a 3-line update to project `CLAUDE.md` redirecting `superpowers:brainstorming` and `superpowers:writing-plans` defaults; (b) one-shot migration of existing `.methodology/` and `docs/superpowers/` files into the new layout, committed to GitHub via the project's clone-to-`/tmp/claude-scratch` pattern.

**Tech Stack:** Markdown skill definitions (SKILL.md), Python (one script), bash, git (two separate repos: `prasadmujumdar19/n8n-whatsapp-methodology` for the plugin, `prasadmujumdar19/chinmay-astro` for the project), grep/sed for verification.

**Reference:** Design spec at `docs/superpowers/specs/2026-05-17-artefact-consolidation-design.md`. Read it once before starting.

---

## Phase 0 — Pre-flight

### Task 0: Verify the active plugin version and Stop hook config

**Files:**
- Read: `~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/` (symlink chain)
- Read: `/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/.claude/settings.local.json`

- [ ] **Step 1: Confirm current active plugin version is 1.12.0**

```bash
ls -la ~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/ | grep -E "^d|->" | sort
```

Expected: a real directory `1.12.0` (or higher) and a symlink chain `1.10.6 → 1.11.0 → 1.12.0`. If the highest real directory is not `1.12.0`, update every later mention of `1.12.0`/`1.13.0` in this plan to reflect the actual current version → next version (always `current + minor bump`).

- [ ] **Step 2: Inspect the project Stop hook config for path-bound rules**

```bash
cat "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/.claude/settings.local.json"
```

If the file references `.methodology/` or `docs/superpowers/` paths in hook commands, note them — Task 25 will update those.

- [ ] **Step 3: Inventory paths in the project working tree**

```bash
cd "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"
ls .methodology/ | sort > /tmp/claude-scratch/before-methodology.txt
ls docs/superpowers/ 2>/dev/null | sort > /tmp/claude-scratch/before-superpowers.txt
wc -l /tmp/claude-scratch/before-*.txt
```

Expected: `before-methodology.txt` has ~30 entries (29 files + 3 test dirs + 1 marker), `before-superpowers.txt` has ~13 entries (9 loose files + plans/ + specs/ + reports/). Save these — Task 26 diffs against them.

---

## Phase 1 — Methodology plugin v1.13.0 (working copy in /tmp)

All skill edits happen in a fresh clone of the plugin's GitHub repo. Do NOT edit files in the `~/.claude/plugins/cache/` directly — direct cache edits skip version bump, symlink reroll, marketplace cache refresh, and GitHub history.

### Task 1: Clone the plugin repo to /tmp and create working branch

**Files:**
- Create clone at: `/tmp/claude-scratch/n8n-whatsapp-methodology/`

- [ ] **Step 1: Ensure scratch dir exists and clone**

```bash
mkdir -p /tmp/claude-scratch
cd /tmp/claude-scratch
rm -rf n8n-whatsapp-methodology
git clone https://github.com/prasadmujumdar19/n8n-whatsapp-methodology.git
cd n8n-whatsapp-methodology
git status
```

Expected: clean working tree on `main`, HEAD matches the v1.12.0 release commit (or current latest).

- [ ] **Step 2: Confirm directory layout matches what this plan expects**

```bash
ls skills/
ls skills/monitor-test-run/scripts/ 2>/dev/null
ls skills/functional-code-review/
```

Expected: 10 skill subdirs (`session-start`, `init-project`, `plan-sprint`, `build-sprint`, `handoff`, `monitor-test-run`, `functional-code-review`, `technical-workflow-review`, `generate-functional-test-cases`, `functional-gaps-review`). `monitor-test-run/scripts/build-report.py` exists. `functional-code-review/tracker-template.md` exists.

- [ ] **Step 3: Take a snapshot of every old-path occurrence for later verification**

```bash
grep -rn "\.methodology/" skills/ > /tmp/claude-scratch/plugin-methodology-refs-before.txt
grep -rn "docs/superpowers/" skills/ > /tmp/claude-scratch/plugin-superpowers-refs-before.txt
wc -l /tmp/claude-scratch/plugin-*-refs-before.txt
```

Expected: `plugin-methodology-refs-before.txt` has ~77 lines, `plugin-superpowers-refs-before.txt` has 1–2 lines (the functional-gaps-review HTML input example).

- [ ] **Step 4: Commit the inventory snapshot is not needed — these are temp diagnostic files. Move on.**

---

### Task 2: Update `skills/session-start/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/session-start/SKILL.md`

Locations (per the pre-edit grep): lines 29, 48, 63, 94.

- [ ] **Step 1: Apply path replacements**

Use `Edit` (or sed) to replace these exact strings:

| Find | Replace |
|---|---|
| `Check `.methodology/initialized` exists in the project root.` | `Check `.methodology/initialized` exists in the project root.` (UNCHANGED — plugin metadata stays in `.methodology/`) |
| `ls .methodology/sprint-*-state.md 2>/dev/null` | `ls docs/artefacts/sprints/*/state.md 2>/dev/null` |
| `ls .methodology/sprint-*-followups.md 2>/dev/null` | `ls docs/artefacts/sprints/*/followups.md 2>/dev/null` |
| `ls -t .methodology/handoff-*.md 2>/dev/null \| head -1` | `ls -t docs/artefacts/sprints/*/handoffs/*.md docs/artefacts/handoffs/*.md 2>/dev/null \| head -1` |

Plus update any surrounding prose that names the old paths (line 30 description block, line 49 comment, line 64 comment, line 95 comment) to refer to the new paths.

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/sprint\|\.methodology/handoff" skills/session-start/SKILL.md
```

Expected: zero matches.

```bash
grep -n "docs/artefacts/sprints\|docs/artefacts/handoffs" skills/session-start/SKILL.md
```

Expected: at least 4 matches.

```bash
grep -n "\.methodology/initialized" skills/session-start/SKILL.md
```

Expected: 1 match (the metadata check is preserved).

- [ ] **Step 3: Commit**

```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology
git add skills/session-start/SKILL.md
git commit -m "session-start: read sprint state from docs/artefacts/"
```

---

### Task 3: Update `skills/init-project/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/init-project/SKILL.md`

Locations: lines 3, 28, 89, 113, 133, 135, 136, 137.

- [ ] **Step 1: Apply path replacements**

The `.methodology/initialized` references stay (lines 3, 28, 89, 113 — the plugin keeps writing this file).

Replace the `.gitignore` pattern block (around lines 133–137):

```bash
# OLD (lines 133-137):
Add `.methodology/` working files to `.gitignore` if not already present:

grep -q "handoff-" .gitignore 2>/dev/null || echo ".methodology/handoff-*.md" >> .gitignore
grep -q "sprint-.*state" .gitignore 2>/dev/null || echo ".methodology/sprint-*-state.md" >> .gitignore
grep -q "sprint-.*working" .gitignore 2>/dev/null || echo ".methodology/sprint-*-working.md" >> .gitignore
```

```bash
# NEW:
Add active-sprint marker to `.gitignore` if not already present (the marker is ephemeral; everything else under `docs/artefacts/` is durable and SHOULD be committed):

grep -q "artefacts/sprints/.*/_active" .gitignore 2>/dev/null || echo "docs/artefacts/sprints/*/_active" >> .gitignore
```

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/sprint\|\.methodology/handoff" skills/init-project/SKILL.md
```

Expected: zero matches.

```bash
grep -n "\.methodology/initialized" skills/init-project/SKILL.md
```

Expected: at least 3 matches (preserved).

- [ ] **Step 3: Commit**

```bash
git add skills/init-project/SKILL.md
git commit -m "init-project: gitignore artefacts/_active marker only; metadata stays in .methodology/"
```

---

### Task 4: Update `skills/plan-sprint/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/plan-sprint/SKILL.md`

This skill has the most references (13). The pattern is consistent — every flat `.methodology/sprint-<slug>-X.md` becomes `docs/artefacts/sprints/<slug>/X.md`.

- [ ] **Step 1: Apply path replacements**

| Find | Replace |
|---|---|
| `.methodology/sprint-<slug>-state.md` | `docs/artefacts/sprints/<slug>/state.md` |
| `.methodology/sprint-<slug>-working.md` | `docs/artefacts/sprints/<slug>/working.md` |
| `.methodology/sprint-<slug>-followups.md` | `docs/artefacts/sprints/<slug>/followups.md` |
| `.methodology/handoff-<topic>.md` | `docs/artefacts/sprints/<slug>/handoffs/<topic>.md` (in the context of an active sprint) |
| `working_copy_path: null        # or .methodology/sprint-<slug>-working.md` | `working_copy_path: null        # or docs/artefacts/sprints/<slug>/working.md` |
| any `rm .methodology/sprint-<slug>-*.md` lines (around lines 89-91) | `rm docs/artefacts/sprints/<slug>/state.md` / `working.md` accordingly |
| around line 102 — the prose about working copy fallback | mention `docs/artefacts/sprints/<slug>/working.md` |
| around line 253 (handoff hint) | `docs/artefacts/sprints/<slug>/handoffs/<topic>.md` |

Add ONE NEW step in the "Write state file" section: after writing state.md, `touch docs/artefacts/sprints/<slug>/_active`.

Add explicit guidance: "If `docs/artefacts/sprints/<slug>/` does not exist, create it. The folder is per-sprint."

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/sprint\|\.methodology/handoff" skills/plan-sprint/SKILL.md
```

Expected: zero matches.

```bash
grep -n "touch docs/artefacts/sprints/.*/_active\|touch.*_active" skills/plan-sprint/SKILL.md
```

Expected: at least 1 match (the new marker step).

```bash
grep -cn "docs/artefacts/sprints/" skills/plan-sprint/SKILL.md
```

Expected: at least 12 matches.

- [ ] **Step 3: Commit**

```bash
git add skills/plan-sprint/SKILL.md
git commit -m "plan-sprint: write sprint state under docs/artefacts/sprints/<slug>/ + touch _active marker"
```

---

### Task 5: Update `skills/build-sprint/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/build-sprint/SKILL.md`

Locations: lines 10, 25, 34, 52, 157.

- [ ] **Step 1: Apply path replacements**

| Find | Replace |
|---|---|
| `.methodology/sprint-<slug>-state.md` (lines 10, 34, 52) | `docs/artefacts/sprints/<slug>/state.md` |
| `.methodology/sprint-inline-*-state.md` (line 25) | `docs/artefacts/sprints/inline-*/state.md` |
| `.methodology/sprint-<slug>-followups.md` (line 157) | `docs/artefacts/sprints/<slug>/followups.md` |

Add ONE NEW final step at the END of the sprint completion section: `rm docs/artefacts/sprints/<slug>/_active` (the marker is removed when the sprint completes, signaling no in-flight state).

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/sprint" skills/build-sprint/SKILL.md
```

Expected: zero matches.

```bash
grep -n "rm docs/artefacts/sprints/.*/_active\|rm.*_active" skills/build-sprint/SKILL.md
```

Expected: at least 1 match.

- [ ] **Step 3: Commit**

```bash
git add skills/build-sprint/SKILL.md
git commit -m "build-sprint: read/write sprint state from docs/artefacts/sprints/<slug>/ + remove _active on completion"
```

---

### Task 6: Update `skills/handoff/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/handoff/SKILL.md`

The skill needs a new branch: detect the active sprint via `_active` marker, then either write into the sprint's `handoffs/` subdir or into the orphan `docs/artefacts/handoffs/`.

- [ ] **Step 1: Apply path replacements + add detection logic**

Replace section "2. Write `.methodology/handoff-<slug>.md`" (around line 32) with:

```markdown
**2. Detect active sprint and choose destination**

```bash
ACTIVE_SPRINT=$(ls docs/artefacts/sprints/*/_active 2>/dev/null | head -1 | sed 's|/_active$||')
if [ -n "$ACTIVE_SPRINT" ]; then
  DEST="$ACTIVE_SPRINT/handoffs/<topic>.md"
  mkdir -p "$ACTIVE_SPRINT/handoffs"
else
  DEST="docs/artefacts/handoffs/<topic>.md"
  mkdir -p docs/artefacts/handoffs
fi
```

**3. Write to `$DEST`**
```

Update line 85 (the anti-pattern table):

| Find | Replace |
|---|---|
| `\| Writing to `docs/NEXT_SESSION_HANDOFF.md` \| Wrong location — always `.methodology/handoff-<slug>.md` \|` | `\| Writing to `docs/NEXT_SESSION_HANDOFF.md` \| Wrong location — handoffs go under `docs/artefacts/sprints/<slug>/handoffs/` (active sprint) or `docs/artefacts/handoffs/` (no active sprint) \|` |

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/handoff\|\.methodology/sprint" skills/handoff/SKILL.md
```

Expected: zero matches.

```bash
grep -n "_active" skills/handoff/SKILL.md
```

Expected: at least 1 match (the new detection block).

- [ ] **Step 3: Commit**

```bash
git add skills/handoff/SKILL.md
git commit -m "handoff: detect active sprint via _active marker, write to sprint's handoffs/ or orphan dir"
```

---

### Task 7: Update `skills/monitor-test-run/SKILL.md` + scripts/build-report.py

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/monitor-test-run/SKILL.md`
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/monitor-test-run/scripts/build-report.py`

The test folder structure changes from `.methodology/test-<type>-<slug>-<date>/` to `docs/artefacts/tests/<type>-<slug>-<date>/`. Note the leading `test-` prefix is dropped (parent dir `tests/` provides the namespace).

- [ ] **Step 1: Apply replacements in SKILL.md**

| Find | Replace |
|---|---|
| `.methodology/test-<type>-<slug>-<YYYY-MM-DD>[-session-<N>]/` (line 47) | `docs/artefacts/tests/<type>-<slug>-<YYYY-MM-DD>[-session-<N>]/` |
| `never at the bare `.methodology/` root` (line 60) | `never at the bare `docs/artefacts/tests/` root` |
| `.methodology/test-exploratory-feedback-rebook-2026-05-16/` (line 64, example block) | `docs/artefacts/tests/exploratory-feedback-rebook-2026-05-16/` |
| `BASE=".methodology/test-${TYPE}-${SLUG}-${TODAY}"` (line 76) | `BASE="docs/artefacts/tests/${TYPE}-${SLUG}-${TODAY}"` |

Also update the [[monitor_test_run_naming]] feedback note reference (in the user's auto-memory) — flag this for the implementation session: the memory at `~/.claude/projects/-Users-prasadmujumdar-Library-CloudStorage-GoogleDrive-prasadmujumdar-aws-gmail-com-My-Drive-Chinmay-Astro/memory/feedback_monitor_test_run_naming.md` should have its path examples updated. (Memory update is Task 27.)

- [ ] **Step 2: Apply replacement in build-report.py**

Open `skills/monitor-test-run/scripts/build-report.py`, line 11:

```python
# OLD:
DIR = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".methodology/test-exploratory-pre-smoke-test-2026-05-16")

# NEW:
DIR = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "docs/artefacts/tests/exploratory-pre-smoke-test-2026-05-16")
```

- [ ] **Step 3: Verify**

```bash
grep -n "\.methodology/" skills/monitor-test-run/SKILL.md skills/monitor-test-run/scripts/build-report.py
```

Expected: zero matches.

```bash
grep -n "docs/artefacts/tests/" skills/monitor-test-run/SKILL.md skills/monitor-test-run/scripts/build-report.py
```

Expected: at least 5 matches.

- [ ] **Step 4: Commit**

```bash
git add skills/monitor-test-run/
git commit -m "monitor-test-run: write test sessions under docs/artefacts/tests/<type>-<slug>-<date>/"
```

---

### Task 8: Update `skills/functional-code-review/SKILL.md` + tracker-template.md

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/functional-code-review/SKILL.md`
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/functional-code-review/tracker-template.md`

The full review now lives in `docs/artefacts/reviews/functional-code-review-<YYYY-MM-DD>/`. Filenames inside that folder use the new convention: `tracker.md`, `report.html`, `D<N>-<slug>.md`, `test-cases.md`, `test-report.md`.

- [ ] **Step 1: Define a working variable in SKILL.md**

Add near the top of "Artifact Paths" section:

```markdown
Let `<REVIEW_DIR>` = `docs/artefacts/reviews/functional-code-review-<YYYY-MM-DD>` (the date the review is initiated). All paths below are relative to project root.
```

- [ ] **Step 2: Replace the Artifact Paths table** (around lines 31-40):

| Find | Replace |
|---|---|
| `.methodology/functional-test-cases.md` (input) | `<REVIEW_DIR>/test-cases.md` |
| `.methodology/functional-review-tracker.md` | `<REVIEW_DIR>/tracker.md` |
| `.methodology/functional-review-d<N>-<slug>.md` | `<REVIEW_DIR>/D<N>-<slug>.md` |
| `.methodology/functional-review-<YYYY-MM-DD>.html` | `<REVIEW_DIR>/report.html` |

Replace all subsequent references throughout SKILL.md to use these new paths. Specifically lines 46, 48, 53, 69, 99, 102, 130, 145.

- [ ] **Step 3: Replace paths in tracker-template.md**

References on lines 26, 51, 122, 176, 180, 226, 228, 254 of `tracker-template.md`. Same substitutions as Step 2.

- [ ] **Step 4: Verify**

```bash
grep -n "\.methodology/functional" skills/functional-code-review/SKILL.md skills/functional-code-review/tracker-template.md
```

Expected: zero matches.

```bash
grep -n "docs/artefacts/reviews/functional-code-review" skills/functional-code-review/SKILL.md skills/functional-code-review/tracker-template.md
```

Expected: at least 8 matches.

- [ ] **Step 5: Commit**

```bash
git add skills/functional-code-review/
git commit -m "functional-code-review: outputs go to docs/artefacts/reviews/functional-code-review-<date>/"
```

---

### Task 9: Update `skills/technical-workflow-review/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/technical-workflow-review/SKILL.md`

Locations: lines 3, 12, 33–38, 48, 327, 371, 379.

- [ ] **Step 1: Apply path replacements**

Define `<REVIEW_DIR>` = `docs/artefacts/reviews/technical-workflow-review-<YYYY-MM-DD>`.

| Find | Replace |
|---|---|
| `.methodology/technical-review-tracker.md` | `<REVIEW_DIR>/tracker.md` |
| `.methodology/technical-review-<YYYY-MM-DD>.html` | `<REVIEW_DIR>/report.html` |
| line 379 reference `check `.methodology/` for a prior HTML report` | `check `docs/artefacts/reviews/` for a prior HTML report` |

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/" skills/technical-workflow-review/SKILL.md
```

Expected: zero matches.

```bash
grep -n "docs/artefacts/reviews/technical-workflow-review" skills/technical-workflow-review/SKILL.md
```

Expected: at least 4 matches.

- [ ] **Step 3: Commit**

```bash
git add skills/technical-workflow-review/SKILL.md
git commit -m "technical-workflow-review: outputs go to docs/artefacts/reviews/technical-workflow-review-<date>/"
```

---

### Task 10: Update `skills/generate-functional-test-cases/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/generate-functional-test-cases/SKILL.md`

Locations: lines 10, 142, 160.

- [ ] **Step 1: Apply path replacements**

| Find | Replace |
|---|---|
| `.methodology/functional-test-cases.md` (lines 10, 142, 160) | `docs/artefacts/reviews/functional-code-review-<YYYY-MM-DD>/test-cases.md` |
| `Create `.methodology/` if it doesn't exist` (line 142) | `Create `docs/artefacts/reviews/functional-code-review-<YYYY-MM-DD>/` if it doesn't exist` |

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/" skills/generate-functional-test-cases/SKILL.md
```

Expected: zero matches.

```bash
grep -n "docs/artefacts/reviews/functional-code-review.*test-cases" skills/generate-functional-test-cases/SKILL.md
```

Expected: at least 3 matches.

- [ ] **Step 3: Commit**

```bash
git add skills/generate-functional-test-cases/SKILL.md
git commit -m "generate-functional-test-cases: write test-cases.md inside the review folder"
```

---

### Task 11: Update `skills/functional-gaps-review/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/functional-gaps-review/SKILL.md`

Locations: lines 22, 28, 29.

- [ ] **Step 1: Apply path replacements**

| Find | Replace |
|---|---|
| `.methodology/sprint-<slug>-followups.md` (lines 22, 29) | Compute via `_active` marker: `$(ls docs/artefacts/sprints/*/_active 2>/dev/null \| head -1 \| sed 's\|/_active\|/followups.md\|')` — describe in prose: "The followups file is the active sprint's `docs/artefacts/sprints/<slug>/followups.md` (detect the active sprint via the `_active` marker; if none is active, ask the user which sprint to log against)." |
| `@docs/superpowers/FunctionalCodeReview_2026-05-14.html` (line 28, example) | `@docs/artefacts/reviews/functional-code-review-2026-05-14/report.html` |

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/sprint\|docs/superpowers/" skills/functional-gaps-review/SKILL.md
```

Expected: zero matches.

```bash
grep -n "_active\|docs/artefacts/reviews/" skills/functional-gaps-review/SKILL.md
```

Expected: at least 2 matches.

- [ ] **Step 3: Commit**

```bash
git add skills/functional-gaps-review/SKILL.md
git commit -m "functional-gaps-review: read review HTML from new path, log followups to active sprint via _active marker"
```

---

### Task 12: Final sweep — confirm zero stale path references in skills/

**Files:** Read-only verification across `/tmp/claude-scratch/n8n-whatsapp-methodology/skills/`.

- [ ] **Step 1: Global old-path scan**

```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology
grep -rn "\.methodology/" skills/ | grep -v "\.methodology/initialized"
```

Expected: zero output. Any remaining `.methodology/<not-initialized>` reference is a bug — go back to the responsible task and fix.

```bash
grep -rn "docs/superpowers/" skills/
```

Expected: zero output.

- [ ] **Step 2: Confirm new paths show up everywhere expected**

```bash
grep -rln "docs/artefacts/" skills/ | sort
```

Expected: at least the 12 files touched by Tasks 2–11 (10 SKILL.md + tracker-template.md + build-report.py).

```bash
grep -rln "_active" skills/
```

Expected: at least 4 matches (plan-sprint, build-sprint, handoff, functional-gaps-review).

- [ ] **Step 3: If clean, proceed. No commit (read-only).**

---

### Task 13: Bump plugin version to 1.13.0

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology/plugin.json` (or whatever manifest holds the version — `package.json`, `manifest.json`, etc.)

- [ ] **Step 1: Locate the manifest**

```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology
ls *.json | head -5
grep -l "1\.12\.0" *.json
```

The file with `"version": "1.12.0"` is the manifest. Likely `plugin.json`.

- [ ] **Step 2: Change the version**

Edit the manifest, replace `"version": "1.12.0"` with `"version": "1.13.0"`.

- [ ] **Step 3: Update CHANGELOG if one exists**

```bash
ls CHANGELOG*.md 2>/dev/null
```

If a CHANGELOG exists, add an entry at the top:

```markdown
## 1.13.0 — 2026-05-17

- All skills now read/write artefacts under `docs/artefacts/` instead of `.methodology/<flat-files>` or `docs/superpowers/`.
- New `_active` marker convention: build-sprint and plan-sprint touch `docs/artefacts/sprints/<slug>/_active` while a sprint is in flight; build-sprint removes it on completion.
- handoff skill auto-detects active sprint via `_active` marker; writes to `docs/artefacts/sprints/<slug>/handoffs/<topic>.md` (active) or `docs/artefacts/handoffs/<topic>.md` (orphan).
- `.methodology/` directory reduced to plugin metadata (`initialized` file only).
```

- [ ] **Step 4: Verify and commit**

```bash
grep '"version"' plugin.json   # or whichever manifest
```

Expected: `"version": "1.13.0"`.

```bash
git add plugin.json CHANGELOG.md 2>/dev/null
git commit -m "v1.13.0 — artefact consolidation under docs/artefacts/"
```

---

### Task 14: Push plugin v1.13.0 to GitHub

**Files:** Remote `origin` of `/tmp/claude-scratch/n8n-whatsapp-methodology/`.

- [ ] **Step 1: Review what's about to push**

```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
```

Expected: ~12-14 commits (1 per skill task + version bump), touching 12-13 files.

- [ ] **Step 2: Push**

Confirm with the user before pushing (this is the irreversible step).

```bash
git push origin main
```

Expected: clean push, no force needed.

- [ ] **Step 3: Tag the release if the plugin uses tags**

```bash
git tag --list | tail -3
```

If tags like `v1.12.0` exist:

```bash
git tag v1.13.0
git push origin v1.13.0
```

---

### Task 15: Refresh the local plugin cache

**Files:**
- `~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/`
- `~/.claude/plugins/installed_plugins.json` and marketplace cache (per [[feedback_plugin_cache_sync]] and [[project_methodology_plugin]])

- [ ] **Step 1: Trigger the standard plugin refresh**

The plugin cache refresh is handled by the existing Claude Code plugin update mechanism. Either:

(a) Run `/plugins` and select "update" for `n8n-whatsapp-methodology`, OR
(b) Manually rebuild the cache by cloning the new version:

```bash
cd ~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology
git clone --branch v1.13.0 https://github.com/prasadmujumdar19/n8n-whatsapp-methodology.git 1.13.0 2>/dev/null \
  || git clone https://github.com/prasadmujumdar19/n8n-whatsapp-methodology.git 1.13.0
```

- [ ] **Step 2: Re-aim the symlink chain at 1.13.0**

```bash
cd ~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology
ls -la | grep "->"
# Expected: 1.10.6 → 1.11.0 → 1.12.0 — make 1.12.0 → 1.13.0
rm 1.12.0
ln -s 1.13.0 1.12.0
ls -la | grep "->"
# Expected new chain: 1.10.6 → 1.11.0 → 1.12.0 → 1.13.0
```

(Adjust the rm/ln if `1.12.0` is a real directory, not a symlink — in that case rename it to `1.12.0-orphaned-$(date +%s)` first to preserve history, then create the symlink.)

- [ ] **Step 3: Verify the cache resolves to 1.13.0**

```bash
ls -la ~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.13.0/skills/session-start/SKILL.md
grep "docs/artefacts" ~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.13.0/skills/session-start/SKILL.md
```

Expected: file exists; grep shows the new paths.

- [ ] **Step 4: No commit (cache is local, not version-controlled).**

---

## Phase 2 — Project CLAUDE.md update

### Task 16: Update project CLAUDE.md folder-structure table + add superpowers redirection

**Files:**
- Modify: `/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/CLAUDE.md`

- [ ] **Step 1: Update the Document Map row** (line 17)

| Find | Replace |
|---|---|
| `\| `.methodology/handoff-*.md` \| Start of each session — stopping point + next action from last session (written by `handoff` skill) \|` | `\| `docs/artefacts/sprints/<slug>/handoffs/*.md` (active sprint) or `docs/artefacts/handoffs/*.md` (orphan) \| Start of each session — stopping point + next action from last session (written by `handoff` skill) \|` |

- [ ] **Step 2: Update the Folder Structure table** (lines 30-31, add new row)

Replace:
```
| Implementation plans | `docs/superpowers/plans/` |
| Design specs | `docs/superpowers/specs/` |
```

With:
```
| Implementation plans | `docs/artefacts/plans/` |
| Design specs | `docs/artefacts/specs/` |
| Sprint / test / review / handoff artefacts | `docs/artefacts/` (one folder per unit of work) |
```

- [ ] **Step 3: Add a superpowers-redirection instruction block**

Find the existing line near the Folder Structure section (or near the "Methodology" section near the bottom of CLAUDE.md) and add this paragraph:

```markdown
## Skill output paths

When invoking `superpowers:brainstorming`, write design specs to `docs/artefacts/specs/` (override the skill's default of `docs/superpowers/specs/`). When invoking `superpowers:writing-plans`, write implementation plans to `docs/artefacts/plans/` (override the skill's default of `docs/superpowers/plans/`). All other skill outputs from the `n8n-whatsapp-methodology` plugin (sprints, tests, reviews, handoffs) write directly to `docs/artefacts/<category>/` per their SKILL.md.
```

- [ ] **Step 4: Verify**

```bash
cd "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"
grep -n "docs/superpowers/" CLAUDE.md
```

Expected: zero matches.

```bash
grep -n "docs/artefacts/" CLAUDE.md
```

Expected: at least 5 matches (Document Map, 3 Folder Structure rows, instruction block).

```bash
grep -n "\.methodology/" CLAUDE.md
```

Expected: 1 match (the `.methodology/initialized` reference on line 335 stays).

- [ ] **Step 5: Don't commit yet** — CLAUDE.md changes ship with Phase 3 in a single project commit.

---

## Phase 3 — Migrate existing files

This phase moves files in the project working tree (Google Drive) AND commits them to GitHub via the project's standard clone-to-`/tmp/claude-scratch` pattern.

### Task 17: Stage migrations in the project working tree

**Files:**
- All moves happen in: `/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/`

- [ ] **Step 1: Set the project root variable in the working shell**

```bash
PROJECT="/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"
cd "$PROJECT"
```

- [ ] **Step 2: Create the new artefacts/ directory tree**

```bash
mkdir -p "$PROJECT/docs/artefacts/sprints/tech-debts/handoffs"
mkdir -p "$PROJECT/docs/artefacts/sprints/tech-debt-2026-05-14/handoffs"
mkdir -p "$PROJECT/docs/artefacts/sprints/sprint-tech-debt-2026-05-16-before-mvp/handoffs"
mkdir -p "$PROJECT/docs/artefacts/sprints/technical-review-2026-05-16/handoffs"
mkdir -p "$PROJECT/docs/artefacts/sprints/p0-coverage-report-2026-05-17/handoffs"
mkdir -p "$PROJECT/docs/artefacts/tests"
mkdir -p "$PROJECT/docs/artefacts/reviews/functional-code-review-2026-05-14"
mkdir -p "$PROJECT/docs/artefacts/reviews/technical-workflow-review-2026-05-16"
mkdir -p "$PROJECT/docs/artefacts/handoffs"
mkdir -p "$PROJECT/docs/artefacts/plans"
mkdir -p "$PROJECT/docs/artefacts/specs"
```

Verify:

```bash
find "$PROJECT/docs/artefacts" -type d | sort
```

Expected: the 11 directories above.

---

### Task 18: Move sprint files into per-sprint folders

**Files:** `.methodology/sprint-*` → `docs/artefacts/sprints/<slug>/`

- [ ] **Step 1: Sprint `tech-debts`**

```bash
M="$PROJECT/.methodology"
D="$PROJECT/docs/artefacts/sprints/tech-debts"
mv "$M/sprint-tech-debts-state.md" "$D/state.md"
mv "$M/sprint-tech-debts-working.md" "$D/working.md"
mv "$M/handoff-sprint-tech-debts-batch3.md" "$D/handoffs/batch3.md"
mv "$M/handoff-sprint-tech-debts-batch5.md" "$D/handoffs/batch5.md"
mv "$M/handoff-sprint-tech-debts-batch6.md" "$D/handoffs/batch6.md"
mv "$M/handoff-sprint-tech-debts-batch7.md" "$D/handoffs/batch7.md"
mv "$M/handoff-sprint-tech-debts-batch8.md" "$D/handoffs/batch8.md"
mv "$M/handoff-sprint-tech-debts-complete.md" "$D/handoffs/complete.md"
ls "$D" "$D/handoffs"
```

Expected: `state.md`, `working.md`, `handoffs/` with 6 files.

- [ ] **Step 2: Sprint `tech-debt-2026-05-14`**

```bash
D="$PROJECT/docs/artefacts/sprints/tech-debt-2026-05-14"
mv "$M/sprint-tech-debt-2026-05-14-state.md" "$D/state.md"
mv "$M/sprint-tech-debt-2026-05-14-working.md" "$D/working.md"
mv "$M/sprint-tech-debt-2026-05-14-followups.md" "$D/followups.md"
mv "$M/handoff-sprint-tech-debt-batch2-complete.md" "$D/handoffs/batch2-complete.md"
mv "$M/handoff-sprint-tech-debt-batch3-complete.md" "$D/handoffs/batch3-complete.md"
ls "$D" "$D/handoffs"
```

Expected: 3 state files + handoffs/ with 2 files.

- [ ] **Step 3: Sprint `sprint-tech-debt-2026-05-16-before-mvp`**

```bash
D="$PROJECT/docs/artefacts/sprints/sprint-tech-debt-2026-05-16-before-mvp"
mv "$M/sprint-sprint-tech-debt-2026-05-16-before-mvp-state.md" "$D/state.md"
mv "$M/sprint-sprint-tech-debt-2026-05-16-before-mvp-working.md" "$D/working.md"
mv "$M/handoff-sprint-tech-debt-2026-05-16-before-mvp-complete.md" "$D/handoffs/complete.md"
ls "$D" "$D/handoffs"
```

Expected: 2 state files + handoffs/complete.md.

- [ ] **Step 4: Sprint `technical-review-2026-05-16`**

```bash
D="$PROJECT/docs/artefacts/sprints/technical-review-2026-05-16"
mv "$M/sprint-technical-review-2026-05-16-state.md" "$D/state.md"
mv "$M/sprint-technical-review-2026-05-16-followups.md" "$D/followups.md"
mv "$M/handoff-technical-review-2026-05-16-complete.md" "$D/handoffs/complete.md"
ls "$D" "$D/handoffs"
```

Expected: 2 state files + handoffs/complete.md.

- [ ] **Step 5: Sprint `p0-coverage-report-2026-05-17`**

```bash
D="$PROJECT/docs/artefacts/sprints/p0-coverage-report-2026-05-17"
mv "$M/sprint-p0-coverage-report-2026-05-17-state.md" "$D/state.md"
mv "$M/sprint-p0-coverage-report-2026-05-17-working.md" "$D/working.md"
mv "$M/sprint-p0-coverage-report-2026-05-17-followups.md" "$D/followups.md"
mv "$M/handoff-sprint-p0-coverage-batch5-resume-2026-05-17.md" "$D/handoffs/batch5-resume.md"
mv "$M/handoff-sprint-p0-coverage-batch5-complete-2026-05-17.md" "$D/handoffs/batch5-complete.md"
mv "$M/handoff-sprint-p0-coverage-batch6-complete-2026-05-17.md" "$D/handoffs/batch6-complete.md"
mv "$PROJECT/docs/superpowers/reports/P0_Coverage_Report_2026-05-17.md" "$D/report.md"
ls "$D" "$D/handoffs"
```

Expected: 3 state files + report.md + handoffs/ with 3 files.

---

### Task 19: Move test session folders

**Files:** `.methodology/test-*/` → `docs/artefacts/tests/<same-name-minus-leading-test->/`

- [ ] **Step 1: Move the three test folders verbatim, stripping the `test-` prefix**

```bash
mv "$M/test-exploratory-feedback-rebook-2026-05-16" "$PROJECT/docs/artefacts/tests/exploratory-feedback-rebook-2026-05-16"
mv "$M/test-exploratory-pre-smoke-test-2026-05-16" "$PROJECT/docs/artefacts/tests/exploratory-pre-smoke-test-2026-05-16"
mv "$M/test-smoke-post-p0-review-2026-05-17" "$PROJECT/docs/artefacts/tests/smoke-post-p0-review-2026-05-17"
ls "$PROJECT/docs/artefacts/tests"
```

Expected: 3 directories.

- [ ] **Step 2: Sanity-check that subcontents survived**

```bash
ls "$PROJECT/docs/artefacts/tests/exploratory-feedback-rebook-2026-05-16"
ls "$PROJECT/docs/artefacts/tests/smoke-post-p0-review-2026-05-17/.cursors"
```

Expected: session.md/tldr.md/story.md/report.html present; .cursors/ files present.

---

### Task 20: Move and rename review artefacts

**Files:** `docs/superpowers/` loose files → `docs/artefacts/reviews/<review-folder>/`

- [ ] **Step 1: Functional code review (D1–D4 + tracker + html + test cases + test report)**

```bash
S="$PROJECT/docs/superpowers"
D="$PROJECT/docs/artefacts/reviews/functional-code-review-2026-05-14"
mv "$S/FunctionalCodeReview_D1_onboarding.md"          "$D/D1-onboarding.md"
mv "$S/FunctionalCodeReview_D2_payment_admin.md"       "$D/D2-payment-admin.md"
mv "$S/FunctionalCodeReview_D3_relay_postconsult.md"   "$D/D3-relay-postconsult.md"
mv "$S/FunctionalCodeReview_D4_keywords_edge_intent.md" "$D/D4-keywords-edge-intent.md"
mv "$S/FunctionalCodeReview_tracker.md"                "$D/tracker.md"
mv "$S/FunctionalCodeReview_2026-05-14.html"           "$D/report.html"
mv "$S/FunctionalTestCases.md"                         "$D/test-cases.md"
mv "$S/FunctionalTestReport.md"                        "$D/test-report.md"
ls "$D"
```

Expected: 8 files.

- [ ] **Step 2: Technical workflow review**

```bash
D="$PROJECT/docs/artefacts/reviews/technical-workflow-review-2026-05-16"
mv "$S/TechnicalWorkflowReview_tracker.md"     "$D/tracker.md"
mv "$S/TechnicalWorkflowReview_2026-05-16.html" "$D/report.html"
ls "$D"
```

Expected: 2 files.

---

### Task 21: Move plans and specs

**Files:** `docs/superpowers/{plans,specs}/*` → `docs/artefacts/{plans,specs}/`

- [ ] **Step 1: Move plans (4 files, filenames preserved)**

```bash
mv "$PROJECT/docs/superpowers/plans/"* "$PROJECT/docs/artefacts/plans/"
ls "$PROJECT/docs/artefacts/plans/"
```

Expected: 4 files (the dated 2026-05-12/13/14 plans plus this plan once it lands).

- [ ] **Step 2: Move specs (1 file existing + this plan's spec)**

```bash
mv "$PROJECT/docs/superpowers/specs/"* "$PROJECT/docs/artefacts/specs/"
ls "$PROJECT/docs/artefacts/specs/"
```

Expected: 2 files (`2026-05-14-plan-sprint-split-design.md`, `2026-05-17-artefact-consolidation-design.md`).

- [ ] **Step 3: Confirm this plan itself was moved by Step 1's glob**

```bash
ls "$PROJECT/docs/artefacts/plans/2026-05-17-artefact-consolidation.md"
ls "$PROJECT/docs/superpowers/plans/" 2>/dev/null
```

Expected: first ls succeeds; second ls returns nothing (the directory is empty or gone).

---

### Task 22: Move the orphan handoff

**Files:** `.methodology/handoff-runtime-bugs-fixed-2026-05-16.md` → `docs/artefacts/handoffs/`

- [ ] **Step 1: Move**

```bash
mv "$M/handoff-runtime-bugs-fixed-2026-05-16.md" "$PROJECT/docs/artefacts/handoffs/runtime-bugs-fixed-2026-05-16.md"
ls "$PROJECT/docs/artefacts/handoffs/"
```

Expected: 1 file.

---

### Task 23: Cleanup empty source dirs

**Files:** `docs/superpowers/`, `.methodology/<flat files>`

- [ ] **Step 1: Confirm `docs/superpowers/` is empty (or only `.DS_Store`)**

```bash
find "$PROJECT/docs/superpowers" -type f
```

Expected: at most `.DS_Store`. If any other files remain, STOP and investigate — they were not moved.

- [ ] **Step 2: Remove `docs/superpowers/` and its `.DS_Store`**

```bash
rm -f "$PROJECT/docs/superpowers/.DS_Store"
rm -f "$PROJECT/docs/superpowers/reports/.DS_Store" 2>/dev/null
rmdir "$PROJECT/docs/superpowers/reports" 2>/dev/null
rmdir "$PROJECT/docs/superpowers/plans" 2>/dev/null
rmdir "$PROJECT/docs/superpowers/specs" 2>/dev/null
rmdir "$PROJECT/docs/superpowers"
ls "$PROJECT/docs/" | grep superpowers
```

Expected: no output from the grep — `docs/superpowers/` is gone.

- [ ] **Step 3: Confirm `.methodology/` is reduced to metadata only**

```bash
ls "$M"
```

Expected: only `initialized` (plus optionally `.DS_Store`). Any leftover `sprint-*`, `handoff-*`, or `test-*` is a bug — go back to Tasks 18–22.

- [ ] **Step 4: Remove `.methodology/.DS_Store`**

```bash
rm -f "$M/.DS_Store"
ls "$M"
```

Expected: only `initialized`.

---

### Task 24: Diff old vs new inventory

**Files:** `/tmp/claude-scratch/before-*.txt` from Task 0

- [ ] **Step 1: Snapshot the new state**

```bash
find "$PROJECT/docs/artefacts" -type f -o -type d | sort > /tmp/claude-scratch/after-artefacts.txt
ls "$M" | sort > /tmp/claude-scratch/after-methodology.txt
wc -l /tmp/claude-scratch/before-*.txt /tmp/claude-scratch/after-*.txt
```

- [ ] **Step 2: Confirm no files were lost**

Manually scan `after-artefacts.txt` and confirm every entry from `before-methodology.txt` (except `initialized` and `.DS_Store`) and every entry from `before-superpowers.txt` is accounted for in the new layout. Spot-check a few file sizes:

```bash
ls -l "$PROJECT/docs/artefacts/sprints/p0-coverage-report-2026-05-17/state.md"
# Expected size: matches the original ~31KB
```

---

## Phase 4 — Verify hooks and finalize

### Task 25: Update the Stop hook config if it references old paths

**Files:**
- Modify (if needed): `/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/.claude/settings.local.json`

- [ ] **Step 1: Check for old-path references in the hook config**

```bash
grep -n "\.methodology/\|docs/superpowers/" "$PROJECT/.claude/settings.local.json" 2>/dev/null
```

If no matches: no changes needed; skip to commit.

If matches: edit the file, replacing each hit:
- `.methodology/` (when used as a path arg in a hook command) → keep if it refers to `initialized`; otherwise update to `docs/artefacts/...`
- `docs/superpowers/` → `docs/artefacts/`

- [ ] **Step 2: Verify**

```bash
grep -n "\.methodology/\|docs/superpowers/" "$PROJECT/.claude/settings.local.json" 2>/dev/null
```

Expected: only `.methodology/initialized` references (if any), no `docs/superpowers/` references.

---

### Task 26: Commit and push the project changes

**Files:** All project changes go to GitHub via the clone-to-`/tmp/claude-scratch` pattern (`prasadmujumdar19/chinmay-astro`).

- [ ] **Step 1: Clone the project repo**

```bash
cd /tmp/claude-scratch
rm -rf chinmay-astro
git clone https://github.com/prasadmujumdar19/chinmay-astro.git
cd chinmay-astro
```

- [ ] **Step 2: Mirror the new directory structure from the working tree**

```bash
SRC="/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"
DEST=/tmp/claude-scratch/chinmay-astro

# Delete the old superpowers content from the clone (matches what the working tree did)
rm -rf "$DEST/docs/superpowers"

# Copy the new artefacts tree
mkdir -p "$DEST/docs/artefacts"
cp -r "$SRC/docs/artefacts/." "$DEST/docs/artefacts/"

# Copy the new CLAUDE.md
cp "$SRC/CLAUDE.md" "$DEST/CLAUDE.md"

# Copy the updated hook settings if changed
if [ -f "$SRC/.claude/settings.local.json" ]; then
  mkdir -p "$DEST/.claude"
  cp "$SRC/.claude/settings.local.json" "$DEST/.claude/settings.local.json"
fi

# Note: .methodology/initialized is NOT committed (it's project-local plugin state)
# Note: the four hand-curated input docs at docs/ root (Tech_Debts.md etc.) are unchanged

git status
```

- [ ] **Step 3: Run the secrets scan**

```bash
cd /tmp/claude-scratch/chinmay-astro
grep -rn 'AIzaSy\|sk-\|xoxb-\|AKIA\|"api_key"\|"apikey"\|?key=' docs/artefacts/ CLAUDE.md 2>/dev/null | grep -v "feedback_n8n_curl_workflow\|secrets scan\|grep -rn"
```

Expected: zero hits. If anything matches, investigate before committing.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
docs: consolidate skill artefacts under docs/artefacts/

Retires docs/superpowers/ and reduces .methodology/ to plugin metadata.
All sprints, tests, reviews, plans, specs, and handoffs now live under
docs/artefacts/, with one folder per unit of work. See spec at
docs/artefacts/specs/2026-05-17-artefact-consolidation-design.md.

Companion change: n8n-whatsapp-methodology plugin bumped to v1.13.0 to
write directly to the new layout going forward.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push origin main
```

- [ ] **Step 5: Clean up the local clone**

```bash
cd /tmp/claude-scratch
rm -rf chinmay-astro
```

---

### Task 27: Update the auto-memory note for monitor-test-run naming

**Files:**
- Modify: `~/.claude/projects/-Users-prasadmujumdar-Library-CloudStorage-GoogleDrive-prasadmujumdar-aws-gmail-com-My-Drive-Chinmay-Astro/memory/feedback_monitor_test_run_naming.md`

- [ ] **Step 1: Inspect current content**

```bash
cat ~/.claude/projects/-Users-prasadmujumdar-Library-CloudStorage-GoogleDrive-prasadmujumdar-aws-gmail-com-My-Drive-Chinmay-Astro/memory/feedback_monitor_test_run_naming.md
```

- [ ] **Step 2: Update path examples**

Replace any example like `.methodology/test-<type>-<slug>-<date>` with `docs/artefacts/tests/<type>-<slug>-<date>`. Note that the parent dir is `tests/` and the leading `test-` is dropped from the folder name itself.

The naming RULE itself (the `[-session-<N>]` collision suffix, fresh-session requirement) is unchanged.

- [ ] **Step 3: Verify**

```bash
grep "\.methodology/" ~/.claude/projects/-Users-prasadmujumdar-Library-CloudStorage-GoogleDrive-prasadmujumdar-aws-gmail-com-My-Drive-Chinmay-Astro/memory/feedback_monitor_test_run_naming.md
```

Expected: zero matches.

- [ ] **Step 4: No commit (memory is local, not version-controlled).**

---

## Phase 5 — Validation in a fresh session

### Task 28: Open a fresh Claude Code session and verify session-start works

**Files:** None modified — read-only validation.

- [ ] **Step 1: Close the current session, open a new one in the project directory**

(This step requires a human or the agent to start a new session.)

- [ ] **Step 2: Confirm session-start hook finds the moved artefacts**

In the new session, the SessionStart hook should output:
- `n8n: reachable` / `not reachable` line
- Latest handoff: should be `docs/artefacts/sprints/p0-coverage-report-2026-05-17/handoffs/batch6-complete.md` (or whichever the newest is post-migration)

If the handoff line says "no handoff found" or references an old path, session-start is broken — go back to Task 2.

- [ ] **Step 3: Smoke-test the handoff skill**

In the new session, invoke `superpowers:writing-skills` or directly use the handoff workflow to write a dummy handoff. Verify it lands under `docs/artefacts/handoffs/` (since no `_active` marker exists post-migration).

```bash
ls -la "$PROJECT/docs/artefacts/handoffs/"
```

Expected: at least the dummy handoff plus `runtime-bugs-fixed-2026-05-16.md`.

Delete the dummy after.

- [ ] **Step 4: Smoke-test the active marker by simulating a sprint**

```bash
mkdir -p "$PROJECT/docs/artefacts/sprints/_smoke-test"
touch "$PROJECT/docs/artefacts/sprints/_smoke-test/_active"
ls "$PROJECT/docs/artefacts/sprints/"*/_active
```

Expected: at least one line, showing `_smoke-test/_active`.

```bash
rm -rf "$PROJECT/docs/artefacts/sprints/_smoke-test"
```

---

## Done

Final state:
- Methodology plugin at v1.13.0 in cache, GitHub, and resolved via symlink.
- `docs/artefacts/` is the single root for skill outputs, with per-sprint / per-test / per-review folders.
- `.methodology/` holds only `initialized`.
- `docs/superpowers/` is gone.
- Project `CLAUDE.md` redirects superpowers skill outputs.
- All migrated files committed and pushed.

Open items (out of scope for this plan):
- Sprint slug consistency cleanup — separate exercise.
- Whether the methodology plugin should ship its own `update-skill` meta-skill.
- Auto-memory updates for paths referenced in other memory files beyond `feedback_monitor_test_run_naming.md` (none currently identified, but worth a sweep on first execution).
