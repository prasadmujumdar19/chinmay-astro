# Smoke test — pre-go-live (resume) — 2026-05-19

**Test type:** smoke
**Slug:** pre-golive-resume
**Operator:** prasadmujumdar
**Latency threshold:** 5000 ms
**Continues from:** `docs/artefacts/tests/smoke-post-p0-review-tc04xx-2026-05-18/` (last session: 8 scenarios run, 5 bugs found + all fixed)

## Design / expected-behavior references

No `FunctionalTestCases.md` file exists in repo. Reference docs loaded:
- `CLAUDE.md` — design rules (DR-1…DR-10, DR-13), state machine, admin commands, schema
- `docs/workflow-registry.md` — WF-33 row already loaded via UserPromptSubmit hook (state guard added TD-021 May 2026)
- Prior session `tldr.md` — TC-0303 (admin APPROVE PAYMENT, second-time consultation create path) was explicitly deferred and is the entry point for this session

Operator will narrate expected behavior inline before each test action.

## Watch surface

- **n8n executions:** all active workflows (default)
- **Postgres tables:** `users`, `payments`, `consultations`, `messages`, `admin_actions`, `pending_users`
- **Slack channels:** `C0B567A175W` (consult-61466927921 — only channel in scope for this session unless test broadens)

## Baselines (captured 2026-05-19T10:08:35Z)

| Surface | Cursor |
|---|---|
| n8n executions | last id = `1310` |
| time cursor (DB/Slack) | `2026-05-19T10:08:35Z` |
| Slack `C0B567A175W` last ts | `1779106605.654719` |

### Postgres baseline counts

| Table | Rows | Last activity | Max id |
|---|---|---|---|
| `users` | 1 | 2026-05-18T03:38:21.971Z | 28 |
| `payments` | 2 | 2026-05-18T03:38:21.956Z | 11 |
| `consultations` | 1 | 2026-05-17T16:05:37.997Z | 9 |
| `messages` | 0 | — | — |
| `admin_actions` | 0 | — | — |
| `pending_users` | 2 | 2026-05-17T12:05:57.759Z | n/a |

> `messages` and `admin_actions` are 0 — both were truncated during the 2026-05-18 timestamptz migration. Any new rows in these tables this session are unambiguously caused by the test actions below.

## Carry-forward state (verified live 2026-05-19T10:08Z)

| Field | Value |
|---|---|
| Test user | id=28, phone `61466927921`, name "Abcs" |
| User status | `payment_submitted` |
| Slack channel | `C0B567A175W` (consult-61466927921, already exists from sprint 1) |
| Latest payment | id=11, ₹500, `pending_verification`, payment_method=gpay |
| Outstanding Slack notification | "🔔 New Payment Submission … `APPROVE PAYMENT 61466927921`" in C0B567A175W (ts 1779075502.970889) |
| Last user message (free-text) | "Amazing service" (Slack relay at ts 1779106605.654719 — from TC-0404b in prior session) |

## Session log

### Action — 2026-05-19T10:10:00Z
**TC-0303 — Admin APPROVE PAYMENT (WF-33 second-time consultation create path)**
Operator typed `APPROVE PAYMENT 61466927921` in `consult-61466927921` (C0B567A175W).

Expected:
- WF-10 → WF-11 → WF-33 fire (state guard passes — user in `payment_submitted`)
- `payments.id=11` → `verified` / `verified_at` / `verified_by` set
- `users.id=28` → `consultation_active`
- `slack_channel_id` unchanged (WF-52 NOT called — channel already exists)
- WhatsApp confirmation sent via WF-50 (logged in `messages` via WF-60)
- "✅ Payment approved" posted to consult channel via WF-51
- `admin_actions` audit row inserted

### Tick — 2026-05-19T10:13:00Z
**Trigger:** user said "check" after admin APPROVE in consult-61466927921

