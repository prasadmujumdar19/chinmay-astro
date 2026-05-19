# Technical Workflow Review Tracker

**Date:** 2026-05-19
**Scope:** 12 un-exercised workflows from smoke-pre-golive-resume session
**n8n version:** 2.1.4 (per CLAUDE.md)
**Driver:** Sprint `smoke-resume-remediation-2026-05-19` TD-004 (P1, Batch 2)
**Coverage statement:** **All 12 scoped workflows reviewed.**

Scoped workflows: WF-21 zM8WbxSdt9nXRoLZ, WF-22 dr8QM0m92Ml8MvIh, WF-23 VpCER0Vqq3NYJGpI, WF-25 eTV1lUcYrXBg2q2T, WF-30 gGJBY5fJha0Let8I, WF-31 HB8nXudAtk9iXz7C, WF-32 emUOLWVZiNVxcOe3, WF-41 6PzJRZsF7k2d9hV7, WF-42 fx70vqyJtRdF2DgR, WF-45 MUG7rPgSHc7UtAE9, WF-47 2U7mxHMyqA41ROKX, WF-52 IO5BZLUxuVmjzk5I.

## Check Status

| Check | Status | Findings |
|-------|--------|----------|
| C1 Disabled nodes | ✅ Pass | 0 disabled nodes in scope |
| C2 Orphaned nodes | ✅ Pass | 0 orphaned non-trigger nodes |
| C3 TypeVersion compat | ✅ Pass | No node exceeds n8n 2.1.4 max (exec ≤1.2, IF ≥2, switch 3+) |
| C4 Expression format (`=` prefix) | ✅ Pass | 0 templated queries missing `=` prefix |
| C5 Structural / schema | ✅ Pass | No broken connections; no malformed workflowId objects |
| C6 Connection integrity | ✅ Pass | All connections reference existing nodes |
| C7 UI rendering (cachedResultName) | ⚪ Not audited | Cosmetic; deferred — n8n MCP validate not run per-workflow to save context budget |
| C8 Postgres schema alignment | ⚠️ Adjacent | All column names match schema; 5 PG nodes (3 workflows; 2 in scope) use inline `'{{ }}'` SQL interpolation instead of `$N` + queryReplacement |
| C9 Index coverage | ⚠️ Adjacent | `admin_actions` table has only pkey — missing `user_id` index (post-go-live perf concern) |
| C10 Database data health | 🔴 Known | `messages`=0 rows (TD-002 remediates), `admin_actions`=0 rows (TD-003 batch 3) — both already-planned sprint items |
| C11 Postgres alwaysOutputData | ✅ Pass | All 5 SELECT lookup/guard nodes in scope have `alwaysOutputData: true` |
| C12 executeWorkflow input contract | ⚪ False positive | 1 ⚠️ flagged (WF-22 → WF-52 via postgres upstream) but WF-52's `Prepare Channel Name` code has explicit `input.phone_number || input.phoneNumber` and `input.name || input.userName` aliasing — safe |
| C13 HTTP raw-string jsonBody | ⚪ False positive | 1 flagged (WF-25 `Classify Intent` `jsonBody: "={{ $json.geminiBody }}"`); detector regex matches `={{` as broken, but this is the safe single-expression form where `geminiBody` is pre-built via `JSON.stringify`. Plugin-improvement candidate (tighten regex) |
| C14 PG queryReplacement comma-string | ⚠️ Adjacent | 2 PG nodes use comma-string queryReplacement (WF-22 Save Slack Channel ID, WF-32 Create Payment Record); both pass only machine-generated values → safe per skill severity table, but anti-pattern for future-proofing |
| C15 Orphaned-active sub-workflows | ✅ Pass | 0 orphaned-active sub-workflows in scope |

## Strict findings — block go-live

**None.** No P0 runtime-breaking issues introduced by the 12 scoped workflows.

The two already-known empty tables (`messages`, `admin_actions`) are tracked as TD-002 (now fixed in batch 1, awaits user TC validation) and TD-003 (batch 3). Not re-listed here.

## Adjacent findings — recorded, do NOT block batch advancement

Each will be classified by the user (fix-next-sprint / accepted-as-is / revisit-after-X).

### ADJ-T1 — Inline `'{{ $json.x }}'` SQL interpolation in PG nodes (C8 sibling sweep)
- **Severity:** 🟠 — SQL-injection-resistant for numeric phone numbers, but anti-pattern for user-controlled text and inconsistent with project's `$N` + `queryReplacement` convention. Maintenance hazard.
- **Affected (in scope of TD-004):** WF-45 Rebook Handler — `Load User Record`, `Set status=payment_pending`
- **Adjacent siblings (out of scope of TD-004, surfaced by project-wide sibling sweep):** WF-40 User → Admin Relay `Load User Record`; WF-11 Command Parser `Lookup Blocked User`, `Unblock User`
- **Proposed fix:** convert each to `WHERE phone_number = $1` + `options.queryReplacement: "={{ $json.phoneNumber }}"` (single-value form acceptable for 1-param queries) or `={{ [$json.phoneNumber] }}` for explicit array form.
- **Decision:** _to be set by user_

