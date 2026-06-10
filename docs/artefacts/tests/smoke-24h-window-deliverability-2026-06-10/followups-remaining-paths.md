# Follow-ups — remaining un-exercised paths

Logged 2026-06-10 at end of the 24h-window deliverability smoke. None are blockers; the core deliverability cluster (PDF-15/17/18/19/20/21) is fully green.

## 1. PDF-16 — failure-visibility notice [not exercised]

- **Why un-smoked:** every customer-bound send this session **succeeded**, so WF-50's `success=false` branch never fired and the in-channel "could not deliver" notice to Dr. Chinmay was never produced.
- **What it should do (DD-4):** any customer-bound send Meta rejects — for any reason — must surface as a plain-language notice in the consult channel. No silent drops.
- **To exercise:** force a genuine Meta failure on a customer-bound send, e.g.
  - a paused/disabled template send, or
  - a malformed/over-length template param that Meta rejects (132xxx), or
  - a send to a number outside the window with no template (if any such path remains).
- **Verify:** the failing exec shows `success=false` with the Meta error, AND a Slack notice lands in the consult channel naming the customer + that delivery failed. Confirm across WF-41 (relay), WF-34 (reject), WF-42 (close) callers.

## 2. WF-75 self-termination [logic-proven, not live-demoed]

- **Proven this session:** the nudge **repeats** (post-nudge dry-run still matched — nudge logged `transport=slack`, ignored by the WA-scoped query).
- **Not live-demoed:** the nudge **stops**. Two structural termination paths in WF-75.pseudo Step 2:
  1. Dr. Chinmay replies on WhatsApp → `last_outbound_wa > last_inbound` → unanswered clause false → no match.
  2. Last inbound crosses 24h → outside the 18–24h band → no match.
- **To exercise (cheap):** with user 41 still fixtured active @ ~20h, relay one WA reply as Dr. Chinmay → re-run the WF-75 dry-run → user 41 should drop out of the match set. (Path 2 will also occur naturally as user 41's fixtured inbound ages past 24h.)

## 3. PDF-19 — remaining close-template buttons [partial]

- Only **"Done, Thanks."** was tapped and routed (WF-02 → WF-43). 
- **"Leave Feedback"** and **"Book Again"** routes were **not individually exercised**. Labels confirmed present on the `consultation_closed` template; WF-02 `BUTTON_MAP` keys all three (`'Leave Feedback'` / `'Book Again'` / `'Done, Thanks.'`).
- **To exercise:** tap each remaining button on a close template and confirm it routes to the feedback and rebook handlers respectively.

## Carry-forward action (not a test gap)

- **`docs/workflow-registry.md`** — WF-75 row still reads 🟡 "Built (inactive)". WF-75 was activated and verified this session and is being **kept active** (operator decision 2026-06-10). Update the row to 🟢 Active to remove the doc/reality drift.
