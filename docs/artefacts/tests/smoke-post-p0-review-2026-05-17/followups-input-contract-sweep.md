# Followup — WF-50 / WF-51 caller input-contract sweep

> ✅ **STATUS: RESOLVED — 2026-05-18.** Sprint `followups-input-contract-sweep` completed all 13 fix items (ICF-001..013) across 5 batches and all 18 verification items (ICV-001..019, 1 obsolete). Commit `a16d649` on `prasadmujumdar19/chinmay-astro` `main`. Live re-verification on 2026-05-18 confirmed all 13 broken sites now have a `Prepare WF-50 Payload (X)` / `Prepare WF-51 Payload (X)` Code node as immediate upstream. Project-wide regression scan (38 call sites across 28 workflows) returned zero passthrough+Postgres/executeWorkflow/IF/Switch combinations. Sprint state lives in `docs/artefacts/sprints/followups-input-contract-sweep/state.md`. Smoke test resumes at TC-04xx (consultation messaging) from `users.id=28, status=consultation_active`.

**Created during:** smoke-test-post-p0-review on 2026-05-17 immediately after `followups-wf33-wf51-input-contract.md` traced one production failure to this pattern.
**Method:** scanned all 28 workflows for executeWorkflow nodes targeting WF-50 (`BUVun38WEKb12zg9`) or WF-51 (`wlZRK0YxnhP0b2RL`), examined `workflowInputs.mappingMode` and the **type of the immediately-upstream node** as a static-analysis proxy for "is this likely to produce the expected input shape?"

## Input contracts

- **WF-50 (Send WhatsApp)** trigger uses `inputSource: "passthrough"`. Requires fields: `phoneNumber`, `messageType` (`text` | `interactive` | `template`), and content depending on type (`messageContent` for text, template fields for template, full Meta payload for interactive).
- **WF-51 (Send Slack Message)** trigger uses `inputSource: "passthrough"`. Requires fields: `channelId`, `messageText`.

Both rely entirely on the caller producing the right shape.

## Triage of all 38 call sites

### ✅ Definitely correct — explicit `defineBelow` mapping (6)

| Workflow | Caller node | Target | Explicit keys |
|---|---|---|---|
| WF-12 | `Call WF-50 Send WhatsApp` | WF-50 | `messageBody, phoneNumber` |
| WF-20 | `Send HELP Response` | WF-50 | `messageBody, phoneNumber` |
| WF-23 | `Re-send Flow Form via WF-50` | WF-50 | `interactivePayload, messageType, phoneNumber` |
| WF-30 | `Send Payment Reminder via WF-50` | WF-50 | `message, phoneNumber` |
| WF-44 | `Send Ack via WF-50` | WF-50 | `message, phoneNumber` |
| WF-40 | `Call WF-51 (Post to Slack)` | WF-51 | `channelId, messageText` |

⚠ **Note on field-name drift:** WF-12, WF-20 pass `messageBody`; WF-30, WF-44 pass `message`; WF-50 itself reads `messageContent`. Some of these may also be broken — verify whether WF-50 has a Code/Set node that aliases these field names to `messageContent`, or whether they fail silently. **Action:** test the WF-12/WF-20/WF-30/WF-44 happy paths to confirm.

### ✅ Likely correct — upstream is `Code`/`Set` node explicitly named "Prepare X" / "Build X" / "Format X" (17)

