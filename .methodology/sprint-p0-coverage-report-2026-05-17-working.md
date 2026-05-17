# Sprint Working Copy — P0 Live Workflow Sync (2026-05-17)

**Source:** `docs/superpowers/reports/P0_Coverage_Report_2026-05-17.md` (Implementation Follow-up table + Section B Theme 11A wasOptedOut)
**Status tracked in:** `.methodology/sprint-p0-coverage-report-2026-05-17-state.md`

**RULE — pseudocode immutable.** All changes below are to n8n workflow JSONs, bringing them into alignment with the existing `.pseudo` files. If a JSON change exposes a pseudocode bug, surface it as a follow-up item — **do NOT edit `docs/pseudocode/*.pseudo` mid-sprint**.

---

## Batch 1 — Foundations

### WF-60 (Message Logger)
Status: pending
> **Status:** ✅ Done
- Add TD-030 bot-echo filter for inbound
- Add TD-034 whitespace-only guard for inbound
- Add user lookup by `phone_number` when caller doesn't provide `userId`
- Pre-onboarding inbound returns `{logged:false, reason:'pre_onboarding_user'}` (acceptable MVP gap)

### WF-52 (Slack Channel Manager)
Status: pending
> **Status:** ✅ Done
- Add `isNew` flag to both return paths (new channel + existing channel via `name_taken`)
- Non-`name_taken` errors return structured `{success:false, error, channelId:null, isNew:false}` instead of falling off the end

### WF-50 (Send WhatsApp)
Status: pending
> **Status:** ✅ Done
- Extend null-body guard to also detect missing `interactivePayload` and missing `templateName` (not just empty text)
- Silent drops log to WF-60 with `success=false, error='empty_body_dropped'` AND return structured error to caller
- For `messageType='interactive'`, use `interactivePayload.body.text || JSON.stringify(payload)` for WF-60 `messageContent` log (instead of empty)
- Carry `consultationId` through to WF-60

---

## Batch 2 — Onboarding entry path

### WF-21 (New User Welcome + Form)
Status: pending
> **Status: ✅ Done — 2026-05-17** | Build Welcome Message now reads `wasOptedOut` from trigger input; prepends welcome-back line + blank when true. Single combined interactive message preserved (no second send).
- Accept `wasOptedOut` flag from caller (WF-01)
- If `wasOptedOut === true`, prepend "Welcome back" acknowledgement to the welcome+form message

### WF-01 (Message Router)
Status: pending
> **Status: ✅ Done — 2026-05-17** | Route Opted-Out to WF-21 node now passes wasOptedOut=true plus phoneNumber/phoneNumberFormatted/contactName/messageId/messageContent/messageText. Other WF-21 callers do NOT pass the flag. Schema prefix verified — all three Postgres lookups (Steps 6/10/11) already use `chinmay_astro.`.
- Pass `wasOptedOut: true` to WF-21 in Step 9 (opted_out re-engagement path) — call shape: `{phoneNumber, messageText, wasOptedOut: true}`
- Verify `chinmay_astro.` schema prefix on Steps 6/10/11 queries (Section B autonomous fix already applied to pseudocode)

### WF-22 (Form Response Handler)
Status: pending
> **Status: ✅ Done — 2026-05-17** | Verified only — no changes needed. All 5 required changes already implemented: button glyph ✓; INSERT ON CONFLICT … RETURNING (xmax=0) AS inserted ✓; User Created? IF on $json.inserted ✓; WF-52 Success? branches correctly (TRUE→Save→Prepare→WF-50; FALSE→Build Admin Alert→Call WF-51→END) ✓; no encryption-svc ✓. Validation: 0 errors. Drifts logged to followups (User Created? IF redundant; 3 __rl workflowIds; deprecated continueOnFail).
- Change button title from "Payment Completed" → "Payment Completed ✓" (glyph)
- `ON CONFLICT DO UPDATE` for opted_out re-engagement (Theme 11A) — INSERT path must handle the case where users row already exists
- Branch on WF-52 success using the new `isNew` flag from Batch 1
- If WF-52 returns `{success:false}` (non-`name_taken` error), admin-alert via WF-51 and abort (no payment instructions sent)
- Step 4: change "id not empty" check → rowCount-based check (Postgres `xmax=0` for inserted detection)

