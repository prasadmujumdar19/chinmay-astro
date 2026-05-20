# TL;DR — Smoke test (pre-go-live resume) — 2026-05-19

## Verdict

**11 of 13 scenarios PASS at smoke-test time, 2 FAIL — both FIXED + verified post-sprint.** Critical user-facing path is intact end-to-end: APPROVE → consultation_active → bi-directional relay (including spicy unicode) → CLOSE → consultation_closed. The two failing paths at smoke time — (a) WF-44 Save Feedback to DB crashing on every invocation, (b) WF-60 Message Logger running cleanly but persisting nothing — were remediated in sprint `smoke-resume-remediation-2026-05-19` (TD-001 + TD-002), then live-verified on 2026-05-20 with end-to-end feedback roundtrip. A follow-on WF-60 quote-wrap caveat surfaced during verification was operator-patched same-day. **No regressions** — every fix from the 2026-05-18 sprint (BUG-01 comma truncation, BUG-02/03/04 Gemini path, BUG-05 WF-12 deactivation, timestamp-convention) holds under live re-test.

## Bugs at a glance

| ID | Sev | Workflow | What broke | Suggested fix | Status |
|---|---|---|---|---|---|
| BUG-NEW-01 | [critical] | WF-60 | Message Logger runs success in 22–101 ms with zero rows persisted; operator UI inspection: "many basic issues — variable used in next node but previous code node never returns it" | Architectural rebuild (TD-002, sprint `smoke-resume-remediation-2026-05-19`): 4 → 11 nodes with canonical-shape mapper, IF guards for skip + lookup, parameterised Postgres insert. Operator follow-on patch removed literal-quote wrap on `content` field. | ✅ Fixed & verified live 2026-05-20T09:07Z (rows 10+11 in `messages`) |
| BUG-NEW-02 | [major] → reclassified | global | `chinmay_astro.admin_actions` has 0 rows globally despite every APPROVE / CLOSE etc. being expected to land an audit row | Reclassified during sprint as deprecation per single-admin-model decision: existing writers in WF-11 + WF-47 remain as silent no-ops; nothing reads from the table; removal logged as project tech debt | ✅ Resolved (reclassified, see `memory: project_admin_actions_deprecated`) |
| BUG-NEW-03 | [critical] | WF-44 | `Save Feedback to DB` Postgres node uses `$1, $2` in SQL but `queryReplacement: null` → every feedback save errors with "there is no parameter $2"; user gets no acknowledgement | Sprint TD-001: set `queryReplacement` to `={{ [$('When Executed...').first().json.messageContent, $('When Executed...').first().json.user.id] }}` — array-form, references upstream trigger directly | ✅ Fixed & verified live 2026-05-20T08:41Z (`users.id=28.feedback` populated verbatim) |
| MINOR-01 | [minor] | schema | `payments.status` value is `approved` but column is `verified_at` — verb mismatch | Sprint TD-005: WF-33 + WF-11 Get Stats both updated to `'verified'`; 2 historical rows migrated via SSH+psql | ✅ Fixed & verified (`status='verified'` × 2, `'approved'` × 0) |

## Test scope

- **Phone:** `61466927921` (test user id=28, name "Abcs")
- **Scenarios PASSED:** TC-0303 (APPROVE PAYMENT, second-time consultation create), TC-0401 / 0401b / 0401c-mild / 0401c-spicy (user→admin relay incl. emoji + curly quotes + comma + ampersand + backslash), TC-0402 / 0402b / 0402c / 0402d (admin→user relay, same payload coverage), TC-0403 (CLOSE CONSULT)
- **Scenarios FAILED:** TC-0404 (user feedback after close — WF-44 crashed; cascade through WF-43, WF-02, WF-01, WF-00)
- **Scenarios NOT covered this session:** TC-0303-reject path (REJECT PAYMENT), TC-0501 (REBOOK), TC-06xx STOP/HELP, TC-07xx BLOCK/UNBLOCK, onboarding (WF-21/22 — pre-existing user used)

## Workflow coverage

**Exercised functionally this session (13):** WF-00 / 01 / 02 / 10 / 11 / 20 / 33 / 40 / 43 / 44 / 50 / 51 / 60

**NOT exercised — need technical-workflow-review (sprint item 4):** WF-21, WF-22, WF-23, WF-25, WF-30, WF-31, WF-32, WF-41, WF-42, WF-45, WF-47, WF-52, plus any P3/utility workflows. Static check before functional re-test prevents whack-a-mole.

## Sprint outcome

`sprint-input.md` was consumed by `plan-sprint` → executed via `build-sprint` as `smoke-resume-remediation-2026-05-19`. All 5 items closed (TD-001…TD-005), with TD-003 reclassified mid-sprint as deprecation. See `docs/artefacts/sprints/smoke-resume-remediation-2026-05-19/state.md` for the full sprint audit trail.

## Open items carried to next testing session

- `messages.consultation_id` is `null` on rows 10+11 — WF-60 isn't resolving the active consultation for the user. Cosmetic for user-flow, raise as a sprint item before any reporting/analytics work on `messages`. (🟡 minor)
- Untested scenarios still pending live verification: REJECT PAYMENT (TC-0802), REBOOK (TC-0501), STOP/HELP (TC-06xx), BLOCK/UNBLOCK (TC-07xx), onboarding from scratch (WF-21/22).
- ADJ-T1 through ADJ-T5 from technical-review — user-classify next sprint.

## State carry-forward

User id=28 ends in `consultation_closed` after the post-fix verification roundtrip. Consultation id=10 closed (`ended_at=2026-05-19T10:30:42.681Z`). Slack channel `C0B567A175W` preserved per DR-10. `messages` table has 4 rows (2 pre-fix wrapped, 2 post-fix clean). `users.id=28.feedback` populated with verified spicy payload. Next session can either continue from this state for the pending scenarios or wipe per CLAUDE.md clean-slate SQL before re-running from onboarding.
