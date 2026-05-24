# sub-13 — Cluster C (WF-32 / WF-33 / WF-42 / WF-46) — BOTH envelopes

**WFs (all confirmed Load-User SELECT removals per §3.4):**
- WF-32 (`emUOLWVZiNVxcOe3`) — remove `Load User Channel from DB`
- WF-33 (`NcHZedq9ycnAQ9SW`) — remove `Load User by Phone`
- WF-42 (`fx70vqyJtRdF2DgR`) — remove `Load User by Phone`
- WF-46 (`UV62An60fzflU0uD`) — remove `Load User by Phone`

**Items:** TD-DCP-052, TD-DCP-062

**OUT OF SCOPE (do NOT fix):** TD-DRIFT-017 (WF-33 `verified_by` column) — design.md §1.5.

## n8n edit plans

### WF-32

```json
{
  "WF-32": {
    "node_modifications": [
      {
        "node_name": "Prepare Admin Notification",
        "field": "parameters.jsCode",
        "new_jsCode": "const user = $('When Executed by Another Workflow').item.json.user;\nconst channelId = user.slack_channel_id;\nconst paymentId = $('Create Payment Record').first().json.id;\n\nreturn [{\n  json: {\n    channelId: channelId,\n    messageText: '🔔 *New Payment Submission*\\n\\n*User:* ' + user.name + '\\n*Phone:* +' + user.phone_number + '\\n*Amount:* ₹500\\n*Payment ID:* ' + paymentId + '\\n\\nPlease verify payment and run:\\n`APPROVE PAYMENT ' + user.phone_number + '`'\n  }\n}];"
      }
    ],
    "node_removals": [
      { "node_name": "Load User Channel from DB", "rationale": "§3.4 Type A removal — WF-01 envelope provides id/name/phone_number/slack_channel_id" }
    ],
    "connection_changes": [
      "Remove: Call WF-50 (Send Payment Confirmation Received Message) --> Load User Channel from DB",
      "Remove: Load User Channel from DB --> Prepare Admin Notification",
      "Add: Call WF-50 (Send Payment Confirmation Received Message) --> Prepare Admin Notification"
    ]
  }
}
```

### WF-33

```json
{
  "WF-33": {
    "node_modifications": [
      {
        "node_name": "Update Payment Status",
        "field": "parameters.options.queryReplacement",
        "new_value": "={{ $('Extract Command Data').item.json.adminUserId }}, {{ $('When Executed by Another Workflow').item.json.user.id }}",
        "note": "Was: $('Extract Command Data').item.json.adminUserId, $json.id — $json.id used to come from Load User by Phone; now must reference envelope user.id explicitly."
      },
      {
        "node_name": "Update User Status",
        "field": "parameters.options.queryReplacement",
        "new_value": "={{ $('When Executed by Another Workflow').item.json.user.id }}"
      },
      {
        "node_name": "Create Consultation Record",
        "field": "parameters.options.queryReplacement",
        "new_value": "={{ $('When Executed by Another Workflow').item.json.user.id }}, {{ $('Update Payment Status').item.json.id }}"
      },
      {
        "node_name": "Prepare User Activation Message",
        "field": "parameters.jsCode",
        "new_jsCode": "const user = $('When Executed by Another Workflow').item.json.user;\n\nreturn [{\n  json: {\n    phoneNumber: user.phone_number,\n    messageType: \"template\",\n    templateName: \"consultation_activated\",\n    templateParams: [user.name]\n  }\n}];"
      },
      {
        "node_name": "Prepare WF-51 Payload (Notify Admin)",
        "field": "parameters.jsCode",
        "new_jsCode": "const user = $('When Executed by Another Workflow').item.json.user;\n\nreturn [{\n  json: {\n    channelId: user.slack_channel_id,\n    messageText: `✅ Payment approved for ${user.name} (${user.phone_number}). User notified via WhatsApp; consultation is now active.`\n  }\n}];"
      }
    ],
    "node_removals": [
      { "node_name": "Load User by Phone", "rationale": "§3.4 Type A — envelope covers all consumed fields" }
    ],
    "connection_changes": [
      "Remove: Extract Command Data --> Load User by Phone",
      "Remove: Load User by Phone --> Update Payment Status",
      "Add: Extract Command Data --> Update Payment Status"
    ]
  }
}
```

