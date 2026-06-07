# Sprint: pre-demo-minor-fixes-31May26

**Input source:** docs/artefacts/sprints/pre-demo-minor-fixes-31May26/tasks.md
**Input hash:** 6044e408324887164d261c2b46ed0e97048e19e54e40d185ea868637bbf7d3a6
**Planned at:** 2026-05-31T11:19:25Z
**Last updated:** 2026-06-07T07:18:01Z
**Planning complete:** true
**Rolling sprint:** TRUE — `_active` marker is USER-CONTROLLED. build-sprint MUST NOT remove `_active` on batch/queue exhaustion; report "current queue done, sprint still open (rolling)" and stop. Re-invocations of plan-sprint must be ADDITIVE (plan only new PDF-NN items into this file; never destructive full-replan). input_hash mismatch is EXPECTED and is NOT a replan signal. See tasks.md "ROLLING SPRINT" header for full lifecycle/concurrency rules.
**Discover-current-state:** ran at 2026-05-31T11:19:25Z against live WF-10 (`wMh0oBRtJbvhLgOf`, 42 nodes). Result: PDF-01 condition CONFIRMED PRESENT — `Build Help Prompt` + `Call WF-51 (Help Prompt)` nodes and hardcoded "Type `HELP` to see available commands" line both still on the `free_text` branch; ZERO Gemini calls in WF-10. PDF-01 is genuinely pending, not obsolete. PDF-02/PDF-03 extend the not-yet-built PDF-01 → pending. No obsoletes detected.
**Dependency conflicts found:** — (none. PDF-02/03 are P2 and hard-depend on PDF-01 which is P0; the dependency is on a higher-priority item that runs first, so priority order and dependency order agree.)
**Priority adjustments confirmed:** none required — original priority order honoured.

**Additive planning pass — 2026-06-04T23:21:58Z (rolling sprint, append-only).** Planned new items PDF-04..PDF-09 (appended to tasks.md by the 2026-06-02 brainstorm session); existing PDF-01/02/03 history preserved untouched per rolling-sprint rule 2. tasks.md hash is now `e575e0ef0e6592db5d2e94d867759a95ce7a0cbec1add84299b60537afaf87a4` (was `6044e408…`); mismatch is EXPECTED for a rolling sprint and is NOT a replan signal.

**Discover-current-state (PDF-04..09) — ran 2026-06-04T23:21:58Z against live n8n (31 workflows fetched to disk, grepped — no payloads loaded). Fix locations DETERMINED (resolves all six `Change type: TBD`):**
- **PDF-06 / PDF-07 / PDF-08 → ONE root in WF-10 Slack Admin Handler (`wMh0oBRtJbvhLgOf`, 47 nodes).** WF-10 is the SINGLE Slack-events entry point (only workflow with a `slack/events` `event_callback` trigger that calls the relay path). It builds a relay envelope (`Build WF-10 Relay Envelope` → `Dispatch by Kind` → `Build WF-41 Payload` → `Call WF-41 (Admin->User Relay)`) and a transcript-log payload (`Build WF-60 Payload (Slack Inbound)` → `Call WF-60 Message Logger`) for EVERY inbound Slack event — including channel-join / `member_joined_channel` / bot / system / admin-command events. CONFIRMED: zero `member_joined`/`channel_join`/`subtype`/`bot_id` filtering exists anywhere in the 31 live workflows. So a join event becomes a relay candidate (PDF-07 customer-leak), fails the relay-validation guards and fires an admin alert (PDF-06 — `Build Wrong-State Alert` / `Build Phone-Absent Alert` family), and gets logged to the consultation transcript (PDF-08). All three are symptoms of the same missing genuine-message filter in WF-10. CONDITION PRESENT — genuinely pending.
- **PDF-04 / PDF-05 → ONE root across WF-30 / WF-31 / WF-43.** The customer-facing free-text LLM reply is the `Prepare Gemini Response Prompt` → `Gemini General Response` (HTTP) → `Extract Gemini Reply` → `Send …Reply via WF-50` chain, present in exactly three workflows: WF-30 Payment Pending Intent Filter (`gGJBY5fJha0Let8I`), WF-31 Payment Submitted Handler (`HB8nXudAtk9iXz7C`), WF-43 Post-Consultation Handler (`3va0M06kijgyLejf`). The prompt carries no grounded business-facts KB, so it improvises services/pricing (e.g. "yes, we offer video consultations" in payment_pending). Systemic — the grounded-KB + defer-to-astrologer fix must apply to all three consistently. CONDITION PRESENT — genuinely pending. Needs a design pass (KB content + defer rule), analogous to PDF-01 → **Design gate: true.**
- **PDF-09 → systemic surgical string fix across 7 workflows.** "Dr. Chinmay" literal found in WF-21, WF-23, WF-30, WF-31, WF-43, WF-45, WF-62; other messages use plain "Chinmay". One correct form to be picked (pending user confirmation of whether the "Dr." title is accurate) and applied across all 7. CONDITION PRESENT.
- No obsoletes detected among PDF-04..09.

**Dependency conflicts found (PDF-04..09):** none blocking. Two contract/same-root couplings recorded as deps (PDF-07/08 → PDF-06 hard same-fix; PDF-04 → PDF-05 hard same-fix; PDF-04/05 → PDF-09 soft same-workflow WF-30/31/43). WF-10 is also touched by pending PDF-02/03 (admin free_text branch) vs PDF-06/07/08 (relay branch) — different branches, soft sibling; sequential batch execution avoids the concurrent-PUT race (re-fetch live WF-10 at each pickup).

