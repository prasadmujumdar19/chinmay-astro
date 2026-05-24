# sub-14 — Cluster D (WF-41 / WF-34) — WF-10 envelope consumers

**WFs:**
- WF-41 (`6PzJRZsF7k2d9hV7`) — **STRICT (latent runtime bug)**: reads `input.adminMessage` but WF-10 Relay Envelope (Wave 1) emits `messageText` — every admin relay would fail at WF-50 entry guard
- WF-34 (`se82n3MUQ9xE5aEr`) — simplify `Load User by Phone` to fetch ONLY `payment_id` (envelope covers all user fields) + rewire 3 downstream nodes

**Items:** TD-DCP-062, TD-DCP-040

## n8n edit plans

### WF-41

```json
{
  "WF-41": {
    "node_modifications": [
      {
        "node_name": "Prepare WhatsApp Message",
        "field": "parameters.jsCode",
        "old_jsCode": "const input = $input.first().json;\n\nreturn [{\n  json: {\n    phoneNumber: input.phoneNumber,\n    messageType: \"text\",\n    messageContent: input.adminMessage\n  }\n}];",
        "new_jsCode": "const input = $input.first().json;\n\nreturn [{\n  json: {\n    phoneNumber: input.phoneNumber,\n    messageType: \"text\",\n    messageContent: input.messageText\n  }\n}];",
        "rationale": "WF-10 Relay Envelope (Wave 1 sub-6a, design.md §2.2 + WF-10.pseudo Step 23a) emits `messageText` as canonical admin message field. WF-41 was reading `adminMessage` — legacy from pre-envelope WF-10 payload. Without this fix, every admin relay would emit messageContent=undefined and fail WF-50's entry guard."
      }
    ],
    "node_removals": [],
    "connection_changes": [],
    "note": "Load User for Relay was already removed in SP-01 (2026-05-22); live .md confirms 3-node topology."
  }
}
```

### WF-34

```json
{
  "WF-34": {
    "node_modifications": [
      {
        "node_name": "Load User by Phone",
        "field": "parameters.query",
        "old_query": "SELECT u.*, p.id as payment_id\nFROM chinmay_astro.users u\nLEFT JOIN chinmay_astro.payments p ON p.user_id = u.id \n  AND p.status = 'pending_verification'\nWHERE u.phone_number = $1\nORDER BY p.created_at DESC\nLIMIT 1",
        "new_query": "SELECT p.id as payment_id\nFROM chinmay_astro.payments p\nJOIN chinmay_astro.users u ON p.user_id = u.id\nWHERE u.phone_number = $1\n  AND p.status = 'pending_verification'\nORDER BY p.created_at DESC\nLIMIT 1",
        "rationale": "Envelope covers user.{id,name,phone_number,status,slack_channel_id}; only payment_id is absent from envelope. Simplify SELECT — keep node (renamed concept) for payment_id fetch only."
      },
      {
        "node_name": "Prepare Rejection Message",
        "field": "parameters.jsCode",
        "new_jsCode": "const trigger = $('When Executed by Another Workflow').first().json;\n\nreturn {\n  json: {\n    phoneNumber: trigger.user.phone_number,\n    messageType: \"interactive\",\n    interactivePayload: {\n      type: \"button\",\n      body: {\n        text: \"We couldn't verify your payment. Please check the details and try again.\\n\\nPayment Instructions:\\nAmount: ₹500\\nPlease send ₹500 via GPay / PhonePe / any UPI app to +91-9653240263 (Chinmay Mujumdar)\\n\\nAfter payment, tap the button below.\"\n      },\n      action: {\n        buttons: [\n          {\n            type: \"reply\",\n            reply: {\n              id: \"payment_completed\",\n              title: \"Payment Completed ✓\"\n            }\n          }\n        ]\n      }\n    }\n  }\n};"
      },
      {
        "node_name": "Prepare WF-51 Payload (Notify Admin Rejected)",
        "field": "parameters.jsCode",
        "new_jsCode": "const trigger = $('When Executed by Another Workflow').first().json;\nconst user = trigger.user;\nconst name = user.name || 'User';\nconst reason = (trigger.reason && trigger.reason.toString().trim()) ? trigger.reason : 'Payment not verified';\n\nreturn [{\n  json: {\n    channelId: user.slack_channel_id,\n    messageText: `❌ Payment rejected for ${name} (+${user.phone_number}). Reason: ${reason}. User notified to retry payment.`\n  }\n}];"
      }
    ],
    "node_removals": [],
    "connection_changes": []
  }
}
```

