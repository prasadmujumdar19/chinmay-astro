# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Is This Project

WhatsApp-based Vedic astrology consultation service. Users message a WhatsApp bot, complete onboarding via a WhatsApp Flow form, pay ₹500 via UPI, and have a live text consultation with the astrologer (Chinmay). Chinmay operates entirely from Slack.

**No custom backend code.** Everything runs through n8n workflows on a Linode VPS.

## Document Map — Read These First

| Document | When to Read |
|----------|-------------|
| `docs/CONTEXT.md` | Every session — lean entry point with architecture, DB schema, admin commands, entry points |
| `docs/workflow-registry.md` | Before touching any workflow — WF-XX master list, current status, WIP action list, all n8n IDs |
| `docs/artefacts/sprints/<slug>/handoffs/*.md` (active sprint) or `docs/artefacts/handoffs/*.md` (no active sprint) | Start of each session — stopping point + next action from last session (written by `handoff` skill) |
| `docs/INFRA.md` | When working on infrastructure — CF Tunnel setup, firewall, SSH, Docker, DB backup plan |
| `docs/STATUS.md` | When checking what's working/broken — infra status per component, tech debt items |

## Folder Structure

**Project root contains `CLAUDE.md` only.** All other files have a designated home:

| File type | Location |
|-----------|----------|
| Session/intermediate scripts, scratch files | `/tmp/claude-scratch/` — deleted at session end |
| Operational scripts (export, backup, DB migrations) | `scripts/` — committed to GitHub |
| Project documentation | `docs/` |
| Implementation plans | `docs/artefacts/plans/` |
| Design specs | `docs/artefacts/specs/` |
| Sprint / test / review / handoff artefacts | `docs/artefacts/` — one folder per unit of work (sprints/, tests/, reviews/, handoffs/) |
| Reference material (journey maps, integration guides) | `docs/reference/` |
| Generated artifacts (`dependency-map.md`) | `docs/` |
| Superseded/archived items | `archive/` — use dated filenames |

**Skill output paths.** When invoking `superpowers:brainstorming`, write design specs to `docs/artefacts/specs/` (override the skill's default of `docs/superpowers/specs/`). When invoking `superpowers:writing-plans`, write implementation plans to `docs/artefacts/plans/` (override the skill's default of `docs/superpowers/plans/`). All `n8n-whatsapp-methodology` plugin skills (≥v1.13.0) write directly to `docs/artefacts/<category>/`.

**Session cleanup:** A Stop hook checks these boundaries at session end. Address any warnings before ending the session.

## Security Rules — Credentials

**Never commit real API keys, passwords, or tokens to GitHub.** This applies to all files including docs and workflow exports.

| What | Rule |
|------|------|
| Docs committed to GitHub (`docs/NEXT_SESSION_HANDOFF.md`, etc.) | Use placeholder text — "see n8n credential X" or "see .env" — never paste real values |
| Workflow JSON exports | n8n HTTP Request nodes must use named n8n credentials, not inline `?key=` URL params. Before committing any workflow JSON, `grep -i 'api_key\|apikey\|?key=\|access_token\|secret'` and fix any hits |
| `.env` file | Never committed — only `.env.example` goes to GitHub |
| Session handoff notes, reference tables | Credential IDs (like `ZkLShpFmp8Mi1gZl`) are safe; credential values (like `AIzaSy...`) are not |

**Before every `git commit` or GitHub push:** run `grep -rn 'AIzaSy\|sk-\|xoxb-\|AKIA' <files>` and verify zero hits.

## Timestamp Convention — Strict UTC Everywhere

Every timestamp Claude writes into any artefact in this repo (sprint `state.md`, handoff files, working copies, design specs, code comments, CHANGELOG, audit notes) is UTC with a `Z` suffix.

