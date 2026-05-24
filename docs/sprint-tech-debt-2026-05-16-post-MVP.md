# Chinmay Astro — Tech Debt: Post-MVP · 2026-05-16

**Created:** 2026-05-16  
**Source:** docs/Tech_Debt_2026-05-14.md (carry-forward items) + .methodology/sprint-tech-debt-2026-05-14-followups.md (deferred decisions)  
**Scope:** All items explicitly deferred until after go-live. Does NOT include items in docs/sprint-tech-debt-2026-05-16-before-MVP.md.

**Execution note:** Infrastructure items (VPS hardening, DB backups, TD-NEW-019, STATUS-TD-05) require a dedicated VPS session with SSH access and Docker Compose changes — they cannot be executed in a standard n8n workflow session.

---

## Priority Key

| Level | Meaning |
|-------|---------|
| 🔴 Critical | Security or data safety — address immediately after go-live |
| 🟠 P1 | Security gap — forged requests can trigger sensitive workflow paths |
| 🟡 P2 | Functional improvement or reliability — before significant user volume |
| 🔵 Needs-Decision | Requires scope discussion before implementation can begin |
| 🟢 P3 | Repo hygiene — low urgency, can batch |

---

## 🔴 Critical — VPS Infrastructure (dedicated session required)

### STATUS-TD-01 · Mumbai VPS full security hardening

**Source:** STATUS.md TD-01 (carry-forward)  
**Finding:** VPS security baseline is incomplete. Full checklist in `docs/INFRA.md` and `docs/STATUS.md`. Key gaps: Docker port isolation, SSH key-only auth, Linode firewall rules, stale DNS records, CF Tunnel hardening.

**Fix:** Follow the full STATUS.md TD-01 checklist in a dedicated VPS session. Requires SSH + Docker access on `root@45.79.125.184`.

---

### STATUS-TD-02 · Automated daily DB backups

**Source:** STATUS.md TD-02 (carry-forward)  
**Finding:** No automated backup of the Postgres DB. Schema contains personal data (DOB, birth time, consultation history). Manual backup only. Risk: data loss on VPS failure.

**Fix:** Set up `pg_dump` cron on the VPS → write to Linode storage volume + Google Drive copy. Requires VPS session. See STATUS.md TD-02 for full plan.

---

### TD-NEW-001 · GitHub PAT stored in ~/.claude/settings.json (synced via Google Drive)

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-001  
**Finding:** `~/.claude/settings.json` (or `settings.local.json`) contains a real GitHub Personal Access Token. File is Google Drive–synced — anyone with Drive access can read the PAT and push to the repo.

**Fix:** Rotate the PAT immediately. Switch to `gh auth login` (keychain-backed) so the token is stored in the OS keychain, not a synced file. Action required on local machine, not in the repo. Run: `gh auth login` then revoke the old PAT in GitHub Settings → Developer Settings → Personal access tokens.

---

## 🟠 P1 — Security

### TD-NEW-020 · No HMAC verification on Meta webhook (WF-00) or Slack events (WF-10)

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-020 (also STATUS TD-03 / TD-04)  
**Finding:** WF-00 (`JQu1MkK5vgtUCeNO`) and WF-10 (`hPJ09L4rQ6MdQRiN`) are publicly reachable via CF Tunnel Bypass and accept any payload without verifying the sender. Forged webhooks can trigger payment approval, user blocking, and message relay.

**Fix:**
- WF-00: Verify `X-Hub-Signature-256` HMAC-SHA256 against Meta app secret before processing any payload.
- WF-10: Verify `X-Slack-Signature` HMAC-SHA256 against Slack signing secret before processing any event.

Both fixes are a single Code node added as the first step after the webhook trigger in each workflow.

---

## 🟡 P2 — Functional & Reliability

### TC-0702 · Blocked user message attempt not logged

**Source:** .methodology/sprint-tech-debt-2026-05-14-followups.md (TC-0702, deferred post-MVP)
**Finding:** WF-01 `Silent Reject (Blacklist)` is a true dead-end — silent drop behavior is correct (blocked user gets no reply), but there's no audit trail of repeated attempts.

