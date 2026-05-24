# Data Contract Discipline — Phase 1 — Task List

**Plan-sprint input.** Items are H3 headings under priority-headed H2 sections. Dependencies are stated inline using the phrases `depends on` (hard) and `should follow` (soft) so `plan-sprint` Step 3d picks them up.

**Companion documents** (read alongside this file):
- [`design.md`](./design.md) — what each task changes and why.
- [`snapshot-restore-design.md`](./snapshot-restore-design.md) — TD-DCP-001 implementation spec.

Each task body is intentionally short. The authoritative specs live in `design.md` (linked per task).

---

## 🔴 P0 — Foundation (must complete before any utility edit)

### TD-DCP-001 · Write snapshot + restore bash scripts

**Scope:** Implement `scripts/snapshot-for-sprint.sh` and `scripts/restore-from-snapshot.sh` per [`snapshot-restore-design.md`](./snapshot-restore-design.md). Both scripts < 100 lines bash; dependencies are `curl`, `jq`, `.env` for `N8N_API_KEY`.

**Acceptance:** `bash -n` parses both scripts; snapshot dry-runs against n8n succeed for one WF; restore dry-run produces a node-level diff.

**Files:** `scripts/snapshot-for-sprint.sh`, `scripts/restore-from-snapshot.sh`.
**Change type:** Workflow-Create (script implementation).

---

### TD-DCP-002 · Run pre-sprint snapshot

**Scope:** Execute `scripts/snapshot-for-sprint.sh data-contract-phase-1`. Verify the dated folder under `workflows/pre-data-contract-workflows/<YYYY-MM-DD>/` contains JSON for every workflow listed in [`design.md`](./design.md) §3 (4 utilities, 2 routers, WF-11, WF-02, plus every envelope consumer named in §3.4), each consumer's `.pseudo` and `.md`, and a complete `manifest.json`. Commit + push the snapshot folder.

**Depends on:** TD-DCP-001 (hard — scripts must exist before they can run).

**Files:** `workflows/pre-data-contract-workflows/<YYYY-MM-DD>/`.
**Change type:** Documentation (artefact produced; no live n8n changes).

---

### TD-DCP-003 · Capture canonical-behaviour baseline via monitor-test-run

**Scope:** Invoke `n8n-whatsapp-methodology:monitor-test-run` with `type=smoke`, `slug=phase1-baseline`. Exercise all 13 critical paths listed in [`design.md`](./design.md) §6.2. The session's `story.md` becomes the anchor against which Sessions #3–#9 are compared.

**Depends on:** TD-DCP-002 (hard — snapshot must precede baseline so a regression can be replayed against frozen state).

**Files:** `docs/artefacts/tests/smoke-phase1-baseline-<YYYY-MM-DD>/`.
**Change type:** Documentation (test artefact).

---

### TD-DCP-004 · Rollback drill via monitor-test-run

**Scope:** Invoke `n8n-whatsapp-methodology:monitor-test-run` with `type=patch-validation`, `slug=phase1-rollback-drill`. Execute the 5-step drill from [`design.md`](./design.md) §6.3 against WF-52: trivial in-place edit → dry-run restore → real restore → re-export → byte-identical-modulo-`updatedAt` check.

**Depends on:** TD-DCP-002 (hard — drill needs the snapshot folder).

**Files:** `docs/artefacts/tests/patch-validation-phase1-rollback-drill-<YYYY-MM-DD>/`.
**Change type:** Documentation (test artefact). The drill itself touches WF-52 in n8n then reverts — net live change is zero if it passes.

---

## 🟠 P1 — Utility entry guards + caller alignment

Recommended order (ascending blast radius): WF-52 → WF-60 → WF-51 → WF-50. `plan-sprint` may re-order based on dependency analysis.

### TD-DCP-010 · WF-52 entry guard + WF-22 caller alignment

**Scope:** Add the `Validate Inputs` Code node as the first node of WF-52 per [`design.md`](./design.md) §2.5. Update WF-22's `Ensure Slack Channel Exists (WF-52)` Execute-Workflow node to send canonical `{phoneNumber, name, userId}` (rename `phone_number` → `phoneNumber`, `userName` → `name`). Update WF-52's `.pseudo` `Inputs:` block. WF-52 has 1 caller (WF-22) — no other caller audit needed.

**Depends on:** TD-DCP-003 (hard — baseline must precede first mutation).

**Files:** WF-52 (`IO5BZLUxuVmjzk5I`), WF-22 (`dr8QM0m92Ml8MvIh`), `docs/pseudocode/WF-52.pseudo`.
**Change type:** Structural.

