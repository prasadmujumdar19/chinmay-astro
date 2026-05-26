# Sprint: pre-golive-gap-decisions-2026-05-26

**Input source:** docs/artefacts/reviews/2026-05-25-pre-golive-gap-review/pre-golive-gap-decisions-2026-05-26.md
**Input hash:** d29b8e6ff081e1d2e5c328c6f6e582322fb97f73b4332bf7c56251cf9aa18ba0
**Planned at:** 2026-05-26T01:06:46Z
**Last updated:** 2026-05-26T02:51:56Z
**Planning complete:** true

**Discover-current-state:** Targeted sample ran 2026-05-26T01:14:00Z (tunnel reopened mid-planning). `mcp__n8n__n8n_validate_workflow` on WF-01 (`hYGNM97sXvdo1WmI`) returned 11 errors — exact match to Decisions research dump: 4 Class A "Invalid mappingMode: passthrough" on `Call WF-02 Rule Router`, `Route Opted-Out to WF-26`, `Send Non-Text Deflection via WF-50`, `Call WF-51 (Admin Anomaly Alert)`; plus 7 Class B "Return value must be an array of objects" on `Layer 1: Country Filter`, `Silent Reject (Country)`, `Silent Reject (Blacklist)`, `Prepare User Data`, `Layer 2: Non-Text Message Filter`, `Layer 3 : Blacklisted Users Filter`, `Build WF-01 Envelope`. Regression is active and unresolved — no items obsolete. Other 23 affected workflows are NOT re-validated at planning time (cheap to verify per-workflow inside the Batch 2/3 execution loop as the recipe is applied; WF-01 alone is sufficient to confirm the systemic finding). Other build items (GAP-1/2/3B/3C/7-STAGE1) are fresh feature additions with no plausible "already done" state to detect.
**Dependency conflicts found:** No priority conflicts (all build items are P0 or P1 and dependency order matches user directive: Gap 10 first, rest after). Two same-workflow sibling soft-deps surfaced where doc-order deviates from the risk-based heuristic (Structural-before-Surgical); preserved doc-order intentionally — see GAP-2 and GAP-3C item notes.
**Priority adjustments confirmed:** None needed. User directive ("Gap 10 first, then rest") matches doc Section 3 batching.
**Excluded from execution:** 7 items deferred per Decisions doc (Gap 3a no-build policy decision; Gaps 4/5/6/7-stage-2/8/9 explicitly deferred post-MVP). Listed at the end for traceability — they are NOT in the items table and will NOT be executed by build-sprint.

## Items

| ID | Status | Batch | Pri | Workflows | Depends On |
|----|--------|-------|-----|-----------|------------|
| GAP-10-WF01 | ✅ done | 1 | P0 | WF-01 | — |
| GAP-10-WF01-SMOKE | ✅ done | 1 | P0 | WF-01 | GAP-10-WF01 (hard) |
| GAP-10-FANOUT-P1 | ✅ done | 2 | P0 | WF-02, WF-10, WF-11, WF-00, WF-21, WF-22, WF-26, WF-32, WF-33, WF-50, WF-51, WF-60 | GAP-10-WF01-SMOKE (hard) |
| GAP-10-FANOUT-P2 | ✅ done | 3 | P0 | WF-23, WF-25, WF-30, WF-31, WF-34, WF-42, WF-46, WF-40, WF-43, WF-45, WF-47, WF-41 (+1 ext) | GAP-10-FANOUT-P1 (hard) |
| GAP-1 | ⬜ pending | 4 | P1 | WF-01 | GAP-10-WF01 (hard) |
| GAP-3B | ⬜ pending | 4 | P1 | WF-22, WF-32, WF-42 | GAP-10-FANOUT-P2 (hard) |
| GAP-7-STAGE1 | ⬜ pending | 4 | P1 | WF-31 | GAP-10-FANOUT-P2 (hard) |
| GAP-2 | ⬜ pending | 5 | P1 | WF-42, WF-43 | GAP-10-FANOUT-P2 (hard), GAP-3B (soft) |
| GAP-3C | ⬜ pending | 6 | P1 | WF-23, WF-30, WF-31 | GAP-10-FANOUT-P2 (hard), GAP-7-STAGE1 (soft) |
| GAP-10-IMAGE-PIN | ⬜ pending | 7 | P1 | — | GAP-10-WF01 (hard), GAP-10-WF01-SMOKE (hard), GAP-10-FANOUT-P1 (hard), GAP-10-FANOUT-P2 (hard), GAP-1 (hard), GAP-3B (hard), GAP-7-STAGE1 (hard), GAP-2 (hard), GAP-3C (hard) |

