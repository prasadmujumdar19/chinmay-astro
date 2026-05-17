# Chinmay Astro — Tech Debt Register (Sprint Working Copy)

**Sprint completed:** 2026-05-14  
**Source:** `docs/Tech_Debts.md`  
**Final state:** 28 done · 5 obsolete (already implemented) · 1 obsolete (doc already correct) · 0 blocked  
**GitHub commit:** `89eb156` on `prasadmujumdar19/chinmay-astro` main

---

## Priority Key

| Level | Meaning |
|-------|---------|
| 🔴 P0 | Smoke test blocker — will fail the current step |
| 🟠 P1 | Functional gap — smoke test will hit it within 1–3 steps |
| 🟡 P2 | Design/naming confusion — causes incorrect AI-generated fixes |
| 🟢 P3 | Feature gap — missing admin capability |
| ⚪ P4 | Cleanup — dead code, registry inaccuracies |

---

## 🔴 P0 — Smoke Test Blockers

### TD-001 · Schema prefix `chinmay_astro.` missing in multiple critical-path workflows

> **Status:** ✅ Done — 2026-05-13 | BatchSurgical | Fixed 12 active nodes + 6 disabled nodes across WF-47, WF-11, WF-44, WF-45, WF-46, WF-34, WF-60. Also fixed WF-34 Update Payment Record (bare `payments` ref not in original list).

**Root cause:** SQL was written without fully qualifying table names. n8n's Postgres connection does not set `search_path=chinmay_astro` by default, so unqualified `users` / `admin_actions` references fail with `relation "users" does not exist`.

**Affected workflows + nodes (confirmed by static analysis):**

| Workflow | Node | Tables |
|----------|------|--------|
| WF-47 Unsubscribe Handler | Update User Status to opted_out | `users` |
| WF-47 Unsubscribe Handler | Log to admin_actions | `admin_actions` |
| WF-11 Command Parser | Lookup Blocked User | `users` |
| WF-11 Command Parser | Unblock User | `users`, `admin_actions` |
| WF-11 Command Parser | Get Active Users (disabled) | `users` |
| WF-11 Command Parser | Get Stats (disabled) | `users` |
| WF-44 Feedback Recorder | Save Feedback to DB | `users` |
| WF-45 Rebook Handler | Load User Record | `users` |
| WF-45 Rebook Handler | Set status=payment_pending | `users` |
| WF-46 User Blocker | Load User by Phone | `users` |
| WF-46 User Blocker | Update User to Blocked Status | `users` |
| WF-34 Payment Rejection | Load User by Phone | `users` |

**Fix:** Prefix every bare table reference with `chinmay_astro.` — e.g. `FROM users` → `FROM chinmay_astro.users`.

**Note:** WF-22, WF-32, WF-33 active SQL nodes are already correct (`chinmay_astro.users`). The disabled "Update User in DB" node in WF-22 also has a schema prefix issue but is not executed.

---

### TD-002 · WF-33 calls WF-52 to "create" a channel that already exists, then reads `channelId` from WF-52 response instead of DB

> **Status:** ✅ Done — 2026-05-13 | Structural | Removed Prepare Channel Data + Call WF-52 Create Channel nodes from WF-33. Rewired Create Consultation Record → Prepare User Activation Message. Patched Notify Admin channelId to read from Load User by Phone DB result.

**Root cause:** WF-33 (Payment Approval Processor) has a node named **"Call WF-52 Create Channel"** that calls WF-52 and then reads the channel ID from its response. The Slack channel is created by WF-22 at form submission time and `slack_channel_id` is saved to the DB.

**Fix:** 
1. Update "Load User by Phone" query in WF-33 to also `SELECT slack_channel_id`.
2. Replace the WF-52 call with a reference to `$('Load User by Phone').item.json.slack_channel_id`.
3. Delete the "Prepare Channel Data" and "Call WF-52 Create Channel" nodes from WF-33.

---

