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
