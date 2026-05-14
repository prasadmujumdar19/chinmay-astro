# Functional Code Review — Master Tracker

**Status:** 🟢 Complete
**Started:** 2026-05-14
**Completed:** 2026-05-14
**Owner:** Claude (self-driven, resumable)
**Project:** Chinmay Astro WhatsApp Vedic astrology consultation service

---

## ⚡ Resume Instructions (READ THIS FIRST IF YOU ARE A FRESH CLAUDE SESSION)

If you are reading this file on a fresh session with no prior context, your job is to **continue this Functional Code Review work to completion** without asking the user to re-explain anything.

**Steps to resume:**

1. **Verify environment.** Confirm the SSH tunnel to the n8n VPS is open:
   ```bash
   curl -s --max-time 3 -o /dev/null -w "%{http_code}\n" http://localhost:5678/
   ```
   Expect `200`. If it returns connection refused or empty, ask the user to open the tunnel:
   ```
   ssh -L 5678:localhost:5678 -L 5050:localhost:5050 -L 5432:localhost:5432 root@45.79.125.184
   ```

2. **Read the Current Phase Pointer** (section near bottom of this file). It tells you which domain is in progress and what the next action is.

3. **Read the Activity Log** (very bottom) to see what was completed in previous sessions.

4. **Look at domain result files** that already exist:
   - `docs/superpowers/FunctionalCodeReview_D1_onboarding.md`
   - `docs/superpowers/FunctionalCodeReview_D2_payment_admin.md`
   - `docs/superpowers/FunctionalCodeReview_D3_relay_postconsult.md`
   - `docs/superpowers/FunctionalCodeReview_D4_keywords_edge_intent.md`
   A domain is **done** when its result file exists with all its TCs filled in and the Status Grid below shows ✅ for every TC in that domain.

5. **Continue from the next pending domain.** Dispatch one Explore subagent for that domain using the **Subagent Prompt Template** (section below). After it returns:
   - Update the Status Grid (TC rows in that domain → ✅ or ⚠️ or ❓)
   - Append a one-line entry to the Activity Log
   - Update the Current Phase Pointer to the next domain
   - **Compact context** before launching the next subagent (instruct the user with `/compact` if main context is >60%)

6. **When all 4 domains are ✅ done**, generate the final deliverable:
   `docs/superpowers/FunctionalCodeReview_2026-05-14.html` (see **Final HTML Assembly** section).

**Do NOT re-ask the user for objectives, scope, methodology, or constraints — everything is in this file.**

---

## 1. Problem Statement (Original Request)

We have completed the initial MVP release of Chinmay Astro — a WhatsApp-based Vedic astrology consultation service. Before real-world testing with actual users, we need a thorough **code-level review** of all n8n workflows against the documented user journey map and functional test cases.

The review must:
- Trace each test case end-to-end through n8n workflows (webhook → routing → sub-workflows → DB → external APIs → response)
- Compare intended behavior (per `user_journey_map.html` and `FunctionalTestCases.md`) against actual code behavior
- Cite gaps with specific workflow/node/line references — no hallucination
- Produce an interactive HTML deliverable with executive summary

**Key assumption:** All tech debts marked `status: done` in `.methodology/sprint-tech-debts-state.md` are already applied in the live n8n instance. Evaluate against the **current live state**, not against committed `workflows/*.json` (which is stale — Batch 3 changes live in n8n only).

## 2. Scope

**Include:** P0 + P1 test cases from TC-01xx through TC-08xx in `docs/superpowers/FunctionalTestCases.md`.

**Exclude:**
- All P2, P3, P4 cases
- TC-09xx (background jobs — deferred post-go-live)
- Anything marked DEFERRED in `docs/superpowers/FunctionalTestReport.md`

**Total in scope: 31 test cases (12 P0 + 19 P1).** See Status Grid (section 6).

## 3. Hard Constraints

