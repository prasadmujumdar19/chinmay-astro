# Smoke Test — Post-P0-Review, TC-04xx Resume

**Type:** smoke
**Slug:** post-p0-review-tc04xx
**Date:** 2026-05-18
**Operator:** prasadmujumdar
**Continuation of:** `docs/artefacts/tests/smoke-post-p0-review-2026-05-17/` (fresh folder per skill rule; prior session paused after TC-0303)

## Design / expected-behavior references

- `docs/artefacts/tests/smoke-post-p0-review-2026-05-17/handoff-resume-tc-04xx-2026-05-18.md` — TC-04xx flow, pre-resume state
- `CLAUDE.md` — design rules, state machine, workflow architecture
- `docs/workflow-registry.md` — workflow IDs and current status

## Watch surface

| Surface | Scope |
|---|---|
| n8n executions | All active workflows (focus: WF-00/01/02/40/51 for user→admin; WF-10/12/50 for admin→user; WF-42/43/44 for close + feedback) |
| Postgres tables | `chinmay_astro.users`, `consultations`, `messages`, `admin_actions`, `payments` |
| Slack channels | `consult-61466927921` (C0B567A175W), `chinmay-admin-commands` (C0A5B0ZE81E) |
| Latency threshold | 5000 ms |

## Baselines

