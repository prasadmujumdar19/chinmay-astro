# Smoke — Pre-Go-Live P0 Closeout — 2026-05-24

## Header

| Field | Value |
|---|---|
| Test type | smoke |
| Slug | pre-golive |
| Date (UTC) | 2026-05-24 |
| Started | 2026-05-24T01:00:04Z |
| Operator | prasadmujumdar |
| Test phone | 61466927921 (user id=28) |
| Design references | `docs/reference/FunctionalTestCases_Tracker.md` + per-TC inline narration |
| Watch — n8n | All active workflows |
| Watch — Postgres | chinmay_astro.{users, pending_users, consultations, messages, payments} |
| Watch — Slack | C0A5B0ZE81E (chinmay-admin-commands), C0B567A175W (consult-61466927921) |
| Latency threshold | 5000 ms |

## Session rules (operator-set)

- **No code changes.** No workflow JSON edits (live or local), no `.pseudo` edits, no `.md` edits anywhere outside this session folder.
- **DB:** DML allowed (UPDATE / INSERT / DELETE on `chinmay_astro.*` for test-state setup or clean-slate wipes). **DDL not allowed** (no CREATE / ALTER / DROP).
- **Bugs:** logged here under `### Issues found` with `[critical]` / `[major]` / `[minor]` severity. No auto-fixes, no PRs, no remediation in this session.

## Scope — 9 P0 retests

All have code/structure changes landed in prior sprints; this session provides the missing end-to-end functional verification.

| # | TC | Sprint origin | What to verify |
|---|---|---|---|
| 1 | TC-0302 | TD-021 (inline-20260522 SP-03) | Admin `APPROVE PAYMENT <wrong-phone>` → admin Slack feedback (no silent drop) |
| 2 | TC-0315 | TD-030 (SP-03 cascade) | Bot's own Slack message into consult channel ignored by WF-10 |
| 3 | TC-0605 | SP-04 / TD-B (inline-20260522) | consultation_active user sends `STOP` → unconditional opt-out |
| 4 | TC-0704 | TD-030 (SP-03) | WA message from bot's own number → dropped at WF-00 webhook |
| 5 | TC-1006 | TD-033 | WF-50 invoked with empty/null body → drop, no WA send |
| 6 | TC-1007 | TD-034 (TD-002 rebuild) | Whitespace-only inbound → WF-60 drop, no row in messages |
| 7 | TC-1012 | DR-2 conformance | WF-33 reads `slack_channel_id` from `users` row, does NOT call WF-52 |
| 8 | TC-1010 (WA-side) | TD-002 | Each WA inbound + outbound produces a `messages` row with correct direction |
| 9 | TC-0604 + TC-0606 | SP-04 re-verify | STOP from payment_pending + consultation_closed under unconditional opt-out |

## Baselines (captured 2026-05-24T01:00:04Z)

**n8n executions cursor:** `1879`

**Postgres row counts + watermarks:**

| Table | Rows | Max timestamp | Max id |
|---|---|---|---|
| users | 1 | 2026-05-23T06:48:23.281Z | 28 |
| pending_users | 2 | 2026-05-17T12:05:57.759Z | — |
| consultations | 5 | 2026-05-23T05:58:09.836Z | 13 |
| messages | 91 | 2026-05-23T06:48:23.854Z | 98 |
| payments | 8 | 2026-05-23T06:23:34.897Z | 17 |

**Slack cursors:** captured at first tick per channel.

## Test user state at baseline

| Field | Value |
|---|---|
| id | 28 |
| phone_number | 61466927921 |
| status | **consultation_closed** |
| slack_channel_id | C0B567A175W |
| awaiting_feedback | false |
| name | Abcs |
| updated_at | 2026-05-23T06:48:23.281Z |

## Suggested test sequence

State transitions imply an order. Operator may deviate; this is a default that walks the user through every state we need:

1. **TC-0606** — STOP from consultation_closed (current state — no setup needed)
2. After STOP → `opted_out`. Operator messages from WA → re-engages as new user (welcome + form). Either clean-slate wipe first OR test on fresh phone.
3. **TC-1007** — whitespace-only inbound (state-agnostic, any time)
4. **TC-0704** — WA bot echo (state-agnostic; requires triggering a message from our WA bot number, likely via WF-50 send-to-self or simulator)
5. User submits form → `payment_pending`. **TC-0604** — STOP from payment_pending.
6. Re-engage → form → payment_pending → tap "Payment Completed" → `payment_submitted`
7. **TC-0302** — Admin sends `APPROVE PAYMENT 99999999999` (wrong phone) → expect admin Slack feedback. User stays payment_submitted.
8. **TC-1012** — Admin sends correct `APPROVE PAYMENT 61466927921`; verify WF-33 read `slack_channel_id` from DB (no WF-52 call). User → `consultation_active`.
9. **TC-0315** — Bot relays an outbound message into consult channel; verify WF-10 ignores its own bot ts.
10. **TC-0605** — User sends `STOP` from consultation_active → expect unconditional opt-out.
11. **TC-1006** — Force WF-50 invocation with empty body (admin test? or trigger a downstream path that calls WF-50 with empty payload).
12. **TC-1010 (WA-side)** — verify `messages` table has rows for every WA inbound + outbound from steps above (passive observation across the run).

