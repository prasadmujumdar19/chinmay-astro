slug: inline-20260522-102910
input_source: inline-20260522-102910
source_file_update: false
working_copy_path: docs/artefacts/sprints/inline-20260522-102910/working.md
planned_at: 2026-05-22T10:29:10Z
last_updated: 2026-05-23T07:53:00Z
planning_complete: true
context: |
  Sprint scope was derived from a session-long interactive walk-through of the 2026-05-22 pseudo↔live drift report (6 flagged workflows: WF-12, WF-23, WF-41, WF-46, WF-51, WF-60). For each, we discussed whether pseudocode or live code should be treated as authoritative, given functional position in the user journey, history (e.g. TD-002 multi-transport rebuild, DR-10 channel-archival rule, deactivation history), and surrounding architectural concerns. Several items grew beyond their original audit-finding scope when surrounding investigation revealed systemic issues (passthrough vs defineBelow contract pattern; postgres `alwaysOutputData` hygiene; admin-action precondition feedback gaps; postgres unquoted-camelCase SQL alias lowercasing).
dependency_conflicts_found: []
priority_adjustments_confirmed: |
  Three items elevated above their drift-report priority because investigation revealed live functional issues, not just doc drift:
  - WF-10 + WF-41 redesign: P1 (was MINOR) — silent admin-feedback failure on inactive-user relay attempt
  - Admin-action precondition audit: P2 (new item) — symmetric gap across all admin commands
  - Postgres alwaysOutputData sweep: P2 (new item) — 10 nodes missing the flag, affecting reliability of UPDATE chains on missing rows
