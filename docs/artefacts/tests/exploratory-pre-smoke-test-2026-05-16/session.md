# Test Session — exploratory / pre-smoke-test

- **Date:** 2026-05-16
- **Operator:** prasadmujumdar
- **Test phone:** `61466927921` (Australia +61 — confirmed allowed by WF-01 `Layer 1: Country Filter`)
- **Design docs:** `docs/reference/user_journey_map.html`, `docs/superpowers/FunctionalTestCases.md`
- **Latency threshold:** 5000 ms

## Watch surface

- **n8n:** all active workflows (executions polled via `/api/v1/executions`)
- **Postgres tables:** `users` (updated_at), `admin_actions` (created_at), `payments` (created_at), `messages` (created_at), `consultations` (created_at), `pending_users` (created_at). Note: `message_log` does not exist in this schema — using `messages` instead.
- **Slack channels:** `C0A5B0ZE81E` (chinmay-admin-commands) + any `consult-*` created during run.

## Baselines (captured 2026-05-16T05:23:05Z)

- **Last n8n execution id:** 876
- **Time cursor:** 2026-05-16T05:23:05Z

| Table | Rows | Max ts |
|---|---|---|
| users | 1 | 2026-05-12 10:56:28+05:30 |
| admin_actions | 0 | — |
| payments | 1 | 2026-05-12 09:06:37 |
| messages | 0 | — |
| consultations | 1 | 2026-05-12 09:07:16 |
| pending_users | 2 | 2026-05-12 08:30:04+05:30 |

## Pre-test state of test phone

| Field | Value |
|---|---|
| phone_number | 61466927921 |
| name | Pq |
| status | **consultation_closed** |
| stage | null |
| updated_at | 2026-05-12T05:26:28Z |

⚠ **Implication for test plan:** This number is NOT a clean new-user state. First inbound text will route via WF-43 (POST_CONSULT_TEXT) per WF-02 routing. To test the onboarding path (TC-0101 → TC-0104), either:
- Reset this user's row (delete or set status back to a new state), OR
- Test from a different unused phone number, OR
- Start the test from the `consultation_closed` state and exercise rebook (TC-0504/TC-0505), feedback (TC-0501/TC-0502), STOP (TC-0606), and keyword paths.

---

### Action — 2026-05-16T05:35:00Z
**Sent:** "Hi" from 61466927921 (brand-new user — DB clean, no prior record)
**Expected (TC-0101):**
1. WF-00 receives webhook, dedupes by `inboundMessageId`
2. WF-01 country check passes (+61 allowed); blacklist check passes; user not found in DB
3. WF-01 routes to WF-21
4. WF-21 sends single combined message: policy URL + service description + ₹500 fee + WhatsApp Flow form (Flow ID `1408011897720771`, CTA "Fill Details")
5. **No DB record created** (no row in `users` or `pending_users`)
6. WF-22 NOT invoked, WF-52 NOT invoked, no Slack channel created yet

### Tick — 2026-05-16T05:33:00Z (after action 05:35:00Z above — clock-skew, harmless)
**Trigger:** user said "check"
**New executions:** 10 (10 ok, 0 failed, 0 slow) — exec id 877 → 886

| id | workflow | status | duration |
|---|---|---|---|
| 877 | WF-00 Webhook Receiver | ✅ | 2.4s |
| 878 | WF-01 Message Router | ✅ | 2.2s |
| 879 | WF-02 User State Router | ✅ | 2.0s |
| 880 | WF-20 Keyword Handler | ✅ | 0.1s |
| 881 | WF-21 New User Welcome + Form | ✅ | 1.9s |
| 882 | WF-50 Send WhatsApp | ✅ | 1.8s |
| 883 | WF-60 Message Logger | ✅ | 0.04s |
| 884 | WF-00 Webhook Receiver | ✅ | 0.02s |
| 885 | WF-00 Webhook Receiver | ✅ | 0.02s |
| 886 | WF-00 Webhook Receiver | ✅ | 0.02s |

