# Smoke — 24h-Window Deliverability Cluster (PDF-15 → PDF-19)

**Test type:** smoke (coordinated live, real external WhatsApp sends)
**Slug:** 24h-window-deliverability
**Date:** 2026-06-10
**Operator:** prasadmujumdar.aws@gmail.com (acting as Dr. Chinmay in Slack)
**Sprint:** pre-demo-minor-fixes-31May26 (rolling) — Batches 9–12 deferred live smokes

## Design docs referenced
- `docs/artefacts/specs/2026-06-08-24h-window-deliverability-design.md` (DD-1..DD-5, Meta rules M1..M5)
- `docs/artefacts/sprints/pre-demo-minor-fixes-31May26/state.md` (PDF-15..19 item blocks + Batches 9–12)
- `docs/artefacts/sprints/pre-demo-minor-fixes-31May26/followups.md` (WF-41 WA-scope adjacent finding)
- `docs/workflow-registry.md`

## Watch surface
**Workflows (chain order varies per scenario):**
- WF-00 Parse WhatsApp Message · WF-02 (post-filter template-button normalizer)
- WF-41 Admin→User Relay (`6PzJRZsF7k2d9hV7`) → WF-50 Send WhatsApp (`BUVun38WEKb12zg9`) → WF-51 Send Slack (`wlZRK0YxnhP0b2RL`)
- WF-34 Payment Rejection Processor (`se82n3MUQ9xE5aEr`)
- WF-42 Consultation Closer (`fx70vqyJtRdF2DgR`)
- WF-75 Window-Closing Nudge (`YnxDRcnCugnpGY0n`) — **INACTIVE at baseline; to be activated in Phase F**

**Postgres tables:** `chinmay_astro.users`, `chinmay_astro.messages`, `chinmay_astro.payments`, `chinmay_astro.consultations`
**Slack channels:** consult `C0B567A175W` (user 41 / 61466927921) + admin `C0A5B0ZE81E`
**Latency threshold:** 5000 ms

## Approved templates (Meta)
- `astrology_service_update` (utility, `{{1}}`) — PDF-15 out-window relay
- `payment_rejection` (utility, fixed + retry quick-reply) — PDF-17
- `consultation_closed` (utility, 3 quick-reply buttons: Leave Feedback / Book Again / Done, Thanks.) — PDF-19
- `consultation_activated` — payment approval (pre-existing)

## Test subject
**Single number: 61466927921 (user 41, "Test User"), slack channel C0B567A175W.**
Starting state: `payment_submitted`, last WA inbound ~59h ago (window CLOSED at baseline).
Walk forward through the cluster; SQL window-fixtures (backdate `messages.created_at`) recreate a closed
window between in-window and out-window halves (operator-approved 2026-06-10).

## Coordination decisions (2026-06-10)
- SQL window fixtures: **APPROVED** (docker-exec write path). NOTE: fixtures must target a
  `metadata->>'transport'='wa'` inbound row (WF-41/WF-75 now gate on transport, not message_type — see PDF-20).
- PDF-18 / WF-75: **INCLUDE** — activate + smoke this session (Phase F).
- WF-41 WA-scope finding: **RESOLVED pre-smoke by PDF-20 (2026-06-09)** — both WF-41 (`Load Last Inbound`)
  and WF-75 now gate on `metadata->>'transport'='wa'` instead of the `message_type` proxy. Reclassified
  from observe-only to **verify-the-fix**: confirm the relay window read keys on the real WA inbound, not
  the astrologer's Slack rows. (Skew confirmed gone live for user 42; user 41 inbound source = msg #443.)

## Baselines (cursors)
- n8n exec cursor: **4102** (`.cursors/exec-cursor`)
- time cursor: **2026-06-09T20:40:22Z** (`.cursors/time-cursor`)
- `users`: 4 rows, max(updated_at)=2026-06-09 20:16:46Z
- `messages`: 142 rows, max(created_at)=2026-06-09 20:16:49Z
- `payments`: 5 rows, max(created_at)=2026-06-09 08:59:26Z
- `consultations`: 4 rows, max(created_at)=2026-06-09 20:16:46Z

