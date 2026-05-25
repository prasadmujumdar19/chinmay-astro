```yaml
slug: data-contract-sprint-bug-fix
input_source: docs/artefacts/sprints/data-contract-sprint-bug-fix/tasks.md
input_hash: 3a3f16876e4b6da8524988443085901d4ead6fdd0eae4c3a69676b3c8c80629a
source_file_update: false
working_copy_path: docs/artefacts/sprints/data-contract-sprint-bug-fix/working.md
planned_at: 2026-05-25T04:08:26Z
last_updated: 2026-05-25T07:52:00Z
planning_complete: true

discover_current_state:
  ran_at: 2026-05-25T04:08:26Z
  result: "all 10 verifiable items STILL NEEDED; 3 items (TD-DCP-106/108/109) not n8n-verifiable (new workflow build, doc-only, test re-verification); zero obsoletes detected"

dependency_conflicts_found: []
priority_adjustments_confirmed: "no conflicts — natural P0→P1→P2 ordering with same-workflow sibling sequencing within batches"

excluded_from_execution:
  reason: "section 'Plugin / skill follow-ups' contains plugin-level improvements (TD-DCP-PLG-001/002/003), not sprint items; section 'Reviewed — No Action' (CC-01, CC-05) is audit trail only"
  items: [TD-DCP-PLG-001, TD-DCP-PLG-002, TD-DCP-PLG-003, CC-01, CC-05]

items:
  # ───────── Batch 1 — P0 Blockers ─────────
  - id: TD-DCP-101
    description: "WF-01 slackChannelId not mapped in Prepare User Data"
    priority: P0
    status: done
    started_at: 2026-05-25T04:16:27Z
    completed_at: 2026-05-25T04:23:13Z
    notes: "patchNodeField via MCP — slackChannelId mapping added in Prepare User Data jsCode between currentConsultationId and totalConsultations. Lint clean (5 advisory pre-existing). Backup: archive/backups/hYGNM97sXvdo1WmI-2026-05-25-14-17.json"
    batch: 1
    change_type: Surgical
    workflows: [WF-01]
    n8n_ids: [hYGNM97sXvdo1WmI]
    depends_on: []

  - id: TD-DCP-111
    description: "WF-10 Load User Status SELECT missing slack_channel_id and current_consultation_id"
    priority: P0
    status: done
    started_at: 2026-05-25T04:25:00Z
    completed_at: 2026-05-25T04:26:50Z
    notes: "patchNodeField via MCP — Load User Status SELECT expanded with slack_channel_id and current_consultation_id. WF-10.pseudo Steps 17 + 23a updated (Phase-2 SELECT-expansion note removed). Lint clean (16 advisory pre-existing). Backup: archive/backups/wMh0oBRtJbvhLgOf-2026-05-25-14-25.json"
    batch: 1
    change_type: Surgical
    workflows: [WF-10]
    n8n_ids: [wMh0oBRtJbvhLgOf]
    depends_on: []

  # ───────── Batch 2 — P1 independents (no WF-26 chain coupling) ─────────
  - id: TD-DCP-102
    description: "WF-60 slackMessageTs enforcement scope — align to design.md plain reading"
    priority: P1
    status: done
    started_at: 2026-05-25T04:55:00Z
    completed_at: 2026-05-25T04:58:47Z
    notes: "Caller-compliance audit PASSED — WF-10 Build WF-60 Payload (Slack Inbound) emits slackMessageTs: input.timestamp || null; WF-51 Build WF-60 Payload (Slack Outbound) emits slackMessageTs: slackResp.ts || ... || null. Both pass real event.ts / chat.postMessage ts in happy path. Pseudo Step 2 + Inputs slack-variant line + design.md §2.6 revised to make slackMessageTs always-required for transport='slack'. Live patch via MCP patchNodeField — top-level slackMessageTs guard inserted between messageType validation and userId branch; nested slackMessageTs check removed (now redundant). Lint clean (9 advisory Step 5g token findings on internal throw new Error strings — developer-facing, not human-channel; not blocking). WF-60.md regenerated. Backup: archive/backups/6H75p935FpBVBQtV-2026-05-25-14-57.json"
    batch: 2
    change_type: Surgical+Documentation
    workflows: [WF-60]
    n8n_ids: [6H75p935FpBVBQtV]
    depends_on: []
    caller_compliance_audit: "verify WF-10 Slack-inbound + WF-51 Slack-outbound pass slackMessageTs today before tightening guard (per item caller-compliance note)"

  - id: TD-DCP-104
    description: "WF-20 Normalize Keyword drops userStatus — WF-47 STOP path orphans consultation row (TD-DRIFT-006)"
    priority: P1
    status: done
    started_at: 2026-05-25T05:00:00Z
    completed_at: 2026-05-25T05:02:13Z
    notes: "Added 5th Set assignment `userStatus = ={{ $json.user.status }}` to Normalize Keyword via MCP updateNode (wholesale parameters object — verified post-PUT: 5 assignments present, userStatus at index 4). WF-20.pseudo Step 2 carry-forward updated; TD-DRIFT-006 deferred-bug ambiguity note removed. WF-20.md regenerated. Lint: 8 advisory findings — all pre-existing Contract-First + Set v3.4 advisory items, not from this change. Closes pre-existing TD-DRIFT-006 (WF-47 STOP path orphan-consultation bug). Backup: archive/backups/LgIDj1v4ZbCPlX25-2026-05-25-15-00.json"
    batch: 2
    change_type: Surgical+Documentation
    workflows: [WF-20]
    n8n_ids: [LgIDj1v4ZbCPlX25]
    depends_on: []

  - id: TD-DCP-112
    description: "WF-33 Extract Command Data writes channelId to payments.verified_by (TD-DRIFT-017)"
    priority: P1
    status: done
    started_at: 2026-05-25T05:03:00Z
    completed_at: 2026-05-25T05:04:14Z
    notes: "One-token jsCode swap via MCP patchNodeField: `adminUserId: input.channelId,` → `adminUserId: input.adminUserId,`. WF-33.pseudo line 29 TD-DRIFT-017 deferred-bug note removed. WF-33.md regenerated. Lint: 2 advisory (Contract-First grandfathered) not from this change. Closes pre-existing TD-DRIFT-017. Backfill of historical rows skipped (pre-live test data). Backup: archive/backups/NcHZedq9ycnAQ9SW-2026-05-25-15-03.json"
    batch: 2
    change_type: Surgical
    workflows: [WF-33]
    n8n_ids: [NcHZedq9ycnAQ9SW]
    depends_on: []

  - id: TD-DCP-113
    description: "WF-47 atomicity — opt-out UPDATE fires before consultation close (TD-DRIFT-007)"
    priority: P1
    status: done
    started_at: 2026-05-25T05:07:00Z
    completed_at: 2026-05-25T05:09:42Z
    notes: "Pseudo Inputs block added (phoneNumber/userId/userStatus); Step 2/3 reordered — IF now sits at head of graph, UPDATE users moves to Step 3. Live: 8 MCP connection ops (4 remove, 4 add) — all applied cleanly; one cosmetic warning on sourceIndex=1 for the FALSE branch (prefer branch='false' syntax, but the op landed correctly). Post-PUT topology verified: When Executed → Was Consultation Active? → (TRUE: Close Open Consultation → Update User Status; FALSE: Update User Status) → Has Slack Channel? → unchanged downstream. No node parameter changes; no node renames. WF-47.md regenerated. Lint: 2 advisory (Contract-First grandfathered Code-upstream) not from this change. Closes pre-existing TD-DRIFT-007 atomicity bug — Step 2 close-consultation now precedes Step 3 user UPDATE, so close failure prevents premature opt-out. Backup: archive/backups/2U7mxHMyqA41ROKX-2026-05-25-15-07.json"
    batch: 2
    change_type: Structural
    workflows: [WF-47]
    n8n_ids: [2U7mxHMyqA41ROKX]
    depends_on:
      - id: TD-DCP-104
        type: soft
        reason: "complementary orphan-row coverage; both close TD-DRIFT-006/007 class — landing in same batch avoids partial coverage gap"

  # ───────── Batch 3 — P1 WF-26 chain (BUG-NEW-02 fix) ─────────
  - id: TD-DCP-105
    description: "WF-01 opted-out branch — load full user row + emit §2.1 envelope (forward-positioning for WF-26)"
    priority: P1
    status: done
    started_at: 2026-05-25T17:10:00Z
    completed_at: 2026-05-25T17:55:00Z
    notes: "MCP partial-update bundle of 8 ops (addNode×2, updateNode×2, removeConnection, addConnection×3). TRUE-branch chain now: Opted Out? → Load User (Opted-Out) [Postgres 2.5 clone of Load User, alwaysOutputData:true] → Prepare User Data (Opted-Out) [Code v2, reads from Load User (Opted-Out), hardcodes pendingUser:null] → Build WF-01 Envelope (Opted-Out) [jsCode rewritten to mirror Build WF-01 Envelope main branch — §2.1 envelope with populated user.{}, wasOptedOut:true, isNewUser:false] → Route Opted-Out to WF-21 (unchanged target; TD-DCP-107 retargets to WF-26). Positions cleaned to horizontal y=1180 row mirroring FALSE branch at y=240. WF-01.pseudo Step 9 split into 9 + 9a/9b/9c. Verified via re-fetch: 26 nodes (+2), connections correct, FALSE branch untouched. Lint: 6 advisory findings, ALL pre-existing (grandfathered Contract-First + advisory jsCode tokens), none introduced by this change. typeVersion floor: no new versions. Backup: archive/backups/hYGNM97sXvdo1WmI-2026-05-25-17-10.json"
    batch: 3
    change_type: Structural
    workflows: [WF-01]
    n8n_ids: [hYGNM97sXvdo1WmI]
    depends_on:
      - id: TD-DCP-101
        type: soft
        reason: "same-workflow sibling (WF-01); 101 lands in earlier P0 batch — 105 picks up clean WF-01 state"

  - id: TD-DCP-106
    description: "WF-26 Re-Engaged Opted-Out User Handler — build new sub-workflow"
    priority: P1
    status: done
    started_at: 2026-05-25T07:30:00Z
    completed_at: 2026-05-25T07:52:00Z
    notes: "Pseudo-first per [[feedback_pseudocode_first_refactor]]: WF-26.pseudo authored + user-approved before live build. Live workflow created via mcp__n8n__n8n_create_workflow (MCP fallback after curl POST denied by deny-list pattern *-X POST*) — 7 nodes, 5 connections. Post-create updateNode applied alwaysOutputData:true on Update User Status (MCP create schema strips this property). Topology: Trigger → Validate Inputs (Code v2, envelope entry guard) → Update User Status (Postgres v2.5, alwaysOutputData:true) → Refresh Envelope Status (Set v3.4, includeOtherFields:false, contract-emit via per-field cross-node refs to Validate Inputs — overrides user.status to 'consultation_closed') → fan-out [Build Welcome Payload (Set v3.4, WF-50 §2.3 contract-emit) → Call WF-50 Welcome Back (executeWorkflow v1.2 canonical)] + [Call WF-02 Re-Route (executeWorkflow v1.2 canonical, passthrough on refreshed envelope)]. typeVersion floor honored: Trigger 1.1, Code 2, Postgres 2.5, Set 3.4, executeWorkflow 1.2 (all match live highest-per-type). Verified via get_workflow (structure mode): nodeCount=7, connectionCount=5, topology matches design. Lint: 3 advisory findings on Validate Inputs jsCode throw strings (Step 5g forbidden-token matches on 'WF-26 contract:' — developer-facing not human-channel; matches TD-DCP-102 WF-60 precedent). Backup: archive/backups/tKjwTYF6EER8ED3y-2026-05-25-17-49.json (filename uses AEDT clock). Export: workflows/tKjwTYF6EER8ED3y.json (7.7KB, 0 secrets hits). Docs: docs/pseudocode/WF-26.pseudo (authored, 7 algorithm steps), docs/pseudocode/WF-26.md (regenerated, fresh per assert-md-fresh.sh). workflow-registry.md WF-26 row added under WF-2x onboarding range. design.md §2.1 envelope consumer list updated — WF-26 added as direct WF-01 callee on opted-out branch; WF-21 listing revised to note its wasOptedOut legacy branch becomes dead code post-TD-DCP-107. Closes BUG-NEW-02 design; activation gated on TD-DCP-107 (WF-01 Route Opted-Out target swap WF-21 → WF-26). Workflow remains inactive in n8n until 107 rewires the call site."
    batch: 3
    change_type: Workflow-Create
    workflows: [WF-26]
    n8n_ids: [tKjwTYF6EER8ED3y]
    design_gate: false
    design_locked_at: 2026-05-25T07:24:00Z
    design_locked_in: docs/artefacts/sprints/data-contract-sprint-bug-fix/handoffs/handoff-td-dcp-105-done-wf26-build-pending.md
    design_decisions:
      Q1_re_entry_status: "consultation_closed (uniform handling; no pre_opt_out_status column)"
      Q2_first_message: "WF-26 → WF-50 welcome → Call WF-02 (re-route through state machine)"
      Q3_welcome_text: "Personalized — 'Welcome back, {name}. Since you'd opted out, your previous session has ended. This is a fresh start. You don't need to send birth details again — we have them on file.'"
      Q4_payment_submitted_edge: "unified wording, no special variant"
      Q5_input_contract: "§2.1 envelope + wasOptedOut:true — one-line addition to existing §2.1 consumer list, no new sub-section"
    build_shape_6_nodes:
      - "Validate Inputs (Code) — envelope shape + user.id != null + wasOptedOut === true"
      - "Update User Status (Postgres) — UPDATE users SET status='consultation_closed' WHERE id=$1 RETURNING ..."
      - "Refresh Envelope Status (Set v3.4) — overwrite user.status='consultation_closed' so WF-02 routes on fresh value"
      - "Build Welcome Payload (Set v3.4, includeOtherFields:false) — WF-50 contract {phoneNumber, messageType:'text', messageContent:<personalized>}"
      - "Call WF-50 (executeWorkflow v1.2) — send welcome WA"
      - "Call WF-02 (executeWorkflow v1.2) — passthrough re-route on refreshed envelope"
    depends_on:
      - id: TD-DCP-105
        type: hard
        reason: "WF-26 reads from §2.1 envelope populated by 105's opted-out branch fix; without 105, WF-26 must re-SELECT (violates §2.1 layered-envelope principle)"

  - id: TD-DCP-107
    description: "WF-01 opted-out branch — rewire call from WF-21 to WF-26"
    priority: P1
    status: done
    started_at: 2026-05-25T07:53:00Z
    completed_at: 2026-05-25T07:55:00Z
    notes: "MCP partial-update 3 ops on WF-01 (n8n hYGNM97sXvdo1WmI) — patchNodeField parameters.workflowId.value zM8WbxSdt9nXRoLZ → tKjwTYF6EER8ED3y; patchNodeField parameters.workflowId.cachedResultUrl /workflow/{old} → /workflow/{new}; updateNode rename 'Route Opted-Out to WF-21' → 'Route Opted-Out to WF-26'. Mapping mode kept passthrough — WF-01 emits §2.1 envelope (opted-out variant) which is exactly WF-26's input contract. Pseudo-first per [[feedback_pseudocode_first_refactor]]: WF-01.pseudo Step 9c + Summary L6-9 revised to reference WF-26 before live edit (removed the forward-reference 'will be retargeted to WF-26 by TD-DCP-107' note since the retarget happened now). Verified via re-fetch: node name 'Route Opted-Out to WF-26', workflowId.value 'tKjwTYF6EER8ED3y', workflowId.cachedResultUrl '/workflow/tKjwTYF6EER8ED3y'. Dangling-name re-scan: 0 hits for old name. Lint: 6 advisory findings all pre-existing (Contract-First grandfathered Code-upstream patterns on Call WF-02 Rule Router + Route Opted-Out to WF-26 + Send Non-Text Deflection via WF-50; Step 5g devops strings on Prepare User Data + Build WF-01 Envelope (Opted-Out); Set v3.4 includeOtherFields ambiguity on Build Admin Anomaly Alert). None introduced by 107. Backup: archive/backups/hYGNM97sXvdo1WmI-2026-05-25-... (auto via pre-workflow-modify hook on MCP partial-update). Export: workflows/hYGNM97sXvdo1WmI.json (0 secrets hits). docs/pseudocode/WF-01.md regenerated, fresh per assert-md-fresh.sh. BUG-NEW-02 end-to-end activation now live: opted_out users re-engaging via WhatsApp route WF-01 → Load User (Opted-Out) → Prepare User Data (Opted-Out) → Build WF-01 Envelope (Opted-Out) → Route Opted-Out to WF-26 → WF-26 → [WF-50 welcome + UPDATE users to consultation_closed + Call WF-02 re-route]. WF-21's wasOptedOut prefix branch becomes dead code (TD-DCP-110 will optionally clean up)."
    batch: 3
    change_type: Surgical
    workflows: [WF-01]
    n8n_ids: [hYGNM97sXvdo1WmI]
    depends_on:
      - id: TD-DCP-105
        type: hard
        reason: "envelope expansion must land first/simultaneously"
      - id: TD-DCP-106
        type: hard
        reason: "WF-26 must exist before rewire activates it"

  - id: TD-DCP-109
    description: "TC-0607 re-verification — opted_out re-engagement now routes through WF-26"
    priority: P1
    status: done
    started_at: 2026-05-25T07:55:30Z
    completed_at: 2026-05-25T07:56:30Z
    notes: "Documentation-only re-classification. TC-0607 in docs/reference/FunctionalTestCases_Tracker.md flipped from ✅ Covered → ⏳ Pending re-verification with full expected-behavior rewrite for the WF-26 routing path. Prior 2026-05-16 exploratory coverage notes preserved as historical context; explicitly marked as validating the OLD WF-21 form-reissuance behavior (now classified BUG-NEW-02). New expected behavior captured inline (route through Route Opted-Out to WF-26 → WF-26 lifts status to consultation_closed → personalized welcome via WF-50 NOT onboarding form → forward-route through WF-02 in same turn → no new pending_users row → existing name/DOB/birth-place preserved). Test user 30 (+61466927921) reserved in opted_out for re-execution per smoke-pre-golive-2026-05-24 wrap. BUG-NEW-02 followup file (docs/artefacts/tests/smoke-pre-golive-2026-05-24/followups-bug-new-02-resolution.md) updated with resolution-pending-verification header pointing back to TD-DCP-105/106/107 implementation. TC-0608 (REBOOK from opted_out user) left ⏳ Pending — natural follow-on test for next smoke session, not in scope here. No live workflow changes; this is the verification gate, not the verification itself."
    batch: 3
    change_type: Documentation+Verification
    workflows: []
    n8n_ids: []
    depends_on:
      - id: TD-DCP-105
        type: hard
        reason: "test verifies envelope shape"
      - id: TD-DCP-106
        type: hard
        reason: "test verifies WF-26 behaviour"
      - id: TD-DCP-107
        type: hard
        reason: "test verifies WF-01 → WF-26 routing"

  # ───────── Batch 4 — P2 Nit-tier ─────────
  - id: TD-DCP-108
    description: "Cross-doc sync — CLAUDE.md state machine + workflow-registry.md + user_journey_map.html for WF-26 rollout"
    priority: P2
    status: pending
    batch: 4
    change_type: Documentation
    workflows: []
    n8n_ids: []
    depends_on:
      - id: TD-DCP-106
        type: hard
        reason: "design Q1 outcome decides re-entry status wording for state machine + journey-map pill"
      - id: TD-DCP-107
        type: hard
        reason: "WF-26 n8n ID assigned at 106 creation, needed for registry row"

  - id: TD-DCP-110
    description: "WF-21 — add Validate Inputs entry guard (consistency hygiene post-WF-26 rewire)"
    priority: P2
    status: pending
    batch: 4
    change_type: Surgical+Documentation
    workflows: [WF-21]
    n8n_ids: [zM8WbxSdt9nXRoLZ]
    depends_on:
      - id: TD-DCP-107
        type: soft
        reason: "best landed AFTER 107 so guard reflects WF-21's narrowed contract (only new-user path)"

  - id: TD-DCP-103
    description: "WF-52 Prepare Channel Name emits userName: key + dead-code legacy fallbacks"
    priority: P2
    status: pending
    batch: 4
    change_type: Surgical
    workflows: [WF-52]
    n8n_ids: [IO5BZLUxuVmjzk5I]
    depends_on: []

batch_summary:
  batch_1:
    priority: P0
    items: 2
    estimated_cost: ~12K
    description: "Live-blocking SELECT/mapping fixes — unblocks smoke testing"
    completed_at: 2026-05-25T04:26:50Z
    commit_status: committed_2026-05-25
  batch_2:
    priority: P1
    items: 4
    estimated_cost: ~30K
    description: "Independent P1 fixes (WF-60/WF-20/WF-33/WF-47 atomicity)"
    completed_at: 2026-05-25T05:09:42Z
    commit_status: committed_2026-05-25
    commit_sha: dba1bff8
  batch_3:
    priority: P1
    items: 4
    estimated_cost: ~50K
    description: "WF-26 build chain — BUG-NEW-02 fix; build-sprint MUST pause at TD-DCP-106 for design session (5 open questions)"
    completed_at: 2026-05-25T07:56:30Z
  batch_4:
    priority: P2
    items: 3
    estimated_cost: ~13K
    description: "Cross-doc sync + WF-21 entry guard + WF-52 hygiene"

parser_warnings: []

plugin_followups_observed:
  - id: TD-DCP-PLG-001
    skill: dispatching-subagents
    description: "Add upstream-mapping audit step to subagent envelope-build briefs"
  - id: TD-DCP-PLG-002
    skill: technical-workflow-review (or functional-code-review)
    description: "Add forward-traceability scan to sibling-regression pattern"
  - id: TD-DCP-PLG-003
    skill: functional-code-review + technical-workflow-review
    description: "Review subagents must diff against pre-sprint snapshot, not historical state"
  note: "These are plugin-skill improvements, excluded from sprint execution; will be flushed via flush-plugin-improvements at sprint close."
```
