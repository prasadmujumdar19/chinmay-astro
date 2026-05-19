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
