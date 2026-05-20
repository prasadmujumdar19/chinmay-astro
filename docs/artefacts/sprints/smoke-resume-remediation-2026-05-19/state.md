---
slug: smoke-resume-remediation-2026-05-19
input_source: docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/sprint-input.md
input_hash: 14bf0eaa95d5047e47fdb69e33a306cb82226f52d156154ac236dace833f9349
source_file_update: false
working_copy_path: docs/artefacts/sprints/smoke-resume-remediation-2026-05-19/working.md
planned_at: 2026-05-19T10:53:42Z
last_updated: 2026-05-20T02:23:00Z
sprint_complete: true
sprint_complete_at: 2026-05-20T02:23:00Z
planning_complete: true
td003_redirected_at: 2026-05-20T00:11:33Z
td003_redirect_reason: "User challenged the premise during batch-3 audit. messages table is the canonical communication log; admin_actions was redundant for single-admin operation. TD-003 redirected from 'build admin_actions audit-log' to 'close messages-table touchpoint-coverage gaps (Slack side)'. admin_actions deprecation logged to followups + post-MVP tech debt; not part of this sprint. See td003-touchpoint-audit.md for full audit + 5-item fix plan."
slug_override_reason: "Filename `sprint-input.md` derives generic slug `sprint-input`; user-chose descriptive slug at planning time to avoid collisions and tag the smoke session it came from."
n8n_state_verification: "Skipped full discover-current-state skill invocation. n8n reachable at planning time (curl /healthz=200 — hook check was stale). Used targeted lightweight grep on local workflows/*.json instead. Findings: admin_actions referenced in 2 of 28 workflow JSONs — WF-11 Command Parser (GoTYo0GS2y8qjjkw) and WF-47 Unsubscribe Handler (2U7mxHMyqA41ROKX). Item TD-003's pre-step (grep for admin_actions to decide build-vs-fix) is therefore partially answered: feature is partially built — fix existing + extend to missing callers."
dependency_conflicts_found:
  - "Input doc dependency note says 'item-4 should ideally precede or run alongside item-2' (soft) — but item-4 is [major]/P1 and item-2 is [critical]/P0. User explicitly resolved by stating final order `1 → 2 → 4 → 3 → 5` with reasoning (WF-44 unblocks user-facing path; WF-60 unblocks compliance; review then prevents whack-a-mole; admin_actions is internal; naming is cosmetic). Honored as stated. Risk surfaced: technical-workflow-review (item-4) may surface caller-mapping or schema issues that retroactively affect the WF-60 rebuild (item-2). If review-time findings overlap WF-60 callers, defer the relevant fixes to a separate sprint rather than re-opening batch 1."
  - "Items TD-003 and TD-004 both have WF-47 in scope (TD-003 because WF-47 already references admin_actions; TD-004 because WF-47 is in the un-exercised set). Soft sibling. Order TD-004 → TD-003 (review first) honors both the user-stated order and the natural information flow."
