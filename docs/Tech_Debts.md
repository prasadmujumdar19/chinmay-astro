# Chinmay Astro — Tech Debt Register

**Created:** 2026-05-13  
**Source:** Static analysis of workflow JSONs in `workflows/` + registry + session handoff docs  
**Method:** Python script scanned all 31 workflow JSONs for schema prefix violations, sub-workflow call parameters, disabled nodes, and stale references. No n8n execution log dump needed.

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

**Root cause:** WF-33 (Payment Approval Processor) has a node named **"Call WF-52 Create Channel"** that calls WF-52 and then reads the channel ID from its response:  
```
$('Call WF-52 Create Channel').item.json.channelId
```

**Design violation:** The Slack channel is created by WF-22 at form submission time and `slack_channel_id` is saved to the DB. WF-33 should read `slack_channel_id` directly from its "Load User by Phone" DB query — not call WF-52 again.

**Why it doesn't crash today:** WF-52 is idempotent (detects name-already-taken and returns existing channel ID). But:
1. It makes a redundant Slack API call on every payment approval.
2. If WF-52 fails, the APPROVE notification never posts to the channel.
3. The node name **"Create Channel"** causes Claude to believe WF-33 is responsible for channel creation, leading to incorrect fixes in future sessions.

**Fix:** 
1. Update "Load User by Phone" query in WF-33 to also `SELECT slack_channel_id`.
2. Replace the WF-52 call with a reference to `$('Load User by Phone').item.json.slack_channel_id`.
3. Delete the "Prepare Channel Data" and "Call WF-52 Create Channel" nodes from WF-33.

---

## 🟠 P1 — Functional Gaps (will surface in next few smoke test steps)

### TD-003 · WF-22 "User Already Exists" path calls a non-existent workflow ID

**Finding:** WF-22 has two WF-50 call nodes:
- `Call 'WF-50 Send WhatsApp'` → correct ID `BUVun38WEKb12zg9` ✅
- `Call 'WF-50 Send WhatsApp'1` → **unknown ID `aJoquwuEUbz8bI1B`** ❌

The second node is on the "User Already Exists" branch (form re-submitted by a user who already has a record). Calling a non-existent workflow ID will throw an n8n execution error.

**Fix:** Update the second WF-50 call node's `workflowId` to `BUVun38WEKb12zg9`.

---

### TD-004 · WF-60 (Message Logger) — all core nodes disabled; logging is completely broken

**Finding:** WF-60's entire processing pipeline is disabled:
- `Inbound - Log Message` (postgres) — DISABLED
- `Inbound - Prepare Log Entry` (code) — DISABLED
- `Outbound - Log Message` (postgres) — DISABLED
- `Outbound - Prepare Log Entry` (code) — DISABLED
- `Get User ID` (postgres) — DISABLED
- `Log to Messages Table` (postgres) — DISABLED

WF-50 calls WF-60 on every outbound WhatsApp message. The sub-workflow executes but does nothing — no audit trail is written.

**Impact:** Zero visibility into message history. Debugging any production issue is effectively blind.

**Fix:** Investigate why nodes were disabled (likely during early debugging). Re-enable the nodes and ensure schema prefix is correct (`chinmay_astro.` on all tables — also identified by static analysis as missing, see `Get User ID` node).

---

### TD-005 · WF-11 (Command Parser) — admin confirmations and sub-commands disabled

**Finding:** Many WF-11 nodes are disabled, meaning admin has no feedback after issuing commands:

| Disabled Node | Impact |
|---------------|--------|
| `Confirm Consultation Closure` (Slack) | Admin gets no ack after CLOSE command |
| `Confirm User Blocked` (Slack) | Admin gets no ack after BLOCK command |
| `Unknown Command Response` (Slack) | Typos in commands fail silently |
| `Get Active Users` + `Format List` + `Send List To Admin` | LIST USERS command broken |
| `Get Stats` + `Format Stats` + `Send Stats To Admin` | STATS command broken |

**Fix:** Re-enable all disabled nodes. Also apply `chinmay_astro.` schema prefix to the now-active "Get Active Users" and "Get Stats" nodes (TD-001 covers the SQL fix).

---

### TD-006 · WF-20 registry note is stale — describes a bug that is already fixed

**Finding:** `workflow-registry.md` note #12 says:  
> "WF-20 STOP branch — WRONG (session 4): Current WF-20 built in session 4 placeholder has incorrect STOP handling (sends confirmation but no DB update). Must be fixed to call WF-47 instead."

