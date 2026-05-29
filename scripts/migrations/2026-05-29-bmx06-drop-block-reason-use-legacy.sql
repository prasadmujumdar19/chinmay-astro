-- BMX-06 / safety-net sprint — revert the additive block_reason column.
-- Decision 2026-05-29 (user): unify the block audit trail on the EXISTING legacy trio
--   blocked_reason / blocked_at / blocked_by (no net-new columns), rather than the
--   block_reason column added earlier today by 2026-05-29-bmx06-silent-drop-and-block-reason.sql.
-- Rationale: blocking is now system-driven (U2 threshold + abuse), so who/when/why audit
--   (blocked_by = workflow/actor, blocked_at = time, blocked_reason = cause) is valuable,
--   and the legacy columns are naming-consistent with status='blocked'.
-- Safe: block_reason had 0 rows and 0 workflow readers at drop time (verified 2026-05-29).
-- Metadata-only operation in Postgres (no table rewrite for a column drop).

ALTER TABLE chinmay_astro.users DROP COLUMN IF EXISTS block_reason;
