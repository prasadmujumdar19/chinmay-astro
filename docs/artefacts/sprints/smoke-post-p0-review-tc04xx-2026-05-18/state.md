---
slug: smoke-post-p0-review-tc04xx-2026-05-18
input_source: docs/artefacts/tests/smoke-post-p0-review-tc04xx-2026-05-18/report.html
input_hash: 29fbefe7d45034c5f64e9d512175a138270d21f680d4574035db003bc5f5afb4
source_file_update: false
working_copy_path: docs/artefacts/sprints/smoke-post-p0-review-tc04xx-2026-05-18/working.md
planned_at: 2026-05-18T07:29:15Z
last_updated: 2026-05-18T23:20 IST
timestamp_convention_backfill_note: "Historical timestamps in this file pre-date the strict-UTC convention adopted 2026-05-18 (see docs/artefacts/specs/2026-05-18-timestamp-convention-design.md and memory feedback_timestamp_convention.md). Pre-convention values are a mix: explicit `IST` suffixes are Asia/Kolkata (UTC+5:30), bare `Z`-suffixed values were sometimes Sydney AEDT (UTC+10) wall-clock mistakenly tagged Z — the reconciliation bug that motivated the convention. Reconcile any literal `Z`-tagged values in this file against `gh api` UTC commit times before treating them as true UTC. Audit trail — not retroactively rewritten."
batch_3_commit_status: "Post-batch regression PASS 2026-05-18T23:08 IST. Orphan scan across all 27 active workflows found WF-00 + WF-10 as the only uncalled (both legitimate external trigger entries — webhook/Slack events); no other orphaned-active workflows remain. PLUGIN-03 (orphaned-active-workflow guardrail) deferred to Batch 4 per user decision and logged in followups.md. Committed + pushed 2026-05-18T23:12 IST as 3451197."
batch_4_commit_status: "All three plugin guardrails (PLUGIN-01/02/03) landed in a single MINOR bump (1.16.2 → 1.17.0) via flush-plugin-improvements. Plugin repo commit 456513a pushed to github.com/prasadmujumdar19/n8n-whatsapp-methodology@main. Active cache rolled: cache dir renamed 1.16.2 → 1.17.0; symlink 1.16.2 → 1.17.0 left in place for in-flight session env vars; installed_plugins.json + marketplace cache plugin.json updated. Final alignment verified: all four sources (cache dir, installed_plugins, marketplace cache, active plugin.json) show 1.17.0."
planning_complete: true
batch_1_commit_status: "Post-batch regression PASS 2026-05-18T20:45 IST. Committed + pushed in prior session as part of combined commit 2a33905 (Batches 1+2)."
batch_2_commit_status: "Post-batch regression PASS 2026-05-18T22:30 IST. Siblings re-checked this session: (1) no workflow references broken httpQueryAuth cred ZkLShpFmp8Mi1gZl; (2) no HTTP node uses httpQueryAuth auth type; (3) both Gemini-calling workflows (WF-25, WF-43) use googlePalmApi predefined cred. Committed + pushed in prior session as part of combined commit 2a33905 (Batches 1+2). Verified via gh api on 2026-05-18 — all 7 workflow JSONs + docs + sprint artefacts present in commit. No further action needed for Batches 1+2."
slug_derivation_note: "Strict rule on report.html → 'report' (too generic). Used parent folder name instead. Resume build-sprint with --slug=smoke-post-p0-review-tc04xx-2026-05-18."
parser_warnings: []
n8n_verification:
  ran_at: 2026-05-18T07:28Z
  tunnel_state: open
  result: "All 5 bugs confirmed present in live workflows. WF-12 confirmed orphaned (0 callers in workflows/*.json other than itself). No obsoletes."
dependency_conflicts_found: []
priority_adjustments_confirmed: "Report's recommended order honoured: BUG-02 → BUG-01 → BUG-03 → BUG-04 → BUG-05 → PLUGIN-01 → PLUGIN-02. Verification items (re-test BUG-02/03/04, optional TC-0303 regression) excluded per user instruction — 'ignore the verifications'."
exclusions_per_user:
  - "Re-test BUG-02/03/04 (sprint fix list item 7)"
  - "Optional TC-0303 admin APPROVE PAYMENT regression (item 8)"
  - "State carry-forward (user id=28 → payment_submitted)"
