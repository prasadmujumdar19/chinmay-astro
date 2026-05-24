## Stopping Point

P1 smoke session `docs/artefacts/tests/smoke-pre-golive-p1-2026-05-24/` — completed the 5 retest TCs (TC-0601, TC-0602, TC-0603, TC-1013, TC-0609) in one batched operator walk. Found and accepted-pre-MVP BUG-P1-01 (WF-20 HELP text generic, not status-aware — tracked as TD-NEW-032 in `docs/sprint-tech-debt-2026-05-16-post-MVP.md` 🟡 P2). Stopped before starting the 11 truly-untested P1 TCs because session context was estimated ≥60%.

User state at stop: user 31 (61466927921) currently `consultation_active`, channel C0B567A175W, consultation id=16 active, payment id=20 verified. Live executions cursor 2158 captured in `.cursors/exec-cursor`. Slack channel C0B567A175W has the full walk transcript plus a stop-intent clarifier as the last bot message.

## Next Action

Resume `monitor-test-run` against the same folder `docs/artefacts/tests/smoke-pre-golive-p1-2026-05-24/` (do NOT create a new session folder — append a `## Resume — <timestamp>` block to its `session.md`, mirroring the P0 session's resume pattern at line 297).

Then execute the **11 truly-untested P1 TCs** in this order:

1. **DML clean-slate wipe** of user 31 (admin_actions/users/pending_users for 61466927921) — required to exit BUG-NEW-02 lock from current `consultation_active` (user will end up opted_out via a later TC, then needs to start fresh).
2. **Pre-form TCs from brand-new user state** (no `users` row, no `pending_users` row):
   - **TC-0102** — operator sends image/audio from WA before sending any text. Expect non-text deflection.
   - **TC-0106** — operator sends free-form general enquiry (e.g. "what services do you offer"). Expect WF-23 → WF-25 → general_enquiry → form re-prompt.
   - **TC-0107** — operator sends abusive text (e.g. "f*** you"). Expect WF-23 → WF-25 → malicious_abusive → WF-46 auto-block, users.status=`blocked`.
3. **Wipe again**, walk to `payment_pending` via hi → form:
   - **TC-0105** — submit form a second time (operator may need to send a second form via WhatsApp Flow). Expect idempotent re-write.
   - **TC-0203** — send free-form "how does it work?" from payment_pending. Expect WF-30 → general_enquiry path with FRESH payment button (BUG-D fix verification).
   - **TC-0204** — send `REBOOK` keyword from payment_pending. Expect WF-20 keyword intercept; behavior on invalid-state REBOOK needs defining (WF-45 reject? WF-30 redirect?).
4. Tap Payment Completed → `payment_submitted`:
   - **TC-0206** — send an image (mimic GPay screenshot). Expect deflection or payment_submitted handling per WF-31.
5. APPROVE → consultation_active → CLOSE → consultation_closed:
   - **TC-0507** — send free-form "tell me about my horoscope" from consultation_closed. Expect WF-43 → WF-25 → general_enquiry response.
   - **TC-0803** — send feedback-shaped free-form ("the consultation was great, thanks") from consultation_closed (where `awaiting_feedback=false`). Expect WF-43 → WF-25 → feedback_intent → WF-44 log + ack.
6. From `opted_out` (achievable by sending STOP keyword between steps): 
   - **TC-0308** — operator types `UNBLOCK 61466927921` in consult channel. Expect WF-10/WF-11 reject ("user is not blocked").
7. **TC-0503** — needs design call FIRST. Per May 18 evidence, `users.awaiting_feedback` is never set on close (feedback is button-payload-driven). The TC is potentially unreachable. Decide:
   - (a) Test as-spec'd by manually setting `awaiting_feedback=true` via DML, sending non-feedback text, observing.
   - (b) Re-spec the TC to match current button-driven design.
   - (c) Drop the TC.

**Deferred for separate harness session:** TC-0804 (Gemini API failure simulation), plus the P0-deferred crafted-webhook TCs from prior session (TC-0315 / TC-0704 / TC-1006 / TC-1007).

Reference for the full audit + bucket classification: this session's overview was delivered conversationally; the structured tracker remains `docs/reference/FunctionalTestCases_Tracker.md` (still shows the 11 as Pending — accurate). The 4 tracker-stale TCs that are PASS-by-evidence (TC-1002, TC-1004, TC-1005, TC-0312) and the 5 retest TCs completed this session (TC-0601/0602/0603/1013/0609) should all be updated in that tracker — recommended **before** starting the 11 new TCs, so the tracker reflects reality going in.

## Blockers

- **BUG-NEW-02** (carry-forward from P0 session) — still open, still blocks any test starting from a non-opted-out state without DML wipe. Workaround documented inline above (DML clean-slate per CLAUDE.md). Pre-go-live blocker for actual users, not for testing.
- **TC-0503 design question** — needs operator decision on whether to test against current button-driven design or re-spec.
- **Plugin improvement candidate** — this session demonstrated value in running a behavior-keyed audit across all prior `docs/artefacts/tests/*/session.md` + `docs/artefacts/sprints/*/working.md` BEFORE planning a test sprint, to identify ripple-effect coverage gaps and false-pending TCs. Worth considering a `discover-prior-coverage` sub-skill or an addition to `monitor-test-run` Step 1 ("Initialize test session" — add a "scan prior artefacts for ripple-effect evidence" sub-step). Apply via `flush-plugin-improvements` skill before next session if there's appetite — context this session was too high to do it inline.

## Changed Reference Values

- `users.id` for phone 61466927921 is now **31** (was 30 at session start; bumped by clean-slate wipe → re-onboard within this session).
- `consultations` table: id=15 closed, id=16 active (for user 31).
- `payments` table: ids 19 + 20 verified (for user 31).
- `messages` table watermark: max id = 148 at stop.
- n8n executions cursor: **2158** (was 2008 at session start).
- New post-MVP tracker entry: **TD-NEW-032** in `docs/sprint-tech-debt-2026-05-16-post-MVP.md`.
- Slack channel `C0B567A175W` continues to be reused (DR-10 + WF-52 idempotency confirmed for 4th time this session — user 28/29/30/31 all reused same channel).