**Chain reconstructed:** WF-00 → WF-01 → WF-02 → WF-20 (no keyword match, fast pass-through) → WF-21 → WF-50 → WF-60. The trailing 3 WF-00 executions are Meta delivery-status webhooks (sent / delivered / read) — expected.

**DB deltas:**
- `users`: 0 rows for 61466927921 ✅
- `pending_users`: **1 new row** for 61466927921 at 05:29:34 (created by WF-01's `Load Pending User` or downstream).
- `messages`: 0 rows ← WF-60 ran successfully but wrote nothing (consistent with prior **TD-004** — WF-60 core nodes still disabled). Audit trail is still broken.

**Slack:** no new channels expected for new-user path; not checked.

**Cross-check vs expected (TC-0101):**
- ✅ WF-00, WF-01, WF-21, WF-50 all triggered
- ✅ No row in `users`
- ✅ No Slack channel created
- ⚪ **Doc gap (not a bug):** `pending_users` row was created — per operator, this is intentional. Design Rule #1 in CLAUDE.md should be updated from "no DB write before form submission" to "**no DB write except logging to `pending_users` table** before form submission." Logged for doc update; non-blocker for smoke.
- ⚪ **Deferred by choice (not a bug):** WF-60 fires but writes nothing to `messages`. Per operator, message logging is a conscious deferral. **However**, `docs/workflow-registry.md` claims "All nodes re-enabled (TD-004 May 2026)" — registry needs to be reconciled with current reality (either re-disable claim, or fix WF-60). Non-blocker for smoke.

### Action — 2026-05-16T05:38:00Z
**Sent:** Filled-out WhatsApp Flow form (Name, DOB, TOB, Place) from 61466927921
**Expected (TC-0104):**
1. WF-00 receives `nfm_reply` interactive webhook
2. WF-02 detects `messageType=interactive`, `interactive.type=nfm_reply` → DETAILS_FORM route → WF-22
3. WF-22 calls encryption-svc Docker container to decrypt payload
4. WF-22 creates DB row in `chinmay_astro.users`: `status=payment_pending`, stores name/DOB/TOB/birth_place
5. WF-22 calls WF-52 → creates `consult-61466927921` Slack channel → stores `slack_channel_id` on the user row
6. WF-22 sends UPI payment instructions (₹500 to +91-9653240263) + "Payment Completed ✓" interactive button via WF-50
7. (Acceptable) `pending_users` row may be cleared/updated

### Tick — 2026-05-16T05:42:00Z
**Trigger:** user reported "nothing came back, n8n UI shows execution failures"
**New executions:** 7 — exec 887→893 (4 failed, 3 ok)

| id | workflow | status |
|---|---|---|
| 887 | WF-00 Webhook Receiver | ❌ |
| 888 | WF-01 Message Router | ❌ |
| 889 | WF-02 User State Router | ❌ |
| 890 | WF-22 Form Response Handler | ❌ — `Save Slack Channel ID` |
| 891 | WF-52 Slack Channel Manager | ✅ (created `C0B3SA9JALX`) |
| 892, 893 | WF-10 Slack Admin Handler | ✅ (admin-side echo of WF-52's channel creation event) |

**Failure root cause** — `ExpressionError: Referenced node doesn't exist` in WF-22 `Save Slack Channel ID` node:
- The Postgres node's `queryReplacement` expression references `$('Call WF-52 (Create User Channel)').item.json.channelId`
- The actual upstream node is named `Ensure Slack Channel Exists (WF-52)` — node was renamed but the downstream expression was never updated
- Cascades up the chain: WF-22 fails → WF-02 / WF-01 / WF-00 all marked errored

**DB deltas:**
- `users`: 1 new row id=27 — `name=Abcd`, `dob=1986-05-15`, `tob=11:30:00`, `place=Mumbai`, `status=payment_pending`, **`slack_channel_id=NULL` ← critical: should be `C0B3SA9JALX`**

**Slack:** channel `C0B3SA9JALX` (`consult-61466927921`) created and admin invited — channel exists but orphaned (no DB linkage).

**Cross-check vs expected (TC-0104):**
- ✅ WF-22 invoked; user row created with all birth details; status=payment_pending
- ✅ WF-52 invoked; Slack channel created; admin invited
- ❌ `slack_channel_id` NOT saved to user row (NULL)
- ❌ Payment instructions NOT sent to user
- ❌ "Payment Completed ✓" button NOT delivered

## Issues found

### [critical] BUG-01 — WF-22 expression references renamed WF-52 caller node
- **Workflow:** WF-22 Form Response Handler (`dr8QM0m92Ml8MvIh`)
- **Node:** `Save Slack Channel ID` (postgres executeQuery)
- **Field:** `parameters.options.queryReplacement`
- **Current:** `={{ $('Call WF-52 (Create User Channel)').item.json.channelId }}, {{ $('Create User Record').item.json.id }}`
- **Should be:** `={{ $('Ensure Slack Channel Exists (WF-52)').item.json.channelId }}, {{ $('Create User Record').item.json.id }}`
- **Impact:** 100% failure on every new-user form submission. Breaks downstream payment flow (WF-32 reads `slack_channel_id` from DB). Orphans a Slack channel per attempt. **Hard go-live blocker.**
- **Detection gap:** Plugin v1.7.0 lint hook does not check that `$('node-name')` references resolve to an actual node in the workflow. **Candidate for a new lint rule** — flush to plugin after fix.
- **Fix applied (via n8n UI by operator, 2026-05-16 ~05:44Z):**
  - Query rewrite: `SET slack_channel_id=$1, updated_at=$2 WHERE id=$3 RETURNING id, slack_channel_id;`
  - queryReplacement: `={{ $('Ensure Slack Channel Exists (WF-52)').item.json.channelId }}, {{ $now }}, {{ $('User Created?').item.json.id }}`
- **Backfill:** WF-22 re-ran successfully against user 27 (no need to reset row); `slack_channel_id=C0B3SA9JALX`, `updated_at=2026-05-16 11:14:42+05:30`. Operator received payment instructions on WhatsApp.

### Action — 2026-05-16T05:48:00Z
**About to send:** tap "Payment Completed ✓" interactive button from 61466927921
**Expected (TC-0201):**
1. WF-00 receives interactive webhook (button_reply)
2. WF-02 detects `interactive.type=button_reply` → PAYMENT_CONFIRM → WF-32
3. WF-32 creates row in `chinmay_astro.payments` with `status=submitted`
4. WF-32 updates `users.status = payment_submitted` for user 27
5. WF-32 reads `slack_channel_id=C0B3SA9JALX` from DB (does NOT call WF-52 again per Design Rule #2)
6. WF-32 posts birth details + "APPROVE PAYMENT 61466927921" instruction to channel C0B3SA9JALX via WF-51
7. WF-32 sends confirmation to user via WF-50: "Got it! Chinmay will review your payment..."

### Tick — 2026-05-16T05:50:00Z (Payment Completed tap)
**Trigger:** user tapped "Payment Completed ✓"
**Executions:** 908–918 (11 total, all ✅) — chain: WF-00 → WF-01 → WF-02 → WF-32 → WF-50 + WF-51 → WF-60 + trailing Meta status webhooks. ~2s end-to-end.
**DB deltas:** users 27 status → `payment_submitted`; payments row id=9 created (`amount=500`, `status=pending_verification`, `method=gpay`).
**Slack:** WF-51 posted "🔔 New Payment Submission" with canonical `APPROVE PAYMENT 61466927921` instruction to `C0B3SA9JALX`.
**Cross-check (TC-0201):** ✅ all 6 expectations met. WF-52 NOT re-invoked (Design Rule #2 honored).

### Action — 2026-05-16T05:55:00Z (APPROVE PAYMENT)
**Sent:** `APPROVE PAYMENT 61466927921` from operator in Slack
**Expected (TC-0301):** WF-10 → WF-11 (APPROVE parse) → WF-33 → payment.status=approved, user.status=consultation_active, consultation row created, user notified via WF-50.

### Tick — 2026-05-16T05:56:00Z (APPROVE)
**Trigger:** user reports confirmation on both Slack + WhatsApp
**Executions:** 919–927 (9 total, all ✅) — chain: WF-10 → WF-11 → WF-33 → WF-50 → WF-60 + trailing Slack/Meta webhooks. ~2.5s end-to-end.
**DB deltas:**
- users 27: `payment_submitted` → **`consultation_active`** ✅
- payments id=9: `pending_verification` → **`approved`** ✅
- consultations id=8 created: `status=active`, `started_at=2026-05-16 11:25:37 IST` ✅

**Observation (non-blocking at this point):** `users.current_consultation_id` is NULL despite `consultations.id=8` existing for user 27. Reported to operator → operator added a new node `Update User Consultation Id` to WF-33 to fix this. See BUG-02 below.

### [major] BUG-02 — WF-33 `Update User Consultation Id` node has duplicate `$1` placeholder
- **Workflow:** WF-33 Payment Approval Processor (`NcHZedq9ycnAQ9SW`)
- **Node:** `Update User Consultation Id` (postgres executeQuery) — added by operator 2026-05-16 to address the `current_consultation_id=NULL` observation above
- **Current query:**
  ```sql
  UPDATE chinmay_astro.users SET current_consultation_id = $1, updated_at = NOW()
  WHERE id = $1 RETURNING *;
  ```
- **Current queryReplacement:** `={{ $('Create Consultation Record').item.json.id }}`
- **Bug:** Both placeholders are `$1` and only the consultation id is passed → the UPDATE attempts to match a user whose `id` equals the consultation id (user id 8, which doesn't exist), so zero rows are updated. user 27's `current_consultation_id` is still NULL after the fix.
- **Correct query:**
  ```sql
  UPDATE chinmay_astro.users SET current_consultation_id = $1, updated_at = NOW()
  WHERE id = $2 RETURNING *;
  ```
- **Correct queryReplacement:** `={{ $('Create Consultation Record').item.json.id }}, {{ $('Load User by Phone').item.json.id }}`
- **Impact:** Whether this blocks relay depends on whether WF-40 / WF-42 read `current_consultation_id`. If they read by `user_id` from `consultations` table directly, relay will still work. Recommend fixing before continuing.



**Cross-check (TC-0301):** ✅ all expectations met.

### Action — 2026-05-16T05:58:00Z (Relay test — TC-0401 + TC-0311)
**About to send:**
1. Free-form text from user WhatsApp 61466927921 — e.g. "What does my birth chart say about career this year?"
2. Then free-form reply from operator in Slack channel C0B3SA9JALX — e.g. astrology guidance

**Expected:**
- TC-0401 (user → admin): WF-00 → WF-01 → WF-02 (RELAY) → WF-40 → WF-51 → posts to C0B3SA9JALX. No LLM. ⚠ Note: TD-004 still open so WF-60 will fire but not write to `messages`.
- TC-0311 (admin → user): WF-10 detects non-command in consult channel → WF-12 (or WF-41) → WF-50 → user WhatsApp. Bot-loop guard (`authorizations[0].user_id ≠ event.user`) must prevent infinite loop.

### Tick — 2026-05-16T06:11:00Z (Relay)
**Trigger:** user said "user→admin worked, admin→user failed"
**Executions:** 948–956

**User → admin (TC-0401):** 948–954 all ✅
- WF-00 (948) → WF-01 (949) → WF-02 (950) → WF-20 keyword pass-through (951) → WF-40 User→Admin Relay (952) → WF-51 Send Slack (953) → WF-10 echo of bot's own post (954, bot-loop-guard passed). ~3s.

**Admin → user (TC-0311):** 955 + 956 ❌
- 955 WF-10 — failed at `Call WF-41 (Admin->User Relay)` propagated from child
- 956 WF-41 — failed at `Extract Phone from Channel`: `TypeError: Cannot read properties of undefined (reading 'replace') [line 5]`

### Tick — 2026-05-16T06:38:00Z (Admin→user relay re-test, live)
**Trigger:** user sent fresh Slack message in C0B3SA9JALX after fixing WF-10 + WF-41
**Executions:** 993–999 (7 total, all ✅, ~1.4s end-to-end)
- 993 WF-10 mode=`webhook` (live Slack event, NOT manual) ✅
- 994 WF-41 ✅
- 995 WF-50 ✅
- 996 WF-60 ✅
- 997-999 trailing Meta delivery webhooks ✅

**Cross-check (TC-0311):** ✅ Admin→user relay confirmed working end-to-end via live webhook path. Operator received message on WhatsApp.

**Operator's fix summary (review):**
1. WF-10 `Load User Status` SQL rewritten to smuggle channel name + message text as SELECT literals: `SELECT status, $2 as channelName, $3 as messageText FROM users WHERE slack_channel_id=$1 LIMIT 1` with queryReplacement `={{ $json.channelId }}, {{ $('Find Channel').item.json.name }}, {{ $json.messageText }}`
2. WF-41 `Extract Phone from Channel` updated `input.channelName` → `input.channelname` (lowercase, matching Postgres column-name lowercasing default)
3. `Call WF-41` node still `mappingMode: passthrough` — fix relied on upstream data, not caller mapping

### Action — 2026-05-16T06:50:00Z (CLOSE)
**Sent:** `CLOSE CHAT CONSULT 61466927921` from operator in Slack
**Expected (TC-0305):**
1. WF-10 captures Slack event → WF-11 parses CLOSE → WF-42
2. WF-42 disables relay mode
3. Updates `consultations.id=8`: `status=closed`, `closed_at=now()`
4. Updates `users.id=27`: `status=consultation_closed`
5. **Per Design Rule #10: channel `C0B3SA9JALX` intentionally NOT archived** (reused on rebook). WF-52 archive should NOT be invoked.
6. WF-42 sends user interactive button message via WF-50: "Provide Feedback" / "Book Another Consultation" / "I'm done, thank you"
7. Admin receives Slack confirmation in C0B3SA9JALX

⚠ Known prior risks (per handoff): TD-014 (WF-42 UPDATE used non-existent users columns) and TD-015 (WF-42 unconfirmed Meta template instead of interactive buttons) — both supposedly closed. If either is regressed, expect failure here.

### Tick — 2026-05-16T07:03:00Z (CLOSE — final happy path)
**Trigger:** operator reported "happy path works" after fixing UNKNOWN command channel-target side issue
**Executions:** 1000–1044 (45 entries — heavy debug noise from operator's manual fixes between 1000–1034). **Final live happy-path chain:**
- 1035 WF-10 webhook ✅
- 1036 WF-11 ✅ (CLOSE parsed)
- 1037 WF-42 Consultation Closer ✅
- 1038 WF-50 Send WhatsApp ✅
- 1039 WF-60 Logger ✅
- 1040–1044 trailing Slack/Meta status webhooks ✅

**DB deltas:**
- `users.id=27`: `consultation_active` → **`consultation_closed`** ✅
- `users.current_consultation_id`: 8 → NULL ✅
- `users.slack_channel_id`: `C0B3SA9JALX` preserved ✅ (Design Rule #10 — channel reused on rebook, NOT archived)
- `consultations.id=8`: `active` → **`closed`** ✅, `ended_at` set

**Cross-check (TC-0305):** ✅ Happy path met. Channel preservation per Design Rule #10 confirmed.

**Side-findings from operator's exploration (captured separately):**
- WF-11 `Unknown Command Response` was routing to admin channel — operator fixed in-session
- WF-11 HELP responder had same channel-target issue; operator tried to fix but n8n editor kept reverting their changes
- Root cause identified: HELP responder node was misleadingly named `Send Stats To Admin1` (not `Send HELP Response`) → easy to edit the wrong node
- **In-session resolution:** operator renamed `Send Stats To Admin1` → `Send Help To Admin` AND switched `Send List To Admin` + `Send Stats To Admin` from hardcoded `C0A5B0ZE81E` to `={{ $json.channelName }}`. Verified via API export (exec 1057–1061 all ✅ on live & manual runs).
- Two hardcoded references remain: `Confirm User Unblocked`, `No Blocked User Found` — see `followups-wf11-channel-routing.md` items FU-WF11-03 (partial).
- Full audit + remediation plan: `followups-wf11-channel-routing.md`

## Summary

### What worked end-to-end (live webhook mode, all happy paths verified)
- ✅ TC-0101 — New-user "Hi" → WF-21 sends policy + Flow form
- ✅ TC-0104 — Form submission → user row + Slack channel created + payment instructions sent (after BUG-01 fix)
- ✅ TC-0201 — "Payment Completed" tap → payment row, Slack notification, user confirmation (full chain ~2s)
- ✅ TC-0301 — APPROVE PAYMENT → user → `consultation_active`, payment → approved, consultations row created (after BUG-02 fix)
- ✅ TC-0401 — User→admin relay (consultation_active text passes through to Slack channel)
- ✅ TC-0311 — Admin→user relay (after BUG-03 fix; live webhook-mode verified exec 993–999)
- ✅ TC-0305 — CLOSE CHAT CONSULT → user → `consultation_closed`, consultation → closed, `slack_channel_id` preserved per Design Rule #10

### Issues found & fixed in-session
| ID | Severity | What | Status |
|---|---|---|---|
| BUG-01 | 🔴 critical | WF-22 expression referenced renamed WF-52 caller node → `slack_channel_id` never saved, payment instructions never sent | ✅ Fixed |
| BUG-02 | 🟠 major | WF-33 `Update User Consultation Id` had duplicate `$1` placeholder → `current_consultation_id` always NULL | ✅ Fixed |
| BUG-03 | 🟠 major | Admin→user relay dropped `channelName`+`messageText` before calling WF-41 → TypeError on undefined.replace | ✅ Fixed (with caveats in followups-relay-fix.md) |
| WF-11 UNKNOWN | 🟡 major (UX) | Routed to admin channel instead of originating | ✅ Fixed in-session |
| WF-11 HELP/LIST/STATS | 🟡 major (UX) | Hardcoded admin channel + misnamed HELP node | ✅ Fixed in-session (3 of 5 nodes) |

### Open observations (non-blocking)
- ⚪ Doc gap: CLAUDE.md Design Rule #1 wording should explicitly allow `pending_users` writes pre-form (saved to memory)
- ⚪ WF-60 fires but writes nothing to `messages` — per operator, message logging is a conscious deferral. Workflow registry still claims TD-004 closed; needs reconciliation.
- ⚪ `chinmay_astro.consultations.ended_at` was used as the close-timestamp column (registry says `closed_at` — but `closed_at` doesn't exist; only `ended_at` does)

### Open follow-ups (carried to dedicated files in this folder)
- `followups-relay-fix.md` — FU-RELAY-01..03 (passthrough mapping audit, channelName casing, SELECT-smuggling pattern)
- `followups-wf11-channel-routing.md` — FU-WF11-01..04 (remaining 2 hardcoded admin-channel refs in `Confirm User Unblocked` + `No Blocked User Found`; revert-on-save diagnostic)

## Next session — when smoke testing resumes

Test phone `61466927921` is currently in state `consultation_closed` with `slack_channel_id=C0B3SA9JALX` preserved. Recommended sequence:

1. **TC-0501 / TC-0502 — Feedback path**
   - Tap "Provide Feedback" button on the post-consult interactive message (still pending in user's inbox)
   - Send feedback text; verify `users.feedback` column populated and `awaiting_feedback` flag cleared
   - Validates F-01 (`stage` column) end-to-end

2. **TC-0504 / TC-0505 — REBOOK path**
   - Tap "Book Another Consultation" button OR send "REBOOK" keyword
   - Verify WF-45 sets `users.status = payment_pending` AND reuses the existing `C0B3SA9JALX` channel (Design Rule #10 — do NOT create a new channel)
   - Validates F-03 fixes on WF-45's executeWorkflow nodes

3. **TC-0606 — STOP from consultation_closed**
   - Send "STOP" — verify WF-47 → `users.status = opted_out` + `admin_actions` row inserted with `action_type='opted_out'`
   - Validates F-02 fix on WF-47

4. **TC-0607 — Re-engagement after opt-out**
   - Send any message — verify WF-01 routes opted_out user to WF-21 (treat as new user)

5. **TC-0306 / TC-0307 — BLOCK and UNBLOCK admin commands** (requires resetting user first, or using a second test phone)
   - Validates F-02 fix on WF-11 UNBLOCK flow

6. **WF-11 remaining cleanup before go-live**
   - Apply FU-WF11-03 (last 2 hardcoded admin-channel refs)
   - Audit per FU-RELAY-03 for other `mappingMode: passthrough` calls that may silently drop fields

7. **Reconcile `docs/workflow-registry.md` with reality**
   - TD-004 (WF-60 disabled nodes) — re-mark as deferred/conscious choice
   - CLAUDE.md Design Rule #1 — update wording to allow pending_users
   - WF-42 column naming (`ended_at` not `closed_at`)

### Test surface state at session end (carry-forward for tomorrow)
- `users.id=27` / `phone=61466927921` / `status=consultation_closed` / `current_consultation_id=null` / `slack_channel_id=C0B3SA9JALX`
- `payments.id=9` / `status=approved`
- `consultations.id=8` / `status=closed` / `ended_at` set
- Slack channel `C0B3SA9JALX` (`consult-61466927921`) — open, NOT archived
- Cursors stored in `.cursors/` — last exec id 1061, time `<final ts>` — a resumed session should rebaseline since several hours will likely elapse.




### [major] BUG-03 — Admin→user relay drops channelName + messageText before calling WF-41
- **Workflows:** WF-10 Slack Admin Handler (`wMh0oBRtJbvhLgOf`) + WF-41 Admin -> User Relay (`6PzJRZsF7k2d9hV7`)
- **Failing node:** WF-41 `Extract Phone from Channel` — calls `channelName.replace(/^consult-/, '')` but `input.channelName` is undefined
- **Caller node:** WF-10 `Call WF-41 (Admin->User Relay)` — `mappingMode: passthrough` with empty `value: {}`
- **Upstream connection:** `User Consultation Active? → Call WF-41`. Direct ancestor providing data is `Load User Status` whose query is `SELECT status FROM chinmay_astro.users WHERE slack_channel_id = $1 LIMIT 1` — returns ONLY `{status: "consultation_active"}`. `channelName`, `messageText`, etc. from earlier nodes (`Find Channel`, `Extract Required Fields`) are dropped because the Postgres node breaks the data chain.
- **Verified payload received by WF-41:** `{status: "consultation_active"}` (from exec 956 input)
- **Fix options:**
  1. **Preferred:** Change WF-10 `Call WF-41` node from `mappingMode: passthrough` to `defineBelow` and explicitly map:
     - `channelName` ← `={{ $('Find Channel').item.json.channel.name }}` (or wherever channel name is held)
     - `messageText` ← `={{ $('Extract Required Fields').item.json.text }}` (or equivalent)
     - any other fields WF-41 reads (`adminMessage` etc.)
  2. Alternative: insert a Merge node combining `Load User Status` output with `Extract Required Fields` output before `Call WF-41`, then passthrough.
  3. Worst: have WF-41 do a Slack `conversations.info` lookup using `slack_channel_id` (would require also passing channelId + messageText, defeating the simplicity argument).
- **Detection gap:** Same lint-rule candidate as BUG-01 (resolve `$('node-name')` references), plus a separate rule: when caller uses `mappingMode: passthrough`, validate the upstream Postgres SELECT returns all fields the callee's first node reads. Add to `flush-plugin-improvements` discussion.








---

## Resume — 2026-05-16T22:01:59Z

**Tunnel:** reopened by operator.
**Next focus:** Feedback validation (TC-0501 → TC-0502), then Rebook (TC-0504 / TC-0505 / TC-1001), then onward.
**Test phone:** 61466927921 (unchanged). Last bot WA message: "consultation complete" + 2 buttons (Provide Feedback / Book Another Consultation — TC-0508 "I'm done" button may or may not be present; verify on tap).
**Baselines (resumed):**
- exec-cursor: 1061
- time-cursor: 2026-05-16T22:01:59Z

