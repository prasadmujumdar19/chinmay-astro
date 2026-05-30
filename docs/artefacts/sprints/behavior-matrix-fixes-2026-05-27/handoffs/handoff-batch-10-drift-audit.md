## Stopping Point
Batch 10 (Phase 5 · Verify) — **BMX-P5-DRIFT audit + .md regen complete**; BMX-P5-MATRIX not started.

The drift audit ran as a read-only, scratch-only sweep: 31 workflows, fresh `.md` generated from freshly-downloaded live JSON vs fresh Git `.pseudo`, split into **sprint-group (17)** and **existing-group (14)**, executed by 11 parallel read-only Sonnet sub-agents (all ≤219s, under the 300s cap). Findings cover drift, data-contract compliance, and pseudo-convention consistency. Full deliverable: `docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/BMX-P5-DRIFT-report.md` (PART A sprint-group, PART B existing-group, PART C conventions, PART D disposition, **PART E live-verification verdicts**).

Fresh `.md` for all 31 workflows checked into `docs/pseudocode/` (the BMX-P5-DRIFT regen deliverable). `workflows/*.json` left untouched — verified 0 functional (nodes+connections) diffs vs live (only volatile metadata differs; phantom-diff avoidance). `.pseudo` NOT modified this session (audit was read-only) → nothing to check in for pseudo.

## Next Action
Pick up in a fresh session:
1. **Fix the confirmed HIGH (sprint-group):** WF-31 **and** WF-43 pass `messageText` (absent from the WF-02 envelope — `Detect Route` emits top-level `messageContent`, no flat `messageText`/`userId`/`userStatus`) into `Call WF-25`, which classifies `input.messageContent` → both misclassify free-form text (WF-31 payment_submitted; WF-43 consultation_closed). Fix = map `messageContent: {{ $json.messageContent }}` (WF-30/WF-40 already do this). Also add the **WF-25 entry-guard hard-fail** (root cause — `Prepare Intent Request` uses `||` fallbacks, silently degrades). Do under `build-workflow`; sync the affected `.pseudo`. Decide: new sprint item vs fold into Batch 10.
2. **BMX-P5-MATRIX** (sprint exit gate): walk affected matrix cells (S1×E/F, S2×D/E, S4×D, S5×D, S7×G, S8×A–I, S10×E) using `docs/artefacts/reviews/behavior-matrix-2026-05-27/index.html`; **update S8×G** (opted_out+media re-engages via WF-26, not zero-outbound); run the deferred real-phone opted_out smoke (reset a test phone to opted_out). NOTE: re-verify the S-cells for payment_submitted/consultation_closed AFTER the WF-31/WF-43 fix, else the matrix tests buggy behavior.
3. **Existing-group findings (pre-existing, OUT of BMX scope → future cleanup sprint):** WF-33 writes `status='verified'` vs pseudo `'approved'` (reconcile); WF-22 never extracts `email_address` (inserts NULL); WF-11 doesn't enforce non-empty BLOCK `reason` + string-interpolated SQL + re-SELECT.

## Blockers
None. SSH tunnel was open this session (needed for the live JSON download); reopen it next session for the fixes + matrix smoke.

## Changed Reference Values
None changed. (Read-only session. Fresh `.md` reflect current live; no workflow IDs or live state altered.) Open sprint-close item still pending: CLAUDE.md WhatsApp Flow ID drift (`1408011897720771` vs live `2260297164474475`).

## False positives corrected during verification
The audit's "empty `defineBelow value:{}` mapping = bug" flags (WF-43/WF-47/WF-26 sub-workflow calls) are **withdrawn** — WF-02's own working `Call WF-30`/`Call WF-31` use the same empty-`defineBelow` pattern, confirming it passes the parent item through (executeWorkflow v1.2 + passthrough triggers). Not bugs.
