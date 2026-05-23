# Smoke Test — WF-10 Centralized Validation Gate

- **Type:** smoke
- **Slug:** wf10-centralized-gate
- **Date:** 2026-05-23
- **Operator:** prasadmujumdar
- **Sprint:** inline-20260522-102910 / SP-03
- **Live WF-10:** active=true, 38 nodes, versionId `f9a50569-cfbb-40e3-968d-51bbe3376fa5`, updatedAt `2026-05-23T02:30:47.988Z`
- **Backup pre-change:** `archive/backups/wMh0oBRtJbvhLgOf-2026-05-23-12-14.json`

## Purpose

Validate the SP-03 WF-10 rebuild (28 → 38 nodes) end-to-end. The new gate centralizes:
- channel classification (admin vs user vs orphan)
- command kind (admin_wide / user_targeted / relay_text / free_text)
- phone match (typed vs channel-derived)
- state match (current user.status vs expected for command)
- dispatch routing
…all upstream of WF-11/33/34/41/42/46. Downstream guards in those workflows are now redundant (cleanup is the next sprint step, deliberately deferred until after this smoke).

## Design docs referenced

- `docs/pseudocode/WF-10.pseudo`
- `docs/artefacts/sprints/inline-20260522-102910/state.md` (SP-03 `implementation_note`)
- `docs/artefacts/sprints/inline-20260522-102910/handoffs/sp03-wf10-impl-landed.md`
- `CLAUDE.md` §"Design Rules" (DR-13 admin-command channel scope)

## Watch surface

- **n8n workflows:** WF-10 (wMh0oBRtJbvhLgOf), WF-11 (GoTYo0GS2y8qjjkw), WF-33 (NcHZedq9ycnAQ9SW), WF-34 (se82n3MUQ9xE5aEr), WF-41 (6PzJRZsF7k2d9hV7), WF-42 (fx70vqyJtRdF2DgR), WF-46 (?), WF-51 (wlZRK0YxnhP0b2RL)
- **Postgres tables:** chinmay_astro.users, payments, consultations, messages
- **Slack channels:** chinmay-admin-commands (C0A5B0ZE81E), consult-+61466927921 (C0B567A175W), consult-orphan-test (C0B5N87PRDL)
- **Latency threshold:** 5000 ms

## Baselines (cursors stored in .cursors/)

- exec-cursor: 1684
- time-cursor: 2026-05-23T03:15:47Z
- users: 1 row, last update 2026-05-22 12:02:52Z
- payments: 4 rows, last 2026-05-22 11:52:22Z
- consultations: 4 rows, last 2026-05-22 11:53:50Z
- messages: 48 rows, last 2026-05-22 22:50:30Z

## Starting user state

- **+61466927921 (usual test phone, "Abcs"):** status=consultation_active, slack_channel_id=C0B567A175W
- **+61491370732 (unrecorded edge-case phone):** NO records in users OR pending_users
- **consult-orphan-test (C0B5N87PRDL):** Slack channel exists with no users row mapping to it

## Scenario plan (ordered to minimize state churn)

Test phone for §1–§3 + §5 + §6 = **+61466927921** unless stated otherwise.

### Phase A — No state change required
1. **A1** Admin LIST in chinmay-admin-commands → WF-11 admin listing reply
2. **A2** Admin HELP in chinmay-admin-commands → WF-11 help text
3. **A3** Admin STATS in chinmay-admin-commands → WF-11 stats reply
4. **A4** "APPROVE PAYMENT" typed in chinmay-admin-commands → Wrong-Channel Alert (Admin)
5. **A5** "what's the time" free text in chinmay-admin-commands → Help Prompt
6. **A6** LIST typed in consult-+61466927921 → Wrong-Channel Alert (User)

### Phase B — Relay text (status=consultation_active)
7. **B1** Plain "Hello smoke test" in consult-+61466927921 → Phone Match bypass → State Match TRUE → relay_text → WF-41 → WA delivered to operator's phone

### Phase C — User-targeted rejections (still consultation_active)
8. **C1** "APPROVE PAYMENT" (no phone) in consult-+61466927921 → Phone-Absent Alert
9. **C2** "APPROVE PAYMENT +614999999999" in consult-+61466927921 → Phone-Mismatch Alert
10. **C3** "APPROVE PAYMENT +61466927921" in consult-+61466927921 (user is consultation_active, expected payment_submitted) → State-Wrong Alert

### Phase D — CLOSE happy + state-wrong relay
11. **D1** "CLOSE CHAT CONSULT +61466927921" in consult-+61466927921 → State Match TRUE (consultation_active==expected) → WF-11 → WF-42 → user.status → consultation_closed
12. **D2** Plain "after close ping" in consult-+61466927921 (now consultation_closed) → Relay State-Wrong Alert

### Phase E — APPROVE / REJECT happy (requires DB-reset to payment_submitted)
13. **E1** DB-reset +61466927921 to payment_submitted → "APPROVE PAYMENT +61466927921" in consult-+61466927921 → WF-11 → WF-33 → user.status=consultation_active, payment row updated
14. **E2** DB-reset to payment_submitted again → "REJECT PAYMENT +61466927921" → WF-11 → WF-34 → user.status=payment_pending, payment row updated

### Phase F — BLOCK / UNBLOCK happy
15. **F1** "BLOCK +61466927921" in consult-+61466927921 → WF-11 → WF-46 → user.status=blocked
16. **F2** "UNBLOCK +61466927921" (channel TBD per WF-11 unblock flow) → WF-11 → user.status returns to prior

### Phase G — Orphan channel (separate channel + unrecorded phone)
17. **G1** Operator types any admin command in consult-orphan-test (C0B5N87PRDL) → Orphan-Channel Alert posted to chinmay-admin-commands (re-verifies SP-11 Test E with new gate)

### Cleanup
- Restore +61466927921 to consultation_active for next session

## Test-data state risk

Phases D–F change DB state. After Phase E and F, the user row will be in a non-original state. The cleanup step at the end restores to consultation_active so subsequent sessions find the same starting point. If we pause mid-run, the resume should re-baseline state from the DB.

---

## Action log

### Action — 2026-05-23T03:18:47Z — Phase A (admin-channel + admin-wide-in-user)

Operator starting Phase A in this order:

| # | Channel | Operator types | Expected (per WF-10.pseudo) |
|---|---------|----------------|------------------------------|
| A1 | chinmay-admin-commands | `LIST` | Classify Admin → kind=admin_wide → Dispatch → WF-11 LIST handler → reply listing users |
| A2 | chinmay-admin-commands | `HELP` | Same path → WF-11 HELP handler → reply with help text |
| A3 | chinmay-admin-commands | `STATS` | Same path → WF-11 STATS handler → reply with stats |
| A4 | chinmay-admin-commands | `APPROVE PAYMENT` | Classify Admin → kind=wrong_channel_user_targeted → Build Wrong-Channel Alert (Admin) → WF-51 → reply: "is a user-targeted command…" |
| A5 | chinmay-admin-commands | `what's the time` | Classify Admin → kind=help_prompt → Build Help Prompt → WF-51 → reply: "🤖 Type `HELP` to see available commands." |
| A6 | consult-+61466927921 (C0B567A175W) | `LIST` | Classify User → kind=wrong_channel_admin_wide → Build Wrong-Channel Alert (User) → WF-51 → reply: "is an admin command. Please type it in the `chinmay-admin-commands` channel." |

**Expected n8n executions:** ~6 WF-10 + ~3 WF-11 (A1/A2/A3) + ~5 WF-51 calls (A4/A5/A6 + WF-11's own outbound replies). DB writes: only `messages` rows (inbound + outbound) via WF-60. No `users` updates.

Waiting for operator to complete Phase A and say "check".

### Tick — 2026-05-23T03:26:44Z — Phase A complete

**Trigger:** operator said "check" after typing A1–A6.

**New executions:** 33 (33 ok, 0 failed, 0 slow). Range: 1685–1717.

Execution shape per scenario (verified):

| # | WF-10 in | WF-11 | WF-51 (alert/reply) | WF-60 (in+out) | WF-10 echo |
|---|----------|-------|---------------------|----------------|------------|
| A1 LIST    | 1685 | 1686 ✅ | 1687 ✅ | 1688/1689 | 1690 |
| A2 HELP    | 1691 | 1692 ✅ | 1693 ✅ | 1694/1695 | 1696 |
| A3 STATS   | 1697 | 1698 ✅ | 1699 ✅ | 1700/1701 | 1702 |
| A4 APPROVE PAYMENT (wrong-chan)| 1703 | — (no WF-11) | 1704 ✅ | 1705/1706 | 1707 |
| A5 free text       | 1708 | — | 1709 ✅ | 1710/1711 | 1712 |
| A6 LIST in user-chan| 1713 | — | 1714 ✅ | 1715/1716 | 1717 |

A4/A5/A6 correctly bypass WF-11 (the alert paths terminate at WF-51, as designed). A1/A2/A3 correctly route through WF-11 (admin_wide kind dispatch). All 33 executions succeeded; latencies 7ms–1.7s, all well under threshold.

**DB deltas:**
- `users`: 0 changes (expected — no state transitions in Phase A)
- `payments`: 0
- `consultations`: 0
- `messages`: 2 (id 56 outbound A6 alert; id 57 inbound A6 `LIST`, both user_id=28 = "Abcs" / +61466927921, via channel C0B567A175W). A1–A5 not logged because chinmay-admin-commands has no user_id mapping and `messages.user_id` is NOT NULL — this is by-design schema behavior, not a defect.

**Slack verification (chinmay-admin-commands C0A5B0ZE81E):**
- A1 reply: "📋 *System Status* / Active Consultations: • Abcs (61466927921) - 15.4hrs" ✅
- A2 reply: "📖 *Available Commands*…" ✅ (content issue — see Issues found)
- A3 reply: "📈 *Today's Statistics* / Users: Total=1, Active=1, Pending=0, Blocked=0; Today's: Completed=0, Revenue=₹0" ✅
- A4 reply: "⚠️ `APPROVE` is a user-targeted command. Please type it inside the user's `consult-<phone>` channel." ✅ (exact match to expected wording)
- A5 reply: "🤖 Type `HELP` to see available commands." ✅ (exact match)

**Slack verification (consult-+61466927921 C0B567A175W):**
- A6 reply: "⚠️ `LIST` is an admin command. Please type it in the `chinmay-admin-commands` channel." ✅ (exact match)

**Cross-check vs expected:** 6/6 ✅. Wording on the 5 alerts matches the handoff scenario list verbatim.

**Issues found:**

- **BUG-01 [minor] — WF-11 HELP text does not indicate channel scope per command.** The HELP output lists commands without telling the admin which channel each command must be typed in. With DR-13 strictly enforcing channel scope at WF-10 (validated this tick by A4 + A6), the HELP text should make the channel requirement self-evident so admins don't accidentally trip the alerts. Proposed format per operator: `APPROVE PAYMENT <phone> - Approve payment and activate consultation [Must be sent in respective user channel 'consult-<phone>']` and `STATS - Show today's statistics [Must be sent in admin channel]`. Location: WF-11 (GoTYo0GS2y8qjjkw) HELP handler. Not blocking Phase B; will batch this into the Batch-2 cleanup PUTs (Task #3) along with the structural cleanups on WF-11/33/34/42, since WF-11 is already being touched there.

**Cursor update:**
- exec-cursor: 1684 → 1717
- time-cursor: 2026-05-23T03:15:47Z → 2026-05-23T03:26:44Z

### Action — 2026-05-23T03:28:00Z — Phase B (relay text happy)

Operator typed `sending a sample text` in consult-+61466927921 (C0B567A175W) with user.status=consultation_active. Expected: WF-10 classify → kind=relay_text → State Match TRUE → Dispatch → Build WF-41 Payload → WF-41 → WF-50 → WhatsApp delivered to user's phone +61466927921.

### Tick — 2026-05-23T03:29:28Z — Phase B complete

**Trigger:** operator said "ready, check".

**New executions:** 8 (8 ok, 0 failed). Range: 1718–1725.

| id | workflow | role | duration |
|----|----------|------|----------|
| 1718 | WF-10 (wMh0oBRtJbvhLgOf) | webhook entry — Slack inbound | 2.19s |
| 1719 | WF-41 (6PzJRZsF7k2d9hV7) | called by WF-10 dispatch (relay_text) | 1.48s |
| 1720 | WF-50 (BUVun38WEKb12zg9) | called by WF-41 to send WA | 1.42s |
| 1721, 1722 | WF-60 (6H75p935FpBVBQtV) | message logger (inbound + outbound) | 60ms each |
| 1723–1725 | WF-00 (JQu1MkK5vgtUCeNO) | WA inbound webhook — Meta delivery/read status callbacks | <30ms each |

**Routing shape correct:** WF-10 → WF-41 → WF-50 → Meta. No WF-11, no WF-33/34/42, no alert. State Match TRUE (consultation_active matches expected).

**DB deltas:**
- `users`/`payments`/`consultations`: 0 ✅
- `messages`: 2 — id 58 (outbound, message_type=text, "sending a sample text", user_id=28) = WA delivery via WF-50/WF-60; id 59 (inbound, message_type=slack_text, "sending a sample text", user_id=28) = Slack inbound via WF-60.

**Slack verification:** No bot reply expected in user channel (relay is silent on Slack side; WA is the only acknowledgement). ✅

**Cross-check vs expected:** 1/1 ✅. Routing exact; latency well under threshold; logger captured both directions; WA delivery confirmed by the 3 status callbacks on WF-00.

**Operator action requested:** confirm WhatsApp message "sending a sample text" was received on phone +61466927921. (Not blocking — the WF-00 callbacks already imply Meta delivered, and WF-50 returned success.)

**Cursor update:**
- exec-cursor: 1717 → 1725
- time-cursor: 2026-05-23T03:26:44Z → 2026-05-23T03:29:28Z

Operator confirmed WA delivery for B1.

### Action — 2026-05-23T03:30:00Z — Phase C (user-targeted rejections)

In consult-+61466927921 (C0B567A175W), user.status=consultation_active:
- **C1** `APPROVE PAYMENT` (no phone) → expect Phone-Absent Alert
- **C2** `APPROVE PAYMENT +614999999999` → expect Phone-Mismatch Alert
- **C3** `APPROVE PAYMENT +61466927921` → expect State-Wrong Alert (consultation_active ≠ payment_submitted)

### Tick — 2026-05-23T03:33:10Z — Phase C complete

**Trigger:** operator said "ready, check".

**New executions:** 15 (15 ok, 0 failed). Range: 1726–1740.

| # | WF-10 in | WF-51 alert | WF-60 (in+out) | WF-10 echo |
|---|----------|-------------|----------------|------------|
| C1 phone-absent | 1726 | 1727 ✅ | 1728/1729 | 1730 |
| C2 phone-mismatch | 1731 | 1732 ✅ | 1733/1734 | 1735 |
| C3 state-wrong | 1736 | 1737 ✅ | 1738/1739 | 1740 |

No WF-11, no WF-33 — all 3 correctly terminate at WF-51 alert path.

**DB deltas:**
- `users`/`payments`/`consultations`: 0 ✅
- `messages`: 6 new rows (ids 60–65), 3 inbound + 3 outbound, all user_id=28.

**Slack reply wording (consult-+61466927921):**
- C1: `⚠️ APPROVE PAYMENT needs the customer's phone number. Example: APPROVE PAYMENT 614914... No action taken.` ✅
- C2: `⚠️ APPROVE PAYMENT 614999999999 ignored — this channel belongs to 61466927921. Please re-check the phone you typed. No action taken.` ✅
- C3: `⚠️ APPROVE PAYMENT ignored — customer is currently in consultation_active, expected payment_submitted. No action taken.` ✅

**Phone-parser robustness verified:** Slack auto-linkifies typed phone numbers as `<tel:+614999999999|+614999999999>` markup. The inbound stored in `messages.content` is `APPROVE PAYMENT <tel:+614999999999|+614999999999>` but the alert correctly extracted `614999999999` (without `+`). WF-10's `Classify User Channel Message` Code node handles the tel: wrap properly.

**Cross-check vs expected:** 3/3 ✅. Routing exact; wording verbatim; no DB side-effects.

**Cursor update:**
- exec-cursor: 1725 → 1740
- time-cursor: 2026-05-23T03:29:28Z → 2026-05-23T03:33:10Z

### Action — 2026-05-23T03:34:00Z — Phase D (CLOSE happy + relay state-wrong)

Operator typed in consult-+61466927921 (C0B567A175W, user.status=consultation_active):
- **D1a** `CLOSE CHAT CONSULT +61466927921` (with +) — expect WF-10 → WF-11 → WF-42 → status flips to consultation_closed
- **D1b** `CLOSE CHAT CONSULT 61466927921` (no +, second attempt after first failed) — same expectation

D2 (relay state-wrong) deferred — D1 needs to succeed first to put user in consultation_closed.

### Tick — 2026-05-23T03:41:41Z — Phase D FAILED — critical bug found

**Trigger:** operator said "ready, check" after D1 failed twice.

**New executions:** 6 (0 ok, 6 errored). Range: 1741–1746.

- D1a chain: 1741 WF-10 error → 1742 WF-11 error → 1743 WF-51 error
- D1b chain: 1744 WF-10 error → 1745 WF-11 error → 1746 WF-51 error

All three nodes in each chain bubbled the same Slack `invalid_arguments` error.

**Surface error:** `Slack error response: "invalid_arguments"` from WF-51's `Post to Slack` node, after WF-11 reached `Unknown Command Response`.

**Root cause (CRITICAL):** WF-10 Dispatch → Call WF-11 Command Parser sends the wrong payload.

Inspection of exec 1741 confirms WF-10's `Classify User Channel Message` Code node correctly produced:
```
{ messageText: "CLOSE CHAT CONSULT <tel:+61466927921|+61466927921>",
  kind: "user_targeted_cmd",
  commandKeyword: "CLOSE_CONSULTATION",
  commandHint: "CLOSE CHAT CONSULT",
  typedPhone: "61466927921",
  channelDerivedPhone: "61466927921",
  phoneStatus: "ok",
  expectedState: "consultation_active",
  adminUserId, channelId, channelName }
```

But WF-11's `When Executed by Another Workflow` actually received:
```
{ id: 28, status: "consultation_active", name: "Abcs", phone_number: "61466927921" }
```

That's the **Load User Status postgres SELECT** output (4 cols), NOT the classified payload. The postgres node's output replaced the line data; subsequent nodes (`Dispatch by Kind` → `Call WF-11`) passed the postgres row downstream. WF-11's `Parse Command` Code node sees `(input.messageText || '').trim()` = empty string → `commandType = 'UNKNOWN'` → `Unknown Command Response` branch → WF-51 `Post to Slack` invoked with blank `channelId`/`text` → Slack rejects with `invalid_arguments`.

**Why Phase A (LIST/HELP/STATS) worked:** Admin commands route `Classify Admin Channel Message → Route by Kind (Admin) → Call WF-11`. That path bypasses `Load User Status` entirely — the classified payload stays on the line.

**Why pre-SP-03 worked:** Old WF-10 shape had `Detect Command - User Channel` (Code) → `Command - User Channel ?` (IF) before user lookup; the executeWorkflow call to WF-11 happened on the line that still carried `messageText`. The SP-03 rebuild centralized the gate but introduced a postgres lookup between Classify and Dispatch without re-injecting the classified fields.

**Impact (blocking SP-03 close):** All user-targeted commands through WF-11 are broken:
- D1 CLOSE (observed)
- E1 APPROVE PAYMENT (will fail)
- E2 REJECT PAYMENT (will fail)
- F1 BLOCK (will fail)
- F2 UNBLOCK (will fail)

Phase G (orphan channel) unaffected — orphan path doesn't go through Dispatch.

**Issues found:**

- **BUG-02 [critical] — WF-10 Dispatch loses classified-payload fields after Load User Status.** Postgres node replaces line data with the user row; downstream Call WF-11 passes the user row to WF-11 instead of the classified payload (messageText/commandKeyword/adminUserId/channelId/channelName). Fix: insert a Set v3.4 node with `includeOtherFields=true` after Load User Status (before Dispatch by Kind) that re-adds the classified fields by referencing `$('Classify User Channel Message').item.json.*`. This is the same pattern as the SP-11 LESSON LEARNED ([[feedback_set_v34_drops]]) — Set v3.4 with includeOtherFields=true is the canonical merge step.
- **BUG-03 [major] — WF-11 Unknown Command Response → WF-51 Slack post with blank arguments.** When WF-11 hits the UNKNOWN switch branch, it forwards to WF-51 with empty `channelId`/`text`, triggering Slack `invalid_arguments`. Defensive: WF-11 should either short-circuit on missing input (no-op + admin alert) or pre-validate before forwarding. Fixing BUG-02 prevents the trigger, but the brittle downstream fail is still a sibling-regression issue worth flagging. Defer to Batch-2 cleanup PUTs (already touching WF-11 for BUG-01 HELP text).

**Operator note (`+` handling):** D1b (no `+`) failed identically to D1a. The `+` was not the cause. WF-10 Classify already strips `+` from typedPhone (output shows `typedPhone: "61466927921"`). WF-11 Parse Command's regex `/^\+?\d{10,15}$/` also tolerates `+`. The bug is the contract drop, independent of phone formatting.

**Decision:** Halt smoke. Invoke `build-workflow` to fix BUG-02 in WF-10. Resume Phase D fresh on the fixed live workflow. BUG-03 + BUG-01 batched into the post-smoke Batch-2 cleanup PUTs (Task #3).

**Cursor update:**
- exec-cursor: 1740 → 1746
- time-cursor: 2026-05-23T03:33:10Z → 2026-05-23T03:41:41Z

### Fix — 2026-05-23T03:45Z — BUG-02 surgical fix (WF-10 only)

Added `Build WF-11 Payload` Set v3.4 between Dispatch by Kind out[0] and Call WF-11 Command Parser. 38 → 39 nodes. Backup: `wMh0oBRtJbvhLgOf-2026-05-23-13-44.json`. versionId: `f3580e26-...`.

### Tick — 2026-05-23T03:48Z — Phase D retry #1 — FAILED, 2nd contract drift exposed

D1a (with `+`) + D1b (no `+`) — exec 1747-1749 — both errored at WF-42 `Load User by Phone`: "Query Parameters must be a string of comma-separated values or an array of values". Root: WF-11 Parse Command's regex couldn't tokenize Slack auto-linkified `<tel:+xxx|yyy>` phones → phoneNumber=null → WF-42 SQL queryReplacement undefined. 3rd contract-drift surface in this session. Halted again.

### Fix — 2026-05-23T04:00–04:09Z — BUG-02 SYSTEMIC fix (pseudo-first, WF-10 + WF-11)

Per [[feedback_systemic_before_individual]]: 3 drifts in one session = systemic. Revised pseudos first (user-approved):

- WF-10.pseudo: Step 10 + 12 added commandType for admin-wide; Step 15 renamed commandKeyword→commandType, added reason extraction, stripped Slack mrkdwn (<tel:..|..>, <http..|..>); Step 22 widened payload to 7 fields.
- WF-11.pseudo: trust-mode strengthened; Step 2 (Parse Command) deleted; targetPhone→phoneNumber.

Implementation:

| WF | Change | Backup | versionId |
|----|--------|--------|-----------|
| WF-10 | Classify Admin Code rewrite + commandType extraction; Classify User Code rewrite (rename + reason + strip mrkdwn); Build WF-11 Payload widened 4→7; new Build WF-11 Payload (Admin) Set; rewired Route by Kind (Admin) out[0]. 39 → 40 nodes. | `wMh0oBRtJbvhLgOf-2026-05-23-13-56.json` | `743003cc-...` |
| WF-11 (initial) | Removed Parse Command + Blocked User Found? IF + No Blocked User Found exec; rewired When Executed→Switch + Lookup Blocked→Unblock; replaced `$('Parse Command').item.json.X` → `$json.X` (targetPhone→phoneNumber). 23 → 20 nodes. Bundled Task #3's WF-11 cleanup. | `GoTYo0GS2y8qjjkw-2026-05-23-13-56.json` | `0412e162-...` |

### Tick — 2026-05-23T04:08Z — Phase D retry #2 — PARTIAL SUCCESS

D1 (`CLOSE CHAT CONSULT +61466927921`) — exec 1750-1761:

**Functional path: ✅ SUCCESS.**
- DB: `users.status` for 61466927921 flipped to `consultation_closed`.
- WhatsApp: feedback prompt delivered (WF-50 1753 ok; 3 WA delivery callbacks 1759-1761).
- Slack: "✅ Consultation closed for Abcs (61466927921). Feedback prompt sent via WhatsApp; channel kept open for future rebook." landed in C0B567A175W (via WF-42's internal confirmation post — WF-51 exec 1755 ok).

**3 stacked errors (NON-functional — all secondary confirmation posts):**
- 1750 WF-10 (bubbled) — Slack `invalid_arguments`
- 1751 WF-11 (Confirm Consultation Closure) — `invalid_arguments`, because predecessor `Call WF-42 Consultation Closer` returns `{logged, logId}` payload (not the trigger contract), so `$json.channelId` and `$json.phoneNumber` were undefined → empty WF-51 args
- 1757 WF-51 (bubbled child of 1751)

**Root:** my v1 systemic rename of `$('Parse Command').item.json.X` → `$json.X` was correct for nodes that sit directly after the Switch (passthrough preserves trigger data), but BREAKS for nodes that sit downstream of an executeWorkflow or postgres node (their output replaces the line data with the sub-workflow's return shape). Affected nodes:
- Confirm Consultation Closure (after Call WF-42)
- Confirm User Blocked (after Call WF-46)
- Confirm User Unblocked (after Unblock User postgres)
- Unblock User SQL (after Lookup Blocked User postgres)
- Send List/Stats/Help To Admin (after Format List/Stats/Prepare HELP Code nodes that replace line data)

### Fix — 2026-05-23T04:09Z — WF-11 v2 patch — cross-node trigger refs

Patched 7 nodes to use `$('When Executed by Another Workflow').item.json.X` for WF-10-contract fields (channelId, phoneNumber, reason). Code-produced fields ($json.message in Send List/Stats/Help) kept as-is. Switch still uses $json.commandType (works because Switch is first node after trigger). 20 nodes (no count change). Backup: `GoTYo0GS2y8qjjkw-2026-05-23-14-09.json`. versionId: `75fe8b7d-...`. Lint clean. WF-11.md regenerated FRESH.

**Status after v2 fix:** Code-fixed but unverified end-to-end. D1 happy path can't be re-run without restoring user state to consultation_active. Either:
- (a) DB-reset to consultation_active and re-test D1 cleanly, OR
- (b) Trust code review + proceed to D2 (relay state-wrong, works on current consultation_closed state) and verify the fix incidentally as D2+E+F exercise the same WF-11 nodes.

**Issues found:**
- **BUG-04 [resolved by v2 fix above] — series-after-sub-workflow contract drop in WF-11.** Caused by my v1 systemic rename being too eager. Cross-node refs to trigger node fixes it.

**Adjacent observation — WF-42 has its own "Consultation closed" confirmation:** the user-visible Slack message came from WF-42, NOT from WF-11's `Confirm Consultation Closure` (which errored). WF-11's Confirm Consultation Closure would post a SECOND confirmation if it succeeded. This is duplicate-confirmation work that Task #3's WF-42 cleanup should address (likely remove WF-42's own confirmation post and let WF-11 own the message, OR vice-versa). Log to followups for sprint planning.

**Cursor update:**
- exec-cursor: 1746 → 1761
- time-cursor: 2026-05-23T03:41:41Z → 2026-05-23T04:09:38Z
- **DB state:** users.phone_number=61466927921 is now `consultation_closed` (was consultation_active at smoke start)

### State reset — 2026-05-23T04:11Z

UPDATE chinmay_astro.users SET status='consultation_active' WHERE phone_number='61466927921'. Returned 1 row. Resumes D1 retry cleanly.

### Tick — 2026-05-23T04:13Z — Phase D retry #3 — D1 ✅ FULL SUCCESS

D1 (`CLOSE CHAT CONSULT 61466927921`) — exec 1762-1776, **all 15 executions success**, no errors.

| id | workflow | role |
|----|----------|------|
| 1762 | WF-10 | webhook entry |
| 1763 | WF-11 | Switch on commandType=CLOSE_CONSULTATION → Call WF-42 → Confirm Consultation Closure |
| 1764 | WF-42 | Consultation Closer (DB update + WA feedback) |
| 1765 | WF-50 | WhatsApp feedback prompt sent |
| 1766 | WF-60 | log inbound |
| 1767 | WF-51 | WF-42's "Consultation closed for Abcs..." confirmation Slack post |
| 1768 | WF-60 | log outbound (WF-42's confirmation) |
| 1769 | WF-51 | WF-11's "Consultation closed for 61466927921" confirmation Slack post (v2-fixed — NOW WORKING) |
| 1770 | WF-60 | log outbound (WF-11's confirmation) |
| 1771, 1775, 1776 | WF-00 | WA delivery callbacks |
| 1772 | WF-60 | misc log |
| 1773, 1774 | WF-10 | echo of bot posts (auto-rejected by bot loop guard) |

**Cross-check:** ✅ all 4 expectations met — n8n routing (WF-10→WF-11→WF-42→WF-50/WF-51), DB transition (consultation_active→consultation_closed), WhatsApp feedback delivered (operator-confirmable), Slack confirmation visible.

**D1 verifies the v2 fix end-to-end.** BUG-04 resolved.

**BUG-05 [minor] — duplicate "Consultation closed" Slack confirmation.** Two near-simultaneous Slack posts hit the consult channel (ts 1779509549 and 1779509550 = 600ms apart):
- WF-42's own confirmation (richer): "✅ Consultation closed for Abcs (61466927921). Feedback prompt sent via WhatsApp; channel kept open for future rebook."
- WF-11's `Confirm Consultation Closure` (minimal): "✅ Consultation closed for 61466927921"

Pre-SP-03, WF-11's confirmation may have been silently failing (the WF-42 contract via passthrough never gave it valid input). Post-SP-03 + v2 fix it now works — surfacing the duplicate. Task #3's WF-42 cleanup PUT should resolve: keep ONE confirmation (recommend WF-42's richer text since it includes name + WA send confirmation context). Could also remove WF-11's `Confirm Consultation Closure` node and rewire `Call WF-42 → End` in WF-11's CLOSE branch.

**Cursor update:**
- exec-cursor: 1761 → 1776
- time-cursor: 2026-05-23T04:09:38Z → 2026-05-23T04:13:00Z
- **DB state:** users.phone_number=61466927921 = `consultation_closed`

### Tick — 2026-05-23T04:15Z — Phase D2 ✅ PASS

Operator typed plain "Testing after closure" in consult-+61466927921 (status=consultation_closed). Expected: relay text → State Match? FALSE → Build Wrong-State Alert (relay variant) → WF-51 → user-channel alert.

5 executions all success: 1777 WF-10 → 1778 WF-51 → 1779/1780 WF-60 → 1781 WF-10 echo. No WF-11, no WF-41 (correct — alert path terminates).

Slack alert: `⚠️ Message not relayed — customer is currently in consultation_closed, expected consultation_active. WhatsApp send skipped.` — exact match to handoff spec ✅.

**Cross-check:** 1/1 ✅.

**Cursor update:**
- exec-cursor: 1776 → 1781

---

## Session resumed — 2026-05-23T05:42Z

Pre-Phase-E audit (handoff prompt step-back review) executed:
1. GitHub commit/push status — ✅ `91c0975` + `1ca15fe` on origin/main.
2. WF-10/WF-11 pseudo ↔ live alignment — ✅ both .md frontmatter matches live (WF-10 40 nodes / 04:03:23, WF-11 19 nodes / 04:21:20). `assert-md-fresh` clean.
3. Router-confirmation anti-pattern audit (BUG-05 siblings) — found 1: **WF-11 `Confirm User Blocked` duplicated WF-46's admin Slack post**. Same single-owner shape as the CLOSE dedup. Fix landed in commit `2eb46c2`:
   - WF-11: removed `Confirm User Blocked` (19 → 18 nodes); BLOCK branch terminates at `Call WF-46`.
   - WF-46: `Prepare WF-51 Payload (Notify Admin Blocked)` jsCode now includes caller's `reason` (falls back to 'Not provided').
   - Both pseudos revised; WF-46.pseudo also cleaned up FU-1 channel-archive drift from 2026-05-17.
   - Followup logged: UNBLOCK-extract design-debt (defer — keep inline for now).
   - Pushed to origin/main.

All other router/dispatcher workflows clean: WF-10 (WF-51 calls are gate-rejection), WF-01/WF-02 (anomaly/UNHANDLED dead-ends), WF-20 (HELP inline-handler), WF-25 (delegates BLOCK without duplicating).

### Tick — 2026-05-23T05:49–05:58Z — Phase E1 ✅ PASS (3 attempts; 2 findings)

**Attempt 1 (execs 1782–1784) — ERROR.**
- DB reset (UTC 05:48:35Z): `UPDATE users SET status='payment_submitted' WHERE phone_number='61466927921'` — set, but no fresh `pending_verification` payments row inserted (all 4 prior payment rows already `verified` from earlier smoke runs in this session).
- Operator typed `APPROVE PAYMENT 61466927921` in consult-+61466927921 (C0B567A175W).
- WF-10 (1782) → WF-11 (1783) → WF-33 (1784) — all `error`.
- Failure node: WF-33 `Create Consultation Record`. Postgres error: `there is no parameter $2`.
- Root cause: WF-33 SQL uses `$1, $2` placeholders for `(user_id, payment_id)`. `$2` is sourced from `$('Update Payment Status').item.json.id` — but Update Payment Status's WHERE clause (`user_id=$2 AND status='pending_verification'`) matched 0 rows. RETURNING returned no rows; n8n Postgres v2 returns `{success: true}` for zero-row mutations → `.id` undefined → $2 unbound.

**Adjacent finding #1 — test-data setup gap:** smoke reset script must include a fresh `pending_verification` payments INSERT, not just a `users.status` UPDATE. Logged.

**Adjacent finding #2 — WF-33 lacks transactional integrity (P1, post-MVP):** in the failed run, `lastRunNodes` order was Extract → Load User → User in Correct State? → **Update User Status (FIRED, flipped users → consultation_active)** → Update Payment Status (0 rows) → Create Consultation Record (errored). Result: user stranded in `consultation_active` with no consultation row and payment still `pending_verification`. WF-33 should be transactional (BEGIN/COMMIT, or reorder so user.status only flips after the consultations INSERT succeeds). Logged to followups; operator decision: business logic is OK (admin's command is the authority on payment-received), but technical atomicity is required for crucial workflows like payment approval — track as post-MVP work.

**Setup fix between attempts:** inserted fresh `pending_verification` payment row id=14 (₹500 UPI).

**Attempt 2 (execs 1785–1789) — REJECTED BY GATE (expected behavior).**
- After attempt 1's partial-fail, users.status was stranded at `consultation_active`.
- Operator typed `APPROVE PAYMENT 61466927921` again.
- WF-10 (1785) classified command → State Match? FALSE (current=consultation_active, expected=payment_submitted) → Wrong-State Alert via WF-51 (1786) → WF-60 logs (1787/88) → WF-10 echo (1789). No WF-11, no WF-33 — gate correctly short-circuited. Confirms WF-10's centralized gate works for the wrong-state case on an APPROVE command (extends Phase C coverage).

**Setup fix between attempts:** `UPDATE users SET status='payment_submitted'` (payment 14 still pending_verification).

**Attempt 3 (execs 1790–1801) — SUCCESS.**
- Operator typed `APPROVE PAYMENT 61466927921` once more.
- 12 chained executions all `success`: WF-10 (1790) → WF-11 (1791) → WF-33 (1792) → WF-50 (1793, WA to user) → WF-60 (1794) → WF-51 (1795, admin Slack confirmation) → WF-60 (1796/97) → WF-00 (1798/1800/1801, WhatsApp delivery callbacks) → WF-10 echo (1799).
- DB end-state: users.status=`consultation_active` (updated_at 05:58:09.842Z); payments id=14 = `verified` by C0B567A175W; consultations id=13 NEW row with payment_id=14, status=`active`, started_at=05:58:09.836Z.
- Operator confirmed: received WA notification "consultation is active".

**BUG-05 sibling check for APPROVE — CLEAN.** Only ONE WF-51 execution fired (1795). WF-33 owns the admin confirmation; WF-11 has no `Confirm Payment Approved` node. Confirms pre-audit finding that the BUG-05 pattern was BLOCK-only.

**Cross-check:** 1/1 ✅.

**Cursor update:**
- exec-cursor: 1781 → 1801
- time-cursor: 2026-05-23T04:15:14Z → 2026-05-23T05:58:18Z
- **DB state:** users.phone_number=61466927921 = `consultation_active`, payments id=14=verified, consultations id=13=active

### Tick — 2026-05-23T06:06–06:24Z — Phase E2 ✅ PASS (3 attempts; 2 bugs found + fixed mid-smoke)

**Attempt 1 (execs 1802–1813) — workflow-level SUCCESS but feature-completeness BUG surfaced.**
- DB reset (06:05:22Z): users → `payment_submitted`; INSERT fresh `pending_verification` payment id=15.
- Operator typed `REJECT PAYMENT 61466927921 Test rejection reason - retry payment` in consult-+61466927921.
- 12 executions all `success`: WF-10 (1802) → WF-11 (1803) → WF-34 (1804) → WF-50 (1805, WA) → WF-60 (1806) → WF-51 (1807, admin Slack) → WF-60 (1808/09) → WF-00 callbacks.
- users.status → `payment_pending` ✓; payments id=15 → `rejected` ✓.
- **Single WF-51 fired (1807) — BUG-05 sibling check CLEAN for REJECT.** ✓

**Feature bug surfaced (BUG-06):** Admin's typed reason (`"Test rejection reason - retry payment"`) was silently lost in three layers:
- DB `rejection_reason` stored `"Payment not verified"` (hardcoded fallback)
- Admin Slack: generic `"User has been asked to retry with correct payment details."` (no reason)
- WA to user: generic (per pseudo — OK)

Trace:
- WF-10 classifier correctly extracted `reason: "Test rejection reason - retry payment"` and emitted it in Build WF-11 Payload (verified via exec 1802 runData).
- WF-11 passthrough forwarded `reason` to WF-34 (verified via exec 1804 trigger input).
- **WF-34 `Update Payment Record` queryReplacement read `$json.rejectionReason` — field-name mismatch with upstream (`reason`).** Pre-rename, COALESCE in SQL fell back to literal.
- **WF-34 `Prepare WF-51 Payload (Notify Admin Rejected)` jsCode emitted a static text without referencing any reason field** — wording drift from pseudo Step 9, introduced during 2026-05-18 ICF-007 Set-node insertion.
- WF-34.pseudo Step 5 + Step 9 specified `rejectionReason` — design drift from WF-10/WF-46 convention which uses `reason`.

Operator decision (mid-smoke): fix A (field-name drift + DB persistence) + fix B (Slack message wording drift) immediately. Keep WA body generic for MVP; surface a post-MVP followup tied to Razorpay integration.

**Fix A+B applied:**
- WF-34.pseudo: renamed `rejectionReason` → `reason` (Inputs, Step 1, Step 5, Step 9); added Notes for the rename + WA-generic-by-design rationale + Razorpay post-MVP trigger.
- WF-34 `Update Payment Record` queryReplacement: `$json.rejectionReason` → `$json.reason`.
- WF-34 `Prepare WF-51 Payload (Notify Admin Rejected)` jsCode: rewritten to read trigger's `reason` and emit pseudo Step 9 text format.
- Backup: `archive/backups/se82n3MUQ9xE5aEr-2026-05-23-16-19.json`.

**Attempt 2 (execs 1814–1825) — Slack PASS, DB still BUG.**
- DB reset; payments id=16.
- Operator re-typed same command.
- 12 executions all success. Admin Slack rendered `❌ Payment rejected for Abcs (+61466927921). Reason: Test rejection reason - retry payment. User notified to retry payment.` ✓
- DB `payments.id=16.rejection_reason` = `"Payment not verified"` ✗ — fallback again.

Root cause analysis: WF-34 `Update Payment Record`'s upstream is `Load User by Phone` (postgres). Postgres node REPLACES line data with the users-row shape; trigger's `reason` field is lost. `$json.reason` is undefined. This is the same series-after-sub-workflow contract drop pattern documented in last session's handoff plugin candidate (n). The Code node's jsCode worked because it explicitly used `$('When Executed by Another Workflow').first().json.reason` cross-node ref; the queryReplacement did not.

**Fix C applied:**
- WF-34 `Update Payment Record` queryReplacement: `$json.reason` → `$('When Executed by Another Workflow').item.json.reason`. Cross-node ref preserves trigger field through postgres boundary.

**Attempt 3 (execs ≥1826) — full PASS.**
- DB reset; payments id=17.
- Operator re-typed.
- DB `payments.id=17.rejection_reason` = `"Test rejection reason - retry payment"` ✓
- Admin Slack: same correct format as Attempt 2 ✓
- WA to user: generic per design ✓
- users.status → `payment_pending` ✓

**Cross-check:** 1/1 ✅.

**Cursor update:**
- exec-cursor: 1801 → 1837
- time-cursor: 2026-05-23T05:58:18Z → 2026-05-23T06:24:10Z
- **DB state:** users.phone_number=61466927921 = `payment_pending`, payments id=17=rejected with admin-typed reason

### Tick — 2026-05-23T06:38Z — Phase F1 ✅ PASS (1 attempt)

Operator typed `BLOCK 61466927921 spam test` in consult-+61466927921. Pre-F1: users.status=payment_pending; BLOCK works from any user state (no expectedState guard in WF-10 for BLOCK).

7 executions all success: WF-10 (1838) → WF-11 (1839) → WF-46 (1840) → WF-51 (1841) → WF-60 (1842/43) → WF-10 echo (1844).

**Single WF-51 fired (1841) — BUG-05 BLOCK sibling fix verified end-to-end.** ✓ This was the morning's whole-point fix (`2eb46c2`): removed WF-11's `Confirm User Blocked` so WF-46 becomes single owner of the post-block Slack confirmation.

Slack text exact match to pseudo + this morning's WF-46 fix:
`🚫 User blocked: Abcs (61466927921). Reason: spam test. Status set to 'blocked'.`

DB state: users.status → `blocked`, blocked_at set ✓. `blocked_reason` DB column = `"Blocked by admin"` (hardcoded — pre-existing drift documented today in WF-46.pseudo as TD candidate; not in scope of F1).

**Cross-check:** 1/1 ✅.

**Cursor update:**
- exec-cursor: 1837 → 1844
- time-cursor: ~2026-05-23T06:24:10Z → 2026-05-23T06:38:28Z
- **DB state:** users.phone_number=61466927921 = `blocked`

### Tick — 2026-05-23T06:41–06:46Z — Phase F2 ✅ PASS (2 attempts; 1 bug surfaced + fixed)

**Attempt 1 (execs 1845–1850) — DB transition OK, Slack message landed in WRONG channel.**

Operator typed `UNBLOCK 61466927921` in consult-+61466927921. 6 executions all success; users.status flipped `blocked` → `consultation_closed`; WF-51 (1847) reported `ok=true`.

But operator did not see the confirmation in the consult channel. Investigation: WF-51's Post to Slack node posted to `C0A5B0ZE81E` (chinmay-admin-commands), not `C0B567A175W` (consult-+61466927921). Trace back: WF-11's `Confirm User Unblocked` executeWorkflow node had `workflowInputs.value.channelId` hardcoded to the literal `"C0A5B0ZE81E"`. Violated WF-11.pseudo Step 19 ("Post to input channelId") and DR-13 (user-targeted commands respond in user channel).

**Root cause:** 2026-05-23 SP-03 v2 patch updated `Confirm User Unblocked`'s phoneNumber refs to cross-node refs but missed the channelId. Audit gap — fixed today as BUG-07 (audit of remaining hardcoded channelIds across all 5 WF-11 → WF-51 callers found only this one).

**Fix (BUG-07) applied — 1 partial-update on WF-11:**
- `Confirm User Unblocked` workflowInputs.value.channelId: literal `"C0A5B0ZE81E"` → `={{ $('When Executed by Another Workflow').item.json.channelId }}`.
- 4 other WF-11 → WF-51 callers (`Send List To Admin`, `Send Stats To Admin`, `Send Help To Admin`, `Unknown Command Response`) audited — all already use cross-node refs to trigger or `$json.channelId` (trigger-after-Switch). Clean.
- Backup: `archive/backups/GoTYo0GS2y8qjjkw-2026-05-23-16-44.json`.

**Attempt 2 (execs 1851–1856) — full PASS.**

DB reset (users.status `consultation_closed` → `blocked` via direct SQL). Operator re-typed `UNBLOCK 61466927921`. 6 executions all success. WF-51 trigger payload now had `channelId: "C0B567A175W"` (consult channel) ✓. Slack post landed in consult-+61466927921 (operator visually confirmed). users.status `blocked` → `consultation_closed` ✓.

Slack text exact: `✅ User Abcs (61466927921) has been unblocked. Status is now consultation_closed. They can REBOOK when ready.`

**Cross-check:** 1/1 ✅.

**Cursor update:**
- exec-cursor: 1844 → 1856
- time-cursor: 2026-05-23T06:38:28Z → 2026-05-23T06:46:04Z
- **DB state:** users.phone_number=61466927921 = `consultation_closed`

### Tick — 2026-05-23T06:53Z — Phase G ✅ PASS (1 attempt)

Operator typed `APPROVE PAYMENT 99999999999` in **consult-orphan-test** (C0B5N87PRDL). Expected: WF-10 `User Row Exists?` FALSE → Build Orphan Channel Alert → WF-51 to admin channel.

WF-10 exec 1875 path (all `success`):
Webhook → Extract Required Fields (channel_id=C0B5N87PRDL, text="APPROVE PAYMENT 99999999999") → Event Callback Vs URL Verification → Human Vs Bot Message? → Admin Vs User Channel? (user channel — `consult-*` prefix) → Classify User Channel Message → Find Channel → Merge Message n Channel → Load User Status → **User Row Exists? FALSE branch** → Build Orphan Channel Alert → Call WF-51 (Orphan Channel Alert) → Call WF-60 Message Logger → Respond 200 OK.

**Gate short-circuit confirmed:** no WF-11/WF-33/WF-46 invocation — gate stops at the orphan check. ✓

Alert text exact:
`⚠️ Slack channel C0B5N87PRDL (consult-orphan-test) has no matching customer. Admin typed: "APPROVE PAYMENT 99999999999". This channel may have been created without a customer, or the customer was removed. Please check.`

Posted to: `C0A5B0ZE81E` (chinmay-admin-commands) ✓. Operator visually confirmed.

No DB writes. No user state changes (no user row exists for `99999999999`). Re-verifies SP-11 Test E under the new SP-03 centralized gate code path.

**Cross-check:** 1/1 ✅.

**Cursor update:**
- exec-cursor: 1856 → 1875 (1879 is bot-message echo, filtered)
- time-cursor: 2026-05-23T06:46:04Z → 2026-05-23T06:53:46Z

---

## Smoke complete — 2026-05-23T06:53Z

**All 10 phases pass.** Final tally:

| Phase | Description | Attempts | Bugs surfaced |
|-------|-------------|----------|---------------|
| A | Admin channel × 6 | 1 | — |
| B | Relay text happy | 1 | — |
| C | User-targeted rejections × 3 | 1 | — |
| D1 | CLOSE consultation happy | 4 | BUG-05 CLOSE (fixed prior session) + series-after-sub-workflow contract drop (plugin candidate (n)) |
| D2 | Relay wrong-state on consultation_closed | 1 | — |
| E1 | APPROVE PAYMENT happy | 3 | WF-33 atomic-execution (post-MVP P1; not blocking) |
| E2 | REJECT PAYMENT happy | 3 | **BUG-06** WF-34 admin reason silent drop — fixed mid-smoke (commit `53b95fd`) |
| F1 | BLOCK happy | 1 | Verified BUG-05 BLOCK sibling fix from `2eb46c2` — single Slack ✓ |
| F2 | UNBLOCK happy | 2 | **BUG-07** WF-11 Confirm User Unblocked hardcoded admin channelId — fixed mid-smoke (commit `e7b0d78`) |
| G | Orphan channel | 1 | — |

**Commits landed this smoke session:**
- `91c0975` (prior) — SP-03 systemic fix + smoke partial 12/17 + BUG-05 deduplication
- `1ca15fe` (prior) — handoff
- `2eb46c2` — BUG-05 BLOCK sibling fix + WF-46.pseudo drift cleanup
- `53b95fd` — BUG-06 WF-34 admin reason propagation
- `e7b0d78` — BUG-07 WF-11 unblock channelId fix + F1/F2 ticks
- (this commit) — Phase G tick + smoke-complete summary

**Followups logged in `docs/artefacts/sprints/inline-20260522-102910/followups.md`:**
- UNBLOCK-extract design-debt (deferred; keep inline)
- POST-MVP P1: WF-33 atomic-execution (BEGIN/COMMIT or reorder pattern) — operator-confirmed crucial-before-public-launch
- Methodology: smoke-test setup script must reset linked tables (payments INSERT etc.)
- POST-MVP: WA-body rejection reason gated on Razorpay integration

**Remaining SP-03 work (NOT in scope of this smoke session):**
- **Task #3** — downstream surgical-structural cleanups on WF-33 + WF-34 + WF-42 (remove trust-mode-redundant IFs + orphan false-branch nodes). Scope locked in `state.md` L63.
- **Task #4** — SP-03 close + Batch 2 post-batch regression.
- Restore +61466927921 to `consultation_active` (currently `consultation_closed` — leftover from F2). Can happen as part of Task #4 or Task #3 setup.




