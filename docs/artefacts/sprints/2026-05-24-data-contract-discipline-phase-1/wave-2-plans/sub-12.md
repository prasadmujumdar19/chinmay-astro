# sub-12 — Cluster B (WF-20 / WF-40 / WF-43 / WF-44)

**WFs:**
- WF-20 (`LgIDj1v4ZbCPlX25`) — `Send HELP Response` rename messageBody→messageContent + envelope userStatus update
- WF-40 (`du32QBZbSQOjfESe`) — **STRICT**: remove `Load User Record` + rewire downstream
- WF-43 (`3va0M06kijgyLejf`) — `Extract Gemini Reply` legacy `message` rename
- WF-44 (`Du2CJ3OTohRFZYoA`) — `Prepare Ack Message` + `Send Ack` legacy `message` rename. Note: §3.4 listed `Load User for Relay` removal but live has no such node — informational drift.

**Items:** TD-DCP-052, TD-DCP-040, TD-DCP-030

## n8n edit plans

### WF-20

```json
{
  "WF-20": {
    "node_modifications": [
      {
        "node_name": "Send HELP Response",
        "field": "parameters.workflowInputs.value",
        "old_keys": ["phoneNumber", "messageBody"],
        "new_value_template": {
          "phoneNumber": "={{ $('Normalize Keyword').item.json.phoneNumber }}",
          "messageType": "text",
          "messageContent": "={{ $('When Executed by Another Workflow').item.json.user.status === 'payment_pending' ? 'To complete your booking, please send ₹500 via GPay / PhonePe / any UPI app to +91-9653240263 (Chinmay Mujumdar). Once done, tap the *Payment Completed ✓* button in the previous message.' : $('When Executed by Another Workflow').item.json.user.status === 'payment_submitted' ? 'Your payment is under review. Chinmay will approve it shortly — please wait! 🙏' : $('When Executed by Another Workflow').item.json.user.status === 'consultation_active' ? 'You are in an active consultation! Just type your question and Chinmay will respond. 🌟' : $('When Executed by Another Workflow').item.json.user.status === 'consultation_closed' ? 'Your consultation is complete. Type *REBOOK* to start a new one with Chinmay. 📋' : 'Here\\'s what you can do:\\n\\n📋 *REBOOK* — Book a new consultation\\n🚫 *STOP* — Unsubscribe from all messages\\n\\nFor anything else, just type your question during an active consultation.' }}"
        },
        "rationale": "Replace legacy messageBody with canonical messageContent + add messageType:'text'. Update userStatus reads from flat .userStatus to envelope path .user.status."
      },
      {
        "node_name": "Normalize Keyword",
        "field": "parameters.assignments",
        "new_assignments": {
          "keyword": "={{ $json.messageContent.trim().toUpperCase() }}",
          "phoneNumber": "={{ $json.phoneNumber }}",
          "userId": "={{ $json.user.id }}",
          "messageText": "={{ $json.messageContent }}"
        },
        "note": "userStatus carry-forward NOT added (TD-DRIFT-006 deferred)."
      }
    ]
  }
}
```

### WF-40

```json
{
  "WF-40": {
    "node_modifications": [
      {
        "node_name": "Call WF-25 (Intent Classifier)",
        "field": "parameters.workflowInputs.value",
        "new_value": {
          "phoneNumber": "={{ $('When Executed by Another Workflow').item.json.phoneNumber }}",
          "userId": "={{ $('When Executed by Another Workflow').item.json.user.id }}",
          "messageContent": "={{ $('When Executed by Another Workflow').item.json.messageContent }}",
          "userStatus": "={{ $('When Executed by Another Workflow').item.json.user.status }}"
        }
      },
      {
        "node_name": "Format Slack Message",
        "field": "parameters.assignments",
        "new_assignments": {
          "channelId": "={{ $('When Executed by Another Workflow').item.json.user.slack_channel_id }}",
          "messageText": "=📲 *{{ $('When Executed by Another Workflow').item.json.user.name }}:* {{ $('When Executed by Another Workflow').item.json.messageContent }}"
        }
      }
    ],
    "node_removals": [
      {
        "node_name": "Load User Record",
        "rationale": "§3.4 Type A — WF-01 envelope provides id/name/phone_number/slack_channel_id/status"
      }
    ],
    "connection_changes": [
      "Remove: When Executed by Another Workflow --> Load User Record",
      "Remove: Load User Record --> Call WF-25 (Intent Classifier)",
      "Add: When Executed by Another Workflow --> Call WF-25 (Intent Classifier)"
    ]
  }
}
```

