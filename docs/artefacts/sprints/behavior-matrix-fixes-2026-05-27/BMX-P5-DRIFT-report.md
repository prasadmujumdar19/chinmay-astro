# BMX-P5-DRIFT — Drift Audit + Missing-Axes Sweep Spec

**Sprint:** behavior-matrix-fixes-2026-05-27 · Batch 10 (Phase 5 · Verify), item BMX-P5-DRIFT
**First generated:** 2026-05-30 · **Restructured:** 2026-05-30T08:17:56Z
**Status of repo:** READ-ONLY audit. No live workflow, `.md`, or `.pseudo` was modified by this audit.

> **Document history (why this report was restructured).** The original Batch-10 audit was run by **11 Sonnet sub-agents** and proved unreliable: during Batch-11 prep the user caught it declaring **WF-30 "✅ correct"** when live plainly shows the same bug WF-30 was supposed to have. The full 31-workflow **drift + caller-contract** sweep was therefore **re-run with Opus** (Section 1 below — authoritative). The Sonnet run's narrative findings (former PARTS A–E) have been **removed from this report** to avoid confusion, because (a) several were wrong, and (b) the rest were never independently verified **and may be incomplete** (Sonnet may have missed instances entirely, the way it missed WF-34). The **Opus** raw output and structured findings are persisted alongside this report (`BMX-P5-DRIFT-opus-reaudit-raw-output.json`, `BMX-P5-DRIFT-opus-reaudit-findings.json`); the **original Sonnet report text** is recoverable from git history (commit `b7a11bf` and earlier) if ever needed.
>
> **This report now has exactly two parts:**
> - **Section 1 — Confirmed drift audit (Opus).** What we swept, the method, and the **confirmed** observations (with ground-truth live checks). This is trustworthy.
> - **Section 2 — Missing-axes sweep specification.** The algorithm + per-workflow checks for the **code-quality / tech-mechanism / data-contract / pseudo-convention** axes that the Opus drift sweep did **not** cover. **It contains NO observations** — those are to be produced **inline, workflow-by-workflow, by the plan-sprint / build-sprint remediation work** and appended to §2.6.

---

# SECTION 1 — CONFIRMED DRIFT AUDIT (Opus re-run, authoritative)

## 1.1 — Why this re-run happened
During Batch-11 prep, a live cross-check of WF-30's `Call WF-25` mapping contradicted the Sonnet audit's "WF-30 ✅ correct" verdict — WF-30 live passes key `messageText` (undefined on the envelope), identical to the WF-43/WF-31 bug the Sonnet run *did* flag. Root cause of the miss: a per-workflow reading error with no structured per-category coverage to catch it. Decision: re-run the full 31-WF drift sweep with Opus.

## 1.2 — Method
- **Fresh data, source-of-truth:** 31 live workflow JSON re-exported from live n8n → `generate-workflow-md.py` → 31 fresh AS-IS `.md` (scratch). 31 `.pseudo` pulled from **GitHub `main`** (confirmed **0 divergence** vs working-dir copies).
- **`.md` fidelity proven before auditing** (so no finding is an artifact of a lossy projection): across 431 nodes — **431/431 node names present**, **431/431 `parameters` blobs reproduced verbatim** (character-for-character), **all connection-edge counts match**, **0 disabled nodes**. The generator omits only `credentials` (not a drift category) and 5 node `notes` annotations (all 5 extracted and handed to the agents).
- **Fan-out:** dynamic Workflow, **11 Opus agents × ~3 workflows each**, applying the **D1–D9** drift taxonomy with two safeguards the Sonnet run lacked: (a) a **structured schema forcing a verdict on every category D1–D9 per workflow** (no silent skips); (b) an explicit **caller-contract cross-check** comparing every `executeWorkflow` call's emitted keys against the callee's pseudo Inputs contract.
- **Scope (important):** this sweep covered **pseudo-vs-md drift + caller-contract only.** It deliberately **excluded** the tech-mechanism / code-quality axis (`onError`, `alwaysOutputData`, re-SELECT, entry-guard completeness, string-SQL, retries) per the pseudo-vs-tech separation rule. That axis is specified in Section 2 and is **not yet audited**.
- **Cost:** 11 agents, ~812K subagent tokens, 202s.