## Scenario plan (user-paced)
| Phase | Action (operator drives) | Item(s) | Expected | Window |
|---|---|---|---|---|
| A | Admin `REJECT` in consult channel | PDF-17 | `payment_rejection` template lands; user→payment_pending | closed (59h, natural) |
| B | Tap "Payment Completed" template button → admin `APPROVE` | PDF-17 retry (WF-02 normalizer) + activation | retry routes; user→consultation_active | tap re-opens |
| C | Dr. Chinmay relays a reply in Slack | PDF-15 in-window | free-form text delivered (no template) | open |
| D | SQL fixture: backdate inbound to 25h → relay again | PDF-15 out-window + WF-41 WA-scope obs | `astrology_service_update` template delivered | closed (fixture) |
| E | Admin `CLOSE` → tap a button | PDF-19 | `consultation_closed` template + 3 buttons; tap routes via WF-02 | closed |
| F | Activate WF-75 + 18–24h unanswered fixture | PDF-18 | nudge posts to consult channel; repeats; self-terminates on reply/24h | n/a |
| (opp.) | Force a Meta send failure | PDF-16 | failure surfaced as in-channel notice to Dr. Chinmay (no silent drop) | — |

---

## Session log

### Action — 2026-06-09T20:49:17Z — Phase A (PDF-17 rejection → template)
**Operator to perform:** issue admin `REJECT` for user 41 (61466927921) in consult channel `C0B567A175W`.
**Pre-state:** user 41 `payment_submitted`, payment #27 `pending_verification`, window closed ~59h.
**Expected:**
- WF-34 Payment Rejection Processor fires.
- Customer receives the `payment_rejection` **template** (NOT the old interactive button message) — proves DD-1/DD-E always-template, and that it lands despite the closed window (M2 utility template out-window).
- The template carries a "Payment Completed" retry quick-reply button.
- DB: user 41 → `payment_pending`; payment #27 → rejected/failed status.
- Slack: in-channel confirmation to Dr. Chinmay.
**Cross-check targets:** WF-34 exec success · `payment_rejection` send via WF-50 · user status transition · no silent failure.

### Tick — 2026-06-09T21:15Z — Phase A result
**Trigger:** operator issued `REJECT`, said "check" — message went through on phone.
**New executions:** 12 (12 ok, 0 failed, 0 slow)
**Workflow chain:** WF-10(4103) → WF-11(4104) → WF-34(4105) → WF-50(4106) → WF-60(4107) → WF-51(4108) → WF-60(4109,4110) → WF-10(4111) → WF-00(4112,4113,4114)
- WF-34 Payment Rejection Processor (4105) — success
- WF-50 Send WhatsApp (4106) — success — `payment_rejection` template send **(window closed ~59h → still delivered, M2 utility-template out-window)**
- WF-51 Send Slack (4108) — success — in-channel confirm to Dr. Chinmay
- WF-00 Webhook Receiver ×3 (4112–4114) — inbound Meta status callbacks (sent/delivered/read) → corroborates physical delivery
**DB deltas:**
- users: user 41 → `payment_pending` (was payment_submitted) ✅
- payments: #27 → `rejected` ✅
**Cross-check vs expected:**
- ✅ WF-34 fired on REJECT
- ✅ payment_rejection delivered as a **template** out-of-window (the PDF-17 core proof — DD-1/DD-E always-template)
- ✅ user → payment_pending · payment #27 → rejected
- ✅ Slack confirmation to Dr. Chinmay (WF-51)
- ✅ physical arrival confirmed by operator + 3 Meta status callbacks
- ✅ **RESOLVED in Phase B tick:** msg #457 logged `message_type=template, content=template:payment_rejection` → confirms it was the template, not the old interactive message. Operator confirmed retry button visible.

### Action — 2026-06-09T21:17Z — Phase B (PDF-17 retry tap → WF-02 normalizer)
**Operator performed:** tapped "Payment Completed" quick-reply on the rejection template (phone).
**Expected:** template-button tap (M5 `button` shape) → WF-00 logs by label → WF-02 normalizes label→payment_completed → WF-32 re-submits → user→payment_submitted + WA ack + Slack alert. Window re-opens.

### Tick — 2026-06-09T21:18Z — Phase B result
**Trigger:** operator tapped "Payment Completed"; WA ack + Slack alert observed.
**New executions:** 13 (13 ok, 0 failed, 0 slow)
**Workflow chain:** WF-00(4115) → WF-60(4116) → WF-01(4117) → **WF-02(4118)** → WF-32(4119) → WF-50(4120) → WF-60(4121) → WF-51(4122) → WF-60(4123) → WF-00 status callbacks(4124,4126,4127) + WF-10 echo(4125)
- WF-02 User State Router (4118) — success — **the template-button normalizer fired** (PDF-17 receiving side; shared mechanism PDF-19 reuses)
- WF-32 Payment Confirmation Receiver (4119) — success — retry re-submission handled
- WF-50 (4120) — WA ack ("we'll verify your payment") · WF-51 (4122) — "New Payment Submission" alert to admin
**DB deltas:**
- users: user 41 → `payment_submitted` (retry accepted) ✅
- messages: #460 inbound `message_type=button, transport=wa, content="Payment Completed"` — **M5 template-tap shape, logged by label** ✅ · #461 outbound WA ack · #462 Slack alert
- **window RE-OPENED** — fresh WA inbound #460 @ 21:17:24 (sets up Phase C in-window)
**Cross-check vs expected:**
- ✅ template tap arrived as `button` shape, logged by label "Payment Completed"
- ✅ WF-02 normalizer routed it (label→payment_completed) → WF-32 handled — **PDF-17 retry path end-to-end**
- ✅ user → payment_submitted · WA ack + Slack alert delivered
- ✅ this validates the exact WF-02 receiving-side mechanism PDF-19's close buttons depend on

