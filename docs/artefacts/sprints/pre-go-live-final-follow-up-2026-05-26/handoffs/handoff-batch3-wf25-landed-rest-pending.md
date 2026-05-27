# Handoff — Batch 3 WF-25 landed, 7 workflows + caller-side add-ons pending

**Written at:** 2026-05-27T04:20:00Z
**Session covered:** Sprint resume → multi-caller verification → 2 design re-scopes → Gemini-corpus audit (new findings) → user/admin copy approval → pseudo revision → WF-25 build (Mode A jq+PUT via Python script).

---

## Stopping Point

WF-25 Intent Classifier (`eTV1lUcYrXBg2q2T`) Gemini halt-and-notify rebuild **landed and verified**. Live in n8n at 22 nodes (was 14; -1 removed `Handle Gemini Error`, +9 new). MCP `n8n_validate_workflow` strict-profile returned `valid: true` (0 errors, 39 advisory warnings — all pre-existing patterns, intentional typeVersion floor per Step 5e.1a, or false-positive IF/Switch main[1] flagged as "error output"). Lint clean (0 hard rejects). Backup at `archive/backups/eTV1lUcYrXBg2q2T-2026-05-27-03-57-manual.json`. Exported to `workflows/eTV1lUcYrXBg2q2T.json`. Pseudo (`docs/pseudocode/WF-25.pseudo`) revised + linear-numbered. State.md and workflow-registry.md updated.

Batch 3 is **1 of 8 workflows done** (WF-25). Next session resumes at WF-23.

---

## Critical Context — Read This First

This session re-scoped TD-PGF-09 significantly mid-batch. The original 2026-05-26T12:10Z locked design ("WF-25 fan-out + 5 caller-side `Is Classifier Error?` IF guards on WF-23/30/31/43/44") was REPLACED with a cleaner design after discussion with the user. The new design and a Gemini-corpus expansion now define Batch 3 scope. **Do not revert to the old design.**

### Decision #1 — Halt inside WF-25, not per-caller IFs

**Old:** WF-25 fans out apology+alerts then returns sentinel `{intentResult: 'classifier_error'}`; 5 callers each get an `Is Classifier Error?` IF after their `Call WF-25` node to bail.

**New (locked 2026-05-27T01:50Z):** WF-25's error branch terminates with a **Stop and Error** node after the fan-out. n8n's executeWorkflow contract propagates sub-workflow errors to the caller's executeWorkflow node, which halts the caller execution by default (none of the 6 callers have `onError: continueErrorOutput` set on `Call WF-25` — confirmed via grep). **No caller-side IF nodes required.** The 5 IF nodes are removed from scope.

**Rationale:** Simpler end-state, single owner of failure UX (WF-25), no per-caller drift risk, fewer nodes to maintain.

### Decision #2 — WF-40 (User → Admin Relay) explicitly excluded — no code change

