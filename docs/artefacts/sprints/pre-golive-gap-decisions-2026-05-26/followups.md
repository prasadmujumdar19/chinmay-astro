# Sprint Followups — pre-golive-gap-decisions-2026-05-26

Findings surfaced by the sprint's regression checks but outside the sprint's strict scope.

## [2026-05-26] — Post-Batch-2 (P0 fan-out Pass 1) regression

- **WF-51 (`wlZRK0YxnhP0b2RL`) — `Post to Slack` Slack node has `operation: null` and `resource: null`** (classification: **adjacent**)
  - Cause-and-effect: n8n validator rejects with `Invalid value for 'operation'. Must be one of: delete, getPermalink, search, post, sendAndWait, update`. The node is on the critical path of WF-51 (every outbound Slack send routes through it).
  - **Pre-existing latent state, NOT introduced by this sprint** — same null shape confirmed in the pre-fix backup (`archive/backups/wlZRK0YxnhP0b2RL-2026-05-26-12-29.json`). Project Slack flows currently appear to function in production, so the runtime is more permissive than the validator about null operation+resource on Slack v2.3, OR a defaulting code path kicks in.
  - Proposed fix: set `operation: "post"` and `resource: "message"` on the `Post to Slack` node (or whatever the production runtime is implicitly using). Single Surgical change. Validates blocked Slack-send workflows that depend on the validator.
  - Priority hint: P2 — production Slack sends work today; this is a validator-only complaint that blocks future MCP-validation-clean assertions on WF-51.
  - Decision: _pending user direction_.

- **WF-25 garbage-intent payload missing `messageType` for WF-50 contract** (classification: **adjacent — data flow**)
  - Cause-and-effect: WF-25's `Prepare Garbage Warning` Code node builds a payload for `Send Garbage Warning` (executeWorkflow → WF-50) without setting `messageType: "text"`. WF-50's entry guard correctly throws `WF-50 contract: messageType must be text|interactive|template, got: undefined`. Reproduced 2026-05-26 (exec 2254/2256) when user sent garbage text "Text to test n8n workflow passthrough vs defineSchema issues".
  - Confirms the data-contract framework is doing its job (catching the non-compliant upstream caller, not silently letting bad data through to WhatsApp).
  - Proposed fix: add `messageType: "text"` (and any other required §2.3 fields) to the payload built by `Prepare Garbage Warning`. Single-node Surgical change. Verify against §2.3 WF-50 sender variant contract before write. Same fix likely applies to `Prepare Block Warning` (sibling node in same garbage/abuse handling chain).
  - Priority hint: P1 — garbage classification IS user-facing (user gets blocked when an astrology-style query is misclassified as garbage). Bundled into P1 sprint phase or treated as its own follow-up sprint depending on user direction.
  - Decision: _pending user direction_.

- **n8n runtime resource-mapper rejects `value: null` for `mappingMode: defineBelow`** (classification: **adjacent — methodology, recipe correction landed in-sprint**)
  - Cause-and-effect: n8n's `validateResourceMapperValue` calls `Object.keys(value)` which throws `TypeError: Cannot convert undefined or null to object` when value is null. The MCP validator does NOT catch this — only manifests at executeWorkflow node runtime when the call is actually made. Original Gap 10 Decisions recipe specified `value: null`; this was based on n8n's source-code default (`{ mappingMode: 'defineBelow', value: null }`) but the default is only safe for the inspector/schema-loader UI, not the resource-mapper validator path that fires when the node executes.
  - **Resolution applied in-sprint:** mid-Batch 3 smoke test (exec 2241) caught the TypeError; recipe corrected to `value: {}` (empty object); patched across 23 workflows (Batches 2+3) in a single jq+PUT pass; `fix-workflow.sh` recipe updated; re-smoke (exec 2252+2253) confirmed end-to-end WhatsApp reply delivery. Documented as a hard lesson for any future Gap 10-style mappingMode work.
  - Priority hint: P1 (plugin / methodology). Same family as the runtime-stricter-than-MCP-validator finding below — bundle into Batch 7 `flush-plugin-improvements`.
  - Decision: _bundle into Batch 7 plugin-improvement flush_.

- **n8n runtime `WorkflowHasIssuesError` is stricter than `mcp__n8n__n8n_validate_workflow`** (classification: **adjacent — methodology**)
  - Cause-and-effect: Validator reported `valid: true` for WF-01 after the Gap 10 fix, but the n8n runtime still threw `WorkflowHasIssuesError` for 2 executions. Root cause (in WF-01) was a Postgres node with `operation` field unset (defaulted to `insert`) which the runtime's `getNodeParametersIssues` flagged via visible-required-field check, but the MCP validator surfaced only as a benign-looking "Property 'query' won't be used" warning.
  - Implication: the plugin's `build-workflow` skill currently relies on `mcp__n8n__n8n_validate_workflow` as the post-PUT verification gate. That gate is necessary but not sufficient — it misses at least the Postgres-operation-default and likely other UI-level issues.
  - Proposed fix: add a "runtime issue probe" to the plugin (either a script that calls n8n's UI-level issue endpoint, or a node-by-node call to `mcp__n8n__validate_node` with `profile: strict` aggregated into a workflow-level check). Capture as a plugin improvement (Step 5 of [Batch 7 prereq: `flush-plugin-improvements`]).
  - Priority hint: P1 (plugin) — affects every future workflow change; in scope of the existing Batch 7 plugin-flush task per state.md.
  - Decision: _bundle into Batch 7 plugin-improvement flush_.
