# Sprint p0-coverage-report-2026-05-17 — Followups

Items spotted during sprint execution that are out of scope for this sprint but worth tracking.

## [2026-05-17] — Batch 1 (WF-50/52/60)

- **All sub-utility Code nodes** (WF-50: Done, Return Status, Process Result, Prepare Interactive Message, Prepare Template Message; WF-60: similar) return single objects rather than `[{json: ...}]` arrays. Worked in production for months — n8n v2 auto-wraps — but `n8n_validate_workflow` (runtime profile) flags as errors. Pre-existing; not introduced by sprint. Future cleanup sprint candidate.
- **Lint hook on executeWorkflow `workflowId`** rejects `__rl` resource-locator objects in favor of plain strings. n8n UI saves them as `__rl` by default, so untouched workflows across the project will still have the object shape and will fail lint on next edit. One-shot project-wide normalization script would be more efficient than per-edit fixes.

## [2026-05-17] — Batch 2 (WF-21/01/22)

- **WF-01 `Load User` SELECT is missing 13 columns** that pseudocode Step 11 lists: `date_of_birth, time_of_birth, place_of_birth, current_consultation_id, total_consultations, context, updated_at, slack_channel_id, stage, blocked_at, blocked_by, blocked_reason, feedback`. Downstream workflows (WF-40 needs `slackChannelId`, WF-43 needs `currentConsultationId`) may be silently getting `undefined` or doing their own redundant lookups. Investigate functional impact before fixing.
  - Found while verifying: WF-01 (Batch 2)
- **WF-01 has 2 of 3 executeWorkflow nodes still using `__rl` shape** for workflowId (Call WF-02, Send Non-Text Deflection via WF-50) — will fail lint hook on next edit.
- **WF-22 `User Created?` IF node is redundant** — both TRUE and FALSE branches go to the same downstream node (Ensure Slack Channel Exists). Functionally correct (pseudocode Steps 5 + 5b both call WF-52), but the IF adds no behavior. Could be removed for clarity.
- **WF-22 3 executeWorkflow nodes** still use `__rl` shape for workflowId (Ensure Slack Channel Exists, Call WF-50, Call WF-51 Admin Alert) — same lint issue.
- **WF-22 `Create User Record` uses deprecated `continueOnFail: true`** — n8n recommends `onError: 'continueRegularOutput'` instead. Same migration applies project-wide.

## [2026-05-17] — Batch 6 post-batch sibling regression

- **WF-46 (User Blocker) violates Design Rule #10** — contains `Get User Slack Channel` + `Archive Slack Channel` nodes that archive the consult channel on BLOCK. Same pattern that was just removed from WF-47. Channels are intentionally preserved for REBOOK reuse (after UNBLOCK, user could rebook and channel reuse should still work). Recommended fix: remove both nodes; final flow ends at `Send a message` (admin confirmation in consult channel).
  - Found while verifying: sibling of WF-47 (Batch 6)
- **WF-46 `Get User Slack Channel` (Postgres SELECT) lacks `alwaysOutputData: true`** — pre-existing lint debt. Will be resolved when the node is removed (per the DR-10 fix above).
- **WF-46 `Send a message` is a direct Slack node** — consistent with project pattern (WF-42 also uses direct Slack post for admin confirmations). Theme 7 refactor scope (admin Slack → WF-51) only covered WF-33 and WF-34. WF-46 alignment with WF-51 deferred to a P1/P2 cleanup pass.
- **WF-46 `Update User to Blocked Status` references columns `blocked_at`, `blocked_by`, `blocked_reason`** — verify these exist in `chinmay_astro.users` schema (likely present since BLOCK is exercised, but should be confirmed during the DR-10 fix sprint to avoid silent failure).

## [2026-05-17] — Plugin improvement candidate

- **Add `assess-this-batch` step to `build-sprint` Skill** (new Step 2a, before "Order by priority within the current batch"). Step should:
  - Look across all items in the current batch and identify (a) Batch Surgical candidates (same fix applied to N WFs), (b) truly independent items safe for subagent dispatch, (c) items needing full `build-workflow` Skill ceremony, (d) items that can inherit `build-workflow` steps inline without re-invoking the Skill.
  - Subagent dispatch caveats: no user input required; estimated <1 min wallclock; no decision points requiring judgment (deterministic tool sequence only); main thread polls subagent transcript via `Monitor` every 60s and sends `TaskStop` if no new tool call in 60s.
  - Gate the assess step: skip for batches of 1-2 items OR single-change-type batches; required for ≥3 items with mixed change types.
  - Reasoning rooted in Batch 6 incident this session (see `feedback_sprint_parallelism.md`): parallel subagent dispatch on WF-40/42/47 produced a wrong WF-47 fix that main thread had to corrective-PUT to recover. Per-item ceremony, not parallelism, is the real bottleneck.
