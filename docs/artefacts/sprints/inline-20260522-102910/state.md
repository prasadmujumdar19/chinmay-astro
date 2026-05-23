slug: inline-20260522-102910
input_source: inline-20260522-102910
source_file_update: false
working_copy_path: docs/artefacts/sprints/inline-20260522-102910/working.md
planned_at: 2026-05-22T10:29:10Z
last_updated: 2026-05-23T07:19:00Z
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
    status: done
    started_at: 2026-05-23T00:58:20Z
    completed_at: 2026-05-23T07:19:00Z
    completion_note: |
      Done in three phases:
      (1) WF-10 centralized validation gate landed 2026-05-23T02:30:47Z (28 → 38 nodes, fresh-rebuild via Python script, single PUT, lint clean). Owns user-exists + phone-match + state-precondition checks for every user-targeted admin command + relay path; admin-wide commands also classified. Pseudo revised first.
      (2) WF-11 systemic gut of duplicate parser + canonical-field rename (23 → 18 nodes; 2026-05-23 commits `91c0975` v1, plus v2 patch + BUG-05 CLOSE sibling fix `2eb46c2` + BUG-07 UNBLOCK channelId fix `e7b0d78`).
      (3) Task #3 downstream trust-mode cleanups landed 2026-05-23T07:13:30Z–07:17:58Z:
        - WF-33 (NcHZedq9ycnAQ9SW): 14 → 11 nodes. Removed `User in Correct State?` + Prepare/Call WF-51 (Wrong State). Backup `archive/backups/NcHZedq9ycnAQ9SW-2026-05-23-17-12.json`.
        - WF-34 (se82n3MUQ9xE5aEr): 14 → 8 nodes. Removed `User Found?` + `User in Correct State?` + 4 prepare/call pairs (Not Found + Wrong State). Backup `archive/backups/se82n3MUQ9xE5aEr-2026-05-23-17-15.json`.
        - WF-42 (fx70vqyJtRdF2DgR): 14 → 8 nodes. Same shape as WF-34. Success-path keepers (`Notify Admin in Slack`, `Prepare WF-51 Payload (Notify Admin Closed)`) intact. Backup `archive/backups/fx70vqyJtRdF2DgR-2026-05-23-17-17.json`.
      All 3 cleanups via Step 5e jq-on-disk pattern. Each: backup → pre-flight lint scan (clean) → Step 2a dangling scan (clean) → jq transform → curl PUT → lint hook (rc=0) → Step 6a post-PUT dangling re-scan (clean) → export. Pseudos for all 3 already declared the IFs removed pre-implementation (no pseudo change needed).
      Smoke test: 10-phase `docs/artefacts/tests/smoke-wf10-centralized-gate-2026-05-23/session.md` passed before Task #3 ran; 3 smoke-driven bugs fixed mid-test (BUG-05/06/07). Task #3's structural change does not require re-smoke because the removed nodes are guaranteed unreachable under WF-10's gate (Phone Match? + State Match? returning FALSE never routes to these workflows).
      Resolves TD-021 (WF-33), TD-022 (WF-42), TD-023 (WF-10 relay status check).
    implementation_note: |
      2026-05-23T02:30:47Z — WF-10 centralized validation gate landed (live JSON updated). Implementation phase only; downstream cleanups (WF-11/33/34/42) + smoke test deferred to next session per user-scoped session boundary.
        - WF-10 (wMh0oBRtJbvhLgOf): 28 → 38 nodes. Backup: archive/backups/wMh0oBRtJbvhLgOf-2026-05-23-12-14.json. versionId: f9a50569-cfbb-40e3-968d-51bbe3376fa5.
        - Build approach: fresh-rebuild (Python script wrote full target nodes+connections; copied 19 keeper nodes verbatim by name from live JSON preserving id/position/credentials/webhookId 27a3efa5-…-bd42; spliced in 19 new nodes). Single PUT, single lint pass. Pre-flight + post-PUT lint scans both clean (exec canonical 1.2, postgres = prefix, alwaysOutputData, no deprecated continueOnFail). Step 6a dangling-name re-scan clean for all 9 dropped node names. All 26 connection sources + 37 connection targets resolve to live nodes.
        - typeVersion discipline: code v2, set v3.4, switch v3.3, if v2.2, exec v1.2 — all new nodes matched live typeVersions for that .type, no auto-bumps. (Plugin improvement candidate (k) captured below.)
        - 9 nodes dropped: Detect Command - Admin/User Channel, Command - Admin/User Channel ?, User Consultation Active?, Build Admin Feedback, Build Wrong Channel Warning, Call WF-51 (Inactive User Feedback), Call WF-51 (Wrong Channel Warning).
        - 19 nodes added: Classify Admin Channel Message + Classify User Channel Message (Code v2 — compute kind/commandKeyword/typedPhone/channelDerivedPhone/phoneStatus/expectedState); Route by Kind (Admin) + Route by Kind (User) (Switch v3.3); Phone Match? (Switch v3.3, 3 outputs: valid/absent/mismatch); State Match? (IF v2.2 — expectedState=='*' OR loadedStatus==expectedState); Dispatch by Kind (Switch v3.3); 6 Build-Alert Set v3.4 + 6 Call-WF-51 executeWorkflow v1.2 chains (Wrong-Channel Admin, Help Prompt, Wrong-Channel User, Phone Absent, Phone Mismatch, Wrong State). All alert Set nodes intentionally produce {channelId, messageText} contract (includeOtherFields=false — correct per SP-11 LESSON LEARNED).
        - 2 keeper expression patches: Build Orphan Channel Alert + Build WF-41 Payload — rewired `$('Detect Command - User Channel')` → `$('Classify User Channel Message')`.
        - All Slack messages use business language per [[feedback_admin_message_tone]] — no WF-XX names, "customer" not "user", etc.
        - WF-10.md regenerated post-PUT (live_updated_at 2026-05-23T02:30:47.988Z; assert-md-fresh.sh confirms FRESH).
        - Workflow-registry.md WF-10 row updated with SP-03 entry.
      **Pending (next session):**
        1. Smoke test 9+ scenarios on test phone +61491370732 (admin LIST/HELP, APPROVE/REJECT/CLOSE/BLOCK/UNBLOCK happy + failure paths, relay text happy + wrong-state, orphan re-verify, admin-wide in user channel, user-targeted in admin channel).
        2. Downstream surgical-structural cleanups (4 separate small PUTs — remove now-redundant guards): WF-33 (remove `User in Correct State?` + Prepare/Call WF-51 Wrong State pair); WF-34 (remove `User Found?` + `User in Correct State?` + 4 prepare/call pairs); WF-42 (remove `User Found?` + `User in Correct State?` + 4 prepare/call pairs); WF-11 (remove `Blocked User Found?` + `No Blocked User Found` executeWorkflow). All four workflows then trust WF-10's upstream validation.
        3. After smoke + downstream pass: mark SP-03 done; mark TD-021 / TD-022 / TD-023 resolved in docs/Tech_Debts.md; run Batch 2 post-batch regression (rebuild dependency map, sibling-check); offer Batch 2 commit/push.
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
      (g) **Set v3.4 default drops upstream fields.** Any Set v3.4 node that DERIVES a field (adds to the upstream payload) MUST set `parameters.includeOtherFields=true` — default v3.4 behavior emits only assigned fields, dropping the rest. Set nodes that intentionally produce a new contract (e.g., {channelId, messageText} for WF-51's input shape) correctly leave it false. SP-11 surfaced this on User-Load Gate (chinmay-astro exec 1630, 2026-05-22): the gate emitted only {routing: "to_wf02"} → downstream Call WF-02 Rule Router received no phoneNumber/user/pendingUser → WF-02 misrouted to NEW_USER → WF-21 INSERT failed on null phone_number. Fixed by adding includeOtherFields=true. build-workflow Step 5f.5 (new) should document: "Set v3.4 derive-then-pass-through pattern requires includeOtherFields=true". This is methodology-level (per [[feedback_principle_placement]]), not project-specific.
      (h) **User-load gates.** When a workflow loads a user record by external key (phone, slack_channel_id, etc.) with alwaysOutputData=true, add an explicit user-found IF gate with admin-feedback on miss BEFORE downstream operations consume the row. Downstream operations should trust the load. Avoids per-consumer-workflow guard proliferation. (Validated by SP-11's design — same principle applied at WF-01 and WF-10. From handoff plugin improvement candidates.)
      (i) **Audit-vs-reality drift validation pattern.** Sprint items that prescribe blanket mechanical changes ("set X on N nodes") should be validated per-node against build-workflow Step 5a before mutation. SP-02 went from "set true on 10 nodes" → "9 nodes confirmed; option B IF-guard expansion correctly rejected after upstream-gating analysis". Matches `build-sprint` Step 3 audit-vs-reality drift principle.
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
    status: done
    started_at: 2026-05-22T22:19:17Z
    completed_at: 2026-05-22T22:58:46Z
    completion_note: |
      Structural change applied + lint clean + smoke tested on highest-risk paths.
      Test A (WF-01 happy path regression — recorded user normal text): exec 1635 SUCCESS — User-Load Gate emitted {routing: "to_wf02"} + all upstream fields preserved (phoneNumber, user, pendingUser, messageContentUpper); Anomaly Route? TRUE branch fired; reached Call WF-02 Rule Router; downstream WF-02 → WF-40 → WF-25 ran normally (the chinmay-admin-commands "garbage detected" alert seen during Test A2 came from WF-25's standard Gemini garbage classification on "Test 2 for SP-11", not SP-11 — expected behavior).
      Test E (WF-10 orphan branch — admin types in fresh consult-orphan-test channel): exec 1652 SUCCESS — Detect Command - User Channel emitted {channelId: C0B5N87PRDL, channelName: "consult-orphan-test"}; User Row Exists? FALSE branch fired ([0,1]); Build Orphan Channel Alert emitted correct {channelId: C0A5B0ZE81E, messageText: "⚠️ Orphaned consult channel..."}; Slack post landed in chinmay-admin-commands with exact text; existing FALSE-branch "Build Admin Feedback" correctly did NOT fire (semantics now tight).
      Tests B/C/D ALSO PASSED (in same session, with user's spare phone +61491370732):
      - Test D (anomaly_keyword — STOP from unrecorded phone): exec 1659 SUCCESS — routing='anomaly_keyword', hasUser=false, hasPendingUser=false, Anomaly Route? FALSE [0,1], Call WF-51 fired, WF-02 + WF-47 NOT called. Pre-onboarding-STOP edge confirmed eliminated at source.
      - Test D (anomaly_keyword — REBOOK variant): exec 1665 SUCCESS — same shape with messageContentUpper='REBOOK'. New business-language admin alert delivered to Slack chinmay-admin-commands.
      - Test B (new-user happy path — text from unrecorded phone): exec 1671 → WF-02 1672 → WF-21 1674 all SUCCESS. routing='to_wf02', user/pendingUser both null, Anomaly Route? TRUE [1,0], no admin alert, WF-21 inserted pending_users row.
      - Test C (anomaly_interactive — form submission after we DELETEd pending_users): exec 1681 SUCCESS — routing='anomaly_interactive', messageType='interactive', interactiveType='nfm_reply', Anomaly Route? FALSE [0,1], admin alert delivered with business-language text, WF-02 NOT called → users row NOT created (confirmed in DB).
      All 5 tests (A + B + C + D variants + E) green. SP-11 fully smoke-tested before commit.
    implementation_note: |
      2026-05-22T22:25:00Z: structural change applied + lint clean on both workflows. Smoke test pending.
      - WF-01 (hYGNM97sXvdo1WmI): 18 → 22 nodes. Added User-Load Gate (Set v3.4), Anomaly Route? (IF v2.2), Build Admin Anomaly Alert (Set v3.4), Call WF-51 (Admin Anomaly Alert) (executeWorkflow v1.2). Rewired Prepare User Data → User-Load Gate → Anomaly Route? (TRUE→Call WF-02 Rule Router, FALSE→Build Admin Anomaly Alert → Call WF-51). Pseudo Steps 12a-12c. Backup: archive/backups/hYGNM97sXvdo1WmI-2026-05-23-08-30.json.
      - WF-10 (wMh0oBRtJbvhLgOf): 25 → 28 nodes. Added User Row Exists? (IF v2.2), Build Orphan Channel Alert (Set v3.4), Call WF-51 (Orphan Channel Alert) (executeWorkflow v1.2). Rewired Load User Status → User Row Exists? (TRUE→User Consultation Active?, FALSE→Build Orphan Channel Alert → Call WF-51). Pseudo Steps 15a + 18a. Backup: archive/backups/wMh0oBRtJbvhLgOf-2026-05-23-08-30.json.
      - Pre-flight lint scan: both workflows clean (no exec_string_wid_at_v12, no exec_missing_canonical, no pg_missing_eq_prefix, no deprecated_continueOnFail).
      - Post-PUT lint hook: clean both.
      - LESSON LEARNED (2026-05-22T22:46:00Z, exec 1630 failure): n8n Set v3.4 by DEFAULT drops upstream fields and emits only the assigned ones. The User-Load Gate as initially PUT emitted only {routing: "to_wf02"}, dropping phoneNumber/user/pendingUser/messageContent/messageContentUpper. Downstream Call WF-02 Rule Router received only the routing field; WF-02 then routed to NEW_USER (since user + pendingUser were undefined) and called WF-21, which tried to INSERT into pending_users with null phone_number — DB constraint violation. Fix: set `parameters.includeOtherFields=true` on the Set node. PARAMETRIC fix (no pseudo change needed — the pseudo describes "(Set node) — classify...", not n8n-level options). Apply this Principle universally: any Set v3.4 node that DERIVES a field without rebuilding the payload from scratch MUST set includeOtherFields=true. Existing Build WF-41 Payload / Build Admin Feedback / Build Admin Anomaly Alert / Build Orphan Channel Alert nodes that intentionally produce a NEW contract (e.g., for WF-51 input) correctly leave it false (default).
      - Pseudo revisions: WF-01.pseudo (Outputs/Calls Sub-Workflows updated; Steps 12a/12b/12c inserted); WF-10.pseudo (Outputs/Calls Sub-Workflows updated; Step 15a inserted; Step 18a added).
      - Orphan-alert destination: chinmay-admin-commands (C0A5B0ZE81E) — user-confirmed design decision (orphan consult channel itself is degenerate by definition).
      - Workflow-registry.md updated with SP-11 entries on WF-01 and WF-10 rows.
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
    batch: 2
    depends_on:
      - id: SP-02
        type: soft
        reason: "SP-02 establishes the alwaysOutputData baseline so the new WF-01 gate has consistent postgres-node hygiene to build on. Also: WF-10 SP-01 already established the Set → WF-51 admin-feedback pattern this item extends."
followups_logged:
  - "TD-NEW-027 (post-MVP doc): Periodic pseudo↔live drift health-check infrastructure — maintenance-phase coverage broader than current build-sprint-bound hook."
  - "TD-NEW-028 (Tech_Debts.md): WF-51 Slack failure-path logging — wire On Error → WF-60 with slackApiOk:false; bundle into planned error-handling sprint."
  - "TD-NEW-030 (Tech_Debts.md): WhatsApp Flow form has no validation on Time-of-Birth / Place-of-Birth — MVP BLOCKER. Surfaced during SP-11 Test C. Full design notes in sprint followups.md and Tech_Debts.md."
  - "Admin-alert message-tone discipline: rewrote WF-01 Build Admin Anomaly Alert (anomaly_interactive + anomaly_keyword variants), WF-10 Build Orphan Channel Alert, and WF-02 Build UNHANDLED Alert (pre-existing — not from SP-11) into business language. Memory saved: [[feedback_admin_message_tone]]. SP-10 plugin update should add this as new principle (j)."
  - "n8n MCP updateNode limitation: dot-path with array index (e.g., parameters.assignments.assignments[1].value) silently no-ops without error. SP-10 plugin update should document this — for nested-array updates fall back to jq+PUT via Step 5e."
  - "SP-10 plugin improvement candidate (k) — Author-fresh vs mutate-in-place gate inside Step 5e. Surfaced during SP-03 WF-10 implementation (2026-05-23): the existing Step 5e text reads as 'jq mutation by name', which steers you toward chained renames+rewires even when 30%+ of nodes are turning over. Proposed Step 5e.3: if (renames + adds + removes) >= 30% of node count OR any rename touches a node referenced by `$('Name')` from >2 other nodes → author-fresh (write full target nodes+connections declaratively, jq-extract keepers from live by .name, splice). Author-fresh is O(target node count); rename-chain is O(renames × downstream-refs). Authored-fresh path for WF-10 (28→38) executed clean: zero dangling refs, lint clean, keeper id/position/credentials/webhookId preserved verbatim."
  - "SP-10 plugin improvement candidate (l) — Validation centralization at boundary entry points (from prior handoff, restated). Any entry-point workflow (webhook/inbound trigger) loading context records by external key should perform FULL validation (record existence + cross-identifier match + state-for-action) at the boundary so downstream workflows can run in trust-mode. Validated by SP-11 (WF-01) and SP-03 (WF-10). Pairs with principle (h) (user-load gates) as the generalized 'trust-after-gate' pattern."
  - "SP-10 plugin improvement candidate (m) — typeVersion floor rule for fresh-authored nodes. When `n8n_create_workflow` or any author-fresh pass introduces nodes not in the live JSON, default each new node's typeVersion to the highest typeVersion already present in the live workflow for that exact .type — do not auto-pick the n8n MCP's latest. Bumping creates two failure modes: (a) condition/parameter format mismatches that crash the UI (already lint-hooked for IF + executeWorkflow, not for Set/Switch/Code/Postgres); (b) silent runtime semantic drift (e.g., Set v3.4's includeOtherFields=false default surfaced as SP-11 LESSON LEARNED — a Set v3.3→v3.4 silent bump would re-trigger it). If project has no existing instance of that node type, ask user before picking a version. Add as Step 5e.1a in build-workflow."
notes: |
  Items are grouped into 4 batches:
  - Batch 1 — P1 critical-path fix (SP-01)
  - Batch 2 — P2 reliability sweeps (SP-02, SP-03)
  - Batch 3 — P3 doc/cleanup work (SP-04 through SP-09)
  - Batch 4 — Plugin update at sprint end (SP-10), incorporating lessons from earlier batches

  Batch 3 contains 6 items; mostly small doc rewrites. Within batch 3 the soft dependency (SP-08 prefers to follow SP-07) is the only ordering hint — the rest can be executed in any order. SP-09 (WF-12 purge) should be done last in batch 3 so the grep verification has the cleanest possible target set.

  Memory has been updated to record this session's meta-finding: "methodology-level principles (apply to any project built with this plugin) belong in plugin skills, not project CLAUDE.md or memory."
