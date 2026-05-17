# Tech Debt Remediation Plan — Chinmay Astro

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all tech debts from `docs/Tech_Debts.md` in priority order so Chinmay Astro can complete its full smoke test and proceed to go-live.

**Architecture:** Pure n8n workflow fixes plus documentation updates. No new workflows. Each task targets a specific workflow or document. Changes go through the methodology backup discipline.

**Tech Stack:** n8n MCP (`mcp__n8n__*`), Postgres MCP (`mcp__postgres__query`), n8n methodology backup script, docs/workflow-registry.md, docs/Tech_Debts.md

---

## ⟳ Session Resume Protocol

**To resume this plan after any interruption:**

1. Read this file
2. Scan for the first `- [ ]` (unchecked) step — that is where work resumes
3. Re-read the parent task header to understand context
4. Check "Plan Status" below to see overall progress
5. Proceed — do not redo completed (`- [x]`) steps

**To start a new session with this plan, use this prompt:**
> "Continue the tech debt remediation plan. Read `docs/superpowers/plans/2026-05-13-tech-debt-remediation.md`, find the first unchecked step, and continue from there."

---

## Plan Status

| Field | Value |
|-------|-------|
| **Last session date** | 2026-05-13 |
| **Current task** | Task 1 — Baseline Audit |
| **Progress** | 0 / 13 tasks complete |
| **Smoke test status** | Steps 1–8 ✅, steps 9–15 ❓ |

> **Update this table at the end of each session** — change "Current task" and "Progress" so the next session can glance here and know status.

---

## Pre-Requisites (verify before starting any task)

- [ ] SSH tunnel is open: `ssh -L 5678:localhost:5678 -L 5432:localhost:5432 root@45.79.125.184`
- [ ] n8n reachable at `http://localhost:5678/api/v1` — test with `mcp__n8n__n8n_health_check`
- [ ] Postgres reachable — test with `mcp__postgres__query` (`SELECT 1`)
- [ ] n8n API key available in memory under "Chinmay Astro — n8n API Key"

---

## PHASE 1 — Baseline Audit

> Purpose: Some tech debts in docs/Tech_Debts.md may already be resolved. This task verifies ground truth before making any changes, so we don't redo work or overwrite working nodes.

### Task 1: Baseline Audit — Verify Which TDs Are Already Fixed

**Scope:** Read-only. No workflow changes. Output: confirmed list of open vs. closed TDs.

**Files:**
- Read: `docs/Tech_Debts.md`
- Read each affected workflow via `mcp__n8n__n8n_get_workflow`
- Update: this plan file — mark any pre-resolved TDs as `~~skipped — already fixed~~`

---

**Step 1.1: Verify TD-001 (schema prefix) — check WF-47**

- [ ] Run:
  ```
  mcp__n8n__n8n_get_workflow { "id": "2U7mxHMyqA41ROKX" }
  ```
  Inspect the SQL in nodes "Update User Status to opted_out" and "Log to admin_actions".
  Expected if broken: `FROM users` or `UPDATE users` without `chinmay_astro.` prefix.
  Record result: **open / fixed**

**Step 1.2: Verify TD-001 — check WF-11**

- [ ] Run:
  ```
  mcp__n8n__n8n_get_workflow { "id": "GoTYo0GS2y8qjjkw" }
  ```
  Inspect SQL in nodes "Lookup Blocked User", "Unblock User", "Get Active Users", "Get Stats".
  Record result: **open / fixed**

**Step 1.3: Verify TD-001 — check WF-44, WF-45, WF-46, WF-34**

- [ ] Run get_workflow for each ID and inspect SQL nodes:
  - WF-44 (`Du2CJ3OTohRFZYoA`) — node "Save Feedback to DB"
  - WF-45 (`MUG7rPgSHc7UtAE9`) — nodes "Load User Record", "Set status=payment_pending"
  - WF-46 (`UV62An60fzflU0uD`) — nodes "Load User by Phone", "Update User to Blocked Status"
  - WF-34 (`se82n3MUQ9xE5aEr`) — node "Load User by Phone"
  Record result for each: **open / fixed**

**Step 1.4: Verify TD-002 (WF-33 redundant WF-52 call)**

- [ ] Run:
  ```
  mcp__n8n__n8n_get_workflow { "id": "NcHZedq9ycnAQ9SW" }
  ```
  Check: does WF-33 still have a node calling WF-52, or does it read `slack_channel_id` from DB?
  Record result: **open / fixed**

