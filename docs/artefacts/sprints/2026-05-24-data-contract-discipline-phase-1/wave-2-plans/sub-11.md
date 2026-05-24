# sub-11 — Cluster A (WF-21 / WF-23 / WF-30 / WF-31)

**WFs:**
- WF-21 (`zM8WbxSdt9nXRoLZ`) — pseudo-only, no n8n edits
- WF-23 (`VpCER0Vqq3NYJGpI`) — pseudo-only, no n8n edits
- WF-30 (`gGJBY5fJha0Let8I`) — **STRICT**: rename legacy `message`→`messageContent`
- WF-31 (`HB8nXudAtk9iXz7C`) — **STRICT**: rename legacy `message`, remove `Load User for Relay`, rewire

**Items:** TD-DCP-052, TD-DCP-040, TD-DCP-030

## n8n edit plans

### WF-21 / WF-23 — no n8n edits

Both already canonical: WF-21 Build Welcome Message uses `messageType='interactive'`/`messageContent`/`interactivePayload`. WF-23 stop-clarifier + Prepare Flow Form already canonical. WF-25 caller field name (`messageText` vs `messageContent`) is TD-DRIFT-009 — deferred per design.md §1.5.

### WF-30

```json
{
  "WF-30": {
    "node_modifications": [
      {
        "node_name": "Prepare Payment Reminder",
        "field": "parameters.jsCode",
        "new_jsCode": "const d = $input.first().json;\nconst intent = d.intentResult;\nlet contextual = \"\";\nif (intent === 'wants_consultation') {\n  contextual = \"Great! You're almost there. To confirm your consultation, please complete the payment below.\\n\\n\";\n} else if (intent === 'rebook_intent') {\n  contextual = \"For rebooking, please complete the pending payment first.\\n\\n\";\n} else {\n  contextual = \"Happy to help! Once your payment is confirmed, Chinmay will be ready for your consultation.\\n\\n\";\n}\nconst paymentMsg = contextual + \"💰 *Payment Details*\\nSend ₹500 via GPay / PhonePe / any UPI app to:\\n*+91-9653240263 (Chinmay Mujumdar)*\\n\\nOnce done, tap the \\\"Payment Completed\\\" button you received earlier.\";\nreturn [{ json: { phoneNumber: d.phoneNumber, messageType: 'text', messageContent: paymentMsg } }];"
      },
      {
        "node_name": "Send Payment Reminder via WF-50",
        "field": "parameters.workflowInputs.value",
        "change": "Update defineBelow mapping: rename `message` field to `messageContent`; add `messageType` field mapping `={{ $json.messageType }}`."
      }
    ]
  }
}
```

### WF-31

```json
{
  "WF-31": {
    "node_modifications": [
      {
        "node_name": "Prepare Under Review Message",
        "field": "parameters.jsCode",
        "new_jsCode": "const d = $input.first().json;\nconst msg = \"⏳ *Your payment is currently under review.*\\n\\nChinmay will verify it and get back to you shortly (usually within a few hours). You don't need to do anything else right now.\\n\\nIf you have any questions, feel free to ask!\";\nreturn [{ json: { phoneNumber: d.phoneNumber, messageType: 'text', messageContent: msg } }];"
      },
      {
        "node_name": "Prepare Admin Relay",
        "field": "parameters.jsCode",
        "new_jsCode": "const triggerData = $('When Executed by Another Workflow').item.json;\nconst slackChannelId = triggerData.user?.slack_channel_id;\nconst userMessage = triggerData.messageContent || '';\nconst userName = triggerData.user?.name || triggerData.phoneNumber || 'user';\n\nreturn [{\n  json: {\n    channelId: slackChannelId,\n    messageText: `💬 *Message from ${userName} (payment under review):*\\n>${userMessage}`\n  }\n}];"
      }
    ],
    "node_removals": [
      {
        "node_name": "Load User for Relay",
        "rationale": "Redundant — slack_channel_id now from WF-01 envelope at user.slack_channel_id"
      }
    ],
    "connection_changes": [
      "Remove: When Executed by Another Workflow --> Load User for Relay",
      "Remove: Load User for Relay --> Prepare Admin Relay",
      "Add: When Executed by Another Workflow --> Prepare Admin Relay (Branch B fan-out)"
    ]
  }
}
```

