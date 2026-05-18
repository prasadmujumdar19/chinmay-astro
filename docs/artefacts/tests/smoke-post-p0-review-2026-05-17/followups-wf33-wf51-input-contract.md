# Followup — WF-33 → WF-51 admin notification fails (input contract violation)

**Surfaced during:** smoke-test-post-p0-review TC-0303 APPROVE PAYMENT (exec 1200 / 1203) on 2026-05-17 ~16:05 UTC.
**Severity:** [major] — admin Slack audit trail silently fails; operator has no Slack record of approval action. Core user-facing flow succeeded (status transitioned to consultation_active, WhatsApp welcome delivered).

## Symptom

WF-51's `Post to Slack` node returns Slack `invalid_arguments`. Error cascades up: WF-51 → WF-33 → WF-11 → WF-10, all reporting `status: error`. The user-facing path completed before the error — user got their WhatsApp welcome, DB state was updated, consultation row was created. Only the admin Slack notification was lost.

## Root cause (traced via runData)

WF-33 sequence at point of failure:
1. `Call WF-50 Notify User` returned `{success, messageId, phoneNumber, sentAt}` (WF-50's RESPONSE shape — sentAt etc.)
2. `Call WF-51 Notify Admin in Channel` is wired directly after, `workflowInputs.mappingMode: "passthrough"`, `value: {}`
3. WF-51's trigger received `null` (n8n 2.1.4 quirk — `passthrough` mode + caller's upstream is itself another executeWorkflow returning a response shape that doesn't match WF-51's expected input)
4. WF-51's `Post to Slack` reads `$json.channelId` / `$json.messageText` → both undefined → Slack rejects

This is the **build-workflow Step 5f.2 input-contract violation** pattern. The fix isn't in WF-51; it's in EVERY caller that wires WF-51 in passthrough mode without an explicit "prepare payload" node between the WF-50 call and the WF-51 call.

## Fix (per caller — not one-shot)

For WF-33 specifically:
- Insert a `Set` node "Prepare Admin Notification" between `Call WF-50 Notify User` and `Call WF-51 Notify Admin in Channel`
- The Set node should emit `{channelId: "<users.slack_channel_id>", messageText: "Payment approved for <name> (<phone>). Consultation now active."}`
- WF-33's earlier nodes (`Load User by Phone`, `Update User Status`) have the user record — pull `slack_channel_id` and `name`/`phone_number` from there. Use n8n's `$('NodeName').item.json.field` reference syntax.

Structural change to WF-33 → impact analysis required → `build-workflow` Step 5e (regenerate-by-copy) is the right tool.

## See also — sweep results

A project-wide sweep ran on 2026-05-17 immediately after this finding. **12 other call sites have the same pattern** (passthrough mode + upstream node type doesn't produce `{channelId, messageText}` or `{phoneNumber, messageType, ...}`). See `followups-input-contract-sweep.md` for the full list and triage.
