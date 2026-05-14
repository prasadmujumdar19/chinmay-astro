# Chinmay Astro — Functional Test Cases

**Created:** 2026-05-13  
**Source:** `docs/reference/user_journey_map.html` v2.0, `docs/workflow-registry.md` v2.7, `docs/Tech_Debts.md`  
**Assumption:** Tech debts are evaluated as **closed** for test design purposes. Gaps covered by existing TDs are noted inline.  
**Format:** Given / When / Then  

---

## ID Schema

| Range | Category |
|-------|----------|
| TC-01xx | Onboarding |
| TC-02xx | Payment |
| TC-03xx | Admin / Slack Commands |
| TC-04xx | Consultation Relay |
| TC-05xx | Post-Consultation |
| TC-06xx | Universal Keywords |
| TC-07xx | Edge Cases / Non-Text |
| TC-08xx | Intent Filter (WF-25) |
| TC-09xx | Background Jobs |
| TC-10xx | Missing / Additional Scenarios |

---

## Priority Key

| Level | Meaning |
|-------|---------|
| 🔴 P0 | Smoke test blocker — system cannot function |
| 🟠 P1 | Functional gap — journey broken for users |
| 🟡 P2 | Design gap — degraded UX or incorrect behaviour |
| 🟢 P3 | Feature gap — missing nice-to-have capability |
| ⚪ P4 | Cleanup / deferred — post go-live |

---

## TC-01xx — Onboarding

---

### TC-0101 · First message from brand-new user (text)
**Journey:** J-01 (as implemented — no YES/NO consent gate)  
**Priority:** 🔴 P0  
**Owning WFs:** WF-00 → WF-01 → WF-21

**Given:** A phone number with India (+91) prefix has no DB record and has not previously messaged.  
**When:** User sends any text message (e.g., "Hi", "I want astrology advice", "Namaste").  
**Then:**
1. WF-00 receives the webhook, validates Meta signature, deduplicates by `inboundMessageId`.
2. WF-01 performs country check (+91 passes), blocked-user check (not blocked), loads DB — no record found.
3. WF-01 routes to WF-21.
4. WF-21 sends a single free-form WhatsApp message containing: policy URL, service description, ₹500 fee, and the WhatsApp Flow form (Flow ID: `1408011897720771`, CTA: "Fill Details").
5. **No DB record is created at this point.**
6. User receives the message within a few seconds.

**Preconditions:** SSH tunnel open; WF-00, WF-01, WF-21 active.

---

### TC-0102 · First message from brand-new user (image or audio)
**Journey:** J-21 (non-text messages) — new user variant  
**Priority:** 🟠 P1  
**Owning WFs:** WF-00

**Given:** A phone number with no DB record.  
**When:** User sends an image or audio message as their very first contact.  
**Then:**
1. WF-00 detects message type as non-text (not `text`).
2. WF-00 sends polite deflection: "Please send text messages only. Images and audio are not supported."
3. No DB write. No routing to WF-01.

---

### TC-0103 · First message from brand-new user (reaction)
**Journey:** J-21 (reactions — silently ignored)  
**Priority:** 🟡 P2  
**Owning WFs:** WF-00

**Given:** A phone number with no DB record.  
**When:** User sends a WhatsApp reaction (e.g., thumbs up, heart emoji).  
**Then:**
1. WF-00 detects `messageType = reaction`.
2. Silently drops message — returns HTTP 200 to Meta.
3. No response sent to user. No DB write.

---

### TC-0104 · User submits WhatsApp Flow form (birth details)
**Journey:** J-03  
**Priority:** 🔴 P0  
**Owning WFs:** WF-00 → WF-01 → WF-02 → WF-22 → WF-52 → WF-50

**Given:** User has received the WhatsApp Flow form (no DB record yet, or pendingUser state).  
**When:** User fills and submits the form with Name, Date of Birth, Time of Birth, and Place of Birth.  
**Then:**
1. Meta delivers an encrypted `nfm_reply` webhook.
2. WF-02 detects `messageType = interactive`, `interactive.type = nfm_reply` → routes DETAILS_FORM path to WF-22.
3. WF-22 calls the encryption-svc Docker container to decrypt the payload (IV flipping).
4. WF-22 creates a DB record: `status = payment_pending`, stores name, DOB, TOB, birth_place.
5. WF-22 immediately calls WF-52 to create `consult-{phone}` Slack channel; saves `slack_channel_id` to DB.
6. WF-22 sends payment instructions via WF-50: "Please send ₹500 via GPay / PhonePe / any UPI app to: +91-9653240263 (Chinmay Mujumdar). Once done, tap the button below." + "Payment Completed ✓" interactive button.

**Preconditions:** encryption-svc running; Slack credential `WSds5JWe5b6N7myY` valid.

---

### TC-0105 · User re-submits form when already payment_pending
**Journey:** Not explicitly in journey map — "User Already Exists" branch  
**Priority:** 🟠 P1  
**Owning WFs:** WF-22 (User Already Exists branch)  
**Note:** Covered by **TD-003** (wrong WF-50 ID in this branch — closure in progress).

**Given:** User already has `status = payment_pending` in DB.  
**When:** User somehow triggers and submits the WhatsApp Flow form again.  
**Then:**
1. WF-22 detects a record already exists for this phone number.
2. WF-22 follows the "User Already Exists" branch — sends an appropriate response (e.g., re-sends payment instructions).
3. WF-22 does **not** create a duplicate DB record.
4. WF-22 does **not** create a duplicate Slack channel.

---

### TC-0106 · Pre-form free-form message — general enquiry intent
**Journey:** J-05  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 (PRE_FORM_TEXT) → WF-23 → WF-25 → WF-50

**Given:** User has received the form (WhatsApp flow sent) but has not submitted it yet (`pendingUser` state — no full DB record).  
**When:** User sends a text message: "What kind of questions can Chinmay answer?"  
**Then:**
1. WF-02 detects pendingUser state → routes PRE_FORM_TEXT to WF-23.
2. WF-23 calls WF-25 (Intent Classifier) with the message text.
3. WF-25 classifies intent as `general_enquiry`.
4. WF-23 sends Gemini-generated brief answer + re-sends the form (Flow ID: `1408011897720771`).

---

### TC-0107 · Pre-form free-form message — malicious/abusive intent
**Journey:** J-05 (garbage/abusive branch)  
**Priority:** 🟠 P1  
**Owning WFs:** WF-23 → WF-25 → WF-46 → WF-51

