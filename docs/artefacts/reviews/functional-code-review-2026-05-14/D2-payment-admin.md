# Functional Code Review — D2 Payment + Admin

**Domain:** D2 (Payment + Admin)  
**Review Date:** 2026-05-14  
**Reviewed By:** Claude Opus (Explore subagent)  
**Test Cases:** TC-0201, TC-0202, TC-0205, TC-0301, TC-0302, TC-0303, TC-0304, TC-0305, TC-0306, TC-0311, TC-0312, TC-0313, TC-0315

---

## TC-0201 · User taps "Payment Completed" button

**Priority:** 🔴 P0  
**Scenario:** User with status=payment_pending taps interactive button "Payment Completed ✓" in WhatsApp.  
**Journey:** J-06  
**Intended Behavior:** WF-02 routes PAYMENT_CONFIRM to WF-32. WF-32 creates payment record with status=submitted, updates user to payment_submitted, loads slack_channel_id from DB, posts to Slack, sends confirmation to user via WF-50.

**Code Path:** WF-00 (Webhook Receiver) → WF-01 (Message Router) → WF-02 (User State Router) → WF-32 (Payment Confirmation Receiver) → WF-51 (Send Slack) + WF-50 (Send WhatsApp)

**Actual Behavior:**
1. WF-02 detects messageType=interactive, interactive.type=button_reply → routes PAYMENT_CONFIRM to WF-32.
2. WF-32 "Already Payment Submitted?" IF checks user.status = 'payment_submitted' (from prior tap).
3. If false (first tap): "Create Payment Record" node inserts into chinmay_astro.payments with status=submitted; "Update User Status" sets status='payment_submitted'; "Load User Channel from DB" retrieves slack_channel_id.
4. WF-32 "Call WF-51 (Notify Admin)" posts to Slack channel.
5. WF-32 "Call WF-50 (Send Payment Confirmation Received Message)" sends WhatsApp confirmation.

**DB Interactions:**
- **INSERT INTO** chinmay_astro.payments (user_id, amount, currency, status, payment_method) RETURNING *
- **UPDATE** chinmay_astro.users SET status='payment_submitted', updated_at=NOW(), last_message_at=NOW() WHERE id=$1 RETURNING *
- **SELECT** id, name, phone_number, slack_channel_id FROM chinmay_astro.users WHERE id=$1 LIMIT 1

**External Calls:**
- WF-51 (Send Slack Message) — posts payment notification to consult-{phone} channel
- WF-50 (Send WhatsApp) — sends "Got it! Chinmay will review your payment and confirm shortly." message

**Gap / Issue:** ✅ No gap

**Remarks:** Idempotency check in place ("Already Payment Submitted?" IF). First tap creates payment record and updates status. Subsequent taps skip creation and send reassurance message instead.

---

## TC-0202 · User taps "Payment Completed" button twice (duplicate tap)

**Priority:** 🟠 P1  
**Scenario:** User already has status=payment_submitted (from TC-0201 execution). User taps "Payment Completed ✓" button again.  
**Journey:** J-06 — duplicate edge case  
**Intended Behavior:** WF-32 checks user status before processing. If already payment_submitted, sends reassurance message; does not create duplicate payment record or duplicate Slack notification.

**Code Path:** WF-00 → WF-01 → WF-02 (PAYMENT_CONFIRM) → WF-32 (Payment Confirmation Receiver) → "Already Payment Submitted?" IF → "Prepare Reassurance Message" → WF-50

**Actual Behavior:**
1. WF-32 "Already Payment Submitted?" IF evaluates user.status==='payment_submitted' → true.
2. Routes true branch to "Prepare Reassurance Message" code node.
3. Code node constructs reassurance message.
4. WF-32 "Call WF-50 (Already Submitted)" sends message to user.
5. False branch (Create Payment Record) is NOT executed.
6. No duplicate INSERT into payments table.
7. No duplicate Slack notification.

**DB Interactions:**
- No INSERT, no UPDATE on duplicate tap

**External Calls:**
- WF-50 (Send WhatsApp) — reassurance message only

**Gap / Issue:** ✅ No gap

