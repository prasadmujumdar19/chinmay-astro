# Pseudo + .md Review — Sprint `data-contract-discipline-phase-1`

| Field | Value |
|-------|-------|
| Sprint | `data-contract-discipline-phase-1` (Waves 1 + 2) |
| Baseline commit | `7bb6780` (parent of `425ad0f`; pre-sprint, post `pseudo-md-drift-fixes`) |
| Head commit | `cedf7f7` (sprint close) |
| Branch | `claude/data-contracts-review-ZEdQR` |
| Reviewer | Claude — `claude-opus-4-7` (orchestrator) + 24 Sonnet subagents (per-WF) |
| Method | Bespoke `.pseudo` + `.md` review per the approved plan at `/root/.claude/plans/we-recently-did-huge-synchronous-jellyfish.md` |
| UTC timestamp | 2026-05-24T23:19:39Z |
| Findings JSON (raw) | `/tmp/claude-scratch/dcp-review/findings/WF-*.json` (24 files; ephemeral) |

## 1. Executive summary

| Severity | Count | WFs affected |
|----------|-------|--------------|
| **Blocker** | 5 | WF-01 (2), WF-20 (1), WF-52 (1), WF-60 (1) |
| **Major** | 9 | WF-01, WF-10 (2), WF-22, WF-33, WF-43, WF-50, WF-51, WF-00 (Minor) |
| Minor | 57 | spread across 21 WFs |
| Nit | 51 | spread across 22 WFs |
| **Clean** verdict | 7 of 24 | WF-23, WF-32, WF-40, WF-41, WF-42, WF-44, WF-46 |

**Top-line:** The contract-discipline scaffolding (entry guards, envelopes, Load-User removals) landed largely as designed, BUT **one Blocker (WF-01 `slack_channel_id` missing from `Prepare User Data`) silently breaks every consult-channel-posting consumer that was just re-wired to read from the envelope** — it MUST be fixed before sprint testing. Three other Blockers are real (WF-52 `userName` key, WF-60 `slackMessageTs` enforcement scope, WF-20 `userStatus` carry-forward), one is pre-existing (TD-DRIFT-006).

A second high-leverage finding (see §2 cross-cutting): **the `.md` generator was updated between 2026-05-22 and 2026-05-24 to emit error-handling properties (`onError`, `retryOnFail`) that the previous generator silently dropped.** This likely downgrades 5 of the 9 Majors from "unexplained drift" to "regen surfacing of pre-existing config" — but each one warrants user confirmation.

## 2. Scope & method

### Scope

- **24 modified WFs** with `.pseudo` + `.md` diffs reviewed against `git diff 7bb6780..HEAD`:
  WF-00, 01, 02, 10, 11, 20, 21, 22, 23, 30, 31, 32, 33, 34, 40, 41, 42, 43, 44, 46, 50, 51, 52, 60.
- **Spot-check tier** (`.md` only, no `.pseudo` touch): WF-25, WF-45, WF-47, `INDEX.md`. All four reviewed inline — see §4 cross-cutting #1.
- **Three review dimensions** applied to every WF: (A) `.pseudo` internal coherence; (B) `.pseudo` ↔ `.md` drift; (C) `.md` functional-regression scan vs. sprint intent.

### Out of scope (deliberate)

- Workflow JSON content (`workflows/*.json`) — user kept `.md` as the live-state proxy.
- Live n8n state via MCP — would require the SSH tunnel that is open from the user's laptop, not from this remote container.
- Phase-2 deferrals: TD-DRIFT-001 / 006 / 007 / 009 / 017 (per `design.md §1.5`).
- `superpowers:code-review` and `n8n-whatsapp-methodology:technical-code-review` skills — not registered in this remote container. **If you run them locally**, their findings can be reconciled against this report by WF + finding title.

### Method

