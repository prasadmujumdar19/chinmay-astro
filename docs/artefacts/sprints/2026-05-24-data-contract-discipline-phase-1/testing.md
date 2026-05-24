# Data Contract Discipline — Phase 1 — Testing Plan

**Status:** OUT of `build-sprint` scope. Run manually by the user via `n8n-whatsapp-methodology:monitor-test-run` **after `build-sprint` exits clean** (all four batches complete, registry + memory written). Pre-live system, no traffic — no inter-wave test gates. Rollback drill is post-build, not a Wave 2 prerequisite.

**Why separate:** the build sprint executes 14 parallel subagents across 2 waves grouped by workflow ownership. Per-unit smokes (one-test-per-unit-landed) lose meaning when 7+ workflows land at once. Final-state correctness is verified via canonical-paths smoke + final-regression bookends plus one anchor test per envelope.

Testing parallelism is intentionally **zero**. `monitor-test-run` is human-paced (user narrates actions, claude watches). Sessions run serially.

---

## Session order

All sessions use `n8n-whatsapp-methodology:monitor-test-run`. Slug pattern `phase1-<role>`.

All five sessions run sequentially AFTER `build-sprint` Batch 4 lands. No build-phase gates.

| # | When | type / slug | Why |
|---|---|---|---|
| T1 | First post-build session | `type=smoke`, `slug=phase1-canonical-paths` | Canonical-paths smoke — exercises the 13 critical paths from design.md §6.2 against the fully-built system. Anchor for T5 cross-check. |
| T2 | After T1 | `type=patch-validation`, `slug=phase1-rollback-drill` | Validate snapshot+restore mechanics on WF-52 per design.md §6.3 (5-step drill). Confirms the restore path is usable if any post-build regression surfaces. If drill fails, restore script is buggy — fix before relying on rollback. |
| T3 | After T2 | `type=smoke`, `slug=phase1-wave1-anchor` | Anchor smoke covering all 4 utility entry guards + both router envelopes emitted. Replaces DCP-011/021/031/041 + half of DCP-053/063. Trigger: (a) fresh form submission → WF-52 guard; (b) one WA inbound text → WF-01 envelope; (c) one APPROVE PAYMENT in consult channel → WF-10 envelope + WF-50 guard (text variant) + WF-51 guard + WF-60 logging (4 transport+direction combos in one session). |
| T4 | After T3 | `type=smoke`, `slug=phase1-wave2-anchor` | Anchor smoke covering both defense-in-depth guards + all consumer Type A cleanups. Trigger: (a) inbound WA paths for each user state (new / payment_pending / payment_submitted / consultation_active / consultation_closed / opted_out / blocked) → WF-02 guard + WF-01 consumer cleanups; (b) all 8 admin command types → WF-11 guard + WF-10 consumer cleanups. Use skill's execution-fetch to verify removed Load-User nodes no longer appear in traces. |
| T5 | After T4 | `type=regression`, `slug=phase1-final-regression` | Re-narrate every action from T1; cross-check content + DB state + execution-node-count against T1's `story.md`. Verify all 6 entry guards active via one deliberate contract violation per guard (if not exercised in T3/T4). |

T3 + T4 can collapse into one combined session if user prefers; design above keeps them separate to preserve per-wave attribution. T1 + T2 may also be combined since rollback-drill is mechanical and doesn't depend on T1's content.

---

## Deliberate contract-violation matrix

At least one violation per guard, distributed across T3/T4/T5 so each guard's `Error` message is observed firing in n8n's failed-executions log.

| Guard | Violation | Where to narrate |
|---|---|---|
| WF-52 | Temporarily edit WF-22's `Ensure Slack Channel Exists` to send `phone_number` (legacy) instead of `phoneNumber` | T3 |
| WF-60 | Edit one of the 4 callers to omit `transport` field | T3 |
| WF-51 | Edit one of WF-10's 6 Prepare nodes to send `text` instead of `messageText` | T3 |
| WF-50 | Temporarily edit a caller to send `messageContnt` typo (per design.md §6.2 Session #5) | T3 |
| WF-02 | Send a request bypassing WF-01 (edit a WF-02 caller to send raw payload without the envelope) | T4 |
| WF-11 | Edit WF-10's command-envelope builder to drop the `commandType` field | T4 |

Revert each violation before moving to the next.

---

## Pass criteria (design.md §6.4)

- All T1 baseline paths reproduce in T5.
- All 6 entry guards observed firing on contract violations (failed executions logged in n8n with the guard's `Error` message).
- Per-path execution-node-count documented as lower in T4 than T1 for Type A cleanup paths (removed Load-User nodes no longer execute).
- No new failed executions in n8n in the 30 minutes following T5 close.
- All 5 session HTML reports retained under `docs/artefacts/tests/`.

---

## What is NOT tested in this plan (out of Phase 1 scope per design.md §6.5 + §1.5)

- Performance / throughput.
- WhatsApp Flow form encryption.
- WF-25 intent classifier accuracy.
- The 5 real bugs deferred to post-Phase-1 bug-fix sprint: TD-DRIFT-006, -007, -009, -017, -001. If any of these surface in T1–T5, log to `followups-phase1-testing.md`, do not fix mid-sprint.

---

## Operational notes

- All testing runs after `build-sprint` exits clean (Batch 4 done). Pre-live, no traffic — no inter-wave smoke gates inside the build.
- Rollback (via `restore-from-snapshot.sh`) is reserved for **post-test triage**: if T1–T5 surface a regression that's faster to revert than to forward-fix, the snapshot from Batch 1 is the safety net. T2's drill validates that path is usable.
- T5 should run once n8n executions have settled (no in-flight workflows from T4). The 30-min post-T5 quiet observation is part of the pass criteria.

---

## Cross-reference

- Design source: [`design.md`](../../specs/2026-05-24-data-contract-discipline-phase-1/design.md) §6 (full testing detail).
- Build state: [`state.md`](./state.md) — items DCP-003, 004, 011, 021, 031, 041, 053, 063, 070 are marked `obsolete` there with reason "Testing moved to testing.md". They retain their original IDs for traceability.