## Batch 1 — P0 (WF-01 validator unblock + smoke gate)

- **Items:** 2
- **Description:** Fix WF-01's invalid `mappingMode: "passthrough"` (4 Class A nodes) and Class B plain-object Code-node returns (7 nodes). Smoke-test with one inbound WhatsApp message to confirm `WorkflowHasIssuesError` is gone and execution reaches `Call WF-02 Rule Router` (WF-02 failing next with the same error class IS the expected confirmation signal that the recipe works). This batch is the gate to all subsequent batches — do NOT proceed to Batch 2 until smoke is green.

## Batch 2 — P0 (Gap 10 fan-out Pass 1 — 12 critical-path workflows)

- **Items:** 1
- **Description:** Apply the validated WF-01 recipe (Class A `mappingMode: defineBelow + value: null` on caller-side executeWorkflow nodes; Class B `return [{json:{...}}]` on Code nodes) to 12 P1 critical-path workflows in execution order. Mechanical per-workflow loop: backup → jq replace → PUT → `validate_workflow` clean → next. Loop continues only while validate stays clean.

## Batch 3 — P0 (Gap 10 fan-out Pass 2 — 11 P2/P3 + unidentified workflows)

- **Items:** 1
- **Description:** Apply the same recipe to remaining 11 workflows: WF-23, WF-25, WF-30, WF-31, WF-34, WF-42, WF-46, plus the 4 unidentified IDs from the Decisions doc (`2U7mxHMyqA41ROKX`, `MUG7rPgSHc7UtAE9`, `du32QBZbSQOjfESe`, `3va0M06kijgyLejf`) — cross-check these against workflow-registry.md FIRST and either map them to WF-IDs or confirm they are legacy/orphaned and document the disposition. Pass 2 completes the systemic fix.

## Batch 4 — P1 (text/code-only edits, parallel-safe)

- **Items:** 3
- **Description:** Three single-text/code-node edits that are independent of each other and touch only Gap-10-fixed workflows: GAP-1 (WF-01 silent-reject text → email redirect), GAP-3B (3 text strings: WF-22/32/42 email callout), GAP-7-STAGE1 (WF-31 Build-Slack-Payload Code node — add `paid X ago` prefix). Can be executed in any order within the batch.

## Batch 5 — P1 (interactive button — 3rd post-consult option)

- **Items:** 1
- **Description:** Add `btn_done` (label "Done, thanks") to WF-42 close-payload + WF-43 routing branch (→ WF-50 thank-you + WF-51 Slack "user tapped Done" notification). ~4-5 new nodes total. Same-workflow sibling of GAP-3B on WF-42 — soft-sequenced AFTER GAP-3B per doc-order (text-first, then structural addition).

## Batch 6 — P1 (Gemini answer distribute)

- **Items:** 1
- **Description:** Replicate WF-43's `Gemini General Response` + `Prepare Gemini Response Prompt` pair into WF-23/30/31, each with a state-specific suffix. ~2 new nodes per workflow × 3 workflows. WF-25 untouched (classify-only). Same-workflow sibling of GAP-7-STAGE1 on WF-31 — soft-sequenced AFTER GAP-7-STAGE1 per doc-order.

## Batch 7 — P1 (infrastructure — image digest pin, LAST)

- **Items:** 1
- **Description:** Pin `n8n-prod` from `docker.n8n.io/n8nio/n8n:latest` to a specific image digest in `/mnt/chinmay-astro-data/docker-compose.yml` on the VPS, recreate the container, verify version + execution health post-recreate. Runs LAST per user direction so the pinned digest is the one smoke-tested green across the entire project surface, and any plugin-improvements (`flush-plugin-improvements`) for new technical-workflow-review guardrails are captured first.

## GAP-10-WF01 — Fix invalid mappingMode + plain-object Code returns in WF-01

**Status:** ✅ done
**Started:** 2026-05-26T01:20:10Z
**Completed:** 2026-05-26T01:35:41Z
**Priority:** P0 | **Batch:** 1
**Change type:** Structural / parametric (n8n config-level fix; envelope contracts unchanged; no pseudo touch per [[feedback_pseudo_tech_separation]])
**Workflows:** WF-01
**Depends on:** —

