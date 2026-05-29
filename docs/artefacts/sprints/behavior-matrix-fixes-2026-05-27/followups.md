# Follow-ups — behavior-matrix-fixes-2026-05-27

## Plugin improvements (deferred — flush at batch/sprint boundary, not mid-batch)

### [2026-05-29] Handoff commit-status line must be commit-agnostic when handoffs are repo-tracked
- **Target:** `handoff` skill (+ `build-sprint` Step 4a / Step 4.6 commit-vs-handoff ordering note).
- **Observed on:** `handoff-bmx-batch1-complete.md`. The handoff was deliberately written BEFORE the batch commit so it rides in the same push (correct, existing pattern), but asserted "NOT yet committed/pushed" + "Next Action: commit + push" — which went stale the instant commit `8723082` landed (the handoff was an `added` file in that very commit). Local and GitHub copies were byte-identical → NOT local-vs-remote drift; a pre-commit snapshot frozen into the commit and never reconciled.
- **Gap:** prior session already flagged the "write handoff before commit" ordering, but that note only solved "get the handoff into the same commit" — not "the handoff now lies about its own commit status."
- **Fix:** when handoffs are repo-tracked, phrase the commit-status line commit-agnostically, e.g. *"Batch N changeset is committed as the same push that carries this handoff; if you see this file on `main`, the batch is pushed"* — instead of the absolute "NOT yet committed." Keeps the snapshot true after the push.
- **Priority hint:** low (process clarity; no functional impact). Flush via `flush-plugin-improvements` at end of batch/sprint per priority.


## [2026-05-29] — Adjacent finding during BMX-P0-U1 (WF-53 build)

- **WF-53** (U1 Gemini Error Handler): the admin-alert text (locked copy, carried verbatim from WF-43) ends with "The user has been told there's a technical hiccup and that the team will follow up." This sentence is emitted **unconditionally**, before the `User-Facing?` IF — so on a non-user-facing invocation (`userFacing=false`, where no apology is sent) the admin is told the user was notified when they were not.
  - **Classification:** adjacent (not in the build's strict scope; locked copy was implemented verbatim per the "no decisions remain" handoff).
  - **Cause/effect:** admin alert fires upstream of the userFacing branch; locked copy assumes the user-facing case. All *current* callers (WF-21/23/43 Gemini-answer failures) are user-facing, so the line is accurate for every real invocation today; the mismatch is latent and only surfaces if a future caller passes `userFacing=false`.
  - **Proposed fix:** make the closing "The user has been told…" sentence conditional on `userFacing` inside the Build Admin Alert Code node (the first half of the alert is identical either way). Parametric change, no flow impact.
  - **Priority hint:** low — defer to whenever a non-user-facing caller of U1 is first introduced, or fold into the BMX-P1-PSEUDO authoring of WF-53.pseudo.
  - **Decision:** _pending user direction._
  - **Update 2026-05-29 (halt-both change):** U1 now halts on both branches (BMX-P0-U3 session). On the non-user-facing path the admin alert fires, the apology is skipped, then U1 halts — so the unconditional "The user has been told…" sentence is now actively wrong on that path (admin told the user was notified; no apology was sent). Still latent (no non-user-facing caller exists). Fix unchanged: make the closing sentence conditional on `userFacing` in the Build Admin Alert Code node — fold into BMX-P1-PSEUDO authoring of WF-53.pseudo (Batch 3).
