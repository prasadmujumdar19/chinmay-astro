# Existing-User Safety-Net Redesign (companion to BMX-06)

> **⚠️ DESIGN AMENDMENT (2026-05-29, applied during BMX-P0-U2 build):** Block audit unifies on the
> **EXISTING legacy `users` columns** `blocked_reason` / `blocked_at` / `blocked_by` — NOT a new
> `block_reason` column (that column, briefly added the same day, was dropped:
> `scripts/migrations/2026-05-29-bmx06-drop-block-reason-use-legacy.sql`). Conventions: `blocked_reason`
> is **caller-supplied verbatim** via a `blockReason` envelope field (U2 does no string composition —
> callers pass `threshold_non_text` / `threshold_garbage` / `abuse` / …); `blocked_at=NOW()`;
> `blocked_by` = provenance (`'admin'` for manual, the workflow id e.g. `'WF-61'` for system blocks).
> All `block_reason` references below have been updated to `blocked_reason` accordingly.
>
> **STATUS (2026-05-29):** Structure design **COMPLETE** — pending user review of this spec, then
> writing-plans. All decisions (D1–D5 + aliases + admin-notify model + REBOOK/WF-45 interaction + WF-26
> welcome-drop + WF-02 nfm_reply guard) are **locked** (see §2). Copy is **reuse-existing** (verify
> verbatim at build, §9). Full rollback backup taken (§8.1).
>
> **Companion to** `docs/artefacts/specs/2026-05-29-bmx-06-new-contact-flow-design.md`. BMX-06 designed the
> safety net for **new + pre-form** users (WF-01/02/21/23 + U1/U2/U3 + `silent_drop` table). THIS spec
> extends the **same principles** to **existing (has_user) users** and folds in **BMX-05** (opt-out
> aliases). It **reuses BMX-06's utilities U1/U2 unchanged** and **does not** reuse/extend U3.

- **Session:** 2026-05-29
- **Sprint:** behavior-matrix-fixes-2026-05-27 (folds in TD-BMX-05; coupled with BMX-06)
- **AS-IS verified against live n8n** (tunnel open) 2026-05-29: WF-20 (LgIDj1v4ZbCPlX25), WF-25
  (eTV1lUcYrXBg2q2T, updatedAt 2026-05-27T04:07:31Z), WF-30 (gGJBY5fJha0Let8I), WF-31 (HB8nXudAtk9iXz7C),
  WF-40 (du32QBZbSQOjfESe), WF-43 (3va0M06kijgyLejf), WF-47 (2U7mxHMyqA41ROKX), WF-45 (MUG7rPgSHc7UtAE9).

---

## 1. Problem & scope

BMX-06 built a safety net — *classify → log to `silent_drop` → 30-day rolling threshold → block; abuse =
instant block; Gemini failure → U1* — but only for **new + pre-form** users. Existing users have a
*different, older* safety posture (WF-25 warns/blocks but never logs or counts; two block states collide;
inline Gemini-error chains; an inconsistent stop_intent), and the opt-out trigger only recognizes the
literal word `STOP`. This redesign applies the BMX-06 **trigger principles consistently** to existing
users — *actions vary by stage, triggers do not* — and adds the BMX-05 opt-out aliases everywhere.

**In scope:** WF-20, WF-25 (the hub), WF-30, WF-31, WF-40, WF-43, **WF-44** (strip redundant WF-25 call),
**WF-26** (drop welcome-back), **WF-02** (new nfm_reply stage guard); the WF-45/REBOOK interaction note;
the opt-out trigger (two-tier); plus **amendments to BMX-06** (block-state unify, aliases in WF-21/WF-23).
**Architecture (locked):** centralize the safety net in **WF-25** (it already receives `userStatus`, so it
varies leniency per stage); state handlers keep only their stage-specific functional logic.
**Out of scope (parked):** none remaining.

---

## 2. Decisions locked (with rationale)

1. **D1 — One block state: `status='blocked'` everywhere.** Drop BMX-06's separate `blacklisted`.
   WF-46, the admin BLOCK command, and DR-4 all already use `blocked`; `blacklisted` was a BMX-06 coinage.
   Two terminal states for one concept is needless. Use the EXISTING legacy **`blocked_reason`** column
   on `users` (values e.g. `admin` / `abuse` / `threshold_garbage` / `threshold_non_text`) — together with
   the existing `blocked_at` (when) and `blocked_by` (which actor/workflow) — for audit instead of a second
   status. *(Amended 2026-05-29: reuse the legacy block-audit trio `blocked_reason`/`blocked_at`/`blocked_by`;
   NO new `blocked_reason` column — see the top-of-doc DESIGN AMENDMENT.)* **→ Amends BMX-06 decision #1** (its "insert users row `status=blacklisted`" becomes
   `status=blocked`; WF-01's "Blacklisted?" gate becomes the unified `blocked?` gate).
2. **D2 — Existing-user garbage = gentle warning + counted, admin alert only on block.** They have a
   paying relationship, so unlike new-user silence they get a helpful nudge — but the message is logged to
   `silent_drop` and counts toward the 30-day threshold, honoring "garbage is never acceptable at any
   stage." **The per-message admin notify is removed** (today's WF-25 `Notify Admin of Garbage`); admin is
   alerted **only when U2 actually blocks** (threshold breach).
3. **D3 — Existing-user abuse = instant silent block + admin alert.** `malicious_abusive` /
   `inappropriate` → U2 with instant threshold → `status=blocked` + admin alert (alert embeds the message
   content) + **no user reply**. Drop today's block-warning reply (don't engage abusers; matches BMX-06).
4. **D4 — `consultation_active` garbage = relay to Chinmay (no user warning) + still counted.** The most
   lenient stage: mid-consultation a short/ambiguous message misclassified as garbage must reach the human,
   not be hidden behind an automated warning. It is still logged + counted, so a flooder eventually blocks.