**Step 1.5: Verify TD-003 (WF-22 wrong WF-50 ID on User Already Exists branch)**

- [ ] In the WF-22 JSON (already fetched or fetch `dr8QM0m92Ml8MvIh`), find the second WF-50 call node (named `Call 'WF-50 Send WhatsApp'1`).
  Check its `workflowId`. Expected correct: `BUVun38WEKb12zg9`. If different: **open**.
  Record result: **open / fixed**

**Step 1.6: Verify TD-004 (WF-60 nodes disabled)**

- [ ] Run:
  ```
  mcp__n8n__n8n_get_workflow { "id": "6H75p935FpBVBQtV" }
  ```
  Check: are core nodes (Inbound Log Message, Outbound Log Message, Log to Messages Table, Get User ID) enabled or disabled?
  Record result: **open / fixed**

**Step 1.7: Verify TD-005 (WF-11 admin confirmation nodes disabled)**

- [ ] In the WF-11 JSON from step 1.2: check whether nodes "Confirm Consultation Closure", "Confirm User Blocked", "Unknown Command Response", "Get Active Users", "Get Stats" are enabled.
  Record result: **open / fixed**

**Step 1.8: Verify TD-014 (WF-42 non-existent columns)**

- [ ] Run:
  ```
  mcp__n8n__n8n_get_workflow { "id": "fx70vqyJtRdF2DgR" }
  ```
  Inspect "Update User Status" node SQL. Check if it references `current_consultation_id` or `total_consultations`.
  Verify those columns actually exist:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='chinmay_astro' AND table_name='users'
  AND column_name IN ('current_consultation_id', 'total_consultations');
  ```
  Record result: **open / fixed**

**Step 1.9: Verify TD-015 (WF-42 template vs buttons)**

- [ ] In the WF-42 JSON from step 1.8: find "Prepare Feedback Message" node.
  Check `messageType` — if it's `"template"`, this is **open**. If it's `"interactive"` with buttons, it's **fixed**.
  Record result: **open / fixed**

**Step 1.10: Verify TD-016 (WF-31 no Slack relay)**

- [ ] Run:
  ```
  mcp__n8n__n8n_get_workflow { "id": "HB8nXudAtk9iXz7C" }
  ```
  Check if there's a node that calls WF-51 to relay the user's message to Slack.
  Record result: **open / fixed**

**Step 1.11: Verify TD-010, TD-011, TD-012 (likely already done)**

- [ ] TD-010 (UNBLOCK in WF-11): In WF-11 JSON from step 1.2, confirm UNBLOCK branch exists.
  Record: **done** or **open**
- [ ] TD-011 (WF-45 UPI wording): In WF-45 JSON, confirm payment message uses `+91-9653240263`.
  Record: **done** or **open**
- [ ] TD-012 (WF-23 registry status): Open `docs/workflow-registry.md`, find WF-23 row in the main table.
  Check if Registry Status says `🔵 Placeholder` or `🟢 Active`.
  Record: **open** or **fixed**

**Step 1.12: Verify TD-006 (stale WF-20 note in registry)**

- [ ] Open `docs/workflow-registry.md`, find note #12 under "CRITICAL CONTEXT FOR NEXT SESSION".
  If it still says "WF-20 STOP branch — WRONG (session 4): Current WF-20 built in session 4 placeholder has incorrect STOP handling..." this is **open** (misleads future Claude).
  Record: **open / fixed**

**Step 1.13: Record baseline summary in Plan Status table above**

- [ ] Update the Plan Status table above: note which tasks can be skipped.

---

## PHASE 2 — P0 Critical Fixes

> These block the smoke test and must be fixed before progressing to steps 9–15.

### Task 2: Schema Prefix Fix — WF-47 (TD-001)

**Workflows affected:** WF-47 Unsubscribe Handler (`2U7mxHMyqA41ROKX`)
**Nodes to fix:** "Update User Status to opted_out" (SQL: `UPDATE users`), "Log to admin_actions" (SQL: `INSERT INTO admin_actions` or similar)
**Fix:** Add `chinmay_astro.` prefix to all bare table references.

- [ ] **Back up WF-47**
  ```bash
  mkdir -p "/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro/archive"
  # Export via MCP:
  mcp__n8n__n8n_get_workflow { "id": "2U7mxHMyqA41ROKX" }
  # Save output to archive/WF-47-pre-td001-fix.json
  ```

- [ ] **Fix "Update User Status to opted_out" node SQL**
  Using `mcp__n8n__n8n_update_partial_workflow`, update the SQL expression:
  - Change `UPDATE users SET` → `UPDATE chinmay_astro.users SET`
  - Change `WHERE phone` → stays the same (just the table name prefix)

- [ ] **Fix "Log to admin_actions" node SQL**
  - Change `INSERT INTO admin_actions` → `INSERT INTO chinmay_astro.admin_actions`

- [ ] **Verify: re-fetch WF-47 and confirm both nodes now have `chinmay_astro.` prefix**
  ```
  mcp__n8n__n8n_get_workflow { "id": "2U7mxHMyqA41ROKX" }
  ```
  Look at both SQL nodes — confirm prefix present.

---

### Task 3: Schema Prefix Fix — WF-44, WF-45, WF-46, WF-34 (TD-001)

**Workflows:** WF-44 (`Du2CJ3OTohRFZYoA`), WF-45 (`MUG7rPgSHc7UtAE9`), WF-46 (`UV62An60fzflU0uD`), WF-34 (`se82n3MUQ9xE5aEr`)

For each workflow in sequence:

**WF-44 — "Save Feedback to DB"**
- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "Du2CJ3OTohRFZYoA" }`, save to `archive/WF-44-pre-td001-fix.json`
- [ ] Fix SQL: `UPDATE users` → `UPDATE chinmay_astro.users`
- [ ] Verify: re-fetch and confirm prefix

