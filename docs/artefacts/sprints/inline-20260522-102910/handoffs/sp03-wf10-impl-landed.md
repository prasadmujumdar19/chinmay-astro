# Handoff — SP-03 WF-10 implementation landed; smoke + downstream pending

_Written 2026-05-23T02:42:00Z_

## Stopping Point

Sprint `inline-20260522-102910` — Batch 2 (P2). **SP-03 WF-10 implementation phase complete**: live JSON updated (28 → 38 nodes) with the centralized validation gate per `docs/pseudocode/WF-10.pseudo`. Live workflow active, lint clean, zero dangling refs, all keeper IDs/credentials/webhookId preserved. **Not yet smoke-tested.** Downstream cleanups (WF-11/33/34/42) deferred per user-scoped session boundary ("WF-10 only this session"). Backup: `archive/backups/wMh0oBRtJbvhLgOf-2026-05-23-12-14.json`. New versionId: `f9a50569-cfbb-40e3-968d-51bbe3376fa5`. WF-10.md regenerated post-PUT.

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint` (no args — `_active` marker auto-resumes). Skill will land on SP-03 (in-progress). Then:

1. **Smoke test WF-10's centralized gate** (test phone `+61491370732`, currently in "no records" state — user self-resets by sending any non-STOP/REBOOK text). Cover:
   - **Admin-channel happy:** LIST → routed to WF-11 → admin-channel listing reply. HELP → routed to WF-11 → help text. STATS → routed to WF-11 → stats reply.
   - **Admin-channel rejections:** "APPROVE PAYMENT" typed in chinmay-admin-commands → Wrong-Channel Alert (Admin) → "is a user-targeted command…". "what's the time" free text → Help Prompt → "🤖 Type `HELP` to see available commands."
   - **User-channel command happy:** in payment_submitted consult-* channel, type `APPROVE PAYMENT <phone>` → routed via Phone Match (ok) → State Match (TRUE: payment_submitted == expected) → Dispatch (user_targeted_cmd) → WF-11 → WF-33. Similarly CLOSE in consultation_active, BLOCK in any state, UNBLOCK in blocked.
   - **User-channel rejections:**
     - `APPROVE PAYMENT` typed without a phone in consult-+614… → Phone-Absent Alert → "needs the customer's phone number…"
     - `APPROVE PAYMENT +614999999999` typed in consult-+61491370732 → Phone-Mismatch Alert → "ignored — this channel belongs to `61491370732`…"
     - `CLOSE +61491370732` typed in a payment_pending channel → State-Wrong Alert → "ignored — customer is currently in `payment_pending`, expected `consultation_active`…"
     - Admin types in fresh `consult-orphan-test` channel (no users row) → Orphan-Channel Alert (re-verifies SP-11 Test E with new code path).
   - **Relay text happy:** in consult-+61491370732 with status=consultation_active, type plain text "Hello" → Phone Match (bypass) → State Match (TRUE) → Dispatch (relay_text) → Build WF-41 Payload → WF-41 → WhatsApp delivered.
   - **Relay text rejected:** in consult-+61491370732 with status=consultation_closed, type plain text → State-Wrong Alert (relay variant) → "⚠️ Message not relayed — customer is currently in `consultation_closed`, expected `consultation_active`. WhatsApp send skipped."
   - **Admin-wide in user channel:** LIST typed in consult-* → Wrong-Channel Alert (User) → "is an admin command. Please type it in the `chinmay-admin-commands` channel."

2. **Downstream surgical-structural cleanups** (4 small PUTs — each removes now-redundant guards because WF-10's gate makes them unreachable in the FALSE direction; the cleanups are cosmetic for clarity, not functional):
   - **WF-33** (`NcHZedq9ycnAQ9SW`): remove `User in Correct State?` IF + `Prepare WF-51 Payload (Wrong State)` + `Call WF-51 Notify Admin Wrong State`; rewire `Load User by Phone` → `Update Payment Status` directly.
   - **WF-34** (`se82n3MUQ9xE5aEr`): remove `User Found?` IF + `User in Correct State?` IF + their FALSE-branch feedback chains (4 nodes); rewire `Load User by Phone` → `Update Payment Record` directly.
   - **WF-42** (`fx70vqyJtRdF2DgR`): remove `User Found?` IF + `User in Correct State?` IF + their FALSE-branch feedback chains (4 nodes); rewire `Load User by Phone` → `Close Consultation Record` directly.
   - **WF-11** (`GoTYo0GS2y8qjjkw`): remove `Blocked User Found?` IF + `No Blocked User Found` executeWorkflow node; rewire `Lookup Blocked User` → `Unblock User` directly.

3. **After smoke + cleanups pass:** mark SP-03 done in state.md; mark TD-021 / TD-022 / TD-023 resolved in `docs/Tech_Debts.md`; update `workflow-registry.md` with SP-03 entries on WF-11/33/34/42 rows; run Batch 2 post-batch regression per build-sprint Step 4 (rebuild dependency map, sibling-check siblings of WF-10/11/33/34/42 via dependency-map.md, log strict findings as new sprint items + adjacent findings to followups.md). Then offer Batch 2 commit/push.

4. **Commit/push offer:** the WF-10 implementation work is **uncommitted** as of this handoff. Next-session start should — before doing anything else — ask: "Commit and push the WF-10 implementation (workflow-registry.md update, workflows/wMh0oBRtJbvhLgOf.json, docs/pseudocode/WF-10.md, sprint state.md, handoff) to GitHub now?" The work is functionally bounded and lint-clean even though smoke is pending; deferring the commit is the user's call.

## Blockers

None operationally. Smoke test deferred is intentional (session-scope limit), not a blocker.

**Plugin improvement candidates (for SP-10 — runs Batch 4), in addition to those already in state.md `followups_logged`:**

- **(k) Author-fresh vs mutate-in-place gate inside `build-workflow` Step 5e.** Surfaced when planning the WF-10 rebuild — the existing Step 5e reads as jq-mutate-by-name and steered toward chained renames+rewires despite 30%+ node turnover. Proposed: if (renames + adds + removes) >= 30% of node count OR any rename touches a node referenced by `$('Name')` from > 2 other nodes → author-fresh (write full target nodes+connections declaratively, jq-extract keepers from live by `.name`, splice). Author-fresh is O(target node count); rename-chain is O(renames × downstream-refs). Validated by WF-10 (28→38) execution: zero dangling refs, lint clean, keeper id/position/credentials/webhookId preserved verbatim.
- **(l) Validation centralization at boundary entry points** (carried over from prior handoff). Trust-after-gate pattern; pairs with (h) user-load gates. Validated by SP-11 (WF-01) + SP-03 (WF-10).
- **(m) typeVersion floor rule for fresh-authored nodes.** When author-fresh or `n8n_create_workflow` introduces nodes not in the live JSON, default each new node's typeVersion to the highest typeVersion already present in the live workflow for that exact `.type` — do not auto-pick the n8n MCP's latest. Bumping creates two failure modes: (a) condition/parameter format mismatches that crash the UI (already lint-hooked for IF + executeWorkflow, not for Set/Switch/Code/Postgres); (b) silent runtime semantic drift (e.g., Set v3.4 `includeOtherFields=false` default — SP-11 LESSON LEARNED). User-prompted reminder this session; should not have been a memory miss. Add as Step 5e.1a in build-workflow.

## Changed Reference Values

- **WF-10 (`wMh0oBRtJbvhLgOf`):** 28 → 38 nodes. live `updatedAt`: 2026-05-23T02:30:47.988Z. versionId: `f9a50569-cfbb-40e3-968d-51bbe3376fa5`. Backup pre-change: `archive/backups/wMh0oBRtJbvhLgOf-2026-05-23-12-14.json`. webhookId preserved: `27a3efa5-513d-478b-8b21-185b9e64bd42`. triggerCount=1.
- **9 dropped node names** (do NOT recreate; they intentionally do not exist post-SP-03): Detect Command - Admin Channel, Detect Command - User Channel, Command - Admin Channel ?, Command - User Channel ?, User Consultation Active?, Build Admin Feedback, Build Wrong Channel Warning, Call WF-51 (Inactive User Feedback), Call WF-51 (Wrong Channel Warning).
- **19 new node names** in WF-10: Classify Admin Channel Message, Route by Kind (Admin), Build Wrong-Channel Alert (Admin), Call WF-51 (Wrong Channel Admin), Build Help Prompt, Call WF-51 (Help Prompt), Classify User Channel Message, Route by Kind (User), Build Wrong-Channel Alert (User), Call WF-51 (Wrong Channel User), Phone Match?, Build Phone-Absent Alert, Call WF-51 (Phone Absent), Build Phone-Mismatch Alert, Call WF-51 (Phone Mismatch), State Match?, Build Wrong-State Alert, Call WF-51 (Wrong State), Dispatch by Kind.
- **Files modified locally (uncommitted):**
  - `workflows/wMh0oBRtJbvhLgOf.json` (re-exported post-PUT)
  - `docs/pseudocode/WF-10.md` (regenerated post-PUT)
  - `docs/workflow-registry.md` (WF-10 row appended with SP-03 entry)
  - `docs/artefacts/sprints/inline-20260522-102910/state.md` (SP-03 implementation_note + followups_logged k/l/m + last_updated bump)
  - `docs/artefacts/sprints/inline-20260522-102910/handoffs/sp03-wf10-impl-landed.md` (this file)
- **Test phone `+61491370732`** is currently in "no records" state — user self-resets by sending any non-STOP/REBOOK text from it (WF-21 will re-onboard). Useful for new-user / orphan smoke scenarios in next session's smoke test.
- **Downstream workflows still carry redundant guards** (WF-11/33/34/42). These do not break anything — they double-check what WF-10's gate already enforces. Removing them is Step 2 above (cosmetic cleanup for clarity, not functional fix).
