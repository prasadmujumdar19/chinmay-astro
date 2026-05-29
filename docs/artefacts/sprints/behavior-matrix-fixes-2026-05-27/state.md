# Sprint: behavior-matrix-fixes-2026-05-27

**Input source:** docs/artefacts/sprints/behavior-matrix-fixes-2026-05-27/tasks.md
**Input hash:** 5e7e3db0999e1128ce39970bc1075716120bb3cf87f7067616220f7653ff7f54
**Planned at:** 2026-05-29T07:53:18Z
**Last updated:** 2026-05-29T08:55:00Z
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
| BMX-P0-U1 | 🔵 in-progress | 1 | P0 | WF-53 | — |
| BMX-P0-U2 | ⬜ pending | 1 | P0 | WF-61 | BMX-P0-DB (hard) |
| BMX-P0-U3 | ⬜ pending | 2 | P0 | WF-62 | BMX-P0-U1 (hard) |
| BMX-P1-PSEUDO | ⬜ pending | 3 | P0 | WF-01, WF-02, WF-20, WF-21, WF-23, WF-25, WF-26, WF-30, WF-31, WF-40, WF-43, WF-44, WF-45, WF-53, WF-61, WF-62 | — |
| BMX-P2-WF01 | ⬜ pending | 4 | P0 | WF-01 | BMX-P0-DB (hard), BMX-P1-PSEUDO (hard) |
| BMX-P2-WF02 | ⬜ pending | 4 | P0 | WF-02 | BMX-P0-U2 (hard), BMX-P1-PSEUDO (hard) |
| BMX-P2-WF21 | ⬜ pending | 5 | P0 | WF-21 | BMX-P0-U2 (hard), BMX-P0-U3 (hard), BMX-P1-PSEUDO (hard) |
| BMX-P2-WF23 | ⬜ pending | 6 | P0 | WF-23 | BMX-P0-U2 (hard), BMX-P0-U3 (hard), BMX-P1-PSEUDO (hard) |
| BMX-P3-WF25 | ⬜ pending | 7 | P0 | WF-25 | BMX-P0-U1 (hard), BMX-P0-U2 (hard), BMX-P1-PSEUDO (hard) |
| BMX-P3-HANDLERS | ⬜ pending | 8 | P0 | WF-30, WF-31, WF-40, WF-43 | BMX-P3-WF25 (hard), BMX-P0-U1 (hard) |
| BMX-P3-WF44 | ⬜ pending | 8 | P0 | WF-44 | BMX-P3-WF25 (soft) |
| BMX-P3-WF20 | ⬜ pending | 8 | P0 | WF-20 | BMX-P1-PSEUDO (hard) |
| BMX-P3-WF46 | ⬜ pending | 8 | P0 | WF-46 | BMX-P3-WF25 (hard), BMX-P3-HANDLERS (hard) |
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
- **Description:** Leaf dependencies — nothing else can run first. DB migrations (silent_drop table + block_reason column) and the two utilities that don't depend on U3. Within-batch order: DB → U2 (U2 writes both new objects); U1 standalone. All build/activate standalone (no callers yet).
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

## Batch 5 — Phase 2b · BMX-06 brand-new owner (WF-21)

- **Items:** 1
- **Description:** WF-21 rebuild — brand-new owner (no record). Wires U2/U3, alias preempts, 7-bucket classification. Split from WF-23 because the combined rebuild estimate exceeds the cap.
- **Estimated size:** L
- **Estimated tokens:** ~50K

## Batch 6 — Phase 2c · BMX-06 pre-form owner (WF-23)

- **Items:** 1
- **Description:** WF-23 rebuild — pre-form owner (has pending_users, no users row). Same U2/U3 + alias pattern as WF-21 (sibling pattern); built back-to-back with WF-21 for familiarity savings (~10%).
- **Estimated size:** L
- **Estimated tokens:** ~48K

## Batch 7 — Phase 3a · Safety-net hub (WF-25 full rebuild)

- **Items:** 1
- **Description:** WF-25 full-replace rebuild on the SAME ID (`eTV1lUcYrXBg2q2T`) — carry over surviving nodes verbatim, generate U1/U2 calls + unified block + clarifier consolidation + D4 relay-return, retire WF-46 from this path. Critical hub; built alone (XL) and BEFORE its handlers so they edit against final hub behavior.
- **Estimated size:** XL
- **Estimated tokens:** ~70K