**Priority adjustments confirmed (PDF-04..09):** User directive (2026-06-04) — **execute admin-side noise / low-hanging fruit FIRST**, ahead of the P0 customer-facing items. So the next ACTIONABLE batch is **Batch 4 (WF-10 event filter — PDF-06/07/08)**; the P0 grounded-KB work (PDF-04/05, Batch 6) is deliberately sequenced LAST of the new items and is design-gated. The design-gated P2 batches 2/3 (PDF-02/03) remain deferred. **Batch 4 intentionally mixes P0/P1/P2** because PDF-06 (P1) + PDF-07 (P0) + PDF-08 (P2) are three symptoms of one inseparable WF-10 fix — splitting by priority would mean authoring the same filter three times; collapse authorised by the brainstorm note ("plan-sprint can collapse them into a single change if cleaner") and the user's same-session directive.

## Items

| ID | Status | Batch | Pri | Workflows | Depends On |
|----|--------|-------|-----|-----------|------------|
| PDF-01 | 🟢 done | 1 | P0 | WF-10 | — |
| PDF-02 | ⬜ pending | 2 | P2 | WF-10 | PDF-01 (hard) |
| PDF-03 | ⬜ pending | 3 | P2 | WF-10 | PDF-02 (hard) |
| PDF-06 | 🟢 done | 4 | P1 | WF-10 | — (carrier of the WF-10 event-filter fix) |
| PDF-07 | 🟢 done | 4 | P0 | WF-10 | PDF-06 (hard — same WF-10 fix) |
| PDF-08 | ⚪ obsolete | 4 | P2 | WF-10 | PDF-06 (hard — same WF-10 fix) |
| PDF-09 | 🟢 done | 5 | P2 | WF-20/30/31/32/42/44 | — |
| PDF-05 | 🟢 done | 6 | P0 | WF-30/31/43 | PDF-09 (soft) · Design gate |
| PDF-04 | 🟢 done | 6 | P0 | WF-30/31/43 | PDF-05 (hard — same fix), PDF-09 (soft) |
| PDF-10 | 🟢 done | 7 | P1 | WF-25 | PDF-04/05 (emerged in validation) |
| PDF-11 | 🟢 done | 7 | P2 | WF-30/43 | PDF-04/05 (soft) |
| PDF-12 | 🟢 done | 7 | P2 | WF-30 | PDF-11 (soft) |

## Batch 1 — P0

- **Items:** 1
- **Description:** PDF-01 — replace WF-10 `free_text` hardcoded HELP reply with a Gemini (`gemini-2.5-flash-lite`) admin assistant answering from a static baked-in KB, posting back via WF-51 to the same channel. Design is LOCKED (spec + verbatim prompt on disk); build is mechanical per spec §3/§8.
- **Estimated size:** M
- **Estimated tokens:** ~40K

## Batch 2 — P2

- **Items:** 1
- **Description:** PDF-02 — extend the PDF-01 assistant with current user-state context (resolve `consult-{phone}` channel → user, fetch status/name/last action, inject a "current user" block into the Gemini prompt). UNDESIGNED — requires a brainstorm/design pass to resolve open questions (no-user-row fallback to PDF-01 static behaviour, exact fields, PII boundary) BEFORE build-sprint executes. Same WF-10 node as PDF-01 → strictly serial after Batch 1.
- **Estimated size:** M
- **Estimated tokens:** ~35K

## Batch 3 — P2

- **Items:** 1
- **Description:** PDF-03 — add recent message/consultation history for the channel's user to the assistant's context. UNDESIGNED — requires a brainstorm/design pass (last-N-messages cap, PII redaction/scope, token/payload cost) BEFORE build-sprint executes. Builds on PDF-02's user-resolution + context block; same WF-10 node → strictly serial after Batch 2.
- **Estimated size:** M
- **Estimated tokens:** ~35K

## PDF-01 — WF-10 free-text → Gemini admin assistant (static knowledge)

**Status:** 🟢 done
**Started:** 2026-05-31T11:31:07Z
**Completed:** 2026-05-31T11:42:48Z
**Actual tokens:** ~95K (large lint/validate MCP responses dominated; build itself ~40K)
**Actual effort:** ~12 min
**Estimate delta:** on-bucket (planned M ~40K; the build/verify reasoning was on-bucket, MCP validate response payloads inflated the raw token count)
**Priority:** P0 | **Batch:** 1
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), `free_text` branch only.
**Build summary:** 42→47 nodes. Route free_text → `Build Gemini Request` (Code, verbatim system prompt) → `Gemini Admin Assistant` (HTTP v4.2, googlePalmApi, onError=continueRegularOutput, single attempt) → `Extract Assistant Answer` (Code, null-guarded → geminiOk/answer) → `Did Gemini Succeed?` (IF v2.2) → TRUE `Build Assistant Reply Payload` / FALSE `Build Fallback Payload` (repurposed Build Help Prompt) → converge on `Call WF-51 (Assistant)` (repurposed Call WF-51 (Help Prompt)). Pseudo-first (WF-10.pseudo Step 14a–14f). MCP strict valid:true (0 errors), lint 0 hard-rejects, dangling 0, tv floor held. jsonBody bracket-adjacency error caught + fixed mid-PUT. Backup `archive/backups/wMh0oBRtJbvhLgOf-2026-05-31-21-36.json`. **Verified live (2026-05-31T11:48Z):** synthetic Slack event_callback ("How do I approve a payment for a user?") → WF-10 exec 3390 (success) → WF-51 exec 3394 → posted to chinmay-admin-commands: "To approve a user's payment, type APPROVE PAYMENT. You must type this command in the user's own consult channel." Acceptance §7 #1 PASS. Error-path design confirmed with user: continueRegularOutput + geminiOk IF (catches 503/timeout/non-200 AND empty/safety-blocked 200), single attempt, no retry — admin-only glitch fallback. Remaining acceptance checks (§7 #2 user-advice draft, #3 off-topic decline, #4 forced-failure glitch) deferred to demo/smoke.
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** —
**Design gate:** false
**Design locked at:** 2026-05-31
**Design locked in:** docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-design.md
**Size:** M
**Estimated tokens:** ~40K

