---
slug: 2026-05-18-timestamp-convention-design
input_source: docs/artefacts/specs/2026-05-18-timestamp-convention-design.md
input_hash: 7233a9fed5c89733e5f01418134488bfb4bef2f502e217bfa421301e6207c5d1
source_file_update: false
working_copy_path: docs/artefacts/sprints/2026-05-18-timestamp-convention-design/working.md
planned_at: 2026-05-18T14:05:17Z
last_updated: 2026-05-18T14:10:08Z
planning_complete: true
scope_note: |
  Single sprint covering BOTH phases of the timestamp-convention work.
  - Batch 1: Phase 1 (Claude/documentation discipline — zero production change).
  - Batches 2-4: Phase 2 (container TZ flip + DB migration + audit).
  Phase 1 lands a commit on `main` before Phase 2 begins; the gating is
  enforced by P2-PF-1 (hard dep on Phase 1 commit existing on `main`).
  Source spec §7 phases this for pre-go-live timing — P2-PF-2 verifies.
dependency_conflicts_found: []
priority_adjustments_confirmed: |
  None required. Ordering is dictated by infra/data dependencies, not
  priority numbers: Phase 1 → P2 pre-flight → 2.1 container → 2.2 col
  types → 2.3 defaults → 2.4 re-export → 2.5 audit → 2.6 C8.