---

## Deferred from this session

Three TCs pulled out at operator's instruction (2026-05-24T01:08Z) — they require crafted webhook payloads rather than WA-client testing, better suited to a dedicated bot-simulation session:
- **TC-0315** — Slack bot-loop prevention in relay
- **TC-0704** — WA bot echo prevention
- **TC-1006** — WF-50 empty/null body guard

Revised in-scope TCs for this session (6): TC-0606, TC-1007, TC-0604, TC-0302, TC-1012, TC-0605 + passive TC-1010.

## Log

### Action — TC-0606 — STOP from consultation_closed (SP-04 re-verify)
**Time queued:** awaiting operator
**User state at start:** id=28, phone=61466927921, status=`consultation_closed`, channel=C0B567A175W, awaiting_feedback=false
**Trigger:** user sends `STOP` from WA test phone

**Expected behavior (per SP-04 / TD-B unconditional opt-out + WF-20 DR-5 keyword intercept):**
1. WF-00 receives webhook, dedup passes, routes to WF-01.
2. WF-01 routes to WF-20 (keyword handler) because `STOP` is in the exact-match keyword list (DR-5 — intercept BEFORE intent classifier).
3. WF-20 → WF-47 (Unsubscribe Handler).
4. WF-47 updates `users.status = 'opted_out'` (unconditional under SP-04, regardless of starting state).
5. No open consultation to close (status was already `consultation_closed`), so the `Close Open Consultation` step is a no-op / not invoked.
6. User receives WA opt-out confirmation via WF-50.
7. One row in `messages` for inbound STOP + one row for outbound confirmation.
8. No admin Slack ping required for STOP (opt-out is user-initiated, not blocked).

**Cross-checks at tick time:**
- new executions: WF-00, WF-01, WF-20, WF-47, WF-50, WF-60 (×2)
- DB: users.status `consultation_closed` → `opted_out`; users.updated_at moves
- DB: messages count +2
- Slack admin channel: no new posts expected

### Tick — 2026-05-24T01:18:00Z
**Trigger:** operator sent `STOP` from 61466927921 WA; observed responses on both WA and Slack
**Cursor moved:** exec 1879 → 1893 (14 new executions)

**New executions (14, all success):**
- 1880 WF-00 Webhook Receiver (3.7s) — inbound STOP webhook
- 1881 WF-60 Message Logger — inbound STOP logged
- 1882 WF-01 Message Router → 1883 WF-02 User State Router → 1884 WF-20 Keyword Handler (DR-5 STOP intercept) → 1885 WF-47 Unsubscribe Handler
- 1886 WF-51 Send Slack Message — admin notification to consult channel
- 1887 WF-60 — outbound Slack notification logged
- 1888 WF-50 Send WhatsApp — opt-out confirmation to user
- 1889 WF-10 Slack Admin Handler — picked up the bot's own Slack post (TD-030 guard should ignore it)
- 1890 WF-60 — outbound WA confirmation logged
- 1891–1893 WF-00 ×3 — Meta status callbacks for the outbound WA message (sent/delivered/read)

**Latency:** All under 5s threshold. End-to-end (1880 → 1888 outbound send) = 1.77s. Status callbacks tail at +6s but they're async housekeeping, not blocking.

**DB deltas:**
- `users` id=28: status `consultation_closed` → `opted_out`; updated_at 2026-05-24T01:14:48.767Z ✅
- `messages` +3 rows (ids 99/100/101):
  - 99 inbound text "STOP" — whatsapp_message_id populated, slack_message_ts null
  - 100 outbound slack_text "⚠️ User has opted out via STOP (phone: 61466927921). This consultation will not progress further. (Channel preserved per DR-10 in case of REBOOK.)" — slack_message_ts 1779585289.086709
  - 101 outbound text "You have been unsubscribed from Chinmay Astro. No further messages..." — whatsapp_message_id populated
- `consultations` for user_id=28: id=13 still `status=active`, ended_at=null ⚠️ — see Issue below
- `payments`, `pending_users`: no deltas (expected)

**Slack — consult channel C0B567A175W:** 1 new bot post — opt-out notification at ts 1779585289.086709 ("⚠️ User has opted out via STOP (phone: 61466927921). This consultation will not progress further. (Channel preserved per DR-10 in case of REBOOK.)").

**Slack — admin channel C0A5B0ZE81E:** no new posts (as expected — STOP is user-initiated, opt-out admin notification goes to per-user consult channel where Chinmay was conversing, not to chinmay-admin-commands).

