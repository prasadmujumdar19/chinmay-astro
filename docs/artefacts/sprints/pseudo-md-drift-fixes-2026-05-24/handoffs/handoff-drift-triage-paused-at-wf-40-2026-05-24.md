## Stopping Point

Per-WF drift triage for sprint `pseudo-md-drift-fixes-2026-05-24` paused after completing WF-32, WF-33, WF-34 (UTC 2026-05-24T05:43:50Z). Triage Phase 2 has now covered 16 of 27 WFs (the prior 13 from the WF-32 handoff plus WF-32, WF-33, WF-34 this session). `tasks.md` now carries 19 sprint items: TD-DRIFT-001..014 from prior sessions, plus six new this session — TD-DRIFT-015 (Canon A cross-cutting, **down-scoped to 1 WF-32 node** after audit found WF-33/34/42/46 are already canon-clean via DB-SELECT phone reads); TD-DRIFT-016 (WF-32 D9 structured Inputs); TD-DRIFT-017 (WF-33 D8 real bug — `payments.verified_by` writes channel ID instead of admin user ID; fix: read `input.adminUserId`); TD-DRIFT-018 (WF-33 pseudo sync — Step 5 'verified', Step 11 trim to match live brevity, structured Inputs); TD-DRIFT-019 (**new cross-cutting convention** — linear-numbering sweep across 6 pseudos: WF-11, 25, 32, 33, 34, 42 — drops all `(removed|deleted|reserved)` tombstones and renumbers; includes GOTO target updates for WF-25 Step 4 and WF-32 Step 4); TD-DRIFT-020 (WF-34 pseudo D8 + D9). Two `deferred-to-tech-sprint.md` entries added: WF-47 D5 alwaysOutputData (carried from prior session) and the new `payments.rejected_by` schema asymmetry observation surfaced during WF-34 (full functional + technical background written for later review).

## Next Action

Resume per-WF triage starting with **WF-40** (Active Consultation Relay — relays user messages ↔ admin Slack during live consultation, called by WF-01 in `consultation_active` state). Then continue sequence WF-41 → WF-42 → WF-43 → WF-44 → WF-45 → WF-46 → WF-50 → WF-51 → WF-52 → WF-60. Reminders for upcoming WFs:

- **WF-40** tracker findings: D3/D4 (.pseudo Step 4 describes conditional fork where Slack relay fires only after intent resolution; live wires `Format Slack Message` directly off `Call WF-25` output — for `stop_intent`, relay fires regardless of branch); D9 (vague Inputs). Likely a single pseudo-rewrite item once decision on "is live or pseudo correct" is made — surface to user during triage.
- **WF-42/43/44** are named in earlier cross-cutting items: WF-43/44 already in TD-DRIFT-009 (messageText→messageContent for WF-25 callers); WF-44 also in TD-DRIFT-012 (message→messageContent for WF-50 callers); WF-42 in TD-DRIFT-019 (linear renumber). Surface these facts during their per-WF triage and avoid duplicating those fixes.
- **WF-46 / WF-41** are Canon-A relevant per the WF-32 audit table — apply Canon A reasoning during triage (already established: only WF-32 needed a live edit; all others were already compliant via DB-SELECT).
- For each WF: read `docs/pseudocode/WF-XX.{pseudo,md}`, grep tracker `### WF-XX findings` in `docs/artefacts/drift-checks/2026-05-24/tracker.md`, then run the audit-before-spec pattern per [[feedback_audit_before_spec]] + [[feedback_systemic_before_individual]]. Apply [[feedback_pseudo_tech_separation]] to auto-defer n8n-mechanism findings, and [[feedback_pseudo_linear_numbering]] (new this session) to default to renumber-not-tombstone for any step-numbering questions.

## Blockers