## Pseudo revisions

### `docs/pseudocode/WF-21.pseudo`

```
WF-21 — New User Welcome + Form

## Summary

- Inputs (WF-01 canonical envelope per data-contract-discipline Phase 1 — design.md §2.1): `phoneNumber` (E.164 string), `messageType`, `messageContent`, `user` (object: {id, phone_number, name, status, slack_channel_id, current_consultation_id} or null for new users), `pendingUser` ({id, contact_name} or null). Additional fields passed by WF-01/WF-02: `contactName`, `messageId`, `wasOptedOut` (boolean, optional — true when called by WF-01 for opted_out re-engagement).
- Outputs: One outbound WhatsApp interactive message containing welcome text + privacy policy URL + WhatsApp Flow form CTA. A row in `pending_users` keyed by phone_number.
- State Transitions: none in `users` table (no `users` row yet — first `users` write happens in WF-22 on form submission). Writes to `pending_users` only. Opted_out users: status STAYS `opted_out` until they submit the form (WF-22 overwrites to `payment_pending`).
- Calls Sub-Workflows: WF-50 (Send WhatsApp)

---

## Algorithm

Step 1: Start — workflow triggered by WF-02 (new user) or WF-01 (opted_out re-engagement) with WF-01 canonical envelope plus `contactName`, `messageId`, `wasOptedOut`. Read `phoneNumber` from top-level envelope field (canonical; do NOT use `user.phone_number` for phone-only purposes per §2.1). Read `contactName` from top-level envelope field.
Step 2: INSERT INTO chinmay_astro.pending_users (phone_number, contact_name, created_at) VALUES (phoneNumber, contactName, NOW()) ON CONFLICT (phone_number) DO UPDATE SET contact_name = EXCLUDED.contact_name, created_at = NOW() RETURNING phone_number. This is intentionally NOT a `users` write — design rule: first `users` row is created in WF-22 after form submission.
Step 3: Build the welcome message:
  - If wasOptedOut == true: prepend "👋 Welcome back to Chinmay Astro! We're glad you're back. " to the greeting.
  - Plain text body: (welcome-back prefix if applicable) + greeting, intro from Chinmay, privacy policy URL (https://chinmaymujumdar.com/privacy-policy), how-it-works bullets (form → ₹500 → consultation), and prompt to fill the form.
  - Interactive payload: type="flow", header="Birth Details Form", body=welcome text, flowId="1408011897720771", flowCta="Fill Details".
Step 4: Call WF-50 with { phoneNumber, messageType="interactive", messageContent=welcome text, interactivePayload=the flow object } per §2.3 canonical contract.
Step 5: End.
```

### `docs/pseudocode/WF-23.pseudo`

