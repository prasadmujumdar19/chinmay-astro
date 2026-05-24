## Stopping Point

Per-WF drift triage for sprint `pseudo-md-drift-fixes-2026-05-24` paused after completing WF-40, WF-41, WF-42, WF-43, WF-44 (UTC 2026-05-24T06:53:02Z). Triage Phase 2 has now covered 21 of 27 WFs (16 from prior handoff + 5 this session). `tasks.md` now carries 25 sprint items: TD-DRIFT-001..020 from prior sessions, plus six new this session — TD-DRIFT-021 (WF-40 .pseudo Step 4-6 rewrite to match live two-output fan-out + D9 structured Inputs, Option A: pseudo→live since live is simpler expression); TD-DRIFT-022 (WF-41 D9 structured Inputs only — exceptionally clean WF); TD-DRIFT-023 (WF-42 pseudo rewrite + WF-51 declaration + unflagged D1 Slack copy aligned to live single-sentence form; folded six findings); TD-DRIFT-024 (WF-43 .pseudo D9 + Step 5/13 explicit field-name canonicalization post-cross-cutting items); TD-DRIFT-025 (WF-44 .pseudo bundle — structured Inputs with `user` envelope per WF-32/33/42 template, Step 7/9 canonical field names, D4/D1 Notes-line convention annotation); TD-DRIFT-026 (WF-44 live fix — `Call WF-25 Intent Classifier` defineBelow `userId: $json.userId` is undefined; needs `$json.user.id`). **TD-DRIFT-012 cross-cutting item also expanded** to add WF-43 `Extract Gemini Reply` Code node as 4th legacy WF-50 caller (passthrough-chain audit gap from original 3-caller scope).

## Next Action

Resume per-WF triage starting with **WF-45** (Rebook — re-triggers the payment flow when a user wants to book another consultation; called from WF-43 on `btn_rebook` button-tap or `rebook_intent`, also called from WF-44 on `rebook_intent` during feedback path). Then continue sequence WF-46 → WF-50 → WF-51 → WF-52 → WF-60. Reminders for upcoming WFs:

- **WF-45** tracker findings (6): D1 greeting copy materially different (live "Welcome back ${name}! Your previous consultation is complete..." vs pseudo "Welcome back, <user.name>! 🙏\n\nYour birth details are already on file..."); D5 (UPDATE bypasses SELECT — sets status=payment_pending using `$('When Executed by Another Workflow').item.json.phoneNumber` directly, latent inconsistency risk); D8 (declared optional `name`/`userId` not consumed; `userId` absent from `.md`); D7 (no explicit output contract); D9 vague Inputs. Likely a single pseudo bundle item; D1 greeting copy is a user-decision-needed moment (which copy is canonical).
- **WF-46** is Canon-A relevant per WF-32 audit (already established: only WF-32 needed a live edit; all others compliant via DB-SELECT). Tracker has 3 findings (D9, D8, D4 + minor D6).
- **WF-50/51/52** are shared sub-workflows — likely each gets a structured Inputs item; WF-52 has a real D1 admin user ID mismatch (live invites U0B4BBML6CS + U0A4175DJ5D; pseudo says U0AGTECS1KR — needs user decision on canonical admin IDs).
- **WF-60** has discriminated-union variant declarations (D9) + D7/D8 — may need explicit variant typing pattern for the Inputs block.
- For each WF: read `docs/pseudocode/WF-XX.{pseudo,md}`, grep tracker `### WF-XX findings` in `docs/artefacts/drift-checks/2026-05-24/tracker.md`, then run audit-before-spec per [[feedback_audit_before_spec]] + [[feedback_systemic_before_individual]]. Apply [[feedback_pseudo_tech_separation]] to auto-defer n8n-mechanism findings, [[feedback_pseudo_linear_numbering]] for step-numbering questions, and the **citation-discipline pattern established this session** for needs-decision moments (cite specific tasks.md line numbers from prior decisions when surfacing options).

## Blockers

