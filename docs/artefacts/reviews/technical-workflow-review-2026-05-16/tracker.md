# Technical Workflow Review — Master Tracker

**Status:** 🟢 Complete  
**Date:** 2026-05-16  
**Owner:** Claude (self-driven)  
**Project:** Chinmay Astro WhatsApp Vedic astrology consultation service  
**n8n Version:** 2.1.4 (19 releases behind latest 2.20.9)  
**Workflows scanned:** 28 total (23 active pre-go-live + 5 archived/backup)  
**HTML Report:** `docs/superpowers/TechnicalWorkflowReview_2026-05-16.html`

---

## Scope

This review checks **technical correctness** of all n8n workflows — distinct from the Functional Code Review which checks business logic. Covers:

1. Disabled / inactive nodes
2. Orphaned nodes (no connections)
3. Node typeVersion compatibility with n8n 2.1.4
4. Expression format correctness (`=` prefix on mixed text+expression fields)
5. Structural schema errors (mappingMode, workflowId type, Slack operation values)
6. Webhook response configuration
7. Connection integrity (all node wires valid)
8. UI rendering issues (cachedResultName, stuck dropdowns)
9. Postgres schema vs. workflow SQL alignment
10. Database health (constraints, indexes, data integrity)

**Tools used:** `mcp__n8n__n8n_validate_workflow` (strict profile), `mcp__n8n__n8n_audit_instance`, `mcp__postgres__query`, local JSON analysis via jq/python3.

---

## Summary Dashboard

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 Confirmed runtime-breaking | 6 | executeWorkflow v2, workflowId type, stage column, admin_actions columns |
| 🟠 High — SQL expression bugs | 5 | Missing `=` prefix on Postgres query fields |
| 🟠 High — Gemini expression bug | 1 | Unmatched brackets in WF-43 |
| 🟡 Medium — needs UI verification | 14 | Slack operation values, mappingMode |
| 🟡 Medium — webhook config | 2 | onError missing on WF-00, WF-10 webhooks |
| ⚪ Low — cosmetic | 40+ | cachedResultName missing, outdated typeVersions |
| ✅ Clean | 10 workflows | No errors at all |

**Critical path broken by confirmed bugs:** STOP handling (WF-47), HELP/REBOOK keywords (WF-20), Admin→WhatsApp relay (WF-12), Rebook flow (WF-45), Feedback save (WF-44), UNBLOCK command (WF-11).

---

## Check 1: Disabled / Inactive Nodes

**Result: ✅ PASS**

Zero disabled nodes found across all 28 workflow exports. All nodes are enabled.

---

## Check 2: Orphaned Nodes

**Result: ✅ PASS (harmless)**

3 sticky notes found with no connections — WF-50, WF-00, WF-02. Sticky notes are documentation-only and never execute.

---

## Check 3: Node TypeVersion vs. n8n 2.1.4

### 🔴 CRITICAL — executeWorkflow v2 exceeds maximum supported version

n8n 2.1.4 supports `executeWorkflow` up to **v1.3**. Three workflows contain nodes at v2 — these nodes will throw an error at runtime and halt execution of the branch they sit on.

| Workflow | Node | typeVersion | Impact |
|----------|------|-------------|--------|
| WF-20 Keyword Handler | `Send HELP Response` | v2 | HELP keyword → no WhatsApp message sent |
| WF-20 Keyword Handler | `Route to Rebook` | v2 | REBOOK keyword via keyword handler → fails |
| WF-45 Rebook Handler | `Send Payment Instructions` | v2 | Entire rebook flow fails — user gets no payment instructions |
| WF-12 Admin→WhatsApp Relay | `Call WF-50 Send WhatsApp` | v2 | All admin relay messages silently fail |

**Fix:** Open each node in n8n UI, change typeVersion to 1.3, save. Or via `n8n_update_partial_workflow` with `patchNodeField` setting typeVersion to 1.

### Minor outdated versions (non-breaking)

Widespread minor version drift exists across most workflows — e.g. Postgres@v2.5 (latest v2.6), IF@v2 (latest v2.3), Switch@v3.2 (latest v3.4). n8n 2.1.4 runs these without error; the validator flags them as warnings only. **No action required before go-live.**

