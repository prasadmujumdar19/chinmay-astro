---
slug: contract-first-sub-workflow-calls-design
input_source: docs/artefacts/specs/contract-first-sub-workflow-calls-design.md
input_hash: 2d8dbc530a507bfd9a179b798fb1f71fa24805d019f219175fa2fbe3d5d9c8e5
source_file_update: false
working_copy_path: docs/artefacts/sprints/contract-first-sub-workflow-calls-design/working.md
planned_at: 2026-05-23T13:47:04Z
last_updated: 2026-05-23T14:25:00Z
batch_1_execution_plan: "Mode D — parallel Haiku subagents per spec Decision #8. Initial dispatch was foreground (mistake — see [[feedback_parallel_subagent_background_dispatch]]); 12/14 recon JSONs produced. WF-21 + WF-22 subagents were denied (user rejected via permission prompt). Retry: 2 background subagents (run_in_background=true); both denied Write at the subagent boundary (see [[feedback_subagent_permission_preauth]]) but returned analysis as text; main thread wrote both recon JSONs from subagent results."
phase_a_complete_at: 2026-05-23T14:00:57Z
phase_a_bundles: "/tmp/claude-scratch/cfm-data/WF-XX/ (14 bundles, 48K-344K each)"
phase_b_complete_at: 2026-05-23T14:25:00Z
phase_b_v1_archive: docs/artefacts/sprints/contract-first-sub-workflow-calls-design/recon-v1/ (Haiku, schema-noncompliant)
phase_b_v2_complete_at: 2026-05-23T14:55:00Z
phase_b_v2_model: sonnet
phase_b_v2_schema: /tmp/claude-scratch/strict-recon-schema.md (strict-recon-schema spec, single source of truth)
phase_b_recon_snapshot: docs/artefacts/sprints/contract-first-sub-workflow-calls-design/recon/ (14 v2 JSONs, schema-compliant)
phase_c_built_at: 2026-05-23T14:55:00Z
phase_c_html: docs/artefacts/sprints/contract-first-sub-workflow-calls-design/phase-c-comparison.html
phase_c_findings: "17 total (9 td, 3 fd, 1 tc, 3 dp, 1 cmr). 7 WFs clean. Critical: WF-25 cmr is the messageText/messageContent bug breaking Gemini prompt for 3 callers. WF-60 subagent_notes flag a real bug — Done node hardcodes logged:true, masking skip-path."
deferred_at: 2026-05-23T15:00:00Z
deferred_reason: "Sprint parked at Phase C user-review gate. All 14 v2 recon JSONs landed; HTML comparison built at phase-c-comparison.html. Awaiting user verdict on WF-25 messageText/messageContent (3 callers broken — Sprint-1 documentation OR Sprint 2+ caller rename OR separate TD), WF-60 logged:true hardcode bug (out-of-scope for Sprint 1 doc-only; needs new TD), and routine td/dp dispositions for the other WFs."
deferred_marker: docs/artefacts/sprints/contract-first-sub-workflow-calls-design/_deferred
resume_instructions: "Re-run build-sprint @docs/artefacts/specs/contract-first-sub-workflow-calls-design.md. Step 1 reloads state.md. Step 1b reports resumption point. Next step is Phase C user verdict + Phase D pseudo writes."
planning_complete: true
parser_warnings: []
dependency_conflicts_found: []
priority_adjustments_confirmed: "n/a — no conflicts detected"
discover_current_state:
  ran_at: 2026-05-23T13:47:04Z
  evidence: docs/artefacts/sprints/contract-first-sub-workflow-calls-design/precheck-2026-05-23.md
  summary: "All 14 sub-WFs have exactly 1 executeWorkflowTrigger node. None obsolete on the 'no executeWorkflow entry' criterion. Brief's '~12-13' hedge was conservative."