```
WF-23 — Pre-Form Intent Filter

## Summary

- Inputs (WF-01 canonical envelope per data-contract-discipline Phase 1 — design.md §2.1): `phoneNumber` (E.164 string), `messageType`, `messageContent`, `user` (object or null), `pendingUser` ({id, contact_name} or null). Additional field passed by WF-02: `messageText` (free-form text for WF-25 input; note: WF-25 reads `messageContent` but callers pass `messageText` — tracked as TD-DRIFT-009, deferred from Phase 1 per §1.5), `userId`, `userStatus`.
- Outputs: Either re-sends the Flow form via WF-50 with a contextual intro, sends a stop-intent clarifier via WF-50, or hands off to WF-25's built-in garbage/abuse handling (which sends its own warning).
- State Transitions: none directly. Auto-opt-out on Gemini-classified stop_intent removed 2026-05-23 (SP-04) — the user must now send the explicit STOP keyword (handled by WF-20) to opt out.
- Calls Sub-Workflows: WF-25 (Intent Classifier), WF-50 (Send WhatsApp)
- **Notes:**
  - **stop_intent policy (2026-05-23 — SP-04, applying WF-40's TD-E pattern):** Gemini-classified stop_intent no longer auto-routes to WF-47 unsubscribe — false-positive risk on pre-onboarding text. Instead WF-23 sends a clarifier asking the user to send STOP exactly if they want to opt out; otherwise the next message proceeds normally through WF-02 routing. Literal STOP keyword still goes through WF-20 (Design Rule #5) and unsubscribes canonically.
  - WF-23 passes `messageText` into WF-25, but WF-25's `Prepare Intent Request` reads `input.messageContent`. Latent bug tracked as TD-DRIFT-009 — explicitly deferred from Phase 1 per §1.5. If the field is undefined, the Gemini prompt may classify on an empty string.
  - **Provably dead-code branch removed 2026-05-23 (SP-04):** the previous `Is Stop Intent?` IF's FALSE branch was unreachable — `Is Pass-Through Intent?` already excludes garbage/abusive/inappropriate (which never return from WF-25 anyway) and stop_intent, so anything reaching the inner IF was stop_intent. Direct connection used now.

---

## Algorithm

Step 1: Start — workflow triggered by another workflow (WF-02) with WF-01 canonical envelope plus `messageText`, `userId`, `userStatus`. Read `phoneNumber` from top-level envelope field (canonical per §2.1).
Step 2: Call WF-25 (Intent Classifier) with phoneNumber, userId, messageText, userStatus. WF-25 returns intentResult ∈ {wants_consultation, general_enquiry, rebook_intent, feedback_intent, stop_intent} for non-terminal intents. Note: for garbage / malicious_abusive / inappropriate, WF-25 sends warnings + auto-blocks before returning control (effectively a halt for those intents).
Step 3: Check `Is Pass-Through Intent?` — is the intent NOT one of {garbage, malicious_abusive, inappropriate, stop_intent}?
  - If YES (pass-through — wants_consultation, general_enquiry, rebook_intent, feedback_intent) → go to Step 4
  - If NO (intentResult == stop_intent — only reachable value here per WF-25 contract) → go to Step 6
Step 4: Build a contextual intro line based on intentResult:
  - "wants_consultation" → "Great! Please fill in your birth details to book your Vedic astrology consultation with Chinmay."
  - "general_enquiry" → "Thanks for your question! To get started with your personalised consultation, please fill in your birth details below."
  - Otherwise (rebook_intent, feedback_intent) → "To proceed with your consultation, please fill in your birth details using the form below."
  Append the privacy policy URL. Build the interactive Flow payload (type=flow, header="Birth Details Form", flowId="1408011897720771", flowCta="Fill Details").
Step 5: Call WF-50 with { phoneNumber, messageType="interactive", interactivePayload=the flow object } per §2.3 canonical contract. End.
Step 6: Build WF-50 stop-intent clarifier payload per §2.3 canonical contract:
  - phoneNumber = <phoneNumber> (from top-level envelope)
  - messageType = "text"
  - messageContent = "This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please ignore. If you do want to opt out of this service, simply send STOP at any time."
Step 7: Call WF-50 (Stop Clarifier) with the prepared payload. End.
```

### `docs/pseudocode/WF-30.pseudo`

