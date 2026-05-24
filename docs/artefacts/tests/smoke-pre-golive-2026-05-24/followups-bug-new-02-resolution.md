# Follow-ups — BUG-NEW-02 resolution thinking

Captured during the session for triage in a future build-sprint. **No code/pseudo/.md edits made.**

## Operator's design direction (2026-05-24)

> WF-21 is for genuinely new users (or post-cleanup wiped users who LOOK new). For an opted_out user whose DB records still exist, sending welcome+form is wrong — they've already onboarded with name/DOB/birth-place. Re-issuing the form makes them re-enter data (UX regression + data-correctness risk).
>
> Re-engaged opted_out users should: have their status lifted out of opted_out, then have their message routed through the intent filter to be handled like any other returning user — answer general enquiries, prompt REBOOK if they intend to book, process REBOOK/HELP keywords directly. Primary goal: move them out of opted_out and let normal routing take over.

## Reviewer (Claude) — analysis

### Why this matters
- `users.status = opted_out` exists to honor regulatory opt-out (STOP). The state's UX commitment is "no further messages unless they reach out." Once they reach out, the regulatory contract is satisfied — they've opted back in by initiating contact.
- Continuing to treat them as "never-onboarded" wastes their data (DOB/name/place stored from prior submission) and creates the loop observed in this session.

### Architectural placement — three options

**Option A — fix inline in WF-01's `Opted Out?` YES branch**
- Smallest change. Add UPDATE users SET status='consultation_closed' + welcome-back message-build + WF-50 call, then terminate (don't continue to WF-02).
- Cons: WF-01 is filtering layer; adding business-logic mutations there pollutes single responsibility. Drift-check rule violations likely.

**Option B — new workflow (e.g. WF-26 "Re-Engaged Opted-Out User Handler")** ← recommended
- WF-01's `Opted Out?` YES branch calls WF-26 (instead of WF-21).
- WF-26 responsibilities: (1) UPDATE users.status = consultation_closed (or whatever the safe re-entry default is); (2) send "welcome back" WA message via WF-50 with hints (REBOOK, HELP, or just ask); (3) optionally forward the incoming message to WF-25 → route by intent so the very first re-engagement message is answered, not just acknowledged.
- Cons: more work to build; one more entry in WF-XX inventory.

**Option C — handle inside WF-21 with an `if status === opted_out` branch**
- Operator's "easier solution" candidate. Reuses WF-21.
- Cons: WF-21 becomes two different workflows in one ("Welcome new user + send form" vs "Lift opted_out + welcome back"). Naming would be misleading; future readers would assume WF-21 only handles purely new users. Higher drift risk.

### Reviewer recommendation
**Option B.** Cleaner separation, easier to drift-check, doesn't bend WF-01's "filter layer" role or overload WF-21's purpose. Cost is one more workflow, which is small for the readability gain.

> **Operator note (2026-05-24):** the WF-26 design above is a *starting point for discussion*, NOT a finalised spec. Before any pseudo gets written, the operator wants a dedicated design session to walk through: re-entry status semantics, whether to forward the first message, welcome-back wording, what to do if user opted out from `payment_submitted`, and any other edge cases not yet enumerated. Treat everything above (re-entry status, message-forwarding, wording, etc.) as open. Do NOT assume the recommendation as stated is complete or sufficient.

If shipping speed matters more than architectural cleanness for pre-go-live, Option A is acceptable as a stopgap with a tech-debt note to refactor into WF-26 post-go-live.

### Open design questions before implementation

1. **Re-entry status — what value?**
   - `consultation_closed` is the natural fit (already a known dormant-but-onboarded state, routes through WF-43 → intent classifier on free-form text).
   - But for users who opted out from `payment_pending` (never reached consultation), lifting to `consultation_closed` is semantically odd (they never had a consult).
   - Alternatives: a new transient state like `re_engaged`, or store-and-restore prior status (more complex).
   - **Lowest-friction**: always `consultation_closed`. The semantic oddness is acceptable; downstream behavior is identical (free-text gets intent-classified, REBOOK keyword sends them through the payment flow).

2. **Welcome-back message wording**
   - Short, helpful, no jargon: e.g. *"Welcome back to Chinmay Astro. Reply REBOOK to start a new consultation, HELP for options, or just send your question and I'll help."*

3. **Forward-the-first-message or just acknowledge?**
   - Forwarding: user's first message gets answered immediately (intent-classified → routed). Best UX.
   - Acknowledging-only: simpler but the user has to send a second message before anything happens. Worse UX.
   - Recommend forwarding (extra step in WF-26 to call WF-25 → branch by intent → route to appropriate downstream WF). Adds complexity worth paying for.

4. **WF-01 ordering — what about other filters?**
   - Country and Blacklisted should still run BEFORE re-engagement (don't re-engage a blacklisted user).
   - Non-Text Filter currently runs before `Opted Out?`. For a re-engaging opted_out user sending a non-text message (image/audio), do we deflect (silent reject) or lift them out anyway? Probably deflect (same as we do for new users). So order should stay: Country → Non-Text → Blacklisted → Opted Out?.

5. **Drift sprint integration**
   - TD-DRIFT-001 in `pseudo-md-drift-fixes-2026-05-24/tasks.md` L66 is currently a header-only stub for "WF-00 nfm_reply parse path — fix live". The real defect is in WF-01, not WF-00. When the drift-sprint owner fleshes out TD-DRIFT-001, retarget it to WF-01's `Opted Out?` ordering + WF-26 (or chosen option) — and consider whether the original "WF-00 nfm_reply" framing was a misdiagnosis worth deleting outright.

## Post-MVP tracker addition (also from operator)

> "We currently do not have any mechanism for users to correct or update the BIRTH details they shared originally during onboarding. We need to provision a keyword to do so and create workflow to handle this."

Captured here for handoff into the post-MVP backlog. Suggested keyword: `UPDATE` or `UPDATE DETAILS`. New workflow WF-2x or WF-7x range. Behavior: send the same WhatsApp Flow form pre-filled with current values, accept new submission, UPDATE users row. Triggerable from any state except `blocked` / `opted_out` (gated through the same re-engagement handler we design above if from opted_out).