Per-WF reviews dispatched as 4 batches × 6 Sonnet subagents (24 total, all completed in ~6 min wall-clock). Each subagent received a self-contained brief with the diff pair, the contract block (`design.md §2.1–§2.8`), a per-WF intent line from `state.md`, and the relevant `wave-2-plans/sub-*.md`. Each wrote a structured findings JSON to disk; the parent did cross-cutting synthesis from the 24 JSONs.

## 3. Findings table — Blockers + Majors only

| WF | Dim | Severity | Title | Evidence (first line) | Recommended action |
|----|-----|----------|-------|----------------------|--------------------|
| WF-01 | B | **Blocker** | Build WF-01 Envelope reads `d.user.slackChannelId` but Prepare User Data never maps `slack_channel_id` to `slackChannelId` — `user.slack_channel_id` will always be null in the emitted envelope | WF-01.md: Build WF-01 Envelope jsCode reads `d.user.slackChannelId`; Prepare User Data jsCode maps id, phoneNumber, name, …, currentConsultationId — `slackChannelId` absent | Add `slackChannelId: userResult.slack_channel_id` to the userData object inside Prepare User Data jsCode (live n8n fix on WF-01) |
| WF-01 | C | **Blocker** | Same as B Blocker — visible in `.md` diff (Prepare User Data unchanged; Build WF-01 Envelope new, reads a missing field) | WF-01.md.diff: Build WF-01 Envelope new node references `d.user.slackChannelId`; Prepare User Data not in diff | Live n8n hotfix on Prepare User Data — single-line addition |
| WF-20 | B | **Blocker** | `Call WF-47 Unsubscribe` passes `$json.userStatus` which Normalize Keyword never sets — STOP path passes undefined to WF-47 | WF-20.md: Call WF-47 workflowInputs has `userStatus: $json.userStatus`; Normalize Keyword assigns only keyword/phoneNumber/userId/messageText | Pre-existing TD-DRIFT-006. Either (a) verify WF-47 handles empty userStatus safely (and downgrade to Major), or (b) add userStatus carry-forward in Normalize Keyword + WF-01 envelope passthrough. Also update pseudo Step 5 to match reality. |
| WF-52 | B | **Blocker** | `Prepare Channel Name` jsCode still emits `userName:` key + has dead-code `phone_number`/`userName` fallbacks — contradicts pseudo and §2.5 contract | WF-52.md:69 jsCode: `const phoneNumber = input.phone_number \|\| input.phoneNumber \|\| '';` and emits `userName:` key. Pseudo Step 3 + Inputs block claim fallbacks removed. | Update Prepare Channel Name jsCode: (1) remove `input.phone_number \|\|` fallback (entry guard already enforces canonical key); (2) rename emitted `userName` key to `name`; (3) drop `\|\| input.userName` fallback. Verify no downstream node in WF-52 reads `$json.userName`. |
| WF-60 | B | **Blocker** | `slackMessageTs` enforcement scope diverges between pseudo and .md — pseudo says direction-scoped; .md implements inside `if (!userId)` block | WF-60.pseudo:66 Step 2: "transport == 'slack' AND direction == 'outbound' AND slackMessageTs absent" — standalone check. WF-60.md:109 Validate Inputs jsCode: check is INSIDE `if (!userId)` block. | §2.6 plain reading aligns with pseudo (no userId qualifier). **Decision needed:** if pseudo is canonical, move the slackMessageTs check outside the `!userId` block in WF-60.md (live n8n fix). If the `!userId` qualifier is intentional, update both `design.md §2.6` and `WF-60.pseudo` to reflect it. |
| WF-01 | A | Major | Step 9 pseudo claims opted-out envelope carries full user row, but implementation emits `user:null` | WF-01.pseudo:37 says "re-SELECT or carry forward the full user row"; WF-01.md Build WF-01 Envelope (Opted-Out) jsCode hardcodes `user: null, pendingUser: null` | Reconcile pseudo Step 9 to acknowledge `user:null` is intentional on the opted-out branch (WF-21 re-engagement does not need user.slack_channel_id). Update prose. |
| WF-01 | B | Major | Pseudo Step 12 documents Prepare User Data mapping of slackChannelId but the actual jsCode omits it | WF-01.pseudo:43 lists slackChannelId in the camelCase mapping list; WF-01.md Prepare User Data jsCode does NOT include it | Live n8n fix is the same as the Blocker above; pseudo is already correct. |
| WF-10 | A | Major | Command Envelope `user.slack_channel_id` will always be null — gap undocumented in Step 22 | WF-10.pseudo:99 Step 17 SELECT lists `id, status, name, phone_number` (no slack_channel_id); Step 22 claims envelope emits it. `state.md` followup #2 already notes `current_consultation_id` gap but not `slack_channel_id`. | Either (a) add slack_channel_id to the Load User Status SELECT, or (b) document the gap in Step 22 like Step 23a does. Update `state.md` followup #2 to name both missing columns. |
| WF-10 | C | Major | Webhook trigger gained `onError:continueRegularOutput` — not in any sub-plan | WF-10.md.diff line ~357: `onError:continueRegularOutput` on the Slack Events Webhook. sub-6b.md `node_modifications: []`. | **Likely surfaced by the new `.md` generator** (see §4 cross-cutting). Confirm whether the property pre-existed in n8n; if yes, downgrade to Minor. |
| WF-22 | C | Major | Create User Record gained `onError:continueRegularOutput` — not in sub-10 plan | WF-22.md.diff: onError added to Create User Record (UPSERT). sub-10.md `node_modifications: []`. | Same as WF-10 — likely generator-surfacing. **If real**, this is risky: continueRegularOutput on a UPSERT silently passes empty rows downstream to Prepare WF-52 Payload. Verify in n8n before clearing. |
| WF-33 | B | Major | Extract Command Data jsCode sets `adminUserId: input.channelId` — stale pre-envelope mapping | WF-33.md:47 jsCode: `adminUserId: input.channelId`; §2.2 envelope emits adminUserId as a first-class field. | Update Extract Command Data jsCode to read `adminUserId: input.adminUserId` (not input.channelId). Live n8n fix. |
| WF-43 | C | Major | `retryOnFail:true / maxTries:3` added to Gemini General Response HTTP node — no sub-12.md evidence | WF-43.md.diff: retryOnFail block on Gemini HTTP node. sub-12.md WF-43 section only lists Extract Gemini Reply jsCode change. | Same as WF-10/22/50/51 — likely generator-surfacing. If real, retry on a Gemini call is defensible but should be documented. |
| WF-50 | C | Major | `retryOnFail:true / maxTries:3` on Send Interactive / Send Template / Send Text Message — no sub-3 evidence | WF-50.md.diff lines 48–78: three send nodes each gained the retry block. sub-3 scope: guard + Build WF-60 Payload audit only. | Same as above — likely generator-surfacing of pre-existing retry policy. Confirm in live n8n. |
| WF-51 | C | Major | `onError:continueRegularOutput` on Call WF-60 Message Logger — no sub-4 evidence | WF-51.md.diff hunk +31..+38. sub-4 scope: guard + outbound payload audit only. | Same as above — likely generator-surfacing. |

