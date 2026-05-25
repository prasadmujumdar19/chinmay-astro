# Data-Contract Sprint Bug-Fix Tasks

Source: code review of sprint `2026-05-24-data-contract-discipline-phase-1`
(report at `docs/artefacts/reviews/data-contract-discipline-phase-1-pseudo-md-review-2026-05-24/review.md`).

Walk-through order: Blockers first, then Majors, then plugin/skill follow-ups.
Each item triaged interactively against live n8n (tunnel-open) before entry.

## P0 — Blockers (must land before sprint smoke-tests run)

### TD-DCP-101 · WF-01 `slackChannelId` not mapped in Prepare User Data

**Rationale:** `WF-01.pseudo` Step 12 declares `slackChannelId` in the
camelCase mapping list, and `Build WF-01 Envelope` (added this sprint)
reads `d.user.slackChannelId` per §2.1. But the upstream `Prepare User
Data` Code node never includes `slackChannelId: userResult.slack_channel_id`
in its mapping (pre-existing drift, not surfaced until envelope code was
added). Result: envelope emits `user.slack_channel_id: null` for every
user. Every consult-channel-posting consumer rewired this sprint
(WF-31/32/33/34/40/41/42/43/44/46) reads the envelope and passes
`channelId: null` to WF-51 — the new entry-guard regex `^[CDG][A-Z0-9]{8,}$`
rejects null. Functional impact: live consultations go dark (no relay in
either direction), admin APPROVE/REJECT/BLOCK confirmations never reach
the user's channel. Highest-leverage fix in the review; nothing else can
be smoke-tested until this lands.

**Fix:**
1. **Live (WF-01, n8n id `hYGNM97sXvdo1WmI`):** in `Prepare User Data`
   jsCode, inside the `userData = {...}` object alongside the
   `currentConsultationId` line, add:
   ```js
   slackChannelId: userResult.slack_channel_id,
   ```

**Files:**
- Live `Prepare User Data` Code node in WF-01 (n8n id `hYGNM97sXvdo1WmI`).
- Pseudo: no change — `WF-01.pseudo:43` already lists `slackChannelId`.
- `.md`: regenerated post-fix by `generate-workflow-md.py`.

**Change type:** Surgical (live single-line).
**Impact:** Restores §2.1 contract for `user.slack_channel_id`. Unblocks
WF-31/32/33/34/40/41/42/43/44/46 consult-channel posting.
**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-01`).
2. Re-fetch WF-01 via MCP; grep `slackChannelId:` in `Prepare User Data` —
   expect 1 hit.
3. Trigger WF-01 with a `consultation_active` test user; inspect execution
   output of `Build WF-01 Envelope` — expect non-null `user.slack_channel_id`.
4. Regenerate `WF-01.md` and confirm the new line appears in the jsCode
   block.

---

### TD-DCP-111 · WF-10 `Load User Status` SELECT missing `slack_channel_id` and `current_consultation_id`

**Rationale:** Direct analog of TD-DCP-101 on the WF-10 side (Cross-cutting
#2 in the review). `design.md §2.2` Command Envelope declares
`user.slack_channel_id` required for user-targeted commands; the live
SELECT only fetches `id, status, name, phone_number`, so `Build WF-10
Command Envelope` emits `user.slack_channel_id: undefined`. Downstream
WF-33/WF-34/WF-42 consume `channelId: user.slack_channel_id` to drive
`Call WF-51 (Notify Admin)` with no fallback; WF-51's entry-guard regex
`^[CDG][A-Z0-9]{8,}$` rejects undefined and throws "WF-51 contract
violation: channelId missing or invalid". Functional impact: next admin
APPROVE PAYMENT / REJECT PAYMENT / CLOSE typed in a consult channel
fails. WF-46 BLOCK survives via its `trigger.channelId ||
user.slack_channel_id` fallback. `current_consultation_id` has no current
consumer (WF-41 doesn't read `user.*`) but is in the §2.2 Relay Envelope
contract — bundled here because it's one SELECT change. Live untested
since sprint touched the 7 affected workflows 2026-05-24 16:49–18:43Z
and latest exec is 2026-05-24 06:58Z (pre-sprint).

**Fix:**
1. **Live (WF-10, n8n id `wMh0oBRtJbvhLgOf`):** in `Load User Status`
   Postgres node, expand `query` from:
   ```sql
   SELECT id, status, name, phone_number FROM chinmay_astro.users WHERE slack_channel_id = $1 LIMIT 1
   ```
   to:
   ```sql
   SELECT id, status, name, phone_number, slack_channel_id, current_consultation_id FROM chinmay_astro.users WHERE slack_channel_id = $1 LIMIT 1
   ```
2. **Pseudo (`docs/pseudocode/WF-10.pseudo`):**
   - Step 17 — extend column list to include `slack_channel_id, current_consultation_id`.
   - Step 23a — remove the "adjacent finding logged to followups.md (Phase-2 SELECT expansion)" note; `current_consultation_id` now loaded.

**Files:**
- Live `Load User Status` Postgres node in WF-10 (n8n id `wMh0oBRtJbvhLgOf`).
- `docs/pseudocode/WF-10.pseudo` (Steps 17, 23a).
- `.md`: regenerated post-fix by `generate-workflow-md.py`.

**Change type:** Surgical (live SELECT additive, two pseudo line edits).
**Impact:** Restores §2.2 Command Envelope contract for
`user.slack_channel_id`. Unblocks admin APPROVE/REJECT/CLOSE; aligns
Relay Envelope to `current_consultation_id` documented contract.
**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-10`).
2. Re-fetch WF-10 via curl; grep the new column names in `Load User
   Status` query — expect 1 hit each.
3. Smoke: type `APPROVE PAYMENT <phone>` in a `payment_submitted` user's
   consult channel; confirm WF-10 → WF-11 → WF-33 → WF-51 chain
   succeeds; Slack post lands in the consult channel.
4. Regenerate `WF-10.md` and diff against pre-fix copy.
**Related followup:** Sprint follow-up #2 in
`docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/followups.md`
— closes both halves of that entry (slack_channel_id + current_consultation_id).

---

## P1 — Lower priority Blockers (real but no live-impact today)

