# Sprint input — Follow-ups from smoke test `smoke-pre-golive-continued-2026-05-20`

**Source:** `docs/artefacts/tests/smoke-pre-golive-continued-2026-05-20/session.md`
**Generated:** 2026-05-20T10:36:14Z
**Test user:** id=28 / phone `61466927921` / current state `payment_pending`
**For:** `n8n-whatsapp-methodology:plan-sprint`

8 functional issues + 3 plugin-improvement candidates. Listed in suggested execution order; final sequencing is `plan-sprint`'s call.

---

## TD-A — WF-20 keyword interception is a no-op (ISSUE-07) `[critical]` `[critical-path]`

**Problem:** WF-20's `Normalize Keyword` Set node reads `$json.messageText` and `$json.userId`, but the caller payload from WF-02 supplies `messageContent` and `user.id`. Result: `keyword=null`, the `Match Keyword` Switch falls through to passthrough, WF-20 is a no-op for ALL keywords (STOP / HELP / REBOOK). The bug has been masked since deployment because state-handlers + WF-25 catch the fall-through and route correctly *most* of the time — but HELP returns wrong text, REBOOK burns an unnecessary Gemini call, and STOP exposes ISSUE-08.

**Fix:**
- In `Normalize Keyword`: change assignments
  - `keyword` value: `={{ $json.messageContent.trim().toUpperCase() }}` (was `messageText`)
  - `userId` value: `={{ $json.user?.id }}` (was `userId`)
  - `messageText` value: `={{ $json.messageContent }}` (alias for downstream compat if needed)

**Acceptance:**
- Send "STOP" from any non-`consultation_active` state → WF-20's STOP branch fires (verifiable via runData → `Match Keyword` output 1 is non-empty) → WF-47 invoked directly without WF-25 hop.
- Send "HELP" from `payment_pending` → WF-20's HELP branch fires → status-aware HELP text returned per TD-027 (NOT the WF-30 payment-reminder).
- Send "REBOOK" from `consultation_closed` → WF-20's REBOOK branch fires → WF-45 reached without going through WF-43/WF-25 (latency should drop from ~6s to ~2s).