---

## Check 4: Expression Format Errors (Missing `=` Prefix)

In n8n, a field containing both literal text and `{{ expression }}` must be prefixed with `=` for the entire field to be evaluated as an expression. Without it, `{{ $json.field }}` is sent as a literal string to Postgres — causing either no match or a SQL syntax error.

**Note:** The project CLAUDE.md notes "`=` prefix breaks base64 encoding" — this applies specifically to WhatsApp Flows node fields, not to Postgres `query` fields. These are different contexts.

| Severity | Workflow | Node | Field | Impact |
|----------|----------|------|-------|--------|
| 🔴 | WF-45 Rebook Handler | `Load User Record` | `query` | `WHERE phone_number = '{{ ... }}'` sent literally → 0 rows returned → rebook fails |
| 🔴 | WF-45 Rebook Handler | `Set status=payment_pending` | `query` | UPDATE uses literal string → affects no rows → status not updated |
| 🟠 | WF-11 Command Parser | `Lookup Blocked User` | `query` | UNBLOCK lookup returns no rows → unblock fails silently |
| 🟠 | WF-11 Command Parser | `Unblock User` | `query` | UPDATE + INSERT with literal phone → no-op |
| 🟠 | WF-40 User→Admin Relay | `Load User Record` | `query` | User lookup fails → relay has no user context |
| 🟠 | WF-46 User Blocker | `Get User Slack Channel` | `query` | Channel ID not retrieved → archive step fails |
| 🟠 | WF-47 Unsubscribe Handler | `Get User Slack Channel` | `query` | Channel ID not retrieved → archive step fails |

**Fix for all:** Add `=` prefix to each affected Postgres node's `query` field value.

---

## Check 5: Structural / Schema Errors

### 🔴 CRITICAL — WF-47: workflowId must be a string, got object

The two `executeWorkflow` nodes in WF-47 (`Send Hold Message via WF-50`, `Send Opt-out Confirmation via WF-50`) have a malformed `workflowId` — the resource locator object was stored instead of being resolved to a string ID. These nodes will throw at runtime.

**Impact:** STOP keyword handling (WF-47) is broken for both paths:
- `consultation_active` users → hold message not sent
- All other states → opt-out confirmation not sent

**Fix:** Open both nodes in n8n UI, re-select WF-50 in the workflow dropdown, save.

### 🟠 HIGH — WF-43: Unmatched expression brackets in Gemini node

The `Gemini General Response` HTTP Request node has a `jsonBody` expression with mismatched `{{ }}` brackets. The Gemini general-response path (for `consultation_closed` users asking general questions) will throw a parse error.

**Fix:** Open WF-43 → `Gemini General Response` node → fix the `jsonBody` expression (find and close the unmatched bracket).

### 🟡 MEDIUM — Invalid mappingMode: passthrough

`executeWorkflow` nodes in WF-10, WF-11, WF-33 use `mappingMode: "passthrough"`, which the strict validator rejects. This may have been valid in earlier n8n builds. Since these workflows were tested in sessions 3–5, the most likely outcome is these work at runtime — **but verify in smoke test.** If admin commands (APPROVE, REJECT, CLOSE, BLOCK) fail to pass data to sub-workflows, this is the cause.

| Workflow | Nodes affected |
|----------|---------------|
| WF-10 Slack Admin Handler | `Call WF-11 Command Parser`, `Call WF-41 Admin→User Relay` |
| WF-11 Command Parser | `Call WF-33`, `Call WF-34`, `Call WF-42`, `Call WF-46` |
| WF-33 Payment Approval | `Call WF-50 Notify User` |

### 🟡 MEDIUM — Invalid Slack operation value (7 workflows)

Multiple Slack nodes have an `operation` value rejected by the strict validator schema. Since these were built and tested, this is likely a schema version mismatch (validator uses newer Slack node schema than n8n 2.1.4 supports). **Verify in UI — if the node shows a valid operation and the message/channel fields are populated, it will work.**

