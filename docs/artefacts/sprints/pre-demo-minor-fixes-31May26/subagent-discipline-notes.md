# Subagent-discipline refinements — for plugin improvement (build-sprint + dispatching-subagents)

Captured 2026-06-28 during PDF-25 (WF-70) build kickoff. User explicitly wants these folded into the
n8n-whatsapp-methodology plugin's self-learning later (via flush-plugin-improvements / update-skill).
These REFINE the existing `dispatching-subagents` skill — they do not replace it.

## R1 — Time/token cap is a LOGICAL budget, not a hard kill switch
- The 300s (or token) cap is the *planning* estimate, not an auto-abort trigger.
- Do NOT abort an agent merely for crossing the cap if it has already done most of the work (≈70-80%)
  and the drift is small. Let it finish.
- DO abort when it is *clearly* off the rails: e.g. only ~10% done at 150s+ of a ~280s budget → it is
  not going to plan → kill it.
- Decision rule = **progress-vs-time**, not raw-time. Judge "% complete relative to elapsed vs estimate."

## R2 — Drift tolerance scales with estimate size; never throw away partial work
- Small estimates (~50-100s): even ~2x overrun is fine.
- Large estimates (~280s): drift after partial completion is the worrying case (less headroom).
- To avoid losing work on abort: main thread creates a **per-subagent scratch subdirectory BEFORE
  dispatch**; the subagent is instructed to **checkpoint progress incrementally** into that subdir and
  NEVER erase it. On successful completion AND parent verification, the **main thread** removes that
  subdir. If aborted, the partial work survives there for salvage/resume.
