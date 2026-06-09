## Stopping Point
PDF-20 done — both window reads now WhatsApp-scoped via `metadata->>'transport'='wa'`: WF-41 `Load Last Inbound` (`6PzJRZsF7k2d9hV7`, the PDF-15 relay gate — was bare `direction='inbound'`, Slack-inbound rows were skewing it) and WF-75 `Load Window-Closing Consults` (`YnxDRcnCugnpGY0n`, switched off the `message_type` proxy onto the same `transport` discriminator for consistency). This resolves the followups adjacent finding. WF-75 remains **INACTIVE**. With PDF-18 (Batch 11) + PDF-20 (Batch 13) done, the sprint's **actionable queue is exhausted**; only design-gated PDF-02/03 (P2) remain. Rolling sprint stays open (`_active` not removed).

## Next Action
No actionable build item remains. When the user is ready, run the **deferred coordinated live smoke** for the 24h-window cluster — it now must exercise the CORRECTED WF-41 + WF-75 (PDF-20) alongside PDF-15/16/17/18/19. Concrete checks to fold in: (a) WF-41 — with a customer whose only recent inbound is the astrologer's Slack reply and whose WhatsApp inbound is >24h old, confirm the relay now takes the out-window TEMPLATE path (pre-PDF-20 it wrongly sent free-form); user 42 is the live at-risk case once its WA inbound ages past 24h (after ~2026-06-10 08:59Z). (b) WF-75 — activate it, backdate a `consultation_active` user's WhatsApp inbound to ~20h ago (SQL fixture), confirm the nudge posts, repeats on a later poll, and self-terminates once a WhatsApp outbound is logged after that inbound. Do NOT activate/smoke unilaterally (real Slack/WhatsApp sends).

## Blockers
- **WF-75 activation + live match-path smoke is user-gated** (side-effecting). 0-match / no-spurious-nudge path proven by live SQL dry-run.
- **PDF-15/16/17/18/19 live coordinated smoke still deferred** (all real external sends); PDF-20 folds into it.
- PDF-02/PDF-03 remain design-gated (undesigned) — need a design pass before build.

## Changed Reference Values
- **WF-41** (`6PzJRZsF7k2d9hV7`) `Load Last Inbound` query now ends `… AND direction='inbound' AND metadata->>'transport'='wa'`. Pseudo re-stamped `live_reconciled_at=2026-06-09T20:59:50.788Z`. Backup `archive/backups/6PzJRZsF7k2d9hV7-2026-06-10-06-57.json`.
- **WF-75** (`YnxDRcnCugnpGY0n`) `Load Window-Closing Consults` FILTERs now use `metadata->>'transport'='wa'` (both inbound + outbound). Pseudo re-stamped `live_reconciled_at=2026-06-09T21:00:02.547Z`. Backup `archive/backups/YnxDRcnCugnpGY0n-2026-06-10-06-57.json`. Still INACTIVE.
- Batch 13 changeset (WF-41 + WF-75 JSONs + both pseudos + registry + state.md + tasks.md + followups.md + this handoff) is committed as the same push that carries this handoff — if you're reading this file on `main`, the batch is pushed.
