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
