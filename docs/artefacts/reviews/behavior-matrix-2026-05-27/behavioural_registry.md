# Behavioural Registry — code-derived traversal of every (state × input) cell

**Generated:** 2026-05-31T11:38:57Z · **Source of truth:** live n8n workflows, projected to `docs/pseudocode/WF-XX.md` (regenerated from a fresh full export this run; freshness sweep 31/31 fresh). This registry records **what the live code actually does** for each cell — traced WF-00 → terminal — with an **independent correctness verdict**. It does **not** inherit any expectation from the 2026-05-27 behaviour matrix (that file was used only to enumerate the 9 states × 9 input scenarios).

**Companion to** `docs/workflow-registry.md`: where the workflow registry lists *what each WF is*, this lists *what happens for a given (user-state, inbound-type)* — so the traversal chain + the registry together answer "what will the system do?" without re-reading workflows.

## Scenario legend (columns)

| Code | Input |
|------|-------|
| A | "Hi"/greeting (plain text, no keyword) |
| B | Free-form question (real text, not a reserved keyword) |
| C | STOP (exact keyword) |
| D | REBOOK (exact keyword) |
| E | HELP (exact keyword) |
| F | Other reserved-looking keyword (UNSUBSCRIBE / STATS / LIST / APPROVE PAYMENT) |
| G | Non-text media (image / audio / video / sticker / location / contact) |
| H | WhatsApp Flow form submission (interactive nfm_reply) |
| I | "Payment Completed" button (interactive button_reply) |

## Summary

**81 cells** — ✅ Expected **60** · ⚠️ Needs-Fixing **12** · ➖ N/A **9**

### ⚠️ Needs-Fixing rollup

| Cell | Severity | Issue |
|------|----------|-------|
| S10/A | P0 | WF-01 routes anomalous-status user to WF-02 as 'existing'; WF-02 Validate Inputs throws on status not in 6-value whitelist; silent crash, no reply/alert. |
| S10/B | P0 | Same WF-02 Validate Inputs throw before the intent classifier; a real customer question is silently lost. |
| S10/C | P0 | Validate Inputs throws before WF-20 keyword intercept; STOP opt-out silently fails (compliance risk). |
| S10/D | P0 | Validate Inputs throws before WF-20; REBOOK never reaches WF-45, no new cycle, silent dead-end. |
| S10/E | P0 | Validate Inputs throws before WF-20; HELP menu never sent. |
| S10/F | P0 | Validate Inputs throws before keyword/classifier; UNSUBSCRIBE (STOP alias) and all others silently dead-end. |
| S10/G | P0 | Validate Inputs throws before EXISTING_NON_TEXT branch; no deflection message, no WF-61 escalation. |
| S10/I | P0 | Validate Inputs throws before Detect Route; payment-completion tap silently lost, no WF-32, no notification. |
| S1/G | P2 | Brand-new media → silent counter-drop with no text-only nudge, unlike WF-02's existing-user deflection. |
| S4/I | P2 | Detect Route PAYMENT_CONFIRM requires status==payment_pending, so a re-tap by a payment_submitted user → UNHANDLED admin alert + silent for user; should be idempotent under-review reassurance. |
| S6/B | P2 | Common path answers via WF-43 Gemini, but WF-25 defaults unknown→feedback_intent for closed users (can mis-log a real question) and WF-43 Stop Intent? TRUE output is unconnected (dead-end on stop classification). |
| S1/D | minor | REBOOK silently dropped via alias path; friendlier to welcome+form, but near-zero realistic frequency. |

### ➖ N/A cells

`S1/H`, `S2/I`, `S3/H`, `S4/H`, `S5/H`, `S6/H`, `S7/H`, `S8/H`, `S10/H`

---

### S1 / A — No record · "Hi"/greeting

**Scenario:** No row in `users` and none in `pending_users` (first-ever contact); user sends a plain greeting like "Hi" / "Namaste".

**Traversal chain:**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?no → Alias?no → U3) → WF-62(classify→greeting) → WF-21(Apply Fail-Open→welcome) → Insert Pending(Welcome) → WF-50(Welcome) → WF-61(greeting-loop drop, thr=10, not blocked)`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message: type=text, content="Hi"; dedup passes (new messageId); records message; logs via WF-60; calls WF-01.
- **WF-01** — Country Filter PASS (+91/+61); Status Lookup returns no user row and no pending row → `Classify & Build Envelope` sets route='brand_new'; Route: Blocked?/Opted Out? no → Route: Brand New? TRUE → calls **WF-21** (WF-02 is bypassed for brand-new).
- **WF-21** — Normalize Envelope (keyword="HI", isAlias=false); Non-Text? FALSE (text); Opt-Out/Rebook Alias? FALSE → Build U3 Payload (stage='new') → calls WF-62.
- **WF-62** — Entry Guard OK; Gemini gemini-2.5-flash-lite classifies → bucket='greeting', confidence high; returns {bucket, confidence}.
- **WF-21** — Apply Fail-Open: greeting → routeClass='welcome' → Route: Welcome? TRUE → Insert Pending User (Welcome) (creates the pending_users row) → Build Welcome Message (privacy URL + Flow form) → Call WF-50 (Welcome).
- **WF-50** — Sends the welcome message with the "Fill Details" Flow form on WhatsApp.
- **WF-61** — Chained Build U2 Payload (Greeting Loop) (threshold 10) records a silent-drop counter row; count < 10 → Return Not Blocked (no block, no second message).

**Outcome:** User receives the welcome + Birth Details form; a `pending_users` row is created (state advances no-record → pre-form). Loop-counter incremented but no block.

**Verdict:** ✅ **Expected / correct** — greeting on first contact correctly yields the welcome+form and captures the pending contact; the loop counter is harmless protection.

### S1 / B — No record · Free-form question

**Scenario:** First-ever contact with no DB rows; user sends a real astrology/service question (e.g. "When will I get married?" / "How much does it cost?").

**Traversal chain:**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?no → Alias?no → U3) → WF-62(classify→service_related_question|wants_consultation) → WF-21(Apply Fail-Open→service|welcome) → Insert Pending → WF-50(Service|Welcome) → WF-61(loop drop, thr=10)`

**Hop-by-hop:**
- **WF-00** — Parses text question; dedup passes; logs; calls WF-01.
- **WF-01** — Country PASS; Status Lookup empty → route='brand_new' → Route: Brand New? TRUE → calls WF-21.
- **WF-21** — Normalize (isAlias=false); Non-Text? FALSE; Alias? FALSE → Build U3 Payload (stage='new') → WF-62.
- **WF-62** — Gemini classifies an astrology/service question → bucket='service_related_question' (or 'wants_consultation' for booking intent), confidence ≥0.5.
- **WF-21** — Apply Fail-Open: service_related_question → routeClass='service' → Route: Service? TRUE → Build Service Answer Request → Generate Service Answer (Gemini, 1–2 sentence answer; on error → WF-53 U1 user-facing fallback) → Parse Service Answer → Insert Pending User (Service) → Build Service Message (answer + welcome + form) → Call WF-50 (Service). (A `wants_consultation` bucket would instead take the 'welcome' path → welcome+form.)
- **WF-50** — Delivers the contextual answer plus the Birth Details form.
- **WF-61** — Chained Service-Loop U2 drop (threshold 10) — counter only; not blocked.

**Outcome:** User gets a friendly, on-topic answer + the form; `pending_users` row created (no-record → pre-form).

**Verdict:** ✅ **Expected / correct** — a genuine question is answered and nudged toward the form; Gemini-failure path is covered by WF-53 user-facing fallback.

### S1 / C — No record · STOP keyword

**Scenario:** First-ever contact, no DB rows; user's very first message is the exact keyword "STOP".

**Traversal chain:**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?no → Alias?YES) → Build U2(Alias, reason=stop_keyword, thr=5) → WF-61(silent drop, count<5 → Not Blocked)`

**Hop-by-hop:**
- **WF-00** — Parses text "STOP"; dedup passes; logs; calls WF-01.
- **WF-01** — Country PASS; Status Lookup empty → route='brand_new' → Route: Brand New? TRUE → calls WF-21. (Note: STOP is NOT intercepted in WF-01 for brand-new — the keyword intercept lives in WF-20, which only runs for existing-user text via WF-02; brand-new bypasses both.)
- **WF-21** — Normalize Envelope: keyword="STOP", isAlias=TRUE, aliasReason='stop_keyword'; Non-Text? FALSE → Opt-Out/Rebook Alias? TRUE → Build U2 Payload (Alias) (reason='stop_keyword', blockThreshold=5, blockReason='threshold_garbage') → Call U2 (Alias).
- **WF-61** — Insert Silent Drop; Count 30-Day Drops = 1; Threshold Reached? (1 ≥ 5) FALSE → Return Not Blocked. No reply, no pending row, no opt-out state.

**Outcome:** Silent drop — no reply sent, no DB user/pending row, drop counter = 1. The number is neither opted_out nor blocked (it has no record to mark).

**Verdict:** ✅ **Expected / correct** — STOP before any record exists has nothing to opt out of; silently dropping (rather than welcoming or erroring) is the sensible behavior, and repeated STOP-spam eventually trips the threshold-5 auto-block. Design Rule 4 (`opted_out` requires a record) is honored — no user row is created to set opted_out, which is correct for a brand-new number.

### S1 / D — No record · REBOOK keyword

**Scenario:** First-ever contact, no DB rows; user's first message is the exact keyword "REBOOK".

**Traversal chain:**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?no → Alias?YES) → Build U2(Alias, reason=rebook_keyword, thr=5) → WF-61(silent drop, count<5 → Not Blocked)`

**Hop-by-hop:**
- **WF-00** — Parses text "REBOOK"; dedup passes; logs; calls WF-01.
- **WF-01** — Country PASS; Status Lookup empty → route='brand_new' → Route: Brand New? TRUE → calls WF-21.
- **WF-21** — Normalize Envelope: keyword="REBOOK", isAlias=TRUE, aliasReason='rebook_keyword'; Non-Text? FALSE → Opt-Out/Rebook Alias? TRUE → Build U2 Payload (Alias) (reason='rebook_keyword', blockThreshold=5) → Call U2 (Alias).
- **WF-61** — Insert Silent Drop; count=1; Threshold (1 ≥ 5) FALSE → Return Not Blocked. No reply.

**Outcome:** Silent drop — no reply, no DB rows, drop counter = 1.

**Verdict:** ⚠️ **Needs fixing** [minor] — REBOOK from a brand-new number has nothing to rebook, so a silent drop is defensible; however, the friendlier journey would be to treat an unknown-number REBOOK like a greeting (welcome + form) so a genuinely-interested person isn't met with silence. As coded the user gets no response and accrues toward an auto-block (threshold 5). Evidence: WF-21 `Opt-Out/Rebook Alias?` lumps REBOOK with STOP into the silent-drop alias path rather than the U3-classify path. Low-severity because the realistic frequency of a stranger typing "REBOOK" cold is near-zero.

### S1 / E — No record · HELP keyword

**Scenario:** First-ever contact, no DB rows; user's first message is the exact keyword "HELP".

**Traversal chain:**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?no → Alias?no → U3) → WF-62(classify→HELP) → WF-21(Apply Fail-Open→welcome) → Insert Pending(Welcome) → WF-50(Welcome) → WF-61(greeting-loop drop, thr=10)`

**Hop-by-hop:**
- **WF-00** — Parses text "HELP"; dedup passes; logs; calls WF-01.
- **WF-01** — Country PASS; route='brand_new' → Route: Brand New? TRUE → calls WF-21.
- **WF-21** — Normalize: keyword="HELP", isAlias=FALSE (HELP is not in the alias list); Non-Text? FALSE → Opt-Out/Rebook Alias? FALSE → Build U3 Payload (stage='new') → WF-62.
- **WF-62** — Gemini classifies "HELP" → bucket='HELP', confidence high.
- **WF-21** — Apply Fail-Open: HELP → routeClass='welcome' → Route: Welcome? TRUE → Insert Pending User (Welcome) → Build Welcome Message → Call WF-50 (Welcome).
- **WF-50** — Sends welcome + Birth Details form.
- **WF-61** — Greeting-Loop U2 drop (threshold 10); not blocked.

**Outcome:** User receives welcome + form; `pending_users` row created (no-record → pre-form).

**Verdict:** ✅ **Expected / correct** — HELP from a stranger sensibly maps to the welcome/onboarding message via the classifier's HELP bucket. (Unlike STOP/REBOOK, HELP is intentionally routed through the LLM classifier here, not an exact-match intercept — appropriate for a no-record contact who wants guidance.)

### S1 / F — No record · Other reserved-looking keyword (UNSUBSCRIBE / STATS / LIST / APPROVE PAYMENT)

**Scenario:** First-ever contact, no DB rows; user types an admin-ish or alias-ish word — UNSUBSCRIBE, STATS, LIST, or APPROVE PAYMENT.

**Traversal chain (UNSUBSCRIBE):**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?no → Alias?YES) → Build U2(Alias, reason=stop_keyword, thr=5) → WF-61(silent drop)`
**Traversal chain (STATS / LIST / APPROVE PAYMENT):**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?no → Alias?no → U3) → WF-62(classify→unrelated|garbage) → WF-21(Apply Fail-Open→redirect|silent) → (redirect: Insert Pending → WF-50 → WF-61 thr5) | (silent: WF-61 Garbage thr5)`

**Hop-by-hop:**
- **WF-00** — Parses the text; logs; calls WF-01.
- **WF-01** — Country PASS; route='brand_new' → calls WF-21. (Admin commands like STATS/LIST/APPROVE are handled by WF-10/WF-11 on the *Slack* side only — they have no meaning on the inbound WhatsApp path, so no admin routing applies here.)
- **WF-21 (UNSUBSCRIBE)** — Normalize: keyword="UNSUBSCRIBE", isAlias=TRUE (in alias list), aliasReason='stop_keyword' → Opt-Out/Rebook Alias? TRUE → Build U2 (Alias, thr 5) → WF-61 silent drop, no reply.
- **WF-21 (STATS / LIST / APPROVE PAYMENT)** — isAlias=FALSE → Build U3 Payload → WF-62. Gemini most likely returns 'unrelated' (a stray word/admin phrase) → routeClass='redirect' → Insert Pending User (Redirect) → WF-50 sends the polite "tap Fill Details" redirect; or 'garbage' for a bare token → routeClass='silent' → WF-61 Garbage drop (thr 5), no reply.
- **WF-50 / WF-61** — Redirect path delivers the nudge then counts an Unrelated-loop drop (thr 5); silent path just records a Garbage drop.

**Outcome:** UNSUBSCRIBE → silent drop, no reply. STATS/LIST/APPROVE PAYMENT → either a redirect nudge+form (pending row created) or a silent garbage drop, depending on the classifier — never an admin action.

**Verdict:** ✅ **Expected / correct** — none of these admin/alias tokens leak any privileged behavior to an unknown number; UNSUBSCRIBE is correctly treated as a stop-alias silent drop, and admin words are harmlessly redirected or dropped. Mild note (not a defect): a redirect outcome is friendlier than a silent garbage drop, but both are acceptable for stray admin-looking input.

### S1 / G — No record · Non-text media

**Scenario:** First-ever contact, no DB rows; user sends an image / video / audio / sticker / location / contact (messageType is a non-text media type).

**Traversal chain:**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?YES) → Build U2(Non-Text, reason=non_text, thr=5) → WF-61(silent drop, count<5 → Not Blocked)`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message: default branch sets messageContent="[IMAGE]"/"[AUDIO]"/etc., messageType=raw media type; logs; calls WF-01.
- **WF-01** — Country PASS; route='brand_new' → Route: Brand New? TRUE → calls WF-21. (WF-01 no longer drops non-text; it passes the full envelope through.)
- **WF-21** — Normalize Envelope (messageType≠'text'); Non-Text? TRUE → Build U2 Payload (Non-Text) (reason='non_text', blockThreshold=5, blockReason='threshold_non_text') → Call U2 (Non-Text).
- **WF-61** — Insert Silent Drop; Count 30-Day Drops=1; Threshold (1 ≥ 5) FALSE → Return Not Blocked. No reply, no pending row.

**Outcome:** Silent drop — no reply, no DB rows; drop counter = 1. After 5 non-text drops in 30 days the number auto-blocks.

**Verdict:** ⚠️ **Needs fixing** [P2] — a brand-new person who sends a photo/voice note as their first contact receives complete silence, with no nudge that the service is text-only. For an *existing* user WF-02 sends the friendly "text messages only / email chinmay_astro@gmail.com" deflection (Build Deflection Payload), but the brand-new path in WF-21 has no equivalent deflection — it goes straight to a silent counter-drop. First-principles: a first-time legitimate contact deserves one informational nudge before silent dropping. Evidence: WF-21 `Non-Text?` TRUE → `Build U2 Payload (Non-Text)` → WF-61 with no preceding WF-50 send, vs. WF-02's `EXISTING_NON_TEXT` deflection branch.

