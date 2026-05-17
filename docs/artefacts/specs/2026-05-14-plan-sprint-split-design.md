# Design: Split `build-sprint` into `plan-sprint` + `build-sprint`

**Date:** 2026-05-14
**Plugin:** `n8n-whatsapp-methodology` (target version: 1.2.0)
**Status:** Design — pending user review

## Problem

Today, `build-sprint` does two jobs that should be separate:

1. **Planning** — parse the input file, ask source-file annotation preference, run obsolete detection, invoke `discover-current-state`, detect dependencies, validate priorities, size batches, write `sprint-<slug>-state.md`.
2. **Execution** — iterate items via `build-workflow`, post-batch sibling regression, handoff at ~70% context, sprint complete.

Conflating them produces three concrete issues:

- The user's intuition "session-start initialises a sprint" fractures, because the initialisation actually happens inside the skill named "build" — which intuitively reads as execution.
- Planning and execution have different cost profiles and risk profiles. Planning is a one-shot analytical pass that benefits from review; execution is iterative and resumable. Forcing them into a single invocation discourages careful plan review.
- A user who wants to **only** plan (e.g., review what would be done, decide whether to commit time, share the plan) must currently invoke a skill that's then ready to start executing — there is no clean "stop after planning" boundary.

## Goals

- Split into two user-invocable skills: `plan-sprint` and `build-sprint`.
- Plan is canonical and durable on disk; execution reads it.
- No new third skill (`replan-sprint`). Re-planning is handled inside `plan-sprint` with an explicit user prompt.
- `build-sprint` accepts the same input form as today (file path or inline list) — **not** a slug. It derives the slug identically to `plan-sprint`, locates the existing plan, and refuses to plan on its own.
- Existing in-progress sprint state files remain readable. No migration needed for sprints that completed under the old skill.

## Non-Goals

- Undoing code changes when a user opts to re-plan from scratch. `plan-sprint` only manages planning artefacts (state file + working copy + source annotations). Workflow JSON exports, registry edits, git commits already performed by `build-sprint` are out of scope.
- Changing `build-workflow`, `discover-current-state`, `impact-analysis`, `handoff`, or any other skill's contract.
- Re-architecting sprint-state YAML. The same file format is used; only which skill writes which fields changes.

## Responsibility Split

| Concern | `plan-sprint` (new) | `build-sprint` (refactored) |
|---|---|---|
| Accept input (file path or inline) | ✅ | ✅ (same input, same slug derivation) |
| Derive slug | ✅ | ✅ |
| Parse input → item list | ✅ | ❌ |
| Ask `source_file_update` preference | ✅ | ❌ |
| Obsolete detection (text scan) | ✅ | ❌ |
| Invoke `discover-current-state` | ✅ | ❌ |
| Dependency detection (text + same-workflow siblings) | ✅ | ❌ |
| Priority validation + user confirmation | ✅ | ❌ |
| Batch sizing + `batch:` assignment | ✅ | ❌ |
| Write `sprint-<slug>-state.md` (create or replace) | ✅ | ❌ — reads only |
| Set `planning_complete: true` | ✅ | ❌ |
| Load existing `sprint-<slug>-state.md` | ❌ | ✅ |
| Refuse to start if `planning_complete: true` is absent | n/a | ✅ |
| Execute items via `build-workflow` discipline | ❌ | ✅ |
| Update item status + source/working file annotations | ❌ | ✅ |
| Post-batch sibling regression + `sprint-<slug>-followups.md` | ❌ | ✅ |
| Handoff at 70% context | ❌ | ✅ |
| Sprint complete: report + workflow-registry WIP update | ❌ | ✅ |

## State-File Contract

`.methodology/sprint-<slug>-state.md` is the handoff. Unchanged format, except `planning_complete: true` becomes a **hard gate** read by `build-sprint`.

```yaml
slug: tech-debt-2026-05-14
input_source: docs/Tech_Debt_2026-05-14.md
input_hash: <sha256>
source_file_update: true
working_copy_path: null
planning_complete: true        # set by plan-sprint; required by build-sprint
planned_at: 2026-05-14T...Z
items:
  - id: TD-NEW-001
    ...
    status: pending             # plan-sprint always writes pending
```

`build-sprint` rejects with a clear message if `planning_complete` is missing or false.

## Slug Derivation (must be identical in both skills)

Single function, documented in both SKILL.md files verbatim:

- **File input:** strip extension → lowercase → replace spaces, underscores, dots with hyphens. Example: `Tech_Debt_2026-05-14.md` → `tech-debt-2026-05-14`.
- **Inline input:** `inline-YYYYMMDD-HHMMSS` at the time of `plan-sprint` invocation. `build-sprint` cannot independently re-derive an inline slug because the timestamp differs; for inline sprints, the user passes the exact same items and `build-sprint` looks for the most recent matching `inline-*` state file whose `items` list matches the typed list by hash. (See Edge Cases.)

## `plan-sprint` Behaviour

### Inputs

- File path (any format `build-sprint` accepts today), OR
- Typed inline list.

### Flow

1. Derive slug.
2. Check for existing `.methodology/sprint-<slug>-state.md`:
   - **Absent:** proceed to full planning (current `build-sprint` Step 1b).
   - **Present:**
     - Read `planning_complete`, `input_hash`, and item statuses.
     - Count items by status (`done`, `in-progress`, `pending`, `blocked`, `needs-decision`, `obsolete`).
     - Compute current `input_hash` from the source file (file input only); compare against stored hash.
     - Prompt the user with one message containing the full state:
       > "A plan already exists for slug `<slug>` (created `<planned_at>`).
       > Status: N done, M in-progress, K pending, J blocked, L needs-decision, P obsolete.
       > [If file input and hash differs:] The source file has changed since the plan was created.
       > Options:
       > (A) **Keep existing plan** — exit without changes. Use `build-sprint @<source>` to continue execution.
       > (B) **Replan from scratch** — destroys planning artefacts (sprint-state file + working copy + status annotations in source file). Does NOT undo any code changes already made for completed items. Recommended only if you accept losing the audit trail of what was already done.
       >
       > Type A or B."
     - On `A`: exit, no writes.
     - On `B`:
       - If `source_file_update: true` for the existing plan: strip all `> **Status:** …` blockquotes from the source file (regex-bounded, idempotent).
       - Delete `.methodology/sprint-<slug>-state.md`.
       - Delete `.methodology/sprint-<slug>-working.md` if it exists.
       - Leave `.methodology/sprint-<slug>-followups.md` untouched (it documents sibling issues found during execution — still valid information).
       - Proceed to full planning as if state file were absent.
3. Full planning (lifted verbatim from current `build-sprint` Step 1 + 1b):
   - Parse items.
   - Ask `source_file_update` preference (file input only).
   - Text-based obsolete detection.
   - Invoke `discover-current-state` on items referencing n8n workflows.
   - Dependency detection (hard + soft + same-workflow siblings).
   - Priority validation; surface conflicts; get user confirmation on recommended order.
   - Batch sizing; assign `batch:` numbers.
   - Write sprint-state with `planning_complete: true` and all items `pending`.
   - Write working copy if `source_file_update: false`.
4. Report to user:
   - Total items, breakdown by priority and batch.
   - Obsolete items detected (with reasons).
   - Priority adjustments confirmed.
   - "Next: run `build-sprint @<source>` to begin execution."

### Idempotency Guarantees

- Re-invoking `plan-sprint` with the same input and choosing **A** produces no writes — pure read-only inspection.
- Re-invoking with **B** produces a sprint-state file byte-equivalent to what a fresh first invocation would produce, assuming the source file content is unchanged. (Modulo timestamps in `planned_at`.)
- Planning never touches workflow JSON files, n8n state, or git.

## `build-sprint` Behaviour (Refactored)

### Inputs

Same as today: file path or inline list. **Never a slug.**

### Flow

1. Derive slug (identical logic to `plan-sprint`).
2. Look for `.methodology/sprint-<slug>-state.md`:
   - **Absent:** print:
     > "No sprint plan found for slug `<slug>`. Run `plan-sprint @<source>` first to create the plan, then re-run this skill."
     > Exit.
   - **Present but `planning_complete: false` or missing:** print:
     > "Sprint plan for `<slug>` is incomplete (legacy state, or planning was interrupted). Run `plan-sprint @<source>` to regenerate the plan."
     > Exit.
   - **Present with `planning_complete: true`:** continue.
3. For file input: recompute `input_hash` and compare to stored value. If different:
   > "Source file `<path>` has changed since the plan was created. The execution will follow the original plan. If you want to incorporate the changes, run `plan-sprint @<source>` and choose option B."
   > Continue (warning only — do not block).
4. Execute (current `build-sprint` Steps 2–6 unchanged):
   - Order by priority within current batch.
   - For each item: `build-workflow` discipline + status updates + source/working copy annotation.
   - Batch Surgical recognition.
   - `needs-decision` handling.
   - Post-batch regression + sibling detection + `sprint-<slug>-followups.md`.
   - Handoff at ~70% context.
   - Sprint complete: registry update + final report.