Design LOCKED — plan-ready. Verbatim Gemini system prompt to splice as-is: `docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-prompt.txt`.

Replace the `Route by Kind (Admin)` Switch `free_text` output (currently `Build Help Prompt` → `Call WF-51 (Help Prompt)`, replying "🤖 Type `HELP` to see available commands.") with a Gemini call answering Chinmay's ops + user-advice questions from a static baked-in KB, posting back via WF-51 (`wlZRK0YxnhP0b2RL`, `{channelId, messageText}`) to the same channel.

Locked behaviour: ops question → explain command + where to type it; user-advice question → explain policy AND draft a labelled, business-tone, jargon-free WhatsApp reply ("Suggested reply:"); off-topic → polite in-domain decline + HELP pointer (a SUCCESSFUL Gemini call, not an error); Gemini failure/timeout/non-200 → fallback "⚠️ technical glitch, try again in a moment." Assistant ADVISES ONLY — never executes commands; structured `admin_wide`/`user_targeted` → WF-11 branches untouched.

Build (mechanical, per spec §3 + §8): add ~5–6 nodes on `free_text` (Build Gemini Request → HTTP Gemini [onError continue] → IF success → Extract/Build WF-51 payload / fallback payload → Call WF-51); remove/repurpose `Build Help Prompt`. Reuse the Gemini HTTP pattern from the inbound intent classifier (WF-10 has no LLM call to copy). Pseudo-first on `WF-10.pseudo`; backup WF-10; jq-on-disk + curl PUT for nested-array Set edits; Write the prompt `.txt` into the node (never through a shell var); typeVersion floor to live WF-10 (Set v3.4 / IF v2.2 / Switch v3.3 / executeWorkflow v1.2).

Acceptance: spec §7 — 5 functional checks + regression that structured commands still route to WF-11.

Soft-blocks PDF-02 and PDF-03 (they extend this same Gemini node).

## PDF-02 — Admin assistant: add current user-state context

**Status:** ⬜ pending
**Priority:** P2 | **Batch:** 2
**Change type:** Structural — WF-10 (same `free_text` branch / Gemini node as PDF-01).
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** PDF-01 (hard)
**Design gate:** true
**Size:** M
**Estimated tokens:** ~35K

**Decision required:** UNDESIGNED at plan time — a brainstorm/design pass MUST resolve the open questions below and produce a locked design spec BEFORE build-sprint picks this item up. build-sprint should refuse to build until `Design gate` is cleared to false with a `Design locked in` spec path.

Open design questions:
- No-user-row case (admin-wide channel, orphaned channel): assistant falls back to PDF-01 static-only behaviour — confirm the resolution/branch.
- Exact user fields to include (status, name, last action — and any others).
- PII boundary for what user state may enter the Gemini prompt.

What: resolve `consult-{phone}` channel → user, fetch `status`/`name`/last action, and inject a "current user" context block into the PDF-01 system prompt so "this user…" questions get user-specific answers. Adds a DB-lookup + channel→phone→user resolution step before the Gemini call.

Hard dep on PDF-01 (contract coupling): this item EXTENDS the exact Gemini node PDF-01 creates — the system prompt PDF-01 splices in (`docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-prompt.txt`) and PDF-01's `Build Gemini Request` / payload structure are the surface this item modifies. Build only after PDF-01 has landed and re-fetch live WF-10 to see PDF-01's actual node shape; do not author against an assumed prompt/payload. Same-workflow node → strictly serial after PDF-01 (concurrent WF-10 update race otherwise).

## PDF-03 — Admin assistant: add user message/consultation history context

**Status:** ⬜ pending
**Priority:** P2 | **Batch:** 3
**Change type:** Structural — WF-10 (same `free_text` branch / Gemini node).
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** PDF-02 (hard)
**Design gate:** true
**Size:** M
**Estimated tokens:** ~35K

**Decision required:** UNDESIGNED at plan time — a brainstorm/design pass MUST resolve the open questions below and produce a locked design spec BEFORE build-sprint picks this item up. build-sprint should refuse to build until `Design gate` is cleared to false with a `Design locked in` spec path.

Open design questions:
- Last-N-messages cap (how much history is actually useful).
- PII redaction / scope of message + consultation history entering the LLM prompt.
- Token/payload cost of injecting history.

What: add recent message / consultation history for the channel's user to the assistant's context so it can answer questions needing conversation backstory.

