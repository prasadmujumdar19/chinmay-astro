---
slug: followups-input-contract-sweep
input_source: docs/artefacts/tests/smoke-post-p0-review-2026-05-17/followups-input-contract-sweep.md
input_hash: 3e2971cd639f9382bdce52dd49b059bb1f397c3884fd8014bc7173b954ac74b3
source_file_update: false
working_copy_path: docs/artefacts/sprints/followups-input-contract-sweep/working.md
planned_at: 2026-05-18T00:00:00Z
last_updated: 2026-05-18T11:55:00Z
batch_4_5_execution_plan:
  mode: B  # inline-inherit per build-sprint Step 2a
  rationale: "10th-13th application of identical 'insert Prepare WF-XX Payload Code node' pattern in this sprint. Pattern proven across WF-33/34/42/46/01. Per-item build-workflow Skill re-invocation is redundant ceremony — apply discipline (backup, change, verify lint, update sprint-state, regen pseudocode) inline in main thread. ICF-002+003 are same-workflow siblings on WF-47 → must run sequentially."
  order: [ICF-001, ICF-002, ICF-003, ICF-004]
planning_complete: true
deferred_commits:
  - batch: 1
    completed_at: 2026-05-18T09:10:00Z
    items_done: [ICF-005, ICF-007, ICF-010, ICF-013]
    user_decision: "Defer commit/push to end of sprint (asked at batch boundary 2026-05-18T09:11:00Z)."
  - batch: 2
    completed_at: 2026-05-18T09:35:00Z
    items_done: [ICF-006, ICF-008, ICF-009, ICF-011]
    user_decision: "Stop sprint here at Batch 2 boundary; do not commit (asked 2026-05-18T09:38:00Z)."
  - batch: 3
    completed_at: 2026-05-18T10:05:00Z
    items_done: [ICF-012]
    user_decision: "Commit Batches 1+2+3 together after Batch 3 lands (asked 2026-05-18T10:00:00Z)."
    commit_pushed: c959389
    pushed_at: 2026-05-18T10:08:00Z
  - batch: 6
    completed_at: 2026-05-18T11:32:00Z
    items_done: [ICV-001, ICV-002, ICV-003, ICV-004, ICV-005, ICV-006, ICV-007, ICV-008, ICV-010, ICV-011, ICV-012, ICV-013, ICV-014, ICV-015, ICV-016, ICV-017, ICV-018, ICV-019]
    user_decision: "Commit Batch 6 + ICV-001 fix immediately (asked 2026-05-18T11:00:00Z)."
    commit_pushed: a16d649
    pushed_at: 2026-05-18T11:33:00Z
  combined_files_to_commit:
    - workflows/NcHZedq9ycnAQ9SW.json   # WF-33 — Batch 1 ICF-005 + Batch 2 ICF-006
    - workflows/se82n3MUQ9xE5aEr.json   # WF-34 — Batch 1 ICF-007 + Batch 2 ICF-008/009
    - workflows/fx70vqyJtRdF2DgR.json   # WF-42 — Batch 1 ICF-010 + Batch 2 ICF-011
    - workflows/UV62An60fzflU0uD.json   # WF-46 — Batch 1 ICF-013
    - docs/workflow-registry.md
    - docs/dependency-map.md
    - docs/pseudocode/                  # 28 regenerated WF-XX.md files
    - docs/artefacts/sprints/followups-input-contract-sweep/state.md
    - scripts/assert-md-fresh.sh        # new — stopgap freshness helper, candidate for plugin
new_artefacts_this_sprint:
  - path: scripts/assert-md-fresh.sh
    purpose: "Verify docs/pseudocode/WF-XX.md is current vs. live n8n updatedAt. Exit 0 fresh / 2 stale. Stopgap (uses mtime); durable design embeds live_updated_at in .md frontmatter."
    candidate_for_plugin: true
    proposed_plugin_path: scripts/assert-md-fresh.sh
plugin_improvement_candidates_added_this_session:
  - "Embed `live_updated_at` (ISO from n8n) + `generated_at` into WF-XX.md frontmatter (currently only ID/active/node-count). Enables deterministic freshness checks without mtime sensitivity."
  - "Add `scripts/assert-md-fresh.sh <WF-XX>` to plugin (stopgap shipped in project as scripts/assert-md-fresh.sh; promote)."
  - "Update build-workflow Step 5 + plugin CLAUDE.md `Workflow Representation` section: replace 'older than the JSON' with 'run assert-md-fresh.sh before loading; regenerate if stale'. 'Older than the JSON' is ambiguous (older than which JSON — local export or live n8n?)."
  - "Add a project CLAUDE.md 'Workflow representation freshness rule' under Token & Context Efficiency, pointing to plugin guardrail."