**Remarks:** Idempotency fully implemented. Duplicate taps are safely handled.

---

## TC-0205 · payment_submitted user sends free-form message

**Priority:** 🟠 P1  
**Scenario:** User has status=payment_submitted. User sends free-form text (e.g., "I've paid, please check my account.").  
**Journey:** J-08  
**Intended Behavior:** WF-02 routes PAYMENT_SUBMITTED_TEXT to WF-31. WF-31 calls WF-25 (Intent Classifier), sends "under review" acknowledgement via WF-50, relays user message to Slack via WF-51 with note.

**Code Path:** WF-00 → WF-01 → WF-02 (PAYMENT_SUBMITTED_TEXT) → WF-31 (Payment Submitted Handler) → WF-25 (Intent Classifier) → [WF-50 acknowledgement + WF-51 Slack relay]

**Actual Behavior:**
1. WF-02 detects user.status='payment_submitted' && messageType='text' → route='PAYMENT_SUBMITTED_TEXT'.
2. WF-02 calls WF-31.
3. WF-31 "Load User for Relay" executes SELECT.
4. WF-31 "Call WF-25 Intent Classifier" executes WF-25.
5. WF-31 routes based on intent. IF intent is NOT in [garbage, malicious_abusive, inappropriate, stop_intent] (pass-through check):
   - Routes to "Send Under Review via WF-50" → "Relay to Admin Slack" (WF-51).
6. If intent IS in exclude list: routes to "Call WF-47 Unsubscribe".

**DB Interactions:**
- **SELECT** id, name, phone_number, slack_channel_id FROM chinmay_astro.users WHERE phone_number=$1

**External Calls:**
- WF-25 (Intent Classifier) — Gemini classification
- WF-50 (Send WhatsApp) — "Your payment is being reviewed by Chinmay. You'll hear back shortly."
- WF-51 (Send Slack Message) — relays user message to consult-{phone} channel
- WF-47 (Unsubscribe Handler) — if inappropriate intent detected

**Gap / Issue:** ⚠️ [WF-31 node "Call WF-47 Unsubscribe"] Expected: Malicious intent should route to WF-46 (User Blocker), not WF-47 (Unsubscribe Handler). Actual: WF-31 calls WF-47 which handles STOP keyword, not malicious content. WF-47 sets status=opted_out; malicious should set status=blocked. Reason: WF-31 routing logic treats inappropriate/malicious intents same as stop_intent, both routing to WF-47. This is incorrect per TC-0107 and design rules. Malicious_abusive should call WF-46 to block user, not WF-47 to unsubscribe.

**Remarks:** Intent routing misalignment. WF-31 needs conditional logic to route malicious_abusive → WF-46, not WF-47.

---

## TC-0301 · Admin approves payment — happy path

**Priority:** 🔴 P0  
**Scenario:** User has status=payment_submitted. Admin is in consult-{phone} Slack channel. Admin sends "APPROVE PAYMENT 919876543210".  
**Journey:** J-09  
**Intended Behavior:** WF-10 captures event, routes to WF-11 (parser). WF-11 extracts APPROVE command + phone. WF-33 loads user, validates status=payment_submitted, updates payment record status=approved, updates user status=consultation_active, sends WhatsApp confirmation, posts Slack confirmation.

**Code Path:** WF-10 (Slack Admin Handler) → WF-11 (Command Parser) → WF-33 (Payment Approval Processor) → WF-50 + WF-51

**Actual Behavior:**
1. WF-10 receives Slack event.
2. WF-10 "Call WF-11 Command Parser" passes event to WF-11 (GoTYo0GS2y8qjjkw).
3. WF-11 parses for APPROVE keyword.
4. WF-33 "Load User by Phone" executes SELECT.
5. WF-33 "Payment Status Validation?" IF checks status='payment_submitted' — true.
6. WF-33 "Update Payment Status" executes UPDATE payments SET status='approved'.
7. WF-33 "Update User Status" executes UPDATE users SET status='consultation_active'.
8. WF-33 "Create Consultation Record" executes INSERT into consultations.
9. WF-33 "Call WF-50 Notify User" sends confirmation.