| Rule | Detail |
|------|--------|
| Source command | `date -u +%Y-%m-%dT%H:%M:%SZ` (or `scripts/now-utc.sh` if installed) |
| Format | `YYYY-MM-DDTHH:MM:SSZ` — write the literal output, no offset, no reformat |
| Never | Tag a Sydney/IST wall-clock with `Z`. Construct a `Z`-suffixed string from local time |
| Transcribing | When the source is `gh api`, `git log --format='%aI'`, or the n8n REST API (`updatedAt`, `createdAt`, execution timestamps), quote the API value verbatim |
| Historical | Pre-convention timestamps in older sprint `state.md` files are Sydney AEDT/AEST. Do not retroactively rewrite — audit trail |

User-facing displays in WhatsApp/Slack are unaffected — they apply explicit display-time TZ conversion at the message-render boundary (separate concern; see Phase 2.5 of the timestamp spec).

**Rationale + full design:** `docs/artefacts/specs/2026-05-18-timestamp-convention-design.md`. Backing memory: `feedback_timestamp_convention.md`.

## Infrastructure

```
Linode Mumbai VPS (45.79.125.184) — Ubuntu 24.04
  └── systemd: cloudflared (outbound CF Tunnel — NOT in Docker)
  └── Docker (n8n-network)
       ├── n8n            :5678 (127.0.0.1 only)
       ├── postgres       :5432 (127.0.0.1 only — exposed for SSH tunnel)
       ├── pgadmin        :5050 (127.0.0.1 only)
       └── encryption-svc (WhatsApp Flows IV flipping, internal only)
```

**Production n8n URL:** `https://chinmayastro-n8n.friendlydealfinder.com.au`
(Hosted under the `friendlydealfinder.com.au` Cloudflare account — not `chinmaymujumdar.com`, which uses GoDaddy Website Builder and has no IP.)

**CF Access policy:**
- `/*` → Email OTP gate (admin UI)
- `/webhook*` → Bypass (Meta + Slack webhooks reach n8n unauthenticated)

**Docker Compose location on VPS:** `/mnt/chinmay-astro-data/docker-compose.yml`
(Use `docker-compose` v1 is installed but buggy with newer Docker — stop/rm container manually, then `docker-compose up -d <service>` to recreate.)

**Admin SSH tunnel (opens n8n + pgAdmin + Postgres locally):**
```bash
ssh -L 5678:localhost:5678 -L 5050:localhost:5050 -L 5432:localhost:5432 root@45.79.125.184
# http://localhost:5678 = n8n | http://localhost:5050 = pgAdmin | localhost:5432 = Postgres (for MCP)
```

## Accessing n8n

n8n is accessed directly via the **n8n MCP server** (`mcp__n8n__*` tools). The SSRF flag is
disabled, so MCP reaches n8n directly using the stored API key — no browser workaround needed.

- **n8n API base:** `http://localhost:5678/api/v1` (via SSH tunnel already open)
- **Use PUT (not PATCH) for workflow updates.** PATCH returns 405.
- **Always back up a workflow before modifying it** (export JSON first via `mcp__n8n__n8n_get_workflow`).
- n8n API key is stored in memory under "Chinmay Astro — n8n API Key".

## Accessing Slack

Slack is accessed via the **Slack MCP server** (`mcp__slack__*` tools), configured at user scope.
The bot token reuses the same Slack app credential already used by n8n (`WSds5JWe5b6N7myY`).

**Available tools:** `slack_list_channels`, `slack_get_channel_history`, `slack_get_thread_replies`,
`slack_get_users`, `slack_get_user_profile`, `slack_post_message`, `slack_reply_to_thread`,
`slack_add_reaction`

**Use cases:** Debugging — look up users by name, inspect consultation channel membership/history, investigate why a user or channel wasn't found.

**Known limitations:**
- `slack_list_channels` only returns **public** channels — private channels don't appear even with `groups:read` scope.
- For private channels, use the channel ID directly (e.g. pass it to `slack_get_channel_history`).
- Consultation channels (user ↔ Chinmay): bot is already a member — n8n's WF-52 invites it when the channel is created after payment approval.
- `chinmay-admin-commands` (C0A5B0ZE81E) is Chinmay's command channel handled entirely by n8n — Claude Code has no reason to access it.

