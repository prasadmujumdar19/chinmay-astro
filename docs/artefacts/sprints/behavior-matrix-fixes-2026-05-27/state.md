# Sprint: behavior-matrix-fixes-2026-05-27

**Input source:** docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/tasks.md
**Input hash:** 5e7e3db0999e1128ce39970bc1075716120bb3cf87f7067616220f7653ff7f54
**Planned at:** 2026-05-29T07:53:18Z
**Last updated:** 2026-05-29T22:59:05Z
**Planning complete:** true

**Reconciled scope:** Planned against the tasks.md RECONCILIATION banner (2026-05-29), NOT the original 7 TD-BMX item blocks. The redesign is defined across two companion specs — `docs/artefacts/specs/2026-05-29-bmx-06-new-contact-flow-design.md` (new + pre-form) and `docs/artefacts/specs/2026-05-29-existing-user-safety-net-design.md` (existing + opted_out + BMX-05). The original TD-BMX-01..07 items are decomposed into the build units of the cross-spec **Phase 0→5 build sequence** (safety-net spec §8.2). User confirmed phase-mapped granularity (19 build units) on 2026-05-29.

**Discover-current-state:** targeted live check ran 2026-05-29T07:5xZ (specs carry fresh full AS-IS verification dated today). Confirmed: WF-26 `active=false` (TD-BMX-04 activation real; registry "🟢 Active" is drift); WF-53/61/62 free (U1/U2/U3 are genuine new builds); `chinmay_astro.silent_drop` table and `chinmay_astro.users.block_reason` column both absent (Phase 0 DB migrations real); WF-25 ID `eTV1lUcYrXBg2q2T` confirmed for full-replace. No items found already-resolved.

**Dependency conflicts found:** — none. The phasing is internally consistent; cross-item edges are hard build dependencies (DB+U1/U2/U3 before any caller · WF-25 before its handlers · WF-26-refine before WF-26-activate · pseudo-first before any n8n edit), not priority inversions.