- (Applies to Write-capable generation/research agents; for pure read-only Pattern-A agents whose only
  output is the final returned report there is nothing intermediate to checkpoint — subdir still created
  for any artifacts + parent's per-dispatch notes, removed on verified completion.)

## R3 — Model choice is per-task, decided by main thread; NOT a blanket "Sonnet default"
- Do not blanket-default to Sonnet (nor Haiku). Main thread picks the model that fits each task.
- Be cautious of context-size degradation: a model whose context is filled past ~50% starts losing
  detail / hallucinating (e.g. Sonnet's 200k). Keep subagent inputs SMALL; pick model accordingly.
- Bigger model is not automatically safer — both Haiku and Sonnet make size-driven mistakes.

## R4 — Capture these notes for plugin improvement (this file)
- All the above should feed a future build-sprint / dispatching-subagents skill improvement.

## R5 — Subagent-usage learnings feed the skill's self-learning mechanism
- build-sprint (and other plugin skills) already have a self-learning step. When subagents are used,
  that mechanism must ALSO consider subagent-usage learnings:
  - was the time/token estimate on-point or off, and by how much?
  - did an agent have to be interrupted because the main thread under-specified inputs?
  - did the chosen model start making mistakes, and why (context fill? task mismatch?)?
  - did Pattern-A return-as-text vs Write-to-scratch work as intended?
- Record per-dispatch learnings during execution; surface them at the build-sprint learning step.

## R2 refinement (from drift-check fan-out, 2026-06-29)
- Checkpoint-to-scratch-subdir is worth its plumbing (Pattern-B Write pre-approval + per-agent subdirs +
  incremental writes) ONLY for LONG / expensive / Write-capable agents, where aborting loses costly work.
- For a CHEAP READ-ONLY fan-out (e.g. Haiku drift-check chunks of ~3 pairs, ~180s each, Pattern A), the
  simpler resilience is **small chunks + re-dispatch-on-abort**: abort-loss is one tiny chunk, re-run is
  trivial. Skip the checkpoint machinery there. Same end-goal (no significant work lost), less ceremony.
- Decision rule to add to plugin: choose checkpointing by (cost-to-recompute × abort-probability), not as
  a blanket practice. Read-only + cheap + re-dispatchable → Pattern A small chunks. Long/expensive/Write →
  Pattern B + checkpoint.

## Live-dispatch log for THIS sprint (append per dispatch)
| # | task | model | type | est (s) | actual (s) | progress@abort | outcome | learning |
|---|------|-------|------|---------|------------|----------------|---------|----------|
| 1 | VPS+n8n state verification vs records | sonnet | Explore (read-only) | ~90 | 126.7 | n/a (finished) | SUCCESS w/ 1 false-positive | see L1.x below |

### Dispatch 2 learnings (drift-check fan-out: 11 Haiku agents × ~3 pairs, 32 pairs)
- **Estimation:** est ~180s/agent; actuals 44s–185s. 2-pair agent fastest (44s); 3-pair agents 60–185s.
  Sizing was good — upper end (185s) approached but never hit the 300s cap; none aborted. ~3 pairs/agent
  is a sound chunk size for this read+compare shape. Confirms dispatching-subagents Include C pt5.
- **Schema discipline (R5):** ~5 of 11 Haiku agents emitted reasoning PROSE before the JSON despite
  "return ONLY the JSON array." Harmless (valid ```json block parseable at the end), but a real Haiku
  tendency. Mitigation for next time: either (a) accept + extract the json block (what I did), or (b) use
  a forced structured-output schema (Workflow tool's `schema`) when exact-shape parsing matters. Do NOT
  escalate to Sonnet just for this — it's a format nit, not a reasoning gap.
- **Over-flagging (parent-verification mandatory, Include C pt4):** agents correctly DETECTED divergences
  but could not judge DIRECTION (which side is right). All 4 functional-looking flags (D1/D3/D5/D7) were
  pseudo-lag (live correct) — only parent live-verification established that. Also agents over-applied D9
  (canonical-envelope-reference flagged as "vague") and D6 (n8n onError mechanism flagged as drift) —
  both need parent triage against project convention + the pseudo-vs-tech rule. Detection=agent,
  judgment=parent is the right split.
- **Model (R3):** Haiku was the right call — detection is mechanical; the judgment stayed with the parent.
  Inputs were tiny per agent (6 files), zero context-fill degradation.
- **Context win:** ~600K subagent tokens of file-reading + per-pair reasoning stayed OUT of main context;
  main thread received only 32 compact JSON verdicts. This is exactly the inflation-avoidance goal.
- **R2 in practice:** none aborted, so re-dispatch-on-abort never triggered; the small-chunk Pattern-A
  choice (no checkpoint plumbing) was vindicated for this cheap read-only fan-out.

### Dispatch 1 learnings (VPS+n8n verifier)
- **L1.1 estimate:** est 90s, actual 126.7s (~1.4x). Slight over, finished cleanly → per R1/R2 correctly NOT aborted. Estimate slightly low for a batched-SSH + n8n-curl + 8-claim compare; ~120s is the better baseline for this shape.
- **L1.2 brief gap → false positive (R5):** the verifier flagged backup cron "broken/stale" by ASSUMING "today is Jun 29" instead of reading the reference clock. Root cause: my brief asked for `df` but NOT the VPS `date`. When a subagent must judge FRESHNESS/staleness, the brief MUST require it to fetch the reference clock from the SAME source (here: VPS `date -u`) and compute age, never assume "now". Parent live-verification (Include C pt4) caught it: VPS now 18:57Z, latest backup 18:15Z (42 min) = healthy. **Plugin note:** add a freshness-brief rule to dispatching-subagents — "for any staleness/age judgment, the agent fetches the authoritative clock + computes delta; never infer current time."
- **L1.3 cost:** 13.5K subagent tokens, 2 tool calls — cheap; kept verbose SSH/n8n output out of main context (the win). Pattern A return-as-text worked perfectly.
- **L1.4 model:** Sonnet was fine; small context, no degradation. Haiku might have sufficed for the mechanical compare, but the date-assumption error was a reasoning gap not a size gap — model choice was not the issue.
