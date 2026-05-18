# Chinmay Astro — Workflow Registry
**Version:** 2.9 | **Last Updated:** 18 May 2026 (canonical-executeworkflow-shape-sweep)
**Source:** user_journey_map.html v2.1 + live n8n audit (Mumbai VPS, Apr 2026) + design clarifications sessions 3–4

### 2026-05-18 — Canonical executeWorkflow shape sweep (residual 10 workflows)
- **26 executeWorkflow nodes across 10 workflows** rolled to canonical n8n 2.1.4 tv-1.2 shape via idempotent jq roller. Same pattern as 2026-05-17 sweep (`source:"database" + operation:"call_workflow" + mode:"once" + workflowId:{__rl,value,mode:"list",cachedResultUrl} + workflowInputs:{mappingMode:"passthrough",...}`) — this sprint covered the 10 workflows the 2026-05-17 sprint did not touch. Triggered by smoke test surfacing WF-31 `Call WF-25 Intent Classifier` runtime failure ("No information about the workflow to execute found"). Workflows touched: **WF-12, WF-20, WF-23, WF-25, WF-30, WF-31, WF-40, WF-44, WF-45, WF-47**. WF-47's nodes were at tv=1.0 (older than the rest) and bumped to 1.2 by the same roller.
- **3 superseded workflow JSONs moved to `archive/superseded-workflows/`** — `fdlIpl67amL2Ho6U` (BACKUP_20260412_WF-25 Post-Consultation Options), `yIZwO3CZk6bOBAXl` (BACKUP_20260412_WF-30 pre-consent), `z6as85o3b1zK22eF` (WF-30 New User Onboarding WRONG-DEACTIVATED). The `workflows/` directory now mirrors live n8n state (28 files).
- **`docs/pseudocode/WF-XX.md` companion files regenerated** from fresh JSON exports post-sweep so the canonical 1.2 shape is reflected. INDEX.md timestamp updated to 2026-05-18; manual workflow descriptions preserved.

### 2026-05-17 — Post-P0 smoke test fixes
- **47 executeWorkflow nodes across 14 workflows** restored to canonical n8n 2.1.4 tv-1.2 shape: `source:"database" + operation:"call_workflow" + mode:"once" + workflowId:{__rl,value,mode:"list",cachedResultUrl} + workflowInputs:{mappingMode:"passthrough",...}`. Required by n8n 2.1.4 — prior P0 sprint had stripped `__rl` workflowId objects to plain strings per a stale lint hook, causing "No information about the workflow to execute found" errors at runtime. Workflows touched: WF-00, WF-01, WF-02, WF-10, WF-11, WF-21, WF-22, WF-33, WF-34, WF-42, WF-50, plus 3 sub-workflows (3va0M06kijgyLejf, 6PzJRZsF7k2d9hV7, UV62An60fzflU0uD).
- **WF-00 wiring fix** — Gather Message Info now branches in parallel to both Call WF-60 (fire-and-forget log) and Call WF-01 (routing), matching pseudocode Step 8a/9 intent. Previous P0 sprint had wired Call WF-60 → Call WF-01 inline, causing WF-01 to receive `{logged: true}` instead of the parsed message data.

---

## Status Key

| Status | Meaning |
|---|---|
| 🟢 Active | Deployed and active in n8n — confirmed live Apr 2026 |
| 🟡 Built (Inactive) | Exists in n8n, imported but not activated |
| 🔴 WRONG — Deactivate | Active in n8n but implements incorrect logic — must be deactivated before go-live |
| 🔵 Placeholder | Exists in n8n with single trigger node only — needs full implementation |
| 🔨 Rebuild Required | Exists in n8n — logic needs verification/updating before activation |
| ⚫ Superseded | Wrong design — deactivated, kept only for reference |

## Priority Key

| Priority | Meaning |
|---|---|
| 🔴 P1 — Critical | System cannot function without this |
| 🟠 P2 — Core | Required for complete user journey |
| 🟡 P3 — Supporting | Improves experience; degraded but functional without |
| ⚪ P4 — Maintenance | Post go-live / background hygiene |

---

## Naming Convention

| Range | Domain |
|---|---|
| WF-0x | Infrastructure — entry point, routing, security |
| WF-1x | Admin — Slack-side command handling |
| WF-2x | Onboarding — new user, form, birth details |
| WF-3x | Payment — confirmation, approval, rejection |
| WF-4x | Consultation — relay, close, post-consult, rebook |
| WF-5x | Messaging utilities — WhatsApp sender, Slack sender, channel manager |
| WF-6x | Data — message logging, audit |
| WF-7x | Background jobs — scheduled health checks, reminders, cleanup |

---

## State Machine (User Status)

```
[no record] →(form submitted)→ payment_pending →(tap "Payment Completed")→ payment_submitted
    →(admin APPROVE)→ consultation_active →(admin CLOSE)→ consultation_closed
    →(REBOOK)→ payment_pending [loop]

any state →(admin BLOCK)→ blocked
payment_submitted →(admin REJECT)→ payment_pending [retry]
```

**Two-dimensional state:** `status` (above) + `stage` (sub-state within status, e.g. `awaiting_feedback`).

---

