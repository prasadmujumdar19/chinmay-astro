# Chinmay Astro — Tech Debt Register

**Created:** 2026-05-13  
**Source:** Static analysis of workflow JSONs in `workflows/` + registry + session handoff docs  
**Method:** Python script scanned all 31 workflow JSONs for schema prefix violations, sub-workflow call parameters, disabled nodes, and stale references. No n8n execution log dump needed.

---

## Priority Key

| Level | Meaning |
|-------|---------|
| 🔴 P0 | Smoke test blocker — will fail the current step |
| 🟠 P1 | Functional gap — smoke test will hit it within 1–3 steps |
| 🟡 P2 | Design/naming confusion — causes incorrect AI-generated fixes |
| 🟢 P3 | Feature gap — missing admin capability |
| ⚪ P4 | Cleanup — dead code, registry inaccuracies |

---

## 🔴 P0 — Smoke Test Blockers

### TD-001 · Schema prefix `chinmay_astro.` missing in multiple critical-path workflows

**Root cause:** SQL was written without fully qualifying table names. n8n's Postgres connection does not set `search_path=chinmay_astro` by default, so unqualified `users` / `admin_actions` references fail with `relation "users" does not exist`.

**Affected workflows + nodes (confirmed by static analysis):**

| Workflow | Node | Tables |
|----------|------|--------|
| WF-47 Unsubscribe Handler | Update User Status to opted_out | `users` |
| WF-47 Unsubscribe Handler | Log to admin_actions | `admin_actions` |
| WF-11 Command Parser | Lookup Blocked User | `users` |
| WF-11 Command Parser | Unblock User | `users`, `admin_actions` |
| WF-11 Command Parser | Get Active Users (disabled) | `users` |
| WF-11 Command Parser | Get Stats (disabled) | `users` |
| WF-44 Feedback Recorder | Save Feedback to DB | `users` |
| WF-45 Rebook Handler | Load User Record | `users` |
| WF-45 Rebook Handler | Set status=payment_pending | `users` |
| WF-46 User Blocker | Load User by Phone | `users` |
| WF-46 User Blocker | Update User to Blocked Status | `users` |
| WF-34 Payment Rejection | Load User by Phone | `users` |

**Fix:** Prefix every bare table reference with `chinmay_astro.` — e.g. `FROM users` → `FROM chinmay_astro.users`.

**Note:** WF-22, WF-32, WF-33 active SQL nodes are already correct (`chinmay_astro.users`). The disabled "Update User in DB" node in WF-22 also has a schema prefix issue but is not executed.

---

### TD-002 · WF-33 calls WF-52 to "create" a channel that already exists, then reads `channelId` from WF-52 response instead of DB

**Root cause:** WF-33 (Payment Approval Processor) has a node named **"Call WF-52 Create Channel"** that calls WF-52 and then reads the channel ID from its response:  
```
$('Call WF-52 Create Channel').item.json.channelId
```

**Design violation:** The Slack channel is created by WF-22 at form submission time and `slack_channel_id` is saved to the DB. WF-33 should read `slack_channel_id` directly from its "Load User by Phone" DB query — not call WF-52 again.

**Why it doesn't crash today:** WF-52 is idempotent (detects name-already-taken and returns existing channel ID). But:
1. It makes a redundant Slack API call on every payment approval.
2. If WF-52 fails, the APPROVE notification never posts to the channel.
3. The node name **"Create Channel"** causes Claude to believe WF-33 is responsible for channel creation, leading to incorrect fixes in future sessions.

**Fix:** 
1. Update "Load User by Phone" query in WF-33 to also `SELECT slack_channel_id`.
2. Replace the WF-52 call with a reference to `$('Load User by Phone').item.json.slack_channel_id`.
3. Delete the "Prepare Channel Data" and "Call WF-52 Create Channel" nodes from WF-33.

---

## 🟠 P1 — Functional Gaps (will surface in next few smoke test steps)

### TD-003 · WF-22 "User Already Exists" path calls a non-existent workflow ID

**Finding:** WF-22 has two WF-50 call nodes:
- `Call 'WF-50 Send WhatsApp'` → correct ID `BUVun38WEKb12zg9` ✅
- `Call 'WF-50 Send WhatsApp'1` → **unknown ID `aJoquwuEUbz8bI1B`** ❌