### S1 / H — No record · WhatsApp Flow form submission (nfm_reply)

**Scenario:** First-ever contact with no DB rows submitting the Birth Details Flow form (interactive `nfm_reply`).

**Traversal chain:**
`— (impossible in S1) —`

**Hop-by-hop:**
- **N/A** — A Flow form is only ever delivered to a user *after* a welcome/redirect/service reply (which simultaneously creates a `pending_users` row). By the time the user can tap "Fill Details" and submit, a pending row exists — so the DB state is no longer S1 (it is S2/pre-form). A true S1 (no pending row at all) cannot have received a form to submit. Additionally Meta locks the form bubble after the first submit, preventing re-submission.
- For completeness: if such an event somehow arrived for a brand-new number, WF-01 still routes brand_new → WF-21 (not WF-02), where `Non-Text?` (messageType='interactive' ≠ 'text') would be TRUE → silent non-text drop. WF-02's defensive `Detect Route` guard (`nfm_reply` with user===null && pendingUser===null → 'UNHANDLED' → admin alert) is therefore never reached from a brand-new number.

**Verdict:** ➖ **N/A** — a form submission presupposes the form was sent, which presupposes a `pending_users` row exists; that DB state is S2 (pre-form), not S1. Genuinely impossible in this state.

### S1 / I — No record · "Payment Completed" button

**Scenario:** First-ever contact, no DB rows; an interactive `button_reply` arrives carrying the "Payment Completed" button (id/title).

**Traversal chain:**
`WF-00 → WF-01(route=brand_new) → WF-21(Non-Text?YES) → Build U2(Non-Text, reason=non_text, thr=5) → WF-61(silent drop, count<5 → Not Blocked)`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message: interactive button_reply → messageContent=button id, interactiveLabel=title; messageType='interactive'; logs; calls WF-01.
- **WF-01** — Country PASS; Status Lookup empty → route='brand_new' → Route: Brand New? TRUE → calls WF-21.
- **WF-21** — Normalize Envelope (messageType='interactive' ≠ 'text'); Non-Text? TRUE → Build U2 Payload (Non-Text) (reason='non_text', thr=5) → Call U2 (Non-Text).
- **WF-61** — Insert Silent Drop; count=1; Threshold FALSE → Return Not Blocked. No reply, no DB rows.

**Outcome:** Silent drop — no reply, no DB rows; drop counter = 1.

**Verdict:** ✅ **Expected / correct** — a "Payment Completed" tap is only meaningful for a `payment_pending` user; a brand-new number cannot have a payment button to tap (it never received the payment prompt). Silently dropping a stray/forged interactive callback (rather than processing a phantom payment) is the safe behavior. WF-02's `PAYMENT_CONFIRM` route is gated on `user!==null && status==='payment_pending'`, so even if it were reached it would not fire — but for brand-new the WF-21 non-text drop catches it first.

### S2 / A — Pre-form · "Hi" / greeting
**Scenario:** User has a `pending_users` row (contact captured by WF-21) but no `users` row yet (Flow form not submitted) and sends a plain greeting like "Hi" / "Namaste".
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(PRE_FORM_TEXT) → WF-23(non-text? no → alias? no) → WF-62(U3 classify=greeting) → WF-23(Apply Fail-Open → welcome) → WF-50 → WF-61(greeting-loop counter)`
**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message: type=text, content="Hi"; dedup passes; records message; calls WF-01 (and WF-60 log).
- **WF-01** — Country Filter PASS (91/61); Status Lookup finds pending row, no users row → `route='existing'`; Blocked/OptedOut/BrandNew all false → calls WF-02 with the §2.1 envelope (user=null, pendingUser={contact_name}).
- **WF-02** — Validate Inputs OK; Detect Route: `user===null && pendingUser!==null` → `PRE_FORM_TEXT`; Existing-User Text? false (user null) → Route Switch output #1 → calls WF-23.
- **WF-23** — Normalize Envelope; Non-Text? false; Opt-Out/Rebook Alias? false (not in ALIASES) → Build U3 Payload stage='pre_form' → calls WF-62.
- **WF-62** — Gemini gemini-2.5-flash-lite classifies "Hi" → `bucket='greeting'`; returns {bucket, confidence}.
- **WF-23** — Apply Fail-Open: greeting → routeClass='welcome' → Build Welcome Message (interactive Flow form, Fill Details CTA) → Call WF-50 (Welcome); on return Build U2 Payload (Greeting Loop) → WF-61 (threshold 10) increments the greeting-loop counter (no block at count 1).
- **WF-50** — interactive/flow payload valid → sends WhatsApp welcome + Fill-Details form nudge; logs to WF-60.
**Outcome:** Warm WhatsApp welcome with the Birth Details form (Fill Details). No state change (stays pre-form).
**Verdict:** ✅ **Expected / correct** — greeting at pre-form correctly nudges the user back to the form; reaches a real send terminal with loop-abuse protection.

### S2 / B — Pre-form · Free-form question
**Scenario:** User has a `pending_users` row but no `users` row and sends a free-form astrology/service question (e.g. "When will I get married?", "how much does it cost?").
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(PRE_FORM_TEXT) → WF-23(alias? no) → WF-62(U3 classify) → WF-23(Apply Fail-Open → service|welcome|redirect) → WF-50 → WF-61(loop counter)`
**Hop-by-hop:**
- **WF-00** — parses text, dedup passes, records message, calls WF-01.
- **WF-01** — Country PASS; Status Lookup → pending row, no user row → `route='existing'` → calls WF-02.
- **WF-02** — Detect Route → `PRE_FORM_TEXT` → Route Switch #1 → calls WF-23.
- **WF-23** — Non-Text? no; Alias? no → Build U3 Payload stage='pre_form' → WF-62.
- **WF-62** — Gemini classifies; a real question → `service_related_question` (or `wants_consultation`); returns {bucket, confidence}.
- **WF-23** — Apply Fail-Open maps service→routeClass='service' → Build Service Answer Request → Generate Service Answer (Gemini, retry 3, error-output to WF-53 U1) → Parse Service Answer → Build Service Message (answer + Fill-Details form) → Call WF-50 (Service); then Build U2 Payload (Service Loop, threshold 10) → WF-61 counter.
- **WF-50** — sends the contextual answer + form nudge; logs to WF-60.
**Outcome:** Friendly factual answer plus the Fill-Details form. No state change (stays pre-form).
**Verdict:** ✅ **Expected / correct** — service question at pre-form gets a grounded answer and a form nudge; sensible terminal.

### S2 / C — Pre-form · STOP keyword
**Scenario:** User has a `pending_users` row but no `users` row and sends exact uppercase "STOP".
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(PRE_FORM_TEXT) → WF-23(non-text? no → alias? YES STOP) → WF-23(Build Clarifier Message) → WF-50 → WF-23(U2 Alias counter) → WF-61`
**Hop-by-hop:**
- **WF-00** — text "STOP"; dedup passes; records; calls WF-01.
- **WF-01** — Country PASS; pending row, no user row → `route='existing'` → calls WF-02. (Note: no STOP intercept here — the WF-20 keyword path is reached only for existing-user text; S2 user is null.)
- **WF-02** — Detect Route → `PRE_FORM_TEXT`; Existing-User Text? false → Route Switch #1 → calls WF-23.
- **WF-23** — Normalize Envelope: keyword="STOP", isAlias=true; Non-Text? false → Opt-Out/Rebook Alias? TRUE → Build Clarifier Message (Alias): "You haven't subscribed to anything yet, so there's nothing to opt out of… tap Fill Details" → Call WF-50 (Alias Clarifier); then Build U2 Payload (Alias, threshold 5) → WF-61 records a silent_drop and increments the alias counter.
- **WF-50** — sends the clarifier text; logs to WF-60.
**Outcome:** Polite clarifier that there's nothing to opt out of yet + form nudge. No `opted_out` transition (correct — opt-out only applies once a `users` row exists). No state change.
**Verdict:** ✅ **Expected / correct** — pre-form STOP is handled in WF-23 (not WF-20), reaches a sensible clarifier rather than wrongly flipping a non-existent user to opted_out.

### S2 / D — Pre-form · REBOOK keyword
**Scenario:** User has a `pending_users` row but no `users` row and sends exact uppercase "REBOOK".
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(PRE_FORM_TEXT) → WF-23(alias? YES REBOOK) → WF-23(Build Clarifier Message rebook) → WF-50 → WF-23(U2 Alias counter) → WF-61`
**Hop-by-hop:**
- **WF-00** — text "REBOOK"; dedup passes; records; calls WF-01.
- **WF-01** — pending row, no user row → `route='existing'` → calls WF-02.
- **WF-02** — Detect Route → `PRE_FORM_TEXT` → Route Switch #1 → calls WF-23.
- **WF-23** — Normalize Envelope: keyword="REBOOK", isAlias=true; Non-Text? false → Opt-Out/Rebook Alias? TRUE → Build Clarifier Message (Alias) with rebook branch: "You don't have a previous consultation to rebook yet… tap Fill Details" → Call WF-50 (Alias Clarifier); then WF-61 alias counter (threshold 5).
- **WF-50** — sends the rebook-clarifier; logs to WF-60.
**Outcome:** Clarifier that there's no prior consultation to rebook + form nudge. No transition (the rebook→payment_pending loop requires an existing user). Stays pre-form.
**Verdict:** ✅ **Expected / correct** — pre-form REBOOK correctly does not enter the rebook flow; gives an accurate, on-brand clarifier.

### S2 / E — Pre-form · HELP keyword
**Scenario:** User has a `pending_users` row but no `users` row and sends exact uppercase "HELP".
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(PRE_FORM_TEXT) → WF-23(alias? no) → WF-62(U3 classify=HELP) → WF-23(Apply Fail-Open → help) → WF-50 → WF-61(help-loop counter)`
**Hop-by-hop:**
- **WF-00** — text "HELP"; dedup passes; records; calls WF-01.
- **WF-01** — pending row, no user row → `route='existing'` → calls WF-02.
- **WF-02** — Detect Route → `PRE_FORM_TEXT` → Route Switch #1 → calls WF-23.
- **WF-23** — Normalize Envelope: HELP is NOT in ALIASES (STOP/UNSUBSCRIBE/OPT OUT/OPT-OUT/REBOOK only) → isAlias=false; Non-Text? no → Alias? no → Build U3 Payload stage='pre_form' → WF-62.
- **WF-62** — Gemini classifies "HELP" → `bucket='HELP'` (prompt has explicit HELP bucket for "help / what do I do / how do I start"); returns {bucket, confidence}.
- **WF-23** — Apply Fail-Open: HELP → routeClass='help' → Build Help Message ("Here's how to get started… tap Fill Details", interactive Flow form) → Call WF-50 (Help); then Build U2 Payload (Help Loop, threshold 10) → WF-61 counter.
- **WF-50** — sends the help message + form; logs to WF-60.
**Outcome:** "How to get started" help text with the Fill-Details form. No state change.
**Verdict:** ✅ **Expected / correct** — pre-form HELP routes through the classifier (HELP is not a hard keyword at this state) and lands on the correct help+form reply. Note: behavior depends on Gemini returning bucket='HELP'; if it returns greeting/unrelated the user still gets a form nudge (welcome/redirect), so the fail-open is benign.

### S2 / F — Pre-form · Other reserved-looking keyword (UNSUBSCRIBE / STATS / LIST / APPROVE PAYMENT)
**Scenario:** User has a `pending_users` row but no `users` row and types an admin-ish / alias word such as UNSUBSCRIBE, STATS, LIST, or APPROVE PAYMENT.
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(PRE_FORM_TEXT) → WF-23 → [UNSUBSCRIBE: alias → Clarifier → WF-50] | [STATS/LIST/APPROVE: not alias → WF-62 classify → Fail-Open redirect|silent → WF-50/WF-61]`
**Hop-by-hop:**
- **WF-00** — text; dedup passes; records; calls WF-01.
- **WF-01** — pending row, no user row → `route='existing'` → calls WF-02. (Admin commands are handled ONLY by the Slack-side WF-10/WF-11 — a WhatsApp inbound never reaches them, so these words are just user text here.)
- **WF-02** — Detect Route → `PRE_FORM_TEXT` → Route Switch #1 → calls WF-23.
- **WF-23 (UNSUBSCRIBE)** — Normalize Envelope: "UNSUBSCRIBE" ∈ ALIASES → isAlias=true → Opt-Out/Rebook Alias? TRUE → Build Clarifier Message (Alias, opt-out branch) → WF-50; WF-61 alias counter (threshold 5).
- **WF-23 (STATS / LIST / APPROVE PAYMENT)** — not in ALIASES → isAlias=false → Build U3 Payload → WF-62 classifies (likely `unrelated` → routeClass='redirect' → Build Redirect Message + form → WF-50; or `garbage` → routeClass='silent' → WF-61 silent_drop, threshold 5). Either way no admin action is taken.
**Outcome:** UNSUBSCRIBE → opt-out clarifier + form. STATS/LIST/APPROVE PAYMENT → a redirect-to-form reply (or a silent drop if classified garbage). No admin command is ever executed from WhatsApp. No state change.
**Verdict:** ✅ **Expected / correct** — admin/alias-looking words from a WhatsApp user are correctly treated as ordinary pre-form text; no privilege leak, sensible terminal (clarifier or form nudge).

### S2 / G — Pre-form · Non-text media (image / audio / video / sticker / location / contact)
**Scenario:** User has a `pending_users` row but no `users` row and sends a non-text message (image, voice note, sticker, location, etc.).
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(PRE_FORM_TEXT) → WF-23(Non-Text? YES) → WF-23(Build Deflection Message) → WF-50 → WF-23(U2 Non-Text counter) → WF-61`
**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message default branch: messageType=image/audio/…, messageContent="[IMAGE]"/"[AUDIO]"/…; dedup passes; records; calls WF-01.
- **WF-01** — Country PASS; pending row, no user row → `route='existing'`; envelope carries messageType (non-text), user=null, pendingUser set → calls WF-02.
- **WF-02** — Validate Inputs accepts non-text; Detect Route: the `user===null && pendingUser!==null` branch matches BEFORE the `EXISTING_NON_TEXT` branch (which requires user!==null) → `PRE_FORM_TEXT` → Route Switch #1 → calls WF-23.
- **WF-23** — Normalize Envelope; Non-Text? (messageType != 'text') TRUE → Build Deflection Message (Non-Text): "We can only read text messages here. To share a file, email chinmay_astro@gmail.com … tap Fill Details" → Call WF-50 (Non-Text Deflection); on return Build U2 Payload (Non-Text, threshold 5) → WF-61 records silent_drop + increments non-text counter (auto-block at 5).
- **WF-50** — sends the deflection text; logs to WF-60.
**Outcome:** WhatsApp deflection telling the user this channel is text-only (with email fallback) + form nudge; non-text drop counted toward the threshold-5 auto-block. No state change.
**Verdict:** ✅ **Expected / correct** — pre-form media is deflected with a helpful text-only message and an email escape hatch, while the abuse counter guards against floods. Reaches a real send terminal.

### S2 / H — Pre-form · WhatsApp Flow form submission (nfm_reply)
**Scenario:** User has a `pending_users` row but no `users` row and submits the Birth Details Flow form (interactive `nfm_reply` callback) — the consent boundary.
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(DETAILS_FORM) → WF-22(Extract → Create User → WF-52 channel → Save channel → Payment Instructions) → WF-50`
**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message: interactive/nfm_reply → messageContent=response_json; rawMessage carried; dedup passes; records; calls WF-01.
- **WF-01** — Country PASS; pending row, no user row → `route='existing'`; envelope passes rawMessage + phoneNumber through → calls WF-02.
- **WF-02** — Detect Route: messageType==='interactive' && interactiveType==='nfm_reply' && `user===null && pendingUser!==null` → `DETAILS_FORM` (valid ONLY pre-form, per the DR-1 stage guard) → Route Switch #2 → calls WF-22.
- **WF-22** — Extract Form Data parses `rawMessage.interactive.nfm_reply.response_json` (full_name, DOB, TOB, POB, email, consent) → Create User Record INSERT status='payment_pending' (first write to `users`, satisfies Design Rule #1) → Prepare WF-52 Payload → Ensure Slack Channel Exists (WF-52, the consent-boundary channel create, Design Rule #2) → WF-52 Success? yes → Save Slack Channel ID on user → Prepare Payment Instructions (₹500 UPI + "Payment Completed ✓" button) → Call WF-50.
- **WF-50** — sends the interactive button payment-instructions message; logs to WF-60.
**Outcome:** User row created (status `payment_pending`), Slack consult channel created and persisted, WhatsApp payment instructions with the Payment-Completed button sent. State transition **pre-form → payment_pending**.
**Verdict:** ✅ **Expected / correct** — this is the canonical S2 exit: form submission writes the user, creates the channel, and moves the journey forward. (Minor robustness note: WF-22 has no strict entry guard before `JSON.parse(response_json)` and Create User Record has onError=continueRegularOutput, so a malformed form payload could fall through with empty fields — out of scope for this happy-path cell, but worth a tech-error-handling follow-up.)

### S2 / I — Pre-form · "Payment Completed" button tap (button_reply)
**Scenario:** User has a `pending_users` row but no `users` row and somehow taps a "Payment Completed" button (interactive `button_reply`). This button is only ever sent AFTER the form (post-WF-22), so in pure S2 it is essentially unreachable, but trace what the code does if it arrives.
**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route: button_reply but user===null → PRE_FORM_TEXT) → WF-23(Non-Text? YES interactive) → WF-23(Build Deflection Message) → WF-50 → WF-61(non-text counter)`
**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message: interactive/button_reply → messageContent=button id "payment_completed", interactiveLabel="Payment Completed ✓"; dedup passes; records; calls WF-01.
- **WF-01** — pending row, no user row → `route='existing'`; envelope passes messageType='interactive' + rawMessage → calls WF-02.
- **WF-02** — Detect Route: the `button_reply && user!==null && status==='payment_pending'` (PAYMENT_CONFIRM) branch FAILS because user===null; the post-consult button branch also requires user!==null → falls through to `user===null && pendingUser!==null` → `PRE_FORM_TEXT` → Route Switch #1 → calls WF-23.
- **WF-23** — Normalize Envelope (messageType='interactive'); Non-Text? (messageType != 'text') TRUE → Build Deflection Message (Non-Text): "We can only read text messages here… tap Fill Details" → Call WF-50 (Non-Text Deflection); then Build U2 Payload (Non-Text, threshold 5) → WF-61 silent_drop + counter.
- **WF-50** — sends the text-only deflection; logs to WF-60.
**Outcome:** User gets the generic "text-only, email files, tap Fill Details" deflection (treated as non-text), plus a non-text drop counted. No state change.
**Verdict:** ➖ **N/A** — the "Payment Completed" button is only emitted by WF-22 *after* the form is submitted (i.e. once a `users` row exists), so a genuine S2 user (no users row) has no such button to tap; the input is not reachable in this state. (If it did arrive via replay, the code degrades safely to the non-text deflection rather than mis-confirming a payment — acceptable, but the cell itself is impossible by construction.)

### S3 / A — payment_pending · "Hi"/greeting

**Scenario:** User has a `users` row with status='payment_pending' (form submitted, consult channel created, awaiting ₹500) and sends a plain greeting like "Hi".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? TRUE → WF-20) → WF-20(no keyword match → passthrough) → WF-02(Keyword Passthrough? → Route Switch=PAYMENT_PENDING_TEXT) → WF-30 → WF-25(general_enquiry) → WF-30(Gemini general response) → WF-50`

