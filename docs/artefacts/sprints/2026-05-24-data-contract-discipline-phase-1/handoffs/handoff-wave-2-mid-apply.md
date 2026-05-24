# Handoff — Wave 2 Mid-Apply (subs 6b/8/9/10/11 landed; 12/13/14 + Batch 4 pending)

**Written:** 2026-05-24T18:25:36Z (build-sprint session 4)
**Sprint:** `2026-05-24-data-contract-discipline-phase-1`
**Active marker:** present (`_active` in sprint folder)
**GitHub head:** `7c428e1` (Wave 2 partial apply — subs 6b/8/9/10/11)

## Stopping Point

5 of 8 Wave-2 subagent plans applied + verified + committed + pushed this session. Context budget approaching the safe-handoff threshold before sub-12 (4-WF cluster) starts; user explicitly chose "finish sub-11 then handoff" to avoid mid-apply compaction risk.

### What landed this session (verified post-PUT, see `state.md` → `wave_2_apply_progress`)

| Sub | WF(s) | n8n change | Pseudo |
|-----|-------|------------|--------|
| sub-6b | WF-10 | none (Wave 1 sub-6a already deployed canonical nodes) | WF-10.pseudo rewritten |
| sub-8 | WF-02 | +Validate Inputs (code v2); trigger rewired | WF-02.pseudo rewritten |
| sub-9 | WF-11 | +Validate Inputs (code v2, 8 enum FULL forms); trigger rewired | WF-11.pseudo rewritten + renumbered linearly (sub-9 plan had tombstones at Steps 7/9/17/20 — collapsed to 17 linear steps with Switch gotos updated per `[[feedback_pseudo_linear_numbering]]`) |
| sub-10 | WF-22 | +Prepare WF-52 Payload (set v3.4, 3 assignments); wired between Create User Record and Ensure Slack Channel Exists | WF-22.pseudo rewritten |
| sub-11 | WF-21, 23, 30, 31 | WF-21/23 pseudo-only. WF-30: jsCode + mapping rename (message→messageContent + messageType). WF-31: 2 jsCode rewrites + Load User for Relay removal + trigger fan-out rewired direct to Prepare Admin Relay | All 4 pseudos rewritten |

**Strict findings resolved this session:** WF-30/31 legacy `message` key (rejected by WF-50 entry guard); WF-31 `Load User for Relay` redundant SELECT.

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/`. The skill will resume mid-Wave-2 by reading `state.md → wave_2_apply_progress`. **Do NOT re-dispatch subagents** — plans are still on disk in `wave-2-plans/sub-{12,13,14}.md`.

### Pending Wave-2 apply (in lowest-risk order)

| Step | Sub | WFs | Risk | Notes |
|------|-----|-----|------|-------|
| 6 | sub-12 | WF-20, WF-40, WF-43, WF-44 | Med | jsCode renames in 3 WFs + Load User Record removal in WF-40 + rewire + Execute-Workflow mapping rename in WF-44 |
| 7 | sub-13 | WF-32, WF-33, WF-42, WF-46 | High | 4 confirmed Load-User SELECT removals with per-WF connection rewires |
| 8 | sub-14 | WF-41, WF-34 | High | **WF-41 latent runtime bug fix** (jsCode reads `input.adminMessage` but Wave 1 Relay Envelope emits `messageText` — every admin relay currently fails at WF-50 entry guard). WF-34 simplify `Load User by Phone` SELECT to fetch only `payment_id` + 3 downstream rewires |

### After all 8 subs applied

1. Run `scripts/export-all-workflows.sh` + `generate-workflow-md.py` (this session already did this for the 5 applied subs — re-run after sub-12/13/14 so JSON + .md projections include those mutations).
2. Rebuild dependency map: `scripts/build-dependency-map.sh` (if the script exists in the plugin's active version).
3. Post-batch sibling regression per build-sprint Step 4 — sibling detection on touched WFs (especially the Load-User-removal sites in sub-13); log any strict/adjacent findings to `followups.md`.
4. Proactive commit/push offer for sub-12/13/14 (required per build-sprint Step 4.6).
5. Batch 4 inline: TD-DCP-071 (`docs/workflow-registry.md` reflect post-build state) + TD-DCP-072 (write `feedback_data_contract_discipline.md` memory + update `MEMORY.md`).
6. Sprint close: `rm docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/_active`, final commit/push offer.

## Per-WF Apply Protocol (hardened — keep using this for sub-12/13/14)

1. Read the relevant `wave-2-plans/sub-X.md` (plans already on disk).
2. **Write `.pseudo` FIRST** to `docs/pseudocode/WF-XX.pseudo` (pseudo is source of truth per `[[feedback_pseudocode_first_refactor]]`).
3. **Grep-verify** expected new artifact present (and removed names absent, where applicable).
4. **Renumber linearly if the plan has tombstones** (per `[[feedback_pseudo_linear_numbering]]` — sub-9 needed this; sub-12/13/14 may also).
5. Fetch the live WF to `/tmp/claude-scratch/wf-XX-pre.json` via `source .env && curl ...`.
6. Build patched JSON via `jq` (in-place modifications: `(.nodes[] | select(.name == "X") | .parameters.jsCode) |= "..."`; node removal: `.nodes |= map(select(.name != "X"))`; connection rewire: `.connections."X".main[0] = [{...}]`).
7. PUT via `source .env && curl -X PUT -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json" --data @wf-XX-put.json http://localhost:5678/api/v1/workflows/<id>`. PUT body is `{name, nodes, connections, settings, staticData}`.
8. Re-fetch + grep-verify the mutations actually landed (per `[[feedback_n8n_mcp_nested_array_update]]`).
9. Update `state.md → wave_2_apply_progress` (set status: done with applied_at UTC, n8n_edits summary, items_advanced).