**WF-45 — "Load User Record" and "Set status=payment_pending"**
- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "MUG7rPgSHc7UtAE9" }`, save to `archive/WF-45-pre-td001-fix.json`
- [ ] Fix "Load User Record" SQL: `FROM users` → `FROM chinmay_astro.users`
- [ ] Fix "Set status=payment_pending" SQL: `UPDATE users` → `UPDATE chinmay_astro.users`
- [ ] Verify: re-fetch and confirm both nodes have prefix

**WF-46 — "Load User by Phone" and "Update User to Blocked Status"**
- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "UV62An60fzflU0uD" }`, save to `archive/WF-46-pre-td001-fix.json`
- [ ] Fix "Load User by Phone" SQL: `FROM users` → `FROM chinmay_astro.users`
- [ ] Fix "Update User to Blocked Status" SQL: `UPDATE users` → `UPDATE chinmay_astro.users`
- [ ] Verify: re-fetch and confirm both nodes have prefix

**WF-34 — "Load User by Phone"**
- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "se82n3MUQ9xE5aEr" }`, save to `archive/WF-34-pre-td001-fix.json`
- [ ] Fix "Load User by Phone" SQL: `FROM users` → `FROM chinmay_astro.users`
- [ ] Verify: re-fetch and confirm prefix

---

### Task 4: Schema Prefix Fix — WF-11 (TD-001, also enables TD-005 fixes)

**Workflow:** WF-11 Command Parser (`GoTYo0GS2y8qjjkw`)
**Note:** Fix schema prefix on ALL nodes (including disabled ones) so that when disabled nodes are re-enabled in Task 9, they work immediately.

- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "GoTYo0GS2y8qjjkw" }`, save to `archive/WF-11-pre-td001-fix.json`

- [ ] **Fix "Lookup Blocked User" node**
  SQL: `FROM users WHERE phone` → `FROM chinmay_astro.users WHERE phone`

- [ ] **Fix "Unblock User" node**
  SQL: `UPDATE users SET status` → `UPDATE chinmay_astro.users SET status`
  SQL: `INSERT INTO admin_actions` → `INSERT INTO chinmay_astro.admin_actions`

- [ ] **Fix "Get Active Users" node (disabled — fix anyway)**
  SQL: `FROM users` → `FROM chinmay_astro.users`

- [ ] **Fix "Get Stats" node (disabled — fix anyway)**
  SQL: `FROM users` → `FROM chinmay_astro.users` (wherever present)

- [ ] Verify: re-fetch WF-11 and confirm all 5 nodes have `chinmay_astro.` prefix

---

### Task 5: WF-42 Column Fix — Remove Non-Existent Columns (TD-014)

