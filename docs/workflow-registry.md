# Chinmay Astro — Workflow Registry
**Version:** 2.7 | **Last Updated:** 24 Apr 2026 (session 7)
**Source:** user_journey_map.html v2.1 + live n8n audit (Mumbai VPS, Apr 2026) + design clarifications sessions 3–4

---

## ⚠️ SESSION 7 CHANGES (24 Apr 2026)

1. **CF Tunnel + URL changed:** n8n is now at `https://chinmayastro-n8n.friendlydealfinder.com.au` (NOT `astro.chinmaymujumdar.com`). Tunnel configured under friendlydealfinder.com.au Cloudflare account. See INFRA.md for full explanation.
2. **n8n API key in memory** still valid — same instance, same key.
3. **WF-02 fully rebuilt:** All 6 disabled/stale call nodes replaced with correct WF IDs. Detect Route logic fixed for proper `messageType`/`interactive.type` handling. "Payment Completed" button now correctly routes to WF-32.
4. **Smoke test status:** Steps 1–4 confirmed working. Step 5 ("Payment Completed" → Slack channel) blocked by WF-02 issue, now fixed. Resume smoke test from step 5.
5. **Chrome MCP access:** Use `chinmayastro-n8n.friendlydealfinder.com.au` (new URL). API key in memory unchanged.

---

## ⚠️ CRITICAL CONTEXT FOR NEXT SESSION

Before touching any workflow, read this entire file. Key decisions made in Apr 2026 sessions:

1. **First message design (CHANGED):** When a new user messages for the first time, we send ONE combined free-form message: policy URL + WhatsApp Flow form. No YES/NO consent step. Submitting the form = implicit consent = first DB write. The old two-step approach (Welcome → wait for YES → send form) is **wrong and must not be used**.

2. **DB write timing:** The FIRST DB write happens only when the user submits the WhatsApp Flow form (handled by WF-22). No DB record is created earlier.

3. **WF-30 old "New User Onboarding" — DEACTIVATED (12 Apr 2026):** Created DB record before consent — wrong design. Now renamed to "WF-30 New User Onboarding (WRONG - DEACTIVATED)" in n8n and deactivated. WF-21 handles new users correctly.

4. **n8n names now match registry names (12 Apr 2026):** All workflows renamed to match registry WF-XX naming. Old name ≠ registry name issue is resolved. See n8n Inventory section for current IDs.

5. **OutboundMessage type:** First-message response is a **free-form message** (not a Meta template) — valid because user initiated the conversation (24hr window is open). The WhatsApp Flow form is sent as an interactive message within that same response.

6. **Intent filters:** Every state where user can send free-form text must have a Gemini intent filter via WF-25. No state should blindly process user text without classification first.

7. **WF-51 (Send Slack Message)** — built + activated (session 2). WF-40 now calls it.

8. **WF-40 (User→Admin Relay)** — implemented + activated (session 3). consultation_active WhatsApp → DB lookup for slackChannelId → WF-51.

9. **WF-41 (Admin→User Relay)** — fixed + activated (session 3). Added postgres + Slack credentials, corrected WF-50 ID. WF-10 now calls WF-41 (was pointing to old WF-35 ID).

10. **WF-02 routing** — fixed (session 3). RELAY branch now calls WF-40 (was old WF-35).

11. **STOP = opted_out (NOT blocked) — session 4:** User-initiated STOP keyword sets `status = opted_out`. This is DISTINCT from `blocked` (admin/system action). WF-01 must handle opted_out differently from blocked. Requires DB migration: new `opted_out` status value. WF-47 (Unsubscribe Handler) is the new workflow that processes STOP. MVP Day 1 requirement for Meta compliance.

12. **WF-20 STOP branch — WRONG (session 4):** Current WF-20 built in session 4 placeholder has incorrect STOP handling (sends confirmation but no DB update). Must be fixed to call WF-47 instead.

13. **Payment message wording (session 4):** "Please send ₹500 via GPay / PhonePe / any UPI app to: +91-9653240263 (Chinmay Mujumdar). Once done, tap the button below." — applies to BOTH initial booking (WF-22) and rebook (WF-45). WF-22 and WF-45 must be updated.

14. **Intent Classifier = WF-25 (session 4):** Shared sub-workflow, modelled on FDF WF-05. Gemini 2.5 Flash Lite, temp=0. Intents: wants_consultation, general_enquiry, rebook_intent, feedback_intent, garbage, malicious_abusive, inappropriate. garbage → warn + Slack notify. malicious_abusive/inappropriate → warn + auto-BLOCK via WF-46. WF-25 does NOT yet exist in n8n — must be created.

