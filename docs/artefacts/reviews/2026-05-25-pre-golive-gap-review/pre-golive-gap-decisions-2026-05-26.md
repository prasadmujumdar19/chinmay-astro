---
name: pre-golive-gap-review-decisions
date_started: 2026-05-25T09:27:04Z
source: docs/reference/user_journey_map.html (v2.0/v2.1) + workflow-registry.md (v2.13)
scope: Pre-go-live functional gaps from user journey & admin POV (excludes post-MVP, infra, health)
status: in-progress
---

# Pre-Go-Live Gap Review — Decisions

Walk-through format: one gap at a time. For each gap, we capture Claude's recommendation, change size, blast radius, key trade-offs, and the user's final decision (build now / defer / drop / modified scope).

## Gap Index

| # | Gap | Side | Decision |
|---|---|---|---|
| 1 | Non-text during active consultation forwarded to Slack | User | ✅ Decided — graceful redirect to email (no special-case for active) |
| 2 | 3rd post-consult button "I'm done, thank you" | User | ✅ Decided — build with Slack signal |
| 3 | REBOOK "Update Birth Details" option | User | ✅ Decided — 3a defer + email; 3b email-callout WF-22/32/42; 3c Gemini distribute |
| 4 | Country filter user-facing message vs silent | User | ✅ Decided — Post-MVP: polite reply + once-per-day rate-limit |
| 5 | Repeated free-form stop_intent escalation | User | ✅ Decided — Defer post-MVP |
| 6 | Opted-out re-engagement Slack notification (WF-26) | Admin | ✅ Decided — Defer post-MVP |
| 7 | payment_submitted SLA nudge to admin | Admin | ✅ Decided — Soft aging tag in WF-31 now; full cron post-MVP |
| 8 | `INFO <phone>` admin command | Admin | ✅ Decided — Defer post-MVP |
| 9 | `users.blocked_reason` DB persistence | Admin | ✅ Decided — Defer post-MVP |
| 10 | Pre-execution validator blocking 70 nodes (regression from May-18 n8n container recreate) | System | ✅ Decided — Fix WF-01 first → smoke → fan out; image-pin LAST |

---

## Gap 1 — Non-text during active consultation forwarded to Slack

**Status:** Under discussion.

### Current behaviour
WF-01 `Silent Reject (Message Type)` Code node (per ICV-001, 2026-05-18) returns a deflection message: *"⚠️ Sorry, we only handle text messages right now…"* — sent to user via WF-50. This fires regardless of user state, including `consultation_active`.

### Design intent (J-21 in user_journey_map.html)
> Exception: if `consultation_active`, forward image/audio to Slack as a notification (admin can see it); send user: *"Chinmay can see you sent a file. Text responses only from our side."*

### Why it matters
₹500 paid consultation. Realistic scenarios where the user attaches media:
- Screenshot of an existing horoscope / kundli they paid for elsewhere
- Photo of a handwritten birth chart from family records
- Voice note describing their question (faster than typing in Hindi/Marathi)
- Image of an event they're seeking guidance on

Today, all of these silently disappear from admin's view — only the deflection message goes back to user. Admin has no idea media was sent.

### Claude's recommendation
**Build a minimal version now.** Branch the deflection logic on `user.status === 'consultation_active'`:
- Active consult → post a Slack notification to `consult-{phone}` channel: *"📎 User sent a {messageType}. View in WhatsApp Business app to see content."* + send user the "Chinmay can see…" message.
- All other states → existing deflection unchanged.

Don't try to download + re-upload Meta media into Slack in v1 — Meta media URLs require Bearer auth, expire in ~5 min, and need encryption-svc-like plumbing for some message types. The notification-only version solves 80% of the value (admin knows to open WhatsApp Business) at 20% of the effort.

### Change size
**Small.** Touches WF-01 only. Roughly:
- Split `Silent Reject (Message Type)` into a routing branch (active vs other)
- Add a Set node to build a Slack notification payload + executeWorkflow to WF-51
- Update WF-50 user-side text on the active-branch
- ~3-4 new nodes in WF-01

### Blast radius
- **WF-01 is P1 critical-path** — any structural change is risk-bearing. Mitigated by: pseudo-first revision, jq-on-disk PUT, smoke-test of TC-21xx (non-text) + TC-04xx (relay) before/after.
- No DB schema change.
- No new credential / external dependency.
- WF-51 already supports posting to consult channels — no change there.
- Pseudocode-first per `[[feedback_pseudocode_first_refactor]]`: revise `WF-01.pseudo` Step that handles non-text → user approves → then JSON.