Hard dep on PDF-02 (contract coupling): builds on the user-resolution + "current user" context block PDF-02 adds — it appends history to that block. Build only after PDF-02 has landed and re-fetch live WF-10 to see PDF-02's actual resolution + context-block shape; do not author against an assumed structure. Same-workflow node → strictly serial after PDF-02.

## Batch 4 — WF-10 Slack-event genuine-message filter (PDF-06 + PDF-07 + PDF-08) — NEXT ACTIONABLE

- **Items:** 3 (PDF-06 ✅, PDF-07 ✅ — built as ONE WF-10 change; PDF-08 ⚪ obsolete/won't-do 2026-06-06 — admin commands kept in transcript by design, see PDF-08 item)
- **Description:** Single-root fix in WF-10 Slack Admin Handler (`wMh0oBRtJbvhLgOf`). WF-10 currently builds a relay envelope, an admin alert, and a WF-60 transcript-log entry for EVERY inbound Slack event in a consult channel — including channel-join / `member_joined_channel` / bot / system / admin-command events. Add a genuine-message classifier/guard so that ONLY a deliberate astrologer-typed consult-channel message (event.type=`message`, no `subtype`, real human `user`, not a bot, not an admin command) proceeds to the relay (`Call WF-41`), the "not relayed/wrong-state/phone-absent" admin alert, and the WF-60 transcript log. Non-genuine events are dropped silently from all three paths. Resolves: PDF-07 (no join/system event ever forwarded to the customer — P0 leak), PDF-06 (no false "message not relayed" admin alarms on channel open — P1), PDF-08 (transcript contains only real customer↔astrologer messages, not join lines or admin commands — P2).
- **Execution note:** Runs NEXT per the 2026-06-04 user directive ("admin-side noise / low-hanging fruit first"), ahead of design-gated batches 2/3 and the P0 KB batch 6. Mixed priority is intentional & inseparable (see header note). build-sprint: re-fetch live WF-10 first (it was last changed by PDF-01); the relay/log branch is distinct from PDF-01's `free_text` admin-assistant branch.
- **Change type:** Structural — single workflow (WF-10).
- **Estimated size:** M
- **Estimated tokens:** ~32K

## Batch 5 — PDF-09 consistent astrologer naming — DONE (2026-06-05)

- **Items:** 1 (PDF-09) — ✅ done
- **Decision:** User chose **"Dr. Chinmay"** (2026-06-05).
- **Description:** Surgical string fix. Scope corrected during the audit (see PDF-09 item): the 7 workflows that already had "Dr. Chinmay" were verified already-consistent; the fix upgraded plain customer-facing "Chinmay" → "Dr. Chinmay" in 6 OTHER workflows (WF-32/20/31/30/42/44). Brand "Chinmay Astro", UPI payee, and LLM prompts deliberately excluded.
- **Change type:** Surgical / parametric — multi-workflow (6), customer message strings. Batch Surgical (Step 5d), 6× curl PUT all 200.
- **Estimated size:** S (planned) / M (actual — audit-driven)

## Batch 6 — PDF-04 + PDF-05 grounded business-facts KB for customer replies (WF-30/31/43) — DONE (2026-06-06)

- **Items:** 2 (PDF-05 root ✅ + PDF-04 symptom ✅ — built as ONE fix). Scope expanded 3→4 nodes (WF-43 opted-out prompt added per audit, user-approved). Design pass + build collapsed into one session; spec `docs/artefacts/specs/2026-06-06-pdf-04-05-grounded-business-facts-kb-design.md`.
- **Description:** Give the customer-facing free-text LLM reply a single trusted set of business facts (offering = text-only consultation; price; what's included; explicitly NOT offered = video/phone) and a defer-to-astrologer rule for anything outside it. Apply the grounded KB + defer behaviour consistently to the `Prepare Gemini Response Prompt` of WF-30 (`gGJBY5fJha0Let8I`), WF-31 (`HB8nXudAtk9iXz7C`), and WF-43 (`3va0M06kijgyLejf`). Resolves PDF-04 (no fabricated services) and PDF-05 (no improvised/contradictory pricing). **Design-gated** — needs a brainstorm/design pass to author the KB content + defer rule (analogous to PDF-01's locked KB) BEFORE build. Soft dep on PDF-09 (same 3 workflows — let the cosmetic string swap land first, then re-fetch live).
- **Change type:** Structural — multi-workflow (3, in lockstep). KB design pass first.
- **Estimated size:** L
- **Estimated tokens:** ~50K (build) + a separate design/brainstorm session

## PDF-06 — False "message not relayed" alarms shown to admin when a consultation channel opens

**Status:** 🟢 done
**Started:** 2026-06-05T16:22:00Z
**Completed:** 2026-06-05T16:30:00Z
**Actual tokens:** ~60K (shared across PDF-06/07/08 — one WF-10 change; incl. .md regen + 2 large registry-row reads)
**Actual effort:** ~70 min (incl. design Q&A, Option-B decision, two-step go-ahead, live verification)
**Estimate delta:** on-bucket for the shared Batch-4 change (planned M ~32K for all three; raw token count inflated by the large pre-existing WF-10 registry row + AS-IS .md reads, the build itself was ~M)
**Priority:** P1 | **Batch:** 4
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), relay/alert branch.
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** — (this is the CARRIER item for the shared WF-10 event-filter fix; PDF-07 + PDF-08 hard-depend on it)
**Design gate:** false
**Size:** S (carrier; the WF-10 change is shared across PDF-06/07/08 — see Batch 4 ~32K total)
**Estimated tokens:** ~12K (incremental share)

