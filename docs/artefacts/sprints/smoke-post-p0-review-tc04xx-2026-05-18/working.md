# Working Copy — Smoke Post-P0-Review TC-04xx Sprint (2026-05-18)

**Source:** `docs/artefacts/tests/smoke-post-p0-review-tc04xx-2026-05-18/report.html` (read-only)
**Slug:** `smoke-post-p0-review-tc04xx-2026-05-18`
**Build with:** `build-sprint --slug=smoke-post-p0-review-tc04xx-2026-05-18`

build-sprint will annotate this file with `> **Status:** ...` blockquotes as items progress.

---

## Batch 1 — P0 Pre-go-live workflow fixes

### BUG-02 · WF-43 Gemini HTTP jsonBody escaping  [P0 / critical]

`Gemini General Response` HTTP node — `jsonBody` is a raw-string template embedding `{{ $json.geminiPrompt }}` inside a JSON string literal. Unescaped `\n`/`"`/`\` from the prompt makes the body invalid JSON; n8n's HTTP v4.2 validates jsonBody and throws `"JSON parameter needs to be valid JSON"`. Pattern fix: replace raw-string `jsonBody` with an expression returning an object (`={{ {"contents":[{...}]} }}`). Sweep ALL HTTP nodes in the project for the same anti-pattern.

- Workflow: WF-43 (`3va0M06kijgyLejf`)
- Node: `Gemini General Response`
- Blast radius: high (any HTTP node interpolating dynamic text into a JSON-string template has the same risk)

### BUG-01 · WF-10 Postgres queryReplacement comma split  [P0 / critical]

`Load User Status` Postgres node uses `options.queryReplacement` as a comma-separated expression string. n8n v2.5 splits the resulting concatenated string on `,` to map to `$1/$2/$3`, so any expression evaluating to a value containing a comma gets truncated. Fix: switch to per-parameter Query Parameters. Sweep ALL Postgres nodes in the project for `queryReplacement` strings with 2+ comma-separated expressions where any can hold user-input text.

- Workflow: WF-10 (`wMh0oBRtJbvhLgOf`)
- Node: `Load User Status`
- Blast radius: high (sweep required)

### BUG-03 · WF-43 Prepare Gemini Response Prompt variable fix  [P0 / critical]

`Prepare Gemini Response Prompt` jsCode references `${d.messageText}` which resolves to `undefined`. Point it at `messageContent` (or `rawMessage.text.body`) — the field WF-43's callers actually populate.

- Workflow: WF-43 (`3va0M06kijgyLejf`)
- Node: `Prepare Gemini Response Prompt`
- Soft dep: BUG-02 (same workflow, sequential)

---

## Batch 2 — P0 Investigation

### BUG-04 · WF-25 reliability sprint  [P0 / major — re-prioritised from P3]

WF-25 Gemini intent classifier returned `intent: null` for "Amazing service" — `Parse Intent` defaulted to `general_enquiry`, missing the feedback path. Investigate the root cause (prompt clarity, model behaviour, userStatus input contract noted in prior handoff) AND add a status-aware fallback: when `userStatus=consultation_closed` AND intent is uncertain, treat as `feedback_intent` rather than `general_enquiry`.

- Workflow: WF-25 (`eTV1lUcYrXBg2q2T`)
- Related: `followups-wf25-intent-classifier.md` (prior session)
- Note: report calls this "its own sprint" — batched separately from the WF-43/WF-10 fixes.

---

## Batch 3 — P1 Cleanup

### BUG-05 · WF-12 cleanup + doc reconciliation  [P1 / major]

WF-12 (Admin → WhatsApp Relay) is active in n8n but has no callers — WF-41 superseded it. Verified: zero references to `RjwHs9Dx5cK8Q5wD` in any other workflow JSON. Four-way doc inconsistency: workflow-registry.md, CONTEXT.md:144, STATUS.md:109/133/158 all disagree.

Steps:
1. Deactivate WF-12 in n8n (preserve JSON; do not delete).
2. Update workflow-registry.md WF-12 row → 🟡 Deactivated.
3. Edit CONTEXT.md:144 and STATUS.md:109,133,158 to remove stale claims.
4. Plugin guardrail (orphaned-active-workflow check in `technical-workflow-review`) — out of scope here unless trivially co-located; otherwise file as PLUGIN-03 followup.

---

## Batch 4 — P2 Plugin improvements

### PLUGIN-01 · technical-workflow-review HTTP-jsonBody guardrail

Add a check to the methodology plugin's `technical-workflow-review` skill: flag HTTP nodes with `specifyBody=json` + raw-string `jsonBody` that interpolates `{{ ... }}` directly inside a JSON string literal. Encodes BUG-02 anti-pattern.

- Target repo: `github.com/prasadmujumdar19/n8n-whatsapp-methodology`
- Routing: plugin update-skill workflow (version bump + CHANGELOG + commit + cache sync). NOT a direct cache edit.
- Soft dep: BUG-02 (so canonical fix shape is known before encoding the guardrail).

### PLUGIN-02 · technical-workflow-review Postgres-queryReplacement guardrail

Add a check: flag Postgres nodes whose `options.queryReplacement` contains 2+ comma-separated expressions where any expression evaluates to user-controlled text. Encodes BUG-01 anti-pattern.

- Target repo: `github.com/prasadmujumdar19/n8n-whatsapp-methodology`
- Routing: plugin update-skill workflow.
- Soft dep: BUG-01.

---

## Excluded items (per user instruction)

- Re-test BUG-02/03/04 fixes — verification work, not implementation.
- Optional TC-0303 admin APPROVE PAYMENT regression — verification.
- State carry-forward (user id=28 → payment_submitted) — operational state, not work item.