### WF-42

```json
{
  "WF-42": {
    "node_modifications": [
      {
        "node_name": "Close Consultation Record",
        "field": "parameters.options.queryReplacement",
        "new_value": "={{ $('When Executed by Another Workflow').item.json.user.id }}"
      },
      {
        "node_name": "Update User Status",
        "field": "parameters.options.queryReplacement",
        "new_value": "={{ $('When Executed by Another Workflow').item.json.user.id }}"
      },
      {
        "node_name": "Prepare Feedback Message",
        "field": "parameters.jsCode",
        "new_jsCode": "const user = $('When Executed by Another Workflow').item.json.user;\n\nreturn [{\n  json: {\n    phoneNumber: user.phone_number,\n    messageType: 'interactive',\n    interactivePayload: {\n      type: 'button',\n      body: {\n        text: '✨ Your consultation with Chinmay is complete, ' + user.name + '! We hope it was insightful.\\n\\nWould you like to share your experience or book another session?'\n      },\n      action: {\n        buttons: [\n          { type: 'reply', reply: { id: 'btn_feedback', title: 'Leave Feedback' } },\n          { type: 'reply', reply: { id: 'btn_rebook', title: 'Book Again' } }\n        ]\n      }\n    }\n  }\n}];"
      },
      {
        "node_name": "Prepare WF-51 Payload (Notify Admin Closed)",
        "field": "parameters.jsCode",
        "new_jsCode": "const user = $('When Executed by Another Workflow').item.json.user;\n\nreturn [{\n  json: {\n    channelId: user.slack_channel_id,\n    messageText: `✅ Consultation closed for ${user.name} (${user.phone_number}). Feedback prompt sent via WhatsApp; channel kept open for future rebook.`\n  }\n}];"
      }
    ],
    "node_removals": [
      { "node_name": "Load User by Phone", "rationale": "§3.4 Type A — envelope covers id/name/phone_number/slack_channel_id" }
    ],
    "connection_changes": [
      "Remove: When Executed by Another Workflow --> Load User by Phone",
      "Remove: Load User by Phone --> Close Consultation Record",
      "Add: When Executed by Another Workflow --> Close Consultation Record"
    ]
  }
}
```

### WF-46

```json
{
  "WF-46": {
    "node_modifications": [
      {
        "node_name": "Update User to Blocked Status",
        "field": "parameters.options.queryReplacement",
        "new_value": "={{ $('When Executed by Another Workflow').item.json.user.id }}"
      },
      {
        "node_name": "Prepare WF-51 Payload (Notify Admin Blocked)",
        "field": "parameters.jsCode",
        "new_jsCode": "const user = $('When Executed by Another Workflow').item.json.user;\nconst trigger = $('When Executed by Another Workflow').first().json;\nconst channelId = trigger.channelId || user.slack_channel_id;\nconst reason = (trigger.reason && trigger.reason.toString().trim()) ? trigger.reason : 'Not provided';\n\nreturn [{\n  json: {\n    channelId: channelId,\n    messageText: `🚫 User blocked: ${user.name} (${user.phone_number}). Reason: ${reason}. Status set to 'blocked'.`\n  }\n}];"
      }
    ],
    "node_removals": [
      { "node_name": "Load User by Phone", "rationale": "§3.4 Type A — both callers (WF-10 via WF-11 + WF-25 via WF-01) pass user in envelope" }
    ],
    "connection_changes": [
      "Remove: When Executed by Another Workflow --> Load User by Phone",
      "Remove: Load User by Phone --> Update User to Blocked Status",
      "Add: When Executed by Another Workflow --> Update User to Blocked Status"
    ]
  }
}
```

## Pseudo revisions

### `docs/pseudocode/WF-32.pseudo`