The second node is on the "User Already Exists" branch (form re-submitted by a user who already has a record). Calling a non-existent workflow ID will throw an n8n execution error.

**Fix:** Update the second WF-50 call node's `workflowId` to `BUVun38WEKb12zg9`.

---

### TD-004 · WF-60 (Message Logger) — all core nodes disabled; logging is completely broken

**Finding:** WF-60's entire processing pipeline is disabled:
- `Inbound - Log Message` (postgres) — DISABLED
- `Inbound - Prepare Log Entry` (code) — DISABLED
- `Outbound - Log Message` (postgres) — DISABLED
- `Outbound - Prepare Log Entry` (code) — DISABLED
- `Get User ID` (postgres) — DISABLED
- `Log to Messages Table` (postgres) — DISABLED

WF-50 calls WF-60 on every outbound WhatsApp message. The sub-workflow executes but does nothing — no audit trail is written.

**Impact:** Zero visibility into message history. Debugging any production issue is effectively blind.

**Fix:** Investigate why nodes were disabled (likely during early debugging). Re-enable the nodes and ensure schema prefix is correct (`chinmay_astro.` on all tables — also identified by static analysis as missing, see `Get User ID` node).

---

### TD-005 · WF-11 (Command Parser) — admin confirmations and sub-commands disabled

**Finding:** Many WF-11 nodes are disabled, meaning admin has no feedback after issuing commands:

| Disabled Node | Impact |
|---------------|--------|
| `Confirm Consultation Closure` (Slack) | Admin gets no ack after CLOSE command |
| `Confirm User Blocked` (Slack) | Admin gets no ack after BLOCK command |
| `Unknown Command Response` (Slack) | Typos in commands fail silently |
| `Get Active Users` + `Format List` + `Send List To Admin` | LIST USERS command broken |
| `Get Stats` + `Format Stats` + `Send Stats To Admin` | STATS command broken |

**Fix:** Re-enable all disabled nodes. Also apply `chinmay_astro.` schema prefix to the now-active "Get Active Users" and "Get Stats" nodes (TD-001 covers the SQL fix).

---

### TD-006 · WF-20 registry note is stale — describes a bug that is already fixed

**Finding:** `workflow-registry.md` note #12 says:  
> "WF-20 STOP branch — WRONG (session 4): Current WF-20 built in session 4 placeholder has incorrect STOP handling (sends confirmation but no DB update). Must be fixed to call WF-47 instead."

**Reality:** The WF-20 JSON (`LgIDj1v4ZbCPlX25`) has a node "Call WF-47 Unsubscribe" — the fix was already applied.

**Impact:** Claude reads this note and "fixes" WF-20 unnecessarily, potentially breaking a working workflow.

**Fix:** Update workflow-registry.md — remove/correct note #12, update WF-20's status to 🟢 Active.

---

## 🟡 P2 — Design / Naming Confusion (causes incorrect AI-generated fixes)

### TD-007 · WF-52 call-site node names imply "creator-only" semantics — confuses Claude

**Finding:** Every caller of WF-52 names the node as if WF-52 only creates:
- WF-22: `"Call WF-52 (Create User Channel)"`
- WF-33: `"Call WF-52 Create Channel"`

**Reality:** WF-52 is idempotent — it runs `Get All Private Channels`, checks for name collision, and returns existing channel info if one already exists.

**Problem:** When Claude reads WF-33 and sees "Create Channel", it assumes the channel doesn't exist yet, leading to incorrect reasoning about which workflow is responsible for channel creation vs. lookup.

**Fix:**
1. Rename WF-22's call node to: `"Ensure Slack Channel Exists (WF-52)"`
2. Rename WF-33's call node to: `"Get/Create Slack Channel (WF-52)"` (or better: delete it per TD-002)
3. Add to workflow-registry.md WF-52 entry: **"Idempotent: returns existing channel if `consult-{phone}` already exists. Returns `{ channelId, channelName, isNew }`. Always safe to call multiple times."**

---

### TD-008 · WF-52 input field contract is undocumented; callers use passthrough mapping

**Finding:** WF-33 calls WF-52 with `mappingMode: "passthrough"` — it passes whatever fields are currently in the item. WF-22 does the same. WF-52's "Prepare Channel Name" code node reads from these inputs without any validation.