## Pseudo revisions

### `docs/pseudocode/WF-41.pseudo`

```
WF-41 — Admin → User Relay

## Summary

- Inputs: WF-10 Relay Envelope (design.md §2.2): { phoneNumber, messageText, user:{id,name,phone_number,status,slack_channel_id,current_consultation_id}, adminUserId, channelId, channelName } — carried verbatim from WF-10's `Build WF-10 Relay Envelope` Code node (Step 23a in WF-10.pseudo). No re-derivation needed.
- Outputs: WhatsApp text to user via WF-50
- State Transitions: none
- Calls Sub-Workflows: WF-50 (Send WhatsApp)
- **Notes:**
  - WF-41 is intentionally single-direction (admin → user). The reverse direction (user's WhatsApp message → admin's Slack channel) is handled by **WF-40 User → Admin Relay** (called from WF-02 via the `RELAY` route). Do not re-introduce WA→Slack handling here.
  - Caller contract: WF-10 has already (a) looked up the user by `slack_channel_id`, (b) verified `status == 'consultation_active'`, and (c) shaped the canonical Relay Envelope via the `Build WF-10 Relay Envelope` Code node (design.md §2.2). WF-41 does NOT re-query users or re-derive phone — that would be redundant work and a duplicated state-precondition surface.
  - **Field name:** the admin's message body arrives as `messageText` in the Relay Envelope (canonical per §2.2). WF-41 maps it to `messageContent` when calling WF-50 (canonical WF-50 text variant per design.md §2.3).
  - History:
    - A prior design carried a `whatsapp_to_slack` branch with direction detection (Detect Direction / Route by Direction / Prepare Channel Lookup / Post to Slack Channel). That branch was orphaned after WF-40 took over the WA→Slack relay, and was removed on 2026-05-20 (TD-003 F5) to align this workflow with its single-direction purpose.
    - On 2026-05-22 (SP-01) the redundant phone-extraction (Extract Phone from Channel Code node) and re-lookup (Load User by Phone Postgres node) were removed. The caller (WF-10) now supplies the resolved `phoneNumber` directly, and verifies `consultation_active` upstream. Down from 5 → 3 nodes.
    - On 2026-05-25 (data-contract Phase 1, sub-14) the Inputs block was updated to declare the WF-10 Relay Envelope shape (§2.2), and Step 2 was updated to read `messageText` (Relay Envelope canonical field) instead of the legacy `adminMessage` field from the pre-envelope WF-10 payload.

---

## Algorithm

Step 1: Start — triggered by WF-10 (`Call WF-41 (Admin->User Relay)`) with the canonical Relay Envelope: { phoneNumber, messageText, user, adminUserId, channelId, channelName }.
Step 2: Build WhatsApp payload (Code or Set node "Prepare WhatsApp Message"):
        phoneNumber    = $json.phoneNumber
        messageType    = "text"
        messageContent = $json.messageText
        (Caller has already verified the user is in consultation_active; no DB lookup required here.)
Step 3: Call WF-50 (Send WhatsApp) with the payload. WF-50 calls WF-60 internally to log the outbound message.
Step 4: End.
```

### `docs/pseudocode/WF-34.pseudo`

