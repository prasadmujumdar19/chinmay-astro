# TL;DR — Pre-Go-Live P0 Smoke (2026-05-24)

**Verdict:** P0 closeout queue is **done**. 5 of 9 P0 TCs verified PASS (3 freshly executed, 2 by reference to prior SP-03 smoke). 4 deferred TCs are unreachable via WA client (need crafted-webhook session). **1 [critical] BUG-NEW-02 carried over from morning, still unresolved**. **2 design gaps + 1 design question** raised this afternoon for sprint intake.

## Bugs / gaps at a glance

| ID | Sev | Workflow | What broke / what's missing | Fix applied | Status |
|---|---|---|---|---|---|
| BUG-NEW-02 | [critical] | WF-01 | opted_out users locked in re-engagement loop (WF-01 `Opted Out?` IF routes nfm_reply form submissions to WF-21, bypassing WF-22) | None — design discussion pre-pseudo | Open — carry to BUG-NEW-02 sprint |
| GAP-01 | [major] | WF-60 | pre-`users`-row WA events (`hi` inbound + WF-21 form outbound) not logged in `messages` (audit-trail hole) | None — pseudo-first design sprint needed | Open — see followups-message-logging-gap.md |
| GAP-02 | [minor] | WF-73 / WF-74 | maintenance + retention workflows provisioned in registry but not built (GDPR exposure deferred to post-go-live) | None — needs retention-policy decision + WF-73 scope expansion to cover GAP-01 fix | Open — see followups-retention-workflows.md |
| O-01 | [minor] | WF-47 | `consultations.status` left `active` after user opts out (gate works, but analytics inflate) | None — design call on `abandoned` vs `closed` enum | Open — see followups-consultations-stale-active.md |

## Test scope

| Phone | Scenarios | Outcome |
|---|---|---|
| 61466927921 (user 28, wiped → 29, wiped → 30) | TC-0606 (morning), TC-0604, TC-0605 | All 3 PASS |
| n/a (audit only) | TC-0302, TC-1012 | PASS by reference to SP-03 smoke (2026-05-23) |
| n/a (deferred) | TC-0315, TC-0704, TC-1006, TC-1007 | Unreachable from WA client — need crafted webhook session |

## State carry-forward

User 30 (61466927921) currently in `opted_out`, `slack_channel_id=C0B567A175W` (idempotently reused across all three wipe-and-re-onboard cycles this session — DR-10 holds empirically). Consultation 14 stuck in `active` per O-01. Channel C0B567A175W has the full conversation history from this session. No DB cleanup performed at end-of-session — state preserved for the next session's BUG-NEW-02 reproduction or further analysis.

## Tomorrow's queue (priority order)

1. **BUG-NEW-02 design discussion** — WF-26 ("Re-Engaged Opted-Out User Handler") is a starting point only; final design discussion required before pseudo. **Blocking go-live.**
2. **Crafted-webhook session for TC-0315 / TC-0704 / TC-1006 / TC-1007** — bot-loop guard, whitespace drop, empty-body drop. Will need direct POSTs to WF-00 with synthetic JSON bodies (bypassing WA client validation). Document each payload before sending.
3. **GAP-01 pseudo-first design sprint** — make WF-60 callable without `user_id`; decide schema option (nullable vs ghost-row vs phone-keyed); revise affected pseudos; implement; add coverage test.
4. **O-01 design call** — operator picks A/B/C for `consultations.status` post-opt-out; bundle WF-42/WF-46/WF-47 audit into one design pass.
5. **GAP-02 (post-go-live)** — WF-73 + WF-74 build, with WF-73 scope expanded per GAP-01 fix.
