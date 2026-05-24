## Stopping Point

Running `monitor-test-run` session `docs/artefacts/tests/smoke-pre-golive-2026-05-24/` (P0 closeout — 9 TCs scoped). Completed TC-0606 ✅, raised BUG-NEW-02 [critical] (opted_out users locked in re-engagement loop because WF-01's `Opted Out?` IF routes ALL inbound — including nfm_reply form submissions — to WF-21, bypassing WF-02 and never reaching WF-22). Test user 61466927921 (id=28) is in `opted_out`, channel C0B567A175W preserved. TC-1007 deferred (WA UI blocks whitespace-only sends). TC-0315 / TC-0704 / TC-1006 deferred at session start (need crafted webhook). 4 P0 TCs (TC-0604, TC-0302, TC-1012, TC-0605) blocked by BUG-NEW-02 — need user reset (DML wipe or new phone) before they can run.

## Next Action

Resume the test session at `docs/artefacts/tests/smoke-pre-golive-2026-05-24/session.md`. First step: ask operator whether to (a) DML wipe user 28 via the CLAUDE.md clean-slate SQL [`DELETE FROM chinmay_astro.admin_actions WHERE user_id=28; DELETE FROM chinmay_astro.users WHERE phone_number='61466927921'; DELETE FROM chinmay_astro.pending_users WHERE phone_number='61466927921'`] or (b) use a different test phone. Once chosen, re-capture cursors (exec + time + per-table) into `.cursors/`, then walk through TC-0604 → TC-0302 → TC-1012 → TC-0605 in that order, narrating each action and ticking after each.

## Blockers

- **BUG-NEW-02 [critical]** is documented in `session.md` + `followups-bug-new-02-resolution.md` (the followups file holds the design discussion for the proposed WF-26 "Re-Engaged Opted-Out User Handler" fix). Operator flagged that the WF-26 design is a starting point only — final design discussion must happen before pseudo is written. No code/pseudo/.md edits made this session.
- 4 remaining P0 TCs cannot proceed until either DML wipe or test-phone switch unblocks the loop.
- Post-MVP tracker item raised (operator note): no mechanism for users to update birth details after onboarding — captured in `followups-bug-new-02-resolution.md` for backlog.
- Plugin improvement: `monitor-test-run` skill should add a "diagnostic technique" callout for routing/orphan-node bugs — diff `runData | keys` (what actually ran) against the static connection graph (what could run) to identify dead branches or filter-layer interceptions. Used in this session to pinpoint BUG-NEW-02 root cause in 3 jq calls. Also: `generate-functional-test-cases` and `monitor-test-run` should flag TCs requiring client-side-bypass (whitespace, empty body, bot-echo) as "webhook-simulation-only" so operators don't queue them for normal WA-client smoke. Apply via `flush-plugin-improvements` skill before next session.

## Changed Reference Values

None. n8n credentials, workflow IDs, channel IDs all unchanged. Cursors persisted in `docs/artefacts/tests/smoke-pre-golive-2026-05-24/.cursors/` (exec-cursor=1911, time-cursor≈2026-05-24T01:50Z) — re-capture fresh cursors at resume since time will have passed.
