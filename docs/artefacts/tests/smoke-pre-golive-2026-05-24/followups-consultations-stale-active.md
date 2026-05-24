# Follow-up — O-01: `consultations` row remains `active` after user opt-out

**Severity:** minor (functional impact low; analytics/operational impact medium)
**Surfaced by:** TC-0605 tick in this session (2026-05-24)
**Status:** captured for sprint intake — design decision required before fix

## Finding

After TC-0605 walked user 30 to `consultation_active` and then opt-out via STOP:

| Table | Field | Pre-STOP | Post-STOP | WF responsible |
|---|---|---|---|---|
| `users` | `status` | `consultation_active` | `opted_out` | WF-47 |
| `consultations` (id=14) | `status` | `active` | **`active`** (unchanged) | none — WF-47 doesn't touch consultations |

Verified:
```sql
SELECT id, status FROM chinmay_astro.consultations WHERE user_id=30;
-- {id: 14, status: 'active'}
```

## Impact

**Low — user-side gate is `users.status`**, which correctly blocks further interaction. STOP path works.

**Medium — operational/analytics queries**:
- "How many active consultations does Chinmay have?" — `SELECT COUNT(*) FROM consultations WHERE status='active'` will inflate by 1 per opted-out-mid-consultation user
- Any future reporting / dashboard that queries `consultations.status` directly (without joining `users.status`) will mis-report

## Design question

Should WF-47 (Unsubscribe Handler) also flip `consultations.status` when it finds an open consultation row for the opting-out user? Three options:

| Option | Pros | Cons |
|---|---|---|
| A. Leave consultations `active`, document the "always join `users.status`" convention | Simplest — no WF-47 change | Requires every future analytics query to know the convention; easy to forget |
| B. WF-47 flips open consultations to `abandoned` (new status enum value) | Clean data model; analytics work without join | New enum value; need to decide if `abandoned` differs from `closed` for reporting |
| C. WF-47 flips open consultations to `closed` (reuse existing enum) | No new enum; backward-compatible | Loses the distinction between "Chinmay closed it normally" and "user opted out mid-flow" |

Author lean: **option B** — explicit `abandoned` distinct from `closed` makes the audit trail honest and gives reporting a clean signal. But this is a product/operator call.

## Related state-machine considerations

Similar question applies to **admin BLOCK** when the user is `consultation_active` — does WF-46 (User Blocker) also flip the consultations row? Worth auditing the same code-path in a single design pass:

- WF-47 (STOP / unsubscribe)
- WF-46 (admin BLOCK)
- WF-42 (admin CLOSE — this one DOES flip consultations.status='closed' per the build sprint, so it's the canonical pattern)

If the WF-42 pattern is canonical, WF-47 and WF-46 should mirror it with appropriate status values (`abandoned`, `blocked_mid_consult`, etc.).

## Sprint intake

- Single design pass covering all three workflows (WF-42 / WF-46 / WF-47)
- Pseudo-first per `[[feedback_pseudocode_first_refactor]]` — revise the three `.pseudo` files together
- Hard-dependency: operator decision on option A/B/C above
- Soft-dependency: if option B (new enum value), need to check whether postgres column is enum-typed (would require ALTER TYPE) or free text (just an INSERT-level convention)

## Related

- WF-42.pseudo — existing canonical "active → closed" flip pattern
- `[[project_design_rule_pending_users]]` — DR-related context for state-machine integrity