**Given:** User in pendingUser state.  
**When:** User sends abusive/threatening content.  
**Then:**
1. WF-23 → WF-25 classifies as `malicious_abusive`.
2. WF-23 sends warning message to user via WF-50.
3. WF-25 (or WF-23 acting on WF-25 result) calls WF-46 to block user.
4. Admin notified in Slack via WF-51.
5. No DB record created (user had pendingUser state only).

---

### TC-0108 · First message from non-India number
**Journey:** J-23  
**Priority:** 🟠 P1  
**Owning WFs:** WF-01

**Given:** Phone number does not start with +91.  
**When:** User sends any message.  
**Then:**
1. WF-01 performs country code check — fails.
2. Message silently dropped OR user receives: "This service is currently available only in India."
3. No DB write. No further routing.

---

### TC-0109 · Journey map J-01/J-02/J-04 — YES/NO consent gate
**Journey:** J-01, J-02, J-04 (journey map v2.0 spec)  
**Priority:** 🟡 P2 (documentation discrepancy)  
**Note:** **DESIGN MISMATCH** — see TC-1008.

The journey map documents a two-step flow: Welcome → wait for YES → send form. The actual implementation sends the form immediately in the first message (no YES/NO gate). J-02 (consent given path), J-04 (declined path) **do not exist** in the current implementation.

---

## TC-02xx — Payment

---

### TC-0201 · User taps "Payment Completed" button
**Journey:** J-06  
**Priority:** 🔴 P0  
**Owning WFs:** WF-00 → WF-01 → WF-02 (PAYMENT_CONFIRM) → WF-32 → WF-51 → WF-50

**Given:** User has `status = payment_pending`; `slack_channel_id` is stored in DB (created at form submission).  
**When:** User taps the "Payment Completed ✓" interactive button in WhatsApp.  
**Then:**
1. WF-02 detects `messageType = interactive`, `interactive.type = button_reply` → routes PAYMENT_CONFIRM to WF-32.
2. WF-32 creates a payment record in DB with `status = submitted`.
3. WF-32 updates user `status = payment_submitted`.
4. WF-32 loads `slack_channel_id` from DB (does **not** call WF-52 again).
5. WF-32 posts to the existing Slack channel: user birth details + `APPROVE PAYMENT <phone>` instruction.
6. WF-32 sends user confirmation via WF-50: "Got it! Chinmay will review your payment and confirm shortly. Usually within a few minutes."

---

### TC-0202 · User taps "Payment Completed" button twice (duplicate tap)
**Journey:** J-06 — duplicate / edge case  
**Priority:** 🟠 P1  
**Owning WFs:** WF-32

**Given:** User already has `status = payment_submitted` (already tapped once).  
**When:** User taps "Payment Completed ✓" again (duplicate or accidental second tap).  
**Then:**
1. WF-32 checks user status before processing.
2. If already `payment_submitted`: sends a reassurance message — no duplicate payment record created, no duplicate Slack notification.
3. Alternatively, WF-32 is idempotent — same Slack post does not trigger admin twice.

**Gap risk:** WF-32 may not validate current status before proceeding, resulting in a duplicate Slack notification confusing the admin.

---

### TC-0203 · payment_pending user sends free-form text (general enquiry)
**Journey:** J-07  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 (PAYMENT_PENDING_TEXT) → WF-30 → WF-25 → WF-50

**Given:** User has `status = payment_pending`.  
**When:** User sends "When is a good time to pay?"  
**Then:**
1. WF-02 routes PAYMENT_PENDING_TEXT to WF-30.
2. WF-30 calls WF-25; intent classified as `general_enquiry`.
3. Gemini provides brief answer, then re-prompts payment instructions + "Payment Completed" button.

---

### TC-0204 · payment_pending user sends REBOOK (invalid/edge state)
**Journey:** Not mapped in journey map  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 → WF-20 → WF-45

**Given:** User has `status = payment_pending` (first-time user, never had consultation).  
**When:** User sends the keyword "REBOOK".  
**Then:**
1. WF-02 routes to WF-20 (keyword handler intercepts before state routing).
2. WF-20 passes "REBOOK" to WF-45.
3. WF-45 sets `status = payment_pending` (already in this state — no-op) and re-sends payment instructions.

**Gap risk:** WF-45 sending payment instructions for a user who is already `payment_pending` and has birth details is acceptable, but if WF-45 assumes `consultation_closed` state it may not handle `payment_pending` gracefully.

---

### TC-0205 · payment_submitted user sends message while awaiting approval
**Journey:** J-08  
**Priority:** 🟠 P1  
**Owning WFs:** WF-02 (PAYMENT_SUBMITTED_TEXT) → WF-31 → WF-25 → WF-51 → WF-50  
**Note:** Slack relay part covered by **TD-016** (WF-31 missing Slack relay — closure in progress).

**Given:** User has `status = payment_submitted`.  
**When:** User sends "I've paid, please check my account."  
**Then:**
1. WF-02 routes PAYMENT_SUBMITTED_TEXT to WF-31.
2. WF-31 calls WF-25; intent classified.
3. WF-31 sends "under review" acknowledgement via WF-50.
4. WF-31 relays user's message to `slack_channel_id` channel via WF-51 with note: "💬 [Awaiting approval] {user}: {message}".
5. Admin sees the context message in Slack.

---

### TC-0206 · payment_submitted user sends image (e.g., GPay screenshot)
**Journey:** J-08 variant (non-text during payment_submitted)  
**Priority:** 🟡 P2  
**Owning WFs:** WF-00

**Given:** User has `status = payment_submitted`.  
**When:** User sends a screenshot of their GPay payment confirmation as an image.  
**Then:**
1. WF-00 detects non-text message.
2. User is **not** in `consultation_active` state — so image is NOT forwarded to Slack.
3. Deflection message sent: "Please send text messages only."

---

## TC-03xx — Admin / Slack Commands

---

### TC-0301 · Admin approves payment — happy path
**Journey:** J-09  
**Priority:** 🔴 P0  
**Owning WFs:** WF-10 → WF-11 (APPROVE) → WF-33 → WF-50 → WF-51