| # | Constraint |
|---|------------|
| 0 | **TRUST CODE, NOT DOCS.** The only authoritative sources are: (a) live n8n workflow JSONs fetched fresh from the API this session, and (b) the live Postgres schema (`information_schema.columns` via `mcp__postgres__query`). All Markdown/HTML docs — including `CONTEXT.md`, `workflow-registry.md`, `FunctionalTestReport.md`, the journey map, and even `CLAUDE.md` — are **starting hypotheses only**. Use them to know *what to look for*, never to assert *what is true*. If a doc says "Table X has column Y" and the live DB disagrees, the DB wins. If a doc says "WF-22 calls WF-52" and the live JSON shows no such call, the JSON wins. Flag every doc/code disagreement you encounter as a finding. |
| 1 | **No hallucination.** If code is ambiguous, write `[UNCERTAIN]` and move on. Never invent workflow logic. |
| 2 | **Code-based citations only.** Every "actual behavior" claim must reference a specific node, SQL query, or JSON field. |
| 3 | **Full trace required.** When a sub-workflow is called, export it and trace into it — don't accept "it calls WF-XX which does Y" without verifying. |
| 4 | **External APIs are out of scope.** Assume Meta WA, Slack, and Gemini deliver/respond correctly. Only evaluate n8n logic. |
| 5 | **Disabled nodes:** treat as inactive. If a disabled node is on the critical path, flag `[DISABLED NODE ON CRITICAL PATH]`. Otherwise note and proceed. |
| 6 | **Live n8n wins over `workflows/*.json` on disk.** Always re-export via MCP / API. |
| 7 | **Token discipline.** Never load full workflow JSONs into main context. Export to `/tmp/claude-scratch/wf-cache/<id>.json` and use `grep`/`jq` for surgical reads. |
| 8 | **Database start state:** zero user records. Each scenario assumes a blank slate; the workflows themselves create rows as they execute. |
| 9 | **Webhook payloads:** assume Meta and Slack deliver the exact structure the workflows already expect. |
| 10 | **No actual execution.** This is pure static code inspection. Do not trigger workflows, send WhatsApp messages, or write to the DB. |

## 4. Methodology — Per Test Case

For every TC in scope, the executing subagent must produce a row with these fields. Do not skip fields. If a field cannot be determined, write `[UNCERTAIN — <reason>]`.

| Field | Description |
|-------|-------------|
| **TC ID** | e.g., TC-0101 |
| **Priority** | 🔴 P0 / 🟠 P1 |
| **Scenario** | 1-sentence summary of trigger + context |
| **Journey** | Matching J-xx from `docs/reference/user_journey_map.html` |
| **Intended Behavior** | 2–3 lines from the TC's Given/When/Then |
| **Code Path** | Workflow chain, e.g., `WF-00 → WF-01 → WF-02 → WF-25 → WF-50` |
| **Actual Behavior** | 2–3 lines describing what the code will actually do, derived only from inspected workflow nodes |
| **DB Interactions** | Each SQL operation: `INSERT/UPDATE/SELECT/DELETE <table>` with the columns/condition |
| **External Calls** | Meta send / Slack post / Gemini classify (and which node issues the call) |
| **Gap / Issue** | `✅ No gap` OR a precise gap citation in this format: `[WF-XX node "Node Name"] Expected: X. Actual per code: Y. Reason: ...` |
| **Remarks** | `[DISABLED NODE ON CRITICAL PATH]`, `[UNCERTAIN — verify in n8n UI]`, links to related TDs, etc. |

### Tracing procedure (per TC)

1. Read the TC's Given/When/Then in `docs/superpowers/FunctionalTestCases.md`.
2. Identify the entry workflow (WF-00 for WhatsApp inbound, WF-10 for Slack events).
3. Export that workflow to cache if not already cached:
   ```bash
   API_KEY=$(grep '^N8N_API_KEY=' .env | cut -d= -f2-)
   mkdir -p /tmp/claude-scratch/wf-cache
   curl -s -H "X-N8N-API-KEY: $API_KEY" "http://localhost:5678/api/v1/workflows/<ID>" \
     > /tmp/claude-scratch/wf-cache/<ID>.json
   ```
   (Workflow IDs are in `docs/workflow-registry.md` and section 7 below.)
4. **Never `cat` the JSON.** Use `jq` to extract nodes/connections surgically:
   ```bash
   jq -r '.nodes[] | select(.name=="<Node Name>") | {name, type, parameters}' /tmp/claude-scratch/wf-cache/<ID>.json
   jq -r '.connections | to_entries[] | "\(.key) -> \(.value.main[0][].node // "")"' /tmp/claude-scratch/wf-cache/<ID>.json
   ```
