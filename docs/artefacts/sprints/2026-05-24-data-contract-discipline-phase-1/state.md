```yaml
slug: 2026-05-24-data-contract-discipline-phase-1
input_source: docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/tasks.md
input_hash: 40a8377aaf9a1c5d489af560e9074097b39784ebfec988264658d714e9598d66
source_file_update: false
working_copy_path: docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/working.md
planned_at: 2026-05-24T14:15:37Z
last_updated: 2026-05-24T17:18:01Z
last_update_reason: "Pre-Wave-2 verification session — caught and fixed pseudo-file gap. Wave 1 subagents updated live n8n + .md projections but did NOT update the handwritten .pseudo design docs (the dispatch brief asked for pseudo_diff but subagents omitted it; parent did not apply pseudo edits). User flagged the ambiguity verbatim before Wave 2 dispatch. Inline main-thread reconciliation applied to all 7 Wave-1 .pseudo files (WF-00, WF-01, WF-10, WF-50, WF-51, WF-52, WF-60) — entry guard steps added (WF-50/51/52/60), envelope-build steps added (WF-01/10), transport:'wa' discriminator added to WF-00 Step 8a. Verification: pre-edit grep confirmed gap, post-edit grep confirmed presence of new artifacts in each pseudo; step numbering monotonic in WF-52/60/50/51; residual sub-letters in WF-00/01/10 pre-date this session (minimal-change reconciliation, full linear renumbering deferred). Plugin-improvement candidates surfaced for Wave 2 dispatch brief — see handoff Session Updates §Lessons. Prior reason: Wave 1 (Batch 2) landed and verified — 7 subagents dispatched in parallel (Sonnet); all returned structured edit plans; main thread applied via mcp__n8n__n8n_update_partial_workflow with re-fetch verification per WF. 3 systemic contract violations caught + fixed (transport:'wa' on WF-00/50/50-drop); WF-01 Silent Reject patched. 3 adjacent findings logged to followups.md. Workflows re-exported, .md projections regenerated."
planning_complete: true

slug_note: |
  Source file is `tasks.md` (extension-stripped slug would be the generic 'tasks'). Overridden to
  the spec-folder name `2026-05-24-data-contract-discipline-phase-1` so multiple specs each with their
  own tasks.md do not collide and traceability to the design folder is obvious. The snapshot scripts
  (TD-DCP-001/002) still use the shorter operational slug `data-contract-phase-1` as referenced
  in design.md §5 — that is unrelated to this sprint slug.

pre_wave_verification:
  required: true
  origin: "User directive 2026-05-24T15:25Z after WF-00 vs WF-47 ID swap was caught mid-sprint."
  gate: |
    Before dispatching ANY wave subagents, build-sprint MUST:
      1. Fetch live n8n workflow list: curl -sf -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows?limit=250 | jq -r '.data[] | "\(.name)\t\(.id)"'
      2. For each wave's table in docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/working.md "Pre-Wave Cross-Check" section:
         - Look up each row's WF-XX in the live list.
         - Compare live ID against the table's `Live ID` column.
      3. Render the table to the user with a third column "✓/✗ verified" filled in from the live check.
      4. Halt if ANY row mismatches. Do NOT dispatch until user confirms the resolution.
      5. If all rows verify, ask user "Cross-check passed — dispatch Wave <N>?" and wait for explicit go-ahead.
    Rationale: WF-00↔WF-47 swap survived two reviewer passes; only the snapshot dry-run caught it.
    Render format: simple markdown table — WF | Live ID | Sub | One-line change. Keep terse, no expansion.

execution_model: subagent_parallel_workflow_ownership
execution_model_rationale: |
  User direction (2026-05-24): pre-live, no traffic. Implementation order does not matter as
  long as final state matches design.md. Therefore the as-authored sequential P1 chain
  (14 hard depends_on links) is collapsed into 2 parallel waves grouped by *workflow ownership*
  — one subagent per workflow JSON, no concurrent writes to the same workflow. Per-unit smoke
  tests (DCP-003, 004, 011, 021, 031, 041, 053, 063, 070) and the rollback drill move to a
  separate testing.md run after build completes. build-sprint only executes the build items.

  Subagent rules: per CLAUDE.md "Subagent Delegation" §1-7 — surgical, deterministic, <1-min
  budget per subagent, 2-min monitor abort, MUST use run_in_background=true for parallel waves
  ([[feedback_parallel_subagent_background_dispatch]]), parent does all Writes (subagent
  returns structured edit plan, parent applies via n8n MCP partial updates) per
  [[feedback_subagent_permission_preauth]]. Sonnet authorized for this sprint per user request
  (override of Haiku default). Each subagent reads only the .pseudo + .md for its owned WF
  plus the relevant design.md sections — no broad-scope reads.

testing_separation: |
  Testing items removed from build-sprint scope. See:
  docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/testing.md
  for the post-build test run order. User runs that plan manually after build-sprint exits.
  Pre-live system: no inter-wave smoke gates, no inter-wave rollback. All testing runs after Batch 4.

rollback_semantics: |
  Snapshot taken in Batch 1 (TD-DCP-002) is sprint-wide, not per-WF. Implications:
    - If a Wave 1 subagent fails mid-edit, restore reverts ALL Wave 1 WFs touched so far (not just the failed one).
    - Rollback is DEFERRED to post-build per user direction (2026-05-24) — the parent does NOT auto-restore
      between waves on a single-subagent failure. Instead: TaskStop the failed subagent, surface the
      partial-edit state to the user, reclassify the failed WF as inline-fixup, continue.
    - Snapshot's primary purpose is post-test triage: if T1–T5 surface a regression that's faster
      to revert than to forward-fix, restore is the safety net. T2 (testing.md) drills this path.

cross_wave_window_risk: |
  Several items span both waves (TD-DCP-010, -020, -030, -040, -052). After Wave 1 lands,
  the new entry guards reject payloads from callers that Wave 2 hasn't yet aligned. Pre-live
  with zero traffic this window is harmless; if traffic begins between waves, those calls
  fail. Mitigation: keep n8n out of Meta webhook reach until Batch 4 + tests pass.

between_waves_step:
  description: |
    Mandatory inline step between Wave 1 and Wave 2 dispatch. Skipping causes Wave 2 subagents
    to fail assert-md-fresh.sh (exit 2) because their owned WFs' .md files lag live n8n after
    Wave 1 mutations.
  actions:
    - "scripts/export-all-workflows.sh — re-export all 7 Wave-1-touched WFs to workflows/*.json"
    - "python3 $PLUGIN/scripts/generate-workflow-md.py workflows docs/pseudocode — regenerate .md projections"
    - "git add workflows/ docs/pseudocode/*.md && git commit -m 'sprint: wave 1 landed, refresh .md projections' && git push"
    - "Then dispatch Wave 2"

dependency_conflicts_found:
  - "Original task list serializes all 18 P1 items via hard depends_on (DCP-010 → 011 → 020 → ... → 063), driven by ascending-blast-radius safety. Pre-live state removes that safety requirement."
  - "DCP-052 + DCP-062 both touch WF-33, WF-42, WF-46 — original plan serializes them via the unit-smoke gate between them. Reordered to put all three WFs into a single consumer-cluster subagent (Wave 2 Sub-13) that handles both router envelopes in one pass."
  - "DCP-020 touches 5 workflows (WF-60, WF-00, WF-50, WF-51, WF-10), each also touched by another item (DCP-040 WF-50 guard, DCP-030 WF-51 guard, DCP-060 WF-10 envelope). Original plan serializes via unit-smoke gates. Reordered so each workflow's edits across all items execute in a single subagent."
  - "ID TRANSCRIPTION ERRORS in design.md §3.4 / tasks.md (caught 2026-05-24 reviewer pass): (a) WF-44 listed as HB8nXudAtk9iXz7C — that's WF-31's; true WF-44 = Du2CJ3OTohRFZYoA. (b) WF-46 listed as se82n3MUQ9xE5aEr — that's WF-34's; true WF-46 = UV62An60fzflU0uD. Without fixing (b), sub-13 (cluster C: WF-32/33/42/46) and sub-14 (cluster D: WF-41/34) would have both attempted concurrent writes to WF-34 in Wave 2, violating the workflow-ownership invariant. Both fixed in plan and (2026-05-24T15:20Z) also in source tasks.md."
  - "ID TRANSCRIPTION ERROR #3 in state.md sub-7 / working.md / tasks.md TD-DCP-020 Files (caught 2026-05-24 build-sprint pre-mutation verification): WF-00 listed as 2U7mxHMyqA41ROKX — that's WF-47 (Unsubscribe Handler); true WF-00 (Webhook Receiver) = JQu1MkK5vgtUCeNO per live n8n + workflow-registry.md. Wave 1 sub-7 would have edited WF-47 instead of WF-00. Snapshot script WF_IDS array inherited the same error and was also fixed. Discovery surfaced when scripts/snapshot-for-sprint.sh reported '✓ WF-47 (2U7mxHMyqA41ROKX)' for a slot expected to be WF-00. Initial 24-WF snapshot at 2026-05-24/ was discarded and re-run with correct WF-00; ratio of WF-00 vs WF-47 in scope: WF-00 is the canonical Build WF-60 Payload (inbound) owner per design.md §2.6, WF-47 is not in Phase 1 scope at all."
  - "ID TRANSCRIPTION ERROR #4 in tasks.md TD-DCP-062 Files (caught same pass): WF-34 listed as '~workflow ID discovered live' placeholder — resolved to se82n3MUQ9xE5aEr per live n8n + workflow-registry.md. state.md sub-14 already had the correct ID; only the source spec had the unfilled placeholder."

priority_adjustments_confirmed: |
  User confirmed 2026-05-24:
    (a) reorder by workflow ownership (parallel waves);
    (b) keep all testing items out of build-sprint, move to testing.md;
    (c) Sonnet authorized for subagents this sprint (override of Haiku default).

parallel_waves:
  batch_1_foundation:
    mode: serial_inline
    items: [TD-DCP-001, TD-DCP-002]
    rationale: "Snapshot script must exist before snapshot can run; both must complete before any workflow edit per design.md §4.1 constraint 1."

  batch_2_wave_1:
    mode: subagent_parallel
    dispatch: "All 7 subagents dispatched concurrently via Agent calls with run_in_background=true. Main thread monitors via TaskOutput on 60s cadence; 2-min abort budget per subagent."
    model: sonnet
    subagent_target_pattern: "one subagent owns ALL edits on one workflow (no concurrent writes to the same WF JSON)"
    units:
      - sub_id: sub-1
        target_workflow: WF-52
        n8n_id: IO5BZLUxuVmjzk5I
        covers_items: [TD-DCP-010]
        scope_summary: "Add Validate Inputs entry-guard Code node as first node per design.md §2.5. Update WF-52.pseudo Inputs block."
      - sub_id: sub-2
        target_workflow: WF-60
        n8n_id: 6H75p935FpBVBQtV
        covers_items: [TD-DCP-020]
        scope_summary: "Add discriminated-union Validate Inputs entry-guard per design.md §2.6. Update WF-60.pseudo Inputs block."
      - sub_id: sub-3
        target_workflow: WF-50
        n8n_id: BUVun38WEKb12zg9
        covers_items: [TD-DCP-040, TD-DCP-020]
        scope_summary: "Add discriminated-union Validate Inputs entry-guard per design.md §2.3. Audit the Build WF-60 Payload outbound node — emit canonical WF-60 shape per §2.6 for transport=wa direction=outbound. Update WF-50.pseudo."
      - sub_id: sub-4
        target_workflow: WF-51
        n8n_id: wlZRK0YxnhP0b2RL
        covers_items: [TD-DCP-030, TD-DCP-020]
        scope_summary: "Add Validate Inputs entry-guard per design.md §2.4 (channelId regex + non-empty messageText). Audit the Build WF-60 Payload outbound node — emit canonical WF-60 shape for transport=slack direction=outbound. Update WF-51.pseudo."
      - sub_id: sub-5
        target_workflow: WF-01
        n8n_id: hYGNM97sXvdo1WmI
        covers_items: [TD-DCP-050]
        scope_summary: "Add 'Build WF-01 Envelope' Code node before the output branches. Emit the §2.1 core envelope on every branch (to WF-02 and direct to WF-21). Preserve existing 20-column users SELECT. Update WF-01.pseudo to declare emitted envelope."
      - sub_id: sub-6a
        target_workflow: WF-10
        n8n_id: wMh0oBRtJbvhLgOf
        covers_items: [TD-DCP-060]
        scope_summary: "Add 'Build WF-10 Command Envelope' (to WF-11) and 'Build WF-10 Relay Envelope' (to WF-41) Code nodes per §2.2. Update WF-10.pseudo for both envelopes. NO caller renames in this subagent — those land in sub-6b (Wave 2)."
        split_rationale: "Previously a single sub-6 covered envelopes + 6 Prepare renames + 1 Build WF-60 Payload rename — ~10 distinct mutations risked subagent budget overrun. Split into 6a (envelopes only, Wave 1) and 6b (caller renames, Wave 2). Safe because waves are sequential — no concurrent writes to WF-10."
      - sub_id: sub-7
        target_workflow: WF-00
        n8n_id: JQu1MkK5vgtUCeNO
        covers_items: [TD-DCP-020]
        scope_summary: "Rename Build WF-60 Payload node (transport=wa direction=inbound) to canonical shape per §2.6. Update WF-00.pseudo Inputs/Outputs blocks for the renamed node."

  batch_3_wave_2:
    mode: subagent_parallel
    depends_on_batch: 2
    pre_dispatch_step: "Run between_waves_step actions (export + .md regen + commit) before dispatching."
    dispatch: "All 8 subagents dispatched concurrently with run_in_background=true after Wave 1 confirms green. Defense-in-depth guards (WF-02, WF-11) require the router envelopes from Wave 1 to be live. Consumer cleanups require the envelope to exist so the removed Load-User SELECTs can be replaced with envelope reads."
    model: sonnet
    units:
      - sub_id: sub-6b
        target_workflow: WF-10
        n8n_id: wMh0oBRtJbvhLgOf
        covers_items: [TD-DCP-030, TD-DCP-020]
        scope_summary: "WF-10 caller renames (deferred from sub-6 split). Rename all 6 'Prepare WF-51 Payload …' nodes (Orphan Channel Alert, Wrong Channel Admin, Help Prompt, Wrong Channel User, Phone Absent, Phone Mismatch, Wrong State) to canonical {channelId, messageText, …}. Rename Build WF-60 Payload node to canonical shape (transport=slack direction=inbound). Update WF-10.pseudo to reflect the renamed callers. Builds on sub-6a's envelope additions (Wave 1)."
      - sub_id: sub-8
        target_workflow: WF-02
        n8n_id: PubCsNTOspF3xqXZ
        covers_items: [TD-DCP-051]
        scope_summary: "Add Validate Inputs entry-guard Code node as first node, validating the WF-01 envelope per §2.7. Update WF-02.pseudo."
      - sub_id: sub-9
        target_workflow: WF-11
        n8n_id: GoTYo0GS2y8qjjkw
        covers_items: [TD-DCP-061]
        scope_summary: "Add Validate Inputs entry-guard validating the WF-10 commandType envelope per §2.8. Validate all 8 commandType enum values. Update WF-11.pseudo."
      - sub_id: sub-10
        target_workflows: [WF-22]
        workflow_ids: [dr8QM0m92Ml8MvIh]
        covers_items: [TD-DCP-010, TD-DCP-052]
        scope_summary: "Two distinct edits on WF-22: (1) Caller alignment for WF-52 — rename phone_number→phoneNumber, userName→name in the 'Ensure Slack Channel Exists (WF-52)' Execute-Workflow node. (2) WF-01 envelope consumer audit — remove any redundant Load-User node, rewrite downstream references. Update WF-22.pseudo Inputs block."
      - sub_id: sub-11
        target_workflows: [WF-21, WF-23, WF-30, WF-31]
        workflow_ids: [zM8WbxSdt9nXRoLZ, VpCER0Vqq3NYJGpI, gGJBY5fJha0Let8I, HB8nXudAtk9iXz7C]
        covers_items: [TD-DCP-052, TD-DCP-040, TD-DCP-030]
        scope_summary: "Consumer cluster A — WF-01 envelope consumers. For each WF: audit per §3.4 — keep, simplify, or remove redundant Load-User nodes; rewrite downstream references to read from $('When Executed by Another Workflow').item.json.user.X (or .phoneNumber). In addition: WF-23 and WF-31 have payload-prep nodes for WF-50 (messageContent canonicalisation) and WF-51 (channelId/messageText canonicalisation) — rename per §2.3/§2.4. Update each .pseudo Inputs block. NOTE: WF-31 ID HB8nXudAtk9iXz7C confirmed via workflow-registry.md (the WF-31/WF-44 design.md collision was a transcription error on the WF-44 side — fixed in sub-12)."
      - sub_id: sub-12
        target_workflows: [WF-20, WF-40, WF-43, WF-44]
        workflow_ids: [LgIDj1v4ZbCPlX25, du32QBZbSQOjfESe, 3va0M06kijgyLejf, Du2CJ3OTohRFZYoA]
        covers_items: [TD-DCP-052, TD-DCP-040, TD-DCP-030]
        scope_summary: "Consumer cluster B — WF-01 envelope consumers. WF-44 (Du2CJ3OTohRFZYoA) — design.md §3.4 transcription error resolved: had listed WF-44's ID as HB8nXudAtk9iXz7C, which is actually WF-31's. Verified via workflow-registry.md. WF-43 and WF-44 have WF-50/WF-51 caller payload nodes — rename to canonical messageContent/channelId+messageText. Update each .pseudo."
      - sub_id: sub-13
        target_workflows: [WF-32, WF-33, WF-42, WF-46]
        workflow_ids: [emUOLWVZiNVxcOe3, NcHZedq9ycnAQ9SW, fx70vqyJtRdF2DgR, UV62An60fzflU0uD]
        covers_items: [TD-DCP-052, TD-DCP-062]
        scope_summary: "Consumer cluster C — workflows that consume BOTH the WF-01 envelope AND the WF-10 envelope. Confirmed Load-User SELECT removals per §3.4 table: WF-32 (Load User Channel from DB), WF-42 (Load User by Phone), WF-33 (Load User by Phone), WF-46 (Load User by Phone). Rewrite downstream references to envelope reads. Update each .pseudo. CAUTION: TD-DRIFT-017 (WF-33 verified_by column-semantics bug) is OUT of Phase 1 scope per design.md §1.5 — do NOT fix it here. ID-FIX: design.md/tasks.md transcription error — had listed WF-46 ID as se82n3MUQ9xE5aEr (which is actually WF-34's). True WF-46 ID = UV62An60fzflU0uD per workflow-registry.md (verified 2026-05-24 reviewer pass)."
      - sub_id: sub-14
        target_workflows: [WF-41, WF-34]
        workflow_ids: ["6PzJRZsF7k2d9hV7", "se82n3MUQ9xE5aEr"]
        covers_items: [TD-DCP-062, TD-DCP-040]
        scope_summary: "Consumer cluster D — WF-10 envelope consumers. WF-41: remove 'Load User for Relay' SELECT (confirmed in §3.4 table); also handles a WF-50 send (verify caller payload uses canonical messageContent). WF-34: audit per §3.4 — n8n ID is discovery-confirmed live (likely a sibling of WF-33). Update each .pseudo."

  batch_4_close:
    mode: serial_inline
    depends_on_batch: 3
    items: [TD-DCP-071, TD-DCP-072]
    rationale: "Documentation updates run inline on main thread after all build subagents land. Registry update reflects post-build state; memory captures the pattern. Both depend on Wave 2 completing — they do NOT depend on testing.md passing (which is run separately by the user)."

items:
  # ===== P0 Foundation (Batch 1, serial inline) =====
  - id: TD-DCP-001
    description: "Write snapshot + restore bash scripts"
    priority: P0
    status: done
    completed_at: 2026-05-24T14:57:15Z
    batch: 1
    execution_mode: serial_inline
    files: ["scripts/snapshot-for-sprint.sh", "scripts/restore-from-snapshot.sh"]
    change_type: workflow-create
    notes: "Both scripts pass bash -n. WF-52 fetch via API verified (auth + per-WF path OK). Restore dry-run path will be exercised once snapshot exists (TD-DCP-002)."

  - id: TD-DCP-002
    description: "Run pre-sprint snapshot"
    priority: P0
    status: done
    completed_at: 2026-05-24T15:20:19Z
    batch: 1
    execution_mode: serial_inline
    depends_on:
      - id: TD-DCP-001
        type: hard
        reason: "Scripts must exist before snapshot can be taken"
    change_type: documentation
    notes: "First snapshot attempt revealed WF-00↔WF-47 ID swap (sub-7 referenced 2U7mxHMyqA41ROKX which is WF-47, not WF-00). Discarded; re-ran with corrected WF_IDS array. Final snapshot at workflows/pre-data-contract-phase-1-workflows/2026-05-24/ contains all 24 in-scope WFs (verified one-by-one in run log). Restore dry-run verified for WF-52 (no node-name diff vs live). NOT yet committed to GitHub — handed off to next session."

  # ===== P0 Tests — MOVED TO testing.md, not in build-sprint =====
  - id: TD-DCP-003
    description: "Capture canonical-behaviour baseline via monitor-test-run"
    priority: P0
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction 2026-05-24 — out of build-sprint scope"

  - id: TD-DCP-004
    description: "Rollback drill via monitor-test-run"
    priority: P0
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction 2026-05-24 — out of build-sprint scope"

  # ===== P1 Build items (Batch 2 Wave 1 + Batch 3 Wave 2) =====
  - id: TD-DCP-010
    description: "WF-52 entry guard + WF-22 caller alignment"
    priority: P1
    status: pending
    batch: 2-and-3
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-1
        wave: 1
        target_workflow: WF-52
        scope: "Entry guard"
      - sub_id: sub-10
        wave: 2
        target_workflow: WF-22
        scope: "Caller payload rename (phone_number→phoneNumber, userName→name)"
    done_when: "Both sub-1 (Wave 1) AND sub-10 (Wave 2) complete and verified. Do NOT mark done after Wave 1."
    cross_wave_note: "Item spans both waves: WF-52 (Wave 1) and WF-22 (Wave 2)."
    change_type: structural

  - id: TD-DCP-011
    description: "Unit #2 smoke — WF-52"
    priority: P1
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction — superseded by parallel execution model"

  - id: TD-DCP-020
    description: "WF-60 entry guard + 4-caller payload audit"
    priority: P1
    status: pending
    batch: 2
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-2
        wave: 1
        target_workflow: WF-60
        scope: "Entry guard"
      - sub_id: sub-7
        wave: 1
        target_workflow: WF-00
        scope: "Build WF-60 Payload audit (wa inbound)"
      - sub_id: sub-3
        wave: 1
        target_workflow: WF-50
        scope: "Build WF-60 Payload audit (wa outbound)"
      - sub_id: sub-4
        wave: 1
        target_workflow: WF-51
        scope: "Build WF-60 Payload audit (slack outbound)"
      - sub_id: sub-6b
        wave: 2
        target_workflow: WF-10
        scope: "Build WF-60 Payload audit (slack inbound) — deferred from sub-6 split"
    change_type: structural

  - id: TD-DCP-021
    description: "Unit #3 smoke — WF-60"
    priority: P1
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction"

  - id: TD-DCP-030
    description: "WF-51 entry guard + ~14-caller payload audit"
    priority: P1
    status: pending
    batch: 2
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-4
        wave: 1
        target_workflow: WF-51
        scope: "Entry guard"
      - sub_id: sub-6b
        wave: 2
        target_workflow: WF-10
        scope: "6 Prepare WF-51 Payload renames (Orphan Channel Alert / Wrong Channel Admin / Help Prompt / Wrong Channel User / Phone Absent / Phone Mismatch / Wrong State) — deferred from sub-6 split"
      - sub_id: sub-11
        wave: 2
        target_workflows: [WF-23, WF-31]
        scope: "WF-51 caller payload renames within these consumer wfs"
      - sub_id: sub-12
        wave: 2
        target_workflows: [WF-43, WF-44]
        scope: "WF-51 caller payload renames within these consumer wfs"
    change_type: batch-surgical-plus-structural

  - id: TD-DCP-031
    description: "Unit #4 smoke — WF-51"
    priority: P1
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction"

  - id: TD-DCP-040
    description: "WF-50 entry guard + ~18-caller payload audit"
    priority: P1
    status: pending
    batch: 2
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-3
        wave: 1
        target_workflow: WF-50
        scope: "Entry guard (discriminated union: text / interactive / template)"
      - sub_id: sub-11
        wave: 2
        target_workflows: [WF-23, WF-31]
        scope: "WF-50 caller payload renames (legacy message/messageBody → messageContent; add explicit messageType:'text')"
      - sub_id: sub-12
        wave: 2
        target_workflows: [WF-43, WF-44]
        scope: "WF-50 caller payload renames"
      - sub_id: sub-14
        wave: 2
        target_workflows: [WF-41]
        scope: "WF-50 caller payload rename within admin-text relay"
    change_type: batch-surgical-plus-structural

  - id: TD-DCP-041
    description: "Unit #5 smoke — WF-50"
    priority: P1
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction"

  - id: TD-DCP-050
    description: "WF-01 envelope emission"
    priority: P1
    status: done
    completed_at: 2026-05-24T16:55:48Z
    batch: 2
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-5
        wave: 1
        target_workflow: WF-01
        scope: "Add Build WF-01 Envelope Code node emitting §2.1 core envelope on every output branch"
    change_type: structural

  - id: TD-DCP-051
    description: "WF-02 entry guard"
    priority: P1
    status: pending
    batch: 3
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-8
        wave: 2
        target_workflow: WF-02
        scope: "Entry guard validating WF-01 envelope"
    depends_on:
      - id: TD-DCP-050
        type: hard
        reason: "Guard validates the envelope WF-01 emits; Wave 1 must land first"
    change_type: structural

  - id: TD-DCP-052
    description: "WF-01 envelope-consumer audit + Type A cleanups"
    priority: P1
    status: pending
    batch: 3
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-10
        wave: 2
        target_workflow: WF-22
        scope: "Consumer audit"
      - sub_id: sub-11
        wave: 2
        target_workflows: [WF-21, WF-23, WF-30, WF-31]
        scope: "Consumer cluster A — audit + Type A cleanups"
      - sub_id: sub-12
        wave: 2
        target_workflows: [WF-20, WF-40, WF-43, WF-44]
        scope: "Consumer cluster B — audit + Type A cleanups (WF-44 confirmed Load User for Relay removal — verify ID against WF-31)"
      - sub_id: sub-13
        wave: 2
        target_workflows: [WF-32, WF-33, WF-42, WF-46]
        scope: "Consumer cluster C — confirmed Load-User SELECT removals + envelope rewrites"
    depends_on:
      - id: TD-DCP-051
        type: hard
        reason: "Defense-in-depth guard (WF-02) must protect consumers per design.md §3.4"
      - id: TD-DCP-050
        type: hard
        reason: "Envelope must exist for consumers to read from"
    change_type: batch-surgical-plus-documentation

  - id: TD-DCP-053
    description: "Unit #6 smoke — WF-01 envelope"
    priority: P1
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction"

  - id: TD-DCP-060
    description: "WF-10 envelope emission"
    priority: P1
    status: done
    completed_at: 2026-05-24T16:55:48Z
    batch: 2
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-6a
        wave: 1
        target_workflow: WF-10
        scope: "Add Build WF-10 Command Envelope (to WF-11) + Build WF-10 Relay Envelope (to WF-41) Code nodes per §2.2"
    change_type: structural

  - id: TD-DCP-061
    description: "WF-11 entry guard"
    priority: P1
    status: pending
    batch: 3
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-9
        wave: 2
        target_workflow: WF-11
        scope: "Entry guard validating WF-10 commandType envelope (8 enum values)"
    depends_on:
      - id: TD-DCP-060
        type: hard
        reason: "Guard validates the envelope WF-10 emits"
    change_type: structural

  - id: TD-DCP-062
    description: "WF-10 envelope-consumer audit + Type A cleanups"
    priority: P1
    status: pending
    batch: 3
    execution_mode: subagent_parallel
    execution_plan:
      - sub_id: sub-13
        wave: 2
        target_workflows: [WF-33, WF-42, WF-46]
        scope: "Consumer cluster C overlap — already audited for WF-01 envelope; re-audit for WF-10 envelope"
      - sub_id: sub-14
        wave: 2
        target_workflows: [WF-41, WF-34]
        scope: "Consumer cluster D — WF-41 confirmed Load User for Relay removal; WF-34 discovery-confirmed audit"
    depends_on:
      - id: TD-DCP-061
        type: hard
        reason: "Defense-in-depth guard (WF-11) must precede consumer cleanups"
      - id: TD-DCP-060
        type: hard
        reason: "Envelope must exist"
    change_type: batch-surgical-plus-documentation

  - id: TD-DCP-063
    description: "Unit #7 smoke — WF-10 envelope"
    priority: P1
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction"

  # ===== P2 Close (Batch 4, serial inline) =====
  - id: TD-DCP-070
    description: "Final regression via monitor-test-run"
    priority: P2
    status: obsolete
    obsolete_reason: "Testing moved to testing.md per user direction — runs after build-sprint exits"

  - id: TD-DCP-071
    description: "Update workflow-registry.md"
    priority: P2
    status: pending
    batch: 4
    execution_mode: serial_inline
    depends_on:
      - id: TD-DCP-062
        type: hard
        reason: "Registry should reflect final post-build state"
    files: ["docs/workflow-registry.md"]
    change_type: documentation

  - id: TD-DCP-072
    description: "Write feedback_data_contract_discipline.md memory"
    priority: P2
    status: pending
    batch: 4
    execution_mode: serial_inline
    depends_on:
      - id: TD-DCP-071
        type: soft
        reason: "Memory captures completed pattern"
    files: ["~/.claude/projects/.../memory/feedback_data_contract_discipline.md", "MEMORY.md"]
    change_type: documentation

# ===== Aggregate counts =====
counts:
  total_items: 23
  build_items_pending: 14
  testing_items_obsolete: 9
  batches: 4
  parallel_subagents_wave_1: 7
  parallel_subagents_wave_2: 8
  total_parallel_subagents: 15
  count_history:
    - "2026-05-24 initial: wave_1=7, wave_2=7, total=14 (counts block said 6/13 — off-by-one)"
    - "2026-05-25 reviewer fixes: sub-6 split into sub-6a (Wave 1, envelopes) + sub-6b (Wave 2, caller renames) → wave_1=7, wave_2=8, total=15"

# ===== Subagent dispatch reference (for build-sprint) =====
subagent_dispatch_protocol:
  per_subagent_brief_template: |
    You own all edits on workflow <WF-XX> (n8n ID <id>). Read:
    - docs/pseudocode/<WF-XX>.pseudo (design source of truth)
    - docs/pseudocode/<WF-XX>.md (AS-IS projection — run scripts/assert-md-fresh.sh first)
    - docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/design.md §<relevant sections>

    Scope: <subagent.scope_summary>

    Constraints:
      - Do NOT call mcp__n8n__* write tools yourself. Return a structured edit plan; parent applies via n8n MCP partial updates.
      - Do NOT touch any workflow other than <WF-XX>.
      - Do NOT add error handling beyond the entry guard pattern (per [[feedback_pseudo_tech_separation]]).
      - Pseudo updates: use linear Step 1..N numbering, no tombstones (per [[feedback_pseudo_linear_numbering]]).
      - typeVersion floor: if you author a new node, use the highest typeVersion already in the live WF for that .type (per [[feedback_typeversion_floor]]).

    Return:
      - JSON edit plan: { node_additions: [], node_modifications: [], node_removals: [], pseudo_diff: "..." }
      - One-paragraph rationale citing design.md sections.
      - List of any contract drift discovered (will be added to followups, not fixed in this sprint).

  parent_responsibilities:
    - "Dispatch all subagents in a single message with run_in_background=true (per [[feedback_parallel_subagent_background_dispatch]])"
    - "Monitor each subagent via Monitor tool on TaskOutput; 60s polling cadence; 2-min abort budget per subagent"
    - "Apply each subagent's edit plan to live n8n via mcp__n8n__n8n_update_partial_workflow"
    - "Verify each edit with re-fetch (per [[feedback_n8n_mcp_nested_array_update]] — nested-array updates may silently no-op)"
    - "Commit + push at end of each wave (per [[feedback_proactive_commit_push]])"

  model: sonnet
  model_rationale: "User authorized Sonnet for this sprint as a one-time override of the Haiku default (per CLAUDE.md subagent rule 6). Sonnet justified by: (1) n8n MCP edit-plan generation requires understanding multi-node coupling within a WF; (2) pseudo-file editing requires functional reasoning; (3) discovery of payload-prep node names within a WF requires pattern-recognition beyond Haiku reliability."

  abort_criteria:
    - "Subagent hits curl-blocking sandbox (per [[feedback_sandbox_exception_2026_05_17]]) — fall back to main-thread inline for that WF"
    - "Subagent budget overruns 2 min — TaskStop + reclassify as inline (per CLAUDE.md subagent rule 5)"
    - "Subagent returns ambiguous edit plan — main thread takes over, no second-attempt with same subagent"
```
