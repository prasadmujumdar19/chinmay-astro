# Sprint: pre-demo-minor-fixes-31May26

**Input source:** docs/artefacts/sprints/pre-demo-minor-fixes-31May26/tasks.md
**Input hash:** 633b9b258285df5821dbe3f1cff90cce62b268b5ae5d3c6efe33fc281579052c
**Planned at:** 2026-05-31T11:19:25Z
**Last updated:** 2026-06-08T07:52:58Z
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

**tasks.md reconciliation pass — 2026-06-08T03:08:50Z (rolling sprint, bookkeeping only — NOT a replan).** PDF-10..PDF-14 emerged ad-hoc during live build/validation sessions (Batch 7 + Batch 8) and were planned+built+verified directly into this `state.md`, but were never recorded in the source list `tasks.md`. Backfilled them into `tasks.md` now (5 Summary rows + 5 H3 blocks, marked "emerged during implementation"); also synced the stale `🆕 triaged` statuses of PDF-01..09 in `tasks.md` to match their real state here (done / ⚪ obsolete / planned-pending-build). **No item renumbered** — every `PDF-NN` keeps its ID. `tasks.md` SHA recomputed after the edits and recorded above as the new `Input hash` (`633b9b25…`, was `e575e0ef…` after the PDF-04..09 pass and `6044e408…` at original plan). This file's item set (PDF-01..14) now exactly matches the planned/built history; **PDF-15..PDF-19 are present in `tasks.md` but intentionally NOT yet in this `state.md`** — they are the next additive plan-sprint bunch (the 24h-window deliverability cluster, brainstormed 2026-06-08). Next plan-sprint should plan PDF-15 onward additively and find no orphaned/unaccounted items.

**Additive planning pass — 2026-06-08T06:51:00Z (rolling sprint, append-only).** Planned the 24h-window deliverability cluster **PDF-15..PDF-19** (Batches 9–12) into this `state.md`; existing PDF-01..14 history untouched per rolling-sprint rule 2. `tasks.md` hash unchanged (`633b9b25…`) — PDF-15..19 were already present in the source from the 2026-06-08 brainstorm; this pass only adds them to `state.md`. Grounding spec: `docs/artefacts/specs/2026-06-08-24h-window-deliverability-design.md`.