**Given:** User has `status = payment_submitted`; admin is in the user's `consult-{phone}` Slack channel.  
**When:** Admin types: `APPROVE PAYMENT 919876543210`  
**Then:**
1. WF-10 captures the Slack event; routes to WF-11.
2. WF-11 parses command as `APPROVE` with `targetPhone = 919876543210`.
3. WF-33 loads user record; validates `status = payment_submitted`.
4. WF-33 updates payment record: `status = approved`.
5. WF-33 updates user: `status = consultation_active`.
6. WF-33 sends user WhatsApp message via WF-50: "Your consultation has started! You can now ask Chinmay your astrology questions."
7. WF-33 posts Slack confirmation with user birth details summary for admin reference.

**Note:** `APPROVE PAYMENT` — canonical form. WF-11 parses full command including "PAYMENT" keyword.

---

### TC-0302 · Admin approves payment — wrong phone number
**Journey:** J-09 error path  
**Priority:** 🟠 P1  
**Owning WFs:** WF-11 → WF-33

**Given:** No user record exists for the given phone number.  
**When:** Admin types: `APPROVE PAYMENT 919999999999`  
**Then:**
1. WF-33 attempts to load user — no record found.
2. Admin receives Slack error response: "User not found for phone 919999999999."
3. No state changes occur.

---

### TC-0303 · Admin approves when user is already consultation_active (double APPROVE)
**Journey:** J-09 error path  
**Priority:** 🟠 P1  
**Owning WFs:** WF-33

**Given:** User already has `status = consultation_active`.  
**When:** Admin types APPROVE PAYMENT again for the same user.  
**Then:**
1. WF-33 validates user status before proceeding.
2. Detects user is already `consultation_active`; no state change.
3. Admin receives informational Slack message: "User is already in consultation."

---

### TC-0304 · Admin rejects payment
**Journey:** J-10  
**Priority:** 🔴 P0  
**Owning WFs:** WF-10 → WF-11 (REJECT) → WF-34 → WF-50  
**Note:** **TD-001** (schema prefix `chinmay_astro.` missing in WF-34 — closure in progress).

**Given:** User has `status = payment_submitted`.  
**When:** Admin types: `REJECT 919876543210`  
**Then:**
1. WF-11 parses command as `REJECT`.
2. WF-34 updates payment record: `status = rejected`.
3. WF-34 updates user: `status = payment_pending`.
4. WF-34 sends user WhatsApp message via WF-50: "We couldn't verify your payment. Please complete payment and tap the button again." + re-sends GPay instructions + "Payment Completed" button.

---

### TC-0305 · Admin closes consultation
**Journey:** J-11  
**Priority:** 🔴 P0  
**Owning WFs:** WF-10 → WF-11 (CLOSE) → WF-42 → WF-52 → WF-50  
**Note:**  
- **TD-014** (WF-42 UPDATE uses non-existent `users` columns — closure in progress).  
- **TD-015** (WF-42 sends unconfirmed Meta template instead of interactive buttons — closure in progress).

**Given:** User has `status = consultation_active`; `consult-{phone}` channel is active in Slack.  
**When:** Admin types: `CLOSE CHAT CONSULT 919876543210`  
**Then:**
1. WF-11 parses command as `CLOSE`.
2. WF-42 disables relay mode.
3. WF-42 updates consultation record: `status = closed`, `closed_at = now()`.
4. WF-42 updates user: `status = consultation_closed`.
5. WF-42 calls WF-52 to archive the `consult-{phone}` Slack channel.
6. WF-42 sends user interactive button message via WF-50 with three options: "Provide Feedback", "Book Another Consultation", "I'm done, thank you".
7. Admin receives Slack confirmation.

---

### TC-0306 · Admin blocks a user
**Journey:** J-12  
**Priority:** 🟠 P1  
**Owning WFs:** WF-10 → WF-11 (BLOCK) → WF-46  
**Note:** **TD-001** (schema prefix in WF-46); **TD-005** (Confirm User Blocked node disabled — closure in progress).

**Given:** Any user state.  
**When:** Admin types: `BLOCK 919876543210`  
**Then:**
1. WF-11 parses as `BLOCK`.
2. WF-46 updates user: `status = blocked`.
3. WF-46 logs to `admin_actions` table.
4. **No message sent to user** (silent block).
5. Admin receives Slack confirmation: "User blocked."

---

### TC-0307 · Admin unblocks a user
**Journey:** J-A1  
**Priority:** 🟡 P2  
**Owning WFs:** WF-10 → WF-11 (UNBLOCK branch) → DB update  
**Note:** **TD-001** (schema prefix); **TD-010** (UNBLOCK command — closure in progress).

**Given:** User has `status = blocked`.  
**When:** Admin types: `UNBLOCK 919876543210`  
**Then:**
1. WF-11 parses as `UNBLOCK`, extracts `targetPhone`.
2. Loads user — validates `status = blocked` (UNBLOCK only works on blocked, not opted_out).
3. Updates user: `status = consultation_closed`.
4. Logs to `admin_actions`.
5. Admin receives Slack confirmation: "✅ User <name> has been unblocked. Status is now consultation_closed."
6. **No WhatsApp message to user** — admin decides when to notify.

---

### TC-0308 · Admin attempts UNBLOCK on opted_out user
**Journey:** J-A1 — invalid state variant  
**Priority:** 🟡 P2  
**Owning WFs:** WF-11

**Given:** User has `status = opted_out` (not `blocked`).  
**When:** Admin types: `UNBLOCK 919876543210`  
**Then:**
1. WF-11 loads user; detects status is `opted_out`, not `blocked`.
2. Admin receives Slack error: "User is not blocked. UNBLOCK only applies to blocked users. Opted-out users re-engage themselves by messaging."

---

### TC-0309 · Admin requests LIST of active users
**Journey:** Customer journey map — "LIST" command  
**Priority:** 🟢 P3  
**Owning WFs:** WF-11 (Get Active Users, Format List, Send List nodes)  
**Note:** **TD-005** (these nodes disabled — closure in progress); **TD-001** (schema prefix — closure in progress).

**Given:** Admin in any Slack channel.  
**When:** Admin types: `LIST`  
**Then:**
1. WF-11 parses command as `LIST`.
2. Queries `chinmay_astro.users` for `status = consultation_active`.
3. Formats result as readable list.
4. Posts list to admin's Slack channel.

---

### TC-0310 · Admin requests STATS
**Journey:** Customer journey map — "STATS" command  
**Priority:** 🟢 P3  
**Owning WFs:** WF-11 (Get Stats, Format Stats, Send Stats nodes)  
**Note:** **TD-005** (nodes disabled — closure in progress); **TD-001** (schema prefix — closure in progress).

