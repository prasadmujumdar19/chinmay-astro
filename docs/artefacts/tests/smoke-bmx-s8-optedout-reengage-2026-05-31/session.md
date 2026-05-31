# Smoke Test — BMX S8 opted_out re-engagement

**Test type:** smoke (sprint exit gate — `BMX-P5-MATRIX`, sprint `behavior-matrix-fixes-2026-05-27`)
**Slug:** bmx-s8-optedout-reengage
**Date:** 2026-05-31
**Operator:** prasadmujumdar.aws@gmail.com (driving WhatsApp handset)
**Test phone:** 61466927921 (+61, Australia — WF-01 Country Filter allows 91 & 61)

## Design / expected-behavior docs
- `docs/artefacts/reviews/behavior-matrix-2026-05-27/index.html` — the matrix test plan (S8 row = opted_out)
- Runbook: `docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/handoffs/handoff-batch-17-matrix-static-done-smoke-pending.md`

## Acceptance subset — 7 S8 cells (opted_out state)
Setup path chosen by operator: **full journey first** (onboard → consult → close → flip to opted_out) so WF-43 relay runs against a REAL slack_channel_id.

| Cell | Scenario | Expected on re-engagement from opted_out |
|------|----------|------------------------------------------|
| S8×A | "Hi" / greeting (text, no keyword) | WF-01 opted_out branch → WF-26 (no welcome-back interstitial) → status opted_out→consultation_closed → WF-02 re-route → WF-43→WF-25 contextual reply via WF-50, same turn |
| S8×B | Free-form question | same chain; contextual reply answers the question same turn |
| S8×C | STOP keyword | re-engage handled (status lift) per DR; STOP semantics per design |
| S8×D | REBOOK keyword | re-engage → rebook path |
| S8×E | HELP keyword | re-engage → HELP handling |
| S8×F | Reserved-looking kw (UNSUBSCRIBE/STATS/LIST/APPROVE PAYMENT) | re-engage; not mistaken for admin cmd |
| S8×I | "Payment Completed" button (interactive) | re-engage handled |

(S8×G media = fixed in-sprint via Fix A; S8×H form = N/A per Meta.)

## Watch surface
- **n8n executions:** all active workflows (cursor: exec id > 2391)
- **Postgres tables:** chinmay_astro.users, pending_users, consultations, messages, payments (time cursor: 2026-05-30T23:15:10Z)
- **Slack channels:** admin C0A5B0ZE81E (chinmay-admin-commands) + consult-61466927921 (created during onboarding)
- **Latency threshold:** 5000 ms

## Baselines (captured 2026-05-30T23:15:10Z)
- Last n8n execution id: **2391**
- users: 0 rows · pending_users: 0 rows (stale 918411813111 row removed pre-test, unrelated) · consultations: 0 · messages: 0 · payments: 0
- Test phone 61466927921: no users / pending_users record (clean slate)

---

## Test log

### Action — 2026-05-30T23:17Z
Operator sent "Hi" (text) from 61466927921 to begin onboarding. Expected: WF-00→01→02→21, pending_users write, policy+Flow form via WF-50.

### Tick — 2026-05-30T23:18Z
**Trigger:** operator said "check" — nothing came back on WA.
**New executions:** 3 (3 ok, 0 failed) — exec 2392 WF-00 Webhook Receiver (webhook) → 2393 WF-60 Message Logger → 2394 WF-01 Message Router. All "success". Chain stopped at WF-01; no WF-02 / WF-21 / WF-50.
**WF-01 trace:** lastNodeExecuted = `Silent Reject (Country)`. nodes: `Layer 1: Country Filter` → `Country Rejected?` (true) → `Silent Reject (Country)`. Filter output: `securityCheck=REJECTED, rejectReason=country_not_allowed, silent=true`. Inbound payload correct: `phoneNumber=61466927921, phoneNumberFormatted=+61466927921, messageType=text, content="Hi"`.
**Cross-check vs expected:** ❌ — expected onboarding chain + Flow form; observed silent country rejection at WF-01 front door.

