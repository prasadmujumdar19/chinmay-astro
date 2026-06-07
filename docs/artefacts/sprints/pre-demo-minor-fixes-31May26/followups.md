# Follow-ups — pre-demo-minor-fixes-31May26

## [2026-06-06] — PDF-04/05 validation finding (adjacent)

- **WF-25 Intent Classifier** (`eTV1lUcYrXBg2q2T`): service/offering/pricing questions phrased with booking language are mis-classified `wants_consultation` instead of `general_enquiry`, so they bypass the grounded-KB Gemini reply (the PDF-04/05 fix) and get the bare payment-reminder fallback.
  - **Repro:** test user 61466927921 (`payment_pending`). "Do you offer video consultations?" → `general_enquiry` → grounded reply ✅ (exec 3668). "How much is audio consultation and how do I get it" → `wants_consultation` → `Prepare Payment Reminder` ❌ (exec 3680). Same class of question, inconsistent result.
  - **Root cause:** WF-25 category def `wants_consultation: "user wants to book a new consultation OR is asking about booking"` — the "asking about booking" clause overlaps `general_enquiry: "general question about ... the service"`. "how do I get it" trips the booking clause.
  - **Classification:** adjacent to PDF-04/05 (the fix itself is verified working; this is upstream routing). Does NOT block PDF-04/05 done.
  - **Blast radius:** WF-25 is shared by 4 callers (WF-30, WF-31, WF-40, WF-43) per dependency-map — needs impact analysis before change.
  - **Proposed fix:** narrow `wants_consultation` to explicit proceed/book intent ("I want to book", "let's start", "I'm ready to pay"); move service/offering/pricing/how-to questions to `general_enquiry`. Impact-check WF-40 (relay) doesn't branch on the distinction.
  - **Decision:** RESOLVED 2026-06-06 — fixed now (Option 1, bundled). Tracked as sprint item **PDF-10** (done). User-directed scope: `wants_consultation` = text-consultation booking intent only; service/non-text/astrology-adjacent → `general_enquiry`.

## Plugin improvement candidates (flush at sprint/batch boundary, not now)

- **New pattern for plugin (plan-sprint, 2026-06-04):** Exception to the "never mix priority tiers in one batch" rule. When N items are independent *symptoms of ONE inseparable single-workflow fix* (e.g. PDF-06 P1 / PDF-07 P0 / PDF-08 P2 — all one WF-10 genuine-message guard across its relay, alert, and WF-60-logging branches), collapsing them into a single mixed-priority batch is correct because splitting by priority would mean authoring the same change three times. plan-sprint should: detect same-root-same-workflow symptom clusters, collapse into one batch, designate a carrier item, hard-dep the siblings on the carrier, and record the mixed-priority justification explicitly. Currently the skill's Step 3f says priority dominates batch assignment — add the single-root-fix exception alongside the contract-coupling guidance in Step 3d.
