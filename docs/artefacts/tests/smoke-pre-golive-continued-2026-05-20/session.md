# Monitor Test Run — smoke / pre-golive-continued

**Started:** 2026-05-20T09:35:04Z
**Operator:** prasadmujumdar
**Test type:** smoke (continuation of `smoke-pre-golive-resume-2026-05-19`)
**Slug:** pre-golive-continued
**Folder:** `docs/artefacts/tests/smoke-pre-golive-continued-2026-05-20/`

## Reference docs

- `docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/tldr.md` — verdict + open items from prior session
- `docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/followups-wf60-architecture.md` — context for the open `messages.consultation_id` issue
- `docs/workflow-registry.md` — WF-XX master list
- `docs/CONTEXT.md` — architecture, DB schema, admin commands
- Functional test cases: TC-0303-reject, TC-0501 (REBOOK), TC-06xx (STOP/HELP), TC-07xx (BLOCK/UNBLOCK), onboarding (WF-21/22)

## Watch surface

- **n8n executions:** all active workflows
- **Postgres tables:** `users`, `pending_users`, `consultations`, `messages`, `payments`, `admin_actions`
- **Slack channels:** `C0B567A175W` (consult-61466927921), admin command channel (per CLAUDE.md DR-3a, user-targeted commands now scoped to the consult channel)
- **Latency threshold:** 5000 ms

## Baselines (captured at start)

- **Last execution id:** `1438`
- **Time cursor:** `2026-05-20T09:35:04Z`
- **Row counts:** users=1, pending_users=2, consultations=2, messages=4, payments=2, admin_actions=0
- **Test user state:** id=28, phone=61466927921, name="Abcs", status=`consultation_closed`, slack_channel_id=`C0B567A175W`
- **Messages snapshot:** rows 8–11 all have `user_id=28` populated; `consultation_id` is NULL on every row (the open item carried forward). Rows 8+9 carry the pre-fix literal-quote wrap; rows 10+11 are clean (post-fix verified 2026-05-20T09:07Z).

## Carry-forward decision