- **Discover-current-state basis:** the SSH tunnel was DOWN this session, so no fresh live grep was run. The 2026-06-08 brainstorm session verified all five conditions against live n8n with fresh `.md` projections (pseudo==live) earlier the same day — that verification is the discover-current-state basis. No obsoletes detected. If a fresh re-grep is wanted, reopen the tunnel before build-sprint Batch 9.
- **Fix-location map (from registry, confirmed live by the brainstorm):** PDF-15/16 → relay path **WF-41 Admin→User Relay** (`6PzJRZsF7k2d9hV7`) → **WF-50 Send WhatsApp** (`BUVun38WEKb12zg9`), in-channel notice via **WF-51** (`wlZRK0YxnhP0b2RL`); window-state from `chinmay_astro.messages` `MAX(created_at) WHERE direction='inbound'`. PDF-17 → **WF-34 Payment Rejection Processor** (`se82n3MUQ9xE5aEr`). PDF-18 → **NEW WF-7x** scheduled job (project's first background workflow). PDF-19 → **WF-42 Consultation Closer** (`fx70vqyJtRdF2DgR`) + the post-close button-tap handler.
- **Design decisions LOCKED this session (no design-gates remain — build-sprint implements directly).** All grounded in Meta docs (citations embedded per item). DD-A: relay stays **window-conditional** — free-form in-window (full fidelity, no constraint, free per M2), template only out-of-window. DD-B window source = `messages` table (no new write on relay path). DD-C out-window path = **pre-process to template-safe** (collapse newlines→spaces per M4 ban, collapse 4+ spaces, split >~900 chars into "(1/N)" parts) then deliver via the relay-reply template — **no bounce-back/retype path**; any residual Meta send failure is surfaced by PDF-16 (the failure backstop). DD-D relay-reply template body = *"Sorry for the delayed response to your message. Here's the response from Dr. Chinmay: {{1}}"* (apology/service framing chosen over a bare `{{1}}` to reduce Meta utility-approval rejection risk + correct customer tone after a gap). DD-E fixed-content messages (rejection PDF-17, close PDF-19) = **always a template** (DD-1), no window logic. DD-F nudge (PDF-18) = threshold **18h**, poll **every 2h**, repeat ~3–4× across the 18→24h stretch, gated on `unanswered` (`last_inbound > last_outbound`), self-terminating at 24h (window closed → relay goes template/charged → nudge has no purpose).
- **Meta grounding records (verified 2026-06-08):** M1 non-template only in-window ([pricing](https://developers.facebook.com/docs/whatsapp/pricing)); M2 utility templates free in-window, charged outside ([July 2025 pricing](https://developers.facebook.com/docs/whatsapp/pricing/updates-to-pricing/)); **M4 template parameters cannot contain newlines / tabs / 4+ consecutive spaces, body ≤1024 chars** ([guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines/), [error-code ref](https://www.heltar.com/blogs/all-meta-error-codes-explained-along-with-complete-troubleshooting-guide-2025-cm69x5e0k000710xtwup66500)); M5 template quick-reply tap arrives in a different webhook shape than an interactive `button_reply` ([template components](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/components)); unused templates are NOT deleted but may need **re-approval after ~90 days inactivity**, and quality-pausing is driven by negative feedback/low engagement, not non-use ([template statuses](https://help.gohighlevel.com/support/solutions/articles/155000001623-whatsapp-template-statuses-and-best-practice), [pacing & pausing](https://academy.insiderone.com/docs/whatsapp-template-pacing-and-pausing)).
- **External prerequisite (gates build, async Meta approval):** 3 templates must be submitted+approved before their builds — **relay-reply** (new, PDF-15 — submit EARLIEST; thin-content utility templates carry elevated rejection risk), **payment-rejection** (new, PDF-17), **consultation_closed_feedback** (existing, PDF-19 — rewrite body to match current close copy + carry all 3 quick-reply buttons). PDF-16 and PDF-18 have NO template dependency.

**Template provisioning update — 2026-06-08T07:45:22Z.** User created the templates in Meta; all **Active** (= approved/sendable; "Quality pending" is just the un-rated new-template state, not a blocker). **Final approved names (supersede the planning-time names above — build MUST target these exact names + language code):**
- **`astrology_service_update`** (Utility) = the relay-reply template for **PDF-15** (renamed from `relay-reply` to read as a genuine utility template). Body retains the apology framing + `{{1}}`.
- **`payment_rejection`** (Utility) = **PDF-17**. Body trimmed by user at creation (starts *"Sorry, but we couldn't verify your pa…"*) — build uses the APPROVED template body verbatim, not the old WF-34 interactive copy.
- **`consultation_closed`** (Utility) = **PDF-19** — NEW template replacing `consultation_closed_feedback`. The original `consultation_closed_feedback`, when its body was edited, was **reclassified by Meta to Marketing** (unusable here — Marketing is also window-gated). User created `consultation_closed` fresh with trimmed body to keep it Utility. **PDF-19 must reference `consultation_closed`, NOT `consultation_closed_feedback`.**
- **`consultation_activated`** (Utility, existing) — payment approval, untouched.
- **OPEN before build (list view hides these; trimmed bodies may have dropped them):** confirm `consultation_closed` still carries all 3 quick-reply buttons (Leave Feedback / Book Again / Done, thanks) + whether it kept a `{{1}}` name var; confirm `payment_rejection` still carries the retry button (Payment Completed ✓) + var count; confirm `astrology_service_update` has exactly one `{{1}}`; confirm the language code matches `consultation_activated` for all sends. Build-sprint Batch 9/10/12 entry must verify the exact approved template structure (name, language, body params, button params) before authoring the WF-50 template send — a mismatch fails the send (Meta error 132000/132001).
- **Dependency conflicts found (PDF-15..19):** none. PDF-16(P1)→PDF-15(P0) and PDF-18(P1)→PDF-15(P0) both point at a higher-priority item that runs first; PDF-19(P2) sibling of PDF-17(P1) runs later — priority order and dependency order agree. Not a single-root cluster (each is a distinct fix in a distinct workflow) → standard priority-tier batches, no mixed-priority collapse.

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
| PDF-13 | 🟢 done | 8 | P2 | WF-31 | PDF-12 (soft — same canonical-block pattern) |
| PDF-14 | 🟢 done | 8 | P2 | WF-43 | PDF-11 (soft — same WF-43 reply path) |
| PDF-15 | 🟢 done | 9 | P0 | WF-41/50/51 | template:`astrology_service_update` ✅ Active · PDF-18 (soft — shared window source) |
| PDF-16 | ⬜ pending | 10 | P1 | WF-41/34/42 | PDF-15 (soft — backstop for its residual send failures) |
| PDF-17 | ⬜ pending | 10 | P1 | WF-34 | template:`payment_rejection` ✅ Active · PDF-16 (soft — same WF-34) · PDF-19 (soft sibling) |
| PDF-18 | ⬜ pending | 11 | P1 | WF-7x (new) | PDF-15 (soft — shared `messages` window source) |
| PDF-19 | ⬜ pending | 12 | P2 | WF-42 + button handler | template:`consultation_closed` ✅ Active (NOT `consultation_closed_feedback` — that one Meta reclassified to Marketing) · PDF-17 (soft sibling) |

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

## Batch 8 — reply-style consistency (emerged during PDF-11/12 live validation, 2026-06-07) — DONE

- **Items:** 2 (PDF-13 WF-31 under-review consistency · PDF-14 WF-43 welcome/REBOOK UX). Built pseudo-first (WF-31/43 `.pseudo` revised before live), validated live on user 61466927921.

## PDF-13 — WF-31 payment_submitted replies had two different styles

**Status:** 🟢 done
**Started:** 2026-06-07T08:00:00Z
**Completed:** 2026-06-07T09:22:37Z
**Priority:** P2 | **Batch:** 8
**Change type:** Structural — single workflow (WF-31 `HB8nXudAtk9iXz7C`), reply nodes.
**Workflows:** WF-31
**n8n IDs:** `HB8nXudAtk9iXz7C`
**Depends on:** PDF-12 (soft — mirrors the canonical-block pattern)
**Design gate:** false

The general-enquiry path (Gemini, conversational "being reviewed") and the canned wants_consultation path (templated "⏳ under review") gave two different styles. Fix (mirrors PDF-12): one canonical "⏳ *Your payment is under review.* Dr. Chinmay will confirm it shortly — you don't need to do anything else for now." block, appended to the Gemini reply AND used as the canned reply (byte-identical); Gemini told not to phrase the review status. Text-only (no button/payment block — payment already made). Pseudo-first (`WF-31.pseudo` Steps 6/8). Backup `archive/backups/HB8nXudAtk9iXz7C-2026-06-07-08-00-pre-consistency.json`. PUT 200; JS-OK; verified live (both paths end with the identical block).

## PDF-14 — WF-43 post-consult "Welcome back" incoherence + REBOOK-only CTA

**Status:** 🟢 done
**Started:** 2026-06-07T08:00:00Z
**Completed:** 2026-06-07T09:22:37Z
**Priority:** P2 | **Batch:** 8
**Change type:** Structural — single workflow (WF-43 `3va0M06kijgyLejf`), two Gemini prompt nodes.
**Workflows:** WF-43
**n8n IDs:** `3va0M06kijgyLejf`
**Depends on:** PDF-11 (soft — same WF-43 reply path)
**Design gate:** false

Two UX issues from PDF-11/12 validation: (a) the reply told users to "reply REBOOK" while sending a Book Again button (mentioned only the keyword); (b) the standard returning-user prompt said "welcome back" — incoherent right after a just-closed consultation. Fix: both prompts now offer "tap Book Again below OR reply REBOOK" (both valid); the STANDARD prompt is time-neutral (no "welcome back" — can't know elapsed time); the OPTED-OUT prompt KEEPS welcome-back (a re-engaging opted-out user genuinely returned). Decision (2026-06-07): Option B (time-neutral copy) now; gap-aware welcome via DB last-contact lookup deferred to post-MVP TD-NEW-042 (bundles with PDF-02/03). Pseudo-first (`WF-43.pseudo` Steps 15/16). Backup `archive/backups/3va0M06kijgyLejf-2026-06-07-08-00-pre-rebook-welcome.json`. PUT 200; JS-OK; verified live (time-neutral standard, welcome-back retained for opted-out, both CTAs).

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

## Batch 9 — PDF-15 relay 24h-window deliverability gate (WF-41) — NEXT ACTIONABLE (P0)

- **Items:** 1 (PDF-15)
- **Description:** Make Dr. Chinmay's relay replies deliverable when the customer's 24h WhatsApp service window has closed. **Window-conditional** (DD-A): read the customer's last inbound from `chinmay_astro.messages` (`MAX(created_at) WHERE direction='inbound'`, DD-B); if <24h → send free-form as today (unchanged, full fidelity, free per M2); if ≥24h → **pre-process to template-safe** (DD-C: newlines→spaces per M4, collapse 4+ spaces, split >~900 chars into "(1/N)" parts) and deliver via the **relay-reply** utility template (DD-D body). No bounce-back/retype path; residual Meta send failures are caught by PDF-16.
- **External prerequisite:** the **relay-reply** template must be approved in Meta first (submit earliest — elevated rejection risk for thin-content utility templates).
- **Change type:** Structural — WF-41 (+ WF-50 send mode), new DB-read for window state.
- **Pseudo-impact:** yes (new branch + send logic on the relay path → revise `WF-41.pseudo` before build).
- **Estimated size:** L
- **Estimated tokens:** ~60K

## Batch 10 — PDF-16 failure-visibility + PDF-17 rejection→template (P1)

- **Items:** 2 (PDF-16 cross-cutting send-failure visibility · PDF-17 WF-34 rejection always-template)
- **Description:** PDF-16 — customer-bound callers stop ignoring WF-50's `success=false` and post a plain-language in-channel notice to Dr. Chinmay (primary surface WF-41 relay; also WF-34/WF-42); this is the backstop beneath PDF-15's app-side gate (DD-4). PDF-17 — convert the WF-34 payment-rejection message from an interactive button message to an **always-template** send (DD-E/DD-1), mirroring how approval already uses `consultation_activated`; no window logic. PDF-16 and PDF-17 overlap on WF-34 (soft same-workflow sibling) → execute sequentially, re-fetch live WF-34 at each pickup.
- **External prerequisite (PDF-17 only):** **payment-rejection** template approved in Meta. PDF-16 has no template dependency.
- **Change type:** Structural — WF-41/34/42 (PDF-16) + WF-34 (PDF-17).
- **Pseudo-impact:** yes (both — new failure-notice branch; send-mechanism swap on rejection).
- **Estimated size:** M
- **Estimated tokens:** ~60K

## Batch 11 — PDF-18 passive window-closing nudge — NEW WF-7x scheduled workflow (P1)

- **Items:** 1 (PDF-18) — project's FIRST scheduled/background workflow (WF-7x range, pulled forward from post-go-live)
- **Description:** Hourly-class scheduled job (poll every 2h) that posts an advisory, non-blocking reminder into the consult channel when a customer's free-reply window is 18–24h old and the last inbound is **unanswered** (`last_inbound > last_outbound`). Repeats ~3–4× across 18→24h (DD-F), self-terminates at 24h or the moment Dr. Chinmay replies. Never contacts the customer, never auto-replies, writes no state.
- **Greenfield note:** author `WF-7x.pseudo` **in this batch** (co-located pseudo-first per plan-sprint §3d greenfield rule — do NOT defer pseudo to a later batch). Live is built from the pseudo in the same session.
- **Change type:** Structural — new workflow (Schedule trigger + Postgres query + WF-51 send).
- **Pseudo-impact:** yes (greenfield — pseudo authored in-batch).
- **Estimated size:** M
- **Estimated tokens:** ~40K

## Batch 12 — PDF-19 close prompt → always-template (P2)

- **Items:** 1 (PDF-19)
- **Description:** Convert the WF-42 consultation-close prompt from an interactive 3-button message to an **always-template** send (DD-E/DD-1) so it always reaches the customer regardless of the 24h window. Two constraints: (a) the template carries all **3** quick-reply buttons with the same ids/wording as today, and a *template* quick-reply tap arrives in a **different webhook shape** than the current interactive `button_reply` (M5) — so the post-close button-tap handler must accept **both shapes**; (b) the post-close experience fixed earlier this sprint (PDF-11 button re-attach, PDF-14 time-neutral copy) must still hold — only the close prompt itself becomes a template. Review/rewrite the existing unused `consultation_closed_feedback` template body to match the current close copy + buttons.
- **External prerequisite:** `consultation_closed_feedback` reviewed/rewritten + approved in Meta.
- **Change type:** Structural — WF-42 (send) + post-close button-tap handler (dual-shape parse).
- **Pseudo-impact:** yes (send-mechanism swap + new inbound tap shape).
- **Estimated size:** M
- **Estimated tokens:** ~35K

## PDF-15 — Astrologer's relay reply silently never reaches the customer if their window is >24h closed

**Status:** 🟢 done
**Started:** 2026-06-08T08:00:24Z
**Completed:** 2026-06-08T08:17:50Z
**Owner session:** build-pre-demo-minor-fixes-8Jun26
**Actual tokens:** ~75K (spec + WF-41/50/10 pseudo+md reads dominated; WF-50.md grep was the largest single input)
**Actual effort:** ~17 min
**Estimate delta:** on-bucket (planned L ~60K, actual ~75K — within L band)
**Priority:** P0 | **Batch:** 9
**Change type:** Structural — WF-41 Admin→User Relay (`6PzJRZsF7k2d9hV7`) + WF-50 send mode; new `messages`-table window-state read; relay-reply template send; out-window pre-process.
**Workflows:** WF-41, WF-50, WF-51
**n8n IDs:** `6PzJRZsF7k2d9hV7` (WF-41) · `BUVun38WEKb12zg9` (WF-50) · `wlZRK0YxnhP0b2RL` (WF-51)
**Depends on:** relay-reply template approval (external, Meta) · PDF-18 (soft — shares the `messages` window-state source) · PDF-16 (soft — PDF-16 is the residual-failure backstop; build close together)
**Design gate:** false (locked this session)
**Size:** L
**Estimated tokens:** ~60K
**Pseudo-impact:** yes — revise `WF-41.pseudo` (new in-window/out-window branch) before build.

**Decisions locked (2026-06-08, grounded in Meta docs):**
- **DD-A window-conditional, NOT always-template.** In-window → free-form unchanged (full fidelity, no M4 constraint, free per **M2**). Out-window → relay-reply template. Rationale: M4 bans newlines / 4+ spaces in template parameters and caps body at 1024 — so *always*-template would strip formatting, force a "Dr. Chinmay:" prefix, and split EVERY reply including the common in-window live exchange, for no cost saving (Meta meters window-state itself). The window check is one cheap SQL + IF; keeping it preserves in-window fidelity.
- **DD-B window source = `chinmay_astro.messages`**, `MAX(created_at) WHERE user_id=X AND direction='inbound'`. The relay path does no `users` write, so `users.last_message_at` is stale — not usable (spec §4).
- **DD-C out-window = pre-process to template-safe + deliver (no bounce-back).** Collapse newlines→spaces (M4), collapse 4+ spaces, split >~900 chars into "(1/N)" parts (≤1024 body incl. fixed prefix), then send via relay-reply template. NO "retype it" path back to Dr. Chinmay. If a send still fails at Meta (paused template, rate limit) → **PDF-16** surfaces it.
- **DD-D relay-reply template body:** *"Sorry for the delayed response to your message. Here's the response from Dr. Chinmay: {{1}}"* — apology/service framing chosen over bare `{{1}}` to (a) reduce Meta utility-approval rejection risk (thin-content templates get flagged) and (b) give correct customer tone after a >24h gap. `{{1}}` budget ≈960 chars after the ~60-char prefix; split at ~900 for margin. Multi-part: the fixed prefix repeats per part; "(1/N)" label rides inside `{{1}}` (build detail).

**Meta grounding:** M1 ([pricing](https://developers.facebook.com/docs/whatsapp/pricing)) · M2 ([July 2025 pricing](https://developers.facebook.com/docs/whatsapp/pricing/updates-to-pricing/)) · M4 ([guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines/), [error-code ref — "parameters cannot include newline characters or more than 4 consecutive spaces"](https://www.heltar.com/blogs/all-meta-error-codes-explained-along-with-complete-troubleshooting-guide-2025-cm69x5e0k000710xtwup66500)) · unused-template re-approval ([template statuses](https://help.gohighlevel.com/support/solutions/articles/155000001623-whatsapp-template-statuses-and-best-practice)).

**Acceptance:** a relay reply sent after the customer's window has closed reaches the customer as the window-safe template (their reply re-opens the window → normal free-form resumes); in-window replies are unchanged free-form; a previously-undeliverable message never alters handling of later messages (stateless gate). Spec DD-2/DD-3.

**Approved template structure — `astrology_service_update` (verified live 2026-06-08T07:52:58Z, lang `en`):**
- Header: TEXT (fixed, no var) — *"Follow-up on your astrology consultation"*.
- Body (134 chars): *"\*Sorry for the delayed response to your message. Here's the response from Dr. Chinmay:\n\*\n{{1}}\n\n\*Please respond at your convenience.\*"* — **one positional var `{{1}}` = the DD-C-sanitized reply** (single-line, ≤~900 chars).
- No footer, no buttons.
- **Send payload:** `components:[{type:"body",parameters:[{type:"text",text:<sanitized reply>}]}]`, `language:{code:"en"}`.
- ℹ️ **Known cosmetic quirk — ACCEPTED, do NOT re-flag or attempt to fix.** The split `*` on lines 1–2 (→ literal asterisks in WhatsApp) is a **Meta template-UI bug**: the editor's Bold control forces the closing `*` onto the next line, so it cannot be authored correctly from the UI (user confirmed 2026-06-08). Not an authoring error, not build-fixable. Left as-is by user decision; build does not touch the template body.

**Build prerequisite:** `astrology_service_update` template APPROVED in Meta ✅ (Active 2026-06-08).

**Build notes (2026-06-08, build-pre-demo-minor-fixes-8Jun26):**
- Implemented in WF-41 only (3→4 nodes); WF-50 and the template untouched. jq-on-disk + curl PUT. Backup `archive/backups/6PzJRZsF7k2d9hV7-2026-06-08-18-10.json`.
- **`Load Last Inbound` Postgres node** (v2.6 = project floor, executeQuery, alwaysOutputData=true, cred `Zomqv5wsowQAhdGl`): `SELECT MAX(created_at) AS last_inbound, (MAX(created_at) > NOW() - INTERVAL '24 hours') AS in_window FROM chinmay_astro.messages WHERE user_id=$1 AND direction='inbound'`, queryReplacement `={{ [$json.user.id] }}`. **24h boolean computed in SQL** (timestamptz vs NOW()) → TZ-correct, no n8n-runtime-TZ dependency. 0-row aggregate → NULL → treated as window-CLOSED.
- **`Prepare WhatsApp Message` Code rewrite:** reads window state from `$input.first()` (Postgres) + envelope from the always-run trigger `$('When Executed by Another Workflow')` (post-Postgres `$json` is the query row, not the envelope). in-window → `{messageType:'text', messageContent}` (byte-identical to prior behaviour). out-window → M4-safe sanitize (newlines/tabs→space, collapse 2+ spaces, trim) then ≤850→one template item / >850→`(i/N)` word-boundary split (hard-split giant words) → N items `{messageType:'template', templateName:'astrology_service_update', templateParams:[part], userId, consultationId}`. Defensive `in_window` read (`=== true || === 'true'`) so any non-true → safe template path.
- **DECISION — WF-50 `mode` `once`→`each` (overrode the user's initial mode-'once' pick after verification).** WF-50's entry guard + every internal Code node use `$input.first()` / `return [{json}]`, collapsing N items to the first. A single mode-'once' call passing N parts would have **silently sent only part (1/N)**. mode-'each' runs WF-50 once per item → all N parts delivered in order; in-window (1 item) → one run, identical to before. User flagged this exact risk; verification confirmed it and the override honours their actual requirement (all parts delivered).
- **Verification:** lint hook exit 0; MCP `n8n_validate_workflow` strict `valid:true` 0 errors; Postgres node strict-validate 0 errors; typeVersion floor held (only new type = pg 2.6); window query run against live data (user 40 `consultation_active` @54.4h out-window → routes to template — the exact PDF-15 failure case); sanitize/split logic unit-tested in node (M4-safe, multi-part labels, hard-split, edge cases). Pseudo revised first + stamped `live_reconciled_at=2026-06-08T08:13:51.036Z` (assert-pseudo-fresh FRESH).
- **DEFERRED — live WhatsApp send smoke** (in-window text + out-window template to a real number) NOT run unilaterally (side-effecting external send to a real customer). Recommend running as a coordinated smoke with the user, ideally alongside PDF-16 (failure backstop) so any residual Meta send error is visible.

## PDF-16 — Failed customer-bound sends are invisible to the astrologer

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 10
**Change type:** Structural — customer-bound callers read WF-50 `success=false` and post an in-channel notice; primary surface WF-41, also WF-34/WF-42.
**Workflows:** WF-41, WF-34, WF-42 (callers) · WF-50 (already returns the failure) · WF-51 (notice)
**n8n IDs:** `6PzJRZsF7k2d9hV7` (WF-41) · `se82n3MUQ9xE5aEr` (WF-34) · `fx70vqyJtRdF2DgR` (WF-42) · `BUVun38WEKb12zg9` (WF-50) · `wlZRK0YxnhP0b2RL` (WF-51)
**Depends on:** PDF-15 (soft — this is the backstop for PDF-15's residual send failures; build close together) · PDF-17 (soft — same WF-34, sequence within Batch 10)
**Design gate:** false
**Size:** M
**Estimated tokens:** ~35K (incremental share within Batch 10)
**Pseudo-impact:** yes — add the failure-notice branch to each caller's `.pseudo`.

**Decision (DD-4):** the WF-50 sender already detects Meta failure (`success=false` + error); the customer-bound callers currently ignore it. Each must, on `success=false`, post a clear plain-language notice to Dr. Chinmay in the relevant consult channel via WF-51 — no silent drops. Cross-cutting safety net beneath PDF-15's app-side gate (catches even failures the gate didn't predict). Admin-tone rule applies: business language, no WF-XX/field jargon ([[feedback_admin_message_tone]]).

**Acceptance:** any customer-bound message WhatsApp rejects produces a clear in-channel notice to Dr. Chinmay; no customer-bound send fails silently. Spec DD-4.

## PDF-17 — Payment-rejection message unreachable after a long gap

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 10
**Change type:** Structural — WF-34 Payment Rejection Processor (`se82n3MUQ9xE5aEr`): interactive button message → always-template send.
**Workflows:** WF-34
**n8n IDs:** `se82n3MUQ9xE5aEr`
**Depends on:** payment-rejection template approval (external, Meta) · PDF-16 (soft — same WF-34, sequence within Batch 10) · PDF-19 (soft sibling — same always-template DD-1 pattern; PDF-17 lands first, PDF-19 reuses the shape)
**Design gate:** false
**Size:** S
**Estimated tokens:** ~25K (incremental share within Batch 10)
**Pseudo-impact:** yes — `WF-34.pseudo` send step changes from interactive to template.

**Decision (DD-E / DD-1):** fixed-content message → **always a template**, one code path, no window branching. Free in-window (M2), cheap outside, always deliverable — exactly how payment **approval** already works (`consultation_activated`). The new **payment-rejection** utility template carries the fixed rejection copy + retry affordance. The retry button becomes a template quick-reply → its tap arrives in the M5 template shape (the inbound handler that processes the retry must accept it — verify at build whether this reuses PDF-19's dual-shape handling or is a separate tap).

**Meta grounding:** M2 (free in-window) · M5 (template quick-reply tap shape). See header grounding block for URLs.

**Approved template structure — `payment_rejection` (verified live 2026-06-08T07:52:58Z, lang `en`):**
- No header, no body vars (fully fixed). Body: *"Sorry, but we couldn't verify your payment. Please check the details and try again.\n\nPayment Instructions:\n- Amount: ₹500\n- Please send via GPay / PhonePe / any UPI app to +91-9653240263 (Chinmay Mujumdar)\n\nAfter payment, tap the button below."*
- 1 quick-reply button (title *"Payment Completed"*, index 0).
- **Send payload:** `components:[{type:"button",sub_type:"quick_reply",index:"0",parameters:[{type:"payload",payload:"payment_completed"}]}]`, `language:{code:"en"}`. **Set payload = `payment_completed`** so the existing handler matches (button title "Payment Completed" — no ✓ — is cosmetic; match on payload, not title). The retry tap now arrives in the **M5 template-tap shape** — verify the payment_completed inbound handler accepts it (same dual-shape concern as PDF-19).

**Acceptance:** a payment rejection always reaches the customer with a way to retry, regardless of their 24h window; behaviour consistent every time. Requires the approved payment-rejection template. Spec DD-1.

## PDF-18 — Passive, non-blocking window-closing nudge (first scheduled job)

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 11
**Change type:** Structural — NEW workflow WF-7x (project's first scheduled/background job): Schedule trigger → Postgres query → WF-51 send.
**Workflows:** WF-7x (new) · WF-51 (`wlZRK0YxnhP0b2RL`)
**n8n IDs:** WF-7x to be created · `wlZRK0YxnhP0b2RL` (WF-51)
**Depends on:** PDF-15 (soft — shares the `messages` `MAX(inbound)` window-state source; lock the source once, reuse)
**Design gate:** false
**Size:** M
**Estimated tokens:** ~40K
**Pseudo-impact:** yes — greenfield; author `WF-7x.pseudo` IN this batch (co-located pseudo-first, not deferred).

**Decision (DD-F) — locked algorithm:**
1. Schedule trigger — **every 2h**.
2. Postgres: `status='consultation_active'` AND customer's last inbound (`MAX(created_at) WHERE direction='inbound'`) is **18–24h old** (`<= now−18h AND >= now−24h`) AND **unanswered** (`last_inbound > last_outbound`).
3. Each match → advisory to `slack_channel_id` via WF-51: *"⏳ Heads-up: [Customer]'s free-reply window closes in ~Nh (last message [time]). Reply within the window to answer for free in plain text — after it closes, replies go out as a template. Ignore this if you're done."*
4. No customer contact, no auto-reply, no state write, never blocks.

**Why repeat 18→24h (not single-fire):** user wants a persistent reminder that doesn't get lost (~3–4 nudges at 2h cadence across the 18→24h stretch). Self-terminates two ways: the moment Dr. Chinmay replies (`unanswered` clause flips false) and at 24h (window closed → relay goes template/charged → nudge has no purpose; confirmed it must stop there).
**Build dependency to verify live:** the `unanswered` check needs Dr. Chinmay's outbound relay logged to `messages` with `direction='outbound'` (WF-60 logs Slack-inbound = astrologer→customer, so expected to hold — confirm at build).

**Acceptance:** when a customer's window is close to expiring during an open consultation and Dr. Chinmay hasn't replied, a clear advisory appears in that consult channel; it never blocks, never auto-replies, harmless to ignore, stops at 24h or on reply. Spec DD-5.

## PDF-19 — Consultation-close prompt unreachable after a long gap

**Status:** ⬜ pending
**Priority:** P2 | **Batch:** 12
**Change type:** Structural — WF-42 Consultation Closer (`fx70vqyJtRdF2DgR`) interactive 3-button → always-template; post-close button-tap handler accepts both webhook shapes.
**Workflows:** WF-42 · post-close button-tap handler (pinpoint live at build — WF-43 / inbound router area)
**n8n IDs:** `fx70vqyJtRdF2DgR` (WF-42)
**Depends on:** `consultation_closed_feedback` template review/rewrite + approval (external, Meta) · PDF-17 (soft sibling — reuses PDF-17's always-template send shape) · constraint: must preserve PDF-11 (button re-attach) + PDF-14 (time-neutral copy), both done
**Design gate:** false
**Size:** M
**Estimated tokens:** ~35K
**Pseudo-impact:** yes — `WF-42.pseudo` send step + the button-tap handler's `.pseudo` (new template-tap shape).

**Decision (DD-E / DD-1 + M5):** close prompt → **always a template** so it always arrives regardless of the 24h window (same single-path approach as PDF-17). Two locked constraints:
- **(a) Dual button-shape (M5), NOT two sets of buttons.** All **3** quick-reply buttons stay (Leave Feedback / Book Again / Done) with the same ids/wording. A *template* quick-reply tap arrives in a different webhook shape than the current interactive `button_reply` — so the post-close handler must parse **both** the template-tap shape (new close prompts) and the interactive shape (other flows still send interactive buttons: payment-completed, REBOOK).
- **(b) Preserve the post-close experience** fixed earlier this sprint — only the close prompt itself becomes a template; everything after the customer's first tap is the normal in-window flow (PDF-11 buttons stay available, PDF-14 time-neutral copy), unchanged.
- Rewrite the existing **unused** `consultation_closed_feedback` template (0 sends, body mismatched) to match the current close copy + carry all 3 quick-reply buttons.

**Meta grounding:** M5 template quick-reply tap shape ([template components](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/components)) · M2 free in-window.

**Approved template structure — `consultation_closed` (verified live 2026-06-08T07:52:58Z, lang `en`):**
- Header: TEXT (fixed, no var) — *"Your consultation is closed now."*
- Body (`{{1}}`=name): *"✨ Your consultation with Dr. Chinmay is complete, {{1}}!\n\nFor any follow-ups, either choose below or email chinmay_astro@gmail.com if you need anything we can't help with right now."*
- Footer (fixed): *"Regards, Chinmay Astro"*
- 3 quick-reply buttons: index 0 *"Leave Feedback"*, index 1 *"Book Again"*, index 2 *"Done, Thanks."*
- **Send payload:** body param `{{1}}`=user name; buttons `[{type:"button",sub_type:"quick_reply",index:"0",parameters:[{type:"payload",payload:"btn_feedback"}]},{…index:"1"…payload:"btn_rebook"},{…index:"2"…payload:"btn_done"}]`, `language:{code:"en"}`. **Set payloads `btn_feedback`/`btn_rebook`/`btn_done`** so the existing post-close handler matches (button titles are cosmetic; "Done, Thanks." vs old "Done, thanks" is irrelevant — match on payload). The 3 taps now arrive in the **M5 template shape** → that is exactly the dual-shape parse this item adds.
- Note: the template ADDS a header + footer the current interactive close message doesn't have — accepted (user-authored, trimmed for Utility approval); PDF-11/PDF-14 post-tap experience is unchanged.

**Acceptance:** closing a consultation always delivers the wrap-up prompt with all 3 options working, regardless of the 24h window; the existing post-close experience (buttons available, time-neutral copy) is unchanged. Spec DD-1 §5.
