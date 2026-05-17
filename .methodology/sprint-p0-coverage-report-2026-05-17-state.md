slug: p0-coverage-report-2026-05-17
input_source: docs/superpowers/reports/P0_Coverage_Report_2026-05-17.md
input_hash: 23448634cd16f290cacd6d385ad28337f4757c1783d10a3dc4592b2a4305cfda
source_file_update: false
working_copy_path: .methodology/sprint-p0-coverage-report-2026-05-17-working.md
planned_at: 2026-05-17T03:09:27Z
last_updated: 2026-05-17T17:00:00Z
planning_complete: true
sprint_complete: true
sprint_closed_at: 2026-05-17T17:00:00Z
sprint_final_commit: 2f2f332

batch_7_execution_plan:
  assessed_at: 2026-05-17T16:40:00Z
  reason: "Batch has 4 items mixing change types (verify, export, doc regen, git push) → Step 2a required"
  modes:
    VERIFY-ALL: "Mode C combined with EXPORT-JSON — single bash+curl loop fetches 15 WFs to disk, then jq+lint verify from disk. Avoids fetching twice; honors CLAUDE.md token rule (no MCP for bulk)."
    EXPORT-JSON: "Mode C combined with VERIFY-ALL — see above. Includes cleanup of stray 0-byte file in workflows/ with mashed-name."
    REGEN-MD: "Mode B inline-inherit — bash+jq script regenerates 15 .md files from workflows/<id>.json. Deterministic transform; .pseudo files immutable."
    GIT-PUSH: "Mode A full wrapper — standard project clone+copy+secrets-scan+commit+push procedure per CLAUDE.md. False-positive filter for state-file grep literals (per handoff)."
  subagents_dispatched: "None — last-session WF-47 incident makes Mode D unsuitable for any item in this batch."

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
    status: done  # completed 2026-05-17T15:01Z (main thread, build-workflow Step 5e)
    notes: "Step 5e jq-transform + curl PUT. Replaced 2 direct Slack nodes (Notify Admin in Channel + Notify Admin Wrong State) with Call WF-51 executeWorkflow nodes (workflowId='wlZRK0YxnhP0b2RL', tv=1.3, defineBelow with channelId + messageText). Pseudocode Step 11 success-message: text formatted with newlines, '+phone_number' prefix, CLOSE CHAT CONSULT alias. Pseudocode Step 13 wrong-state message: switched from $json.wa_id to '+' + $json.phone_number (Section B autonomous fix). Bonus cleanup: normalized Call WF-50 Notify User workflowId from __rl object to plain string AND switched workflowInputs.mappingMode from passthrough to defineBelow with explicit camelCase fields (phoneNumber, messageType, templateName, templateParams) from upstream Prepare User Activation Message. Connections rewired: Call WF-50 Notify User → Call WF-51 Notify Admin in Channel; User in Correct State? FALSE → Call WF-51 Notify Admin Wrong State. Lint: pass. 0 errors. SQL queries already had chinmay_astro. schema prefix (Section B autonomous fix already live)."
    batch: 5
    depends_on: []  # WF-51 is unchanged — already available

  - id: WF-34
    description: "Add payment_submitted state guard mirroring WF-33 (Step 4); add user-not-found error path; refactor admin Slack confirmation post to use WF-51 instead of direct Slack node; change retry button title to 'Payment Completed ✓'"
    priority: P0
    status: done  # completed 2026-05-17T15:10Z (main thread, build-workflow Step 5e, clean in 1 PUT)
    notes: "Step 5e jq-transform + curl PUT — clean in ONE pass (pre-scanned lint debt during 5e.1). Original 7-node linear flow grew to 11 nodes with 2 new IF guards (User Found? + User in Correct State?) and 3 new Call WF-51 executeWorkflow nodes (Notify Admin User Not Found, Notify Admin Wrong State, Notify Admin Rejected). Old direct Slack 'Send a message' replaced by Call WF-51 Notify Admin Rejected — also fixed text drift: was hardcoded to chinmay-admin-commands channel without Reason field; now routes to user.slack_channel_id with full pseudocode Step 9 text ('Reason: <rejectionReason or Payment not verified>'). Prepare Rejection Message jsCode updated: button title 'Payment Completed ✓' (was 'Payment Completed'); UPI text rewritten to pseudocode Step 7 (+91-9653240263 / Chinmay Mujumdar). Bonus cleanup: normalized Call WF-50 WhatsApp Sender workflowId from __rl object to plain string AND populated empty defineBelow with explicit camelCase fields (phoneNumber, messageType, interactivePayload) from upstream Prepare Rejection Message. Connections rebuilt: Load → User Found? (TRUE→User in Correct State? TRUE→Update Payment Record→Reset User Status→Prepare Rejection→Call WF-50→Call WF-51 Notify Admin Rejected; FALSE branches → respective WF-51 error nodes). Lint: pass. SQL queries already had chinmay_astro. schema prefix (Section B autonomous fix already live)."
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
    status: done  # completed 2026-05-17T16:05Z (subagent ab6d8b11ae47bc062, MCP partial-update fallback due to subagent Bash sandbox; verified 4 nodes, lint pass)
    notes: "3 nodes removed (Is STOP Intercept, Prepare J-19 Response, Call WF-50 J-19 STOP Response). 2 nodes updated (Call WF-51 workflowId __rl→plain string; Load User Record alwaysOutputData:true). 1 new connection (When Executed → Load User Record direct). Final flow: When Executed → Load User Record → Format Slack Message → Call WF-51. SQL already had chinmay_astro. prefix. Sandbox issue forced fallback from Step 5e curl PUT to mcp__n8n__n8n_update_partial_workflow (6 ops in one PUT — preserves Step 5e single-lint-pass spirit). Pre-change backup at /tmp/claude-scratch/wf-du32QBZbSQOjfESe-pre.json (subagent could not write archive/backups/)."
    batch: 6
    depends_on: []

  - id: WF-42
    description: "Add user-not-found error path (load fails → Slack warning to admin channelName, no state change). Post error to admin's channelName (NOT user.slack_channel_id). Verify state guard: user.status = consultation_active before update. Verify NO archive of Slack channel (Design Rule #10 — channels preserved for REBOOK reuse). Two-button message (Leave Feedback, Book Again) — no 3rd button"
    priority: P0
    status: done  # completed 2026-05-17T16:15Z (subagent a16ffea5e6571bbc5, MCP full-update fallback due to subagent Bash sandbox; verified 11 nodes, lint pass)
    notes: "2 new nodes added: User Found? (IF tv=2, checks $json.phone_number notEmpty) + Notify Admin User Not Found (Slack tv=2.3, posts to channelName from input). Notify Admin Wrong State: channelId mode id→name (now uses channelName from input), text wa_id→phone_number per pseudocode Step 12. Lint cleanup: Call WF-50 Send Feedback workflowId __rl→plain string. Connections rewired: Load User by Phone → User Found? → (T) User in Correct State? / (F) Notify Admin User Not Found. Two-button feedback message + no archive node already correct (verified only). Followups: Notify Admin Wrong State uses slackOAuth2Api cred (others use slackApi); tv=2.2 vs 2.3 inconsistency."
    batch: 6
    depends_on: []

  - id: WF-47
    description: "Remove channel archive call (Steps 7-8 in pseudocode terms); status → opted_out + admin_actions log (action_type='opted_out', notes) + opt-out message via WF-50. Verify schema prefix chinmay_astro. on users + admin_actions queries"
    priority: P0
    status: done  # completed 2026-05-17T16:25Z (main thread corrective PUT after side-session subagent applied wrong fix; verified 6 nodes correct, opt-out chain intact)
    notes: "INCIDENT: subagent a7c47079d080ef014 hit Bash sandbox + reported BLOCKED. Side session authorized MCP fallback + dispatched replacement subagent which REMOVED THE WRONG NODE (deleted Send Opt-out Confirmation via WF-50 instead of Archive Slack Channel, leaving the DR-10-violating archive node active). Main thread detected this on post-batch structure fetch and applied corrective mcp__n8n__n8n_update_full_workflow to: restore Send Opt-out Confirmation via WF-50 from pre-state JSON, remove Archive Slack Channel + Get User Slack Channel, rewire Log to admin_actions → Send Opt-out Confirmation (END). Final 6 nodes match pseudocode Steps 1-7 exactly. Schema prefix chinmay_astro. on both queries already correct (Update User Status, Log to admin_actions). NEW MEMORY: feedback_sprint_parallelism.md strengthened — push back on subagent override requests for build-sprint workflow edits."
    batch: 6
    depends_on: []

  # ============================================================
  # BATCH 7 — Verification, export, docs, commit (wrapper)
  # ============================================================

  - id: VERIFY-ALL
    description: "Per-WF pseudocode↔JSON re-comparison for all 15 touched workflows. For each WF: fetch live JSON via mcp__n8n__n8n_get_workflow, compare nodes/parameters against .pseudo file algorithm; any drift becomes a fix-and-re-export cycle. Output: alignment report listing PASS/DRIFT for each of the 15. DRIFT items require return to that WF's batch and re-fix"
    priority: P0
    status: done  # completed 2026-05-17T16:50Z (Mode C combined with EXPORT-JSON)
    notes: "All 15 PASS. Verified via per-WF jq-on-disk drift checks + n8n .issues lint (0 issues across all 15). Drift checks confirm sprint-state notes for each WF: WF-00 (calls WF-60), WF-01 (passes wasOptedOut), WF-02 (UNHANDLED + payment_pending guard), WF-10 (DR-13 categorisation), WF-11 (CLOSE aliases), WF-21 (Welcome back), WF-22 (✓ glyph + ON CONFLICT + xmax), WF-33 (calls WF-51), WF-34 (User Found + User in Correct State + WF-51 routes), WF-40 (exactly 4 nodes), WF-42 (User Found + no Archive), WF-47 (exactly 6 nodes + no Archive), WF-50 (empty_body_dropped + interactivePayload), WF-52 (isNew), WF-60 (Filter Skip honors upstream skip flag — TD-030/TD-034 detection lives in WF-00 Parse code, correct division of responsibility per pseudocode). Mandatory secrets scan on workflows/*.json: 0 hits."
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
    status: done  # completed 2026-05-17T16:50Z (Mode C combined with VERIFY-ALL)
    notes: "15/15 exported successfully via bash+curl loop to workflows/<id>.json (sizes 6KB-43KB). Stray 0-byte file with mashed-together name removed before export. Secrets scan: 0 hits (clean)."
    batch: 7
    depends_on:
      - id: VERIFY-ALL
        type: hard
        reason: "Export only after verification confirms alignment — don't export drifted JSON"

  - id: REGEN-MD
    description: "Regenerate docs/pseudocode/WF-XX.md for the 15 touched WFs only. Script reads workflows/<id>.json and emits markdown matching existing format (header: # WF-XX <Name>; metadata: ID/Active/Nodes count; per-node section: ### <name>, type, parameters JSON block). Use jq for JSON extraction. Pseudocode .pseudo files NOT touched"
    priority: P0
    status: done  # completed 2026-05-17T16:55Z (Mode B inline-inherit)
    notes: "15/15 regenerated via bash+jq script (/tmp/claude-scratch/regen-md.sh). Output sizes 40-192 lines per WF. Format matches existing WF-00.md template (header + metadata + ## Nodes + per-node alphabetically sorted with type/typeVersion/parameters JSON block). Pseudocode .pseudo files untouched (timestamps confirm — last touched 12:30-12:40 during sprint authoring, .md regenerated at 16:16)."
    batch: 7
    depends_on:
      - id: EXPORT-JSON
        type: hard
        reason: "Regen reads the freshly-exported JSON files"

  - id: GIT-PUSH
    description: "Clone github.com/prasadmujumdar19/chinmay-astro to /tmp/claude-scratch/, copy: workflows/*.json (15 touched), docs/pseudocode/*.md (15 touched), .methodology/sprint-p0-coverage-report-2026-05-17-*.md, .methodology/handoff-p0-live-workflow-sync-complete.md. Run secrets scan one more time. Commit with concise message; push to main. Clean up /tmp/claude-scratch/. Per CLAUDE.md git workflow"
    priority: P0
    status: done  # completed 2026-05-17T17:00Z (Mode A full wrapper, user-approved push)
    notes: "Commit 2f2f332 on prasadmujumdar19/chinmay-astro main (e077984..2f2f332). 31 files changed (15 workflow JSONs + 15 pseudocode .md + 1 sprint-state), 284 insertions / 392 deletions. Secrets scan clean on workflows/ docs/pseudocode/ .methodology/ (false-positive filter applied to state file grep literals). Clone + scratch cleaned up. Note: followups.md was unchanged this session so not in the commit. Handoff for this sprint is the next-action item (separate from this commit per skill Step 5)."
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

