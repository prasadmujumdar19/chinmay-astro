# Sprint inline-20260522-102910 — Followups

Findings surfaced during this sprint that are NOT in scope of the sprint's items but should be tracked.

## 2026-05-23 — SP-11 smoke test: form input validation (MVP blocker)

Surfaced during Test C (anomaly_interactive path verification): the WhatsApp Flow form WF-21 sends for onboarding is **functionally basic** — it accepts the four user-data fields without meaningful validation. Specifically:

- **Date of Birth** — currently a carousel/picker (constrained input — OK).
- **Time of Birth** — currently a free-text or basic field. Users can submit any garbage string (e.g., "morning", "around 4-ish", emoji). For accurate Vedic chart calculation, this needs structured input.
- **Place of Birth** — currently an open text field. Validation can only do so much (place names are inherently free-form), but the system relies on the customer entering something sensible. Garbage here directly impacts chart-quality.
- **Name** — text, no validation needed.

**Why this matters for MVP:** Bad form data flows directly into `users.date_of_birth / time_of_birth / place_of_birth` and is consumed by chart generation. Currently if the user submits garbage, the system happily stores it; Chinmay then receives a consultation request with un-usable inputs and has to re-prompt the user manually via Slack — defeating the form-driven onboarding promise.

**Open questions (to resolve before MVP release, NOT in this sprint):**

1. **Time of Birth — convert to carousel like DOB.** A picker constrained to HH:MM is the simplest fix. Confirm Meta's WhatsApp Flow Builder supports time-picker components (DOB already uses a date picker, so time-picker likely available).
2. **Place of Birth — must remain open text.** Investigate whether Meta provides:
   - Field-level regex/format validation on text inputs
   - Geocoding-style autocomplete (probably not in WA Flows)
   - Minimum/maximum length constraints
   - If none of the above: a downstream sanity check in WF-22 (e.g., reject if `place_of_birth` is shorter than 3 chars, contains only emoji/punctuation, or matches obvious garbage patterns) with a polite re-prompt via WF-50.
3. **What level of validation does Meta's Flow Builder currently support?** Need a short investigation (Meta docs + WA Flows Builder UI inspection) before designing the fix.

**Owner:** Defer scoping until ready to address. Tracked persistently in `docs/Tech_Debts.md` as TD-NEW-030 (P1).

**Crucial-to-fix-before-release** per user. Do NOT ship MVP without addressing.

---

## 2026-05-23 — SP-03 hoisted-gate design: Gemini-powered admin assistant (post-MVP)

Surfaced while drafting the WF-10 validation-gate decision tree. The "free text typed in `chinmay-admin-commands`" branch currently does the minimum graceful thing — replies with "Type HELP for commands." That's fine for MVP, but the admin channel is a natural place for a richer assistant.

**Idea (post-MVP):** Route any free-text (i.e., not a recognized command) typed in `chinmay-admin-commands` to a Gemini call with the admin manual / runbooks / workflow registry as the system prompt context. Admin can ask "how do I unblock a user?" or "what does state X mean?" and get an in-channel answer.

