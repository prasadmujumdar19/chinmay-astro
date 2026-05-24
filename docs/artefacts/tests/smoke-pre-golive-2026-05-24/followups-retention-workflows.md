# Follow-up — GAP-02: GDPR / data-retention maintenance workflows not yet built

**Severity:** minor (deferred to post-go-live per registry classification)
**Surfaced by:** operator-initiated check during this session (2026-05-24)
**Status:** captured for sprint intake — no code/pseudo edits this session

## Finding

Two maintenance workflows are provisioned in `docs/workflow-registry.md` under the WF-7x range but **neither exists in live n8n**:

| WF | Cadence (per registry) | Scope (per registry) |
|---|---|---|
| **WF-73 Stale Form Cleanup** | Daily | Delete records for users who never submitted form after 7 days (the pending-only orphan case) |
| **WF-74 Data Retention Cleanup** | Monthly | Anonymise / delete records beyond retention period (the broader GDPR sweep) |

Both classified 🔵 Build Fresh / ⚪ P4 / Post-Go-Live. Verified absence in live n8n via:

```bash
curl -sf -H "X-N8N-API-KEY: $N8N_API_KEY" "http://localhost:5678/api/v1/workflows?limit=200" \
  | jq -r '.data[] | select(.name | test("maint|clean|purge|retent|gdpr|stale|delete|expir|prun"; "i")) | .name'
# (no matches)
```

## Scope expansion required once `[[followups-message-logging-gap]]` is fixed

If WF-60 starts writing rows for pre-`users` events (NULL user_id or phone-keyed):

**WF-73 must broaden** to also purge orphan `messages` rows whose phone has no live `users` or `pending_users` mapping. The current FK `messages.user_id ON DELETE CASCADE` only cascades from `users` deletion — `pending_users` deletion doesn't touch `messages`.

Concrete cleanup contract (proposed):
```sql
-- WF-73 daily — purge orphan messages older than retention window
DELETE FROM chinmay_astro.messages
WHERE user_id IS NULL
  AND phone_number NOT IN (
    SELECT phone_number FROM chinmay_astro.users
    UNION ALL
    SELECT phone_number FROM chinmay_astro.pending_users
  )
  AND created_at < NOW() - INTERVAL '7 days';
```
(Requires `messages.phone_number` column to exist — open design question; see logging-gap followup.)

## WF-74 design decisions still required before build

1. **Retention window** — undefined in registry. Likely tied to `consultation_closed + N days` for Indian DPDPA / GDPR equivalence. Needs a concrete number (90? 180? 365?) before WF-74 can be pseudo'd.
2. **Anonymise vs delete** — registry says "anonymise/delete", but the choice has different audit-trail implications. Likely: anonymise the user row (replace name/DOB with hashed/blank placeholders) but retain the row for consultation-history queryability; hard-delete the related messages.
3. **Idempotency contract** — monthly run must be safe to re-execute mid-month without double-anonymising.
4. **Opt-out vs delete distinction** — `opted_out` users should also fall under retention sweep on a separate timeline from `consultation_closed`. Worth clarifying in the same design pass.

## Sprint intake

- Pseudo for both WF-73 and WF-74 needs to be written from scratch (no existing `.pseudo` files for these IDs).
- Build order: WF-73 first (simpler scope, addresses immediate orphan concern from GAP-01 fix); WF-74 second (requires retention-policy decision from operator/legal).
- Hard dependency on `[[followups-message-logging-gap]]` resolution for WF-73's expanded scope. If logging fix lands first, WF-73 scope is bigger; if WF-73 lands first with current scope, it'll need a follow-up sprint to broaden.

## Related

- `[[followups-message-logging-gap]]` — direct coupling on FK / cascade behavior
- `docs/workflow-registry.md` — WF-7x range definitions
- CLAUDE.md — "WF-7x | Background jobs — post go-live only"
