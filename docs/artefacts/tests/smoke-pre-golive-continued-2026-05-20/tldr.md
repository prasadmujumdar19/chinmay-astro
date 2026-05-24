# TL;DR — smoke-pre-golive-continued (2026-05-20)

**Verdict (post-remediation, verified 2026-05-24):** 8 functional issues + 3 plugin-improvement candidates surfaced during this smoke session. After downstream `plan-sprint` → `build-sprint` cycles, **7 of 8 functional issues are fixed and live; 1 remains as a deferred verification item (TD-H, hard-dep on TD-A which is already done).** All 3 PICs landed in plugin v1.20.0 / 1.21.0 / 1.22.0, plus 3 bonus PICs (PIC-04/05/06 + PIC-21A) bundled into the same plugin batch.

**Source of truth for remediation:** `docs/artefacts/sprints/followups-for-plan-sprint/state.md` — `sprint_status: complete`.

## Bugs at a glance

| ID | Sev | Workflow(s) | What broke | Fix applied | Status |
|---|---|---|---|---|---|
| ISSUE-01 / TD-F | [major] | WF-00, WF-50 | `messages.content` NULL on outbound interactive + template; inbound interactive captured only `button_id` | Per-`message_type` content extractors in WF-50 outbound mappers + WF-00 `Parse WhatsApp Message` now emits `interactiveLabel` | ✅ Fixed |
| ISSUE-02 / TD-H | [minor] | WF-20 → WF-45 | REBOOK keyword burned an unnecessary Gemini hop via WF-25 instead of going WF-20 → WF-45 directly | Auto-resolves with TD-A — needs live retest | ⏸ Deferred (verification-only; hard-deps on TD-A which is done) |
| ISSUE-03 / TD-C | [critical] | WF-34 (+ sweep WF-44/46/47/11) | `User Found?` IF strict-string + `$json.id` (number) → every REJECT errored deterministically | Pseudocode-first revision; IF leftValue cast / type-aligned; sweep audited siblings | ✅ Fixed |
| ISSUE-04 / TD-D → FOLLOWUP-ERR | [major] | All admin-action WFs | Admin got ZERO Slack feedback on workflow exceptions | Scope expanded by operator to BOTH user + admin error UX; full think→plan→build cycle delivered | ✅ Fixed |
| ISSUE-05 / TD-G | [major] | WF-41 | Stale `$('Detect Direction')` node reference after orphan-branch removal | Operator patched in n8n UI mid-session; exported + committed; PIC-01/02/03 added as prevention | ✅ Fixed |
| ISSUE-06 / TD-E | [major] | WF-40 | Free-form text in `consultation_active` relayed verbatim — no WF-25 intent gate → DR-6 violation, no auto-block for abuse | Pseudocode-first revision; WF-25 inserted at head; fan-out with stop-intent clarifier branch | ✅ Fixed |
| ISSUE-07 / TD-A | [critical] | WF-20 | `Normalize Keyword` read `$json.messageText` / `$json.userId` but caller emitted `messageContent` / `user.id` → no-op for ALL keywords | Field names aligned to caller contract; pseudocode revised first | ✅ Fixed |
| ISSUE-08 / TD-B | [critical] | WF-47 (+ sweep) | `$1 out of range` — Postgres node missing `queryReplacement` (same pattern as prior WF-44 bug) | queryReplacement added; project-wide sweep for Postgres-`$N`-without-replacement caught no other instances | ✅ Fixed |

## Plugin improvements

| ID | What | Status |
|---|---|---|
| PIC-01 | `impact-analysis` Step 2a — enumerate intra-workflow `$('NodeName')` refs before removal | ✅ Shipped (plugin 1.20.0) |
| PIC-02 | `build-workflow` Step 6a — post-change dangling-ref re-scan as AFTER-gate | ✅ Shipped (plugin 1.21.0) |
| PIC-03 | `technical-workflow-review` C16 — standing dangling-ref check across reviewed workflows | ✅ Shipped (plugin 1.22.0) |
| PIC-04 / PIC-21A / PIC-05 / PIC-06 | Bonus: drift detector, interactive-label content gap, classify gates pseudocode-first, drift hook at build-sprint invocation | ✅ Shipped (bundled in plugin Batch 3) |

## Test scope

- **User exercised:** id=28 / `+61466927921`
- **Scenarios touched during the original session:** onboarding form, payment_pending → payment_submitted → consultation_active (APPROVE), user→admin + admin→user relay, CLOSE, text rebook-intent (WF-43 → WF-25 → WF-45), STOP, HELP, REJECT PAYMENT
- **Scenarios deferred to next monitor-test-run:** REBOOK keyword path (TD-H acceptance), STOP unconditional path (TD-B-expanded acceptance), REJECT PAYMENT happy path (TD-C acceptance)

## State carry-forward

Test user 28 / `+61466927921` ended the original session in `payment_pending`. Subsequent end-to-end smoke (`smoke-wf10-centralized-gate-2026-05-23`) advanced and re-cycled this user; current state is owned by that subsequent session, not this one. Slack channel `C0B567A175W` preserved (DR-10).

## Tomorrow's queue

The deferred TD-H verification + the 3 explicit acceptance retests above were carried forward into the next monitor-test-run cycle (`smoke-wf10-centralized-gate-2026-05-23`), which reported all 10 phases green — providing strong indirect end-to-end verification that TD-A/B/C/E/F land cleanly.