## 4. Cross-cutting observations

### 1. The `.md` generator now emits error-handling properties (`onError`, `retryOnFail`) it previously dropped

**Evidence (smoking gun):** WF-25.md.diff shows a new `error handling: {"onError":"continueErrorOutput"}` block on the Gemini HTTP node — BUT `live_updated_at` is unchanged at `2026-05-18T12:13:36.698Z`. Since WF-25 was not edited in n8n during this sprint, the only way the property appears in the new `.md` and not the old is that the generator's serialisation changed between `generated_at: 2026-05-22T11:49:58Z` and `generated_at: 2026-05-24T18:44:35Z`.

**Implication for this review:** Five Major findings in §3 (WF-10 webhook onError, WF-22 Create User Record onError, WF-43 Gemini retry, WF-50 send-node retries, WF-51 WF-60 call onError) likely represent properties that ALREADY EXISTED in the n8n JSON before the sprint and were only surfaced by the new generator. Each warrants a spot-check via `mcp__n8n__n8n_get_workflow` (locally, with the tunnel open) to confirm whether the property pre-existed. If yes, downgrade to Minor + note in state.md as "generator-surfacing artifact".

**Implication for the project:** The `.md` generator upgrade is genuinely useful — surfaces error-handling config that affects runtime behaviour. But the upgrade should be documented as a separate concern from the data-contract sprint (e.g. in `n8n-whatsapp-methodology` plugin changelog or `state.md` planning-changes).

