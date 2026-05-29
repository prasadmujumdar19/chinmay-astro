## Stopping Point
Batch 1 (Phase 0a) of behavior-matrix-fixes-2026-05-27 is COMPLETE and post-batch regression passed: BMX-P0-DB ✅, BMX-P0-U1 (WF-53 `ONzUJ1Lj9hIbUYT0`) ✅, BMX-P0-U2 (WF-61 `9Zt23yt8k8PQSgji`) ✅ — both utilities built, MCP strict-validated (valid:true, 0 errors), activated, and (for U2) SQL-verified via ROLLBACK dry-run. Dependency map rebuilt (77 edges). The Batch 1 changeset is staged in the working dir but NOT yet committed/pushed to GitHub.

## Next Action
Commit + push the Batch 1 changeset (this handoff is intentionally written first so it rides in the same push). Use the project clone-to-scratch → copy → secrets-scan → commit → push flow. Files: `workflows/ONzUJ1Lj9hIbUYT0.json`, `workflows/9Zt23yt8k8PQSgji.json`, `docs/workflow-registry.md`, sprint `state.md`, `followups.md`, both specs (`2026-05-29-bmx-06-*` + `2026-05-29-existing-user-safety-net-*`), `scripts/migrations/2026-05-29-bmx06-drop-block-reason-use-legacy.sql`, `docs/dependency-map.md`. After the push, start Batch 2 = BMX-P0-U3 (WF-62 New-Contact Intent Classifier) — but FIRST surface the DRAFT U3 prompt copy (BMX-06 §11) to the user for VERBATIM sign-off before building. WF-62 uses U1 (WF-53) on Gemini failure.

## Blockers
- **Batch 2 gate:** U3 prompt copy is DRAFT (BMX-06 §11) — requires verbatim user sign-off before WF-62 is built. Do not build U3 without it.
- **Plugin improvement (apply via `flush-plugin-improvements` before next session):** When a project version-controls its handoffs (handoffs pushed to GitHub), the handoff MUST be written BEFORE the batch commit so a single commit/push carries both batch work + handoff. `build-sprint` Step 4a currently sequences the commit/push offer FIRST then handoff — reorder (or add a conditional) so handoff precedes the commit when handoffs live in the repo. Also worth a one-line note in the `handoff` skill.

## Changed Reference Values
- **WF-53** U1 Gemini Error Handler — n8n id `ONzUJ1Lj9hIbUYT0` (active).
- **WF-61** U2 Silent-Drop & Escalate — n8n id `9Zt23yt8k8PQSgji` (active).
- **DB / block audit:** the `users.block_reason` column (added earlier 2026-05-29 by BMX-P0-DB) was DROPPED. Block audit now uses the EXISTING legacy trio `blocked_reason` / `blocked_at` / `blocked_by`. `blocked_reason` is caller-supplied verbatim via the U2 `blockReason` envelope field (no `'threshold_'` composition in the utility); `blocked_by='WF-61'` for U2 system blocks. Revert migration: `scripts/migrations/2026-05-29-bmx06-drop-block-reason-use-legacy.sql`.
- **U2 (WF-61) envelope:** `{ phoneNumber, messageType, reason, messageContent?, blockThreshold, blockReason }` — callers (Batches 4–7) must pass `blockReason` (exact `blocked_reason` value) + `reason` (granular drop log); abuse callers pass `blockThreshold=1, blockReason='abuse'`.