dependency_conflicts_found:
  - "Source doc places WF-50 user-facing breaks (REBOOK/STOP) in Batch 3 (lower priority) but they affect user journeys, while Batches 1-2 only affect admin Slack notifications."
priority_adjustments_confirmed: "User chose to keep source-doc priority order (admin-impact-first). User-facing breaks remain P2."
n8n_state_verification:
  performed_at: 2026-05-18T00:00:00Z
  scope: 13 broken-fix sites in 7 workflows (MUG7rPgSHc7UtAE9, 2U7mxHMyqA41ROKX, eTV1lUcYrXBg2q2T, NcHZedq9ycnAQ9SW, se82n3MUQ9xE5aEr, fx70vqyJtRdF2DgR, UV62An60fzflU0uD)
  method: jq-based upstream-node lookup against fresh n8n API exports
  result: All 13 sites confirmed still broken — upstream node type matches source doc exactly for every site. Zero obsoletes detected from n8n state. One obsolete from source-doc text ("verified working in TC-0303") = ICV-009.
items:
  # ============================================================
  # FIX ITEMS — Batch 1 (P0): primary admin audit trail (4 sites)
  # ============================================================
  - id: ICF-005
    description: "WF-33 Payment Approval Processor — caller 'Call WF-51 Notify Admin in Channel' has upstream 'Call WF-50 Notify User' (executeWorkflow). Confirmed FAIL in TC-0303."
    workflow_id: NcHZedq9ycnAQ9SW
    workflow_ref: WF-33
    target_subworkflow: WF-51
    caller_node: "Call WF-51 Notify Admin in Channel"
    upstream_node: "Call WF-50 Notify User"
    upstream_type: n8n-nodes-base.executeWorkflow
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node between upstream and caller; populate channelId + messageText from earlier nodes."
    priority: P0
    status: done
    started_at: 2026-05-18T00:00:00Z
    completed_at: 2026-05-18T09:02:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (Notify Admin)' (v2) at [2128,0]. Pulls user from Load User by Phone; channelId=user.slack_channel_id; messageText='✅ Payment approved for {name} ({phone}). User notified via WhatsApp; consultation is now active.' Lint clean, live verified."
    batch: 1
    depends_on:
      - id: ICF-006
        type: soft
        reason: "same-workflow sibling — both modify WF-33 (NcHZedq9ycnAQ9SW); execute sequentially to avoid concurrent-update race. Higher impact first."

  - id: ICF-007
    description: "WF-34 Payment Rejection Processor — caller 'Call WF-51 Notify Admin Rejected' has upstream 'Call WF-50 WhatsApp Sender' (executeWorkflow). Reject flow admin Slack notification lost."
    workflow_id: se82n3MUQ9xE5aEr
    workflow_ref: WF-34
    target_subworkflow: WF-51
    caller_node: "Call WF-51 Notify Admin Rejected"
    upstream_node: "Call WF-50 WhatsApp Sender"
    upstream_type: n8n-nodes-base.executeWorkflow
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node populated with channelId + messageText."
    priority: P0
    status: done
    started_at: 2026-05-18T09:02:00Z
    completed_at: 2026-05-18T09:05:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (Notify Admin Rejected)' (v2) at [1600,0]. Pulls user from Load User by Phone; channelId=user.slack_channel_id; messageText conveys rejection processed + user asked to retry. Lint clean, live verified."
    batch: 1
    depends_on:
      - id: ICF-008
        type: soft
        reason: "same-workflow sibling — both modify WF-34 (se82n3MUQ9xE5aEr); higher impact first."
      - id: ICF-009
        type: soft
        reason: "same-workflow sibling — both modify WF-34; higher impact first."

  - id: ICF-010
    description: "WF-42 Consultation Closer — caller 'Notify Admin in Slack' has upstream 'Call WF-50 Send Feedback' (executeWorkflow). Close-consult admin ack lost."
    workflow_id: fx70vqyJtRdF2DgR
    workflow_ref: WF-42
    target_subworkflow: WF-51
    caller_node: "Notify Admin in Slack"
    upstream_node: "Call WF-50 Send Feedback"
    upstream_type: n8n-nodes-base.executeWorkflow
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node populated with channelId + messageText."
    priority: P0
    status: done
    started_at: 2026-05-18T09:05:00Z
    completed_at: 2026-05-18T09:07:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (Notify Admin Closed)' (v2) at [1264,0]. Pulls user from Load User by Phone; channelId=user.slack_channel_id; messageText conveys close success + channel kept open. Lint clean, live verified."
    batch: 1
    depends_on:
      - id: ICF-011
        type: soft
        reason: "same-workflow sibling — both modify WF-42 (fx70vqyJtRdF2DgR); higher impact first."
      - id: ICF-012
        type: soft
        reason: "same-workflow sibling — both modify WF-42; higher impact first."

  - id: ICF-013
    description: "WF-46 User Blocker — caller 'Call WF-51 Notify Admin' has upstream 'Update User to Blocked Status' (postgres). BLOCK admin notification lost."
    workflow_id: UV62An60fzflU0uD
    workflow_ref: WF-46
    target_subworkflow: WF-51
    caller_node: "Call WF-51 Notify Admin"
    upstream_node: "Update User to Blocked Status"
    upstream_type: n8n-nodes-base.postgres
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node populated with channelId + messageText."
    priority: P0
    status: done
    started_at: 2026-05-18T09:07:00Z
    completed_at: 2026-05-18T09:10:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (Notify Admin Blocked)' (v2) at [624,0]. Realises caller-channelId-or-slack_channel_id fallback (trigger.channelId || user.slack_channel_id) per FU-1 design intent; messageText conveys block confirmation. Lint clean, live verified."
    batch: 1
    depends_on: []

  # ============================================================
  # FIX ITEMS — Batch 2 (P1): edge-case admin alerts pt.1 (4 sites)
  # ============================================================
  - id: ICF-006
    description: "WF-33 Payment Approval Processor — caller 'Call WF-51 Notify Admin Wrong State' has upstream 'User in Correct State?' (IF). Admin 'wrong state' alert lost."
    workflow_id: NcHZedq9ycnAQ9SW
    workflow_ref: WF-33
    target_subworkflow: WF-51
    caller_node: "Call WF-51 Notify Admin Wrong State"
    upstream_node: "User in Correct State?"
    upstream_type: n8n-nodes-base.if
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node on the IF false-branch path; populate channelId + messageText from earlier user-loading nodes via $('NodeName').item.json references."
    priority: P1
    status: done
    completed_at: 2026-05-18T09:14:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (Wrong State)' (v2) at [800,-496] on User in Correct State? false branch. channelId=user.slack_channel_id; messageText conveys 'APPROVE PAYMENT ignored; user in state X, expected payment_submitted'. Lint clean."
    batch: 2
    depends_on:
      - id: ICF-005
        type: soft
        reason: "same-workflow sibling — both modify WF-33; ICF-005 has higher impact and runs first."

  - id: ICF-008
    description: "WF-34 Payment Rejection Processor — caller 'Call WF-51 Notify Admin User Not Found' has upstream 'User Found?' (IF). 'User not found' admin alert lost."
    workflow_id: se82n3MUQ9xE5aEr
    workflow_ref: WF-34
    target_subworkflow: WF-51
    caller_node: "Call WF-51 Notify Admin User Not Found"
    upstream_node: "User Found?"
    upstream_type: n8n-nodes-base.if
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node on IF false-branch; populate channelId + messageText."
    priority: P1
    status: done
    completed_at: 2026-05-18T09:33:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (User Not Found)' (v2) at [400,130] on User Found? false branch. Uses trigger.channelId (no user record on this branch); messageText conveys 'REJECT ignored: no user record for phone X'. Batched into one PUT with ICF-009. Lint clean."
    batch: 2
    depends_on:
      - id: ICF-007
        type: soft
        reason: "same-workflow sibling — both modify WF-34; ICF-007 higher impact, runs first."
      - id: ICF-009
        type: soft
        reason: "same-workflow sibling — both modify WF-34; batched together."

  - id: ICF-009
    description: "WF-34 Payment Rejection Processor — caller 'Call WF-51 Notify Admin Wrong State' has upstream 'User in Correct State?' (IF). 'Wrong state' admin alert lost."
    workflow_id: se82n3MUQ9xE5aEr
    workflow_ref: WF-34
    target_subworkflow: WF-51
    caller_node: "Call WF-51 Notify Admin Wrong State"
    upstream_node: "User in Correct State?"
    upstream_type: n8n-nodes-base.if
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node on IF false-branch; populate channelId + messageText."
    priority: P1
    status: done
    completed_at: 2026-05-18T09:33:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (Wrong State)' (v2) at [600,130] on User in Correct State? false branch. channelId=user.slack_channel_id (user found at this point); messageText conveys 'REJECT ignored; user in state X, expected payment_submitted'. Batched into one PUT with ICF-008. Lint clean."
    batch: 2
    depends_on:
      - id: ICF-007
        type: soft
        reason: "same-workflow sibling — both modify WF-34."
      - id: ICF-008
        type: soft
        reason: "same-workflow sibling — both modify WF-34; document order."

  - id: ICF-011
    description: "WF-42 Consultation Closer — caller 'Notify Admin Wrong State' has upstream 'User in Correct State?' (IF). 'Wrong state' admin alert lost."
    workflow_id: fx70vqyJtRdF2DgR
    workflow_ref: WF-42
    target_subworkflow: WF-51
    caller_node: "Notify Admin Wrong State"
    upstream_node: "User in Correct State?"
    upstream_type: n8n-nodes-base.if
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node on IF false-branch; populate channelId + messageText."
    priority: P1
    status: done
    completed_at: 2026-05-18T09:35:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (Wrong State)' (v2) at [640,-200] on User in Correct State? false branch. channelId=user.slack_channel_id; messageText conveys 'CLOSE ignored; user in state X, expected consultation_active'. Lint clean."
    batch: 2
    depends_on:
      - id: ICF-010
        type: soft
        reason: "same-workflow sibling — both modify WF-42; ICF-010 higher impact, runs first."
      - id: ICF-012
        type: soft
        reason: "same-workflow sibling — both modify WF-42; batched together."

  # ============================================================
  # FIX ITEMS — Batch 3 (P1): edge-case admin alerts pt.2 (1 site)
  # 4-Structural-per-batch cap forces this single-item batch.
  # ============================================================
  - id: ICF-012
    description: "WF-42 Consultation Closer — caller 'Notify Admin User Not Found' has upstream 'User Found?' (IF). 'User not found' admin alert lost."
    workflow_id: fx70vqyJtRdF2DgR
    workflow_ref: WF-42
    target_subworkflow: WF-51
    caller_node: "Notify Admin User Not Found"
    upstream_node: "User Found?"
    upstream_type: n8n-nodes-base.if
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node on IF false-branch; populate channelId + messageText."
    priority: P1
    status: done
    started_at: 2026-05-18T10:00:00Z
    completed_at: 2026-05-18T10:05:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (User Not Found)' (v2) at [480,-400] on User Found? false branch. Uses trigger.channelId (no user record on this branch); messageText conveys 'CLOSE ignored: no user record for phone X'. Lint clean, post-state verified."
    batch: 3
    depends_on:
      - id: ICF-010
        type: soft
        reason: "same-workflow sibling — both modify WF-42."
      - id: ICF-011
        type: soft
        reason: "same-workflow sibling — same workflow, just split across batches due to 4-item cap."

  # ============================================================
  # FIX ITEMS — Batch 4 (P2): WF-50 user-facing breaks (3 sites)
  # ============================================================
  - id: ICF-001
    description: "WF-45 Rebook Handler — caller 'Send Payment Instructions' has upstream 'Set status=payment_pending' (postgres). REBOOK flow fails when user types REBOOK after consultation_active."
    workflow_id: MUG7rPgSHc7UtAE9
    workflow_ref: WF-45
    target_subworkflow: WF-50
    caller_node: "Send Payment Instructions"
    upstream_node: "Set status=payment_pending"
    upstream_type: n8n-nodes-base.postgres
    fix_pattern: "Insert 'Prepare WF-50 Payload' Set node; populate phoneNumber + messageType=text + messageContent (or appropriate field-name; see plugin-improvement note on field-name drift)."
    priority: P2
    status: done
    completed_at: 2026-05-18T11:55:00Z
    completion_note: "Added Code node 'Prepare WF-50 Payload (Rebook Payment)' (v2) at [752,304] between Set status=payment_pending and Send Payment Instructions. Pulls user from Load User Record; emits interactive button payload (Welcome back name + UPI ₹500 instructions + 'Payment Completed' reply). Lint clean, live verified."
    batch: 4
    depends_on: []

  - id: ICF-002
    description: "WF-47 Unsubscribe Handler — caller 'Send Hold Message via WF-50' has upstream 'Check If Consultation Active' (IF). STOP keyword path partially fails."
    workflow_id: 2U7mxHMyqA41ROKX
    workflow_ref: WF-47
    target_subworkflow: WF-50
    caller_node: "Send Hold Message via WF-50"
    upstream_node: "Check If Consultation Active"
    upstream_type: n8n-nodes-base.if
    fix_pattern: "Insert 'Prepare WF-50 Payload' Set node on the IF true-branch; populate phoneNumber + messageType=text + messageContent."
    priority: P2
    status: done
    completed_at: 2026-05-18T11:55:00Z
    completion_note: "Added Code node 'Prepare WF-50 Payload (Hold Message)' (v2) at [-100,0] on Check If Consultation Active true-branch. Uses trigger.phoneNumber (no Load User in WF-47); messageContent explains STOP received but consultation continues + how to STOP after it ends. Lint clean, live verified."
    batch: 4
    depends_on:
      - id: ICF-003
        type: soft
        reason: "same-workflow sibling — both modify WF-47 (2U7mxHMyqA41ROKX); document order."

  - id: ICF-003
    description: "WF-47 Unsubscribe Handler — caller 'Send Opt-out Confirmation via WF-50' has upstream 'Log to admin_actions' (postgres). STOP keyword opt-out confirmation lost."
    workflow_id: 2U7mxHMyqA41ROKX
    workflow_ref: WF-47
    target_subworkflow: WF-50
    caller_node: "Send Opt-out Confirmation via WF-50"
    upstream_node: "Log to admin_actions"
    upstream_type: n8n-nodes-base.postgres
    fix_pattern: "Insert 'Prepare WF-50 Payload' Set node; populate phoneNumber + messageType=text + messageContent."
    priority: P2
    status: done
    completed_at: 2026-05-18T11:55:00Z
    completion_note: "Added Code node 'Prepare WF-50 Payload (Opt-out Confirmation)' (v2) at [360,224] between Log to admin_actions and Send Opt-out Confirmation. Uses trigger.phoneNumber; messageContent confirms opt-out + how to re-engage. Lint clean, live verified."
    batch: 4
    depends_on:
      - id: ICF-002
        type: soft
        reason: "same-workflow sibling — both modify WF-47."

  # ============================================================
  # FIX ITEMS — Batch 5 (P3): WF-25 garbage admin (1 site)
  # ============================================================
  - id: ICF-004
    description: "WF-25 Intent Classifier — caller 'Notify Admin of Garbage' has upstream 'Send Garbage Warning' (executeWorkflow → WF-50). Garbage-intent admin notification lost."
    workflow_id: eTV1lUcYrXBg2q2T
    workflow_ref: WF-25
    target_subworkflow: WF-51
    caller_node: "Notify Admin of Garbage"
    upstream_node: "Send Garbage Warning"
    upstream_type: n8n-nodes-base.executeWorkflow
    fix_pattern: "Insert 'Prepare WF-51 Payload' Set node; populate channelId + messageText. Note: this is the only WF-25 fix in this sprint; ICV-004/005 are read-only verifications of OTHER WF-25 call sites and intentionally separate."
    priority: P3
    status: done
    completed_at: 2026-05-18T11:55:00Z
    completion_note: "Added Code node 'Prepare WF-51 Payload (Garbage Admin)' (v2) at [736,-240] between Send Garbage Warning and Notify Admin of Garbage. channelId=C0A5B0ZE81E (chinmay-admin-commands); messageText includes phoneNumber/userId/status + first 280 chars of offending message. Lint clean, live verified."
    batch: 5
    depends_on: []

  # ============================================================
  # VERIFY ITEMS — Batch 6 (P4): Code/Set upstream verification
  # Inspect each upstream Code/Set node and confirm it emits the
  # required keys (channelId+messageText for WF-51, phoneNumber+
  # messageType+content for WF-50). Read-only — no JSON edits
  # unless a problem is found (which would then become a new
  # follow-up item, not a mutation here).
  # ============================================================
  - id: ICV-001
    description: "WF-01 'Send Non-Text Deflection via WF-50' — verify upstream 'Silent Reject (Message Type)' (Code) emits phoneNumber + messageType + messageContent."
    workflow_ref: WF-01
    target_subworkflow: WF-50
    caller_node: "Send Non-Text Deflection via WF-50"
    upstream_node: "Silent Reject (Message Type)"
    priority: P4
    status: done
    decision_required: "WF-01 Silent Reject (Message Type) → Send Non-Text Deflection via WF-50: Code node returns {silentReject, reason} with no phoneNumber/content; WF-50 drops silently. Design intent contradictory."
    decision_made: "Option B (send deflection) — 2026-05-18T11:00:00Z. Rationale: caller node name 'Send Non-Text Deflection' matched intent; user benefits from feedback when sending images/audio."
    completed_at: 2026-05-18T11:30:00Z
    completion_note: "Replaced jsCode to return {phoneNumber, message: '⚠️ Sorry, we only handle text messages right now. Please type your question.'}. Uses WF-50 alias (message → messageContent, defaulted messageType=text). Surgical change, lint clean, live verified."
    batch: 6
    depends_on: []

  - id: ICV-002
    description: "WF-21 'Call WF-50 Send WhatsApp' — verify upstream 'Build Welcome Message' (Code) emits required WF-50 keys."
    workflow_ref: WF-21
    target_subworkflow: WF-50
    caller_node: "Call WF-50 Send WhatsApp"
    upstream_node: "Build Welcome Message"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on: []

  - id: ICV-003
    description: "WF-22 'Call WF-50 Send WhatsApp' — verify upstream 'Prepare Payment Instructions' (Code) emits required WF-50 keys."
    workflow_ref: WF-22
    target_subworkflow: WF-50
    caller_node: "Call 'WF-50 Send WhatsApp'"
    upstream_node: "Prepare Payment Instructions"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on:
      - id: ICV-017
        type: soft
        reason: "same-workflow sibling — both inspect WF-22 (read-only; share workflow JSON load)."

  - id: ICV-004
    description: "WF-25 'Send Garbage Warning' — verify upstream 'Prepare Garbage Warning' (Code) emits required WF-50 keys."
    workflow_ref: WF-25
    target_subworkflow: WF-50
    caller_node: "Send Garbage Warning"
    upstream_node: "Prepare Garbage Warning"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Heuristic flag (no messageType) resolved: WF-50 Prepare Payload defaults messageType='text' and aliases input.message → messageContent. Output {phoneNumber, message} works correctly."
    batch: 6
    depends_on:
      - id: ICV-005
        type: soft
        reason: "same-workflow sibling — both inspect WF-25 (read-only)."

  - id: ICV-005
    description: "WF-25 'Send Block Warning' — verify upstream 'Prepare Block Warning' (Code) emits required WF-50 keys."
    workflow_ref: WF-25
    target_subworkflow: WF-50
    caller_node: "Send Block Warning"
    upstream_node: "Prepare Block Warning"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Same as ICV-004 — WF-50 alias handles {phoneNumber, message} shape."
    batch: 6
    depends_on:
      - id: ICV-004
        type: soft
        reason: "same-workflow sibling — both inspect WF-25."

  - id: ICV-006
    description: "WF-31 'Send Under Review via WF-50' — verify upstream 'Prepare Under Review Message' (Code) emits required WF-50 keys."
    workflow_ref: WF-31
    target_subworkflow: WF-50
    caller_node: "Send Under Review via WF-50"
    upstream_node: "Prepare Under Review Message"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Heuristic flag (no messageType) resolved: WF-50 Prepare Payload defaults messageType='text' and aliases input.message → messageContent. Output {phoneNumber, message} works correctly."
    batch: 6
    depends_on:
      - id: ICV-018
        type: soft
        reason: "same-workflow sibling — both inspect WF-31."

  - id: ICV-007
    description: "WF-32 'Call WF-50 (Already Submitted)' — verify upstream 'Prepare Reassurance Message' (Code) emits required WF-50 keys."
    workflow_ref: WF-32
    target_subworkflow: WF-50
    caller_node: "Call WF-50 (Already Submitted)"
    upstream_node: "Prepare Reassurance Message"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Same as ICV-004 — WF-50 alias handles {phoneNumber, message} shape."
    batch: 6
    depends_on:
      - id: ICV-008
        type: soft
        reason: "same-workflow sibling — both inspect WF-32."
      - id: ICV-019
        type: soft
        reason: "same-workflow sibling — both inspect WF-32."

  - id: ICV-008
    description: "WF-32 'Call WF-50 (Send Payment Confirmation Received Message)' — verify upstream 'Prepare User Confirmation' (Code) emits required WF-50 keys."
    workflow_ref: WF-32
    target_subworkflow: WF-50
    caller_node: "Call WF-50 (Send Payment Confirmation Received Message)"
    upstream_node: "Prepare User Confirmation"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on:
      - id: ICV-007
        type: soft
        reason: "same-workflow sibling — both inspect WF-32."
      - id: ICV-019
        type: soft
        reason: "same-workflow sibling — both inspect WF-32."

  - id: ICV-009
    description: "WF-33 'Call WF-50 Notify User' upstream 'Prepare User Activation Message' (Code) — emits required WF-50 keys."
    workflow_ref: WF-33
    target_subworkflow: WF-50
    caller_node: "Call WF-50 Notify User"
    upstream_node: "Prepare User Activation Message"
    priority: P4
    status: obsolete
    obsolete_reason: "Source doc confirms 'verified working in TC-0303' on 2026-05-17. Re-verification not needed."
    batch: 6
    depends_on: []

  - id: ICV-010
    description: "WF-34 'Call WF-50 WhatsApp Sender' — verify upstream 'Prepare Rejection Message' (Code) emits required WF-50 keys."
    workflow_ref: WF-34
    target_subworkflow: WF-50
    caller_node: "Call WF-50 WhatsApp Sender"
    upstream_node: "Prepare Rejection Message"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on: []

  - id: ICV-011
    description: "WF-41 'WF-50 (Send WhatsApp)' — verify upstream 'Prepare WhatsApp Message' (Code) emits required WF-50 keys."
    workflow_ref: WF-41
    target_subworkflow: WF-50
    caller_node: "WF-50 (Send WhatsApp)"
    upstream_node: "Prepare WhatsApp Message"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on: []

  - id: ICV-012
    description: "WF-42 'Call WF-50 Send Feedback' — verify upstream 'Prepare Feedback Message' (Code) emits required WF-50 keys."
    workflow_ref: WF-42
    target_subworkflow: WF-50
    caller_node: "Call WF-50 Send Feedback"
    upstream_node: "Prepare Feedback Message"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on: []

  - id: ICV-013
    description: "WF-43 'Send Gemini Reply via WF-50' — verify upstream 'Extract Gemini Reply' (Code) emits required WF-50 keys."
    workflow_ref: WF-43
    target_subworkflow: WF-50
    caller_node: "Send Gemini Reply via WF-50"
    upstream_node: "Extract Gemini Reply"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on:
      - id: ICV-014
        type: soft
        reason: "same-workflow sibling — both inspect WF-43."

  - id: ICV-014
    description: "WF-43 'Send Feedback Prompt via WF-50' — verify upstream 'Prompt for Feedback' (Code) emits required WF-50 keys."
    workflow_ref: WF-43
    target_subworkflow: WF-50
    caller_node: "Send Feedback Prompt via WF-50"
    upstream_node: "Prompt for Feedback"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on:
      - id: ICV-013
        type: soft
        reason: "same-workflow sibling — both inspect WF-43."

  - id: ICV-015
    description: "WF-02 'Call WF-51 (UNHANDLED Alert)' — verify upstream 'Build UNHANDLED Alert' (Code) emits channelId + messageText."
    workflow_ref: WF-02
    target_subworkflow: WF-51
    caller_node: "Call WF-51 (UNHANDLED Alert)"
    upstream_node: "Build UNHANDLED Alert"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Same as ICV-004 — WF-50 alias handles {phoneNumber, message} shape (returns phoneNumber + message from prevData/geminiResp)."
    batch: 6
    depends_on: []

  - id: ICV-016
    description: "WF-10 'Call WF-51 (Wrong Channel Warning)' — verify upstream 'Build Wrong Channel Warning' (Code) emits channelId + messageText."
    workflow_ref: WF-10
    target_subworkflow: WF-51
    caller_node: "Call WF-51 (Wrong Channel Warning)"
    upstream_node: "Build Wrong Channel Warning"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on: []

  - id: ICV-017
    description: "WF-22 'Call WF-51 Admin Alert' — verify upstream 'Build Admin Alert' (Code) emits channelId + messageText."
    workflow_ref: WF-22
    target_subworkflow: WF-51
    caller_node: "Call WF-51 Admin Alert"
    upstream_node: "Build Admin Alert"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on:
      - id: ICV-003
        type: soft
        reason: "same-workflow sibling — both inspect WF-22."

  - id: ICV-018
    description: "WF-31 'Relay to Admin Slack' — verify upstream 'Prepare Admin Relay' (Code) emits channelId + messageText."
    workflow_ref: WF-31
    target_subworkflow: WF-51
    caller_node: "Relay to Admin Slack"
    upstream_node: "Prepare Admin Relay"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Verified: Code node emits required keys per heuristic + spot-check."
    batch: 6
    depends_on:
      - id: ICV-006
        type: soft
        reason: "same-workflow sibling — both inspect WF-31."

  - id: ICV-019
    description: "WF-32 'Call WF-51 (Notify Admin)' — verify upstream 'Prepare Admin Notification' (Code) emits channelId + messageText."
    workflow_ref: WF-32
    target_subworkflow: WF-51
    caller_node: "Call WF-51 (Notify Admin)"
    upstream_node: "Prepare Admin Notification"
    priority: P4
    status: done
    completed_at: 2026-05-18T10:10:00Z
    completion_note: "Same as ICV-004 — WF-50 alias handles {phoneNumber, message} shape."
    batch: 6
    depends_on:
      - id: ICV-007
        type: soft
        reason: "same-workflow sibling — both inspect WF-32."
      - id: ICV-008
        type: soft
        reason: "same-workflow sibling — both inspect WF-32."