```
WF-30 — Payment Pending Intent Filter

## Summary

- Inputs (WF-01 canonical envelope per data-contract-discipline Phase 1 — design.md §2.1): `phoneNumber` (E.164 string), `messageType`, `messageContent`, `user` (object: {id, phone_number, name, status, slack_channel_id, current_consultation_id}), `pendingUser` (null for payment_pending users). Additional fields passed by WF-02: `messageText`, `userId`, `userStatus`.
- Outputs: Either a contextual WhatsApp payment reminder, or a stop-intent clarifier message.
- State Transitions: none. Auto-opt-out on Gemini-classified stop_intent removed 2026-05-23 (SP-04); explicit STOP keyword via WF-20 still unsubscribes canonically.
- Calls Sub-Workflows: WF-25 (Intent Classifier), WF-50 (Send WhatsApp)
- **Notes:**
  - **stop_intent policy (2026-05-23 — SP-04, applying WF-40's TD-E pattern):** Gemini-classified stop_intent no longer auto-routes to WF-47 unsubscribe — false-positive risk (e.g. user typing "I want to stop waiting for confirmation"). Instead WF-30 sends a clarifier asking the user to send STOP exactly. Literal STOP still flows through WF-20 (Design Rule #5).
  - For intents in {garbage, malicious_abusive, inappropriate}, WF-25 already handles the response internally and does NOT return to caller — those messages terminate inside WF-25.
  - **Provably dead-code branch removed 2026-05-23 (SP-04):** the previous `Is Stop Intent?` IF's FALSE branch was unreachable by the WF-25 contract (see WF-23.pseudo Notes for the same analysis).
  - WF-25 caller field name (TD-DRIFT-009): passes `messageText` but WF-25 reads `messageContent` — explicitly deferred from Phase 1 per §1.5.

---

## Algorithm

Step 1: Start — Triggered by parent workflow with WF-01 canonical envelope plus {messageText, userId, userStatus}. Read `phoneNumber` from top-level envelope field (canonical per §2.1).
Step 2: Call WF-25 with phoneNumber, userId, messageText, userStatus. Receive intentResult.
Step 3: Check `Is Pass-Through Intent?` — is intentResult NOT one of {garbage, malicious_abusive, inappropriate, stop_intent}?
  - If YES (wants_consultation, general_enquiry, rebook_intent, feedback_intent) → go to Step 4
  - If NO (only stop_intent reachable per WF-25 contract) → go to Step 7
Step 4: Build contextual payment reminder message:
  - If intentResult == "wants_consultation": prefix "Great! You're almost there. To confirm your consultation, please complete the payment below."
  - Else if intentResult == "rebook_intent": prefix "For rebooking, please complete the pending payment first."
  - Else: prefix "Happy to help! Once your payment is confirmed, Chinmay will be ready for your consultation."
  - Append UPI block: ₹500 to +91-9653240263 (Chinmay Mujumdar), then "tap the Payment Completed button you received earlier."
Step 5: Call WF-50 with { phoneNumber, messageType="text", messageContent=assembled message } per §2.3 canonical contract.
Step 6: End.
Step 7: Build WF-50 stop-intent clarifier payload per §2.3 canonical contract:
  - phoneNumber = <phoneNumber> (from top-level envelope)
  - messageType = "text"
  - messageContent = "This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please ignore. If you do want to opt out of this service, simply send STOP at any time."
Step 8: Call WF-50 (Stop Clarifier) with the prepared payload. End.
```

### `docs/pseudocode/WF-31.pseudo`

