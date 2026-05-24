## Stopping Point

Per-WF drift triage for sprint `pseudo-md-drift-fixes-2026-05-24` is **complete** (UTC 2026-05-24T08:23:43Z). All 27 WF pairs in `docs/artefacts/drift-checks/2026-05-24/tracker.md` are now either ✅ CLEAN (WF-21) or 🟡 TRIAGED. `tasks.md` carries 32 catalogued triage items (TD-DRIFT-001 through TD-DRIFT-032) plus the cross-cutting / accepted-as-is / deferred-to-tech entries. The tracker's status column has been swept end-to-end so each WF row's status accurately reflects its triage coverage (per-WF row OR cross-cutting item OR deferred-to-tech entry). This session completed the last three per-WF rows (WF-51 → TD-DRIFT-030; WF-52 → TD-DRIFT-031; WF-60 → TD-DRIFT-032) and then corrected an inherited tracker reporting bug after user pushback that "we went through all workflows."

**Mixed-state caveat for `plan-sprint` / `build-sprint`:** This session went beyond pure-triage discipline for the three WFs it covered — TD-DRIFT-030/031/032 are both *catalogued* AND *executed* (the pseudo file edits for WF-51/52/60 are already applied; row body of each says "Done in this row's edit"). All earlier rows (TD-DRIFT-001…-029) are *catalogued only* — their pseudo/live edits await execution. `build-sprint` will need to detect-and-skip the three already-done items or mark them done up front so they don't re-execute. Verify by checking the pseudo files referenced in each row before executing.

## Next Action

Decide between two execution paths in the next session and run one:

**Path A — `plan-sprint` (recommended next step):** Run `plan-sprint @docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md` to formalize the TD-DRIFT-001…-032 catalog into a sprint state.md (dependency detection, priority validation, obsolete-detection, batch sizing). This does NOT execute anything — it produces the execution plan for review. **Before plan-sprint:** address the duplicate TD-DRIFT-001 heading at tasks.md lines 66 (P0) + 111 (P1) — known anomaly carried in every handoff since session 1; dedupe by deleting the wrong-priority occurrence and keeping the canonical-priority one. Then `build-sprint` to execute.

**Path B — flush plugin improvements first:** ~12+ plugin-improvement candidates have accumulated across handoffs (listed under §Blockers below). Invoke `flush-plugin-improvements` to apply them before the next sprint cycle so any methodology gaps that this triage surfaced get codified into the plugin (rather than rediscovered on the next project).

User preference at handoff time: Path A then Path B, or vice versa — both are valid.

## Blockers

- **TD-DRIFT-001 duplicate heading (carried from every prior handoff since session 1; still not fixed):** `### TD-DRIFT-001 · WF-00 nfm_reply parse path — fix live` appears at tasks.md lines 66 (in the 🔴 P0 section) AND 111 (in the 🟠 P1 section). Likely a paste-error during an earlier P0↔P1 reclassification. User informed in handoff §25 of prior sessions; chose to defer dedupe. **Must address before `plan-sprint` runs** — duplicate sprint-item keys will break dependency detection.

