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

## 2026-05-24 — Post-Wave-2 regression / adjacent findings

Post-batch sibling regression after sub-12/13/14 apply. Cross-workflow scans across all 27 workflow exports for contract drift. Two adjacent findings; none blocks sprint close.

- **[WF-10] `Build WF-41 Payload` Set node emits legacy intermediate field `adminMessage`** — classification: `adjacent / cosmetic`
  - **Cause-and-effect:** The output of `Build WF-41 Payload` (a Set node feeding the `Build WF-10 Relay Envelope` Code node) names its message field `adminMessage`. The downstream Code node then maps `inp.adminMessage` → canonical `messageText` in the Relay Envelope it exports to WF-41. So the *external* contract sent to WF-41 is correct (canonical `messageText`); only the internal Set-node field name is legacy. Sub-14 fixed the consumer side (WF-41 reads `input.messageText`), but the producer side still emits via a legacy-named intermediate field. Cosmetic — no runtime impact, but inconsistent with §2.2 canonical naming for any future reader.
  - **Proposed fix:** rename `Build WF-41 Payload`'s output field from `adminMessage` to `messageText`, then update `Build WF-10 Relay Envelope` Code node to read `inp.messageText` directly. One-node-and-one-line fix.
  - **Priority hint:** low — cosmetic cleanup; no functional bug.
  - **Decision:** _open — needs user direction_
  - Found while: post-Wave-2 cross-workflow `adminMessage` scan after sub-14 (WF-41 latent bug fix).

- **[WF-11] internal Slack-payload builders emit legacy `message:` key (3 hits)** — classification: `adjacent`
  - **Cause-and-effect:** Three jsCode return blocks in WF-11 (Command Parser) build internal Slack-direction payloads with `{ channelName, message: <text> }` shape (e.g., system-status response, help-text response). Canonical WF-51 contract per §2.4 expects `{ channelId, messageText }`. These payloads are consumed by downstream Slack senders inside WF-11's flow; if those senders are WF-51 callers, the field-name mismatch would silently drop the message text. If they bypass WF-51 (calling Slack API directly with their own field-name mapping), the legacy naming is harmless but inconsistent. Sub-9 added a Validate Inputs guard at WF-11 entry but did not touch these internal builders.
  - **Proposed fix:** audit each of the 3 hits — for each, determine which downstream node consumes it and either (a) rewrite to canonical `{ channelId, messageText }` if it feeds WF-51, or (b) document the divergence with an inline rationale if it bypasses WF-51. Likely Phase 2 / next bug-fix sprint scope.
  - **Priority hint:** medium — silent-drop risk if any builder feeds WF-51 directly. Worth verifying before next go-live cycle.
  - **Decision:** _open — needs user direction_
  - Found while: post-Wave-2 cross-workflow `^\s*message:\s+` scan.

- **[WF-45] `Load User Record` Postgres SELECT not in Phase 1 scope** — classification: `adjacent / informational`
  - **Cause-and-effect:** WF-45 (Rebook Handler) has its OWN local `Load User Record` Postgres SELECT node, used by `Prepare WF-50 Payload (Rebook Payment)` Code node to source user.phone_number + user.name. This is a separate node from the WF-40 `Load User Record` that sub-12 removed — cross-workflow scan picked it up by name. WF-45 was not in Phase 1 scope; the SELECT could likely be removed by adopting the §2.1 envelope per data-contract discipline (user fields would be carried in trigger envelope).
  - **Proposed fix:** Phase 2 candidate — add WF-45 to the next envelope-discipline sprint to remove this final Load-User SELECT and consume `$('When Executed by Another Workflow').first().json.user` instead.
  - **Priority hint:** low — works correctly today; cleanup item.
  - **Decision:** `revisit-next-envelope-sprint`
  - Found while: post-Wave-2 cross-workflow refs-to-removed-Load-User-nodes scan (false-positive: same node name, different workflow).