parser_warnings: []
items:

  # ─────────────── Batch 1 — Phase 1 (documentation discipline) ───────────────

  - id: P1-1.1
    description: "New memory file `feedback_timestamp_convention.md` capturing the strict-UTC rule, with MEMORY.md index entry. Link to [[feedback_github_ground_truth]]."
    priority: P0
    status: done
    completed_at: 2026-05-18T14:10:08Z
    batch: 1
    target_file: ~/.claude/projects/-Users-prasadmujumdar-Library-CloudStorage-GoogleDrive-prasadmujumdar-aws-gmail-com-My-Drive-Chinmay-Astro/memory/feedback_timestamp_convention.md
    depends_on: []
    notes: |
      Content of the memory file (rough):
        - Rule: every timestamp Claude writes is UTC `Z` (no exceptions).
        - Command: `date -u +%Y-%m-%dT%H:%M:%SZ`.
        - Never tag a non-UTC time with `Z`.
        - When transcribing n8n API / `gh api` timestamps, quote verbatim.
      Index entry in MEMORY.md (under "Memory Index"):
        - [Timestamp convention — strict UTC](feedback_timestamp_convention.md) — every timestamp Claude writes is `date -u`; never tag local time with Z

  - id: P1-1.2
    description: "Add 'Timestamp Convention' section to project CLAUDE.md (~15 lines) — rule, command, never-tag-local-with-Z, transcribe-verbatim-from-API."
    priority: P0
    status: done
    completed_at: 2026-05-18T14:11:29Z
    batch: 1
    target_file: CLAUDE.md
    depends_on:
      - id: P1-1.1
        type: soft
        reason: "CLAUDE.md section will cross-link the memory; write memory first so the link target exists"

  - id: P1-1.3
    description: "Append a one-line backfill note to current sprint state.md flagging that historical timestamps in that file pre-date the convention and should be read as Sydney AEDT."
    priority: P1
    status: done
    completed_at: 2026-05-18T14:12:13Z
    batch: 1
    completion_note: "Backfill note added as YAML key `timestamp_convention_backfill_note` to docs/artefacts/sprints/smoke-post-p0-review-tc04xx-2026-05-18/state.md. Note revised vs spec wording — actual pre-convention values in that file are a mix (IST-tagged + Z-tagged ambiguous); backfill describes the actual mix rather than asserting all are Sydney AEDT."
    target_file: docs/artefacts/sprints/smoke-post-p0-review-tc04xx-2026-05-18/state.md
    depends_on:
      - id: P1-1.1
        type: soft
        reason: "convention must be defined before the backfill note can reference it"

  - id: P1-1.4
    description: "Optional helper script `scripts/now-utc.sh` emitting `date -u +%Y-%m-%dT%H:%M:%SZ`."
    priority: P2
    status: done
    completed_at: 2026-05-18T14:13:40Z
    batch: 1
    target_file: scripts/now-utc.sh
    decision_made: "User chose to commit the script (2026-05-18T14:13Z). chmod +x applied; smoke test emitted valid UTC stamp 2026-05-18T14:13:40Z."
    depends_on: []

  - id: P1-1.5
    description: "Commit + push Phase 1 changes to `main`. This is the gate for P2-PF-1."
    priority: P0
    status: pending
    batch: 1
    target_file: GitHub main
    depends_on:
      - id: P1-1.1
        type: hard
        reason: "all Phase 1 artefacts must exist before commit"
      - id: P1-1.2
        type: hard
        reason: "all Phase 1 artefacts must exist before commit"
      - id: P1-1.3
        type: hard
        reason: "all Phase 1 artefacts must exist before commit"
    notes: |
      Use /tmp/claude-scratch/chinmay-astro clone pattern (working dir has
      no local .git per CLAUDE.md). Subject suggestion:
        docs: establish strict-UTC timestamp convention (Phase 1)

      Pre-commit: secrets scan
        grep -rn 'AIzaSy\|sk-\|xoxb-\|AKIA' <staged-files>
      Push to origin/main. THIS COMMIT is the artefact P2-PF-1 will check for.

  # ─────────────── Batch 2 — Phase 2 pre-flight ───────────────

  - id: P2-PF-1
    description: "Verify Phase 1 commit is on main branch via gh api"
    priority: P0
    status: pending
    batch: 2
    target_file: (verification only)
    depends_on:
      - id: P1-1.5
        type: hard
        reason: "checks for the artefact that P1-1.5 produces"
    notes: |
      gh api repos/prasadmujumdar19/chinmay-astro/commits/main \
        --jq '.commit.message' | grep -i "timestamp convention"
      Expected: matches Phase 1 commit subject. STOP if no match.

  - id: P2-PF-2
    description: "Confirm pre-go-live — no real users in chinmay_astro.users"
    priority: P0
    status: pending
    batch: 2
    target_file: (verification only)
    depends_on: []
    notes: |
      mcp__postgres__query:
        SELECT count(*) FROM chinmay_astro.users
         WHERE phone_number NOT IN ('<test-phone-1>','<test-phone-2>');
      Test phones from project memory / recent state.md.
      Expected: 0. If non-zero: STOP, replan with maintenance window.

  - id: P2-PF-3
    description: "SSH tunnel up + n8n + postgres reachable"
    priority: P0
    status: pending
    batch: 2
    target_file: (verification only)
    depends_on: []
    notes: |
      Prasad opens:
        ssh -L 5678:localhost:5678 -L 5050:localhost:5050 \
            -L 5432:localhost:5432 root@45.79.125.184
      Claude verifies:
        - mcp__n8n__n8n_health_check → healthy
        - mcp__postgres__query → SELECT 1; → 1 row

  - id: P2-PF-4
    description: "Record §9 Q2 decision — admin Slack display TZ (Sydney AEDT/AEST vs IST)"
    priority: P0
    status: needs-decision
    batch: 2
    target_file: docs/artefacts/sprints/2026-05-18-timestamp-convention-design/decisions.md
    depends_on: []
    decision_required: |
      Spec §9 Q2: For admin Slack "Paid at X" messages — target Sydney
      AEDT/AEST or IST (matching what user sees)?
      Blocks P2-2.5 only.

  - id: P2-PF-5
    description: "Record §9 Q3 decision — migration spot-check row selection"
    priority: P1
    status: needs-decision
    batch: 2
    target_file: docs/artefacts/sprints/2026-05-18-timestamp-convention-design/decisions.md
    depends_on: []
    decision_required: |
      Spec §9 Q3: Spot-check rows for P2-2.2 — confirm default proposal
      "earliest, latest, plus one row with non-null verified_at" per
      affected column, or substitute.

  - id: P2-PF-6
    description: "Take pg_dump backup of chinmay_astro schema (rollback artefact)"
    priority: P0
    status: pending
    batch: 2
    target_file: /tmp/claude-scratch/chinmay_astro-pre-phase2-<ts>.dump
    depends_on:
      - id: P2-PF-3
        type: hard
        reason: "needs SSH tunnel + postgres connectivity"
    notes: |
      Prasad runs (local terminal, tunnel open):
        PGPASSWORD=<n8n-pw> pg_dump -h localhost -p 5432 -U n8n -d n8n \
          -n chinmay_astro --no-owner --no-acl -F c \
          -f /tmp/claude-scratch/chinmay_astro-pre-phase2-$(date -u +%Y%m%dT%H%M%SZ).dump
      Claude verifies: file exists, size > 0.
      This is the rollback artefact for the whole Phase 2 — do NOT skip.

  # ─────────────── Batch 3 — Phase 2 core migration ───────────────

  - id: P2-2.1
    description: "Flip docker-compose TZ env on n8n + postgres from Asia/Kolkata to UTC; restart both"
    priority: P0
    status: pending
    batch: 3
    target_file: /mnt/chinmay-astro-data/docker-compose.yml (on VPS)
    depends_on:
      - id: P2-PF-1
        type: hard
        reason: "Phase 1 convention must be live before timestamps written in this task"
      - id: P2-PF-2
        type: hard
        reason: "pre-go-live confirmation gates any production mutation"
      - id: P2-PF-3
        type: hard
        reason: "needs SSH access + MCP verification"
      - id: P2-PF-6
        type: hard
        reason: "backup must exist before container restart"
    notes: |
      Step-by-step (Prasad runs / Claude verifies):

      1. Snapshot compose file:
         cp /mnt/chinmay-astro-data/docker-compose.yml \
            /mnt/chinmay-astro-data/docker-compose.yml.bak-$(date -u +%Y%m%dT%H%M%SZ)

      2. Confirm 2 hits before edit:
         grep -n 'TZ=' /mnt/chinmay-astro-data/docker-compose.yml
         Expected: TZ=Asia/Kolkata under n8n + postgres services.

      3. Edit in place:
         sed -i.tmp 's/TZ=Asia\/Kolkata/TZ=UTC/g' \
           /mnt/chinmay-astro-data/docker-compose.yml
         rm /mnt/chinmay-astro-data/docker-compose.yml.tmp
         Re-grep — both lines now TZ=UTC.

      4. Restart POSTGRES first (n8n depends on it). docker-compose v1
         stop/rm/up pattern required (per CLAUDE.md):
           cd /mnt/chinmay-astro-data
           PG=$(docker ps --format '{{.Names}}' | grep -i postgres | head -1)
           docker stop "$PG" && docker rm "$PG"
           docker-compose up -d postgres
           sleep 5
           docker ps --format '{{.Names}}\t{{.Status}}' | grep -i postgres

      5. Claude verifies session TZ via mcp__postgres__query:
           SHOW timezone;
         Expected: UTC. (If Asia/Kolkata: STOP, re-check edit.)

      6. Restart n8n same pattern:
           N8N=$(docker ps --format '{{.Names}}' | grep -E '^n8n$|_n8n_' | head -1)
           docker stop "$N8N" && docker rm "$N8N"
           docker-compose up -d n8n
           sleep 10
           docker ps | grep -i n8n

      7. Claude verifies n8n via mcp__n8n__n8n_health_check.
         Prasad verifies inside container:
           docker exec <n8n-container> date -u
           docker exec <n8n-container> date
         Both should now match (no IST offset).

      8. End-to-end smoke via mcp__postgres__query:
           SELECT now(), now() AT TIME ZONE 'UTC' AS now_utc,
                  current_setting('TIMEZONE') AS tz;
         Expected: now ≈ now_utc; tz = UTC.

      9. Claude appends to working.md: task completion (UTC), backup
         filename, any deviations.

  - id: P2-2.2
    description: "Migrate 6 timestamp cols to timestamptz with USING (col AT TIME ZONE 'Asia/Kolkata')"
    priority: P0
    status: pending
    batch: 3
    target_file: scripts/migrations/2026-05-18-timestamptz-phase2.sql (new) + 6 cols in consultations + payments
    depends_on:
      - id: P2-2.1
        type: hard
        reason: "session TZ must be UTC before column migration so default-value math is consistent"
      - id: P2-PF-5
        type: hard
        reason: "needs spot-check row IDs decided"
    notes: |
      Steps:

      1. Pre-capture before-state values for spot-check rows (Claude via
         mcp__postgres__query — one SELECT per column). Record into:
            docs/artefacts/sprints/2026-05-18-timestamp-convention-design/migration-before.txt

      2. Claude writes scripts/migrations/2026-05-18-timestamptz-phase2.sql:

         BEGIN;
         DO $$ BEGIN
           IF current_setting('TIMEZONE') <> 'UTC' THEN
             RAISE EXCEPTION 'Session TZ is %, expected UTC.',
                             current_setting('TIMEZONE');
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

      3. Pre-state column type check (Claude via MCP):
           SELECT table_name, column_name, data_type
             FROM information_schema.columns
            WHERE table_schema='chinmay_astro'
              AND (table_name, column_name) IN (
                ('consultations','started_at'),('consultations','ended_at'),
                ('consultations','created_at'),
                ('payments','created_at'),('payments','verified_at'),
                ('payments','rejected_at'))
            ORDER BY table_name, column_name;
         Expected: all 6 = 'timestamp without time zone'.

      4. Prasad applies via docker-exec write path (MCP is read-only):
           ssh root@45.79.125.184 \
             'docker exec -i $(docker ps --format "{{.Names}}" \
               | grep -i postgres | head -1) \
              psql -U n8n -d n8n -v ON_ERROR_STOP=1' \
             < "scripts/migrations/2026-05-18-timestamptz-phase2.sql"
         Expected: BEGIN, six ALTER TABLE, COMMIT.

      5. Post-state check — same MCP query. Expected: all 6 = 'timestamp with time zone'.

      6. Spot-check data is loss-free. For each captured row:
           SELECT id, <col>::text AS after_text,
                  (<col> AT TIME ZONE 'Asia/Kolkata')::text AS as_ist
             FROM chinmay_astro.<table> WHERE id = <captured-id>;
         The as_ist column must match before_text byte-for-byte. ANY
         mismatch: STOP. Record into migration-after.txt.

      7. Commit migration SQL via /tmp/claude-scratch/chinmay-astro clone.
         Subject: migrate: 6 timestamp cols -> timestamptz (Phase 2.2)

  - id: P2-2.3
    description: "Drop AT TIME ZONE 'Asia/Kolkata' wrapper from 3 column defaults; use plain now()"
    priority: P1
    status: pending
    batch: 3
    target_file: scripts/migrations/2026-05-18-normalize-defaults-phase2.sql (new) + messages/consultations/payments .created_at
    depends_on:
      - id: P2-2.2
        type: soft
        reason: "same tables; cleaner to migrate types first then defaults"
    notes: |
      Steps:

      1. Pre-state count check (Claude via MCP):
           SELECT table_name, column_name, column_default
             FROM information_schema.columns
            WHERE table_schema='chinmay_astro'
              AND column_default LIKE '%Asia/Kolkata%'
            ORDER BY table_name, column_name;
         Expected: exactly 3 rows. Any other count: STOP (schema drift vs §5).

      2. Claude writes scripts/migrations/2026-05-18-normalize-defaults-phase2.sql:

         BEGIN;
         ALTER TABLE chinmay_astro.messages
           ALTER COLUMN created_at SET DEFAULT now();
         ALTER TABLE chinmay_astro.consultations
           ALTER COLUMN created_at SET DEFAULT now();
         ALTER TABLE chinmay_astro.payments
           ALTER COLUMN created_at SET DEFAULT now();
         COMMIT;

      3. Prasad applies via docker-exec write path (same shape as 2.2 step 4).
         Expected: BEGIN, three ALTER TABLE, COMMIT.

      4. Post-state: same query as step 1 → 0 rows. Plus verify new defaults
         are `now()` with no AT TIME ZONE wrapper.

      5. Functional smoke — insert + verify + cleanup:
         a. Inspect messages NOT NULL columns first if not memorised.
         b. INSERT a sentinel row with body='phase2-smoke-marker'.
         c. Verify created_at is within 5s of date -u (UTC).
         d. DELETE the sentinel via docker-exec write path.
         e. Verify count=0.

      6. Commit SQL via /tmp/claude-scratch pattern. Subject:
           migrate: normalise timestamp defaults to plain now() (Phase 2.3)

  # ─────────────── Batch 4 — Phase 2 validation ───────────────

  - id: P2-2.4
    description: "Re-export all 28 workflow JSONs as post-container-flip baseline"
    priority: P2
    status: pending
    batch: 4
    target_file: workflows/*.json
    depends_on:
      - id: P2-2.1
        type: soft
        reason: "container TZ change motivates the re-export baseline"
    notes: |
      Steps:

      1. Run scripts/export-all-workflows.sh (preferred) OR inline curl-loop
         from CLAUDE.md. Output to workflows/ (NOT /tmp/claude-scratch/).

      2. Diff vs current main:
           rm -rf /tmp/claude-scratch/chinmay-astro
           git clone --depth 1 https://github.com/prasadmujumdar19/chinmay-astro \
             /tmp/claude-scratch/chinmay-astro
           diff -r workflows/ /tmp/claude-scratch/chinmay-astro/workflows/ \
             > /tmp/claude-scratch/wf-diff.txt 2>&1 || true
         Expected: diffs ONLY on updatedAt / versionId / meta.instanceId.
         ANY structural diff: STOP.

      3. Secrets + inline-key scans (CLAUDE.md mandates both).

      4. Commit via /tmp/claude-scratch pattern. Subject:
           export: workflow JSONs after Phase 2 container TZ flip

  - id: P2-2.5
    description: "Audit 8 message-send workflows for displayed-timestamp expressions"
    priority: P1
    status: pending
    batch: 4
    target_file: docs/artefacts/sprints/2026-05-18-timestamp-convention-design/task-5-audit.md (new)
    depends_on:
      - id: P2-PF-4
        type: hard
        reason: "needs admin-display-TZ decision before classifying admin-bound timestamps"
      - id: P2-2.1
        type: soft
        reason: "audit in UTC-emitting baseline avoids ambiguity"
    notes: |
      Workflows to audit: WF-32, WF-33, WF-34, WF-42, WF-43, WF-44,
      WF-50, WF-51. IDs from docs/workflow-registry.md at execution.

      Steps:

      1. Fetch each WF JSON to /tmp/claude-scratch/wf-audit/ via curl with
         $N8N_API_KEY (source .env) — one at a time.

      2. Grep each for timestamp-display patterns:
           grep -E '(created_at|started_at|verified_at|ended_at|\
                    now\(\)|\$now|\.toISOString|toLocaleString|\
                    Asia/Kolkata|Asia/Sydney)' <file>

      3. Classify each hit:
           - internal use → no action
           - user WhatsApp body → wrap with IST conversion
           - admin Slack body → wrap per PF-4 decision

         User-facing IST conversion:
           {{ DateTime.fromISO($json.<f>).setZone('Asia/Kolkata')
                .toFormat('dd LLL yyyy, hh:mm a') }}
         Admin-facing conversion (PF-4 decision):
           {{ DateTime.fromISO($json.<f>).setZone('<PF-4-zone>')
                .toFormat('dd LLL yyyy, hh:mm a') }}

      4. Record classifications in task-5-audit.md.

      5. Each "must convert" hit → followup item handled via
         n8n-whatsapp-methodology:build-workflow. Append to followups.md
         if not done in-sprint.

      6. If zero hits across all 8 workflows: mark complete with
         findings: none.

      7. Cleanup: rm -rf /tmp/claude-scratch/wf-audit*.

  - id: P2-2.6
    description: "Run technical-workflow-review C8 (Postgres schema alignment)"
    priority: P2
    status: pending
    batch: 4
    target_file: docs/artefacts/reviews/technical-workflow-review-<YYYY-MM-DD>/
    depends_on:
      - id: P2-2.2
        type: hard
        reason: "C8 checks types of touched columns; meaningless before migration"
      - id: P2-2.3
        type: hard
        reason: "C8 also covers default expressions"
    notes: |
      Steps:

      1. Invoke n8n-whatsapp-methodology:technical-workflow-review skill.
         Scope to C8 if supported; else run full suite and filter.

      2. Read C8 findings. Expected: 0.

      3. For any findings:
         - type mismatch → fix in-sprint via build-workflow
         - missing/unexpected column → log to followups.md

      4. Record final counts in working.md.

# === Acceptance criteria — all must pass before sprint complete ===
acceptance:
  # Phase 1 acceptance
  AC-P1-1: "Memory `feedback_timestamp_convention.md` exists and is in MEMORY.md index"
  AC-P1-2: "CLAUDE.md contains a 'Timestamp Convention' section referencing the memory"
  AC-P1-3: "Phase 1 commit is on github.com/prasadmujumdar19/chinmay-astro main"
  # Phase 2 acceptance (parent spec §6)
  AC-P2-1: "mcp__postgres__query → SHOW timezone returns 'UTC'"
  AC-P2-2: "0 columns of type 'timestamp without time zone' in chinmay_astro schema"
  AC-P2-3: "0 column defaults containing 'Asia/Kolkata' in chinmay_astro schema"
  AC-P2-4: "VPS docker-compose.yml shows only TZ=UTC (no Asia/Kolkata)"
  AC-P2-5: "Fresh INSERT via WF-22 or WF-32 stores UTC value matching date -u within seconds"

# === Rollback ===
rollback: |
  Phase 1 — trivial (revert commit if needed).

  Phase 2 — each schema ALTER is BEGIN/COMMIT, fails roll back automatically.
  Full reversal from PF-6 backup:
    1. Prasad: docker stop n8n + postgres
    2. pg_restore --clean --if-exists -n chinmay_astro from PF-6 dump
    3. Revert docker-compose.yml to .bak-<ts> snapshot from P2-2.1
    4. docker-compose up -d; verify SHOW timezone returns Asia/Kolkata
    5. git revert the migration commits — preserve audit trail (no force-push)
