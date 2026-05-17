# Folder Organisation & Scratch Discipline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Google Drive working directory and GitHub repo to enforce clean folder conventions, and install a Stop hook that warns when files land in the wrong place.

**Architecture:** Sequential tasks — Google Drive cleanup first (so correct paths exist when CLAUDE.md is updated), then CLAUDE.md update (so paths are documented), then Stop hook (enforcement active immediately), then GitHub restructure (cloned locally for batch operations, pushed, cleaned up). No new runtime dependencies.

**Tech Stack:** Bash (file operations, git), GitHub CLI (`gh`), Python3 (JSON parsing in rename script and hook), Claude Code `~/.claude/settings.json` (hook registration)

---

## File Map

| File | Change |
|------|--------|
| Google Drive `docs/reference/` | CREATE — new subdirectory |
| Google Drive `docs/{CONTEXT,INFRA,NEXT_SESSION_HANDOFF,STATUS,Tech_Debts,workflow-registry,dependency-map}.md` | MOVE from root |
| Google Drive `docs/reference/{Slack_n8n_Integration_Reference.md,customer_journey_map.html,user_journey_map.html}` | MOVE from root |
| Google Drive `scripts/n8n_session5_changes.sh` | DELETE — leftover with embedded API key |
| Google Drive `backups/` | DELETE — empty |
| Google Drive `n8n-workflows-backup/` | DELETE — superseded |
| Google Drive `CLAUDE.md` | MODIFY — add Folder Structure section, update doc paths to `docs/` prefix |
| `~/.claude/hooks/check-session-cleanup.sh` | CREATE — Stop hook script |
| `~/.claude/settings.json` | MODIFY — add Stop hook entry |
| GitHub `docs/` | CREATE with all project docs |
| GitHub `CLAUDE.md` | ADD |
| GitHub `scripts/.gitkeep` | ADD — establishes scripts/ convention |
| GitHub `workflows/archive/` | CREATE — move superseded files here |
| GitHub `workflows/{n8n-id}.json` | RENAME from `wf-XX-*.json` |

---

## Task 1: Create docs/reference/ Directory

**Files:** Create `docs/reference/` inside the existing `docs/` directory.

- [ ] **Step 1.1: Create the directory**

```bash
mkdir -p "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/docs/reference"
```

Expected: no output.

- [ ] **Step 1.2: Verify**

```bash
ls "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/docs/"
```

Expected output includes `reference` and `superpowers`.

---

## Task 2: Move Project Docs to docs/

**Move 7 project documents from the root to `docs/`.**

- [ ] **Step 2.1: Move all core docs in one command**

```bash
BASE="/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"
mv "$BASE/CONTEXT.md" "$BASE/INFRA.md" "$BASE/NEXT_SESSION_HANDOFF.md" \
   "$BASE/STATUS.md" "$BASE/Tech_Debts.md" "$BASE/workflow-registry.md" \
   "$BASE/dependency-map.md" "$BASE/docs/"
```

Expected: no output.

- [ ] **Step 2.2: Verify docs/ contents**

```bash
ls "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/docs/"
```

Expected (7 new files + 2 dirs already there):
```
CONTEXT.md  INFRA.md  NEXT_SESSION_HANDOFF.md  STATUS.md  Tech_Debts.md
dependency-map.md  reference  superpowers  workflow-registry.md
```

---

## Task 3: Move Reference Files to docs/reference/

**Move 3 reference files from root to `docs/reference/`.**

- [ ] **Step 3.1: Move reference files**

```bash
BASE="/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"
mv "$BASE/Slack_n8n_Integration_Reference.md" \
   "$BASE/customer_journey_map.html" \
   "$BASE/user_journey_map.html" \
   "$BASE/docs/reference/"
```

Expected: no output.

- [ ] **Step 3.2: Verify docs/reference/ contents**

```bash
ls "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/docs/reference/"
```

Expected: `Slack_n8n_Integration_Reference.md  customer_journey_map.html  user_journey_map.html`

---

## Task 4: Delete Stale Files and Directories

**Delete the session script (embedded API key) and two redundant backup directories.**

- [ ] **Step 4.1: Delete leftover session script**

```bash
rm "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/scripts/n8n_session5_changes.sh"
```

- [ ] **Step 4.2: Delete empty backups directory**

```bash
rmdir "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/backups"
```

- [ ] **Step 4.3: Delete old n8n-workflows-backup directory**

```bash
rm -rf "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/n8n-workflows-backup"
```

