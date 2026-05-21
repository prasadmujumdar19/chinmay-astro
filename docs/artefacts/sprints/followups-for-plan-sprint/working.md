# Sprint working copy — `followups-for-plan-sprint`

**Source (read-only):** `docs/artefacts/tests/smoke-pre-golive-continued-2026-05-20/followups-for-plan-sprint.md`
**Sprint state:** [`state.md`](./state.md) (canonical YAML; this file is the human-readable working copy)
**Created:** 2026-05-20T12:30:58Z

`build-sprint` updates `status` notes inline below as items move through pending → in-progress → done.
TD-D was removed from the sprint during planning and folded into FOLLOWUP-ERR (post-sprint).
PIC-04, PIC-05, PIC-06 were added during planning per user direction 2026-05-20.

---

## Batch 1 — P0 critical-path (Chinmay Astro repo)

### TD-A — WF-20 keyword interception is a no-op
> **Status:** ✅ Done — 2026-05-21 | WF-20 (LgIDj1v4ZbCPlX25) | partial-update applied; live + workflows/ in sync; acceptance verification deferred to TD-H
- **Status:** done
- **Priority:** P0
- **Workflows:** WF-20
- **Change kind:** surgical
- **Pseudocode-first:** no (field-name wiring fix, no logic change)
- **Source:** ISSUE-07
- **Fix:** rename Set-node assignments to `messageContent` / `user?.id` in `Normalize Keyword`.

### TD-B — WF-47 missing queryReplacement + Postgres `$N` sweep (EXPANDED → STOP redesign)
> **Status:** ✅ Done — 2026-05-21 | WF-47 (2U7mxHMyqA41ROKX) | scope expanded mid-sprint per user direction: STOP now unconditional, consultation auto-close + Slack notice, admin_actions write removed. Pseudo + journey map + registry updated before code. Sweep across all 28 workflows: zero remaining $N-without-queryReplacement hits.
- **Status:** done
- **Priority:** P0
- **Workflows:** WF-47 + sweep targets
- **Change kind:** surgical + batch sweep
- **Pseudocode-first:** no
- **Source:** ISSUE-08
- **Soft dep:** TD-C (sibling on WF-47)
- **Fix:** add `options.queryReplacement` array; sweep all Postgres `$N`-without-replacement across active workflows.

### TD-C — WF-34 IF type-strictness + IF-strict sweep
> **Status:** ✅ Done — 2026-05-21 | WF-34 (se82n3MUQ9xE5aEr) + WF-11 (GoTYo0GS2y8qjjkw) | operator.type→number, gt 0, leftValue coerced via Number(x||0) to satisfy strict mode on not-found; typeVersions preserved
- **Status:** done
- **Priority:** P0
- **Workflows:** WF-34 + sweep (WF-44, WF-46, WF-47-unblock)
- **Change kind:** surgical + batch sweep
- **Pseudocode-first:** no
- **Source:** ISSUE-03
- **Soft dep:** TD-B (sibling on WF-47)
- **Fix:** operator picks: change IF type to `number` (best), or cast `String($json.id)` (safe), or `typeValidation: loose` (lossy).

---

## Batch 2 — P1/P2 (Chinmay Astro repo)

### TD-D — REMOVED FROM SPRINT
Scope expanded by user 2026-05-20 to cover BOTH user-facing AND admin-facing error paths. Becomes FOLLOWUP-ERR (post-sprint think-plan-build deliverable). User-facing failure-mode UX is worse than admin's — users in vacuum churn.

### TD-E — WF-40 free-form text must run WF-25 first
- **Status:** pending
- **Priority:** P1
- **Workflows:** WF-40
- **Change kind:** structural
- **Pseudocode-first:** **YES** — revise `docs/pseudocode/WF-40.pseudo` first; user approves diff; impact-analyse revised pseudo; THEN implement.
- **Source:** ISSUE-06 (DR-6 violation)
- **Fix:** add WF-25 invocation at head; intent-route (general/wants_consultation/feedback_intent/rebook_intent → relay; malicious_abusive/inappropriate/garbage → warn+block).