- **No user input blockers** for resuming WF-45. Established decision patterns from this session that should carry into remaining triage:
  - **Read-source convention (TD-DRIFT-025 precedent):** D4/D1-class cosmetic asymmetries where pseudo and live diverge but yield identical values are documented as a Notes-line convention in the pseudo, NOT a live edit. Annotates the convention while preserving live (zero churn risk). Pattern follows TD-DRIFT-021 Option A reasoning ("live is the simpler expression; no behaviour change, zero churn risk") extended down from topology-level to sub-topology read-source choices.
  - **Envelope declaration template (TD-DRIFT-016/018/023/025):** Structured Inputs blocks declare `phoneNumber` flat (Canon A, TD-DRIFT-015) + `user` envelope (object, required) with enumerated `.id/.name/.status/.slack_channel_id/.phone_number` fields as consumed. Use this template for any WF-01-descendant leaf.
  - **Passthrough-chain upstream-node audit (TD-DRIFT-012 expansion):** TD-DRIFT-012's original audit classified passthrough WF-50 callers as safe, but did NOT check whether the upstream Code/Set node emits canonical field names. WF-43's `Extract Gemini Reply` was found to emit legacy `message` — added to TD-DRIFT-012 as 4th caller. **Apply this audit to any cross-cutting caller-canonicalization item: passthrough doesn't equal safe.** Carry forward for WF-45/46/50/51/52/60 triage.
  - **Latent-bug spin-out pattern (TD-DRIFT-026):** Per-WF triage that surfaces a likely live bug spun off into a dedicated live-fix sprint item rather than bundled into the pseudo item — per [[feedback_systemic_before_individual]]. Pseudo item closes the doc drift; live item gets its own audit/fix/verify discipline. WF-25's `input.userId` usage needs investigation before TD-DRIFT-026 edit.

- **Pre-existing tasks.md anomaly (not fixed, carried from prior handoff):** Duplicate `### TD-DRIFT-001 · WF-00 nfm_reply parse path — fix live` heading at lines 66 and 111 (one in 🔴 P0 section, one in 🟠 P1 section). Likely paste-error during a prior P0↔P1 reclassification. User informed in prior handoff; chose to defer dedupe. Address before sprint execution if not earlier.

- **Plugin improvement candidates (not applied this session):**
  1. (Carried from prior handoff, still pending) `pseudo-md-drift-check` skill should document the override pattern (27 parallel Sonnet subagents in background, parent-aggregates JSON) as a valid path with discipline.
  2. (Carried) D8/D9 rubric in `pseudo-md-drift-check` should call out router-workflow distinction between consumed inputs and passthrough-to-sub-workflow inputs.
  3. (Carried) Elevate `feedback_pseudo_tech_separation` from project memory to plugin principle.
  4. (Carried) Document "audit-before-cross-cutting-fix" as a build-sprint principle.
  5. (Carried) D8.5 rubric refinement — input-alias finding requires caller-side cross-check before triage decision.
  6. (Carried) Linear pseudo numbering convention promotion to plugin-level guidance.
  7. **(New, 2026-05-24)** Drift-check D1 rubric missed the WF-42 Slack-confirmation message-text divergence (multi-line embedded literal in a Code node). Re-examine the D1 detection for multi-line embedded literals; consider extracting all Code-node `return [{json:{...}}]` literal strings and comparing them to `.pseudo` quoted strings.
  8. **(New, 2026-05-24)** Cross-cutting items with `mappingMode=passthrough` callers MUST audit the upstream Code/Set node (not just the Execute-Workflow node's `workflowInputs.value`). TD-DRIFT-012's original 3-caller scope missed WF-43 because it only inspected the defineBelow callers. Document as a pre-edit audit step in any caller-canonicalization plugin pattern.
  9. **(New, 2026-05-24)** "Read-source convention" pseudo-Notes pattern — when live mixes trigger-envelope reads and prior-node `$json` reads for identical values, the cleanest fix is a Notes-line annotation declaring the preferred convention rather than a live cleanup edit. Worth promoting to a per-WF pseudo authoring guideline.
  10. **(New, 2026-05-24)** "Citation discipline for needs-decision moments" — when surfacing options to the user, cite specific `tasks.md` line numbers from prior decisions so the user can verify the precedent. Pattern established this session at user's request ("Help me with some references or citations from previous decisions"). Worth elevating to the `needs-decision-context` rubric in `build-sprint`.

  Apply via `flush-plugin-improvements` skill in a future session — context grew during this triage, deferring rather than mid-session apply.

## Changed Reference Values

None. No credentials, n8n IDs, URLs, or environment values changed this session.

New artefacts created or modified (existing-locations, not changed values):
- `docs/artefacts/sprints/pseudo-md-drift-fixes-2026-05-24/tasks.md` — 6 new sprint items added this session (TD-DRIFT-021, TD-DRIFT-022, TD-DRIFT-023, TD-DRIFT-024, TD-DRIFT-025, TD-DRIFT-026); TD-DRIFT-012 expanded to add WF-43 as 4th caller.
- `docs/artefacts/drift-checks/2026-05-24/tracker.md` — WF-40, WF-41, WF-42, WF-43, WF-44 rows and their finding sections updated with triage status (🔴 DRIFT → 🟡 TRIAGED) and sprint-item cross-references.