### WF-43

```json
{
  "WF-43": {
    "node_modifications": [
      {
        "node_name": "Extract Gemini Reply",
        "field": "parameters.jsCode",
        "new_jsCode": "const geminiResp = $input.first().json;\nconst prevData = $('Prepare Gemini Response Prompt').first().json;\nlet reply = \"Thank you for your message! For questions about our Vedic astrology consultation, feel free to ask.\";\ntry { const text = geminiResp.candidates?.[0]?.content?.parts?.[0]?.text?.trim(); if (text) reply = text; } catch(e) {}\nreturn [{ json: { phoneNumber: prevData.phoneNumber, messageType: 'text', messageContent: reply } }];"
      }
    ],
    "notes": [
      "Prompt for Feedback already canonical — no change.",
      "Send Feedback Prompt via WF-50 + Send Gemini Reply via WF-50 use passthrough — pick up canonical shape after Extract Gemini Reply fix."
    ]
  }
}
```

### WF-44

```json
{
  "WF-44": {
    "node_modifications": [
      {
        "node_name": "Prepare Ack Message",
        "field": "parameters.jsCode",
        "new_jsCode": "const d = $('When Executed by Another Workflow').first().json;\nreturn [{ json: {\n  phoneNumber: d.phoneNumber,\n  messageType: 'text',\n  messageContent: \"🙏 Thank you for your feedback! We really appreciate you taking the time to share your experience with Chinmay's consultation service. Your input helps us improve.\"\n} }];"
      },
      {
        "node_name": "Send Ack via WF-50",
        "field": "parameters.workflowInputs.value",
        "new_value": {
          "phoneNumber": "={{ $json.phoneNumber }}",
          "messageType": "text",
          "messageContent": "={{ $json.messageContent }}"
        }
      }
    ],
    "notes": [
      "§3.4 listed Load User for Relay removal but live WF-44.md (node_count=9, live_updated_at=2026-05-22T21:50:58.290Z) has no such node — already removed pre-sprint.",
      "Save Feedback to DB already reads $('When Executed by Another Workflow').first().json.user.id — envelope-aware.",
      "Call WF-25 Intent Classifier sends messageText instead of messageContent (TD-DRIFT-009, deferred §1.5)."
    ]
  }
}
```

## Pseudo revisions

### `docs/pseudocode/WF-20.pseudo`

