# Smoke Test — Post P0 Coverage Review

**Type:** smoke
**Slug:** post-p0-review
**Date:** 2026-05-17
**Operator:** prasadmujumdar
**Test phone (wa_id):** 61466927921

## Scope

End-to-end verification of the user journey after the P0 Coverage Sprint (Batch 1–7) is complete. All 14 touched workflows are now ahead-of-pseudocode and have re-verified PASS status (35 PASS / 0 WARN / 0 FAIL per the P0 re-verification table the user provided).

## Design / expected-behavior references

- `docs/superpowers/FunctionalTestCases.md` — primary expected-behavior reference
- `docs/CONTEXT.md` + `docs/workflow-registry.md` — architecture, WF status
- `docs/superpowers/reports/P0_Coverage_Report_2026-05-17.md` — what changed in Batches 1–7 (loaded into context)

## Watch surface

- **n8n executions:** all active workflows (cursor-based since last exec ID)
- **Postgres tables:** `chinmay_astro.{users,pending_users,messages,admin_actions,consultations,payments}`
- **Slack channels (direct MCP read):** `C0AH2G4UMV1` (all-chinmay-astro-admin) — bot is a member
- **Slack channels (indirect via WF-51 exec data):** `C0A5B0ZE81E` (chinmay-admin-commands) — MCP bot is not a member of the private channel; admin posts will be observed by reading WF-51 execution payloads (carries `channelId` + `messageText`)
- **Latency threshold:** 5000 ms

## Pre-test state cleanup

Wiped at 09:30 UTC. `DELETE FROM chinmay_astro.users WHERE phone_number='61466927921'` cascaded to consultations/messages/payments; `pending_users` cleaned separately (no FK). The Slack consultation channel `C0B3SA9JALX` (consult-61466927921 from prior testing) was archived manually by the operator.

Cascade discovery from this cleanup was added to `CLAUDE.md` (Postgres section) for future reference.

## Baselines (refreshed 2026-05-17 11:07:50 UTC after Slack token rotation + Claude Code restart)

| Surface | Value |
|---|---|
| n8n last execution ID | 1124 |
| UTC time cursor | 2026-05-17T11:07:50Z |
| Slack `C0A5B0ZE81E` cursor (chinmay-admin-commands) | 1779015356.499189 |
| Slack `C0AH2G4UMV1` cursor (all-chinmay-astro-admin) | 1779010283.141909 |
| `chinmay_astro.users` count | 0 |
| `chinmay_astro.pending_users` count | 0 (the orphan row for another phone was also cleaned by user) |
| `chinmay_astro.messages` count | 0 |
| `chinmay_astro.admin_actions` count | 0 |
| `chinmay_astro.consultations` count | 0 |
| `chinmay_astro.payments` count | 0 |

## Slack credential rotation (2026-05-17 mid-setup)

The Slack app was re-authorized during setup (operator regenerated the Bot User OAuth Token). Old token returned `account_inactive`. Updated:
- `n8n` credential `WSds5JWe5b6N7myY` (operator did this manually via n8n UI)
- `~/.claude.json` MCP Slack server `SLACK_BOT_TOKEN` (claude updated)
- Claude Code restarted to reload MCP env

New token verified against `auth.test` (bot_id=B0A4L5YKYVA, team=Chinmay Astro Admin, team_id=T0A4EJZ9SJJ). Both watched channels read successfully via the new token.

Note: the Slack/postgres/n8n MCP servers did not reconnect after restart this session — they appear as "still connecting" in the deferred-tool list. **All operations are running via direct API access (curl for n8n + Slack, SSH+docker exec psql for Postgres).** Functionally identical to MCP for our purposes.

## Setup-time observations (see followups-monitoring-setup.md)