### Trade-offs
- **Build minimal (notify only):** admin still has to open WhatsApp Business to see the content. One extra tool-switch. But solves the "blind spot" problem.
- **Build full (download + re-upload to Slack):** admin sees the image inline in Slack. Significantly more work: Meta media-download with auth, file size handling, encryption-svc-style flow for some types, Slack `files.upload` API. ~10x effort vs notify-only.
- **Defer entirely:** admin keeps missing user attachments during paid consultations. Risk: poor consultation quality on day 1.

### Decision (2026-05-25T09:27:04Z)

**Scope reframed by user.** Original recommendation (notify admin via Slack when active-consult user sends non-text) declined on cost grounds:

> "We DO NOT PROCESS OR DOWNLOAD. Instead, we respond with a message gracefully telling them that it's text only service + if users want to share any documents, images etc. — then please quote their phone number, name and send it via email to our support address (chinmay_astro@gmail.com)."

Rationale: ingesting/forwarding media has non-trivial cost both in $$ (Meta media download, Slack file upload, potential intent-filter inflation if we ever try to interpret) and in build/maintenance effort. The intent filter is only cheap because today's surface is pure text — that economic envelope shouldn't be broken for an edge case.

**Build decision:**
- **Single change, all states uniformly** (no `consultation_active` branch): update WF-01 `Silent Reject (Message Type)` user-facing text to direct the user to email `chinmay_astro@gmail.com` with their phone number + name.
- No Slack notification to admin. No download. No re-upload.
- Proposed text (to confirm at build time): *"This service supports text messages only. If you'd like to share a document, image, voice note or any other file, please email it to chinmay_astro@gmail.com along with your phone number and name. We'll get back to you on WhatsApp."*

**Change size:** Trivial — single text string in one Code node. ~1 line change.

**Blast radius:** Negligible. No structural change; no node added/removed; no DB change. Pseudo update on `WF-01.pseudo` for the Silent Reject step text.

**Post-MVP follow-up captured:**
- **Emoji reactions on bot messages → admin notification.** Today: WF-00 drops reactions silently. Future: post a short text/emoji notification to the user's `consult-{phone}` channel so the admin sees that the user reacted (e.g., 👍 to a piece of advice). Out of scope for go-live; tracked here.

**Open question for build phase (not blocking decision):** confirm support email — user wrote `chinmay_astro@gmail.com` (with underscore). Will reconfirm at implementation time in case the canonical address differs.

---

## Gap 2 — 3rd post-consult button "I'm done, thank you"

### Current behaviour
WF-42 close-payload contains 2 interactive buttons: `btn_feedback` and `btn_rebook`. Users who just want to politely end with "thanks" / "ok bye" hit WF-43's free-form path → WF-25 intent classifier → Gemini reply (cost + no clean signal).

### Design intent (J-15)
3 buttons: Feedback / Rebook / "I'm done, thank you".

### Claude's recommendation
Build the 3-button version with a Slack signal so admin sees a clean conversation-end.

### Change size
Small. WF-42 close-payload gains a 3rd button definition; WF-43 button_reply routing gains a `btn_done` branch → WF-50 thank-you + WF-51 Slack notification.

### Blast radius
- WF-42 (P1) + WF-43 (P2) touched; both well-covered by existing post-consult smoke tests.
- No DB schema change.
- Button label length: WhatsApp caps at ~20 chars. Use **"Done, thanks"** (12 chars) — safer than the literal *"I'm done, thank you"* (19 chars).

### Decision (2026-05-25)
**Build with Slack signal.**
- `btn_done` added to WF-42 close-payload, label "Done, thanks".
- WF-43 routes `btn_done` → WF-50 thank-you message + WF-51 posts *"User tapped Done — conversation closed"* (or similar) to `consult-{phone}` channel.
- No state change (`consultation_closed` stays).
- Reduces Gemini cost on post-consult tail; gives admin a clean done-signal.

### Build notes (for plan phase, not blocking)
- Pseudo updates: `WF-42.pseudo` (close-payload section) + `WF-43.pseudo` (button_reply branch).
- Decide final Slack message wording at build time.
- Decide final WhatsApp thank-you wording at build time (something gracious; *"Thank you for choosing Chinmay Astro. We hope to see you again — just send REBOOK whenever you're ready."*).