## 1.3 — Status roll-up (31/31, drift + caller-contract axis only)
**22 CLEAN · 2 MINOR · 7 DRIFT.**

| Status | Workflows |
|--------|-----------|
| 🔴 DRIFT | WF-02, WF-22, WF-30, WF-31, WF-33, WF-34, WF-43 |
| ⚠️ MINOR | WF-01, WF-47 |
| ✅ CLEAN | WF-00, WF-10, WF-11, WF-20, WF-21, WF-23, WF-25, WF-26, WF-32, WF-40, WF-41, WF-42, WF-44, WF-45, WF-46, WF-50, WF-51, WF-52, WF-53, WF-60, WF-61, WF-62 |

> A "CLEAN" here means **only** no pseudo-vs-md drift and no caller-contract break. It says **nothing** about the Section-2 axes. Several of these CLEAN workflows may carry real code-quality issues that this sweep did not look for.

## 1.4 — Confirmed findings

### 🔴 LIVE BUGS (functional — fix live)

**1. WF-25 caller mis-key — THREE callers, THREE broken fields each.** *(ground-truth confirmed against live by the main thread)*
- **Callers:** WF-30 (`gGJBY5fJha0Let8I`, payment_pending), WF-31 (`HB8nXudAtk9iXz7C`, payment_submitted), WF-43 (`3va0M06kijgyLejf`, consultation_closed).
- **Callee:** WF-25 (`eTV1lUcYrXBg2q2T`) `Prepare Intent Request` destructures `input.messageContent` (no `messageText` fallback) and reads `userId`/`userStatus`.
- **Envelope truth (verified — WF-01 `Classify & Build Envelope`):** the WF-01 §2.1 canonical envelope (forwarded unchanged by WF-02) carries `phoneNumber`, `messageContent`, and `user.{id, name, status, slack_channel_id, …}`. It has **NO top-level `messageText`, `userId`, or `userStatus`.**
- **The break (identical in all three handlers):**
  - `messageText: ={{ $json.messageText }}` → undefined. **Fix:** drop key `messageText`, add `messageContent: ={{ $json.messageContent }}`.
  - `userId: ={{ $json.userId }}` → undefined. **Fix:** `userId: ={{ ($json.user || {}).id }}`.
  - `userStatus: ={{ $json.userStatus }}` → undefined. **Fix:** `userStatus: ={{ ($json.user || {}).status }}`.
  - (`phoneNumber`, `userName: ($json.user||{}).name`, `slackChannelId: ($json.user||{}).slack_channel_id` are already correct.)
- **Reference (correct) pattern = WF-40** (`du32QBZbSQOjfESe` `Call WF-25`): `user.id`, `messageContent`, `user.status` — the working template to match.
- **Effect:** every free-form user message on the payment_pending / payment_submitted / consultation_closed paths reaches WF-25 with an empty body + undefined user id/status → unreliable classification on all three live existing-user text paths.
- **Fix shape:** identical 3-field fix across 3 workflows = a **Batch Surgical** pass. Order still matters vs the WF-25 entry-guard (fix all three callers → then add WF-25 hard-fail guard, so the new guard never sees a bad caller). Each handler's own `.pseudo` (Step 2/3/8) already specifies the correct contract → live drifted from its own design; the `.pseudo` needs no contract change.

**2. WF-34 (`se82n3MUQ9xE5aEr`) — payment-rejection WhatsApp message broken (the Sonnet run missed this entirely).** *(ground-truth confirmed against live by the main thread)*
- `Prepare Rejection Message` returns `[{ json: { json: { phoneNumber, messageType, interactivePayload } } }]` — **double-nested** under an extra `json` key. `Call WF-50` uses `mappingMode:defineBelow` with empty `value:{}` (passthrough). So WF-50 receives `$json = { json: {…} }`, its guard reads `$json.phoneNumber` = **undefined** → the rejection message to the user does not send correctly.
- **Fix:** remove the extra wrapper — return `[{ json: { phoneNumber, messageType, interactivePayload } }]` (single-nested, matching every other WF-50 caller). *(Note: §2.5 T7 generalizes this check to ALL WF-50/WF-51 callers — there may be more.)*

