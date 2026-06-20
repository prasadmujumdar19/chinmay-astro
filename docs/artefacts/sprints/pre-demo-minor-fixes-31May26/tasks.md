# Sprint: pre-demo-minor-fixes-31May26

**Created:** 2026-05-31T10:53:27Z
**Source:** Pre-go-live customer testing with Chinmay. Last-minute fixes found while exercising the live flow before MVP demo/release. Issues are triaged into this file conversationally, one at a time, as they surface across multiple sessions.
**Sprint goal:** Clear the remaining last-minute, minor fixes so the MVP can be demoed/released — without stalling on any single fix.

---

## ⚠️ ROLLING SPRINT — READ THIS FIRST (plan-sprint & build-sprint)

**This is NOT a normal one-shot sprint. Do not apply the default lifecycle assumptions.** This file
is a *continuously-open, incrementally-populated* sprint that runs in a **pipelined, multi-session**
fashion during pre-go-live testing. The normal flow (`brainstorm → tasks.md → plan-sprint → state.md
→ build-sprint → close`) is here run as **overlapping stages on different items at the same time**:
one item may be in `build-sprint` while another is in `plan-sprint` while a third is being brainstormed
and appended here — each in a **separate Claude session**.

### Lifecycle rules (override skill defaults)

1. **The `_active` marker is USER-CONTROLLED.** It stays present until the user explicitly says "close
   this sprint." **`build-sprint` MUST NOT remove `_active`** when a batch, phase, or all-currently-
   planned items complete. Completing the queue ≠ completing the sprint. Only an explicit user
   instruction closes it.

2. **The task list is never "final."** New items (`PDF-NN`) are **appended** to this file over time —
   often while earlier items are mid-build in a sibling session. Planning is therefore **incremental**:
   - When `plan-sprint` is re-invoked and finds the source file changed (new items appended), it must
     **NOT default to destructive full-replan (option B)**. The desired behaviour is **additive**: plan
     ONLY the new items not yet present in `state.md`, append them, and **preserve all existing item
     status/history**. If the skill's A/B prompt can't express "add only the new items," choose **A
     (keep existing plan)** and plan the new items by hand into the existing `state.md` rather than
     wiping it. **Never destroy `state.md` history for a rolling sprint.**
   - `input_hash` mismatches are EXPECTED here and are **not** a signal to replan from scratch.

3. **Batch/queue exhaustion is not sprint completion.** `build-sprint` should report "current queue
   done, sprint still open (rolling)" and stop — leaving `_active` in place — rather than running any
   sprint-close/handoff-final ceremony.

### Concurrency rules (multiple sessions, Google Drive — no real file locks)

These files live on Google Drive and **several Claude sessions may have `tasks.md` / `state.md` open at
once.** There is no locking. To avoid clobbering each other:

4. **Edit only your own item's block.** A session working item `PDF-07` edits *only* the `### PDF-07`
   H3 block and its single row in the Summary table. **Never** reformat, re-sort, or rewrite sibling
   blocks or the whole file.

5. **Appends are append-only and go at the end of the relevant priority section.** Adding a new item =
   add one H3 block + one Summary-table row. Do not renumber or reorder existing items.

6. **Claim before you work.** Set the item's `**Owner session:**` field to the current session name
   when you start it, and its `**Status:**` to the working state. Before picking up an item, check that
   field — if another live session owns it, pick a different item or coordinate with the user. This is
   advisory (no enforcement), but it makes collisions visible.

7. **`state.md` is the status source of truth; `tasks.md` is the read-only-ish source list.** Per the
   skill, `build-sprint` tracks status in `state.md`. The only writes to *this* file are: (a) the user/
   brainstorm session **appending new items**, and (b) lightweight `**Status:**`/`**Owner session:**`
   field updates on an item's own block. Substantive status history belongs in `state.md`.

---

## Item ID convention

- IDs are `PDF-NN` (Pre-Demo Fix), zero-padded, assigned in append order: `PDF-01`, `PDF-02`, …
- Each item is an H3 block: `### PDF-NN · <short description>` under its priority H2 section.
- Each item carries a per-item `**Status:**` field so a glance at this file shows pipeline position
  even before `state.md` is written. Allowed values:
  `🆕 triaged` (in this file, not yet planned) → `📐 planning` (in plan-sprint) →
  `🔨 building` (in build-sprint) → `✅ done` → (`⚪ obsolete` / `🟡 needs-decision` as applicable).

---

## Priority Key

| Level | Meaning |
|---|---|
| 🔴 P0 | Demo/go-live blocker — user-visible bug, data integrity, compliance, or first-impression damage |
| 🟠 P1 | Real bug — should land before release, smaller scope / lower urgency than P0 |
| 🟡 P2 | Minor / polish — nice to fix before demo, not blocking |
| 🟢 EXIT | Sprint exit gate (only if/when the user defines one) |
| ⚪ OBSOLETE / DEFERRED | Triaged out — not picked up by this sprint |

---

## Sprint Summary