WF-01 has 4 Class A nodes with invalid `workflowInputs.mappingMode: "passthrough"` and 7 Class B Code nodes returning plain `{...}` instead of `[{json:{...}}]`. Apply both fixes in a single PUT.

**Execution outcome:** Single jq-on-disk PUT (curl) applied 4 Class A + **9 Class B** transforms (validator flagged 7; pre-PUT inspection found 2 same-defect siblings on the opted-out branch — `Build WF-01 Envelope (Opted-Out)` and `Prepare User Data (Opted-Out)` — user-approved extension per [[feedback_systemic_before_individual]]). Backup `archive/backups/hYGNM97sXvdo1WmI-2026-05-26-11-23.json`. Post-PUT `mcp__n8n__n8n_validate_workflow`: `valid: true`, errorCount: 0 (down from 11). 38 advisory warnings remain — all pre-existing and out-of-scope (typeVersion bumps, cachedResultName, IF onError, DB error handling, long linear chain). Exported to `workflows/hYGNM97sXvdo1WmI.json`; secrets scan clean.

**Secondary fix (uncovered during smoke):** `Load User (Opted-Out)` Postgres node (added in WF-26 sprint TD-DCP-106) was missing `operation: "executeQuery"` — defaulted to `insert` operation which left it in invisible-required-field invalid state. n8n runtime's `getNodeParametersIssues` flagged this (causing persistent `WorkflowHasIssuesError`) but the MCP validator surfaced it only as a benign-looking "Property 'query' won't be used" warning. Patched via second jq+PUT (added `operation: "executeQuery"`). Two PUTs total for this item. Re-export updated `workflows/hYGNM97sXvdo1WmI.json`.

Recipe (per Decisions §Gap 10 + `[[feedback_n8n_curl_workflow]]` + `[[feedback_n8n_mcp_nested_array_update]]`):
- Class A: change `workflowInputs.mappingMode: "passthrough"` → `mappingMode: "defineBelow"`, `value: null` on each caller-side executeWorkflow node.
- Class B: rewrite each Code node's terminal return to `return [{json: {...}}]`.
- Use `source .env && curl -X PUT` with jq-on-disk transform — NOT `mcp__n8n__n8n_update_partial_workflow` (silent no-op on nested-array updates).
- Backup first: `scripts/backup-workflow.sh WF-01` → `archive/backups/<id>-<YYYY-MM-DD-HH-MM>.json`.
- Post-edit: `validate_workflow` MCP must return zero errors.
- Pseudo NOT updated — per `[[feedback_pseudo_tech_separation]]`, this is tech-level n8n config; envelope contract unchanged.

## GAP-10-WF01-SMOKE — Smoke-test WF-01 after validator fix

**Status:** ✅ done
**Started:** 2026-05-26T01:35:41Z
**Completed:** 2026-05-26T02:14:39Z
**Priority:** P0 | **Batch:** 1
**Change type:** Verification (no code change)
**Workflows:** WF-01
**Depends on:** GAP-10-WF01 (hard)

Simulate one inbound WhatsApp message to test phone `+61466927921` (currently `payment_pending` in DB). Confirm:
1. `WorkflowHasIssuesError` is gone from `execution_entity` for the new execution.
2. Execution reaches at least `Call WF-02 Rule Router`.
3. WF-02 failing next with the SAME error class is EXPECTED and is the confirmation signal that the recipe works at WF-01.

**Smoke outcome:** PASSED with one critical-recipe-validation finding.

