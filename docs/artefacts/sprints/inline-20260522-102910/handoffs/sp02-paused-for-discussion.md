# Handoff — SP-02 paused mid-audit for discussion

_Written 2026-05-22T13:14:47Z_

## Stopping Point

Sprint `inline-20260522-102910` — Batch 2 (P2). SP-02 audit complete, all 7 workflow JSONs inspected, **mutations NOT yet applied**. Paused at user request to discuss something before proceeding (user picked "Pause — something else to discuss first" on the proceed-with-simplified-scope question).

Sprint state: 1 done (SP-01), 1 in-progress audit (SP-02), 8 pending. No GitHub commits since `81cd128` (end of Batch 1).

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint` with no argument. Skill auto-resumes via `_active` marker. Expect: "Resuming at Batch 2 (P2): SP-02…". User will then raise the topic they want to discuss before mutations begin.

## SP-02 Audit Conclusions (carry forward — do NOT redo)

Per-node verdict against `build-workflow` Step 5a:

| # | Workflow / Node | Op | Downstream uses returned row? | Verdict |
|---|---|---|---|---|
| 1 | WF-21 / Insert Pending User | INSERT | No | Set aod=true |
| 2 | WF-22 / Save Slack Channel ID | UPDATE w/ RETURNING | No | Set aod=true |
| 3 | WF-32 / Create Payment Record | INSERT w/ RETURNING | No | Set aod=true |
| 4 | WF-32 / Update User Status | UPDATE w/ RETURNING * | Yes (Prepare User Confirmation reads .phone_number, .name) | Set aod=true (see synthesis) |
| 5 | WF-34 / Reset User Status to payment_pending | UPDATE | No | Set aod=true |
| 6 | WF-44 / Save Feedback to DB | UPDATE | No | Set aod=true |
| 7 | WF-45 / Set status=payment_pending | UPDATE | No | Set aod=true |
| 8 | WF-47 / Update User Status to opted_out | UPDATE w/ RETURNING slack_channel_id | Yes (Has Slack Channel? IF reads .slack_channel_id) | Set aod=true (see synthesis) |
| 9 | WF-47 / Close Open Consultation | UPDATE | No | Set aod=true |

**SP-02 description claims 10 nodes; live audit found 9.** Sprint state field will need updating.

## Synthesis — why "set aod=true alone, no IF guards" is safe

Initially proposed Option B (aod=true + IF guard + WF-51 admin feedback) for nodes #4 and #8. User pushed back with the correct principle: **upstream gating already validates user existence; downstream UPDATEs don't need to re-check.** Inspection confirmed:

- **WF-32 #4 (Update User Status):** WF-02 routes `route='PAYMENT_CONFIRM' ⇔ user IS NOT NULL AND user.status='payment_pending'`. WF-32 Step 5 then INSERTs into `payments` with FK to `users.id` — FK validates user exists. By Step 6, 0-row case = postgres connection blip in millisecond window between Step 5 and Step 6. Technical-only.

- **WF-47 #8 (Update User Status to opted_out):** WF-20 calls WF-47 on STOP regardless of user-existence (userId may be null per WF-20.pseudo). Pre-onboarding STOP (user in `pending_users` only) IS a functional 0-row case. BUT — WF-47's existing connection graph already handles aod=true's empty `{}` gracefully:
  - "Was Consultation Active?" reads userStatus from trigger → null → FALSE → skips Close Open Consultation
  - "Has Slack Channel?" reads .slack_channel_id from postgres → undefined → notEmpty=FALSE → skips Slack notice
  - "Prepare WF-50 Payload" reads phoneNumber from trigger → emits WhatsApp opt-out confirmation correctly
  - User receives the opt-out WhatsApp; admin gets no notice (correct — pre-form exit is benign)

**Conclusion:** SP-02 reduces to 9 mechanical aod=true flag-flips, Batch Surgical (Step 5d), no structural additions, no IF guards. WF-47.pseudo gets a one-line clarification (user picked default scope — see open question below) or stays untouched.

## Side Artifacts to Produce (when SP-02 resumes)

1. **TD-NEW-029 in `docs/Tech_Debts.md` under P2 / Design** — user-confirmed location. Covers: "Technical-failure class — postgres node mid-flight halt between consecutive nodes (DB connection blip, n8n hiccup). Bundle alongside TD-029 (WF-25 Gemini failure), TD-033 (WF-50 null body), TD-NEW-028 (WF-51 failure logging) into the planned error-handling sprint via retry / orphan-payment reconciliation infra. Specific instances: WF-32 Step 6 user update after FK-validated payment insert; any UPDATE following a SELECT/INSERT that already confirmed the row."

2. **Sprint state count correction** — SP-02 description says "10 active nodes" but live audit found 9. Update SP-02.description in state.md to say "9" and add a note.

## Open Items / Discussion Threads When Resuming

- **User-raised concern:** unknown topic — user paused the AskUserQuestion proceed flow to raise something. Wait for the user to surface it before mutating.
- **WF-47.pseudo clarification:** user did not pick between "include clarification" vs "skip clarification" yet — second AskUserQuestion superseded by the pause. Decide after discussion.

## Blockers

None technical. The pause is intentional, not a blocker.

## Verified Facts (cite these when resuming, do not re-verify)

- n8n tunnel open at session end (curl returned 401 — auth required, not connection refused). Session-start hook's tunnel check is misleading.
- WF UUIDs confirmed from `docs/workflow-registry.md` lines 86+: WF-21=zM8WbxSdt9nXRoLZ, WF-22=dr8QM0m92Ml8MvIh, WF-32=emUOLWVZiNVxcOe3, WF-34=se82n3MUQ9xE5aEr, WF-44=Du2CJ3OTohRFZYoA, WF-45=MUG7rPgSHc7UtAE9, WF-47=2U7mxHMyqA41ROKX.
- All 7 workflows' Postgres-node `alwaysOutputData` current state confirmed = false on the 9 SP-02 targets. (Some non-SP-02 Postgres nodes in the same workflows are already at aod=true — leave untouched.)
- WF-01 does NOT fail-closed on user-not-found; it loads + builds `isNewUser` + passes downstream to WF-02 unconditionally.
- WF-02 IS the gating router: `PAYMENT_CONFIRM ⇔ user IS NOT NULL AND status='payment_pending'`.
- WF-20 calls WF-47 on STOP keyword regardless of user-existence — pre-onboarding STOP reaches WF-47 with userId=null.
- WF-47's connection graph handles aod=true empty-`{}` gracefully via existing IF FALSE branches.

## Changed Reference Values

None — no mutations applied this session. Last commit on main remains `81cd128`.
