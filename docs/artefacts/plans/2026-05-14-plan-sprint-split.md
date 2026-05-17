# plan-sprint / build-sprint Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the existing `build-sprint` skill into two separate, single-responsibility skills — `plan-sprint` (planning + idempotent re-planning) and `build-sprint` (execution only) — and release as plugin version 1.2.0 with full sync across the GitHub remote, the user's plugin cache, and the project's documentation.

**Architecture:** Plugin is markdown-only (SKILL.md files plus README/CHANGELOG/design.md). Plugin repo lives at `github.com/prasadmujumdar19/n8n-whatsapp-methodology`. All edits are made in a clean clone in `/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/`, pushed to GitHub `main`, then copied into the local plugin cache at `~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.2.0/` with the prior 1.1.0 directory marked orphaned. The project's design spec and this plan are also committed to the Chinmay Astro project repo (`github.com/prasadmujumdar19/chinmay-astro`) via the established clone-to-tmp pattern documented in `CLAUDE.md`.

**Tech Stack:** Markdown SKILL.md files. Bash + git for delivery. No build, no test framework — verification is grep-based content assertions and one live smoke check against the in-flight `tech-debt-2026-05-14` sprint state file.

---

## File Structure

### Files created in the plugin repo

| Path | Responsibility |
|---|---|
| `skills/plan-sprint/SKILL.md` | NEW. Planning-only skill. Parses input, derives slug, asks source-update preference, runs obsolete detection + `discover-current-state`, detects dependencies, validates priority, sizes batches, writes `sprint-<slug>-state.md` with `planning_complete: true`. Idempotent: re-invocation with same source prompts user to keep (A) or destroy + re-plan (B). |

### Files modified in the plugin repo

| Path | Change |
|---|---|
| `skills/build-sprint/SKILL.md` | Strip Step 1 first-invocation branch and Step 1b (entire planning phase). Step 1 becomes: derive slug → load state → assert `planning_complete: true` (with backward-compat fallback) → report resumption. Add "Prerequisites" prose pointing to `plan-sprint`. Steps 2–6 unchanged semantically; renumber accordingly. |
| `skills/session-start/SKILL.md` | Step 3b text updated to distinguish "planned, not started" vs "in progress" sprints. Detection mechanism unchanged. |
| `README.md` | Skills table: insert `plan-sprint` row above `build-sprint`. Update `build-sprint` description to "execution only". |
| `docs/design.md` | Section 6.4: rename to "`plan-sprint` and `build-sprint` Skills Detail". Add subsection describing the planning/execution split. Update the table on line 155 to list both skills. |
| `CHANGELOG.md` | New `## [1.2.0] — 2026-05-14` section above `[Unreleased]`. Document the split + backward-compat behaviour. |

### Files created in the Chinmay Astro project repo

| Path | Responsibility |
|---|---|
| `docs/superpowers/specs/2026-05-14-plan-sprint-split-design.md` | Already written. Committed by Task 11. |
| `docs/superpowers/plans/2026-05-14-plan-sprint-split.md` | This file. Committed by Task 11. |

### Cache directories touched on the local machine

| Path | Operation |
|---|---|
| `~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.2.0/` | CREATED — full copy of new plugin source. |
| `~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.1.0/.orphaned_at` | CREATED — file marker; presence excludes 1.1.0 from the active-version selector used by the methodology skills. |

---

## Pre-flight: Working Directory Setup

### Task 0: Clone the plugin repo to a scratch directory

**Files:**
- Create: `/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/` (cloned working tree)

- [ ] **Step 1: Verify scratch directory available**

Run:
```bash
mkdir -p /tmp/claude-scratch
ls /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint 2>/dev/null && echo "EXISTS — abort or remove" || echo "OK to clone"
```
Expected: `OK to clone`. If `EXISTS`, stop and decide: resume previous clone, or `rm -rf` and re-clone.

- [ ] **Step 2: Clone the plugin repo**

Run:
```bash
git clone https://github.com/prasadmujumdar19/n8n-whatsapp-methodology /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint
```
Expected: clone succeeds; HEAD on `main`.

- [ ] **Step 3: Confirm baseline matches active cache version**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  diff -r skills ~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.1.0/skills | head -20
```
Expected: no output (clean diff) OR only the differences you intended to introduce in this branch. If there is drift, investigate before proceeding — do **not** silently overwrite.

- [ ] **Step 4: Create a working branch**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git checkout -b feature/plan-sprint-split
```
Expected: switched to new branch `feature/plan-sprint-split`.

---

## Task 1: Create `skills/plan-sprint/SKILL.md`

**Files:**
- Create: `/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/plan-sprint/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

```bash
mkdir -p /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/plan-sprint
```

Write the file with this exact content:

````markdown
---
name: plan-sprint
description: Use when the user provides a task list (file path or typed items) and wants to plan a sprint — parses input, detects dependencies and obsoletes, validates priority, and writes `.methodology/sprint-<slug>-state.md`. Does NOT execute any items. Run `build-sprint` afterwards to execute.
---

# Plan Sprint

## Overview

Parses a task list and produces a durable, reviewable sprint plan on disk. Never modifies workflow JSONs, n8n state, or git. Idempotent: re-invoking on the same source with an existing plan prompts the user to keep the plan (no-op) or destroy planning artefacts and start over.

After `plan-sprint` completes successfully, the user runs `build-sprint` (with the same input) to execute the planned items.

## Input

Accepted at invocation:
- **File path** — any structured task list in any format (`.md`, `.html`, `.txt`, `.yaml`, etc.). Format does not determine how items are extracted.
- **Typed list** — items provided inline at invocation.

### Parsing Rules

Parse intelligently regardless of format. Common structures to handle:

- **Flat lists** — numbered or bulleted items, one per line.
- **H3/H2 section-based docs** — e.g., `### TD-001 · Fix schema prefix` where each H3 is a task.
- **Priority-headed sections** — H2 sections like `## 🔴 P0 — Blockers` contain all items beneath as that priority level.
- **Tables** — rows with priority/status columns.
- **HTML** — structured task lists in HTML format.
- **Any other format** — extract what is identifiable as a task ID, description, and priority signal.