# ============================================================
# POST-SPRINT FOLLOWUP EXECUTION — added 2026-05-17 (after sprint close)
# ============================================================
# Sprint was closed at commit 2f2f332. User reviewed the followups file
# and directed action on items below. This block records the execution
# plan and final status. The sprint itself remains closed; these items
# are tracked here for audit continuity.

followup_execution:
  started_at: 2026-05-17T17:30:00Z
  closed_at: 2026-05-17T18:30:00Z
  source: .methodology/sprint-p0-coverage-report-2026-05-17-followups.md
  assessed_at: 2026-05-17T17:30:00Z
  assess_rationale: "4 items mixing change types (structural-rewrite, surgical-SQL, structural-removal, project-wide normalization) — Step 2a required (≥3 items, mixed)"
  outcome: "All 4 planned items done. FU-4 sweep surfaced 11 additional pre-existing lint debt items across 6 WFs (3 categories: typeVersion=1 with workflowInputs, SELECT lacking alwaysOutputData, passthrough mapping) — logged as new followups, NOT addressed (out of FU-4 scope)."
  workflows_modified: [UV62An60fzflU0uD, hYGNM97sXvdo1WmI, dr8QM0m92Ml8MvIh, 3va0M06kijgyLejf, 6PzJRZsF7k2d9hV7, Du2CJ3OTohRFZYoA, emUOLWVZiNVxcOe3, eTV1lUcYrXBg2q2T, gGJBY5fJha0Let8I, HB8nXudAtk9iXz7C, LgIDj1v4ZbCPlX25, MUG7rPgSHc7UtAE9, RjwHs9Dx5cK8Q5wD, VpCER0Vqq3NYJGpI]
  workflows_modified_count: 14
  new_followups_logged: 11
  execution_modes:
    fu-1-wf46-dr10: "Mode A — full build-workflow Skill, Step 5e regenerate-by-copy. 3+ node mods + connection rewiring."
    fu-2-wf01-load-user-cols: "Mode B inline-inherit — single Postgres node query string update."
    fu-3-wf22-redundant-if: "Mode B inline-inherit — remove 1 IF, rewire to converged downstream."
    fu-4-project-rl-norm: "Mode C Batch Surgical — same jq transform across 16 __rl + 3 continueOnFail WFs; single transform script, per-WF PUT, single commit."
  subagents_dispatched: "None — feedback_sprint_parallelism strongly directs inline; no item meets all 4 Mode D caveats."
  items:
    - id: fu-1-wf46-dr10
      description: "WF-46 DR-10 fix (remove Get User Slack Channel + Archive Slack Channel) + WF-51 alignment (refactor Send a message to call WF-51)"
      status: done
    - id: fu-2-wf01-load-user-cols
      description: "Expand WF-01 Load User SELECT to include all 13 missing columns from pseudocode Step 11"
      status: done
    - id: fu-3-wf22-redundant-if
      description: "Remove WF-22 redundant User Created? IF node (both branches converge to Ensure Slack Channel Exists)"
      status: done
    - id: fu-4-project-rl-norm
      description: "Project-wide normalization: __rl workflowId objects → string (16 WFs); continueOnFail:true → onError:continueRegularOutput (3 WFs)"
      status: done
  closed_items:
    - id: fu-closed-code-node-shape
      reason: "Per-user decision (2026-05-17): ignore/close. WF-50/60 sub-utility Code nodes returning single objects auto-wrap in n8n v2; production-stable for months."