5. Identify routing logic (Switch/IF nodes) and which branch matches the TC's state preconditions.
6. Follow the matched branch. If it calls a sub-workflow (`executeWorkflow` node), export that sub-workflow and recurse.
7. At each DB node (`postgres`/`postgresTool` type), extract the SQL and the affected columns.
8. At each HTTP/Slack/WA Meta node, record the endpoint and payload structure.
9. Stop when the path terminates (responds, ends, or loops back to webhook).
10. Compare to TC's expected outcome — record gap or ✅.

### What counts as a gap

- Wrong table/column written
- Missing SELECT before write (TOCTOU-style race not in scope, but missing necessary read is)
- Wrong routing branch taken for the given state
- Missing intent classifier call where the journey requires it
- Wrong WA message template or missing message
- Slack channel created in wrong workflow or at wrong time
- Disabled node on critical path
- Missing keyword interception (STOP/HELP/REBOOK before LLM)
- Missing dedup / bot-loop / non-text guard
- Schema-prefix bug or hardcoded ID where env var is expected
- Any deviation from the design rules in `CLAUDE.md` section "Design Rules — Do Not Deviate"

## 5. Domain Plan (Sequential, One Subagent per Domain)

The 31 TCs are split into 4 domains. Each domain is handled by one `Explore` subagent. Domains run **sequentially**, with a `/compact` between each to keep main context lean.

| Domain | TCs | Count | Result File |
|--------|-----|-------|-------------|
| **D1 Onboarding** | TC-0101, TC-0102, TC-0104, TC-0105, TC-0107, TC-0108 | 6 | `FunctionalCodeReview_D1_onboarding.md` |
| **D2 Payment + Admin** | TC-0201, TC-0202, TC-0205, TC-0301, TC-0302, TC-0303, TC-0304, TC-0305, TC-0306, TC-0311, TC-0312, TC-0313, TC-0315 | 13 | `FunctionalCodeReview_D2_payment_admin.md` |
| **D3 Relay + Post-Consult** | TC-0401, TC-0403, TC-0504, TC-0505 | 4 | `FunctionalCodeReview_D3_relay_postconsult.md` |
| **D4 Keywords + Edge + Intent** | TC-0604, TC-0605, TC-0606, TC-0607, TC-0702, TC-0703, TC-0704, TC-0802 | 8 | `FunctionalCodeReview_D4_keywords_edge_intent.md` |

Domain result file format: a Markdown file with one section per TC, fields as defined in section 4. The HTML assembly step (section 9) consumes these.

## 6. Status Grid

Legend: ⬜ pending · 🟡 in progress · ✅ done (✅ no gap) · ⚠️ done with gap · ❓ done but uncertain · 🚫 deferred / blocked


## 6. Status Grid

Legend: ⬜ pending · 🟡 in progress · ✅ done (✅ no gap) · ⚠️ done with gap · ❓ done but uncertain · 🚫 deferred / blocked

### D1 Onboarding
| TC | Priority | Title | Status | Gap? |
|----|----------|-------|--------|------|
| TC-0101 | 🔴 P0 | First message from brand-new user (text) | ✅ | ✅ No gap |
| TC-0102 | 🟠 P1 | First message — image/audio | ⚠️ | ⚠️ Deflection message missing |
| TC-0104 | 🔴 P0 | User submits WhatsApp Flow form | ✅ | ✅ No gap |
| TC-0105 | 🟠 P1 | User re-submits form when payment_pending | ✅ | ✅ No gap |
| TC-0107 | 🟠 P1 | Pre-form free-form — malicious/abusive intent | ⚠️ | ⚠️ Malicious intent routing missing |
| TC-0108 | 🟠 P1 | First message from non-India number | ✅ | ✅ No gap |

