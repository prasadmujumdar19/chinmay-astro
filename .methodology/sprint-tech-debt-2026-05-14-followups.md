# Sprint Followups — tech-debt-2026-05-14

## 2026-05-14 — Post-batch P0 regression

- **WF-23** (Pre-Form Intent Filter): no `stop_intent` branch — if WF-25 returns stop_intent for an ambiguous pre-form message, WF-23 sends a form re-prompt instead of routing to WF-47. STOP keyword is caught upstream by WF-20 (now wired via TD-NEW-004), so risk is limited to ambiguous phrases only. Previously noted in handoff as low risk pre-go-live.
  - Found while verifying sibling of: TD-NEW-003 (WF-25 stop_intent change)

- **WF-44** (Feedback Recorder): no `stop_intent` branch — if WF-25 returns stop_intent during the feedback flow, WF-44 falls through without routing to WF-47. Low risk (short feedback interaction, STOP keyword caught by WF-20 upstream).
  - Found while verifying sibling of: TD-NEW-003 (WF-25 stop_intent change)

> Note: WF-43 is already tracked as TD-NEW-008 (P1). WF-30 ✅ and WF-31 ✅ confirmed to have stop_intent routing.

## 2026-05-14 — Found during TD-NEW-013 (Batch 3)

- **WF-60** (Message Logger, `6H75p935FpBVBQtV`): disconnected legacy chain present — `Inbound - Prepare Log Entry` / `Inbound - Log Message` / `Outbound - Prepare Log Entry` / `Outbound - Log Message` / `Get User ID` / `Done` are not wired to the trigger (active path is trigger → Extract Message Data → Log to Messages Table → Done). The legacy chain INSERTs into a `chinmay_astro.message_log` table that may not exist (current schema uses `messages`). Dead nodes — recommend deletion in a future hygiene pass (not in current sprint).
  - Found while: implementing TD-NEW-013 (fallback removal)
