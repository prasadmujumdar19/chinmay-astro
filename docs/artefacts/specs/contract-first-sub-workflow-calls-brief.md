---
title: Contract-First Sub-Workflow Calls — Initiative Brief
created: 2026-05-23
status: ready-for-planning
predecessor: docs/artefacts/sprints/inline-20260522-102910/state.md SP-05 decision_required block
audit_data: docs/artefacts/sprints/inline-20260522-102910/audits/sp05-defineBelow-sites-2026-05-23.json
plugin_groundwork:
  - lint check `contract_first_exec_calls` (advisory, plugin v1.26.0 commit 6d0ab53)
  - lint check `set_v34_assignments_no_includeother` (advisory, plugin v1.26.0)
  - pseudo-md-drift-check D9 "Inputs contract declaration shape" (plugin v1.26.0)
  - pseudo-md-drift-check D8 "Inputs contract validity" (plugin v1.28.1 commit f587c18)
  - build-workflow Step 5f.2 rewritten to reject defineBelow + require upstream Set (v1.26.0)
  - build-workflow Step 5f.5 Set v3.4 includeOtherFields hazard (v1.26.0)
---

# Contract-First Sub-Workflow Calls — Initiative Brief

## One-Line

Convert every n8n executeWorkflow call site in the chinmay-astro project to the **Contract-First pattern** — named Set node immediately upstream constructs the sub-workflow's declared Inputs contract, mappingMode=passthrough, includeOtherFields=false, pseudo Inputs section as the authoritative source. After remediation, flip the plugin lint hooks from warn to hard-reject.

## Why — Already Decided (Do Not Re-Litigate)

Concept, viability, and stability rationale were worked through during sprint inline-20260522-102910 (SP-05 audit + SP-10 plugin updates) and SP-11 lessons-learned. The decision is locked. The summary is here so plan-sprint has the rationale in hand; brainstorming should treat this as fixed input, not an open question.

1. **Pseudo Inputs section becomes runtime-enforced, not documentation-only.** Today's `defineBelow + schema:[]` pattern is silent passthrough disguised as explicit mapping — callers "work" because shared field vocabulary survives, then break silently when vocabulary diverges. Caller-side Set node forces every call site to materialize the contract explicitly; pseudo drift is caught at edit time, not at next consumer's failure.
2. **Refactoring a sub-workflow's contract becomes a local, findable edit.** Each caller's Set node is one diff per call site — found via `docs/dependency-map.md` reverse index. No more "grep the entire codebase for $json.fieldName references."
3. **Set v3.4 default-drops-fields hazard inverts from foot-gun to feature.** SP-11 LESSON LEARNED (chinmay-astro exec 1630): User-Load Gate emitted only `{routing: "to_wf02"}` because the Set v3.4 default dropped upstream fields → WF-02 misrouted to NEW_USER → WF-21 INSERT failed on null phone_number. With Contract-First, includeOtherFields=false is exactly what you want — sub-workflow only sees declared contract fields, no accidental coupling.
4. **Plugin lint hooks already encode the principle.** `contract_first_exec_calls` (hard reject of defineBelow + missing-upstream-Set) and `set_v34_assignments_no_includeother` (advisory) live in the plugin since v1.26.0. They currently land 109 advisory findings on chinmay-astro (90 contract-first + 19 Set-v3.4). Flipping to hard-reject is gated on this initiative completing remediation.

## Scope — In / Out

**In scope (this initiative):**
- All ~12-13 sub-workflows: WF-02, WF-21, WF-22, WF-25, WF-40, WF-41, WF-43, WF-45, WF-46, WF-47, WF-50, WF-51, WF-52, WF-60.
- 18 confirmed `defineBelow + schema:[]` sites from the SP-05 audit (WF-11 ×5, WF-20 ×2, WF-23, WF-30, WF-40, WF-44, plus the rest enumerated in the audit JSON).
- Plus all ~90 advisory-flagged Code-node-upstream sites surfaced by `contract_first_exec_calls` lint runs.
- Pseudo Inputs sections for every sub-workflow (12-13 `.pseudo` files).
- Lint hook flip from warn to hard-reject after remediation.

