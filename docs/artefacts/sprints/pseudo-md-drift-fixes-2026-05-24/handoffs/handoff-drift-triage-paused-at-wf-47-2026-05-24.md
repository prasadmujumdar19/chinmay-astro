## Stopping Point

Mid-walkthrough of the per-WF drift triage for sprint `pseudo-md-drift-fixes-2026-05-24`. Drift-check itself (Phase 1) is COMPLETE — 27 pairs checked, 1 CLEAN (WF-21), 26 DRIFT, freshness marker written. Triage Phase 2 has covered 6 of 27 WFs (WF-00, WF-01, WF-02, WF-10, WF-11, WF-20). Six sprint items captured in `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md`. Two findings deferred to upcoming tech-error-handling sprint logged in `deferred-to-tech-sprint.md`. WF-47 was queued next per user request (pulled out of normal sequence) because the WF-20 fix exposed a WF-47 design question; the user-proposed WF-47 reorder is approved but not yet entered as a sprint item.

## Next Action

Resume per-WF triage starting with **WF-47** (pulled forward), then return to normal sequence: WF-21 (revisit-for-ripple even though originally CLEAN) → WF-22 → WF-23 → WF-25 → WF-30 → WF-31 → WF-32 → WF-33 → WF-34 → WF-40 → WF-41 → WF-42 → WF-43 → WF-44 → WF-45 → WF-46 → WF-50 → WF-51 → WF-52 → WF-60.

For WF-47 specifically, enter as a P0 sprint item (combined with TD-DRIFT-006 cascade): reorder live to `IF userStatus==='consultation_active'` → `Close Open Consultation` → `UPDATE users to opted_out` → `Has Slack Channel?` → notify; update WF-47.pseudo to match new ordering and add structured Inputs block. **No pre-onboarding "user row exists?" branch needed** — verified that WF-01's `Anomaly Route?` already intercepts pre-onboarding STOP/REBOOK via the `anomaly_keyword` route to admin alert (never reaches WF-47). The deferred `alwaysOutputData` finding stays deferred.

Read `tasks.md` (current sprint items + priority buckets), `deferred-to-tech-sprint.md`, and `docs/artefacts/drift-checks/2026-05-24/tracker.md` (raw findings per WF) before resuming. Use the same Q-per-WF interactive pattern with `AskUserQuestion`; collapse multi-finding D8/D9 into single `.pseudo` revisions where possible; apply `[[feedback_pseudo_tech_separation]]` to auto-defer n8n-mechanism findings.

## Blockers

- **Plugin improvement candidates (not yet applied):**
  1. The `pseudo-md-drift-check` skill currently says "do not dispatch one subagent per pair" — the override pattern (27 parallel Sonnet subagents in background, parent-aggregates JSON) worked well when user explicitly requested it and should be documented as a valid override path in the skill, with the discipline (run_in_background=true, strict-JSON schema, parent-only writes).
  2. The D8/D9 rubric in `pseudo-md-drift-check` should call out a router-workflow distinction between **consumed inputs** and **passthrough-to-sub-workflow inputs** (came up in WF-02, WF-11; WF-20 also). Triage produces cleaner Inputs blocks when this distinction is named explicitly.
  3. The `feedback_pseudo_tech_separation` principle (saved as memory this session) is project-agnostic and worth elevating into a plugin skill or principle doc so other projects inherit it. Currently only lives in this project's memory.

  Apply via `flush-plugin-improvements` skill in a future session — not this one (context too high to do it cleanly now).

- **No user input blockers.** Six items decided cleanly; WF-47 next-decisions are pre-loaded in this handoff's Next Action.

## Changed Reference Values

None. No credentials, n8n IDs, URLs, or environment values changed this session.

New artefacts created (existing-locations, not changed values):
- `docs/artefacts/drift-checks/2026-05-24/tracker.md`
- `docs/artefacts/drift-checks/2026-05-24/report.html`
- `docs/artefacts/drift-checks/.last-run` (status: DRIFT, 26 drift, 1 clean)
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md` (6 items entered)
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/deferred-to-tech-sprint.md` (2 entries)
- `~/.claude/projects/.../memory/feedback_pseudo_tech_separation.md` (new feedback memory, indexed in MEMORY.md)

`docs/pseudocode/WF-*.md` regenerated from live n8n (Phase 0) — affects 27 files but content reflects current live state.