---

### TD-DCP-011 · Unit #2 smoke — WF-52

**Scope:** `monitor-test-run` smoke, `slug=phase1-unit2-wf52`. Trigger fresh form submission; confirm WF-52 entry guard accepts WF-22's renamed payload; channel created; both admins invited; `users.slack_channel_id` written. Include one deliberate contract-violation narration to verify the guard throws.

**Depends on:** TD-DCP-010 (hard).

**Files:** `docs/artefacts/tests/smoke-phase1-unit2-wf52-<YYYY-MM-DD>/`.
**Change type:** Documentation (test artefact).

---

### TD-DCP-020 · WF-60 entry guard + 4-caller payload audit

**Scope:** Add the `Validate Inputs` Code node as the first node of WF-60 per [`design.md`](./design.md) §2.6. Audit the 4 `Build WF-60 Payload …` nodes inside WF-00, WF-10, WF-50, WF-51 — each must emit the discriminated-union shape for its `transport` + `direction` combination. Rewrite where shape diverges. Update WF-60's `.pseudo` `Inputs:` block.

**Depends on:** TD-DCP-004 (hard — rollback drill must be green before any further unit starts).
**Should follow:** TD-DCP-011 (soft — sequential ascending blast radius).

**Files:** WF-60 (`6H75p935FpBVBQtV`), WF-00 (`JQu1MkK5vgtUCeNO`), WF-10 (`wMh0oBRtJbvhLgOf`), WF-50 (`BUVun38WEKb12zg9`), WF-51 (`wlZRK0YxnhP0b2RL`), `docs/pseudocode/WF-60.pseudo`.
**Change type:** Structural.

---

### TD-DCP-021 · Unit #3 smoke — WF-60

**Scope:** `monitor-test-run` smoke, `slug=phase1-unit3-wf60`. Send one WA inbound, one WA outbound (via APPROVE PAYMENT trigger), one Slack inbound (admin command), one Slack outbound (admin notification). Cross-check 4 rows in `chinmay_astro.messages` with correct `transport`, `direction`, `message_type`.

**Depends on:** TD-DCP-020 (hard).

**Files:** `docs/artefacts/tests/smoke-phase1-unit3-wf60-<YYYY-MM-DD>/`.
**Change type:** Documentation.

---

### TD-DCP-030 · WF-51 entry guard + ~14-caller payload audit

**Scope:** Add the `Validate Inputs` Code node as the first node of WF-51 per [`design.md`](./design.md) §2.4. Audit every WF-51 caller's payload-prep node and standardise on `{channelId, messageText, [userId], [consultationId]}`. Note: WF-10 alone contains 6 distinct `Prepare WF-51 Payload …` Code nodes (Orphan Channel Alert, Wrong Channel Admin, Help Prompt, Wrong Channel User, Phone Absent, Phone Mismatch, Wrong State) — each must comply individually. Full caller list is discovered live during `plan-sprint` Step 3c. Update WF-51's `.pseudo` `Inputs:` block.

**Depends on:** TD-DCP-021 (hard — unit smoke must pass before next unit).

**Files:** WF-51 + ~14 callers (list discovered live), `docs/pseudocode/WF-51.pseudo`.
**Change type:** Batch Surgical (caller renames) + Structural (entry guard).

---

### TD-DCP-031 · Unit #4 smoke — WF-51

**Scope:** `monitor-test-run` smoke, `slug=phase1-unit4-wf51`. Exercise all 6 WF-10 alert payloads + at least 2 other WF-51 callers (e.g., APPROVE PAYMENT user notification path, feedback prompt). Verify entry guard accepts canonical envelope on every path.

**Depends on:** TD-DCP-030 (hard).

**Files:** `docs/artefacts/tests/smoke-phase1-unit4-wf51-<YYYY-MM-DD>/`.
**Change type:** Documentation.

---

### TD-DCP-040 · WF-50 entry guard + ~18-caller payload audit

**Scope:** Add the `Validate Inputs` Code node as the first node of WF-50 per [`design.md`](./design.md) §2.3 (discriminated union: text / interactive / template). Audit every WF-50 caller's payload-prep node: rename legacy `message` / `messageBody` keys to canonical `messageContent`; add explicit `messageType: 'text'` where omitted; add optional logging context (`userId`, `consultationId`, `inboundMessageId`, `userMessage`) where caller has it. Full caller list discovered live during `plan-sprint`. Update WF-50's `.pseudo` `Inputs:` block.

