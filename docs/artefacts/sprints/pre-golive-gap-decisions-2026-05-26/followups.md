# Sprint Followups — pre-golive-gap-decisions-2026-05-26

Findings surfaced by the sprint's regression checks but outside the sprint's strict scope.

## [2026-05-26] — Post-Batch-2 (P0 fan-out Pass 1) regression

- **WF-51 (`wlZRK0YxnhP0b2RL`) — `Post to Slack` Slack node has `operation: null` and `resource: null`** (classification: **adjacent**)
  - Cause-and-effect: n8n validator rejects with `Invalid value for 'operation'. Must be one of: delete, getPermalink, search, post, sendAndWait, update`. The node is on the critical path of WF-51 (every outbound Slack send routes through it).
  - **Pre-existing latent state, NOT introduced by this sprint** — same null shape confirmed in the pre-fix backup (`archive/backups/wlZRK0YxnhP0b2RL-2026-05-26-12-29.json`). Project Slack flows currently appear to function in production, so the runtime is more permissive than the validator about null operation+resource on Slack v2.3, OR a defaulting code path kicks in.
  - Proposed fix: set `operation: "post"` and `resource: "message"` on the `Post to Slack` node (or whatever the production runtime is implicitly using). Single Surgical change. Validates blocked Slack-send workflows that depend on the validator.
  - Priority hint: P2 — production Slack sends work today; this is a validator-only complaint that blocks future MCP-validation-clean assertions on WF-51.
  - Decision: _pending user direction_.

- **n8n runtime `WorkflowHasIssuesError` is stricter than `mcp__n8n__n8n_validate_workflow`** (classification: **adjacent — methodology**)
  - Cause-and-effect: Validator reported `valid: true` for WF-01 after the Gap 10 fix, but the n8n runtime still threw `WorkflowHasIssuesError` for 2 executions. Root cause (in WF-01) was a Postgres node with `operation` field unset (defaulted to `insert`) which the runtime's `getNodeParametersIssues` flagged via visible-required-field check, but the MCP validator surfaced only as a benign-looking "Property 'query' won't be used" warning.
  - Implication: the plugin's `build-workflow` skill currently relies on `mcp__n8n__n8n_validate_workflow` as the post-PUT verification gate. That gate is necessary but not sufficient — it misses at least the Postgres-operation-default and likely other UI-level issues.
  - Proposed fix: add a "runtime issue probe" to the plugin (either a script that calls n8n's UI-level issue endpoint, or a node-by-node call to `mcp__n8n__validate_node` with `profile: strict` aggregated into a workflow-level check). Capture as a plugin improvement (Step 5 of [Batch 7 prereq: `flush-plugin-improvements`]).
  - Priority hint: P1 (plugin) — affects every future workflow change; in scope of the existing Batch 7 plugin-flush task per state.md.
  - Decision: _bundle into Batch 7 plugin-improvement flush_.