**Workflow:** WF-42 Consultation Closer (`fx70vqyJtRdF2DgR`)
**Problem:** "Update User Status" node references `current_consultation_id` and `total_consultations` columns that don't exist in `chinmay_astro.users`.
**Fix chosen:** Simplify UPDATE — remove the two non-existent column references. The `status` update is what matters; analytics columns can be added later as a deliberate DB migration.

- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "fx70vqyJtRdF2DgR" }`, save to `archive/WF-42-pre-td014-fix.json`

- [ ] **Fix "Update User Status" node SQL**
  Replace:
  ```sql
  UPDATE chinmay_astro.users 
  SET status = 'consultation_closed',
      current_consultation_id = NULL,
      total_consultations = total_consultations + 1
  WHERE id = $1
  ```
  With:
  ```sql
  UPDATE chinmay_astro.users 
  SET status = 'consultation_closed'
  WHERE id = $1
  ```
  (Keep the WHERE clause binding `$1` parameter as-is.)

- [ ] Verify: re-fetch WF-42 "Update User Status" node — confirm only `status` column is set.

- [ ] **Quick smoke test for this fix:** Ask Chinmay to run a test CLOSE command via Slack on a test user, OR verify via DB that a manual update works:
  ```sql
  -- Test that the simplified query works (dry run — use a fake ID)
  EXPLAIN UPDATE chinmay_astro.users SET status = 'consultation_closed' WHERE id = 99999;
  ```
  Expected: "UPDATE 0" — query parses and executes without column error.

---

### Task 6: WF-33 Channel ID Fix — Read from DB, not WF-52 (TD-002)

**Workflow:** WF-33 Payment Approval Processor (`NcHZedq9ycnAQ9SW`)
**Problem:** WF-33 calls WF-52 to "create" a channel that already exists, then reads `channelId` from WF-52 response. Should instead read `slack_channel_id` from the DB (set by WF-22 at form submission).
**Fix:** Update the "Load User by Phone" query to SELECT `slack_channel_id`. Replace WF-52 call with direct reference to `$('Load User by Phone').item.json.slack_channel_id`. Delete the "Prepare Channel Data" and "Call WF-52 Create Channel" nodes.

- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "NcHZedq9ycnAQ9SW" }`, save to `archive/WF-33-pre-td002-fix.json`

- [ ] **Update "Load User by Phone" node SQL** — add `slack_channel_id` to the SELECT:
  ```sql
  SELECT id, name, phone, status, slack_channel_id
  FROM chinmay_astro.users
  WHERE phone = $1
  LIMIT 1
  ```

- [ ] **Find the node that posts to the Slack channel** (the one that currently reads `$('Call WF-52 Create Channel').item.json.channelId`). Update its channel ID reference:
  - Old: `{{ $('Call WF-52 Create Channel').item.json.channelId }}`
  - New: `{{ $('Load User by Phone').item.json.slack_channel_id }}`

- [ ] **Delete "Prepare Channel Data" node** (no longer needed)

- [ ] **Delete "Call WF-52 Create Channel" node** (no longer needed)

- [ ] Verify: re-fetch WF-33 — confirm no WF-52 call node exists, and the Slack post node references `Load User by Phone`.

- [ ] **Quick smoke test:** Run a test APPROVE on a `payment_submitted` user via Slack. Confirm consultation starts and the correct Slack channel receives the approval message (not an error about WF-52).

---

### Task 7: WF-42 Post-Consultation Message — Interactive Buttons (TD-015)

**Workflow:** WF-42 Consultation Closer (`fx70vqyJtRdF2DgR`) — same workflow as Task 5, but different node.
**Problem:** "Prepare Feedback Message" node sends a Meta template (`consultation_closed_feedback`) that may not be approved and doesn't show interactive buttons.
**Fix:** Change to a free-form interactive button message (valid within 24hr window since consultation just ended — admin just sent CLOSE) with three buttons:
1. "Provide Feedback" (button_id: `feedback`)
2. "Book Another Consultation" (button_id: `rebook`)
3. "I'm done, thank you" (button_id: `done`)

- [ ] Back up: already backed up in Task 5. Skip backup — already have `archive/WF-42-pre-td014-fix.json`. Note that Task 7 changes a DIFFERENT node in WF-42, but backup from Task 5 is sufficient since that was pre-modification.