**Out of scope:**
- Adding new sub-workflows or splitting existing ones — pure mechanical contract conversion only.
- Changing sub-workflow behavior — Inputs section codifies what the sub-workflow *currently* reads, not what we wish it read. Behavior refactors are separate sprints.
- Pseudo-md drift on dimensions other than Inputs (D1/D3/D4/D5/D6/D7) — those are existing drift-check categories handled by `pseudo-md-drift-check`.
- WhatsApp Flow contract (separate concern — that's encryption-svc boundary, not executeWorkflow).

## Current State — What's Already Done

| Artifact | Status |
|---|---|
| SP-05 site audit | ✅ Done — 18 sites classified at `docs/artefacts/sprints/inline-20260522-102910/audits/sp05-defineBelow-sites-2026-05-23.json`. 9 pure-passthrough conversions; 9 need Set node inserted; 48 mapping entries split 28 redundant / 20 rename-or-computed. |
| Plugin lint groundwork | ✅ Done — see frontmatter `plugin_groundwork`. Currently warn-only. |
| Pseudo Inputs taxonomy | ✅ Done — D8 (validity) + D9 (shape) live in `pseudo-md-drift-check` v1.28.1. |
| build-workflow guidance | ✅ Done — Step 5f.2 rewritten, Step 5f.5 added (v1.26.0). |
| Contract Manifest doc | ❌ Not started — Phase 1 below. |
| Per-family conversion sprints | ❌ Not started — Phases 2–5 below. |

## Suggested Phasing (For Brainstorm Input — Not Locked)

The SP-05 decision_required block listed a 4-phase outline. Expanded slightly here with execution detail:

1. **Phase 1 — Contract Manifest (sub-workflow pseudo audit).** For every sub-workflow, read the live JSON's trigger node + first ~5 control-flow steps; enumerate every `$json.<field>` and `$('NodeName').item.json.<field>` reference; produce or revise the `.pseudo` Inputs section to declare each field with required/optional, name, shape/type, validity rule. Output: every sub-workflow `.pseudo` has a D8-clean + D9-clean Inputs section. This phase BLOCKS Phases 2–5 because conversion sprints need to know what contract to construct at each call site.
2. **Phase 2 — Call-site inventory matrix.** Extend the SP-05 audit JSON to include current passthrough sites + Code-node-upstream sites. Each row: caller WF, caller node, called WF, contract delta (what fields caller passes vs what Phase-1 manifest says sub-workflow needs). This drives sprint sizing for Phases 3–5.
3. **Phases 3–5 — Per-family conversion sprints.** Suggested family split:
   - **Messaging utilities family** — WF-50 (Send WhatsApp), WF-51 (Send Slack), WF-60 (Message Logger). Highest call volume; lowest behavioral risk per call (utilities). Good first conversion family.
   - **Intent + routing family** — WF-25 (Intent Classifier), WF-02 (Rule Router), WF-40 (Consultation Relay). Higher risk because contract changes affect downstream business logic.
   - **Lifecycle handlers family** — WF-21, WF-22, WF-41, WF-45, WF-46, WF-47, WF-52. Mostly admin-state transitions and onboarding callbacks. Mixed risk.
   - Mode D subagent dispatch is appropriate for the monotonous Set-node insertion work per `build-sprint` Step 2a Mode D criteria — each conversion is a deterministic transform (read live → insert Set node by name → flip mappingMode → PUT → verify). Same-workflow siblings remain sequential.
4. **Phase 6 — Lint hook flip.** After all conversion sprints land + post-batch regression clean: flip `contract_first_exec_calls` from advisory to hard-reject in `scripts/lint-workflows.py`. Plugin patch bump. From this point forward, any new executeWorkflow call without an upstream Set node fails lint at build time. Confirm `set_v34_assignments_no_includeother` remains advisory (the contract-emit case is legitimate).

## Non-Negotiable Design Decisions (Locked by Prior Sessions)

The brainstorm should NOT re-open these. List them up front so the brainstorming skill doesn't burn time re-deriving:

| # | Decision | Source |
|---|---|---|
| 1 | mappingMode = passthrough at every executeWorkflow call site. `defineBelow` is rejected outright. | SP-05 decision_required + plugin v1.26.0 Step 5f.2 |
| 2 | Set node sits *immediately* upstream of the call (one graph hop back via `.connections`). Merge nodes between are not allowed in v1 (could be reconsidered later). | plugin lint check `contract_first_exec_calls` |
| 3 | Set node uses `includeOtherFields = false` (v3.4 default). Sub-workflow sees only declared contract fields. | SP-11 LESSON LEARNED + plugin v1.26.0 Step 5f.5 |
| 4 | Pseudo `Inputs:` section is the authoritative contract source — required/optional, name, shape/type, validity rules. Discriminated unions enumerated explicitly. Vague declarations rejected. | pseudo-md-drift-check D9 (v1.26.0) |
| 5 | Pseudo Inputs must match what the workflow actually reads in its early nodes — declared-but-unused and undeclared-but-consumed both flagged. | pseudo-md-drift-check D8 (v1.28.1) |
| 6 | Set typeVersion ≥ 3.4 on all new Set nodes (typeVersion floor per plugin principle m). | plugin v1.27.0 Step 5e.1a |
| 7 | Set node `notes` field gets a one-line `// contract for <called-WF-id>` comment for grep-ability. | suggested; brainstorm may refine |
| 8 | Mode D subagent dispatch acceptable for the monotonous insertion work; Haiku only; same-workflow siblings stay sequential. | SP-05 decision_required + `build-sprint` Step 2a |

## Open Questions for Brainstorming (Genuine — Not Settled)

Items the brainstorm should actually resolve:

1. **Sprint granularity inside a family.** Does each family become one sprint with N items (one per call site), or N small sprints (one per called sub-workflow, sweeping all its callers)? Tradeoff: per-family = clean blast radius per sprint but long single sprint; per-sub-workflow = parallel-friendlier but more sprint ceremony overhead.
2. **Phase 1 execution mode.** Is the Contract Manifest written by a single multi-session sprint, or by N parallel subagents (one per sub-workflow, Haiku, read live → propose Inputs section → write pseudo)? Mode D viability per sub-workflow vs. single sequential pass.
3. **Behavioral-mismatch handling.** Phase 1 will surface sub-workflows where what's *read* doesn't match what callers *intend* to pass (e.g., a field renamed historically, callers compensate by aliasing). Do we (a) document the mismatch in pseudo and convert callers literally, (b) raise a fix-then-convert sprint item, (c) defer to a behavior-cleanup sprint after the structural conversion lands?
4. **Order of family sprints.** Brief suggests messaging first (lowest risk). Brainstorm should validate: is there a critical-path family where call-site count is so high that early conversion would simplify subsequent families' diff review?
5. **Regression strategy.** Each family conversion changes ~5-20 call sites. What's the minimum smoke test that proves a family is contract-clean? Suggested: existing smoke-test workflows per state-machine transition, plus a `contract_first_exec_calls` lint run with --no-warn-only flag against the converted family.
6. **Lint hook flip blast radius.** Before flipping `contract_first_exec_calls` to hard-reject in Phase 6, what happens to the ~90 Code-node-upstream sites if they're not all converted? Options: (a) flip only after 100% coverage; (b) flip with an explicit allowlist of remaining sites + sunset date; (c) keep Code-node-upstream as a permanently-allowed pattern (downside: re-opens the silent-passthrough door).
7. **Drift-check cadence after flip.** Once D8 + D9 catch contract drift at the pseudo level and the lint hook catches it at the JSON level, what's the right cadence for `pseudo-md-drift-check`? Today it runs pre-go-live, before sprint planning, before refactors. Post-flip, the lint hook catches most drift at PUT time — should drift-check shift to a monthly-only cadence?

## Success Criteria

Brainstorming output: design spec at `docs/artefacts/specs/contract-first-sub-workflow-calls-design.md` answering the 7 open questions and producing a confirmed phase decomposition.

Planning output (from `plan-sprint` invocations afterward): one sprint state.md per phase, with items sized per the decisions made.

End-state for the whole initiative (after Phase 6): zero `defineBelow` sites in any workflow JSON; every executeWorkflow has a named Set node immediately upstream constructing a contract that matches the called sub-workflow's pseudo Inputs; lint hook `contract_first_exec_calls` runs in hard-reject mode in `build-workflow` Step 6; `pseudo-md-drift-check` runs on every sub-workflow find zero D8 + zero D9 findings.

## How to Use This Brief

Invoke `plan-sprint @docs/artefacts/specs/contract-first-sub-workflow-calls-brief.md`.

`plan-sprint` will:
1. Derive slug → `contract-first-sub-workflow-calls-brief`.
2. Parse the suggested phasing as the initial item list.
3. Surface the 7 open questions as needs-decision items.
4. Detect dependencies (Phase 1 blocks Phases 2–6; Phase 6 blocks on Phases 3–5).
5. Write `docs/artefacts/sprints/contract-first-sub-workflow-calls-brief/state.md`.

**Recommend** the brainstorm step happen *before* `plan-sprint` if you want the 7 open questions resolved first — invoke `superpowers:brainstorming` with this brief as input, write the design spec, then run `plan-sprint` against the **design spec** rather than this brief. Either ordering works; brainstorm-then-plan produces a more deterministic sprint plan.
