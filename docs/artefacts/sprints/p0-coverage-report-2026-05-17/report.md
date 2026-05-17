# Chinmay Astro — P0 Pseudocode Coverage Report

**Date:** 2026-05-17
**Scope:** 13 P0 functional test cases vs. 20 pseudocode workflows + dependency map + design rules
**Method:** 6 parallel domain agents read each .pseudo file in full; the orchestrator aggregated findings, classified into Section A (functional/approval-needed) and Section B (autonomous fixes); user decisions captured for 11 themes; revisions applied to 18 .pseudo files + dependency-map.md + FunctionalTestCases.md + CLAUDE.md.

---

## Final P0 Verdicts (all 13 PASS)

| TC | Title | Verdict | Notes |
|----|-------|---------|-------|
| TC-0101 | First message new user (text) | ✅ PASS | unchanged from initial review |
| TC-0104 | Form submission (birth details) | ✅ PASS | TC text amended (no encryption-svc step — Flow is send-only); WF-22 button "Payment Completed ✓"; WF-52 returns structured error + isNew; WF-22 admin-alerts on WF-52 failure |
| TC-0201 | Payment Completed button | ✅ PASS | WF-02 PAYMENT_CONFIRM now requires status=payment_pending; TC text uses `pending_verification` (canonical payment status) |
| TC-0301 | Admin APPROVE happy path | ✅ PASS | WF-11 accepts both APPROVE and APPROVE PAYMENT aliases; WF-33 Slack post now routes through WF-51 |
| TC-0304 | Admin REJECT | ✅ PASS | WF-11 accepts both REJECT and REJECT PAYMENT aliases; WF-34 now has payment_submitted state guard mirroring WF-33; WF-34 Slack post routes through WF-51 |
| TC-0305 | Admin CLOSE | ✅ PASS | WF-11 accepts CLOSE CHAT CONSULT alias; WF-42 user-not-found error path added; TC amended to 2 buttons (no "I'm done" 3rd button); no archive (Design Rule #10) |
| TC-0311 | Admin → user plain text relay | ✅ PASS | WF-12 confirmed legacy (deactivation deferred to P1/P2); WF-41 remains active relay; messageText casing standardised |
| TC-0315 | Bot-loop prevention | ✅ PASS | WF-10 Step 5 `body.authorizations[0].user_id != body.event.user` documented |
| TC-0401 | Consultation-active text relay | ✅ PASS | WF-40 duplicate STOP intercept removed; WF-00 → WF-60 inbound logging added (Theme 4 — single audit point at entry) |
| TC-0604 | STOP from payment_pending | ✅ PASS | WF-47 archive steps removed (Design Rule #10 preserved); status → opted_out + admin_actions log + opt-out message |
| TC-0606 | STOP from consultation_closed | ✅ PASS | same as TC-0604 |
| TC-0704 | Bot echo prevention | ✅ PASS | WF-00 echo guard identifier documented: `message.from === value.metadata.display_phone_number.replace(/\D/g, '')` |
| TC-1012 | WF-33 reads channelId from DB | ✅ PASS | unchanged — WF-33 already reads slack_channel_id from DB; no WF-52 call |

**Score:** 13 / 13 P0 PASS.

---

## User Decisions Captured (11 themes)

| Theme | Decision | Files affected |
|-------|----------|----------------|
| 1 — Archival | NO archive on STOP/CLOSE; Design Rule #10 canonical. Separate post-MVP maintenance workflow for archive/delete. | WF-47 (Steps 7-8 removed); TC-0305/0604/0606 amended |
| 2 — Command aliases + channel scope | WF-11 accepts all aliases. **NEW design rule DR-13:** user-targeted commands (APPROVE/REJECT/CLOSE/BLOCK/UNBLOCK) in `consult-{phone}` only; admin-wide (LIST/STATS/HELP) in any channel. | WF-10, WF-11, CLAUDE.md DR-3a, TC-1009 |
| 3 — Post-consult buttons | Keep 2 buttons; drop "I'm done, thank you". | WF-42 (no change needed); TC-0305/0508 amended |
| 4 — Inbound logging | WF-00 → WF-60 for every inbound; filters live in WF-60. | WF-00, WF-60, dependency-map |
| 5 — Encryption-svc | Live WF-22 verified to NOT use encryption-svc (Flow in send-only mode). Pseudocode matches live. TC text amended. | WF-22 (note added); TC-0104; CLAUDE.md gotcha row stale |
| 6 — Payment status | Keep `pending_verification`; amend TC prose. | TC-0201/0301/0304 |
| 7 — WF-33/34 → WF-51 | Refactor both to route admin Slack posts through WF-51. | WF-33, WF-34, dependency-map |
| 8 — Polish bundle (all 4 selected) | ✓ glyph in WF-22; extend WF-50 null-body guard to interactive/template; add WF-52 isNew + structured error; log WF-50 silent-drop. | WF-22, WF-50, WF-52 |
| 9 — WF-02 safety | UNHANDLED → admin alert via WF-51; PAYMENT_CONFIRM status guard added. | WF-02, dependency-map |
| 10 partial | Form re-submit is a non-scenario (form shown once); admin Slack notification on new user landing deferred. | None (deferred) |
| 11A | "Welcome back" prefix for opted_out re-engagement; WF-00 echo check retained + documented. | WF-01 (wasOptedOut flag), WF-21 (welcome-back text), WF-00 (identifier source) |
| 11B | WF-34 state guard added; WF-12 deactivation DEFERRED pending P1/P2 review; WF-42 user-not-found path added; schema prefix applied wherever missing. | WF-34, WF-42, WF-10, WF-11 |

---

## Section B — Autonomous Fixes Applied

**Schema prefix added** (`chinmay_astro.` qualifier where missing): WF-01 Steps 6/10/11, WF-21 Step 2, WF-22 Steps 3/6, WF-10 Step 15, WF-11 Steps 10/16/18.

**Null guards / state guards added:** WF-02 lines 17-25 (all branches now check `user IS NOT NULL`); WF-02 PAYMENT_CONFIRM tightened to require `user.status=payment_pending`; WF-22 Step 4 changed from "id not empty" to rowCount-based check (Postgres `xmax=0` for inserted detection); WF-34 Step 4 mirrors WF-33's state guard.

**Variable/identifier fixes:** WF-33 Step 13 `<wa_id>` → `<phone_number>`; WF-10/WF-41 standardised on `messageText` (camelCase) across the dispatch boundary; WF-10 `event.*` → `body.event.*` for Slack payload paths.

**Documentation clarifications:** WF-00 echo guard identifier source; WF-00 messageContent for `nfm_reply.response_json`; WF-50 input contract per messageType; WF-51 text-only contract; WF-52 admin user annotation + team_id source.

**Behavior changes:**
- **WF-20** HELP branch: added explicit new/pendingUser case (TC-1013 5th branch).
- **WF-20** passthrough: explicit `{action: 'passthrough', ...}` return shape.
- **WF-50** Step 3 (TD-033 guard): extended from text-only to also detect missing interactivePayload and missing templateName.
- **WF-50** Step 3a: silent drops now log to WF-60 with `success=false, error='empty_body_dropped'` AND return structured error to caller.
- **WF-50** Step 11: when messageType='interactive', `messageContent` for WF-60 log uses `interactivePayload.body.text || JSON.stringify(payload)` instead of empty.
- **WF-50** Step 11: now carries `consultationId` through to WF-60.
- **WF-52** new-channel + existing-channel return now carries `isNew` flag; non-`name_taken` errors return `{success:false, error, channelId:null, isNew:false}` instead of falling off the end.
- **WF-60** Step 3 inbound filters (TD-030 bot-echo + TD-034 whitespace) added.
- **WF-60** Step 4 user-resolution: looks up `chinmay_astro.users.id` by phone_number when caller doesn't provide userId. Pre-onboarding inbound (no users row yet) returns `{logged:false, reason:'pre_onboarding_user'}` — acceptable MVP gap since audit trail begins at WF-22 form INSERT.

---

## Dependency Map — Revised Edges

**Added (5):**
- `WF-00 → WF-60` — inbound logging entry point (Theme 4)
- `WF-02 → WF-51` — UNHANDLED admin alert (Theme 9)
- `WF-22 → WF-51` — WF-52 failure admin alert (Theme 8)
- `WF-33 → WF-51` — admin Slack confirmation refactor (Theme 7)
- `WF-34 → WF-51` — admin Slack confirmation refactor (Theme 7)

**Removed (1):**
- `WF-47 → Slack archive` — was an inline Slack API call, not a sub-workflow edge in the formal map, but Steps 7-8 of WF-47.pseudo deleted (Theme 1).

**Unchanged:** all other 25 edges.

---

## Files Modified This Pass

**.pseudo files (18):** WF-00, WF-01, WF-02, WF-10, WF-11, WF-20, WF-21, WF-22, WF-33, WF-34, WF-40, WF-41, WF-42, WF-47, WF-50, WF-51, WF-52, WF-60

**Not modified (no changes needed):** WF-12 (deactivation deferred), WF-23, WF-25, WF-30, WF-31, WF-32, WF-43, WF-44, WF-45, WF-46

**Other files:**
- `docs/dependency-map.md` — 5 new edges, 1 revision note in header
- `docs/superpowers/FunctionalTestCases.md` — 8 TCs amended (TC-0104, 0201, 0301, 0304, 0305, 0508 dropped, 0604, 0606, 1009, 1010) + revision note in header
- `CLAUDE.md` — DR-3a added (channel-scope rule with command aliases)

---

## What's NOT in this pass (deferred to P1/P2 reviews)

- **Live workflow JSON edits** — this review covered pseudocode only. The same changes must propagate to live n8n workflows (use `build-workflow` skill or manual n8n updates). Coordinator: see Section "Implementation Follow-up" below.
- **A-D2-05** WF-22 already-exists-branch channel refresh — user confirmed form re-submit is a non-scenario in MVP; defer to P1.
- **A-D2-06** WF-22 admin Slack notification on new user landing — user deferred; admin can use LIST in interim.
- **A-D4-05** WF-12 deactivation — user wants confirmation it's not used by P1/P2 paths first.
- **TC-1001** rebook Slack channel lifecycle — addressed structurally by WF-52 isNew flag, but full WF-45 rework deferred.
- **WF-51 enrichment** (blocks/attachments) — documented as text-only utility; future P2 work.

---

## Implementation Follow-up — Live Workflow Changes Needed

The pseudocode is now ahead of the live n8n workflows. The following live changes are required to match the revised pseudocode (recommend a separate build-workflow sprint):

| WF | Change | Priority |
|----|--------|----------|
| WF-00 | Add `WF-60` executeWorkflow node after Parse, with onError=continueRegularOutput | P0 |
| WF-02 | Add `user.status='payment_pending'` guard before PAYMENT_CONFIRM; add UNHANDLED → WF-51 admin alert; add `user IS NOT NULL` guards | P0 |
| WF-10 | Restrict user-targeted commands to consult-{phone}; allow LIST/STATS/HELP in chinmay-admin-commands | P0 |
| WF-11 | Add command aliases (bare REJECT, bare CLOSE, CLOSE CHAT CONSULT); standardise dispatch payload to camelCase | P0 |
| WF-21 | Accept wasOptedOut flag; prepend "Welcome back" if true | P0 |
| WF-22 | Change button title to "Payment Completed ✓"; ON CONFLICT DO UPDATE for opted_out re-engagement; branch on WF-52 success; admin-alert via WF-51 on WF-52 failure | P0 |
| WF-33 | Refactor admin Slack posts to use WF-51 (replace direct Slack node) | P0 |
| WF-34 | Add payment_submitted state guard + user-not-found path; refactor admin Slack to WF-51; change button title to "Payment Completed ✓" | P0 |
| WF-40 | Remove STOP intercept (Steps 2-5 in pseudocode terms — locate the equivalent in JSON); pure pass-through relay | P0 |
| WF-42 | Add user-not-found error path; post error to admin's channelName (not user.slack_channel_id) | P0 |
| WF-47 | Remove channel archive call (was at Step 7-8 in pseudocode terms) | P0 |
| WF-50 | Extend null-body guard to interactive/template; log silent drops to WF-60; carry consultationId through; extract interactive body text for log content | P0 |
| WF-52 | Add `isNew` flag to both return paths; structured `{success:false}` return for non-name_taken errors | P0 |
| WF-60 | Add TD-030 bot-echo filter + TD-034 whitespace guard for inbound; add user lookup by phone_number when userId missing | P0 |

---

## Verification

Each P0 TC's "Then" clause now traces cleanly through the revised pseudocode. Could a developer take these .pseudo files and build matching n8n workflows without ambiguity? **Yes** — for the 13 P0 TCs, all decision points are explicit, all sub-workflow calls are documented, all DB column references match the live schema (verified via `information_schema.columns` 2026-05-17).

**Ready to commit.** Coverage report, revised pseudocode, dependency-map, FunctionalTestCases.md, and CLAUDE.md changes should be pushed together as one P0 verification commit.