---

## Gap 3 — REBOOK "Update Birth Details" option (expanded into 3a/3b/3c)

User reframed this gap during discussion into three sub-decisions:

### 3a — REBOOK birth-details refresh path
**Decision:** No self-service birth-details update via WhatsApp. Policy:
- During `consultation_active`: user tells Dr. Chinmay directly in the live chat.
- All other states: user emails `chinmay_astro@gmail.com` to request updates. Admin can fix via Postgres MCP (CLAUDE.md documents the SQL).
- No build work for the update path itself.

**Rationale:** Self-service update would require WF-22 to gain UPDATE-vs-INSERT semantics (risk to onboarding-critical workflow). Real-world frequency is low. Email + admin manual update covers the long tail.

### 3b — Email-channel callout in user-facing state-transition messages
**Decision:** Add a P.S.-style email-channel mention to user messages at three transition points:
- **WF-22** payment instructions message (post-form, status=payment_pending)
- **WF-32** payment-submitted ack message (post Payment Completed tap)
- **WF-42** close-consultation message (right before the post-consult buttons — note this is the same message that gains the 3rd "Done, thanks" button from Gap 2)

Text suggestion (refine at build time): *"In the meantime, you can ask any general questions here, or email chinmay_astro@gmail.com if you need anything we can't help with right now."*

**Out of scope for 3b:** WF-21 (the very first welcome+form). User opted to keep the first message focused on consent+form, not email channel.

**Change size:** Trivial. Three text-string edits across WF-22/32/42. No structural change.

**Blast radius:** Negligible. Pseudo touch-up on the message-template sections of the three WFs.

### 3c — Gemini answer-generation for general_enquiry across pre-/post-payment states
**Decision:** **Distribute the pattern.** Copy WF-43's existing Gemini-response approach into WF-23/30/31. WF-25 (the classifier) stays unchanged — classify-only.

**Today's asymmetry:**
| Caller | general_enquiry handling today |
|---|---|
| WF-23 (pre-form) | Canned reply + re-prompt form |
| WF-30 (payment_pending) | Canned reply + re-prompt payment |
| WF-31 (payment_submitted) | Canned "under review" ack |
| WF-43 (consultation_closed) | ✅ Gemini-generated answer via WF-50 (already built) |

WF-43's `Gemini General Response` HTTP node + `Prepare Gemini Response Prompt` jsCode is the proven pattern. We replicate it into WF-23/30/31, each with a state-specific suffix appended to the user's answer:
- WF-23 suffix: *"…and once you're ready, please fill the form to begin."*
- WF-30 suffix: *"…and please complete the ₹500 payment to start your consultation."*
- WF-31 suffix: *"…meanwhile your payment is under review with Dr. Chinmay."*
- WF-43 keeps its existing suffix.

All four suffixes should include the email-channel mention (paired with 3b for consistency).

**Why Distribute over Centralize-in-WF-25:**
1. WF-25's prompt is tight (~20 output tokens). Combining classify+answer would balloon every classifier call's output ceiling ~10x, slowing all 4 callers including the classify-only ones (garbage, malicious, stop_intent, etc.).
2. State-specific framing belongs near the caller, not in a shared classifier.
3. WF-43's pattern is already debugged in production — lower-risk to copy than to refactor WF-25.

**Why Distribute over new WF-27 Responder:**
1. Same Gemini-call cost (2 calls per general_enquiry) — centralization wouldn't reduce cost.
2. Building a new workflow + migrating WF-43 to use it is more disruptive than copying a pattern.
3. We don't have traffic data yet to justify another shared workflow. YAGNI; revisit post-MVP if maintenance proves painful.

**Change size:** Medium. WF-23/30/31 each gain ~2 nodes (Prep Gemini Prompt Code + Gemini HTTP). ~half day per workflow including smoke tests.

**Blast radius:**
- Three P3 workflows; WF-25 untouched.
- New Gemini calls share the existing `googlePalmApi` credential — no new auth surface.
- Pseudo updates: WF-23.pseudo, WF-30.pseudo, WF-31.pseudo.
- Cost increase: bounded — only general_enquiry messages trigger the second Gemini call. Expected to be 20-40% of non-keyword text traffic in these states.