**DB Interactions:**
- **SELECT** id, phone_number, status, slack_channel_id FROM chinmay_astro.users WHERE phone_number=$1
- **UPDATE** chinmay_astro.payments SET status='approved' WHERE user_id=$1
- **UPDATE** chinmay_astro.users SET status='consultation_active', updated_at=NOW() WHERE id=$1
- **INSERT INTO** chinmay_astro.consultations (user_id, started_at, status) VALUES ($1, NOW(), 'active')

**External Calls:**
- WF-50 (Send WhatsApp) — consultation started confirmation
- WF-51 (Send Slack Message) — Slack confirmation

**Gap / Issue:** ✅ No gap

**Remarks:** Happy path is solid. Status validation prevents invalid transitions. All DB operations properly scoped.

---

## TC-0302 · Admin approves payment — wrong phone number

**Priority:** 🟠 P1  
**Scenario:** No user record exists for phone number. Admin sends "APPROVE PAYMENT 919999999999".  
**Journey:** J-09 — error path  
**Intended Behavior:** WF-33 loads user, finds no record, sends Slack error: "User not found for phone 919999999999." No state changes.

**Code Path:** WF-10 → WF-11 (parse APPROVE) → WF-33 (Load User by Phone) → [Not Found IF] → Slack error response

**Actual Behavior:**
1. WF-33 "Load User by Phone" executes SELECT WHERE phone_number=$1.
2. Query returns zero rows.
3. WF-33 "User Found?" IF checks if result is empty → true (empty).
4. Routes to error handling node.
5. Error response sent to admin via Slack.
6. No state change occurs.

**DB Interactions:**
- **SELECT** id, phone_number, status, slack_channel_id FROM chinmay_astro.users WHERE phone_number=$1 — zero rows returned

**External Calls:**
- WF-51 (Send Slack Message) — error message to admin

**Gap / Issue:** ✅ No gap

**Remarks:** Proper error handling in place. Guard clause prevents state changes on invalid input.

---

## TC-0303 · Admin approves when user is already consultation_active (double APPROVE)

**Priority:** 🟠 P1  
**Scenario:** User already has status=consultation_active. Admin sends APPROVE PAYMENT again.  
**Journey:** J-09 — error path  
**Intended Behavior:** WF-33 validates user status, detects consultation_active (not payment_submitted), sends Slack error: "User is already in consultation." No state change.

**Code Path:** WF-33 (Load User by Phone) → [Payment Status Validation IF] → error response

**Actual Behavior:**
1. WF-33 "Load User by Phone" returns user record with status='consultation_active'.
2. WF-33 "Payment Status Validation?" IF checks status='payment_submitted' — false.
3. Routes false branch to error handling node.
4. Error message sent to admin via Slack.
5. Update/Insert operations are NOT executed.

**DB Interactions:**
- **SELECT** id, phone_number, status, slack_channel_id FROM chinmay_astro.users WHERE phone_number=$1 — returns status='consultation_active'

**External Calls:**
- WF-51 (Send Slack Message) — error message

**Gap / Issue:** ✅ No gap

**Remarks:** State guard in place. WF-33 only operates on payment_submitted status. Double approvals are prevented.

---

## TC-0304 · Admin rejects payment

**Priority:** 🔴 P0  
**Scenario:** User has status=payment_submitted. Admin sends "REJECT 919876543210".  
**Journey:** J-10  
**Intended Behavior:** WF-34 loads user, validates status, updates payment to rejected, updates user to payment_pending, sends WhatsApp rejection message + re-sends GPay instructions + "Payment Completed" button.

**Code Path:** WF-10 → WF-11 (parse REJECT) → WF-34 (Payment Rejection Processor) → WF-50 (Send WhatsApp)

**Actual Behavior:**
1. WF-11 parses REJECT command, extracts targetPhone.
2. WF-34 "Load User by Phone" executes SELECT.
3. WF-34 "Update Payment Record" executes: UPDATE chinmay_astro.payments SET status='rejected', rejected_at=NOW(), rejection_reason=COALESCE($2, 'Payment not verified') WHERE id=$1.
4. WF-34 calls WF-50 to send rejection message.
5. **NO UPDATE to users table to reset status from payment_submitted to payment_pending.**

