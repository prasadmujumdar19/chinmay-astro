## Stopping Point
Mid **BMX-P5-MATRIX live smoke** (sprint exit gate). The full onboarding→pay→APPROVE→consult→CLOSE→STOP→opted_out journey is now proven live end-to-end, and BUG-06 (WF-43/30/31 Gemini prompts mis-framing greetings) is fixed + verified. Of the 7 S8 opted_out re-engagement acceptance cells, **3 PASS (S8×A greeting, S8×B free-form question, S8×C STOP-while-opted_out)**; the remaining 4 (S8×D/E/F/I) are not yet run. Test phone **61466927921** is currently `consultation_closed`. The test dir `docs/artefacts/tests/smoke-bmx-s8-optedout-reengage-2026-05-31/session.md` is the system of record (sprint artefacts keep one-liners + pointer).

## Next Action
Run the **4 remaining S8 cells** live, re-STOPping to `opted_out` before each (any message lifts opted_out→consultation_closed, so reset between cells). Exec cursor in test dir `.cursors/exec-cursor` (currently 2551 — re-baseline to live max before starting). For each: operator sends STOP, then the cell message, then "check" → verify via Postgres MCP + n8n execs > cursor:
- **S8×D REBOOK** → re-engage → rebook path → `payment_pending` (do LAST — it leaves the user in payment_pending, not closed)
- **S8×E HELP** → re-engage → HELP handling
- **S8×F reserved-looking kw** (e.g. "LIST" or "APPROVE PAYMENT") → re-engage; NOT treated as an admin command
- **S8×I "Payment Completed" button** (tap an old interactive button) → re-engage handled
These are keyword/button paths that branch BEFORE Gemini (unaffected by BUG-06) — expect them to pass; verify wiring per gate. Then: update the matrix HTML static verdicts (`docs/artefacts/reviews/behavior-matrix-2026-05-27/index.html`), **rewrite the S8×G expectation** (opted_out+media now re-engages via WF-26, NOT zero-outbound — DR-4), and close the gate (remove `_active`, lint state.md, registry WIP).

## Blockers
- **Stored flow JSON still stale vs published flow** (carried over): `workflows/flows/collect-personal-details.json` is the OLD 2-screen version; the published Meta flow `1137788551887662` is single-screen + EmbeddedLink privacy + OptIn. Update the stored JSON to match before committing the flow. BUG-04 (eager pattern error markers) deferred non-blocking — settle alongside the flow-JSON update.
- **`.md` regen pending at sprint end** — WF-01/21/23/45/50/22 plus now **WF-43/30/31** `.md` are stale/hand-swapped. Run one `generate-workflow-md` pass at sprint end. Tracked in test dir `followups-md-regen.md`.
- **Post-MVP workstream logged** (not a blocker): combined WF-43 opted_out-vs-closed tone nuance + data-retention policy/deletion job — see `followups.md` 2026-05-31 entry. User decided KEEP data + current Gemini answer for MVP; medium-priority compliance item before any scale-up/marketing.
- This batch's changeset (handoff + 3 workflow JSONs + 3 pseudo + state.md + followups.md + session.md) is committed as the same push that carries this handoff — if you're reading this file on `main`, the BUG-06 fix batch is pushed.

## Changed Reference Values
- **WF-43 (`3va0M06kijgyLejf`), WF-30 (`gGJBY5fJha0Let8I`), WF-31 (`HB8nXudAtk9iXz7C`)** live changed — `Prepare Gemini Response Prompt` rewritten greeting-aware (WF-43: + REBOOK CTA, dropped email callout & "just completed your consultation" framing; WF-30: keeps ₹500 pay-nudge + email; WF-31: keeps under-review reassurance + email). Backups `archive/backups/{3va0M06kijgyLejf,gGJBY5fJha0Let8I,HB8nXudAtk9iXz7C}-2026-05-31-12-56.json`. Exports refreshed; pseudo synced (WF-43 Step 12, WF-30 Step 5, WF-31 Step 6).