**Given:** Admin in any Slack channel.  
**When:** Admin types: `STATS`  
**Then:**
1. WF-11 parses command as `STATS`.
2. Queries DB for total clients, consultations today, pending payments.
3. Posts formatted stats to admin's Slack channel.

---

### TC-0311 · Admin types plain text in consult channel during consultation
**Journey:** J-14 (admin → user relay)  
**Priority:** 🔴 P0  
**Owning WFs:** WF-10 → WF-12 (or WF-41) → WF-50 → WF-60

**Given:** User has `status = consultation_active`; admin is in the `consult-{phone}` Slack channel.  
**When:** Admin types: "Saturn's transit in your 10th house suggests strong career growth this year."  
**Then:**
1. WF-10 receives Slack event; detects it is not a command (no recognised keyword).
2. Message is NOT forwarded to WF-11.
3. WF-12 (or WF-41) relays message verbatim to user's WhatsApp via WF-50.
4. WF-60 logs the message as `direction = outbound`.
5. User sees admin's message in their WhatsApp as if Chinmay typed it directly.

**Note:** Registry lists both WF-12 and WF-41 for this purpose — routing must be unambiguous.

---

### TC-0312 · Admin types plain text in Slack when user NOT consultation_active
**Journey:** Not mapped (edge case for relay guard)  
**Priority:** 🟠 P1  
**Owning WFs:** WF-10 → WF-12

**Given:** User has `status = payment_submitted` (NOT `consultation_active`); admin is in the `consult-{phone}` channel.  
**When:** Admin types: "Payment looks correct, approving shortly."  
**Then:**
1. WF-10 / WF-12 should detect user is **not** `consultation_active`.
2. Message is **NOT** relayed to user's WhatsApp.
3. Admin's message stays within Slack only (or admin receives a warning).

**Gap risk:** WF-12 may not check user status before relaying — could send admin's internal note to user accidentally.

---

### TC-0313 · Admin types plain text in chinmay-admin-commands channel
**Journey:** Edge case — admin command channel vs consult channel  
**Priority:** 🟠 P1  
**Owning WFs:** WF-10 → WF-12

**Given:** Admin is in the `chinmay-admin-commands` channel (not a user consult channel).  
**When:** Admin types: "Let me check the payment reports."  
**Then:**
1. WF-10 receives the event from `chinmay-admin-commands`.
2. WF-12 detects this is not a `consult-{phone}` channel (or no user maps to this channel).
3. Message is **not** relayed to any WhatsApp number.

**Gap risk:** WF-12 may relay any admin message from any channel — needs channel type guard.

---

### TC-0314 · Unrecognised admin command (typo)
**Journey:** WF-11 fallback  
**Priority:** 🟡 P2  
**Owning WFs:** WF-11  
**Note:** **TD-005** (Unknown Command Response node disabled — closure in progress).

**Given:** Admin in any Slack channel.  
**When:** Admin types: `BLOCCK 919876543210` (typo).  
**Then:**
1. WF-11 parses command — no recognised pattern matched.
2. Unknown Command Response node sends Slack message: "Unknown command. Available: APPROVE PAYMENT, REJECT, CLOSE CHAT CONSULT, BLOCK, UNBLOCK, LIST, STATS."

---

### TC-0315 · Bot-loop prevention in Slack relay
**Journey:** J-14 — bot-loop prevention  
**Priority:** 🔴 P0  
**Owning WFs:** WF-10 → WF-41

**Given:** WF-50 sends a message to user on WhatsApp; separately, WF-51 posts a notification to a Slack channel.  
**When:** The Slack event fires for the bot's own post in a consult channel.  
**Then:**
1. WF-10 receives the event.
2. WF-41 (or WF-10 guard) checks `authorizations[0].user_id` ≠ `event.user` — detects this is the bot's own message.
3. Message is **not** relayed — no infinite loop.

---

## TC-04xx — Consultation Relay

---

### TC-0401 · consultation_active user sends text — relayed to Slack
**Journey:** J-13  
**Priority:** 🔴 P0  
**Owning WFs:** WF-00 → WF-01 → WF-02 (RELAY) → WF-40 → WF-51 → WF-60  
**Note:** **TD-001** (schema prefix in WF-40); **TD-004** (WF-60 all nodes disabled — closure in progress).

**Given:** User has `status = consultation_active`.  
**When:** User sends: "What does my birth chart say about my career this year?"  
**Then:**
1. WF-02 routes RELAY to WF-40.
2. WF-40 loads user from DB — gets `slack_channel_id` and user name.
3. WF-40 formats message and calls WF-51 to post to `consult-{phone}` channel.
4. WF-60 logs message as `direction = inbound`.
5. No LLM processing — pure pass-through relay.
6. Admin sees user's message in Slack immediately.

---

### TC-0402 · consultation_active user sends HELP
**Journey:** J-18 — consultation_active variant  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 → WF-20 → WF-50

**Given:** User has `status = consultation_active`.  
**When:** User sends: "HELP"  
**Then:**
1. WF-02 routes to WF-20 before state routing (keyword interception).
2. WF-20 checks user status = `consultation_active`.
3. WF-20 sends contextual response: "Your consultation is live — Chinmay can see everything you type. Just send your questions."
4. Message is **not** relayed to Slack as a user question.

---

### TC-0403 · consultation_active user sends STOP
**Journey:** J-19 — consultation_active guard  
**Priority:** 🟠 P1  
**Owning WFs:** WF-02 → WF-20 → WF-47 → WF-50

**Given:** User has `status = consultation_active`.  
**When:** User sends: "STOP"  
**Then:**
1. WF-20 intercepts STOP keyword; calls WF-47.
2. WF-47 detects `status = consultation_active`.
3. WF-47 sends hold message: "Your active consultation cannot be ended by you. Your astrologer will close the session when complete. If you wish to stop all future messages after this consultation, send STOP again once it is closed."
4. **No state change.** Consultation continues.

---

### TC-0404 · consultation_active user sends image or audio
**Journey:** J-21 (non-text, consultation_active exception)  
**Priority:** 🟡 P2  
**Owning WFs:** WF-00 (or WF-40) → WF-51 → WF-50  
**Note:** **TD-017** (non-text currently silently dropped; not forwarded to Slack — closure in progress).

**Given:** User has `status = consultation_active`.  
**When:** User sends a photo or voice note.  
**Then:**
1. Non-text detected; user is `consultation_active` — special handling applies.
2. Image/audio metadata forwarded to `consult-{phone}` Slack channel as notification: "[User sent an image/audio file]".
3. User receives: "Chinmay can see you sent a file. Text responses only from our side."
4. No state change.