**Risk:** If two callers pass differently named fields (e.g. `phone_number` vs `phoneNumber`), WF-52 creates a channel with an undefined or malformed name — silently.

**Fix:** Document WF-52's expected input schema in workflow-registry.md:  
```
Required inputs: phoneNumber (string), userName (string)
Optional:        userId (integer)
Output:          { channelId, channelName, isNew }
```
Then audit WF-22 and WF-33 (once TD-002 is resolved) to confirm they both pass `phoneNumber` (camelCase).

---

### TD-009 · WF-60 and WF-20 IDs are swapped in workflow-registry.md

**Finding:**
- `workflow-registry.md` lists WF-60 ID as `LgIDj1v4ZbCPlX25` — this is actually **WF-20 Keyword Handler**
- Actual WF-60 Message Logger ID = `6H75p935FpBVBQtV` (confirmed: WF-50 calls this ID with node "Call WF-60 Message Logger")
- `NEXT_SESSION_HANDOFF.md` does not list WF-20's ID at all

**Impact:** Any session that uses the registry ID for WF-60 will modify the wrong workflow.

**Fix:** Update workflow-registry.md and NEXT_SESSION_HANDOFF.md:
- WF-20 Keyword Handler: `LgIDj1v4ZbCPlX25`
- WF-60 Message Logger: `6H75p935FpBVBQtV`

---

## 🟢 P3 — Feature Gaps

### TD-010 · WF-11 missing UNBLOCK admin command

**Source:** Registry note #15 (session 4).  
Admin cannot unblock a user. Command `UNBLOCK <phone>` needs to be added to WF-11 → sets `status = 'consultation_closed'` for users with `status = 'blocked'`. Must only affect `blocked` users — not `opted_out` (those re-engage themselves).

---

### TD-011 · WF-45 (Rebook Handler) payment wording not updated to standard UPI text

**Source:** Registry note #13 (session 4).  
WF-45 must use: *"Please send ₹500 via GPay / PhonePe / any UPI app to: +91-9653240263 (Chinmay Mujumdar). Once done, tap the button below."*  
Also needs the "Payment Completed" interactive button.

---

### TD-012 · WF-23 registry status shows 🔵 Placeholder but it is built and active

**Source:** Session 6 completed WF-23. Registry was not updated.  
**Fix:** Update WF-23 registry entry to 🟢 Active.

---

## ⚪ P4 — Cleanup

### TD-013 · Three stale/backup workflows polluting the n8n workflow list

| File ID | Name | Action |
|---------|------|--------|
| `z6as85o3b1zK22eF` | WF-30 New User Onboarding (WRONG - DEACTIVATED) | Delete from n8n |
| `fdlIpl67amL2Ho6U` | BACKUP_20260412_WF-25 Post-Consultation Options (SUPERSEDED) | Delete from n8n |
| `yIZwO3CZk6bOBAXl` | BACKUP_20260412_WF-30 New User Onboarding (WRONG) | Delete from n8n |

These are inactive and deactivated but clutter the workflow list and confuse name-based lookups.

---

---

## Design Gaps (from `user_journey_map.html` comparison)

These gaps exist between the journey map specification and the current workflow implementation.

---

### TD-014 · WF-42 (Consultation Closer) references `users` columns that don't exist in schema — CLOSES will fail

**Root cause:** WF-42's "Update User Status" node runs:
```sql
UPDATE chinmay_astro.users 
SET status = 'consultation_closed',
    current_consultation_id = NULL,
    total_consultations = total_consultations + 1
WHERE id = $1
```

`current_consultation_id` and `total_consultations` are **not in the DB schema** (CONTEXT.md documents only: `phone`, `name`, `dob`, `tob`, `birth_place`, `status`, `slack_channel_id`, `awaiting_feedback`).

**Impact:** Every admin CLOSE command will fail at this DB update → consultation can never be marked closed → user stays stuck at `consultation_active` → REBOOK and feedback flows are unreachable.

**Fix options:**
1. Add the two columns to the `users` table: `ALTER TABLE chinmay_astro.users ADD COLUMN current_consultation_id INTEGER, ADD COLUMN total_consultations INTEGER DEFAULT 0;`
2. OR simplify the UPDATE to only set `status = 'consultation_closed'` (drop the two extra column updates, which are nice-to-have analytics anyway)

---