15. **UNBLOCK admin command (session 4):** New command `UNBLOCK <phone>` to be added to WF-11 (Command Parser). Sets blocked user → consultation_closed. Only works on `blocked` users — not `opted_out` (those re-engage themselves).

16. **WF-12 / WF-20 / WF-45 — built and activated (session 4):** All three pushed to n8n and activated as placeholders-turned-implementations. WF-20 STOP branch still has partial logic — needs WF-47 call fix. WF-45 payment message needs UPI wording update.

---

## ⚠️ DB SCHEMA CHANGE REQUIRED

The `users` table `status` column must be updated to allow a new value: **`opted_out`**.

```sql
-- If using a PostgreSQL ENUM for status, add the new value:
ALTER TYPE user_status ADD VALUE 'opted_out';
-- If using a VARCHAR CHECK constraint:
ALTER TABLE users DROP CONSTRAINT users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('new','payment_pending','payment_submitted','consultation_active','consultation_closed','blocked','opted_out'));
```

WF-01 routing must also be updated to handle opted_out: route to WF-21 (brand new welcome flow) — same as null/no-record. Do NOT silently drop like blocked.

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
| WF-00 | Webhook Receiver | 🟢 Active | 🔴 P1 | n8n: "WF-00 Webhook Receiver" (JQu1MkK5vgtUCeNO) | Entry point for all inbound WhatsApp messages. Meta webhook verification, deduplication, filters non-text (images/audio/reactions → ignore). Routes valid text messages to WF-01. |
| WF-01 | Message Router | 🟢 Active | 🔴 P1 | n8n: "WF-01 Message Router" (hYGNM97sXvdo1WmI) | Security filters: country check, blocked-user check. Loads user + pendingUser records from DB. Routes: no record→WF-21, pendingUser→WF-22, existing user→WF-02. Updated Apr 2026 to pass pendingUser to WF-02. |
| WF-02 | User State Router | 🟢 Active | 🔴 P1 | n8n: "WF-02 User State Router" (PubCsNTOspF3xqXZ) | Routes by messageType + user status. **Rebuilt session 7 (24 Apr 2026):** all 6 disabled/stale call nodes replaced. Detect Route now inspects `messageType` ('text'/'interactive') + `rawMessage.interactive.type` ('button_reply'→PAYMENT_CONFIRM, 'nfm_reply'→DETAILS_FORM). Routes: NEW_USER→WF-21, PRE_FORM_TEXT→WF-23, DETAILS_FORM→WF-22, PAYMENT_CONFIRM→WF-32, PAYMENT_PENDING_TEXT→WF-30, PAYMENT_SUBMITTED_TEXT→WF-31, RELAY→WF-40, POST_CONSULT_TEXT→WF-43. |

---

## WF-1x — Admin (Slack-Side)

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-10 | Slack Admin Handler | 🟢 Active | 🔴 P1 | n8n: "WF-10 Slack Admin Handler" (wMh0oBRtJbvhLgOf) | Entry point for Slack events. Filters bot messages to prevent loops. Routes admin commands to WF-11. |
| WF-11 | Command Parser | 🔨 Rebuild Required | 🔴 P1 | n8n: "WF-11 Command Parser" (GoTYo0GS2y8qjjkw) | Parses APPROVE CHAT CONSULT→WF-33, REJECT→WF-34, CLOSE→WF-42, BLOCK→WF-46. **Needs new UNBLOCK branch → set status=consultation_closed for blocked user.** Returns error if unrecognised. |
| WF-12 | Admin → WhatsApp Relay | 🟢 Active | 🟠 P2 | n8n: "WF-12 Admin -> WhatsApp Relay" (RjwHs9Dx5cK8Q5wD) | Relays plain-text messages typed by admin in user's Slack channel → WhatsApp during consultation_active. Distinct from command handling. Calls WF-50. Built + activated session 4. |

---

## WF-2x — Onboarding