| Workflow | Caller node | Target | Upstream (Code/Set) |
|---|---|---|---|
| WF-01 | `Send Non-Text Deflection via WF-50` | WF-50 | `Silent Reject (Message Type)` (Code) |
| WF-21 | `Call WF-50 Send WhatsApp` | WF-50 | `Build Welcome Message` (Code) |
| WF-22 | `Call 'WF-50 Send WhatsApp'` | WF-50 | `Prepare Payment Instructions` (Code) |
| WF-25 | `Send Garbage Warning` | WF-50 | `Prepare Garbage Warning` (Code) |
| WF-25 | `Send Block Warning` | WF-50 | `Prepare Block Warning` (Code) |
| WF-31 | `Send Under Review via WF-50` | WF-50 | `Prepare Under Review Message` (Code) |
| WF-32 | `Call WF-50 (Already Submitted)` | WF-50 | `Prepare Reassurance Message` (Code) |
| WF-32 | `Call WF-50 (Send Payment Confirmation Received Message)` | WF-50 | `Prepare User Confirmation` (Code) |
| WF-33 | `Call WF-50 Notify User` | WF-50 | `Prepare User Activation Message` (Code) — verified working in TC-0303 |
| WF-34 | `Call WF-50 WhatsApp Sender` | WF-50 | `Prepare Rejection Message` (Code) |
| WF-41 | `WF-50 (Send WhatsApp)` | WF-50 | `Prepare WhatsApp Message` (Code) |
| WF-42 | `Call WF-50 Send Feedback` | WF-50 | `Prepare Feedback Message` (Code) |
| WF-43 | `Send Gemini Reply via WF-50` | WF-50 | `Extract Gemini Reply` (Code) |
| WF-43 | `Send Feedback Prompt via WF-50` | WF-50 | `Prompt for Feedback` (Code) |
| WF-02 | `Call WF-51 (UNHANDLED Alert)` | WF-51 | `Build UNHANDLED Alert` (Code) |
| WF-10 | `Call WF-51 (Wrong Channel Warning)` | WF-51 | `Build Wrong Channel Warning` (Code) |
| WF-22 | `Call WF-51 Admin Alert` | WF-51 | `Build Admin Alert` (Code) |
| WF-31 | `Relay to Admin Slack` | WF-51 | `Prepare Admin Relay` (Code) |
| WF-32 | `Call WF-51 (Notify Admin)` | WF-51 | `Prepare Admin Notification` (Code) |

⚠ **Each must still be verified.** The Code/Set node's NAME suggests intent, but the actual produced shape must include `channelId+messageText` (WF-51) or `phoneNumber+messageType+content` (WF-50). To verify cheaply: open each Code node and confirm the returned object has those keys.

### ❌ High-confidence broken — passthrough + upstream is Postgres / executeWorkflow / IF / Switch (13)

These call sites pass through whatever the upstream produces — which is a DB row, a sub-workflow response, or a routing-IF passthrough. None of those produce `{channelId, messageText}` or `{phoneNumber, messageType, ...}`. Test will surface these as `invalid_arguments` (Slack) or "phoneNumber is undefined" (WhatsApp) errors.

