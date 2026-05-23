---
title: Contract-First Sub-Workflow Calls — Design Spec
created: 2026-05-23T13:38:42Z
status: ready-for-plan-sprint
predecessor: docs/artefacts/specs/contract-first-sub-workflow-calls-brief.md
brainstorm_session: 2026-05-23 (this document)
applies_to_plan_sprint_input: Sprint 1 only — Sprint 2+ planned post-Sprint-1 review gate
---

# Contract-First Sub-Workflow Calls — Design Spec

This spec is the successor to the initiative brief. It locks the Sprint 1 design (Contract Manifest Reconciliation) in the shape `plan-sprint` consumes, and describes — without enumerating — the structure Sprint 2+ will take. The design questions left open by the brief have been resolved in the brainstorming session captured here; deferred items below are intentionally re-asked at later planning gates because they depend on Sprint 1 output.

## 1. Locked Decisions (Carried + New)

Decisions 1-8 are carried verbatim from the brief. Decisions 9-14 are new, resolved during this brainstorm.

| # | Decision | Source |
|---|---|---|
| 1 | `mappingMode = passthrough` at every `executeWorkflow` call site. `defineBelow` rejected. | Brief |
| 2 | Set node sits immediately upstream of every `executeWorkflow` call (one graph hop back via `.connections`). Merge nodes between not allowed in v1. | Brief |
| 3 | Set node uses `includeOtherFields = false` (v3.4 default). | Brief |
| 4 | Pseudo `Inputs:` section is the authoritative contract source. | Brief |
| 5 | Pseudo Inputs must match what the live workflow actually reads. | Brief |
| 6 | Set typeVersion ≥ 3.4 on all new Set nodes. | Brief |
| 7 | Set node `notes` field carries `// contract for <called-WF-id>` for grep-ability. | Brief |
| 8 | Subagent dispatch acceptable for monotonous insertion work; Haiku only; same-workflow siblings sequential. | Brief |
| 9 | **Code node may not be the immediate upstream of `executeWorkflow`.** When computation is needed, the pattern is **Code → Set chain**: Code performs the computation, Set names and declares the contract. Lint enforces "immediate upstream = Set v3.4". Rationale: Set is statically introspectable, structurally enforces "no extra fields leak" via `includeOtherFields:false`, and is checkable by `contract_first_exec_calls` without a JS AST walker. | Brainstorm 2026-05-23 |
| 10 | **Contract membership rule = defensive union.** A field is part of the sub-WF's input contract if ANY of these holds: declared in existing pseudo, read by live code (`$json.x` reference), passed by any caller's upstream node, or observed in any sampled runtime execution. No probing/removal of "unused but harmless" fields. Same rule mirrored for output contracts. | Brainstorm 2026-05-23 |
| 11 | **Required vs optional is derived structurally from caller analysis, not from runtime sample frequency.** Required = intersection of per-caller passed-field sets (every caller passes it). Optional = full contract minus required. Runtime sampling is verification only. Rationale: a 5-execution sample may be biased toward one scenario; structural caller-enumeration is deterministic and complete. | Brainstorm 2026-05-23 |
| 12 | **Optional fields are caller-omitted, not sentinel-valued.** Callers omit the field from their Set node's assignments when inapplicable. Sub-WF branches with `if ($json.field)`. No `"Not Applicable"` strings. | Brainstorm 2026-05-23 |
| 13 | **Duplicate handling:** Technical duplicates (case/spelling: `messageText` vs `messagetext`, `phoneNumber` vs `phone_number`) auto-normalized to canonical during pseudo write; caller-side rename deferred to family sprint. Functional duplicates (`messageText` vs `messageContent`) flagged in `followups.md` for human triage pre-Phase-6; pseudo declares both as separate fields meanwhile. | Brainstorm 2026-05-23 |
| 14 | **Sprint 1 is documentation-only.** Pseudo files edited; no workflow JSONs touched. Caller-side normalization, Set-node insertion, and `includeOtherFields` flips all live in Sprint 2+ family sprints. | Brainstorm 2026-05-23 |