**New executions (10):** all `success`, durations < 3s, no slow flags
- 1311 WF-10 Slack Admin Handler (webhook, 4.0s)
- 1312 WF-11 Command Parser (integrated, 2.8s)
- 1313 WF-33 Payment Approval Processor (integrated, 2.7s)
- 1314 WF-50 Send WhatsApp (integrated, 1.8s)
- 1315 WF-60 Message Logger (integrated, **0.1s** — suspiciously short for an insert)
- 1316 WF-51 Send Slack Message (integrated, 0.5s)
- 1317–1320 WF-10 + JQu1MkK5vgtUCeNO (webhooks, all <50ms) — loop-prevention dropping bot's own posts

**DB deltas (since 2026-05-19T10:08:35Z):**
- `users.id=28`: `payment_submitted` → `consultation_active`, updated_at 2026-05-19T10:10:26.933Z, `slack_channel_id` unchanged (C0B567A175W) ✅
- `payments.id=11`: `pending_verification` → `approved`, `verified_at=2026-05-19T10:10:26.848Z`, `verified_by=C0B567A175W` ✅
- `consultations`: +1 row, id=10, user_id=28, status=`active`, created 2026-05-19T10:10:26.909Z ✅
- `messages`: **0 new rows** ❌
- `admin_actions`: **0 new rows** ❌
- `pending_users`: no change

**Slack (C0B567A175W):**
- 1779185423.727 — operator: `APPROVE PAYMENT 61466927921`
- 1779185429.249 — bot: "✅ Payment approved for Abcs (61466927921). User notified via WhatsApp; consultation is now active."

**Cross-check vs expected:**
- ✅ WF-33 fired with state guard passing
- ✅ payments.id=11 → approved (note: status is `approved`, not `verified` as registry implies — see below)
- ✅ users.id=28 → consultation_active
- ✅ slack_channel_id unchanged → second-time path confirmed (WF-52 NOT called — no channel-create exec observed)
- ✅ WhatsApp confirmation sent (WF-50 ran to completion, 1.8s)
- ✅ Admin confirmation posted to consult channel via WF-51
- ❌ `messages` row missing — WF-60 ran but exited in 101ms; table still globally empty
- ❌ `admin_actions` row missing — WF-33 didn't write an audit entry; table still globally empty

**Issues found:**

`[major]` BUG-NEW-01 — `chinmay_astro.messages` not being written. WF-60 Message Logger executed successfully (id=1315) in only 101ms, which is too short for a Postgres insert. Table has been empty across the entire prior session as well (baseline rows=0 despite 10+ WhatsApp messages exchanged), so this is not new to TC-0303 — it surfaced earlier but was masked by the timestamptz migration that truncated the table on 2026-05-18. Needs WF-60 execution-data inspection.

`[major]` BUG-NEW-02 — `chinmay_astro.admin_actions` not being written. WF-33 executed cleanly but no audit row was inserted. Table has been empty across all prior sessions as well. Either the audit-log node is absent in WF-33 or the insert is failing silently. CLAUDE.md explicitly lists `admin_actions` as the audit log with `ON DELETE NO ACTION`, so functionality is expected.

**Status carry-forward:** user id=28 now in `consultation_active` on channel C0B567A175W. Ready for next test step (e.g. user message → admin relay, or close + rebook loop).

### Action — 2026-05-19T10:18–10:20Z
**TC-0401 / 0401b / 0401c — User → admin text relay (3 messages, mixed payloads)**
User sent 3 WhatsApp messages from `+61466927921`:
1. `"How does my future look like"` — plain text (TC-0401)
2. `"Is it bright and shiny 😀🙏😎"` — emoji (TC-0401b)
3. `"This is just to test special characters #1 $200"` — partial special chars (TC-0401c; lighter than the suggested quote/comma/apostrophe/backtick set)

Expected: each appears in `consult-61466927921` with `:calling: *Abcs:* <text>` via WF-51; user state unchanged; no Gemini / feedback path triggered.

### Tick — 2026-05-19T10:20:00Z
**Trigger:** user said "check" after 3 inbound WhatsApp messages

**New executions (24):** all `success`, no errors, no slow flags. Each inbound message ran an identical 7-workflow chain in ~1.0–1.4 s end-to-end:

```
WF-00 Webhook Receiver  →  WF-60 Message Logger  →  WF-01 Message Router
       (JQu1MkK5...)            (6H75p93...)               (hYGNM97...)
                ↓
WF-02 User State Router  →  WF-20 Keyword Handler  →  WF-40 User→Admin Relay
       (PubCsNT...)              (LgIDj1v...)               (du32QBZ...)
                ↓
WF-51 Send Slack Message  +  WF-10 (loop-prevention webhook drop)
       (wlZRK0Y...)               (wMh0oBR...)
```

Three bursts at exec ids 1321–1328, 1329–1336, 1337–1344 — chain order identical each time.

**WF-60 durations this tick: 22 ms, 30 ms, 24 ms** — even faster than the 101 ms TC-0303 instance. Reinforces BUG-NEW-01 hypothesis #1 (early-return / short-circuit; not actually inserting).

**DB deltas:**
- `users.id=28`: no change (still `consultation_active`, slack_channel_id unchanged) ✅
- `messages`: **still 0 rows** ❌ (BUG-NEW-01 confirmed across 3 more sends)
- `admin_actions`: 0 (expected — not admin commands)
- `consultations`: no change (id=10, status=active)

**Slack (C0B567A175W) — 3 new bot posts:**
| ts | rendered text |
|---|---|
| 1779185909.255 | `:calling: *Abcs:* How does my future look like` |
| 1779185925.639 | `:calling: *Abcs:* Is it bright and shiny :grinning::pray::sunglasses:` |
| 1779185977.728 | `:calling: *Abcs:* This is just to test special characters #1 $200` |

All three rendered cleanly — bold name, emoji round-tripped to Slack emoji codes, `#` and `$` untouched.

**Cross-check vs expected:**
- ✅ TC-0401 plain text — formatting correct
- ✅ TC-0401b emoji — 😀 🙏 😎 round-tripped to `:grinning:` `:pray:` `:sunglasses:` Slack emoji codes
- ✅ TC-0401c **partial** — `#`, `$`, and digits all clean. But the high-risk chars (quotes `"`, apostrophe `'`, comma `,`, backtick `` ` ``, ampersand `&`) were NOT covered. Operator's chosen test text was milder than recommended. **Suggest re-running TC-0401c with a stronger payload** (e.g. `Let's check "this": it's a 5,000-ft cliff & costs $200 — code: \`x.y\``) before declaring user→admin direction safe for all input shapes.
- ✅ User state unchanged
- ✅ Gemini/feedback path NOT triggered
- ❌ BUG-NEW-01 reconfirmed — WF-60 ran 3× with no `messages` row written

**Status carry-forward:** user still `consultation_active`, channel unchanged. Ready for admin → user relay (TC-0402/b).

### Action — 2026-05-19T10:29–10:32Z
**TC-0401c-spicy / TC-0402 / 0402b / 0402c / 0402d / 0403 / 0404 — relay both directions + close + feedback**

Operator narrated: "I've tried that trick message you shared relaying from either sides along with other 2 messages. Then closed consultation and shared feedback (Again text was bit tricky)."

Observed in Slack (chronological):
1. ts 1779186577 (bot, Abcs) — `Let's check "this": it's a 5,000-ft cliff & costs $200 - code: \x.y''` → user→admin **spicy** payload — TC-0401c re-run with the recommended payload ✅
2. ts 1779186600 (operator) — `How does my future look like` → admin→user plain — TC-0402
3. ts 1779186605 (operator) — `Is it bright and shiny 😀🙏😎` → admin→user emoji — TC-0402b
4. ts 1779186620 (operator) — `This is just to test special characters #1 $200` → admin→user partial special — TC-0402c
5. ts 1779186626 (operator) — `Let's check "this": it's a 5,000-ft cliff & costs $200 - code: \x.y''` → admin→user spicy — TC-0402d
6. ts 1779186640 (operator) — `CLOSE CONSULT 61466927921` — TC-0403
7. ts 1779186644 (bot) — `✅ Consultation closed for Abcs (61466927921). Feedback prompt sent via WhatsApp; channel kept open for future rebook.`
8. ts 1779186644 (bot) — `✅ Consultation closed for 61466927921` (duplicate-looking confirmation from WF-11)
9. ~10:32:39Z — user sent feedback via WhatsApp (text per operator: "a bit tricky") → triggered the failed WF-44 chain

