# Followups — data-contract-discipline-phase-1

## 2026-05-24 — Post-Wave-1 regression / adjacent findings

Adjacent findings surfaced while applying Wave 1 edit plans. None blocks Wave 2 dispatch; all logged here for triage after sprint close.

- **[WF-60] `slackMessageTs` enforcement scoped to `if (!userId)` block** — classification: `adjacent`
  - **Cause-and-effect:** sub-2's entry guard puts the `slackMessageTs` presence check inside the `if (!userId)` block. §2.6 line 212 reads `transport == 'slack': slackChannelId (for user lookup if userId absent), slackMessageTs` — the comma-list parsing is ambiguous, but a strict reading treats `slackMessageTs` as required-always (independent of userId). Under sub-2's current code, a Slack call with userId pre-resolved by the caller but missing `slackMessageTs` would pass the guard and INSERT a NULL `messages.slack_message_ts` column.
  - **Proposed fix:** move the `slackMessageTs` presence check outside the `if (!userId)` wrapper so it fires for every `transport === 'slack'` payload.
  - **Priority hint:** low — all current Slack callers source `slackMessageTs` from the Slack API response which is always present on a successful post. Drift risk is theoretical until a future caller routes Slack traffic without going through `Post to Slack` first.
  - **Decision:** _open — needs user direction_
  - Found while: applying sub-2 / WF-60 Validate Inputs node (in-Wave-1, reviewer pass during apply phase).

- **[WF-10] `Load User Status` SELECT missing `current_consultation_id` and `slack_channel_id`** — classification: `adjacent`
  - **Cause-and-effect:** §2.2 WF-11 Command Envelope requires `user.slack_channel_id`; §2.2 WF-41 Relay Envelope requires `user.current_consultation_id`. The live `Load User Status` SELECT only fetches `id, status, name, phone_number`. Sub-6a's envelope code therefore emits both fields as `null` until the SELECT is expanded. Downstream consumers of the Command Envelope (WF-11 → WF-33/34/42/46) and Relay Envelope (WF-41) that need either field will see null and must fall back to their own lookup (negating part of the SP-03 centralized-validation gain).
  - **Proposed fix:** expand `Load User Status` SELECT to `SELECT id, status, name, phone_number, slack_channel_id, current_consultation_id FROM chinmay_astro.users WHERE slack_channel_id = $channelId LIMIT 1`. Additive change, low risk.
  - **Priority hint:** medium — defers fully-trusted envelope contract to a follow-up Phase. Wave 2 consumer cleanups (sub-13, sub-14) may need to keep their own user lookups in the interim.
  - **Decision:** _open — needs user direction_
  - Found while: sub-6a / WF-10 envelope node design (DRIFT-001 + DRIFT-002 in subagent's contract_drift_findings).

- **[WF-51] entry-guard regex tightened beyond §2.4** — classification: `adjacent / informational`
  - **Cause-and-effect:** Design.md §2.4 specifies `channelId` matches `^[CDG][A-Z0-9]+$` (plus-quantifier, no minimum length). The dispatch brief tightened this to `^[CDG][A-Z0-9]{8,}$` (minimum 8 alphanumerics after the prefix letter) to better reflect real Slack channel ID shapes. Sub-4 implemented the tighter regex.
  - **Proposed fix:** none — defensible tightening; lower-bound matches real Slack IDs (e.g. `C0A5B0ZE81E` = 1 prefix + 10 alphanumerics, well above 8). Surfaced for traceability so future readers can find the rationale if a Slack-spec change ever invalidates the `{8,}` floor.
  - **Priority hint:** none — accepted as-is.
  - **Decision:** `accepted-as-is`
  - Found while: sub-4 / WF-51 entry guard authoring.