> **Design principle:** No DB record is created until the user submits the WhatsApp Flow form. The very first message triggers a single combined response: policy URL in message body + WhatsApp Flow form. Filling and submitting = implicit consent.

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-21 | New User Welcome + Form | 🟢 Active | 🔴 P1 | n8n: "WF-21 New User Welcome + Form" (zM8WbxSdt9nXRoLZ) | Triggered by WF-02 when no DB record + no pendingUser exists. No DB write. Sends ONE free-form message: policy URL + service description + ₹500 fee + WhatsApp Flow form. Flow ID: 1408011897720771, flowCta: "Fill Details". Tested Apr 2026 — working. Activated Apr 2026. |
| WF-22 | Form Response Handler | 🟢 Active | 🔴 P1 | n8n: "WF-22 Form Response Handler" (dr8QM0m92Ml8MvIh) | Handles WhatsApp Flow encrypted callback. Decrypts + validates payload. **First DB write here:** creates user record with status=payment_pending, stores name/DOB/TOB/birth_place. **Immediately calls WF-52 to create `consult-{phone}` Slack channel and saves slack_channel_id to DB.** Sends GPay payment instructions + "Payment Completed" interactive button. Updated May 2026: channel creation moved here from WF-32. |
| WF-23 | Pre-Form Intent Filter | 🔵 Placeholder | 🟡 P3 | n8n: "WF-23 Pre-Form Intent Filter" (VpCER0Vqq3NYJGpI) | Handles free-form messages from users with pendingUser record (received form but haven't submitted yet). Runs Gemini intent filter → contextual reply + re-sends policy + form. |

---

## WF-3x — Payment

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-30 | Payment Pending Intent Filter | 🔵 Placeholder | 🟡 P3 | n8n: "WF-30 Payment Pending Intent Filter" (gGJBY5fJha0Let8I) | Handles free-form messages from payment_pending users. Gemini intent filter → general enquiry: answer + re-prompt payment; wants_consultation: resend GPay + button; HELP/STOP intercepted upstream. No state change. |
| WF-31 | Payment Submitted Handler | 🔨 Rebuild Required | 🟡 P3 | n8n: "WF-31 Payment Submitted Handler" (HB8nXudAtk9iXz7C) — was "WF-27 Payment Review Handler" | Handles free-form messages from payment_submitted users while awaiting admin approval. Verify existing logic: should run Gemini intent filter → acknowledge under review, give wait time estimate. No state change. |
| WF-32 | Payment Confirmation Receiver | 🟢 Active | 🔴 P1 | n8n: "WF-32 Payment Confirmation Receiver" (emUOLWVZiNVxcOe3) — was "WF-24 Payment Confirmation Handler" | User taps "Payment Completed" button. Updates status=payment_submitted. Loads existing slack_channel_id from DB (channel was already created in WF-22). Posts payment notification to user's consult channel. Admin reads notification and types `APPROVE PAYMENT <phone>` in that same channel. Updated May 2026: WF-52 call removed — channel is pre-created at form submission. |
| WF-33 | Payment Approval Processor | 🟢 Active | 🔴 P1 | n8n: "WF-33 Payment Approval Processor" (NcHZedq9ycnAQ9SW) — was "WF-40 Payment Approval Processor" | Admin issues APPROVE CHAT CONSULT <phone> in Slack. Updates status=consultation_active. Notifies user on WhatsApp that consultation has begun. |
| WF-34 | Payment Rejection Processor | 🟢 Active | 🔴 P1 | n8n: "WF-34 Payment Rejection Processor" (se82n3MUQ9xE5aEr) — was "WF-41 Payment Rejection Processor" | Admin issues REJECT in Slack. Updates status=payment_pending. Sends rejection reason to user with retry instructions. |

---

## WF-4x — Consultation

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-40 | User → Admin Relay | 🟢 Active | 🔴 P1 | n8n: "WF-40 User -> Admin Relay" (du32QBZbSQOjfESe) | Handles inbound WhatsApp messages during consultation_active. Loads user from DB (gets slackChannelId + name), formats message, calls WF-51. Implemented + activated session 3. |
| WF-41 | Admin → User Relay | 🟢 Active | 🔴 P1 | n8n: "WF-41 Admin -> User Relay" (6PzJRZsF7k2d9hV7) | Admin types in user's Slack channel → WF-50 → WhatsApp. Fixed session 3: added postgres + Slack credentials, corrected WF-50 ID (BUVun38WEKb12zg9). WF-10 now routes here. |
| WF-42 | Consultation Closer | 🟢 Active | 🔴 P1 | n8n: "WF-42 Consultation Closer" (fx70vqyJtRdF2DgR) | Admin issues CLOSE in consult channel. Updates status=consultation_closed. Sends closing message + feedback request to user. Archives Slack channel via WF-52. |
| WF-43 | Post-Consultation Handler | 🔨 Rebuild Required | 🟠 P2 | n8n: "WF-43 Post-Consultation Handler" (3va0M06kijgyLejf) — was "WF-28 Post-Consultation Text Handler" | Handles free-form messages from consultation_closed users. Gemini intent filter → rebook_intent: route to WF-45; general_enquiry: Gemini response; feedback_intent: route to WF-44. Verify intent filter is implemented before activating. |
| WF-44 | Feedback Recorder | 🔨 Rebuild Required | 🟡 P3 | n8n: "WF-44 Feedback Recorder" (Du2CJ3OTohRFZYoA) — was "WF-26 Feedback Recorder" | Captures user feedback text. Records to DB feedback field. Sends acknowledgement. Clears awaiting_feedback stage flag. Verify before activating. |
| WF-45 | Rebook Handler | 🔵 Placeholder | 🟠 P2 | n8n: "WF-45 Rebook Handler" (MUG7rPgSHc7UtAE9) | Handles REBOOK keyword or rebook_intent. Birth details already on file — skip re-onboarding. Send GPay payment instructions + "Payment Completed" button directly. Update status=payment_pending. |
| WF-46 | User Blocker | 🟢 Active | 🟠 P2 | n8n: "WF-46 User Blocker" (UV62An60fzflU0uD) — was "WF-43 User Blocker" | Admin issues BLOCK. Updates status=blocked. Silent — no notification to user. Logs reason. Also called by WF-25 on malicious_abusive/inappropriate intent. |
| WF-47 | Unsubscribe Handler | 🟢 Active | 🔴 P1 | n8n: "WF-47 Unsubscribe Handler" (2U7mxHMyqA41ROKX) | Handles user-initiated STOP (regulatory opt-out). Called from WF-20. If consultation_active: sends hold message, no state change. All other states: sets status=opted_out, logs to admin_actions, sends opt-out confirmation to user via WF-50. Built + activated sessions 4/5. |

---

## WF-2x additions

> WF-25 is a new shared sub-workflow for intent classification. Does NOT yet exist in n8n.

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-25 | Intent Classifier | 🔵 Build Fresh | 🟠 P2 | n8n: not yet created — **NEXT PRIORITY** | Shared Gemini classification sub-workflow. Modelled on FDF WF-05. Input: phoneNumber, userId, messageText, userStatus, userStage. Output: intentResult (wants_consultation / general_enquiry / rebook_intent / feedback_intent / garbage / malicious_abusive / inappropriate). garbage → warn user + Slack notify. malicious_abusive/inappropriate → warn user + auto-BLOCK via WF-46. Called by WF-23, WF-30, WF-31, WF-43. Gemini 2.5 Flash Lite, temp=0, max 20 tokens. |

---

## WF-5x — Messaging Utilities

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-50 | Send WhatsApp | 🟢 Active | 🔴 P1 | n8n: "WF-50 Send WhatsApp" (BUVun38WEKb12zg9) | Sends outbound WhatsApp message via Meta Cloud API. Accepts phoneNumber + message body. Calls WF-60 to log. Used by all workflows that send to user. |
| WF-51 | Send Slack Message | 🟢 Active | 🔴 P1 | n8n: "WF-51 Send Slack Message" (wlZRK0YxnhP0b2RL) | Posts a message to a specified Slack channel. Accepts channelId + messageText. Credentials: Slack - Chinmay Astro. Activated 12 Apr 2026. Required by WF-40 and WF-12. |
| WF-52 | Slack Channel Manager | 🟢 Active | 🟠 P2 | n8n: "WF-52 Slack Channel Manager" (IO5BZLUxuVmjzk5I) | Creates, retrieves, or archives Slack channels per user. Called by WF-32 (on payment submission) and WF-42 (on consultation close). |

---

## WF-6x — Data & Logging

| WF | Name | Registry Status | Priority | n8n Actual | Notes |
|---|---|---|---|---|---|
| WF-60 | Message Logger | 🟢 Active | 🔴 P1 | Active as "WF-60 Message Logger" | Logs all inbound and outbound messages to message_log table. Records direction, content, userId, timestamp (IST), inboundMessageId for deduplication. Called by WF-00 (inbound) and WF-50 (outbound). |

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
| WF-20 Keyword Handler | LgIDj1v4ZbCPlX25 | 🟢 Yes | WF-20 | ✅ Fixed session 5 — STOP branch now calls WF-47. |
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
