# BMX-06 — New-Contact Flow Redesign (incl. BMX-05 overlap)

> **⚠️ DESIGN AMENDMENT (2026-05-29, applied during BMX-P0-U2 build):** Block audit unifies on the
> **EXISTING legacy `users` columns** `blocked_reason` / `blocked_at` / `blocked_by` — NOT a new
> `block_reason` column (that column, briefly added the same day, was dropped:
> `scripts/migrations/2026-05-29-bmx06-drop-block-reason-use-legacy.sql`). `blocked_reason` is
> **caller-supplied verbatim** via a `blockReason` envelope field on U2 (no string composition in the
> utility — callers pass `threshold_non_text` / `threshold_garbage` / `abuse` / …); `blocked_at=NOW()`;
> `blocked_by` = provenance (`'admin'` manual, workflow id e.g. `'WF-61'` for system blocks). All
> `block_reason` references below have been updated to `blocked_reason`.
>
> **STATUS (2026-05-29 session close):**
> - BMX-06 **structure = FINAL** (WF-01/02/21/23 + utilities U1/U2/U3 + silent_drop table + thresholds).
> - BMX-06 **content (copy + U3 prompt) = DRAFT** in §11 — MUST be re-verified VERBATIM with the user at
>   build-sprint time (see the VERIFY banner in §11).
> - **Resolved since (2026-05-29):** message debouncing = deferred fast-follow (§9a); BMX-05 = designed in
>   the existing-user safety-net spec (§12). See §0.
>
> This file is the durable source of truth — the final spec is a cleanup of this file, NOT a regeneration
> from memory. Do not discard any flow without explicit user sign-off.