Admin-facing symptom: on consultation-channel creation, members joining the new channel are processed by WF-10 as relay candidates; the relay-validation guards fail on them and fire admin alerts (`Build Wrong-State Alert` / `Build Phone-Absent Alert` family) reading like "⚠️ Message not relayed — WhatsApp send skipped", even though no admin typed anything. The shared fix (a genuine-message classifier in WF-10) drops join/system events before they reach the alert path, so the false alarms stop.

Acceptance: opening a consult channel and people joining it produces NO "message not relayed" warnings; such a warning appears only when the admin actually types a message that genuinely can't be delivered.

Same root as PDF-07 (customer-leak) and PDF-08 (transcript). Build all three as ONE WF-10 PUT.

**Build summary (2026-06-05):** Added one `Genuine Message?` IF (v2.2) in series after `Human Vs Bot Message?` (TRUE), before `Extract Required Fields`. Condition `={{ $json.body.event.type === 'message' && !$json.body.event.subtype && !$json.body.event.bot_id }}` (boolean=true, matches the workflow's `State Match?` single-bool pattern → no strict-validation throw on absent subtype/bot_id). FALSE → silent drop (`lint-allow: if-false-disconnect-bypass` in notes). 47→48 nodes; jq-on-disk + curl PUT (no MCP). Pseudo-first: WF-10.pseudo Step 5→5a/5b + PDF-08 Notes. Backup `archive/backups/wMh0oBRtJbvhLgOf-2026-06-05-16-22.json`. Lint hook exit 0; IF tv floor 2.2 held. Impact: no parents (Slack webhook entry); children WF-11/41/51/60 contracts unchanged; no siblings (zero genuine-message filtering elsewhere in 31 workflows). No nodes removed/renamed → no dangling refs; FALSE dead-ends with no convergence → no conditionally-skipped-node refs. **Verified live:** exec 3555 (member_joined_channel → `Genuine Message?` FALSE `[0,1]` → dropped, zero downstream) + exec 3556 (genuine message → TRUE `[1,0]` → proceeds to Extract Required Fields; downstream `Find Channel` errored only on the synthetic fake channel id, confirming TRUE routing). `messages` table clean (no junk rows). PDF-06 ✅ + PDF-07 ✅ fully resolved; PDF-08 partial (see PDF-08 item).

## PDF-07 — Channel housekeeping events can be delivered to the customer as if from the astrologer

**Status:** 🟢 done
**Started:** 2026-06-05T16:22:00Z
**Completed:** 2026-06-05T16:30:00Z
**Actual tokens:** shared with PDF-06 (one WF-10 change)
**Actual effort:** shared with PDF-06
**Estimate delta:** shared Batch-4 change — on-bucket
**Priority:** P0 | **Batch:** 4
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), relay branch.
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** PDF-06 (hard — SAME WF-10 fix; the genuine-message classifier added for PDF-06 is exactly what stops join events reaching `Call WF-41` → the customer)
**Design gate:** false
**Size:** S (shared WF-10 change)
**Estimated tokens:** ~10K (incremental share)

Customer-facing risk (P0): routine channel events (join/leave/system) are built into a relay envelope and sent to `Call WF-41 (Admin->User Relay)` → WhatsApp. In the observed case it only failed to reach the customer because the consultation wasn't active yet, but mid-consultation a customer could receive "so-and-so has joined the channel". Only deliberate astrologer-typed messages may ever be forwarded.

Acceptance: no automatic channel event (join/leave/system) is ever forwarded to the customer; only deliberate astrologer messages reach WhatsApp.

Hard contract coupling with PDF-06: both resolved by the single WF-10 genuine-message guard. Build together; do not author a separate filter.

## PDF-08 — Consultation transcript polluted with system/command entries

**Status:** ⚪ obsolete
**Obsolete at:** 2026-06-06T21:14:05Z
**Obsolete reason:** WON'T DO — the remaining admin-command-exclusion scope is a non-issue by design. User decision (2026-06-06): the admin's typed commands (APPROVE PAYMENT, CLOSE, etc.) are a legitimate part of the admin↔user conversation and belong in the transcript. They form the audit trail that explains *how* the user reached their current status — excluding them would remove exactly the records that reconstruct the state history. The channel-housekeeping/system/join-line portion of PDF-08's original acceptance was already met by the Batch-4 `Genuine Message?` gate (shipped with PDF-06/07); that part stands. No WF-60 re-wire will be done. Future audits: do NOT re-flag admin commands in the transcript as pollution — they are kept deliberately. See memory [[project_pdf08_admin_commands_in_transcript]].
**Priority:** P2 | **Batch:** 4
**Decision made (2026-06-05, Option B):** User chose to defer the admin-command-exclusion portion of this item. The Batch-4 `Genuine Message?` gate (landed with PDF-06/07) already removes channel-housekeeping/system/join lines from the `chinmay_astro.messages` transcript — that PART of PDF-08's acceptance is met. The REMAINING work (exclude the admin's own typed commands APPROVE/CLOSE from the transcript) requires moving the WF-60 logging side-branch off `Extract Required Fields` onto the validated `relay_text` path so only genuine astrologer→customer consultation messages are persisted; the WF-60 Code node would re-read from `Classify User Channel Message` / `Extract Required Fields` (both always-executed on that branch). Deferred to a later batch to keep the pre-demo blast radius minimal.
**Decision superseded (2026-06-06):** The deferral above is now resolved as WON'T DO (see Obsolete reason). The remaining scope will not be built.
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), WF-60 logging branch.
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** PDF-06 (hard — SAME WF-10 fix; the genuine-message classifier also gates `Build WF-60 Payload (Slack Inbound)` → `Call WF-60 Message Logger`)
**Design gate:** false
**Size:** S (shared WF-10 change)
**Estimated tokens:** ~10K (incremental share)

