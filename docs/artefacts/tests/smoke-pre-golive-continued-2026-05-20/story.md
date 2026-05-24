# Story — smoke-pre-golive-continued (2026-05-20)

Exploratory pre-go-live smoke walked the full critical path on a single test user (`+61466927921`) and surfaced eight functional issues plus three plugin-improvement candidates. The session was deliberately kept open — `report.html` was deferred until downstream remediation could be verified end-to-end. This card-by-card walkthrough records the original observation and, where the fix has since landed, the remediation that closed it.

---

### TC-WF20-KEYWORD — STOP / HELP / REBOOK keyword interception was a no-op  ❌ → ✅ (after TD-A)

WF-20's `Normalize Keyword` Set node read `$json.messageText` and `$json.userId`, but the WF-02 caller emitted `messageContent` and `user.id`. The result: `keyword = null` on every invocation, the `Match Keyword` Switch always fell through to passthrough, and WF-20 was effectively dead code for every keyword. The bug had been masked since deployment because the downstream state-handlers and WF-25 caught the fall-through and routed correctly in most cases — HELP returned the wrong text, REBOOK burned a needless Gemini call, and STOP exposed the latent WF-47 bug (TD-B / ISSUE-08). Sprint Batch 1 / TD-A revised the WF-20 pseudocode first to lock the canonical field-name contract, then aligned the live `Normalize Keyword` assignments to read `$json.messageContent` and `$json.user?.id`.

---

### TC-WF47-STOP — STOP keyword crashed Postgres update  ❌ → ✅ (after TD-B)

When STOP finally reached WF-47, the `Update User Status to opted_out` Postgres node used a `$1` positional parameter without `parameters.options.queryReplacement`, producing `Variable $1 out of range. Parameters array length: 0` — identical pattern to the prior WF-44 BUG-NEW-03. TD-B added the missing `queryReplacement: ={{ [$('When Executed by Another Workflow').first().json.phoneNumber] }}` and, per the pre-fix sweep, audited every other Postgres node project-wide for the same `$N` + missing replacement combination. TD-B's scope expanded mid-sprint to redesign STOP as unconditional (no consultation-active hold-branch), adding consultation auto-close + Slack notice when the user was mid-consultation; admin_actions write removed per TD-NEW-026.

---

### TC-WF34-REJECT — REJECT PAYMENT errored on every attempt  ❌ → ✅ (after TD-C)

WF-34's `User Found?` IF node used `leftValue: $json.id` (a Postgres int) with `operator.type: "string"` and `typeValidation: "strict"`. Strict mode refused to coerce → `Wrong type: '28' is a number but was expecting a string` on every REJECT. TD-C fixed the WF-34 IF type-alignment and ran a sweep across sibling admin-action workflows (WF-44, WF-46, WF-47, WF-11) — no other strict-string-on-numeric-id IFs surfaced. A subsequent BUG-06 in `smoke-wf10-centralized-gate-2026-05-23` Phase E2 surfaced a separate REJECT-reason propagation bug (producer/consumer field-name drift `reason` vs `rejectionReason` + series-after-sub-workflow contract drop); that was fixed mid-smoke (commit `53b95fd`) and is end-to-end verified in the later session.

---

### TC-ADMIN-ERR — Admin got zero Slack feedback on workflow exceptions  ❌ → ✅ (FOLLOWUP-ERR)

When any admin-action workflow threw a node exception, the explicit failure-branch Slack responses (`Prepare WF-51 Payload (User Not Found)`, `(Wrong State)`, etc.) never fired because execution short-circuited. Admin saw nothing happen. Operator expanded scope mid-planning: not just admin paths, but ALL inbound user paths and background jobs need an error-feedback story, because user-facing UX in a silent vacuum is a worse churn risk than admin's. The original TD-D was lifted out of the surgical sprint into FOLLOWUP-ERR — a dedicated brainstorm → spec → plan → build cycle covering cross-workflow error handling. FOLLOWUP-ERR has since shipped (`status: done` in sprint state.md).

---

### TC-WF40-RELAY — Free-form text during consultation relayed verbatim with no intent gate  ❌ → ✅ (after TD-E)