**Hop-by-hop:**
- **WF-00** — Parses text, dedup passes, records message id, logs inbound to WF-60, calls WF-01.
- **WF-01** — Country Filter PASS (91/61); Status Lookup finds users row (status payment_pending), no blocked/opted_out → route 'existing'; builds envelope with `user` object; not blocked/opted_out/brand_new → calls WF-02.
- **WF-02** — Validate Inputs passes; Detect Route: user≠null, text, status='payment_pending' → route PAYMENT_PENDING_TEXT. "Existing-User Text?" TRUE (text + user≠null) → calls WF-20 first.
- **WF-20** — Normalize Keyword uppercases "HI"; Match Keyword: not HELP/STOP/REBOOK → fallback 'extra' → Set Passthrough (action='passthrough'). Returns to WF-02.
- **WF-02** — "Keyword Passthrough?" TRUE → Restore Route Data (re-reads Detect Route = PAYMENT_PENDING_TEXT) → Route Switch output PAYMENT_PENDING_TEXT → calls WF-30.
- **WF-30** — calls WF-25 (intent classifier) with messageContent/userStatus. WF-25 Gemini classifies a greeting → general_enquiry → returns intentResult. "Is Pass-Through Intent?" (≠stop_intent) TRUE → "Is General Enquiry?" TRUE → Prepare Gemini Response Prompt → Gemini General Response → Extract Gemini Reply → Send via WF-50.
- **WF-50** — Sends the warm Gemini reply (acknowledges greeting + gentle ₹500 payment nudge) on WhatsApp; logs outbound.

**Outcome:** Friendly contextual WhatsApp reply greeting the user and reminding them to complete the ₹500 payment. No state change (stays payment_pending).

**Verdict:** ✅ **Expected / correct** — greeting reaches a sensible terminal: keyword handler correctly passes through, WF-30 classifies as general enquiry and Gemini replies warmly while nudging payment.

### S3 / B — payment_pending · Free-form question

**Scenario:** A payment_pending user sends a real astrology question ("When will I get married?").

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20 passthrough → PAYMENT_PENDING_TEXT) → WF-30 → WF-25(general_enquiry|wants_consultation) → WF-30(Gemini reply OR payment reminder) → WF-50`

**Hop-by-hop:**
- **WF-00** — Parses text, dedup/log, calls WF-01.
- **WF-01** — PASS; users row found, route 'existing' → WF-02.
- **WF-02** — Detect Route → PAYMENT_PENDING_TEXT; "Existing-User Text?" TRUE → WF-20.
- **WF-20** — Not a keyword → passthrough → returns.
- **WF-02** — Keyword Passthrough TRUE → Route Switch → WF-30.
- **WF-30** — WF-25 classifies the question → typically general_enquiry (or wants_consultation if booking-flavoured). "Is Pass-Through Intent?" TRUE. If general_enquiry → Gemini General Response answers briefly + payment nudge → Extract Gemini Reply → WF-50. If wants_consultation/rebook_intent → "Is General Enquiry?" FALSE → Prepare Payment Reminder → WF-50.
- **WF-25** — Gemini gemini-2.5-flash-lite returns one intent category; on Gemini failure the error branch builds U1 payload → WF-53 (user-facing error), and Parse Intent falls back to general_enquiry.
- **WF-50** — Delivers the answer (or payment-details reminder) on WhatsApp; logs outbound.

**Outcome:** Contextual WhatsApp reply — either a brief factual answer with a payment nudge, or payment instructions. No state change.

**Verdict:** ✅ **Expected / correct** — free-form text correctly runs the intent classifier (Design Rule #6) and reaches a sensible reply terminal with payment reminder.

### S3 / C — payment_pending · STOP

**Scenario:** A payment_pending user sends exact keyword "STOP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match=STOP → WF-47) → WF-47(status→opted_out, close consult, notify admin) → WF-50 (opt-out confirmation)`

**Hop-by-hop:**
- **WF-00** — Parses text "STOP", dedup/log, calls WF-01.
- **WF-01** — PASS; users row found (still payment_pending, not yet opted_out) → route 'existing' → WF-02.
- **WF-02** — Detect Route → PAYMENT_PENDING_TEXT; "Existing-User Text?" TRUE → calls WF-20 (keyword intercept runs before classifier per Design Rule #5).
- **WF-20** — Normalize "STOP"; Match Keyword STOP branch (also matches UNSUBSCRIBE/OPT OUT) → Call WF-47 Unsubscribe with phoneNumber/userId/userStatus.
- **WF-47** — "Was Consultation Active?" FALSE (status=payment_pending) → Update User Status to opted_out (RETURNING slack_channel_id, clears current_consultation_id) → "Has Slack Channel?" TRUE (channel was created at form submit) → Prepare WF-51 opt-out notice → Notify Admin via WF-51 → Prepare WF-50 opt-out confirmation → Send via WF-50.
- **WF-50** — Sends "You have been unsubscribed from Chinmay Astro…" to the user; logs outbound. WF-51 posts opt-out notice to the consult Slack channel.

**Outcome:** User transitioned payment_pending → opted_out; opt-out confirmation sent on WhatsApp; admin notified in Slack; channel preserved (DR-10). User can re-engage by messaging again.

**Verdict:** ✅ **Expected / correct** — STOP is an exact-match keyword intercept handled before the classifier; opts the user out and confirms, channel preserved for future REBOOK.

### S3 / D — payment_pending · REBOOK

**Scenario:** A payment_pending user sends exact keyword "REBOOK".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match=REBOOK → WF-45) → WF-45(Load User, routeClass='happy' → set payment_pending → send payment button) → WF-50`

**Hop-by-hop:**
- **WF-00** — Parses "REBOOK", dedup/log, calls WF-01.
- **WF-01** — PASS; users row found → route 'existing' → WF-02.
- **WF-02** — Detect Route → PAYMENT_PENDING_TEXT; "Existing-User Text?" TRUE → WF-20.
- **WF-20** — Match Keyword REBOOK branch → Route to Rebook (WF-45) with phoneNumber/userId.
- **WF-45** — Load User Record (status=payment_pending); Classify Rebook State: not setup/under_review/active → routeClass='happy'. Route by State 'happy' (output #3) → Set status=payment_pending (idempotent UPDATE, stage=NULL) → Prepare WF-50 Payload (Rebook Payment) interactive button ("Payment Completed") → Send Payment Instructions via WF-50.
- **WF-50** — Sends "Welcome back, {name}!… ₹500… tap the button below" with the Payment Completed button; logs outbound.

**Outcome:** User stays payment_pending (re-confirmed) and receives the payment-instructions button message. Sensible: a payment_pending user asking to rebook is simply re-shown the payment step.

**Verdict:** ✅ **Expected / correct** — REBOOK keyword intercept reaches WF-45's 'happy' branch, which re-issues the payment button for an already-payment_pending user.

### S3 / E — payment_pending · HELP

**Scenario:** A payment_pending user sends exact keyword "HELP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match=HELP → Send HELP Response) → WF-50`

**Hop-by-hop:**
- **WF-00** — Parses "HELP", dedup/log, calls WF-01.
- **WF-01** — PASS; users row found → route 'existing' → WF-02.
- **WF-02** — Detect Route → PAYMENT_PENDING_TEXT; "Existing-User Text?" TRUE → WF-20.
- **WF-20** — Match Keyword HELP branch → Send HELP Response. The HELP text node branches on user.status: status='payment_pending' → "To complete your booking, please send ₹500 via GPay/PhonePe/UPI to +91-9653240263 (Chinmay Mujumdar). Once done, tap the *Payment Completed ✓* button…" → calls WF-50 (text).
- **WF-50** — Delivers the status-specific HELP/payment text on WhatsApp; logs outbound.

**Outcome:** User receives the payment-completion HELP message tailored to payment_pending state. No state change.

**Verdict:** ✅ **Expected / correct** — HELP keyword intercept returns a contextual, status-aware help message pointing the user at the payment step.

### S3 / F — payment_pending · Other reserved-looking keyword (UNSUBSCRIBE / STATS / LIST / APPROVE PAYMENT)

**Scenario:** A payment_pending user types an admin-ish or alias word (e.g. "UNSUBSCRIBE", "STATS", "LIST", "APPROVE PAYMENT").

**Traversal chain (UNSUBSCRIBE):**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match=STOP alias → WF-47) → WF-50 (opt-out)`
**Traversal chain (STATS / LIST / APPROVE PAYMENT):**
`WF-00 → WF-01(route=existing) → WF-02(→ WF-20 fallback passthrough → PAYMENT_PENDING_TEXT) → WF-30 → WF-25 → WF-30(Gemini reply | payment reminder) → WF-50`

**Hop-by-hop:**
- **WF-00 / WF-01 / WF-02** — Same as scenario A/B: existing user, PAYMENT_PENDING_TEXT, "Existing-User Text?" TRUE → WF-20.
- **WF-20 (UNSUBSCRIBE)** — Match Keyword STOP branch explicitly includes "UNSUBSCRIBE" / "OPT OUT" / "OPT-OUT" → Call WF-47 → opt-out (identical terminal to scenario C).
- **WF-20 (STATS / LIST / APPROVE PAYMENT)** — None of these match HELP/STOP/REBOOK; admin commands live in WF-10/WF-11 (Slack side) and are unreachable from the WhatsApp inbound path → fallback 'extra' → Set Passthrough → returns to WF-02 → Route Switch PAYMENT_PENDING_TEXT → WF-30 → WF-25 classifies (almost always general_enquiry/garbage) → contextual Gemini reply or payment reminder → WF-50.

**Outcome:** "UNSUBSCRIBE" correctly opts the user out (alias of STOP). "STATS"/"LIST"/"APPROVE PAYMENT" are treated as ordinary user text and answered with a payment-nudge reply — they do NOT trigger any admin action (admin commands are Slack-only). No erroneous state change.

**Verdict:** ✅ **Expected / correct** — UNSUBSCRIBE is a legitimate STOP alias; admin-looking words from a WhatsApp user are harmlessly classified as general text and answered, never executing admin logic.

### S3 / G — payment_pending · Non-text media (image/video/audio/sticker/location/contact)

**Scenario:** A payment_pending user sends a non-text message (e.g. an image or voice note).

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route=EXISTING_NON_TEXT → Route Switch) → WF-61(U2 silent-drop + threshold) → WF-02(Non-Text Blocked? FALSE → Build Deflection) → WF-50 (email-us deflection)`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message default branch sets messageContent="[IMAGE]"/"[AUDIO]"/etc., messageType = raw type; dedup/log; calls WF-01.
- **WF-01** — PASS; users row found → route 'existing' (WF-01 no longer drops non-text); envelope carries messageType non-text → WF-02.
- **WF-02** — Validate Inputs accepts non-text; Detect Route: user≠null AND messageType≠text AND ≠interactive → route EXISTING_NON_TEXT. "Existing-User Text?" FALSE → Route Switch output #0 EXISTING_NON_TEXT → Build U2 Payload (Non-Text) (reason='non_text', blockThreshold=10, blockReason='threshold_non_text') → Call WF-61.
- **WF-61** — Entry Guard validates the envelope (keys match: phoneNumber/messageType/reason/messageContent/blockThreshold/blockReason) → Insert Silent Drop row → Count 30-Day Drops → "Threshold Reached?" (>=10). Below threshold → Return Not Blocked (blocked=false). Returns to WF-02.
- **WF-02** — "Non-Text Blocked?" reads blocked===true; FALSE (output #1) → Build Deflection Payload ("This service supports text messages only… please email it to chinmay_astro@gmail.com…") → Call WF-50. (If threshold hit, blocked=true → output #0 has no connection → silent, since WF-61 already auto-blocked + alerted admin.)
- **WF-50** — Sends the text-only deflection message on WhatsApp; logs outbound.

**Outcome:** Silent-drop row recorded; user receives the polite "text only, email us" deflection (or, on the 10th drop, is auto-blocked with no reply + admin Slack alert). No state change to payment_pending.

**Verdict:** ✅ **Expected / correct** — non-text from an existing user is logged for abuse-thresholding and deflected with a clear text-only message; the WF-02→WF-61 envelope contract matches.

### S3 / H — payment_pending · WhatsApp Flow form re-submission (nfm_reply)

**Scenario:** A payment_pending user somehow sends an interactive nfm_reply (Birth Details form) callback again.

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route: nfm_reply but user≠null → UNHANDLED) → WF-02(Build UNHANDLED Alert) → WF-51 (admin alert)`

**Hop-by-hop:**
- **WF-02 (defensive path only)** — Detect Route's nfm_reply guard: `route = (user===null && pendingUser!==null) ? 'DETAILS_FORM' : 'UNHANDLED'`. For a payment_pending user (user≠null) it yields UNHANDLED → Route Switch output #8 → Build UNHANDLED Alert → WF-51 posts to admin-commands channel. No user-facing reply, no DB write.

**Outcome:** Not reachable in practice — see verdict. The defensive code would raise an admin UNHANDLED alert rather than re-process the form.

**Verdict:** ➖ **N/A** — Meta locks the Flow form bubble after the first submission, and the form is only ever sent to a pre-form/new user; a payment_pending user cannot emit a second nfm_reply. The DETAILS_FORM route is gated to `user===null && pendingUser!==null`, so even defensively it falls through to a harmless UNHANDLED admin alert.

### S3 / I — payment_pending · "Payment Completed" button (button_reply)

**Scenario:** A payment_pending user taps the "Payment Completed" interactive button (button_reply id `payment_completed`).

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route=PAYMENT_CONFIRM → Route Switch) → WF-32(not already submitted → create payment, status→payment_submitted) → WF-50 (user confirmation) + WF-51 (admin APPROVE prompt)`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message interactive/button_reply branch: messageContent=button id, interactiveLabel="Payment Completed"; Build WF-60 Payload uses interactiveLabel as content; dedup/log; calls WF-01.
- **WF-01** — PASS; users row found (payment_pending) → route 'existing'; rawMessage passed through for interactive routing → WF-02.
- **WF-02** — Detect Route: messageType='interactive', interactiveType='button_reply', user≠null, status='payment_pending' → route PAYMENT_CONFIRM. "Existing-User Text?" FALSE (not text) → Route Switch output #3 PAYMENT_CONFIRM → Call WF-32.
- **WF-32** — "Already Payment Submitted?" FALSE (status is payment_pending) → Create Payment Record (INSERT payments, 500/INR/pending_verification/gpay) → Update User Status to 'payment_submitted' (RETURNING *) → Prepare User Confirmation → Call WF-50 (confirmation) → Prepare Admin Notification (slack_channel_id + APPROVE PAYMENT prompt) → Call WF-51 (notify admin).
- **WF-50** — Sends "Thank you {name}! Your payment confirmation has been received… verify within 24 hours…" on WhatsApp; logs outbound.
- **WF-51** — Posts "🔔 New Payment Submission… run `APPROVE PAYMENT {phone}`" to the user's consult Slack channel.