items:
  - id: CFM-01
    description: "WF-02 Rule Router — Contract Manifest Reconciliation (Phase A bash gather → Phase B Haiku subagent reasoning → Phase C user review gate → Phase D pseudo write). Edits docs/pseudocode/WF-02.pseudo Inputs + Outputs sections only."
    wf_id: PubCsNTOspF3xqXZ
    wf_name: WF-02
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-02
    description: "WF-21 New User Welcome + Form — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-21.pseudo Inputs + Outputs sections only."
    wf_id: zM8WbxSdt9nXRoLZ
    wf_name: WF-21
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-03
    description: "WF-22 Form Response Handler — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-22.pseudo Inputs + Outputs sections only."
    wf_id: dr8QM0m92Ml8MvIh
    wf_name: WF-22
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-04
    description: "WF-25 Intent Classifier — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-25.pseudo Inputs + Outputs sections only."
    wf_id: eTV1lUcYrXBg2q2T
    wf_name: WF-25
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-05
    description: "WF-40 User -> Admin Relay — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-40.pseudo Inputs + Outputs sections only."
    wf_id: du32QBZbSQOjfESe
    wf_name: WF-40
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-06
    description: "WF-41 Admin -> User Relay — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-41.pseudo Inputs + Outputs sections only."
    wf_id: 6PzJRZsF7k2d9hV7
    wf_name: WF-41
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-07
    description: "WF-43 Post-Consultation Handler — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-43.pseudo Inputs + Outputs sections only."
    wf_id: 3va0M06kijgyLejf
    wf_name: WF-43
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-08
    description: "WF-45 Rebook Handler — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-45.pseudo Inputs + Outputs sections only."
    wf_id: MUG7rPgSHc7UtAE9
    wf_name: WF-45
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-09
    description: "WF-46 User Blocker — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-46.pseudo Inputs + Outputs sections only."
    wf_id: UV62An60fzflU0uD
    wf_name: WF-46
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-10
    description: "WF-47 Unsubscribe Handler — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-47.pseudo Inputs + Outputs sections only."
    wf_id: 2U7mxHMyqA41ROKX
    wf_name: WF-47
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-11
    description: "WF-50 Send WhatsApp — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-50.pseudo Inputs + Outputs sections only."
    wf_id: BUVun38WEKb12zg9
    wf_name: WF-50
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-12
    description: "WF-51 Send Slack Message — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-51.pseudo Inputs + Outputs sections only."
    wf_id: wlZRK0YxnhP0b2RL
    wf_name: WF-51
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-13
    description: "WF-52 Slack Channel Manager — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-52.pseudo Inputs + Outputs sections only."
    wf_id: IO5BZLUxuVmjzk5I
    wf_name: WF-52
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []
  - id: CFM-14
    description: "WF-60 Message Logger — Contract Manifest Reconciliation. Edits docs/pseudocode/WF-60.pseudo Inputs + Outputs sections only."
    wf_id: 6H75p935FpBVBQtV
    wf_name: WF-60
    priority: P1
    change_type: Documentation
    status: in-progress
    phase_b_started_at: 2026-05-23T14:00:57Z
    batch: 1
    depends_on: []

shared_recipe:
  reference: docs/artefacts/specs/contract-first-sub-workflow-calls-design.md#32-per-item-recipe
  phases:
    A: "Single bash script gathers live.json + last 5 successful integrated executions (includeData=true) + callers.json + caller-payloads.json + existing-pseudo.md for all 14 WFs into /tmp/claude-scratch/cfm-data/WF-XX/. Token cost: exit status only."
    B: "Up to 14 parallel Haiku subagents dispatched in one message. Each reads its bundle, produces /tmp/claude-scratch/cfm-recon/WF-XX-recon.json per the schema in the spec. Per-subagent 2-min abort budget; fall back to inline reconciliation for any that exceed."
    C: "Main thread renders 14-row comparison table (Existing Input / Revised Input / Existing Output / Revised Output / Findings). User approves all, approves with edits, or defers specific WFs to needs-decision."
    D: "Approved WFs get pseudo Inputs + Outputs sections updated via Edit calls. pseudo-md-drift-check run against updated files; D8 + D9 must be clean."
  findings_file: docs/artefacts/sprints/contract-first-sub-workflow-calls-design/followups.md