---

## TC-05xx — Post-Consultation

---

### TC-0501 · User taps "Provide Feedback" button
**Journey:** J-15  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 → WF-43 (button tap branch) → WF-50

**Given:** User has `status = consultation_closed`; received post-consultation button message.  
**When:** User taps "Provide Feedback" interactive button.  
**Then:**
1. WF-02 detects `button_reply` → routes to WF-43.
2. WF-43 sets `stage = awaiting_feedback` (or sets `awaiting_feedback = true`) in DB.
3. WF-43 sends prompt via WF-50: "We'd love your feedback! Please share your experience in a message."
4. User's next free-form message is captured as feedback.

---

### TC-0502 · User sends feedback text (awaiting_feedback = true)
**Journey:** J-15 continued  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 → WF-44 → WF-50  
**Note:** **TD-001** (schema prefix in WF-44 — closure in progress).

**Given:** User has `status = consultation_closed`, `awaiting_feedback = true`.  
**When:** User sends: "Excellent session! Very insightful, highly recommend."  
**Then:**
1. WF-44 (or WF-43) captures the message as feedback text.
2. Saves to `users.feedback` field in DB.
3. Clears `awaiting_feedback` flag (`stage = NULL`).
4. Sends thank-you message via WF-50: "Thank you for your feedback! We hope to serve you again."

---

### TC-0503 · User sends non-feedback text while awaiting_feedback
**Journey:** J-15 — edge case  
**Priority:** 🟡 P2  
**Owning WFs:** WF-44

**Given:** User has `status = consultation_closed`, `awaiting_feedback = true`.  
**When:** User sends: "Actually, I want to book another consultation."  
**Then:**
1. WF-44 receives the text.
2. Either: saves text as feedback (verbatim) and clears flag, OR runs intent filter first.
3. If intent filter runs: `rebook_intent` detected → routes to WF-45 instead of saving as feedback.

**Gap:** WF-44 behaviour when receiving non-feedback text while `awaiting_feedback = true` is ambiguous. If WF-44 saves everything verbatim, rebook intent is lost. If WF-44 first checks intent, it breaks the awaiting_feedback contract.

---

### TC-0504 · User taps "Book Another Consultation" button
**Journey:** J-16  
**Priority:** 🟠 P1  
**Owning WFs:** WF-02 → WF-45 → WF-50

**Given:** User has `status = consultation_closed`; original `consult-{phone}` channel was **archived** by WF-42.  
**When:** User taps "Book Another Consultation" button.  
**Then:**
1. WF-45 sets `status = payment_pending`.
2. WF-45 sends payment instructions + "Payment Completed" button via WF-50.
3. User does NOT need to re-submit the birth details form.
4. **WF-45 must call WF-52 to create a NEW `consult-{phone}` Slack channel** (or unarchive the existing one) and update `slack_channel_id` in DB — the archived channel ID stored in DB is no longer usable.

**Gap:** See **TC-1001** — rebook Slack channel lifecycle. WF-45 may not call WF-52, leaving an invalid `slack_channel_id` that breaks payment notification when user later taps "Payment Completed".

---

### TC-0505 · User sends REBOOK keyword (consultation_closed)
**Journey:** J-20  
**Priority:** 🟠 P1  
**Owning WFs:** WF-02 → WF-20 → WF-45 → WF-50

**Given:** User has `status = consultation_closed`.  
**When:** User sends: "REBOOK"  
**Then:**
1. WF-20 intercepts REBOOK keyword before state routing.
2. WF-20 routes to WF-45.
3. WF-45 sets `status = payment_pending`; sends payment instructions + button.
4. WF-45 calls WF-52 to create/refresh the Slack channel (same gap as TC-0504).

---

### TC-0506 · consultation_closed free-form — rebook intent
**Journey:** J-17  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 (POST_CONSULT_TEXT) → WF-43 → WF-25 → WF-50

**Given:** User has `status = consultation_closed`, `awaiting_feedback = false`.  
**When:** User sends: "I'd like to have another astrology session."  
**Then:**
1. WF-43 calls WF-25; intent = `rebook_intent`.
2. WF-43 sends: "To book another consultation, just send REBOOK." (does not directly initiate rebook).

---

### TC-0507 · consultation_closed free-form — general enquiry
**Journey:** J-17  
**Priority:** 🟢 P3  
**Owning WFs:** WF-43 → WF-25 → WF-50

**Given:** User has `status = consultation_closed`.  
**When:** User sends: "Is Mercury in retrograde this month?"  
**Then:**
1. WF-43 → WF-25; intent = `general_enquiry`.
2. Gemini generates a brief answer.
3. Response sent via WF-50 with REBOOK option mentioned.

---

### TC-0508 · User taps "I'm done, thank you" button
**Journey:** J-11 — post-close option  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 → WF-43 (button handler)

**Given:** User has `status = consultation_closed`; received post-consultation message with three buttons.  
**When:** User taps "I'm done, thank you."  
**Then:**
1. WF-43 handles the button response.
2. Sends a warm farewell: "Thank you for using Chinmay Astro! Wishing you all the best. 🙏"
3. No state change.

**Gap risk:** Journey map lists this third button option but it may not be implemented in WF-43's button routing logic.

---

## TC-06xx — Universal Keywords

---

### TC-0601 · HELP — from payment_pending user
**Journey:** J-18  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 → WF-20 → WF-50

**Given:** User has `status = payment_pending`.  
**When:** User sends: "HELP"  
**Then:**
1. WF-20 intercepts keyword before intent filter.
2. WF-20 detects status = `payment_pending`.
3. Sends contextual response: resends GPay payment instructions + "Payment Completed" button.

---

### TC-0602 · HELP — from payment_submitted user
**Journey:** J-18  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 → WF-20 → WF-50

**Given:** User has `status = payment_submitted`.  
**When:** User sends: "HELP"  
**Then:**
1. WF-20 detects status = `payment_submitted`.
2. Sends: "Your payment is being reviewed by Chinmay. You'll hear back shortly."

---

### TC-0603 · HELP — from consultation_closed user
**Journey:** J-18  
**Priority:** 🟡 P2  
**Owning WFs:** WF-02 → WF-20 → WF-50