**Priority detection:** Recognise both text labels (`P0`, `P1`, `P2`, `P3`) AND visual cues (🔴 P0, 🟠 P1, 🟡 P2, 🟢 P3, ⚪ P4) AND parent section headings that imply a priority level for all contained items.

**H3-structured documents specifically:** Extract as follows:
- Item ID = the `TD-NNN` (or equivalent) slug from the H3 header.
- Item description = text after `·` or `-` in the H3 header.
- Priority = inherited from the nearest ancestor H2 section that carries a priority label.
- Item body (root cause, fix notes) = retained for dependency detection (Step 3b) but not stored verbatim in sprint-state.

## Slug Derivation

The slug uniquely identifies a sprint and links `plan-sprint` to `build-sprint`. Both skills compute it identically:

- **File input:** strip extension → lowercase → replace spaces, underscores, and dots with hyphens. Examples: `Tech_Debt_2026-05-14.md` → `tech-debt-2026-05-14`; `features_backlog.md` → `features-backlog`.
- **Inline input:** `inline-YYYYMMDD-HHMMSS` derived at the moment `plan-sprint` is invoked. The user must note this slug if they want to resume an inline sprint with `build-sprint --slug=<slug>`.

## Steps

**1. Derive the slug from the input source.**

**2. Check for an existing sprint-state file matching this slug:**

```bash
ls .methodology/sprint-<slug>-state.md 2>/dev/null
```

- **Absent:** proceed to Step 3 (full planning).
- **Present:** proceed to Step 2a (re-plan decision).

**2a. Re-plan decision (only when state file exists)**

Read the existing state file. Extract `planning_complete`, `planned_at`, `input_hash`, `source_file_update`, and counts of items by status.

For file input: compute the current SHA-256 of the source file and compare against the stored `input_hash`.

Present one consolidated message to the user:

> "A sprint plan already exists for slug `<slug>` (created `<planned_at>`).
>
> Current status: N done, M in-progress, K pending, J blocked, L needs-decision, P obsolete.
> [If file input and input_hash differs:] ⚠️ Source file `<path>` has changed since the plan was created.
>
> Options:
>
> **(A) Keep existing plan** — exit without changes. Use `build-sprint @<source>` to continue or begin execution.
>
> **(B) Replan from scratch** — destroys planning artefacts:
> - `.methodology/sprint-<slug>-state.md` (item status history lost)
> - `.methodology/sprint-<slug>-working.md` if present
> - `> **Status:** …` blockquotes in the source file (only if the existing plan was created with `source_file_update: true`)
>
> Does NOT undo any code changes already made for completed items.
> Does NOT delete `.methodology/sprint-<slug>-followups.md` (post-batch sibling findings remain valid).
>
> Type A or B."

- On `A`: exit immediately. No writes. Report: "Plan kept. Run `build-sprint @<source>` to continue."
- On `B`:
  - If `source_file_update: true` in existing state: read the source file, strip every line matching the regex `^> \*\*Status:\*\* `, write back. This is idempotent.
  - `rm .methodology/sprint-<slug>-state.md`.
  - `rm -f .methodology/sprint-<slug>-working.md`.
  - Leave `.methodology/sprint-<slug>-followups.md` untouched.
  - Continue to Step 3 (full planning).

**3. Source-tracking setup**

If input was a **file**, ask the user once before any analysis:

> "I'll update `<filename>` as items progress — adding a status note to each item as it moves to in-progress, done, blocked, etc. Say 'no' to keep it read-only and I'll maintain a working copy in `.methodology/` instead."

Record the preference for the state file as `source_file_update: true` (annotate source file) or `false` (use working copy).

If input was **inline**: set `source_file_update: false` automatically, no question. Create `.methodology/sprint-<slug>-working.md` with the parsed item list as the working copy.

**3a. Parse items**

Apply the parsing rules above. Produce a flat list with `id`, `description`, `priority`, and the per-item body retained in memory for the next two sub-steps.

**3b. Text-based obsolete detection**

Scan each item's body for signals that it is already resolved or no longer applicable:
- Explicit phrases: "already fixed", "already done", "already resolved", "no longer needed", "not applicable", "out of scope", "duplicate of", "covered by", "obsolete".
- Contextual signals: the described bug/condition no longer exists in the current codebase or n8n instance based on conservative textual inference.

If potential obsoletes are found, include them in the planning confirmation message to the user:
> "The following items appear to already be resolved or no longer applicable — I'll mark them obsolete unless you say otherwise: [list with reason for each]"

If the user confirms: mark those items `obsolete` with `obsolete_reason` in sprint-state. They are excluded from the execution queue.

**3c. n8n state verification (runs after text-based obsolete scan)**

Invoke the `discover-current-state` skill on all items that reference an n8n workflow. It fetches each referenced workflow to disk and greps for the described condition — surfacing items that appear already resolved before any batching begins. Only user-confirmed obsoletes are marked in sprint-state.

**3d. Dependency detection**

For each item, identify relationships to other items:
- **Hard dependency** — item X cannot start until item Y is complete. Look for explicit cues: "must be done together with", "depends on", "requires", "fix must include", "coupled to", "this fix must come after".
- **Soft dependency** — item X should logically follow item Y but is technically independent. Look for: "related to", "also affects", "will conflict with if done first", semantic coupling (e.g., implementing a feature and adding its safety guard).

Add to each item in sprint-state:
```yaml
depends_on:
  - id: TD-NNN
    type: hard   # or: soft
    reason: "one-line explanation"
```

**Same-workflow sibling detection (automatic, runs after text-keyword detection):**

For every pair of items, extract all workflow references from each item's body (WF-XX identifiers or n8n UUIDs). If two items reference the same workflow and neither already has a hard dependency on the other: add a soft dependency between them.

```yaml
depends_on:
  - id: TD-NNN
    type: soft
    reason: "same-workflow sibling — both modify WF-XX; sequential execution required to avoid concurrent update race"
```

Ordering for same-workflow siblings: prefer higher-risk change type first (DB-Schema > Structural > Surgical). If equal risk, use document order. Record the choice in `reason`.

**3e. Priority validation**

Cross-check the stated priority ordering against detected dependencies:
- If a hard-dependency item has LOWER priority than the item that needs it: flag the conflict.
- If tightly coupled items are in different priority levels and should be batched together: flag it.

