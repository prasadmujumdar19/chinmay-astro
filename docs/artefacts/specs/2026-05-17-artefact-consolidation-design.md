---
title: Artefact Consolidation — Folder Reorg + Skill Path Updates
date: 2026-05-17
status: design — awaiting implementation plan
---

# Artefact Consolidation

## Problem

Sprint, test, review, plan, spec, and handoff artefacts are scattered across `.methodology/` (29 files at root + 3 test subdirs) and `docs/superpowers/` (4 subdirs + 9 loose review files). The clutter has two root causes:

1. **Plugin defaults write everywhere.** `n8n-whatsapp-methodology` skills (build-sprint, handoff, monitor-test-run, the two review skills, etc.) write to `.methodology/<flat-filenames>`. `superpowers` skills (brainstorming, writing-plans) write to `docs/superpowers/{specs,plans}/`. Past skill runs that produced reviews dumped files at `docs/superpowers/` root with no namespacing.
2. **No per-sprint folder.** State, working copies, followups, and handoffs for the same sprint live as sibling flat files in `.methodology/`, with inconsistent slugs (`sprint-tech-debts-*`, `sprint-tech-debt-2026-05-14-*`, `sprint-sprint-tech-debt-2026-05-16-before-mvp-*`).

The goal is a single artefact root, one folder per unit of work, and skills that write into the right place on the first try.

## Goals

- One folder per sprint / test / review, containing that unit's full lifecycle.
- `docs/artefacts/` as the single root for skill-generated artefacts.
- `.methodology/` reduced to plugin runtime metadata (`initialized`).
- Skills updated so future sessions write directly to the new locations — no re-homing later.

## Non-goals

- Renaming sprint or test slugs for consistency. (`sprint-sprint-...`, missing dates, etc. — separate exercise.)
- Moving hand-curated sprint INPUT docs (`docs/Tech_Debts.md` etc.). The user authors these; they stay where the user puts them.
- Modifying immutable artefacts (`docs/pseudocode/*.pseudo`).
- Touching the upstream superpowers plugin. Path redirection for brainstorming/writing-plans is handled via project-level CLAUDE.md instructions.

## Target layout

```
docs/
  CLAUDE.md, CONTEXT.md, INFRA.md, STATUS.md          (unchanged)
  workflow-registry.md, dependency-map.md             (unchanged)
  pseudocode/                                         (unchanged — immutable)
  reference/                                          (unchanged)

  # Hand-curated sprint INPUT docs — stay where user wrote them
  Tech_Debts.md
  Tech_Debt_2026-05-14.md
  sprint-tech-debt-2026-05-16-before-MVP.md
  sprint-tech-debt-2026-05-16-post-MVP.md

  artefacts/                                          ← NEW root for skill-generated work
    sprints/
      <slug>/
        state.md           (build-sprint runtime state, YAML)
        working.md         (build-sprint working copy of items)
        followups.md       (sibling findings during execution)
        report.md          (sprint output report, if any)
        handoffs/          (handoff skill writes here while sprint is active)
          <topic>.md
        _active            (zero-byte marker; present iff sprint is in flight)
    tests/
      <type>-<slug>-<YYYY-MM-DD>/
        session.md, tldr.md, story.md, report.html
        followups-<topic>.md
        .cursors/
    reviews/
      <review-type>-<YYYY-MM-DD>/
        tracker.md, report.html, D<N>-*.md
        test-cases.md, test-report.md  (functional reviews)
    handoffs/                                         (orphan, non-sprint handoffs only)
      <topic>.md
    plans/                                            (from superpowers:writing-plans)
      YYYY-MM-DD-<topic>.md
    specs/                                            (from superpowers:brainstorming)
      YYYY-MM-DD-<topic>-design.md

.methodology/
  initialized                                         (only file — plugin metadata)
```

### Active-sprint marker

`build-sprint` and `plan-sprint` `touch docs/artefacts/sprints/<slug>/_active` when a sprint starts or resumes. `build-sprint` removes `_active` on sprint completion (after the final batch). The marker lets `session-start`, `handoff`, and any glob detect what is currently in flight without a separate `_active/` directory.

## Migration of existing files

Executed as a one-shot reorg in a follow-up session against a `/tmp/claude-scratch/chinmay-astro` clone, per the project's standard commit pattern.

### Sprint folders (create + move)

