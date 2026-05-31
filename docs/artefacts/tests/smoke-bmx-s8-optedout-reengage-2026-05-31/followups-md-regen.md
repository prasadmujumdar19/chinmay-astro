# Deferred to sprint end — `.md` regeneration

## [2026-05-31] — Regenerate AS-IS `.md` for all workflows touched during the S8 smoke

During the BMX-P5-MATRIX exit-gate smoke, live workflows were changed but their `docs/pseudocode/WF-XX.md` AS-IS projections were NOT regenerated via `generate-workflow-md` (deferred to a single sprint-end pass to avoid piecemeal regen while more fixes are still landing).

**State of each touched workflow's `.md`:**
- **WF-01 (`hYGNM97sXvdo1WmI`)** — STALE. BUG-01 Country Filter jsCode change not reflected; `.md` never touched.
- **WF-21 (`zM8WbxSdt9nXRoLZ`)** — flow-ID literal hand-swapped (incidentally accurate, since flow-ID was the only live change). Regenerate to be authoritative.
- **WF-23 (`VpCER0Vqq3NYJGpI`)** — same as WF-21.
- **WF-45 (`MUG7rPgSHc7UtAE9`)** — same as WF-21.
- **WF-50 (`BUVun38WEKb12zg9`)** — STALE. BUG-02a `flow_action_payload` added to `Prepare Interactive Message`; `.md` not regenerated.
- **WF-22 (`dr8QM0m92Ml8MvIh`)** — STALE. BUG-05 `Extract Form Data` consent boolean fix; `.md` not regenerated.

**Action at sprint end:** run `generate-workflow-md` over the touched set (re-export first), then `assert-md-fresh.sh` to confirm. This overwrites the interim sed swaps with the real live projection. Add any further workflows touched by later smoke bugs to this list.

**Note:** `.pseudo` files were edited directly (design source-of-truth) — those are NOT regenerated, they're authored. Only the `.md` AS-IS projections need the generate pass.