- [ ] **Step 4.4: Verify clean root**

```bash
ls "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/"
```

Expected root contents (`.DS_Store` may also appear — fine):
```
.claude  .env  .env.example  .methodology  .superpowers  CLAUDE.md  archive  docs  scripts  workflows
```

---

## Task 5: Update CLAUDE.md — Document Map Paths

**Update all five doc references in the Document Map table to include the `docs/` prefix.**

- [ ] **Step 5.1: Read CLAUDE.md to locate Document Map section**

Read `CLAUDE.md` and find the `## Document Map — Read These First` section. The table currently has bare filenames: `CONTEXT.md`, `workflow-registry.md`, `NEXT_SESSION_HANDOFF.md`, `INFRA.md`, `STATUS.md`.

- [ ] **Step 5.2: Replace the Document Map table**

Find this block in CLAUDE.md:

```
| `CONTEXT.md` | Every session — lean entry point with architecture, DB schema, admin commands, entry points |
| `workflow-registry.md` | Before touching any workflow — WF-XX master list, current status, WIP action list, all n8n IDs |
| `NEXT_SESSION_HANDOFF.md` | Start of each session — what was done last, what's next, key reference values (credential IDs, workflow IDs) |
| `INFRA.md` | When working on infrastructure — CF Tunnel setup, firewall, SSH, Docker, DB backup plan |
| `STATUS.md` | When checking what's working/broken — infra status per component, tech debt items |
```

Replace with:

```
| `docs/CONTEXT.md` | Every session — lean entry point with architecture, DB schema, admin commands, entry points |
| `docs/workflow-registry.md` | Before touching any workflow — WF-XX master list, current status, WIP action list, all n8n IDs |
| `docs/NEXT_SESSION_HANDOFF.md` | Start of each session — what was done last, what's next, key reference values (credential IDs, workflow IDs) |
| `docs/INFRA.md` | When working on infrastructure — CF Tunnel setup, firewall, SSH, Docker, DB backup plan |
| `docs/STATUS.md` | When checking what's working/broken — infra status per component, tech debt items |
```

- [ ] **Step 5.3: Update Methodology section — dependency-map path**

In CLAUDE.md, find the Methodology section line:

```
- Dependency map: `dependency-map.md` (generated by scripts/build-dependency-map.sh)
```

Replace with:

```
- Dependency map: `docs/dependency-map.md` (generated by scripts/build-dependency-map.sh when available)
```

---

## Task 6: Update CLAUDE.md — Add Folder Structure Section

**Insert a new Folder Structure section between the Document Map and Infrastructure sections.**

- [ ] **Step 6.1: Insert Folder Structure section**

In `CLAUDE.md`, find the line `## Infrastructure` and insert the following block immediately before it:

```markdown
## Folder Structure

**Project root contains `CLAUDE.md` only.** All other files have a designated home:

| File type | Location |
|-----------|----------|
| Session/intermediate scripts, scratch files | `/tmp/claude-scratch/` — deleted at session end |
| Operational scripts (export, backup, DB migrations) | `scripts/` — committed to GitHub |
| Project documentation | `docs/` |
| Implementation plans | `docs/superpowers/plans/` |
| Design specs | `docs/superpowers/specs/` |
| Reference material (journey maps, integration guides) | `docs/reference/` |
| Generated artifacts (`dependency-map.md`) | `docs/` |
| Superseded/archived items | `archive/` — use dated filenames |

**Session cleanup:** A Stop hook checks these boundaries at session end. Address any warnings before ending the session.

```

- [ ] **Step 6.2: Verify CLAUDE.md has all three updates**

Read `CLAUDE.md` and confirm:
1. Document Map table has `docs/` prefix on all 5 paths
2. `## Folder Structure` section exists between Document Map and `## Infrastructure`
3. Methodology section has `docs/dependency-map.md`

---

## Task 7: Create Stop Hook Script

**Create the hook that warns Claude about stray files at session end.**

- [ ] **Step 7.1: Write the hook script**

Create `~/.claude/hooks/check-session-cleanup.sh` with this content:

```bash
#!/bin/bash
# Stop hook: warns Claude if session cleanup is needed before ending.
# Checks /tmp/claude-scratch/, project root allowlist, scripts/ allowlist.
# Exits 2 (warning visible to Claude) if any violation found. Never auto-deletes.

PROJECT_PATH="/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"

WARNINGS=0

# ── Check 1: /tmp/claude-scratch/ ─────────────────────────────────────────
if [ -d "/tmp/claude-scratch" ] && [ "$(ls -A /tmp/claude-scratch 2>/dev/null)" ]; then
    echo "⚠️  CLEANUP: /tmp/claude-scratch/ is non-empty:" >&2
    ls /tmp/claude-scratch/ >&2
    echo "   Fix: rm -rf /tmp/claude-scratch/" >&2
    WARNINGS=1
fi

# ── Check 2: Project root allowlist ───────────────────────────────────────
ALLOWED_ROOT=("CLAUDE.md" ".env" ".env.example" ".DS_Store")
ALLOWED_DIRS=(".claude" ".methodology" ".superpowers" "docs" "scripts" "workflows" "archive")
ALL_ALLOWED=("${ALLOWED_ROOT[@]}" "${ALLOWED_DIRS[@]}")

while IFS= read -r -d '' item; do
    name=$(basename "$item")
    is_allowed=false
    for a in "${ALL_ALLOWED[@]}"; do
        [ "$name" = "$a" ] && is_allowed=true && break
    done
    if ! $is_allowed; then
        echo "⚠️  CLEANUP: Unexpected item in project root: $name" >&2
        echo "   Fix: move to docs/, archive/, or delete it." >&2
        WARNINGS=1
    fi
done < <(find "$PROJECT_PATH" -maxdepth 1 -mindepth 1 -print0 2>/dev/null)

# ── Check 3: scripts/ allowlist ───────────────────────────────────────────
ALLOWED_SCRIPTS=("export-all-workflows.sh" "backup-workflow.sh" "build-dependency-map.sh")
SCRIPTS_DIR="$PROJECT_PATH/scripts"

if [ -d "$SCRIPTS_DIR" ]; then
    while IFS= read -r -d '' item; do
        name=$(basename "$item")
        is_allowed=false
        for a in "${ALLOWED_SCRIPTS[@]}"; do
            [ "$name" = "$a" ] && is_allowed=true && break
        done
        if ! $is_allowed; then
            echo "⚠️  CLEANUP: Unexpected file in scripts/: $name" >&2
            echo "   Fix: move to /tmp/claude-scratch/ or delete it." >&2
            WARNINGS=1
        fi
    done < <(find "$SCRIPTS_DIR" -maxdepth 1 -mindepth 1 -type f -print0 2>/dev/null)
fi

# ── Final verdict ──────────────────────────────────────────────────────────
if [ $WARNINGS -eq 1 ]; then
    echo "" >&2
    echo "⛔ Address the warnings above before ending the session." >&2
    exit 2
fi

exit 0
```

- [ ] **Step 7.2: Make executable**

```bash
chmod +x ~/.claude/hooks/check-session-cleanup.sh
```

- [ ] **Step 7.3: Test — clean state should pass**

```bash
~/.claude/hooks/check-session-cleanup.sh; echo "Exit code: $?"
```

Expected: no output, `Exit code: 0`.

- [ ] **Step 7.4: Test — scratch dir triggers warning**

```bash
mkdir -p /tmp/claude-scratch && touch /tmp/claude-scratch/test.txt
~/.claude/hooks/check-session-cleanup.sh; echo "Exit code: $?"
rm -rf /tmp/claude-scratch
```

Expected: warning message about `/tmp/claude-scratch/`, `Exit code: 2`.

---

## Task 8: Register Stop Hook in settings.json

**Add the Stop event hook entry to `~/.claude/settings.json`.**

- [ ] **Step 8.1: Read current settings.json**

Read `~/.claude/settings.json` to see the full current structure before editing.

- [ ] **Step 8.2: Add Stop hook using Python (safe merge — preserves all other keys)**

```bash
python3 - <<'EOF'
import json, os

path = os.path.expanduser("~/.claude/settings.json")
with open(path) as f:
    settings = json.load(f)

settings.setdefault("hooks", {})["Stop"] = [
    {
        "hooks": [
            {
                "type": "command",
                "command": "/Users/prasadmujumdar/.claude/hooks/check-session-cleanup.sh"
            }
        ]
    }
]

with open(path, "w") as f:
    json.dump(settings, f, indent=2)

print("Done")
EOF
```

Expected: `Done`.

- [ ] **Step 8.3: Verify JSON is valid and Stop hook is present**

```bash
python3 -c "
import json, os
s = json.load(open(os.path.expanduser('~/.claude/settings.json')))
print('Stop hook:', s['hooks']['Stop'][0]['hooks'][0]['command'])
print('PreToolUse still present:', 'PreToolUse' in s['hooks'])
"
```