| ID | Priority | Description | Status | Owner session |
|----|----------|-------------|--------|---------------|
| PDF-01 | 🔴 P0 | WF-10 free-text → Gemini admin assistant (static knowledge) | ✅ done | — |
| PDF-02 | 🟡 P2 | Admin assistant: add current user-state context | 📐 planned — pending build (Batch 2, design-gated) | — |
| PDF-03 | 🟡 P2 | Admin assistant: add user message/consultation history context | 📐 planned — pending build (Batch 3, design-gated) | — |
| PDF-04 | 🔴 P0 | Bot tells customers it offers services that don't exist | ✅ done | — |
| PDF-05 | 🔴 P0 | Bot improvises answers to service/pricing questions without a reliable source of truth | ✅ done | — |
| PDF-06 | 🟠 P1 | False "message not relayed" alarms shown to admin when a consultation channel opens | ✅ done | — |
| PDF-07 | 🔴 P0 | Channel housekeeping events can be delivered to the customer as if from the astrologer | ✅ done | — |
| PDF-08 | 🟡 P2 | Consultation transcript polluted with system/command entries | ⚪ obsolete | — |
| PDF-09 | 🟡 P2 | Inconsistent "Dr. Chinmay" vs "Chinmay" naming to the customer | ✅ done | — |
| PDF-10 | 🟠 P1 | WF-25 mis-routes service/non-text/astrology questions away from the grounded reply | ✅ done | — |
| PDF-11 | 🟡 P2 | Action buttons scroll away after general-enquiry Q&A | ✅ done | — |
| PDF-12 | 🟡 P2 | Inconsistent payment instructions in payment_pending replies | ✅ done | — |
| PDF-13 | 🟡 P2 | WF-31 payment_submitted replies had two different styles | ✅ done | — |
| PDF-14 | 🟡 P2 | WF-43 post-consult "Welcome back" incoherence + REBOOK-only CTA | ✅ done | — |
| PDF-15 | 🔴 P0 | Astrologer's reply silently never reaches the customer if their last message was >24h ago | ✅ done · smoke ✅ | — · **live smoke ✅ 2026-06-10 (in+out window)** |
| PDF-16 | 🟠 P1 | When a message to the customer fails to send, the astrologer is never told | 🟢 done · smoke ⏳ | re-homed to WF-50 chokepoint; see state.md · **smoke NOT triggered 2026-06-10 (no send failed) — remaining** |
| PDF-17 | 🟠 P1 | Payment-rejection message can't reach the customer if rejected after a long gap | 🟢 done · smoke ✅ | — · **live smoke ✅ 2026-06-10 (reject + retry tap)** |
| PDF-18 | 🟠 P1 | No reminder to the astrologer that the free-reply window is about to close | 🟢 done · smoke ✅ | WF-75 · **live smoke ✅ 2026-06-10 — ACTIVATED + match-path + repeat-readiness** |
| PDF-19 | 🟡 P2 | Consultation-close prompt can't reach the customer if closed after a long gap | 🟢 done · smoke ✅ | WF-42 send→consultation_closed template; receiving side pre-built by PDF-17 · **live smoke ✅ 2026-06-10 (close + "Done" tap; other 2 buttons remaining)** |
| PDF-20 | 🟠 P1 | Relay/nudge window read counted Slack rows, skewing the 24h decision (emerged during PDF-18) | 🟢 done · smoke ✅ | WF-41 + WF-75 window read scoped to metadata->>'transport'='wa' · **live smoke ✅ 2026-06-10 (decisive trap test)** |
| PDF-21 | 🟠 P1 | Out-window relay used a template Meta mis-rendered; user made a replacement (emerged) | 🟢 done · smoke ✅ | WF-41 repointed to astrology_service_update_v2 · **live smoke ✅ 2026-06-10 (v2 sends, no 132xxx)** |
| PDF-22 | 🟡 P2 | Outside-in uptime check — nothing off the VPS reports when the whole service is unreachable | 🆕 triaged | — |
| PDF-23 | 🟠 P1 | No alert when a server container, the database, the disk, or the tunnel fails | ✅ done | — |
| PDF-24 | 🟠 P1 | Expired API credentials surface only via a customer's failed message (the Gemini-key incident) | ✅ done | — |
| PDF-25 | 🟡 P2 | No in-service health / execution-failure-rate monitoring (WF-70 never built) | 🆕 triaged | — |
| PDF-26 | 🟠 P1 | No automated database backups — data loss is currently unrecoverable | 🆕 triaged | — |

---

## 🔴 P0 — Demo/go-live blockers

### PDF-01 · WF-10 free-text → Gemini admin assistant (static knowledge)

**Status:** ✅ done (Batch 1 — see state.md)
**Priority:** 🔴 P0 | **Owner session:** —
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), `free_text` branch only.
**Depends on:** none. **Soft-blocks:** PDF-02, PDF-03 (they extend the same node).

**Design spec (locked):** `docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-design.md`
**Drop-in Gemini system prompt (verbatim, splice as-is):**
`docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-prompt.txt`

**What:** Today, when the admin types free-form text that isn't a recognised command, WF-10's
`Route by Kind (Admin)` Switch `free_text` output runs `Build Help Prompt` → `Call WF-51 (Help Prompt)`
and replies with the hardcoded line "🤖 Type `HELP` to see available commands." Replace that with a
Gemini call (`gemini-2.5-flash-lite`) that answers Chinmay's ops + user-advice questions from a static
baked-in knowledge base, then posts the answer via WF-51 (`wlZRK0YxnhP0b2RL`, `{channelId, messageText}`)
to the **same channel** the admin typed in.

**Behaviour (locked):**
- Ops question → explain the command + where to type it.
- User-advice question → explain policy **and** draft a labelled, business-tone, jargon-free WhatsApp
  reply ("Suggested reply:") Chinmay can copy-paste.
- Off-topic → polite in-domain decline + `HELP` pointer (this is a *successful* Gemini call, not an error).
- Gemini API failure/timeout/non-200 → fallback message: "⚠️ technical glitch, try again in a moment."
- Bounded to the consultation-service admin domain; the assistant **advises only**, never executes
  commands (structured `admin_wide` / `user_targeted` branches → WF-11 are untouched).

