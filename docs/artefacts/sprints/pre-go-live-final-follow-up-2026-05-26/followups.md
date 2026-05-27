# Sprint Follow-ups — pre-go-live-final-follow-up-2026-05-26

## [2026-05-26] — TD-PGF-01B build (Meta Flow validator surprise)

- **Meta Flow "publish" of a cloned Flow creates a NEW Flow ID — does NOT update the original Flow's ID** (live-verified 2026-05-27):
  - User cloned the original v1 Flow as "Collect Personal Details v2", pasted v2 JSON, then published. Meta assigned a NEW Flow ID `2260297164474475` to the published v2 — the original Flow ID `1408011897720771` remained on the original v1 Flow (unchanged).
  - Onboarding workflows (WF-21) still referenced the original v1 Flow ID, so users opening the form received the original v1 baseline content (no validation, no email_address field) instead of v2.
  - **Methodology lesson:** when working with Meta Flows, "publishing a cloned Flow" creates a new Flow ID; "publishing an edit on the original Flow" keeps the same ID. To preserve original Flow ID, paste new content INTO the original Flow then publish — do not paste into a cloned Flow. Document this as a pre-requisite check in any future WhatsApp Flow cutover plan.
  - **Workaround applied (deferred to sprint TD-PGF-14):** update WF-21's referenced Flow ID from `1408011897720771` → `2260297164474475`. Alternative = republish v2 content into the original v1 Flow (preserves Flow ID, requires re-publish ceremony in Meta).

