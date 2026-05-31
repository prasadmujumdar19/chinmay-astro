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