**Post-MVP follow-up captured:**
- Centralize into WF-27 if maintenance proves painful (e.g., divergent answer style across the 4 callers) — but only with real traffic data to back the decision.

---

## Gap 4 — Country filter user-facing message vs silent

### Current behaviour
WF-01 country-check silent-drops any non-`+91` number. No reply, no DB write, no signal to user.

### Recommendation
Send a one-line "India-only" message via WF-50, rate-limited to at most one reply per phone per 24h via a new tiny `country_rejects(phone_number, last_sent_at)` table.

### Decision (2026-05-25)
**Adopted as Post-MVP.** The polite-reply + 24h rate-limit design is accepted as the right approach, but not in scope for go-live.

**For go-live:** keep current silent-drop behaviour in WF-01.

**Post-MVP work captured:**
- New table `chinmay_astro.country_rejects` (phone_number PK, last_sent_at timestamp).
- WF-01 country-check branch: SELECT-before-send → if no row or older than 24h, call WF-50 with India-only message + UPSERT last_sent_at.
- Pseudo update: WF-01.pseudo country-check step.
- Optional copy refinement: hint at future expansion (e.g., "Follow [handle] for updates").

**Rationale for deferring:** MVP traffic will be marketing-driven (Indian audience by design). NRI/foreign volume should be low initially, and silent-drop is acceptable as a starting posture. Build the polite-reply path once we have evidence (Meta dashboard analytics) of meaningful foreign-number traffic being lost.

---

## Gap 5 — Repeated free-form stop_intent escalation

### Current behaviour (post SP-04, 2026-05-23)
- Literal `STOP` → WF-20 → WF-47 → opt-out (works).
- Free-form stop-like phrasing → WF-25 returns `stop_intent` → caller (WF-23/30/31/40) sends a clarifier asking for the literal STOP. Same clarifier on every repeated free-form attempt.

### Decision (2026-05-25)
**Defer post-MVP.** Keep current clarifier-only behavior. No counter, no admin alert, no auto-action for go-live.

**Rationale:** SP-04's design (no auto-opt-out on classifier confidence) was deliberate to prevent Gemini false-positives mid-flow. Frequency of "stuck in stop_intent loop" is likely very low; most users who want to leave just stop replying. Adding counters/alerts now is over-engineering before evidence.

**Post-MVP trigger:** if first weeks of traffic show users repeatedly hitting the clarifier (visible via messages-table query), revisit with the **lightweight Slack-alert design**:
- Each stop_intent posts a one-liner to the user's `consult-{phone}` Slack channel (or admin-commands channel if no consult channel exists).
- ~4 new nodes total across WF-23/30/31/40.
- No DB schema change.
- Optional rate-limit (once-per-user-per-day) if noisy.

---

## Gap 6 — Opted-out re-engagement Slack notification (WF-26)

### Current behaviour
WF-26 (built 2026-05-25, BUG-NEW-02) lifts status `opted_out` → `consultation_closed`, sends welcome-back WhatsApp, and re-routes the inbound message through WF-02. No Slack post to admin.

