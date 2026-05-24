# Handoff — Batch 3 doc work pushed; SP-04 implementation + SP-05 pending

_Written 2026-05-23T09:07:22Z_

## Stopping Point

Batch 3 doc-only work committed and pushed (`101e24a` on `origin/main`, over `93d01c2`):
- **SP-06** marked **obsolete** (drift check found WF-46.pseudo already rewritten as a SP-03 cascade side-effect — archive removed, `Calls Sub-Workflows: WF-51`, admin_actions deprecation noted, caller refs WF-11+WF-25, DR-10 self-flag gone).
- **SP-07** done — WF-51.pseudo rewritten (19→30 lines) documenting WF-60 logging chain; workflow-registry.md WF-60 caller list expanded to include WF-10 (Slack inbound) and WF-51 (Slack outbound).
- **SP-08** done — WF-60.pseudo rewritten (33→49 lines) to match live multi-transport design (9-col INSERT incl. slack_message_ts, multi-key SELECT, TD-030 placement note).
- **SP-09** done — WF-12 fully purged: n8n DELETE 200, pre-purge backup at `archive/backups/RjwHs9Dx5cK8Q5wD-2026-05-23-18-32-pre-purge.json`, local files removed, INDEX/STATUS/workflow-registry rows stripped, dependency map regenerated (73→72 edges), changelog entry at top of workflow-registry.md.
- **SP-04** in-progress — design decided after Meta WhatsApp Business Policy research; pseudos for WF-23/30/31 rewritten to drop auto-unsubscribe on Gemini stop_intent and adopt WF-40's "Did you mean STOP?" clarifier pattern. **Live workflow PUTs deferred to next session.**
- **TD-NEW-031** logged to `docs/sprint-tech-debt-2026-05-16-post-MVP.md` — WF-23/30/31's negative `Is Pass-Through Intent?` IF treats 4 distinct returnable intents (wants_consultation, general_enquiry, rebook_intent, feedback_intent) as a single bucket; post-MVP refinement should branch per intent.

Sprint state file: 4 done + 1 obsolete + 1 in-progress (SP-04) + 1 pending (SP-05) + 1 pending (SP-10, Batch 4).

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint` (no args — `_active` marker auto-resumes). Skill will land at first unfinished item in Batch 3 = **SP-04 implementation phase**.

**SP-04 implementation — 3 Mode A build-workflow PUTs (one each for WF-23, WF-30, WF-31).**

Per [[feedback_pseudocode_first_refactor]] the pseudos already declare the target shape — implementation just mirrors them. For each workflow:

1. Backup live JSON → `archive/backups/<id>-2026-05-23-<HH-MM>.json`.
2. Pre-flight lint scan (clean expected — no exec_string_wid_at_v12, no pg_missing_eq_prefix, no deprecated_continueOnFail).
3. jq transform on disk:
   - **Remove** `Is Stop Intent?` IF node + `Call WF-47 Unsubscribe` executeWorkflow node.
   - **Remove** their connections (`Is Stop Intent?` from `connections`, plus `Is Pass-Through Intent?`'s output[1] entry pointing to `Is Stop Intent?`).
   - **Insert** `Build WF-50 (Stop Clarifier) Payload` (Set v3.4) with parameters mirroring WF-40's existing Build WF-50 Clarifier Payload (phoneNumber from `$('When Executed by Another Workflow').item.json.phoneNumber`, messageType=text, messageContent=verbatim WF-40 clarifier text quoted in each pseudo). `includeOtherFields=false` (intentional — emits the WF-50 contract shape, not a derive-then-passthrough).
   - **Insert** `Call WF-50 (Stop Clarifier)` (executeWorkflow v1.2, canonical shape: source=database, operation=call_workflow, mode=once, workflowId={__rl, value: BUVun38WEKb12zg9, mode: list, cachedResultUrl}, workflowInputs.mappingMode=passthrough).
   - **Wire** `Is Pass-Through Intent?` output[1] (FALSE) → `Build WF-50 (Stop Clarifier) Payload` → `Call WF-50 (Stop Clarifier)`.
4. PUT via `source .env && curl -X PUT -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json" -d @<file> ...`
5. Post-PUT lint hook (clean expected).
6. Step 6a dangling-name re-scan for the dropped node names: "Is Stop Intent?", "Call WF-47 Unsubscribe". Should return 0 hits per workflow.
7. Re-export to `workflows/<id>.json` via `scripts/export-all-workflows.sh` (or single-workflow curl + jq).

**Workflow IDs:**
- WF-23 Pre-Form Intent Filter — `VpCER0Vqq3NYJGpI`
- WF-30 Payment Pending Intent Filter — `gGJBY5fJha0Let8I`
- WF-31 Payment Submitted Handler — `HB8nXudAtk9iXz7C`

