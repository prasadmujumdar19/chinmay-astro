# Sprint p0-coverage-report-2026-05-17 — Followups

Items spotted during sprint execution that are out of scope for this sprint but worth tracking.

## [2026-05-17] — Followup execution session

User reviewed all followups and directed action. Execution order:
1. 🔵 WF-46 DR-10 fix + WF-51 alignment (Batch 6 sibling + item #8)
2. 🔵 WF-01 Load User SELECT — expand to all 13 columns (Batch 2 finding)
3. 🔵 WF-22 redundant `User Created?` IF — remove (Batch 2 finding)
4. 🔵 Project-wide `__rl` workflowId + `continueOnFail` normalization script (Batch 1 + 2 finding)
5. ⚪ Code-node return-shape (WF-50/60) — IGNORE/CLOSE per user
6. ⚪ WF-46 `Send a message` (separate from DR-10 fix above — already merged into item 1)

Status markers added per item below as work proceeds.

## [2026-05-17] — Batch 1 (WF-50/52/60)

- **All sub-utility Code nodes** (WF-50: Done, Return Status, Process Result, Prepare Interactive Message, Prepare Template Message; WF-60: similar) return single objects rather than `[{json: ...}]` arrays. Worked in production for months — n8n v2 auto-wraps — but `n8n_validate_workflow` (runtime profile) flags as errors. Pre-existing; not introduced by sprint. Future cleanup sprint candidate.
- **Lint hook on executeWorkflow `workflowId`** rejects `__rl` resource-locator objects in favor of plain strings. n8n UI saves them as `__rl` by default, so untouched workflows across the project will still have the object shape and will fail lint on next edit. One-shot project-wide normalization script would be more efficient than per-edit fixes.
  > **Status:** ✅ Done — 2026-05-17 | FU-4 (Batch Surgical) | Live scan found 13 affected WFs with 38 `__rl` instances total: WF-43 (6), WF-25 (4), WF-44 (4), WF-31 (4), WF-22 (3), WF-32 (3), WF-30 (3), WF-20 (3), WF-23 (3), WF-01 (2), WF-41 (1), WF-45 (1), WF-12 (1). Single jq transform + curl PUT loop normalized all to plain strings. Verified zero `__rl` remaining across all 13. All exports refreshed in `workflows/`. Note: n8n UI re-saves `__rl` on edit, so this will regress per-WF on any future UI edit — build-workflow Step 5e.1 auto-rolls the normalization on subsequent edits.

## [2026-05-17] — Batch 2 (WF-21/01/22)

- **WF-01 `Load User` SELECT is missing 13 columns** that pseudocode Step 11 lists: `date_of_birth, time_of_birth, place_of_birth, current_consultation_id, total_consultations, context, updated_at, slack_channel_id, stage, blocked_at, blocked_by, blocked_reason, feedback`. Downstream workflows (WF-40 needs `slackChannelId`, WF-43 needs `currentConsultationId`) may be silently getting `undefined` or doing their own redundant lookups. Investigate functional impact before fixing.
  - Found while verifying: WF-01 (Batch 2)
  > **Status:** ✅ Done — 2026-05-17 | FU-2 | Schema cross-checked via information_schema (all 20 columns confirmed). `Load User` query expanded from 7 → 20 columns. Verified via live SQL test (returned all columns cleanly). Per-build-workflow lint hook surfaced pre-existing `__rl` debt on `Call WF-02` and `Send Non-Text Deflection via WF-50` — deferred to FU-4 sweep per user direction.
- **WF-01 has 2 of 3 executeWorkflow nodes still using `__rl` shape** for workflowId (Call WF-02, Send Non-Text Deflection via WF-50) — will fail lint hook on next edit.
- **WF-22 `User Created?` IF node is redundant** — both TRUE and FALSE branches go to the same downstream node (Ensure Slack Channel Exists). Functionally correct (pseudocode Steps 5 + 5b both call WF-52), but the IF adds no behavior. Could be removed for clarity.
  > **Status:** ✅ Done — 2026-05-17 | FU-3 | Removed via `removeNode` + `addConnection` partial update. `Create User Record` now flows directly to `Ensure Slack Channel Exists (WF-52)`. WF-22 node count 11 → 10. Behavior unchanged (both prior branches were already terminating at the same target).
- **WF-22 3 executeWorkflow nodes** still use `__rl` shape for workflowId (Ensure Slack Channel Exists, Call WF-50, Call WF-51 Admin Alert) — same lint issue.
- **WF-22 `Create User Record` uses deprecated `continueOnFail: true`** — n8n recommends `onError: 'continueRegularOutput'` instead. Same migration applies project-wide.
  > **Status:** ✅ Done — 2026-05-17 | FU-4 (Batch Surgical) | Live scan found WF-22 as the only WF in n8n with this flag. Migrated `continueOnFail: true` → `onError: 'continueRegularOutput'` (same jq transform pass as `__rl` normalization).

## [2026-05-17] — Batch 6 post-batch sibling regression

- **WF-46 (User Blocker) violates Design Rule #10** — contains `Get User Slack Channel` + `Archive Slack Channel` nodes that archive the consult channel on BLOCK. Same pattern that was just removed from WF-47. Channels are intentionally preserved for REBOOK reuse (after UNBLOCK, user could rebook and channel reuse should still work). Recommended fix: remove both nodes; final flow ends at `Send a message` (admin confirmation in consult channel).
  - Found while verifying: sibling of WF-47 (Batch 6)
  > **Status:** ✅ Done — 2026-05-17 | FU-1 | Removed `Get User Slack Channel` + `Archive Slack Channel`. Final flow: trigger → Load User by Phone → Update User to Blocked Status → Call WF-51 Notify Admin (terminal, 4 nodes). Discovery during fix: original `Send a message` posted to hardcoded `chinmay-admin-commands` not consult channel — per user direction, refactor uses caller-supplied `channelId` with `slack_channel_id` fallback for WF-25 auto-block path.
- **WF-46 `Get User Slack Channel` (Postgres SELECT) lacks `alwaysOutputData: true`** — pre-existing lint debt. Will be resolved when the node is removed (per the DR-10 fix above).
  > **Status:** ✅ Done — 2026-05-17 | FU-1 | Self-resolved (node removed).
- **WF-46 `Send a message` is a direct Slack node** — consistent with project pattern (WF-42 also uses direct Slack post for admin confirmations). Theme 7 refactor scope (admin Slack → WF-51) only covered WF-33 and WF-34. WF-46 alignment with WF-51 deferred to a P1/P2 cleanup pass.
  > **Status:** ✅ Done — 2026-05-17 | FU-1 | Refactored to `Call WF-51 Notify Admin` (executeWorkflow typeVersion 1.3, defineBelow mapping with `channelId` + `messageText`). WF-42 remains with direct Slack admin posts — tracked below.
- **WF-46 `Update User to Blocked Status` references columns `blocked_at`, `blocked_by`, `blocked_reason`** — verify these exist in `chinmay_astro.users` schema (likely present since BLOCK is exercised, but should be confirmed during the DR-10 fix sprint to avoid silent failure).

## [2026-05-17] — Found during FU-4 (project-wide normalization) — new followups

After `__rl` normalization cleared, the lint hook surfaced 3 additional issue categories across 6 workflows. None are FU-4 scope; logged for future cleanup.

**Category A — `executeWorkflow` typeVersion=1 with `workflowInputs` (requires >=1.1; will silently drop inputs at runtime):**
- **WF-20 Keyword Handler:** `Send HELP Response`, `Route to Rebook` (2 nodes)
- **WF-45 Rebook Handler:** `Send Payment Instructions` (1 node)
- **WF-12 Admin -> WhatsApp Relay:** `Call WF-50 Send WhatsApp` (1 node)

Total: 4 nodes across 3 WFs. Mechanical fix (bump typeVersion 1 → 1.1). Could be a single batch-surgical sweep.

**Category B — Postgres SELECT with `alwaysOutputData: false` (silent-halt risk on zero-row result):**
- **WF-32 Payment Confirmation Receiver:** `Load User Channel from DB`
- **WF-31 Payment Submitted Handler:** `Load User for Relay`
- **WF-45 Rebook Handler:** `Load User Record`

Total: 3 nodes across 3 WFs. Requires per-case judgment per build-workflow Step 5a — review whether each downstream needs an explicit empty-result IF guard, or whether `alwaysOutputData: true` alone is safe.

**Category C — `executeWorkflow` `mappingMode: 'passthrough'` (strict-validator rejection; may not pass data correctly):**
- **WF-43 Post-Consultation Handler:** `Send Feedback Prompt via WF-50`
- **WF-32 Payment Confirmation Receiver:** `Call WF-51 (Notify Admin)`
- **WF-31 Payment Submitted Handler:** `Relay to Admin Slack`
- (also noted earlier in FU-1 findings) **WF-25 Intent Classifier:** `Auto-Block via WF-46`

Total: 4 nodes across 4 WFs. Each needs the downstream sub-workflow's input contract examined, then converted to `mappingMode: 'defineBelow'` with explicit field mappings.

## [2026-05-17] — Found during FU-1 (WF-46 DR-10 + WF-51 alignment) — new followups

- **WF-46 admin notification messageText has pre-existing field-name mismatches** — references `$json.blockReason` (always undefined; WF-11 passes `reason`, not `blockReason`) and `$json.adminUserId` (undefined because `$json` at the executeWorkflow node points to the prior Postgres UPDATE output, not the trigger input). Result: admin confirmation always shows fallback "Blocked by admin" reason and blank `Blocked by:` field. Pre-existing — not introduced by FU-1. Suggested fix: reference `$('When Executed by Another Workflow').item.json.reason` and `$('When Executed by Another Workflow').item.json.adminUserId`. Out of scope for FU-1 (text bug, not DR-10/WF-51-alignment scope).
- **WF-25 `Auto-Block via WF-46` executeWorkflow node uses `workflowInputs: null` (passthrough)** — flagged by Step 5e.1 lint scan as `passthrough_mappings`. Means WF-25 doesn't actually pass `phoneNumber`, `channelId`, etc. to WF-46. With FU-1's caller-input-based `channelId`, this means WF-25-triggered auto-blocks will fall back to `slack_channel_id` from Load User by Phone (which still works). However, the passthrough is project-wide lint debt and should be fixed to explicit `defineBelow` shape.
- **WF-42 still has direct Slack admin posts** — per WF-46 followup history, WF-42 was noted as also having admin Slack-direct-post pattern. Confirmed it was modified in Batch 6 but not refactored to use WF-51. Same DR/Theme-7 alignment opportunity; defer.

## [2026-05-17] — Plugin improvement candidate

- **Add `assess-this-batch` step to `build-sprint` Skill** (new Step 2a, before "Order by priority within the current batch"). Step should:
  - Look across all items in the current batch and identify (a) Batch Surgical candidates (same fix applied to N WFs), (b) truly independent items safe for subagent dispatch, (c) items needing full `build-workflow` Skill ceremony, (d) items that can inherit `build-workflow` steps inline without re-invoking the Skill.
  - Subagent dispatch caveats: no user input required; estimated <1 min wallclock; no decision points requiring judgment (deterministic tool sequence only); main thread polls subagent transcript via `Monitor` every 60s and sends `TaskStop` if no new tool call in 60s.
  - Gate the assess step: skip for batches of 1-2 items OR single-change-type batches; required for ≥3 items with mixed change types.
  - Reasoning rooted in Batch 6 incident this session (see `feedback_sprint_parallelism.md`): parallel subagent dispatch on WF-40/42/47 produced a wrong WF-47 fix that main thread had to corrective-PUT to recover. Per-item ceremony, not parallelism, is the real bottleneck.