## 2. Scope

**In scope (this spec):** Sprint 1 — Contract Manifest Reconciliation across all 14 sub-workflows. Plus the structural description (not enumeration) of Sprint 2+ and the final lint-flip sprint.

**Out of scope (this spec):**
- Per-call-site item enumeration for Sprint 2+ (determined by Sprint 1's output).
- Family-membership debates (Open Q4) — deferred to Sprint 2+ planning.
- Regression strategy per family (Open Q5) — deferred to per-family-sprint planning.
- Lint-flip blast radius (Open Q6) — deferred to Sprint-N planning.
- Drift-check cadence (Open Q7) — methodology concern; tracked as follow-up.

## 3. Sprint 1 — Contract Manifest Reconciliation

### 3.1 Items (14 total)

Per-sub-workflow manifest reconciliation. Identical recipe across all 14 items.

| ID | Sub-WF | Name |
|---|---|---|
| CFM-01 | WF-02 | Rule Router |
| CFM-02 | WF-21 | Welcome New User |
| CFM-03 | WF-22 | Form Callback |
| CFM-04 | WF-25 | Intent Classifier |
| CFM-05 | WF-40 | User → Admin Relay |
| CFM-06 | WF-41 | Admin → User Relay |
| CFM-07 | WF-43 | Consultation Active Handler |
| CFM-08 | WF-45 | Rebook Handler |
| CFM-09 | WF-46 | Closed State Handler |
| CFM-10 | WF-47 | Unsubscribe Handler |
| CFM-11 | WF-50 | Send WhatsApp |
| CFM-12 | WF-51 | Send Slack Message |
| CFM-13 | WF-52 | Channel Manager |
| CFM-14 | WF-60 | Message Logger |

**Sprint metadata:**
- Priority: **P1** (foundational — blocks Sprint 2+).
- Change type per item: **Documentation** (pseudo edit) + read-only runtime sampling.
- Token estimate: ~3K per item (Documentation bucket) × 14 = ~42K total. **Single batch**, well under the 80K cap.
- Sprint slug: `contract-first-sub-workflow-calls-design`.
- State file path: `docs/artefacts/sprints/contract-first-sub-workflow-calls-design/state.md`.

**Note for `plan-sprint`:** During Step 3c (`discover-current-state`), verify each WF actually has an `executeWorkflow` entry point (trigger node `When Executed by Another Workflow`). The brief lists 14 sub-WFs but flags "~12-13" — if 1-2 of these are purely webhook-triggered with no executeWorkflow path, mark them `obsolete` with `obsolete_reason: "no executeWorkflow entry — contract-first rule does not apply"`.

### 3.2 Per-Item Recipe

Each CFM-NN item executes the following four phases. Phases A and B are parallelizable across all 14 items; Phase C is the user-review gate; Phase D is post-approval.

#### Phase A — Data gathering (bash script, all 14 WFs in one run)

A single bash script driven from the main thread, output to `/tmp/claude-scratch/cfm-data/`:

```
For each of the 14 sub-WFs:
  /tmp/claude-scratch/cfm-data/WF-XX/
    live.json              — full live workflow JSON (curl GET /workflows/<id>)
    executions.json        — last 5 successful integrated executions with includeData=true
    callers.json           — derived from docs/dependency-map.md: list of caller WF IDs
    caller-payloads.json   — for each caller, the upstream-node assignments to this sub-WF
                             (extracted from caller's live.json)
    existing-pseudo.md     — current docs/pseudocode/WF-XX.pseudo Inputs + Outputs sections
```

Token cost: just the script's exit status enters main-thread context. Payloads stay on disk.

#### Phase B — Reconciliation reasoning (up to 14 parallel Haiku subagents)

Dispatched from main thread in **one message with 14 Agent tool uses** so they run concurrently. Each subagent:

- Reads its `/tmp/claude-scratch/cfm-data/WF-XX/` bundle.
- Produces `/tmp/claude-scratch/cfm-recon/WF-XX-recon.json` containing the structured reconciliation result (schema below).
- Writes nothing else. No edits to actual pseudo files. No network calls beyond what's in the bundle (data already on disk).

**Subagent prompt template** (each gets the same shape, parameterized by WF-ID):

> Reconcile the input + output contract for `<WF-XX>`. Bundle at `/tmp/claude-scratch/cfm-data/WF-XX/`. Compute:
> - Input contract = union of (sub-WF static `$json.x` reads in trigger + first 5 control-flow steps) ∪ (each caller's passed-field set) ∪ (existing pseudo Inputs) ∪ (each sampled execution's trigger output `.json` keys).
> - Required input fields = intersection of caller passed-field sets.
> - Optional input fields = full input contract \ required.
> - Output contract = union of (caller-side reads against the executeWorkflow result) ∪ (sub-WF's final-node emits) ∪ (existing pseudo Outputs) ∪ (each sampled execution's executeWorkflow output `.json` keys).
> - Required output fields = intersection of caller-side output reads.
> - Optional output fields = full output contract \ required.
> - Duplicate detection: technical (case-insensitive + snake↔camel match) and functional (semantic-similarity heuristic on field names).
> - Type contradictions: pseudo-declared type vs runtime-observed type.
>
> Write result JSON to `/tmp/claude-scratch/cfm-recon/WF-XX-recon.json` per the schema in the design spec. Do not edit any pseudo file. Return when the JSON is written.

**Recon JSON schema:**

```json
{
  "wf_id": "WF-XX",
  "input": {
    "existing_contract": ["field1", "field2", ...],
    "revised_contract": [
      {"name": "field1", "required": true,  "type": "string",        "source_hits": ["pseudo", "static", "caller:WF-21", "runtime"]},
      {"name": "field2", "required": false, "type": "object",        "source_hits": ["caller:WF-23", "runtime"]}
    ],
    "delta": "no_change" | "additions_only" | "removals_only" | "mixed"
  },
  "output": { ... same shape ... },
  "findings": {
    "technical_duplicates":  [{"canonical": "messageText", "aliases": ["messagetext"], "callers_using_alias": ["WF-21"]}],
    "functional_duplicates": [{"candidates": ["messageText", "messageContent"], "rationale": "semantic overlap"}],
    "type_contradictions":   [{"field": "userId", "pseudo_type": "number", "runtime_type": "string", "sample_exec_ids": ["1829"]}],
    "dead_pass":             [{"field": "x", "passed_by": ["WF-Y"], "never_read_by_subwf": true}],
    "caller_missing_required": [{"field": "x", "read_by_subwf": true, "passed_by_none": true}]
  },
  "subagent_notes": "free-form text — confidence flags, edge cases, anything user should know"
}
```

**Subagent monitoring (per CLAUDE.md rule 5):** Main thread polls each subagent's transcript every 60s. Per-subagent 2-minute abort budget. If any subagent exceeds 2 min, send `TaskStop` and run that WF's reconciliation inline in the main thread.

**Fallback if parallelism is denied or fails:** Inline-loop in main thread, 14 sequential reconciliations. Token cost rises (~42K total reasoning context vs ~3K per subagent) but functionally identical.

#### Phase C — Review gate (main thread + user approval)

Main thread reads all 14 `WF-XX-recon.json` files from disk and renders this comparison table for user review:

| Sub-WF | Input Δ | Existing Input | Revised Input | Output Δ | Existing Output | Revised Output | Findings |
|---|---|---|---|---|---|---|---|
| WF-02 | no_change | `{phoneNumber, messageText, userId, userStatus}` | (no change) | additions_only | `{routingDecision}` | `{routingDecision, intentName}` (added: intentName) | 0 |
| WF-25 | additions_only | `{messageText, phoneNumber, userId, userStatus}` | + `messageContent` (alias of messageText) | no_change | `{intentName, intentArgs}` | (no change) | 1 functional-dup |
| ... | | | | | | | |

Plus per-WF expandable findings detail (any non-zero finding row links to its detail block).

User reviews the table. Possible responses:
- **Approve all** → proceed to Phase D.
- **Approve with edits** → user specifies overrides per WF (e.g., "for WF-25, treat `messageContent` as a functional duplicate of `messageText` rather than separate field"). Main thread updates recon JSONs and re-renders for confirmation.
- **Defer some** → specific WFs marked `status: needs-decision` in sprint-state (e.g., type contradiction that needs investigation before pseudo can be written).

#### Phase D — Pseudo write (main thread, post-approval)

For each approved WF, write the revised Inputs and Outputs sections to `docs/pseudocode/WF-XX.pseudo`. Edits only — no other sections touched.

**Staging fallback:** If holding 14 pseudo updates in context is impractical, drafts can be written to `/tmp/claude-scratch/cfm-drafts/WF-XX.pseudo-inputs-outputs.md` in Phase B (each subagent writes its proposed pseudo section there). Phase D then becomes a mechanical disk-to-disk copy with `Edit` calls — no reasoning, low context cost.

After all approved WFs' pseudo files are updated, run `pseudo-md-drift-check` on the updated files to confirm D8 + D9 cleanliness. Any new findings logged and item marked done.

### 3.3 Findings Log

`docs/artefacts/sprints/contract-first-sub-workflow-calls-design/followups.md` accumulates:

- **Technical duplicates** with caller-side remediation pending (Sprint 2+ family-sprint scope).
- **Functional duplicates** awaiting human triage before Phase 6 lint flip.
- **Type contradictions** — each requires either pseudo-type update or live-side fix (Sprint 2+ scope).
- **Dead-pass fields** — caller passes a field no live code reads. Defensive default: keep in contract. Logged for awareness.
- **Caller-missing-required** — sub-WF reads a field no live caller ever passes. Rare; would be a latent bug. Each becomes a `needs-decision` item in Sprint 1 state, blocking that WF's pseudo write until triaged.

## 4. Sprint 2+ — Per-Family Conversions (Described, Not Enumerated)

Sprint 2+ are **planned after Sprint 1 completes and the user reviews the comparison table output**. The post-Sprint-1 picture determines:
- Family decomposition (Open Q4 from brief — resolved here by data, not assumption).
- Item count per family sprint.
- Sprint size and batching.

The shape each Sprint 2+ family sprint will take is locked here. Plan-sprint inputs for those sprints will follow this template.

### 4.1 Per-Call-Site Conversion Recipe

Five sub-populations exist (from SP-05 audit + lint runs). Each has a deterministic recipe; no per-site judgment:

| Sub-population | Recipe |
|---|---|
| `defineBelow + schema:[]`, pure passthrough | Flip `mappingMode` to `passthrough`. No new node. |
| `defineBelow + schema:[]`, mappings do real work | Insert Set v3.4 node upstream encoding the rename/computed mappings. Flip mode. |
| `passthrough`, upstream is Code node | Insert Set v3.4 node between Code and `executeWorkflow`. Set names contract; Code keeps its computation. |
| `passthrough`, upstream is existing Set but `includeOtherFields: true` | Flip `includeOtherFields` to `false`. Verify no downstream silently relied on a leaked field (cross-check against Sprint 1 contract). |
| Caller-side technical duplicate (e.g., uses `messagetext` instead of canonical `messageText`) | Rename caller's assignment to canonical name. No sub-WF edit (sub-WF already reads canonical post-Sprint-1). |

Every recipe is mechanical. Item bodies in Sprint 2+ state.md will specify which recipe each call site uses.

### 4.2 Family Grouping

The brief suggests messaging / intent-routing / lifecycle families. **This grouping is provisional and will be validated against Sprint 1 output before Sprint 2+ items are planned.** Possible adjustments based on Sprint 1 findings:
- A sub-WF with many functional-duplicate findings may merit its own sprint to land caller-side renames cleanly.
- A sub-WF with zero call-site changes (e.g., already contract-clean) drops out of family scope.

### 4.3 Cross-Family Dependencies

Within each family sprint, same-workflow-sibling auto-soft-deps will fire (multiple call sites within one caller WF must be sequential per `plan-sprint` Step 3d). Across family sprints: independent, can run in any order.

## 5. Sprint N — Lint Flip + Set v3.4 Sweep

Planned after all Sprint 2+ family conversions complete.

**Items (provisional):**

| ID | Description |
|---|---|
| CFL-01 | Audit any remaining `defineBelow` sites (should be zero). If non-zero, block flip and remediate. |
| CFL-02 | Audit any remaining Code-immediately-upstream sites. If non-zero, block flip and remediate. |
| CFL-03 | Flip `contract_first_exec_calls` lint check from `advisory` to `hard_reject` in `scripts/lint-workflows.py`. Plugin patch bump. |
| CFL-04 | Run `pseudo-md-drift-check` across all 14 sub-WFs; confirm zero D8 and zero D9 findings. |
| CFL-05 | Resolve all functional-duplicate findings logged during Sprints 1-N (caller-side renames + pseudo updates). |
| CFL-06 | Update `build-workflow` Step 6 to reference the now-hard-reject lint hook. |

**Open Q6 (lint-flip blast radius)** is resolved here — by Sprint N, by construction, zero `defineBelow` and zero Code-immediately-upstream sites remain (CFL-01 + CFL-02 are gates). The flip is safe by induction on completion of Sprints 2+.

## 6. Cross-Sprint Sequencing

```
Sprint 1 (this spec) — CFM items
        ↓ user reviews comparison table; pseudo files updated
        ↓
Sprint 2 (planned post-1) — Family A conversions
Sprint 3 (planned post-1) — Family B conversions       can run in any order
Sprint 4 (planned post-1) — Family C conversions       once Sprint 1 done
        ↓
Sprint N (planned post-2/3/4) — Lint flip + Set v3.4 sweep + functional-dup resolution
```

Sprint 1 is the only one this design spec enumerates. Sprints 2+ are described structurally; their `plan-sprint` invocations happen when Sprint 1 is done and the user re-runs `plan-sprint` against a new (or amended) spec.

## 7. Deferred Questions

Re-asked at the planning gate they belong to. Listed here so they don't get lost.

| Q | Question | Resolves at |
|---|---|---|
| Q4 | Family decomposition + order | Pre-Sprint-2 planning (after Sprint 1 review) |
| Q5 | Regression strategy per family | Per-family `plan-sprint` invocation |
| Q6 | Lint-flip blast radius | Resolved structurally by CFL-01 + CFL-02 gates above |
| Q7 | `pseudo-md-drift-check` cadence post-flip | Methodology follow-up; not gating any sprint. Tracked in `followups.md`. |

## 8. How to Use This Spec

```
plan-sprint @docs/artefacts/specs/contract-first-sub-workflow-calls-design.md
```

`plan-sprint` will:
1. Derive slug → `contract-first-sub-workflow-calls-design`.
2. Parse Section 3.1 as 14 items (CFM-01 through CFM-14), all P1, all Documentation change type.
3. Run Step 3c `discover-current-state` on each — flagging any item where the named sub-WF has no `executeWorkflow` trigger.
4. Detect no inter-item dependencies (each item touches a different pseudo file; no shared state).
5. Single-batch sizing (14 × Documentation < 80K).
6. Write `docs/artefacts/sprints/contract-first-sub-workflow-calls-design/state.md`.

Then: `build-sprint @docs/artefacts/specs/contract-first-sub-workflow-calls-design.md` to execute.

After Sprint 1 completes and the user reviews the comparison table + updated pseudo files: this same design spec is **amended** with Sprint 2+ enumeration (or a successor spec is written referencing this one), and `plan-sprint` is invoked again against that amended input.
