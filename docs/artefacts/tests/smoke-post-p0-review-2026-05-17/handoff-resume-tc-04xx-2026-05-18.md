# Handoff — Resume smoke-test-post-p0-review at TC-04xx (consultation messaging)

**Written:** 2026-05-18
**Test session:** `docs/artefacts/tests/smoke-post-p0-review-2026-05-17/` (continues across calendar date)
**Last action verified:** TC-0303 admin APPROVE PAYMENT → user state transitioned to `consultation_active`; admin Slack notification was the only break (now fixed by sprint `followups-input-contract-sweep`).

## Stopping point

Smoke test paused between TC-0303 (admin APPROVE PAYMENT, verified core path passed) and TC-04xx (consultation messaging — user → admin relay via WF-40 and admin → user relay via WF-12). During TC-0303 verification, WF-33's `Call WF-51 Notify Admin in Channel` errored with Slack `invalid_arguments` because WF-51 received `null` (input-contract violation — `mappingMode: "passthrough"` with upstream being another executeWorkflow whose response shape doesn't match WF-51's expected `{channelId, messageText}`).

A project-wide sweep traced 13 high-confidence-broken sites of this same pattern across 7 workflows (`followups-input-contract-sweep.md`). The build-sprint session ran in parallel, fixing all 13 + verifying 18 Code/Set upstream sites. Commit `a16d649` on `prasadmujumdar19/chinmay-astro` `main`. Live re-verification on 2026-05-18 confirms all 38 caller sites are now either explicit `defineBelow` or have a Code/Set upstream — zero passthrough+Postgres/executeWorkflow/IF/Switch combinations remain in the project.

The smoke test is now safe to resume.

## Next action

Re-invoke the slash command to enter the monitor:

```
/n8n-whatsapp-methodology:monitor-test-run we'll continue from TC-04xx
```

Then verbatim:

```
> ready
```

The next ticks will exercise consultation messaging. Recommended flow:

1. **TC-0401 — user → admin relay:** send a message (e.g. "hi") from `61466927921` on WhatsApp. Expect WF-00 → WF-01 → WF-02 → WF-40 (since state is consultation_active) → WF-51 posts to `consult-61466927921` (C0B567A175W). Verify the message lands in the consult channel.
2. **TC-0402 — admin → user relay:** post a message from operator's Slack account into `consult-61466927921`. Expect Slack event webhook → WF-10 → WF-12 → WF-50 sends to user via WhatsApp. Verify the message arrives on the test phone.
3. **TC-0403 — close consult:** operator types `CLOSE CONSULT 61466927921` in `consult-61466927921`. Expect WF-10 → WF-11 → WF-42 → users.status transitions to `consultation_closed`, consultations row gets `ended_at` set, WF-50 sends feedback prompt to user, WF-51 acks in consult channel.
4. **TC-0404 — feedback:** user sends a reply (e.g. "thanks great consult"). Expect WF-43 → WF-44 → ack + log.
5. Later batches: TC-05xx (REBOOK), TC-06xx (STOP/HELP), TC-07xx (BLOCK/UNBLOCK), TC-08xx (PG rejection path).

Tick wisely — type "check" after each user action so cursors stay tight.

## Pre-resume state

### n8n
- Tunnel verified open this session (`HTTP 200` against `/workflows`).
- Latest execution cursor: `1214` (refreshed 2026-05-18 immediately before this handoff; saved to `.cursors/exec-cursor`).
- Time cursor: see `.cursors/time-cursor`.
- Slack cursors (admin channel / consult-channel) unchanged from prior session — bump as needed in the first tick.

### Postgres
| Surface | Value |
|---|---|
| `chinmay_astro.users` (id=28) | `status=consultation_active`, `slack_channel_id=C0B567A175W`, `current_consultation_id=9`, `name=Abcs`, `phone_number=61466927921` |
| `chinmay_astro.consultations` (id=9) | `user_id=28`, `status=active`, `started_at=2026-05-17 21:35:37.997896`, `ended_at=null` |
| `chinmay_astro.messages` for user_id=28 | **still 0** — see `followups-wf60-logger-broken.md` (P1, deferred to separate `technical-workflow-review` sprint) |

### Slack
- Bot is a member of `consult-61466927921` (C0B567A175W) — WF-52's invite-bot succeeded back at form-submit time.
- Admin channel `chinmay-admin-commands` (C0A5B0ZE81E) still in use for admin-wide commands.

## Blockers / known caveats to carry into next session

1. **WF-60 Message Logger silently failing INSERTs** — `followups-wf60-logger-broken.md`. Recommend `technical-workflow-review` sprint on WF-60 alone before relying on `messages` table for audit. Does NOT block TC-04xx but means message-history queries will return empty during testing.
2. **WF-25 Gemini intent classifier intermittent errors** — `followups-wf25-intent-classifier.md`. Defaults to `general_enquiry` when Gemini fails. Also has `userStatus` not flowing into prompt (P3 input-contract bug). Worth investigating credential + caller's `workflowInputs` shape. Does NOT block TC-04xx but may cause unexpected intent routing later.
3. **Plugin improvement candidates from this sprint** captured in `state.md` of the build-sprint folder:
   - Embed `live_updated_at` + `generated_at` in WF-XX.md frontmatter.
   - Promote `scripts/assert-md-fresh.sh` to plugin (currently lives in project as stopgap).
   - Add input-contract validation to `technical-workflow-review` and `build-workflow` Step 5f.2 diagnostic checklist.
4. **All canonical-shape and input-contract sweep work is committed.** Pending uncommitted work in this test folder: this handoff + the updated `followups-input-contract-sweep.md` "✅ RESOLVED" header. Worth a single doc-only commit at session end (not blocking smoke test resume).

## Resume command (verbatim)

```
/n8n-whatsapp-methodology:monitor-test-run we'll continue from TC-04xx
```

then:

```
I'm about to send "hi" from 61466927921 — expected: WF-40 relays to consult Slack channel
```

then perform the action and type `check`.