**Reality:** The WF-20 JSON (`LgIDj1v4ZbCPlX25`) has a node "Call WF-47 Unsubscribe" — the fix was already applied.

**Impact:** Claude reads this note and "fixes" WF-20 unnecessarily, potentially breaking a working workflow.

**Fix:** Update workflow-registry.md — remove/correct note #12, update WF-20's status to 🟢 Active.

---

### TD-021 · WF-33 (Payment Approval Processor) missing state guard — APPROVE executes regardless of user status

**Finding:** WF-33 has no IF/Switch node checking `status = 'payment_submitted'` before updating the user to `consultation_active`. The workflow directly loads user → updates payment status → updates user status, with no condition.

**Risk:** Admin typing `APPROVE PAYMENT <phone>` for a user who is already `consultation_active` or `consultation_closed` would reset their status incorrectly, breaking their current session.

**Fix:** Add an IF node in WF-33 after "Load User by Phone": if `status ≠ 'payment_submitted'`, post Slack error "User is not awaiting payment approval (current status: {status})" and stop execution.

---

### TD-022 · WF-42 (Consultation Closer) missing state guard — CLOSE executes regardless of user status

**Finding:** WF-42 has no IF/Switch node checking `status = 'consultation_active'` before closing. The only guard is a DB-level `WHERE status = 'active'` on the consultations table, but this does not prevent the user status update from running.

**Risk:** Admin typing `CLOSE CHAT CONSULT <phone>` for a user in `payment_pending` or `payment_submitted` would set them to `consultation_closed`, bypassing the entire payment and approval flow.

**Fix:** Add an IF node in WF-42 after "Load User by Phone": if `status ≠ 'consultation_active'`, post Slack error and stop.

---

### TD-023 · WF-10 relay path has no user status check — admin plain-text relayed from consult-* channels regardless of user state

**Finding:** WF-10 correctly differentiates `chinmay-admin-commands` (→ System Commands path) from `consult-*` channels (→ relay path). However, within the `consult-*` branch, any non-command admin message is immediately routed to relay with no check on the user's current status. If admin types internal notes in a `consult-{phone}` channel while the user is `payment_submitted` (awaiting approval), those notes are sent to the user's WhatsApp.

**Verification:** WF-12 confirmed to have no Postgres lookup and no status check before calling WF-50.

**Fix:** In WF-10's user-channel branch (after isCommand=false), add a DB lookup for the user's status by channel name. Only route to relay if `status = 'consultation_active'`. For other statuses, drop silently or log.

---

### TD-024 · WF-43 (Post-Consultation Handler) handles only text intent — post-consultation button taps (Provide Feedback, Book Again, I'm done) have no explicit routing

**Finding:** WF-43 exclusively uses WF-25 intent classification for text messages. It has no button_reply routing. When TD-015 is fixed and WF-42 sends interactive buttons, users tapping those buttons generate `button_reply` events. WF-02 currently routes all `button_reply` → PAYMENT_CONFIRM → WF-32, which would fail for post-consultation buttons (user is `consultation_closed`, not `payment_pending`).

**Dependency:** This fix must be done together with TD-015. Scope of TD-015 must include WF-02 routing update to differentiate post-consultation button_ids from the "Payment Completed" button_id.

**Fix:**
1. Define distinct `button_id` values for post-consultation buttons (e.g., `post_consult_feedback`, `post_consult_rebook`, `post_consult_done`).
2. Update WF-02 to route these button_reply types to WF-43 (or directly to WF-44/WF-45) separate from PAYMENT_CONFIRM routing.
3. Add button_reply handling in WF-43 (or handle directly in WF-02 routing).

---

### TD-025 · WF-32 (Payment Confirmation Receiver) missing idempotency guard — duplicate "Payment Completed" tap creates duplicate payment record and Slack notification

**Finding:** WF-32 has no check on the user's current status before processing. If a user taps "Payment Completed ✓" a second time (while already `payment_submitted`), WF-32 creates a second payment record and posts a second Slack notification to the admin — appearing as two separate payment approvals needed.

**Fix:** Add status check at the start of WF-32: if `status = 'payment_submitted'`, send reassurance message "Your payment is already being reviewed" and exit without creating a new record.

---

### TD-030 · WF-00 (Webhook Receiver) may not filter bot's own WhatsApp outbound message echoes

**Finding:** When WF-50 sends an outbound WhatsApp message, Meta may echo it back as an inbound webhook. WF-00's deduplication is by `inboundMessageId`. An outbound echo from Meta has a distinct message ID from any previously processed message and would pass WF-00 deduplication, entering the routing chain and potentially causing a processing loop.