Expected:
```
Stop hook: /Users/prasadmujumdar/.claude/hooks/check-session-cleanup.sh
PreToolUse still present: True
```

---

## Task 9: GitHub Restructure — Clone and Prepare Directories

**Clone the repo to a temp location for all batch operations.**

- [ ] **Step 9.1: Create scratch dir and clone**

```bash
mkdir -p /tmp/claude-scratch
git clone https://github.com/prasadmujumdar19/chinmay-astro.git /tmp/claude-scratch/chinmay-astro
```

Expected: clones successfully, ends with `Resolving deltas: 100%`.

- [ ] **Step 9.2: Verify clone contents**

```bash
ls /tmp/claude-scratch/chinmay-astro/
```

Expected: `.gitignore  README.md  workflows/`

- [ ] **Step 9.3: Create target directories**

```bash
mkdir -p /tmp/claude-scratch/chinmay-astro/docs \
          /tmp/claude-scratch/chinmay-astro/scripts \
          /tmp/claude-scratch/chinmay-astro/workflows/archive
```

Expected: no output.

---

## Task 10: GitHub Restructure — Add Docs, CLAUDE.md, Scripts Placeholder

**Copy project docs and CLAUDE.md into the GitHub clone. Add a scripts placeholder.**

- [ ] **Step 10.1: Copy all project docs**

```bash
BASE="/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"
REPO="/tmp/claude-scratch/chinmay-astro"

cp "$BASE/docs/CONTEXT.md" \
   "$BASE/docs/INFRA.md" \
   "$BASE/docs/STATUS.md" \
   "$BASE/docs/Tech_Debts.md" \
   "$BASE/docs/workflow-registry.md" \
   "$BASE/docs/NEXT_SESSION_HANDOFF.md" \
   "$REPO/docs/"
```

Expected: no output.

- [ ] **Step 10.2: Copy CLAUDE.md**

```bash
cp "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/CLAUDE.md" \
   /tmp/claude-scratch/chinmay-astro/
```

- [ ] **Step 10.3: Add scripts placeholder**

```bash
touch /tmp/claude-scratch/chinmay-astro/scripts/.gitkeep
```

Note: operational scripts (`export-all-workflows.sh`, `backup-workflow.sh`, `build-dependency-map.sh`) will be added to this directory when the methodology plugin scripts are written. The `.gitkeep` establishes the directory convention in git.

- [ ] **Step 10.4: Verify**

```bash
ls /tmp/claude-scratch/chinmay-astro/docs/
ls /tmp/claude-scratch/chinmay-astro/scripts/
```

Expected docs/: `CONTEXT.md  INFRA.md  NEXT_SESSION_HANDOFF.md  STATUS.md  Tech_Debts.md  workflow-registry.md`
Expected scripts/: `.gitkeep`

---

## Task 11: GitHub Restructure — Archive Superseded Workflows

**Move 3 old files to `workflows/archive/`.**

- [ ] **Step 11.1: Move superseded files**

```bash
cd /tmp/claude-scratch/chinmay-astro/workflows

git mv "backup_20260412_wf-25-post-consultation-options-superseded.json" archive/
git mv "backup_20260412_wf-30-new-user-onboarding-wrong---pre-consent-db-write.json" archive/
git mv "wf-30-new-user-onboarding-wrong---deactivated.json" archive/
```

Expected: no output per command.

- [ ] **Step 11.2: Verify archive contents**

```bash
ls /tmp/claude-scratch/chinmay-astro/workflows/archive/
```

Expected: the three files above.

---

## Task 12: GitHub Restructure — Rename Workflows to n8n IDs

**Rename all `wf-XX-*.json` files to their n8n IDs by reading the `id` field from each JSON. The active n8n ID is stored in every workflow export.**

- [ ] **Step 12.1: Run rename script**

```bash
cd /tmp/claude-scratch/chinmay-astro/workflows

for f in wf-*.json; do
    n8n_id=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['id'])" "$f")
    echo "  $f → $n8n_id.json"
    git mv "$f" "${n8n_id}.json"
done
```

Expected: one line per file, approximately 27 renames, e.g.:
```
  wf-00-webhook-receiver.json → AbCdEfGh12345678.json
  wf-01-message-router.json → XyZwVuTs87654321.json
  ...
```

- [ ] **Step 12.2: Verify — no wf-XX files remain in workflows/ root**

```bash
ls /tmp/claude-scratch/chinmay-astro/workflows/wf-*.json 2>&1
```

