# Followup — BUG-NEW-03: WF-44 Save Feedback to DB crashes on every invocation

**Surfaced during:** TC-0404 (post-CLOSE user feedback), 2026-05-19 10:32:39 Z
**Severity:** `[critical]` — feedback chain entirely broken; user receives no acknowledgement
**Affected:** every consultation_closed user who replies with feedback text
**Pre-existing?** Likely yes — fix in prior sprint repaired the *upstream routing* (WF-25 + WF-43 cred + fallback) but the downstream insert was never exercised end-to-end because the route was broken. TC-0404 is the first run where execution reaches WF-44 with valid input.

## Evidence

Live n8n WF-44 (`Du2CJ3OTohRFZYoA`), node `Save Feedback to DB`:
```json
{
  "name": "Save Feedback to DB",
  "type": "n8n-nodes-base.postgres",
  "query": "UPDATE chinmay_astro.users SET feedback = $1, stage = NULL, updated_at = NOW() WHERE id = $2",
  "queryReplacement": null,
  "options": null
}
```

Execution trace (2026-05-19T10:32:39 Z):
```
WF-00 (exec 1402) → WF-01 (1404) → WF-02 (1405) → WF-43 (1407) → WF-44 (1409 root cause)
                                                                   "there is no parameter $2"
```
All 5 executions report identical error — single-bug cascade.

## Root cause

Postgres node uses `$1, $2` positional placeholders in the SQL string, but `options.queryReplacement` is `null` — no values are passed. Even if it were non-null, the syntax must be the array form `={{ [$json.feedbackText, $json.userId] }}` (post-2026-05-18 sprint convention) — the comma-string form is forbidden (BUG-01 from prior sprint).

This is the same root-cause family as historical BUG-01 (WF-10 Load User Status) but in a node that was never exercised because upstream routing was broken until the prior sprint fix.

## Suggested fix

Two surgical changes to `Save Feedback to DB`:
1. Set `options.queryReplacement` to `={{ [ $json.feedbackText, $json.userId ] }}` (or whichever field names WF-44 actually emits — verify against the upstream node's output schema).
2. Verify the SQL still passes the technical-workflow-review's queryReplacement-comma-string check (PLUGIN-02 from prior session, if landed in the plugin).

Schema check: confirm `chinmay_astro.users` actually has a `feedback` column AND a `stage` column. If `stage` doesn't exist, SQL will fail differently after the queryReplacement fix.

## Acceptance

- User in `consultation_closed` sends feedback text → `users.id=N.feedback` populated, `users.stage = NULL`, no errors in n8n executions.
- Bot sends a thank-you message back via WF-50.
- Re-run TC-0404 end-to-end after fix.

## Related findings (do not fix in same PR — separate items)

- WF-43 "Route to Feedback WF-44" node propagates the error verbatim — consider whether WF-43 should catch + log instead of failing the consultation-close chain. Out of scope for the immediate fix.
- No `feedback` table exists; the design stores feedback as a column on `users`. Verify this matches the product intent before any reporting/analytics work on feedback.
