# Handoff — TD-DCP-105 done; WF-26 build pending fresh session

**Date:** 2026-05-25T17:55:00Z
**Sprint:** `data-contract-sprint-bug-fix`
**Batch:** 3 (P1 — WF-26 chain)

## Stopping point

TD-DCP-105 landed live + pseudo + .md + workflow JSON + state.md. Ready to commit/push at handoff write.

## Sprint progress

| Batch | Item | Status |
|---|---|---|
| 3 | TD-DCP-105 | ✅ done |
| 3 | TD-DCP-106 (build WF-26) | ⏳ pending — fresh session recommended |
| 3 | TD-DCP-107 (rewire WF-01 → WF-26) | ⏳ pending (hard-blocked on 106) |
| 3 | TD-DCP-109 (TC-0607 re-verification) | ⏳ pending (hard-blocked on 106 + 107) |
| 4 | TD-DCP-108, 110, 103 | ⏳ pending |

## WF-26 design — locked decisions (no re-litigation)

- **Status target:** `consultation_closed` (no `pre_opt_out_status` column; uniform handling)
- **Message handling:** WF-26 → WF-50 welcome → Call WF-02 (re-route through state machine)
- **Welcome text (locked):** `Welcome back, {name}. Since you'd opted out, your previous session has ended. This is a fresh start. You don't need to send birth details again — we have them on file.`
- **Input contract:** §2.1 envelope unchanged + `wasOptedOut:true` (no new design.md sub-section — add one line to existing §2.1 consumer list)
- **Q4 (payment_submitted edge):** unified wording, no special variant
- **Stale `payments` rows post-rollout:** log as adjacent finding for `followups.md` (out-of-scope for this sprint)

## WF-26 build shape (6 nodes — to be authored next session)

1. `Validate Inputs` (Code) — entry guard: envelope shape, `user.id != null`, `wasOptedOut === true`
2. `Update User Status` (Postgres) — `UPDATE chinmay_astro.users SET status='consultation_closed', updated_at=NOW() WHERE id=$1 RETURNING ...`
3. `Refresh Envelope Status` (Set v3.4 OR Code) — overwrite `user.status='consultation_closed'` in JS object so WF-02 routes on fresh value. Critical gotcha — without this, WF-02 sees stale `opted_out` and mis-routes.
4. `Build Welcome Payload` (Set v3.4) — emit WF-50 contract `{phoneNumber, messageType:'text', messageContent:<personalized text>}`. `includeOtherFields:false` (contract-emit).
5. `Call WF-50` (executeWorkflow v1.2) — send welcome WA
6. `Call WF-02` (executeWorkflow v1.2) — re-route the inbound; passthrough on the refreshed envelope

After 106 lands: TD-DCP-107 rewires `Route Opted-Out to WF-21` (n8n executeWorkflow node in WF-01) to target the new WF-26 ID, and renames the node to `Route Opted-Out to WF-26`. Then TD-DCP-109 updates TC-0607 in `FunctionalTestCases_Tracker.md`.

## WF-26 build sequence (per build-workflow Skill)

1. **Pseudo first** — author `docs/pseudocode/WF-26.pseudo` with structured Inputs block (mirror §2.1 envelope + `wasOptedOut:true`), 6 algorithm steps, Calls Sub-Workflows (WF-50, WF-02). Use the locked design decisions above.
2. **Build live** via `mcp__n8n__n8n_create_workflow` per build-workflow Step 5c (Workflow-Create design gate already satisfied by this handoff).
3. **Backup + verify** post-create.
4. **Export** to `workflows/<new-WF-26-uuid>.json`, regenerate `WF-26.md`.
5. **Update** `docs/workflow-registry.md` with new WF-26 row and the §2.1 consumer-list line in `design.md` L127-129.

## TD-DCP-105 deliverables (this session)

- **Live:** WF-01 nodes 24 → 26. New TRUE-branch chain wired. FALSE branch untouched.
- **Pseudo:** `docs/pseudocode/WF-01.pseudo` Step 9 split into 9 + 9a/9b/9c (linear sub-numbering).
- **.md:** regenerated.
- **workflows/hYGNM97sXvdo1WmI.json:** exported, secrets-clean.
- **Backup:** `archive/backups/hYGNM97sXvdo1WmI-2026-05-25-17-10.json`.

## Adjacent finding logged

`payments` rows under stale `payment_submitted` status post-WF-26 rollout — admin APPROVE/REJECT on those rows would mis-fire (WF-33/34 state guards expect user in payment_submitted but they're now in consultation_closed). Volume near-zero pre-MVP; defer with follow-up sprint note. Not in scope for this sprint.

## Open question for fresh session

`Refresh Envelope Status` node — Set v3.4 (with `includeOtherFields:true` per [[feedback_set_v34_default]]) or a Code node? Set is more declarative; Code gives more control. Either works.
