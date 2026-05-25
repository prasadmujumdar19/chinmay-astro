# Pseudo-vs-Live Drift Fixes — 2026-05-24

Generated from drift-check 2026-05-24 (`docs/artefacts/drift-checks/2026-05-24/`).
Walk-through order: top-down through workflow chain (WF-00 → WF-60).
Each finding triaged interactively before being entered as a sprint item.

WF-21 is currently clean but will be re-checked after WF-00/01/02/20 decisions land, to catch cascading ripples.

## 🔴 P0 — Blockers (real bugs)

### TD-DRIFT-006 · WF-20 userStatus drop — live fix + pseudo revision

**Root cause:** `Normalize Keyword` Set node (immediately after trigger) does not include `userStatus` in its output assignments — only `keyword, phoneNumber, userId, messageText`. Downstream `Call WF-47 Unsubscribe` reads `$json.userStatus` (post-Normalize-Keyword `$json`) which resolves to `undefined`. WF-47's `Was Consultation Active?` IF then evaluates `undefined === 'consultation_active'` → FALSE → `Close Open Consultation` is never reached for a user STOPing mid-`consultation_active`. The HELP path silently works around this by back-referencing the trigger directly; STOP path does not.

**Real-world consequence:** A user in `consultation_active` who sends STOP gets `users.status='opted_out'` but their `consultations` row stays `status='active'` — table drift. WF-20.pseudo Step 1 correctly declared `userStatus` as carried-forward; live silently dropped it.

**Fix:**
1. **Live:** add `userStatus: {{ $json.userStatus }}` assignment to `Normalize Keyword` Set node alongside the existing four fields. Surgical edit; no logic change.
2. **Pseudo:** add structured **Inputs** block enumerating `phoneNumber, userId, userStatus, messageText` (each with type + validity) and explicit note that all four must survive `Normalize Keyword` for downstream consumption — addresses D8 + D9 in one revision.

**Files:**
- Live `Normalize Keyword` Set node in WF-20 (n8n id `LgIDj1v4ZbCPlX25`).
- `docs/pseudocode/WF-20.pseudo`.

**Change type:** Surgical (live) + Documentation (pseudo).
**Impact:** Closes the STOP-mid-consultation orphan-row bug; restores spec contract; eliminates trigger-back-reference fragility in WF-47.
**Verify:**
1. Send a test STOP from a user in `consultation_active` state.
2. Confirm `chinmay_astro.users.status='opted_out'` AND `chinmay_astro.consultations.status='closed'` after.
3. Re-run drift-check WF-20 → expect CLEAN.

### TD-DRIFT-007 · WF-47 ordering — atomicity reorder + pseudo revision

> **ADOPTED 2026-05-25T03:42:21Z** — Re-homed to
> `docs/artefacts/sprints/data-contract-sprint-bug-fix/tasks.md` as
> **TD-DCP-113** (P1). Original spec retained below for reference; do
> NOT execute from this file — execute from the data-contract-sprint-bug-fix
> sprint to avoid double-application.

**Root cause:** Live runs `UPDATE users SET status='opted_out'` BEFORE `Close Open Consultation`. If the `Close` step fails after the user UPDATE succeeds, the user is left in `opted_out` with an orphaned `consultations` row in `status='active'` — exactly the table-drift failure mode TD-DRIFT-006 exposed (WF-20 dropping `userStatus` produced the same orphan-row outcome via a different mechanism). Even after TD-DRIFT-006 lands, the current ordering still carries this atomicity risk because the lifecycle write (UPDATE users) precedes the dependent cleanup (Close consultation). Additionally `WF-47.pseudo`'s Inputs block is informal prose (`Inputs: phoneNumber, userId, userStatus`), failing D9 structured-block criteria.