**Fix:** In WF-00, add a filter: if `messages[0].from` equals the bot's own WABA phone number, drop the webhook and return 200. This is a secondary guard after deduplication.

---

### TD-031 · APPROVE command wording inconsistency — "APPROVE PAYMENT" vs "APPROVE CHAT CONSULT" used interchangeably across docs

**Finding:** Multiple sources use different forms for the payment approval command:
- `workflow-registry.md` WF-11 description: `APPROVE CHAT CONSULT <phone>`
- `workflow-registry.md` WF-32 note: `APPROVE PAYMENT <phone>`
- `CLAUDE.md` admin box: `APPROVE CHAT CONSULT <phone>` and `APPROVE PAYMENT <phone>`
- `customer_journey_map.html`: `APPROVE CHAT CONSULT <phone>`

WF-10's command detection matches on the word `APPROVE` (first word), so both forms reach WF-11. WF-11's parsing determines which form is actually accepted. If WF-11 only accepts one form and admin uses the other, the command is parsed incorrectly or produces an "Unknown command" error.

**Fix:** Decide on one canonical form. Recommend: `APPROVE PAYMENT <phone>` (shorter). Update WF-11 parser to accept this form, and update `workflow-registry.md`, `CLAUDE.md`, `customer_journey_map.html` to use the single form consistently.

---

### TD-NEW-030 · WhatsApp Flow form has no input validation on Time-of-Birth and Place-of-Birth (MVP BLOCKER)

**Finding (2026-05-23, SP-11 smoke test Test C):** The onboarding Flow form (Flow ID `1408011897720771`, CTA "Fill Details") sent by WF-21 accepts the four user-data fields (name, DOB, time-of-birth, place-of-birth) without meaningful validation:

- **DOB:** uses date picker (constrained ✓).
- **Time-of-Birth:** currently free-text or basic field — user can submit "morning", "around 4-ish", emoji, etc. For Vedic chart calculation accuracy this needs structured HH:MM input.
- **Place-of-Birth:** open text by necessity (place names are free-form). Customer can enter anything. No length or format guard.
- **Name:** text, no validation needed.

**Why this is MVP-critical:** Garbage form data flows directly into `users.time_of_birth` and `users.place_of_birth` and is consumed by chart generation. If the user submits unstructured/garbage input, Chinmay receives a consultation request with un-usable birth data, has to re-prompt the user manually via Slack, defeating the form-driven onboarding promise.

**Open design questions (to resolve before fix):**

1. **Time of Birth:** Can Meta's WhatsApp Flow Builder render a time-picker component analogous to the existing DOB date-picker? If yes, swap to picker (simplest fix).
2. **Place of Birth:** Investigate Meta's text-field validation capabilities (regex/format constraints, min/max length). If unavailable, add a downstream sanity check in WF-22 (reject inputs shorter than ~3 chars, only emoji/punctuation, or obvious garbage patterns) with a polite re-prompt via WF-50 asking the user to re-enter.
3. **Investigation step required:** Short audit of Meta WhatsApp Flow Builder docs + Builder UI to confirm which validation primitives are supported, before scoping the actual fix.

**Status:** Discovered during SP-11 (sprint inline-20260522-102910). Tracked in sprint `followups.md`. Owner not assigned. User flagged this as "crucial-to-fix-before-release".

**Fix (proposed shape — to be confirmed after Meta capability investigation):**
- If Meta supports time-picker: swap Time-of-Birth field to time-picker component (Flow Builder JSON edit, no n8n change).
- If Meta supports field-level text validation: add minLength/regex constraints in Flow Builder JSON.
- Otherwise: add a "Validate Form Inputs" guard in WF-22 between the form submission webhook and the `users` INSERT — reject obvious garbage, send a WF-50 re-prompt, keep the pending_users row so user can retry.

---

## 🟡 P2 — Design / Naming Confusion (causes incorrect AI-generated fixes)

### TD-007 · WF-52 call-site node names imply "creator-only" semantics — confuses Claude

**Finding:** Every caller of WF-52 names the node as if WF-52 only creates:
- WF-22: `"Call WF-52 (Create User Channel)"`
- WF-33: `"Call WF-52 Create Channel"`

**Reality:** WF-52 is idempotent — it runs `Get All Private Channels`, checks for name collision, and returns existing channel info if one already exists.

**Problem:** When Claude reads WF-33 and sees "Create Channel", it assumes the channel doesn't exist yet, leading to incorrect reasoning about which workflow is responsible for channel creation vs. lookup.

