# Data Contract Discipline — Phase 1 — Build Sprint Working Copy

**Sprint slug:** `2026-05-24-data-contract-discipline-phase-1`
**Source spec (read-only):** [`docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/tasks.md`](../../specs/2026-05-24-data-contract-discipline-phase-1/tasks.md)
**Design:** [`design.md`](../../specs/2026-05-24-data-contract-discipline-phase-1/design.md)
**Planning state (authoritative):** [`state.md`](./state.md)
**Testing plan (separate, run after build):** [`testing.md`](./testing.md)

This file is the annotation-friendly view of the build items. `state.md` is the YAML authority.

---

## ⚠️ Pre-Wave Cross-Check Gate (mandatory before any dispatch)

Per `state.md` → `pre_wave_verification.gate`: before dispatching either wave, build-sprint MUST fetch the live n8n workflow list and verify every `Live ID` below against current n8n. Halt and surface mismatches before any subagent is spawned. Origin: WF-00↔WF-47 ID swap caught mid-sprint 2026-05-24.

### Pre-Wave 1 cross-check table (7 subagents, each owns 1 workflow)

| Sub | WF | Live ID (verify) | Change (one line) |
|---|---|---|---|
| sub-1 | WF-52 | `IO5BZLUxuVmjzk5I` | Add `Validate Inputs` entry-guard Code node (§2.5) |
| sub-2 | WF-60 | `6H75p935FpBVBQtV` | Add discriminated-union `Validate Inputs` entry-guard (§2.6) |
| sub-3 | WF-50 | `BUVun38WEKb12zg9` | Add discriminated-union entry-guard (§2.3) + audit `Build WF-60 Payload` outbound-wa |
| sub-4 | WF-51 | `wlZRK0YxnhP0b2RL` | Add entry-guard (§2.4) + audit `Build WF-60 Payload` outbound-slack |
| sub-5 | WF-01 | `hYGNM97sXvdo1WmI` | Add `Build WF-01 Envelope` Code node before output branches (§2.1) |
| sub-6a | WF-10 | `wMh0oBRtJbvhLgOf` | Add `Build WF-10 Command Envelope` + `Build WF-10 Relay Envelope` Code nodes (§2.2) — envelopes only |
| sub-7 | WF-00 | `JQu1MkK5vgtUCeNO` | Rename `Build WF-60 Payload` (wa inbound) to canonical (§2.6) |

### Pre-Wave 2 cross-check table (8 subagents)

| Sub | WF(s) | Live ID(s) (verify) | Change (one line) |
|---|---|---|---|
| sub-6b | WF-10 | `wMh0oBRtJbvhLgOf` | 6× `Prepare WF-51 Payload` renames + `Build WF-60 Payload` slack-inbound rename |
| sub-8 | WF-02 | `PubCsNTOspF3xqXZ` | Add entry-guard validating WF-01 envelope (§2.7) |
| sub-9 | WF-11 | `GoTYo0GS2y8qjjkw` | Add entry-guard validating WF-10 commandType envelope (§2.8) |
| sub-10 | WF-22 | `dr8QM0m92Ml8MvIh` | Rename `phone_number`→`phoneNumber`, `userName`→`name` on WF-52 caller + WF-01 envelope consumer audit |
| sub-11 | WF-21 / WF-23 / WF-30 / WF-31 | `zM8WbxSdt9nXRoLZ` / `VpCER0Vqq3NYJGpI` / `gGJBY5fJha0Let8I` / `HB8nXudAtk9iXz7C` | Cluster A: WF-01 envelope consumer audit + WF-50/WF-51 caller payload renames |
| sub-12 | WF-20 / WF-40 / WF-43 / WF-44 | `LgIDj1v4ZbCPlX25` / `du32QBZbSQOjfESe` / `3va0M06kijgyLejf` / `Du2CJ3OTohRFZYoA` | Cluster B: consumer audit + caller payload renames |
| sub-13 | WF-32 / WF-33 / WF-42 / WF-46 | `emUOLWVZiNVxcOe3` / `NcHZedq9ycnAQ9SW` / `fx70vqyJtRdF2DgR` / `UV62An60fzflU0uD` | Cluster C (BOTH envelopes): confirmed Load-User SELECT removals + envelope rewrites |
| sub-14 | WF-41 / WF-34 | `6PzJRZsF7k2d9hV7` / `se82n3MUQ9xE5aEr` | Cluster D: WF-10 consumer audit; WF-41 Load User for Relay removal |