**Build is mechanical** (per design spec §3 + §8): add ~5–6 nodes on the `free_text` branch (Build
Gemini Request → HTTP Gemini [onError continue] → IF success → Extract/Build WF-51 payload / fallback
payload → Call WF-51), remove/repurpose `Build Help Prompt`. Reuse the Gemini HTTP pattern from the
inbound intent classifier (WF-10 has no LLM call to copy). Pseudo-first on `WF-10.pseudo`; backup WF-10;
jq-on-disk + curl PUT for nested-array Set edits; Write the prompt `.txt` into the node (don't pass
through a shell var). typeVersion floor to live WF-10 (Set v3.4 / IF v2.2 / Switch v3.3 / executeWorkflow v1.2).

**Acceptance:** see design spec §7 (5 functional checks + regression that structured commands still route to WF-11).

---

### PDF-04 · Bot tells customers it offers services that don't exist

**Status:** ✅ done (Batch 6 — see state.md)
**Priority:** 🔴 P0 | **Owner session:** —
**Change type:** TBD — determine fix location in plan/brainstorm.
**Related:** PDF-05 (same root: the automated reply makes up business facts).

**What (customer-facing):** The automated assistant invents services the business does not offer. When
the customer asked *"Do you offer video consultations?"*, the bot confidently replied *"Yes, we do offer
video consultations."* This is a **text-only** consultation service — there is no video offering. A paying
customer was promised something they cannot receive. The bot must not assert that a service exists; for any
"do you offer X?" question outside the known offering it should give an honest answer or defer to the
astrologer rather than fabricate a commitment.

**Evidence (live, production):** channel `consult-61491370732` (customer "Pra Muj"), 2026-06-02 — customer
message *"Do you offer video consultations?"* → bot reply *"Yes, we do offer video consultations…"*.

**Acceptance (functional):** asking about a service that isn't offered never yields a "yes, we offer it"
answer; the bot either states the actual offering plainly or defers the question to the astrologer. No
fabricated services or capabilities in any automated customer reply.

---

### PDF-05 · Bot improvises service/pricing answers without a reliable source of truth

**Status:** ✅ done (Batch 6 — see state.md)
**Priority:** 🔴 P0 | **Owner session:** —
**Change type:** TBD — determine fix location in plan/brainstorm.
**Related:** PDF-04 (the false-service answer is one symptom of this).

