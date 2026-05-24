# Sprint Snapshot + Restore — Script Design

**Status:** Ready for implementation as the first task of the data-contract Phase 1 sprint.
**Created:** 2026-05-24T13:00:00Z
**Parent design:** [`design.md`](./design.md)

This document specifies the two helper scripts that provide sprint-level rollback insurance for the data-contract Phase 1 sprint. The scripts are generic on `<sprint-name>`; they can be reused for any future sprint that needs the same all-or-selective rollback capability.

---

## 1. Design goals

- **Idempotent:** running snapshot twice on the same date is safe (refuses to overwrite, or writes to a `-2` suffix folder).
- **Hermetic:** snapshot pulls fresh state from n8n via API at run time, not from the local `workflows/` folder which may be stale.
- **Atomic per file:** if any single workflow fails to export, the snapshot aborts cleanly (no half-snapshot).
- **Restore is dry-run-capable:** can validate-without-pushing before doing real PUTs.
- **Restore is selective:** can restore one or many workflows by ID or `WF-XX` name, not just all-or-nothing.
- **No new dependencies:** bash, `curl`, `jq`, the n8n API key in `.env`.

---

## 2. Folder structure produced by snapshot

```
workflows/pre-data-contract-workflows/2026-05-24/
├── manifest.json                     # produced by snapshot — see §3
├── json/
│   ├── BUVun38WEKb12zg9.json         # WF-50, full JSON export
│   ├── wlZRK0YxnhP0b2RL.json         # WF-51
│   ├── … (all impacted workflows)
├── pseudocode/
│   ├── WF-50.pseudo
│   ├── WF-51.pseudo
│   ├── … (all .pseudo files for impacted WFs)
└── md/
    ├── WF-50.md
    ├── WF-51.md
    ├── … (all .md files for impacted WFs)
```

---

## 3. `manifest.json` shape

```json
{
  "sprint": "data-contract-phase-1",
  "snapshot_taken_at": "2026-05-24T13:45:00Z",
  "n8n_base_url": "http://localhost:5678",
  "workflows": [
    {
      "wf_id": "BUVun38WEKb12zg9",
      "wf_name": "WF-50 Send WhatsApp Message",
      "wf_short": "WF-50",
      "json_sha256": "abc123…",
      "json_n8n_updatedAt": "2026-05-22T08:12:34.000Z",
      "pseudo_path": "pseudocode/WF-50.pseudo",
      "md_path": "md/WF-50.md"
    }
  ]
}
```

`json_n8n_updatedAt` is transcribed verbatim from the n8n API response (`updatedAt` field). It is allowed to carry milliseconds because the project Timestamp Convention exempts verbatim-from-API values from the `YYYY-MM-DDTHH:MM:SSZ` rule. All other timestamps in this manifest follow the project convention.

The manifest is the source of truth for the restore script's selective-restore feature. It also lets future audits reconstruct what was snapshotted without re-querying n8n.

---

## 4. `scripts/snapshot-for-sprint.sh`

**Invocation:** `scripts/snapshot-for-sprint.sh <sprint-name>` (e.g., `data-contract-phase-1`)

**Behaviour:**

