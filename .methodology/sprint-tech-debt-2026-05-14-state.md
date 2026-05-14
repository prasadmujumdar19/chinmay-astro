---
slug: tech-debt-2026-05-14
input_source: docs/Tech_Debt_2026-05-14.md
input_hash: 84d4a1cf4223269c25845ce68367e3b3b110660ea09648bdd820efb7bc5a3816
source_file_update: false
working_copy_path: .methodology/sprint-tech-debt-2026-05-14-working.md
started: 2026-05-14T00:00:00Z
last_updated: 2026-05-14T02:00:00Z
planning_complete: true
dependency_conflicts_found:
  - "STATUS-TD-01 (Critical/P0-infra) and STATUS-TD-02 (High/P0-infra) require VPS SSH access — cannot batch with n8n workflow items; included as needs-decision in Batch 1"
  - "TD-NEW-008 (P1) has hard dependency on TD-NEW-003 (P0) — resolved by priority ordering"
  - "TD-NEW-002 and TD-NEW-004 both modify WF-01/WF-02 routing — sequential execution required (TD-NEW-002 first)"
priority_adjustments_confirmed: "STATUS TD-01/02 treated as P0_infra needs-decision; TD-NEW-011 marked needs-decision per user; TD-NEW-017/STATUS-TD-03/STATUS-TD-04 marked obsolete per user"
items:

  # ── P0 Batch 1 ──────────────────────────────────────────────────────────────

  - id: TD-NEW-001
    description: GitHub PAT stored in ~/.claude/settings.json — synced via Google Drive
    priority: P0
    status: blocked
    batch: 1
    blocked_reason: "User deferred 2026-05-14 — track as open. Requires manual PAT rotation + `gh auth login` outside this codebase. Re-surface post-go-live."
    completed: null
    depends_on: []

  - id: TD-NEW-002
    description: WF-01 opted-out routing dead — opted-out users can never re-engage
    priority: P0
    status: done
    batch: 1
    completed: 2026-05-14T00:00:00Z
    depends_on:
      - id: TD-NEW-004
        type: soft
        reason: "same-workflow siblings — both modify WF-01/WF-02 routing; TD-NEW-002 first (fixes blacklist logic), TD-NEW-004 second (wires WF-20)"

  - id: TD-NEW-003
    description: WF-25 Intent Classifier cannot emit stop_intent — all stop_intent branches are dead code
    priority: P0
    status: done
    batch: 1
    completed: 2026-05-14T00:00:00Z
    depends_on:
      - id: TD-NEW-011
        type: soft
        reason: "same-workflow siblings — both modify WF-25; TD-NEW-003 first (adds stop_intent to prompt/whitelist), TD-NEW-011 later in P1"

  - id: TD-NEW-004
    description: WF-20 Keyword Handler is never called — STOP/HELP/REBOOK keywords broken
    priority: P0
    status: done
    batch: 1
    completed: 2026-05-14T00:00:00Z
    depends_on:
      - id: TD-NEW-002
        type: soft
        reason: "same-workflow siblings — both modify WF-01/WF-02 routing; TD-NEW-002 must run first"

  - id: STATUS-TD-01
    description: Mumbai VPS full security hardening (CF Tunnel, Docker port isolation, SSH key-only, Linode firewall, stale DNS cleanup)
    priority: P0
    status: blocked
    batch: 1
    blocked_reason: "User deferred 2026-05-14 — defer to post-go-live. Smoke test first; harden before traffic. Re-surface as separate infra sprint."
    completed: null
    depends_on: []

  - id: STATUS-TD-02
    description: Automated daily DB backups (pg_dump → Linode storage volume + Google Drive copy)
    priority: P0
    status: blocked
    batch: 1
    blocked_reason: "User deferred 2026-05-14 — defer to post-go-live. Low data-loss risk pre-launch. Bundle with STATUS-TD-01 infra sprint."
    completed: null
    depends_on: []

  # ── P1 Batch 2 ──────────────────────────────────────────────────────────────

  - id: TD-NEW-005
    description: WF-10 commandKeywords missing UNBLOCK — admin UNBLOCK relayed as plain text
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-14T01:43:00Z
    depends_on:
      - id: TD-NEW-020
        type: soft
        reason: "same-workflow siblings — both modify WF-10; TD-NEW-005 first (Batch 2), TD-NEW-020 in Batch 4"

  - id: TD-NEW-006
    description: WF-32 active=false — verify intentional before go-live
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-14T01:46:00Z
    note: "Activated. Caller WF-02 (critical path) calls WF-32 on payment_completed button tap. Peer sub-workflows WF-25/50/51 all active. Inactive state was inconsistent and would block payment confirmation."
    depends_on: []

  - id: TD-NEW-007
    description: WF-40 Active Consultation Relay has no STOP intercept
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-14T01:56:00Z
    note: "Added IF 'Is STOP Intercept' between trigger and Load User Record. True branch → Prepare J-19 Response → Call WF-50. Used update_full_workflow per executeWorkflowTrigger removeConnection limitation."
    depends_on: []

  - id: TD-NEW-008
    description: WF-43 Post-Consultation Handler has no stop_intent branch
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-14T02:01:00Z
    note: "Added 'Stop Intent?' IF + 'Call WF-47 Unsubscribe' executeWorkflow node. Wired: WF-25 → Stop Intent? → (true → WF-47, false → existing Rebook Intent? chain)."
    depends_on:
      - id: TD-NEW-003
        type: hard
        reason: "WF-43 stop_intent branch is unreachable until WF-25 can emit stop_intent — explicit dependency stated in source"
      - id: TD-NEW-016
        type: soft
        reason: "same-workflow siblings — both modify WF-43; TD-NEW-008 first (Batch 2), TD-NEW-016 in Batch 4"

  - id: TD-NEW-009
    description: WF-22 'User Already Exists' branch sends empty workflowInputs to WF-50
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-14T01:53:00Z
    note: "Updated 'User Already Exists' Code node to emit phoneNumber + messageType=text + messageBody re-engagement message. WF-50 picks up via $json (empty workflowInputs is fine — pass-through pattern)."
    depends_on:
      - id: TD-NEW-014
        type: soft
        reason: "same-workflow siblings — both modify WF-22; run sequentially to avoid concurrent update conflicts"
      - id: TD-NEW-016
        type: soft
        reason: "same-workflow siblings — TD-NEW-016 also modifies WF-22 enc call; Batch 4 comes after Batch 2"

  - id: TD-NEW-010
    description: WF-11 STATS command unroutable — outputKey mismatch STATUS vs STATS
    priority: P1
    status: done
    batch: 2
    completed: 2026-05-14T01:50:00Z
    note: "Actual bug was Switch Rule 5 rightValue='STATUS' (not outputKey). Fixed both rightValue and outputKey to 'STATS'. Connection at index 5 already wired to 'Get Stats' node."
    depends_on: []

  - id: TD-NEW-011
    description: WF-25 passes userStage which is always null — classifier noise
    priority: P1
    status: done
    batch: 2
    decision_made: "Option A — user confirmed 2026-05-14 after investigation: userStage is vestigial dead-weight (no consumer, no planned use). Removed via Batch Surgical."
    completed: 2026-05-14T02:08:00Z
    note: "Batch Surgical: removed userStage from WF-25 prompt + destructure, and from workflowInputs in 5 callers (WF-23, WF-30, WF-31, WF-43, WF-44)."
    depends_on:
      - id: TD-NEW-003
        type: soft
        reason: "same-workflow siblings — both modify WF-25; TD-NEW-003 runs in P0 Batch 1 first"

  # ── P2 Batch 3 (hygiene part 1 — lower risk) ────────────────────────────────

  - id: TD-NEW-013
    description: WF-60 writes orphan rows with fake userId=9, consultationId=2 as fallbacks
    priority: P2
    status: pending
    batch: 3
    completed: null
    depends_on: []

  - id: TD-NEW-014
    description: WF-22 has 7 disabled stale nodes including schema-prefix regression hazard
    priority: P2
    status: pending
    batch: 3
    completed: null
    depends_on:
      - id: TD-NEW-009
        type: soft
        reason: "same-workflow siblings — both modify WF-22; TD-NEW-009 runs in Batch 2 first"

  - id: TD-NEW-015
    description: WF-00 has 7 disabled nodes on active webhook path
    priority: P2
    status: pending
    batch: 3
    completed: null
    depends_on:
      - id: TD-NEW-020
        type: soft
        reason: "same-workflow siblings — both modify WF-00; TD-NEW-015 first (Batch 3 delete disabled nodes), TD-NEW-020 in Batch 4 (add HMAC)"

  - id: TD-NEW-019
    description: n8n execution history grows indefinitely — no pruning configured
    priority: P2
    status: pending
    batch: 3
    completed: null
    depends_on: []

  - id: STATUS-TD-05
    description: Encryption service container monitoring (health check, restart policy)
    priority: P2
    status: pending
    batch: 3
    completed: null
    depends_on: []

  # ── P2 Batch 4 (hygiene part 2 — higher risk / structural) ──────────────────

  - id: TD-NEW-012
    description: WF-50 Meta phone-number-id hard-coded in URL
    priority: P2
    status: pending
    batch: 4
    completed: null
    depends_on: []

  - id: TD-NEW-016
    description: No retry/timeout on external HTTP nodes in WF-50, WF-22 encryption call, WF-43
    priority: P2
    status: pending
    batch: 4
    completed: null
    depends_on:
      - id: TD-NEW-009
        type: soft
        reason: "same-workflow siblings — both modify WF-22; TD-NEW-009 runs in Batch 2 first"
      - id: TD-NEW-008
        type: soft
        reason: "same-workflow siblings — both modify WF-43; TD-NEW-008 runs in Batch 2 first"

  - id: TD-NEW-018
    description: messages.created_at is timestamp without time zone — should be timestamptz
    priority: P2
    status: pending
    batch: 4
    completed: null
    depends_on: []

  - id: TD-NEW-020
    description: No HMAC verification on Meta webhook (WF-00) or Slack events (WF-10)
    priority: P2
    status: pending
    batch: 4
    completed: null
    depends_on:
      - id: TD-NEW-015
        type: soft
        reason: "same-workflow siblings — both modify WF-00; TD-NEW-015 runs in Batch 3 first"
      - id: TD-NEW-005
        type: soft
        reason: "same-workflow siblings — both modify WF-10; TD-NEW-005 runs in Batch 2 first"

  # ── P3 Batch 5 (repo hygiene) ────────────────────────────────────────────────

  - id: TD-NEW-021
    description: archive/backups/ has 68 dated JSON snapshots — tar pre-20260514 into single archive
    priority: P3
    status: pending
    batch: 5
    completed: null
    depends_on: []

  - id: TD-NEW-022
    description: workflows/*.json are single-line minified — diffs unreadable
    priority: P3
    status: pending
    batch: 5
    completed: null
    depends_on: []

  - id: TD-NEW-023
    description: docs/.DS_Store committed to repo
    priority: P3
    status: pending
    batch: 5
    completed: null
    depends_on: []

  - id: TD-NEW-024
    description: scripts/ directory empty but CLAUDE.md references 3 scripts
    priority: P3
    status: pending
    batch: 5
    completed: null
    depends_on: []

  - id: TD-NEW-025
    description: 3 stale deleted workflow exports still present in workflows/
    priority: P3
    status: pending
    batch: 5
    completed: null
    depends_on: []

  - id: STATUS-TD-06
    description: Data retention (WF-73 Data Cleanup) — before significant user volume
    priority: P3
    status: needs-decision
    batch: 5
    decision_required: "WF-73 does not yet exist — this is a new workflow to build (personal data compliance). Decide: (A) scope and build now as part of P3, (B) defer to Phase 2 post-go-live (recommended — no users yet)."
    completed: null
    depends_on: []

  # ── Obsolete ─────────────────────────────────────────────────────────────────

  - id: TD-NEW-017
    description: WF-22 old node name not re-exported (TD-007 incomplete)
    priority: P2
    status: obsolete
    obsolete_reason: "Live n8n confirms node is already named 'Ensure Slack Channel Exists (WF-52)' — rename landed in n8n even if not in earlier export. Re-export will capture current state when other WF-22 items are done."
    batch: null
    completed: null

  - id: STATUS-TD-03
    description: Meta webhook X-Hub-Signature-256 HMAC verification in WF-00
    priority: P2
    status: obsolete
    obsolete_reason: "Duplicate of TD-NEW-020 which covers both WF-00 Meta HMAC and WF-10 Slack HMAC. Source file itself notes 'Overlaps with TD-NEW-020'."
    batch: null
    completed: null

  - id: STATUS-TD-04
    description: Slack X-Slack-Signature HMAC verification in WF-10
    priority: P2
    status: obsolete
    obsolete_reason: "Duplicate of TD-NEW-020. Source file notes 'Overlaps with TD-NEW-020'."
    batch: null
    completed: null