- **No user input blockers** for resuming WF-40. Established decision patterns from this session that should carry into remaining triage:
  - **Canon A (TD-DRIFT-015)** governs WF-01 children: top-level `phoneNumber` is the canonical phone source. DB-SELECT-result `user.phone_number` reads are exempt from Canon A realignment per audit step 3.
  - **Linear numbering (TD-DRIFT-019)** is the new pseudo convention: no tombstones, no reserved steps, no `Step N: (removed/deleted/reserved)` entries. Renumber on every step removal and update GOTO targets. Git owns history. Saved to memory [[feedback_pseudo_linear_numbering]].
  - **Audit-before-cross-cutting-fix** pattern remains the rule: triage that finds a finding crossing workflow boundaries should run the 5-step pre-edit impact analysis (caller-mapping audit, per-leaf node audit, trigger-vs-DB classification, passthrough-chain audit, sample-run dry verification) INTO the sprint item, not deferred to build-sprint's standard phase. Used twice this session (Canon A audit + tombstone audit) — both surfaced material scope corrections.
  - **Cross-WF audit can flip a finding's classification.** WF-33 D8 was originally tracker-classified "field-name alias unresolved"; cross-WF audit (WF-11 sends both `adminUserId` and `channelId`) revealed it's actually a real bug (wrong value written to `payments.verified_by`). Run the cross-ref audit on every D-class finding that names an input field shared across WFs.

- **Pre-existing tasks.md anomaly (not fixed):** Duplicate `### TD-DRIFT-001 · WF-00 nfm_reply parse path — fix live` heading at lines 66 and 111 (one in 🔴 P0 section, one in 🟠 P1 section). Likely paste-error during a prior P0↔P1 reclassification. User informed; chose to defer dedupe. Address before sprint execution if not earlier.

- **Plugin improvement candidates (not applied this session):**
  1. (Carried from prior handoff, still pending) The `pseudo-md-drift-check` skill says "do not dispatch one subagent per pair" — the override pattern (27 parallel Sonnet subagents in background, parent-aggregates JSON) worked well and should be documented as a valid override path with discipline (run_in_background=true, strict-JSON schema, parent-only writes).
  2. (Carried) The D8/D9 rubric in `pseudo-md-drift-check` should call out a router-workflow distinction between **consumed inputs** and **passthrough-to-sub-workflow inputs** — repeatedly relevant this session (WF-02, WF-11, WF-23, WF-31). Confirmed again this session by WF-11 passthrough (TD-DRIFT-017 root cause) and WF-34 unused `channelId`/`channelName` (TD-DRIFT-020).
  3. (Carried) Elevate `feedback_pseudo_tech_separation` from project memory to plugin principle.
  4. (Carried from WF-32 handoff) Document the **"audit-before-cross-cutting-fix"** pattern as a build-sprint principle: when a triage finding looks single-WF but the field/contract crosses workflow boundaries, an explicit 5-step pre-edit impact analysis (caller-mapping audit, upstream-node audit, passthrough-chain audit, sub-workflow internal trace, sample-run dry verification) goes INTO the sprint item itself. Reinforced this session — both Canon A and tombstone-renumber items used this pattern and benefited from the discipline.
  5. **(New, 2026-05-24)** The drift-check D-class rubric should formalize the audit pattern that revealed TD-DRIFT-017: a D8-style "input declared but consumed under different name" finding requires a cross-WF audit of the caller-side envelope before scoping the fix, because the rename may mask a real value mismatch (e.g., WF-33 was writing channel ID into a column meant for admin user ID). Document as a D-class refinement: "D8.5 — input alias finding requires caller-side cross-check before triage decision."
  6. **(New, 2026-05-24)** The plugin should add an explicit "linear pseudo numbering" convention principle (or reference [[feedback_pseudo_linear_numbering]] from a plugin doc) — the tombstone-vs-linear question recurred during WF-34 triage and the user firmly rejected tombstones. Worth promoting to plugin-level guidance so future plugin users default correctly.

  Apply via `flush-plugin-improvements` skill in a future session — context too high (~62%) to do it cleanly now.

## Changed Reference Values

None. No credentials, n8n IDs, URLs, or environment values changed this session.

New artefacts created or modified (existing-locations, not changed values):
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md` — 6 new sprint items added this session (TD-DRIFT-015 with mid-session scope down-revision, TD-DRIFT-016, TD-DRIFT-017, TD-DRIFT-018, TD-DRIFT-019, TD-DRIFT-020).
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/deferred-to-tech-sprint.md` — new "Schema observations" section added with full context for the `payments.rejected_by` asymmetry (functional + technical background + 3 options + recommendation).
- `docs/artefacts/drift-checks/2026-05-24/tracker.md` — WF-32, WF-33, WF-34 rows and their finding sections updated with triage status (🔴 DRIFT → 🟡 TRIAGED) and sprint-item cross-references.
- `~/.claude/projects/.../memory/feedback_pseudo_linear_numbering.md` (new memory) — pseudo files must use linear Step 1..N; no tombstones. Indexed in `MEMORY.md`.
