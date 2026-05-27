# Sprint: pre-go-live-final-follow-up-2026-05-26

**Created:** 2026-05-26T10:27:31Z
**Last updated:** 2026-05-26T12:50:00Z
**Source:** Comprehensive synthesis from every sprint-followup file, drift evaluation, data-contract follow-ups, and pre-go-live tracker docs, scoped to pre-MVP / go-live-impacting items only. Anything tracked in post-MVP files (`docs/sprint-tech-debt-2026-05-16-post-MVP.md`) is excluded.
**Sprint goal:** Land the last remaining items required for go-live, then gate-pass an end-to-end smoke test.

---

## Sprint Summary

| Tier | Items (active) | Effort |
|---|---|---|
| 🔴 P0 (1 split into 1a/1b) | TD-PGF-01a, TD-PGF-01b | ~1.5–3 hrs |
| 🟠 P1 (4) | TD-PGF-02, TD-PGF-03, TD-PGF-05 (promoted), TD-PGF-09 (promoted) | ~4.5–5.5 hrs |
| 🟢 P3 (2 in-sprint) | TD-PGF-07, TD-PGF-08 | ~50 min |
| 🟢 EXIT | TD-PGF-11 (2-phase smoke) | ~2.5–2.75 hrs |
| — | **Cumulative sprint work** | **~9–12 hrs** |
| | | |
| 🟣 OBSOLETE / SUBSUMED | TD-PGF-04 (verified clean), TD-PGF-06 (subsumed into TD-PGF-05) | 0 |
| 🟢 P3 deferred | TD-PGF-10 (bulk pseudo-cleanup → post-MVP) | 0 (+90 min incremental drift-check practice spread across other items) |

**Sprint exits when:** all P0/P1/P3 items above are landed + Phase A and Phase B of TD-PGF-11 smoke pass clean.

---

## Priority Key

| Level | Meaning |
|-------|---------|
| 🔴 P0 | Go-live blocker — explicitly user-flagged or directly breaks a journey step |
| 🟠 P1 | Real bug — verified live or near-certain; should fix before smoke test |
| 🟢 P3 | Cosmetic / low-impact; in-sprint decisions locked per item |
| 🟢 EXIT | Sprint exit gate — must pass before declaring go-live ready |
| 🟣 OBSOLETE | Verified clean live or superseded |
| 🟣 SUBSUMED | Same root-cause bug as a higher-priority item |

> Note: the original draft had a 🟡 P2 tier — after live audits, every P2 item was either closed (TD-PGF-04 obsolete-on-verify), subsumed (TD-PGF-06 collapses with TD-PGF-05), or promoted to P1 (TD-PGF-05). The 🟡 P2 tier is therefore empty for this sprint.

---

## 🔴 P0 — Go-live blocker

### TD-PGF-01a · WhatsApp Flow form input validation — Phase 1 (capability investigation)

**Source:** `docs/artefacts/sprints/inline-20260522-102910/followups.md` § "SP-11 smoke test: form input validation (MVP blocker)" (2026-05-23). Persisted as TD-NEW-030 in `docs/Tech_Debts.md`. User direction at logging time: *"Crucial-to-fix-before-release per user. Do NOT ship MVP without addressing."*

**Functional significance:** The onboarding Flow form (Meta Flow ID `1408011897720771`, CTA "Fill Details") is the single point at which the four key birth-detail fields enter the system. Garbage flows straight into `users.time_of_birth` / `users.place_of_birth`, both consumed by Vedic chart generation. Without validation, Chinmay receives consultation requests with un-usable inputs and has to re-prompt manually — defeating the entire form-driven onboarding promise.

**Scope expansion 2026-05-26T12:15Z:** form must also collect a **mandatory email address** (per user direction — Dr. Chinmay needs email to send birth chart PDF / written report outside WhatsApp). Phase 1 must investigate email-format validation feasibility too. Schema gap confirmed live: `chinmay_astro.users` has no `email_address` column today (verified via information_schema query 2026-05-26).

**Phase 1 scope (this item):** Read Meta WhatsApp Flow Builder docs + inspect the current Flow JSON for capability discovery. Output: a short decisions block locking Option A (Flow-native) vs Option C (n8n WF-22 guard) per field. **No code change in Phase 1.**

**Investigation checklist:**
1. Does Meta's WA Flow Builder ship a `TimePicker` component analogous to the existing `DatePicker`?
2. Does Meta support field-level text validation primitives (regex, minLength, maxLength, format) on string inputs?
3. Does Meta's Flow Builder support **email-format validation** on a text input (e.g., `format: "email"`)?
4. What does the current Flow JSON for Flow `1408011897720771` actually contain? (Export from Meta or n8n if cached.)
5. Sample-check the last ~20 `pending_users.contact_name` and `users.place_of_birth` rows for real user-input shape — informs the place-pattern regex choice if Option C is used.

**Effort estimate:** 45–75 min.

---

### TD-PGF-01b · WhatsApp Flow form input validation — Phase 2 (build)

**Depends on:** TD-PGF-01a (hard).

**Scope:** Apply the chosen path per field. Targets:
- **Time-of-Birth:** Option A (Meta time-picker) if available → else Option C (HH:MM regex guard in WF-22).
- **Place-of-Birth:** Option B (Meta text validation) if available → else Option C (n8n guard). Strict rule preferred (min 4 chars + space/two-token); see caveat in Discussion Log.
- **Email Address (NEW):** Option B if available → else Option C (RFC5322-ish regex in WF-22). Mandatory field.
- **Schema:** `ALTER TABLE chinmay_astro.users ADD COLUMN email_address text;` — confirmed needed via live information_schema check 2026-05-26.

**Option matrix:**

| Option | Where it lives | Pros | Cons |
|---|---|---|---|
| **A — Meta time-picker** | Flow JSON only | Cleanest, real-time field UX. Zero n8n change. | Only viable if Meta ships TimePicker. |
| **B — Meta text validation** | Flow JSON only | Same as A for place/email. | Only viable if Meta supports regex/minLength/format. |
| **C — n8n guard in WF-22** | New Code/IF node between form webhook and `users` INSERT | Works regardless of Meta capability. | User submits form, *then* gets re-prompted — UX friction on the most important journey step. |