## Batch 8 — Phase 3b · Thin handlers + aliases + WF-46 retirement

- **Items:** 4
- **Description:** WF-30/31/40/43 handler edits (delete inline Gemini-error → U1; remove in-handler clarifiers; WF-43 stop_intent → clarifier) + WF-44 (strip WF-25 call + rebook/stop IFs; rewire trigger → Save Feedback) + WF-20 STOP-aliases (TD-BMX-05) + WF-46 retirement (audit no other live caller, then delete). All structural edits applied against the live WF-25 hub from Batch 7. ~87K is slightly above target because the low-cost WF-46 retirement rides along to avoid a trivial standalone batch.
- **Estimated size:** M
- **Estimated tokens:** ~87K

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

Phase 0 foundation. (1) `CREATE TABLE chinmay_astro.silent_drop` (phone_number, message_type, reason, content, created_at) + index on (phone_number, created_at) — BMX-06 §132-144. (2) `ALTER TABLE chinmay_astro.users ADD COLUMN block_reason text;` — additive, nullable, no backfill (safety-net §334). Both confirmed absent in live (2026-05-29). U2 writes both → must exist before U2. Apply via the docker-exec psql write path (CLAUDE.md). Serves: foundation for BMX-06 + safety-net.

## BMX-P0-U1 — Build U1 Gemini Error Handler (WF-53)

**Status:** 🔵 in-progress
**Started:** 2026-05-29T08:31:00Z
**Priority:** P0 | **Batch:** 1
**Change type:** Workflow-create
**Workflows:** WF-53
**Depends on:** —
**Size:** S
**Estimated tokens:** ~25K
**Estimated effort:** ~45 min

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

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 1
**Change type:** Workflow-create
**Workflows:** WF-61
**Depends on:** BMX-P0-DB (hard)
**Size:** M
**Estimated tokens:** ~35K
**Estimated effort:** ~1 hr

New shared sub-workflow, proposed WF-61. Logic: INSERT silent_drop row → count 30-day rolling drops per phone → at threshold, upsert users SET status='blocked', block_reason='threshold_'||reason (stub row if none) + admin alert. BMX-06 §108-118. Hard dep on BMX-P0-DB (writes silent_drop + block_reason). Strict envelope; verify `{blocked}` return path. Invoke `build-workflow`.

## BMX-P0-U3 — Build U3 New-Contact Intent Classifier (WF-62)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 2
**Change type:** Workflow-create
**Workflows:** WF-62
**Depends on:** BMX-P0-U1 (hard)
**Size:** M
**Estimated tokens:** ~40K
**Estimated effort:** ~1.25 hr

New shared sub-workflow, proposed WF-62. Gemini classifier with `stage` param (new|pre_form) tuning prompt context; returns one of 7 buckets (greeting / wants_consultation / service_related_question / HELP / unrelated|low-confidence / garbage|stop_intent / malicious|abusive|inappropriate). Literal STOP/REBOOK never reach U3 (preempted upstream). Uses U1 on Gemini failure → hard dep on BMX-P0-U1. BMX-06 §121-129. U3 prompt copy is DRAFT (BMX-06 §11) — verify verbatim with user at build. Invoke `build-workflow`.

## BMX-P1-PSEUDO — Pseudo-first: rewrite all changed .pseudo + author U1/U2/U3 .pseudo

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 3
**Change type:** Documentation (pseudo)
**Workflows:** WF-01, WF-02, WF-20, WF-21, WF-23, WF-25, WF-26, WF-30, WF-31, WF-40, WF-43, WF-44, WF-45, WF-53, WF-61, WF-62
**Depends on:** —
**Size:** L
**Estimated tokens:** ~55K
**Estimated effort:** ~2–2.5 hr

Per safety-net §8.2 Phase 1 + pseudocode-first practice ([[feedback_pseudocode_first_refactor]]): rewrite `.pseudo` for all 13 changed workflows and author new `.pseudo` for U1/U2/U3, reconciled against BOTH specs, BEFORE any n8n edit. Pseudo is tech-agnostic business design — no n8n error-handling internals ([[feedback_pseudo_tech_separation]]); linear Step 1..N numbering, no tombstones ([[feedback_pseudo_linear_numbering]]). This item gates all of Phase 2–4 (do not start any n8n edit until the relevant pseudo is revised). Run pseudo↔md drift-check after authoring.