---

## Batch 3 — Entry + state routing

### WF-00 (Webhook Receiver)
Status: pending
> **Status: ✅ Done — 2026-05-17** | Added Call WF-60 Message Logger executeWorkflow (tv=1.3, onError='continueRegularOutput', plain-string workflowId) between Gather Message Info For Processing and Call WF-01. Inputs: {phoneNumber, messageType, messageContent, messageId, direction:'inbound'}. Parse code already has bot-echo + whitespace guards. Also normalized pre-existing __rl workflowId on Call WF-01 Message Router. Lint: pass.
- Add `WF-60` `executeWorkflow` node after `Parse WhatsApp Message` (Theme 4: single inbound logging entry point)
- `onError: "continueRegularOutput"` — logging failure must not block message processing
- Verify echo guard identifier: `message.from === value.metadata.display_phone_number.replace(/\D/g, '')`

### WF-02 (User State Router)
Status: pending
> **Status: ✅ Done — 2026-05-17** | 15 operations. Detect Route rewritten with explicit user!=null guards on all status branches; PAYMENT_CONFIRM now requires button_reply+user!=null+payment_pending (other button_reply types → UNHANDLED). Route Switch 8→9 rules. New: Build UNHANDLED Alert (Code, formats C0A5B0ZE81E warning) + Call WF-51 (UNHANDLED Alert) (tv=1.3, plain-string workflowId). Bonus: 9 pre-existing __rl workflowIds normalized. Lint: pass.
- Add `user.status='payment_pending'` guard before PAYMENT_CONFIRM routing (other `button_reply` types fall to UNHANDLED admin alert)
- Add UNHANDLED → WF-51 admin alert (Theme 9)
- Add `user IS NOT NULL` guards on all branches (lines 17-25 in pseudocode terms)

---

## Batch 4 — Admin command dispatch

### WF-10 (Slack Admin Handler)
Status: pending
> **Status: ✅ Done — 2026-05-17** | Step 5e jq+PUT (2 PUTs). DR-13 classification in Detect Command - Admin Channel (LIST/STATS/HELP=admin-wide; APPROVE/REJECT/CLOSE/BLOCK/UNBLOCK=user-targeted). Command-Admin switch 2→3 outputs (Admin Command / Wrong Channel / Not Command). New Build Wrong Channel Warning + Call WF-51 (Wrong Channel Warning) nodes. Bonus: 2 __rl workflowIds + 2 passthrough mappingModes cleaned. Bot-loop guard + body.event.* already correct.
- Implement DR-13 channel-scope rules:
  - User-targeted commands (APPROVE/REJECT/CLOSE/BLOCK/UNBLOCK) accepted ONLY in `consult-{phone}` channel
  - Admin-wide commands (LIST/STATS/HELP) accepted in any channel (including `chinmay-admin-commands`)
  - User-targeted command typed in `chinmay-admin-commands` → polite Slack reminder, no dispatch
- Standardise `event.*` → `body.event.*` for Slack payload paths
- Verify bot-loop guard documented: `body.authorizations[0].user_id != body.event.user`

### WF-11 (Command Parser)
Status: pending
> **Status: ✅ Done — 2026-05-17** | Step 5e jq+PUT, ONE pass (pre-scanned lint debt). Parse Command rewritten: longest-match aliasing (CLOSE CHAT CONSULT through bare CLOSE all → CLOSE_CONSULTATION; bare APPROVE/REJECT also accepted) + token-scan phone parser. 4 __rl workflowIds + 4 passthrough mappingModes cleaned simultaneously. All Postgres queries already have schema prefix.
- Add command aliases:
  - `APPROVE` ≡ `APPROVE PAYMENT`
  - `REJECT` ≡ `REJECT PAYMENT`
  - `CLOSE` ≡ `CLOSE CONSULT` ≡ `CLOSE CONSULTATION` ≡ `CLOSE CHAT CONSULT`
