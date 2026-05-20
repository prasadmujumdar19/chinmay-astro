# Story — smoke test (pre-go-live resume) — 2026-05-19

### TC-0303 — Admin APPROVE PAYMENT (second-time consultation create path)  ✅

Operator typed `APPROVE PAYMENT 61466927921` in `consult-61466927921`. The full WF-10 → WF-11 → WF-33 chain fired in 2.7 seconds; `payments.id=11` transitioned to `approved` with `verified_at` and `verified_by` set, `users.id=28` flipped to `consultation_active`, and a new `consultations.id=10` row was created with `status=active`. Critically, `slack_channel_id` did NOT change and no WF-52 execution appeared — confirming the second-time path correctly reuses the existing channel per DR-10. WhatsApp confirmation and Slack admin confirmation both posted as expected.

---

### TC-0401 + 0401b + 0401c-mild — User → admin text relay (3 messages)  ✅

User sent three WhatsApp messages in quick succession: plain text, emoji-bearing, and partial special-character. Each ran an identical 7-workflow chain (WF-00 → WF-60 → WF-01 → WF-02 → WF-20 → WF-40 → WF-51) in roughly 1.0–1.4 seconds end-to-end, with every message arriving in Slack formatted as `:calling: *Abcs:* <text>`. Emojis round-tripped cleanly to Slack emoji codes (`:grinning:`, `:pray:`, `:sunglasses:`); the `#` and `$` characters in the mild special-char test were untouched. WF-60 ran each time in 22–30 milliseconds, which we noted was suspiciously short — a finding that compounded as the session continued.

---

### TC-0401c-spicy — User → admin relay with full special-character payload  ✅

User re-ran the special-character test with the recommended spicy payload: `Let's check "this": it's a 5,000-ft cliff & costs $200 - code: \x.y''`. Every high-risk character survived the round trip — curly quotes, apostrophes, comma, ampersand, dollar sign, backslash, double trailing apostrophes — all rendered correctly in Slack with no JSON-escaping artifacts or truncation. This direction (user→admin) is now confirmed safe for the full character set.

---

### TC-0402 + 0402b + 0402c + 0402d — Admin → user relay (4 messages, including spicy)  ✅

Operator typed four messages of escalating difficulty into `consult-61466927921`: plain text, emoji, partial special chars, and the same spicy payload. All four reached the user via WhatsApp through the WF-10 → WF-50 path. The historically-failed comma-truncation case from BUG-01 (prior sprint) was specifically re-exercised in the spicy payload and held up — the queryReplacement array-form fix from the 2026-05-18 sprint is durable under live load.

---

### TC-0403 — Admin CLOSE CONSULT  ✅

Operator typed `CLOSE CONSULT 61466927921`. `users.id=28` flipped from `consultation_active` to `consultation_closed` at 2026-05-19T10:30:42.687Z; `consultations.id=10` transitioned to `closed` with `ended_at` set; Slack received two confirmation messages (the close summary plus a separate close acknowledgement); WhatsApp received the feedback prompt. Importantly, the Slack channel was NOT archived — confirming DR-10 ("channel preserved for rebook") still holds.

---

### TC-0404 — User feedback after close  ❌

User replied to the feedback prompt with a tricky free-text message via WhatsApp at approximately 10:32:39Z. The chain triggered correctly through WF-00 → WF-01 → WF-02 → WF-43 (routing user to feedback path because state is `consultation_closed`) and reached WF-44 — where it died. Every workflow in the chain reported the same error message ("there is no parameter $2"), but the root cause was localised to a single node:

```sql
-- WF-44 "Save Feedback to DB":
UPDATE chinmay_astro.users SET feedback = $1, stage = NULL, updated_at = NOW() WHERE id = $2
-- with queryReplacement: null
```

The SQL has two positional placeholders but no `queryReplacement` is configured — same root-cause family as historical BUG-01, in a node that was never exercised before because the upstream routing was broken until the prior sprint. The feedback value never persisted, the user received no acknowledgement, and the consultation_close arc remains incomplete until WF-44 is fixed. **Captured as BUG-NEW-03 in `followups-wf44-feedback-recorder.md` and sprint input item 1.**

---

### BUG-NEW-01 — WF-60 Message Logger architectural failure  ❌

This wasn't a single test scenario — it surfaced cumulatively across the entire session. WF-60 was invoked at least 8 times (inbound relays, outbound sends, admin chain) and every single execution completed `success` in 22–101 milliseconds while the `chinmay_astro.messages` table remained globally empty. Operator then opened WF-60 in the n8n UI and found systematic cross-node variable mismatches: nodes downstream of `Extract Message Data` reference fields that the Code node simply doesn't emit. A targeted patch would only fix one reference at a time; the workflow needs to be redesigned around a canonical input contract that every caller (WF-50, WF-51, WF-33, WF-43, the inbound webhook chain) maps to via a small per-caller mapper node. **Captured as BUG-NEW-01 in `followups-wf60-architecture.md` and sprint input item 2.**

---

### BUG-NEW-02 — admin_actions audit log not being written  ❌

A parallel finding — `chinmay_astro.admin_actions` is globally zero rows despite multiple admin commands (APPROVE, CLOSE, and the entire prior session's commands) all expected to land audit entries. Whether the audit-writing node was ever built, or built and then broken by a refactor, is unclear from execution data alone — needs a grep across all 28 active workflow JSONs as the first sprint step. Pre-go-live this is `[major]` for compliance and operations even though it doesn't affect user flow. **Captured as BUG-NEW-02 in `followups-audit-log-gaps.md` and sprint input item 3.**

---

### Post-sprint verification — feedback chain fully restored  ❌ → ✅ (after TD-001 + TD-002)

The day after smoke-testing closed with the WF-44 + WF-60 failures, sprint `smoke-resume-remediation-2026-05-19` ran TD-001 (WF-44 parameter binding) and TD-002 (WF-60 architectural rebuild from 4 → 11 nodes) in batch 1. Live re-verification on 2026-05-20 sent the same spicy-character feedback payload through the previously-broken chain. All 14 executions completed `success`, and the spicy payload (curly quotes, comma, ampersand, backslash, trailing double-apostrophes) landed verbatim in `users.id=28.feedback`. The user received the thank-you via WF-50. A follow-on caveat surfaced — WF-60's `messages.content` was wrapped in literal double quotes via `"\"" + $json.content + "\""` at the `$5` queryReplacement position. Operator patched WF-60 manually via UI; a second feedback roundtrip immediately after produced rows 10 (inbound) + 11 (outbound) with content stored verbatim, no wrap. The previously-broken feedback chain is now end-to-end functional with the full character set.

```sql
-- post-fix verification rows
id=10 inbound content:  This is the feedback for great service. Let's check
                        if "this" message from 5,000-ft cliff & costing $200
                        - reached or not ?  \x.y''
id=11 outbound content: 🙏 Thank you for your feedback! We really appreciate…
```

---

### Regression check — all prior-sprint fixes hold  ✅

Every fix from the 2026-05-18 follow-up sprints was indirectly re-tested by this session: BUG-01 comma-truncation (admin→user direction, spicy payload, multiple times — no truncation); BUG-02 jsonBody object-interpolation (didn't reach the failing node, but WF-43 routing reached WF-44 successfully); BUG-03 prompt template (no `undefined` strings observed); BUG-04 Gemini cred + routing (WF-43 routed correctly to WF-44 before WF-44's own bug surfaced); BUG-05 WF-12 deactivation (zero executions of WF-12); TZ-NEW (all timestamps in this session are correct UTC `Z`-suffixed strings). No regressions.

---
