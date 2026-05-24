# Deferred to upcoming tech-error-handling sprint

Drift-check findings whose root cause is "how n8n is told to do X" rather than "what the business behaviour should be". Per `[[feedback_pseudo_tech_separation]]`, these stay out of the current pseudo-drift sprint and are inherited by the dedicated technical-error-handling sprint.

| Finding | WF | Mechanism deferred | Behaviour kept (in current sprint or already correct) |
|---------|----|-----|-----|
| D6 | WF-02 | `Build UNHANDLED Alert` lacks a separate n8n technical-error path (catch/retry/dead-letter) | Functional UNHANDLED fallback branch is correctly present in live (`Build UNHANDLED Alert` node) — no behaviour gap. |
| D6 | WF-10 | `Load User Status` Postgres node lacks `alwaysOutputData=true` | Behaviour ("zero-row lookup must route to orphan-channel alert") already documented in WF-10.pseudo Step 26. |
| D5 | WF-47 | `Update User Status to opted_out` Postgres node lacks `alwaysOutputData=true` | Not reachable in practice — WF-01's `Anomaly Route?` intercepts pre-onboarding STOP via `anomaly_keyword` and never calls WF-47. The `.pseudo` Step 2 note about pre-onboarding STOP becomes stale once WF-47.pseudo is rewritten under TD-DRIFT-007. No functional behaviour gap. |
| D5 | WF-45 | `Set status=payment_pending` UPDATE reads `$('When Executed by Another Workflow').item.json.phoneNumber` directly (trigger envelope), bypassing the `Load User Record` SELECT result. If SELECT returns zero rows (caller passed a phoneNumber for a non-existent user), UPDATE still runs against the non-existent row (no-op) and the downstream `Prepare WF-50 Payload (Rebook Payment)` Code node accesses `$('Load User Record').first().json.name` against an empty result, defaulting to `'there'`. Latent inconsistency — the user gets a WhatsApp message addressed to "there" and is marked `payment_pending` despite not existing. | Pseudo Step 3 already uses `<phoneNumber>` (trigger input) for the UPDATE — pseudo and live agree on the read source, so this is NOT a pseudo-vs-live drift. The robustness gap (zero-row guard / SELECT-result-driven UPDATE / `alwaysOutputData` discipline) is a tech-error-handling family concern; same class as the WF-47/WF-10 entries above. Surfaced during WF-45 triage 2026-05-24. |
| D6 ⚠️ | WF-46 | Shared zero-row error-path gap: `Load User by Phone` SELECT, `Update User to Blocked Status` UPDATE, and `Call WF-51 Notify Admin` Execute-Workflow node lack `alwaysOutputData=true` / no orphan-channel alert path / no Slack-API-failure error branch. If SELECT returns zero rows (caller passed a phoneNumber for a non-existent user), UPDATE no-ops, the Code node's `user.name`/`user.phone_number` reads return undefined and the Slack confirmation posts `"undefined (undefined)"`. | Functional behaviour ("on the block path, set status=blocked, post Slack confirmation") is correctly present in live. The robustness gap is a tech-error-handling family concern (same class as WF-47/WF-10/WF-45 above). Surfaced during WF-46 triage 2026-05-24; tracker also lists this in the shared cross-WF section. |
| D3 | WF-51 | `Post to Slack` node has no `On Error` branch — Slack API failure short-circuits the workflow with no fallback path, no error logging, and no WF-60 failure record. Pseudo line 12 already documents this gap as TD-NEW-028: *"Slack-failure logging is NOT wired (no On Error → WF-60 path)."* Pseudo and live agree on the gap; this is a shared feature gap, not pseudo↔live drift. | Functional happy-path behaviour ("post to Slack, log success via WF-60") is correctly present in live. The error-path gap is a tech-error-handling family concern (same class as WF-02/WF-10/WF-47/WF-45/WF-46 above) — broad enough to warrant a project-wide Slack-call-error pattern (every WF-51 caller is exposed). Surfaced during WF-51 triage 2026-05-24 → TD-DRIFT-030. |

## Schema observations (out of pseudo-drift scope per [[feedback_pseudo_tech_separation]])

### Asymmetric audit columns on `chinmay_astro.payments` — `verified_by` exists, `rejected_by` does NOT

**Surfaced during:** WF-34 triage 2026-05-24.

**Functional background:**
- The payments lifecycle moves through `pending_verification` → `verified` (admin approved) OR `rejected` (admin rejected).
- **Approval path (WF-33 Payment Approval Processor):** writes `status='verified', verified_at=NOW(), verified_by=<admin-slack-user-id>` per TD-DRIFT-017's corrected behaviour. The `verified_by` column persists the who-approved audit trail.
- **Rejection path (WF-34 Payment Rejection Processor):** writes `status='rejected', rejected_at=NOW(), rejection_reason=COALESCE(reason, 'Payment not verified')`. The schema has `rejected_at` and `rejection_reason` but **no `rejected_by` column** — there is no record of which admin rejected the payment.

**Technical background:**
- Confirmed via `information_schema.columns` query 2026-05-24: `payments` table columns are `id, user_id, amount, currency, status, payment_method, transaction_reference, screenshot_url, created_at, verified_at, verified_by, rejected_at, rejection_reason, notes`. Asymmetry is in the live schema, not just the workflows.
- WF-11 receives `adminUserId` from WF-10 and passes through to WF-34 — so the value IS available; WF-34 simply has no column to write it to.
- Per [[project_admin_actions_deprecated]] + single-admin model (Chinmay is the only operator), audit-trail value of `rejected_by` is operationally near-zero today. The asymmetry has no impact on current behaviour.
- The `admin_actions` table that previously logged admin-side actions is deprecated and tracked separately for removal (TD-NEW-026).

**Why this is deferred to the tech sprint (not actioned in this drift sprint):**
- The drift-fix sprint scope is pseudo↔live alignment. WF-34's pseudo and live both omit a `rejected_by` field, so there is no drift to fix here — they're aligned in their omission.
- The asymmetry is a schema/audit-design question: should `payments` track who-rejected for symmetry with who-approved? That's a tech/data decision separate from the pseudo-design boundary.

**Options for the tech sprint to decide:**
1. **Add `rejected_by` column** (ALTER TABLE) + update WF-34 to write `adminUserId` to it + update WF-34.pseudo Step 5 to declare the write. Symmetric audit trail. Cost: schema migration + workflow edit + pseudo update; near-zero operational benefit in single-admin model.
2. **Accept asymmetry as intentional** (documented in this entry as the position). `rejection_reason` is the only audit field needed for rejected payments because the reason captures the substance; the "who" is uniformly Chinmay. Cost: zero; close this entry as resolved.
3. **Remove `verified_by` for symmetry from below** (drop the column from the schema; update WF-33 to skip the write). Reduces audit surface but recovers symmetry. Cost: schema migration + WF-33 edit + risk of losing the one useful audit field that does exist.

**Recommended position when this is reviewed:** Option 2 (accept asymmetry) given single-admin model + admin_actions deprecation direction. But the decision is the tech sprint's, not this drift sprint's.
