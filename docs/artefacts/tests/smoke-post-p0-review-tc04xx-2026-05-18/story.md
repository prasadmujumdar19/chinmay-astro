### TC-0401 — User→admin relay ("hi" lands in Slack)  ✅
User sent "hi" from 61466927921. The WF-00 → WF-01 → WF-02 → WF-20 (no keyword) → WF-40 → WF-51 pipeline executed in 700 ms, posting `📲 *Abcs:* Hi` into `consult-61466927921`. Bot-loop guard correctly suppressed WF-10's re-fire on the bot's own post. User state unchanged as expected for a plain relay.

---

### TC-0402 — Admin→user relay ("Hi back" reaches phone)  ✅
Operator typed "Hi back" in the consult channel. WF-10 → WF-41 Admin→User Relay → WF-50 sent the WhatsApp; three Meta delivery callbacks followed within 2 s. Operator confirmed message arrived intact. During investigation surfaced a documentation issue — handoff said WF-12 but the live relay is WF-41 — captured as BUG-05.

---

### TC-0402b.1 — User→admin relay with emoji  ✅
Subsequent user message carried a smiley emoji. Same pipeline as TC-0401, emoji preserved end-to-end into Slack. No tweaks needed on the encoding side.

---

### TC-0402b.2 — Admin→user relay loses text after first comma  ❌ → BUG-01
Operator typed `Back to you, ready to close`. The user received only `Back to you`. All n8n executions reported `status=success` — failure was silent. Trace through WF-10 showed the comma split happening at the `Load User Status` Postgres node:

```json
options.queryReplacement: "={{ $json.channelId }}, {{ $('Find Channel').item.json.name }}, {{ $json.messageText }}"
```

n8n v2.5's Postgres node evaluates each expression then naïvely splits the resulting concatenated string on `,` to map to `$1/$2/$3`. With `messageText="Back to you, ready to close"`, the splitter produces FOUR tokens; the third (`Back to you`) wins, the rest is dropped. Same pattern likely exists elsewhere — sweep required. Fix: switch the node to per-parameter Query Parameters.

---

### TC-0403 — CLOSE CONSULT  ✅
Operator typed `CLOSE CONSULT 61466927921`. WF-10 → WF-11 Command Parser → WF-42 Consultation Closer → WF-50 sent the feedback prompt template with two buttons. DB transitions clean: `users.status` → `consultation_closed`, `current_consultation_id` → null, `consultations.id=9.ended_at` set. Identified two new workflow IDs (WF-11 = `GoTYo0GS2y8qjjkw`, WF-42 = `fx70vqyJtRdF2DgR`) — registry already had these mapped; this just confirms.

---

### TC-0404a — Feedback button tap  ✅
User tapped the first feedback button. WF-43 Post-Consultation Handler routed via `Is Button Reply?` → ack message sent back via WF-50. ~3.2 s end-to-end. Button-payload path works.

---

### TC-0404b — Free-text feedback produces nothing  ❌ → BUG-02 + BUG-03 + BUG-04
User then typed "Amazing service". User received nothing back. Three bugs cascade:

1. **BUG-04**: WF-25 intent classifier returned `intent: null` (instead of `feedback`), so WF-43's routing IFs all fell through to the default Gemini fallback branch.
2. **BUG-03**: `Prepare Gemini Response Prompt` built the prompt as `…\nUser: undefined` — wrong variable reference, user's actual text never reaches the prompt.
3. **BUG-02**: `Gemini General Response` HTTP node tries to send the prompt inside a raw-string `jsonBody`. The literal `\n` in the prompt becomes an unescaped newline inside a JSON string, which is invalid per RFC 8259. n8n's HTTP v4.2 validates jsonBody before sending and throws `"JSON parameter needs to be valid JSON"`. Error propagates up through WF-02/01/00 — all marked failed in executions list.

Fix sequence: BUG-02 (object-interpolation pattern, biggest blast radius), BUG-03 (one variable), BUG-04 (its own sprint). With BUG-02 fixed the failure mode would surface as wrong content rather than total silence — still wrong, but louder. Also confirmed during this scenario that `awaiting_feedback` is button-payload-driven by design: free-text feedback relies entirely on WF-25 intent classification, which re-prioritises WF-25 reliability from P3 to a feedback-path P0.

---

### TC-0501 — REBOOK via "Book again" button  ✅
User tapped the "Book again" button surfaced after the feedback flow. WF-43 → **WF-45 Rebook Handler** (newly identified id `MUG7rPgSHc7UtAE9`) → WF-50 sent the payment instructions with "Payment Completed" button. ~700 ms. User state moved to `payment_pending` (transit; updated again on next click within the same second so not visible as a distinct DB observation).

---

### TC-0801 — Payment Completed button → admin notification  ✅
User tapped the "Payment Completed" button. WF-00 → WF-01 → WF-02 → **WF-32 Payment Confirmation Receiver** (newly identified id `emUOLWVZiNVxcOe3`) → WF-50 ack to user → WF-51 posted approve-payment request into `consult-61466927921`. ~1.2 s. DB confirms `users.status=payment_submitted`, new `payments.id=11` row with `status=pending_verification, amount=500.00`. Admin Slack now has the pending approval, leaving the carry-forward state ready for an admin APPROVE PAYMENT in a future session to exercise WF-33's second-time consultation create path.

---

### POST-SPRINT — Static verification of all 5 bugs + TZ work  ✅
On 2026-05-18T15:32Z, after the `smoke-post-p0-review-tc04xx-2026-05-18` sprint (commits 2a33905, 3451197, 4bf62f2) and the follow-on `timestamp-convention` sprint (commits d11c3ae, 04ec7a6, eb54dae, 464fa6b, c128b1e), every fix was re-inspected against the live n8n + Postgres. WF-10's `Load User Status` now uses array-form `queryReplacement` (BUG-01 gone — no splitter ambiguity). WF-43's Gemini node uses object-interpolation jsonBody and reads `messageContent` (BUG-02, BUG-03 gone). WF-25's deeper root cause turned out to be a Gemini credential with the query-param NAME set to literal `"Gemini n8n Key"` instead of `key` — sprint scope expanded with user approval to switch both WF-25 and WF-43 to the predefined `googlePalmApi` cred, harden the `userStatus` input contract, and add a `consultation_closed → feedback_intent` fallback in `Handle Gemini Error` (BUG-04 gone, plus a defensive net against future Gemini outages). WF-12 is now `active: false` with zero callers across all 28 live workflows (BUG-05 gone). The follow-on TZ sprint migrated all 13 `chinmay_astro.*` timestamp columns to `timestamptz`, set the n8n container to `TZ=UTC`, and codified the strict-UTC rule in CLAUDE.md.

```text
verification table at session.md → "Post-sprint static verification — 2026-05-18T15:32Z"
end-to-end WhatsApp re-test of BUG-02/03/04 + TC-0303 second-approve regression: not run (user-excluded)
```

---
