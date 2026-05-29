# Follow-ups — behavior-matrix-fixes-2026-05-27

## [2026-05-29] — Adjacent finding during BMX-P0-U1 (WF-53 build)

- **WF-53** (U1 Gemini Error Handler): the admin-alert text (locked copy, carried verbatim from WF-43) ends with "The user has been told there's a technical hiccup and that the team will follow up." This sentence is emitted **unconditionally**, before the `User-Facing?` IF — so on a non-user-facing invocation (`userFacing=false`, where no apology is sent) the admin is told the user was notified when they were not.
  - **Classification:** adjacent (not in the build's strict scope; locked copy was implemented verbatim per the "no decisions remain" handoff).
  - **Cause/effect:** admin alert fires upstream of the userFacing branch; locked copy assumes the user-facing case. All *current* callers (WF-21/23/43 Gemini-answer failures) are user-facing, so the line is accurate for every real invocation today; the mismatch is latent and only surfaces if a future caller passes `userFacing=false`.
  - **Proposed fix:** make the closing "The user has been told…" sentence conditional on `userFacing` inside the Build Admin Alert Code node (the first half of the alert is identical either way). Parametric change, no flow impact.
  - **Priority hint:** low — defer to whenever a non-user-facing caller of U1 is first introduced, or fold into the BMX-P1-PSEUDO authoring of WF-53.pseudo.
  - **Decision:** _pending user direction._
