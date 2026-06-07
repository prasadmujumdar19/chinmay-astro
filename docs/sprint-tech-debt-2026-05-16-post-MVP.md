# Chinmay Astro — Tech Debt Backlog (Execution-Ordered) · 2026-05-16

**Created:** 2026-05-16
**Last reordered:** 2026-05-27 (post-MVP triage — promoted 5 items to Tier 1 pre-go-live)
**Last appended:** 2026-05-31 (sprint `behavior-matrix-fixes-2026-05-27` close — added TD-NEW-036…-041 from the S8/D7 smoke + safety-net deferrals)
**Source:** docs/Tech_Debt_2026-05-14.md (carry-forward items) + .methodology/sprint-tech-debt-2026-05-14-followups.md (deferred decisions) + subsequent sprint follow-ups.
**Scope:** All items NOT already in docs/sprint-tech-debt-2026-05-16-before-MVP.md.

---

## Reading Convention (for plan-sprint)

**Items are listed in execution priority — top of file = pick up first.** A `plan-sprint` invocation against this file should start at the top tier and work down. Within each tier, items are sequenced for execution (shared infrastructure sessions bundled). The legacy priority emoji (🔴/🟠/🟡/🔵/🟢) is retained on each item as historical context but is **not** the authority for ordering — the tier heading is.

**Tier headings:**
- **Tier 1 — Pre-Go-Live Blockers**: must land before public launch.
- **Tier 2 — Immediate Post-Go-Live (VPS session bundle)**: first VPS session after launch — bundle these.
- **Tier 3 — Before Significant User Volume**: reliability/UX hardening before scaling traffic.
- **Tier 4 — Needs Design Decision**: scope discussion required before plan-sprint can be invoked.
- **Tier 5 — Functional Polish**: improvements behind real-usage signal.
- **Tier 6 — Repo Hygiene**: low urgency, batch when convenient.

**Execution note:** Infrastructure items (VPS hardening, DB backups, TD-NEW-019, STATUS-TD-05) require a dedicated VPS session with SSH access and Docker Compose changes — they cannot be executed in a standard n8n workflow session.

---

## Priority Key (legacy markers, retained for context)

| Level | Meaning |
|-------|---------|
| 🔴 Critical | Security or data safety — address immediately after go-live |
| 🟠 P1 | Security gap — forged requests can trigger sensitive workflow paths |
| 🟡 P2 | Functional improvement or reliability — before significant user volume |
| 🔵 Needs-Decision | Requires scope discussion before implementation can begin |
| 🟢 P3 | Repo hygiene — low urgency, can batch |

---

# Tier 1 — Pre-Go-Live Blockers

