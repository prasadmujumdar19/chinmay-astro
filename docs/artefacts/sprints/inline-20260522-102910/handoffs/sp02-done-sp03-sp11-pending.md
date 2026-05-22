# Handoff — SP-02 done, SP-03 + SP-11 pending in Batch 2

_Written 2026-05-23T07:55:00Z_

## Stopping Point

Sprint `inline-20260522-102910` — Batch 2 (P2). **SP-02 complete, verified, and committed/pushed to `main`.** Sprint still in flight; remaining in Batch 2: SP-03 (admin-action precondition audit) and SP-11 (WF-01 + WF-10 user-load gates, new — added this session).

User chose to pause at the SP-02 boundary so SP-03 and SP-11 (both substantial pieces of work) can be started fresh in a new session.

## Committed Work — Batch 2 SP-02

Committed to `main` as part of this batch checkpoint (working dir is Google Drive, no local `.git`; commit landed via the standard `/tmp/claude-scratch/chinmay-astro` clone-and-push flow):

| File | Change |
|---|---|
| `workflows/zM8WbxSdt9nXRoLZ.json` | WF-21 export after aod=true on Insert Pending User |
| `workflows/dr8QM0m92Ml8MvIh.json` | WF-22 export after aod=true on Save Slack Channel ID |
| `workflows/emUOLWVZiNVxcOe3.json` | WF-32 export after aod=true on Create Payment Record + Update User Status |
| `workflows/se82n3MUQ9xE5aEr.json` | WF-34 export after aod=true on Reset User Status to payment_pending |
| `workflows/Du2CJ3OTohRFZYoA.json` | WF-44 export after aod=true on Save Feedback to DB |
| `workflows/MUG7rPgSHc7UtAE9.json` | WF-45 export after aod=true on Set status=payment_pending |
| `workflows/2U7mxHMyqA41ROKX.json` | WF-47 export after aod=true on Update User Status to opted_out + Close Open Consultation |
| `docs/Tech_Debts.md` | TD-NEW-029 added under P2 — technical-failure class for postgres mid-flight halt |
| `docs/pseudocode/WF-47.pseudo` | Step 2 clarification paragraph on why aod=true is safe under pre-onboarding STOP |
| `docs/workflow-registry.md` | WIP section: SP-02 completion entry |
| `docs/artefacts/sprints/inline-20260522-102910/state.md` | SP-02 status=done; SP-11 added |

Pre-mutation backups committed alongside: `archive/backups/<uuid>-2026-05-23-07-50.json` × 7.

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint` (no args — `_active` marker auto-resumes) and pick one of:

- **SP-11 first** — soft-depends on SP-02 (done). Structural + non-parametric per Step 2a / Step 5f.0; must do pseudo-first refactor on WF-01.pseudo + WF-10.pseudo before any JSON change. The architectural baseline SP-03 will lean on (WF-10 portion overlaps with SP-03).
- **SP-03 first** — no hard dependency on SP-11. Audit-heavy; may surface needs-decision items.

Both are substantial — start fresh and pick one to scope this session.

## SP-11 Scoping (full design captured in state.md — do NOT re-derive)

State.md item SP-11 contains the complete scope. Summary for handoff context:

**WF-01 gate** — after Step 11/12 (Load Pending User + Load Full User + Prepare User Data), gate before Step 13 (Call WF-02):
- `user` exists → continue normally
- `user` null, `pendingUser` exists → continue normally (legitimate pre-form state)
- `user` null, `pendingUser` null, messageType='text' → continue (legitimate NEW_USER → WF-21)
- `user` null, `pendingUser` null, messageType='interactive' (button tap from unrecorded phone) → admin alert via WF-51, do NOT call WF-02
- `user` null, `pendingUser` null, messageText matches STOP/REBOOK → admin alert, do NOT call WF-02 (eliminates WF-47 pre-onboarding STOP edge at source)

**WF-10 gate** — after Load User Status (already simplified by SP-01), gate before "User Consultation Active?":
- Row returned, status='consultation_active' → existing TRUE branch
- Row returned, status ≠ 'consultation_active' → existing FALSE branch
- **No row returned** (orphaned channel) → NEW branch: admin alert "No user record for channel <id>. Orphaned channel?" (SP-01's FALSE branch currently misfires here with "user not in consultation_active" when `.status` is actually undefined)

Pseudo-first per Step 5f.0 — non-parametric (alters control flow).

## SP-03 Scope (unchanged from original plan)

Admin-action precondition audit for APPROVE PAYMENT, REJECT, CLOSE, BLOCK, UNBLOCK plus text-relay path (WF-10 → WF-41). For each verify (a) user-exists check, (b) state-precondition check, (c) admin Slack feedback on either failure (no silent drops). Confirm TD-021 and TD-022 emit feedback. WF-10 portion will overlap with SP-11 — coordinate so the two don't double-add gates.

## Blockers

None. The pause is intentional.

## Verified Facts (cite when resuming, do not re-verify)

- All 9 SP-02 target nodes now have `alwaysOutputData=true` (spot-checked post-mutation on WF-32 and WF-47 nodes; full set re-exported to `workflows/`).
- WF-02 routes `PAYMENT_CONFIRM ⇔ user IS NOT NULL AND user.status='payment_pending'` (confirms WF-32 Step 6 0-row is technical-only).
- WF-47's existing IF graph handles aod=true empty-`{}` gracefully via FALSE-branch bypass to Prepare WF-50 Payload (which reads phoneNumber from trigger).
- WF-01.pseudo line 41–42: `isNewUser = (user is null) AND (pendingUser is null)` computed but no explicit gate (current behavior passes nullable user payload to WF-02 unconditionally).
- WF-20 calls WF-47 on STOP regardless of user-existence (userId may be null per WF-20.pseudo line 18).
- n8n tunnel currently open (curl returned 401 on no-auth request — auth required, not connection refused; session-start hook's tunnel check is misleading).

## Changed Reference Values

- **9 Postgres write nodes now at aod=true**: WF-21 Insert Pending User; WF-22 Save Slack Channel ID; WF-32 Create Payment Record + Update User Status; WF-34 Reset User Status to payment_pending; WF-44 Save Feedback to DB; WF-45 Set status=payment_pending; WF-47 Update User Status to opted_out + Close Open Consultation.
- **TD-NEW-029** added to `docs/Tech_Debts.md` (P2 section, between TD-034 and the P3 divider).
- **SP-11** added to sprint state items list (between SP-10 and `followups_logged`).
- **WF-47.pseudo Step 2** has a new clarification paragraph immediately after the SQL block.
- **workflow-registry.md WIP section** has an SP-02 completion bullet right after F-13.

## Plugin Improvement Candidates (for SP-10's list when it runs)

- **Principle (g) — User-load gates:** When a workflow loads a user record by external key (phone, slack_channel_id, etc.), the load step must include an explicit user-found check with admin-feedback on miss. Downstream operations trust the load. Avoids per-consumer-workflow guard proliferation. (Validated by SP-11's design — same principle applied at WF-01 and WF-10.)
- **Principle (h) — Audit-vs-reality drift validation pattern:** Sprint items that prescribe blanket mechanical changes ("set X on N nodes") should be validated per-node against build-workflow Step 5a before mutation. SP-02 went from "set true on 10 nodes" → "9 nodes confirmed; option B IF-guard expansion correctly rejected after upstream-gating analysis" by following Step 5a. Matches `build-sprint` Step 3 audit-vs-reality drift principle.
