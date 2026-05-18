# Followups — timestamp-convention sprint

Items discovered during sprint execution that were not part of the original plan and were not addressed in-sprint.

---

## 2026-05-18 — Post-batch Batch 4 (P2-2.6 C8 adjacent finding)

### FU-1 — WF-11 STATS day-boundary semantic shift (UTC vs IST)

- **Workflow:** WF-11 Command Parser (n8n ID `GoTYo0GS2y8qjjkw`).
- **Nodes:** `Get Stats` and `Get Active Users`.
- **Symptom:** Two SQL fragments use `DATE(col) = CURRENT_DATE` against the migrated timestamptz columns:
  ```sql
  -- completed_today
  (SELECT COUNT(*) FROM chinmay_astro.consultations 
     WHERE status='closed' AND DATE(ended_at) = CURRENT_DATE)
  -- revenue_today
  (SELECT COALESCE(SUM(amount), 0) FROM chinmay_astro.payments 
     WHERE status='approved' AND DATE(verified_at) = CURRENT_DATE)
  ```
- **Cause:** Before Batch 3, Postgres session TZ was `Asia/Kolkata`. `DATE(timestamptz_col)` resolved in IST; `CURRENT_DATE` was IST-today. The two day-boundaries matched. After Batch 3, session TZ is `UTC` — both sides now resolve to UTC-today. The IST-operating admin (post-go-live: Chinmay Astro, the customer) will see "today" rolling over at 05:30 IST instead of 00:00 IST.
- **Scope:** Affects STATS admin command output only. Does not affect any user-facing flow. Not a data-integrity issue.
- **Proposed fix (when scheduled):** Rewrite both predicates to anchor on IST explicitly:
  ```sql
  WHERE status='closed'
    AND (ended_at AT TIME ZONE 'Asia/Kolkata')::date 
        = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
  ```
  and the analogous form for `verified_at`. Use `build-workflow` (Surgical scope, jq-on-disk `patchNodeField` on the `query` field of each node). Two nodes, one workflow, deterministic — a 1-pass Mode-B change.
- **Reference decision:** D1 in `decisions.md` — admin display TZ is IST. This fix aligns the STATS report with that.
- **Priority:** P2 (cosmetic; admin can still see counts, just on UTC-day boundaries until fixed).
- **Not addressed in-sprint:** This is a code change to WF-11 not in the sprint scope. The sprint scope ended at the schema migration + audit; touching workflow content here would expand the sprint past its design.