**Why later, not now:**
- MVP scope is operationally tight; HELP is sufficient for the small admin command set.
- Needs a curated admin-manual corpus (we don't have one cleanly extracted from `CLAUDE.md` + `workflow-registry.md` yet — would be its own deliverable).
- Cost monitoring: Gemini calls per free-text admin message could be unbounded if not gated.

**Disposition:** Add as a post-MVP enhancement TD when ready to pursue. Not blocking SP-03 (which only needs the graceful "Type HELP" reject for now).

---

## 2026-05-23 — Design debt: inline-vs-extracted handler consistency

Raised during the pre-Phase-F router-confirmation audit. WF-11 hosts the full handler logic for UNBLOCK, LIST, STATS, and HELP inline (SELECT/UPDATE + Slack confirmation in WF-11 itself), while APPROVE/REJECT/CLOSE/BLOCK are delegated to dedicated handlers (WF-33/34/42/46). The asymmetry is not a bug — BUG-05's single-owner principle is satisfied either way (WF-11 IS the sole emitter for the inline commands) — but it does mean two patterns coexist in the command-router layer, making the codebase less uniform for long-term maintenance.

**Disposition for now:** keep WF-11 inline for UNBLOCK/LIST/STATS/HELP. The extract test ("does the command have a downstream chain — sub-workflow calls, async fan-out, feedback flows?") is met by APPROVE/REJECT/CLOSE/BLOCK but not by the inline four. Extracting now would create 4 thin new workflows (each ≤3 nodes) and add 4× the smoke-test surface for no incremental safety.

**Revisit if:** (a) UNBLOCK gains downstream work — admin_actions re-enabled, audit hook, channel-membership management, post-unblock WA notification — or (b) the admin command set grows such that the inline branch in WF-11 becomes unwieldy (>30 nodes total).

**Tracked as:** design-debt followup; not a sprint blocker; no TD-NEW number assigned yet.

---

## 2026-05-23 — POST-MVP P1: WF-33 lacks transactional integrity (crucial-workflow atomicity)

Surfaced during Phase E1 attempt 1 (smoke exec 1782–1784). WF-33's `Update User Status` node ran FIRST and flipped `users.status` to `consultation_active`, BEFORE `Update Payment Status` (which matched 0 rows for the specific setup state) and `Create Consultation Record` (which then errored on unbound `$2`). User left stranded: `consultation_active` state + no consultations row + payment still `pending_verification`.

**Operator framing (2026-05-23 in-session decision):** business outcome is correct — the admin's APPROVE PAYMENT command IS the authority on payment-received; flipping `users.status` is the right business intent. But for **crucial workflows like payment approval, technical atomicity is required**: the workflow must execute fully OR roll back to original state. Partial execution that leaves the user in an inconsistent state is unacceptable.

**Scope of atomicity concern (not just WF-33):**
- WF-33 (Payment Approval) — current incident
- WF-34 (Payment Rejection) — same pattern likely; needs audit
- WF-42 (Consultation Close) — multi-step state + Slack + WA
- WF-46 (User Blocker) — multi-step state + Slack

**Two implementation paths to evaluate post-MVP:**
1. **Postgres transaction wrapping** — bundle the SQL mutations of each crucial workflow into a single transaction node (BEGIN; ... COMMIT;) so a failure rolls back. n8n's Postgres node supports raw transaction blocks. Pros: simple, atomic guarantee at DB level. Cons: doesn't help with Slack/WA side effects that have already fired.
2. **Reorder + guard pattern** — sequence the mutations so the user-state flip happens LAST, after every other mutation has succeeded. Each preceding node has an explicit "did this match >0 rows / did this succeed" guard that short-circuits to an admin error on failure. Pros: works across Postgres + Slack + WA; failure mode is graceful (admin sees "operation failed at step X"). Cons: more nodes, more pseudo work.

**Tracked as:** post-MVP P1 work tracker. Crucial-to-fix-before-public-launch — not blocking MVP soft-launch but blocking confidence in production reliability.

---

## 2026-05-23 — Methodology: smoke-test setup script must reset linked tables

Smoke-test reset commands in handoff (`UPDATE users SET status='payment_submitted'`) are insufficient for state transitions that depend on related-table rows. Phase E1 attempt 1 failed because the payments table still showed all rows `verified` from prior session — but `users.status='payment_submitted'` implies a `pending_verification` payments row should exist.

**Pattern to capture in monitor-test-run / smoke-test skill or this project's handoff:** when resetting test phone state, also reset / insert the related-table rows the new state implies:
- `payment_submitted` → INSERT a fresh `pending_verification` row in `payments` (₹500 UPI, link to user_id)
- `consultation_active` → ensure latest `consultations` row for this user is `status='active'` (or INSERT a new one)
- `consultation_closed` → ensure latest `consultations` is `status='closed'`

Could be encoded as a `scripts/smoke-reset.sh <phone> <target-state>` helper.

**Tracked as:** methodology improvement; project followup for now (would benefit other projects too — candidate for plugin uplift).

---

## 2026-05-23 — SP-05 deferred → "Contract-First Sub-Workflow Calls" multi-sprint initiative

SP-05 (WF-25 contract normalization to passthrough) was rescoped during audit phase and marked `needs-decision` rather than executed. Audit revealed 18 defineBelow+schema:[] sites across 6 workflows (WF-11/20/23/30/40/44) — wider than the handoff anticipated — and brought to surface that the principle ("make every workflow-to-workflow call honest about what it's doing") applies to EVERY sub-workflow call in the system, not just defineBelow ones.

**Audit JSON preserved at:** `docs/artefacts/sprints/inline-20260522-102910/audits/sp05-defineBelow-sites-2026-05-23.json` (5.6 KB, 18 sites with mapping classification).

**Audit summary:**
- 18 defineBelow+schema:[] sites total. WF-31 + WF-43 already on passthrough (handoff prediction correct).
- 48 mapping entries classified: 28 REDUNDANT (same-name $json.X → X — pure noise) + 20 RENAME/COMPUTED (cross-node references or templates).
- 9 sites convert as pure passthrough (drop value, switch mode).
- 9 sites need a Set node inserted before the call (WF-11 ×5 admin-message templates, WF-20 ×2 keyword-handler renames, WF-40 → WF-25 id→userId, WF-44 → WF-45 cross-node refs).

**Decision (2026-05-23):** Defer SP-05 implementation. Plan a dedicated multi-sprint "Contract-First Sub-Workflow Calls" initiative next session. SP-10's principle (c) is EXPANDED this session to cover the wider scope (every executeWorkflow call MUST have a caller-side Set node constructing the sub-workflow's documented Inputs contract; defineBelow is rejected at lint). New principle (n) added for pseudo Inputs contract declaration discipline.

