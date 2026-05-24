---
slug: 2026-05-18-canonical-executeworkflow-shape-sweep
input_source: docs/artefacts/plans/2026-05-18-canonical-executeworkflow-shape-sweep.md
input_hash: c7adf059a8f94100a833061ae768688ebf5ca282c52b6bb89d026315a210606c
source_file_update: false
working_copy_path: docs/artefacts/sprints/2026-05-18-canonical-executeworkflow-shape-sweep/working.md
planned_at: 2026-05-18T00:50:00Z
last_updated: 2026-05-18T01:35:00Z
batch_1_status: "Verified end-to-end by user smoke test. P0 complete (all 10 items done)."
commit_strategy: "Bulk commit at sprint end (commit 5a7bc00, 62 files). Pushed to main."
planning_complete: true
dependency_conflicts_found: []
priority_adjustments_confirmed: "WF-31 and WF-25 scheduled first in Batch 1: WF-31 is the live smoke-test resume blocker (phone 61466927921 in payment_submitted state); WF-25 is the critical-path callee. User-suggested batching from plan retained — verified mutually independent (each item modifies one workflow, idempotent jq transform; broken pattern is in caller node shape so callee fix order doesn't matter)."
discovery_verification:
  performed_at: 2026-05-18T00:44:00Z
  outcome: "All 26 nodes across 10 workflows still match broken pattern in live n8n. No items obsoleted by UI hot-fixes. User's noted UI fixes (WF-32, WF-22) are not on this sprint's list."
items:
  - id: WF-31
    description: "Payment Submitted Handler — canonical roll: Call WF-25 Intent Classifier, Send Under Review via WF-50, Relay to Admin Slack, Call WF-47 Unsubscribe"
    workflow_uuid: HB8nXudAtk9iXz7C
    nodes_affected: 4
    priority: P0
    status: done
    completed_at: 2026-05-18T00:55:00Z
    batch: 1
    verification: "Send free-form text from 61466927921 (state=payment_submitted) — expect WF-25 intent classification + Under Review WA + Slack relay."
    depends_on: []
  - id: WF-25
    description: "Intent Classifier — canonical roll: Send Garbage Warning, Notify Admin of Garbage, Send Block Warning, Auto-Block via WF-46"
    workflow_uuid: eTV1lUcYrXBg2q2T
    nodes_affected: 4
    priority: P0
    status: done
    completed_at: 2026-05-18T00:57:00Z
    batch: 1
    verification: "Critical-path. Send one free-form intent (any state that routes through WF-25) — expect intent classification + downstream action."
    depends_on: []
  - id: WF-23
    description: "Pre-Form Intent Filter — canonical roll: Call WF-25 Intent Classifier, Re-send Flow Form via WF-50, Call WF-47 Unsubscribe"
    workflow_uuid: VpCER0Vqq3NYJGpI
    nodes_affected: 3
    priority: P0
    status: done
    completed_at: 2026-05-18T01:10:00Z
    batch: 2
    depends_on: []
  - id: WF-30
    description: "Payment Pending Intent Filter — canonical roll: Call WF-25 Intent Classifier, Send Payment Reminder via WF-50, Call WF-47 Unsubscribe"
    workflow_uuid: gGJBY5fJha0Let8I
    nodes_affected: 3
    priority: P0
    status: done
    completed_at: 2026-05-18T01:10:00Z
    batch: 2
    depends_on: []
  - id: WF-45
    description: "Rebook Handler — canonical roll: Send Payment Instructions"
    workflow_uuid: MUG7rPgSHc7UtAE9
    nodes_affected: 1
    priority: P0
    status: done
    completed_at: 2026-05-18T01:10:00Z
    batch: 2
    depends_on: []
  - id: WF-12
    description: "Admin -> WhatsApp Relay — canonical roll: Call WF-50 Send WhatsApp"
    workflow_uuid: RjwHs9Dx5cK8Q5wD
    nodes_affected: 1
    priority: P0
    status: done
    completed_at: 2026-05-18T01:10:00Z
    batch: 3
    depends_on: []
  - id: WF-20
    description: "Keyword Handler — canonical roll: Send HELP Response, Route to Rebook, Call WF-47 Unsubscribe"
    workflow_uuid: LgIDj1v4ZbCPlX25
    nodes_affected: 3
    priority: P0
    status: done
    completed_at: 2026-05-18T01:10:00Z
    batch: 3
    depends_on: []
  - id: WF-40
    description: "User -> Admin Relay — canonical roll: Call WF-51 (Post to Slack)"
    workflow_uuid: du32QBZbSQOjfESe
    nodes_affected: 1
    priority: P0
    status: done
    completed_at: 2026-05-18T01:10:00Z
    batch: 3
    depends_on: []
  - id: WF-44
    description: "Feedback Recorder — canonical roll: Call WF-25 Intent Classifier, Call WF-45 Rebook, Send Ack via WF-50, Call WF-47 Unsubscribe"
    workflow_uuid: Du2CJ3OTohRFZYoA
    nodes_affected: 4
    priority: P0
    status: done
    completed_at: 2026-05-18T01:10:00Z
    batch: 3
    depends_on: []
  - id: WF-47
    description: "Unsubscribe Handler — canonical roll: Send Hold Message via WF-50, Send Opt-out Confirmation via WF-50. Note: nodes at tv=1.0 (older than rest); jq roller auto-bumps to 1.2."
    workflow_uuid: 2U7mxHMyqA41ROKX
    nodes_affected: 2
    priority: P0
    status: done
    completed_at: 2026-05-18T01:10:00Z
    batch: 3
    depends_on: []
  - id: POST-1
    description: "Bulk export all live workflows to workflows/*.json (scripts/export-all-workflows.sh) — overrides any stale local/GitHub copies (user noted UI-only fixes on WF-32, WF-22, etc. not yet exported)."
    priority: P1
    status: done
    completed_at: 2026-05-18T01:35:00Z
    batch: 4
    depends_on:
      - id: WF-47
        type: hard
        reason: "Must run after every workflow fix lands so exports reflect final state."
  - id: POST-2
    description: "Generate .md companion docs for each workflow JSON (one .md per workflows/*.json) summarising trigger, nodes, callers/callees. Format to be confirmed at execution time."
    priority: P1
    status: done
    completed_at: 2026-05-18T01:35:00Z
    batch: 4
    depends_on:
      - id: POST-1
        type: hard
        reason: "Doc generation reads from the exported JSON files."
  - id: POST-3
    description: "Single git commit + push: workflows/*.json + companion .md files + dependency-map regeneration + this sprint's artefacts."
    priority: P1
    status: done
    completed_at: 2026-05-18T01:35:00Z
    batch: 4
    depends_on:
      - id: POST-2
        type: hard
        reason: "Commit must include the .md files generated in POST-2."