batch_1_execution_plan:
  decided_at: 2026-05-18T00:00Z
  BUG-02: "Mode A — full build-workflow Skill (structural HTTP body rewrite + project-wide sweep, establishes canonical fix for PLUGIN-01)"
  BUG-01: "Mode A — full build-workflow Skill (structural Postgres options conversion + project-wide sweep, establishes canonical fix for PLUGIN-02)"
  BUG-03: "Mode B — inline-inherit (1-token jsCode rename in same WF as BUG-02, pattern fresh from BUG-02)"
  no_mode_d: "Inline main-thread per [[feedback_sprint_parallelism]] and [[feedback_inline_plan_execution]]"
  same_workflow_sequencing: "BUG-02 and BUG-03 both WF-43 — sequential, BUG-01 (WF-10) interleaved between"
---
items:
  - id: BUG-02
    description: "WF-43 Gemini General Response HTTP node — replace raw-string jsonBody with object-interpolation expression so n8n JSON-encodes correctly. Then sweep ALL HTTP nodes (specifyBody=json + raw-string jsonBody with {{ }} inside JSON string literal) project-wide and apply the same pattern fix."
    priority: P0
    severity: critical
    status: done
    started_at: 2026-05-18T00:00Z
    completed_at: 2026-05-18T17:42Z
    completion_note: "WF-43 Gemini General Response jsonBody converted to object-interpolation form: `={{ {contents:[{parts:[{text:$json.geminiPrompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:200} } }}`. Lint clean (bracket balance fixed via spacing between adjacent close-braces). Sweep across all 28 workflows found only WF-43 had the anti-pattern; WF-25 Classify Intent uses safe whole-body expression `={{ $json.geminiBody }}` (false positive)."
    files_changed:
      - "workflows/3va0M06kijgyLejf.json"
      - "docs/workflow-registry.md (WF-43 row updated)"
    batch: 1
    workflow: WF-43
    workflow_id: 3va0M06kijgyLejf
    node: Gemini General Response
    change_type: structural
    blast_radius: high
    fix_pattern: "Replace `jsonBody: \"={\\\"contents\\\":[{\\\"parts\\\":[{\\\"text\\\":\\\"{{ $json.geminiPrompt }}\\\"}]}],...}\"` with `jsonBody: \"={{ {contents:[{parts:[{text:$json.geminiPrompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:200}} }}\"` so n8n evaluates an object and JSON-encodes."
    depends_on: []
    blocks:
      - id: BUG-03
        type: soft
        reason: "Same workflow (WF-43); sequential execution required to avoid concurrent update race"
      - id: PLUGIN-01
        type: soft
        reason: "Plugin guardrail encodes this pattern; validate the fix shape first"
    verification_after_build: "Free-text feedback path no longer throws 'JSON parameter needs to be valid JSON'."

  - id: BUG-01
    description: "WF-10 Load User Status Postgres node — replace `options.queryReplacement` comma-separated expression string with per-parameter Query Parameters. Then sweep ALL Postgres nodes project-wide for `queryReplacement` strings with 2+ comma-separated expressions where any expression evaluates to user-controlled text."
    priority: P0
    severity: critical
    status: done
    started_at: 2026-05-18T17:43Z
    completed_at: 2026-05-18T17:55Z
    completion_note: "Canonical fix (confirmed via n8n docs): expression evaluating to a JS array `={{ [a, b, c] }}` — n8n binds each element to `$N` without comma-splitting. Sweep flagged 10 multi-expression nodes; 5 had user-controlled text and were converted: WF-10/Load User Status, WF-21/Insert Pending User, WF-22/Create User Record, WF-34/Update Payment Record (note: state.md target said WF-33 but n8n ID se82n3MUQ9xE5aEr is actually WF-34 Payment Rejection Processor; queryReplacement fix landed correctly via n8n UUID), WF-60/Log to Messages Table. 5 multi-expression nodes were safe (machine-generated IDs/literals only): WF-22 Save Slack Channel ID, WF-32 Create Payment Record + Update Payment Status + Create Consultation Record + Update User Consultation Id. Pre-existing lint debt cleaned in the same PUTs: WF-22 (3 executeWorkflow nodes — missing canonical 1.2 source/operation/mode fields), WF-34 (User Found? IF node — added singleValue:true to notEmpty unary operator). Spot-check confirmed array form persisted live on WF-10 + WF-60."
    files_changed:
      - "workflows/wMh0oBRtJbvhLgOf.json (WF-10)"
      - "workflows/zM8WbxSdt9nXRoLZ.json (WF-21)"
      - "workflows/dr8QM0m92Ml8MvIh.json (WF-22, + canonical-1.2 roller)"
      - "workflows/se82n3MUQ9xE5aEr.json (WF-34, + IF singleValue fix)"
      - "workflows/6H75p935FpBVBQtV.json (WF-60)"
      - "docs/workflow-registry.md (5 rows updated)"
    followups_logged:
      - "WF-60 Log to Messages Table: content field wraps `$json.content` in literal quotes via `\"\\\"\" + $json.content + \"\\\"\"`. With parameter binding the driver auto-quotes string values — this extra wrap likely stores `\"text\"` (with literal quote chars) in the column. Out of scope for BUG-01; investigate as separate followup."
    batch: 1
    workflow: WF-10
    workflow_id: wMh0oBRtJbvhLgOf
    node: Load User Status
    change_type: structural
    blast_radius: high
    fix_pattern: "Convert `options.queryReplacement: \"={{ $json.channelId }}, {{ $('Find Channel').item.json.name }}, {{ $json.messageText }}\"` to per-parameter Query Parameters (each $N bound to one expression, no comma-split footgun)."
    depends_on: []
    blocks:
      - id: PLUGIN-02
        type: soft
        reason: "Plugin guardrail encodes this pattern; validate the fix shape first"
    verification_after_build: "Admin Slack message with comma (e.g. 'Back to you, ready to close') arrives intact on WhatsApp."

  - id: BUG-03
    description: "WF-43 Prepare Gemini Response Prompt — wrong variable reference in jsCode produces literal 'User: undefined' in the Gemini prompt. Point the user-text variable at `messageContent` (or `rawMessage.text.body`) instead of `messageText`."
    priority: P0
    severity: critical
    status: done
    started_at: 2026-05-18T17:55Z
    completed_at: 2026-05-18T20:26Z
    completion_note: "Single-token jsCode rename `${d.messageText}` → `${d.messageContent}` applied via patchNodeField. Lint clean. Live verification confirmed: prompt now reads `User: ${d.messageContent}`. (Note: this BUG-03 fix was paused mid-flight when SSH tunnel dropped after BUG-01; resumed once tunnel re-opened.)"
    files_changed:
      - "workflows/3va0M06kijgyLejf.json (WF-43)"
      - "docs/workflow-registry.md (WF-43 row updated)"
    batch: 1
    workflow: WF-43
    workflow_id: 3va0M06kijgyLejf
    node: Prepare Gemini Response Prompt
    change_type: surgical
    blast_radius: low
    fix_pattern: "In jsCode, change `${d.messageText}` to `${d.messageContent}` (or `${d.rawMessage?.text?.body}`). Verify by inspecting input shape at the node — WF-43 callers pass `messageContent`, not `messageText`."
    depends_on:
      - id: BUG-02
        type: soft
        reason: "Same workflow (WF-43); sequential execution required to avoid concurrent update race. Report also recommends BUG-02 first (largest blast radius) so subsequent test surfaces clearer errors."
    blocks: []
    verification_after_build: "Gemini prompt contains actual user text, not 'User: undefined'."

  - id: BUG-04
    description: "WF-25 reliability — Gemini returns null/invalid intent for short positive strings (e.g. 'Amazing service'), defaulting to general_enquiry and missing the feedback path. Investigate cause (prompt clarity? model? userStatus input contract?) and add a status-aware fallback: when userStatus=consultation_closed AND intent classification is uncertain, treat as feedback_intent."
    priority: P0
    severity: major
    priority_note: "Re-prioritised from P3 to feedback-path P0 by the smoke test session"
    status: done
    started_at: 2026-05-18T20:51Z
    completed_at: 2026-05-18T22:18Z
    root_cause_finding: "ORIGINAL HYPOTHESIS WAS PARTIAL. Smoke-test report said 'Gemini returns null intent'. Actual root cause: HTTP 400 from Gemini due to credential misconfiguration — the httpQueryAuth credential 'Gemini API Key (Query Auth)' (ZkLShpFmp8Mi1gZl) had its query-param NAME field set to the literal string 'Gemini n8n Key' instead of 'key'. Every Gemini call returned 400 'Unknown name', routed to Handle Gemini Error, which defaulted intentResult to general_enquiry. Confirmed by execution 1272 (2026-05-18T03:32) which showed the 400 verbatim. Secondary issue: WF-25's Prepare Intent Request destructured a flat `userStatus` field but all callers either passed it nested as `user.status` (passthrough callers WF-43/WF-31) or mapped it from `$json.userStatus` which was undefined upstream (defineBelow callers WF-23/WF-30/WF-44). Net effect: prompt always rendered 'Status: unknown'."
    completion_note: "Three discrete fixes landed in this BUG-04 (scope was expanded with explicit user approval mid-flight): (A) Switched Classify Intent (WF-25) and Gemini General Response (WF-43) HTTP node authentication from genericCredentialType+httpQueryAuth+credential ZkLShpFmp8Mi1gZl to predefinedCredentialType+nodeCredentialType=googlePalmApi+credential zT7defyXYEvxWwZm. This matches the working setup in user's other project (WF-42 Deal Evaluator) and removes the entire class of free-text-param-name misconfiguration bugs. (B) Prepare Intent Request jsCode: read `userStatus` from `input.userStatus || input.user?.status || 'unknown'`. Added `userStatus` to returned json so Parse Intent / Handle Gemini Error can read it as a top-level field. (C) Parse Intent + Handle Gemini Error: when intent uncertain/invalid AND userStatus='consultation_closed' → intentResult='feedback_intent' instead of 'general_enquiry'. Defensive fallback for Gemini outages/null-intents. Verification (execution 1303, 2026-05-18T12:16): HTTP auth succeeded (got a 503 Google-capacity error, not a 400 config error — proves the cred binding now works); prompt rendered 'Status: payment_submitted' (proves user?.status fallback); Handle Gemini Error correctly produced intentResult='general_enquiry'+geminiError=true via the new conditional (user not in consultation_closed at test time, so general_enquiry was the correct branch)."
    files_changed:
      - "workflows/eTV1lUcYrXBg2q2T.json (WF-25 — 4 node mods: Classify Intent cred + Prepare Intent Request + Parse Intent + Handle Gemini Error)"
      - "workflows/3va0M06kijgyLejf.json (WF-43 — 1 node mod: Gemini General Response cred)"
      - "docs/workflow-registry.md (WF-25 + WF-43 rows updated)"
    followups_logged:
      - "Gemini 2.5-flash-lite returned 503 'Service unavailable - This model is currently experiencing high demand' on the verification run. Transient Google-side capacity issue, NOT a config issue. Existing retryOnFail=true on the HTTP node helps; CLAUDE.md TD-NEW-016 documented this. Worth monitoring: if 503s become frequent, consider model fallback to gemini-2.0-flash-lite (which CLAUDE.md says is the project default — note WF-25 currently uses gemini-2.5-flash-lite)."
      - "WF-23 (Pre-Form Intent Filter), WF-30 (Payment Pending Intent Filter), WF-44 (Feedback Recorder) call WF-25 in defineBelow mode and map `userStatus: {{ $json.userStatus }}` — this expression resolves to undefined/empty in their upstream context. Their prompts render 'Status: unknown'. Not BUG-04 scope (their downstream routing doesn't depend on consultation_closed branch), but worth tracking as a separate input-contract followup."
    batch: 2
    workflow: WF-25
    workflow_id: eTV1lUcYrXBg2q2T
    node: Prepare Intent Request / Parse Intent / Route by Intent
    change_type: structural
    blast_radius: medium
    fix_pattern: "Two-part: (a) investigate why 'Amazing service' resolves to invalid/empty intent — review prompt, examine recent executions for Gemini raw response; (b) add status-aware fallback in Parse Intent so consultation_closed + null/invalid → feedback_intent rather than general_enquiry."
    depends_on: []
    blocks: []
    related_to: "followups-wf25-intent-classifier.md (prior session)"
    verification_after_build: "Free-text 'thank you so much' after a close routes through feedback save and ack."

  - id: BUG-05
    description: "WF-12 (Admin → WhatsApp Relay) is active in n8n but has no callers (WF-41 superseded it). Deactivate WF-12; reconcile workflow-registry.md, CONTEXT.md, STATUS.md to remove the four-way doc inconsistency. Add an orphaned-active-workflow guardrail to the technical-workflow-review skill."
    priority: P1
    severity: major
    status: done
    started_at: 2026-05-18T22:35 IST
    completed_at: 2026-05-18T23:05 IST
    completion_note: "Classified as Structural-lite (workflow-level activation toggle, abridged impact analysis — orphan status pre-verified by report and dependency-map.md showing 0 callers). Backup written archive/backups/RjwHs9Dx5cK8Q5wD-2026-05-18-22-59.json. Deactivated via POST /workflows/RjwHs9Dx5cK8Q5wD/deactivate (the dedicated activate/deactivate endpoint, not standard PUT — n8n's PUT body excludes the `active` flag). Verified live: active=false, 3 nodes preserved. Docs reconciled: workflow-registry.md row 84 → 🟡 Deactivated with full resurrect-path note; row 140 (WF-51) updated to mark WF-12 historically; row 259 (WF-12 sync table) → 🟡 Deactivated. CONTEXT.md:144 routing reference changed to WF-41. STATUS.md:109 row updated to deactivated with cross-ref; STATUS.md:133 summary updated; STATUS.md:158 post-go-live item 11 marked resolved. Final grep `WF-12.*Not Built` returns only historical artefacts (the BUG-05 spec itself + the test report describing the original bug) — no live doc still claims Not Built. Plugin guardrail (orphaned-active-workflow detector) deferred to followups for Batch 4 per user decision."
    files_changed:
      - "workflows/RjwHs9Dx5cK8Q5wD.json (WF-12 — active: true → false)"
      - "docs/workflow-registry.md (3 row updates: WF-12 status, WF-51 dependency note, WF-12 sync table row)"
      - "docs/CONTEXT.md (routing reference WF-12 → WF-41)"
      - "docs/STATUS.md (4 line updates: row 109, summary 133, post-go-live item 158)"
    batch: 3
    workflow: WF-12
    workflow_id: RjwHs9Dx5cK8Q5wD
    change_type: structural-lite + documentation
    blast_radius: low
    fix_pattern: "1) Deactivate WF-12 in n8n via API (PUT with active=false, preserving content). 2) Update workflow-registry.md WF-12 row → 🟡 Deactivated. 3) Edit CONTEXT.md:144 and STATUS.md:109,133,158 to remove 'Not Built' / stale claims. 4) Plugin work (orphaned-workflow guardrail) split into PLUGIN-03 if scoped separately, otherwise tracked under BUG-05's followup."
    depends_on: []
    blocks: []
    verification_after_build: "WF-12 shows active=false in n8n; docs grep for 'WF-12.*Not Built' returns zero; orphaned-workflow detector added to technical-workflow-review (if in-scope)."
    batch: 3
    workflow: WF-12
    workflow_id: RjwHs9Dx5cK8Q5wD
    change_type: surgical
    blast_radius: low
    fix_pattern: "1) Deactivate WF-12 in n8n via API (PUT with active=false, preserving content). 2) Update workflow-registry.md WF-12 row → 🟡 Deactivated. 3) Edit CONTEXT.md:144 and STATUS.md:109,133,158 to remove 'Not Built' / stale claims. 4) Plugin work (orphaned-workflow guardrail) split into PLUGIN-03 if scoped separately, otherwise tracked under BUG-05's followup."
    depends_on: []
    blocks: []
    verification_after_build: "WF-12 shows active=false in n8n; docs grep for 'WF-12.*Not Built' returns zero; orphaned-workflow detector added to technical-workflow-review (if in-scope)."

  - id: PLUGIN-01
    description: "n8n-whatsapp-methodology plugin: add a check to `technical-workflow-review` that flags HTTP nodes with `specifyBody=json` + raw-string `jsonBody` that interpolates `{{ ... }}` directly inside a JSON string literal. Encodes the BUG-02 anti-pattern as a guardrail."
    priority: P2
    severity: improvement
    status: done
    completed_at: 2026-05-18T23:18 IST
    completion_note: "Landed as check C13 in skills/technical-workflow-review/SKILL.md. Plugin commit 456513a (1.17.0). Detection: jq filter selecting nodes where type=n8n-nodes-base.httpRequest AND specifyBody=='json' AND jsonBody matches ^=\\s*[\\{\\[]. Severity 🟠."
    batch: 4
    target_repo: github.com/prasadmujumdar19/n8n-whatsapp-methodology
    change_type: surgical
    blast_radius: low
    fix_pattern: "Per plugin update-skill workflow: version bump, edit technical-workflow-review skill to add the regex/AST check, update CHANGELOG, commit to plugin repo, sync active cache. NOT a direct cache edit."
    depends_on:
      - id: BUG-02
        type: soft
        reason: "Validate fix shape in BUG-02 first so the guardrail rule matches the canonical correct form."
    blocks: []

  - id: PLUGIN-02
    description: "n8n-whatsapp-methodology plugin: add a check to `technical-workflow-review` that flags Postgres nodes whose `options.queryReplacement` contains 2+ comma-separated expressions where any expression evaluates to user-controlled text. Encodes the BUG-01 anti-pattern as a guardrail."
    priority: P2
    severity: improvement
    status: done
    completed_at: 2026-05-18T23:18 IST
    completion_note: "Landed as check C14 in skills/technical-workflow-review/SKILL.md. Plugin commit 456513a (1.17.0). Detection: jq filter selecting nodes where type=n8n-nodes-base.postgres AND parameters.options.queryReplacement matches \\}\\}\\s*,\\s*\\{\\{. Per-node reviewer judgement still required (machine-IDs safe, user text 🔴 must-fix)."
    batch: 4
    target_repo: github.com/prasadmujumdar19/n8n-whatsapp-methodology
    change_type: surgical
    blast_radius: low
    fix_pattern: "Per plugin update-skill workflow: version bump, edit technical-workflow-review skill to add the regex check, update CHANGELOG, commit, sync active cache."
    depends_on:
      - id: BUG-01
        type: soft
        reason: "Validate fix shape in BUG-01 first so the guardrail rule matches the canonical correct form."
    blocks: []

  - id: PLUGIN-03
    description: "n8n-whatsapp-methodology plugin: add an orphaned-active-workflow detector to `technical-workflow-review`. Detection: a workflow is orphaned-active if active=true AND its id is not a callee in dependency-map.md AND its start node is not in the externally-triggered whitelist (n8n-nodes-base.webhook / slackTrigger / scheduleTrigger / cron / emailReadImap). Sub-workflow start node (executeWorkflowTrigger) without any caller in the dependency map is also flagged. Encodes the BUG-05 anti-pattern as a guardrail."
    priority: P2
    severity: improvement
    status: done
    completed_at: 2026-05-18T23:18 IST
    completion_note: "Landed as check C15 in skills/technical-workflow-review/SKILL.md. Plugin commit 456513a (1.17.0). Detection: Python script that parses docs/dependency-map.md's machine-readable JSON block, builds callee set, then for every active=true workflow checks: has executeWorkflowTrigger AND no external trigger AND id not in callee set → flag. Whitelist includes webhook/slackTrigger/scheduleTrigger/cron/emailReadImap/formTrigger plus any node type containing 'Trigger' except executeWorkflowTrigger. Severity 🟡."
    batch: 4
    target_repo: github.com/prasadmujumdar19/n8n-whatsapp-methodology
    change_type: surgical
    blast_radius: low
    added_from: "followups.md (deferred from BUG-05 per user decision to keep Batch 3 surgical)"
    fix_pattern: "Per plugin update-skill workflow: same single version bump as PLUGIN-01 + PLUGIN-02. All three guardrails ship together."
    depends_on:
      - id: BUG-05
        type: soft
        reason: "Validate orphan-detection logic against the real BUG-05 scan output (WF-00 + WF-10 legitimate triggers, WF-12 was the true orphan now deactivated)."
    blocks: []

batches:
  - number: 1
    items: [BUG-02, BUG-01, BUG-03]
    estimated_tokens: 45000
    rationale: "Three pre-go-live critical fixes. BUG-02 and BUG-03 both in WF-43 → enforced sequential (same-workflow sibling). BUG-01 (WF-10) independent — can interleave but planner orders BUG-02 → BUG-01 → BUG-03 per report's recommended sequence."
  - number: 2
    items: [BUG-04]
    estimated_tokens: 15000
    rationale: "Its own sprint per the report ('BUG-04 — WF-25 reliability sprint'). Investigation + fallback rule. Independent of Batch 1 fixes."
  - number: 3
    items: [BUG-05]
    estimated_tokens: 7000
    rationale: "Cleanup + docs. Lower priority. Independent of all other items."
  - number: 4
    items: [PLUGIN-01, PLUGIN-02, PLUGIN-03]
    estimated_tokens: 18000
    rationale: "Plugin improvements. Soft-dep on Batch 1 fixes so the canonical correct form is known before encoding guardrails. PLUGIN-03 added mid-sprint from BUG-05 followups; ships in the same plugin version bump as PLUGIN-01/02."