### D2 Payment + Admin
| TC | Priority | Title | Status | Gap? |
|----|----------|-------|--------|------|
| TC-0201 | 🔴 P0 | User taps "Payment Completed" | ✅ | No gap |  |
| TC-0202 | 🟠 P1 | Duplicate "Payment Completed" tap | ✅ | No gap |  |
| TC-0205 | 🟠 P1 | payment_submitted free-form message | ⚠️ | Malicious intent routes to WF-47 (unsubscribe) not WF-46 (block) |  |
| TC-0301 | 🔴 P0 | Admin approves payment — happy path | ✅ | No gap |  |
| TC-0302 | 🟠 P1 | Admin approves — wrong phone number | ✅ | No gap |  |
| TC-0303 | 🟠 P1 | Admin APPROVE on already consultation_active | ✅ | No gap |  |
| TC-0304 | 🔴 P0 | Admin rejects payment | ⚠️ | WF-34 missing UPDATE users.status; user remains payment_submitted after reject |  |
| TC-0305 | 🔴 P0 | Admin closes consultation | ⚠️ | WF-42 missing WF-52 call; Slack channel not archived |  |
| TC-0306 | 🟠 P1 | Admin blocks a user | ⚠️ | WF-46 missing WF-52 call when blocking consultation_active user |  |
| TC-0311 | 🔴 P0 | Admin plain text in consult channel (relay) | ✅ | No gap |  |
| TC-0312 | 🟠 P1 | Admin plain text when user NOT consultation_active | ⚠️ | WF-41 no status guard; relays to non-active users |  |
| TC-0313 | 🟠 P1 | Admin plain text in chinmay-admin-commands | ⚠️ | WF-41 no null guard; relays from admin command channel |  |
| TC-0315 | 🔴 P0 | Bot-loop prevention in Slack relay | ✅ | No gap |  |

### D3 Relay + Post-Consult
| TC | Priority | Title | Status | Gap? |
|----|----------|-------|--------|------|
| TC-0401 | 🔴 P0 | consultation_active user text → Slack relay | ⬜ | — |
| TC-0403 | 🟠 P1 | consultation_active user sends STOP | ⬜ | — |
| TC-0504 | 🟠 P1 | "Book Another Consultation" button | ⬜ | — |
| TC-0505 | 🟠 P1 | REBOOK keyword from consultation_closed | ⬜ | — |

### D4 Keywords + Edge + Intent
| TC | Priority | Title | Status | Gap? |
|----|----------|-------|--------|------|
| TC-0604 | 🔴 P0 | STOP from payment_pending (regulatory) | ✅ | ✅ No gap |
| TC-0605 | 🟠 P1 | STOP from consultation_active (hold) | ✅ | ✅ No gap |
| TC-0606 | 🔴 P0 | STOP from consultation_closed | ✅ | ✅ No gap |
| TC-0607 | 🟠 P1 | opted_out user re-engages | ✅ | ✅ No gap |
| TC-0702 | 🟠 P1 | Blocked user sends message | ❓ | ❓ Logging uncertain |
| TC-0703 | 🟠 P1 | Duplicate webhook (deduplication) | ✅ | ✅ No gap |
| TC-0704 | 🔴 P0 | WA message from bot's own number (echo) | ⚠️ | ⚠️ WF-00 missing echo guard (TD-030) |
| TC-0802 | 🟠 P1 | malicious_abusive intent — auto-block | ⚠️ | ⚠️ WF-31 routes malicious to WF-47 not WF-46 |

## 7. Workflow ID Reference

Live n8n workflow IDs (source of truth: `docs/workflow-registry.md`). Subagents must use these to fetch from MCP/API. Re-fetch each session — exports in `/tmp/claude-scratch/wf-cache/` are wiped at session end.

| WF | Name | n8n ID |
|----|------|--------|
| WF-00 | Webhook Receiver | `JQu1MkK5vgtUCeNO` |
| WF-01 | Message Router | `hYGNM97sXvdo1WmI` |
| WF-02 | User State Router | `PubCsNTOspF3xqXZ` |
| WF-10 | Slack Admin Handler | `wMh0oBRtJbvhLgOf` |
| WF-22 | Form Response Handler | `dr8QM0m92Ml8MvIh` |
| WF-25 | Intent Classifier | `eTV1lUcYrXBg2q2T` |
| WF-31 | Payment Submitted Handler | `HB8nXudAtk9iXz7C` |
| WF-50 | Send WhatsApp | `BUVun38WEKb12zg9` |
| WF-51 | Send Slack Message | `wlZRK0YxnhP0b2RL` |
| WF-52 | Slack Channel Manager | `IO5BZLUxuVmjzk5I` |
| WF-60 | Message Logger | `6H75p935FpBVBQtV` |

**Other WFs:** Discover IDs by querying `mcp__n8n__n8n_list_workflows` once per session and caching to `/tmp/claude-scratch/wf-cache/list.json`, or grep `docs/workflow-registry.md`.

## 8. Subagent Prompt Template

Use this verbatim when dispatching a domain subagent. Substitute `<DOMAIN_ID>`, `<DOMAIN_NAME>`, `<TC_LIST>`, and `<RESULT_FILE>`.

