# Design: Timestamp Convention — Strict UTC Everywhere

**Date:** 2026-05-18
**Status:** Draft — awaiting user review
**Author:** Claude (in collaboration with Prasad)
**Triggered by:** Reconciliation failure during sprint `smoke-post-p0-review-tc04xx-2026-05-18`, Batch 1+2 commit/push offer (false-negative — Claude said "not yet pushed" when commit was already on `main`)
**Related memory:** `feedback_github_ground_truth.md`

---

## 1. Problem

Three distinct system surfaces produce timestamps in this project:

| Surface | Timezone today | Notes |
|---|---|---|
| **Disk** — Claude/the user's Sydney terminal | AEST/AEDT (UTC+10 / +11 with DST) | Wall-clock at write time |
| **GitHub** — commits, PRs, gh api | UTC (with `Z` suffix) | Always UTC, consistent |
| **n8n production** — Docker containers + Postgres | IST (Asia/Kolkata, UTC+5:30, no DST) | Container env `TZ=Asia/Kolkata` |

When Claude reasons across surfaces — e.g., "is the sprint state.md entry I wrote at 22:18 before or after the GitHub commit at 12:31Z?" — the lack of an enforced convention leads to incorrect conclusions. The triggering incident: Claude wrote local Sydney wall-clock times into sprint `state.md` but tagged them with a literal `Z` (the ISO 8601 UTC marker), then later read those timestamps as if they were UTC. Comparison against `gh api` UTC commit times appeared to show a 10-hour gap when the events were in fact moments apart. Claude told the user the work needed committing when it had already been pushed.

The audit performed during this design (Section 5 below) also surfaced a **latent production-side timezone bug** in 6 Postgres columns: the data is stored as IST wall-clock literals in `timestamp WITHOUT time zone` columns. Today this works because every consumer assumes IST, but the data is semantically wrong and will break the day session TZ, host TZ, or analytics tooling expects UTC.

---

## 2. Goal

Establish a single, mechanically-enforceable timestamp convention that eliminates the three-surface ambiguity and prevents a recurrence of the reconciliation failure.

**Non-goal:** Change the user-facing display of timestamps in WhatsApp messages or Slack admin notifications. Those continue to display in the consumer's preferred TZ (user → IST, admin → Sydney) via explicit display-time conversion.

---

## 3. Recommended approach: Strict UTC everywhere

**Rule:** Every timestamp written by Claude OR by production code is UTC with a `Z` suffix. Display-time conversion to local TZ is the consumer's responsibility, applied explicitly at the boundary where humans read the value.

### Why UTC

- **Matches the most common cross-check.** GitHub commit timestamps are UTC; `gh api` returns UTC; `git log --format='%aI'` returns UTC. The reconciliation Claude does most often (state.md vs commits) becomes byte-identical comparison.
- **Matches the next most common cross-check.** n8n's REST API returns ISO 8601 UTC for `updatedAt`, `createdAt`, execution timestamps. Comparing live workflow state vs sprint state.md becomes trivial.
- **One rule.** "Use `date -u`". Mechanically enforceable, hard to get wrong if followed.
- **No DST footgun.** Sydney offset changes from +10 to +11 in late September; UTC doesn't move.
- **Aligns with existing `feedback_github_ground_truth` memory** which already designates GitHub UTC as the source-of-truth for sprint state reconciliation.

### Trade-off

Human reading state.md is slightly less convenient — `12:18Z` requires +10/+11 mental math to know "what time of my day was this". This is a one-time recurring cost for the user and a recurring lower-error-rate benefit for Claude. The alternative (local time everywhere) shifts the cost-and-error-rate to Claude, where the consequences are larger (this incident).

---

## 4. Alternatives considered

### Alternative B — Wall-clock with explicit offset everywhere

Every timestamp includes the offset, not `Z`: `2026-05-18T22:18:00+10:00`. Command: `date +%Y-%m-%dT%H:%M:%S%:z`.