1. Reads `.env` for `N8N_API_KEY`.
2. Resolves target folder = `workflows/pre-<sprint-name>-workflows/$(date -u +%Y-%m-%d)/`.
3. If folder exists, abort with message: *"Snapshot folder already exists. Pass `--force` to overwrite, or pass `--suffix=2` to write to `…-2/`."*
4. Reads the in-scope workflow ID list from a config block at the top of the script — a hard-coded array of WF IDs covering all impacted workflows for the named sprint. Hard-coded rather than auto-discovered: scope is decided at design time, not derived; explicit list is auditable.
5. For each WF ID:
   - `curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "http://localhost:5678/api/v1/workflows/<id>"` → write to `json/<id>.json`.
   - Compute `sha256sum` of the JSON.
   - Look up the corresponding `WF-XX.pseudo` and `WF-XX.md` from `docs/pseudocode/` (mapping WF ID → WF-XX done by reading the workflow's `name` field; cross-checks against `workflow-registry.md`).
   - Copy `.pseudo` and `.md` to their respective subfolders.
   - Record entry in `manifest.json` (in-memory; write at end).
6. If any export fails (non-200, malformed JSON), abort: remove the partial folder, exit non-zero with error.
7. Write `manifest.json`.
8. Print summary: N workflows snapshotted, folder path, total size.

**Exit codes:**
- `0` success
- `1` prerequisite missing (no `.env`, no API key)
- `2` snapshot already exists
- `3` n8n unreachable
- `4` export failure mid-run

---

## 5. `scripts/restore-from-snapshot.sh`

**Invocation:**

| Form | Effect |
|---|---|
| `scripts/restore-from-snapshot.sh <sprint-name>` | Restore ALL workflows in the latest dated snapshot for this sprint |
| `scripts/restore-from-snapshot.sh <sprint-name> --workflows WF-50,WF-51` | Restore only listed WFs (by short name) |
| `scripts/restore-from-snapshot.sh <sprint-name> --workflows BUVun38WEKb12zg9,wlZRK0YxnhP0b2RL` | Restore by n8n ID |
| `scripts/restore-from-snapshot.sh <sprint-name> --date 2026-05-24` | Restore from a specific dated snapshot (default: latest) |
| `scripts/restore-from-snapshot.sh <sprint-name> --dry-run` | No writes; validates JSONs parse + n8n reachable + each PUT URL well-formed + previews the file diff per WF |

**Behaviour:**

1. Reads `.env` for `N8N_API_KEY`.
2. Resolves snapshot folder; aborts if missing.
3. Reads `manifest.json`; filters entries by `--workflows` if provided.
4. **Dry-run path:**
   - For each filtered entry: read JSON, validate `jq . <file>` succeeds, verify n8n endpoint reachable.
   - Diff current live workflow JSON against snapshot JSON; print summary (nodes added/removed/changed at top level).
   - Print list of `.pseudo` and `.md` files that would be overwritten.
   - Exit `0` without writing anything.
5. **Real-run path:**
   - For each filtered entry:
     - `curl -X PUT -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json" --data @<json> "http://localhost:5678/api/v1/workflows/<id>"`
     - If non-200, log failure; continue to next (don't abort mid-restore — partial restore is better than half-restored chaos; user is informed in the summary which workflows succeeded vs failed).
     - Copy `.pseudo` and `.md` back to `docs/pseudocode/` (overwriting current files).
6. Print summary table: `WF-XX → SUCCESS/FAILED → optional error msg`.
7. Exit `0` if all succeeded; non-zero with count of failures otherwise.

**Notes:**
- PUT (not PATCH) per project CLAUDE.md "Accessing n8n" section.
- Restore does NOT re-enable disabled workflows automatically (n8n's `active` flag is part of the workflow JSON; restoring the JSON restores the flag — a workflow disabled in snapshot stays disabled on restore). This is intentional; user manually re-enables after smoke-testing the restore.

---

## 6. Manifest-driven selective restore (the unit-rollback enabler)

The parent design requires "restore the workflows touched in this unit" as a rollback trigger. The manifest enables this cleanly:

```bash
# Unit 1 (WF-52) rollback example:
scripts/restore-from-snapshot.sh data-contract-phase-1 --workflows WF-52,WF-22
#   → restores only WF-52 + its sole caller (WF-22); leaves other units' work intact
```

The unit-to-WF mapping is documented in the sprint plan (output of `plan-sprint`), not in this script — `plan-sprint` owns "which WFs are in which unit."

---

## 7. What these scripts do NOT do

- **Do not back up `chinmay_astro` DB tables.** Phase 1 doesn't touch DB schema or data. If a future phase changes schema, a separate DB snapshot mechanism is needed (out of scope here).
- **Do not back up credentials.** n8n credentials are stored encrypted in the n8n DB and shouldn't be in version control. Credential IDs are referenced in workflow JSONs but the credential values themselves are not exported.
- **Do not push to GitHub.** Snapshot folder is local; user commits + pushes at their discretion. Recommendation: commit the snapshot folder immediately after snapshot, so it's safe in the remote even if local disk fails mid-sprint.
- **Do not auto-restore on workflow execution failure.** Rollback is a deliberate human decision. Scripts make it cheap; they don't automate it.

---

## 8. Effort estimate

Both scripts are <100 lines each in bash. Estimated 1 session to write + test both. Implementation is the first task of the sprint, before any workflow edits.