```
WF-31 — Payment Submitted Handler

## Summary

- Inputs (WF-01 canonical envelope per data-contract-discipline Phase 1 — design.md §2.1): `phoneNumber` (E.164 string), `messageType`, `messageContent`, `user` (object: {id, phone_number, name, status, slack_channel_id, current_consultation_id}), `pendingUser` (null). Additional fields passed by WF-02: `messageText`, `userId`, `userStatus`. `user.name` used for Slack relay display; `user.slack_channel_id` used for Slack channel routing (no DB re-fetch required — envelope provides it).
- Outputs: WhatsApp "under review" reassurance to user AND a Slack relay of the user message into the user's consult channel; or a stop-intent clarifier on the user branch (admin relay still fires unconditionally).
- State Transitions: none. Auto-opt-out on Gemini-classified stop_intent removed 2026-05-23 (SP-04); explicit STOP keyword via WF-20 still unsubscribes canonically.
- Calls Sub-Workflows: WF-25 (Intent Classifier), WF-50 (Send WhatsApp), WF-51 (Send Slack)
- **Notes:**
  - **stop_intent policy (2026-05-23 — SP-04, applying WF-40's TD-E pattern):** Gemini-classified stop_intent no longer auto-routes to WF-47 unsubscribe — false-positive risk. Clarifier message sent instead. Literal STOP still flows through WF-20.
  - **Provably dead-code branch removed 2026-05-23 (SP-04):** the previous `Is Stop Intent?` IF's FALSE branch was unreachable per the WF-25 contract.
  - The trigger fans out into two parallel branches: an intent-classification branch (Branch A) and an unconditional Slack-relay branch (Branch B). The Slack relay therefore fires for every inbound message in `payment_submitted` state — including stop_intent and garbage — independently of the intent path.
  - **Load User for Relay removed (Phase 1):** `slack_channel_id` is now read from `user.slack_channel_id` in the WF-01 envelope — no DB SELECT required. The `Load User for Relay` Postgres node has been removed and `Prepare Admin Relay` reads directly from the trigger.
  - WF-25 caller field name (TD-DRIFT-009): passes all trigger data via passthrough; WF-25 reads `messageContent` but field may arrive as `messageText` — explicitly deferred from Phase 1 per §1.5.

---

## Algorithm

Step 1: Start — Triggered by parent with WF-01 canonical envelope plus {messageText, userId, userStatus}. Read `phoneNumber` and `user.slack_channel_id` from envelope directly (no DB re-fetch).
Step 2: Fan out in parallel from trigger:
  - Branch A → Step 3 (intent classification + user reply)
  - Branch B → Step 8 (admin Slack relay)

(Branch A — user reply)
Step 3: Call WF-25 with phoneNumber, userId, messageText, userStatus. Receive intentResult.
Step 4: Check `Is Pass-Through Intent?` — is intentResult NOT one of {garbage, malicious_abusive, inappropriate, stop_intent}?
  - If YES → go to Step 5
  - If NO (only stop_intent reachable per WF-25 contract) → go to Step 6
Step 5: Build "under review" message: "⏳ Your payment is currently under review. Chinmay will verify it and get back to you shortly (usually within a few hours). You don't need to do anything else right now. If you have any questions, feel free to ask!"
  Call WF-50 with { phoneNumber, messageType="text", messageContent=the message } per §2.3 canonical contract. Go to Step 10.
Step 6: Build WF-50 stop-intent clarifier payload per §2.3 canonical contract:
  - phoneNumber = <phoneNumber> (from top-level envelope)
  - messageType = "text"
  - messageContent = "This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please ignore. If you do want to opt out of this service, simply send STOP at any time."
Step 7: Call WF-50 (Stop Clarifier) with the prepared payload. Go to Step 10.

(Branch B — relay user message into Slack consult channel)
Step 8: Read `user.slack_channel_id` from the WF-01 envelope (no DB SELECT — redundant Load User for Relay node removed). Build relay payload: { channelId=user.slack_channel_id, messageText="💬 *Message from <user.name or phoneNumber> (payment under review):*\n><messageContent>" }.
Step 9: Call WF-51 (Send Slack) with { channelId, messageText } per §2.4 canonical contract.
Step 10: End.
```

## Drift findings (logged)

- **STRICT**: WF-30/31 `Prepare Payment Reminder` / `Prepare Under Review Message` legacy `message` key (rejected by WF-50 entry guard) — **fixed in plan**.
- **STRICT**: WF-31 `Load User for Relay` redundant — **removed in plan**.
- **Adjacent (deferred)**: WF-23/30/31 WF-25 callers send `messageText` (TD-DRIFT-009, §1.5).