**3. WF-22 (`dr8QM0m92Ml8MvIh`) — `email_address` always NULL.** *(Opus-flagged with verbatim evidence; not independently live-dumped by main thread — verify at fix time)*
- `Extract Form Data` returns `{phoneNumber, full_name, date_of_birth, time_of_birth, place_of_birth, consent, flow_token, raw_form_data}` — no `email_address`. `Create User Record` UPSERT binds `$json.email_address` → NULL for every submission. **Fix:** parse `email_address` from the Flow `response_json` in `Extract Form Data`.

### 🔴 DRIFT requiring a DECISION

**4. WF-33 (`NcHZedq9ycnAQ9SW`) — admin Slack activation message under-populated.** Live posts a one-line "Payment approved… consultation is now active." Pseudo Step 9 specifies a richer notice incl. user DOB/TOB/Place and an explicit `CLOSE CHAT CONSULT <phone>` operator reminder. DOB/TOB/Place are out-of-core (would need an envelope/SELECT change to render). **Decision:** restore the richer admin notice (and accept the SELECT cost), or accept the one-liner and update the pseudo?

### 🟡 PSEUDO-LAG (live is correct — fix the `.pseudo`, never live)

**5. WF-33 `status='verified'` vs pseudo `'approved'`.** *(ground-truth confirmed: live uses `'verified'` in 4 places; `pending_verification`→`verified` is the canonical payments lifecycle; no `'approved'` literal anywhere.)* Update WF-33.pseudo Step 3 to `'verified'`.
**6. WF-33 Inputs doc:** `Extract Command Data` reads `command`/`subCommand`; pseudo Inputs declares only `commandType`. Document the real WF-11 command payload contract in the pseudo.
**7. WF-01 (`hYGNM97sXvdo1WmI`) MINOR — D9/D8 Inputs shape:** pseudo Inputs is prose ending in "etc." with no required/optional/type enumeration; `Classify & Build Envelope` consumes `messageContentUpper`/`messageId`/`timestamp`/`metadata` not explicitly declared. Author a structured `## Inputs` block. (No runtime impact — all values arrive from WF-00.)

### ⚠️ COSMETIC / COPY
**8. WF-31** — under-review reassurance copy adds Markdown bold + blank lines not in pseudo Step 8 (cosmetic).
**9. WF-47 (MINOR)** — opt-out Slack notice adds a `(phone: <number>)` fragment not in the pseudo Step 4 locked copy.

## 1.5 — Ground-truth confirmations performed (live, by main thread — not agent-only)
| Claim | How verified | Verdict |
|-------|--------------|---------|
| WF-01 envelope has no top-level `messageText`/`userId`/`userStatus` | Dumped `Classify & Build Envelope` jsCode from live WF-01 | ✅ confirmed |
| WF-30/31/43 all read `$json.messageText`/`userId`/`userStatus` | Dumped all four callers' `Call WF-25` value maps side-by-side | ✅ confirmed (WF-40 = correct reference) |
| WF-30 has no upstream node aliasing `messageText` | Traced WF-30 connections + grepped for `messageText` emitters | ✅ confirmed |
| WF-34 double-nested WF-50 payload | Dumped `Prepare Rejection Message` return + `Call WF-50` mappingMode/value | ✅ confirmed |
| WF-33 `verified` is canonical (not `approved`) | Counted `status='…'` literals across all 31 live JSON | ✅ confirmed (`verified` ×4, no `approved`) |
| `.md` projection lossless for drift taxonomy | 431/431 node names + 431/431 param blobs verbatim + edges match + 0 disabled | ✅ confirmed |