Admin-facing record hygiene (P2): the stored consultation transcript (via `Call WF-60 Message Logger`) mixes channel-join lines and the admin's own command keystrokes (e.g. APPROVE PAYMENT) in with real customer↔astrologer dialogue. The same WF-10 genuine-message guard must also gate the WF-60-logging path so only real customer↔astrologer messages are persisted.

Acceptance: the consultation transcript contains only real customer and astrologer messages; channel housekeeping events and admin commands are excluded.

Same root as PDF-06/07. Verify the guard covers BOTH the relay path AND the WF-60-logging path (they are separate downstream branches of the same `Build WF-10 Relay Envelope`).

## PDF-09 — Inconsistent "Dr. Chinmay" vs "Chinmay" naming to the customer

**Status:** 🟢 done
**Started:** 2026-06-05T16:41:00Z
**Completed:** 2026-06-05T16:50:00Z
**Actual tokens:** ~70K (full-corpus audit of 113 unique "Chinmay" contexts to separate person-name from brand/payee/prompt dominated; the swap itself was small)
**Actual effort:** ~25 min
**Estimate delta:** +1 bucket (planned S ~28K, actual ~70K = M-band — the audit to safely scope person-name vs "Chinmay Astro" brand / UPI payee / LLM prompts was larger than a flat 7-workflow string swap; the plan assumed the 7 Dr.-workflows were the only surface, but the real fix was 6 *other* workflows + confirming the 7 already-consistent)
**Priority:** P2 | **Batch:** 5
**Change type:** Surgical / parametric — multi-workflow (6), customer-facing message string(s) per workflow.
**Decision made (2026-06-05):** User chose **"Dr. Chinmay"** as the single correct form, applied consistently to every customer-facing message that names the astrologer.
**Workflows (actually edited):** WF-32, WF-20, WF-31, WF-30, WF-42, WF-44
**n8n IDs:** `emUOLWVZiNVxcOe3` (WF-32), `LgIDj1v4ZbCPlX25` (WF-20), `HB8nXudAtk9iXz7C` (WF-31), `gGJBY5fJha0Let8I` (WF-30), `fx70vqyJtRdF2DgR` (WF-42), `Du2CJ3OTohRFZYoA` (WF-44)
**Depends on:** —
**Design gate:** false
**Size:** S (planned) / M (actual — audit-driven)

**Audit & scope correction:** The plan listed the 7 workflows where "Dr. Chinmay" *already* appeared (WF-21/23/30/31/43/45/62) on the assumption the chosen form might be plain "Chinmay" (which would have *downgraded* them). Since the user chose "Dr. Chinmay", those 7 are already correct — verified their remaining plain "Chinmay" is all brand ("Chinmay Astro"), UPI payee, or LLM-prompt text. The real fix was upgrading plain customer-facing "Chinmay" (the person) → "Dr. Chinmay" in **6 OTHER workflows**: WF-32 ("…approve your consultation"), WF-20 ("will respond" / "will approve it shortly" / "new one with Chinmay" ×3), WF-31 ("will verify"), WF-30 ("will be ready"), WF-42 ("consultation with Chinmay is complete"), WF-44 ("experience with Chinmay's consultation service").

**Deliberately excluded (NOT customer name-of-person):** "Chinmay Astro" (business/brand name — never "Dr. Chinmay Astro"); UPI payee `+91-9653240263 (Chinmay Mujumdar)` (bank account holder name, must match for payments); WF-10 admin-assistant Gemini prompt + intent-classifier prompts (internal LLM instructions, never shown to a customer); credential names, `"authors"` metadata, contact email.

**Build:** Batch Surgical (build-workflow Step 5d) — backed up all 6 (`archive/backups/<uuid>-2026-06-05-16-41.json`), applied per-file `jq walk(gsub(...))` with a `(?<!Dr\. )` lookbehind guard (no double-"Dr."), 6× curl PUT (all 200, doubleDr=0), exported, secrets scan clean, lint clean (20 advisories all pre-existing Contract-First/Step-5g — none from this change). Spot-checked WF-20/42/44 live: replacements correct, brand intact. Final corpus scan: only remaining plain "Chinmay + verb" is inside the WF-10 Gemini prompt (correctly excluded).

Acceptance: ✅ a single correct form of the astrologer's name/title ("Dr. Chinmay") is used consistently in every customer-facing message.

## PDF-05 — Bot improvises service/pricing answers without a reliable source of truth

