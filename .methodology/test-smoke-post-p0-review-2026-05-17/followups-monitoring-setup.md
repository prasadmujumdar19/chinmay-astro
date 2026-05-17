# Followups — monitoring setup (smoke-test-post-p0-review 2026-05-17)

These are setup-time observations discovered while baselining the test session. They don't block the smoke test itself but should be cleaned up post-session.

## CLAUDE.md admin channel ID is stale

CLAUDE.md and the workflow-registry both list `C0A5B0ZE81E` as `chinmay-admin-commands`. That ID returned `channel_not_found` from Slack MCP this session. User-confirmed the actual admin channel is `C0AH2G4UMV1` (name: `all-chinmay-astro-admin`, marked `is_general: true`). Either the channel was renamed/recreated or the ID was always wrong.

**Action:** verify which workflows actually post to the admin channel (grep workflows JSON for both IDs) and update CLAUDE.md + workflow-registry.md to the correct ID. If WF-33 / WF-22 / WF-51 callers reference the stale ID, those workflows are silently failing admin alerts and need fixing.

## Slack bot membership in admin channel — resolved this session

`slack_get_channel_history` on `C0AH2G4UMV1` initially returned `not_in_channel`. User added the Slack app to the channel mid-setup; the bot can now read history. Captured the bot-join ts (`1779010283.141909`) as the baseline cursor for this session.

**For future sessions:** bot membership in `C0AH2G4UMV1` should now be persistent. If a future session hits `not_in_channel` again, the bot was removed — re-add via Slack channel settings.