## Type-version floor reference (validated this session)

- `n8n-nodes-base.code` floor: **v2** (matches Detect Route, Restore Route Data, Build UNHANDLED Alert in WF-02).
- `n8n-nodes-base.set` floor: **v3.4** (matches recent Wave-1 additions in WF-10 — sub-10 plan said v3, used v3.4 per `[[feedback_typeversion_floor]]`).

## Changed Reference Values

- **Tunnel:** open this session — `ssh -L 5678:localhost:5678 -L 5050:localhost:5050 -L 5432:localhost:5432 root@45.79.125.184`. Re-verify next session via `curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:5678/healthz`.
- **GitHub head:** `7c428e1` (was `ddf8f27` at session start). 41 files changed.
- **Sprint state:** TD-DCP-050, 060, 010 fully complete (sub-1 Wave 1 + sub-10 Wave 2 both landed); TD-DCP-051, 061 fully complete (sub-8, sub-9 single-sub items). Other multi-sub items partial (sub-12/13/14 pending).

## Blockers

- **None.** Plans on disk are complete; tunnel pattern verified; apply protocol verified across 5 subs this session.

## Plugin Improvements Surfaced

- **Pseudo tombstone normalization at apply-time.** sub-9 plan returned by Sonnet subagent contained 4 tombstone steps (`Step N: (removed/deleted/reserved)`). The applier (this session) had to detect and renumber linearly to comply with `[[feedback_pseudo_linear_numbering]]`. Recommend adding a brief pre-check to the subagent prompt template in `build-sprint.subagent_dispatch_protocol.per_subagent_brief_template`: explicitly forbid tombstone steps in the `pseudo_revisions` return; require linear numbering throughout. Otherwise the apply phase keeps paying this cost.
- **typeVersion floor cross-WF lookup.** sub-10 plan specified `set v3` for a new Set node. Live floor for `n8n-nodes-base.set` across nearby WFs was v3.4. Per `[[feedback_typeversion_floor]]`, used v3.4 (not v3, not "latest"). The apply protocol step "match typeVersion floor in live n8n" worked, but it would help to add a one-line note to `build-sprint`: "if a plan specifies a typeVersion lower than what's already in live for that node.type, prefer the live floor."

## Followups Triage (carried forward — no action this session)

See `followups.md` and `wave-2-plans/README.md → Adjacent findings`:
- Update design.md §2.2 — drop commandType shorthand, keep FULL forms (sub-9 drift; user decision captured).
- Wave-1 adjacent findings (WF-60 slackMessageTs, WF-10 Load User Status SELECT expansion, WF-51 regex tightening).
- TD-DRIFT-006 (WF-20 Normalize Keyword drops userStatus) — out of Phase 1 scope.
- TD-DRIFT-009 (WF-25 callers send `messageText` not `messageContent`) — out of Phase 1 scope.
- TD-DRIFT-017 (WF-33 `verified_by` column receives channelId) — out of Phase 1 scope.
- WF-46 `blocked_reason` column hardcoded — TD candidate.
