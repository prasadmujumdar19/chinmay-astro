## Stopping Point
**BMX-P8-PLUGIN done.** All 12 carried plugin improvements flushed under a single minor bump **1.34.1 → 1.35.0** (operator directive: one version, not twelve). Plugin repo committed/pushed @ `3a6e867`; active cache synced + rolled (real dir `1.35.0`, back-compat symlink `1.34.1→1.35.0`, `installed_plugins.json` + marketplace cache aligned). Script fixes verified (lint-workflows.py Step-5g regex 8/8 test cases + py_compile; assert-md-fresh.sh bash -n). The 13th note (expression-as-shell-var) went to project `CLAUDE.md` (n8n Expression Gotchas table), NOT the plugin. `state.md` BMX-P8-PLUGIN marked done + re-linted OK. This batch was Plugin + Docs only → no workflow touched, no dependency-map rebuild / sibling regression.

## Next Action
**Only `BMX-P5-MATRIX` (P0, Batch 17) remains before the sprint can close** — it is in-progress and was held at operator direction for tomorrow. Resume it: run the live **opted_out re-engage smoke for the 7 ⚠️ S8 cells**, update the behavior-matrix HTML, then close the matrix exit gate. The runbook is in `handoffs/handoff-batch-17-matrix-static-done-smoke-pending.md`. When BMX-P5-MATRIX reaches done and post-batch P0 regression passes, run build-sprint Step 5 to close the sprint (remove `_active`, update workflow-registry WIP, final lint). Re-invoke `build-sprint` with the same input to resume.

## Blockers
- **BMX-P5-MATRIX smoke is the sole open item.** The S10 NULL/out-of-enum-status breakage surfaced in the Batch-17 full-matrix regression is already PARKED post-MVP (user-accepted carve-out, 2026-05-30) with an agreed WF-02 structural-guard fix logged in `followups.md` — do NOT re-implement it this sprint; the matrix HTML marks S10 🛑 deferred-post-MVP.
- Sprint `_active` marker intentionally left in place — sprint is NOT complete.

## Changed Reference Values
- **Methodology plugin version: 1.34.1 → 1.35.0** (cache dir + installed_plugins + marketplace cache all rolled). Old name `1.34.1` is now a symlink → `1.35.0` for in-flight env-var compatibility; removable any time after next session reloads `CLAUDE_PLUGIN_ROOT`.
- Plugin HEAD @ `3a6e867`. Project changeset (state.md item-done + CLAUDE.md expression-as-shell-var note) is committed as the same push that carries this handoff — if you're reading this file on `main`, Batch 18's project-side changes are pushed.