| # | Workflow | Caller | Target | Upstream type | Expected runtime symptom |
|---|---|---|---|---|---|
| 1 | **WF-45 Rebook Handler** (`MUG7rPgSHc7UtAE9`) | `Send Payment Instructions` | WF-50 | `Set status=payment_pending` (Postgres) | REBOOK flow fails when user types REBOOK and is past consultation_active |
| 2 | **WF-47 Unsubscribe Handler** (`2U7mxHMyqA41ROKX`) | `Send Hold Message via WF-50` | WF-50 | `Check If Consultation Active` (IF) | STOP keyword path partially fails |
| 3 | **WF-47 Unsubscribe Handler** | `Send Opt-out Confirmation via WF-50` | WF-50 | `Log to admin_actions` (Postgres) | STOP keyword opt-out confirmation lost |
| 4 | **WF-25 Intent Classifier** (`eTV1lUcYrXBg2q2T`) | `Notify Admin of Garbage` | WF-51 | `Send Garbage Warning` (executeWorkflow → WF-50) | Garbage-intent admin notification lost |
| 5 | **WF-33 Payment Approval Processor** (`NcHZedq9ycnAQ9SW`) | `Call WF-51 Notify Admin in Channel` | WF-51 | `Call WF-50 Notify User` (executeWorkflow) | **CONFIRMED FAIL in TC-0303 today** |
| 6 | **WF-33 Payment Approval Processor** | `Call WF-51 Notify Admin Wrong State` | WF-51 | `User in Correct State?` (IF) | Admin "wrong state" alert lost |
| 7 | **WF-34 Payment Rejection Processor** (`se82n3MUQ9xE5aEr`) | `Call WF-51 Notify Admin Rejected` | WF-51 | `Call WF-50 WhatsApp Sender` (executeWorkflow) | Reject flow admin Slack notification lost |
| 8 | **WF-34 Payment Rejection Processor** | `Call WF-51 Notify Admin User Not Found` | WF-51 | `User Found?` (IF) | "User not found" admin alert lost |
| 9 | **WF-34 Payment Rejection Processor** | `Call WF-51 Notify Admin Wrong State` | WF-51 | `User in Correct State?` (IF) | "Wrong state" admin alert lost |
| 10 | **WF-42 Consultation Closer** (`fx70vqyJtRdF2DgR`) | `Notify Admin in Slack` | WF-51 | `Call WF-50 Send Feedback` (executeWorkflow) | Close-consult admin ack lost |
| 11 | **WF-42 Consultation Closer** | `Notify Admin Wrong State` | WF-51 | `User in Correct State?` (IF) | "Wrong state" admin alert lost |
| 12 | **WF-42 Consultation Closer** | `Notify Admin User Not Found` | WF-51 | `User Found?` (IF) | "User not found" admin alert lost |
| 13 | **WF-46 User Blocker** (`UV62An60fzflU0uD`) | `Call WF-51 Notify Admin` | WF-51 | `Update User to Blocked Status` (Postgres) | BLOCK admin notification lost |

## Recommended sprint

These 13 call sites are mutually independent but share one fix pattern: insert a `Set` node "Prepare WF-50 Payload" / "Prepare WF-51 Payload" between the current upstream and the executeWorkflow call, populated from earlier user-loading nodes via `$('NodeName').item.json.field` references. Each fix is Structural-class (single workflow, one new node + connection rewiring) — `build-workflow` Step 5e is the right tool per call site.

Suggested batching for `plan-sprint`:

- **Batch 1 — WF-51 admin notifications driven by user state transitions** (4 sites): WF-33 #5, WF-34 #7, WF-42 #10, WF-46 #13. Highest impact — these are the primary admin audit trail.
- **Batch 2 — WF-51 error/edge-case admin alerts** (5 sites): WF-33 #6, WF-34 #8, WF-34 #9, WF-42 #11, WF-42 #12. Lower frequency but same fix pattern.
- **Batch 3 — WF-50 broken passthroughs** (3 sites): WF-45 #1, WF-47 #2, WF-47 #3. Will break REBOOK and STOP user journeys.
- **Batch 4 — WF-25 admin garbage notification** (1 site): WF-25 #4. Lowest priority.

A separate verification pass is also needed on the "Likely correct" Code-node section (17 sites) — confirm each Code/Set node actually emits the required keys.

## Plugin improvement candidates

1. **`technical-workflow-review` should perform this same analysis.** Add a check: for every executeWorkflow targeting WF-50 or WF-51 (or any "well-known" downstream identified by config), validate that upstream produces required keys OR `mappingMode: defineBelow` with the required keys present.
2. **A more general check:** every executeWorkflow caller in `passthrough` mode should be flagged if the immediately-upstream node TYPE is `postgres`, `executeWorkflow`, `httpRequest`, or any node returning a response shape that's clearly NOT the input contract of the callee. Manual review confirms intent.
3. **`build-workflow` Step 5f.2** (input contract preservation) — already in 1.12.0+. Add an actionable diagnostic checklist: "Before calling WF-XX from passthrough mode, confirm the immediately-upstream node's output schema matches WF-XX's expected input."