**Pre-fix step (REQUIRED):** invoke `n8n-whatsapp-methodology:impact-analysis` on WF-20 to confirm no other workflow expects the old field names (it would be a no-op since WF-20 hasn't been working anyway, but check anyway).

**Per [[feedback_pseudocode_first_refactor]]:** revise `docs/pseudocode/WF-20.pseudo` first to lock in the canonical field-name contract for the `Normalize Keyword` step; then implement; then re-run impact-analysis on the revised pseudo.

---

## TD-B — WF-47 `Update User Status to opted_out` missing `queryReplacement` (ISSUE-08) `[critical]` `[critical-path]`

**Problem:** Postgres node uses `$1` positional parameter but `options.queryReplacement` is absent → `Variable $1 out of range. Parameters array length: 0`. Same pattern as **BUG-NEW-03** from yesterday's WF-44; sprint TD-001 fixed WF-44 but missed WF-47.

**Fix:**
- Add `parameters.options.queryReplacement: ={{ [$('When Executed by Another Workflow').first().json.phoneNumber] }}` to the `Update User Status to opted_out` node.

**Acceptance:** STOP flow completes; `users.status` → `opted_out`; opt-out confirmation WA reply sent; consult-{phone} Slack channel archive step succeeds.

**Pre-fix sweep (REQUIRED):** invoke `impact-analysis` to find ALL Postgres nodes across all active workflows where `parameters.query` contains `$N` AND `parameters.options.queryReplacement` is absent / null. Patch all in one sprint to prevent third-recurrence-of-same-pattern. Likely jq one-liner; cheap.

---

## TD-C — WF-34 `User Found?` IF type strictness blocks REJECT PAYMENT (ISSUE-03) `[critical]` `[critical-path]`

**Problem:** WF-34's `User Found?` IF node uses `leftValue: $json.id` (a Postgres int → JS number) with `operator.type:"string"` + `typeValidation:"strict"`. Strict mode refuses to coerce → `Wrong type: '28' is a number but was expecting a string`. Every REJECT errors deterministically.

**Fix (operator chooses one):**
- **Best:** change operator `type` from `"string"` to `"number"` and use a number-domain existence check (e.g. `larger than 0`).
- **Safe & minimal:** keep operator type `"string"` but cast leftValue → `={{ String($json.id) }}` or `={{ $json.id?.toString() }}`.
- **Loose:** set `parameters.conditions.options.typeValidation: "loose"` — broader compatibility but loses type safety.

**Pre-fix sweep (REQUIRED):** invoke `impact-analysis` to find IF nodes with the pattern `leftValue = $json.id` (or similar numeric column) + `operator.type:"string"` + `typeValidation:"strict"` across all admin-action workflows. **Known scope-narrowing from this session:** WF-42 (CLOSE) uses `phone_number` → safe. WF-33 (APPROVE) has no `User Found?` at all → safe. Likely suspects: **WF-44 (Save Feedback), WF-46 (BLOCK), WF-47 (UNBLOCK branch in WF-11)** — check before patching.

**Acceptance:** REJECT PAYMENT against an existing user in `payment_submitted` state successfully transitions status → `payment_pending`, sets `payments.rejected_at` + `rejection_reason`, sends WA rejection message, posts Slack admin ack.

---

## TD-D — Admin gets ZERO Slack feedback on workflow exceptions (ISSUE-04) `[major]` `[pattern]`

**Problem:** When any admin-action workflow throws a node exception, the explicit failure-branch Slack responses (`Prepare WF-51 Payload (User Not Found)`, `(Wrong State)`, etc.) never fire because execution short-circuits. Admin sees nothing happen.

**Fix options:**
- **Per-workflow:** add an Error Trigger to each admin-action workflow (WF-11, WF-33, WF-34, WF-42, WF-46, WF-47-unblock) that posts `⚠️ Command failed — see execution NNNN` to the admin's channel + admin-wide channel.
- **Global error-trigger workflow:** dedicated `WF-19 Admin Error Notifier` that subscribes to all admin-action workflow error events.

**Operator decision needed:** per-workflow vs global error-trigger.

**Acceptance:** force a deliberate exception in WF-33 (e.g. point its Postgres node at an invalid table). Admin sees a Slack post in the relevant channel with execution ID + workflow name within 10 seconds of the error.

---

## TD-E — WF-40 doesn't invoke WF-25 → garbage + abuse relayed verbatim in `consultation_active` (ISSUE-06) `[major]` `[DR-6 violation]`

**Problem:** During `consultation_active`, free-form user text routes from WF-02 → WF-40 (User → Admin Relay), which bundles + forwards to WF-51 / Slack with no intent classification. CLAUDE.md Design Rule #6 says "Every state accepting free-form text must run WF-25 first." Auto-block path (WF-25 → WF-46) never fires for in-consultation abuse.

**Fix:**
- Add a WF-25 invocation at the head of WF-40.
- Route by intent: `general_enquiry` / `wants_consultation` / `feedback_intent` / `rebook_intent` → proceed with relay; `malicious_abusive` / `inappropriate` / `garbage` → short-circuit to WF-25's warn+block branches.

**Pre-fix step (REQUIRED):** `impact-analysis` against WF-40 to confirm no other caller depends on its current unconditional-relay contract. Per [[feedback_pseudocode_first_refactor]], revise `docs/pseudocode/WF-40.pseudo` first.

**Acceptance:**
- Send garbage `/&/&xyz` during `consultation_active` → user gets garbage-warning WA reply; admin gets ONLY a garbage notification post (not the relayed message); no relay occurs.
- Send abusive "fuck off" during `consultation_active` → user gets warning + auto-block via WF-46 → status `blocked`.

---

## TD-F — `messages.content` NULL on outbound interactive + template messages (ISSUE-01) `[major]` `[audit-gap]`

**Problem:** WF-50's `Build WF-60 Payload (Outbound)` Code mapper extracts content only for `text` message_type. For `interactive` and `template` types, the human-readable copy lives in nested fields (`interactive.body.text` for interactive, template name + body params for template), and the mapper doesn't read them. Result: every payment-instructions / feedback-prompt / consultation_active-template row in `messages` has `content=NULL`. Inbound interactive (WF-00 path) captures only `button_id`, missing the display label.

**Fix:**
- **WF-50 outbound mapper:** when `message_type='interactive'`, extract from `interactive.body.text` plus serialise button labels into `metadata.buttons`. When `message_type='template'`, extract template name + serialised body parameters.
- **WF-00 inbound mapper:** when `message_type='interactive'`, extract both `button_id` and the display label from the button-reply payload.

**Pre-fix step (REQUIRED):** `impact-analysis` against WF-50 + WF-00 → WF-60 canonical contract. Per [[feedback_pseudocode_first_refactor]], revise the relevant `.pseudo` sections first to lock in the canonical content-extraction contract per `message_type`.

**Acceptance:** rerun rebook flow + close flow + APPROVE PAYMENT. All resulting `messages` rows have non-NULL `content` regardless of `message_type`.

---

## TD-G — WF-41 stale node reference (ISSUE-05) `[major]` `[process]`

**Status:** operator already patched in n8n UI mid-session. The DB-level workflow is fixed. **Sprint action:** export the fixed WF-41 to `workflows/`, commit to GitHub, and use the *process gap* as the trigger to apply PIC-01 / PIC-02 / PIC-03 (see plugin improvements below) so this class of bug doesn't recur.

**Pre-fix step:** confirm via `scripts/export-all-workflows.sh && scripts/assert-md-fresh.sh WF-41` that the exported JSON matches live and the `.md` companion is fresh.

---

## TD-H — REBOOK keyword Gemini-call observation (ISSUE-02) `[minor]` `[likely auto-resolves]`

**Likely outcome:** resolved automatically when TD-A (WF-20 fix) lands. Once WF-20 actually intercepts REBOOK, the keyword path skips WF-25 entirely and goes WF-20 → WF-45 directly (~2s instead of ~6s).

**Sprint action:** include a retest as part of TD-A's acceptance. Don't allocate separate dev time.

---

## Plugin improvement candidates (for `flush-plugin-improvements` AFTER sprint completes)

### PIC-01 — `impact-analysis`: enumerate intra-workflow `$('NodeName')` references before node removal

Triggered by ISSUE-05. Current skill scans connection topology + caller/callee surfaces but doesn't scan surviving nodes' expression bodies for `$('<removed-name>')` references. Implementation: jq-walk every surviving node's `parameters` JSON → regex extract `\$\('([^']+)'\)` → set-difference against names-of-nodes-about-to-be-removed → fail if non-empty.

### PIC-02 — `build-workflow`: post-change validation must catch dangling refs OR execute a synthetic payload

Triggered by ISSUE-05. The AFTER-gate currently doesn't catch dangling `$('NodeName')` references because n8n's static validator only complains at expression evaluation time. Either re-run PIC-01's scan on the FINAL workflow JSON, or trigger one synthetic test execution as part of the AFTER gate.

### PIC-03 — `technical-workflow-review`: add "dangling node-name reference" check to the standard battery

Triggered by ISSUE-05. Catches latent versions of the same bug class in workflows that weren't edited this session. Cheap to implement (same jq scan as PIC-01) and surfaces in the review HTML.

---

## Suggested execution order (subject to plan-sprint validation)

1. **TD-A** (WF-20 normalize-keyword fix) — fixes ISSUE-07 + indirectly enables TD-H acceptance retest
2. **TD-B** + its pre-sweep — fixes ISSUE-08; the sweep may surface 1–N more Postgres-queryReplacement bugs, batch them into the same sprint item
3. **TD-C** + its pre-sweep — fixes ISSUE-03; the sweep may surface IF-typestrict issues in WF-44/46/47
4. **TD-F** (interactive/template content extraction) — fixes ISSUE-01
5. **TD-E** (WF-40 → WF-25) — fixes ISSUE-06
6. **TD-D** (admin error-notifier) — fixes ISSUE-04; operator decision on per-workflow vs global needed before scoping
7. **TD-G** (commit operator's WF-41 UI fix) — quick housekeeping
8. **PIC-01 / PIC-02 / PIC-03** — via `flush-plugin-improvements` after the above are merged

## State carry-forward

Test user 28 (`61466927921`) is in `payment_pending` with payment id=12 already `verified` from earlier APPROVE (mid-test state — was advanced to `consultation_active`, then closed, then rebook landed it back here). For sprint retest:
- TD-A retest from `payment_pending` state covers STOP and HELP keyword interception
- TD-B / TD-C retest from `payment_pending` (move user to `payment_submitted` first via button click)
- TD-E retest from `consultation_active` (move user forward via APPROVE)
- Onboarding from scratch needs CLAUDE.md clean-slate wipe of 28 + delete Slack channel `C0B567A175W`

Slack channel `C0B567A175W` preserved per DR-10.