If conflicts are found, report to the user before proceeding:
> "Before I finalise the plan, I found the following priority/dependency conflicts:
> [list each conflict — item IDs, the dependency, and the problem]
>
> My recommended adjustments: [list proposed priority changes or batching]
>
> Should I proceed with my recommended order, or keep the original priority order?"

Wait for user confirmation. Record the decision in sprint-state:
```yaml
dependency_conflicts_found:
  - "TD-024 (P1) has hard dependency on TD-015 (P1) — recommend scheduling TD-015 first within P1 batch"
priority_adjustments_confirmed: "user confirmed: proceed with recommended order"
```

**3f. Batch sizing**

After ordering by priority and dependencies, estimate the execution token cost of each priority batch. Use these rough buckets:

| Change type | Estimated cost |
|-------------|---------------|
| Documentation | ~2K tokens each |
| Surgical | ~5K per workflow touched |
| Batch Surgical | ~5K × number of workflows |
| Structural | ~15K each |
| DB-Schema | ~20K each |
| Critical path / Workflow-Create | ~25K each |

**Rule:** a single execution batch should not exceed ~80K tokens of estimated work. If the batch exceeds this, split into numbered sub-batches and assign each item a `batch` number in sprint-state.

**Default limits when change type is unknown or estimates are uncertain:**
- Documentation-only: up to 20 items per batch.
- Surgical-only: up to 10 items per batch.
- Any Structural item in the batch: up to 4 items per batch.
- Any Critical path or DB-Schema: up to 2 items per batch.
- Mixed batches: sum the estimates; cap at ~80K.

Batch assignment is final at the end of planning. `build-sprint` does not re-derive batch sizes — it follows the pre-planned batches.

**4. Write the sprint-state file**

Write `.methodology/sprint-<slug>-state.md` with this YAML structure:

```yaml
slug: <slug>
input_source: <relative path or "inline-YYYYMMDD-HHMMSS">
input_hash: <sha256>          # file input only; omit for inline
source_file_update: true       # or false
working_copy_path: null        # or .methodology/sprint-<slug>-working.md
planned_at: <ISO 8601 UTC>
last_updated: <ISO 8601 UTC>
planning_complete: true
dependency_conflicts_found:
  - "..."
priority_adjustments_confirmed: "..."
items:
  - id: TD-001
    description: <text>
    priority: P0
    status: pending
    batch: 1
    depends_on:
      - id: TD-NNN
        type: hard
        reason: "..."
```

All items have `status: pending` at plan-write time. The only exceptions are items the user explicitly confirmed obsolete during Step 3b/3c (`status: obsolete` with `obsolete_reason`), and items that intrinsically require user input before any implementation (`status: needs-decision` with `decision_required` — only used for items where the planning phase itself surfaces a blocking question, e.g., "outside project codebase, requires user action").

If `source_file_update: false`, also write `.methodology/sprint-<slug>-working.md` as a copy of the parsed item list (or a copy of the source file for file input).

**5. Report to the user**

One concise message:
- Total items, breakdown by priority and batch.
- Obsolete items detected (with reasons).
- Priority adjustments confirmed.
- Path to the written sprint-state file.
- "Next: run `build-sprint @<source>` to begin execution."

## Red Flags

| Thought | What to do instead |
|---------|-------------------|
| "The plan already exists and the source file is unchanged — I'll just re-run silently" | Always present the A/B prompt. Silent re-planning destroys audit history without user awareness |
| "User wants to add 3 new items to an existing plan — I'll merge them in" | Plan merging is out of scope. Offer A (keep, exit) or B (full re-plan). If the user wants partial updates, that's a feature request for a future skill, not silent behaviour |
| "I'll start executing the first item now that planning is done" | `plan-sprint` never executes. Always exit and direct the user to `build-sprint` |
| "Source file format is unusual — I'll skip dependency detection" | Run all planning steps. If dependency detection finds nothing, that's a valid outcome and is recorded as such |
| "Discover-current-state takes too long for a 30-item file" | Run it anyway. The cost is paid once during planning, not every session. Skipping risks executing already-resolved items |

## Proactive Plugin Improvement

At the end of planning, before exiting: review whether any new pattern emerged that isn't documented in the plugin. Common candidates:
- A new parsing edge case in the input file format.
- A new class of dependency that the heuristics missed.
- A new obsolete-detection signal that should be added to the keyword list.

If yes: note it in `.methodology/handoff-<topic>.md` Blockers section as "New pattern for plugin: …" so the next `session-start` surfaces it.
````

- [ ] **Step 2: Verify the file is well-formed and exists**

Run:
```bash
ls -la /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/plan-sprint/SKILL.md && \
  head -5 /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/plan-sprint/SKILL.md
```
Expected: file exists, first 5 lines show the frontmatter `---\nname: plan-sprint\ndescription: …`.

- [ ] **Step 3: Grep-check that the key contracts are present**

Run:
```bash
F=/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/plan-sprint/SKILL.md
grep -q "planning_complete: true" $F && echo "✓ planning_complete contract" || echo "✗ MISSING"
grep -q "Replan from scratch" $F && echo "✓ option B prompt" || echo "✗ MISSING"
grep -q "Keep existing plan" $F && echo "✓ option A prompt" || echo "✗ MISSING"
grep -q "discover-current-state" $F && echo "✓ discover-current-state invocation" || echo "✗ MISSING"
grep -q "build-sprint" $F && echo "✓ build-sprint handoff reference" || echo "✗ MISSING"
```
Expected: five `✓` lines, zero `✗`.

- [ ] **Step 4: Commit**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git add skills/plan-sprint/SKILL.md && \
  git commit -m "feat(plan-sprint): add new planning-only skill

Extracts planning responsibilities from build-sprint into a dedicated skill.
plan-sprint parses input, asks source-update preference, runs obsolete
detection and discover-current-state, detects dependencies, validates
priority, sizes batches, and writes sprint-<slug>-state.md with
planning_complete: true. Re-invocation is idempotent: prompts the user
to keep the existing plan (option A) or destroy planning artefacts and
re-plan from scratch (option B). Never executes items.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
Expected: commit succeeds.

---

## Task 2: Refactor `skills/build-sprint/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/build-sprint/SKILL.md`

- [ ] **Step 1: Replace the file with the refactored content**

Write the file with this exact content:

````markdown
---
name: build-sprint
description: Use after plan-sprint has produced a sprint plan, to execute the items. Accepts the same input as plan-sprint (file path or inline list) and resumes from the first unfinished item across sessions. Refuses to start if no plan exists for the derived slug.
---

# Build Sprint

## Overview

Executes a previously planned sprint. Reads `.methodology/sprint-<slug>-state.md` and iterates through items in priority + batch order, applying `build-workflow` discipline to each. Resumable across sessions: re-invoking with the same input reloads state and resumes from the first unfinished item. Priority gates enforce full P0 verification before any P1 work begins.

**Prerequisites:** Run `plan-sprint` with the same input first. `build-sprint` does not plan — if no sprint-state file exists for the derived slug, it exits with instructions to run `plan-sprint`.

## Input

Accepted at invocation:
- **File path** — same source the user passed to `plan-sprint`.
- **Typed list** — for inline sprints, requires the slug printed by `plan-sprint` (use `--slug=<inline-YYYYMMDD-HHMMSS>`), because inline slugs include a timestamp that cannot be re-derived from typed items alone.

## Slug Derivation

Must produce the identical slug that `plan-sprint` produced for the same input:

- **File input:** strip extension → lowercase → replace spaces, underscores, and dots with hyphens. Examples: `Tech_Debt_2026-05-14.md` → `tech-debt-2026-05-14`; `features_backlog.md` → `features-backlog`.
- **Inline input:** require the user to pass `--slug=<inline-YYYYMMDD-HHMMSS>`. If absent, list all `.methodology/sprint-inline-*-state.md` files with their `planned_at` timestamps and ask the user to pick one.

## Steps

**1. Load sprint state**

Derive the slug. Look for the state file:

```bash
ls .methodology/sprint-<slug>-state.md 2>/dev/null
```

- **Absent:** print and exit:
  > "No sprint plan found for slug `<slug>`.
  > Run `plan-sprint @<source>` first to create the plan, then re-run this skill."

- **Present with `planning_complete: true`:** continue to Step 1a.

- **Present with `planning_complete: false` or missing:** check whether every item has a `batch:` field assigned (backward compatibility with state files produced before the planning/execution split).
  - If every item has `batch:`: print a one-time warning ("Legacy sprint-state without `planning_complete` flag; treating as planned because all items have batch assignments") and continue.
  - Otherwise print and exit:
    > "Sprint plan for `<slug>` is incomplete (planning interrupted, or legacy state file with no batch assignments). Run `plan-sprint @<source>` to regenerate the plan."

**1a. Detect source-file drift (file input only)**

Recompute SHA-256 of the source file. If different from stored `input_hash`:
> "⚠️ Source file `<path>` has changed since the plan was created.
> Execution will follow the original plan as recorded in `.methodology/sprint-<slug>-state.md`.
> To incorporate the changes, run `plan-sprint @<source>` and choose option B (replan from scratch)."

Continue (warning only — do not block).

**1b. Report resumption point**

Read item statuses. Identify the first item in the lowest-numbered batch with `status: pending` or `in-progress`. Report:

> "Resuming sprint `<slug>` at batch <N> (priority <P>): <item id> — <description>.
> Sprint status: <done count> done, <pending count> pending, <blocked count> blocked, <needs-decision count> needs-decision, <obsolete count> obsolete."

If every item is `done`, `blocked`, `needs-decision`, or `obsolete`: jump to Step 5 (sprint complete).

**2. Order by priority within the current batch**

If priority labels are present in sprint-state: collect all items in the lowest-numbered unfinished batch as the current execution batch. Higher-priority batches (P1, P2, …) are queued but not started until the lower-priority gate clears via Step 4.

If no priority labels: work top-to-bottom through the single implicit batch.

**3. Execute each item**

For every `pending` or `in-progress` item in the **current execution batch** (same priority level AND same `batch` number). Do not advance to the next batch number until post-batch regression passes for the current one.

1. Mark item `in-progress` in sprint-state.
2. Apply `build-workflow` discipline: classify → backup → impact analysis → change → verify → export → registry update.
3. On verified success: mark item `done` with timestamp in sprint-state.
4. On blocker: mark item `blocked`, note the reason, move to the next item.
5. After every status change: update the source file (if `source_file_update: true`) or working copy (if `false`). Append or replace a blockquote status line directly after the item's heading or first identifying line:
   ```
   > **Status:** [emoji] [State] — [YYYY-MM-DD] | [optional: commit ref | WF modified | decision note | blocker reason]
   ```
   Status emojis: ✅ Done | 🔵 In Progress | 🔴 Blocked | 🟡 Needs Decision | ⚪ Obsolete
   If a `> **Status:**` line already exists for this item: replace it in place, do not append a second one.

**Batch Surgical recognition:** If a single sprint item describes the same fix applied to N nodes across M workflows (e.g., "fix schema prefix in 8 workflows", "rename field X in all SQL nodes"), treat it as one Batch Surgical execution using `build-workflow` Step 5d. Do not split it into M separate build-workflow invocations. The single sprint item covers all M workflows; mark it `done` when the single commit lands.

Sub-agents: dispatch at your discretion for genuinely independent work (e.g., simultaneous impact analysis on unrelated workflows, parallel partial updates in a Batch Surgical pass). **Never parallelize two items that share the same workflow** — same-workflow siblings must always run sequentially, even if their `depends_on` type is soft.

**Handling obsolete items:**
- When investigation reveals the issue is already resolved or nothing needs to be done: mark it `obsolete`, record the reason in `obsolete_reason`, and move to the next item.
- Do NOT silently skip an item — always mark it `obsolete` explicitly so the audit trail is clear.
- Obsolete items do not count as `done` or `blocked`. They are excluded from the execution queue and post-batch regression.
- At sprint complete: report obsolete count separately from done/blocked.

**Handling needs-decision items:**
- When an item requires a design decision before implementation: mark it `needs-decision`, record the decision question in `decision_required`, and move to the next item without implementing anything.
- Do NOT attempt partial implementation of a needs-decision item.
- After completing all other executable items in the current priority batch: surface ALL `needs-decision` items together in one message to the user. Wait for answers before proceeding.
- Once the user provides decisions: update the items to `pending` with a `decision_made` note and continue execution.

**4. Post-batch regression before advancing priority**

