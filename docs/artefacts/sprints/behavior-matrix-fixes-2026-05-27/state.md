# Sprint: behavior-matrix-fixes-2026-05-27

**Input source:** docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/tasks.md
**Input hash:** 5e7e3db0999e1128ce39970bc1075716120bb3cf87f7067616220f7653ff7f54
**Planned at:** 2026-05-29T07:53:18Z
**Last updated:** 2026-05-30T14:04:00Z
**Planning complete:** true

**Reconciled scope:** Planned against the tasks.md RECONCILIATION banner (2026-05-29), NOT the original 7 TD-BMX item blocks. The redesign is defined across two companion specs — `docs/artefacts/specs/2026-05-29-bmx-06-new-contact-flow-design.md` (new + pre-form) and `docs/artefacts/specs/2026-05-29-existing-user-safety-net-design.md` (existing + opted_out + BMX-05). The original TD-BMX-01..07 items are decomposed into the build units of the cross-spec **Phase 0→5 build sequence** (safety-net spec §8.2). User confirmed phase-mapped granularity (19 build units) on 2026-05-29.

**Discover-current-state:** targeted live check ran 2026-05-29T07:5xZ (specs carry fresh full AS-IS verification dated today). Confirmed: WF-26 `active=false` (TD-BMX-04 activation real; registry "🟢 Active" is drift); WF-53/61/62 free (U1/U2/U3 are genuine new builds); `chinmay_astro.silent_drop` table and `chinmay_astro.users.block_reason` column both absent (Phase 0 DB migrations real); WF-25 ID `eTV1lUcYrXBg2q2T` confirmed for full-replace. No items found already-resolved.

**Dependency conflicts found:** — none. The phasing is internally consistent; cross-item edges are hard build dependencies (DB+U1/U2/U3 before any caller · WF-25 before its handlers · WF-26-refine before WF-26-activate · pseudo-first before any n8n edit), not priority inversions.

