# TL;DR

**Verdict:** ✅ All 7 attempted happy paths green by end of session. **3 critical/major bugs found and fixed in-session** — no unresolved blockers. WF-11 channel-routing cleanup partially done (3 of 5 nodes). Remaining items are non-blocking polish + scenarios not yet exercised.

## Bugs at a glance

| ID | Sev | Workflow | What broke | Fix applied | Status |
|---|---|---|---|---|---|
| **BUG-01** | `[critical]` | WF-22 | `Save Slack Channel ID` expression referenced a renamed predecessor node (`Call WF-52 (Create User Channel)` no longer exists; node was renamed to `Ensure Slack Channel Exists (WF-52)`). `slack_channel_id` never saved → payment instructions never sent → 100% failure on every new-user form submission. | Updated `queryReplacement` to reference the new node name. Backfill ran cleanly against existing user row. | ✅ Fixed |
| **BUG-02** | `[major]` | WF-33 | New `Update User Consultation Id` node had duplicate `$1` placeholder (both `current_consultation_id =` and `WHERE id =` used `$1`). UPDATE silently matched zero rows; `users.current_consultation_id` stayed NULL. | Split into `$1` (consultation id) and `$2` (user id) with two-param `queryReplacement`. | ✅ Fixed |
| **BUG-03** | `[major]` | WF-10 → WF-41 | Admin→user relay: `Load User Status` query returned only `{status}`, dropping `channelName` + `messageText` upstream. `Call WF-41` passthrough forwarded just `{status}` → WF-41's `Extract Phone from Channel` got `undefined.replace()` → TypeError. | Operator rewrote `Load User Status` SQL to smuggle channel + message via SELECT literals; WF-41 code updated to lowercase column name. **Caveats logged for cleanup** — see followups-relay-fix.md. | ✅ Fixed (with tech debt) |
| WF-11 UNKNOWN | `[minor]` UX | WF-11 | Posted unknown-command response to hardcoded admin channel instead of originating channel | Switched to `={{ $json.channelName }}` | ✅ Fixed |
| WF-11 HELP/LIST/STATS | `[minor]` UX | WF-11 | Three nodes hardcoded admin channel; HELP responder misnamed `Send Stats To Admin1` (operator was editing wrong node, thinking workflow "reverted") | Renamed misleading node + switched all three to dynamic `channelName`. Two more nodes still hardcoded — see followup. | 🔧 Partial |

## Test scope

- **Phone:** `61466927921` (Australia +61 — confirmed allowed by WF-01 country gate)
- **Scenarios exercised:** TC-0101, TC-0104, TC-0201, TC-0301, TC-0401, TC-0311, TC-0305
- **Scenarios deferred to next session:** Feedback (TC-0501/02), REBOOK (TC-0504/05), STOP from consultation_closed (TC-0606), Re-engagement (TC-0607), BLOCK/UNBLOCK (TC-0306/07)

## Tomorrow's queue

1. TC-0501 / TC-0502 — Feedback path (validates F-01 `stage` column)
2. TC-0504 / TC-0505 — REBOOK (Design Rule #10: reuse `C0B3SA9JALX`, no new channel)
3. TC-0606 — STOP from `consultation_closed` (validates F-02 WF-47 fix)
4. TC-0607 — Re-engagement after opt-out
5. TC-0306 / TC-0307 — BLOCK / UNBLOCK admin commands
6. Finish FU-WF11-03 (last 2 hardcoded admin-channel refs)
7. Reconcile registry docs (TD-004 status, Design Rule #1 wording, `ended_at` vs `closed_at`)

## State carry-forward

User row 27 ends the session in `consultation_closed`, `slack_channel_id=C0B3SA9JALX` preserved (Design Rule #10), `consultations.id=8` closed, awaiting next-day exercise of post-consult interactive buttons.