| Cursor | Value |
|---|---|
| n8n exec-cursor | `1214` |
| time-cursor (UTC) | `2026-05-18T03:07:10Z` |
| `users` | 1 row, max updated_at = 2026-05-17 21:35:38 IST |
| `consultations` | 1 row (id=9, active), started 2026-05-17 21:35:37 |
| `messages` | **0 rows** — WF-60 logger known broken (P1, see prior session's `followups-wf60-logger-broken.md`); do NOT treat empty messages table as a TC-04xx bug |
| `admin_actions` | 0 rows |
| `payments` | 1 row, last updated 2026-05-17 19:57:58 |

### Live user state (pre-test)

```
users.id=28 phone=61466927921 name=Abcs
  status=consultation_active
  slack_channel_id=C0B567A175W
  current_consultation_id=9
```

Matches handoff exactly. Smoke test safe to resume.

## Carried-forward caveats

1. **WF-60 broken** — messages table will stay at 0 during this run; not a TC-04xx failure.
2. **WF-25 intent classifier** — intermittent Gemini errors; defaults to `general_enquiry`. May surface during free-form text TCs.
3. Slack cursor per channel: bump on first tick (will use channel current ts at first observation).

## Planned test sequence

1. **TC-0401** — user→admin relay (send "hi" from 61466927921) → expect WF-00→01→02→40→51 → message lands in C0B567A175W
2. **TC-0402** — admin→user relay (operator posts in consult channel) → expect WF-10→12→50 → message arrives on phone
3. **TC-0403** — `CLOSE CONSULT 61466927921` in consult channel → expect WF-10→11→42 → status=consultation_closed, ended_at set, feedback prompt to user, ack in Slack
4. **TC-0404** — feedback reply from user → expect WF-43→44 → ack + log
5. Later: TC-05xx REBOOK, TC-06xx STOP/HELP, TC-07xx BLOCK/UNBLOCK, TC-08xx PG rejection

---

## Actions / Ticks / Observations / Issues

### Action — 2026-05-18T03:09Z — TC-0401 user→admin relay
User sent "hi" from 61466927921. Expected: WF-00→01→02→40→51, message lands in C0B567A175W.

### Tick — 2026-05-18T03:10Z
**Trigger:** user said "check" after TC-0401 send.
**New executions:** 8 (8 ok, 0 failed, 0 slow)
- 1215 WF-00 Webhook Receiver — success — webhook entry
- 1216 WF-60 Message Logger — success (but see caveat: status=success doesn't prove INSERT landed; messages table delta below confirms still 0)
- 1217 WF-01 Message Router — success
- 1218 WF-02 User State Router — success
- 1219 WF-20 Keyword Handler — success (no keyword match, passthrough)
- 1220 WF-40 User→Admin Relay — success
- 1221 WF-51 Send Slack Message — success
- 1222 WF-10 Slack Admin Handler — success (fired on bot's own Slack post — expected, bot-loop guard should suppress further action)

All 8 executions completed within a 700 ms window (03:09:14.935 → 03:09:17.091). No latency flags.

**DB deltas:**
- `users`: 0 rows changed (expected — relay doesn't mutate user state)
- `messages`: 0 rows changed (expected per WF-60 caveat)
- `consultations` / `admin_actions` / `payments`: unchanged

**Slack (`consult-61466927921` C0B567A175W):**
- 1 new bot message ts=1779073755.531099 (03:09:15 UTC) — "📲 *Abcs:* Hi" — posted by WF-51

**Cross-check vs expected:**
- ✅ WF-00→01→02→40 fired in order
- ✅ WF-51 posted to consult Slack channel with correct user attribution ("Abcs:") and content ("Hi")
- ✅ Bot-loop guard held (WF-10 fired on its own post but no downstream cascade)
- ✅ User state unchanged (still consultation_active)
- ⚠️ WF-60 execution succeeded but messages table remains 0 — consistent with carried-forward P1 caveat, not a TC-0401 regression

**Verdict:** TC-0401 PASS.

### Action — 2026-05-18T03:12Z — TC-0402 admin→user relay
Operator (U0A4175DJ5D) posted "Hi back" in `consult-61466927921` at 03:12:57 UTC. Expected: Slack event → WF-10 → admin→user relay workflow → WF-50 → message arrives on phone 61466927921.

### Tick — 2026-05-18T03:13Z
**Trigger:** user said "check" after TC-0402 Slack post.
**New executions:** 7 (7 ok, 0 failed, 0 slow)
- 1223 WF-10 Slack Admin Handler — success — webhook entry from Slack event
- 1224 **WF-41 Admin→User Relay** — success (handoff said "WF-12" — see observation below)
- 1225 WF-50 Send WhatsApp — success
- 1226 WF-60 Message Logger — success (table still 0; carried caveat)
- 1227/1228/1229 WF-00 Webhook Receiver — success ×3 (Meta delivery/read status callbacks for the outbound WhatsApp)

End-to-end relay window: 03:12:59.109 → 03:13:00.878 = **1.77 s**. No latency flags.

**DB deltas:** `users` 0, `messages` 0, `consultations`/`admin_actions`/`payments` unchanged.

**Slack (`consult-61466927921`):**
- 1 new operator message ts=1779073977.254699 — "Hi back" by U0A4175DJ5D (the trigger; no bot reply expected — admin→user relays do not ack in-channel)

**Observation:** Handoff referenced `WF-12` for admin→user relay. Live workflow is `WF-41 Admin→User Relay` (id `6PzJRZsF7k2d9hV7`). Documentation drift, not a bug. Worth a registry check.

**Cross-check vs expected:**
- ✅ WF-10 fired on Slack event (operator post, not bot — bot-loop guard correctly let it through)
- ✅ Admin→user relay workflow (WF-41, not WF-12 per handoff) fired
- ✅ WF-50 sent WhatsApp
- ✅ Meta acknowledged delivery (3 follow-up WF-00 hits for delivery status)
- ⏳ Awaiting operator confirmation that "Hi back" actually arrived on the test phone

**Pending verification:** confirm message receipt on WhatsApp before declaring PASS.

### Observation — 2026-05-18T03:15Z — confirmation + WF-12 vs WF-41 deep-dive
Operator confirmed: "Hi back" arrived on test phone. **TC-0402 PASS.**

Investigated the WF-12 vs WF-41 inconsistency surfaced in the prior tick. Findings written to `followups-wf12-orphaned-and-doc-inconsistency.md`. Summary:
- WF-41 (id `6PzJRZsF7k2d9hV7`) is the canonical admin→user relay — WF-10 calls it (`pseudocode/WF-10.md:42`).
- WF-12 (id `RjwHs9Dx5cK8Q5wD`) is **active in n8n but orphaned** — no caller, thinner path (skips `consultation_active` check).
- Doc surfaces disagree: registry says active+used, CONTEXT.md still points to WF-12 as the relay, STATUS.md says "Not Built" (false), pseudocode/INDEX.md correctly flags WF-12 as legacy.
- Recommended: deactivate WF-12, reconcile docs in one sweep, add an orphaned-workflow guardrail to `technical-workflow-review`. Filed for next cleanup sprint — not fixing here.

### Issues found
- `[major]` — **WF-12 orphaned active workflow + 4-way doc inconsistency.** See `followups-wf12-orphaned-and-doc-inconsistency.md`. No runtime impact today, but a silent risk if a future workflow ever points at WF-12 (bypasses status check). Recommended action: deactivate + reconcile.

### Action — 2026-05-18T03:19Z — TC-0402b extra exchange + TC-0403 close
Operator narration (one combined check):
1. User sent WhatsApp message with emoji → landed in Slack ✅
2. Operator replied in Slack: `Back to you, ready to close` → **only "Back to you" arrived on WhatsApp** ❌ (comma + rest dropped)
3. Operator typed `CLOSE CONSULT 61466927921` → WhatsApp received closure message with 2 buttons ✅

### Tick — 2026-05-18T03:21Z
**Trigger:** combined check after three actions.
**New executions:** 26 (26 ok, 0 failed, 0 slow). Grouped into three subflows below.

**TC-0402b.1 (user→admin, emoji) — 1230–1237**
- 1230 WF-00 → 1231 WF-60 → 1232 WF-01 → 1233 WF-02 → 1234 WF-20 → 1235 WF-40 → 1236 WF-51 (Slack post) → 1237 WF-10 (bot loop, suppressed)
- All success, ~370 ms end-to-end. Emoji preserved. **PASS** ✅

**TC-0402b.2 (admin→user, "Back to you, ready to close") — 1238–1244**
- 1238 WF-10 (Slack event) → 1239 WF-41 → 1240 WF-50 → 1241 WF-60 → 1242–1244 WF-00 (Meta delivery callbacks)
- All executions success, but **payload corrupted in-flight**. See bug below. **FAIL** ❌

**TC-0403 (CLOSE CONSULT) — 1245–1255**
- 1245 WF-10 (Slack event) → 1246 WF-11 Command Parser → 1247 WF-42 Consultation Closer → 1248 WF-50 (feedback prompt to user) → 1249 WF-60 → 1250 WF-51 (Slack ack) → 1251–1253 WF-00 (Meta callbacks) → 1254/1255 WF-10 (bot loop on ack, suppressed)
- Identified two previously-unknown workflow IDs: `fx70vqyJtRdF2DgR = WF-42 Consultation Closer`, `GoTYo0GS2y8qjjkw = WF-11 Command Parser`.

**DB deltas (Postgres):**
- `users.id=28`: `status` `consultation_active` → `consultation_closed`, `current_consultation_id` `9` → `null`, `updated_at` = 2026-05-18T03:20:36Z ✅
- `consultations.id=9`: `status` `active` → `closed`, `ended_at` = 2026-05-17T22:50:36Z ✅
- `users.awaiting_feedback` is `false` and `stage` is `null` — flagging because the feedback prompt was just sent; would expect a flag indicating the next inbound is a feedback response. May or may not matter depending on how TC-0404 routing works (could be button-payload-driven, not state-driven). Investigate at TC-0404.

**Slack:** ack message and ops trail visible in consult channel (not re-fetched; observed via the bot-loop WF-10 executions firing on the bot's own ack post).

**Cross-check vs expected:**
- ✅ TC-0402b.1 user→admin relay (emoji-safe)
- ❌ TC-0402b.2 admin→user relay — text truncated at first comma. **Critical bug, root cause identified.**
- ✅ TC-0403 close consult — state transitions + feedback prompt delivered

### Issues found
- `[critical]` — **WF-10 truncates admin→user relay messages at the first comma.** Root cause: `Load User Status` Postgres node uses `options.queryReplacement` as a comma-separated expression list; when the messageText expression evaluates to a value containing a comma, n8n splits on that comma too, producing extra tokens and silently dropping the tail. See `followups-wf10-postgres-comma-truncation.md` — full diagnosis, fix options (recommend switching to per-parameter `Query Parameters`), blast-radius sweep plan, and verification steps. **Pre-go-live blocker.**
- `[minor]` — **`awaiting_feedback` not set on close.** After WF-42 sent the feedback prompt, `users.awaiting_feedback` is still `false`. May be intentional (button-payload routing) or may break free-text feedback. Defer judgment to TC-0404.

### Action — 2026-05-18T03:32Z — TC-0404 feedback
Operator narration: tapped first feedback button → got a response. Then sent free-text "Amazing service" → no reply received.

### Tick — 2026-05-18T03:33Z
**Trigger:** "check" after two-step feedback test.
**New executions:** 17 — split into two flows.

**TC-0404a (button tap) — 1256–1265, ~03:32:17 UTC**
- WF-00 → WF-60 → WF-01 → WF-02 → **WF-43 Post-Consultation Handler** (id `3va0M06kijgyLejf`, newly identified) → WF-50 (response back to user) → WF-60 → 3× WF-00 (Meta callbacks)
- All success. ~3.2 s end-to-end. Button-payload path works. **PASS** ✅

**TC-0404b (free-text "Amazing service") — 1266–1272, ~03:32:29 UTC**
- WF-00 (error) ← WF-01 (error) ← WF-02 (error) ← WF-43 (error) ← Gemini General Response HTTP node throws `"JSON parameter needs to be valid JSON"`
- WF-60, WF-20, WF-25 ran to success in parallel — failure is on the Gemini routing branch only.
- **FAIL** ❌. Three cascading bugs identified.

**DB deltas:**
- `users.id=28`: unchanged since 03:20:36 — `feedback` still `null`. Free-text feedback was NOT persisted.
- `consultations.id=9`: unchanged.

**Cross-check vs expected:**
- ✅ Button-payload path delivers ack
- ❌ Free-text path silently fails: user gets nothing, DB captures nothing, error is internal-only

### Issues found
- `[critical]` — **WF-43 Gemini General Response HTTP node throws on multi-line prompts** — `jsonBody` is a raw-string template with `{{ $json.geminiPrompt }}` injected inside a JSON string literal; unescaped `\n` from the prompt makes the body invalid JSON. Breaks for ANY structured prompt (newlines/quotes/backslashes). Fix: interpolate an object via `={{ {...} }}` so n8n JSON-encodes correctly. See `followups-wf43-feedback-chain.md`.
- `[critical]` — **WF-43 `Prepare Gemini Response Prompt` resolves user input as `undefined`** — geminiPrompt literally contains `User: undefined`. Wrong variable reference in the prompt template. Even with the JSON bug fixed, Gemini would never see what the user said. Same followup.
- `[major]` — **WF-25 returned `intent: null` for "Amazing service"** — proximate trigger; if intent were correctly `feedback`, the proper feedback-saving path would have fired and the two Gemini bugs would never have surfaced. Matches carried-forward caveat #2 (`followups-wf25-intent-classifier.md` from prior session). Worth its own sprint.
- `[minor]` resolved → confirmed: `awaiting_feedback` is button-payload-driven by design (interpretation 1 in followup); free-text feedback routing relies entirely on WF-25 intent classification. This re-prioritises WF-25 reliability from P3 nuisance to feedback-path blocker.

### Action — 2026-05-18T03:37Z — TC-0501 (book again button) + TC-0801 (payment completed button)
Operator narration:
1. Tapped "Book again" button (from feedback flow) → received payment instructions message with a "Payment Completed" button. ✅
2. Tapped "Payment Completed" → admin Slack received approve-payment request. ✅

### Tick — 2026-05-18T03:39Z
**Trigger:** "check" after combined rebook + payment-completed flow.
**New executions:** 23 (23 ok, 0 failed, 0 slow).

**TC-0501 (REBOOK) — 1273–1283, ~03:37:38 UTC**
- WF-00 → WF-60 → WF-01 → WF-02 → WF-43 Post-Consultation Handler → **WF-45 Rebook Handler** (id `MUG7rPgSHc7UtAE9`, newly identified) → WF-50 (payment instructions with button) → WF-60 → 3× WF-00 (Meta callbacks)
- All success. ~700 ms end-to-end. **PASS** ✅

**TC-0801 (Payment Completed button) — 1284–1295, ~03:38:21 UTC**
- WF-00 → WF-60 → WF-01 → WF-02 → **WF-32 Payment Confirmation Receiver** (id `emUOLWVZiNVxcOe3`, newly identified) → WF-50 (ack to user) → WF-60 → WF-51 (post to admin Slack) → WF-10 (bot loop suppressed) → 3× WF-00 (Meta callbacks)
- All success. ~1.2 s end-to-end. **PASS** ✅

**DB deltas:**
- `users.id=28.status`: `consultation_closed` → `payment_submitted` (transit through `payment_pending` between the two button taps was correct; not observed as a separate row because the second tap updated within the same second)
- `users.current_consultation_id`: still `null` (consultation will be created on admin APPROVE)
- New `payments.id=11`: `status=pending_verification`, `amount=500.00`, `created_at=2026-05-17T23:08:21Z` IST = 2026-05-18T03:38:21Z UTC ✅

**Cross-check vs expected:**
- ✅ REBOOK button drives user back to payment_pending and presents payment template
- ✅ Payment Completed button promotes to payment_submitted and notifies admin
- ✅ Two more workflow IDs mapped (WF-45, WF-32)

**Verdict:** TC-0501 + TC-0801 PASS. Smoke test session ending here per operator request.

### End-of-session state carry-forward
- `users.id=28` left in `payment_submitted` with `payments.id=11` pending verification.
- Admin Slack consult channel `C0B567A175W` has an outstanding approve-payment notification.
- To resume a future test: either admin APPROVE PAYMENT 61466927921 in the consult channel (exercises WF-33 path), OR wipe per CLAUDE.md "Clean-slate wipe for one test phone" SQL block.

---

## Post-sprint static verification — 2026-05-18T15:32Z

Resumed after `smoke-post-p0-review-tc04xx-2026-05-18` sprint (commits 2a33905, 3451197, 4bf62f2) and `timestamp-convention` sprint (commits d11c3ae, 04ec7a6, eb54dae, 464fa6b, c128b1e). Static check of each fix against live n8n + Postgres.

| # | Item | Pre-state (this report) | Post-state (verified live) | Verdict |
|---|---|---|---|---|
| BUG-01 | WF-10 `Load User Status` Postgres `queryReplacement` | comma-separated string `={{ $json.channelId }}, {{ ... }}, {{ $json.messageText }}` — splitter ate commas in values | array expression `={{ [$json.channelId, $('Find Channel').item.json.name, $json.messageText] }}` — values atomic, no string splitting | ✅ Fixed |
| BUG-02 | WF-43 `Gemini General Response` `jsonBody` | raw-string template embedding `{{ $json.geminiPrompt }}` inside a JSON string literal — broke on `\n`/`"`/`\` | object-interpolation `={{ {contents:[{parts:[{text:$json.geminiPrompt}]}],generationConfig:{...}} }}` — n8n serialises via JSON.stringify, escapes correctly | ✅ Fixed |
| BUG-03 | WF-43 `Prepare Gemini Response Prompt` | wrote `User: undefined` — wrong variable reference | template literal `User: ${d.messageContent}` — reads correct field | ✅ Fixed |
| BUG-04 | WF-25 reliability | symptom: `intent: null` from Gemini; deeper root cause discovered during sprint: HTTP 400 from Gemini due to credential `Gemini API Key (Query Auth)` having its query-param NAME set to literal `"Gemini n8n Key"` instead of `key`; also `userStatus` not flowing into prompt | (A) Classify Intent + WF-43 Gemini auth switched from `httpQueryAuth` cred `ZkLShpFmp8Mi1gZl` to predefined `googlePalmApi` cred `zT7defyXYEvxWwZm` (auth class removed entirely). (B) Prepare Intent Request reads `userStatus` from `input.userStatus \|\| input.user?.status \|\| 'unknown'`. (C) Handle Gemini Error now returns `intent='feedback_intent'` when `userStatus==='consultation_closed'`, else `general_enquiry` — defensive fallback for Gemini outages. | ✅ Fixed (scope grew with explicit approval) |
| BUG-05 | WF-12 orphaned active workflow + 4-way doc inconsistency | `active=true`, zero callers in graph | `active=false` (confirmed live); sweep across all 28 workflows shows zero `executeWorkflow` references to `RjwHs9Dx5cK8Q5wD` (only self-reference inside WF-12's own JSON, which is the same workflow ID appearing in its own export, not a real caller) | ✅ Fixed |
| TZ-NEW | Timezone convention (out of original scope, surfaced + fixed during follow-up sprint) | Postgres columns were `timestamp without time zone`; n8n container TZ presumably IST; mixed-TZ confusion in execution timestamps vs IST-displayed times | All 13 `chinmay_astro.*` timestamp columns are now `timestamp with time zone` (timestamptz). n8n container `n8n-prod` reports `TZ=UTC` and `date -u` = `date`. Postgres session `SHOW TIMEZONE` = `UTC`. New CLAUDE.md section "Timestamp Convention — Strict UTC Everywhere" codifies the rule; spec at `docs/artefacts/specs/2026-05-18-timestamp-convention-design.md`. | ✅ Fixed |

### Items intentionally NOT re-tested (per sprint state)

- Re-test BUG-02/03/04 end-to-end via WhatsApp — sprint state notes user excluded this with "ignore the verifications".
- Optional TC-0303 admin APPROVE PAYMENT regression against carry-forward payment id=11 — same exclusion.
- WF-11 STATS `DATE(col)=CURRENT_DATE` UTC-session vs IST-admin day-boundary issue — explicitly accepted as won't-fix per project decision (memory `project_wf11_stats_day_boundary_accepted`). Not re-flagging.

### Followups still open from the BUG-04 investigation

- **Gemini 503 transient capacity errors** on `gemini-2.5-flash-lite` — tracked as TD-NEW-016 in CLAUDE.md. Existing `retryOnFail=true` on the HTTP node mitigates. Worth monitoring; possible fallback to `gemini-2.0-flash-lite` if 503 rate climbs.
- **WF-23 / WF-30 / WF-44** call WF-25 in `defineBelow` mode with `userStatus: {{ $json.userStatus }}` which resolves to undefined in their upstream context — prompt renders `Status: unknown`. Not BUG-04 scope (their downstream routing doesn't depend on consultation_closed branch), but a separate input-contract followup worth its own sprint item.

### Sprint-discovered scope items NOT separately re-verified here

- Plugin improvements PLUGIN-01 (HTTP JSON-string interpolation check) and PLUGIN-02 (Postgres queryReplacement comma check) — whether these landed in the plugin should be verified via the plugin's own changelog rather than this smoke-test artefact.

### Verdict

**All 5 smoke-test bugs + the surfaced timezone work are fixed in live n8n and live Postgres.** This round of testing closes here.