**Fix:**
1. Rename WF-22's call node to: `"Ensure Slack Channel Exists (WF-52)"`
2. Rename WF-33's call node to: `"Get/Create Slack Channel (WF-52)"` (or better: delete it per TD-002)
3. Add to workflow-registry.md WF-52 entry: **"Idempotent: returns existing channel if `consult-{phone}` already exists. Returns `{ channelId, channelName, isNew }`. Always safe to call multiple times."**

---

### TD-008 · WF-52 input field contract is undocumented; callers use passthrough mapping

**Finding:** WF-33 calls WF-52 with `mappingMode: "passthrough"` — it passes whatever fields are currently in the item. WF-22 does the same. WF-52's "Prepare Channel Name" code node reads from these inputs without any validation.

**Risk:** If two callers pass differently named fields (e.g. `phone_number` vs `phoneNumber`), WF-52 creates a channel with an undefined or malformed name — silently.

**Fix:** Document WF-52's expected input schema in workflow-registry.md:  
```
Required inputs: phoneNumber (string), userName (string)
Optional:        userId (integer)
Output:          { channelId, channelName, isNew }
```
Then audit WF-22 and WF-33 (once TD-002 is resolved) to confirm they both pass `phoneNumber` (camelCase).

---

### TD-009 · WF-60 and WF-20 IDs are swapped in workflow-registry.md

**Finding:**
- `workflow-registry.md` lists WF-60 ID as `LgIDj1v4ZbCPlX25` — this is actually **WF-20 Keyword Handler**
- Actual WF-60 Message Logger ID = `6H75p935FpBVBQtV` (confirmed: WF-50 calls this ID with node "Call WF-60 Message Logger")
- `NEXT_SESSION_HANDOFF.md` does not list WF-20's ID at all

**Impact:** Any session that uses the registry ID for WF-60 will modify the wrong workflow.

**Fix:** Update workflow-registry.md and NEXT_SESSION_HANDOFF.md:
- WF-20 Keyword Handler: `LgIDj1v4ZbCPlX25`
- WF-60 Message Logger: `6H75p935FpBVBQtV`

---

### TD-019 · WF-47 (Unsubscribe Handler) does not archive the user's Slack channel on STOP

**Finding:** WF-47 sets `status = 'opted_out'` but makes no WF-52 call to archive the `consult-{phone}` channel. Per the deferred archival strategy (see Archival Strategy section), channels should be archived when a user opts out — since they have explicitly unsubscribed.

**Fix:** After setting status to `opted_out`, call WF-52 with `action: 'archive'` to archive the user's `consult-{phone}` channel.

---

### TD-020 · WF-46 (User Blocker) does not archive the user's Slack channel on BLOCK

**Finding:** WF-46 sets `status = 'blocked'` but makes no WF-52 call to archive the `consult-{phone}` channel. Per the deferred archival strategy, channels should be archived when an admin blocks a user — since the block is intentional and permanent until UNBLOCK.

**Fix:** After setting status to `blocked`, call WF-52 with `action: 'archive'` to archive the user's `consult-{phone}` channel.

---

### TD-026 · WF-11 UNBLOCK command (TD-010) has no status guard — can accidentally override opted_out users

**Finding:** The UNBLOCK command to be implemented in TD-010 must only affect users with `status = 'blocked'`. Without an explicit guard, typing `UNBLOCK <phone>` for an `opted_out` user would change their status to `consultation_closed` — overriding the user's own voluntary STOP decision.

**Design principle:** `opted_out ≠ blocked`. Opted-out users re-engage automatically by messaging again. Admin should never manually override an opted_out state via UNBLOCK.

**Fix:** When implementing UNBLOCK in WF-11 (TD-010), add a status guard after the user lookup: if `status ≠ 'blocked'`, post Slack error "User is not blocked (current status: {status})" and stop execution.

---

### TD-027 · WF-20 HELP response is a single static message — not status-aware per J-18

**Finding:** WF-20 sends a single hardcoded HELP response regardless of user state. Journey map J-18 specifies that HELP should return context-appropriate guidance:
- `payment_pending` → remind user of UPI payment details and "Payment Completed" button
- `payment_submitted` → "Your payment is under review, please wait"
- `consultation_active` → "Type your question to chat with Chinmay"
- `consultation_closed` → "Type REBOOK to start a new consultation"

**Fix:** In WF-20's HELP branch, add a DB lookup for user status, then send a status-specific message via WF-50. Keep a static generic fallback for new/unknown users.

---

### TD-028 · WF-30 (New User Handler) and WF-31 (Payment Submitted Handler) have no stop_intent routing branch

