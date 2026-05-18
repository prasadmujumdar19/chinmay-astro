# Working copy — Timestamp Convention sprint (both phases)

Source: `docs/artefacts/specs/2026-05-18-timestamp-convention-design.md` (read-only).
Slug: `2026-05-18-timestamp-convention-design`.

Single sprint covering both phases. Phase 1 lands a commit on `main` (item P1-1.5) before Phase 2 begins (gated by P2-PF-1).

## Batches

- **Batch 1 — Phase 1 (5 items)**: P1-1.1..P1-1.5 — memory, CLAUDE.md, backfill, optional helper, commit.
- **Batch 2 — Phase 2 pre-flight (6 items)**: P2-PF-1..P2-PF-6 — verify Phase 1 landed, pre-go-live, tunnel, two decisions, pg_dump.
- **Batch 3 — Phase 2 core (3 items)**: P2-2.1 container TZ → P2-2.2 col types → P2-2.3 defaults.
- **Batch 4 — Phase 2 validation (3 items)**: P2-2.4 re-export → P2-2.5 audit → P2-2.6 C8 review.

Total: 17 items, 4 batches.

## Needs-decision items (build-sprint will surface)

- **P1-1.4** — commit helper script or `.zshrc` alias only?
- **P2-PF-4** — admin Slack display TZ: Sydney or IST?
- **P2-PF-5** — migration spot-check rows: confirm default proposal or substitute?

## Decisions file (written when first decision is surfaced)

`decisions.md` will hold all three answers.

## Operational notes

- Every write-path SQL goes through `ssh root@... docker exec -i psql` (MCP is read-only).
- Migration SQL files committed to `scripts/migrations/` for audit.
- All git commits use the `/tmp/claude-scratch/chinmay-astro` clone pattern.
- Rollback artefact is the PF-6 pg_dump — required gate.