- **Pros:** User reads state.md in Sydney wall-clock directly. Still unambiguous because the offset is explicit. Mechanical comparison works (subtract the offset).
- **Cons:** State.md becomes a mix of `+10:00` (Sydney), `+05:30` (Mumbai n8n if directly transcribed), and `Z` (GitHub) — three offsets in one file, harder to scan. DST flip mid-sprint silently changes the offset on subsequent entries. n8n event references would need to be re-converted to Sydney offset (extra step that's easy to forget).
- **Why rejected:** Visual noise + DST footgun + extra discipline at n8n boundary outweigh the readability gain.

### Alternative C — UTC wire format + human-readable parenthesised comment

Machine-readable YAML fields (`completed_at:`, `started_at:`) are UTC `Z`. Free-text prose in notes can include `(Sydney HH:MM AEDT)` annotations when helpful.

Example:
```yaml
completed_at: 2026-05-18T12:18:00Z  # Sydney 22:18 AEDT
```

- **Pros:** Wire format stays UTC (the reconciliation never gets fooled); prose annotations help the user eyeball.
- **Cons:** Two rules. Comments rot — the parenthesised offset can drift from the actual UTC value if someone updates one without the other (likely Claude, on hand-edit). More verbose.
- **Why rejected:** Approach A plus optional sugar, but the sugar isn't worth the doubled rule. If readability becomes a real pain point later, this can be added as a strict-superset extension (no breaking change).

---

## 5. Audit findings — production-side state today

Audit run on 2026-05-18 against the live Mumbai VPS via SSH tunnel + `mcp__postgres__query`.

### Container + session timezone

| Layer | TZ |
|---|---|
| VPS host (Linode Mumbai) | UTC |
| n8n Docker container | `TZ=Asia/Kolkata` |
| Postgres Docker container | `TZ=Asia/Kolkata` |
| Postgres session timezone | `Asia/Kolkata` |

### Postgres timestamp columns

15 timestamp columns across 7 tables. Two types in mixed use:

**`timestamptz` (8 columns — robust):**

| Table | Column | Default |
|---|---|---|
| `admin_actions` | `created_at` | `now()` |
| `blocked_users` | `blocked_at` | (none) |
| `messages` | `created_at` | `(now() AT TIME ZONE 'Asia/Kolkata')` |
| `pending_users` | `created_at` | (none) |
| `users` | `created_at` | `CURRENT_TIMESTAMP` |
| `users` | `updated_at` | `CURRENT_TIMESTAMP` |
| `users` | `last_message_at` | `CURRENT_TIMESTAMP` |
| `users` | `blocked_at` | (none) |
| `v_users_to_mark_inactive` | `last_message_at` | (view) |

For `timestamptz`, the `AT TIME ZONE 'Asia/Kolkata'` default produces the same UTC value as plain `now()` (Postgres converts back on store) — semantically a no-op, but cosmetically confusing.

**`timestamp WITHOUT time zone` (6 columns — fragile, latent bug):**

| Table | Column | Default |
|---|---|---|
| `consultations` | `started_at` | `now()` |
| `consultations` | `ended_at` | (none) |
| `consultations` | `created_at` | `(now() AT TIME ZONE 'Asia/Kolkata')` |
| `payments` | `created_at` | `(now() AT TIME ZONE 'Asia/Kolkata')` |
| `payments` | `verified_at` | (none) |
| `payments` | `rejected_at` | (none) |

For `timestamp WITHOUT TZ`, the `AT TIME ZONE 'Asia/Kolkata'` default stores the **IST wall-clock literal** as a raw value with no TZ info. Today this works because every consumer assumes IST. The latent failure modes:

1. Session TZ change (e.g., DB migration) → values silently shift by 5.5h.
2. Export to UTC-aware tooling (BI, Parquet, Snowflake) → 6 columns re-interpreted as UTC → 5.5h offset error.
3. Same-row joins against `timestamptz` columns → keys diverge.

### n8n workflow timestamp patterns

13 workflows use SQL `NOW()` or `CURRENT_TIMESTAMP` in INSERT/UPDATE statements:
WF-11, WF-21, WF-22, WF-32, WF-33, WF-34, WF-42, WF-44, WF-45, WF-46, WF-47, WF-50, WF-60.

All inherit the Postgres session TZ. Today that's IST; after the proposed container TZ change, UTC. No per-workflow code changes required — the behavior change comes from the Postgres session.

2 workflows use n8n's `new Date().toISOString()` (WF-50, WF-60): always UTC by JavaScript spec, independent of container TZ. Already correct.

1 workflow uses n8n's `$now` (WF-22): currently emits IST due to container `TZ=Asia/Kolkata`. After container TZ change → emits UTC. No code change needed.

No workflow does explicit `Asia/Kolkata` / `Asia/Sydney` TZ math. Nothing to unwind.

---

## 6. Design

The work is split into two phases. Phase 1 ships today; Phase 2 is its own sprint, pre-go-live.

### Phase 1 — Claude / documentation discipline

**Scope:** Zero production code changes. Zero infra changes.

| # | Change | File |
|---|---|---|
| 1.1 | New memory file capturing the rule | `~/.claude/projects/<project>/memory/feedback_timestamp_convention.md` + MEMORY.md index entry |
| 1.2 | New "Timestamp Convention" section in project CLAUDE.md | `CLAUDE.md` — ~15 lines |
| 1.3 | One-line backfill note in current sprint's state.md | `docs/artefacts/sprints/smoke-post-p0-review-tc04xx-2026-05-18/state.md` — flagging "historical timestamps in this file pre-date the convention; interpret as Sydney AEDT" |
| 1.4 | Optional helper script | `scripts/now-utc.sh` — single line emitting `date -u +%Y-%m-%dT%H:%M:%SZ` |

**Behavior change for Claude:**
- When writing any timestamp into any file (state.md, followups, handoff, code comment, CHANGELOG), Claude obtains the timestamp via `date -u +%Y-%m-%dT%H:%M:%SZ` and writes the literal output.
- Never tags a non-UTC time with `Z`.
- When transcribing an n8n API response or `gh api` response that already contains a UTC ISO 8601 timestamp, Claude quotes it verbatim (no manual reformatting).

**Acceptance for Phase 1:**
- Memory entry exists and is indexed.
- Future sprint state.md entries written by Claude have `Z`-suffixed UTC timestamps that match `date -u` to the second.
- A planned reconciliation between state.md and `gh api` for the next sprint succeeds without offset adjustment.

### Phase 2 — Production-side timezone hygiene

**Scope:** Container TZ change + DB schema migration + workflow re-export. Pre-go-live timing (no real user data yet; database is small).

| # | Change | Target | Risk |
|---|---|---|---|
| 2.1 | Change Docker compose `TZ` env from `Asia/Kolkata` → `UTC` on both n8n and postgres services. Restart containers. | `/mnt/chinmay-astro-data/docker-compose.yml` on the VPS | Brief downtime (~30s during restart). After this, n8n `$now` expressions and Postgres `now()` both emit UTC. |
| 2.2 | Migrate 6 `timestamp` columns to `timestamptz` using `ALTER COLUMN ... TYPE timestamptz USING (col AT TIME ZONE 'Asia/Kolkata')`. The `USING` clause interprets existing literals as IST (which is what they actually are based on today's defaults) and stores them as UTC internally — loss-free. | `chinmay_astro.consultations` (3 cols), `chinmay_astro.payments` (3 cols) | Atomic; fast on the current row counts. Validate by spot-checking a few rows before/after with explicit `AT TIME ZONE` conversions. |
| 2.3 | Normalize column defaults. Remove `AT TIME ZONE 'Asia/Kolkata'` from `messages.created_at`, `consultations.created_at`, `payments.created_at`. Use plain `now()` or `CURRENT_TIMESTAMP` consistently across all timestamp columns. | Same tables as 2.2 + `messages` | Cosmetic — values stored were already UTC for `timestamptz`. |
| 2.4 | Re-export all 28 workflow JSONs and commit. (Workflow content doesn't change, but the post-export lint hook re-verifies after the container TZ flip.) | `workflows/*.json` | Mechanical. |
| 2.5 | Audit message-sending nodes for displayed timestamps. Add explicit display-time conversion where any timestamp is rendered for a user (→ IST) or admin (→ Sydney). | Targets to inspect: WF-32, WF-33, WF-34, WF-42, WF-43, WF-44, WF-50, WF-51 send nodes. | Per-message review; most likely zero or near-zero affected (rough scan showed no Asia/Kolkata literals in workflow expressions, suggesting timestamps aren't currently displayed in messages). |
| 2.6 | Run `technical-workflow-review` C8 (Postgres schema alignment) post-migration to verify column types match expectations. | Plugin skill | Mechanical. |

**Acceptance for Phase 2:**
- `SHOW timezone;` returns `UTC` on the live DB.
- All 15 timestamp columns are `timestamptz`.
- All column defaults are `now()` or `CURRENT_TIMESTAMP` (no `AT TIME ZONE` clauses).
- Container `TZ` env vars are `UTC` on both n8n and postgres services in docker-compose.
- A test INSERT via an n8n workflow stores a UTC value; a `SELECT now()` returns UTC.
- The technical-workflow-review C8 audit passes after migration.

---

## 7. Phasing + rollout

| When | What | Output |
|---|---|---|
| Next short session | Implement Phase 1 (memory + CLAUDE.md + optional helper script) | One commit to `main`. Discipline live from that commit forward. |
| Next dedicated sprint, pre-go-live | Implement Phase 2 as a sprint. Plan via `writing-plans` skill from this spec. | Container restart + DB migration + workflow re-export. |
| Post Phase 2 | Re-run smoke test to confirm message flows still work after container TZ change. | Smoke-test artefact under `docs/artefacts/tests/`. |

Phase 1 does **not** require Phase 2 to be useful — even if Phase 2 is never done, Phase 1 prevents the reconciliation incident from recurring. Phase 2 fixes the production-side latent bug independently.

---

## 8. Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Phase 2.1 container restart leaves a Postgres connection pool in a stale session TZ | Low | n8n auto-reconnects; verify via a no-op SQL after restart. If stale: restart n8n container as well. |
| Phase 2.2 `USING (col AT TIME ZONE 'Asia/Kolkata')` misinterprets a row that wasn't actually IST | Very low (all defaults were IST-converting) | Spot-check 3 rows per affected column before and after. If a row's original semantic was UTC (no AT TIME ZONE in the default), it would shift by -5.5h after migration. Audit each column's history with `\d+` and the column-default examination above before running. |
| Existing sprint state.md files have inconsistent (pre-convention) timestamps | Certain — they already do | Phase 1.3 backfills a one-line note. Historical timestamps are not rewritten — that's an audit trail. |
| User reading new state.md entries forgets to add +10/+11 for Sydney time | Recurring annoyance | Optional Approach C escape valve (parenthesised comments) can be added later as a non-breaking extension. Re-evaluate after 2-3 sprints of Phase 1 usage. |
| n8n `$now` in WF-22 produces a different value after container TZ change | Certain — that's the point | The value it stores is unchanged in absolute time (UTC), only the displayed value differs. Verify the destination column type after Phase 2.2. |

---

## 9. Open questions

1. **Optional helper script.** Phase 1.4 — is `scripts/now-utc.sh` worth committing, or would a `.zshrc` alias on the user's terminal be sufficient? Defer to implementation plan.
2. **Display-time conversion target.** Phase 2.5 — when admin Slack messages show "Paid at X", is the target Sydney AEDT/AEST, or do you want IST so it matches what the user sees? Decision needed before Phase 2.5; not blocking the spec.
3. **Migration verification rows.** Phase 2.2 — for the spot-check, which 3 rows per column should be sampled? Earliest, latest, and a payment with a non-null `verified_at`? Defer to implementation plan.

These questions do not affect the spec's recommendation or structure — they are implementation details to resolve when `writing-plans` produces the plan.

---

## 10. Related files / state

- Memory: `feedback_github_ground_truth.md` (existing — UTC alignment rationale)
- Memory (new in Phase 1): `feedback_timestamp_convention.md`
- Project root: `CLAUDE.md` (Phase 1 addendum)
- Project root: `docs/INFRA.md` (post-Phase-2 update: document UTC convention)
- Sprint state files (historical, not rewritten): all `docs/artefacts/sprints/*/state.md`