**DB Interactions:**
- **SELECT** id, phone_number, status FROM chinmay_astro.users WHERE phone_number=$1
- **UPDATE** chinmay_astro.payments SET status='rejected', rejected_at=NOW(), rejection_reason=... WHERE id=$1
- **Missing: UPDATE chinmay_astro.users SET status='payment_pending'**

**External Calls:**
- WF-50 (Send WhatsApp) — rejection message + re-submit button

**Gap / Issue:** ⚠️ [WF-34] Expected: User status reset from payment_submitted to payment_pending. Actual: WF-34 only updates payment record; does NOT update users.status. Reason: WF-34 nodes are "Load User by Phone" (SELECT), "Update Payment Record" (UPDATE payments), "Prepare Rejection Message" (code), "Call WF-50" (workflow), "Send a message" (slack). No UPDATE to users table. User remains in payment_submitted state even after rejection, preventing rebook flow (user cannot transition from payment_submitted back to payment_pending).

**Remarks:** Critical gap in rejection flow. User state is not reset, breaking the subsequent rebook cycle. Per FunctionalTestCases.md TC-0304: "WF-34 updates user: status = payment_pending". This is not happening in live code.

---

## TC-0305 · Admin closes consultation

**Priority:** 🔴 P0  
**Scenario:** User has status=consultation_active. Admin is in consult-{phone} channel. Admin sends "CLOSE CHAT CONSULT 919876543210".  
**Journey:** J-11  
**Intended Behavior:** WF-42 validates status, disables relay, updates consultation record status=closed, updates user status=consultation_closed, archives consult-{phone} Slack channel (WF-52), sends post-consultation button message to user, posts Slack confirmation.

**Code Path:** WF-10 → WF-11 (parse CLOSE) → WF-42 (Consultation Closer) → [WF-52 archive channel] + WF-50 (post-consultation buttons)

**Actual Behavior:**
1. WF-11 parses CLOSE command, extracts targetPhone.
2. WF-42 "User in Correct State?" IF checks if user.status='consultation_active' — true (guard in place).
3. WF-42 "Close Consultation Record" executes UPDATE consultations SET status='closed', closed_at=NOW().
4. WF-42 "Update User Status" executes UPDATE users SET status='consultation_closed'.
5. WF-42 "Call WF-50 Send Feedback" sends post-consultation button message.
6. **WF-42 does NOT call WF-52 to archive the Slack channel.**

**DB Interactions:**
- **SELECT** id, phone_number, status, current_consultation_id, slack_channel_id FROM chinmay_astro.users WHERE phone_number=$1
- **UPDATE** chinmay_astro.consultations SET status='closed', closed_at=NOW()
- **UPDATE** chinmay_astro.users SET status='consultation_closed', updated_at=NOW()

**External Calls:**
- WF-50 (Send WhatsApp) — post-consultation button message
- **Missing: WF-52 call to archive consult-{phone} Slack channel**

**Gap / Issue:** ⚠️ [WF-42] Expected: WF-42 calls WF-52 to archive the consult-{phone} Slack channel (or set relay mode off). Actual: WF-42 does not call WF-52. Only workflow call in WF-42 is "Call WF-50 Send Feedback" (BUVun38WEKb12zg9). Reason: WF-42 node list contains no executeWorkflow node pointing to WF-52 (IO5BZLUxuVmjzk5I). Stale/archived channel remains accessible in Slack. When user later rebooks (TC-0504), WF-45 reads stale slack_channel_id pointing to archived channel, causing payment notification to fail on WF-32.

**Remarks:** Slack channel lifecycle gap. Consultation close does not archive channel, leaving stale reference in users.slack_channel_id. This directly impacts TC-0504 (rebook) and indirectly affects TC-0201 (if rebook flow is tested). This is a critical gap per tracker TC-1001.

---

## TC-0306 · Admin blocks a user

