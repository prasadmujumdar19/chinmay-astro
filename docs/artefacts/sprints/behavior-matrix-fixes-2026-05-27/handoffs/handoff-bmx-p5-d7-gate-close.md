## Stopping Point
**BMX-P5-MATRIX exit gate CLOSED — sprint `behavior-matrix-fixes-2026-05-27` functionally complete** (all items ✅ done / ⚪ obsolete; lint OK). This session resolved the last S8 live cells AND shipped an unplanned WF-43 enhancement that the smoke surfaced:

- **S8×D REBOOK PASS** (opted_out arm exec 3082→WF-45 3087; exact-keyword exec 3144→WF-45 3147 — both reach `payment_pending`). **S8×I subsumed by D7** (button gate is id-agnostic, exec 2994). All 7 S8 cells now PASS (H = N/A).
- **BMX-D7 (WF-43 `3va0M06kijgyLejf`, 27→32 nodes, build-workflow full discipline, verified live):** re-engaged-opted-out awareness. Diagnosis: an `opted_out` user lifted by WF-26 (`wasOptedOut=true`) hit WF-43 identically to a normal closed user → stale `btn_done` fired the FAREWELL copy; free-form text got the generic returning-user reply. Fix: (a) button path new `Is opted_out?` gate → any stale button short-circuits to a welcome-back; (b) text path new `Was optedOut?` gate → opted-out-aware Gemini prompt that welcomes + answers in ONE message; both prompt variants converge on the single Gemini POST. Inline parse-bug fix: `Extract Gemini Reply` + `Build U2 Off-Topic Payload` referenced the now-conditionally-skipped `$('Prepare Gemini Response Prompt')` → repointed to the always-run trigger node. Verified: button exec 2994, text exec 3135.
- **Matrix HTML** updated (S8 row → ✅, S8×G rewritten per DR-4, pills recounted W63/U5/B6/N7). **Pseudo** WF-43 revised (linear 1→22 + D7 delta + read-source Note). **Spec §12.6a** opted-out prompt variant added. **Registry** BMX-D7 entry. **.md regen** done (31 files, incl. WF-43 + WF-25). Backup `archive/backups/3va0M06kijgyLejf-2026-05-31-18-06.json`.

## Next Action
1. **Commit/push** this session's changeset to GitHub (project repo) — offer pending at write time.
2. **`rm docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/_active`** to formally close the sprint (do as part of, or immediately after, the commit).
3. **Dedicated `flush-plugin-improvements` session** for the 3 captured plugin improvements (followups.md): (a) `monitor-test-run` — report WF-XX+exec-id chain on tick verdicts; (b) `build-workflow` — emit `return []` (0 items) to stop a caller after a sub-workflow send; (c) `build-workflow` Step 6a — broaden trigger to cover nodes made CONDITIONALLY-UNEXECUTED by a new branch (not only removed/renamed), + the "post-fork consumers read shared fields from an always-executed node" authoring rule.

## Blockers
- **3 plugin flushes pending** (above) — NOT gate-blocking; BMX-P8-PLUGIN (the original flush item) already closed, so these are post-hoc captures for a fresh plugin-repo session.
- **S10 row** (NULL/out-of-enum status) remains 🛑 deferred-post-MVP — user-approved carve-out, pre-dates this sprint. Not a regression.
- **Post-MVP WF-43 retention-tied refinement** (followups Part 1/2 convergence) — D7 delivered the `wasOptedOut` mechanism + uniform re-engagement warmth; the details-aware graduation (woo vs nudge by "do we still hold their details?") stays deferred behind the retention/deletion job.
