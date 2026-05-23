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