```
You are an Explore subagent performing a code-level review of n8n workflows
for the Chinmay Astro WhatsApp service. Your scope is exactly one domain:
<DOMAIN_ID> — <DOMAIN_NAME>.

Project root:
/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro

GROUND-TRUTH RULE: Only the live n8n workflow JSONs (fetched fresh via the
API this session) and the live Postgres schema are authoritative. Every
Markdown/HTML file below is a STARTING HYPOTHESIS — useful to know what
to look for, never to be cited as truth. If a doc disagrees with code or
DB, the code/DB wins and you log the disagreement as a finding.

READ (in order), treating each doc per the ground-truth rule above:
1. docs/superpowers/FunctionalCodeReview_tracker.md — the master tracker.
   Sections 1–4 describe the problem, scope, constraints, and per-TC
   methodology. Section 7 has the workflow ID reference (verify each ID
   against `mcp__n8n__n8n_list_workflows` before relying on it).
2. CLAUDE.md (project root) — design rules, expression gotchas, and
   architecture overview. This is the primary project doc, but it is
   still a doc — verify any claim against live state.
3. docs/superpowers/FunctionalTestCases.md — TC definitions (Given/When/
   Then). Defines INTENDED behavior; not a source of actual behavior.
4. docs/reference/user_journey_map.html — journey map. Defines INTENDED
   user-facing flow only.
5. docs/superpowers/FunctionalTestReport.md — pre-existing gap analysis.
   Useful for hypotheses; do not cite as evidence — re-verify everything.
6. docs/workflow-registry.md — workflow inventory; possibly stale.
7. docs/CONTEXT.md — may be stale. Do not cite for DB schema. For
   schema, query `information_schema.columns` directly via
   `mcp__postgres__query`.

YOUR TASK:
For each TC in this list, follow the tracing procedure in tracker section 4:
<TC_LIST>

OUTPUT:
Write/append to <RESULT_FILE> using one `### TC-XXXX` section per TC, with
the field structure defined in tracker section 4. If the file already exists
and has some TCs filled in, only add the missing TCs — never overwrite a
filled-in section.

