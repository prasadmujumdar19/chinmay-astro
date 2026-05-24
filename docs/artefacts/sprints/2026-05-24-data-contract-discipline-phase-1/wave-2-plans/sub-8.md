# sub-8 — WF-02 entry guard

**WF:** WF-02 (n8n ID `PubCsNTOspF3xqXZ`)
**Item:** TD-DCP-051
**n8n change:** Add `Validate Inputs` Code node as first node validating WF-01 envelope per design.md §2.7.

## n8n edit plan

```json
{
  "WF-02": {
    "node_additions": [
      {
        "name": "Validate Inputs",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [620, 300],
        "parameters": {
          "jsCode": "// WF-02 entry guard — design.md §2.1 + §2.7 WF-01 core envelope validation.\n// Throws a descriptive error on any contract violation so the caller (WF-01)\n// gets an immediate, named failure rather than a silent mis-route.\nconst i = $('When Executed by Another Workflow').item.json;\n\n// ── Top-level required scalars ──────────────────────────────────────────────\nif (!i.phoneNumber || typeof i.phoneNumber !== 'string')\n  throw new Error('WF-02 contract: phoneNumber required (E.164 string), got: ' + JSON.stringify(i.phoneNumber));\n\nif (!['text', 'interactive'].includes(i.messageType))\n  throw new Error('WF-02 contract: messageType must be text|interactive, got: ' + JSON.stringify(i.messageType));\n\nif (i.messageContent === undefined || i.messageContent === null)\n  throw new Error('WF-02 contract: messageContent required (string or empty string), got: ' + JSON.stringify(i.messageContent));\n\n// ── user object (null is valid — new-user path) ──────────────────────────────\n// user must be null OR an object with required core fields\nif (i.user !== null && i.user !== undefined) {\n  if (typeof i.user !== 'object' || Array.isArray(i.user))\n    throw new Error('WF-02 contract: user must be null or an object, got: ' + typeof i.user);\n\n  const u = i.user;\n\n  if (u.id === undefined || u.id === null)\n    throw new Error('WF-02 contract: user.id required (integer)');\n\n  if (!u.phone_number || typeof u.phone_number !== 'string')\n    throw new Error('WF-02 contract: user.phone_number required (E.164 string)');\n\n  if (u.name === undefined || u.name === null)\n    throw new Error('WF-02 contract: user.name required (string)');\n\n  const validStatuses = ['payment_pending', 'payment_submitted', 'consultation_active', 'consultation_closed', 'blocked', 'opted_out'];\n  if (!u.status || !validStatuses.includes(u.status))\n    throw new Error('WF-02 contract: user.status must be a valid state-machine value, got: ' + JSON.stringify(u.status));\n\n  // slack_channel_id may be null (not yet assigned) — presence of key is required\n  if (!('slack_channel_id' in u))\n    throw new Error('WF-02 contract: user.slack_channel_id key required (string or null)');\n\n  // current_consultation_id may be null — presence of key is required\n  if (!('current_consultation_id' in u))\n    throw new Error('WF-02 contract: user.current_consultation_id key required (integer or null)');\n} else if (i.user !== null) {\n  // undefined is not acceptable — must be explicit null\n  throw new Error('WF-02 contract: user must be null or an object, got: undefined');\n}\n\n// ── pendingUser (null is valid — not in-flight onboarding) ───────────────────\nif (i.pendingUser !== null && i.pendingUser !== undefined) {\n  if (typeof i.pendingUser !== 'object' || Array.isArray(i.pendingUser))\n    throw new Error('WF-02 contract: pendingUser must be null or an object, got: ' + typeof i.pendingUser);\n} else if (i.pendingUser === undefined) {\n  throw new Error('WF-02 contract: pendingUser key required (object or null), got: undefined');\n}\n\n// Contract satisfied — pass through unchanged\nreturn [{ json: i }];"
        }
      }
    ],
    "node_modifications": [],
    "node_removals": [],
    "connection_changes": [
      "Remove: When Executed by Another Workflow --[main#0]--> Detect Route",
      "Add: When Executed by Another Workflow --[main#0]--> Validate Inputs (input #0)",
      "Add: Validate Inputs --[main#0]--> Detect Route (input #0)"
    ]
  }
}
```

## Pseudo revision — write to `docs/pseudocode/WF-02.pseudo`