### Tick — 2026-06-09T21:22Z — Phase B2 (APPROVE → activation, setup)
**Trigger:** operator issued `APPROVE`, said "check".
**New executions:** 11 (11 ok, 0 failed, 0 slow)
**Workflow chain:** WF-10(4128) → WF-11(4129) → WF-33(4130) → WF-50(4131) → WF-60(4132) → WF-51(4133) → WF-60(4134,4135) → WF-10 echo(4136) → WF-00 status(4137,4138)
- WF-33 Payment Approval Processor (4130) — success
- WF-50 (4131) — `consultation_activated` template · WF-51 (4133) — "Consultation Activated" Slack confirm
**DB deltas:**
- users: user 41 → `consultation_active` ✅ · slack_channel_id `C0B567A175W` reused (no new WF-52 channel — Design Rule 2/10) ✅
- messages: #463 outbound `template:consultation_activated` (wa)
- **window state for Phase C:** last WA inbound = #460 @ 21:17:24 → OPEN (~5 min) ✅
**Cross-check:** ✅ activation path nominal; user active; channel reused; window open for in-window relay.

### Action — 2026-06-09T23:09Z — Phase C (PDF-15 in-window relay → free-form)
**Operator performed:** typed a free-form reply as Dr. Chinmay in consult channel ("How can I help you Test User ?").
**Expected:** WF-41 reads window via WA inbound #460 (~1h52m old) → OPEN → WF-50 sends free-form WA **text** (not template).

### Tick — 2026-06-09T23:10Z — Phase C result
**Trigger:** operator relayed from Slack; message arrived on WA.
**New executions:** 9 (9 ok, 0 failed, 0 slow)
**Workflow chain:** WF-00(4139 stray status cb) · WF-10(4140) → **WF-41(4141)** → WF-50(4142) → WF-60(4143,4144) → WF-00 status(4145,4146,4147)
- WF-41 Admin→User Relay (4141) — success — window read OPEN → free-form path
- WF-50 (4142) — free-form WA text send
**DB deltas:**
- messages: #466 outbound **`message_type=text, transport=wa`** content verbatim — **free-form, NOT a template ✅ (PDF-15 in-window proof)** · #467 slack echo
**Cross-check vs expected:**
- ✅ relay delivered as free-form text in-window (message_type=text, not template)
- ✅ WF-41 window read resolved OPEN off the real WA inbound
- ℹ️ Note: Phase C alone does NOT isolate PDF-20 (window genuinely open → both old & new query agree). **Phase D is the decisive PDF-20 test** (old WA inbound + recent Slack rows → corrected query must still say CLOSED).

### Fixture — 2026-06-09T23:11Z — Phase D window setup (PDF-20 trap)
**Write (docker-exec):** `UPDATE chinmay_astro.messages SET created_at = now() - interval '25 hours' WHERE id=460;`
**Original ts (for restore):** msg #460 = `2026-06-09 21:17:24.135305+00`.
**Result state — the PDF-20 trap armed:**
- WA inbound MAX (`transport='wa'`): #460 @ **25.0h → CLOSED** (corrected WF-41 query → template path)
- Any inbound MAX (buggy, no transport): Slack #467 @ **0.0h → OPEN** (pre-PDF-20 bug would go free-form → silent fail)
- Decisive: the corrected query must ignore the recent Slack rows and route to template.

### Action — Phase D (PDF-15 out-window relay → template + PDF-20 verify)
**Operator to perform:** type another free-form reply as Dr. Chinmay in the consult channel (plain, short — e.g. one sentence).
**Expected:** WF-41 reads window CLOSED (25h, transport-scoped) → sanitize template-safe → send via `astrology_service_update` **template** (NOT free-form). msg logged `message_type=template, content=template:astrology_service_update`.

