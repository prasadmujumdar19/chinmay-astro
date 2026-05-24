## Stopping Point

Completed `monitor-test-run` session `docs/artefacts/tests/smoke-pre-golive-2026-05-24/` — P0 closeout queue done. Report built at `docs/artefacts/tests/smoke-pre-golive-2026-05-24/report.html` (81 KB, 4 followup files, 7 story scenarios). PASS outcomes: TC-0606 (morning), TC-0604, TC-0605 (all freshly executed) + TC-0302 + TC-1012 (PASS by reference to SP-03 smoke 2026-05-23). Deferred: TC-0315 / TC-0704 / TC-1006 / TC-1007 — unreachable via WA client, need crafted-webhook session. Test user 30 (61466927921) left in `opted_out`, channel C0B567A175W preserved (DR-10). Empirical confirmation across 3 wipe-and-onboard cycles (28→29→30) that WF-52 is idempotent on channel name — re-use, not orphan, is the actual behavior of DR-10. Cursors persisted in `.cursors/` at exec=2008, time=2026-05-24T05:51:16Z.

## Next Action

Pick from the priority queue in `tldr.md` Tomorrow's queue section:
1. **BUG-NEW-02 design discussion** (blocking go-live) — WF-26 starting point in `docs/artefacts/tests/smoke-pre-golive-2026-05-24/followups-bug-new-02-resolution.md`. Operator flagged it's a starting point only — final design discussion required before pseudo is written.
2. **Crafted-webhook session** for the 4 deferred TCs (TC-0315 / TC-0704 / TC-1006 / TC-1007) — direct POSTs to WF-00 with synthetic JSON bypassing WA client validation. Treat as a fresh `monitor-test-run` session with `test-type=patch-validation` and `slug=webhook-simulation`. Each payload needs operator sign-off before sending.
3. **GAP-01 pseudo-first design sprint** — see `docs/artefacts/tests/smoke-pre-golive-2026-05-24/followups-message-logging-gap.md`. Three schema options listed (nullable user_id / ghost row / phone-keyed); operator decision required before pseudo.
4. **O-01 design call** — pick A/B/C in `followups-consultations-stale-active.md` for `consultations.status` post-opt-out. Bundle WF-42 / WF-46 / WF-47 audit into one design pass.
5. **GAP-02** — post-go-live; deferred per registry classification. See `followups-retention-workflows.md`.

## Blockers

- **BUG-NEW-02 [critical]** is unresolved. Documented in morning's session.md + `followups-bug-new-02-resolution.md`. Reproducible by sending any inbound from user 30 right now (still in `opted_out`) — WF-01's `Opted Out?` IF will route it to WF-21 instead of WF-22's re-engagement path. Do not DML-wipe user 30 if you want to reproduce.
- Plugin improvement: `monitor-test-run` skill should add a "diagnostic technique" callout for routing/orphan-node bugs (diff `runData | keys` vs static connection graph). Also: `generate-functional-test-cases` and `monitor-test-run` should flag TCs requiring client-side-bypass (whitespace, empty body, bot-echo) as "webhook-simulation-only". Apply via `flush-plugin-improvements` skill before next session.
- Plugin improvement: jq `dur_ms` calculation in build-sprint Step 4A `(.stoppedAt | fromdateiso8601) - (.startedAt | fromdateiso8601)` errors on fractional-second ISO timestamps; fall back to sub-second truncation (lossy) or compute manually. Used the truncation workaround this session — all five waves were sub-second so the loss didn't matter, but it would for slow-execution flagging.

## Changed Reference Values

None. n8n credentials, workflow IDs, channel IDs all unchanged. Cursors persisted in `docs/artefacts/tests/smoke-pre-golive-2026-05-24/.cursors/` (exec=2008, time=2026-05-24T05:51:16Z) — re-capture fresh cursors at any resume since time will have passed.

## Open Findings (carry into sprint planning)

| ID | Sev | One-line | Followup file |
|---|---|---|---|
| BUG-NEW-02 | critical | opted_out users locked in re-engagement loop | `followups-bug-new-02-resolution.md` (morning) |
| GAP-01 | major | pre-users-row WA events not logged in `messages` | `followups-message-logging-gap.md` |
| GAP-02 | minor | WF-73 / WF-74 maintenance + retention not built | `followups-retention-workflows.md` |
| O-01 | minor | `consultations.status` stays `active` after opt-out | `followups-consultations-stale-active.md` |