```
WF-20 — Keyword Handler

## Summary

- Inputs (canonical WF-01 envelope per data-contract-discipline Phase 1 §2.1): `phoneNumber` (E.164 string, top-level), `messageContent` (string), `user.id` (integer or null), `user.status` (enum or null), `user.name` (string or null), `user.slack_channel_id` (string or null), `user.current_consultation_id` (integer or null), `pendingUser` (object or null). `messageType` is always `text` on this path (keyword intercept runs before WF-25; only plain-text messages reach WF-20).
- Outputs: Either routes user to WF-47 (unsubscribe), WF-45 (rebook), or sends a HELP message via WF-50. Otherwise returns `{action: 'passthrough', phoneNumber, userId, messageText}` so the caller (WF-02 Step 5) continues normal routing.
- State Transitions: none directly (downstream WF-47 sets `opted_out`, WF-45 may move user to `payment_pending`)
- Calls Sub-Workflows: WF-47 (Unsubscribe), WF-45 (Rebook), WF-50 (Send WhatsApp)
- **Ambiguities / Notes:**
  - The keyword Switch has a 4th `extra` fallback output that must be wired to a terminal Set / Code node returning `{action: 'passthrough', ...}`. In n8n, the `Set Passthrough` node MUST connect to the workflow's terminal output (otherwise WF-02 receives no payload back and the dispatch silently dies).
  - TD-DRIFT-006 (Normalize Keyword drops userStatus; WF-47 STOP-from-consultation_active leaves orphan consultations row) is a deferred bug, NOT fixed in Phase 1.

---

## Algorithm

Step 1: Start — workflow triggered by WF-02 with the WF-01 canonical envelope. Read inputs:
  - `phoneNumber` (from envelope top-level phoneNumber)
  - `userId` (from envelope user.id; may be null for new/pendingUser)
  - `userStatus` (from envelope user.status; may be null for new/pendingUser — used to drive HELP contextual response)
  - `messageContent` (from envelope messageContent — canonical field name)
Step 2: Normalize the input — set keyword = uppercase(trim(messageContent)). Carry forward phoneNumber, userId, messageContent as messageText.
Step 3: Check: keyword value?
  - If keyword == "HELP" → go to Step 4
  - If keyword == "STOP" → go to Step 5
  - If keyword == "REBOOK" → go to Step 6
  - Otherwise (no keyword match) → go to Step 7
Step 4: Build a contextual help message based on user.status (TC-1013 — 5 status-aware branches). Read user.status directly from the WF-01 envelope (trigger node):
  - If user.status is null/undefined OR user.status == "pendingUser" (no full DB record yet): "Welcome to Chinmay Astro. Tap the 'Fill Details' button on the form to get started. If you don't see the form, send 'Hi' to receive it again."
  - If user.status == "payment_pending": tell user to pay ₹500 via UPI to +91-9653240263 and tap "Payment Completed ✓".
  - If user.status == "payment_submitted": tell user payment is under review.
  - If user.status == "consultation_active": tell user to just type their question.
  - If user.status == "consultation_closed": tell user to type REBOOK.
  - Otherwise (defensive — should not occur): send generic menu listing REBOOK and STOP options.
  Call WF-50 with { phoneNumber, messageType: 'text', messageContent: <chosen message body> }. End.
Step 5: Call WF-47 (Unsubscribe) with phoneNumber, userId, userStatus. End.
Step 6: Call WF-45 (Rebook) with phoneNumber, userId. End.
Step 7: Return `{action: 'passthrough', phoneNumber, userId, messageText}` to the caller so WF-02 (Step 5) sees `action='passthrough'` and continues normal routing. (Implementation note: in n8n, the `Set Passthrough` node must connect to the workflow's terminal output node — not be left orphaned.) End.
```

### `docs/pseudocode/WF-40.pseudo`

