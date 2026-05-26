# Handoff — TD-PGF-01B cutover pending

**Written at:** 2026-05-26T23:46:56Z

## Stopping Point

TD-PGF-01B (Batch 2, P0) is in-progress: Steps 1-3 are complete (Postgres `email_address` column added, WF-22 `Create User Record` INSERT extended with $6 parameter, Flow v2 JSON saved as DRAFT in Meta Flow Builder after 3 validator iterations). Stopped before Step 4 (cutover) which needs the user to publish Flow v2 in Meta and share the new published Flow ID.

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/tasks.md`. Resume point is TD-PGF-01B Step 4 — full progress block + remaining-steps detail is in `docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/state.md` under the TD-PGF-01B section.

## Blockers

- **User action required before Step 4:** publish Flow v2 in Meta Flow Builder UI, obtain the new published Flow ID, and share it with the next session. Current Flow v1 ID is `1408011897720771`; v2 will have a different ID once published.
- **Plugin improvement opportunity:** four Meta Flow JSON authoring constraints captured in `followups.md` (input-type whitelist `[text, password, passcode, number]` only; `\.` regex escape rejected — use `[.]`; `*` quantifier appears non-backtracking — structure required-prefix + optional-suffix; `helper-text` hard 80-char limit). These are project-agnostic and should be flushed to the methodology plugin (likely as additions to `build-workflow` or a new `meta-flow-authoring` skill). Apply via `flush-plugin-improvements` skill in a future session before the next project uses WhatsApp Flow Builder authoring.

## Changed Reference Values

- New directory: `workflows/flows/` (created this session for WhatsApp Flow JSON storage — committed to GitHub)
- New file: `workflows/flows/collect-personal-details-v1.json` (3,381 bytes — v1 baseline / revert path)
- New file: `workflows/flows/collect-personal-details-v2.json` (4,318 bytes — v2 with full_name + time + place + email validation)
- New DB column: `chinmay_astro.users.email_address text NULL` (added 2026-05-26 via docker-exec ALTER)
- WF-22 (`dr8QM0m92Ml8MvIh`): `Create User Record` Postgres node SQL extended with `email_address` ($6 parameter); queryReplacement JS-array extended with `$json.email_address`
- WF-22.pseudo: Step 2 + Step 3 updated to reflect `email_address` in form-parse + INSERT
- Flow v2 published ID: **TBD** (user to obtain from Meta Flow Builder after publishing)
- Flow v1 ID `1408011897720771` remains active production until cutover completes