### TD-DCP-102 · WF-60 `slackMessageTs` enforcement scope — align to design.md plain reading

**Rationale:** Three-way disagreement between design.md, pseudo, and live.
`design.md §2.6 line 212` plain reading: `slackMessageTs` is required
whenever `transport == 'slack'` (the parenthetical only scopes
`slackChannelId`). `WF-60.pseudo` Step 2 narrows to outbound-only. Live
`Validate Inputs` jsCode narrows further — check sits inside the
`if (!userId)` block. Functionally: WF-60 is the message logger called
from WF-00 / WF-50 (wa) and WF-10 / WF-51 (slack); every slack caller has
a real `ts` available (inbound from webhook `event.ts`, outbound from
`chat.postMessage` response), so logging every slack message with a real
`ts` is needed in principle to support threading, de-dup, and Slack-UI
cross-reference via `messages.slack_message_ts`.

No live-impact today — all current callers already pass `slackMessageTs`
via successful Slack API exchanges (per followups.md priority note). Risk
is a future caller silently INSERTing NULL into `messages.slack_message_ts`
and losing threading/de-dup capability for those rows.

**Fix:**
1. **Live (WF-60, n8n id `6H75p935FpBVBQtV`):** in `Validate Inputs`
   jsCode, extract the `slackMessageTs` check from inside the
   `if (!userId)` block. Place it as a top-level transport-scoped check
   directly after the `transport` / `direction` / `messageType`
   validations (before the `if (!userId)` lookup-key gate):
   ```js
   if (transport === 'slack') {
     const slackMessageTs = input.slackMessageTs
       ?? input.slack_message_ts
       ?? input.metadata?.slackMessageTs
       ?? null;
     if (!slackMessageTs) {
       throw new Error("WF-60 input-contract violation: transport='slack' requires 'slackMessageTs'");
     }
   }
   ```
   Keep the `slackChannelId` check inside `if (!userId)` — that one is
   genuinely only needed when the lookup fallback fires.
2. **Pseudo (`docs/pseudocode/WF-60.pseudo`):** Step 2, drop the
   `direction == 'outbound'` qualifier on the `slackMessageTs` line.
   New wording: `transport == 'slack' AND slackMessageTs (or alias) absent → throw`.
3. **Spec (`docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/design.md` §2.6):**
   reformat line 212 so the parenthetical clearly scopes only to
   `slackChannelId`, and `slackMessageTs` is its own bullet — e.g.:
   ```
   - `transport == 'slack'`:
     - `slackChannelId` — required when `userId` absent (user lookup key)
     - `slackMessageTs` — always required
   ```

**Files:**
- Live `Validate Inputs` Code node in WF-60 (n8n id `6H75p935FpBVBQtV`).
- `docs/pseudocode/WF-60.pseudo` Step 2.
- `docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/design.md` §2.6.
- `.md`: regenerated post-fix.

**Change type:** Surgical (live small jsCode reshuffle) + Documentation
(pseudo + spec wording tighten).
**Impact:** All `transport=slack` log payloads carry a real `ts`, supporting
threading, de-dup, and cross-reference to Slack UI for every slack row.
Hardens against future callers silently dropping the field.
**Caller-compliance audit (defer to plan-sprint):** verify all four current
slack callers pass `slackMessageTs` today before tightening the guard —
WF-10 Slack-inbound, WF-51 Slack-outbound. If either omits the field,
tightening the guard breaks them; add a pre-step to that caller in the
sprint plan.
**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-60`).
2. Re-fetch WF-60 via MCP; confirm the new top-level `slackMessageTs`
   check sits between the `messageType` block and the `if (!userId)` block.
3. Trigger WF-60 with `transport='slack', direction='inbound', userId=<known>,
   slackChannelId=<known>` but no `slackMessageTs` — expect contract-violation
   throw.
4. Trigger WF-60 with the same payload PLUS `slackMessageTs` — expect log
   succeeds, row appears in `messages` with non-null `slack_message_ts`.
5. Regenerate `WF-60.md` and confirm the jsCode block matches the live edit.

---

### TD-DCP-104 · WF-20 `Normalize Keyword` drops `userStatus` — WF-47 STOP path orphans consultation row (pre-existing TD-DRIFT-006)

**Rationale:** `WF-20.pseudo` Step 1 declares `userStatus` (from envelope
`user.status`) as a required input used to drive both the HELP contextual
branches and the STOP → WF-47 carry-forward. The live `Normalize Keyword`
Set node assigns only `keyword`, `phoneNumber`, `userId`, `messageText` —
`userStatus` is dropped. Downstream `Call WF-47 Unsubscribe` then reads
`$json.userStatus` → resolves to `undefined`.

WF-47's `Was Consultation Active?` IF compares
`userStatus === 'consultation_active'` → FALSE → `Close Open Consultation`
never runs → user gets `users.status='opted_out'` but their consultation
row stays `status='active'` (orphan). Real-world consequence: every STOP
sent by a user currently in `consultation_active` produces an orphan
active-consultation row that should have been closed.

This is **pre-existing TD-DRIFT-006**, originally planned as P0 in
`docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md` but not
landed in that sprint. `WF-20.pseudo:11` still carries the "deferred bug,
NOT fixed in Phase 1" note. Bug-fix sprint is the right place to close it.

**Fix:**
1. **Live (WF-20, n8n id `LgIDj1v4ZbCPlX25`):** in `Normalize Keyword`
   Set node, add a fifth assignment alongside the existing four:
   ```
   userStatus  →  ={{ $json.user.status }}
   ```
   (The trigger input is now the WF-01 envelope per Phase 1, so
   `user.status` is the canonical path. Verify with one execution that
   `$json.user.status` resolves — if not, fall back to the
   `$('When Executed by Another Workflow').item.json.user.status` form.)
2. **Pseudo (`docs/pseudocode/WF-20.pseudo`):** in Step 2, add `userStatus`
   to the carry-forward list. Then remove the `TD-DRIFT-006` deferred-bug
   note from the Ambiguities section (line ~11) since the bug is now
   closed.

**Files:**
- Live `Normalize Keyword` Set node in WF-20 (n8n id `LgIDj1v4ZbCPlX25`).
- `docs/pseudocode/WF-20.pseudo` Step 2 + Ambiguities section.
- `.md`: regenerated post-fix.

**Change type:** Surgical (live single-assignment add) + Documentation
(pseudo edits).
**Impact:** Closes TD-DRIFT-006 orphan-active-consultation bug. WF-47 STOP
path correctly closes open consultations when triggered from
`consultation_active`. Restores envelope contract for `user.status`
passthrough in WF-20.
**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-20`).
2. Re-fetch WF-20 via MCP; confirm `Normalize Keyword` assignments include
   `userStatus`.
