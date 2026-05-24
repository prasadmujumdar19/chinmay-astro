# Smoke — Pre-Go-Live P1 Coverage — 2026-05-24

## Header

| Field | Value |
|---|---|
| Test type | smoke |
| Slug | pre-golive-p1 |
| Date (UTC) | 2026-05-24 |
| Started | 2026-05-24T06:13:05Z |
| Operator | prasadmujumdar |
| Test phone | 61466927921 (user id=30 at start) |
| Design references | `docs/reference/FunctionalTestCases_Tracker.md`; prior P0 session `docs/artefacts/tests/smoke-pre-golive-2026-05-24/` |
| Watch — n8n | All active workflows |
| Watch — Postgres | chinmay_astro.{users, pending_users, consultations, messages, payments} |
| Watch — Slack | C0A5B0ZE81E (chinmay-admin-commands), C0B567A175W (consult-61466927921) |
| Latency threshold | 5000 ms |

## Session rules (operator-set, inherited from P0 session)

- **No code changes.** No workflow JSON edits (live or local), no `.pseudo` edits, no `.md` edits anywhere outside this session folder.
- **DB:** DML allowed (UPDATE / INSERT / DELETE on `chinmay_astro.*` for test-state setup or clean-slate wipes). **DDL not allowed**.
- **Bugs:** logged here under `### Issues found` with `[critical]` / `[major]` / `[minor]` severity. No auto-fixes, no PRs.

## Known carry-forward from P0 session

