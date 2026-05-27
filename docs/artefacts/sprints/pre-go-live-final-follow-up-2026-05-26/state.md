# Sprint: pre-go-live-final-follow-up-2026-05-26

**Input source:** docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/tasks.md
**Input hash:** bbe96d3983495229756fb114f40450993c7810b826983cfec4f54110d52d29ac
**Original input hash:** 1e57353d91e9ba176f6b424ff0ffaa0a06666cde404669d15e5ee65c944ee66e (sprint-plan time)
**Hash-change reason:** mid-sprint scope addition 2026-05-27T00:54:52Z — appended TD-PGF-12/13/14 (Batch 2.5 P0 hot-fixes) to tasks.md "Mid-sprint scope additions" section. State.md updated in lockstep. Intentional re-baseline, not source drift.
**Planned at:** 2026-05-26T20:58:38Z
**Last updated:** 2026-05-27T00:54:52Z
**Planning complete:** true

**Discover-current-state:** skipped — source tasks.md embeds inline live-verification timestamps for every item (TD-PGF-02 re-verified 2026-05-26T10:25Z; TD-PGF-04 obsolete-on-verify 2026-05-26T11:20Z; TD-PGF-05 5-dim audit 2026-05-26T11:35Z; TD-PGF-08 corpus-wide SELECT audit 2026-05-26T11:55Z). Re-running would duplicate work captured <24 hrs ago.
**Dependency conflicts found:** TD-PGF-01B (P0) hard-depends on TD-PGF-01A (P0) — same priority, no conflict. TD-PGF-05 and TD-PGF-09 share 3 workflows (WF-23/WF-30/WF-44) as same-workflow siblings — resolved by by-workflow execution in Batch 3 (atomic per-workflow PUT covering both items' changes).
**Priority adjustments confirmed:** TD-PGF-05 promoted P2→P1 per source 2026-05-26T11:35Z. TD-PGF-09 promoted P3→P1 per source 2026-05-26T12:10Z. Both pre-locked by user in tasks.md.
**Excluded from execution:** TD-PGF-04 (obsolete — quote-wrap bug pre-fixed, empty messages table explained by ON DELETE CASCADE). TD-PGF-06 (subsumed into TD-PGF-05). TD-PGF-10 (deferred to post-MVP TD-NEW-034; incremental drift-check stays as execution discipline on touched workflows, not a tracked item).

## Items

| ID | Status | Batch | Pri | Workflows | Depends On |
|----|--------|-------|-----|-----------|------------|
| TD-PGF-01A | ✅ done | 1 | P0 | — | — |
| TD-PGF-01B | 🔵 in-progress | 2 | P0 | WF-22 | TD-PGF-01A (hard) |
| TD-PGF-02 | ⬜ pending | 4 | P1 | WF-00 | — |
| TD-PGF-03 | ⬜ pending | 4 | P1 | WF-11 | — |
| TD-PGF-04 | ⚪ obsolete | — | — | WF-60 | — |
| TD-PGF-05 | ⬜ pending | 3 | P1 | WF-23, WF-30, WF-44, WF-50, WF-32 | TD-PGF-09 (soft) |
| TD-PGF-06 | ⚪ obsolete | — | — | WF-23, WF-30, WF-44 | TD-PGF-05 (subsumed) |
| TD-PGF-07 | ⬜ pending | 5 | P3 | WF-10 | — |
| TD-PGF-08 | ⬜ pending | 5 | P3 | WF-45 | — |
| TD-PGF-09 | ⬜ pending | 3 | P1 | WF-25, WF-23, WF-30, WF-31, WF-43, WF-44 | TD-PGF-05 (soft) |
| TD-PGF-10 | ⚪ obsolete | — | — | — | — |
| TD-PGF-12 | ⬜ pending | 2.5 | P0 | — (audit only) | TD-PGF-01B (soft) |
| TD-PGF-13 | ⬜ pending | 2.5 | P0 | WF-01, +TBD per TD-PGF-12 | TD-PGF-12 (hard) |
| TD-PGF-14 | ⬜ pending | 2.5 | P0 | WF-21 | — |
| TD-PGF-11 | ⬜ pending | 6 | EXIT | — | TD-PGF-01A (hard), TD-PGF-01B (hard), TD-PGF-02 (hard), TD-PGF-03 (hard), TD-PGF-05 (hard), TD-PGF-07 (hard), TD-PGF-08 (hard), TD-PGF-09 (hard), TD-PGF-12 (hard), TD-PGF-13 (hard), TD-PGF-14 (hard) |

## Batch 1 — P0 investigation

- **Items:** 1 (TD-PGF-01A)
- **Description:** Phase 1 capability investigation for WhatsApp Flow form input validation. No code change.
- **Estimated size:** XXS
- **Estimated tokens:** ~5K

## Batch 2 — P0 build

- **Items:** 1 (TD-PGF-01B)
- **Description:** Phase 2 build of form input validation + email-address column ALTER. Option chosen at end of Batch 1.
- **Estimated size:** L
- **Estimated tokens:** ~50K (worst case all-Option-C; ~20K if Meta-native paths chosen)

## Batch 3 — P1 envelope + classifier (by-workflow execution)

- **Items:** 2 (TD-PGF-05, TD-PGF-09) — applied per-workflow atomically
- **Description:** Eight workflow PUTs, each combining TD-PGF-05's envelope-rename + TD-PGF-09's classifier-error fan-out where they overlap (WF-23/30/44). Per-workflow PUT order: WF-25 first (-09 fan-out source) → WF-23, WF-30, WF-44 (-05 + -09 combined) → WF-31, WF-43 (-09 only) → WF-50, WF-32 (-05 only). State.md flips both items ✅ after final workflow in batch lands.
- **Estimated size:** L
- **Estimated tokens:** ~50K (8 workflows; combined PUTs save ~7K vs sequential execution of -05 then -09)
- **Execution model:** by-workflow grouping — combines tightly-coupled items into atomic per-workflow PUTs to halve admin overhead and avoid double-touch of WF-23/WF-30/WF-44.

## Batch 4 — P1 independent surgical edits

- **Items:** 2 (TD-PGF-02, TD-PGF-03)
- **Description:** Two surgical edits in disjoint workflows (WF-00, WF-11). Can run in either order; no dependencies.
- **Estimated size:** XS
- **Estimated tokens:** ~15K

## Batch 5 — P3 cosmetic + architectural cleanup

- **Items:** 2 (TD-PGF-07, TD-PGF-08)
- **Description:** Closes the envelope-everywhere pattern (WF-45 SELECT removal) + cosmetic intermediate-field rename in WF-10. Independent workflows.
- **Estimated size:** XS
- **Estimated tokens:** ~15K

## Batch 6 — EXIT smoke test gate

- **Items:** 1 (TD-PGF-11)
- **Description:** Two-phase smoke (happy-path journeys + failure-path mini-smokes including TD-PGF-09 forced-failure via cloned WF-25-test). Sprint exits when both phases pass clean.
- **Estimated size:** XS (token-cost; multi-hour wall-clock activity)
- **Estimated tokens:** ~10K (smoke ceremony — not workflow edits)

## TD-PGF-01A — WhatsApp Flow form input validation — Phase 1 (capability investigation)

> Source tasks.md uses lowercase suffix `TD-PGF-01a`; uppercased here as `TD-PGF-01A` to satisfy `lint-state-md.sh` H2-regex (which is uppercase-only). Build-sprint executor: treat both spellings as the same item.

**Status:** ✅ done
**Priority:** P0 | **Batch:** 1
**Change type:** Documentation
**Workflows:** —
**Depends on:** —
**Size:** XXS
**Estimated tokens:** ~5K
**Estimated effort:** 45–75 min
**Started:** 2026-05-26T22:30:00Z
**Completed:** 2026-05-26T22:58:01Z
**Actual tokens:** ~16K
**Actual effort:** ~28 min
**Estimate delta:** +1 bucket (planned XXS ~5K, actual ~16K = XS-band; under-estimated by 1 bucket — investigation required 5 web fetches + 4 web searches + 2 user decision rounds, deeper than the XXS doc bucket assumed)

Investigate Meta WhatsApp Flow Builder capability for (a) TimePicker, (b) field-level text validation primitives, (c) email-format validation. Inspect current Flow JSON (Flow ID `1408011897720771`). Sample-check last ~20 pending_users.contact_name and users.place_of_birth rows for input-shape patterns. Output: decisions block locking Option A (Flow-native) vs Option C (n8n WF-22 guard) per field. No code change.

Strategy preferences (locked in source Discussion Log 2026-05-26T10:35Z): time-of-birth → A preferred over C (HH:MM regex if C); place-of-birth → B preferred over C (strict 4-char + space/two-token if C, with caveat re Pune/Goa/Indore short single-word cities); email → B preferred over C (RFC5322-ish regex).

Phase 2 (TD-PGF-01B) cannot start until per-field option choice locked here.

### Decisions locked (2026-05-26T22:58:01Z)

**Capability findings (Flow JSON v7.2 current, latest published v7.3):**
- **TimePicker:** does NOT exist as a Flow component (confirmed via pywa 3.9.0 SDK reference + 8x8 Connect docs + Meta error-code corpus). Option A for time-of-birth is infeasible; collapse to Option B (TextInput + `pattern` regex).
- **TextInput `pattern` regex:** supported since Flow JSON v6.2. Companion `error-message` for inline client-side failure copy. Length constraints `min-chars`/`max-chars`. Validation runs on the WhatsApp client before submission — no n8n round-trip.
- **`input-type: "email"`:** sets alphanumeric+@ keyboard but does NOT enforce format. For format enforcement, combine with `pattern`.

**Per-field decisions (all Option B — Flow-native pattern, zero n8n WF-22 guard code):**

| Field | input-type | pattern | min-chars / max-chars | error-message |
|---|---|---|---|---|
| `time_of_birth` | `text` | `^([01]?[0-9]\|2[0-3]):[0-5][0-9]$` (24-hr HH:MM) | — | "Enter time as HH:MM in 24-hour format (e.g., 14:30)" |
| `place_of_birth` | `text` | `^[A-Za-z][A-Za-z\s.'-]{2,59}\s*,\s*[A-Za-z][A-Za-z\s.'-]{2,59}\s*,\s*[A-Za-z][A-Za-z\s.'-]{2,59}$` (3 ASCII tokens, City/State/Country, 3–60 chars each) | max-chars: 200 | "Enter three parts separated by commas: City, State, Country (e.g., Mumbai, Maharashtra, India)" |
| `email_address` (NEW field) | `email` | `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` (pragmatic RFC-ish) | — | "Enter a valid email (e.g., name@example.com)" |

**Helper-text updates:**
- `time_of_birth`: keep existing "Format: HH:MM (e.g., 14:30)"
- `place_of_birth`: change to "City, State, Country (e.g., Mumbai, Maharashtra, India)"
- `email_address`: NEW — "We'll send your consultation summary here"

**Caveats accepted:**
1. Place-of-birth has no semantic check — admin reviews at consult time. Acceptable for MVP.
2. Place-of-birth regex is ASCII-only. Devanagari (`ऀ-ॿ` range) deferred to post-MVP — pipeline (Postgres UTF-8 text, n8n JS, Slack, Gemini) already supports it end-to-end; only the WhatsApp client `pattern` regex flavor support for `ऀ-ॿ` needs empirical testing. Logged to `followups.md`.
3. Place-of-birth min-3-per-token rejects 2-letter abbreviations ("MA", "US", "IN"). Helper-text nudges users to spell out.
4. DB sample-check (pending_users + users) **skipped** — admin review covers semantic semantics; sample-check would only inform regex strictness, which is already deliberately loose.

**Phase 2 (TD-PGF-01B) re-bracket:**
- Original L (~50K, worst case all-Option-C) collapses to **S (~25K)** — zero n8n guard code; pure Flow JSON v2 edits + `ALTER TABLE` + WF-22 one-field INSERT mapping + cutover.
- Recommend updating TD-PGF-01B's `**Size:**` and `**Estimated tokens:**` lines before starting Batch 2.

**Sources consulted:**
- pywa SDK Flow JSON reference (latest 3.9.0) — Python wrapper mapping 1:1 to Meta JSON kebab-case
- 8x8 Connect WhatsApp Flow component reference
- Heltar PATTERN_MISMATCH error-code corpus (confirms `pattern` + `max-chars` are kebab-case in actual Meta JSON)
- Meta Developers Components page (paywalled by WebFetch summarization; cross-referenced via the above)

Verification deferred to TD-PGF-01B Phase 2 build (publish v2 Flow → submit one form per field with valid + invalid input → confirm client-side inline error + successful submission round-trip).

## TD-PGF-01B — WhatsApp Flow form input validation — Phase 2 (build)

> Source tasks.md uses lowercase suffix `TD-PGF-01b`; uppercased here as `TD-PGF-01B`.

**Status:** 🔵 in-progress
**Priority:** P0 | **Batch:** 2
**Change type:** Structural + DB-Schema
**Workflows:** WF-22
**n8n IDs:** `dr8QM0m92Ml8MvIh` (WF-22)
**Depends on:** TD-PGF-01A (hard)
**Size:** S (re-bracketed 2026-05-26T22:58:01Z after TD-PGF-01A locked all-Option-B; original L bracket assumed worst-case all-Option-C)
**Estimated tokens:** ~25K
**Estimated effort:** ~60–90 min
**Started:** 2026-05-26T22:58:30Z

Apply chosen path per field (time/place/email). Schema migration: `ALTER TABLE chinmay_astro.users ADD COLUMN email_address text;` (confirmed needed via live information_schema check 2026-05-26). All three fields locked Option B (Flow-native `pattern` + `error-message`) per TD-PGF-01A decisions block — NO n8n WF-22 Code/IF guards needed.

**Work breakdown (all locked specs in TD-PGF-01A Decisions block):**
1. Edit cloned Flow `Collect Personal Details v2` (Meta Flow Builder): add `pattern`/`error-message`/`max-chars` per field per TD-PGF-01A spec table; ADD new `email_address` TextInput; update Footer `on-click-action.payload` to include `email_address: "${form.email_address}"`.
2. Postgres: `ALTER TABLE chinmay_astro.users ADD COLUMN email_address text;` (via docker-exec write path; not MCP — MCP is read-only).
3. WF-22 (`Insert User Details` Postgres node): add `email_address` to column list + parameter mapping. Single Postgres-node partial-update via MCP. No structural change.
4. Cutover: publish Flow v2 → swap `flowId` in WF-21 form CTA from `1408011897720771` → v2 ID. Keep v1 published as immediate-revert path.
5. Verify: submit one form per field with valid + invalid input; confirm client-side `error-message` shows inline for invalid; confirm successful submission writes all 4 collected fields (full_name, date_of_birth, time_of_birth, place_of_birth, email_address) into `chinmay_astro.users`.

Re-bracketed token estimate ~25K reflects this scope.

### Progress (session 2026-05-26 — paused for handoff at user request)

**Done:**
1. ✅ v1 baseline JSON saved at `workflows/flows/collect-personal-details-v1.json` (3,381 bytes — pre-change snapshot for revert).
2. ✅ v2 JSON authored at `workflows/flows/collect-personal-details-v2.json` (4,318 bytes — final lint-clean version after 3 Meta validator iterations; see methodology learnings in `followups.md`).
3. ✅ Postgres: `ALTER TABLE chinmay_astro.users ADD COLUMN email_address text` applied via docker-exec; verified column present with `is_nullable: YES` (backward-compatible for v1 form submissions during cutover window).
4. ✅ WF-22 `Create User Record` Postgres node updated via MCP `patchNodeField`: SQL now references `email_address` column ($6 parameter) in column list + VALUES + DO UPDATE SET; queryReplacement JS-array extended with `$json.email_address`. Verified post-PUT; `mcp__n8n__validate_node` strict profile returned `valid: true`. Exported to `workflows/dr8QM0m92Ml8MvIh.json`. Backup at `archive/backups/dr8QM0m92Ml8MvIh-2026-05-27-09-13.json`.
5. ✅ WF-22.pseudo Step 2 + Step 3 updated to reflect email_address in form-parse + INSERT (user approved 2026-05-26).
6. ✅ Meta Flow Builder: user pasted v2 JSON into cloned `Collect Personal Details v2` Flow; all 4 TextInput fields (full_name, time_of_birth, place_of_birth, email_address) validate correctly with the 3rd-iteration regexes. **Flow v2 saved as DRAFT — not yet published.**

**Methodology learnings captured (followups.md):**
- `input-type: "email"` rejected by Meta validator (allowed: `text, password, passcode, number` only)
- `\.` regex escape rejected — use `[.]` character class
- `*` quantifier on optional group does not backtrack — structure as `required-prefix + (optional-suffix)*`
- `helper-text` hard limit 80 chars

**Remaining (next session resume point):**
- **Step 4 — Cutover:**
  1. User publishes Flow v2 in Meta Flow Builder → records the **new Flow ID** (v1 ID is `1408011897720771`).
  2. Update WF-21 (`Welcome New User`) form CTA: swap `flowId` parameter from `1408011897720771` to the new v2 Flow ID. WF-21 n8n ID per registry.
  3. Keep v1 Flow published in Meta as immediate-revert path (do NOT delete).
- **Step 5 — End-to-end verify:**
  1. From a test phone, message the WhatsApp bot → receive welcome with "Fill Details" CTA (now points to v2).
  2. Open Flow → enter valid data including `email_address` → submit.
  3. Verify Postgres: `SELECT phone_number, name, date_of_birth, time_of_birth, place_of_birth, email_address, status FROM chinmay_astro.users WHERE phone_number = '<test phone>' ORDER BY updated_at DESC LIMIT 1;` — all 6 fields populated, status='payment_pending'.
  4. Confirm Slack `consult-<phone>` channel created by WF-52, payment instructions message arrives via WF-50.
  5. Smoke regression: try one invalid input per field (e.g., email without @, name with 1 word, place with 2 tokens, time as "abc") — confirm Flow rejects client-side with each `error-message`.
- **Sprint-state flip:** after Step 5 verifies, change TD-PGF-01B status `🔵 in-progress` → `✅ done`, record `Completed`, `Actual tokens`, `Actual effort`, `Estimate delta`. Then proceed to Batch 3 (TD-PGF-05 + TD-PGF-09 by-workflow execution on WF-25/23/30/44/31/43/50/32).

**Required from user before Step 4:**
- ✅ Done 2026-05-27: User published cloned v2 Flow in Meta → new published Flow ID = `2260297164474475` (the original `1408011897720771` v1 Flow ID was NOT updated; v1 Flow still serves the original baseline content; v2 content lives at the new ID).

### Step 5 verify — blocked on TD-PGF-13 + TD-PGF-14 (added 2026-05-27T00:54:52Z)

End-to-end verify attempted 2026-05-27T00:28Z surfaced a P0 onboarding blocker independent of TD-PGF-01B's own code changes:

**Symptom:** form submission from test phone `61466927921` reached WF-00 successfully (execution 2388) but errored in WF-01 (execution 2390) at `Call WF-02 Rule Router` with `WF-02 contract: messageContent required (string or empty string), got: null`. No row reached `chinmay_astro.users`.

**Root cause:** commit `a21eb60` (2026-05-25 02:57, data-contract-discipline Wave 1) introduced `Build WF-01 Envelope` Code node that does:
```javascript
const messageContent   = d.messageContent   || null;  // line 9
const messageContentUpper = d.messageContentUpper || null;  // line 10
```
JavaScript `||` treats `""` as falsy → emits `null` where upstream sent `""` (WF-00's correct emission for nfm_reply, since form data lives in `rawMessage.interactive.nfm_reply.response_json`). WF-02's entry guard rejects `null` but would have accepted `""`.

**Why undetected in CI/regression:** last successful form submission was 2026-05-24T08:01 (WF-22 #2193) — landed BEFORE commit `a21eb60`. Nobody submitted a form between 05-24 08:01 and 05-27 00:28, so this regression went uncaught for ~46 hrs.

**Side observations validated during this verify attempt:**
- Form fields (full_name, place_of_birth) accepted invalid inputs ("Jssj" — 1 token; "Skek" — 1 word). Form payload had no `email_address` field. This is because the published v2 Flow (ID `2260297164474475`) is bound to a different Flow ID than WF-21 references (`1408011897720771`). WF-21 served the original v1 baseline content (no validation, no email) for this test. Resolution = TD-PGF-14 (WF-21 Flow ID swap).
- Meta WhatsApp Flow "publish" creates a NEW Flow ID for the cloned Flow — does NOT update the original Flow ID. Methodology assumption corrected; document in followups.md.

**Step 5 final-verify resumes after TD-PGF-13 + TD-PGF-14 land.** Either incorporate into TD-PGF-11 final smoke gate, or run a focused re-verify of this exact happy path. Recommend folding into TD-PGF-11 (avoid duplicate ceremony).

## TD-PGF-12 — `||` vs `??` regression-pattern audit across all active workflows

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 2.5
**Change type:** Documentation (audit only — no JSON mutation)
**Workflows:** — (audit covers all active workflows)
**Depends on:** TD-PGF-01B (soft — must understand the failure before deciding remediation scope)
**Size:** XS
**Estimated tokens:** ~15K
**Estimated effort:** ~30–45 min

Audit every active workflow's Code nodes (and Set v3.4 contract-emit assignments) for the `||` fallback pattern applied to fields where `""` is a semantically valid value. The chinmay-astro Build WF-01 Envelope regression (commit `a21eb60`, data-contract Wave 1) used `const X = d.X || null` which silently converts empty strings to null on transport boundaries. Any other workflow that adopted the same pattern during the data-contract sprints is at risk of the same silent regression.

Audit method:
1. Fetch all active workflows to `/tmp/claude-scratch/` (script per CLAUDE.md "Bulk n8n Operations").
2. For each Code node `jsCode`, grep for `||\s*null` patterns whose left-hand side is a `messageContent`, `messageContentUpper`, `body`, `text`, `messageText`, `content`, or any field plausibly receiving `""`.
3. For each Set v3.4 node, inspect assignments where the value-expression uses `{{ ... || ... }}` pattern.
4. Classify each hit: (a) safe (field never `""` in practice — e.g., `phoneNumber` is always non-empty), (b) bug (field plausibly `""` — must convert to `??`), (c) unsure (needs runtime data).
5. Output: a list of (workflow, node, line, classification, fix-or-skip) → drives TD-PGF-13 scope.

Deliverable = expanded list of workflows requiring the `||` → `??` fix in TD-PGF-13.

## TD-PGF-13 — Apply `||` → `??` fix to WF-01 + any other workflows surfaced by TD-PGF-12

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 2.5
**Change type:** Surgical (per workflow) OR Batch Surgical (if many)
**Workflows:** WF-01 (`hYGNM97sXvdo1WmI`) — confirmed; additional workflows TBD per TD-PGF-12 audit
**n8n IDs:** WF-01 = `hYGNM97sXvdo1WmI`; others TBD
**Depends on:** TD-PGF-12 (hard)
**Size:** XS–S (depends on count)
**Estimated tokens:** ~15–30K
**Estimated effort:** ~30–90 min

Minimum scope (confirmed bug):
- WF-01 `Build WF-01 Envelope` jsCode: lines emitting `messageContent` + `messageContentUpper` → change `||` to `??`.
- WF-01 `Build WF-01 Envelope (Opted-Out)` jsCode: same fix per a21eb60 commit modifying both variants.

Expanded scope = whatever TD-PGF-12 audit surfaces.

Verify: re-test the failing scenario — send WhatsApp message → fill form → confirm WF-22 INSERT lands → row has all fields including `email_address` populated.

## TD-PGF-14 — WF-21 Flow ID update (1408011897720771 → 2260297164474475)

**Status:** ⬜ pending
**Priority:** P0 | **Batch:** 2.5
**Change type:** Surgical (single field on a single node)
**Workflows:** WF-21
**n8n IDs:** WF-21 = `zM8WbxSdt9nXRoLZ`
**Depends on:** —
**Size:** XXS
**Estimated tokens:** ~5K
**Estimated effort:** ~15 min

In WF-21 (`New User Welcome + Form`), the WhatsApp Flow CTA interactive message references Flow ID `1408011897720771` (the original v1 Flow). User published the cloned v2 Flow (with validation + email_address field) as a NEW Flow with ID `2260297164474475`. WF-21 needs to swap the referenced Flow ID to the new published Flow so onboarding triggers the v2 form with validation, not the v1 baseline.

Locate the field via grep: `jq '.nodes[] | select(.parameters.bodyParameters? // .parameters.body? // .parameters.body) | ...' workflows/zM8WbxSdt9nXRoLZ.json` for `1408011897720771` reference. Likely in a Set or HTTP node constructing the interactive payload.

Verify: trigger fresh onboarding (new user phone or wiped pending_users) → confirm form opens with email_address field + validation prompts on bad input.

After TD-PGF-13 + TD-PGF-14 both land, TD-PGF-01B Step 5 verify is unblocked (or absorbed into TD-PGF-11 smoke gate).

## Batch 2.5 — P0 unplanned hot-fixes (added 2026-05-27T00:54:52Z)

- **Items:** 3 (TD-PGF-12 audit, TD-PGF-13 fix-execution, TD-PGF-14 Flow ID swap)
- **Description:** Surfaced during TD-PGF-01B Step 5 verify attempt; blocks all onboarding form submissions. TD-PGF-12 runs FIRST (audits scope of TD-PGF-13). TD-PGF-13 + TD-PGF-14 can run in parallel after TD-PGF-12 completes. All P0 — must close before any P1 work (Batch 3) starts.
- **Estimated size:** S total (XS + S + XXS)
- **Estimated tokens:** ~35–50K depending on TD-PGF-12 audit findings
- **Execution model:** TD-PGF-12 sequentially first → TD-PGF-13 (driven by 12's output) + TD-PGF-14 (independent) in parallel inline

## TD-PGF-02 — WF-00 `nfm_reply` parse path missing switch case

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 4
**Change type:** Surgical
**Workflows:** WF-00
**n8n IDs:** `JQu1MkK5vgtUCeNO`
**Depends on:** —
**Size:** XXS
**Estimated tokens:** ~5K
**Estimated effort:** ~15 min

Add inner branch inside existing `case 'interactive':` in `Parse WhatsApp Message` jsCode — handles `message.interactive.nfm_reply` for Flow form submissions. Value choice locked: Option B (raw `response_json`) with Phase-1-confirm step (submit one form, inspect payload, confirm string shape). Fallback: Option A (`JSON.stringify(...)`) if Meta has changed field shape.

Drift-check description correction noted in source: TD-DRIFT-001's "default branch" symptom description was wrong — actual symptom is `messageContent` stays as initialized empty string. Pseudo no edit needed (WF-00.pseudo Step 2 already correct).

Verify: backup → MCP patchNodeField → submit one form → `SELECT id, message_type, content FROM chinmay_astro.messages ORDER BY id DESC LIMIT 1;` shows cleartext JSON.

## TD-PGF-03 — WF-11 internal Slack-payload builders emit legacy `message:` key (3 hits)

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 4
**Change type:** Surgical
**Workflows:** WF-11
**n8n IDs:** `GoTYo0GS2y8qjjkw`
**Depends on:** —
**Size:** XS
**Estimated tokens:** ~10K
**Estimated effort:** ~30 min

Three producer Code nodes in WF-11 (`Format List`, `Format Stats`, `Prepare HELP Text`) currently emit `{ channelName, message }`. Rewrite each to canonical `{ channelId, messageText }` per design.md §2.4. Audit paired consumer mapping on each `Send … To Admin` executeWorkflow node — if `messageText` reads `$json.message`, pair the rename.

Single batched PUT bundling producer rewrites + consumer mapping updates.

Verify: re-fetch → grep `message:` zero hits, `messageText:` 3+ hits → trigger HELP/LIST/STATS commands → Slack post arrives with text body.

## TD-PGF-04 — WF-60 messages.content double-quote wrap

**Status:** ⚪ obsolete
**Priority:** — | **Batch:** —
**Change type:** Surgical (would have been)
**Workflows:** WF-60
**n8n IDs:** `6H75p935FpBVBQtV`
**Depends on:** —
**Obsolete at:** 2026-05-26T11:20:00Z
**Obsolete reason:** Verified clean live. Quote-wrap bug was fixed in a prior session — current `Log to Messages Table` queryReplacement passes `$json.content` plain. Empty messages table explained by FK `ON DELETE CASCADE` from user-deletion clean-slate wipes (sequence at last_value=173 proves INSERT path works). No follow-up created. Full investigation in source Discussion Log.

## TD-PGF-05 — Drift items audit + remediate unclosed items

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 3
**Change type:** Structural (5 workflows)
**Workflows:** WF-23, WF-30, WF-44, WF-50, WF-32
**n8n IDs:** `VpCER0Vqq3NYJGpI` (WF-23), `gGJBY5fJha0Let8I` (WF-30), `Du2CJ3OTohRFZYoA` (WF-44), `BUVun38WEKb12zg9` (WF-50), `emUOLWVZiNVxcOe3` (WF-32)
**Depends on:** TD-PGF-09 (soft)
**Size:** S (alone) / L (combined with TD-PGF-09 in Batch 3)
**Estimated tokens:** ~25K standalone; ~24K share of Batch 3 combined PUTs
**Estimated effort:** ~75 min

Consolidates TD-DRIFT-009 + TD-DRIFT-013 + TD-DRIFT-015 + TD-DRIFT-026 + the original TD-PGF-06 (subsumed). All five resolve to: callers of WF-25 silently pass `undefined` for 3 critical fields (`userId`, `userStatus`, `messageText`) because the WF-01 envelope provides nested+canonical `user.id`, `user.status`, `messageContent`. Intent classification degraded across WF-23 / WF-30 / WF-44.

Per-caller fix (WF-23/30/44 `Call WF-25 Intent Classifier`): rewrite `workflowInputs.value` — `userId → $json.user.id`, `messageText → $json.messageContent` (rename key), `userStatus → $json.user.status`. WF-50 `Prepare Payload`: tighten fallback to require canonical `messageContent` (TD-DRIFT-012 already clean; safe to remove `|| input.message || input.messageBody`). WF-32 `Prepare Reassurance Message`: top-level `phoneNumber` read (cosmetic Canon-A drift).

Execution in Batch 3 by-workflow PUT — combined with TD-PGF-09's IF guard insertions on WF-23/30/44.

## TD-PGF-06 — WF-23 / WF-30 / WF-44 caller-side userStatus mapping verify

**Status:** ⚪ obsolete
**Priority:** — | **Batch:** —
**Change type:** Surgical (would have been; subsumed)
**Workflows:** WF-23, WF-30, WF-44
**Depends on:** TD-PGF-05 (subsumed)
**Obsolete at:** 2026-05-26T11:35:00Z
**Obsolete reason:** Subsumed into TD-PGF-05. Live audit confirmed this finding is the same root-cause systemic bug as TD-DRIFT-009 + TD-DRIFT-026 — three WF-25 callers expecting flat envelope fields that don't exist. Consolidated fix lives in TD-PGF-05's per-caller `workflowInputs.value` rewrite.

## TD-PGF-07 — WF-10 Build WF-41 Payload emits intermediate legacy adminMessage field

**Status:** ⬜ pending
**Priority:** P3 | **Batch:** 5
**Change type:** Surgical
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** —
**Size:** XXS
**Estimated tokens:** ~5K
**Estimated effort:** ~5 min

Two paired edits in WF-10: (1) `Build WF-41 Payload` Set node — rename output field `adminMessage` → `messageText`; (2) `Build WF-10 Relay Envelope` Code node — change read `inp.adminMessage` → `inp.messageText`. Pure cosmetic — external contract is already canonical; only the internal intermediate is legacy-named.

Source decision noted: bundling with TD-PGF-05 was a "lingering-cleanup" prevention preference, not technical dependency. Held in P3 batch since priority dominates.

Verify: backup → MCP partial-update → grep `adminMessage` in WF-10 zero hits in both target nodes → trigger one admin relay to confirm round-trip intact.

## TD-PGF-08 — WF-45 local Load User Record SELECT (envelope-everywhere completion)

**Status:** ⬜ pending
**Priority:** P3 | **Batch:** 5
**Change type:** Structural
**Workflows:** WF-45
**n8n IDs:** `MUG7rPgSHc7UtAE9`
**Depends on:** —
**Size:** XS
**Estimated tokens:** ~10K
**Estimated effort:** ~35–45 min

Lone remaining redundant user-data SELECT in the workflow corpus (live audit 2026-05-26T11:55Z). Rewrite all `$('Load User Record').item.json.X` reads → `$('When Executed by Another Workflow').item.json.user.X` (or top-level `phoneNumber` per Canon A). Remove `Load User Record` Postgres node. Rewire trigger → next downstream directly. Update WF-45.pseudo.

Closes envelope-everywhere universally — no "next envelope sprint" needs to exist after this.

Verify: re-fetch → grep `Load User Record` zero hits → trigger REBOOK from `consultation_closed` test user → WF-50 welcome lands → MCP `validate_workflow` zero strict errors.

## TD-PGF-09 — WF-25 Gemini-failure graceful UX (explicit halt + user-and-admin notification)

**Status:** ⬜ pending
**Priority:** P1 | **Batch:** 3
**Change type:** Critical-path / Workflow-Create
**Workflows:** WF-25, WF-23, WF-30, WF-31, WF-43, WF-44
**n8n IDs:** `eTV1lUcYrXBg2q2T` (WF-25), `VpCER0Vqq3NYJGpI` (WF-23), `gGJBY5fJha0Let8I` (WF-30), [WF-31/43/44 IDs from registry]
**Depends on:** TD-PGF-05 (soft)
**Size:** M (alone) / shares L Batch 3 with TD-PGF-05
**Estimated tokens:** ~30K standalone; ~26K share of Batch 3 combined PUTs
**Estimated effort:** ~2.5 hrs

Shape 2 locked (source 2026-05-26T12:10Z): execution halts on Gemini failure. WF-25 error branch rewrite — fan-out to `Send Apology via WF-50` + `Send Alert (consult) via WF-51` + `Send Alert (admin-log) via WF-51` + return sentinel `{intentResult: 'classifier_error'}`. Five caller workflows (WF-23/30/31/43/44) get `Is Classifier Error?` IF immediately after `Call WF-25` — TRUE terminates, FALSE continues existing routing.

Locked user-apology + admin-alert copy in source Discussion Log (subject to user review at build time).

Execution in Batch 3 by-workflow PUT — combined with TD-PGF-05's `workflowInputs` rewrite where they overlap (WF-23/30/44). WF-25 PUT goes first in batch (everyone else depends on its `classifier_error` sentinel). Smoke verification gates in Batch 6 Phase B.

n8n executeWorkflow contract assumption: error-branch return values arrive at caller's `Call WF-25` main output identically to success-branch returns. Verify at build time before relying on sentinel routing.

## TD-PGF-10 — Pseudo doc-hygiene bundle

**Status:** ⚪ obsolete
**Priority:** — | **Batch:** —
**Change type:** Documentation (would have been; deferred)
**Workflows:** —
**Depends on:** —
**Obsolete at:** 2026-05-26T12:25:00Z
**Obsolete reason:** Bulk 23-item pseudo cleanup deferred to post-MVP sprint per user direction (now tracked as TD-NEW-034 in `docs/sprint-tech-debt-2026-05-16-post-MVP.md`). The "in-sprint incremental drift-check practice" remains as execution discipline applied to every workflow this sprint touches — that is a build-sprint execution directive, not a discrete tracked item. Each touched item should log a `drift_check:` note (clean / trivial-folded / structural-deferred) in its execution notes; structurally-drifted findings feed TD-NEW-034.

## TD-PGF-11 — Fresh end-to-end smoke test (go-live gate)

**Status:** ⬜ pending
**Priority:** EXIT | **Batch:** 6
**Change type:** Smoke test (exit gate; not a code edit)
**Workflows:** — (cross-workflow verification)
**Depends on:** TD-PGF-01A (hard), TD-PGF-01B (hard), TD-PGF-02 (hard), TD-PGF-03 (hard), TD-PGF-05 (hard), TD-PGF-07 (hard), TD-PGF-08 (hard), TD-PGF-09 (hard)
**Size:** XS (token cost; multi-hour wall-clock activity)
**Estimated tokens:** ~10K
**Estimated effort:** ~90–120 min Phase A + ~45 min Phase B = ~2–2.75 hrs

Phase A — Happy-path journeys (~60 min): J-01 onboarding (verifies TD-PGF-01B + TD-PGF-02), J-04 free-form text classification (verifies TD-PGF-05 WF-30 fix), J-04 STOP, J-06 duplicate Payment-Completed (verifies TD-PGF-05 WF-32 fix), J-08 admin APPROVE PAYMENT, J-10 bidirectional relay (verifies TD-PGF-07 round-trip), J-11 close + post-consult, J-13 REBOOK channel reuse (verifies TD-PGF-08), J-19 opted-out re-engagement, admin HELP/LIST/STATS (verifies TD-PGF-03).

Phase B — Failure-path mini-smokes (~45 min): TD-PGF-09 forced-failure via cloned WF-25-test with unreachable Gemini host — verify apology + dual-channel admin alert + no degraded classification across all 5 caller states. Plus garbage classification → WF-46 block, STOP from payment_submitted → WF-47 atomicity, cross-channel admin command → DR-13 polite reject.

Skill: `n8n-whatsapp-methodology:smoke-test`. Use `monitor-test-run` for live observation.

Gate: no upstream item is marked ✅ done until its corresponding sprint-delta verification passes in Phase A or B.