Expected: `ls: ... No such file or directory` (all renamed).

- [ ] **Step 12.3: Verify count is consistent**

```bash
ls /tmp/claude-scratch/chinmay-astro/workflows/*.json | wc -l
```

Expected: same count as before (≈27 active workflows, now named by n8n ID).

---

## Task 13: GitHub Restructure — Commit, Push, Protect, Cleanup

**Stage all changes, commit, push, enable branch protection, then clean up the temp clone.**

- [ ] **Step 13.1: Stage all changes**

```bash
cd /tmp/claude-scratch/chinmay-astro
git add docs/ scripts/ CLAUDE.md workflows/
git status --short | head -50
```

Review staged output. Expect:
- `A` (added) entries for docs/, scripts/, CLAUDE.md
- `R` (renamed) entries for workflow files (wf-XX → n8n-ID)
- `R` entries for the three archived files

- [ ] **Step 13.2: Commit**

```bash
cd /tmp/claude-scratch/chinmay-astro
git commit -m "$(cat <<'EOF'
restructure: docs/, scripts/, n8n-ID workflow filenames, branch protection

- Add docs/ with CONTEXT, INFRA, STATUS, Tech_Debts, workflow-registry, NEXT_SESSION_HANDOFF
- Add CLAUDE.md (project instructions, mirrors Google Drive)
- Add scripts/ placeholder (operational scripts to follow with methodology plugin)
- Rename all workflows from wf-XX-*.json to {n8n-id}.json (n8n IDs are canonical for tooling)
- Move superseded backup/deactivated workflows to workflows/archive/
EOF
)"
```

Expected: commit succeeds, shows file count summary.

- [ ] **Step 13.3: Push**

```bash
cd /tmp/claude-scratch/chinmay-astro
git push origin main
```

Expected: `main -> main`, no errors.

- [ ] **Step 13.4: Enable branch protection — block force pushes**

```bash
gh api -X PUT repos/prasadmujumdar19/chinmay-astro/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Expected: JSON response. Confirm it contains `"allow_force_pushes": {"enabled": false}`.

- [ ] **Step 13.5: Verify branch protection**

```bash
gh api repos/prasadmujumdar19/chinmay-astro/branches/main/protection \
  --jq '{"force_push_blocked": (.allow_force_pushes.enabled | not), "deletions_blocked": (.allow_deletions.enabled | not)}'
```

Expected: `{"force_push_blocked": true, "deletions_blocked": true}`

- [ ] **Step 13.6: Delete temp clone and clean up scratch**

```bash
rm -rf /tmp/claude-scratch/chinmay-astro
rmdir /tmp/claude-scratch 2>/dev/null || true
```

Expected: no output.

- [ ] **Step 13.7: Final check — scratch is clean, root is clean**

```bash
ls /tmp/claude-scratch/ 2>/dev/null && echo "SCRATCH HAS FILES" || echo "scratch clean"
ls "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/"
```

Expected: `scratch clean`, root shows only: `.claude .env .env.example .methodology .superpowers CLAUDE.md archive docs scripts workflows`

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Google Drive cleanup (Tasks 1–4)
- ✅ CLAUDE.md — Document Map paths updated (Task 5)
- ✅ CLAUDE.md — Folder Structure section added (Task 6)
- ✅ CLAUDE.md — dependency-map.md path updated (Task 5)
- ✅ Stop hook script created (Task 7)
- ✅ Stop hook registered in settings.json (Task 8)
- ✅ GitHub — docs/ added (Task 10)
- ✅ GitHub — CLAUDE.md added (Task 10)
- ✅ GitHub — scripts/ placeholder added (Task 10)
- ✅ GitHub — workflows/archive/ created and populated (Task 11)
- ✅ GitHub — wf-XX files renamed to n8n IDs (Task 12)
- ✅ GitHub — branch protection enabled (Task 13)
- ✅ Temp clone cleaned up (Task 13)
- ⚠️  `build-dependency-map.sh` not edited — script does not exist on disk yet. CLAUDE.md wording updated to say "when available". When the methodology plugin scripts are written, the output path must be `docs/dependency-map.md`.

**Sequencing rationale:** Tasks 1–4 (Google Drive cleanup) must precede Tasks 5–6 (CLAUDE.md updates that reference the new paths). Tasks 5–6 must precede Task 10 (GitHub copy picks up the updated CLAUDE.md). Task 7–8 (Stop hook) can run any time after Task 4. GitHub tasks (9–13) are independent of Stop hook tasks.