### TD-014 · WF-42 (Consultation Closer) references `users` columns that don't exist in schema — CLOSES will fail

> **Status:** ⚪ Obsolete — Both `current_consultation_id` (integer) and `total_consultations` (integer) already exist in `chinmay_astro.users`. Schema was ahead of CONTEXT.md documentation. No migration needed.

**Root cause:** WF-42's "Update User Status" node runs UPDATE with `current_consultation_id` and `total_consultations` columns documented as non-existent. Investigation confirmed they already exist.

---

## 🟠 P1 — Functional Gaps (will surface in next few smoke test steps)

### TD-003 · WF-22 "User Already Exists" path calls a non-existent workflow ID

> **Status:** ✅ Done — 2026-05-13 | Surgical | Patched `Call 'WF-50 Send WhatsApp'1` workflowId from `aJoquwuEUbz8bI1B` → `BUVun38WEKb12zg9`.

**Finding:** WF-22's "User Already Exists" branch calls an unknown WF-50 ID `aJoquwuEUbz8bI1B` which doesn't exist in n8n.

---

### TD-004 · WF-60 (Message Logger) — all core nodes disabled; logging is completely broken

> **Status:** ✅ Done — 2026-05-13 | Structural | Enabled all 6 disabled nodes: Log to Messages Table, Get User ID, Inbound-Prepare Log Entry, Inbound-Log Message, Outbound-Prepare Log Entry, Outbound-Log Message. Main logging path now fully active. Note: Get User ID and old detailed logging branch (4 nodes) are enabled but orphaned (no incoming connection from trigger) — logging works via the simpler main path.

**Finding:** WF-60's entire processing pipeline was disabled. WF-50 calls WF-60 on every outbound WhatsApp message — no audit trail was being written.

---

### TD-005 · WF-11 (Command Parser) — admin confirmations and sub-commands disabled

> **Status:** ✅ Done — 2026-05-13 | Structural | Enabled all 9 disabled nodes: Confirm Consultation Closure, Confirm User Blocked, Get Active Users, Format List, Send List To Admin, Get Stats, Format Stats, Send Stats To Admin, Unknown Command Response.

**Finding:** Many WF-11 nodes were disabled — admin had no feedback after issuing commands; LIST USERS and STATS commands were broken.

---

### TD-006 · WF-20 registry note is stale — describes a bug that is already fixed

> **Status:** ⚪ Obsolete — The 'WRONG' note described in this TD does not exist in workflow-registry.md. WF-20 is correctly shown as fixed in both the WIP table and inventory. No action needed.

---

### TD-015 · WF-42 sends a WhatsApp template instead of interactive buttons — post-consultation menu broken

> **Status:** ✅ Done — 2026-05-14 | Structural | Patched 'Prepare Feedback Message' code node to output `messageType='interactive'` with button payload. Button IDs: `btn_feedback` (Leave Feedback) and `btn_rebook` (Book Again).

**Root cause:** WF-42 was sending an unconfirmed Meta template `consultation_closed_feedback` instead of interactive buttons as specified by journey map J-11.

---

### TD-016 · WF-31 (Payment Submitted Handler) does not relay user messages to admin Slack

> **Status:** ✅ Done — 2026-05-14 | Structural | Added Slack relay fan-out from trigger: Load User for Relay (Postgres, gets `slack_channel_id` by `phone_number`) → Prepare Admin Relay (code) → Relay to Admin Slack (calls WF-51). Runs in parallel with existing WF-25 intent classifier branch.

**Finding:** WF-31 sent an "under review" ack to the user but had no Slack relay step. Admin was blind to any messages a `payment_submitted` user sent while waiting for approval.

---

### TD-021 · WF-33 (Payment Approval Processor) missing state guard — APPROVE executes regardless of user status

> **Status:** ✅ Done — 2026-05-13 | Structural | Added IF node 'User in Correct State?' at [656,-200] between Load User by Phone and Update Payment Status. True (status=`payment_submitted`) → existing approval flow. False → 'Notify Admin Wrong State' Slack node posts error to user's consultation channel.