3. Functional test: put a test user in `consultation_active` state (insert
   a consultations row with `status='active'`), send STOP via WhatsApp,
   then verify both:
   - `chinmay_astro.users.status='opted_out'`
   - `chinmay_astro.consultations.status='closed'` (was the active row)
4. Regenerate `WF-20.md` and confirm the new assignment appears.

**Related followup:** TD-DRIFT-007 (WF-47 atomicity reorder — `UPDATE users`
before `Close Open Consultation`) was paired with TD-DRIFT-006 in the
prior sprint's tasks.md but is NOT addressed here. Even after TD-DCP-104
lands, an in-step failure between user-update and close-consultation can
still produce the same orphan-row outcome. Track separately if not
already covered.

---

### TD-DCP-112 · WF-33 `Extract Command Data` writes `channelId` to `payments.verified_by` (pre-existing TD-DRIFT-017)

**Rationale:** TD-DRIFT-017, explicitly routed to this sprint per
`design.md §1.5` table row and `WF-33.pseudo:29` deferred note.
`Extract Command Data` jsCode maps `adminUserId: input.channelId` — a
stale pre-envelope hand-mapping. Downstream `Update Payment Status`
queryReplacement `$1 = $("Extract Command Data").item.json.adminUserId`
populates `payments.verified_by` with the Slack channel C-ID (e.g.
`C0B567A175W`) instead of the admin Slack U-ID (e.g. `U0A4A6X857D`).
§2.2 envelope already emits `adminUserId` as a first-class field —
the fix is a one-token swap. Functional impact: audit-trail fidelity
only; single-admin model makes the column degenerate today, but the
data is wrong for any future analytics or multi-admin extension. No
user-visible breakage, no other consumer of `verified_by`.

**Fix:**
1. **Live (WF-33, n8n id `NcHZedq9ycnAQ9SW`):** in `Extract Command
   Data` jsCode, change:
   ```js
   adminUserId: input.channelId,
   ```
   to:
   ```js
   adminUserId: input.adminUserId,
   ```
2. **Pseudo (`docs/pseudocode/WF-33.pseudo`):** drop the line-29
   "**Note:** TD-DRIFT-017 … out of Phase 1 scope per design.md §1.5
   — do not fix here." note (resolved here).

**Files:**
- Live `Extract Command Data` Code node in WF-33 (n8n id `NcHZedq9ycnAQ9SW`).
- `docs/pseudocode/WF-33.pseudo` (line 29).
- `.md`: regenerated post-fix by `generate-workflow-md.py`.