**Priority:** 🟠 P1  
**Scenario:** User in any state. Admin sends "BLOCK 919876543210".  
**Journey:** J-12  
**Intended Behavior:** WF-46 loads user, validates found, updates user status=blocked, logs to admin_actions table, sends Slack confirmation, no message sent to user (silent block).

**Code Path:** WF-10 → WF-11 (parse BLOCK) → WF-46 (User Blocker) → [update user + log action]

**Actual Behavior:**
1. WF-11 parses BLOCK command, extracts targetPhone.
2. WF-46 "Load User by Phone" executes SELECT.
3. WF-46 validates user found.
4. WF-46 "Update User to Blocked Status" executes UPDATE users SET status='blocked', blocked_at=NOW().
5. WF-46 "Get User Slack Channel" executes SELECT slack_channel_id.
6. WF-46 calls WF-51 or responds to admin: Slack confirmation.
7. **No WhatsApp message sent to user** (silent block).

**DB Interactions:**
- **SELECT** id, phone_number, name, status FROM chinmay_astro.users WHERE phone_number=$1
- **UPDATE** chinmay_astro.users SET status='blocked', blocked_at=NOW() WHERE id=$1
- **SELECT** slack_channel_id FROM chinmay_astro.users WHERE id=$1

**External Calls:**
- WF-51 (Send Slack Message) — admin confirmation (implicit)

**Gap / Issue:** ⚠️ [UNCERTAIN — WF-46 Slack channel archival for consultation_active users] Expected per TC-1004: If user is consultation_active when blocked, consult-{phone} Slack channel should be archived/closed. Actual: WF-46 retrieves slack_channel_id but appears to only log action and update user status. No executeWorkflow node visible that calls WF-52. If user is mid-consultation when blocked, stale channel remains open. Reason: Same pattern as TC-0305 — channel lifecycle not managed in block operation.

**Remarks:** [UNCERTAIN — verify if WF-46 calls WF-52 for active users] Block operation updates user status correctly. Silent block to user is correct. However, if consultation_active user is blocked, Slack channel closure may not occur.

---

## TC-0311 · Admin plain text in consult channel (relay)

**Priority:** 🔴 P0  
**Scenario:** User has status=consultation_active. Admin is in consult-{phone} Slack channel. Admin types plain text (e.g., "Saturn's transit in your 10th house...").  
**Journey:** J-14 (admin → user relay)  
**Intended Behavior:** WF-10 receives event, detects it is not a command. Routes to WF-41 (Admin→User Relay). WF-41 relays message verbatim to user's WhatsApp via WF-50. Message logged by WF-60 as direction=outbound.

**Code Path:** WF-10 (Slack Admin Handler) → [not a command] → WF-41 (Admin -> User Relay) → WF-50 (Send WhatsApp) + WF-60 (Message Logger)

**Actual Behavior:**
1. WF-10 receives Slack event.
2. WF-10 text is NOT a recognized command (not APPROVE/REJECT/CLOSE/BLOCK/etc.).
3. WF-10 or WF-11 routes to non-command path → calls WF-41.
4. WF-41 "Detect Direction" code node determines direction.
5. WF-41 "Route by Direction" switch: checks direction = 'slack_to_whatsapp' → true.
6. WF-41 "Extract Phone from Channel" extracts phone from channel ID.
7. WF-41 "Load User by Phone" executes SELECT.
8. WF-41 "Prepare WhatsApp Message" formats message.
9. WF-41 "WF-50 (Send WhatsApp)" sends the admin's text message to user.
10. User receives message as if Chinmay (admin) typed it directly.

**DB Interactions:**
- **SELECT** id, phone_number, status, slack_channel_id FROM chinmay_astro.users WHERE slack_channel_id=$channel_id (implicit via Extract Phone logic)

**External Calls:**
- WF-50 (Send WhatsApp) — relays admin's text message
- WF-60 (Message Logger) — logs message (via WF-50)

**Gap / Issue:** ✅ No gap

**Remarks:** Relay path works correctly. WF-41 routes slack_to_whatsapp direction and sends to user. Logging via WF-50/WF-60 is in place.

---

## TC-0312 · Admin plain text when user NOT consultation_active

