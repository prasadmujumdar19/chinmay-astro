# The Story

Chronological narrative of what happened, each scenario as a self-contained card. For raw chronological ticks, expand the appendix.

---

### TC-0101 — Brand-new user sends "Hi"  ✅

Started with the DB reset clean (user, payment, consultation, pending_user all deleted; Slack channel `C0B2QNWLHSB` manually deleted). Operator sent "Hi" from `61466927921`. Chain `WF-00 → WF-01 → WF-02 → WF-20 (no keyword) → WF-21 → WF-50 → WF-60` ran in ~2.4s, all green. Welcome + WhatsApp Flow form delivered. A row appeared in `pending_users` — initially flagged as a Design Rule #1 violation, but operator clarified pre-form `pending_users` writes are intentional. CLAUDE.md wording captured for update; saved to memory so it doesn't get re-flagged.

---

### TC-0104 — Form submission  ❌ → ✅ (after BUG-01)

Operator filled and submitted the Flow. WF-22 fired, WF-52 created Slack channel `C0B3SA9JALX`, user row 27 was created with all birth details… and then **WF-22 errored at `Save Slack Channel ID`** with `Referenced node doesn't exist`. The expression was pointing at `Call WF-52 (Create User Channel)` — a name that had been renamed to `Ensure Slack Channel Exists (WF-52)`. The channel ID never landed in the DB, payment instructions never went out.

```diff
- queryReplacement: ={{ $('Call WF-52 (Create User Channel)').item.json.channelId }}, ...
+ queryReplacement: ={{ $('Ensure Slack Channel Exists (WF-52)').item.json.channelId }}, {{ $now }}, {{ $('User Created?').item.json.id }}
```

Operator patched via n8n UI. WF-22 re-ran against the existing user 27 (no reset needed), `slack_channel_id` filled, payment instructions delivered. **This is a 100% reproducible class — node renames silently break downstream expressions.** Flagged as plugin-lint candidate (resolve `$('node-name')` against actual nodes).

---

### TC-0201 — User taps "Payment Completed"  ✅

Tap → `WF-00 → WF-01 → WF-02 → WF-32 → WF-50 + WF-51 → WF-60`, ~2s. User status: `payment_pending` → `payment_submitted`. Payment row id=9 created (`status=pending_verification`, `amount=500`, `method=gpay`). Slack notification "🔔 New Payment Submission … `APPROVE PAYMENT 61466927921`" landed in `C0B3SA9JALX`. Most importantly: **WF-32 did NOT re-invoke WF-52** — Design Rule #2 (read existing `slack_channel_id` from DB) confirmed live.

---

### TC-0301 — Admin sends APPROVE PAYMENT  ❌ → ✅ (after BUG-02)

`APPROVE PAYMENT 61466927921` from Slack triggered `WF-10 → WF-11 → WF-33 → WF-50`, all green. User → `consultation_active`, payment → `approved`, consultations row id=8 created. **But** `users.current_consultation_id` was NULL despite consultation 8 existing — flagged as a data-integrity observation. Operator added a new `Update User Consultation Id` node to WF-33; first attempt had both placeholders as `$1`:

```diff
- WHERE id = $1   -- both placeholders the same; matched user 8 (doesn't exist), not user 27
+ WHERE id = $2
- queryReplacement: ={{ $('Create Consultation Record').item.json.id }}
+ queryReplacement: ={{ $('Create Consultation Record').item.json.id }}, {{ $('Create Consultation Record').item.json.user_id }}
```

Second attempt sourced both consultation id and user_id from the same upstream node (cleaner than my suggestion). Verified — `current_consultation_id = 8` on user 27.

---

### TC-0401 — User → admin relay  ✅

User sent "What does my birth chart say about career this year?" from WhatsApp. Chain `WF-00 → WF-01 → WF-02 → WF-20 (no keyword) → WF-40 → WF-51`, ~3s, all green. Pure passthrough — no LLM. Message landed in `C0B3SA9JALX`. Bot-loop guard confirmed (subsequent WF-10 event for the bot's own post didn't recurse).

---

### TC-0311 — Admin → user relay  ❌ → ✅ (after BUG-03)

Operator replied from Slack. **Failed:** WF-41 `Extract Phone from Channel` threw `TypeError: Cannot read properties of undefined (reading 'replace')`. Root cause: WF-10's `Load User Status` ran `SELECT status FROM users WHERE slack_channel_id=$1` — returning only `{status}` — and `Call WF-41` used `mappingMode: passthrough`. Every other field (`channelName`, `messageText`) from upstream Slack-event extraction was dropped because the Postgres node terminated the data chain.

Operator's fix took the pragmatic-but-hacky route — extended `Load User Status` SQL to smuggle the missing fields through the DB:

```sql
SELECT status, $2 as channelName, $3 as messageText
FROM chinmay_astro.users WHERE slack_channel_id = $1 LIMIT 1
```

Plus changed WF-41's JS from `input.channelName` → `input.channelname` (Postgres lowercases unquoted aliases). Live webhook-mode re-test (exec 993–999) confirmed green, ~1.4s end-to-end. **3 caveats logged in `followups-relay-fix.md`** — preferred long-term fix is `mappingMode: defineBelow` on the caller side, not SELECT-smuggling.

---

### TC-0305 — Admin closes consultation  ✅ (with side-findings)

`CLOSE CHAT CONSULT 61466927921` triggered `WF-10 → WF-11 → WF-42 → WF-50`, all green. User → `consultation_closed`, `current_consultation_id` cleared to NULL, `consultations.id=8` → `closed` with `ended_at` populated. **`slack_channel_id` preserved** per Design Rule #10 — channel intentionally reused on rebook, NOT archived. User received the post-consult interactive buttons (Provide Feedback / Book Another / I'm done).

But the exploration around this scenario surfaced a tangled set of WF-11 issues. Operator first sent a malformed CLOSE command, which fell into WF-11's UNKNOWN-command branch — and that response posted to the wrong channel (hardcoded to admin). Fixed that, then realized HELP had the same issue. Tried to fix HELP, but "saves kept reverting." That's because the HELP responder node was misleadingly named `Send Stats To Admin1`, sitting right next to a real `Send Stats To Admin` — the operator was editing the wrong node. Rename + fix landed. LIST and STATS got the same treatment in the same iteration.

Two hardcoded admin-channel refs remain in `Confirm User Unblocked` and `No Blocked User Found` — captured in `followups-wf11-channel-routing.md` as FU-WF11-03 (partial). Not blocking — UNBLOCK wasn't exercised this session.

---

### Where we ended the session

Test phone 27 sits in `consultation_closed` with `slack_channel_id=C0B3SA9JALX` preserved, ready for the post-consult interactive buttons to be exercised next session (feedback, rebook, done). All happy paths attempted today work end-to-end via the live webhook chain. Heavy iteration logs in the appendix can be skimmed past — the cards above are the actual story.