**Finding:** WF-25 can classify any free-form text as `stop_intent`. WF-30 (handles pre-form free-form text) and WF-31 (handles messages from `payment_submitted` users) route on intent but have no explicit branch for `stop_intent`. A user typing "unsubscribe" or "stop" in these states would fall through to a default/error branch rather than being routed to WF-47.

**Fix:** Add explicit `stop_intent` routing in both WF-30 and WF-31 that calls WF-47 Unsubscribe Handler — matching how WF-20's STOP keyword branch already handles this.

---

### TD-029 · WF-25 (Intent Classifier) has no error handling for Gemini API failures

**Finding:** WF-25 calls the Gemini API via HTTP Request. If Gemini returns a 5xx, rate-limit, or timeout error, n8n propagates the error to the calling workflow. This fails the entire user request silently — the user receives no WhatsApp response at all.

**Fix:** Add a catch/error branch in WF-25: on Gemini failure, return `{ intent: 'unknown', confidence: 0, error: true }` so calling workflows fall through to their default branch and send the user a "please try again" message via WF-50.

---

### TD-032 · WF-44 (Feedback Recorder) saves all text as feedback without intent classification — rebook intents are silently lost

**Finding:** WF-44 saves any received text directly as feedback without running WF-25 intent classification. A user in `consultation_closed` state who types "I want to rebook" or "book again" has this text stored as a feedback string rather than being routed to WF-45 Rebook Handler.

**Dependency:** Coupled to TD-024 — until post-consultation interactive buttons are implemented, users will legitimately express rebook intent as free text. WF-44 must classify before saving.

**Fix:** Add WF-25 call at the start of WF-44. Route `rebook_intent` → call WF-45. Route `feedback` / other intents → save text to DB as before.

---

### TD-033 · WF-50 (WhatsApp Sender) has no input validation for empty or null message body

**Finding:** WF-50 passes whatever message body it receives directly to the Meta API. If any upstream workflow calls WF-50 with an empty, null, or whitespace-only message body, the Meta API returns a 400 error. The calling workflow gets a failed execution; the user receives no response and has no indication something went wrong.

**Fix:** At the start of WF-50, add a validation node: if `message_body` is null or empty after trimming, post a warning via WF-51 to the admin channel ("⚠️ WF-50 called with empty message for {phone}") and exit gracefully without calling Meta API.

---

### TD-NEW-028 · WF-51 (Send Slack Message) has no failure-path logging when Slack API call fails

**Source:** Drift review 2026-05-22 (this sprint — surfaced while resolving WF-51 pseudo drift).
**Finding:** WF-51's `Post to Slack` node connects only `main#0` (success) → `Build WF-60 Payload (Slack Outbound)` → `Call WF-60 Message Logger`. If the Slack API call fails (bot not in channel, channel archived, rate limit, network error, etc.), the chain aborts before WF-60 is reached. **No log entry is written for failed outbound Slack posts** — WF-60's `chinmay_astro.messages` table records only successful Slack outbound traffic. Compare to WF-50 (WhatsApp sender) which per workflow-registry logs "outbound success + drop" so failures are auditable.

**Impact:** Investigations of "did admin's message reach the user channel?" cannot distinguish between "never attempted" and "attempted-but-failed". Silent failure mode.

**Fix (proposed):** Wire the Slack node's `On Error` continuation → a second `Build WF-60 Payload (Slack Outbound, failure)` Code node → reuses `Call WF-60 Message Logger`. The failure payload carries the same canonical shape with `metadata.slackApiOk: false` and `metadata.failureReason: <error code/message>`. WF-60 inserts the row; `slack_message_ts` stays NULL for the failed attempt.

**Schedule:** Bundle into the planned error-handling sprint (alongside TD-029 WF-25 Gemini-failure handling and TD-033 WF-50 empty-body validation).

---

### TD-034 · WF-00 does not guard against whitespace-only or blank user messages before routing

**Finding:** Some WhatsApp clients can send messages with whitespace-only text. WF-00 routes these into the state machine as normal messages. WF-25 then receives an empty or blank string for Gemini classification — Gemini may error, classify unexpectedly, or return garbage intent, with no clean fallback for the user.

**Fix:** In WF-00, after extracting message text, trim and check non-empty. If the message text is blank after trimming, return HTTP 200 to Meta without routing further — same handling as reaction messages.

---

### TD-NEW-029 · Technical-failure class — postgres node mid-flight halt between consecutive nodes (DB blip / n8n hiccup)