**Outcome:** User transitioned payment_pending → payment_submitted; payment record created; user gets a confirmation; Chinmay gets a Slack prompt to approve. This is the intended happy-path transition for this state.

**Verdict:** ✅ **Expected / correct** — the Payment Completed button is the canonical transition out of payment_pending; WF-32 records the payment, flips status, confirms to user, and prompts the admin to approve.

### S4 / A — payment_submitted · Greeting ("Hi")

**Scenario:** User row status='payment_submitted' (payment awaiting admin approval); user sends a plain greeting like "Hi".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match Keyword: fallback=passthrough) → WF-02(Keyword Passthrough? → Restore Route Data → Route Switch=PAYMENT_SUBMITTED_TEXT) → WF-31 → WF-25(general_enquiry) → WF-31(Gemini reply) → WF-50  ‖  WF-31(Load Latest Payment → Relay to Admin Slack → WF-51)`

**Hop-by-hop:**
- **WF-00** — parses text, dedup passes, records message, logs via WF-60, calls WF-01.
- **WF-01** — Country Filter PASS (91/61); Status Lookup finds users row status='payment_submitted', no pending → `Classify & Build Envelope` route='existing'; Blocked/OptedOut/BrandNew all no → calls WF-02 with the full envelope.
- **WF-02** — Validate Inputs OK; Detect Route: user!=null, text, status=payment_submitted → 'PAYMENT_SUBMITTED_TEXT'. `Existing-User Text?` TRUE (text + user!=null) → calls WF-20 first.
- **WF-20** — Normalize Keyword; `Match Keyword` switch: "HI" matches none → fallbackOutput → `Set Passthrough` (action='passthrough').
- **WF-02 (cont.)** — `Keyword Passthrough?` TRUE → `Restore Route Data` ($('Detect Route') full envelope) → `Route Switch` output #5 PAYMENT_SUBMITTED_TEXT → calls WF-31.
- **WF-31** — trigger fans out: (1) `Call WF-25 Intent Classifier` and (2) `Load Latest Payment`. WF-25 classifies "Hi" → general_enquiry. `Is Pass-Through Intent?` TRUE → `Is General Enquiry?` TRUE → `Prepare Gemini Response Prompt` → `Gemini General Response` → `Extract Gemini Reply` → `Send Gemini Reply via WF-50`. In parallel `Prepare Admin Relay` builds "⏱ Paid … 💬 Message from {name} (payment under review)" → `Relay to Admin Slack` (WF-51).
- **WF-50** — delivers the warm Gemini reply (acknowledges greeting + reassures payment under review) on WhatsApp.

**Outcome:** User gets a friendly under-review acknowledgement; admin gets the relayed message with elapsed-since-paid prefix in the consult Slack channel. No state change.

**Verdict:** ✅ **Expected / correct** — greeting reaches a sensible terminal (contextual reassurance reply) and the message is relayed to the admin so the user is not ignored while awaiting approval.

### S4 / B — payment_submitted · Free-form question

**Scenario:** User row status='payment_submitted'; user sends a real astrology question (e.g. "When will I get married?").

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(WF-20 passthrough → Route Switch=PAYMENT_SUBMITTED_TEXT) → WF-31 → WF-25(general_enquiry|wants_consultation|rebook_intent|feedback_intent) → WF-31(general → Gemini reply | else → Under-Review msg) → WF-50  ‖  WF-31(Relay to Admin Slack → WF-51)`

**Hop-by-hop:**
- **WF-00 / WF-01 / WF-02 / WF-20** — identical to scenario A: text + user!=null → WF-20 fallback passthrough → Route Switch PAYMENT_SUBMITTED_TEXT → WF-31.
- **WF-31** — WF-25 classifies the question. If `general_enquiry` → Gemini general response → reply via WF-50. If a non-passthrough-blocked intent like `wants_consultation`/`rebook_intent`/`feedback_intent` → `Is General Enquiry?` FALSE → `Prepare Under Review Message` ("⏳ Your payment is currently under review…") → `Send Under Review via WF-50`. Always-on `Load Latest Payment → Prepare Admin Relay → Relay to Admin Slack` relays the question to the admin channel.
- **WF-50** — delivers either a Gemini-authored contextual answer or the canned under-review message.

**Outcome:** User receives a relevant reply (answered briefly or reassured payment is under review); admin sees the question relayed to the consult channel so Chinmay can act. No state change.

**Verdict:** ✅ **Expected / correct** — a real question reaches a contextual terminal and is escalated to the admin; appropriate handling for a user blocked on approval.

### S4 / C — payment_submitted · STOP keyword

**Scenario:** User row status='payment_submitted'; user sends exact "STOP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match Keyword=STOP → WF-47) → WF-47(set opted_out + admin notice + WA confirmation) → WF-50/WF-51`

**Hop-by-hop:**
- **WF-00 / WF-01** — as above; route='existing', calls WF-02.
- **WF-02** — Detect Route → PAYMENT_SUBMITTED_TEXT but `Existing-User Text?` TRUE → WF-20 runs FIRST (keyword intercept before any intent classifier, per Design Rule 5).
- **WF-20** — Normalize Keyword keyword="STOP"; `Match Keyword` output #1 (STOP/UNSUBSCRIBE/OPT-OUT) → `Call WF-47 Unsubscribe`, passing phoneNumber, userId (=$json.user.id), userStatus (=$json.user.status='payment_submitted'). This branch does NOT passthrough — terminal.
- **WF-47** — `Was Consultation Active?` FALSE (status=payment_submitted) → skip Close Open Consultation → `Update User Status to opted_out` (status='opted_out', current_consultation_id=NULL); `Has Slack Channel?` — if a consult channel exists (created at form submission per DR-2) → notify admin via WF-51 + send opt-out confirmation; else just send confirmation → `Send Opt-out Confirmation via WF-50`.
- **WF-50/WF-51** — WhatsApp opt-out confirmation to user; (optional) admin opt-out notice to consult channel.

**Outcome:** Status → opted_out, consultation_id cleared, WA confirmation sent, admin notified. State transition payment_submitted → opted_out.

**Verdict:** ✅ **Expected / correct** — STOP is an exact-match keyword intercept handled before the classifier; opts the user out and confirms, matching DR-4/DR-5.

### S4 / D — payment_submitted · REBOOK keyword

**Scenario:** User row status='payment_submitted'; user sends exact "REBOOK".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match Keyword=REBOOK → WF-45) → WF-45(Load User → routeClass=under_review) → WF-50`

**Hop-by-hop:**
- **WF-00 / WF-01 / WF-02** — text + user!=null → WF-20 first.
- **WF-20** — keyword="REBOOK"; `Match Keyword` output #2 → `Route to Rebook` (WF-45), passing phoneNumber, userId. Terminal (no passthrough).
- **WF-45** — `Load User Record` reads users row; `Classify Rebook State`: status==='payment_submitted' → routeClass='under_review'; `Route by State` output #1 → `Build Under-Review Message` ("Your payment is still being reviewed — please wait for confirmation before booking again…") → `Call WF-50 (Under Review)`.
- **WF-50** — delivers the under-review wait message.

**Outcome:** User told to wait for payment confirmation before rebooking; no state change.

**Verdict:** ✅ **Expected / correct** — REBOOK while payment is under review correctly refuses to restart the booking loop and explains why, instead of re-triggering payment.

### S4 / E — payment_submitted · HELP keyword

**Scenario:** User row status='payment_submitted'; user sends exact "HELP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match Keyword=HELP → Send HELP Response) → WF-50`

**Hop-by-hop:**
- **WF-00 / WF-01 / WF-02** — text + user!=null → WF-20 first.
- **WF-20** — keyword="HELP"; `Match Keyword` output #0 → `Send HELP Response` (WF-50). The status-aware ternary picks the `payment_submitted` branch: "Your payment is under review. Chinmay will approve it shortly — please wait! 🙏". Terminal (no passthrough).
- **WF-50** — delivers the status-specific HELP text.

**Outcome:** User receives a payment_submitted-specific HELP message; no state change.

**Verdict:** ✅ **Expected / correct** — HELP is intercepted before the classifier and returns the correct status-tailored guidance.

### S4 / F — payment_submitted · Other reserved-looking keyword (UNSUBSCRIBE / STATS / LIST / APPROVE PAYMENT)

**Scenario:** User row status='payment_submitted'; user types an admin-ish / alias word such as STATS, LIST, or APPROVE PAYMENT (UNSUBSCRIBE is handled as STOP — see note).

**Traversal chain (STATS/LIST/APPROVE PAYMENT):**
`WF-00 → WF-01(route=existing) → WF-02(WF-20) → WF-20(Match Keyword: fallback=passthrough) → WF-02(Route Switch=PAYMENT_SUBMITTED_TEXT) → WF-31 → WF-25 → WF-31(reply) → WF-50  ‖  WF-31(Relay to Admin Slack → WF-51)`

**Hop-by-hop:**
- **WF-20** — `Match Keyword` only matches HELP / STOP·UNSUBSCRIBE·OPT-OUT / REBOOK. UNSUBSCRIBE → STOP branch → WF-47 (same terminal as scenario C). STATS / LIST / APPROVE PAYMENT match nothing → fallbackOutput → `Set Passthrough`. (Admin commands are a Slack-side concern — WF-10/WF-11; the WhatsApp inbound path has no admin-command parsing, so these are correctly treated as ordinary user text.)
- **WF-02 (cont.)** — passthrough → Route Switch PAYMENT_SUBMITTED_TEXT → WF-31.
- **WF-31** — WF-25 classifies the word. "APPROVE PAYMENT"/"STATS"/"LIST" most likely → general_enquiry (or garbage if gibberish-like). general_enquiry → Gemini reply; garbage → WF-25 internally escalates to WF-61 (silent-drop log; block only at threshold=10) and returns nothing, so WF-31 sends no user reply but the admin relay (always-on) still posts the message.
- **WF-50 / WF-51** — Gemini reply to user (general path) and/or admin relay of the raw message.

**Outcome:** UNSUBSCRIBE → opt-out (as STOP). STATS/LIST/APPROVE PAYMENT → treated as free-form text: contextual Gemini reply + admin relay (or silent-drop log if classified garbage). No admin privilege is ever granted to a WhatsApp user. No state change (except UNSUBSCRIBE→opted_out).

**Verdict:** ✅ **Expected / correct** — admin-looking words from a WhatsApp user are correctly NOT executed as admin commands; they fall through to ordinary intent handling, and UNSUBSCRIBE is properly aliased to STOP.

### S4 / G — payment_submitted · Non-text media

**Scenario:** User row status='payment_submitted'; user sends an image/video/audio/sticker/location/contact (messageType non-text).

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route=EXISTING_NON_TEXT) → Route Switch#0 → WF-61(U2 silent-drop + threshold) → WF-02(Non-Text Blocked? FALSE → Build Deflection Payload) → WF-50`

**Hop-by-hop:**
- **WF-00** — messageType is the raw type (e.g. 'image'); content set to "[IMAGE]" etc.; calls WF-01.
- **WF-01** — route='existing' (users row exists); calls WF-02 with messageType non-text.
- **WF-02** — Detect Route: user!=null AND messageType!=='text' AND !=='interactive' → 'EXISTING_NON_TEXT'. `Existing-User Text?` FALSE (not text) → `Route Switch` output #0 EXISTING_NON_TEXT → `Build U2 Payload (Non-Text)` (reason='non_text', blockThreshold=10, blockReason='threshold_non_text') → `Call WF-61 (U2 Non-Text Escalate)`.
- **WF-61** — Entry Guard OK; `Insert Silent Drop`; `Count 30-Day Drops`; `Threshold Reached?` — at <10 drops → `Return Not Blocked` (blocked=false). (At ≥10 → auto-block + admin alert.)
- **WF-02 (cont.)** — `Non-Text Blocked?` reads blocked===true → FALSE branch (#1) → `Build Deflection Payload` ("This service supports text messages only… please email it to chinmay_astro@gmail.com…") → `Call WF-50 (Non-Text Deflection)`.
- **WF-50** — delivers the text-only deflection message.

**Outcome:** Silent-drop logged; user receives the text-only deflection with the email fallback; no state change (block only after 10 non-text messages in 30 days).

**Verdict:** ✅ **Expected / correct** — non-text from an existing user is logged for abuse-threshold tracking and the user gets a helpful deflection rather than a dead-end.

### S4 / H — payment_submitted · WhatsApp Flow form re-submission (nfm_reply)

**Scenario:** User row status='payment_submitted'; a Birth Details Flow form nfm_reply callback arrives.

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route: nfm_reply but user!=null → UNHANDLED) → Route Switch#8 → Build UNHANDLED Alert → WF-51`

**Hop-by-hop:**
- **WF-02** — Detect Route nfm_reply guard: `route = (user === null && pendingUser !== null) ? 'DETAILS_FORM' : 'UNHANDLED'`. Here user!=null → 'UNHANDLED' → `Route Switch` output #8 → `Build UNHANDLED Alert` → `Call WF-51` (admin alert, no user reply).

**Outcome:** Defensive UNHANDLED admin alert only; no user-visible effect.

**Verdict:** ➖ **N/A** — impossible in this state: a Flow form is only ever sent to a pre-form/new user, and Meta locks the form bubble after the first submit, so a payment_submitted user cannot re-submit. The DR-1 stage guard in WF-02 Detect Route correctly maps the (impossible) leak to UNHANDLED.

### S4 / I — payment_submitted · "Payment Completed" button (button_reply)

**Scenario:** User row status='payment_submitted'; user taps the "Payment Completed" interactive button again (button_reply id=payment_completed).

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route: button_reply but status!=payment_pending → UNHANDLED) → Route Switch#8 → Build UNHANDLED Alert → WF-51`

**Hop-by-hop:**
- **WF-00** — interactive button_reply; content=button id, interactiveLabel=title; calls WF-01.
- **WF-01** — route='existing'; passes rawMessage so WF-02 can read interactive type; calls WF-02.
- **WF-02** — Detect Route: the PAYMENT_CONFIRM branch requires `userStatus === 'payment_pending'`. Here status='payment_submitted', so that branch is skipped; button_reply is not text/non-text and matches no other branch → final else → 'UNHANDLED'. `Existing-User Text?` FALSE (not text) → `Route Switch` output #8 UNHANDLED → `Build UNHANDLED Alert` → `Call WF-51` (admin alert to C0A5B0ZE81E). No user-facing reply.
- **WF-51** — posts "⚠️ The system couldn't route this message… Interactive type: button_reply… User status: payment_submitted" to the admin channel.

**Outcome:** Admin gets an UNHANDLED alert; the user who re-tapped "Payment Completed" receives NO acknowledgement.

**Verdict:** ⚠️ **Needs fixing** [P2] — a double-tap of "Payment Completed" by an already-submitted user is a normal, expected user action (impatience while waiting for approval), but Detect Route's PAYMENT_CONFIRM guard is restricted to status==='payment_pending', so the re-tap falls to UNHANDLED → admin alert + silent for the user. Evidence: WF-02 `Detect Route` branch `messageType === 'interactive' && interactiveType === 'button_reply' && userStatus === 'payment_pending'` only — there is no payment_submitted button_reply branch, and the final else assigns 'UNHANDLED'. Preferred fix: treat a payment_completed button_reply from a payment_submitted user as an idempotent no-op that sends the under-review reassurance (route to WF-31 / a PAYMENT_SUBMITTED handler) rather than an UNHANDLED admin alert. Severity P2 (not P0): no data corruption and admin is notified, but it leaves the user unacknowledged on a plausible repeat action.

### S5 / A — Consultation active · "Hi"/greeting

