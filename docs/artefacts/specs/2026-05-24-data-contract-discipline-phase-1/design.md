# Data Contract Discipline — Phase 1 Design

**Status:** Ready for `plan-sprint`.
**Created:** 2026-05-24T12:34:10Z
**Revised:** 2026-05-24T14:00:00Z — review pass: scope expanded to 6 entry guards, every WF-01/WF-10 envelope consumer audited, drift-sprint precedence corrected, citation errors fixed, mechanics already covered by `plan-sprint` / `build-sprint` removed.
**Companion files in this folder:**
- [`tasks.md`](./tasks.md) — `plan-sprint` input (H3 task items with priorities and dependencies)
- [`snapshot-restore-design.md`](./snapshot-restore-design.md) — sprint-level rollback scripts

---

## Section 1 — Scope, Principles, Success Criteria

**Initiative:** Data Contract Discipline — Phase 1 (utilities + parent envelopes + envelope-consumer audit)

### In scope — in-place workflow edits (no parallel n8n versions)

- **Utility entry guards (4):** WF-50, WF-51, WF-52, WF-60 — add `Validate Inputs` entry-guard Code node as first node + tighten pseudo Inputs blocks.
- **Envelope-emitting routers (2):** WF-01, WF-10 — restructure to emit documented core envelopes (Section 2).
- **Envelope-consumer entry guards (2):** WF-02 (validates WF-01 envelope, defense-in-depth for the 9 leaves it routes to), WF-11 (validates WF-10 envelope, defense-in-depth for the user-command leaves). **Total = 6 entry guards across Phase 1.**
- **Envelope-consumer audit (every consumer of WF-01 / WF-10):** every leaf that receives the WF-01 or WF-10 envelope is audited for redundant `Load User` SELECTs and field-name canon (`phoneNumber` vs `user.phone_number`); the redundant SELECTs are removed and pseudo `Inputs:` blocks rewritten to declare the new envelope.
- **Caller payload alignment:** all callers of the 4 utilities — minimal Set-node / payload-prep edits to comply with the new entry-guard contracts.

### Pre-live context

The project is pre-live. There is no production user traffic. Sequencing decisions in this design do NOT need to optimise for "no user-facing breakage during the gap" — they prioritise operational clarity, audit thoroughness, and engineering ergonomics.

### Pre-sprint snapshot (rollback insurance)

`scripts/snapshot-for-sprint.sh data-contract-phase-1` creates `workflows/pre-data-contract-workflows/<YYYY-MM-DD>/` containing every impacted workflow JSON + corresponding `.md` AS-IS projection + `.pseudo` design spec. Full script behaviour, manifest shape, and selective-restore semantics live in [`snapshot-restore-design.md`](./snapshot-restore-design.md).

Snapshot is taken RIGHT BEFORE the first workflow edit — first task of the sprint, before any node mutation.

### Out of scope (Phase 2 candidates — not "next sprint" commitments, just deferred work)

- WF-00 webhook-receiver internal contract (WA inbound parse shape).
- WF-02's downstream envelope to consultation-active leaves (separate from WF-02's entry guard, which IS in Phase 1 scope).
- Per-leaf internal contracts beyond removing redundant SELECTs that the new envelope makes unnecessary.

### Principles

1. **Hard-fail enforcement** at utility entry — `Validate Inputs` Code node as first node, throws `Error` on missing/wrong-type required fields. No silent fallback keys.
2. **Layered envelope** at WF-01 / WF-10 — core user fields only; leaves SELECT extras as needed. Envelope shape stable as `users`-table columns grow.
3. **Defense-in-depth entry guards** at WF-02 and WF-11 — they consume routers' envelopes; their guards catch contract drift that escapes the router edits.
4. **In-place workflow edits backed by pre-sprint snapshot** — symmetric rollback for every impacted workflow; restore = re-import from snapshot folder.
5. **Critical state writes before utility calls** in callers — a contract violation at a utility aborts the caller at that node; a quick audit-and-document pass during execution surfaces any caller that writes irreversibly *after* the utility call. No design change here unless violations are found.

### Success criteria