> 🔧 **AMENDED 2026-05-29 (folded from the existing-user safety-net spec §7):**
> 1. **Block-state unified on `status='blocked'`** — every `blacklisted` below is now `blocked` (one
>    terminal block state across admin BLOCK, WF-46-abuse, and threshold/abuse auto-block). A new nullable
>    **`blocked_reason`** column on `users` records the cause (`admin` / `abuse` / `threshold_garbage` /
>    `threshold_nontext`). The WF-01 "Blacklisted?" gate is the unified **"Blocked?"** gate.
> 2. **Opt-out aliases in the literal preempts** — WF-21 step 2 and WF-23 step 2 preempt
>    `STOP | UNSUBSCRIBE | OPT OUT | OPT-OUT` (exact-match after `uppercase(trim())`), same per-stage
>    treatment as STOP. (REBOOK unchanged.)
> Authority for both: `docs/artefacts/specs/2026-05-29-existing-user-safety-net-design.md` (decisions #1, #6).
> Inline references below have been updated to match.

## 0. STATUS — agenda resolved (updated 2026-05-29)

All items from this file's original next-session agenda are now resolved:
1. **Message debouncing / buffering** — ✅ DECIDED: deferred to a pre-go-live fast-follow, NOT part of
   BMX-06 (see §9a). Captured, not open.
2. **BMX-05 / opt-out aliases** — ✅ DESIGNED in the existing-user safety-net spec
   (`docs/artefacts/specs/2026-05-29-existing-user-safety-net-design.md` decision #6). Existing users →
   WF-20→WF-47; new/pre-form aliases folded into WF-21/WF-23 step-2 preempts (see the AMENDED banner above).
3. **Finalize BMX-06 copy/prompt verbatim** (§11) — still pending; done at build-sprint time per the §11
   VERIFY banner.

This design is spec-ready. Build per the cross-spec **Phase 0→5 sequence** in the safety-net spec §8.2.

- **Session date:** 2026-05-29
- **Sprint:** behavior-matrix-fixes-2026-05-27 (items TD-BMX-06 main, TD-BMX-05 folded in)
- **Tunnel verified live:** WF-01 (hYGNM97sXvdo1WmI), WF-21 (zM8WbxSdt9nXRoLZ), WF-23 (VpCER0Vqq3NYJGpI) read from live n8n during this session.

---

## 1. Problem & scope

Today any non-keyword first-time message from a no-record phone gets the same canned welcome+form,
and several edge inputs (STOP/REBOOK from new phones, non-text, abuse) are handled inconsistently or
not at all. This redesign reshapes the **inbound triage + new-contact handling** across WF-01, WF-02,
WF-21, WF-23, and introduces three shared utilities.

**In scope:** WF-01, WF-02, WF-21, WF-23 + utilities U1/U2/U3 + `silent_drop` table.
**Out of scope (parked):** WF-23's *exhaustive* existing internals beyond the redesign; full WF-02
state-handler internals (unchanged).

---

## 2. Decisions locked (with rationale)

1. **Block a no-record phone = insert `users` row `status=blocked`** (chose tasks.md option (a), a
   stub row, over a separate `blocked_phones` table; `blocked_reason='abuse'`). One table, one lookup.
   Probable cause = the abusive act. So the universal block lookup catches ex-registered AND new-abuser
   phones alike. *(Amended 2026-05-29: was `blacklisted` — unified on `blocked` + `blocked_reason`.)*
2. **Fail-open on classification** — silent-drop only high-confidence garbage / stop_intent / abuse;
   `unrelated` and any low-confidence go to a gentle redirect + form (never ghost a real prospect).
   Echoes the SP-04 (2026-05-23) precedent against trusting Gemini on early-journey paths.
3. **`STOP`/`REBOOK` removed from WF-01's User-Load Gate** (`anomaly_keyword` path deleted). They flow
   downstream. `anomaly_interactive` is also gone from WF-01 — absorbed into WF-21/WF-23 step 1.
4. **Literal STOP/REBOOK are preempted BEFORE the U3 classifier** in both WF-21 and WF-23 (keeps the
   classifier input clean/identical). Treatment differs by stage (see §6/§7).
5. **New-user non-text → silent drop** (no "send Hi" reply). Genuine users self-correct with a text
   follow-up; abusers get no engagement. (The warm "send Hi" copy drafted earlier is retired.)
   Existing/pre-form users keep a deflection message (they have a relationship).
6. **`silent_drop` table + threshold auto-block.** Every drop/rate-limited reply logs a row;
   when the per-phone count over a **30-day rolling window** reaches the caller-supplied threshold,
   auto-block (`status='blocked'`, `blocked_reason='threshold_*'`) + admin alert. **30-day window is NEVER
   surfaced to users.**
7. **Thresholds:** new/pre-form = 5; fully-onboarded = 10; legit-but-repeating (welcome/form loop) = 10;
   fail-open redirect = 5; abuse = instant. See §4 table.
8. **WF-01 = identity/security gate only** (no messageType branching). **WF-02 = messageType + state
   router** for anyone with a record; owns existing-user non-text deflection.
9. **WF-21 and WF-23 stay separate workflows** (code sanity) despite overlapping logic.
10. **Classifier = shared sub-workflow U3** with `stage` param (new|pre_form); callers run their own
    actions. Does NOT reuse WF-25 (different taxonomy + unwanted side effects).
11. **STOP/REBOOK asymmetry kept:** brand-new = silent drop + escalate; pre-form = clarifier + escalate.
    STOP and REBOOK get *different* clarifier copy.
12. **Replies are English-only for now** (Hindi/Hinglish classification works; copy localization deferred).

---

## 3. Shared utilities (all follow data-contract discipline)

All three: callers send a **fixed contracted envelope** (`mappingMode: defineBelow`, `value: {}` per the
2026-05-24 data-contract design §2.1–2.6); the utility's **first node is a validator/entry guard**
(passthrough). Exact envelope shapes to be pulled from the data-contract design doc at spec time.

> **Proposed workflow numbers (clash-free vs live + registry, 2026-05-29):** U1 = **WF-53**,
> U2 = **WF-61**, U3 = **WF-62**. NOTE: WF-24 / WF-27 / WF-28 are *retired-renamed* numbers — do NOT
> reuse them. Confirm/assign final numbers via workflow-registry at build time.

### U1 · Gemini Error Handler  (proposed WF-53)
```
IN: { phone, consultChannelId?, context }
→ apology to user via WF-50 (if user-facing)
→ admin alert via WF-51 (consult channel if consultChannelId present, else admin-cmds)
→ halt
Called from the onError branch of EVERY Gemini node (WF-21, WF-23, U3).
```

### U2 · Silent-Drop & Escalate  (proposed WF-61)
```
IN: { phoneNumber, messageType, reason, messageContent?, blockThreshold, blockReason }
    -- reason     = granular drop reason logged on silent_drop (non_text|garbage|stop_intent|...)
    -- blockReason = exact value to store in users.blocked_reason IF blocked, composed by the CALLER
    --              (e.g. 'threshold_non_text', 'threshold_garbage', 'abuse'). U2 stores it verbatim.
1. INSERT chinmay_astro.silent_drop (phone_number, message_type, reason, message_content, created_at)
2. SELECT count(*) WHERE phone_number = ? AND created_at >= now() - interval '30 days'
3. count >= blockThreshold ?
     ├─ yes → upsert users SET status='blocked', blocked_reason=blockReason, blocked_at=NOW(),
     │        blocked_by='WF-61' (stub row if none)
     │        + admin alert via WF-51 ("auto-blocked: N flagged msgs in 30d, last <type>/<reason>")
     │        → return { blocked: true }
     └─ no  → return { blocked: false }
Callers read {blocked} to suppress any reply once blocked.
(Abuse path: caller passes blockThreshold=1, blockReason='abuse' → blocks on first occurrence.)
```

### U3 · New-Contact Intent Classifier  (proposed WF-62)
```
IN:  { phone, text, stage: new | pre_form }
OUT: { bucket, confidence }
Buckets: greeting | wants_consultation | service_related_question | HELP
         | unrelated | garbage | stop_intent | malicious | abusive | inappropriate
- low confidence → treated by caller as fail-open (unrelated branch).
- literal STOP/REBOOK never reach U3 (preempted upstream).
- Uses U1 on Gemini failure. stage tunes prompt context ("already sent the form" for pre_form).
```

### `silent_drop` table (new)
```sql
CREATE TABLE chinmay_astro.silent_drop (
  id              bigserial PRIMARY KEY,
  phone_number    text NOT NULL,
  message_type    text,        -- text|image|audio|video|document|interactive|...
  reason          text,        -- non_text|interactive|garbage|stop_intent|stop_keyword|
                               --   rebook_keyword|unrelated|greeting_loop|service_loop|
                               --   help_loop|email_deflect|...
  message_content text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON chinmay_astro.silent_drop (phone_number, created_at);
```

---

## 4. Threshold / escalation policy (single source)

| Branch | Thr | Reply before block |
|--------|----:|--------------------|
| non-text / interactive (new + pre-form) | 5 | — silent |
| garbage / stop_intent (classifier) | 5 | — silent |
| unrelated / low-confidence (fail-open) | 5 | gentle redirect + form |
| greeting / wants / service / HELP (legit-but-repeating) | 10 | welcome / answer / re-send form |
| existing-user non-text (WF-02) | 10 | "email us" |
| literal STOP / REBOOK — pre-form (WF-23) | 5 | clarifier (per-keyword) |
| literal STOP / REBOOK — brand-new (WF-21) | 5 | — silent |
| malicious / abusive / inappropriate | instant | — + admin alert |

> Count is **per-phone, shared across reasons** over 30 days; a phone mixing junk (thr 5) and
> greetings (thr 10) trips whichever threshold its *current* message belongs to (lower bar wins for
> mixed behavior). Accepted bias.

---

## 5. WF-01 (TO-BE) — identity & security gate only
```
1. Country Filter ──(non-+91)──▶ Silent Reject (Country)
2. Status Lookup → { user_status, has_user, has_pending }   (single combined query)
3. Blocked? ──yes──▶ Silent Drop                              [no log — already blocked; `status='blocked'`]
4. opted_out? ──yes──▶ WF-26
5. brand-new (no record)? ──yes──▶ WF-21
6. else (has_user OR has_pending) ──▶ WF-02
```
**Deltas vs live:** non-text Layer-2 filter removed (moves to WF-02/WF-21/WF-23); block lookup universal &
above segregation (unified `blocked` gate — amended 2026-05-29); `anomaly_keyword` (STOP/REBOOK) deleted;
`anomaly_interactive` removed (→ WF-21/23 step 1); no messageType branching at all.

---

## 6. WF-02 (TO-BE) — messageType + state router (anyone with a record)

Live nodes (verified 2026-05-29): `Validate Inputs` → `Detect Route` → `Is Text Message?` →
(text → `Call WF-20 (Keyword Handler)` → `Keyword Passthrough?` → `Restore Route Data` → `Route Switch`;
non-text → `Route Switch`) → `Route Switch` fans out to WF-21/22/23/30/31/32/40/43 or
`Build UNHANDLED Alert` → `Call WF-51`.

```
Validate Inputs (entry guard — KEEP)
   ▼
Detect Route
   ├─ nfm_reply (form submission) ─────▶ WF-22                       [keep, happy path]
   ├─ has_pending (non-form) ──────────▶ WF-23   (must SKIP WF-20 — see ⚠️)
   └─ has_user:
        ├─ non-text ──▶ ⟦U2 thr=10⟧ → if !blocked: "email us" (WF-50)   [NEW branch]
        ├─ text ──▶ WF-20 Keyword Handler → Keyword Passthrough? ──▶ Route Switch → state handler
        └─ button_reply ──▶ WF-32 / WF-43 (existing)
   └─ unmatched ──▶ Build UNHANDLED Alert → WF-51                     [keep]

REMOVED: Call WF-21 branch (brand-new now bypasses WF-02 entirely via WF-01).
NEW: existing-user non-text reaches WF-02 (WF-01 stopped dropping it) → deflect+escalate.
```

> ⚠️ **Critical:** pre-form (`has_pending`) text must **skip the WF-20 keyword handler** → straight to
> WF-23. If WF-20 ran for a pre-form user who typed STOP, it would route to WF-47 (real unsubscribe);
> we decided pre-form STOP = *clarifier in WF-23*, not unsubscribe. Today WF-20 runs for ALL text in
> WF-02; in TO-BE it is gated to `has_user` only.

> ⚠️ WF-02 now receives **non-text** payloads for the first time (WF-01 used to drop them at Layer 2).
> Verify existing nodes don't choke on a non-text payload during implementation.

---

## 7. WF-21 (TO-BE) — brand-new owner  (no record at all)
```
step 1: messageType ≠ text? ──▶ ⟦U2 thr=5⟧                     [merged interactive + non-text]
step 2: literal STOP / UNSUBSCRIBE / OPT OUT / OPT-OUT ──▶ silent drop + ⟦U2 thr=5⟧   [NO reply — brand-new asymmetry; aliases per safety-net #6]
        literal REBOOK ──▶ silent drop + ⟦U2 thr=5⟧            [NO reply]
step 3: text → ⟦U3 classify, stage=new⟧:
   greeting | wants_consultation ───▶ Insert pending_users + Welcome + Form        + ⟦U2 thr=10⟧
   service_related_question ─────────▶ Gemini answer + Insert pending_users + Welcome + Form + ⟦U2 thr=10⟧
   HELP ─────────────────────────────▶ Insert pending_users + Welcome + Form       + ⟦U2 thr=10⟧
   unrelated | low-confidence ───────▶ Gentle redirect + Insert pending_users + Form + ⟦U2 thr=5⟧
   garbage | stop_intent ────────────▶ ⟦U2 thr=5⟧                                  [silent]
   malicious | abusive | inappropriate ──▶ Insert users(blocked, blocked_reason='abuse') + admin alert + NO reply
   ⚠️ any Gemini failure → ⟦U1⟧
```
*All form-sending branches Insert pending_users → next message routes to WF-23, never loops back here.*

---

## 8. WF-23 (TO-BE) — pre-form owner  (has pending_users, no users row)
```
step 1: messageType ≠ text? ──▶ ⟦U2 thr=5⟧                     [merged; non-text reason nudges form too]
step 2: literal STOP / UNSUBSCRIBE / OPT OUT / OPT-OUT ──▶ clarifier ("nothing to opt out of — complete the form to start") + ⟦U2 thr=5⟧   [aliases per safety-net #6]
        literal REBOOK ──▶ clarifier ("no prior booking to rebook — complete the form to start") + ⟦U2 thr=5⟧
step 3: text → ⟦U3 classify, stage=pre_form⟧:
   greeting | wants_consultation ───▶ Re-send Form                  + ⟦U2 thr=10⟧
   service_related_question ─────────▶ Gemini answer + Re-send Form + ⟦U2 thr=10⟧
   HELP ─────────────────────────────▶ help text + Re-send Form     + ⟦U2 thr=10⟧
   unrelated | low-confidence ───────▶ Gentle redirect + Re-send Form + ⟦U2 thr=5⟧
   garbage | stop_intent ────────────▶ ⟦U2 thr=5⟧                   [silent]
   malicious | abusive | inappropriate ──▶ Insert users(blocked, blocked_reason='abuse') + admin alert + NO reply
   ⚠️ any Gemini failure → ⟦U1⟧
```
*No pending_users insert here — row already exists; re-send form rather than welcome. Current WF-23
internals (Gemini-failure halt-and-notify chain) are absorbed into U1.*

---

## 8a. Implementation guidance (for build-workflow)

> **PSEUDO-FIRST (do this before any n8n edit).** These are functional-flow changes, so build-sprint
> must **re-write the `.pseudo` design specs FIRST** for WF-01, WF-02, WF-21, WF-23 (and author new
> `.pseudo` for U1/U2/U3), get them right against this design, then implement the n8n workflows to match.
> Pseudo is the source of truth; code reflects pseudo (per the pseudocode-first-refactor practice). Run
> the pseudo↔md drift-check after, and regenerate the AS-IS `.md` once live.

WF-01, WF-21, WF-23 are **redesigns**, not incremental edits. Per user direction (2026-05-29):

- **Build these three from scratch** rather than partial-editing the live workflow — partial editing
  would cause excessive move/reconnect/rewire churn and risk silent connection errors.
- **BUT do not hand-author nodes that already exist and are staying.** The approach is:
  1. Pull the live workflow JSON.
  2. Carry over **AS-IS** all workflow-level properties (settings, etc.) and every **existing node
     that survives** the redesign (copy the node objects verbatim — parameters, typeVersion, creds).
  3. Generate fresh node code **only** for genuinely new nodes.
  4. Re-wire connections to match the TO-BE flow.
- WF-02 is a **structural edit** (remove one branch, add one branch, re-gate WF-20), not a full rebuild
  — partial edit is fine there.

### Data-flow sanity check (mandatory — utilities have strict contracts)

WF-01/02/21/23 now call U1/U2/U3, each with a **strict input envelope** + validator entry guard.
Before declaring any of these workflows done, verify end-to-end that:
- Each call site sends the **exact contracted envelope** (`defineBelow` + `{}`; correct field names/types).
- The data each caller *has at that point in its flow* actually populates every required envelope field
  (e.g. WF-21 must have `phone`, `messageType`, `reason`, `content`, `blockThreshold` in scope when it
  calls U2; the classifier call must have `text` + `stage`).
- The validator entry guard in each utility passes for every call site (no missing/renamed fields).
- Return values (`U2.blocked`, `U3.bucket/confidence`) are read from the correct envelope path downstream.
This is a dedicated review pass, not an afterthought — utility contract drift is a known failure mode
in this project (see data-contract discipline memory).

## 9. Open / parked items
- **`silent_drop` retention/pruning** — table grows unbounded; **post-MVP** list.
- **Reply localization** (Hindi/Hinglish) — deferred; English-only replies for now.
- **WF-02 live-route reconciliation** — re-read WF-02 before implementing its changes.
- **U1/U2/U3 envelope shapes** — pull exact contracts from 2026-05-24 data-contract design at spec time.
- **Workflow numbers for U1/U2/U3** — proposed WF-53/WF-61/WF-62 (clash-free 2026-05-29); confirm/assign
  via workflow-registry at build. Do NOT reuse retired WF-24/27/28.

---

## 9a. Sibling concern — message debouncing/buffering (DECIDED: separate, fast-follow pre-go-live)

**Decision (2026-05-29):** NOT part of BMX-06. Dedicated mini-brainstorm + build as a fast-follow,
ideally just before go-live. Captured here so the interaction is not lost.

**Problem:** Users send bursts ("Hi" / "how are you" / "I heard about you" / "can you help?") in seconds.
Processing each independently → multiple welcome+forms, inflated silent_drop counts, robotic UX, wasted
Gemini calls.

**Standard pattern (debounce/last-write-wins):**
1. Per-phone buffer + `last_ts`; each message stamped `myTs`.
2. Wait a debounce window (5–10s; n8n community ref uses 10s).
3. After wait, if `last_ts > myTs` → self-cancel (a newer message arrived). Only the last execution survives.
4. Survivor processes the concatenated buffer as ONE input → one reply → clear buffer.

**Our-stack adaptation:** no Redis in our compose → use a Postgres `message_buffer` table + n8n Wait node.
Place at the **WF-00 → WF-01 boundary** (before routing/classification). Cross-cutting: also benefits
active-consultation relay (WF-40: 5 pings → 1 combined message to Chinmay). Tradeoff: +5–10s latency on
every reply.

**Why it's safe to defer from BMX-06:** the thr-10 legit branches already prevent a genuine multi-message
greeter from being *blocked*; without debounce the only harm is redundant welcome+forms (UX, not safety).

Sources:
- n8n Community — WhatsApp Debounce Flow (Redis): https://community.n8n.io/t/whatsapp-debounce-flow-combine-multiple-rapid-messages-into-one-ai-response-using-redis-n8n/225494
- BuilderBot — Multiple messages: https://www.builderbot.app/en/showcases/multiple-messages

## 10. Pre-finalize checklist
- [x] Confirm WF-02 flow — done (live-grounded §6).
- [x] Impact analysis — **not needed** (user, 2026-05-29): WF-00→WF-01 (rewritten, downstreams known);
      WF-02 only loses new-user handling + re-gates pre-form, no other downstream change; WF-21/WF-23 are
      called solely by WF-01/WF-02; U1/U2/U3 are new and called only by the workflows designed here.
      Workflow-number clash check done (§3).
- [x] Copy + U3 prompt — **drafted in §11** (pending verbatim verify at build).
- [ ] Verbatim copy/prompt sign-off with user (at build-sprint, per §11 banner).

## 11. Content layer — DRAFT (claude-generated 2026-05-29)

> 🔴 **VERIFY VERBATIM WITH THE USER BEFORE IMPLEMENTING.** build-sprint MUST re-read all copy and the
> U3 prompt below back to the user and get explicit sign-off before writing them into n8n. These are
> claude-drafted from session context — tone, wording, fee, policy URL, and Dr. Chinmay's name must be
> confirmed against current live copy (esp. reuse the EXACT welcome/policy-URL/fee text already in live
> WF-21, rather than the placeholder below).

### 11.1 Message copy

**Brand-new (WF-21):**
- `greeting | wants_consultation | HELP` → Welcome + Form:
  *"🙏 Welcome to Chinmay Astro! We offer personal Vedic astrology consultations with Dr. Chinmay over
  WhatsApp (₹500 per consultation). By continuing you agree to our terms & privacy policy: <POLICY_URL>.
  Tap **Fill Details** below to share your birth details and get started."* + Flow form CTA
  *(reuse exact live WF-21 welcome text + policy URL + fee at build).*
- `service_related_question` → *"<Gemini 1–2 line answer to their question>"* + blank line + the welcome+form above.
- `unrelated | low-confidence` → *"🙏 Thanks for reaching out! Chinmay Astro offers Vedic astrology
  consultations with Dr. Chinmay over WhatsApp. If you'd like a consultation, tap **Fill Details** below
  to get started."* + Flow form CTA
- `garbage | stop_intent | literal STOP | literal REBOOK` → no message (silent).
- `malicious | abusive | inappropriate` → no message (silent) + admin alert (11.2).

**Pre-form (WF-23):**
- non-text (step 1) → *"We can only read text messages here. To share a file, email it to
  chinmay_astro@gmail.com with your name and phone number. To get started, please complete the form we
  sent — tap **Fill Details**."*
- literal STOP → *"You haven't subscribed to anything yet, so there's nothing to opt out of. Whenever
  you're ready, tap **Fill Details** on the form we sent to book a consultation with Dr. Chinmay."*
- literal REBOOK → *"You don't have a previous consultation to rebook yet. To book your first session
  with Dr. Chinmay, please complete the form we sent — tap **Fill Details**."*
- `greeting | wants_consultation` → *"🙏 Great — to get started with your Vedic astrology consultation,
  please complete the form we sent. Tap **Fill Details** below."* + Flow form CTA
- `service_related_question` → *"<Gemini answer>"* + *"To book your consultation, please complete the form
  below — tap **Fill Details**."* + Flow form CTA
- `HELP` → *"Here's how to get started: tap **Fill Details** on the form below and share your birth
  details — Dr. Chinmay will take it from there. 🙏"* + Flow form CTA
- `unrelated | low-confidence` → *"Chinmay Astro offers Vedic astrology consultations with Dr. Chinmay.
  To begin, please complete the form below — tap **Fill Details**."* + Flow form CTA
- `garbage | stop_intent` → no message (silent).

**Existing user (WF-02) non-text** → KEEP current live copy verbatim:
  *"This service supports text messages only. If you'd like to share a document, image, voice note or any
  other file, please email it to chinmay_astro@gmail.com along with your phone number and name. We'll get
  back to you as soon as possible."*

**Admin alerts (WF-51 — business language, no internal jargon / WF-XX):**
- Instant abuse block → *"⚠️ Blocked +<phone>. They sent an abusive or inappropriate message: "<content>".
  No reply was sent."*
- Auto-block at threshold → *"⚠️ Auto-blocked +<phone> after <N> dropped messages in 30 days
  (junk / non-text / opt-out). Last message: "<content>"."*

### 11.2 U3 classifier prompt (new + pre_form, single prompt with `stage` variable)

```
You are an intent classifier for Chinmay Astro, a Vedic astrology consultation service on WhatsApp.
Classify the user's message into EXACTLY ONE bucket. Output ONLY strict JSON:
{"bucket": "<bucket>", "confidence": <number 0.0-1.0>}.

Stage = {{stage}}:
- "new": never contacted us before; no record.
- "pre_form": we already sent this person the onboarding form; they have not completed it yet.

Buckets:
- greeting: hello/greeting or polite small talk ("hi", "namaste", "how are you").
- wants_consultation: wants a reading/consultation or interest in booking ("can you help me",
  "I want my kundli read", "I heard about your service from a friend").
- service_related_question: a genuine question ABOUT the service, astrology, fees, process, or
  Dr. Chinmay ("what is Vedic astrology?", "how much does it cost?", "how does this work?").
- HELP: asking what to do / how to proceed ("help", "what do I do", "how do I start").
- unrelated: a coherent human message NOT about our service and NOT abusive ("are you hiring?",
  "wrong number", an unrelated topic).
- garbage: gibberish, random characters, tests, meaningless content ("asdfgh", "1234", ".").
- stop_intent: wants to stop/opt out/unsubscribe in natural language ("leave me alone",
  "don't message me", "remove me").
- malicious: threats, scams, manipulation/jailbreak attempts, or harmful intent.
- abusive: insults, harassment, hostile or aggressive language.
- inappropriate: sexual, obscene, or otherwise inappropriate content.

Rules:
- Pick the SINGLE best bucket. If a message both greets and asks ("hi, what is astrology?"), prefer the
  higher-value intent (service_related_question or wants_consultation over greeting).
- The literal words "STOP" and "REBOOK" are handled upstream and will not reach you — do not special-case.
- If genuinely unsure or ambiguous, set LOW confidence (< 0.5); the caller treats low confidence as the
  fail-open (unrelated) path.
- Messages may be English, Hindi, Marathi, or Hinglish — classify by meaning regardless of language.
- Output ONLY the JSON. No prose, no markdown.

User message:
"""{{text}}"""
```
- Caller fail-open threshold: `confidence < 0.5` → treat as `unrelated` branch (tune at build).

## 12. BMX-05 context (✅ DESIGNED 2026-05-29 — see existing-user safety-net spec decision #6)

> The remaining existing-user alias work below was designed in
> `docs/artefacts/specs/2026-05-29-existing-user-safety-net-design.md` (decision #6): add `UNSUBSCRIBE` /
> `OPT OUT` / `OPT-OUT` to WF-20's exact-match keyword switch (→ WF-47), exact-match-after-`uppercase(trim())`,
> `OPTOUT` (no separator) excluded. New/pre-form aliases are handled via the WF-21/WF-23 step-2 preempts (see
> the AMENDED banner at the top of this file). The historical context below is retained for the audit trail.

**Scope remaining:** UNSUBSCRIBE / OPT OUT / OPT-OUT as STOP aliases, for **fully-onboarded (has_user)**
users. (New + pre-form fuzzy opt-out is already covered here: brand-new `stop_intent` → silent+escalate;
pre-form `stop_intent` → silent+escalate, literal STOP → clarifier.)

**Likely shape:** add the three aliases to the WF-20 `Match Keyword` switch (existing-user path) so they
route to WF-47 like literal STOP. The original BMX-05 tasks.md also proposed a WF-01 gate change, but in
THIS redesign WF-01 no longer does keyword anomaly routing — so re-evaluate that half against the new
WF-01/WF-02 split before implementing. Decide alias matching (exact-match list vs normalize) at design.

Ref: `docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/tasks.md` → TD-BMX-05.
