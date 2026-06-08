## Stopping Point
Batch 9 / PDF-15 (P0 — relay 24h-window deliverability gate on WF-41) is built, verified, and complete. The 24h-window cluster's next work is Batch 10 (PDF-16 + PDF-17, both P1), not yet started. Rolling sprint stays open (`_active` untouched per user control).

## Next Action
Re-invoke `build-sprint @docs/artefacts/sprints/pre-demo-minor-fixes-31May26/tasks.md` and pick up **Batch 10**: build **PDF-16 first** (customer-bound callers WF-41/WF-34/WF-42 must read WF-50's `success=false` and post a plain-language in-channel notice to Dr. Chinmay via WF-51 — DD-4; this is the failure backstop beneath PDF-15), then **PDF-17** (WF-34 `se82n3MUQ9xE5aEr` payment-rejection → always-template send using the approved `payment_rejection` template, retry button payload `payment_completed`; M5 tap shape — coordinate with PDF-19's dual-shape handler). PDF-16 + PDF-17 both touch WF-34 → soft same-workflow siblings, run sequentially, re-fetch live WF-34 at each pickup. Both are `pseudo-impact: yes` (revise WF-41/WF-34/WF-42 `.pseudo` first). Confirm n8n tunnel is open before starting.

## Blockers
- **Live WhatsApp send smoke for PDF-15 is DEFERRED and pending** — in-window (free-form text) + out-window (`astrology_service_update` template, incl. a >850-char multi-part case) to a real test number was NOT run (side-effecting external send). Run it as a coordinated smoke, ideally right after PDF-16 lands so any residual Meta send error is surfaced rather than silent. Live data shows user 40 (`consultation_active`, 54.4h out-of-window) is a ready out-window test case.
- **Plugin improvement candidate (not flushed):** `generate-workflow-md.py` regenerates ALL ~31 `.md` (ignores any per-WF arg) → phantom timestamp diffs after a single-workflow build. Proposed `--only WF-XX` filter. Logged in this sprint's `followups.md` under "Plugin improvement candidates". Apply via `flush-plugin-improvements` when convenient (methodology-level → plugin).

## Changed Reference Values
- WF-41 (`6PzJRZsF7k2d9hV7`) now 4 nodes (added `Load Last Inbound` Postgres v2.6) and `WF-50 (Send WhatsApp)` executeWorkflow `mode=each` (was `once`). Live `updatedAt=2026-06-08T08:13:51.036Z`. Batch 9 changeset (incl. this handoff) rides in one push — if you're reading this on `main`, Batch 9 is pushed.
