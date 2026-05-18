# Followup — WF-60 Message Logger appears structurally broken (P1)

**Surfaced during:** smoke-test-post-p0-review free-form text test on 2026-05-17 ~14:56 UTC.
**Severity:** [major] — does not block user-facing flow (errors swallowed by side-branch pattern), but defeats the purpose of having a message log; downstream analytics, debug, and admin-channel audit are all unreliable.

## Symptom

WF-60 (Message Logger, `6H75p935FpBVBQtV`) ran twice during the test ack — once for the inbound user message (exec 1185), once for the outbound system reply (exec 1192). Both reported `status: success` at the workflow level. But:

```
SELECT COUNT(*) FROM chinmay_astro.messages WHERE user_id = 28;
-- returns 0
```

User id=28 exists (`phone_number = 61466927921`, status `payment_submitted`). The messages table has zero rows for this user, despite WF-60 having been invoked at least twice that turn (and previously across the smoke test).

## Why this matters

1. WF-60 is the audit log for the entire system. If it's silently failing INSERTs, the system has no message history — no Slack admin can scroll a consult channel to see what the user said; no post-incident debugging is possible; no analytics work.
2. The "side-branch + `onError: continueRegularOutput`" wiring (added in the P0 Coverage Sprint to keep logging from blocking the routing path) is hiding the failure from the execution status. From the n8n UI WF-60 looks healthy. Only direct DB inspection reveals the issue.
3. Operator (user) reports: "I checked WF-60 and it needs exhaustive review for logic — I feel like there's something seriously wrong there." Recommend treating this as a workflow-level redesign + verification, not a point fix.

## Recommended next step

Out of scope for this smoke test. Open a separate sprint:

```
/n8n-whatsapp-methodology:technical-workflow-review
```

Limit input to WF-60 only (`6H75p935FpBVBQtV`). The technical-workflow-review skill will surface:
- Disabled / orphaned nodes
- node typeVersion mismatches
- expression syntax issues (e.g. missing `=` prefix on SQL `query` field with `{{ }}`)
- Postgres `alwaysOutputData` hygiene
- `$('NodeName')` reference resolution (the same class of bug that hit WF-22 `Save Slack Channel ID` earlier in this smoke session)

Follow with `/n8n-whatsapp-methodology:functional-code-review` if the technical review comes back clean, focused on WF-60's pseudocode-to-JSON conformance — the pseudocode says "Trigger → Extract Message Data → Log to Messages Table → Done" but live runtime is not producing rows, so something diverged.

## Plugin improvement candidate

Add a smoke-test-time check (or `monitor-test-run` cross-check rule): when a sub-workflow runs and is expected to write to a DB table, the tick should optionally verify the DB row appeared. The current cross-check only compares "workflow ran" — not "side effect actually happened." This would have caught the WF-60 silent failure on the very first tick.