**Scenario:** User has a `users` row with `status='consultation_active'` (consult Slack channel live) and sends a plain greeting like "Hi" / "Namaste".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? yes → WF-20) → WF-20(no keyword match → fallback "extra" → Set Passthrough) → WF-02(Keyword Passthrough? yes → Route Switch → RELAY) → WF-40 → WF-25(Active Consultation? yes → Return to Caller) → WF-40(Format Slack) → WF-51`

**Hop-by-hop:**
- **WF-00** — parses text, dedup passes, records message, calls WF-01
- **WF-01** — Country Filter PASS; Status Lookup finds users row with status `consultation_active` → route `existing`; Blocked/OptedOut/BrandNew all no → calls WF-02
- **WF-02** — Validate Inputs passes; Detect Route: user≠null & status=`consultation_active` & text → route `RELAY`; but `Existing-User Text?` (text && user≠null) is TRUE → first calls WF-20 to screen for keyword intercepts
- **WF-20** — Normalize Keyword → "HI"; Match Keyword has no HI rule → fallbackOutput `extra` → Set Passthrough (`action:'passthrough'`)
- **WF-02** — Keyword Passthrough? yes → Restore Route Data (re-loads Detect Route output, route=`RELAY`) → Route Switch output #6 RELAY → calls WF-40
- **WF-40** — calls WF-25 with the relay envelope (classifier runs but its result is discarded by WF-40); WF-25 Active Consultation? yes → Return to Caller (no user-facing side effect in active state); WF-40 Format Slack Message builds `📲 *<name>:* Hi`
- **WF-51** — posts the greeting to the consult Slack channel; WF-60 logs it

**Outcome:** Greeting relayed verbatim into the user's consult Slack channel for Chinmay; no state change.
**Verdict:** ✅ **Expected / correct** — in an active consultation every free-form text (including greetings) is relayed to the astrologer; classifier is invoked but correctly short-circuits in active state.

### S5 / B — Consultation active · Free-form astrology question

**Scenario:** User in `consultation_active` sends a real astrology question, e.g. "When will I get married?".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? yes → WF-20) → WF-20(no match → passthrough) → WF-02(passthrough → Route Switch → RELAY) → WF-40 → WF-25(Active Consultation? yes → Return to Caller) → WF-40(Format Slack) → WF-51`

**Hop-by-hop:**
- **WF-00** — parses text, records, calls WF-01
- **WF-01** — route `existing` (users row, status `consultation_active`); calls WF-02
- **WF-02** — Detect Route → `RELAY`; Existing-User Text? TRUE → WF-20 first
- **WF-20** — keyword normalises to "WHEN WILL I GET MARRIED?"; no keyword rule matches → fallback `extra` → Set Passthrough
- **WF-02** — Keyword Passthrough? yes → Restore Route Data → Route Switch RELAY → WF-40
- **WF-40** — invokes WF-25 (classifier); WF-25 Active Consultation? yes → Return to Caller (in active state the classifier deliberately does nothing user-facing — no garbage/abuse warning, no auto-reply); WF-40 then ignores intent and Format Slack Message builds `📲 *<name>:* When will I get married?`
- **WF-51** — posts the question to the consult Slack channel; WF-60 logs

**Outcome:** Question relayed to Chinmay in the consult channel; no auto-reply, no state change. Chinmay answers manually (his reply comes back via WF-41).
**Verdict:** ✅ **Expected / correct** — the core consultation behavior: user questions flow straight to the astrologer in Slack.

### S5 / C — Consultation active · STOP

**Scenario:** User in `consultation_active` sends the exact keyword "STOP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? yes → WF-20) → WF-20(Match Keyword → STOP) → WF-47(close consult + opt-out) → WF-51(admin notice) + WF-50(user confirmation)`

**Hop-by-hop:**
- **WF-00** — parses "STOP", records, calls WF-01
- **WF-01** — route `existing`; calls WF-02
- **WF-02** — Detect Route → RELAY; Existing-User Text? TRUE → WF-20
- **WF-20** — Normalize → "STOP"; Match Keyword STOP branch (output #1) → Call WF-47 emitting `phoneNumber`, `userId`, `userStatus`(=consultation_active)
- **WF-47** — Was Consultation Active? yes (userStatus=consultation_active) → Close Open Consultation (UPDATE consultations SET status='closed', closed_by='user_opted_out') → Update User Status to opted_out (status='opted_out', current_consultation_id=NULL, RETURNING slack_channel_id) → Has Slack Channel? yes → Prepare WF-51 opt-out notice → WF-51 posts admin notice to consult channel → Prepare WF-50 opt-out confirmation → WF-50 sends "You have been unsubscribed…" to user
- **WF-51 / WF-50** — Slack admin notice posted; WhatsApp opt-out confirmation delivered

**Outcome:** Active consultation closed, user → `opted_out`, channel preserved (DR-10), admin notified in Slack, user gets WA confirmation.
**Verdict:** ✅ **Expected / correct** — STOP is an exact-match intercept (Design Rule 5) that runs before the classifier; cleanly closes the live consultation and opts the user out.

### S5 / D — Consultation active · REBOOK

**Scenario:** User in `consultation_active` sends the exact keyword "REBOOK".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? yes → WF-20) → WF-20(Match Keyword → REBOOK) → WF-45(Load User → routeClass=active) → WF-50`

**Hop-by-hop:**
- **WF-00** — parses "REBOOK", records, calls WF-01
- **WF-01** — route `existing`; calls WF-02
- **WF-02** — Detect Route → RELAY; Existing-User Text? TRUE → WF-20
- **WF-20** — Normalize → "REBOOK"; Match Keyword REBOOK branch (output #2) → Route to Rebook (WF-45) emitting `phoneNumber`, `userId`
- **WF-45** — Load User Record (status=consultation_active) → Classify Rebook State → routeClass `active` → Route by State output #2 → Build Active Message → Call WF-50 (Active)
- **WF-50** — sends "You're currently in an active consultation. Please complete it first…" to the user

**Outcome:** User is told to finish the current consultation before rebooking; no state change.
**Verdict:** ✅ **Expected / correct** — REBOOK is correctly deflected while a consultation is live (DR-10 / state machine: rebook is valid only from `consultation_closed`).

### S5 / E — Consultation active · HELP

**Scenario:** User in `consultation_active` sends the exact keyword "HELP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? yes → WF-20) → WF-20(Match Keyword → HELP) → WF-50`

**Hop-by-hop:**
- **WF-00** — parses "HELP", records, calls WF-01
- **WF-01** — route `existing`; calls WF-02
- **WF-02** — Detect Route → RELAY; Existing-User Text? TRUE → WF-20
- **WF-20** — Normalize → "HELP"; Match Keyword HELP branch (output #0) → Send HELP Response; the WF-50 payload's content expression branches on user.status — for `consultation_active` it emits "You are in an active consultation! Just type your question and Chinmay will respond. 🌟"
- **WF-50** — delivers the state-appropriate HELP message to the user

**Outcome:** Contextual HELP reply tailored to the active-consultation state; no state change.
**Verdict:** ✅ **Expected / correct** — HELP is an exact-match intercept before the classifier and returns the correct state-specific guidance.

### S5 / F — Consultation active · Other reserved-looking keyword (UNSUBSCRIBE / STATS / LIST / APPROVE PAYMENT)

**Scenario:** User in `consultation_active` types an admin-ish or alias word. Behavior splits by word.

**Traversal chain (UNSUBSCRIBE):**
`WF-00 → WF-01(existing) → WF-02(WF-20) → WF-20(Match Keyword STOP-branch: UNSUBSCRIBE alias) → WF-47 → WF-51 + WF-50`
**Traversal chain (STATS / LIST / APPROVE PAYMENT):**
`WF-00 → WF-01(existing) → WF-02(WF-20) → WF-20(no match → passthrough) → WF-02(RELAY) → WF-40 → WF-25(active → Return) → WF-40 → WF-51`

**Hop-by-hop:**
- **WF-00 / WF-01** — text, route `existing`, into WF-02 → Existing-User Text? TRUE → WF-20
- **WF-20 (UNSUBSCRIBE)** — Match Keyword STOP rule is an OR over STOP / UNSUBSCRIBE / OPT OUT / OPT-OUT → matches → Call WF-47 → exactly the STOP flow (closes consult, opts out, admin notice + WA confirmation)
- **WF-20 (STATS / LIST / APPROVE PAYMENT)** — none of these match HELP/STOP/REBOOK → fallback `extra` → Set Passthrough
- **WF-02** — Keyword Passthrough? yes → Route Switch RELAY → WF-40 → WF-25 (active → Return to Caller) → Format Slack → WF-51 posts `📲 *<name>:* STATS` (or LIST / APPROVE PAYMENT) into the consult channel

**Outcome:** UNSUBSCRIBE → user opted out (alias of STOP). STATS / LIST / APPROVE PAYMENT → relayed to Chinmay as ordinary consultation text.
**Verdict:** ✅ **Expected / correct** — admin commands typed by a user over WhatsApp carry no privilege (admin commands arrive via Slack WF-10, not WA); relaying them as plain text is the safe, sensible terminal. UNSUBSCRIBE correctly aliases STOP.

### S5 / G — Consultation active · Non-text media (image/video/audio/sticker/location/contact)

**Scenario:** User in `consultation_active` sends a non-text message (e.g. an image or voice note); WF-00 sets `messageType` to the raw WhatsApp type (not text/interactive) with content like "[IMAGE]".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route → EXISTING_NON_TEXT → Route Switch #0) → WF-61(silent-drop + threshold) → WF-02(Non-Text Blocked? no → Build Deflection) → WF-50`

**Hop-by-hop:**
- **WF-00** — messageType is the media type; content set to `[IMAGE]`/`[AUDIO]` etc.; records, calls WF-01
- **WF-01** — route `existing`; envelope carries the non-text messageType; calls WF-02
- **WF-02** — Detect Route: user≠null & messageType≠text & ≠interactive → route `EXISTING_NON_TEXT`; Existing-User Text? FALSE (not text) → Route Switch output #0 EXISTING_NON_TEXT → Build U2 Payload (Non-Text) (reason `non_text`, blockThreshold 10, blockReason `threshold_non_text`) → Call WF-61
- **WF-61** — Entry Guard passes → Insert Silent Drop → Count 30-Day Drops → Threshold Reached? (count ≥ 10?) — normally no on first/few → Return Not Blocked (`blocked:false`)
- **WF-02** — Non-Text Blocked? (`blocked===true`) FALSE → Build Deflection Payload ("This service supports text messages only… please email it to chinmay_astro@gmail.com…") → Call WF-50
- **WF-50** — delivers the text-only deflection to the user

**Outcome:** Media silently logged to `silent_drop` (counts toward auto-block threshold); user gets a polite text-only deflection. If threshold of 10 in 30 days is reached, WF-61 auto-blocks and alerts admin, and the deflection is suppressed.
**Verdict:** ✅ **Expected / correct** — non-text in an active consultation is handled by the dedicated U2 escalate path with abuse-throttling, then a clear deflection. Reaches a real terminal.

### S5 / H — Consultation active · WhatsApp Flow form re-submission (nfm_reply)

**Scenario:** A `consultation_active` user would have to re-submit the Birth Details Flow form (interactive `nfm_reply`).

**Traversal chain:**
`WF-00 → WF-01(existing) → WF-02(Detect Route: nfm_reply & user≠null → UNHANDLED → WF-51 admin alert)` — but input is impossible.

**Hop-by-hop:**
- Defensive note only: were such a callback to arrive, WF-02 Detect Route guards `nfm_reply` with `(user===null && pendingUser!==null) ? 'DETAILS_FORM' : 'UNHANDLED'` — an active user (user≠null) yields `UNHANDLED` → Build UNHANDLED Alert → WF-51 to admin channel. No user-facing reply.

**Outcome:** N/A — not reachable in this state.
**Verdict:** ➖ **N/A** — Meta locks the Flow form bubble after the first submit, and the form is only ever sent to a pre-form/new user; a `consultation_active` user has no live form to re-submit. WF-02's `UNHANDLED` guard exists as defense-in-depth.

### S5 / I — Consultation active · "Payment Completed" button (button_reply)

**Scenario:** User in `consultation_active` taps a stale "Payment Completed" button still visible in an old WhatsApp bubble (interactive `button_reply`, id `payment_completed`).

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route: button_reply but status≠payment_pending/closed → falls to status branch → RELAY) → WF-02(Existing-User Text? no → Route Switch → RELAY) → WF-40 → WF-25(active → Return) → WF-40(Format Slack) → WF-51`

**Hop-by-hop:**
- **WF-00** — interactive button_reply; content = `interactiveLabel` ("Payment Completed"), messageType `interactive`; records, calls WF-01
- **WF-01** — route `existing`; envelope passes messageContent="Payment Completed", rawMessage carries interactive.button_reply; calls WF-02
- **WF-02** — Detect Route: the `button_reply` branches only match `payment_pending` (→PAYMENT_CONFIRM) or `consultation_closed` (→POST_CONSULT_TEXT); neither applies; the `messageType≠text && ≠interactive` non-text branch is FALSE (it IS interactive); falls through to `user≠null && status==='consultation_active'` → route `RELAY`. Existing-User Text? FALSE (messageType not text) → Route Switch output #6 RELAY → WF-40
- **WF-40** — WF-25 (active → Return to Caller); Format Slack Message → `📲 *<name>:* Payment Completed`
- **WF-51** — posts the button label into the consult channel; WF-60 logs

**Outcome:** The stray button tap is relayed to Chinmay as ordinary text ("Payment Completed"); no payment/state side effect, no PAYMENT_CONFIRM mis-fire.
**Verdict:** ✅ **Expected / correct** — a stale button in active state is safely treated as a relayed message rather than mis-routed into the payment flow; the status-gated `button_reply` guards in Detect Route correctly prevent a false payment confirmation. Minor cosmetic oddity (Chinmay sees the literal button label) but functionally safe.

### S6 / A — Consultation closed · "Hi"/greeting

**Scenario:** User has a `users` row with `status='consultation_closed'` and sends a plain greeting ("Hi"/"Hello"/"Namaste").

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(no keyword match → Set Passthrough) → WF-02(POST_CONSULT_TEXT) → WF-43(text → WF-25) → WF-25(general_enquiry → Return) → WF-43(Gemini reply) → WF-50`

**Hop-by-hop:**
- **WF-00** — parses text, dedup passes, records message, calls WF-01.
- **WF-01** — Country Filter PASS (91/61); Status Lookup finds users row (status=consultation_closed), no opted_out/blocked → route 'existing'; builds envelope with full `user` object; not blocked/opted-out/brand-new → calls WF-02.
- **WF-02** — Validate Inputs OK; Detect Route: user!=null, messageType='text', status=consultation_closed → matches the existing-user-text branch; `Existing-User Text?` IF is TRUE (text + user!=null) → Call WF-20 first.
- **WF-20** — Normalize Keyword uppercases "HI"; Match Keyword switch has no HELP/STOP/REBOOK match → fallback output → Set Passthrough (action='passthrough'). Returns to WF-02.
- **WF-02** — `Keyword Passthrough?` TRUE → Restore Route Data (re-reads Detect Route output) → Route Switch → POST_CONSULT_TEXT (output#7) → Call WF-43.
- **WF-43** — `Is Button Reply?` FALSE (text) → Call WF-25 Intent Classifier (passes messageContent, userStatus, userName, slackChannelId).
- **WF-25** — Gemini classifies greeting → general_enquiry; Route by Intent output#1 → Return to Caller with intentResult. (On Gemini failure, Parse Intent default for consultation_closed = feedback_intent — see note.)
- **WF-43** — `Stop Intent?` FALSE → `Rebook Intent?` FALSE → `Feedback Intent?` FALSE → `Was optedOut?` FALSE → Prepare Gemini Response Prompt → Gemini General Response → Extract Gemini Reply → `Off-Topic?`: a greeting is valid → Build Reply Payload → Send Gemini Reply via WF-50.
- **WF-50** — text variant, delivers the warm "welcome back, reply REBOOK" style reply on WhatsApp.

**Outcome:** Friendly WhatsApp reply welcoming the user back and inviting REBOOK; no state change (stays consultation_closed).

**Verdict:**
  ✅ **Expected / correct** — greeting reaches a sensible contextual terminal with a real reply; state correctly unchanged.

---

### S6 / B — Consultation closed · Free-form question

**Scenario:** Closed-consultation user sends a real astrology question ("When will I get married?"), not a reserved keyword.

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Set Passthrough) → WF-02(POST_CONSULT_TEXT) → WF-43(text → WF-25) → WF-25(general_enquiry|feedback_intent) → WF-43(Gemini reply | WF-44) → WF-50`

**Hop-by-hop:**
- **WF-00** — parses text, records, calls WF-01.
- **WF-01** — route 'existing'; full envelope → WF-02.
- **WF-02** — Detect Route → existing-user-text; `Existing-User Text?` TRUE → WF-20.
- **WF-20** — no keyword match → Set Passthrough → returns; WF-02 `Keyword Passthrough?` TRUE → Route Switch → POST_CONSULT_TEXT → WF-43.
- **WF-43** — text → Call WF-25.
- **WF-25** — Gemini classifies the question. A genuine astrology question typically → general_enquiry (output#1 → Return). If Gemini returns nothing/fails, Parse Intent default for consultation_closed = **feedback_intent**, and the Gemini-fail HTTP error branch fires U1 alert.
- **WF-43** — On general_enquiry: `Stop/Rebook/Feedback Intent?` all FALSE → `Was optedOut?` FALSE → Prepare Gemini Response Prompt → Gemini → Extract → `Off-Topic?` (valid astrology Q) FALSE → Build Reply Payload → Send Gemini Reply via WF-50. On feedback_intent: `Feedback Intent?` TRUE → Route to Feedback WF-44 (records as feedback).
- **WF-50** — delivers a contextual reply (or WF-44 feedback acknowledgment).

**Outcome:** WhatsApp reply answering briefly + nudging REBOOK; or, if mis-classified as feedback, the message is recorded as consultation feedback. No state change.

**Verdict:**
  ⚠️ **Needs fixing** [P2] — two latent risks at this state: (1) WF-25 `Parse Intent` hard-defaults consultation_closed to `feedback_intent` whenever Gemini returns an unrecognized/empty label, so a real astrology question can be silently logged as "feedback" instead of answered; (2) if Gemini ever classifies the text as `stop_intent`, WF-43's `Stop Intent?` TRUE output (main#0) has NO downstream connection — the message dead-ends with no reply and no opt-out. Both are edge cases (the common path answers correctly), hence P2 not P0.

---

### S6 / C — Consultation closed · STOP keyword

**Scenario:** Closed-consultation user sends exact uppercase "STOP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match=STOP → WF-47) → WF-47(status→opted_out, close consult, notify) → WF-50/WF-51`