---

### TD-022 · WF-42 (Consultation Closer) missing state guard — CLOSE executes regardless of user status

> **Status:** ✅ Done — 2026-05-14 | Structural | Added IF node 'User in Correct State?' at [432,-200] between Load User by Phone and Close Consultation Record. True (status=`consultation_active`) → existing close flow. False → 'Notify Admin Wrong State' Slack error.

---

### TD-023 · WF-10 relay path has no user status check — admin plain-text relayed from consult-* channels regardless of user state

> **Status:** ✅ Done — 2026-05-14 | Structural | Added 'Load User Status' Postgres node (SELECT status WHERE `slack_channel_id=$1`) and 'User Consultation Active?' IF node. Relay now only fires for `consultation_active` users — drops silently for other states.

---

### TD-024 · WF-43 (Post-Consultation Handler) handles only text intent — post-consultation button taps have no explicit routing

> **Status:** ✅ Done — 2026-05-14 | Structural | WF-43: Added 'Is Button Reply?' IF before WF-25. True branch → 'Is Rebook Button?' IF (`btn_rebook`). Rebook → WF-45. Non-rebook → 'Prompt for Feedback' + WF-50. WF-02: Patched 'Detect Route' to check `consultation_closed` + `button_reply` BEFORE generic PAYMENT_CONFIRM route → routes to WF-43 instead of WF-32.

---

### TD-025 · WF-32 (Payment Confirmation Receiver) missing idempotency guard — duplicate "Payment Completed" tap creates duplicate payment record

> **Status:** ✅ Done — 2026-05-13 | Structural | Added IF node 'Already Payment Submitted?' after trigger. True → Prepare Reassurance Message → Call WF-50 (exit). False → existing Create Payment Record flow. `user.status` available from WF-02 trigger input — no extra DB query needed.

---

### TD-030 · WF-00 (Webhook Receiver) may not filter bot's own WhatsApp outbound message echoes

> **Status:** ✅ Done — 2026-05-13 | Surgical | Added bot echo filter in Parse WhatsApp Message code node: compares `message.from` to `value.metadata.display_phone_number` (stripped of non-digits). Sets `skip:true` if match.

---

### TD-031 · APPROVE command wording inconsistency — "APPROVE PAYMENT" vs "APPROVE CHAT CONSULT" used interchangeably across docs

> **Status:** ✅ Done — 2026-05-13 | Documentation | Canonical form: `APPROVE PAYMENT <phone>`. Fixed workflow-registry.md (WF-11 + WF-33 entries), customer_journey_map.html (3 occurrences), FunctionalTestCases.md (TC-1005 rewritten). CLAUDE.md and user_journey_map.html were already correct.

---

## 🟡 P2 — Design / Naming Confusion (causes incorrect AI-generated fixes)

### TD-007 · WF-52 call-site node names imply "creator-only" semantics — confuses Claude

> **Status:** ✅ Done — 2026-05-14 | Surgical | Renamed 'Call WF-52 (Create User Channel)' → 'Ensure Slack Channel Exists (WF-52)' in WF-22. WF-33 node was already deleted in TD-002. Registry WF-52 entry updated to clarify idempotent behavior and sole caller (WF-22 only).

---

### TD-008 · WF-52 input field contract is undocumented; callers use passthrough mapping

> **Status:** ✅ Done — 2026-05-14 | Documentation | Documented WF-52 input contract in registry: `phoneNumber` (string), `userName` (string), optional `userId` (integer). Output: `{ channelId, channelName, isNew }`. Confirmed only WF-22 calls WF-52 — WF-32 and WF-42 removed in prior sessions.

---

### TD-009 · WF-60 and WF-20 IDs are swapped in workflow-registry.md

