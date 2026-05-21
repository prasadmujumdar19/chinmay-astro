---
slug: followups-for-plan-sprint
input_source: docs/artefacts/tests/smoke-pre-golive-continued-2026-05-20/followups-for-plan-sprint.md
input_hash: 00063990aeb2b1e477e8e40ba341158239f841f20251f2d8b6b66c5328e4a58b
source_file_update: false
working_copy_path: docs/artefacts/sprints/followups-for-plan-sprint/working.md
planned_at: 2026-05-20T12:30:58Z
last_updated: 2026-05-21T22:55:00Z

batch_2_commit: c434469
batch_2_push_target: prasadmujumdar19/chinmay-astro main
batch_2_completed_at: 2026-05-21T12:50:00Z
planning_complete: true

dependency_conflicts_found: []

priority_adjustments_confirmed: |
  User direction 2026-05-20 — three planning-level changes:
  1. Original TD-D (admin Slack feedback on workflow exceptions) REMOVED from sprint. Scope expanded by user
     to cover BOTH user-facing and admin-facing error paths (user-facing UX is worse than admin's — users in
     vacuum churn). Becomes FOLLOWUP-ERR, a post-sprint think-plan-build deliverable that blocks next testing
     session. Recorded in post_sprint_reminders below.
  2. TD-H stays as a verification item (not obsoleted) — hard dep on TD-A. Tagged for next test session.
  3. Plugin batch (Batch 3) expanded from PIC-01/02/03 to include PIC-04 (drift detector), PIC-05
     (build-workflow classify gates pseudocode-first), PIC-06 (drift hook at build-sprint invocation —
     FINAL plugin task per user direction).

post_sprint_reminders:
  - id: FOLLOWUP-ERR
    surface_when: "Batch 3 complete; before user resumes testing"
    summary: |
      Run a dedicated brainstorming → spec → plan → build cycle for cross-workflow error handling.
      Scope: both inbound user paths AND admin-action paths AND background jobs. When ANY workflow
      throws an unhandled exception today, the affected party gets zero feedback. For users this is a
      churn risk worse than the admin case. Cannot be a per-workflow patch — needs an exhaustive design.
      Decision recorded 2026-05-20 (originated as TD-D scope expansion).
      Per-workflow Error Trigger nodes + contextual routing (Slack channel from original input) is the
      operator's stated preference for the admin half; user half requires fresh design.

batches:
  - number: 1
    description: "P0 critical-path bug fixes — surgical only, all in this repo"
    estimated_tokens: ~25K (3 surgical + 2 sweeps)
    items: [TD-A, TD-B, TD-C]
  - number: 2
    description: "P1/P2 — 2 structural (pseudo-first) + 1 doc + 1 verification, all in this repo"
    estimated_tokens: ~35K (2 structural at ~15K each, 1 doc, 1 verification)
    items: [TD-E, TD-F, TD-G, TD-H]
  - number: 3
    description: "Plugin-repo improvements — runs AFTER Batches 1+2 are committed and pushed to GitHub. Use flush-plugin-improvements / writing-skills skills in n8n-whatsapp-methodology repo, NOT this repo."
    estimated_tokens: ~40K (6 plugin items)
    items: [PIC-01, PIC-02, PIC-03, PIC-04, PIC-05, PIC-06]
    scope: plugin-repo
    precondition: "Batches 1+2 fully committed and pushed to prasadmujumdar19/chinmay-astro main"