- [ ] **Update "Prepare Feedback Message" (or equivalent) node** in WF-42.
  Change the message payload from:
  ```json
  {
    "messageType": "template",
    "templateName": "consultation_closed_feedback",
    "templateParams": ["{{ $json.name }}"]
  }
  ```
  To an interactive message with buttons:
  ```json
  {
    "messageType": "interactive",
    "interactiveType": "button",
    "bodyText": "Your consultation with Chinmay is now complete. What would you like to do next?",
    "buttons": [
      { "id": "feedback", "title": "Provide Feedback" },
      { "id": "rebook", "title": "Book Another Consultation" },
      { "id": "done", "title": "I'm done, thank you" }
    ]
  }
  ```
  **Note:** Match the exact field names that WF-50 (Send WhatsApp) expects for interactive button payloads. Check WF-50's input schema if unsure — look at how WF-22 sends the "Payment Completed" button as a reference.

- [ ] **Ensure WF-02 routes "done" and "feedback" button replies correctly.**
  After the user taps a button, WF-02 receives an `interactive` / `button_reply` message. Check the route logic in WF-02 (`PubCsNTOspF3xqXZ`):
  - `button_reply` with `id: rebook` → should route to WF-45 (Rebook Handler)
  - `button_reply` with `id: feedback` → should route to WF-44 (Feedback Recorder) or set `awaiting_feedback` flag and route to post-consult handler
  - `button_reply` with `id: done` → should send a farewell message and no state change
  
  If WF-02 doesn't handle these, add a WF-43 branch or update WF-02 route accordingly.

- [ ] Verify: re-fetch WF-42 — confirm "Prepare Feedback Message" node now sends interactive buttons, not a template.

---

## PHASE 3 — P1 Functional Gaps

### Task 8: WF-22 Wrong WF-50 ID on User Already Exists Branch (TD-003)

**Workflow:** WF-22 Form Response Handler (`dr8QM0m92Ml8MvIh`)
**Problem:** The second WF-50 call node (`Call 'WF-50 Send WhatsApp'1`) on the "User Already Exists" path has an unknown workflow ID (`aJoquwuEUbz8bI1B`).
**Fix:** Update this node's `workflowId` to the correct WF-50 ID: `BUVun38WEKb12zg9`.

- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "dr8QM0m92Ml8MvIh" }`, save to `archive/WF-22-pre-td003-fix.json`

- [ ] **Find the node** `Call 'WF-50 Send WhatsApp'1` in WF-22. Confirm its `workflowId` is NOT `BUVun38WEKb12zg9`.

- [ ] **Update the workflowId** using `mcp__n8n__n8n_update_partial_workflow`:
  Set the `workflowId` parameter of that node to `BUVun38WEKb12zg9`.

- [ ] Verify: re-fetch WF-22 — confirm both WF-50 call nodes now reference `BUVun38WEKb12zg9`.

---

### Task 9: WF-60 Re-enable Message Logging (TD-004)

**Workflow:** WF-60 Message Logger (`6H75p935FpBVBQtV`)
**Problem:** All core processing nodes are disabled — logging is completely dead. Every WhatsApp message is silently unlogged.
**Fix:** Re-enable all disabled nodes AND fix schema prefix on "Get User ID" node.

- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "6H75p935FpBVBQtV" }`, save to `archive/WF-60-pre-td004-fix.json`

- [ ] **Re-enable all disabled nodes:**
  Nodes to enable: `Inbound - Log Message`, `Inbound - Prepare Log Entry`, `Outbound - Log Message`, `Outbound - Prepare Log Entry`, `Get User ID`, `Log to Messages Table`
  
  For each node, set `disabled: false` (via partial update or full workflow update).

- [ ] **Fix schema prefix on "Get User ID" node SQL:**
  Change `FROM users WHERE` → `FROM chinmay_astro.users WHERE`
  (and any other bare table references in WF-60)

- [ ] Verify: re-fetch WF-60 — confirm all 6 nodes are enabled and "Get User ID" has `chinmay_astro.` prefix.

- [ ] **Smoke test:** Send a test WhatsApp message through the system, then verify a log entry was written:
  ```sql
  SELECT * FROM chinmay_astro.messages ORDER BY created_at DESC LIMIT 5;
  ```
  (Use the actual messages table name — check schema if `messages` is different.)

---

### Task 10: WF-11 Re-enable Admin Confirmation and Stats Nodes (TD-005)

**Workflow:** WF-11 Command Parser (`GoTYo0GS2y8qjjkw`)
**Pre-condition:** Task 4 already fixed schema prefixes on these nodes. Now re-enable them.

