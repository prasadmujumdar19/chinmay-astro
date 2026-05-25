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

## P2 — Nit-tier (contract hygiene; no current consumer impacted)

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