> **Status:** ⚪ Obsolete — Both IDs already correct in registry: WF-20: `LgIDj1v4ZbCPlX25`, WF-60: `6H75p935FpBVBQtV`. Fixed in prior sessions when WF-60 UUID was documented during TD-004.

---

### TD-017 · Non-text messages during `consultation_active` are silently dropped

> **Status:** ✅ Done — 2026-05-14 | Documentation | Documented in STATUS.md Post Go-Live item #15: non-text messages (images, voice, video) are silently dropped during `consultation_active`; WF-41 only relays text. Accepted limitation for go-live; Phase 2 relay upgrade planned.

---

### TD-019 · WF-47 (Unsubscribe Handler) does not archive the user's Slack channel on STOP

> **Status:** ✅ Done — 2026-05-14 | Structural | Added Get User Slack Channel (Postgres SELECT `slack_channel_id`) + Archive Slack Channel (Slack archive op) nodes after Send Opt-out Confirmation via WF-50.

---

### TD-020 · WF-46 (User Blocker) does not archive the user's Slack channel on BLOCK

> **Status:** ✅ Done — 2026-05-14 | Structural | Added Get User Slack Channel (Postgres SELECT `slack_channel_id`) + Archive Slack Channel (Slack archive op) nodes after admin confirmation message. Same pattern as TD-019.

---

### TD-026 · WF-11 UNBLOCK command (TD-010) has no status guard — can accidentally override opted_out users

> **Status:** ⚪ Obsolete — Guard already implemented: Lookup Blocked User SELECT has `AND status='blocked'` — `opted_out` users return no row, Blocked User Found? IF routes to No Blocked User Found branch.

---

### TD-027 · WF-20 HELP response is a single static message — not status-aware per J-18

> **Status:** ✅ Done — 2026-05-14 | Surgical | Updated Send HELP Response messageBody to a ternary chain on `userStatus`: covers `payment_pending` / `payment_submitted` / `consultation_active` / `consultation_closed` with specific guidance; generic fallback for unknown/null status.

---

### TD-028 · WF-30 (New User Handler) and WF-31 (Payment Submitted Handler) have no stop_intent routing branch

> **Status:** ✅ Done — 2026-05-14 | Structural | WF-30: added `c4 stop_intent notEquals` condition to Is Pass-Through Intent?; added Is Stop Intent? IF and Call WF-47 Unsubscribe nodes. WF-31: identical patch applied. Both JSONs exported.

---

### TD-029 · WF-25 (Intent Classifier) has no error handling for Gemini API failures

> **Status:** ✅ Done — 2026-05-14 | Structural | Added `onError:continueErrorOutput` to Classify Intent HTTP Request node. Added Handle Gemini Error Code node at [-800,160]: returns `intentResult=general_enquiry` + `geminiError:true`. Error output → Handle Gemini Error → Return to Caller.

---

### TD-032 · WF-44 (Feedback Recorder) saves all text as feedback without intent classification — rebook intents are silently lost

> **Status:** ✅ Done — 2026-05-14 | Structural | Inserted Call WF-25 Intent Classifier + Is Rebook Intent? IF + Call WF-45 Rebook before Save Feedback. Trigger now routes: `rebook_intent` → WF-45; all other intents → Save Feedback → Ack. Used full workflow update (removeConnection fails for executeWorkflowTrigger node type).

---

### TD-033 · WF-50 (WhatsApp Sender) has no input validation for empty or null message body

> **Status:** ✅ Done — 2026-05-14 | Structural | Guard added in 'Prepare Payload' code node: if `messageType=text` and `messageContent` is null/empty after trim, returns `[]` (graceful exit — no Meta API call). Return `[]` is the correct n8n pattern for stopping execution in a sub-workflow.

---

### TD-034 · WF-00 does not guard against whitespace-only or blank user messages before routing