**Before sibling detection — rebuild dependency map:**

If the current priority batch contained any n8n workflow modifications (Structural, Critical path, DB-Schema, or Workflow-Create changes), rebuild the dependency map before running regression:
```bash
PLUGIN_BASE="$HOME/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology"
ACTIVE=$(ls "$PLUGIN_BASE" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | while read ver; do
  [ ! -f "$PLUGIN_BASE/$ver/.orphaned_at" ] && echo "$ver"
done | sort -V | tail -1)
source .env
"$PLUGIN_BASE/$ACTIVE/scripts/export-all-workflows.sh" && "$PLUGIN_BASE/$ACTIVE/scripts/build-dependency-map.sh"
```
This ensures sibling detection runs against current workflow state, not the state from before the batch. Skip only if the entire batch contained exclusively Documentation changes.

After all items in the current priority batch reach `done`, `blocked`, `needs-decision`, or `obsolete`:

1. Collect every workflow touched in this batch.
2. Dispatch an Explore subagent: identify sibling workflows (same structural pattern) for each touched WF via `docs/dependency-map.md`.
3. Run targeted verification on each sibling — not a full smoke test; only the affected execution path.
4. **Track sibling issues found:** If targeted verification reveals an issue in a sibling workflow that is NOT already in the sprint, append it to `.methodology/sprint-<slug>-followups.md`:
   ```markdown
   ## [YYYY-MM-DD] — Post-batch [priority] regression

   - **[WF-XX]** ([workflow name]): [one-sentence description of the issue]
     - Found while verifying sibling of: [item ID that triggered the check]
   ```
   Create the file if it does not exist. Do not add issues that are already sprint items.
5. Only after siblings pass (or issues are logged): advance to the next priority level (P1, P2, …) or declare the sprint complete.

**4a. Context threshold — handoff**

At ~70% context: invoke the `handoff` skill. The handoff file captures stopping point + next action only.

Sprint-state (`sprint-<slug>-state.md`) carries item status — do **not** copy item details into the handoff file.

Next session: re-invoke `build-sprint` with the same input. Step 1 derives the same slug and reloads sprint-state automatically.

**5. Sprint complete**

All items `done`, `blocked`, `needs-decision`, or `obsolete`, and post-batch regression passed for the final priority level:

- Update `workflow-registry.md` WIP section to reflect resolved items.
- Ensure all items in the source file or working copy have accurate final status annotations.
- Report: items completed, items blocked (with reasons), items marked obsolete (with reasons), total sessions used.
- Do **not** delete `sprint-<slug>-state.md` — retain as audit trail.

## Red Flags

| Thought | What to do instead |
|---------|-------------------|
| "No state file found — let me just plan it inline" | Exit and direct the user to `plan-sprint`. `build-sprint` never plans |
| "I'll start P1 items while a P0 item is still in-progress" | Finish all P0 items and pass post-batch regression before touching P1 |
| "These changes are clearly isolated — I'll skip sibling regression" | Run it anyway; the regression catches what the per-item checklist doesn't |
| "These two items touch the same workflow but are independent — I'll run them in parallel" | Same-workflow siblings always run sequentially. Concurrent partial updates on one workflow risk race conditions |
| "I'll copy sprint-<slug>-state items into the handoff file too" | Sprint-state is the record. Handoff carries only stopping point + next action |
| "The source file changed — I'll re-parse and merge in the new items" | Print the drift warning and continue with the original plan. Item additions require explicit re-plan via `plan-sprint` option B |
| "I'll track item status in memory and write sprint-<slug>-state at the end" | Write to sprint-<slug>-state after every status change. Memory doesn't survive compaction |

## Proactive Plugin Improvement

At the end of each sprint batch, before invoking the handoff skill: review whether any new pattern emerged during this batch that isn't documented in the plugin. Common candidates:
- A new change type was derived during execution.
- A new verification approach was used.
- A new class of dependency or ordering issue was discovered.

If yes: add a note in the handoff file's Blockers section:
> "New pattern for plugin: [describe in one sentence] — add to [skill name] and update `docs/design.md` before next sprint."

Do not silently discard patterns that could improve future sprints on this or other projects.
````

- [ ] **Step 2: Grep-check the refactor removed planning + retained execution**

Run:
```bash
F=/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/build-sprint/SKILL.md
grep -q "Prerequisites" $F && echo "✓ Prerequisites stated" || echo "✗ MISSING"
grep -q "planning_complete: true" $F && echo "✓ gate referenced" || echo "✗ MISSING"
grep -q "No sprint plan found" $F && echo "✓ no-plan error path" || echo "✗ MISSING"
grep -c "discover-current-state" $F | grep -q "^0$" && echo "✓ discover-current-state removed" || echo "✗ STILL PRESENT"
grep -c "First-invocation planning phase" $F | grep -q "^0$" && echo "✓ planning phase extracted" || echo "✗ STILL PRESENT"
grep -q "Batch Surgical recognition" $F && echo "✓ execution semantics retained" || echo "✗ MISSING"
grep -q "Post-batch regression" $F && echo "✓ regression retained" || echo "✗ MISSING"
```
Expected: seven `✓` lines, zero `✗`.

- [ ] **Step 3: Commit**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git add skills/build-sprint/SKILL.md && \
  git commit -m "refactor(build-sprint): extract planning into plan-sprint; execution-only

Strips first-invocation planning (Step 1b) from build-sprint and gates
execution behind planning_complete: true. New behaviour:
- Refuses to start if no sprint-state file exists for the derived slug
- Backward-compat for pre-split state files: treats absence of
  planning_complete as true when every item has a batch assignment
- Source-file drift warning instead of automatic re-parse
- Inline input requires --slug=<...> to disambiguate

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
Expected: commit succeeds.

---

## Task 3: Update `skills/session-start/SKILL.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/session-start/SKILL.md` lines 43–64 (Step 3b section)

- [ ] **Step 1: Locate Step 3b**

Run:
```bash
grep -n "Active sprints and follow-ups\|Active sprint:" /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/session-start/SKILL.md
```
Expected: line numbers for the Step 3b header and the current "Active sprint:" line.

- [ ] **Step 2: Replace the Step 3b body**

Open the file. Find the block beginning at `**3b. Active sprints and follow-ups**` and ending immediately before `**4. Stale artifact check**`. Replace the entire block with:

```markdown
**3b. Active sprints and follow-ups**

Check for any sprint state files:

```bash
ls .methodology/sprint-*-state.md 2>/dev/null
```

If any found: for each file, extract `input_source`, `planning_complete`, and counts by status (one `grep -c` per status). Report one line per sprint:

- If `planning_complete: true` and at least one item is not `done`/`obsolete`:
  > "Active sprint `<slug>` ([source]) — [N done], [M pending/in-progress], [K blocked], [L needs-decision], [P obsolete]. Run `build-sprint @<source>` to continue."
- If `planning_complete: true` and all items are `done`, `blocked`, or `obsolete`:
  > "Completed sprint `<slug>` ([source]) — N done, K blocked, P obsolete. Audit trail retained; no execution needed."
- If `planning_complete: false` or missing:
  > "Planned sprint `<slug>` ([source]) — not yet executed. Run `build-sprint @<source>` to begin."

Also check for sprint follow-up files from sibling regression:

```bash
ls .methodology/sprint-*-followups.md 2>/dev/null
```

If any found: surface each file's contents to the user:
> "Sprint follow-ups from `<slug>`: [list of flagged sibling issues]"
> "These were found during sprint regression but are not yet in any sprint. Add them to a new or existing sprint before starting today's work?"

This surfaces resumable sprints and untracked sibling issues before the user decides on today's work. Skip if no files found.
```

- [ ] **Step 3: Verify the change is well-formed**

Run:
```bash
F=/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/skills/session-start/SKILL.md
grep -q "Planned sprint" $F && echo "✓ planned state surfaced" || echo "✗ MISSING"
grep -q "Active sprint" $F && echo "✓ active state surfaced" || echo "✗ MISSING"
grep -q "Completed sprint" $F && echo "✓ completed state surfaced" || echo "✗ MISSING"
grep -q "Run \`build-sprint" $F && echo "✓ next-step instruction" || echo "✗ MISSING"
```
Expected: four `✓` lines.

- [ ] **Step 4: Commit**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git add skills/session-start/SKILL.md && \
  git commit -m "feat(session-start): distinguish planned/active/completed sprints in 3b

Step 3b now reports three states based on planning_complete flag and
item status counts: planned (not started), active (in flight),
completed (audit trail only). Each line points the user to the
appropriate next-step skill.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
Expected: commit succeeds.

---

## Task 4: Update `README.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/README.md` Skills table (line 49)

- [ ] **Step 1: Identify the current `build-sprint` row**

Run:
```bash
grep -n "build-sprint\||" /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/README.md | head -20
```
Expected: line number for the `| build-sprint |` row.

- [ ] **Step 2: Edit the Skills table**

Use the Edit tool to replace this row:

OLD:
```
| `build-sprint` | After session-start, when working through a task list as a batch |
```

NEW:
```
| `plan-sprint` | After session-start, when given a task list (file or typed) — produces a sprint plan, no execution |
| `build-sprint` | After plan-sprint, to execute the planned items with cross-session resumability |
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -E "plan-sprint|build-sprint" /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/README.md
```
Expected: both rows present, `plan-sprint` listed first.

- [ ] **Step 4: Commit**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git add README.md && \
  git commit -m "docs(README): list plan-sprint and updated build-sprint in skills table

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
Expected: commit succeeds.

---

## Task 5: Update `docs/design.md`

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/docs/design.md` — section 6.4 and the skills table (line 155)

- [ ] **Step 1: Update the skills table on line 155**

Use the Edit tool to replace this row:

OLD:
```
| `build-sprint` | Orchestrate a batch of tasks across one or more sessions with cross-session resumability | After session-start, when user provides a task list (file or typed) to work through systematically |
```

NEW:
```
| `plan-sprint` | Parse a task list (file or typed) and produce a durable sprint plan on disk; idempotent re-planning with user confirmation | After session-start, before any execution |
| `build-sprint` | Execute a previously planned sprint with cross-session resumability and priority gating | After plan-sprint, to start or resume execution |
```

- [ ] **Step 2: Update section 6.4 header**

Use the Edit tool to change:

OLD:
```
### 6.4 `build-sprint` Skill Detail
```

NEW:
```
### 6.4 `plan-sprint` and `build-sprint` Skills Detail

The sprint workflow is split across two skills with a single shared state file (`.methodology/sprint-<slug>-state.md`):

- **`plan-sprint`** owns parsing, obsolete detection, `discover-current-state` invocation, dependency detection, priority validation, batch sizing, and writing the state file with `planning_complete: true`. Never executes items. Idempotent: re-invoking on the same source with an existing plan presents the user with options A (keep, exit) or B (destroy planning artefacts and re-plan).
- **`build-sprint`** owns execution: loads the state file, asserts `planning_complete: true`, iterates items via `build-workflow` discipline, runs post-batch sibling regression, hands off at ~70% context, and reports on sprint completion. Refuses to start if no plan exists.

Both skills derive the slug identically from the input source so the user can run `plan-sprint @file` then `build-sprint @file` without tracking IDs manually.

#### build-sprint detail (legacy section retained below for execution semantics)
```

- [ ] **Step 3: Verify**

Run:
```bash
F=/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/docs/design.md
grep -q "plan-sprint.*build-sprint Skills Detail" $F && echo "✓ section header updated" || echo "✗ MISSING"
grep -c "plan-sprint" $F | awk '{if ($1 >= 4) print "✓ plan-sprint referenced "$1" times"; else print "✗ insufficient references"}'
```
Expected: section header line, plan-sprint referenced 4+ times.

- [ ] **Step 4: Commit**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git add docs/design.md && \
  git commit -m "docs(design): document plan-sprint and build-sprint split in 6.4

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
Expected: commit succeeds.

---

## Task 6: Update `CHANGELOG.md` and bump version

**Files:**
- Modify: `/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/CHANGELOG.md`

- [ ] **Step 1: Confirm there is no plugin manifest version to bump separately**

Run:
```bash
grep -r "\"version\":" /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/ --include="*.json" 2>/dev/null
```
Expected: empty or only references in templates/. If a plugin manifest with a `version` field exists at top level, update it to `1.2.0` in this task.

- [ ] **Step 2: Insert the new CHANGELOG section**

Edit the top of `CHANGELOG.md`. Find the line `## [Unreleased]` and insert above it:

```markdown
## [1.2.0] — 2026-05-14

### Added
- New `plan-sprint` skill — planning-only counterpart to `build-sprint`. Parses input, runs obsolete detection and `discover-current-state`, detects dependencies, validates priority, sizes batches, and writes `.methodology/sprint-<slug>-state.md` with `planning_complete: true`. Re-invocation is idempotent and prompts the user before destroying any prior plan.

### Changed
- **BREAKING (process):** `build-sprint` no longer plans. Calling `build-sprint` without a prior `plan-sprint` exits with an instruction to run the planner first.
- `build-sprint` now reads the same input as before (file or inline) and derives the same slug — no separate slug argument required for file input. Inline input requires `--slug=<inline-...>`.
- `session-start` Step 3b distinguishes planned / active / completed sprints in its report line.
- `README.md` and `docs/design.md` updated to document the split.

### Backward Compatibility
- Sprint-state files produced by the pre-split `build-sprint` are read as-is. If `planning_complete` is absent but every item has a `batch:` assignment, `build-sprint` treats the plan as complete (with a one-time warning) and proceeds to execution. State files without batch assignments require a re-plan.

```

- [ ] **Step 3: Verify**

Run:
```bash
head -25 /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint/CHANGELOG.md | grep -E "1.2.0|plan-sprint|BREAKING"
```
Expected: at least three matching lines.

- [ ] **Step 4: Commit**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git add CHANGELOG.md && \
  git commit -m "chore(release): 1.2.0 — plan-sprint / build-sprint split

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
Expected: commit succeeds.

---

## Task 7: Push the plugin branch and merge to `main`

- [ ] **Step 1: Push the branch**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git push -u origin feature/plan-sprint-split
```
Expected: push succeeds; GitHub returns a PR-create URL.

- [ ] **Step 2: Check whether the user wants a PR or direct merge**

Ask the user:
> "Branch `feature/plan-sprint-split` is pushed. Two options:
> (A) Open a PR for review (recommended for a process-breaking change)
> (B) Fast-forward `main` and push directly (faster, no review)
>
> Which?"

- [ ] **Step 3a: If user chose A — open the PR**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  gh pr create --title "feat: split build-sprint into plan-sprint + build-sprint (v1.2.0)" \
    --body "$(cat <<'EOF'
## Summary
- Adds `plan-sprint` skill for planning-only sprint setup
- Refactors `build-sprint` to execution-only; refuses to start without a plan
- Updates `session-start` 3b text, README skills table, design.md section 6.4
- Bumps version to 1.2.0 with backward-compat for pre-split state files

## Test plan
- [ ] Existing `sprint-tech-debt-2026-05-14-state.md` (planning_complete: true) resumes cleanly under new `build-sprint`
- [ ] Running new `build-sprint` on a slug with no state file exits with the plan-sprint instruction
- [ ] Running `plan-sprint` on an existing plan prompts A/B without writes when A is chosen

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Expected: PR URL printed.

- [ ] **Step 3b: If user chose B — merge to `main` directly**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git checkout main && \
  git merge --ff-only feature/plan-sprint-split && \
  git push origin main
```
Expected: fast-forward succeeds; `main` advanced to the new commits.

- [ ] **Step 4: Confirm the remote `main` is at the new HEAD**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git fetch origin && \
  git log --oneline origin/main -5
```
Expected: top commit is the CHANGELOG release commit (or the PR merge commit if A was chosen and merged through GitHub UI before this step).

---

## Task 8: Sync the local plugin cache to 1.2.0

**Files:**
- Create: `~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.2.0/` (full copy)
- Create: `~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.1.0/.orphaned_at`

- [ ] **Step 1: Verify the active-version-selector logic before changing anything**

Run:
```bash
PLUGIN_BASE="$HOME/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology"
ls "$PLUGIN_BASE" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | while read ver; do
  [ ! -f "$PLUGIN_BASE/$ver/.orphaned_at" ] && echo "active: $ver"
done | sort -V | tail -1
```
Expected: `active: 1.1.0`.

- [ ] **Step 2: Create the 1.2.0 cache directory by copying from the cloned repo**

Run:
```bash
PLUGIN_BASE="$HOME/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology"
SRC=/tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint
[ -d "$PLUGIN_BASE/1.2.0" ] && echo "ABORT: 1.2.0 already exists" || \
  cp -R "$SRC" "$PLUGIN_BASE/1.2.0" && \
  rm -rf "$PLUGIN_BASE/1.2.0/.git" && \
  echo "1.2.0 cache created"
```
Expected: `1.2.0 cache created` (or `ABORT` if it already exists — investigate before proceeding).

- [ ] **Step 3: Mark 1.1.0 orphaned**

Run:
```bash
PLUGIN_BASE="$HOME/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$PLUGIN_BASE/1.1.0/.orphaned_at"
ls "$PLUGIN_BASE/1.1.0/.orphaned_at" && cat "$PLUGIN_BASE/1.1.0/.orphaned_at"
```
Expected: file exists, contains ISO timestamp.

- [ ] **Step 4: Re-run the active-version-selector to confirm the swap**

Run:
```bash
PLUGIN_BASE="$HOME/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology"
ls "$PLUGIN_BASE" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | while read ver; do
  [ ! -f "$PLUGIN_BASE/$ver/.orphaned_at" ] && echo "active: $ver"
done | sort -V | tail -1
```
Expected: `active: 1.2.0`.

- [ ] **Step 5: Verify both new skills are discoverable in the active cache**

Run:
```bash
PLUGIN_BASE="$HOME/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology"
ls "$PLUGIN_BASE/1.2.0/skills/plan-sprint/SKILL.md" "$PLUGIN_BASE/1.2.0/skills/build-sprint/SKILL.md"
```
Expected: both file paths print without error.

---

## Task 9: Smoke-check the in-flight sprint state file

- [ ] **Step 1: Confirm slug-derivation parity for the live sprint**

Run:
```bash
ls .methodology/sprint-tech-debt-2026-05-14-state.md && \
  grep "^slug:\|^input_source:\|^planning_complete:" .methodology/sprint-tech-debt-2026-05-14-state.md
