## Stopping Point

Per-WF drift triage for sprint `pseudo-md-drift-fixes-2026-05-24` paused mid-walkthrough at the WF-32 step (UTC 2026-05-24T01:28:17Z). Triage Phase 2 has now covered 13 of 27 WFs (WF-00, WF-01, WF-02, WF-10, WF-11, WF-20, WF-21, WF-22, WF-23, WF-25, WF-30, WF-31, WF-47). `tasks.md` carries 13 sprint items spanning P0/P1/P2: TD-DRIFT-001..014 (skipping numbers reserved during P1 promotions). Two cross-cutting P1 pairs emerged this session: (a) **TD-DRIFT-009** — canonical `messageContent` for WF-25 defineBelow callers (WF-23, WF-31, WF-43, WF-44) with extra-thorough impact-analysis discipline; and (b) **TD-DRIFT-012 + TD-DRIFT-013** — canonical `{phoneNumber, messageType, messageContent}` for WF-50 callers (WF-20, WF-30, WF-44 currently use legacy `message`/`messageBody`), followed by WF-50 `Prepare Payload` tightening to drop the legacy fallback chain. WF-21 was clean — its ripple closed via TD-DRIFT-002 addendum (`wasOptedOut` added to WF-01's opted_out → WF-21 output contract). One new deferred-to-tech entry added: WF-47 D5 alwaysOutputData.

## Next Action

Resume per-WF triage starting with **WF-32**, then continue sequence WF-33 → WF-34 → WF-40 → WF-41 → WF-42 → WF-43 → WF-44 → WF-45 → WF-46 → WF-50 → WF-51 → WF-52 → WF-60. Use the same Q-per-WF interactive pattern with `AskUserQuestion`. Before triaging WF-43 and WF-44, remember they are already named in TD-DRIFT-009 (messageText→messageContent for WF-25 callers) and WF-44 is also in TD-DRIFT-012 (message→messageContent for WF-50 callers) — surface those facts during their triage and avoid duplicating those fixes; the WF-43/WF-44 per-WF items should focus on any remaining D-class findings (likely Inputs blocks and minor representational gaps).

For WF-32 specifically: read `docs/pseudocode/WF-32.pseudo` and `docs/pseudocode/WF-32.md`, grep the tracker section `### WF-32 findings` in `docs/artefacts/drift-checks/2026-05-24/tracker.md`, then run the audit-before-spec pattern per [[feedback_audit_before_spec]] and [[feedback_systemic_before_individual]] — WF-32 is the payment-approval handler (calls WF-52, WF-51 to admin channel, etc.), so any caller-contract findings warrant a cross-workflow audit before scoping the fix. Apply [[feedback_pseudo_tech_separation]] to auto-defer n8n-mechanism findings to `deferred-to-tech-sprint.md`. Drop new pseudo-only items under the existing 🟡 P2 section in `tasks.md`; live-edit or cross-cutting items go under 🔴 P0 or 🟠 P1 as severity dictates.

## Blockers

- **No user input blockers** for resuming WF-32. Established decision patterns from this session: prefer canonicalize over accept-as-is for naming inconsistencies; surface sibling systemic scope before scoping a single-WF fix; document live behaviour in pseudo when live is functionally correct (not the other way around).

- **Plugin improvement candidates (not applied this session):**
  1. (Carried from prior handoff, still pending) The `pseudo-md-drift-check` skill says "do not dispatch one subagent per pair" — the override pattern (27 parallel Sonnet subagents in background, parent-aggregates JSON) worked well and should be documented as a valid override path with discipline (run_in_background=true, strict-JSON schema, parent-only writes).
  2. (Carried) The D8/D9 rubric in `pseudo-md-drift-check` should call out a router-workflow distinction between **consumed inputs** and **passthrough-to-sub-workflow inputs** — repeatedly relevant this session (WF-02, WF-11, WF-23, WF-31).
  3. (Carried) Elevate `feedback_pseudo_tech_separation` from project memory to plugin principle.
  4. (New, 2026-05-24) Document the **"audit-before-cross-cutting-fix"** pattern as a build-sprint principle: when a triage finding looks single-WF but the field/contract crosses workflow boundaries, an explicit 5-step pre-edit impact analysis (caller-mapping audit, upstream-node audit, passthrough-chain audit, sub-workflow internal trace, sample-run dry verification) goes INTO the sprint item itself — not deferred to build-sprint's standard phase. This session created two such items (TD-DRIFT-009 and TD-DRIFT-012) using this pattern at the user's explicit "extra cautious" direction. The five-check template is now reusable and worth elevating to a plugin reference doc or skill update.

  Apply via `flush-plugin-improvements` skill in a future session — context too high to do it cleanly now.

## Changed Reference Values

None. No credentials, n8n IDs, URLs, or environment values changed this session.

New artefacts created or modified (existing-locations, not changed values):
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md` — 7 new sprint items added this session (TD-DRIFT-007, 008, 009, 010, 011, 012, 013, 014); TD-DRIFT-002 amended with `wasOptedOut` output addendum (Fix step 3) to close the WF-21 ripple.
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/deferred-to-tech-sprint.md` — added WF-47 D5 alwaysOutputData deferral.