Live dependency map showed WF-25 has 6 callers (WF-23/30/31/40/43/44), but the original TD-PGF-09 scope listed only 5 (omitting WF-40). User clarified the design intent for WF-40 via a screenshot of the canvas: `Call WF-25` is the FIRST node after the trigger (not after admin relay as I'd initially misread from the JSON node array — I had the connection order wrong). The workflow fans into two parallel branches from `Call WF-25`: top branch = admin relay via WF-51, bottom branch = `Stop Intent?` IF for opportunistic STOP-clarifier (Meta-compliance guard against false-unsubscribe on Gemini misclassification).

**Under the new halt-inside-WF-25 design**, when Gemini fails for WF-40's path:
- WF-25 sends apology to user + dual admin alerts + Stop and Error.
- WF-40's execution errors out at `Call WF-25` (admin relay never fires).
- **Admin loses the relayed message in this case** — acceptable trade because admin still receives the WF-25-side alert which embeds the user's text as diagnostic context. Admin can respond manually.
- WF-40 STOP-clarifier path is naturally protected — no false-unsubscribe possible because the sentinel branch never runs.

WF-40 does NOT need any code change. The documentation note in state.md (TD-PGF-09 session re-scope block) captures this.

### Decision #3 — Gemini-corpus audit expanded TD-PGF-09 by 4 sites

Corpus-wide audit (2026-05-27T01:55Z, 27 active workflows) of every Gemini HTTP call found 4 ADDITIONAL sites beyond WF-25's classifier that today halt execution silently on Gemini outage (`onError: default`):

| Workflow | Node | Channel | Same regression class as WF-25? |
|---|---|---|---|
| WF-23 | Gemini General Response | WhatsApp inbound (pre-form) | Yes — silent halt on failure |
| WF-30 | Gemini General Response | WhatsApp inbound (payment_pending) | Yes |
| WF-31 | Gemini General Response | WhatsApp inbound (payment_submitted) | Yes |
| WF-43 | Gemini General Response | WhatsApp inbound (post-consultation) | Yes |

All 4 sit on WhatsApp inbound paths → all 4 need the same halt-and-notify treatment. User approved folding into TD-PGF-09's scope (vs. tracking as separate TD-PGF-15 or deferring to post-MVP error-handling sprint).

**Notification channel rule (locked this session):** Inform Admin ALWAYS, inform User SCENARIO-BASED. All 5 current Gemini sites are WhatsApp inbound → both notify. Rule preserved for any future Gemini call on a Slack-admin inbound path (admin alert only).

### Decision #4 — WF-30 `Is Pass-Through Intent?` dead-branch cleanup added to TD-PGF-05

WF-30's IF currently tests 4 intent types but only `stop_intent` is reachable post-classifier-redesign (the other 3 — garbage/malicious_abusive/inappropriate — terminate inside WF-25 with no return to caller per Steps 11 and 14 of revised WF-25.pseudo). Simplify the IF to test only `stop_intent`. Folded into TD-PGF-05's WF-30 combined PUT.

### Decision #5 — Caller-side workflowInputs add-ons (data-contract principle)

WF-25's halt-and-notify alert template needs `userName` + `slackChannelId` for the dual-channel post. Both are already in the WF-01 envelope (`user.name`, `user.slack_channel_id`). User confirmed the data-contract principle (Phase 1, TD-DCP-052 line 178; memory `[[feedback_data_contract_discipline]]`): downstream consumers READ FROM ENVELOPE, never re-SELECT user fields already in it.

**Action for TD-PGF-05's per-caller edits:** extend each caller's `Call WF-25` `workflowInputs.value` mapping from the current 4 fields (`phoneNumber`, `userId`, `messageContent`, `userStatus`) to 6 fields (add `userName: $('When Executed by Another Workflow').item.json.user.name`, `slackChannelId: $('When Executed by Another Workflow').item.json.user.slackChannelId`). Marginal additional change inside the already-planned per-caller edit. WF-25 reads them directly from input.

**Pre-form fallback:** WF-23's pre-form users have no slackChannelId (Design Rule #2 — Slack channel created at form submission). WF-25's halt-and-notify chain has `Has Consult Channel?` IF gate that handles this — TRUE → dual-channel post; FALSE → admin-commands only. No special handling needed at caller side; just pass whatever's in the envelope (null for pre-form).

### Decision #6 — User-facing apology + admin alert copy (locked)

**User WhatsApp apology** (shared by classifier failure + General Response failure):
> Sorry — we ran into a brief technical issue and couldn't process your message just now. Dr. Chinmay has been notified and will follow up with you shortly. We apologise for the inconvenience.

**Admin alert — classifier failure (WF-25)** posted to BOTH user's consult channel AND `chinmay-admin-commands`:
> ⚠️ The intent classifier couldn't process a message just now.
>
> *User:* {name} ({phone})
> *Their state:* {state in plain English}
> *Their message:* "{text}"
> *Reason:* {short error summary}
>
> The user has been told there's a technical hiccup and that you'll follow up. Suggested action: reach out manually in their consult channel; consider a goodwill gesture (e.g. complimentary consultation) if they were mid-flow.

**Admin alert — General Response failure (WF-23/30/31/43)** posted to BOTH user's consult channel AND `chinmay-admin-commands`:
> ⚠️ The AI assistant couldn't generate a reply to a user just now.
>
> *User:* {name} ({phone})
> *Their state:* {state in plain English}
> *Their question:* "{text}"
> *Reason:* {short error summary}
>
> The user has been told there's a technical hiccup and that you'll follow up. Suggested action: respond manually in their consult channel.

**Persona:** "Dr. Chinmay" (locked — consistent with welcome-flow voice).
**State translation map:** payment_pending → "awaiting payment approval"; consultation_active → "in active consultation"; consultation_closed → "consultation completed"; payment_submitted → "payment under review"; blocked → "blocked"; opted_out → "opted out"; pre-form (no record) → "filling onboarding form". Implemented inline in the Code/Set node that builds the alert (see WF-25's `Build Admin Alert Text` Code node `jsCode`).

---

## What's Already Done (Verified)

| Item | Status |
|---|---|
| Multi-caller verification at sprint resume | ✅ Done — dep map rebuilt; 6 callers confirmed; WF-40 special case investigated and explained |
| Gemini corpus audit (TD-PGF-15) | ✅ Done — 5 sites found, 1 already covered (WF-25), 4 new (WF-23/30/31/43); zero non-HTTP Gemini paths |
| Plugin improvement logged | ✅ Done — TD-PGF-PLG-001 (always-show-consolidated-view rule for plan-sprint + build-sprint), TD-PGF-PLG-002 (Gemini error-handling channel rule) — in `followups.md` |
| User/admin copy reviewed + locked | ✅ Done — see Decision #6 above; persisted in `state.md` TD-PGF-09 section |
| WF-25.pseudo revision | ✅ Done — renumbered Steps 1-15 linear, removed tombstone, updated Ambiguities/Notes block, new Steps 4-7 for halt-and-notify |
| Dependency map rebuilt | ✅ Done — `docs/dependency-map.md` (72 edges) regenerated post-Batch-2.5 |
| WF-25 PUT | ✅ Done — landed 2026-05-27T04:07:31Z, 22 nodes, MCP strict-validate `valid: true`, lint clean, dangling-ref scan clean |

---

## What Remains (Next Session — Batch 3 continuation)

**Locked PUT order** (per state.md Batch 3 description):

| # | Workflow | n8n ID | Mode | Functional change |
|---|---|---|---|---|
| 1 | WF-25 Intent Classifier | `eTV1lUcYrXBg2q2T` | A | ✅ Done this session |
| 2 | WF-23 Pre-Form Intent Filter | `VpCER0Vqq3NYJGpI` | A | Envelope rewrite on `Call WF-25` mapping (6 fields incl. userName, slackChannelId) + add halt-and-notify to `Gemini General Response` HTTP node (onError=continueErrorOutput, error branch → apology + 2 admin alerts + Stop and Error, same shape as WF-25's chain) |
| 3 | WF-30 Payment Pending Intent Filter | `gGJBY5fJha0Let8I` | A | Envelope rewrite on `Call WF-25` mapping (6 fields) + simplify `Is Pass-Through Intent?` IF to test only stop_intent + add halt-and-notify to `Gemini General Response` HTTP node |
| 4 | WF-44 Feedback Recorder | `Du2CJ3OTohRFZYoA` | B | Envelope rewrite on `Call WF-25` mapping (6 fields) only — no General Response Gemini call here |
| 5 | WF-31 Payment Submitted Handler | `HB8nXudAtk9iXz7C` | B | Add halt-and-notify to `Gemini General Response` HTTP node + add caller-side envelope add-ons (userName + slackChannelId) on `Call WF-25` mapping |
| 6 | WF-43 Post-Consultation Handler | `3va0M06kijgyLejf` | B | Add halt-and-notify to `Gemini General Response` HTTP node + add caller-side envelope add-ons on `Call WF-25` mapping |
| 7 | WF-50 Send WhatsApp | `BUVun38WEKb12zg9` | B | Tighten message-content fallback chain in `Prepare Payload` (remove now-redundant `|| input.message || input.messageBody`) |
| 8 | WF-32 Duplicate Payment Reassurance | `emUOLWVZiNVxcOe3` | B | Cosmetic — read phone from top-level canonical envelope (`$json.phoneNumber`) instead of nested DB-row path |

**Also**: WF-40 caller-side envelope add-on (add userName + slackChannelId to its `Call WF-25` mapping per the data-contract principle, even though WF-40 has no other TD-PGF-05/09 work). Same edit shape as WF-23/30/31/43/44.

**Halt-and-notify pattern to replicate** on WF-23/30/31/43 General Response Gemini nodes — same shape as the WF-25 build this session:
1. Set `onError: continueErrorOutput` on the HTTP node.
2. Wire error branch (main[1]) to: `Build User Apology Payload` (Set v3.4, same copy) → `Send Apology via WF-50` (executeWorkflow v1.2) → `Build Admin Alert Text` (Code, slightly different template — "AI assistant couldn't generate a reply" vs "intent classifier couldn't process") → `Has Consult Channel?` (IF v2.2 with operator `notEmpty` + `singleValue: true`) → TRUE: `Build Consult Alert Payload` (Set v3.4) → `Send to Consult via WF-51` → `Build Admin Cmds Alert Payload` (Set v3.4) → `Send to Admin Cmds via WF-51` → `Stop and Error`; FALSE: → `Build Admin Cmds Alert Payload` directly.
3. Reuse Python build pattern from `/tmp/claude-scratch/<session>/wf25-build.py` (template — adapt the workflow name + the few text differences).

**IF v2.2 unary operator gotcha** (one PUT-retry I hit on WF-25):
- `notEmpty` is unary — operator config MUST include `singleValue: true` and OMIT `rightValue`.
- MCP `validate_workflow` strict-profile catches this as an ERROR (not warning). Verify after every IF v2.2 with `notEmpty`/`empty` operators.

---

## Sub-workflow IDs (cheat sheet for next session)

| WF | n8n ID | Used as |
|---|---|---|
| WF-50 | `BUVun38WEKb12zg9` | apology sends (in error chains) |
| WF-51 | `wlZRK0YxnhP0b2RL` | admin alert sends (×2 in error chains) |
| WF-25 | `eTV1lUcYrXBg2q2T` | classifier — already rebuilt this session |
| WF-23 | `VpCER0Vqq3NYJGpI` | |
| WF-30 | `gGJBY5fJha0Let8I` | |
| WF-31 | `HB8nXudAtk9iXz7C` | |
| WF-40 | `du32QBZbSQOjfESe` | caller-side envelope add-on only |
| WF-43 | `3va0M06kijgyLejf` | |
| WF-44 | `Du2CJ3OTohRFZYoA` | |
| WF-32 | `emUOLWVZiNVxcOe3` | |

`chinmay-admin-commands` Slack channel: `C0A5B0ZE81E`.

---

## Operational Notes & Gotchas

- **Scratch dir wipes between Claude turns.** `/tmp/claude-scratch/<session>/` exists but contents get cleared. Either: (a) batch fetch+build+PUT into a single Bash call, or (b) store the build script elsewhere durable. Reproduced 3× this session; cost ~5 min recovering.
- **n8n SSH tunnel may go down mid-session.** Verbose curl shows `Connection refused` on port 5678. User must re-open via `ssh -fN -L 5678:localhost:5678 ...` (full command in CLAUDE.md). The Bash tool can run the curl; only the SSH must be user-initiated. Happened once mid-WF-25-PUT.
- **Plugin's `backup-workflow.sh` wrote 0-byte backup on this session.** Manual fallback worked: `cp /tmp/claude-scratch/<sess>/wf25-pre.json archive/backups/<wfid>-<ts>-manual.json`. Worth investigating the script behavior in a future session — for now manual backup is the safe pattern.
- **MCP `n8n_update_partial_workflow` nested-array updates silently no-op.** Per memory `[[feedback_n8n_mcp_nested_array_update]]`. The WF-25 IF operator fix had to go via jq+PUT.
- **n8n's MCP validator flags IF/Switch `main[1]` outputs as "error output connections"** — this is a false positive for IF/Switch routing semantics. Safe to ignore the `missing onError: 'continueErrorOutput'` warning on `Has Consult Channel?` and `Route by Intent`.
- **`cachedResultName` missing warnings** on every executeWorkflow node are pre-existing project-wide pattern — established convention is to omit. Step 5f.3 canonical shape doesn't include it. Safe to ignore.

---

## Files Changed This Session (uncommitted in working dir; commit + push are this turn's final steps)

| Path | Change |
|---|---|
| `workflows/eTV1lUcYrXBg2q2T.json` | WF-25 post-PUT export (~36.4 KB) |
| `docs/pseudocode/WF-25.pseudo` | Renumbered Steps 1-15 linear, removed tombstone, halt-and-notify Steps 4-7, updated Ambiguities/Notes |
| `docs/workflow-registry.md` | New section "2026-05-27 — Sprint pre-go-live-final-follow-up Batch 3 (in progress)" at top; version bumped to 2.15 |
| `docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/state.md` | Mid-sprint re-scope block + TD-PGF-05 session re-scope + TD-PGF-09 session re-scope + approved copy + data-path decision blocks; Batch 3 description rewritten; TD-PGF-09 row workflows column updated; `Last updated` bumped |
| `docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/followups.md` | Appended "[2026-05-27] — Batch 3 kickoff" section with audit findings, design decisions, plugin improvement candidates TD-PGF-PLG-001 + TD-PGF-PLG-002 |
| `docs/dependency-map.md` | Regenerated post-Batch-2.5 |
| `workflows/*.json` | All 28 workflow exports refreshed (export-all-workflows.sh ran during dep-map rebuild) |
| `archive/backups/eTV1lUcYrXBg2q2T-2026-05-27-03-57-manual.json` | Pre-PUT WF-25 backup (24,576 bytes) |

---

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/tasks.md`. Resume at **WF-23** per locked Batch 3 PUT order. Step 2a (pseudocode-first) applies for each workflow — the General Response halt-and-notify changes are non-parametric (alter control flow + add new sub-workflow calls), so revise each `.pseudo` before the JSON edit. Caller-side envelope add-ons are parametric (just adding fields to a mapping; no pseudo touch).

Reuse the WF-25 Python build script as the template — most of the structure (Set v3.4 contract-emit nodes, executeWorkflow v1.2 canonical shape, IF v2.2 with `singleValue: true`, stopAndError v1) is identical. The differences are: workflow ID, error-branch source node name (`Gemini General Response` instead of `Classify Intent`), and the alert template text (use "AI assistant couldn't generate a reply" template for the 4 General Response sites).

**Pre-batch verifications next session must NOT skip:**
1. `git pull` to bring this session's commits into next session's working dir (Google Drive auto-syncs but git state on remote is authoritative — see `[[feedback_github_ground_truth]]`).
2. Confirm SSH tunnel open (`! ssh -fN -L 5678:localhost:5678 ...`).
3. Run `scripts/assert-md-fresh.sh WF-XX` before loading any `.pseudo` or `.md` (per CLAUDE.md "Workflow Representation Freshness").

---

## Blockers

None. All design decisions locked; copy approved; data-path locked; design principle confirmed; WF-25 verified. Batch 3 remaining work is mechanical replication of the WF-25 pattern (×4 General Response sites + ×6 caller-side envelope add-ons + ×2 surgical edits on WF-50/32).
