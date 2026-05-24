# Wave 2 Plans — Persisted Subagent Returns

**Written:** 2026-05-25 (during Wave 2 dispatch session)
**Purpose:** Persist the structured JSON edit plans + complete revised `.pseudo` content returned by the 8 Wave-2 subagents, so the apply phase can run cleanly in a fresh session without re-dispatching.

## Why these files exist

The 8 Wave-2 subagents each returned a single JSON object containing:
- `n8n_edit_plan` — node additions/modifications/removals + connection changes per WF
- `pseudo_revisions` — COMPLETE revised `.pseudo` content per WF (the hardened deliverable that Wave 1 missed)
- `rationale` — design.md sections applied
- `contract_drift_findings` — strict + adjacent findings

This session dispatched and verified the plans but did not apply them (context budget — see `handoffs/handoff-wave-2-plans-saved.md`). The plans are persisted here in `wave-2-plans/sub-*.md` so the next session can apply them deterministically.

## Files in this directory

One file per subagent (8 total), each containing:
1. **n8n edit plan** for that subagent's owned WF(s)
2. **Pseudo revision content** for each WF (decoded — no HTML entities)
3. **Rationale + drift findings** (verbatim from subagent)

| File | Subagent | Owns WFs | Action summary |
|------|----------|----------|----------------|
| `sub-6b.md` | sub-6b | WF-10 | Pseudo-only reconciliation (5 adjacent findings); no n8n edits — Wave 1 sub-6a already deployed canonical node names |
| `sub-8.md` | sub-8 | WF-02 | Add `Validate Inputs` entry-guard Code node + full pseudo |
| `sub-9.md` | sub-9 | WF-11 | Add `Validate Inputs` entry-guard (8 commandType enum values — full forms canonical) + full pseudo |
| `sub-10.md` | sub-10 | WF-22 | Add `Prepare WF-52 Payload` Set node before Execute WF-52 (rename phone_number→phoneNumber, id→userId) + pseudo |
| `sub-11.md` | sub-11 | WF-21, WF-23, WF-30, WF-31 | WF-21/23 pseudo-only. WF-30 rename `message`→`messageContent`. WF-31 same + remove `Load User for Relay`. |
| `sub-12.md` | sub-12 | WF-20, WF-40, WF-43, WF-44 | WF-20 `Send HELP Response` rename messageBody→messageContent. WF-40 remove `Load User Record` + rewire. WF-43/WF-44 rename legacy `message`→`messageContent`. |
| `sub-13.md` | sub-13 | WF-32, WF-33, WF-42, WF-46 | All 4: remove confirmed Load-User SELECTs + rewire to envelope `user.X` + connection changes per WF |
| `sub-14.md` | sub-14 | WF-41, WF-34 | WF-41 fix latent runtime bug: read `messageText` (not `adminMessage`). WF-34 simplify `Load User by Phone` to fetch only `payment_id` + rewire. |

## Apply order (next session)

Per the pseudo-first hardening agreed in this session:

For each WF (18 total — note sub-11 covers 4, sub-12 covers 4, sub-13 covers 4):

1. Read the relevant `sub-X.md` from this folder
2. Write `docs/pseudocode/WF-XX.pseudo` with the revised content (verbatim from the file)
3. Grep verify the expected new artifact (`Validate Inputs` / `Build WF-XX Envelope` reference / removed Load-User reference) is present in the freshly-written `.pseudo`
4. Apply n8n mutations via `mcp__n8n__n8n_update_partial_workflow` per the JSON edit plan
5. Re-fetch the WF via `mcp__n8n__n8n_get_workflow` and verify the mutations landed (per `[[feedback_n8n_mcp_nested_array_update]]` — nested-array updates may silently no-op)
6. Update sprint `state.md` to mark the relevant TD-DCP-* items per the `execution_plan` blocks

Suggested order (lowest blast radius first):
1. **Pseudo-only:** sub-6b (WF-10) — applies first because no n8n risk
2. **New nodes (additions only):** sub-8 (WF-02), sub-9 (WF-11) — entry guards
3. **Single-WF rename + add:** sub-10 (WF-22)
4. **Simple cluster renames:** sub-11 (WF-21/23/30/31)
5. **Mid-size cluster:** sub-12 (WF-20/40/43/44)
6. **Confirmed removals:** sub-13 (WF-32/33/42/46)
7. **Critical bug fix:** sub-14 (WF-41/34) — WF-41 contains a latent runtime-failure fix

## Decisions captured during dispatch session

1. **commandType enum** (sub-9 drift): **Full forms (live) are canonical** — `CLOSE_CONSULTATION` / `BLOCK_USER` / `UNBLOCK_USER`. design.md §2.2 listed abbreviated shorthand; update design.md to remove the shorthand (logged to followups for post-sprint).

2. **Hardening committed for Wave 2 (apply phase):**
   - Pseudo applied BEFORE n8n (pseudo is source of truth per `[[feedback_pseudocode_first_refactor]]`).
   - Grep verification of pseudo after Write, before n8n mutation.
   - Per-batch close gate: grep each touched `.pseudo` before declaring Batch 3 done.

## Strict findings flagged (not blockers — apply as planned)

| WF | Finding | Source | Fix |
|----|---------|--------|-----|
| WF-11 | design.md §2.2 enum shorthand vs live | sub-9 | Use live full forms; log design.md doc update |
| WF-30 | `Prepare Payment Reminder` emits legacy `message` (would fail WF-50 entry guard) | sub-11 | Rename to `messageContent` + `messageType:'text'` |
| WF-31 | `Prepare Under Review Message` same legacy `message` | sub-11 | Same rename |
| WF-31 | `Load User for Relay` redundant SELECT | sub-11 | Remove + rewire to envelope |
| WF-40 | `Load User Record` redundant SELECT | sub-12 | Remove + rewire |
| WF-43 | `Extract Gemini Reply` legacy `message` | sub-12 | Rename |
| WF-44 | `Prepare Ack` + `Send Ack` legacy `message` | sub-12 | Rename |
| WF-41 | **LATENT RUNTIME BUG**: reads `input.adminMessage` but WF-10 Relay Envelope (Wave 1) emits `messageText` — every admin relay would fail at WF-50 entry guard | sub-14 | Update jsCode to read `input.messageText` |

## Adjacent findings (log to followups.md at sprint close)

| WF | Finding | Disposition |
|----|---------|-------------|
| WF-10 | Pseudo step descriptions used generic phrasing vs exact live node names (Steps 13/14/25/7) | Fixed in sub-6b pseudo revision |
| WF-44 | design.md §3.4 lists `Load User for Relay` removal but live has no such node (already removed pre-sprint) | Informational; no action |
| WF-20 | TD-DRIFT-006 (Normalize Keyword drops userStatus) | Deferred (out of Phase 1 per §1.5) |
| WF-23/30/31/43/44 | TD-DRIFT-009 (WF-25 callers send `messageText` not `messageContent`) | Deferred (out of Phase 1 per §1.5) |
| WF-33 | TD-DRIFT-017 (`verified_by` receives channelId not adminUserId) | Deferred (out of Phase 1 per §1.5) |
| WF-46 | `blocked_reason` column hardcoded; caller `reason` only in Slack message | Logged as TD candidate |