### ADJ-T2 — PG queryReplacement comma-string in 2 safe nodes (C14)
- **Severity:** ⚪ Currently safe (only machine-generated values: integer IDs, literal strings, timestamps via `$now`). Future-proof hazard if a refactor ever pipes user-controlled text through these positions.
- **Affected:** WF-22 Form Response Handler `Save Slack Channel ID`; WF-32 Payment Confirmation Receiver `Create Payment Record`.
- **Proposed fix:** convert to JS-array form `={{ [a, b, c] }}` — same expressions, wrapped.
- **Decision:** _to be set by user_

### ADJ-T3 — `admin_actions` table missing `user_id` index (C9)
- **Severity:** 🟡 — performance concern post-scale, not correctness. Today the table is 0 rows (TD-003 will populate it).
- **Proposed fix:** `CREATE INDEX idx_admin_actions_user_id ON chinmay_astro.admin_actions(user_id);` and optionally `idx_admin_actions_action_type`. Run as part of TD-003 audit-log fix, since that's when the table starts taking traffic.
- **Decision:** _to be set by user_

### ADJ-T4 — Plugin: tighten C13 regex (false-positive on safe `={{ $json.preBuiltJsonString }}` pattern)
- **Severity:** ⚪ — methodology improvement, not project bug.
- **Cause:** Current regex `^=\s*[\{\[]` matches both `={{ expr }}` (safe whole-body expression) and `={"field": ...}` (broken raw-string template). The safe form's first character after `=` is also `{`.
- **Proposed fix:** require the character AFTER the first `{`/`[` to be NOT `{` (which would indicate `={{` — start of expression). Pattern: `^=\s*\{[^\{]` for object-literal broken form; `^=\s*\[[^\{]` for array-literal broken form. Alternatively (and simpler): require the body string to contain a `}}, {{` interpolation OR end with a literal `"` to distinguish broken-template from whole-body-expression.
- **Decision:** flush to plugin via `flush-plugin-improvements` skill (out of scope of this sprint).

### ADJ-T5 — Plugin: C12 false-positive when downstream sub-workflow has explicit alias tolerance
- **Severity:** ⚪ — methodology improvement.
- **Cause:** C12 only inspects upstream node type. WF-22 → WF-52 trip the warning because upstream is a postgres node, but WF-52 has `input.phone_number || input.phoneNumber` aliasing inside its first Code node so the contract is satisfied at runtime.
- **Proposed fix:** allow `well-known-downstreams.yml` to declare `accepts_aliases: [phoneNumber: [phone_number], userName: [name]]` so the C12 check can suppress the warning when the upstream's row column names match a declared alias.
- **Decision:** flush to plugin (out of scope of this sprint).

## Full Findings — per-check evidence

### C13 — WF-25 Classify Intent jsonBody (false positive)
```json
{
  "name": "Classify Intent",
  "type": "n8n-nodes-base.httpRequest",
  "specifyBody": "json",
  "jsonBody": "={{ $json.geminiBody }}"
}
```
`$json.geminiBody` is built by `Prepare Intent Request` Code node via `JSON.stringify(...)` — a pre-encoded JSON string. n8n's HTTP node sends this as the body. Not the broken raw-string anti-pattern.

### C14 — Two PG queryReplacement comma-strings (machine-generated only)
- **WF-22 Save Slack Channel ID:**
  `={{ $('Ensure Slack Channel Exists (WF-52)').item.json.channelId }}, {{ $now }}, {{ $('Create User Record').item.json.id }}`
- **WF-32 Create Payment Record:**
  `={{ $json.user.id }}, {{ 500 }}, {{ "INR" }}, {{ "pending_verification" }}, {{ "gpay" }}`

Both pass only Slack channel ID, integer user ID, internal timestamps, currency code, and string literals. No user-controlled text.

### C8 — Inline `'{{ }}'` SQL interpolation
Detected via `jq '.parameters.query | test("=\\s*'\''\\{\\{")'`:

| Workflow | Node | In scope? |
|---|---|---|
| WF-45 Rebook Handler | Load User Record | ✅ |
| WF-45 Rebook Handler | Set status=payment_pending | ✅ |
| WF-40 User → Admin Relay | Load User Record | ❌ (out-of-scope sibling) |
| WF-11 Command Parser | Lookup Blocked User | ❌ (out-of-scope sibling) |
| WF-11 Command Parser | Unblock User | ❌ (out-of-scope sibling) |

The siblings are surfaced for future-sprint scoping; per TD-004 spec, new findings spawn their own sprint items.

### C10 — DB row counts
```
admin_actions     0
consultations     2
messages          0
payments          2
pending_users     2
users             1
```
Both empty-table findings already have sprint items: `messages`=0 → TD-002 (fixed in batch 1; awaits TC validation); `admin_actions`=0 → TD-003 (batch 3).