**Finding:** Setting `alwaysOutputData=true` on user-keyed Postgres UPDATE nodes (per the May 2026 SP-02 sweep) protects against the functional `0 rows affected` case by letting downstream observe and route gracefully. It does NOT protect against the *technical* failure mode where the postgres node errors mid-execution (connection dropped, n8n container restart, Postgres restart, transient network glitch) **after upstream gates have already validated user-existence**. Examples surfaced during the SP-02 audit:

- **WF-32 Step 6 (Update User Status)** — by Step 6 the user has been confirmed twice: WF-02 routes `PAYMENT_CONFIRM ⇔ user IS NOT NULL AND user.status='payment_pending'`, then Step 5's INSERT into `payments` FK-validates `user_id`. A 0-row UPDATE at Step 6 is impossible by functional invariant; only a postgres connection blip or container restart in the millisecond window between Step 5 and Step 6 can cause failure. Currently the workflow halts and an orphan `payments` row is left behind.
- **Any UPDATE following a SELECT/INSERT that already confirmed the same row** — same shape. WF-22 Save Slack Channel ID, WF-32 Create Payment Record, WF-34 Reset User Status, WF-44 Save Feedback, WF-45 Set status=payment_pending, WF-47 Update User Status to opted_out, WF-47 Close Open Consultation all have this property to varying degrees.

**Fix (proposed):** Bundle into the planned error-handling sprint alongside TD-029 (WF-25 Gemini failure), TD-033 (WF-50 empty body), and TD-NEW-028 (WF-51 failure logging). The right shape is retry / orphan-row reconciliation infrastructure (e.g., a periodic reconciler that looks for `payments.status='pending_verification'` rows whose `users.status` ≠ `payment_submitted` and either auto-corrects or flags for admin review) rather than per-node defensive guards. Per-node IF-guard wiring was considered and rejected during SP-02 because (a) the functional invariants already hold via upstream gates and (b) per-node guards would proliferate guard-code across every workflow without addressing the underlying class.

**Schedule:** Planned error-handling sprint (post-MVP).

---

## 🟢 P3 — Feature Gaps

### TD-010 · WF-11 missing UNBLOCK admin command

**Source:** Registry note #15 (session 4).  
Admin cannot unblock a user. Command `UNBLOCK <phone>` needs to be added to WF-11 → sets `status = 'consultation_closed'` for users with `status = 'blocked'`. Must only affect `blocked` users — not `opted_out` (those re-engage themselves).

---

### TD-011 · WF-45 (Rebook Handler) payment wording not updated to standard UPI text

**Source:** Registry note #13 (session 4).  
WF-45 must use: *"Please send ₹500 via GPay / PhonePe / any UPI app to: +91-9653240263 (Chinmay Mujumdar). Once done, tap the button below."*  
Also needs the "Payment Completed" interactive button.

---

### TD-012 · WF-23 registry status shows 🔵 Placeholder but it is built and active

**Source:** Session 6 completed WF-23. Registry was not updated.  
**Fix:** Update WF-23 registry entry to 🟢 Active.

---

## ⚪ P4 — Cleanup

### TD-013 · Three stale/backup workflows polluting the n8n workflow list

| File ID | Name | Action |
|---------|------|--------|
| `z6as85o3b1zK22eF` | WF-30 New User Onboarding (WRONG - DEACTIVATED) | Delete from n8n |
| `fdlIpl67amL2Ho6U` | BACKUP_20260412_WF-25 Post-Consultation Options (SUPERSEDED) | Delete from n8n |
| `yIZwO3CZk6bOBAXl` | BACKUP_20260412_WF-30 New User Onboarding (WRONG) | Delete from n8n |

These are inactive and deactivated but clutter the workflow list and confuse name-based lookups.

---

### TD-018 · WF-42 registry description incorrectly states "Archives Slack channel via WF-52" — channel is never archived on CLOSE

**Finding:** `workflow-registry.md` WF-42 entry states "Archives Slack channel via WF-52 after closing". Verification of WF-42 JSON confirms no WF-52 call exists. The channel is NOT archived on consultation close.

**This is correct behavior** per the deferred archival strategy: channels stay open so the astrologer retains full conversation history and users can rebook in the same channel without losing context. Archival is deferred to STOP/BLOCK events or 60-day inactivity (see Archival Strategy section).

**Fix:** Update `workflow-registry.md` WF-42 description to accurately reflect: "Sets status=consultation_closed, sets awaiting_feedback=true, sends post-consultation message. Does NOT archive Slack channel — deferred archival strategy applies (see TD-019, TD-020, WF-72)."

---

---

