## Stopping Point
Sprint `tech-debt-2026-05-14` Batch 3 (P2 hygiene part 1) is execution-complete. 3 items done (TD-NEW-013, TD-NEW-014, TD-NEW-015), 2 deferred to VPS infra session (TD-NEW-019, STATUS-TD-05), 1 new item added mid-batch from regression and resolved same session (TD-NEW-026 — WF-50→WF-60 wiring). Live n8n changes applied and verified; sprint-state and working copy updated. NOT pushed to GitHub. Second-pass Batch 3 sibling regression on WF-50/WF-60 was explicitly skipped by user.

## Next Action
Re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/Tech_Debt_2026-05-14.md` — the skill reloads state and finds the next pending work. The next action is **Batch 4 (P2 hygiene part 2)**: TD-NEW-012 (WF-50 hardcoded phone-number-id → env var), TD-NEW-016 (retry/timeout on WF-50/WF-22 enc/WF-43 HTTP nodes), TD-NEW-018 (messages.created_at → timestamptz ALTER), TD-NEW-020 (HMAC verification on WF-00 Meta + WF-10 Slack webhooks).

Before starting Batch 4, optionally run the skipped Batch 3 post-batch regression: dispatch Explore subagent to verify no new sibling hazards from WF-50 workflowInputs change + WF-60 added IF node. Most callers of WF-50 already populate userId/phoneNumber, but worth a 5-minute scan.

## Blockers
**Deferred to a dedicated VPS infra session** (status: `blocked` in sprint-state):
- TD-NEW-019: n8n execution-history pruning env vars. n8n env lives in `/mnt/chinmay-astro-data/.env.production`; container needs recreate.
- STATUS-TD-05: encryption-svc healthcheck + restart policy. Discovered encryption-svc is NOT in `/mnt/chinmay-astro-data/docker-compose.yml` — needs investigation of where it actually runs before scoping.
- (Also still deferred from Batch 1: STATUS-TD-01 VPS hardening, STATUS-TD-02 DB backups, TD-NEW-001 GitHub PAT rotation.)

**Open `needs-decision` for later batches:**
- STATUS-TD-06 (Batch 5): WF-73 Data Cleanup workflow does not exist — build now or defer to Phase 2.

**Followup-only** (logged in `.methodology/sprint-tech-debt-2026-05-14-followups.md`):
- WF-23 missing stop_intent branch (low risk — STOP caught by WF-20 upstream).
- WF-44 missing stop_intent branch (low risk).
- WF-60 disconnected legacy chain — 6 dead nodes (`Inbound - Prepare Log Entry`, `Inbound - Log Message`, `Outbound - Prepare Log Entry`, `Outbound - Log Message`, `Get User ID`, and old `Inbound - Log Message` writing to non-existent `message_log` table). Recommend deletion in future hygiene pass.

**Not pushed to GitHub** — main branch is at `f38dfb1` (end of Batch 2). Batch 3 + TD-NEW-026 changes live in n8n only. Workflow JSONs in `workflows/` are re-exported. To commit: follow the `/tmp/claude-scratch/chinmay-astro` clone flow in CLAUDE.md.

**Plugin improvement candidates** (apply via `flush-plugin-improvements` skill before next sprint if time allows):
1. n8n IF v2 unary operator gotcha: operators `exists`/`notExists`/`empty`/`notEmpty` REQUIRE `singleValue: true` and MUST NOT include `rightValue`. First-attempt failure mode is generic "operations failed atomic rollback" — document this in `build-workflow` skill alongside other partial-update pitfalls.
2. Mid-batch sprint additions: when post-batch sibling regression surfaces a NEW issue significant enough to fix in-sprint (rather than just log as followup), the `build-sprint` skill should formalise the path — currently TD-NEW-026 was added ad-hoc. Add an "in-flight sprint additions" subsection in Step 4.

## Changed Reference Values
- **WF-22** (`dr8QM0m92Ml8MvIh`): now 10 nodes (was 17), 0 disabled. Removed: `Webhook: Form (Meta Flow)`, `Encryption Service (Local Docker Hosted)`, `Format Response`, `Respond to Webhook: Meta Flow Response`, `Sticky Note`, `Log: Webhook Call`, `Update User in DB` (the schema-prefix regression hazard).
- **WF-00** (`JQu1MkK5vgtUCeNO`): now 12 nodes (was 19), 0 disabled, single webhook trigger (`WhatsApp Webhook`). Removed: `Webhook Verification`, `Handle Verification`, `Return Challenge`, `Webhook`, `Code in JavaScript`, `Respond to Webhook`, `Sticky Note1`.
- **WF-60** (`6H75p935FpBVBQtV`): now 11 nodes (was 9). `Log to Messages Table` queryReplacement removed `|| 9` and `|| 2` fallbacks. `Extract Message Data` rewritten to accept flat `userId` + dynamic `direction`. Added new nodes `Has userId?` (IF) and `Skip Log (no userId)` (Code). Active path: `Extract Message Data → Has userId? → (true: Log to Messages Table → Done) / (false: Skip Log → Done)`.
- **WF-50** (`BUVun38WEKb12zg9`): `Call WF-60 Message Logger` node `workflowInputs.value` now defines 8 explicit fields (`userId`, `phoneNumber`, `messageType`, `messageContent`, `messageId`, `direction='outbound'`, `success`, `error`) — previously empty `{}`.
- **TD-NEW-017** retroactively validated obsolete: live WF-22 export confirms node is named `Ensure Slack Channel Exists (WF-52)` — rename did land in n8n.
