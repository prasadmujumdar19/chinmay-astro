# Planning Changes — Data Contract Discipline Phase 1

Brief log of principle / execution-order deviations from `docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/tasks.md` and `design.md`. See `state.md` for the authoritative executable plan.

## Principles changed

1. **Per-unit testing during build → all testing post-build.** The spec interleaves a `monitor-test-run` smoke after each utility/router unit lands (DCP-011, 021, 031, 041, 053, 063). Pre-live with zero traffic, those gates buy no safety. All 5 testing sessions moved into `testing.md`, run serially after `build-sprint` exits.

2. **Ascending-blast-radius sequencing → workflow-ownership grouping.** The spec hard-chains 18 P1 items in ascending-risk order so each unit can be rolled back independently. Pre-live, the safety motivation disappears. Items regrouped so each subagent owns ALL edits on exactly one workflow JSON — no concurrent writes to the same WF.

3. **Per-WF backup + per-unit rollback → sprint-wide snapshot + post-build rollback.** Snapshot is taken once in Batch 1. Rollback is reserved for post-test triage; the parent does NOT auto-restore on mid-wave subagent failures. Snapshot blast-radius (full Wave 1 set, not per-WF) is the accepted tradeoff.

4. **Sequential inline execution → 2-wave parallel subagent execution.** Sonnet authorized for this sprint (one-time override of Haiku default per CLAUDE.md §"Subagent Delegation" rule 6). Subagents return structured edit plans only; parent applies via `mcp__n8n__n8n_update_partial_workflow` (avoids permission-inheritance issues).

## Execution order changes

- **Batch 1 (serial inline):** TD-DCP-001 (scripts) → TD-DCP-002 (snapshot).
- **Batch 2 / Wave 1 (7 parallel subagents):** WF-52, WF-60, WF-50, WF-51, WF-01, WF-10 (envelopes only — sub-6a), WF-00.
- **Between Waves (mandatory inline):** re-export workflows → regenerate `.md` projections → commit. Skipping causes Wave 2 to fail `assert-md-fresh.sh`.
- **Batch 3 / Wave 2 (8 parallel subagents):** WF-10 caller renames (sub-6b deferred from Wave 1), WF-02 guard, WF-11 guard, WF-22, plus 4 consumer-leaf clusters covering WF-21/23/30/31, WF-20/40/43/44, WF-32/33/42/46, WF-41/34.
- **Batch 4 (serial inline):** TD-DCP-071 registry → TD-DCP-072 memory.
- **Post-build testing (separate, `testing.md`):** T1 canonical-paths smoke → T2 rollback drill → T3 Wave 1 anchor → T4 Wave 2 anchor → T5 final regression.

## Items collapsed across waves (multi-sub coverage)

Some source items now span both waves because their scope crosses workflow boundaries. `state.md` carries a `done_when` predicate or `execution_plan` block per item, but at a glance:

- **TD-DCP-010** (WF-52 guard + WF-22 caller align): sub-1 (W1) + sub-10 (W2).
- **TD-DCP-020** (WF-60 guard + 4-caller audit): sub-2/3/4/7 (W1) + sub-6b (W2).
- **TD-DCP-030** (WF-51 guard + ~14-caller audit): sub-4 (W1) + sub-6b/11/12 (W2).
- **TD-DCP-040** (WF-50 guard + ~18-caller audit): sub-3 (W1) + sub-11/12/14 (W2).
- **TD-DCP-052** (WF-01 envelope-consumer audit): sub-10/11/12/13 (W2).

## Spec corrections folded into the plan

- WF-44 ID: spec listed `HB8nXudAtk9iXz7C` (that's WF-31's). True: `Du2CJ3OTohRFZYoA`. Fixed in `design.md` §3.4 table 2026-05-24.
- WF-46 ID: spec listed `se82n3MUQ9xE5aEr` (that's WF-34's). True: `UV62An60fzflU0uD`. Same fix. Without this, sub-13 and sub-14 would have both attempted to write WF-34 in Wave 2 — concurrent-write collision.

## Out of scope (kept from spec, restated for clarity)

- TD-DRIFT-001, -006, -007, -009, -017 — real bugs deferred to a post-Phase-1 bug-fix sprint.
- Performance / throughput, Flow encryption, intent-classifier accuracy — out per design.md §6.5.