**Status:** 🟢 done
**Started:** 2026-06-06T21:14:05Z
**Completed:** 2026-06-06T22:23:51Z
**Actual tokens:** ~85K (design pass live trace of WF-25/30/31/43 routing + 4-node prompt authoring + Batch-Surgical build; design+build in one session)
**Actual effort:** ~70 min (live routing trace, 5-point design Q&A, 4th-node scope decision, build + verify)
**Estimate delta:** on-bucket (planned L ~50K build + separate design session; design+build collapsed into one session, ~85K combined)
**Priority:** P0 | **Batch:** 6
**Change type:** Structural — multi-workflow (WF-30/31/43, in lockstep), customer free-text Gemini-reply prompt.
**Workflows:** WF-30, WF-31, WF-43
**n8n IDs:** `gGJBY5fJha0Let8I` (WF-30), `HB8nXudAtk9iXz7C` (WF-31), `3va0M06kijgyLejf` (WF-43)
**Depends on:** PDF-09 (soft — same 3 workflows; let the naming string swap land first)
**Design gate:** false
**Design locked at:** 2026-06-06
**Design locked in:** docs/artefacts/specs/2026-06-06-pdf-04-05-grounded-business-facts-kb-design.md
**Size:** L
**Estimated tokens:** ~50K (build) + separate design session

**Decision made (2026-06-06):** Design pass completed + locked (spec above). User decisions: text-only offering (audio/video/auto-pay "coming soon" only when asked); ₹500 plain (no "introductory"); ONE question/topic scope, multi-message at Dr. Chinmay's discretion until CLOSE; topic-gated defer rule (generic astrology answerable / personal → defer to Dr. Chinmay); single authored source (byte-identical block across nodes). **Scope expanded** from 3 → 4 nodes: audit found WF-43 `Prepare Gemini Prompt (Opted-Out)` with identical fabrication risk; user approved including it.

**Build summary (2026-06-06):** Batch Surgical (build-workflow Step 5d). Grounded `KNOWN FACTS` block + 4-bucket topic-gated `HOW TO RESPOND` rules spliced into 4 `Prepare Gemini …` Code nodes across 3 workflows: WF-30 (1), WF-31 (1), WF-43 (2 — `Prepare Gemini Response Prompt` + `Prepare Gemini Prompt (Opted-Out)`, both keep their `valid_user_message` JSON wrapper + no-pay/REBOOK guard). Routing verified live first: each node reached only on WF-25 `general_enquiry`. jq --rawfile splice (code authored to .txt, never via shell var) → 3× curl PUT (all 200; WF-43 both edits in one PUT). Backups `archive/backups/<uuid>-2026-06-06-22-22.json`. Verified live: factsNodes 1/1/2, defer-line 1/1/2, node counts unchanged (12/15/32), all active; 4× `node --check` JS-OK; export + secrets scan clean. Acceptance (no-fabricated-service / consistent-price / personal-defer / off-topic-no-defer-line) to confirm at demo/smoke.

Root item (PDF-04 is its symptom): the customer-facing free-text LLM reply (`Prepare Gemini Response Prompt` → `Gemini General Response` → `Extract Gemini Reply` → `Send …Reply via WF-50`) exists in WF-30/31/43 with NO grounded KB, so it improvises/contradicts itself on services & pricing. Inject the same trusted business-facts KB + defer rule into all three `Prepare Gemini Response Prompt` nodes consistently. Re-fetch each live workflow at build (post-PDF-09).

Open design questions: exact KB content (canonical offering/price/inclusions + not-offered list); defer-to-astrologer phrasing; whether to share one KB string across the 3 prompts (single source of truth) vs per-state copies; consistency of fallback when Gemini is uncertain.

Acceptance: factual questions about offering/price/inclusions are answered consistently and correctly from the trusted source; anything outside it is deferred to the astrologer, never guessed.

P0 but sequenced LAST of the new items per user directive (admin-side noise first). Same fix covers PDF-04.

## PDF-04 — Bot tells customers it offers services that don't exist

**Status:** 🟢 done
**Started:** 2026-06-06T21:14:05Z
**Completed:** 2026-06-06T22:23:51Z
**Actual tokens:** shared with PDF-05 (one grounded-KB fix across the 4 nodes)
**Actual effort:** shared with PDF-05
**Estimate delta:** shared Batch-6 change — on-bucket
**Priority:** P0 | **Batch:** 6
**Change type:** Structural — multi-workflow (WF-30/31/43), customer free-text Gemini-reply prompt. SAME fix as PDF-05.
**Workflows:** WF-30, WF-31, WF-43
**n8n IDs:** `gGJBY5fJha0Let8I` (WF-30), `HB8nXudAtk9iXz7C` (WF-31), `3va0M06kijgyLejf` (WF-43)
**Depends on:** PDF-05 (hard — SAME grounded-KB fix; the "not-offered" list authored for PDF-05 is exactly what stops the "yes, we offer video consultations" fabrication), PDF-09 (soft — same workflows)
**Design gate:** false (cleared with PDF-05)
**Design locked in:** docs/artefacts/specs/2026-06-06-pdf-04-05-grounded-business-facts-kb-design.md
**Size:** S (shared with PDF-05)
**Estimated tokens:** ~8K (incremental share)

Symptom of PDF-05: with no grounded KB the assistant asserted a non-existent video offering. Resolved by the same fix — the `KNOWN FACTS` "audio/video … NOT available yet — coming soon" entry + the "never invent beyond KNOWN FACTS" rule replace the old narrow "don't invent prices" guard, across all 4 nodes (incl. WF-43 opted-out). See PDF-05 build summary. Acceptance (no "yes, we offer it" for video/audio) to confirm at demo/smoke.

Acceptance: asking about a service that isn't offered never yields a "yes, we offer it" answer; the bot states the actual offering plainly or defers to the astrologer. No fabricated services/capabilities in any automated customer reply.

## Batch 7 — customer-reply UX hardening (emerged during PDF-04/05 live validation, 2026-06-07) — DONE