> **Status:** ✅ Done — 2026-05-14 | Surgical | Guard added in 'Parse WhatsApp Message' code node in WF-00: if `messageType=text` and `messageContent` is null/empty after trim → returns `{skip:true, reason:'Whitespace-only text message — skipped'}`. Consistent with existing skip pattern for non-message events and bot echoes.

---

## 🟢 P3 — Feature Gaps

### TD-010 · WF-11 missing UNBLOCK admin command

> **Status:** ⚪ Obsolete — UNBLOCK command already fully implemented in WF-11 (`GoTYo0GS2y8qjjkw`): Parse Command detects UNBLOCK → `commandType=UNBLOCK_USER`; Switch routes to Lookup Blocked User; full unblock flow with Confirm/No-Found responses already live.

---

### TD-011 · WF-45 (Rebook Handler) payment wording not updated to standard UPI text

> **Status:** ✅ Done — 2026-05-14 | Structural | Updated Send Payment Instructions node to `messageType=interactive` with button payload: standard ₹500 UPI text matching WF-22 format, `action.buttons=[{id:payment_completed, title:Payment Completed}]`.

---

### TD-012 · WF-23 registry status shows 🔵 Placeholder but it is built and active

> **Status:** ✅ Done — 2026-05-14 | Documentation | Updated WF-23 registry status from Placeholder → Active. Also updated WF-45 from Placeholder → Active.

---

## ⚪ P4 — Cleanup

### TD-013 · Three stale/backup workflows polluting the n8n workflow list

> **Status:** ✅ Done — 2026-05-14 | Surgical | Deleted: `yIZwO3CZk6bOBAXl` (BACKUP WF-30 wrong onboarding), `fdlIpl67amL2Ho6U` (BACKUP WF-25 superseded), `z6as85o3b1zK22eF` (WF-30 DEACTIVATED). n8n now has 28 workflows.

---

### TD-018 · WF-42 registry description incorrectly states "Archives Slack channel via WF-52" — channel is never archived on CLOSE

> **Status:** ⚪ Obsolete — WF-42 registry entry already correct — no 'Archives via WF-52' text present. WF-52 entry explicitly states 'WF-32 and WF-42 do NOT call WF-52'. Fixed in earlier sprint batches.

---

---

## Design Gaps (from `user_journey_map.html` comparison)

These gaps exist between the journey map specification and the current workflow implementation.

---

### TD-014 · WF-42 (Consultation Closer) references `users` columns that don't exist in schema — CLOSES will fail

*(see P0 section above — marked Obsolete: columns already exist)*

---

### TD-015 · WF-42 sends a WhatsApp template instead of interactive buttons — post-consultation menu broken

*(see P1 section above — marked Done)*

---

### TD-016 · WF-31 (Payment Submitted Handler) does not relay user messages to admin Slack

*(see P1 section above — marked Done)*

---

### TD-017 · Non-text messages during `consultation_active` are silently dropped at WF-00

*(see P2 section above — marked Done: accepted go-live limitation, documented in STATUS.md)*

---

## Archival Strategy — Design Decision (May 2026)

**Decision:** Slack consultation channels (`consult-{phone}`) are **NOT archived when a consultation closes**. This is intentional.

### Rationale
After consultation closure, a user may rebook within days or weeks. Keeping the channel open allows Chinmay to scroll back and see the full conversation history — birth details, questions asked, context already shared — without asking the user to repeat themselves.

### Archival Triggers

| Event | Trigger Workflow | Status |
|-------|-----------------|--------|
| User sends STOP → `opted_out` | WF-47 | ✅ Done — TD-019 |
| Admin BLOCK → `blocked` | WF-46 | ✅ Done — TD-020 |
| 60-day inactivity (background sweep) | WF-72 | Deferred — post-go-live |

---

## Summary Table

