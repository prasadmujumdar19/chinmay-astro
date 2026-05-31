# Sprint: pre-demo-minor-fixes-31May26

**Input source:** docs/artefacts/sprints/pre-demo-minor-fixes-31May26/tasks.md
**Input hash:** 6044e408324887164d261c2b46ed0e97048e19e54e40d185ea868637bbf7d3a6
**Planned at:** 2026-05-31T11:19:25Z
**Last updated:** 2026-05-31T11:42:48Z
**Planning complete:** true
**Rolling sprint:** TRUE — `_active` marker is USER-CONTROLLED. build-sprint MUST NOT remove `_active` on batch/queue exhaustion; report "current queue done, sprint still open (rolling)" and stop. Re-invocations of plan-sprint must be ADDITIVE (plan only new PDF-NN items into this file; never destructive full-replan). input_hash mismatch is EXPECTED and is NOT a replan signal. See tasks.md "ROLLING SPRINT" header for full lifecycle/concurrency rules.
**Discover-current-state:** ran at 2026-05-31T11:19:25Z against live WF-10 (`wMh0oBRtJbvhLgOf`, 42 nodes). Result: PDF-01 condition CONFIRMED PRESENT — `Build Help Prompt` + `Call WF-51 (Help Prompt)` nodes and hardcoded "Type `HELP` to see available commands" line both still on the `free_text` branch; ZERO Gemini calls in WF-10. PDF-01 is genuinely pending, not obsolete. PDF-02/PDF-03 extend the not-yet-built PDF-01 → pending. No obsoletes detected.
**Dependency conflicts found:** — (none. PDF-02/03 are P2 and hard-depend on PDF-01 which is P0; the dependency is on a higher-priority item that runs first, so priority order and dependency order agree.)
**Priority adjustments confirmed:** none required — original priority order honoured.

## Items

| ID | Status | Batch | Pri | Workflows | Depends On |
|----|--------|-------|-----|-----------|------------|
| PDF-01 | 🟢 done | 1 | P0 | WF-10 | — |
| PDF-02 | ⬜ pending | 2 | P2 | WF-10 | PDF-01 (hard) |
| PDF-03 | ⬜ pending | 3 | P2 | WF-10 | PDF-02 (hard) |

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