- **Items:** 3 (PDF-10 WF-25 routing fix · PDF-11 button re-attach · PDF-12 payment-instruction consistency). All surfaced and built during the live test session for PDF-04/05; tested working on user 61466927921 before commit.
- **Change type:** Structural (WF-25 prompt; WF-30/43 reply-payload nodes).

## PDF-10 — WF-25 mis-routes service/non-text/astrology questions away from the grounded reply

**Status:** 🟢 done
**Started:** 2026-06-06T23:00:00Z
**Completed:** 2026-06-06T23:10:00Z
**Priority:** P1 | **Batch:** 7
**Change type:** Structural — single workflow (WF-25 Intent Classifier `eTV1lUcYrXBg2q2T`), classifier prompt.
**Workflows:** WF-25
**n8n IDs:** `eTV1lUcYrXBg2q2T`
**Depends on:** — (emerged during PDF-04/05 validation)
**Design gate:** false

Surfaced in validation: "How much is audio consultation and how do I get it" and "When will I get a job?" classified `wants_consultation` (the def's "or is asking about booking" clause) → routed to the canned payment reminder, bypassing the grounded Gemini KB reply (PDF-04/05). Fix (user-directed scope, 2026-06-06): narrowed `wants_consultation` to ONLY a clear intent to begin the text-based WhatsApp consultation; routed service/offering/pricing/how-to questions, non-text modality requests (audio/video/phone), and astrology-adjacent topics (gems/mantra/remedies/personal life questions) to `general_enquiry` → defer to the Gemini nodes.

**Build summary:** edited `Prepare Intent Request` Code node (2 category defs). Impact analysis cleared all 4 callers: WF-30/31 improve (more questions reach grounded reply), WF-43 unaffected (both categories already → Gemini), WF-40 doesn't branch on intent category. Backup `archive/backups/eTV1lUcYrXBg2q2T-2026-06-06-22-22.json`. PUT 200; JS-OK; verified live — re-test of both messages now routes `general_enquiry` → Gemini (audio "coming soon"; job question deferred to Dr. Chinmay).

## PDF-11 — Action buttons scroll away after general-enquiry Q&A

**Status:** 🟢 done
**Started:** 2026-06-06T23:28:00Z
**Completed:** 2026-06-06T23:35:00Z
**Priority:** P2 | **Batch:** 7
**Change type:** Structural — WF-30 (`gGJBY5fJha0Let8I`) + WF-43 (`3va0M06kijgyLejf`), reply-payload nodes.
**Workflows:** WF-30, WF-43
**n8n IDs:** `gGJBY5fJha0Let8I`, `3va0M06kijgyLejf`
**Depends on:** PDF-04/05 (soft — same reply nodes)
**Design gate:** false

After several general-enquiry replies, the original action button (sent once at form submission / consultation close) is scrolled far up. WF-50 already supports interactive sends (`messageType:'interactive'`, passthrough trigger); button taps match by reply id regardless of carrier message, so re-sending needs no router change.

**Build summary:** WF-30 — `Extract Gemini Reply` (general-enquiry) and `Prepare Payment Reminder` (booking-intent) now send interactive messages re-attaching the `payment_completed` "Payment Completed ✓" button; `Send Payment Reminder via WF-50` switched to passthrough (`workflowInputs.value={}`) so interactivePayload flows through. WF-43 — `Build Reply Payload` converted Set→Code (typeVersion 2, floor), re-attaching the 3 post-consult buttons (`btn_feedback`/`btn_rebook`/`btn_done`). Backups `*-2026-06-06-23-28.json`. PUTs 200; JS-OK; verified live (WF-30 button on enquiry + reminder paths; WF-43 3 buttons on closed-state replies). Scope: WF-31 deliberately excluded (no user action in payment_submitted).

## PDF-12 — Inconsistent payment instructions in payment_pending replies

**Status:** 🟢 done
**Started:** 2026-06-07T00:10:00Z
**Completed:** 2026-06-07T00:21:00Z
**Priority:** P2 | **Batch:** 7
**Change type:** Structural — single workflow (WF-30 `gGJBY5fJha0Let8I`), reply nodes.
**Workflows:** WF-30
**n8n IDs:** `gGJBY5fJha0Let8I`
**Depends on:** PDF-11 (soft — same WF-30 reply nodes)
**Design gate:** false

The general-enquiry path's payment CTA was Gemini-phrased — incomplete (no UPI handle/payee) and inconsistent ("via GPay" vs "via GPay/UPI"), while the reminder path had the full deterministic block. Fix (user chose deterministic-block option, 2026-06-07): one canonical `PAYMENT_DETAILS` block (full UPI handle + payee) appended in code to both `Extract Gemini Reply` and `Prepare Payment Reminder`; the Gemini prompt told to stop phrasing payment (may still state ₹500 price if asked) so it never improvises payment instructions.

**Build summary:** edited 3 WF-30 nodes (`Prepare Gemini Response Prompt`, `Extract Gemini Reply`, `Prepare Payment Reminder`); identical `PAYMENT_DETAILS` literal in both reply nodes (single authored source). Defensive reply-length cap (800 chars) to stay under WhatsApp's 1024-char interactive body limit. Backup `archive/backups/gGJBY5fJha0Let8I-2026-06-06-23-28-pre-paymentconsistency.json`. PUT 200; JS-OK; verified live — every payment_pending reply ends with the identical full payment block + Payment Completed button.