**Depends on:** TD-DCP-031 (hard).

**Files:** WF-50 + ~18 callers (list discovered live), `docs/pseudocode/WF-50.pseudo`.
**Change type:** Batch Surgical + Structural.

---

### TD-DCP-041 · Unit #5 smoke — WF-50

**Scope:** `monitor-test-run` smoke, `slug=phase1-unit5-wf50`. Trigger all 3 message-type variants — text, interactive, template. Include deliberate contract-violation test: narrate "temporarily editing a caller to send `messageContnt` typo"; verify the entry guard throws a failed execution; revert; re-test green.

**Depends on:** TD-DCP-040 (hard).

**Files:** `docs/artefacts/tests/smoke-phase1-unit5-wf50-<YYYY-MM-DD>/`.
**Change type:** Documentation.

---

## 🟠 P1 — Router envelopes + envelope-consumer audit

### TD-DCP-050 · WF-01 envelope emission

**Scope:** Restructure WF-01 to emit the Section 2.1 core envelope on every output branch (to WF-02, to WF-21 directly) per [`design.md`](./design.md) §3.2. The existing 20-column users SELECT is preserved; the envelope construction lives in a `Build WF-01 Envelope` Code node before the outputs branch. Update WF-01's `.pseudo` to declare the emitted envelope.

**Depends on:** TD-DCP-041 (hard — all four utility units must be green before router envelopes start; envelope leaves consume utilities downstream).

**Files:** WF-01 (`hYGNM97sXvdo1WmI`), `docs/pseudocode/WF-01.pseudo`.
**Change type:** Structural.

---

### TD-DCP-051 · WF-02 entry guard

**Scope:** Add the `Validate Inputs` Code node as the first node of WF-02 per [`design.md`](./design.md) §2.7, validating the WF-01 envelope.

**Depends on:** TD-DCP-050 (hard — guard validates the envelope WF-01 now emits).

**Files:** WF-02 (`PubCsNTOspF3xqXZ`), `docs/pseudocode/WF-02.pseudo`.
**Change type:** Structural.

---

### TD-DCP-052 · WF-01 envelope-consumer audit + Type A cleanups

**Scope:** Audit every WF-01 envelope consumer per [`design.md`](./design.md) §3.4. Confirmed candidates: WF-32, WF-42, WF-33, WF-46, WF-44 (remove redundant Load-User SELECTs). Discovery-confirmed candidates: WF-21, WF-22, WF-23, WF-30, WF-31, WF-20, WF-40, WF-43 (audit per leaf — keep, simplify, or remove). For each removal: rewrite downstream references from `$('Load User …').item.json.X` to `$('When Executed by Another Workflow').item.json.user.X` (or `.phoneNumber` for canonical phone). Rewrite each consumer's `.pseudo` `Inputs:` block to declare the new envelope.

**Depends on:** TD-DCP-051 (hard — defense-in-depth guard must protect the consumers).

**Files:** WF-21 (`zM8WbxSdt9nXRoLZ`), WF-22 (`dr8QM0m92Ml8MvIh`), WF-23 (`VpCER0Vqq3NYJGpI`), WF-30 (`gGJBY5fJha0Let8I`), WF-31 (`HB8nXudAtk9iXz7C`), WF-32 (`emUOLWVZiNVxcOe3`), WF-33 (`NcHZedq9ycnAQ9SW`), WF-40 (`du32QBZbSQOjfESe`), WF-42 (`fx70vqyJtRdF2DgR`), WF-43 (`3va0M06kijgyLejf`), WF-44 (`Du2CJ3OTohRFZYoA`), WF-46 (`UV62An60fzflU0uD`), WF-20 (`LgIDj1v4ZbCPlX25`) + each `.pseudo`.
**Change type:** Batch Surgical (Type A cleanups follow same shape) + Documentation (pseudo).

---

### TD-DCP-053 · Unit #6 smoke — WF-01 envelope

**Scope:** `monitor-test-run` smoke, `slug=phase1-unit6-wf01-envelope`. Re-run inbound-WA paths for each user state (new user, payment_pending, payment_submitted, consultation_active, consultation_closed, opted_out, blocked). Use the skill's execution-fetch to confirm removed Load-User nodes no longer appear in execution traces; node count per path is lower than Session #1 baseline.

**Depends on:** TD-DCP-052 (hard).

**Files:** `docs/artefacts/tests/smoke-phase1-unit6-wf01-envelope-<YYYY-MM-DD>/`.
**Change type:** Documentation.

