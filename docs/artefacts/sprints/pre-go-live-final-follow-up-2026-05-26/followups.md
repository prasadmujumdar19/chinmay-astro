# Sprint Follow-ups — pre-go-live-final-follow-up-2026-05-26

## [2026-05-26] — TD-PGF-01B build (Meta Flow validator surprise)

- **Meta Flow `helper-text` hard limit: 80 characters or less** (live-verified 2026-05-26):
  - Initial widened full_name helper-text was 84 chars (`"First [Middle] Last (e.g., John Doe, Mary-Jane O'Brien, Maria Jose Rodriguez Garcia)"`); Meta Flow Builder rejected with explicit error: "TextInput 'full_name' helper-text should be 80 characters or less to avoid truncation on different screen sizes."
  - Trimmed to 57 chars: `"First [Middle] Last (e.g., John Doe or Mary-Jane O'Brien)"`.
  - **Methodology lesson:** when authoring Flow JSON, validate every `helper-text` value is ≤80 chars before pasting. pywa SDK documents this limit; cross-reference applied retroactively. Add to Flow JSON authoring checklist.

- **Meta Flow `pattern` regex engine appears to NOT backtrack on `*` quantifier — structure patterns with required parts FIRST** (live-verified 2026-05-26):
  - 2nd attempt `^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+([.][A-Za-z0-9-]+)*[.][A-Za-z]{2,}$` (using `[.]` to fix the `\.` issue) accepted `abc@gmail.com.au` but REJECTED `abc@gmail.com`.
  - Diagnosis: the `*` group `([.][A-Za-z0-9-]+)*` consumed all `.X` segments greedily, then the trailing `[.][A-Za-z]{2,}` was left with no input. A backtracking engine would release the last iteration to satisfy the trailing required match — Meta's engine apparently does not.
  - **Workaround pattern shape (live-verified pending):** put the required `.label` FIRST, then optional `*` group: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+[.][A-Za-z0-9-]+([.][A-Za-z0-9-]+)*$`. Trade-off: no TLD min-length constraint (accepts `abc@gmail.1` — exceedingly rare in real-world signups).
  - **Methodology lesson:** when authoring Flow JSON patterns for an unknown-engine validator, structure as `required-prefix + (optional-suffix)*` — never `(optional-prefix)* + required-suffix` because backtracking can't be assumed. Also confirms: `{m,n}` quantifiers work (used successfully in place_of_birth `\\s*` and email TLD `{2,}`); `[.]` character class works (used in place_of_birth and email).

- **Meta Flow `pattern` regex engine rejects `\.` escape OR is non-backtracking** (live-verified 2026-05-26):
  - Original email regex `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$` (with JSON-escaped `\.`) rejected `abc@gmail.com` in live Flow preview with "Email Address does not match the required format".
  - Root cause hypothesis: either (a) Meta's regex engine doesn't interpret `\.` as literal dot, or (b) it's non-backtracking (DFA-style, RE2-like) and the greedy `[A-Za-z0-9.-]+` consumed the literal dot before reaching the `\.` requirement.
  - **Workaround applied (live-verified pending user retry):** rewrote as `^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+([.][A-Za-z0-9-]+)*[.][A-Za-z]{2,}$` using (i) `[.]` character class instead of `\.` escape and (ii) explicit subdomain grouping that removes the backtracking ambiguity. Handles abc@gmail.com, user@mail.example.co.uk, etc.
  - **Methodology lesson:** when authoring Flow JSON `pattern` regex, prefer character-class form `[.]` over `\.` escape, and structure patterns to be unambiguous without backtracking (no overlapping character classes between greedy quantifier and following literal). Established `\s` works (place_of_birth pattern with `\\s*,\\s*` is accepted) — but treat backslash-escape support as not-guaranteed and use character classes when possible.

- **`input-type: "email"` rejected by live Meta Flow validator on chinmay-astro WhatsApp Business Account**:
  - Classification: methodology learning (capability finding contradicted by live behavior)
  - Source attestation: pywa SDK 3.9.0 + 8x8 Connect docs both list `email` as a valid `input-type` for TextInput in WhatsApp Flows.
  - Live behavior (verified 2026-05-26 via Meta Flow Builder paste error): validator rejects `input-type: "email"` with `Value should be one of: [text, password, passcode, number]`. The published docs are either out of date, region-restricted, or capability-flagged per account.
  - **Workaround applied:** v2 JSON uses `input-type: "text"` for email_address. The `pattern` regex still enforces RFC-ish email format client-side — only lost behavior is the @-symbol-optimized keyboard hint on mobile. Functionally equivalent for validation.
  - **Methodology lesson:** for Flow JSON capability questions in future sprints, do NOT trust 3rd-party SDK/docs alone for the input-type allowed set. Either (a) verify on a sandbox Flow against the live Meta validator before locking decisions, or (b) bound the answer to `[text, password, passcode, number]` (the known-conservative set) unless the project has empirically validated the additional types on its own account.

## [2026-05-26] — TD-PGF-01A decisions block

- **Devanagari support for place-of-birth regex** (post-MVP):
  - Classification: adjacent (out of MVP scope, deliberate deferral)
  - Decision: deferred to post-MVP per user direction
  - Current state: place-of-birth `pattern` regex in TD-PGF-01A locked spec is ASCII-only (`[A-Za-z]` character class).
  - Pipeline already supports Unicode end-to-end: Postgres `text` columns are UTF-8 default, n8n Code/Set nodes are JavaScript (full Unicode), Slack renders Devanagari natively, Gemini 2.5 Flash Lite handles Hindi/Devanagari prompts cleanly.
  - The only unknown is the WhatsApp client's `pattern` regex engine flavor — whether Unicode range `ऀ-ॿ` (Devanagari block) is accepted. Needs empirical testing on a published Flow.
  - Proposed post-MVP task: clone Flow v2 → modify place-of-birth `pattern` to include Devanagari range → publish to Meta sandbox → test single-form submission with Devanagari input → if client accepts, promote to production; if rejected with PATTERN_MISMATCH, document workaround (no client-side validation; fall back to admin review only).