**Clarifier text (verbatim from WF-40, identical across all 3 new instances):**
> "This is an automated message from Chinmay Astro — we noticed your message mentioned STOP or unsubscribing. If this was unrelated, please ignore. If you do want to opt out of this service, simply send STOP at any time."

**Sibling check after Batch 3 close:** rebuild dependency map first, then verify (a) WF-47 callers reduced from `[WF-20, WF-23, WF-30, WF-31, WF-43, WF-44]` to `[WF-20, WF-43, WF-44]`; (b) WF-50 callers gained `[WF-23, WF-30, WF-31]` for the new Call WF-50 (Stop Clarifier) edges (each WF was already a caller for other reasons, so the edge count rises but the unique-caller set stays the same).

**Smoke test:** structural change; can ride on existing smoke harness or be tested ad-hoc by sending a STOP-intent-looking phrase ("please stop sending these") from a test phone in payment_pending/payment_submitted/pre-form states.

After SP-04 done: **SP-05 remains** — WF-25 contract normalization to passthrough on the 4 unresolved callers (WF-23, WF-30, WF-40, WF-44; WF-31 and WF-43 already passthrough), plus project-wide sweep of ~16 other defineBelow+schema:[] call sites. Description in `state.md` is accurate; scope reduction noted in this session's drift assessment.

After SP-05 done: Batch 3 closeout — post-batch regression + commit/push offer at batch boundary. Then Batch 4 = SP-10 plugin update (already specced).

## Blockers

None. n8n reachable (verified 200 at session start). API key in `.env`. Dependency map fresh (rebuilt 2026-05-23T08:34Z post-SP-09 — 72 edges).

## Changed Reference Values

- **GitHub commit (this session):** `101e24a sprint: SP-04/06/07/08/09 — Batch 3 doc work + WF-12 purge` on `origin/main` over `93d01c2`. 15 files changed, 259 insertions, 162 deletions.
- **WF-12 (`RjwHs9Dx5cK8Q5wD`):** **DELETED from n8n** (HTTP 200 from DELETE /api/v1/workflows/RjwHs9Dx5cK8Q5wD; subsequent GET → 404 confirms). Pre-purge backup preserved at `archive/backups/RjwHs9Dx5cK8Q5wD-2026-05-23-18-32-pre-purge.json` (3481 bytes). Resurrect path: POST /workflows from backup will get a new ID.
- **Dependency map (`docs/dependency-map.md`):** 73 → 72 edges (WF-12→WF-50 edge gone). Regenerated 2026-05-23T08:34Z.
- **WF-25 contract reconfirmed (no code change, just analysis):** 5 intents return to caller (`wants_consultation`, `general_enquiry`, `rebook_intent`, `feedback_intent`, `stop_intent`); 3 intents terminate inside WF-25 (`garbage`, `malicious_abusive`, `inappropriate`); Gemini error path defaults to `general_enquiry` and returns. Unknown/empty Gemini output also defaults to `general_enquiry`.
- **Pseudos modified:** `docs/pseudocode/WF-23.pseudo`, `WF-30.pseudo`, `WF-31.pseudo`, `WF-51.pseudo`, `WF-60.pseudo`.
- **Pseudos deleted:** `docs/pseudocode/WF-12.pseudo`, `WF-12.md`.
- **Docs modified:** `docs/workflow-registry.md` (new SP-09 changelog at top + WF-12 row removals + WF-60 caller-list expansion + version bump to 2.11), `docs/STATUS.md` (WF-12 row removed), `docs/pseudocode/INDEX.md` (WF-12 row removed), `docs/sprint-tech-debt-2026-05-16-post-MVP.md` (TD-NEW-031 added).
- **Sprint state file:** `docs/artefacts/sprints/inline-20260522-102910/state.md` — SP-01/02/03/07/08/09/11 = done; SP-06 = obsolete; SP-04 = in-progress (design + pseudo phase complete; implementation pending); SP-05 = pending (scope reduced — see drift findings); SP-10 = pending (Batch 4).
- **Sprint followups file:** no new entries this session (all findings either implemented, captured in state.md's decision_made fields, or routed to post-MVP doc).

## Plugin Improvement Candidates

None new this session — the drift-check-before-execute pattern surfaced as a candidate but was already documented under `discover-current-state` and `build-sprint` Step 1b/3 audit-vs-reality drift. The Meta-compliance research pattern (web-research a design decision before mutation) might be worth a generic skill, but the n8n-whatsapp-methodology plugin stays scoped to n8n discipline — out of scope.
