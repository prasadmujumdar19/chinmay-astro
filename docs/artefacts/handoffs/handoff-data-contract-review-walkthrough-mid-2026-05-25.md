---
created_at: 2026-05-25T00:29:28Z
session: data-contract review walkthrough (mid)
---

## Stopping Point

**Purpose of this exercise:** The user commissioned a Claude code review of
the recently-closed sprint `2026-05-24-data-contract-discipline-phase-1`
(report at `docs/artefacts/reviews/data-contract-discipline-phase-1-pseudo-md-review-2026-05-24/review.md`,
on GitHub branch `claude/data-contracts-review-ZEdQR`). That review was
done against GitHub JSON/.md files, not live n8n. The user wants Claude
(this session) to walk through each finding **one by one** with them,
verify each gap against live n8n where helpful, agree whether it's real,
and incrementally build a sprint-input `tasks.md` so the bug fixes can be
fed to `plan-sprint` afterwards.

**Where we stopped:** 4 of the review's 5 Blockers walked and landed as
tasks in `docs/artefacts/sprints/data-contract-sprint-bug-fix/tasks.md`
(TD-DCP-101/102/103/104 + plugin items PLG-001/002). Remaining: 4 Majors
and 2 cross-cutting observations from review §3 and §4. The user is
deliberately driving this finding-by-finding, not in bulk; each task entry
is presented for confirmation/priority adjustment before append.

## Next Action

Continue the walkthrough at **Review Major #1 — WF-01 pseudo Step 9
opted-out branch doc reconciliation** (review report §3 row
"WF-01 | A | Major"). Wait for user `go ahead` before each finding.