## BMX-P2-WF01 — Rebuild WF-01 identity & security gate (BMX-06 §5)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 4
**Change type:** Structural (critical path)
**Workflows:** WF-01
**Depends on:** BMX-P0-DB (hard), BMX-P1-PSEUDO (hard)
**Size:** L
**Estimated tokens:** ~50K
**Estimated effort:** ~1.5–2 hr

WF-01 rebuilt to: Country → blocked? → opted_out? → route. Applies D1 block-unify (single `blocked` status + `block_reason`, no `blacklisted`). Non-text handling removed from WF-01 (moves to WF-02/WF-21/WF-23). Critical path (entry) → built in its own small batch with WF-02. **Delivers the behavior that the as-written TD-BMX-02 targeted** (blocked+media → silent ✓; opted_out+media → re-engage via WF-26 by design, DR-4). Hard dep on block_reason column (D1). Invoke `build-workflow`; rebuild approach (author TO-BE from scratch) per BMX-06 §8a.

## BMX-P2-WF02 — WF-02 router edits + nfm_reply guard (BMX-06 §6 / decision #10)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 4
**Change type:** Structural (Code-node)
**Workflows:** WF-02
**n8n IDs:** Detect Route node `PubCsNTOspF3xqXZ`
**Depends on:** BMX-P0-U2 (hard), BMX-P1-PSEUDO (hard)
**Size:** M
**Estimated tokens:** ~30K
**Estimated effort:** ~1 hr

