slug: p0-coverage-report-2026-05-17
input_source: docs/superpowers/reports/P0_Coverage_Report_2026-05-17.md
input_hash: 23448634cd16f290cacd6d385ad28337f4757c1783d10a3dc4592b2a4305cfda
source_file_update: false
working_copy_path: .methodology/sprint-p0-coverage-report-2026-05-17-working.md
planned_at: 2026-05-17T03:09:27Z
last_updated: 2026-05-17T15:05:00Z
planning_complete: true

scope_decisions:
  drift_scan: "Only the 15 already identified (no broad scan of remaining 13 WFs)"
  md_regen_scope: "Only changed WFs (15 of 28)"
  wrapper_strategy: "Single final batch — all edits land first, then export + .md regen + git commit"
  source_tracking: "Read-only — working copy used; source report is a historical snapshot"

pseudocode_immutable: true
note: |
  STRICT RULE per user: pseudocode files in docs/pseudocode/*.pseudo are the source of truth
  and MUST NOT be modified. All implementation items bring n8n workflow JSONs into alignment
  with the existing .pseudo files. If JSON drift exposes a pseudocode bug, surface it as a
  follow-up item — DO NOT edit the .pseudo file mid-sprint.

dependency_conflicts_found: []
priority_adjustments_confirmed: "All items P0 per source report — no priority adjustments needed; batches ordered by dependency, not priority"

items:
  # ============================================================
  # BATCH 1 — Foundations (sub-workflows others depend on)
  # ============================================================

  - id: WF-60
    description: "Add TD-030 bot-echo filter + TD-034 whitespace-only guard for inbound; add user lookup by phone_number when caller doesn't provide userId; return {logged:false, reason:'pre_onboarding_user'} for pre-onboarding inbound"
    priority: P0
    status: done  # completed 2026-05-17T13:25Z
    batch: 1
    depends_on: []

  - id: WF-52
    description: "Add isNew flag to both return paths (new channel + existing channel); structured {success:false, error, channelId:null, isNew:false} return for non-name_taken errors"
    priority: P0
    status: done  # completed 2026-05-17T13:30Z
    batch: 1
    depends_on: []

  - id: WF-50
    description: "Extend null-body guard to also detect missing interactivePayload and missing templateName; log silent drops to WF-60 with success=false, error='empty_body_dropped' AND return structured error to caller; carry consultationId through to WF-60; for messageType='interactive', use interactivePayload.body.text || JSON.stringify(payload) for WF-60 messageContent log"
    priority: P0
    status: done  # completed 2026-05-17T13:40Z
    batch: 1
    depends_on:
      - id: WF-60
        type: hard
        reason: "WF-50 logs silent drops to WF-60 — WF-60 must accept the new filter inputs first"

  # ============================================================
  # BATCH 2 — Onboarding entry path (WF-21 → WF-01 → WF-22)
  # ============================================================

  - id: WF-21
    description: "Accept wasOptedOut flag from caller; if true, prepend 'Welcome back' acknowledgement to the welcome+form message"
    priority: P0
    status: done  # completed 2026-05-17T13:42Z (subagent af194d639fcb58a0f)
    notes: "Welcome-back logic already in place exactly matching pseudocode. Only delta: normalized Call WF-50 Send WhatsApp workflowId from __rl object to plain string (lint compliance). Validation: 0 errors."
    batch: 2
    depends_on: []

  - id: WF-01
    description: "Pass wasOptedOut: true to WF-21 in Step 9 (opted_out re-engagement path); verify schema prefix chinmay_astro. on all queries in Steps 6/10/11 (Section B autonomous fix already applied to pseudocode)"
    priority: P0
    status: done  # verified 2026-05-17T14:02Z (main thread)
    notes: "Verified only — no changes needed. Route Opted-Out to WF-21 already passes wasOptedOut: '={{ true }}'. All 3 Postgres queries (Load User, Lookup Blacklisted Users, Load Pending User) already have chinmay_astro. schema prefix. Drifts logged to followups: Load User SELECT missing 13 columns from pseudocode Step 11; 2 of 3 executeWorkflow nodes still use __rl shape; 7 pre-existing Code-node return-shape validator errors."
    batch: 2
    depends_on:
      - id: WF-21
        type: hard
        reason: "WF-21 must accept the wasOptedOut input before WF-01 can pass it without breaking the call"

  - id: WF-22
    description: "Change button title to 'Payment Completed ✓' (glyph); ON CONFLICT DO UPDATE for opted_out re-engagement (per Theme 11A); branch on WF-52 success (use isNew flag); if WF-52 fails (non-name_taken error), admin-alert via WF-51 and abort (no payment instructions sent); rowCount-based check for inserted detection (Postgres xmax=0)"
    priority: P0
    status: done  # verified 2026-05-17T14:04Z (main thread)
    notes: "Verified only — no changes needed. All 5 required changes already implemented in live: button title 'Payment Completed ✓' ✓; INSERT ON CONFLICT (phone_number) DO UPDATE … RETURNING (xmax = 0) AS inserted ✓; User Created? IF branches on $json.inserted ✓; WF-52 Success? IF branches on $json.success — TRUE→Save→Prepare→WF-50, FALSE→Build Admin Alert→Call WF-51→END ✓; no encryption-svc node ✓. Validation: 0 errors. Drift logged: User Created? IF redundant (both branches → same node); 3 executeWorkflow nodes use __rl shape; Create User Record uses deprecated continueOnFail."
    batch: 2
    depends_on:
      - id: WF-52
        type: hard
        reason: "WF-22 branches on WF-52's new isNew flag — WF-52 must return it first"
      - id: WF-50
        type: hard
        reason: "WF-22 sends payment instructions via WF-50 — relies on WF-50's structured error contract for the admin-alert branch"

  # ============================================================
  # BATCH 3 — Entry + state routing (WF-00, WF-02)
  # ============================================================

  - id: WF-00
    description: "Add WF-60 executeWorkflow node after Parse WhatsApp Message, with onError=continueRegularOutput (Theme 4: single inbound logging entry point). WF-60 receives parsed message; filters live in WF-60. Verify echo guard identifier source: message.from === value.metadata.display_phone_number.replace(/\\D/g, '')"
    priority: P0
    status: done  # completed 2026-05-17T14:15Z (main thread)
    notes: "Added Call WF-60 Message Logger executeWorkflow node between Gather Message Info For Processing and Call WF-01 Message Router. typeVersion=1.3; workflowId='6H75p935FpBVBQtV' (plain string); onError='continueRegularOutput'; inputs={phoneNumber, messageType, messageContent, messageId, direction:'inbound'}. Bot-echo (TD-030) + whitespace-only (TD-034) guards already in Parse code per pseudocode. Also normalized pre-existing __rl workflowId on Call WF-01 Message Router to plain string (lint hook required). Lint: pass."
    batch: 3
    depends_on:
      - id: WF-60
        type: hard
        reason: "WF-00 calls WF-60 — WF-60 must have the new filter behavior + user lookup before WF-00 routes inbound to it"

  - id: WF-02
    description: "Add user.status='payment_pending' guard before PAYMENT_CONFIRM routing (other button_reply types fall to UNHANDLED admin alert); add UNHANDLED → WF-51 admin alert; add user IS NOT NULL guards on all branches (lines 17-25 in pseudocode terms)"
    priority: P0
    status: done  # completed 2026-05-17T14:25Z (main thread)
    notes: "15 operations applied. Detect Route jsCode rewritten with explicit 'user !== null' guards on every status branch; PAYMENT_CONFIRM now requires interactiveType='button_reply' AND user!=null AND userStatus='payment_pending' (orphan button_reply types fall to UNHANDLED). Route Switch grew from 8 to 9 rules (added UNHANDLED). Added Build UNHANDLED Alert code node (formats channelId='C0A5B0ZE81E' + warning messageText with phone/msgType/interactiveType/userStatus/pendingUser/content). Added Call WF-51 (UNHANDLED Alert) executeWorkflow (workflowId='wlZRK0YxnhP0b2RL', tv=1.3). Bonus cleanup: normalized all 9 pre-existing __rl workflowIds on existing Call WF-* nodes to plain strings (lint hook required). Lint: pass. 1 pre-existing Code-node return-shape validator error (unchanged)."
    batch: 3
    depends_on: []  # WF-51 is unchanged in this sprint — already available

  # ============================================================
  # BATCH 4 — Admin command dispatch (WF-10 + WF-11 coupled)
  # ============================================================

  - id: WF-10
    description: "Implement DR-13 channel-scope rules: user-targeted commands (APPROVE/REJECT/CLOSE/BLOCK/UNBLOCK) accepted ONLY in consult-{phone}; admin-wide commands (LIST/STATS/HELP) accepted in any channel. Reject user-targeted commands in chinmay-admin-commands with polite Slack reminder. Standardise event.* → body.event.* for Slack payload paths. Verify bot-loop guard: body.authorizations[0].user_id != body.event.user"
    priority: P0
    status: done  # completed 2026-05-17T14:55Z (main thread, build-workflow Step 5e)
    notes: "Step 5e jq-transform + full PUT. Detect Command - Admin Channel jsCode rewritten with DR-13 categorisation (adminWide=[LIST,STATS,HELP] vs userTargeted=[APPROVE,REJECT,CLOSE,BLOCK,UNBLOCK]). Command - Admin Channel ? switch reshaped 2→3 outputs (Admin Command / Wrong Channel / Not Command). New nodes: Build Wrong Channel Warning (Code), Call WF-51 (Wrong Channel Warning) executeWorkflow tv=1.3. Switched 2 __rl workflowIds (Call WF-11, Call WF-41) to plain strings; switched 2 passthrough mappingModes to defineBelow with explicit camelCase fields. Bot-loop guard + body.event.* paths already correct (no change). User-channel detect unchanged (admin-wide commands also work there per DR-13). Took 2 PUTs (missed passthrough lint debt scan on pass 1). Lint: pass."
    batch: 4
    depends_on: []

  - id: WF-11
    description: "Add command aliases: bare REJECT ≡ REJECT PAYMENT; bare CLOSE ≡ CLOSE CONSULT ≡ CLOSE CONSULTATION ≡ CLOSE CHAT CONSULT; APPROVE ≡ APPROVE PAYMENT. Standardise dispatch payload to camelCase across boundary to WF-33/WF-34/WF-42/WF-46. Verify schema prefix chinmay_astro. on all queries (Steps 10/16/18)"
    priority: P0
    status: done  # completed 2026-05-17T15:00Z (main thread, build-workflow Step 5e, clean in 1 PUT)
    notes: "Step 5e jq-transform + full PUT — clean in ONE pass (pre-scanned lint debt during inspection). Parse Command jsCode rewritten with longest-match aliasing (CLOSE CHAT CONSULT / CLOSE CONSULTATION / CLOSE CONSULT / CLOSE all → CLOSE_CONSULTATION; bare APPROVE/REJECT also accepted) + token-scan phone parser (first token matching /^\\+?\\d{10,15}$/; tokens after phone → reason). Normalized 4 __rl workflowIds (Call WF-33/34/42/46) to plain strings. Switched 4 passthrough mappingModes to defineBelow with explicit camelCase dispatch contract: {commandType, phoneNumber, targetPhone, reason, originalMessage, adminUserId, channelId, channelName}. All 4 Postgres queries already have chinmay_astro. schema prefix (Section B autonomous fix already live). Lint: pass."
    batch: 4
    depends_on:
      - id: WF-10
        type: hard
        reason: "WF-10 dispatches to WF-11 — payload contract change must be coordinated; WF-10's new channel-scope gate determines what reaches WF-11"

  # ============================================================
  # BATCH 5 — Slack-relay refactor (WF-33 + WF-34 siblings)
  # ============================================================

  - id: WF-33
    description: "Refactor admin Slack confirmation post: replace direct Slack node with executeWorkflow → WF-51. Verify Step 13 uses <phone_number> not <wa_id>. Verify schema prefix on all queries (Section B autonomous fix already applied to pseudocode)"
    priority: P0
    status: pending
    batch: 5
    depends_on: []  # WF-51 is unchanged — already available

  - id: WF-34
    description: "Add payment_submitted state guard mirroring WF-33 (Step 4); add user-not-found error path; refactor admin Slack confirmation post to use WF-51 instead of direct Slack node; change retry button title to 'Payment Completed ✓'"
    priority: P0
    status: pending
    batch: 5
    depends_on:
      - id: WF-33
        type: soft
        reason: "Same-workflow sibling pattern: both refactor admin Slack to WF-51 — sequential execution avoids concurrent update race and lets WF-34 reuse WF-33's pattern"

  # ============================================================
  # BATCH 6 — Consult + cleanup paths (WF-40, WF-42, WF-47)
  # ============================================================

  - id: WF-40
    description: "Remove duplicate STOP intercept (WF-20 already intercepts before reaching WF-40); make WF-40 a pure pass-through relay to WF-51 only. Verify schema prefix on all queries"
    priority: P0
    status: pending
    batch: 6
    depends_on: []

  - id: WF-42
    description: "Add user-not-found error path (load fails → Slack warning to admin channelName, no state change). Post error to admin's channelName (NOT user.slack_channel_id). Verify state guard: user.status = consultation_active before update. Verify NO archive of Slack channel (Design Rule #10 — channels preserved for REBOOK reuse). Two-button message (Leave Feedback, Book Again) — no 3rd button"
    priority: P0
    status: pending
    batch: 6
    depends_on: []

  - id: WF-47
    description: "Remove channel archive call (Steps 7-8 in pseudocode terms); status → opted_out + admin_actions log (action_type='opted_out', notes) + opt-out message via WF-50. Verify schema prefix chinmay_astro. on users + admin_actions queries"
    priority: P0
    status: pending
    batch: 6
    depends_on: []

  # ============================================================
  # BATCH 7 — Verification, export, docs, commit (wrapper)
  # ============================================================

  - id: VERIFY-ALL
    description: "Per-WF pseudocode↔JSON re-comparison for all 15 touched workflows. For each WF: fetch live JSON via mcp__n8n__n8n_get_workflow, compare nodes/parameters against .pseudo file algorithm; any drift becomes a fix-and-re-export cycle. Output: alignment report listing PASS/DRIFT for each of the 15. DRIFT items require return to that WF's batch and re-fix"
    priority: P0
    status: pending
    batch: 7
    depends_on:
      - id: WF-60
        type: hard
        reason: "Verification runs after all implementation batches complete"
      - id: WF-52
        type: hard
        reason: "(implementation batch 1)"
      - id: WF-50
        type: hard
        reason: "(implementation batch 1)"
      - id: WF-21
        type: hard
        reason: "(implementation batch 2)"
      - id: WF-01
        type: hard
        reason: "(implementation batch 2)"
      - id: WF-22
        type: hard
        reason: "(implementation batch 2)"
      - id: WF-00
        type: hard
        reason: "(implementation batch 3)"
      - id: WF-02
        type: hard
        reason: "(implementation batch 3)"
      - id: WF-10
        type: hard
        reason: "(implementation batch 4)"
      - id: WF-11
        type: hard
        reason: "(implementation batch 4)"
      - id: WF-33
        type: hard
        reason: "(implementation batch 5)"
      - id: WF-34
        type: hard
        reason: "(implementation batch 5)"
      - id: WF-40
        type: hard
        reason: "(implementation batch 6)"
      - id: WF-42
        type: hard
        reason: "(implementation batch 6)"
      - id: WF-47
        type: hard
        reason: "(implementation batch 6)"

  - id: EXPORT-JSON
    description: "Export live JSON for the 15 touched workflows from n8n to /workflows/<n8n-id>.json. Use bash+curl script (per CLAUDE.md token discipline — never use mcp__n8n__* for bulk export). Mandatory secrets scan: grep -rn 'AIzaSy\\|sk-\\|xoxb-\\|AKIA\\|?key=' workflows/ → must be empty. Map WF-XX → n8n ID from docs/workflow-registry.md"
    priority: P0
    status: pending
    batch: 7
    depends_on:
      - id: VERIFY-ALL
        type: hard
        reason: "Export only after verification confirms alignment — don't export drifted JSON"

  - id: REGEN-MD
    description: "Regenerate docs/pseudocode/WF-XX.md for the 15 touched WFs only. Script reads workflows/<id>.json and emits markdown matching existing format (header: # WF-XX <Name>; metadata: ID/Active/Nodes count; per-node section: ### <name>, type, parameters JSON block). Use jq for JSON extraction. Pseudocode .pseudo files NOT touched"
    priority: P0
    status: pending
    batch: 7
    depends_on:
      - id: EXPORT-JSON
        type: hard
        reason: "Regen reads the freshly-exported JSON files"

  - id: GIT-PUSH
    description: "Clone github.com/prasadmujumdar19/chinmay-astro to /tmp/claude-scratch/, copy: workflows/*.json (15 touched), docs/pseudocode/*.md (15 touched), .methodology/sprint-p0-coverage-report-2026-05-17-*.md, .methodology/handoff-p0-live-workflow-sync-complete.md. Run secrets scan one more time. Commit with concise message; push to main. Clean up /tmp/claude-scratch/. Per CLAUDE.md git workflow"
    priority: P0
    status: pending
    batch: 7
    depends_on:
      - id: REGEN-MD
        type: hard
        reason: "Final batch step — both JSON and MD must exist before commit"

batches_summary:
  - batch: 1
    name: "Foundations (sub-workflows others depend on)"
    items: [WF-60, WF-52, WF-50]
    estimated_cost: "~45K tokens (3 × Structural)"
  - batch: 2
    name: "Onboarding entry path"
    items: [WF-21, WF-01, WF-22]
    estimated_cost: "~45K tokens (3 × Structural)"
  - batch: 3
    name: "Entry + state routing"
    items: [WF-00, WF-02]
    estimated_cost: "~30K tokens (2 × Structural)"
  - batch: 4
    name: "Admin command dispatch (WF-10/WF-11 coupled)"
    items: [WF-10, WF-11]
    estimated_cost: "~30K tokens (2 × Structural)"
  - batch: 5
    name: "Slack-relay refactor (WF-33/WF-34 siblings)"
    items: [WF-33, WF-34]
    estimated_cost: "~30K tokens (2 × Structural)"
  - batch: 6
    name: "Consult + cleanup paths"
    items: [WF-40, WF-42, WF-47]
    estimated_cost: "~30K tokens (3 × Surgical-Structural; WF-47 is simple removal)"
  - batch: 7
    name: "Verification, export, docs, commit"
    items: [VERIFY-ALL, EXPORT-JSON, REGEN-MD, GIT-PUSH]
    estimated_cost: "~25K tokens (1 Surgical-Batch verify + 3 Documentation)"

total_items: 19
total_implementation: 15
total_wrapper: 4
total_batches: 7

n8n_id_mapping_reference: docs/workflow-registry.md
pseudocode_reference_dir: docs/pseudocode/
workflows_export_dir: workflows/
md_output_dir: docs/pseudocode/