**Depth of analysis the user expects per finding** (established by their
message after Blocker #1 — preserve this exact bar):

1. **Design intent** — what the relevant spec / `.pseudo` / `design.md`
   section originally declared. Quote the spec language verbatim where
   ambiguity matters.
2. **Sprint-plan trace** — what `state.md` / sub-plan / `working.md` said
   should be built. Often reveals whether the gap is a planning miss vs.
   an execution miss.
3. **Live-state verification** — actually fetch the relevant n8n node
   jsCode/parameters via curl (`source .env && curl ... | jq ...`) and
   confirm the gap is real today. Don't trust the review report alone;
   the report was done against GitHub, this walkthrough validates against
   live.
4. **Functional significance** — cross-reference
   `docs/reference/user_journey_map.html` and CLAUDE.md design rules to
   articulate the real-world consequence (which user journey breaks, what
   data drift occurs, how a Chinmay/user would notice).
5. **Root cause analysis** — was this a Wave-1 subagent miss, a Wave-2
   sibling-regression scan miss, a pre-existing pseudo↔live drift, or a
   design ambiguity? The user explicitly asked "why did this come up" on
   Blocker #1; apply the same lens each finding.
6. **Technical remediation** — the actual jsCode/edit, surgical and
   minimal. Include node IDs, exact lines, and any caller-side
   verification that should be folded into plan-sprint.
7. **Severity decision** — propose a priority bucket (P0/P1/P2/defer) but
   ask the user via `AskUserQuestion` if not obvious. The user has been
   downgrading some review Blockers (e.g. TD-DCP-103 WF-52 demoted to P2
   after verifying no internal consumer) and keeping others (TD-DCP-104
   WF-20 kept at P1 because it's a real orphan-row bug deferred from prior
   sprint).
8. **Append to `tasks.md`** under the right severity bucket using the
   format established this session (Rationale, Fix, Files, Change type,
   Impact, Verify, plus optional Related followup).

Things to NOT do (corrections that already happened this session):
- Don't dump full background of how a bug happened *into* the task entry —
  keep tasks.md tight; rationale is one paragraph. The deep root-cause
  analysis lives in the walkthrough conversation and informs the lessons
  at the bottom of the file (plugin section), not the task body.
- Don't bulk-process. User wants per-finding pause + question + append.
- Don't add a plugin/skill task for things that are actually memory or
  CLAUDE.md candidates. Plugin items must be reusable methodology
  improvements.

**Remaining walkthrough order** (review §3 + §4 ordering):
1. **Major #1** — WF-01 pseudo Step 9: opted-out branch carries `user:null` (intentional? — pseudo wording reconciliation only)
2. **Major #2** — WF-10 envelope gap (`Load User Status` SELECT missing `slack_channel_id` AND `current_consultation_id`). Already partly in `followups.md` line 14 as "adjacent / medium priority"; review escalated. User may want to either (a) expand the SELECT or (b) document the null-until-Phase-2 gap.
3. **Major #3** — WF-33 `Extract Command Data` stale mapping `adminUserId: input.channelId` → should read `input.adminUserId` per §2.2 envelope.
4. **Cross-cutting #1** — Generator-artifact triage for 6 WFs (`onError`/`retryOnFail`): WF-10 webhook, WF-22 Create User Record, WF-43 Gemini HTTP, WF-50 3 send nodes, WF-51 Call WF-60. **Method:** diff against pre-sprint snapshot in `workflows/pre-data-contract-phase-1-workflows/2026-05-24/` to settle whether the .md generator change at 2026-05-22→2026-05-24 surfaced pre-existing config OR these are new additions. Likely the former per review's WF-25 smoking-gun evidence.
5. **Cross-cutting #5** — Document the WF-33/WF-34 dead-branch removals (trust-mode cleanup) that sub-13/sub-14 plans did not explicitly mention.

Decisions already made this session (don't re-ask):
- TD-DCP-101 (WF-01 slackChannelId) — P0, live single-line fix, pseudo already correct.
- TD-DCP-102 (WF-60 slackMessageTs) — P1, Option A (always required for slack transport), update live + pseudo + design.md §2.6 wording.
- TD-DCP-103 (WF-52 userName) — P2 (downgraded from Blocker; verified no internal consumer).
- TD-DCP-104 (WF-20 userStatus / TD-DRIFT-006) — P1, real orphan-row bug, prior-sprint deferred.
- Tasks file format: P0 / P1 / P2 sections, then "Plugin / skill follow-ups" at bottom. Plugin candidates only go in plugin section if they aren't memory/CLAUDE.md material.

## Blockers

- **TD-DRIFT-007** (WF-47 atomicity — UPDATE-before-Close) referenced in TD-DCP-104 as related but not in scope of this sprint. Confirm with user whether to add as separate task in `data-contract-sprint-bug-fix/tasks.md` or keep as a separate followup. Surfaced from `pseudo-md-drift-fixes-2026-05-24/tasks.md` as paired with TD-DRIFT-006.
- **Generator-artifact triage (Cross-cutting #1):** the 6 WFs need either a snapshot diff or 6 live MCP fetches. Snapshot diff is cheaper. Path: `workflows/pre-data-contract-phase-1-workflows/2026-05-24/<wf-id>.json` vs current `workflows/<wf-id>.json`. If snapshots aren't present, fall back to MCP. The review's hypothesis is that the .md generator was upgraded between 2026-05-22 and 2026-05-24 to surface `onError`/`retryOnFail` it previously dropped — confirm before adding tasks.

## Changed Reference Values

- New sprint folder created: `docs/artefacts/sprints/data-contract-sprint-bug-fix/` (no `_active` marker yet — user will run `plan-sprint` against `tasks.md` separately).
- Verified live n8n IDs this session: WF-01 `hYGNM97sXvdo1WmI`, WF-20 `LgIDj1v4ZbCPlX25`, WF-47 `2U7mxHMyqA41ROKX`, WF-52 `IO5BZLUxuVmjzk5I`, WF-60 `6H75p935FpBVBQtV`. All match `workflow-registry.md`.
- SSH tunnel is OPEN (verified via `mcp__n8n__n8n_health_check` mid-session — status ok, n8n MCP 2.56.0). If next session finds tunnel closed, reopen via the standard `ssh -L 5678:localhost:5678 ...` command from `CLAUDE.md`.