**Given:** User has `status = consultation_closed`.  
**When:** User sends: "HELP"  
**Then:**
1. WF-20 sends: "Your consultation has ended. You can: send REBOOK to book again, or send your feedback. Type HELP to see this again."

---

### TC-0604 · STOP — from payment_pending user (regulatory)
**Journey:** J-19  
**Priority:** 🔴 P0  
**Owning WFs:** WF-02 → WF-20 → WF-47 → WF-50  
**Note:** **TD-001** (schema prefix in WF-47 `users` + `admin_actions` — closure in progress).

**Given:** User has `status = payment_pending`.  
**When:** User sends: "STOP"  
**Then:**
1. WF-20 intercepts; calls WF-47.
2. WF-47 confirms status is NOT `consultation_active`.
3. Updates `status = opted_out` in `chinmay_astro.users`.
4. Logs to `chinmay_astro.admin_actions`.
5. Sends opt-out confirmation via WF-50: "You have been unsubscribed from Chinmay Astro. No further messages will be sent. If you ever wish to consult again, simply message us."

---

### TC-0605 · STOP — from consultation_active user (hold)
**Journey:** J-19 — active consultation guard  
**Priority:** 🟠 P1  
**Owning WFs:** WF-20 → WF-47 → WF-50

**Given:** User has `status = consultation_active`.  
**When:** User sends: "STOP"  
**Then:**
1. WF-47 detects `status = consultation_active`.
2. Sends hold message: "Your active consultation cannot be ended by you. Send STOP again once the session is closed."
3. **No state change.** Consultation continues.

---

### TC-0606 · STOP — from consultation_closed user
**Journey:** J-19  
**Priority:** 🔴 P0  
**Owning WFs:** WF-20 → WF-47 → WF-50

**Given:** User has `status = consultation_closed`.  
**When:** User sends: "STOP"  
**Then:**
1. WF-47 sets `status = opted_out`; logs; sends opt-out confirmation.

---

### TC-0607 · opted_out user messages again (re-engagement)
**Journey:** J-21 (re-engagement)  
**Priority:** 🟠 P1  
**Owning WFs:** WF-01 → WF-21

**Given:** User has `status = opted_out`.  
**When:** User sends any message.  
**Then:**
1. WF-01 loads user record; detects `status = opted_out`.
2. WF-01 routes opted_out → WF-21 (same as new user, NOT silently dropped).
3. WF-21 sends welcome + form message.
4. If user re-submits form, WF-22 handles — existing DB record may be reused (phone match).

**Note:** DB record is NOT deleted on opt-out. Birth details from prior consultation may pre-fill.

---

### TC-0608 · REBOOK keyword — from opted_out user
**Journey:** J-20 / J-21 edge case  
**Priority:** 🟡 P2  
**Owning WFs:** WF-01 → WF-21 (before WF-20 interception)

**Given:** User has `status = opted_out`.  
**When:** User sends: "REBOOK"  
**Then:**
1. WF-01 routes opted_out → WF-21 before WF-02/WF-20 keyword interception.
2. User receives the new-user welcome + form message (REBOOK keyword is lost).
3. This is acceptable per J-21 design — opted_out re-engages as new user.

---

### TC-0609 · STOP — free-form stop intent (not exact keyword)
**Journey:** Intent Filter design — `stop_intent` class  
**Priority:** 🟡 P2  
**Owning WFs:** WF-25 (called from WF-30/WF-31/WF-43) → WF-50

**Given:** User has `status = payment_pending`.  
**When:** User sends: "I don't want to receive any more messages from you."  
**Then:**
1. WF-20 does NOT intercept (not exact "STOP" keyword).
2. WF-30 → WF-25 classifies as `stop_intent`.
3. WF-25/WF-30 sends: "To unsubscribe, please send the word STOP."
4. **No auto-unsubscribe** from free-form text.

---

## TC-07xx — Edge Cases / Non-Text

---

### TC-0701 · Reaction emoji from any user
**Journey:** J-21 (reactions)  
**Priority:** 🟡 P2  
**Owning WFs:** WF-00

**Given:** Any user state.  
**When:** User reacts to a message with a 👍 or ❤️.  
**Then:**
1. WF-00 detects `messageType = reaction`.
2. Silently drops — returns HTTP 200.
3. No response. No state change.

---

### TC-0702 · Blocked user sends message
**Journey:** J-22  
**Priority:** 🟠 P1  
**Owning WFs:** WF-01

**Given:** User has `status = blocked`.  
**When:** User sends any message.  
**Then:**
1. WF-01 loads user — detects `status = blocked`.
2. Message silently dropped — HTTP 200 to Meta.
3. No response to user.
4. Attempt logged to `chinmay_astro.admin_actions`.

---

### TC-0703 · Duplicate webhook delivery (deduplication)
**Journey:** Infrastructure reliability  
**Priority:** 🟠 P1  
**Owning WFs:** WF-00

**Given:** Meta delivers the same webhook twice (retry scenario).  
**When:** Second delivery of a message with the same `inboundMessageId` arrives.  
**Then:**
1. WF-00 checks `inboundMessageId` against recent processed IDs.
2. Duplicate detected — silently dropped.
3. Prevents double processing (double Slack relay, double DB write, etc.).

---

### TC-0704 · WhatsApp message from bot's own number (echo)
**Journey:** Bot-loop prevention (inbound echo)  
**Priority:** 🔴 P0  
**Owning WFs:** WF-00 or WF-01

