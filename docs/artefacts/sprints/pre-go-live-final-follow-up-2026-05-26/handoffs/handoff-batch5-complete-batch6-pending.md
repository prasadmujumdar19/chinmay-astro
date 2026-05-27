# Handoff — Batch 5 complete, Batch 6 EXIT smoke pending

**Written at:** 2026-05-27T05:25:00Z
**Session covered:** Resume from Batch 4 pending → executed Batch 4 (TD-PGF-02 WF-00 nfm_reply + TD-PGF-03 WF-11 message→messageText) → committed/pushed (a47153a) → executed Batch 5 (TD-PGF-07 WF-10 adminMessage→messageText via jq+PUT; TD-PGF-08 closed via smaller-scope pseudo-only resolution after audit-vs-reality drift surfaced caller-contract gap) → committed/pushed (6c7b67f).

---

## Stopping Point

Sprint `pre-go-live-final-follow-up-2026-05-26` is at the **Batch 5 → Batch 6 boundary**, post-commit, post-push. 13 of 14 active items done (3 obsolete); only TD-PGF-11 (EXIT smoke test) remains. Two deferred items: (a) plugin-improvement flush for the `?.`-not-supported-in-`={{ }}` finding logged in the Batch 3 handoff; (b) the EXIT smoke itself, which is multi-hour wall-clock activity driven by the user.

## Next Action

**Begin Batch 6 EXIT smoke test for TD-PGF-11.** Invoke `/n8n-whatsapp-methodology:smoke-test` in a FRESH session (don't resume this conversation — context bloat from Batch 4+5 execution will hurt smoke-test attention). The smoke skill walks Phase A (happy-path journeys: J-01 onboarding [verifies TD-PGF-01B + TD-PGF-02], J-04 free-form text [verifies TD-PGF-05 WF-30], J-04 STOP, J-06 duplicate Payment-Completed [verifies TD-PGF-05 WF-32], J-08 admin APPROVE PAYMENT, J-10 bidirectional relay [verifies TD-PGF-07 round-trip], J-11 close + post-consult, J-13 REBOOK channel reuse [verifies TD-PGF-08 caller-contract path], J-19 opted-out re-engagement, admin HELP/LIST/STATS [verifies TD-PGF-03]) and Phase B (failure-path mini-smokes: TD-PGF-09 forced Gemini failure across all 5 caller states, garbage classification → WF-46 block, STOP from payment_submitted → WF-47 atomicity, cross-channel admin command → DR-13 polite reject).

Use `monitor-test-run` alongside for live observation (n8n executions, Postgres deltas, Slack activity, latency).

After smoke passes: re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/tasks.md` once to flip TD-PGF-11 ✅ done, trigger sprint-close (Step 5: remove `_active` marker, final registry + lint pass, final commit/push).

## Blockers

**Plugin improvement deferred — apply at sprint end before next sprint touches Gemini (per user direction this session):** Optional-chaining `?.` is NOT supported in n8n `={{ }}` expressions. Originally logged in the Batch 3 handoff (`handoff-batch3-complete-batch4-pending.md` Blockers section, lines 23–28). User opted to defer the flush until after the smoke test completes — apply via `flush-plugin-improvements` skill in a dedicated context after Batch 6 closes. The full text of the proposed plugin change is captured verbatim in the Batch 3 handoff; do not re-derive.

**No infra blockers.** SSH tunnel stable throughout this session. n8n MCP responsive. Postgres reachable.

## Changed Reference Values

None. All credentials, sub-workflow IDs, webhook URLs, and Flow IDs unchanged this session.

---

## Quick context for the next session (Batch 6 driver notes)

**Live state on entry to smoke test:**
- All 13 active sprint items applied to live n8n. Last live PUT: WF-10 (TD-PGF-07) at 2026-05-27T05:16:25Z; WF-11 (TD-PGF-03) at 2026-05-27T05:06:30Z; WF-00 (TD-PGF-02) at 2026-05-27T05:01:35Z.
- No mid-batch hot-fixes outstanding. No needs-decision items pending.
- The WF-45 envelope-everywhere completion that DIDN'T happen (TD-PGF-08 closed via smaller-scope pseudo-only) means rebook welcome for WF-44/WF-20 callers continues to show the personalized name (because the SELECT stayed); only WF-43's rebook path uses the passed envelope. J-13 verification should still pass for all caller paths.

**Smoke-test sequencing tip:** Phase A J-13 REBOOK exercises WF-43 → WF-45 path (where envelope IS passed). To exercise WF-44 → WF-45 (post-consultation feedback path), J-11 close + post-consult covers it. To exercise WF-20 → WF-45 (keyword REBOOK), trigger "REBOOK" via WhatsApp from a `consultation_closed` test user; this is part of the journey map's REBOOK keyword path. All three caller paths should produce a personalized welcome (because the SELECT inside WF-45 fetches the name regardless of caller envelope).

**Pre-batch-6 verifications to run first:**
1. SSH tunnel open: `curl -s -o /dev/null -w '%{http_code}\n' -m 5 http://localhost:5678/healthz` → expect `200`.
2. Test phone clean-slate per project CLAUDE.md "Clean-slate wipe" SQL block.
3. Slack consultation channel for the test phone should be deleted manually in Slack BEFORE J-01 (so WF-52 exercises the create-new path; Design Rule #10 — channels are never auto-archived).
