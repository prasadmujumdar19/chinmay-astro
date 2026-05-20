# Sprint input — Pre-go-live remediation (smoke-2026-05-19)

**Source:** smoke test session `docs/artefacts/tests/smoke-pre-golive-resume-2026-05-19/`
**Date written:** 2026-05-19
**Intended use:** pass to `plan-sprint` (then `build-sprint`). The list below is structured so each line is one sprint item.

## Items

1. **WF-44 Save Feedback to DB — fix Postgres parameter binding.** `[critical]` Node currently has `$1, $2` in SQL but `queryReplacement: null` → every feedback save errors with "there is no parameter $2". Convert to array-form `={{ [$json.feedbackText, $json.userId] }}` (verify upstream field names first). Also verify `chinmay_astro.users` has both `feedback` and `stage` columns. See `followups-wf44-feedback-recorder.md`. **Validation:** re-run TC-0404 end-to-end; `users.id=N.feedback` populated; user receives thank-you via WF-50.

2. **WF-60 Message Logger — architectural rebuild.** `[critical]` Logger runs successfully in 22–101 ms with zero rows persisted across 8 message events. Operator UI inspection found systematic cross-node variable mismatches ("variable used in next node but previous code node never returns it"). Rebuild plan: define canonical input contract, update all callers via mapper nodes, simplify WF-60 to 2 nodes (insert + non-fatal error branch). See `followups-wf60-architecture.md`. **Validation:** inbound + outbound WhatsApp + 1 Slack relay → 3 correctly shaped rows in `chinmay_astro.messages`; WF-60 failure does NOT fail parent chains.

3. **Audit-log path — admin_actions never written.** `[major]` `chinmay_astro.admin_actions` is globally 0 rows despite every admin command (APPROVE, REJECT, CLOSE, BLOCK, UNBLOCK) being expected to land an audit row. Pre-step: grep all 28 workflow JSONs for `admin_actions` references to determine whether the audit-writing node was ever built. If absent → build the feature (likely a sub-workflow callable from WF-11 / WF-33 / WF-41 / etc.); if present but broken → fix per the same family as BUG-NEW-03. See `followups-audit-log-gaps.md`. **Validation:** every APPROVE / CLOSE etc. lands one row in `admin_actions` with `user_id, action_type, performed_by, notes` populated.

4. **Run technical-workflow-review on missed workflows.** `[major]` This smoke session exercised WF-00/01/02/10/11/20/33/40/43/44/50/51/60 functionally. The 15 remaining active workflows (WF-21, WF-22, WF-23, WF-25, WF-30, WF-31, WF-32, WF-41, WF-42, WF-45, WF-47, WF-52, and any P3/utility workflows) were NOT touched. Run the plugin's `technical-workflow-review` skill scoped to **only the un-exercised workflows** so its static checks catch the same class of issues (queryReplacement-comma-string, jsonBody raw-string, missing parameters, disabled/orphaned nodes, schema drift, etc.) before live testing reaches them. **Validation:** report HTML produced in `docs/artefacts/reviews/`, with explicit "all 15 reviewed" coverage statement; any new findings spawn their own sprint items.

5. **`payments.status` naming consistency.** `[minor]` Column is `verified_at`, value is `approved`. Decide canonical (recommend `verified` to match the column) and align. See `followups-audit-log-gaps.md` MINOR-01. Low blast radius, nice to clear before go-live but not blocking.

## Out of scope for this sprint (already captured separately)

- `PLUGIN-01 / PLUGIN-02` static checks landing in `n8n-whatsapp-methodology` plugin — tracked in plugin's own changelog.
- Gemini 2.5-flash-lite 503 transients (CLAUDE.md `TD-NEW-016`) — `retryOnFail=true` mitigates; just watch the rate.
- `WF-23 / WF-30 / WF-44 userStatus input-contract` cleanup (from prior session) — folded into item 4 if technical-workflow-review surfaces it.
- `WF-11 STATS day-boundary` — explicitly accepted as won't-fix.

## Carry-forward test state

- User `61466927921` (id=28) is `consultation_closed`. Consultation id=10 closed. Slack channel `C0B567A175W` preserved (DR-10).
- Sprint validation can either resume from this state (use existing user) or wipe per CLAUDE.md clean-slate SQL before re-running TC-0404.
- Outstanding payment notifications in C0B567A175W are historical; no admin action required.

## Dependencies between items

- Items 1, 2, 3 are independent — can be done in any order or in parallel.
- Item 4 should ideally precede or run alongside item 2 since the review may surface additional caller-mapping issues that affect the WF-60 rebuild.
- Item 5 is independent and can be done any time.

## Suggested priority order for plan-sprint

`item-1 (WF-44) → item-2 (WF-60) → item-4 (technical-review) → item-3 (admin_actions audit) → item-5 (naming)`

Reasoning: WF-44 unblocks the feedback path (user-facing); WF-60 unblocks compliance/history; technical-review prevents whack-a-mole on the un-exercised half; admin_actions is internal-only audit and can wait; naming is cosmetic.