**Fix (revised 2026-05-20):** Log the blocked-attempt event as a normal inbound message via WF-60 (with `message_type='blocked_attempt'` or via metadata). The original 2026-05-16 plan to `INSERT INTO chinmay_astro.admin_actions` is **superseded** — see `TD-NEW-026` (admin_actions table removal) below; once removal lands, admin_actions no longer exists. The blocked-attempt event remains worth logging — just to the messages table.

---

### TD-NEW-026 · Remove `chinmay_astro.admin_actions` table

**Source:** TD-003 audit, 2026-05-20 (deprecation decision recorded in `docs/artefacts/sprints/smoke-resume-remediation-2026-05-19/td003-touchpoint-audit.md`).
**Finding:** `admin_actions` was designed as an attribution + state-transition ledger but is redundant in single-admin operation: `messages` captures every admin Slack command + outbound notification, and `users.status` + `users.updated_at` capture the state transition. The `ON DELETE NO ACTION` FK safety is a non-feature here (no retention obligation; clean-slate test wipes already work around it).

**Pre-removal:** TD-003 (sprint `smoke-resume-remediation-2026-05-19`) does NOT touch admin_actions, leaving existing partial writes in place:
- WF-11 `Unblock User` — works (inline interpolation; writes a row with NULL `performed_by`)
- WF-47 `Log to admin_actions` — silently no-ops (broken `$1` binding without queryReplacement)

These writes are harmless since nothing reads from admin_actions; removal cleans them up.

**Fix:**
1. Delete the `Unblock User` INSERT statement (keep only the `UPDATE users` part) in WF-11.
2. Delete the `Log to admin_actions` node entirely in WF-47.
3. `DROP TABLE chinmay_astro.admin_actions` (single transaction; FK constraint to users is the only dependency).
4. Update CLAUDE.md: remove references to admin_actions in the schema overview + clean-slate SQL.

**Priority:** 🟢 P3 — purely housekeeping; table sitting empty causes no harm. Bundle with any other post-go-live schema cleanup.

---

### TD-NEW-027 · Periodic pseudo↔live drift health-check (maintenance-phase coverage)

**Source:** Drift review 2026-05-22 (this sprint — surfaced when discussing process gaps for major-refactor pseudo updates).
**Finding:** The current `pseudo-md-drift-check` hook runs as part of `build-sprint` and is effective during active build cycles. After go-live, maintenance-phase changes (quick production incident fixes, ad-hoc tweaks via n8n UI) happen outside `build-sprint` and bypass the drift check entirely. Pseudo can fall arbitrarily far behind live before any `build-sprint` is invoked again — which may be days, weeks, or never.

Concrete evidence from this sprint: WF-51 and WF-60 pseudos were both significantly stale after **TD-002** (2026-05-19 multi-transport rebuild) — a structural refactor done as a focused change, not under `build-sprint`. Neither pseudo was updated. The drift only surfaced when this drift review ran ~3 days later. Similar gaps will continue to accumulate post-MVP unless drift detection runs on a schedule independent of sprint activity.