5. **D5 — `stop_intent` clarifier consolidated into WF-25, applied uniformly.** WF-25 sends the clarifier
   itself, then returns `intentResult=stop_intent` so the **caller still performs its stage-specific
   functional action** (e.g. WF-40 relays the original message to admin). **→ Changes live WF-43**, which
   today auto-routes `stop_intent` → WF-47; it now sends the clarifier like every other stage. Removes the
   live inconsistency and the false-positive risk (SP-04).
6. **NEW — Opt-out aliases everywhere.** `UNSUBSCRIBE` / `OPT OUT` / `OPT-OUT` join `STOP` as literal,
   exact-match (after `uppercase(trim())`) opt-out triggers. Treatment is **per-stage, identical to STOP**:
   - existing (has_user): WF-20 → WF-47 (immediate opt-out). *(this is BMX-05)*
   - brand-new: WF-21 step-2 literal preempt → silent drop + escalate. **→ Amends BMX-06 WF-21.**
   - pre-form: WF-23 step-2 literal preempt → clarifier. **→ Amends BMX-06 WF-23.**
   Exact-match-after-normalize only — "opt out please" / "I want to stop waiting" do NOT match (those are
   fuzzy `stop_intent`, handled by the classifier). `OPTOUT` (no separator) is **not** included.