**Hop-by-hop:**
- **WF-00** — parses "STOP", records, calls WF-01.
- **WF-01** — user status=consultation_closed (not yet opted_out) → route 'existing' → WF-02.
- **WF-02** — Detect Route existing-user-text; `Existing-User Text?` TRUE → Call WF-20.
- **WF-20** — Normalize uppercases "STOP"; Match Keyword STOP/UNSUBSCRIBE/OPT-OUT branch (output#1) → Call WF-47 Unsubscribe (passes phoneNumber, userId, userStatus). This is a terminal call inside WF-20 — no passthrough returned, so WF-02's keyword-passthrough path is not taken.
- **WF-47** — `Was Consultation Active?` FALSE (status is consultation_closed, not active) → Update User Status to opted_out (current_consultation_id=NULL) RETURNING slack_channel_id → `Has Slack Channel?` TRUE (closed users have a preserved channel) → Prepare WF-51 opt-out notice → Notify Admin via WF-51 → Prepare WF-50 opt-out confirmation → Send Opt-out Confirmation via WF-50.
- **WF-50/WF-51** — WhatsApp confirms unsubscribe to user; Slack notifies admin in the consult channel.

**Outcome:** User transitions consultation_closed → opted_out; WhatsApp opt-out confirmation sent; admin Slack notice posted. Re-engagement later auto-lifts opted_out.

**Verdict:**
  ✅ **Expected / correct** — exact-keyword STOP intercept runs before the classifier (Design Rule #5), correctly opts the user out and confirms.

---

### S6 / D — Consultation closed · REBOOK keyword

**Scenario:** Closed-consultation user sends exact uppercase "REBOOK".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match=REBOOK → WF-45) → WF-45(routeClass=happy → payment_pending) → WF-50(button)`

**Hop-by-hop:**
- **WF-00** — parses "REBOOK", records, calls WF-01.
- **WF-01** — route 'existing' → WF-02.
- **WF-02** — `Existing-User Text?` TRUE → Call WF-20.
- **WF-20** — Match Keyword REBOOK branch (output#2) → Route to Rebook (Call WF-45, passes phoneNumber + userId). Terminal in WF-20.
- **WF-45** — Load User Record → Classify Rebook State: row exists, status=consultation_closed → not payment_submitted/active → routeClass='happy' → Route by State output#3 → Set status=payment_pending (stage=NULL) → Prepare WF-50 Payload (Rebook Payment): interactive button with ₹500 UPI instructions + "Payment Completed" button → Send Payment Instructions via WF-50.
- **WF-50** — interactive/button variant delivers the personalized "Welcome back, {name}" payment message with the tap button.

**Outcome:** User transitions consultation_closed → payment_pending; WhatsApp payment-instructions message with "Payment Completed" button sent. This is the canonical rebook loop.

**Verdict:**
  ✅ **Expected / correct** — exact REBOOK keyword reuses the existing channel and re-enters the payment flow (Design Rules #5, #10) with a correct state write and message.

---

### S6 / E — Consultation closed · HELP keyword

**Scenario:** Closed-consultation user sends exact uppercase "HELP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Existing-User Text? → WF-20) → WF-20(Match=HELP → Send HELP Response) → WF-50`

**Hop-by-hop:**
- **WF-00** — parses "HELP", records, calls WF-01.
- **WF-01** — route 'existing' → WF-02.
- **WF-02** — `Existing-User Text?` TRUE → Call WF-20.
- **WF-20** — Match Keyword HELP branch (output#0) → Send HELP Response (Call WF-50). The messageContent expression switches on `user.status`; for consultation_closed it selects: "Your consultation is complete. Type *REBOOK* to start a new one with Chinmay. 📋". Terminal in WF-20.
- **WF-50** — text variant delivers the status-specific HELP text.

**Outcome:** WhatsApp HELP reply tailored to consultation_closed (directs to REBOOK); no state change.

**Verdict:**
  ✅ **Expected / correct** — exact HELP intercept (Design Rule #5) returns the correct status-aware guidance.

---

### S6 / F — Consultation closed · Other reserved-looking keyword

**Scenario:** Closed-consultation user types an admin-ish / alias word — UNSUBSCRIBE, STATS, LIST, or "APPROVE PAYMENT".

**Traversal chain (UNSUBSCRIBE):**
`WF-00 → WF-01(existing) → WF-02(→ WF-20) → WF-20(Match=STOP-alias → WF-47) → opted_out`
**Traversal chain (STATS/LIST/APPROVE PAYMENT):**
`WF-00 → WF-01(existing) → WF-02(→ WF-20) → WF-20(no match → Set Passthrough) → WF-02(POST_CONSULT_TEXT) → WF-43(text → WF-25) → WF-25(classify) → WF-43(Gemini reply) → WF-50`

**Hop-by-hop:**
- **WF-00/WF-01/WF-02** — same existing-user-text entry; `Existing-User Text?` TRUE → WF-20.
- **WF-20 (UNSUBSCRIBE)** — Match Keyword STOP branch explicitly includes UNSUBSCRIBE/OPT OUT/OPT-OUT → Call WF-47 → opted_out (identical to scenario C). Correct.
- **WF-20 (STATS / LIST / APPROVE PAYMENT)** — none match HELP/STOP/REBOOK → fallback output → Set Passthrough → returns to WF-02. Admin commands arrive on the WhatsApp inbound channel (WF-00), never the Slack admin pipeline (WF-10/WF-11), so they have no admin effect here — correctly treated as ordinary user text.
- **WF-02** — `Keyword Passthrough?` TRUE → Route Switch → POST_CONSULT_TEXT → WF-43.
- **WF-43 → WF-25** — Gemini classifies "STATS"/"LIST"/"APPROVE PAYMENT" as garbage or general_enquiry. general_enquiry → Gemini reply path → WF-50 contextual nudge. garbage → WF-25 Build U2 Payload (Garbage) → WF-61 silent-drop + threshold(10) counter (no reply unless threshold tripped).
- **WF-50** — delivers a nudge reply (general_enquiry) OR silent drop (garbage).

**Outcome:** UNSUBSCRIBE opts the user out; STATS/LIST/APPROVE PAYMENT are handled as normal closed-state text (nudge or silent-drop) with no admin privilege leak. No erroneous state change.

**Verdict:**
  ✅ **Expected / correct** — admin/alias words from a user surface no admin capability; UNSUBSCRIBE correctly aliases to STOP, the rest fall through to the safe post-consult classifier path.

---

### S6 / G — Consultation closed · Non-text media

**Scenario:** Closed-consultation user sends an image / video / audio / sticker / location / contact (messageType non-text).

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route=EXISTING_NON_TEXT) → Route Switch#0 → Build U2 Payload → WF-61(silent-drop, threshold 10) → Non-Text Blocked?(false) → Build Deflection Payload → WF-50`

**Hop-by-hop:**
- **WF-00** — non-text message: messageContent set to "[IMAGE]"/"[AUDIO]"/etc., messageType = raw type; records, calls WF-01.
- **WF-01** — Country PASS; route 'existing' (user row present); WF-01 no longer drops non-text → forwards full envelope to WF-02.
- **WF-02** — Validate Inputs accepts non-text; Detect Route: user!=null AND messageType not text/interactive → route 'EXISTING_NON_TEXT'. `Existing-User Text?` FALSE (not text) → Route Switch → output#0 EXISTING_NON_TEXT → Build U2 Payload (Non-Text) (reason=non_text, blockThreshold=10, blockReason=threshold_non_text) → Call WF-61.
- **WF-61** — Entry Guard OK → Insert Silent Drop → Count 30-Day Drops → `Threshold Reached?`: under 10 → Return Not Blocked (blocked=false). (≥10 → auto-block + admin alert.)
- **WF-02** — `Non-Text Blocked?` FALSE (blocked!=true) → Build Deflection Payload (the "text messages only — email files to chinmay_astro@gmail.com" text) → Call WF-50 (Non-Text Deflection).
- **WF-50** — text variant delivers the deflection message.

**Outcome:** Silent-drop record inserted (counts toward auto-block); WhatsApp deflection message instructing the user to email non-text content; no state change.

**Verdict:**
  ✅ **Expected / correct** — non-text at a closed consultation is escalated/counted and the user gets a helpful text-only deflection; reaches a real terminal.

---

### S6 / H — Consultation closed · WhatsApp Flow form submission

**Scenario:** A Flow `nfm_reply` (Birth Details form) callback arrives while the user is consultation_closed.

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route: nfm_reply but user!=null → UNHANDLED) → Build UNHANDLED Alert → WF-51`

**Hop-by-hop:**
- **WF-02** — Detect Route DR-1 guard: `messageType==='interactive' && interactiveType==='nfm_reply'` → route is DETAILS_FORM ONLY when `user===null && pendingUser!==null`; here user!=null → route 'UNHANDLED' → Build UNHANDLED Alert → Call WF-51 (admin Slack notice). This defensive path exists but is not reachable in normal operation.

**Outcome:** N/A in practice — would post an UNHANDLED admin alert if it ever occurred.

**Verdict:**
  ➖ **N/A** — Meta locks the Flow form bubble after its first submit, and a form is only ever sent to a pre-form/new user (who has no users row); a consultation_closed user has no live form to resubmit. WF-02's nfm_reply guard already routes any such stray callback to UNHANDLED, so the defensive path is sound.

---

### S6 / I — Consultation closed · "Payment Completed" button

**Scenario:** Closed-consultation user taps an old "Payment Completed" / post-consult button (interactive `button_reply`).

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Detect Route: button_reply + consultation_closed → POST_CONSULT_TEXT) → Route Switch#7 → WF-43(Is Button Reply? TRUE → button branch)`

**Hop-by-hop:**
- **WF-00** — interactive button: messageContent=button id (e.g. payment_completed / btn_done / btn_rebook), interactiveLabel=title; records, calls WF-01.
- **WF-01** — route 'existing'; envelope carries rawMessage → WF-02.
- **WF-02** — Detect Route: `interactive && button_reply && user!=null && status==='consultation_closed'` → route 'POST_CONSULT_TEXT'. `Existing-User Text?` FALSE (messageType=interactive, not text) → Route Switch output#7 POST_CONSULT_TEXT → Call WF-43.
- **WF-43** — `Is Button Reply?` TRUE (messageType=interactive) → `Is opted_out?` FALSE → `Is Done Button?`: if id='btn_done' → Build Thank-You + Build Btn-Done Slack (thank-you to user, Slack note to admin). Else `Is Rebook Button?`: if id='btn_rebook' → Route to Rebook WF-45 (→ payment_pending, payment instructions). Else (e.g. stale 'payment_completed' id) → Prompt for Feedback → Send Feedback Prompt via WF-50 ("type your thoughts about the consultation").
- **WF-50** — delivers the appropriate reply (thank-you / rebook payment / feedback prompt).

**Outcome:** A genuine post-consult button (Done/Rebook) is handled correctly; a stale "Payment Completed" tap falls through to the feedback prompt (harmless). btn_rebook transitions to payment_pending; others keep consultation_closed.

**Verdict:**
  ✅ **Expected / correct** — WF-02 routes consultation_closed button taps to the post-consult handler, which dispatches Done/Rebook correctly and degrades any unrecognized button id to a benign feedback prompt rather than dead-ending.

### S7 / A — Blocked · "Hi"/greeting

**Scenario:** User has a `chinmay_astro.users` row with `status='blocked'` (admin BLOCK) and sends a plain greeting like "Hi".

**Traversal chain:**
`WF-00 → WF-01(Status Lookup → Classify route=blocked) → WF-01(Route: Blocked? → Silent Drop) ⊗ [terminal]`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message extracts text "Hi"; not whitespace, not bot echo; dedup passes (new messageId), records message + cleanup; calls WF-01 (and on the parallel branch calls WF-60 to log inbound).
- **WF-01** — Layer 1 Country Filter PASS (91/61); Status Lookup finds the users row with `status='blocked'`; Classify & Build Envelope sets `route='blocked'` (`hasUser && userStatus==='blocked'`); Route: Blocked? TRUE → Silent Drop (Blocked) Code node `{silentReject:true, reason:'blocked'}`. No outbound connection — flow ends. WF-02 is never called.
- **(WF-00 returns)** — Return 200 (Success) to Meta.

**Outcome:** Message silently dropped; no WhatsApp reply, no Slack alert, no state change (stays `blocked`).

**Verdict:** ✅ **Expected / correct** — A blocked user is intentionally cut off by admin action (Design Rule #4). Silently dropping a greeting is the right terminal; re-entry requires admin UNBLOCK, not a user message.

### S7 / B — Blocked · Free-form question

**Scenario:** A `blocked` user sends a free-form astrology question (e.g. "When will I get married?").

**Traversal chain:**
`WF-00 → WF-01(Status Lookup → Classify route=blocked) → WF-01(Route: Blocked? → Silent Drop) ⊗ [terminal]`

**Hop-by-hop:**
- **WF-00** — Parses the text, dedup passes, records message + logs via WF-60, calls WF-01.
- **WF-01** — Country PASS; Status Lookup returns `user_status='blocked'`; Classify sets `route='blocked'`; Route: Blocked? TRUE → Silent Drop (Blocked) terminal. The intent classifier (WF-25) is never reached because blocked is decided before WF-02.
- **(WF-00 returns)** — Return 200 (Success) to Meta.

**Outcome:** Question silently dropped; no reply, no classification, no state change.

**Verdict:** ✅ **Expected / correct** — Blocked users get no service; running Gemini or relaying their question would defeat the block. Silent drop at WF-01 is the correct, cost-free terminal.

### S7 / C — Blocked · STOP keyword

**Scenario:** A `blocked` user sends the exact keyword "STOP".

**Traversal chain:**
`WF-00 → WF-01(Status Lookup → Classify route=blocked) → WF-01(Route: Blocked? → Silent Drop) ⊗ [terminal]`

**Hop-by-hop:**
- **WF-00** — Parses "STOP", dedup passes, records + logs, calls WF-01. (No keyword interception lives in WF-00; STOP/HELP/REBOOK intercepts run inside WF-20, downstream of WF-02.)
- **WF-01** — Country PASS; Status Lookup → `blocked`; Classify sets `route='blocked'`; Route: Blocked? TRUE → Silent Drop. WF-02 (and thus the WF-20 keyword handler) is never invoked, so the STOP→opted_out transition does not fire.
- **(WF-00 returns)** — Return 200 (Success).

**Outcome:** STOP silently dropped; status stays `blocked` (no transition to `opted_out`).

**Verdict:** ✅ **Expected / correct** — `blocked` ≠ `opted_out` (Design Rule #4). An admin block outranks a user STOP; the user is already silenced, and an admin BLOCK must not be downgraded to a self-recoverable `opted_out` by the user. Dropping STOP while blocked is the correct precedence.

### S7 / D — Blocked · REBOOK keyword

**Scenario:** A `blocked` user sends the exact keyword "REBOOK".

**Traversal chain:**
`WF-00 → WF-01(Status Lookup → Classify route=blocked) → WF-01(Route: Blocked? → Silent Drop) ⊗ [terminal]`

**Hop-by-hop:**
- **WF-00** — Parses "REBOOK", dedup passes, records + logs, calls WF-01.
- **WF-01** — Country PASS; Status Lookup → `blocked`; Classify `route='blocked'`; Route: Blocked? TRUE → Silent Drop. The REBOOK keyword intercept (WF-20 → WF-45) is never reached.
- **(WF-00 returns)** — Return 200 (Success).

**Outcome:** REBOOK silently dropped; no new payment_pending cycle started; stays `blocked`.

**Verdict:** ✅ **Expected / correct** — A blocked user must not be able to re-enter the funnel by typing REBOOK; only admin UNBLOCK lifts a block. Silent drop is correct.

### S7 / E — Blocked · HELP keyword

**Scenario:** A `blocked` user sends the exact keyword "HELP".

**Traversal chain:**
`WF-00 → WF-01(Status Lookup → Classify route=blocked) → WF-01(Route: Blocked? → Silent Drop) ⊗ [terminal]`

**Hop-by-hop:**
- **WF-00** — Parses "HELP", dedup passes, records + logs, calls WF-01.
- **WF-01** — Country PASS; Status Lookup → `blocked`; Classify `route='blocked'`; Route: Blocked? TRUE → Silent Drop. WF-20's HELP intercept never runs.
- **(WF-00 returns)** — Return 200 (Success).

**Outcome:** HELP silently dropped; no help text sent; stays `blocked`.

**Verdict:** ✅ **Expected / correct** — Sending the HELP/support message to a blocked user would re-open a channel admin deliberately closed. Silent drop is consistent with the block semantics.

### S7 / F — Blocked · Other reserved-looking keyword (UNSUBSCRIBE / STATS / LIST / APPROVE PAYMENT)

**Scenario:** A `blocked` user types an admin-ish or alias word such as "UNSUBSCRIBE", "STATS", "LIST", or "APPROVE PAYMENT".

**Traversal chain:**
`WF-00 → WF-01(Status Lookup → Classify route=blocked) → WF-01(Route: Blocked? → Silent Drop) ⊗ [terminal]`

**Hop-by-hop:**
- **WF-00** — Parses the text (any of these is a plain inbound WhatsApp text), dedup passes, records + logs, calls WF-01. (Admin commands like STATS/LIST/APPROVE PAYMENT only have effect inbound from Slack via WF-10/WF-11 — never from the WhatsApp side — so even outside the block these would be ordinary user text.)
- **WF-01** — Country PASS; Status Lookup → `blocked`; Classify `route='blocked'`; Route: Blocked? TRUE → Silent Drop. No keyword/alias parsing (WF-20) and no admin-command parsing (WF-11) is reachable from this WhatsApp inbound path.
- **(WF-00 returns)** — Return 200 (Success).

**Outcome:** Text silently dropped; no admin command executed, no unsubscribe/keyword handling; stays `blocked`.

**Verdict:** ✅ **Expected / correct** — These tokens carry no privileged meaning on the inbound WhatsApp path, and a blocked user is dropped before any keyword evaluation. No way for a blocked user to trigger admin behaviour or escape the block. Correct.

### S7 / G — Blocked · Non-text media

**Scenario:** A `blocked` user sends an image / video / audio / sticker / location / contact (non-text `messageType`).

**Traversal chain:**
`WF-00 → WF-01(Status Lookup → Classify route=blocked) → WF-01(Route: Blocked? → Silent Drop) ⊗ [terminal]`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message hits the `default` switch case, sets `messageContent='[IMAGE]'` (etc.) and `messageType` to the media type; not whitespace-skipped (guard only applies to text); dedup passes, records + logs, calls WF-01.
- **WF-01** — Country PASS; Status Lookup → `blocked`; Classify `route='blocked'` (route decided purely on user status, media type is irrelevant here); Route: Blocked? TRUE → Silent Drop. The existing-user non-text branch in WF-02 (EXISTING_NON_TEXT → WF-61 escalate + deflection) is never reached because blocked drops at WF-01 first.
- **(WF-00 returns)** — Return 200 (Success).

**Outcome:** Media silently dropped; no "text-only" deflection, no U2 escalation; stays `blocked`.

**Verdict:** ✅ **Expected / correct** — A blocked user should receive no deflection or escalation; that would re-engage someone admin deliberately silenced. Blocked precedence over the non-text deflection path is the right behaviour.

### S7 / H — Blocked · WhatsApp Flow form submission (nfm_reply)

**Scenario:** A `blocked` user would send an interactive `nfm_reply` (Birth Details form) callback.

**Traversal chain:**
`➖ N/A — form bubble locked after first submit; form only ever sent to a pre-form/new user`

**Hop-by-hop:**
- **(impossible)** — Meta locks the Flow form bubble after the first submit, and the form is only ever sent to a brand-new / pre-form contact (WF-21). A user in `blocked` already passed through onboarding (has a `users` row), so no live form bubble exists to re-submit.
- **(defensive note)** — Even if such a callback arrived, WF-01 would short-circuit it: Classify sets `route='blocked'` on user status alone → Silent Drop, before WF-02's `Detect Route` nfm_reply guard (which would otherwise map a non-pre-form nfm_reply to UNHANDLED) ever runs.

**Outcome:** N/A — input cannot occur in this state.

**Verdict:** ➖ **N/A** — nfm_reply re-submission is impossible: the form bubble is one-shot and is never sent to an existing (blocked) user. The blocked short-circuit in WF-01 would handle a spurious one anyway.

### S7 / I — Blocked · "Payment Completed" button

**Scenario:** A `blocked` user taps a residual "Payment Completed" button (interactive `button_reply`).

**Traversal chain:**
`WF-00 → WF-01(Status Lookup → Classify route=blocked) → WF-01(Route: Blocked? → Silent Drop) ⊗ [terminal]`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message reads `interactive.button_reply` → `messageContent=button id`, `interactiveLabel=title`, `messageType='interactive'`; dedup passes, records + logs, calls WF-01.
- **WF-01** — Country PASS; Status Lookup → `blocked`; Classify `route='blocked'` (decided on user status before any interactive-type inspection); Route: Blocked? TRUE → Silent Drop. WF-02's PAYMENT_CONFIRM branch (which requires `userStatus==='payment_pending'`) is never reached.
- **(WF-00 returns)** — Return 200 (Success).

**Outcome:** Button tap silently dropped; no payment confirmation processed; stays `blocked`.

**Verdict:** ✅ **Expected / correct** — A blocked user cannot resurrect a payment flow by tapping a stale button. The PAYMENT_CONFIRM route additionally guards on `payment_pending`, so even absent the block this would not confirm; the block makes it a clean silent drop. Correct.

### S8 / A — Opted-out · "Hi"/greeting

**Scenario:** User row has status='opted_out' (previously sent STOP); they re-engage by sending a plain greeting like "Hi".

**Traversal chain:**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed, wasOptedOut=true) → WF-02 re-route(Detect Route=POST_CONSULT_TEXT) → WF-20(no keyword→passthrough) → WF-43(text→WF-25→Was optedOut?=yes) → WF-25 → WF-43(Opted-Out prompt→Gemini) → WF-50`

**Hop-by-hop:**
- **WF-00** — parses text, dedup passes, records message, calls WF-01.
- **WF-01** — Country Filter PASS; Status Lookup finds users row with status='opted_out' → Classify & Build Envelope sets route='opted_out', wasOptedOut=true, forces pendingUser=null; "Route: Opted Out?" TRUE → calls WF-26 (WF-02 is NOT called directly).
- **WF-26** — Validate Inputs (asserts status=opted_out, pendingUser=null, wasOptedOut=true) → Update User Status flips DB to consultation_closed → Refresh Envelope Status rebuilds envelope with user.status='consultation_closed' and preserves wasOptedOut=true → Call WF-02 Re-Route.
- **WF-02** — Validate Inputs OK; Detect Route: user!==null, text, status=consultation_closed → POST_CONSULT_TEXT; Existing-User Text? TRUE → Call WF-20 first.
- **WF-20** — Normalize Keyword (reads user.id/user.status from lifted envelope); Match Keyword: "HI" hits fallback → Set Passthrough (action=passthrough).
- **WF-02 (cont.)** — Keyword Passthrough? TRUE → Restore Route Data (POST_CONSULT_TEXT) → Route Switch #7 → Call WF-43.
- **WF-43** — Is Button Reply? NO → Call WF-25 Intent Classifier; assuming general/greeting intent (not stop/rebook/feedback) → Was optedOut? TRUE → Prepare Gemini Prompt (Opted-Out) → Gemini General Response → Extract Gemini Reply → Off-Topic? (greeting is valid) → Build Reply Payload → WF-50.
- **WF-50** — delivers a warm "welcome back, you're resubscribed" reply inviting REBOOK.

**Outcome:** User is silently resubscribed (DB now consultation_closed) and receives a friendly welcome-back WhatsApp reply. State transition opted_out → consultation_closed.

**Verdict:** ✅ **Expected / correct** — matches Design Rule: opted_out user messaging again lifts status, sends personalized welcome, re-routes through inbound entry, all in one turn; Opted-Out Gemini prompt explicitly welcomes them back.

### S8 / B — Opted-out · Free-form question

**Scenario:** User row status='opted_out'; they re-engage with a real astrology question (e.g. "When will I get married?").

**Traversal chain:**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed, wasOptedOut=true) → WF-02 re-route(POST_CONSULT_TEXT) → WF-20(no keyword→passthrough) → WF-43(WF-25→Was optedOut?=yes) → WF-25 → WF-43(Opted-Out prompt→Gemini) → WF-50`

**Hop-by-hop:**
- **WF-00** — parses text, dedup passes, calls WF-01.
- **WF-01** — opted_out users row → route='opted_out', wasOptedOut=true, pendingUser=null → "Route: Opted Out?" TRUE → WF-26.
- **WF-26** — lifts DB to consultation_closed, refreshes envelope (status=consultation_closed, wasOptedOut preserved) → re-route to WF-02.
- **WF-02** — Detect Route POST_CONSULT_TEXT; Existing-User Text? TRUE → WF-20.
- **WF-20** — question is not a keyword → fallback → Set Passthrough.
- **WF-02 (cont.)** — Keyword Passthrough? TRUE → Restore Route Data → Route Switch #7 → WF-43.
- **WF-43** — Is Button Reply? NO → WF-25 classifier; a genuine astrology question is not stop/rebook/feedback → Was optedOut? TRUE → Prepare Gemini Prompt (Opted-Out) → Gemini answers briefly (₹500/GPay/WhatsApp guardrails) + welcome-back + REBOOK nudge → Off-Topic? valid → Build Reply Payload → WF-50.
- **WF-50** — delivers the contextual answer + REBOOK invitation.

**Outcome:** Resubscribed (consultation_closed) and given a warm, factual WhatsApp answer that steers to REBOOK. State opted_out → consultation_closed.

**Verdict:** ✅ **Expected / correct** — reaches a real terminal with a contextual reply; resubscribe + welcome-back is the designed re-engagement behaviour.

### S8 / C — Opted-out · STOP keyword

**Scenario:** User row status='opted_out'; they send the exact keyword "STOP" again.

**Traversal chain:**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed) → WF-02 re-route(POST_CONSULT_TEXT) → WF-20(Match Keyword=STOP) → WF-47(re-opt-out→opted_out) → WF-50/WF-51`

**Hop-by-hop:**
- **WF-00** — parses "STOP", calls WF-01.
- **WF-01** — opted_out users row → route='opted_out' → WF-26.
- **WF-26** — lifts DB to consultation_closed, refreshes envelope (status=consultation_closed) → re-route WF-02.
- **WF-02** — Detect Route POST_CONSULT_TEXT; Existing-User Text? TRUE → WF-20.
- **WF-20** — Normalize Keyword "STOP"; Match Keyword #1 (STOP/UNSUBSCRIBE/OPT-OUT) → Call WF-47 Unsubscribe (emits phoneNumber, userId, userStatus='consultation_closed').
- **WF-47** — Was Consultation Active? (userStatus=consultation_closed) NO → Update User Status to opted_out (current_consultation_id=NULL) → Has Slack Channel? → Notify Admin Opt-out via WF-51 (if channel) → Prepare WF-50 Payload → Send Opt-out Confirmation via WF-50.
- **WF-50/WF-51** — opt-out confirmation to user; admin opt-out notice to Slack channel.

**Outcome:** User is flipped back to opted_out and receives the unsubscribe confirmation; admin notified. Net state ends at opted_out (briefly bounced through consultation_closed inside WF-26 before WF-47 re-opts-out).

**Verdict:** ✅ **Expected / correct** — STOP re-opts-out and confirms; end state opted_out is right. Minor internal churn (WF-26 lifts to consultation_closed, then WF-47 immediately reverts) is harmless and user-invisible — STOP is the designed exact-match intercept and reaches the proper terminal.

### S8 / D — Opted-out · REBOOK keyword

**Scenario:** User row status='opted_out'; they send the exact keyword "REBOOK".

**Traversal chain:**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed) → WF-02 re-route(POST_CONSULT_TEXT) → WF-20(Match Keyword=REBOOK) → WF-45 Rebook Handler → WF-50`

**Hop-by-hop:**
- **WF-00** — parses "REBOOK", calls WF-01.
- **WF-01** — opted_out users row → route='opted_out' → WF-26.
- **WF-26** — lifts DB to consultation_closed → refresh envelope → re-route WF-02.
- **WF-02** — Detect Route POST_CONSULT_TEXT; Existing-User Text? TRUE → WF-20.
- **WF-20** — Normalize Keyword "REBOOK"; Match Keyword #2 → Route to Rebook (emits phoneNumber, userId) → WF-45.
- **WF-45** — Rebook Handler transitions the (now consultation_closed) user to payment_pending and sends the payment/booking instructions via WF-50.
- **WF-50** — delivers rebooking/payment-pending message.

**Outcome:** Re-engaged user is resubscribed and immediately routed into a new rebooking flow → payment_pending. State opted_out → consultation_closed → payment_pending.

**Verdict:** ✅ **Expected / correct** — REBOOK is the intended fast path for a returning opted-out user; WF-26 lift + WF-20 REBOOK intercept + WF-45 cleanly start a new consultation.

### S8 / E — Opted-out · HELP keyword

**Scenario:** User row status='opted_out'; they send the exact keyword "HELP".

**Traversal chain:**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed) → WF-02 re-route(POST_CONSULT_TEXT) → WF-20(Match Keyword=HELP) → Send HELP Response → WF-50`

**Hop-by-hop:**
- **WF-00** — parses "HELP", calls WF-01.
- **WF-01** — opted_out users row → route='opted_out' → WF-26.
- **WF-26** — lifts DB to consultation_closed → refresh envelope (status=consultation_closed) → re-route WF-02.
- **WF-02** — Detect Route POST_CONSULT_TEXT; Existing-User Text? TRUE → WF-20.
- **WF-20** — Normalize Keyword "HELP"; Match Keyword #0 → Send HELP Response. The HELP text node branches on `user.status`; the lifted envelope reports consultation_closed → sends "Your consultation is complete. Type *REBOOK* to start a new one." via WF-50.
- **WF-50** — delivers the status-appropriate HELP text.

**Outcome:** Resubscribed (consultation_closed) and receives the consultation_closed HELP message nudging REBOOK. State opted_out → consultation_closed.

**Verdict:** ✅ **Expected / correct** — HELP exact-match intercept fires before any LLM; the status-conditional copy is sensible for a just-resubscribed user (REBOOK guidance).

### S8 / F — Opted-out · Other reserved-looking keyword (UNSUBSCRIBE)

**Scenario:** User row status='opted_out'; they type an admin-ish/alias word — primary trace UNSUBSCRIBE; STATS/LIST/APPROVE PAYMENT noted as the fallthrough variant.

**Traversal chain (UNSUBSCRIBE):**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed) → WF-02 re-route(POST_CONSULT_TEXT) → WF-20(Match Keyword=STOP alias) → WF-47(re-opt-out) → WF-50/WF-51`

