```yaml
slug: data-contract-sprint-bug-fix
input_source: docs/artefacts/sprints/data-contract-sprint-bug-fix/tasks.md
input_hash: 3a3f16876e4b6da8524988443085901d4ead6fdd0eae4c3a69676b3c8c80629a
source_file_update: false
working_copy_path: docs/artefacts/sprints/data-contract-sprint-bug-fix/working.md
planned_at: 2026-05-25T04:08:26Z
last_updated: 2026-05-25T04:08:26Z
planning_complete: true

discover_current_state:
  ran_at: 2026-05-25T04:08:26Z
  result: "all 10 verifiable items STILL NEEDED; 3 items (TD-DCP-106/108/109) not n8n-verifiable (new workflow build, doc-only, test re-verification); zero obsoletes detected"

dependency_conflicts_found: []
priority_adjustments_confirmed: "no conflicts — natural P0→P1→P2 ordering with same-workflow sibling sequencing within batches"

excluded_from_execution:
  reason: "section 'Plugin / skill follow-ups' contains plugin-level improvements (TD-DCP-PLG-001/002/003), not sprint items; section 'Reviewed — No Action' (CC-01, CC-05) is audit trail only"
  items: [TD-DCP-PLG-001, TD-DCP-PLG-002, TD-DCP-PLG-003, CC-01, CC-05]

items:
  # ───────── Batch 1 — P0 Blockers ─────────
  - id: TD-DCP-101
    description: "WF-01 slackChannelId not mapped in Prepare User Data"
    priority: P0
    status: pending
    batch: 1
    change_type: Surgical
    workflows: [WF-01]
    n8n_ids: [hYGNM97sXvdo1WmI]
    depends_on: []

  - id: TD-DCP-111
    description: "WF-10 Load User Status SELECT missing slack_channel_id and current_consultation_id"
    priority: P0
    status: pending
    batch: 1
    change_type: Surgical
    workflows: [WF-10]
    n8n_ids: [wMh0oBRtJbvhLgOf]
    depends_on: []

  # ───────── Batch 2 — P1 independents (no WF-26 chain coupling) ─────────
  - id: TD-DCP-102
    description: "WF-60 slackMessageTs enforcement scope — align to design.md plain reading"
    priority: P1
    status: pending
    batch: 2
    change_type: Surgical+Documentation
    workflows: [WF-60]
    n8n_ids: [6H75p935FpBVBQtV]
    depends_on: []
    caller_compliance_audit: "verify WF-10 Slack-inbound + WF-51 Slack-outbound pass slackMessageTs today before tightening guard (per item caller-compliance note)"

  - id: TD-DCP-104
    description: "WF-20 Normalize Keyword drops userStatus — WF-47 STOP path orphans consultation row (TD-DRIFT-006)"
    priority: P1
    status: pending
    batch: 2
    change_type: Surgical+Documentation
    workflows: [WF-20]
    n8n_ids: [LgIDj1v4ZbCPlX25]
    depends_on: []

  - id: TD-DCP-112
    description: "WF-33 Extract Command Data writes channelId to payments.verified_by (TD-DRIFT-017)"
    priority: P1
    status: pending
    batch: 2
    change_type: Surgical
    workflows: [WF-33]
    n8n_ids: [NcHZedq9ycnAQ9SW]
    depends_on: []

  - id: TD-DCP-113
    description: "WF-47 atomicity — opt-out UPDATE fires before consultation close (TD-DRIFT-007)"
    priority: P1
    status: pending
    batch: 2
    change_type: Structural
    workflows: [WF-47]
    n8n_ids: [2U7mxHMyqA41ROKX]
    depends_on:
      - id: TD-DCP-104
        type: soft
        reason: "complementary orphan-row coverage; both close TD-DRIFT-006/007 class — landing in same batch avoids partial coverage gap"

  # ───────── Batch 3 — P1 WF-26 chain (BUG-NEW-02 fix) ─────────
  - id: TD-DCP-105
    description: "WF-01 opted-out branch — load full user row + emit §2.1 envelope (forward-positioning for WF-26)"
    priority: P1
    status: pending
    batch: 3
    change_type: Structural
    workflows: [WF-01]
    n8n_ids: [hYGNM97sXvdo1WmI]
    depends_on:
      - id: TD-DCP-101
        type: soft
        reason: "same-workflow sibling (WF-01); 101 lands in earlier P0 batch — 105 picks up clean WF-01 state"

  - id: TD-DCP-106
    description: "WF-26 Re-Engaged Opted-Out User Handler — build new sub-workflow"
    priority: P1
    status: pending
    batch: 3
    change_type: Workflow-Create
    workflows: [WF-26]
    n8n_ids: []
    design_gate: true
    design_questions:
      - "Q1 — re-entry status target: consultation_closed | new transient re_engaged state | restore prior pre-opt-out status"
      - "Q2 — first-message handling: ack-only | forward through WF-25 intent classifier | call WF-02 to re-enter state router"
      - "Q3 — welcome-back wording: name personalization yes/no"
      - "Q4 — edge: opted out from payment_submitted — different welcome wording or unified?"
      - "Q5 — WF-26 input contract: confirm mirrors §2.1 envelope + wasOptedOut:true; add as design.md §2.X sub-section"
    depends_on:
      - id: TD-DCP-105
        type: hard
        reason: "WF-26 reads from §2.1 envelope populated by 105's opted-out branch fix; without 105, WF-26 must re-SELECT (violates §2.1 layered-envelope principle)"

  - id: TD-DCP-107
    description: "WF-01 opted-out branch — rewire call from WF-21 to WF-26"
    priority: P1
    status: pending
    batch: 3
    change_type: Surgical
    workflows: [WF-01]
    n8n_ids: [hYGNM97sXvdo1WmI]
    depends_on:
      - id: TD-DCP-105
        type: hard
        reason: "envelope expansion must land first/simultaneously"
      - id: TD-DCP-106
        type: hard
        reason: "WF-26 must exist before rewire activates it"

  - id: TD-DCP-109
    description: "TC-0607 re-verification — opted_out re-engagement now routes through WF-26"
    priority: P1
    status: pending
    batch: 3
    change_type: Documentation+Verification
    workflows: []
    n8n_ids: []
    depends_on:
      - id: TD-DCP-105
        type: hard
        reason: "test verifies envelope shape"
      - id: TD-DCP-106
        type: hard
        reason: "test verifies WF-26 behaviour"
      - id: TD-DCP-107
        type: hard
        reason: "test verifies WF-01 → WF-26 routing"

  # ───────── Batch 4 — P2 Nit-tier ─────────
  - id: TD-DCP-108
    description: "Cross-doc sync — CLAUDE.md state machine + workflow-registry.md + user_journey_map.html for WF-26 rollout"
    priority: P2
    status: pending
    batch: 4
    change_type: Documentation
    workflows: []
    n8n_ids: []
    depends_on:
      - id: TD-DCP-106
        type: hard
        reason: "design Q1 outcome decides re-entry status wording for state machine + journey-map pill"
      - id: TD-DCP-107
        type: hard
        reason: "WF-26 n8n ID assigned at 106 creation, needed for registry row"

  - id: TD-DCP-110
    description: "WF-21 — add Validate Inputs entry guard (consistency hygiene post-WF-26 rewire)"
    priority: P2
    status: pending
    batch: 4
    change_type: Surgical+Documentation
    workflows: [WF-21]
    n8n_ids: [zM8WbxSdt9nXRoLZ]
    depends_on:
      - id: TD-DCP-107
        type: soft
        reason: "best landed AFTER 107 so guard reflects WF-21's narrowed contract (only new-user path)"

  - id: TD-DCP-103
    description: "WF-52 Prepare Channel Name emits userName: key + dead-code legacy fallbacks"
    priority: P2
    status: pending
    batch: 4
    change_type: Surgical
    workflows: [WF-52]
    n8n_ids: [IO5BZLUxuVmjzk5I]
    depends_on: []

batch_summary:
  batch_1:
    priority: P0
    items: 2
    estimated_cost: ~12K
    description: "Live-blocking SELECT/mapping fixes — unblocks smoke testing"
  batch_2:
    priority: P1
    items: 4
    estimated_cost: ~30K
    description: "Independent P1 fixes (WF-60/WF-20/WF-33/WF-47 atomicity)"
  batch_3:
    priority: P1
    items: 4
    estimated_cost: ~50K
    description: "WF-26 build chain — BUG-NEW-02 fix; build-sprint MUST pause at TD-DCP-106 for design session (5 open questions)"
  batch_4:
    priority: P2
    items: 3
    estimated_cost: ~13K
    description: "Cross-doc sync + WF-21 entry guard + WF-52 hygiene"

parser_warnings: []

plugin_followups_observed:
  - id: TD-DCP-PLG-001
    skill: dispatching-subagents
    description: "Add upstream-mapping audit step to subagent envelope-build briefs"
  - id: TD-DCP-PLG-002
    skill: technical-workflow-review (or functional-code-review)
    description: "Add forward-traceability scan to sibling-regression pattern"
  - id: TD-DCP-PLG-003
    skill: functional-code-review + technical-workflow-review
    description: "Review subagents must diff against pre-sprint snapshot, not historical state"
  note: "These are plugin-skill improvements, excluded from sprint execution; will be flushed via flush-plugin-improvements at sprint close."
```