| Sprint folder | State files | Handoffs (renamed) | Other |
|---|---|---|---|
| `sprints/tech-debts/` | `sprint-tech-debts-state.md` → `state.md`, `sprint-tech-debts-working.md` → `working.md` | 6 × `handoff-sprint-tech-debts-*.md` (May 13–14 early AM) → `handoffs/batch3.md`, `batch5.md`, `batch6.md`, `batch7.md`, `batch8.md`, `complete.md` | — |
| `sprints/tech-debt-2026-05-14/` | `sprint-tech-debt-2026-05-14-{state,working,followups}.md` → `state.md`, `working.md`, `followups.md` | 2 × `handoff-sprint-tech-debt-batch{2,3}-complete.md` (May 14 afternoon) → `handoffs/batch2-complete.md`, `batch3-complete.md` | — |
| `sprints/sprint-tech-debt-2026-05-16-before-mvp/` | `sprint-sprint-tech-debt-2026-05-16-before-mvp-{state,working}.md` → `state.md`, `working.md` | `handoff-sprint-tech-debt-2026-05-16-before-mvp-complete.md` → `handoffs/complete.md` | — |
| `sprints/technical-review-2026-05-16/` | `sprint-technical-review-2026-05-16-{state,followups}.md` → `state.md`, `followups.md` | `handoff-technical-review-2026-05-16-complete.md` → `handoffs/complete.md` | — |
| `sprints/p0-coverage-report-2026-05-17/` | `sprint-p0-coverage-report-2026-05-17-{state,working,followups}.md` → `state.md`, `working.md`, `followups.md` | `handoff-sprint-p0-coverage-batch5-{resume,complete}-2026-05-17.md` → `handoffs/batch5-{resume,complete}.md`; `handoff-sprint-p0-coverage-batch6-complete-2026-05-17.md` → `handoffs/batch6-complete.md` | `docs/superpowers/reports/P0_Coverage_Report_2026-05-17.md` → `report.md` |

### Test folders (move verbatim)

`.methodology/test-*` (three folders, with `session.md`/`tldr.md`/`story.md`/`report.html`/`followups-*.md`/`.cursors/`) → `docs/artefacts/tests/<same-name-minus-leading-test->/`. The leading `test-` prefix is dropped since the parent folder is `tests/`.

- `test-exploratory-feedback-rebook-2026-05-16/` → `tests/exploratory-feedback-rebook-2026-05-16/`
- `test-exploratory-pre-smoke-test-2026-05-16/` → `tests/exploratory-pre-smoke-test-2026-05-16/`
- `test-smoke-post-p0-review-2026-05-17/` → `tests/smoke-post-p0-review-2026-05-17/`

### Reviews

- `reviews/functional-code-review-2026-05-14/` ← move + rename files from `docs/superpowers/` root to match the new skill convention (`D<N>-<slug>.md`, hyphens, no `FunctionalCodeReview_` prefix):
  - `FunctionalCodeReview_D1_onboarding.md` → `D1-onboarding.md`
  - `FunctionalCodeReview_D2_payment_admin.md` → `D2-payment-admin.md`
  - `FunctionalCodeReview_D3_relay_postconsult.md` → `D3-relay-postconsult.md`
  - `FunctionalCodeReview_D4_keywords_edge_intent.md` → `D4-keywords-edge-intent.md`
  - `FunctionalCodeReview_tracker.md` → `tracker.md`
  - `FunctionalCodeReview_2026-05-14.html` → `report.html`
  - `FunctionalTestCases.md` → `test-cases.md`
  - `FunctionalTestReport.md` → `test-report.md`
- `reviews/technical-workflow-review-2026-05-16/`:
  - `TechnicalWorkflowReview_tracker.md` → `tracker.md`
  - `TechnicalWorkflowReview_2026-05-16.html` → `report.html`

### Plans + specs (move folders intact)

- `docs/superpowers/plans/*` → `docs/artefacts/plans/` (4 files; filenames preserved).
- `docs/superpowers/specs/*` → `docs/artefacts/specs/` (1 file; filename preserved).

### Orphan handoff

- `.methodology/handoff-runtime-bugs-fixed-2026-05-16.md` → `docs/artefacts/handoffs/runtime-bugs-fixed-2026-05-16.md`.

### Cleanup

- Delete `docs/superpowers/` (should be empty after the moves above).
- Delete `.methodology/.DS_Store` and `docs/superpowers/.DS_Store`.
- `.methodology/initialized` stays.

## Plugin / skill / doc updates

Without these, the next session re-clutters `.methodology/`.

### `n8n-whatsapp-methodology` plugin

Bump from v1.12.0 (current active) to v1.13.0. **Routed through the plugin's update-skill workflow** — version bump, symlink reroll, marketplace cache update, commit to `github.com/prasadmujumdar19/n8n-whatsapp-methodology`. No direct edits to cached files.