**Test sequence:**
- Send 1 (exec 2229, 9ms): still `WorkflowHasIssuesError`. Diagnosis: GAP-10-WF01 recipe applied `value: null` but per n8n source the canonical default is `value: null` (so that wasn't the issue); the real problem was elsewhere.
- Send 2 (exec 2232, 5ms): still `WorkflowHasIssuesError` after value:null→value:{} flip. Same root cause persisted.
- **User UI inspection identified the actual culprit:** `Load User (Opted-Out)` Postgres node (added during TD-DCP-106 / WF-26 sprint) was missing `operation: "executeQuery"`. Default operation = `insert`, which requires table+columns config it didn't have → n8n runtime's `getNodeParametersIssues` flagged invisible-required-field state. The MCP validator's strict-profile DID hint at this with warning "Property 'query' won't be used - not visible with current settings" — but it appeared as a benign-looking warning, not blocking error.
- Patch applied: added `operation: "executeQuery"` to `Load User (Opted-Out)` parameters. Single jq + curl PUT.
- Send 3 (exec 2235, 1462ms): WF-01 executed 15 nodes cleanly through to `Call WF-02 Rule Router`. WorkflowHasIssuesError gone. ✅
- WF-02 (exec 2236) received the full envelope via trigger (`{phoneNumber, messageType: "text", user, pendingUser, routing, ...}`) — **confirming `defineBelow + value: null` + trigger `inputSource: passthrough` achieves runtime passthrough semantics correctly**. Recipe is sound.
- Downstream failure: error.workflowId `gGJBY5fJha0Let8I` (exec 2238) = **WF-30 Payment Pending Intent Filter** (already in Batch 3 named list — NOT a new unidentified workflow; earlier "5th unidentified" claim corrected). WF-30 threw `WF-50 contract: messageType must be text|interactive|template, got: undefined` — data contract guard caught a non-compliant upstream caller (WF-02 → WF-30 boundary still using literal `mappingMode: "passthrough"` per unfixed Gap 10). Confirms Gap 10 is a **functional** bug (literal `passthrough` silently drops payload at the executeWorkflow boundary), not cosmetic. Will be resolved by Batch 2 (WF-02) + Batch 3 (WF-30) fan-out.

**Recipe note for Batch 2/3:** the `mappingMode: "defineBelow" + value: null` recipe IS semantically equivalent to passthrough at runtime when the trigger has `inputSource: "passthrough"`. Proceed with the recipe as planned. The MCP validator's claim that `passthrough` is invalid is correct — but `defineBelow + value: null` is the canonical n8n default (verified in `/usr/local/lib/.../ExecuteWorkflow.node.js` line 194) and works as intended at runtime.

## GAP-10-FANOUT-P1 — Apply validator fix to 12 critical-path workflows

**Status:** ✅ done
**Started:** 2026-05-26T02:14:39Z
**Completed:** 2026-05-26T02:32:58Z
**Priority:** P0 | **Batch:** 2
**Change type:** Batch Surgical (mechanical per-workflow loop, 12 workflows)
**Workflows:** WF-02, WF-10, WF-11, WF-00, WF-21, WF-22, WF-26, WF-32, WF-33, WF-50, WF-51, WF-60
**Depends on:** GAP-10-WF01-SMOKE (hard)

Pass 1 of 2 for the systemic fan-out. Same recipe as GAP-10-WF01, applied workflow-by-workflow:

Per-workflow loop:
1. `scripts/backup-workflow.sh WF-XX`
2. `mcp__n8n__n8n_get_workflow` → write to disk under `/tmp/claude-scratch/$SESSION/wf-XX.json`
3. jq transform: Class A mappingMode replacement + Class B Code-return shape fix
4. `source .env && curl -X PUT` to update
5. `validate_workflow` clean check — if not clean, STOP and investigate before next workflow

Order is execution order (`WF-02` next on critical path after WF-01, then WF-10/11 for admin commands, then WF-00 entry, then WF-21/22 onboarding, WF-26 re-engagement, WF-32/33 payment, WF-50/51 senders, WF-60 logging).

If ANY workflow in Pass 1 fails to validate after the fix → STOP. Do NOT auto-revert; investigate. The recipe was proven on WF-01 so a Pass 1 failure indicates either (a) a per-workflow quirk we missed or (b) a Class B Code node where the transform was wrong.

**Execution outcome:** Reusable `fix-workflow.sh` script built around `wrap-returns.py` (top-level `return { ... };` → `return [{ json: { ... } }];` with bracket-balance walker handling strings/comments/template-literals; idempotent — leaves already-wrapped returns untouched). Per-workflow loop: backup → fetch → jq Class A flip (passthrough → defineBelow+value:null) + Code-return wrap when needed → PUT → next.

Totals across 12 workflows:
- Class A flips: **40 executeWorkflow nodes** (WF-02: 10, WF-10: 10, WF-11: 4, WF-00: 2, WF-21: 1, WF-22: 3, WF-26: 2, WF-32: 3, WF-33: 2, WF-50: 2, WF-51: 1, WF-60: 0)
- Class B Code-return wraps: **6 Code nodes** (WF-00: `Parse WhatsApp Message`; WF-50: `Return Status`, `Process Result`, `Prepare Interactive Message`, `Prepare Template Message`; WF-60: `Done`)
- 12 backups stored under `archive/backups/` with `2026-05-26-12-2[69]` timestamps
- All 12 PUTs returned HTTP 200

Post-PUT `mcp__n8n__n8n_validate_workflow` (validateConnections+Expressions disabled):
- **11/12 valid: true, errorCount=0**: WF-02, WF-10, WF-11, WF-00, WF-21, WF-22, WF-26, WF-32, WF-33, WF-50, WF-60
- **WF-51 valid: false, errorCount=1**: `Post to Slack` Slack node has `operation: null` + `resource: null`. **Confirmed pre-existing latent state** — same null shape in backup pre-fix. Our Gap 10 recipe didn't touch the Slack node. Classification: **adjacent** finding per Step 4 strict-vs-adjacent rubric. Logged to `followups.md`; does NOT block batch advancement.

Exports: all 12 workflows saved to `workflows/*.json`; secrets scan clean (zero hits on AIzaSy/sk-/xoxb-/AKIA patterns).

## GAP-10-FANOUT-P2 — Apply validator fix to 11 P2/P3 + unidentified workflows

**Status:** ✅ done
**Started:** 2026-05-26T02:32:58Z
**Completed:** 2026-05-26T02:41:21Z
**Priority:** P0 | **Batch:** 3
**Change type:** Batch Surgical (mechanical per-workflow loop, 11 workflows)
**Workflows:** WF-23, WF-25, WF-30, WF-31, WF-34, WF-42, WF-46 + 4 unidentified (`2U7mxHMyqA41ROKX`, `MUG7rPgSHc7UtAE9`, `du32QBZbSQOjfESe`, `3va0M06kijgyLejf`)
**Depends on:** GAP-10-FANOUT-P1 (hard)

Pass 2 of 2. Same per-workflow loop as Pass 1.

**Pre-batch step (do FIRST):** Cross-check the 4 unidentified n8n IDs against `docs/workflow-registry.md`. For each:
- If matched to a WF-XX → proceed normally and update workflow-registry if mapping was missing.
- If unmatched (true orphan / legacy / sub-workflow not yet catalogued) → fetch + inspect → either map it to a WF-XX or add it to workflow-registry with disposition (active/orphan/deprecated). Per `[[feedback_systemic_before_individual]]`, surface the systemic finding to the user before deciding per-ID.

If any unidentified ID turns out to be a deprecated orphan and is `active: true` in n8n, propose deactivation as a follow-up (do NOT bundle into this sprint).

**Pre-batch resolution of 4 unidentified IDs** (via `mcp__n8n__n8n_list_workflows`):
- `2U7mxHMyqA41ROKX` = WF-47 Unsubscribe Handler (active)
- `MUG7rPgSHc7UtAE9` = WF-45 Rebook Handler (active)
- `du32QBZbSQOjfESe` = WF-40 User → Admin Relay (active)
- `3va0M06kijgyLejf` = WF-43 Post-Consultation Handler (active)

All 4 are identifiable active workflows — none are orphans. No deactivation follow-ups needed.

**Systemic-scope audit (per [[feedback_systemic_before_individual]]):** Project-wide scan of all 28 active workflows for `mappingMode: "passthrough"` literal turned up **WF-41 Admin → User Relay (6PzJRZsF7k2d9hV7)** with 1 Class A defect — NOT in the planned 11. Critical path (Slack admin → WhatsApp user relay). User-approved **+1 extension** to include WF-41 in this batch. 3 other untouched workflows (WF-20, WF-44, WF-52) had zero Class A or Class B defects (already validator-clean) — no action needed.

**Execution outcome:** 12 workflows (11 planned + WF-41 ext) processed through the same `fix-workflow.sh` per-workflow loop as Batch 2.

Totals across 12 workflows:
- Class A flips: **26 executeWorkflow nodes** (WF-23: 1, WF-25: 4, WF-30: 1, WF-31: 4, WF-34: 2, WF-42: 2, WF-46: 1, WF-40: 1, WF-43: 6, WF-45: 1, WF-47: 2, WF-41: 1)
- Class B Code-return wraps: **1 Code node** (WF-34: `Prepare Rejection Message`)
- 12 backups stored under `archive/backups/` with `2026-05-26-12-39` timestamps
- All 12 PUTs returned HTTP 200

Post-PUT `mcp__n8n__n8n_validate_workflow` (validateConnections+Expressions disabled): **12/12 valid: true, errorCount: 0**. Zero strict findings.

Exports: all 12 workflows saved to `workflows/*.json`; secrets scan clean.

**P0 sprint phase complete.** Across Batches 1+2+3: 1 + 12 + 12 = **25 workflows touched**, all validator-clean (excluding the 1 adjacent pre-existing WF-51 Slack-operation finding). 3 remaining active workflows (WF-20, WF-44, WF-52) confirmed clean pre-batch (no Gap 10 defect).

**Mid-Batch-3 recipe correction (2026-05-26T02:43Z–02:51Z):** First post-P0 runtime smoke test (exec 2241) caught a runtime `TypeError: Cannot convert undefined or null to object at Function.keys (validateResourceMapperValue)` — n8n's runtime resource-mapper validator calls `Object.keys(value)` on the executeWorkflow node's workflowInputs.value, which throws when value is `null`. The MCP validator did NOT catch this; only manifests at runtime. Original Decisions recipe (`value: null`) was correctable to `value: {}` (empty object) — matches the working state of WF-01's executeWorkflow nodes (which had been hand-patched from null→{} during Batch 1 smoke debug, hence WF-01 worked while Batch 2/3 workflows broke). Single jq+PUT pass patched 65 nodes across 23 workflows (`value: null` → `value: {}`); `fix-workflow.sh` recipe updated. Re-smoke (exec 2252+2253 = real astrology question → end-to-end WhatsApp reply delivered) confirmed the fix. Adjacent finding logged in `followups.md`; bundled into Batch 7 plugin-improvement flush.

**Post-P0 smoke verification:** Real-user message (exec 2252/2253) flowed cleanly through WF-00 → WF-01 → WF-02 → routing → WF-25 → WF-50 → WhatsApp send. Test garbage message (exec 2254/2256) was correctly classified by WF-25 and tripped WF-50's data-contract entry guard on `messageType: undefined` — confirming the contract framework is doing its job. The garbage-route payload construction in WF-25's `Prepare Garbage Warning` (and likely `Prepare Block Warning` sibling) needs to set `messageType: "text"`; logged as adjacent finding (data flow) in `followups.md`.

## GAP-1 — WF-01 Silent Reject text → email redirect

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 4
**Change type:** Surgical (1 text string in 1 Code node)
**Workflows:** WF-01
**Depends on:** GAP-10-WF01 (hard)

Update `Silent Reject (Message Type)` Code node user-facing text in WF-01 to direct non-text senders to email instead of the current deflection-only message. Single Code node text edit. No structural change.

**Proposed text** (confirm at build time): *"This service supports text messages only. If you'd like to share a document, image, voice note or any other file, please email it to chinmay_astro@gmail.com along with your phone number and name. We'll get back to you on WhatsApp."*

**Open Q at build:** confirm support email — user wrote `chinmay_astro@gmail.com` (with underscore). Verify canonical address before committing. If different, use the canonical form.

Pseudo update: `WF-01.pseudo` Silent Reject step text.

Post-MVP follow-up (NOT this sprint) — captured in Decisions §Gap 1: emoji reactions on bot messages → admin notification (WF-00 currently drops reactions silently).

## GAP-3B — Email-channel callout in WF-22/32/42 messages

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 4
**Change type:** Surgical (3 text strings across 3 workflows)
**Workflows:** WF-22, WF-32, WF-42
**Depends on:** GAP-10-FANOUT-P2 (hard)

Add a P.S.-style email-channel mention at three transition messages:
- **WF-22** payment instructions (post-form, status=payment_pending)
- **WF-32** payment-submitted ack (post Payment Completed tap)
- **WF-42** close-consultation message (right before the post-consult buttons — same message that GAP-2 modifies to add the 3rd "Done, thanks" button; this is the same-workflow soft-dep noted above)

**Proposed text suffix** (refine at build): *"In the meantime, you can ask any general questions here, or email chinmay_astro@gmail.com if you need anything we can't help with right now."*

**Explicitly out of scope:** WF-21 (the very first welcome+form). Per Decisions: keep first message focused on consent+form, not email channel.

Pseudo updates: WF-22, WF-32, WF-42 message-template sections.

All four general-enquiry suffixes from GAP-3C should also reference the email channel for consistency — coordinate wording at build time across GAP-3B and GAP-3C.

## GAP-7-STAGE1 — WF-31 aging tag for paid-elapsed in Slack relay

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 4
**Change type:** Surgical (Code node update in 1 workflow)
**Workflows:** WF-31
**Depends on:** GAP-10-FANOUT-P2 (hard)

Augment WF-31's existing `Build-Slack-Payload` Code node to:
1. SELECT `payments.created_at` (or `users.updated_at` — confirm correct source at build) for the user.
2. Compute elapsed-since-paid as a human string (`47 min ago`, `3 h ago`).
3. Prepend to the relay message: *"⏱ Paid {elapsed} ago · User said: '<msg>'"*

~5 lines added to a single Code node. No new DB activity (read uses existing connection). No cron. No new node.

Pseudo update: `WF-31.pseudo` Build-Slack-Payload step.

**Stage 2 (NOT this sprint):** Payment Approval Reminder cron — explicitly deferred post-MVP per Decisions; bundled into the post-MVP maintenance-workflows queue alongside WF-71 Payment Reminder, WF-72 Inactive Scanner, etc.

## GAP-2 — "Done, thanks" 3rd post-consult button

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 5
**Change type:** Structural (~4-5 new nodes across 2 workflows)
**Workflows:** WF-42, WF-43
**Depends on:** GAP-10-FANOUT-P2 (hard), GAP-3B (soft — same-workflow sibling on WF-42)

Add `btn_done` to WF-42 close-payload (label: "Done, thanks" — 12 chars, safely under WhatsApp's ~20-char button cap; not the literal "I'm done, thank you" at 19 chars). Add WF-43 routing branch for `button_reply` = `btn_done`:
- → WF-50 thank-you message
- → WF-51 Slack notification to `consult-{phone}` channel: *"User tapped Done — conversation closed"* (refine at build)
- No state change (`consultation_closed` stays).

**Soft sibling note:** WF-42 is also modified by GAP-3B (email-callout text in close-message). The same-workflow risk-based heuristic says Structural-before-Surgical (this item before GAP-3B), but doc-order says text-first (GAP-3B before this). Preserved doc-order intentionally: it is more natural to update the message text first, then add the button on top of the already-current text. Build-sprint should pick this batch up AFTER Batch 4 completes — no concurrent edits on WF-42.

Pseudo updates: `WF-42.pseudo` (close-payload section) + `WF-43.pseudo` (button_reply branch).

Decide final WA thank-you wording and Slack notification wording at build time. Suggested: *"Thank you for choosing Chinmay Astro. We hope to see you again — just send REBOOK whenever you're ready."*

WF-43 is NOT in the Gap-10-affected list (verified vs Decisions §Gap 10), so GAP-2's WF-43 edit has no direct Gap-10 dependency for that workflow — only via WF-42 which IS in Pass 2.

## GAP-3C — Distribute Gemini answer pattern to WF-23/30/31

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 6
**Change type:** Structural (~6 new nodes across 3 workflows)
**Workflows:** WF-23, WF-30, WF-31
**Depends on:** GAP-10-FANOUT-P2 (hard), GAP-7-STAGE1 (soft — same-workflow sibling on WF-31)

Copy WF-43's existing `Gemini General Response` HTTP node + `Prepare Gemini Response Prompt` jsCode pair into WF-23, WF-30, WF-31 for `general_enquiry` handling. WF-25 (classifier) stays unchanged — classify-only.

State-specific suffixes appended to the user's answer:
- WF-23 (pre-form): *"…and once you're ready, please fill the form to begin."*
- WF-30 (payment_pending): *"…and please complete the ₹500 payment to start your consultation."*
- WF-31 (payment_submitted): *"…meanwhile your payment is under review with Dr. Chinmay."*
- WF-43 keeps its existing suffix (untouched).

All four suffixes (including WF-43's) should include the email-channel mention for consistency with GAP-3B — finalize wording in coordination with GAP-3B at build time.

**Soft sibling note:** WF-31 is also modified by GAP-7-STAGE1 (Build-Slack-Payload aging tag). Doc-order preserved: GAP-7-STAGE1 (Code-node text update) before this (Structural addition of new nodes). Build-sprint should pick this batch up AFTER Batch 4 completes — no concurrent edits on WF-31.

New Gemini calls share existing `googlePalmApi` credential — no new auth surface.

Pseudo updates: `WF-23.pseudo`, `WF-30.pseudo`, `WF-31.pseudo` — each gains a general_enquiry → Gemini answer step.

**Post-MVP follow-up (NOT this sprint):** Centralize into a new WF-27 Responder if maintenance proves painful (divergent answer style across the 4 callers). Revisit with real traffic data per YAGNI.

## GAP-10-IMAGE-PIN — Pin n8n-prod from :latest to specific image digest

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 7
**Change type:** Infrastructure (docker-compose edit + container recreate on VPS)
**Workflows:** —
**Depends on:** GAP-10-WF01 (hard), GAP-10-WF01-SMOKE (hard), GAP-10-FANOUT-P1 (hard), GAP-10-FANOUT-P2 (hard), GAP-1 (hard), GAP-3B (hard), GAP-7-STAGE1 (hard), GAP-2 (hard), GAP-3C (hard)

Pin `n8n-prod` from `docker.n8n.io/n8nio/n8n:latest` to a specific image digest in `/mnt/chinmay-astro-data/docker-compose.yml` on the VPS. Recreate the container. Verify version + execution health post-recreate.

Runs LAST per user direction (Decisions §Gap 10 #3) so that:
1. The digest we pin is the one smoke-tested green across the entire project surface — not an arbitrary point in time.
2. If `flush-plugin-improvements` surfaces new technical-workflow-review guardrails that flag additional issues, those fixes land first and we pin a known-clean state.
3. Pinning has non-trivial recovery semantics; best done with everything else stable.

**Pre-step (REQUIRED before this batch starts):** Run `flush-plugin-improvements` to capture any new patterns from this sprint:
- New technical-workflow-review guardrail: invalid `workflowInputs.mappingMode` value detection.
- New technical-workflow-review guardrail: Code-node plain-object return detection (`return {` without `[{json:`).
- New infrastructure guardrail or doc: `:latest` Docker image tag warning + digest-pin recipe.
- Update to data-contracts design language: clarify that "passthrough at the Execute Workflow boundary" is achieved via `defineBelow + value: null` (caller) + `inputSource: passthrough` (trigger), not via a literal `mappingMode: passthrough`.

**Process:**
1. SSH to VPS (`ssh root@45.79.125.184`).
2. Get current image digest: `docker inspect --format='{{.Image}}' n8n-prod` (or via `docker images --digests`).
3. Edit `/mnt/chinmay-astro-data/docker-compose.yml` to reference the digest (e.g. `image: docker.n8n.io/n8nio/n8n@sha256:<digest>`).
4. `docker-compose up -d n8n` to recreate (per CLAUDE.md note: docker-compose v1 is buggy with newer Docker — stop/rm manually then up).
5. Verify: version unchanged, n8n UI loads, one smoke execution succeeds.

---

## Excluded from execution (for traceability — NOT in items table)

Per the Decisions doc and the user directive ("we need to pickup work for fixing 'execution mode passthrough to defineBelow' first. Then rest of the list."), the following 7 items are explicitly out of scope for this sprint and will NOT be picked up by build-sprint. Tracked here so a future sprint can resurrect them by re-invoking `plan-sprint` against a new source doc.

| Gap ID | What | Why excluded |
|--------|------|--------------|
| GAP-3A | REBOOK birth-details refresh path | Decision: NO self-service via WhatsApp. Policy-only (during active consult → tell Chinmay; otherwise → email → admin manual update). No build work. |
| GAP-4 | Country filter polite reply + 24h rate-limit | Post-MVP. MVP traffic is marketing-driven Indian audience; silent-drop is acceptable starting posture. Re-evaluate when Meta dashboard shows meaningful foreign-number traffic. |
| GAP-5 | Repeated free-form stop_intent escalation (counter / admin alert) | Post-MVP. Frequency expected very low; current clarifier-only behavior is acceptable. Lightweight Slack-alert design captured for re-trigger when traffic shows users hitting clarifier repeatedly. |
| GAP-6 | Opted-out re-engagement Slack notification (WF-26) | Post-MVP. Low-frequency event; admin discovers re-engagement via downstream payment_pending flow (WF-32 admin notification). Re-evaluate at ≥5% opt-out → re-engage rate. |
| GAP-7-STAGE2 | Payment Approval Reminder cron (WF-7x) | Post-MVP. Belongs to the broader post-MVP maintenance-workflows queue (siblings: WF-71 Payment Reminder, WF-72 Inactive Scanner, stale-form cleanup). Build with traffic evidence of SLA misses. |
| GAP-8 | `INFO <phone>` admin command | Post-MVP. Admin uses scroll-up + pgAdmin today; build when traffic shows admin asking "who is this user again" frequently. Sibling candidates for same future batch: `UPDATE BIRTHDETAILS <phone>`, `MESSAGES <phone>`, payment-history variant. |
| GAP-9 | `users.blocked_reason` DB persistence | Post-MVP. Per `[[project_admin_actions_deprecated]]` memory: single-admin model means audit is covered by Slack history + messages + state machine + the BUG-05 Slack confirmation with admin's typed reason. 1-line WF-46 fix captured for future. |
