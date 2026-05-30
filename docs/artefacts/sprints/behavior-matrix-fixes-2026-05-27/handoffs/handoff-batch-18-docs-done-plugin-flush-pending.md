## Stopping Point
Batch 18 split: **BMX-P8-DOCS done** (WhatsApp Flow ID drift corrected — CLAUDE.md:370 + workflow-registry.md:343 legacy table `1408011897720771`→`2260297164474475`; WF-21 row drift-NOTE marked resolved; systemic audit left the dead ID only in dated audit-trail artefacts + backup snapshots). **BMX-P8-PLUGIN deferred to this fresh session** at user direction — it's a 12-improvement flush across 8 plugin files in a separate versioned repo; doing it with fresh context is the quality call. The full prioritized plan with agreed solutions is in `docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/followups.md`.

## Next Action
Execute BMX-P8-PLUGIN: run `flush-plugin-improvements` over the 12 carried plugin notes in `followups.md`, applying ALL of them under a **SINGLE minor version bump 1.34.1 → 1.35.0** (user directive: one version, not 12). The 12 improvements + their exact target files are the table in this handoff's last section; each note in followups.md carries the Observed-on / Gap / Fix detail. Steps: clone plugin repo → apply each edit surgically (verify each target skill's current text first) → one consolidated `## [1.35.0]` CHANGELOG section listing all 12 → bump plugin.json + marketplace.json in lockstep → commit/push → sync active cache + roll dir name 1.34.1→1.35.0 (per flush-plugin-improvements Step 6). SEPARATELY apply the 1 CLAUDE.md note (project, not plugin): "never pass n8n expressions through shell variables — write to file + `jq --rawfile`" → add to the project CLAUDE.md command-discipline section. Then mark BMX-P8-PLUGIN done in state.md. NOTE: skip the non-plugin followups items (WF-53 conditional-sentence live fix, WF-30/31/43 read-source convention, the S8×G/S10 matrix items) — they are not plugin changes.

## Blockers
- **Smoke testing ON HOLD till tomorrow** (user): the BMX-P5-MATRIX exit gate still needs the live opted_out re-engage smoke for 7 ⚠️ S8 cells + the matrix HTML update + gate close. See `handoff-batch-17-matrix-static-done-smoke-pending.md` for that runbook. BMX-P5-MATRIX stays in-progress.
- Plugin flush touches a separate repo (github.com/prasadmujumdar19/n8n-whatsapp-methodology) + cache-sync mechanics — follow flush-plugin-improvements Steps 4–6 exactly; verify all version refs align after sync.
- Sprint cannot close until: BMX-P5-MATRIX (smoke + HTML) AND BMX-P8-PLUGIN both done.

## Changed Reference Values
- WhatsApp Flow ID corrected to `2260297164474475` in CLAUDE.md + workflow-registry.md (the `1408011897720771` value is dead in Meta — never reintroduce). [[project_whatsapp_flow_id]].
- Plugin version will move 1.34.1 → 1.35.0 when BMX-P8-PLUGIN runs.

## BMX-P8-PLUGIN flush table (single 1.35.0 bump)
| # | Improvement (priority) | Target file(s) |
|---|------------------------|----------------|
| 1 | Handoff commit-status line commit-agnostic (low) | `handoff` SKILL |
| 2 | Greenfield `.pseudo` authored in same build batch (med) | `plan-sprint` SKILL |
| 3 | Consumer-contract acceptance gate for contract producers (med) | `build-workflow` §6 + `impact-analysis` §3 |
| 4 | Step-6a dangling scan must cover connection TARGET names (med) | `build-workflow` §6a + `impact-analysis` §2a |
| 5 | No optional chaining `?.` in Set/expression fields (med) | `build-workflow` §5 |
| 6 | Sub-agent audit fan-out pattern — 6 sub-points (med) | `dispatching-subagents` + `build-sprint` Mode-D |
| 7 | Hard-deps carry the depended-on item's solution contract (med) | `plan-sprint` §3d + `build-sprint` pickup pre-check |
| 8 | Step-5g lint regex must not match JS `===` comparisons (low-med) | `scripts/lint-workflows.py` |
| 9 | Handoff-before-commit ordering (med) | `build-sprint` §4.6/§4a + `handoff` Step 3 |
| 10 | Out-of-core field sourcing — prefer existing `RETURNING *` over new SELECT (low-med) | `build-workflow` §5f.0 |
| 11 | `assert-md-fresh.sh` WF-ID→UUID resolution false-STALE fix (med) | `scripts/assert-md-fresh.sh` |
| 12 | Full-matrix-regression-via-Opus reusable pattern (med) | new skill OR `dispatching-subagents` pattern |
| + | (CLAUDE.md, NOT plugin) never pass n8n expressions through shell vars (low) | project `CLAUDE.md` |