- **`||` vs `??` in n8n Code nodes — empty-string drop regression (introduced by data-contract-discipline Wave 1, commit `a21eb60`)** (live-verified 2026-05-27):
  - WF-01 `Build WF-01 Envelope` jsCode uses `const messageContent = d.messageContent || null;` (similar for `messageContentUpper`). JavaScript `||` treats `""` as falsy and emits `null` instead of preserving the empty string.
  - For nfm_reply (WhatsApp Flow form submission) messages, WF-00 correctly emits `messageContent: ""` (form data lives in `rawMessage.interactive.nfm_reply.response_json`, not in a text body). WF-01's envelope then drops it to `null`. WF-02's entry guard rejects `null` (correctly — contract says "string or empty string") but would accept `""`.
  - Last successful form submission: 2026-05-24T08:01 (WF-22 #2193, BEFORE the data-contract commit). Bug went uncaught for ~46 hrs because no form submissions occurred in that window.
  - **Methodology lesson (project-agnostic):** when authoring data-contract envelope/passthrough Code nodes, use `??` (nullish coalescing) instead of `||` for any field where `""` is a semantically valid value (e.g., message bodies, content fields, optional text). Same lesson applies to Set v3.4 assignment expressions where the source field might be `""`.
  - **Audit recommended:** any Code node in any active workflow that adopted the `||` envelope pattern during data-contract sprints. This is sprint item TD-PGF-12.

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

## [2026-05-27] — Batch 3 kickoff: Gemini-corpus audit + TD-PGF-09 redesign

### Audit findings

- **Gemini corpus-wide scan (2026-05-27T01:55Z, 27 active workflows):** 5 Gemini HTTP call sites in total.
  - WF-25 `Classify Intent` — has `onError: continueErrorOutput` but degrades silently today (TD-PGF-09 fixes).
  - WF-23 `Gemini General Response` — `onError: default`, halts caller execution silently on Gemini outage. **Fix in TD-PGF-09 this sprint.**
  - WF-30 `Gemini General Response` — same. **Fix in TD-PGF-09 this sprint.**
  - WF-31 `Gemini General Response` — same. **Fix in TD-PGF-09 this sprint.**
  - WF-43 `Gemini General Response` — same. **Fix in TD-PGF-09 this sprint.**
- **No non-HTTP Gemini paths found** (no googlePalmApi nodes, no langchain Google nodes, no Code-node SDK calls). All 5 sites are HTTP nodes hitting `generativelanguage.googleapis.com`.

### Design decisions locked this session

- **Halt-inside-classifier (not per-caller IFs).** WF-25 error branch terminates with Stop and Error after fan-out. n8n executeWorkflow error propagation handles caller termination. No caller IF edits required. Replaces the locked 2026-05-26T12:10Z "5 caller bail-guard IFs" design.
- **WF-40 (User → Admin Relay) intentionally excluded from TD-PGF-09 code edits.** Its existing `Stop Intent?` IF naturally rejects the classifier_error sentinel; admin still receives WF-25-side alert with the user's text embedded (admin can respond manually). Documented in state.md TD-PGF-09 session re-scope block.
- **Notification channel rule:** Inform Admin ALWAYS, inform User SCENARIO-BASED. All 5 current Gemini sites are WhatsApp inbound → both notify. Rule applies to future Gemini calls on Slack-admin inbound paths (admin alert only).
- **WF-30 `Is Pass-Through Intent?` IF cleanup:** Simplify to test only `stop_intent` (other 3 branches are dead code post-classifier-redesign — WF-25 terminates garbage/malicious/inappropriate internally with no return to caller). Folded into TD-PGF-05's WF-30 combined PUT.

### Plugin improvement candidates (for `flush-plugin-improvements`)

#### TD-PGF-PLG-001 · Always show consolidated functional view before proceeding

**Plugin:** `n8n-whatsapp-methodology`
**Skills affected:** `plan-sprint`, `build-sprint`

**Rule to add:** When the session covers multiple design questions, scope additions, scope removals, or design changes affecting more than one item, **always present a consolidated functional view** (table form: workflow | functional change in plain language | scope-in-or-out status) before proceeding to (a) finalize the plan in `plan-sprint`, or (b) implement in `build-sprint`. The view must use business language — no internal item-IDs (TD-XXX-NN), no node-type names, no operational jargon — so the user can verify scope and intent without reconstructing the technical analysis. After review the user gives explicit go-ahead; only then does plan-finalization (plan-sprint) or implementation (build-sprint) proceed.

**Why:** This session (Batch 3 kickoff of pre-go-live-final-follow-up-2026-05-26) accumulated five distinct changes during a single discussion thread — scope additions (4 Gemini sites + WF-30 IF cleanup), scope removals (5 caller IFs), design changes (halt-inside-classifier vs caller IFs), exclusions (WF-40), and channel-rule lock. Without a consolidated view at the end, the user would have had to mentally aggregate eight question-and-answer exchanges to confirm the final scope. The user explicitly requested the consolidated table; it took ~3 minutes to produce and prevented multiple downstream mismatch risks.

**Suggested wording for the skill change (rough draft, plugin author to refine):**
> "When the session covers ≥3 design decisions or any scope addition/removal affecting more than one item, before proceeding to plan-finalization or implementation, produce a consolidated functional view: (1) one row per workflow or item, (2) plain-language functional change description (no internal jargon), (3) explicit scope-in-or-out status including 'removed', 'added this session', 'documentation-only', and (4) a summary delta paragraph. Surface for explicit user go-ahead before proceeding."

**Project context preserved:** This was raised by the user during Batch 3 kickoff of `pre-go-live-final-follow-up-2026-05-26` sprint after working through WF-40 scope, halt-design redesign, and Gemini-corpus audit findings in a single thread.

#### TD-PGF-PLG-002 · Notification-channel rule for Gemini (and similar AI-call) error handling

**Plugin:** `n8n-whatsapp-methodology`
**Skills affected:** `build-workflow` (error-handling patterns section) or new pattern doc

**Rule to add:** When designing error handling for any external AI API call (Gemini, OpenAI, etc.) in an n8n workflow, default to: **Admin alert ALWAYS, User notification SCENARIO-BASED**. Specifically:
- If the workflow sits on a user-inbound transport (WhatsApp / SMS / public web), notify the user with an apology AND alert admin in their command channel + the relevant per-user channel (e.g., consult channel).
- If the workflow sits on an admin-inbound transport (Slack admin command), alert admin only — no user notification (admin IS the user-equivalent and the admin-alert path already informs them).
- Always halt execution at the AI error site (Stop and Error or equivalent); never silently degrade with a fallback intent/response that lets the workflow continue with low-confidence output.

**Why:** Project session 2026-05-27 surfaced 5 Gemini call sites with inconsistent error handling — 1 had degraded fallback (silent intent guess), 4 had no error branch at all (silent execution halt). The unified rule above gives a single decision tree for any future AI call, removing the per-site judgment cost.


## [2026-05-27] — Post-batch 3 regression

- **WF-25 `Classify Intent` HTTP node — `retryOnFail: false` (vs WF-23/30/31/43 Gemini General Response which all have `retryOnFail: true, maxTries: 3`).** Found while running Batch 3 post-batch Gemini-site sibling parity scan. Classification: **adjacent** finding (not in TD-PGF-09 strict scope — WF-25's Classify Intent was rebuilt in the previous session and already has the halt-and-notify chain; the missing retry is a separate hardening question). Cause-and-effect: a transient Gemini error on the classifier would skip retries and immediately fan out apology + admin alerts + Stop and Error. Acceptable for MVP; reduces user-visible noise on flakes. **Decision needed:** add retry to classifier (consistency) OR keep no-retry (faster fail, fewer user-visible halts on flakes). Proposed: keep no-retry — classifier failures are caught and reported clearly via halt-and-notify; retry-then-halt adds 6-12s latency to user-facing apology message. No followup action proposed unless user disagrees.


## [2026-05-27] — TD-PGF-08 envelope-everywhere completion deferred to multi-caller refactor

- **WF-45 `Load User Record` SELECT cannot be removed under current caller contracts.** Live audit of WF-45's 3 callers (WF-20 Keyword Handler, WF-43 Post-Consultation Handler, WF-44 Feedback Recorder):
  - WF-43 calls with `workflowInputs.value: {}` (passthrough — its upstream carries the WF-01 envelope including `user`).
  - WF-44 calls with `{phoneNumber, userId, userStatus}` only — NO `user` envelope.
  - WF-20 calls with `{phoneNumber, userId}` only — NO `user` envelope.

  Because 2/3 callers do not pass the user envelope, removing WF-45's SELECT would degrade the rebook welcome to "Welcome back there!" (the `'there'` fallback already in jsCode) for those callers. The audit's "remove redundant SELECT" prescription doesn't match reality.

- **Disposition (user-locked 2026-05-27, TD-PGF-08 needs-decision):** smaller-scope close. WF-45's SELECT stays; WF-45.pseudo updated to document the caller-contract rationale (Inputs block now declares the divergence and labels the SELECT as contract-required, not redundant). No live JSON change.

- **Post-MVP candidate (deferred — track as TD-NEW envelope-cascade-WF45-callers):** align WF-20, WF-43, WF-44 to pass the full `user` envelope alongside phoneNumber. Then WF-45's SELECT can be removed in a follow-up sprint that touches all 4 workflows together. Estimated S–M (~30–45 min) for the 4-workflow refactor. Not in scope for go-live; defers cleanly.
