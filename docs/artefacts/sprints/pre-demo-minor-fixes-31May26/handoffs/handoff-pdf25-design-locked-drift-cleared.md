# Handoff — PDF-25 design locked, drift gate cleared (2026-06-28)

## Stopping Point
PDF-25 (build WF-70 in-service health + execution-failure-rate monitor) is **design-LOCKED with the user and marked 🔵 in-progress** — but the BUILD has not started. We stopped deliberately at the design/build boundary to conserve context; the actual build is a fresh session's work.

To get here this session: ran the full pseudo-vs-md **drift check** (it gated build-sprint) and **cleared the gate** — `drift_count: 0` in `docs/artefacts/drift-checks/.last-run`. Verified live VPS+n8n state matches records (WF-70 absent = clean slate; WF-75/WF-51 active). Then locked the WF-70 design with the user.

## Next Action
Invoke **`build-sprint @docs/artefacts/sprints/pre-demo-minor-fixes-31May26/tasks.md`** → it resumes at **PDF-25** (the only 🔵 in-progress item; PDF-02/03 are design-gated, PDF-26 blocked, PDF-22 needs a connector — all correctly skipped). Build WF-70 **against the LOCKED design verbatim in the `## PDF-25` block of `state.md`** (`**Design decisions (LOCKED 2026-06-28)**`). Summary:
- Hourly Schedule Trigger; silent when healthy; mirror WF-75 build pattern.
- 3 checks (all must pass): DB `SELECT 1 FROM users LIMIT 1`; WhatsApp WABA/phone-number GET; ANY `execution_entity.status='error'` in trailing 60 min (no threshold — user wants even transient flagged).
- **Edge-triggered** Slack alerts via WF-51 → `chinmay-admin-commands` (C0A5B0ZE81E): onset (healthy→unhealthy), recovery (unhealthy→healthy), + 12h-throttled "still failing" reminder while persistently unhealthy. `W,F,F,W,W` → exactly 2 alerts.
- State/audit = NEW **append-only** table `chinmay_astro.health_check_log` (NOT single-row; full audit trail incl. `failed_checks` jsonb + `resolution` attribution transient_auto/manual). Create the table (docker-exec write path) as part of the build.
- **Build order:** pseudo-first (`WF-70.pseudo`, greenfield, pseudo-impact:yes) → create table → author WF-70 JSON **inline on main thread (Opus — user chose inline for visibility, NOT a generation subagent)** → typeVersion floor to WF-75 live → MCP lint/validate + live activation check + export → regen WF-70.md → re-stamp WF-70.pseudo `live_reconciled_at`. An OPTIONAL read-only reference subagent may distill WF-75's schedule-trigger node shapes + WF-51 call contract first (keeps WF-75's big JSON out of context).

## Blockers
- None for PDF-25 (fully unblocked; SSH tunnel needs to be open for the build).
- **New patterns for plugin (DO NOT flush this session — let build-sprint's usual flush-plugin-improvements handle it):**
  1. **Subagent-discipline refinements (R1-R5)** for `build-sprint` (Step 2a Mode D) + `dispatching-subagents` — captured in `docs/artefacts/sprints/pre-demo-minor-fixes-31May26/subagent-discipline-notes.md`: (R1) time/token cap is a LOGICAL budget, not a hard kill — judge progress-vs-time, don't abort at 70-80% done with small drift; abort when clearly awry (≈10% done at 150s+). (R2) drift tolerance scales with estimate size; never throw away partial work — for long/Write-capable agents create a per-agent scratch subdir + checkpoint incrementally, parent removes only on verified success; for cheap read-only fan-out, small-chunk + re-dispatch-on-abort beats checkpoint plumbing. (R3) model choice is per-task by main thread, NOT blanket-Sonnet; beware >50%-context degradation. (R4) capture these for plugin. (R5) subagent-usage learnings (estimate accuracy, interruptions from under-specified briefs, model mistakes) must feed the skill's self-learning step. Two validated live-dispatch logs included (VPS verifier: brief must fetch the reference clock for any staleness judgment, else false-positive; 11-agent drift fan-out: ~3 pairs/agent under 300s, Haiku over-flags so parent live-verification is mandatory, detection=agent/judgment=parent).
  2. **`pseudo-md-drift-check` D8/D9 scope = envelope-uplifted workflows only** — see `followups.md` [2026-06-28]. D8/D9 should pre-check for a live first-step envelope-validation guard; if absent (intermediate not-yet-uplifted workflow), mark `n/a` not 🔴. Prevents recurring false-positive drift on the 9 deferred intermediate workflows.
- Pre-existing deferred plugin candidates still open in `followups.md`: `lint-state-md.sh` composite-status; `generate-workflow-md.py` per-WF filter; `assert-tasks-state-status-sync.sh` `blocked` class.

## Changed Reference Values / This Session's Artefacts
- **Drift check (gate-clearing):** `docs/artefacts/drift-checks/2026-06-28/` (tracker.md, report.html, deferred-envelope-uplift.md, deferred-to-tech-sprint.md) + `docs/artefacts/drift-checks/.last-run` (drift_count:0, status CLEAN). 18 CLEAN as-found, 14 DRIFT all pseudo-lag (zero live bugs).
- **8 `.pseudo` reconciled pseudo→live** (genuine drift debt paid): WF-10, WF-11, WF-23, WF-31, WF-32, WF-44, WF-51, WF-75. (Mechanical copy/state-name/description/return-note sync; live was correct.)
- **9 D8/D9 findings dismissed as not-drift** per user's data-contract scope rule (intermediate workflows deliberately deferred from envelope uplift; objective test = no live first-step envelope-validation guard). Tracked in `2026-06-28/deferred-envelope-uplift.md`.
- **Regenerated (regenerable, NOT necessarily committed):** all `docs/pseudocode/WF-*.md` (fresh from live) + `workflows/*.json` export. build-sprint will re-export/regen as needed.
- **state.md / tasks.md:** PDF-25 → 🔵 in-progress, design locked. (assert-tasks-state-status-sync in lockstep.)
- **NEW table to be created at build:** `chinmay_astro.health_check_log` (does not exist yet).
- n8n + VPS verified healthy 2026-06-28 (~18:57 UTC): 4 monitoring cron jobs live, hourly DB backup fresh (42 min old at check), disk 1%. Container is `whatsapp-encryption` (not "encryption-svc"); n8n-prod has no Docker HEALTHCHECK (irrelevant — WF-70 is in-service).