## Accessing Postgres

Postgres is accessed via the **Postgres MCP server** (`mcp__postgres__query` tool), configured at user scope.
Requires the SSH tunnel to be open with port 5432 forwarded (see tunnel command above).

**Available tools:** `mcp__postgres__query` — **read-only**, accepts SELECT only. For writes (INSERT/UPDATE/DELETE) use the docker-exec pattern below.

**Use cases:** Inspect user state, debug data issues, verify workflow writes.

**Write path (DELETE/UPDATE/INSERT):** MCP is read-only. Pipe SQL into the postgres container via SSH:

```bash
ssh root@45.79.125.184 'docker exec -i $(docker ps --format "{{.Names}}" | grep -i postgres | head -1) psql -U n8n -d n8n -v ON_ERROR_STOP=1' <<'EOF'
<your SQL here>
EOF
```

**Key tables (live schema, verified 2026-05-17):**
- `chinmay_astro.users` — canonical user state (phone_number PK-like, status, slack_channel_id, name, DOB, etc.). **There is no `data_table_user_gZCekRseitJEAX1g`** — that table name in prior notes is stale; the live state table is `chinmay_astro.users`.
- `chinmay_astro.pending_users` — pre-onboarding record (phone_number + contact_name); written by WF-21 before the form is submitted. **No FK to `users`** — keyed on phone_number.
- `chinmay_astro.consultations` / `messages` / `payments` — per-user history; **FK to users.id with ON DELETE CASCADE**.
- `chinmay_astro.admin_actions` — audit log; FK to users.id with **ON DELETE NO ACTION** (will block a users DELETE if any rows exist for that user_id).
- `execution_entity` / `execution_data` — n8n workflow execution history.