- [ ] **Verify Task 4 is complete** — confirm `chinmay_astro.` prefix is present on "Get Active Users" and "Get Stats" nodes before re-enabling them. (Check the Task 4 checkbox.)

- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "GoTYo0GS2y8qjjkw" }`, save to `archive/WF-11-pre-td005-re-enable.json`

- [ ] **Re-enable these nodes:**
  - `Confirm Consultation Closure` (Slack message — admin gets ack after CLOSE command)
  - `Confirm User Blocked` (Slack message — admin gets ack after BLOCK command)
  - `Unknown Command Response` (Slack message — admin notified on typo in command)
  - `Get Active Users` + `Format List` + `Send List To Admin` (LIST USERS command chain)
  - `Get Stats` + `Format Stats` + `Send Stats To Admin` (STATS command chain)
  
  For each: set `disabled: false`

- [ ] Verify: re-fetch WF-11 — confirm all listed nodes are enabled.

- [ ] **Smoke test admin commands:**
  In the Slack workspace, type (in any channel n8n can see):
  - `CLOSE CHAT CONSULT +91XXXXXXXXXX` → expect Slack confirmation message
  - `BLOCK +91XXXXXXXXXX` → expect Slack confirmation
  (Use a test/fake phone number that won't affect real users)

---

### Task 11: WF-31 Add Slack Relay for payment_submitted User Messages (TD-016)

**Workflow:** WF-31 Payment Submitted Handler (`HB8nXudAtk9iXz7C`)
**Problem:** When a `payment_submitted` user sends a message while waiting for approval, WF-31 replies "under review" but doesn't relay the message to the admin's Slack channel. Admin is blind to context.
**Fix:** Add a WF-51 call after the "under review" acknowledgement that posts the user's message to `slack_channel_id` with a prefix like `💬 [Awaiting approval] {user}: {message}`.

- [ ] Back up: `mcp__n8n__n8n_get_workflow { "id": "HB8nXudAtk9iXz7C" }`, save to `archive/WF-31-pre-td016-fix.json`

- [ ] **Verify WF-31 has access to `slack_channel_id`** — check if its DB lookup node already selects that column. If not, update the SQL:
  ```sql
  SELECT id, name, phone, status, slack_channel_id
  FROM chinmay_astro.users
  WHERE phone = $1
  LIMIT 1
  ```

- [ ] **Add a new "Relay to Slack" node** that calls WF-51:
  ```json
  {
    "workflowId": "wlZRK0YxnhP0b2RL",
    "channelId": "{{ $('Load User by Phone').item.json.slack_channel_id }}",
    "messageText": "💬 [Awaiting approval] {{ $('Load User by Phone').item.json.name }}: {{ $json.messageText }}"
  }
  ```
  Position this node to execute after the user-facing acknowledgement (parallel or sequential — parallel is fine since it doesn't affect the user response).

- [ ] Verify: re-fetch WF-31 — confirm WF-51 call node exists with correct channel reference.

---

## PHASE 4 — P2 Design / Documentation

### Task 12: Documentation Fixes — Registry Cleanup (TD-006, TD-007, TD-008, TD-009, TD-012)

**File:** `docs/workflow-registry.md`
**No workflow changes.** Pure documentation fixes to prevent future Claude sessions from being misled.

- [ ] **TD-006: Remove stale WF-20 error note**
  In `docs/workflow-registry.md`, under "## ⚠️ CRITICAL CONTEXT FOR NEXT SESSION", find note #12:
  > "WF-20 STOP branch — WRONG (session 4): Current WF-20 built in session 4..."
  Replace with:
  > "WF-20 Keyword Handler — ✅ FIXED (session 5): STOP branch correctly calls WF-47. HELP/REBOOK keywords also handled. Active."

- [ ] **TD-009: Verify WF-60 / WF-20 IDs in docs/NEXT_SESSION_HANDOFF.md**
  Open `docs/NEXT_SESSION_HANDOFF.md`. Check the reference table for WF-60 ID.
  If missing or wrong, add/correct it: `WF-60 Message Logger: 6H75p935FpBVBQtV`
  Also confirm WF-20 ID is present: `WF-20 Keyword Handler: LgIDj1v4ZbCPlX25`

- [ ] **TD-012: Update WF-23 status in registry main table**
  In `docs/workflow-registry.md`, under "## WF-2x — Onboarding", find the WF-23 row.
  Change `Registry Status` from `🔵 Placeholder` to `🟢 Active`.
  Change the Notes field to match what was implemented (from the n8n inventory section, which already shows the correct detail).

- [ ] **TD-007: Rename WF-52 call-site nodes**
  This requires two partial workflow updates — purely cosmetic node renames:
  - WF-22 (`dr8QM0m92Ml8MvIh`): rename node `"Call WF-52 (Create User Channel)"` → `"Ensure Slack Channel Exists (WF-52)"`
  - WF-33 (`NcHZedq9ycnAQ9SW`): by the time this task runs, WF-33's WF-52 call should be deleted (Task 6). Verify that's done. If WF-52 call was deleted, skip this rename.

- [ ] **TD-008: Document WF-52 input contract in registry**
  In `docs/workflow-registry.md`, find WF-52 entry in the WF-5x table. Expand the Notes column:
  > **Input contract:** `phoneNumber` (string, required), `userName` (string, required), `userId` (integer, optional). **Output:** `{ channelId, channelName, isNew }`. **Idempotent:** returns existing `consult-{phone}` channel if it already exists — always safe to call multiple times.

---

## PHASE 5 — P4 Cleanup

### Task 13: Delete Stale Workflows (TD-013)

**Workflows to delete:**
| n8n ID | Name |
|--------|------|
| `z6as85o3b1zK22eF` | WF-30 New User Onboarding (WRONG - DEACTIVATED) |
| `fdlIpl67amL2Ho6U` | BACKUP_20260412_WF-25 Post-Consultation Options (SUPERSEDED) |
| `yIZwO3CZk6bOBAXl` | BACKUP_20260412_WF-30 New User Onboarding (WRONG) |

- [ ] **Confirm each is truly inactive before deleting:**
  ```
  mcp__n8n__n8n_get_workflow { "id": "z6as85o3b1zK22eF" }
  ```
  Check `active: false`. Repeat for other two IDs. Do NOT delete an active workflow.

- [ ] **Delete WF-30 (WRONG - DEACTIVATED)**:
  ```
  mcp__n8n__n8n_delete_workflow { "id": "z6as85o3b1zK22eF" }
  ```

- [ ] **Delete BACKUP WF-25 (SUPERSEDED)**:
  ```
  mcp__n8n__n8n_delete_workflow { "id": "fdlIpl67amL2Ho6U" }
  ```

- [ ] **Delete BACKUP WF-30 (WRONG)**:
  ```
  mcp__n8n__n8n_delete_workflow { "id": "yIZwO3CZk6bOBAXl" }
  ```

- [ ] Verify: `mcp__n8n__n8n_list_workflows` — confirm these three IDs no longer appear.

- [ ] **Update registry:** In `docs/workflow-registry.md` n8n Inventory table, remove the `WF-30 New User Onboarding (WRONG - DEACTIVATED)` row.

---

## PHASE 6 — Smoke Test Completion

### Task 13+1: Full End-to-End Smoke Test (Resume from Step 9)

> Steps 1–8 were confirmed working before this remediation. This picks up from step 9 (Admin CLOSE) which was blocked by TD-014 and TD-015.

- [ ] **Step 9: Admin CLOSE** → expect: consultation_closed status set (not SQL error), interactive buttons sent to user (not template error)
- [ ] **Step 10: User taps "Provide Feedback"** → expect: `awaiting_feedback` flag set, prompt sent
- [ ] **Step 11: User sends feedback text** → expect: WF-44 saves to DB, ack sent, flag cleared
  Verify in DB: `SELECT feedback, stage FROM chinmay_astro.users WHERE phone = 'TEST_PHONE'`
- [ ] **Step 12: User taps "Book Another Consultation" (REBOOK flow)** → expect: WF-45 runs, status → `payment_pending`, UPI instructions sent
- [ ] **Step 13: User sends STOP** → expect: `opted_out` status, confirmation sent, no error (schema prefix now fixed in WF-47)
- [ ] **Step 14: opted_out user messages again** → expect: WF-21 welcome + form re-sent
- [ ] **Step 15: Admin BLOCK** → expect: `blocked` status, no message to user, Slack confirmation (now enabled per Task 10)
- [ ] **Step 16: Admin UNBLOCK** → expect: `consultation_closed` status, Slack confirmation
- [ ] **Step 17: Garbage message** → expect: WF-25 classifies → warning sent + Slack admin notified
- [ ] **Step 18: Message logging verification** → after all steps, check WF-60 wrote entries:
  ```sql
  SELECT COUNT(*) FROM chinmay_astro.messages WHERE created_at > NOW() - INTERVAL '2 hours';
  ```
  Expected: > 0 rows (logging now active per Task 9)

- [ ] **Update docs/NEXT_SESSION_HANDOFF.md** with final smoke test status.
- [ ] **Update Plan Status table** at top of this file: mark all 13 tasks complete, smoke test ✅.

---

## Appendix A: TD Summary — Quick Reference

| TD | Priority | Task | Notes |
|----|----------|------|-------|
| TD-001 | 🔴 P0 | Tasks 2, 3, 4 | Schema prefix in 12 nodes across 8 WFs |
| TD-002 | 🔴 P0 | Task 6 | WF-33 redundant WF-52 call |
| TD-014 | 🔴 P0 | Task 5 | WF-42 non-existent columns |
| TD-015 | 🟠 P1 | Task 7 | WF-42 Meta template → interactive buttons |
| TD-003 | 🟠 P1 | Task 8 | WF-22 wrong WF-50 ID on alt branch |
| TD-004 | 🟠 P1 | Task 9 | WF-60 all nodes disabled |
| TD-005 | 🟠 P1 | Task 10 | WF-11 admin feedback nodes disabled |
| TD-016 | 🟠 P1 | Task 11 | WF-31 no Slack relay |
| TD-006 | 🟡 P2 | Task 12 | Stale WF-20 error note in registry |
| TD-007 | 🟡 P2 | Task 12 | WF-52 misleading node names |
| TD-008 | 🟡 P2 | Task 12 | WF-52 input contract undocumented |
| TD-009 | 🟡 P2 | Task 12 | WF-60/WF-20 IDs in NEXT_SESSION_HANDOFF |
| TD-012 | 🟢 P3 | Task 12 | WF-23 registry status wrong |
| TD-010 | 🟢 P3 | Task 1 | UNBLOCK — likely already done (session 5) |
| TD-011 | 🟢 P3 | Task 1 | WF-45 UPI wording — likely done (session 5) |
| TD-013 | ⚪ P4 | Task 13 | Delete 3 stale workflows |

---

## Appendix B: Methodology Uplift — Resume-Plan Skill Design

**Gap identified:** No existing skill handles "pick up a plan file across sessions with state tracking." The `superpowers:executing-plans` skill executes inline but requires session continuity. There is no skill that reads a plan file, reports its current status, and continues from the first incomplete step.

**Recommendation:** Add a `resume-plan` skill to the n8n-whatsapp-methodology plugin (or as a generic superpowers skill). This addresses the "restartable across sessions" requirement systematically.

**Proposed skill file:** `~/.claude/plugins/cache/prasadmujumdar19/n8n-whatsapp-methodology/0.1.0/skills/resume-plan.md`

**Skill design:**

```markdown
---
name: resume-plan
description: Resume an interrupted implementation plan from the first incomplete step
trigger: User says "continue the plan", "resume plan", or provides a plan file path
---