### Tick — 2026-05-19T10:33:00Z
**Trigger:** user said "check" after admin↔user relays + CLOSE + feedback

**66 new executions** since cursor 1344. Status counts: **61 success, 5 error**. All 5 errors cluster at one timestamp (10:32:39Z) and share one error message — single-bug cascade, not 5 independent failures.

**Failing executions (root → bubbles):**

| exec | workflow | failed node | error |
|---|---|---|---|
| 1402 | WF-00 Webhook Receiver | Call WF-01 Message Router | `there is no parameter $2` (bubbled up) |
| 1404 | WF-01 Message Router | Call WF-02 Rule Router | `there is no parameter $2` (bubbled up) |
| 1405 | WF-02 User State Router | Call WF-43 (Post-Consultation Handler) | `there is no parameter $2` (bubbled up) |
| 1407 | WF-43 Post-Consultation Handler | Route to Feedback WF-44 | `there is no parameter $2` (bubbled up) |
| **1409** | **WF-44 Feedback Recorder** | **Save Feedback to DB** | **`there is no parameter $2` — root cause** |

**Root cause of cascade:** WF-44 `Save Feedback to DB` Postgres node — inspected directly:
```sql
UPDATE chinmay_astro.users SET feedback = $1, stage = NULL, updated_at = NOW() WHERE id = $2
```
with `queryReplacement: null` (no values supplied) — same family as historical BUG-01 but in a different node. Captured as **BUG-NEW-03**.

**DB deltas:**
- `users.id=28`: → `consultation_active` → `consultation_closed` at 2026-05-19T10:30:42.687Z ✅
- `consultations.id=10`: → `closed`, `ended_at=2026-05-19T10:30:42.681Z` ✅
- `messages`: **still 0** ❌ (BUG-NEW-01 — WF-60 architectural issue, operator-confirmed in UI: variables reference output of upstream Code node that never returns them; needs rebuild)
- `admin_actions`: **still 0** ❌ (BUG-NEW-02 — confirmed no insert node exists anywhere)
- No `feedback` table exists; `feedback` column expected on `users` (per WF-44 query) — value never landed because the insert errored

**Slack: 4 admin-typed messages + 1 CLOSE + 2 close confirmations + 1 spicy user→admin relay** — all rendered cleanly with no encoding loss. The spicy payload (curly quotes, comma, ampersand, backslash, double apostrophe trailing) survived round-trip in both directions.

**Cross-check vs expected:**
- ✅ TC-0401c-spicy (user→admin spicy chars) — preserved end-to-end
- ✅ TC-0402 / 0402b / 0402c / 0402d (admin→user, all 4 payloads) — all WF-50 sends succeeded; no comma-truncation (BUG-01 fix holds)
- ✅ TC-0403 CLOSE CONSULT — users + consultations transitions correct, channel NOT archived (DR-10 holds)
- ❌ TC-0404 feedback — chain failed at WF-44 Save Feedback to DB; feedback NOT persisted; user likely received no acknowledgement
- ❌ BUG-NEW-01 re-confirmed yet again — operator inspected WF-60 in UI: "many basic issues like using a variable value in next node but previous code node never returns it" — promoting from `[major]` to architectural-rebuild

**Final status carry-forward:** user id=28 in `consultation_closed`. Consultation id=10 closed. Slack channel C0B567A175W preserved (intentional per DR-10). Feedback chain broken — needs sprint.

---

## Post-sprint verification — 2026-05-20

Sprint `smoke-resume-remediation-2026-05-19` completed all 5 items (TD-001…TD-005). TD-003 reclassified mid-sprint as deprecation per single-admin-model decision (`memory: project_admin_actions_deprecated`). This section captures live re-verification.

### Static verification — 2026-05-20T11:15Z