**How the next session uses this:** when build-sprint resumes, it fetches the live workflow list once, fills a `✓/✗` column against each row, renders the table back, and halts on any ✗. Only after the user confirms the live-verified table does dispatch proceed.

---

## Batch 1 — Foundation (serial, main thread)

| ID | Item | Mode |
|---|---|---|
| TD-DCP-001 | Write `scripts/snapshot-for-sprint.sh` + `scripts/restore-from-snapshot.sh` per `snapshot-restore-design.md` | Inline |
| TD-DCP-002 | Run `scripts/snapshot-for-sprint.sh data-contract-phase-1` → commit `workflows/pre-data-contract-workflows/<YYYY-MM-DD>/` | Inline |

---

## Batch 2 — Wave 1 (7 parallel Sonnet subagents)

One subagent per workflow JSON. No two subagents touch the same WF.

| Sub | WF | n8n ID | Scope summary | Source items |
|---|---|---|---|---|
| sub-1 | WF-52 | `IO5BZLUxuVmjzk5I` | Entry guard (§2.5) | DCP-010 |
| sub-2 | WF-60 | `6H75p935FpBVBQtV` | Entry guard, discriminated union (§2.6) | DCP-020 |
| sub-3 | WF-50 | `BUVun38WEKb12zg9` | Entry guard (§2.3) + Build WF-60 Payload audit | DCP-040, DCP-020 |
| sub-4 | WF-51 | `wlZRK0YxnhP0b2RL` | Entry guard (§2.4) + Build WF-60 Payload audit | DCP-030, DCP-020 |
| sub-5 | WF-01 | `hYGNM97sXvdo1WmI` | Add Build WF-01 Envelope node, §2.1 emission | DCP-050 |
| sub-6a | WF-10 | `wMh0oBRtJbvhLgOf` | Build WF-10 Command + Relay envelopes per §2.2 (envelopes only — caller renames deferred to sub-6b in Wave 2) | DCP-060 |
| sub-7 | WF-00 | `JQu1MkK5vgtUCeNO` | Build WF-60 Payload rename (wa inbound) | DCP-020 |

---

## Between Waves — inline reset step (mandatory)

Run before dispatching Wave 2:

```bash
scripts/export-all-workflows.sh
python3 $PLUGIN/scripts/generate-workflow-md.py workflows docs/pseudocode
git add workflows/ docs/pseudocode/*.md
git commit -m "sprint: wave 1 landed, refresh .md projections"
git push
```

Skipping causes Wave 2 subagents to fail `assert-md-fresh.sh` (exit 2) on the WFs Wave 1 just mutated.

---

## Batch 3 — Wave 2 (8 parallel Sonnet subagents)

Dispatched after Wave 1 lands + between-waves step completes. Defense-in-depth guards require routers; consumer cleanups require envelopes. sub-6b finishes the WF-10 work deferred from Wave 1.