## WF-0x — Infrastructure

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-00 | Webhook Receiver | 🟢 Active | 🔴 P1 | n8n: "WF-00 Webhook Receiver" (JQu1MkK5vgtUCeNO) | Entry point for all inbound WhatsApp messages. Meta webhook verification, deduplication, bot echo filter (TD-030), whitespace-only message guard (TD-034 May 2026). Filters non-text (images/audio/reactions → ignore). Routes valid text messages to WF-01. |
| WF-01 | Message Router | 🟢 Active | 🔴 P1 | n8n: "WF-01 Message Router" (hYGNM97sXvdo1WmI) | Security filters: country check, blocked-user check. Loads user + pendingUser records from DB. Routes: no record→WF-21, pendingUser→WF-22, existing user→WF-02. Updated Apr 2026 to pass pendingUser to WF-02. Fixed May 2026 (TD-NEW-002): Layer 3 now emits OPTED_OUT for opted_out users (routes to WF-21 for re-engagement) vs REJECTED for blocked users only; Lookup SQL updated to SELECT status. Updated 2026-05-18 (ICV-001): 'Silent Reject (Message Type)' Code node now returns {phoneNumber, message: "⚠️ Sorry, we only handle text messages right now..."} instead of {silentReject, reason}; non-text messages now actually trigger the deflection WhatsApp send via WF-50 (caller name was misleading — design decision recorded in sprint followups-input-contract-sweep). |
| WF-02 | User State Router | 🟢 Active | 🔴 P1 | n8n: "WF-02 User State Router" (PubCsNTOspF3xqXZ) | Routes by messageType + user status. button_reply routing: consultation_closed → POST_CONSULT_TEXT (WF-43, TD-024 May 2026); all others → PAYMENT_CONFIRM (WF-32). Routes: NEW_USER→WF-21, PRE_FORM_TEXT→WF-23, DETAILS_FORM→WF-22, POST_CONSULT_TEXT→WF-43, PAYMENT_CONFIRM→WF-32, PAYMENT_PENDING_TEXT→WF-30, PAYMENT_SUBMITTED_TEXT→WF-31, RELAY→WF-40. Fixed May 2026 (TD-NEW-004): text messages now pass through WF-20 (Keyword Handler) before state routing — STOP/HELP/REBOOK intercepted; interactive messages bypass WF-20 directly to Route Switch. |

---

## WF-1x — Admin (Slack-Side)

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-10 | Slack Admin Handler | 🟢 Active | 🔴 P1 | n8n: "WF-10 Slack Admin Handler" (wMh0oBRtJbvhLgOf) | Entry point for Slack events. Filters bot messages. Routes commands to WF-11. Admin text in user channels relays to WF-41 only if user is consultation_active (TD-023 May 2026 — status guard added). Updated 2026-05-18 (BUG-01): "Load User Status" `options.queryReplacement` converted from comma-separated expression string to JS-array form `={{ [a, b, c] }}` — admin messages containing commas were being split by n8n's comma-parser and misaligning the `$1/$2/$3` placeholders. |
| WF-11 | Command Parser | 🟢 Active | 🔴 P1 | n8n: "WF-11 Command Parser" (GoTYo0GS2y8qjjkw) | Parses APPROVE PAYMENT→WF-33, REJECT→WF-34, CLOSE→WF-42, BLOCK→WF-46, UNBLOCK→WF-11 unblock flow (Lookup Blocked User → Unblock User / No Blocked User Found). All nodes active (TD-005 May 2026). UNBLOCK guard: SELECT status=blocked — opted_out users not affected. |
| WF-12 | Admin → WhatsApp Relay | 🟢 Active | 🟠 P2 | n8n: "WF-12 Admin -> WhatsApp Relay" (RjwHs9Dx5cK8Q5wD) | Relays plain-text messages typed by admin in user's Slack channel → WhatsApp during consultation_active. Distinct from command handling. Calls WF-50. Built + activated session 4. |

---

## WF-2x — Onboarding

