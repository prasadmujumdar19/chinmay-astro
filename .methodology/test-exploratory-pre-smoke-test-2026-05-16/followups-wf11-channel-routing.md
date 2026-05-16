# Follow-ups — WF-11 Slack channel routing (2026-05-16)

Side-finding from CLOSE smoke test. Happy path (CLOSE / APPROVE / BLOCK) works, but several WF-11 Slack-post nodes route to the wrong channel — either hardcoded to `chinmay-admin-commands` (C0A5B0ZE81E) when they should reply in the originating channel, or relying on inconsistent field references.

**Severity:** 🟡 major (UX correctness, not data integrity). Commands work; admin sees responses in the wrong place.

Per `CLAUDE.md`: *"Admin sends `APPROVE PAYMENT <phone>` in the user's consult channel. Not in chinmay-admin-commands. WF-10 captures all workspace events so commands work from any channel."* — every WF-11 Slack response should land in the channel the command was issued from.

---

## State of every Slack-post node in WF-11 (`GoTYo0GS2y8qjjkw`)

| Node | Channel target | Mode | Verdict |
|---|---|---|---|
| `Confirm Consultation Closure` | `={{ $('Parse Command').item.json.channelId }}` | `name` | ⚠ ID stored, mode says name — fragile; n8n may auto-resolve. Functionally works. |
| `Confirm User Blocked` | `={{ $('Parse Command').item.json.channelId }}` | `name` | ⚠ same as above |
| `Send List To Admin` | `C0A5B0ZE81E` (hardcoded) | `list` | ❌ wrong if LIST issued from a consult channel |
| `Send Stats To Admin` | `C0A5B0ZE81E` (hardcoded) | `list` | ❌ wrong if STATS issued from a consult channel — also a possible **dead node** (see Switch routing) |
| `Send Stats To Admin1` | `={{ $json.channelName }}` | `name` | ✅ Note: this is actually the **HELP responder** — misleadingly named. See bug below. |
| `Unknown Command Response` | `={{ $json.channelName }}` | `name` | ✅ Fixed by operator this session |
| `Confirm User Unblocked` | `C0A5B0ZE81E` (hardcoded) | `list` | ❌ wrong if UNBLOCK issued from a consult channel |
| `No Blocked User Found` | `C0A5B0ZE81E` (hardcoded) | `list` | ❌ wrong if UNBLOCK issued from a consult channel |

## Root cause for "HELP keeps reverting / failing"

The HELP responder node is misnamed: `Prepare HELP Text → Send Stats To Admin1`. Two issues conflate:

1. **Misleading name:** Editing "Send Stats To Admin1" feels wrong when you're trying to fix HELP — you may have been editing a different `Send Stats To Admin` (the actual stats one) and not realizing it doesn't connect to HELP. That explains the "workflow reverts to its original state" feeling — saves go to the wrong node.
2. **`channelName` field source:** `Prepare HELP Text` reads `$input.first().json.channelName`. If `Parse Command` (or the Switch in between) doesn't pass `channelName` through, `Send Stats To Admin1` gets `channel = undefined` and the Slack post fails (or returns 400, marking the exec error).

**Recommended fix (post-smoke):**

1. **Rename `Send Stats To Admin1` → `Send HELP Response`**. Disambiguates the editor and stops the wrong-node-save loop.
2. **Verify `Parse Command` output includes `channelName`** (or `channelId`) as a top-level field that survives the Switch node. If not, add to its Code body:
   ```js
   return [{json: {...$input.first().json, channelName: $input.first().json.channel?.name, channelId: $input.first().json.channel?.id}}];
   ```
3. **Pick one canonical channel reference and use it everywhere.** Recommend `channelId` (Slack IDs are stable; names can be renamed). Then every Slack-post node uses:
   - `select: "channel"`, `channelId: { __rl: true, value: "={{ $('Parse Command').item.json.channelId }}", mode: "id" }`
4. **Replace the four hardcoded `C0A5B0ZE81E` references** in `Send List To Admin`, `Send Stats To Admin`, `Confirm User Unblocked`, `No Blocked User Found` with the same originating-channel pattern.
5. **Optional cleanup:** if `Send Stats To Admin` is truly the stats responder and `Send Stats To Admin1` is HELP, there are two nodes named almost identically — easy to grab the wrong one. Rename or delete the unused one.

## "Workflow reverts to original state" symptom — separate diagnostic

If after fix #1+#2 above you still see saves not sticking, it's not a code issue — it's an n8n editor behavior. Things to check:

- After clicking **Save**, did you also **Publish/Activate**? n8n separates these.
- Are you editing the workflow at `https://chinmayastro-n8n.friendlydealfinder.com.au/workflow/GoTYo0GS2y8qjjkw` directly (live) or a different version? Look at the URL — no `version` query param = the live published workflow.
- Browser tab may have stale state. After save, hard refresh (Cmd-Shift-R) and re-open the node.
- If running with `N8N_DISABLE_WORKFLOW_LOCK=false`, two browser tabs editing the same workflow can clobber each other.

## Status

| ID | Severity | Blocks smoke? | Status |
|---|---|---|---|
| FU-WF11-01 | major (UX) | No — happy paths work | Open |
| FU-WF11-02 (rename `Send Stats To Admin1` → `Send HELP Response`) | minor | No | Open |
| FU-WF11-03 (4 hardcoded admin-channel refs) | major | No (unless LIST/STATS/UNBLOCK used outside admin channel during smoke) | Open |
| FU-WF11-04 (revert-on-save diagnostic) | unknown | No | Investigate next session |
