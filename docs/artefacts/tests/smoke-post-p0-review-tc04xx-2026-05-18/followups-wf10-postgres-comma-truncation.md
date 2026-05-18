# Followup — WF-10 truncates relay messages at the first comma (Postgres queryReplacement bug)

**Severity:** [critical]
**Found during:** TC-0402b (admin→user relay extra exchange), 2026-05-18 03:19 UTC
**Impact:** Any admin Slack message containing a `,` is silently truncated at the first comma before being relayed to the user via WhatsApp. The user receives only the prefix. **Pre-go-live blocker.**

## Reproduction

1. Operator typed in `consult-61466927921` (Slack): `Back to you, ready to close`
2. User received on WhatsApp: `Back to you` (truncated at first comma)

## Root cause (verified against live workflow JSON + execution data)

In WF-10 (`wMh0oBRtJbvhLgOf`), node `Load User Status` (Postgres v2.5):

```json
{
  "operation": "executeQuery",
  "query": "SELECT status, $2 as channelName, $3 as messageText FROM chinmay_astro.users WHERE slack_channel_id = $1 LIMIT 1",
  "options": {
    "queryReplacement": "={{ $json.channelId }}, {{ $('Find Channel').item.json.name }}, {{ $json.messageText }}"
  }
}
```

n8n's Postgres node v2.5 `queryReplacement` field takes a comma-separated string of expressions, evaluates each expression, then **splits the resulting concatenated string on `,` to map tokens to `$1, $2, $3`**. When `$json.messageText = "Back to you, ready to close"`, the post-evaluation string is:

```
C0B567A175W, consult-61466927921, Back to you, ready to close
```

The splitter produces FOUR tokens, mapping:
- `$1` ← `C0B567A175W`
- `$2` ← `consult-61466927921`
- `$3` ← `Back to you`  ← **truncated here**
- `ready to close` ← extra, dropped

Hence the query projects `messageText = 'Back to you'` and that value flows downstream into WF-41 → WF-50 → WhatsApp.

Verified by inspecting execution 1239 (WF-41 input) — the entry node `When Executed by Another Workflow` already received `messagetext: "Back to you"`. The earlier WF-10 nodes (`Webhook`, `Extract Required Fields`, `Merge Message n Channel`) all show full text under `message_text`. The first node to show the truncated value is `Load User Status`.

## Why this slipped through

- All prior smoke-test relay messages happened to contain no commas (`Hi`, `Hi back`).
- The truncation is silent — n8n Postgres `executeQuery` succeeds; downstream nodes see a well-formed object; nothing fails.
- The field name change `message_text` → `messagetext` in the Postgres output also obscures the trail.

## Fix options

| Option | Effort | Risk | Notes |
|---|---|---|---|
| **A. Switch to per-parameter Query Parameters** (Postgres node has a separate `Query Parameters` collection where each `$n` gets its own value field) | Low | Low | Cleanest. No splitting, no escaping concerns. The right answer for v2.5+. |
| **B. Embed expressions directly in the SQL** (e.g. `WHERE slack_channel_id = '{{ $json.channelId }}'`) | Low | **High** — SQL injection vector if any value is user-controlled (messageText IS user-controlled here) | Do not choose. |
| **C. Bump node typeVersion to 2.6 and use the new parameterization UI** | Medium | Low | Same end-state as A but with a node upgrade. Verify schema is preserved. |
| **D. Encode commas in expressions** (e.g. `{{ $json.messageText.replace(/,/g, '\\,') }}` if n8n's splitter respects escapes) | Low | Uncertain — depends on whether splitter honors escaping | Workaround at best. |

**Recommended: A.** Same node, switch from `Options → Query Replacement` to a per-`$n` parameter list.

## Other potential blast-radius sites

The same `queryReplacement` comma-split pattern may exist in other workflows. Worth a project-wide sweep before go-live:

```bash
grep -rln 'queryReplacement' workflows/
# then for each hit:
#   - if the value contains 2+ expressions separated by ", "
#   - and any of those expressions can hold a comma-containing value (user input, free text)
#   - flag as same bug
```

This deserves its own sprint item similar to the recent `followups-input-contract-sweep`.

## Verification plan after fix

1. Send admin Slack message containing multiple commas and special chars: `Back to you, ready to close, and one more thing!`
2. Confirm full text arrives on WhatsApp.
3. Repeat with a SQL-special-char message (`O'Brien, that's $5,000`) to confirm parameterization not concatenation.
4. Re-run TC-0402 in the next smoke test.

## Note on the wider Postgres `queryReplacement` pattern

This is a well-known n8n footgun — the `queryReplacement` field documentation does not warn that comma-separation conflicts with comma-containing values. Plugin improvement candidate: add a check to `technical-workflow-review` that flags any Postgres node with `options.queryReplacement` containing `, ` between expression boundaries AND any of those expressions referencing a user-input field.