| Workflow | Affected nodes |
|----------|---------------|
| WF-11 Command Parser | `Confirm Consultation Closure`, `Confirm User Blocked`, `Send List To Admin`, `Send Stats To Admin` ×2, `Unknown Command Response`, `Confirm User Unblocked`, `No Blocked User Found` |
| WF-33 Payment Approval | `Notify Admin in Channel` |
| WF-34 Payment Rejection | `Send a message` |
| WF-41 Admin→User Relay | `Post to Slack Channel` |
| WF-42 Consultation Closer | `Notify Admin in Slack` |
| WF-46 User Blocker | `Send a message` |
| WF-51 Send Slack Message | `Post to Slack` |

**Action:** Open each in n8n UI. If the operation dropdown shows a valid selection and channel/text are populated → no action. If it shows blank/invalid → re-select `post` and save.

---

## Check 6: Webhook Response Configuration

| Severity | Workflow | Node | Issue |
|----------|----------|------|-------|
| 🟡 | WF-00 Webhook Receiver | `WhatsApp Webhook` | `responseNode` mode requires `onError: "continueRegularOutput"`. If upstream processing errors, no 200 is returned to Meta → Meta retries the webhook → duplicate message processing. |
| 🟡 | WF-10 Slack Admin Handler | `Webhook` | Same — Slack retries if no 200 response. |

**Fix:** Add `onError: "continueRegularOutput"` to both webhook nodes.

---

## Check 7: Connection Integrity

**Result: ✅ PASS**

Zero invalid connections found across all 28 workflows. All node-to-node wiring is structurally sound.

---

## Check 8: UI Rendering (cachedResultName)

`cachedResultName` is missing on `workflowId` fields in ~40+ `executeWorkflow` nodes across most workflows. In the n8n UI, affected dropdowns show `"Choose..."` instead of the workflow name — making the canvas harder to read and edit.

**Runtime impact: None.** Workflows execute correctly. Fix is cosmetic; defer to post-MVP.

---

## Check 9: Postgres Schema vs. Workflow SQL

### 🔴 CRITICAL — `stage` column does not exist in `users` table

The `users` table has no `stage` column. Two workflows reference it in UPDATE queries:

| Workflow | Node | SQL | Impact |
|----------|------|-----|--------|
| WF-44 Feedback Recorder | `Save Feedback to DB` | `SET feedback = $1, stage = NULL, ...` | SQL error → feedback not saved |
| WF-45 Rebook Handler | `Set status=payment_pending` | `SET status = 'payment_pending', stage = NULL, ...` | SQL error → status not updated → rebook broken |

