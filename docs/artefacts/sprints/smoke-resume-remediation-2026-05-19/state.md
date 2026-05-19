---
slug: smoke-resume-remediation-2026-05-19
input_source: docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/sprint-input.md
input_hash: 14bf0eaa95d5047e47fdb69e33a306cb82226f52d156154ac236dace833f9349
source_file_update: false
working_copy_path: docs/artefacts/sprints/smoke-resume-remediation-2026-05-19/working.md
planned_at: 2026-05-19T10:53:42Z
last_updated: 2026-05-19T11:55:00Z
planning_complete: true
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
    description: "Audit-log path — `chinmay_astro.admin_actions` is globally 0 rows despite every admin command (APPROVE/REJECT/CLOSE/BLOCK/UNBLOCK) being expected to land an audit row. Planning-time grep confirmed admin_actions is referenced in WF-11 (Command Parser) and WF-47 (Unsubscribe Handler) only — feature is partially built. Either fix existing nodes (if broken like BUG-01 family) and extend coverage to WF-33/WF-41 etc., or factor an audit-writing sub-workflow callable from all admin-action surfaces."
    priority: P1
    status: pending
    batch: 3
    change_type: structural
    estimated_cost_tokens: 25000
    target_workflows: [WF-11, WF-47, WF-33, WF-41, "+ any other admin-action surfaces surfaced by TD-004 review"]
    validation: "Every APPROVE / CLOSE etc. lands one row in `admin_actions` with `user_id, action_type, performed_by, notes` populated."
    followup_reference: "docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/followups-audit-log-gaps.md"
    depends_on:
      - id: TD-004
        type: soft
        reason: "TD-004 (technical-workflow-review on un-exercised WFs) may surface admin_actions-related findings that change the shape of TD-003. Running TD-004 first lets TD-003 absorb those findings instead of re-opening."

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
    status: pending
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
