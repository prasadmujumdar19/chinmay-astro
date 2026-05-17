slug: tech-debts
input_source: Tech_Debts.md
input_hash: ""
source_file_update: false
working_copy_path: .methodology/sprint-tech-debts-working.md
started: 2026-05-13T00:00:00Z
last_updated: 2026-05-14T04:00:00Z
planning_complete: true
dependency_conflicts_found:
  - "TD-026 (P2) has hard dependency on TD-010 (P3) — UNBLOCK status guard requires UNBLOCK command to exist first. Recommend promoting TD-010 to P2 and executing them together."
priority_adjustments_confirmed: "user confirmed: TD-010 promoted to P2 batch 9 alongside TD-026"

items:

  # === P0 — Smoke Test Blockers ===

  - id: TD-001
    description: Schema prefix chinmay_astro. missing in 12 nodes across 8 workflows
    priority: P0
    status: done
    batch: 1
    completed: 2026-05-13T22:01:00Z
    note: "Fixed 12 active nodes + 6 disabled nodes across WF-47, WF-11, WF-44, WF-45, WF-46, WF-34, WF-60. Also fixed WF-34 Update Payment Record (bare payments ref not in original list). No git repo in project."
    change_type: BatchSurgical
    workflows: [WF-47, WF-11, WF-44, WF-45, WF-46, WF-34, WF-60]
    depends_on: []

  - id: TD-002
    description: WF-33 redundant WF-52 call — reads channelId from WF-52 instead of DB
    priority: P0
    status: done
    batch: 1
    completed: 2026-05-13T22:11:00Z
    note: "Removed Prepare Channel Data + Call WF-52 Create Channel nodes. Rewired Create Consultation Record → Prepare User Activation Message. Patched Notify Admin channelId to read from Load User by Phone DB result. SELECT * already returned slack_channel_id so no SQL change needed."
    change_type: Structural
    workflows: [WF-33]
    depends_on: []

  - id: TD-014
    description: WF-42 UPDATE uses non-existent users columns — CLOSE will fail
    priority: P0
    status: obsolete
    batch: 1
    change_type: DBSchema
    workflows: [WF-42]
    decision_made: "Option A confirmed by user: ALTER TABLE chinmay_astro.users ADD COLUMN current_consultation_id INTEGER, ADD COLUMN total_consultations INTEGER DEFAULT 0"
    obsolete_reason: "Both current_consultation_id (integer) and total_consultations (integer) already exist in chinmay_astro.users. Schema was ahead of CONTEXT.md documentation. No migration needed."
    depends_on: []

  # === P1 — Functional Gaps ===

  - id: TD-006
    description: WF-20 registry note stale — describes a bug that is already fixed
    priority: P1
    status: obsolete
    batch: 2
    obsolete_reason: "The 'WRONG' note described in this TD does not exist in workflow-registry.md. WF-20 is correctly shown as fixed in both WIP table (line 182) and inventory (line 234). No action needed."
    change_type: Documentation
    workflows: []
    depends_on: []

  - id: TD-003
    description: WF-22 User-Already-Exists path calls a non-existent WF-50 workflow ID
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-13T22:33:00Z
    note: "Patched 'Call WF-50 Send WhatsApp'1 workflowId from aJoquwuEUbz8bI1B → BUVun38WEKb12zg9."
    change_type: Surgical
    workflows: [WF-22]
    depends_on: []

  - id: TD-025
    description: WF-32 missing idempotency guard — duplicate Payment Completed tap accepted
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-13T22:35:00Z
    note: "Added IF node 'Already Payment Submitted?' after trigger. True branch → Prepare Reassurance Message → Call WF-50 (exit). False branch → existing Create Payment Record flow. user.status available from WF-02 trigger input — no extra DB query needed."
    change_type: Structural
    workflows: [WF-32]
    depends_on: []

  - id: TD-030
    description: WF-00 no bot echo filter — outbound WA messages may re-enter routing
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-13T22:40:00Z
    note: "Added bot echo filter in Parse WhatsApp Message code node: compares message.from to value.metadata.display_phone_number (stripped of non-digits). Sets skip:true if match."
    change_type: Surgical
    workflows: [WF-00]
    depends_on: []

  - id: TD-031
    description: APPROVE command wording inconsistency across docs
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-13T22:40:00Z
    note: "Canonical form: APPROVE PAYMENT <phone>. Fixed workflow-registry.md (WF-11 + WF-33 entries), customer_journey_map.html (3 occurrences), FunctionalTestCases.md (TC-1005 rewritten). CLAUDE.md and user_journey_map.html were already correct."
    change_type: Documentation
    workflows: [WF-11]
    depends_on: []

  - id: TD-004
    description: WF-60 all core nodes disabled — message logging completely dead
    priority: P1
    status: done
    batch: 3
    completed: 2026-05-13T23:30:00Z
    note: "Enabled all 6 disabled nodes: Log to Messages Table, Get User ID, Inbound-Prepare Log Entry, Inbound-Log Message, Outbound-Prepare Log Entry, Outbound-Log Message. Schema prefix already fixed by TD-001. Main logging path (Trigger → Extract → Log to Messages Table → Done) now fully active. Note: Get User ID and old detailed logging branch (4 nodes) have no incoming connection from trigger — they are enabled but orphaned; logging works via the simpler main path."
    change_type: Structural
    workflows: [WF-60]
    depends_on:
      - id: TD-001
        type: soft
        reason: "TD-001 fixes schema prefix on WF-60 Get User ID node — should apply prefix fix before re-enabling logging nodes"

  - id: TD-005
    description: WF-11 admin confirmation and sub-command nodes disabled
    priority: P1
    status: done
    batch: 3
    completed: 2026-05-13T23:30:00Z
    note: "Enabled all 9 disabled nodes: Confirm Consultation Closure, Confirm User Blocked, Get Active Users, Format List, Send List To Admin, Get Stats, Format Stats, Send Stats To Admin, Unknown Command Response. Schema prefix already fixed by TD-001 on Get Active Users and Get Stats."
    change_type: Structural
    workflows: [WF-11]
    depends_on:
      - id: TD-001
        type: soft
        reason: "same-workflow sibling — TD-001 fixes schema prefix on WF-11 Get Active Users and Get Stats nodes; prefix must be applied before re-enabling those nodes"

  - id: TD-021
    description: WF-33 missing state guard — APPROVE executes regardless of user status
    priority: P1
    status: done
    batch: 3
    completed: 2026-05-13T23:35:00Z
    note: "Added IF node 'User in Correct State?' at [656,-200] between Load User by Phone and Update Payment Status. True branch (status=payment_submitted) → existing approval flow. False branch → 'Notify Admin Wrong State' Slack node posts error to user's consultation channel (slack_channel_id from DB). Removed direct Load User by Phone → Update Payment Status connection."
    change_type: Structural
    workflows: [WF-33]
    depends_on:
      - id: TD-002
        type: soft
        reason: "same-workflow sibling — both modify WF-33; TD-002 deletes nodes, TD-021 adds node; run sequentially to avoid conflicts"

  - id: TD-015
    description: WF-42 sends unconfirmed Meta template instead of interactive buttons
    priority: P1
    status: done
    batch: 4
    completed: 2026-05-14T00:10:00Z
    note: "Patched 'Prepare Feedback Message' code node to output messageType='interactive' with interactivePayload type='button'. Button IDs: 'btn_feedback' (Leave Feedback) and 'btn_rebook' (Book Again). TD-024 must use these exact IDs when adding button_reply routing in WF-43/WF-02."
    change_type: Structural
    workflows: [WF-42]
    depends_on:
      - id: TD-014
        type: soft
        reason: "same-workflow sibling — both modify WF-42; TD-014 must be resolved first"

  - id: TD-022
    description: WF-42 missing state guard — CLOSE executes regardless of user status
    priority: P1
    status: done
    batch: 4
    completed: 2026-05-14T00:10:00Z
    note: "Added IF node 'User in Correct State?' at [432,-200] between Load User by Phone and Close Consultation Record. True (status=consultation_active) → existing close flow. False → 'Notify Admin Wrong State' Slack node posts error to consultation channel (slack_channel_id from DB). Applied in same partial update as TD-015."
    change_type: Structural
    workflows: [WF-42]
    depends_on:
      - id: TD-015
        type: soft
        reason: "same-workflow sibling — all three WF-42 changes must run sequentially"

  - id: TD-016
    description: WF-31 no Slack relay for payment_submitted user messages
    priority: P1
    status: done
    batch: 4
    completed: 2026-05-14T00:10:00Z
    note: "Added Slack relay fan-out from trigger: Load User for Relay (Postgres, gets slack_channel_id by phone_number) → Prepare Admin Relay (code, builds channelId+messageText for WF-51) → Relay to Admin Slack (calls WF-51). Runs in parallel with existing WF-25 intent classifier branch — all user messages during payment_submitted now relayed to their consultation channel."
    change_type: Structural
    workflows: [WF-31]
    depends_on: []

  - id: TD-023
    description: WF-10 relay path has no user status check — admin notes sent during payment_submitted
    priority: P1
    status: done
    batch: 5
    completed: 2026-05-14T01:00:00Z
    note: "Added 'Load User Status' Postgres node (SELECT status WHERE slack_channel_id=$1) at [1050,500] and 'User Consultation Active?' IF at [1264,500]. Rewired: 'Command - User Channel?' case:1 → Load User Status → IF → (true) Call WF-41, (false) drop. Relay now only fires for consultation_active users."
    change_type: Structural
    workflows: [WF-10]
    depends_on: []

  - id: TD-024
    description: WF-43 no button_reply routing for post-consult buttons
    priority: P1
    status: done
    batch: 5
    completed: 2026-05-14T01:00:00Z
    note: "WF-43: Added 'Is Button Reply?' IF before WF-25 (condition: messageType=interactive). True branch → 'Is Rebook Button?' IF (condition: rawMessage.interactive.button_reply.id=btn_rebook). Rebook true → Route to Rebook WF-45 (existing). Rebook false → 'Prompt for Feedback' code + 'Send Feedback Prompt via WF-50'. False branch → existing WF-25 intent flow. WF-02: Patched 'Detect Route' to check consultation_closed + button_reply BEFORE generic PAYMENT_CONFIRM route — routes to POST_CONSULT_TEXT (WF-43) instead of WF-32."
    change_type: Structural
    workflows: [WF-43, WF-02]
    depends_on:
      - id: TD-015
        type: hard
        reason: "explicitly stated: fix must be done together with TD-015 — button_ids defined in TD-015 are required for WF-02 routing in TD-024"

  # === P2 — Design / Naming Confusion ===

  - id: TD-009
    description: WF-60 and WF-20 IDs swapped in workflow-registry.md
    priority: P2
    status: obsolete
    batch: 6
    change_type: Documentation
    workflows: []
    obsolete_reason: "Both IDs are already correct in the registry — WF-20: LgIDj1v4ZbCPlX25, WF-60: 6H75p935FpBVBQtV. Fixed in prior sessions when WF-60 UUID was documented during TD-004."
    depends_on: []

  - id: TD-007
    description: WF-52 call-site node names imply creator-only semantics — confuses Claude
    priority: P2
    status: done
    batch: 6
    completed: 2026-05-14T00:00:00Z
    note: "Renamed 'Call WF-52 (Create User Channel)' → 'Ensure Slack Channel Exists (WF-52)' in WF-22 (dr8QM0m92Ml8MvIh). WF-33 node was already deleted in TD-002. Connections auto-updated by plugin. Registry WF-52 entry updated to clarify idempotent behavior and sole caller (WF-22 only)."
    change_type: Surgical
    workflows: [WF-22, WF-33]
    depends_on:
      - id: TD-002
        type: soft
        reason: "TD-002 deletes the WF-33 WF-52 call node — TD-007 rename of that node becomes moot if TD-002 already ran; apply to WF-22 node only after TD-002"

  - id: TD-008
    description: WF-52 input field contract undocumented; callers use passthrough mapping
    priority: P2
    status: done
    batch: 6
    completed: 2026-05-14T00:00:00Z
    note: "Documented WF-52 input contract in registry: phoneNumber (string), userName (string), optional userId (integer). Output: { channelId, channelName, isNew }. Confirmed only WF-22 calls WF-52 — WF-32 and WF-42 removed in prior sessions. Stale caller list corrected."
    change_type: Documentation
    workflows: []
    depends_on:
      - id: TD-002
        type: soft
        reason: "TD-002 removes WF-33 as a WF-52 caller — document after TD-002 so contract reflects remaining callers only"

  - id: TD-033
    description: WF-50 no input validation for empty/null message body
    priority: P2
    status: done
    batch: 6
    completed: 2026-05-14T00:30:00Z
    note: "Guard added in 'Prepare Payload' code node: if messageType=text and messageContent is null/empty after trim, returns [] (graceful exit — no Meta API call). Implemented as patchNodeField (surgical) rather than structural new-node approach — new IF+Slack nodes couldn't be activated due to n8n workflowInputs/propertyValues validation errors. Return [] is the correct n8n pattern for stopping execution in a sub-workflow. Slack warning omitted — n8n execution log captures the stopped execution."
    change_type: Structural
    workflows: [WF-50]
    depends_on: []

  - id: TD-034
    description: WF-00 no guard for whitespace-only user messages before routing
    priority: P2
    status: done
    batch: 6
    completed: 2026-05-14T00:35:00Z
    note: "Guard added in 'Parse WhatsApp Message' code node in WF-00: after switch extracts messageContent, checks if messageType=text and messageContent is null/empty after trim → returns {skip:true, reason:'Whitespace-only text message — skipped'}. Consistent with existing skip pattern already used for non-message events and bot echoes."
    change_type: Surgical
    workflows: [WF-00]
    depends_on:
      - id: TD-030
        type: soft
        reason: "same-workflow sibling — both modify WF-00; run sequentially"

  - id: TD-019
    description: WF-47 does not archive Slack channel on STOP/opted_out
    priority: P2
    status: done
    batch: 7
    completed: 2026-05-14T00:29:00Z
    note: "Added Get User Slack Channel (Postgres SELECT slack_channel_id) + Archive Slack Channel (Slack archive op) nodes after Send Opt-out Confirmation via WF-50. Direct Slack archive — WF-52 extended separately if needed."
    change_type: Structural
    workflows: [WF-47]
    depends_on:
      - id: TD-001
        type: soft
        reason: "same-workflow sibling — TD-001 fixes schema prefix on WF-47 nodes; apply before adding new WF-52 call"

  - id: TD-020
    description: WF-46 does not archive Slack channel on BLOCK
    priority: P2
    status: done
    batch: 7
    completed: 2026-05-14T00:30:00Z
    note: "Added Get User Slack Channel (Postgres SELECT slack_channel_id) + Archive Slack Channel (Slack archive op) nodes after Send a message (admin confirmation). Same pattern as TD-019."
    change_type: Structural
    workflows: [WF-46]
    depends_on:
      - id: TD-001
        type: soft
        reason: "same-workflow sibling — TD-001 fixes schema prefix on WF-46 nodes; apply before adding new WF-52 call"

  - id: TD-027
    description: WF-20 HELP response is static — not status-aware per journey map J-18
    priority: P2
    status: done
    batch: 7
    completed: 2026-05-14T00:32:00Z
    note: "Updated Send HELP Response messageBody to a ternary chain on $('When Executed by Another Workflow').item.json.userStatus — covers payment_pending/submitted/consultation_active/consultation_closed with specific guidance; generic fallback for unknown/null status."
    change_type: Surgical
    workflows: [WF-20]
    depends_on: []

  - id: TD-029
    description: WF-25 no error handling for Gemini API failures
    priority: P2
    status: done
    batch: 8
    completed: 2026-05-14T01:30:00Z
    note: "Added onError:continueErrorOutput to Classify Intent HTTP Request node. Added Handle Gemini Error Code node at [-800,160]: returns intentResult=general_enquiry + geminiError:true from Prepare Intent Request data. Error output (sourceOutput:1) → Handle Gemini Error → Return to Caller."
    change_type: Structural
    workflows: [WF-25]
    depends_on: []

  - id: TD-028
    description: WF-30 and WF-31 missing stop_intent routing branch
    priority: P2
    status: done
    batch: 8
    completed: 2026-05-14T02:00:00Z
    note: "WF-30: updateNode added c4 stop_intent notEquals to Is Pass-Through Intent?; addNode Is Stop Intent? IF at [160,160]; addNode Call WF-47 Unsubscribe executeWorkflow at [380,160]; connected False→Is Stop Intent?→True→Call WF-47. WF-31: identical 5-op patch applied. Both JSONs exported."
    change_type: Structural
    workflows: [WF-30, WF-31]
    depends_on:
      - id: TD-016
        type: soft
        reason: "same-workflow sibling — TD-016 also modifies WF-31; run sequentially"

  - id: TD-032
    description: WF-44 saves all text as feedback without intent classification — rebook intent lost
    priority: P2
    status: done
    batch: 8
    completed: 2026-05-14T02:30:00Z
    note: "Inserted Call WF-25 Intent Classifier at [-380,-160] + Is Rebook Intent? IF at [-160,-160] + Call WF-45 Rebook at [60,-160] before Save Feedback. Trigger now routes: rebook_intent→WF-45; all other intents→Save Feedback→Ack. Used full workflow update (removeConnection fails for executeWorkflowTrigger node type)."
    change_type: Structural
    workflows: [WF-44]
    depends_on: []

  - id: TD-010
    description: WF-11 missing UNBLOCK admin command (promoted from P3 — required by TD-026)
    priority: P2
    status: obsolete
    batch: 9
    change_type: Structural
    workflows: [WF-11]
    obsolete_reason: "UNBLOCK command already fully implemented in WF-11 (GoTYo0GS2y8qjjkw): Parse Command detects UNBLOCK → commandType=UNBLOCK_USER; Switch routes to Lookup Blocked User; full unblock flow with Confirm/No-Found responses already live."
    depends_on:
      - id: TD-005
        type: soft
        reason: "same-workflow sibling — TD-005 re-enables WF-11 nodes; run before adding new UNBLOCK branch"

  - id: TD-026
    description: WF-11 UNBLOCK has no status guard — can accidentally override opted_out users
    priority: P2
    status: obsolete
    batch: 9
    change_type: Structural
    workflows: [WF-11]
    obsolete_reason: "Guard already implemented: Lookup Blocked User SELECT has AND status='blocked' — opted_out users return no row, Blocked User Found? IF routes to No Blocked User Found. Guard is in place."
    depends_on:
      - id: TD-010
        type: hard
        reason: "UNBLOCK status guard must be implemented as part of the UNBLOCK command implementation — cannot add guard for a command that doesn't exist yet"

  - id: TD-017
    description: Non-text messages during consultation_active silently dropped — not forwarded to Slack
    priority: P2
    status: done
    batch: 9
    completed: 2026-05-14T03:00:00Z
    note: "Documented in STATUS.md Post Go-Live item #15: non-text messages (images, voice, video) are silently dropped during consultation_active; WF-41 only relays text. Accepted limitation for go-live; Phase 2 relay upgrade planned."
    change_type: Documentation
    workflows: []
    depends_on: []

  # === P3 — Feature Gaps (remaining after TD-010 promoted) ===

  - id: TD-011
    description: WF-45 Rebook payment wording not updated to standard UPI text
    priority: P3
    status: done
    batch: 10
    completed: 2026-05-14T03:30:00Z
    note: "Updated Send Payment Instructions node to send messageType=interactive with interactivePayload: type=button, body=standard ₹500 UPI text (matching WF-22 format), action.buttons=[{id:payment_completed, title:Payment Completed}]. Matches WF-22 initial payment flow exactly."
    change_type: Structural
    workflows: [WF-45]
    depends_on:
      - id: TD-001
        type: soft
        reason: "same-workflow sibling — TD-001 fixes schema prefix on WF-45 Load User Record and Set status=payment_pending nodes"

  - id: TD-012
    description: WF-23 registry status shows Placeholder but it is built and active
    priority: P3
    status: done
    batch: 10
    completed: 2026-05-14T03:30:00Z
    note: "Updated WF-23 registry status from Placeholder → Active. Also updated WF-45 from Placeholder → Active."
    change_type: Documentation
    workflows: []
    depends_on: []

  # === P4 — Cleanup ===

  - id: TD-013
    description: Three stale/backup workflows polluting the n8n workflow list
    priority: P4
    status: done
    batch: 11
    completed: 2026-05-14T04:00:00Z
    note: "Deleted: yIZwO3CZk6bOBAXl (BACKUP WF-30 wrong onboarding), fdlIpl67amL2Ho6U (BACKUP WF-25 superseded), z6as85o3b1zK22eF (WF-30 DEACTIVATED). n8n now has 28 workflows — all active or intentionally inactive (WF-32)."
    change_type: Surgical
    workflows: []
    depends_on: []

  - id: TD-018
    description: WF-42 registry description says Archives via WF-52 — incorrect, doc fix needed
    priority: P4
    status: obsolete
    batch: 11
    change_type: Documentation
    workflows: []
    obsolete_reason: "WF-42 registry entry already correct — no 'Archives via WF-52' text present. WF-52 entry explicitly states 'WF-32 and WF-42 do NOT call WF-52'. Fixed in earlier sprint batches. Also fixed stale WIP note in WF-11 entry (UNBLOCK already implemented)."
    depends_on:
      - id: TD-014
        type: soft
        reason: "WF-42 description update should reflect final TD-014 fix approach chosen"
