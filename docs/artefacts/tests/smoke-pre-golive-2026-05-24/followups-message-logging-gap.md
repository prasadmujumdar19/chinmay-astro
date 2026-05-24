# Follow-up — GAP-01: WA message-logging audit-trail gap (pre-users-row events)

**Severity:** major
**Surfaced by:** TC-0604 + TC-0605 ticks in this session (2026-05-24)
**Status:** captured for sprint intake — no code/pseudo edits this session

## Finding

During both TC-0604 (user 29) and TC-0605 (user 30), inbound `hi` and outbound WF-21 form messages produced **no** rows in `chinmay_astro.messages`. The trail consistently starts at the first WF-22 invocation (id=106 for user 29; id=110 for user 30). Verified twice:

```sql
SELECT * FROM chinmay_astro.messages
WHERE created_at BETWEEN '2026-05-24T04:57:00Z' AND '2026-05-24T04:58:30Z';
-- 1 row (only the WF-22 outbound). Inbound `hi` + WF-21 outbound missing.
```

Root cause: WF-60 currently keys log inserts on `users.id`. At the moment `hi` arrives and at the moment WF-21 sends the form, no `users` row exists yet (DR-1 defers row creation to WF-22 / form-submit). WF-60 has no FK to attach and drops the event.

## Operator principle (set during this session)

Audit-trail integrity requires that every inbound + outbound WhatsApp event be logged regardless of whether a `users` row exists yet. User-row creation timing (delayed to form submission per DR-1) and message-logging coverage are **independent concerns** and must not be conflated.

## Side observation supporting the fix

On the Slack admin-side, the inbound `APPROVE PAYMENT 61466927921` was correctly logged in `messages` (id=116, `direction=inbound`, `message_type=slack_text`) — WF-10's centralized gate already does what GAP-01 needs WF-60 to do on the WA side. So the fix has a working sibling pattern in the same codebase.

## Sprint intake — design decisions required (pseudo-first per `[[feedback_pseudocode_first_refactor]]`)

1. **Schema decision:** make `messages.user_id` nullable? Or keep NOT NULL and resolve user_id at log time via a phone → users lookup with a fallback (e.g. create a "ghost" users row with status=`pre_form`)? Each has tradeoffs:
   - Nullable: simplest schema change, but breaks every existing query that joins `messages` → `users` without a null-safe predicate. Affects WF-72 / WF-73 / WF-74 plans and any analytics query.
   - Ghost-row: preserves NOT NULL invariant, but introduces a new ephemeral state and changes DR-1's semantic ("first DB write = WF-22 form callback" becomes false).
   - Phone-keyed messages with NULL user_id allowed only pre-form: hybrid; most defensible from data-modeling standpoint, requires a backfill convention for when the user later submits the form.
2. **WF-60 entry-point pseudo revision:** make WF-60 callable without a `user_id`. Define the phone-lookup fallback and the null-handling contract.
3. **Caller pseudo audit:** WF-00 → WF-01 → WF-02 chain currently bypasses WF-60 when no user_id is resolvable. Also WF-21 (welcome+form) and WF-23/WF-30/WF-31 (intent filters emitting clarifiers — though the latter three only fire post-users-row, so likely fine). Revise WF-60.pseudo + WF-21.pseudo + the inbound chain pseudo.
4. **Backfill question:** when a user does eventually submit the form, do we retroactively backfill `user_id` on the pre-existing rows? Probably yes — the audit trail should be coherent for the operator looking back.
5. **GDPR coupling:** see `[[followups-retention-workflows]]` — WF-73 cleanup scope must broaden to purge orphan `messages` rows for stale pending_users.

## Acceptance criteria for the fix

- Send `hi` from a wiped phone → exactly 1 inbound row in `messages` within the same execution wave (joined to the eventual user_id once form is submitted, or recorded with NULL user_id + phone otherwise)
- Form-submit → eventual users.id resolves; trail joinable end-to-end
- `messages_orphan` sentinel query continues to return 0:
  ```sql
  SELECT COUNT(*) FROM chinmay_astro.messages WHERE user_id NOT IN (SELECT id FROM chinmay_astro.users);
  ```
  (must hold after both happy-path and DML wipe)

## Related

- `[[followups-retention-workflows]]` — WF-73/WF-74 scope grows once this is fixed
- `[[feedback_pseudocode_first_refactor]]` — workflow pseudo revised before JSON edits
- `[[project_design_rule_pending_users]]` — DR-1 stays unchanged; this fix doesn't violate it
