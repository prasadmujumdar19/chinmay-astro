## Stopping Point
Batches 4 and 5 of the rolling sprint `pre-demo-minor-fixes-31may26` are complete and live: Batch 4 = WF-10 genuine-message gate (PDF-06 ✅, PDF-07 ✅, PDF-08 ⬜ partial — join-line pollution fixed, admin-command exclusion deferred per user Option B); Batch 5 = PDF-09 "Dr. Chinmay" customer-facing naming consistency (✅, 6 workflows edited). Sprint is rolling — `_active` remains in place; the actionable queue is now exhausted (all remaining items are design-gated or deferred and need a fresh session).

## Next Action
Start the next item in a FRESH session. The highest-value unblocked piece is **PDF-08 remainder** (no design gate): move the WF-60 transcript-logging side-branch in WF-10 (`wMh0oBRtJbvhLgOf`) off `Extract Required Fields` onto the validated `relay_text` path (off `Build WF-41 Payload`), and rewrite the `Build WF-60 Payload (Slack Inbound)` Code node to read from `Classify User Channel Message` / `Extract Required Fields` (both always-executed on that branch) — so the `messages` transcript stops capturing the admin's own APPROVE/CLOSE commands. PDF-02/03 (Batches 2/3) and PDF-04/05 (Batch 6) remain design-gated and need a brainstorm/design pass before build (see their `Design gate: true` items in state.md).

## Blockers
None blocking. PDF-02/03/04/05 require a design pass before build (design-gated by plan); PDF-09's remaining "Dr." question is fully resolved (user chose "Dr. Chinmay"). PDF-08's deferral is a user decision (Option B), not a blocker.

## Changed Reference Values
- **n8n API key (`.env` `N8N_API_KEY`)**: the `.env` key was stale/expired (was returning 401); replaced this session with the working key from the n8n MCP config (`claude mcp get n8n`, exp 1788307200). `.env` is gitignored — the live working key lives in the MCP server config, not the repo. If a future session sees 401s from the export/backup scripts, re-sync `.env` from `claude mcp get n8n`.
- Batch 4 + Batch 5 changeset (7 workflow JSONs: `wMh0oBRtJbvhLgOf` + `emUOLWVZiNVxcOe3`/`LgIDj1v4ZbCPlX25`/`HB8nXudAtk9iXz7C`/`gGJBY5fJha0Let8I`/`fx70vqyJtRdF2DgR`/`Du2CJ3OTohRFZYoA`, plus registry/state/dep-map/pseudo/.md docs) is committed as the same push that carries this handoff — if you're reading this file on `main`, both batches are pushed and live in n8n.
