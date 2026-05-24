---
slug: drift-check-2026-05-24
started_at: 2026-05-24T00:00:00Z
last_updated: 2026-05-24T00:00:00Z
status: complete
overall_status: DRIFT
pairs_checked: 27
drift_count: 26
minor_count: 0
clean_count: 1
dispatch_mode: parallel-subagent-sonnet
---

# Pseudo vs MD Drift Check — 2026-05-24

| WF-ID  | Status     | Findings | Notes |
|--------|------------|----------|-------|
| WF-00  | 🟡 TRIAGED | 1        | nfm_reply parse path → TD-DRIFT-001 (real functional bug — fix live). NB: duplicate heading at tasks.md lines 66 + 111 (P0 + P1 sections) — known anomaly carried in handoff §25; dedupe before execution. |
| WF-01  | 🟡 TRIAGED | 3        | D7/D8/D9 → TD-DRIFT-002 (pseudo revision — collapses D7+D8+D9) |
| WF-02  | 🟡 TRIAGED | 3        | D8/D9 → TD-DRIFT-003 (pseudo revision — collapses D8+D9, mirrors WF-01 outputs); D6 minor → deferred-to-tech-sprint.md (WF-02 row: Build UNHANDLED Alert lacks separate tech-error path) |
| WF-10  | 🟡 TRIAGED | 3        | D7/D1 → TD-DRIFT-004 (pseudo cosmetic sync); D6 alwaysOutputData → deferred-to-tech-sprint.md (Load User Status zero-row lookup behaviour already correctly documented in WF-10.pseudo Step 26) |
| WF-11  | 🟡 TRIAGED | 3        | D4/D8/D9 → TD-DRIFT-005 (pseudo revision — collapses D4+D8+D9 including channelId↔channelName admin-channel-source resolution) |
| WF-20  | 🟡 TRIAGED | 2        | D8/D9 → TD-DRIFT-006 (pseudo revision). Note: WF-20 also appears as a legacy caller in TD-DRIFT-012 cross-cutting (`messageBody` → `messageContent` rename on WF-50 call). |
| WF-21  | ✅ CLEAN   | 0        | Only workflow with no findings |
| WF-22  | 🟡 TRIAGED | 4        | D3/D5/D8/D9 → TD-DRIFT-008 (pseudo + live mix — phantom-branch fix, $now/NOW canonicalization, structured Inputs) |
| WF-23  | 🟡 TRIAGED | 3        | D4/D8/D9 → TD-DRIFT-010 (pseudo structured Inputs + branch-consumption note); D4 messageText↔messageContent canonicalization handled cross-cutting via TD-DRIFT-009/012/013 family. |
| WF-25  | 🟡 TRIAGED | 6        | D3a/D3b/D5/D7/D9/D2 → TD-DRIFT-011 (consultation_closed fallback, payload-prep node, geminiError output, structured Inputs, trigger-passthrough convention) |
| WF-30  | 🟡 TRIAGED | 1        | D5 → cross-cutting TD-DRIFT-012 (`message`/`messageBody` → `messageContent` legacy-caller canonicalization sweep includes WF-30's `Send Payment Reminder via WF-50` defineBelow mapping). No per-WF row needed; coverage via the cross-cutting item. |
| WF-31  | 🟡 TRIAGED | 4        | D4/D8(×2)/D9 → TD-DRIFT-014 (pseudo structured Inputs + passthrough semantics + stale `messageText` cleanup); D4 messageContent canonicalization also via TD-DRIFT-012 cross-cutting. |
| WF-32  | 🟡 TRIAGED | 2        | D8 → TD-DRIFT-015 (Canon A cross-cutting); D9 → TD-DRIFT-016 |
| WF-33  | 🟡 TRIAGED | 4        | D5/D7/D9 → TD-DRIFT-018 (pseudo sync); D8 → TD-DRIFT-017 (live verified_by fix) |
| WF-34  | 🟡 TRIAGED | 3        | D8/D9 → TD-DRIFT-020 (pseudo input cleanup + structured block); D3 → TD-DRIFT-019 (cross-cutting linear renumber); rejected_by schema → deferred-to-tech-sprint |
| WF-40  | 🟡 TRIAGED | 3        | D3/D4/D9 → TD-DRIFT-021 (pseudo Step 4-6 rewrite to match live fan-out + structured Inputs) |
| WF-41  | 🟡 TRIAGED | 1        | D9 → TD-DRIFT-022 (structured Inputs block, pseudo only) |
| WF-42  | 🟡 TRIAGED | 6        | D4/D5/D7/D8/D9 + unflagged D1 (Slack copy) → TD-DRIFT-023 (pseudo rewrite — drop unused inputs, Step 9 destination + copy align to live, declare WF-51, structured Inputs); linear renumber via TD-DRIFT-019 |
| WF-43  | 🟡 TRIAGED | 3        | D8 → TD-DRIFT-009 (WF-25 caller rename); D5+D9 → TD-DRIFT-024 (pseudo Step 5/13 explicit field names + structured Inputs); **TD-DRIFT-012 expanded to add WF-43 `Extract Gemini Reply` Code node as 4th legacy caller** (passthrough-chain audit gap from 2026-05-24) |
| WF-44  | 🟡 TRIAGED | 6        | D8a → TD-DRIFT-009; D5 (Step 9) → TD-DRIFT-012 (WF-44 caller); D1+D4+D5(Step 7)+D8b+D9 → TD-DRIFT-025 (pseudo bundle); latent `userId=undefined` bug → TD-DRIFT-026 (live fix) |
| WF-45  | 🟡 TRIAGED | 5        | D1+D8+D9 → TD-DRIFT-027 (pseudo bundle — Step 4 copy align live→pseudo per Option A precedent, drop dead optionals, structured Inputs with passthrough-extras note); D7 → cross-ref `contract-first-sub-workflow-calls-design` sprint (Outputs placeholder added in TD-DRIFT-027); D5 → deferred-to-tech-sprint.md (pseudo and live agree on read source; latent zero-row UPDATE is robustness, not drift) |
| WF-46  | 🟡 TRIAGED | 3        | D4+D8+D9 → TD-DRIFT-028 (pseudo bundle — structured Inputs, D4 Notes annotation per TD-DRIFT-025 precedent, D8 accepted-as-is per TD-DRIFT-011 / WF-25 D2 precedent); D6 minor → deferred-to-tech-sprint.md |
| WF-47  | 🟡 TRIAGED | 1        | D5 → TD-DRIFT-007 (pseudo rewrite); also deferred-to-tech-sprint.md (alwaysOutputData on Update User Status to opted_out — not reachable in practice because WF-01's Anomaly Route intercepts pre-onboarding STOP via anomaly_keyword, never reaches WF-47) |
| WF-50  | 🟡 TRIAGED | 2        | D9 → TD-DRIFT-029 (discriminated-union structured Inputs: discriminator + per-variant required + logging-context passthrough partition; canonical-vs-legacy alias documentation pending TD-DRIFT-013); D6 minor → TD-DRIFT-029 Notes (Process Result null-array guard accepted-as-is, phrasing-only) |
| WF-51  | 🟡 TRIAGED | 2        | D3 deferred to tech-error-handling sprint (pseudo line 12 already documents as TD-NEW-028; pseudo↔live agree on the gap — not drift); D2 minor → TD-DRIFT-030 (Notes annotation accepting trigger-passthrough convention per WF-46 D8 / WF-25 D2 precedent) |
| WF-52  | 🟡 TRIAGED | 3        | D1/D3/D9 → TD-DRIFT-031 (pseudo whole-file rewrite — Step 4 invites both admin roles per user-decision 2026-05-24 [Business Admin Chinmay `U0B4BBML6CS` + Technical Admin Prasad `U0A4175DJ5D`]; Steps 5/9 describe runtime `context_team_id` derivation; new structured Inputs block with canonical+legacy-alias partition); memory side-effect: `[[project_admin_actions_deprecated]]` gets a clarifying paragraph distinguishing single-operator-admin from channel membership |
| WF-60  | 🟡 TRIAGED | 4        | D7/D8/D9 → TD-DRIFT-032 (pseudo whole-file rewrite — discriminated-union structured Inputs per TD-DRIFT-029 template: `transport` discriminator + per-variant required + identity + metadata-passthrough partitions; Outputs reason strings aligned to live verbatim `'pre_onboarding_user'` + `'no userId — caller did not provide user identification'`; D8 `inboundMessageId`/`sentAt` added to metadata-passthrough partition); D6 minor → Notes annotation (`onError: continueRegularOutput` verified via JSON inspection — pseudo↔live agree; .md-generator gap flagged as plugin improvement) |

## Roll-up

- **Pairs checked:** 27
- **Status counts:** ✅ 1 clean (WF-21) · 🟡 26 triaged (all other WFs) · 🔴 0 awaiting. **All 27 WFs have triage coverage** via per-WF TD-DRIFT-001 through TD-DRIFT-032 rows OR cross-cutting items (WF-30 via TD-DRIFT-012; tech-error gaps via `deferred-to-tech-sprint.md`).
- **Overall status:** 🟡 TRIAGE-COMPLETE — ready for sprint execution (`plan-sprint` + `build-sprint` against the tasks.md TD-DRIFT-001…-032 catalog)
- **Dispatch mode:** 27 parallel Sonnet subagents (background), strict-JSON output, parent-aggregated
- **Per-WF triage sequence (2026-05-24):** WF-32 → WF-33 → WF-34 → WF-40 → WF-41 → WF-42 → WF-43 → WF-44 → WF-45 → WF-46 → WF-50 → WF-51 → WF-52 → WF-60. **Complete.**

## Systemic patterns (across the corpus)

1. **D9 universal gap (25 of 26 drift cases).** Almost no `.pseudo` has a structured Inputs block with required/optional, types, and validity rules. Most have a prose summary or inline "Inputs: a, b, c, etc." Only WF-21 and (arguably) WF-47, WF-51 are close to compliant.
2. **D8 input contract validity (16 of 26 drift cases).** Declared inputs not referenced by early nodes (dead declarations), or early nodes consume fields not in the Inputs block (undocumented inputs). Frequently both in the same workflow.
3. **`messageText` vs `messageContent` field-naming inconsistency** appears across WF-23, WF-25, WF-31, WF-43, WF-44 — a project-wide canonical-name issue worth one cross-cutting fix.
4. **`channelId` vs `channelName` / channel-source ambiguity** in WF-11, WF-34, WF-42, WF-46 — admin commands' channel destination drift.
5. **`alwaysOutputData=true` missing** on Postgres nodes that need to handle zero-row results: WF-10 (Load User Status), WF-47 (Update User Status to opted_out).
6. **Two real functional bugs surfaced**, not just spec drift:
   - WF-00: `nfm_reply` (WhatsApp Flow form submissions) falls through to default branch — produces `[NFM_REPLY]` placeholder instead of cleartext form payload.
   - WF-33: payment row written with `status='verified'` while spec + downstream readers expect `'approved'`.
7. **Spec-only issues for sub-workflow call contracts** (D4 passthrough vs explicit mapping) in WF-11, WF-31, WF-46 — caller sub-workflow inputs aren't validated at the trigger boundary.

---

### WF-00 findings (entry workflow, D8/D9 N/A)

- **D3 (Decision fork)** — `.pseudo` Step 2 specifies that for `messageType='nfm_reply'` (WhatsApp Flow form submission), `messageContent` should be set to `nfm_reply.response_json` (cleartext payload). The Parse WhatsApp Message node in `.md` has no case for `nfm_reply` in its switch — falls into default branch which sets `messageContent='[NFM_REPLY]'`. **Severity: 🔴 drift.** Real bug: WF-60 logs useless placeholder; WF-01 receives no usable content for form-submission messages.

### WF-01 findings

- **D7 (Output contract)** — `.pseudo` Step 12 declares `slackChannelId` and `stage` as camelCase fields in the `user` output object; `Load User` SQL fetches them but `Prepare User Data` Code node never writes them into `userData` — WF-02 never receives them. **Severity: 🔴 drift.**
- **D8 (Inputs validity)** — Fields `messageContentUpper`, `messageId`, `timestamp`, `metadata` consumed by `User-Load Gate` and `Prepare User Data` but absent from `.pseudo` Inputs (hidden behind 'etc.'). **Severity: 🔴 drift.**
- **D9 (Inputs shape)** — Inputs section lists 6 fields followed by 'etc.', no required/optional, no types, no validity. **Severity: 🔴 drift.**

### WF-02 findings

- **D8** — `.pseudo` never declares `phoneNumber` as input; `Build UNHANDLED Alert` reads `$input.first().json.phoneNumber`. **Severity: 🔴 drift.**
- **D9** — Summary uses vague prose, no formal Inputs block. **Severity: 🔴 drift.**
- **D6 (Error paths)** — Neither artefact documents error paths; phrasing-only gap. **Severity: ⚠️ minor.**

### WF-10 findings (entry workflow, D8/D9 N/A)

- **D6 (Error paths)** — `.pseudo` Step 17 specifies `alwaysOutputData=true` on Load User Status; live node lacks it. Without it, zero-row result drops items and User Row Exists? IF never fires — orphan-channel alert silently lost. **Severity: 🔴 drift.**
- **D7** — Steps 27/29 alert templates use `<commandType>` in `.pseudo`; live nodes reference `commandHint`. Both carry same value but rename undocumented. **Severity: ⚠️ minor.**
- **D1** — Phone Match? described as IF in `.pseudo` Step 19; live uses Switch v3.3 with three named outputs. Same logic, different node type. **Severity: ⚠️ minor.**

### WF-11 findings

- **D4 (Sub-workflow calls)** — LIST/STATS/HELP send nodes (Send List/Stats/Help To Admin → WF-51) pass `channelId` from trigger to WF-51, not `channelName` as `.pseudo` Steps 11/13/15 specify. Format List/Stats embed `channelName` but send nodes pull `channelId` directly. **Severity: 🔴 drift.**
- **D8** — Declared inputs `adminUserId` and `reason` never referenced by name in any `.md` node — travel implicitly via passthrough. **Severity: 🔴 drift.**
- **D9** — Single informal Inputs line, no types/optional/validity. **Severity: 🔴 drift.**

### WF-20 findings

- **D8** — `userStatus` declared as carried input in `.pseudo` Step 1 but `Normalize Keyword` (the Set node right after trigger) does not assign `userStatus` in its output. `Call WF-47 Unsubscribe` uses `$json.userStatus` which after Match Keyword resolves against Normalize Keyword output → undefined. **Severity: 🔴 drift.** Real consequence: WF-47 receives `userStatus=undefined` on the STOP path.
- **D9** — Inline summary sentence only. **Severity: 🔴 drift.**

### WF-21 findings

- **(none)** — only fully clean workflow. Inputs block explicit, all fields consumed by early nodes, all decision forks match, DB upsert matches.

### WF-22 findings

- **D3** — `.pseudo` Step 4 describes new-user vs existing-user branch; `.md` has no IF node on `inserted` flag (single edge directly to WF-52). Functionally equivalent (WF-52 idempotent) but phantom branch in spec. **Severity: 🔴 drift.**
- **D5** — `.pseudo` Step 6 says `updated_at = NOW()`; live uses `$now` n8n expression. Functionally equivalent, representational gap. **Severity: 🔴 drift.**
- **D8** — `rawMessage` sub-structure dependency (`rawMessage.interactive.nfm_reply.response_json`) consumed but never declared as structural requirement. **Severity: 🔴 drift.**
- **D9** — No structured Inputs block. **Severity: 🔴 drift.**

### WF-23 findings

- **D4** — `Call WF-25 Intent Classifier` maps `messageText` directly, but WF-25 reads `messageContent` (latent bug flagged in `.pseudo` Notes but unresolved in live). **Severity: 🔴 drift.**
- **D8** — Stop-intent branch's `Build WF-50 Stop Clarifier Payload` reads only `phoneNumber` from trigger; `userId`/`userStatus` declared but not consumed on that branch. **Severity: 🔴 drift.**
- **D9** — Prose summary only. **Severity: 🔴 drift.**

### WF-25 findings

- **D3 (×2)** — Context-aware Gemini fallback (`userStatus='consultation_closed'` → `intentResult='feedback_intent'`, else `'general_enquiry'`) in both `Parse Intent` and `Handle Gemini Error` is entirely absent from `.pseudo`. **Severity: 🔴 drift.** Also `messageText` vs `messageContent` field-name mismatch noted as latent bug in `.pseudo` but not modelled as a branch. **Severity: 🔴 drift.**
- **D5** — Intermediate `Prepare WF-51 Payload (Garbage Admin)` node and its re-reference to trigger node absent from `.pseudo`. **Severity: 🔴 drift.**
- **D7** — `geminiError: true` field in error-path output not documented. **Severity: 🔴 drift.**
- **D9** — Inline Inputs in Summary paragraph. **Severity: 🔴 drift.**
- **D2** — `.md` trigger has empty schema while `.pseudo` implies typed contract. **Severity: ⚠️ minor.**

### WF-30 findings

- **D5** — `Send Payment Reminder via WF-50` does not pass `messageType` to WF-50 (Prepare Payment Reminder only outputs `phoneNumber + message`); `.pseudo` Step 5 says 'default text type'. Stop-clarifier path correctly passes `messageType='text'`. **Severity: 🔴 drift.**

### WF-31 findings

- **D9** — Inline summary, no structured block. **Severity: 🔴 drift.**
- **D8 (×2)** — `userId`/`userStatus`/`messageText` declared as required but no early node explicitly references them — passthrough only. **Severity: 🔴 drift.**
- **D4** — `.pseudo` Step 3 specifies WF-25 called with explicit args; live uses `mappingMode=passthrough` with empty schema — forwarding contract unverifiable. **Severity: 🔴 drift.**

### WF-32 findings

- **D8** — `.pseudo` declares `phoneNumber` as top-level input but live never references `$json.phoneNumber` — derives phone from `user.phone_number` internally. **Severity: 🔴 drift.** **Triaged 2026-05-24 → TD-DRIFT-015** (Canon A cross-cutting WF-01 children: phoneNumber wins). Audit found WF-32 is the outlier — 4 WFs (23/30/31/40) already on Canon A, 4 mixed (33/34/42/46). TD-DRIFT-015 realigns WF-32 + the 4 mixed.
- **D9** — One-line summary only. **Severity: 🔴 drift.** **Triaged 2026-05-24 → TD-DRIFT-016** (structured Inputs block for WF-32.pseudo, reflecting Canon A).

### WF-33 findings

- **D5** — `Update Payment Status` sets `status='verified'`; `.pseudo` Step 5 specifies `status='approved'`. **Severity: 🔴 drift.** Real semantic divergence; downstream readers checking either value will be inconsistent. **Triaged 2026-05-24 → TD-DRIFT-018** (pseudo Step 5 updated to `'verified'`; live already canonical per TD-005 2026-05-20).
- **D7** — Live WF-51 Slack message significantly shorter than `.pseudo` Step 11: missing DOB, TOB, Place, and CLOSE CHAT CONSULT reminder. **Severity: 🔴 drift.** **Triaged 2026-05-24 → TD-DRIFT-018** (decision: trim pseudo to match live; admin reads birth details from channel topic / DB).
- **D8** — Declared input `channelId` consumed under alias `adminUserId` with no formal mapping. **Severity: 🔴 drift.** **Triaged 2026-05-24 → TD-DRIFT-017.** Cross-ref audit revealed WF-11 passes both `adminUserId` AND `channelId` as distinct fields; live code reads `input.channelId` and writes channel ID to `payments.verified_by`, but developer comment and intent show admin user ID should be stored. Real bug masquerading as field-rename drift. Fix: live reads `input.adminUserId`; pseudo drops the rename.
- **D9** — Prose-only declaration. **Severity: 🔴 drift.** **Triaged 2026-05-24 → TD-DRIFT-018** (structured Inputs block declaring command/subCommand/phoneNumber/adminUserId/channelId/channelName with Canon A reference).
- **Canon A (TD-DRIFT-015) impact:** Cross-audit found WF-33's only `$json.phoneNumber` consumer is `Load User by Phone` WHERE clause (canon-compliant). Both `user.phone_number` reads originate from DB-SELECT results — out of scope per Canon A audit step 3. **WF-33 already Canon-A compliant in live.**

### WF-34 findings

- **D8** — `channelName` declared but never referenced in `.md`. `channelId` declared but live derives from DB (`user.slack_channel_id`), ignoring trigger value. **Severity: 🔴 drift.** **Triaged 2026-05-24 → TD-DRIFT-020** (drop channelId/channelName from declared Inputs; document WF-11 passthrough envelope convention).
- **D9** — No structured Inputs block. **Severity: 🔴 drift.** **Triaged 2026-05-24 → TD-DRIFT-020** (structured Inputs block declaring phoneNumber + reason with Canon A reference).
- **D3** — Pseudo step-numbering retains tombstones for removed Steps 3/4 (User Found?, Correct State?); minor sequencing mismatch with linear live flow. **Severity: ⚠️ (but counted) — recorded as drift per skill 3-finding rule.** **Triaged 2026-05-24 → TD-DRIFT-019** (cross-cutting linear-numbering convention: 6 pseudos including WF-34 renumbered, tombstones dropped). New convention: pseudos use linear Step 1..N; git owns history — per [[feedback_pseudo_linear_numbering]].
- **Canon A (TD-DRIFT-015) impact:** WF-34's `$json.phoneNumber` reads in `Load User by Phone` WHERE + `Reset User Status` WHERE are top-level (canon-compliant); the one `user.phone_number` read is from `Load User by Phone` SELECT (out of scope per audit step 3). **WF-34 already Canon-A compliant in live.**
- **New observation (schema, out of pseudo-drift scope):** `payments` table has `verified_by` column but no `rejected_by`. WF-34 doesn't write a who-rejected value because the column doesn't exist. Deferred to tech sprint with full context — see `deferred-to-tech-sprint.md`.

### WF-40 findings

- **D3/D4** — `.pseudo` Step 4 describes a conditional fork where the Slack relay (Step 6) fires only after intent resolution; live wires `Format Slack Message` directly off `Call WF-25` output (unconditional, parallel with `Stop Intent?` branch). For `stop_intent`, the relay fires regardless of branch evaluation. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-021 (pseudo rewrite to match live two-output fan-out — Option A; functional behaviour identical, live is the simpler expression).
- **D9** — Vague prose only. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-021 (structured Inputs block added in same item).

### WF-41 findings

- **D9** — Inline summary line ('Inputs: { phoneNumber, adminMessage } from WF-10'), no types/required/validity. Otherwise clean. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-022 (structured Inputs block; Canon A + TD-DRIFT-019 + TD-DRIFT-012 all trivially compliant — single-WF pseudo-only fix).

### WF-42 findings

- **D4** — WF-51 called via `Notify Admin in Slack` node but `.pseudo` 'Calls Sub-Workflows' lists only WF-50 — undeclared sub-workflow call. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-023.
- **D5** — `.pseudo` Step 9 specifies posting to `channelId` from input (admin's command channel); live posts to `user.slack_channel_id` (consult channel). Side-effect destination differs. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-023 (functionally moot per DR-13 — pseudo aligns to live's DB-SELECT destination; matches WF-33/34/46 family).
- **D7** — Output contract Slack destination ambiguous and mismatched. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-023.
- **D8** — `channelId`/`channelName` declared but neither consumed from `$json` — `channelId` replaced by DB value. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-023 (drop from Inputs; document passthrough envelope, same as WF-34).
- **D9** — Inline summary. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-023 (structured Inputs block).
- **D1 (added by triage 2026-05-24T06:12:15Z — drift-check missed):** Slack confirmation message text diverges — pseudo Step 9 uses structured bold-label format; live uses single-sentence form with DR-10 hint ("channel kept open for future rebook"). → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-023 (pseudo aligns to live single-sentence form — better admin message; live is canonical for this finding). **Plugin improvement candidate:** drift-check D1 rubric to be re-examined for multi-line embedded literal comparison.

### WF-43 findings

- **D8** — Declared `messageText` consumed as `messageContent` by `Prepare Gemini Response Prompt` (`$input.first().json.messageContent`). Field-name alias unresolved. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-009 (cross-cutting WF-25 caller rename — WF-43 listed).
- **D5** — WF-50 call sites internally inconsistent: `Prompt for Feedback` uses field key `messageContent`; `.pseudo` Step 13 documents `message`. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-024 (pseudo Step 5/13 align to canonical `messageContent` post-TD-DRIFT-012). **Systemic finding surfaced:** `Extract Gemini Reply` Code node emits legacy `{phoneNumber, message: reply}` — added to TD-DRIFT-012 as 4th caller (passthrough-chain gap in original audit).
- **D9** — Flat comma-separated Inputs sentence. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-024 (structured Inputs block).

### WF-44 findings

- **D8 (×2)** — `Save Feedback to DB` uses `$('When Executed by Another Workflow').first().json.messageContent` (not `messageText`) and `.user.id` (not flat `userId`). Declared input names do not match consumed expressions. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → D8a covered by TD-DRIFT-009 (WF-25 caller rename); D8b → TD-DRIFT-025 (pseudo `user` envelope declaration per WF-32/33/42 template).
- **D5** — DB write uses `messageContent` not `messageText` as declared in Step 7. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-025 (pseudo Step 7 rewrite).
- **D4** — WF-45 call reads from trigger (`$('When Executed by Another Workflow').item.json.…`) while WF-47 call reads from `$json.…` (prior node output) — asymmetric, undocumented. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-025 (pseudo Notes-line convention annotation; cosmetic — both reads yield identical values).
- **D1** — `Prepare Ack Message` pulls `phoneNumber` from trigger directly, not from `$json` flowing out of DB write — silent data-flow divergence from Step 8 implication. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-025 (same Notes-line annotation).
- **D9** — Vague inline list. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24T06:12:15Z** → TD-DRIFT-025 (structured Inputs block).
- **Systemic finding (surfaced during triage 2026-05-24T06:12:15Z):** `Call WF-25 Intent Classifier` defineBelow mapping `userId: $json.userId` reads a field that does not exist in the WF-01 envelope (carries nested `user.id` only). Live silently passes `userId=undefined` to WF-25. → TD-DRIFT-026 (live fix — single value-expression edit; requires WF-25 input.userId-usage investigation before edit).

### WF-45 findings

- **D1** — Live `Prepare WF-50 Payload` message body materially different: 'Welcome back ${name}! Your previous consultation is complete. To rebook…' vs `.pseudo` Step 4 'Welcome back, <user.name>! 🙏\n\nYour birth details are already on file…'. Different greeting tone, different copy. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-027 (Option A — align pseudo to live verbatim; user-confirmed via needs-decision moment; follows TD-DRIFT-021/023 precedent, zero live churn).
- **D5** — `Set status=payment_pending` UPDATE uses `$('When Executed by Another Workflow').item.json.phoneNumber` directly, bypassing the SELECT result from Step 2. Latent inconsistency risk. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → deferred-to-tech-sprint.md (NOT pseudo-vs-live drift — pseudo Step 3 also reads trigger-envelope `<phoneNumber>`; latent zero-row-UPDATE risk is robustness, deferred per [[feedback_pseudo_tech_separation]]).
- **D8** — Declared optional inputs `name` and `userId` not consumed anywhere; `userId` absent entirely from `.md`. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-027 (drop `name`/`userId` from Summary; structured Inputs block declares only `phoneNumber`; passthrough extras from WF-20/WF-43/WF-44 documented as ignored).
- **D7** — No explicit output contract defined for sub-workflow return shape. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-027 adds placeholder `void` Outputs line; final convention deferred to active `contract-first-sub-workflow-calls-design` sprint.
- **D9** — Vague Inputs sentence. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-027 (closed alongside D8 via structured Inputs block).

### WF-46 findings

- **D9** — Live trigger uses `inputSource=passthrough` with empty schema — no equivalent declaration of the `.pseudo`'s typed Inputs contract (phoneNumber required, reason required, channelId optional). **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-028 (structured Inputs block).
- **D8** — `channelId` and `reason` not validated at trigger boundary (passthrough, no schema). **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-028 Notes-line annotation (accepted-as-is per TD-DRIFT-011 / WF-25 D2 precedent — project-wide convention-only contract pattern; cross-cutting schema-hardening would be its own dedicated sprint).
- **D4** — `Call WF-51 Notify Admin` uses `mappingMode=passthrough` with `convertFieldsToString=true`; `.pseudo` implies explicit payload hand-off. Minor representational gap on coercion semantics. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-028 Notes-line annotation (cosmetic only — upstream Code node emits canonical WF-51 contract; per TD-DRIFT-025 read-source convention precedent).
- **D6** — Shared zero-row error-path gap (not pseudo-vs-md divergence). **Severity: ⚠️ minor.** → **🟡 TRIAGED 2026-05-24** → deferred-to-tech-sprint.md.

### WF-47 findings

- **D5** — `Update User Status to opted_out` Postgres node lacks `alwaysOutputData=true` (only `queryBatching=independently` is set). `.pseudo` Step 2 explicitly requires it for the pre-onboarding STOP edge case — without it, zero-row UPDATE emits no items and downstream nodes reading from the trigger fail. **Severity: 🔴 drift.** Real reliability bug for pre-onboarding STOP.

### WF-50 findings

- **D9** — `.pseudo` Summary's logging-context fields (`userId`, `inboundMessageId`, `userMessage`) listed as trailing 'Also:' aside with no required/optional designation. Other inputs reasonably explicit. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-029 (discriminated-union Inputs block: discriminator + per-variant required fields + logging-context passthrough partition + canonical-vs-legacy alias documentation; first WF in sweep to establish the discriminated-union template — informs WF-60 triage).
- **D6** — Process Result adds null-array guard not described in pseudo (strictly safer; phrasing-only). **Severity: ⚠️ minor.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-029 Notes (accepted-as-is; pseudo Step 10's "if response.messages[0] present" reasonably captures the live's null-check semantic).

### WF-51 findings

- **D3** — `.md` topology has no error-branch node for Slack API failure; `.pseudo` acknowledges this gap (TD-NEW-028) but live node set has no placeholder error path. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → **deferred** to tech-error-handling sprint via TD-DRIFT-030 (`deferred-to-tech-sprint.md` WF-51 D3 row). Pseudo line 12 already documents the gap; pseudo↔live agree — not pseudo-vs-live drift, a shared feature gap. Same class as WF-02/WF-10/WF-47/WF-45/WF-46 prior tech-defer entries.
- **D2** — Trigger uses passthrough; `.pseudo` implies structured destructuring at entry. **Severity: ⚠️ minor.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-030 (Notes annotation accepting trigger-passthrough convention per TD-DRIFT-028 / TD-DRIFT-011 D2 precedent).

### WF-52 findings

- **D1** — Live `Invite Admin to Channel` invites two user IDs (`U0B4BBML6CS` and `U0A4175DJ5D`); `.pseudo` Step 4 documents only one (`U0AGTECS1KR`). Neither live ID matches the spec. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-031. **User decision: live wins** — `U0B4BBML6CS` is Chinmay (Business Admin), `U0A4175DJ5D` is Prasad (Technical Admin, workspace owner). `U0AGTECS1KR` is a stale ID that does not exist in the workspace (confirmed via `mcp__slack__slack_get_users`). Pseudo Step 4 rewritten to invite both with role-based comments.
- **D3** — `.pseudo` Step 5 uses `$env.SLACK_TEAM_ID` for channelUrl; live derives `teamId` from `channelData.context_team_id` at runtime. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-031. Pseudo Steps 5 and 9 rewritten to describe runtime derivation from the Slack API response field; new Notes-line documents the rationale. Both URLs are identical (workspace `team_id` is invariant); live wins on robustness (no env-var dependency).
- **D9** — Vague Inputs line, no types/validity. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-031. Replaced with structured `## Inputs` H2 block (canonical fields + legacy-alias partition); also documents the latent `userId` ↔ `id` caller-contract gap (WF-22 returns `id`, WF-52 reads `userId` — undefined today, behaviour-neutral but flagged for future TD-DRIFT-013-class hardening).

### WF-60 findings

- **D9** — Discriminated-union variants (WhatsApp-log: `transport='wa'` requires `phoneNumber`/`whatsappMessageId`; Slack-log: `transport='slack'` requires `slackChannelId`/`slackMessageTs`) not declared as distinct variants. All fields presented in one undifferentiated list. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-032 (discriminated-union structured Inputs per TD-DRIFT-029 (WF-50) template; `transport` discriminator + per-variant required + identity + metadata-passthrough partitions; partition-rationale paragraph citing TD-002 / TD-003 F1 canonical-contract sources).
- **D8** — `inboundMessageId` and `sentAt` consumed by `Extract Message Data` but entirely absent from `.pseudo` Inputs. Top-level vs nested status of `rawMessage`/`timestamp`/`contactName`/`success`/`error` ambiguous. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-032 (added both to the metadata-passthrough partition; structured-partition format itself resolves the top-level-vs-metadata ambiguity).
- **D7** — `Skip Log (no userId)` node emits `reason='pre_onboarding_user'` for inbound pre-onboarding; `.pseudo` documents `'no userId — …'`. String contract diverges. **Severity: 🔴 drift.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-032. Live wins (clearer audit-trail string). Outputs block + Step 5 updated to verbatim live strings: `'pre_onboarding_user'` (inbound) and `'no userId — caller did not provide user identification'` (outbound).
- **D6** — `.pseudo` asserts `onError: continueRegularOutput` but `.md` does not surface the setting (may live at wrapper level). **Severity: ⚠️ minor.** → **🟡 TRIAGED 2026-05-24** → TD-DRIFT-032 Notes annotation. **NOT pseudo↔live drift** — verified via `jq '.nodes[] | select(.name == "Log to Messages Table") | .onError'` on workflows JSON: returns `"continueRegularOutput"`. Setting lives at top-level node JSON, not in `.parameters`. `.md`-generator (`generate-workflow-md.py`) does not surface top-level node-error-handling settings — plugin improvement candidate added to handoff carry-forward list.