**Change type:** Surgical (one-token swap + pseudo note removal).
**Impact:** `payments.verified_by` populated with correct admin U-ID
going forward. Closes TD-DRIFT-017. No downstream caller change.
**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-33`).
2. Re-fetch WF-33 via curl; grep `adminUserId: input` in `Extract
   Command Data` — expect `input.adminUserId`, not `input.channelId`.
3. Smoke: APPROVE PAYMENT in a `payment_submitted` user's consult
   channel; verify `SELECT verified_by FROM chinmay_astro.payments
   WHERE id = <new id>` returns a U-prefixed string (not C-prefixed).
4. Regenerate `WF-33.md` and diff against pre-fix copy.
**Backfill (optional, defer):** existing `payments.verified_by` rows
currently hold channel IDs. Pre-live test data — recommend skip; if
needed before go-live, handle in a separate data-cleanup task.

---

### TD-DCP-105 · WF-01 opted-out branch — load full user row + emit §2.1 envelope (forward-positioning for WF-26)

**Rationale:** `WF-01.pseudo` Step 9 declares the opted-out branch
"build[s] the §2.1 core envelope … re-SELECT or carry forward the full
user row". Live `Build WF-01 Envelope (Opted-Out)` Code node instead
hardcodes `user: null, pendingUser: null`, with a comment explaining
"user data has NOT been loaded (opted-out users exit the blacklist gate
before full user load)". Today this is harmless — the only caller on this
branch is WF-21, which reads `phoneNumber`, `contactName`, `wasOptedOut`,
`messageContent` from the top level and never touches `user.*`.

The reason to fix it now is **BUG-NEW-02** (smoke 2026-05-24 critical
finding, `docs/artefacts/tests/smoke-pre-golive-2026-05-24/followups-bug-new-02-resolution.md`):
calling WF-21 from the opted-out branch is the wrong workflow (WF-21 is
the new-user form-issuer; re-issuing the form to an opted_out user
forces them to re-enter onboarding data they already provided). The
operator-recommended fix (Option B in that file) is a new
**WF-26 Re-Engaged Opted-Out User Handler** that lifts users out of
`opted_out` and routes their first message through normal intent
handling. WF-26 will need at minimum `users.id`, `users.status`,
`users.name`, `users.slack_channel_id`, `users.current_consultation_id`
to do its job — exactly the §2.1 envelope shape. Pre-loading the user
row on this branch NOW eliminates the only carve-out from the §2.1
layered-envelope principle, costs effectively nothing today (WF-21
ignores `user.*`), and means WF-26 can ship envelope-fed (no leaf
SELECT) when its design lands.

The reconciliation is **forward-compatible** with either WF-26 design
outcome — if WF-26 elects to do its own SELECT instead, the populated
envelope is simply unused, no harm done.

**Fix:**
1. **Live (WF-01, n8n id `hYGNM97sXvdo1WmI`):**
   a. Expand `Lookup Blacklisted Users` SELECT (current projection
      `id, phone_number, status, blocked_reason`) to include the
      §2.1-required columns: `id, phone_number, name, status,
      slack_channel_id, current_consultation_id, blocked_reason`.
      (Alternatively, leave that SELECT minimal and insert a sibling
      `Load User by Phone (Opted-Out)` Postgres node between
      `Opted Out?` IF (TRUE branch) and `Build WF-01 Envelope (Opted-Out)`
      Code node — sprint-planning decides which shape is cleaner.)
   b. Update `Build WF-01 Envelope (Opted-Out)` Code node to populate
      the `user` object from the SELECT result:
      ```js
      const u = $input.first().json; // or $('Load User by Phone (Opted-Out)').first().json
      return {
        phoneNumber:   d.phoneNumber  || null,
        messageType:   d.messageType  || null,
        messageContent: d.messageContent || null,
        user: {
          id:                       u.id,
          phone_number:             u.phone_number,
          name:                     u.name,
          status:                   u.status,
          slack_channel_id:         u.slack_channel_id,
          current_consultation_id: u.current_consultation_id
        },
        pendingUser:  null,  // intentional — opted_out users have no pending row
        messageContentUpper: d.messageContentUpper || null,
        messageId:    d.messageId    || null,
        contactName:  d.contactName  || null,
        rawMessage:   d.rawMessage   || null,
        timestamp:    d.timestamp    || null,
        metadata:     d.metadata     || null,
        isNewUser:    false,         // changed — opted_out users are NOT new
        wasOptedOut:  true
      };
      ```
      Note `isNewUser` flips from `true` to `false` — an opted_out user
      with an existing row is by definition not new. Verify with
      sprint-planning whether any current downstream uses `isNewUser`
      from this branch (likely no — WF-21 doesn't read it either).
2. **Pseudo (`docs/pseudocode/WF-01.pseudo` Step 9):** rewrite to:
   > *Step 9: Check: securityCheck == 'OPTED_OUT'?*
   > *  - If YES → load the full user row (expand Step 6 projection
   >     or add a sibling SELECT) and build the §2.1 core envelope via the
   >     `Build WF-01 Envelope (Opted-Out)` Code node, populating
   >     `user.{id, phone_number, name, status, slack_channel_id,
   >     current_consultation_id}` from the loaded row; `pendingUser` is
   >     null on this branch. The envelope also carries `wasOptedOut:
   >     true` and `isNewUser: false`. Then call WF-26 (Re-Engaged
   >     Opted-Out User Handler) with the envelope. End.*
   > *  - If NO → go to Step 10.*
   (Wording assumes TD-DCP-106 + TD-DCP-107 land together; if WF-26 is
   not yet built when this entry is implemented, leave the WF-21 call in
   place and add a TODO marker — but the three entries should ideally
   ship as one PR.)

**Files:**
- Live `Lookup Blacklisted Users` Postgres node (or new sibling SELECT
  node) in WF-01 (n8n id `hYGNM97sXvdo1WmI`).
- Live `Build WF-01 Envelope (Opted-Out)` Code node in WF-01.
- `docs/pseudocode/WF-01.pseudo` Step 9.
- `.md`: regenerated post-fix.

**Change type:** Surgical (live: one SELECT projection expansion or one
new SELECT node + one Code-node rewrite) + Documentation (pseudo Step 9).

**Impact:** Eliminates the §2.1 layered-envelope carve-out; opted-out
branch now emits a uniform canonical envelope. Pre-positions WF-26 to
ship envelope-fed (no leaf SELECT). Zero runtime behaviour change while
WF-21 remains the caller; behaviour change appears only when TD-DCP-107
swaps in WF-26.

**Dependencies:** None (can land independently of TD-DCP-106 / TD-DCP-107
if needed, with WF-21 continuing to ignore the now-populated `user.*`).

**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-01`).
2. Re-fetch WF-01 via MCP; confirm SELECT projection includes all six
   user columns AND `Build WF-01 Envelope (Opted-Out)` populates
   `user.{}`.
3. Trigger the opted-out branch by setting a test user to
   `users.status='opted_out'` and sending any WA message; inspect WF-01
   execution output → expect `user.{id, name, slack_channel_id, …}`
   populated, NOT null.
4. Confirm downstream (WF-21 today, WF-26 after TD-DCP-107) does not
   throw on the new shape.
5. Regenerate `WF-01.md` and confirm jsCode + SELECT match live.

---

### TD-DCP-106 · WF-26 Re-Engaged Opted-Out User Handler — build new sub-workflow

**Rationale:** Closes BUG-NEW-02 (smoke 2026-05-24 critical). Today
WF-01's `Opted Out?` TRUE branch routes the user's re-engagement message
to WF-21, which sends "welcome + WhatsApp Flow form". For opted_out
users whose DB row already contains name/DOB/birth-place, this is a UX
regression (forces them to re-enter onboarding data) and a
data-correctness risk (form overwrites existing fields). Per
`docs/artefacts/tests/smoke-pre-golive-2026-05-24/followups-bug-new-02-resolution.md`,
the operator-recommended fix is a dedicated **WF-26 Re-Engaged Opted-Out
User Handler** that:
1. Lifts `users.status` out of `opted_out` to a safe re-entry state.
2. Sends a "welcome back" WA message via WF-50.
3. Optionally forwards the inbound message through WF-25 → normal intent
   routing, so the very first re-engagement message is actually answered
   (not just acknowledged).

WF-26 ships with a `Validate Inputs` entry guard following the pattern
established this sprint for WF-02 (sub-8.md) — every direct-call edge
from WF-01 must validate envelope shape.