**Fix options:**
- **Add the column:** `ALTER TABLE chinmay_astro.users ADD COLUMN stage VARCHAR(50);` (aligns with registry's "two-dimensional state" design)
- **Remove from SQL:** Strip `stage = NULL` from both UPDATE queries if stage tracking is not implemented

### 🔴 CRITICAL — `admin_actions` column name mismatch

The `admin_actions` table has column `action_type`, not `action`. Workflows INSERT using `action`:

| Workflow | Node | Wrong column | Also wrong |
|----------|------|-------------|-----------|
| WF-47 Unsubscribe Handler | opt-out INSERT | `action` → should be `action_type` | — |
| WF-11 Command Parser | UNBLOCK INSERT | `action` → should be `action_type` | `reason` → should be `notes` |

**Impact:** Every STOP opt-out event and every UNBLOCK command will fail to log — INSERT errors will propagate and may halt the workflow branch.

**Fix:** Update the INSERT queries to use `action_type` and `notes` (matching the actual schema), or rename the column in the schema.

### ✅ Status CHECK constraint includes `opted_out`

`users.status` has a CHECK constraint permitting: `new`, `payment_pending`, `payment_submitted`, `consultation_active`, `consultation_closed`, `blocked`, `opted_out`. The `opted_out` value added in session 5 is correctly enforced. ✅

### ✅ All required indexes present

All performance-critical indexes exist: `idx_users_phone`, `idx_users_status`, `idx_users_blocked`, `idx_messages_user_id`, `idx_messages_whatsapp_message_id` (for deduplication in WF-00). ✅

---

## Check 10: Database Data Health

| Table | Rows | Finding |
|-------|------|---------|
| `users` | 1 | One test user (`consultation_closed`) from prior session testing. Clean state. |
| `pending_users` | 2 | Two stale records — users who received the WhatsApp Flow form but never submitted. These accumulate over time; WF-73 (post-go-live cleanup job) will handle them. No action needed now. |
| `messages` | 0 | **Zero messages logged** despite 1 completed consultation. Consistent with WF-60's `Done` code node validator error (returns non-array). WF-60 is silently failing to log outbound messages. |
| `admin_actions` | 0 | No admin actions logged — consistent with the `action` vs `action_type` column mismatch blocking all INSERTs. |
| `consultations` | 1 | One consultation from test session. |
| `payments` | 1 | One payment from test session. |

**Key concern:** `messages` being empty means deduplication in WF-00 (which checks `messages` for duplicate `whatsapp_message_id`) will always miss → any retried webhook from Meta will be processed twice until WF-60 starts logging.

---

## Valid Workflows (No Errors)

These 10 workflows passed strict validation with zero errors:

| Workflow | Node Count |
|----------|-----------|
| WF-02 User State Router | 16 |
| WF-21 New User Welcome + Form | 4 |
| WF-22 Form Response Handler | 10 |
| WF-23 Pre-Form Intent Filter | 7 |
| WF-25 Intent Classifier | 13 |
| WF-30 Payment Pending Intent Filter | 7 |
| WF-31 Payment Submitted Handler | 10 |
| WF-32 Payment Confirmation Receiver | 11 |
| WF-44 Feedback Recorder | 9 |
| WF-52 Slack Channel Manager | 9 |

---

## Consolidated Fix List (Prioritised)

### Must fix before go-live (runtime-breaking)

| # | Fix | Workflow(s) | Type |
|---|-----|-------------|------|
| F-01 | Add `stage VARCHAR(50)` column to `users` table (or strip `stage = NULL` from SQL) | WF-44, WF-45 | DB migration |
| F-02 | Fix `admin_actions` INSERT: `action` → `action_type`, `reason` → `notes` | WF-47, WF-11 | Surgical |
| F-03 | Downgrade `executeWorkflow` nodes from v2 → v1.3 | WF-20, WF-45, WF-12 | Surgical |
| F-04 | Fix `workflowId` type on executeWorkflow nodes | WF-47 | Surgical |
| F-05 | Add `=` prefix to all Postgres `query` fields with mixed expressions | WF-45, WF-11, WF-40, WF-46, WF-47 | Surgical |
| F-06 | Fix unmatched `{{ }}` brackets in Gemini node `jsonBody` | WF-43 | Surgical |

### Verify before go-live (may be working or may be broken)

| # | Fix | Workflow(s) | How to verify |
|---|-----|-------------|---------------|
| F-07 | Check Slack node operations render correctly in UI | WF-11, WF-33, WF-34, WF-41, WF-42, WF-46, WF-51 | Open each in n8n UI — re-select `post` if dropdown shows blank |
| F-08 | Check `mappingMode: passthrough` nodes pass data | WF-10, WF-11, WF-33 | Run admin command smoke test — verify sub-workflows receive correct input |
| F-09 | Add `onError: "continueRegularOutput"` to webhook nodes | WF-00, WF-10 | Confirm Meta/Slack always gets 200 even on processing errors |

### Defer to post-MVP

| # | Fix | Workflow(s) |
|---|-----|-------------|
| F-10 | Add `cachedResultName` to all `executeWorkflow` workflowId fields | All (~40 nodes) |
| F-11 | Update n8n instance from 2.1.4 to latest | Instance-level |
| F-12 | Investigate and fix WF-60 `Done` code node — restore message logging | WF-60 |

---

## Instance-Level Finding

**n8n version 2.1.4 is 19 releases behind** (latest: 2.20.9). This is the root cause of the `executeWorkflow@v2` compatibility issue — v2 was introduced after 2.1.4. Update is a post-MVP VPS task (requires Docker restart on VPS).

---

## Activity Log

| Date | Action |
|------|--------|
| 2026-05-16 | Full technical validation completed. 28 workflows scanned. 6 confirmed runtime bugs, 5 SQL expression bugs, 2 DB schema mismatches, 14 medium items for verification. Tracker + HTML report written. |