**Priority adjustments confirmed:** TD-BMX-05 (WF-20 STOP-alias additions) was originally P1, now folded into the P0 existing-user safety-net redesign and co-located in its Phase-3 batch (spec decision #6). Treated as P0 for batching so no priority tiers are mixed within a batch. Matrix re-verification (TD-BMX-07, originally 🟢 EXIT) recorded as P0 (blocking exit gate) for lint-format compliance; it remains the sprint exit gate. **Batching is phase-driven, not priority-flattened**, per the explicit SEQUENCING directive in tasks.md — build-sprint must follow batch order 1→18 (see the Remediation-extension note below for Batches 11–18).

**Excluded from execution:** Per tasks.md "Items intentionally excluded": U3 (pending_users leak on STOP pre-form — planned daily-maintenance WF post-go-live), U4 (form re-submit overwrites DOB — impossible per Meta; matrix → N/A), U5 (media during consultation_active — post-go-live build), U6 (stale Payment Completed tap — won't-fix), U7 (generic HELP menu in NULL-status — auto-covered). Not picked up by this sprint. Additionally, the as-written **TD-BMX-02** and **TD-BMX-03** task blocks are marked ⚪ obsolete below (their target behavior is delivered by the BMX-06 / safety-net rebuilds, not by the original edits).

**Remediation extension (Batches 11–18, RE-PLANNED 2026-05-30):** Batch 10 was the Phase-5 pseudo↔md drift-check (BMX-P5-DRIFT). **History:** an initial Batches 11–17 plan was written off the *Sonnet* drift report, which was then proven unreliable (falsely cleared WF-30, missed WF-34, understated the WF-25 mis-key). The drift axis was **re-audited with Opus + ground-truthed against live** (report §1), and a focused **missing-axes Opus sweep** (T1–T11 tech-mechanism / data-contract + P1–P5 pseudo-convention; drift/caller-contract excluded as already-locked) appended **37 findings** to report §2.6. The whole Batches 11–17 plan was then **discarded and re-planned** against the trustworthy findings, grouped by workflow, with operator-confirmed scope decisions D1–D5. Disposition table: report §2.7.

**Scope decided 2026-05-30 (operator-confirmed):** This sprint fixes the Section-1 confirmed findings + the in-scope subset of the 37 sweep findings + carried sprint-close items + the behavior-matrix exit gate. **Deferred to post-MVP** (not in this sprint): the silent-swallow send/alert class → **TD-NEW-035**; six "record-must-exist" zero-row cases + WF-45 re-SELECT/SQL → **FU-7-DEFERRED**; the `admin_actions` DROP TABLE → **TD-NEW-026** (the WF-11 INSERT removal itself lands here). All *pseudo* findings from the sweep are fixed this sprint (operator directive: live↔pseudo must match at go-live).

**Batches 11–18 are grouped by workflow** (each live workflow touched once, all its in-scope findings folded into one item): **11** = classifier callers WF-30/31/43 (mis-key HIGH + ride-alongs); **12** = classifier hub WF-25 (entry-guard + retry/timeout + pseudo) — runs after 11; **13** = payment lifecycle WF-34/33/32; **14** = onboarding WF-22; **15** = admin + opt-out WF-11/47; **16** = pseudo-only doc sync (WF-00/01/10/23/41/42); **17** = BMX-P5-MATRIX exit gate (last among functional work); **18** = CLAUDE.md/registry Flow-ID fix + plugin-improvement flush.

**SEQUENCING directive (binding on build-sprint):** execute strictly in ascending batch-number order 11→12→…→18. Per-item `**Priority:**` labels are informational only and MUST NOT trigger any global "all-P0-before-P1" reordering — batches mix priorities by design (group-by-workflow). In particular: (a) **Batch 12 (WF-25) carries a HARD dependency on Batch 11 (WF-30/31/43)** — the entry-guard must not be built until all three callers emit the corrected contract, AND the guard's required-field set IS that same contract (restated inline in the WF-25 item — build-sprint must enforce *exactly* it, not an assumed shape). (b) **BMX-P5-MATRIX (P0, Batch 17)** is intentionally sequenced AFTER the fix batches so it re-verifies the post-remediation final state; it must NOT be pulled ahead despite its P0 label. This mirrors the original tasks.md directive that kept Batches 1→10 in phase order rather than priority order.

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
| BMX-P4-WF26 | ✅ done | 9 | P0 | WF-26 | BMX-P3-WF25 (hard) |
| BMX-P4-WF45 | ✅ done | 9 | P0 | WF-45 | BMX-P1-PSEUDO (hard) |
| BMX-P4-ACTIVATE | ✅ done | 9 | P0 | WF-26 | BMX-P4-WF26 (hard) |
| BMX-P5-DRIFT | ✅ done | 10 | P0 | — | BMX-P4-ACTIVATE (hard), BMX-P4-WF45 (hard) |
| BMX-R11-WF30 | ✅ done | 11 | P0 | WF-30 | — |
| BMX-R11-WF31 | ✅ done | 11 | P0 | WF-31 | — |
| BMX-R11-WF43 | ✅ done | 11 | P0 | WF-43 | — |
| BMX-R12-WF25 | ✅ done | 12 | P0 | WF-25 | BMX-R11-WF30, BMX-R11-WF31, BMX-R11-WF43 (hard) |
| BMX-R13-WF34 | ✅ done | 13 | P1 | WF-34 | — |
| BMX-R13-WF33 | ✅ done | 13 | P1 | WF-33 | — |
| BMX-R13-WF32 | ✅ done | 13 | P2 | WF-32 | — |
| BMX-R14-WF22 | ✅ done | 14 | P1 | WF-22 | — |
| BMX-R15-WF11 | ⬜ pending | 15 | P1 | WF-11 | — |
| BMX-R15-WF47 | ⬜ pending | 15 | P1 | WF-47 | — |
| BMX-R16-PSEUDO | ⬜ pending | 16 | P2 | WF-00, WF-01, WF-10, WF-23, WF-41, WF-42 (pseudo) | — |
| BMX-P5-MATRIX | ⬜ pending | 17 | P0 | — | BMX-R11-WF30, BMX-R11-WF31, BMX-R11-WF43, BMX-R12-WF25, BMX-R13-WF34, BMX-R13-WF33 (hard) |
| BMX-P8-DOCS | ⬜ pending | 18 | P2 | — | — |
| BMX-P8-PLUGIN | ⬜ pending | 18 | P2 | — | — |
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
- **Execution plan (recorded 2026-05-30T00:44:23Z by build-sprint Step 2a):** Order WF-26 → WF-45 → ACTIVATE (WF-26-refine-before-activate mandated). No Mode-D (all production-affecting requiring judgment; WF-45 carries a copy decision point). (1) **BMX-P4-WF26 — Mode A** full build-workflow inline: structural node-delete (2) + edge rewire on critical opted_out re-engagement path; connection-target rewiring care (WF-02 rename-target lesson). (2) **BMX-P4-WF45 — Mode A** full build-workflow inline: multi-node state-guard insertion + IF-chain reshape; copy subject to user review → surface as needs-decision at build. (3) **BMX-P4-ACTIVATE — Mode B / Operational**: simple `active=true` toggle + registry drift correction; real-phone smoke test coordinates with Batch-10 BMX-P5-MATRIX (consistent with all prior builds' "live end-to-end deferred to Batch 10 smoke" — users table empty, no test phone wired).
- **Post-batch regression (2026-05-30T02:41Z — PASS):** Dependency map rebuilt — **79→78 edges** (WF-26→WF-50 dropped by the refine; WF-45's 3 new Call WF-50 nodes dedupe to the pre-existing WF-45→WF-50 edge → net -1). Touched-workflow edges match design exactly: WF-26 = parent {WF-01}, child {WF-02} (WF-50 gone); WF-45 = parents {WF-43, WF-20} (WF-44 correctly absent — retired its WF-45 call in Batch 8), child {WF-50}. **All touched IDs unchanged → no caller repoint.** Sibling analysis: WF-26's "lift opted_out + re-route" pattern is unique (no sibling to regress); WF-45's change is self-contained/additive — the only shared dependency is WF-50, whose contract WF-45 emits canonically (unchanged), and structural siblings (WF-21/23 Code-classifier→IF-chain, WF-25 Switch) are unaffected. Postgres sibling sanity on WF-45's own nodes: `Load User Record` SELECT has `=` prefix + aod=true + snake_case columns (id/name/phone_number/status all in live `chinmay_astro.users`); `Set status=payment_pending` UPDATE aod=true (keeper). Whole-`workflows/` lint **exit 0** — zero hard rejects across all 31 (161 advisory: Step-5g FP on internal `throw new Error('WF-XX…')` exception strings + pre-existing Contract-First upstream-not-Set). **No strict findings.** Adjacent (not blocking, covered by existing initiatives — not separately logged): `Build Setup Message` Code upstream of `Call WF-50 (Setup)` is a Contract-First advisory, consistent with the project-wide interactive-payload-via-Code pattern (WF-21/23/45) under the multi-sprint Contract-First initiative; keeper `Send Payment Instructions` missing `cachedResultName` (UI-cosmetic). Real-phone opted_out smoke (S8) deferred to Batch-10 BMX-P5-MATRIX exit gate.

## Batch 10 — Phase 5 · Verify (pseudo↔md drift-check + AS-IS .md regen)

- **Items:** 1
- **Description:** pseudo↔md drift-check + regenerate AS-IS `.md` from live for all 31 workflows once every Phase 2–4 build had landed — confirm live matches the revised `.pseudo` and surface any residual drift / data-contract / pseudo-convention findings. Deliverable: `BMX-P5-DRIFT-report.md`. (The behavior-matrix re-verification exit gate is tracked separately as BMX-P5-MATRIX in Batch 16, so it runs against the post-remediation final state.)
- **Estimated size:** S
- **Estimated tokens:** ~25K
- **Completed at:** 2026-05-30 — see BMX-P5-DRIFT item block.

## Batch 11 — Classifier callers · WF-30 / WF-31 / WF-43 (HIGH)

- **Items:** 3
- **Description:** The three free-form-text handlers that pass a broken payload to the WF-25 intent classifier (Section-1 mis-key, live-confirmed). Each maps key `messageText` (absent from the WF-01/WF-02 envelope) plus `userId`/`userStatus` read from non-existent top-level fields → WF-25 classifies an empty message with no identity for every free-form message in payment_pending (WF-30), payment_submitted (WF-31), consultation_closed (WF-43). Uniform 3-field fix across all three (drop `messageText` → add `messageContent`; `userId`←`user.id`; `userStatus`←`user.status` — matches the working WF-40 template). Per-workflow ride-alongs: WF-31 also gets payment-lookup SQL parameterization + under-review-copy pseudo-sync + Branch-A/B pseudo cleanup; all three get the trigger v1→v1.1 passthrough bump. Three different workflows → no same-workflow race. **Must complete before Batch 12 (WF-25 entry-guard) and before Batch 17 (matrix re-walk).**
- **Estimated size:** S
- **Estimated tokens:** ~40K
- **Execution plan (recorded 2026-05-30 by build-sprint Step 2a):** Mode C — Batch Surgical (build-workflow Step 5d). The Call-WF-25 mapping fix + trigger v1→v1.1 passthrough bump are byte-identical across all three; WF-31 adds surgical ride-alongs (SQL param) + doc-only pseudo edits. jq-on-disk + curl PUT per workflow (one lint pass each). Three different workflows → siblings may apply in any order; none Mode-D-eligible (non-parametric data-contract change to WF-25 + pseudo-sync judgment).
- **Committed:** Batch 11 pushed to GitHub `main` @ `d4e3c3a` (2026-05-30) — 3 workflow JSONs + WF-30/31 pseudo + registry + dependency-map + state/followups + handoff. Batch concluded; Batch 12 (BMX-R12-WF25) to be picked up in a fresh session.
- **Post-batch regression (2026-05-30T12:33Z — PASS):** Dependency map rebuilt (78 edges). WF-25 caller set = {WF-30, WF-31, WF-40, WF-43} (WF-44 correctly absent — Batch 8 stripped its WF-25 call). The one un-touched sibling, **WF-40 (reference template), already correct** — trigger v1.1 passthrough + mapping reads `user.id`/`user.status`/`messageContent` (verified pre-fix). Postgres sibling sweep across all workflows: **zero** non-parameterized `user_id = {{` interpolations remain (WF-31 was the only one, now `$1`); **zero** SELECT nodes missing `alwaysOutputData`. No strict findings. **Adjacent (logged followups.md, accepted-pending-review):** WF-30/31/43 now read the envelope via relative `$json.*` while WF-40 uses absolute `$('When Executed…').item.json.*`; both resolve identically given verified topology (Call WF-25 fed by trigger directly in WF-30/31, by pass-through IF in WF-43) — read-source convention divergence, not a defect. Live end-to-end deferred to Batch 17 matrix re-walk.
- **Ground-truth (2026-05-30, pre-mutation):** WF-01 `Classify & Build Envelope` Code node IS the §2.1 envelope source — emits top-level `phoneNumber`, `messageContent`, and `user.{id,name,status,slack_channel_id,...}`; **NO `messageText`, NO top-level `userId`/`userStatus`.** WF-02 Route Switch passes the raw envelope to the handlers (no contract-emit Set). Confirms the mis-key (old mapping read 3 undefined fields) AND that the planned NEW mapping (read `messageContent`/`user.id`/`user.status`) is correct. Step 2a pseudo obligation: WF-25.pseudo line 6 already declares the canonical contract (end-state locked Batch 3) → this is implementation-to-match. WF-43.pseudo already correct (Step 8 uses `user.id`/`user.status`, no legacy fields) → no sync. WF-30/31.pseudo are stale (document the broken `messageContent: messageText` mapping + false "plus messageText/userId/userStatus" Inputs claim) → synced this batch.

## Batch 12 — Classifier hub · WF-25 (HIGH)

- **Items:** 1
- **Description:** WF-25 (shared intent classifier + safety-net hub, called by Batch-11's three handlers + WF-40). Add a strict entry-guard first node that hard-fails on a malformed envelope (replacing the silent `||`-fallback degradation that masked the mis-key) + add retry/timeout to the classifier AI call (T8) + structured Inputs pseudo block (P1). **HARD dep on Batch 11** — the guard's required-field set IS the exact contract Batch-11's callers now emit (restated inline in the item); build LAST so the new hard-fail never sees a bad caller. Apply via jq+PUT on the SAME ID `eTV1lUcYrXBg2q2T` (5 callers reference it by ID).
- **Estimated size:** M
- **Estimated tokens:** ~32K
- **Execution plan:** 1 item → Step 2a skipped; Mode A (full build-workflow inline), jq-on-disk + curl PUT (Structural: node-add + connection rewire + 2 node edits). Recorded 2026-05-30T13:27Z.
- **Resume-integrity note (intermittent-issue check, user-flagged):** last session's Batch-12 attempt landed NO live changes — live WF-25 verified byte-identical to the committed Batch-8 export (versionId `4c2df2dc`, 19 nodes, no `Validate Inputs` node, `Classify Intent` retry null) before any mutation. The `eTV1lUcYrXBg2q2T-2026-05-30-09-17.json` backup file holds STALE 05-27 content (internal updatedAt `2026-05-27T04:07:31Z`, 22 old pre-Batch-7 nodes) — a stale/cached read returned by the backup-fetch at that point; it never reached live (live updatedAt stayed yesterday until this session's PUT). Fresh pre-mutation backup re-verified against live versionId before transform.
- **Committed:** Batch 12 pushed to GitHub `main` @ `0c67e1b` (2026-05-30) — WF-25 JSON + WF-25.pseudo + registry + dependency-map + state/followups. Batch concluded; Batch 13 (BMX-R13-WF34/WF33/WF32, payment lifecycle) to be picked up next per the ascending-batch sequencing directive.
- **Post-batch regression (2026-05-30T13:35Z — PASS):** Dependency map rebuilt — WF-25 external edges UNCHANGED (callers {WF-30, WF-31, WF-40, WF-43}; callees {WF-53(U1), WF-50, WF-61(U2)}); the guard + retry are internal, no topology change → no caller repoint, ID unchanged. **Consumer-contract acceptance** against all 4 callers: each emits the exact 6-field envelope the guard enforces (`defineBelow` mappings, live-confirmed) → no legitimate caller hard-fails. **Sibling parity (T8):** all 6 classifier-family Gemini HTTP nodes (WF-21/23/30/31/43 + U3/WF-62) now carry identical `retry=true, maxTries=3, timeout=10000` — WF-25 `Classify Intent` matches exactly; uniform across the family. WF-25 has 0 Postgres nodes → PG sibling sanity-checks N/A. Whole-`workflows/` lint exit 0 — **zero hard rejects** across all 31; 162 advisory (was 161 at Batch 9, +1). **No strict findings.** Adjacent (FP, not blocking): the new `Validate Inputs` guard's `input.userStatus === null` comparison matched the Step-5g `userStatus\s*=\s*\S+` assignment-detection regex (a comparison operator misread as an internal-field assignment in delivered copy) — the jsCode is internal validation logic, never delivered to a human channel; same accepted-FP class as Batch 9's `throw new Error('WF-XX…')` strings. Pre-existing advisory `Build U1 Payload` `context.source:'WF-25'` (Batch-7 internal routing metadata) unchanged. Live end-to-end exercise of the guard deferred to Batch 17 matrix re-walk.

## Batch 13 — Payment lifecycle · WF-34 / WF-33 / WF-32

- **Committed:** Batch 13 pushed to GitHub `main` @ `0a0c41f` (2026-05-31) — 3 workflow JSONs (WF-32/33/34) + WF-33.pseudo + registry + dependency-map + state/followups + handoff (`handoff-batch13-complete-resume-batch14.md`, written before the commit). Batch concluded; Batch 14 (BMX-R14-WF22) to be picked up next per the ascending-batch sequencing directive.
- **Items:** 3
- **Description:** The payment approval/rejection/confirmation family. WF-34: fix the double-nested WF-50 payload so the rejection message to the user actually sends (Section-1 HIGH). WF-33: restore the richer admin activation notice (DOB/TOB/Place + CLOSE-CHAT reminder per pseudo Step 9, via a minimal SELECT) + convert 3 param-lists to array form (T9) + pseudo status='verified' & command/subCommand Inputs (Section-1 pseudo-lag). WF-32: convert the payment-insert param-list to array form (T9). Mixed priority by design (group-by-workflow) — build-sprint follows batch order, not priority.
- **Estimated size:** M
- **Estimated tokens:** ~55K
- **Post-batch regression (2026-05-30T14:04Z — PASS):** Dependency map rebuilt — **78 edges, unchanged from Batch 12** (all 3 edits were intra-node: jsCode + queryReplacement; zero topology change → no caller repoint, all IDs unchanged). **WF-34 bug-class sibling sweep:** scanned every live Code node across all 31 workflows for the double-nested `[{json:{json:…}}]` return signature → **zero other instances** (WF-34 was the sole occurrence; every other WF-50 caller already single-nested). **T9 landscape sweep:** only remaining non-array comma-joined `queryReplacement` is WF-22 `Save Slack Channel ID` — exactly the scheduled Batch-14 item, not a regression. **Whole-`workflows/` lint exit 0 — zero hard rejects** across all 31; **162 advisory, unchanged from Batch 12** → Batch 13 introduced no new findings (WF-33 richer-notice copy is clean business-tone: no WF-XX/DB-jargon; the listed Step-5g hits are all pre-existing internal `throw new Error('WF-…')` validation strings + `context.source:'WF-…'` routing metadata — the accepted-FP class from Batch 9/12). All 4 WF-33 Postgres nodes op=executeQuery+aod=true. **No strict findings. No new adjacent findings.** (The WF-33 read-from-RETURNING-* node-placement choice is documented in its build note, not a defect.) Live payment-family end-to-end (APPROVE/REJECT) deferred to Batch-17 matrix re-walk (users table empty).
- **Execution plan (recorded 2026-05-30T13:51:20Z by build-sprint Step 2a):** 3 items, mixed change types (WF-33 Structural) → assess ran. No same-workflow siblings (3 distinct WFs); no Mode-D (all production payment-path, judgment required per [[feedback_sprint_parallelism]]). Order WF-34 → WF-33 → WF-32 (HIGH bug-fix first; any order safe). (1) **BMX-R13-WF34 — Mode A** full build-workflow inline: surgical rejection-payload un-nest; must read exact current `Prepare Rejection Message` return + precise wrapper removal on the payment-reject path. (2) **BMX-R13-WF33 — Mode A** full build-workflow inline: Structural — minimal SELECT node add + placement judgment + richer-notice copy + 3 param-list→array (T9) + pseudo sync. (3) **BMX-R13-WF32 — Mode B** inline-inherit: XS deterministic single `queryReplacement` array-form swap (same T9 shape already applied in WF-31 family); full backup/change/lint/state discipline, no Skill reload.

## Batch 14 — Onboarding · WF-22

- **Items:** 1
- **Description:** WF-22 form-response handler. Extract `email_address` from the Flow response so the existing INSERT binding stops writing NULL (Section-1) + convert the Save-Slack-Channel param-list to array form (T9) + bump the `Create User Record` Postgres node typeVersion to the workflow floor (T11). NOTE: the WF-22 create-failure-swallow HIGH (T3) is deferred to TD-NEW-035, not in this item.
- **Estimated size:** S
- **Estimated tokens:** ~22K

## Batch 15 — Admin + opt-out · WF-11 / WF-47

- **Items:** 2
- **Description:** WF-11 command parser: remove the deprecated `admin_actions` INSERT from the UNBLOCK path (TD-NEW-026 WF-11 step — leaves zero live writers; state+audit already captured in users/messages) and the now-pointless re-SELECT, reading id/name from the envelope; parameterize the remaining UNBLOCK UPDATE (T5); add alwaysOutputData to the LIST query so a quiet system still gets the "nothing pending" reply (T2 — designed-empty case); align Postgres typeVersion (T11); trigger-first pseudo numbering (P3). WF-47 unsubscribe: add alwaysOutputData to the opt-out UPDATE so a pre-onboarding STOP still acknowledges (T2 — pseudo-mandated) + sync the (kept-live) opt-out copy into pseudo. Two different workflows.
- **Estimated size:** M
- **Estimated tokens:** ~42K

## Batch 16 — Pseudo-only doc sync · WF-00 / WF-01 / WF-10 / WF-23 / WF-41 / WF-42

- **Items:** 1
- **Description:** Pure `.pseudo` documentation edits — NO live workflow changes. Brings the design docs of six workflows (not otherwise touched this sprint) into convention + copy parity with live, per the operator directive that live↔pseudo match at go-live: WF-00 enumerate Inputs (P1); WF-01 structured Inputs block (Section-1 #7); WF-10 renumber lettered Step 23a (P3); WF-23 'Dr. Chinmay'→'Dr. Chinmay Mujumdar' (P5); WF-41 remove dated History bullets (P4); WF-42 move design rules under ## Notes (P4). One batch item (six pseudo files, no live race). Run pseudo-md-drift-check after; no `.md` regen needed (no live change).
- **Estimated size:** S
- **Estimated tokens:** ~28K

## Batch 17 — Behavior-matrix re-verification (sprint exit gate)

- **Items:** 1
- **Description:** BMX-P5-MATRIX — the TD-BMX-07 behavior-matrix exit gate, sequenced LAST among functional work so it re-walks the affected cells against the fully-remediated live state (after the Batch-11/12 classifier-contract fixes and the Batch-13 payment fixes, which directly change S-cell behavior). Walk S1×E/F, S2×D/E, S4×D, S5×D, S7×G, S8×A–I, S10×E; update S8×G expectation (opted_out+media re-engages via WF-26, not zero-outbound); run the deferred real-phone opted_out smoke. Sprint cannot complete until all re-verified cells show ✅ and the matrix HTML is updated.
- **Estimated size:** M
- **Estimated tokens:** ~40K

## Batch 18 — Sprint close (docs + plugin flush)

- **Items:** 2
- **Description:** BMX-P8-DOCS = correct the CLAUDE.md "Key Credential IDs" WhatsApp Flow ID (`1408011897720771` → live `2260297164474475`; the 14xx ID is dead in Meta per operator 2026-05-30) + the stale duplicate in the workflow-registry legacy table. BMX-P8-PLUGIN = run `flush-plugin-improvements` over all carried notes in `followups.md` (handoff commit-agnostic phrasing; plan-sprint greenfield-pseudo-in-build-batch; consumer-contract acceptance gate; Step-6a connection-target scan; Set-node no-optional-chaining rule; contract-emit-Set-reads-`$('NamedNode')`-not-`$json`; terminal-Return-reads-canonical-upstream; sub-agent audit fan-out pattern; fast-enumeration drift-check mode; **plan-sprint hard-deps-carry-solution-contract**) — applies by priority, bumps CHANGELOG, commits, syncs the active cache. Last batch of the sprint.
- **Estimated size:** M
- **Estimated tokens:** ~40K

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

**Status:** ✅ done
**Started:** 2026-05-30T00:44:23Z
**Completed:** 2026-05-30T00:53:05Z
**Actual tokens:** ~25K
**Actual effort:** ~9 min
**Estimate delta:** on-bucket (planned S ~22K, actual ~25K)
**Priority:** P0 | **Batch:** 9

**Build outcome (2026-05-30T00:53:05Z):** jq-on-disk transform (Mode A, Step 5e), same ID `tKjwTYF6EER8ED3y`, 7→5 nodes, active=false (activation deferred to BMX-P4-ACTIVATE). **Removed** `Build Welcome Payload` (Set v3.4) + `Call WF-50 Welcome Back` (exec v1.2); **rewired** `Refresh Envelope Status`.main[0] from the parallel fan-out [Build Welcome, Call WF-02] down to [Call WF-02 Re-Route] only. Linear chain now Trigger→Validate Inputs→Update User Status→Refresh Envelope Status→Call WF-02 Re-Route — matches WF-26.pseudo Steps 1-4 exactly (no separate welcome-back; re-engagement runs the full WF-43→WF-25 safety net). `Refresh Envelope Status` left untouched (Set v3.4, reconstructs the full 13-field §2.1 envelope explicitly with `user.status='consultation_closed'` → WF-02 receives complete envelope despite includeOtherFields:false). **Impact analysis:** single parent WF-01 (routes to WF-26, does not consume return — no upstream break); children WF-50 (retired) + WF-02 (kept, contract preserved — node + upstream Set untouched); no siblings (pattern unique). **Verification:** pre-PUT dangling scan 0 refs to both removed names; post-PUT dangling re-scan 0 refs; lint hook exit 0; MCP strict-validate `valid:true`, 0 errors, 7 warnings (all FP/floor/tech-deferred — Validate Inputs Code-heuristic FPs; Update User Status pg-2.5 + Call WF-02 exec-1.2 typeVersion-floor advisories on untouched keepers; DB/error-handling advisories deferred to tech-error sprint). **Adjacent (carried, not fixed — out of scope):** `Call WF-02 Re-Route` keeper lacks `cachedResultName` (advisory, UI-cosmetic only, pre-existing — not introduced by this change). Backup: `archive/backups/tKjwTYF6EER8ED3y-2026-05-30-10-48.json`. Live end-to-end opted-out re-engagement deferred to BMX-P4-ACTIVATE + Batch-10 smoke.
**Change type:** Structural (partial edit)
**Workflows:** WF-26
**n8n IDs:** `tKjwTYF6EER8ED3y`
**Depends on:** BMX-P3-WF25 (hard)
**Size:** S
**Estimated tokens:** ~22K
**Estimated effort:** ~45 min

Delete `Build Welcome Payload` + `Call WF-50 Welcome Back` nodes; rewire `Refresh Envelope Status` → `Call WF-02 Re-Route` directly, so a re-engaging opted_out user is re-classified through the WF-25 safety net (an abusive re-engagement is blocked without first being welcomed). Refine BEFORE activation (hard dep ordering vs BMX-P4-ACTIVATE). Hard dep on WF-25 safety net being live. Invoke `build-workflow`.

## BMX-P4-WF45 — WF-45 status-regression state guard (TD-BMX-01, safety-net §2)

**Status:** ✅ done
**Started:** 2026-05-30T00:53:05Z
**Completed:** 2026-05-30T02:06:17Z
**Actual tokens:** ~55K
**Actual effort:** ~30 min (active; incl. copy decision round-trip)
**Estimate delta:** +1 bucket (planned M ~35K, actual ~55K — copy sign-off round-trip + 8-node author via Python script + per-node strict probe)
**Decision made (copy verbatim sign-off, 2026-05-30T02:0xZ):** User approved: (1) **happy-path = pseudo wording** (state-neutral "Your birth details are already on file…" + ₹500 UPI button, button id `payment_completed` title "Payment Completed") over the live "previous consultation is complete" copy — chosen because the happy path now fires for payment_pending/consultation_closed/re-entry, not just completed consultations; (2) **3 new guard messages approved as drafted** (under-review / active-consult / no-record-setup, all business-tone). Pseudo Steps 4-6 updated with the approved verbatim copy in the same batch (pseudocode-first sync).
**Priority:** P0 | **Batch:** 9

**Build outcome (2026-05-30T02:06:17Z):** jq-on-disk (Python build script, Mode A, Step 5e), same ID `MUG7rPgSHc7UtAE9`, 5→13 nodes, active=true. **5 keepers preserved by name:** trigger (v1, untouched), `Load User Record` (SELECT widened: added `status` column; aod=true, op=executeQuery — unchanged otherwise), `Set status=payment_pending` (UPDATE keeper, repositioned), `Prepare WF-50 Payload (Rebook Payment)` (Code — **copy updated to approved pseudo wording**, repositioned), `Send Payment Instructions` (WF-50 call keeper, repositioned). **8 new nodes:** `Classify Rebook State` (Code v2 — reads Load User Record output + trigger phoneNumber; routeClass ∈ {setup,under_review,active,happy}; no-row→setup, payment_submitted→under_review, consultation_active→active, else→happy) → `Route by State` (Switch v3, 4 rule outputs setup/under_review/active/happy) → setup: `Build Setup Message` (Code, interactive Flow form, flowId 2260297164474475 reused from WF-21) → `Call WF-50 (Setup)`; under_review: `Build Under-Review Message` (Set v3.4 contract-emit text) → `Call WF-50 (Under Review)`; active: `Build Active Message` (Set v3.4 contract-emit text) → `Call WF-50 (Active)`; happy (output 3) → existing keeper chain Set status=payment_pending → Prepare WF-50 Payload → Send Payment Instructions. All 3 new `Call WF-50` exec v1.2 canonical (defineBelow+value:{}, cachedResultName "WF-50 Send WhatsApp", onError=continueRegularOutput fire-and-forget). **typeVersion floor:** new types not in live WF-45 (Set, Switch) set to project floor — Set v3.4 (44/44 project), Switch v3 (WF-25 floor, NOT auto-bumped to 3.4); Code v2 / exec v1.2 match live. **Verification:** lint hook exit 0; MCP strict-validate `valid:true`, 0 errors, 17 warnings (all FP/floor/tech-deferred: typeVersion-floor advisories ×8 on keepers+new-at-floor; Code named-ref "doesn't reference input"/"can throw" FPs; **Route by State main[1]-as-error-output FP** [main[1] is the under_review rule output, not an error port]; DB-without-error-handling on keeper Postgres → tech-error sprint); Step 6b per-node strict probe on modified Postgres (`Load User Record`, valid:true — only the accepted `{{ }}`-interpolation SQL-injection advisory) + new exec node (valid:true, 0 warnings) → **no operation-default trap**; no nodes removed/renamed → Step 6a skipped. **Pseudo updated** (WF-45.pseudo Steps 4-6, approved verbatim copy) in same batch per pseudocode-first sync. **Adjacent (carried, not fixed — out of scope):** keeper `Send Payment Instructions` lacks `cachedResultName` (advisory, UI-cosmetic, pre-existing — the 3 new exec nodes DO carry it). Backup: `archive/backups/MUG7rPgSHc7UtAE9-2026-05-30-11-01.json`. Live end-to-end (each branch + Gemini-free) deferred to Batch-10 smoke (users table empty; happy-path is the only production-exercised branch pre-go-live).
**Change type:** Structural
**Workflows:** WF-45
**Depends on:** BMX-P1-PSEUDO (hard)
**Size:** M
**Estimated tokens:** ~35K
**Estimated effort:** ~1.5 hr

Add a state-classifier guard at the head of WF-45 (before any UPDATE), branching by computed state: pre-form/no-record → polite "let's get you set up" + Flow CTA (no UPDATE); payment_submitted → "payment under review, please wait" (no UPDATE); consultation_active → "you're in an active consult, ask Chinmay to close first" (no UPDATE); else (payment_pending / consultation_closed / opted_out-re-entry / unknown) → existing happy-path UPDATE → payment_pending + payment instructions. **Pre-form branch is now defensive-only** (dead — BMX-06 preempts pre-form/new REBOOK upstream via WF-23/WF-21); 3 live branches remain. Independent of the safety net (only depends on pseudo). Copy subject to user review at build. Invoke `build-workflow`.

## BMX-P4-ACTIVATE — Activate WF-26 + smoke-test opted-out re-engagement (TD-BMX-04)

**Status:** ✅ done
**Started:** 2026-05-30T02:06:17Z
**Completed:** 2026-05-30T02:41:16Z
**Actual tokens:** ~12K
**Actual effort:** ~6 min
**Estimate delta:** on-bucket (planned S ~20K, actual ~12K)
**Priority:** P0 | **Batch:** 9

**Build outcome (2026-05-30T02:41:16Z):** WF-26 (`tKjwTYF6EER8ED3y`) activated via n8n `POST /workflows/{id}/activate` → HTTP 200, `active=true`; fresh GET re-confirmed `active=true` (5 nodes). Resolves the TD-BMX-04 drift (live was `active=false` while registry said "🟢 Active"). Registry corrected to 🟢 Active with the activation provenance. Workflow JSON re-exported (active flag). **Structural readiness verified** (substitute for live smoke this session): WF-01 `Route Opted-Out to WF-26` edge intact (WF-26 reachable from the opted_out branch); WF-26 chain linear & orphan-free (Trigger→Validate Inputs→Update User Status→Refresh Envelope Status→Call WF-02 Re-Route) → WF-02 → WF-43 → WF-25 safety net. **Live real-phone smoke DEFERRED to Batch-10 BMX-P5-MATRIX (S8 cells)** — no test phone wired + users table empty this session, identical deferral to every Phase-2/3 build in this sprint (WF-01/21/23/25/handlers all deferred live end-to-end to Batch-10 smoke). BMX-P5-MATRIX is the sprint exit gate and explicitly walks S8 (opted_out re-engagement) via `smoke-test` + `monitor-test-run`; the opted_out re-engagement test (opted_out phone sends "Hi" → WF-01 opted_out branch → WF-26 → WF-02 re-route → WF-25 classification → contextual reply; `users.status` opted_out→consultation_closed) runs there with a real phone. Reset test phone to opted_out before that run.
**Change type:** Operational
**Workflows:** WF-26
**n8n IDs:** `tKjwTYF6EER8ED3y`
**Depends on:** BMX-P4-WF26 (hard)
**Size:** S
**Estimated tokens:** ~20K
**Estimated effort:** ~30 min

Toggle WF-26 `active=true` (confirmed `active=false` in live 2026-05-29; registry "🟢 Active" is drift — correct registry too). Then real-phone smoke-test the opted_out re-engagement chain: opted_out phone sends "Hi" → WF-01 opted_out branch → WF-26 (refined, no welcome-back) → Call WF-02 re-route → WF-25 safety-net classification → contextual reply; `users.status` opted_out → consultation_closed; WF-26 execution history shows success. Activate LAST (hard dep on WF-26 refine). Reset test phone to opted_out for re-runs.

## BMX-P5-DRIFT — pseudo↔md drift-check + regenerate AS-IS .md (safety-net §8.2 Phase 5)

**Status:** ✅ done
**Started:** 2026-05-30
**Completed:** 2026-05-30
**Priority:** P0 | **Batch:** 10
**Change type:** Operational (doc) + audit
**Workflows:** — (audit covered all 31)
**Depends on:** BMX-P4-ACTIVATE (hard), BMX-P4-WF45 (hard)
**Size:** S
**Estimated tokens:** ~25K
**Estimated effort:** ~45 min

Run `pseudo-md-drift-check` for all changed workflows; regenerate AS-IS `.md` from live via `generate-workflow-md`. Confirms the live n8n state matches the revised `.pseudo` design after all builds land. Depends on all Phase 2–4 builds being complete (Phase-4 leaves used as proxy hard deps).

**Build outcome (2026-05-30):** Executed as a user-directed read-only audit (scratch-only generation; no live/.md/.pseudo modified during the audit). Fresh `.md` generated from freshly-downloaded live JSON (31 wf) vs fresh Git `.pseudo` (31), split into **sprint-group (17)** + **existing-group (14)**, audited by 11 parallel read-only Sonnet sub-agents (all ≤219s under the 300s cap). Covered drift, data-contract compliance, and pseudo-convention consistency. Deliverable: `BMX-P5-DRIFT-report.md` (PARTs A–E incl. live-verification verdicts). Fresh `.md` for all 31 checked into `docs/pseudocode/` (the regen deliverable); `workflows/*.json` left untouched (0 functional diffs vs live — phantom-diff avoidance); `.pseudo` untouched (read-only audit). **Confirmed HIGH (sprint-group, deferred to a follow-up fix session):** WF-31 + WF-43 pass `messageText` (absent from the WF-02 envelope) to `Call WF-25` which classifies `messageContent` → both misclassify free-form text; root cause is WF-25's missing entry-guard. **False positive withdrawn:** empty `defineBelow value:{}` mappings (standard passthrough). **Existing-group HIGH (out of BMX scope):** WF-33 `verified`/`approved`, WF-22 `email_address` NULL, WF-11 BLOCK-reason/SQL. Fixes + BMX-P5-MATRIX handed to a fresh session (see `handoffs/handoff-batch-10-drift-audit.md`).

## BMX-P5-MATRIX — TD-BMX-07 behavior-matrix re-verification (exit gate)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 17
**Change type:** Verification
**Workflows:** —
**Depends on:** BMX-R11-WF30 (hard), BMX-R11-WF31 (hard), BMX-R11-WF43 (hard), BMX-R12-WF25 (hard), BMX-R13-WF34 (hard), BMX-R13-WF33 (hard)
**Size:** M
**Estimated tokens:** ~40K
**Estimated effort:** ~1 hr

Sprint exit gate. **Sequenced to Batch 17 — last among functional work — so it re-walks the matrix against the fully-remediated live state** (all Batch 11–15 fixes landed). The hard deps are the classifier-contract fixes (WF-43/WF-31 mis-key + WF-25 entry-guard) that directly change S-cell behavior for `payment_submitted`/`consultation_closed`; re-walking those cells before the fix would test buggy behavior (BMX-P5-DRIFT PART E + batch-10 handoff). Walk the affected cells (S1×E/F, S2×D/E, S4×D, S5×D, S7×G, S8×A–I, S10×E) using the existing `docs/artefacts/reviews/behavior-matrix-2026-05-27/index.html` as the test plan; confirm each moves to ✅ Working. **Update S8×G expectation** — opted_out+media now re-engages via WF-26 (NOT zero-outbound; the original TD-BMX-02 silent-reject expectation is obsolete per DR-4). Update the matrix HTML to post-fix state. Use `smoke-test` for execution + `monitor-test-run` for live observation. Includes the deferred real-phone opted_out re-engagement smoke (reset a test phone to opted_out first). **Gate:** sprint cannot complete until all re-verified cells show ✅ and the HTML is updated.

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

## BMX-R11-WF30 — WF-30 fix WF-25 caller payload + trigger version

**Status:** ✅ done
**Started:** 2026-05-30T12:27:58Z
**Completed:** 2026-05-30T12:31:15Z
**Actual tokens:** ~14K
**Actual effort:** ~3 min
**Estimate delta:** on-bucket (planned XS ~12K, actual ~14K)
**Verification:** mapping fixed (messageContent + user.id/user.status, messageText dropped); trigger v1→1.1 passthrough live-confirmed; lint exit 0; validate runtime valid:true errorCount:0 (warnings all pre-existing tv-floor/cachedResultName). Pseudo synced (Inputs + Step 1 + Step 2 mapping). No nodes removed → 6a skipped; no operation-default node → 6b clear.
**Priority:** P0 | **Batch:** 11
**Change type:** Surgical
**Workflows:** WF-30
**n8n IDs:** `gGJBY5fJha0Let8I`
**Depends on:** —
**Size:** XS
**Estimated tokens:** ~12K
**Estimated effort:** ~20 min

Free-form messages from payment_pending users reach WF-25 with an empty message + no identity (Section-1 mis-key, live-confirmed). Two exact edits:

1. **`Call WF-25 Intent Classifier`** node, `workflowInputs.value`:
   - CURRENT: `{"phoneNumber":"={{ $json.phoneNumber }}","userId":"={{ $json.userId }}","messageText":"={{ $json.messageText }}","userStatus":"={{ $json.userStatus }}","userName":"={{ ($json.user || {}).name }}","slackChannelId":"={{ ($json.user || {}).slack_channel_id }}"}`
   - NEW: `{"phoneNumber":"={{ $json.phoneNumber }}","userId":"={{ ($json.user || {}).id }}","messageContent":"={{ $json.messageContent }}","userStatus":"={{ ($json.user || {}).status }}","userName":"={{ ($json.user || {}).name }}","slackChannelId":"={{ ($json.user || {}).slack_channel_id }}"}`
   - (3 changes: `userId` value→`($json.user||{}).id`; `messageText` key→`messageContent` + value→`$json.messageContent`; `userStatus` value→`($json.user||{}).status`. Reference = working WF-40 mapping.)
2. **`When Executed by Another Workflow`** trigger: typeVersion `1` (params `{}`) → `1.1` with `{"inputSource":"passthrough"}` (T11).

Sync WF-30.pseudo only if it references the old keys (live is truth). Invoke `build-workflow`. **Must complete before BMX-R12-WF25.**

## BMX-R11-WF31 — WF-31 fix WF-25 caller payload + payment-lookup SQL + copy/pseudo + trigger

**Status:** ✅ done
**Started:** 2026-05-30T12:27:58Z
**Completed:** 2026-05-30T12:32:39Z
**Actual tokens:** ~22K
**Actual effort:** ~5 min
**Estimate delta:** on-bucket (planned S ~24K, actual ~22K)
**Verification:** (1) mapping fix live-confirmed (messageContent + user.id/user.status, messageText dropped); (2) Load Latest Payment parameterized → `WHERE user_id = $1` + `queryReplacement: ={{ [$('When Executed...').item.json.user.id] }}`, operation=executeQuery explicit, aod:true preserved, no `{{ }}` left in query so no `=` prefix needed; (3) under-review copy KEPT live (bold + blank lines), pseudo Step 8 synced verbatim; (4) trigger v1→1.1 passthrough; (5) pseudo P3 — standalone (Branch A/B) labels removed → inline [Branch] tags, steps linear 1–11; Inputs + Step 1 + Step 3 mapping synced. lint exit 0; validate runtime valid:true errorCount:0. No nodes removed → 6a skipped; Postgres operation explicit → 6b clear.
**Priority:** P0 | **Batch:** 11
**Change type:** Surgical
**Workflows:** WF-31
**n8n IDs:** `HB8nXudAtk9iXz7C`
**Depends on:** —
**Size:** S
**Estimated tokens:** ~24K
**Estimated effort:** ~40 min

Free-form messages from payment_submitted users hit the same empty-message mis-key. Edits:

1. **`Call WF-25 Intent Classifier`** `workflowInputs.value` — identical CURRENT→NEW as BMX-R11-WF30 (the mapping is byte-identical across all three callers).
2. **`Load Latest Payment`** (T5, parameterize SQL):
   - CURRENT: `"query":"=SELECT created_at FROM chinmay_astro.payments WHERE user_id = {{ $('When Executed by Another Workflow').item.json.user.id }} ORDER BY id DESC LIMIT 1","options":{}`
   - NEW: `"query":"SELECT created_at FROM chinmay_astro.payments WHERE user_id = $1 ORDER BY id DESC LIMIT 1","options":{"queryReplacement":"={{ [$('When Executed by Another Workflow').item.json.user.id] }}"}`
3. **Under-review copy** (Section-1 #8) — KEEP the live wording (bold + blank lines); no live change. Sync WF-31.pseudo Step 8 to match the live copy.
4. **Trigger** v1→v1.1 passthrough (T11).
5. **Pseudo P3** — remove the embedded `(Branch A/B …)` labels; renumber linearly.

Invoke `build-workflow`. **Must complete before BMX-R12-WF25.**

## BMX-R11-WF43 — WF-43 fix WF-25 caller payload + trigger version

**Status:** ✅ done
**Started:** 2026-05-30T12:27:58Z
**Completed:** 2026-05-30T12:31:15Z
**Actual tokens:** ~10K
**Actual effort:** ~3 min
**Estimate delta:** on-bucket (planned XS ~12K, actual ~10K)
**Verification:** identical mapping fix + trigger v1→1.1 passthrough live-confirmed; lint exit 0; validate runtime valid:true errorCount:0. Pseudo already correct (Step 8 used `user.id`/`user.status`, Inputs had no legacy fields) → no sync needed, matching plan. Call WF-25 fed by pass-through `Is Button Reply?` IF → `$json` envelope resolves. No nodes removed → 6a skipped.
**Priority:** P0 | **Batch:** 11
**Change type:** Surgical
**Workflows:** WF-43
**n8n IDs:** `3va0M06kijgyLejf`
**Depends on:** —
**Size:** XS
**Estimated tokens:** ~12K
**Estimated effort:** ~20 min

Free-form messages from consultation_closed users hit the same empty-message mis-key. Edits:

1. **`Call WF-25 Intent Classifier`** `workflowInputs.value` — identical CURRENT→NEW as BMX-R11-WF30.
2. **`When Executed by Another Workflow`** trigger v1→v1.1 passthrough (T11).

Sync WF-43.pseudo if needed. Invoke `build-workflow`. **Must complete before BMX-R12-WF25.**

## BMX-R12-WF25 — WF-25 entry-guard (contract-locked) + classifier retry/timeout + pseudo

**Status:** ✅ done
**Started:** 2026-05-30T13:27:18Z
**Completed:** 2026-05-30T13:35:46Z
**Actual tokens:** ~38K
**Actual effort:** ~9 min
**Estimate delta:** on-bucket (planned M ~32K, actual ~38K)
**Priority:** P0 | **Batch:** 12
**Change type:** Structural (critical hub)

**Build outcome (2026-05-30T13:35:46Z):** WF-25 (`eTV1lUcYrXBg2q2T`) hardened via jq-on-disk + curl PUT (19→20 nodes, same ID, new versionId `48cd9c7f`). **Resume integrity:** live pre-state verified byte-identical to committed Batch-8 export (versionId `4c2df2dc`, 19 nodes) — last session's Batch-12 attempt landed NO changes (the `…09-17.json` backup held stale 05-27 content from a stale-read at the backup step, but no PUT reached live; user confirmed no changes started). (1) **Entry-guard** — added `Validate Inputs` Code v2 as new first node (trigger→Validate Inputs→Prepare Intent Request); hard-fails on missing/empty `phoneNumber`/`userId`/`messageContent`/`userStatus`, returns `[{json:input}]` on pass. **Consumer-contract acceptance** verified live against ALL 4 callers (WF-30/31/40/43): each emits `{phoneNumber, userId(=user.id), messageContent, userStatus(=user.status), userName, slackChannelId}` via `mappingMode:defineBelow` → every required guard field present in every caller → no legitimate caller hard-fails. Removed the silent `||`-fallback in `Prepare Intent Request` (`userStatus = input.userStatus || input.user?.status || 'unknown'` → `userStatus = input.userStatus`) — dropped the undeclared nested-intake path. (2) **Classifier reliability (T8)** — `Classify Intent` retryOnFail=true, maxTries=3, options.timeout=10000ms. (3) **Pseudo P1** — WF-25.pseudo: added structured `## Inputs` Field|Type|Required|Source table + entry-guard step (renumbered Steps 1→12 linearly, GOTOs updated); retry/timeout kept OUT of pseudo per [[feedback_pseudo_tech_separation]]. Pre-flight lint-debt scan clean (no rollers); typeVersion floor held (Code v2; pre/post tv-array diff identical); lint hook exit 0; MCP strict-validate `valid:true`, 0 errors, 25 warnings (all pre-existing/floor/intentional — incl. the by-design "Code nodes can throw errors" on the new guard). Backup `archive/backups/eTV1lUcYrXBg2q2T-2026-05-30-23-31.json` (verified matching live before mutate). Registry updated.
**Workflows:** WF-25
**n8n IDs:** `eTV1lUcYrXBg2q2T`
**Depends on:** BMX-R11-WF30 (hard), BMX-R11-WF31 (hard), BMX-R11-WF43 (hard)
**Size:** M
**Estimated tokens:** ~32K
**Estimated effort:** ~1 hr

**HARD dep on Batch 11 — do not start until all three callers are `done`.** The guard below enforces the EXACT contract those callers now emit (this is the locked WF-25 input contract; build-sprint must require precisely these fields, not an assumed shape):

| Field | Type | Required | Source (caller emits) |
|-------|------|----------|-----------------------|
| `phoneNumber` | string non-empty | yes | `$json.phoneNumber` |
| `userId` | present | yes | `($json.user\|\|{}).id` |
| `messageContent` | string | yes | `$json.messageContent` |
| `userStatus` | present | yes | `($json.user\|\|{}).status` |
| `userName` | string | no | `($json.user\|\|{}).name` |
| `slackChannelId` | string | no | `($json.user\|\|{}).slack_channel_id` |

Edits:

1. **Entry-guard** — add a `Validate Inputs` Code node as the first node that throws on any missing/empty REQUIRED field above (hard-fail), replacing the silent `||`-fallback degradation in `Prepare Intent Request`. **Remove the `input.user?.status` nested fallback** (an undeclared intake path not in the contract).
2. **Classifier reliability (T8)** — on `Classify Intent` (httpRequest v4.2; CURRENT `"onError":"continueErrorOutput"`, `options:{}`) add `retryOnFail:true`, `maxTries:3`, and `options.timeout:10000` (match the sibling Gemini node `Generate Service Answer` in WF-21/23).
3. **Pseudo P1** — rewrite WF-25's Inputs as the structured Field|Type|Required|Source table above + add the entry-guard line.

Apply via jq+PUT on the SAME ID `eTV1lUcYrXBg2q2T` (5 callers reference it by ID — never mint a new ID); verify with re-fetch ([[feedback_n8n_mcp_nested_array_update]]). Build LAST so the new hard-fail never sees a bad caller. Run consumer-contract acceptance against all callers (WF-30/31/43/40). Invoke `build-workflow`.

## BMX-R13-WF34 — WF-34 fix double-nested rejection payload (rejection message never sends)

**Status:** ✅ done
**Started:** 2026-05-30T13:51:20Z
**Completed:** 2026-05-30T13:55:11Z
**Actual tokens:** ~18K
**Actual effort:** ~4 min
**Estimate delta:** on-bucket (planned S ~18K, actual ~18K)
**Priority:** P1 | **Batch:** 13
**Build note:** Surgical/parametric. Live `Prepare Rejection Message` returned double-nested `[{json:{json:{...}}}]` → WF-50 passthrough guard read `$json.phoneNumber`=undefined (silent drop). Removed inner `json:` wrapper. WF-34.pseudo Step 5 already documented the correct single-level shape → implementation-to-match-design, no pseudo change. 8 nodes unchanged. Lint exit 0. Backup `se82n3MUQ9xE5aEr-2026-05-30-23-53.json`; versionId `4fb0c4f9`. Live end-to-end (admin REJECT) deferred to Batch-17 matrix re-walk (users table empty).
**Change type:** Surgical (bug fix)
**Workflows:** WF-34
**n8n IDs:** `se82n3MUQ9xE5aEr`
**Depends on:** —
**Size:** S
**Estimated tokens:** ~18K
**Estimated effort:** ~30 min

When the admin REJECTs a payment, the user's rejection/retry WhatsApp message never sends (Section-1 HIGH, live-confirmed). `Prepare Rejection Message` returns a **double-nested** shape `[{ json: { json: { phoneNumber, messageType, interactivePayload } } }]`; `Call WF-50` uses empty-`defineBelow` passthrough, so WF-50's guard reads `$json.phoneNumber` = undefined. Fix = remove the extra wrapper so the node returns single-nested `[{ json: { phoneNumber, messageType, interactivePayload } }]` (matching every other WF-50 caller). build-workflow reads the exact current `Prepare Rejection Message` return at build to apply the precise edit; sync WF-34.pseudo if it documents the nested shape. Invoke `build-workflow`. (The WF-34 no-pending-payment zero-row case (T2) is deferred to FU-7-DEFERRED — not in this item.)

## BMX-R13-WF33 — WF-33 richer admin activation notice + param-lists + pseudo-lag

**Status:** ✅ done
**Started:** 2026-05-30T13:55:11Z
**Completed:** 2026-05-30T14:01:02Z
**Actual tokens:** ~34K
**Actual effort:** ~6 min
**Estimate delta:** on-bucket (planned M ~32K, actual ~34K)
**Priority:** P1 | **Batch:** 13
**Build note — node-placement deviation (within build-workflow delegated scope):** Plan said "add a minimal SELECT for DOB/TOB/Place; build-workflow decides exact node placement." Live audit found those 3 out-of-core fields (`date_of_birth`/`time_of_birth`/`place_of_birth`, confirmed in `chinmay_astro.users`) are already returned by the existing `Update User Status` node (pseudo Step 4 `UPDATE … users … RETURNING *`), which sits upstream of `Prepare WF-51 Payload (Notify Admin)` on the linear path. **So NO new SELECT node was added** — the richer-notice Code reads them from `$('Update User Status')`. Smaller blast radius, no extra DB round-trip, fully consistent with the pseudo design (Step 4 RETURNING * is the source). (1) Richer admin notice restored per pseudo Step 9 (one-liner → full "Consultation Activated" with DOB/TOB/Place + `CLOSE CHAT CONSULT <phone>` reminder; missing→"N/A"). (2) T9: 3 queryReplacements (`Update Payment Status`/`Create Consultation Record`/`Update User Consultation Id`) → JS-array form, no live behavior change. (3) Pseudo synced: Step 3 `approved`→`verified`, Inputs/Step 1 document `command`/`subCommand`, Step 9 annotated with DOB/TOB/Place read-source. 10 nodes unchanged. Lint exit 0; 4 PG nodes op=executeQuery+aod=true. Backup `NcHZedq9ycnAQ9SW-2026-05-30-23-58.json`; versionId `30d61e11`. Live APPROVE end-to-end deferred to Batch-17 matrix re-walk.
**Change type:** Structural
**Workflows:** WF-33
**n8n IDs:** `NcHZedq9ycnAQ9SW`
**Depends on:** —
**Size:** M
**Estimated tokens:** ~32K
**Estimated effort:** ~1 hr

Three changes:

1. **Richer admin activation notice (D2 — decided: restore).** `Prepare WF-51 Payload` currently posts a one-liner ("Payment approved… consultation is now active"). Restore the richer notice per pseudo Step 9: include the user's DOB / time-of-birth / place-of-birth and an explicit `CLOSE CHAT CONSULT <phone>` operator reminder. DOB/TOB/Place are out-of-core → add a **minimal SELECT** for just those three fields (preferred over an envelope extension); build-workflow decides exact node placement.
2. **Param-lists → array form (T9)** — three writes (no comma-bearing values today, so no live risk; correct-pattern hygiene):
   - `Create Consultation Record`: CURRENT `={{ $("When Executed by Another Workflow").item.json.user.id }}, {{ $("Update Payment Status").item.json.id }}` → NEW `={{ [$("When Executed by Another Workflow").item.json.user.id, $("Update Payment Status").item.json.id] }}`
   - `Update Payment Status`: CURRENT `={{ $("Extract Command Data").item.json.adminUserId }}, {{ $("When Executed by Another Workflow").item.json.user.id }}` → NEW `={{ [$("Extract Command Data").item.json.adminUserId, $("When Executed by Another Workflow").item.json.user.id] }}`
   - `Update User Consultation Id`: CURRENT `={{ $('Create Consultation Record').item.json.id }}, {{ $('Create Consultation Record').item.json.user_id }}` → NEW `={{ [$('Create Consultation Record').item.json.id, $('Create Consultation Record').item.json.user_id] }}`
3. **Pseudo-lag (Section-1)** — update WF-33.pseudo Step 3 to `status='verified'` (live is correct; pseudo's `'approved'` is stale — no consumer queries `'approved'`, confirmed) + document the real `command`/`subCommand` Inputs contract (pseudo declares only `commandType`).

Invoke `build-workflow`. (The second-APPROVE zero-row case (T2) is deferred to FU-7-DEFERRED.)

## BMX-R13-WF32 — WF-32 payment-insert param-list → array form

**Status:** ✅ done
**Started:** 2026-05-30T14:01:02Z
**Completed:** 2026-05-30T14:02:57Z
**Actual tokens:** ~11K
**Actual effort:** ~2 min
**Estimate delta:** on-bucket (planned XS ~12K, actual ~11K)
**Priority:** P2 | **Batch:** 13
**Build note:** Mode B inline-inherit. Surgical/parametric — `Create Payment Record` `queryReplacement` comma-joined → JS-array form `={{ [$json.user.id, 500, "INR", "pending_verification", "gpay"] }}`; sibling `largeNumbersOutput:"text"` preserved. No comma-bearing values today → no live behavior change; no pseudo change. op=executeQuery, aod=true. Lint exit 0. Backup `emUOLWVZiNVxcOe3-2026-05-31-00-01.json`; versionId `3b8d0b27`.
**Change type:** Surgical
**Workflows:** WF-32
**n8n IDs:** `emUOLWVZiNVxcOe3`
**Depends on:** —
**Size:** XS
**Estimated tokens:** ~12K
**Estimated effort:** ~20 min

`Create Payment Record` passes its five `$1..$5` values as one comma-joined string. No value can contain a comma today (id / int / enums) → no live risk; correct-pattern hygiene. One edit:
- CURRENT: `"queryReplacement":"={{ $json.user.id }}, {{ 500 }}, {{ \"INR\" }}, {{ \"pending_verification\" }}, {{ \"gpay\" }}"` (preserve the sibling `"largeNumbersOutput":"text"` option)
- NEW: `"queryReplacement":"={{ [$json.user.id, 500, \"INR\", \"pending_verification\", \"gpay\"] }}"`

Invoke `build-workflow`.

## BMX-R14-WF22 — WF-22 extract email_address + param-list + typeVersion

**Status:** ✅ done
**Priority:** P1 | **Batch:** 14
**Change type:** Surgical / parametric (missing-field parse + param-list array form + typeVersion bump — no control-flow / data-contract / interface change)
**Workflows:** WF-22
**n8n IDs:** `dr8QM0m92Ml8MvIh`
**Depends on:** —
**Size:** S
**Estimated tokens:** ~20K
**Estimated effort:** ~40 min
**Started:** 2026-05-30T14:14:00Z
**Completed:** 2026-05-30T14:20:02Z
**Actual tokens:** ~40K
**Actual effort:** ~25 min
**Estimate delta:** +1 bucket (planned S ~20K, actual ~40K = M-band) — overage driven by the email-field reality-check: live executions (2026-05-24) predate the v2 email field, so confirming against `.pseudo` Step 2 + form definition + INSERT binding before parsing took an extra investigation pass (correctly, per audit-vs-reality discipline). New versionId `ae7133fa-4163-4b3b-90f4-666dcb967998`. Backup `archive/backups/dr8QM0m92Ml8MvIh-2026-05-31-00-14.json`.

**Verification:** field key `email_address` confirmed in `workflows/flows/collect-personal-details.json`, `Create User Record` INSERT `$6` binding, and WF-22.pseudo Step 2. Forward-compatible — pre-v2 form submissions parse `undefined` → NULL (explicitly accepted by pseudo note; Flow v2 cutover is TD-PGF-01B Step 4, pending user publish). Step 6 lint exit 0; workflow validate `valid:true` 0 errors; Step 6b strict per-node validation on both Postgres nodes 0 errors/0 warnings; typeVersion diff clean (postgres `[2.4,2.6]`→`[2.6]`, no new version). Step 6a skipped (no nodes removed/renamed). The WF-22 create-failure-swallow HIGH (T3) remains deferred to TD-NEW-035 — not in this item.

Three changes:

1. **Email never saved (Section-1).** `Create User Record` INSERT already binds `$6 = email_address` and the queryReplacement array already includes `$json.email_address` — but `Extract Form Data` never parses `email_address` from the Flow `response_json`, so every submission stores NULL. Fix = parse `email_address` in `Extract Form Data` so the existing binding resolves. Verify against a live Form `response_json` shape before/after. (No INSERT change needed — the binding is already present.)
2. **`Save Slack Channel ID` param-list → array (T9):**
   - CURRENT: `"queryReplacement":"={{ $('Ensure Slack Channel Exists (WF-52)').item.json.channelId }}, {{ $now }}, {{ $('Create User Record').item.json.id }}"`
   - NEW: `"queryReplacement":"={{ [$('Ensure Slack Channel Exists (WF-52)').item.json.channelId, $now, $('Create User Record').item.json.id] }}"`
3. **typeVersion (T11)** — bump `Create User Record` Postgres node v2.4 → v2.6 (match `Save Slack Channel ID`); verify param compatibility.

Invoke `build-workflow`. **NOTE:** the WF-22 create-failure-swallow HIGH (T3) is deferred to TD-NEW-035 — not in this item.

## BMX-R15-WF11 — WF-11 drop admin_actions write + UNBLOCK SQL params + LIST empty-state + typeVersion + pseudo

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 15
**Change type:** Structural
**Workflows:** WF-11
**n8n IDs:** `GoTYo0GS2y8qjjkw`
**Depends on:** —
**Size:** M
**Estimated tokens:** ~30K
**Estimated effort:** ~1 hr

Five changes (no current functional break except the LIST empty-state):

1. **Drop the deprecated `admin_actions` write (TD-NEW-026 WF-11 step; collapses T1 + T5 on the UNBLOCK path).** The UNBLOCK `Unblock User` node runs `UPDATE users SET status='consultation_closed', updated_at=NOW()` **then** `INSERT INTO chinmay_astro.admin_actions (...)`. The state transition + audit are already captured by the UPDATE (`users.status`/`updated_at`) + the `messages` table (WF-10 logs every admin command), so the INSERT carries no information needing replacement. Delete the `INSERT INTO chinmay_astro.admin_actions ...` statement (keep only the UPDATE). Then drop the `Lookup Blocked User` re-SELECT node (it existed only to feed `id`/`name` into that INSERT) and read `id`/`name` from the WF-10 command-envelope `user` object in `Unblock User` / `Confirm User Unblocked`. [admin_actions table still exists in live and the INSERT works today — verified 2026-05-30; this removal leaves WF-11 as the table's last live writer. The `DROP TABLE` itself stays in TD-NEW-026.]
2. **Parameterize the remaining UNBLOCK UPDATE (T5).** Convert the string-interpolated `WHERE phone_number = '{{ ... }}'` to `$1` + `options.queryReplacement` array, matching the WF-01/WF-10 pattern.
3. **LIST empty-state (T2 — designed-empty, launch-relevant).** Add `alwaysOutputData:true` to `Get Active Users` so a zero-row result (quiet system) still emits one item and `Format List` runs its existing `users.length===0` → "No pending payments or active consultations." branch. (Today the admin gets silence.)
4. **typeVersion (T11)** — align the remaining UNBLOCK Postgres node(s) v2.5 → v2.6 (the floor present in WF-11).
5. **Pseudo P3** — renumber so the trigger is Step 1 and `Validate Inputs` is Step 2 (trigger-first).

Invoke `build-workflow`.

## BMX-R15-WF47 — WF-47 opt-out alwaysOutputData (pre-onboarding STOP ack) + copy pseudo-sync

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 15
**Change type:** Surgical
**Workflows:** WF-47
**n8n IDs:** `2U7mxHMyqA41ROKX`
**Depends on:** —
**Size:** XS
**Estimated tokens:** ~12K
**Estimated effort:** ~20 min

Two changes:

1. **Pre-onboarding STOP gets no acknowledgement (T2 — pseudo-mandated).** A brand-new contact who sends STOP before submitting the form has no `users` row, so the opt-out `UPDATE ... WHERE phone_number=$1` matches zero rows; without `alwaysOutputData`, the node emits nothing and the opt-out confirmation never sends. Add `alwaysOutputData:true` to `Update User Status to opted_out` so the empty result propagates and the regulatory opt-out confirmation still goes out (pseudo Step 3 mandates this; live drifted off it).
2. **Opt-out notice copy (Section-1 #9 — keep-live decision).** The admin opt-out Slack notice includes a `(phone: <number>)` fragment not in the locked pseudo copy. **Keep the live wording** (the phone is useful to the admin); no live change — sync WF-47.pseudo Step 4 to include the fragment.

Invoke `build-workflow`.

## BMX-R16-PSEUDO — pseudo-only convention + copy sync (WF-00/01/10/23/41/42)

**Status:** ⬜ pending
**Priority:** P2 | **Batch:** 16
**Change type:** Documentation (pseudo only)
**Workflows:** WF-00, WF-01, WF-10, WF-23, WF-41, WF-42
**Depends on:** —
**Size:** S
**Estimated tokens:** ~28K
**Estimated effort:** ~1 hr

Pure `.pseudo` edits — **NO live workflow changes** — bringing the design docs of six workflows (not otherwise touched this sprint) into convention + copy parity with live, per the operator directive that live↔pseudo match at go-live. One batch item; six files, no live race:

- **WF-00** (P1) — rewrite the `## Summary` Inputs bullet as an enumerated typed block (messageId, phoneNumber, phoneNumberFormatted, messageType, messageContent, interactiveLabel, contactName, rawMessage, timestamp, metadata; required vs optional).
- **WF-01** (Section-1 #7) — author a structured `## Inputs` block (required/optional + types) replacing the prose "…etc."
- **WF-10** (P3) — renumber the lettered Step 23a to a full linear step (or fold into Step 23).
- **WF-23** (P5) — change draft "Dr. Chinmay" → locked "Dr. Chinmay Mujumdar" (match live); remove the DRAFT caveat.
- **WF-41** (P4) — remove the dated `History:` bullet block (Git owns history).
- **WF-42** (P4) — move the DR-10 + SP-03 bullets under a `## Notes` header.

Run `pseudo-md-drift-check` after. No `.md` regeneration needed (no live change). `build-workflow` is NOT invoked (pseudo-only) — edit the `.pseudo` files directly.

## BMX-P8-DOCS — CLAUDE.md + registry WhatsApp Flow ID drift (carried sprint-close)

**Status:** ⬜ pending
**Priority:** P2 | **Batch:** 18
**Change type:** Documentation
**Workflows:** —
**Depends on:** —
**Size:** XS
**Estimated tokens:** ~10K
**Estimated effort:** ~15 min

Carried from Batches 5–10 (flagged repeatedly, deferred to sprint close). CLAUDE.md "Key Credential IDs" table lists WhatsApp Flow ID `1408011897720771`; the correct/active value (used by WF-21/23/45) is `2260297164474475`. **Operator-confirmed 2026-05-30: the `1408…` (14xx) ID is dead in Meta — the `2260…` (2xx) ID is the live/correct one; never reintroduce 14xx.** Correct the CLAUDE.md entry + the stale duplicate in the workflow-registry legacy table (~line 343). Doc-only; no live-value re-verification needed (operator-confirmed). No workflow change. Backing memory: [[project_whatsapp_flow_id]].

## BMX-P8-PLUGIN — Flush carried plugin improvements (sprint-close)

**Status:** ⬜ pending
**Priority:** P2 | **Batch:** 18
**Change type:** Plugin (methodology)
**Workflows:** —
**Depends on:** —
**Size:** M
**Estimated tokens:** ~30K
**Estimated effort:** ~1 hr

Run `flush-plugin-improvements` over all carried notes in `followups.md` (deferred per [[feedback_plugin_improvement_timing]] — flush at sprint boundary by priority, not mid-batch). Candidates: handoff commit-agnostic phrasing (low); plan-sprint greenfield-pseudo-in-build-batch (med); consumer-contract acceptance gate at build-workflow Step 6 + impact-analysis Step 3 (med); build-workflow Step-6a connection-target scan (med); Set-node no-optional-chaining rule (med); contract-emit Set downstream of exec must read `$('NamedNode')` not `$json` (med); terminal Return in send-then-return reads canonical upstream not `$input.first()` (med); sub-agent audit fan-out pattern + N≥5 completion-notification monitoring + Sonnet-justified-audit example for dispatching-subagents (med); fast-enumeration drift-check mode for pseudo-md-drift-check (low); **plan-sprint hard-deps must carry the depended-on item's solution contract, not just ordering (med)** — the 2026-05-30 entry, the gap surfaced by this very re-plan (WF-25 guard ↔ Batch-11 caller contract). The expression-as-shell-var hazard is a CLAUDE.md candidate (not plugin) — route accordingly. Applies each by priority, bumps CHANGELOG, commits, syncs the active cache. Last item of the sprint.