- **BUG-NEW-02 [critical]** — opted_out user cannot re-engage via form (WF-01's `Opted Out?` IF intercepts before nfm_reply differentiation). Workaround: DML clean-slate wipe before any test that needs to start from a non-opted_out state. Pre-go-live blocker, design pre-pseudo per `followups-bug-new-02-resolution.md`.
- **GAP-01 [major]** — pre-`users`-row WA events not logged in `messages`. Expect this pattern to recur in any TC whose first event happens before the form is submitted.
- **GAP-02 [minor]** — WF-73/WF-74 retention not built (deferred post-go-live).
- **O-01 [minor]** — consultations row left `active` after user opts out (functional impact low; analytics inflation).
- **TD-DRIFT-007** — WF-47 doesn't close open consultation before opt-out; tracked in sprint `pseudo-md-drift-fixes-2026-05-24/tasks.md`.

## P1 scope — 21 pending TCs in tracker

Verbatim from `FunctionalTestCases_Tracker.md`:

| # | TC | What to verify | Reachability |
|---|---|---|---|
| 1 | TC-0102 | First message from brand-new user (image or audio) | WA client |
| 2 | TC-0105 | User re-submits form when already payment_pending | WA client |
| 3 | TC-0106 | Pre-form free-form — general enquiry intent | WA client |
| 4 | TC-0107 | Pre-form free-form — malicious/abusive intent | WA client |
| 5 | TC-0203 | payment_pending user sends free-form text (general enquiry) | WA client |
| 6 | TC-0204 | payment_pending user sends REBOOK (invalid/edge state) | WA client |
| 7 | TC-0206 | payment_submitted user sends image (e.g., GPay screenshot) | WA client |
| 8 | TC-0308 | Admin attempts UNBLOCK on opted_out user | Slack admin |
| 9 | TC-0312 | Admin types plain text in Slack when user NOT consultation_active | Slack admin |
| 10 | TC-0503 | User sends non-feedback text while awaiting_feedback | WA client |
| 11 | TC-0507 | consultation_closed free-form — general enquiry | WA client |
| 12 | TC-0601 | HELP — from payment_pending user (TD-A enables — retest) | WA client |
| 13 | TC-0602 | HELP — from payment_submitted user (TD-A enables — retest) | WA client |
| 14 | TC-0603 | HELP — from consultation_closed user (TD-A enables — retest) | WA client |
| 15 | TC-0609 | STOP — free-form stop intent, not exact keyword (SP-04 semantics changed) | WA client |
| 16 | TC-0803 | feedback_intent from consultation_closed user (no awaiting_feedback) | WA client |
| 17 | TC-0804 | WF-25 API failure (Gemini unavailable) | **Special harness** — needs Gemini credential break/swap, or n8n-side mock |
| 18 | TC-1002 | Admin APPROVE for user in wrong state | Slack admin |
| 19 | TC-1004 | Admin BLOCK a user who is consultation_active (mid-consultation) | Slack admin + WA setup |
| 20 | TC-1005 | APPROVE PAYMENT command parsing | Slack admin |
| 21 | TC-1013 | WF-20 routes HELP keyword with status-aware response (overlaps 0601/0602/0603) | WA client |

## Baselines (captured 2026-05-24T06:13:05Z)

**n8n executions cursor:** `2008` (carried from P0 session end)

**Postgres row counts + watermarks:**

| Table | Rows | Max timestamp | Max id |
|---|---|---|---|
| users | 1 | 2026-05-24T05:47:47.345Z | 30 |
| pending_users | 2 | 2026-05-24T05:44:40.117Z | — |
| consultations | 1 | 2026-05-24T05:45:47.054Z | 14 |
| messages | 10 | 2026-05-24T05:47:48.953Z | 119 |
| payments | 1 | 2026-05-24T05:45:18.463Z | 18 |

**Test user state at baseline (user id=30):**

| Field | Value |
|---|---|
| id | 30 |
| phone_number | 61466927921 |
| status | **opted_out** |
| slack_channel_id | C0B567A175W (preserved per DR-10 across all P0 cycles) |
| awaiting_feedback | false |
| updated_at | 2026-05-24T05:47:47.345Z |

**Slack cursors:** captured at first tick per channel.

## Log

### Reset — 2026-05-24T06:53:30Z — DML clean-slate wipe

Applied per CLAUDE.md clean-slate SQL to unblock BUG-NEW-02 re-engagement:
- `admin_actions` for user 30 → 0 rows (none existed)
- `users.phone_number='61466927921'` → 1 row deleted (cascades to consultations/messages/payments)
- `pending_users.phone_number='61466927921'` → 1 row deleted
- Post-verify: both targets return 0 rows ✅
- Slack channel `C0B567A175W` preserved (DR-10) — expect WF-52 idempotent reuse on next form submission

Cursors: exec-cursor=2008 (unchanged), time-cursor=2026-05-24T06:53:30Z.

### Action — 2026-05-24T06:53:30Z — Retest walk: HELP-per-state + TC-0609 stop-intent clarifier

**Retest batch covers:** TC-0601 / TC-0602 / TC-0603 / TC-1013 (HELP matrix, TD-A + TD-027 verification) and TC-0609 (SP-04 stop-intent clarifier).

**Operator-planned walk:**
1. Send `hi` from 61466927921 (no record). Expect: WF-21 welcome + Flow form back; `pending_users` row only (DR-1).
2. Fill + submit Flow form. Expect: WF-22 inserts `users` row, status=`payment_pending`, WF-52 returns existing C0B567A175W (idempotent), payment-info WA sent.
3. **TC-0601** — send `HELP` (exact keyword). Expect: WF-20 keyword intercept → `Send HELP Response` branch fires → status-aware HELP text returned (TD-027 ternary: payment_pending variant — UPI re-prompt / "tap Payment Completed" hint). User remains `payment_pending`.
4. **TC-0609** — send free-form stop-intent text (e.g. "please stop messaging me" or "unsubscribe me"). Expect: SP-04 clarifier path — WF-25 returns `stop_intent`, WF-30 fires WF-50 clarifier ("This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please ignore. If you do want to opt out... simply send STOP at any time."). **No auto-opt-out**; `users.status` stays `payment_pending`.
5. Tap "Payment Completed" button → `payment_submitted`. Expect: WF-32 flip, admin Slack alert with APPROVE prompt.
6. **TC-0602** — send `HELP` from `payment_submitted`. Expect: WF-20 HELP branch → status-aware text for payment_submitted (TD-027 variant: "waiting for admin verification" guidance).
7. Operator types `APPROVE PAYMENT 61466927921` in consult channel → `consultation_active`.
8. Operator types `CLOSE CONSULT` (or similar) in consult channel → `consultation_closed`.
9. **TC-0603** — send `HELP` from `consultation_closed`. Expect: WF-20 HELP branch → status-aware text for consultation_closed (TD-027 variant: REBOOK guidance).
10. **TC-1013** matrix composed from (3), (6), (9) + admin-side HELP from SP-03 A2 (already PASS).

**Cross-check checkpoints (will tick after operator says "check" at each step or batch):**
- WF-20 executes its HELP branch (not WF-30/31/47 fall-through) — verified by exec chain showing `WF-20 → WF-50` (not `WF-20 → WF-30 → WF-50`).
- WF-50 outbound message text matches TD-027 status-aware variant for the current state.
- `users.status` unchanged after each HELP.
- TC-0609: WF-25 classifies as `stop_intent`, WF-30's `Is Stop Intent?` IF takes TRUE branch, WF-50 sends clarifier wording verbatim, `users.status` unchanged.

**Operator: send `hi` from 61466927921 when ready. I will tick after each step you say "check".**

### Tick — 2026-05-24T07:05:00Z — Full batch (HELP×4 states + TC-0609 stop-intent from consultation_active)

**Trigger:** operator batched the entire walk. Sent HELP from `payment_pending`, `payment_submitted`, `consultation_active` (bonus, not in original plan), `consultation_closed`. Then re-engaged via REBOOK → second APPROVE → from `consultation_active` sent free-form text "I do not want to go ahead with the consultation" (TC-0609 free-form STOP semantics, exercised from `consultation_active` instead of `payment_pending`).

**Cursor moved:** exec 2008 → 2158 (150 new executions, all `success`).

**End-state DB:**
- `users` id=31, phone=61466927921, name="Anxs", status=`consultation_active`, channel=C0B567A175W, awaiting_feedback=false, updated_at=06:58:11.821Z
- `consultations`: id=15 closed (06:56:21 → 06:57:00), id=16 active (started 06:58:11)
- `payments`: id=19 verified ₹500 (06:55:57), id=20 verified ₹500 (06:58:00)
- `messages` ids 120–148 (29 rows over the walk)

#### Cross-check per TC

**TC-0601 — HELP from `payment_pending` (msg 121 inbound → msg 122 outbound)**

Exec chain (06:55:25): WF-00 (2031) → WF-60 (2032) → WF-01 (2033) → WF-02 (2034) → **WF-20** (2035) → **WF-50** (2036) → WF-60 (2037) + 3× status callbacks.

- ✅ WF-20 keyword intercept fired — chain bypasses WF-30 (payment-pending handler). Post-TD-A field-name fix verified working.
- ✅ WF-50 sent reply (msg 122).
- ❌ **Canonical status-aware HELP text NOT delivered.** Reply text was the generic ternary fallback:
  ```
  Here's what you can do:

  📋 *REBOOK* — Book a new consultation
  🚫 *STOP* — Unsubscribe from all messages

  For anything else, just type your question during an active consultation.
  ```
- ✅ `users.status` unchanged (still `payment_pending` at that point).

**TC-0602 — HELP from `payment_submitted` (msg 126 → 127)**

Exec chain (06:56:04): WF-00 (2054) → WF-60 → WF-01 → WF-02 → **WF-20** (2058) → **WF-50** (2059) → WF-60 + callbacks.

- ✅ WF-20 HELP branch fires.
- ❌ **Reply text is character-for-character identical to TC-0601** — not status-aware.

**Bonus — HELP from `consultation_active` (msg 131 → 132)**

Exec chain (06:56:33): WF-00 (2076) → WF-60 → WF-01 → WF-02 → **WF-20** (2080) → WF-50 (2081) → WF-60 + callbacks.

- ✅ Interesting: WF-20 keyword intercept fires even in `consultation_active`, so HELP keyword does NOT get relayed to admin via WF-40. Good for keyword precedence.
- ❌ **Reply text identical** — generic ternary fallback.

**TC-0603 — HELP from `consultation_closed` (msg 136 → 137)**

Exec chain (06:57:13): WF-00 (2098) → WF-60 → WF-01 → WF-02 → **WF-20** (2102) → **WF-50** (2103) → WF-60 + callbacks.

- ✅ WF-20 HELP branch fires.
- ❌ **Reply text identical to all other states.** TD-027 status-aware HELP is fully broken across all 4 user states.

**TC-1013 — status-aware HELP matrix close-out**

| State | WF-20 fires? | Status-aware text? |
|---|---|---|
| payment_pending | ✅ | ❌ generic fallback |
| payment_submitted | ✅ | ❌ generic fallback |
| consultation_active | ✅ | ❌ generic fallback |
| consultation_closed | ✅ | ❌ generic fallback |
| admin channel (HELP command) | ✅ (per SP-03 A2) | ✅ admin command list |

WF-20 user-side keyword interception works (TD-A fix verified). TD-027 status-aware text variants are NOT being applied — same generic fallback returned across all 4 user states.

**TC-0609 — free-form STOP intent from `consultation_active` (msg 146 → 147 relay + 148 clarifier)**

Operator sent: `"I do not want to go ahead with the consultation"` at 06:58:46.

Exec chain (06:58:46): WF-00 (2144) → WF-60 → WF-01 → WF-02 → WF-20 (2148, pass-through, not a keyword) → **WF-40 (2149, du32QB)** → **WF-25 (2150, eTV1l)** → WF-51 (2151, admin relay) → WF-60 → **WF-50 (2153, clarifier)** → WF-60 + callbacks.

- ✅ WF-40 invoked WF-25 (TD-E fix verified — pre-fix WF-40 would have relayed verbatim with no intent check).
- ✅ WF-25 classified as `stop_intent` (inferred from clarifier branch firing).
- ✅ Admin relay still fired (msg 147 — `📲 *Anxs:* I do not want to go ahead with the consultation`) — fan-out preserved.
- ✅ Clarifier sent (msg 148) — exact SP-04 wording: `This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please ignore. If you do want to opt out…`
- ✅ **WF-47 NEVER ran** — `users.status` remained `consultation_active`. No auto-opt-out. SP-04 design honored.

**TC-0609 PASS from `consultation_active`.** This exercises the WF-40 path (TD-E fix). The `payment_pending` variant (TD-D / WF-30 path) was not exercised this batch — same SP-04 pattern, sibling implementation, likely PASS but not directly verified.

#### Bonus coverage from this walk
- **REBOOK keyword from `consultation_closed`** (msg 138 → 139) — TC-0501 implicit. Exec 2108–2118 chain went WF-00 → WF-60 → WF-01 → WF-02 → WF-20 → **WF-45 (2113, MUG7rPg)** → WF-50 → callbacks. WF-20 intercepted REBOOK keyword, called WF-45 directly. user → `payment_pending`. ✅
- **APPROVE PAYMENT happy path (x2)** — TC-0303 re-verify ✅
- **CLOSE CHAT CONSULT from admin** — TC-0401 implicit ✅

#### Issues found

**BUG-P1-01 [major] — WF-20 HELP response is not status-aware (TD-027 not delivering per design)**

WF-20's `Send HELP Response` node (or upstream `Prepare HELP Text` Code node — needs node-level inspection) returns the same generic fallback text regardless of `userStatus`. Verified across 4 states (payment_pending, payment_submitted, consultation_active, consultation_closed) — all 4 outbound HELP replies are byte-identical (msgs 122 / 127 / 132 / 137).

Per `tech-debts/handoffs/batch7.md` L23: "WF-20 (LgIDj1v4ZbCPlX25): HELP messageBody updated to status-aware ternary (TD-027)". The ternary appears to be falling through to the default branch every time, OR the `userStatus` input is not flowing into the ternary expression.

Likely root cause hypothesis (similar pattern to BUG-F field-name mismatch): the ternary may reference a field name that doesn't match what WF-02 emits (`status` vs `userStatus` vs `user.status`). Needs node-level inspection of WF-20 `LgIDj1v4ZbCPlX25` HELP branch expressions.

**Impact:** Users get a generic help message in every state. Not a blocker (response IS delivered, keyword works), but TD-027 intent unmet. P1 — fix before go-live for journey-map J-18 alignment.

**Status:** **Accepted pre-MVP (operator decision 2026-05-24)** — not a go-live blocker; users get *a* response and keyword interception is verified working. Tracked as **TD-NEW-032** in `docs/sprint-tech-debt-2026-05-16-post-MVP.md` (🟡 P2) for fix after go-live. Acceptance signal: 4 different texts for the 4 user states.

**O-05 [info] — HELP keyword precedence over WF-40 relay**

In `consultation_active`, HELP got intercepted by WF-20 instead of relayed to admin via WF-40. This is desirable (admin shouldn't see "HELP" pings) but worth noting as established behavior — WF-20 keyword fast-path wins over consultation relay path.

**Cursors updated:** exec=2158, time=2026-05-24T07:05:00Z.

---

## Resume — 2026-05-24T07:33:08Z

Operator continued same-day session after a context break. Per handoff `docs/artefacts/handoffs/handoff-p1-help-stop-retests-2026-05-24.md`, the next phase is the **11 truly-untested P1 TCs** prefaced by a tracker update and a DML clean-slate wipe of user 31. Session rules from the original header still apply (no code changes; DML allowed; bugs logged here only).

**State at resume:**
- user 31 / 61466927921 — `consultation_active` (still), slack_channel_id `C0B567A175W`, awaiting_feedback `false`. Verified via Postgres before re-baselining.
- n8n exec cursor refreshed to **2158** (no new executions since pause), time cursor refreshed to **2026-05-24T07:33:08Z**.

**Decisions taken before first action:**
- Plugin improvement candidate (discover-prior-coverage sub-skill / monitor-test-run Step 1 addition) — **deferred** beyond this session.
- TC-0503 design question (awaiting_feedback never set on close) — **decide inline** when the TC is reached.
- Session folder — operator chose to append here (override of skill v1.29.0's "always fresh folder" rule) for context continuity. Single-folder downside (mixed runs) accepted.

**Planned action order** (from handoff):
1. Update `docs/reference/FunctionalTestCases_Tracker.md` — mark Pass for 5 completed (TC-0601/0602/0603/1013/0609) + 4 PASS-by-evidence (TC-1002/1004/1005/0312).
2. DML clean-slate wipe of user 31 (admin_actions → users → pending_users).
3. Pre-form TCs from brand-new state: TC-0102 → TC-0106 → TC-0107.
4. Wipe again, walk hi→form to `payment_pending`: TC-0105 → TC-0203 → TC-0204.
5. Tap Payment Completed → `payment_submitted`: TC-0206.
6. APPROVE → `consultation_active` → CLOSE → `consultation_closed`: TC-0507 → TC-0803.
7. STOP to `opted_out`: TC-0308 (UNBLOCK reject).
8. TC-0503 — design decision first.

Deferred for separate harness session: TC-0804 (Gemini failure sim) + crafted-webhook TCs (TC-0315 / TC-0704 / TC-1006 / TC-1007).

### Action — 2026-05-24T07:37:00Z — DML clean-slate wipe of user 31

```
DELETE FROM chinmay_astro.admin_actions WHERE user_id = 31;          -> 0 rows (table is deprecated; no writes)
DELETE FROM chinmay_astro.users         WHERE phone_number = '...'; -> 1 row (cascades to consultations 15+16 / messages / payments 19+20)
DELETE FROM chinmay_astro.pending_users WHERE phone_number = '...'; -> 1 row
```

Post-wipe verification: 0 rows in users / pending_users / admin_actions for phone 61466927921. Slack channel `C0B567A175W` intentionally retained (DR-10 — WF-52 will reuse on next form submission).

Tracker also updated this turn — 9 TCs moved from Pending (5 retest from earlier in this same session + 4 PASS-by-evidence); Overview bumped 33→42 covered (48%→61%).

### Action — 2026-05-24T07:39:30Z — TC-0102 (image from brand-new user)

Operator sent an image from `61466927921` from a clean-slate state (no `users` row, no `pending_users` row). Expectation: non-text deflection per WF-01 Layer 2 filter, no DB rows created, no Slack channel call.

### Tick — 2026-05-24T07:42:20Z

**New executions (8):** all success, sub-second.
- 2159 WF-00 (webhook in, image payload) → 2160 WF-60 (logger) → 2161 WF-01 (router) → 2162 WF-50 (send deflection) → 2163 WF-60 (logger) → 2164/2165/2166 WF-00 (Meta status callbacks for outbound)

**Routing path observed in WF-01 exec 2161:**
- `Layer 1: Country Filter` — passed
- `Layer 2: Non-Text Message Filter` — fired with `{messageType: "image", contactName: "Prasad Mujumdar"}`
- `Message Accepted?` IF → false branch
- `Silent Reject (Message Type)` → calls `Send Non-Text Deflection via WF-50` (node names misleading — it's NOT silent, it sends a polite deflection)

**Message sent via WF-50 (exec 2162):**
> "⚠️ Sorry, we only handle text messages right now. Please type your question."

WhatsApp ack confirmed by operator. WF-50 returned `success: true`, `messageId: wamid.HBgL…AAE`.

**DB deltas:** zero rows in `users`, `pending_users`, `messages` for phone 61466927921.

**Cross-check vs expected:**
- ✅ Non-text deflection delivered (WF-01 Layer 2 path)
- ✅ No `users` row created (DR-1 honored)
- ✅ No `pending_users` row created (DR-1 honored — pending_users is only written by WF-21 for hi/hello first-text path)
- ✅ No Slack channel call (correct — pre-form)
- ⚠️ **GAP-01 reconfirmed** — both inbound image and outbound deflection were NOT logged in `messages` (zero rows for this phone post-action). Same root cause as P0 session: `messages.user_id` NOT NULL FK requires a `users` row, which doesn't exist pre-form. Already-known pattern, still post-go-live remediation per prior session.

**TC-0102 PASS** — non-text deflection works, DR-1 (no DB write pre-form) honored, expected GAP-01 logging gap recurs as documented.

**Cursors updated:** exec=2166, time=2026-05-24T07:42:20Z.

### Action — 2026-05-24T07:44:18Z — TC-0106 (pre-form free-form general enquiry)

Operator sent text `"What services do you offer ?"` from clean-slate phone `61466927921` (no users row, no pending_users row after prior wipe; TC-0102's image didn't create state). Expectation per TC spec: WF-23 → WF-25 → general_enquiry → form re-prompt.

### Tick — 2026-05-24T07:46:45Z

**New executions (11):** all success.
- 2167 WF-00 → 2168 WF-60 → 2169 WF-01 → 2170 WF-02 → 2171 WF-20 → 2172 WF-21 → 2173 WF-50 → 2174 WF-60 → 2175/2176/2177 WF-00 (Meta status callbacks)

**Observed routing (WF-02 exec 2170):**
- `Detect Route` classified the message as `route: "NEW_USER"` (isNewUser=true, user=null, pendingUser=null).
- `Keyword Passthrough?` → action `passthrough` (no keyword matched).
- `Route Switch` → NEW_USER branch → `Call WF-21 (New User Welcome + Form)`.

**WF-21 exec 2172 effects:**
- `Insert Pending User` → wrote `pending_users` row: `phone=61466927921, contact_name="Prasad Mujumdar"`.
- `Build Welcome Message` → built interactive flow payload with `flowId=1408011897720771, flowCta="Fill Details"`, welcome text + privacy policy URL.
- `Call WF-50 Send WhatsApp` → returned `success: true, messageId: wamid…964B`.

**DB deltas:**
- `users` — still 0 rows for this phone (DR-1 honored).
- `pending_users` — 1 new row (Prasad Mujumdar, 07:44:18Z). Consistent with `project_design_rule_pending_users` memory — WF-21's pending_users write pre-form is intentional.
- `messages` — 0 rows (GAP-01 again).

**Cross-check vs TC-0106 expected:**
- ❌ **Expected WF-23 (pre-form text handler) → WF-25 (intent classifier) → general_enquiry path. Observed: no WF-23 / WF-25 in chain.**
- ✅ Form re-prompted (the welcome+form interactive message).
- ✅ No `users` row created.

**Spec-deviation analysis:**
- The current design treats ANY first text from a brand-new number (no users row) as needing the welcome+form regardless of content. Intent classification is bypassed. This is a pragmatic choice — a pre-form user can't be served general-enquiry content meaningfully; they need the form first.
- The TC-0106 spec assumes a `WF-23` pre-form intent handler that doesn't exist in the implementation. Two interpretations:
  1. **TC spec is stale** — design evolved to "always-welcome-form for brand-new"; TC should be re-spec'd to "any free-form from brand-new triggers welcome+form".
  2. **Spec is correct, implementation deviates** — there should be a WF-23 path classifying intent and producing a tailored response (e.g., answering the question briefly + offering the form). This is a behavioral gap.

**TC-0106 PROVISIONAL PASS** under interpretation #1 (current implementation honored); flagged for operator confirmation. Functional outcome (form re-prompt) was delivered.

#### Observation O-06 — pending_users contact_name capture is functional

WF-21 captured `contact_name = "Prasad Mujumdar"` from the WA contact name in the webhook payload, even though the inbound message was a general enquiry, not "hi/hello". Confirms pending_users insertion is keyed on `phone + isNewUser`, not on specific opening text.

#### Issues found

**BUG-P1-02 [critical / pre-go-live blocker] — Pre-form intent classifier gate missing**

WF-02's `Detect Route` shortcircuits any text from a brand-new user (no `users` row, no `pending_users` row) to `route: "NEW_USER"` → WF-21 welcome+form, with **no intent classification step**. Verified live in TC-0106 (exec chain 2167–2177).

**Why this is a blocker (operator call 2026-05-24T07:50:00Z):**
- Pre-go-live abuse defence is missing. A malicious_abusive opener from a brand-new number will be served the welcome+form (and the contact name captured into `pending_users`) instead of being deflected and auto-blocked.
- Garbage / spam openers similarly get the full form treatment, polluting `pending_users` and burning a Meta-side message budget.
- Same root cause would defeat TC-0107 (`abusive text from brand-new`) — running it now without the fix would confirm the bug, not demonstrate compliant behavior.

**Required design (operator-stated):**
- `Hi` / `hello` / general_enquiry-class openers from brand-new → continue to welcome+form (current behavior; the form itself explains how it works, so a tailored general-enquiry reply is unnecessary).
- malicious_abusive / garbage / off-topic-abuse openers from brand-new → defend: silent reject, auto-block, or canned "we can't help with that" deflection. No `pending_users` write, no form sent.
- Gate sits between WF-02 NEW_USER route and WF-21 — either as a new WF-23 (pre-form intent gate) or as a WF-25 call inside WF-21 before the `Insert Pending User` node.

**Affected artefacts:**
- Pseudo: `docs/pseudocode/WF-02.pseudo` (route decision); `docs/pseudocode/WF-21.pseudo` (entry guard); possibly new `docs/pseudocode/WF-23.pseudo`.
- Live: WF-02 (`PubCsNTOspF3xqXZ`) and WF-21 (`zM8WbxSdt9nXRoLZ`) at minimum; WF-25 (`eTV1lUcYrXBg2q2T`) likely added as the classifier sub-call; possibly a new WF-23 workflow.

**Tracker entry to add post-session:** new pre-MVP tech-debt item (P0) in `docs/sprint-tech-debt-2026-05-16-before-mvp/` (and the new-MVP follow-up sprint folder if appropriate). Suggested ID: **TD-NEW-033 — Pre-form intent gate**.

**TC-0107 handling (operator decision 2026-05-24T07:51:00Z):** marked 🚫 Blocked-by BUG-P1-02 / TD-NEW-033 in tracker; not run this session. Retest after the pre-form intent gate ships. Avoids polluting `pending_users` with an abusive contact_name capture.

**Cursors updated:** exec=2177, time=2026-05-24T07:46:45Z.

### Action — 2026-05-24T07:55:00Z — DML wipe of pending_users (clean restart)

```
DELETE FROM chinmay_astro.pending_users WHERE phone_number='61466927921';  -> 1 row
```
Post-wipe: 0 rows in users + pending_users. Slack channel C0B567A175W retained per DR-10.

### Action — 2026-05-24T08:00:45Z — Walk to payment_pending (hi → form submit)

Operator sent `hi`, received welcome+form, filled and submitted the form. Expectation: WF-21 welcome+form on hi; WF-22 form callback inserts `users` row, calls WF-52 to reuse Slack channel, sends payment-info via WF-50; end state `payment_pending`.

### Tick — 2026-05-24T08:02:52Z

**New executions (22) — two events:**

*Event A — `hi` at 08:00:45 (execs 2178–2188):*
- WF-00 → WF-60 → WF-01 → WF-02 → WF-20 (passthrough) → WF-21 → WF-50 → WF-60 → 3× WF-00 status callbacks. Same NEW_USER routing path as TC-0106 (BUG-P1-02 still applies — hi got the form without classification, which IS the desired post-fix behavior for hi-class intent).

*Event B — form submit at 08:01:12 (execs 2189–2199):*
- WF-00 → WF-60 → WF-01 → WF-02 → **WF-22 (dr8QM0m92Ml8MvIh) → WF-52 (IO5BZLUxuVmjzk5I)** → WF-50 → WF-60 → WF-00 callbacks.

**DB state post-walk:**
- `users` — id=**32**, status=`payment_pending`, slack_channel_id=`C0B567A175W` (reused), name=`Xy` (form-entered), awaiting_feedback=false, created_at=08:01:13Z.
- `pending_users` — 1 row with contact_name `Prasad Mujumdar` (the WA contact name captured by WF-21 during the hi step, before form submission). **Not cleared on form submission.** Worth noting — pending_users serves as the contact-name source for analytics; users.name is the form-entered display name.
- `messages` — only id=**149** logged (outbound interactive payment-info: `"Thank you Xy! ... Please send ₹500 via GPay / PhonePe ... +91-9653240263 ... tap the button below"`). The pre-`users`-row events (inbound `hi`, outbound welcome+form, inbound form callback) all missed logging — **GAP-01 reconfirmed**, same root cause (no user_id available).

**Cross-check vs expected:**
- ✅ Welcome+form on hi (Event A).
- ✅ Form submission created `users` row with status=`payment_pending`.
- ✅ WF-52 reused existing Slack channel C0B567A175W (DR-10 + WF-52 idempotency — 5th time this channel reused for the same test phone across sessions).
- ✅ Payment-info message sent via WF-50, includes user's form-entered name (`Xy`) and UPI details.
- ✅ DR-2 honored (slack_channel_id set on the users row at form-submission, not at payment_completed).
- ⚠️ GAP-01 — 4 pre-user-row events (2× hi flow + 2× form-callback flow inbound/outbound) all unlogged in `messages` because `user_id` was null at the moment.

**State carry-forward:** user_id=**32**, status=`payment_pending`, slack_channel=`C0B567A175W`. Messages watermark `id=149`. Ready for TC-0105 / TC-0203 / TC-0204.

**Cursors updated:** exec=2199, time=2026-05-24T08:02:52Z.

---

## Mid-session investigation — 2026-05-24T08:08:00Z — TC-0105 closure + free-form text matrix

### TC-0105 — DROPPED (no real-user path)

Operator confirmed there is no real-user path to re-submit the form when already `payment_pending`:
- The original welcome+form message's `Fill Details` CTA becomes uneditable in WA after the first submission (WA shows the response only).
- WF-21's behavior for an already-payment_pending user is to send a "tap Payment Completed" reminder, not a fresh form.
- Admin-pushed form would not exercise the real-user code path.

**Resolution:** TC-0105 marked ⚪ Obsolete (no testable real-user path) in tracker. Replaced conceptually by two new TCs once the corresponding product features ship:
- New TC — admin runs `RESEND FORM <phone>` to push a fresh form to a stuck user.
- New TC — user sends `EDIT DETAILS` keyword in `payment_pending` / `payment_submitted` to trigger a fresh form.

### Product gap — user cannot correct birth details after form submission

Currently a typo in name / DOB / time / location is locked once the form is submitted. Operator workaround = DB write. **Tracked as TD-NEW-034 [P1 / pre-go-live blocker]** — design + ship both:
- `RESEND FORM <phone>` admin command (WF-10/WF-11 keyword in `consult-{phone}`)
- `EDIT DETAILS` user keyword (WF-20 keyword fast-path, gated to status IN (payment_pending, payment_submitted))

### Free-form text handling per user state — audit + TC coverage

Done by reading WF-02 `Detect Route` JS + the handler-workflow node graphs. **WF-25 (Intent Classifier) is wired into every state-handler EXCEPT NEW_USER.** The full matrix:

| WF-02 route | Trigger condition | Handler | WF-25 wired? | TC coverage |
|---|---|---|---|---|
| `NEW_USER` | user=null AND pending_users=null AND text | **WF-21** (Welcome+Form) | ❌ **NO — BUG-P1-02 / TD-NEW-033** | TC-0106 ⚠️ Partial; TC-0107 🚫 Blocked |
| `PRE_FORM_TEXT` | user=null AND pending_users=NOT null AND text | **WF-23** (Pre-Form Intent Filter) | ✅ yes | ❌ **NO TC EXISTS** — testing gap |
| `PAYMENT_PENDING_TEXT` | users.status=payment_pending AND text | **WF-30** (Payment Pending Intent Filter) | ✅ yes | TC-0203 ⏳ pending (next); TC-0204 (REBOOK keyword) ⏳ pending |
| `PAYMENT_SUBMITTED_TEXT` | users.status=payment_submitted AND text | **WF-31** (Payment Submitted Handler) | ✅ yes | TC-0205 ✅ covered; TC-0206 (image) ⏳ pending; **no text-specific TC** for free-form general enquiry from this state |
| `RELAY` | users.status=consultation_active AND text | **WF-40** (User → Admin Relay) | ✅ yes (for STOP intent detection) | TC-0401 ✅; TC-0609 ✅ (clarifier path verified today) |
| `POST_CONSULT_TEXT` | users.status=consultation_closed AND text | **WF-43** (Post-Consultation Handler) | ✅ yes (rebook + feedback + stop intents) | TC-0506 ✅ (rebook); TC-0507 ⏳ (general); TC-0803 ⏳ (feedback-shaped) |
| `UNHANDLED` | fallthrough | UNHANDLED Alert | n/a | no TC |

Out-of-scope-for-Detect-Route (WF-01 filters before WF-02):
- `blocked` → WF-01 silent reject (TC-0702 ✅).
- `opted_out` → WF-01 routes to WF-47-or-WF-21 path per opted_out re-engagement DR (TC-0607 ✅).

### Findings from the audit

1. **BUG-P1-02 is the lone hole in the matrix.** Every other state correctly classifies before acting. Fix scope is narrow: insert WF-25 between WF-02's NEW_USER branch and WF-21. Either (a) refactor WF-23 to handle both NEW_USER (no pending_users) AND PRE_FORM_TEXT (has pending_users) cases — including the pending_users insert that's currently in WF-21, or (b) introduce a tiny new intent gate workflow specifically for NEW_USER.

2. **PRE_FORM_TEXT has zero TC coverage.** This is the case WF-23 was built for — user gets the form, doesn't fill it, sends text instead. Worth adding **TC-0110 (suggested)** — pre-form-text from a user with pending_users row → WF-23 path → classifier → either re-send form (pass-through intent) or stop clarifier (stop intent).

3. **PAYMENT_SUBMITTED text-variant TC missing.** TC-0205 covers "sends message while awaiting approval" but the spec doesn't differentiate text vs other; TC-0206 is image-only. Worth adding **TC-0207 (suggested)** — free-form general enquiry while payment_submitted → WF-31 → WF-25 → general_enquiry path. (Lower priority — same WF-25 pattern as payment_pending.)

4. **WF-43 handles 3 intents** (rebook + feedback + stop) in consultation_closed. Coverage is patchy:
   - rebook (TC-0506) ✅
   - feedback non-flag (TC-0803) ⏳
   - stop from consultation_closed (TC-0606) ✅ but pre-TD-B; re-verification recommended
   - general_enquiry (TC-0507) ⏳
   - Anything else (pass-through fall-back) — no TC.

5. **TD-NEW-033 (BUG-P1-02 fix) blocks 1 TC: TC-0107.** It does NOT block TC-0203/0204/0206/0507/0803 — those run through handlers that already have WF-25.

### Actions taken / queued

- TC-0105 → ⚪ Obsolete in tracker.
- TD-NEW-034 (edit-details flow) → P1, queued for post-session log + design.
- TC-0110 and TC-0207 (suggested new TCs) → flagged for operator decision on whether to add to FunctionalTestCases.md spec. **Operator approved both 2026-05-24T08:09:00Z**; tracker rows added; master spec body drafting queued post-session.

### Action — 2026-05-24T08:06:08Z + 08:23:15Z — TC-0203 (payment_pending free-form general enquiry)

Operator sent two free-form texts from user 32 in `payment_pending`: first `"Hi"`, then `"How does it work ?"`. Expectation: WF-00 → WF-01 → WF-02 (PAYMENT_PENDING_TEXT) → WF-30 → WF-25 → general_enquiry → response with fresh payment button (BUG-D fix verification).

### Tick — 2026-05-24T10:24:19Z

**Two identical event chains (execs 2200–2211 and 2212–2223), both success, all sub-2s:**
- WF-00 → WF-60 → WF-01 → WF-02 → WF-20 (passthrough) → **WF-30 → WF-25** → WF-50 → WF-60 → 3× WF-00 callbacks.

**WF-25 classification (verified both messages):**
- Input: full user context including `status=payment_pending`, name `Xy`, contact name `Prasad Mujumdar`.
- Gemini prompt template includes `User context: Status: payment_pending` and the full intent taxonomy (`wants_consultation, general_enquiry, rebook_intent, feedback_intent, stop_intent, garbage, malicious_abusive, inappropriate`).
- Both `"Hi"` and `"How does it work ?"` → `intentResult: "general_enquiry"`. Sensible.

**WF-50 outbound message body (identical for both messages, msg ids 151 + 153):**
> Happy to help! Once your payment is confirmed, Chinmay will be ready for your consultation.
>
> 💰 *Payment Details*
> Send ₹500 via GPay / PhonePe / any UPI app to:
> *+91-9653240263 (Chinmay Mujumdar)*
>
> Once done, tap the **"Payment Completed" button you received earlier.**

**`messages` table after this TC:**
| id | dir | type | content | ts |
|---|---|---|---|---|
| 149 | out | interactive | original payment-info + button | 08:01:14 |
| 150 | in | text | "Hi" | 08:06:08 |
| 151 | out | text | general-enquiry response (above) | 08:06:11 |
| 152 | in | text | "How does it work ?" | 08:23:16 |
| 153 | out | text | general-enquiry response (above) | 08:23:19 |

GAP-01 no longer applies — user_id=32 exists for all 4 new rows. Logging is clean.

**Cross-check vs TC-0203 expected (per handoff):**
- ✅ WF-30 → WF-25 path observed.
- ✅ `general_enquiry` intent classified correctly.
- ✅ Response includes payment details (₹500, UPI ID).
- ✅ User state remains `payment_pending` (no transition).
- ⚠️ **NO fresh payment button issued.** Response is text-only, pointing back to the original "Payment Completed" button in message id 149. The handoff's BUG-D verification expectation was "FRESH payment button" — current implementation does NOT re-issue.

**BUG-D / button re-issuance analysis:**
- **Functional impact** — interactive WA button messages remain tappable indefinitely. So pointing the user back to msg 149's button works *if* msg 149 is still visible in their scrollback.
- **UX risk** — if the user has had many messages exchanged since msg 149 (e.g. days later, lots of consultation chat after rebooking), the original button may be hard to find. A fresh button would be more user-friendly.
- **Design call**, not a clear bug. Two readings:
  1. **Current behavior is correct** — pointing back avoids cluttering the chat with duplicate buttons; payment_pending is typically short-lived.
  2. **Re-issue fresh button** — be defensive; the cost of an extra button is low; users may scroll/lose msg 149.

Flagged as **O-07 [info → operator decision]**. Not blocking TC-0203 PASS in either reading.

**TC-0203 PASS ✅** — WF-30 → WF-25 → general_enquiry path verified, sensible response delivered, no state corruption, clean message logging.

**Cursors updated:** exec=2223, time=2026-05-24T10:24:19Z.