```
WF-40 — User -> Admin Relay

## Summary

- Inputs (canonical WF-01 envelope per data-contract-discipline Phase 1 §2.1): `phoneNumber` (E.164 string, top-level), `messageContent` (string), `user.id` (integer), `user.name` (string), `user.status` (enum), `user.slack_channel_id` (string). No Load User SELECT — all required fields provided by the WF-01 envelope.
- Outputs: Slack message posted to the user's consult channel for benign intents; short-circuits to WF-25's garbage/abuse handlers otherwise; additionally sends a WF-50 clarifier to the user when WF-25 returns `stop_intent`.
- State Transitions: none directly. WF-25 → WF-46 transitions user to `blocked` for `malicious_abusive` / `inappropriate` intents.
- Calls Sub-Workflows: WF-25 (Intent Classifier, MANDATORY at head per Design Rule #6), WF-50 (Send WhatsApp — stop_intent clarifier only), WF-51 (Send Slack Message).
- **Notes:**
  - Design Rule #6: every state accepting free-form text must run WF-25 first. WF-40 receives user text during `consultation_active` — therefore MUST classify.
  - WF-25 contract: for `garbage`, `malicious_abusive`, `inappropriate` intents WF-25 sends the user warning + admin Slack notify + (for abuse) auto-blocks via WF-46, and does NOT return to caller. For all other intents (`wants_consultation`, `general_enquiry`, `rebook_intent`, `feedback_intent`, `stop_intent`) it returns the input payload extended with `intentResult`.
  - `stop_intent` policy (2026-05-21 — TD-E): a user mentioning "STOP" or "unsubscribe" mid-consultation is NOT auto-opted-out — false-positive risk. Instead WF-40 relays the message verbatim to admin AND sends an automated clarifier to the user explaining how to opt out cleanly (send STOP keyword).
  - Inbound logging handled upstream by WF-00 → WF-60. WF-40 does NOT call WF-60.
  - **Phase 1 change:** `Load User Record` SELECT removed — user fields read from WF-01 envelope via trigger node.

---

## Algorithm

Step 1: Start — triggered by WF-02 routing consultation_active user text. Inputs: WF-01 canonical envelope containing phoneNumber, messageContent, user.{id, name, status, slack_channel_id}.
Step 2: Call WF-25 (Intent Classifier) with {phoneNumber: envelope.phoneNumber, userId: envelope.user.id, messageContent: envelope.messageContent, userStatus: envelope.user.status}. (No DB SELECT needed — all fields from envelope.)
  - If WF-25 classifies as `garbage` / `malicious_abusive` / `inappropriate`, WF-25 handles user warning, admin notify, and (for abuse) auto-blocking internally. Control does NOT return to WF-40 and the chain halts.
  - Otherwise WF-25 returns input + `intentResult` (one of `wants_consultation`, `general_enquiry`, `rebook_intent`, `feedback_intent`, `stop_intent`).
Step 3: Branch on `intentResult == 'stop_intent'`?
  - YES → fork into two parallel branches: (a) Step 4 (clarifier to user); (b) Step 5 (relay to admin).
  - NO  → skip Step 4, go directly to Step 5.
Step 4: Build WF-50 stop-clarifier payload and send:
  - phoneNumber = envelope.phoneNumber
  - messageType = "text"
  - messageContent = "This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please ignore. If you do want to opt out of this service, simply send STOP at any time."
  - Call WF-50.
Step 5: Format Slack relay payload:
  - channelId = envelope.user.slack_channel_id
  - messageText = "📲 *<envelope.user.name>:* <envelope.messageContent>"
Step 6: Call WF-51 with {channelId, messageText} — posts the user's words into the consult Slack channel.
Step 7: End.
```

### `docs/pseudocode/WF-43.pseudo`

```
WF-43 — Post-Consultation Handler

## Summary

- Inputs (canonical WF-01 envelope per data-contract-discipline Phase 1 §2.1): `phoneNumber` (E.164 string, top-level), `messageType` (enum: 'text' | 'interactive'), `messageContent` (string), `rawMessage` (object — for interactive payloads), `user.id` (integer), `user.status` (enum: 'consultation_closed'), `user.current_consultation_id` (integer or null).
- Outputs: Routes to WF-44 (feedback), WF-45 (rebook), WF-47 (unsubscribe), or sends a Gemini-generated WhatsApp reply
- State Transitions: none directly (downstream WFs may transition)
- Calls Sub-Workflows: WF-25 (Intent Classifier), WF-44 (Feedback Recorder), WF-45 (Rebook), WF-47 (Unsubscribe), WF-50 (Send WhatsApp)
- **Notes:**
  - TD-DRIFT-009 (WF-25 caller passes messageText instead of messageContent) is a known bug deferred to the post-Phase-1 bug-fix sprint. The passthrough mode in Call WF-25 Intent Classifier passes the envelope's messageContent field correctly on this path.

---

## Algorithm

Step 1: Start — triggered by another workflow (typically WF-01/WF-02 for a user in `consultation_closed`). Receives WF-01 canonical envelope.
Step 2: Check: Is messageType == "interactive" (a button reply)?
  - If YES → go to Step 3
  - If NO  → go to Step 6
Step 3: Check: Is rawMessage.interactive.button_reply.id == "btn_rebook"?
  - If YES → go to Step 4
  - If NO  → go to Step 5
Step 4: Call WF-45 (Rebook) with phoneNumber, userId. End.
Step 5: Prompt for feedback — build canonical WF-50 payload: { phoneNumber, messageType: 'text', messageContent: "✍️ Thanks for choosing to share your feedback! Please type your thoughts about the consultation and send them — we appreciate every word!" }; call WF-50. End.
Step 6: Call WF-25 (Intent Classifier) with phoneNumber, userId (user.id), messageContent, userStatus (user.status) → returns intentResult.
Step 7: Check: intentResult == "stop_intent"?
  - If YES → call WF-47 (Unsubscribe) with phoneNumber, userId, userStatus. End.
  - If NO  → go to Step 8
Step 8: Check: intentResult == "rebook_intent"?
  - If YES → call WF-45 (Rebook) with phoneNumber, userId. End.
  - If NO  → go to Step 9
Step 9: Check: intentResult == "feedback_intent"?
  - If YES → call WF-44 (Feedback Recorder) with phoneNumber, userId, messageContent. End.
  - If NO  → go to Step 10
Step 10: Build Gemini prompt: "You are a helpful assistant for Chinmay's Vedic astrology consultation service on WhatsApp. Answer this question briefly and warmly in 2-3 sentences. If they seem interested in booking, mention they can start fresh by messaging us.\nUser: <messageContent>"
Step 11: POST to Gemini (gemini-2.0-flash-lite) with temperature=0.7, maxOutputTokens=200, timeout=10s.
Step 12: Extract reply text from candidates[0].content.parts[0].text; fallback = "Thank you for your message! For questions about our Vedic astrology consultation, feel free to ask."
Step 13: Call WF-50 with { phoneNumber, messageType: 'text', messageContent: <reply> }.
Step 14: End.
```

