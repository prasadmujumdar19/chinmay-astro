## Stopping Point
Batch 13 (payment lifecycle — WF-34 rejection-payload un-nest, WF-33 richer admin activation notice + T9 array params + pseudo-lag, WF-32 T9 array params) is complete and committed; post-batch regression PASSED (78 edges unchanged, WF-34 double-nest bug-class sweep clean across all 31 workflows, whole-`workflows/` lint exit 0 / 162 advisory unchanged from Batch 12).

## Next Action
Re-invoke `build-sprint "behavior-matrix-fixes-2026-05-27"`; it resumes at Batch 14 — **BMX-R14-WF22** (WF-22 Form Response Handler, n8n ID `dr8QM0m92Ml8MvIh`): extract `email_address` from the Flow response so the existing INSERT binding stops writing NULL + convert the `Save Slack Channel ID` queryReplacement to array form (T9 — confirmed the only remaining non-array comma-joined queryReplacement live) + bump the `Create User Record` Postgres node typeVersion to the workflow floor (T11). The WF-22 create-failure-swallow HIGH (T3) is explicitly deferred to TD-NEW-035 — NOT in this item.

## Blockers
None blocking. Plugin improvement to flush at Batch 18 (already noted in `followups.md`): "Out-of-core field sourcing — when a plan prescribes 'add a minimal SELECT' for fields absent from the envelope, first check whether an existing upstream `RETURNING *` write node already returns them on the executed path; read from it (`$('<node>')`) instead of adding a redundant SELECT — smaller blast radius, no extra round-trip" (validated on WF-33 DOB/TOB/Place via `Update User Status`).

## Changed Reference Values
WF-34 versionId `4fb0c4f9`; WF-33 versionId `30d61e11`; WF-32 versionId `3b8d0b27`. Backups: `archive/backups/se82n3MUQ9xE5aEr-2026-05-30-23-53.json`, `NcHZedq9ycnAQ9SW-2026-05-30-23-58.json`, `emUOLWVZiNVxcOe3-2026-05-31-00-01.json`.
