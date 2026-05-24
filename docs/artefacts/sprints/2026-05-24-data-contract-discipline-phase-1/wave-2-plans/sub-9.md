# sub-9 — WF-11 entry guard

**WF:** WF-11 (n8n ID `GoTYo0GS2y8qjjkw`)
**Item:** TD-DCP-061
**n8n change:** Add `Validate Inputs` Code node as first node validating WF-10 Command Envelope (8 commandType enum values — FULL forms per user decision).

## Drift decision

**Decision (2026-05-25):** design.md §2.2 lists abbreviated enum (`CLOSE_CONSULT` / `BLOCK` / `UNBLOCK`) but live WF-10 emits + live WF-11 Switch matches FULL forms (`CLOSE_CONSULTATION` / `BLOCK_USER` / `UNBLOCK_USER`). User chose: **full forms (live) canonical** — followup to update design.md §2.2 to drop shorthand.

## n8n edit plan

```json
{
  "WF-11": {
    "node_additions": [
      {
        "name": "Validate Inputs",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [240, 300],
        "parameters": {
          "jsCode": "const i = $input.first().json;\n\nconst VALID_COMMAND_TYPES = [\n  'APPROVE_PAYMENT',\n  'REJECT_PAYMENT',\n  'CLOSE_CONSULTATION',\n  'BLOCK_USER',\n  'UNBLOCK_USER',\n  'LIST',\n  'STATS',\n  'HELP'\n];\n\n// commandType — required, must be one of 8 enum values\nif (!i.commandType || typeof i.commandType !== 'string') {\n  throw new Error('WF-11 contract: commandType is required (string), got: ' + JSON.stringify(i.commandType));\n}\nif (!VALID_COMMAND_TYPES.includes(i.commandType)) {\n  throw new Error('WF-11 contract: commandType must be one of ' + VALID_COMMAND_TYPES.join('|') + ', got: ' + i.commandType);\n}\n\n// adminUserId — required Slack U-ID string\nif (!i.adminUserId || typeof i.adminUserId !== 'string') {\n  throw new Error('WF-11 contract: adminUserId is required (Slack U-ID string), got: ' + JSON.stringify(i.adminUserId));\n}\n\n// channelId — required Slack C-ID string\nif (!i.channelId || typeof i.channelId !== 'string') {\n  throw new Error('WF-11 contract: channelId is required (Slack C-ID string), got: ' + JSON.stringify(i.channelId));\n}\n\n// channelName — required string\nif (!i.channelName || typeof i.channelName !== 'string') {\n  throw new Error('WF-11 contract: channelName is required (string), got: ' + JSON.stringify(i.channelName));\n}\n\n// messageText — required string\nif (typeof i.messageText !== 'string') {\n  throw new Error('WF-11 contract: messageText is required (string), got: ' + JSON.stringify(i.messageText));\n}\n\n// phoneNumber — required for user-targeted commands, null for admin-wide\nconst userTargeted = ['APPROVE_PAYMENT','REJECT_PAYMENT','CLOSE_CONSULTATION','BLOCK_USER','UNBLOCK_USER'];\nconst adminWide = ['LIST','STATS','HELP'];\nif (userTargeted.includes(i.commandType)) {\n  if (!i.phoneNumber || typeof i.phoneNumber !== 'string') {\n    throw new Error('WF-11 contract: phoneNumber is required (E.164 string) for commandType=' + i.commandType + ', got: ' + JSON.stringify(i.phoneNumber));\n  }\n  // user object required and non-null for user-targeted commands\n  if (!i.user || typeof i.user !== 'object') {\n    throw new Error('WF-11 contract: user object is required for commandType=' + i.commandType + ', got: ' + JSON.stringify(i.user));\n  }\n  if (!i.user.id) {\n    throw new Error('WF-11 contract: user.id is required for commandType=' + i.commandType);\n  }\n  if (!i.user.phone_number || typeof i.user.phone_number !== 'string') {\n    throw new Error('WF-11 contract: user.phone_number is required for commandType=' + i.commandType);\n  }\n  if (!i.user.status || typeof i.user.status !== 'string') {\n    throw new Error('WF-11 contract: user.status is required for commandType=' + i.commandType);\n  }\n}\n\n// reason — optional, must be string if present (default '' per design.md §2.2)\nif (i.reason !== undefined && i.reason !== null && typeof i.reason !== 'string') {\n  throw new Error('WF-11 contract: reason must be a string when present, got: ' + typeof i.reason);\n}\n\nreturn [{ json: i }];"
        }
      }
    ],
    "node_modifications": [],
    "node_removals": [],
    "connection_changes": [
      "Remove: When Executed by Another Workflow --[main#0]--> Switch",
      "Add: When Executed by Another Workflow --[main#0]--> Validate Inputs",
      "Add: Validate Inputs --[main#0]--> Switch"
    ]
  }
}
```