**What (customer-facing):** The automated assistant answers factual business questions (what's offered,
what it costs, what's included) by improvising, with no grounded set of business facts behind it. This means
it can give customers wrong, made-up, or mutually-contradictory information — e.g. when asked the price of
the (non-existent) video service it gave a vague non-answer rather than a correct one. The assistant needs a
single trusted set of business facts (offering, price, what's included, what's not) to answer from, and must
defer anything outside that set to the astrologer instead of guessing.

**Evidence (live, production):** channel `consult-61491370732`, 2026-06-02 — across three back-to-back
questions the bot gave three different, partly-fabricated answers about services/pricing.

**Acceptance (functional):** factual questions about the offering/price/inclusions are answered consistently
and correctly from a trusted source; anything outside it is deferred to the astrologer, never guessed.

---

### PDF-07 · Channel housekeeping events can be delivered to the customer as if from the astrologer

**Status:** ✅ done (Batch 4 — same WF-10 fix as PDF-06; see state.md)
**Priority:** 🔴 P0 | **Owner session:** —
**Change type:** TBD — determine fix location in plan/brainstorm.
**Related:** PDF-06 (same root, admin-side symptom), PDF-08 (same root, transcript symptom).

**What (customer-facing risk):** Routine housekeeping events on the consultation channel (someone joining or
leaving it, etc.) are being treated as if they were the astrologer's reply to the customer. During an active
consultation this means a customer could receive a message like *"so-and-so has joined the channel"* on
WhatsApp. In the observed case it did not reach the customer only because the consultation wasn't active yet
— but the exposure is real and would be visible to a customer mid-consultation. Only genuine messages the
astrologer types should ever be forwarded to the customer.

**Evidence (live, production):** channel `consult-61491370732`, 2026-06-02 — channel-join events were
processed as relay candidates the moment the channel was created (see PDF-06 for the admin-visible symptom).

**Acceptance (functional):** no automatic channel event (join/leave/system notice) is ever forwarded to the
customer; only deliberate astrologer messages reach WhatsApp.

---

### PDF-15 · Astrologer's reply unreachable when the customer's 24h window has closed

**Status:** ✅ done (Batch 9 — WF-41 window gate; in-window free-form / out-window `astrology_service_update` template; see state.md)
**Priority:** 🔴 P0 | **Owner session:** —
**Change type:** TBD — determine fix location in plan/brainstorm.
**Related:** PDF-16 (failure visibility — backstop), PDF-18 (passive nudge — prevention). PDF-17/PDF-19 share the same root (24h window) but are the fixed-content variants.

**What (customer-facing):** During a live consultation, Dr. Chinmay's replies are sent to the customer as
normal free-form messages. WhatsApp only allows free-form messages within 24 hours of the customer's last
message. If the customer last wrote more than 24 hours ago and Dr. Chinmay then replies, **the reply
silently never reaches the customer** — and Dr. Chinmay has no idea it didn't arrive. For a service whose
whole value is the astrologer's answers, a dropped answer is a dealbreaker.

The agreed behaviour (design decision, Meta-grounded — see Spec): when the window is open, reply as
normal (free, unchanged). When the window has closed, the app builds a window-safe version and either
**(a)** delivers the actual answer to the customer via a new "relay reply" template (the customer reading
it / replying re-opens the window and normal relay resumes), or **(b)** if the answer can't be made
window-safe (e.g. too long), the app does **not** send anything and instead tells Dr. Chinmay, in the same
channel, that it couldn't be delivered and to shorten & resend. Two properties are required: the decision
is made by our own rules *before* contacting WhatsApp (we never send-and-hope), and the gate is
**stateless** — a message that couldn't be delivered has no effect on how the next message is processed.

**Evidence:** Design analysis against live workflows, 2026-06-08 (relevant `.md` projections fresh =
pseudo matches live). No live incident yet — production traffic ~0, zero outbound failures logged — so
this is preventive. Meta rules confirmed from Meta docs (see Spec §2: non-template messages can only be
sent inside the 24h window; utility templates are free inside it, charged outside).

**Acceptance (functional):** an astrologer reply sent after the customer's window has closed either
reaches the customer (as a window-safe template) or results in a clear in-channel notice to Dr. Chinmay
that it wasn't delivered — never a silent drop. Once the customer responds, normal free-form relay
resumes. A previously-undeliverable message never blocks or alters the handling of later messages.

**Spec:** `docs/artefacts/specs/2026-06-08-24h-window-deliverability-design.md` (DD-2, DD-3).

---

## 🟠 P1 — Real bugs

### PDF-06 · False "message not relayed" alarms shown to admin when a consultation channel opens

**Status:** ✅ done (Batch 4 — see state.md)
**Priority:** 🟠 P1 | **Owner session:** —
**Change type:** TBD — determine fix location in plan/brainstorm.
**Related:** PDF-07 (same root, customer-side risk), PDF-08 (same root, transcript symptom).

**What (admin-facing):** The moment a consultation channel is created, the admin sees ⚠️ *"Message not
relayed — WhatsApp send skipped"* warnings — even though no admin has typed anything. They are triggered
simply by people joining the new channel. This is false-alarm noise that makes it look like something failed
when nothing did, and is especially confusing during a live demo. Housekeeping events should not produce
relay warnings at all.

**Evidence (live, production):** channel `consult-61491370732`, 2026-06-02 — two ⚠️ "Message not relayed"
warnings posted at channel creation, with no admin message having been sent.

**Acceptance (functional):** opening a consultation channel and people joining it produces no "message not
relayed" warnings; such warnings appear only when the admin actually types a message that genuinely can't be
delivered.

---

### PDF-16 · Failed customer messages are invisible to the astrologer

**Status:** 🟢 done
**Priority:** 🟠 P1 | **Owner session:** build-pre-demo-minor-fixes-8Jun26-3
**Change type:** Structural — re-homed to WF-50 (outbound chokepoint): catch Meta rejection + report via WF-51. Build detail in state.md.
**Related:** PDF-15 (this is the backstop beneath the relay gate); applies equally to PDF-17/PDF-19.

**What (customer-facing / admin-facing):** When a message we try to send the customer is rejected by
WhatsApp — for any reason (the 24h window having closed, or anything else) — nobody is told. The send is
already detected as failed internally, but it's then ignored, so the customer doesn't get the message and
Dr. Chinmay believes it went through. He should instead see a clear notice, in the consult channel, that
the message didn't reach the customer.

**Evidence:** Design analysis against live workflows, 2026-06-08. The outbound sender already returns a
failure result on a Meta error, but the relay / close / rejection callers ignore it — no alert is raised.

**Acceptance (functional):** any customer-bound message that WhatsApp rejects produces a clear, plain-language
notice to Dr. Chinmay in the relevant channel; no customer-bound send fails silently.

**Spec:** `docs/artefacts/specs/2026-06-08-24h-window-deliverability-design.md` (DD-4).

---

### PDF-17 · Payment-rejection message unreachable after a long gap

**Status:** 🟢 done (2026-06-09; build detail in state.md)
**Priority:** 🟠 P1 | **Owner session:** build-pre-demo-minor-fixes-8Jun26-2
**Change type:** Structural — scope expanded S→M at build (receiving-side): WF-34 send interactive→`payment_rejection` template + WF-02 post-filter template-button normalizer + WF-00 log nicety; WF-50 unchanged. Also pre-delivered PDF-19's receiving side.
**Related:** PDF-19 (sibling fixed-content "always template" conversion); PDF-15 (same 24h-window root).

**What (customer-facing):** When Dr. Chinmay rejects a payment, the customer gets a "we couldn't verify
your payment, please try again" message with a retry button. Today that's a normal interactive message, so
if the rejection happens more than 24 hours after the customer's last message it never reaches them and the
customer is left stuck with no idea their payment was rejected. The fix (design decision): make the
rejection message a standard service **template** so it always reaches the customer regardless of timing —
the same way payment **approval** already works. Because the content is fixed, this is one single path
(always a template); it does not need any window-checking logic — it's free inside the window and a small
charge outside.

**Evidence:** Design analysis against live workflows, 2026-06-08 (`.md` fresh = pseudo matches live). The
rejection prompt is sent as an interactive button message, which WhatsApp blocks outside the 24h window.

**Acceptance (functional):** a payment rejection always reaches the customer (with a way to retry),
whether or not their 24h window is open; behaviour is consistent every time. Requires a new approved
service template for the rejection message.

**Spec:** `docs/artefacts/specs/2026-06-08-24h-window-deliverability-design.md` (DD-1).

---

### PDF-18 · No reminder when a customer's free-reply window is about to close

**Status:** 🟢 done · live smoke ✅ 2026-06-10 (WF-75 built 2026-06-09; **ACTIVATED + match-path + repeat-readiness verified** in the coordinated smoke — kept active per user decision; see state.md + `docs/artefacts/tests/smoke-24h-window-deliverability-2026-06-10/`)
**Priority:** 🟠 P1 | **Owner session:** build-pre-demo-minor-fixes-8Jun26-4
**Change type:** Workflow-Create — new WF-75 scheduled job (first scheduled/background workflow, `WF-7x`
range, pulled forward from "post-go-live" per user decision 2026-06-08). Build detail in `state.md`.
**Related:** PDF-15 (prevention layer in front of the relay gate).

**What (admin-facing):** There's currently nothing that warns Dr. Chinmay that a customer's 24-hour
free-reply window is running out. A simple reminder posted into the consult channel as the window nears
closing (e.g. several hours before) would let him answer for free, in plain text, before we ever have to
fall back to a template. The reminder is **advisory only and non-blocking** — Dr. Chinmay can choose not
to reply within the window, and that's perfectly fine; the relay fallback (PDF-15) still handles it. No
automatic action is taken on the customer's behalf.

**Evidence:** Design analysis against live workflows, 2026-06-08 — confirmed there is no scheduled/background
job of any kind today; the relay path keeps no live "time since last customer message" signal in the
channel.

**Acceptance (functional):** when a customer's window is close to expiring during an open consultation and
Dr. Chinmay hasn't replied, a clear advisory reminder appears in that consult channel. It never blocks,
never auto-replies, and is harmless to ignore.

**Spec:** `docs/artefacts/specs/2026-06-08-24h-window-deliverability-design.md` (DD-5).

---

### PDF-10 · WF-25 mis-routes service/non-text/astrology questions away from the grounded reply

**Status:** ✅ done (Batch 7 — see state.md)
**Priority:** 🟠 P1 | **Owner session:** —
**Change type:** Structural — single workflow (WF-25 Intent Classifier `eTV1lUcYrXBg2q2T`), classifier prompt.
**Related:** PDF-04/05 (surfaced while validating the grounded-KB reply).

> **Emerged during implementation** (not original triage): surfaced ad-hoc during the PDF-04/05 live
> test session, 2026-06-06, and built + verified in the same session. First captured in `followups.md`
> as the "PDF-04/05 validation finding," resolved there as PDF-10. Backfilled here for completeness.

**What (customer-facing):** Service/offering/pricing "how do I get it" questions, non-text modality
requests (audio/video/phone), and astrology-adjacent questions were classified `wants_consultation`
(the category def's "or is asking about booking" clause) and routed to the canned payment reminder —
bypassing the grounded Gemini KB reply built in PDF-04/05. `wants_consultation` was narrowed to a clear
intent to begin the text consultation; everything else routes to `general_enquiry` → grounded Gemini
reply. Impact-checked across all 4 WF-25 callers before change.

**Acceptance:** service/pricing/how-to/non-text/astrology-adjacent questions reach the grounded reply
(or defer to Dr. Chinmay); only a clear "start my consultation" intent hits the booking/payment path.

---

### PDF-23 · Server-side infrastructure health checks (containers, database, disk, tunnel)

**Status:** ✅ done (2026-06-20 — VPS cron, hourly; build detail in state.md)
**Priority:** 🟠 P1 | **Owner session:** —
**Change type:** TBD — determine in plan/build (VPS-local; not an n8n workflow).
**Related:** PDF-22 (outside-in counterpart), PDF-25 (in-service counterpart)

**What:** Nothing watches the machine the service runs on. If a container stops (n8n / database /
encryption helper), the database becomes unresponsive, the disk fills up (which silently kills the
database), or the Cloudflare tunnel drops, no one is told — today the first signal would be customers
failing to get replies. A lightweight check should run on the server every few minutes and alert the
admin when any of these is unhealthy. It must repeat-suppress (alert once, then re-alert only after a
sustained-failure interval) so a multi-hour outage doesn't flood the admin, and it must deliver its
alert by a path that does NOT depend on n8n — because n8n may itself be the thing that is down.

**Why it matters:** This is the most reliable internal safety net and the cheapest to run. It catches
failure classes that in-service (n8n) checks structurally cannot — if n8n is down, an n8n-based check
can't fire.

**Acceptance:** within minutes of any of {a core container down, database unresponsive, disk past a
threshold, tunnel service inactive}, the admin receives one alert (not a flood) over a channel that keeps
working even when n8n is down.

---

### PDF-24 · Scheduled credential-validity checks (Gemini + WhatsApp)

**Status:** ✅ done (2026-06-20 — VPS cron, reuses PDF-23 helper; build detail in state.md)
**Priority:** 🟠 P1 | **Owner session:** —
**Change type:** TBD — determine in plan/build (VPS-local; not an n8n workflow).

**What:** API credentials can expire or hit quota with no warning. Today the only signal is a customer's
message visibly failing and landing in the admin channel — the admin finds out *after* a customer is
hurt. A scheduled job should proactively test the credentials and alert the admin the moment one stops
working:
- **WhatsApp token** — checked once daily. (It is also continuously exercised by normal traffic: every
  outbound message uses it, so passive coverage is already strong; the daily check covers quiet periods.)
- **Gemini key** — checked twice daily, at 00:00 and 12:00 IST. Gemini is only exercised when a customer
  sends free-form text (intent classification, mainly during an active consultation); on a quiet day with
  only button/form taps it may not be called at all, so it needs an active scheduled probe. Frequency is
  kept deliberately low — frequent probes add API cost for no extra detection benefit.

**Evidence:** the Gemini API key recently went bust and was discovered only when a customer's failed
message surfaced in the Slack admin channel — exactly the silent failure this prevents.

**Why it matters:** "Chinmay finds out before the customer does." Directly closes the incident class that
triggered this monitoring effort.

**Acceptance:** when a credential is invalid / expired / over-quota, the admin is alerted by the next
scheduled check (≤12h for Gemini, ≤24h for WhatsApp) — before, not after, a customer hits a failed
interaction. Alert delivery does not depend on n8n.

---

### PDF-26 · Automated PostgreSQL backups (hourly always-latest on-VPS + daily offsite)

**Status:** 🆕 triaged
**Priority:** 🟠 P1 | **Owner session:** —
**Change type:** TBD — determine in plan/build (VPS cron; retention policy + offsite destination wiring
decided in plan).

**What:** There is no automated database backup today, so any data loss (disk failure, corruption, bad
write) is currently unrecoverable. Add a scheduled dump:
- **Hourly** dump to the VPS's mounted storage, kept always-latest (each successful dump supersedes the
  previous) → ~1-hour recovery point for hardware loss.
- **Daily** copy (the 00:00 dump) pushed offsite to a designated Google Drive location → survives total
  VPS loss.

**Design note for planning:** an "always-latest single copy" protects against hardware loss but NOT
logical corruption — a corrupted state dumped hourly would overwrite the last good copy within the hour.
Plan should set retention so a clean restore point survives corruption (e.g. always-latest hourly on-VPS
PLUS a rolling set of the last N daily snapshots offsite), not just a single newest file.

**Why it matters:** data-loss risk is non-negotiable once real customers are on the system.

**Acceptance:** an up-to-date database backup always exists on mounted VPS storage (≤1h old) and a daily
copy exists offsite on Google Drive; a documented restore path recovers the database from either; backup
failures themselves raise an alert.

---

## 🟡 P2 — Minor / polish

### PDF-02 · Admin assistant — add current user-state context

**Status:** 📐 planned — pending build (Batch 2, design-gated; extends PDF-01)
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** Structural — WF-10 (same `free_text` branch / Gemini node as PDF-01).
**Depends on:** **PDF-01 (hard)** — extends the same Gemini node; do not start before PDF-01 lands.

**What:** Give the admin assistant the **current state of the user tied to the channel** so "this
user…" questions get user-specific answers instead of general guidance. Resolve the `consult-{phone}`
channel → user, fetch `status`, `name`, and last action, and feed them into the Gemini prompt (extend
the PDF-01 system prompt with a "current user" context block). Adds a DB-lookup step + channel→phone→
user resolution before the Gemini call.

**Open design questions (resolve in plan/brainstorm before build):** what happens when the channel has
no user row (admin-wide channel, orphaned channel) — assistant should fall back to PDF-01 static-only
behaviour; exact fields to include; PII boundary.

### PDF-03 · Admin assistant — add user message/consultation history context

**Status:** 📐 planned — pending build (Batch 3, design-gated; extends PDF-02)
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** Structural — WF-10 (same branch).
**Depends on:** **PDF-02 (hard)** — builds on the user-resolution + context block PDF-02 adds.

**What:** Add recent message / consultation history for the channel's user to the assistant's context
so it can answer questions that need the conversation backstory. **Weigh carefully:** PII into the LLM
prompt, token/payload cost, and how much history is actually useful. Likely needs a "last N messages"
cap and a redaction/scope decision. Design before build.

### PDF-08 · Consultation transcript polluted with system/command entries

**Status:** ⚪ obsolete (WON'T DO 2026-06-06 — housekeeping/join lines already removed by the PDF-06/07 gate; admin commands kept in transcript by design; see state.md)
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** TBD — determine fix location in plan/brainstorm.
**Related:** PDF-06 / PDF-07 (same root: system/non-conversation events treated as conversation).

**What (admin-facing):** The saved record of a consultation mixes non-conversation entries — "so-and-so has
joined the channel" lines and the admin's own command keystrokes — in with the real customer dialogue. This
makes the transcript noisier and less trustworthy as a record of what was actually said between customer and
astrologer. Only genuine customer ↔ astrologer messages belong in the conversation record.

**Evidence (live, production):** channel `consult-61491370732`, 2026-06-02 — the stored conversation history
contains channel-join lines and the admin's approval command alongside the customer's messages.

**Acceptance (functional):** the consultation transcript contains only real customer and astrologer
messages; channel housekeeping events and admin commands are excluded.

### PDF-09 · Inconsistent "Dr. Chinmay" vs "Chinmay" naming to the customer

**Status:** ✅ done (Batch 5 — chose "Dr. Chinmay"; see state.md)
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** TBD — determine fix location in plan/brainstorm.

**What (customer-facing, cosmetic):** The customer is addressed inconsistently — one automated message
referred to *"Dr. Chinmay"* while payment instructions and other messages use plain *"Chinmay"*. Pick one
correct form and use it consistently across all customer-facing messages (and confirm whether the "Dr."
title is accurate at all).

**Evidence (live, production):** channel `consult-61491370732`, 2026-06-02 — automated reply *"…Dr. Chinmay
is currently reviewing it…"* vs other messages naming plain "Chinmay".

**Acceptance (functional):** a single, correct form of the astrologer's name/title is used consistently in
every customer-facing message.

---

### PDF-19 · Consultation-close prompt unreachable after a long gap

**Status:** 🟢 done
**Priority:** 🟡 P2 | **Owner session:** build-pre-demo-minor-fixes-8Jun26-3
**Change type:** Structural — WF-42 single-node send swap (interactive 3-button → `consultation_closed` template); receiving side pre-built by PDF-17. Build detail in state.md.
**Related:** PDF-17 (sibling fixed-content "always template" conversion); PDF-15 (same 24h-window root);
PDF-11 / PDF-14 (the post-close experience this must preserve).

**What (customer-facing):** When Dr. Chinmay closes a consultation, the customer gets a wrap-up message
with the three buttons (Leave Feedback / Book Again / Done, thanks). Today that's a normal interactive
message, so if he closes more than 24 hours after the customer's last message it never reaches them — the
customer never learns the consultation is closed and never gets the feedback/rebook options. The fix
(design decision): send the close prompt as a **template** so it always arrives, the same single-path
approach as payment approval/rejection (fixed content → always a template, no window logic).

Two constraints to honour: **(a)** the template must carry **all three** quick-reply buttons with the same
identities and wording as today, and a template button tap arrives in a slightly different shape than the
current interactive button — so the post-close handling must accept both; **(b)** the post-close experience
fixed earlier this sprint (PDF-11 button re-attachment, PDF-14 time-neutral copy) must still hold — only
the close prompt itself becomes a template; everything after the customer's first tap is the normal
in-window flow, unchanged. The existing but unused `consultation_closed_feedback` template has different
body copy and must be reviewed/updated to match the current close message + buttons.

**Evidence:** Design analysis against live workflows, 2026-06-08 (`.md` fresh = pseudo matches live). The
close prompt is sent as an interactive 3-button message, which WhatsApp blocks outside the 24h window. The
`consultation_closed_feedback` template exists with 0 sends (unused) and mismatched body copy.

**Acceptance (functional):** closing a consultation always delivers the wrap-up prompt to the customer —
with all three options working — regardless of their 24h window, and the existing post-close experience
(buttons staying available, time-neutral copy) is unchanged.

**Spec:** `docs/artefacts/specs/2026-06-08-24h-window-deliverability-design.md` (DD-1, §5 template note).

---

### PDF-11 · Action buttons scroll away after general-enquiry Q&A

**Status:** ✅ done (Batch 7 — see state.md)
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** Structural — WF-30 (`gGJBY5fJha0Let8I`) + WF-43 (`3va0M06kijgyLejf`), reply-payload nodes.
**Related:** PDF-04/05 (same reply nodes).

> **Emerged during implementation** (not original triage): surfaced ad-hoc during the PDF-04/05 live
> test session, 2026-06-07; built + verified the same session. Backfilled here for completeness.

**What (customer-facing):** After several general-enquiry replies, the action button sent once (at form
submission / consultation close) is scrolled far up and out of reach. The relevant reply nodes now
re-attach the action button(s) as an interactive message on each reply (WF-30 the `payment_completed`
button; WF-43 the three post-consult buttons), so the customer always has the control to hand.

**Acceptance:** the relevant action button(s) stay reachable after any general-enquiry exchange, without
the customer scrolling back.

---

### PDF-12 · Inconsistent payment instructions in payment_pending replies

**Status:** ✅ done (Batch 7 — see state.md)
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** Structural — single workflow (WF-30 `gGJBY5fJha0Let8I`), reply nodes.
**Related:** PDF-11 (same WF-30 reply nodes).

> **Emerged during implementation** (not original triage): surfaced ad-hoc during the PDF-04/05 live
> test session, 2026-06-07; built + verified the same session. Backfilled here for completeness.

**What (customer-facing):** The general-enquiry reply path phrased its payment call-to-action via Gemini
— incomplete (no UPI handle/payee) and inconsistent with the deterministic reminder path. One canonical
payment-details block (full UPI handle + payee) is now appended in code to both reply nodes, and Gemini
is told to stop phrasing payment instructions, so every payment_pending reply ends with the same correct
block.

**Acceptance:** every payment_pending reply carries the identical, complete payment instructions; the
bot never improvises payment details.

---

### PDF-13 · WF-31 payment_submitted replies had two different styles

**Status:** ✅ done (Batch 8 — see state.md)
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** Structural — single workflow (WF-31 `HB8nXudAtk9iXz7C`), reply nodes.
**Related:** PDF-12 (mirrors the same canonical-block pattern).

> **Emerged during implementation** (not original triage): surfaced ad-hoc during the PDF-11/12 live
> validation session, 2026-06-07; built pseudo-first + verified the same session. Backfilled here for
> completeness.

**What (customer-facing):** In payment_submitted, the general-enquiry (Gemini) path and the canned
wants_consultation path described the "under review" status in two different styles. Both paths now end
with one byte-identical "payment is under review" block, and Gemini is told not to phrase the review
status itself.

**Acceptance:** every payment_submitted reply describes the review status in one consistent form
regardless of path.

---

### PDF-14 · WF-43 post-consult "Welcome back" incoherence + REBOOK-only CTA

**Status:** ✅ done (Batch 8 — see state.md)
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** Structural — single workflow (WF-43 `3va0M06kijgyLejf`), two Gemini prompt nodes.
**Related:** PDF-11 (same WF-43 reply path), PDF-19 (the post-close experience this preserves).

> **Emerged during implementation** (not original triage): surfaced ad-hoc during the PDF-11/12 live
> validation session, 2026-06-07; built pseudo-first + verified the same session. Backfilled here for
> completeness.

**What (customer-facing):** Two UX issues from PDF-11/12 validation: (a) the reply told users to "reply
REBOOK" while actually sending a Book Again button; (b) the standard returning-user prompt said "welcome
back" — incoherent right after a just-closed consultation. Both prompts now offer "tap Book Again OR
reply REBOOK"; the standard prompt is time-neutral (no "welcome back"), while the opted-out prompt keeps
welcome-back (a re-engaging opted-out user genuinely returned). Gap-aware welcome via DB last-contact
lookup deferred to post-MVP (TD-NEW-042).

**Acceptance:** post-close replies present both rebook options consistently; copy is coherent regardless
of how long since the consultation closed.

---

### PDF-20 · Relay/nudge window read counted Slack rows (emerged during implementation)

**Status:** 🟢 done (WF-41 + WF-75, 2026-06-09 — see state.md for build detail)
**Priority:** 🟠 P1 | **Owner session:** build-pre-demo-minor-fixes-8Jun26-4
**Change type:** Structural — single-node SQL on WF-41 + WF-75. Emerged during the PDF-18 build; resolves
the followups.md adjacent finding (PDF-15's WF-41 window read was not WhatsApp-scoped).

**What:** `chinmay_astro.messages` logs the astrologer's Slack typing as `direction='inbound'` and the
nudge's own Slack post as `direction='outbound'`. WF-41's relay in/out-window read counted those Slack
rows, so a Slack message could masquerade as the customer's last inbound → window reads open while the
customer has been silent >24h → free-form relay → Meta out-of-window rejection (silent non-delivery).
Fix: scope both WF-41's `Load Last Inbound` and WF-75's scan to `metadata->>'transport'='wa'` (the correct
WhatsApp discriminator, not a `message_type` allow-list). Verified live: at-risk user 42's read corrected
from the 20:16 Slack row to the real 08:59 WhatsApp inbound.

**Acceptance:** both window reads key only on the customer's WhatsApp messages; Slack rows never skew them.
Live end-to-end folds into the deferred PDF-15/16/17/18/19 coordinated smoke.

---

### PDF-21 · Out-window relay template repointed to a corrected version (emerged during implementation)

**Status:** 🟢 done (WF-41, 2026-06-10 — see state.md for build detail)
**Priority:** 🟠 P1 | **Owner session:** build-pre-demo-minor-fixes-8Jun26-4
**Change type:** Surgical — single template-name constant in WF-41 `Prepare WhatsApp Message`.

**What:** the out-window relay template `astrology_service_update` had a Meta bold-rendering bug (split `*`
→ literal asterisks). The user retired it and created `astrology_service_update_v2` (header "Follow-up on
your consultation", body "*Dr. Chinmay has responded to your message:* {{1}}" + "Thanks, Chinmay Astro",
one `{{1}}`, correct bold). WF-41 repointed to the new name; send-payload contract unchanged (single body
text param, `en`).

**Acceptance:** out-window relay delivers via `astrology_service_update_v2`. External prerequisite: the v2
template must be Approved/Active in Meta — verified at the deferred PDF-15/16/17/18/19 coordinated smoke.

---

### PDF-22 · Outside-in reachability check (Claude routine)

**Status:** 🆕 triaged
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** TBD — determine in plan/build (Claude Cloud routine; the only check that runs off the VPS).
**Related:** PDF-23 (server-side counterpart)

**What:** Every other health check runs on the VPS itself, so none of them can report "the whole VPS /
tunnel / n8n is down" — a dead host can't alert on its own death. A single check running OUTSIDE our
infrastructure should reach the public service URL on a schedule and alert the admin if it is
unreachable. This runs as a Claude Cloud routine (keeps working with the laptop off, independent of the
VPS). Cadence: every 2 hours. Scope is deliberately minimal — just an outside-in "is it alive?" ping; all
other checks stay on the VPS.

**Why it matters:** complements the server-side checks by covering the one case they cannot — the host
being completely dead. Kept low-frequency to stay well within routine usage limits and cost.

**Constraints (for planning):** Claude routines run in Anthropic's cloud, cannot SSH into the VPS, and
reach it only over the public URL; minimum schedule interval is 1 hour (2h chosen); routine runs draw on
the same Claude subscription budget, and there is a per-account daily cap on routine runs (visible at
claude.ai/code/routines). Alert delivery should use a swappable webhook destination, not be hard-wired to
a specific messaging connector.

**Acceptance:** if the public service URL is unreachable, the admin is alerted within one 2-hour cycle,
even when the VPS is fully down.

---

### PDF-25 · Build WF-70 — in-service health + execution failure-rate monitor

**Status:** 🆕 triaged
**Priority:** 🟡 P2 | **Owner session:** —
**Change type:** TBD — determine in plan/build (new n8n workflow; WF-70 is currently a planned, unbuilt
shell in the registry).
**Related:** PDF-23 (server-side counterpart), PDF-24 (credential counterpart)

**What:** Build the long-planned in-service health workflow (WF-70). It complements the server-side and
credential checks with business-level signals only n8n can see from the inside:
- a real database query succeeds (not just "the port answers"),
- the WhatsApp API responds to a status call,
- workflow executions are not silently failing at a higher-than-baseline rate (catches a broken node that
  swallows errors rather than crashing loudly).
By design it cannot detect n8n being down (it runs inside n8n) — so it complements PDF-22/23, not
replaces them.

**Why it matters:** catches slow / silent degradation (rising error rate, a flaky dependency) that
up/down checks miss. Lower urgency than the up/down and credential checks, hence P2.

**Acceptance:** WF-70 runs on a schedule, verifies DB + WhatsApp API responsiveness with real calls, and
raises an admin alert when execution failure-rate exceeds a baseline threshold.

---

## ⚪ OBSOLETE / DEFERRED

_(none yet)_