items:
  - id: SP-01
    description: WF-10 + WF-41 merged redesign — extend WF-10's Load User Status SELECT to include phone_number (drop unquoted camelCase aliases), set alwaysOutputData=true, add 'Build WF-41 Payload' Set node (phoneNumber from postgres, adminMessage from upstream Detect Command - User Channel) on TRUE branch, connect FALSE branch of User Consultation Active? to 'Build Admin Feedback' Set node → WF-51 with admin-channel message stating user not in consultation_active; in WF-41 remove Load User by Phone postgres node + Extract Phone from Channel Code node, simplify Prepare WhatsApp Message to read camelCase passthrough fields directly. Update WF-10.pseudo + WF-41.pseudo + workflow-registry entries. Smoke-test both branches.
    priority: P1
    status: done
    completed_at: 2026-05-22T12:02:00Z
    completion_note: |
      Pseudos revised first (WF-10.pseudo, WF-41.pseudo). WF-10: 22 → 25 nodes (added Build WF-41 Payload, Build Admin Feedback, Call WF-51 (Inactive User Feedback)); Load User Status SQL simplified to SELECT id,status,name,phone_number with single-param queryReplacement. WF-41: 5 → 3 nodes (removed Extract Phone from Channel + Load User by Phone; Prepare WhatsApp Message rewritten to read $json.phoneNumber/$json.adminMessage). Lint clean on both. Smoke test passed BOTH branches:
        - TRUE (consultation_active): execution 1615 — Build WF-41 Payload emitted {phoneNumber, adminMessage}, WF-41 exec 1616 produced correct WF-50 payload, WhatsApp delivered (operator confirmed).
        - FALSE (consultation_closed): execution 1623 — Build Admin Feedback emitted {channelId, messageText: "⚠️ User not in active consultation..."}, Call WF-51 (Inactive User Feedback) succeeded, Slack warning visible in consult channel (operator confirmed). WF-41 NOT called.
      User state reverted to consultation_active post-smoke. Backups: archive/backups/wMh0oBRtJbvhLgOf-2026-05-22-20-58.json, 6PzJRZsF7k2d9hV7-2026-05-22-20-58.json.
    batch: 1
    depends_on: []
  - id: SP-02
    description: |
      Postgres alwaysOutputData=true remediation across 9 active nodes (live audit corrected count from 10) — WF-21 (Insert Pending User), WF-22 (Save Slack Channel ID), WF-32 (Create Payment Record, Update User Status), WF-34 (Reset User Status to payment_pending), WF-44 (Save Feedback to DB), WF-45 (Set status=payment_pending), WF-47 (Update User Status to opted_out, Close Open Consultation). For each, set the flag and assess whether downstream node needs an additional IF guard for the now-non-empty empty-result row.
      AUDIT OUTCOME (2026-05-22): Per-node assessment against build-workflow Step 5a found 7 nodes are pure fire-and-forget (safe to set true with no further work). The two cases where downstream reads the postgres output (WF-32 Update User Status; WF-47 Update User Status to opted_out) were initially scoped for option B (IF guard + WF-51 admin feedback). User pushed back with the correct principle: upstream gating already validates user-existence (WF-02 routes PAYMENT_CONFIRM ⇔ user exists + payment_pending; WF-47's existing IF graph handles empty-`{}` via FALSE-branch bypass to WhatsApp opt-out). Per-node IF guards downstream are unnecessary. SP-02 reduces to 9 mechanical aod=true flag-flips, Batch Surgical (Step 5d). The technical-failure class (mid-flight postgres connection blip after upstream gates passed) is logged as a new TD entry for the planned error-handling sprint. The architectural improvement of explicit user-load gates at WF-01 + WF-10 is captured as new sprint item SP-11.
    priority: P2
    status: done
    started_at: 2026-05-22T13:18:00Z
    completed_at: 2026-05-23T07:53:00Z
    completion_note: |
      Batch Surgical (Step 5d) — 9 Postgres write nodes across 7 workflows set to alwaysOutputData=true via mcp__n8n__n8n_update_partial_workflow. All 7 workflows backed up to archive/backups/<uuid>-2026-05-23-07-50.json before mutation. Spot-check confirmed aod=true on sampled nodes in WF-32 (Create Payment Record, Update User Status) and WF-47 (Update User Status to opted_out, Close Open Consultation). All 7 workflows re-exported to workflows/<uuid>.json. Secrets scan clean.
      Side artifacts produced: (a) TD-NEW-029 added to docs/Tech_Debts.md P2 section — technical-failure class for postgres mid-flight halt, bundled into the planned error-handling sprint; (b) WF-47.pseudo Step 2 updated with one-paragraph clarification explaining why aod=true is safe under pre-onboarding-STOP without an IF guard (existing IF graph handles empty-`{}` via FALSE-branch bypass); (c) workflow-registry.md WIP section updated with SP-02 completion note.
      Audit-vs-reality drift handled correctly: SP-02 description's blanket "set true on 10 nodes" was validated per-node and reduced to 9 nodes (count discrepancy in the original audit), and the option-B IF-guard expansion proposed initially was correctly rejected in favor of the architecturally cleaner SP-11 (upstream user-load gates in WF-01 + WF-10).

      Committed and pushed to main at the Batch 2 SP-02 checkpoint (per build-sprint Step 4.6 proactive commit/push offer; user opted to commit standalone before pausing for SP-03 / SP-11 fresh-session start).
    batch: 2
    depends_on: []
  - id: SP-03
    description: Admin-action precondition audit + remediation — produce a coverage matrix for the user-targeted admin commands APPROVE PAYMENT, REJECT, CLOSE, BLOCK, UNBLOCK plus the text-relay path (WF-10 → WF-41). For each verify (a) user-exists check, (b) state-precondition check, (c) admin Slack feedback on either failure (no silent drops). TD-021 (WF-33 APPROVE state guard) and TD-022 (WF-42 CLOSE state guard) already exist — confirm they emit admin feedback, not silent drops. Remediate gaps found.
    priority: P2
    status: pending
    batch: 2
    depends_on:
      - id: SP-01
        type: soft
        reason: "Item 1 establishes the admin-feedback pattern (Set → WF-51 for inactive user) that this audit will replicate for other commands."
  - id: SP-04
    description: Silent-drop IF FALSE branch audit + remediation — superset of SP-03. Sweep all active workflows for IF nodes whose FALSE branch is disconnected when it represents an unhappy path. For each, decide whether to add graceful handling (admin Slack feedback, log entry, or explicit accept-as-noop) or leave as-is. Output a matrix; remediate where the unhappy path is meaningful.
    priority: P3
    status: pending
    batch: 3
    depends_on:
      - id: SP-03
        type: soft
        reason: "Admin-action audit (SP-03) covers the high-impact subset; this sweeps the remaining lower-impact IF FALSE drops."
  - id: SP-05
    description: WF-25 contract normalization to passthrough — convert all 6 WF-25 callers (WF-23, WF-30, WF-31, WF-40, WF-43, WF-44) from defineBelow+empty-schema mode to mappingMode=passthrough; remove the dead messageText/messageContent field-mappings; for WF-40, add a Set node before the WF-25 call to rename id → userId (replaces the inline mapping). Update WF-25.pseudo with authoritative Inputs declaration; update all caller pseudos to reflect passthrough. Update CLAUDE.md "n8n Expression Gotchas" if there's any project-specific note; primary documentation lives in the build-workflow plugin (see SP-10). Sweep the rest of the project for other defineBelow+schema:[] instances and normalize.
    priority: P3
    status: pending
    batch: 3
    depends_on: []
  - id: SP-06
    description: WF-46.pseudo rewrite — remove Steps 5–6 (slack_channel_id lookup + channel archive) which contradict DR-10; update Calls Sub-Workflows from "none" to "WF-51 (Send Slack Message)"; update Outputs (drop archival side-effect); add explicit Step describing the Build admin notification payload (Code node) → Call WF-51 chain; remove the "Contradicts CLAUDE.md Design Rule #10" self-flag note (no longer contradicts); remove the admin_actions note (table deprecated per TD-NEW-026); update caller reference from "WF-12 BLOCK handler" to "WF-11 (Command Parser, BLOCK keyword) and WF-25 (Intent Classifier, auto-block on malicious_abusive/inappropriate)".
    priority: P3
    status: pending
    batch: 3
    depends_on: []
  - id: SP-07
    description: WF-51.pseudo rewrite — Calls Sub-Workflows: WF-60 (Message Logger); Outputs: add "outbound message logged to chinmay_astro.messages via WF-60 (success path only)"; Notes block: drop the "NOT logged" claim, add "Logged via WF-60 per TD-002 multi-transport rebuild (2026-05-19); optional userId/consultationId inputs forwarded if caller provides, WF-60 falls back to slack_channel_id lookup otherwise"; Algorithm: insert Step 3 (Build WF-60 canonical payload — transport=slack, direction=outbound, extract ts from Slack response) and Step 4 (Call WF-60 with payload). Also update workflow-registry.md WF-60 caller list to add WF-10 (Slack inbound) and WF-51 (Slack outbound); update WF-51 registry entry to note the WF-60 call.
    priority: P3
    status: pending
    batch: 3
    depends_on: []
  - id: SP-08
    description: WF-60.pseudo rewrite to match post-TD-002 live design — update Inputs to include transport ('wa'|'slack'), slackChannelId, slackMessageTs, plus content aliases (messageContent/userMessage/content); update Outputs to reflect the 9-column INSERT schema including slack_message_ts; remove TD-030 from Filters list and add a note "TD-030 bot-echo guard intentionally lives at WF-00 — WhatsApp-only check at webhook entry; WF-10's 'Human Vs Bot Message?' IF guard handles Slack-inbound; WF-60 does not duplicate either"; keep TD-034 (whitespace) as-is; rewrite Step 2 to document canonical normalization (transport detection, default messageType per transport, lookup-key selection between phone vs slack_channel_id); rewrite Step 4 to reflect actual live multi-key SELECT; update Step 5 INSERT to 9 columns. Add note referencing TD-002 as the design baseline.
    priority: P3
    status: pending
    batch: 3
    depends_on:
      - id: SP-07
        type: soft
        reason: "Same TD-002 redesign affects both; consistent terminology useful if done together."
  - id: SP-09
    description: WF-12 (Admin → WhatsApp Relay) full purge — workflow is deactivated and orphaned, superseded by WF-41. Delete via n8n API; remove docs/pseudocode/WF-12.pseudo and WF-12.md; remove WF-12 row from docs/workflow-registry.md; grep the rest of docs/ and workflows/ for any remaining "WF-12" or "RjwHs9Dx5cK8Q5wD" references and either remove or update to point to WF-41 as the live equivalent.
    priority: P3
    status: pending
    batch: 3
    depends_on:
      - id: SP-06
        type: soft
        reason: "WF-46.pseudo currently references WF-12 in its caller note — confirm SP-06 fix removes that reference so the purge can grep cleanly with zero hits."
  - id: SP-10
    description: |
      Plugin update — n8n-whatsapp-methodology `build-workflow` skill — bundle methodology-level principles surfaced during this drift review. Done via the plugin's update-skill workflow (version bump + symlink + GitHub commit) per the established discipline; not direct cache edits. Principles to encode:
      (a) Postgres nodes must have alwaysOutputData=true. When 0 rows is a real possibility for the downstream path, also add an explicit IF guard with a graceful FALSE branch (admin Slack feedback for admin-initiated actions, log entry, or explicit accept-as-noop).
      (b) IF nodes whose FALSE branch represents an unhappy path on a critical workflow must connect to a graceful handler — never leave the FALSE branch disconnected silently.
      (c) executeWorkflow callers: use mappingMode=passthrough only. Refuse to write defineBelow + schema:[] (the misleading "looks like a contract but isn't" state). When a field rename is required, use a Set node before the executeWorkflow call, not inline mapping.
      (d) Postgres SQL aliases: use lowercase or snake_case (matches postgres default behavior), or quote them (preserves camelCase). Never use unquoted camelCase aliases — postgres silently lowercases them, creating field-name mismatches downstream.
      (e) Structural refactors that change a workflow's contract MUST include matching pseudo updates in the same change set. build-workflow should refuse to commit a structural change without the corresponding pseudo diff. (Note: maintenance-phase periodic enforcement is a separate concern tracked as TD-NEW-027 in post-MVP doc.)
      (f) Validate pseudo `Inputs:` declaration matches the fields the sub-workflow's first trigger/code nodes actually reference.
    priority: P3
    status: pending
    batch: 4
    depends_on:
      - id: SP-01
        type: soft
        reason: "Principles (a) and (c) are exemplified by SP-01's implementation; ordering ensures the plugin update captures lessons from real work."
      - id: SP-05
        type: soft
        reason: "Principle (c) demonstrated by SP-05's passthrough normalization."
  - id: SP-11
    description: |
      WF-01 + WF-10 user-load gates — make user-existence validation explicit at the load step rather than incidentally enforced by downstream routing.
      WF-01: After Steps 10–11 (Load Pending User + Load Full User) and Step 12 (Prepare User Data), add an explicit gate before Step 13 (Call WF-02). Cases:
        - user exists → continue → WF-02 (normal flow)
        - user null, pendingUser exists → continue → WF-02 (legitimate pre-form state; PRE_FORM_TEXT / DETAILS_FORM routes handle it)
        - user null, pendingUser null, messageType='text' → continue → WF-02 (legitimate new user; NEW_USER route → WF-21)
        - user null, pendingUser null, messageType='interactive' (button tap from unrecorded phone) → admin alert via WF-51 to chinmay-admin-commands (C0A5B0ZE81E). Do NOT call WF-02. Message: "⚠️ Anomalous interactive message from unrecorded phone +<phone>. Bot/spam interaction or DB row was deleted after we sent a button."
        - user null, pendingUser null, messageText matches STOP/REBOOK keyword → admin alert (same shape). Do NOT call WF-02 (eliminates the WF-47 pre-onboarding-STOP edge case at the source).
      WF-10: After Load User Status (simplified by SP-01), add an explicit gate before "User Consultation Active?" IF:
        - row returned, status='consultation_active' → existing TRUE branch
        - row returned, status ≠ 'consultation_active' → existing FALSE branch (Build Admin Feedback "not in consultation_active" → WF-51)
        - no row returned (orphaned channel — no users row maps to this slack_channel_id) → NEW branch — admin alert "⚠️ No user record for channel <id>. Orphaned channel?" Currently SP-01's FALSE branch misleadingly fires with "user not in consultation_active" when `.status` is actually undefined. The gate makes the distinction explicit.
      Pseudo-first per Step 5f.0 (Structural, non-parametric — alters control flow). Update WF-01.pseudo + WF-10.pseudo first, then implement.
    priority: P2
    status: pending
    batch: 2
    depends_on:
      - id: SP-02
        type: soft
        reason: "SP-02 establishes the alwaysOutputData baseline so the new WF-01 gate has consistent postgres-node hygiene to build on. Also: WF-10 SP-01 already established the Set → WF-51 admin-feedback pattern this item extends."
followups_logged:
  - "TD-NEW-027 (post-MVP doc): Periodic pseudo↔live drift health-check infrastructure — maintenance-phase coverage broader than current build-sprint-bound hook."
  - "TD-NEW-028 (Tech_Debts.md): WF-51 Slack failure-path logging — wire On Error → WF-60 with slackApiOk:false; bundle into planned error-handling sprint."
notes: |
  Items are grouped into 4 batches:
  - Batch 1 — P1 critical-path fix (SP-01)
  - Batch 2 — P2 reliability sweeps (SP-02, SP-03)
  - Batch 3 — P3 doc/cleanup work (SP-04 through SP-09)
  - Batch 4 — Plugin update at sprint end (SP-10), incorporating lessons from earlier batches

  Batch 3 contains 6 items; mostly small doc rewrites. Within batch 3 the soft dependency (SP-08 prefers to follow SP-07) is the only ordering hint — the rest can be executed in any order. SP-09 (WF-12 purge) should be done last in batch 3 so the grep verification has the cleanest possible target set.

  Memory has been updated to record this session's meta-finding: "methodology-level principles (apply to any project built with this plugin) belong in plugin skills, not project CLAUDE.md or memory."