**Decision (already approved in pre-load):** Reorder live so the consultation close happens before the user opt-out write, and bypass the pre-onboarding row-existence question (WF-01's `Anomaly Route?` already intercepts pre-onboarding STOP via the `anomaly_keyword` route and never reaches WF-47).

**Fix:**
1. **Live (WF-47, n8n id `2U7mxHMyqA41ROKX`):** reorder to:
   - Trigger → `Was Consultation Active?` (IF `userStatus==='consultation_active'`)
     - YES → `Close Open Consultation` → `Update User Status to opted_out`
     - NO → `Update User Status to opted_out`
   - → `Has Slack Channel?` (reads `slack_channel_id` from UPDATE node — RETURNING clause unchanged)
   - → notify path unchanged (`Prepare WF-51 Payload` → `Notify Admin via WF-51` → `Prepare WF-50 Payload` → `Send Opt-out Confirmation via WF-50`)
   - Both IF branches converge on the single existing `Update User Status to opted_out` node — no duplicate write node needed.
2. **Pseudo (`docs/pseudocode/WF-47.pseudo`):** rewrite Step 2/Step 3 ordering to match new live; add structured **Inputs** block:
   - `phoneNumber` — E.164 string, required.
   - `userId` — integer, required (FK to `chinmay_astro.users.id`).
   - `userStatus` — enum string, required; one of the user-state-machine values per CLAUDE.md (`payment_pending`, `payment_submitted`, `consultation_active`, `consultation_closed`, `opted_out`, `blocked`); used to decide whether to close an active consultation.
   - Remove the long inline note inside Step 2 that justified the old "UPDATE-first then read userStatus from trigger" ordering — it no longer applies. Replace with a brief note that the IF reads `userStatus` directly from the trigger (pre-UPDATE value) by design.

**Files:**
- Live nodes in WF-47: `Was Consultation Active?`, `Close Open Consultation`, `Update User Status to opted_out` — connection rewiring only, no node parameter changes.
- `docs/pseudocode/WF-47.pseudo`.

**Change type:** Surgical (live connection rewiring) + Documentation (pseudo).
**Impact:** Eliminates the orphaned-active-consultation failure mode when the close step fails after the opt-out write; aligns ordering with the close-before-state-change pattern used elsewhere (WF-42 admin close runs before any user-level write); brings WF-47.pseudo to D9 compliance.
**Out of scope (deferred):** D5 — `Update User Status to opted_out` lacks `alwaysOutputData=true`. Tracked in `deferred-to-tech-sprint.md` (pre-onboarding STOP can't reach WF-47 anyway because WF-01's `Anomaly Route?` intercepts upstream).
**Verify:**
1. Back up workflow JSON before any edit (`scripts/backup-workflow.sh WF-47`).
2. After live edit: re-export `workflows/2U7mxHMyqA41ROKX.json` and confirm connection topology matches the new order.
3. Send a test STOP from a user in `consultation_active`; confirm `chinmay_astro.consultations.status='closed', closed_by='user_opted_out'` AND `users.status='opted_out'` after.
4. Send a test STOP from a user in `payment_submitted` (no active consultation); confirm `users.status='opted_out'` and no `consultations` write attempted; admin Slack notice posted in the consult channel.
5. Re-run drift-check WF-47 → expect CLEAN (D5 will remain in deferred-tech tracker, not flagged here).

### TD-DRIFT-001 · WF-00 nfm_reply parse path — fix live

## 🟠 P1 — High (functional risk)

### TD-DRIFT-009 · Cross-cutting `messageContent` canonicalization (WF-25 callers)

**Root cause:** WF-25's `Prepare Intent Request` Code node reads `input.messageContent` to build the Gemini classification prompt. Several callers map the field as `messageText` instead, producing `messageContent=undefined` at WF-25's entry — Gemini classifies an empty string, and most empty-string classifications fall into `garbage` or default classes. Confirmed callers passing the wrong name: WF-23, WF-31, WF-43, WF-44 (per tracker line 57 and WF-23.pseudo Notes line 11). WF-25 itself is correctly authored; only the caller side needs to change. The mismatch is a latent bug: Gemini "works" because empty-string responses still return something parseable, but classifications are essentially meaningless for any user message — every free-form text state is silently degraded.

**Decision (2026-05-24):** Canonical name is `messageContent` (matches WF-00 parse output, WF-01/02 forwarding contract, WF-60 logging field, and WF-25's existing read). Rename callers, not WF-25.

**This is a cross-cutting fix on a critical field. Build-sprint must run an EXTRA-THOROUGH impact analysis before any edit — beyond its standard impact-analysis phase. User direction (2026-05-24): "I'm being extra cautious."**

**Pre-edit impact analysis (mandatory — block edits until complete):**
1. **Caller completeness audit.** Grep all `workflows/*.json` for any `Call WF-25` / `eTV1lUcYrXBg2q2T` (WF-25 ID) references. Confirm the caller set is exactly {WF-23, WF-31, WF-43, WF-44} or expand the fix scope if more are found.
   ```bash
   grep -l 'eTV1lUcYrXBg2q2T' workflows/*.json
   ```
   For each match, inspect the `Call WF-25 …` node's `workflowInputs.value` mapping and confirm which field name it sends.
2. **Field-name collision audit.** Grep every workflow for the literal string `messageText` AND `messageContent`. Confirm: (a) no node anywhere relies on `messageText` as a *received* field (i.e., the only direction is "outgoing to WF-25"); (b) every existing `messageContent` reference is semantically the same inbound-message text. If either turns up an unexpected usage, expand scope.
   ```bash
   grep -rn '"messageText"\|messageText:' workflows/
   grep -rn '"messageContent"\|messageContent:' workflows/
   ```
3. **Downstream impact audit on WF-25 callers.** For each caller, identify what happens to WF-25's `intentResult` after the rename. Currently WF-25 sees empty string → classifies as garbage/default → caller's downstream IF/Switch handles garbage path. After the rename, WF-25 will receive real text → real classifications → callers may route down previously-rarely-hit branches. Trace each caller's intent-routing IF/Switch and confirm every intent branch terminates correctly (no dead branches, no missing handlers). Specifically for each caller:
   - WF-23: `Is Pass-Through Intent?` routes pass-through intents to flow-form re-send vs stop-intent to clarifier — confirm rebook_intent/feedback_intent/general_enquiry/wants_consultation paths all converge correctly.
   - WF-31, WF-43, WF-44: enumerate intent-branch destinations and verify they handle the full intent vocabulary, not just garbage/default fallback.
4. **WF-25 sub-workflow internal trace.** Confirm WF-25 has no other input-field readers besides `messageContent` (i.e., we're not missing a parallel rename inside WF-25 itself).
5. **Sample-run dry verification.** Before any production edit: pick one caller (recommend WF-23, lowest-stakes path), back up its JSON, apply the rename, send a single test message in that state, observe `intentResult` in n8n execution log. Only after this dry-run succeeds, proceed with the remaining three callers in sequence.

**Fix:**
For each of WF-23, WF-31, WF-43, WF-44 (plus any others surfaced in audit step 1):
- In the `Call WF-25 Intent Classifier` Execute-Workflow node's `workflowInputs.value` block, rename the key `messageText` → `messageContent`. Keep the value expression unchanged (whatever it was reading, e.g. `={{ $json.messageText }}` or `={{ $json.messageContent }}` — but verify the expression on each, since some callers may have `$json.messageText` upstream too; if so, the upstream-source rename is needed first or in the same edit).
- No edit to WF-25.

**Files:** Live nodes only — `Call WF-25 Intent Classifier` Execute-Workflow node in each caller. No pseudo edits required (WF-25.pseudo Notes already document the intended `messageContent` contract; caller pseudos can be touched in their respective WF-XX drift items if needed).

**Change type:** Surgical (single-field rename per caller) × N callers.
**Impact:** Restores actual intent classification across all pre-form / pre-payment / consultation-active / closed-state free-form text routes. **Behaviour change:** users may now reach intent branches that were previously starved (everything fell to garbage/default). Downstream branches must already be wired correctly — audit step 3 confirms this before edit.
**Out of scope:** WF-23/31/43/44 pseudo Inputs blocks (handled per-WF in their own drift items: TD-DRIFT-010 etc.); WF-25's own structured Inputs improvements (separate item if needed).
**Verify:**
1. For each caller after rename: send a sample message that should trigger a non-garbage intent (e.g., "I want to book a consultation" for `wants_consultation`). Inspect n8n execution log of the WF-25 call; confirm `intentResult` is `wants_consultation` not `garbage`.
2. Confirm downstream branch behaviour matches design (e.g., WF-23 sends the wants_consultation contextual intro + flow form; WF-31 routes to the correct payment-pending sub-handler).
3. Re-export all four caller JSONs; grep each to confirm zero `messageText` keys remain in `workflowInputs.value` blocks.
4. Re-run drift-check WF-23/31/43/44 → expect D4 finding gone on each.

### TD-DRIFT-001 · WF-00 nfm_reply parse path — fix live

**Root cause:** Parse WhatsApp Message switch in WF-00 has no case for `messageType='nfm_reply'`; falls through to default producing `messageContent='[NFM_REPLY]'` placeholder instead of cleartext form payload.

**Fix:** Add switch case `nfm_reply` → `messageContent = JSON.stringify($json.rawMessage.interactive.nfm_reply.response_json)`. All other branches unchanged. Spec (`.pseudo` Step 2) already documents intent — no spec change needed.

**Files:** live `Parse WhatsApp Message` Switch node in WF-00 (n8n workflow id from registry).
**Change type:** Surgical (single-node parameter edit).
**Impact:** Logging fidelity — messages table will contain form payload instead of placeholder; form-submission functional flow unaffected (WF-22 reads payload directly).
**Verify:** export workflow JSON after edit; submit a test Flow form; query `chinmay_astro.messages` for the cleartext payload row.

### TD-DRIFT-012 · Cross-cutting WF-50 caller contract canonicalization

**Root cause:** WF-50's `Prepare Payload` Code node has a permissive fallback chain `const messageContent = input.messageContent || input.message || input.messageBody || null;` and `const messageType = input.messageType || 'text';`. Three callers exploit this leniency by passing legacy field names:

| Caller | n8n ID | Node | Fields passed |
|--------|--------|------|---------------|
| WF-20 | `LgIDj1v4ZbCPlX25` | `Send HELP/STOP Reply via WF-50` (defineBelow) | `messageBody, phoneNumber` — legacy `messageBody`, omits `messageType` |
| WF-30 | `gGJBY5fJha0Let8I` | `Send Payment Reminder via WF-50` (defineBelow) | `message, phoneNumber` — legacy `message`, omits `messageType` |
| WF-44 | `Du2CJ3OTohRFZYoA` | (defineBelow WF-50 caller) | `message, phoneNumber` — legacy `message`, omits `messageType` |
| WF-43 | `3va0M06kijgyLejf` | `Send Gemini Reply via WF-50` (passthrough caller) — **upstream `Extract Gemini Reply` Code node emits `{phoneNumber, message: reply}`** | `message, phoneNumber` — legacy `message` produced upstream, omits `messageType`; **surfaced 2026-05-24 during WF-43 per-WF triage** — TD-DRIFT-012's original audit classified WF-43 as safe because the WF-50 caller is passthrough, but the upstream-node check (audit step 3) was not actually run on passthrough callers. Same latent-breakage risk as the three defineBelow callers above. |

Production behaviour is correct (WF-50's fallback chain rescues each variant), but the spec/live drift means any tightening of WF-50 silently breaks four workflows. Audit re-confirmed 2026-05-24 (WF-43 triage): three defineBelow callers + one passthrough caller with legacy upstream. The remaining 11 WF-50 passthrough callers' upstream nodes were spot-checked during the WF-43 triage and produce canonical fields.

**Decision (2026-05-24):** Canonical contract for WF-50 callers is `{phoneNumber, messageType, messageContent}` (or `interactivePayload`/`templateName`/`templateParams` for non-text types). Rename the four legacy callers (three defineBelow + one passthrough-with-legacy-upstream); WF-50 tightening tracked separately as TD-DRIFT-013.

**This is a cross-cutting fix on a critical sub-workflow boundary. Build-sprint must run an EXTRA-THOROUGH impact analysis before any edit — beyond standard impact-analysis phase.**

**Pre-edit impact analysis (mandatory — block edits until complete):**
1. **Caller-mapping audit.** Re-run the WF-50 caller field-name audit. Confirm scope is exactly the three callers above and no further drift has appeared since 2026-05-24.
   ```bash
   for f in workflows/*.json; do
     jq -r --arg id BUVun38WEKb12zg9 '.nodes[]? | select(.parameters.workflowId.value==$id) | "\(input_filename):" + (.parameters.workflowInputs.mappingMode // "?") + ":" + ((.parameters.workflowInputs.value // {}) | keys | join(","))' "$f" 2>/dev/null
   done
   ```
   Expand scope if the diff surfaces additional defineBelow callers using non-canonical names.
2. **Upstream-node audit per legacy caller.** For each of WF-20, WF-30 (payment-reminder path), WF-44: inspect the upstream Code/Set node that builds the payload object. Confirm what it currently outputs as the text-body field (`message` vs `messageBody`). The fix must rename BOTH the upstream-node output key AND the defineBelow value key in the Execute-Workflow node — otherwise the rename breaks the chain.
3. **Passthrough-chain audit.** Although the 12 passthrough callers were classified safe, confirm none of them have an upstream Code/Set node that produces a legacy `message`/`messageBody` field name. If any do, they currently rely on WF-50's fallback too and become latent breakage when TD-DRIFT-013 tightens WF-50.
   ```bash
   grep -rn '"message"\s*:\|"messageBody"\s*:' workflows/
   ```
4. **WF-50 internal trace.** Confirm `Prepare Payload`'s fallback chain is the ONLY consumer of `messageContent` semantics — no other WF-50 node references `input.message` or `input.messageBody` directly. (Reading the existing trace 2026-05-24: fallback is centralized in `Prepare Payload` only — no other nodes need updating.)
5. **Sample-run dry verification per caller.** Before production rollout: pick one caller (recommend WF-44 — lowest-traffic), back up the JSON, rename, send a sample message in that state, observe WF-50 execution log and confirm `messageContent` is now read directly without falling through. Then proceed to WF-30 and WF-20 in sequence.

**Fix (live edits, four callers):**
For each of WF-20 / WF-30 / WF-44 / WF-43:
1. Update the upstream Code/Set node's output object to use `messageContent` (renamed from `message` or `messageBody`) and add an explicit `messageType: 'text'`.
2. Update the `Call/Send … via WF-50` Execute-Workflow node's `workflowInputs.value` block (where applicable — passthrough callers like WF-43's `Send Gemini Reply via WF-50` need no Execute-Workflow node edit since they propagate whatever the upstream node emits):
   - Replace `message`/`messageBody` key with `messageContent`.
   - Add explicit `messageType` key (value `'text'` for the four known cases).
3. No edit to WF-50.

**Files:**
- WF-20 (`LgIDj1v4ZbCPlX25`): upstream Code/Set node + `Send HELP/STOP Reply via WF-50` Execute-Workflow node.
- WF-30 (`gGJBY5fJha0Let8I`): `Prepare Payment Reminder` Code node + `Send Payment Reminder via WF-50` Execute-Workflow node.
- WF-44 (`Du2CJ3OTohRFZYoA`): payload-prep Code node + WF-50 caller Execute-Workflow node.
- WF-43 (`3va0M06kijgyLejf`): `Extract Gemini Reply` Code node only (passthrough WF-50 caller needs no edit). Change emitted object from `{phoneNumber, message: reply}` to `{phoneNumber, messageType: 'text', messageContent: reply}`.

**Change type:** Surgical (paired upstream-node + caller-mapping edit) × 3 callers + Code-node-only edit × 1 caller.
**Impact:** Eliminates dependence on WF-50's legacy fallback for these three paths; explicit canonical contract on the wire. **No behaviour change in production** — current paths already work via fallback. Unblocks TD-DRIFT-013 (WF-50 tightening).
**Out of scope:** WF-50's `Prepare Payload` tightening (TD-DRIFT-013); per-WF pseudo Inputs blocks (separate items).
**Verify:**
1. After each caller's edit: send a sample text-path message in that state; observe n8n WF-50 execution log shows `messageContent` read directly (no fallback evaluated). Production behaviour identical.
2. Re-run the audit script (step 1); confirm no defineBelow caller uses `message`/`messageBody` anymore.
3. Re-run drift-check WF-20/WF-30/WF-44 D5 → expect cleared (or remaining only for unrelated reasons).

### TD-DRIFT-013 · WF-50 `Prepare Payload` — drop legacy fallback chain

**Root cause:** WF-50's `Prepare Payload` Code node accepts three field-name variants for the text body (`messageContent || message || messageBody`) and defaults type (`messageType || 'text'`). The fallbacks exist for historical reasons; once TD-DRIFT-012 canonicalizes the three legacy callers, the body-name fallbacks become dead defensive code that masks future caller bugs (a typo'd `messageContnt` will silently null-out the text body instead of erroring loudly).

**Decision (2026-05-24):** After TD-DRIFT-012 lands, tighten `Prepare Payload` to require canonical `messageContent`. Keep the `messageType || 'text'` default (treat omitted messageType as text — narrow, low risk).

**Fix (live edit, one node):**
- In WF-50's `Prepare Payload` Code node:
  - Change `const messageContent = input.messageContent || input.message || input.messageBody || null;` → `const messageContent = input.messageContent || null;`.
  - Keep `const messageType = input.messageType || 'text';` (default-to-text is a stable contract).
- No pseudo change required (WF-50.pseudo already implies canonical names).

**Files:** WF-50 (`BUVun38WEKb12zg9`) `Prepare Payload` Code node only.
**Change type:** Surgical (single-line edit in Code node).
**Depends on:** TD-DRIFT-012 fully landed and verified (all callers canonical).
**Impact:** Hardens the WF-50 contract — typos and field-name drift in future callers fail loudly (drop=true path triggers WF-60 logging with empty-body-dropped reason) instead of silently falling back. **Pre-condition:** confirmed by re-running the audit script post-TD-DRIFT-012 and verifying zero hits for `"message":` and `"messageBody":` text-body keys in any WF-50 caller chain.
**Verify:**
1. After TD-DRIFT-012 fully complete: re-run the audit script `grep -rn '"message"\s*:\|"messageBody"\s*:' workflows/` and confirm zero hits in WF-50 caller paths.
2. Apply the tightening edit.
3. Smoke-test each formerly-legacy caller (WF-20, WF-30, WF-44) end-to-end — confirm messages still send.
4. (Optional) Stage a deliberate-typo test: temporarily set one caller to send `messageContnt` (typo); confirm WF-50 drops the payload with empty-body-dropped reason and logs to WF-60 (not silent success).
5. Revert the typo test; re-run drift-check WF-50 → expect CLEAN on this dimension.

### TD-DRIFT-015 · Cross-cutting Canon A — WF-01 children phoneNumber-wins contract

**Root cause:** WF-01 routes user actions to leaf workflows via the `{phoneNumber, user{id, name, phone_number, status, ...}}` envelope. No canonical pattern exists for whether leaves consume top-level `phoneNumber` or nested `user.phone_number` for phone-only purposes. Audit (2026-05-24, `docs/pseudocode/WF-XX.md` greps):

| WF | `$json.phoneNumber` reads | `user.phone_number` reads | Pattern |
|----|---|---|---|
| WF-23 | 3 | 0 | Clean (top-level only) |
| WF-30 | 3 | 0 | Clean (top-level only) |
| WF-31 | 2 | 0 | Clean (top-level only) |
| WF-40 | 3 | 0 | Clean (top-level only) |
| **WF-32** | **0** | **3** | **Outlier (user-only)** |
| WF-33 | 1 | 2 | Mixed |
| WF-34 | 2 | 1 | Mixed |
| WF-42 | 1 | 2 | Mixed |
| WF-46 | 1 | 1 | Mixed |
| WF-41 | 0 | 0 | N/A (uses adminMessage/channelId only) |

Without a canon, every new leaf workflow inherits the ambiguity and the mixed pattern compounds. WF-50 caller contract canonicalization (TD-DRIFT-012) addressed the downstream side; this item addresses the upstream `WF-01 → leaf` boundary.

**Decision (2026-05-24):** **Canon A — top-level `phoneNumber` wins.** Leaves consume `$json.phoneNumber` for phone; `user.*` carries non-phone fields only (id, name, status, slack_channel_id, etc.). Matches the 4 already-clean WFs (23/30/31/40); realigns WF-32 + the 4 mixed ones (33/34/42/46). Smallest live churn.

**Scope down-revision (2026-05-24, post per-WF audit):** Subsequent per-WF triage of WF-33/34/42/46 revealed that all their `user.phone_number` reads are sourced from `Load User by Phone` SELECT results — NOT trigger-envelope reads. Per audit step 3 below, DB-result reads are explicitly out of scope for Canon A realignment. **WF-33, WF-34, WF-42, WF-46 are therefore already Canon-A compliant in live; they need NO live edits under this item.** WF-32's audit produced 1 in-scope trigger-envelope read (`Prepare Reassurance Message`) plus 2 DB-result reads (out of scope). **Net live scope of TD-DRIFT-015: a single Code node in WF-32.** Per-WF pseudo Inputs blocks are also out of scope — handled by per-WF D9 items (TD-DRIFT-016 for WF-32; TD-DRIFT-018 for WF-33; future items for 34/42/46) which all cross-reference Canon A from this entry.

**This was originally framed as a 5-WF cross-cutting fix; the audit collapsed live scope to 1 node. The Canon A decision itself remains cross-cutting (governs future leaf onboarding) and per-WF Inputs-block declarations still cite it — but live work is now surgical and could be merged into TD-DRIFT-016 if preferred. Kept as a standalone item to preserve the canon-decision audit trail and the family-wide reasoning.**

**Pre-edit impact analysis (mandatory — block edits until complete):**
1. **Caller-mapping audit.** Re-confirm WF-01 always emits `{phoneNumber, user}` envelope to every leaf branch (no divergent paths). Check WF-01's routing nodes for the `phoneNumber` field at every Execute-Workflow caller.
   ```bash
   jq -r '.nodes[] | select(.type=="n8n-nodes-base.executeWorkflow") | "\(.name): " + ((.parameters.workflowInputs.value // {}) | keys | join(","))' workflows/<WF-01-id>.json
   ```
2. **Per-leaf node-by-node audit.** For each of WF-32/33/34/42/46, identify every node currently reading `user.phone_number` for **phone-only purposes** (passing to WF-50, WF-51 channel ID lookup is NOT phone-only). Per-WF read-site count: WF-32=3, WF-33=2 (TBD whether all phone-only), WF-34=1, WF-42=2, WF-46=1. Cross-check by reading the .md.
3. **Distinguish trigger-envelope reads from DB-RETURNING/SELECT reads.** Some `user.phone_number` reads come from `UPDATE … RETURNING *` or `SELECT … FROM users` results, not the trigger envelope. Those are NOT in scope for Canon A — they reflect post-write state and may be intentional. Only flip reads sourced from `When Executed by Another Workflow` envelope.
4. **Passthrough-chain audit.** Verify no leaf reads `user.phone_number` and propagates it as a renamed top-level field to a downstream sub-workflow — would cascade the change. Most leaves call WF-50/WF-51, both of which already declare canonical `phoneNumber` per TD-DRIFT-012, so this should be a confirmation step.
5. **Sample-run dry verification per leaf.** Pick one representative execution per leaf from `execution_entity` (or stage one); confirm trigger-envelope `phoneNumber` is present and identical to `user.phone_number` at the trigger node. (They should always match — WF-01 derives both from the same source — but verify.)

**Fix (live edit, 1 node — post-scope-down):**
WF-32 (`emUOLWVZiNVxcOe3`) `Prepare Reassurance Message` Code node: change `phoneNumber: user.phone_number` → `phoneNumber: $('When Executed by Another Workflow').item.json.phoneNumber` (or equivalent top-level reference). No other live edits in this item.

**Pseudo (deferred to per-WF D9 items):** Per-WF Inputs blocks are revised by their respective D9 items (TD-DRIFT-016 for WF-32, TD-DRIFT-018 for WF-33, etc.), each citing Canon A from this entry. Canon A declaration template for those items:
- `phoneNumber` (required, E.164 string) — **canonical phone source for this WF (Canon A, TD-DRIFT-015)**
- `user` envelope (required, object) with fields enumerated — phone-only consumers MUST use top-level `phoneNumber`; `user.phone_number` exists as a mirror but should not be read for phone-only purposes (DB-result reads of `user.phone_number` exempt — Canon A audit step 3).

**Files:**
- Live: WF-32 (`emUOLWVZiNVxcOe3`) `Prepare Reassurance Message` Code node only.
- Pseudo: governed elsewhere (per-WF D9 items).

**Change type:** Surgical live (1 Code-node line edit) + canon declaration (no direct doc edit; cited by per-WF items).
**Impact:** Aligns WF-32's last trigger-envelope phone-only read with the family canon. Per-WF Inputs blocks cite Canon A for future leaf clarity. No production behaviour change (phoneNumber and user.phone_number are always identical at the trigger).
**Out of scope:** Per-WF D9 structured Inputs items — handled separately; this item is purely the canon decision + WF-32 single-node fix.
**Verify:**
1. WF-32: re-run sample STOP→duplicate-tap path, confirm `Prepare Reassurance Message` produces a `phoneNumber` value identical to the trigger.
2. Re-run audit grep on `docs/pseudocode/WF-32.md` post live re-export — expect the `Prepare Reassurance Message` Code body to reference top-level `phoneNumber`, not `user.phone_number`.
3. Re-run drift-check WF-32 → expect CLEAN D8 phoneNumber dimension.

### TD-DRIFT-017 · WF-33 D8 — verified_by stores admin user ID (live bug fix)

**Root cause:** WF-33's `Extract Command Data` Code node reads `input.channelId` and re-stores it as `adminUserId`, then `Update Payment Status` writes that value to `payments.verified_by`. WF-11 (caller) passes through the full envelope from WF-10, which includes BOTH `adminUserId` (Slack user ID of the admin) AND `channelId` (Slack channel where the command was typed) as distinct fields. The live code therefore stores the channel ID — NOT the admin user ID — in `payments.verified_by`. The in-code comment in `Extract Command Data` shows a Slack-user-ID example (`"U0A4A6X857D"`), confirming developer intent was to store the admin user ID. WF-33.pseudo Step 2 documents `adminUserId = channelId` and Step 5 says `verified_by=adminUserId`, so pseudo is self-consistent with the (incorrect) live behaviour.

**Real-world consequence (low operational severity, real spec drift):** Single-admin model (Chinmay only) means `verified_by` values are never disambiguated in practice, so the bug is invisible operationally. But the column is intended for audit trail of who-approved, and currently stores wrong data. Future multi-admin onboarding (if ever) would expose the bug. Verification empirically not possible in test env: `payments` table is empty.

**Decision (2026-05-24):** Fix live to read `input.adminUserId` and drop the rename. Update pseudo to drop the rename. Aligns column semantics with column name and developer comment.

**Fix:**
1. **Live (WF-33 `NcHZedq9ycnAQ9SW`):** In `Extract Command Data` Code node, change:
   - `adminUserId: input.channelId` → `adminUserId: input.adminUserId`
   - (Optional: drop the rename entirely — `adminUserId: input.adminUserId` is identity, so just spread or keep the field name unchanged. Keeping the explicit assignment preserves the input-contract surface for readability.)
2. **Pseudo (`docs/pseudocode/WF-33.pseudo`):**
   - Step 2 → remove the `adminUserId = channelId` rename; simplify to "Extract command data: keep phoneNumber, adminUserId (from input), command, subCommand."
   - Inputs Summary line → covered by TD-DRIFT-018 (structured Inputs block); will declare `adminUserId` and `channelId` as distinct fields with `adminUserId` documented as the value stored in `verified_by`.

**Files:**
- Live `Extract Command Data` Code node in WF-33 (n8n id `NcHZedq9ycnAQ9SW`).
- `docs/pseudocode/WF-33.pseudo`.

**Change type:** Surgical (single-line Code-node edit) + Documentation.
**Impact:** Restores spec intent of `payments.verified_by` column. No production behaviour change visible to user; admin-side audit data becomes accurate.
**Verify:**
1. Back up WF-33 JSON before edit.
2. After edit: stage a test APPROVE PAYMENT via Slack from Chinmay's account; query `SELECT verified_by FROM chinmay_astro.payments ORDER BY id DESC LIMIT 1`; confirm it matches Chinmay's Slack user ID (`U…` format), NOT a channel ID (`C…` format).
3. Re-run drift-check WF-33 D8 → expect CLEAN.

## 🟡 P2 — Medium (spec drift, no functional risk)

### TD-DRIFT-008 · WF-22 — collapse phantom branch, NOW() unify, structured Inputs

**Root cause:**
- (D3) `.pseudo` Steps 4/5/5b describe new-vs-existing user branching on the `inserted` flag (`xmax=0` Postgres trick); live has no IF — `Create User Record` → `Ensure Slack Channel Exists (WF-52)` directly. WF-52 is idempotent (channel-name collision returns existing channel), so the branch never had a functional purpose. **Live is right; spec is wrong.**
- (D5) `.pseudo` Step 6 specifies `updated_at = NOW()`; live `Save Slack Channel ID` uses `updated_at = $2` with `$2 = {{ $now }}`. Same workflow's Step 3 INSERT uses `NOW()` directly in SQL — internal inconsistency in live.
- (D8) `rawMessage.interactive.nfm_reply.response_json` substructure consumed by `Extract Form Data` but never declared as a structural requirement in `.pseudo` Inputs.
- (D9) Inputs section is a single inline summary line with no types/required/optional/validity.

**Fix:**
1. **Live (`Save Slack Channel ID` Postgres node, WF-22 n8n id `dr8QM0m92Ml8MvIh`):** change SQL `SET slack_channel_id = $1, updated_at = $2 WHERE id = $3` → `SET slack_channel_id = $1, updated_at = NOW() WHERE id = $2`; update `queryReplacement` from `={{ $('Ensure Slack Channel Exists (WF-52)').item.json.channelId }}, {{ $now }}, {{ $('Create User Record').item.json.id }}` → `={{ [$('Ensure Slack Channel Exists (WF-52)').item.json.channelId, $('Create User Record').item.json.id] }}`. Aligns with Step 3 INSERT pattern; removes the n8n-vs-Postgres clock distinction.
2. **Pseudo (`docs/pseudocode/WF-22.pseudo`):**
   - Collapse Step 4 + Step 5 + Step 5b into a single step that calls WF-52 with the user record, with a Note that WF-52 is idempotent on existing channels (returns `isNew=false` with existing `channelId`). Step 5c (WF-52 failure handler) stays unchanged.
   - Add a structured **Inputs** block enumerating:
     - `phoneNumber` — E.164 string, optional (falls back to `rawMessage.from` when absent).
     - `rawMessage` — object, required. Must contain nested path `rawMessage.interactive.nfm_reply.response_json` as a JSON string with fields `full_name`, `date_of_birth`, `time_of_birth`, `place_of_birth`, `consent`, `flow_token`. Document the nested-path dependency explicitly (D8).
   - Add note: WF-00 will (post TD-DRIFT-001) also expose the parsed payload as `messageContent`. WF-22 continues to parse `rawMessage` directly; the redundancy is intentional and not a drift item (decision 2026-05-24 — leave as-is, no consolidation in this sprint).

**Files:**
- Live `Save Slack Channel ID` Postgres node in WF-22.
- `docs/pseudocode/WF-22.pseudo`.

**Change type:** Surgical (live single-node parameter edit) + Documentation (pseudo).
**Impact:** Internal-consistency cleanup of timestamp authoring; spec accuracy on call topology and input substructure. No functional behaviour change.
**Verify:**
1. Back up workflow JSON before live edit.
2. After live edit: submit a test Flow form; confirm `chinmay_astro.users.updated_at` equals the Postgres `NOW()` of the row (within sub-second).
3. Re-export `workflows/dr8QM0m92Ml8MvIh.json` and confirm queryReplacement no longer references `$now`.
4. Re-run drift-check WF-22 → expect CLEAN.

### TD-DRIFT-016 · WF-32 .pseudo — structured Inputs block

**Root cause:** WF-32.pseudo Inputs is a single prose line (`Inputs: phoneNumber, user (id, name, phone_number, status) — triggered when user taps "Payment Completed"…`). No structured block with types, required/optional, validity. Fails D9 rubric.

**Decision (2026-05-24):** Replace with structured block. Reflect Canon A (TD-DRIFT-015) — `phoneNumber` is canonical phone source; `user` envelope carries non-phone fields used by Step 2 branch.

**Fix (pseudo only):** Replace the current Summary `Inputs:` line with:
- `phoneNumber` — E.164 string, required. **Canonical phone source per TD-DRIFT-015 (Canon A).**
- `user` — object, required. WF-01 envelope, fields:
  - `user.id` — integer, required. FK to `chinmay_astro.users.id`. Used for payment INSERT and user UPDATE WHERE clauses.
  - `user.name` — string, required. Used by reassurance and admin notification messages.
  - `user.phone_number` — E.164 string, required (mirror of top-level `phoneNumber`; do NOT consume for phone-only purposes — use `phoneNumber` instead, per Canon A).
  - `user.status` — enum (state-machine value), required. Used by Step 2 branch (`payment_submitted` → reassurance path; else first-time-tap path).

Cross-reference TD-DRIFT-015 in the Inputs block.

**Files:** `docs/pseudocode/WF-32.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-015 (Canon A decision) — independent of execution order; this item can land before, after, or in parallel with TD-DRIFT-015 live work since pseudo is documentation only.
**Impact:** Closes D9 for WF-32. Consistent Inputs format with other revised pseudos.
**Verify:** Re-run drift-check WF-32 D9 → expect CLEAN.

### TD-DRIFT-018 · WF-33 .pseudo — Step 5 'verified', Step 11 brevity match, structured Inputs

**Root cause:** Three pseudo-only drifts in `docs/pseudocode/WF-33.pseudo`:
- **D5 stale label:** Step 5 says `status='approved'`; live writes `status='verified'`. Per workflow-registry.md, TD-005 (2026-05-20) canonicalized to `'verified'` with atomic DB migration. Pseudo lagged.
- **D7 admin Slack notification verbosity:** Step 11 specifies a rich admin message including DOB / TOB / Place + `CLOSE CHAT CONSULT <phone>` reminder. Live `Prepare WF-51 Payload (Notify Admin)` posts a briefer message: `"✅ Payment approved for ${user.name} (${user.phone_number}). User notified via WhatsApp; consultation is now active."` **Decision (2026-05-24): trim pseudo to match live brevity** — admin can reference user birth details from channel topic / pgAdmin / DB; activation message stays minimal to reduce notification clutter.
- **D9 prose-only Inputs:** Inputs declared in a single Summary line. No types / required / validity per D9 rubric.

**Decision (2026-05-24):** Pseudo-only sync. Reflect Canon A (TD-DRIFT-015) and the D8 fix (TD-DRIFT-017) in the Inputs block.

**Fix (pseudo only):**
1. **Step 5:** `status='approved'` → `status='verified'`. (Keep `verified_at=NOW()` and `verified_by` references unchanged.)
2. **Step 11:** Replace the rich message text with: `"✅ Payment approved for <user.name> (<user.phone_number>). User notified via WhatsApp; consultation is now active."` Drop the DOB / TOB / Place / CLOSE CHAT CONSULT reminder from this step.
3. **Inputs Summary:** Replace the prose line with a structured block:
   - `command` — string, required. Slack command verb (`"APPROVE"`).
   - `subCommand` — string, required. Slack command modifier (`"PAYMENT"`).
   - `phoneNumber` — E.164 string, required. **Canonical phone source for this WF (Canon A, TD-DRIFT-015).** Used for `Load User by Phone` WHERE clause.
   - `adminUserId` — Slack user ID string, required. The Slack user ID of the admin issuing the command. Written to `payments.verified_by` (per TD-DRIFT-017 fix).
   - `channelId` — Slack channel ID string, required. The channel where the command was typed. **Not currently consumed by WF-33** (kept available for future cross-cutting needs; not used in any current node).
   - `channelName` — string, optional. Channel name for display purposes. Not currently consumed.
   - Note: WF-11 passthroughs the full WF-10 envelope; WF-33 consumes only `phoneNumber` and `adminUserId`.

**Files:** `docs/pseudocode/WF-33.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-015 (Canon A reference), TD-DRIFT-017 (D8 fix — Inputs block declares `adminUserId` as the source for `verified_by` per the corrected behaviour). Both can land independently; TD-DRIFT-018 just documents the chosen state.
**Impact:** Closes D5 + D7 + D9 for WF-33. Aligns documentation with live.
**Verify:** Re-run drift-check WF-33 → expect CLEAN on D5, D7, D9.

### TD-DRIFT-019 · Cross-cutting pseudo linear-numbering convention (renumber + drop tombstones)

**Root cause:** Six pseudo files carry tombstone or reserved-step placeholders that break linear step numbering: `Step N: (removed — ...)`, `Step N: (deleted — ...)`, `Step N: (reserved)`. The pattern was adopted during SP-03 (May 2026) to preserve audit context of why certain validation steps were removed (centralized to WF-10). Audit 2026-05-24:

| WF | Tombstone / Reserved Steps | Actual step count | After renumber |
|----|---|---|---|
| WF-11 | Step 2 (deleted), Step 7 (deleted), Step 9 (deleted), Step 17 (removed), Step 20 (removed) | 16 real | Steps 1..16 |
| WF-25 | Step 12 (reserved — unused Gemini-error join) | 12 real | Steps 1..12 |
| WF-32 | Step 13 (reserved) | 13 real | Steps 1..13 |
| WF-33 | Step 4 (removed), Step 13 (removed) | 11 real | Steps 1..11 |
| WF-34 | Step 3 (removed), Step 4 (removed) | 8 real | Steps 1..8 |
| WF-42 | Step 3 (removed), Step 4 (removed), Step 11 (removed), Step 12 (removed) | 8 real | Steps 1..8 |

**Decision (2026-05-24):** **Pseudo files must use purely linear step numbering.** Git owns version history; tombstones in `.pseudo` clutter the design spec to preserve what's already in `git log`, commit messages, and registry footnotes. No `Step N: (removed/deleted/reserved)` entries anywhere. Saved as feedback memory [[feedback_pseudo_linear_numbering]].

**Fix (pseudo only, 6 files):**
For each affected file:
1. Delete every tombstone / reserved-step line.
2. Renumber the surviving steps linearly starting at Step 1.
3. **Audit and update every GOTO reference** in earlier steps that points to a now-renumbered step. Known GOTO refs from the audit:
   - **WF-25 Step 4:** "go to Step 13 (return to caller)" → update target to new Step 12.
   - **WF-32 Step 4:** "Go to Step 14" → update target to new Step 13 (the second "End").
   - **WF-25 Step 6:** Route on intentResult branches "go to Step 7" / "go to Step 9" / "go to Step 13" — verify all targets after renumber.
   - **WF-11 Step 6 + Step 8:** Notes reference "see Step 6 note" / "see Step 8 note" — update if those step numbers change.
4. After each file: re-grep `^Step ` to confirm linear sequence 1..N with no gaps and no `(removed|deleted|reserved)` markers remain.

**Files (pseudo only — no live edits):**
- `docs/pseudocode/WF-11.pseudo`
- `docs/pseudocode/WF-25.pseudo`
- `docs/pseudocode/WF-32.pseudo`
- `docs/pseudocode/WF-33.pseudo`
- `docs/pseudocode/WF-34.pseudo`
- `docs/pseudocode/WF-42.pseudo`

**Change type:** Documentation (6 pseudos, mechanical renumber + GOTO fix-up).
**Depends on:** None. Should land BEFORE any per-WF pseudo-rewrite item in the same files (TD-DRIFT-002 WF-01 is unaffected; TD-DRIFT-005 WF-11 will touch WF-11.pseudo; TD-DRIFT-011 WF-25 touches WF-25; TD-DRIFT-016 WF-32; TD-DRIFT-018 WF-33; TD-DRIFT-020 WF-34) — alternatively, fold the renumber into each per-WF item's edit pass. **Recommended ordering:** apply TD-DRIFT-019 first to all 6 files in one pass; subsequent per-WF items then edit the already-linear pseudo.

**Impact:** Closes D3 (step-sequencing mismatch with live linear flow) across all 6 affected WFs. Spec becomes easier to read. Future removals will renumber inline (no tombstones accumulate). Per-WF D3 findings are absorbed by this single cross-cutting item.
**Verify:**
1. After each renumber: `grep -nE "^Step [0-9]+|\((removed|deleted|reserved)" docs/pseudocode/WF-XX.pseudo` — expect linear sequence and zero tombstone matches.
2. Re-run drift-check on the 6 affected WFs → expect CLEAN on D3.
3. Cross-check: any handoff or sprint state that referenced a specific Step number by index becomes stale. Search `docs/artefacts/` for "Step N" references to WF-11/25/32/33/34/42 and update or note as historical-context-only.

### TD-DRIFT-020 · WF-34 .pseudo — D8 input cleanup + D9 structured Inputs

**Root cause:** Two pseudo-only drifts in `docs/pseudocode/WF-34.pseudo`:
- **D8 input declaration mismatch.** Inputs Summary declares `phoneNumber, reason (optional), channelId (admin's channel where REJECT was typed)`. Live consumes `phoneNumber` and `reason` from the trigger envelope; live does NOT consume `channelId` (uses `user.slack_channel_id` from DB-SELECT for WF-51 destination, by design — admin notifications go to consult channel, not admin's command channel — matching WF-33 / WF-42 family convention). `channelName` is mentioned in pseudo Step 1's trigger shape but missing from Inputs declaration and also unconsumed.
- **D9 prose-only Inputs.** No structured block (types / required / validity).

**Decision (2026-05-24):** Drop `channelId` and `channelName` from declared Inputs (they're passthrough envelope fields from WF-11, unused here). Document the passthrough convention briefly. Replace Summary prose with structured block.

**Fix (pseudo only):**
1. **Inputs Summary:** Replace prose line with structured block:
   - `phoneNumber` — E.164 string, required. **Canonical phone source for this WF (Canon A, TD-DRIFT-015).** Used by `Load User by Phone` WHERE and `Reset User Status to payment_pending` WHERE.
   - `reason` — string, optional. Admin-typed rejection reason. Written to `payments.rejection_reason` (COALESCE'd with default "Payment not verified" when absent). Also surfaced in the admin Slack confirmation. Note: not surfaced in the customer-facing WhatsApp body per MVP decision (existing Note in pseudo).
   - Note: WF-11 passthroughs the full WF-10 envelope (`{messageText, adminUserId, channelId, channelName, commandType, phoneNumber, reason}`); WF-34 consumes only `phoneNumber` and `reason`. The other fields arrive but are unused.
2. **Step 1 trigger shape:** Update from `{phoneNumber, reason?, channelId, channelName}` to `{phoneNumber, reason?, ...}` with a brief note about passthrough envelope.

**Files:** `docs/pseudocode/WF-34.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-019 (apply renumber first for clean diff); TD-DRIFT-015 (Canon A reference).
**Impact:** Closes D8 + D9 for WF-34. D3 absorbed by TD-DRIFT-019.
**Verify:** Re-run drift-check WF-34 → expect CLEAN on D8 and D9.

### TD-DRIFT-021 · WF-40 .pseudo — Step 4-6 topology rewrite + D9 structured Inputs

**Root cause:** Two pseudo-only drifts in `docs/pseudocode/WF-40.pseudo`:
- **D3/D4 topology mismatch.** Pseudo Step 4-6 frames the stop_intent handling as a single IF that, on YES, forks into parallel branches (a) WF-50 clarifier + (b) Slack relay, and on NO falls through to relay-only. Live implements the equivalent behaviour as a two-way fan-out off `Call WF-25`'s single output: an always-on `Format Slack Message → Call WF-51` branch and a parallel `Stop Intent? → Build WF-50 Clarifier Payload → Call WF-50` branch that gates the clarifier on `intentResult == 'stop_intent'`. **Functional outcome is identical** — for allowed intents Slack relay fires; for `stop_intent` Slack relay AND WF-50 clarifier fire. Live's always-on relay is safe because WF-25's contract halts execution for `garbage`/`malicious_abusive`/`inappropriate` (pseudo Step 3 already documents this contract).
- **D9 prose-only Inputs.** Inline `phoneNumber, messageContent` sentence — no structured block with types / required / validity.

**Decision (2026-05-24):** Rewrite pseudo to match live topology (Option A — live is the simpler expression; no behaviour change, zero churn risk). Cross-WF audit confirmed the "fan-out-off-WF-25 + IF gate on one branch" pattern is unique to WF-40 — not systemic, so this stays a single-WF item.

**Fix (pseudo only):**
1. **Inputs Summary:** Replace prose line with structured block:
   - `phoneNumber` — E.164 string, required. **Canonical phone source for this WF (Canon A, TD-DRIFT-015).** Used by `Load User Record` WHERE and propagated into the WF-50 clarifier payload.
   - `messageContent` — string, required. The user's WhatsApp text. Propagated verbatim into the Slack relay body and (when `stop_intent`) referenced contextually by the clarifier. Not used by the clarifier payload itself — the clarifier message is hard-coded.
2. **Step 4-6 rewrite:** Replace the "branch into parallel forks" framing with the live two-output fan-out pattern:
   - Step 4: WF-25 returns control with `intentResult`. Output fans into two independent branches that both consume `Call WF-25`'s result:
     - **Branch R (Slack relay, always-on for allowed intents):** Step 5 (Format Slack relay payload — `channelId = user.slack_channel_id`, `messageText = "📲 *<user.name>:* <messageContent>"`) → Step 6 (Call WF-51 with `{channelId, messageText}`).
     - **Branch C (Clarifier, conditional):** Step 7 (IF `intentResult == 'stop_intent'`) → Step 8 (Build WF-50 stop-clarifier payload: `phoneNumber`, `messageType="text"`, `messageContent="This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please ignore. If you do want to opt out of this service, simply send STOP at any time."`) → Step 9 (Call WF-50).
   - Step 10: End (both branches terminate independently; no join needed — fire-and-forget downstream calls).
3. **Notes section:** Add a one-line note that the always-on relay is safe because WF-25's contract halts execution for `garbage` / `malicious_abusive` / `inappropriate` intents (existing Step 3 wording covers the contract; just cross-reference it from the new fan-out description).

**Files:** `docs/pseudocode/WF-40.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-019 (apply renumber convention to the rewritten Step 4-10 block — linear numbering, no tombstones); TD-DRIFT-015 (Canon A reference for the `phoneNumber` Input row).
**Impact:** Closes D3, D4, D9 for WF-40. No live changes.
**Verify:** Re-run drift-check WF-40 → expect CLEAN on D3, D4, D9.

### TD-DRIFT-022 · WF-41 .pseudo — D9 structured Inputs block

**Root cause:** `docs/pseudocode/WF-41.pseudo` Inputs Summary is a single inline prose sentence: `{ phoneNumber, adminMessage } from WF-10 (Build WF-41 Payload Set node — caller-prepared, no re-derivation needed)`. No structured block with types / required / validity.

**Cross-cutting audit:**
- **Canon A (TD-DRIFT-015):** WF-41 is a WF-10 callee (not a WF-01 child), but the spirit applies — pseudo already declares top-level `phoneNumber` and live consumes it directly via `$input.first().json.phoneNumber`. WF-41 does NOT perform any DB-SELECT (caller supplies the resolved phone), so the DB-SELECT exemption in Canon A doesn't even need to be invoked. **Trivially compliant — no realignment needed.**
- **TD-DRIFT-019 linear numbering:** Steps 1-4 are already linear with no tombstones. **Compliant.**
- **TD-DRIFT-012 (WF-50 caller `message` → `messageContent`):** live `Prepare WhatsApp Message` Code node already emits `messageContent` (not `message`). **Compliant.**

**Decision (2026-05-24):** Pseudo-only structured Inputs block. No live changes. No cross-WF scope expansion.

**Fix (pseudo only):**
1. **Inputs Summary:** Replace prose line with structured block:
   - `phoneNumber` — E.164 string, required. Caller-resolved by WF-10 (looked up from `slack_channel_id`). Used as the destination for the WF-50 WhatsApp send.
   - `adminMessage` — string, required. The admin's typed Slack message body (post-`adminMessage` extraction in WF-10). Becomes `messageContent` in the WF-50 payload verbatim.
   - Note: WF-10 has already verified `user.status == 'consultation_active'` and resolved `phoneNumber` from the consult channel ID — WF-41 does NOT re-query or re-validate (single-direction admin→user relay; documented in History section of the pseudo).

**Files:** `docs/pseudocode/WF-41.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** none (independent of other items).
**Impact:** Closes D9 for WF-41. No live changes.
**Verify:** Re-run drift-check WF-41 → expect CLEAN on D9.

### TD-DRIFT-023 · WF-42 .pseudo — declared-but-unused inputs + Step 9 destination + Slack copy + WF-51 declaration + structured Inputs

**Root cause:** Five tracker findings (D4, D5, D7, D8, D9) collapse into a single WF-34-family pseudo-rewrite pattern, plus one unflagged D1 (Slack message text mismatch) folded into the same item:

- **D4** — WF-51 called via `Notify Admin in Slack` node but `.pseudo` "Calls Sub-Workflows" lists only WF-50.
- **D5/D7** — pseudo Step 9 says post to `channelId` from input (admin's command channel); live posts to `user.slack_channel_id` from DB-SELECT (consult channel).
- **D8** — `channelId` / `channelName` declared in Inputs but neither consumed from `$json` — `channelId` replaced by DB value (consistent with WF-33 / WF-34 / WF-46 admin-notification-to-consult-channel convention).
- **D9** — Inline prose Inputs sentence, no types/required/validity.
- **D1 (unflagged by drift-check; surfaced during this triage):** Slack confirmation message text diverges:
  - Pseudo Step 9: `"✅ *Consultation Closed*\n\n*User:* <user.name>\n*Phone:* +<user.phone_number>\n\nFeedback request sent to user."` — structured, bold field labels.
  - Live (`Prepare WF-51 Payload`): `"✅ Consultation closed for ${user.name} (${user.phone_number}). Feedback prompt sent via WhatsApp; channel kept open for future rebook."` — single sentence; adds DR-10 context ("channel kept open for future rebook") that's genuinely useful for the admin.

**Cross-cutting audit:**
- **DR-13 (admin-command channel scope):** CLOSE is user-targeted, accepted only in `consult-{phone}`. So input `channelId` === `consult-{phone}` === `user.slack_channel_id`. The pseudo-vs-live destination question is **functionally moot** — they're the same channel by DR-13. Live's DB-SELECT path is also more defensive (works even if a future caller passes a different channelId).
- **Canon A (TD-DRIFT-015):** WF-42 is a WF-11 callee. Pseudo declares top-level `phoneNumber`; live consumes it directly via `$json.phoneNumber` for `Load User by Phone`. Already canonical. ✓
- **TD-DRIFT-019 linear numbering:** Pseudo has tombstones at Step 3, 4, 11, 12 — **already covered by TD-DRIFT-019**, do NOT duplicate the renumber here.
- **WF-34 family convention (TD-DRIFT-020):** Exact same pattern — drop `channelId`/`channelName` from declared Inputs (passthrough envelope from WF-11, unused here), document the passthrough convention briefly.
- **Plugin improvement candidate:** drift-check missed D1 on this WF (live message text materially diverges from pseudo Step 9). The D1 rubric should be re-examined — possibly relating to multi-line embedded literal comparison. Add to handoff for `flush-plugin-improvements`.

**Decision (2026-05-24, Option A + Option A):**
1. Drop `channelId` / `channelName` from declared Inputs; document the passthrough envelope convention briefly.
2. Rewrite Step 9 to clarify the destination is `user.slack_channel_id` from DB-SELECT (functionally identical to input `channelId` per DR-13; matches WF-33/WF-34/WF-46 family convention).
3. Update Step 9 message text to match the live single-sentence form (live is the better admin message — adds DR-10 context).
4. Add WF-51 to "Calls Sub-Workflows".
5. Replace prose Inputs with structured block.

No live changes.

**Fix (pseudo only):**

1. **Inputs Summary:** Replace prose line with structured block:
   - `phoneNumber` — E.164 string, required. **Canonical phone source for this WF (Canon A, TD-DRIFT-015).** Used by `Load User by Phone` WHERE; `user.id` from the result drives `Close Consultation Record` and `Update User Status` UPDATEs.
   - Note: WF-11 passthroughs the full WF-10 envelope (`{messageText, adminUserId, channelId, channelName, commandType, phoneNumber}`); WF-42 consumes only `phoneNumber`. The other fields arrive but are unused. Per DR-13, the inbound `channelId` will always equal `user.slack_channel_id` (CLOSE is user-targeted), but WF-42 sources the Slack destination from the DB-SELECT result for defensive consistency with the WF-33 / WF-34 / WF-46 family convention.

2. **Calls Sub-Workflows:** Update to list `WF-50 (Send WhatsApp), WF-51 (Send Slack Message)`.

3. **Step 9 rewrite:**
   - Old: `Post to Slack channel (channelId from input — admin's channel): "✅ *Consultation Closed*\n\n*User:* <user.name>\n*Phone:* +<user.phone_number>\n\nFeedback request sent to user."`
   - New: `Build WF-51 payload and call WF-51 (Send Slack Message):`
     - `channelId = user.slack_channel_id` (from `Load User by Phone` Step 2 — matches WF-33/WF-34/WF-46 family convention; same channel as input `channelId` per DR-13)
     - `messageText = "✅ Consultation closed for <user.name> (<user.phone_number>). Feedback prompt sent via WhatsApp; channel kept open for future rebook."`

**Files:** `docs/pseudocode/WF-42.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-019 (apply renumber first for clean diff — drops tombstones at Step 3, 4, 11, 12 and renumbers); TD-DRIFT-015 (Canon A reference for `phoneNumber` Input row).
**Impact:** Closes D1, D4, D5, D7, D8, D9 for WF-42. No live changes.
**Verify:** Re-run drift-check WF-42 → expect CLEAN on D1, D4, D5, D7, D8, D9.

### TD-DRIFT-024 · WF-43 .pseudo — D9 structured Inputs + Step 5/13 explicit field-name canonicalization

**Root cause:** Two pseudo-only drifts in `docs/pseudocode/WF-43.pseudo`:
- **D5 partial / Step 13 field-name mismatch:** Pseudo Step 5 (button-NO → "Prompt for feedback") is silent on the WF-50 payload field name; live `Prompt for Feedback` Code node emits canonical `messageContent`. Pseudo Step 13 (Gemini reply path) says `Call WF-50 with phoneNumber, message=<reply>` — matches today's live `Extract Gemini Reply` which emits legacy `message`. After TD-DRIFT-012 (which now includes WF-43 — see expansion above), live will emit canonical `messageContent` from `Extract Gemini Reply` too. Pseudo needs to align to the post-TD-DRIFT-012 canonical contract for both steps.
- **D9 prose-only Inputs:** Inline comma-separated sentence (`phoneNumber, userId, userStatus, messageType, messageText, rawMessage`) — no types / required / validity. Note: `messageText` in declared Inputs is the same alias that TD-DRIFT-009 renames at the WF-25 boundary (live consumes `messageContent` in `Prepare Gemini Response Prompt`). Pseudo should declare `messageContent` to match the post-TD-DRIFT-009 contract.

**Cross-cutting audit:**
- **Canon A (TD-DRIFT-015):** WF-43 is a WF-01 child (consultation_closed routing). Pseudo declares top-level `phoneNumber`; live consumes `$json.phoneNumber` in `Prompt for Feedback` and `Extract Gemini Reply`. No DB-SELECT in WF-43. Already canonical. ✓
- **TD-DRIFT-019 linear numbering:** Steps 1-14 linear, no tombstones. ✓
- **TD-DRIFT-009 (`messageText`→`messageContent` at WF-25 caller):** WF-43 in scope. Pseudo Inputs needs `messageContent` (not `messageText`) after that lands.
- **TD-DRIFT-012 (WF-50 caller canonicalization):** WF-43 added to scope (see expansion above). Pseudo Step 13 needs `messageContent` (not `message`) after that lands.

**Decision (2026-05-24):** Pseudo-only rewrite. Align to canonical post-TD-DRIFT-009/012 contract — the pseudo describes target state. No live changes (live changes happen via TD-DRIFT-009 and the expanded TD-DRIFT-012).

**Fix (pseudo only):**
1. **Inputs Summary:** Replace prose line with structured block:
   - `phoneNumber` — E.164 string, required. Used as WhatsApp destination for both WF-50 paths (feedback prompt + Gemini reply).
   - `userId` — integer, required. Forwarded to downstream sub-workflows (WF-44 feedback recorder, WF-45 rebook, WF-47 unsubscribe).
   - `userStatus` — string, required. Forwarded to WF-25 (Intent Classifier) for context-aware classification (e.g., `consultation_closed` triggers post-consult fallback per TD-DRIFT-011) and to WF-47.
   - `messageType` — string, required. Drives the button-vs-text routing in Step 2.
   - `messageContent` — string, required (when `messageType == 'text'`). The user's typed message body. Consumed by WF-25 classifier prompt and the Gemini response prompt. **Renamed from `messageText` post-TD-DRIFT-009.**
   - `rawMessage` — object, required (when `messageType == 'interactive'`). Carries `rawMessage.interactive.button_reply.id` for button-ID routing in Step 3.
2. **Step 5 (Prompt for feedback) clarification:** Add explicit field-name documentation: "build text payload `{phoneNumber, messageType: 'text', messageContent: '✍️ Thanks for choosing to share your feedback! Please type your thoughts about the consultation and send them — we appreciate every word!'}`; call WF-50 (passthrough)."
3. **Step 13 (Gemini reply send) rewrite:** Replace `Call WF-50 with phoneNumber, message=<reply>` with `Call WF-50 with payload {phoneNumber, messageType: 'text', messageContent: <reply>}` (canonical post-TD-DRIFT-012).

**Files:** `docs/pseudocode/WF-43.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-009 (live WF-25 caller rename), TD-DRIFT-012 (live WF-50 caller rename, including WF-43's `Extract Gemini Reply` per the 2026-05-24 expansion).
**Impact:** Closes D5 + D9 for WF-43. D8 closed by TD-DRIFT-009 directly.
**Verify:** Re-run drift-check WF-43 → expect CLEAN on D5, D8, D9.

### TD-DRIFT-025 · WF-44 .pseudo — structured Inputs (user envelope) + Step 7/9 canonical field names + D4/D1 convention note

**Root cause:** Six tracker findings (D1, D4, D5, D8×2, D9) on `docs/pseudocode/WF-44.pseudo`. Three (D8a, D5 partial, WF-50 caller) are covered by existing cross-cutting items (TD-DRIFT-009 + TD-DRIFT-012). Remainder is a pseudo-only sync — Inputs declaration mismatch (`messageText`→`messageContent`, flat `userId`→nested `user.id` per established WF-32/33/42 envelope template), Step 7/9 field-name updates to canonical post-cross-cutting contract, and a Notes-line convention annotation for the D4/D1 cosmetic read-source asymmetries.

**Findings and disposition:**

| Finding | Disposition |
|---|---|
| D8a (WF-25 caller `messageText`→`messageContent`) | Covered by TD-DRIFT-009 (WF-44 in scope) |
| D8b (DB write reads `.user.id` nested; pseudo declares `userId` flat) | This item — Inputs block declares `user` envelope per TD-DRIFT-016/018/023 template |
| D5 (DB write reads `messageContent`; pseudo Step 7 says `messageText`) | This item — Step 7 rewrite |
| D4 (asymmetric reads — WF-45 caller from trigger; WF-47 caller from `$json`) | This item — Notes-line convention annotation only; no live edit |
| D1 (`Prepare Ack Message` reads `phoneNumber` from trigger, not from DB write `$json`) | This item — same Notes-line annotation |
| D9 (vague inline Inputs) | This item — structured block |
| WF-50 caller `message`→`messageContent` (pseudo Step 9 + live `Prepare Ack Message` + `Send Ack via WF-50`) | Covered by TD-DRIFT-012 (WF-44 in scope) |
| WF-25 caller `userId: $json.userId` likely `undefined` (latent live bug) | Spun out to TD-DRIFT-026 (per [[feedback_systemic_before_individual]]) |

**Cross-cutting audit:**
- **Canon A (TD-DRIFT-015):** WF-44 is a WF-43 callee (not direct WF-01 child). Pseudo declares top-level `phoneNumber`; live consumes `$json.phoneNumber` in WF-25/45/47 callers. Already canonical for phoneNumber. ✓
- **TD-DRIFT-019 linear numbering:** Steps 1-10 linear, no tombstones. ✓
- **D4/D1 cosmetic precedent:** TD-DRIFT-021 (WF-40) decision was "Rewrite pseudo to match live topology... live is the simpler expression; no behaviour change, zero churn risk" — same principle applied here as a Notes annotation rather than a live edit, since the WF-44 asymmetry is sub-topology read-source choice (lower stakes than a topology rewrite).
- **Envelope declaration precedent:** TD-DRIFT-016 (WF-32) line 320-321 + TD-DRIFT-023 (WF-42) line 504 established the pattern: flat `phoneNumber` (Canon A) + nested `user` envelope (id/name/status/etc.) as canonical fields. WF-44 inherits this.

**Decision (2026-05-24):** Pseudo-only rewrite. Aligns to canonical post-TD-DRIFT-009/012 contract and the established WF-32/33/42 envelope-declaration template. Live cosmetic asymmetries (D4/D1) get a one-line Notes convention annotation, no live edit. Latent WF-25 caller `userId=undefined` bug spun out to TD-DRIFT-026.

**Fix (pseudo only):**

1. **Inputs Summary:** Replace prose line with structured block:
   - `phoneNumber` — E.164 string, required. Used as WhatsApp destination for the ack send (Step 9) and forwarded to WF-25 (Step 2), WF-45 (Step 4), WF-47 (Step 6).
   - `user` — object, required. WF-01 envelope (forwarded through WF-43); fields used here:
     - `user.id` — integer, required. FK to `chinmay_astro.users.id`. Used by `Save Feedback to DB` (Step 7) UPDATE WHERE clause.
     - (Other `user.*` fields — name, phone_number, status, etc. — arrive in the envelope but are not consumed by WF-44.)
   - `messageContent` — string, required. The user's typed feedback body. Forwarded to WF-25 (Step 2) and written to `users.feedback` (Step 7). **Renamed from `messageText` post-TD-DRIFT-009.**
   - `userStatus` — string, required. Forwarded to WF-25 for context-aware classification and to WF-45 / WF-47.
2. **Step 2 (Call WF-25):** Update to `Call WF-25 (Intent Classifier) with phoneNumber, messageContent, userId=user.id, userStatus → returns intentResult` (canonical names).
3. **Step 7 (Save Feedback):** Update to `UPDATE chinmay_astro.users SET feedback = <messageContent>, stage = NULL, updated_at = NOW() WHERE id = <user.id>` (canonical `messageContent`; explicit nested `user.id` source).
4. **Step 9 (Call WF-50):** Update to `Call WF-50 with payload {phoneNumber, messageType: 'text', messageContent: <ack text>}` (canonical post-TD-DRIFT-012).
5. **Notes (new section, after Calls Sub-Workflows):**
   - "Read-source convention: prefer reads from the trigger envelope (`$('When Executed by Another Workflow').item.json.…`) over prior-node `$json` references when the value is invariant through the chain — improves readability of source provenance. Live currently mixes the two (e.g., `Call WF-45 Rebook` reads from trigger; `Call WF-47 Unsubscribe` reads from `$json`; `Prepare Ack Message` reads `phoneNumber` from trigger rather than the DB write output). All three sites yield identical values (WF-25 returns input passthrough; DB UPDATE does not mutate phoneNumber). A future cleanup item may normalize if desired."

**Files:** `docs/pseudocode/WF-44.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-009 (live WF-25 caller key rename); TD-DRIFT-012 (live WF-50 caller key rename — WF-44 in scope as one of four callers).
**Impact:** Closes D1, D4, D5, D8 (×2), D9 for WF-44 at the pseudo level. No live changes from this item.
**Verify:** Re-run drift-check WF-44 → expect CLEAN on D1, D4, D5, D8, D9 after TD-DRIFT-009 / 012 have landed and pseudo is updated.

### TD-DRIFT-026 · WF-44 `Call WF-25 Intent Classifier` — `userId` value expression points at undefined field (live fix)

**Root cause:** WF-44's `Call WF-25 Intent Classifier` Execute-Workflow node maps `userId: "={{ $json.userId }}"` in its `workflowInputs.value` block. But WF-44's trigger envelope (forwarded from WF-43 → WF-01) carries nested `user.id`, NOT flat `userId`. Confirmed by inspecting WF-43's pinData: `user: {id: 24, ...}` and `userExists: 24` exist, but no flat `userId` field. The expression therefore evaluates to `undefined` at runtime, and WF-25 receives `userId=undefined` for every feedback-path execution.

Surfaced 2026-05-24 during WF-44 per-WF triage via the envelope-shape audit pattern (per [[feedback_systemic_before_individual]]). The other three WF-25 callers (WF-23/31/43) use `passthrough` mode and don't have this issue; only WF-44 uses `defineBelow` with an explicit `userId: $json.userId` mapping.

**Risk assessment:** Production-impact depends on whether WF-25 uses `userId` for classification or only for logging/context. WF-25.md inspection needed to confirm — likely benign (classification depends on `messageContent` only), but the field-name typo masks any future WF-25 enhancement that wants real `userId` (e.g., per-user classifier tuning).

**Pre-edit investigation (mandatory):**
1. Read WF-25.md `Prepare Intent Request` Code node and any other WF-25 nodes — confirm whether `input.userId` is read anywhere. If only for logging passthrough, this fix is purely defensive (no behaviour change). If used for classification context, the fix removes a real silent degradation.
2. Spot-check `execution_entity` for a recent WF-44 → WF-25 execution; confirm `userId` arrives as `undefined` in WF-25's trigger payload (validates the diagnosis before edit).

**Fix (live edit, one expression):**
WF-44 (`Du2CJ3OTohRFZYoA`) — `Call WF-25 Intent Classifier` Execute-Workflow node:
- Change `userId: "={{ $json.userId }}"` → `userId: "={{ $json.user.id }}"` in `workflowInputs.value`.
- No other field changes (TD-DRIFT-009's `messageText`→`messageContent` rename is a separate edit on the same node, applied via that item).

**Files:** WF-44 (`Du2CJ3OTohRFZYoA`) — `Call WF-25 Intent Classifier` node only.
**Change type:** Surgical (single value-expression edit).
**Depends on:** Investigation step 1 outcome (read WF-25.md `input.userId` usage before edit).
**Coordinates with:** TD-DRIFT-009 (which renames the `messageText` KEY in the same node). The two edits can land together in a single PUT of the node.
**Impact:** Restores correct `userId` value flow to WF-25. Behaviour change depends on WF-25's use of the field (see investigation step 1).
**Verify:**
1. After edit, send a sample feedback-path message; inspect WF-25 execution log; confirm `userId` is the expected integer (not undefined).
2. Re-export WF-44 JSON; grep the `Call WF-25 Intent Classifier` node parameters; confirm `user.id` reference.

### TD-DRIFT-027 · WF-45 .pseudo — structured Inputs (caller-passed phoneNumber only) + Step 4 greeting copy align to live + D8 dead-optional cleanup

**Root cause:** Four tracker findings (D1, D8, D7, D9) on `docs/pseudocode/WF-45.pseudo`. Three (D1, D8, D9) collapse into a single pseudo-only sync per the WF-41 / WF-22 family template; D7 cross-references the active contract-first sub-workflow sprint. The D5 finding (UPDATE uses trigger-envelope `phoneNumber` instead of SELECT result) is NOT a pseudo-vs-live drift — pseudo Step 3 also reads `<phoneNumber>` from the trigger; the latent zero-row-UPDATE risk is a robustness concern, deferred to the tech-error-handling sprint per [[feedback_pseudo_tech_separation]] (see `deferred-to-tech-sprint.md`).

- **D1 — Step 4 greeting copy materially diverges.**
  - Pseudo: `"Welcome back, <user.name>! 🙏\n\nYour birth details are already on file, so we can get started right away.\n\n*Payment Information:*\nAmount: ₹500\n\nPlease send ₹500 via GPay / PhonePe / any UPI app to: +91-9653240263 (Chinmay Mujumdar). Once done, tap the button below:"` — structured Payment Information block, 🙏 emoji, "birth details on file" framing.
  - Live (`Prepare WF-50 Payload (Rebook Payment)` Code node): `"Welcome back ${name}!\n\nYour previous consultation is complete. To rebook, please send ₹500 again via GPay / PhonePe / any UPI app to: +91-9653240263 (Chinmay Mujumdar).\n\nOnce done, tap the button below:"` — single sentence, rebook-context-aware framing ("previous consultation is complete"), no emoji.
  - Live button title is `"Payment Completed ✓"` (with checkmark); pseudo button title is `"Payment Completed"` (no checkmark).
- **D8 — `name` / `userId` declared as optional inputs but neither consumed.** Pseudo Summary line 1 says `Inputs: phoneNumber (and optionally name/userId from caller)`. Live consumes only `phoneNumber`; `name` is sourced from `Load User Record` SELECT, not from the trigger envelope. `userId` is not consumed at all. Caller-side reality (audited 2026-05-24): WF-20 passes `{phoneNumber, userId}`, WF-43 passes via `mappingMode=passthrough` (entire envelope), WF-44 passes `{phoneNumber, userId, userStatus}` — all extras land in WF-45's trigger but are dead-letter. `userStatus` isn't even mentioned in the pseudo declaration.
- **D7 — No explicit output contract.** WF-45 returns no value (terminal sub-workflow — sends WhatsApp via WF-50 and exits). Cross-cutting concern handled by the active `contract-first-sub-workflow-calls-design` sprint (14 items in-progress, planning_complete). This item will add a `void` output declaration consistent with the template that sprint produces; if the contract-first sprint specifies a different convention, this entry's Outputs line should be updated to match.
- **D9 — Vague Inputs sentence.** Same root cause as D8 — single inline prose line, no types/required/validity. Closed by the structured block below.

**Cross-cutting audit:**
- **Canon A (TD-DRIFT-015, tasks.md L239):** WF-45 callers all pass `phoneNumber` at the top level (audited 2026-05-24: WF-20 defineBelow, WF-43 passthrough from upstream WF-25-tagged envelope, WF-44 defineBelow). Pseudo already declares top-level `phoneNumber`. **Trivially compliant — no realignment needed.** Note: WF-45 also performs a `Load User by Phone`-style SELECT (`Load User Record`) for the `name`; per Canon A, DB-result reads are out of scope.
- **TD-DRIFT-019 linear numbering:** Pseudo Steps 1-6 are already linear with no tombstones. **Compliant.** No renumber needed.
- **TD-DRIFT-012 (WF-50 caller `message` → `messageContent`):** WF-45's `Prepare WF-50 Payload (Rebook Payment)` Code node already emits canonical `phoneNumber`, `messageType`, `interactivePayload` — text body goes inside `interactivePayload.body.text` (interactive variant, not subject to the `messageContent`-key contract). **Compliant.** No expansion of TD-DRIFT-012 needed.
- **Passthrough-chain audit (per TD-DRIFT-012 carry-forward pattern, [[feedback_systemic_before_individual]]):** WF-43's caller (`Route to Rebook WF-45`) uses `mappingMode=passthrough` — but the chain forwards to WF-45, not to WF-50. WF-45 itself uses `defineBelow=passthrough` from its own internal Code node (which DOES emit canonical names). So no caller-canonicalization gap.
- **D1 decision precedent:** TD-DRIFT-021 (WF-40 Step 4-6 rewrite, L425) chose "Rewrite pseudo to match live topology... live is the simpler expression; no behaviour change, zero churn risk" (Option A). TD-DRIFT-023 (WF-42 Slack copy, L495) chose live's single-sentence form over pseudo's structured form for the same reason. **Decision (2026-05-24): align pseudo to live (same Option A pattern).** User-confirmed via needs-decision moment: live's rebook-context-aware copy ("previous consultation is complete") is the canonical customer-facing message; pseudo's older "birth details on file" framing was generic and pre-dated the post-consultation flow design.

**Decision (2026-05-24):** Pseudo-only sync. No live changes. Five elements:
1. Rewrite Step 4 message body + button title to match live verbatim (Option A — live→pseudo).
2. Drop `name` and `userId` from Summary line 1 ("optionally name/userId from caller" phrase removed).
3. Replace inline Summary Inputs prose with a structured **Inputs** block declaring only what's actually consumed (`phoneNumber`), with a paragraph documenting caller-side passthrough extras as ignored.
4. Add an explicit **Outputs** line (`void` / "no return value to caller — terminal sub-workflow"), pending the contract-first sprint's final convention.
5. Cross-reference TD-DRIFT-015 (Canon A), the D1 decision precedent (TD-DRIFT-021/023), and the contract-first sprint for the Outputs line.

**Fix (pseudo only):**

1. **Inputs Summary:** Replace the prose line with a structured block:
   - `phoneNumber` — E.164 string, required. **Canonical phone source for this WF (Canon A, TD-DRIFT-015).** Used by `Load User Record` SELECT (Step 2) to resolve `name`, and as the WHERE for `Set status=payment_pending` UPDATE (Step 3). Passed verbatim to WF-50 as the destination phone.
   - Note: WF-45's callers (WF-20 Keyword Handler, WF-43 Post-Consultation Handler, WF-44 Feedback Recorder) pass additional trigger-envelope fields (`userId` from WF-20/WF-44, `userStatus` from WF-44) that WF-45 does NOT consume. WF-43 uses `mappingMode=passthrough` and forwards its full envelope. These extras land in the trigger payload but are dead-letter inside WF-45 — `name` is always re-fetched from the SELECT result, never from the caller. Documented here so future caller additions don't expect WF-45 to consume them.

2. **Outputs:** Add an explicit line: `Outputs: void (terminal sub-workflow — sends WhatsApp via WF-50 and exits; no return value to caller). Pending the contract-first-sub-workflow-calls-design sprint's final convention for terminal sub-workflows; this declaration to be updated to match that sprint's template.`

3. **Step 4 rewrite (align to live verbatim):**
   - Old: ``body.text = "Welcome back, <user.name>! 🙏\n\nYour birth details are already on file, so we can get started right away.\n\n*Payment Information:*\nAmount: ₹500\n\nPlease send ₹500 via GPay / PhonePe / any UPI app to: +91-9653240263 (Chinmay Mujumdar). Once done, tap the button below:"`` and `buttons: [ { id: "payment_completed", title: "Payment Completed" } ]`
   - New: ``body.text = "Welcome back <user.name>!\n\nYour previous consultation is complete. To rebook, please send ₹500 again via GPay / PhonePe / any UPI app to: +91-9653240263 (Chinmay Mujumdar).\n\nOnce done, tap the button below:"`` and `buttons: [ { id: "payment_completed", title: "Payment Completed ✓" } ]`
   - Rationale note (in pseudo): "Copy aligned to live 2026-05-24 (TD-DRIFT-027). Live's rebook-context-aware framing was chosen over the pseudo's generic 'birth details on file' wording per the D1 decision precedent (Option A — align pseudo to live; zero live churn) established by TD-DRIFT-021 (WF-40) and TD-DRIFT-023 (WF-42)."

4. **Summary line 1:** Drop "(and optionally name/userId from caller)" — replace with the structured Inputs block above.

**Files:** `docs/pseudocode/WF-45.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-015 (Canon A reference). Loosely coupled to `contract-first-sub-workflow-calls-design` sprint — Outputs declaration may need a final-pass tweak once that sprint lands its terminal-sub-workflow convention, but can ship now with the placeholder `void` declaration.
**Coordinates with:** None on the live side. WF-45 D5 (latent zero-row-UPDATE risk) deferred to the tech-error-handling sprint; see `deferred-to-tech-sprint.md`.
**Impact:** Closes D1, D8, D9 for WF-45 (and partial D7 via the placeholder Outputs line). No live changes. No customer-visible behaviour change.
**Verify:** Re-run drift-check WF-45 → expect ✅ CLEAN on D1, D8, D9; D7 may persist as ⚠️ minor until the contract-first sprint settles the terminal-sub-workflow convention.

### TD-DRIFT-028 · WF-46 .pseudo — structured Inputs + D4 passthrough Notes annotation + D8 accepted-as-is

**Root cause:** Three tracker findings (D4, D8, D9) on `docs/pseudocode/WF-46.pseudo`. All three collapse into a single pseudo-only sync per the WF-25 / WF-44 family precedent (Notes-annotation + structured Inputs + convention-only acceptance). The D6 minor (shared zero-row error-path) is generic tech-error-handling, deferred to the tech sprint.

- **D4 — `Call WF-51 Notify Admin` uses `mappingMode=passthrough` with `convertFieldsToString=true`; pseudo Step 4-5 implies explicit payload hand-off.** Functionally identical: upstream `Prepare WF-51 Payload (Notify Admin Blocked)` Code node emits exactly `{channelId, messageText}` which is the canonical WF-51 input contract. `convertFieldsToString=true` is a default n8n parameter; both fields are already strings so no coercion fires. **Severity: cosmetic only.**
- **D8 — `channelId` and `reason` not validated at trigger boundary (passthrough, no schema).** Project-wide n8n convention — every sub-workflow trigger in this project uses `inputSource=passthrough` with no schema; contracts are enforced by caller-side mapping conventions, not at the trigger. **Per the WF-25 D2 precedent (TD-DRIFT-011, L644): convention-only contracts are accepted-as-is** rather than fixed per-WF. A cross-cutting trigger-schema-hardening sprint would be its own decision.
- **D9 — Vague Inputs single inline sentence.** Replace with structured block. WF-46 callers are WF-11 (admin BLOCK, passthrough mode) and WF-25 (malicious_abusive/inappropriate auto-block, passthrough mode); both pass `{phoneNumber, reason, channelId}` from their own trigger envelopes.

**Cross-cutting audit:**
- **Canon A (TD-DRIFT-015, L239):** Both callers pass `phoneNumber` at the top level via passthrough; pseudo already declares top-level `phoneNumber`; live consumes `$json.phoneNumber` directly in `Load User by Phone`. **Trivially compliant — no realignment needed.** Per the audit step 3 exemption, `Load User by Phone` is a DB-SELECT entry point (consumes trigger envelope phoneNumber, not a DB-result one).
- **TD-DRIFT-019 linear numbering:** Steps 1-5 linear, no tombstones. **Compliant.**
- **TD-DRIFT-012 (WF-50 caller canonicalization):** WF-46 does NOT call WF-50; only WF-51. **N/A.**
- **TD-DRIFT-025 read-source convention precedent (L572):** D4 cosmetic asymmetry follows the same pattern — pseudo + live yield identical payload to WF-51; annotate as a Notes-line convention rather than a live edit. Zero churn risk.
- **Passthrough-chain audit (per TD-DRIFT-012 carry-forward, [[feedback_systemic_before_individual]]):** WF-46 → WF-51 passthrough caller. Upstream `Prepare WF-51 Payload` Code node emits canonical `channelId` + `messageText` (the WF-51 input contract). **Compliant** — no WF-51-caller-canonicalization gap to add.
- **Existing pseudo TD candidates (preserve, don't re-flag):**
  - `blocked_reason` hardcoded to 'Blocked by admin' instead of caller's `reason` — already documented in WF-46.pseudo Notes line 12 as a TD candidate.
  - No `admin_actions` INSERT — already documented per [[project_admin_actions_deprecated]].

**Decision (2026-05-24):** Pseudo-only sync. No live changes. Three elements:
1. Replace inline Inputs prose with a structured block declaring `phoneNumber` / `reason` / `channelId` with required/optional flags, types, and the WF-25-path channelId fallback.
2. Add a Notes-line annotation declaring the passthrough hand-off convention to WF-51 (TD-DRIFT-025 precedent).
3. Add a Notes-line accepting D8 (trigger-schema absence) as the project's convention-only contract pattern, citing TD-DRIFT-011 (WF-25 D2) as precedent.

**Fix (pseudo only):**

1. **Inputs Summary:** Replace the prose line with a structured block:
   - `phoneNumber` — E.164 string, required. **Canonical phone source for this WF (Canon A, TD-DRIFT-015).** Used by `Load User by Phone` SELECT; `user.id` from the result drives `Update User to Blocked Status`.
   - `reason` — string, optional. The admin-supplied reason (BLOCK command path) or the intent classifier verdict (WF-25 auto-block path). Used in the Slack confirmation message only (Step 4); NOT persisted (`blocked_reason` is hardcoded to `'Blocked by admin'` in the UPDATE — see Notes line 12 for the TD candidate). Defaults to `'Not provided'` in the Slack message when absent or empty.
   - `channelId` — Slack channel ID string, optional. The caller's source channel (WF-11 path: admin's `consult-{phone}` channel per DR-13; WF-25 path: typically absent). Falls back to `user.slack_channel_id` (from the SELECT result) when absent — `Prepare WF-51 Payload` resolves this fallback explicitly.

2. **Notes additions (append to existing Notes block):**
   - **Passthrough hand-off to WF-51 (D4 convention):** `Call WF-51 Notify Admin` uses `mappingMode=passthrough` with `convertFieldsToString=true`. The upstream `Prepare WF-51 Payload` Code node emits exactly the WF-51 canonical contract (`{channelId, messageText}`), so passthrough is functionally identical to explicit hand-off. `convertFieldsToString` is the n8n default and has no effect here (both fields are already strings). Documented as a project-wide convention per TD-DRIFT-025; no live edit needed.
   - **Trigger contract is convention-only (D8 accepted):** `When Executed by Another Workflow` uses `inputSource=passthrough` with empty schema; callers (WF-11, WF-25) are expected to pass `{phoneNumber, reason?, channelId?}` by name. Pattern matches every other sub-workflow trigger in this project; cross-cutting schema-hardening would be its own dedicated sprint. D8 acknowledged as accepted-as-is per TD-DRIFT-011 / WF-25 D2 precedent.

**Files:** `docs/pseudocode/WF-46.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-015 (Canon A reference).
**Coordinates with:** None on the live side. WF-46 D6 minor (zero-row error-path) deferred to tech-error-handling sprint; see `deferred-to-tech-sprint.md` shared family.
**Impact:** Closes D4, D8, D9 for WF-46. No live changes. No customer-visible behaviour change.
**Verify:** Re-run drift-check WF-46 → expect ✅ CLEAN on D4, D8, D9.

### TD-DRIFT-029 · WF-50 .pseudo — discriminated-union structured Inputs (send variants + logging-context partition) + D6 cosmetic Notes

**Root cause:** Two tracker findings (D9, D6 minor) on `docs/pseudocode/WF-50.pseudo`. D9 collapses into a structured Inputs block with three partitions (discriminator + per-variant required fields + logging-context passthrough); D6 is phrasing-only and accepted-as-is. This is the first WF in the sweep to establish the **discriminated-union Inputs pattern** that WF-60 will reuse (transport='wa'|'slack' there; messageType='text'|'interactive'|'template' here).

- **D9 — `.pseudo` Summary's logging-context fields (`userId`, `inboundMessageId`, `userMessage`) listed as trailing 'Also:' aside with no required/optional designation.** Other inputs reasonably explicit but unstructured. Also missing: `phoneNumberFormatted` (legacy fallback), `user` envelope (used by `Prepare Payload` for `user?.id` and `user?.current_consultation_id` resolution), and the canonical-vs-legacy partition for the body field name pending TD-DRIFT-013.
- **D6 — `Process Result` adds null-array guard (`sendResult.messages && sendResult.messages[0]`) not described in pseudo (strictly safer; phrasing-only).** Pseudo Step 10 says "if response.messages[0] present" — the null-check before bracket access is implicit in any sane JS reader; pseudo's phrasing reasonably captures the live's semantic. **Severity: ⚠️ minor.** Cosmetic only.

**Cross-cutting audit:**
- **Canon A (TD-DRIFT-015, L239):** `Prepare Payload` accepts `phoneNumber || phoneNumberFormatted` (canonical + legacy fallback). Will tighten to canonical-only when TD-DRIFT-013 lands. Pseudo declares `phoneNumber` top-level. ✓ Compliant; legacy alias documented in the Inputs block per the canonical-vs-legacy partition pattern.
- **TD-DRIFT-012 (cross-cutting WF-50 caller canonicalization, L122):** WF-50 is *the target* of TD-DRIFT-012/013. Pseudo Inputs block must declare `messageContent` as canonical with `message` / `messageBody` as deprecated aliases accepted by `Prepare Payload` until TD-DRIFT-013 hardens the contract. After TD-DRIFT-013 lands, the legacy-alias declarations in the Inputs block can be removed (tracked as a future-removal Note).
- **TD-DRIFT-019 linear numbering:** WF-50.pseudo uses `Step 3a` (drop-branch sub-step). Per [[feedback_pseudo_linear_numbering]] the rule is specifically about tombstones (`(removed)`, `(deleted)`, `(reserved)`), NOT branch sub-steps. `Step 3a` is a real algorithmic step on the drop branch — convention-conformant as-is. No renumber needed. **Compliant.**
- **Discriminated-union Inputs (plugin candidate from prior handoff #2):** WF-50 is the first WF in this sweep where the discriminator-and-variants pattern (`messageType` discriminator → variant-specific required fields) applies. The structured block established here is the template for WF-60 (transport='wa'|'slack' discriminator).
- **Passthrough-chain audit (per TD-DRIFT-012 carry-forward, [[feedback_systemic_before_individual]]):** WF-50 → WF-60 caller. `Build WF-60 Payload (Outbound)` and `Build WF-60 Drop Payload` Code nodes both emit the canonical WF-60 input shape per TD-F. **Compliant** — no WF-60-caller-canonicalization gap to add.
- **Existing pseudo TD annotations preserve as-is:**
  - TD-033 null/empty body guard (Step 3) — already documented.
  - TD-F per-type content extraction for WF-60 logging — already documented at Notes line 17.

**Decision (2026-05-24):** Pseudo-only sync. No live changes (TD-DRIFT-012/-013 already cover the live hardening). Three elements:
1. Replace inline Summary Inputs bullet with a structured **Inputs** block organized in three partitions: (a) discriminator + common required, (b) per-variant required, (c) logging-context passthrough.
2. Document the canonical-vs-legacy aliases (`messageContent` canonical + `message`/`messageBody` deprecated; `phoneNumber` canonical + `phoneNumberFormatted` legacy fallback; `user` envelope for `userId`/`consultationId` derivation fallbacks) pending TD-DRIFT-013 contract hardening.
3. Add a Notes-line accepting D6 (Process Result null-array guard) as phrasing-only — pseudo Step 10's "if response.messages[0] present" reasonably captures the live's null-check semantic; no rewrite needed.

**Fix (pseudo only):**

1. **Inputs Summary:** Replace the multi-bullet line + trailing 'Also:' aside with a structured **Inputs** block:

   **Common (all variants):**
   - `messageType` — enum string, required (default `'text'`). One of `'text'` / `'interactive'` / `'template'`. **Discriminator** — selects which variant-specific fields apply.
   - `phoneNumber` — E.164 string, required. **Canonical phone source (Canon A, TD-DRIFT-015).** Used as recipient for the WhatsApp API send and forwarded to WF-60 logging.
   - `phoneNumberFormatted` — E.164 string, optional (legacy fallback). Used by `Prepare Payload` only when `phoneNumber` is absent — to be removed when TD-DRIFT-013 hardens the contract.

   **Variant — `messageType='text'`:**
   - `messageContent` — string, required (canonical body field). **Empty/whitespace-only → drop path (TD-033 guard, Step 3).**
   - `message`, `messageBody` — string, optional **(deprecated legacy aliases)**. `Prepare Payload` accepts these as fallback chain `messageContent || message || messageBody`. Will be removed when TD-DRIFT-013 lands; current pseudo declares them so the contract-vs-fallback is auditable.

   **Variant — `messageType='interactive'`:**
   - `interactivePayload` — object, required. Has two sub-variants discriminated by `interactivePayload.type`:
     - **flow** (`interactivePayload.type === 'flow'`): `{ type, flowId (required, non-empty), flowCta, header.text, body.text }`. Drop guard: `flowId` empty/whitespace.
     - **button** (`interactivePayload.type === 'button'`): `{ type, body.text, action.buttons (required, non-empty array of { id, title }) }`. Drop guard: `action.buttons` missing/empty.
     - Any other `interactivePayload.type` → drop path.

   **Variant — `messageType='template'`:**
   - `templateName` — string, required. **Empty/whitespace → drop path.**
   - `templateParams` — array, optional (default `[]`). Each element coerced to string and mapped to a body parameter.

   **Logging-context passthrough (not consumed by send logic; forwarded to WF-60 only):**
   - `consultationId` — integer, optional. Falls back to `user?.current_consultation_id` when absent. Passed to WF-60 for the `messages.consultation_id` FK link.
   - `userId` — integer, optional. Falls back to `user?.id` when absent. Passed to WF-60 for the `messages.user_id` FK link.
   - `inboundMessageId` — integer, optional. The user-side message that triggered this outbound (when applicable, e.g. relay or reply paths). Passed to WF-60 metadata.
   - `userMessage` — string, optional. The user's text that prompted this send (for audit-trail context in WF-60 metadata).
   - `user` — object, optional. Caller's user-envelope; `Prepare Payload` derives `userId`/`consultationId` from `user.id` / `user.current_consultation_id` when the flat fields are absent.

   Add a brief paragraph after the block: "**Partition rationale (per TD-DRIFT-014 router-pattern precedent extended to leaf-with-logging-context):** WF-50 has two consumption axes — (1) the send-payload axis (discriminator + per-variant required fields, validated by the Step 3 drop guard) and (2) the logging-context axis (passthrough fields forwarded to WF-60). Declaring these as separate partitions makes the consumed-vs-forwarded distinction explicit and matches the canonical WF-60 input contract documented in TD-F (2026-05-21)."

2. **Notes additions (append to existing Notes block):**
   - **D6 phrasing acceptance:** `Process Result` (Step 10) checks `sendResult.messages && sendResult.messages[0]` before accessing the array index. Pseudo's "if response.messages[0] present" reasonably captures this semantic — the null-check before bracket access is implicit in any sane JS reader. Accepted-as-is per WF-50 D6 minor finding (2026-05-24); no rewrite needed.
   - **Legacy-alias future-removal note:** The `message` / `messageBody` body-field aliases and the `phoneNumberFormatted` phone fallback are declared in the Inputs block per the canonical-vs-legacy partition pattern. When TD-DRIFT-013 lands (post-TD-DRIFT-012 caller canonicalization), `Prepare Payload` will require canonical `messageContent` / `phoneNumber` only. At that point, the legacy-alias rows can be removed from the Inputs block.

**Files:** `docs/pseudocode/WF-50.pseudo`.
**Change type:** Documentation (pseudo only).
**Depends on:** TD-DRIFT-015 (Canon A reference). Loosely coupled to TD-DRIFT-013 — legacy-alias rows can be removed post-TD-DRIFT-013, but can ship now with the deprecation annotation.
**Coordinates with:** None on the live side. Sets the discriminated-union Inputs pattern template for WF-60 (next-after-next triage).
**Impact:** Closes D9 for WF-50; D6 minor accepted-as-is. No live changes. Establishes discriminated-union Inputs template for future leaves.
**Verify:** Re-run drift-check WF-50 → expect ✅ CLEAN on D9; D6 may persist as ⚠️ minor with the accepted-as-is Notes annotation.

### TD-DRIFT-030 · WF-51 .pseudo — D2 minor accepted-as-is + D3 deferred to tech-error-handling sprint

**Root cause:** Two tracker findings on `docs/pseudocode/WF-51.pseudo` (D3, D2 minor). Neither produces a pseudo rewrite. D3 is a tech-error mechanism gap that pseudo line 12 *already* correctly documents as TD-NEW-028 — pseudo and live agree (both lack the error branch), so this is not pseudo-vs-live drift but a shared feature gap deferred to the tech-error-handling sprint. D2 minor is the same accepted-as-is class as TD-DRIFT-028 (WF-46 D8) / TD-DRIFT-011 D2 (WF-25): trigger `inputSource=passthrough` with no schema enforcement is a project-wide convention, contract-policed only at the caller side.

- **D3 — `.md` topology has no error-branch node for Slack API failure; `.pseudo` acknowledges this gap (TD-NEW-028) but live node set has no placeholder error path.** Pseudo line 12 reads verbatim: *"Slack-failure logging is NOT wired (no On Error → WF-60 path). Tracked as TD-NEW-028 for the planned error-handling sprint."* This is a tech-error-handling mechanism gap (per [[feedback_pseudo_tech_separation]]), not a behavioural divergence between pseudo and live. Same class as the prior tech-defer entries (WF-02 D6, WF-10 D6, WF-47 D5, WF-45 D5, WF-46 D6) — defer to the upcoming dedicated tech-error-handling sprint. **No pseudo edit.**
- **D2 — Trigger uses `inputSource=passthrough`; `.pseudo` implies structured destructuring at entry.** Severity: ⚠️ minor. Same class as TD-DRIFT-028 (WF-46 D8) / TD-DRIFT-011 D2 (WF-25): the trigger schema is intentionally empty; the canonical contract is policed at caller-side `Execute Workflow` mappings and the post-trigger Code node (`Build WF-60 Payload (Slack Outbound)` reads via `$('Execute Workflow Trigger').first().json.channelId/messageText/userId/consultationId`). Notes-line annotation accepting the convention, cross-referencing the prior precedents.

**Cross-cutting audit:**
- **Caller-list verification (per [[feedback_systemic_before_individual]] + handoff plugin candidate #12 "audit multi-caller WFs"):** WF-51 is called by 14 distinct workflows (grep `wlZRK0YxnhP0b2RL workflows/*.json`): WF-02, WF-10, WF-11, WF-12, WF-23, WF-25, WF-30, WF-31, WF-32, WF-33, WF-40, WF-42, WF-43, WF-46. All callers pass canonical `{ channelId, messageText }` (and optional `userId`/`consultationId` for those that have it). No caller-side contract divergence detected. WF-11 has its own `channelId` vs `channelName` finding (tracker L91 D4) but that is WF-11's payload-construction concern, not WF-51's input contract — out of scope for this row.
- **D9 not flagged for WF-51** (tracker L55: "Only WF-21 and (arguably) WF-47, WF-51 are close to compliant"). The current inline Inputs sentence (pseudo line 5 — "channelId, messageText, optional userId/consultationId") is reasonably structured for a 2-required-plus-2-optional contract. **Not in scope** for this row; deliberately not upgrading to a full structured block to keep the triage scoped.
- **Discriminated-union template (TD-DRIFT-029 precedent):** Not applicable — WF-51 has no variant discriminator (single message variant: text-only Slack post). The template applies to WF-60 next, not here.
- **Convention-only contract acceptance (TD-DRIFT-028 / WF-25 D2 precedent):** D2 minor fits this precedent exactly. The Notes annotation cites both prior decisions so the project-wide convention is auditable.

**Decision (2026-05-24):** Two-element minimal action:
1. **D3 → defer to tech-error-handling sprint.** Add an entry to `deferred-to-tech-sprint.md`. No pseudo edit; pseudo line 12 already correctly documents the gap.
2. **D2 minor → Notes-line annotation only.** Append one line to the existing Notes block citing the TD-DRIFT-028 / WF-25 D2 precedent.

**Fix (pseudo only):**

1. **Notes addition (append to existing Notes block):**
   - **D2 trigger-passthrough acceptance:** The `Execute Workflow Trigger` node uses `inputSource=passthrough` with no enforced schema — the canonical `{ channelId, messageText, [userId], [consultationId] }` contract is policed at caller-side `Execute Workflow` mappings and at the post-trigger Code node (`Build WF-60 Payload (Slack Outbound)`). Accepted-as-is per WF-46 D8 (TD-DRIFT-028) / WF-25 D2 (TD-DRIFT-011) project-wide convention — cross-cutting schema-hardening at the trigger boundary would be its own dedicated tech sprint, not a per-WF decision.

**Files:** `docs/pseudocode/WF-51.pseudo`, `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/deferred-to-tech-sprint.md`.
**Change type:** Documentation (pseudo Notes line + deferred-tracker row).
**Depends on:** None.
**Coordinates with:** Future tech-error-handling sprint inherits D3 via the `deferred-to-tech-sprint.md` row.
**Impact:** Closes D2 minor via Notes annotation; D3 formally deferred (pseudo and live already agree on the gap). No live changes. No behaviour change.
**Verify:** Re-run drift-check WF-51 → expect D2 to persist as ⚠️ minor with the accepted-as-is Notes annotation; D3 to remain 🔴 until the tech-error-handling sprint actions it.

### TD-DRIFT-031 · WF-52 .pseudo — two-role admin invitation + runtime team_id derivation + structured Inputs (D1 + D3 + D9)

**Root cause:** Three tracker findings on `docs/pseudocode/WF-52.pseudo`, all genuine pseudo-vs-live drift. D1 carried the only **needs-decision** moment of this session — three candidate admin IDs in play (live `U0B4BBML6CS` + `U0A4175DJ5D`; pseudo `U0AGTECS1KR`), none verified. User-decision (2026-05-24, via `AskUserQuestion` with [[feedback_needs_decision_context]] + [[feedback_admin_message_tone]] citation discipline) **chose live**: `U0B4BBML6CS` is Chinmay (Business Admin — issues admin commands) and `U0A4175DJ5D` is Prasad (Technical Admin — workspace primary owner, in-channel for system observability during MVP). Pseudo's `U0AGTECS1KR` does not exist in the workspace (confirmed via `mcp__slack__slack_get_users` lookup) — stale ID from an earlier design iteration. D3 is a real mechanism drift (pseudo uses `$env.SLACK_TEAM_ID`, live derives `context_team_id` from Slack API response). D9 is the standard Inputs-block upgrade.

- **D1 — Live `Invite Admin to Channel` invites two user IDs (`U0B4BBML6CS` and `U0A4175DJ5D`); `.pseudo` Step 4 documents only one (`U0AGTECS1KR`). Neither live ID matches the spec.** Severity: 🔴 drift. **Decision: live wins — invite both admins.** Pseudo Step 4 must be updated to `users=['U0B4BBML6CS', 'U0A4175DJ5D']` with role-based comments (Business Admin / Technical Admin) so future readers understand the two-role model. The Summary's "single-admin MVP" framing is incorrect for channel membership; correct for command attribution — Notes-line annotation disambiguates.
- **D3 — `.pseudo` Steps 5 and 9 use `$env.SLACK_TEAM_ID` for `channelUrl`; live derives `teamId` from `channelData.context_team_id` at runtime.** Severity: 🔴 drift. Both produce identical URLs (workspace `team_id` is invariant) but the runtime derivation avoids any env-var dependency. Live wins on robustness. Update pseudo Step 5 and Step 9 to describe runtime derivation from the Slack API response field; add Notes-line documenting the rationale.
- **D9 — Inputs line is a vague single sentence ("phone_number (or phoneNumber), name (or userName), userId"); no types, required/optional designation, or validity rules.** Severity: 🔴 drift. Replace with a structured Inputs block organized in two partitions: (a) canonical fields with type + required/optional + purpose, (b) legacy aliases with the resolution chain that `Prepare Channel Name` actually executes. This is the same pattern as TD-DRIFT-029 (WF-50) but without a discriminator (WF-52 is single-variant).

**Cross-cutting audit:**
- **Caller-list verification (per handoff plugin candidate #12):** WF-52 has **one** caller (WF-22 `Ensure Slack Channel Exists (WF-52)` node, `mappingMode=passthrough`). Single-caller WF — narrative caller-list error risk is low. Verified via `grep -l "IO5BZLUxuVmjzk5I" workflows/*.json`.
- **Latent caller-contract gap surfaced during triage (NOT in scope for this row):** WF-22's `Create User Record` Postgres `RETURNING` clause yields `id` (snake_case `id`, not `userId`). WF-52's `Prepare Channel Name` Code node reads `input.userId` with no `id` fallback. Result: `userId` is `undefined` when WF-22 calls WF-52 today. Behaviour-neutral (the field is forwarded into the local Code-node shape but never consumed by Slack channel ops) but a real contract gap. Documented as a "Latent caller-contract gap" paragraph in the new Inputs block; flagged for future TD-DRIFT-013-class caller-contract hardening, not patched here per [[feedback_pseudo_tech_separation]]+sprint-scope discipline.
- **Single-admin-model memory reconciliation:** [[project_admin_actions_deprecated]] memory references "single-admin operation" as the justification for `admin_actions` table deprecation. The user's 2026-05-24 clarification confirms this is operationally still correct — Chinmay (Business Admin) remains the only command-issuing admin; Prasad (Technical Admin) is in-channel only for observability and does not issue APPROVE/REJECT/CLOSE commands. So the memory's deprecation argument stands; only the wording needs a clarifying note that "single-admin" = single-operator-admin, not single-channel-member. Memory update is a side-effect of this row; non-blocking.
- **No other pseudo file references the WF-52 admin invitation specifically;** WF-46 references `admin_actions` deprecation correctly. WF-32 (calls WF-52 historically? — verified NO, WF-32 reads existing slack_channel_id from DB per CLAUDE.md Design Rule #2). No other WFs affected.
- **TD-DRIFT-019 linear numbering:** WF-52.pseudo uses `Step 6a` (drop-branch sub-step for the structured-error-return path). Per [[feedback_pseudo_linear_numbering]] the rule is about tombstones (`(removed)`/`(deleted)`/`(reserved)`), not branch sub-steps. `Step 6a` is a real algorithmic step on the error branch — convention-conformant. No renumber needed. **Compliant.**

**Decision (2026-05-24):** Pseudo-only sync. No live changes. Three-element rewrite of WF-52.pseudo:
1. **D1 fix:** Step 4 — `users=['U0B4BBML6CS' /* Chinmay — Business Admin */, 'U0A4175DJ5D' /* Prasad — Technical Admin */]`. Summary line restructured to name both roles. New Notes-line documenting the two-role-vs-single-operator-admin distinction.
2. **D3 fix:** Steps 5 and 9 — replace `<team_id from $env.SLACK_TEAM_ID>` with `<team_id derived at runtime from the Slack API response field `context_team_id`>`. New Notes-line documenting the rationale.
3. **D9 fix:** Replace inline Inputs sentence with a structured `## Inputs` H2 block (canonical / legacy aliases partition), plus a "Latent caller-contract gap" paragraph documenting the `userId` ↔ `id` issue for future hardening.

**Fix (pseudo only):** Whole-file rewrite via Write (Summary + new Inputs block + Notes additions + Algorithm Step 4/5/9 edits). Done in this row's edit.

**Memory side-effect:** Append a clarifying paragraph to `[[project_admin_actions_deprecated]]` distinguishing single-operator-admin (Chinmay issues commands) from channel membership (two roles: Business + Technical Admin both present). Non-blocking for this row.

**Files:**
- `docs/pseudocode/WF-52.pseudo` (whole-file rewrite).
- `~/.claude/projects/.../memory/project_admin_actions_deprecated.md` (clarifying paragraph appended).

**Change type:** Documentation (pseudo rewrite + memory clarification).
**Depends on:** None. (Loosely coupled to future TD-DRIFT-013-class caller-contract sweep for the `userId` ↔ `id` gap.)
**Coordinates with:** None on the live side.
**Impact:** Closes D1, D3, D9 for WF-52. Documents the two-role admin model accurately. No live changes. No behaviour change.
**Verify:** Re-run drift-check WF-52 → expect ✅ CLEAN on D1, D3, D9. Inspect `[[project_admin_actions_deprecated]]` for the clarifying paragraph.

### TD-DRIFT-032 · WF-60 .pseudo — discriminated-union structured Inputs + Output reason-string alignment + D6 minor Notes annotation

**Root cause:** Four tracker findings on `docs/pseudocode/WF-60.pseudo`. D9 collapses into the discriminated-union Inputs template established in TD-DRIFT-029 (WF-50) — three partitions: discriminator + common required / per-transport-variant required / metadata-passthrough. D8 surfaces two missing metadata fields (`inboundMessageId`, `sentAt`) that the live `Extract Message Data` Code node consumes from input and folds into the `metadata` JSONB but were absent from the pseudo Inputs list. D7 is a real reason-string contract divergence — live emits `'pre_onboarding_user'` for inbound and `'no userId — caller did not provide user identification'` for outbound; pseudo had `'no userId — ...'` and `'no userId for outbound'` respectively. Live is right (clearer audit-trail strings). D6 minor is a `.md`-generator completeness gap, NOT pseudo↔live drift — verified via direct JSON inspection.

- **D7 — `Skip Log (no userId)` node emits `reason='pre_onboarding_user'` for inbound pre-onboarding; `.pseudo` documents `'no userId — …'`. String contract diverges.** Severity: 🔴 drift. **Live is right** — `'pre_onboarding_user'` is a clearer audit-trail reason (the inbound message exists, the user record doesn't yet; the `pendingUsers` table is the bridge). Outbound reason similarly diverges: live `'no userId — caller did not provide user identification'` (verbatim from the Code node) vs pseudo `'no userId for outbound'`. Update pseudo Outputs block + Step 5 to match live verbatim.
- **D8 — `inboundMessageId` and `sentAt` consumed by `Extract Message Data` but entirely absent from `.pseudo` Inputs. Top-level vs nested status of `rawMessage`/`timestamp`/`contactName`/`success`/`error` ambiguous.** Severity: 🔴 drift. Both fields are folded into the `metadata` JSONB column at Step 2 (verified at live Code node lines `inboundMessageId: input.inboundMessageId || null` and `sentAt: input.sentAt || null`). Add both to the new structured Inputs metadata-passthrough partition with their purpose documented. Clarify partition boundaries so top-level-INSERT-column fields are visually distinct from metadata-passthrough fields.
- **D9 — Discriminated-union variants (WhatsApp-log: `transport='wa'` requires `phoneNumber`/`whatsappMessageId`; Slack-log: `transport='slack'` requires `slackChannelId`/`slackMessageTs`) not declared as distinct variants. All fields presented in one undifferentiated list.** Severity: 🔴 drift. **Apply TD-DRIFT-029 (WF-50) discriminated-union Inputs template directly.** WF-60's discriminator is `transport`, WF-50's was `messageType`; the pattern translates exactly. Add a third partition for metadata-passthrough (folded into JSONB, never consumed for routing or top-level INSERT columns). Document the partition rationale citing TD-002 (2026-05-19) + TD-003 F1 (2026-05-20) as the canonical-contract sources.
- **D6 — `.pseudo` asserts `onError: continueRegularOutput` but `.md` does not surface the setting (may live at wrapper level).** Severity: ⚠️ minor. **Verified 2026-05-24 via `jq '.nodes[] | select(.name == "Log to Messages Table") | .onError'` on `workflows/6H75p935FpBVBQtV.json`** — returns `"continueRegularOutput"` confirmed. The setting lives at the top-level node JSON, not in `parameters`. Pseudo and live agree; the `.md`-projection generator script (`generate-workflow-md.py`) does not surface top-level node-error-handling settings. **NOT pseudo↔live drift** — `.md`-generator completeness gap. Plugin improvement candidate (see followups + handoff). Pseudo gets a Notes annotation documenting the verification + the plugin gap; no pseudo body change required for D6.

**Cross-cutting audit:**
- **Caller-list verification (per handoff plugin candidate #12):** WF-60 has **4** distinct callers (verified via `grep -l "6H75p935FpBVBQtV" workflows/*.json`): WF-00 (WA inbound logger), WF-50 (WA outbound logger), WF-10 (Slack inbound logger), WF-51 (Slack outbound logger). Pseudo Step 1 narrative names all four correctly. ✓ Compliant. Multi-caller WF with verified narrative.
- **Discriminated-union template reuse (TD-DRIFT-029 precedent):** Direct application — `transport` discriminator + per-variant required fields (`phoneNumber`/`whatsappMessageId` for `wa`, `slackChannelId`/`slackMessageTs` for `slack`) + passthrough partition (metadata-JSONB fields). The third partition (metadata-passthrough) extends the TD-DRIFT-029 template slightly — WF-50's passthrough was logging-context fields forwarded to WF-60; WF-60's passthrough is metadata-JSONB fields folded into the final INSERT row's `metadata::jsonb`. Same partition concept (consumed vs forwarded), different downstream destination.
- **Convention-only `inputSource=passthrough` (TD-DRIFT-028 / WF-25 D2 / WF-46 D8 / WF-51 D2 precedent):** WF-60's `When Executed by Another Workflow` trigger uses `inputSource=passthrough` with no enforced schema. Same project-wide convention as the prior accepted-as-is precedents. Not separately called out in this row's Notes since the new structured Inputs block + `Extract Message Data` Step 2 normalization already document the contract; the trigger-level schema-hardening question is the same cross-cutting one accepted-as-is project-wide.
- **TD-DRIFT-019 linear numbering:** WF-60.pseudo uses `Step 4a`, `Step 7a`, `Step 7b` (branch sub-steps for lookup branch + skip-result branches). Per [[feedback_pseudo_linear_numbering]] the rule is specifically about tombstones (`(removed)`/`(deleted)`/`(reserved)`), not branch sub-steps. All three are real algorithmic steps on their respective branches — convention-conformant. No renumber needed. **Compliant.**
- **D6 plugin-improvement-candidate (handoff §27 + flush-plugin-improvements queue):** `generate-workflow-md.py` should surface top-level node-error-handling settings (`onError`, `retryOnFail`, `continueOnFail`) in the `.md` projection so the `.md` is hermetically complete vs the JSON. Today the script reads only `.parameters`, missing these node-level settings. New plugin candidate for the carry-forward list.

**Decision (2026-05-24):** Pseudo-only sync. No live changes. Three-element rewrite of WF-60.pseudo + Notes annotation for D6:
1. **D7 fix:** Update Outputs block + Step 5 description to use the verbatim live reason strings: `'pre_onboarding_user'` (inbound) and `'no userId — caller did not provide user identification'` (outbound).
2. **D8 fix:** Add `inboundMessageId` and `sentAt` to the new structured Inputs metadata-passthrough partition. The structured-partition format itself resolves the top-level-vs-metadata ambiguity (each field's partition declares its destination).
3. **D9 fix:** Replace the inline bullet-list Summary Inputs with a structured `## Inputs` H2 block organized in four partitions: (a) discriminator + common required (`transport`/`direction`/`messageType`/`content`); (b) variant `transport='wa'` required (`phoneNumber`/`whatsappMessageId`); (c) variant `transport='slack'` required (`slackChannelId`/`slackMessageTs`); (d) identity (resolved or supplied: `userId`/`consultationId`); (e) metadata-passthrough (folded into `metadata` JSONB). Add a partition-rationale paragraph citing TD-DRIFT-029 + TD-002/TD-003 F1 contracts.
4. **D6 Notes annotation:** Document the verification result (live JSON inspection confirms `onError: continueRegularOutput` at top-level node JSON) and flag the `.md`-generator completeness gap as a plugin improvement candidate. No pseudo body change.

**Fix (pseudo only):** Whole-file rewrite via Write (Summary + new Inputs block + Notes additions + Algorithm Step 2/5/6 edits + Outputs block reason-string updates). Done in this row's edit.

**Files:** `docs/pseudocode/WF-60.pseudo` (whole-file rewrite).
**Change type:** Documentation (pseudo rewrite).
**Depends on:** TD-DRIFT-029 (template precedent for discriminated-union Inputs).
**Coordinates with:** None on the live side. New plugin-improvement candidate added to the carry-forward list (D6 `.md`-generator gap).
**Impact:** Closes D7, D8, D9 for WF-60; D6 minor explicitly resolved as non-drift via Notes annotation. No live changes. No behaviour change. Establishes the discriminated-union template's reuse pattern (TD-DRIFT-029 → TD-DRIFT-032) for any future logging-leaf with transport/variant axes.
**Verify:** Re-run drift-check WF-60 → expect ✅ CLEAN on D7, D8, D9; D6 may persist as ⚠️ minor with the accepted-as-is Notes annotation (the .md-generator gap will remain until the plugin update lands).

### TD-DRIFT-011 · WF-25 .pseudo — consultation_closed fallback + payload-prep + geminiError + Inputs

**Root cause:**
- (D3a) Real conditional fallback in live missing from spec: both `Parse Intent` (when Gemini returns an unparseable / unknown category) and `Handle Gemini Error` (when Gemini HTTP call errors) default to `(userStatus === 'consultation_closed') ? 'feedback_intent' : 'general_enquiry'`. Pseudo Step 4 and Step 5 flatly say "default intentResult = 'general_enquiry'", losing the post-consult feedback nudge. Decision 2026-05-24: live is right (sensible business behaviour), document in pseudo.
- (D3b) `messageText` vs `messageContent` latent bug Note already captured under TD-DRIFT-009; once TD-DRIFT-009 lands, the latent-bug paragraph in WF-25.pseudo Notes (lines 9-10) becomes stale.
- (D5) `Prepare WF-51 Payload (Garbage Admin)` Code node (builds `channelId='C0A5B0ZE81E'` and the formatted alert text "🚨 *Garbage / abusive message detected* …") absent from pseudo Step 8 — spec says "call WF-51 to notify the admin Slack channel" without payload structure.
- (D7) `geminiError: boolean (optional, true only on the Gemini-HTTP-error fallback path)` added to output by `Handle Gemini Error` but not declared in the Outputs section.
- (D9) Inputs are in the Summary paragraph as a single inline sentence; no structured block.
- (D2 minor) Live `When Executed by Another Workflow` trigger has empty schema `{}` — contract enforced only by caller-side mapping, not at the trigger.

**Fix (`docs/pseudocode/WF-25.pseudo` only, no live edit):**
1. **Step 4 (Handle Gemini error):** rewrite the default to `intentResult = (userStatus === 'consultation_closed') ? 'feedback_intent' : 'general_enquiry'`. Set `geminiError=true`. Note: feedback-intent fallback specifically lands post-consult users in the feedback affordance rather than treating them as new enquirers.
2. **Step 5 (Parse Gemini response):** rewrite the unmatched-category default the same way: `intentResult = (userStatus === 'consultation_closed') ? 'feedback_intent' : 'general_enquiry'` (no `geminiError` flag on this path — Gemini responded, the response just wasn't a valid category).
3. **Step 8 (admin notify):** describe the `Prepare WF-51 Payload (Garbage Admin)` payload structure explicitly — `channelId='C0A5B0ZE81E'` (chinmay-admin-commands), `messageText='🚨 *Garbage / abusive message detected*\nPhone: <phone>\nUser ID: <userId>\nStatus: <userStatus>\nMessage: <messageContent truncated to 280 chars>\n\nUser was sent the garbage warning automatically.'`.
4. **Outputs section:** extend the `intentResult` line with `+ geminiError: boolean (optional; present and true only on the Gemini-HTTP-error fallback path — Step 4)`.
5. **Inputs:** replace the Summary inline sentence with a structured **Inputs** block:
   - `phoneNumber` — E.164 string, required.
   - `userId` — integer, required (FK to `chinmay_astro.users.id`).
   - `messageContent` — string, required. The free-form user text to classify. **(Note 2026-05-24: until TD-DRIFT-009 lands, some callers pass this as `messageText`; WF-25 reads `messageContent` regardless. Remove this note after TD-DRIFT-009.)**
   - `userStatus` — enum string, required (one of the user-state-machine values per CLAUDE.md). Used in fallback branch selection AND included in the Gemini prompt as classification context.
   - Add brief paragraph after the block: "Contract is convention-only — the `When Executed by Another Workflow` trigger uses an empty schema; callers are expected to pass the four fields by name. D2 acknowledged as accepted-as-is (no trigger-schema hardening in this sprint)."
6. **Notes housekeeping:** once TD-DRIFT-009 lands, remove the latent-bug Note about `messageText` vs `messageContent` (D3b).

**Files:** `docs/pseudocode/WF-25.pseudo` only.
**Change type:** Documentation.
**Depends on:** TD-DRIFT-009 to drop the parenthetical name-mismatch note (step 5 + step 6 above).
**Verify:** re-run drift-check WF-25 → expect D3, D5, D7, D9 gone. D2 remains as accepted-as-is.

### TD-DRIFT-014 · WF-31 .pseudo — structured Inputs + passthrough semantics + stale `messageText`

**Root cause:**
- (D4) `.pseudo` Step 3 says "Call WF-25 with phoneNumber, userId, messageText, userStatus" (explicit args); live uses `mappingMode=passthrough` with empty schema, forwarding the entire trigger payload to WF-25. Spec over-specifies what live does loosely.
- (D4 ripple) Pseudo Step 1 + Inputs list `messageText` as part of the trigger payload, but WF-01's canonical output contract (per TD-DRIFT-002) sends `messageContent`, not `messageText`. Live's `Prepare Admin Relay` Code node confirms this — it reads `triggerData.messageContent || ''`. The `messageText` mention in WF-31.pseudo is stale.
- (D8) `userId`/`userStatus`/`messageText` declared as required inputs but no early local node references them — they exist only because passthrough mode forwards them to WF-25. Same router-pattern as WF-23.
- (D9) Inputs are a single inline sentence in Summary; no structured block.

**Fix (`docs/pseudocode/WF-31.pseudo` only, no live edit):**
1. Remove `messageText` everywhere it appears in WF-31.pseudo (Summary line 5, Step 1, Step 3). Replace with `messageContent`.
2. Replace the inline Summary Inputs sentence with a structured **Inputs** block:
   - `phoneNumber` — E.164 string, required. Used by `Load User for Relay` (Branch B) and forwarded to WF-25 (Branch A).
   - `userId` — integer, required. Forwarded to WF-25; not consumed locally.
   - `messageContent` — string, required. The free-form user text. Consumed by `Prepare Admin Relay` (Branch B) to build the Slack relay quote; forwarded to WF-25 (Branch A).
   - `userStatus` — enum string, required. Forwarded to WF-25 for classification context; not consumed locally.
   - `user` — object, optional. `user.name` consumed by `Prepare Admin Relay` for the Slack relay header (falls back to `phoneNumber`).
3. Add a brief paragraph after the Inputs block: "WF-31 is a **router-style fan-out workflow** with two parallel branches. Branch A (intent classification) consumes nothing locally before WF-25 — `Call WF-25` uses `mappingMode=passthrough` so all trigger fields reach WF-25 unchanged. Branch B (admin relay) is the only branch with local field consumption (`phoneNumber`, `messageContent`, optional `user.name`). Inputs are declared per-branch to make the consumed-vs-passthrough partition explicit."
4. Step 3: change phrasing from "Call WF-25 with phoneNumber, userId, messageText, userStatus" to "Call WF-25 via passthrough — all trigger fields reach WF-25; WF-25 reads `messageContent` and `userStatus` from the forwarded payload."

**Files:** `docs/pseudocode/WF-31.pseudo` only.
**Change type:** Documentation.
**Depends on:** TD-DRIFT-002 (so the input contract aligns with WF-01's revised output).
**Verify:** re-run drift-check WF-31 → expect D4, D8, D9 cleared.

### TD-DRIFT-010 · WF-23 .pseudo — structured Inputs + branch-consumption note

**Root cause:**
- (D8) `userId` and `userStatus` listed in WF-23.pseudo Inputs but the stop-intent branch's `Build WF-50 Stop Clarifier Payload` Set node reads only `phoneNumber`. Not a true drift — both fields ARE consumed pre-branch by `Call WF-25 Intent Classifier` (mappingMode=defineBelow forwards `phoneNumber, userId, messageText, userStatus`). Resolution: explicitly document the consumption-vs-passthrough pattern per the router-workflow distinction in [[feedback_workflow_representation_levels]].
- (D9) Inputs section is a prose paragraph with no types/required/optional/validity.

**Fix (`docs/pseudocode/WF-23.pseudo` only, no live edit):**
1. Replace the prose Inputs line with a structured **Inputs** block:
   - `phoneNumber` — E.164 string, required. Used by both the stop-intent clarifier branch and the pre-WF-25 forwarding.
   - `userId` — integer, required (FK to `chinmay_astro.pending_users` lookup). Consumed only by the pre-branch `Call WF-25 Intent Classifier` mapping; not used on either post-branch path.
   - `messageContent` — string, required. The free-form user text. **(Note: spelled `messageText` in live as of 2026-05-24, awaiting TD-DRIFT-009 fix.)** Forwarded to WF-25 for intent classification.
   - `userStatus` — enum string, required (one of the user-state-machine values per CLAUDE.md). Consumed only by the pre-branch `Call WF-25 Intent Classifier` mapping.
2. Add a brief paragraph after the Inputs block clarifying: WF-23 is a **router-style workflow**; declared inputs are partitioned into *consumed-by-classifier* (`userId`, `userStatus`, `messageContent`) and *consumed-by-output-branch* (`phoneNumber`) categories. This separates "declared because forwarded" from "declared because read locally" — addresses the D8-style finding pattern across router workflows.
3. Once TD-DRIFT-009 lands, remove the parenthetical note about the `messageText` live name.

**Files:** `docs/pseudocode/WF-23.pseudo` only.
**Change type:** Documentation.
**Depends on:** none for the structural change; TD-DRIFT-009 to drop the parenthetical name-mismatch note.
**Verify:** re-run drift-check WF-23 → expect D8 and D9 gone; D4 will clear once TD-DRIFT-009 lands.

### TD-DRIFT-005 · WF-11 .pseudo revision — collapses D4+D8+D9

**Root cause:**
- (D4) Spec Steps 11/13/15 say LIST/STATS/HELP post to Slack "channel (channelName)"; live (`Send List/Stats/Help To Admin` nodes) pulls `channelId` from trigger and ignores the `channelName` field built by Format List/Stats. WF-51's contract is `{channelId, messageText}` — channel IDs are Slack's canonical/immutable identifier. **Live is right; spec is wrong.**
- (D8) Declared inputs `adminUserId` and `reason` never directly referenced by name in any WF-11 node; they're forwarded passthrough to sub-workflows (WF-33/34/42/46).
- (D9) Inputs section is a single informal line with no types/optional/validity.

**Fix (.pseudo only, no live edit):**
1. Steps 11/13/15: replace `channelName` with `channelId`; drop the unused `channelName` field-build mention.
2. Add structured **Inputs** block distinguishing:
   - **Consumed by WF-11:** `commandType`, `phoneNumber`, `channelId`, `messageText` — each with type + validity.
   - **Passthrough to sub-workflow:** `adminUserId`, `reason` — required from WF-10, forwarded unchanged.

**Files:** `docs/pseudocode/WF-11.pseudo` only.
**Change type:** Documentation.
**Verify:** re-run drift-check WF-11 → expect CLEAN.

### TD-DRIFT-003 · WF-02 .pseudo revision — collapses D8+D9, mirrors WF-01 outputs

**Root cause:** WF-02.pseudo Inputs section is prose with no structured block; `phoneNumber` is consumed by `Build UNHANDLED Alert` early node but never declared in the Inputs list. D6 (no error-path documentation) is deferred to the tech-error-handling sprint per `[[feedback_pseudo_tech_separation]]` — `Build UNHANDLED Alert` is functional/business behaviour (kept) but the absence of an n8n technical-error path is mechanism (deferred).

**Fix (.pseudo only, no live edit):**
1. Add a structured **Inputs** block mirroring WF-01.pseudo's output contract (after TD-DRIFT-002 lands) — same 10 fields with required/optional + types + validity. Explicitly name `phoneNumber`.
2. Document `Build UNHANDLED Alert` as the functional fallback branch (already present in live).
3. No mention of n8n tech-error handling — that's deferred.

**Files:** `docs/pseudocode/WF-02.pseudo` only.
**Change type:** Documentation.
**Depends on:** TD-DRIFT-002 (so the Inputs block mirrors WF-01's finalised output contract).
**Verify:** re-run drift-check WF-02 → expect CLEAN.

### TD-DRIFT-002 · WF-01 .pseudo revision — collapses D7+D8+D9

**Root cause:** WF-01.pseudo (a) declares `slackChannelId` and `stage` in the user-object output to WF-02, but live `Prepare User Data` doesn't forward them and downstream consumers (WF-31, WF-32, WF-33, WF-34, WF-40, WF-42, WF-46, WF-47) all re-fetch `slack_channel_id` from DB themselves — spec is wrong, live is right; (b) Inputs section is prose 'a, b, c, etc.' with no required/optional/types/validity and hides four fields actually consumed by early nodes (`messageContentUpper`, `messageId`, `timestamp`, `metadata`).

**Fix (.pseudo only, no live edit):**
1. Remove `slackChannelId` and `stage` from the user-object output contract — add a note explaining downstream re-fetches via `Load User by Phone` (audit evidence in drift-check tracker).
2. Add a structured **Inputs** block enumerating: `phoneNumber, phoneNumberFormatted, messageType, messageContent, rawMessage, contactName, messageContentUpper, messageId, timestamp, metadata` — each with required/optional flag, type, and validity rule (e.g., `phoneNumber: E.164 string, required`).
3. **Outputs to WF-21 (opted_out re-engagement branch):** explicitly declare that on the `opted_out → WF-21` branch, WF-01 forwards the standard fields PLUS `wasOptedOut: boolean, optional (true on this branch only; absent/false on all other call sites)`. Decision recorded 2026-05-24 during WF-21 revisit-for-ripple: cross-workflow declaration gap closed by adding `wasOptedOut` to WF-01's spec as an optional output, rather than silently consumed on the WF-21 side (option B — branch-specific extras — and option C — leave undeclared — both rejected).

**Files:** `docs/pseudocode/WF-01.pseudo` only.
**Change type:** Documentation.
**Impact:** Spec accuracy; no live behaviour change. Also closes WF-21 revisit ripple (no separate WF-21 sprint item needed).
**Verify:** re-run drift-check WF-01 → expect CLEAN. Re-run drift-check WF-21 → expect CLEAN (no change).

## 🟢 P3 — Low (cosmetic / phrasing)

### TD-DRIFT-004 · WF-10 .pseudo cosmetic sync — collapses D7+D1

**Root cause:** Two cosmetic naming drifts in WF-10.pseudo:
- Steps 27, 29: alert templates use `<commandType>` placeholder; live nodes (`Build Phone-Absent Alert`, `Build Wrong-State Alert`) reference `commandHint`. Same value, different field name.
- Step 19: Phone Match? described as "IF node"; live implements as Switch v3.3 with three named outputs (`valid`, `phone_absent`, `phone_mismatch`). Logic identical.

**Fix (.pseudo only, no live edit):**
1. Rename `<commandType>` → `commandHint` in Step 27 and Step 29 alert templates.
2. Update Step 19 description from "IF node" → "Switch node with three named outputs (valid, phone_absent, phone_mismatch)".

**Files:** `docs/pseudocode/WF-10.pseudo` only.
**Change type:** Documentation.
**Verify:** re-run drift-check WF-10 → expect ⚠️ MINOR or ✅ CLEAN (D6 will remain as deferred-to-tech-sprint marker only, no longer a drift finding in this scope).

## ⚪ Accepted-as-is

(populated as triage proceeds)