### TD-F — `messages.content` NULL on interactive + template (audit gap)
- **Status:** pending
- **Priority:** P1
- **Workflows:** WF-50 + WF-00
- **Change kind:** structural
- **Pseudocode-first:** **YES** — revise both `.pseudo` files first.
- **Source:** ISSUE-01
- **Fix:** WF-50 outbound mapper handles `interactive` (`interactive.body.text` + button metadata) and `template` (template name + body params). WF-00 inbound mapper captures both `button_id` and display label.

### TD-G — Export operator's WF-41 UI fix
- **Status:** pending
- **Priority:** P1
- **Workflows:** WF-41
- **Change kind:** documentation (no functional change)
- **Pseudocode-first:** no
- **Source:** ISSUE-05
- **Fix:** export → assert-md-fresh → commit → push.

### TD-H — Verify REBOOK keyword interception after TD-A
- **Status:** pending
- **Priority:** P2
- **Workflows:** none (verification)
- **Hard dep:** TD-A
- **Source:** ISSUE-02
- **Tagged:** `next-test-session`
- **Action:** confirm REBOOK keyword from `consultation_closed` goes WF-20 → WF-45 directly (no WF-25, no WF-43). Latency ≤ ~2.5s. If still hitting WF-25, raise TD-A regression.

---

## Batch 3 — Plugin-repo improvements

**Precondition:** Batches 1+2 fully committed and pushed to `prasadmujumdar19/chinmay-astro` main.

**Repo:** `prasadmujumdar19/n8n-whatsapp-methodology` (NOT this repo).

### PIC-01 — impact-analysis: enumerate intra-workflow `$('NodeName')` refs
Closes ISSUE-05 root cause. jq scan of expression bodies vs names-of-removed-nodes.

### PIC-02 — build-workflow: AFTER-gate catches dangling node-name refs
Either reruns PIC-01 scan on final JSON, or triggers a synthetic test execution.

### PIC-03 — technical-workflow-review: add dangling-ref check to battery
Same jq scan as PIC-01; surfaces latent versions in unmodified workflows.

### PIC-04 — NEW skill: pseudocode-vs-`.md` drift detector
Compares `.pseudo` (handwritten design spec) vs `.md` (AS-IS projection from JSON) for every WF-XX. HTML report + per-workflow drift score. Addresses user's concern that workflows NOT touched this sprint may already have drifted.

### PIC-05 — build-workflow: classify step gates pseudocode-first
Converts the soft `[[feedback_pseudocode_first_refactor]]` memory into a hard gate. "Is this change purely parametric? If not → MUST update `.pseudo` first, MUST get user approval on pseudo diff."

### PIC-06 — FINAL: pseudocode-drift hook at `build-sprint` invocation
Hook checks last drift-detector run (PIC-04). If >24h stale → run drift detector first; if drift found → block build-sprint until resolved. Universal — applies to surgical edits too because variable renames inside decision forks can drift pseudo even without structural change. Hard dep on PIC-04.

---

## FOLLOWUP-ERR — Exhaustive error handling design (think-plan-build)

**Priority:** HIGH
**Status:** post-sprint deliverable
**Blocks:** next testing session

Originated as TD-D, scope expanded by user 2026-05-20.

**Problem:** When any n8n workflow throws an unhandled node exception, the affected party — user or admin — sees nothing. Explicit failure-branch responses (e.g. "User Not Found" Slack posts) never fire because execution short-circuits on node error. User-facing case is the bigger risk: users churn silently when their messages "disappear into the void". Admin-facing case (Chinmay's commands) is recoverable via retry but still degrades trust.

**Scope:** Inbound user paths + admin-action paths + background-job workflows. Cannot be solved by per-workflow patching — needs a coherent design.

**Operator preference recorded so far:** contextual per channel (where the originating request came from). For the admin half, per-workflow Error Trigger nodes are favoured over a global WF-19 because contextual routing is direct from the in-context execution data tree.

**Action:** After Batch 3 lands, run `brainstorming → writing-plans → executing-plans` for cross-workflow error handling. Must complete before any next testing session resumes.

**Reminder mechanism:** `build-sprint` surfaces this at end of Batch 3 ("Sprint complete. Reminder: FOLLOWUP-ERR must be designed and built before next testing session.").