priority_adjustments_confirmed: "User-stated final order `item-1 → item-2 → item-4 → item-3 → item-5` accepted verbatim. No reordering applied."
parser_warnings: []
items:
  - id: TD-001
    description: "WF-44 Save Feedback to DB — fix Postgres parameter binding. Node has `$1, $2` in SQL with `queryReplacement: null`; convert to array-form `={{ [$json.feedbackText, $json.userId] }}` (verify upstream field names first). Also verify `chinmay_astro.users` has both `feedback` and `stage` columns."
    priority: P0
    status: done
    completed_at: 2026-05-19T11:08:20Z
    batch: 1
    change_type: surgical
    estimated_cost_tokens: 5000
    target_workflows: [WF-44]
    validation: "Re-run TC-0404 end-to-end; `users.id=N.feedback` populated; user receives thank-you via WF-50."
    validation_status: "Code-side fix verified (lint exit 0; live node now has options.queryReplacement with correct cross-node references to messageContent + user.id). End-to-end TC-0404 re-run requires user action — flagged in batch-1 commit/handoff."
    fix_summary: "(1) Schema confirmed: chinmay_astro.users has feedback (text), stage (varchar), id (int), updated_at (timestamptz). (2) Found live node was using wrong property path additionalFields.queryParams (silently ignored by Postgres v2.5 runtime) — moved to options.queryReplacement. (3) Found upstream WF-01 emits messageContent (not messageText) and user.id (not userId) — switched expression to cross-node reference $('When Executed by Another Workflow').first().json.messageContent and .user.id so it survives WF-25 intent classifier passthrough. (4) alwaysOutputData kept false (UPDATE; downstream Prepare Ack Message uses trigger input, not UPDATE result). Live WF-44 updatedAt: 2026-05-19T11:08:20.182Z."
    followup_reference: "docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/followups-wf44-feedback-recorder.md"
    depends_on: []

  - id: TD-002
    description: "WF-60 Message Logger — architectural rebuild. Logger currently runs successfully in 22–101 ms with zero rows persisted across 8 message events (systematic cross-node variable mismatches). Define canonical input contract, update all callers via mapper nodes, simplify WF-60 to 2 nodes (insert + non-fatal error branch)."
    priority: P0
    status: done
    completed_at: 2026-05-19T11:32:12Z
    batch: 1
    change_type: structural
    estimated_cost_tokens: 25000
    target_workflows: [WF-60, WF-00, WF-50]
    callers_to_update: "Verified callers via grep of workflowId.value == 6H75p935FpBVBQtV — only WF-00 (1 call) and WF-50 (2 calls: outbound success + drop). Followup mentioned WF-51/WF-33/WF-43 as potential callers but they do not actually call WF-60 in current live n8n state."
    validation: "Inbound + outbound WhatsApp + 1 Slack relay → 3 correctly shaped rows in `chinmay_astro.messages`; WF-60 failure does NOT fail parent chains."
    validation_status: "Code-side fix verified (lint clean on all 3 workflows; canonical shape now emitted by 3 caller mappers; WF-60 Extract emits filter/lookup flags; Insert has onError=continueRegularOutput). End-to-end TC-0303/TC-0401 re-run requires user action to confirm rows land in chinmay_astro.messages."
    fix_summary: "Option A (explicit canonical-shape mappers in callers, agreed by user 2026-05-19). (1) WF-60 6H75p935FpBVBQtV: Extract Message Data rewritten to normalize field aliases + emit phoneNumber + compute _filterReason (TD-034 whitespace) + _needsLookup. Filter Skip? IF now reads _filterReason (notEmpty). Build Filter Skip Result reads _filterReason. Needs Phone Lookup? IF reads _needsLookup. Log to Messages Table got onError=continueRegularOutput so failure does not fail parent. Live updatedAt: 2026-05-19T11:20:24.850Z. (2) WF-50 BUVun38WEKb12zg9: added 2 new Code mappers — Build WF-60 Payload (Outbound) between Process Result and Call WF-60 Message Logger, and Build WF-60 Drop Payload between Should Drop? and Log Drop to WF-60. Both emit direction='outbound' + canonical fields. Live updatedAt: 2026-05-19T11:31:21.222Z. (3) WF-00 JQu1MkK5vgtUCeNO: added Build WF-60 Payload (Inbound) Code mapper between Gather Message Info For Processing and Call WF-60 Message Logger. Emits direction='inbound', userId=null (resolved by WF-60 phone lookup), canonical fields. Parallel Gather → Call WF-01 branch preserved. Live updatedAt: 2026-05-19T11:32:12.575Z."
    deviations_from_followup: "Followup recommended collapsing WF-60 to 2 nodes (insert + error branch) with all logic in callers. After reading docs/pseudocode/WF-60.pseudo (source-of-truth), kept the per-pseudocode internal logic (filter → lookup branch → insert) because the pseudocode requires Step 3 filters and Step 4 phone-lookup INSIDE WF-60. The followup over-simplified; pseudocode prevails. The rebuild fixes the operator-UI complaint (cross-node variable mismatches) by making Extract Message Data emit every variable that downstream nodes reference — that was the actual bug, not the node count."
    followup_reference: "docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/followups-wf60-architecture.md"
    depends_on:
      - id: TD-001
        type: soft
        reason: "Both items modify P0 user-facing flow. Doing TD-001 first lets feedback path go live independent of the WF-60 rebuild risk."

  - id: TD-003
    description: "Close `chinmay_astro.messages` touchpoint-coverage gaps on the Slack side. WA inbound (WF-00) + WA outbound (WF-50) were fixed in TD-002. Audit (2026-05-20) found 4 gaps remain: Slack inbound via WF-10 is not logged; Slack outbound canonical path (WF-51) does not call WF-60; WF-11 has 8 direct Slack send nodes bypassing WF-51; WF-41 has 1 direct Slack send bypassing WF-51. After this item, every WA + Slack message tied to a user lands in `messages` with correct direction / user_id / message_ts / metadata. Admin-wide commands (LIST/STATS/HELP) are intentionally not logged — skip-at-WF-60 (no user resolvable) avoids the NOT NULL user_id constraint without a schema change."
    priority: P1
    status: done
    completed_at: 2026-05-20T02:10:00Z
    batch: 3
    change_type: structural
    estimated_cost_tokens: 35000
    target_workflows: [WF-60, WF-10, WF-51, WF-11, WF-41]
    redirect_history:
      - from: "Build admin_actions audit-log (per original sprint-input.md item 3)"
        to: "Close messages-table touchpoint-coverage gaps (Slack side)"
        decided_at: 2026-05-20T00:11:33Z
        reasoning: "User pointed out that messages table already serves the audit/forensics purpose. admin_actions is redundant given single-admin operation. Original premise was solving the wrong problem; messages-coverage gaps are the real issue."
    fix_items:
      - F1: "Extend WF-60 to handle Slack transport — accept `transport='slack'` payloads, resolve `slack_channel_id → user_id` (skip if not resolvable, like the existing phoneNumber lookup), populate `slack_message_ts` instead of `whatsapp_message_id`, set `message_type` to a Slack value."
      - F2: "WF-10 — add Slack-inbound mapper + Call WF-60 after Extract Required Fields; admin-wide commands skipped by WF-60's no-user path."
      - F3: "WF-51 — add Slack-outbound mapper + Call WF-60 after the successful Post to Slack response. Covers every WF already routing through WF-51 (WF-02/22/25/31/32/33/34/40/42/46)."
      - F4: "WF-11 — refactor 8 direct Slack send nodes to route through WF-51 (Confirm Consultation Closure, Confirm User Blocked, Send List To Admin, Send Stats To Admin, Unknown Command Response, Confirm User Unblocked, No Blocked User Found, Send Help To Admin). Architectural cleanup; F3 then covers them automatically."
      - F5: "WF-41 — refactor 'Post to Slack Channel' direct node to route through WF-51. Same cleanup as F4 but single-node."
    fix_summary: |
      F1 (WF-60 6H75p935FpBVBQtV updated 2026-05-20T00:49:49.006Z): Extract Message Data extended for transport='slack'; emits unified _lookupColumn/_lookupValue fields. Lookup User By Phone SQL rewritten to handle either phone_number or slack_channel_id based on _lookupColumn. INSERT extended with slack_message_ts column (8 positional params). WA path unchanged (transport defaults to 'wa'). Admin-wide commands silently dropped by skip-if-not-resolvable path.
      F2 (WF-10 wMh0oBRtJbvhLgOf updated 2026-05-20T01:01:47.594Z): added Build WF-60 Payload (Slack Inbound) Code mapper + Call WF-60 Message Logger executeWorkflow (tv 1.2, onError=continueRegularOutput) as 3rd parallel side branch from Extract Required Fields.
      F3 (WF-51 wlZRK0YxnhP0b2RL updated 2026-05-20T01:03:55.160Z): chained Build WF-60 Payload (Slack Outbound) Code mapper → Call WF-60 Message Logger after Post to Slack. Logs every Slack outbound routing through WF-51 (covers WF-02/22/25/31/32/33/34/40/42/46).
      F4 (WF-11 GoTYo0GS2y8qjjkw updated 2026-05-20T01:25:38.685Z): 8 direct slack v2.3 nodes refactored in-place to executeWorkflow v1.2 calls into WF-51 (defineBelow channelId+messageText). Names/positions/connections preserved. 4 nodes that used $json.channelName remapped to $('Parse Command').item.json.channelId for WF-51's mode=id compatibility. 2 hardcoded admin-channel nodes kept literal C0A5B0ZE81E.
      F5 (WF-41 6PzJRZsF7k2d9hV7 updated 2026-05-20T02:08:35.502Z) — REVISED SCOPE: original audit framing ('route Slack send through WF-51') was superseded after live-code analysis revealed the WF-41 whatsapp_to_slack branch was orphaned dead code (WF-40 owns the user→admin relay; only WF-10 calls WF-41, never with phoneNumber). Pseudocode reviewed first per user instruction (docs/pseudocode/WF-41.pseudo updated to single-direction admin→user, dropping Steps 4-6). Then 4 dead nodes removed from live workflow: Detect Direction, Route by Direction, Prepare Channel Lookup, Post to Slack Channel. Trigger rewired to Extract Phone from Channel directly. Down from 9 → 5 nodes.
    sibling_regression: |
      Dependency map rebuilt 2026-05-20 (69 edges). All 28 active workflows pass plugin lint. Postgres-strict checks (missing = prefix, SELECT without alwaysOutputData) clean across all 28. No orphaned connections. WF-40 pseudocode reviewed and confirmed concurrent with the post-F5 architecture (WF-40 owns user→admin relay, already calls WF-51 so F3 picks up logging automatically).
    deviations_from_followup: "F5 deviated significantly from the audit recommendation. Audit (td003-touchpoint-audit.md GAP-4) said 'route through WF-51'. User-approved revised scope: remove the dead branch entirely after pseudocode review confirmed WF-40 took over that role. Pseudocode updated first, then code cleanup applied. Result: WF-41 now matches its name (admin → user only); no static-rule bypass remaining because the bypass node itself is gone."
    validation: "(1) WA inbound from test user 61466927921 → messages row with direction='inbound', whatsapp_message_id populated. (2) WA outbound from WF-50 → messages row with direction='outbound'. (3) Admin types APPROVE PAYMENT 61466927921 in consult-61466927921 → 2 messages rows: 1 inbound + 1 outbound, user_id resolved via channel→phone→user lookup. (4) Admin types LIST in admin channel → NO messages rows, WF-60 execution log shows skip path. (5) WF-60 failure does NOT fail parent chains (preserved from TD-002)."
    followup_reference: "docs/artefacts/sprints/smoke-resume-remediation-2026-05-19/td003-touchpoint-audit.md"
    admin_actions_deprecation: "admin_actions table is now deprecated (single-admin model; messages + state-machine fully capture forensics). Existing partial writes in WF-11 Unblock User node and WF-47 Log to admin_actions remain in place (silent no-op for WF-47, working but no performed_by for WF-11) — no harm since nothing reads from admin_actions. Removal logged to docs/artefacts/sprints/smoke-resume-remediation-2026-05-19/followups.md and to project post-MVP tech debt."
    depends_on:
      - id: TD-002
        type: hard
        reason: "TD-003 extends WF-60 (rebuilt in TD-002) to handle Slack transport. The canonical-shape mapper pattern established in TD-002 is the template for the new Slack-side mappers in WF-10 and WF-51."
      - id: TD-004
        type: soft
        reason: "TD-004 (technical-workflow-review on un-exercised WFs) ran before TD-003 was redirected. Its findings did not surface new Slack-coverage issues but did not specifically audit for them either — re-check during F3 implementation that no other direct-slack-send node was missed."

  - id: TD-004
    description: "Run technical-workflow-review skill scoped to ONLY the un-exercised workflows (15 total: WF-21, WF-22, WF-23, WF-25, WF-30, WF-31, WF-32, WF-41, WF-42, WF-45, WF-47, WF-52, + any P3/utility workflows). Smoke session covered WF-00/01/02/10/11/20/33/40/43/44/50/51/60 functionally. Static checks: queryReplacement-comma-string (C14), jsonBody raw-string (C13), orphaned-active (C15), missing parameters, disabled/orphaned nodes, schema drift."
    priority: P1
    status: done
    completed_at: 2026-05-19T11:55:00Z
    batch: 2
    change_type: documentation
    estimated_cost_tokens: 30000
    target_workflows: [WF-21, WF-22, WF-23, WF-25, WF-30, WF-31, WF-32, WF-41, WF-42, WF-45, WF-47, WF-52]
    validation: "Report HTML produced in `docs/artefacts/reviews/`, with explicit 'all 15 reviewed' coverage statement; any new findings spawn their own sprint items (NOT folded into this sprint)."
    validation_status: "Tracker + HTML produced at docs/artefacts/reviews/technical-workflow-review-2026-05-19/ with explicit 'All 12 reviewed' coverage statement (sprint-input said 15 but listed 12 explicit + 'P3/utility'; the 12 explicit list was reviewed). C1–C6, C11, C15 PASS. C7 deferred (cosmetic). C8 ALL columns aligned to schema. C10 known empties (TD-002/TD-003). C12/C13 1 false positive each (suppressed by alias tolerance / safe expression form). C14 2 safe-machine-only comma-strings."
    findings_summary: "0 strict / 3 adjacent / 2 plugin improvements. Adjacent items captured as TD-NEW-T1 (5 inline-SQL interpolations), TD-NEW-T2 (2 comma-string queryReplacements), TD-NEW-T3 (missing admin_actions user_id index). Plugin: PLUGIN-T1 (tighten C13 regex), PLUGIN-T2 (C12 accepts_aliases support). All deferred to future sprint per TD-004 spec ('any new findings spawn their own sprint items, NOT folded into this sprint')."
    artefacts:
      - docs/artefacts/reviews/technical-workflow-review-2026-05-19/tracker.md
      - docs/artefacts/reviews/technical-workflow-review-2026-05-19/report.html
    note: "If review surfaces issues in WF-60 or its callers (already rebuilt in TD-002), record them as new sprint items rather than back-patching batch 1."
    depends_on: []

  - id: TD-005
    description: "`payments.status` naming consistency. Column is `verified_at`, value stored is `approved`. Recommend canonical = `verified` to match the column. Update writer node(s) and any downstream readers. Low blast radius; cosmetic but worth clearing before go-live."
    priority: P2
    status: done
    completed_at: 2026-05-20T02:22:30Z
    fix_summary: "Batch Surgical: 1-line SQL substring change in 2 nodes across 2 workflows + 1 DB migration. (1) WF-33 NcHZedq9ycnAQ9SW updatedAt 2026-05-20T02:22:26.578Z: `Update Payment Status` UPDATE clause `status = 'approved'` → `status = 'verified'`. WHERE clause `status = 'pending_verification'` untouched. (2) WF-11 GoTYo0GS2y8qjjkw updatedAt 2026-05-20T02:22:27.497Z: `Get Stats` revenue_today sub-select `WHERE status = 'approved'` → `WHERE status = 'verified'`. Same node otherwise unchanged. (3) DB migration via SSH+docker-exec psql: `UPDATE chinmay_astro.payments SET status='verified' WHERE status='approved'` — 2 rows migrated (ids 10, 11; user_id=28). Post-migration: 100% rows have `status='verified'`. Plugin lint clean on all 28 workflows."
    batch: 4
    change_type: surgical
    estimated_cost_tokens: 3000
    target_workflows: ["WF-33 (likely writer) — confirm via grep at execution time"]
    validation: "All new rows in `payments` use `status='verified'`; no downstream consumer breaks (verify by reading WF-XX that read `payments.status` — search before edit)."
    followup_reference: "docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/followups-audit-log-gaps.md (MINOR-01)"
    depends_on: []