**Open design questions** (resolve during plan-sprint, NOT pre-decided
here — operator explicitly parked these as "starting point for
discussion, not finalised spec"):
1. **Re-entry status target:** `consultation_closed` (cleanest if user
   had completed a prior consult) vs. a new transient `re_engaged`
   state (matches semantics but adds a state-machine value) vs. restore
   prior status before opt-out (most complex — requires storing
   pre-opt-out status). The edge case at play: users who opted out from
   `payment_pending` (never reached consultation) — lifting them to
   `consultation_closed` is semantically odd.
2. **First-message handling:** Ack only (welcome back, ask them to send
   REBOOK or message about consult) vs. forward through WF-25 (intent
   classifier handles the first message immediately, so a user typing
   "I want to rebook" gets routed straight to WF-45 without an extra
   round-trip).
3. **Welcome-back wording:** Name personalization yes/no — if yes, the
   `user.name` envelope field is materially consumed; if no, the
   envelope is consumed only for the status UPDATE and routing.
4. **Edge — opted out from `payment_submitted`:** Different welcome
   wording, or unified message? (Payment was submitted but never
   approved/rejected when they opted out.)
5. **WF-26 input contract:** Mirrors §2.1 canonical envelope + carries
   `wasOptedOut: true`. Should be documented in
   `docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/design.md`
   as a new §2.X sub-section (parallel to existing per-WF input
   contracts).

**Fix:**
1. **Run a dedicated design session (operator-led)** to resolve the five
   open questions above, before pseudo is written.
2. **Pseudo first** per `[[feedback_pseudocode_first_refactor]]` — write
   `docs/pseudocode/WF-26.pseudo` with the agreed design. Include
   structured Inputs block (mirroring the §2.1 envelope shape +
   `wasOptedOut`), Algorithm steps, Calls Sub-Workflows declaration
   (WF-50 at minimum; WF-25 if forward-routing is chosen).
3. **Build WF-26 in n8n.** Required nodes (minimum):
   - `When Executed by Another Workflow` (trigger).
   - `Validate Inputs` (Code v2) — envelope entry guard, throws on
     contract violation. Mirror the WF-02 guard from sub-8.md (validate
     `phoneNumber`, `messageType`, `messageContent`, `user.{id,
     phone_number, name, status, slack_channel_id,
     current_consultation_id}`, `pendingUser:null`, `wasOptedOut:true`).
   - `Update User Status` (Postgres) — `UPDATE chinmay_astro.users SET
     status = <target>, updated_at = NOW() WHERE id = <user.id>`. Target
     state per design-session decision.
   - `Build Welcome-Back Payload` (Set/Code) — produces canonical WF-50
     contract `{phoneNumber, messageType: 'text', messageContent: <text>}`.
   - `Call WF-50 Send Welcome Back` (executeWorkflow → WF-50).
   - **If forward-routing chosen (design Q2):** `Call WF-25 Intent
     Classifier` (executeWorkflow → WF-25) reading
     `{phoneNumber, userId, messageContent, userStatus}` from envelope;
     then per-intent branches to WF-45 (REBOOK), WF-43 (general), etc.
     OR a simpler `Call WF-02` to re-enter the router with updated
     status (cleaner — leverages existing state-routing).
4. **Add WF-26 input contract** as a sub-section in
   `docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/design.md`
   immediately after §2.1 (or under §3 if that's the per-WF section).
5. **Generate `WF-26.md`** via `generate-workflow-md.py`.

**Files:**
- New live workflow in n8n: "WF-26 Re-Engaged Opted-Out User Handler".
- New `docs/pseudocode/WF-26.pseudo`.
- New `docs/pseudocode/WF-26.md` (generated).
- `docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/design.md`
  new sub-section.

**Change type:** New workflow (build) + Documentation (pseudo + design
spec).

**Impact:** Closes BUG-NEW-02. Opted_out users re-engaging via WhatsApp
receive a context-appropriate welcome back AND have their state lifted
so subsequent messages route correctly through the state machine. No
more form re-issuance to already-onboarded users.

**Dependencies:**
- **TD-DCP-105** — WF-26 needs the populated `user.{}` envelope from
  WF-01 (else WF-26 has to do its own SELECT and we re-introduce the
  leaf-SELECT pattern §2.1 was designed to eliminate).
- **Design session must complete first** — pseudo cannot be written
  until the five open questions resolve.

**Verify:**
1. Back up new workflow JSON after creation
   (`scripts/backup-workflow.sh WF-26`).
2. Lint clean (no `.issues`).
3. Functional test (see TD-DCP-109): user in `opted_out` → sends any
   message → expect welcome-back WA + status lift + (if forward-routing
   enabled) intent-routed response.
4. Cross-check entry guard rejects malformed envelopes (omit
   `user.slack_channel_id`, expect throw).
5. Regenerate `WF-26.md`; confirm structure matches pseudo.

---

### TD-DCP-107 · WF-01 opted-out branch — rewire call from WF-21 to WF-26

**Rationale:** Activates the BUG-NEW-02 fix by swapping the opted-out
branch's call target. Today WF-01's `Route Opted-Out to WF-21`
executeWorkflow node (workflowId `zM8WbxSdt9nXRoLZ`) sends opted_out
re-engagement traffic to WF-21 (form-issuer). After TD-DCP-106 lands,
this must instead call WF-26.

The rename of the node itself (`Route Opted-Out to WF-21` →
`Route Opted-Out to WF-26`) is recommended for read-time clarity in the
n8n canvas — labels carry meaning.

**Fix:**
1. **Live (WF-01, n8n id `hYGNM97sXvdo1WmI`):** in the executeWorkflow
   node currently named `Route Opted-Out to WF-21`:
   a. Update `workflowId.value` from `zM8WbxSdt9nXRoLZ` (WF-21) to the
      new WF-26 ID (assigned at TD-DCP-106 creation time).
   b. Update `workflowId.cachedResultUrl` to the WF-26 path.
   c. Rename the node from `Route Opted-Out to WF-21` to
      `Route Opted-Out to WF-26`.
   d. Keep `mappingMode: 'passthrough'` — WF-01's envelope (post
      TD-DCP-105) is exactly WF-26's input contract.
2. **Re-export `workflows/hYGNM97sXvdo1WmI.json`** and confirm the
   change.
3. **Update `docs/pseudocode/WF-01.pseudo` Step 9** — change the
   `call WF-21` reference to `call WF-26` (TD-DCP-105's pseudo rewrite
   already anticipates this; coordinate so both land in the same commit).
4. **Sanity-check WF-21 has no other callers expecting the opted-out
   shape.** Audit: WF-02 routes NEW_USER → WF-21 (legitimate, new-user
   path). No other caller. WF-21 can continue accepting `wasOptedOut`
   in its input but will never receive `true` after this rewire — the
   "Welcome back" prefix path in `Build Welcome Message` becomes dead
   code. Sprint-planning decides whether to leave it (defensive) or
   remove (cleanup); see TD-DCP-110 for the parallel WF-21 entry-guard
   add.

**Files:**
- Live `Route Opted-Out to WF-21` (→ `Route Opted-Out to WF-26`)
  executeWorkflow node in WF-01 (n8n id `hYGNM97sXvdo1WmI`).
- `workflows/hYGNM97sXvdo1WmI.json` (re-exported).
- `docs/pseudocode/WF-01.pseudo` Step 9 (small wording sync with
  TD-DCP-105).

**Change type:** Surgical (live: one node target + one rename) +
Documentation (pseudo sync).

**Impact:** Activates BUG-NEW-02 fix end-to-end. Opted_out users
re-engaging are routed to WF-26 instead of WF-21.

**Dependencies:**
- **TD-DCP-105** (envelope expansion must land first or simultaneously).
- **TD-DCP-106** (WF-26 must exist before this rewire activates it).

**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-01`).
2. After edit: re-fetch WF-01 via MCP; confirm executeWorkflow target ID
   matches new WF-26 ID, node name is `Route Opted-Out to WF-26`.
3. Send any inbound from test user 30 (still in `opted_out` per smoke
   2026-05-24 wrap handoff) → confirm execution chain hits WF-26 not
   WF-21.
4. Run TD-DCP-109 regression test end-to-end.
5. Regenerate `WF-01.md` and confirm the executeWorkflow node parameters
   match live.

---

### TD-DCP-109 · TC-0607 re-verification — opted_out re-engagement now routes through WF-26

**Rationale:** TC-0607 ("opted_out user messages again (re-engagement)",
P1) already exists in
`docs/reference/FunctionalTestCases_Tracker.md:139` marked ✅ Covered.
However, the cited coverage (exploratory tests from 2026-05-16)
validated the OLD behavior — opted_out users routed to WF-21 and
re-issued the onboarding form — which BUG-NEW-02 (smoke 2026-05-24)
has now classified as a critical defect. After TD-DCP-105/106/107
land, TC-0607's expected behavior changes materially; the prior PASS
evidence is invalidated.

This entry is a **test re-definition + re-verification**, not a new
test creation.

**Fix:**
1. **Update TC-0607 expected behaviour in
   `docs/reference/FunctionalTestCases_Tracker.md`:**
   - Reset Status from "✅ Covered" to "⏳ Pending re-verification".
   - Clear prior evidence (the 2026-05-16 exploratory references) or
     mark them historical-only.
   - Add expected behaviour notes inline (or link to TD-DCP-106
     design decisions):
     - WF-01 routes to `Route Opted-Out to WF-26` (NOT WF-21).
     - WF-26 lifts `users.status` to the agreed re-entry state.
     - WF-26 sends "welcome back" WA message via WF-50 (NOT the
       onboarding form).
     - (If TD-DCP-106 design Q2 = forward-routing) subsequent
       messages route through WF-25 → state-appropriate leaf.
     - No new `pending_users` row created (user is not new).
     - No data overwrite in `users` (name / DOB / birth-place
       preserved).
2. **Run TC-0607 against the new flow** as part of the next pre-go-live
   smoke session. The 2026-05-24 smoke explicitly left test user 30
   (`+61466927921`) in `opted_out` with consult channel `C0B567A175W`
   preserved so this scenario is reproducible without setup work.
3. **On PASS:** update TC-0607 Status to ✅ Covered with the new smoke
   session reference; mark BUG-NEW-02 resolved in
   `docs/artefacts/tests/smoke-pre-golive-2026-05-24/followups-bug-new-02-resolution.md`
   with a "Resolved by TD-DCP-105/106/107 — see <smoke-session>"
   pointer.
4. **Adjacent — TC-0608** (`REBOOK keyword from opted_out user`, P2,
   ⏳ Pending in tracker line 140) becomes a natural follow-on test
   once WF-26 ships: an opted_out user sending REBOOK directly should
   land in the rebook flow without going through the "welcome back +
   ask" round-trip. Consider promoting TC-0608 to "in scope for next
   smoke" alongside TC-0607.

**Files:**
- `docs/reference/FunctionalTestCases_Tracker.md` — TC-0607 row update
  + optional TC-0608 promotion.
- `docs/artefacts/tests/smoke-pre-golive-2026-05-24/followups-bug-new-02-resolution.md`
  — mark resolved.
- Next smoke session's `session.md` — TC-0607 verification entry.

**Change type:** Test documentation update + verification execution
(no live changes — this entry is purely the verification gate).

**Impact:** Regression coverage for BUG-NEW-02 is reset to validate
the new behavior, not the old. Prevents future code reviews from
trusting stale "✅ Covered" evidence.

**Dependencies:** TD-DCP-105 + TD-DCP-106 + TD-DCP-107 must all land
before TC-0607 can be re-verified.

**Verify:** Execute TC-0607 against test user 30. PASS = all six
expected behaviours observed and tracker updated. FAIL = file a
bug-fix subtask referencing the failed expectation.

---

## P2 — Nit-tier (contract hygiene; no current consumer impacted)

### TD-DCP-108 · Cross-doc sync — CLAUDE.md state machine + workflow-registry.md + user_journey_map.html for WF-26 rollout

**Rationale:** Once TD-DCP-105/106/107 land, three reference docs go
immediately stale and silently mislead any future reader (human or
Claude) reasoning about the opted_out re-engagement flow. These must be
updated in the same PR / merge as the WF-26 build, not deferred to a
sweep.

**Fix:**
1. **`CLAUDE.md` "User State Machine" section:** the current diagram
   line reads
   `opted_out →(user messages again)→ [treat as new user, route to WF-21]`.
   Update to reflect WF-26 routing and re-entry status semantics
   (final wording depends on TD-DCP-106 design Q1 — re-entry status
   target). Example template:
   ```
   opted_out →(user messages again)→ WF-26 → <re-entry-status>
              [WF-26 lifts status + sends welcome back + routes first message]
   ```
2. **`docs/workflow-registry.md`:**
   - **Add WF-26 row** under the WF-2x onboarding range (or WF-4x
     consultation range — pick during planning per how WF-26's
     responsibilities are framed). Fields: workflow name, n8n ID
     (assigned at TD-DCP-106 creation), one-line description, calls
     (WF-50 at minimum; WF-25/WF-02 if forward-routing chosen),
     called-by (WF-01 only), status (🟢 Active), priority tier.
   - **Update WF-01 row** description: change the routing summary from
     "OPTED_OUT → WF-21 for re-engagement" to "OPTED_OUT → WF-26
     re-engagement handler"; add a one-line sprint note referencing
     TD-DCP-105/106/107.
   - **Bump version + Last Updated** per registry's existing
     convention (see registry header).
3. **`docs/reference/user_journey_map.html` J-21
   "Opted-out user messages again"** (lines ~1110-1138):
   - Replace the MVP-vs-Post-MVP framing (currently: "MVP: route
     opted_out back to J-01 welcome; Post-MVP: add dedicated
     re-engagement flow") with a single implemented-flow description
     matching WF-26 behaviour.
   - Update the state-transition pill (currently `opted_out → opted_out`)
     to `opted_out → <re-entry-status>` per design Q1.
   - Tags: keep `opted_out`, `re-engagement`; consider adding `WF-26`.

**Files:**
- `CLAUDE.md` — User State Machine block.
- `docs/workflow-registry.md` — WF-26 row + WF-01 row + version header.
- `docs/reference/user_journey_map.html` — J-21 block.

**Change type:** Documentation only.

**Impact:** Reference docs stay coherent with live behaviour; future
Claude sessions don't reason from a stale "WF-21 handles opted_out
re-engagement" mental model.

**Dependencies:** TD-DCP-106 design session must resolve Q1 (re-entry
status target) so the state diagram and journey-map state pill carry
the right value. TD-DCP-107 must have assigned the WF-26 n8n ID so the
registry row can carry it.

**Verify:**
1. `grep -n 'WF-21' CLAUDE.md docs/workflow-registry.md` — no stale
   references to WF-21 in the opted_out re-engagement context.
2. `grep -n 'WF-26' docs/workflow-registry.md docs/reference/user_journey_map.html` —
   confirm WF-26 appears.
3. Render `user_journey_map.html` locally and visually verify J-21
   card content.

---

### TD-DCP-110 · WF-21 — add `Validate Inputs` entry guard (consistency hygiene post-WF-26 rewire)

**Rationale:** This sprint established the pattern (sub-8.md for WF-02)
that every sub-workflow on a direct-call envelope edge must have a
`Validate Inputs` entry guard that throws on contract violation. WF-21
predates the pattern and has no guard. While WF-01 currently calls
WF-21 directly from the opted-out branch (with `user:null` —
non-conformant but tolerated because WF-21 doesn't read `user.*`), the
gap is operationally hidden. After TD-DCP-107 swaps that call to WF-26,
WF-21's only caller becomes WF-02 → which DOES carry a full §2.1
envelope and DOES expect WF-21 to be a well-behaved leaf. WF-21
without a guard becomes the last unguarded direct-call edge in the
graph.

Standalone hygiene task; defer-acceptable. Surface here so it doesn't
get forgotten once the BUG-NEW-02 fix lands and review attention moves
on.

**Fix:**
1. **Pseudo first** — add structured Inputs block to
   `docs/pseudocode/WF-21.pseudo` mirroring sub-11.md's input table
   (already documents the contract; this just elevates it to a
   first-class block).
2. **Live (WF-21, n8n id `zM8WbxSdt9nXRoLZ`):** insert a `Validate
   Inputs` Code node between `When Executed by Another Workflow` and
   `Insert Pending User` (current direct connection). jsCode pattern:
   ```js
   const i = $('When Executed by Another Workflow').item.json;

   if (!i.phoneNumber || typeof i.phoneNumber !== 'string')
     throw new Error('WF-21 contract: phoneNumber required (E.164 string)');

   if (i.messageType && !['text', 'interactive'].includes(i.messageType))
     throw new Error('WF-21 contract: messageType must be text|interactive when present');

   // user must be null (new user) OR an object — WF-21 supports both
   // shapes today (legitimate new user from WF-02 path passes null;
   // future-state shapes may carry an object)
   if (i.user !== null && i.user !== undefined && typeof i.user !== 'object')
     throw new Error('WF-21 contract: user must be null or an object');

   // pendingUser must be null OR an object
   if (i.pendingUser !== null && i.pendingUser !== undefined && typeof i.pendingUser !== 'object')
     throw new Error('WF-21 contract: pendingUser must be null or an object');

   // contactName (top-level) — required for the pending_users INSERT
   if (i.contactName === undefined || i.contactName === null)
     throw new Error('WF-21 contract: contactName required (top-level)');

   return [{ json: i }];
   ```
3. **Optional cleanup** — once WF-21 only receives `wasOptedOut=false`
   (post TD-DCP-107), the "Welcome back" prefix path in
   `Build Welcome Message` jsCode becomes dead code. Sprint-planning
   decides whether to remove it (cleanup — purity) or leave it
   (defensive — costs nothing). Recommended: leave it; the dead code
   is one if-block and harmless.

**Files:**
- `docs/pseudocode/WF-21.pseudo` — structured Inputs block.
- Live new `Validate Inputs` Code node in WF-21
  (n8n id `zM8WbxSdt9nXRoLZ`).
- `.md`: regenerated post-fix.

**Change type:** Documentation (pseudo Inputs block) + Surgical (live
single new node insertion).

**Impact:** Closes the last unguarded direct-call edge in the
sub-workflow graph. Future-proofs WF-21 against contract drift from
WF-02 changes.

**Dependencies:** None hard. Best landed AFTER TD-DCP-107 so the guard
reflects WF-21's narrowed contract (only new-user path, never opted-out
re-engagement).

**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-21`).
2. Trigger WF-21 with the canonical envelope from a real WF-02 call →
   expect normal pass-through.
