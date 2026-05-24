# Sprint Follow-ups — smoke-resume-remediation-2026-05-19

Findings surfaced during batch execution that were not in the original sprint scope. Each entry is classified strict (blocks batch advancement, must be addressed) or adjacent (logged, not blocking).

## [2026-05-19] — Post-Batch-1 (P0) regression

### Adjacent — WF-44 Call WF-25 Intent Classifier — wrong field names passed
- **Workflow:** WF-44 Feedback Recorder (Du2CJ3OTohRFZYoA), node `Call WF-25 Intent Classifier`
- **Found while:** investigating upstream field names for TD-001 fix
- **Issue:** WF-44's `Call WF-25 Intent Classifier` passes `workflowInputs.value`:
  - `messageText: ={{ $json.messageText }}` — but `$json` at this point is WF-01's `Prepare User Data` output which has `messageContent`, not `messageText`. WF-25 also expects `messageContent` (it destructures `const { phoneNumber, userId, messageContent } = input;`). Result: WF-25 receives `messageContent: undefined`.
  - `userId: ={{ $json.userId }}` — but `$json.userId` is undefined; WF-01 emits `user.id` (nested). WF-25 destructures top-level `userId`. Result: WF-25 receives `userId: undefined`.
  - `userStatus: ={{ $json.userStatus }}` — undefined (WF-01 emits `user.status` nested).
- **Cause-and-effect:** WF-25's Gemini prompt becomes `...User message: "undefined"...`, intent classifier returns garbage / falls back to userStatus-based default. The intent-classification step is effectively non-functional in the feedback path — the user's feedback text is never seen by WF-25.
- **Why this didn't surface in TD-001 validation:** TC-0404's failure mode (`no parameter $2`) happened downstream at Save Feedback to DB, masking the upstream intent-classification bug. Once the parameter-binding fix lets the chain complete, this becomes the next failure mode.
- **Proposed fix:** Change Call WF-25 Intent Classifier's `workflowInputs.value` to:
  - `messageContent: ={{ $json.messageContent }}`
  - `userId: ={{ $json.user.id }}`
  - `userStatus: ={{ $json.user.status }}`
  - `phoneNumber: ={{ $json.phoneNumber }}` (already correct)
- **Priority hint:** [major] — without it, feedback-intent routing inside WF-44 (`Is Rebook Intent?` / `Is Stop Intent?`) cannot work correctly, even after TD-001.
- **Decision:** _to be set by user_ (`fix-next-sprint` / `accepted-as-is` / `revisit-after-X`)

### Adjacent — WF-25 Intent Classifier input contract is silently lenient
- **Workflow:** WF-25 Intent Classifier (eTV1lUcYrXBg2q2T)
- **Found while:** tracing WF-44's caller-input mismatch above
- **Issue:** WF-25's `Prepare Intent Request` Code node consumes `messageContent`, `phoneNumber`, `userId` from `$input.first().json`. If callers pass wrong field names (as WF-44 does — see above), it silently falls back: undefined `messageContent` → Gemini prompt contains "undefined" → fallback intent based on `userStatus`. No error is raised. Other callers (WF-02, WF-23, WF-44) likely have the same naming mismatch given WF-01's actual output shape (`messageContent`, `user.id`, `user.status`).
- **Proposed fix:** Audit every caller of WF-25 against the canonical input contract `{phoneNumber, userId, messageContent, userStatus}`. Add a strict guard in `Prepare Intent Request`: if any required field is missing, return a structured error rather than falling back to a userStatus-based default.
- **Priority hint:** [major] — silent fallback hides bugs and produces wrong classifications.
- **Decision:** _to be set by user_

### Strict — none
No strict-class findings during the P0 batch regression. Postgres-node hygiene sweep clean across all 28 workflows (no missing `=` prefix on templated queries, no `additionalFields.queryParams` anti-pattern, no SELECT lookup without `alwaysOutputData`).

## [2026-05-19] — Post-Batch-2 (P1, TD-004 technical-workflow-review)