### Issues found
- **[critical] BUG-01 — WF-01 (`hYGNM97sXvdo1WmI`) Country Filter rejects ALL inbound numbers (incl. +91).**
  Node `Layer 1: Country Filter` (`n8n-nodes-base.code` typeVersion 2) compares `input.phoneNumberFormatted` (which is `+`-prefixed, e.g. `"+61466927921"`) against bare codes `['91','61']`. `"+61...".startsWith('61')` is always false → every number silently rejected. Should read `input.phoneNumber` (bare digits, already present in payload) — or strip the leading `+` before the prefix check. Regression from BMX-P2-WF01 rebuild (Batch 4, 2026-05-30); missed by static matrix trace (logical path traced, string comparison not executed). Go-live blocker: blocks the entire user journey for everyone, not just this smoke. Backup taken before fix: see Changed Reference Values.

### Fix — BUG-01 (build-workflow, Surgical/parametric) — 2026-05-31T09:30Z
WF-01 `Layer 1: Country Filter` jsCode patched (2 find/replace via `patchNodeField`):
- `const phone = input.phoneNumberFormatted;` → `const phone = String(input.phoneNumber || input.phoneNumberFormatted || '').replace(/^\+/, '');`
- `countryCode: phone.substring(0, 3)` → `countryCode: phone.substring(0, 2)`
Impact check: `countryCode` produced only by this node, consumed by no downstream workflow (grep across workflows/ → only WF-01's own files). PASS branch preserves full envelope via `...input` spread (unchanged). No nodes added/removed → no dangling-ref scan needed. Control flow unchanged by design. Backup: `archive/backups/hYGNM97sXvdo1WmI-2026-05-31-09-30.json`. Re-fetch confirmed patch live (regex `/^\+/` intact). Awaiting live re-test (re-send "Hi").

### Changed Reference Values
- **WF-01 (`hYGNM97sXvdo1WmI`) live changed (BUG-01 fix):** Country Filter reads bare-digit phone. Backup `archive/backups/hYGNM97sXvdo1WmI-2026-05-31-09-30.json`. Registry + export + pseudo pending after live verify.

### Action — 2026-05-31 (partner test, exec 2400)
Partner sent "Hi" from 919960965277. Chain ran: WF-01 PASSED (✅ confirms BUG-01 fix works for a fresh number) → WF-02 → WF-21 (pending_users) → WF-50 to send the Flow form. WF-50 errored; no form delivered.

### Issues found
- **[critical] BUG-02 — WF-50 flow-form send fails: Meta `(#131009)` flow_id invalid/not-sendable.**
  Exec 2400 (WF-50 `BUVun38WEKb12zg9`), node `Send Interactive Message`, Meta 400. Detailed error_data: *"Parameter \"flow_id\" is invalid. Please check if the flow associated to this id belongs to your WhatsApp Business Account, and it's in a valid state."* flow_id sent = `2260297164474475` (the BMX-P8-DOCS-corrected ID). Initial hypothesis (missing `flow_action_payload` for `flow_action:navigate`) was REFUTED by the detailed error — the rejected parameter is `flow_id` state/ownership, NOT the action payload. Root cause is Meta-side: the flow is likely **draft/unpublished** or not owned by the WABA behind phone 919653240263 (phoneNumberId 1104226366097236). NOT an n8n logic bug. Resolution pending operator confirmation of flow publish state. (Note: with the OLD dead flow_id 1408011897720771 this never surfaced — the corrected ID now reaches Meta's state check.)
  - **BUG-02a [adjacent]:** `Prepare Interactive Message` sets `flow_action:"navigate"` with no `flow_action_payload`. Not the cause of this failure, but if the flow is published as a navigate-style (non-endpoint) flow, Meta will require `flow_action_payload.screen` next. Flagged for follow-up once flow state is confirmed.
  - **ROOT CAUSE CONFIRMED (operator, 2026-05-31):** flow `2260297164474475` lives in a **Test WA account** (same Meta business profile, different account); the production token is not for that account → Meta rejects rightly. NOT an n8n bug. **Also surfaces a docs defect:** BMX-P8-DOCS set the documented Flow ID to `2260297164474475` (test-account flow). Operator will recreate the flow as **Without-endpoint** under the Chinmay Astro account (phone 919653240263), publish, and provide a NEW production flow_id.
  - **Resolution path:** (1) operator creates+publishes flow under correct WABA using `workflows/flows/collect-personal-details.json` (verified GitHub==local==operator's validated code, IDENTICAL, 2026-05-31); (2) operator provides new flow_id; (3) persist new id project-wide — producer is `WF-21 interactivePayload.flowId`, plus CLAUDE.md Key Credential IDs table + workflow-registry; (4) re-test form delivery. BUG-02a (navigate payload) re-evaluated after publish.
  - Endpoint decision: **Without-endpoint** (static intake form; no live server needed; website URL is just text content — already done in TERMS_SCREEN). Recorded 2026-05-31.

### Fix — BUG-02 (Batch Surgical / parametric flow-ID swap) — 2026-05-31T10:26Z
Operator created published Without-endpoint flow "Collect Birth Details" `1137788551887662` under the correct WABA. Persisted project-wide:
- **Live producers (8 Code nodes / 3 WFs):** WF-21 `zM8WbxSdt9nXRoLZ` (Build Welcome/Service/Redirect), WF-23 `VpCER0Vqq3NYJGpI` (Build Welcome/Service/Help/Redirect), WF-45 `MUG7rPgSHc7UtAE9` (Build Setup). jq gsub on Code-node jsCode → curl PUT (all http=200). Verify re-fetch: old=0 everywhere, new present (WF-21:6, WF-23:8, WF-45:2). Backups: `archive/backups/{zM8WbxSdt9nXRoLZ,VpCER0Vqq3NYJGpI,MUG7rPgSHc7UtAE9}-2026-05-31-10-26.json`. Exports refreshed. Lint: 15 advisory, 0 blocking, all pre-existing (not introduced by swap).
- **Docs:** CLAUDE.md Key Credential IDs, workflow-registry (3 refs + corrected BMX-P8-DOCS narrative), pseudocode WF-21/45 `.pseudo` + WF-21/23/45 `.md`.
- Flow JSON `workflows/flows/collect-personal-details.json` verified GitHub==local==operator validated code (identical) — paste-ready, no change.
- **Status:** awaiting live re-test (re-send "Hi" from 61466927921) to confirm form delivery. BUG-02a (navigate payload) to be re-checked from the live execution.

### Tick — 2026-05-31T00:32Z (post-fix onboarding re-test, run 2402–2407)
**Trigger:** operator re-sent "Hi" from 61466927921 after BUG-01 + BUG-02 fixes; form came through, operator filled it (not yet submitted).
**New executions:** chain all success — WF-00 (2402) → WF-60 (2403) → WF-01 (2404) → WF-21 (2405) → classifier tJknCwk2PzLpEwTX (2406) → WF-50 (2407). Trailing WF-00 ×3 (2410-2412) = Meta delivery/read status callbacks, no-op.
**WF-01:** PASSED Country Filter for +61 → **BUG-01 fix live-confirmed for the real test number** (prior confirmation was +91 partner run).
**WF-50 (2407):** sent flow_id **1137788551887662** (new), Meta accepted (wamid decodes to 61466927921) → **form delivered. BUG-02 fix live-confirmed.**
**DB delta:** pending_users +1 → `61466927921 / "Prasad Mujumdar"` @ 00:31:14. No users row yet (correct per Design Rule #1 — pre-form write to pending_users only).
**Cross-check vs expected:** ✅ onboarding chain fired; ✅ pending_users insert; ✅ Flow form delivered. All green.
**Next:** operator submits the form → expect WF-22 form-callback → users row created (payment_pending) + consult-61466927921 Slack channel created (WF-52).

### Fix — BUG-02a (build-workflow, Structural/non-parametric) — 2026-05-31T10:49Z
**Promoted from adjacent → active blocker.** Form delivered but failed to OPEN on device: "Something went wrong. Try again later." Flow itself valid (Published, 0 JSON errors, renders in Meta Preview). Cause: WF-50 sent `flow_action:"navigate"` with NO `flow_action_payload`. Meta docs (developers.facebook.com flows sendingaflow): navigate REQUIRES `flow_action_payload.screen` — send API accepts the message (wamid returned) but the client has no target screen to render on open. NOT a fresh-publish propagation delay (deterministic).
Fix: WF-50 `BUVun38WEKb12zg9` `Prepare Interactive Message` — added `flow_action_payload: { screen: input.interactivePayload.flowScreen || "DETAILS_SCREEN" }` (defaults to the flow's entry screen; overridable per-caller, no caller changes needed). patchNodeField, verified live. Backup `archive/backups/BUVun38WEKb12zg9-2026-05-31-10-49.json`. WF-50.pseudo updated (Step 8). Export refreshed. WF-50.md → sprint-end regen list. Awaiting live re-test (re-tap the form).

### Operator notes (no code change)
- **DOB 18+ gate — decided AGAINST.** Rationale (operator, 2026-05-31): WhatsApp eligibility/age is Meta's responsibility (verified-user base); and the WA account holder may legitimately book for someone else (e.g. parent → child), so the form's birth details are decoupled from the account holder. A hard DOB gate is an anti-pattern here. No change.
- **Time-of-birth 24h hint** — helper-text shows "HH:MM (e.g. 14:30)"; the explicit "24-hour format" wording appears only in the on-error message. UX note only, non-blocking. No fix.

### Issues found
- **[critical] BUG-03 — Flow `1137788551887662` routing cycle → no valid entry screen.**
  After BUG-02a fix (screen=DETAILS_SCREEN added), exec 2419 WF-50 → Meta `(#131009)`: *"Specified screen DETAILS_SCREEN is not allowed as first screen of this flow. Allowed screen name is: <none>."* Root cause: flow JSON has a cyclic route — `DETAILS_SCREEN`→`TERMS_SCREEN` (OptIn "I agree" forward navigate) AND `TERMS_SCREEN`→`DETAILS_SCREEN` ("Back to Form" Footer backward navigate). WhatsApp routing rule: entry screen = the one with NO inbound edge; only forward routes allowed. The back-route gives DETAILS_SCREEN an inbound edge → no screen qualifies as entry → "<none>". Flow Builder published with 0 errors (auto-routing-model); only fails at send-time entry computation. **Fix is in the flow JSON (operator side), NOT WF-50.** WF-50's flow_action_payload.screen=DETAILS_SCREEN is correct and retained — works once DETAILS_SCREEN is a valid entry. Refs: heltar.com INVALID_ROUTING_MODEL (no entry / backward route), Meta interactive-flow-messages docs.
  - Fix options presented to operator: (A) remove "Back to Form" backward navigate on TERMS_SCREEN, rely on WA native back arrow → DETAILS_SCREEN becomes entry; (B) drop TERMS_SCREEN, show terms via EmbeddedLink to privacy URL on DETAILS_SCREEN (1 screen, no cycle). Awaiting operator choice + re-publish + stored-JSON update + re-test.

### Tick — 2026-05-31 (BUG-03 fix verified)
Operator published single-screen flow (+ EmbeddedLink for privacy). Re-sent "Hi" (now pre-form user → shorter re-send copy via WF-23). **Form OPENED on device — BUG-03 fixed.** ✅ BUG-01/02/02a/03 all resolved.

### Issues found
- **[minor] BUG-04 — Flow pattern-validated fields show error marker + error-message on initial render (empty).**
  Full Name (and Time of Birth, per earlier screenshot) display their pattern `error-message` immediately on open, before any input. Cause: WhatsApp Flows evaluates TextInput `pattern` eagerly against the empty initial value; empty fails the (non-optional) regex → error shown. DatePicker (no pattern) unaffected. Fix (flow-side, no n8n): wrap each pattern body in `(...)?` so empty is valid per pattern; `required:true` still enforces presence on submit, invalid non-empty still errors. Verified 17 regex cases (empty✓ valid✓ invalid✗). Affects full_name, time_of_birth, place_of_birth, email_address. Operator to apply in Builder + republish (same flow ID 1137788551887662) + re-test.

### Tick — 2026-05-31T11:32Z (form submission, run 2445–2449)
**Trigger:** operator submitted the form. Chain: WF-00 (2445) → WF-60 (2446) → WF-01 (2447) → WF-02 (2448) → WF-22 (2449). **All 4 of WF-00/01/02/22 errored with the SAME message** — WF-22 threw and the halt propagated up each synchronous `Call WF-XX` node (correct onError=stopWorkflow propagation, not 4 separate bugs).
Decrypted form payload (nfm_reply.response_json, plaintext): `{full_name:"Abcs djwje", date_of_birth:"2023-05-31", time_of_birth:"12:30", place_of_birth:"Mumbai, Maharashtra, India", email_address:"Skdi@djeje.com", consent:true, flow_token:"1780190764770"}`. Note consent=true (boolean) — and DOB is a 2yo (valid per no-DOB-gate decision; parent booking for child).

### Issues found
- **[critical] BUG-05 — WF-22 (`dr8QM0m92Ml8MvIh`) `Extract Form Data` treats OptIn `consent` as a string.** Line 14 was `consent: formData.consent && formData.consent.includes('agree')`. WhatsApp OptIn returns a **boolean** (`true`), so `true.includes` → "is not a function", halting form processing → no users row, no Slack channel, no payment instructions. Latent bug (no real form submission completed before — users table empty). **Fixed:** line 14 → `consent: formData.consent === true || (typeof formData.consent === 'string' && formData.consent.toLowerCase().includes('agree'))` (handles boolean true-case + defensive string-case). backup `archive/backups/dr8QM0m92Ml8MvIh-2026-05-31-11-32.json`, patchNodeField, verified live, exported. WF-22.md → sprint-end regen list. Awaiting live re-test (re-submit form).

### Open / deferred
- **BUG-04 (eager pattern error markers)** — STILL PRESENT after the `(...)?` pattern wrap (operator re-tested, markers still show on open); operator chose to defer ("move on for now"). Not resolved. Revisit: the pattern-optional approach did not suppress the eager display → likely WhatsApp validates `required` fields eagerly regardless of pattern. Candidate next step: research Form-level `error-messages` / whether removing `pattern` (keep helper-text + validate server-side) is the only way; or accept as minor cosmetic. NON-BLOCKING for the journey.

### Tick — 2026-05-31T01:46:44Z (BUG-05 re-test — form submission, runs 2462–2472) ✅ PASS
**Trigger:** operator re-submitted the form after the BUG-05 (consent-boolean) fix; got the WA payment-instructions response back.
**New executions (form-submit burst):** all success — WF-00 (2462) → WF-60 (2463) → WF-01 (2464) → WF-02 (2465) → **WF-22 `dr8QM0m92Ml8MvIh` (2466) SUCCESS** → WF-52 channel mgr `IO5BZLUxuVmjzk5I` (2467) → WF-50 `BUVun38WEKb12zg9` (2468, payment instructions) → WF-60 (2469) → WF-00 callbacks (2470–2472). (Preceding burst 2450–2461 was the pre-form "Hi" re-send via WF-23 → WF-50 form delivery.)
**WF-22 (2466):** ran clean — no `consent.includes is not a function` throw. **BUG-05 fix live-confirmed.**
**DB delta:** `chinmay_astro.users` row CREATED @ 01:45:49 → `61466927921 / "Abcd shejej"`, status **`payment_pending`**, `slack_channel_id=C0B567A175W`, DOB/time/place persisted. (No `consent` column in schema — consent is consumed in-flow, not stored; query for it errored harmlessly.)
**Slack:** WF-52 **reused** existing `consult-61466927921` channel `C0B567A175W` (history shows prior `APPROVE PAYMENT 61466927921` runs) — correct per Design Rule #10 (never archived, reused across rebookings). No WF-51 post on form-submit (onboarding→Chinmay notification fires at payment, not form submit) — expected.
**Cross-check vs expected:** ✅ users row (payment_pending) ✅ Slack channel present ✅ payment instructions delivered to handset. **All green — last front-of-funnel blocker cleared.**
**Next:** operator taps "Payment Completed" → expect status payment_pending→payment_submitted + WF-51 onboarding/payment notice to Chinmay's channel.

### Tick — 2026-05-31T01:49Z ("Payment Completed" tapped, runs 2473–2485) ✅ PASS
**Trigger:** operator tapped the "Payment Completed" interactive button; got WA ack back.
**New executions:** all success — WF-00 (2473) → WF-60 (2474) → WF-01 (2475) → WF-02 (2476) → payment handler `emUOLWVZiNVxcOe3` (2477) → WF-50 WA ack (2478) → WF-60 (2479) → **WF-51 `wlZRK0YxnhP0b2RL` Slack sender (2480)** → WF-60 (2481) → WF-00/logger trailers (2482–2485, incl. `wMh0oBRtJbvhLgOf`).
**DB delta:** `users.status` **`payment_pending` → `payment_submitted`** @ 01:48:51; payments row created (Payment ID 22).
**Slack:** WF-51 posted to `consult-61466927921` (`C0B567A175W`): "🔔 *New Payment Submission* — User: Abcd shejej · Phone: +61466927921 · Amount: ₹500 · Payment ID: 22 · `APPROVE PAYMENT 61466927921`". Business-language copy, correct APPROVE prompt. ✅
**Cross-check vs expected:** ✅ state transition ✅ WF-51 review notice with APPROVE prompt ✅ user WA ack. All green.
**Next:** operator runs `APPROVE PAYMENT 61466927921` in Slack → expect status payment_submitted→consultation_active + WF-52 invites bot/activates channel + WA "consultation active" to user.

### Tick — 2026-05-31T01:50Z (`APPROVE PAYMENT 61466927921`, runs 2486–2497) ✅ PASS
**Trigger:** operator ran `APPROVE PAYMENT 61466927921` in the consult channel; user got the "consultation active" WA message.
**New executions:** all success — admin/logger (2486) → admin cmd handler `GoTYo0GS2y8qjjkw` (2487) → approve handler `NcHZedq9ycnAQ9SW` (2488) → WF-50 WA active msg (2489) → WF-60 (2490) → WF-51 Slack confirm `wlZRK0YxnhP0b2RL` (2491) → loggers/callbacks (2492–2497).
**DB delta:** `users.status` **`payment_submitted` → `consultation_active`** @ 01:50:19; `current_consultation_id=17`; `consultations` row 17 **status=active**.
**Cross-check vs expected:** ✅ state transition ✅ consultation opened ✅ WA active message ✅ Slack approval confirm. All green.
**Next:** operator runs `CLOSE 61466927921` (or CLOSE CONSULT) in Slack → expect status consultation_active→consultation_closed + consultation row closed + WA close message.

### Tick — 2026-05-31T01:51Z (`CLOSE 61466927921`, runs 2498–2509) ✅ PASS
**Trigger:** operator ran CLOSE in the consult channel; user got the close message.
**New executions:** all success — admin/logger (2498) → admin cmd handler `GoTYo0GS2y8qjjkw` (2499) → close handler `fx70vqyJtRdF2DgR` (2500) → WF-50 WA close msg (2501) → WF-60 (2502) → WF-51 Slack confirm `wlZRK0YxnhP0b2RL` (2503) → loggers/callbacks (2504–2509).
**DB delta:** `users.status` **`consultation_active` → `consultation_closed`** @ 01:51:42; `current_consultation_id` cleared to NULL; `consultations` row 17 **status=closed**. Channel `C0B567A175W` NOT archived (Design Rule #10 — confirmed reused throughout).
**Cross-check vs expected:** ✅ state transition ✅ consultation closed + current_consultation_id cleared ✅ WA close message ✅ Slack confirm ✅ channel retained. All green.
**Milestone:** full onboarding → payment → approve → consult → close journey proven live end-to-end against the post-remediation state. Front-of-funnel + lifecycle all PASS.
**Next:** S8 setup — operator sends STOP from handset → expect status consultation_closed→opted_out + STOP confirmation. Then the 7 S8 re-engagement cells (re-STOP before each non-STOP cell, since the first re-engagement lifts opted_out).

---

## S8 opted_out re-engagement cells (the exit-gate acceptance subset)

Choreography: any message while opted_out lifts → consultation_closed (re-engage), so re-STOP before each non-STOP cell. Order: STOP-cell (C) first, REBOOK-cell (D, lands payment_pending) last.

### S8 setup — STOP (consultation_closed → opted_out), runs 2510–2523 ✅ PASS
**Trigger:** operator sent STOP; got STOP ack on WA.
**Chain:** WF-00 (2510) → WF-60 (2511) → WF-01 (2512) → WF-02 (2513) → opt-out handler `LgIDj1v4ZbCPlX25` (2514) → `2U7mxHMyqA41ROKX` (2515) → WF-51 Slack (2516) → WF-60 (2517) → WF-50 WA STOP ack (2518) → trailers. All success.
**DB:** `users.status` **`consultation_closed` → `opted_out`** @ 01:55:06. (Design Rule 4: STOP → opted_out, user-initiated.)
**Cross-check:** ✅ opted_out transition ✅ STOP ack delivered. Ready for S8 cells.

### S8×C — STOP while opted_out, runs 2524–2538 ✅ PASS
**Trigger:** operator sent STOP again (already opted_out).
**Chain:** WF-00 (2524) → WF-60 (2525) → WF-01 (2526) → **WF-26 re-engage `tKjwTYF6EER8ED3y` (2527, silent lift)** → WF-02 re-route (2528) → opt-out/STOP handler `LgIDj1v4ZbCPlX25` (2529) → `2U7mxHMyqA41ROKX` (2530) → WF-51 (2531) → WF-60 (2532) → WF-50 WA (2533) → trailers. All success.
**DB:** `users.status` stays **`opted_out`** @ 01:56:23 (WF-26 lifted to consultation_closed, STOP intercept in re-routed flow re-opted-out — net opted_out). Matches S8×C expectation (DR: re-engage/status-lift, then STOP semantics).
**Messages (verified single outbound):** inbound "STOP"; ONE outbound WA text "You have been unsubscribed from Chinmay Astro…" + one Slack notice "⚠️ User has opted out via STOP". **No welcome-back interstitial** despite WF-26 transit — silent lift correct.
**Cross-check:** ✅ stays opted_out ✅ single STOP/unsubscribe ack ✅ no spurious welcome ✅ not mis-routed. **PASS.**

### S8×A — "Hi" greeting while opted_out, runs 2539–2551 ⚠️ WIRING PASS / COPY FINDING (BUG-06)
**Trigger:** operator sent "Hi"; got a reply but flagged it as inappropriate for a re-engaging user.
**Chain:** WF-00 (2539) → WF-60 (2540) → WF-01 (2541) → WF-26 Re-Engaged Handler `tKjwTYF6EER8ED3y` (2542, lift) → WF-02 `PubCsNTOspF3xqXZ` (2543) → WF-20 Keyword Handler `LgIDj1v4ZbCPlX25` (2544, no kw match) → WF-43 Post-Consultation Handler `3va0M06kijgyLejf` (2545) → WF-25 Intent Classifier `eTV1lUcYrXBg2q2T` (2546) → WF-50 WA (2547) → trailers. All success.
**DB:** `users.status` **`opted_out` → `consultation_closed`** @ 01:58:26 (re-engage lift correct).
**Reply sent (WF-43 Gemini):** "Hello there! It was a pleasure speaking with you about your Vedic astrology consultation with Dr. Chinmay. Please feel free to reach out here on WhatsApp or email chinmay_astro@gmail.com if any further questions or thoughts come to mind."
**Structural verdict:** ✅ re-engage lift + contextual reply same turn (matches S8×A wiring expectation).
**[finding] BUG-06 — WF-43 (`3va0M06kijgyLejf`) `Prepare Gemini Response Prompt` mis-frames re-engagement.** Prompt hard-codes "The user has completed their consultation… Answer their question…". Two issues: (1) a bare greeting has no question → Gemini emits a backward-looking farewell, not a welcome-back; (2) copy invites free "follow up here for anything else" with no pointer to REBOOK (paid ₹500 path) — possible monetization leak for re-engaging users. Affects S8×A and S8×B (and any closed-user greeting). Root cause is the static prompt framing in one Code node. **Decision pending (operator + Chinmay):** fix-in-sprint (rewrite prompt: greeting-aware + welcome-back + REBOOK CTA) vs defer-as-followup vs broader product call on free-follow-up policy. Wiring is sound; this is copy/product, not structural.

### Fix — BUG-06 (build-workflow, Batch Surgical / parametric) — 2026-05-31T12:56Z
**Systemic audit first (operator-directed):** traced what actually reaches each of the 5 Gemini response-generators, upstream routing included. Findings: WF-21/23 (WF-62 classifier + `Apply Fail-Open` → `Route: Service?`) only ever receive `service_related_question` → **correctly scoped, no change**. WF-25 internally neutralizes garbage/abuse/inappropriate/stop (U2 counters / silent-block / stop-clarifier) and returns ONLY safe buckets → so the WF-25-based handlers' Gemini nodes receive: WF-30/31 = `general_enquiry` only (gated by `Is General Enquiry?`); WF-43 = `general_enquiry` + `wants_consultation` (catch-all after rebook/feedback/stop IFs). Greeting "Hi" lands in `general_enquiry` (WF-25 merges greetings+questions), which is why it reached the "answer their question" prompt.
**Fix (3 handlers, same shape):** rewrote each `Prepare Gemini Response Prompt` (Code node) to be greeting-aware ("their message may be a greeting or a question — respond naturally"). WF-43 (`3va0M06kijgyLejf`): welcome-back framing + REBOOK CTA, dropped "just completed your consultation" + email callout. WF-30 (`gGJBY5fJha0Let8I`): kept ₹500 pay-nudge + email. WF-31 (`HB8nXudAtk9iXz7C`): kept payment-under-review reassurance + email. Approved copy verbatim.
**Discipline:** backups `archive/backups/{3va0M06kijgyLejf,gGJBY5fJha0Let8I,HB8nXudAtk9iXz7C}-2026-05-31-12-56.json`; applied via `updateNode` (avoids shell-escaping ₹/em-dash/backtick); re-fetch verified all 3 carry `may be a greeting` + stage marker; Code-node return shape `return [{json}]` correct (no lint risk); no nodes removed/renamed (6a n/a), output shape unchanged (6c n/a), Code-only (6b n/a). Pseudo synced: WF-43.pseudo Step 12, WF-30.pseudo Step 5, WF-31.pseudo Step 6. Exports refreshed, secrets clean. **Commit held** pending operator check + post-smoke. WF-43/30/31 `.md` → sprint-end regen list.
**Post-MVP nuance** (opted_out-reengaged vs standard consultation_closed wooing) logged to `followups.md` — explicitly deferred by operator as overengineering for first roll-out.
**Status:** awaiting live re-test — re-run S8×A through the new WF-43 prompt.

### Tick — 2026-05-31 (BUG-06 fix re-test) ✅ S8×A + S8×B PASS
**Trigger:** operator sent STOP ×3 followed by different messages ("Hi" greeting, a free-form question, and a "do you have my details?" probe), exercising the new WF-43 prompt via the opted_out→re-engage path.
**Result (operator-confirmed):** Gemini responses are now relevant and appropriate — greeting gets a warm welcome-back (no more "pleasure speaking with you" farewell), question is answered. **BUG-06 fix verified live.** S8×A (greeting) and S8×B (free-form question) both PASS.
**Nuance surfaced (NOT a bug):** an opted_out user asking "Do you already have my details?" → Gemini correctly answers "yes, we do" (data is retained today). User raised the data-retention/compliance angle; agreed it's accurate for MVP and the nuanced opted_out-vs-closed treatment + retention policy/deletion job are a combined post-MVP workstream (logged to `followups.md` 2026-05-31). No MVP fix.

### S8 acceptance subset — progress (3 of 7 confirmed)
| Cell | Status |
|------|--------|
| S8×A "Hi" greeting | ✅ PASS (post BUG-06 fix) |
| S8×B free-form question | ✅ PASS (post BUG-06 fix) |
| S8×C STOP while opted_out | ✅ PASS |
| S8×D REBOOK keyword | ⏳ not yet tested |
| S8×E HELP keyword | ⏳ not yet tested |
| S8×F reserved-looking kw | ⏳ not yet tested |
| S8×I "Payment Completed" button | ⏳ not yet tested |

**Remaining:** S8×D/E/F/I (keyword + button paths — branch BEFORE Gemini, unaffected by BUG-06; need live verification per gate). Then matrix HTML static-verdict update + S8×G expectation rewrite (re-engage via WF-26, DR-4) + gate close.