WF-02 (messageType + state router for anyone with a record): add the new non-text branch (⟦U2 thr=10⟧ → if !blocked: "email us") and the nfm_reply guard ternary on the `Detect Route` node (decision #10). Hard dep on U2 (non-text branch calls it). Invoke `build-workflow`.

## BMX-P2-WF21 — Rebuild WF-21 brand-new owner (BMX-06 §7)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 5
**Change type:** Structural (workflow rebuild)
**Workflows:** WF-21
**Depends on:** BMX-P0-U2 (hard), BMX-P0-U3 (hard), BMX-P1-PSEUDO (hard)
**Size:** L
**Estimated tokens:** ~50K
**Estimated effort:** ~1.5–2 hr

WF-21 rebuild (no record at all): step1 non-text → ⟦U2 thr=5⟧; step2 literal STOP/UNSUBSCRIBE/OPT OUT/OPT-OUT/REBOOK → silent drop + ⟦U2 thr=5⟧ (brand-new asymmetry, NO reply; aliases per decision #6); step3 text → ⟦U3 stage=new⟧ 7-bucket routing (welcome+form / Gemini answer / HELP / gentle redirect / silent / block+admin-alert). Gemini failure → ⟦U1⟧. **Delivers TD-BMX-06 (new-user) + part of TD-BMX-05.** Copy DRAFT (BMX-06 §11) — verify verbatim at build. Rebuild from scratch per §8a. Invoke `build-workflow`.

## BMX-P2-WF23 — Rebuild WF-23 pre-form owner (BMX-06 §8)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 6
**Change type:** Structural (workflow rebuild)
**Workflows:** WF-23
**Depends on:** BMX-P0-U2 (hard), BMX-P0-U3 (hard), BMX-P1-PSEUDO (hard)
**Size:** L
**Estimated tokens:** ~48K
**Estimated effort:** ~1.5–2 hr

WF-23 rebuild (has pending_users, no users row): same shape as WF-21 but pre-form clarifiers — STOP-aliases → "nothing to opt out of, complete the form"; REBOOK → "no prior booking, complete the form"; U3 stage=pre_form buckets re-send/Gemini+form/help+form/redirect+form/silent/block. **Delivers TD-BMX-06 (pre-form) + pre-form HELP (the behavior TD-BMX-03 targeted for S2×E) + part of TD-BMX-05.** Sibling pattern to WF-21. Rebuild from scratch per §8a. Invoke `build-workflow`.

## BMX-P3-WF25 — Rebuild WF-25 Intent Classifier + Safety-Net Hub (safety-net §5)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 7
**Change type:** Structural (full-replace rebuild, critical hub)
**Workflows:** WF-25
**n8n IDs:** `eTV1lUcYrXBg2q2T`
**Depends on:** BMX-P0-U1 (hard), BMX-P0-U2 (hard), BMX-P1-PSEUDO (hard)
**Size:** XL
**Estimated tokens:** ~70K
**Estimated effort:** ~3–4 hr

The central change. Author complete TO-BE node graph from scratch; carry over verbatim all workflow-level props + surviving nodes (Gemini classify HTTP node, parse Code node, Route switch); generate fresh nodes for U1/U2 calls + consultation_active D4 relay-return + clarifier consolidation; unify block on `blocked`+`block_reason`; **retire WF-46 from this path** (WF-25 stops calling it). **Apply via full-workflow replace on the SAME ID `eTV1lUcYrXBg2q2T`** — do NOT mint a new ID (4 callers WF-30/31/40/43 reference it by ID). Built BEFORE handlers so they edit against final hub behavior. Use jq+PUT for nested-array edits, verify with re-fetch ([[feedback_n8n_mcp_nested_array_update]]). Data-contract sanity on every U1/U2 call site ([[feedback_data_contract_discipline]]). Invoke `build-workflow`.

## BMX-P3-HANDLERS — Thin handler edits WF-30/31/40/43 (safety-net §6)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 8
**Change type:** Structural (partial edits)
**Workflows:** WF-30, WF-31, WF-40, WF-43
**Depends on:** BMX-P3-WF25 (hard), BMX-P0-U1 (hard)
**Size:** M
**Estimated tokens:** ~40K
**Estimated effort:** ~1.5 hr

Handlers become thin: delete inline Gemini-error chains → call U1; remove in-handler clarifiers (now centralized in WF-25); WF-43 stop_intent → clarifier. Partial edits (no full rebuild). Edited AFTER WF-25 (hard dep) so they target the final hub behavior. Per-workflow execution — separate backup/verify per WF or combined per-workflow PUTs. Invoke `build-workflow`.

## BMX-P3-WF44 — WF-44 strip redundant WF-25 call (safety-net §6 decision #11)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 8
**Change type:** Structural (partial edit)
**Workflows:** WF-44
**n8n IDs:** `Du2CJ3OTohRFZYoA`
**Depends on:** BMX-P3-WF25 (soft)
**Size:** S
**Estimated tokens:** ~20K
**Estimated effort:** ~45 min

Delete `Call WF-25` + the `rebook_intent?`/`stop_intent?` IFs + their WF-45/WF-47 calls; rewire trigger → Save Feedback. **Caller compliance audit:** WF-43 confirmed sole caller across all 28 workflows (2026-05-29) — re-verify at build. Soft dep on WF-25 (consistency, no hard build-order need). Invoke `build-workflow`.

## BMX-P3-WF20 — WF-20 STOP-aliases UNSUBSCRIBE/OPT OUT/OPT-OUT (TD-BMX-05, safety-net §6 decision #6)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 8
**Change type:** Surgical
**Workflows:** WF-20
**Depends on:** BMX-P1-PSEUDO (hard)
**Size:** XS
**Estimated tokens:** ~15K
**Estimated effort:** ~30 min

Add `UNSUBSCRIBE`/`OPT OUT`/`OPT-OUT` to the WF-20 keyword path that routes existing users → WF-47 (opt out). Exact-match after `uppercase(trim())`; `OPTOUT` (no separator) excluded. Existing-user HELP arms already live (TD-027). Originally P1 (TD-BMX-05); folded into the P0 safety-net redesign. (New/pre-form alias handling lives in WF-21/WF-23 from Phase 2 — belt-and-suspenders.) Invoke `build-workflow`.

## BMX-P3-WF46 — Retire WF-46 Auto-Block (safety-net §8 / §332)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 8
**Change type:** Structural (retirement)
**Workflows:** WF-46
**Depends on:** BMX-P3-WF25 (hard), BMX-P3-HANDLERS (hard)
**Size:** XS
**Estimated tokens:** ~12K
**Estimated effort:** ~30 min

WF-25 (and handlers) no longer call WF-46 — blocking now flows through U2 / unified `blocked`+`block_reason`. **Caller compliance audit:** before deleting WF-46, verify no OTHER live caller remains (audit all 28 workflows). If other callers exist, do NOT delete — only confirm WF-25 has re-pointed; record the finding. Depends on WF-25 + handlers having dropped their calls first. Invoke `build-workflow` for the delete/verify.

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
