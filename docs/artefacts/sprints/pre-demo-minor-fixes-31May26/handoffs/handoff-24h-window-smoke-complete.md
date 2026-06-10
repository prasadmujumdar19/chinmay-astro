# Handoff — 24h-window deliverability coordinated smoke COMPLETE

## Stopping Point
The deferred coordinated live smoke for the 24h-window deliverability cluster (PDF-15/16/17/18/19 + emergent PDF-20/21) is **complete** — run end-to-end against a real WhatsApp number (61466927921 / user 41) via `monitor-test-run`. All happy paths GREEN; report at `docs/artefacts/tests/smoke-24h-window-deliverability-2026-06-10/report.html`. `state.md` + `tasks.md` updated with smoke-completion markers. The sprint changeset (these doc edits + the test session folder) is committed as the same push that carries this handoff — if you're reading this on `main`, it's pushed. Rolling sprint stays open (`_active` in place).

## Next Action
Update `docs/workflow-registry.md` — the WF-75 row still reads 🟡 "Built (inactive)" but WF-75 is now **ACTIVE in production** (smoke-verified, kept on per user decision 2026-06-10). Change that one row to 🟢 Active to remove the doc/reality drift. (One-line edit; not yet done.)

## Blockers
None blocking. Three non-blocking paths remain un-exercised (detail in `docs/artefacts/tests/smoke-24h-window-deliverability-2026-06-10/followups-remaining-paths.md`):
- **PDF-16** failure-visibility notice — never triggered (every send this session succeeded); needs a forced Meta failure (paused/over-length template) to exercise the `success=false` in-channel notice.
- **WF-75 self-termination** — repeat proven; the *stop* path (WA reply → `last_outbound_wa > last_inbound`, or inbound crossing 24h) is logic-proven but not live-demoed. Cheap to show: relay one WA reply to still-fixtured user 41, re-run the WF-75 dry-run.
- **PDF-19 buttons** — only "Done, Thanks." tapped; "Leave Feedback" / "Book Again" routes not individually exercised.

## Changed Reference Values
- **WF-75 Window-Closing Nudge (`YnxDRcnCugnpGY0n`) — now `active: true`** (was inactive). Project's first live scheduled workflow; polls every 2h.
- **Out-window relay template — now `astrology_service_update_v2`** (PDF-21); v1 `astrology_service_update` retired, 0 references.
- **User 41 (61466927921) left FIXTURED for test:** `status=consultation_active`, last WA inbound backdated to ~20h (unanswered), all other WA `messages` rows backdated to ~26h. It will keep matching/re-nudging WF-75 every 2h until its inbound ages past 24h or it receives a WA reply. Reset to `consultation_closed` (or clean-slate wipe) before unrelated testing.
