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

Production behaviour is correct (WF-50's fallback chain rescues each variant), but the spec/live drift means any tightening of WF-50 silently breaks three workflows. Audit complete 2026-05-24: only these 3 defineBelow callers use legacy names; the other 12 WF-50 callers use `passthrough` and their upstream nodes (Set/Code) already produce canonical fields.

**Decision (2026-05-24):** Canonical contract for WF-50 callers is `{phoneNumber, messageType, messageContent}` (or `interactivePayload`/`templateName`/`templateParams` for non-text types). Rename the three legacy callers; WF-50 tightening tracked separately as TD-DRIFT-013.

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

**Fix (live edits, three callers):**
For each of WF-20 / WF-30 / WF-44:
1. Update the upstream Code/Set node's output object to use `messageContent` (renamed from `message` or `messageBody`) and add an explicit `messageType: 'text'`.
2. Update the `Call/Send … via WF-50` Execute-Workflow node's `workflowInputs.value` block:
   - Replace `message`/`messageBody` key with `messageContent`.
   - Add explicit `messageType` key (value `'text'` for the three known cases).
3. No edit to WF-50.

**Files:**
- WF-20 (`LgIDj1v4ZbCPlX25`): upstream Code/Set node + `Send HELP/STOP Reply via WF-50` Execute-Workflow node.
- WF-30 (`gGJBY5fJha0Let8I`): `Prepare Payment Reminder` Code node + `Send Payment Reminder via WF-50` Execute-Workflow node.
- WF-44 (`Du2CJ3OTohRFZYoA`): payload-prep Code node + WF-50 caller Execute-Workflow node.

**Change type:** Surgical (paired upstream-node + caller-mapping edit) × 3 callers.
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