**Cross-check vs expected:**
- ✅ WF-00 → WF-01 → WF-02 → WF-20 → WF-47 chain fired in order — DR-5 keyword intercept route confirmed
- ✅ users.status went unconditional opted_out (SP-04 / TD-B unconditional behavior — confirmed; starting state didn't matter)
- ✅ WA opt-out confirmation delivered (msg id 101)
- ✅ messages table has both inbound + outbound WA rows + outbound Slack notification (TC-1010 WA-side passive evidence — both directions logged with correct transport tags)
- ⚠️ Expected "no Slack ping" but Slack notification was posted to the user's consult channel (not admin channel). On reflection this is correct design — admin needs to know the consult is dead. Expectation re-stated for future ticks: STOP from any state posts a notice to the consult channel (where Chinmay watches), NOT to chinmay-admin-commands.
- ⚠️ consultations.id=13 (user_id=28) still `status=active` after opt-out — see Issue below

### Issues found

#### [observation] Confirms TD-DRIFT-007 (already tracked, fix pending)
**Observed:** After `STOP`, `users.status` is `opted_out` but `consultations.id=13` (user_id=28) remains `status='active'` with `ended_at=null`. WF-47 ran successfully (exec 1885) but the consultation row was not closed.

**Resolution:** Operator confirmed this is **TD-DRIFT-007** in sprint `pseudo-md-drift-fixes-2026-05-24/tasks.md` L32. Root cause, decision, fix, and verification steps already specified there — live connection rewiring of WF-47 to close-before-opt-out, plus pseudo update. Not a new defect; not in this session's scope to fix.

**Outcome:** ✅ TC-0606 PASS. The orphan is a pre-existing artifact and the remediation is queued. No new entry needed.

### Action — Re-engagement walk-through → TC-0604 (STOP from payment_pending)
**User state at start:** id=28, phone=61466927921, status=`opted_out`, slack_channel_id=C0B567A175W
**Operator plan:** (a) send any WA message → expect WF-21 re-engagement (welcome + form); (b) submit form → expect `payment_pending`; (c) send `STOP` → TC-0604 retest.

**Expected behavior — step (a) re-engagement (DR-9: opted_out user messaging again is treated as new user):**
- WF-00 → WF-01 → WF-02 routes opted_out → WF-21 (Welcome + Form Sender), NOT to keyword/intent paths.
- No DB write at this step (Design Rule #1: no DB write before form submission). NOTE: WF-21 may write to `pending_users` (CLAUDE.md project-design-rule_pending_users carve-out — that is intentional, do NOT flag).
- User receives WhatsApp Flow form CTA.
- Slack channel C0B567A175W preserved (DR-10 — not archived).

**Expected behavior — step (b) form submission:**
- WF-22 fires on Flow nfm_reply: first DB write to `chinmay_astro.users` (UPDATE, not insert — row already exists from id=28).
- users.status transitions: `opted_out` → `payment_pending`.
- WF-22 calls WF-52 to ensure consult channel exists. Channel C0B567A175W already exists → idempotent path (TC-1011 implicit). users.slack_channel_id stays C0B567A175W.
- WA payment instructions message sent via WF-50.

**Expected behavior — step (c) STOP from payment_pending (TC-0604):**
- Same WF-00 → WF-01 → WF-02 → WF-20 → WF-47 chain as TC-0606.
- users.status `payment_pending` → `opted_out` (unconditional SP-04).
- No active consultation to close (user never reached consultation_active in this cycle); WF-47 close step no-op.
- WA opt-out confirmation + Slack opt-out notice to consult channel.

**Cross-checks at tick time (post step c):**
- exec chain includes WF-21, WF-22, WF-52 (idempotent), WF-50 ×N for re-engagement; later WF-47 for STOP
- DB: users.status traverses opted_out → payment_pending → opted_out
- DB: messages logs every WA inbound + outbound across all three steps
- DB: no new row in consultations (payment_pending never starts a consultation)

### Tick — 2026-05-24T01:34:00Z
**Trigger:** operator sent `Hi` (got form back), filled and submitted form (got form back AGAIN — said "I think something's broken")
**Cursor moved:** exec 1893 → 1911 (18 new executions, two events of 9 each + status callbacks)

**Event 1 — "Hi" at 01:28:25:**
- exec chain: WF-00 (1894) → WF-60 (1895) → WF-01 (1896) → WF-21 (1897) → WF-50 (1898) → WF-60 (1899) + 3× WF-00 status callbacks (1900–1902)
- DB: messages id=102 inbound text "Hi"; id=103 outbound interactive (welcome message + form CTA)
- **Behavior:** WF-21 correctly resent the welcome+form — matches DR-9 "opted_out user messaging again = treated as new user". ✅ This step is correct.

**Event 2 — Form submission at 01:28:59 (the broken one):**
- exec chain: WF-00 (1903) → WF-60 (1904) → WF-01 (1905) → **WF-21 (1906)** → WF-50 (1907) → WF-60 (1908) + 3× WF-00 status callbacks (1909–1911)
- **WF-22 (`dr8QM0m92Ml8MvIh` Form Response Handler) NEVER ran.** WF-02 (`PubCsNTOspF3xqXZ` User State Router) ALSO never ran.
- DB: messages id=104 inbound interactive (empty content — the nfm_reply payload); id=105 outbound interactive (welcome message + form CTA — sent AGAIN).
- users.status unchanged: still `opted_out` (no transition to payment_pending).

**Raw payload confirmation (from WF-00 exec 1903 webhook data):**
```json
{
  "type": "interactive",
  "interactive": {
    "type": "nfm_reply",
    "nfm_reply": {
      "response_json": "{\"full_name\":\"Abcd\",\"time_of_birth\":\"12:30\",\"date_of_birth\":\"2000-05-24\",\"consent\":[\"agree\"],\"flow_token\":\"1779586105660\",\"place_of_birth\":\"Mumbai\"}",
      "body": "Sent",
      "name": "flow"
    }
  }
}
```
So the form payload arrived intact at WF-00. The parse output at "Parse WhatsApp Message" gives `messageType='interactive'` and `messageContent=''` (parse doesn't surface `nfm_reply` as a distinct messageType; downstream is expected to check `rawMessage.interactive.type`).

### Issues found

#### [critical] BUG-NEW-02 — opted_out user cannot re-engage via form (permanent re-engagement loop)

**Symptom:** opted_out user sends ANY message (text or form submission) → always routed to WF-21 → form re-sent. User can never transition out of `opted_out` via the form path.

**Root cause — verified by execution trace:**
WF-01 (`hYGNM97sXvdo1WmI` Message Router) connection graph executes filters in this order:
```
trigger → Layer 1 Country → Layer 2 Non-Text → Layer 3 Blacklisted →
  Opted Out? → (YES) Route Opted-Out to WF-21    ← STOPS HERE for opted_out users
              (NO)  Load Pending User → Load User → ... → Anomaly Route? → Call WF-02 Rule Router
```

WF-01's `Opted Out?` IF check fires BEFORE message-type or nfm_reply differentiation. It indiscriminately routes every inbound message from an opted_out user to WF-21 (welcome+form sender). The Flow nfm_reply payload — which should go to WF-22 (via WF-02 `Detect Route`'s nfm_reply → DETAILS_FORM rule, then `Route Switch` output #2) — is intercepted at the WF-01 layer and never reaches WF-02 at all.

Verified by inspecting `runData` for exec 1905 (WF-01): the only nodes that ran were `Layer 1 → Country Rejected? → Layer 2 → Message Accepted? → Layer 3 → Blacklisted? → Opted Out? → Route Opted-Out to WF-21`. No path to `Call WF-02 Rule Router`.

**Verified WF-02's downstream WOULD have worked:** WF-02's `Detect Route` Code node has the very first rule `if (messageType === 'interactive' && interactiveType === 'nfm_reply') { route = 'DETAILS_FORM' }`, which routes to WF-22 via `Route Switch` output #2. That branch is intact in the JSON. The bug is purely WF-01's premature opted_out catch-all.

**Design-rule conflict:**
CLAUDE.md state machine line: `opted_out →(user messages again)→ [treat as new user, route to WF-21]`
This implies: opted_out → message → get welcome+form → submit form → transition to payment_pending. WF-21 sending the form has no value unless the resulting form submission is allowed to reach WF-22. Current implementation defeats the spirit of "treat as new user" because form submissions get caught in the same opted_out gate.

**Why not pre-existing TD-DRIFT-001?** TD-DRIFT-001 in `pseudo-md-drift-fixes-2026-05-24/tasks.md` L66 is a header-only stub describing "WF-00 nfm_reply parse path — fix live". The body is empty (not yet designed). This bug's root cause is one workflow further down — in WF-01's `Opted Out?` ordering, not WF-00 parsing. Whoever flesh-out TD-DRIFT-001 should be aware that the real defect surfaces in WF-01, not WF-00.

**Impact for go-live:** any user who has ever opted out and later wants to come back is locked into a re-engagement loop. STOP is a regulatory feature; users WILL use it and some will return. This is a P0 blocker.

**Impact for this session:** blocks TC-0604, TC-0302, TC-0605, TC-1012 (every TC requires the user to be in `payment_pending` or beyond — none can be reached from the current `opted_out` state). Only TC-1007 (whitespace inbound, state-agnostic at WF-60 filter) and TC-1010 passive (already collecting evidence) remain testable from the current user state.

**Workarounds for continuing this session (not fixes — no fix this session):**
1. **DML clean-slate wipe** (DML allowed) — DELETE users.id=28 and pending_users for 61466927921. Then send any WA message → WF-01 sees `Load User` returns null, `Opted Out?` IF evaluates NO (user record absent), continues down the proper path. Form submission would then reach WF-02 → WF-22. **Allowed per session rules.**
2. **Switch test phone** to a brand-new number — same effect without touching DB. Requires operator to have another WA-capable phone.

**Status:** TC-0606 ✅ done (already validated under prior steps). TC-0604 ⏸ blocked by BUG-NEW-02 unless we reset the user.

### Action — TC-1007 — Whitespace-only inbound message (TD-034 guard verification)
**User state:** id=28, status=`opted_out` (unchanged; current state doesn't matter for this test — TD-034 lives in WF-60 and runs early)
**Trigger:** operator sends a whitespace-only WA message (e.g. " " or "   ") from 61466927921

**Expected behavior (per TD-034 placement in WF-60):**
- WF-00 webhook receives the message; calls WF-60 (logger) and WF-01 (router) in parallel.
- WF-60: detects whitespace-only content via the TD-034 filter, computes `_filterReason='whitespace_only'` (or similar), the `Filter Skip?` IF routes to the skip-result path → **no INSERT into `chinmay_astro.messages`**.
- WF-01: still processes the message through its filter chain. Because user is opted_out, WF-01 will route to WF-21 — same BUG-NEW-02 loop will fire (welcome+form re-sent). Note this is expected given current user state, NOT a regression of TC-1007.

**Cross-checks at tick time:**
- new exec WF-60 (1 instance) — `Filter Skip?` IF takes the skip branch
- `messages` count: +0 for inbound (TD-034 drop). +N for outbound depending on whether WF-21 fires (likely +1 outbound welcome again, +1 status callback noise).
- Outcome: ✅ TC-1007 passes if and only if no inbound row appears in `messages` for this whitespace event.

### Tick — 2026-05-24T01:50:00Z — TC-1007 NOT TESTABLE FROM WA CLIENT
**Trigger:** operator tried to send whitespace-only; WhatsApp UI disabled the Send button. WA app validates message non-emptiness client-side before allowing send.

**Implication for TD-034:** the whitespace guard in WF-60 cannot be exercised through the normal WA user path because Meta's client blocks it upstream. TD-034 remains valuable as **defense-in-depth** against:
- API-direct senders bypassing the WA UI
- Malformed webhook payloads (rare but seen historically with Meta delivery edge cases)
- Future channels that might not pre-validate (e.g. a web-form-to-WhatsApp gateway)

It is NOT reachable through end-to-end smoke testing. To exercise it functionally you'd need to either:
- POST a crafted webhook to WF-00's endpoint directly (curl with a JSON body containing `text.body: " "` or empty/whitespace text)
- Or assert via unit-style inspection that the WF-60 `_filterReason` and `Filter Skip?` branch logic handles whitespace correctly (code-review level, not behavior level)

**Decision:** Defer TC-1007 to the same bot-simulation session that TC-0315 / TC-0704 / TC-1006 were deferred to (all three also require crafted webhook payloads). Document in followups + report.

**Outcome:** ⏸ TC-1007 DEFERRED to bot-simulation follow-up session. TD-034 code presence verified earlier (prior sprint smoke); functional-test deferred.




---

## Resume — 2026-05-24T04:52:38Z

**Trigger:** new `monitor-test-run` invocation against handoff `docs/artefacts/handoffs/handoff-smoke-pre-golive-bug-new-02.md`. Folder-resume per operator decision (skill-default fresh folder declined; continuity with TC-0606 / BUG-NEW-02 evidence preserved).

**Reset path applied:** DML wipe per CLAUDE.md clean-slate SQL.
- `DELETE FROM chinmay_astro.admin_actions WHERE user_id=28` → 3 rows
- `DELETE FROM chinmay_astro.users WHERE phone_number='61466927921'` → 1 row (cascades to consultations/messages/payments)
- `DELETE FROM chinmay_astro.pending_users WHERE phone_number='61466927921'` → 1 row
- Post-verify: all 3 targets return 0 rows ✅
- Slack channel C0B567A175W preserved per handoff. Will become orphan once new form submission creates a new channel via WF-22→WF-52 — cleanup deferred.

**Cursors re-captured:**
- exec-cursor=1911 (unchanged since prior session end — no new executions in the gap)
- time-cursor=2026-05-24T04:52:38Z

**Remaining queue (handoff order):** TC-0604 → TC-0302 → TC-1012 → TC-0605.

**Carry-forward unchanged:** TC-1007 deferred (WA UI blocks whitespace); TC-0315 / TC-0704 / TC-1006 deferred (need crafted webhook). BUG-NEW-02 [critical] still open — WF-26 design discussion is pre-pseudo per operator note in `followups-bug-new-02-resolution.md`.

### Action — 2026-05-24T04:55:00Z — TC-0604 (STOP from payment_pending)
**Operator narration:**
1. Send `hi` from 61466927921 (wiped user, no record). Expect: WF-21 welcome + WhatsApp Flow form back; row in `pending_users` only (no `users` row yet per DR-1).
2. Fill + submit Flow form. Expect: WF-22 inserts `users` row in `payment_pending`, calls WF-52 to create new consult channel, stores `slack_channel_id`; admin notified in Slack.
3. From `payment_pending`, send `STOP` instead of tapping `Payment Completed`. Expect: WF-20 keyword intercept → unconditional opt-out → `users.status = opted_out`, opt-out confirmation WA reply, admin notified.

**Will tick on operator's "check" after step 3.**

### Tick — 2026-05-24T05:01:00Z — TC-0604
**Trigger:** operator said "check" after sending `hi` → submitting form → sending `STOP`.

**New executions:** 36 (1912–1947), all success, max duration 2.95s (no `[slow]` flags). Three waves:

*Wave 1 — `hi` inbound (04:57:35–40):* WF-00 → WF-60 → WF-01 → WF-02 → WF-20 (keyword pre-check, fall-through) → WF-21 (new-user welcome + form) → WF-50 (form sent) → WF-60 log. Then 3× WF-00 delivery callbacks.

*Wave 2 — form submission (04:58:04–16):* WF-00 → WF-60 → WF-01 → WF-02 → WF-22 (form handler) → **WF-52 (channel manager)** → WF-50 (payment confirmation to user) → WF-60 log. Then 3× WF-00 delivery callbacks.

*Wave 3 — `STOP` inbound (04:58:32–36):* WF-00 → WF-60 → WF-01 → WF-02 → **WF-20 (keyword intercept)** → **WF-47 (Unsubscribe Handler)** → **WF-51 (admin Slack alert)** → WF-60 → **WF-50 (opt-out WA confirmation)** → WF-10 (bot-echo entry, exited clean, no chained action — side evidence for TC-0315) → WF-60. Then 3× WF-00 delivery callbacks.

**DB deltas:**
- `pending_users`: 1 new row at 04:57:36 (phone=61466927921, contact_name="Prasad Mujumdar") — written by WF-21 path before any user row. ✅ DR-1 honored.
- `users`: 1 new row id=29 at 04:58:07-ish, status flipped to `opted_out` at 04:58:32.596Z. **slack_channel_id=C0B567A175W** — WF-52 reused the preserved channel by name rather than creating a new one (idempotent — orphan concern resolved).
- `messages` (user_id=29): 4 rows — outbound payment-confirmation (id=106), inbound `STOP` (107), outbound Slack opt-out alert (108), outbound WA opt-out confirmation (109). Trail correct.

**Slack:**
- `consult-61466927921` (C0B567A175W): 1 new bot message at 04:58:32Z — ":warning: User has opted out via STOP (phone: 61466927921)… (Channel preserved per DR-10 in case of REBOOK.)". ✅
- `chinmay-admin-commands`: not separately checked this tick — opt-out alert went to the user's consult channel per DR-13.

**Cross-check vs expected:**
- ✅ Step 1: `hi` → WF-21 form returned; only `pending_users` row written, no `users` row at that point.
- ✅ Step 2: form submit → WF-22 created user 29 (`payment_pending`), WF-52 returned channel id, payment-confirmation WA sent.
- ✅ Step 3: `STOP` from `payment_pending` → WF-20 intercept → WF-47 unconditional opt-out → status=`opted_out` (DR-4 unconditional behavior), admin Slack alert + WA confirmation both delivered.

**Outcome:** ✅ **TC-0604 PASS** — STOP from `payment_pending` triggers unconditional opt-out, matches design.

**Observations (not bugs, but flagging):**
- The WF-21 outbound form message did NOT produce a `messages` row (the trail starts at id=106 for the WF-22 payment confirmation). At WF-21 send-time there was no `users.id` to attach. Pre-existing WF-60 behavior (logger keyed on user_id), not a regression — but worth noting if the FunctionalTestCases tracker expects every outbound to be logged.
- WF-52 idempotency on channel name is now empirically confirmed: same `consult-{phone}` slug returned the preserved channel C0B567A175W rather than creating a new orphan. Good for DR-10 + rebook re-use.

**Cursors updated at end of tick:** exec-cursor=1947, time-cursor=2026-05-24T05:01:00Z.

### Issues found — 2026-05-24T05:15:00Z — design-level gaps surfaced by TC-0604

**GAP-01 [major] — Inbound + WF-21 outbound not logged in `messages` (audit-trail gap)**

During TC-0604, the inbound `hi` (Wave 1) and the outbound WF-21 form message produced **no** rows in `chinmay_astro.messages`. Logging only resumed at id=106 (WF-22 payment confirmation, Wave 2) because `messages.user_id` is the only key WF-60 attaches by, and the `users` row didn't exist until WF-22 ran. Verified via `SELECT * FROM messages WHERE created_at BETWEEN '2026-05-24T04:57:00Z' AND '2026-05-24T04:58:30Z'` → 1 row only.

**Operator principle (logged this session):** audit-trail integrity requires that every inbound + outbound WhatsApp event be logged regardless of whether the `users` row exists yet. User-row creation timing (delayed to form submission, per DR-1) and message-logging coverage are independent concerns.

**Implication for sprint backlog (no code change this session):**
- `messages.user_id` must become nullable OR WF-60 must look up phone → user_id with NULL fallback for pre-form events.
- Affected workflow pseudo specs likely include WF-60 (logger entry-point), WF-21 (welcome+form path), WF-23/WF-30/WF-31 (intent filters that emit outbound clarifiers), and the inbound-side WF-00→WF-01→WF-02 chain that currently bypasses logging when no user_id is resolvable.
- Pseudo-first per `[[feedback_pseudocode_first_refactor]]`: revise WF-60.pseudo + caller pseudos before any JSON edits.

**GAP-02 [minor] — GDPR / data-retention maintenance workflows not yet built (provision exists in registry)**

`docs/workflow-registry.md` provisions both maintenance jobs but neither is implemented:
- **WF-73 Stale Form Cleanup** — daily, deletes records for users who never submitted form after 7 days (covers the pending-only orphan case). 🔵 Build Fresh / ⚪ P4 / Post-Go-Live.
- **WF-74 Data Retention Cleanup** — monthly, anonymise/delete records beyond retention period. 🔵 Build Fresh / ⚪ P4 / Post-Go-Live.

Verified via n8n API query — no live workflow names contain `maint|clean|purge|retent|gdpr|stale|delete|expir|prun`.

**Scope expansion required when GAP-01 is fixed:**
- If WF-60 starts writing rows for pre-`users` events (NULL `user_id` or phone-keyed), then **WF-73 must broaden** to also purge orphan `messages` rows whose phone has no live `users` or `pending_users` mapping. Current FK `messages.user_id ON DELETE CASCADE` only cascades from `users` deletion — pending_users deletion doesn't touch `messages`.
- WF-74's retention window is undefined in the registry — needs a concrete number (likely tied to `consultation_closed + N days` for Indian DPDPA / GDPR equivalence) before it can be built.

Both GAPs to carry into the followups file at end-of-session for sprint planning intake.

### Skipped — TC-0302 and TC-1012 (covered by prior smoke; recorded as PASS by reference)

Per operator decision after audit (avoid redundant re-test); evidence cited below.

**TC-0302 — Admin `APPROVE PAYMENT <wrong-phone>` → admin Slack feedback (no silent drop). ✅ PASS by reference.**
Covered in SP-03 smoke `docs/artefacts/tests/smoke-wf10-centralized-gate-2026-05-23/session.md` Phase C2:
- Operator typed `APPROVE PAYMENT +614999999999` in `consult-+61466927921`
- Executions 1731 (WF-10 classify) → 1732 (WF-51 alert) → 1733/1734 (logger) → 1735 (WF-10 echo) — no WF-11, no WF-33, terminated at WF-51 alert ✅
- Verified Slack reply: ":warning: APPROVE PAYMENT 614999999999 ignored — this channel belongs to 61466927921. Please re-check the phone you typed. No action taken."
- Phone-Absent (C1, exec 1727) and Wrong-State (C3, exec 1737) variants also passed in same smoke.

**TC-1012 — WF-33 reads `slack_channel_id` from `users` row, does NOT call WF-52. ✅ PASS by reference.**
Covered in SP-03 smoke Phase E1 (Attempt 3, execs 1790–1801 — APPROVE PAYMENT happy path):
- 12-execution chain: WF-10 → WF-11 → WF-33 → WF-50 → WF-60 → WF-51 → WF-60 → WF-00 (×3 callbacks) → WF-10 echo
- **WF-52 (IO5BZLUxuVmjzk5I) absent from the chain** — WF-33 used the existing `users.slack_channel_id` directly
- DB end-state: `users.status='consultation_active'`, payment row verified, consultation row created — all using the pre-existing channel
- DR-2 (channel created at form-submit, not at payment-completed) and DR-10 (channel preserved + reused) both honored

### Action — 2026-05-24T05:18:00Z — TC-0605 (STOP from consultation_active)
**Pre-action setup:** wipe user 29 (clean-slate SQL), then walk the full happy path to consultation_active before sending STOP.

**Operator narration (planned):**
1. Send `hi` from 61466927921 (wiped). Expect: WF-21 form back, only `pending_users` row.
2. Fill + submit Flow form. Expect: WF-22 → `users.status='payment_pending'`, WF-52 returns C0B567A175W (idempotent reuse expected), payment-confirmation WA sent.
3. Tap "Payment Completed" button on the WA payment-info message. Expect: WF-31 (Payment Submitted Handler) flips `users.status='payment_submitted'`, admin Slack alert with APPROVE/REJECT prompt.
4. Operator types `APPROVE PAYMENT 61466927921` in the consult channel. Expect: WF-10 gate PASS → WF-11 → WF-33 → `users.status='consultation_active'`, payment row verified, consultation row created, admin Slack confirmation.
5. From `consultation_active`, send `STOP` instead of any consultation text. Expect: WF-20 keyword intercept → WF-47 unconditional opt-out → `users.status='opted_out'`, admin Slack alert + WA opt-out confirmation. (Same unconditional behavior as TC-0604, but starting from `consultation_active` instead of `payment_pending` — verifies DR-4 applies across both states under SP-04.)

**Will tick on operator's "check" after step 5.**

### Tick — 2026-05-24T05:50:00Z — TC-0605
**Trigger:** operator completed all 5 steps (hi → form → Payment Completed → admin APPROVE PAYMENT 61466927921 → STOP) and said "check".

**New executions:** 61 (1948–2008), all `success`, all sub-second. Five waves correspond 1:1 to the planned steps — no extra invocations, no failures, no slow flags.

| Wave | Time | Trigger | Chain | Result |
|---|---|---|---|---|
| 1 | 05:44:39 | inbound `hi` | WF-00 → WF-60 → WF-01 → WF-02 → WF-20 (pass-through) → **WF-21** → WF-50 (form sent) → WF-60 | form delivered |
| 2 | 05:45:06 | form submit | WF-00 → WF-60 → WF-01 → WF-02 → **WF-22** → **WF-52** → WF-50 (payment info) → WF-60 | user 30 in `payment_pending`, channel reused C0B567A175W |
| 3 | 05:45:17 | "Payment Completed" tap | WF-00 → WF-60 → WF-01 → WF-02 → **WF-32** → WF-50 (ack) → WF-60 → **WF-51** (admin "New Payment Submission" w/ APPROVE prompt) → WF-60 | `payment_submitted` + admin alerted |
| 4 | 05:45:46 | admin `APPROVE PAYMENT 61466927921` | **WF-10** → **WF-11** → **WF-33** → WF-50 (template `consultation_activated`) → WF-60 → WF-51 ("Payment approved... consultation active") → WF-60 | `consultation_active` + payment 18 `verified` + consultation 14 `active` |
| 5 | 05:47:46 | inbound `STOP` from `consultation_active` | WF-00 → WF-60 → WF-01 → WF-02 → **WF-20** (keyword intercept) → **WF-47** (unsubscribe) → WF-51 (admin opt-out alert) → WF-60 → WF-50 (opt-out WA confirmation) → WF-60 | `opted_out` |

**DB end-state:**
- `users` id=30, phone=61466927921, status=`opted_out`, slack_channel_id=`C0B567A175W` (idempotent reuse — third confirmation this session), updated_at=05:47:47.345Z
- `payments` id=18, status=`verified`, ₹500
- `consultations` id=14, status=`active`, started_at=05:45:47Z ← **note: still `active`** after opt-out (see Observation O-01 below)
- `messages` user_id=30 — 10 rows (110–119): WF-22 ack outbound, "Payment Completed" inbound interactive, WF-32 ack outbound text, WF-51 admin "New Payment Submission" outbound slack_text, WF-50 `consultation_activated` template outbound, WF-51 "Payment approved" outbound slack_text, admin `APPROVE PAYMENT` inbound slack_text, `STOP` inbound text, WF-51 opt-out outbound slack_text, WF-50 opt-out confirmation outbound text

**Slack (C0B567A175W) — last 4 messages match chain exactly:**
- 05:45:20 — bot ":bell: New Payment Submission... Phone +61466927921... Payment ID: 18... APPROVE PAYMENT 61466927921"
- 05:45:45 — operator (U0A4175DJ5D) typed `APPROVE PAYMENT 61466927921`
- 05:45:48 — bot ":white_check_mark: Payment approved for Ande (61466927921). User notified via WhatsApp; consultation is now active."
- 05:47:47 — bot ":warning: User has opted out via STOP (phone: 61466927921). This consultation will not progress further. (Channel preserved per DR-10 in case of REBOOK.)"

**Cross-check vs expected:**
- ✅ Step 1: form delivered, pending_users-only (deferred verify — covered by Wave 1 having WF-21 in the chain and no WF-22)
- ✅ Step 2: WF-22 created user 30, WF-52 returned existing channel id, payment confirmation WA sent
- ✅ Step 3: WF-32 flipped status to `payment_submitted`, admin Slack alert posted with APPROVE prompt
- ✅ Step 4: WF-10 gate PASS → WF-11 → WF-33 → status=`consultation_active`, payment.verified, consultation row created, admin Slack confirmation
- ✅ Step 5: WF-20 keyword intercept → WF-47 unconditional opt-out from `consultation_active` (DR-4 holds across both `payment_pending` and `consultation_active` starting states)

**Outcome:** ✅ **TC-0605 PASS** — STOP from `consultation_active` triggers unconditional opt-out, matches design.

**Observations (not bugs, flagging):**

**O-01 [minor] — consultation row left in `active` status after user opt-out.** After WF-47's unsubscribe sequence, `consultations.id=14.status` remained `active`. Only `users.status` flipped to `opted_out`. WF-47 does not touch the consultations row.
- Functional impact: low — the gate for any further user-side action is `users.status`, which correctly blocks. But operational/analytics queries that count "active consultations" will inflate by 1 per opted-out-mid-consultation user.
- Design question: should WF-47 also set `consultations.status='abandoned'` (or similar) when there is an open consultation row? Or is the convention to leave it active and infer state from `users.status` join? Worth deciding before backlog grooming.

**O-02 [info] — GAP-01 confirmed scope.** TC-0605's `messages` trail starts at id=110 (WF-22 ack) — same pattern as TC-0604. Inbound `hi` from Wave 1 and outbound WF-21 form are still missing. So GAP-01 is consistently a "pre-users-row" event-logging hole, not a transient bug.

**O-03 [info] — WF-52 idempotency on channel name now confirmed across 3 fresh users (28, 29, 30).** All three reused `C0B567A175W` rather than creating new orphans. Strong empirical support for DR-10.

**O-04 [info] — admin Slack inbound `APPROVE PAYMENT 61466927921` logged in `messages` as id=116 (direction=inbound, message_type=slack_text).** WF-10's centralized gate is contributing audit-trail rows for admin-side commands too. Good supporting context for the upcoming message-logging design sprint (the Slack side is already complete; only the WA pre-users-row side has the gap).

**Cursors updated at end of tick:** exec-cursor=2008, time-cursor=2026-05-24T05:50:00Z.

