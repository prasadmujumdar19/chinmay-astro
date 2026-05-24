# Handoff — followups-input-contract-sweep, after Batch 2

## Stopping Point
Sprint paused at Batch 2/6 boundary. 8 of 13 broken WF-50/WF-51 callsites fixed (ICF-005, 007, 010, 013 in Batch 1; ICF-006, 008, 009, 011 in Batch 2). All eight verified live on n8n and lint-clean. Nothing committed yet — user declined commit/push at both batch boundaries.

## Next Action
Re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/artefacts/tests/smoke-post-p0-review-2026-05-17/followups-input-contract-sweep.md`. Sprint-state will resume at Batch 3 (P1, 1 item): **ICF-012 — WF-42 `Notify Admin User Not Found` (false-branch of `User Found?`)**. Same fix pattern as ICF-008 (WF-34 user-not-found): insert a Set node whose `channelId` comes from `$('When Executed by Another Workflow').first().json.channelId` (no user record on this branch) and `messageText` notes the user-not-found CLOSE attempt. After ICF-012, advance to Batch 4 (P2, 3 items: ICF-001/002/003 — WF-50 user-facing breaks on REBOOK and STOP).

## Blockers
- **Uncommitted work** (8 fixes + new helper script): see `state.md → deferred_commits → combined_files_to_commit` for the exact path list. Offer commit/push again at Batch 3 boundary.
- **Plugin improvement to apply via `flush-plugin-improvements` before next sprint:** embed `live_updated_at` + `generated_at` into `WF-XX.md` frontmatter; promote `scripts/assert-md-fresh.sh` into the plugin's `scripts/`; rewrite `build-workflow` Step 5 + plugin `CLAUDE.md` to replace ambiguous "older than the JSON" wording with "run `assert-md-fresh.sh <WF-XX>`; regenerate if stale"; add a `Workflow representation freshness rule` paragraph to project `CLAUDE.md` under Token & Context Efficiency. Full rationale in `state.md → plugin_improvement_candidates_added_this_session`.

## Changed Reference Values
None. (No new IDs, credentials, or URLs this session. New project script: `scripts/assert-md-fresh.sh` — stopgap freshness checker; usage: `scripts/assert-md-fresh.sh WF-XX` → exit 0 fresh / 2 stale.)