- CLAUDE.md `data_table_user_gZCekRseitJEAX1g` reference was stale (table doesn't exist) — corrected to `chinmay_astro.users`. Added cascade-behavior section.
- Channel ID `C0A5B0ZE81E` (`chinmay-admin-commands`) was recovered by operator from Slack archived/hidden state; n8n workflows wire to this ID correctly. No workflow JSON edits needed.
- Slack MCP bot is added to `all-chinmay-astro-admin` (public) but not to `chinmay-admin-commands` (private) — direct read of admin-commands history is unavailable; observed indirectly via WF-51 execs for this session.
- WF-11 had a Postgres parameter-binding error on 2026-05-16T22:43:41 (`there is no parameter $1` in "Load User by Phone" before "Call WF-46 User Blocker"). Unrelated to today's smoke test but logged as a pre-existing bug.

---

## Test actions and observations

(populated turn-by-turn during the session)

---

## Session summary (added at compact-time)

What started as a TC-0101 smoke test surfaced two regressions from the P0 sprint, both repaired in this session.

**Findings:**
1. The P0 sprint's `__rl → plain string` normalization (driven by `build-workflow` Step 5e.1 + `post-workflow-lint.sh`) is INVERTED for n8n 2.1.4. The runtime requires `__rl` object format for executeWorkflow nodes at `typeVersion ≥ 1.2`. 47 nodes across 14 workflows were affected. Symptom: "No information about the workflow to execute found."
2. The P0 sprint's WF-00 → WF-60 inbound logging addition (Theme 4) was wired inline (`Gather → WF-60 → WF-01`) instead of as the side-branch the pseudocode specified (`Gather ─┬→ WF-60 fire-and-forget; └→ WF-01`). WF-01 received WF-60's `{logged: true}` output instead of the parsed message, so `Layer 1: Country Filter` crashed on `phone.startsWith` (phone undefined).

**Fixes applied (all live in n8n + exported + committed):**
- All 47 executeWorkflow nodes restored to canonical 2.1.4 shape: `tv=1.2 + source="database" + operation="call_workflow" + mode="once" + workflowId={__rl,value,mode:"list",cachedResultUrl} + workflowInputs={mappingMode:"passthrough",...}`.
- WF-00 wiring corrected to parallel branches matching pseudocode Step 8a/9.
- Test phone `61466927921` clean-slate wipe DELETE confirmed `users` CASCADE clears consultations/messages/payments but NOT pending_users (no FK) — captured in CLAUDE.md.
- CLAUDE.md Postgres section corrected (stale `data_table_user_gZCekRseitJEAX1g` reference removed; cascade behavior documented).
- FunctionalTestCases.md TC-0101 + TC-0108 amended (WF-01 `Layer 1: Country Filter` allows `['91','61']` — India + Australia).
- Slack credential rotation mid-session: n8n credential `WSds5JWe5b6N7myY` updated by operator; `~/.claude.json` MCP `SLACK_BOT_TOKEN` updated by claude; Claude Code restarted to reload MCP env.

**Happy path verified end-to-end:** WhatsApp "Hi" → WF-00 (webhook) → WF-60 (log, side branch) → WF-01 (country filter passes for +61) → WF-02 (router) → WF-21 (welcome+form) → WF-50 (send to WhatsApp). Form landed on operator's phone.

---

## Plugin improvement candidates (to be flushed via flush-plugin-improvements)

1. **`build-workflow` Step 5e.1 lint debt rollers — the `__rl → plain string` roller is wrong direction for n8n 2.1.4.** For tv ≥ 1.2, the runtime REQUIRES `__rl` object format on `executeWorkflow.parameters.workflowId`. The lint hook's preference for plain string actively breaks workflows. Fix: invert the roller — for tv ≥ 1.2 ensure `__rl` object; for tv < 1.2 plain string OK; OR (better) accept both forms based on tv. Also update `post-workflow-lint.sh` to match.

2. **`build-workflow` Step 5 "Known n8n API quirks" table — executeWorkflow node row understates required fields.** Current: "must include typeVersion, parameters.mode, parameters.workflowId". Actual canonical 1.2 shape requires ALL of: `typeVersion: 1.2+`, `parameters.source: "database"|"parameter"`, `parameters.operation: "call_workflow"`, `parameters.mode: "once"|"each"`, `parameters.workflowId: {__rl:true, value:<id>, mode:"list"|"id", cachedResultUrl:<path>}`, `parameters.workflowInputs: {mappingMode:"passthrough"|..., value, matchingColumns, schema, attemptToConvertTypes, convertFieldsToString}`, `parameters.options: {}`. Document the full shape. Missing any of `source`, `operation`, `mode` causes "No information about the workflow to execute found" at runtime.

3. **`build-workflow` — new section: Pseudocode → JSON conversion guidance.** Since build-workflow is "always based on pseudocode" going forward (operator's words), the skill needs explicit rules for the pseudocode → JSON conversion step:
   - **Side branch vs series cues.** Pseudocode phrases that mean "side branch / parallel, NOT chain in series": `MUST NOT block routing`, `fire-and-forget`, `audit-only logging`, `wrap in onError='continueRegularOutput'`, two consecutive steps both consuming "the same input" / "the parsed payload". Wire as parallel branch from upstream source. NEVER chain in series unless data flow explicitly says "with the result of X" / "using N's output".
   - **Input contract preservation.** When a sub-workflow's pseudocode states an input contract (e.g., "WF-01 receives the parsed message payload"), the caller MUST pass that exact contract. If the caller's upstream node is not the data source for that contract, wire the data source directly to the call — even if it means a parallel branch.
   - **executeWorkflow node creation checklist.** Always set the full canonical shape (see point #2 above) — not minimal. Defaults aren't safe.
   - **Use Step 5e regenerate-by-copy when introducing new executeWorkflow nodes**, so the full shape lands atomically with the new node + connections + any related onError settings.

---

## Test actions and observations

### Action — 2026-05-17 11:11 UTC — TC-0101 first message from new user

**From:** `61466927921`
**Message:** `"Hi"`
**Expected:**
- WF-00 receives webhook → dedupes → routes to WF-01
- WF-01 country check (+91… but this is +61 Australian; note divergence from TC-0101 "+91 passes" — user is in AU but DB has no `country_code` block in code per design)
- WF-01 finds no user record → routes to WF-21
- WF-21 sends combined welcome (policy URL + ₹500 fee + WhatsApp Flow form, Flow ID `1408011897720771`)
- **No `chinmay_astro.users` row created**
- **`chinmay_astro.pending_users` row IS inserted** (pre-onboarding record by WF-21; per project DR exception — see auto-memory `project_design_rule_pending_users.md`. CLAUDE.md Design Rule #1 wording "no DB write before form submission" is imprecise — pending_users insert is intentional.)
- User receives welcome message on WhatsApp within a few seconds