```
WF-34 — Payment Rejection Processor

## Summary

- Inputs: WF-10 Command Envelope (design.md §2.2) passed through by WF-11: { commandType:'REJECT_PAYMENT', phoneNumber, reason?, adminUserId, channelId, channelName, messageText, user:{id,name,phone_number,status,slack_channel_id} }. Trust-mode: pre-validated by WF-10's centralized gate — user exists, is in `payment_submitted` state, phone-in-command matches channel-derived phone.
- Outputs: Latest pending_verification payment row marked rejected; user status reset to payment_pending; WhatsApp interactive button ("Payment Completed ✓") sent to user with retry instructions; Slack confirmation posted via WF-51 to the user's consult channel.
- State Transitions: payment_submitted → payment_pending (guaranteed by WF-10 pre-validation)
- Calls Sub-Workflows: WF-50 (Send WhatsApp), WF-51 (Send Slack)
- **Notes:**
  - Slack confirmation posts to the user's consult channel (via WF-51) for parity with WF-33.
  - **Field name alignment (2026-05-23):** Input field renamed `rejectionReason` → `reason` to match the convention used by WF-10's centralized classifier and the BLOCK path (WF-46). Pre-rename, WF-34 silently dropped the admin-typed reason (read `$json.rejectionReason`, undefined → SQL COALESCE fallback to 'Payment not verified'). DB column name `rejection_reason` is unchanged; only the in-flight payload field name was renamed.
  - **WA body intentionally generic (MVP):** the `Prepare Rejection Message` interactive payload does not surface the admin's reason in the customer-facing WhatsApp text. Post-MVP work tracker: once Razorpay payment-verification API is integrated, surface its specific failure reason (e.g., "transaction reference mismatch", "amount differs") to the customer-facing body.
  - **Trust-mode input (SP-03):** Input is pre-validated by WF-10's centralized gate — user exists, is in `payment_submitted` state, and phone-in-command matches channel-derived phone. WF-34 does NOT re-validate; the historical `User Found?` + `User in Correct State?` IFs and their feedback branches are removed because they are guaranteed unreachable.
  - **Envelope consumer (data-contract Phase 1, sub-14):** `Load User by Phone` is simplified to fetch only `payment_id` (the one field not carried in the WF-10 Command Envelope). All user-field reads (`name`, `phone_number`, `slack_channel_id`) are rewired to `$('When Executed by Another Workflow').first().json.user.*`.

---

## Algorithm

Step 1: Start — Triggered by WF-11 with WF-10 Command Envelope: {commandType:'REJECT_PAYMENT', phoneNumber, reason?, adminUserId, channelId, channelName, messageText, user:{id,name,phone_number,status,slack_channel_id}}.
Step 2: SELECT p.id as payment_id FROM chinmay_astro.payments p JOIN chinmay_astro.users u ON p.user_id=u.id WHERE u.phone_number=phoneNumber AND p.status='pending_verification' ORDER BY p.created_at DESC LIMIT 1. Capture payment_id. Pre-validated upstream — user row is guaranteed to exist and be in `payment_submitted` state. User fields (name, phone_number, slack_channel_id) are read from the trigger envelope user object; only payment_id requires a DB fetch.
Step 3: UPDATE chinmay_astro.payments SET status='rejected', rejected_at=NOW(), rejection_reason=COALESCE(reason, 'Payment not verified') WHERE id=payment_id RETURNING *.
Step 4: UPDATE chinmay_astro.users SET status='payment_pending', updated_at=NOW() WHERE phone_number=phoneNumber.
Step 5: Build interactive WhatsApp payload:
  - phoneNumber = $('When Executed by Another Workflow').first().json.user.phone_number
  - messageType = "interactive"
  - interactivePayload = button type with body "We couldn't verify your payment. Please check the details and try again.\n\nPayment Instructions:\nAmount: ₹500\nPlease send ₹500 via GPay / PhonePe / any UPI app to +91-9653240263 (Chinmay Mujumdar)\n\nAfter payment, tap the button below." and a single reply button {id: "payment_completed", title: "Payment Completed ✓"}.
Step 6: Call WF-50 with the interactive payload.
Step 7: Build WF-51 payload reading from trigger envelope: channelId=user.slack_channel_id, messageText="❌ Payment rejected for <user.name or 'User'> (+<user.phone_number>). Reason: <reason or 'Payment not verified'>. User notified to retry payment."
Step 8: Call WF-51 with payload from Step 7.
Step 9: End.
```