## Design Gaps (from `user_journey_map.html` comparison)

These gaps exist between the journey map specification and the current workflow implementation.

---

### TD-014 · WF-42 (Consultation Closer) references `users` columns that don't exist in schema — CLOSES will fail

**Root cause:** WF-42's "Update User Status" node runs:
```sql
UPDATE chinmay_astro.users 
SET status = 'consultation_closed',
    current_consultation_id = NULL,
    total_consultations = total_consultations + 1
WHERE id = $1
```

`current_consultation_id` and `total_consultations` are **not in the DB schema** (CONTEXT.md documents only: `phone`, `name`, `dob`, `tob`, `birth_place`, `status`, `slack_channel_id`, `awaiting_feedback`).

**Impact:** Every admin CLOSE command will fail at this DB update → consultation can never be marked closed → user stays stuck at `consultation_active` → REBOOK and feedback flows are unreachable.

**Fix options:**
1. Add the two columns to the `users` table: `ALTER TABLE chinmay_astro.users ADD COLUMN current_consultation_id INTEGER, ADD COLUMN total_consultations INTEGER DEFAULT 0;`
2. OR simplify the UPDATE to only set `status = 'consultation_closed'` (drop the two extra column updates, which are nice-to-have analytics anyway)

---

### TD-015 · WF-42 sends a WhatsApp template instead of interactive buttons — post-consultation menu broken

**Root cause:** WF-42's "Prepare Feedback Message" node sends:
```json
{
  "messageType": "template",
  "templateName": "consultation_closed_feedback",
  "templateParams": [user.name]
}
```

**Journey map says:** User should receive interactive buttons: **"Book Another Consultation"** + **"Provide Feedback"** (J-11).

**Two problems:**
1. No interactive buttons → user doesn't know their options; WF-43 (Post-Consultation Handler) only works via free-text fallback.
2. `consultation_closed_feedback` Meta template has **no confirmed approval** anywhere in STATUS.md / registry. If not approved → WF-50 throws Meta API error → CLOSE fails entirely.

**Fix:** Change WF-42 to send a plain-text message listing options (REBOOK / feedback instructions) OR an interactive button message — check whether the 24hr window is open before deciding template vs. free-form.

---

### TD-016 · WF-31 (Payment Submitted Handler) does not relay user messages to admin Slack

**Journey map J-08 says:** "Relay message content to Slack channel as context for admin (informational)"

**Reality:** WF-31 sends an "under review" ack to the user but has no Slack relay step. Admin is blind to any messages a payment_submitted user sends while waiting for approval.

**Fix:** Add a WF-51 call in WF-31 to post the user's message to `slack_channel_id` with a note like "💬 [Awaiting approval] {user}: {message}".

---

### TD-017 · Non-text messages during `consultation_active` are silently dropped at WF-00

**Journey map says:** During consultation_active, images/audio → forward to Slack (`consult-{phone}`) + notify user: "Chinmay can see you sent a file. Text responses only from our side."

**Reality:** WF-00 registry note: "filters non-text (images/audio/reactions → ignore)". All non-text is dropped before routing — regardless of user state.

**Impact:** Images users send during consultation are invisible to Chinmay.

**Fix (post-MVP acceptable):** At WF-00 or WF-01, if message type is image/audio AND user is `consultation_active`, route to WF-40 with a flag, or add a dedicated branch that posts to the user's Slack channel.

---

## Archival Strategy — Design Decision (May 2026)

**Decision:** Slack consultation channels (`consult-{phone}`) are **NOT archived when a consultation closes**. This is intentional.

### Rationale
After consultation closure, a user may rebook within days or weeks. Keeping the channel open allows Chinmay to scroll back and see the full conversation history — birth details, questions asked, context already shared — without asking the user to repeat themselves. Channel archival is irreversible from a workflow perspective (unarchiving requires manual Slack admin action) and should only happen when the user is definitively gone.

### Archival Triggers

| Event | Trigger Workflow | Status |
|-------|-----------------|--------|
| User sends STOP → `opted_out` | WF-47 | TD-019 — to implement |
| Admin BLOCK → `blocked` | WF-46 | TD-020 — to implement |
| 60-day inactivity (background sweep) | WF-72 | Deferred — post-go-live |

### Rebook Flow — Channel Lifecycle (Current Correct Behavior)
1. WF-42 closes consultation: sets `status = consultation_closed`, channel stays open ✅
2. User types REBOOK → WF-45 → sets `status = payment_pending`
3. User pays → WF-32 → `payment_submitted` → Admin APPROVE → `consultation_active`
4. Consultation resumes in the **same Slack channel** with full history visible ✅