| Sub | Workflow(s) | n8n ID(s) | Scope summary | Source items |
|---|---|---|---|---|
| sub-6b | WF-10 | `wMh0oBRtJbvhLgOf` | 6 Prepare WF-51 Payload renames + Build WF-60 Payload rename (slack inbound). Builds on sub-6a envelopes from Wave 1. | DCP-030, DCP-020 |
| sub-8 | WF-02 | `PubCsNTOspF3xqXZ` | Entry guard validating WF-01 envelope (§2.7) | DCP-051 |
| sub-9 | WF-11 | `GoTYo0GS2y8qjjkw` | Entry guard validating WF-10 commandType envelope (§2.8) | DCP-061 |
| sub-10 | WF-22 | `dr8QM0m92Ml8MvIh` | Rename WF-52 caller payload (phone_number→phoneNumber, userName→name) + WF-01 envelope consumer audit | DCP-010, DCP-052 |
| sub-11 | WF-21, WF-23, WF-30, WF-31 | `zM8WbxSdt9nXRoLZ`, `VpCER0Vqq3NYJGpI`, `gGJBY5fJha0Let8I`, `HB8nXudAtk9iXz7C` | WF-01 envelope consumer audit cluster A + WF-50/WF-51 caller renames where applicable | DCP-052, DCP-040, DCP-030 |
| sub-12 | WF-20, WF-40, WF-43, WF-44 | `LgIDj1v4ZbCPlX25`, `du32QBZbSQOjfESe`, `3va0M06kijgyLejf`, `Du2CJ3OTohRFZYoA` | Consumer cluster B + WF-50/WF-51 caller renames in WF-43/WF-44. (WF-44 ID resolved — design.md transcription error fixed) | DCP-052, DCP-040, DCP-030 |
| sub-13 | WF-32, WF-33, WF-42, WF-46 | `emUOLWVZiNVxcOe3`, `NcHZedq9ycnAQ9SW`, `fx70vqyJtRdF2DgR`, `UV62An60fzflU0uD` | Consumer cluster C — workflows that consume BOTH routers. Confirmed Load-User SELECT removals. WF-46 ID corrected (design.md transcription error fixed). **Do NOT fix TD-DRIFT-017 — out of scope.** | DCP-052, DCP-062 |
| sub-14 | WF-41, WF-34 | `6PzJRZsF7k2d9hV7`, `se82n3MUQ9xE5aEr` | Consumer cluster D — WF-10 envelope consumers; WF-41 confirmed Load User for Relay removal + WF-50 caller rename | DCP-062, DCP-040 |

---

## Batch 4 — Close (serial, main thread)

| ID | Item |
|---|---|
| TD-DCP-071 | Update `docs/workflow-registry.md` to reflect 6 entry guards + 2 router envelopes |
| TD-DCP-072 | Write `feedback_data_contract_discipline.md` memory + index in `MEMORY.md` |

---

## Items removed from build-sprint scope (testing — see `testing.md`)

- TD-DCP-003 — Baseline smoke
- TD-DCP-004 — Rollback drill
- TD-DCP-011 — WF-52 unit smoke
- TD-DCP-021 — WF-60 unit smoke
- TD-DCP-031 — WF-51 unit smoke
- TD-DCP-041 — WF-50 unit smoke
- TD-DCP-053 — WF-01 envelope unit smoke
- TD-DCP-063 — WF-10 envelope unit smoke
- TD-DCP-070 — Final regression

---

## Subagent dispatch protocol (cheat sheet)

- **Dispatch:** one message, multiple `Agent` calls, `run_in_background: true` on each (per `feedback_parallel_subagent_background_dispatch`).
- **Permission model:** subagent returns structured edit plan only — parent applies via `mcp__n8n__n8n_update_partial_workflow` (per `feedback_subagent_permission_preauth`).
- **Monitor:** `Monitor` on TaskOutput, 60s cadence, 2-min abort budget per CLAUDE.md subagent rule 5.
- **Model:** Sonnet (user override of Haiku default, one-time for this sprint).
- **Verify:** every n8n edit followed by re-fetch (per `feedback_n8n_mcp_nested_array_update`).
- **Commit cadence:** after each wave completes (per `feedback_proactive_commit_push`).
- **Pseudo discipline:** linear Step numbering (no tombstones), tech-agnostic (no n8n error handling), typeVersion floor for fresh nodes.
