## Stopping Point

Technical workflow review (10-check scan of all 28 workflows + Postgres) complete. Plugin v1.7.0 pushed (lint hook + build-workflow SQL column cross-check). 6 confirmed runtime bugs identified — none yet fixed; require SSH tunnel to n8n/Postgres.

## Next Action

**Open SSH tunnel first:**
```bash
ssh -L 5678:localhost:5678 -L 5050:localhost:5050 -L 5432:localhost:5432 root@45.79.125.184
```

Then fix confirmed runtime bugs in this order (all block go-live):

### F-01 — Add `stage` column to `users` table
```sql
ALTER TABLE chinmay_astro.users ADD COLUMN IF NOT EXISTS stage VARCHAR(50);
```
Run via `mcp__postgres__query`. Fixes WF-44 (`Save Feedback to DB`) and WF-45 (`Set status=payment_pending`) which SET `stage = NULL` — currently throws "column does not exist".

### F-02 — Fix `admin_actions` INSERT column names
- WF-47 Unsubscribe Handler — opt-out INSERT: `action` → `action_type`
- WF-11 Command Parser — UNBLOCK INSERT: `action` → `action_type`, `reason` → `notes`
Use `mcp__n8n__n8n_update_partial_workflow` with `patchNodeField` on the `query` parameter.

### F-03 — Downgrade executeWorkflow nodes from v2 → v1
Affected nodes (typeVersion = 2, max supported = 1.3):
- WF-20 Keyword Handler: `Send HELP Response` node, `Route to Rebook` node
- WF-45 Rebook Handler: `Send Payment Instructions` node
- WF-12 Admin→WhatsApp Relay: `Call WF-50 Send WhatsApp` node
Use `mcp__n8n__n8n_update_partial_workflow` with `patchNodeField` setting `typeVersion` to 1.

### F-04 — Fix workflowId object bug in WF-47
Two executeWorkflow nodes in WF-47 (`Send Hold Message via WF-50`, `Send Opt-out Confirmation via WF-50`) have workflowId stored as a resource-locator object instead of string. 
Fix: in n8n UI, open each node, re-select WF-50 in the workflow dropdown, save. (Cannot be fixed via API — needs UI re-selection to resolve the locator.)

### F-05 — Add `=` prefix to Postgres query fields
All of these have `{{ }}` expressions in the query field without `=` prefix:
- WF-45 `Load User Record` — `WHERE phone_number = '{{ ... }}'`
- WF-45 `Set status=payment_pending` — UPDATE with literal phone
- WF-11 `Lookup Blocked User` — UNBLOCK lookup
- WF-11 `Unblock User` — UPDATE + INSERT
- WF-40 `Load User Record` — relay user context lookup
- WF-46 `Get User Slack Channel` — channel ID lookup
- WF-47 `Get User Slack Channel` — channel ID lookup
Use `mcp__n8n__n8n_update_partial_workflow` with `patchNodeField` on each `query` field.

### F-06 — Fix unmatched brackets in WF-43 Gemini node
`Gemini General Response` HTTP Request node — `jsonBody` expression has unmatched `{{ }}`.
Open in n8n UI → find the unmatched bracket → fix → save. Then export and commit WF-43.

## After Fixes

1. Export all modified workflows to `workflows/*.json`
2. Run secrets scan: `grep -rn 'AIzaSy\|sk-\|xoxb-\|AKIA' workflows/`
3. Commit + push to GitHub
4. Run smoke test (see `handoff-sprint-tech-debt-2026-05-16-before-mvp-complete.md` for smoke test scope)

## Verify Before Go-Live (Post-Fix)

- **F-07**: Open Slack nodes in WF-11, WF-33, WF-34, WF-41, WF-42, WF-46, WF-51 in n8n UI — if operation dropdown shows blank/invalid, re-select `post` and save.
- **F-08**: Run admin command smoke test — verify APPROVE/REJECT/CLOSE/BLOCK pass data to sub-workflows correctly (tests `mappingMode: passthrough` in WF-10, WF-11, WF-33).
- **F-09**: Add `onError: "continueRegularOutput"` to webhook nodes in WF-00 and WF-10 to prevent Meta/Slack retries on processing errors.

## Review Artifacts

- Tracker: `docs/superpowers/TechnicalWorkflowReview_tracker.md`
- HTML report: `docs/superpowers/TechnicalWorkflowReview_2026-05-16.html`
- Both files are in Google Drive but NOT yet committed to GitHub.

## Plugin Changes This Session

- v1.7.0 pushed to GitHub (`d6a1a7c`), synced to cache (1.1.0):
  - `hooks/post-workflow-lint.sh` — 4 new runtime-breaking checks (executeWorkflow v2, workflowId type, Postgres `=` prefix, unmatched brackets)
  - `skills/build-workflow/SKILL.md` — DB-Schema Step 4: SQL column cross-check against `information_schema.columns`
- v1.6.0 from previous session: `technical-workflow-review` skill + `build-workflow` env var quirk

## Blockers

- VPS session items still pending from `docs/sprint-tech-debt-2026-05-16-post-MVP.md`: STATUS-TD-01, STATUS-TD-02, TD-NEW-001, TD-NEW-019, STATUS-TD-05
- TD-NEW-012 closed by design (WF-50 phone-number-id hardcoded by choice)
- F-04 (WF-47 workflowId fix) requires n8n UI — cannot be done via API