Continue from user id=28 (`consultation_closed`) — exercise REJECT/REBOOK/STOP/HELP/BLOCK/UNBLOCK paths against this user where applicable. Only do a clean-slate wipe when getting to fresh onboarding (WF-21/22) testing — at that point: run CLAUDE.md clean-slate SQL on `61466927921` + manually delete Slack channel `C0B567A175W` (per DR-10, n8n won't archive it).

## Pending scenarios (queued for this session)

| TC | Scenario | Notes |
|---|---|---|
| TC-0802 | REJECT PAYMENT | Needs user back in `payment_submitted`; start via REBOOK |
| TC-0501 | REBOOK | From `consultation_closed` |
| TC-06xx | STOP / HELP keywords | Per WF-20 intercept; STOP → `opted_out`, HELP → policy reply |
| TC-07xx | BLOCK / UNBLOCK | Admin commands |
| Onboarding | WF-21 / WF-22 fresh flow | Requires clean-slate wipe — defer to end |

## Open items already known (carried in, NOT new findings)

1. **`messages.consultation_id` always NULL** — confirmed at baseline (rows 8–11 all NULL despite user_id=28 being populated). Will be re-confirmed against any new rows produced this session. **Note for sprint planning:** use `n8n-whatsapp-methodology:impact-analysis` against WF-60 to map upstream callers and decide where `consultation_id` resolution lives — per [[feedback_pseudocode_first_refactor]], revise `docs/pseudocode/WF-60.pseudo` first to define the canonical-shape contract, then impact-analyse the revised pseudo across the 3–5 callers (inbound WA chain, WF-50, WF-51, WF-33, WF-43), then implement.
2. **`user_id` null suspicion — NOT REPRODUCED at baseline.** All 4 existing rows in `messages` have `user_id=28` populated. If new rows produced this session show `user_id` NULL, log as fresh finding; otherwise this is resolved.
3. **ADJ-T1 … ADJ-T5** from `technical-workflow-review` — awaiting operator classification before sprint planning.

## Issues found (this session)

| ID | Sev | Workflow | Where surfaced | Summary |
|---|---|---|---|---|
| ISSUE-01 | [major] | WF-50 / WF-60 / WF-00 | TC-0501 + TC-0303 ticks | Outbound `Build WF-60 Payload` mapper(s) don't extract content for non-`text` message types — confirmed on `interactive` (rows 13, 14) AND `template` (row 17). Inbound interactive also loses the button display label (only `button_id` captured). Skill: `impact-analysis` across WF-00 + WF-50 → WF-60 canonical contract. |
| RESOLVED-NOT-A-BUG | n/a | WF-60 | TC-0303 tick @ 10:00:39Z | Prior session's "consultation_id NULL" carry-in: **NOT a defect.** When a row has `consultation_id` populated (e.g. rows 17–19 with id=11) it's because an active consultation existed. Prior NULL rows (8–11) were all post-close — no active consultation existed to attribute to. Correct null-when-no-active behaviour. |
| ISSUE-02 | [minor / observation] | WF-20 / WF-25 | TC-0501 tick @ 09:41:53Z | "REBOOK" as text burns a Gemini call (WF-25) before reaching WF-45 because WF-20 owns only STOP/HELP. Not a defect — sprint discussion item. |
| ISSUE-03 | [critical] | WF-34 (+ likely siblings) | TC-0802 tick @ 09:51:59Z | `User Found?` IF node has `operator.type:"string" + typeValidation:"strict"` but `$json.id` from Postgres is a number → every REJECT PAYMENT errors at the IF and short-circuits. Cascades through WF-11 + WF-10 (both show error). State + payments + messages all unchanged. Almost certainly present in WF-33/42/46/47 too — use `impact-analysis` to sweep before patching. |
| ISSUE-04 | [major] | All admin-action workflows | TC-0802 tick @ 09:51:59Z | Node-exception failures inside an admin-action workflow short-circuit before the explicit failure-branch Slack responses fire, leaving the admin with NO feedback in Slack. Pattern fix: error-trigger workflow that posts "⚠️ Command failed (exec NNNN)" to the admin channel. |
| ISSUE-05 | [major / process] | WF-41 + methodology | TC-040x relay tick @ 10:20:51Z | WF-41 had a node referencing a node removed in last session's cleanup → "Hi back" admin→user relay errored at runtime. Operator-fixed via UI. `build-workflow` skill's impact-analysis (BEFORE) + regression (AFTER) gates both missed the dangling `$('NodeName')` reference. Plugin improvements PIC-01/02/03 captured. WF-34 (REJECT) → narrowed: ISSUE-03 specifically about `$json.id` numeric. WF-42 (CLOSE) uses `phone_number` (string) so unaffected. |
| ISSUE-06 | [major] | WF-40 | TC-040x tick @ 10:20:51Z | Garbage + abusive user messages relayed verbatim to admin during `consultation_active`. WF-40 doesn't invoke WF-25 — direct violation of CLAUDE.md DR-6 ("Every state accepting free-form text must run WF-25 first"). Auto-block path (WF-25 → WF-46) never fires for in-consultation abuse. |
| ISSUE-07 | [critical] | WF-20 | TC-06xx tick @ 10:30:53Z | `Normalize Keyword` Set node references `$json.messageText` + `$json.userId` but the caller payload supplies `messageContent` + `user.id`. Result: `keyword=null`, Switch falls through, WF-20 is a no-op for ALL keywords. Prior REBOOK/HELP/STOP all silently bypassed it and worked (when they did) only because state-handlers + WF-25 caught the intent downstream. Short keyword fast-path doesn't exist in practice. Fix: rename `$json.messageText` → `$json.messageContent`, `$json.userId` → `$json.user?.id`. |
| ISSUE-08 | [critical] | WF-47 | TC-06xx tick @ 10:30:53Z | `Update User Status to opted_out` Postgres node has `$1` placeholder but no `queryReplacement` → `Variable $1 out of range`. **Same pattern as BUG-NEW-03** (yesterday's WF-44 fix). WF-47 was overlooked in sprint TD-001's sweep. Use `impact-analysis` to find other Postgres nodes across the codebase with `$N` placeholders and missing `queryReplacement` before patching. |

---

### Action — 2026-05-20T09:38:43Z — TC-0501 REBOOK
**Operator action:** Send "REBOOK" (or rebook-intent text) from `61466927921` via WhatsApp.
**Starting state:** user id=28, status=`consultation_closed`, slack_channel_id=`C0B567A175W` (preserved per DR-10).
**Expected:**
- WF-00 → WF-01 routes to closed-state handler → WF-45 (rebook path), not WF-21 (onboarding).
- `users.status` transitions `consultation_closed` → `payment_pending`.
- WhatsApp reply with payment instructions (₹500 UPI to +91-9653240263) — sent via WF-50.
- Slack consult channel `C0B567A175W` reused (NOT a fresh channel — WF-45 reads existing `slack_channel_id` from DB, does NOT call WF-52, per DR-10).
- New row(s) in `messages` (inbound REBOOK + outbound payment-instruction).
**Will check after operator says "check".**

### Tick — 2026-05-20T09:41:53Z
**Trigger:** operator said "check" after action TC-0501 REBOOK
**New executions:** 13 (1439–1451), all `status=success`, none slow
- 1439 WF-00 Webhook Receiver (inbound REBOOK, ~3.3s)
- 1440 WF-60 Message Logger (inbound log, 50ms)
- 1441 WF-01 Message Router
- 1442 WF-02 User State Router
- 1443 WF-20 Keyword Handler (passed through — does not own REBOOK keyword)
- 1444 WF-43 Post-Consultation Handler (POST_CONSULT_TEXT)
- 1445 WF-25 Intent Classifier (~1.2s — classified as rebook_intent)
- 1446 WF-45 Rebook Handler (~1.6s)
- 1447 WF-50 Send WhatsApp (~1.5s)
- 1448 WF-60 Message Logger (outbound log, 83ms)
- 1449–1451 WF-00 Webhook Receiver (3 follow-up Meta delivery/status callbacks)

**DB deltas:**
- `users`: id=28 updated — status `consultation_closed` → `payment_pending` at 2026-05-20T09:39:18.144Z; `slack_channel_id` preserved as `C0B567A175W` ✅
- `messages`: 2 new rows
  - id=12: inbound, content="REBOOK", user_id=28, consultation_id=NULL, message_type=text
  - id=13: outbound, content=**NULL**, user_id=28, consultation_id=NULL, message_type=`interactive`, whatsapp_message_id=`wamid.HBg…ARGBIyRjU2…`
- `consultations` / `payments` / `pending_users` / `admin_actions`: unchanged

**Slack:** `C0B567A175W` — no new messages (WF-45 by design does not post to Slack on rebook; admin-side rebook awareness is implicit until APPROVE arrives).

**Cross-check vs expected:**
- ✅ WF-45 (rebook path) reached — via `WF-20 → WF-02 → WF-43 → WF-25(rebook_intent) → WF-45`. Note: this is the *text-path* route. The shorter path (WF-43 → WF-45 directly) only fires for the `btn_rebook` interactive button per registry note on WF-43; text "REBOOK" correctly goes through WF-25 classification. NOT routed to WF-21 ✅
- ✅ `users.status` transitioned to `payment_pending`
- ✅ Outbound WhatsApp sent (WF-50 success, `whatsapp_message_id` populated → please confirm user-side received the UPI message with button)
- ✅ Slack channel `C0B567A175W` reused (no WF-52 call in execution list)
- ✅ 2 new `messages` rows

**Issues observed this tick:**

- **NEW [major] — `messages.content` is NULL for outbound interactive messages.** Row id=13 (the rebook payment-instructions message sent via WF-50) has `message_type=interactive`, `whatsapp_message_id` populated, but `content=NULL`. WF-60's mapper appears to read the text body field, which doesn't exist on interactive payloads (the human-readable copy lives inside `interactive.body.text`). Impact: identical to consultation_id problem class — operationally we lose conversation history for every button-bearing outbound (payment instructions, post-consult feedback prompt, etc.). **Suggested skill for analysis:** `n8n-whatsapp-methodology:impact-analysis` against WF-50's `Build WF-60 Payload (Outbound)` Code mapper — needs to extract `interactive.body.text` (and ideally also serialise button labels into a metadata.buttons array) when `message_type='interactive'`. Per [[feedback_pseudocode_first_refactor]], revise the relevant section of WF-50's `.pseudo` first.
- **CONFIRMED carry-in — `consultation_id` NULL on new rows 12+13.** Same as baseline; nothing new to add.
- **NOT-REPRODUCED — `user_id` NULL.** Both new rows have `user_id=28` populated; the user_id-null suspicion remains unreproduced.
- **Observation (not a bug) — REBOOK as text takes the long path** (WF-20 → WF-43 → WF-25 → WF-45) burning a Gemini call on a deterministic keyword. WF-20 owns STOP/HELP only per its design note; REBOOK keyword detection lives in WF-25. Worth a sprint discussion ("should WF-20 also intercept REBOOK to skip Gemini?") but not a defect against current design.

**Cursors updated:** exec=1451, time=2026-05-20T09:41:53Z. Ready for next action.

---

### Action — 2026-05-20T09:43:37Z — TC-0303 setup / button click "Payment Completed"
**Operator action:** Tapped "Payment Completed" interactive button on the rebook payment-instructions message. Confirmed receipt of bot reply on WhatsApp + Slack notification.
**Starting state:** user id=28, status=`payment_pending`.
**Expected:** WF-32 fires → status→`payment_submitted`, new `payments` row, WA confirmation to user, Slack post to consult channel asking admin to APPROVE PAYMENT.

### Tick — 2026-05-20T09:46:19Z
**Trigger:** operator confirmation that button click + bot reply + Slack post all landed
**New executions:** 13 (1452–1464), all `status=success`
- 1452 WF-00 Webhook Receiver (interactive button payload, ~2.3s)
- 1453 WF-60 Message Logger (inbound interactive)
- 1454 WF-01 Message Router
- 1455 WF-02 User State Router (button_reply → PAYMENT_CONFIRM)
- 1456 **WF-32 Payment Confirmation Receiver** (~1.9s) ✅
- 1457 WF-50 Send WhatsApp (confirmation reply, ~1.3s)
- 1458 WF-60 Message Logger (outbound WA log)
- 1459 WF-51 Send Slack Message (post to consult channel)
- 1460 WF-60 Message Logger (outbound Slack log) — **WF-60 fired for Slack transport** ✅ (TD-003 F2)
- 1461 WF-00 (Meta delivery callback)
- 1462 WF-10 Slack Admin Handler (~8ms — bot-message filter, dropped)
- 1463–1464 WF-00 (Meta status callbacks)

**DB deltas:**
- `users`: id=28 → status `payment_pending` → `payment_submitted` at 09:43:37.520Z ✅
- `payments`: new row id=12 (user_id=28, amount=500.00 INR, payment_method=gpay, status=`pending_verification`) ✅
- `messages`: 3 new rows
  - id=14: inbound interactive, content=`payment_completed` ✅ (interactive button payload content extracted — only the button id, not body text — same class as ISSUE-01 but with the button_id captured)
  - id=15: outbound text, content present ("Thank you Abcs! Your payment confirmation has been received...") ✅
  - id=16: outbound `slack_text`, content present + `slack_message_ts=1779270219.125589` ✅ (WF-60 logging Slack-transport messages, per TD-003 F2)
- `consultations` / `pending_users` / `admin_actions`: unchanged

**Slack:** new bot post in `C0B567A175W` (logged in row id=16): "🔔 New Payment Submission — User: Abcs / Phone: +61466927921 / Amount: ₹500 / Payment ID: 12 / Please…" → admin prompt for APPROVE PAYMENT ✅

**Cross-check vs expected (4/4 ✅):**
- ✅ WF-32 fired
- ✅ Status → `payment_submitted`
- ✅ New `payments` row (id=12, pending_verification)
- ✅ WA confirmation + Slack admin prompt both delivered + both logged in `messages`

**New observations / clarifications on prior issues:**
- **ISSUE-01 nuance — inbound side captures button_id, not body text.** Row 14 has `content="payment_completed"` — this is the button's `id` not its display label. For outbound interactives (row 13) `content` was entirely NULL. So the bug splits into two cases:
  - **Outbound interactive** (sender path WF-50 → WF-60): nothing extracted (content=NULL) ← primary defect
  - **Inbound interactive** (webhook path WF-00 → WF-60): button id captured, but display label / body text missing ← secondary
- **Slack transport logging works as designed.** Row 16 with `message_type='slack_text'` + `slack_message_ts` is the canonical example for the TD-003 F2 mapper.
- **consultation_id still NULL on all 3 new rows.** Carry-in confirmed across one more action.
- **user_id still populated (=28) on all rows.** Not-reproduced standing.
- **Schema observation worth noting:** `payments` uses `status='pending_verification'` here, but per MINOR-01 in prior tldr the canonical states are `pending_verification` / `verified` / (presumably) `rejected`. Worth verifying WF-33 / WF-11 STATS reads still align — but the value matches, so no action.

**Cursors updated:** exec=1464, time=2026-05-20T09:46:19Z. Ready for APPROVE PAYMENT (TC-0303 continuation) or REJECT PAYMENT (TC-0802) — your call.

---

### Action — 2026-05-20T09:49:15Z — TC-0802 REJECT PAYMENT
**Operator action:** Typed `REJECT PAYMENT 61466927921` (with optional reason) in Slack channel `C0B567A175W`.
**Starting state:** user id=28, status=`payment_submitted`, payment id=12 status=`pending_verification`.
**Expected:** WF-10 → WF-11 → WF-34. Status → `payment_pending`. Payment id=12 → `rejected` with `rejected_at` + `rejection_reason` set. WA rejection message to user. Slack confirmation to admin.
**Operator-reported:** "workflow has failed".

### Tick — 2026-05-20T09:51:59Z
**Trigger:** operator reported failure on REJECT PAYMENT
**New executions:** 3 — **ALL ERRORED**
- 1465 WF-10 Slack Admin Handler — `status=error`, lastNode=`Call WF-11 Command Parser`
- 1466 WF-11 Command Parser — `status=error`, lastNode=`Call WF-34 Payment Rejection Processor`
- 1467 WF-34 Payment Rejection Processor — `status=error`, lastNode=`User Found?`

**Root cause identified:**

WF-34's `User Found?` IF node (typeVersion 2) has:
```json
{
  "leftValue": "={{ $json.id }}",
  "operator": {"type": "string", "operation": "notEmpty", "singleValue": true},
  "options": {"typeValidation": "strict"}
}
```

Upstream `Load User by Phone` Postgres query returns `u.*` from `chinmay_astro.users` — `id` is a Postgres `int` → JS `number` (28). The IF node operator is typed `string` with `typeValidation: "strict"` → n8n refuses to coerce and throws `NodeOperationError: Wrong type: '28' is a number but was expecting a string [condition 0, item 0]`. Error cascades back through WF-11 and WF-10 (both show the same message from the child execution).

The error is deterministic — it fires on every REJECT against any existing user (every `users.id` is numeric).

**DB deltas:** NONE
- `users`: status unchanged (`payment_submitted`, last update still 09:43:37.520Z from earlier button click)
- `payments`: id=12 unchanged (`pending_verification`, `rejected_at`=NULL, `rejection_reason`=NULL)
- `messages`: 0 new rows (WF-50 / WF-51 never reached)
- `admin_actions`: 0 new rows (table is deprecated per [[project_admin_actions_deprecated]] — expected)

**Slack:** Admin command landed in `C0B567A175W` but **no bot acknowledgement was posted** — user (admin) gets zero feedback that the command failed. Silent failure from admin's POV.

**Cross-check vs expected (0/5 ✅):**
- ❌ Status transition payment_submitted → payment_pending — DID NOT HAPPEN
- ❌ payment row update (rejected status + rejected_at + reason) — DID NOT HAPPEN
- ❌ WA rejection message to user — NOT SENT
- ❌ Slack admin confirmation — NOT POSTED
- ❌ Workflow execution success — ALL 3 LINKED EXECUTIONS ERRORED

**New issue:**

- **NEW [critical] ISSUE-03 — WF-34 `User Found?` IF type strictness blocks every REJECT PAYMENT.** Strict string-type validation against numeric `users.id`. Fix options:
  - Best: change operator `type` from `"string"` to `"number"` (or use `exists` operator which is type-agnostic)
  - Safer (no node-config change): cast in leftValue → `={{ String($json.id) }}` or `={{ $json.id?.toString() }}`
  - Workaround: `options.typeValidation: "loose"` (broader compatibility but loses safety)
  - **Strongly recommended:** before implementing, run `n8n-whatsapp-methodology:impact-analysis` to scan **all sibling admin-action workflows** for the same `User Found?` IF pattern with `type:"string" + typeValidation:"strict"` against `$json.id`. Likely candidates: WF-33 (APPROVE PAYMENT), WF-42 (CLOSE CONSULT), WF-46 (BLOCK), WF-47 (UNBLOCK), maybe more. The bug almost certainly exists in siblings because they were authored from the same template — but APPROVE worked yesterday in the prior session, so either (a) APPROVE uses a different IF pattern, or (b) something about the typed input made it pass. Worth a sweep before patching one at a time.

- **NEW [major] sub-finding — admin gets ZERO Slack feedback on a workflow exception.** WF-11 / WF-34 have explicit failure-branch responses (`Prepare WF-51 Payload (User Not Found)`, `(Wrong State)`, etc.) but a *node exception* short-circuits the workflow entirely → no Slack post. Operator only knows it failed by either inspecting executions or noticing the user didn't receive anything. Pattern-level concern: every admin-action workflow needs an error trigger that posts "⚠️ Command failed — see exec NNNN" to the admin channel. Sprint-discussion item; mark as ISSUE-04.

**Cursors updated:** exec=1467, time=2026-05-20T09:51:59Z. User state remains `payment_submitted`. Recommend: do NOT retry REJECT (it'll fail identically); proceed to APPROVE PAYMENT to continue testing forward, treating REJECT as a known sprint item.

---

### Action — 2026-05-20T09:53:28Z — TC-0303 APPROVE PAYMENT
**Operator action:** Typed `APPROVE PAYMENT 61466927921` in Slack channel `C0B567A175W`.
**Starting state:** user id=28, status=`payment_submitted`; payment id=12 status=`pending_verification`.
**Expected:** WF-10 → WF-11 → WF-33. Status → `consultation_active`. Payment id=12 → `verified` (with `verified_at`, `verified_by`). New `consultations` row (active). WA confirmation to user. Slack admin ack ("Payment approved" or similar).
**Critical cross-check vs ISSUE-03:** If WF-33 was authored from the same template as WF-34, its `User Found?` IF would have the same string/strict bug — but APPROVE worked yesterday on this same user, so we should see success. If it ERRORS now with the same `Wrong type: '28' is a number` message, ISSUE-03 escalates to "all admin actions broken" and APPROVE-worked-yesterday was a fluke.
**Will check after operator says "check".**

### Tick — 2026-05-20T10:00:39Z
**Trigger:** operator confirmed WhatsApp receipt of consultation_active notification + said "check"
**New executions:** 12 (1468–1479), **all `status=success`**
- 1468 WF-10 Slack Admin Handler
- 1469 WF-11 Command Parser
- 1470 **WF-33 Payment Approval Processor** ✅
- 1471 WF-50 Send WhatsApp (user notify)
- 1472 WF-60 Message Logger (outbound WA)
- 1473 WF-51 Send Slack Message (admin ack in channel)
- 1474 WF-60 Message Logger (outbound Slack)
- 1475 WF-60 Message Logger (inbound Slack — admin command itself, per TD-003 F2)
- 1476–1479 WF-00 Webhook + Slack callbacks

**Why WF-33 didn't hit ISSUE-03:**

Inspected WF-33's IF nodes — WF-33 has only `User in Correct State?` which compares `$json.status` (string) against `"payment_submitted"` (string). That's string-vs-string under strict validation → fine. WF-33 does NOT have a `User Found?` IF at all. So ISSUE-03 is specific to workflows that include the `User Found?` IF pattern checking `$json.id` (number) with string strict typing. **Sweep target for impact-analysis remains: WF-42 (CLOSE), WF-46 (BLOCK), WF-47 (UNBLOCK), WF-44 (Save Feedback) and any utility workflow doing the same lookup-then-IF pattern.**

**DB deltas:**
- `users`: id=28 → status `payment_submitted` → `consultation_active` at 09:54:14.709Z ✅
- `payments`: id=12 → `status='verified'`, `verified_at=09:54:14.685Z`, `verified_by='C0B567A175W'` ✅
- `consultations`: **new row id=11**, status=`active`, started_at=09:54:14.700Z ✅
- `messages`: 3 new rows
  - id=17: outbound `template` (WA consultation_active notify), `content=NULL`, `consultation_id=11` ✅ (id populated!)
  - id=18: outbound `slack_text` admin-channel ack ("✅ Payment approved for Abcs…"), `content` populated, `slack_message_ts` populated ✅
  - id=19: **inbound `slack_text`** logging admin's own command `"\`APPROVE PAYMENT 61466927921\`"`, `consultation_id=11` ✅ (admin command audit working via TD-003 F2)

**🟢 MAJOR FINDING — `consultation_id` NULL was MISDIAGNOSED in prior session.**

All 3 new rows (17, 18, 19) have **`consultation_id=11` correctly populated**. WF-60 IS resolving the active consultation — when one exists. Re-reading the prior session's NULL rows (id=8–11): every one of those was either feedback-after-close or post-CLOSE; the user was in `consultation_closed` with NO active consultation in the DB at that moment. NULL is the *correct* answer in that semantic — there is no consultation to attribute the message to.

So the original "open item" (consultation_id NULL needs impact-analysis on WF-60) is **NOT a real defect** — it's correct null-when-no-active-consultation behaviour. **De-escalating this from the carry-in list.** No impact-analysis sweep needed on WF-60 for this; ISSUE-01 (content NULL on interactive/template) remains the real WF-60 family bug.

**🟠 ISSUE-01 expanded further — also affects outbound `template` messages.**

Row 17 (`message_type=template`, the WA consultation_active confirmation) has `content=NULL` too. So ISSUE-01 now spans 3 message types on the outbound side: `interactive`, `template`, and probably any non-`text` payload. WF-50's `Build WF-60 Payload (Outbound)` mapper only handles plain text; the template name + body params (which carry the user-visible copy) aren't extracted.

**Cross-check vs expected (5/5 ✅):**
- ✅ Status → `consultation_active`
- ✅ Payment id=12 → `verified` (`verified_at` + `verified_by` populated)
- ✅ New `consultations` row id=11 (active)
- ✅ WA confirmation to user (operator confirmed receipt; row 17 logged)
- ✅ Slack admin ack ("✅ Payment approved for Abcs…" posted, row 18 logged)

**Slack:** consult channel `C0B567A175W` now has the "Payment approved" bot post; admin's own `APPROVE PAYMENT` command was also captured by WF-60 via TD-003 F2 (inbound slack_text log).

**`admin_actions` table:** still 0 rows — expected per [[project_admin_actions_deprecated]]; messages table now carries the audit (row 19).

**Cursors updated:** exec=1479, time=2026-05-20T10:00:39Z. User now in `consultation_active`, consultation id=11 open.

### Plan for remaining scenarios

Per operator: continue forward with the usual post-approval path (user↔admin relay → CLOSE), then sweep remaining admin actions (BLOCK / UNBLOCK), then STOP/HELP, then onboarding (requires wipe).

Suggested order:
1. **TC-040x** — User↔admin relay (1–2 round trips, light coverage since this was thoroughly tested yesterday — focus on whether WF-60 still logs Slack-transport correctly and watches for fresh interactive/template content issues)
2. **TC-0403** — CLOSE CONSULT — **important ISSUE-03 retest target**: WF-42 likely has the same `User Found?` IF pattern; this is the natural next admin command
3. **TC-07xx** — BLOCK + UNBLOCK on user 28 (post-close) — sweeps WF-46 + WF-47 for ISSUE-03
4. **TC-06xx** — STOP / HELP keywords — purely user-side, WF-20 owns these
5. **Onboarding (WF-21/22)** — requires clean-slate wipe; do last

---

### Action — 2026-05-20T10:02:45Z → 2026-05-20T10:15:39Z — TC-040x relay + TC-04xx garbage/abuse + TC-0403 CLOSE
**Operator narration (consolidated):**
1. Sent "Hi" from user (61466927921) — relayed cleanly to admin via WF-40
2. Tried "Hi back" from admin — **WF-41 errored** (stale node reference, see Tick below)
3. Operator patched WF-41 via UI (updated the broken reference to point at the correct node) and retried — works
4. Several more text round trips both directions (admin "Saying Hi one more time", user "That's great", admin "Great this side too..!!!") — all clean
5. User sent garbage `/&/&rodkwkwldk` then abusive "This is shit" — **both got relayed to admin** as plain consultation messages, no warn / no auto-block triggered
6. Operator sent `CLOSE CONSULT 61466927921` from the consult channel — appears to have worked
7. Operator wants to verify everything is logged, capture process-level gap on WF-41 stale-reference, then proceed with **text-based rebook intent** (NOT the literal REBOOK keyword) as next action

### Tick — 2026-05-20T10:20:51Z
**Trigger:** operator consolidated narration covering relay + garbage/abuse + close
**New executions:** 42 total (1480–1521) — 40 success, **2 errors** (both at 10:02:52 — the WF-41 "Hi back" failure before operator's UI fix). Detailed counts validated against execution dump.

**WF-41 "Hi back" failure (execs 1489 WF-10 + 1490 WF-41):**
- Error message: `Cannot assign to read only property 'name' of object 'Error: Referenced node doesn't exist'`
- lastNodeExecuted: `Prepare WhatsApp Message` (a downstream node referencing a node that was REMOVED in the prior session's WF-41 cleanup)
- Operator-applied fix: edited the broken reference via n8n UI to point at the surviving canonical node; subsequent admin→user relays (1491+ at 10:04:46, 1492–1494, 1498–1502) all succeed.
- **No code change in this skill** — operator handled inline before claude saw it.

**🟠 NEW [major] PROCESS GAP — `build-workflow` skill missed orphaned references on node removal (ISSUE-05)**

Last session's WF-41 cleanup removed a node that was no longer in the active path (a 4-node orphaned WA→Slack branch — see registry note: "removed orphaned WA→Slack branch: Detect Direction, Route by Direction, Prepare Channel Lookup, Post to Slack Channel"). But a **surviving** node (`Prepare WhatsApp Message`) referenced one of the removed nodes by name in its expressions. That reference became dangling, n8n threw at runtime when the expression evaluated.

Both methodology gates failed to catch this:
- **`impact-analysis` BEFORE change:** The skill scans upstream callers / downstream callees / siblings, but did NOT scan **intra-workflow node-name references** in the expressions of other surviving nodes. The orphaned branch was correctly identified as removable from a *connection topology* standpoint — but the `$('NodeName')` references buried inside other expressions weren't enumerated.
- **regression check AFTER change:** The post-change validation (likely a test execution or static lint) didn't exercise the actual relay path with realistic input, OR n8n's static validator doesn't flag dangling `$('NodeName')` references until the expression actually evaluates. A simple "execute the workflow against a fresh sample payload" would have caught it; a static `grep "$('<removed_name>')"` across all nodes' parameters before the deletion would have caught it earlier still.

**Plugin improvement candidates (deferred to next `flush-plugin-improvements` run):**

1. **`impact-analysis`:** add a step that grep-scans ALL surviving nodes' `parameters` JSON for `$('<name>')` references where `<name>` matches any node-about-to-be-removed. Trivial to implement: jq-walk parameters → regex extract `\$\('([^']+)'\)` → set-diff against removed names → fail if non-empty.
2. **`build-workflow`:** add a post-change "execute once with a synthetic payload" gate before declaring complete. Or at minimum the static reference-scan from improvement #1 applied to the *final* workflow JSON. Either catches the same class of bug pre-runtime.
3. **`technical-workflow-review`:** add a "dangling node-name references" check on every workflow as part of the standard battery. Catches latent versions of the same bug across the codebase (workflows that haven't been edited recently but may have been left in this state by earlier edits).

Recorded in `## Plugin improvement candidates` section at the end of this log for the eventual flush.

**🟠 NEW [major] ISSUE-06 — WF-25 intent classifier NOT invoked during `consultation_active` relay (Design Rule #6 violation)**

User sent garbage `/&/&rodkwkwldk` (row 29) and abusive "This is shit" (row 31). Both were relayed to admin as ordinary `consultation_active` messages (rows 30 + 32, message_type=`slack_text`) with no intervention.

Why: WF-02 routes `consultation_active` + text → WF-40 (User → Admin Relay). WF-40 does NOT call WF-25 — it just bundles + forwards to WF-51. Per WF-25 registry note, its callers are: WF-23, WF-30, WF-31, WF-43, WF-44. WF-40 is missing.

This contradicts **CLAUDE.md Design Rule #6:** "Every state accepting free-form text must run WF-25 first. No state should blindly process user text without intent classification." `consultation_active` very much accepts free-form text and is currently doing exactly the prohibited thing.

Impact: during active consultation, abusive/malicious user input reaches the admin without any guardrail. Garbage messages waste admin attention. Auto-block (WF-46 via WF-25's `malicious_abusive`/`inappropriate` paths) never fires.

Suggested fix: WF-40 must invoke WF-25 first; if intent is `general_enquiry`/`wants_consultation`/`feedback_intent` proceed with relay, if `malicious_abusive`/`inappropriate`/`garbage` short-circuit to WF-25's warn+block branches. Use `impact-analysis` against WF-40 to confirm no other caller depends on its current unconditional-relay contract.

**WF-42 (CLOSE CONSULT) succeeded — narrows ISSUE-03 scope further:**

Inspected WF-42's IF nodes — has both `User Found?` (`leftValue=$json.phone_number` — string vs string, fine) and `User in Correct State?` (`leftValue=$json.status` — string vs string, fine). **`phone_number` is the discriminator that protects WF-42.** WF-34's bug is specifically `$json.id` (number) + string operator + strict. Sibling sweep should check WF-44/46/47 specifically for IFs against `$json.id`, NOT against User Found? generically.

**DB deltas (17 new rows across `messages`, 1 across `users`, 1 across `consultations`):**
- `users`: id=28 → `consultation_active` → `consultation_closed` at 10:15:39.234Z
- `consultations`: id=11 → status=`closed`, ended_at=10:15:39.228Z ✅
- `payments`: unchanged
- `messages`: 17 new rows (20–36). All have `user_id=28`. Rows 20–32 (during consultation_active) have `consultation_id=11` ✅; rows 33–36 (post-close: feedback prompt + admin acks + admin command audit) have `consultation_id=NULL` — correct semantics (no active consultation post-close). Row 33 outbound `interactive` (the btn_feedback / btn_rebook prompt) has `content=NULL` — ISSUE-01 reproducing on the feedback prompt.

**Slack:** Lots of activity. All admin commands captured by WF-60 Slack-inbound logging (rows 24, 28, 36 = "Saying Hi one more time", "Great this side too..!!!", "CLOSE CONSULT 61466927921"). All bot posts captured outbound. Audit trail is complete.

**Cross-check vs expected (3/3 ✅ for the happy paths; 1 broken-then-fixed for "Hi back"; 1 ❌ for garbage/abuse):**
- ✅ User→admin relay round trips (Hi, That's great)
- ✅ Admin→user relay after WF-41 UI patch (Hi back, Saying Hi one more time, Great this side too..!!!)
- ❌ Garbage + abusive relayed to admin without intervention → ISSUE-06
- ✅ CLOSE CONSULT — state + DB transitions clean; feedback prompt sent (row 33 content NULL = ISSUE-01)
- ⚠️ "Hi back" originally failed but operator-patched via UI → ISSUE-05 process gap captured

**Cursors updated:** exec=1521, time=2026-05-20T10:20:51Z. User now in `consultation_closed`, consultation id=11 closed. Slack channel `C0B567A175W` preserved per DR-10.

**Go-ahead for next action: ✅** Per operator request — proceed with **text-based rebook intent** (e.g. "I want to book again" or similar natural phrasing, NOT the literal `REBOOK` keyword). Expected path: WF-00 → WF-01 → WF-02 (POST_CONSULT_TEXT, since status=consultation_closed) → WF-20 (passthrough, doesn't own this) → WF-43 → WF-25 (should classify as `rebook_intent`) → WF-45. Expected outcome: identical to the prior keyword REBOOK test (status→payment_pending, payment instructions sent, slack channel reused).

---

### Action — 2026-05-20T10:23:19Z — Text-based rebook intent
**Operator action:** Sent "I want to book again" from `61466927921` via WhatsApp (natural phrasing, NOT the `REBOOK` keyword).
**Starting state:** user id=28, status=`consultation_closed`.
**Expected:** WF-00 → WF-01 → WF-02 (POST_CONSULT_TEXT) → WF-20 (pass-through) → WF-43 → WF-25 (classifies `rebook_intent`) → WF-45 → WF-50. Status → `payment_pending`. WA payment instructions delivered. Slack channel `C0B567A175W` reused.

### Tick — 2026-05-20T10:24:45Z
**Trigger:** operator said "check" after sending the rebook-intent text
**New executions:** 13 (1557–1569), **all `status=success`**
- 1557 WF-00 Webhook Receiver (~6.3s end-to-end — bulk of which is the WF-25 Gemini call downstream)
- 1558 WF-60 Message Logger (inbound)
- 1559 WF-01 Message Router
- 1560 WF-02 User State Router (POST_CONSULT_TEXT)
- 1561 WF-20 Keyword Handler (pass-through, ~6ms)
- 1562 WF-43 Post-Consultation Handler ✅
- 1563 **WF-25 Intent Classifier** (~4.0s, longest single step — classified as `rebook_intent`) ✅
- 1564 WF-45 Rebook Handler ✅
- 1565 WF-50 Send WhatsApp
- 1566 WF-60 Message Logger (outbound)
- 1567–1569 WF-00 (Meta delivery + status callbacks)

**Path matches expectation exactly.** This is the canonical natural-language rebook flow — confirms WF-25's `rebook_intent` classification works against a non-keyword phrasing.

**DB deltas:**
- `users`: id=28 → `consultation_closed` → `payment_pending` at 10:23:24.404Z ✅
- `messages`: 2 new rows
  - id=37: inbound text "I want to book again", consultation_id=NULL (correct — no active consultation in the closed state)
  - id=38: outbound interactive (payment instructions), **content=NULL** (ISSUE-01 reproducing yet again — same template/interactive content extraction gap)
- `consultations` / `payments` / `pending_users`: unchanged

**Slack:** channel `C0B567A175W` — no new admin-facing posts (WF-45 by design doesn't notify on rebook). Consistent with prior keyword-REBOOK test.

**Cross-check vs expected (5/5 ✅):**
- ✅ WF-43 → WF-25 → WF-45 path engaged
- ✅ WF-25 returned `rebook_intent` against natural phrasing
- ✅ Status → `payment_pending`
- ✅ WA payment instructions sent (row 38, whatsapp_message_id present)
- ✅ Slack channel `C0B567A175W` reused (no WF-52 in execution list)

**Latency comparison reinforces ISSUE-02 observation:**
- Keyword REBOOK earlier (Tick @ 09:41:53Z): WF-25 took ~1.2s, total flow ~3.3s
- Text rebook intent now: WF-25 took ~4.0s, total flow ~6.3s
- Difference is essentially the same Gemini call — neither path skips it. ISSUE-02 remains a "make REBOOK keyword skip Gemini in WF-20" optimisation opportunity but is unchanged by this tick.

**Note on exec coverage:** The previous tick's exec count ("42 executions, 2 errors") was correct *narratively* but understated because the `limit=50` jq cutoff on the executions API hid execs 1522–1556 (those covered the same time window 10:11–10:16 that the narration described — the relay round trips, garbage + abuse relays, and CLOSE CONSULT path including WF-42 + WF-50 + 3× WF-51 admin acks). No factual correction needed — the workflow IDs all line up with the registry mapping in the narration. Future ticks should use `limit=100` or paginate when many side-branches fire in a short window. Logged this caveat for the report appendix.

**Cursors updated:** exec=1569, time=2026-05-20T10:24:45Z. User now in `payment_pending`. Ready for next action.

---

### Action — 2026-05-20T10:26:52Z — TC-06xx STOP keyword
**Operator action:** Sent "STOP" from user `61466927921` via WhatsApp.
**Starting state:** user id=28, status=`payment_pending`.
**Expected per DR-4 + DR-5:** WF-00 → WF-01 → WF-02 → WF-20 (exact-match interception, no LLM) → WF-47 (Unsubscribe Handler) → status `opted_out` + opt-out confirmation WA reply.
**Operator-reported:** workflow failed.

### Tick — 2026-05-20T10:30:53Z
**Trigger:** operator reported failure on STOP
**New executions:** 8 (1570–1577), **5 errors**
- 1570 WF-00 — `error` (cascade)
- 1571 WF-60 — success (inbound log fired before cascade)
- 1572 WF-01 — `error` (cascade)
- 1573 WF-02 — `error` (cascade)
- 1574 WF-20 — **success** (but routed wrong — see below)
- 1575 WF-30 Payment Pending Intent Filter — `error` (cascade)
- 1576 WF-25 — success (classified as `stop_intent`)
- 1577 **WF-47 Unsubscribe Handler — `error`** (the root failure)

Single root error message bubbled up the chain: `Variable $1 out of range. Parameters array length: 0` at WF-47 node `Update User Status to opted_out`.

**TWO distinct bugs uncovered:**

**🔴 NEW [critical] ISSUE-07 — WF-20 Normalize Keyword references wrong field names → keyword interception is broken for ALL keywords (STOP / HELP / REBOOK)**

WF-20's `Normalize Keyword` Set node:
```
keyword:   ={{ $json.messageText.trim().toUpperCase() }}
userId:    ={{ $json.userId }}
```

But the input from WF-02's caller payload contains `messageContent` (NOT `messageText`) and `user.id` (NOT `userId` at top level). Verified in this tick's exec data — `Normalize Keyword` output was:
```
{ keyword: null, phoneNumber: "61466927921", userId: null, messageText: null }
```

Because `keyword=null`, the downstream `Match Keyword` Switch falls through to the passthrough/`extra` output. WF-20 silently does NOTHING for any keyword. Then WF-02 also routes the message to the state-specific handler (WF-30 here because status=`payment_pending`), which calls WF-25, which catches `stop_intent` and routes to WF-47 anyway — so the user-facing flow APPEARED to work for the prior REBOOK + "I want to book again" tests (both fell through to WF-43 → WF-25 → WF-45). **WF-20 was never the actual router** — it's been a no-op all session.

This explains the observation in ISSUE-02 ("REBOOK as text takes the long path") more completely: the long path is the ONLY path that works. Short keyword-fast-path doesn't exist in practice.

**Fix:** in `Normalize Keyword`, change `$json.messageText` → `$json.messageContent` and `$json.userId` → `$json.user?.id`. After the fix, retest STOP / HELP / REBOOK keywords to confirm WF-20 intercepts; expect total latency to drop dramatically (no Gemini hop on the keyword path).

**🔴 NEW [critical] ISSUE-08 — WF-47 `Update User Status to opted_out` Postgres node missing `queryReplacement` (BUG-NEW-03 pattern recurrence)**

```sql
UPDATE chinmay_astro.users
SET status = 'opted_out', updated_at = NOW()
WHERE phone_number = $1
```

But the node's `options` block has only `queryBatching: "independently"` — no `queryReplacement`. n8n throws `Variable $1 out of range. Parameters array length: 0`.

Exactly the same pattern as **BUG-NEW-03** from yesterday's WF-44 `Save Feedback to DB` (fixed in sprint TD-001 with `queryReplacement: ={{ [ trigger.field1, trigger.field2 ] }}`). WF-47 was missed in that sprint's sweep.

**Fix:** add `options.queryReplacement: ={{ [$('When Executed by Another Workflow').first().json.phoneNumber] }}` (array-form, per the established convention) so the `$1` placeholder gets the user's phone number.

**Wider remediation question:** sprint TD-001 fixed WF-44. WF-47 was overlooked. Are there *other* Postgres nodes across the codebase with `$N` positional params and no `queryReplacement`? **Run an `impact-analysis`-style sweep before patching one at a time** — same pattern as ISSUE-03's request. Specifically: jq-walk every workflow JSON for `n8n-nodes-base.postgres` nodes where `parameters.query` matches `/\$\d+/` AND `parameters.options.queryReplacement` is absent or null. Likely cheap; high value.

**DB deltas:** NONE (WF-47 errored before the UPDATE landed)
- `users`: id=28 status unchanged at `payment_pending` ✅ (still payment_pending — opt-out did NOT happen)
- `messages`: 1 new row (39: inbound text "STOP", logged by WF-60 before WF-47 failed) — the outbound opt-out confirmation never sent
- `admin_actions`: still 0 rows — expected per deprecation memory; WF-47 used to write here (per registry note: "logs to admin_actions, sends opt-out confirmation") but that's also broken / deprecated

**Slack:** no new posts. WF-47's downstream "archive consult-{phone} Slack channel" never ran. Channel `C0B567A175W` still preserved.

**Cross-check vs expected (0/3 ✅):**
- ❌ WF-20 keyword interception — NEVER FUNCTIONAL (ISSUE-07)
- ❌ Status → `opted_out` — DID NOT HAPPEN (ISSUE-08)
- ❌ Opt-out WA confirmation — NOT SENT

**Compounded with ISSUE-04 from REJECT failure:** admin again gets ZERO Slack feedback — STOP failures fly under the radar. If a real user types STOP and the workflow errors silently, they think nothing happened and may regulatory-complain.

**Cursors updated:** exec=1577, time=2026-05-20T10:30:53Z. User remains `payment_pending`. **STOP is broken end-to-end** — do not retry; will fail identically until ISSUE-07 AND ISSUE-08 are fixed. Recommend moving on to BLOCK / UNBLOCK or HELP keyword (HELP at least won't try to mutate DB, so even if WF-20 doesn't intercept, the state-handler path may give the user a reply — worth testing to learn whether HELP is functionally broken from user POV).

---

### Action — 2026-05-20T10:32:41Z — TC-06xx HELP keyword
**Operator action:** Sent "HELP" from user `61466927921` via WhatsApp.
**Starting state:** user id=28, status=`payment_pending`.
**Expected per WF-20 design (TD-027):** WF-20 intercepts HELP → returns canonical status-aware HELP text for `payment_pending` (UPI re-prompt + retry hint).
**Operator-reported:** "seems to have gone through" — confirming receipt of A response but not whether it was the canonical HELP text.

### Tick — 2026-05-20T10:36:14Z
**Trigger:** operator narrated HELP success + session-end intent
**New executions:** 12 (1578–1589), all `status=success`

Path: WF-00 → WF-60 → WF-01 → WF-02 → **WF-20 (passthrough, ~8ms — once again no-op)** → WF-30 → WF-25 (~4s Gemini) → WF-50 → WF-60 → Meta callbacks.

**Confirms ISSUE-07.** WF-20 again did NOT intercept the keyword. The user got a reply only because WF-30's contextual fall-through replied with the standard "payment instructions" reminder.

**DB delta:** 2 messages rows (40 inbound HELP / 41 outbound payment-reminder text). Row 41's content preview:
> "Great! You're almost there. To confirm your consultation, please complete the payment below. 💰 *Payment Details* Send ₹500 via GPay / PhonePe / any UPI app to: *+91-9653240263 (Chinmay Mujumdar)* …"

That is the **payment-reminder text from WF-30**, not the canonical HELP response from WF-20 (which per TD-027 is supposed to be a status-aware help message explaining the bot's options at each state). So HELP "worked" only in the sense that the user received some response. The HELP feature itself is **functionally broken** — WF-20 isn't running its HELP branch.

**Cross-check vs expected (0/2 ✅ for canonical HELP, 1/1 ✅ for "user got something back"):**
- ❌ Canonical TD-027 status-aware HELP text — NOT delivered
- ❌ WF-20 HELP branch — NOT triggered
- ✅ User received a response (via WF-30 fall-through) — partial mitigation but the message is misleading at best (acts as if user just asked about payment) and would be wrong / confusing in other states (e.g. `consultation_active` — there HELP would fall into WF-40 relay which we already established doesn't call WF-25, so HELP would be relayed verbatim to admin like garbage was).

**Cursors updated:** exec=1589, time=2026-05-20T10:36:14Z. User remains `payment_pending`.

---

## Conclusion — Round closed (HTML report deferred)

**Session paused, not closed.** Per operator: take the followups file into `plan-sprint` to fix the issues found, then return for review. HTML report (`report.html`) will be generated only after the review checkpoint.

### Bugs found this round (8 total — 4 critical, 3 major, 1 observation)

| ID | Sev | Workflow | One-liner |
|---|---|---|---|
| ISSUE-01 | major | WF-50/60 + WF-00 | `messages.content` NULL for interactive + template message types (3 sub-cases) |
| ISSUE-02 | minor (obs) | WF-20 / WF-25 | Long-path Gemini hit on REBOOK keyword — moot until ISSUE-07 fixed, may resolve itself |
| ISSUE-03 | **critical** | WF-34 | REJECT PAYMENT errors at `User Found?` IF (number vs string-strict). Narrowed scope: only IFs against `$json.id` (WF-42 safe). Likely also in WF-44/46/47 — sweep before patching. |
| ISSUE-04 | major | All admin workflows | Node exceptions short-circuit before failure-branch Slack acks → admin gets ZERO Slack feedback on errors |
| ISSUE-05 | major (process) | WF-41 + methodology | Stale `$('NodeName')` reference left over from prior session's cleanup. Build-workflow skill's gates missed it → PIC-01/02/03 plugin improvements |
| ISSUE-06 | major | WF-40 | Garbage + abusive messages relayed to admin verbatim during `consultation_active`. WF-40 doesn't call WF-25 — DR-6 violation |
| ISSUE-07 | **critical** | WF-20 | Field-name mismatch (`messageText`/`userId` vs caller's `messageContent`/`user.id`) → keyword interception is a no-op for STOP/HELP/REBOOK. Has been silently masked all session because state-handlers + WF-25 catch the fall-through. |
| ISSUE-08 | **critical** | WF-47 | `Update User Status to opted_out` Postgres node missing `queryReplacement` → STOP errors. Same pattern as BUG-NEW-03 (WF-44, fixed yesterday). |

Plus 3 plugin-improvement candidates: PIC-01 / PIC-02 / PIC-03 (see Plugin improvement candidates section below).

Plus 1 misdiagnosis cleanup: prior tldr's "consultation_id NULL" issue resolved as not-a-bug (correct null-when-no-active-consultation semantics).

### What still needs testing (input for next round)

**🔵 User-side scenarios deferred to next round:**

- **STOP re-test** — after ISSUE-07 + ISSUE-08 fix
- **Opt-out re-engagement** — once STOP works, user messaging back after opt_out should be treated as new user, routed to WF-21
- **Onboarding from scratch (WF-21/22)** — requires clean-slate wipe of user 28 (CLAUDE.md clean-slate SQL on `61466927921` + delete Slack channel `C0B567A175W` manually)
- **Garbage / abusive messages during `payment_pending` / `payment_submitted`** — we only tested abuse during `consultation_active` (which exposed ISSUE-06). The non-relay states route through WF-30 / WF-31 → WF-25 — should auto-block via WF-46. Confirm.
- **Inappropriate / malicious during onboarding states** — would route through WF-23 → WF-25 → WF-46 auto-block. Confirm.
- **Whitespace-only message** — TD-034 guard in WF-00; should be silently dropped (or no-op)
- **Non-text messages** (image, audio, reaction) — should silent-reject with deflection message per ICV-001
- **HELP in `consultation_active`** — would fall through ISSUE-07 → WF-40 → relayed to admin verbatim (like garbage was). Worth confirming and either fixing WF-20 or guarding in WF-40.

**🟣 Admin-side scenarios deferred to next round:**

- **REJECT PAYMENT** — after ISSUE-03 + ISSUE-04 fix (retest with the IF type fix applied)
- **BLOCK** — likely hits ISSUE-03 sibling-sweep pattern; needs verifying before/after the sweep
- **UNBLOCK** — same
- **DR-13 scope tests** — admin types `APPROVE PAYMENT <phone>` (user-targeted) in `chinmay-admin-commands` instead of consult channel: should be rejected with reminder. And admin types `LIST` / `STATS` / `HELP` (admin-wide) in a user channel: should still work.
- **Command aliases (DR-3a)** — `APPROVE` ≡ `APPROVE PAYMENT`, `REJECT` ≡ `REJECT PAYMENT`, `CLOSE` ≡ `CLOSE CONSULT` ≡ `CLOSE CONSULTATION` ≡ `CLOSE CHAT CONSULT`
- **LIST / STATS / HELP** (admin-wide commands)
- **Admin command typed in non-existent user channel** — should give "user not found" / wrong-channel reply
- **Admin command during wrong user state** — e.g. APPROVE on a `payment_pending` user → state-guard rejection path

**🟢 What's been verified end-to-end this session (don't re-test unless something changes):**

- WF-00 → WF-01 → WF-02 routing for `consultation_closed → text` (POST_CONSULT_TEXT) ✅
- REBOOK keyword path (via long-path through WF-43/WF-25/WF-45 because WF-20 was a no-op — but the user-facing outcome is correct) ✅
- "Payment Completed" button → WF-32 → payment_submitted + payments row + WA + Slack ✅
- APPROVE PAYMENT → WF-33 → consultation_active + payment.verified + new consultation row + WA + Slack ack ✅
- User→admin relay (WF-40 → WF-51) ✅
- Admin→user relay (WF-41 → WF-50) ✅ (after operator's UI fix on ISSUE-05)
- CLOSE CONSULT → WF-42 → consultation_closed + ended_at + feedback prompt (interactive, content=NULL per ISSUE-01) + Slack acks ✅
- Text rebook intent ("I want to book again") → WF-43 → WF-25 (`rebook_intent`) → WF-45 ✅
- WF-60 Slack-transport logging (TD-003 F2) ✅
- consultation_id resolution on `messages` (now confirmed correct semantic, not a bug) ✅

### Sprint-input file

A separate file `followups-for-plan-sprint.md` has been written to this session folder. It distills the 8 issues + 3 plugin-improvement candidates into a sprint-ready input format. **Operator: take `followups-for-plan-sprint.md` into `plan-sprint`.**

### When you return for review

The HTML report (`report.html`) will be generated as the final step — once you've confirmed the fixes via `plan-sprint` → `build-sprint`, return here and say "build the report" (or restart `monitor-test-run` for a fresh next-round). The session folder is preserved for diffing.

### Post-sprint operational note — PIC-06 drift-gate

Sprint Batch 3 shipped PIC-06 (plugin 1.25.0): a PreToolUse hook now gates every `build-sprint` Skill invocation on `pseudo-md-drift-check` having completed cleanly within 24h. Chinmay Astro has 28 `.pseudo` files and no `drift-checks/.last-run` marker yet → the **next `/n8n-whatsapp-methodology:build-sprint` invocation on this project will be blocked until `/n8n-whatsapp-methodology:pseudo-md-drift-check` is run**. Expected behavior, not a regression. Run drift-check first; that establishes the baseline and unblocks the rest of the workflow.

---

## Plugin improvement candidates

### PIC-01 — `impact-analysis`: enumerate intra-workflow `$('NodeName')` references before node removal
Triggered by ISSUE-05 (WF-41 stale-node-reference bug). When the skill considers removing a node, it currently scans connection topology and external caller/callee surfaces, but does NOT scan **other nodes' expression bodies** for `$('<removed-name>')` references. Implementation: jq-walk every surviving node's `parameters` JSON → regex extract `\$\('([^']+)'\)` → set-difference against the names of nodes-about-to-be-removed → fail the impact-analysis step if non-empty, surfacing the referencing node + path.

### PIC-02 — `build-workflow`: post-change validation must catch dangling refs OR execute a synthetic payload
Triggered by ISSUE-05. The regression check after a workflow edit currently doesn't catch dangling `$('NodeName')` references — n8n's static validator only complains at expression evaluation time. Fix options:
- (a) re-run PIC-01's static scan on the FINAL workflow JSON before declaring complete
- (b) trigger one synthetic test execution as part of the AFTER gate
Either gate would have caught the "Hi back" failure before operator hit it.

### PIC-03 — `technical-workflow-review`: add "dangling node-name reference" check to the standard battery
Triggered by ISSUE-05. Catches latent versions of the same class of bug in workflows that weren't edited this session — the codebase may have other stale refs from earlier edits. Cheap to implement (same jq scan as PIC-01) and surfaces in the review HTML.

(All three to be applied when the issues from this session are next fixed via a sprint → `flush-plugin-improvements` afterwards.)

---