3. Trigger WF-21 with `{}` (empty) → expect contract-violation throw.
4. Trigger WF-21 with `{phoneNumber: '+91...', contactName: 'X'}` →
   expect normal pass-through (minimal valid shape).
5. Regenerate `WF-21.md` and confirm the guard node appears.

---

### TD-DCP-103 · WF-52 `Prepare Channel Name` emits `userName:` key + dead-code legacy fallbacks

**Rationale:** `design.md §2.5` and `WF-52.pseudo` Inputs block both
declare the legacy aliases `phone_number` / `userName` removed. The new
`Validate Inputs` entry guard (Step 2, added this sprint) enforces the
canonical keys and throws on the legacy ones — so by the time
`Prepare Channel Name` runs, only canonical keys exist. But that node
still contains both the legacy fallbacks (`input.phone_number || ...`,
`|| input.userName`) AND emits its output under the legacy `userName:`
key. The fallbacks are dead code (guard rejects upstream); the
`userName:` key is emitted but **not consumed by any downstream node in
WF-52** — verified by inspecting all 10 other nodes. WF-52's return shape
to its caller is `{success, channelId, channelName, channelUrl, isNew}`,
so `name`/`userName` is purely internal dataflow. No functional bug today;
strictly contract hygiene.

**Fix:** In `Prepare Channel Name` jsCode in WF-52
(n8n id `IO5BZLUxuVmjzk5I`):
1. Replace `const phoneNumber = input.phone_number || input.phoneNumber || '';`
   with `const phoneNumber = input.phoneNumber;`.