## Pseudo revision — write to `docs/pseudocode/WF-11.pseudo`

```
WF-11 — Command Parser

## Summary

- Inputs: From WF-10 Command Envelope (design.md §2.2): {commandType, phoneNumber, reason, adminUserId, channelId, channelName, messageText, user}
  - `commandType` — enum: APPROVE_PAYMENT | REJECT_PAYMENT | CLOSE_CONSULTATION | BLOCK_USER | UNBLOCK_USER | LIST | STATS | HELP (8 values; required)
  - `phoneNumber` — E.164 string (required for user-targeted commands; null for LIST/STATS/HELP)
  - `reason` — string, default "" (required non-empty only when commandType == 'BLOCK_USER')
  - `adminUserId` — Slack U-ID string (required)
  - `channelId` — Slack C-ID string (required)
  - `channelName` — string (required)
  - `messageText` — string (required; audit/debug)
  - `user` — {id, name, phone_number, status, slack_channel_id} or null (required object for user-targeted commands; null for LIST/STATS/HELP)
- Outputs: Dispatches to a specific command-handler sub-workflow, or queries/posts directly to Slack for LIST/STATS/HELP/UNBLOCK/Unknown
- State Transitions: UNBLOCK_USER path: users.status: blocked → consultation_closed (and inserts admin_actions row). Other state changes happen inside the sub-workflows called.
- Calls Sub-Workflows: WF-33 (Payment Approval), WF-34 (Payment Rejection), WF-42 (Consultation Closer), WF-46 (User Blocker)
- **Trust-mode input (SP-03):** Input is fully classified and pre-validated by WF-10's centralized gate — user exists, phone-in-command matches channel-derived phone, and state matches the command's expected state. WF-11 does NOT re-parse messageText and does NOT re-validate. `commandType` is supplied by WF-10 in canonical form (APPROVE_PAYMENT | REJECT_PAYMENT | CLOSE_CONSULTATION | BLOCK_USER | UNBLOCK_USER | LIST | STATS | HELP); `phoneNumber` is the validated typed phone (null for LIST/STATS/HELP); `reason` is the optional BLOCK reason string (empty otherwise). The historical inline UNBLOCK `Blocked User Found?` IF + `No Blocked User Found` admin-feedback branch are removed because they are guaranteed unreachable post-gate. WF-11's internal `Lookup Blocked User` SELECT is retained only to fetch the user record (id, name) needed for the UNBLOCK UPDATE+INSERT and confirmation message.
- **Entry guard (data-contract-discipline Phase 1 — design.md §2.8):** `Validate Inputs` Code node as first node validates the WF-10 Command Envelope on every invocation. Throws a descriptive Error on missing/wrong-type required fields; passes through on success.

---

## Algorithm

Step 1: Validate Inputs (Code node — entry guard per design.md §2.8). Validate the WF-10 Command Envelope:
  - `commandType` is required, must be one of the 8 enum values: APPROVE_PAYMENT | REJECT_PAYMENT | CLOSE_CONSULTATION | BLOCK_USER | UNBLOCK_USER | LIST | STATS | HELP. Throw descriptive Error if missing or not in enum.
  - `adminUserId` is required string. Throw if missing.
  - `channelId` is required string. Throw if missing.
  - `channelName` is required string. Throw if missing.
  - `messageText` is required string. Throw if missing.
  - For user-targeted commandTypes (APPROVE_PAYMENT, REJECT_PAYMENT, CLOSE_CONSULTATION, BLOCK_USER, UNBLOCK_USER): `phoneNumber` is required non-empty string; `user` is required object with non-null `id`, `phone_number`, and `status`. Throw if any missing.
  - For admin-wide commandTypes (LIST, STATS, HELP): `phoneNumber` is expected null; `user` is expected null. (Tolerate; do not hard-fail on null — WF-10 guarantees nulls here.)
  - `reason` is optional; if present, must be string. Throw if wrong type.
  - Pass through unchanged on success: return [{ json: i }].
Step 2: Start — triggered by WF-10 with the fully classified admin command payload. Input arrives pre-validated.
Step 3: Switch on commandType:
  - 'APPROVE_PAYMENT' → go to Step 4.
  - 'REJECT_PAYMENT' → go to Step 5.
  - 'CLOSE_CONSULTATION' → go to Step 6.
  - 'BLOCK_USER' → go to Step 8.
  - 'LIST' → go to Step 10.
  - 'STATS' → go to Step 12.
  - 'HELP' → go to Step 14.
  - 'UNBLOCK_USER' → go to Step 16.
  - fallback / 'UNKNOWN' → go to Step 21.
Step 4: Call WF-33 (Payment Approval Processor) passing through the parsed command. End.
Step 5: Call WF-34 (Payment Rejection Processor) passing through the parsed command. End.
Step 6: Call WF-42 (Consultation Closer) passing through the parsed command. End. (Single-owner principle: WF-42 owns the post-close Slack confirmation — richer text including customer name + WA feedback context. WF-11 used to post a phone-only duplicate; removed 2026-05-23 BUG-05 fix.)
Step 7: (deleted — WF-42 owns the post-close Slack confirmation; see Step 6 note.)
Step 8: Call WF-46 (User Blocker) passing through the parsed command. End. (Single-owner principle: WF-46 owns the post-block Slack confirmation — text includes customer name + reason + status. WF-11 used to post a phone+reason duplicate; removed 2026-05-23 BUG-05 sibling fix.)
Step 9: (deleted — WF-46 owns the post-block Slack confirmation; see Step 8 note.)
Step 10: SELECT u.id, u.name, u.phone_number, u.status, c.id, c.started_at, EXTRACT(EPOCH FROM (NOW() - c.started_at))/3600 AS hours_active FROM chinmay_astro.users u LEFT JOIN chinmay_astro.consultations c ON u.id=c.user_id AND c.status='active' WHERE u.status IN ('payment_submitted','consultation_active') ORDER BY u.status DESC, c.started_at DESC.
Step 11: Format the list into a Slack mrkdwn message (Pending Payment Verifications + Active Consultations). Post to Slack channel (channelName). End.
Step 12: SELECT counts from chinmay_astro tables: total_users, active_consultations, pending_payments (status='pending_verification'), completed_today, revenue_today (sum of approved payment amounts dated today), blocked_users.
Step 13: Format stats message and post to Slack channel (channelName). End.
Step 14: Build HELP text (list of all available commands and examples).
Step 15: Post HELP text to Slack channel (channelName). End.
Step 16: SELECT id, name, phone_number, status FROM chinmay_astro.users WHERE phone_number = $phoneNumber AND status = 'blocked' LIMIT 1. (Pre-validated upstream — row is guaranteed to exist; fetched solely for downstream id/name use.)
Step 17: (removed — old `Blocked User Found?` IF; pre-validated by WF-10.)
Step 18: UPDATE chinmay_astro.users SET status='consultation_closed', updated_at=NOW() WHERE phone_number=$phoneNumber; INSERT INTO chinmay_astro.admin_actions (user_id, action_type, notes, created_at) VALUES (<id from lookup>, 'unblocked', 'Admin UNBLOCK command', NOW()). (admin_actions table is deprecated per [[project_admin_actions_deprecated]] — INSERT remains in live code as a no-op write to be cleaned in TD-NEW-026.)
Step 19: Post to input channelId: "✅ User <name> (<phoneNumber>) has been unblocked. Status is now consultation_closed. They can REBOOK when ready." End.
Step 20: (removed — old `No Blocked User Found` admin feedback; pre-validated by WF-10.)
Step 21: Post to Slack channel (channelName): "❓ Unknown command: `<messageText>` Type `HELP` to see available commands." End. (Defensive fallback — should be unreachable post-WF-10-gate; retained as safety net.)
```

## Drift findings

- design.md §2.2 enum shorthand vs live full forms — **decision: live canonical**, log followup to update design.md.
