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

---

## Cross-cutting: error-handling properties surfaced by `.md` generator upgrade (added 2026-05-25T02:59:36Z, post-data-contract review)

**Surfaced during:** Data-contract sprint review walkthrough — review report at `docs/artefacts/reviews/data-contract-discipline-phase-1-pseudo-md-review-2026-05-24/review.md` §4 Cross-cutting #1, flagged as 5 Major findings + 1 Minor (WF-00).

**Functional background:**
Multiple n8n nodes appeared in the post-sprint `.md` generation with `onError:continueRegularOutput`, `retryOnFail:true`, or `maxTries:3` properties that did not appear in pre-sprint `.md` files. The review (correctly) suspected these might be sprint-introduced regressions and flagged them as Major findings to be verified.

**Technical background:**
- Snapshot diff against `workflows/pre-data-contract-phase-1-workflows/2026-05-24/json/` (snapshots taken 2026-05-18 to 2026-05-23, all dated **before** the data-contract sprint landed 2026-05-24 16:48Z) confirmed all 8 node-property instances pre-existed identically.
- The `n8n-whatsapp-methodology` plugin's `generate-workflow-md` script was upgraded between `generated_at: 2026-05-22T11:49:58Z` and `generated_at: 2026-05-24T18:44:35Z`. The new version emits `onError`, `retryOnFail`, and `maxTries` fields that the previous version silently dropped during serialization. WF-25's `.md` diff was the smoking gun: it gained a new `error handling` block despite `live_updated_at` being unchanged at `2026-05-18T12:13:36.698Z`.
- The data-contract sprint did NOT touch any of these nodes' error-handling configuration. The values shown in the new `.md` files were already in n8n.

**Origin of each property (registry trace):**

| WF / Node | Property | Origin sprint / TD | Rationale at time of introduction |
|-----------|----------|----|-----|
| WF-00 WhatsApp Webhook | `onError:continueRegularOutput` | F-09 (Pre-MVP 2026-05-16) | Webhook nodes must not 500 to Meta on internal errors — prevents retry storms |
| WF-10 Webhook | `onError:continueRegularOutput` | F-09 (same) | Same rationale for Slack webhook |
| WF-10 Call WF-60 Message Logger | `onError:continueRegularOutput` | TD-003 F2 (2026-05-20) | Message-logging failure must not abort the parent admin-command flow |
| WF-43 Gemini General Response | `retryOnFail:true, maxTries:3` | TD-NEW-016 (May 2026) | Transient Gemini API failures (timeouts, 5xx) recover on retry |
| WF-50 Send Interactive / Template / Text Message (×3) | `retryOnFail:true, maxTries:3` | TD-NEW-016 (same) | Meta WhatsApp Cloud API transient failures recover on retry |
| WF-51 Call WF-60 Message Logger | `onError:continueRegularOutput` | TD-003 F3 (2026-05-20) | Same rationale as WF-10's logger — log-path failure must not abort caller |
| WF-22 Create User Record (UPSERT) | `onError:continueRegularOutput` | Pre-existed 2026-05-22 snapshot; **no explicit registry annotation found** | Likely cascaded from TD-002 / TD-003 logger-protection pattern; needs explicit tech-sprint decision (see review concern below) |

**Failure-history scan (2026-05-25, last 10–50 executions per WF):**
- **WF-22:** 13 error executions in last 50, none at Create User Record. Recent error nodes: Invite Admin to Channel (Slack `user_not_found`), referenced-node-doesn't-exist, env-var access errors — all unrelated to the UPSERT.
- WF-10: 29 errors in last 50 — to be sampled in the tech-error sprint if relevant.
- WF-50, WF-43, WF-51 each had ≤6 errors in last 50.
- **No execution evidence of `continueRegularOutput` silently swallowing a node failure and producing broken downstream behaviour.**

**Why this is deferred to the tech sprint (not actioned in the data-contract sprint, not actioned in this drift-fix sprint):**

- The data-contract sprint scope was envelope shape and entry guards, not error policy. Per `[[feedback_pseudo_tech_separation]]`, error-handling mechanism is owned by a dedicated tech-error sprint, not pseudo design and not envelope refactors.
- The properties are pre-existing and deliberate. Modifying them now without a dedicated review would be scope creep and a regression risk.
- Reviewer concern about WF-22 specifically (continueRegularOutput on a UPSERT silently passes empty rows downstream to Prepare WF-52 Payload) is theoretically valid but has no production failure record. It is a legitimate tech-sprint candidate.

**Options for the tech-error sprint to decide (per node-class):**

1. **`onError:continueRegularOutput` on Postgres UPSERT (WF-22 Create User Record):**
   (a) **Keep as-is.** Pre-existing behaviour with no failure record; risk is theoretical.
   (b) **Change to `stopWorkflow`.** UPSERT failure becomes hard fail; user sees no payment message and Chinmay notices via WhatsApp not arriving. Tighter but adds a hard-fail surface.
   (c) **Add explicit empty-row guard downstream** (in `Prepare WF-52 Payload`) — IF `input.id` is null → branch to an admin alert via WF-51. Preserves the soft-fail policy while catching the silent-failure mode the review flagged. **Recommended if any work is done here.**
2. **`onError:continueRegularOutput` on Call WF-60 Message Logger (WF-10, WF-51):**
   (a) **Keep.** Log-path failure must not abort caller is a defensible policy; no failure record.
   (b) **Switch to `continueErrorOutput`** so the failure is routed to a separate observability path (e.g. admin Slack alert), instead of being silently swallowed. Adds observability without coupling caller flow to logger health.
3. **`retryOnFail:true, maxTries:3` on Gemini + Meta API HTTP nodes (WF-43, WF-50):**
   (a) **Keep.** Transient-failure recovery is the established pattern.
   (b) Add explicit backoff configuration (currently retry is immediate) if rate-limit failures become common.
   (c) Add dead-letter logging after retry exhaustion — currently no path captures "tried 3 times and still failed" cases. WF-50 in particular has no observability for permanent send failures.
4. **`onError:continueRegularOutput` on Webhook nodes (WF-00, WF-10):**
   (a) **Keep.** Webhook nodes must always 200 to Meta/Slack to prevent retry storms. Established n8n best practice.
   (b) No realistic alternative.

**Recommended overall position when reviewed:** keep (1a / 2a / 3a / 4a) unless tech-sprint discovers operational evidence of harm. WF-22 option 1c is the most defensible improvement and should land first if any work is undertaken here.

**Related plugin work (out of scope for this project):** the `n8n-whatsapp-methodology` plugin `generate-workflow-md` script change that began emitting these properties (between 2026-05-22 and 2026-05-24) should be documented in the plugin CHANGELOG so future readers don't misread the next `.md` diff as a config change. Belongs in the plugin's `flush-plugin-improvements` queue.