CLAUDE.md Design Rule #6 states every state accepting free-form text must run WF-25 first. WF-40 (User → Admin Relay) was the last DR-6 violator — during `consultation_active`, garbage and abusive text were forwarded straight to Chinmay's Slack channel, and the auto-block path (WF-25 → WF-46) never fired. TD-E revised `docs/pseudocode/WF-40.pseudo` first, then inserted WF-25 at the head with fan-out: always relay verbatim to admin AND conditionally send a stop-intent clarifier via WF-50 if WF-25 classifies as `stop_intent` (avoiding false-positive auto-opt-out). Garbage / malicious_abusive / inappropriate intents are handled inside WF-25's own warn+block branches. 4 nodes → 8 nodes; pseudo-first per `[[feedback_pseudocode_first_refactor]]`.

---

### TC-MESSAGES-CONTENT — `messages.content` NULL for interactive + template message types  ❌ → ✅ (after TD-F)

WF-50's `Build WF-60 Payload (Outbound)` Code mapper extracted content only for `message_type='text'`. Every payment-instructions / feedback-prompt / template row landed in `messages` with `content=NULL`, and inbound interactive messages (WF-00 path) captured only the routable `button_id`, missing the human-readable label. TD-F revised the relevant `.pseudo` sections first to lock the canonical per-`message_type` extraction contract; both WF-50 outbound mappers (`Build WF-60 Payload (Outbound)` and `Build WF-60 Drop Payload`) now do per-type extraction (text → `messageContent`; interactive → `body.text || JSON-serialise` + `metadata.buttons`; template → `'template:' + templateName` + `metadata.templateParams`). WF-00's `Parse WhatsApp Message` now extracts `interactiveLabel` in parallel with the routable `messageContent`; `Build WF-60 Payload (Inbound)` writes `interactiveLabel || messageContent` into `messages.content`, preserving the original button-id in `metadata.interactiveButtonId` for traceability.

---

### TC-WF41-DANGLING — WF-41 carried a stale `$('Detect Direction')` reference after orphan-branch removal  ❌ → ✅ (after TD-G)

Mid-session, after the orphaned WA→Slack branch was excised from WF-41 (4 nodes removed: `Detect Direction`, `Route by Direction`, `Prepare Channel Lookup`, `Post to Slack Channel`), a surviving downstream node still expression-referenced the removed `Detect Direction`. The first admin "Hi back" relay failed at expression-eval time — n8n's static validator hadn't caught it. The operator patched the live workflow in the UI mid-session; TD-G exported the fixed WF-41 to disk and committed it, then the same incident triggered PIC-01 / PIC-02 / PIC-03 (intra-workflow `$('NodeName')` enumeration / post-change re-scan / standing review check) so the class of bug cannot recur silently.

---

### TC-REBOOK-KW — REBOOK keyword burned a Gemini hop instead of going direct  ⏸ Deferred (TD-H)

TD-H is verification-only: with TD-A's `Normalize Keyword` fix, the REBOOK keyword path should now go WF-20 → WF-45 directly (~2s), bypassing WF-43 → WF-25 (~6s). The sprint explicitly deferred this acceptance test to the next `monitor-test-run` cycle because it's a behavioural verification, not a code change. The dependency (TD-A) is done; the verification has not yet been exercised in a recorded test session. `smoke-wf10-centralized-gate-2026-05-23` did not specifically tick REBOOK as a keyword (the text rebook-intent path was tested earlier). Tomorrow's queue.

---

### TC-PLUGIN-IMPROVEMENTS — Three (then six) plugin gaps surfaced by ISSUE-05  ✅ (shipped)

ISSUE-05 (WF-41 dangling reference) was caught by the operator in seconds, but its existence demonstrated three latent gaps in the plugin's own discipline: `impact-analysis` didn't enumerate intra-workflow `$('NodeName')` references before node removal (PIC-01); `build-workflow`'s AFTER-gate didn't catch dangling refs because n8n's static validator only complains at expression evaluation time (PIC-02); and `technical-workflow-review` had no standing check for the same class of bug (PIC-03). All three landed in plugin versions 1.20.0 / 1.21.0 / 1.22.0 respectively. The same Batch 3 picked up three additional improvement candidates surfaced during sprint execution (PIC-04 drift detector, PIC-05 build-workflow classify-gates-pseudocode-first, PIC-06 drift hook at build-sprint invocation) plus PIC-21A for the interactive-label content gap that became TD-F.

---
