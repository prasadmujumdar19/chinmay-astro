## Stopping Point
Sprint `tech-debts` Batch 6 (P2a) is fully complete; Batch 7 (P2b) has not started.

## Next Action
Run `/n8n-whatsapp-methodology:build-sprint @docs/Tech_Debts.md` — it will reload `.methodology/sprint-tech-debts-state.md`, find the first pending item in Batch 7 (TD-019, WF-47 archive Slack on STOP), and continue from there.

Batch 7 items:
- TD-019 (WF-47 add WF-52 archive call after opted_out — UUID `2U7mxHMyqA41ROKX`)
- TD-020 (WF-46 add WF-52 archive call after blocked — UUID `UV62An60fzflU0uD`)
- TD-027 (WF-20 HELP response status-aware — UUID `LgIDj1v4ZbCPlX25`)

## Blockers
**New pattern for plugin:** When adding `executeWorkflow` nodes via `addNode`, the `typeVersion` and parameter structure must match existing same-type nodes in the same workflow — mismatched versions cause `propertyValues[itemName] is not iterable` on activation even if the save succeeds. Always inspect an existing working `executeWorkflow` node in the target workflow first and copy its exact `typeVersion`, `workflowId.__rl` format (`{__rl: true, value, mode: "list", cachedResultUrl, cachedResultName}`), and `workflowInputs` shape. Add to `build-workflow` skill under Step 5 as a "Common addNode pitfalls" note.

**Git repo pattern:** Chinmay Astro has no local `.git` — working dir is Google Drive. To commit: `git clone https://github.com/prasadmujumdar19/chinmay-astro /tmp/claude-scratch/chinmay-astro`, copy changed files, commit, push, then `rm -rf /tmp/claude-scratch/`. Saved to memory (`project_chinmay_astro_git.md`).

**Backup path now fixed:** `backup-workflow.sh` updated in plugin (v1.1.0 cache + GitHub) to write to `archive/backups/` instead of `backups/`. Stop hook will no longer fire on backup files.

**Node version inconsistency (informational, not blocking):** `executeWorkflow` nodes across the project span versions 1–2, `if` nodes span 1–2.2. No normalization needed — n8n is backwards-compatible. One stale `code v1` node: WF-32 `Prepare Reassurance Message` (can be upgraded opportunistically if WF-32 is touched).

## Changed Reference Values
Batch 6 completions:
- WF-22 (dr8QM0m92Ml8MvIh): node renamed "Call WF-52 (Create User Channel)" → "Ensure Slack Channel Exists (WF-52)" (TD-007)
- WF-50 (BUVun38WEKb12zg9): null/empty body guard added in "Prepare Payload" code node — returns [] for blank text messages (TD-033)
- WF-00 (JQu1MkK5vgtUCeNO): whitespace-only message guard added in "Parse WhatsApp Message" — returns {skip:true} for blank text (TD-034)
- All batches 1–6 committed to GitHub: `eb32d14` on `prasadmujumdar19/chinmay-astro` main
