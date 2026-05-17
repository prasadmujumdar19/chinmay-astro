# Sprint Working Copy — tech-debt-2026-05-14

Source: `docs/Tech_Debt_2026-05-14.md` (read-only — status tracked here)

---

## Batch 1 — P0 (Security / Data Integrity)

### TD-NEW-001 · GitHub PAT stored in `~/.claude/settings.json` — synced via Google Drive
> **Status:** 🟡 Needs Decision — 2026-05-14 | Outside project codebase. User must: (1) rotate PAT at github.com/settings/tokens, (2) run `gh auth login`.

### TD-NEW-002 · WF-01 opted-out routing dead — opted-out users can never re-engage
> **Status:** ✅ Done — 2026-05-14 | Layer 3 now emits OPTED_OUT vs REJECTED; Lookup SQL adds status column; WF-21 re-engagement path unblocked.

### TD-NEW-003 · WF-25 cannot emit stop_intent — all stop_intent branches dead
> **Status:** ✅ Done — 2026-05-14 | stop_intent added to Gemini prompt enum + description, VALID whitelist, and Route by Intent Switch (rule 8 → Return to Caller).

### TD-NEW-004 · WF-20 never called — STOP/HELP/REBOOK keywords broken
> **Status:** ✅ Done — 2026-05-14 | WF-02 now intercepts text messages via WF-20 before state routing. Interactive messages bypass directly to Route Switch. Keyword Passthrough? IF restores route context for non-keyword messages.

### STATUS-TD-01 · Mumbai VPS full security hardening
> **Status:** 🟡 Needs Decision — 2026-05-14 | Infrastructure — requires VPS SSH access. Decide: (A) tackle now, (B) defer post-go-live.

### STATUS-TD-02 · Automated daily DB backups
> **Status:** 🟡 Needs Decision — 2026-05-14 | Infrastructure — requires VPS SSH access + Linode storage. Decide: (A) tackle now, (B) defer post-go-live.

---

## Batch 2 — P1 (Functional Gaps)

### TD-NEW-005 · WF-10 commandKeywords missing UNBLOCK
> **Status:** ✅ Done — 2026-05-14 | Added 'UNBLOCK' to commandKeywords arrays in both Detect Command nodes (Admin + User channels).

### TD-NEW-006 · WF-32 active=false — verify intentional
> **Status:** ✅ Done — 2026-05-14 | Activated. Caller WF-02 (critical path) invokes on payment_completed tap.

### TD-NEW-007 · WF-40 has no STOP intercept during consultation_active
> **Status:** ✅ Done — 2026-05-14 | Added 'Is STOP Intercept' IF + Prepare J-19 Response + Call WF-50 nodes. WF-40 now 7 nodes total.

### TD-NEW-008 · WF-43 has no stop_intent branch [depends on TD-NEW-003]
> **Status:** ✅ Done — 2026-05-14 | Added 'Stop Intent?' IF + Call WF-47 Unsubscribe. WF-43 now 16 nodes; inserted between WF-25 call and Rebook Intent? branch.

### TD-NEW-009 · WF-22 "User Already Exists" branch sends empty workflowInputs to WF-50
> **Status:** ✅ Done — 2026-05-14 | 'User Already Exists' Code node now emits phoneNumber/messageType=text/messageBody re-engagement payload.

### TD-NEW-010 · WF-11 STATS command unroutable — outputKey mismatch
> **Status:** ✅ Done — 2026-05-14 | Fixed Switch rule 5 rightValue (was 'STATUS') and outputKey to 'STATS'. Admin STATS now routes correctly.

### TD-NEW-011 · WF-25 passes null userStage — classifier noise
> **Status:** ✅ Done — 2026-05-14 | Option A — userStage removed from WF-25 prompt + destructure; 5 callers (WF-23/30/31/43/44) no longer pass userStage in workflowInputs.

---

## Batch 3 — P2a (Code Hygiene — lower risk)

### TD-NEW-013 · WF-60 writes orphan rows with fake userId=9, consultationId=2
> **Status:** ✅ Done — 2026-05-14 | Surgical patch on 'Log to Messages Table' queryReplacement — removed `|| 9` and `|| 2` fallbacks. user_id NOT NULL constraint surfaces errors loudly (no orphan rows); consultation_id nullable so NULL stores cleanly. Disconnected legacy chain in WF-60 logged as followup.