**Effort estimate:** A or B → ~30 min Flow JSON edit + smoke. C → ~60–90 min per field (WF-22 structural, `build-workflow` Skill). Schema ALTER → ~5 min. Worst case (all-C) ~3+ hrs.

---

## 🟠 P1 — Real bugs, fix before smoke

### TD-PGF-02 · WF-00 `nfm_reply` parse path missing switch case

**Source:** `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md` TD-DRIFT-001 (originally drift-check WF-00 finding). **Verified still open 2026-05-26T10:25Z** — fetched WF-00 (`JQu1MkK5vgtUCeNO`) `Parse WhatsApp Message` node.

**Functional significance:** When a user submits the onboarding Flow form, Meta delivers `messageType: 'interactive'` with a nested `interactive.nfm_reply` sub-object containing the cleartext payload. WF-00's `case 'interactive':` *is* hit, but neither inner `if (button_reply)` nor `else if (list_reply)` matches → `messageContent` stays as the initialized empty string `''`. The onboarding flow itself works (WF-22 reads `rawMessage` directly); this is a logging-fidelity bug — `messages.content` is logged blank for every form submission.

**Fix shape (locked):** Add a third inner branch inside the existing `case 'interactive':` (NOT a new top-level case, despite TD-DRIFT-001's misleading description):
```js
else if (message.interactive.nfm_reply) {
  messageContent = message.interactive.nfm_reply.response_json;
  // interactiveLabel stays null — matches pseudo Step 2
}
```

**Value choice:** Option B locked (raw `response_json`) with Phase-1-confirm step — submit one form, inspect webhook payload, confirm `response_json` is a string. Option A (`JSON.stringify(...)`) is the fallback if Meta has changed the field shape. Full diff in Discussion Log.

**Pseudo edit:** None. WF-00.pseudo Step 2 already documents the intent.

**Effort estimate:** ~15 min (1-line MCP patchNodeField + form submission + DB verify).

---

### TD-PGF-03 · WF-11 internal Slack-payload builders emit legacy `message:` key (3 hits)

**Source:** `docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/followups.md` § "Post-Wave-2 cross-workflow scan".

**Functional significance:** Three jsCode return blocks inside WF-11 (Command Parser) build internal Slack-direction payloads with shape `{ channelName, message: <text> }`. User confirmed via UI inspection — all 3 feed WF-51, which expects canonical `{ channelId, messageText }` per design.md §2.4. If WF-51's tightened entry-guard catches the missing `messageText`, the admin command appears to silently do nothing.

**Three producer Code nodes located in live WF-11 (`GoTYo0GS2y8qjjkw`):**
1. **`Format List`** — 2 return paths; both emit `{ channelName, message }`. Consumed by `Send List To Admin`.
2. **`Format Stats`** — emits `{ channelName, message }`. Consumed by `Send Stats To Admin`.
3. **`Prepare HELP Text`** — emits `{ channelName, message: helpText }`. Consumed by `Send Help To Admin`.

**Fix:** Rewrite each producer to emit canonical `{ channelId, messageText }`. Paired consumer-mapping update on each `Send … To Admin` executeWorkflow node if its `messageText` value reads `$json.message`. Single batched PUT.

**Effort estimate:** ~30 min total (15 min audit + 15 min batch fix + verify).

---

### TD-PGF-05 · Drift items audit + remediate unclosed items — **🟠 PROMOTED FROM P2** (2026-05-26T11:35Z)

**Source:** `pseudo-md-drift-fixes-2026-05-24/tasks.md` items TD-DRIFT-009/012/013/015/026. Live audit ran this session (2026-05-26T11:35Z) — 4 of 5 items unclosed.

**Audit verdict:**

| Drift item | Status |
|---|---|
| TD-DRIFT-009 | **UNCLOSED** — WF-23, WF-30, WF-44 send `messageText` to WF-25 (undefined). |
| TD-DRIFT-012 | **CLOSED** — zero WF-50 callers use legacy keys. |
| TD-DRIFT-013 | **UNCLOSED** — WF-50 `Prepare Payload` fallback chain still lenient (safe to tighten now -012 clean). |
| TD-DRIFT-015 | **UNCLOSED** — WF-32 `Prepare Reassurance Message` reads `user.phone_number` (cosmetic Canon-A drift). |
| TD-DRIFT-026 | **UNCLOSED** — WF-44 `Call WF-25` `userId/userStatus` flat-read latent bugs (collapsed with -009 fix). |

**Critical systemic finding:** TD-DRIFT-009 + TD-DRIFT-026 + (the original TD-PGF-06 item) all describe the **same bug** on WF-23/30/44. Three WF-25 callers expecting flat envelope fields (`$json.userId`, `$json.userStatus`, `$json.messageText`) that don't exist — the WF-01 envelope provides `$json.user.id`, `$json.user.status`, `$json.messageContent` (nested + canonical). **WF-25 silently receives `undefined` for THREE critical fields on every free-form text in pre-form (WF-23), payment-pending (WF-30), and feedback (WF-44) states.** Intent classification is degraded across all three flows.

**Concrete fix surface (5 live edits in 5 workflows + paired pseudos):**
- WF-23 (`VpCER0Vqq3NYJGpI`) `Call WF-25 Intent Classifier` — rewrite `workflowInputs.value` per consolidated recipe.
- WF-30 (`gGJBY5fJha0Let8I`) `Call WF-25 Intent Classifier` — same.
- WF-44 (`Du2CJ3OTohRFZYoA`) `Call WF-25 Intent Classifier` — same.
- WF-50 (`BUVun38WEKb12zg9`) `Prepare Payload` — tighten fallback chain to require canonical `messageContent`.
- WF-32 (`emUOLWVZiNVxcOe3`) `Prepare Reassurance Message` — top-level `phoneNumber` read.

Plus paired `.pseudo` updates on WF-23 / WF-30 / WF-44 / WF-50 / WF-32 Inputs/Steps. Full per-fix diffs in Discussion Log.

**Effort estimate:** ~75 min total.

---

### TD-PGF-09 · WF-25 Gemini-failure graceful UX — explicit halt + user-and-admin notification — **🟠 PROMOTED FROM P3** (2026-05-26T12:10Z)

**Source:** `smoke-post-p0-review-tc04xx-2026-05-18/followups.md` § "During BUG-04" + `docs/Tech_Debts.md` TD-029. Reframed by user direction from monitor-only to a graceful-failure UX build.

**Functional significance:** Today, when WF-25's Gemini call exhausts its retry budget (3 × 10s = 30s), the `Handle Gemini Error` branch silently falls back to a degraded intent (`feedback_intent` / `general_enquiry`). User has no visibility that something went wrong; admin has no visibility either. If the failure was on our side, no opportunity to compensate the user.

**Decision (user, 2026-05-26):** **Shape 2 — execution halts on Gemini failure.** User receives apology; admin gets dual-channel alert (consult channel + admin-commands log) with diagnostic context. Admin intervenes — re-prompt the user, or offer free consultation as goodwill.

**Scope:**
- **WF-25** error branch: replace `Handle Gemini Error` with fan-out — `Send Apology via WF-50` + `Send Alert (consult) via WF-51` + `Send Alert (admin-log) via WF-51` + return sentinel `{intentResult: 'classifier_error'}`.
- **5 caller workflows** (WF-23, WF-30, WF-31, WF-43, WF-44) — add `Is Classifier Error?` IF immediately after `Call WF-25`. TRUE → terminate. FALSE → existing routing chain.
- Pseudo updates: WF-25 + WF-23/30/31/43/44.

Full recipe + locked copy in Discussion Log.

**Effort estimate:** ~2.5 hrs total (WF-25 build + 5 caller IFs + pseudo updates + verify).

---

## 🟡 P2 — (empty after audit; see Priority Key note above)

---

## 🟢 P3 — Cosmetic / in-sprint per locked decisions

### TD-PGF-07 · WF-10 `Build WF-41 Payload` emits intermediate legacy `adminMessage` field

**Source:** `2026-05-24-data-contract-discipline-phase-1/followups.md` § "Post-Wave-2 cross-workflow".

**Functional significance:** Internal Set node `Build WF-41 Payload` outputs `adminMessage`; downstream Code node `Build WF-10 Relay Envelope` maps it to canonical `messageText` in the envelope sent to WF-41. External contract is correct (canonical `messageText`); only the internal intermediate field is legacy-named. **Zero runtime impact** — cosmetic.

**Decision (locked):** **In-sprint.** Bundle with the contract-cleanup pass alongside TD-PGF-05 to avoid the "tiny cleanup that lingers forever" anti-pattern.

**Fix (two paired edits in WF-10 = `wMh0oBRtJbvhLgOf`):**
1. `Build WF-41 Payload` Set node: rename output field `adminMessage` → `messageText`.
2. `Build WF-10 Relay Envelope` Code node: change read `inp.adminMessage` → `inp.messageText`.

**Effort estimate:** 5 min.

---

### TD-PGF-08 · WF-45 local `Load User Record` SELECT — completes envelope-everywhere pattern

**Source:** `2026-05-24-data-contract-discipline-phase-1/followups.md` § "Post-Wave-2 cross-workflow" (originally tagged `revisit-next-envelope-sprint`). Live audit 2026-05-26 confirmed WF-45 is the **lone remaining redundant user-data SELECT** in the corpus.

**Functional significance:** WF-45 (Rebook Handler) has its own local `Load User Record` Postgres SELECT, feeding `Prepare WF-50 Payload (Rebook Payment)`. Works correctly today — pure architectural cleanup. WF-01 envelope already carries `user.{phone_number, name}`; the local SELECT is redundant.

**Decision (locked):** **In-sprint.** Live audit confirmed WF-45 is the only holdout (WF-01/WF-10 are envelope BUILDERS; WF-34 was already rescoped in phase-1). Closing this makes envelope-everywhere universal — no "next envelope sprint" needs to exist afterward. The prior `revisit-next-envelope-sprint` tag is superseded.

**Fix (WF-45 = `MUG7rPgSHc7UtAE9`):**
1. Rewrite all `$('Load User Record').item.json.X` reads in downstream nodes to `$('When Executed by Another Workflow').item.json.user.X` (or top-level `phoneNumber` per Canon A).
2. Remove `Load User Record` Postgres node + connections.
3. Rewire trigger → next downstream directly.
4. Update WF-45.pseudo to remove the SELECT step.

**Effort estimate:** ~35–45 min.

---

### TD-PGF-10 · Pseudo doc-hygiene bundle — **DEFERRED to post-MVP with in-sprint incremental practice**

**Source:** `pseudo-md-drift-fixes-2026-05-24/tasks.md` — 23 pseudo-only items (TD-DRIFT-002/003/004/005/008/010/011/014/016/018/019/020/021/022/023/024/025/027/028/029/030/031/032).

**Decision (locked):** **Bulk cleanup deferred to a dedicated post-go-live sprint** that fires AFTER full functional testing. Now tracked in `docs/sprint-tech-debt-2026-05-16-post-MVP.md` as **TD-NEW-034**.

**In-sprint incremental practice (added to sprint execution discipline):**
For every workflow this sprint touches, the executor runs a quick `.pseudo`-vs-live drift comparison BEFORE the live edit. Trivial drift (single-line typing / phrasing) folds into the same sprint item (~5 min extra); structural drift defers to TD-NEW-034 with the item logged into that future sprint's input list. Each sprint item's notes get a `drift_check:` field with values `clean | trivial-folded | structural-deferred`.

**In-scope workflows for incremental drift-check (anticipated):**
WF-00, WF-10, WF-11, WF-22 (conditional on Option C path), WF-23, WF-25, WF-30, WF-31, WF-32, WF-43, WF-44, WF-45, WF-50.

**Effort:** ~90 min total spread across other items' execution. Not its own line item.

---

## 🟣 OBSOLETE / SUBSUMED

### TD-PGF-04 · WF-60 `messages.content` literal double-quote wrap (DB check) — 🟣 OBSOLETE (verified clean 2026-05-26T11:20Z)

Live verification this session confirmed: (1) the quote-wrap bug was cleaned up in WF-60's `Log to Messages Table` queryReplacement in a prior session — current code passes `$json.content` plain. (2) The empty `messages` table is explained by `ON DELETE CASCADE` from user-deletion clean-slate wipes, not a logging bug. Full investigation in Discussion Log. No work item.

---

### TD-PGF-06 · WF-23 / WF-30 / WF-44 caller-side userStatus mapping verify — 🟣 SUBSUMED into TD-PGF-05 (2026-05-26T11:35Z)

Live audit confirmed this finding is the same root-cause systemic bug as TD-DRIFT-009 + TD-DRIFT-026. Consolidated fix lives under TD-PGF-05. `plan-sprint` should treat TD-PGF-06 as obsolete-subsumed.

---

## 🟢 EXIT — Sprint exit gate

### TD-PGF-11 · Fresh end-to-end smoke test (go-live gate) — two-phase

**Source:** Last full smoke was `smoke-pre-golive-2026-05-24-wrap`. Since then: data-contract phase-1 Wave 2 + `data-contract-sprint-bug-fix` + `pre-golive-gap-decisions-2026-05-26` + this sprint. Cumulative surface change is large; the 2026-05-24 smoke is no longer authoritative.

**Phase A — Happy-path journeys (~60 min):**
- J-01 onboarding: submit form → expect email field present, time/place validation fires (per TD-PGF-01b path), `users` row created with `email_address`, `messages.content` row contains form payload (verifies TD-PGF-02 nfm_reply fix), Slack channel created.
- J-04 payment_pending free-form text — intent classification works end-to-end (verifies TD-PGF-05 WF-30 caller fix).
- J-04 STOP keyword — opt-out path.
- J-06 payment_submitted duplicate "Payment Completed" tap — reassurance message lands (verifies TD-PGF-05 WF-32 cosmetic).
- J-08 admin APPROVE PAYMENT — payments INSERT + status flip + WF-51 admin confirmation (verifies TD-PGF-03 LIST/STATS not broken by sibling-touching).
- J-10 consultation_active bidirectional relay (verifies TD-PGF-07 WF-10 adminMessage rename round-trip).
- J-11 close + post-consult buttons (REBOOK / Feedback / btn_done from GAP-2).
- J-13 REBOOK channel reuse — welcome-back lands (verifies TD-PGF-08 WF-45 envelope adoption).
- J-19 opted-out re-engagement (WF-26 sub-workflow).
- Admin HELP / LIST USERS / STATS in admin-commands (verifies TD-PGF-03 producer-fix round-trip).

**Phase B — Failure-path mini-smokes (~45 min):**
- **TD-PGF-09 forced-failure (Gemini halt):**
  - **Setup:** Clone WF-25 to `WF-25-test` with Gemini HTTP URL → unreachable host (`https://127.0.0.1:9999/test-fail`); `retryOnFail` disabled. Switch 5 caller workflows (WF-23/30/31/43/44) to call `WF-25-test`.
  - **Test:** Send one free-form text from each caller state. Expect per state: user receives apology, user's consult channel receives admin alert, `chinmay-admin-commands` receives admin alert, no degraded-classification response.
  - **Cleanup:** Switch the 5 callers back to production WF-25 (`eTV1lUcYrXBg2q2T`); disable + archive `WF-25-test`.
- Garbage / abuse classification (WF-25 → WF-46 block path) via REAL WF-25.
- STOP keyword from payment_submitted user — verify WF-47 atomicity (consult closed before user opt-out write).
- Cross-channel admin command — user-targeted command in wrong channel → DR-13 polite reject fires.

**Gate:** No P0 / P1 / in-sprint P3 item is marked done until its corresponding sprint-delta verification in Phase A or B passes.

**Pre-requisites:** All P0 + P1 + in-sprint P3 items landed and individually verified.

**Effort estimate:** ~90–120 min Phase A + ~45 min Phase B = **~2–2.75 hrs total**.

**Skill:** `n8n-whatsapp-methodology:smoke-test`. Use `monitor-test-run` for live observation if available.

---

## Items intentionally excluded from this sprint

Captured for traceability — `plan-sprint` will NOT pick these up.

| Item | Why excluded |
|---|---|
| All items in `docs/sprint-tech-debt-2026-05-16-post-MVP.md` | User directive: post-MVP scope. |
| STATUS-TD-01/02/05 (VPS hardening, DB backups, encryption-svc monitoring) | Explicitly deferred to dedicated infra sprint post-go-live. |
| TD-NEW-001 (GitHub PAT rotation) | User-deferred 2026-05-14; outside codebase. |
| `gemini-2.5-flash-lite` 503 model fallback to 2.0 | 2.0 deprecated; original suggestion no longer viable (subsumed by TD-PGF-09 graceful-failure UX). |
| WF-11 STATS day-boundary (UTC vs IST 00:00–05:30 window) | Explicitly accepted-as-is 2026-05-18 ([[project_wf11_stats_day_boundary_accepted]]); do NOT re-flag. |
| Configurable support email (`chinmay_astro@gmail.com` literal) | Pre-go-live-gap sprint decision 2026-05-26: accepted-as-is for MVP. |
| Docker image digest pin (`GAP-10-IMAGE-PIN`) | Marked obsolete in pre-go-live-gap sprint; deferred to post-MVP infra sprint. |
| Error-handling sprint items (TD-029 was promoted into TD-PGF-09; TD-033, TD-NEW-028, TD-NEW-029 remain) | Scheduled as a single post-MVP error-handling sprint. |
| Gemini answer style determinism (post-GAP-3C long-tail) | Post-MVP per pre-go-live-gap sprint followup. |
| `admin_actions` table removal (TD-NEW-026) | Post-MVP per [[project_admin_actions_deprecated]]. |
| Centralize Gemini answer into WF-27 Responder | Post-MVP per GAP-3C followup; YAGNI until traffic data. |
| Admin → User "hotline" relay outside `consultation_active` (captured 2026-05-26) | Now tracked in post-MVP file as **TD-NEW-033**. Not a go-live blocker. |
| Pseudo doc-hygiene bulk (23 items) | Now tracked in post-MVP file as **TD-NEW-034**. Incremental drift-check practice runs in this sprint (TD-PGF-10). |

---

## Discussion Log

Each item was walked through with the user; decisions, locked text, and execution recipes captured below. This log is the historical record — the item bodies above reflect the post-decision state.

### TD-PGF-01a / TD-PGF-01b — decisions locked 2026-05-26T10:35Z

**Approach:** Phase 1 (investigation) → Phase 2 (build). Investigation must determine Meta WhatsApp Flow Builder support for (a) time-picker component, (b) field-level text validation (regex / minLength / maxLength), and (c) email-format validation.

**Time-of-Birth strategy:**
- Preference order: Option A (Meta time-picker) → Option C (HH:MM regex guard in WF-22) if A unavailable.
- Acceptable formats if Option C is used: `HH:MM` (24-hr) or `HH:MM AM/PM`. Reject anything else.

**Place-of-Birth strategy (locked-with-caveat):**
- User direction: **strict** — require minimum 4 characters AND (at least one space OR two recognisable place tokens).
- **Caveat flagged at decision time:** This rule rejects common single-word Indian city names (`Pune` 4 chars no space, `Goa` 3 chars, `Indore`, `Nashik`, `Solapur`). Effectively requires users to type "City, Country" or "City, State". Decision deliberately preserved; revisit at Phase 1 lock-down once Meta capability is known. If Meta supports field-level regex, the user is shown the exact pattern before it goes live; if Option C is chosen, the re-prompt copy must clearly tell the user what format to use.
- Alternative surfaced: whitelist-known-Indian-city-tokens fallback may emerge from Phase 1 review of `pending_users` + `users.place_of_birth` historical values.

**Email-address strategy (added to scope 2026-05-26T12:15Z):**
- Mandatory field. RFC5322-ish validation (`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` as a starting point).
- Preference: Option B (Meta `format: "email"`) → Option C (n8n regex guard).
- Schema gap confirmed live (2026-05-26): `chinmay_astro.users` has no `email_address` column. `ALTER TABLE chinmay_astro.users ADD COLUMN email_address text;` scoped into Phase 2.

**Outstanding question for Phase 1:** review last ~20 `pending_users.contact_name` + `users.place_of_birth` rows for shape patterns before locking the place regex.

---

### TD-PGF-02 — decisions locked 2026-05-26T10:55Z

**Pseudo gap check:** WF-00.pseudo Step 2 already documents the intended behaviour verbatim: *"for interactive: button_reply.id / list_reply.id / nfm_reply.response_json (cleartext form payload — Flow is in send-only mode, no encryption-svc needed)"*. **No pseudo edit required.**

**Drift-check description correction (important for plan-sprint):** TD-DRIFT-001 in `pseudo-md-drift-fixes-2026-05-24/tasks.md` describes the symptom as `messageContent = '[NFM_REPLY]'` via the `default:` branch. That description is wrong. Meta actually sends `messageType: 'interactive'` with a nested `interactive.nfm_reply` sub-object — `case 'interactive':` *is* hit, but neither inner `if (button_reply)` nor `else if (list_reply)` matches a Flow-form submission. Result: `messageContent` stays as the initialized empty string `''`. The `default:` branch never fires for form submissions.

**Fix shape (locked):** Add a third inner branch inside the existing `case 'interactive':`:
```js
else if (message.interactive.nfm_reply) {
  messageContent = message.interactive.nfm_reply.response_json;
  // interactiveLabel stays null — matches pseudo Step 2
}
```

**Value choice (Option B locked-with-Phase-1-confirm):**
- **Primary:** Option B — `messageContent = message.interactive.nfm_reply.response_json` (raw).
- **Phase 1 (within this item's execution):** submit one real test form, capture the `nfm_reply` webhook payload, confirm `response_json` is a string. Plan-sprint must NOT defer the entire item — only the final value-expression choice between B and A.
- **Fallback (Option A):** `JSON.stringify(message.interactive.nfm_reply.response_json)` if Phase 1 reveals Meta changed the field shape.

**Verify:**
1. Backup WF-00.
2. MCP patchNodeField on `Parse WhatsApp Message`.
3. Submit one onboarding form from a fresh test phone.
4. `SELECT id, message_type, content FROM chinmay_astro.messages ORDER BY id DESC LIMIT 1;` — expect cleartext JSON, not blank.

---

### TD-PGF-03 — decisions locked 2026-05-26T11:05Z

**Scope confirmed in-sprint:** Audit + remediate. User UI inspection confirmed all 3 hits feed WF-51 (class (a)).

**Three producer Code nodes in WF-11 (`GoTYo0GS2y8qjjkw`):**
1. `Format List` — 2 return paths; both emit `{ channelName, message }`. Consumed by `Send List To Admin`.
2. `Format Stats` — emits `{ channelName, message }`. Consumed by `Send Stats To Admin`.
3. `Prepare HELP Text` — emits `{ channelName, message: helpText }`. Consumed by `Send Help To Admin`.

**Producer rewrite (per design.md §2.4 WF-51 input contract):**
- Replace `channelName: <expr>` → `channelId: <expr>` sourced from `$('When Executed by Another Workflow').item.json.channelId`.
- Replace `message: <text>` → `messageText: <text>`.

**Consumer audit step (per plan-sprint Step 0):** for each `Send … To Admin` executeWorkflow node, inspect `workflowInputs.value.messageText` expression. If it reads `$json.message`, pair with `$json.messageText` rename. Registry note (2026-05-20 TD-003 F4) suggests `channelId` already reads from `$('Parse Command').item.json.channelId`.

**Execution shape:** Single PUT bundling 3 producer rewrites + paired consumer mapping updates. Step 5e regenerate-by-copy.

**Verify:**
1. Backup WF-11.
2. Re-fetch; grep producer Code nodes for `message:` — zero hits; `messageText:` — 3+ hits.
3. Trigger HELP from any consult channel; confirm Slack post arrives with text body (not blank).
4. Trigger LIST and STATS from admin-commands; confirm both post correctly.
5. MCP `validate_workflow` on WF-11 — zero strict errors.

---

### TD-PGF-04 — obsolete-on-verify 2026-05-26T11:20Z

**Verification performed live this session:**

1. **Quote-wrap bug already fixed.** WF-60 (`6H75p935FpBVBQtV`) `Log to Messages Table` Postgres node current `queryReplacement`:
   ```
   ={{ [$json.userId, $json.consultationId, $json.direction, $json.messageType, $json.content, $json.whatsappMessageId, $json.slackMessageTs, JSON.stringify($json.metadata)] }}
   ```
   `$json.content` is passed plain. A prior session cleaned this up.

2. **`messages` table empty (0 rows) despite 211 WF-60 runs in 7 days — explained, not a bug.**
   - 166 of 211 runs hit `Log to Messages Table`; sequence `messages_id_seq` at last_value=173 (rows WERE inserted).
   - Latest LOGGED execution (exec 2337) returned `{id:173}` — INSERT path proven working.
   - Root cause of empty table: `messages.user_id` has FK to `users.id` with `ON DELETE CASCADE`. Clean-slate test wipes via `DELETE FROM chinmay_astro.users WHERE phone_number = '<phone>'` cascade-delete all that user's messages. The 0-row state is expected behaviour.
   - Cross-checked recent Claude session transcripts: zero direct `DELETE FROM chinmay_astro.messages` or `TRUNCATE` statements. Wipes happen exclusively via the user-delete cascade.

3. **No follow-up item created.** Both originally-suspected concerns resolve to no-action.

---

### TD-PGF-05 — audit ran + decisions locked 2026-05-26T11:35Z

**Audit results (5 dimensions):**

| Drift item | Audit verdict | Affected live |
|---|---|---|
| TD-DRIFT-009 | **UNCLOSED** | WF-23 (`VpCER0Vqq3NYJGpI`), WF-30 (`gGJBY5fJha0Let8I`), WF-44 (`Du2CJ3OTohRFZYoA`) `Call WF-25 Intent Classifier` `workflowInputs.value.messageText` key. WF-40 already canonical. WF-43 uses empty value-mapping (passthrough). |
| TD-DRIFT-012 | **CLOSED** | Zero WF-50 callers use legacy `message:` / `messageBody:`. Wave 2 closed fully. |
| TD-DRIFT-013 | **UNCLOSED** | WF-50 (`BUVun38WEKb12zg9`) `Prepare Payload` jsCode line 10: `const messageContent = input.messageContent \|\| input.message \|\| input.messageBody \|\| null;`. Safe to tighten now that -012 clean. |
| TD-DRIFT-015 | **UNCLOSED** | WF-32 (`emUOLWVZiNVxcOe3`) `Prepare Reassurance Message` jsCode line 4: `phoneNumber: user.phone_number,` (cosmetic — runtime identical). |
| TD-DRIFT-026 | **UNCLOSED** | WF-44 (`Du2CJ3OTohRFZYoA`) `Call WF-25 Intent Classifier`: `userId: $json.userId` (undefined; envelope has nested `user.id`), `userStatus: $json.userStatus` (same), `messageText: $json.messageText` (overlaps with -009). |

**Critical systemic finding:** TD-DRIFT-009 + TD-DRIFT-026 + (original TD-PGF-06 item) collapse into one bug. WF-23/30/44 all expect flat-key fields that don't exist in the WF-01 envelope. WF-25 silently receives `undefined` for 3 critical fields on every free-form text in pre-form / payment-pending / feedback states.

**Consolidated fix recipe per-caller (WF-23 / WF-30 / WF-44):**
```diff
- "phoneNumber": "={{ $json.phoneNumber }}",
- "userId":      "={{ $json.userId }}",
- "messageText": "={{ $json.messageText }}",
- "userStatus":  "={{ $json.userStatus }}"
+ "phoneNumber":    "={{ $json.phoneNumber }}",
+ "userId":         "={{ $json.user.id }}",
+ "messageContent": "={{ $json.messageContent }}",
+ "userStatus":     "={{ $json.user.status }}"
```

**TD-DRIFT-013 fix recipe (WF-50 `Prepare Payload`):**
```diff
- const messageContent = input.messageContent || input.message || input.messageBody || null;
+ const messageContent = input.messageContent || null;
```
Keep `messageType` default (`input.messageType || 'text'`) — stable contract.

**TD-DRIFT-015 fix recipe (WF-32 `Prepare Reassurance Message`):**
```diff
- phoneNumber: user.phone_number,
+ phoneNumber: $('When Executed by Another Workflow').item.json.phoneNumber,
```
Pure cosmetic; runtime identical.

**Execution plan:** Single batch — 5 live edits across 5 workflows. Per-WF: backup → MCP partial-update → re-fetch verify → re-export → secrets scan. Pseudo updates on WF-23/30/44/50/32 (minor edits each).

**Verify:**
1. Re-fetch each WF; grep `Call WF-25 Intent Classifier` value expressions — zero hits for legacy `$json.userId`, `$json.userStatus`, `$json.messageText`.
2. Trigger one real message in each state (WF-23 pre-form, WF-30 payment-pending, WF-44 feedback). Inspect WF-25 execution → confirm `messageContent`, `userId`, `userStatus` populated.
3. WF-50: smoke a deliberate typo (`messageContnt`) — confirm `__drop=true` fires.
4. WF-32: trigger duplicate Payment-Completed tap — confirm reassurance message goes out with correct phone.

---

### TD-PGF-06 — subsumed into TD-PGF-05 (see audit 2026-05-26T11:35Z)

---

### TD-PGF-07 — decisions locked 2026-05-26T11:45Z

**Decision:** In-sprint. Bundle with the contract-cleanup pass alongside TD-PGF-05 to avoid the "tiny cleanup that lingers forever" anti-pattern.

**Fix recipe (two paired edits in WF-10 = `wMh0oBRtJbvhLgOf`):**
1. **`Build WF-41 Payload` Set node:** rename output field `adminMessage` → `messageText`. Value expression unchanged.
2. **`Build WF-10 Relay Envelope` Code node:** change read `inp.adminMessage` → `inp.messageText`.

**Files:** Live nodes only (no pseudo change — WF-10.pseudo already documents the external contract as `messageText`).

**Verify:**
1. Backup WF-10.
2. MCP partial-update both nodes.
3. Re-fetch; grep `adminMessage` in WF-10 — zero hits in `Build WF-41 Payload` Set node + `Build WF-10 Relay Envelope` Code node.
4. Trigger an admin relay (consult channel) to a `consultation_active` user; confirm user receives WhatsApp.

---

### TD-PGF-08 — decisions locked 2026-05-26T11:55Z (promoted to in-sprint after audit)

**Live audit (this session):** Searched all workflow exports for Postgres `Load User*` nodes:
- WF-01 (`hYGNM97sXvdo1WmI`) `Load User` + `Load User (Opted-Out)` — envelope BUILDERS. Keep.
- WF-10 (`wMh0oBRtJbvhLgOf`) `Load User Status` — envelope builder for Slack-side. Keep.
- WF-34 (`se82n3MUQ9xE5aEr`) `Load User by Phone` — query now SELECTs `payment_id` only (legitimate post-phase-1 rescope).
- **WF-45 (`MUG7rPgSHc7UtAE9`) `Load User Record` — the lone remaining redundant user-data SELECT.**

**Decision:** **In-sprint.** Closing WF-45 completes envelope-everywhere across the entire workflow corpus. The prior `revisit-next-envelope-sprint` tag is superseded.

**Fix recipe (WF-45 = `MUG7rPgSHc7UtAE9`):**
1. Identify downstream nodes that read from `$('Load User Record').item.json.X`. Primary consumer: `Prepare WF-50 Payload (Rebook Payment)` Code node (reads `user.phone_number`, `user.name`).
2. Rewrite each `$('Load User Record').item.json.X` → `$('When Executed by Another Workflow').item.json.user.X` (or top-level `phoneNumber` per Canon A).
3. Remove `Load User Record` Postgres node and connections.
4. Rewire upstream (trigger) → downstream (probably `Prepare WF-50 Payload (Rebook Payment)`) directly.
5. Update WF-45.pseudo Steps to describe envelope reads.

**Verify:**
1. Backup WF-45.
2. After MCP edits: re-fetch + grep `Load User Record` — zero hits.
3. Trigger a real REBOOK from a `consultation_closed` test user; confirm WF-50 sends correct welcome message.
4. MCP `validate_workflow` on WF-45 — zero strict errors.

---

### TD-PGF-09 — decisions locked 2026-05-26T12:10Z (promoted from monitor-only to in-sprint build)

**Reframe:** Original suggestion was monitor-only. User direction shifts this to a **graceful-failure UX** item — when Gemini retries are exhausted, the system must explicitly notify (user + admin) and halt rather than silently fall back to a degraded classification.

**Shape 2 — Explicit halt (locked):**

1. **WF-25 (`eTV1lUcYrXBg2q2T`) error branch — rewrite:**
   - Existing `Handle Gemini Error` Code node currently returns silent fallback. Replace with:
     - Build user-facing apology payload (canonical WF-50 §2.3 contract).
     - Build admin alert payload × 2 (canonical WF-51 §2.4 contract). Two destinations: (a) user's consult channel for context, (b) `chinmay-admin-commands` (`C0A5B0ZE81E`) for ops log.
     - Fan-out parallel calls: `Send Apology via WF-50` + `Send Alert (consult) via WF-51` + `Send Alert (admin-log) via WF-51`.
     - Return `{ intentResult: 'classifier_error' }` so callers can bail on this sentinel.
2. **Per-caller bail-guard (5 workflows: WF-23, WF-30, WF-31, WF-43, WF-44):**
   - Immediately after `Call WF-25 Intent Classifier`, add an `Is Classifier Error?` IF node.
   - TRUE → terminate. FALSE → existing intent-routing chain (unchanged).

**Locked copy (subject to user review at build time):**
- **WF-50 user apology:** *"We're experiencing a brief technical issue on our end. Dr. Chinmay has been notified and will get back to you shortly. We apologise for the inconvenience."*
- **WF-51 admin alert (both channels):** *":warning: WF-25 classifier failed for user <name> (<phone>) in state `<userStatus>`. User message: \"<text>\". Last error: <error>. Manual follow-up may be needed — consider offering a free consultation if the user was mid-flow."*

**Verify:**
1. Backup all 6 workflows.
2. WF-25: after edit, MCP `validate_workflow` clean; fan-out topology visible in re-fetch.
3. Per caller: after edit, `Is Classifier Error?` IF present immediately after `Call WF-25`.
4. **Smoke test (key gate, performed in TD-PGF-11 Phase B):** see Phase B recipe.

**Note on n8n executeWorkflow contract:** When WF-25 returns `intentResult: 'classifier_error'` via the error branch, the caller's `Call WF-25` node receives it as the normal return value (n8n doesn't distinguish between success and error path returns at the executeWorkflow's main output). Verify this assumption during build (read WF-25 trigger setup + test with a forced error).

---

### TD-PGF-10 — decisions locked 2026-05-26T12:25Z (deferred-with-incremental-reduction)

**Primary decision:** **Defer the 23-item bulk pseudo-cleanup to a dedicated post-go-live sprint** that fires AFTER functional testing is complete. Zero runtime impact; doesn't gate go-live. **Now tracked in `docs/sprint-tech-debt-2026-05-16-post-MVP.md` as TD-NEW-034.**

**Incremental reduction directive (sprint execution practice):**
For every workflow this sprint touches, the executor must — BEFORE making the live edit — run a quick pseudo-vs-live drift comparison on that workflow and surface findings to the user. This reduces the post-MVP bulk-cleanup burden opportunistically without adding a dedicated item.

**In-scope workflows this sprint touches:**
WF-00 (TD-PGF-02), WF-10 (TD-PGF-07), WF-11 (TD-PGF-03), WF-22 (TD-PGF-01b conditional), WF-23 (TD-PGF-05 + -09), WF-25 (TD-PGF-09), WF-30 (TD-PGF-05 + -09), WF-31 (TD-PGF-09), WF-32 (TD-PGF-05), WF-43 (TD-PGF-09), WF-44 (TD-PGF-05 + -09), WF-45 (TD-PGF-08), WF-50 (TD-PGF-05).

**Per-workflow drift-check practice (each item's Step 0):**
1. Read the `.pseudo` file.
2. Read the live `.md` projection (after running `scripts/assert-md-fresh.sh WF-XX`).
3. Compare: Inputs block declared vs Inputs consumed, Step ordering vs live topology, decision forks vs live IFs.
4. If clean → log "drift-check clean" in the sprint item's notes, proceed with the live edit.
5. If drift found → classify into:
   - **Trivial** (single-line typing / phrasing): fold into the sprint as part of the same item (extra ~5 min).
   - **Structural** (renumber / Inputs block rewrite): defer to TD-NEW-034, append to the deferred-bulk list in this item's notes.
6. After the live edit lands: regenerate `.md` via `generate-workflow-md.py`.

**Tracking:** Each sprint item's execution notes get a `drift_check:` field with `clean | trivial-folded | structural-deferred`. Aggregated counts roll up into TD-NEW-034's input.

**Effort estimate:** ~5–10 min per workflow × 13 workflows = ~90 min spread across other items' execution.

---

### TD-PGF-11 — decisions locked 2026-05-26T12:35Z (exit gate)

**Structure:** Two-phase smoke.

**Phase A — Happy-path journeys (~60 min):** see item body above.

**Phase B — Failure-path mini-smokes (~45 min):**
- **TD-PGF-09 forced-failure (Gemini halt):**
  - **Setup:** Clone WF-25 to a new workflow `WF-25-test` with Gemini HTTP URL changed to unreachable host (`https://127.0.0.1:9999/test-fail`); `retryOnFail` disabled. Switch each of 5 caller workflows (WF-23/30/31/43/44) to call `WF-25-test`.
  - **Test:** Send one free-form text from each of the 5 caller states. For each, expect:
    - User receives the apology WF-50 message.
    - User's consult channel receives WF-51 admin alert with diagnostic context.
    - `chinmay-admin-commands` receives WF-51 admin alert.
    - No degraded-classification follow-up message arrives.
  - **Cleanup:** Switch 5 callers back to production WF-25 (`eTV1lUcYrXBg2q2T`). Disable + archive `WF-25-test`.
- Garbage / abuse classification (WF-25 → WF-46 block path) — verify block still works through real WF-25.
- STOP keyword from payment_submitted user — verify WF-47 atomicity (consult closed before user opt-out write).
- Cross-channel admin command — admin types user-targeted command in wrong channel; verify DR-13 polite reject fires.

**Gate:** No P0 or P1 sprint item is marked done until its corresponding sprint-delta verification in Phase A or B passes. Phase B can run in parallel with Phase A only if a separate operator is driving it.

**Pre-requisites:** All P0 + P1 + in-sprint P3 items above must be landed and individually verified before invoking the smoke.

**Skill:** `n8n-whatsapp-methodology:smoke-test`. Use `monitor-test-run` for live observation.

---

## Mid-sprint scope additions (added 2026-05-27T00:54:52Z during TD-PGF-01B Step 5 verify)

During end-to-end verify of TD-PGF-01B, a P0 onboarding blocker was discovered (independent of TD-PGF-01B's own code changes) plus the discovery that Meta Flow publish-of-clone creates a new Flow ID. Three new items added to a new **Batch 2.5** between existing Batch 2 (P0) and Batch 3 (P1). All P0 — must close before any P1 work begins. TD-PGF-11's dependency list updated to include 12/13/14.

### TD-PGF-12 — `||` vs `??` regression-pattern audit across all active workflows

**Priority:** P0 — Batch 2.5

**Source:** data-contract-discipline Wave 1 commit `a21eb60` (2026-05-25T02:57Z) introduced `Build WF-01 Envelope` Code node using `const X = d.X || null` pattern. JavaScript `||` treats `""` as falsy → drops empty strings to `null`. Caused WF-01 → WF-02 contract violation on every nfm_reply (form) submission since the commit. Last successful form submission was 2026-05-24T08:01Z (before the commit) — bug went uncaught for ~46 hrs because no form submissions in that window.

**Scope:** AUDIT ONLY — no JSON mutation. Inspect every active workflow's Code nodes (and Set v3.4 contract-emit assignments) for the `||` fallback pattern applied to fields where `""` is a semantically valid value (`messageContent`, `messageContentUpper`, `body`, `text`, `messageText`, `content`, similar). Output = expanded list of workflows requiring `||` → `??` fix in TD-PGF-13.

**Estimated effort:** ~30–45 min (XS).

**Pre-requisite:** must run FIRST in Batch 2.5 — defines TD-PGF-13 scope.

### TD-PGF-13 — Apply `||` → `??` fix to WF-01 + any workflows surfaced by TD-PGF-12

**Priority:** P0 — Batch 2.5

**Minimum confirmed scope:** WF-01 (`hYGNM97sXvdo1WmI`) — `Build WF-01 Envelope` jsCode lines 9–10 (`messageContent` + `messageContentUpper`); same fix in `Build WF-01 Envelope (Opted-Out)` per commit `a21eb60`. Use `??` (nullish coalescing) which preserves `""` and only falls back on `null`/`undefined`.

**Expanded scope:** whatever TD-PGF-12 audit surfaces in other workflows.

**Verify:** retest form submission end-to-end — phone wipe → message bot → fill form → WF-22 INSERT lands → row has all 6 fields including `email_address` populated.

**Estimated effort:** ~30–90 min (XS–S, depends on count).

### TD-PGF-14 — WF-21 Flow ID update (1408011897720771 → 2260297164474475)

**Priority:** P0 — Batch 2.5

**Source:** Meta WhatsApp Flow "publish" of a cloned Flow creates a NEW Flow ID — does NOT update the original Flow's ID. User cloned the v1 Flow as v2, pasted v2 JSON, published — Meta assigned new ID `2260297164474475`. The original v1 Flow (`1408011897720771`) remained unchanged. WF-21 still references the original Flow ID → users opening the form see v1 baseline content (no validation, no email_address field).

**Scope:** in WF-21 (n8n ID `zM8WbxSdt9nXRoLZ`), locate the WhatsApp interactive payload constructor that references Flow ID `1408011897720771`; swap to `2260297164474475`.

**Verify:** trigger fresh onboarding (new user phone or wiped pending_users) → confirm form opens with email_address field + validation prompts on bad input. Folds naturally into TD-PGF-11 smoke gate.

**Alternative path (not chosen, documented for reference):** republish v2 content INTO the original v1 Flow in Meta — preserves Flow ID, but requires re-publish ceremony in Meta UI. WF-21 swap (TD-PGF-14) is the simpler path.

**Estimated effort:** ~15 min (XXS).

### Methodology learnings (logged in followups.md)

1. Meta Flow publish-of-clone creates new Flow ID (preserve original by editing-in-place instead).
2. `||` vs `??` empty-string regression class — audit all data-contract envelope code.