**Given:** WF-50 sends an outbound WhatsApp message to a user.  
**When:** Meta echoes the sent message back as a webhook delivery (from the bot's own WABA number).  
**Then:**
1. WF-00 or WF-01 detects the sender phone number matches the bot's own WABA number.
2. Message dropped — not routed further.
3. No infinite loop.

**Gap risk:** Not explicitly mentioned in WF-00 or WF-01 registry descriptions. Deduplication by `inboundMessageId` alone may not catch outbound echoes.

---

## TC-08xx — Intent Filter (WF-25)

---

### TC-0801 · garbage intent — warn + notify admin
**Journey:** Intent Filter design  
**Priority:** 🟡 P2  
**Owning WFs:** WF-25 (called by WF-23/WF-30/WF-31/WF-43) → WF-50 → WF-51

**Given:** User in any free-form text state.  
**When:** User sends: "asdfghjkl qwerty 12345"  
**Then:**
1. WF-25 classifies as `garbage`.
2. Calling workflow sends warning to user: "Sorry, we couldn't understand your message. Please try again."
3. Admin notified via WF-51 in Slack (do NOT auto-block for garbage).

---

### TC-0802 · malicious_abusive intent — auto-block
**Journey:** Intent Filter design  
**Priority:** 🟠 P1  
**Owning WFs:** WF-25 → WF-46 → WF-51 → WF-50

**Given:** User in any free-form text state.  
**When:** User sends a violent threat or severely abusive message.  
**Then:**
1. WF-25 classifies as `malicious_abusive`.
2. Warning sent to user.
3. WF-46 auto-blocks user (`status = blocked`).
4. Admin notified in Slack with message content.

---

### TC-0803 · feedback_intent from consultation_closed user (no awaiting_feedback flag)
**Journey:** J-17 / Intent filter  
**Priority:** 🟡 P2  
**Owning WFs:** WF-43 → WF-25 → WF-44

**Given:** User has `status = consultation_closed`, `awaiting_feedback = false`.  
**When:** User sends: "I thought the consultation was absolutely brilliant."  
**Then:**
1. WF-43 → WF-25; classified as `feedback_intent`.
2. WF-43 routes to WF-44.
3. WF-44 saves feedback to DB even though `awaiting_feedback = false`.
4. Sends thank-you message.

**Gap:** WF-44 may require `awaiting_feedback = true` before saving. If so, feedback submitted without tapping the button is silently lost.

---

### TC-0804 · WF-25 API failure (Gemini unavailable)
**Journey:** All free-form text states  
**Priority:** 🟡 P2  
**Owning WFs:** WF-25, callers (WF-23/WF-30/WF-31/WF-43)

**Given:** Gemini API is unreachable or returns an error.  
**When:** WF-25 is called from any workflow.  
**Then:**
1. WF-25 execution fails.
2. Calling workflow (WF-30, etc.) receives an error response.
3. Error is handled gracefully — user receives a generic "Something went wrong, please try again" message.
4. Admin is NOT flooded with error alerts.

**Gap:** No error handling / fallback documented for WF-25 failures.

---

## TC-09xx — Background Jobs (DEFERRED — Post Go-Live)

---

### TC-0901 · Health Check Monitor (J-24)
**Owning WF:** WF-70  
**Status:** ⏳ DEFERRED — not built (🔵 Build Fresh, ⚪ P4)  
**Description:** Hourly cron checks n8n, DB, WhatsApp API health; alerts admin via Slack DM if unhealthy.

---

### TC-0902 · Payment Reminder — stale payment_pending (J-25)
**Owning WF:** WF-71  
**Status:** ⏳ DEFERRED — not built (🔵 Build Fresh, ⚪ P4)  
**Description:** Daily 9 AM IST — sends WhatsApp reminder to users in `payment_pending` for >24 hrs. Requires Meta-approved template (outside 24hr window). After 7 days: mark user inactive.

---

### TC-0903 · Inactive User Scanner (J-26)
**Owning WF:** WF-72  
**Status:** ⏳ DEFERRED — not built (🔵 Build Fresh, ⚪ P4)  
**Description:** Daily 3 AM IST — marks `consultation_closed` users inactive after 90 days.

---

### TC-0904 · Stale Form Cleanup (J-27)
**Owning WF:** WF-73  
**Status:** ⏳ DEFERRED — not built (🔵 Build Fresh, ⚪ P4)  
**Description:** Daily — deletes DB records for users who never submitted the form after 7 days. Note: since DB write only happens on form submission, this may primarily clean up partial/orphaned records.

---

### TC-0905 · Data Retention Cleanup (J-28)
**Owning WF:** WF-74  
**Status:** ⏳ DEFERRED — not built (🔵 Build Fresh, ⚪ P4)  
**Description:** Monthly — anonymises/deletes records beyond retention period per Indian data protection law.

---

## TC-10xx — Missing / Additional Scenarios

---

### TC-1001 · Rebook — Slack channel lifecycle (archived channel reuse)
**Journey:** J-16 / J-20 (gap not in journey map)  
**Priority:** 🟠 P1  
**Owning WFs:** WF-45 → WF-52 → DB

**Given:** User had a prior consultation; `consult-{phone}` Slack channel was **archived** by WF-42 at close. `slack_channel_id` in DB still points to the archived channel.  
**When:** User rebooks (via button or REBOOK keyword); later taps "Payment Completed".  
**Then:**
1. WF-32 reads `slack_channel_id` from DB — this is the **archived** channel ID.
2. WF-32 attempts to post payment notification to archived channel.
3. Slack API rejects post to archived channel → WF-32 execution fails → admin NOT notified.

**Expected Fix:** WF-45 (Rebook Handler) must call WF-52 to create a new `consult-{phone}` channel (or unarchive the existing one) and update `slack_channel_id` in DB before setting `status = payment_pending`.

**New Finding:** Not covered by any existing tech debt. **New gap identified.**

---

### TC-1002 · Admin APPROVE for user in wrong state
**Journey:** J-09 guard  
**Priority:** 🟠 P1  
**Owning WFs:** WF-33

**Given:** User has `status = consultation_active` (already approved) or `consultation_closed`.  
**When:** Admin types `APPROVE PAYMENT <phone>` again.  
**Then:**
1. WF-33 validates user status before state change.
2. Detects user is NOT `payment_submitted` → sends Slack error.
3. No state change occurs.

**Gap risk:** State guard in WF-33 is not confirmed by registry description.

---

### TC-1003 · Admin CLOSE for user not consultation_active
**Journey:** J-11 guard  
**Priority:** 🟠 P1  
**Owning WFs:** WF-42

**Given:** User has `status = payment_pending` (no active consultation).  
**When:** Admin mistakenly types `CLOSE CHAT CONSULT <phone>`.  
**Then:**
1. WF-42 validates user status before proceeding.
2. Detects user is NOT `consultation_active` → sends Slack error.
3. No state change.

**Gap risk:** Not confirmed by registry.

---

### TC-1004 · Admin BLOCK a user who is consultation_active (mid-consultation)
**Journey:** J-12 — active consultation variant  
**Priority:** 🟠 P1  
**Owning WFs:** WF-11 → WF-46

**Given:** User has `status = consultation_active`; consult channel open.  
**When:** Admin types `BLOCK <phone>`.  
**Then:**
1. WF-46 sets `status = blocked`.
2. User's next message is dropped at WF-01 (correctly).
3. **However**, the `consult-{phone}` Slack channel is NOT archived (WF-42 was not called).
4. Admin should manually archive the channel or WF-46 should trigger WF-52.

**Gap:** WF-46 does not archive the Slack channel or set relay mode off when blocking a consultation_active user. Stale channel remains open. New finding — not in existing TDs.

---

### TC-1005 · APPROVE PAYMENT command parsing
**Journey:** J-09  
**Priority:** 🟠 P1  
**Owning WFs:** WF-11

Canonical form is `APPROVE PAYMENT <phone>`. All docs now consistent (TD-031 resolved 2026-05-13).

**Given:** Admin sees a payment notification in the user's Slack channel.  
**When:** Admin types `APPROVE PAYMENT 919876543210`  
**Then:** Command is recognised by WF-11 and WF-33 processes the approval.

**Gap:** Verify WF-11 parser matches `APPROVE PAYMENT` keyword exactly (not `APPROVE CHAT CONSULT`).

---

### TC-1006 · WF-50 called with empty or null message body
**Journey:** Any outbound message workflow  
**Priority:** 🟡 P2  
**Owning WFs:** WF-50

**Given:** Any workflow calls WF-50.  
**When:** The message body passed to WF-50 is `null`, `undefined`, or an empty string.  
**Then:**
1. WF-50 validates the message body before calling Meta Cloud API.
2. If empty/null: execution stops gracefully — no blank WhatsApp message sent to user.

**Gap:** No input validation described in WF-50 registry note.

---

### TC-1007 · User sends empty or whitespace-only message
**Journey:** Any free-form text state  
**Priority:** 🟡 P2  
**Owning WFs:** WF-00 → WF-01 → WF-02 → WF-25 (via calling WF)

**Given:** Any user state accepting free-form text.  
**When:** User sends a message containing only spaces.  
**Then:**
1. Message passes through WF-00 (text type, valid Meta format).
2. WF-25 receives empty/whitespace message text.
3. WF-25 classifies gracefully — does not crash.
4. User receives a polite prompt rather than an error.

---

### TC-1008 · Journey map v2.0 design mismatch — YES/NO consent gate
**Journey:** J-01, J-02, J-04 (journey map spec)  
**Priority:** 🟡 P2 (documentation)  
**Owning WFs:** None — design decision documented in registry

The journey map v2.0 documents a two-step onboarding:
1. J-01: Send consent template → wait for YES/NO
2. J-02: YES → create record → send form
3. J-04: NO → polite exit

**Actual implementation** (per registry critical context, note #1):
- First message = ONE combined free-form message with policy URL + WhatsApp Flow form embedded
- No YES/NO step; submitting form = implicit consent
- J-02, J-04 do NOT exist in production

**Finding:** Journey map is **outdated** and should be updated to reflect the actual design. J-05 ("new/consented free-form messages") maps to the `pendingUser` state (form sent, not yet submitted) handled by WF-23.

---

### TC-1009 · Admin types command in any Slack channel (cross-channel command routing)
**Journey:** J-09/J-10/J-11 — channel agnosticism  
**Priority:** 🟠 P1  
**Owning WFs:** WF-10 → WF-11

**Given:** Admin is in `chinmay-admin-commands` channel (not in user's consult channel).  
**When:** Admin types: `APPROVE PAYMENT 919876543210`  
**Then:**
1. WF-10 captures all workspace events, including from `chinmay-admin-commands`.
2. WF-11 parses the command correctly.
3. WF-33 executes — finds user, updates status.
4. Admin receives confirmation in the channel where they typed.

**Note:** Per CLAUDE.md: "WF-10 captures all workspace events so commands work from any channel." This is the intended design; test confirms it works from chinmay-admin-commands.

---

### TC-1010 · WF-60 message logging on every inbound/outbound message
**Journey:** Background — audit trail  
**Priority:** 🟠 P1  
**Owning WFs:** WF-00 (inbound) → WF-60; WF-50 (outbound) → WF-60  
**Note:** **TD-004** (WF-60 all core nodes disabled — closure in progress).

**Given:** Any inbound or outbound message is processed.  
**When:** WF-00 receives an inbound message OR WF-50 sends an outbound message.  
**Then:**
1. WF-60 is called with message details.
2. WF-60 logs: direction, content, userId, timestamp (IST), inboundMessageId (for dedup).
3. Record appears in `message_log` table.

---

### TC-1011 · WF-52 idempotency — channel already exists
**Journey:** J-03 — Slack channel creation  
**Priority:** 🟠 P1  
**Owning WFs:** WF-52  
**Note:** Relevant to **TD-002** and **TD-007** (WF-52 misnamed as "Create Channel" in callers — closure in progress).

**Given:** `consult-{phone}` channel already exists in Slack (user re-submits form or edge case).  
**When:** WF-52 is called to create the channel.  
**Then:**
1. WF-52 runs `Get All Private Channels`, detects name collision.
2. Returns existing channel info: `{ channelId, channelName, isNew: false }`.
3. Does NOT create a duplicate channel.
4. Caller receives the correct `channelId` regardless.

---

### TC-1012 · WF-33 reads channelId from DB (not from WF-52)
**Journey:** J-09 — payment approval  
**Priority:** 🔴 P0  
**Owning WFs:** WF-33  
**Note:** **TD-002** (WF-33 redundant WF-52 call — closure in progress).

**Given:** User has `status = payment_submitted`; `slack_channel_id` is stored in DB (created at form submission by WF-22).  
**When:** Admin runs APPROVE PAYMENT.  
**Then:**
1. WF-33 loads user record and reads `slack_channel_id` directly from the DB field.
2. WF-33 does **NOT** call WF-52 again to find or re-create the channel.
3. Posts APPROVE notification to the correct channel.

---

### TC-1013 · WF-20 routes HELP keyword with status-aware response
**Journey:** J-18  
**Priority:** 🟡 P2  
**Owning WFs:** WF-20 → WF-50

The journey map requires **5 different contextual responses** from WF-20 for HELP, depending on user status:

| Status | Expected HELP response |
|--------|----------------------|
| new / pendingUser | "Fill in the birth details form to get started" |
| payment_pending | Resend payment instructions |
| payment_submitted | "Payment is being reviewed" |
| consultation_active | "Relay is live — Chinmay can see your messages" |
| consultation_closed | "Send REBOOK to book again" |

**Gap risk:** WF-20 must load the user's current status to provide contextual HELP. If WF-20 sends a single static HELP message regardless of status, it fails J-18's requirements.

---

*End of Functional Test Cases*