**Initiative shape (to brainstorm + plan next session):**
1. **Phase 1 — Pseudo contract audit** (~2 hours, one-shot): Read all 12-13 sub-workflow pseudos; write tight Inputs contracts (required/optional, names, shapes, validity rules). Discriminated unions (e.g., WF-60's WhatsApp vs Slack) declared explicitly.
2. **Phase 2 — Call-site inventory** (~1 hour, mostly jq-automatable): Build matrix of every executeWorkflow call site project-wide (extend SP-05's 18-site audit to include currently-passthrough sites too).
3. **Phase 3 — Per-family conversion sprints** (~5 hours total, staged): Suggest families: WF-50/51/60 messaging utilities; WF-25 intent classifier; WF-45/47 lifecycle handlers; WF-02/41 routers. Mode D subagent dispatch is appropriate for the monotonous Set-node insertion work — Haiku, ~5-8 parallel across different workflows (same-workflow siblings stay sequential per build-sprint rules).
4. **Phase 4 — Lint hook deployment**: Reject executeWorkflow PUTs without immediately-upstream Set node; reject defineBelow at all; extend pseudo-drift-check to flag vague Inputs declarations.

**Why this matters functionally:** caller-side Set as the contract boundary makes the pseudo Inputs section runtime-enforced (not documentation only); refactoring a sub-workflow becomes a local edit at each caller's Set node (found via dependency-map.md); eliminates passthrough drift where callers accidentally work due to shared field vocabulary; inverts the Set v3.4 default-drops-fields hazard (SP-11 LESSON LEARNED) from foot-gun to feature.

**Tracked as:** multi-sprint architectural initiative. Not blocking MVP soft-launch but reduces silent-breakage risk in production. No TD-NEW number assigned — initiative-level work, captured here and in SP-05's `decision_required` field of the sprint state.

---

## 2026-05-23 — POST-MVP: WA-body rejection reason (gated on Razorpay integration)

Surfaced during Phase E2 (REJECT PAYMENT happy). After fixes A+B landed today, the admin's typed reason now persists to `payments.rejection_reason` and appears in the admin Slack ack. But the customer-facing WhatsApp body remains intentionally generic ("We couldn't verify your payment. Please check the details and try again. …"). Per WF-34.pseudo Step 7 + operator's MVP design call (2026-05-23): admin-typed reasons in the manual-UPI flow are admin-internal context, not customer guidance.

**Trigger to revisit:** Razorpay payment-verification integration (post-MVP). Once Razorpay is in the loop, the rejection reason will be machine-generated (e.g., "transaction reference not found", "amount mismatch", "duplicate UTR") and is genuinely actionable for the customer — at that point the WA body should surface it.

**Implementation when ready:**
- WF-34 `Prepare Rejection Message` jsCode/Set: include the reason field in the interactive button body. Conditional on Razorpay-source reasons being suitable for end-user display (whitelist + sanitize).
- WF-34.pseudo Step 7: update body template to include reason.
- Functional test case: verify a Razorpay-driven rejection lands the verifier's reason in both DB + Slack + WA.

**Tracked as:** post-MVP, gated on Razorpay integration. No TD-NEW number yet.

---