out_of_scope:
  - "PLUGIN-01 / PLUGIN-02 static checks landing in n8n-whatsapp-methodology plugin (tracked in plugin changelog)."
  - "Gemini 2.5-flash-lite 503 transients (CLAUDE.md TD-NEW-016) — retryOnFail=true mitigates."
  - "WF-23/WF-30/WF-44 userStatus input-contract cleanup — folded into TD-004 if review surfaces it."
  - "WF-11 STATS day-boundary — explicitly accepted as won't-fix (memory: project_wf11_stats_day_boundary_accepted)."

carry_forward_test_state:
  user_phone: "61466927921"
  user_id: 28
  user_status: consultation_closed
  consultation_id: 10
  slack_channel_id: C0B567A175W
  note: "DR-10 — channel preserved. TD-001 validation (re-run TC-0404) can either resume from this state or wipe per CLAUDE.md clean-slate SQL. Outstanding payment notifications in the channel are historical, no admin action required."

batches:
  - number: 1
    items: [TD-001, TD-002]
    priority: P0
    estimated_total_tokens: 30000
    description: "P0 user-facing fixes — feedback path + message logger rebuild."
  - number: 2
    items: [TD-004]
    priority: P1
    estimated_total_tokens: 30000
    description: "Technical review of 15 un-exercised workflows. Pure analysis; spawn new sprint items for any findings."
  - number: 3
    items: [TD-003]
    priority: P1
    estimated_total_tokens: 25000
    description: "Audit-log gap fix; informed by batch-2 review findings."
  - number: 4
    items: [TD-005]
    priority: P2
    estimated_total_tokens: 3000
    description: "Cosmetic naming alignment in payments.status."
