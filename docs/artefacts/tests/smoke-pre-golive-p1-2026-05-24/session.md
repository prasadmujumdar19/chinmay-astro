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
