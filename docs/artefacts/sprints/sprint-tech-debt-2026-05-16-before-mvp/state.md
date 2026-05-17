slug: sprint-tech-debt-2026-05-16-before-mvp
input_source: docs/sprint-tech-debt-2026-05-16-before-MVP.md
input_hash: e29d6de4b7bccd1c62c96b692b03acb96a479b60c0043defc45d7bdd19446a89
source_file_update: false
working_copy_path: .methodology/sprint-sprint-tech-debt-2026-05-16-before-mvp-working.md
planned_at: 2026-05-16T00:00:00Z
last_updated: 2026-05-16T00:00:00Z
planning_complete: true
dependency_conflicts_found: []
priority_adjustments_confirmed: "No conflicts. P0+P1 combined into Batch 1 (10K total). P2 split: surgical items Batch 2, structural verify-gate items Batch 3."
items:
  - id: TC-0304
    description: WF-34 missing user status reset on payment rejection
    priority: P0
    status: done
    done_at: 2026-05-16T00:00:00Z
    batch: 1
    depends_on: []
    note: "Added Reset User Status to payment_pending Postgres node after Update Payment Record in WF-34. Flow: Update Payment Record → Reset User Status → Prepare Rejection Message."

  - id: TC-0102
    description: WF-01 non-text message silently dropped with no deflection
    priority: P1
    status: done
    done_at: 2026-05-16T00:00:00Z
    batch: 1
    depends_on: []
    note: "Added Send Non-Text Deflection via WF-50 executeWorkflow node. Silent Reject (Message Type) now routes to WF-50 with message: 'Please send text messages only. Images and audio are not supported.'"

  - id: WF-25-VERIFY
    description: Verify phoneNumber wiring in all WF-25 callers (WF-23, WF-30, WF-31)
    priority: P1
    status: obsolete
    obsolete_reason: "Live verification confirmed all three callers already pass phoneNumber in workflowInputs — WF-23 inputs: [phoneNumber, userId, messageText, userStatus]; WF-30: same; WF-31: same."
    batch: null
    depends_on: []

  - id: TD-NEW-012
    description: WF-50 hardcoded Meta phone-number-id in HTTP Request URL
    priority: P2
    status: obsolete
    batch: 2
    depends_on: []
    obsolete_reason: "Accepted as-is by design decision. Phone-number-id is a non-sensitive routing identifier — not a credential, not expected to change. VPS env var setup + container restart adds operational complexity for no meaningful benefit. Only residual risk: if WABA number ever changes, WF-50 HTTP URL must be updated manually — low probability, trivial to fix if it occurs."

  - id: TD-NEW-016
    description: No retry/timeout on WF-50, WF-22 encryption call, WF-43
    priority: P2
    status: obsolete
    obsolete_reason: "Live verification: WF-50 both HTTP nodes have retryOnFail=True, maxTries=3, timeout=10000; WF-43 Gemini node same; WF-22 encryption-svc HTTP node was removed in a prior batch."
    batch: null
    depends_on: []

  - id: TD-NEW-018
    description: messages.created_at is timestamp without time zone
    priority: P2
    status: obsolete
    obsolete_reason: "Live Postgres check: messages.created_at is already timestamptz (data_type: timestamp with time zone). ALTER TABLE was applied in a prior session."
    batch: null
    depends_on: []

  - id: WF-23-STOP
    description: WF-23 missing stop_intent branch
    priority: P2
    status: done
    done_at: 2026-05-16T00:00:00Z
    batch: 3
    depends_on: []
    note: "Added 4th condition (stop_intent != stop_intent) to Is Pass-Through Intent? IF node. Added Is Stop Intent? + Call WF-47 Unsubscribe on false branch. Mirrors WF-30 pattern exactly."

  - id: WF-44-STOP
    description: WF-44 missing stop_intent branch
    priority: P2
    status: done
    done_at: 2026-05-16T00:00:00Z
    batch: 3
    depends_on: []
    note: "Inserted Is Stop Intent? IF node between Is Rebook Intent? false branch and Save Feedback to DB. Added Call WF-47 Unsubscribe on stop_intent true path. Genuine feedback still reaches Save Feedback to DB via false branch."

  - id: WF-60-CLEANUP
    description: WF-60 dead legacy node deletion (6 disconnected nodes)
    priority: P2
    status: done
    done_at: 2026-05-16T00:00:00Z
    batch: 2
    depends_on: []
    note: "Deleted 5 dead legacy nodes (Inbound/Outbound Prepare Log Entry, Inbound/Outbound Log Message, Get User ID). Sprint doc said 6 — live BFS confirmed 5 unreachable; the old Done node was already wired into the active path in a prior batch."

  - id: TC-0305-DOC
    description: Document channel-reuse design (no n8n changes)
    priority: P3
    status: done
    done_at: 2026-05-16T00:00:00Z
    batch: 4
    depends_on: []
    note: "Updated J-11 in user_journey_map.html (removed 'Archive Slack channel', added channel-reuse note, updated footer tag). Added Design Rule 10 to CLAUDE.md. Updated WF-42 and WF-45 entries in workflow-registry.md with channel-reuse cross-reference."