- **Plugin-improvement candidates (carried + new from this session):**
  1. (Carried) `pseudo-md-drift-check` skill should document the override pattern (27 parallel Sonnet subagents in background, parent-aggregates JSON) as a valid path with discipline.
  2. (Carried) D8/D9 rubric in `pseudo-md-drift-check` should call out router-workflow distinction between consumed inputs and passthrough-to-sub-workflow inputs.
  3. (Carried) Elevate `feedback_pseudo_tech_separation` from project memory to plugin principle.
  4. (Carried) Document "audit-before-cross-cutting-fix" as a build-sprint principle.
  5. (Carried) D8.5 rubric refinement — input-alias finding requires caller-side cross-check before triage decision.
  6. (Carried) Linear pseudo numbering convention promotion to plugin-level guidance.
  7. (Carried) Drift-check D1 rubric missed the WF-42 Slack-confirmation message-text divergence (multi-line embedded literal in a Code node).
  8. (Carried) Cross-cutting items with `mappingMode=passthrough` callers MUST audit the upstream Code/Set node (not just the Execute-Workflow node's `workflowInputs.value`).
  9. (Carried) "Read-source convention" pseudo-Notes pattern — when live mixes trigger-envelope reads and prior-node `$json` reads for identical values, the cleanest fix is a Notes-line annotation declaring the preferred convention rather than a live cleanup edit.
  10. (Carried) "Citation discipline for needs-decision moments" — when surfacing options to the user, cite specific `tasks.md` line numbers from prior decisions so the user can verify the precedent.
  11. (Carried) Discriminated-union Inputs template — for WFs with a discriminator field (`messageType`, `transport`, intent-result, etc.) partition Inputs into (a) discriminator + common required, (b) per-variant required, (c) passthrough fields. Now established in TD-DRIFT-029 (WF-50) AND TD-DRIFT-032 (WF-60) — pattern proven, ready to promote to a plugin-level Inputs-block authoring guideline.
  12. (Carried) Caller-list audit-on-handoff-reconciliation pattern — when a handoff's narrative caller-list ("called from WF-X and WF-Y") may be incomplete, run dependency-map audit before committing to per-WF item triage. Worth a build-sprint hook: "if next per-WF item has >1 caller per dependency-map, verify handoff narrative before triage."
  13. **(NEW, this session, TD-DRIFT-032 surfaced):** `generate-workflow-md.py` should surface top-level node-error-handling settings (`onError`, `retryOnFail`, `continueOnFail`) in the `.md` projection alongside `parameters`. Today the script reads only `.parameters`, missing these node-level settings — which causes spurious D6 minor "pseudo asserts X but `.md` doesn't show X" findings when the setting is correctly present in live JSON but invisible in the `.md` projection.
  14. **(NEW, this session, tracker sweep surfaced):** Tracker-status hygiene during per-WF triage — when a TD-DRIFT-### row is written for a WF, the tracker's per-WF status column should be flipped from 🔴 → 🟡 in the same edit batch. The carried tracker rows for WF-00 through WF-31 had stale 🔴 status until this session's end-of-triage sweep corrected them. Plugin candidate: `n8n-whatsapp-methodology:functional-code-review` (and any future per-WF triage helper) should auto-sweep status columns when TD rows are added — currently a manual discipline gap. **Reporting bug consequence:** without this discipline, the tracker reads as "12 WFs awaiting triage" when in fact those WFs are covered by existing TD-DRIFT rows; led to a misleading next-action question this session that the user had to correct.

  Apply all 14 via `flush-plugin-improvements` skill in the next session — context is fine but the user has chosen to end the session.

- **No user-input blockers for `plan-sprint`** once the TD-DRIFT-001 dedupe is done.

- **No deferred-to-tech-sprint changes from this session** beyond the WF-51 D3 row (Slack API failure error branch) already added.

## Changed Reference Values

None. No credentials, n8n IDs, URLs, or environment values changed this session.

New artefacts created or modified (existing-locations, not changed values):
- `docs/pseudocode/WF-51.pseudo` — Notes-line annotation added for D2 trigger-passthrough convention.
- `docs/pseudocode/WF-52.pseudo` — **whole-file rewrite**: Summary clarifies two-role admin invitation (Business Admin Chinmay `U0B4BBML6CS` + Technical Admin Prasad `U0A4175DJ5D`); Step 4 invites both with role-based comments; Steps 5/9 describe runtime `context_team_id` derivation; new structured `## Inputs` H2 block with canonical+legacy-alias partition; latent caller-contract gap (WF-22 returns `id`, WF-52 reads `userId`) documented.
- `docs/pseudocode/WF-60.pseudo` — **whole-file rewrite**: Summary references new structured Inputs block; Outputs reason strings aligned to live verbatim (`'pre_onboarding_user'`, `'no userId — caller did not provide user identification'`); new structured `## Inputs` H2 block applying TD-DRIFT-029 discriminated-union template (`transport` discriminator + per-variant required + identity + metadata-passthrough partitions); `inboundMessageId`/`sentAt` added to metadata-passthrough; D6 minor Notes annotation documenting `.md`-generator gap.
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md` — 3 new sprint items added this session (TD-DRIFT-030 WF-51 minimal; TD-DRIFT-031 WF-52 rewrite; TD-DRIFT-032 WF-60 rewrite).
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/deferred-to-tech-sprint.md` — 1 new row added (WF-51 D3 Slack API failure error branch).
- `docs/artefacts/drift-checks/2026-05-24/tracker.md` — WF-51/52/60 status rows updated; finding-level rows for WF-51/52/60 marked 🟡 TRIAGED with cross-references; end-of-session sweep updated WF-00/01/02/10/11/20/22/23/25/30/31/47 status rows to 🟡 TRIAGED with their existing TD-DRIFT-### cross-references; Roll-up section corrected to "✅ 1 clean + 🟡 26 triaged + 🔴 0 awaiting" with overall status 🟡 TRIAGE-COMPLETE.
- `~/.claude/projects/.../memory/project_admin_actions_deprecated.md` — clarifying paragraph added distinguishing single-operator-admin (Chinmay issues commands) from channel membership (both Business Admin + Technical Admin invited to consult channels).