### Resumption

Unchanged from today. Re-invoking `build-sprint` with the same input picks up where the previous session stopped, because step 2 finds the same state file via the same slug.

## `session-start` Update

Step 3b text becomes:

> "Active sprint `<slug>` (`<input_source>`):
> [if planning_complete:false] planned: not yet executed — run `build-sprint @<source>` to begin.
> [if planning_complete:true] N done, M pending, K blocked, L needs-decision, P obsolete."

No behavioural change beyond text. Detection mechanism (glob `.methodology/sprint-*-state.md`) is the same.

## Edge Cases

| Case | Behaviour |
|---|---|
| Inline sprint, user re-invokes `plan-sprint` with same items typed again | New `inline-YYYYMMDD-HHMMSS` slug — treated as new sprint. Cannot deduplicate inline reliably without user intent. Documented in skill prose. |
| Inline sprint, user runs `build-sprint` with same items | `build-sprint` derives the same fresh timestamp and finds no state file. To execute an inline plan, the user must pass the exact slug or the workflow is: plan-sprint → note printed slug → build-sprint accepts slug as alternative input form. **Decision: build-sprint accepts an optional `--slug=<slug>` flag for inline cases only.** File-input sprints always use input. |
| Source file deleted after planning | `build-sprint` runs from sprint-state alone — annotations to source file are skipped with a warning. State is canonical. |
| User runs `build-sprint` on a sprint where all items are already `done` | Prints sprint-complete report. No-op execution. |
| User runs `plan-sprint` on a completed sprint and chooses B | Re-planning proceeds; all `done` audit history is destroyed (with the warning surfaced in step 2 of `plan-sprint`). Code changes already made remain in the codebase. |
| `discover-current-state` sub-skill surfaces obsoletes that conflict with items already marked `done` in a prior plan (option B re-plan) | Not applicable — option B starts from a clean slate, so prior `done` items are lost by design. |
| Two sprints from different sources reference the same workflows | Each has its own state file (different slugs). Sibling regression is per-sprint. No cross-sprint coordination — same as today. |

## Backward Compatibility

- `sprint-tech-debts-state.md` from the completed tech-debts sprint: contains `planning_complete: true` (the file was fully planned and executed). `build-sprint` accepts it as-is. `plan-sprint` invoked on the same source would offer option A (keep) or B (destroy).
- Any in-flight sprint state file written by the pre-split `build-sprint` that lacks `planning_complete:` — `build-sprint` prints a one-time migration notice and treats absence as `true` if every item has a `batch:` field assigned (which the pre-split build-sprint did during planning). If `batch:` is missing, requires re-plan.

## File-System Effects Summary

| Action | `plan-sprint` | `build-sprint` |
|---|---|---|
| Writes `.methodology/sprint-<slug>-state.md` | ✅ create/replace | ✅ update item status only |
| Writes `.methodology/sprint-<slug>-working.md` | ✅ create | ✅ append/update annotations |
| Modifies source file (status blockquotes) | ✅ strips on option B | ✅ writes per item status change |
| Writes `.methodology/sprint-<slug>-followups.md` | ❌ | ✅ appends |
| Modifies `workflow-registry.md` | ❌ | ✅ (sprint-complete) |
| Modifies workflow JSON / n8n state | ❌ | ✅ (via `build-workflow`) |
| Git operations | ❌ | ✅ (via `build-workflow`) |

## Implementation Notes (for the plan, not this design)

The implementation plan will cover:
- New file `skills/plan-sprint/SKILL.md`.
- Refactor `skills/build-sprint/SKILL.md`.
- Update `skills/session-start/SKILL.md` Step 3b text.
- Bump plugin version 1.1.0 → 1.2.0.
- CHANGELOG entry.
- Cache sync per the plugin discipline (`flush-plugin-improvements` covers this if invoked; otherwise manual `.in_use` swap).
- README + `docs/design.md` updates in the plugin repo.

Out of scope for this design doc; tracked in the implementation plan to follow.

## Open Questions

None outstanding. User has confirmed:
- Single skill for planning + re-planning (no `replan-sprint`).
- `plan-sprint` must be idempotent and must not destroy work without explicit user confirmation.
- `discover-current-state` remains a sub-skill of `plan-sprint`.
- `build-sprint` takes the original input (file or inline), not a slug, and derives the slug identically.
- `build-sprint` exits gracefully if no plan exists.