### 2. `slack_channel_id` is structurally absent from two envelope SELECTs (WF-01 and WF-10)

WF-01 Blocker and WF-10 Major both root-cause to the same systemic issue: the envelope contract declares `user.slack_channel_id` as required (§2.1, §2.2), but the SELECTs that feed the envelope construction are missing the column.

- WF-01: `Prepare User Data` jsCode camelCase-maps the SELECT result but drops `slackChannelId` (column IS in the SELECT — `users.*` — but the mapping omits it).
- WF-10: `Load User Status` SELECT explicitly does NOT include `slack_channel_id` (and not `current_consultation_id`, per `state.md` followup #2).

Both flow through to `user.slack_channel_id = null` in the emitted envelope, and every downstream consult-channel poster (WF-31, WF-32, WF-40, WF-41, WF-42, WF-43, WF-44) silently breaks because they were just re-wired to trust the envelope. **This is the single most important pre-test fix.**

### 3. Wave-1 minimal-change pseudo reconciliation left residual sub-letter steps

Per state.md, the Wave-1 inline reconciliation (`7b4daf7`) was deliberately minimal-change — it added the new step but did not renumber. So WF-00, WF-01, WF-02, WF-10 have `12a/12b/8a/5a` style step numbers. Multiple subagents flagged these as Minor; user has already parked this for full linear renumbering post-Phase-1. **No action needed this sprint.**

### 4. `commandType` enum drift between `design.md §2.2` and live workflows (WF-10 / WF-11)

`design.md §2.2` lists abbreviated forms (`CLOSE_CONSULT`, `BLOCK`, `UNBLOCK`); live WF-10 emits and live WF-11 validates the FULL forms (`CLOSE_CONSULTATION`, `BLOCK_USER`, `UNBLOCK_USER`). User decision is that the FULL forms (live) are canonical. **Followup: update `design.md §2.2` enum list.** This is the known cross-cutting item per manifest #1; subagents correctly flagged as Minor.

### 5. Unexpected node removals in WF-33 / WF-34 (trust-mode cleanup) beyond Load-User removal scope

WF-33 removed not just the `Load User by Phone` SELECT but also a "wrong-state IF guard" and related nodes (subagent: "now unreachable via SP-03 pre-validation"). WF-34 removed 6 dead-branch nodes (User Found?, User in Correct State?, 2× error-path Prepare WF-51, 2× error-path Call WF-51). Both are reasonable "trust the envelope, prune dead error paths" choices, but neither sub-13.md nor sub-14.md documents the dead-branch removals explicitly. **Recommend: add a one-line note to sub-13/sub-14 retroactively, OR open a follow-up describing the trust-mode cleanup as a deliberate sprint side-effect.**

### 6. Coverage check

- 24 of 24 modified WFs reviewed (one Sonnet subagent each); all 24 findings JSON files exist on disk.
- File list matches `git diff --name-only 7bb6780..HEAD -- docs/pseudocode/` exactly. No WF dropped.
- Spot-check tier (WF-25, WF-45, WF-47, INDEX.md) reviewed inline — only WF-25 surfaced new content (the generator artifact in cross-cutting #1).

## 5. Per-WF section

Sorted alphabetically by WF identifier. Each block: one-line summary of what changed, then findings grouped by dimension. Clean WFs have ✅ badge and no findings to report.

<!-- Per-WF blocks generated from /tmp/claude-scratch/dcp-review/findings/*.json -->

### WF-00 — ⚠️ 0B/0M/4m/3n

**Sprint change (one line):** Added `transport:'wa'` discriminator field to the Build WF-60 Payload (Inbound) Code node, enabling WF-60's Phase-1 entry guard to accept this call.

The only Major-shaped item (Webhook trigger `onError`) is downgraded to Minor pending the generator-artifact check per §4 cross-cutting #1. No Blocker/Major findings.

### WF-01 — ⚠️ 2B/2M/6m/0n — **HIGHEST RISK WF**

**Sprint change (one line):** Added `Build WF-01 Envelope` + `Build WF-01 Envelope (Opted-Out)` Code nodes, plus `User-Load Gate` + `Anomaly Route?` IF node, to emit the §2.1 core envelope on every output branch.

See §3 Findings Table for the two Blockers (Dim B + Dim C, same root cause) and two Majors. **The slackChannelId omission in Prepare User Data is the single must-fix-before-testing item in this review.**

Questions for human:
1. Apply the slackChannelId hotfix to Prepare User Data inline before sprint testing? (WF-02 entry guard will pass a null-slack-channel envelope without error, then every downstream consult-channel leaf silently breaks.)
2. On the opted-out branch, does WF-21 require `user.*` fields, or is `user:null` truly safe?

### WF-02 — ⚠️ 0B/0M/3m/2n

**Sprint change:** Added `Validate Inputs` entry guard (Code v2) as first node validating §2.1 envelope; trigger rewired through guard; incidental Build UNHANDLED Alert formatting improvement.

No Blocker/Major findings. One question for human: was the Build UNHANDLED Alert message format change (120→200 char truncation) intentional sub-8 scope or an opportunistic improvement?

### WF-10 — ⚠️ 0B/2M/4m/2n

**Sprint change:** Wave 1 added Command + Relay Envelope Code nodes; Wave 2 reconciled pseudo with 6 WF-51 caller renames, WF-60 Slack-inbound payload rename, and inline doc of the known-incomplete `Load User Status` SELECT.

- **Major (Dim A)** — Command Envelope `user.slack_channel_id` is structurally always null because Step 17 SELECT doesn't include the column (only `id, status, name, phone_number`). Step 22 claims envelope emits slack_channel_id. State.md followup #2 already documents the gap for `current_consultation_id` but not slack_channel_id. Update Step 22 OR the SELECT.
- **Major (Dim C)** — Webhook trigger gained `onError:continueRegularOutput` — likely generator-surfacing per §4 #1.

### WF-11 — ⚠️ 0B/0M/1m/4n — **CLEANEST WAVE-2 ENTRY GUARD**

**Sprint change:** Added Step-1 entry guard validating the 8 FULL-form `commandType` enum; renumbered 4 tombstone slots (7/9/17/20) to a clean linear 1–17.

No Blocker/Major findings. The Minor is the design.md §2.2 abbreviated-form drift (cross-cutting #4).

### WF-20 — ⚠️ 1B/0M/2m/3n

**Sprint change:** Send HELP Response renamed `messageBody → messageContent` + `messageType:'text'` added; 5 user.status ternary branches updated from flat `userStatus`; Normalize Keyword `userId` expression hardened.

- **Blocker (Dim B)** — `Call WF-47 Unsubscribe` passes `$json.userStatus` but Normalize Keyword never sets it. Pre-existing TD-DRIFT-006. Verify WF-47 handles null safely OR add the carry-forward. Pseudo Step 5 documents `userStatus` to WF-47, which is inconsistent with reality.

### WF-21 — ✅ clean (Minor docs only)

**Sprint change:** Pseudo-only declaration of §2.1 envelope consumption. No n8n changes (live_updated_at unchanged). `.md` diff is frontmatter regeneration noise only — exactly as sub-11 promised.

### WF-22 — ⚠️ 0B/1M/1m/2n

**Sprint change:** Inserted `Prepare WF-52 Payload` Set node between Create User Record → Ensure Slack Channel Exists; reshapes DB keys to §2.5 canonical shape. NO Load-User removal (Create User UPSERT is authoritative).

- **Major (Dim C)** — Create User Record gained `onError:continueRegularOutput` — likely generator-surfacing per §4 #1. If real, **higher concern**: continueRegularOutput on a UPSERT could pass empty rows downstream. Verify in n8n.

### WF-23 — ✅ clean

**Sprint change:** Pseudo-only declaration of §2.1 envelope consumption. No n8n changes (live_updated_at unchanged at 2026-05-23T09:15:21.585Z). No findings beyond two Nits.

### WF-30 — ⚠️ 0B/0M/3m/3n

**Sprint change:** Prepare Payment Reminder renamed `message → messageContent` + `messageType:'text'` added; Send Payment Reminder via WF-50 mapping updated; pseudo updated to declare WF-01 envelope consumption.

No Blocker/Major findings.

### WF-31 — ⚠️ 0B/0M/2m/6n

**Sprint change:** Removed redundant `Load User for Relay` DB SELECT; rewired trigger fan-out direct to Prepare Admin Relay; renamed legacy `message → messageContent` in Prepare Under Review Message.

No Blocker/Major findings. All STRICT findings (legacy message key, redundant Load-User SELECT) resolved.

### WF-32 — ✅ clean (0/0/0/0)

**Sprint change:** Removed `Load User Channel from DB` SELECT; rewired Call WF-50 → Prepare Admin Notification directly; jsCode reads `user.*` from §2.1 envelope via `$('When Executed by Another Workflow').item.json.user`. **Zero findings of any severity.**

### WF-33 — ⚠️ 0B/1M/5m/0n

**Sprint change:** Removed `Load User by Phone` SELECT; rewired all downstream nodes to read user fields from §2.2 Command Envelope. Also removed wrong-state IF guard nodes (trust-mode cleanup).

- **Major (Dim B)** — `Extract Command Data` jsCode sets `adminUserId: input.channelId` (stale pre-envelope mapping). §2.2 envelope emits `adminUserId` as a first-class field. Live fix: change to `input.adminUserId`. See §3.

### WF-34 — ⚠️ 0B/0M/2m/1n

**Sprint change:** Simplified `Load User by Phone` to fetch only `payment_id`; rewired Prepare Rejection Message + Prepare WF-51 Payload to read envelope user fields; removed 6 dead-branch nodes (trust-mode cleanup).

No Blocker/Major findings. **Trust-mode cleanup of dead branches is undocumented in sub-14.md — see cross-cutting #5.**

### WF-40 — ✅ clean

**Sprint change:** Removed `Load User Record` SELECT; rewired trigger direct to Call WF-25; rewrote Call WF-25 + Format Slack Message to read envelope paths. Five Nits only (timestamps, expected attribute renames).

### WF-41 — ✅ clean — **LATENT BUG FIX VERIFIED**

**Sprint change:** `Prepare WhatsApp Message` jsCode updated to read `input.messageText` (was `input.adminMessage`), so admin relay no longer emits undefined `messageContent` to WF-50.

Verified: no remaining `adminMessage` reference anywhere; output shape matches §2.3 contract.

### WF-42 — ✅ clean (0/0/0/0)

**Sprint change:** Removed `Load User by Phone` SELECT; all four downstream nodes (Close Consultation Record, Update User Status, Prepare Feedback Message, Prepare WF-51 Payload) rewired to read `user.*` from §2.2 Command Envelope. **Zero findings of any severity.**

### WF-43 — ⚠️ 0B/1M/2m/3n

**Sprint change:** Extract Gemini Reply jsCode rewritten to emit canonical WF-50 shape (`messageType:'text'` + `messageContent`), replacing legacy `message:` key.

- **Major (Dim C)** — `retryOnFail:true / maxTries:3` on Gemini General Response HTTP node, undocumented in sub-12.md. Likely generator-surfacing per §4 #1; if real, retry on Gemini is defensible.

### WF-44 — ✅ clean (0/0/0/0)

**Sprint change:** Prepare Ack Message jsCode + Send Ack via WF-50 workflowInputs both migrated from legacy `message:` to canonical `messageType:'text'` + `messageContent`. **Zero findings.**

### WF-46 — ✅ clean

**Sprint change:** Removed `Load User by Phone` SELECT; Update User to Blocked Status + Prepare WF-51 Payload rewired to read `user.{id, name, phone_number, slack_channel_id}` from §2.2 Command Envelope. One Nit only.

### WF-50 — ⚠️ 0B/1M/3m/2n

**Sprint change:** Entry guard (discriminated union: text/interactive/template) added; `transport:'wa'` emitted in both WF-60 payload nodes.

- **Major (Dim C)** — `retryOnFail:true / maxTries:3` on three send nodes, no sub-3 evidence. Likely generator-surfacing per §4 #1.

### WF-51 — ⚠️ 0B/1M/1m/3n

**Sprint change:** Added Validate Inputs entry guard (`channelId` regex + non-empty `messageText`); pseudo step-renumbered 2–6.

- **Major (Dim C)** — `onError:continueRegularOutput` on Call WF-60 Message Logger, no sub-4 evidence. Likely generator-surfacing per §4 #1.

### WF-52 — ⚠️ 1B/0M/5m/0n

**Sprint change:** Added Validate Inputs entry guard (Step 2) for `phoneNumber`/`name`/`userId`; removed `phone_number` and `userName` legacy fallbacks from pseudo Inputs; step-renumbered 1–11.

- **Blocker (Dim B)** — `Prepare Channel Name` jsCode still emits `userName:` key and contains dead-code legacy fallbacks. The dead code is harmless (guard catches first), but **the `userName:` key emission is wrong** — should be `name`. See §3.

### WF-60 — ⚠️ 1B/0M/4m/2n

**Sprint change:** Added discriminated-union Validate Inputs entry guard (Step 2) enforcing `transport`/`direction`/`messageType` + transport-specific required fields.

- **Blocker (Dim B)** — `slackMessageTs` enforcement scope diverges: pseudo says direction-scoped; .md implements inside `if (!userId)` block. **Decision needed** — §2.6 plain reading supports pseudo. See §3.

## 6. Open questions for the user

1. **(BLOCKING)** Apply the WF-01 `slackChannelId` hotfix to `Prepare User Data` before sprint testing? Without it, every consult-channel-posting consumer that was just re-wired to read from the envelope (WF-31, 32, 40, 41, 42, 43, 44) will silently emit `channelId: null` to WF-51 — which the WF-51 entry guard then rejects.
2. **(BLOCKING)** WF-60 `slackMessageTs` enforcement scope — is the pseudo right (direction-scoped) or is the `.md` right (only-if-no-userId)? §2.6 plain reading favours the pseudo.
3. **(BLOCKING)** WF-52 `Prepare Channel Name` emits `userName:` key — should be renamed to `name`. Single-line live n8n fix. Confirm no downstream node reads `$json.userName`.
4. **(BLOCKING-or-defer)** WF-20 → WF-47 `userStatus` passthrough (pre-existing TD-DRIFT-006) — verify WF-47 tolerates empty `userStatus` (downgrade to Minor) OR fix the carry-forward this sprint.
5. **(Generator artifact triage)** Confirm `onError` / `retryOnFail` properties on WF-00 (webhook), WF-10 (webhook), WF-22 (Create User Record), WF-43 (Gemini HTTP), WF-50 (3 send nodes), WF-51 (Call WF-60) were already present in n8n pre-sprint. Quickest test: `mcp__n8n__n8n_get_workflow` on each (locally), grep for the properties, compare against the pre-sprint snapshot in `workflows/pre-data-contract-phase-1-workflows/2026-05-24/`.
6. **(Documentation cleanup)** Update `design.md §2.2` enum to FULL forms (per state.md line 11 — already noted as deferred). 4 Minor flags on WF-10/11/33/34/42/46 reference this drift.
7. **(Trust-mode cleanup)** Sub-13/sub-14 didn't explicitly document the WF-33/WF-34 dead-branch removals. Retro-document, or open a follow-up describing it as a deliberate sprint side-effect?

## 7. Verification still required (out of scope of this review)

These checks were not performed in this review (remote container limitations) and should run locally before sprint testing begins:

1. **`scripts/assert-md-fresh.sh WF-XX`** for every WF in this report. Requires the SSH tunnel + `N8N_API_KEY` in `.env`. Run the WF list as:
   ```bash
   for wf in WF-00 WF-01 WF-02 WF-10 WF-11 WF-20 WF-21 WF-22 WF-23 WF-30 WF-31 WF-32 WF-33 WF-34 WF-40 WF-41 WF-42 WF-43 WF-44 WF-46 WF-50 WF-51 WF-52 WF-60 WF-25 WF-45 WF-47; do
     scripts/assert-md-fresh.sh $wf || echo "STALE: $wf"
   done
   ```
2. **`mcp__n8n__n8n_get_workflow`** spot-checks on the 6 WFs flagged in cross-cutting #1 to confirm `onError` / `retryOnFail` are not new additions.
3. **Pre-sprint-snapshot vs. current** comparison: `diff` `workflows/pre-data-contract-phase-1-workflows/2026-05-24/<wf-id>.json` against current `workflows/<wf-id>.json` for any of the 6 WFs in cross-cutting #1, to settle the generator-vs-real-change question definitively without invoking MCP.
4. **Smoke tests per `testing.md`** — the 5-session test plan was deliberately deferred to post-build per the sprint's execution model. **DO NOT run them until the WF-01 Blocker is fixed** — every consult-channel-posting consumer will silently fail otherwise.
5. **`superpowers:code-review`** and **`n8n-whatsapp-methodology:technical-code-review`** skills — not registered in this remote container's skill list. Run locally if a second-opinion pass over `.pseudo`/`.md` is desired; their findings can be reconciled against this report by WF + finding title.

## 8. Pre-test punch list (recommended order)

1. **Hotfix WF-01** — add `slackChannelId: userResult.slack_channel_id` to `Prepare User Data` jsCode. **Single-line live n8n fix.** Single highest-leverage action.
2. **Decide WF-60** — `slackMessageTs` enforcement scope (pseudo-aligned or md-aligned). Update the side that doesn't match the decision.
3. **Fix WF-52** — rename `Prepare Channel Name` output key `userName` → `name`. Verify no downstream reader.
4. **Triage WF-20** — verify WF-47 handles null `userStatus` (likely yes — most n8n nodes tolerate undefined). If yes, downgrade to Minor + update pseudo Step 5. If no, add the carry-forward.
5. **Confirm WF-10 envelope gap** — either add `slack_channel_id` to `Load User Status` SELECT or document the null-until-Phase-2 gap in pseudo Step 22.
6. **Confirm WF-33 adminUserId** — change `Extract Command Data` jsCode from `input.channelId` to `input.adminUserId`.
7. **Generator-artifact triage** — diff the 6 flagged WFs against pre-sprint snapshots to settle the `onError`/`retryOnFail` question.
8. **Run `scripts/assert-md-fresh.sh` on all 27 WFs** to confirm `.md` is current vs. live n8n.
9. **Then run sprint testing** per `testing.md`.