### Tick — 2026-06-09T23:16Z — Phase D result (FLAGSHIP: PDF-15 out-window + PDF-20)
**Trigger:** operator relayed "You need to believe in astrology…" from Slack; screenshot confirms template render on phone.
**New executions:** 8 (8 ok, 0 failed, 0 slow)
**Workflow chain:** WF-10(4148) → **WF-41(4149)** → WF-50(4150) → WF-60(4151,4152) → WF-00 status(4153,4154,4155)
- WF-41 (4149) — success — window read CLOSED (transport-scoped) → template path
- WF-50 (4150) — `astrology_service_update` template send
**DB deltas:**
- messages: #468 outbound **`message_type=template, content=template:astrology_service_update`** ✅ · #469 slack echo
**Cross-check vs expected:**
- ✅ **PDF-15 out-window** — relay delivered as `astrology_service_update` template (not free-form), window closed; screenshot confirms physical render (header + body + {{1}} + suffix)
- ✅ **PDF-20 DECISIVE** — corrected `transport='wa'` query routed to template *despite* recent Slack inbound rows (#467/#469 @ ~0h). A pre-PDF-20 query would have read OPEN off the Slack row → free-form → silent Meta rejection. Template = correct = fix verified end-to-end.
- 🟡 **UX finding (BUG-01 [minor], copy):** template prefix/suffix wrapping buries Dr. Chinmay's actual message; literal `*` asterisks render (bold not parsed across newline). Operator-raised. → resolved by PDF-21 (see below). NOT a delivery defect; deliverability is correct.

### PDF-20 + PDF-21 (built between Phase D and D2, by operator)
- **PDF-20** — WF-41 + WF-75 window read switched from `message_type` proxy to `metadata->>'transport'='wa'` (verified decisively in Phase D).
- **PDF-21** — WF-41 out-window relay repointed `astrology_service_update` → **`astrology_service_update_v2`** (new template: header "Follow-up on your consultation", body `*Dr. Chinmay has responded to your message:* {{1}}` + "Thanks, Chinmay Astro"; bold renders because `{{1}}` is inline). Single-call-site change (const TEMPLATE in Prepare WhatsApp Message); payload contract unchanged (1 positional {{1}} text, en).
- **BUG-01 resolution:** v2 is a NEW template (not an edit of the approved v1) → sidesteps Meta reclassification risk. v1 retired.
- Note: direct Meta template pre-check not possible — `WA_ACCESS_TOKEN` is send-scoped (Graph GET → 400 code 100/subcode 33). Verified instead by live send (below).

### Tick — 2026-06-10T10:56Z — Phase D2 (PDF-21 v2 template live verify)
**Trigger:** operator relayed "Your future is changing tomorrow." out-of-window (user 41, 36.5h closed); received on WA.
**New executions (this action):** WF-10(4232) → **WF-41(4233)** → WF-50(4234) → WF-60(4235,4236) → WF-00 status(4237,4238,4239) — all success.
*(4190–4231 = intervening build-sprint + unrelated traffic over the ~11h gap, incl. a CLOSE for a different user @09:39; not attributed to this smoke.)*
**DB deltas:**
- messages: #487 outbound **`message_type=template, content=template:astrology_service_update_v2`** ✅ · #488 slack echo
**Cross-check vs expected:**
- ✅ **PDF-21 verified** — WF-50 send succeeded (no Meta 132000/132001) → v2 name + en + single body param match Meta's approved structure
- ✅ logged as `astrology_service_update_v2` (v1 fully retired, 0 references)
- ✅ out-window template path still correct post-repoint (window 36.5h closed → template)
- ✅ operator confirmed render: bold prefix + inline text + "Thanks, Chinmay Astro", no stray asterisks → **BUG-01 fully resolved**

### Tick — 2026-06-10T11:08Z — Phase E result (PDF-19 close → template + button)
**Trigger:** operator issued `CLOSE` for user 41 (window still closed), said "check". Three sub-flows fired.
**Chain 1 — CLOSE → template:** WF-10(4240) → WF-11(4241) → **WF-42(4242)** → WF-50(4243) → WF-60(4244) → WF-51(4245)
**Chain 2 — customer REACTION (bonus, non-PDF):** WF-00(4252) → WF-01(4254) → WF-02(4255) → **WF-61 Silent-Drop & Escalate(4256)** → WF-50(4257)
**Chain 3 — "Done, Thanks." button tap:** WF-00(4262) → WF-01(4264) → **WF-02 normalizer(4265)** → **WF-43 Post-Consultation Handler(4266)** → WF-50(4267) → WF-51(4269)
All execs success, none slow.
**DB deltas:**
- users: user 41 → `consultation_closed` ✅
- messages: #489 outbound **`template:consultation_closed`** ✅ · #491 CLOSE cmd · #492 inbound `reaction` (wa) · #493 "text messages only" guard · #494 inbound `message_type=button, content="Done, Thanks."` (M5 shape) ✅ · #495 "Thank you for choosing Chinmay Astro" · #496 Slack "User tapped Done"
**Cross-check vs expected:**
- ✅ **PDF-19 core** — CLOSE → `consultation_closed` template delivered out-of-window (always-template, DD-1/M5)
- ✅ user → consultation_closed · operator confirmed 3 quick-reply buttons on the template
- ✅ **PDF-19 button routing** — "Done, Thanks." tap arrived as `button` shape → WF-02 normalizer → WF-43 → "Thank you" reply + Slack notice (reuses the exact mechanism proven in Phase B)
- ⚠️ **partial coverage:** only "Done, Thanks." tapped; "Leave Feedback" + "Book Again" label→route not individually exercised (labels confirmed present in template). WF-02 BUTTON_MAP keys all 3 — the one tapped matched cleanly.
- 🟢 **bonus observation:** a WhatsApp reaction (#492) was handled gracefully by WF-61 → "this service supports text messages only" guard (#493). Not a PDF item; nice-to-know the non-text path is covered.

### Fixture + setup — 2026-06-10T11:2xZ — Phase F (PDF-18 / WF-75 nudge)
**WF-75 exact match (from WF-75.pseudo Step 2):** status=consultation_active · slack_channel_id NOT NULL ·
last wa inbound ∈ [NOW-24h, NOW-18h] · (last_outbound_wa IS NULL OR last_inbound > last_outbound_wa).
**Baseline dry-run BEFORE fixture: 0 matches** (no surprise nudges to other channels). ✅
**Writes (docker-exec):**
- `UPDATE messages SET created_at = NOW()-INTERVAL '26 hours' WHERE user_id=41 AND metadata->>'transport'='wa';` (69 rows — reset WA timeline older than the unanswered inbound)
- `UPDATE messages SET created_at = NOW()-INTERVAL '20 hours' WHERE id=494;` (the unanswered customer inbound, in-band)
- `UPDATE users SET status='consultation_active' WHERE id=41;` (was consultation_closed from Phase E)
**Dry-run AFTER fixture: exactly 1 match — user 41**, inbound 20.0h, outbound 26.0h (unanswered), hours_until_close=4. ✅
**WF-75 ACTIVATED** via API (`active:true`). Project's first scheduled workflow now live.
**Trigger:** schedule is interval "every 2h" — not API-triggerable; operator to **Execute Workflow** in n8n UI for an immediate poll.
**Expected:** WF-75 scan → 1 row (user 41) → Build Nudge Payload → WF-51 → advisory Slack post to `C0B567A175W` ("⏳ Heads-up: Test User's free-reply window closes in ~4h…"). No customer contact, no DB write.

### Tick — 2026-06-10T11:20Z — Phase F result (PDF-18 / WF-75 match-path)
**Trigger:** operator clicked Execute Workflow on WF-75 in n8n UI; nudge received on Slack.
**Workflow chain:** **WF-75(4275, mode=manual)** → WF-51(4276) → WF-60(4277) → WF-10 echo(4278) — all success.
**DB deltas:**
- messages: #497 outbound **`message_type=slack_text, transport=slack`** — the nudge, content "⏳ Heads-up: Test User's free-reply window closes in ~4h…" ✅
- users: user 41 unchanged (`consultation_active`, updated_at = fixture time) → **no state write** ✅
**Cross-check vs expected:**
- ✅ **PDF-18 match-path** — exactly 1 match (user 41) → single advisory nudge to consult channel via WF-51 (operator confirmed Slack receipt)
- ✅ correct copy incl. computed "~4h until close"
- ✅ **no customer-facing WA send, no DB state write** (advisory/non-blocking per DD-5)
- ✅ **REPEAT-readiness proven** — post-nudge dry-run STILL matches (nudge logged `transport=slack` → ignored by the WA-scoped query) → nudge repeats next poll instead of self-disabling. This is the decisive PDF-20 payoff on the WF-75 side.
- ⏳ **not yet exercised:** self-termination (path 1: Dr. Chinmay WA reply → last_outbound_wa > last_inbound → match drops; path 2: inbound crosses 24h → out of band) — both structurally enforced by the query; optional live demo via one more relay.