2. In the return object, rename `userName: input.name || input.userName || ''`
   to `name: input.name`.

**Files:**
- Live `Prepare Channel Name` Code node in WF-52 (n8n id `IO5BZLUxuVmjzk5I`).
- Pseudo: no change — Step 3 wording already neutral on internal key names.
- `.md`: regenerated post-fix.

**Change type:** Surgical (live; two jsCode line edits).
**Impact:** Removes dead-code legacy fallbacks; aligns internal dataflow
key with canonical contract. Zero runtime behaviour change (no consumer
exists today). Closes the contract-hygiene gap that triggered the review's
Blocker classification.
**Verify:**
1. Back up workflow JSON (`scripts/backup-workflow.sh WF-52`).
2. Re-fetch WF-52 via MCP; grep `userName\|phone_number` in
   `Prepare Channel Name` jsCode — expect zero hits.
3. Trigger WF-22 form-submission flow that calls WF-52 → confirm channel
   creation still succeeds end-to-end and `users.slack_channel_id` is
   written.
4. Regenerate `WF-52.md` and confirm the new lines match live.

---

## Plugin / skill follow-ups (lessons learnt — not memory or CLAUDE.md material)

### TD-DCP-PLG-001 · Add upstream-mapping audit step to subagent envelope-build briefs

