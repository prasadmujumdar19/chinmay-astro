# Sprint Plan — Canonical executeWorkflow Shape Sweep

**Created:** 2026-05-18
**Trigger:** Smoke test `smoke-test-post-p0-review-2026-05-17` surfaced two production-blocking executions:
- WF-32 `Call WF-50 (Send Payment Confirmation Received Message)` failed with `"No information about the workflow to execute found. Please provide either the 'id' or 'code'!"` when user tapped Payment Completed.
- WF-31 `Call WF-25 Intent Classifier` failed with the same error when user sent free-form text in payment_submitted state.

WF-32 was hot-fixed inline during the smoke session (commit pending) so testing could continue. WF-31 was not — testing paused to capture this sprint.

**Root cause:** the prior P0 Coverage Sprint's "47 nodes restored to canonical 2.1.4 shape" only covered the 14 workflows that sprint touched. The same broken pattern exists in **10 more workflows / 26 nodes** that the P0 sprint did not visit. The pattern (typeVersion ≤ 1.1 + plain-string `workflowId` + missing `source/operation/mode/workflowInputs`) fails at runtime on n8n 2.1.4 when the executeWorkflow node is hit, but the n8n UI accepts and saves it silently — so the only detection is execution-time, which means user testing surfaces it as a P0.

**Fix:** apply the canonical 1.2 shape (see `build-workflow` Step 5e.1 idempotent roller) to all listed nodes. The roller is safe to run across all executeWorkflow nodes in each workflow — it leaves already-canonical nodes unchanged.

## Tasks

Each task is one workflow, all node fixes inside it bundled via one Step 5e PUT. Surgical class, 3-node-or-more scope → Step 5e regenerate-by-copy required (per `build-workflow` Step 5 scope rubric).

- [ ] **WF-12 Admin -> WhatsApp Relay** (`RjwHs9Dx5cK8Q5wD`) — 1 node: `Call WF-50 Send WhatsApp`
- [ ] **WF-20 Keyword Handler** (`LgIDj1v4ZbCPlX25`) — 3 nodes: `Send HELP Response`, `Route to Rebook`, `Call WF-47 Unsubscribe`
- [ ] **WF-23 Pre-Form Intent Filter** (`VpCER0Vqq3NYJGpI`) — 3 nodes: `Call WF-25 Intent Classifier`, `Re-send Flow Form via WF-50`, `Call WF-47 Unsubscribe`
- [ ] **WF-25 Intent Classifier** (`eTV1lUcYrXBg2q2T`) — 4 nodes: `Send Garbage Warning`, `Notify Admin of Garbage`, `Send Block Warning`, `Auto-Block via WF-46`. **Critical-path workflow** (called by every free-form state handler). Verify with at least one free-form intent test post-fix.
- [ ] **WF-30 Payment Pending Intent Filter** (`gGJBY5fJha0Let8I`) — 3 nodes: `Call WF-25 Intent Classifier`, `Send Payment Reminder via WF-50`, `Call WF-47 Unsubscribe`
- [ ] **WF-31 Payment Submitted Handler** (`HB8nXudAtk9iXz7C`) — 4 nodes: `Call WF-25 Intent Classifier`, `Send Under Review via WF-50`, `Relay to Admin Slack`, `Call WF-47 Unsubscribe`. **Blocking smoke test resume** — verify by sending free-form text from `61466927921` (current state = payment_submitted, waiting for admin approval).
- [ ] **WF-40 User -> Admin Relay** (`du32QBZbSQOjfESe`) — 1 node: `Call WF-51 (Post to Slack)`
- [ ] **WF-44 Feedback Recorder** (`Du2CJ3OTohRFZYoA`) — 4 nodes: `Call WF-25 Intent Classifier`, `Call WF-45 Rebook`, `Send Ack via WF-50`, `Call WF-47 Unsubscribe`
- [ ] **WF-45 Rebook Handler** (`MUG7rPgSHc7UtAE9`) — 1 node: `Send Payment Instructions`
- [ ] **WF-47 Unsubscribe Handler** (`2U7mxHMyqA41ROKX`) — 2 nodes: `Send Hold Message via WF-50`, `Send Opt-out Confirmation via WF-50`. These are at tv=1.0 (older than the rest, also auto-bumps to 1.2 in roller).

**Out of scope (canonical-cleanup only, not failing at runtime):**

- WF-22 Form Response Handler (`dr8QM0m92Ml8MvIh`) — 3 nodes are tv=1.2 + `__rl` workflowId already, just missing the cosmetic `source/operation/mode`. n8n 2.1.4 runtime tolerates this. Optional polish, not required to unblock smoke test.

## The fix (same for every workflow)

Drop into `build-workflow` Step 5e.2 transform — idempotent across all executeWorkflow nodes in the file:

```jq
(.nodes[]? | select(.type == "n8n-nodes-base.executeWorkflow")) |= (
  ((.parameters.workflowId | if type == "object" then .value else . end) // "") as $wid
  | .typeVersion = (if .typeVersion < 1.2 then 1.2 else .typeVersion end)
  | .parameters = {
      operation: "call_workflow",
      source: "database",
      workflowId: {__rl: true, value: $wid, mode: "list", cachedResultUrl: ("/workflow/" + $wid)},
      workflowInputs: (.parameters.workflowInputs // {mappingMode: "passthrough", value: {}, matchingColumns: [], schema: [], attemptToConvertTypes: false, convertFieldsToString: true}),
      mode: (.parameters.mode // "once"),
      options: (.parameters.options // {})
    }
)
```

Same transform was already applied successfully to WF-32 during the smoke session — see `archive/backups/emUOLWVZiNVxcOe3-2026-05-18-00-31.json` for the pre-state if rollback needed.

## Suggested batching for plan-sprint

These 10 fixes are mutually independent and structurally identical — `plan-sprint` will likely batch them aggressively. Suggested split:

- **Batch 1 (critical path + smoke unblocker):** WF-25, WF-31 — verify with one end-to-end test each (intent classification on any free-form input, free-form text in payment_submitted state) before moving on.
- **Batch 2 (payment + onboarding flow):** WF-23, WF-30, WF-22 (if including), WF-45.
- **Batch 3 (post-consultation + utility):** WF-12, WF-20, WF-40, WF-44, WF-47.

End of sprint: bulk export workflows + single commit.

## Plugin improvement candidates (capture during the sprint)

1. **`technical-workflow-review` doesn't catch this pattern.** Add a check: any executeWorkflow node at tv < 1.2 OR with plain-string `workflowId` is a runtime-blocker → flag as fail, not warn.
2. **`post-workflow-lint.sh` hook doesn't catch this on write.** Same expanded rule belongs in the lint hook so any future workflow edit (especially via the n8n UI directly) is rejected at write time, not at run time.
3. **`build-workflow` Step 5f (pseudocode → JSON conversion).** Already added in plugin 1.12.0+. Reinforces: defaults aren't safe, always PUT the full canonical shape.
4. **Add `$('NodeName')` reference validator** to either `technical-workflow-review` or `post-workflow-lint.sh`: scan every expression for `$('XXX')` and verify XXX exists in the workflow's nodes list. The WF-22 `Save Slack Channel ID` bug from the same smoke session (referenced a non-existent node) would have been caught.