| Skill | Change |
|---|---|
| `session-start` | Read `docs/artefacts/sprints/*/state.md`, `*/followups.md`, `*/handoffs/`, `docs/artefacts/handoffs/`. Keep `.methodology/initialized` check. |
| `init-project` | Continue to write `.methodology/initialized`. Update `.gitignore` patterns: replace `.methodology/sprint-*` + `.methodology/handoff-*` lines with `docs/artefacts/sprints/*/_active` (or whatever subset stays gitignored). |
| `plan-sprint` | Write `docs/artefacts/sprints/<slug>/{state,working}.md`. `touch _active`. |
| `build-sprint` | Read/write same paths. Append to `followups.md`. `rm _active` on sprint completion. |
| `handoff` | Detect active sprint by scanning `docs/artefacts/sprints/*/_active`. If found: write `docs/artefacts/sprints/<slug>/handoffs/<topic>.md`. Else: write `docs/artefacts/handoffs/<topic>.md`. |
| `monitor-test-run` | Create folder at `docs/artefacts/tests/<type>-<slug>-<YYYY-MM-DD>/`. Drop leading `test-` from the folder name. Update hardcoded default path in `skills/monitor-test-run/scripts/build-report.py`. |
| `functional-code-review` | Read input + write outputs under `docs/artefacts/reviews/functional-code-review-<YYYY-MM-DD>/`. Files: `tracker.md`, `report.html`, `D<N>-<slug>.md`. Update `tracker-template.md` path references. |
| `technical-workflow-review` | Write under `docs/artefacts/reviews/technical-workflow-review-<YYYY-MM-DD>/`. Files: `tracker.md`, `report.html`. |
| `generate-functional-test-cases` | Write to `docs/artefacts/reviews/functional-code-review-<YYYY-MM-DD>/test-cases.md`. |
| `functional-gaps-review` | Read HTML from `docs/artefacts/reviews/`. Write followups to active sprint's `followups.md` (detected via `_active` marker). |

Total impact: ~77 path references across 10 SKILL.md files + 1 template + 1 Python script.

### Superpowers plugin (v5.1.0 — not modified)

`brainstorming` defaults to `docs/superpowers/specs/`; `writing-plans` defaults to `docs/superpowers/plans/`. Both are upstream-controlled and not worth forking.

**Approach:** project-level CLAUDE.md instruction. Skills follow project instructions per the priority rule (`User explicit instructions > Superpowers skills > Default system prompt`). Add to CLAUDE.md:

> When invoking `superpowers:brainstorming`, write specs to `docs/artefacts/specs/` instead of `docs/superpowers/specs/`. When invoking `superpowers:writing-plans`, write plans to `docs/artefacts/plans/` instead of `docs/superpowers/plans/`.

### Project docs (`CLAUDE.md`)

| Line | Current | New |
|---|---|---|
| 17 | `\| `.methodology/handoff-*.md` \| Start of each session...` | `\| `docs/artefacts/sprints/<slug>/handoffs/*.md`, `docs/artefacts/handoffs/*.md` \| Start of each session...` |
| 30 | `\| Implementation plans \| `docs/superpowers/plans/` \|` | `\| Implementation plans \| `docs/artefacts/plans/` \|` |
| 31 | `\| Design specs \| `docs/superpowers/specs/` \|` | `\| Design specs \| `docs/artefacts/specs/` \|` |
| 335 | `verify tunnel open, then check `.methodology/initialized`` | unchanged |
| (new row in Folder Structure table) | — | `\| Sprint / test / review / handoff artefacts \| `docs/artefacts/` \|` |
| (new instruction block) | — | The superpowers redirection block above |

### Hooks / scripts

- `scripts/` does not exist yet in the project; no script updates needed.
- The session-start hook (whose output appears at session boot) references `dependency-map.md` staleness only — no path changes needed.
- The Stop hook referenced in CLAUDE.md ("A Stop hook checks these boundaries") may need its allowed-folders list updated. **Verify during implementation** by inspecting `.claude/settings.local.json` and any other hook config.

## Implementation order (sketch — full plan to be written by writing-plans)

1. Verify Stop hook config and any other path-bound automation.
2. Bump methodology plugin to v1.13.0 via update-skill workflow; update all 10 SKILL.md files + template + Python script.
3. Update project `CLAUDE.md`.
4. Run the migration: clone repo, move files per the tables above, secrets scan, commit, push.
5. Validate: open a fresh session, confirm session-start finds the moved artefacts, confirm a small handoff/sprint test writes to the new location.

## Out of scope / open items

- Sprint slug consistency cleanup (e.g., `sprint-sprint-tech-debt-...`, missing dates) — separate exercise.
- Whether the methodology plugin should provide its own `update-skill` meta-skill (currently the user uses superpowers:writing-skills + manual version bump + symlink reroll). If a meta-skill is added, this work could be its first user.
- Any artefact-generating skills that emerge after this design — they should write directly to `docs/artefacts/<category>/` to avoid future re-homing.