## Steps

1. **Locate plan file**
   - If user provides path: use it
   - Otherwise: search `docs/superpowers/plans/*.md` for the most recently modified file
   - Read the plan file

2. **Report status**
   - Count total tasks (headings with ### Task)
   - Count complete tasks (all steps under task are checked `- [x]`)
   - Count in-progress tasks (some steps checked, some not)
   - Identify the first incomplete step (first `- [ ]`)
   - Print 3-line status: "N/M tasks complete. Current task: [name]. Resuming from: [step description]."

3. **Verify pre-requisites** (if plan has a Pre-Requisites section)
   - Run each pre-req check
   - If any fail: stop and tell user what's needed

4. **Continue execution**
   - Use `superpowers:executing-plans` from the identified step
   - Do NOT re-execute any `- [x]` step

5. **After each task completes**
   - Update the Plan Status table in the plan file
   - Note the new "Current task" and "Progress" values
```

**To implement this skill, add it as a task to the Phase 0 methodology plan** (`docs/superpowers/plans/2026-05-12-n8n-whatsapp-methodology-phase0.md`) or create a separate Phase 0.5 plan for methodology improvements.

**Self-tracking note:** This plan itself is designed to work WITHOUT the new skill — the "Session Resume Protocol" section at the top is the manual version of what the skill would automate.