**Hop-by-hop:**
- **WF-00 / WF-01 / WF-26 / WF-02** — identical lift + POST_CONSULT_TEXT routing as scenarios A–E (WF-20 called first because Existing-User Text? is TRUE).
- **WF-20** — Normalize Keyword "UNSUBSCRIBE"; Match Keyword #1 treats UNSUBSCRIBE/OPT OUT/OPT-OUT as STOP aliases → Call WF-47 Unsubscribe.
- **WF-47** — userStatus=consultation_closed → Was Consultation Active? NO → Update to opted_out → opt-out confirmation via WF-50 + admin notice via WF-51.
- **Fallthrough variant (STATS / LIST / APPROVE PAYMENT):** these do NOT match HELP/STOP/REBOOK in WF-20 Match Keyword → fallback → Set Passthrough → WF-02 Route Switch #7 → WF-43 → WF-25 → Was optedOut?=yes → Opted-Out Gemini prompt → WF-50 (generic welcome-back/steer-to-REBOOK reply). Admin words from a WhatsApp user are correctly NOT honoured as admin commands (admin commands enter only via Slack/WF-10).

**Outcome:** UNSUBSCRIBE → re-opted-out with confirmation. Admin-word variants → generic welcome-back reply, no admin action. Both reach a sensible terminal.

**Verdict:** ✅ **Expected / correct** — UNSUBSCRIBE alias correctly maps to opt-out; user-typed admin words are correctly ignored as commands and handled as ordinary re-engagement text. No privilege leak from the WhatsApp side.

### S8 / G — Opted-out · Non-text media

**Scenario:** User row status='opted_out'; they send an image/audio/video/sticker/location/contact (messageType non-text).