- Standardise dispatch payload to camelCase across boundary to WF-33/WF-34/WF-42/WF-46
- Verify schema prefix `chinmay_astro.` on Steps 10/16/18 queries

---

## Batch 5 — Slack-relay refactor

### WF-33 (Payment Approval Processor)
Status: pending
- Replace direct Slack post node with `executeWorkflow` → WF-51 (Theme 7)
- Verify Step 13 uses `<phone_number>` not `<wa_id>` (autonomous fix already in pseudocode)
- Verify schema prefix on all queries

### WF-34 (Payment Rejection Processor)
Status: pending
- Add `payment_submitted` state guard mirroring WF-33 (Step 4 — Section B autonomous fix already in pseudocode)
- Add user-not-found error path
- Replace direct Slack post node with `executeWorkflow` → WF-51 (Theme 7)
- Change retry button title → "Payment Completed ✓"

---

## Batch 6 — Consult + cleanup paths

### WF-40 (User → Admin Relay)
Status: pending
- Remove duplicate STOP intercept (WF-20 already intercepts before reaching WF-40)
- Pure pass-through relay to WF-51 only

### WF-42 (Consultation Closer)
Status: pending
- Add user-not-found error path: if load fails → Slack warning to admin's `channelName` (NOT `user.slack_channel_id`), no state change
- Verify state guard: `user.status = consultation_active` before update
- Verify NO archive of Slack channel (Design Rule #10 — channels preserved for REBOOK reuse)
- Two-button post-close message: "Leave Feedback", "Book Again" — NO 3rd "I'm done, thank you" button (Theme 3 dropped)

### WF-47 (Unsubscribe Handler)
Status: pending
- Remove channel archive call (Steps 7-8 in pseudocode terms)
- `status → opted_out` + `admin_actions` log (`action_type='opted_out'`, `notes='User sent STOP keyword'`) + opt-out message via WF-50
- Verify schema prefix `chinmay_astro.` on `users` + `admin_actions` queries

---

## Batch 7 — Verification, export, docs, commit

### VERIFY-ALL
Status: pending
- Per-WF pseudocode↔JSON re-comparison for all 15 touched workflows
- For each WF: fetch live JSON via `mcp__n8n__n8n_get_workflow`, compare nodes/parameters against `.pseudo` algorithm
- Any drift → return to that WF's batch and re-fix
- Output: PASS/DRIFT alignment report

### EXPORT-JSON
Status: pending
- Export live JSON for 15 touched WFs from n8n to `/workflows/<n8n-id>.json`
- Use bash+curl script (CLAUDE.md token discipline)
- Mandatory secrets scan: `grep -rn 'AIzaSy\|sk-\|xoxb-\|AKIA\|?key=' workflows/` must be empty
- Map WF-XX → n8n ID from `docs/workflow-registry.md`

### REGEN-MD
Status: pending
- Regenerate `docs/pseudocode/WF-XX.md` for the 15 touched WFs only
- Script reads `workflows/<id>.json` and emits markdown matching existing format:
  - Header: `# WF-XX <Name>`
  - Metadata: `- **ID:** \`<id>\`` / `- **Active:** true/false` / `- **Nodes:** <n>`
  - Per-node: `### <name>`, `- type: \`<type>\` (v<typeVersion>)`, `- parameters:`, fenced JSON
- Use jq for JSON extraction
- `.pseudo` files NOT touched

### GIT-PUSH
Status: pending
- Clone `github.com/prasadmujumdar19/chinmay-astro` to `/tmp/claude-scratch/`
- Copy: `workflows/*.json` (15 touched), `docs/pseudocode/*.md` (15 touched), `.methodology/sprint-p0-coverage-report-2026-05-17-*.md`, `.methodology/handoff-p0-live-workflow-sync-complete.md`
- Run secrets scan one more time before commit
- Concise commit message; push to `main`
- Clean up `/tmp/claude-scratch/`
- Per CLAUDE.md git workflow