**Plugin:** `n8n-whatsapp-methodology`
**Skill:** `dispatching-subagents` (and/or `build-sprint`'s subagent
dispatch brief template, if it lives there)

**Rationale:** Wave-1 sub-5 built the new `Build WF-01 Envelope` Code node
reading `d.user.slackChannelId`. The brief said "preserve existing
20-column users SELECT" and the subagent correctly verified the SELECT —
but did not audit the intermediate `Prepare User Data` Code node that maps
snake_case columns to camelCase. The pseudo↔live drift sat undetected
until code review. Today's subagent dispatch pattern verifies the *output*
node but not the *upstream feeder* nodes.

**Fix:** Update the skill's subagent dispatch brief template to require, for
every new envelope-build or envelope-consumer node:
1. List every field the new node reads from upstream.
2. For each field, grep the upstream Code/Set node mappings (not just the
   SELECT) to confirm the field is set with the expected casing.
3. Report misses in the structured findings JSON so the parent can fix
   upstream before the new node is deployed.

### TD-DCP-PLG-002 · Add forward-traceability scan to sibling-regression pattern

**Plugin:** `n8n-whatsapp-methodology`
**Skill:** `technical-workflow-review` (or `functional-code-review` —
whichever owns the cross-workflow scan pattern that runs at sprint close)

**Rationale:** Post-Wave-2 sibling regression caught legacy `message:`
keys, leftover `adminMessage` references, and redundant Load-User SELECTs
across all 27 workflows. It did NOT catch the WF-01 `slackChannelId`
mapping gap because the scan was for *removed* legacy patterns, not for
*forward-presence* of every required envelope field. The companion
`followups.md` did catch the WF-10 SELECT-level version of the same class
of bug, but only because a subagent flagged it inline — there's no
systematic scan.

**Fix:** Add a forward-traceability scan to the skill: for each `required`
field declared in `design.md §2.X` envelope tables, trace the field
through the producing workflow's node graph (SELECT → mapping → envelope
build) and emit a finding if any link in the chain is missing. Run as part
of every contract-discipline sprint's close-out.

---

## Reviewed — No Action (audit trail)

### CC-01 · Generator-surfaced error-handling properties (5 Majors → dismissed)

**Reviewed:** 2026-05-25T02:59:36Z. **Verdict:** Non-issue — no action in this sprint.

Review §4 Cross-cutting #1 flagged 5 Major findings on `onError:continueRegularOutput` / `retryOnFail:true / maxTries:3` properties (WF-10 Webhook, WF-22 Create User Record, WF-43 Gemini, WF-50 3 send nodes, WF-51 Call WF-60) as potential sprint-introduced regressions. Snapshot-diff against `workflows/pre-data-contract-phase-1-workflows/2026-05-24/json/` (snapshots dated 2026-05-18 → 2026-05-23, all pre-sprint) confirmed all 8 node-property instances pre-existed identically. Plus WF-00 webhook (Minor). The `.md` generator upgrade between 2026-05-22 and 2026-05-24 began emitting these properties for the first time; the data-contract sprint did NOT touch them.

Origin trace from registry: Sprint F-09 (WF-00/10 webhook onError), TD-003 F2/F3 (WF-10/51 logger onError), TD-NEW-016 (WF-43/50 retryOnFail). WF-22 Create User Record onError is the only one without explicit registry annotation but is still pre-existing. Failure-history scan on WF-22 (the review's most-emphasised concern) shows no Create User Record errors in last 50 executions.

Detailed write-up with origin trace, failure-history scan, and 4-class options for the future tech-error sprint to consider has been appended to `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/deferred-to-tech-sprint.md`. Error-handling policy decisions belong to that dedicated sprint per `[[feedback_pseudo_tech_separation]]`.