items:
  - id: TD-A
    description: |
      WF-20 keyword interception is a no-op. `Normalize Keyword` Set node reads $json.messageText and
      $json.userId but caller payload supplies $json.messageContent and $json.user.id. STOP/HELP/REBOOK
      all fall through to passthrough. Fix: rename to messageContent / user?.id in the Set node
      assignments. Source ISSUE-07.
    priority: P0
    batch: 1
    status: done
    completed_at: 2026-05-21T07:08:00Z
    completion_note: |
      Applied via mcp__n8n__n8n_update_partial_workflow updateNode op. Normalize Keyword now reads
      $json.messageContent (k1, k4) and $json.user?.id (k3); phoneNumber unchanged at $json.phoneNumber
      (top-level supplied by WF-01 securityData). messageText preserved as alias of messageContent for
      downstream Set Passthrough compat. Verified live + re-exported workflows/LgIDj1v4ZbCPlX25.json.
      Pre-fix impact-analysis was a no-op (WF-20 wasn't intercepting anyway). Acceptance verification
      moved to TD-H (next test session, hard dep on this).
      Backup: workflows/backups/LgIDj1v4ZbCPlX25.WF-20.pre-TD-A.20260521T070736Z.json
    workflows: [WF-20]
    change_kind: surgical
    pseudocode_first: false
    pre_fix: impact-analysis on WF-20 (no-op since WF-20 isn't currently working, but mandatory per source)
    acceptance:
      - STOP from non-consultation_active state → WF-20 STOP branch fires; WF-47 invoked without WF-25 hop
      - HELP from payment_pending → WF-20 HELP branch fires; status-aware HELP text returned (TD-027)
      - REBOOK from consultation_closed → WF-20 REBOOK branch fires; WF-45 reached without WF-43/WF-25
    depends_on: []

  - id: TD-B
    description: |
      WF-47 `Update User Status to opted_out` Postgres node missing parameters.options.queryReplacement.
      Causes `Variable $1 out of range`. Same pattern as WF-44 BUG-NEW-03. Source ISSUE-08.
      Pre-sweep: jq scan ALL active workflows for Postgres nodes where query contains $N AND
      queryReplacement is absent/null; batch all hits in this item.
      EXPANDED 2026-05-21 per user direction: also redesigned STOP semantics — STOP is now
      unconditional (no consultation_active hold), consultation auto-closes if active, admin gets
      Slack notice in consult channel when channel exists, no more admin_actions write.
    priority: P0
    batch: 1
    status: done
    completed_at: 2026-05-21T10:44:00Z
    completion_note: |
      Pseudocode-first per [[feedback_pseudocode_first_refactor]]: docs/pseudocode/WF-47.pseudo
      rewritten + user_journey_map.html J-19 + workflow-registry.md WF-47 row updated FIRST, user
      approved change list, THEN WF-47 JSON mutated via full PUT.
      Removed 4 nodes: Check If Consultation Active, Prepare WF-50 Payload (Hold Message),
      Send Hold Message via WF-50, Log to admin_actions.
      Modified 2 nodes: Update User Status to opted_out (now: status=opted_out + current_consultation_id=NULL
      + queryReplacement added + RETURNING slack_channel_id), Prepare WF-50 Payload (Opt-out Confirmation)
      (updated copy to match journey map).
      Added 5 nodes: Was Consultation Active? (IF v2), Close Open Consultation (Postgres v2.5),
      Has Slack Channel? (IF v2), Prepare WF-51 Payload (Opt-out Notice) (Code v2), Notify Admin
      Opt-out via WF-51 (executeWorkflow v1.2). All typeVersions preserved exactly per project
      standard (no auto-bumps). Settings preserved (executionOrder=v1, callerPolicy=workflowsFromSameOwner).
      Sweep: full project jq scan post-fix shows zero remaining Postgres-$N-without-queryReplacement
      across all 28 active workflows.
      Verification: assert-md-fresh.sh WF-47 → FRESH. Acceptance verification deferred to next
      test session (no Postgres MCP write authorized for in-place test).
      Backup: workflows/backups/2U7mxHMyqA41ROKX.WF-47.pre-TD-B-expanded.20260521T103803Z.json
    workflows: [WF-47]
    change_kind: surgical-plus-batch-sweep
    pseudocode_first: false
    pre_fix: impact-analysis sweep — Postgres $N without queryReplacement across all active workflows
    acceptance:
      - STOP flow completes; users.status → opted_out; WA confirmation sent; consult-{phone} archive succeeds
      - All sweep-surfaced workflows pass the same query-with-replacement pattern
    depends_on:
      - id: TD-C
        type: soft
        reason: "same-workflow sibling — TD-C sweep also touches WF-47 (UNBLOCK branch in WF-11 per source); sequential execution prevents concurrent-PUT overwrite"

  - id: TD-C
    description: |
      WF-34 `User Found?` IF node uses leftValue $json.id (Postgres int → JS number) with
      operator.type:"string" + typeValidation:"strict". Strict mode refuses to coerce → REJECT
      errors every time. Source ISSUE-03.
      Operator picks fix: (a) change operator type to "number" + larger-than-0 check (best),
      (b) cast leftValue to String($json.id) (safe), or (c) typeValidation:"loose" (lossy).
      Pre-sweep: scan IF nodes with pattern leftValue=$json.id-like + type:string + typeValidation:strict
      across admin-action workflows. Known scope-narrowing: WF-42 (phone_number, safe) and WF-33
      (no User Found, safe). Suspects: WF-44, WF-46, WF-47-unblock branch.
    priority: P0
    batch: 1
    status: done
    completed_at: 2026-05-21T10:53:24Z
    completion_note: |
      User chose fix style (a) and scope WF-34 + WF-11. Sweep across all 28 active workflows
      surfaced 3 IF nodes with type:string + numeric-looking id leftValue:
        - WF-34 `User Found?` — strict + notEmpty + $json.id (confirmed broken — ISSUE-03)
        - WF-11 `Blocked User Found?` — strict + exists + $json.id (suspect, preemptive)
        - WF-60 `User?` — loose + notEmpty + $json.userId (already safe; not touched)
      WF-44/46/47-unblock cleared: WF-44 patched in earlier TD-001; WF-46 doesn't use numeric .id
      in a strict-string IF; WF-47 just refactored in TD-B and no longer has the problematic IF.
      Fix applied to both WF-34 and WF-11:
        - operator: {type:"number", operation:"gt"}
        - leftValue: ={{ Number($json.id || 0) }}  (coerces undefined → 0 to satisfy strict mode)
        - rightValue: 0
        - typeValidation: strict (preserved per option (a))
      Coercion needed because both Load Postgres nodes have alwaysOutputData:true, so on not-found
      the downstream IF sees $json.id=undefined; strict+number+undefined would throw — `Number(x||0)`
      makes the leftValue evaluate to a number unconditionally.
      Applied via mcp__n8n__n8n_update_partial_workflow (one updateNode op per WF). typeVersions
      preserved (WF-34 IF v2, WF-11 IF v2.2). Re-exported both. assert-md-fresh: WF-34 exit=0,
      WF-11 exit=0. Acceptance verification (live REJECT PAYMENT) deferred to next test session.
      Backups:
        - workflows/backups/se82n3MUQ9xE5aEr.WF-34.pre-TD-C.20260521T105224Z.json
        - workflows/backups/GoTYo0GS2y8qjjkw.WF-11.pre-TD-C.20260521T105224Z.json
    workflows: [WF-34]
    change_kind: surgical-plus-batch-sweep
    pseudocode_first: false
    pre_fix: impact-analysis sweep — IF type-strict on numeric columns across admin-action workflows
    acceptance:
      - REJECT PAYMENT against payment_submitted user transitions status → payment_pending; rejected_at set
      - WA rejection message sent; Slack admin ack posted
      - All sweep-surfaced IF nodes patched
    depends_on:
      - id: TD-B
        type: soft
        reason: "same-workflow sibling — both items may modify WF-47; sequential execution prevents concurrent-PUT overwrite"

  - id: TD-E
    description: |
      WF-40 (User → Admin Relay) doesn't invoke WF-25 — garbage/abuse relayed verbatim to Slack during
      consultation_active. Violates Design Rule #6 ("every state accepting free-form text must run WF-25
      first"). Auto-block via WF-25 → WF-46 never fires for in-consultation abuse. Source ISSUE-06.
      Fix: add WF-25 at head of WF-40; route by intent (general_enquiry/wants_consultation/feedback_intent/
      rebook_intent → relay; malicious_abusive/inappropriate/garbage → short-circuit to WF-25's warn+block).
    priority: P1
    batch: 2
    status: done
    completed_at: 2026-05-21T11:48:00Z
    completion_note: |
      Pseudocode-first per [[feedback_pseudocode_first_refactor]]: docs/pseudocode/WF-40.pseudo
      revised + user-approved BEFORE any JSON edit. User direction 2026-05-21: stop_intent should
      NOT trigger auto-opt-out (false-positive risk — user may be quoting STOP/unsubscribe in
      conversation). Instead relay verbatim to admin AND send automated clarifier via WF-50 with
      cleanup-path instructions. Verified WF-10 Step 16 admin-text guard already blocks relay to
      opted_out users, so post-opt-out admin messages don't leak to WhatsApp.
      Implementation via build-workflow Mode A + Step 5e regenerate-by-copy (1 PUT covering 4 new
      nodes + 1 SELECT modification + connection rewrite + initial position collision):
        - Modified `Load User Record`: SELECT now includes `status` column (needed for WF-25 userStatus input)
        - Added `Call WF-25 (Intent Classifier)`: executeWorkflow v1.2, mappingMode=defineBelow,
          explicit inputs {phoneNumber, userId, messageContent, userStatus}
        - Added `Stop Intent?`: IF v2.2, loose+string, leftValue=$json.intentResult, equals "stop_intent"
        - Added `Build WF-50 Clarifier Payload`: Set v3.4 with phoneNumber/messageType/messageContent
          (text + clarifier message per user-approved wording)
        - Added `Call WF-50 (Stop Clarifier)`: executeWorkflow v1.2, mappingMode=passthrough, BUVun38WEKb12zg9
        - Connections: Load User Record → Call WF-25 → fan-out to {Format Slack Message (always relay),
          Stop Intent? (conditional clarifier)}; Stop Intent?[true] → Build Clarifier → Call WF-50;
          Stop Intent?[false] terminates; Format Slack Message → Call WF-51 (preserved).
        - Position collision fixed post-PUT via moveNode partial update (Format Slack + Call WF-51
          shifted to y=-224; new clarifier branch at y=-32).
      Pre-flight lint scan (Step 5e.1) clean. Post-PUT lint clean.
      WF-40.md regenerated and assert-md-fresh.sh WF-40 → FRESH.
      4 → 8 nodes. Acceptance verification (live consultation_active garbage/abuse/stop_intent
      paths) deferred to next test session.
      Backup: archive/backups/du32QBZbSQOjfESe-2026-05-21-21-42.json
    workflows: [WF-40]
    change_kind: structural
    pseudocode_first: true
    pre_fix: |
      (1) Revise docs/pseudocode/WF-40.pseudo with new intent-routing logic and get user approval on diff.
      (2) Impact-analysis on revised pseudo to surface caller/callee implications.
      (3) Implement workflow edit to match approved pseudo.
      (4) Regenerate WF-40.md via generate-workflow-md; verify .md matches .pseudo.
    acceptance:
      - Garbage `/&/&xyz` during consultation_active → user gets garbage-warning WA; no relay to admin
      - Abusive "fuck off" during consultation_active → user warned, auto-blocked via WF-46; status=blocked
    depends_on: []

  - id: TD-F
    description: |
      messages.content NULL for outbound interactive/template + inbound interactive. WF-50's
      Build WF-60 Payload (Outbound) extracts only for message_type='text'. Inbound (WF-00) captures
      only button_id, missing display label. Source ISSUE-01. Audit gap, not user-facing bug.
      Fix: WF-50 outbound — for 'interactive' extract interactive.body.text + buttons to metadata; for
      'template' extract template name + body params. WF-00 inbound — for 'interactive' extract both
      button_id and display label.
    priority: P1
    batch: 2
    status: done
    completed_at: 2026-05-21T12:22:14Z
    completion_note: |
      Pseudocode-first per [[feedback_pseudocode_first_refactor]]: docs/pseudocode/WF-50.pseudo
      Step 11 and WF-00.pseudo Step 8a + extraction notes revised + user-approved BEFORE JSON
      mutation. Audit-before-spec per [[feedback_audit_before_spec]]: live inspection of
      Build WF-60 Payload (Outbound) confirmed it uses `prep.messageContent ?? null` for ALL
      message types (the conditional logic exists in an orphaned `Build Log Input` node with
      zero upstreams — dead code). Removed in this commit.
      User direction (2026-05-21): WF-00 content extraction picks `interactiveLabel || messageContent`
      (label preferred, id fallback); preserves WF-01 routing semantics (messageContent stays as
      button_id). Dead code cleanup approved as part of TD-F (Build Log Input removed).
      WF-50 changes (Step 5e single-PUT transform):
        - `Build WF-60 Payload (Outbound)` jsCode rewritten: per-messageType content extraction
          (text → prep.messageContent; interactive → interactivePayload.body.text || JSON-stringify;
          template → 'template:' + templateName). Metadata enriched: buttons array (interactive),
          templateParams (template).
        - `Build WF-60 Drop Payload` jsCode rewritten: same per-type extraction, metadata
          carries drop=true + dropReason.
        - `Build Log Input` node removed (orphaned, dead code from pre-TD-002 era).
        - 18 → 17 nodes. Pre-flight lint clean, post-PUT lint clean.
      WF-00 changes (Step 5e single-PUT transform):
        - `Parse WhatsApp Message` jsCode: for interactive button_reply/list_reply, extract title
          into new `interactiveLabel` field alongside the existing `messageContent=button_id`.
        - `Build WF-60 Payload (Inbound)` jsCode: writes `interactiveLabel || messageContent`
          into `content`; original id preserved in `metadata.interactiveButtonId` when label
          present. Non-interactive types unchanged.
        - 14 nodes preserved. Pre-flight lint clean, post-PUT lint clean.
      Acceptance verification (rebook + close + APPROVE PAYMENT flows producing non-NULL
      messages.content for all message_type values) deferred to next test session.
      Backups:
        - archive/backups/BUVun38WEKb12zg9-2026-05-21-22-19.json (WF-50)
        - archive/backups/JQu1MkK5vgtUCeNO-2026-05-21-22-19.json (WF-00)
    workflows: [WF-50, WF-00]
    change_kind: structural
    pseudocode_first: true
    pre_fix: |
      (1) Revise content-extraction contract in BOTH WF-50.pseudo and WF-00.pseudo (canonical per
          message_type). User approval on diffs.
      (2) Impact-analysis on revised pseudo → WF-60 canonical contract.
      (3) Implement both workflow edits.
      (4) Regenerate both .md files; verify match.
    acceptance:
      - Rerun rebook + close + APPROVE PAYMENT flows
      - All resulting messages rows have non-NULL content regardless of message_type
    depends_on: []

  - id: TD-G
    description: |
      WF-41 stale node reference (ISSUE-05) — operator already patched in n8n UI mid-session.
      DB-level workflow is fixed. Sprint action: export fixed WF-41 to workflows/, commit to GitHub,
      verify scripts/assert-md-fresh.sh WF-41 passes. Use the process gap as the trigger to ensure
      PIC-01/02/03/04/05/06 land in Batch 3.
    priority: P1
    batch: 2
    status: done
    completed_at: 2026-05-21T11:00:00Z
    completion_note: |
      export-all-workflows.sh re-exported all 28 workflows. WF-41 (6PzJRZsF7k2d9hV7.json) shows
      the operator's fix:
        $('Detect Direction').first().json.messagetext → $('Extract Phone from Channel').first().json.messagetext
      assert-md-fresh.sh WF-41 → FRESH. Secrets scan clean. JSON staged in /tmp clone for
      Batch 2 final commit. Mode B (inline-inherit) — no code-level work needed beyond
      capturing the operator's UI change in the repo.
    workflows: [WF-41]
    change_kind: documentation
    pseudocode_first: false
    pre_fix: scripts/export-all-workflows.sh && scripts/assert-md-fresh.sh WF-41
    acceptance:
      - workflows/WF-41-*.json on disk matches live n8n state
      - docs/pseudocode/WF-41.md is fresh per assert-md-fresh
      - Committed and pushed to chinmay-astro main
    depends_on: []

  - id: TD-H
    description: |
      Verification-only item. Confirms TD-A's fix makes WF-20 intercept REBOOK keyword and skip WF-25/
      WF-43 path. Measure end-to-end latency drop from ~6s to ~2s (one Gemini call eliminated). No code
      change expected. If REBOOK still hits WF-25 after TD-A, escalate as TD-A regression. Source ISSUE-02.
      Tagged for inclusion in next test session.
    priority: P2
    batch: 2
    status: deferred
    deferred_at: 2026-05-21T12:25:00Z
    deferred_note: |
      Tagged `next-test-session` from sprint planning — verification-only, no code change.
      Hard-deps on TD-A (already done). Will be exercised during next monitor-test-run alongside
      TD-B-expanded acceptance (STOP unconditional path) and TD-C acceptance (REJECT PAYMENT
      with strict-mode numeric IF). Sprint advances without blocking on this.
    workflows: []
    change_kind: verification
    pseudocode_first: false
    acceptance:
      - WF-20 execution log shows REBOOK keyword matched in branch 3
      - No WF-25 execution in the chain
      - End-to-end latency ≤ ~2.5s
    tags: [next-test-session, verification-only, no-code-change]
    depends_on:
      - id: TD-A
        type: hard
        reason: "TD-H verifies the effect of TD-A's WF-20 fix on the REBOOK keyword path"

  - id: PIC-01
    description: |
      impact-analysis skill — enumerate intra-workflow $('NodeName') references before node removal.
      Currently scans connection topology + caller/callee surfaces, doesn't scan surviving nodes'
      expression bodies for $('removed-name') refs. Implementation: jq-walk every surviving node's
      parameters JSON → regex \$\('([^']+)'\) → set-difference vs names-of-nodes-being-removed → fail
      if non-empty. Triggered by ISSUE-05 (WF-41).
    priority: P3
    batch: 3
    status: pending
    scope: plugin-repo
    repo: prasadmujumdar19/n8n-whatsapp-methodology
    skill_to_use: flush-plugin-improvements
    depends_on: []

  - id: PIC-02
    description: |
      build-workflow skill — AFTER-gate must catch dangling $('NodeName') refs OR execute a synthetic
      payload. n8n static validator only complains at expression evaluation time. Either re-run PIC-01's
      scan on final workflow JSON or trigger one synthetic test execution as AFTER-gate. Triggered by
      ISSUE-05.
    priority: P3
    batch: 3
    status: pending
    scope: plugin-repo
    repo: prasadmujumdar19/n8n-whatsapp-methodology
    skill_to_use: flush-plugin-improvements
    depends_on:
      - id: PIC-01
        type: soft
        reason: "PIC-02 can reuse PIC-01's jq scan implementation if PIC-01 ships first"

  - id: PIC-03
    description: |
      technical-workflow-review skill — add "dangling node-name reference" to standard battery.
      Catches latent versions of ISSUE-05 in workflows not edited this session. Same jq scan as PIC-01.
      Surfaces in review HTML.
    priority: P3
    batch: 3
    status: pending
    scope: plugin-repo
    repo: prasadmujumdar19/n8n-whatsapp-methodology
    skill_to_use: flush-plugin-improvements
    depends_on:
      - id: PIC-01
        type: soft
        reason: "shares jq-scan implementation"

  - id: PIC-04
    description: |
      NEW plugin skill — pseudocode-vs-md drift detector. For each WF-XX, compares docs/pseudocode/
      WF-XX.pseudo (handwritten design spec) against docs/pseudocode/WF-XX.md (AS-IS projection from
      JSON). Surfaces divergences: missing nodes, renamed variables in decision forks, changed
      conditions, added/removed branches. Output: HTML report + per-workflow drift score.
      Backstop for the "in-flight workflows we DIDN'T touch this sprint may also have drifted"
      concern raised by user 2026-05-20.
    priority: P3
    batch: 3
    status: pending
    scope: plugin-repo
    repo: prasadmujumdar19/n8n-whatsapp-methodology
    skill_to_use: writing-skills
    depends_on: []

  - id: PIC-05
    description: |
      build-workflow skill — classify step must gate pseudocode-first for any non-purely-parametric
      change. Today's classification (Surgical/Structural/DB-Schema/Critical-path) doesn't bind to
      pseudocode discipline. Add a branch: "Is this change purely parametric (field rename in same
      semantic position, missing param, type coercion, credential ref) or does it alter control flow /
      data contract / external interface? If the latter → MUST update .pseudo first, MUST get user
      approval on pseudo diff." Converts soft memory rule [[feedback_pseudocode_first_refactor]] into
      hard skill gate.
    priority: P3
    batch: 3
    status: pending
    scope: plugin-repo
    repo: prasadmujumdar19/n8n-whatsapp-methodology
    skill_to_use: flush-plugin-improvements
    depends_on: []

  - id: PIC-06
    description: |
      FINAL plugin task per user direction 2026-05-20. Create a hook that fires at build-sprint skill
      invocation. Hook checks: when was pseudocode-drift detector (PIC-04) last run? If >24h stale or
      never → run drift detector first; if drift detected, block build-sprint and report. If <=24h
      since last clean run → proceed normally. Rationale (user, 2026-05-20): blanket "surgical/typo
      changes don't need pseudo updates" is FALSE — variable renames inside decision forks can drift
      pseudo even on surgical edits. Drift detection must be universal, not gated on change kind.
      Implementation: PreToolUse hook on Skill invocation matched to build-sprint, OR a runtime check
      inside the build-sprint skill's session-start phase.
    priority: P3
    batch: 3
    status: pending
    scope: plugin-repo + claude settings
    repo: prasadmujumdar19/n8n-whatsapp-methodology + ~/.claude/settings.json (hook registration)
    skill_to_use: writing-skills + update-config
    depends_on:
      - id: PIC-04
        type: hard
        reason: "PIC-06 invokes PIC-04's drift detector — PIC-04 must exist first"
    note: "Marked as FINAL task in the entire sprint. After this lands, all subsequent build-sprint invocations are drift-safe."

parser_warnings: []

plugin_improvement_candidates:
  - id: PIC-NEW-21A
    surfaced_during: TD-E (WF-40 structural change, 2026-05-21)
    summary: |
      assert-md-fresh.sh display bug — script reports `live_updated_at` as a date that differs
      from the actual frontmatter value in the .md it just checked (cosmetic; EXIT=0 correct).
      For WF-40 freshly regenerated, frontmatter showed live_updated_at=2026-05-21T11:48:01.890Z
      but script displayed live_updated_at=2026-05-20T02:22:26.578Z (still positive delta, still
      FRESH). Likely the script is reading live_updated_at from a stale source (e.g., live n8n
      API call result not refreshed, or comparing to a different .md). Script comment line 13
      explicitly tags it as "stopgap implementation; durable design is to embed live_updated_at"
      — fix is part of that durable rewrite.
    proposed_action: |
      Tighten assert-md-fresh.sh to display the SAME live_updated_at it compared against, OR
      complete the durable rewrite referenced in line 13. Roll into Batch 3 plugin improvements
      (fits with PIC-04 — drift detection family).
