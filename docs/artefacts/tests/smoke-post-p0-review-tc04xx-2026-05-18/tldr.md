# TL;DR — Smoke test (post-P0-review, TC-04xx resume) — 2026-05-18

## Verdict

**6 of 8 scenarios PASS, 2 FAIL (1 critical + 2 critical-cascade) — all FAILs subsequently FIXED & verified.** Critical-path workflows for consultation messaging, close, rebook, and payment submission all green at test time. The two failures were localised to (a) admin→user relay text containing commas, and (b) free-text feedback after a consultation closes. Both received full root-cause analysis here, then were fixed in the follow-up `smoke-post-p0-review-tc04xx-2026-05-18` sprint (plus a `timestamp-convention` sprint that added strict-UTC across schema + container TZ). **Post-sprint static verification on 2026-05-18T15:32Z confirms all 5 bugs + the TZ work resolved in live n8n + Postgres** — see the verification table at the bottom of `session.md` in the appendix.

## Bugs at a glance

| ID | Sev | Workflow | What broke | Fix applied | Status |
|---|---|---|---|---|---|
| BUG-01 | [critical] | WF-10 | Admin→user relay truncates text at first `,` because `Load User Status` Postgres node uses `queryReplacement` as a comma-separated expression string and the splitter doesn't escape comma-containing values | Array-form `queryReplacement` `={{ [a,b,c] }}` (sprint Batch 1, commit 2a33905) | ✅ Fixed & verified 2026-05-18T15:32Z |
| BUG-02 | [critical] | WF-43 | `Gemini General Response` HTTP node — `jsonBody` raw-string template embeds `{{ $json.geminiPrompt }}` inside a JSON string literal, so any prompt with `\n`, `"`, or `\` produces invalid JSON and the node throws | Object-interpolation `jsonBody` `={{ {contents:[...]} }}` (sprint Batch 1, commit 2a33905) | ✅ Fixed & verified |
| BUG-03 | [critical] | WF-43 | `Prepare Gemini Response Prompt` writes literal `User: undefined` into the prompt — wrong variable reference, never reads the user's text | Template literal `User: ${d.messageContent}` (sprint Batch 1, commit 2a33905) | ✅ Fixed & verified |
| BUG-04 | [major] | WF-25 | Intent classifier returned `intent: null` for "Amazing service"; routed the free-text feedback to the broken Gemini fallback path instead of the proper feedback-save path. Re-prioritised: previously P3, now feedback-path P0 | Deeper root cause discovered: Gemini cred had query-param NAME literal `"Gemini n8n Key"` (should be `key`) → HTTP 400 every call. Fixed by switching Classify Intent + WF-43 Gemini auth to predefined `googlePalmApi` cred, hardening `userStatus` input contract, and adding `consultation_closed → feedback_intent` fallback in `Handle Gemini Error` (sprint Batch 2, commit 2a33905) | ✅ Fixed & verified |
| BUG-05 | [major] | WF-12 + 4 doc surfaces | WF-12 is active in n8n but has no caller (WF-41 superseded it); registry, CONTEXT.md, STATUS.md all wrong in different ways | WF-12 deactivated (`active: false`); zero callers across 28 live workflows (sprint Batch 3, commit 3451197) | ✅ Fixed & verified |
| TZ-NEW | n/a | schema + container | (Out of original scope — surfaced during sprint follow-up) Mixed-TZ confusion: Postgres columns were `timestamp` (no TZ); n8n container TZ assumed-IST; UTC vs IST drift in execution timestamps vs admin-facing times | All 13 `chinmay_astro.*` timestamp columns migrated to `timestamptz`; n8n container `n8n-prod` set to `TZ=UTC`; Postgres session `SHOW TIMEZONE` = `UTC`; CLAUDE.md "Strict UTC Everywhere" section + spec `docs/artefacts/specs/2026-05-18-timestamp-convention-design.md` (commits d11c3ae, 04ec7a6, eb54dae, 464fa6b, c128b1e) | ✅ Fixed & verified |

## Test scope

- **Phone:** `61466927921` (test user id=28, name "Abcs")
- **Scenarios exercised:** TC-0401 user→admin, TC-0402 admin→user (Hi back), TC-0402b.1 user→admin with emoji, TC-0402b.2 admin→user with comma (failed), TC-0403 CLOSE CONSULT, TC-0404a feedback button, TC-0404b free-text feedback (failed), TC-0501 REBOOK, TC-0801 Payment Completed
- **Scenarios deferred:** TC-0303 admin APPROVE PAYMENT for the new payment (would exercise WF-33 second-time consultation), TC-06xx STOP/HELP, TC-07xx BLOCK/UNBLOCK, TC-0802 REJECT PAYMENT, full TC-0404 happy path (depends on BUG-02/03/04 fixes)

## State carry-forward

User id=28 ends in `payment_submitted` with `payments.id=11` (₹500, pending_verification). Admin Slack has an outstanding approve-payment notification in `consult-61466927921`. Either admin can APPROVE next session to exercise the second-time consultation path, or wipe the user per `CLAUDE.md` clean-slate SQL before re-running onboarding.

## Sprint fix list — STATUS

The original ordered fix list from this report (BUG-02 → BUG-01 → BUG-03 → BUG-04 → BUG-05 → plugin improvements → end-to-end re-test → optional TC-0303 regression) was executed across two sprints. Items 1–5 + the surfaced TZ-NEW work all completed and statically verified live; items 7–8 (end-to-end WhatsApp re-test + TC-0303 second-approve regression) were explicitly excluded by the user during sprint planning. See the verification table at the bottom of `session.md` (in the appendix) for the live-state evidence.

### Open items not closed by this round

- **PLUGIN-01 / PLUGIN-02** (`technical-workflow-review` static checks for the BUG-02 jsonBody-string pattern and BUG-01 queryReplacement-comma pattern) — landing in the plugin is tracked separately and should be verified via the plugin's own changelog rather than this smoke-test report.
- **Gemini 2.5-flash-lite 503 transients** (CLAUDE.md TD-NEW-016) — `retryOnFail=true` mitigates; watch the rate.
- **WF-23 / WF-30 / WF-44 input-contract** — these call WF-25 in `defineBelow` mode mapping `userStatus: {{ $json.userStatus }}` which resolves to undefined in their upstream context, so their prompts render `Status: unknown`. Not BUG-04 scope (their routing doesn't depend on `consultation_closed`), but a separate input-contract followup worth its own sprint item.
- **WF-11 STATS day-boundary** (`DATE(col)=CURRENT_DATE` in UTC session vs IST admin) — explicitly accepted as won't-fix per project decision; not re-flagging.
