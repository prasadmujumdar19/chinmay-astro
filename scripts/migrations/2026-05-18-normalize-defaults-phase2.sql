-- Migration: Phase 2.3 — normalise timestamp column defaults
-- Sprint: 2026-05-18-timestamp-convention-design
-- Spec: docs/artefacts/specs/2026-05-18-timestamp-convention-design.md §6 Phase 2.3
--
-- Drop the `AT TIME ZONE 'Asia/Kolkata'` wrapper from 3 column defaults.
-- For timestamptz columns, the wrapper was cosmetically confusing — Postgres
-- stores the same UTC instant either way, but the default expression hid the
-- intent. After this migration all default expressions are plain now().
--
-- Affected columns:
--   chinmay_astro.consultations.created_at
--   chinmay_astro.messages.created_at
--   chinmay_astro.payments.created_at

BEGIN;

ALTER TABLE chinmay_astro.consultations ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE chinmay_astro.messages      ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE chinmay_astro.payments      ALTER COLUMN created_at SET DEFAULT now();

COMMIT;
