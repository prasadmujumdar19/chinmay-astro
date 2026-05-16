## Stopping Point

All 6 runtime bugs identified in the 2026-05-16 technical review (F-01 through F-06) are **fixed and verified live**. Verification done via direct n8n API export + Postgres schema check on 2026-05-16. Supersedes `handoff-technical-review-2026-05-16-complete.md`.

## Verified Fixes (do not re-open)

| ID | Fix | Verification |
|----|-----|--------------|
| F-01 | Added `stage` column to `chinmay_astro.users` | `information_schema.columns` shows `stage` present |
| F-02 | WF-11 UNBLOCK + WF-47 opt-out INSERTs use `action_type` / `notes` (not `action` / `reason`) | grep of live workflow JSON |
| F-03 | All 17 `executeWorkflow` nodes across WF-11, WF-12, WF-20, WF-43, WF-45, WF-47 have `typeVersion ≤ 1.3` | grep — zero nodes at v2 |
| F-04 | WF-47 `Send Hold Message` + `Send Opt-out Confirmation` `workflowId` is string `BUVun38WEKb12zg9` (was resource-locator object) | jq type check returns "string" |
| F-05 | Every Postgres `query` field containing `{{ }}` starts with `=` prefix (WF-11, WF-40, WF-45, WF-46, WF-47) | grep — zero violations |
| F-06 | WF-43 `Gemini General Response` `jsonBody` brackets balanced (4 `{` / 4 `}`) | bracket count |

## Guardrails — why we shouldn't see these regress

These checks are already enforced by **plugin v1.7.0 `hooks/post-workflow-lint.sh`** (synced to cache 1.10.0):
- executeWorkflow typeVersion > 1.3
- workflowId resource-locator object instead of string
- Postgres query missing `=` prefix when `{{ }}` present
- Unmatched `{{ }}` brackets in HTTP Request jsonBody

The lint hook runs on every `build-workflow` skill invocation. **If the hook is bypassed, these bugs can return** — do not commit workflow JSON edits without running the export+lint pipeline.

F-01 (DB schema) is enforced by **build-workflow Step 4 SQL column cross-check** against `information_schema.columns` — any new node that writes to a non-existent column is blocked at build time.

F-02 (admin_actions column names) is **not** lint-covered. The schema itself enforces it (INSERTs would fail at runtime), so the test plan should include any flow that writes to `admin_actions` (STOP, BLOCK, UNBLOCK).

## Next Action

Pre-smoke exploratory monitoring session in progress:
- Test type: exploratory
- Slug: `pre-smoke-test`
- Test phone: `61466927921`
- Watch surface (default): all active workflows, `users` + `admin_actions` + `payments` + `message_log` tables, `C0A5B0ZE81E` + `consult-*` Slack channels
- Latency threshold: 5000 ms
- Log: `.methodology/test-exploratory-pre-smoke-test-2026-05-16.md`

⚠ **Phone number `61466927921` has +61 (Australia) prefix.** Per Design Rule + WF-01 country check (Indian +91 only), this number is expected to be silently dropped or rejected by WF-01. Confirm with operator whether the country gate has been temporarily relaxed for testing, or whether the test is intentionally validating the country-gate behavior (TC-0108).

## Still Pending (from previous handoff — not addressed this session)

- **F-07**: Slack node operation dropdown verification (WF-11, WF-33, WF-34, WF-41, WF-42, WF-46, WF-51) — needs UI check
- **F-08**: APPROVE/REJECT/CLOSE/BLOCK passthrough mapping smoke test (WF-10, WF-11, WF-33)
- **F-09**: Add `onError: "continueRegularOutput"` to webhook nodes in WF-00 and WF-10
- VPS tech-debt items: STATUS-TD-01, STATUS-TD-02, TD-NEW-001, TD-NEW-019, STATUS-TD-05

## Review Artifacts (unchanged)

- Tracker: `docs/superpowers/TechnicalWorkflowReview_tracker.md`
- HTML report: `docs/superpowers/TechnicalWorkflowReview_2026-05-16.html`
- Both still not committed to GitHub.