- Snapshot folder exists with all backed-up artefacts BEFORE first edit.
- Each of the 6 entry guards is in place as the first node of its workflow; pseudo Inputs block matches the enforced contract.
- WF-01 and WF-10 emit the documented core envelopes (Section 2), consumed verbatim by every leaf.
- Every redundant `Load User` SELECT in envelope-consuming leaves is removed and pseudo updated.
- Restore script tested in dry-run mode AND one real-restore drill (Session #2 in Section 6).
- Acceptance smoke: 13 critical paths through the system pass end-to-end (Section 6.2 baseline session).

---

## Section 1.5 — Relationship to the deferred drift sprint

The `pseudo-md-drift-fixes-2026-05-24` sprint was planned but never executed. **Decision 2026-05-24 (user direction):** defer it and run data-contract Phase 1 first; re-evaluate the drift sprint's residual scope after Phase 1 lands. Rationale: a significant fraction of the drift work is functionally absorbed by Phase 1 because the utility + envelope contracts are rewritten authoritatively here, making the per-WF `Inputs:` drift items moot.

### What Phase 1 absorbs from drift

- **TD-DRIFT-029** (WF-50 discriminated-union Inputs) — Phase 1 writes the authoritative discriminated-union contract.
- **TD-DRIFT-030** (WF-51 Inputs) — Phase 1 writes the canonical `{channelId, messageText, …}` contract.
- **TD-DRIFT-031** (WF-52 structured Inputs) — Phase 1 defines canonical `{phoneNumber, name, userId}` contract.
- **TD-DRIFT-032** (WF-60 discriminated-union Inputs) — Phase 1 writes the authoritative transport-discriminated contract.
- **TD-DRIFT-012 + TD-DRIFT-013** (WF-50 caller canonicalisation + fallback drop) — Phase 1 absorbs the legacy WF-50 caller renames; the fallback drop is implicit in the entry guard.
- **TD-DRIFT-015** (Canon A — top-level `phoneNumber` wins) — Phase 1 makes this the explicit core-envelope contract for WF-01 and WF-10.
- **TD-DRIFT-016 / 018 / 020 / 022 / 024 / 025 / 027 / 028** (per-WF structured `Inputs:` blocks for envelope-consuming leaves) — fully absorbed by the leaf audit in Section 3.4, since every envelope consumer's pseudo `Inputs:` is rewritten here.

### What Phase 1 does NOT absorb — real bugs that persist

These are NOT contract issues; they're logic bugs inside specific workflows. Phase 1 does not touch them; they remain on the post-Phase-1 work list:

| Item | Bug | Risk |
|---|---|---|
| TD-DRIFT-006 | WF-20 `Normalize Keyword` Set node drops `userStatus`; WF-47 STOP-from-`consultation_active` leaves orphan `consultations.status='active'` row | Table drift |
| TD-DRIFT-007 | WF-47 ordering — opt-out write happens before consultation close; if close fails, orphan row | Atomicity bug |
| TD-DRIFT-009 | `messageContent` canonicalisation at WF-25 callers (WF-23, WF-31, WF-43, WF-44 pass `messageText`; WF-25 reads `messageContent`) — every free-form text state silently classified on empty string | Functional degradation across all intent-classified states. Phase 1 *philosophically* reinforces the `messageContent` canon via WF-01's envelope, but it does NOT rename the four caller payloads — that remains a separate fix |
| TD-DRIFT-017 | WF-33 `Extract Command Data` reads `input.channelId` and writes it to `payments.verified_by` instead of `input.adminUserId` | Column semantics wrong; low operational severity in single-admin model |
| TD-DRIFT-001 | WF-00 `Parse WhatsApp Message` Switch has no `nfm_reply` case; form-submit messages logged as `[NFM_REPLY]` placeholder | Logging fidelity only; functional flow unaffected |

These ship in a post-Phase-1 bug-fix sprint.

### What Phase 1 also does NOT absorb — independent cleanup

- **TD-DRIFT-019** (linear pseudo numbering — drop tombstones) — pure pseudo cleanup across 6 files. Independent.
- **TD-DRIFT-008** (WF-22 phantom branch + NOW() unify) — WF-22 spec/live mini-sync; not contract-related.
- **TD-DRIFT-021 / 023** — leaf-specific topology rewrites (WF-40, WF-42). Independent.

### Expected drift residual after Phase 1

- 5 real bugs (above) → post-Phase-1 bug-fix sprint.
- 6–8 independent pseudo cleanup items → batched or absorbed into routine maintenance.
- 0 contract items remaining (all absorbed).

---

## Section 2 — Contract Shapes

Drawn from current pseudo and live `.md`. Contracts below are authoritative — they define the post-Phase-1 truth and are not derived from any prior drift work (the drift sprint having been deferred per Section 1.5).

### 2.1 WF-01 core envelope (emitted to leaves via WF-02 or directly to WF-21)

WF-01 already does `SELECT … FROM users WHERE phone_number = …` reading ~20 columns. The layered principle: emit a slim core; leaves SELECT extras only if needed.

**Core envelope (always emitted):**

| Field | Type | Required | Source | Used by |
|---|---|---|---|---|
| `phoneNumber` | E.164 string | required | WF-00 parse output | All leaves (top-level phone — canonical; `user.phone_number` is a mirror, do not consume for phone-only purposes) |
| `messageType` | enum: `text` / `interactive` | required | WF-00 parse output | Routing |
| `messageContent` | string | required | WF-00 parse output | All free-form-text leaves → WF-25 |
| `user.id` | integer | required | users SELECT | Every leaf doing DB writes |
| `user.phone_number` | E.164 string | required | users SELECT | Mirror — do not consume for phone-only purposes (use top-level `phoneNumber`) |
| `user.name` | string | required | users SELECT | Display in all user-facing + admin messages |
| `user.status` | enum (state-machine value) | required | users SELECT | Routing + state guards |
| `user.slack_channel_id` | string or null | required | users SELECT | Every leaf posting to consult channel |
| `user.current_consultation_id` | integer or null | required | users SELECT | Consultation-active leaves (WF-43, WF-44) |
| `pendingUser` | `{id, contact_name}` or null | required (object reference, null if no row) | pending_users SELECT | WF-22 path detection |

**Out of core (leaves SELECT if needed):** `date_of_birth`, `time_of_birth`, `place_of_birth`, `total_consultations`, `context`, `awaiting_feedback`, `stage`, `feedback`, `created_at`, `updated_at`, `last_message_at`, `blocked_at`, `blocked_by`, `blocked_reason`.

**WF-01 envelope consumers** — every direct or indirect callee is audited in Section 3.4:
- WF-02 (router; defense-in-depth guard added)
- WF-21 (called via WF-02 on the new-user path; WF-21's `wasOptedOut` legacy branch is dead code post-TD-DCP-107)
- WF-26 (called directly by WF-01 on the opted-out → re-engage path; added 2026-05-25 by TD-DCP-106; consumes the envelope's `wasOptedOut:true` variant — `user.status='opted_out'`, `pendingUser:null`)
- 9 state-specific leaves routed by WF-02: WF-20, WF-22, WF-23, WF-30, WF-31, WF-32, WF-40, WF-43, plus WF-21 listed above

### 2.2 WF-10 core envelopes

WF-10 already loads `id, status, name, phone_number FROM users WHERE slack_channel_id = …` for user-targeted commands. Core envelopes mirror WF-01's shape where overlap exists, plus admin/command fields.

**Core envelope to WF-11:**

| Field | Type | Required | Used by |
|---|---|---|---|
| `commandType` | enum: `APPROVE_PAYMENT` / `REJECT_PAYMENT` / `CLOSE_CONSULT` / `BLOCK` / `UNBLOCK` / `LIST` / `STATS` / `HELP` (8 values) | required | WF-11 Switch |
| `phoneNumber` | E.164 string or null | required (null for admin-wide cmds: LIST / STATS / HELP) | WF-33 / 34 / 42 / 46 |
| `reason` | string | **optional**, default `""`; required non-empty only when `commandType == 'BLOCK'` | WF-46 confirmation |
| `adminUserId` | Slack U-ID string | required | Intended for `payments.verified_by` on APPROVE (note: TD-DRIFT-017 is a separate WF-33 logic bug — out of Phase 1 scope) |
| `channelId` | Slack C-ID string | required | Reply context |
| `channelName` | string | required | Display |
| `messageText` | string | required | Audit / debugging |
| `user` | `{id, name, phone_number, status, slack_channel_id}` or null | required (null for admin-wide cmds or orphan channels) | All user-targeted command handlers |

**Core envelope to WF-41 (admin → user text relay):**

| Field | Type | Required | Used by |
|---|---|---|---|
| `phoneNumber` | E.164 string | required | WF-41 → WF-50 |
| `messageText` | string | required | Body of WhatsApp message |
| `user` | `{id, name, phone_number, status, slack_channel_id, current_consultation_id}` | required | WF-41 message context |
| `adminUserId` | Slack U-ID string | required | Audit |
| `channelId`, `channelName` | strings | required | Audit |

**WF-10 envelope consumers** — audited in Section 3.4:
- WF-11 (defense-in-depth guard added; receives `commandType` envelope)
- WF-41 (receives admin-relay envelope)
- WF-33, WF-34, WF-42, WF-46 (receive WF-11's passthrough of the `commandType` envelope)

### 2.3 WF-50 input contract

**Required (always):**
- `phoneNumber` — E.164 string.
- `messageType` — enum: `text` | `interactive` | `template`.

**Required by variant (discriminated union):**
- `messageType == 'text'`: `messageContent` — non-empty string.
- `messageType == 'interactive'`: `interactivePayload` — object matching WA interactive schema (`type`, `body`, `action`).
- `messageType == 'template'`: `templateName` — string; `templateParams` — array.

**Optional logging context (pass-through to WF-60):** `userId`, `consultationId`, `inboundMessageId`, `userMessage`.

**Removed from contract:** `message`, `messageBody` fallback keys — entry guard throws on any caller still using these.

**Entry guard pseudo-code (canonical reference; identical pattern for all 6 guards):**

```javascript
const i = $input.first().json;
if (!i.phoneNumber || typeof i.phoneNumber !== 'string') throw new Error('WF-50 contract: phoneNumber required (E.164 string)');
if (!['text','interactive','template'].includes(i.messageType)) throw new Error('WF-50 contract: messageType must be text|interactive|template, got: ' + i.messageType);
if (i.messageType === 'text' && (!i.messageContent || typeof i.messageContent !== 'string')) throw new Error('WF-50 contract: text variant requires non-empty messageContent');
if (i.messageType === 'interactive' && (!i.interactivePayload || typeof i.interactivePayload !== 'object')) throw new Error('WF-50 contract: interactive variant requires interactivePayload object');
if (i.messageType === 'template' && (!i.templateName || !Array.isArray(i.templateParams))) throw new Error('WF-50 contract: template variant requires templateName + templateParams[]');
return [{ json: i }];
```

### 2.4 WF-51 input contract

**Required:** `channelId` (Slack C-ID string), `messageText` (non-empty string).
**Optional logging context:** `userId`, `consultationId`.
**Entry guard:** check `channelId` matches `^[CDG][A-Z0-9]+$`, `messageText` non-empty string.

### 2.5 WF-52 input contract

**Required:**
- `phoneNumber` — E.164 string (canonical; `phone_number` fallback removed).
- `name` — string (canonical; `userName` fallback removed).
- `userId` — integer.

**Output:** `{success, channelId, channelName, channelUrl, isNew}` (matches current live).
**Entry guard:** throws on missing/wrong-type. **WF-52 has exactly one caller in live: WF-22** (verified by grep of WF-52's n8n ID `IO5BZLUxuVmjzk5I` across `workflows/*.json`).

### 2.6 WF-60 input contract (discriminated by transport)

**Required (always):** `transport` (`wa` | `slack`), `direction` (`inbound` | `outbound`), `messageType` (string), `content` (string or null — null acceptable for non-text types where content is in metadata).

**Required by transport:**
- `transport == 'wa'`:
  - `phoneNumber` — required when `userId` absent (user lookup key)
- `transport == 'slack'`:
  - `slackChannelId` — required when `userId` absent (user lookup key)
  - `slackMessageTs` — always required

**Optional:** `userId` (resolved internally if absent), `consultationId`, `whatsappMessageId`, `metadata`.

**Filter fields:** TD-034 whitespace-only filter and pre-onboarding-skip behaviour unchanged.

**Entry guard:** throws on missing `transport` / `direction` / `messageType`; throws on transport-required fields missing.

### 2.7 WF-02 entry guard

Single Code node at WF-02 entry validating the WF-01 envelope (Section 2.1). Same hard-fail pattern. No other WF-02 changes (the consultation-router envelope to consultation-active leaves remains Phase 2).

### 2.8 WF-11 entry guard

Single Code node at WF-11 entry validating the WF-10 `commandType` envelope (Section 2.2). Same hard-fail pattern. No other WF-11 changes.

---

## Section 3 — Caller and Consumer Migration

This section describes WHAT changes per workflow. It deliberately does NOT prescribe per-item bash audit snippets, caller-list discovery, or migration order — `build-sprint` (via `discover-current-state`, the cross-cutting audit discipline, and Mode A/B/C/D execution-mode planning) owns those mechanics. The execution-ordering rules in Section 4 are constraints, not procedures.

### 3.1 Utility caller alignment (WF-50, WF-51, WF-52, WF-60)

For each utility, every caller's payload-prep node (Code or Set; if `mappingMode=passthrough`, the upstream node) is verified to emit the canonical contract from Section 2. Renames where applicable:

- **WF-50:** rename `message` / `messageBody` legacy keys to canonical `messageContent`; add explicit `messageType: 'text'` where omitted; add optional logging context where caller has it.
- **WF-51:** standardise on `channelId` and `messageText`. **Note:** WF-10 alone contains 6 distinct `Prepare WF-51 Payload …` Code nodes (Orphan Channel Alert, Wrong Channel Admin, Help Prompt, Wrong Channel User, Phone Absent, Phone Mismatch, Wrong State) — each must comply individually.
- **WF-52:** WF-22's `Ensure Slack Channel Exists (WF-52)` Execute-Workflow node renames `phone_number` → `phoneNumber`, `userName` → `name`. WF-52 has one caller; no other caller audit needed.
- **WF-60:** the 4 transport entry points (WF-00 WA inbound, WF-10 Slack inbound, WF-50 WA outbound, WF-51 Slack outbound) each have a `Build WF-60 Payload …` Code or Set node. Verify each emits the canonical shape per Section 2.6 for its transport+direction combination.

The actual caller list per utility is rediscovered live by `discover-current-state` during `plan-sprint`. Counts here are reference, not authoritative: ~18 WF-50 callers, ~14 WF-51 callers, 1 WF-52 caller, 4 WF-60 callers.

### 3.2 Router envelope emission (WF-01, WF-10)

- **WF-01:** restructure to emit the Section 2.1 core envelope on every output branch (to WF-02, to WF-21 directly). The existing 20-column users SELECT is preserved; the envelope construction lives in a `Build WF-01 Envelope` Code node before the outputs branch.
- **WF-10:** restructure to emit the Section 2.2 envelope on WF-11 and WF-41 output branches. The existing user-load SELECT is preserved; the envelope construction lives in `Build WF-10 Command Envelope` and `Build WF-10 Relay Envelope` Code nodes.

### 3.3 Defense-in-depth entry guards (WF-02, WF-11)

Add a single `Validate Inputs` Code node at the entry of each, validating the envelope its router emits. Same hard-fail pattern as the 4 utility guards (Section 2.3 snippet).

### 3.4 Envelope-consumer audit (every leaf, both routers)

Two types of cleanup per consumer:

**Type A — remove redundant `Load User` SELECTs.** Confirmed candidates from prior audit:

| WF | Workflow ID | Node to remove | Fields now from envelope |
|---|---|---|---|
| WF-32 | `emUOLWVZiNVxcOe3` | `Load User Channel from DB` | id, name, phone_number, slack_channel_id |
| WF-42 | `fx70vqyJtRdF2DgR` | `Load User by Phone` | All consumed fields in core envelope |
| WF-33 | `NcHZedq9ycnAQ9SW` | `Load User by Phone` | All consumed fields in core envelope |
| WF-46 | `UV62An60fzflU0uD` | `Load User by Phone` | All consumed fields in core envelope |
| WF-44 | `Du2CJ3OTohRFZYoA` | `Load User for Relay` | All consumed fields in core envelope |
| WF-41 | `6PzJRZsF7k2d9hV7` | `Load User for Relay` (WF-10 envelope) | id, name, phone_number, status, slack_channel_id, current_consultation_id |

**Additional candidates surfaced by `discover-current-state` during `plan-sprint`** — every WF-01 or WF-10 envelope consumer not in the table above is checked:

- **WF-21** (called by WF-01 direct + WF-02): audit for any user-load node that the new envelope renders redundant.
- **WF-22, WF-23, WF-30, WF-31, WF-20, WF-40, WF-43**: same audit.
- **WF-34** (WF-10 consumer via WF-11 passthrough): same audit.

For each removal:
1. Identify downstream nodes referencing the removed Load-User node.
2. Rewrite those references to read from the trigger envelope.
3. Test the leaf end-to-end (covered by the per-unit monitor-test-run smoke; Section 6).

**Type B — canonical top-level `phoneNumber` reads** (instead of `user.phone_number` for phone-only purposes). Type A cleanups often resolve these incidentally; remaining cases are caught by the same audit.

**Pseudo updates:** every consumer's `.pseudo` `Inputs:` block is rewritten to declare the new envelope it consumes.

---

## Section 4 — Sequencing constraints

This section gives `plan-sprint` the hard constraints it must respect when ordering items. It does not prescribe the order — `plan-sprint` derives that from the constraints below plus its own dependency detection.

### 4.1 Hard constraints

1. **Snapshot before first edit.** `scripts/snapshot-for-sprint.sh data-contract-phase-1` must run before any workflow JSON is modified, period.
2. **Per-unit testability.** Each unit (a utility + its callers, or a router + its consumers) must be independently smoke-testable end-to-end before the next unit starts.
3. **Defense-in-depth guards depend on their routers.** WF-02's guard depends on WF-01's envelope being deployed first. WF-11's guard depends on WF-10's envelope.
4. **Leaf Type A cleanups depend on their router's envelope being deployed first.** A leaf cannot drop its `Load User` SELECT until the envelope provides the fields.

### 4.2 Recommended unit order (not prescribed — `plan-sprint` may re-order based on dependency-graph analysis)

Ascending blast radius — smaller units first to build operational confidence:

| Suggested step | Unit | Why this order |
|---|---|---|
| 1 | Snapshot + rollback drill | Validates the rollback mechanism on a low-stakes change before any real edit |
| 2 | WF-52 utility (1 caller: WF-22) | Smallest; fastest validation of entry-guard pattern + payload-prep rename |
| 3 | WF-60 utility (4 transport callers) | Confirms discriminated-union guard pattern works |
| 4 | WF-51 utility (~14 callers; 6 of them inside WF-10) | Audit-and-rename at scale |
| 5 | WF-50 utility (~18 callers) | Highest-traffic utility; most learning by then |
| 6 | WF-01 envelope + WF-02 guard + leaf cleanups (WF-21, WF-32, WF-42, WF-33, WF-46, WF-44, WF-22, WF-23, WF-30, WF-31, WF-20, WF-40, WF-43) | Largest unit; leverages all prior utility experience |
| 7 | WF-10 envelope + WF-11 guard + WF-41 cleanup + WF-33/34/42/46 consumer overlap | Most coupled chain; benefits from Unit 6's leaf prep |

### 4.3 Rollback procedure

In-flight needs-decision / blocker handling is owned by `build-sprint` (its `needs-decision` discipline and audit-vs-reality drift handling). This design only specifies sprint-level rollback:

- **Per-unit rollback:** `scripts/restore-from-snapshot.sh data-contract-phase-1 --workflows WF-XX,WF-YY` for the workflows touched in the failing unit; other units' work unaffected.
- **Sprint-level rollback trigger:** two units rolled back in succession → `build-sprint` halts the sprint via its standard `blocked` state on the next item; user reassesses design assumptions.

### 4.4 What "done" looks like at sprint end

- All units committed + pushed.
- Snapshot folder retained (not deleted on completion).
- `docs/workflow-registry.md` updated for entry-guard additions.
- All affected `.pseudo` `Inputs:` blocks match the enforced contract.
- One end-to-end smoke per critical path recorded post-sprint, attached to sprint handoff.
- `feedback_data_contract_discipline.md` memory written capturing the pattern.

---

## Section 5 — Snapshot and Restore

Full design lives in [`snapshot-restore-design.md`](./snapshot-restore-design.md). One-paragraph summary here for orientation:

Two bash scripts (`scripts/snapshot-for-sprint.sh` and `scripts/restore-from-snapshot.sh`) provide all-or-selective rollback for any sprint. Snapshot pulls fresh JSON from n8n via API and copies the matching `.pseudo` / `.md` to a dated folder containing a `manifest.json`. Restore is dry-run-capable and selective (by `WF-XX` short name or by n8n ID). Both are bash + curl + jq, no new dependencies. Implementation is the sprint's first task (~1 session, both scripts <100 lines).

---

## Section 6 — Testing and Acceptance (via `monitor-test-run` skill)

Pre-live, no automated test framework exists. All testing in this sprint is conducted via the `n8n-whatsapp-methodology:monitor-test-run` skill. The skill owns baseline capture, user-paced action/tick monitoring, cross-checks against expected behaviour, and the 3-layer HTML report per session.

Output artefacts land under `docs/artefacts/tests/<type>-<slug>-<YYYY-MM-DD>/`, NOT under the sprint folder. The sprint folder cross-references these test session folders in its handoff.

### 6.1 Test sessions required by this sprint

Each session below is one fresh `monitor-test-run` invocation (one session folder, one HTML report).

| # | When | Skill invocation params | Scope |
|---|---|---|---|
| 1 | Sprint Day 0, before snapshot or any edit | `type=smoke`, `slug=phase1-baseline` | Capture the canonical-behaviour baseline. Exercise all 13 critical paths in 6.2. Anchor for the rest of the sprint. |
| 2 | After snapshot script written + run + before Unit 1 | `type=patch-validation`, `slug=phase1-rollback-drill` | Validate snapshot+restore mechanics (6.3). Short session; no business-flow testing. |
| 3 | After WF-52 unit completes | `type=smoke`, `slug=phase1-unit2-wf52` | Form-submit flow exercises WF-52 entry guard + WF-22 canonical payload. |
| 4 | After WF-60 unit | `type=smoke`, `slug=phase1-unit3-wf60` | Trigger all 4 transport+direction combos; verify `messages` rows. |
| 5 | After WF-51 unit | `type=smoke`, `slug=phase1-unit4-wf51` | Trigger Slack-emitting paths including all 6 WF-10 alert payloads. |
| 6 | After WF-50 unit | `type=smoke`, `slug=phase1-unit5-wf50` | Trigger text + interactive + template variants; include deliberate contract-violation test (6.2). |
| 7 | After WF-01 envelope + WF-02 guard + leaf cleanups | `type=smoke`, `slug=phase1-unit6-wf01-envelope` | Re-run inbound-WA paths for all user states; verify removed Load-User SELECTs show as fewer node executions vs Session #1. |
| 8 | After WF-10 envelope + WF-11 guard + WF-41 cleanup | `type=smoke`, `slug=phase1-unit7-wf10-envelope` | Re-run all 8 admin command types; verify WF-11 entry guard fires on canonical envelope. |
| 9 | After Unit 7 closes + all unit smokes green | `type=regression`, `slug=phase1-final-regression` | Re-run every path from Session #1; compare against baseline `story.md`. |

Pre-invocation for every session: ensure `session-start` prerequisites are met (n8n tunnel open, MCPs reachable).

### 6.2 What each session must exercise

**Session #1 (baseline) — 13 critical paths:**

| # | Path | Action narrated | Expected behaviour |
|---|---|---|---|
| 1 | Inbound WA — new user | "hi" from fresh test phone | WF-00 → WF-01 → WF-21; `pending_users` row created; welcome + form sent |
| 2 | Inbound WA — existing user (payment_pending) | Pre-set status; send any text | WF-00 → WF-01 → WF-02 → WF-31; UPI reminder sent |
| 3 | Inbound WA — existing user (consultation_active) | Pre-set status; send any text | WF-00 → WF-01 → WF-02 → WF-43; admin Slack relay; consult-channel post |
| 4 | Form submit happy path | Tap form CTA, fill, submit | WF-22; `users` row created; WF-52 creates `consult-{phone}`; user receives confirmation |
| 5 | Slack APPROVE PAYMENT | `APPROVE PAYMENT <phone>` in consult channel | WF-10 → WF-11 → WF-33; `payments.status='verified'`; user WA notification; admin Slack confirmation |
| 6 | Slack REJECT PAYMENT | `REJECT PAYMENT <phone> <reason>` | WF-10 → WF-11 → WF-34; `payments.status='rejected'`; user notified |
| 7 | Slack CLOSE | `CLOSE CONSULT <phone>` | WF-10 → WF-11 → WF-42; `consultations.status='closed'`; feedback prompt sent |
| 8 | Slack BLOCK | `BLOCK <phone> <reason>` | WF-10 → WF-11 → WF-46; `users.status='blocked'`; admin Slack confirmation |
| 9 | Slack UNBLOCK | `UNBLOCK <phone>` | WF-10 → WF-11 unblock branch; `users.status` cleared from `blocked` |
| 10 | Slack LIST | `LIST` in any channel | WF-10 → WF-11 → list response posted |
| 11 | Slack STATS | `STATS` in any channel | WF-10 → WF-11 → stats response posted |
| 12 | Slack HELP | `HELP` in any channel | WF-10 → WF-11 → help response posted |
| 13 | STOP keyword | "STOP" from test phone (any state) | WF-20 → WF-47; `users.status='opted_out'`; admin notification |

**Sessions #3–#8 (per-unit smokes) — scope per unit:**

- **#3 WF-52:** trigger fresh WF-22 form submission → confirm WF-52 entry guard accepts WF-22's renamed payload; channel created; both admins invited; `users.slack_channel_id` written.
- **#4 WF-60:** send one WA inbound, one WA outbound (via APPROVE PAYMENT trigger), one Slack inbound (admin command), one Slack outbound (admin notification). Cross-check 4 rows in `chinmay_astro.messages`.
- **#5 WF-51:** exercise all 6 WF-10 alert payloads + at least 2 other WF-51 callers (e.g., APPROVE PAYMENT user notification, feedback prompt).
- **#6 WF-50:** trigger all 3 message-type variants — text, interactive, template. Plus deliberate contract-violation: narrate "temporarily editing a caller to send `messageContnt` typo; expect WF-50 entry guard to throw"; verify failed-execution row; revert; re-test green.
- **#7 WF-01 envelope + WF-02 guard:** re-run inbound-WA paths for each user state. Cross-check that envelope-consuming leaves no longer contain the removed Load-User nodes. Use skill's execution-fetch to inspect node lists.
- **#8 WF-10 envelope + WF-11 guard:** re-run all 8 admin command types. Cross-check WF-11 entry guard accepts envelope; WF-41 admin-text relay works; downstream consumer cleanups don't regress command-handling.

**Session #9 (final regression):** re-narrate every action from Session #1; cross-check against Session #1's `story.md`.

### 6.3 Rollback drill (Session #2)

1. Pick a low-stakes workflow in the snapshot (e.g., WF-52).
2. Make a trivial in-place edit in n8n (rename a node, change a label).
3. Run `scripts/restore-from-snapshot.sh data-contract-phase-1 --workflows WF-52 --dry-run`; verify diff prints, no n8n writes.
4. Run real restore; cross-check no failed executions.
5. Re-export WF-52; diff against snapshot — expect byte-identical (modulo `updatedAt`).

If drill fails → halt sprint, fix script, re-drill in a new monitor-test-run session.

### 6.4 Pass criteria for sprint close

The Session #9 (final regression) report must show:

- All Session #1 baseline paths reproduce green.
- All 6 entry guards active — verified by one deliberate contract-violation per guard (narrated in Sessions #3–#8 or in #9); each must produce a failed execution in n8n with the entry-guard's `Error` message.
- Per-path execution-node-count reduction documented for Type A cleanup paths.
- No new failed executions in the n8n execution log in the 30 minutes following Session #9 close.
- All 9 session HTML reports retained and committed.

### 6.5 What's NOT tested

- **Performance / throughput:** pre-live, message volume is single-digit; no perf regression risk.
- **WhatsApp Flow form encryption:** unrelated to Phase 1.
- **WF-25 intent classifier accuracy:** Phase 1 doesn't touch WF-25.
- **The 5 real bugs in §1.5:** TD-DRIFT-006, -007, -009, -017, -001. They remain post-sprint; documented in handoff for the post-Phase-1 bug-fix sprint.

### 6.6 Sprint folder + test session folders

After sprint completion:

`docs/artefacts/sprints/<sprint-slug>/`:
- `state.md` (from `plan-sprint` / `build-sprint`)
- `handoff.md` summarising the sprint, residual drift work, the 5 known bugs still open, and cross-references to the 9 test session folders

`docs/artefacts/tests/` (produced by `monitor-test-run`, one folder per session):
- `smoke-phase1-baseline-YYYY-MM-DD/`
- `patch-validation-phase1-rollback-drill-YYYY-MM-DD/`
- `smoke-phase1-unit2-wf52-YYYY-MM-DD/` … through `smoke-phase1-unit7-wf10-envelope-YYYY-MM-DD/`
- `regression-phase1-final-regression-YYYY-MM-DD/`

Each session folder contains its own `session.md`, `tldr.md`, `story.md`, `followups-*.md` (if any), and `report.html` per the skill's conventions.