## 1.6 — Disposition for plan-sprint (drift axis — trustworthy)
- **Live functional fixes (HIGH):** WF-25 caller mis-key Batch-Surgical across **WF-30 + WF-31 + WF-43** (3 fields each) → then WF-25 entry-guard; **WF-34** double-nest; **WF-22** email parse (verify at fix time).
- **Decision needed:** WF-33 admin-notice richness.
- **Pseudo-lag fixes (pseudo only):** WF-33 `verified` + command/subCommand Inputs; WF-01 Inputs shape.
- **Copy/cosmetic:** WF-31 copy, WF-47 copy.

---

# SECTION 2 — MISSING-AXES SWEEP — SPECIFICATION (no observations yet)

**This section is a spec, not a findings list.** The Opus drift sweep (Section 1) did not look at the code-quality / tech-mechanism / data-contract / pseudo-convention axes. The previous Sonnet attempt at these axes was unreliable and possibly incomplete, so its observations were removed. **The observations table (§2.6) is intentionally empty** — it is to be filled **inline, one workflow at a time, by the plan-sprint / build-sprint remediation work**, applying the algorithm and checks below and ground-truthing each HIGH against live before recording it.

## 2.1 — Why a separate sweep is required (and per-item verification is not enough)
- **False positives** (a listed finding isn't real / is obsolete) — caught by `build-workflow` Step 3 "verify plan target before mutating" at fix time.
- **False negatives** (real issues never listed — the WF-34 class) — **NOT** caught by per-item verification, because there is no item to verify. Only a fresh, systematic per-workflow sweep surfaces these. This is why §2 is a full sweep, not a punch-list.

## 2.2 — Inputs to the sweep (what to load per workflow)
1. AS-IS `.md` — the committed `docs/pseudocode/*.md` were **verified content-fresh vs live on 2026-05-30** (all 31 content-identical to a fresh `generate-workflow-md` run; they pass `assert-md-fresh.sh`). Use them directly — **no re-download or regeneration needed** unless a workflow is edited after this date.
2. The workflow's `.pseudo` (GitHub `main`).
3. `docs/reference/contract-reference.md` §A–§C (the canonical envelope + sub-workflow input contracts) — the authority for entry-guard completeness.
4. `docs/dependency-map.md` (to enumerate every caller/callee for the cross-cutting checks).

## 2.3 — Tech-mechanism / data-contract checks (per workflow)
| ID | Check | Flag when… | Reference |
|----|-------|------------|-----------|
| T1 | **Envelope-first / no re-SELECT** | a leaf workflow re-SELECTs core-envelope fields (`id`/`name`/`phone_number`/`status`) already forwarded by its caller, instead of reading the envelope; keep a SELECT only for genuinely out-of-core fields a guard needs | build-workflow Step 5a.5 |
| T2 | **`alwaysOutputData` hygiene** | a Postgres SELECT lookup/guard whose downstream IF checks empty/non-empty lacks `alwaysOutputData:true` (silent-halt-on-zero-rows) | build-workflow Step 5a.1 |
| T3 | **Silent-swallow of sub-workflow failure** | an `executeWorkflow`/HTTP call with `onError:continueRegularOutput` whose failure leaves the intended side-effect undelivered with no fallback/alert (e.g. returns success while the Slack/WA send silently failed) | build-workflow Step 5a.2 |
| T4 | **Entry-guard completeness** | a strict-envelope utility (WF-25/50/51/53/60/61/62) does not validate every contract-reference §A–§C REQUIRED field and hard-fail on violation (partial guards, `||`-fallbacks instead of throw) | contract-reference §A–§C |
| T5 | **Parameterized vs string-interpolated SQL** | a Postgres `query` interpolates `'{{ $json.x }}'` into the SQL string instead of using `$1` queryReplacement params (injection surface + inconsistency) | build-workflow Step 5b |
| T6 | **Set v3.4 `includeOtherFields`** | a derive-then-passthrough Set node leaves `includeOtherFields` default-false (drops upstream payload); or a contract-emit Set node sets it true (leaks fields) | build-workflow Step 5f.5 |
| T7 | **Payload nesting / double-nest** | a Code node feeding an `executeWorkflow` via empty-`defineBelow` passthrough returns a double-nested `{json:{json:{…}}}` (or otherwise non-flat) shape so the callee's guard reads `undefined` (the **WF-34** class — sweep ALL WF-50/WF-51/sub-workflow callers) | §1.4 finding 2 |
| T8 | **HTTP anti-patterns + sibling parity** | raw-string `jsonBody`; or a replicated HTTP node missing `retryOnFail`/`maxTries`/`onError`/`credentials` parity with its source pattern | build-workflow Step 5f.6 / technical-workflow-review |
| T9 | **queryReplacement comma-string** | a Postgres node passes queryReplacement as a single comma-joined string instead of an array | technical-workflow-review |
| T10 | **Unquoted camelCase SQL alias** | `SELECT col AS userId` (unquoted) silently lowercases → `$json.userId` undefined downstream | build-workflow Step 5b.4a |
| T11 | **Structural hygiene** | disabled nodes, orphaned nodes, typeVersion floor violations, position collisions, IF/executeWorkflow typeVersion mismatch | technical-workflow-review |

## 2.4 — Pseudo-convention checks (per `.pseudo`)
| ID | Check | Flag when… |
|----|-------|------------|
| P1 | **Structured `## Inputs` block** | Inputs are prose / vague ("…, etc.") rather than an enumerated required/optional + types + validity-rules block (discriminated-union variants enumerated) |
| P2 | **Explicit entry-guard line** | a strict-envelope utility's `.pseudo` declares no entry-guard |
| P3 | **Linear numbering / trigger-first** | embedded `(Branch A/B)` labels inside a linear sequence (WF-31), trigger-not-first numbering (WF-11), or lettered sub-steps used inconsistently |
| P4 | **Footer convention** | inconsistent `## Notes` vs bare `---` vs none; stray dated `History:` bullets |
| P5 | **Locked copy sync** | `.pseudo` carries draft "Dr. Chinmay" where live is locked to "Dr. Chinmay Mujumdar" (esp. WF-23) |

## 2.5 — Algorithm (how to run it inline, workflow-by-workflow)
1. Use the committed `docs/pseudocode/*.md` directly — verified content-fresh vs live on 2026-05-30 (§2.2). Only regenerate a workflow's `.md` if it was edited after that date.
2. For each workflow WF-XX (process one at a time; do **not** batch reasoning across workflows):
   a. Load §2.2 inputs.
   b. Run every applicable T1–T11 + P1–P5 check.
   c. For each violation, draft `{wf, check, severity, evidence (verbatim node/field), proposed-fix}`.
   d. **Ground-truth every HIGH against live** (dump the actual node from live JSON) before recording — same discipline that caught the WF-30/WF-34 issues. Mark each row `verified: live | evidence-only`.
   e. Append the rows to §2.6.
3. Cross-cutting passes (run once across the corpus, not per-WF): T7 across all WF-50/WF-51 callers; T1/T4 across all WF-25/WF-50/WF-51/WF-53/WF-60/WF-61/WF-62 callers via `dependency-map.md`.
4. **Reuse the methodology where it already mechanizes a check:** `n8n-whatsapp-methodology:technical-workflow-review` covers T2/T8/T9/T10/T11 mechanically — run it first and fold its tracker findings into §2.6 (marked as its source), so the inline reasoning only has to cover T1/T3/T4/T5/T6/T7 + P1–P5.
5. Do **not** record a fix as done until its `build-workflow` per-item verification passes.

## 2.6 — Observations (TO BE APPENDED by the inline sweep — currently empty)

> Filled in by plan-sprint / build-sprint, one workflow at a time, per §2.5. Until then this table is intentionally blank — there are **no trusted observations on these axes**.

| WF | Check (T#/P#) | Severity | Evidence (verbatim) | Proposed fix | Verified |
|----|---------------|----------|---------------------|--------------|----------|
| _(none yet — append below as the inline sweep runs)_ | | | | | |