```
WF-32 — Payment Confirmation Receiver

## Summary

- Inputs: WF-01 §2.1 core envelope — { phoneNumber, messageType, messageContent, user:{id, phone_number, name, status, slack_channel_id, current_consultation_id}, pendingUser } — triggered when user taps "Payment Completed" button (from WF-01 routing via WF-02)
- Outputs: New row in payments table; user status moved to payment_submitted; WhatsApp confirmation to user; Slack notification to admin in the user's consult channel
- State Transitions: payment_pending → payment_submitted (if not already submitted); otherwise no change
- Calls Sub-Workflows: WF-50 (Send WhatsApp), WF-51 (Send Slack). Does NOT call WF-52 — reads existing slack_channel_id from envelope (set at WF-22).

---

## Algorithm

Step 1: Start — Triggered by WF-01 (via WF-02) with §2.1 envelope: { phoneNumber, messageType, messageContent, user:{id, phone_number, name, status, slack_channel_id, current_consultation_id}, pendingUser }.
Step 2: Check: Is user.status == "payment_submitted" already?
  - If YES → go to Step 3 (duplicate tap — reassure only)
  - If NO → go to Step 5 (first-time tap)
Step 3: Build reassurance message: "Your payment has already been received and is under review ✅ Chinmay will approve your consultation shortly — please wait a moment! 🙏" with phoneNumber = user.phone_number, messageType=text.
Step 4: Call WF-50 with phoneNumber, messageType, messageContent. Go to Step 11.

(First-time tap)
Step 5: INSERT INTO chinmay_astro.payments (user_id, amount, currency, status, payment_method) VALUES (user.id, 500, 'INR', 'pending_verification', 'gpay') RETURNING *. Capture payment.id.
Step 6: UPDATE chinmay_astro.users SET status='payment_submitted', updated_at=NOW(), last_message_at=NOW() WHERE id=user.id RETURNING *. Capture updated user row.
Step 7: Build user confirmation: phoneNumber = updated user.phone_number; messageType=text; messageContent = "Thank you <name>! Your payment confirmation has been received. We'll verify your payment and activate your consultation within 24 hours. You'll receive a confirmation message once approved."
Step 8: Call WF-50 with phoneNumber, messageType, messageContent.
Step 9: Build admin notification using envelope fields — channelId = user.slack_channel_id (from §2.1 envelope); messageText = "🔔 New Payment Submission\nUser: <user.name>\nPhone: +<user.phone_number>\nAmount: ₹500\nPayment ID: <payment.id>\nPlease verify payment and run: APPROVE PAYMENT <user.phone_number>".
Step 10: Call WF-51 (Send Slack) with the admin notification payload.
Step 11: End.
```

### `docs/pseudocode/WF-33.pseudo`

