## Stopping Point
Two emergent fixes done this session (Batch 13):
- **PDF-20** — both window reads now WhatsApp-scoped via `metadata->>'transport'='wa'`: WF-41 `Load Last Inbound` (`6PzJRZsF7k2d9hV7`, the PDF-15 relay gate — was bare `direction='inbound'`, Slack-inbound rows were skewing it) and WF-75 `Load Window-Closing Consults` (`YnxDRcnCugnpGY0n`, switched off the `message_type` proxy onto the same `transport` discriminator). Resolves the followups adjacent finding.
- **PDF-21** — WF-41's out-window relay template repointed `astrology_service_update` → **`astrology_service_update_v2`** (user retired the old one for a Meta bold-render bug; v2 has corrected copy, same single-`{{1}}` send contract).

WF-75 remains **INACTIVE**. With PDF-18 (Batch 11) + PDF-20/21 (Batch 13) done, the sprint's **actionable queue is exhausted**; only design-gated PDF-02/03 (P2) remain. Rolling sprint stays open (`_active` not removed).

## Next Action
No actionable build item remains. When the user is ready, run the **deferred coordinated live smoke** for the 24h-window cluster — it now must exercise the CORRECTED WF-41 + WF-75 (PDF-20) and the new out-window template `astrology_service_update_v2` (PDF-21), alongside PDF-15/16/17/18/19. **Verify `astrology_service_update_v2` is Approved/Active in Meta (name + `en` lang + single body param) before the out-window relay send — a mismatch fails with Meta 132000/132001.** Concrete checks to fold in: (a) WF-41 — with a customer whose only recent inbound is the astrologer's Slack reply and whose WhatsApp inbound is >24h old, confirm the relay now takes the out-window TEMPLATE path (pre-PDF-20 it wrongly sent free-form); user 42 is the live at-risk case once its WA inbound ages past 24h (after ~2026-06-10 08:59Z). (b) WF-75 — activate it, backdate a `consultation_active` user's WhatsApp inbound to ~20h ago (SQL fixture), confirm the nudge posts, repeats on a later poll, and self-terminates once a WhatsApp outbound is logged after that inbound. Do NOT activate/smoke unilaterally (real Slack/WhatsApp sends).

## Blockers
- **WF-75 activation + live match-path smoke is user-gated** (side-effecting). 0-match / no-spurious-nudge path proven by live SQL dry-run.
- **PDF-15/16/17/18/19 live coordinated smoke still deferred** (all real external sends); PDF-20 folds into it.
- PDF-02/PDF-03 remain design-gated (undesigned) — need a design pass before build.

## Changed Reference Values
- **WF-41** (`6PzJRZsF7k2d9hV7`): `Load Last Inbound` query now ends `… AND direction='inbound' AND metadata->>'transport'='wa'` (PDF-20); `Prepare WhatsApp Message` `const TEMPLATE` now `'astrology_service_update_v2'` (PDF-21). Pseudo re-stamped `live_reconciled_at=2026-06-10T10:31:36.587Z` (covers both). Backup `archive/backups/6PzJRZsF7k2d9hV7-2026-06-10-06-57.json` (pre-PDF-20/21).
- **Template:** out-window relay now uses `astrology_service_update_v2` (replaces `astrology_service_update`, retired by user for a Meta bold-render bug). Header "Follow-up on your consultation", body "*Dr. Chinmay has responded to your message:* {{1}}" + "Thanks, Chinmay Astro", one `{{1}}`, `en`. Must be Approved in Meta before send.
- **WF-75** (`YnxDRcnCugnpGY0n`) `Load Window-Closing Consults` FILTERs now use `metadata->>'transport'='wa'` (both inbound + outbound). Pseudo re-stamped `live_reconciled_at=2026-06-09T21:00:02.547Z`. Backup `archive/backups/YnxDRcnCugnpGY0n-2026-06-10-06-57.json`. Still INACTIVE.
- Batch 13 landed in two pushes: PDF-20 (WF-41 + WF-75 window scoping) and PDF-21 (WF-41 template repoint) — both committed; this handoff rides in the PDF-21 push. If you're reading this file on `main`, both fixes are pushed.