**Clean-slate wipe for one test phone:**
```sql
-- 1. Clear admin_actions first (NO ACTION FK blocks otherwise)
DELETE FROM chinmay_astro.admin_actions WHERE user_id = (SELECT id FROM chinmay_astro.users WHERE phone_number = '<phone>');
-- 2. Delete user (cascades to consultations/messages/payments)
DELETE FROM chinmay_astro.users WHERE phone_number = '<phone>';
-- 3. Clear pending_users separately (no FK, keyed on phone)
DELETE FROM chinmay_astro.pending_users WHERE phone_number = '<phone>';
```
The Slack consultation channel is **never** archived automatically (Design Rule #10) — delete it manually in Slack if you need WF-52 to exercise the create-new path on the next form submission.

**Write caution:** Direct SQL writes bypass n8n business logic (Slack channel creation, WA messages, etc.) — only write directly when a user is stuck in a state that n8n workflows can't recover from. For normal state transitions, prefer n8n workflows.

## Token & Context Efficiency

**Core rule: Orchestrate, Don't Load.** Claude writes scripts and runs them via the Bash tool;
data moves locally to disk or git without the payload ever entering Claude's context.

### Bulk n8n Operations (Export/Import)

Never use `mcp__n8n__*` tools to read or write multiple workflows in sequence — every response
payload lands in context and burns tokens fast. Instead, Claude writes and runs a local bash
script via the Bash tool:

```bash
#!/bin/bash
# Claude runs this directly via Bash tool — workflow JSONs go to disk, not into context
API_KEY="<key-from-memory>"
BASE="http://localhost:5678/api/v1"
mkdir -p workflows
for id in $(curl -s -H "X-N8N-API-KEY: $API_KEY" "$BASE/workflows" | jq -r '.data[].id'); do
  curl -s -H "X-N8N-API-KEY: $API_KEY" "$BASE/workflows/$id" > "workflows/$id.json"
done

# Secrets scan — MANDATORY before any commit
# n8n exports credential references (name+ID), never the actual key value.
# Any ?key= hit means a workflow is using an inline key instead of an n8n credential — fix it first.
HITS=$(grep -rl '?key=\|"api_key"\|"apikey"' workflows/ 2>/dev/null)
if [ -n "$HITS" ]; then
  echo "ERROR: inline API key found in: $HITS"
  echo "Fix: update the workflow in n8n to use a named credential, then re-export."
  exit 1
fi

git add workflows/ && git commit -m "export: n8n workflows $(date +%Y-%m-%d)"
```

`localhost:5678` is accessible locally via the SSH tunnel — the same endpoint n8n MCP uses.
Only the short exit status enters Claude's context, not the workflow payloads.

Use `mcp__n8n__*` tools only for: reading a single workflow to reason about it, targeted single-
workflow updates, or small lookups where the response is needed for active reasoning.

### When to Compact vs Clear

| Signal | Action |
|--------|--------|
| Context >60% full | `/compact` — summarizes and preserves decisions |
| Large output consumed context but decisions are captured | `/compact` |
| Task complete, starting unrelated work | `/clear` — full reset |
| Debugging session flooded with error output | `/clear` after resolving |

Compact proactively at 60%. Claude degrades noticeably at 80%+.

### Surgical Operations — The Universal Rule

**Locate, then edit. Never load to look around.**

Applies to every type of artifact — files, n8n workflows, database rows, GitHub blobs:

| Task | Wrong | Right |
|------|-------|-------|
| Edit one field in a large file | `Read` the whole file, find the line, `Edit` | `grep -n` to confirm the exact string, then `Edit` with `old_string`/`new_string` |
| Change one node in a workflow | `mcp__n8n__n8n_get_workflow` full + reason + re-upload | `mcp__n8n__n8n_update_partial_workflow` with `patchNodeField`/`updateNode` directly |
| Scan N items for a pattern | N `mcp__n8n__*` calls in sequence | Bash script: fetch each to `/tmp/claude-scratch/`, `grep`, report only hits |
| Fix a specific DB row | `SELECT *` to inspect, then `UPDATE` | `SELECT` with exact `WHERE` + `LIMIT 1`, then `UPDATE` |
| Push a file edit to GitHub | Read file → push full content via API | `gh api` blob + tree — content stays on disk |

The pattern: **grep/search to locate → edit only the target → verify with a second grep**. No full reads unless you genuinely need to reason about the whole artifact.

### Workflow Representation Freshness

**Before reading any `docs/pseudocode/WF-XX.md` for reasoning:** run `scripts/assert-md-fresh.sh WF-XX`.

- Exit 0 → safe to load.
- Exit 2 → stale or missing; regenerate via `python3 $PLUGIN/scripts/generate-workflow-md.py workflows docs/pseudocode` first.
- Exit 1 → arg/env/network error; resolve before proceeding.

The script (provided by the n8n-whatsapp-methodology plugin ≥1.16.0) prefers `live_updated_at` from the `.md`'s YAML frontmatter — hermetic against `cp`, `rsync`, Google Drive resync, and `git checkout` rewriting inodes. Skipping the check risks reasoning over a `.md` that's behind live n8n state, leading to decisions based on a workflow shape that no longer exists.

The check is cheap (one curl + one mtime/awk read). Run it every time, not just "when in doubt."

### MCP/Tool Output Discipline

- **Targeted over bulk:** Always use IDs and filters to fetch only what's needed.
- **Don't iterate in Claude:** If you need to process N items, write and run a Bash script — not N tool calls.
- **Generated code goes to disk immediately:** Use the `Write` tool right after generating a large script instead of leaving it in context.
- **One workflow at a time:** When reviewing multiple workflows, `/compact` between each.
- **Partial updates:** Use `mcp__n8n__n8n_update_partial_workflow` for small changes — never load a full workflow JSON just to change one node.

### Subagent Delegation

Subagents are useful but easy to misuse. Spawn them only when the work genuinely fits all six rules below. These rules are not meant to discourage subagent use — they prevent the failure modes (sandbox divergence, stuck retries, opaque mid-flight blockers, runaway cost) that the project has seen when subagents were dispatched without guardrails.

**1. Surgical, technical, deterministic.** The subagent's task must be a tightly-scoped tool sequence (e.g. "fetch workflow X, apply jq transform Y, PUT result, verify with lint hook"). If the task includes "look at X and decide between Y or Z", it requires judgment — keep it inline.

**2. Zero user intervention expected.** If there's any plausible decision point (ambiguous spec, missing data, sandbox permission failure) where the subagent would need to ask, the main thread must own it. A subagent that hits a question silently retries or fails, and the user can't intervene because the prompt never surfaces.

**3. <1 minute of work.** Approximate target — small overrun is fine, but a subagent budgeted at 5+ minutes is the wrong tool. Token cost and visibility cost both scale with duration; inline execution wins on long tasks.

**4. Compare against alternatives first.** Before dispatching, ask: would a bash script + loop in the main thread do this faster/cheaper? Often yes — `for id in $(...); do curl ... done` is one tool call with all outputs going to disk. Only choose a subagent when the work genuinely needs LLM reasoning per item (e.g. classification, pattern recognition) that a script can't do.

**5. Active monitoring with a 2-minute abort budget.** Main thread polls the subagent transcript (via `Monitor` on the subagent output file) every 60s wallclock. On the 2nd check (≈2 min mark) if the work is still unfinished, send `TaskStop` and either re-classify the work as inline or break it into smaller pieces. This is non-negotiable: Claude Code's platform has a known 10-minute hardcoded subagent timeout and documented cascade-failure modes (GH `anthropics/claude-code#49150`, `#47936`). Anthropic does not ship a monitoring pattern of its own — defensive engineering is the controller's responsibility.

**6. Always use Haiku for subagents.** Haiku is the default model for subagent dispatch (Anthropic also positions Haiku for "file discovery, simple lookups, transformations"). If the work genuinely needs Sonnet-level reasoning, **stop and ask the user first** before spawning — explain why Haiku won't suffice and seek approval. This is stricter than Anthropic's published guidance (which suggests Sonnet for implementation/review tasks); the strictness exists because Sonnet subagent cost is high and the user wants explicit sign-off.

**7. Task-decomposition pre-check before dispatch.** Before spawning any subagent, ask two questions:

   (a) *Is this task fully independent of other in-flight work?* (Does it need shared state, write-locks on a file another subagent is editing, or coordination with a parallel task?)
   (b) *Does the parent thread need this output synchronously?* (If the next main-thread step blocks on the subagent's result, the parent is just sitting idle anyway — running the work inline avoids the dispatch + report overhead.)

   If the answer to either is "yes," use a bash script + loop inline instead. Subagents pay off when work is genuinely parallel AND the parent has other meaningful work to do during the dispatch — otherwise the dispatch/report ceremony exceeds the work itself.

**When subagents fit well:**
- Auditing all workflows for a pattern (read-heavy, deterministic, <1 min, Haiku-suitable)
- Cross-document search across multiple files (Explore subagent — same)
- Any task producing >500 lines of intermediate output before a conclusion (Explore subagent — keeps main context lean)

**When subagents don't fit (do this inline instead):**
- n8n workflow edits during build-sprint (see [[feedback_sprint_parallelism]] memory and `n8n-whatsapp-methodology:build-sprint` Mode A/B/C — Mode D subagent dispatch is permitted only when all four of that skill's caveats hold, which mirror rules 1-3 + 5 above)
- Plan execution / multi-step refactors (see [[feedback_inline_plan_execution]] memory — user values direct visibility into diffs and tool calls)
- Anything the user has signalled they want to see step-by-step

### General Rules

- **Prefer Bash scripts over MCP calls for bulk work.** If an operation touches multiple items, write and run a script — responses go to disk, not context.
- **Compact before starting a new major task** within the same session.
- **Never summarize large tool outputs inline** — extract only the fields needed for the next step.
- **Clean up all temporary and intermediate files before ending a session.** This includes: scripts written to `/tmp/`, local clones in `/tmp/`, any scratch files written to the working directory. If a task is interrupted mid-session, clean up at the start of the next session before continuing.

## n8n Expression Gotchas

| Problem | Wrong | Correct |
|---------|-------|---------|
| Expression syntax | `={{ $json.field }}` | `{{ $json.field }}` — the `=` prefix breaks base64 encoding |
| Slack webhook payload | `$json.challenge` | `$json.body.challenge` — Slack wraps payload in `body` |
| Postgres null from JS | `null` → stored as string `"null"` | `NULLIF({{ $json.field }}, 'null')::integer` |
| Bot loop prevention | — | Compare `$json.body.authorizations[0].user_id` ≠ `$json.body.event.user` |
| WhatsApp Flows decryption | Native n8n Code node | Must use `encryption-svc` Docker container (IV flipping required) |
| WF-50 interactive payload | Nested structure | Flat structure with camelCase `flowId`/`flowCta` — no nesting |

## Workflow Architecture

All workflows follow the WF-XX naming convention. The `workflow-registry.md` is the single source of truth for IDs and status.

| Range | Domain |
|-------|--------|
| WF-0x | Infrastructure — entry, routing, security |
| WF-1x | Admin — Slack-side command handling |
| WF-2x | Onboarding — new user, consent, form |
| WF-3x | Payment — confirmation, approval, rejection |
| WF-4x | Consultation — relay, close, post-consult, rebook |
| WF-5x | Messaging utilities — WA sender (WF-50), Slack sender (WF-51), channel manager (WF-52) |
| WF-6x | Data — message logging (WF-60), audit |
| WF-7x | Background jobs — post go-live only |

**Critical path:** WF-00 → WF-01 → WF-02 → state-specific WF → WF-50/WF-51

**Shared sub-workflows.** Several workflows act as shared services called by many others (intent classifier, outbound WhatsApp sender, outbound Slack sender, message logger, channel manager). For the current names, IDs, and per-workflow status see `docs/workflow-registry.md` — do not duplicate that list here.

## Design Rules — Do Not Deviate

These are business and architectural invariants. Where a rule references a workflow, the specific WF-XX number is intentionally omitted — see `docs/workflow-registry.md` for the current mapping, and `docs/pseudocode/WF-XX.{md,pseudo}` for the canonical AS-IS / design view of each workflow.

1. **Pre-form writes are restricted to `pending_users`.** The first write to the `chinmay_astro.users` table happens on the form-submission callback. Any inbound message received before the form is submitted may only persist into `chinmay_astro.pending_users` (contact capture).

2. **The consultation Slack channel is created at form submission (the consent boundary), not at payment confirmation.** The channel ID is persisted on the user record and reused thereafter. The payment-confirmation flow reads the existing channel from DB; it does not create one.

3. **Admin payment commands are issued in the user's per-consultation channel.** The admin command listener captures workspace-wide events and routes by command type, so commands work from any channel — but the recommended (and rule-enforced for user-targeted commands) surface is the user's `consult-{phone}` channel.

3a. **Channel scope of admin commands (added 2026-05-17):**
    - **User-targeted commands** (those carrying a `<phone>` argument: APPROVE PAYMENT, REJECT, CLOSE CHAT CONSULT, BLOCK, UNBLOCK) are accepted ONLY in the user's `consult-{phone}` channel. The listener rejects them elsewhere with a polite reminder.
    - **Admin-wide commands** (no phone argument: LIST, STATS, HELP) work in ANY channel.
    - The keyword parser accepts standard aliases: `APPROVE` ≡ `APPROVE PAYMENT`; `REJECT` ≡ `REJECT PAYMENT`; `CLOSE` ≡ `CLOSE CONSULT` ≡ `CLOSE CONSULTATION` ≡ `CLOSE CHAT CONSULT`.

4. **`opted_out` ≠ `blocked`.** STOP keyword → `opted_out` (user-initiated; user re-engages automatically by sending any message). Admin BLOCK → `blocked` (admin/system action; requires explicit admin UNBLOCK). The router treats these as distinct states with different re-entry semantics.

5. **STOP, HELP, REBOOK are exact-match keyword intercepts that run before the intent classifier.** No LLM is invoked for these keywords.

6. **Every state that accepts free-form user text must run the intent classifier first.** No state may branch on the raw text without classifier output.

7. **First-message response is combined: policy URL + WhatsApp Flow form in ONE message.** There is no YES/NO consent step. Submitting the form is implicit consent.

8. **Payment is manual UPI in Phase 1; Razorpay is deferred to Phase 2.** The active UPI handle, amount, and beneficiary are configured in the payment workflow — do not duplicate them in code or docs outside that workflow.

9. **`cloudflared` runs as a host systemd service, not inside Docker.** Running it in Docker breaks `localhost` resolution from other containers to the host, which breaks n8n's outbound connectivity to the VPS's other services.

10. **Consultation Slack channels are never archived; they are reused across rebookings.** The close-consultation flow must not archive. The rebook flow must read the existing channel from DB rather than creating a new one.

## User State Machine

```
[no record] →(form submitted)→ payment_pending →(tap "Payment Completed")→ payment_submitted
    →(admin APPROVE)→ consultation_active →(admin CLOSE)→ consultation_closed
    →(REBOOK or rebook_intent)→ payment_pending [loop]

any state →(admin BLOCK)→ blocked
payment_submitted →(admin REJECT)→ payment_pending
any state →(user sends STOP)→ opted_out
opted_out →(user messages again)→ status lifted + personalized welcome sent + re-routed through the inbound entry flow, all in the same turn → consultation_closed
```

For the workflow-level implementation of each transition, see `docs/workflow-registry.md` and the per-workflow `docs/pseudocode/WF-XX.{md,pseudo}` files.

## Key Credential IDs (n8n)

| Item | ID |
|------|----|
| Postgres credential | `Zomqv5wsowQAhdGl` |
| Slack credential | `WSds5JWe5b6N7myY` |
| Slack admin channel | `C0A5B0ZE81E` (chinmay-admin-commands) |
| WhatsApp Flow ID | `1408011897720771` |
| WhatsApp Flow CTA | `"Fill Details"` |
| Gemini model | `gemini-2.5-flash-lite` (2.0 deprecated; see `project_gemini_model.md`) |

## Git Repository

**Remote:** `https://github.com/prasadmujumdar19/chinmay-astro` (branch: `main`)

**Working directory** (`/Users/prasadmujumdar/Library/CloudStorage/GoogleDrive-prasadmujumdar.aws@gmail.com/My Drive/Chinmay Astro`) is on **Google Drive — there is no local `.git` here.**

To commit and push changes at the end of a session:
```bash
git clone https://github.com/prasadmujumdar19/chinmay-astro /tmp/claude-scratch/chinmay-astro
# copy changed files
cp workflows/*.json /tmp/claude-scratch/chinmay-astro/workflows/
cp docs/workflow-registry.md /tmp/claude-scratch/chinmay-astro/docs/
# secrets scan, then commit and push
grep -rn 'AIzaSy\|sk-\|xoxb-\|AKIA' /tmp/claude-scratch/chinmay-astro/workflows/
cd /tmp/claude-scratch/chinmay-astro && git add -A && git commit -m "..." && git push origin main
# clean up
rm -rf /tmp/claude-scratch/chinmay-astro
```

## Methodology

This project uses the n8n-whatsapp-methodology plugin (Phase 0).
- Credentials: `.env` in project root
- Dependency map: `docs/dependency-map.md` (generated by scripts/build-dependency-map.sh when available)
- Workflow exports: `workflows/*.json` (generated by scripts/export-all-workflows.sh)
- Pre-modification: always run `scripts/backup-workflow.sh <WF-ID>` before touching a workflow
- Session startup: verify tunnel open, then check `.methodology/initialized`