```
WF-33 — Payment Approval Processor

## Summary

- Inputs: WF-10 §2.2 Command Envelope — { commandType, phoneNumber, reason, adminUserId, channelId, channelName, messageText, user:{id, name, phone_number, status, slack_channel_id} } — triggered by WF-11 command parser when admin sends "APPROVE PAYMENT <phone>"
- Outputs: Payment row marked approved; user status moved to consultation_active; new consultations row; user.current_consultation_id set; WhatsApp template "consultation_activated" sent to user; Slack confirmation posted to user's consult channel via WF-51. If user is in wrong state, only a Slack warning is posted via WF-51.
- State Transitions: payment_submitted → consultation_active (only if user is currently payment_submitted)
- Calls Sub-Workflows: WF-50 (Send WhatsApp), WF-51 (Send Slack). Does NOT call WF-52 — channel already exists (created at WF-22).
- **Notes:**
  - Slack posts go to the user's consult channel (`user.slack_channel_id` from envelope) — consistent with the rule that `APPROVE PAYMENT` is issued from inside that channel.
  - All outbound Slack posts route through WF-51 for consistency across the WF-3x payment family.
- **Trust-mode input (SP-03):** Input is pre-validated by WF-10's centralized gate — user exists, is in `payment_submitted` state, and phone-in-command matches channel-derived phone. WF-33 does NOT re-validate. The historical `Load User by Phone` SELECT is removed: all required fields (id, slack_channel_id, name, phone_number) are provided in the §2.2 Command Envelope `user` object.

---

## Algorithm

Step 1: Start — Triggered by WF-11 with §2.2 Command Envelope: { commandType, phoneNumber, reason, adminUserId, channelId, channelName, messageText, user:{id, name, phone_number, status, slack_channel_id} }.
Step 2: Extract command data: keep phoneNumber, adminUserId, command, subCommand from envelope.
Step 3: UPDATE chinmay_astro.payments SET status='approved', verified_at=NOW(), verified_by=adminUserId WHERE user_id=user.id AND status='pending_verification' RETURNING id. Capture payment.id. (user.id read from §2.2 envelope.)
Step 4: UPDATE chinmay_astro.users SET status='consultation_active', updated_at=NOW() WHERE id=user.id RETURNING *. (user.id read from §2.2 envelope.)
Step 5: INSERT INTO chinmay_astro.consultations (user_id, payment_id, status, started_at) VALUES (user.id, payment.id, 'active', NOW()) RETURNING *. Capture consultation.id. (user.id read from §2.2 envelope.)
Step 6: UPDATE chinmay_astro.users SET current_consultation_id=consultation.id, updated_at=NOW() WHERE id=user.id RETURNING *.
Step 7: Build user activation message: phoneNumber = user.phone_number (from §2.2 envelope); messageType=template; templateName="consultation_activated"; templateParams=[user.name (from §2.2 envelope)].
Step 8: Call WF-50 with the template payload (WhatsApp template message to user).
Step 9: Call WF-51 with channelId=user.slack_channel_id (from §2.2 envelope), messageText="✅ Consultation Activated — User: <name>, Phone: +<phone_number>, DOB: <date_of_birth>, TOB: <time_of_birth>, Place: <place_of_birth>. User has been notified. They can now send their questions. To close consultation when done, type: CLOSE CHAT CONSULT <phone_number>".
Step 10: End.

**Note:** TD-DRIFT-017 (verified_by column receiving channelId instead of adminUserId) is out of Phase 1 scope per design.md §1.5 — do not fix here.
```

### `docs/pseudocode/WF-42.pseudo`

```
WF-42 — Consultation Closer

## Summary

- Inputs: WF-10 §2.2 Command Envelope — { commandType, phoneNumber, reason, adminUserId, channelId, channelName, messageText, user:{id, name, phone_number, status, slack_channel_id} } — triggered by WF-11 (admin CLOSE handler)
- Outputs: consultations row closed, users row updated, WhatsApp feedback/rebook prompt sent (2 buttons), Slack confirmation in consult channel
- State Transitions: consultation_active → consultation_closed
- Calls Sub-Workflows: WF-50 (Send WhatsApp), WF-51 (Send Slack via Notify Admin in Slack node)
- **Design rule (DR-10):** Slack channel is NOT archived — same channel is reused on rebook (WF-45 reads existing slack_channel_id from DB). Channel archival/deletion is a separate post-MVP maintenance workflow.
- **Trust-mode input (SP-03):** Input is pre-validated by WF-10's centralized gate — user exists, is in `consultation_active` state, and phone-in-command matches channel-derived phone. WF-42 does NOT re-validate. The historical `Load User by Phone` SELECT is removed: all required fields (id, name, phone_number, slack_channel_id) are provided in the §2.2 Command Envelope `user` object.

---

## Algorithm

Step 1: Start — triggered by WF-11 (admin CLOSE handler) with §2.2 Command Envelope: { commandType, phoneNumber, reason, adminUserId, channelId, channelName, messageText, user:{id, name, phone_number, status, slack_channel_id} }.
Step 2: UPDATE chinmay_astro.consultations SET status='closed', ended_at=NOW(), closed_by='admin' WHERE user_id = user.id AND status='active' RETURNING *. (user.id read from §2.2 envelope.)
Step 3: UPDATE chinmay_astro.users SET status='consultation_closed', current_consultation_id=NULL, total_consultations = total_consultations + 1, updated_at=NOW() WHERE id = user.id RETURNING *. (user.id read from §2.2 envelope.)
Step 4: Build interactive WhatsApp payload using envelope fields (two buttons):
  - phoneNumber = user.phone_number (from §2.2 envelope)
  - body.text = "✨ Your consultation with Chinmay is complete, <user.name>! We hope it was insightful.\n\nWould you like to share your experience or book another session?"
  - buttons: [ {id: btn_feedback, title: "Leave Feedback"}, {id: btn_rebook, title: "Book Again"} ]
Step 5: Call WF-50 with phoneNumber, messageType=interactive, interactivePayload=<payload above>.
Step 6: Post to Slack channel using envelope fields — channelId = user.slack_channel_id (from §2.2 envelope); messageText = "✅ Consultation closed for <user.name> (<user.phone_number>). Feedback prompt sent via WhatsApp; channel kept open for future rebook."
Step 7: Call WF-51 with the Slack notification payload.
Step 8: End.
```