### `docs/pseudocode/WF-44.pseudo`

```
WF-44 — Feedback Recorder

## Summary

- Inputs (canonical WF-01 envelope per data-contract-discipline Phase 1 §2.1, forwarded by WF-43): `phoneNumber` (E.164 string, top-level), `messageContent` (string — the user's feedback text), `user.id` (integer), `user.status` (enum). No Load User SELECT — all required fields provided by the WF-01 envelope.
- Outputs: feedback text saved to users row; WhatsApp acknowledgement sent; OR rerouted to WF-45/WF-47 if intent says so
- State Transitions: none on the feedback path (clears `stage` to NULL). Rebook/stop paths delegate to other WFs.
- Calls Sub-Workflows: WF-25 (Intent Classifier), WF-45 (Rebook), WF-47 (Unsubscribe), WF-50 (Send WhatsApp)
- **Notes:**
  - §3.4 listed a 'Load User for Relay' node for removal. Live AS-IS (2026-05-22T21:50:58.290Z) shows no such node — it was already absent. No removal action needed.
  - TD-DRIFT-009: WF-25 caller sends `messageText` instead of `messageContent`. Deferred to post-Phase-1 bug-fix sprint.
  - Save Feedback to DB already reads user.id from the WF-01 envelope via the trigger node — envelope-aware.

---

## Algorithm

Step 1: Start — triggered by WF-43 after the user typed a feedback message (or pressed Leave Feedback then typed). Receives WF-01 canonical envelope containing phoneNumber, messageContent, user.{id, status}.
Step 2: Call WF-25 (Intent Classifier) with phoneNumber, messageContent, userId (user.id), userStatus (user.status) → returns intentResult. (Note: live implementation passes messageText key due to TD-DRIFT-009 — deferred bug.)
Step 3: Check: intentResult == "rebook_intent"?
  - If YES → go to Step 4
  - If NO  → go to Step 5
Step 4: Call WF-45 (Rebook) with phoneNumber, userId, userStatus. End.
Step 5: Check: intentResult == "stop_intent"?
  - If YES → go to Step 6
  - If NO  → go to Step 7
Step 6: Call WF-47 (Unsubscribe) with phoneNumber, userId, userStatus. End.
Step 7: UPDATE chinmay_astro.users SET feedback = <messageContent>, stage = NULL, updated_at = NOW() WHERE id = <user.id>.
Step 8: Build canonical WF-50 acknowledgement payload: { phoneNumber, messageType: 'text', messageContent: "🙏 Thank you for your feedback! We really appreciate you taking the time to share your experience with Chinmay's consultation service. Your input helps us improve." }
Step 9: Call WF-50 with the canonical payload from Step 8.
Step 10: End.
```