Full tracker + HTML: `docs/artefacts/reviews/technical-workflow-review-2026-05-19/`. Summary appended here for sprint-state continuity.

### Strict — none
No strict-class findings across the 12 scoped un-exercised workflows. No P0 runtime-breakers introduced.

### Adjacent — TD-NEW-T1: Inline `'{{ $json.x }}'` SQL string-interpolation in PG nodes
- **Severity:** 🟠 — SQL-injection-resistant for numeric phone numbers but anti-pattern; inconsistent with project's `$N` + queryReplacement convention.
- **Affected (5 nodes across 3 workflows):**
  - WF-45 Rebook Handler — `Load User Record`, `Set status=payment_pending` (in TD-004 scope)
  - WF-40 User → Admin Relay — `Load User Record` (out of TD-004 scope; sibling sweep)
  - WF-11 Command Parser — `Lookup Blocked User`, `Unblock User` (out of TD-004 scope)
- **Proposed fix:** convert each to `WHERE phone_number = $1` + `options.queryReplacement: "={{ $json.phoneNumber }}"`. Surgical class. ~3000 tokens.
- **Decision:** _to be set by user_

### Adjacent — TD-NEW-T2: PG queryReplacement comma-string anti-pattern in 2 safe nodes
- **Severity:** ⚪ — currently safe (only machine-generated values flow through); future-proof hazard if a refactor pipes user-controlled text through.
- **Affected:**
  - WF-22 Form Response Handler — `Save Slack Channel ID`
  - WF-32 Payment Confirmation Receiver — `Create Payment Record`
- **Proposed fix:** convert to JS-array form `={{ [a, b, c] }}`. Surgical. ~1500 tokens.
- **Decision:** _to be set by user_

### Adjacent — TD-NEW-T3: `admin_actions` missing `user_id` index
- **Severity:** 🟡 — performance only; table currently 0 rows but TD-003 (batch 3) will populate it.
- **Proposed fix:** `CREATE INDEX idx_admin_actions_user_id ON chinmay_astro.admin_actions(user_id);` plus optional `idx_admin_actions_action_type`. Bundle with TD-003 if convenient.
- **Decision:** _to be set by user_

### Plugin improvements (out of scope of this project sprint)
- **PLUGIN-T1:** tighten C13 regex to avoid false-positive on `={{ $json.preBuiltJsonString }}` pattern (current regex matches both safe whole-body expression and broken raw-string template). Flush via `flush-plugin-improvements`.
- **PLUGIN-T2:** extend C12 with `accepts_aliases` declaration in `docs/well-known-downstreams.yml` to suppress false-positives where the downstream sub-workflow has explicit alias tolerance (e.g. WF-52's `input.phone_number || input.phoneNumber`). Flush via `flush-plugin-improvements`.

## [2026-05-20] — TD-003 redirection (admin_actions → messages coverage)

### Decision — `admin_actions` table deprecated (single-admin model)
- **Trigger:** User challenged the TD-003 premise during batch-3 audit. `messages` is the canonical communication log; `admin_actions` is redundant for single-admin operation (no "who did it" question — always Chinmay in prod, project owner on test user 61466927921 only).
- **Decision:** TD-003 redirected from "build admin_actions audit-log" to "close messages-table touchpoint-coverage gaps (Slack side)". admin_actions removal logged separately to post-MVP tech debt as **TD-NEW-026** (P3 housekeeping).
- **Existing partial writes stay in place** for now (WF-11 Unblock node — works but no performed_by; WF-47 Log to admin_actions — silently no-ops). Harmless since nothing reads from the table.
- **Audit doc:** `docs/artefacts/sprints/smoke-resume-remediation-2026-05-19/td003-touchpoint-audit.md`

### Adjacent — TD-NEW-T3 (admin_actions missing user_id index) is now moot
- **Earlier finding (post-batch-1 regression, 2026-05-19):** flagged `admin_actions.user_id` lacked an index; deferred to user.
- **Updated (2026-05-20):** TD-NEW-026 will drop the table entirely. No index needed. **Decision: dropped (superseded by TD-NEW-026).**
