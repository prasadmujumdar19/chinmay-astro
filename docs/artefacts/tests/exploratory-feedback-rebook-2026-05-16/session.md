# Exploratory Test — Feedback + Rebook validation

**Date:** 2026-05-16 (evening)
**Operator:** prasadmujumdar
**Test phone:** 61466927921
**Test type:** exploratory
**Prior session (not mixed in):** `.methodology/test-exploratory-pre-smoke-test-2026-05-16/`

## Design docs referenced
- docs/superpowers/FunctionalTestCases.md (TC-0501–0508, TC-0504, TC-0505, TC-1001)
- docs/reference/user_journey_map.html (J-15, J-16, J-17, J-20)
- docs/workflow-registry.md (WF-43, WF-44, WF-45, WF-25, WF-50, WF-52)

## Watch surface
- n8n executions: all active workflows
- Postgres tables: chinmay_astro.users, chinmay_astro.admin_actions, chinmay_astro.message_log
- Slack channels: C0B3SA9JALX (consult-61466927921), C0A5B0ZE81E (chinmay-admin-commands)
- Latency threshold: 5000 ms

## Baselines
- exec-cursor: 1076
- time-cursor: 2026-05-16T22:15:40Z
- DB user state (pre-test): status=consultation_closed, stage=null, feedback=null, slack_channel_id=C0B3SA9JALX, updated_at=2026-05-16T07:01:57.531Z

## Carried-over findings from prior session (will be confirmed/extended here, fixed together at end)
- **BUG-A · WF-43 TC-0501 (button "Provide Feedback"):** Branch sends WA prompt but does not write `stage='awaiting_feedback'` to chinmay_astro.users. Verified via exec 1065 node trace: `Is Button Reply? → Is Rebook Button? → Prompt for Feedback → Send Feedback Prompt via WF-50` — no UPDATE node.
- **BUG-B · WF-43 TC-0502 (free-form feedback text):** Routed to `Gemini General Response` instead of WF-44. HTTP node fails with `JSON parameter needs to be valid JSON` because `{{ $json.geminiPrompt }}` is interpolated raw into a JSON string. Fix: use `{{ JSON.stringify($json.geminiPrompt) }}` and drop surrounding quotes. Verified via exec 1075 at 2026-05-16T22:04:33Z.


### Tick — 2026-05-16T22:18Z (Feedback + Rebook actions)

**Actions performed by operator:**
1. Sent free-form text "I want another consultation"
2. Tapped "Book Again" button (btn_rebook) from yesterday's consultation-closure message
3. Sent keyword "REBOOK"

**New executions:** 22 (1077–1098). 8 errored, 14 succeeded.

**Per-action breakdown:**

| Action | Execs | Outcome |
|---|---|---|
| 1 — "I want another consultation" | WF-00→WF-01→WF-02→WF-43(err 1081) | ❌ — WF-43 hit `Gemini General Response`, same JSON-interpolation bug (BUG-B) |
| 2 — Tap "Book Again" button | WF-00→WF-02→WF-43(err 1086)→WF-45(err 1087) | ❌ — WF-43 route node fine; WF-45 `Set status=payment_pending` succeeded then `Send Payment Instructions` failed with "Workflow does not exist." User left stuck in `payment_pending` despite no payment-prompt delivered. |
| 3 — "REBOOK" keyword | WF-00→WF-01→WF-02→WF-20→WF-30→WF-25→WF-50 | ✅ technically — but content is wrong (see BUG-E) |

**Bugs (this tick):**

- **BUG-C [critical] · WF-45 (`MUG7rPgSHc7UtAE9`) · `Send Payment Instructions` executeWorkflow node.** `parameters.workflowId` is a resource-locator object `{"__rl":true,"value":"BUVun38WEKb12zg9","mode":"id"}` on a `typeVersion: 1` node — n8n throws "Workflow does not exist." Same class as F-04 (WF-47 hold/opt-out messages, fixed yesterday). Lint hook should have caught this. Verified exec 1087, 2026-05-16T22:17:29Z.
  - **Side effect:** `Set status=payment_pending` node ran *before* the failing node, so `users.status` flipped from `consultation_closed` → `payment_pending` (updated_at 22:17:29Z) without any payment instructions ever leaving the system. User is in an inconsistent state.

