## [2026-05-16] — Post-sprint AOD audit (F-13, ad-hoc, no sprint ceremony)

- **WF-11 `Lookup Blocked User`** + **WF-10 `Load User Status`** — `alwaysOutputData: true` added by user (silent-halt risk when SELECT→IF guard returned zero rows). Verified live via fresh export: both nodes now `aod=True`. Audit covered all 28 workflows; no other Postgres SELECT→IF/Switch gaps found.

## [2026-05-16] — Post-batch Batch 2 regression

- **F-04 lint heuristic too broad.** Sibling scan found ~70 `executeWorkflow` nodes still using the `{__rl: true, value, mode}` workflowId locator across nearly every workflow. Production execution history (last 7d) shows most of these workflows run successfully (e.g., WF-51 7/7, WF-42 7/1), so the locator form itself is not universally runtime-broken. The original WF-47 break may have been specific to mode='list' or a malformed value. **Action:** narrow `post-workflow-lint.sh` workflowId-locator check to detect only the malformed subtype (e.g., `mode != 'id'`, or `value` missing/non-ID-shaped) rather than flagging every dict.
  - Found while verifying sibling of: F-04
- **Bulk export pipeline silently no-ops on Google Drive working dir.** The inline `curl ... | python3 -c '... > workflows/X.json'` pattern keeps the old file content + mtime. Two-step (`curl -o /tmp/raw.json` then separate Python write) works. **Action:** add `scripts/export-all-workflows.sh` that uses two-step + verifies `wc -c` per file; add a stop-hook check that diffs current n8n state against `workflows/*.json` to detect drift. Affects every prior session that "exported" workflows.
  - Found while verifying: Batch 1 commit/push