### TD-NEW-014 · WF-22 has 7 disabled stale nodes (schema regression hazard)
> **Status:** ✅ Done — 2026-05-14 | Removed 7 disabled nodes (Webhook: Form, Encryption Service, Format Response, Respond to Webhook, Sticky Note, Log: Webhook Call, Update User in DB). WF-22 now 10 nodes, 0 disabled. Schema-prefix regression hazard eliminated.

### TD-NEW-015 · WF-00 has 7 disabled nodes on active webhook path
> **Status:** ✅ Done — 2026-05-14 | Removed 7 disabled nodes (Webhook Verification, Handle Verification, Return Challenge, Webhook, Code in JavaScript, Respond to Webhook, Sticky Note1). WF-00 now 12 nodes, single webhook trigger, no activation ambiguity.

### TD-NEW-019 · n8n execution history grows indefinitely
> **Status:** 🔴 Blocked — 2026-05-14 | User deferred to dedicated VPS infra session (alongside STATUS-TD-01/02/05). n8n env vars live in /mnt/chinmay-astro-data/.env.production; needs container recreate.

### STATUS-TD-05 · Encryption service container monitoring
> **Status:** 🔴 Blocked — 2026-05-14 | User deferred. encryption-svc is not in /mnt/chinmay-astro-data/docker-compose.yml — needs investigation of where it runs before scoping. Bundle with infra session.

---

## Batch 4 — P2b (Code Hygiene — higher risk / structural)

### TD-NEW-012 · WF-50 Meta phone-number-id hard-coded in URL
> **Status:** ⏳ Pending

### TD-NEW-016 · No retry/timeout on WF-50, WF-22 enc call, WF-43
> **Status:** ✅ Done — 2026-05-14 | WF-50 (3 nodes) + WF-43 (Gemini) — retryOnFail=true, maxTries=3, timeout=10000. WF-22 enc portion obsolete (node deleted in Batch 3).

### TD-NEW-018 · messages.created_at is timestamp without time zone
> **Status:** ✅ Done — 2026-05-14 | ALTER TABLE … TYPE timestamptz via docker exec postgres-prod. No workflow change needed (NOW() returns timestamptz).

### TD-NEW-020 · No HMAC verification on WF-00 (Meta) or WF-10 (Slack)
> **Status:** ⏳ Pending

---

## Batch 5 — P3 (Repo Hygiene)

### TD-NEW-021 · archive/backups/ has 68 dated snapshots — needs tarring
> **Status:** ⏳ Pending

### TD-NEW-022 · workflows/*.json single-line minified — diffs unreadable
> **Status:** ⏳ Pending

### TD-NEW-023 · docs/.DS_Store committed to repo
> **Status:** ⏳ Pending

### TD-NEW-024 · scripts/ empty but CLAUDE.md references 3 scripts
> **Status:** ⏳ Pending

### TD-NEW-025 · 3 stale deleted workflow JSONs still in workflows/
> **Status:** ⏳ Pending

### STATUS-TD-06 · Data retention WF-73 Data Cleanup
> **Status:** 🟡 Needs Decision — 2026-05-14 | WF-73 doesn't exist yet. Decide: (A) scope + build now, (B) defer post-go-live (recommended).

---

## Sprint Additions (discovered during regression)

### TD-NEW-026 · WF-50→WF-60 logging wiring passes empty workflowInputs [surfaced by TD-NEW-013]
> **Status:** ✅ Done — 2026-05-14 | Three-part fix: WF-50 now maps 8 fields to WF-60; WF-60 Extract Message Data accepts flat shape + dynamic direction; added Has userId? IF + Skip Log (no userId) bypass for pre-DB callers. WF-60 now 11 nodes.

---

## Obsolete

### TD-NEW-017 · WF-22 stale node name
> **Status:** ⚪ Obsolete — Node already named "Ensure Slack Channel Exists (WF-52)" in live n8n.

### STATUS-TD-03 · Meta HMAC verification
> **Status:** ⚪ Obsolete — Duplicate of TD-NEW-020.

### STATUS-TD-04 · Slack HMAC verification
> **Status:** ⚪ Obsolete — Duplicate of TD-NEW-020.