```
WF-02 — User State Router

## Summary

- Inputs: WF-01 canonical core envelope (§2.1): phoneNumber (E.164 string), messageType (text|interactive), messageContent (string), user:{id, phone_number, name, status, slack_channel_id, current_consultation_id} or null, pendingUser:{id, contact_name} or null. Additionally carries rawMessage, messageContentUpper, routing, messageId, timestamp for routing context.
- Outputs: Dispatch to one state-specific sub-workflow; intermediate hand-off through WF-20 for keyword interception on text messages
- State Transitions: none (delegates to handlers; this workflow only routes)
- Calls Sub-Workflows: WF-20 (Keyword Handler), WF-21, WF-22, WF-23, WF-30, WF-31, WF-32, WF-40, WF-43, WF-51 (admin alert on UNHANDLED route only)

---

## Algorithm

Step 1: Validate Inputs (entry guard — defense-in-depth per design.md §2.1 + §2.7). Read envelope from the workflow trigger. Throw with descriptive error if:
  - phoneNumber is missing or not a string.
  - messageType is not one of: text, interactive.
  - messageContent key is absent or null.
  - user is present (non-null) but missing any of: id, phone_number, name, status, slack_channel_id key, current_consultation_id key; or user.status is not a valid state-machine value.
  - pendingUser key is absent (undefined); must be explicit null or an object.
  Pass through unchanged on success.
Step 2: Detect Route based on userStatus, messageType, rawMessage.interactive.type, and pendingUser:
  - If messageType='interactive' AND interactive.type='nfm_reply' → route='DETAILS_FORM'.
  - Else if messageType='interactive' AND interactive.type='button_reply' AND user IS NOT NULL AND user.status='consultation_closed' → route='POST_CONSULT_TEXT'.
  - Else if messageType='interactive' AND interactive.type='button_reply' AND user IS NOT NULL AND user.status='payment_pending' → route='PAYMENT_CONFIRM' (e.g. "Payment Completed" button — only valid for payment_pending users; other button_reply types fall through to UNHANDLED).
  - Else if user is null AND pendingUser is null → route='NEW_USER'.
  - Else if user is null AND pendingUser exists → route='PRE_FORM_TEXT'.
  - Else if user IS NOT NULL AND user.status='payment_pending' → route='PAYMENT_PENDING_TEXT'.
  - Else if user IS NOT NULL AND user.status='payment_submitted' → route='PAYMENT_SUBMITTED_TEXT'.
  - Else if user IS NOT NULL AND user.status='consultation_active' → route='RELAY'.
  - Else if user IS NOT NULL AND user.status='consultation_closed' → route='POST_CONSULT_TEXT'.
  - Else → route='UNHANDLED' (caught at Step 6 — posts admin Slack alert via WF-51 with payload summary for visibility).
Step 3: Check: messageType == 'text'?
  - If YES → go to Step 4 (run keyword interception first).
  - If NO → go to Step 6 (skip keyword check, go straight to Route Switch).
Step 4: Call WF-20 (Keyword Handler) to check for hard-coded keywords (STOP / HELP / REBOOK etc).
Step 5: Check: WF-20 returned action == 'passthrough'?
  - If YES (no keyword matched) → go to Step 5a (restore the original route data) → Step 6.
  - If NO (WF-20 already handled the message) → End.
Step 5a: Restore Route Data — reload the payload built in Step 2 (with route field intact).
Step 6: Route Switch on route value:
  - 'NEW_USER' → call WF-21 (Welcome + Form). End.
  - 'PRE_FORM_TEXT' → call WF-23 (Pre-Form Intent Filter). End.
  - 'DETAILS_FORM' → call WF-22 (Details Form Processor). End.
  - 'PAYMENT_CONFIRM' → call WF-32 (Payment Confirmation Receiver). End.
  - 'PAYMENT_PENDING_TEXT' → call WF-30 (Payment Pending Intent Filter). End.
  - 'PAYMENT_SUBMITTED_TEXT' → call WF-31 (Payment Submitted Handler). End.
  - 'RELAY' → call WF-40 (User → Admin Relay). End.
  - 'POST_CONSULT_TEXT' → call WF-43 (Post-Consultation Handler). End.
  - 'UNHANDLED' → call WF-51 with channelId='chinmay-admin-commands' (C0A5B0ZE81E) and messageText='⚠️ The system couldn't route this message. Phone: +<phoneNumber>, Message kind: <messageType>, Interactive type: <rawMessage.interactive.type or "n/a">, User status: <user.status or "not registered">, Onboarding in progress: <true|false>, Content (truncated to 200 chars): <content>. Please review.'. Admin gets visibility; no further action taken. End.
Step 7: End.
```

## Apply order

1. Write pseudo first; grep for `Validate Inputs` in the file.
2. Add the Validate Inputs node via `mcp__n8n__n8n_update_partial_workflow` (or fall back to jq+PUT — node_additions with custom connections often requires this).
3. Re-fetch WF-02 and verify `Validate Inputs` is present + connections route `When Executed → Validate Inputs → Detect Route`.