These four items were promoted from later tiers during the 2026-05-27 triage. Rationale per item is captured in the original Finding/Fix blocks below; the promotion driver is summarised in the [Promotion Rationale](#promotion-rationale--2026-05-27) section at the bottom of this file.

---

### TD-NEW-001 · GitHub PAT stored in ~/.claude/settings.json (synced via Google Drive)

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-001
**Finding:** `~/.claude/settings.json` (or `settings.local.json`) contains a real GitHub Personal Access Token. File is Google Drive–synced — anyone with Drive access can read the PAT and push to the repo.

**Fix:** Rotate the PAT immediately. Switch to `gh auth login` (keychain-backed) so the token is stored in the OS keychain, not a synced file. Action required on local machine, not in the repo. Run: `gh auth login` then revoke the old PAT in GitHub Settings → Developer Settings → Personal access tokens.

**Original priority:** 🔴 Critical · **Session type:** Local machine · **Bundle:** standalone (2 min)

---

### WF-30-UX · Payment pending reminder does not include a fresh payment button

**Source:** .methodology/sprint-tech-debt-2026-05-14-followups.md (2026-05-15 UX gap)
**Finding:** When a `payment_pending` user says "I just paid" (intent: `wants_consultation`), WF-30 sends a payment reminder ending with *"tap the 'Payment Completed' button you received earlier"* — no fresh button included. User must scroll up to find the original button from WF-22.

**Fix:** In WF-30, change the "Prepare Payment Reminder" node from a plain text `{ message: paymentMsg }` to an `interactivePayload` with an interactive "Payment Completed ✓" button — same pattern as WF-22's payment prompt. Low effort, single node change.

**Original priority:** 🟡 P2 · **Session type:** n8n session

---

### STATUS-TD-02 · Automated daily DB backups

**Source:** STATUS.md TD-02 (carry-forward)
**Finding:** No automated backup of the Postgres DB. Schema contains personal data (DOB, birth time, consultation history). Manual backup only. Risk: data loss on VPS failure.

**Fix:** Set up `pg_dump` cron on the VPS → write to Linode storage volume + Google Drive copy. Requires VPS session. See STATUS.md TD-02 for full plan.

**Original priority:** 🔴 Critical · **Session type:** VPS session · **Bundle:** with STATUS-TD-05

---

### STATUS-TD-05 · Encryption service container — no healthcheck or restart policy

**Source:** STATUS.md TD-05 (carry-forward)
**Finding:** `encryption-svc` has no Docker healthcheck or restart policy. If it crashes, WF-22 (form submission) silently fails. Location of encryption-svc in Docker Compose needs investigation — it was NOT found in `/mnt/chinmay-astro-data/docker-compose.yml` in a prior session.

**Fix (requires VPS session):**
1. Locate where encryption-svc actually runs (`docker ps` on VPS).
2. Add `healthcheck` and `restart: unless-stopped` to its compose definition.
3. Recreate the container.

**Original priority:** 🟡 P2 · **Session type:** VPS session · **Bundle:** with STATUS-TD-02

---

# Tier 2 — Immediate Post-Go-Live

First-week post-launch work. Items 6–7 share a single VPS session (same SSH context, same Docker Compose surface) and should bundle. Item 8 (TD-NEW-020) is deliberately scoped as a separate session — it's the CI/CD pilot for the project, exercised through a lower → higher environment promotion path with rollback drill.

---

### STATUS-TD-01 · Mumbai VPS full security hardening

**Source:** STATUS.md TD-01 (carry-forward)
**Finding:** VPS security baseline is incomplete. Full checklist in `docs/INFRA.md` and `docs/STATUS.md`. Key gaps: Docker port isolation, SSH key-only auth, Linode firewall rules, stale DNS records, CF Tunnel hardening.

**Fix:** Follow the full STATUS.md TD-01 checklist in a dedicated VPS session. Requires SSH + Docker access on `root@45.79.125.184`.

**Original priority:** 🔴 Critical · **Session type:** VPS session

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

**Original priority:** 🟡 P2 · **Session type:** VPS session · **Bundle:** with STATUS-TD-01

---

### TD-NEW-020 · No HMAC verification on Meta webhook (WF-00) or Slack events (WF-10)

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-020 (also STATUS TD-03 / TD-04)
**Finding:** WF-00 (`JQu1MkK5vgtUCeNO`) and WF-10 (`hPJ09L4rQ6MdQRiN`) are publicly reachable via CF Tunnel Bypass and accept any payload without verifying the sender. Forged WF-00 payloads can drive user impersonation in active consultations, silent STOP-on-behalf-of-user, and WABA message-budget drain. Forged WF-10 payloads are bounded by DR-13 channel scoping (user-targeted admin commands require the user's randomly-generated consult-channel ID, which is effectively unguessable from outside the workspace) but the WF-10 fix is bundled here for parity and atomicity.

**Fix:**
- WF-00: Verify `X-Hub-Signature-256` HMAC-SHA256 against Meta app secret before processing any payload.
- WF-10: Verify `X-Slack-Signature` HMAC-SHA256 against Slack signing secret before processing any event (incl. 5-min timestamp replay-window check + preservation of Slack's `url_verification` handshake).

Both fixes are a single Code node added as the first step after the webhook trigger. Realistic effort: half a day; full day if raw-body access in the current n8n version is awkward.

**Execution framing (added 2026-05-27):** This item is the **CI/CD pilot for the project** — chosen deliberately as the first change to flow through a lower → higher environment promotion with full rollback planning. The deliverable for plan-sprint includes the CI/CD path itself (lower env → verification → higher env → rollback drill), not just the two Code nodes. Implies a lower environment exists, or its setup is part of the sprint scope. Plan-sprint should surface this scoping question before producing the plan.

**Why post-launch (revised from Tier 1 on 2026-05-27):** With DR-13 in place, the silent-admin-action attack on WF-10 effectively requires being inside the Slack workspace (consult-channel IDs are random). Remaining WF-00 risks (impersonation in active consult, silent STOP, WABA drain) are real but require URL discovery against an unpublished n8n subdomain — not a day-1 launch blocker. Deferring to first-week post-launch is acceptable given the unpublished hostname and the value of using this item as the CI/CD shakedown.

**Original priority:** 🟠 P1 · **Session type:** n8n session (CI/CD pilot — separate from VPS bundle)

---

# Tier 3 — Before Significant User Volume

P2 reliability and UX hardening. Address in the first 1–2 weeks of live operation, before scaling user acquisition.

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

**2026-05-30 update (BMX missing-axes Opus sweep — confirmed instances added to this scope):** The behavior-matrix sprint's missing-axes sweep ground-truthed specific zero-row silent-halt cases (report `docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/BMX-P5-DRIFT-report.md` §2.6, check `T2`). Two were fixed in that sprint (WF-47 opt-out ack; WF-11 LIST empty-state — both designed-empty cases, not missing-record). The remaining **six are deferred here** under the data-contract reasoning (if a leaf received a user envelope, the record exists; a genuinely-missing record is a post-MVP edge case): **WF-10** (orphan consult-channel), **WF-31** (relay when no payment row), **WF-33** (second APPROVE / no pending payment), **WF-34** (REJECT / no pending payment), **WF-45** (rebook / no user row), **WF-60** (logging for pre-onboarding phone). Also folded in (D3): **WF-45 `T1` re-SELECT** of core envelope fields its callers already forward (design §3.4 deliberately excluded WF-45 from Phase-1 cleanup) and **WF-45 `T5`** string-interpolated phone in SQL — handle alongside the WF-45 zero-row work since WF-45 isn't otherwise touched this sprint. Per-finding evidence + proposed fix are in report §2.6.

**Original priority:** 🟡 P2 · **Session type:** n8n session

---

### TD-NEW-035 · Application-level silent-swallow of send/alert failures (continue-on-error class)

**Source:** BMX missing-axes Opus sweep 2026-05-30 (`BMX-P5-DRIFT-report.md` §2.6 check `T3`, plus the §1.4 HIGH for WF-22). Deferred from `behavior-matrix-fixes-2026-05-27` per operator decision (D1) — to be scoped into the already-planned application-level error-handling work.

**Finding:** A recurring pattern where an outbound WhatsApp/Slack send (or a sub-workflow call) is set to `onError: continueRegularOutput`, so a failure leaves the side-effect undelivered while the workflow reports success — no fallback, no admin alert. Two severities:
- **User-facing sends silently dropped** (no admin visibility): **WF-21** (welcome/form), **WF-23** (pre-form clarifier/deflection/form-resend), **WF-25** (stop-clarifier / garbage-warning sends, *and* the U2 garbage-count call whose failure silently bypasses the block safety-net), **WF-45** (rebook active/setup/under-review sends).
- **Admin-alert sends silently dropped** (worse — the system asserts the admin was notified when they were not): **WF-53** (Gemini-failure escalation — halt message claims "admin alert dispatched"), **WF-61** (auto-block alert — the only audit signal for a system-initiated block).
- **HIGH (write-failure swallowed):** **WF-22** `Create User Record` is `continueRegularOutput` → on INSERT failure the flow still creates the Slack channel and sends the "pay ₹500" instructions for a **non-existent user**, with no admin alert (report §1.4 finding 1, HIGH).

**Fix (project-level policy — decide once, apply across the class):**
- Admin-facing alerts (WF-53, WF-61): let failure **surface as a failed execution** (drop `continueRegularOutput`) or re-route to a guaranteed channel — never silently swallow the last line of defence; at minimum stop asserting "dispatched" when it may not have.
- User-facing sends (WF-21/23/25/45): keep non-blocking but add a **Slack admin alert on the error output** ("couldn't deliver to <customer>").
- WF-22 write-failure: add an IF after `Create User Record` checking a row returned; on empty/error, alert the admin and stop (mirror the existing WF-52-failure alert branch) — or drop `continueRegularOutput`.
- WF-25 garbage-count: explicitly default `blocked=false` and alert when the count call errors, so the block safety-net is never silently bypassed.

**Why deferred:** This is the same application-level error-handling design the operator already has planned; doing it piecemeal per-workflow risks an inconsistent policy. The WF-22 HIGH is real but customer-impact requires a first-write failure (rare) and the remediation is the same design.

**Priority hint:** 🟡 P2 (reliability) — scope into the planned application-level error-handling effort. **Session type:** n8n session (design + apply).

**Original priority:** 🟡 P2 · **Session type:** n8n session

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

**Original priority:** 🟡 P2 · **Session type:** n8n session

---

### TC-0702 · Blocked user message attempt not logged

**Source:** .methodology/sprint-tech-debt-2026-05-14-followups.md (TC-0702, deferred post-MVP)
**Finding:** WF-01 `Silent Reject (Blacklist)` is a true dead-end — silent drop behavior is correct (blocked user gets no reply), but there's no audit trail of repeated attempts.

**Fix (revised 2026-05-20):** Log the blocked-attempt event as a normal inbound message via WF-60 (with `message_type='blocked_attempt'` or via metadata). The original 2026-05-16 plan to `INSERT INTO chinmay_astro.admin_actions` is **superseded** — see `TD-NEW-026` (admin_actions table removal) below; once removal lands, admin_actions no longer exists. The blocked-attempt event remains worth logging — just to the messages table.

**Original priority:** 🟡 P2 · **Session type:** n8n session

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

**Original priority:** 🟡 P2 · **Session type:** Design pass + scheduled agent

---

### TD-NEW-036 · WF-30 / WF-31 off-topic counting (D6 consistency with WF-43)

**Source:** Safety-net design spec §12.7 + `behavior-matrix-fixes-2026-05-27` BUG-06b. Deferred 2026-05-31.
**Finding:** BUG-06b added off-topic-but-legitimate counting/blocking (D6) to WF-43's `general_enquiry` Gemini pass-through — off-topic messages are now logged + counted + blockable via U2/WF-61 (`reason='off_topic'`, threshold 10). The **same uncounted pass-through-Gemini vector still exists in the payment-stage handlers** WF-30 (`payment_pending`) and WF-31 (`payment_submitted`): a user can send unbounded off-topic chatter that hits Gemini without being counted toward the abuse threshold.

**Fix:** Mirror the WF-43 D6 pattern in WF-30/31 — after the Gemini response, branch on `valid_user_message===false` → call U2/WF-61 with `reason='off_topic'`, threshold 10, then send the graceful redirect (or end silently if blocked). Reuse WF-43's `Off-Topic?` → `Build U2 Off-Topic Payload` → `Call U2` → `Blocked by U2?` sub-chain.

**Why deferred:** Payment-stage users are invested (lower abuse risk than post-consult); WF-43 closes the largest vector. Revisit when WF-30/31 prompts are next touched, or before scale-up.

**Original priority:** 🟡 P2 (cost-control / consistency) · **Session type:** n8n session

---

### TD-NEW-037 · WF-53 (U1) emits the user-facing sentence even for non-user-facing callers

**Source:** `behavior-matrix-fixes-2026-05-27` followups.md §52 (BMX-P0-U1 build). Deferred 2026-05-29.
**Finding:** U1 (`WF-53`, the Gemini-failure escalation utility) always includes the user-facing apology sentence in its output, regardless of the `userFacing` flag the caller passes. Harmless today because every live U1 caller IS user-facing — but the moment a non-user-facing U1 caller is introduced, it would leak a user-apology into an internal/admin path. Pseudo documents the always-included behavior + a deferred-improvement note pointing here.

**Fix:** Make the user-facing sentence conditional on `userFacing===true` in **live + pseudo together** (the sync rule requires both). Low effort, single Code/Set branch.

**Why deferred:** No non-user-facing U1 caller exists yet, so zero current impact. Apply when such a caller is introduced, or alongside the next WF-53 touch.

**Original priority:** 🟡 P2 (latent contract bug) · **Session type:** n8n session

---

# Tier 4 — Needs Design Decision

These items require scope discussion before `plan-sprint` can produce an actionable plan. Do NOT pick up directly — surface to user first.

---

### STATUS-TD-06 · WF-73 Data Cleanup workflow does not exist

**Source:** docs/Tech_Debt_2026-05-14.md STATUS-TD-06
**Finding:** STATUS.md references WF-73 Data Cleanup for personal data retention compliance. The workflow does not exist in n8n. Before significant user volume, `consultation_history`, `messages`, and related tables need a scheduled cleanup or archival policy.

**Decision required:** Build WF-73 now as a background job, or defer until user volume justifies it? If building: define retention window (e.g., purge messages older than 90 days), what to keep (consultation metadata vs. message content), and schedule (weekly cron).

**Original priority:** 🔵 Needs-Decision · **Session type:** n8n session

---

### TD-NEW-033 · Admin → User "hotline" relay outside `consultation_active`

**Source:** Surfaced 2026-05-26 during `pre-go-live-final-follow-up-2026-05-26` sprint walkthrough (TD-PGF-09 discussion).
**Finding:** The current Admin → User relay path (WF-40/WF-41 chain via WF-10's `consult-{phone}` channels) only routes when the user is `consultation_active`. State-gate added in SP-03's central `State Match?` IF on WF-10. Any admin message in a consult channel while the user is in another state (e.g., `payment_submitted`, `consultation_closed`, `opted_out`, `blocked`) does NOT reach the user.

**Gap surfaced:** there is no explicit admin-initiated path to message a user in ANY state outside `consultation_active`. Concrete need case: after a TD-PGF-09 Gemini-classifier halt (sprint `pre-go-live-final-follow-up-2026-05-26`), the admin receives a Slack alert and may want to (a) apologise to the user, (b) offer a free consultation as goodwill — but the relay is closed because the user isn't in `consultation_active`. Same need for any ad-hoc admin outreach (e.g., reaching a `payment_pending` user who's been stuck, or proactively messaging an `opted_out` user with an offer — assuming the user has not invoked STOP).

**Proposed fix (post-MVP design):** Introduce a dedicated admin command — suggested form `MSG <phone> <text>` — typed in `chinmay-admin-commands` (or in the user's consult channel) that:
1. Looks up the user by phone (must exist in `users`; reject if not found).
2. Respects `blocked` and `opted_out` states (refuse to send; surface a polite admin warning explaining why).
3. Invokes WF-50 directly with the admin's text body, bypassing the WF-40/41 state-gated relay.
4. Logs the outbound message to `messages` table for audit trail.
5. Posts a Slack confirmation back to the admin showing the message was sent.

**Touches:**
- WF-10 (new command parser + routing) + WF-11 (command handler) or a new sibling workflow WF-13 (Admin Direct Message Handler).
- WF-50 caller from the new path (canonical §2.3 contract).
- Pseudo for the new handler + updates to WF-10/11 admin-command surface docs.
- CLAUDE.md DR-13 update — clarify which admin commands work in which channels for the new `MSG` verb.

**Why deferred to post-MVP:** Not a go-live blocker. Existing flows work; the gap manifests as "admin can't reach user outside active consultation" which is a known intentional state-gate. The TD-PGF-09 free-consultation use-case is the most concrete trigger but it's an exception path; admin can also call/text the user out-of-band via stored phone number as a fallback for MVP.

**Priority hint:** 🔵 Needs-Decision (post-MVP) — depends on how often the gap is hit in practice. Could also be designed as part of a broader admin-ops sprint.

**Original priority:** 🔵 Needs-Decision · **Session type:** n8n session

---

### TD-NEW-038 · S10 — NULL / out-of-enum `users.status` hard-throws at the WF-02 data-contract guard

**Source:** `behavior-matrix-fixes-2026-05-27` BMX-P5-MATRIX S10 row + followups.md §138. **PARKED post-MVP by operator 2026-05-30.**
**Finding:** A `users` row whose `status` is NULL or a value outside the enum hard-throws at WF-02's data-contract guard (`WorkflowHasIssuesError`) — the entire S10 matrix row (8 cells) is 🛑. This is a regression introduced by the 2026-05-24 data-contract sprint, pre-dating this sprint. No normal flow produces a NULL/out-of-enum status (it's should-never-happen data corruption); failed executions remain visible in n8n execution history.

**Decision required (if un-parked):** Should WF-02 (a) fail-loud as today (throw → visible in execution history), (b) route NULL/unknown status to a graceful admin-anomaly alert (like the SP-11 user-load gate pattern) and silent-drop, or (c) coerce unknown→a safe default state? Operator parked it because the trigger is data corruption, not a user-reachable path.

**Why deferred:** Operator-accepted carve-out; the matrix exit gate (BMX-P5-MATRIX) closed with S10 explicitly excluded. Not a go-live blocker.

**Original priority:** 🔵 Needs-Decision (parked) · **Session type:** n8n session

---

# Tier 5 — Functional Polish

Improvements that should follow real-usage signal — pick up when actual data shows the bucket is too coarse or the response is too generic.

---

### TD-NEW-042 · Post-consultation "Welcome back" should be gap-aware (DB last-contact lookup)

**Source:** Sprint `pre-demo-minor-fixes-31May26` (2026-06-07) — deferred **Option A** from the WF-43 welcome-back fix. Option B (time-neutral copy, no "welcome back") shipped this sprint; Option A deferred here.

**Finding:** WF-43 post-consultation Gemini replies can't tell whether the user is returning minutes or days after their consultation closed, so a static "Welcome back" reads incoherently right after a just-completed consult. The shipped fix (Option B) makes the copy time-neutral.

**Enhancement (Option A):** add a DB lookup of the user's last contact — `gap = current message time − previous message time` from `chinmay_astro.messages` (exclude the current inbound; compute in UTC). Set `shouldWelcome = gap > 12h` **deterministically in code**, then feed Gemini an explicit directive (welcome-back vs not). Keeps the decision deterministic (consistent); Gemini only phrases warmly. Default `shouldWelcome=false` if no prior message.

**Bundle hint:** best done **alongside PDF-02 / PDF-03** (deferred this sprint). Those add DB-context-injection into a Gemini prompt (WF-10 admin assistant: user-state + message/consultation history lookup). Same technique — DB lookup → inject context block → Gemini — so the lookup helper + prompt-injection pattern can be shared. (PDF-02/03 are WF-10 admin-side; this is WF-43 customer-side — different workflows, same pattern.)

**Priority:** 🟢 P3 — functional polish, behind real-usage signal.

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

**Original priority:** 🟡 P2 (functional polish) · **Session type:** n8n session

---

### TD-NEW-039 · WF-43 retention-tied re-engagement tone graduation (downstream of STATUS-TD-06)

**Source:** `behavior-matrix-fixes-2026-05-27` followups.md §161 Part 1 (D7 convergence). The `wasOptedOut` MECHANISM shipped in BMX-D7; this is the remaining graduation.
**Finding:** BMX-D7 gave WF-43 uniform re-engagement warmth for opted-out users (button → welcome-back; text → opted-out-aware Gemini prompt). The deeper nuance is still flat: an opted-out re-engager who **never actually consulted** (opted out pre-consultation) should be *actively wooed back* and re-onboarded; one whose **birth details were purged** by the future retention job (STATUS-TD-06 / WF-73) genuinely no longer has details on file → Gemini should honestly say "we'd need your details again" and re-collect the form; a *recent* closed user still has details → light nudge, rebook reuses them. Today all three get the same warmth and Gemini still answers "yes, we have your details."

**Fix (post-MVP, downstream of STATUS-TD-06):** once the retention/deletion job exists, branch WF-43's re-engagement on "do we still hold this user's details?" rather than just `wasOptedOut` — woo + re-collect when purged, light nudge when retained. Keep the D7 gate as the structural hook.

**Why deferred:** Genuinely downstream of the data-retention job (STATUS-TD-06) — meaningless until PII is actually purged after a window. Operator judged the whole retention+graduation workstream overengineering for the first roll-out.

**Original priority:** 🟡 P2 (UX polish) · **Session type:** n8n session · **Depends on:** STATUS-TD-06 / WF-73

---

### TD-NEW-040 · WF-43 — unrecognized button from a (normal) closed user falls to the feedback-prompt catch-all

**Source:** `behavior-matrix-fixes-2026-05-27` BMX-P5-MATRIX S6×I (matrix ⚠️). Surfaced during D7 button-cascade review.
**Finding:** In WF-43's button cascade, any `button_reply.id` that is not `btn_done` or `btn_rebook` falls through to the **feedback-prompt** catch-all (Step 9). So a *normal* `consultation_closed` user who taps a stale "Payment Completed" button (or any other old button) gets "✍️ please share your feedback…" — a benign but mismatched response. (The opted-out variant is handled by the D7 gate; this is the non-opted-out residual.)

**Fix (post-MVP):** add an explicit id check (or a small Switch) for known stale buttons (e.g. payment_completed) → route to a more appropriate response (e.g. "that consultation is already closed — reply REBOOK for a new reading") instead of the generic feedback prompt. Low effort.

**Why deferred:** Contrived (a closed user tapping a stale payment button); response is benign. Pick up behind real-usage signal.

**Original priority:** 🟢 P3 (edge polish) · **Session type:** n8n session

---

# Tier 6 — Repo Hygiene

Low urgency. Batch when convenient — most are 5-minute git/local edits.

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

**Original priority:** 🟢 P3 · **Session type:** n8n + Postgres

---

### TD-NEW-034 · Pseudo doc-hygiene bulk cleanup (23 drift items)

**Source:** Surfaced 2026-05-26 during `pre-go-live-final-follow-up-2026-05-26` sprint walkthrough (TD-PGF-10 deferral). Original source: `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md`.

**Finding:** The 2026-05-24 pseudo-vs-md drift evaluation identified 32 items. Most real-bug items have been resolved (TD-DRIFT-001 → TD-PGF-02 in current sprint; TD-DRIFT-006/007/017 → TD-DCP-104/113/112 closed in `data-contract-sprint-bug-fix`; TD-DRIFT-009/012/013/015/026 → TD-PGF-05 in current sprint). The remaining **23 items are `.pseudo`-only documentation drift with zero live-code impact**:

`TD-DRIFT-002, -003, -004, -005, -008, -010, -011, -014, -016, -018, -019, -020, -021, -022, -023, -024, -025, -027, -028, -029, -030, -031, -032`

Each is a documentation-discipline edit: structured Inputs blocks missing per the D9 rubric, linear renumbering (drop tombstone steps per `feedback_pseudo_linear_numbering`), prose-only Inputs replaced with structured required/optional/types declarations, etc.

**Fix:**
1. Resurrect the `pseudo-md-drift-fixes-2026-05-24/tasks.md` scope, filtered to the 23 items above.
2. Trigger: AFTER full functional testing of the MVP is complete.
3. Execution mode: candidate for Haiku subagent fan-out per `[[feedback_subagent_discipline]]`. Wallclock ~30–60 min with 5–8 parallel subagents; alternative is ~3–4 hours inline. Each item is well-scoped and tech-agnostic (no live n8n state needed during edit).
4. Per-WF: read existing `.pseudo`, apply specific fix per `pseudo-md-drift-fixes-2026-05-24/tasks.md`, no live touch.
5. Slug suggestion: `pseudo-hygiene-post-mvp-<YYYY-MM-DD>`.

**Incremental reduction in current sprint:** `pre-go-live-final-follow-up-2026-05-26` includes a per-workflow drift-check practice (TD-PGF-10 directive) that opportunistically folds trivial pseudo-fixes into items touching those workflows. Structural drift gets deferred to this future sprint with the deferred-bulk list captured in the source sprint's execution notes.

**Priority hint:** 🟢 P3 — pure documentation. Zero runtime impact. Affects only future reasoning sessions reading stale design specs (`assert-md-fresh.sh` already covers the `.md` projection layer).

**Original priority:** 🟢 P3 · **Session type:** n8n session

---

### TD-NEW-024 · scripts/ directory is empty (CLAUDE.md references 3 scripts)

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-024
**Finding:** CLAUDE.md and methodology stop hooks reference `scripts/backup-workflow.sh`, `scripts/export-all-workflows.sh`, and `scripts/build-dependency-map.sh`. All three are missing.

**Fix:** Write the three scripts:
- `scripts/backup-workflow.sh <WF-ID>` — fetches single workflow JSON to `archive/backups/`
- `scripts/export-all-workflows.sh` — exports all workflows with `jq --sort-keys` + secrets scan
- `scripts/build-dependency-map.sh` — regenerates `docs/dependency-map.md`

**Original priority:** 🟢 P3 · **Session type:** Git/local

---

### TD-NEW-022 · workflows/*.json are single-line minified

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-022
**Finding:** All workflow exports are single-line JSON — diffs are unreadable, code review is impossible.

**Fix:** Update `scripts/export-all-workflows.sh` to pipe through `jq --sort-keys`. Reformat all existing exports in one pass.

**Original priority:** 🟢 P3 · **Session type:** Git/local · **Depends on:** TD-NEW-024 (script must exist first)

---

### TD-NEW-021 · archive/backups/ has 68 dated JSON snapshots

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-021
**Finding:** 68 individual workflow JSON snapshots in `archive/backups/`, one is 0-byte (mangled). Git history is noisy; directory is hard to navigate.

**Fix:** `tar czf archive/backups/pre-20260514.tar.gz archive/backups/*.json && git rm archive/backups/*.json && git add archive/backups/pre-20260514.tar.gz`

**Original priority:** 🟢 P3 · **Session type:** Git/local

---

### TD-NEW-023 · docs/.DS_Store committed to repo

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-023
**Fix:** `git rm --cached "docs/.DS_Store"` and add `**/.DS_Store` to `.gitignore`.

**Original priority:** 🟢 P3 · **Session type:** Git/local

---

### TD-NEW-025 · 3 stale deleted workflow exports still in workflows/

**Source:** docs/Tech_Debt_2026-05-14.md TD-NEW-025
**Finding:** `fdlIpl67amL2Ho6U.json`, `yIZwO3CZk6bOBAXl.json`, `z6as85o3b1zK22eF.json` — workflows deleted from n8n (TD-013) but JSON files remain committed.

**Fix:** `git rm workflows/fdlIpl67amL2Ho6U.json workflows/yIZwO3CZk6bOBAXl.json workflows/z6as85o3b1zK22eF.json`

**Original priority:** 🟢 P3 · **Session type:** Git/local

---

### TD-NEW-041 · Eager pattern-error markers on WhatsApp Flow form fields (BUG-04)

**Source:** `behavior-matrix-fixes-2026-05-27` live smoke 2026-05-31 (BUG-04). Operator said "move on for now" — cosmetic, non-blocking.
**Finding:** The published Flow form (`collect-birth-details.json`, Flow ID `1137788551887662`) shows pattern-validation error markers on fields eagerly (before/while typing), even after the `(...)?` optional-pattern wrap. Cosmetic — submission still works; the markers just look like premature errors.

**Fix (post-MVP):** revisit the field `pattern` / `error-message` config in the Flow JSON so validation markers only fire on a genuine invalid completed value, not eagerly. Test in the Flow builder preview + a live submission.

**Why deferred:** Pure cosmetic; onboarding completes correctly. Operator explicitly deferred.

**Original priority:** 🟢 P3 (cosmetic) · **Session type:** Flow JSON + Meta Flow builder

---

## Summary Table (execution order)

| # | Tier | ID | Issue | Original priority | Session type |
|---|------|----|-------|-------------------|--------------|
| 1 | 1 — Pre-Go-Live | TD-NEW-001 | GitHub PAT in Google Drive-synced settings | 🔴 Critical | Local machine |
| 2 | 1 — Pre-Go-Live | WF-30-UX | Payment reminder missing fresh payment button | 🟡 P2 | n8n session |
| 3 | 1 — Pre-Go-Live | STATUS-TD-02 | Automated daily DB backups | 🔴 Critical | VPS session |
| 4 | 1 — Pre-Go-Live | STATUS-TD-05 | Encryption svc — no healthcheck or restart policy | 🟡 P2 | VPS session |
| 5 | 2 — Immediate post-launch | STATUS-TD-01 | Mumbai VPS full security hardening | 🔴 Critical | VPS session |
| 6 | 2 — Immediate post-launch | TD-NEW-019 | n8n execution history never pruned | 🟡 P2 | VPS session |
| 7 | 2 — Immediate post-launch | TD-NEW-020 | HMAC on Meta (WF-00) / Slack (WF-10) webhooks — **CI/CD pilot** | 🟠 P1 | n8n session (separate) |
| 8 | 3 — Before volume | FU-7-DEFERRED | Project-wide DB-lookup hygiene audit (+ 6 BMX zero-row cases, WF-45 re-SELECT/SQL) | 🟡 P2 | n8n session |
| 8a | 3 — Before volume | TD-NEW-035 | Silent-swallow of send/alert failures (incl. WF-22 HIGH) — app-level error handling | 🟡 P2 | n8n session |
| 9 | 3 — Before volume | TD-NEW-032 | WF-20 HELP response generic, not status-aware | 🟡 P2 | n8n session |
| 10 | 3 — Before volume | TC-0702 | Blocked user attempt logged via WF-60 | 🟡 P2 | n8n session |
| 11 | 3 — Before volume | TD-NEW-027 | Periodic health-check infrastructure (design pass) | 🟡 P2 | Design + scheduled agent |
| 12 | 4 — Needs decision | STATUS-TD-06 | WF-73 Data Cleanup — does not exist | 🔵 Needs-Decision | n8n session |
| 13 | 4 — Needs decision | TD-NEW-033 | Admin → User "hotline" relay outside consult-active | 🔵 Needs-Decision | n8n session |
| 14 | 5 — Functional polish | TD-NEW-031 | State-filter passthrough bucket → per-intent branches | 🟡 P2 | n8n session |
| 15 | 6 — Hygiene | TD-NEW-026 | Drop chinmay_astro.admin_actions table | 🟢 P3 | n8n + Postgres |
| 16 | 6 — Hygiene | TD-NEW-034 | Pseudo bulk cleanup — 23 `.pseudo`-only drift items | 🟢 P3 | n8n session |
| 17 | 6 — Hygiene | TD-NEW-024 | scripts/ empty — 3 referenced scripts missing | 🟢 P3 | Git/local |
| 18 | 6 — Hygiene | TD-NEW-022 | workflows/*.json single-line minified | 🟢 P3 | Git/local |
| 19 | 6 — Hygiene | TD-NEW-021 | archive/backups/ 68 snapshots — needs tarring | 🟢 P3 | Git/local |
| 20 | 6 — Hygiene | TD-NEW-023 | docs/.DS_Store committed to repo | 🟢 P3 | Git/local |
| 21 | 6 — Hygiene | TD-NEW-025 | 3 stale deleted workflow JSONs in workflows/ | 🟢 P3 | Git/local |
| 22 | 3 — Before volume | TD-NEW-036 | WF-30/31 off-topic counting (D6 consistency with WF-43) | 🟡 P2 | n8n session |
| 23 | 3 — Before volume | TD-NEW-037 | WF-53 (U1) leaks user-facing sentence to non-user-facing callers | 🟡 P2 | n8n session |
| 24 | 4 — Needs decision | TD-NEW-038 | S10 NULL/out-of-enum status hard-throws at WF-02 guard (PARKED) | 🔵 Needs-Decision | n8n session |
| 25 | 5 — Functional polish | TD-NEW-039 | WF-43 retention-tied re-engagement tone graduation (dep STATUS-TD-06) | 🟡 P2 | n8n session |
| 26 | 5 — Functional polish | TD-NEW-040 | WF-43 unrecognized button → feedback catch-all (S6×I) | 🟢 P3 | n8n session |
| 27 | 6 — Hygiene | TD-NEW-041 | Eager pattern-error markers on Flow form fields (BUG-04) | 🟢 P3 | Flow JSON |

---

## Promotion Rationale — 2026-05-27

The four Tier 1 items were elevated from later positions in the original 2026-05-16 backlog. Reasoning per item, recorded here so plan-sprint does not need to re-litigate:

- **TD-NEW-001 (GitHub PAT):** Credentials-leak risk exists *now*, independent of go-live. Two-minute fix. Promoted to position 1 because there is no reason to wait.
- **WF-30-UX (fresh payment button):** A `payment_pending` user who says "I just paid" gets told to scroll up. Some won't, and the payment is lost. Single-node change. Revenue impact at the most fragile point in the user funnel.
- **STATUS-TD-02 (DB backups):** Going live without backups is the textbook go-live blocker. Schema contains DOB, birth time, consultation history. No recovery path from VPS failure once real users start writing.
- **STATUS-TD-05 (encryption-svc healthcheck):** WF-22 (form submission) is the **first DB write** in the user journey. If `encryption-svc` crashes, every onboarding bricks silently until someone notices. Small Docker-compose change, large blast radius on the onboarding funnel.

Two of the four (STATUS-TD-02, STATUS-TD-05) share a single VPS session, so the operational cost of the promotion is one extra VPS session and one quick n8n session in the pre-launch window.

### Demotion Note — TD-NEW-020 (HMAC verification)

TD-NEW-020 was briefly proposed for Tier 1 during the 2026-05-27 triage but moved to Tier 2 on the same day after closer analysis:

- DR-13 (admin command channel scoping) reduces the WF-10 silent-admin-action attack to require knowledge of randomly-generated consult-channel IDs — effectively unguessable from outside the Slack workspace.
- Remaining WF-00 risks (user impersonation in active consult, silent STOP, WABA budget drain) are real but require the attacker to first discover an unpublished n8n subdomain.
- The fix itself is small (half a day) but was tagged by the operator as the project's CI/CD pilot — meriting deliberate scoping through a lower → higher environment promotion path with rollback drill, which is not pre-launch work.

Plan-sprint should treat TD-NEW-020 as a process exercise (CI/CD shakedown) as much as a code change. See its execution-framing block in Tier 2.
