-- Migration: Phase 2.2 — migrate 6 timestamp columns to timestamptz
-- Sprint: 2026-05-18-timestamp-convention-design
-- Spec: docs/artefacts/specs/2026-05-18-timestamp-convention-design.md §6 Phase 2.2
-- Before: see docs/artefacts/sprints/2026-05-18-timestamp-convention-design/migration-before.txt
--
-- Strategy: ALTER COLUMN ... TYPE timestamptz USING (col AT TIME ZONE 'Asia/Kolkata')
-- reinterprets the existing IST wall-clock literal as a UTC timestamptz instant.
-- This is loss-free because all historical inserts went through Postgres while
-- session TZ was Asia/Kolkata, so the literal stored == IST wall-clock.
--
-- Pre-flight assertion below confirms session TZ is UTC (set by P2-2.1). This
-- prevents accidental re-runs under a different session TZ producing wrong values.

BEGIN;

-- Pre-flight: must be running under UTC session TZ (post-P2-2.1).
DO $$
BEGIN
  IF current_setting('TIMEZONE') <> 'UTC' THEN
    RAISE EXCEPTION 'Migration aborted: session TZ is %, expected UTC. Run after P2-2.1 (Phase 2.1 container TZ flip + ALTER SYSTEM SET timezone).', current_setting('TIMEZONE');
  END IF;
END $$;

ALTER TABLE chinmay_astro.consultations
  ALTER COLUMN started_at TYPE timestamptz USING (started_at AT TIME ZONE 'Asia/Kolkata'),
  ALTER COLUMN ended_at   TYPE timestamptz USING (ended_at   AT TIME ZONE 'Asia/Kolkata'),
  ALTER COLUMN created_at TYPE timestamptz USING (created_at AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE chinmay_astro.payments
  ALTER COLUMN created_at  TYPE timestamptz USING (created_at  AT TIME ZONE 'Asia/Kolkata'),
  ALTER COLUMN verified_at TYPE timestamptz USING (verified_at AT TIME ZONE 'Asia/Kolkata'),
  ALTER COLUMN rejected_at TYPE timestamptz USING (rejected_at AT TIME ZONE 'Asia/Kolkata');

COMMIT;
