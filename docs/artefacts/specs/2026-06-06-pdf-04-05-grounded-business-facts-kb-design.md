# PDF-04 + PDF-05 — Grounded business-facts KB for customer free-text replies

**Design locked:** 2026-06-06
**Sprint:** pre-demo-minor-fixes-31May26 (rolling)
**Items:** PDF-05 (root) + PDF-04 (symptom) — built as ONE fix
**Status:** design locked, ready to build

## Problem

The customer-facing free-text reply chain (`Prepare Gemini Response Prompt` → `Gemini General Response` → `Extract Gemini Reply` → `Send … via WF-50`) has no grounded source of truth about the service. The prompts tell Gemini to "answer factually" and "don't invent prices beyond ₹500" but never state what the service IS, what's included, or what is NOT offered. Result: the bot fabricates services ("yes, we offer video consultations" — PDF-04) and improvises pricing/inclusions (PDF-05).

## Scope (4 nodes across 3 workflows)

Routing fact (verified live 2026-06-06): each `Prepare Gemini Response Prompt` is reached ONLY when WF-25 Intent Classifier (`eTV1lUcYrXBg2q2T`) returns `general_enquiry` (= "greetings/pleasantries, or a general question about astrology, the service, or Chinmay"). The other 7 intents (`wants_consultation`, `rebook_intent`, `feedback_intent`, `stop_intent`, `garbage`, `malicious_abusive`, `inappropriate`) are routed away before this node. WF-43 additionally keeps its `valid_user_message`/`Off-Topic?` post-filter.

| WF | n8n ID | Node | Format |
|----|--------|------|--------|
| WF-30 Payment Pending | `gGJBY5fJha0Let8I` | `Prepare Gemini Response Prompt` | plain text |
| WF-31 Payment Submitted | `HB8nXudAtk9iXz7C` | `Prepare Gemini Response Prompt` | plain text |
| WF-43 Post-Consultation | `3va0M06kijgyLejf` | `Prepare Gemini Response Prompt` | JSON wrapper |
| WF-43 Post-Consultation | `3va0M06kijgyLejf` | `Prepare Gemini Prompt (Opted-Out)` | JSON wrapper |

The 4th node (opted-out re-engagement) was found during the design audit — same fabrication risk; user approved including it (2026-06-06), a cross-cutting scope expansion on PDF-04/05.

## Locked decisions (user, 2026-06-06)

1. **Offering:** text-only Vedic astrology consultation over WhatsApp. Audio/video/automatic-payment are upcoming — surfaced as "coming soon" **only when asked**, never volunteered, never with a date.
2. **Inclusions:** ₹500 covers ONE question/topic (e.g. job prospects, marriage decision). Framed as one question/topic, NOT "one message" — Dr. Chinmay may ask follow-ups; he decides volume/frequency during the active phase; scope ends at CLOSE CONSULT. Follow-up/another question → REBOOK (fresh ₹500).
3. **Price wording:** plain "₹500 per consultation" — "initial/introductory" deliberately omitted (avoids "what's the regular price?" questions).
4. **NOT offered (now):** video, audio, in-person, instant/automatic payment — all "coming soon".
5. **Defer rule is topic-gated** (the key safety fix): the deferral line is whitelisted to **personal** astrology questions only.
   - Generic/educational astrology ("what does Jupiter signify in a chart?") → Gemini MAY answer.
   - Personal (the user's own chart/predictions/life questions, or remedies/gemstones/mantras/rituals for them) → DEFER. Discriminator: the moment a question is about the person themselves → defer, even if answerable generically.
   - Off-topic → NOT the deferral line; state-specific redirect (WF-43: `valid_user_message`=false).
6. **Single authored source (option A):** one canonical FACTS+RULES block authored here; byte-identical text spliced into all 4 nodes. n8n has no runtime include; true single-source (a shared sub-workflow/Set node) noted as a future refactor if the KB starts changing often. Only the role intro + per-state closing line differ per node.

## Canonical FACTS block (identical in all 4 nodes)

```
KNOWN FACTS — the ONLY things you may state as fact about Chinmay Astro:
- Chinmay Astro offers a text-based Vedic astrology consultation, conducted over WhatsApp (this chat).
- Each consultation covers ONE question or topic — for example job prospects, a marriage decision, finances, or health and the timing of events. Answering it properly may take several messages back and forth: Dr. Chinmay may ask follow-up or clarifying questions, and Dr. Chinmay decides when the question has been fully answered.
- Price: ₹500 per consultation, paid via GPay/UPI.
- Audio consultations, video consultations, and instant/automatic payment are NOT available yet — they are coming soon. For now, consultations are text-only over WhatsApp.
- Once Dr. Chinmay closes a consultation, that one-question scope is complete. For a follow-up, another question, or more on the same topic, the person books a new consultation by replying REBOOK (a fresh ₹500 payment each time).
```

## HOW TO RESPOND rules (4 buckets; [STATE LINE] substituted per node)

1. Greeting/pleasantry → warm reply + [STATE LINE].
2. Answerable from KNOWN FACTS → answer briefly & factually from facts only; audio/video/auto-pay → "coming soon, text-only for now".
3. Astrology question — (a) generic/educational → may answer; (b) personal → deferral line "That's something Dr. Chinmay will look into for you during your consultation." + [STATE LINE].
4. Off-topic → NOT the deferral line; [STATE LINE] redirect (WF-43: `valid_user_message`=false).

Closing: 2-3 short sentences; never invent beyond KNOWN FACTS; no bullet points.

### Per-node deltas
- WF-30 role: "completed the intake form but has not yet paid the ₹500 fee"; STATE LINE: "completing the ₹500 payment via GPay will start their consultation".
- WF-31 role: "submitted payment, which Dr. Chinmay is now reviewing"; STATE LINE: "payment is being reviewed; consultation begins once confirmed".
- WF-43 Response role: "had a consultation before and is reaching out again"; STATE LINE: "reply REBOOK to start a new consultation"; keep JSON wrapper + the no-pay/REBOOK guard.
- WF-43 Opted-Out role: "previously opted out and has now re-engaged, so they are resubscribed — welcome them back"; STATE LINE: "welcome back + reply REBOOK"; keep JSON wrapper + the no-pay/REBOOK guard.

Final assembled node bodies (source of truth for the splice): `node-wf30.txt`, `node-wf31.txt`, `node-wf43-response.txt`, `node-wf43-optedout.txt` (scratch at build time).

## Build plan

Batch Surgical (build-workflow Step 5d): backup all 3 workflows → `jq --rawfile` replace each node's `.parameters.jsCode` (write code to file first, splice via rawfile — never through a shell var) → curl PUT (3 PUTs; WF-43 carries 2 node edits in one PUT) → re-fetch & verify each node contains "KNOWN FACTS", node counts unchanged → MCP validate → export + secrets scan. No new nodes, no rewiring.

## Acceptance

- Asking about a non-offered service (video/audio) never yields "yes, we offer it" — replies "coming soon, text-only for now".
- Price/inclusions answered consistently from KNOWN FACTS (₹500, one question/topic) across all 4 nodes.
- Personal astrology questions deferred to Dr. Chinmay; generic astrology may be answered.
- Off-topic does NOT trigger the deferral line.
- Regression: WF-43 `valid_user_message`/`Off-Topic?` routing still functions; structured WF-25 intents still route away from this node.
