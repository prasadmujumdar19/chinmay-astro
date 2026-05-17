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

### TC-0702 · Blocked user message attempt not logged to admin_actions

**Source:** .methodology/sprint-tech-debt-2026-05-14-followups.md (TC-0702, deferred post-MVP)  
**Finding:** WF-01 `Silent Reject (Blacklist)` is a true dead-end — no INSERT to `admin_actions`, no admin notification. Silent drop behavior is correct (blocked user gets no reply). The missing piece is an audit trail of repeated attempts.

**Fix:** Add one Postgres node after `Silent Reject (Blacklist)` in WF-01:
```sql
INSERT INTO chinmay_astro.admin_actions (phone_number, event_type, created_at)
VALUES ('{{ $json.phoneNumber }}', 'block_attempt', NOW())
```

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
| TC-0702 | Blocked user attempt not logged to admin_actions | 🟡 P2 | n8n session |
| WF-30-UX | Payment reminder missing fresh payment button | 🟡 P2 | n8n session |
| FU-7-DEFERRED | Project-wide DB-lookup hygiene audit (IF empty-result guards) | 🟡 P2 | n8n session |
| TD-NEW-019 | n8n execution history never pruned | 🟡 P2 | VPS session |
| STATUS-TD-05 | Encryption svc — no healthcheck or restart policy | 🟡 P2 | VPS session |
| STATUS-TD-06 | WF-73 Data Cleanup — does not exist | 🔵 Needs-Decision | n8n session |
| TD-NEW-021 | archive/backups/ 68 snapshots — needs tarring | 🟢 P3 | Git/local |
| TD-NEW-022 | workflows/*.json single-line minified | 🟢 P3 | Git/local |
| TD-NEW-023 | docs/.DS_Store committed to repo | 🟢 P3 | Git/local |
| TD-NEW-024 | scripts/ empty — 3 referenced scripts missing | 🟢 P3 | Git/local |
| TD-NEW-025 | 3 stale deleted workflow JSONs in workflows/ | 🟢 P3 | Git/local |