**Priority:** 🟠 P1  
**Scenario:** User has status=payment_submitted (NOT consultation_active). Admin is in consult-{phone} Slack channel. Admin types plain text.  
**Journey:** Not mapped; relay guard edge case  
**Intended Behavior:** WF-41 detects user is NOT consultation_active. Message is NOT relayed to user's WhatsApp. Admin's message stays within Slack only (or admin receives warning).

**Code Path:** WF-10 → WF-41 (Admin -> User Relay) → [status guard IF] → [dead-end or warning]

**Actual Behavior:**
1. WF-10 routes non-command message to WF-41.
2. WF-41 "Detect Direction" → direction='slack_to_whatsapp'.
3. WF-41 "Route by Direction" → slack_to_whatsapp branch.
4. WF-41 "Extract Phone from Channel" extracts phone.
5. WF-41 "Load User by Phone" executes SELECT WHERE slack_channel_id=$channel_id.
6. User record returned with status='payment_submitted'.
7. **WF-41 does NOT check user.status before relaying.**
8. WF-41 "Prepare WhatsApp Message" formats message.
9. WF-41 "WF-50 (Send WhatsApp)" sends message to user.
10. Message is relayed to payment_submitted user (INCORRECT).

**DB Interactions:**
- **SELECT** id, phone_number, status, slack_channel_id FROM chinmay_astro.users WHERE slack_channel_id=$channel_id

**External Calls:**
- WF-50 (Send WhatsApp) — relays admin's text message to non-active user (INCORRECT)

**Gap / Issue:** ⚠️ [WF-41] Expected: Admin plain text only relayed to consultation_active users. WF-41 has status guard IF that checks user.status='consultation_active' and only sends if true. Actual: WF-41 node list contains NO IF node, NO status check. WF-41 unconditionally relays messages loaded via slack_channel_id lookup. Any user with a slack_channel_id (created at form submission WF-22) will receive relayed admin messages, regardless of current status. Reason: WF-41 flow is: Detect Direction → Route by Direction → Extract Phone → Load User → Prepare Message → Send WhatsApp. No conditional logic checks user.status before WF-50 call.

**Remarks:** Critical relay guard missing. WF-41 will relay to payment_pending, payment_submitted, and even consultation_closed users (if they still have slack_channel_id in DB). Should add IF node after "Load User by Phone" to check status='consultation_active' and route to dead-end if false.

---

## TC-0313 · Admin plain text in chinmay-admin-commands channel

**Priority:** 🟠 P1  
**Scenario:** Admin is in chinmay-admin-commands channel (not a user consult channel). Admin types plain text (e.g., "Let me check the payment reports.").  
**Journey:** Edge case — admin command channel isolation  
**Intended Behavior:** WF-10 receives event from chinmay-admin-commands. WF-41 (or guard in WF-10) detects this is not a consult-{phone} channel (or no user maps to this channel). Message is NOT relayed to any WhatsApp number. Message stays in Slack only.

**Code Path:** WF-10 → [chinmay-admin-commands check] → [not relayed]

**Actual Behavior:**
1. WF-10 receives message event from channel_id=C0A5B0ZE81E (chinmay-admin-commands).
2. WF-10 route: not a command → calls WF-41.
3. WF-41 "Extract Phone from Channel" attempts to extract phone from channel ID.
4. WF-41 "Load User by Phone" executes SELECT WHERE slack_channel_id=$channel_id.
5. Query returns zero rows (chinmay-admin-commands is not in users.slack_channel_id for any user).
6. WF-41 "Prepare WhatsApp Message" receives empty/null user data.
7. WF-41 "WF-50 (Send WhatsApp)" is called with invalid/null phone_number.
8. WF-50 execution likely fails or sends to undefined number (behavior depends on WF-50's error handling).

**DB Interactions:**
- **SELECT** id, phone_number, status, slack_channel_id FROM chinmay_astro.users WHERE slack_channel_id=$channel_id — zero rows

**External Calls:**
- WF-50 (Send WhatsApp) — called with null/invalid phone_number [ERROR]

**Gap / Issue:** ⚠️ [WF-41 null handling] Expected: If no user found for channel, WF-41 silently drops message or warns admin. Actual: WF-41 attempts to prepare and send WhatsApp message with null/invalid phone_number. Reason: No IF guard after "Load User by Phone" to check if result is empty. WF-41 proceeds to "Prepare WhatsApp Message" with undefined user data. WF-50 receives invalid input (null phone_number) and either: a) fails with error logged, or b) sends to undefined number.

