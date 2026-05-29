-- Migration: BMX-06 / safety-net Phase 0 foundations
-- Sprint: behavior-matrix-fixes-2026-05-27 · item BMX-P0-DB
-- Applied: 2026-05-29T08:29:47Z (live, via docker-exec psql write path)
-- Source of truth: docs/artefacts/specs/2026-05-29-bmx-06-new-contact-flow-design.md §132-144
--                  docs/artefacts/specs/2026-05-29-existing-user-safety-net-design.md §334
--
-- (1) silent_drop table — every dropped/rate-limited reply logs a row; U2 (WF-61) counts a
--     30-day rolling window per phone to drive threshold auto-block.
-- (2) users.block_reason — additive, nullable, no backfill. U2/U3 write the block cause
--     ('admin' / 'abuse' / 'threshold_garbage' / 'threshold_nontext' / ...).
--
-- Both confirmed absent in live before apply (information_schema check, 2026-05-29).
-- Idempotent (IF NOT EXISTS guards) so re-running is a no-op.

BEGIN;

CREATE TABLE IF NOT EXISTS chinmay_astro.silent_drop (
  id              bigserial PRIMARY KEY,
  phone_number    text NOT NULL,
  message_type    text,        -- text|image|audio|video|document|interactive|...
  reason          text,        -- non_text|interactive|garbage|stop_intent|stop_keyword|
                               --   rebook_keyword|unrelated|greeting_loop|service_loop|
                               --   help_loop|email_deflect|...
  message_content text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS silent_drop_phone_created_idx
  ON chinmay_astro.silent_drop (phone_number, created_at);

ALTER TABLE chinmay_astro.users ADD COLUMN IF NOT EXISTS block_reason text;

COMMIT;