**Priority adjustments confirmed:** TD-BMX-05 (WF-20 STOP-alias additions) was originally P1, now folded into the P0 existing-user safety-net redesign and co-located in its Phase-3 batch (spec decision #6). Treated as P0 for batching so no priority tiers are mixed within a batch. Matrix re-verification (TD-BMX-07, originally 🟢 EXIT) recorded as P0 (blocking exit gate) for lint-format compliance; it remains the sprint exit gate. **Batching is phase-driven, not priority-flattened**, per the explicit SEQUENCING directive in tasks.md — build-sprint must follow batch order 1→10.

**Excluded from execution:** Per tasks.md "Items intentionally excluded": U3 (pending_users leak on STOP pre-form — planned daily-maintenance WF post-go-live), U4 (form re-submit overwrites DOB — impossible per Meta; matrix → N/A), U5 (media during consultation_active — post-go-live build), U6 (stale Payment Completed tap — won't-fix), U7 (generic HELP menu in NULL-status — auto-covered). Not picked up by this sprint. Additionally, the as-written **TD-BMX-02** and **TD-BMX-03** task blocks are marked ⚪ obsolete below (their target behavior is delivered by the BMX-06 / safety-net rebuilds, not by the original edits).

---

## Items

| ID | Status | Batch | Pri | Workflows | Depends On |
|----|--------|-------|-----|-----------|------------|
| BMX-P0-DB | ✅ done | 1 | P0 | — | — |
| BMX-P0-U1 | ✅ done | 1 | P0 | WF-53 | — |
| BMX-P0-U2 | ✅ done | 1 | P0 | WF-61 | BMX-P0-DB (hard) |
| BMX-P0-U3 | ✅ done | 2 | P0 | WF-62 | BMX-P0-U1 (hard) |
| BMX-P1-PSEUDO | ✅ done | 3 | P0 | WF-01, WF-02, WF-20, WF-21, WF-23, WF-25, WF-26, WF-30, WF-31, WF-40, WF-43, WF-44, WF-45, WF-53, WF-61, WF-62 | — |
| BMX-P2-WF01 | ✅ done | 4 | P0 | WF-01 | BMX-P0-DB (hard), BMX-P1-PSEUDO (hard) |
| BMX-P2-WF02 | ✅ done | 4 | P0 | WF-02 | BMX-P0-U2 (hard), BMX-P1-PSEUDO (hard) |
| BMX-P2-WF21 | ✅ done | 5 | P0 | WF-21 | BMX-P0-U2 (hard), BMX-P0-U3 (hard), BMX-P1-PSEUDO (hard) |
| BMX-P2-WF23 | ✅ done | 6 | P0 | WF-23 | BMX-P0-U2 (hard), BMX-P0-U3 (hard), BMX-P1-PSEUDO (hard) |
| BMX-P3-WF25 | ✅ done | 7 | P0 | WF-25 | BMX-P0-U1 (hard), BMX-P0-U2 (hard), BMX-P1-PSEUDO (hard) |
| BMX-P3-HANDLERS | ✅ done | 8 | P0 | WF-30, WF-31, WF-40, WF-43 | BMX-P3-WF25 (hard), BMX-P0-U1 (hard) |
| BMX-P3-WF44 | ✅ done | 8 | P0 | WF-44 | BMX-P3-WF25 (soft) |
| BMX-P3-WF20 | ✅ done | 8 | P0 | WF-20 | BMX-P1-PSEUDO (hard) |
| BMX-P3-WF46 | ✅ done | 8 | P0 | WF-46 | BMX-P3-WF25 (hard), BMX-P3-HANDLERS (hard) |
| BMX-P4-WF26 | ⬜ pending | 9 | P0 | WF-26 | BMX-P3-WF25 (hard) |
| BMX-P4-WF45 | ⬜ pending | 9 | P0 | WF-45 | BMX-P1-PSEUDO (hard) |
| BMX-P4-ACTIVATE | ⬜ pending | 9 | P0 | WF-26 | BMX-P4-WF26 (hard) |
| BMX-P5-DRIFT | ⬜ pending | 10 | P0 | — | BMX-P4-ACTIVATE (hard), BMX-P4-WF45 (hard) |
| BMX-P5-MATRIX | ⬜ pending | 10 | P0 | — | BMX-P5-DRIFT (hard) |
| TD-BMX-02 | ⚪ obsolete | — | P0 | WF-01 | — |
| TD-BMX-03 | ⚪ obsolete | — | P1 | WF-20 | — |

---

## Batch 1 — Phase 0a · Foundations (DB + U1 + U2)

- **Items:** 3
- **Description:** Leaf dependencies — nothing else can run first. DB migrations (silent_drop table; block audit unified on legacy `blocked_reason`/`blocked_at`/`blocked_by` — see BMX-P0-U2 design change) and the two utilities that don't depend on U3. Within-batch order: DB → U2 (U2 writes both new objects); U1 standalone. All build/activate standalone (no callers yet).
- **Estimated size:** M
- **Estimated tokens:** ~75K
- **Execution plan:** All Mode A (production-affecting, judgment + copy-verification required; none Mode-D-eligible). Order: (1) BMX-P0-DB via docker-exec psql write path — not build-workflow; (2) BMX-P0-U1 (WF-53) full build-workflow inline, standalone; (3) BMX-P0-U2 (WF-61) full build-workflow inline, AFTER the DB migration (hard dep). Recorded 2026-05-29T08:2xZ by build-sprint Step 2a.

## Batch 2 — Phase 0b · Foundations (U3 classifier)

- **Items:** 1
- **Description:** U3 New-Contact Intent Classifier (WF-62). Split from Batch 1 because it calls U1 on Gemini failure (hard dep on BMX-P0-U1) and the combined Phase-0 estimate exceeds the ~80K batch cap.
- **Estimated size:** M
- **Estimated tokens:** ~40K

## Batch 3 — Phase 1 · Pseudo-first

- **Items:** 1
- **Description:** Rewrite `.pseudo` for every changed workflow + author new `.pseudo` for U1/U2/U3, reconciled against both specs, BEFORE any n8n edit (pseudocode-first practice). Single item to keep the cross-spec pseudo set internally consistent. Gates all of Phase 2–4.
- **Estimated size:** L
- **Estimated tokens:** ~55K

## Batch 4 — Phase 2a · BMX-06 entry + router (WF-01 + WF-02)

- **Items:** 2
- **Description:** WF-01 identity/security gate rebuild (critical path) + WF-02 router edits. Both different workflows (no sibling race). WF-01 applies D1 block-unify; WF-02 gets the new non-text branch + nfm_reply guard (decision #10).
- **Estimated size:** L
- **Estimated tokens:** ~80K
- **Execution plan:** ≤2 items → Step 2a skipped; both Mode A (full build-workflow inline). WF-01 author-fresh (user-approved); WF-02 on-disk mutate. Run sequentially (WF-01 first — WF-02 is its consumer).
- **Post-batch regression (2026-05-29T22:00Z — PASS):** dependency map rebuilt — WF-01 calls {WF-26, WF-21, WF-02} (WF-50/51 dropped); WF-02 calls {WF-23,22,32,30,31,40,43,20,51, WF-61(U2), WF-50} (WF-21 dropped) — both match design. No sibling Postgres-lookup pattern shares WF-01's combined-anchor query; WF-02 added no Postgres. WF-02 guard relaxation-only → no existing caller breaks (WF-26 re-route still valid). Downstream consumers WF-21/23/26 are scheduled rebuilds (Batches 5/6/9), not regressions; WF-23 still gets the unchanged PRE_FORM_TEXT envelope. No strict findings; 2 adjacent plugin-improvement notes logged to followups.md (consumer-contract gate; Step-6a connection-target scan).

## Batch 5 — Phase 2b · BMX-06 brand-new owner (WF-21)

- **Items:** 1
- **Description:** WF-21 rebuild — brand-new owner (no record). Wires U2/U3, alias preempts, 7-bucket classification. Split from WF-23 because the combined rebuild estimate exceeds the cap.
- **Estimated size:** L
- **Estimated tokens:** ~50K
- **Post-batch regression (2026-05-29T22:31Z — PASS):** Dependency map rebuilt — WF-01→WF-21; WF-21→{WF-61(U2), WF-62(U3), WF-50, WF-53(U1)} — matches design exactly. Single caller (WF-01). Sibling = WF-23 (pre-form, same 7-bucket/U2/U3/U1 pattern) is the Batch-6 rebuild target, not yet built → no built sibling to regress; pattern net-new this batch, WF-23 replicates next. Shared callees unchanged; WF-21 call payloads verified vs each callee `.pseudo` Inputs at build. Postgres sanity: 3 Insert PU nodes operation=executeQuery + aod=true, columns match live pending_users (unchanged INSERT), queryReplacement (no {{ }} in query → no `=`-prefix needed). No strict findings. Adjacent: CLAUDE.md credential-table Flow ID drift (1408011897720771 vs live 2260297164474475) — surface at sprint end (not a regression).

## Batch 6 — Phase 2c · BMX-06 pre-form owner (WF-23)

- **Items:** 1
- **Description:** WF-23 rebuild — pre-form owner (has pending_users, no users row). Same U2/U3 + alias pattern as WF-21 (sibling pattern); built back-to-back with WF-21 for familiarity savings (~10%).
- **Estimated size:** L
- **Estimated tokens:** ~48K
- **Execution plan:** 1 item → Step 2a skipped; Mode A (full build-workflow inline), author-fresh (user-approved). Recorded 2026-05-29T22:45Z.
- **Post-batch regression (2026-05-29T22:59Z — PASS):** Dependency map rebuilt — WF-02→WF-23 (caller unchanged); WF-23→{WF-50, WF-61(U2), WF-62(U3), WF-53(U1)} — matches design exactly; WF-25 + WF-51 edges dropped (pre-form classification moved to U3, WF-25 call retired). Single caller (WF-02, Batch-4 build). Primary sibling = WF-21 (same new/pre-form 7-bucket/U2/U3/U1 pattern, built Batch 5, regression already PASS): unchanged (39 nodes, active); WF-23 replicates its verified pattern; shared callees U1/U2/U3/WF-50 unchanged (WF-23 only calls them — call payloads verified vs each callee `.pseudo` at build). WF-23 has 0 Postgres nodes → no sibling Postgres sanity checks apply (the pre-form row already exists; no Insert-PU, unlike WF-21). Other GAP-3C Gemini-pattern workflows (WF-30/31/43) are scheduled Batch 7–8 rebuilds, not regressions. No strict findings. No new adjacent findings this batch. Carried items (followups.md): 2 plugin-improvement notes from Batch 4 (consumer-contract gate; Step-6a connection-target scan) + CLAUDE.md Flow-ID drift — all still open for sprint-close flush.

## Batch 7 — Phase 3a · Safety-net hub (WF-25 full rebuild)

- **Items:** 1
- **Description:** WF-25 full-replace rebuild on the SAME ID (`eTV1lUcYrXBg2q2T`) — carry over surviving nodes verbatim, generate U1/U2 calls + unified block + clarifier consolidation + D4 relay-return, retire WF-46 from this path. Critical hub; built alone (XL) and BEFORE its handlers so they edit against final hub behavior.
- **Estimated size:** XL
- **Estimated tokens:** ~70K
- **Execution plan:** 1 item → Step 2a skipped; Mode A (full build-workflow inline), author-fresh (standing §8a/sprint-plan approval). Recorded 2026-05-29T23:10Z.
- **Post-batch regression (2026-05-29T23:39Z — PASS):** Dependency map rebuilt (82 edges) — WF-25 now calls {WF-53(U1), WF-50, WF-61(U2)}; **WF-46 + direct WF-51 edges dropped** (U1/U2 own admin alerts internally) — matches design exactly. All **5 inbound callers** (WF-30/31/40/43 + WF-44) still resolve to the SAME ID `eTV1lUcYrXBg2q2T` (same-ID full-replace preserved — none break). WF-25 added **zero Postgres nodes** (SQL lives inside U1/U2/WF-61) → no Postgres sibling sanity-checks apply this batch. No structural sibling shares WF-25's hub pattern (WF-62/U3 is the new-user analog, already built Batch 2, distinct). Caller-consumption regression: pass-through return-SHAPE is byte-identical to the prior `$input.first()` behavior (Parse Intent == routed item), so callers consuming `intentResult` continue working; the new stop_intent + D4-active-garbage returns are **additive** — handlers WF-30/31/40/43 adapt to them in Batch 8 (hard dep, by design). No production regression in the gap (real users deferred to Batch 10 smoke; users table empty). **No strict findings.** Adjacent/plugin candidate (sprint-close flush): "terminal Return node in a send-then-return sub-workflow should read its canonical upstream (`$('<classifier>')`) not `$input.first()`, so branches that insert a sub-workflow send before returning still emit the original merged envelope, not the send's return value." Carried items (followups.md) from prior batches still open for sprint-close flush (2 Batch-4 plugin notes + CLAUDE.md Flow-ID drift + Batch-6 contract-emit `$('NamedNode')` candidate).

## Batch 8 — Phase 3b · Thin handlers + aliases + WF-46 retirement

- **Items:** 4
- **Description:** WF-30/31/40/43 handler edits (delete inline Gemini-error → U1; remove in-handler clarifiers; WF-43 stop_intent → clarifier) + WF-44 (strip WF-25 call + rebook/stop IFs; rewire trigger → Save Feedback) + WF-20 STOP-aliases (TD-BMX-05) + WF-46 retirement (audit no other live caller, then delete). All structural edits applied against the live WF-25 hub from Batch 7. ~87K is slightly above target because the low-cost WF-46 retirement rides along to avoid a trivial standalone batch.
- **Estimated size:** M
- **Estimated tokens:** ~87K
- **Post-batch regression (2026-05-30):** PASS. Whole-`workflows/` lint exit 0 — zero hard rejects across all 31 workflows (no pg_select_missing_aod, no camelCase-alias, no Code-return-shape, no mappingMode=passthrough); remaining findings all advisory (pre-existing Contract-First initiative + Step 5g WF-XX tokens in internal validation/audit nodes — none introduced/worsened by Batch 8). Handler-family siblings WF-21/WF-23 confirmed consistent (both call U1/WF-53, zero orphaned old-error-chain nodes). Dependency map rebuilt (82→79 edges); all touched workflow IDs unchanged → no caller repoint needed. WF-46 retained per caller audit. No strict-bucket sibling issues → none logged to followups (2 plugin candidates noted: Set-field optional-chaining rule + expression-as-shell-var hazard).
- **Execution plan:** Recorded 2026-05-30 by build-sprint Step 2a. Order: HANDLERS → WF44 → WF20 → WF46 (WF46 last; hard-deps HANDLERS dropping its WF-46 calls). No same-workflow siblings; no Mode D (all production-affecting structural edits requiring judgment, per [[feedback_sprint_parallelism]]). (1) **BMX-P3-HANDLERS — Mode A** full build-workflow inline (4 WFs, node delete+rewire, per-handler impact judgment). (2) **BMX-P3-WF44 — Mode A** full build-workflow inline (node delete + rewire + sole-caller re-verify). (3) **BMX-P3-WF20 — Mode B** inline-inherit (surgical XS keyword-list add; full backup/change/lint/state discipline, no Skill reload). (4) **BMX-P3-WF46 — Mode A** full build-workflow inline, retirement after caller audit across all live workflows.

## Batch 9 — Phase 4 · WF-26 refine + WF-45 guard + activation

- **Items:** 3
- **Description:** WF-26 refinement (drop welcome-back; rewire Refresh Envelope → Call WF-02 so it inherits the WF-25 safety net) → WF-45 4-branch state guard (TD-BMX-01; independent, note dead pre-form branch) → activate WF-26 + smoke-test opted-out re-engagement (TD-BMX-04). Within-batch order: WF-26-refine BEFORE activate.
- **Estimated size:** M
- **Estimated tokens:** ~77K

## Batch 10 — Phase 5 · Verify (drift-check + matrix re-verification)

- **Items:** 2
- **Description:** pseudo↔md drift-check + regenerate AS-IS `.md` for all changed workflows → TD-BMX-07 behavior-matrix re-verification (walk the affected cells; update S8×G expectation — opted_out re-engages via WF-26, not zero-outbound). Sprint exit gate.
- **Estimated size:** M
- **Estimated tokens:** ~65K

---

## BMX-P0-DB — DB migrations: silent_drop table + block_reason column

**Status:** ✅ done
**Started:** 2026-05-29T08:28:42Z
**Completed:** 2026-05-29T08:29:47Z
**Actual tokens:** ~10K
**Actual effort:** ~1 min
**Estimate delta:** on-bucket (planned S ~15K, actual ~10K)
**Priority:** P0 | **Batch:** 1
**Change type:** DB-Schema
**Workflows:** —
**Depends on:** —
**Size:** S
**Estimated tokens:** ~15K
**Estimated effort:** ~30 min

Phase 0 foundation. (1) `CREATE TABLE chinmay_astro.silent_drop` (phone_number, message_type, reason, message_content, created_at) + index on (phone_number, created_at) — BMX-06 §132-144. (2) `ALTER TABLE chinmay_astro.users ADD COLUMN block_reason text;` — additive, nullable, no backfill (safety-net §334). Both confirmed absent in live (2026-05-29). Apply via the docker-exec psql write path (CLAUDE.md). Serves: foundation for BMX-06 + safety-net.

**⚠️ Partially superseded (2026-05-29T11:04:06Z — see BMX-P0-U2 design change):** part (2) — the new `block_reason` column — was **dropped** the same day. The block audit unifies on the EXISTING legacy `users` columns `blocked_reason`/`blocked_at`/`blocked_by` instead (no net-new columns). Revert migration: `scripts/migrations/2026-05-29-bmx06-drop-block-reason-use-legacy.sql`. Part (1) — the `silent_drop` table — stands (live column is `message_content`).

## BMX-P0-U1 — Build U1 Gemini Error Handler (WF-53)

**Status:** ✅ done
**Started:** 2026-05-29T08:31:00Z
**Completed:** 2026-05-29T10:40:07Z
**Actual tokens:** ~30K
**Actual effort:** ~12 min (active build session; design was pre-locked)
**Estimate delta:** on-bucket (planned S ~25K, actual ~30K)
**Priority:** P0 | **Batch:** 1
**Change type:** Workflow-create
**Workflows:** WF-53
**n8n IDs:** `ONzUJ1Lj9hIbUYT0`
**Depends on:** —
**Size:** S
**Estimated tokens:** ~25K
**Estimated effort:** ~45 min

**Build outcome (2026-05-29T10:40:07Z):** Created WF-53 (`ONzUJ1Lj9hIbUYT0`), 10 nodes, active=true. Node graph exactly per locked design: Trigger(passthrough) → Entry Guard (Code v2, strict-envelope hard-fail) → Build Admin Alert (Code v2, assembles messageText from `context`, resolves channelId = `consultChannelId || C0A5B0ZE81E`) → Build WF-51 Alert Payload (Set v3.4, includeOtherFields=false `{channelId, messageText}`) → Call WF-51 Admin Alert (exec v1.2, onError=continueRegularOutput) → User-Facing? (IF v2.2, reads `$('Entry Guard').item.json.userFacing`) → [T] Build WF-50 Apology Payload (Set v3.4 `{phoneNumber, messageType:'text', messageContent:<locked apology>}`) → Call WF-50 Apology (exec v1.2, onError=continueRegularOutput) → Return Notified (User-Facing) (Set v3.4 `{notified:true}`); [F] Return Notified (Silent) (Set v3.4 `{notified:true}`, notes-annotated logged-accepted terminal). typeVersion floor honored (trigger 1.1, code 2, set 3.4, if 2.2, exec 1.2 — all project highest-in-live). MCP strict-validate `valid:true`, 0 errors, 8 warnings (all confirmed FP/intentional: Code-node `$`-usage heuristics, exec/if typeVersion-floor advisories, IF main[1]-as-error-output FP). Lint hook exit 0. cachedResultName added to both exec calls. Contract-First: both sends have named Set v3.4 contract-emit nodes immediately upstream; mappingMode=defineBelow+value:{}. Adjacent finding logged to followups.md (non-user-facing admin-copy line).

**⚠️ CONTRACT FIX (2026-05-29T22:43Z — user-flagged during BMX-P0-U3 session):** U1 was built in Batch 1 to `return {notified:true}` on both terminal branches. This was a **build defect** — safety-net spec line 151 says "U1 sends apology + admin alert + **halts**; caller terminates via error propagation." Rationale: a Gemini *technical* failure means no valid classification/answer was produced, so the execution must terminate — we must never default an intent just to continue. Fix applied: removed both `Return Notified` Set nodes, added a single `Halt on Gemini Failure` (stopAndError v1); `Call WF-50 Apology` (user-facing) and `User-Facing?` FALSE (non-user-facing — admin alerted upstream, apology skipped) **both** route to Halt (user decision 2026-05-29: halt both branches). Due diligence: live scan of all ~250 workflows + `workflows/` exports found **zero callers** of `ONzUJ1Lj9hIbUYT0` (callers are Batches 4–7), so no return-consumer breaks. Lint exit 0; MCP strict-validate `valid:true`, 0 errors, 9 warnings (all FP/floor/benign). Backup: `archive/backups/ONzUJ1Lj9hIbUYT0-2026-05-29-22-43.json`. **Caller convention propagated to registry + downstream batches:** every `Call U1` executeWorkflow node MUST keep `onError = stopWorkflow` (default) — NOT `continueRegularOutput` — so U1's halt propagates and terminates the whole chain. Applies to U3 (this batch) + WF-21/23/handlers (Batches 4–7).

New shared sub-workflow, proposed WF-53 (clash-free, verified 2026-05-29). Called from the onError branch of EVERY Gemini node (WF-21, WF-23, U3, and the safety-net handlers). BMX-06 §99-105. Follows data-contract discipline (strict envelope). No callers yet → build/activate standalone, verify against its envelope contract. Invoke `build-workflow`.

**Design locked (2026-05-29T08:5xZ) — BUILD-READY, all decisions made; create next session.** Refactor of WF-43's existing inline Gemini-error chain (`Build apology → WF-50 → dual WF-51 alerts → stopAndError`, safety-net §169) into a shared utility. Step 5c design gate (formal `.pseudo` deferred to Batch 3 / BMX-P1-PSEUDO per locked plan — greenfield, spec is design source).

- **Trigger:** `executeWorkflowTrigger`, `inputSource=passthrough`.
- **Inputs (strict envelope; first node = entry-guard Code node, hard-fail on violation):**
  - `phoneNumber` — E.164 string, required. *(Canonicalized from spec's `phone` — user decision 2026-05-29 to align with data-contract canon WF-50/51/52/60.)*
  - `userFacing` — boolean, required (spec's "if user-facing"). Gates the user apology only.
  - `consultChannelId` — Slack C-ID (`^[CDG][A-Z0-9]+$`), optional. Admin-alert destination; absent ⇒ admin-cmds `C0A5B0ZE81E`.
  - `context` — object, required (user decision: structured, U1 assembles alert text): `{ source (string, e.g. 'WF-21'/'WF-43'/'U3'), userName?, userStateText?, userMessage?, errorDetail? }`.
- **Node flow:** Trigger → Entry Guard (Code, validate envelope) → Build Admin Alert (Code: assemble messageText from context, resolve channelId = consultChannelId || 'C0A5B0ZE81E') → Contract-emit Set v3.4 `{channelId, messageText}` (includeOtherFields=false) → Call WF-51 → IF `userFacing`? — T → Contract-emit Set v3.4 `{phoneNumber, messageType:'text', messageContent:<apology>}` → Call WF-50 → return; F → Set `{notified:true}` return (logged-accepted per Step 5a.2: non-user-facing = no apology needed, not a disconnected FALSE).
- **Returns:** `{ notified: true }`. U1 does NOT stopAndError — the caller's onError branch terminates after the U1 call (safety-net §140).
- **Copy (LOCKED, business-tone per Step 5g):**
  - User apology (WF-50 `messageContent`): "Sorry — we ran into a brief technical issue and couldn't process your message just now. Our IT Support team has been notified and will follow up with you shortly. We apologise for the inconvenience." *(amended from WF-43's "Dr. Chinmay has been notified" — user decision 2026-05-29: a shared utility must not name an individual.)*
  - Admin alert (WF-51 `messageText`, assembled in Build Admin Alert Code node):
    `⚠️ The AI assistant couldn't generate a reply to a user just now.\n\n*User:* {userName} ({phoneNumber})\n*Their state:* {userStateText}\n*Their question:* "{userMessage, ≤500 chars}"\n*Reason:* {errorDetail, ≤200 chars}\n\nThe user has been told there's a technical hiccup and that the team will follow up. Suggested action: respond manually in their consult channel.` *(carried from WF-43 admin-alert Code node; "you'll follow up" → "the team will follow up" for utility neutrality.)*
- **Contract-First (Step 5f.2):** both WF-50 and WF-51 calls get a named Set v3.4 contract-emit node immediately upstream; `mappingMode: defineBelow` + `value: {}` on both executeWorkflow nodes (canonical, NOT `passthrough` literal — Gap-10). typeVersion floor: pick highest-per-type from an existing simple sub-workflow (e.g. WF-51) at author time.
- **Registry slot:** WF-53 (confirm clash-free at create via workflow-registry).
- **Post-create verify:** Steps 6 (lint) + 6b (per-node strict validate — watch Postgres/exec operation-default trap; U1 has none but the Set/exec nodes still get the strict pass) + register 🟢 + export + commit.

## BMX-P0-U2 — Build U2 Silent-Drop & Escalate (WF-61)

**Status:** ✅ done
**Started:** 2026-05-29T10:45:00Z
**Completed:** 2026-05-29T11:04:06Z
**Actual tokens:** ~45K (incl. block-column design-change investigation + DDL revert + doc sweep)
**Actual effort:** ~20 min
**Estimate delta:** +1 bucket (planned M ~35K, actual ~45K — the mid-build block-column decision added scope)
**Priority:** P0 | **Batch:** 1
**Change type:** Workflow-create
**Workflows:** WF-61
**n8n IDs:** `9Zt23yt8k8PQSgji`
**Depends on:** BMX-P0-DB (hard)
**Size:** M
**Estimated tokens:** ~35K
**Estimated effort:** ~1 hr

New shared sub-workflow, WF-61. Logic: INSERT silent_drop row → count 30-day rolling drops per phone → at threshold, upsert users SET status='blocked' + **legacy block audit trio** (stub row if none) + admin alert. BMX-06 §108-118. Hard dep on BMX-P0-DB. Strict envelope; verify `{blocked}` return path. Invoke `build-workflow`.

**⚠️ DESIGN CHANGE (2026-05-29T11:04:06Z — user decision, mid-build):** Block audit now uses the **EXISTING legacy `users` columns** `blocked_reason` / `blocked_at` / `blocked_by` instead of the new `block_reason` column. The new `block_reason` column (added earlier today by BMX-P0-DB) was **dropped** (`scripts/migrations/2026-05-29-bmx06-drop-block-reason-use-legacy.sql`; 0 rows, 0 readers → zero-risk). Rationale: no net-new columns; blocking is now system-driven (threshold + abuse), so the who/when/why trio gives a richer audit trail; legacy names are consistent with `status='blocked'`. **Conventions adopted:** `blocked_by` is a provenance tag — `'admin'` for manual admin blocks (WF-46 today), the **workflow id** for system blocks (U2 writes `blocked_by='WF-61'`); `blocked_at=NOW()`. **`blocked_reason` is caller-supplied verbatim** (user decision 2026-05-29, mid-build): the caller passes a `blockReason` envelope field with the exact value to store (`threshold_non_text`, `threshold_garbage`, `abuse`, …) — U2 does NO string composition (no hardcoded `'threshold_'` prefix). This keeps caller-specific naming out of the shared utility. `silent_drop.reason` stays granular (separate `reason` field, logged every call). This rename (`block_reason`→`blocked_reason` + `blocked_at`/`blocked_by` population) propagated to both specs + downstream state items (BMX-P0-DB, BMX-P2-WF01, BMX-P3-WF25) so later batches build the correct columns and pass `blockReason`.

**Build outcome (2026-05-29T11:04:06Z):** Created WF-61 (`9Zt23yt8k8PQSgji`), 11 nodes, active=true. Flow: Trigger(passthrough) → Entry Guard (Code v2, strict-envelope hard-fail; validates phoneNumber/messageType/reason/blockThreshold/blockReason) → Insert Silent Drop (Postgres v2.6 executeQuery, aod=true, RETURNING id) → Count 30-Day Drops (Postgres v2.6, aod=true, `count(*)::int AS drop_count` over 30-day rolling window) → Threshold Reached? (IF v2.2, `drop_count >= blockThreshold`) → [T] Auto-Block Upsert (Postgres v2.6, `INSERT … ON CONFLICT (phone_number) DO UPDATE` writing the legacy block trio) → Build Block Alert (Code v2, admin-cmds `C0A5B0ZE81E`) → Build WF-51 Block Alert Payload (Set v3.4) → Call WF-51 Block Alert (exec v1.2, onError=continueRegularOutput) → Return Blocked (Set v3.4 `{blocked:true}`); [F] Return Not Blocked (Set v3.4 `{blocked:false}`). typeVersion floor honored (trigger 1.1, code 2, postgres 2.6, if 2.2, set 3.4, exec 1.2). All 3 Postgres nodes `alwaysOutputData:true`, explicit `operation:executeQuery` (no operation-default trap), params via `queryReplacement`, snake_case alias. MCP strict-validate `valid:true`, 0 errors, 10 warnings (all FP/intentional/tech-error-deferred). Lint hook exit 0. **Runtime SQL verified** via ROLLBACK dry-run against live schema (both reason types): Insert→id, Count→drop_count, Upsert(stub-insert) stores caller's `blockReason` verbatim — `blocked_reason='threshold_non_text'` (threshold) and `blocked_reason='abuse'` (abuse) both round-tripped, `blocked_by='WF-61'`, `status='blocked'` — nothing persisted. End-to-end parent execution deferred to caller batches (4–7) + Batch 10 smoke test. **Caller obligation (Batches 4–7):** each U2 call site must pass `blockReason` (the exact `users.blocked_reason` value) in addition to `reason` (granular drop log) — abuse callers pass `blockReason='abuse'`, `blockThreshold=1`.

## BMX-P0-U3 — Build U3 New-Contact Intent Classifier (WF-62)

**Status:** ✅ done
**Started:** 2026-05-29T12:19:35Z
**Completed:** 2026-05-29T13:00:29Z
**Actual tokens:** ~75K (incl. the U1 halt-contract fix + due-diligence caller scan that surfaced mid-build)
**Actual effort:** ~40 min
**Estimate delta:** +1 bucket (planned M ~40K, actual ~75K — the U1 contract fix was unplanned scope folded into this batch)
**Decision made:** (1) U3 classifier prompt (BMX-06 §11.2) + confidence<0.5 fail-open threshold approved VERBATIM by user 2026-05-29. (2) U1 Gemini-failure semantics corrected to HALT (see BMX-P0-U1 contract-fix note) — U3's `Call U1` uses default `onError=stopWorkflow` so U1's halt propagates → U3 halts, returning no bucket on Gemini failure.
**Priority:** P0 | **Batch:** 2

**Build outcome (2026-05-29T13:00:29Z):** Created WF-62 (`tJknCwk2PzLpEwTX`), 7 nodes, active=true. Flow: Execute Workflow Trigger (passthrough) → Entry Guard (Code v2, strict-envelope hard-fail: phoneNumber E.164 / text non-empty / stage ∈ {new,pre_form} / consultChannelId optional Slack-id) → Build Gemini Request (Code v2, interpolates the §11.2 prompt with stage+text, builds geminiBody with temp=0, maxOutputTokens=60, `responseMimeType: application/json`) → Classify Intent (httpRequest v4.2, POST gemini-2.5-flash-lite, cred googlePalmApi `zT7defyXYEvxWwZm`, retryOnFail=true/maxTries=3/timeout=10s, onError=continueErrorOutput) → [main0/success] Parse Classification (Code v2, strips ``` fences, JSON.parse, validates bucket ∈ 10-bucket enum + numeric confidence, returns raw `{bucket,confidence}`; malformed → `{unrelated,0}`) [terminal]; [main1/error] Build U1 Payload (Set v3.4 contract-emit `{phoneNumber, userFacing:true, consultChannelId, context:{source:'U3', userMessage, errorDetail}}`, reads `$('Entry Guard').first()` since the error item lacks input fields) → Call U1 (Gemini Error) (exec v1.2, **default onError=stopWorkflow** → U1 halt propagates → U3 halts). typeVersion floor honored (trigger 1.1, code 2, http 4.2, set 3.4, exec 1.2 — all project highest-in-live). Lint exit 0 (after Step-5g clean-up: `context.source` 'WF-62'→'U3' to match spec §170 utility-alias example + remove WF-\d false-positive; errorDetail rewritten to business-tone since U1 renders it into the admin Reason: line). MCP strict-validate `valid:true`, 0 errors, 9 warnings (all FP/floor/intentional — Code `$`-heuristics, httpRequest 4.2 floor + standard googlePalmApi predefined-cred, exec 1.2 floor). Contract-First: Build U1 Payload is a named Set v3.4 immediately upstream of Call U1 (mappingMode defineBelow + value:{}). **Caller obligation (Batches 5–6):** WF-21/WF-23 pass `{phoneNumber, text, stage, consultChannelId?}`, read raw `{bucket, confidence}` applying `confidence<0.5 → unrelated`, and keep `Call U3` default onError so a U3 halt (Gemini failure) propagates and terminates the turn. **Live end-to-end Gemini-classification execution deferred** to Batch 5/6 caller wiring + Batch 10 smoke test (no parent caller yet; Gemini cred in n8n vault; Batch-1 U1/U2 precedent). Backup n/a (net-new create).
**Change type:** Workflow-create
**Workflows:** WF-62
**Depends on:** BMX-P0-U1 (hard)
**Size:** M
**Estimated tokens:** ~40K
**Estimated effort:** ~1.25 hr

New shared sub-workflow, proposed WF-62. Gemini classifier with `stage` param (new|pre_form) tuning prompt context; returns one of 7 buckets (greeting / wants_consultation / service_related_question / HELP / unrelated|low-confidence / garbage|stop_intent / malicious|abusive|inappropriate). Literal STOP/REBOOK never reach U3 (preempted upstream). Uses U1 on Gemini failure → hard dep on BMX-P0-U1. BMX-06 §121-129. U3 prompt copy is DRAFT (BMX-06 §11) — verify verbatim with user at build. Invoke `build-workflow`.

## BMX-P1-PSEUDO — Pseudo-first: rewrite all changed .pseudo + author U1/U2/U3 .pseudo

**Status:** ✅ done
**Started:** 2026-05-29T19:48:31Z
**Completed:** 2026-05-29T20:35:18Z
**Actual tokens:** ~50K
**Actual effort:** ~47 min
**Estimate delta:** on-bucket (planned L ~55K, actual ~50K)
**Priority:** P0 | **Batch:** 3
**Change type:** Documentation (pseudo)
**Workflows:** WF-01, WF-02, WF-20, WF-21, WF-23, WF-25, WF-26, WF-30, WF-31, WF-40, WF-43, WF-44, WF-45, WF-53, WF-61, WF-62
**Depends on:** —
**Size:** L
**Estimated tokens:** ~55K
**Estimated effort:** ~2–2.5 hr

Per safety-net §8.2 Phase 1 + pseudocode-first practice ([[feedback_pseudocode_first_refactor]]): rewrite `.pseudo` for all 13 changed workflows and author new `.pseudo` for U1/U2/U3, reconciled against BOTH specs, BEFORE any n8n edit. Pseudo is tech-agnostic business design — no n8n error-handling internals ([[feedback_pseudo_tech_separation]]); linear Step 1..N numbering, no tombstones ([[feedback_pseudo_linear_numbering]]). This item gates all of Phase 2–4 (do not start any n8n edit until the relevant pseudo is revised). Run pseudo↔md drift-check after authoring.

**Build outcome (2026-05-29T20:35:18Z):** Authored all 16 `.pseudo` files — 3 net-new utilities (WF-53/61/62) + 13 rewrites (WF-01/02/20/21/23/25/26/30/31/40/43/44/45) — reconciled against BMX-06 + safety-net specs, tech-agnostic, linear-numbered. Folded the 3 handoff items (U1 halt-on-failure contract + caller convention; U3 raw `{bucket,confidence}` + caller-side `confidence<0.5→unrelated`; the U1 admin-sentence improvement — see below). NO live changes (Batch 3 is pseudo-only).

**Utility pseudo verified against LIVE (user-directed, 2026-05-29):** read live WF-53/61/62 JSON and reconciled the pseudo to match live (live prevails — never the reverse; see [[feedback_pseudo_live_sync_per_batch]]). Fixes: (1) WF-53 admin-alert closing sentence is UNCONDITIONAL in live (the `userFacing`-conditional from the handoff fold-b is the still-unfixed adjacent finding in `followups.md`) → pseudo set to match live + deferred-improvement note; (2) WF-53 userName/empty-field fallback is `—` (not phoneNumber); (3) WF-61 block-alert copy uses live's structured wording (not the BMX-06 §11.2 draft). WF-62 matched live, no fix. Live untouched throughout.

**pseudo↔md drift-check DEFERRED to Batch 10 (BMX-P5-DRIFT), by design:** the 13 rewritten pseudo are intentionally AHEAD of live (pseudo-first; live builds in Batches 4–10), and the 3 new utilities have no `.md` yet. A gating sweep now would report all-expected forward-drift and write a misleading `.last-run` marker that would block this in-flight sprint. Both specs sequence the drift-check + `.md` regen to "once live" = Phase 5. The 27-workflow drift was already accepted + gate opened at sprint start (user arrangement). NOT writing the gating marker.

**Sync convention (user-clarified 2026-05-29) — pseudocode-first is the standard:** for the 13 rebuilds (Batches 4–9) the Batch-3 pseudo IS the agreed design and live is BUILT to match it (forward direction). If a build-time discussion changes the design, update that pseudo in the SAME batch, then regenerate `.md` from live → commit. The reversed "reconcile-pseudo-TO-live" direction applies ONLY to the Phase-0 utilities WF-53/61/62 that plan-sprint sequenced build-live-first (reconciled this batch). Hard safety rule: NEVER overwrite existing live to match pseudo. Untouched workflows: pseudo + `.md` synced from live at sprint END. Backing memory: [[feedback_pseudo_live_sync_per_batch]].

**Two BMX-06 spec divergences resolved-and-flagged (for build-time confirmation in Phases 2–4):** (1) WF-01 country filter — kept the live `{91 India, 61 Australia}` allow-list rather than the §5 shorthand "non-+91 → reject" (not intended to drop Australia, the operator's region); (2) WF-23 pre-form non-text — chose DEFLECTION (per decision #5 + the §11.1 pre-form non-text copy) over the §4-table "silent" lumping. Both noted inline in the respective `.pseudo`.

## BMX-P2-WF01 — Rebuild WF-01 identity & security gate (BMX-06 §5)

**Status:** ✅ done
**Started:** 2026-05-29T21:19:46Z
**Completed:** 2026-05-29T21:38:27Z
**Actual tokens:** ~60K
**Actual effort:** ~19 min
**Estimate delta:** on-bucket (planned L ~50K, actual ~60K)
**Priority:** P0 | **Batch:** 4
**Change type:** Structural (critical path)
**Workflows:** WF-01
**Depends on:** BMX-P0-DB (hard), BMX-P1-PSEUDO (hard)
**Size:** L
**Estimated tokens:** ~50K
**Estimated effort:** ~1.5–2 hr

WF-01 rebuilt to: Country → blocked? → opted_out? → route. Applies D1 block-unify (single `blocked` status + the legacy block-audit trio `blocked_reason`/`blocked_at`/`blocked_by`, no `blacklisted`; see BMX-P0-U2 design change). Non-text handling removed from WF-01 (moves to WF-02/WF-21/WF-23). Critical path (entry) → built in its own small batch with WF-02. **Delivers the behavior that the as-written TD-BMX-02 targeted** (blocked+media → silent ✓; opted_out+media → re-engage via WF-26 by design, DR-4). Reads `status='blocked'` for the gate (the `blocked_reason` columns are pre-existing — no DB dep). Invoke `build-workflow`; rebuild approach (author TO-BE from scratch) per BMX-06 §8a.

**Build outcome (2026-05-29T21:38:27Z):** Author-fresh rebuild (user-approved, Step 5e.0 criterion 1), 26→13 nodes, same ID `hYGNM97sXvdo1WmI`, active=true. TO-BE: `Country Filter`→`Country Rejected?`(true→`Silent Reject (Country)`; false→continue)→`Status Lookup` (NEW combined LEFT-JOIN users+pending_users on phone, anchored 1-row, aod=true, snake_case aliases)→`Classify & Build Envelope` (Code: route∈{blocked,opted_out,brand_new,existing}, §2.1 envelope + passthrough incl. rawMessage, forces pendingUser:null+wasOptedOut:true on opted_out)→IF-chain `Route: Blocked?`→`Silent Drop (Blocked)`; `Route: Opted Out?`→`Route Opted-Out to WF-26` (keeper); `Route: Brand New?`→`Call WF-21` (NEW direct edge); else→`Call WF-02 Rule Router` (keeper). Keepers spliced verbatim by name: trigger, `Layer 1: Country Filter`, `Country Rejected?`, `Silent Reject (Country)`, `Route Opted-Out to WF-26`, `Call WF-02 Rule Router`. Removed: non-text filter (4 nodes), duplicate blacklist chain (4), anomaly gate + WF-51 alert (4), duplicate opted-out load chain, both old envelope builders. cachedResultName added to all 3 exec nodes (2nd PUT). typeVersion floor held (if 2.2, exec 1.2, pg 2.6 — tv diff showed removals only). **Verification:** lint exit 0; MCP strict-validate valid:true, 0 errors, 19 warnings (all FP/floor: IF-main[1]-as-error-output ×4, typeVersion-floor advisories, terminal-const Code "doesn't reference input" ×2, tech-error-deferred on Status Lookup); dangling-ref scan clean (only ref is keeper trigger); Status Lookup SQL runtime-verified via read-only queries (unknown phone→1 all-null row; pending-only phone→route='existing'→WF-23). **Consumer-contract verification (envelope creator):** WF-26 live guard satisfied field-for-field on text re-engagement (media/non-text throws at WF-26's pre-Batch-9 guard — reconciled in Batch 9 WF-26 refine; WF-01 correctly does not filter, S8×G per matrix); old WF-21 has no guard, reads phoneNumber/phoneNumberFormatted/messageId/messageContent (all present); WF-02 co-verified in BMX-P2-WF02. Parent WF-00 calls WF-01→Return 200, does not consume WF-01 return — return-shape change safe. **Finding flagged:** pre-rebuild live country gate was inverted (true/rejected→continue, false/allowed→silent-reject); rebuild wires it correctly. Backup: `archive/backups/hYGNM97sXvdo1WmI-2026-05-30-07-29.json`. Full live end-to-end deferred to Batch 10 smoke (users table empty; WF-21/26 rebuild in Batches 5/9).

## BMX-P2-WF02 — WF-02 router edits + nfm_reply guard (BMX-06 §6 / decision #10)

**Status:** ✅ done
**Started:** 2026-05-29T21:39:19Z
**Completed:** 2026-05-29T21:58:05Z
**Actual tokens:** ~55K
**Actual effort:** ~19 min
**Estimate delta:** +1 bucket (planned M ~30K, actual ~55K — extra consumer-contract verification + a rename-induced dangling-target fix round + 2 plugin-improvement notes)
**Priority:** P0 | **Batch:** 4
**Change type:** Structural (Code-node)
**Workflows:** WF-02
**n8n IDs:** Detect Route node `PubCsNTOspF3xqXZ`
**Depends on:** BMX-P0-U2 (hard), BMX-P1-PSEUDO (hard)
**Size:** M
**Estimated tokens:** ~30K
**Estimated effort:** ~1 hr

WF-02 (messageType + state router for anyone with a record): add the new non-text branch (⟦U2 thr=10⟧ → if !blocked: "email us") and the nfm_reply guard ternary on the `Detect Route` node (decision #10). Hard dep on U2 (non-text branch calls it). Invoke `build-workflow`.

**Build outcome (2026-05-29T21:58:05Z):** On-disk transform (mutate live, keepers preserved — NOT author-fresh), 19→23 nodes. Changes: (1) `Validate Inputs` relaxed — messageType any non-empty string (accepts media), messageContent key-present (allow null) per pseudo Step 1; (2) `Detect Route` rewritten — nfm_reply stage guard (user null + pendingUser present → DETAILS_FORM else UNHANDLED), NEW `EXISTING_NON_TEXT` (user!=null && messageType not text/interactive), `NEW_USER` removed (falls to UNHANDLED); (3) `Route Switch` index-0 repurposed NEW_USER→EXISTING_NON_TEXT (indices 1–8 stable); (4) `Is Text Message?` → `Existing-User Text?` gated on `messageType==='text' && user!=null` (pre-form text now skips WF-20 → WF-23); (5) dead `Call WF-21` node removed; (6) NEW branch: Route Switch[EXISTING_NON_TEXT] → `Build U2 Payload (Non-Text)` (Set v3.4 contract-emit {phoneNumber,messageType,reason:non_text,messageContent,blockThreshold:10,blockReason:threshold_non_text}) → `Call WF-61 (U2 Non-Text Escalate)` → `Non-Text Blocked?` IF (true=blocked→terminal w/ notes justification; false→`Build Deflection Payload` Set v3.4 → `Call WF-50 (Non-Text Deflection)` w/ approved verbatim "email us" copy). typeVersion: IF v2 (WF-02 floor), exec 1.2, Switch 3.2 (in-place); Set v3.4 introduced (justified project floor — 44/44 project Set nodes at 3.4). New exec nodes carry cachedResultName. **Verification:** lint exit 0; MCP strict-validate valid:true 0 errors. **Caught + fixed:** the `Is Text Message?`→`Existing-User Text?` rename updated the outgoing-connection key + `$()` refs but initially missed the INCOMING connection target (`Detect Route → "Is Text Message?"`) → validate flagged "Connection to non-existent node" + a cascade of "not reachable" warnings; fixed by renaming connection targets too, re-PUT, re-validate clean. Remaining 13 warnings all FP/pre-existing (IF/Switch main[1]-as-error-output FP ×3; cachedResultName missing on 9 pre-existing keeper exec nodes — live debt, left for Batch 8 handler edits; long-linear-chain info). **Consumer-contract verification:** WF-02 accepts WF-01's envelope field-for-field (the relaxed guard is exactly what lets WF-01's media envelope through); the new U2 + WF-50 calls satisfy WF-61 + WF-50 entry-guard contracts. **Plugin notes logged** (followups.md, flush at batch boundary): (a) consumer-contract acceptance should be an explicit build-workflow Step 6 gate for contract producers; (b) Step 6a dangling-ref scan should also cover connection TARGET names, not just `$('…')` expression refs. Backup: `archive/backups/PubCsNTOspF3xqXZ-2026-05-30-07-50.json`. Full live end-to-end deferred to Batch 10 smoke.

## BMX-P2-WF21 — Rebuild WF-21 brand-new owner (BMX-06 §7)

**Status:** ✅ done
**Started:** 2026-05-29T22:09:53Z
**Completed:** 2026-05-29T22:31:01Z
**Actual tokens:** ~65K
**Actual effort:** ~21 min
**Estimate delta:** +1 bucket (planned L ~50K, actual ~65K — copy sign-off round-trip + 4-callee contract verification + 39-node author-fresh script)
**Priority:** P0 | **Batch:** 5
**Change type:** Structural (workflow rebuild)
**Workflows:** WF-21
**Depends on:** BMX-P0-U2 (hard), BMX-P0-U3 (hard), BMX-P1-PSEUDO (hard)
**Size:** L
**Decision made (copy verbatim sign-off, 2026-05-29T22:09Z):** User approved at build. (1) Welcome+form (Block A) = live WF-21 text verbatim, with the name changed to **"Dr. Chinmay Mujumdar"** (added "Dr."); dead `wasOptedOut` welcome-back prefix dropped (brand-new never opted-out). (2) Service-question Gemini answer prompt = drafted ₹500/GPay/WhatsApp-bounded prompt, name "Dr. Chinmay Mujumdar". (3) Gentle-redirect (Block C, unrelated/low-confidence) = §11.1 draft with "Dr. Chinmay Mujumdar". (4) WhatsApp **Flow ID = `2260297164474475`** (live value reused; CLAUDE.md's `1408011897720771` NOT used — flag CLAUDE.md drift at sprint end). U3 prompt §11.2 already locked in Batch 2. "Dr." used consistently across all name mentions.
**Design decisions:**
- Block A welcome (LOCKED): `Welcome! 🙏\n\nI'm Dr. Chinmay Mujumdar, a Vedic astrology consultant.\n\n📋 Privacy Policy: https://chinmaymujumdar.com/privacy-policy\n\n✨ How it works:\n• Share your birth details using the form below\n• Pay ₹500 consultation fee via GPay\n• Receive your personalised Vedic astrology consultation on WhatsApp\n\nTo get started, please fill in the form with your birth details.` + Flow (header "Birth Details Form", CTA "Fill Details", flowId 2260297164474475).
- Block C redirect (LOCKED): `🙏 Thanks for reaching out! Chinmay Astro offers Vedic astrology consultations with Dr. Chinmay Mujumdar over WhatsApp. If you'd like a consultation, tap Fill Details below to get started.` + Flow CTA.
- Block B service answer = Gemini answer + blank line + Block A; prompt name "Dr. Chinmay Mujumdar".
**Estimated tokens:** ~50K
**Estimated effort:** ~1.5–2 hr

WF-21 rebuild (no record at all): step1 non-text → ⟦U2 thr=5⟧; step2 literal STOP/UNSUBSCRIBE/OPT OUT/OPT-OUT/REBOOK → silent drop + ⟦U2 thr=5⟧ (brand-new asymmetry, NO reply; aliases per decision #6); step3 text → ⟦U3 stage=new⟧ 7-bucket routing (welcome+form / Gemini answer / HELP / gentle redirect / silent / block+admin-alert). Gemini failure → ⟦U1⟧. **Delivers TD-BMX-06 (new-user) + part of TD-BMX-05.** Copy DRAFT (BMX-06 §11) — verify verbatim at build. Rebuild from scratch per §8a. Invoke `build-workflow`.

**Build outcome (2026-05-29T22:31:01Z):** Author-fresh rebuild (Step 5e.0 criterion 1, standing §8a/sprint-plan approval — same path WF-01 used this sprint), 4→39 nodes, same ID `zM8WbxSdt9nXRoLZ`, active=true. Graph: Trigger(passthrough keeper) → `Normalize Envelope` (Code: reads WF-01 brand_new envelope, computes keyword/isAlias/aliasReason, hard-fails on missing phoneNumber) → `Non-Text?` IF (T→`Build U2 Payload (Non-Text)` Set→`Call U2 (Non-Text)`; F→) `Opt-Out/Rebook Alias?` IF (T→`Build U2 Payload (Alias)`→`Call U2 (Alias)`; F→) `Build U3 Payload` Set→`Call U3 Classify` (default onError=stopWorkflow → U3 halt propagates)→`Apply Fail-Open` (Code: confidence<0.5→unrelated, maps effectiveBucket→routeClass∈{welcome,service,redirect,silent,block}, recovers Normalize fields via `$('Normalize Envelope')`)→ IF-chain `Route: Welcome?`/`Route: Service?`/`Route: Redirect?`/`Route: Silent?` (else→block). Welcome: Insert PU→`Build Welcome Message`→Call WF-50→`Build U2 (Greeting Loop)` thr10→Call U2. Service: `Build Service Answer Request`→`Generate Service Answer` (http v4.2, gemini-2.5-flash-lite, retry3/timeout10s, onError=continueErrorOutput) — success→`Parse Service Answer`→Insert PU→`Build Service Message` (answer+welcome+form)→Call WF-50→`Build U2 (Service Loop)` thr10→Call U2; error(main[1])→`Build U1 Payload (Service)`→`Call U1 (Service)` (default onError→halt). Redirect: Insert PU→`Build Redirect Message`→Call WF-50→`Build U2 (Unrelated)` thr5→Call U2. Silent: `Build U2 (Garbage)` reason=silentReason(stop_intent|garbage) thr5→Call U2. Block: `Build U2 (Abuse)` thr1 blockReason=abuse→Call U2. Every Call U2 onError=continueRegularOutput (fire-and-forget; WF-21 never consumes {blocked} — brand-new is silent regardless). typeVersion floor held (code 2, if 2.2, set 3.4, exec 1.2, http 4.2, postgres 2.6 — all project highest-in-live; strict-validate "outdated" advisories are the intentional floor). 3 Insert PU nodes operation=executeQuery + aod=true (no operation-default trap). **Verification:** lint exit 0; MCP strict valid:true 0 errors / 44 warnings (all FP/floor/tech-deferred: IF-main[1]-as-error-output ×6, typeVersion-floor ×17, Code-no-input-ref ×3 [named-node refs], $json-each-mode FP, googlePalmApi hardcoded-cred FP, DB-retry advisory, long-chain info); dangling-ref scan clean (removed `Call WF-50 Send WhatsApp`/`Insert Pending User` — 0 refs); Step-6b per-node strict on Postgres + HTTP valid:true 0 errors. **Contracts:** consumes WF-01 brand_new envelope field-for-field (phoneNumber/messageType/messageContent/contactName/messageId/phoneNumberFormatted); emits exact U2 {phoneNumber,messageType,reason,messageContent,blockThreshold,blockReason} / U3 {phoneNumber,text,stage} / U1 {phoneNumber,userFacing,context} / WF-50 {phoneNumber,messageType:interactive,interactivePayload,messageContent,inboundMessageId,userMessage} contracts (verified vs each callee `.pseudo` Inputs). Copy LOCKED per Design decisions ("Dr. Chinmay Mujumdar" consistently; Flow ID 2260297164474475). Backup: `archive/backups/zM8WbxSdt9nXRoLZ-2026-05-30-08-27.json`. **Live Gemini-classification + WA-send end-to-end deferred to Batch 10 smoke** (users table empty; no test phone wired — same deferral as U3/WF-01 builds). **Flagged:** CLAUDE.md credential table Flow ID `1408011897720771` is drift vs live `2260297164474475` — surface at sprint end.

## BMX-P2-WF23 — Rebuild WF-23 pre-form owner (BMX-06 §8)

**Status:** ✅ done
**Started:** 2026-05-29T22:45:24Z
**Completed:** 2026-05-29T22:59:05Z
**Actual tokens:** ~55K
**Actual effort:** ~14 min
**Estimate delta:** on-bucket (planned L ~48K, actual ~55K — sibling-savings realized vs WF-21's ~65K; the WF-21 template + locked U1/U2/U3/WF-50 contracts cut analysis time)
**Priority:** P0 | **Batch:** 6
**Decision made (copy verbatim sign-off, 2026-05-29T22:45Z):** User approved strings A–G verbatim (BMX-06 §11.1 pre-form copy reconciled with "Dr. Chinmay Mujumdar" naming + WF-21 Flow-form params: header "Birth Details Form", flowId 2260297164474475, CTA "Fill Details", policy URL chinmaymujumdar.com/privacy-policy). Service-answer Gemini prompt reused verbatim from WF-21. Author-fresh build path approved (criterion 1 — pseudocode-driven complete rebuild; same path WF-01/WF-21 used this sprint).
**Change type:** Structural (workflow rebuild)
**Workflows:** WF-23
**Depends on:** BMX-P0-U2 (hard), BMX-P0-U3 (hard), BMX-P1-PSEUDO (hard)
**Size:** L
**Estimated tokens:** ~48K
**Estimated effort:** ~1.5–2 hr

WF-23 rebuild (has pending_users, no users row): same shape as WF-21 but pre-form clarifiers — STOP-aliases → "nothing to opt out of, complete the form"; REBOOK → "no prior booking, complete the form"; U3 stage=pre_form buckets re-send/Gemini+form/help+form/redirect+form/silent/block. **Delivers TD-BMX-06 (pre-form) + pre-form HELP (the behavior TD-BMX-03 targeted for S2×E) + part of TD-BMX-05.** Sibling pattern to WF-21. Rebuild from scratch per §8a. Invoke `build-workflow`.

**Build outcome (2026-05-29T22:59:05Z):** Author-fresh rebuild (Step 5e.0 criterion 1, user-approved this session — same path WF-01/WF-21 used), 21→45 nodes, same ID `VpCER0Vqq3NYJGpI`, active=true. WF-21 sibling used as the structural template (Build Service Answer Request / Generate Service Answer http / Parse Service Answer reused verbatim; all Set/Code contract shapes mirrored). Trigger upgraded v1→v1.1 `inputSource=passthrough` (was below floor; matches WF-21 + canonical sub-workflow pattern). Graph: Trigger → `Normalize Envelope` (Code: WF-02 pre-form envelope, keyword/isAlias/aliasReason, hard-fail on missing phoneNumber) → `Non-Text?` IF (T→`Build Deflection Message (Non-Text)` text→`Call WF-50 (Non-Text Deflection)`→`Build U2 Payload (Non-Text)` thr5 reason=non_text→`Call U2 (Non-Text)`; F→) `Opt-Out/Rebook Alias?` IF boolean (T→`Build Clarifier Message (Alias)` Code REBOOK?C:B text→`Call WF-50 (Alias Clarifier)`→`Build U2 Payload (Alias)` thr5 reason=aliasReason→`Call U2 (Alias)`; F→) `Build U3 Payload` Set {phoneNumber,text,stage:'pre_form'}→`Call U3 Classify` (default onError→halt propagates)→`Apply Fail-Open` (Code: confidence<0.5→unrelated; 6 routeClasses welcome/service/help/redirect/silent/block; recovers Normalize fields via `$('Normalize Envelope')`)→ IF-chain Route: Welcome?/Service?/Help?/Redirect?/Silent? (else→block). Welcome: `Build Welcome Message` (interactive form, string D)→Call WF-50→U2 greeting_loop thr10. Service: `Build Service Answer Request`→`Generate Service Answer` (http v4.2 gemini-2.5-flash-lite, retry3, onError=continueErrorOutput)—success→`Parse Service Answer`→`Build Service Message` (answer+string E+form)→Call WF-50→U2 service_loop thr10; error(main[1])→`Build U1 Payload (Service)` (source='WF-23')→`Call U1 (Service)` (default onError→halt). Help: `Build Help Message` (string F+form)→Call WF-50→U2 help_loop thr10. Redirect: `Build Redirect Message` (string G+form)→Call WF-50→U2 unrelated thr5. Silent: `Build U2 Payload (Garbage)` reason=silentReason(stop_intent|garbage) thr5→Call U2. Block: `Build U2 Payload (Abuse)` thr1 blockReason=abuse→Call U2. **Key WF-23-vs-WF-21 adaptations:** no Postgres/Insert-PU nodes (pending_users row already exists); non-text & alias branches send a WF-50 message BEFORE escalating, so their U2 Set nodes read `$('Normalize Envelope')` (not `$json`, which becomes WF-50's return post-send); distinct `help` routeClass (WF-21 folds HELP into welcome); stage='pre_form'; U1 context source 'WF-23'. Every Call U2/WF-50 onError=continueRegularOutput (fire-and-forget); Call U3/U1 default onError=stopWorkflow (halt propagates per U1/U3 caller conventions). **Verification:** lint exit 0; MCP strict valid:true, 0 errors, 53 warnings (all FP/floor/tech-deferred: IF-main[1]-as-error-output ×7, tv-floor "outdated" advisories, Code named-ref "doesn't reference input"/"$json each-mode" FP, googlePalmApi hardcoded-cred FP, long-chain info — same classes as WF-21 scaled for the extra Help route); dangling-ref scan clean (20 removed old nodes incl. `Call WF-25 Intent Classifier`, `Is Pass-Through Intent?`, the GAP-3C Gemini chain — 0 refs); Step-6b runtime probe: HTTP method=POST explicit + cred zT7defyXYEvxWwZm + retry3 carried, all 16 exec nodes op=call_workflow explicit, onError posture verified (U3/U1 default-stop, rest continue); tv floor held (only postgres absent vs WF-21 floor — expected, no new versions). **Contracts:** consumes WF-02 PRE_FORM envelope (phoneNumber/messageType/messageContent/contactName/messageId/phoneNumberFormatted); emits exact U2/U3{stage:pre_form}/U1{source:WF-23}/WF-50{text + interactive} contracts (verified vs each callee `.pseudo`). WF-25 call RETIRED (pre-form classification now via U3). Copy LOCKED per user sign-off ("Dr. Chinmay Mujumdar"; Flow ID 2260297164474475). Backup: `archive/backups/VpCER0Vqq3NYJGpI-2026-05-30-08-45.json`. **Live Gemini-classification + WA-send end-to-end deferred to Batch 10 smoke** (no pending_users test row wired — same deferral as WF-01/WF-21/U3 builds).

## BMX-P3-WF25 — Rebuild WF-25 Intent Classifier + Safety-Net Hub (safety-net §5)

**Status:** ✅ done
**Started:** 2026-05-29T23:10:38Z
**Completed:** 2026-05-29T23:39:24Z
**Actual tokens:** ~60K
**Actual effort:** ~29 min
**Estimate delta:** on-bucket (planned XL ~70K, actual ~60K — keepers carried verbatim cut authoring time; copy was pure reuse-existing, no sign-off round-trip)
**Priority:** P0 | **Batch:** 7
**Change type:** Structural (full-replace rebuild, critical hub)
**Workflows:** WF-25
**n8n IDs:** `eTV1lUcYrXBg2q2T`
**Depends on:** BMX-P0-U1 (hard), BMX-P0-U2 (hard), BMX-P1-PSEUDO (hard)
**Size:** XL
**Estimated tokens:** ~70K
**Estimated effort:** ~3–4 hr

The central change. Author complete TO-BE node graph from scratch; carry over verbatim all workflow-level props + surviving nodes (Gemini classify HTTP node, parse Code node, Route switch); generate fresh nodes for U1/U2 calls + consultation_active D4 relay-return + clarifier consolidation; unify block on `blocked`+ legacy `blocked_reason`/`blocked_at`/`blocked_by`; **retire WF-46 from this path** (WF-25 stops calling it). **Apply via full-workflow replace on the SAME ID `eTV1lUcYrXBg2q2T`** — do NOT mint a new ID (4 callers WF-30/31/40/43 reference it by ID). Built BEFORE handlers so they edit against final hub behavior. Use jq+PUT for nested-array edits, verify with re-fetch ([[feedback_n8n_mcp_nested_array_update]]). Data-contract sanity on every U1/U2 call site ([[feedback_data_contract_discipline]]). Invoke `build-workflow`.

**Resume multi-caller verification (2026-05-29T23:10Z):** live dependency-map shows **5** callers reference `eTV1lUcYrXBg2q2T` by ID (handoff said 4) — WF-30/31/40/43 (stay) + **WF-44** (`Du2CJ3OTohRFZYoA`, the redundant call retiring in Batch 8). Not a discrepancy — it confirms the same-ID full-replace constraint. PUT on same ID; no new ID minted.

**Build outcome (2026-05-29T23:39:24Z):** Author-fresh rebuild (Step 5e.0 criterion 1 — pseudocode-driven complete rebuild; standing §8a/sprint-plan approval, same path WF-01/WF-21/WF-23 used this sprint), 22→19 nodes, same ID `eTV1lUcYrXBg2q2T`, active=true, via Python build script → curl PUT (body never entered context). **6 keepers carried verbatim by name:** trigger (upgraded v1→v1.1 `inputSource=passthrough`, matches sibling floor), Prepare Intent Request, Classify Intent (Gemini HTTP, cred googlePalmApi `zT7defyXYEvxWwZm`, onError=continueErrorOutput), Parse Intent (8-bucket validate + status-aware fallback), Route by Intent (switch v3, 8 outputs — rewired connections only), Return to Caller (one deliberate keeper edit: `return [$('Parse Intent').first()]` so send-then-return paths still return the merged `{...envelope, intentResult}`). **13 new nodes:** Gemini-fail → Build U1 Payload (Set v3.4, reads `$('Prepare Intent Request')`, userStateText status→plain-English map) → Call U1 (WF-53, default onError=stopWorkflow → halt propagates); stop_intent → Build Stop Clarifier Payload → Call WF-50 (continueRegularOutput) → Return; garbage → Build U2 Payload (Garbage) thr10 `threshold_garbage` → Call U2 (WF-61) → Garbage Blocked? IF (T→`End — Garbage Blocked (Silent)` notes-annotated terminal; F→) Active Consultation? IF (T→Return [D4]; F→Build Garbage Warning Payload → Call WF-50 [terminal]); abuse (Route 5+6) → Build U2 Payload (Abuse) thr1 `abuse` → Call U2 [terminal]. Copy REUSE-EXISTING verified verbatim vs live: stop clarifier (matched live handler WF-30) + garbage warning (matched live WF-25 `Prepare Garbage Warning`). **Removed (15):** Notify Admin of Garbage, Prepare/Send Block Warning, Auto-Block via WF-46, Prepare WF-51 Payload (Garbage Admin), the full inline Gemini-failure chain (Build User Apology Payload, Send Apology via WF-50, Build Admin Alert Text, Has Consult Channel?, Build/Send Consult+AdminCmds alerts ×4, Halt on Gemini Failure), Prepare Garbage Warning. **Verification:** lint hook exit 0; MCP strict-validate `valid:true`, 0 errors, 24 warnings (ALL FP/floor/tech-deferred — typeVersion-floor advisories [keepers + new at project floor 1.2/2.2/3.4], IF/Switch main[1]-as-error-output FP ×3, switch-v3 missing-outputKey ×8 [keeper verbatim], Code-can-throw ×2 + googlePalmApi hardcoded-cred FP + long-chain info); Step-6a post-PUT dangling-ref scan clean (0 refs to any of 15 removed names); Step-6b per-node strict on executeWorkflow canonical shape `valid:true` 0 errors (no operation-default trap — no Postgres/new-HTTP/Slack added); pre-flight lint scan was clean (no debt rollers needed). **Contracts:** emits exact U1 `{phoneNumber,userFacing:true,consultChannelId,context}` / U2 `{phoneNumber,messageType,reason,messageContent,blockThreshold,blockReason}` / WF-50 text `{phoneNumber,messageType:text,messageContent}` contracts (verified vs each callee `.pseudo` Inputs); contract-emit Set v3.4 immediately upstream of every exec call (includeOtherFields=false). **Return-shape preserved** for pass-through (same as old `$input.first()` since Parse Intent == routed item). Backup: `archive/backups/eTV1lUcYrXBg2q2T-2026-05-30-09-17.json`. **Live Gemini-classification + send end-to-end deferred to Batch 10 smoke** (users table empty; handlers WF-30/31/40/43 adapt to the new return-contract in Batch 8 — same deferral as WF-01/21/23/U1/U2/U3).

## BMX-P3-HANDLERS — Thin handler edits WF-30/31/40/43 (safety-net §6)

**Status:** ✅ done
**Priority:** P0 | **Batch:** 8
**Started:** 2026-05-29T23:53:09Z
**Completed:** 2026-05-30T00:15:02Z
**Change type:** Structural (partial edits)
**Workflows:** WF-30, WF-31, WF-40, WF-43
**Depends on:** BMX-P3-WF25 (hard), BMX-P0-U1 (hard)
**Size:** M
**Estimated tokens:** ~40K
**Estimated effort:** ~1.5 hr
**Actual tokens:** ~95K
**Actual effort:** ~22 min
**Estimate delta:** +1 bucket (planned M ~40K, actual ~95K — 4 WFs × full jq-on-disk + per-WF strict validate, plus a WF-30 author-retry on optional-chaining/shell-quoting added ~15K → M-to-L band)

Handlers become thin: delete inline Gemini-error chains → call U1; remove in-handler clarifiers (now centralized in WF-25); WF-43 stop_intent → clarifier. Partial edits (no full rebuild). Edited AFTER WF-25 (hard dep) so they target the final hub behavior. Per-workflow execution — separate backup/verify per WF or combined per-workflow PUTs. Invoke `build-workflow`.

**Build record (2026-05-30):** jq-on-disk per WF (Step 5e). All `valid:true` strict, errorCount 0, no dangling refs, no optional-chaining in Set expr fields.
- **WF-30** (gGJBY5fJha0Let8I) 21→12: removed 2 stop-clarifier + 9-node Gemini-error chain; added `Build U1 Payload`+`Call U1 (WF-53)` off Gemini error output (source WF-30, state 'awaiting payment'); `Is Pass-Through Intent?` FALSE→terminate (D5 note). U1 context re-PUT once to strip `?.` (unsupported in Set expr fields).
- **WF-31** (HB8nXudAtk9iXz7C) 24→15: same removal+U1 (source WF-31, state 'payment under review'); Branch B (Load Payment→Relay to Admin Slack) preserved verbatim; `Is Pass-Through Intent?` FALSE→terminate.
- **WF-40** (du32QBZbSQOjfESe) 7→4: removed `Stop Intent?`+clarifier build+`Call WF-50`; collapsed to trigger→WF-25→Format Slack→WF-51. No U1 (no own Gemini).
- **WF-43** (3va0M06kijgyLejf) 30→22: kept `Stop Intent?` check, rewired TRUE→terminate (dropped `Call WF-47`, D5); removed 9-node Gemini-error chain; added U1 (source WF-43, state 'consultation completed'); button cascade unchanged.
- U1-call shape mirrors Batch-7 WF-25 template verbatim (executeWorkflow v1.2, defineBelow+value:{}, default onError=halt). Backups: archive/backups/{uuid}-2026-05-30-*.json.

## BMX-P3-WF44 — WF-44 strip redundant WF-25 call (safety-net §6 decision #11)

**Status:** ✅ done
**Priority:** P0 | **Batch:** 8
**Started:** 2026-05-30T00:16:00Z
**Completed:** 2026-05-30T00:18:21Z
**Actual tokens:** ~14K
**Actual effort:** ~3 min
**Estimate delta:** on-bucket (planned S ~20K, actual ~14K)
**Caller compliance audit:** RE-VERIFIED at build 2026-05-30 — WF-44 (Du2CJ3OTohRFZYoA) called ONLY by WF-43 across all exported workflows + dependency-map.md. Sole caller confirmed.
**Build record:** Du2CJ3OTohRFZYoA 9→4 nodes. Removed `Call WF-25 Intent Classifier`, `Is Rebook Intent?`, `Call WF-45 Rebook`, `Is Stop Intent?`, `Call WF-47 Unsubscribe`; rewired trigger→`Save Feedback to DB`→`Prepare Ack Message`→`Send Ack via WF-50`. `Save Feedback` query params already read from trigger envelope (`$('When Executed by Another Workflow')`), so the input-source change is safe; `operation: executeQuery` explicit, `alwaysOutputData:true`. `valid:true` strict, errorCount 0, no dangling refs. Backup: archive/backups/Du2CJ3OTohRFZYoA-2026-05-30-10-16.json.
**Change type:** Structural (partial edit)
**Workflows:** WF-44
**n8n IDs:** `Du2CJ3OTohRFZYoA`
**Depends on:** BMX-P3-WF25 (soft)
**Size:** S
**Estimated tokens:** ~20K
**Estimated effort:** ~45 min

Delete `Call WF-25` + the `rebook_intent?`/`stop_intent?` IFs + their WF-45/WF-47 calls; rewire trigger → Save Feedback. **Caller compliance audit:** WF-43 confirmed sole caller across all 28 workflows (2026-05-29) — re-verify at build. Soft dep on WF-25 (consistency, no hard build-order need). Invoke `build-workflow`.

## BMX-P3-WF20 — WF-20 STOP-aliases UNSUBSCRIBE/OPT OUT/OPT-OUT (TD-BMX-05, safety-net §6 decision #6)

**Status:** ✅ done
**Priority:** P0 | **Batch:** 8
**Started:** 2026-05-30T00:19:00Z
**Completed:** 2026-05-30T00:20:13Z
**Actual tokens:** ~10K
**Actual effort:** ~2 min
**Estimate delta:** on-bucket (planned XS ~15K, actual ~10K)
**Build record (Mode B inline-inherit):** WF-20 (LgIDj1v4ZbCPlX25) `Match Keyword` Switch v3.2 — STOP rule (matched by `outputKey=="STOP"`, not index) expanded from single `equals "STOP"` to combinator `or` over 4 conditions: STOP, UNSUBSCRIBE, OPT OUT, OPT-OUT. `OPTOUT` (no separator) deliberately excluded. caseSensitive:false (already) + upstream `Normalize Keyword` uppercases. outputKey unchanged → still routes to `Call WF-47 Unsubscribe`. jq+PUT (nested-array edit; MCP updateNode avoided per [[feedback_n8n_mcp_nested_array_update]]). `valid:true` strict, errorCount 0. No nodes removed → no dangling rescan. Backup: archive/backups/LgIDj1v4ZbCPlX25-2026-05-30-10-19.json.
**Change type:** Surgical
**Workflows:** WF-20
**Depends on:** BMX-P1-PSEUDO (hard)
**Size:** XS
**Estimated tokens:** ~15K
**Estimated effort:** ~30 min

Add `UNSUBSCRIBE`/`OPT OUT`/`OPT-OUT` to the WF-20 keyword path that routes existing users → WF-47 (opt out). Exact-match after `uppercase(trim())`; `OPTOUT` (no separator) excluded. Existing-user HELP arms already live (TD-027). Originally P1 (TD-BMX-05); folded into the P0 safety-net redesign. (New/pre-form alias handling lives in WF-21/WF-23 from Phase 2 — belt-and-suspenders.) Invoke `build-workflow`.

## BMX-P3-WF46 — Retire WF-46 Auto-Block (safety-net §8 / §332)

**Status:** ✅ done
**Priority:** P0 | **Batch:** 8
**Started:** 2026-05-30T00:21:00Z
**Completed:** 2026-05-30T00:21:55Z
**Actual tokens:** ~9K
**Actual effort:** ~2 min
**Estimate delta:** on-bucket (planned XS ~12K, actual ~9K)
**Caller compliance audit (2026-05-30):** Scanned all exported workflows + dependency-map.md for refs to WF-46 (`UV62An60fzflU0uD`). **WF-46 HAS a live caller: WF-11 Command Parser (`GoTYo0GS2y8qjjkw`) — the admin BLOCK command.** WF-25, all 4 handlers (WF-30/31/40/43), and WF-44 confirmed ZERO refs to WF-46 (auto-block path already retired in Batch-7 WF-25 rebuild → U2).
**Disposition (per item conditional + safety-net §8 line 345-346):** WF-46 **NOT deleted** — it remains the admin-BLOCK handler invoked by WF-11. The "auto-block retirement" goal is satisfied by the Batch-7 WF-25 re-point (WF-25 abuse/garbage-at-threshold now flows through U2, not WF-46). No workflow edit this item — confirm-and-record only. WF-46 stays 🟢 Active. This is the explicitly-anticipated "other callers exist → leave it" branch, not a deviation.
**Change type:** Structural (retirement)
**Workflows:** WF-46
**Depends on:** BMX-P3-WF25 (hard), BMX-P3-HANDLERS (hard)
**Size:** XS
**Estimated tokens:** ~12K
**Estimated effort:** ~30 min

WF-25 (and handlers) no longer call WF-46 — blocking now flows through U2 / unified `blocked`+ legacy `blocked_reason`/`blocked_at`/`blocked_by`. **Caller compliance audit:** before deleting WF-46, verify no OTHER live caller remains (audit all 28 workflows). If other callers exist, do NOT delete — only confirm WF-25 has re-pointed; record the finding. Depends on WF-25 + handlers having dropped their calls first. Invoke `build-workflow` for the delete/verify.

## BMX-P4-WF26 — WF-26 refine: drop welcome-back, inherit safety net (safety-net §6 decision #9)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 9
**Change type:** Structural (partial edit)
**Workflows:** WF-26
**n8n IDs:** `tKjwTYF6EER8ED3y`
**Depends on:** BMX-P3-WF25 (hard)
**Size:** S
**Estimated tokens:** ~22K
**Estimated effort:** ~45 min

Delete `Build Welcome Payload` + `Call WF-50 Welcome Back` nodes; rewire `Refresh Envelope Status` → `Call WF-02 Re-Route` directly, so a re-engaging opted_out user is re-classified through the WF-25 safety net (an abusive re-engagement is blocked without first being welcomed). Refine BEFORE activation (hard dep ordering vs BMX-P4-ACTIVATE). Hard dep on WF-25 safety net being live. Invoke `build-workflow`.

## BMX-P4-WF45 — WF-45 status-regression state guard (TD-BMX-01, safety-net §2)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 9
**Change type:** Structural
**Workflows:** WF-45
**Depends on:** BMX-P1-PSEUDO (hard)
**Size:** M
**Estimated tokens:** ~35K
**Estimated effort:** ~1.5 hr

Add a state-classifier guard at the head of WF-45 (before any UPDATE), branching by computed state: pre-form/no-record → polite "let's get you set up" + Flow CTA (no UPDATE); payment_submitted → "payment under review, please wait" (no UPDATE); consultation_active → "you're in an active consult, ask Chinmay to close first" (no UPDATE); else (payment_pending / consultation_closed / opted_out-re-entry / unknown) → existing happy-path UPDATE → payment_pending + payment instructions. **Pre-form branch is now defensive-only** (dead — BMX-06 preempts pre-form/new REBOOK upstream via WF-23/WF-21); 3 live branches remain. Independent of the safety net (only depends on pseudo). Copy subject to user review at build. Invoke `build-workflow`.

## BMX-P4-ACTIVATE — Activate WF-26 + smoke-test opted-out re-engagement (TD-BMX-04)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 9
**Change type:** Operational
**Workflows:** WF-26
**n8n IDs:** `tKjwTYF6EER8ED3y`
**Depends on:** BMX-P4-WF26 (hard)
**Size:** S
**Estimated tokens:** ~20K
**Estimated effort:** ~30 min

Toggle WF-26 `active=true` (confirmed `active=false` in live 2026-05-29; registry "🟢 Active" is drift — correct registry too). Then real-phone smoke-test the opted_out re-engagement chain: opted_out phone sends "Hi" → WF-01 opted_out branch → WF-26 (refined, no welcome-back) → Call WF-02 re-route → WF-25 safety-net classification → contextual reply; `users.status` opted_out → consultation_closed; WF-26 execution history shows success. Activate LAST (hard dep on WF-26 refine). Reset test phone to opted_out for re-runs.

## BMX-P5-DRIFT — pseudo↔md drift-check + regenerate AS-IS .md (safety-net §8.2 Phase 5)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 10
**Change type:** Operational (doc)
**Workflows:** —
**Depends on:** BMX-P4-ACTIVATE (hard), BMX-P4-WF45 (hard)
**Size:** S
**Estimated tokens:** ~25K
**Estimated effort:** ~45 min

Run `pseudo-md-drift-check` for all changed workflows; regenerate AS-IS `.md` from live via `generate-workflow-md`. Confirms the live n8n state matches the revised `.pseudo` design after all builds land. Depends on all Phase 2–4 builds being complete (Phase-4 leaves used as proxy hard deps).

## BMX-P5-MATRIX — TD-BMX-07 behavior-matrix re-verification (exit gate)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 10
**Change type:** Verification
**Workflows:** —
**Depends on:** BMX-P5-DRIFT (hard)
**Size:** M
**Estimated tokens:** ~40K
**Estimated effort:** ~1 hr

Sprint exit gate. Walk the affected behavior-matrix cells (S1×E/F, S2×D/E, S4×D, S5×D, S7×G, S8×A–I, S10×E) using the existing `docs/artefacts/reviews/behavior-matrix-2026-05-27/index.html` as the test plan; confirm each moves to ✅ Working. **Update S8×G expectation** — opted_out+media now re-engages via WF-26 (NOT zero-outbound; the original TD-BMX-02 silent-reject expectation is obsolete per DR-4). Update the matrix HTML to post-fix state. Use `smoke-test` for execution + `monitor-test-run` for live observation. **Gate:** sprint cannot complete until all re-verified cells show ✅ and the HTML is updated.

## TD-BMX-02 — Reorder WF-01 security layers (Country → Blacklist → Non-Text) [as written]

**Status:** ⚪ obsolete
**Priority:** P0 | **Batch:** —
**Obsolete at:** 2026-05-29T07:53:18Z
**Obsolete reason:** SUPERSEDED by the BMX-06 redesign. WF-01 is fully rebuilt in BMX-06 §5 (Country → blocked? → opted_out? → route; non-text removed from WF-01), so the connection-rewire described here is moot. Opted_out+media (S8×G) now re-engages via WF-26 by design (DR-4; user re-initiated = STOP-compliant) — the "opted_out → zero outbound" expectation is itself obsolete. The intended behavior (blocked+media silent ✓) is delivered by **BMX-P2-WF01**.
**Workflows:** WF-01
**Depends on:** —

Recorded for traceability only — not executed. See tasks.md RECONCILIATION banner + the ⚠️ SUPERSEDED note on the TD-BMX-02 block.

## TD-BMX-03 — WF-20 HELP ternary null/pendingUser arms [as written]

**Status:** ⚪ obsolete
**Priority:** P1 | **Batch:** —
**Obsolete at:** 2026-05-29T07:53:18Z
**Obsolete reason:** SUPERSEDED by the BMX-06 redesign. New + pre-form users are routed away from WF-20 entirely (new → WF-21, pre-form → WF-23), so the proposed `user==null` arms in WF-20 are unreachable. Pre-form/new HELP is handled by the U3 `HELP` bucket in **BMX-P2-WF21 / BMX-P2-WF23**; existing-user HELP arms are already live (TD-027); the NULL-status default in WF-20 stays as the safety net (auto-covers S10×E).
**Workflows:** WF-20
**Depends on:** —

Recorded for traceability only — not executed. See tasks.md RECONCILIATION banner + the ⚠️ SUPERSEDED note on the TD-BMX-03 block.
