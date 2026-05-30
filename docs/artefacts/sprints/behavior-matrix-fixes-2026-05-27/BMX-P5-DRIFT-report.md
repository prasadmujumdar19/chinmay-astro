# BMX-P5-DRIFT — Drift + Data-Contract + Pseudo-Convention Audit

**Sprint:** behavior-matrix-fixes-2026-05-27 · Batch 10 (Phase 5 · Verify), item BMX-P5-DRIFT
**Generated:** 2026-05-30 (UTC)
**Status of repo:** READ-ONLY audit. No live workflow, `.md`, or `.pseudo` was modified.

---

> # ⚠️ REVISION — 2026-05-30 Opus re-audit (READ THIS FIRST)
>
> **The original Batch-10 audit below (PARTS A–E, run by 11 Sonnet sub-agents) contained a material reading error and an incomplete fix scope.** During Batch-11 execution prep, the user caught that PART E line ~140 declared **WF-30 "✅ correct"** — but live WF-30 plainly passes the wrong key (`messageText`) to WF-25, identical to WF-43/WF-31. A "live-verified" line that misreads live cannot anchor seven batches of fixes, so the entire 31-workflow drift sweep was **re-run from scratch with Opus** (user-directed).
>
> **What the re-run changed — see the authoritative [PART F](#part-f--opus-re-audit-2026-05-30--authoritative) below:**
> - **WF-30 is a CONFIRMED bug** (was falsely cleared). The `messageText`→`messageContent` mis-key is on **three** callers: WF-30, WF-31, WF-43.
> - The mis-key is **bigger than one field**: each of WF-30/31/43 also mis-reads **`userId`** (should be `user.id`) and **`userStatus`** (should be `user.status`) — three broken fields per caller, not one. The original report had the envelope truth (PART E line 138: "NO `messageText`/`userId`/`userStatus`") but never connected it to the handler reads.
> - **NEW bug the original missed entirely — WF-34** (Payment Rejection Processor): `Prepare Rejection Message` double-nests its payload (`{json:{json:{…}}}`) into an empty-passthrough `Call WF-50` → the rejection WhatsApp message to the user is **broken**.
> - **WF-33 `status='verified'` vs pseudo `'approved'`** is a **pseudo-lag** (live `'verified'` is canonical, used in 4 places) → fix the pseudo, not live.
>
> **Scope caveat (do not misread the new CLEAN verdicts):** the Opus re-run was scoped to **pseudo-vs-md drift (D1–D9) + caller-contract cross-check only**, and deliberately **excluded tech-mechanism findings** (`onError`, `alwaysOutputData`, re-SELECT, retries) per the pseudo-vs-tech separation rule. So a PART-F "CLEAN" means *no drift + no caller-contract break* — it does **NOT** invalidate the MED/LOW **code-quality** findings in PARTS A/B (WF-45 re-SELECT, WF-53 `context.source` guard, WF-61 onError-swallow, etc.). Those remain valid on a separate axis (the sprint's MED/LOW batches).
>
> **Evidence persisted:** raw structured Opus findings → `BMX-P5-DRIFT-opus-reaudit-findings.json`; full agent output → `BMX-P5-DRIFT-opus-reaudit-raw-output.json` (same folder). **`.md` fidelity proven:** 431/431 nodes + 431/431 parameter blobs reproduced verbatim from live, all connection edges match, 0 disabled nodes — so no finding is an artifact of a lossy `.md`. **Recommendation:** the committed `docs/pseudocode/*.md` may be stale vs live; run `generate-workflow-md` + commit at a convenient point.

## Method (per goal guidance)
- **Fresh `.md`:** all 31 live workflow JSON downloaded fresh from live n8n today → `generate-workflow-md.py` → 31 fresh `.md` (scratch `fresh-md/`). No pre-existing `.md` used.
- **Fresh `.pseudo`:** shallow-cloned from GitHub `main` → 31 `.pseudo` (scratch `git-fresh/docs/pseudocode/`). No working-dir `.pseudo` used.
- **Comparison:** fresh `.md` (AS-IS live truth) vs fresh `.pseudo` (design), plus data-contract compliance vs the consolidated `contract-reference.md` (last-sprint §2.1–2.8 + this-sprint U1/U2/U3/WF-25).
- **Execution:** 11 read-only Sonnet sub-agents in parallel (background, monitored, all completed within the 300s cap; slowest 219s).
- **Coverage:** 31/31 workflows. `.md`↔`.pseudo` are 1:1 (no orphans).

> **Verification caveat.** Sub-agents reasoned from the `.md` projection of live JSON. A subset of findings about **n8n `executeWorkflow` empty-`defineBelow` passthrough semantics** cannot be confirmed as bugs from the `.md` alone and are tagged **[VERIFY-LIVE]** — they require a live execution check before any remediation. They are reported as candidates, not confirmed defects.

---

# PART A — SPRINT-GROUP (17 workflows touched this sprint)

WF-01, WF-02, WF-20, WF-21, WF-23, WF-25, WF-26, WF-30, WF-31, WF-40, WF-43, WF-44, WF-45, WF-46, WF-53, WF-61, WF-62

## A.1 — Drift & data-contract findings (by severity)

### HIGH
- **WF-43 — wrong field key to WF-25.** `Call WF-25 Intent Classifier` passes key `messageText` (`={{ $json.messageText }}`), but the WF-01 envelope carries `messageContent`, not `messageText`. Pseudo Step 8 specifies `messageContent`. Effect (if real): WF-25 receives empty/undefined text for **all free-form messages in `consultation_closed`**, silently defeating the classifier on that path. **[VERIFY-LIVE]** (confirm whether WF-02 injects a `messageText` alias upstream of WF-43).
- **WF-25 — no entry-guard hard-fail despite being a strict-envelope utility.** `Prepare Intent Request` uses `||` fallbacks (`input.userStatus || input.user?.status || 'unknown'`) instead of an entry-guard Code node that throws on contract violation. contract-reference §B requires strict-envelope utilities to hard-fail. WF-25 silently degrades on missing `userStatus`, and the `input.user?.status` fallback **accepts an undeclared nested-`user` envelope shape** that neither the pseudo (flat 6-field) nor §C describes — a second, undocumented intake path.

### MED
- **WF-31 — over-broad pass-through filter.** `Is Pass-Through Intent?` excludes 4 buckets (garbage / malicious_abusive / inappropriate / stop_intent); pseudo Step 4 checks only `stop_intent` (WF-25 is contracted to terminate the other three internally). Redundant defensive filtering that diverges from the stated hub contract — harmless today but masks contract drift.
- **WF-45 — re-SELECT of core-envelope fields.** `Load User Record` re-SELECTs `id, name, phone_number, status` — all four are already in the WF-01 core envelope forwarded by callers WF-20/WF-43. Pseudo acknowledges the pattern ("inline SELECT keyed on phoneNumber") but doesn't justify not forwarding the envelope. `Prepare WF-50 Payload (Rebook Payment)` compounds it by reading name/phone from the re-queried row.
- **WF-53 — entry guard doesn't validate `context.source`.** contract-reference §C lists `source` as the one required field of `context`; the guard only checks `context` is a non-null object. A caller omitting `context.source` passes silently (and the alert text doesn't render it). Partial contract implementation.
- **WF-61 — WF-51 failure silently swallowed.** `Call WF-51 Block Alert` has `onError: continueRegularOutput`; on a Slack failure U2 still returns `blocked:true` with **no admin alert delivered**. Unspecified in pseudo. Also: entry guard coerces `messageContent` via `String()` without type-checking (accepts a number).
- **WF-43 — empty `defineBelow` mappings on sub-workflow calls.** `Route to Feedback WF-44`, `Route to Rebook WF-45`, and `Send Thank-You / Gemini Reply / Feedback Prompt via WF-50` + `Send Btn-Done Slack via WF-51` all use `mappingMode:defineBelow` with empty `value:{}`. If n8n does not passthrough the upstream payload, WF-50/WF-51 entry guards would hard-fail at runtime. **[VERIFY-LIVE]** (depends on executeWorkflow v1 empty-defineBelow semantics; note WF-44 maps its WF-50 fields explicitly — inconsistent with WF-43).
- **WF-62 — `consultChannelId:null` to WF-53 on error path.** Relies on WF-53's guard accepting null for the optional field (not verified in scope).

### LOW (selected)
- **WF-01** — `pendingUser.id` always null at runtime (Status Lookup SQL omits `p.id`) though §2.1 declares `pendingUser:{id, contact_name}`; envelope carries extra documented passthrough fields (`rawMessage`, `messageId`, `metadata`, `phoneNumberFormatted`, `isNewUser`, …).
- **WF-02** — stale sticky-note still lists removed `NEW_USER → WF-21` route (inert); `Non-Text Blocked?` true-output (blocked) is unconnected (silent end vs pseudo's explicit "End").
- **WF-20** — HELP `else` fallback collapses pseudo Step 5's two defensive arms (null-status → onboarding "Fill Details" message; else → generic menu) into one generic-menu ternary; a null-status user gets the menu, not onboarding re-entry. Trigger `v1` (empty params) vs WF-01/02 `v1.1` (`inputSource:passthrough`).
- **WF-21** — `Build U1 Payload (Service)` omits `consultChannelId` key (pseudo Step 9 passes `null`; optional in §C, so tolerated). `Opt-Out/Rebook Alias?` uses `rightValue:={{ true }}` vs WF-23's canonical `operator:"true"`.
- **WF-23** — clarifier/redirect/help copy uses "Dr. Chinmay **Mujumdar**" (formal) vs pseudo's draft "Dr. Chinmay" (pseudo Notes flag copy as DRAFT — live is the more formal/locked form).
- **WF-26** — over-emits undeclared `isNewUser` into the WF-02 re-route; no 0-affected-rows guard on the status UPDATE (pseudo Step 2 says halts); `Call WF-02` uses empty `value:{}` relying on trigger passthrough.
- **WF-30/WF-31** — most WF-50/WF-51 sends use empty `value:{}` passthrough while siblings map explicitly (intra-/inter-workflow inconsistency); `Call WF-25` uses `convertFieldsToString:true` in WF-31 vs `false` in WF-30.
- **WF-45** — error-handling asymmetry: 3 non-happy WF-50 calls set `continueRegularOutput`, happy-path `Send Payment Instructions` uses default `stopWorkflow`.
- **WF-53** — admin-alert built across 2 nodes (Code + passthrough Set) vs single pseudo step; both sub-calls `continueRegularOutput` (load-bearing for the always-halt, undocumented in pseudo).
- **WF-62** — Gemini retry (`maxTries:3`) not in pseudo; spreads `...input` downstream (only `geminiBody` sent over wire).

### Clean (no drift, contract-compliant)
- **WF-40** (relay) and **WF-44** (feedback recorder) — both fully match pseudo; explicit field mappings; no re-SELECT.
- **WF-46** — matches pseudo exactly; the hardcoded `blocked_reason='Blocked by admin'` is a **known/documented TD** in the pseudo (not new drift).

---

# PART B — EXISTING-GROUP (14 untouched workflows)

WF-00, WF-10, WF-11, WF-22, WF-32, WF-33, WF-34, WF-41, WF-42, WF-47, WF-50, WF-51, WF-52, WF-60

> These were **not** touched this sprint. Findings here are pre-existing drift surfaced by the audit — useful input for a future cleanup sprint, not BMX scope.

## B.1 — Drift & data-contract findings (by severity)

### HIGH
- **WF-33 — payment status value mismatch.** `Update Payment Status` writes `status='verified'`; pseudo Step 3 specifies `status='approved'`. Live and design disagree on the persisted enum value. Any consumer querying `status='approved'` would miss live rows. **Needs reconciliation decision** (is live `verified` correct and pseudo stale, or vice versa?). **[RECONCILE]**
- **WF-33 — admin Slack notification under-populated.** `Prepare WF-51 Payload` sends only name + phone + "consultation is now active"; pseudo Step 9 specifies a richer message incl. DOB/TOB/Place and the `CLOSE CHAT CONSULT <phone>` operator reminder. DOB/TOB/Place are out-of-core (correctly not re-SELECTed), so live can't render them without an envelope/SELECT change — design vs live output-contract drift.
- **WF-22 — `email_address` never extracted.** `Extract Form Data` does not parse `email_address` from `response_json`, yet `Create User Record` INSERT binds `$6 = $json.email_address` → inserts **NULL for every submission**, including Form-v2 payloads that include it. Pseudo Step 2 says it must be parsed.
- **WF-11 — `reason` non-empty not enforced for BLOCK.** `Validate Inputs` only checks `typeof reason==='string'`; contract-reference §A.2 + pseudo Step 1 require non-empty for `BLOCK`. An empty BLOCK reason passes the whole chain.

### MED
- **WF-11 — re-SELECT of envelope fields.** `Lookup Blocked User` SELECTs `phone_number, status` (and id/name) already present in the WF-10 command-envelope `user` object — redundant per the leaf no-re-SELECT rule. Also uses **string-interpolated SQL** (`'{{ $json.phoneNumber }}'`) rather than parameterized `$1` — an injection surface (admin-controlled input, but inconsistent with the parameterized pattern elsewhere).
- **WF-10 — intermediate key + SELECT drift.** `Build WF-41 Payload` uses key `messageText` where pseudo Step 23 names it `adminMessage` (end result still correct downstream); `Load User Status` SELECT includes `current_consultation_id`, wider than pseudo Step 17 (live ahead of pseudo — pseudo not updated).
- **WF-47 — admin Slack copy + empty mappings.** `Prepare WF-51 Payload (Opt-out Notice)` embeds the phone number inline in the notice; pseudo Step 4 copy has no phone. Both WF-51 and WF-50 calls use empty `defineBelow value:{}` (same passthrough question as WF-43). **[VERIFY-LIVE]** for the mapping; the copy divergence is confirmed.
- **WF-60 — `content` not validated.** Entry guard checks `transport/direction/messageType` but not `content`, which contract-reference §B lists as always-required (str|null). Caller omitting `content` passes the guard (resolved to null downstream). Pseudo's Inputs says "required" but its Algorithm Step 2 doesn't enforce it — internal pseudo inconsistency, live matches the weaker Algorithm.
- **WF-32 — RETURNING-row read of envelope fields.** `Prepare User Confirmation` reads `phone_number`/`name` from the `Update User Status` RETURNING row rather than the envelope. Pseudo itself specifies this (Step 7), so no live-vs-pseudo drift — but the **pseudo design** violates the envelope-first principle for those two fields.

### LOW (selected)
- **WF-00** — clean; the sticky-note "7 days" vs actual 3-day cleanup is documented in both pseudo and node note (known).
- **WF-11** — `admin_actions` INSERT on UNBLOCK is **known-deprecated** (`[[project_admin_actions_deprecated]]`, TD-NEW-026) — documented in pseudo, do not re-flag. Pseudo numbers `Validate` as Step 1 before the trigger as Step 2 (ordering oddity).
- **WF-42** — pseudo Summary says "2 buttons" but Algorithm + live render 3 — **internal pseudo stale-summary**, live is correct.
- **WF-34/WF-41** — clean; trust-mode (no guard) consistent; only out-of-core fetch is WF-34 `payment_id`. WF-41 carries a dated `History:` bullet (only pseudo that does).
- **WF-50** — drop-path WF-60 `content` uses real (possibly null) value vs pseudo's `'[empty_body_dropped]'` literal (`metadata.dropReason` consistent); removed-key guard only fires when `messageContent` falsy (narrow edge if both old+new keys sent).
- **WF-51** — `channelId` regex tightened to `^[CDG][A-Z0-9]{8,}$` vs §2.4 `+` — **explicitly accepted** in pseudo; Slack-failure→WF-60 logging gap is known **TD-NEW-028**.
- **WF-52** — `name` not checked for empty-string (only type); error field prefers `.error` over `.message`; internal comment "Step 5" vs pseudo Step 6 numbering.

### Clean
- **WF-00, WF-34, WF-41, WF-42** — no functional drift; contract-compliant.

---

# PART C — Cross-cutting pseudo-convention consistency (goal point 6)

Checked across all 31 `.pseudo` for uniform numbering, logic representation, data-contract declaration, headers, footers.

**Consistent across the board:**
- **Header:** every `.pseudo` uses a plain title line `WF-XX — <Name>` (no `#` markdown heading, no YAML frontmatter, no metadata block). Frontmatter lives only in the `.md`. ✅ uniform (31/31).
- **Branching idiom:** "go to Step N" prose used everywhere; no formal GOTO syntax. ✅
- **No tombstones:** no `Step N: (removed/reserved)` anywhere — linear numbering honored (`[[feedback_pseudo_linear_numbering]]`). ✅

**Inconsistent — worth a normalization pass:**
1. **Data-contract declaration format is not uniform** (3 styles):
   - **Dedicated `## Inputs` section + table** (Field|Type|Required|Used-by): WF-22, WF-47, WF-52, WF-60 — the most complete.
   - **Summary-prose `Inputs:` bullet** (most sprint-group: WF-01/02/20/21/23/26/30/31/40/43/44/45/46/53/61/62).
   - **`partial` (prose only, no entry-guard declaration where one is contractually required):** WF-25, WF-32, WF-33. WF-25 is the notable one — §C classifies it a strict-envelope callee but its pseudo declares no entry-guard.
   → Recommend a single canonical contract block (table form) for every workflow, and an explicit entry-guard line for all strict-envelope utilities.
2. **Numbering anomalies:**
   - **WF-31** embeds `(Branch A — …)` / `(Branch B — …)` section labels inside the linear Step 1..11 sequence (only sprint workflow that does).
   - **WF-11** numbers `Validate Inputs` as Step 1 and the trigger as Step 2 (trigger-not-first; every other pseudo starts at the trigger).
   - **WF-00 (8a), WF-10 (23a)** use lettered sub-steps; no other pseudo does.
3. **Footer style varies:** `## Notes` sub-section (WF-47/52/60/61/62 + sprint Deltas/Notes blocks) vs a bare `---` rule (WF-34/41/42) vs none (many). **WF-41** uniquely carries a dated `History:` changelog bullet. No project-wide footer convention.
4. **Copy-state convention:** sprint pre-form/handler copy is locked to "Dr. Chinmay Mujumdar"; several `.pseudo` still carry the older draft "Dr. Chinmay" (WF-23 esp.). Pseudo copy lags the locked live copy.

---

# PART D — Disposition guide

**Confirmed, in-scope-adjacent (sprint-group) — candidates to fix or log:**
- WF-43 `messageText`→WF-25 [HIGH, VERIFY-LIVE]; WF-43 empty defineBelow sends [MED, VERIFY-LIVE]; WF-25 missing entry-guard [HIGH]; WF-31 4-way filter [MED]; WF-26 isNewUser over-emit [LOW]; WF-45 re-SELECT [MED, pseudo-acknowledged]; WF-53 context.source guard [MED]; WF-61 onError-swallow + no type-check [MED].

**Confirmed (existing-group) — feed a future cleanup sprint, NOT BMX:**
- WF-33 `verified` vs `approved` [HIGH, RECONCILE]; WF-33 admin msg under-populated [HIGH]; WF-22 email_address never extracted [HIGH]; WF-11 BLOCK reason + re-SELECT + string-SQL [HIGH/MED]; WF-10 key/SELECT drift [MED]; WF-47 phone-in-copy + empty mappings [MED]; WF-60 content not validated [MED].

**Known / accepted — do NOT re-flag** (backed by pseudo notes or memory):
- WF-11 `admin_actions` INSERT (deprecated, TD-NEW-026, `[[project_admin_actions_deprecated]]`).
- WF-51 regex tightening (accepted in pseudo); WF-51→WF-60 Slack-fail logging gap (TD-NEW-028).
- WF-46 `blocked_reason` hardcode (documented TD in pseudo).
- WF-00 sticky-note "7 days" vs 3-day (documented in node + pseudo).
- WF-42 "2 buttons" / WF-60 content-required — pseudo-internal stale text, live correct.

**Pseudo-only normalization (point 6):** unify contract-declaration format + entry-guard lines; fix WF-31/WF-11 numbering anomalies; settle a footer convention; sync locked "Dr. Chinmay Mujumdar" copy into lagging `.pseudo`.

---

# PART E — Live verification verdicts (2026-05-30, tunnel open)

Verified the `[VERIFY-LIVE]` items against fresh live `.md` (WF-02 envelope construction + WF-25 input contract + handler `Call WF-25` mappings).

| Item | Verdict | Evidence |
|------|---------|----------|
| **WF-43 `messageText`→WF-25** | ✅ **CONFIRMED BUG (HIGH)** | WF-25 `Prepare Intent Request` destructures `input.messageContent`. WF-02 `Detect Route` returns `{...input, route}` — envelope has top-level `messageContent`, NO `messageText`/`userId`/`userStatus`. WF-43 `Call WF-25` maps `messageText:{{$json.messageText}}` (defineBelow, explicit) → WF-25 receives no `messageContent` → classifies `"undefined"`. |
| **WF-31 same defect** | ✅ **CONFIRMED BUG (HIGH) — newly found** | Identical `Call WF-25` mapping (`messageText:{{$json.messageText}}`). Audit had flagged only WF-31's 4-way filter; the mis-key is the more serious issue. payment_submitted free-form text misclassified. |
| ~~**WF-30 / WF-40** | ✅ correct~~ | ❌ **WRONG — CORRECTED IN PART F.** WF-40 is correct (`messageContent`, `user.id`, `user.status`). **WF-30 is a CONFIRMED BUG** — it maps `messageText`/`userId`/`userStatus` exactly like WF-43/WF-31. This row was the material reading error that triggered the Opus re-audit. |
| **Empty `defineBelow value:{}` mappings** (WF-43/WF-47/WF-26 sends) | ❌ **FALSE POSITIVE** | WF-02's own `Call WF-30`/`Call WF-31` use empty `defineBelow value:{}` and are live/working → empty mapping passes the parent item through (executeWorkflow v1.2 + passthrough triggers). Not a bug; standard passthrough. |
| **WF-25 missing entry-guard** | ✅ confirmed (structural) | `Prepare Intent Request` uses `input.userStatus || input.user?.status || 'unknown'` — no `throw`. Masks the mis-key above (degrades to `userStatus='unknown'` silently). |

**Net confirmed HIGH (sprint-group):** ~~WF-31 + WF-43~~ — **SUPERSEDED BY PART F.** The mis-key is on **WF-30 + WF-31 + WF-43** (three callers), and is **three broken fields each** (`messageText`→key `messageContent`; `userId`→`user.id`; `userStatus`→`user.status`), not one. The corrected fix spec and the additional WF-34 bug are in PART F. The WF-25 entry-guard gap remains the structural root cause worth addressing alongside.

**Severity downgrade:** the 4 MED "empty defineBelow" items in PART A/B are withdrawn (false positives) — this verdict still holds (Opus re-run independently confirmed empty-`defineBelow` passthrough is standard, not a bug).

## Note on the matrix exit gate (next item, BMX-P5-MATRIX)
This drift audit found **no blocker** to the structural design of the sprint-group rebuilds; the HIGH sprint-group items (WF-43 key, WF-25 guard) are worth resolving before the S8/relay matrix cells are re-walked, since they affect classifier/handler behavior on live paths. The existing-group HIGH items (WF-33, WF-22, WF-11) are pre-existing and out of BMX scope.

---

# PART F — OPUS RE-AUDIT (2026-05-30) — AUTHORITATIVE

This section supersedes PARTS A–E wherever they conflict. PARTS A–E are retained for the original Sonnet audit's broader code-quality sweep (which PART F intentionally did **not** re-litigate — see scope caveat in the revision banner).

## F.1 — Why this re-run happened
During Batch-11 prep, a live cross-check of WF-30's `Call WF-25` mapping contradicted PART E's "WF-30 ✅ correct" verdict. WF-30 live passes key `messageText` (undefined on the envelope), identical to the WF-43/WF-31 bug PART E *did* flag. Root cause of the miss: the Sonnet run (11 background sub-agents, 3 WF each) made a per-workflow reading error and reported a clean verdict with no structured per-category coverage to catch it. Decision: re-run the full 31-WF sweep with Opus.

## F.2 — Method (re-run)
- **Fresh data, source-of-truth:** 31 live workflow JSON re-exported from live n8n → `generate-workflow-md.py` → 31 fresh AS-IS `.md` (scratch). 31 `.pseudo` pulled from **GitHub `main`** (confirmed **0 divergence** vs working-dir copies).
- **`.md` fidelity proven before auditing** (directly answering "could the `.md` be dropping something live has?"): across 431 nodes — **431/431 node names present**, **431/431 `parameters` blobs reproduced verbatim** (character-for-character `json.dumps`), **all connection-edge counts match**, **0 disabled nodes**. The generator omits only `credentials` (not a drift category) and 5 node `notes` annotations — all 5 extracted and handed to the agents. Conclusion: no PART-F finding is an artifact of a lossy projection.
- **Fan-out:** dynamic Workflow, **11 Opus agents × ~3 workflows each**, applying the exact **D1–D9** taxonomy (same as Batch 10) with two added safeguards: (a) a **structured schema forcing a verdict on every category D1–D9 per workflow** (no silent skips — the proximate cause of the WF-30 miss); (b) an explicit **caller-contract cross-check** comparing every `executeWorkflow` call's emitted keys against the callee's pseudo Inputs contract (catches the mis-key class even when a workflow's own pseudo and md agree, both wrong together).
- **Cost:** 11 agents, ~812K subagent tokens, 202s wall-clock.

## F.3 — Status roll-up (31/31, drift + caller-contract axis only)
**22 CLEAN · 2 MINOR · 7 DRIFT.**

| Status | Workflows |
|--------|-----------|
| 🔴 DRIFT | WF-02, WF-22, WF-30, WF-31, WF-33, WF-34, WF-43 |
| ⚠️ MINOR | WF-01, WF-47 |
| ✅ CLEAN | WF-00, WF-10, WF-11, WF-20, WF-21, WF-23, WF-25, WF-26, WF-32, WF-40, WF-41, WF-42, WF-44, WF-45, WF-46, WF-50, WF-51, WF-52, WF-53, WF-60, WF-61, WF-62 |

> Reminder: CLEAN = no pseudo-vs-md drift + no caller-contract break. PARTS A/B MED/LOW **code-quality** findings on some of these CLEAN workflows (e.g. WF-45 re-SELECT, WF-53 `context.source`, WF-61 onError-swallow, WF-11 BLOCK-reason/string-SQL, WF-60 content guard) are a **separate axis** and still stand.

## F.4 — Authoritative findings

### 🔴 LIVE BUGS (functional — fix live)

**1. WF-25 caller mis-key — THREE callers, THREE broken fields each.** *(ground-truth confirmed against live by me)*
- **Callers:** WF-30 (`gGJBY5fJha0Let8I`, payment_pending), WF-31 (`HB8nXudAtk9iXz7C`, payment_submitted), WF-43 (`3va0M06kijgyLejf`, consultation_closed).
- **Callee:** WF-25 (`eTV1lUcYrXBg2q2T`) `Prepare Intent Request` destructures `input.messageContent` (no `messageText` fallback) and uses `userStatus`/`userId`.
- **The envelope truth (verified — WF-01 `Classify & Build Envelope`):** the WF-01 §2.1 canonical envelope (forwarded unchanged by WF-02) carries `phoneNumber`, `messageContent`, and `user.{id, name, status, slack_channel_id, …}`. It has **NO top-level `messageText`, `userId`, or `userStatus`.**
- **The break (identical in all three handlers):**
  - `messageText: ={{ $json.messageText }}` → undefined. **Fix:** drop key `messageText`, add `messageContent: ={{ $json.messageContent }}`.
  - `userId: ={{ $json.userId }}` → undefined. **Fix:** `userId: ={{ ($json.user || {}).id }}`.
  - `userStatus: ={{ $json.userStatus }}` → undefined. **Fix:** `userStatus: ={{ ($json.user || {}).status }}`.
  - (`phoneNumber`, `userName: ($json.user||{}).name`, `slackChannelId: ($json.user||{}).slack_channel_id` are already correct.)
- **Reference (correct) pattern = WF-40** (`du32QBZbSQOjfESe`, `Call WF-25`): `user.id`, `messageContent`, `user.status` — the working template to match.
- **Effect:** every free-form user message on the payment_pending / payment_submitted / consultation_closed paths reaches WF-25 with an empty message body and undefined user id/status → unreliable classification (garbage/general_enquiry fallback) on all three live existing-user text paths.
- **Shape for fixing:** identical 3-field fix across 3 workflows = a **Batch Surgical** pass. The within-batch ordering vs the WF-25 entry-guard still applies (fix all three callers → then add WF-25 hard-fail guard, so the new guard never sees a bad caller). Each handler's own `.pseudo` (Step 2/3/8) already specifies the correct contract → live drifted from its own design; `.pseudo` needs no change for the contract (it does for convention normalization, separately).

**2. WF-34 (`se82n3MUQ9xE5aEr`) — payment-rejection WhatsApp message broken (NEW; missed entirely by original).** *(ground-truth confirmed against live by me)*
- `Prepare Rejection Message` returns `[{ json: { json: { phoneNumber, messageType, interactivePayload } } }]` — **double-nested** under an extra `json` key. `Call WF-50` uses `mappingMode:defineBelow` with empty `value:{}` (passthrough). So WF-50 receives `$json = { json: {…} }` → its entry guard reads `$json.phoneNumber` = **undefined** → the rejection message to the user does not send correctly.
- **Fix:** remove the extra wrapper — return `[{ json: { phoneNumber, messageType, interactivePayload } }]` (single-nested, matching every other WF-50 caller).

**3. WF-22 (`dr8QM0m92Ml8MvIh`) — `email_address` always NULL.** *(strong evidence; corroborated by original PART B + sprint item BMX-P7-WF22)*
- `Extract Form Data` returns `{phoneNumber, full_name, date_of_birth, time_of_birth, place_of_birth, consent, flow_token, raw_form_data}` — no `email_address`. `Create User Record` UPSERT binds `$json.email_address` → NULL for every submission. **Fix:** parse `email_address` from the Flow `response_json` in `Extract Form Data`.

### 🔴 DRIFT requiring a DECISION (live vs design intent)

**4. WF-33 (`NcHZedq9ycnAQ9SW`) — admin Slack activation message under-populated.** Live posts a one-line "Payment approved… consultation is now active." Pseudo Step 9 specifies a richer notice incl. user DOB/TOB/Place and an explicit `CLOSE CHAT CONSULT <phone>` operator reminder. DOB/TOB/Place are out-of-core (would need an envelope/SELECT change to render). **Decision:** restore the richer admin notice (and accept the SELECT cost), or accept the one-liner and update the pseudo? *(This is the existing `BMX-P7-WF33` needs-decision item — these are its specifics.)*

### 🟡 PSEUDO-LAG (live is correct — fix the `.pseudo`, never live)

**5. WF-33 `status='verified'` vs pseudo `'approved'`.** *(ground-truth confirmed: live uses `'verified'` in 4 places; `pending_verification`→`verified` is the canonical payments lifecycle.)* Update WF-33.pseudo Step 3 to `'verified'`.
**6. WF-33 Inputs doc:** `Extract Command Data` reads `command`/`subCommand`; pseudo Inputs declares only `commandType`. Document the real WF-11 command payload contract in the pseudo.
**7. WF-01 (`hYGNM97sXvdo1WmI`) MINOR — D9/D8 Inputs shape:** pseudo Inputs is prose ending in "etc." with no required/optional/type enumeration; `Classify & Build Envelope` consumes `messageContentUpper`/`messageId`/`timestamp`/`metadata` not explicitly declared. Author a structured `## Inputs` block. (No runtime impact — all values arrive from WF-00.)

### ⚠️ COSMETIC / COPY

**8. WF-31** — under-review reassurance copy adds Markdown bold + blank lines not in pseudo Step 8 (cosmetic).
**9. WF-47 (MINOR)** — opt-out Slack notice adds a `(phone: <number>)` fragment not in the pseudo Step 4 locked copy.

## F.5 — Ground-truth confirmations performed (live, by main thread — not agent-only)
| Claim | How verified | Verdict |
|-------|--------------|---------|
| WF-01 envelope has no top-level `messageText`/`userId`/`userStatus` | Dumped `Classify & Build Envelope` jsCode from live WF-01 (`hYGNM97sXvdo1WmI`) | ✅ confirmed |
| WF-30/31/43 all read `$json.messageText`/`userId`/`userStatus` | Dumped all four callers' `Call WF-25` value maps side-by-side | ✅ confirmed (WF-40 = correct reference) |
| WF-30 has no upstream node aliasing `messageText` | Traced WF-30 connections + grepped for `messageText` emitters | ✅ confirmed (only the broken Call node references it) |
| WF-34 double-nested WF-50 payload | Dumped `Prepare Rejection Message` return + `Call WF-50` mappingMode/value from live | ✅ confirmed (`{json:{json:…}}` + empty passthrough) |
| WF-33 `verified` is canonical (not `approved`) | Counted `status='…'` literals across all 31 live JSON | ✅ confirmed (`verified` ×4, no `approved`) |
| `.md` projection is lossless for drift taxonomy | 431/431 node names + 431/431 param blobs verbatim + edges match + 0 disabled | ✅ confirmed |

## F.6 — Corrections to the original audit (for the record)
1. **WF-30 falsely cleared** (PART E) → confirmed bug.
2. **Mis-key scope understated** — original flagged 1 field (`messageText`) on 2 callers; reality is 3 fields on 3 callers.
3. **WF-34 rejection-message break** — not detected by the original at all.
4. Everything else in PARTS A–E that PART F marks CLEAN was either (a) a tech-mechanism/code-quality item PART F intentionally excluded (still valid, separate axis), or (b) genuinely clean on the drift axis.

## F.7 — Disposition for plan-sprint (the trustworthy fix list)
- **Live functional fixes (HIGH):** WF-25 caller mis-key Batch-Surgical across **WF-30 + WF-31 + WF-43** (3 fields each) → then WF-25 entry-guard; **WF-34** double-nest; **WF-22** email parse.
- **Decision needed:** WF-33 admin-notice richness (`BMX-P7-WF33`).
- **Pseudo-lag fixes (pseudo only):** WF-33 `verified` + command/subCommand Inputs; WF-01 Inputs shape.
- **Copy/cosmetic:** WF-31 copy, WF-47 copy.
- **Still valid from PARTS A/B (code-quality axis, NOT re-litigated here):** WF-45 re-SELECT, WF-53 `context.source` guard + conditional admin sentence, WF-61 onError-swallow + type-check, WF-11 BLOCK-reason + string-SQL + re-SELECT, WF-10 key/SELECT drift, WF-60 content guard, WF-32 RETURNING-read, plus the PART C pseudo-convention normalization.
