# Handoff — Pre-Wave-2 Apply

**Written:** 2026-05-25 (session 3)
**Sprint:** `2026-05-24-data-contract-discipline-phase-1`
**Active marker:** present (`_active` in sprint folder)

## Stopping Point

Wave 2 dispatched and all 8 Sonnet subagents returned structured edit plans. **No apply work was performed in this session** — the apply phase (18 workflows worth of pseudo writes + n8n partial-updates + verification) was deferred to a fresh session per user direction, to avoid mid-apply compaction risk on a heavy 8-subagent context.

All 8 subagent plans have been persisted verbatim (HTML-decoded) to `docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/wave-2-plans/sub-*.md`. Each file contains:
- Full n8n edit plan (node additions / modifications / removals / connection changes) per WF
- Complete revised `.pseudo` content per WF (the hardened deliverable that Wave 1 missed)
- Rationale citing design.md sections
- Drift findings (strict + adjacent)

A `README.md` in the same folder gives the apply order + decisions captured this session.

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/`. The skill will resume mid-Wave-2 (status reload from state.md). **Do NOT re-dispatch the subagents** — their plans are already on disk.

Apply phase per WF (18 total — sub-11/12/13 each own 4, sub-14 owns 2, others own 1):

### Hardened apply protocol (per this session's user-approved hardening)

For each WF:
1. **Read** the relevant `wave-2-plans/sub-*.md` (this contains both pseudo + n8n plan for that WF).
2. **Write `.pseudo` FIRST** to `docs/pseudocode/WF-XX.pseudo` (pseudo is source of truth per `[[feedback_pseudocode_first_refactor]]`).
3. **Grep verify** the expected new artifact is present in the freshly-written `.pseudo` (e.g., `grep -c 'Validate Inputs' docs/pseudocode/WF-02.pseudo` should return > 0; for Load-User removals, the removed node name should NOT appear).
4. **Apply n8n mutations** via `mcp__n8n__n8n_update_partial_workflow`. For nested-array updates that the MCP tool silently no-ops on (per `[[feedback_n8n_mcp_nested_array_update]]`), fall back to `jq + PUT` via the `source .env && curl -X PUT ...` pattern.
5. **Re-fetch the WF** via `mcp__n8n__n8n_get_workflow` and verify mutations landed (new node present, removed node absent, connections correct, jsCode contains expected substring).
6. **Update state.md** to mark the relevant TD-DCP-* items via the `execution_plan` blocks — note which sub-X delivered. Use the per-item `done_when` clause (e.g. TD-DCP-010 requires both sub-1 Wave 1 AND sub-10 Wave 2 to complete).

### Recommended apply order (lowest blast radius first)

| Step | Subagent | WFs | Risk |
|------|----------|-----|------|
| 1 | sub-6b | WF-10 | None (pseudo-only) |
| 2 | sub-8 | WF-02 | Low (single new node + connection rewire) |
| 3 | sub-9 | WF-11 | Low (single new node + connection rewire) |
| 4 | sub-10 | WF-22 | Low-medium (new Set node insertion) |
| 5 | sub-11 | WF-21, WF-23 (pseudo-only first), WF-30, WF-31 | Medium (jsCode renames + 1 node removal in WF-31) |
| 6 | sub-12 | WF-20, WF-40 (removal+rewire), WF-43, WF-44 | Medium |
| 7 | sub-13 | WF-32, WF-33, WF-42, WF-46 | High (4 confirmed Load-User removals with connection rewires per WF) |
| 8 | sub-14 | WF-41 (critical bug fix), WF-34 | High (WF-34 query simplification + 3 downstream rewires) |

### After all 8 subagents applied

1. Run `scripts/export-all-workflows.sh && python3 $PLUGIN/scripts/generate-workflow-md.py workflows docs/pseudocode` to refresh JSON + .md projections.
2. Run post-batch regression per build-sprint Step 4 (sibling detection on touched WFs).
3. **Proactive commit/push offer to user** (per build-sprint Step 4.6, required at every batch boundary):
   > "Commit and push Wave 2 (Batch 3) to GitHub now? Summary: 18 workflows modified — 2 entry guards added (WF-02, WF-11), 7 confirmed Load-User removals (WF-31, WF-40, WF-32, WF-33, WF-42, WF-46, + simplified WF-34), 9 caller payload renames to canonical contracts (WF-22/30/31/20/43/44/41 + WF-10 pseudo reconciliation)."
4. Once user confirms green: run Batch 4 (TD-DCP-071 workflow-registry update + TD-DCP-072 memory write) inline on main thread.
5. Sprint close: remove `_active` marker, final commit/push offer, update sprint-level followups.

## Decisions captured this session

1. **commandType enum (sub-9 drift):** **Full forms (live) are canonical** — `CLOSE_CONSULTATION` / `BLOCK_USER` / `UNBLOCK_USER`. design.md §2.2 shorthand is incorrect; log followup to update design.md (post-sprint).

2. **Pseudo-hardening for Wave 2 apply:** All three measures committed:
   - Brief hardening (already in subagent prompts — `pseudo_revisions` non-optional, complete-file return required, no diffs).
   - Apply pseudo BEFORE n8n per WF.
   - Per-batch close gate: grep every touched `.pseudo` for expected new artifact before declaring batch done.

## Changed Reference Values

- **GitHub head:** `7b4daf7` (Wave-1 pseudo reconciliation) — unchanged this session.
- **No live n8n mutations this session** — all 8 subagents returned plans only (per `[[feedback_subagent_permission_preauth]]`); parent has not applied.
- **Sprint state:** TD-DCP-050 / TD-DCP-060 = `done` (Wave 1). All P1 Wave-2 items still `pending`. P2 Batch 4 items still `pending`.

## Blockers

- **None.** All 8 plans are clean; user authorized the hardening + dispatch; decisions captured.
- **3 adjacent findings from Wave 1** still in followups.md — disposition deferred to sprint close, not blockers for Wave 2 apply.

## Strict findings to apply (all in plans, no separate action needed)

| WF | Finding | Fix in plan |
|----|---------|-------------|
| WF-30 | `Prepare Payment Reminder` legacy `message` key | sub-11 jsCode rename |
| WF-31 | `Prepare Under Review Message` legacy `message` | sub-11 jsCode rename |
| WF-31 | `Load User for Relay` redundant SELECT | sub-11 node removal + connection rewire |
| WF-40 | `Load User Record` redundant SELECT | sub-12 node removal + connection rewire |
| WF-43 | `Extract Gemini Reply` legacy `message` | sub-12 jsCode rename |
| WF-44 | `Prepare Ack` + `Send Ack` legacy `message` | sub-12 jsCode + Execute-Workflow mapping rename |
| WF-41 | **LATENT RUNTIME BUG**: reads `input.adminMessage` but Wave 1 Relay Envelope emits `messageText` | sub-14 jsCode field rename — fixes per-call WF-50 entry-guard failure |

## Followups (for sprint-close triage)

| Item | Source | Disposition |
|------|--------|-------------|
| Update design.md §2.2 commandType enum — drop shorthand, keep full forms | sub-9 drift | Post-sprint doc update |
| Adjacent Wave-1 findings (WF-60 `slackMessageTs`, WF-10 Load User Status SELECT expansion, WF-51 regex tightening) | followups.md | Pre-existing; triage at sprint close |
| TD-DRIFT-006 (WF-20 Normalize Keyword drops userStatus) | sub-12 finding | Out of Phase 1 scope (§1.5) |
| TD-DRIFT-009 (WF-25 callers send `messageText` not `messageContent`) | sub-11/12 finding | Out of Phase 1 scope (§1.5) |
| TD-DRIFT-017 (WF-33 `verified_by` column receives channelId) | sub-13 finding | Out of Phase 1 scope (§1.5) |
| WF-46 `blocked_reason` column hardcoded, caller `reason` only in Slack message | sub-13 finding | TD candidate |
| design.md §3.4 lists WF-44 `Load User for Relay` removal but live has no such node | sub-12 finding | Already removed pre-sprint; informational |

## Plugin improvements surfaced

- **Subagent dispatch brief hardening worked.** All 8 subagents this session returned `pseudo_revisions` with complete-file content as required (vs Wave 1 where the brief asked for `pseudo_diff` and got nothing). The "return complete file, not diff; empty is failure unless explicitly `no_change_reason`" wording in the brief is the differentiator. Recommend updating `build-sprint` skill's `subagent_dispatch_protocol.per_subagent_brief_template` to include this exact wording.
- **Mode D parallel dispatch with `run_in_background=true` worked smoothly.** All 8 subagents completed in ~80s–215s without monitoring intervention. None hit sandbox issues (no Bash work — pure analysis). Reinforces that `[[feedback_parallel_subagent_background_dispatch]]` + structured-return pattern (`[[feedback_subagent_permission_preauth]]`) is the right combo for read-heavy analysis-only subagents.
- **Saving plans to disk before apply is a robustness pattern.** Persisting structured returns to `wave-2-plans/sub-*.md` before applying decouples dispatch session from apply session, lets apply happen in a fresh context window, and provides an audit trail. Recommend adding this as an optional pattern in `build-sprint` skill under Mode D for sprints with large parallel waves.