> **Design principle:** No DB record is created until the user submits the WhatsApp Flow form. The very first message triggers a single combined response: policy URL in message body + WhatsApp Flow form. Filling and submitting = implicit consent.

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-21 | New User Welcome + Form | 🟢 Active | 🔴 P1 | n8n: "WF-21 New User Welcome + Form" (zM8WbxSdt9nXRoLZ) | Triggered by WF-02 when no DB record + no pendingUser exists. No DB write. Sends ONE free-form message: policy URL + service description + ₹500 fee + WhatsApp Flow form. Flow ID: 1408011897720771, flowCta: "Fill Details". Tested Apr 2026 — working. Activated Apr 2026. Updated 2026-05-18 (BUG-01 sweep): "Insert Pending User" queryReplacement converted to JS-array form — `contactName` from WhatsApp profile can contain commas. |
| WF-22 | Form Response Handler | 🟢 Active | 🔴 P1 | n8n: "WF-22 Form Response Handler" (dr8QM0m92Ml8MvIh) | Handles WhatsApp Flow encrypted callback. Decrypts + validates payload. **First DB write here:** creates user record with status=payment_pending, stores name/DOB/TOB/birth_place. **Immediately calls WF-52 to create `consult-{phone}` Slack channel and saves slack_channel_id to DB.** Sends GPay payment instructions + "Payment Completed" interactive button. Updated May 2026: channel creation moved here from WF-32. Updated 2026-05-17 (FU-3): removed redundant `User Created?` IF node (both branches converged to same downstream); `Create User Record` now connects directly to `Ensure Slack Channel Exists (WF-52)`. Updated 2026-05-18 (BUG-01 sweep): "Create User Record" queryReplacement converted to JS-array form — `full_name` and `place_of_birth` are user-input fields that often contain commas (e.g. "Smith, John", "Mumbai, India"). Also applied canonical-1.2 roller to 3 executeWorkflow nodes (added missing `source`/`operation`/`mode`). |
| WF-23 | Pre-Form Intent Filter | 🟢 Active | 🟡 P3 | n8n: "WF-23 Pre-Form Intent Filter" (VpCER0Vqq3NYJGpI) | Handles free-form messages from users with pendingUser record (received form but haven't submitted yet). Runs WF-25 Gemini intent filter → contextual reply + re-sends policy + form. Built and active (session 6). |

---

## WF-3x — Payment

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-30 | Payment Pending Intent Filter | 🟢 Active | 🟡 P3 | n8n: "WF-30 Payment Pending Intent Filter" (gGJBY5fJha0Let8I) | Handles free-form messages from payment_pending users. WF-25 intent filter: garbage/malicious/inappropriate/stop_intent blocked (stop_intent→WF-47 Unsubscribe). Pass-through intents: contextual reply + re-prompt payment. Updated May 2026 (TD-028): stop_intent routing to WF-47. |
| WF-31 | Payment Submitted Handler | 🟢 Active | 🟡 P3 | n8n: "WF-31 Payment Submitted Handler" (HB8nXudAtk9iXz7C) — was "WF-27 Payment Review Handler" | Handles free-form messages from payment_submitted users. WF-25 intent classifier → pass-through (non-blocked intents): "under review" ack via WF-50; stop_intent → WF-47 Unsubscribe. Also relays all messages to user's Slack consultation channel via WF-51 (TD-016 May 2026). Updated May 2026 (TD-028): stop_intent routing to WF-47. |
| WF-32 | Payment Confirmation Receiver | 🟢 Active | 🔴 P1 | n8n: "WF-32 Payment Confirmation Receiver" (emUOLWVZiNVxcOe3) — was "WF-24 Payment Confirmation Handler" | User taps "Payment Completed" button. Updates status=payment_submitted. Loads existing slack_channel_id from DB (channel was already created in WF-22). Posts payment notification to user's consult channel. Admin reads notification and types `APPROVE PAYMENT <phone>` in that same channel. Updated May 2026: WF-52 call removed — channel is pre-created at form submission. |
| WF-33 | Payment Approval Processor | 🟢 Active | 🔴 P1 | n8n: "WF-33 Payment Approval Processor" (NcHZedq9ycnAQ9SW) — was "WF-40 Payment Approval Processor" | Admin issues APPROVE PAYMENT <phone> in Slack. State guard added (TD-021 May 2026): only proceeds if user is in payment_submitted state; otherwise posts error to consultation channel. Updates status=consultation_active. Notifies user on WhatsApp that consultation has begun. Updated 2026-05-18 (ICF-005): added "Prepare WF-51 Payload (Notify Admin)" Set node between WF-50 notify-user and WF-51 notify-admin-in-channel caller — admin Slack ack was lost in TC-0303 because passthrough was forwarding the WF-50 response instead of {channelId, messageText}. Updated 2026-05-18 (ICF-006): added "Prepare WF-51 Payload (Wrong State)" Set node on User in Correct State? false-branch before Notify Admin Wrong State caller — same passthrough fix pattern. |
| WF-34 | Payment Rejection Processor | 🟢 Active | 🔴 P1 | n8n: "WF-34 Payment Rejection Processor" (se82n3MUQ9xE5aEr) — was "WF-41 Payment Rejection Processor" | Admin issues REJECT in Slack. Updates status=payment_pending. Sends rejection reason to user with retry instructions. Updated 2026-05-18 (ICF-007): added "Prepare WF-51 Payload (Notify Admin Rejected)" Set node between WF-50 sender and WF-51 admin caller. Updated 2026-05-18 (ICF-008): added "Prepare WF-51 Payload (User Not Found)" Set node on User Found? false-branch (channelId from trigger input — no user record on this branch). Updated 2026-05-18 (ICF-009): added "Prepare WF-51 Payload (Wrong State)" Set node on User in Correct State? false-branch. Same passthrough fix pattern across all 3. Updated 2026-05-18 (BUG-01 sweep): "Update Payment Record" queryReplacement converted to JS-array form — `rejectionReason` is admin-typed free text that can contain commas. Also fixed "User Found?" IF node — added `singleValue: true` to `notEmpty` unary operator (pre-existing schema validation issue surfaced during PUT). |

---

## WF-4x — Consultation

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-40 | User → Admin Relay | 🟢 Active | 🔴 P1 | n8n: "WF-40 User -> Admin Relay" (du32QBZbSQOjfESe) | Handles inbound WhatsApp messages during consultation_active. Loads user from DB (gets slackChannelId + name), formats message, calls WF-51. Implemented + activated session 3. |
| WF-41 | Admin → User Relay | 🟢 Active | 🔴 P1 | n8n: "WF-41 Admin -> User Relay" (6PzJRZsF7k2d9hV7) | Admin types in user's Slack channel → WF-50 → WhatsApp. Fixed session 3: added postgres + Slack credentials, corrected WF-50 ID (BUVun38WEKb12zg9). WF-10 now routes here. |
| WF-42 | Consultation Closer | 🟢 Active | 🔴 P1 | n8n: "WF-42 Consultation Closer" (fx70vqyJtRdF2DgR) | Admin issues CLOSE in consult channel. State guard added (TD-022 May 2026): only proceeds if user is consultation_active. Sends interactive button message with btn_feedback / btn_rebook (TD-015 May 2026 — replaces unapproved template). Updates status=consultation_closed. **Does NOT archive Slack channel** — channel intentionally kept open for reuse by WF-45 on rebook (TC-0305 design decision 2026-05-16). All 3 admin Slack confirmations routed via WF-51 (FU-9 May 2026 — closes Theme 7 admin-Slack alignment; no remaining direct slack nodes). Updated 2026-05-18 (ICF-010): added "Prepare WF-51 Payload (Notify Admin Closed)" Set node between WF-50 feedback sender and main "Notify Admin in Slack" caller. Updated 2026-05-18 (ICF-011): added "Prepare WF-51 Payload (Wrong State)" Set node on User in Correct State? false-branch before Notify Admin Wrong State caller. Same passthrough fix pattern. Updated 2026-05-18 (ICF-012): added "Prepare WF-51 Payload (User Not Found)" Code node on User Found? false-branch before Notify Admin User Not Found caller; uses trigger.channelId since no user record exists on this branch. |
| WF-43 | Post-Consultation Handler | 🟢 Active | 🟠 P2 | n8n: "WF-43 Post-Consultation Handler" (3va0M06kijgyLejf) — was "WF-28 Post-Consultation Text Handler" | Handles consultation_closed users. Button_reply routing added (TD-024 May 2026): btn_rebook → WF-45 directly; btn_feedback → sends feedback prompt via WF-50. Text messages: WF-25 intent classifier → rebook_intent→WF-45, feedback_intent→WF-44, general→Gemini response. Hardened May 2026 (TD-NEW-016): Gemini HTTP node has retryOnFail=true, maxTries=3, timeout=10000. Updated 2026-05-18 (BUG-02): "Gemini General Response" jsonBody converted from raw-string interpolation (`={"contents":[{"parts":[{"text":"{{ $json.geminiPrompt }}"}]}],...}`) to object-interpolation (`={{ {contents:[{parts:[{text:$json.geminiPrompt}]}],generationConfig:{...} } }}`) so n8n JSON-encodes natively — fixes "JSON parameter needs to be valid JSON" failures on prompts containing quotes/newlines/braces. Updated 2026-05-18 (BUG-03): "Prepare Gemini Response Prompt" jsCode renamed `${d.messageText}` → `${d.messageContent}` — WF-43 callers pass `messageContent`, so the prior reference produced literal "User: undefined" in the Gemini prompt. Updated 2026-05-18 (BUG-04 A): "Gemini General Response" HTTP node switched from generic httpQueryAuth (credential ZkLShpFmp8Mi1gZl — broken) to predefined nodeCredentialType=googlePalmApi + credential zT7defyXYEvxWwZm. Same fix as WF-25 Classify Intent. |
| WF-44 | Feedback Recorder | 🟢 Active | 🟡 P3 | n8n: "WF-44 Feedback Recorder" (Du2CJ3OTohRFZYoA) — was "WF-26 Feedback Recorder" | Captures user feedback text. Runs WF-25 intent classifier first: rebook_intent → WF-45 Rebook; stop_intent → WF-47 Unsubscribe (WF-44-STOP 2026-05-16); all other intents → saves feedback to DB + sends ack via WF-50. Updated May 2026 (TD-032). |
| WF-45 | Rebook Handler | 🟢 Active | 🟠 P2 | n8n: "WF-45 Rebook Handler" (MUG7rPgSHc7UtAE9) | Handles REBOOK keyword or rebook_intent. Loads user record, sets status=payment_pending, sends interactive "Payment Completed" button with standard ₹500 UPI instructions (+91-9653240263, Chinmay Mujumdar). Updated May 2026 (TD-011): standard UPI text + interactive button. **Reuses existing consult-{phone} Slack channel** — reads slack_channel_id from DB, does NOT call WF-52 (TC-0305 design decision 2026-05-16). Updated 2026-05-18 (ICF-001): added "Prepare WF-50 Payload (Rebook Payment)" Code node between Set status=payment_pending and Send Payment Instructions — passthrough was forwarding the Postgres UPDATE row instead of the WF-50 input contract. Code node now emits interactive button payload (Welcome back ${name} + UPI instructions). |
| WF-46 | User Blocker | 🟢 Active | 🟠 P2 | n8n: "WF-46 User Blocker" (UV62An60fzflU0uD) — was "WF-43 User Blocker" | Admin issues BLOCK. Updates status=blocked. Sends admin confirmation via WF-51. Also called by WF-25 on malicious_abusive/inappropriate intent. Updated 2026-05-17 (FU-1): DR-10 fix — removed channel-archive nodes (channels are intentionally preserved for REBOOK reuse after UNBLOCK); admin confirmation refactored from direct Slack post to WF-51 call; channelId sourced from caller input with `slack_channel_id` fallback for WF-25 path. Updated 2026-05-18 (ICF-013): added "Prepare WF-51 Payload (Notify Admin Blocked)" Set node between Update User to Blocked Status and Call WF-51 Notify Admin — passthrough was forwarding the postgres row instead of {channelId, messageText}. Set node now realises the caller-channelId-or-slack_channel_id fallback intent. |
| WF-47 | Unsubscribe Handler | 🟢 Active | 🔴 P1 | n8n: "WF-47 Unsubscribe Handler" (2U7mxHMyqA41ROKX) | Handles user-initiated STOP (regulatory opt-out). Called from WF-20. If consultation_active: sends hold message, no state change. All other states: sets status=opted_out, logs to admin_actions, sends opt-out confirmation to user via WF-50, archives consult-{phone} Slack channel. Updated May 2026 (TD-019). Updated 2026-05-18 (ICF-002): added "Prepare WF-50 Payload (Hold Message)" Code node on Check If Consultation Active true-branch — passthrough was forwarding the IF output instead of the WF-50 input contract. Hold message explains STOP received but consultation will continue. Updated 2026-05-18 (ICF-003): added "Prepare WF-50 Payload (Opt-out Confirmation)" Code node between Log to admin_actions and Send Opt-out Confirmation — passthrough was forwarding the Postgres INSERT row. Confirmation message tells user they have been opted out and how to re-engage. Both Code nodes use trigger.phoneNumber (no Load User node exists in WF-47). |

---

## WF-2x additions

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-25 | Intent Classifier | 🟢 Active | 🟠 P2 | n8n: "WF-25 Intent Classifier" (eTV1lUcYrXBg2q2T) | Shared Gemini 2.5 Flash Lite intent classifier (CLAUDE.md says 2.0; WF-25 currently calls 2.5 — see followups). Input: phoneNumber, userId, messageContent, userStatus (or nested user.status), userStage. Output: intentResult (wants_consultation / general_enquiry / rebook_intent / feedback_intent / stop_intent / garbage / malicious_abusive / inappropriate). Gemini error → falls back to general_enquiry (TD-029 May 2026); when userStatus=consultation_closed → falls back to feedback_intent (BUG-04 2026-05-18). Fixed May 2026 (TD-NEW-003): stop_intent added to Gemini prompt, VALID whitelist, and Route by Intent Switch. Called by WF-23, WF-30, WF-31, WF-43, WF-44. Updated 2026-05-18 (ICF-004): added "Prepare WF-51 Payload (Garbage Admin)" Code node between Send Garbage Warning and Notify Admin of Garbage — passthrough was forwarding the WF-50 status object instead of {channelId, messageText}. channelId hardcoded to chinmay-admin-commands (C0A5B0ZE81E); messageText includes phone/userId/status + first 280 chars of the offending message. Updated 2026-05-18 (BUG-04 A): Classify Intent HTTP node switched from generic httpQueryAuth credential (ZkLShpFmp8Mi1gZl — had param-name field misconfigured as literal "Gemini n8n Key" instead of "key", causing every Gemini call to return 400) to predefined nodeCredentialType=googlePalmApi + credential zT7defyXYEvxWwZm ("Google Gemini(PaLM) Api account"). Same canonical setup as user's other project (WF-42 Deal Evaluator). Updated 2026-05-18 (BUG-04 B): Prepare Intent Request jsCode now reads userStatus from `input.userStatus || input.user?.status || 'unknown'` and emits it as a top-level field — previously all callers passed nested user.status while destructure expected flat. Updated 2026-05-18 (BUG-04 C): Parse Intent + Handle Gemini Error now route consultation_closed+uncertain → feedback_intent instead of general_enquiry (defensive fallback for Gemini outages and ambiguous classifications). |

---

## WF-5x — Messaging Utilities

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-50 | Send WhatsApp | 🟢 Active | 🔴 P1 | n8n: "WF-50 Send WhatsApp" (BUVun38WEKb12zg9) | Sends outbound WhatsApp message via Meta Cloud API. Accepts phoneNumber + message body. Null/empty body guard added (TD-033 May 2026) — exits gracefully if text message body is empty, prevents Meta API 400. Calls WF-60 to log. Used by all workflows that send to user. Hardened May 2026 (TD-NEW-016): all 3 Meta API send nodes have retryOnFail=true, maxTries=3, timeout=10000. |
| WF-51 | Send Slack Message | 🟢 Active | 🔴 P1 | n8n: "WF-51 Send Slack Message" (wlZRK0YxnhP0b2RL) | Posts a message to a specified Slack channel. Accepts channelId + messageText. Credentials: Slack - Chinmay Astro. Activated 12 Apr 2026. Required by WF-40 and WF-12. |
| WF-52 | Slack Channel Manager | 🟢 Active | 🟠 P2 | n8n: "WF-52 Slack Channel Manager" (IO5BZLUxuVmjzk5I) | **Idempotent:** checks for existing `consult-{phone}` channel before creating — returns existing channel if found. Returns `{ channelId, channelName, isNew }`. Safe to call multiple times. **Inputs:** `phoneNumber` (string), `userName` (string); optional: `userId` (integer). Called only by WF-22 (at form submission — TD-007/TD-008 May 2026). WF-32 and WF-42 do NOT call WF-52. |

---

## WF-6x — Data & Logging

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-60 | Message Logger | 🟢 Active | 🔴 P1 | Active as "WF-60 Message Logger" (6H75p935FpBVBQtV) | Logs all inbound and outbound messages. All nodes re-enabled (TD-004 May 2026). Main path: Trigger → Extract Message Data → Log to Messages Table → Done. Schema prefix fixed (TD-001). Called by WF-50. Updated 2026-05-18 (BUG-01 sweep): "Log to Messages Table" queryReplacement converted to JS-array form — `$json.content` is user-/admin-typed message text that can contain commas. Existing `"\""+content+"\""` quote-wrapping preserved as-is (pre-existing behavior; separate fix candidate if redundant). |

---

## WF-7x — Background Jobs (Post Go-Live)

| WF | Name | Registry Status | Priority | Notes |
|---|---|---|---|---|
| WF-70 | Health Check Monitor | 🔵 Build Fresh | ⚪ P4 | Hourly. Pings WhatsApp API + DB. Slack alert if unhealthy. Post go-live. |
| WF-71 | Payment Reminder | 🔵 Build Fresh | ⚪ P4 | Daily. payment_pending users >24hrs → WhatsApp reminder template. Needs Meta template approval. Post go-live. |
| WF-72 | Inactive User Scanner | 🔵 Build Fresh | ⚪ P4 | Daily. consultation_closed with no activity >90 days → mark inactive. Post go-live. |
| WF-73 | Stale Form Cleanup | 🔵 Build Fresh | ⚪ P4 | Daily. Delete records for users who never submitted form after 7 days. Post go-live. Note: since DB write only happens on form submission, this may clean up any partial records. |
| WF-74 | Data Retention Cleanup | 🔵 Build Fresh | ⚪ P4 | Monthly. Anonymise/delete records beyond retention period. Post go-live. |

---

## 🔨 WORK IN PROGRESS — Next Session Action List

**Technical-review sprint completed 2026-05-16** (commits `a741d0b`, `bf21bc2`):
- ✅ F-01 — `users.stage` column added (fixes WF-44, WF-45 runtime errors)
- ✅ F-02 — `admin_actions` column names fixed (WF-11, WF-47): `action`→`action_type`, `reason`→`notes`
- ✅ F-03 — executeWorkflow nodes downgraded v2→v1 (WF-20, WF-45, WF-12)
- ✅ F-04 — WF-47 workflowId resource-locator → string (UI re-select)
- ✅ F-05 — Postgres `=` prefix on expression queries (WF-45, WF-11, WF-40, WF-46, WF-47)
- ✅ F-06 — WF-43 Gemini `jsonBody` bracket balance
- ✅ F-07 — Slack node operations verified via execution history (WF-11, WF-33, WF-34, WF-41, WF-42, WF-46, WF-51)
- ✅ F-09 — `onError: continueRegularOutput` on webhook nodes (WF-00, WF-10)

**Post-sprint AOD audit 2026-05-16:**
- ✅ F-13 — `alwaysOutputData: true` added to two Postgres SELECT→IF guards: WF-11 `Lookup Blocked User`, WF-10 `Load User Status`. Audit of all 28 workflows showed no other gaps.

**Deferred to next sessions:**
- F-08 — admin command smoke test (APPROVE/REJECT/CLOSE/BLOCK) — user-driven interactive
- F-10/F-11/F-12 — post-MVP (UI cosmetic, n8n upgrade, WF-60 message-logging fix)

---

**n8n housekeeping completed 12 Apr 2026:**
- ✅ WF-30 (old New User Onboarding) deactivated — backed up as yIZwO3CZk6bOBAXl
- ✅ WF-25 (Post-Consultation Options) deleted — superseded, backed up as fdlIpl67amL2Ho6U
- ✅ All workflows renamed to match registry WF-XX naming
- ✅ Placeholders created for WF-12, WF-20, WF-23, WF-30 (new), WF-45
- ✅ WF-01 + WF-02 updated with pendingUser routing fix (Apr 2026)
- ✅ WF-21 + WF-22 tested and working end-to-end

**All workflows now exist in n8n. Pick up any workflow below and either implement (placeholders) or fix (rebuild required).**

---

### P1 — Critical path (implement/fix these first)

| Priority | WF | Name | Status | What to do |
|---|---|---|---|---|
| ~~1~~ | ~~WF-32~~ | ~~Payment Confirmation Receiver~~ | ✅ Done | Fixed session 2. |
| ~~2~~ | ~~WF-51~~ | ~~Send Slack Message~~ | ✅ Done | Built + activated session 2. |
| ~~3~~ | ~~WF-40~~ | ~~User → Admin Relay~~ | ✅ Done | Implemented + activated session 3. |
| ~~4~~ | ~~WF-41~~ | ~~Admin → User Relay~~ | ✅ Done | Fixed + activated session 3. |
| ~~5~~ | ~~WF-12~~ | ~~Admin → WhatsApp Relay~~ | ✅ Done | Built + activated session 4. |
| ~~6~~ | ~~WF-47~~ | ~~Unsubscribe Handler~~ | ✅ Done | Built + activated session 4 (ID: 2U7mxHMyqA41ROKX). |
| ~~7~~ | ~~WF-20~~ | ~~Keyword Handler (STOP fix)~~ | ✅ Done | STOP branch now calls WF-47. Fixed session 5. |
| ~~8~~ | ~~WF-11~~ | ~~Command Parser (UNBLOCK)~~ | ✅ Done | UNBLOCK branch added session 5. Parse Command updated for UNBLOCK parsing + targetPhone field. |
| ~~9~~ | ~~WF-01~~ | ~~Message Router (opted_out routing)~~ | ✅ Done | opted_out routing added session 5. Lookup extended to include opted_out; Layer 3 distinguishes REJECTED/OPTED_OUT/PASSED; new Opted Out? IF node routes to WF-21. |
| ~~10~~ | ~~WF-25~~ | ~~Intent Classifier~~ | ✅ Done | Built + activated session 6. ID: eTV1lUcYrXBg2q2T. Gemini 2.0 Flash Lite, API key in URL param. |

### P2 — Core (needed for complete journey)

| Priority | WF | Name | Status | What to do |
|---|---|---|---|---|
| ~~11~~ | ~~WF-22~~ | ~~Form Response Handler~~ | ✅ Done | Payment instructions updated to correct UPI wording. Session 5. |
| ~~12~~ | ~~WF-45~~ | ~~Rebook Handler~~ | ✅ Done | Payment message updated to correct UPI wording. Session 5. |
| ~~13~~ | ~~WF-43~~ | ~~Post-Consultation Handler~~ | ✅ Done | Rebuilt session 6. WF-25 → rebook→WF-45, feedback→WF-44, general→Gemini. Active. |

### P3 — Supporting (degraded but functional without)

| Priority | WF | Name | Status | What to do |
|---|---|---|---|---|
| ~~14~~ | ~~WF-30~~ | ~~Payment Pending Intent Filter~~ | ✅ Done | Implemented session 6. WF-25 → contextual reply + UPI reminder. Active. |
| ~~15~~ | ~~WF-31~~ | ~~Payment Submitted Handler~~ | ✅ Done | Fixed session 6. WF-25 → "under review" ack. Active. |
| ~~16~~ | ~~WF-23~~ | ~~Pre-Form Intent Filter~~ | ✅ Done | Implemented session 6. WF-25 → text reply + re-send flow form. Active. |
| ~~17~~ | ~~WF-44~~ | ~~Feedback Recorder~~ | ✅ Done | Rebuilt session 6. Saves feedback to DB, clears stage, sends ack. Active. |

### Final Activation Sequence (after all above done)

Activate in this order:
1. ~~WF-51 → WF-40 → WF-41 → WF-12~~ (done)
2. ~~WF-32~~ (done)
3. ~~DB migration~~ — opted_out added to users.status (done session 5 per Prasad)
4. ~~WF-47~~ (Unsubscribe Handler) — done, active (ID: 2U7mxHMyqA41ROKX)
5. ~~WF-20~~ — STOP fix done, active
6. ~~WF-11~~ — UNBLOCK done, active
7. ~~WF-01~~ — opted_out routing done, active
8. ~~WF-22 + WF-45~~ — payment message fix done
9. ~~WF-25~~ (Intent Classifier) — built + activated session 6 (ID: eTV1lUcYrXBg2q2T)
10. ~~WF-43, WF-44~~ — rebuilt + activated session 6
11. ~~WF-30, WF-31, WF-23~~ — implemented + activated session 6
12. **End-to-end smoke test** — 🔄 IN PROGRESS (session 7). Steps 1–4 ✅. Blocked at step 5 by WF-02 bug (now fixed). Resume from step 5.

---

## n8n Inventory — Full Mapping (Updated 12 Apr 2026)

All 25 workflows now present in Mumbai VPS n8n (20 existing + 5 placeholders created Apr 2026). Names match registry.

| n8n Name | n8n ID | Active? | Registry WF | Status |
|---|---|---|---|---|
| WF-00 Webhook Receiver | JQu1MkK5vgtUCeNO | 🟢 Yes | WF-00 | ✅ No changes needed |
| WF-01 Message Router | hYGNM97sXvdo1WmI | 🟢 Yes | WF-01 | ✅ Updated session 5: opted_out routing added (Lookup extended, Layer 3 OPTED_OUT path, new Opted Out? IF → Route Opted-Out to WF-21). |
| WF-02 User State Router | PubCsNTOspF3xqXZ | 🟢 Yes | WF-02 | ✅ Rebuilt session 7 (24 Apr 2026). All stale/disabled nodes replaced. 8 routes: NEW_USER, PRE_FORM_TEXT, DETAILS_FORM, PAYMENT_CONFIRM, PAYMENT_PENDING_TEXT, PAYMENT_SUBMITTED_TEXT, RELAY, POST_CONSULT_TEXT. Detect Route uses messageType + rawMessage.interactive.type to distinguish button vs flow submissions. |
| WF-10 Slack Admin Handler | wMh0oBRtJbvhLgOf | 🟢 Yes | WF-10 | ✅ No changes needed |
| WF-11 Command Parser | GoTYo0GS2y8qjjkw | 🟢 Yes | WF-11 | ✅ UNBLOCK branch added session 5. Parse Command handles UNBLOCK <phone> → commandType=UNBLOCK_USER + targetPhone. |
| WF-12 Admin -> WhatsApp Relay | RjwHs9Dx5cK8Q5wD | 🟢 Yes | WF-12 | ✅ Built + activated session 4 |
| WF-20 Keyword Handler | LgIDj1v4ZbCPlX25 | 🟢 Yes | WF-20 | ✅ Fixed session 5 — STOP branch now calls WF-47. Updated May 2026 (TD-027): HELP response is now status-aware — ternary on userStatus for payment_pending/submitted/consultation_active/consultation_closed; generic fallback for new/unknown. |
| WF-25 Intent Classifier | eTV1lUcYrXBg2q2T | 🟢 Yes | WF-25 | ✅ Built + activated session 6. Gemini 2.0 Flash Lite, temp=0. Intents: wants_consultation, general_enquiry, rebook_intent, feedback_intent, garbage, malicious_abusive, inappropriate. garbage→warn+Slack notify. malicious/inappropriate→warn+auto-block via WF-46. API key in URL param. |
| WF-21 New User Welcome + Form | zM8WbxSdt9nXRoLZ | 🟢 Yes | WF-21 | ✅ Tested + working Apr 2026 |
| WF-22 Form Response Handler | dr8QM0m92Ml8MvIh | 🟢 Yes | WF-22 | ✅ Payment message updated to correct UPI wording session 5 (+91-9653240263). |
| WF-23 Pre-Form Intent Filter | VpCER0Vqq3NYJGpI | 🟢 Yes | WF-23 | ✅ Implemented + activated session 6. Calls WF-25 → sends contextual text reply + re-sends WhatsApp Flow form (flowId: 1408011897720771). garbage/malicious/inappropriate handled by WF-25. |
| WF-30 Payment Pending Intent Filter | gGJBY5fJha0Let8I | 🟢 Yes | WF-30 | ✅ Implemented + activated session 6. Calls WF-25 → sends contextual payment reminder for all pass-through intents. Re-sends UPI details +91-9653240263. |
| WF-30 New User Onboarding (WRONG - DEACTIVATED) | z6as85o3b1zK22eF | ⚫ No | ❌ | ⚫ Deactivated Apr 2026 — wrong design |
| WF-31 Payment Submitted Handler | HB8nXudAtk9iXz7C | 🟢 Yes | WF-31 | ✅ Fixed + active session 6. Calls WF-25 → sends "under review" acknowledgement for pass-through intents. No state change. |
| WF-32 Payment Confirmation Receiver | emUOLWVZiNVxcOe3 | 🟢 Yes | WF-32 | ✅ Fixed 12 Apr 2026 — calls WF-52 → WF-51 |
| WF-33 Payment Approval Processor | NcHZedq9ycnAQ9SW | 🟢 Yes | WF-33 | ✅ Verify correct |
| WF-34 Payment Rejection Processor | se82n3MUQ9xE5aEr | 🟢 Yes | WF-34 | ✅ Verify correct |
| WF-40 User -> Admin Relay | du32QBZbSQOjfESe | 🟢 Yes | WF-40 | ✅ Implemented + activated session 3 |
| WF-41 Admin -> User Relay | 6PzJRZsF7k2d9hV7 | 🟢 Yes | WF-41 | ✅ Fixed + activated session 3 (creds + WF-50 ID corrected) |
| WF-42 Consultation Closer | fx70vqyJtRdF2DgR | 🟢 Yes | WF-42 | ✅ Verify correct |
| WF-43 Post-Consultation Handler | 3va0M06kijgyLejf | 🟢 Yes | WF-43 | ✅ Rebuilt + activated session 6. Calls WF-25 → rebook_intent→WF-45, feedback_intent→WF-44, general/wants_consultation→Gemini response via WF-50. |
| WF-44 Feedback Recorder | Du2CJ3OTohRFZYoA | 🟢 Yes | WF-44 | ✅ Rebuilt + activated session 6. Saves messageText to users.feedback + clears stage=NULL. Sends ack via WF-50. |
| WF-45 Rebook Handler | MUG7rPgSHc7UtAE9 | 🟢 Yes | WF-45 | ✅ Payment message updated to correct UPI wording session 5. |
| WF-47 Unsubscribe Handler | 2U7mxHMyqA41ROKX | 🟢 Yes | WF-47 | ✅ Built + activated session 4/5. consultation_active → hold message. Others → status=opted_out + log + opt-out confirmation. |
| WF-46 User Blocker | UV62An60fzflU0uD | 🟢 Yes | WF-46 | ✅ Verify correct |
| WF-50 Send WhatsApp | BUVun38WEKb12zg9 | 🟢 Yes | WF-50 | ✅ No changes needed |
| WF-51 Send Slack Message | wlZRK0YxnhP0b2RL | 🟢 Yes | WF-51 | ✅ Built + activated 12 Apr 2026 |
| WF-52 Slack Channel Manager | IO5BZLUxuVmjzk5I | 🟢 Yes | WF-52 | ✅ No changes needed |
| WF-60 Message Logger | 6H75p935FpBVBQtV | 🟢 Yes | WF-60 | ✅ No changes needed |

---

## Build Summary (as of 15 Apr 2026 — session 6)

| Category | Total | 🟢 Done | 🔨 Fix/Verify | 🔵 Build Fresh | ⚪ Post Go-Live |
|---|---|---|---|---|---|
| WF-0x Infrastructure | 3 | 3 | 0 | 0 | 0 |
| WF-1x Admin | 3 | 3 | 0 | 0 | 0 |
| WF-2x Onboarding | 4 | 4 | 0 | 0 | 0 |
| WF-3x Payment | 5 | 5 | 0 | 0 | 0 |
| WF-4x Consultation | 8 | 8 | 0 | 0 | 0 |
| WF-5x Messaging | 3 | 3 | 0 | 0 | 0 |
| WF-6x Data | 1 | 1 | 0 | 0 | 0 |
| WF-7x Background | 5 | 0 | 0 | 0 | 5 |
| **Total** | **32** | **27** | **0** | **0** | **5** |

**🎯 All pre-go-live workflows are active. Next: end-to-end smoke test (session 7).**
