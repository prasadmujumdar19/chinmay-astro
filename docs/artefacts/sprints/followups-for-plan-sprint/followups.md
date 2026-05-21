# Sprint `followups-for-plan-sprint` — Post-batch follow-ups

Issues surfaced during sibling regression that were either fixed in-sprint, deferred, or accepted-as-is. Adjacent findings live here with explicit decisions; strict findings get fixed in-sprint and only land here as audit-trail entries.

---

## 2026-05-21 — Post-batch 2 regression

- **WF-41 (Admin → User Relay): canonical-shape lint debt on `WF-50 (Send WhatsApp)` executeWorkflow node** — `parameters.source`, `parameters.operation`, `parameters.mode` were missing at typeVersion 1.2 (would cause silent runtime drops with "No information about the workflow to execute found"). Classification: **strict**. Fixed in-sprint via partial update + re-export bundled into Batch 2 commit. Originated from operator's UI fix mid-session 2026-05-20 (TD-G source — operator patched the dangling node-name reference but the canonical-shape lint debt was pre-existing on this node and only surfaced when the lint hook ran against the freshly exported JSON). Found while verifying touched workflow: TD-G. Backup: archive/backups/6PzJRZsF7k2d9hV7-2026-05-21-21-42.json (pre-Batch-2 state captured during TD-E backup pass; the canonical-shape fix landed on top).

- **assert-md-fresh.sh display label bug (cosmetic)** — script reports `live_updated_at=<stale-timestamp>` in its FRESH-line output that doesn't match the actual frontmatter value in the .md it just checked (EXIT=0 correct, FRESH determination correct, only the displayed timestamp is wrong). Reproduced for WF-40 (post-PUT) and WF-50 (post-PUT). Classification: **adjacent** (cosmetic — does not affect correctness). Logged as PIC-NEW-21A in sprint state for Batch 3 plugin work; pairs naturally with PIC-04 (drift detector) family.