OPERATING RULES (non-negotiable):
- Use the live n8n API (SSH tunnel at localhost:5678) for every workflow
  fetch. Never trust workflows/*.json on disk.
- Export each workflow JSON to /tmp/claude-scratch/wf-cache/<ID>.json before
  inspecting it. Never load a full JSON into your reasoning context — use
  jq with --arg selectors on node names.
- Use mcp__postgres__query for schema lookups if needed; surgical queries only.
- When a node calls a sub-workflow (executeWorkflow type), export that
  sub-workflow and trace into it. Do NOT accept caller-side claims about
  what the sub-workflow does.
- No hallucination. If something is ambiguous, write [UNCERTAIN — <reason>].
- For every claimed "actual behavior", cite the specific WF + node name.
- Do not modify any workflows. Do not write to the DB. This is read-only.
- At the end of your run, update tracker section 6 (Status Grid) for every
  TC you completed: ⬜ → ✅ / ⚠️ / ❓.
- Append one line to the tracker Activity Log (bottom of file).
- Update the Current Phase Pointer if this was the last TC of the domain.

Return a brief summary (≤300 words) of: TCs done, gaps found (count by
severity), [UNCERTAIN] items, and any cross-cutting issues you spotted.
Do NOT echo the full result content in your response — it's already on disk.
```

## 9. Final HTML Assembly Instructions

Once all 4 domain result files exist and all rows in section 6 are ✅/⚠️/❓ (no ⬜ left), assemble the deliverable:

**File:** `docs/superpowers/FunctionalCodeReview_2026-05-14.html`

**Requirements:**
- Dark theme (dark background, light text — easy reading)
- Executive summary at top:
  - Total TCs reviewed (should be 31)
  - Breakdown: ✅ No gap / ⚠️ Gap / ❓ Uncertain (counts)
  - List of P0 blockers (any P0 with ⚠️)
  - List of P1 functional gaps
- Single sortable table with columns: TC ID · Priority · Scenario · Journey · Intended · Code Path · Actual · DB · External · Gap · Remarks
- Sortable by clicking column headers (vanilla JS, no external libs)
- Filter buttons: All · P0 · P1 · Gaps only · Uncertain only
- Collapsible domain sections (D1 / D2 / D3 / D4)
- Row highlight: rows with ⚠️ have a red-tinted background; ❓ have an amber-tinted background; ✅ default
- Inline-styled, single self-contained HTML file — no external CSS/JS

The assembly Claude (could be a fresh session reading this tracker, could be the same session) should:
1. Read all 4 domain result files
2. Parse the per-TC sections into a JS array
3. Emit the HTML with the array embedded and the sort/filter logic inline
4. Save to `docs/superpowers/FunctionalCodeReview_2026-05-14.html`
5. Update tracker status to `🟢 Complete` at top
6. Append final Activity Log entry

## 10. Workflow Export Cache

`/tmp/claude-scratch/wf-cache/` is the on-disk cache for this run. It is **wiped at session end** per global CLAUDE.md rules. Each fresh session re-exports as needed. This is intentional — disk space is small and exports are cheap (~50KB each).

`/tmp/claude-scratch/wf-cache/list.json` — output of `mcp__n8n__n8n_list_workflows`, cached once per session to look up unknown WF IDs.

## 11. Current Phase Pointer

**Status:** 🟢 COMPLETE. Final deliverable assembled.

**Domain sequence:** D1 ✅ → D2 ✅ → D3 ✅ → D4 ✅ → HTML ✅.

**Deliverable:** `docs/superpowers/FunctionalCodeReview_2026-05-14.html` — single self-contained dark-theme HTML with sortable table, filter buttons (All/P0/P1/Gaps/Uncertain), collapsible domain sections, and executive summary with P0 blocker list.

## 12. Activity Log

| Timestamp (UTC) | Event |
|-----------------|-------|
| 2026-05-14 (session start) | Tracker created. Scope locked at 31 TCs across 4 domains. SSH tunnel verified (`curl localhost:5678` → 200). Next: dispatch D1 subagent. |
| 2026-05-14 (D1 complete) | D1 Onboarding review completed. 6 TCs traced end-to-end. Result: 4 ✅ no gap, 2 ⚠️ gaps (TC-0102 deflection message missing, TC-0107 malicious intent routing missing), 0 ❓ uncertain. Cross-cutting issue: WF-01 rejection paths lack WF-50 calls for user feedback. Status Grid + Activity Log updated. Ready for D2 dispatch. |
| 2026-05-14 (D2 complete) | D2 Payment + Admin review completed. 13 TCs traced end-to-end. Result: 7 ✅ no gap, 6 ⚠️ gaps (TC-0205/0304/0305/0306/0312/0313 have critical relay/rejection/closure issues), 0 ❓ uncertain. Critical gaps: WF-34 missing user status reset on rejection, WF-42 missing channel archival, WF-41 lacking status+null guards in relay. Cross-cutting: WF-31 malicious intent routing error. Status Grid + Activity Log updated. Ready for D3 dispatch. |
| 2026-05-14 (D4 complete) | D4 Keywords + Edge + Intent review completed. 8 TCs traced end-to-end. Result: 5 ✅ no gap, 2 ⚠️ gaps (TC-0704 WF-00 echo guard TD-030, TC-0802 WF-31 malicious routing cross-cutting from D2), 1 ❓ uncertain (TC-0702 admin logging). Cross-cutting: malicious_abusive routing error confirmed in D2/D4, TD-030 echo guard missing per tracker. All domains complete. Ready for HTML assembly. |
| 2026-05-14 (HTML complete) | Final deliverable assembled: `FunctionalCodeReview_2026-05-14.html`. Aggregated 31 TCs across D1–D4 into single self-contained HTML (dark theme, sortable table, P0/P1/Gap/Uncertain filters, collapsible domain sections). Final tally: 21 ✅ · 9 ⚠️ · 1 ❓. P0 blockers: TC-0304 (WF-34 missing users.status reset), TC-0704 (WF-00 echo guard TD-030). TC-0305 reclassified from "archival missing" to "design intent undocumented" per D3 channel-reuse finding. Review 🟢 COMPLETE. |

## 13. Live DB Schema Snapshot (captured by D1)

**Snapshot Date:** 2026-05-14  
**Source:** `mcp__postgres__query` against `information_schema.columns` and `information_schema.table_constraints`  
**Scope:** Tables referenced by D1 onboarding workflows (WF-00, WF-01, WF-02, WF-21, WF-22, WF-50, WF-60)

### chinmay_astro.users

**Primary table:** User state and consultation history.

| Column | Data Type | Nullable | Default | Constraint |
|--------|-----------|----------|---------|------------|
| id | integer | NO | `nextval('chinmay_astro.users_id_seq'::regclass)` | PRIMARY KEY |
| phone_number | character varying | NO | — | UNIQUE |
| name | character varying | YES | — | — |
| date_of_birth | date | YES | — | — |
| time_of_birth | time without time zone | YES | — | — |
| place_of_birth | character varying | YES | — | — |
| status | character varying | YES | `'new'::character varying` | CHECK constraint (valid statuses: new, payment_pending, payment_submitted, consultation_active, consultation_closed, opted_out, blocked) |
| current_consultation_id | integer | YES | — | — |
| total_consultations | integer | YES | `0` | — |
| context | jsonb | YES | `'{}'::jsonb` | — |
| created_at | timestamp with time zone | YES | `CURRENT_TIMESTAMP` | — |
| updated_at | timestamp with time zone | YES | `CURRENT_TIMESTAMP` | — |
| last_message_at | timestamp with time zone | YES | `CURRENT_TIMESTAMP` | — |
| blocked_at | timestamp with time zone | YES | — | — |
| blocked_by | character varying | YES | — | — |
| blocked_reason | text | YES | — | — |
| awaiting_feedback | boolean | YES | `false` | — |
| slack_channel_id | character varying | YES | — | — |
| feedback | text | YES | — | — |

**Unique Constraints:**
- `users_pkey`: PRIMARY KEY on `id`
- `users_phone_number_key`: UNIQUE on `phone_number`

**Check Constraints:**
- `users_status_check`: status is one of valid enum values

---

### chinmay_astro.pending_users

**Purpose:** Intermediate state for users who have received the WhatsApp Flow form but haven't submitted it yet.

| Column | Data Type | Nullable | Default | Constraint |
|--------|-----------|----------|---------|------------|
| phone_number | text | NO | — | PRIMARY KEY (implicit via schema design) |
| contact_name | text | NO | — | — |
| created_at | timestamp with time zone | NO | — | — |

---

### chinmay_astro.messages

**Purpose:** Message log for both inbound (user → bot) and outbound (bot → user) communications.

| Column | Data Type | Nullable | Default | Constraint |
|--------|-----------|----------|---------|------------|
| id | integer | NO | `nextval('chinmay_astro.messages_id_seq'::regclass)` | PRIMARY KEY |
| user_id | integer | NO | — | FOREIGN KEY (implicit) |
| consultation_id | integer | YES | — | FOREIGN KEY (optional) |
| direction | character varying | NO | — | (values: 'inbound', 'outbound') |
| message_type | character varying | NO | — | (values: 'text', 'interactive', 'button', 'image', 'audio', etc.) |
| content | text | YES | — | — |
| whatsapp_message_id | character varying | YES | — | — |
| slack_message_ts | character varying | YES | — | — |
| metadata | jsonb | YES | — | — |
| created_at | timestamp with time zone | NO | `(now() AT TIME ZONE 'Asia/Kolkata'::text)` | Defaults to current timestamp in IST |

**Unique Constraints:**
- `messages_pkey`: PRIMARY KEY on `id`

---

### public.data_table_user_gZCekRseitJEAX1g

**Purpose:** n8n custom data table used by WF-00 for message deduplication by `inboundMessageId`.

**Schema:** Auto-managed by n8n data table interface. Contains:
- Indexed columns for fast lookups by `inboundMessageId`, `phoneNumber`
- Retention: Cleanup job runs on WF-00 (Message Cleanup >7 Days node)

---

## Cross-Cutting DB Design Notes (from D1 review)

1. **Design Rule #1 Compliance:** No write to `chinmay_astro.users` occurs until WF-22 (form submission). Initial contact only inserts into `pending_users`.
2. **Idempotency:** `users` table INSERT uses `ON CONFLICT (phone_number) DO NOTHING` to safely re-handle duplicate form submissions.
3. **Slack Channel Tracking:** `slack_channel_id` column in `users` table stores channel ID created by WF-52 at form submission time (WF-22), not at payment approval.
4. **Status Machine:** `status` column governs routing in WF-02 and downstream workflows. Valid transitions: new → payment_pending → payment_submitted → consultation_active → consultation_closed. Side branches: any → opted_out (user STOP), any → blocked (admin BLOCK). No direct new → payment_submitted transition.