### TD-015 · WF-42 sends a WhatsApp template instead of interactive buttons — post-consultation menu broken

**Root cause:** WF-42's "Prepare Feedback Message" node sends:
```json
{
  "messageType": "template",
  "templateName": "consultation_closed_feedback",
  "templateParams": [user.name]
}
```

**Journey map says:** User should receive interactive buttons: **"Book Another Consultation"** + **"Provide Feedback"** (J-11).

**Two problems:**
1. No interactive buttons → user doesn't know their options; WF-43 (Post-Consultation Handler) only works via free-text fallback.
2. `consultation_closed_feedback` Meta template has **no confirmed approval** anywhere in STATUS.md / registry. If not approved → WF-50 throws Meta API error → CLOSE fails entirely.

**Fix:** Change WF-42 to send a plain-text message listing options (REBOOK / feedback instructions) OR an interactive button message — check whether the 24hr window is open before deciding template vs. free-form.

---

### TD-016 · WF-31 (Payment Submitted Handler) does not relay user messages to admin Slack

**Journey map J-08 says:** "Relay message content to Slack channel as context for admin (informational)"

**Reality:** WF-31 sends an "under review" ack to the user but has no Slack relay step. Admin is blind to any messages a payment_submitted user sends while waiting for approval.

**Fix:** Add a WF-51 call in WF-31 to post the user's message to `slack_channel_id` with a note like "💬 [Awaiting approval] {user}: {message}".

---

### TD-017 · Non-text messages during `consultation_active` are silently dropped at WF-00

**Journey map says:** During consultation_active, images/audio → forward to Slack (`consult-{phone}`) + notify user: "Chinmay can see you sent a file. Text responses only from our side."

**Reality:** WF-00 registry note: "filters non-text (images/audio/reactions → ignore)". All non-text is dropped before routing — regardless of user state.

**Impact:** Images users send during consultation are invisible to Chinmay.

**Fix (post-MVP acceptable):** At WF-00 or WF-01, if message type is image/audio AND user is `consultation_active`, route to WF-40 with a flag, or add a dedicated branch that posts to the user's Slack channel.

---

## Summary Table

| ID | Issue | Priority | Smoke Step Impacted |
|----|-------|----------|---------------------|
| TD-001 | Schema prefix `chinmay_astro.` missing (12 nodes across 8 WFs) | 🔴 P0 | Steps 5–15 |
| TD-002 | WF-33 redundant WF-52 call; reads channelId from WF-52 not DB | 🔴 P0 | Step 7 (APPROVE) |
| TD-014 | WF-42 UPDATE uses non-existent `users` columns → CLOSE fails | 🔴 P0 | Step 9 (CLOSE) |
| TD-003 | WF-22 "User Already Exists" calls unknown WF-50 ID | 🟠 P1 | Step 3 re-test |
| TD-004 | WF-60 all core nodes disabled — logging dead | 🟠 P1 | Every step silently |
| TD-005 | WF-11 admin confirmation + stats nodes disabled | 🟠 P1 | Steps 7, 9, 13 |
| TD-006 | WF-20 registry note says broken but it's already fixed — stale doc | 🟠 P1 | Misleads Claude |
| TD-015 | WF-42 sends unconfirmed Meta template instead of interactive buttons | 🟠 P1 | Step 9 (CLOSE) |
| TD-016 | WF-31 no Slack relay for payment_submitted user messages | 🟠 P1 | Step 6 |
| TD-007 | WF-52 call-site nodes named "Create Channel" — wrong semantics | 🟡 P2 | Misleads Claude |
| TD-008 | WF-52 input contract undocumented; passthrough mapping fragile | 🟡 P2 | Debugging |
| TD-009 | WF-60 / WF-20 IDs swapped in registry | 🟡 P2 | Wrong WF modified |
| TD-017 | Non-text during consultation_active silently dropped (not fwded to Slack) | 🟡 P2 | Post-MVP UX |
| TD-010 | WF-11 missing UNBLOCK command | 🟢 P3 | Step 14 |
| TD-011 | WF-45 Rebook payment wording not updated | 🟢 P3 | Step 12+ |
| TD-012 | WF-23 registry status wrong (Placeholder → Active) | 🟢 P3 | Documentation |
| TD-013 | 3 stale/backup workflows in n8n | ⚪ P4 | None |
