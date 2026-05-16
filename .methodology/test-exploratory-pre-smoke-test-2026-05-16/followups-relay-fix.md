# Follow-ups — Relay Fix (2026-05-16)

Three non-blocking caveats from BUG-03 fix verification. **Smoke-test passes; these are tech debt to address post-smoke / pre-go-live polish.**

Source: `.methodology/test-exploratory-pre-smoke-test-2026-05-16.md` (exec 993–999 confirmed live webhook-mode admin→user relay works).

---

## FU-RELAY-01 — Replace SELECT-smuggling with proper data merge or explicit mapping

**Workflow:** WF-10 Slack Admin Handler (`wMh0oBRtJbvhLgOf`), node `Load User Status`
**Current pattern:**
```sql
SELECT status, $2 as channelName, $3 as messageText
FROM chinmay_astro.users WHERE slack_channel_id = $1 LIMIT 1
```
queryReplacement: `={{ $json.channelId }}, {{ $('Find Channel').item.json.name }}, {{ $json.messageText }}`

**Why it's hacky:**
- Postgres is being used as a passthrough pipeline for runtime data that never lived in the DB
- Future readers will be confused about what's "real" data vs SELECT-literal smuggling
- Adds a DB round-trip every time even though only one column (`status`) needs the DB

**Preferred fix (pick one):**

1. **Caller-side explicit mapping (cleanest):** Change WF-10 `Call WF-41 (Admin->User Relay)` from `mappingMode: passthrough` to `defineBelow` with explicit schema mapping:
   - `channelName` ← `={{ $('Find Channel').item.json.name }}`
   - `messageText` ← `={{ $('Extract Required Fields').item.json.text }}` (or wherever the body is held)
   - `status` ← `={{ $('Load User Status').item.json.status }}`
   - `channelId` ← `={{ $('Extract Required Fields').item.json.channelId }}`
   Then revert `Load User Status` to `SELECT status FROM users WHERE slack_channel_id = $1 LIMIT 1`.

2. **Merge node (if mapping-by-node is preferred):** Insert a Merge node combining `Load User Status` output with `Find Channel` + `Extract Required Fields` outputs, then `Call WF-41` with passthrough.

**Effort:** ~10 min. Test by sending one live Slack message and confirming exec runs green.

---

## FU-RELAY-02 — Make `channelName` casing robust (or rename)

**Workflow:** WF-41 Admin -> User Relay (`6PzJRZsF7k2d9hV7`), node `Extract Phone from Channel`
**Current:**
```js
const channelName = input.channelname; // lowercase — relies on Postgres lowercasing
```

**Problem:** The SQL alias is written as `channelName` (camelCase) but Postgres returns it lowercase because the alias isn't double-quoted. The JS reads `channelname`. Two fragile assumptions:
- Anyone editing the SQL might add quotes around the alias → JS breaks
- Anyone editing the JS to camelCase → silently breaks (undefined)

**Fix (pick one):**

1. Double-quote the SQL alias: `SELECT status, $2 as "channelName", ...` AND change JS back to `input.channelName`.
2. Or rename SQL alias to lowercase: `SELECT status, $2 as channel_name, ...` AND change JS to `input.channel_name` (snake_case is unambiguous; nothing to lowercase).
3. Or — if FU-RELAY-01 is done — neither matters because the field arrives via n8n mapping, not Postgres.

**Effort:** Trivial. Often resolved automatically by FU-RELAY-01.

---

## FU-RELAY-03 — Verify other `mappingMode: passthrough` calls don't drop fields

**Scope:** All workflows that call sub-workflows via `executeWorkflow` nodes with `mappingMode: passthrough`. BUG-03's class of failure (upstream node strips fields the callee needs) is invisible without runtime exercise.

**Action:**
1. Enumerate every `executeWorkflow` node with `mappingMode: passthrough` across all 28 workflows
2. For each, identify the direct ancestor node and what shape it produces
3. Compare against the first node of the callee — does it read fields the ancestor doesn't provide?

**Candidate for plugin lint rule** — see `## Plugin improvement candidates` in `.methodology/test-exploratory-pre-smoke-test-2026-05-16.md`. If a static check is feasible, this becomes a build-time guard.

**Effort:** 30–60 min audit. Worth running before go-live to catch any other silent-data-loss cases.

---

## Status

| ID | Severity | Blocks smoke? | Owner | Status |
|---|---|---|---|---|
| FU-RELAY-01 | minor (tech debt) | No | TBD | Open |
| FU-RELAY-02 | minor (fragility) | No | TBD | Open |
| FU-RELAY-03 | minor (audit) | No | TBD | Open |