**Traversal chain:**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed) → WF-02 re-route(Detect Route=EXISTING_NON_TEXT) → WF-61(silent-drop log + threshold check) → WF-02(Non-Text Blocked?=no) → WF-50 deflection`

**Hop-by-hop:**
- **WF-00** — non-text → messageContent="[IMAGE]"/"[AUDIO]"/etc.; calls WF-01.
- **WF-01** — opted_out users row → route='opted_out' → WF-26.
- **WF-26** — lifts DB to consultation_closed → Refresh Envelope (messageType carried through, messageContent="[IMAGE]") → re-route WF-02.
- **WF-02** — Detect Route: user!==null && messageType!=='text' && !=='interactive' → EXISTING_NON_TEXT; Existing-User Text? FALSE → Route Switch #0 → Build U2 Payload (Non-Text) (reason=non_text, blockThreshold=10) → Call WF-61.
- **WF-61** — Entry Guard → Insert Silent Drop → Count 30-Day Drops → Threshold Reached? typically NO (<10) → Return Not Blocked (blocked=false).
- **WF-02 (cont.)** — Non-Text Blocked? FALSE → Build Deflection Payload → Call WF-50.
- **WF-50** — delivers "text messages only / email attachments to chinmay_astro@gmail.com" deflection.

**Outcome:** Media is silently logged to silent_drop, user gets the text-only deflection message; resubscribed to consultation_closed. (If the 10-drop threshold were already crossed, WF-61 auto-blocks instead and no deflection is sent.)

**Verdict:** ✅ **Expected / correct** — non-text from a re-engaging opted-out user is logged and deflected with the email fallback; abuse-threshold guard remains in force. Sensible terminal.

### S8 / H — Opted-out · WhatsApp Flow form submission (nfm_reply)

**Scenario:** User row status='opted_out'; a Flow-form (Birth Details) nfm_reply callback arrives.

**Traversal chain:**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed) → WF-02 re-route(Detect Route=UNHANDLED, defensive) → WF-51 admin alert`

**Hop-by-hop:**
- **WF-02 Detect Route** — for nfm_reply the route is DETAILS_FORM only when `user===null && pendingUser!==null`; here user!==null (lifted) → falls to UNHANDLED → Build UNHANDLED Alert → WF-51 (defensive admin notification, no user reply).

**Outcome:** Defensively safe (admin alert), but the input itself cannot occur.

**Verdict:** ➖ **N/A** — a Flow form is only ever sent to a pre-form/new user, and Meta locks the form bubble after the first submit; an opted_out user (who completed onboarding earlier) cannot produce a fresh nfm_reply. The WF-02 nfm_reply guard (`user===null && pendingUser!==null` else UNHANDLED) correctly routes any stray copy to the admin alert.

### S8 / I — Opted-out · "Payment Completed" button

**Scenario:** User row status='opted_out'; they tap a stale "Payment Completed ✓" interactive button (button_reply) from an old message.

**Traversal chain:**
`WF-00 → WF-01(route=opted_out) → WF-26(lift→consultation_closed, wasOptedOut=true) → WF-02 re-route(Detect Route=POST_CONSULT_TEXT) → WF-43(Is Button Reply?=yes → Is opted_out?=yes) → Build Welcome-Back Payload → WF-50`

**Hop-by-hop:**
- **WF-00** — interactive button_reply → messageType='interactive'; calls WF-01.
- **WF-01** — opted_out users row → route='opted_out', wasOptedOut=true → WF-26.
- **WF-26** — lifts DB to consultation_closed → Refresh Envelope (status=consultation_closed, wasOptedOut=true, rawMessage preserved) → re-route WF-02.
- **WF-02** — Detect Route: interactive && button_reply && user!==null && status===consultation_closed → POST_CONSULT_TEXT; Existing-User Text? FALSE (not text) → Route Switch #7 → Call WF-43.
- **WF-43** — Is Button Reply? YES → Is opted_out? (wasOptedOut===true) YES → Build Welcome-Back Payload ("🙏 Welcome back to Chinmay Astro! Reply REBOOK…") → Send Welcome-Back via WF-50.
- **WF-50** — delivers welcome-back message.

**Outcome:** Stale payment-button tap from an opted-out user resubscribes them (consultation_closed) and sends a welcome-back + REBOOK nudge. State opted_out → consultation_closed.

**Verdict:** ✅ **Expected / correct** — the wasOptedOut short-circuit in WF-43 correctly handles a returning opted-out user who taps any stale button: no payment action is taken (a returning user must REBOOK first, per the Opted-Out prompt's own guardrail), and they get a clean welcome-back. Sensible terminal.

### S10 / A — NULL/unknown status · "Hi"/greeting

**Scenario:** A `chinmay_astro.users` row exists for the phone but `status IS NULL` (or a garbage value); the user sends a plain greeting like "Hi".

**Traversal chain:**
`WF-00 → WF-01(route=existing: user row present, status not blocked/opted_out/brand_new) → WF-02(Validate Inputs THROWS on invalid user.status) → ✗ uncaught error, no terminal`

**Hop-by-hop:**
- **WF-00** — Parse WhatsApp Message extracts text "Hi"; dedup passes; records message; calls WF-01.
- **WF-01** — Country Filter PASS; Status Lookup finds the users row (NULL/garbage status), no/any pending row. `Classify & Build Envelope`: hasUser=true, status not 'blocked'/'opted_out', and !(!hasUser&&!hasPending) → falls to `else route='existing'`. Envelope built with `user.status = sql.user_status || null` (NULL/garbage carried verbatim). Route≠blocked/opted_out/brand_new → calls **WF-02**.
- **WF-02** — `When Executed → Validate Inputs` runs first. user object is non-null, so it checks `validStatuses.includes(u.status)`. NULL/garbage status fails the check → **throws** `WF-02 contract: user.status must be a valid state-machine value`. Detect Route / keyword / Route Switch never run.
- **(error)** — WF-01's `Call WF-02 Rule Router` has no onError override (default stopWorkflow) → error propagates up; WF-00's `Call WF-01` also has no onError → whole execution errors. No WF-50 send, no WF-51 alert.

**Outcome:** Execution crashes at WF-02 Validate Inputs. The user receives nothing — no greeting/welcome, no error reply, not even the UNHANDLED Slack alert. Silent dead-end.

**Verdict:** ⚠️ **Needs fixing** [P0] — `Validate Inputs` (WF-02) hard-throws for any user row whose status isn't in the 6-value whitelist, and WF-01 routes such rows to WF-02 as 'existing' (Classify & Build Envelope has no anomaly branch). A data anomaly (NULL/garbage status) makes the user permanently unreachable: every inbound message crashes silently with no user-visible reply and no admin escalation. Needs a defensive route (treat unknown status as brand_new/pre-form re-onboard, or send UNHANDLED alert) instead of throwing.

### S10 / B — NULL/unknown status · Free-form question

**Scenario:** Users row exists with NULL/garbage status; user sends a real astrology question ("When will I get married?").

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Validate Inputs THROWS on invalid user.status) → ✗ uncaught error, no terminal`

**Hop-by-hop:**
- **WF-00** — Parses the text question; dedup passes; records; calls WF-01.
- **WF-01** — Country PASS; Status Lookup finds users row (invalid status); `Classify & Build Envelope` → `route='existing'` (none of blocked/opted_out/brand_new match); calls WF-02 with `user.status` = the invalid value.
- **WF-02** — `Validate Inputs` checks `validStatuses.includes(u.status)` → fails → **throws** before Detect Route. The intent-classifier path (which would normally fire for free-form existing-user text) is never reached.
- **(error)** — Propagates uncaught through WF-01 → WF-00; execution errors; nothing sent.

**Outcome:** Crash at WF-02 Validate Inputs; no classification, no reply, no alert. The user's genuine question is silently dropped.

**Verdict:** ⚠️ **Needs fixing** [P0] — Same systemic defect as S10/A: WF-02 Validate Inputs throws on the anomalous status, so a paying-intent question gets zero response. Worse than a greeting because a real customer question is lost silently. Same fix.

### S10 / C — NULL/unknown status · STOP

**Scenario:** Users row exists with NULL/garbage status; user sends exact "STOP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Validate Inputs THROWS before keyword intercept) → ✗ uncaught error, no terminal`

**Hop-by-hop:**
- **WF-00** — Parses "STOP" text; records; calls WF-01.
- **WF-01** — Country PASS; Status Lookup finds users row (invalid status); `route='existing'`; calls WF-02. (WF-01 has no STOP keyword intercept — keyword handling lives in WF-02's Existing-User Text → WF-20.)
- **WF-02** — `Validate Inputs` runs BEFORE `Detect Route` / `Existing-User Text?` / `Call WF-20`. Invalid status → **throws**. The STOP keyword (which WF-20 would map to WF-47 unsubscribe → `opted_out`) is never evaluated.
- **(error)** — Uncaught; execution errors; no opt-out write, no confirmation.

**Outcome:** Crash at WF-02; STOP is not honoured — the user is not opted out and gets no confirmation. Compliance-relevant: a STOP request silently fails.

**Verdict:** ⚠️ **Needs fixing** [P0] — STOP is supposed to be an exact-match intercept that always works, but the WF-02 entry validator throws before the keyword branch runs, so an opt-out request from an anomalous-status user is silently lost (compliance risk). Fix must ensure keyword intercepts (especially STOP) survive the anomalous-status path.

### S10 / D — NULL/unknown status · REBOOK

**Scenario:** Users row exists with NULL/garbage status; user sends exact "REBOOK".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Validate Inputs THROWS before keyword intercept) → ✗ uncaught error, no terminal`

**Hop-by-hop:**
- **WF-00** — Parses "REBOOK" text; records; calls WF-01.
- **WF-01** — Country PASS; Status Lookup finds users row (invalid status); `route='existing'`; calls WF-02.
- **WF-02** — `Validate Inputs` throws on invalid status before `Existing-User Text? → Call WF-20`. The REBOOK keyword (WF-20 → Route to Rebook / WF-45 → payment_pending) is never reached.
- **(error)** — Uncaught; execution errors; no rebook, no reply.

**Outcome:** Crash at WF-02; REBOOK ignored — no new payment_pending cycle started, no message. Silent dead-end.

**Verdict:** ⚠️ **Needs fixing** [P0] — Same systemic WF-02 Validate Inputs throw. REBOOK cannot recover an anomalous-status user; the keyword never reaches WF-20. Same fix as A–C.

### S10 / E — NULL/unknown status · HELP

**Scenario:** Users row exists with NULL/garbage status; user sends exact "HELP".

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Validate Inputs THROWS before keyword intercept) → ✗ uncaught error, no terminal`

**Hop-by-hop:**
- **WF-00** — Parses "HELP" text; records; calls WF-01.
- **WF-01** — Country PASS; users row found (invalid status); `route='existing'`; calls WF-02.
- **WF-02** — `Validate Inputs` throws before `Call WF-20`. Note: even if WF-20 were reached, its `Send HELP Response` builds status-specific copy via a chain of `user.status === ...` ternaries; an unknown status would fall to the generic default HELP text — but that path is unreachable here because the validator throws first.
- **(error)** — Uncaught; execution errors; no HELP reply.

**Outcome:** Crash at WF-02; the user gets no HELP menu. Silent dead-end.

**Verdict:** ⚠️ **Needs fixing** [P0] — HELP, an always-available keyword intercept, fails for anomalous-status users because WF-02 Validate Inputs throws before WF-20 runs. Same systemic fix.

### S10 / F — NULL/unknown status · Other reserved-looking keyword (UNSUBSCRIBE / STATS / LIST / APPROVE PAYMENT)

**Scenario:** Users row exists with NULL/garbage status; user types an admin-ish / alias word like "UNSUBSCRIBE" or "STATS" on WhatsApp.

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Validate Inputs THROWS before keyword/classifier) → ✗ uncaught error, no terminal`

**Hop-by-hop:**
- **WF-00** — Parses the text (e.g. "UNSUBSCRIBE"/"STATS"); records; calls WF-01. (Admin commands enter via the Slack side WF-10/WF-11; a WhatsApp inbound never reaches the admin parser — it is just user text here.)
- **WF-01** — Country PASS; users row found (invalid status); `route='existing'`; calls WF-02.
- **WF-02** — `Validate Inputs` throws on invalid status. The intended downstream behaviour never runs: WF-20's `Match Keyword` switch would treat UNSUBSCRIBE as a STOP-alias (→ WF-47) and would fall through STATS/LIST/APPROVE PAYMENT to the `passthrough` (→ Route Switch → existing-user classifier) — but all of that is unreachable.
- **(error)** — Uncaught; execution errors; no reply.

**Outcome:** Crash at WF-02; regardless of which reserved-looking word, nothing is sent. UNSUBSCRIBE (a STOP alias) silently fails to opt the user out; STATS/LIST/APPROVE PAYMENT (no user effect anyway) also dead-end.

**Verdict:** ⚠️ **Needs fixing** [P0] — Same WF-02 Validate Inputs throw blocks every keyword/alias path. Notably UNSUBSCRIBE = a compliance opt-out alias that silently fails. Same systemic fix.

### S10 / G — NULL/unknown status · Non-text media

**Scenario:** Users row exists with NULL/garbage status; user sends an image/audio/video/sticker/location/contact (messageType non-text).

**Traversal chain:**
`WF-00 → WF-01(route=existing, non-text passed through) → WF-02(Validate Inputs THROWS on invalid user.status) → ✗ uncaught error, no terminal`

**Hop-by-hop:**
- **WF-00** — Parse sets messageContent="[IMAGE]" etc.; records; calls WF-01 (WF-01 no longer drops non-text).
- **WF-01** — Country PASS; users row found (invalid status); `route='existing'`; envelope carries messageType=image/etc. and the invalid `user.status`; calls WF-02.
- **WF-02** — `Validate Inputs` runs before `Detect Route`. The user object is present, so the status whitelist check fires and **throws** on the invalid status — before the EXISTING_NON_TEXT branch (which would have gone WF-61 escalate + WF-50 deflection) is ever computed.
- **(error)** — Uncaught; execution errors; no deflection message, no U2/WF-61 escalation.

**Outcome:** Crash at WF-02; the non-text deflection ("text only / email us") is never sent and no Slack escalation fires. Silent dead-end.

**Verdict:** ⚠️ **Needs fixing** [P0] — Even the non-text branch is gated behind WF-02 Validate Inputs, which throws first on the anomalous status. The user's media gets no deflection and admins get no escalation. Same systemic fix.

### S10 / H — NULL/unknown status · WhatsApp Flow form submission (nfm_reply)

**Scenario:** Users row exists with NULL/garbage status; an interactive `nfm_reply` (Birth Details form) callback arrives.

**Traversal chain:**
`(impossible in this state) — defensive path would be WF-00 → WF-01(route=existing) → WF-02(Validate Inputs THROWS; else Detect Route would set UNHANDLED since user!==null)`

**Hop-by-hop:**
- **N/A** — A Flow form is only ever sent to a brand-new / pre-form contact, and Meta locks the form bubble after the first submit, so a second nfm_reply cannot be produced. For an existing users row, no live form bubble exists to re-submit.
- **(defensive note)** — Were such a payload to arrive, WF-02's `Validate Inputs` would still throw on the invalid status; even if it didn't, `Detect Route` guards nfm_reply with `(user===null && pendingUser!==null) ? 'DETAILS_FORM' : 'UNHANDLED'`, so a user-present nfm_reply would route UNHANDLED (Slack alert), not WF-22.

**Outcome:** No real execution — input cannot occur in S10.

**Verdict:** ➖ **N/A** — Form re-submission is impossible: the form bubble is single-use (Meta-locked after first submit) and is only sent to pre-form users, so an existing users row never produces an nfm_reply.

### S10 / I — NULL/unknown status · "Payment Completed" button

**Scenario:** Users row exists with NULL/garbage status; user taps the "Payment Completed ✓" interactive button (button_reply).

**Traversal chain:**
`WF-00 → WF-01(route=existing) → WF-02(Validate Inputs THROWS on invalid user.status) → ✗ uncaught error, no terminal`

**Hop-by-hop:**
- **WF-00** — Parses interactive button_reply (messageContent=button id, interactiveLabel="Payment Completed ✓"); records; calls WF-01.
- **WF-01** — Country PASS; users row found (invalid status); `route='existing'`; envelope carries rawMessage (with interactive.type=button_reply) and invalid `user.status`; calls WF-02.
- **WF-02** — `Validate Inputs` throws on invalid status before `Detect Route`. Even if reached, Detect Route requires `userStatus === 'payment_pending'` for PAYMENT_CONFIRM; an unknown status would have fallen to UNHANDLED — but the validator throws first.
- **(error)** — Uncaught; execution errors; no payment-confirmation handling, no reply.

**Outcome:** Crash at WF-02; the payment-completed tap is silently lost — no WF-32 confirmation, no admin notification, no user acknowledgement.

**Verdict:** ⚠️ **Needs fixing** [P0] — A payment-completion signal from an anomalous-status user is silently dropped by the WF-02 Validate Inputs throw. High-impact: the user believes they've paid but the system records/notifies nothing. Same systemic fix.