### `docs/pseudocode/WF-46.pseudo`

```
WF-46 — User Blocker

## Summary

- Inputs: WF-10 §2.2 Command Envelope (BLOCK path via WF-11) OR WF-01 §2.1 envelope (WF-25 malicious_abusive/inappropriate intent path) — { phoneNumber, reason, channelId, user:{id, name, phone_number, slack_channel_id} }. channelId is the caller's source channel; falls back to user.slack_channel_id (from envelope) when absent (e.g., WF-25 path).
- Outputs: users row updated to blocked; admin Slack confirmation posted via WF-51 to caller's channelId (or user's consult channel as fallback).
- State Transitions: any → `blocked`
- Calls Sub-Workflows: WF-51 (Send Slack Message)
- **Single-owner principle:** WF-46 is the sole emitter of the post-block Slack confirmation. Callers (WF-11, WF-25) MUST NOT post their own block confirmation — duplicate removed from WF-11 on 2026-05-23 (BUG-05 sibling fix). Mirrors the same pattern applied to CLOSE (WF-42 owns), APPROVE (WF-33 owns), REJECT (WF-34 owns).
- **Notes:**
  - **No channel archive** — DR-10 design rule (consultation channels intentionally preserved for REBOOK reuse). Channel-archive nodes removed 2026-05-17 (FU-1); pseudo updated to match 2026-05-23.
  - **DB schema vs trigger input drift:** `Update User to Blocked Status` hardcodes `blocked_reason='Blocked by admin'` in the DB column; the caller's `reason` is used only in the admin Slack message (Step 3 payload), not persisted. Followup to honor caller-provided reason in the column (TD candidate).
  - **No `admin_actions` INSERT** — admin_actions table is deprecated per [[project_admin_actions_deprecated]]; single-admin model means messages + state machine cover the audit need.
  - **Load User by Phone removed:** both callers now pass user object in the envelope. The historical SELECT is no longer needed — user.id (for UPDATE WHERE), user.name and user.phone_number (for Slack message), and user.slack_channel_id (channelId fallback) are all in the §2.2 / §2.1 envelope.

---

## Algorithm

Step 1: Start — triggered by another workflow with §2.2 Command Envelope (or §2.1 envelope for WF-25 path): { phoneNumber, reason, channelId, user:{id, name, phone_number, slack_channel_id} }.
Step 2: Update user to blocked: UPDATE chinmay_astro.users SET status='blocked', blocked_at=NOW(), blocked_by='admin', blocked_reason='Blocked by admin', updated_at=NOW() WHERE id=user.id RETURNING *. (user.id read from envelope. See drift note above — `blocked_reason` is hardcoded; caller's `reason` is used only in the Slack confirmation.)
Step 3: Prepare WF-51 payload — channelId = envelope.channelId (or user.slack_channel_id as fallback for WF-25 path); messageText = "🚫 User blocked: <user.name> (<user.phone_number>). Reason: <reason or 'Not provided'>. Status set to 'blocked'.". (user.name, user.phone_number, and user.slack_channel_id all read from envelope.)
Step 4: Call WF-51 (Send Slack Message) with the prepared payload. End.
```