| ID | Issue | Priority | Final Status |
|----|-------|----------|-------------|
| TD-001 | Schema prefix `chinmay_astro.` missing (12 nodes across 8 WFs) | 🔴 P0 | ✅ Done |
| TD-002 | WF-33 redundant WF-52 call; reads channelId from WF-52 not DB | 🔴 P0 | ✅ Done |
| TD-014 | WF-42 UPDATE uses non-existent `users` columns → CLOSE fails | 🔴 P0 | ⚪ Obsolete |
| TD-003 | WF-22 "User Already Exists" calls unknown WF-50 ID | 🟠 P1 | ✅ Done |
| TD-004 | WF-60 all core nodes disabled — logging dead | 🟠 P1 | ✅ Done |
| TD-005 | WF-11 admin confirmation + stats nodes disabled | 🟠 P1 | ✅ Done |
| TD-006 | WF-20 registry note says broken but it's already fixed — stale doc | 🟠 P1 | ⚪ Obsolete |
| TD-015 | WF-42 sends unconfirmed Meta template instead of interactive buttons | 🟠 P1 | ✅ Done |
| TD-016 | WF-31 no Slack relay for payment_submitted user messages | 🟠 P1 | ✅ Done |
| TD-021 | WF-33 missing state guard — APPROVE runs regardless of user status | 🟠 P1 | ✅ Done |
| TD-022 | WF-42 missing state guard — CLOSE runs regardless of user status | 🟠 P1 | ✅ Done |
| TD-023 | WF-10 relay has no status check — admin notes sent during payment_submitted | 🟠 P1 | ✅ Done |
| TD-024 | WF-43 no button_reply routing for post-consult buttons | 🟠 P1 | ✅ Done |
| TD-025 | WF-32 missing idempotency — duplicate "Payment Completed" tap accepted | 🟠 P1 | ✅ Done |
| TD-030 | WF-00 no bot echo filter — outbound WA messages may re-enter routing | 🟠 P1 | ✅ Done |
| TD-031 | APPROVE command wording inconsistency across docs | 🟠 P1 | ✅ Done |
| TD-007 | WF-52 call-site nodes named "Create Channel" — wrong semantics | 🟡 P2 | ✅ Done |
| TD-008 | WF-52 input contract undocumented; passthrough mapping fragile | 🟡 P2 | ✅ Done |
| TD-009 | WF-60 / WF-20 IDs swapped in registry | 🟡 P2 | ⚪ Obsolete |
| TD-017 | Non-text during consultation_active silently dropped (accepted limitation) | 🟡 P2 | ✅ Done |
| TD-019 | WF-47 does not archive Slack channel on STOP/opted_out | 🟡 P2 | ✅ Done |
| TD-020 | WF-46 does not archive Slack channel on BLOCK | 🟡 P2 | ✅ Done |
| TD-026 | WF-11 UNBLOCK has no status guard — can override opted_out users | 🟡 P2 | ⚪ Obsolete |
| TD-027 | WF-20 HELP response is static — not status-aware per J-18 | 🟡 P2 | ✅ Done |
| TD-028 | WF-30 / WF-31 missing stop_intent routing branch | 🟡 P2 | ✅ Done |
| TD-029 | WF-25 no error handling for Gemini API failures | 🟡 P2 | ✅ Done |
| TD-032 | WF-44 saves all text as feedback without intent check — rebook intent lost | 🟡 P2 | ✅ Done |
| TD-033 | WF-50 no validation for empty/null message body | 🟡 P2 | ✅ Done |
| TD-034 | WF-00 no guard for whitespace-only user messages | 🟡 P2 | ✅ Done |
| TD-010 | WF-11 missing UNBLOCK command | 🟢 P3 | ⚪ Obsolete |
| TD-011 | WF-45 Rebook payment wording not updated | 🟢 P3 | ✅ Done |
| TD-012 | WF-23 registry status wrong (Placeholder → Active) | 🟢 P3 | ✅ Done |
| TD-013 | 3 stale/backup workflows in n8n | ⚪ P4 | ✅ Done |
| TD-018 | WF-42 registry description says "Archives via WF-52" — incorrect | ⚪ P4 | ⚪ Obsolete |
