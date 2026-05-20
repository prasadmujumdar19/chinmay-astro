# Followups — audit-log gaps (BUG-NEW-01, BUG-NEW-02, MINOR-01)

**Surfaced during:** TC-0303 (admin APPROVE PAYMENT, 2026-05-19 10:10Z)
**Scope:** server-side audit/log persistence — does NOT affect user-facing flow
**Severity:** both `[major]` — pre-go-live data observability and compliance
**Pre-existing?** Yes — `chinmay_astro.messages` and `chinmay_astro.admin_actions` have been globally empty across the entire prior smoke session as well. Was masked by the 2026-05-18 timestamptz migration which truncated both tables. TC-0303 is the first scenario after the migration that conclusively confirms inserts are not happening.

---

## BUG-NEW-01 — `chinmay_astro.messages` not being written

### Evidence
- After TC-0303, WF-60 Message Logger executed (id=1315) with `status=success` in **101 ms** (10:10:28.574 → 10:10:28.675). A genuine Postgres insert typically takes 50–200 ms but for this workflow we'd expect a longer total — the suspicious-fast duration suggests an early return or a no-op branch.
- `SELECT COUNT(*) FROM chinmay_astro.messages` returns **0** even though WF-50 ran end-to-end and the WhatsApp confirmation was sent to the user (Slack admin confirms "User notified via WhatsApp").
- Across the entire prior smoke session (2026-05-18), 10+ WhatsApp messages were exchanged in both directions, yet the table remained empty after the migration.

### Hypotheses (in order of likelihood)
1. **WF-60 has a guard that short-circuits** (e.g. `IF $json.skipLog === true` or a misconfigured branch after the timestamptz migration). The 101 ms total wall-clock makes this most likely.
2. **The Postgres insert node is silently failing on a schema mismatch** introduced by the migration. The column list (`user_id, consultation_id, direction, message_type, content, whatsapp_message_id, slack_message_ts, metadata, created_at`) is intact and the data type for `created_at` is now `timestamptz`. If WF-60 was emitting a naked `timestamp` literal it would still coerce, but worth confirming.
3. **WF-60 expects an input contract** (e.g. `userStatus` or a specific shape) and silently returns when the input is malformed — same family of issue as the WF-23 / WF-30 / WF-44 input-contract followup in the prior session.

### Suggested next steps
1. Pull `/api/v1/executions/1315?includeData=true` and inspect the per-node output — identify which node terminated the chain and the input shape at that point.
2. Open WF-60 (`6H75p935FpBVBQtV`) in n8n; verify the Postgres insert node is reached for the WF-50 caller path (admin-confirmation message).
3. If WF-60 has a `direction=outbound` branch and it's gated on a missing field, fix the guard. If it's a true insert failure, the postgres node will log a node-level error in the execution data even though the workflow status is `success` (depends on `alwaysOutputData` / `continueOnFail` config).

### Acceptance
- After fix, a new admin-APPROVE or relay roundtrip lands a row in `chinmay_astro.messages` for both `inbound` and `outbound` directions.
- Backfill is NOT required — pre-go-live, no historical data to recover.

---

## BUG-NEW-02 — `chinmay_astro.admin_actions` not being written

### Evidence
- After TC-0303, WF-33 Payment Approval Processor executed cleanly (id=1313, 2.7 s, all state transitions correct).
- `SELECT COUNT(*) FROM chinmay_astro.admin_actions` returns **0** despite an admin action having just been processed.
- Across the entire prior smoke session, multiple admin commands were executed (APPROVE PAYMENT, CLOSE CONSULT, etc.) — yet the table has remained empty after the migration.

### Hypotheses (in order of likelihood)
1. **No audit-log insert exists in WF-33 (or any admin workflow).** CLAUDE.md describes `admin_actions` as the audit log (and notes its `ON DELETE NO ACTION` FK), but the audit-writing node may have never been built, or was removed during an earlier refactor and never reinstated.
2. **The audit-log insert lives in a sub-workflow that is not being called** (e.g. an "Audit Admin Action" helper that some upstream caller is supposed to invoke but doesn't).
3. **Insert node exists but is silently failing** — same hypothesis 2 from BUG-NEW-01 but applied here.

### Suggested next steps
1. Grep all 28 active workflow JSONs for `admin_actions` table references — confirm whether ANY workflow inserts into it.
   ```bash
   grep -l 'admin_actions' workflows/*.json
   ```
2. If zero hits, the audit-log path was never built and this is a missing feature (still `[major]` for pre-go-live audit compliance).
3. If one or more workflows reference it, inspect why those inserts aren't reaching the DB (likely same root cause family as BUG-NEW-01).

### Acceptance
- After fix, every admin-targeted action (APPROVE, REJECT, CLOSE, BLOCK, UNBLOCK) lands an `admin_actions` row with `user_id`, `action_type`, `performed_by` (Slack user_id of the admin), and `notes` populated.

---

## MINOR-01 — `payments.status` value naming inconsistency

### Evidence
- `payments` table column is `verified_at` (timestamp), implying the post-approval state is "verified".
- After WF-33 approval, the actual value of `payments.status` is `approved` (not `verified`).
- The verb mismatch (`verified_at` column + `status='approved'`) is inconsistent — neither obviously wrong, but a reader of the schema vs the rows could be misled.

### Suggested next steps
- Decide whether the canonical post-approval status is `verified` or `approved`, then align: either rename `verified_at` → `approved_at` (schema change, touches WF-33), OR change WF-33 to set `status='verified'` (data change only). The latter is lower-blast-radius if anything else queries by `status='approved'`.
- Document the chosen value in CLAUDE.md state-machine section.

### Note
This is not a blocker for go-live. Logging here so it's not lost.