| Sprint item | Live check | Outcome |
|---|---|---|
| TD-001 WF-44 Save Feedback to DB | `queryReplacement = ={{ [$('When Executed...').first().json.messageContent, $('When Executed...').first().json.user.id] }}` | ✅ array-form, matches `$1, $2` |
| TD-001 schema check | `users.feedback` (text), `users.stage` (varchar) both present | ✅ |
| TD-002 WF-60 rebuild | Grew 4 → 11 nodes; canonical-shape design with `Has userId?` / `Filter Skip?` / `Needs Phone Lookup?` IF branches + Postgres pivot lookup + insert with array-form queryReplacement | ✅ matches sprint design |
| TD-002 caveat flagged | WF-60 insert had `"\"" + $json.content + "\""` literal-quote wrap at position $5 | 🟠 raised for operator |
| TD-003 reclassification | Confirmed per memory; no new audit-table flagging | ✅ |
| TD-004 technical review | `docs/artefacts/reviews/technical-workflow-review-2026-05-19/`: all 12 scoped workflows reviewed, 0 strict findings, 5 adjacent items deferred (ADJ-T1 thru T5) | ✅ |
| TD-005 payments.status | DB count: `verified`=2, `approved`=0 | ✅ migration applied |

### Functional re-verification — 2026-05-20T08:41Z (first re-test, pre quote-wrap patch)

Operator sent feedback WhatsApp message with the spicy payload (`This is the feedback for great service. Let's check if "this" message from 5,000-ft cliff & costing $200 - reached or not ?  \x.y''`).

**14 executions, all success:**
```
WF-00 (1411) → WF-60 in (1412) → WF-01 (1413) → WF-02 (1414) → WF-20 (1415)
  → WF-43 (1416) → WF-25 (1417) → WF-44 (1418) → WF-25 (1419)
  → WF-50 thank-you (1420) → WF-60 out (1421) → WF-10 (1422–24)
```

**DB outcomes:**
- `users.id=28.feedback` populated verbatim — spicy chars preserved end-to-end ✅
- `users.stage` set to NULL by WF-44 ✅
- `messages.id=8` (inbound) + `id=9` (outbound) inserted ✅
- ❌ Both `messages.content` values had literal `"` wrap (e.g. `"This is the feedback..."` instead of `This is the feedback...`) — the WF-60 caveat confirmed live

### WF-60 quote-wrap patch — 2026-05-20T09:07Z

Operator patched WF-60 manually via UI. Live re-verification (queryReplacement post-fix):
```js
[$json.userId, $json.consultationId, $json.direction, $json.messageType,
 $json.content, $json.whatsappMessageId, $json.slackMessageTs,
 JSON.stringify($json.metadata)]
```
No wrap on position $5 ✅.

**Second roundtrip (14 more executions, identical chain, all success):**
- `messages.id=10` (inbound) content = `This is the feedback for great service. Let's check if "this" message from 5,000-ft cliff & costing $200 - reached or not ?  \x.y''` — verbatim, no wrap ✅
- `messages.id=11` (outbound) content starts with `🙏 Thank you for your feedback! …` — no wrap ✅

### Outstanding findings carried into next session

| Finding | Severity | Disposition |
|---|---|---|
| `messages.consultation_id` is `null` on rows 10, 11 (WF-60 not resolving active consultation for user) | 🟡 minor | Followup — does NOT block any user flow; raise as sprint item before any reporting/analytics work on `messages` |
| WF-60 row 8/9 still have legacy quote-wrap (pre-fix) | ⚪ cosmetic | No backfill required pre-go-live; 2 historical rows |
| ADJ-T1 through ADJ-T5 from technical-review | mixed | Already recorded; user-classify next sprint |

### Verdict

All 4 critical/major user-facing bugs from this session are RESOLVED and verified live. The feedback chain (previously the single hard-fail blocker) is now fully functional with the spicy character set. Re-test coverage of remaining scenarios (REJECT, REBOOK, STOP/HELP, BLOCK/UNBLOCK, onboarding from scratch) is open for the next session.




