## Stopping Point

Sprint `followups-for-plan-sprint` Batch 1 (P0) is fully done, committed, and pushed (commit `df3b24b` on `prasadmujumdar19/chinmay-astro` main). User requested Batch 2 in the next session.

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/artefacts/tests/smoke-pre-golive-continued-2026-05-20/followups-for-plan-sprint.md`. Skill will auto-resume at the first unfinished item in Batch 2 (TD-E by source order, but execution-mode plan below).

Recommended Batch 2 order:
1. **TD-G** first — housekeeping (export operator's WF-41 UI fix, `assert-md-fresh.sh WF-41`, commit). Mode B inline-inherit. Quickest win, no design judgment.
2. **TD-E** — WF-40 add WF-25 intent classification. **Pseudo-first** per [[feedback_pseudocode_first_refactor]] — revise `docs/pseudocode/WF-40.pseudo`, user approves diff, impact-analysis on revised pseudo, then implement. Mode A full `build-workflow` inline.
3. **TD-F** — WF-50 outbound + WF-00 inbound content extraction for `interactive` and `template` message types. Pseudo-first for both `WF-50.pseudo` and `WF-00.pseudo` — user approval on diffs, then WF-60 canonical contract impact-analysis, then implement both. Mode A.
4. **TD-H** — verification-only; defer to next test session (tagged `next-test-session`, hard dep on TD-A which is already done). Mark deferred at end of Batch 2.

## Blockers

- **STOP-flow acceptance verification (TD-B-expanded)** deferred to next test session — the new unconditional STOP + consultation auto-close + Slack notice paths have not been exercised live. Not a blocker for Batch 2 work itself; just outstanding test debt to roll into the next monitor-test-run.
- **Plugin improvement candidate** — derived in TD-C this session: "n8n IF strict-mode + numeric `.id` + upstream SELECT with `alwaysOutputData:true` → leftValue evaluates to `undefined` on not-found → strict-mode errors". The `Number($json.id || 0)` coercion is the working fix. Suggest adding this to `technical-workflow-review` standard battery alongside the existing Postgres `alwaysOutputData` check. Defer to Batch 3 (plugin-repo); fits naturally with PIC-03 / PIC-04 / PIC-05 work.

## Changed Reference Values

None. No credentials, channel IDs, workflow IDs, or URLs changed this session.