- **BUG-D [major] · WF-20/WF-30 · REBOOK keyword from `consultation_closed` is not routed to WF-45.** After BUG-C left user in `payment_pending`, sending "REBOOK" was handled by WF-20 (keyword handler) → WF-30 (payment-pending intent filter), which produced a payment-instructions message referring to "the Payment Completed button you received earlier." That button is the original one from days ago — for a fresh rebook the user needs a NEW button. WF-20 must dispatch REBOOK → WF-45 from both `consultation_closed` *and* `payment_pending` states, and WF-45 must always emit a fresh interactive button via WF-50.
  - Even if BUG-C is fixed, BUG-D still applies once a user accidentally types REBOOK while already in `payment_pending` (e.g. forgot they tapped the button).

- **BUG-E [major · design gap] · Free-form rebook intent has no dedicated reply.** TC-0506 expects WF-43 + WF-25 (rebook_intent) → reply: *"To book another consultation, just send REBOOK."* That branch does not exist in WF-43 today — the message falls into the generic Gemini path. Operator's intended contract (capture this):
  > For a `consultation_closed` user who expresses rebook intent in free-form text (not the button, not the exact keyword), WF-43 must respond with a SHORT message offering BOTH options: *"To book another consultation, you can either tap the 'Book Again' button from your last message, or send REBOOK as a new message."*

- **BUG-B confirmed reproducible** — exec 1081 failed at the same `Gemini General Response` node, same `JSON parameter needs to be valid JSON`. Same fix as previously written prompt (`JSON.stringify`).

- **BUG-A still latent** — feedback button branch still has no `UPDATE stage='awaiting_feedback'` (not re-tested this tick; carrying over).