---

### TD-DCP-060 · WF-10 envelope emission

**Scope:** Restructure WF-10 to emit two envelopes per [`design.md`](./design.md) §2.2 + §3.2: a `commandType` envelope to WF-11 and a relay envelope to WF-41. Construction lives in `Build WF-10 Command Envelope` and `Build WF-10 Relay Envelope` Code nodes. Update WF-10's `.pseudo`.

**Depends on:** TD-DCP-053 (hard — unit smoke confirms WF-01 envelope path is green before tackling the more coupled WF-10 chain).

**Files:** WF-10 (`wMh0oBRtJbvhLgOf`), `docs/pseudocode/WF-10.pseudo`.
**Change type:** Structural.

---

### TD-DCP-061 · WF-11 entry guard

**Scope:** Add the `Validate Inputs` Code node as the first node of WF-11 per [`design.md`](./design.md) §2.8, validating the WF-10 `commandType` envelope. Validates all 8 `commandType` enum values.

**Depends on:** TD-DCP-060 (hard).

**Files:** WF-11 (`GoTYo0GS2y8qjjkw`), `docs/pseudocode/WF-11.pseudo`.
**Change type:** Structural.

---

### TD-DCP-062 · WF-10 envelope-consumer audit + Type A cleanups

**Scope:** Audit every WF-10 envelope consumer per [`design.md`](./design.md) §3.4. Confirmed: WF-41 (remove `Load User for Relay` SELECT). Discovery-confirmed: WF-34 (and re-audit WF-33, WF-42, WF-46 since they overlap with WF-01-envelope cleanups in TD-DCP-052). Rewrite each consumer's `.pseudo` `Inputs:` block.

**Depends on:** TD-DCP-061 (hard).

**Files:** WF-41 (`6PzJRZsF7k2d9hV7`), WF-34 (`se82n3MUQ9xE5aEr`), plus re-audit of WF-33 / WF-42 / WF-46 + each `.pseudo`.
**Change type:** Batch Surgical + Documentation.

---

### TD-DCP-063 · Unit #7 smoke — WF-10 envelope

**Scope:** `monitor-test-run` smoke, `slug=phase1-unit7-wf10-envelope`. Re-run all 8 admin command types (APPROVE PAYMENT, REJECT PAYMENT, CLOSE CONSULT, BLOCK, UNBLOCK, LIST, STATS, HELP) plus the admin → user text relay path. Verify WF-11 entry guard accepts the envelope on every command; WF-41 relay works; downstream consumer cleanups do not regress command handling.

**Depends on:** TD-DCP-062 (hard).

**Files:** `docs/artefacts/tests/smoke-phase1-unit7-wf10-envelope-<YYYY-MM-DD>/`.
**Change type:** Documentation.

---

## 🟡 P2 — Sprint close

### TD-DCP-070 · Final regression via monitor-test-run

**Scope:** `monitor-test-run` regression, `slug=phase1-final-regression`. Re-narrate every action from Session #1; cross-check content, DB state, and execution-node-count against Session #1's `story.md`. Verify all 6 entry guards active (one deliberate contract violation per guard if not already exercised in unit smokes).

**Depends on:** TD-DCP-063 (hard — all P1 units must be green).

**Files:** `docs/artefacts/tests/regression-phase1-final-regression-<YYYY-MM-DD>/`.
**Change type:** Documentation.

---

### TD-DCP-071 · Update workflow-registry.md

**Scope:** Per [`design.md`](./design.md) §4.4, update `docs/workflow-registry.md` WIP action list to reflect the entry-guard additions on WF-50, WF-51, WF-52, WF-60, WF-11, WF-02 and the envelope shapes emitted by WF-01 / WF-10.

**Depends on:** TD-DCP-070 (hard — registry should reflect final post-regression state).

**Files:** `docs/workflow-registry.md`.
**Change type:** Documentation.

---

### TD-DCP-072 · Write feedback_data_contract_discipline.md memory

**Scope:** Capture the reusable pattern (entry-guard structure, layered-envelope philosophy, snapshot-backed sprint rollback) in a memory file for future projects and sprints. Reference the contracts in §2 of `design.md` and the snapshot mechanism in `snapshot-restore-design.md`.

**Depends on:** TD-DCP-071 (soft — memory captures the completed pattern).

**Files:** `~/.claude/projects/.../memory/feedback_data_contract_discipline.md` + index entry in `MEMORY.md`.
**Change type:** Documentation.