```
Expected:
```
slug: tech-debt-2026-05-14
input_source: docs/Tech_Debt_2026-05-14.md
planning_complete: true
```

- [ ] **Step 2: Confirm the slug `tech-debt-2026-05-14` matches the deterministic derivation**

Run:
```bash
echo "docs/Tech_Debt_2026-05-14.md" | sed -e 's|.*/||' -e 's|\.md$||' | tr '[:upper:]' '[:lower:]' | tr ' _.' '---'
```
Expected: `tech-debt-2026-05-14`. (One-off shell derivation as a sanity check; the skill's actual derivation lives in prose.)

- [ ] **Step 3: Read the new build-sprint SKILL.md's gate logic and confirm it accepts this state file**

Run:
```bash
grep -A 5 "Present with .planning_complete: true" ~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.2.0/skills/build-sprint/SKILL.md
```
Expected: prints the "continue to Step 1a" branch, confirming the live state file's `planning_complete: true` will be accepted.

- [ ] **Step 4: Report to the user**

State:
> "In-flight sprint `tech-debt-2026-05-14` verified compatible with build-sprint 1.2.0. Next time you run `build-sprint @docs/Tech_Debt_2026-05-14.md`, it will resume from the first unfinished item in the lowest-numbered batch."

---

## Task 10: Commit the design spec and this plan to the Chinmay Astro project repo

**Files:**
- Add to remote: `docs/superpowers/specs/2026-05-14-plan-sprint-split-design.md`
- Add to remote: `docs/superpowers/plans/2026-05-14-plan-sprint-split.md`

- [ ] **Step 1: Clone the project repo to scratch**

Run:
```bash
[ -d /tmp/claude-scratch/chinmay-astro-spec-commit ] && echo "ABORT: dir exists" || \
  git clone https://github.com/prasadmujumdar19/chinmay-astro /tmp/claude-scratch/chinmay-astro-spec-commit
```
Expected: clone succeeds. If dir exists, investigate.

- [ ] **Step 2: Copy the spec and plan into the clone**

Run:
```bash
PROJ="/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro"
CLONE=/tmp/claude-scratch/chinmay-astro-spec-commit
mkdir -p "$CLONE/docs/superpowers/specs" "$CLONE/docs/superpowers/plans"
cp "$PROJ/docs/superpowers/specs/2026-05-14-plan-sprint-split-design.md" "$CLONE/docs/superpowers/specs/"
cp "$PROJ/docs/superpowers/plans/2026-05-14-plan-sprint-split.md" "$CLONE/docs/superpowers/plans/"
ls "$CLONE/docs/superpowers/specs/" "$CLONE/docs/superpowers/plans/"
```
Expected: both files listed.

- [ ] **Step 3: Secrets scan**

Run:
```bash
grep -rn 'AIzaSy\|sk-\|xoxb-\|AKIA' /tmp/claude-scratch/chinmay-astro-spec-commit/docs/superpowers/
```
Expected: empty output.

- [ ] **Step 4: Commit and push**

Run:
```bash
cd /tmp/claude-scratch/chinmay-astro-spec-commit && \
  git add docs/superpowers/specs/2026-05-14-plan-sprint-split-design.md \
          docs/superpowers/plans/2026-05-14-plan-sprint-split.md && \
  git commit -m "docs: plan-sprint / build-sprint split design and implementation plan

Records the design and step-by-step plan for splitting the
n8n-whatsapp-methodology plugin's build-sprint skill into a
planning-only plan-sprint and an execution-only build-sprint.
Implementation lives in the plugin repo at v1.2.0.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" && \
  git push origin main
```
Expected: commit succeeds, push succeeds.

---

## Task 11: Final cross-repository version verification

- [ ] **Step 1: Remote plugin `main` HEAD**

Run:
```bash
cd /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint && \
  git fetch origin && \
  git log --oneline origin/main -3 && \
  git show origin/main:CHANGELOG.md | head -10
```
Expected: top commit is the release commit; CHANGELOG top section is `## [1.2.0] — 2026-05-14`.

- [ ] **Step 2: Local plugin cache active version**

Run:
```bash
PLUGIN_BASE="$HOME/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology"
ACTIVE=$(ls "$PLUGIN_BASE" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | while read ver; do
  [ ! -f "$PLUGIN_BASE/$ver/.orphaned_at" ] && echo "$ver"
done | sort -V | tail -1)
echo "Active cache version: $ACTIVE"
head -3 "$PLUGIN_BASE/$ACTIVE/CHANGELOG.md"
```
Expected: `Active cache version: 1.2.0`, CHANGELOG starts with `## [1.2.0]`.

- [ ] **Step 3: Diff active cache against remote `main`**

Run:
```bash
PLUGIN_BASE="$HOME/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology"
diff -r --brief --exclude=.git "$PLUGIN_BASE/1.2.0" /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint
```
Expected: empty (no differences). If any file differs, investigate before reporting done.

- [ ] **Step 4: Confirm both new skills are discoverable to a fresh session**

Run:
```bash
ls ~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/1.2.0/skills/ | sort
```
Expected: directory listing includes `plan-sprint` and `build-sprint` among the others.

- [ ] **Step 5: Report to the user**

State:
> "Sync complete:
> - Remote `main` (prasadmujumdar19/n8n-whatsapp-methodology): at v1.2.0 release commit
> - Local cache: `1.2.0/` active, `1.1.0/.orphaned_at` written
> - Chinmay Astro project repo: design spec + plan committed
> - In-flight sprint `tech-debt-2026-05-14` verified compatible
>
> No further action required. Open a new session to pick up the active 1.2.0 cache."

---

## Task 12: Cleanup

- [ ] **Step 1: Confirm the user has no remaining work in /tmp/claude-scratch/**

Ask the user before deleting anything: another agent's work may be in there.

> "Two scratch dirs were created this session:
> - /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint (plugin clone)
> - /tmp/claude-scratch/chinmay-astro-spec-commit (project clone)
>
> Remove both? Yes/No."

On Yes:

Run:
```bash
rm -rf /tmp/claude-scratch/n8n-whatsapp-methodology-plan-sprint /tmp/claude-scratch/chinmay-astro-spec-commit
ls /tmp/claude-scratch/ 2>/dev/null
```
Expected: only the other agent's files remain.

On No: leave both directories in place.