**DB delta on `users`:**
- 61466927921: `status` consultation_closed → **payment_pending** (22:17:29Z) via WF-45 partial run. **stage** still null. **slack_channel_id** still C0B3SA9JALX (correctly unchanged per Design Rule #10). Recovery action TBD — see remediation list.

**Slack:** none expected; none observed in C0B3SA9JALX (correct).

**Latency:** all sub-WFs <2s. No slow execs.


### Observation — 2026-05-16T22:24Z

Operator (while waiting) sent free-form "I've already paid" while in `payment_pending`. System replied with the same payment-instructions message that asks user to tap "the Payment Completed button you received earlier" — same stale-button problem as BUG-D. Reinforces that the payment-pending free-form reply (WF-30) needs to either (a) re-send a fresh interactive button or (b) clarify how to recover when the old button is gone. Logging as evidence for BUG-D scope; not a separate bug.

### Action queue — 2026-05-16T22:24Z

Operator will now exercise, in order:
1. TC-0604 — send "STOP" from `payment_pending` → expect status `payment_pending` → `opted_out`, WF-47 opt-out confirmation message
2. TC-0607 — send any message after opt-out → expect WF-01 routes opted_out → WF-21 (welcome + form re-sent), DB record retained
3. TC-0306 — admin `BLOCK 61466927921` from Slack → expect status → `blocked`, admin confirmation, silent to user
4. TC-0307 — admin `UNBLOCK 61466927921` → expect status `blocked` → `consultation_closed`
5. TC-0702 — between BLOCK and UNBLOCK, send a user message → expect silent drop (HTTP 200, no response, admin_actions log)


### Tick — 2026-05-16T22:38Z (STOP from payment_pending)

**Action:** sent "STOP" (and earlier "I have already paid").
**New execs:** 22 (1099–1120). Two webhook batches.

**Findings — ROOT CAUSE of multiple prior bugs:**

- **BUG-F [critical] · WF-20 Keyword Handler · field-name mismatch.** The `Normalize Keyword` Set node has expression `={{ $json.messageText.trim().toUpperCase() }}`. The actual incoming field from WF-02 is **`messageContent`** (or `messageContentUpper` already pre-uppercased). `$json.messageText` is `null`, so `keyword` becomes `null`, the `Match Keyword` switch falls through to the default `Set Passthrough` branch, and **every keyword (STOP/HELP/REBOOK) silently passes through to the state-based handler** — verified in exec 1113 runData (`keyword: null, messageText: null` despite `messageContent: "STOP"`).
  - **This is the root cause of:**
    - The "STOP not working" symptom observed in this tick — WF-47 was never called, user state still `payment_pending`.
    - The earlier "REBOOK worked but with stale-button message" symptom (REBOOK never routed to WF-45; fell through to WF-30 payment-pending intent filter).
    - Likely the same is true for HELP from any state.
  - **Fix:** in WF-20 `Normalize Keyword`, change `={{ $json.messageText.trim().toUpperCase() }}` to `={{ ($json.messageContent || '').trim().toUpperCase() }}` (and same for `messageText` mapping field if present). Also update `phoneNumber` / `userId` mappings if they reference wrong field names (output shows `userId: null` too — verify input shape).
  - **Demotes BUG-D** to a downstream consequence — once BUG-F is fixed, REBOOK from `consultation_closed` will route to WF-45 cleanly. BUG-D's "fresh button must be sent" remains valid but is contingent on BUG-C fix.

- **STOP from payment_pending — actual observed flow:** WF-00 → WF-01 → WF-02 → WF-20 (default pass-through due to BUG-F) → WF-30 (payment intent filter) → WF-25 → WF-50 (payment reminder). User state unchanged.

**DB delta:** none. `status` still `payment_pending`, `stage` still `null`, `updated_at` still 22:17:29Z.

**Slack:** none observed (correct — no admin notification expected).

**TC-0604 verdict:** ❌ — STOP did not transition user to `opted_out`. Blocked behind BUG-F.


### Tick — 2026-05-16T22:44Z (BLOCK from admin Slack)

**Action:** Admin typed `BLOCK` in consult-61466927921 channel (C0B3SA9JALX).
**New execs:** 3 (1121 WF-10 error, 1122 WF-11 error, 1123 WF-46 error).

**Findings:**

- **BUG-G [major] · WF-11 · BLOCK in consult channel does not infer phone from channel name.** Admin typed bare `BLOCK` (no phone). WF-11 parsed: `command=BLOCK, targetPhone=null, phoneNumber=""`. The Slack-side convention is that commands in a `consult-<phone>` channel target that phone implicitly (see CLAUDE.md Design Rule #3 + WF-10 captures all workspace events). WF-11 must either (a) auto-extract phone from `channelName` when no phone token is present, or (b) reply with a clear error like "BLOCK requires a phone number, or run it in the user's consult channel."

- **BUG-H [major] · WF-46 · `Load User by Phone` Postgres node throws `there is no parameter $1`.** Error fires before reaching the user lookup. Symptom suggests the SQL contains `$1` but `queryReplacement` is missing/empty when `phoneNumber=""`. Even with BUG-G fixed (real phone passed in), the node has a brittle structure — should be reviewed alongside BUG-G fix. Verified exec 1123, lastNode=`Load User by Phone`.

**TC-0306 verdict:** ❌ — admin BLOCK does not work from the consult channel without an explicit phone.

**DB delta:** none (user still `payment_pending`).

---

## Session conclusion — 2026-05-16T22:44Z

Operator concluded testing here. Next step: a full bundled sprint to fix all bugs found across this and prior session.

**Final DB state of test user 61466927921:**
- `status` = payment_pending (stuck — left over from BUG-C partial run)
- `stage` = null
- `slack_channel_id` = C0B3SA9JALX
- `feedback` = null

Recovery prior to next live test: either DB reset (`status='consultation_closed'` to resume from the post-consult flow) or proceed through the legitimate happy path once BUG-C is fixed.

