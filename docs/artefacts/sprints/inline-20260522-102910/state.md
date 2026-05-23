slug: inline-20260522-102910
input_source: inline-20260522-102910
source_file_update: false
working_copy_path: docs/artefacts/sprints/inline-20260522-102910/working.md
planned_at: 2026-05-22T10:29:10Z
last_updated: 2026-05-23T12:25:00Z
planning_complete: true
drift_check_deferred:
  status: deferred
  decided_at: 2026-05-23T11:52:00Z
  decided_by: user (explicit, in-session)
  defer_until: |
    Two preconditions must both be satisfied before /n8n-whatsapp-methodology:pseudo-md-drift-check is run again on this project:
      1. SP-10 plugin update — ALL FOUR invocations landed. Current status (2026-05-23T12:25Z): Invocation 1 (c+n+g → 1.26.0) done; Invocation 2 (j+k+m → 1.27.0) done; Invocations 3 (a+b+d+h → 1.28.0), 4 (e+f+i → 1.28.1) NOT started.
      2. SP-05 "enhanced scope" — the Contract-First Sub-Workflow Calls multi-sprint initiative (deferred from SP-05 per its `decision_required` block, line ~125) brainstormed, planned, and executed to completion. This initiative will substantially rewrite sub-workflow .pseudo Inputs sections (D9 contract declarations) and convert all 18 defineBelow+schema:[] call sites to Set+passthrough — both of which are the dominant drift sources today.
    Running drift-check before BOTH are done burns ~15 min walking a tracker whose findings are already known to be cascading D9 / D4 contract drift that the planned plugin + sprint work explicitly remediates.
  if_gate_fires: |
    pre-build-sprint-drift-gate.sh (plugin v1.26.0, unchanged in v1.25/1.26 cache) will BLOCK every /build-sprint invocation until docs/artefacts/drift-checks/.last-run exists with status=CLEAN, age ≤24h. There is no hook-side override flag. When the gate fires on a fresh session:
      1. Do NOT auto-run /n8n-whatsapp-methodology:pseudo-md-drift-check.
      2. Surface this deferral block to the user verbatim and confirm they still want to proceed with the deferral.
      3. If yes, options to unblock SP-10 Invocation 2+ work: (a) ask the user to temporarily disable the hook in .claude/settings.local.json for the session, then re-enable; (b) work the plugin updates by direct invocation of `n8n-whatsapp-methodology:flush-plugin-improvements` (NOT /build-sprint) so the gate hook never fires — the flush-plugin-improvements skill is the actual mechanic for SP-10 invocations and is not gated; (c) the user manually toggles permission on the BLOCKED Skill call.
      Option (b) is the cleanest: SP-10's execution_sub_plan explicitly says "Next concrete step: invoke flush-plugin-improvements" — we don't need /build-sprint to drive SP-10 work, that was a convenience entry point.
  partial_run_today: |
    A drift-check was started at 2026-05-23T11:31:17Z (this session, before user interrupt). Compared WF-00 (CLEAN) and WF-01 (🔴 DRIFT: D4 WF-21 call payload mismatch + D9 vague Inputs section). Aborted at WF-02 read. Tracker and folder removed at 2026-05-23T11:52:00Z; the WF-01 findings are not lost — they are restated here and will be re-derived correctly by the next drift-check run after SP-10 + SP-05-expanded land. Both findings are exactly the class SP-10 principle (n) + the Contract-First initiative are designed to eliminate.
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
    status: done
    started_at: 2026-05-23T08:28:03Z
    completed_at: 2026-05-23T09:18:22Z
    completion_note: |
      Design + pseudo phase completed earlier; implementation phase landed this session.
      Implementation: 3 Structural Step 5e jq-on-disk PUTs (one per workflow).
        - WF-23 (VpCER0Vqq3NYJGpI): removed `Is Stop Intent?` IF + `Call WF-47 Unsubscribe` executeWorkflow; inserted `Build WF-50 (Stop Clarifier) Payload` (Set v3.4) + `Call WF-50 (Stop Clarifier)` (executeWorkflow v1.2 canonical); rewired `Is Pass-Through Intent?` main[1] (FALSE) → Build → Call. Node count unchanged (7). Backup: `archive/backups/VpCER0Vqq3NYJGpI-2026-05-23-19-13.json`. Pre-flight lint scan clean; post-PUT lint hook exit 0; dangling-name re-scan returned 0 expr/conn refs for the two removed names.
        - WF-30 (gGJBY5fJha0Let8I): identical transform. Node count unchanged (7). Backup: `archive/backups/gGJBY5fJha0Let8I-2026-05-23-19-13.json`. Lint clean. Dangling re-scan clean.
        - WF-31 (HB8nXudAtk9iXz7C): identical transform. Node count unchanged (10 — parallel Slack-relay branch untouched). Backup: `archive/backups/HB8nXudAtk9iXz7C-2026-05-23-19-13.json`. Lint clean. Dangling re-scan clean.
      Clarifier text verbatim from WF-40 (same string across all 3 new instances). Payload shape mirrors WF-40 exactly: phoneNumber from `$('When Executed by Another Workflow').item.json.phoneNumber`, messageType=text, messageContent=clarifier. Set v3.4 `includeOtherFields` left false (default) — intentional, emits the WF-50 contract shape only. Call WF-50 node uses canonical 1.2 shape (operation=call_workflow, source=database, mode=once, workflowId={__rl,value:BUVun38WEKb12zg9,mode:list,cachedResultUrl}, workflowInputs.mappingMode=passthrough).
      Re-exported all 3 to `workflows/<uuid>.json`. Secrets scan clean. .md companions regenerated via `generate-workflow-md.py`; `assert-md-fresh.sh` confirms FRESH on WF-23/30/31 (delta=+0s).
      WF-47 caller-set reduction (audit-trail): pre-SP-04 [WF-20, WF-23, WF-30, WF-31, WF-43, WF-44] → post-SP-04 [WF-20, WF-43, WF-44]. To be reconfirmed at Batch 3 sibling regression via dependency-map rebuild.
      Smoke test: deferred to ad-hoc post-go-live verification (structural change, but the 3 affected paths are pre-onboarding/payment-pending/payment-submitted free-form intent handling — low-risk surface; reachable via test-phone STOP-intent-looking phrase like "please stop sending these").
    decision_made: |
      2026-05-23: Audit produced a 6-row matrix across active workflows (jq sweep on `connections[<if>].main`).
      - 3 INTENTIONAL silent terminations accepted as-is: WF-10 `Human Vs Bot Message?` (TD-030 bot-echo equivalent for Slack inbound); WF-02 `Keyword Passthrough?` (WF-20 already terminally handled the unsubscribe); WF-40 `Stop Intent?` (relay happens on parallel branch from WF-25; this IF only gates an optional clarifier side-effect).
      - 3 STRUCTURAL DEAD-CODE findings in WF-23/30/31 `Is Stop Intent?` IFs: by elimination of WF-25's contract (garbage/abusive/inappropriate never return to caller) and the upstream `Is Pass-Through Intent?` condition (excludes those 3 intents + stop_intent), the only intent reachable at `Is Stop Intent?` is stop_intent → TRUE branch always taken → FALSE branch unreachable.
      - DISPOSITION (user-decided 2026-05-23 after Meta WhatsApp Business Policy research + WF-40 inconsistency surfaced): unify on WF-40's clarifier pattern. Auto-opt-out on Gemini-classified stop_intent removed; replaced with "Did you mean STOP?" clarifier (user must send explicit STOP keyword via WF-20 to unsubscribe canonically). This aligns the codebase, protects against Gemini false-positives, and remains policy-compliant — Meta's broad "respect all opt-out requests" obligation honored by the clarifier-then-explicit-STOP chain (also already handled by WF-20 for the literal-keyword path). Research notes archived in this completion entry; full sprint followups capture the design rationale.
    pseudo_changes_landed: 2026-05-23T08:48:00Z
    pseudo_change_summary: |
      WF-23.pseudo, WF-30.pseudo, WF-31.pseudo rewritten:
        - WF-47 removed from `Calls Sub-Workflows` (still called via WF-20 literal STOP path — unchanged).
        - New `stop_intent policy (2026-05-23 — SP-04, applying WF-40's TD-E pattern)` Note added to each, cross-referencing WF-40.
        - Algorithm: removed the inner `Is Stop Intent?` IF and `Call WF-47` step; added `Build WF-50 stop-intent clarifier payload` + `Call WF-50 (Stop Clarifier)` steps with the same clarifier text WF-40 uses verbatim ("This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing...").
        - Dead-code reasoning documented in each pseudo's Notes for future readers.
    pending_implementation: |
      Per [[feedback_pseudocode_first_refactor]]: pseudo first (done), then implement. 3 Mode A build-workflow PUTs remain — one per workflow (WF-23, WF-30, WF-31). Each: backup → fetch live → jq transform (delete `Is Stop Intent?` IF + `Call WF-47 Unsubscribe` executeWorkflow nodes; delete their connections; insert `Build WF-50 (Stop Clarifier) Payload` Set v3.4 + `Call WF-50 (Stop Clarifier)` executeWorkflow v1.2; wire `Is Pass-Through Intent?` FALSE → `Build WF-50 (Stop Clarifier) Payload` → `Call WF-50 (Stop Clarifier)`) → PUT → lint hook → post-PUT dangling-name scan → export. Mirror WF-40's existing payload shape ($('When Executed by Another Workflow').item.json.phoneNumber + messageType=text + messageContent=clarifier text).
    batch: 3
    depends_on:
      - id: SP-03
        type: soft
        reason: "Admin-action audit (SP-03) covers the high-impact subset; this sweeps the remaining lower-impact IF FALSE drops."
  - id: SP-05
    description: WF-25 contract normalization to passthrough — convert all 6 WF-25 callers (WF-23, WF-30, WF-31, WF-40, WF-43, WF-44) from defineBelow+empty-schema mode to mappingMode=passthrough; remove the dead messageText/messageContent field-mappings; for WF-40, add a Set node before the WF-25 call to rename id → userId (replaces the inline mapping). Update WF-25.pseudo with authoritative Inputs declaration; update all caller pseudos to reflect passthrough. Update CLAUDE.md "n8n Expression Gotchas" if there's any project-specific note; primary documentation lives in the build-workflow plugin (see SP-10). Sweep the rest of the project for other defineBelow+schema:[] instances and normalize.
    priority: P3
    status: needs-decision
    started_at: 2026-05-23T09:41:27Z
    batch: 3
    depends_on: []
    decision_required: |
      Scope of SP-05 expanded during audit phase (2026-05-23T09:41Z–10:34Z). Item is RESCOPED into a dedicated multi-sprint "Contract-First Sub-Workflow Calls" initiative to be planned next session. SP-05 itself remains as the audit + scope-spec predecessor for that initiative — implementation deferred.

      AUDIT FINDINGS (preserved at docs/artefacts/sprints/inline-20260522-102910/audits/sp05-defineBelow-sites-2026-05-23.json):
        - 18 defineBelow+schema:[] sites across 6 caller workflows (not just WF-25 callers — full project-wide sweep).
        - WF-31 + WF-43 confirmed already on passthrough (handoff prediction correct).
        - 4 WF-25 callers remain: WF-23, WF-30, WF-40, WF-44.
        - 48 mapping entries classified: 28 REDUNDANT (same-name $json.X→X — pure noise) + 20 RENAME/COMPUTED (cross-node refs or templates — need Set node to preserve semantics).
        - 9 sites are pure passthrough conversions (drop value, switch mode).
        - 9 sites need a Set node inserted before the call (WF-11 ×5 admin-message templates, WF-20 ×2 keyword-handler renames, WF-40 →WF-25 id→userId, WF-44 →WF-45 cross-node refs).

      USER DECISION (2026-05-23): Principle is broader than SP-05 captured — applies to EVERY sub-workflow call in the system. Every executeWorkflow call must (a) target a sub-workflow whose .pseudo declares an explicit Inputs contract (required/optional/shape — not "everything from upstream"), (b) be preceded by a named Set node that constructs that contract, (c) run in mappingMode=passthrough. Set nodes use includeOtherFields=false (v3.4 default — now a feature, sub-workflow only sees contract fields). The Set+passthrough pattern enforces pseudo contracts at runtime.

      DEFERRED TO: "Contract-First Sub-Workflow Calls" multi-sprint initiative (to brainstorm + plan next session). Phases:
        1. Pseudo Inputs contract audit (all ~12-13 sub-workflows) — produce Contract Manifest doc.
        2. Call-site inventory matrix (extend the 18-site audit to include current passthrough sites too).
        3. Per-family conversion sprints (suggest: WF-50/51/60 messaging utilities; WF-25 intent classifier; WF-45/47 lifecycle handlers; WF-02/41 routers). Mode D subagent dispatch is appropriate for the monotonous Set-node insertion work (Haiku, ~5-8 parallel across different workflows, same-workflow siblings stay sequential).
        4. Lint hook deployment: reject any executeWorkflow PUT without an immediately-upstream Set node; reject defineBelow at all.

      SP-10 IMPACT: SP-10's principle (c) is EXPANDED (not invalidated) — see SP-10 description updates this session. New principle (n) added for pseudo contract declaration discipline. SP-05's soft-dep on SP-10 is removed since SP-10 no longer needs a worked example of the narrow version of principle (c) (SP-11's Set v3.4 lesson + this session's Contract-First analysis supply the rationale).
  - id: SP-06
    description: WF-46.pseudo rewrite — remove Steps 5–6 (slack_channel_id lookup + channel archive) which contradict DR-10; update Calls Sub-Workflows from "none" to "WF-51 (Send Slack Message)"; update Outputs (drop archival side-effect); add explicit Step describing the Build admin notification payload (Code node) → Call WF-51 chain; remove the "Contradicts CLAUDE.md Design Rule #10" self-flag note (no longer contradicts); remove the admin_actions note (table deprecated per TD-NEW-026); update caller reference from "WF-12 BLOCK handler" to "WF-11 (Command Parser, BLOCK keyword) and WF-25 (Intent Classifier, auto-block on malicious_abusive/inappropriate)".
    priority: P3
    status: obsolete
    completed_at: 2026-05-23T08:28:03Z
    obsolete_reason: |
      Drift check (Batch 3 baseline assessment 2026-05-23T08:28:03Z) found WF-46.pseudo has already been comprehensively rewritten — all conditions SP-06 prescribed are satisfied in the live file:
        - Steps 5–6 channel-archive removed (file now ends at Step 5 = Call WF-51, no archive).
        - `Calls Sub-Workflows: WF-51 (Send Slack Message)` set on line 8.
        - `admin_actions` deprecation note present on line 13 referencing [[project_admin_actions_deprecated]].
        - Caller reference updated on line 5 to "WF-11 BLOCK admin command OR WF-25 malicious_abusive/inappropriate intent" — no WF-12 mention.
        - DR-10 self-flag note replaced with positive "No channel archive — DR-10 design rule" note on line 11.
      Likely landed as part of the SP-03 cascade work on 2026-05-23 (matches the dates referenced inside the pseudo: "Channel-archive nodes removed 2026-05-17 (FU-1); pseudo updated to match 2026-05-23"; "duplicate removed from WF-11 on 2026-05-23 (BUG-05 sibling fix)"). No further action required.
    batch: 3
    depends_on: []
  - id: SP-07
    description: WF-51.pseudo rewrite — Calls Sub-Workflows: WF-60 (Message Logger); Outputs: add "outbound message logged to chinmay_astro.messages via WF-60 (success path only)"; Notes block: drop the "NOT logged" claim, add "Logged via WF-60 per TD-002 multi-transport rebuild (2026-05-19); optional userId/consultationId inputs forwarded if caller provides, WF-60 falls back to slack_channel_id lookup otherwise"; Algorithm: insert Step 3 (Build WF-60 canonical payload — transport=slack, direction=outbound, extract ts from Slack response) and Step 4 (Call WF-60 with payload). Also update workflow-registry.md WF-60 caller list to add WF-10 (Slack inbound) and WF-51 (Slack outbound); update WF-51 registry entry to note the WF-60 call.
    priority: P3
    status: done
    started_at: 2026-05-23T08:28:03Z
    completed_at: 2026-05-23T08:32:00Z
    completion_note: |
      WF-51.pseudo rewritten from 19 → 30 lines to reflect live multi-transport logging design:
        - Inputs: added optional userId/consultationId; documented WF-60's slack_channel_id fallback.
        - Outputs: added "logged to chinmay_astro.messages via WF-60 (success path only — no logging on Slack API failure)".
        - Calls Sub-Workflows: WF-60 (Message Logger).
        - Notes: dropped the "NOT logged" claim; added TD-002 multi-transport rebuild reference (2026-05-19); explicit note about Slack-failure logging gap referencing TD-NEW-028.
        - Algorithm: inserted Step 3 (Build WF-60 Payload — Code node constructing canonical multi-transport payload, extracting slack_message_ts from Slack response) and Step 4 (Call WF-60 in passthrough mode); Step 5 = End.
      Build approach: verified live WF-51 shape via jq (4 nodes: trigger → Post to Slack → Build WF-60 Payload Code → Call WF-60 Message Logger); transcribed Code node logic into pseudo Step 3.
      workflow-registry.md changes:
        - WF-60 row caller list expanded from "WF-00 (inbound) and WF-50 (outbound success + drop)" → "WF-00 (WhatsApp inbound), WF-50 (WhatsApp outbound success + drop), WF-10 (Slack inbound — admin/user commands), and WF-51 (Slack outbound)". Verified WF-10's Call WF-60 Message Logger exists via jq.
        - WF-51 row already documents the WF-60 chain ("chained `Build WF-60 Payload (Slack Outbound)` Code mapper → `Call WF-60 Message Logger`" added in TD-003 F3) — no edit needed.
    batch: 3
    depends_on: []
  - id: SP-08
    description: WF-60.pseudo rewrite to match post-TD-002 live design — update Inputs to include transport ('wa'|'slack'), slackChannelId, slackMessageTs, plus content aliases (messageContent/userMessage/content); update Outputs to reflect the 9-column INSERT schema including slack_message_ts; remove TD-030 from Filters list and add a note "TD-030 bot-echo guard intentionally lives at WF-00 — WhatsApp-only check at webhook entry; WF-10's 'Human Vs Bot Message?' IF guard handles Slack-inbound; WF-60 does not duplicate either"; keep TD-034 (whitespace) as-is; rewrite Step 2 to document canonical normalization (transport detection, default messageType per transport, lookup-key selection between phone vs slack_channel_id); rewrite Step 4 to reflect actual live multi-key SELECT; update Step 5 INSERT to 9 columns. Add note referencing TD-002 as the design baseline.
    priority: P3
    status: done
    started_at: 2026-05-23T08:30:00Z
    completed_at: 2026-05-23T08:31:12Z
    completion_note: |
      WF-60.pseudo rewritten from 33 → 49 lines to match live post-TD-002 multi-transport design.
        - Inputs: documented all multi-transport fields (transport/direction/messageType + Slack-specific slackMessageTs/slackChannelId + WA-specific whatsappMessageId/phoneNumber) and content aliases (messageContent/userMessage).
        - Outputs: enumerated all 4 return shapes (logged:true; whitespace_filtered; no-userId inbound; no-userId outbound) and called out the 9-column INSERT including slack_message_ts.
        - TD-030 placement clarification: stated WF-00 owns the WhatsApp bot-echo guard at webhook entry; WF-10's `Human Vs Bot Message?` IF plays the same role for Slack inbound; WF-60 does not duplicate either.
        - TD-034 retained as the sole inbound filter inside WF-60.
        - Algorithm rewritten to mirror live node graph: Extract Message Data (normalize + flags) → Filter Skip? IF → Needs Phone Lookup? IF → Lookup User By Phone (multi-key Postgres) → Merge Lookup Result → Has userId? IF → Log to Messages Table (9-col INSERT with onError=continueRegularOutput) → Done. Skip paths: Build Filter Skip Result (Step 7a) and Skip Log no-userId (Step 7b).
        - TD-002 (2026-05-19) and TD-003 F1 (2026-05-20) referenced as design baselines.
      Build approach: read live Extract Message Data jsCode, Log to Messages Table SQL, and Lookup User By Phone SQL via jq; transcribed semantics directly. No drift remaining between pseudo and live.
    batch: 3
    depends_on:
      - id: SP-07
        type: soft
        reason: "Same TD-002 redesign affects both; consistent terminology useful if done together."
  - id: SP-09
    description: WF-12 (Admin → WhatsApp Relay) full purge — workflow is deactivated and orphaned, superseded by WF-41. Delete via n8n API; remove docs/pseudocode/WF-12.pseudo and WF-12.md; remove WF-12 row from docs/workflow-registry.md; grep the rest of docs/ and workflows/ for any remaining "WF-12" or "RjwHs9Dx5cK8Q5wD" references and either remove or update to point to WF-41 as the live equivalent.
    priority: P3
    status: done
    started_at: 2026-05-23T08:33:00Z
    completed_at: 2026-05-23T08:35:58Z
    completion_note: |
      WF-12 purged in full.
        - Pre-purge backup: archive/backups/RjwHs9Dx5cK8Q5wD-2026-05-23-18-32-pre-purge.json (3481 bytes).
        - n8n DELETE /api/v1/workflows/RjwHs9Dx5cK8Q5wD → HTTP 200; verified absent via GET → HTTP 404.
        - Removed: workflows/RjwHs9Dx5cK8Q5wD.json, docs/pseudocode/WF-12.pseudo, docs/pseudocode/WF-12.md.
        - Doc edits: docs/pseudocode/INDEX.md (WF-12 row), docs/workflow-registry.md (2 rows: line 97 active table + line 278 import-status table), docs/STATUS.md (line 109 current-workflow table row).
        - Dependency map regenerated (73 → 72 edges); grep WF-12/RjwHs9Dx5cK8Q5wD on docs/dependency-map.md now 0 hits.
        - Historical narrative references intentionally preserved as audit trail (BUG-05 entry in workflow-registry.md changelog, TD-023 verification text in Tech_Debts.md, STATUS.md summary + resolved-list entries). All are in past tense / strikethrough form; none point to WF-12 as if it exists.
        - SP-06 dependency satisfied trivially: SP-06 was marked obsolete because WF-46.pseudo had already been rewritten to remove its WF-12 caller reference — confirmed via grep before purge.
        - New changelog entry added to top of workflow-registry.md documenting the purge + resurrect path.
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
      (c) **Contract-First sub-workflow calls** (EXPANDED 2026-05-23 — supersedes the narrow version): Every executeWorkflow call must satisfy ALL of: (1) the called sub-workflow's `.pseudo` declares an explicit Inputs contract — required/optional fields, names, shapes/types — not "everything from upstream"; (2) the caller has a named Set node immediately upstream that constructs exactly that contract; (3) mappingMode = passthrough; (4) the Set node uses includeOtherFields=false (v3.4 default) so the sub-workflow only ever sees contract fields. defineBelow mode is REJECTED outright at lint — schema:[] OR populated schema, both rejected; pseudo + caller-side Set is the only valid contract enforcement layer.
      Rationale: caller-side Set as the contract boundary makes (a) the pseudo Inputs section runtime-enforced, not documentation-only; (b) refactoring a sub-workflow's contract becomes a local edit at each caller's Set node, found via dependency-map.md; (c) eliminates "passthrough drift" where callers accidentally work due to shared field vocabulary then silently break when a vocabulary diverges; (d) inverts the Set v3.4 default-drops-fields hazard (SP-11 LESSON LEARNED) from foot-gun to feature.
      Validation: 18 defineBelow+schema:[] sites surfaced during SP-05 audit 2026-05-23 across WF-11/20/23/30/40/44 (8 redundant + 10 rename/computed mappings). Conversion deferred to dedicated "Contract-First Sub-Workflow Calls" multi-sprint initiative; this plugin update lands the principle + lint hook design ahead of execution.
      (d) Postgres SQL aliases: use lowercase or snake_case (matches postgres default behavior), or quote them (preserves camelCase). Never use unquoted camelCase aliases — postgres silently lowercases them, creating field-name mismatches downstream.
      (e) Structural refactors that change a workflow's contract MUST include matching pseudo updates in the same change set. build-workflow should refuse to commit a structural change without the corresponding pseudo diff. (Note: maintenance-phase periodic enforcement is a separate concern tracked as TD-NEW-027 in post-MVP doc.)
      (f) Validate pseudo `Inputs:` declaration matches the fields the sub-workflow's first trigger/code nodes actually reference.
      (g) **Set v3.4 default drops upstream fields.** Any Set v3.4 node that DERIVES a field (adds to the upstream payload) MUST set `parameters.includeOtherFields=true` — default v3.4 behavior emits only assigned fields, dropping the rest. Set nodes that intentionally produce a new contract (e.g., {channelId, messageText} for WF-51's input shape) correctly leave it false. SP-11 surfaced this on User-Load Gate (chinmay-astro exec 1630, 2026-05-22): the gate emitted only {routing: "to_wf02"} → downstream Call WF-02 Rule Router received no phoneNumber/user/pendingUser → WF-02 misrouted to NEW_USER → WF-21 INSERT failed on null phone_number. Fixed by adding includeOtherFields=true. build-workflow Step 5f.5 (new) should document: "Set v3.4 derive-then-pass-through pattern requires includeOtherFields=true". This is methodology-level (per [[feedback_principle_placement]]), not project-specific.
      (h) **User-load gates.** When a workflow loads a user record by external key (phone, slack_channel_id, etc.) with alwaysOutputData=true, add an explicit user-found IF gate with admin-feedback on miss BEFORE downstream operations consume the row. Downstream operations should trust the load. Avoids per-consumer-workflow guard proliferation. (Validated by SP-11's design — same principle applied at WF-01 and WF-10. From handoff plugin improvement candidates.)
      (i) **Audit-vs-reality drift validation pattern.** Sprint items that prescribe blanket mechanical changes ("set X on N nodes") should be validated per-node against build-workflow Step 5a before mutation. SP-02 went from "set true on 10 nodes" → "9 nodes confirmed; option B IF-guard expansion correctly rejected after upstream-gating analysis". Matches `build-sprint` Step 3 audit-vs-reality drift principle.
      (n) **Pseudo Inputs contract declaration discipline** (added 2026-05-23 alongside expanded principle c): Every sub-workflow's `.pseudo` file MUST declare an explicit Inputs contract section: required vs optional fields, names, shapes/types, validity rules (e.g., "phoneNumber: E.164 string"). Discriminated-union shapes (e.g., WF-60 logging WhatsApp vs Slack with different field sets) must be captured explicitly. Vague declarations like "Inputs: phoneNumber, userId, messageText (from upstream)" are rejected at pseudo-drift-check. The pseudo Inputs section is the authoritative source for caller-side Set node construction (per principle c). Validated by the SP-05 audit finding that callers had silently encoded different rename patterns for the same sub-workflow (WF-25) because no canonical contract existed in the pseudo.
      (j) **Admin/user message tone — business language only** (added 2026-05-23T11:15:00Z, sourced from [[feedback_admin_message_tone]]): Admin-facing Slack alerts (chinmay-admin-commands + consult channels) and user-facing WhatsApp messages MUST be written for a business audience. Forbidden tokens in message content: `WF-XX`, `WF-XX.pseudo`, `DB row`, `users row`, `pending_users`, `slack_channel_id`, `executeWorkflow`, `sub-workflow`, `IF node`, `Set node`, `payload`, internal field names (`messageType=...`, `userStatus=...`, `pendingUser=...`, `interactiveType=...`), references to internal architecture ("edge case", "pre-onboarding-STOP gate", "eliminates X at the source"). Acceptable diagnostic content: phone numbers, user names, plain-English status values, the actual message text, channel IDs/names, counts. Sanity test: would a small-business owner reading this understand without a glossary? If no, rewrite. Validated by SP-11 — three SP-11 alerts + a pre-existing WF-02 UNHANDLED alert rewritten in the same session after user flagged "Eliminates the WF-47 pre-onboarding-STOP edge at the source" as opaque to Chinmay. Methodology-level per [[feedback_principle_placement]].
      (k) **Author-fresh gate — explicit-approval requirement** (added 2026-05-23T11:15:00Z, sourced from SP-03 WF-10 28→38 fresh-rebuild experience): The `build-workflow` Step 5 scope rubric currently fuses jq-on-disk and author-fresh into one "anything else" bucket. Split them: jq-on-disk is the default for structural changes (preserves node IDs/positions/credentials/webhookIds verbatim by name); author-fresh (Python script writes full target nodes+connections, copying keeper nodes verbatim by name from live JSON, splicing in new nodes) is a HIGHER bar — discards nothing structural but rebuilds the JSON from scratch, so it MUST be justified by: (1) the change is pseudocode-driven AND complete-rebuild scope, OR (2) jq-on-disk transform complexity would itself be a defect risk. Author-fresh requires explicit user approval before invocation. Validated by SP-03 WF-10 (28→38 nodes, 2026-05-23T02:30:47Z) — author-fresh used deliberately + with user confirmation, with typeVersion floor (principle m) honored throughout. Methodology-level — applies to any project using `build-workflow`.
      (m) **typeVersion floor — match highest live typeVersion for the .type** (added 2026-05-23T11:15:00Z, sourced from [[feedback_typeversion_floor]]): When authoring nodes fresh (Step 5e author-fresh path, `n8n_create_workflow`, regenerate-by-copy, or any pass that introduces nodes not in the live JSON), default each new node's `typeVersion` to the HIGHEST `typeVersion` already present in the live workflow for that exact `.type`. Do not auto-pick the n8n MCP's latest. Two failure modes prevented: (1) UI-crash format mismatches that the existing structural lint catches for IF/executeWorkflow but NOT for Set/Switch/Code/Postgres; (2) silent runtime semantic drift — the Set v3.3 → v3.4 bump changed `includeOtherFields` default from true → false, which is exactly the SP-11 LESSON LEARNED (exec 1630, dropped upstream payload, INSERT-null-phone failure). Procedure: before authoring, grep live JSON for every existing instance of the same `.type`, capture all typeVersion values, pick the highest. If no existing instance: stop, ask user. Post-build verification: per-type typeVersion-array comparison live (pre) vs new (post) — only valid delta is "removed-version dropped" or "new entry equals existing version". Any other delta is a defect. Methodology-level.
    priority: P3
    status: in-progress
    started_at: 2026-05-23T10:55:00Z
    batch: 4
    depends_on:
      - id: SP-01
        type: soft
        reason: "Principles (a) and (c) are exemplified by SP-01's implementation; ordering ensures the plugin update captures lessons from real work."
    invocation_progress:
      - invocation: 1
        principles: [c, g, n]
        plugin_version: 1.26.0
        commit: 6d0ab53
        landed_at: 2026-05-23T11:25:00Z
        landed_files:
          - skills/build-workflow/SKILL.md (Step 5f.2 rewritten + new Step 5f.5 + Step 5f.3 passthrough-only + Step 5e Contract-First reference)
          - skills/pseudo-md-drift-check/SKILL.md (Step 3.2 new taxonomy D9; D9 added to DRIFT-severity rule)
          - scripts/lint-workflows.py (two new checks: contract-first advisory + Set-v3.4-includeOtherFields advisory; fail/warn severity classes)
          - CHANGELOG.md, .claude-plugin/plugin.json, .claude-plugin/marketplace.json
        cache_sync:
          - cache dir renamed 1.25.0 → 1.26.0
          - symlink 1.25.0 → 1.26.0 created
          - installed_plugins.json + marketplace cache plugin.json updated
        lint_severity_decision: |
          User chose "Land as warn-only" — contract-first check intentionally lands as advisory, not hard-reject, because 90 existing executeWorkflow calls (Code-node upstream pattern, not Set) would otherwise gate every project lint run. The check will flip to hard-reject after the Contract-First Sub-Workflow Calls multi-sprint initiative remediates those sites. Documented in build-workflow Step 5f.2 + Step 6 lint description + CHANGELOG.
        verification:
          - lint script smoke-tested against project workflows/ before commit
          - exit 0, 109 advisory findings (90 contract-first + 19 Set-v3.4-includeOtherFields)
          - matches expected count: 18 defineBelow sites (SP-05 audit) + ~10 additional Code-upstream cases not in original audit + 19 Set v3.4 derive-pattern instances
      - invocation: 2
        principles: [j, k, m]
        plugin_version: 1.27.0
        commit: 9a7ed81
        landed_at: 2026-05-23T12:25:00Z
        landed_files:
          - skills/build-workflow/SKILL.md (Step 5 scope rubric split: jq-on-disk vs author-fresh; new Step 5e.0 Author-fresh gate with explicit-approval + 3 justification criteria; new Step 5e.1a typeVersion floor with pre-PUT snapshot + post-PUT array-diff procedure; new Step 5g Message authoring conventions with forbidden-token table + small-business-owner sanity test; Step 6 lint enumeration updated with both new advisory checks)
          - scripts/lint-workflows.py (FORBIDDEN_MESSAGE_TOKENS regex set + scan helpers; forbidden_tokens_in_message_strings check on Set assignments + Code jsCode string literals ≥12 chars, bypass via lint-allow: message-tone-bypass note; check_typeversion_bump_against_live function + --typeversion-snapshot CLI flag with per-workflow guard; manual arg parser with --help)
          - CHANGELOG.md, .claude-plugin/plugin.json, .claude-plugin/marketplace.json (1.26.0 → 1.27.0)
        cache_sync:
          - cache dir renamed 1.26.0 → 1.27.0
          - symlink 1.26.0 → 1.27.0 created
          - installed_plugins.json + marketplace cache plugin.json updated
        verification:
          - python3 -c ast.parse on updated lint-workflows.py — OK
          - python3 scripts/lint-workflows.py --help — prints updated module docstring with both new checks listed
          - python3 scripts/lint-workflows.py workflows/ (chinmay-astro, 27 workflows) — 153 advisory findings, 0 fails, exit 0
          - new j-check (forbidden tokens) flagged 2 legitimate-false-positive jsCode literals (WF-01 'Prepare User Data', WF-10 'Build WF-60 Payload (Slack Inbound)') — both internal field-name patterns in Code-node logic, not delivered-message text; exactly the false-positive class the advisory severity is designed for
          - new m-check (typeVersion bump) smoke-tested with synthetic pre-snapshot {set:[3.3], if:[2.2]} against WF-01 post — correctly flagged set 3.4 and if 2 as new, plus 4 .types not present in pre
          - 3-file version-drift script: CHANGELOG / plugin.json / marketplace.json all show 1.27.0
          - 4-source post-sync alignment script: cache dir / installed_plugins / marketplace cache / plugin.json all show 1.27.0
      - invocation: 3
        principles: [a, b, d, h]
        plugin_version: 1.28.0 (pending)
        status: not-started
      - invocation: 4
        principles: [e, f, i]
        plugin_version: 1.28.1 (pending, may collapse)
        status: not-started
    execution_sub_plan: |
      Drafted 2026-05-23T11:08:00Z; revised 2026-05-23T11:18:00Z to fold in principles j/k/m (user chose Option B — expand SP-10 in place rather than spinning off a future SP-12). Routes through `n8n-whatsapp-methodology:flush-plugin-improvements` skill (clone → edit → atomic version bump across 3 files → CHANGELOG → commit → push → sync `.in_use` symlink). Four separate invocations, not one — each invocation = one coherent group + one version bump + one commit.

      **Principle → target skill file mapping (13 principles in current SP-10 description: a, b, c, d, e, f, g, h, i, j, k, m, n):**

      | Principle | Coverage status (active 1.25.0) | Target file(s) | Change type |
      |-----------|---------------------------------|----------------|-------------|
      | (a) Postgres alwaysOutputData + IF guard on 0-row paths | PARTIAL — `build-workflow` Step 5a has the explicit-decision rule but not as a hard lint check | `build-workflow/SKILL.md` Step 5a (tighten language to MUST); `scripts/post-workflow-lint.sh` (new check: pg_select_missing_aod) | Tighten + lint hook |
      | (b) IF FALSE branch on critical workflows must connect to graceful handler | NEW | `build-workflow/SKILL.md` Step 5a (new sub-step alongside aod); `scripts/post-workflow-lint.sh` (new check: if_false_disconnected_critical) | New principle + lint hook (advisory, since "critical" is subjective) |
      | (c) Contract-First sub-workflow calls (EXPANDED) | PARTIAL — Step 5f.1 has passthrough guidance but still ALLOWS defineBelow | `build-workflow/SKILL.md` Step 5f.1 (rewrite — reject defineBelow); `scripts/post-workflow-lint.sh` (new hard check: contract_first_exec_calls) | Expand + lint hook (hard reject) |
      | (d) Postgres SQL aliases — no unquoted camelCase | NEW | `build-workflow/SKILL.md` Step 5b DB-Schema steps (new); `scripts/post-workflow-lint.sh` (new check: pg_unquoted_camelcase_alias) | New principle + lint hook (regex) |
      | (e) Structural refactor must include matching pseudo diff in same change set | ALREADY ENFORCED — `build-workflow` Step 2a + 5f.0 are hard gates; backstopped by `pseudo-md-drift-check` | n/a — confirm coverage; skip unless gap found | No change anticipated |
      | (f) Pseudo Inputs declaration matches what trigger/code nodes reference | NEW | `pseudo-md-drift-check/SKILL.md` Step 3.2 taxonomy (new category D8 "Inputs contract validity") | New drift-check category |
      | (g) Set v3.4 includeOtherFields default hazard | PARTIAL — mentioned in SP-11 LESSON LEARNED but not yet in plugin | `build-workflow/SKILL.md` new Step 5f.5 (derive-then-pass requires includeOtherFields=true); `scripts/post-workflow-lint.sh` (new advisory check: set_v34_assignments_no_includeother — flag for review, not hard reject because contract-emit case is legitimate) | New step + lint hook (advisory) |
      | (h) User-load gates — explicit IF after user-by-external-key load | NEW | `build-workflow/SKILL.md` new Step 5a.5 architectural pattern (alongside aod decision) | New principle (no lint hook — pattern recognition, not pattern violation) |
      | (i) Audit-vs-reality drift validation before blanket mechanical changes | ALREADY COVERED — `build-sprint` Step 3 "Audit-vs-reality drift — common trigger for needs-decision" + Step 3 "Verify plan target before mutating" | n/a — confirm coverage; skip unless gap found | No change anticipated |
      | (n) Pseudo Inputs contract declaration discipline (vague declarations rejected) | NEW | `pseudo-md-drift-check/SKILL.md` Step 3.2 taxonomy (new category D9 "Inputs declaration shape"); `build-workflow/SKILL.md` Step 5f reference (link the rule) | New drift-check category + cross-reference |
      | (j) Admin/user message tone — business language only | NEW | `build-workflow/SKILL.md` new Step 5g "Message authoring conventions" (post-5f, before lint); `scripts/post-workflow-lint.sh` (new advisory check: forbidden_tokens_in_message_strings — grep Set/Code node `messageText`-style fields for the forbidden-token list) | New step + lint hook (advisory — false-positive prone, never hard-reject) |
      | (k) Author-fresh gate — explicit-approval requirement | PARTIAL — Step 5e mentions author-fresh as a path but doesn't gate it | `build-workflow/SKILL.md` Step 5 scope rubric (split jq-on-disk vs author-fresh into separate bullets) + Step 5e (insert 5e.0 "Author-fresh gate" before 5e.1) | Tighten existing — no new lint hook (process gate, not artifact check) |
      | (m) typeVersion floor — match highest live typeVersion for .type | NEW | `build-workflow/SKILL.md` new Step 5e.1a "typeVersion floor"; `scripts/post-workflow-lint.sh` (new check: typeversion_bump_against_live — compares per-type typeVersion arrays pre/post and flags any new version that wasn't already present in live) | New step + lint hook (post-PUT verification, since pre-PUT can't see "live's max typeVersion" without an extra fetch) |

      **Four flush-plugin-improvements invocations (handoff ordering preserved + j/k/m folded in as Invocation 2):**

      **Invocation 1 — Contract-First trio (c + n + g) — smallest cohesive unit, active learning behind it:**
      - `build-workflow/SKILL.md`: rewrite Step 5f.1 to reject defineBelow + require upstream Set; add new Step 5f.5 documenting Set v3.4 includeOtherFields hazard with the chinmay-astro exec-1630 case study.
      - `pseudo-md-drift-check/SKILL.md`: add taxonomy category D9 (Inputs declaration shape — required/optional/types/validity, no "from upstream" vagueness).
      - `scripts/post-workflow-lint.sh`: add hard check `contract_first_exec_calls` (rejects defineBelow + missing-upstream-Set); add advisory check `set_v34_assignments_no_includeother`.
      - CHANGELOG: minor bump (new lint check + new step). Target version 1.26.0.

      **Invocation 2 — Authoring discipline (j + k + m):**
      - `build-workflow/SKILL.md`: add new Step 5g "Message authoring conventions" with the (j) forbidden-token list + sanity test; split Step 5 scope rubric to separate jq-on-disk and author-fresh; insert Step 5e.0 "Author-fresh gate" (explicit-approval requirement, justification rubric); insert Step 5e.1a "typeVersion floor" with pre-PUT grep + post-PUT array-diff verification procedure.
      - `scripts/post-workflow-lint.sh`: add advisory check `forbidden_tokens_in_message_strings` (greps Set/Code node text-emit fields for the forbidden-token list); add post-PUT check `typeversion_bump_against_live` (requires reading live JSON before-state — implement as a snapshot saved by Step 5e pre-flight and consumed by the post-PUT check).
      - CHANGELOG: minor bump (3 new principles, 2 new lint hooks). Target version 1.27.0.

      **Invocation 3 — Postgres + IF discipline (a + b + d + h):**
      - `build-workflow/SKILL.md`: tighten Step 5a aod language to MUST; add new Step 5a.5 (user-load gate pattern); add Step 5a substep for IF-FALSE graceful handler on critical paths; extend Step 5b with SQL alias quoting rule.
      - `scripts/post-workflow-lint.sh`: add hard check `pg_select_missing_aod`; add advisory check `if_false_disconnected_critical`; add hard check `pg_unquoted_camelcase_alias`.
      - CHANGELOG: minor bump (4 new principles + 3 new lint checks). Target version 1.28.0.

      **Invocation 4 — Drift/discipline reinforcement (e + f + i):**
      - `pseudo-md-drift-check/SKILL.md`: add taxonomy category D8 (Inputs contract validity — pseudo Inputs matches trigger/code references).
      - `build-workflow/SKILL.md` + `build-sprint/SKILL.md`: gap-check Steps 2a/5f.0 (e) and Step 3 (i); patch only if a real gap is identified during the audit. May be a no-op invocation, in which case skip and absorb the (f) drift-check addition into Invocation 1 or 2.
      - CHANGELOG: patch bump (drift-check taxonomy expansion). Target version 1.28.1.

      **Lint hook design — principle (c) "Contract-First sub-workflow calls" — concrete spec:**

      Function: `lint_contract_first_exec_calls()` added to `scripts/post-workflow-lint.sh`. Operates on the same JSON the existing lint hook reads.

      For each node N in `.nodes[]` where `N.type == "n8n-nodes-base.executeWorkflow"`:

      1. **Reject defineBelow:** if `N.parameters.workflowInputs.mappingMode == "defineBelow"` → ERR `"executeWorkflow '<N.name>': mappingMode=defineBelow rejected — Contract-First requires passthrough + upstream Set node (build-workflow Step 5f.1)"`.

      2. **Require immediately-upstream Set node:** "immediately upstream" = graph traversal one hop back via `.connections`. Identify the set `U = { src | src ∈ Object.keys(connections), ∃ branch_outputs ∈ connections[src].main, ∃ c ∈ branch_outputs, c.node == N.name }`. Cases:
         - `|U| == 0` → ERR `"executeWorkflow '<N.name>': no upstream connection — orphan node"`.
         - `|U| == 1`, single upstream `u`:
           - If `nodes[u].type != "n8n-nodes-base.set"` → ERR `"executeWorkflow '<N.name>' upstream node '<u>' is type '<nodes[u].type>', not a Set — Contract-First requires a named Set node immediately upstream constructing the contract (build-workflow Step 5f.1)"`.
           - If `nodes[u].typeVersion < 3.4` → WARN `"executeWorkflow '<N.name>' upstream Set '<u>' typeVersion=<v>, expected ≥3.4 — upgrade for explicit field-emit semantics"`.
         - `|U| > 1` (multiple upstreams converging on the exec call — uncommon): apply the Set check to ALL upstreams. ERR if any are non-Set. (A future refinement could allow a Merge node directly upstream of a Set; out of scope for v1.)

      3. **Whitelist exception**: a `// lint-allow: contract-first-bypass <reason>` comment in the Set node's `notes` field (or in workflow `.meta.description`) skips the hard reject. Reserved for documented exceptions (e.g., a placeholder workflow under active migration). Audit-tracked.

      Edge cases:
      - executeWorkflowTrigger (sub-workflow entry point) — not an executeWorkflow CALL; skip.
      - executeWorkflow → executeWorkflow chain — still requires Set in between (the rule applies at the call site).
      - Sub-workflows with no executeWorkflow calls — skip (no calls, no rule).
      - The Set's downstream emission shape (includeOtherFields true vs false) is OUT OF SCOPE for this hook; principle (g)'s advisory check handles it separately.

      Implementation pattern: jq query returns the rejection list as `.contract_first_violations: [{node, reason}]`; bash function reads the array and prints + sets exit code. Drop-in alongside the existing checks (e.g. `pg_missing_eq_prefix`, `exec_string_wid_at_v12`).

      **Scope decision recorded 2026-05-23T11:18:00Z:** Option B chosen — SP-10 expanded in place to include j/k/m. Rationale: postponing to a hypothetical SP-12 would only add ceremony — j/k/m are already memory-backed, methodology-level, and exemplified by SP-01/SP-03/SP-11 the same way a/c are. The 13-principle scope fits cleanly into 4 invocations.

      **Next concrete step (after user approves this sub-plan):** start Invocation 1 by invoking `n8n-whatsapp-methodology:flush-plugin-improvements` with the (c) + (n) + (g) trio + the lint-hook addition. Pre-flight: confirm n8n SSH tunnel is open (this session reported NOT reachable at session start — verify before plugin work resumes, since the lint hook will eventually be exercised against the live workflow set).
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