7. **Admin sees: relay (always, caller's job) + block alert (only on block).** Relay = the caller
   forwarding the user's actual words to Chinmay's Slack (WF-40 always; WF-31 Branch B). Safety-net admin
   alert = "⚠️ blocked this user", from U2, only when a block happens. No double-notify.
8. **Two classifiers stay separate.** WF-25 = existing-user classifier (this spec); U3 = new/pre-form
   classifier (BMX-06). Smaller blast radius; different taxonomies; consistent with BMX-06 decision #10.
9. **WF-26 — drop the welcome-back; inherit the safety net via re-route.** WF-26 already re-routes the
   re-engagement message through WF-02 → WF-43 → WF-25, so the safety net runs on it once. Removing the
   welcome-back means an abusive/garbage re-engagement is handled (blocked/warned) **without** first being
   welcomed. A legitimate message is answered warmly by WF-43's contextual reply. Rejected the
   "WF-26 calls WF-25 first" variant — it double-classifies (WF-26 + WF-43) and duplicates handler routing.
10. **WF-02 nfm_reply stage guard (NEW).** Form submission is valid ONLY pre-form (DR-1: form callback is
    the first write to `users`). Guard routes a non-pre-form `nfm_reply` to UNHANDLED (admin alert).
    Makes explicit the stage-validation that today relies implicitly on Meta's form-lock (U4 finding).
    `button_reply` is already stage-guarded in `Detect Route`.
11. **WF-44 — strip redundant WF-25 call (classify once).** WF-44's only caller is WF-43, which calls it
    only *after* WF-25 has already classified the message as `feedback_intent` and already routed
    rebook/stop elsewhere. So WF-44's own WF-25 call (re-classify + rebook/stop re-route) is dead
    redundancy — and post-redesign it would double-count the safety-net threshold. WF-44 becomes a **pure
    recorder**: Save Feedback + acknowledgement. Same "classify once" principle as decision #9.

### REBOOK-by-stage — owned by TD-BMX-01, with a BMX-06 interaction note

REBOOK handling is **not** part of this redesign — it is **TD-BMX-01** (locked 2026-05-27T11:30Z), which
adds a 4-branch state guard to WF-45 (`payment_submitted` → "still under review, please wait";
`consultation_active` → "ask Chinmay to close first"; pre-form → "let's get you set up"; default → happy
rebook). **Interaction flagged:** because BMX-06 moves pre-form/new users upstream (WF-20 no longer runs
for them; literal REBOOK is preempted in WF-21/WF-23), **WF-45's pre-form/no-record branch is now
unreachable** — it becomes defensive-only (self-healing), not a live path. TD-BMX-01 was locked before
BMX-06; note this when building it.

---

## 3. Who-gets-what (single source for actions per bucket)

| Bucket | User gets | Caller relays msg to admin? | Safety-net admin alert? |
|--------|-----------|-----------------------------|-------------------------|
| pass-through (wants/general/rebook/feedback) | stage reply (reminder / Gemini / relayed) | per stage (active; submitted Branch B) | — |
| `stop_intent` | **clarifier** (sent by WF-25) | per stage (WF-40 relay; WF-31 Branch B) | — |
| garbage — payment_pending / payment_submitted / consultation_closed | **gentle warning** | per stage | only if U2 trips block |
| garbage — **consultation_active** | nothing (lenient — D4) | **yes (relayed)** | only if U2 trips block |
| `malicious_abusive` / `inappropriate` | nothing (silent — D3) | — (content embedded in block alert) | **yes — block alert** |

---

## 4. Thresholds (existing-user, per-phone, 30-day rolling, shared across reasons)

| Reason | Threshold | Notes |
|--------|----------:|-------|
| garbage — all existing stages | 10 | tunable; shared 30-day count per BMX-06 §4 (lower bar wins for mixed behavior) |
| non-text — existing (WF-02) | 10 | already designed in BMX-06 §6 |
| abuse (malicious/inappropriate) | instant (=1) | unconditional block on first occurrence, any stage |

`blocked_reason` written by U2 at block time: `threshold_garbage` / `threshold_non_text` / `abuse` (plus `blocked_at=NOW()`, `blocked_by='WF-61'`)
(admin BLOCK command writes `admin`).

---

## 5. WF-25 (TO-BE) — Intent Classifier + Safety-Net Hub  [the central change]

**Inputs:** `{ phoneNumber, userId, messageContent, userStatus, userName, slackChannelId }`.
**Callers (post-BMX-06):** WF-30, WF-31, WF-40, WF-43 — existing-user only (WF-23 now uses U3). So
`userStatus ∈ {payment_pending, payment_submitted, consultation_active, consultation_closed}`.
**Outputs:** see per-branch returns below.

```
Step 1: Start — triggered with { phoneNumber, userId, messageContent, userStatus, userName, slackChannelId }.
Step 2: Build Gemini classification request (8 buckets, temp=0, maxOutputTokens=20).   [prompt unchanged]
Step 3: POST to Gemini gemini-2.5-flash-lite (retryOnFail 3×, onError=continueErrorOutput).
   - On error output (retries exhausted) ─▶ ⟦U1 · Gemini Error Handler⟧
        { phone: phoneNumber, consultChannelId: slackChannelId, context: "WF-25 classify" }
        U1 sends user apology + admin alert + halts; caller terminates via error propagation. END.
   - On success ─▶ Step 4.
Step 4: Parse candidates[0].content.parts[0].text → lowercased; if one of the 8 valid buckets, use it;
        else status-aware fallback (consultation_closed → feedback_intent; else general_enquiry).
Step 5: Route on intentResult:
   - pass-through { wants_consultation, general_enquiry, rebook_intent, feedback_intent } ─▶ Step 11
   - stop_intent ─▶ Step 6
   - garbage ─▶ Step 8
   - malicious_abusive | inappropriate ─▶ Step 10
Step 6: (stop_intent) Build WF-50 clarifier payload (per §2.3 contract):
        { phoneNumber, messageType:'text', messageContent: <stop clarifier copy — §9> }.
Step 7: Call WF-50 (clarifier). ─▶ Step 11   (return so caller does its stage-specific extra, e.g. relay).
Step 8: (garbage) Call ⟦U2 · Silent-Drop & Escalate⟧:
        { phone: phoneNumber, messageType:'text', reason:'garbage', content: messageContent,
          blockThreshold: 10 }.   Receive { blocked }.
Step 9: Branch on garbage outcome:
   - blocked == true ─▶ END (silent — U2 already sent the block alert).            [no return]
   - blocked == false AND userStatus == 'consultation_active' ─▶ Step 11           [D4 — return, caller relays, no warning]
   - else ─▶ Build + send gentle garbage warning via WF-50 (per §2.3). END.        [no admin notify]
Step 10: (abuse) Call ⟦U2 · Silent-Drop & Escalate⟧:
        { phoneNumber, messageType:'text', reason:'abuse', messageContent,
          blockThreshold: 1, blockReason: 'abuse' }.   U2 stores blocked_reason=blockReason verbatim
        ('abuse'), status=blocked, blocked_at=NOW(), blocked_by='WF-61' + admin alert (embeds
        message). No user reply. END.                                              [no return]
Step 11: Return to caller — original input merged with { intentResult }.
```

**Deltas vs live WF-25:**
- **Removed:** `Notify Admin of Garbage` + its WF-51 payload node (D2 — admin only on block).
- **Removed:** `Send Block Warning` user reply on abuse (D3 — silent).
- **Removed:** inline Gemini-failure chain (`Build apology` → WF-50 → dual WF-51 alerts → `stopAndError`)
  → replaced by a single ⟦U1⟧ call.
- **Removed:** `Auto-Block via WF-46` → replaced by ⟦U2⟧ (which now owns block + alert + `blocked_reason`).
  *(WF-46 retired from this path; verify no other live caller before deleting — see §8.)*
- **Added:** ⟦U2⟧ calls on garbage + abuse; ⟦U1⟧ on Gemini failure; the stop_intent clarifier send
  (consolidated from the four handlers); the `consultation_active`-garbage relay return (D4).

**Return contract (verified against callers, 2026-05-29):** WF-25 returns to the caller ONLY on Step 11
(pass-through, stop_intent, and consultation_active-garbage-not-blocked). The garbage `else` branch
(Step 9, payment_pending / payment_submitted / consultation_closed) and the abuse branch (Step 10) and the
garbage-blocked branch **terminate inside WF-25 with NO return — confirmed safe**: WF-30 and WF-43 take no
action on a garbage message beyond WF-25's warning (no relay), and WF-31's relay is its *parallel Branch B*
(independent of WF-25's return), so none of these three stages needs control back. Only WF-40
(consultation_active) requires the message returned, which the D4 branch provides.

> ⛔ **CORRECTION (2026-05-31, BUG-06c — supersedes the paragraph above):** "terminate inside WF-25 with
> NO return — confirmed safe" was **WRONG**. In n8n a sub-workflow ALWAYS hands its terminal node's output
> back to the caller, which then resumes — a dead-ending branch does NOT stop the caller. So garbage/abuse
> dead-ending at `Call WF-50 (Garbage Warning)` / `End — Garbage Blocked` / `Call U2 (Abuse)` each returned
> 1 item, and **every** user-replying caller sent a SECOND message (WF-30 payment reminder, WF-31 under-review,
> WF-43 off-topic redirect) — plus WF-43 double-counted via off_topic. Surfaced in S8 smoke (test 61466927921
> blocked at threshold partly from this double-count). **Fix = §13:** those three terminals emit **0 items**
> (`return []`) so the caller's chain (all callers `alwaysOutputData=false`) skips. The D4 active-garbage path
> still returns (WF-40 relay preserved). This is the n8n-correct realization of the design's "no return" intent.

---

## 6. State handlers (TO-BE) — now thin

**WF-30 / WF-31 — payment stages**
```
Call WF-25 →
   pass-through → general_enquiry = Gemini reply (⚠️ fail → ⟦U1⟧) | others = canned reminder / "under review"
   stop_intent → (clarifier already sent by WF-25) → no extra
   (garbage / abuse terminated inside WF-25)
Δ vs live: inline Gemini-error halt chain (~12 nodes) → single ⟦U1⟧ call;
           remove the in-handler Stop Clarifier nodes (now in WF-25).
WF-31 keeps its parallel Branch B Slack relay (unchanged — relays every inbound, incl. stop_intent/garbage).
```

**WF-40 — consultation_active** (most lenient)
```
Call WF-25 → relay to Chinmay (WF-51) whatever WF-25 RETURNS:
   - pass-through → relay original message
   - stop_intent  → relay original message (clarifier already sent by WF-25)
   - garbage (active, not blocked) → relay original message (D4)
   (abuse → terminated in WF-25, not returned → not relayed; block alert carries the content)
Δ vs live: remove `Stop Intent?` + `Build WF-50 Clarifier Payload` + `Call WF-50 (Stop Clarifier)` nodes
           (clarifier now in WF-25). WF-40 collapses to: Call WF-25 → Format Slack → Call WF-51.
WF-40 has no own Gemini call → only WF-25's U1 applies.
```

**WF-43 — consultation_closed**
```
interactive button → btn_done / btn_rebook / btn_feedback             [unchanged]
text → Call WF-25 →
   stop_intent   → (clarifier already sent by WF-25) → no extra        🔶D5: was auto-WF-47
   rebook_intent → WF-45
   feedback_intent → WF-44
   else → Gemini reply (⚠️ fail → ⟦U1⟧)
Δ vs live: stop_intent → clarifier-in-WF-25 (remove `Stop Intent?` → `Call WF-47` path);
           inline Gemini-error chain → single ⟦U1⟧ call.
```

**WF-44 — Feedback Recorder (TO-BE)** — pure recorder; sole caller is WF-43 (post-feedback_intent).
```
Step 1: Start — triggered by WF-43 (message already classified feedback_intent).   [unchanged]
Step 2: UPDATE users SET feedback=<messageContent>, stage=NULL, updated_at=NOW() WHERE id=user.id.
Step 3: Send acknowledgement via WF-50 ("🙏 Thank you for your feedback…").
        END.
```
Δ vs live: **remove** the `Call WF-25` node + the `rebook_intent?`→WF-45 and `stop_intent?`→WF-47
re-route branches (live Steps 2–6). WF-43 already classified + routed rebook/stop before calling WF-44, so
this is dead redundancy; removing it also avoids double safety-net counting. No new Gemini call in WF-44.

**WF-20 — Keyword Handler**
```
Step 1-2: keyword = uppercase(trim(messageContent))                          [unchanged]
Step 3: keyword ∈ { STOP, UNSUBSCRIBE, OPT OUT, OPT-OUT } ─▶ WF-47           [+3 aliases — BMX-05]
        keyword == HELP   ─▶ status-aware help                               [unchanged]
        keyword == REBOOK ─▶ WF-45                                           [unchanged; guard = TD-BMX-01]
        else ─▶ passthrough ─▶ WF-02 routes to state handler                 [unchanged]
```

**WF-02 — Router** (existing-user portion; from BMX-06 §6, + new nfm_reply guard)
```
nfm_reply (form submit) ─▶ if (user===null && pendingUser!==null) WF-22 else UNHANDLED   🔶NEW guard
has_pending (any other) ─▶ WF-23                                  (skips WF-20 per BMX-06 §6 ⚠️)
has_user:
   ├─ non-text ─▶ ⟦U2 thr=10, reason=non_text⟧ → if !blocked: "email us" deflection (WF-50)
   ├─ text ─▶ WF-20 → if passthrough → handler by status (WF-30/31/40/43)
   └─ button_reply ─▶ WF-32 (payment_pending) / WF-43 (consultation_closed) / else UNHANDLED  [already guarded]
```
**nfm_reply guard (NEW — `Detect Route` Code node):** form submission is the first write to `users`
(Design Rule #1), so it is valid ONLY pre-form. The guard routes a non-pre-form `nfm_reply` to UNHANDLED
(admin alert) instead of letting it fall through into POST_CONSULT_TEXT:
```js
// WhatsApp Flow form submission — valid ONLY pre-form (first write to users per DR-1)
if (messageType === 'interactive' && interactiveType === 'nfm_reply') {
  route = (user === null && pendingUser !== null) ? 'DETAILS_FORM' : 'UNHANDLED';
}
```
Safe today via Meta's form-lock (U4 finding — a submitted Flow form locks to "View Responses"); this guard
makes the stage-validation explicit rather than implicit. `button_reply` is already stage-guarded (only
payment_pending → WF-32, consultation_closed → WF-43; else UNHANDLED).

**WF-47 — Unsubscribe** — unchanged (opt-out conclusion; STOP unconditional, DR-10 channel preserved).

**WF-26 — Re-Engaged Opted-Out User Handler (TO-BE)** — drop the welcome-back; inherit the safety net.
```
Step 1: Validate inputs (entry guard — unchanged).
Step 2: UPDATE users SET status='consultation_closed' WHERE id=user.id  (unchanged).
Step 3: Refresh in-flight envelope user.status → 'consultation_closed' (Set v3.4 includeOtherFields).
Step 4: Re-route to WF-02 with the refreshed envelope.  ← single classification downstream (WF-43→WF-25)
        END.
```
Δ vs live: **remove** `Build Welcome Payload` + `Call WF-50 Welcome Back` nodes (the welcome-back branch).
Rationale: the re-route lands the message in WF-43 → WF-25 — i.e. the full safety net runs on the
re-engagement message exactly once. An abusive re-engagement is **blocked without first being welcomed**;
garbage is warned + counted; a legitimate message is answered warmly by WF-43's contextual Gemini reply.
The "details on file" reassurance is not lost in practice — the rebook path never re-asks for birth details.

**button_reply / nfm_reply from a re-engaging user — verified safe:**
- `button_reply`: WF-26 refreshes status to `consultation_closed`, so WF-02 routes it to WF-43, which
  handles it gracefully (a stale "Payment Completed" tap → feedback prompt = the accepted U6 won't-fix edge).
- `nfm_reply`: **unreachable** for opted_out users — they are post-onboarding by definition (only users with
  a `users` row reach `opted_out` via WF-47; pre-form STOP is just a clarifier), so their form is already
  Meta-locked. The new WF-02 nfm_reply guard covers it regardless.

---

## 7. Amendments to the BMX-06 spec (must be applied for consistency)

These cross into `2026-05-29-bmx-06-new-contact-flow-design.md` and must be reflected there:
1. **Block-state unify (D1):** every `status=blacklisted` in BMX-06 → `status=blocked`; the WF-01
   "Blacklisted?" gate → unified `blocked?` gate; reuse the EXISTING legacy `blocked_reason`/`blocked_at`/`blocked_by`
   columns for block audit (no new column — see top-of-doc DESIGN AMENDMENT 2026-05-29).
2. **Aliases in literal preempts (decision #6):** WF-21 step 2 and WF-23 step 2 preempt
   `STOP | UNSUBSCRIBE | OPT OUT | OPT-OUT` (currently only STOP/REBOOK) — same per-stage treatment.

---

## 8. Implementation guidance (for build-sprint)

> **PSEUDO-FIRST.** Functional-flow changes → rewrite `.pseudo` for WF-20, WF-25, WF-30, WF-31, WF-40,
> WF-43 FIRST (and the BMX-06 `.pseudo` amendments for WF-01/WF-21/WF-23), get them right against this
> design, then implement to match. Run pseudo↔md drift-check after; regenerate AS-IS `.md` once live.

> **MANDATORY FULL BACKUP BEFORE ANY EDIT (rollback safety).** This is the second major redesign after the
> data-contract sprint. Before touching any workflow, export **all** live workflows to a dedicated backup
> folder `workflows/backup-behavior-matrix-review-triggered-redesign-<date>/` so rollback is a clean
> wholesale restore (replace all live workflows from the backup). *(Done 2026-05-29 — see §8.1.)*

> **REBUILD APPROACH (per BMX-06 §8a precedent — for major redesigns, don't partial-edit).** WF-25 is a
> major redesign: **author the complete TO-BE node graph from scratch** rather than incrementally moving/
> rewiring the live graph (avoids silent connection errors). Method: pull live WF-25 JSON; carry over
> verbatim all workflow-level properties + every surviving node (Gemini classify HTTP node, parse Code
> node, Route switch); generate fresh nodes only for the new U1/U2 calls + clarifier + D4 relay-return;
> rewire to the TO-BE flow. **Apply via full-workflow replace on the SAME WF-25 ID
> (`eTV1lUcYrXBg2q2T`) — do NOT mint a new workflow ID:** the 4 callers (WF-30/31/40/43) reference WF-25
> by ID, so a new ID would force a 4-caller repoint. Full-replace keeps the ID stable.
- **WF-25 is a structural rebuild** (many node removals + new U1/U2 calls + new branch logic) — carry over
  surviving nodes verbatim (the Gemini classify HTTP node, the parse Code node, the Route switch), generate
  only the new U1/U2 call nodes + the consultation_active relay-return branch, and rewire. Build fresh per
  the REBUILD APPROACH above; apply via full-replace on ID `eTV1lUcYrXBg2q2T`.
- **Handlers (WF-30/31/40/43) are structural edits** (node deletions + one U1 add) — partial edits are
  fine; no full rebuild needed.
- **WF-26 is a small structural edit** — delete `Build Welcome Payload` + `Call WF-50 Welcome Back` nodes;
  rewire `Refresh Envelope Status` → `Call WF-02 Re-Route` directly. Partial edit, no rebuild.
- **WF-02 is a single Code-node edit** — add the nfm_reply guard ternary to the `Detect Route` node
  (`PubCsNTOspF3xqXZ`). No structural change.
- **WF-44 is a small structural edit** (`Du2CJ3OTohRFZYoA`) — delete `Call WF-25` + the `rebook_intent?`/
  `stop_intent?` IFs + their WF-45/WF-47 calls; rewire trigger → Save Feedback. Verify WF-43 remains the
  sole caller at build (confirmed 2026-05-29 across all 28 workflows).
- **WF-46 retirement:** WF-25 stops calling it. **Verify no other live caller** (audit) before deleting
  WF-46; if other callers exist, leave it and only re-point WF-25.
- **Block audit columns:** NO migration — reuse the EXISTING legacy `blocked_reason` / `blocked_at` / `blocked_by`
  columns on `users` (already present). *(Amended 2026-05-29: the `block_reason` column briefly added on 2026-05-29
  was dropped; see `scripts/migrations/2026-05-29-bmx06-drop-block-reason-use-legacy.sql` and the top-of-doc DESIGN
  AMENDMENT. U2 writes `blocked_reason` = caller-supplied `blockReason` verbatim, `blocked_at=NOW()`, `blocked_by='WF-61'`.)*
- **Data-contract sanity (mandatory — utilities have strict envelopes):** every WF-25 call site to U1/U2
  must send the exact contracted envelope (`defineBelow` + `{}`; correct field names/types); U2's
  `{blocked}` return read from the correct path; U1/U2 entry guards pass for the WF-25 call site. Pull exact
  envelope shapes from the 2026-05-24 data-contract design at spec/build time (per data-contract-discipline).

### 8.2 Build sequencing (cross-spec — read before plan-sprint)

This work spans **two specs** (BMX-06 + this one) plus DB migrations and 3 new utilities with hard
dependency order. Build in these phases — **do not** let plan-sprint flatten them into priority-only order:

**Phase 0 — Foundations (leaf dependencies; nothing else can run first):**
1. DB migrations: create `silent_drop` table (BMX-06 §3) + add `blocked_reason` column to `users` (D1). U2
   writes both → they must exist before U2.
2. Build utilities **U1** (Gemini Error Handler), **U2** (Silent-Drop & Escalate), **U3** (New-Contact
   Classifier). No callers yet — safe to build/activate standalone. Verify each against its envelope contract.

**Phase 1 — Pseudo-first (per §8 + pseudocode-first practice):** rewrite `.pseudo` for every changed
workflow (WF-01, WF-02, WF-20, WF-21, WF-23, WF-25, WF-30, WF-31, WF-40, WF-43, WF-44, WF-26, WF-45) and
author new `.pseudo` for U1/U2/U3, reconciled against both specs, before any n8n edit.

**Phase 2 — BMX-06 (new + pre-form):** rebuild WF-01 (gate; applies D1 block-unify), WF-21, WF-23 (apply
alias preempts — decision #6); WF-02 structural edits + the new nfm_reply guard (decision #10). These wire
to U1/U2/U3 (Phase 0).

**Phase 3 — Existing-user safety net (this spec):** rebuild **WF-25** first (full-replace on same ID; wire
U1/U2, unified block, clarifier consolidation, D4 relay; retire WF-46 from this path) → then the thin
handler edits **WF-30/31/40/43/44** (delete inline Gemini-error → U1; remove in-handler clarifiers; WF-44
strip WF-25 call; WF-43 stop_intent→clarifier) → **WF-20** aliases. Handlers after WF-25 so they're edited
against the final hub behavior.

**Phase 4 — WF-26 + WF-45 + activation:** WF-26 refinement (drop welcome-back) **after** the WF-25 safety
net is live (WF-26 inherits it via re-route); WF-45 state guard (TD-BMX-01 — independent, note dead pre-form
branch); **activate WF-26 last** (TD-BMX-04).

**Phase 5 — Verify:** pseudo↔md drift-check; regenerate AS-IS `.md`; TD-BMX-07 matrix re-verification
(update S8×G expectation — opted_out re-engages via WF-26, not zero-outbound).

> Critical edges: migrations + U1/U2/U3 before ANY caller · WF-25 before its handlers · WF-26-refine before
> WF-26-activate · BMX-06 amendments (§7) applied within Phase 2, not deferred.

### 8.1 Rollback backup (DONE 2026-05-29)

Full pre-redesign backup of **all 28 live workflows** taken before any edit:
- **Folder:** `workflows/backup-behavior-matrix-review-triggered-redesign-2026-05-29/`
- **Contents:** one `<workflowId>.json` per live workflow + `_index.tsv` (id ⇥ name ⇥ active).
- **Captured:** 2026-05-29 (tunnel live). Secrets scan clean.
- **Rollback procedure:** to revert this redesign wholesale, PUT each backed-up JSON back to its
  workflow ID (`for f in *.json; do curl -X PUT .../workflows/$(basename $f .json) -d @$f; done`).
  Because every workflow ID is preserved through the redesign (full-replace, no new IDs), restore is a
  clean 1:1 overwrite.

---

## 9. Content layer — REUSE EXISTING (verify verbatim at build)

> 🔴 **VERIFY VERBATIM AT BUILD.** Reuse the **exact live copy** already in WF-25/handlers rather than
> re-drafting. Confirm each string back to the user before writing into n8n.
- **Stop clarifier** (now sent by WF-25): reuse the live handler copy — *"This is an automated message from
  Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please
  ignore. If you do want to opt out of this service, simply send STOP at any time."*
- **Garbage warning:** reuse live — *"⚠️ Your message could not be understood. Please send a clear question
  about our astrology consultation service."*
- **Block / abuse:** no user reply (D3) — silent.
- **U2 block admin alert:** reuse BMX-06 §11.2 auto-block alert copy (business language; embeds last message).

---

## 10. Open / parked items
- **Threshold tuning** — garbage=10 is a starting value; **review post-MVP** (locked 2026-05-29 — keep as
  discussed for now).
- **`silent_drop` retention/pruning** — inherited from BMX-06 §9 (post-MVP).
- **Reply localization** — English-only for now (inherited from BMX-06).

## 11. Pre-finalize checklist
- [x] AS-IS verified against live (§ header).
- [x] All design decisions locked (§2).
- [x] WF-25 full TO-BE flow (§5).
- [x] WF-26 revisit — drop welcome-back; inherit safety net (§6, decision #9).
- [x] button_reply / nfm_reply stage-validation reviewed; WF-02 nfm_reply guard added (§6, decision #10).
- [x] WF-44 caller audit (WF-43 sole caller) → strip redundant WF-25 call (§6, decision #11).
- [x] Full rollback backup of all 28 workflows (§8.1).
- [ ] User review of this spec.
- [ ] Verbatim copy sign-off at build (§9).
- [ ] BMX-06 amendments applied (§7).

---

## 12. AMENDMENT 2026-05-31 — D6: count off-topic-but-legitimate pass-through messages (BUG-06b)

> **Status:** design **LOCKED** (user-approved 2026-05-31, during BMX-P5-MATRIX S8 smoke). Scope **WF-43 only**.
> Implemented this session via build-workflow; `WF-43.pseudo` updated to match (pseudo-first). This amendment
> is the **design authority** for the change — `state.md` carries only an item pointer.

### 12.1 The gap (discovered in S8×F live smoke)
The §1–§5 safety net routes **garbage / abuse / non-text** through U2 (WF-61) — logged to `silent_drop`,
counted on the per-phone 30-day rolling total, blockable at threshold. But the **`general_enquiry`
pass-through bucket bypasses U2 entirely**: WF-25 deliberately merges greetings *and* off-topic-but-non-garbage
messages into `general_enquiry` (cheap classify, `maxOutputTokens=20`), returns pass-through to the caller,
and the caller (WF-43) calls its own *response* Gemini to reply. That response path is **never counted and
never blockable**.

Consequence: a user can send off-topic-but-legitimate-looking messages indefinitely (e.g. the S8×F probe
`"APPROVE PAYMENT"` — non-garbage, so WF-25 correctly classified it `general_enquiry`), each one burning a
Gemini response call, with no rate ceiling. A real cost / toy-with-the-bot vector, open today.

Two distinct defects surfaced on the same message:
- **BUG-06b-i (copy):** the WF-43 response prompt only framed the message as *greeting / question / interest in
  another reading* — no "off-topic" bucket — so Gemini latched onto the word "PAYMENT" + the ₹500/GPay anchor
  and replied *"please confirm your payment of ₹500 via GPay"*, implying a pending payment for a closed user
  who must REBOOK first.
- **BUG-06b-ii (no rate ceiling):** the cost vector above.

> **See also §13 (BUG-06c), discovered while smoke-testing this fix:** D6 handles only the legit pass-through
> buckets (`general_enquiry`/`wants_consultation`). A *garbage*-classified message used to also reach WF-43's
> Gemini (WF-25 returned control on garbage) → 2nd message + a null-content `off_topic` double-count. §13 fixes
> that at the source (WF-25 emits 0 items on garbage/abuse), so D6's off_topic check never sees garbage. The two
> are complementary; neither supersedes the other.

### 12.2 Why WF-43, not WF-25 (architecture note)
§2 centralizes the safety net in WF-25, so the instinct is to detect off-topic there. Rejected, because:
- WF-25's classify Gemini is intentionally cheap (`maxOutputTokens=20`, 8 buckets) and **merges** greetings +
  off-topic into one `general_enquiry` bucket. Splitting "relevant" from "off-topic-legit" would need a
  costlier extra distinction on every existing-user message at every stage.
- WF-43's **response** Gemini already has to *read and understand* the message to reply. Having it **also**
  emit a `valid_user_message` boolean is essentially free — no second model call. The relevance judgment
  rides on a call we already make. This keeps the cheap classifier cheap and puts the richer judgment where
  the rich (response) model already runs.

This does NOT violate "centralize the net in WF-25": U2 (the actual log→count→block policy) is still the
single shared mechanism. WF-43 only adds a *new trigger* into U2 — the same pattern WF-02/21/23/25 already use.

### 12.3 Design (LOCKED)
WF-43 Step 12 (the general-reply Gemini) changes from plain-text → **JSON output**:
```json
{ "valid_user_message": true|false, "response": "<2-3 sentence reply>" }
```
- `generationConfig.responseMimeType = "application/json"` on the HTTP node; the prompt **opens** with the
  JSON mandate (front-loaded for determinism — D6c).
- **Parse fail-open (D6e):** if the JSON is malformed or a field is missing, treat as
  `valid_user_message = true` and fall back to a safe reply. A legitimate user is **never** blocked or
  silenced on a parse glitch.
- `valid_user_message === true` → send `response` via WF-50 (exactly as today).
- `valid_user_message === false` → call **U2 / WF-61** (`9Zt23yt8k8PQSgji`):
  `{ phoneNumber, messageType:'text', reason:'off_topic', messageContent, blockThreshold:10, blockReason:'threshold_off_topic' }`
  → on `{ blocked }`:
  - `blocked === true` → **END silent** (U2 already set `status=blocked` + sent the admin block alert). No reply.
  - `blocked === false` → **still send `response`** via WF-50 (the graceful redirect) — D6a.
- Gemini **API** failure (HTTP error, not a content-relevance signal) → U1 / WF-53, unchanged.
- **No double-counting:** `general_enquiry` was never counted before, so this is the *first* count for the message.

### 12.4 Decisions locked
- **D6a — Send the redirect when not blocked.** Off-topic-but-under-threshold still gets the graceful
  "steer back to the service" reply; the count happens silently in the background. The threshold only caps
  *repeat* offenders. (Rejected: stay silent once counted — would make a real user's first off-topic message
  look broken.)
- **D6b — Reuse U2/WF-61 unchanged; `reason='off_topic'`, `blockReason='threshold_off_topic'`,
  `blockThreshold=10`.** Distinct audit labels keep off-topic blocks separable from garbage blocks in the
  admin alert + `users.blocked_reason`. Shares the per-phone 30-day `silent_drop` bucket with all other
  reasons (lower-bar-wins, §4 — accepted bias). No schema change (U2 stores caller's labels verbatim).
- **D6c — JSON mandate at the FRONT of the prompt** (user feedback — sticks better than a trailing instruction).
- **D6d — Prompt rewritten** greeting/question/off-topic-aware + explicit guard "never assume the person wants
  to pay or tell them to 'confirm payment'". Verbatim copy in §12.6.
- **D6e — Parse fail-open** (see §12.3).

### 12.5 Caveats & mitigations (on the record)
| # | Caveat | Mitigation |
|---|--------|------------|
| A | gemini-2.5-flash-lite must emit valid JSON reliably | `responseMimeType=application/json` + front-loaded mandate + **fail-open** parse |
| B | `off_topic` shares the 30-day bucket with garbage/non-text/abuse | Consistent with locked §4 (lower-bar-wins); accepted bias |
| C | `valid_user_message` is Gemini's judgment — rare false-positive on an unusual-but-legit question | threshold 10 + 30-day window + fail-open ⇒ negligible user harm |
| D | **Scope = WF-43 only.** WF-30 / WF-31 have the same pass-through-Gemini cost vector (`general_enquiry` reply); WF-40 has no own response Gemini (relays to Chinmay) so it is unaffected | **Deferred consistency item** (§12.7) — payment-stage users are financially invested ⇒ lower abuse risk; revisit post-MVP. Do NOT silently leave it unrecorded |
| E | A blocked off-topic flooder with a `users` row needs admin UNBLOCK to return | Deliberate at threshold 10 (= sustained spam); consult Slack channel preserved (DR-10) |

### 12.6 Content — WF-43 off-topic-aware JSON prompt (verbatim, user-approved 2026-05-31)
> Respond with ONLY a JSON object — no text outside it — with exactly two fields: `valid_user_message` (boolean: true for a genuine greeting, an astrology- or service-related question, or genuine interest in another reading; false for off-topic or unrelated messages such as random words, bot-testing, stray commands, or irrelevant chatter — even when not abusive) and `response` (your reply, following the guidance below).
>
> You are a warm, concise assistant for Chinmay Astro, a Vedic astrology consultation service on WhatsApp run by Dr. Chinmay Mujumdar. This person has had a consultation with Dr. Chinmay before and is now reaching out again. Write the `response` in 2-3 short, friendly sentences. If they ask a genuine astrology- or service-related question, answer briefly and factually (don't invent prices or policies beyond: a new consultation is ₹500, paid via GPay, conducted over WhatsApp). If they greet you or seem genuinely interested in another reading, warmly welcome them back and invite them to start a new consultation by replying REBOOK. If their message is off-topic or unrelated to astrology and isn't a clear question or booking request, gently acknowledge it, steer back to what Chinmay Astro offers, and let them know they can reply REBOOK whenever they'd like a new reading. Never assume the person wants to pay or tell them to "confirm payment" — a returning user must reply REBOOK before any payment applies. Never use bullet points or list instructions.
>
> User: ${messageContent}

### 12.7 New open / parked item (adds to §10)
- **WF-30 / WF-31 off-topic counting (consistency with D6)** — the same uncounted pass-through-Gemini vector
  exists in the payment-stage handlers. Deferred post-MVP (caveat D). Lower priority: payment-stage users are
  invested. Revisit when WF-30/31 prompts are next touched, or before scale-up.

---

## 13. AMENDMENT 2026-05-31 — D7: WF-25 must emit 0 items on internally-handled branches (BUG-06c)

> **Status:** design **LOCKED** (user-approved 2026-05-31, Approach X). Implemented this session in WF-25
> (`eTV1lUcYrXBg2q2T`); `WF-25.pseudo` Step 13 added. Supersedes the §5 "no return — confirmed safe" claim
> (corrected inline above).

### 13.1 The defect (systemic, surfaced by BUG-06b smoke)
The §5 return contract assumed garbage/abuse branches "terminate with NO return" and the callers therefore
"take no action." **n8n has no such primitive** — `executeWorkflow` always hands the sub-workflow's terminal
node output back to the caller, which resumes. So WF-25's garbage/abuse dead-ends (each emitting 1 item)
caused **every user-replying caller to send a SECOND message** on any garbage-classified message:
- WF-30 (`Is General Enquiry?` FALSE) → **Prepare Payment Reminder**
- WF-31 (`Is General Enquiry?` FALSE) → **Prepare Under Review Message**
- WF-43 (catch-all `else`) → Gemini → off-topic redirect (+ off_topic double-count vs WF-25's garbage count)

WF-40 (consultation_active) is a relay (no user reply) and uses the D4 `Active Consultation? = TRUE →
Return to Caller` path, so it is unaffected.

Evidence: S8 smoke (2026-05-31). "How's weather in Tokyo" (WF-25 → `garbage`) produced 2 outbound messages
(WF-25 warning + WF-43 redirect) and 2 `silent_drop` rows (`garbage` + `off_topic`-null). exec 2733 (WF-43)
ran all 15 nodes incl. Gemini after WF-25's garbage dead-end. The off_topic double-count contributed to the
test phone hitting the threshold-10 block prematurely (`blocked_reason=threshold_off_topic`).

### 13.2 Why the absence of a `Return to Caller` node was misread
WF-25 routes pass-through/stop/D4 into a `Return to Caller` node, but garbage-warning / garbage-blocked /
abuse just dead-end. That visual asymmetry reasonably read as "no control returns" (cited repeatedly during
the 2026-05-29 planning without pushback). The n8n truth: a dead-end still emits its last node's output to
the caller. "No return" is real ONLY if the branch emits **0 items**.

### 13.3 Fix (LOCKED — Approach X)
Add a single **`Return Nothing`** Code node (`return []`) to WF-25; wire the three internally-handled terminals
into it: `Call WF-50 (Garbage Warning)`, `End — Garbage Blocked (Silent)`, `Call U2 (Abuse)`. Every caller's
`Call WF-25` node has `alwaysOutputData=false` (verified across WF-30/31/40/43), so 0 items → the caller's
downstream chain does not execute. The D4 active-garbage path (`Active Consultation? = TRUE → Return to
Caller`) is **untouched** — WF-40 still relays active-stage garbage to Chinmay. Abuse never relays (D3 — the
content is embedded in U2's block alert), which `Return Nothing` preserves.

One WF-25 change fixes WF-30/31/43 at once; **no change to WF-30/31/40/43 needed.** BUG-06b's WF-43 off_topic
handling stays — it now only ever runs on legit `general_enquiry`/`wants_consultation` pass-through.

### 13.4 New project pattern + caveats
- **No prior `return []` precedent** in the codebase (the convention was "always return ≥1 item; caller
  gates"). This is a net-new pattern — **document in the methodology plugin** (`build-workflow`: "to stop a
  caller from resuming after a sub-workflow call, emit 0 items; a dead-end branch does NOT stop the caller").
- **Lynchpin validated live** (2026-05-31): a sub-workflow returning `[]` makes the caller's `executeWorkflow`
  (`alwaysOutputData=false`) skip its downstream chain. [to be ticked after live test]
- **Gemini-failure (Step 5 / U1) path NOT in scope** — it terminates via U1's halt (error propagation), a
  different mechanism. Flagged to verify separately that it doesn't let the caller resume.