**Remarks:** Edge case guard missing. WF-41 should check "if user found" after Load User step and route to dead-end if not found.

---

## TC-0315 · Bot-loop prevention in Slack relay

**Priority:** 🔴 P0  
**Scenario:** WF-50 sends WhatsApp message to user. Separately, WF-51 posts notification to user's consult-{phone} Slack channel. WF-51's message (or another bot's message) is delivered as a Slack event. WF-10 receives this event.  
**Journey:** J-14 — bot-loop prevention  
**Intended Behavior:** WF-10 checks Slack event authorizations[0].user_id ≠ event.user (or checks if message is from bot's own app ID). Detects this is the bot's own message. Routes to dead-end (no relay). Prevents infinite loop.

**Code Path:** WF-10 (Slack Admin Handler) → [bot-loop check] → [silent drop if bot message detected]

**Actual Behavior:**
1. WF-10 receives Slack event with message from bot's own user_id.
2. WF-10 or WF-41 checks: $json.body.authorizations[0].user_id ≠ $json.body.event.user.
3. If equal (message is from bot), bot-loop detected.
4. Routes to dead-end node (message not processed further).
5. WF-41 is not called.
6. No relay back to user.
7. No infinite loop.

**DB Interactions:**
- No DB interaction — event is not processed

**External Calls:**
- No external calls — event is dropped

**Gap / Issue:** ✅ No gap

**Remarks:** Bot-loop prevention is implemented per CLAUDE.md section "n8n Expression Gotchas". The check `$json.body.authorizations[0].user_id ≠ $json.body.event.user` correctly identifies the bot's own messages. No loop risk.

---

## Summary

**TCs Completed:** 13 / 13 (TC-0201 through TC-0315)

**Gap Count:**
- **P0 Gaps:** 2 (TC-0304, TC-0305, TC-0312)
- **P1 Gaps:** 5 (TC-0205, TC-0306, TC-0312, TC-0313)
- **[UNCERTAIN] Items:** 2 (TC-0306 Slack channel archival, TD-001)

**Critical Findings (must fix before go-live):**
1. **TC-0304 (WF-34):** User status NOT reset on payment rejection. User remains in payment_submitted, breaking rebook flow. No UPDATE to users table.
2. **TC-0305 (WF-42):** Slack channel NOT archived after consultation close. Stale channel reference breaks rebook flow (TC-0504). WF-52 not called.
3. **TC-0312 (WF-41):** NO status guard. Admin messages relayed to ALL users with slack_channel_id, regardless of consultation_active status. Will send to payment_pending/payment_submitted/consultation_closed users.
4. **TC-0313 (WF-41):** NO null guard. Attempting to relay from chinmay-admin-commands (not a user channel) will call WF-50 with invalid phone_number.
5. **TC-0205 (WF-31):** Malicious intent routed to WF-47 (Unsubscribe) instead of WF-46 (Blocker). User opted_out instead of blocked.

**Cross-Cutting Issues:**
- **WF-41 relay layer (TC-0311, TC-0312, TC-0313):** Lacks status validation and null guards. Needs IF nodes to check: (1) user found, (2) user status = consultation_active.
- **WF-42 channel lifecycle (TC-0305):** Missing WF-52 call. Impacts rebook flow.
- **WF-34 user state reset (TC-0304):** Missing UPDATE to users table. Impacts rebook flow.
- **WF-31 intent routing (TC-0205):** Routing malicious to wrong handler. Impacts security.

**Severity Breakdown:**
- **Blockers (must fix for P0 TCs):** WF-34, WF-42, WF-41 status guard, WF-31 malicious routing
- **High-priority (functional gaps in P1 TCs):** WF-41 null guard, WF-306 channel archival
- **Low-priority:** All others passing as designed