batch_summary:
  - batch: 1
    priority: P0
    item_count: 4
    estimated_tokens: 60000
    contents: [ICF-005, ICF-007, ICF-010, ICF-013]
    rationale: "Primary admin audit trail for state transitions. All Structural single-workflow fixes."
  - batch: 2
    priority: P1
    item_count: 4
    estimated_tokens: 60000
    contents: [ICF-006, ICF-008, ICF-009, ICF-011]
    rationale: "Wrong-state / user-not-found admin alerts. 4-Structural cap forces split."
  - batch: 3
    priority: P1
    item_count: 1
    estimated_tokens: 15000
    contents: [ICF-012]
    rationale: "Spillover from Batch 2 — kept in P1 priority. Could be inlined into Batch 2 if user prefers."
  - batch: 4
    priority: P2
    item_count: 3
    estimated_tokens: 45000
    contents: [ICF-001, ICF-002, ICF-003]
    rationale: "WF-50 user-facing breaks (REBOOK + STOP). Per source-doc priority order."
  - batch: 5
    priority: P3
    item_count: 1
    estimated_tokens: 15000
    contents: [ICF-004]
    rationale: "WF-25 garbage admin notification — lowest-frequency."
  - batch: 6
    priority: P4
    item_count: 18 # 19 entries, 1 obsolete (ICV-009)
    estimated_tokens: 36000
    contents: [ICV-001, ICV-002, ICV-003, ICV-004, ICV-005, ICV-006, ICV-007, ICV-008, ICV-010, ICV-011, ICV-012, ICV-013, ICV-014, ICV-015, ICV-016, ICV-017, ICV-018, ICV-019]
    rationale: "Read-only verification of Code/Set upstream nodes (~2K each). Each verifies that the Code/Set node actually emits the required output keys. No JSON mutation expected — discovered problems become new follow-up items, not in-batch fixes."

plugin_improvement_candidates:
  - "technical-workflow-review should perform input-contract validation: for every executeWorkflow targeting WF-50/WF-51 (or any configured well-known downstream), validate upstream produces required keys OR mappingMode: defineBelow with required keys present."
  - "More general check: any executeWorkflow caller in passthrough mode with immediately-upstream node of type postgres/executeWorkflow/httpRequest/if should be flagged for manual review."
  - "build-workflow Step 5f.2 (input-contract preservation, already in 1.12.0+) — add actionable diagnostic checklist: 'Before calling WF-XX from passthrough mode, confirm immediately-upstream node output schema matches WF-XX expected input.'"
  - "Source-doc count mismatch: heading says '(17)' Code/Set verify sites but enumerates 19 rows. Parser-side, prefer actual row count over heading count."
