slug: technical-review-2026-05-16
input_sources:
  - .methodology/handoff-technical-review-2026-05-16-complete.md
  - docs/superpowers/TechnicalWorkflowReview_2026-05-16.html
source_file_update: false
working_copy_path: .methodology/sprint-technical-review-2026-05-16-working.md
planned_at: 2026-05-16T00:00:00Z
last_updated: 2026-05-16T12:00:00Z
planning_complete: true
scope_decision: "Critical + Verify only (F-01..F-09); F-10/F-11/F-12 deferred post-MVP per HTML report"
dependency_conflicts_found: []
priority_adjustments_confirmed: "no conflicts; same-workflow siblings sequenced by risk (DB-Schema > Structural > Surgical)"
notes:
  - "SSH tunnel confirmed open at plan time — n8n/Postgres/pgAdmin all reachable"
  - "All 6 confirmed runtime bugs identified <24h ago via technical-workflow-review skill; obsolete detection skipped as redundant"
  - "F-04 and F-06 cannot be done via API — require user to open n8n UI"
items:
  - id: F-01
    description: "Add `stage VARCHAR(50)` column to chinmay_astro.users table; fixes WF-44 Save Feedback to DB and WF-45 Set status=payment_pending which SET stage = NULL"
    priority: P0
    status: done
    completed_at: 2026-05-16
    batch: 1
    change_type: DB-Schema
    artifact: "Postgres: chinmay_astro.users"
    fix_method: "mcp__postgres__query"
    depends_on: []

  - id: F-02
    description: "Fix admin_actions INSERT column names: WF-47 opt-out INSERT (`action` → `action_type`); WF-11 UNBLOCK INSERT (`action` → `action_type`, `reason` → `notes`)"
    priority: P0
    status: done
    completed_at: 2026-05-16
    batch: 1
    change_type: Batch-Surgical
    artifact: "WF-47, WF-11"
    fix_method: "mcp__n8n__n8n_update_partial_workflow patchNodeField on query parameter"
    depends_on: []

  - id: F-03
    description: "Downgrade executeWorkflow nodes from typeVersion 2 → 1 in WF-20 (Send HELP Response, Route to Rebook), WF-45 (Send Payment Instructions), WF-12 (Call WF-50 Send WhatsApp)"
    priority: P0
    status: done
    completed_at: 2026-05-16
    batch: 1
    change_type: Batch-Surgical
    artifact: "WF-20, WF-45, WF-12"
    fix_method: "mcp__n8n__n8n_update_partial_workflow patchNodeField typeVersion=1"
    depends_on:
      - id: F-01
        type: soft
        reason: "same-workflow sibling — both modify WF-45; sequence F-01 (DB) before F-03 to ensure schema exists before any WF-45 testing"

  - id: F-05
    description: "Add `=` prefix to Postgres query fields with {{ }} expressions: WF-45 Load User Record + Set status=payment_pending; WF-11 Lookup Blocked User + Unblock User; WF-40 Load User Record; WF-46 Get User Slack Channel; WF-47 Get User Slack Channel"
    priority: P0
    status: done
    completed_at: 2026-05-16
    batch: 1
    change_type: Batch-Surgical
    artifact: "WF-45, WF-11, WF-40, WF-46, WF-47"
    fix_method: "mcp__n8n__n8n_update_partial_workflow patchNodeField on query field"
    depends_on:
      - id: F-01
        type: hard
        reason: "WF-45 Set status=payment_pending references stage column; F-01 must add stage before this UPDATE will succeed"
      - id: F-02
        type: soft
        reason: "same-workflow siblings WF-11, WF-47 — sequence F-02 (column-name fix) before F-05 to avoid concurrent updates to same workflows"
      - id: F-03
        type: soft
        reason: "same-workflow sibling WF-45 — sequence after F-03 typeVersion fix"

  - id: F-09
    description: "Add onError: 'continueRegularOutput' to webhook nodes in WF-00 (WhatsApp Webhook) and WF-10 (Webhook) to prevent Meta/Slack retries on processing errors"
    priority: P1
    status: done
    completed_at: 2026-05-16
    batch: 1
    change_type: Batch-Surgical
    artifact: "WF-00, WF-10"
    fix_method: "mcp__n8n__n8n_update_partial_workflow patchNodeField onError"
    depends_on: []

  - id: F-04
    description: "Fix workflowId object bug in WF-47 — re-select WF-50 in workflow dropdown on `Send Hold Message via WF-50` and `Send Opt-out Confirmation via WF-50` executeWorkflow nodes (resource-locator object → string)"
    priority: P0
    status: pending
    batch: 2
    change_type: Surgical
    artifact: "WF-47"
    fix_method: "n8n UI — cannot be done via API"
    depends_on:
      - id: F-02
        type: soft
        reason: "same-workflow sibling WF-47 — sequence after F-02 column fix"
      - id: F-05
        type: soft
        reason: "same-workflow sibling WF-47 — sequence after F-05 = prefix fix to avoid concurrent UI/API edits"

  - id: F-06
    description: "Fix unmatched {{ }} brackets in WF-43 `Gemini General Response` HTTP Request node jsonBody expression; then export and commit WF-43"
    priority: P0
    status: pending
    batch: 2
    change_type: Surgical
    artifact: "WF-43"
    fix_method: "n8n UI — find and remove extra closing }}"
    depends_on: []

  - id: F-07
    description: "Verify Slack node operations render correctly in UI for WF-11, WF-33, WF-34, WF-41, WF-42, WF-46, WF-51; if operation dropdown shows blank/invalid, re-select `post` and save"
    priority: P1
    status: pending
    batch: 2
    change_type: Verification-UI
    artifact: "WF-11, WF-33, WF-34, WF-41, WF-42, WF-46, WF-51"
    fix_method: "n8n UI inspection"
    depends_on:
      - id: F-02
        type: soft
        reason: "same-workflow sibling WF-11 — verify after F-02 edits"
      - id: F-05
        type: soft
        reason: "same-workflow siblings WF-11, WF-46 — verify after F-05 edits"

  - id: F-08
    description: "Run admin command smoke test — verify APPROVE/REJECT/CLOSE/BLOCK pass data to sub-workflows correctly (tests mappingMode: passthrough in WF-10, WF-11, WF-33); see handoff-sprint-tech-debt-2026-05-16-before-mvp-complete.md for full smoke test scope"
    priority: P1
    status: pending
    batch: 3
    change_type: Smoke-Test
    artifact: "End-to-end critical paths"
    fix_method: "smoke-test skill"
    depends_on:
      - id: F-01
        type: hard
        reason: "smoke test exercises rebook + feedback paths that need stage column"
      - id: F-02
        type: hard
        reason: "smoke test logs admin actions"
      - id: F-03
        type: hard
        reason: "smoke test exercises HELP/REBOOK/Admin-relay paths broken by v2 nodes"
      - id: F-04
        type: hard
        reason: "smoke test exercises STOP keyword (WF-47) paths"
      - id: F-05
        type: hard
        reason: "smoke test exercises all SQL lookup paths"
      - id: F-06
        type: hard
        reason: "smoke test exercises Gemini general-response path for consultation_closed users"
      - id: F-07
        type: soft
        reason: "Slack post operations exercised in smoke test"
      - id: F-09
        type: soft
        reason: "verify webhook resilience in smoke test"

post_fix_actions:
  - "Export all modified workflows to workflows/*.json (scripts/export-all-workflows.sh)"
  - "Run secrets scan: grep -rn 'AIzaSy\\|sk-\\|xoxb-\\|AKIA' workflows/"
  - "Commit + push to GitHub"

deferred_post_mvp:
  - id: F-10
    description: "Add cachedResultName to all executeWorkflow workflowId fields (UI cosmetic)"
  - id: F-11
    description: "Update n8n instance from 2.1.4 → latest (2.20.9) on VPS — requires VPS session"
  - id: F-12
    description: "Fix WF-60 Done code node — return array to restore message logging (dedup currently broken)"