---

## Summary Table

| ID | Issue | Priority | Smoke Step Impacted |
|----|-------|----------|---------------------|
| TD-001 | Schema prefix `chinmay_astro.` missing (12 nodes across 8 WFs) | 🔴 P0 | Steps 5–15 |
| TD-002 | WF-33 redundant WF-52 call; reads channelId from WF-52 not DB | 🔴 P0 | Step 7 (APPROVE) |
| TD-014 | WF-42 UPDATE uses non-existent `users` columns → CLOSE fails | 🔴 P0 | Step 9 (CLOSE) |
| TD-003 | WF-22 "User Already Exists" calls unknown WF-50 ID | 🟠 P1 | Step 3 re-test |
| TD-004 | WF-60 all core nodes disabled — logging dead | 🟠 P1 | Every step silently |
| TD-005 | WF-11 admin confirmation + stats nodes disabled | 🟠 P1 | Steps 7, 9, 13 |
| TD-006 | WF-20 registry note says broken but it's already fixed — stale doc | 🟠 P1 | Misleads Claude |
| TD-015 | WF-42 sends unconfirmed Meta template instead of interactive buttons | 🟠 P1 | Step 9 (CLOSE) |
| TD-016 | WF-31 no Slack relay for payment_submitted user messages | 🟠 P1 | Step 6 |
| TD-021 | WF-33 missing state guard — APPROVE runs regardless of user status | 🟠 P1 | Step 7 (APPROVE) |
| TD-022 | WF-42 missing state guard — CLOSE runs regardless of user status | 🟠 P1 | Step 9 (CLOSE) |
| TD-023 | WF-10 relay has no status check — admin notes sent during payment_submitted | 🟠 P1 | Steps 6–7 |
| TD-024 | WF-43 no button_reply routing for post-consult buttons (coupled to TD-015) | 🟠 P1 | Step 10+ |
| TD-025 | WF-32 missing idempotency — duplicate "Payment Completed" tap accepted | 🟠 P1 | Step 5 |
| TD-030 | WF-00 no bot echo filter — outbound WA messages may re-enter routing | 🟠 P1 | Every outbound msg |
| TD-031 | APPROVE command wording inconsistency across docs (APPROVE PAYMENT vs APPROVE CHAT CONSULT) | 🟠 P1 | Step 7 (APPROVE) |
| TD-007 | WF-52 call-site nodes named "Create Channel" — wrong semantics | 🟡 P2 | Misleads Claude |
| TD-008 | WF-52 input contract undocumented; passthrough mapping fragile | 🟡 P2 | Debugging |
| TD-009 | WF-60 / WF-20 IDs swapped in registry | 🟡 P2 | Wrong WF modified |
| TD-017 | Non-text during consultation_active silently dropped (not fwded to Slack) | 🟡 P2 | Post-MVP UX |
| TD-019 | WF-47 does not archive Slack channel on STOP/opted_out | 🟡 P2 | Channel housekeeping |
| TD-020 | WF-46 does not archive Slack channel on BLOCK | 🟡 P2 | Channel housekeeping |
| TD-026 | WF-11 UNBLOCK has no status guard — can override opted_out users | 🟡 P2 | Step 14 |
| TD-027 | WF-20 HELP response is static — not status-aware per J-18 | 🟡 P2 | Step 16 (HELP) |
| TD-028 | WF-30 / WF-31 missing stop_intent routing branch | 🟡 P2 | Pre-form + payment_submitted STOP |
| TD-029 | WF-25 no error handling for Gemini API failures | 🟡 P2 | Any free-text state |
| TD-032 | WF-44 saves all text as feedback without intent check — rebook intent lost | 🟡 P2 | Step 10+ |
| TD-010 | WF-11 missing UNBLOCK command | 🟢 P3 | Step 14 |
| TD-011 | WF-45 Rebook payment wording not updated | 🟢 P3 | Step 12+ |
| TD-012 | WF-23 registry status wrong (Placeholder → Active) | 🟢 P3 | Documentation |
| TD-013 | 3 stale/backup workflows in n8n | ⚪ P4 | None |
| TD-018 | WF-42 registry description says "Archives via WF-52" — incorrect, doc fix needed | ⚪ P4 | None (doc only) |
| TD-033 | WF-50 no validation for empty/null message body — Meta API will error | 🟡 P2 | Any outbound message |
| TD-034 | WF-00 no guard for whitespace-only user messages — blank text enters routing | 🟡 P2 | Edge case user input |
