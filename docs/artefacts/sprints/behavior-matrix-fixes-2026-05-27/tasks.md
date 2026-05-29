# Sprint: behavior-matrix-fixes-2026-05-27

**Created:** 2026-05-27T12:17:06Z
**Source:** Triaged outcome of the behavior matrix verification (`docs/artefacts/reviews/behavior-matrix-2026-05-27/`) and triage spec (`docs/artefacts/specs/2026-05-27-pre-go-live-triage-design.md`). 9 Broken + 14 Unsure cells from the matrix, collapsed into 11 unique decisions, walked through one-by-one with user 2026-05-27T07:30–12:00Z.
**Sprint goal:** Close every must-fix item that the behavior-matrix triage flagged, so the pre-go-live smoke test can run without surprises in user-input edge cases.

---

## Sprint Summary

| Tier | Items | Effort |
|---|---|---|
| 🔴 P0 (Go-live blockers) | TD-BMX-01, TD-BMX-02, TD-BMX-04, TD-BMX-06 | ~3.5–4 days |
| 🟠 P1 (Real bugs) | TD-BMX-03, TD-BMX-05 | ~30 min |
| 🟢 EXIT | TD-BMX-07 (matrix re-verification) | ~1 hr |
| **Cumulative** | **7 items** | **~4 days total (TD-BMX-06 dominates)** |
|  |  |  |
| 🟣 OBSOLETE / DEFERRED | U3 (pending_users leak — covered by planned daily-maintenance WF), U5 (media during consult — post-go-live), U4 (form re-submit — impossible per Meta), U6 (stale Payment Completed — won't-fix), U7 (NULL HELP — auto-covered by TD-BMX-03) | 0 |

**Sprint exits when:** all P0 + P1 items shipped and individually verified, AND TD-BMX-07 matrix re-verification shows zero 🛑 Broken cells and zero ⚪ NOT SPECIFIED cells in the must-fix scope.

---

## Priority Key

| Level | Meaning |
|---|---|
| 🔴 P0 | Go-live blocker — user-visible bug, data integrity, compliance risk, or first-impression damage |
| 🟠 P1 | Real bug — should land before smoke test, but smaller scope and lower urgency than P0 |
| 🟢 EXIT | Sprint exit gate — must pass before declaring go-live ready |
| 🟣 OBSOLETE / DEFERRED | Documented in triage spec; not picked up by this sprint |

---

## 🔴 P0 — Go-live blockers

### TD-BMX-01 · WF-45 status-regression guard + entry-guard for missing users row

**Source:** Behavior matrix cells S4×D, S5×D (status regression on REBOOK), S2×D ("Welcome back, undefined!"). Triage spec items M1 + M3.

**Functional significance:**
WF-45 (Rebook Handler) is currently a single-touch handler — it unconditionally `UPDATE users SET status='payment_pending'` and sends payment instructions. Three problems:

1. **REBOOK from `payment_submitted`** (S4×D): user has submitted payment and is awaiting admin approval. Typing REBOOK silently regresses their state to `payment_pending`. The `payments` row stays orphaned in `pending_verification` — admin may approve a payment for a user who is no longer in payment_submitted state. Real risk: ₹500 collected but consult not delivered.
2. **REBOOK from `consultation_active`** (S5×D): user is mid-live-consultation. Typing REBOOK silently abandons the consult — `users.status` flips to payment_pending, but the `consultations` row stays `active`. Admin keeps responding in the Slack channel while the user has lost their session.
3. **REBOOK from pre-form** (S2×D): user has received the form but not yet submitted. Typing REBOOK → WF-45 SELECTs `users` (0 rows) → builds WF-50 payload referencing `user.name` → user receives literal `"Welcome back, undefined!"`. Visibly broken UX on the most important first-impression moment.

**Fix shape:**
Add a state-classifier guard at the head of WF-45 (immediately after the trigger), before any UPDATE. Branch by computed state:

- `users.row not found` (pre-form / no record) → send polite WF-50 message: *"Let's get you set up first 🙏 Please fill the form below."* + re-send Flow CTA (same as WF-21 form payload). Do NOT UPDATE users. End.
- `users.status == 'payment_submitted'` → send WF-50 message: *"Your payment from earlier is still under review with Chinmay. There's no need to start over — please wait a few more minutes."* Do NOT UPDATE. End.
- `users.status == 'consultation_active'` → send WF-50 message: *"You're currently in an active consultation with Chinmay. Type your question instead — or if you want to end this session and start a new one, please ask Chinmay to close the current consult first."* Do NOT UPDATE. End.
- `users.status ∈ {payment_pending, consultation_closed, opted_out (via WF-26 re-entry), unknown}` → existing happy-path behavior: UPDATE users → payment_pending + send payment instructions.

**Where the state classifier reads from:**
WF-45 currently has its own `Load User Record` SELECT (post-TD-PGF-08 this is being removed; if TD-PGF-08 lands first, WF-45 reads `user` directly from the WF-01 envelope passed by upstream caller). Either way: read `user.status` from whichever source is canonical at sprint-execution time.

**Pseudo update:** Yes — `docs/pseudocode/WF-45.pseudo` Steps 1-3 need rewriting to describe the state classifier + 4 branches.

**Verify:**
1. Backup WF-45 + WF-45.pseudo.
2. Trigger REBOOK from each of: pre-form, payment_pending, payment_submitted, consultation_active, consultation_closed test users. Expect the correct branch in each.
3. Confirm no spurious UPDATEs on `users` for the 3 guarded states (check `users.updated_at` doesn't change for guarded-state tests).
4. Confirm the consultations row stays untouched during REBOOK-from-consultation_active test.

**Effort estimate:** 1–1.5 hours (one workflow, 4 branches, small additions, pseudo update).

**Drift-check (pre-edit):** read WF-45.md vs WF-45.pseudo, log clean/trivial-folded/structural-deferred.

---

### TD-BMX-02 · Reorder WF-01 security layers — Country → Blacklist → Non-Text

**Source:** Behavior matrix cells S7×G (blocked + media), S8×G (opted_out + media). Triage spec item M2.

**Functional significance:**
WF-01 currently runs its security layers in order: Country → Non-Text deflection → Blacklist. A user with `users.status='blocked'` or `users.status='opted_out'` who sends an image (or video/sticker/etc.) hits Layer 2 first → receives the polite *"This service supports text messages only. If you'd like to share a document, image, voice note or any other file, please email it to chinmay_astro@gmail.com along with your phone number and name. We'll get back to you as soon as possible."* deflection message — exposing that the service is still alive, defeating the block, and (for opted_out) violating Meta WhatsApp's STOP-compliance contract that opted-out users receive zero further outbound messages.

**Fix shape:**
Reorder the connections in WF-01 so that Layer 3 (Blacklist — `Load Pending User` + `Opted Out?` + the consequent silent-reject / WF-26 routing) runs BEFORE Layer 2 (`Layer 2: Non-Text Message Filter` + `Message Accepted?` + Non-Text deflection). New flow:

```
Country Filter → Country Rejected?
  ├─ YES → Silent Reject (Country) → End
  └─ NO  → Lookup: Blacklisted Users → Layer 3: Blacklisted Users Filter → Blacklisted?
              ├─ YES → Silent Reject (Blacklist) → End
              └─ NO  → Opted Out?
                        ├─ YES → (existing opted-out branch — Load User → WF-26 route)
                        └─ NO  → Layer 2: Non-Text Message Filter → Message Accepted?
                                    ├─ NO  → Send Non-Text Deflection via WF-50 → End
                                    └─ YES → (existing Load Pending + Load User → user-load gate → WF-02 route)
```

No node logic changes — just connection rewiring.

**Pseudo update:** Yes — WF-01.pseudo Step 4–8 reorder.

**Verify:**
1. Backup WF-01 + WF-01.pseudo.
2. Test blocked user sends image → expect zero outbound messages (no deflection, no Slack post). Confirm via WhatsApp + WF-60 messages log.
3. Test opted_out user sends image → expect zero outbound messages.
4. Test normal pre-form user sends image → expect deflection message (regression check that the layer is still reachable for non-blocked users).
5. Test blocked user sends text → expect silent reject (unchanged).

**Effort estimate:** ~30 min (connection rewiring + verify).

**Drift-check:** WF-01.md vs WF-01.pseudo.

---

### TD-BMX-04 · Activate WF-26 + verify opted-out re-engagement path

**Source:** Behavior matrix cells S8×A, B, C, D, E, F, H, I (8 cells, the entire opted-out re-engagement path except S8×G which is covered by TD-BMX-02). Triage spec item M5.

**Functional significance:**
WF-26 (`Re-Engaged Opted-Out User Handler`, n8n ID `tKjwTYF6EER8ED3y`) is marked `active=false` in n8n. n8n's `executeWorkflow` node CAN invoke inactive sub-workflows (the `active` flag governs only the workflow's own triggers — webhook, cron, etc.), so the opted-out re-engagement path is **likely** functional in production. But no live execution has confirmed this on the current VPS configuration. Risk: an opted-out user messages back, WF-01 routes to WF-26, the executeWorkflow node fails silently (or with an obscure error), and the user receives nothing — a silent failure of the most subtle path in the state machine.

**Fix shape:**
1. Toggle WF-26 `active=true` via n8n MCP (`mcp__n8n__n8n_update_partial_workflow` setting `active: true` — or equivalent PUT).
2. Smoke-test the path on a real test phone:
   - Phone X is in users.status='opted_out' (clean slate setup: insert one users row with that status, or use a test phone that has previously sent STOP).
   - Send "Hi" from phone X.
   - Expected outcomes (all three within 5–10 seconds):
     - User receives the welcome-back message from WF-26 ("Welcome back, <name>. Since you'd opted out, your previous session has ended. This is a fresh start. You don't need to send birth details again — we have them on file.").
     - User then receives a contextual reply from WF-43 (re-routed through WF-02 with refreshed envelope) — most likely a Gemini-generated general-enquiry reply.
     - `users.status` transitions: opted_out → consultation_closed (via WF-26 UPDATE).
3. Test cleanup: reset the test phone back to `opted_out` for re-runs, OR delete and re-create.

**Pseudo update:** None — pseudo is correct; this is purely an activation + verify task.

**Verify:** Three outcomes above + check `users.updated_at` advanced + check WF-26 execution history in n8n shows a successful run.

**Effort estimate:** ~30 min total (5 min toggle, 25 min test setup + run + tear-down).

---

### TD-BMX-06 · New-user Gemini classification + tailored welcome flow

**Source:** Behavior matrix cell S1×F (UNSUBSCRIBE/STATS/LIST text from new user gets canned welcome+form) — but the broader concern raised by user during triage walk-through was that EVERY non-keyword first-time message from a new user gets the same single template, regardless of whether it's a greeting, a thoughtful question, junk, or actual abuse. First impressions matter. Triage spec item M6.

**Functional significance:**
Today's chain for fresh new user text (no users row, no pending_users row):
```
WF-00 → WF-01 (user-load gate → routing='to_wf02' for any non-STOP/REBOOK text)
  → WF-02 → WF-20 (no match for non-HELP/STOP/REBOOK keywords → passthrough)
  → WF-02 Detect Route → NEW_USER → WF-21 (single canned welcome + Flow form)
```

So whether the user said "Hi", "I want to know about my future", "STATS", "UNSUBSCRIBE", or "your mother is …", the response is the same: *"Welcome to Chinmay Astro 🙏…"* + Flow form. Tone-deaf for the bad-tone cases; missed opportunity for the good cases (no contextual acknowledgement of what they asked).

**Fix shape (proposed — needs dedicated design session before implementation):**
Insert a Gemini classification call at the head of WF-21 (or a new wrapper WF-21a that WF-02 calls instead of WF-21 directly). The Gemini call uses a NEW-USER-specific prompt (NOT WF-25's existing 8-category classifier — WF-25 has side effects we don't want for fresh phones).

Three response buckets:
1. **`invalid`** — keyword-looking text, garbage, gibberish, non-greeting non-question. Examples: "UNSUBSCRIBE", "STATS", "asdfgh", "1234". Response: *"Your message doesn't look like a valid question or greeting. Please send Hi to get started with Chinmay Astro, or tap Fill Details below."* + Flow CTA. **Still creates pending_users row** so subsequent messages route through WF-23 (pre-form intent filter).
2. **`valid`** — greeting, question about the service, want-consultation, general curiosity. Examples: "Hi", "What is Vedic astrology?", "I want a consultation". Response: *"Welcome to Chinmay Astro 🙏 — we offer Vedic astrology consultations on WhatsApp. <Gemini-generated 1-2 line answer if it was a question>. Tap Fill Details below to book."* + Flow CTA. **Creates pending_users row.**
3. **`abusive`** — malicious, abusive, threatening, inappropriate. Response: NO user reply. Admin alert to `chinmay-admin-commands` Slack channel with the offending message text. Block the phone.

**Open implementation question — WF-46 contract for new-phone block:**
Today WF-46 (Auto-Block) requires `users.id` to set `status='blocked'`. For a phone with NO users row, blocking means either:
- (a) Insert a users row with status='blocked', name=NULL, date_of_birth=NULL, etc. (allow NULL onboarding fields just for the block case — schema check needed).
- (b) Create a phone-only blocklist table `chinmay_astro.blocked_phones (phone_number TEXT PRIMARY KEY, blocked_at TIMESTAMPTZ, reason TEXT)` and update WF-01 Layer 3 Blacklist filter to consult both `users.status='blocked'` AND `blocked_phones`.

**Recommendation:** decide between (a) and (b) in the dedicated TD-BMX-06 design session.

**Other open design questions:**
- Should the Gemini call use `gemini-2.5-flash-lite` (project standard, fast/cheap) or something more nuanced for first-impression copy?
- Halt-and-notify pattern on Gemini outage (TD-PGF-09 precedent)? — likely yes, but for a new-phone user we don't have a Slack consult channel to alert; admin-commands alert only.
- Latency budget — fresh-user response should arrive within ~3s. Gemini gemini-2.5-flash-lite typically 1–2s. Acceptable.
- UNSUBSCRIBE / OPT OUT / OPT-OUT aliases — handled here as part of the `invalid` bucket's classification, OR pre-empted upstream in WF-01's user-load gate keyword check? Decide in design session.

**Pseudo update:** Yes — WF-21.pseudo full rewrite or new WF-21a.pseudo. Plus possibly small touch on WF-01.pseudo for the alias question.

**Verify:**
1. Backup WF-21 + WF-21.pseudo.
2. Trigger from a fresh test phone with: "Hi" → expect `valid` branch (welcome + form + pending_users row).
3. "UNSUBSCRIBE" → expect `invalid` branch (gentle deflection + form).
4. Abusive message → expect `abusive` branch (silent to user + admin Slack alert + phone blocked).
5. Confirm blocked phone is silent-rejected on subsequent message (closes loop on the block decision).

**Effort estimate:** ~2–3 days total (design session 0.5d + implementation 1–1.5d + testing 0.5d + pseudo + drift-check).

**Pre-requisite:** TD-BMX-06 design session brainstorm — kick off immediately after this sprint's tasks.md is finalized.

**DESIGN STATUS (2026-05-29):** Structure design **COMPLETE** — see `docs/artefacts/specs/2026-05-29-bmx-06-new-contact-flow-design.md`. The redesign is substantially larger than this task block anticipated: it reshapes WF-01/WF-02/WF-21/WF-23, introduces 3 shared utility workflows (U1 Gemini Error Handler, U2 Silent-Drop & Escalate, U3 New-Contact Intent Classifier) + a `silent_drop` table + threshold auto-blacklist. Copy + U3 prompt drafted (verify verbatim at build). STILL PENDING DESIGN (next session, in order): message debouncing (sibling concern), then TD-BMX-05. The new-user fix and TD-BMX-05 are now coupled — design/build them from the design doc, not these original task blocks.

**Drift-check:** WF-21.md vs WF-21.pseudo (pre-edit).

---

## 🟠 P1 — Real bugs, smaller scope

### TD-BMX-03 · WF-20 HELP ternary — add null + pendingUser arms (auto-covers NULL-status edge)

**Source:** Behavior matrix cells S1×E (HELP from no-record), S2×E (HELP from pre-form), S10×E (HELP from unknown-status). Triage spec items M4 + W3.

**Functional significance:**
WF-20's `Send HELP Response` node uses an inline ternary on `user.status` with 4 explicit status arms + a default. For a new user (user=null) or pre-form user (user=null, pendingUser≠null), all the explicit arms fail (because they read `user.status` which is undefined), and the user falls to the generic default: *"Here's what you can do: 📋 REBOOK — Book a new consultation · 🚫 STOP — Unsubscribe from all messages · For anything else, just type your question during an active consultation."* The message references features the user doesn't have (REBOOK with no record to rebook against; "active consultation" they've never had). Confusing exactly when a confused new user types HELP.

**Fix shape:**
Add two more ternary arms to the existing inline expression in WF-20 `Send HELP Response`. Pseudo location: WF-20.pseudo Step 4.

```
- If user == null AND pendingUser == null →
  "Welcome to Chinmay Astro 🙏 — send Hi to get started, or tap Fill Details below to book your Vedic astrology consultation with Dr. Chinmay."
- If user == null AND pendingUser != null →
  "Tap the Fill Details button on the form above to complete your onboarding. If you don't see the form, send Hi to receive it again."
- (existing arms unchanged: payment_pending / payment_submitted / consultation_active / consultation_closed)
- Default (only reached for unknown / NULL user.status — auto-covers W3):
  Keep the current generic menu — it's the correct safety net for unexpected states.
```

**Pseudo update:** Yes — WF-20.pseudo Step 4 description.

**Verify:**
1. Backup WF-20.
2. Test HELP from a fresh test phone → expect new-user message + Flow CTA visible.
3. Test HELP after form sent but before submission → expect pre-form message.
4. Test HELP from each existing-state phone → unchanged (regression check).

**Effort estimate:** ~30 min (small ternary change + pseudo + verify).

**Drift-check:** WF-20.md vs WF-20.pseudo.

---

### TD-BMX-05 · UNSUBSCRIBE / OPT OUT / OPT-OUT aliases for STOP

**Source:** Triage spec item M6 (the small/cheap portion). Behavior matrix cell S1×F is partially covered by TD-BMX-06; this item covers the specific UNSUBSCRIBE-typer edge.

**Functional significance:**
Real users who want to opt out are far more likely to type "UNSUBSCRIBE" than the exact uppercase "STOP" — but only "STOP" is currently recognised. An UNSUBSCRIBE-typer gets routed as if it's a regular message: pre-form gets Gemini reply, new user gets welcome+form (per TD-BMX-06 once shipped), payment_pending gets payment reminder, etc. None of these are an opt-out. Compliance + user-respect issue.

**Fix shape:**
Add three more text values to the keyword match path that routes to WF-47 (Unsubscribe):

- `UNSUBSCRIBE`
- `OPT OUT`
- `OPT-OUT`

Two places this could be done (decide at execution time):

(a) **WF-20 `Match Keyword` switch** — add three more case arms next to the existing STOP route. Affects only existing/pre-form users (because WF-20 doesn't run for fresh new-user no-record case — WF-01 user-load gate handles those upstream).

(b) **WF-01 user-load gate keyword check** — currently only matches STOP and REBOOK for the anomaly_keyword routing. Extend to include the aliases on both sides:
- New-user (no record): UNSUBSCRIBE/OPT OUT/OPT-OUT → anomaly_keyword (admin alert, no user reply) — same as STOP.
- Existing user: UNSUBSCRIBE/OPT OUT/OPT-OUT → WF-20 STOP path → WF-47 unsubscribe.

(b) is the more complete fix; (a) alone leaves the new-user case half-handled (would still flow through TD-BMX-06's classifier as `invalid` though, so partial coverage exists). Recommendation: do (a) + (b).

**Pseudo update:** Yes — WF-20.pseudo + WF-01.pseudo Step 12a description.

**Verify:**
1. Test "UNSUBSCRIBE" from payment_pending → expect WF-47 path → users.status='opted_out'.
2. Test "OPT OUT" from consultation_active → expect WF-47 (closes consult + opts out).
3. Test "Opt-Out" from consultation_closed → expect WF-47.
4. Test "UNSUBSCRIBE" from new phone → expect anomaly_keyword (admin alert, no user reply).
5. Confirm "I want to stop drinking coffee" still goes through normal text routing (not opt-out — exact match only on the alias list).

**Effort estimate:** ~30 min.

**Drift-check:** WF-20.md + WF-01.md vs their pseudos.

---

## 🟢 EXIT — Sprint exit gate

### TD-BMX-07 · Behavior matrix re-verification smoke test

**Source:** All P0 + P1 items above. The original matrix at `docs/artefacts/reviews/behavior-matrix-2026-05-27/index.html` is the source of truth — after fixes ship, re-run the relevant cells and confirm functional verdict has moved from 🛑 Broken / ⚠️ Unsure → ✅ Working.

**Functional significance:**
Without an explicit re-verification gate, individual TD-BMX items might pass their own narrow verify steps but miss interaction effects (e.g. TD-BMX-02 reordering layers might affect TD-BMX-04's opted-out routing path). The matrix re-verification catches systemic regressions.

**Scope — cells to re-verify (post-fix):**

| Cell | Expectation after fix |
|---|---|
| S1×E | TD-BMX-03: new-user welcome message |
| S1×F | TD-BMX-06: classified by Gemini, routed appropriately |
| S2×D | TD-BMX-01: polite "let's get you set up first" + Flow CTA |
| S2×E | TD-BMX-03: pre-form-specific HELP message |
| S4×D | TD-BMX-01: "payment under review, please wait" message |
| S5×D | TD-BMX-01: "you're in active consult, ask Chinmay to close first" message |
| S7×G | TD-BMX-02: silent reject — zero outbound messages |
| S8×A through S8×I (except G) | TD-BMX-04: WF-26 active + welcome-back + WF-43 reply |
| S8×G | TD-BMX-02: silent reject — zero outbound messages |
| S10×E | TD-BMX-03: generic menu (auto-covered) |

**Effort estimate:** ~1 hour for all 15+ cells in scope.

**Skill:** `n8n-whatsapp-methodology:smoke-test` for execution; `monitor-test-run` for live observation. Use the existing `behavior-matrix-2026-05-27` HTML as the test plan — walk the cells column by column.

**Gate:** Sprint cannot be marked complete until ALL re-verified cells show ✅ Working, AND the behavior-matrix HTML is updated to reflect post-fix state.

**Pre-requisites:** TD-BMX-01 through TD-BMX-06 all landed and individually verified.

---

## Items intentionally excluded from this sprint

Tracked for traceability — `plan-sprint` will NOT pick these up.

| Item | Why excluded |
|---|---|
| U3 — pending_users row leak on STOP pre-form (S2×C) | Will be addressed by a planned daily-maintenance workflow (post-go-live). No double-fix in WF-47 needed. |
| U4 — Form re-submission overwrites DOB (all H cells in S3-S10) | Impossible per Meta — Flow form bubble locks to "View Responses" after submission. Update matrix to mark these as N/A. |
| U5 — Media handling during consultation_active (S5×G) | Post-go-live. Real product gap but meaningful build (Meta media download + Slack file upload). MVP ships with email-fallback policy. |
| U6 — Stale Payment Completed tap → feedback prompt (S6×I) | Won't-fix. Edge of edges; user can recover naturally via text reply. |
| U7 — Generic HELP menu in NULL-status state (S10×E) | Auto-covered by TD-BMX-03. No separate item. |
| Detailed UNSUBSCRIBE-as-STOP-alias variant work | Folded into TD-BMX-05. |
| All other matrix cells already 🟢 ✅ Working | No work needed. |

---

## Discussion Log

Each item below reflects user-confirmed decisions captured during the triage walk-through 2026-05-27T07:30Z–12:00Z (in this session).

### TD-BMX-01 — locked 2026-05-27T11:30Z

**Trigger:** behavior matrix cells S4×D, S5×D, S2×D — all surfaced as 🛑 Broken with the same root cause (WF-45 lacks state guard).

**Scope narrowing:** Originally B1 in the matrix covered 4 cells (S4×D, S4×H, S5×D, S5×H). U4 discussion confirmed form re-submit is impossible per Meta — S4×H and S5×H are N/A. TD-BMX-01 scope confirmed: only the 2 REBOOK regression cells + 1 pre-form REBOOK cell. WF-22 form-handler does NOT need an analogous guard because re-submission is unreachable.

**Branch structure decided:** 4 explicit branches (pre-form / payment_submitted / consultation_active / default → happy path). The "default" path covers payment_pending (no-op nudge), consultation_closed (the legitimate rebook entry), and NULL/unknown (self-healing).

**Copy locked:** see fix-shape section above. Subject to user copy-review at build time.

---

### TD-BMX-02 — locked 2026-05-27T11:35Z

**Trigger:** behavior matrix cells S7×G, S8×G.

**Decision:** reorder, not rewrite. The existing nodes are all correct; only the wiring is wrong.

**Concern raised + dismissed:** does reordering break the deflection for normal (non-blocked) pre-form users sending media? — No. The Non-Text filter still fires for them; it's only moved to AFTER the blacklist check, so legitimate users still get the deflection.

---

### TD-BMX-04 — locked 2026-05-27T11:50Z

**Trigger:** behavior matrix's entire S8 row (except S8×G — covered by TD-BMX-02).

**Decision:** simple toggle + verify. n8n's `executeWorkflow` documentation confirms it can invoke inactive sub-workflows (`active` governs the WF's own triggers, not sub-workflow calls). But verification is required because no production execution has exercised the path on this VPS.

**Test setup chosen:** real-phone smoke (not synthetic) — confirms the entire chain WF-01 opted-out branch → WF-26 → WF-50 welcome-back → WF-02 re-route → WF-43 Gemini reply.

---

### TD-BMX-06 — locked 2026-05-27T11:55Z (needs dedicated design session)

**Trigger:** behavior matrix cell S1×F + broader concern raised by user about first-impression handling for ALL new-user text.

**User direction:** must-fix before go-live. Don't reuse WF-25 (its side effects are wrong for fresh phones); build a dedicated Gemini call inside WF-21 (or a new wrapper).

**3-bucket classification scheme locked:** invalid / valid / abusive.

**Open implementation question:** WF-46 contract for new-phone block (option a: insert users row with NULL onboarding fields; option b: new blocked_phones table). Decide in TD-BMX-06 design session, NOT during this sprint plan.

**Decision deferred to design session:**
- Gemini model choice + prompt design
- Halt-and-notify on Gemini outage (likely yes, admin-commands alert only)
- Latency budget verification
- Where the UNSUBSCRIBE alias check happens (here vs TD-BMX-05)

**Sequencing:** TD-BMX-06 design session must run first (it's the only item that needs design beyond what's in this tasks.md). All other items (-01, -02, -03, -04, -05) can be plan-sprinted directly.

---

### TD-BMX-03 — locked 2026-05-27T11:30Z

**Trigger:** behavior matrix cells S1×E, S2×E, S10×E.

**Decision:** small ternary expansion. No structural change to WF-20.

**Auto-coverage:** S10×E (NULL-status HELP) auto-resolves because the new explicit arms handle null/pendingUser cases, and the existing default arm correctly catches unknown/NULL status with the safe generic menu.

**Copy locked:** see fix shape. Subject to user review at build time.

---

### TD-BMX-05 — locked 2026-05-27T12:00Z

**Trigger:** triage walk-through of U2 — small/cheap portion separated from TD-BMX-06's larger scope.

**Decision:** add UNSUBSCRIBE / OPT OUT / OPT-OUT to BOTH WF-20 keyword switch AND WF-01 user-load gate. Belt-and-suspenders — covers existing-user + new-user-from-no-record cases consistently.

**Match style:** exact uppercase match only (same discipline as STOP/REBOOK). "I want to unsubscribe from coffee" remains normal-text — exact-match is intentional to avoid false positives.

---

### TD-BMX-07 — locked 2026-05-27T12:10Z

**Trigger:** sprint discipline — re-verify the matrix to confirm fixes landed without regression.

**Use the existing behavior-matrix HTML as the test plan.** Don't build a new test plan — walk the 15+ affected cells and confirm each.

---

## Methodology learnings (logged for future sprints)

1. **Behavior matrix as a triage primitive.** Cells × scenarios + dual-axis (functional verdict + drift) made it easy to spot systemic patterns (status regression family, info-leak family) that would have been hidden in narrative findings. Worth doing pre-smoke-test for any future material refactor.

2. **Triage decisions converted to sprint items 1:1, not 1:cell.** The 23-cell triage collapsed into 11 unique decisions, then into 6 must-fix items. Root-cause grouping is the right unit, not per-cell.

3. **Meta WhatsApp Flow form lock-after-submit eliminates entire scenario families.** Captured for future matrix-style work — don't generate cells for impossible Meta-platform behaviors.