**Scope of needed health-check infrastructure (broader than just drift):**
- Periodic pseudo↔live drift check across all active workflows (the methodology hook, but run on a schedule)
- Periodic workflow-registry accuracy check (caller lists, status, IDs)
- Periodic Postgres node hygiene check (alwaysOutputData, schema-prefix, queryReplacement format)
- Periodic execution-error-rate sweep (alert when any active workflow's recent error rate exceeds threshold)
- Periodic disk/log/DB-row growth check (matches TD-NEW-019 execution_entity growth concern)

**Fix:** Design and implement a "health checks" routine that runs on a schedule (cron job or scheduled agent). Out of scope for any current sprint — needs its own spec and design pass. Tracks discovery of further health-check candidates as they emerge.

**Priority:** 🟡 P2 — important for sustainability but not blocking go-live. Schedule for first post-MVP planning cycle.

---

### TD-NEW-031 · State-filter workflows treat any non-{garbage,abusive,inappropriate,stop} intent as a single "passthrough" bucket

**Source:** Sprint `inline-20260522-102910` SP-04 (2026-05-23) — surfaced during the silent-drop IF FALSE branch audit when the WF-25 contract was reconciled against the upstream `Is Pass-Through Intent?` condition.

**Finding:** WF-23 (Pre-Form Intent Filter), WF-30 (Payment Pending Intent Filter), and WF-31 (Payment Submitted Handler) each gate on `intentResult` only NEGATIVELY — the `Is Pass-Through Intent?` IF checks `intent NOT IN {garbage, malicious_abusive, inappropriate, stop_intent}` and treats everything else as a single "passthrough" bucket. That bucket actually contains 4 distinct intents — `wants_consultation`, `general_enquiry`, `rebook_intent`, `feedback_intent` — which arguably warrant different state-appropriate responses:

- In WF-30 (`payment_pending`), `feedback_intent` ("the form was confusing") is currently answered with the standard payment reminder — not ideal. A genuine `rebook_intent` is also answered with the same reminder; the workflow already has minor branching on `wants_consultation` vs `rebook_intent` for the prefix line but the rest of the message is identical.
- In WF-23 (pre-form), `feedback_intent` and `rebook_intent` both fall through to the generic "fill the form" intro — no acknowledgement of the inferred intent.
- In WF-31 (`payment_submitted`), all 4 passthrough intents land on the same "under review" reassurance. Likely correct here (admin sees the message via parallel relay anyway), but worth a design pass.

**Why deferred to post-MVP:** Pre-MVP the cost of the current behavior is mild (occasional mismatched reminder); the risk of getting intent-specific routing wrong is higher than the risk of leaving it generic. MVP scope holds the bucket approach.

**Post-MVP fix shape:** Replace each filter's `Is Pass-Through Intent?` IF with a Switch on `intentResult` that branches per concrete intent (wants_consultation, general_enquiry, rebook_intent, feedback_intent — plus the existing stop_intent clarifier branch SP-04 added). Each branch builds its own state-specific response. Mirror this pattern across WF-23/30/31. WF-25's contract returning a stable enum of 5 intents to callers is the enabler.

**Owner:** TBD (post go-live design pass).
**Related:** SP-04 (sprint inline-20260522-102910) introduced the stop_intent clarifier; this TD is the natural follow-on for the other 4 intents.

---

### WF-30-UX · Payment pending reminder does not include a fresh payment button

**Source:** .methodology/sprint-tech-debt-2026-05-14-followups.md (2026-05-15 UX gap)  
**Finding:** When a `payment_pending` user says "I just paid" (intent: `wants_consultation`), WF-30 sends a payment reminder ending with *"tap the 'Payment Completed' button you received earlier"* — no fresh button included. User must scroll up to find the original button from WF-22.

**Fix:** In WF-30, change the "Prepare Payment Reminder" node from a plain text `{ message: paymentMsg }` to an `interactivePayload` with an interactive "Payment Completed ✓" button — same pattern as WF-22's payment prompt. Low effort, single node change.

---

### FU-7-DEFERRED · Project-wide DB-lookup hygiene audit (IF empty-result guards on all SELECT lookups)

**Source:** `.methodology/sprint-p0-coverage-report-2026-05-17-followups.md` FU-7 (deferred 2026-05-17 per user direction)
**Finding:** Three Postgres SELECT lookup nodes were flagged in the p0-coverage sprint as silent-halt risks on zero-row results:
- **WF-32** Payment Confirmation Receiver — `Load User Channel from DB`
- **WF-31** Payment Submitted Handler — `Load User for Relay`
- **WF-45** Rebook Handler — `Load User Record`

User has manually set `alwaysOutputData: true` on all 3 (so workflows no longer silently halt), but downstream nodes will receive `null` for every column when the row is missing — likely producing garbage messages or expression failures rather than a clean admin alert. Scope expanded post-MVP: audit ALL `SELECT` lookup nodes across every WF (not just these 3) for the same pattern.

**Fix:**
1. Sweep all WFs for `n8n-nodes-base.postgres` nodes whose `operation: 'executeQuery'` returns user/consultation/admin rows used downstream (i.e. lookups, not inserts/updates).
2. For each: confirm `alwaysOutputData: true` is set (mitigates silent halt) AND add an `IF` node immediately after with a non-null check on the row's primary key column (e.g. `{{ $json.id }}` is not empty).
3. FALSE branch → `Call WF-51` admin alert with `messageText` like `⚠️ WF-XX: user/consult record not found for <key>=<value>`. (Decision deferred to implementation time per WF — silent abort vs. fallback creation are also valid for certain WFs.)
4. TRUE branch → existing downstream.

**Verification:** For each WF, test with a key that won't match (phone_number not in DB, deleted consultation_id, etc.) and confirm FALSE branch fires + admin alert lands. Then run a happy-path test to confirm TRUE branch still routes correctly.

**Note (audit scope):** This is now a project-wide hygiene pass, not a 3-WF fix. Expect 8–15 affected nodes once the audit completes — sprint-size estimate will come from the audit pass itself.

---

### TD-NEW-019 · n8n execution history grows indefinitely — no pruning configured

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-019  
**Finding:** n8n defaults to retaining all execution records forever. At even modest usage (100 users × 10 interactions each), `execution_entity` and `execution_data` tables will bloat significantly over months.

**Fix (requires VPS session — Docker env change):** Add to `/mnt/chinmay-astro-data/.env.production`:
```
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336
```
Then recreate the n8n container: `docker stop n8n && docker rm n8n && docker-compose up -d n8n`.

---

### STATUS-TD-05 · Encryption service container — no healthcheck or restart policy

**Source:** STATUS.md TD-05 (carry-forward)  
**Finding:** `encryption-svc` has no Docker healthcheck or restart policy. If it crashes, WF-22 (form submission) silently fails. Location of encryption-svc in Docker Compose needs investigation — it was NOT found in `/mnt/chinmay-astro-data/docker-compose.yml` in a prior session.

**Fix (requires VPS session):** 
1. Locate where encryption-svc actually runs (`docker ps` on VPS).
2. Add `healthcheck` and `restart: unless-stopped` to its compose definition.
3. Recreate the container.

---

### TD-NEW-032 · WF-20 HELP response is generic, not status-aware (TD-027 incomplete)

**Source:** P1 smoke session `docs/artefacts/tests/smoke-pre-golive-p1-2026-05-24/session.md` BUG-P1-01 (2026-05-24). Accepted as pre-MVP non-blocker by operator — fix deferred post-go-live.

**Finding:** WF-20 (`LgIDj1v4ZbCPlX25`) `Send HELP Response` returns the same generic fallback text regardless of `userStatus`. Verified live by sending HELP from 4 distinct user states in one walk — all 4 outbound replies (messages.id 122, 127, 132, 137) are character-for-character identical:

```
Here's what you can do:

📋 *REBOOK* — Book a new consultation
🚫 *STOP* — Unsubscribe from all messages

For anything else, just type your question during an active consultation.
```

TD-027 (`docs/artefacts/sprints/tech-debts/handoffs/batch7.md` L23) claimed WF-20 HELP messageBody was updated to a status-aware ternary, but the ternary appears to fall through to the default branch every time. Likely root cause is a field-name mismatch in the ternary expression (same class of bug as BUG-F: ternary reads e.g. `$json.userStatus` while WF-02 emits `$json.status` or `$json.user.status`). Needs node-level inspection of WF-20 `Send HELP Response` (or upstream `Prepare HELP Text` Code node) expressions vs WF-02 output contract.

**Why deferred:** Users do get a response (keyword interception itself works — TD-A field-name fix verified in the same walk). The generic text is functionally usable. Journey-map J-18 alignment (per-state HELP wording) is a polish item, not a go-live blocker.

**Fix (post-MVP):**
1. Inspect WF-20 `Send HELP Response` expression for the ternary (likely on `messageBody`).
2. Confirm the field name read matches what WF-02 emits in `workflowInputs` for the HELP path.
3. Either correct the field-name reference OR rewrite the per-state texts inline as a `Switch`/`Code` node keyed on `userStatus`.
4. Re-verify by repeating the P1 walk (one HELP per state) — confirm each reply differs and matches J-18 wording.

**Acceptance signal:** 4 different texts for the 4 user states (`payment_pending` / `payment_submitted` / `consultation_active` / `consultation_closed`).

---

## 🔵 Needs-Decision

### STATUS-TD-06 · WF-73 Data Cleanup workflow does not exist

**Source:** docs/Tech_Debt_2026-05-14.md STATUS-TD-06  
**Finding:** STATUS.md references WF-73 Data Cleanup for personal data retention compliance. The workflow does not exist in n8n. Before significant user volume, `consultation_history`, `messages`, and related tables need a scheduled cleanup or archival policy.

**Decision required:** Build WF-73 now as a background job, or defer until user volume justifies it? If building: define retention window (e.g., purge messages older than 90 days), what to keep (consultation metadata vs. message content), and schedule (weekly cron).

---

## 🟢 P3 — Repo Hygiene

### TD-NEW-021 · archive/backups/ has 68 dated JSON snapshots

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-021  
**Finding:** 68 individual workflow JSON snapshots in `archive/backups/`, one is 0-byte (mangled). Git history is noisy; directory is hard to navigate.

**Fix:** `tar czf archive/backups/pre-20260514.tar.gz archive/backups/*.json && git rm archive/backups/*.json && git add archive/backups/pre-20260514.tar.gz`

---

### TD-NEW-022 · workflows/*.json are single-line minified

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-022  
**Finding:** All workflow exports are single-line JSON — diffs are unreadable, code review is impossible.

**Fix:** Update `scripts/export-all-workflows.sh` to pipe through `jq --sort-keys`. Reformat all existing exports in one pass.

---

### TD-NEW-023 · docs/.DS_Store committed to repo

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-023  
**Fix:** `git rm --cached "docs/.DS_Store"` and add `**/.DS_Store` to `.gitignore`.

---

### TD-NEW-024 · scripts/ directory is empty (CLAUDE.md references 3 scripts)

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-024  
**Finding:** CLAUDE.md and methodology stop hooks reference `scripts/backup-workflow.sh`, `scripts/export-all-workflows.sh`, and `scripts/build-dependency-map.sh`. All three are missing.

**Fix:** Write the three scripts:
- `scripts/backup-workflow.sh <WF-ID>` — fetches single workflow JSON to `archive/backups/`
- `scripts/export-all-workflows.sh` — exports all workflows with `jq --sort-keys` + secrets scan
- `scripts/build-dependency-map.sh` — regenerates `docs/dependency-map.md`

---

### TD-NEW-025 · 3 stale deleted workflow exports still in workflows/

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-025  
**Finding:** `fdlIpl67amL2Ho6U.json`, `yIZwO3CZk6bOBAXl.json`, `z6as85o3b1zK22eF.json` — workflows deleted from n8n (TD-013) but JSON files remain committed.

**Fix:** `git rm workflows/fdlIpl67amL2Ho6U.json workflows/yIZwO3CZk6bOBAXl.json workflows/z6as85o3b1zK22eF.json`

---

## Summary Table

| ID | Issue | Priority | Session Type |
|----|-------|----------|--------------|
| STATUS-TD-01 | Mumbai VPS full security hardening | 🔴 Critical | VPS session |
| STATUS-TD-02 | Automated daily DB backups | 🔴 Critical | VPS session |
| TD-NEW-001 | GitHub PAT in Google Drive–synced settings | 🔴 Critical | Local machine |
| TD-NEW-020 | No HMAC on Meta (WF-00) / Slack (WF-10) webhooks | 🟠 P1 | n8n session |
| TC-0702 | Blocked user attempt not logged (revised: log via WF-60, not admin_actions) | 🟡 P2 | n8n session |
| TD-NEW-026 | Remove `chinmay_astro.admin_actions` table (deprecated 2026-05-20) | 🟢 P3 | n8n + Postgres |
| WF-30-UX | Payment reminder missing fresh payment button | 🟡 P2 | n8n session |
| FU-7-DEFERRED | Project-wide DB-lookup hygiene audit (IF empty-result guards) | 🟡 P2 | n8n session |
| TD-NEW-019 | n8n execution history never pruned | 🟡 P2 | VPS session |
| STATUS-TD-05 | Encryption svc — no healthcheck or restart policy | 🟡 P2 | VPS session |
| TD-NEW-032 | WF-20 HELP response generic, not status-aware (TD-027 incomplete) | 🟡 P2 | n8n session |
| STATUS-TD-06 | WF-73 Data Cleanup — does not exist | 🔵 Needs-Decision | n8n session |
| TD-NEW-021 | archive/backups/ 68 snapshots — needs tarring | 🟢 P3 | Git/local |
| TD-NEW-022 | workflows/*.json single-line minified | 🟢 P3 | Git/local |
| TD-NEW-023 | docs/.DS_Store committed to repo | 🟢 P3 | Git/local |
| TD-NEW-024 | scripts/ empty — 3 referenced scripts missing | 🟢 P3 | Git/local |
| TD-NEW-025 | 3 stale deleted workflow JSONs in workflows/ | 🟢 P3 | Git/local |