### Decision (2026-05-25)
**Defer post-MVP.** Low-frequency event; admin discovers the re-engagement either passively via message logs or actively once the user starts a payment_pending cycle (which already fires WF-32's admin-side notification).

**Post-MVP design captured:**
- Add ~2-3 nodes inside WF-26 (Build Slack Payload Set + WF-51 call) as a parallel branch.
- Post to user's preserved `consult-{phone}` channel; fall back to `chinmay-admin-commands` if no channel exists (pre-form opt-out edge).
- Include user's first re-engagement message quote for context.
- §2.1 envelope already carries `slackChannelId` (TD-DCP-101) — no DB schema change needed.
- Pseudo update: WF-26.pseudo gets a step for the re-engagement signal.

**Re-evaluation trigger:** if first-month traffic shows ≥5% of users opt-out → re-engage and admin reports missing this signal, build the notification.

---

## Gap 7 — payment_submitted SLA nudge to admin

### Current behaviour
- WF-32 posts the initial "user paid, please APPROVE PAYMENT <phone>" message to the consult Slack channel.
- WF-31 relays subsequent user messages to the same channel but with no time-elapsed context.
- No reminder if admin doesn't act.

### Decision (2026-05-25)
**Two-stage rollout.**

**Stage 1 (go-live): Build the soft aging tag in WF-31.**
- WF-31's existing Build-Slack-Payload Code node augmented to SELECT `payments.created_at` (or `users.updated_at`) and compute elapsed-since-paid into a human string ("47 min ago", "3 h ago").
- Prepended to the relay message: *"⏱ Paid {elapsed} ago · User said: '<msg>'"*
- Trivial change (~5 lines), single Code node, no new DB activity, no cron.
- Blast radius: WF-31 only (P3); low-risk.
- Pseudo update: WF-31.pseudo Build-Slack-Payload step.

**Stage 2 (post-MVP): Payment Approval Reminder cron.**
- Added to the post-MVP **maintenance workflows** queue (sibling family of WF-71 Payment Reminder, WF-72 Inactive Scanner, etc.).
- New WF-7x scanning `users WHERE status='payment_submitted' AND updated_at > N minutes ago AND <not_yet_reminded>` on a regular cron.
- Posts reminder to consult-channel Slack via WF-51.
- Requires either a tracking column or table for last-reminder-sent-at.
- Build only once traffic data shows actual SLA misses, or as part of the broader maintenance-workflow phase.

**Project memory note:** User explicitly framed this as "post-MVP maintenance workflows" — there's a backlog of these to build after launch (payment approval reminders, inactive-user scanner, stale-form cleanup, etc.). Gap 7 stage 2 fits that queue.

---

## Gap 8 — `INFO <phone>` admin command

### Decision (2026-05-25)
**Defer post-MVP.** Admin uses scroll-up in consult channel (covers in-session memory) and pgAdmin via SSH tunnel (covers historical recall). Build INFO once real traffic shows admin asking "who is this user again" frequently.

**Post-MVP design captured:**
- WF-10 Classify Admin/User Channel: add INFO to recognized user-channel commandTypes (DR-13: user-targeted, works in `consult-{phone}` only).
- WF-11 Switch: add INFO case → new chain (Build-SQL → Postgres SELECT joining users + consultations count → Build-Slack-Payload → WF-51).
- Output format: name, phone, birth details, status, first-contact, last-activity, consultations-count.
- Pseudo: WF-10.pseudo + WF-11.pseudo updates.
- Sibling candidates for the same post-MVP batch: `UPDATE BIRTHDETAILS <phone>` (Gap 3a tie-in), `MESSAGES <phone>`, payment-history variant.

---

## Gap 9 — `users.blocked_reason` DB persistence

### Decision (2026-05-25)
**Defer post-MVP.** Per `[[project_admin_actions_deprecated]]` memory, single-admin model means audit is covered by Slack history + messages table + state machine. The Slack confirmation already includes admin's typed reason (BUG-05 fix). DB column persistence is a small consistency win but not blocking for go-live.

**Post-MVP fix captured (1-line change):**
- WF-46 `Update User to Blocked Status` Postgres node: change `blocked_reason` parameter from literal `'Blocked by admin'` to `={{ $('When Executed by Another Workflow').item.json.reason || 'Not provided' }}`.
- Pseudo update: WF-46.pseudo note already flags this; just record the fix.
- No DB schema change. Historical rows retain `'Blocked by admin'` as pre-fix audit trail.
- Closes the TD-candidate flagged in WF-46's registry row.

---

## Gap 10 — Pre-execution validator blocking 70 nodes (regression discovered during data-contracts smoke)

**Discovered:** 2026-05-26 during the `data-contracts-smoke` monitor-test-run (NOT a journey-map gap — this is an unplanned production regression surfaced while validating the data-contracts sprint).

### Observation

n8n executions 2224 and 2226 — both from 2026-05-25T11:36 UTC, the first inbound WhatsApp traffic after the data-contracts sprint landed — failed with `WorkflowHasIssuesError: The workflow has issues and cannot be executed for that reason. Please fix them first.` Both errors originated at `WorkflowExecute.checkForWorkflowIssues` (n8n's pre-execution validator). exec 2226 had `lastNode: null`, confirming WF-01 never started any node. No further inbound traffic has executed since — WF-01 path has been effectively down for ~32 hours.

### Brief analysis

n8n's `validate_workflow` MCP reports 11 errors on WF-01 split into two classes:

**Class A — `workflowInputs.mappingMode: "passthrough"` on Execute Workflow caller nodes (the actual blocker):**
- n8n's `validate_node` returns: *"Invalid mappingMode: passthrough. Must be \"defineBelow\" or \"autoMapInputData\""*.
- n8n-docs + WebSearch + n8n source confirm: `"passthrough"` is valid for the sub-workflow trigger's `inputSource`, NOT for the caller's `mappingMode`. The two values were conflated during the May-2026 sweeps.
- **Blast radius (jq scan of live workflows, freshness-confirmed): 70 invalid mappingMode nodes across 24 of 28 active workflows.** Worst: WF-10 (10), WF-02 (10), legacy sub-workflow `3va0M06kijgyLejf` (6), WF-01/WF-31/WF-11/WF-25 (4 each).
- **WF-26** (the brand-new opted-out re-engagement handler authored during the data-contract-sprint-bug-fix) also has 2 passthrough nodes — confirms the broken pattern propagated from the project's template into new work.

**Class B — Code nodes returning plain `{...}` instead of `[{json:{...}}]`:**
- czlonkowski/n8n-skills `n8n-code-javascript` SKILL.md (verbatim): *"CRITICAL RULE: Always return array of objects with json property. Plain objects are NOT auto-wrapped."*
- Validator reports 7 such nodes in WF-01; at least 7 active workflows likely affected (definitive structured count deferred to plan-sprint phase).

**Likely trigger of the regression:**
- n8n container `n8n-prod` was recreated on 2026-05-18T14:42 UTC, pulling `docker.n8n.io/n8nio/n8n:latest`. Reported version "2.1.4" — unchanged string — but `:latest` may have re-tagged to a stricter build of "2.1.4".
- Both patterns were always non-spec; previously tolerated silently; now hard-blocked at pre-execution.
- Data-contracts sprint's edits did NOT introduce the rot; they were simply the first inbound traffic to exercise the now-blocking validator.

**Architectural intent preserved (key reasoning):**

The data-contracts design (Phase 1) §3.1 and §3.4 explicitly used `mappingMode: passthrough` as the *deliberate, named, contract-aligned* transparent-transport pattern. Sprint state lock: *"Keep `mappingMode: 'passthrough'` — WF-01's envelope (post-Build) is exactly WF-26's input contract."* The architecture is intentionally two-layer: producer Code/Set node builds the envelope; receiver entry-guard Code node validates it. The Execute Workflow node was meant to be transparent transport — that's WHY `passthrough` was chosen.

The user's initial preference was `autoMapInputData` on the same architectural ground (avoid adding a third n8n-imposed enforcement layer at the transport boundary). That reasoning is correct, but **`autoMapInputData` is NOT supported for executeWorkflow callers** — the node's schema has `supportAutoMap: false`, and n8n-docs explicitly state: *"If `supportAutoMap` is false, n8n hides the mapping mode selector field and sets mappingMode to defineBelow."*

**Fix that satisfies BOTH the design intent AND n8n's enforced grammar:**
- Caller side: `mappingMode: "defineBelow"`, `value: null`
- Trigger side: **unchanged** — every sub-workflow trigger is already in `inputSource: "passthrough"`
- Per n8n source code (ExecuteWorkflowTrigger.node.ts, verbatim): *"When `inputSource === PASSTHROUGH`, the trigger returns caller data unmodified: `return [inputData];`. This mode bypasses schema validation and field filtering entirely."*
- Runtime data flow is therefore identical to today. The `defineBelow + null` at the caller is purely syntactic appeasement of the validator. No envelope re-declaration; no maintenance-burden third layer; data-contracts entry-guard pattern survives intact.

Full research dump: `docs/research/data-contracts-smoke-2026-05-26-blocking-validation/` (26 files indexed in `00-INDEX.md`).

### Decision (2026-05-26)

#### 1. Mapping-mode fix

Change `workflowInputs.mappingMode: "passthrough"` → `mappingMode: "defineBelow"`, `value: null` on every caller-side executeWorkflow node across the affected 24 workflows (~70 nodes total). Bundle Class B Code-node return-shape fixes (`return {...}` → `return [{json: {...}}]`) into the same sprint.

#### 2. Sequencing — WF-01 first, smoke-test, then fan out

Per user direction (2026-05-26):

> *"For 2 — yes, recommend doing changes and quick testing of WF-01 then rest of the workflows if first one is success."*

Sequence:
1. **WF-01 only** — fix all 4 Class A nodes + Class B Code returns inside WF-01. Single PUT via the established jq-on-disk pattern (see `[[feedback_n8n_curl_workflow]]` — `source .env && curl -X PUT`). Verify with `validate_workflow` clean.
2. **Quick smoke test on WF-01** — simulate one inbound WhatsApp message to the test phone (`+61466927921`, currently `payment_pending` in DB). Confirm `WorkflowHasIssuesError` is gone and executions reach at least `Call WF-02 Rule Router`. WF-02 will fail next with the same error class — that's expected, and is the confirmation signal that the recipe works.
3. **If WF-01 smoke green: fan out to the remaining 23 workflows.** Order suggestion (revisit at plan-sprint time, anchored by `[[feedback_lock_decisions_in_plan]]`):
   - Pass 1: critical-path P1 workflows in execution order — WF-02, WF-10, WF-11, WF-00, WF-21, WF-22, WF-26, WF-32, WF-33, WF-50, WF-51, WF-60.
   - Pass 2: P2/P3 workflows — WF-23, WF-25, WF-30, WF-31, WF-34, WF-42, WF-46, plus the unidentified `2U7mxHMyqA41ROKX`, `MUG7rPgSHc7UtAE9`, `du32QBZbSQOjfESe`, `3va0M06kijgyLejf` (these need cross-check against workflow-registry during plan-sprint).
   - Per `[[feedback_systemic_before_individual]]`: the fix is systemic, not per-workflow. The recipe is fixed; the per-workflow loop is mechanical.

#### 3. Image-digest pin — LAST item of the sprint (after fixes + plugin improvements)

Per user direction (2026-05-26):

> *"For 3 — good idea, include that too — but mention that we'll be doing those changes as last thing after all work items are done, plugin-improvements if any are completed."*

After all 70+ node fixes have landed AND smoke-tested green AND any `flush-plugin-improvements` items have been captured (new technical-workflow-review guardrails for invalid mappingMode + plain-object Code returns are obvious plugin candidates), **pin `n8n-prod` from `docker.n8n.io/n8nio/n8n:latest` to a specific image digest.** Three reasons for placing this last:

- The digest we pin should be the one that's been smoke-tested green across the entire project surface — not an arbitrary point in time.
- If `flush-plugin-improvements` surfaces a new check that flags additional issues, fixing those first ensures we pin a known-clean state.
- Pinning is itself a small infrastructure change with non-trivial recovery semantics (need to test the pin doesn't break on next `docker-compose up`). Best done with everything else stable.

The pin work is **infrastructure**, not workflow. Update `/mnt/chinmay-astro-data/docker-compose.yml` on the VPS to reference the specific digest, recreate the container, verify version + execution health post-recreate.

### Change size

- **Large** by node count (~70 nodes touched) but mechanical per node — deterministic JSON field replacement.
- **Medium** by risk — each workflow needs a pre-edit backup (existing `scripts/backup-workflow.sh` covers it) and a smoke pass post-edit.
- **No** DB schema change, **no** new credential, **no** new external dependency.

### Blast radius

- 24 of 28 active workflows touched at the node level.
- WF-01 (P1) is the entry-point unblock. WF-02 (P1) is the next critical-path unblock. WF-10 (P1) is unblocked once admin command flows are exercised.
- Every workflow in the system goes through at least one re-validation pass after its edits.
- Pseudo files NOT touched — per `[[feedback_pseudo_tech_separation]]`, this is tech-level n8n config (not functional design); pseudo `Inputs:` blocks remain valid because the envelope contract content is unchanged.

### Trade-offs

- **Build now (this sprint):** Service is down — must build now. There's no defer option for a P1 blocker.
- **Bundle Class A + Class B in one sprint vs split:** bundled is cheaper (one round of backups, one validation pass per workflow) and avoids confusion about which fix is being made. Risk: a Class B edit could regress a Class A fix on the same workflow — mitigated by post-edit `validate_workflow` clean check before committing each workflow.

### Notes for plan-sprint phase (not blocking decision)

- Class B (Code return-shape) needs a structured per-workflow node count before scoping — likely a 5-minute jq pass yielding the exact list.
- Use jq-on-disk PUT (per `[[feedback_n8n_curl_workflow]]`), NOT MCP partial-update (per `[[feedback_n8n_mcp_nested_array_update]]` — nested-array updates silently no-op).
- Backup naming per established convention: `archive/backups/<workflowId>-<YYYY-MM-DD-HH-MM>.json`.
- Smoke tests run via this same `monitor-test-run` session (or a new one if context compacts) — the baselines from this session can be reused.
- Plugin-improvement candidates (`flush-plugin-improvements` queue):
  - New technical-workflow-review guardrail: invalid `workflowInputs.mappingMode` value detection.
  - New technical-workflow-review guardrail: Code-node plain-object return detection (`return {` without `[{json:`).
  - New infrastructure guardrail or doc: `:latest` Docker image tag warning + digest-pin recipe.
  - Update to data-contracts design language: clarify that "passthrough at the Execute Workflow boundary" is achieved via `defineBelow + value:null` (caller) + `inputSource: passthrough` (trigger), not via a literal `mappingMode: passthrough` value.

---

# Go-Live Build Queue — Summary

Gaps decided as **build for go-live** in this review:

| Gap | What | Where | Size | Order |
|---|---|---|---|---|
| **10** | **Fix invalid `mappingMode: "passthrough"` + plain-object Code returns project-wide; pin n8n image digest LAST** | **24 of 28 active workflows** | **Large (~70 nodes) but mechanical** | **P0 — sprint starter; WF-01 first → smoke → fan out** |
| 1 | Update Silent-Reject text to direct non-text senders to email `chinmay_astro@gmail.com` | WF-01 | Trivial (1 text string) | After Gap 10 |
| 2 | Add 3rd post-consult button "Done, thanks" with Slack signal | WF-42 + WF-43 | Small (~4-5 new nodes total) | After Gap 10 |
| 3b | Email-channel callout in payment_pending / payment_submitted / close messages | WF-22 + WF-32 + WF-42 | Trivial (3 text strings) | After Gap 10 |
| 3c | Distribute WF-43's Gemini-answer pattern to general_enquiry handling | WF-23 + WF-30 + WF-31 | Medium (~6 new nodes across 3 WFs) | After Gap 10 |
| 7 (stage 1) | Aging tag ("Paid 47 min ago") in WF-31 relay-to-Slack | WF-31 | Trivial (Code node update) | After Gap 10 |

Gaps decided as **post-MVP**:

| Gap | What | Why deferred |
|---|---|---|
| 4 | Country filter polite reply + rate-limit | Low foreign-number traffic at MVP scale |
| 5 | Repeated stop_intent admin alert | Frequency likely very low; revisit with traffic data |
| 6 | Opted-out re-engagement Slack notification (WF-26) | Low-frequency event; admin sees indirectly via downstream flows |
| 7 (stage 2) | Payment Approval Reminder cron | Bundled into post-MVP maintenance-workflows queue |
| 8 | INFO `<phone>` admin command | Scroll-up + pgAdmin cover the need; build with traffic evidence |
| 9 | `users.blocked_reason` DB persistence | Slack audit trail covers single-admin model |

Post-MVP related items also surfaced:
- **Emoji reactions on bot messages** → admin notification (out of Gap 1)
- **Maintenance workflows queue** (Gap 7 stage 2 sibling) — Payment Approval Reminder cron alongside WF-71, WF-72 etc.

---

## Next steps

1. Confirm the **6 go-live build items** above (Gap 10 + 5 others) are the complete scope for the next sprint.
2. For each item: write or revise pseudo first per `[[feedback_pseudocode_first_refactor]]`, then implement per the n8n-whatsapp-methodology plugin workflow. **Exception: Gap 10 does NOT require pseudo updates** — it is tech-level n8n config, not functional design (per `[[feedback_pseudo_tech_separation]]`).
3. Recommend grouping and ordering:
   - **Batch 0 (sprint starter — UNBLOCKS EVERYTHING):** Gap 10 mapping-mode + Code-return fix. WF-01 first → smoke test → fan out to 23 other workflows. Until Batch 0 lands, no other smoke testing is possible.
   - **Batch A (text-only, parallel-safe — runs after Batch 0):** Gap 1 + Gap 3b + Gap 7 stage 1 — all single text/code-node edits.
   - **Batch B (interactive button):** Gap 2 — WF-42 close-payload + WF-43 routing.
   - **Batch C (Gemini distribute):** Gap 3c — WF-23 + WF-30 + WF-31, sequential because they share pattern.
   - **Batch D (infra — runs LAST):** Gap 10 image-pin task only — after all Batches above are green AND `flush-plugin-improvements` items are captured.
4. Plan-sprint when ready.

