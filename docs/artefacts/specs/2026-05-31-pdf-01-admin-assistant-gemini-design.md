# PDF-01 — WF-10 Free-Text Admin Assistant (Gemini, static knowledge)

**Status:** Design locked — plan-ready
**Created:** 2026-05-31T10:53:27Z
**Sprint:** `pre-demo-minor-fixes-31May26` (rolling) · Item **PDF-01** · 🔴 P0
**Workflow touched:** WF-10 Slack Admin Handler (`wMh0oBRtJbvhLgOf`), `free_text` branch only
**Depends on:** none. **Blocks (soft):** PDF-02, PDF-03 (they extend this node).

---

## 1. Problem

When the admin (Chinmay) types free-form text in a Slack channel that is **not** a recognised
command, WF-10's `Route by Kind (Admin)` Switch routes it to the `free_text` output, which currently
runs `Build Help Prompt` (Set) → `Call WF-51 (Help Prompt)` and replies with a single hardcoded line:

> 🤖 Type `HELP` to see available commands.

This is a dead-end. Chinmay's real questions are two kinds:
1. **Ops** — "how do I approve payment?", "how do I close a consult?"
2. **User-advice** — "I've got a user asking me to unsubscribe her, what do I tell her?"

We want a Gemini-backed assistant on this branch that actually answers, with enough baked-in context
to be correct about *this* service's commands and policies.

## 2. Scope

**In scope (PDF-01):** Replace the hardcoded `free_text` reply with a Gemini call that answers from a
**static** knowledge base (no DB lookup). Bounded to the consultation-service admin domain.

**Out of scope (separate items):**
- **PDF-02** — feed the channel's current user state (`status / name / last action`) into the prompt so
  "this user…" questions get user-specific answers. Requires `consult-{phone}` → user resolution.
- **PDF-03** — feed recent message/consultation history. Weigh PII-into-LLM + token cost.
- Gemini **executing** commands. Commands continue to flow ONLY through the deterministic
  `Classify Admin Channel Message` Code node → `admin_wide` / `user_targeted` branches → WF-11. The
  assistant **advises**; it never acts. (It may *tell* Chinmay which command to type.)

## 3. Where it plugs in

`Route by Kind (Admin)` Switch, output **`free_text`** (1 item) — today:

```
free_text → Build Help Prompt (Set) → Call WF-51 (Help Prompt) → WF-51 posts to channel
```

After PDF-01:

```
free_text → Build Gemini Request (the admin's question + system KB)
          → HTTP Request: Gemini (gemini-2.5-flash-lite)   [onError: continue]
          → Did Gemini succeed? (IF)
                ├─ TRUE  → Extract Answer → Build WF-51 Payload (answer) → Call WF-51
                └─ FALSE → Build Fallback Payload (glitch msg) → Call WF-51
```

- **Channel:** post the reply to the **same channel the admin typed in** — reuse the `channelId`
  already carried on this branch (the current `Build Help Prompt` already posts there). Do not hardcode
  the admin channel.
- **Transport:** WF-51 `Send Slack Message` (`wlZRK0YxnhP0b2RL`), contract `{channelId, messageText}`.
  Unchanged. Message-logging via WF-60 is inherited from WF-51 — no extra wiring.
- **Gemini pattern:** reuse the established Gemini HTTP-Request pattern from the **inbound intent
  classifier** workflow (same credential, endpoint shape, `gemini-2.5-flash-lite` model — see
  `project_gemini_model.md`). Do **not** invent a new credential or endpoint. WF-10 has no existing
  LLM call to copy from — its classifier is a deterministic Code node.

## 4. Knowledge base (system prompt content)

The KB is **baked into the Gemini system prompt** (inline). If/when the KB grows past comfortable
prompt size, a later item can move it to a sub-workflow or datatable — **not** now (YAGNI).

> **DROP-IN ARTIFACT:** the full, ready-to-use Gemini **system prompt** is written verbatim at
> **`docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-prompt.txt`**. Build-sprint splices
> that text into the Gemini node **as-is** — no authoring/thinking required. The subsections below
> (4a–4d) document what that prompt encodes and why; they are the rationale, the `.txt` is the source
> of truth for the node content. The admin's free-text message is appended as the user turn after this
> system prompt.

### 4a. Identity & boundaries
- "You are the assistant for **Chinmay**, the astrologer running a WhatsApp-based Vedic astrology
  consultation service. You help him operate the service from Slack."
- Answer **only** questions about operating this service: commands, user states, payment, consultation
  flow, what to tell a user. **Politely decline** anything off-topic: *"I can only help with
  consultation-service questions. Type `HELP` to see the commands."*
- Never invent commands or capabilities. If unsure, say so and point to `HELP`.
- You **advise**; you do not perform actions. To make something happen, tell Chinmay the exact command
  to type.

### 4b. Commands (Design Rule 3a)
- **User-targeted** (carry a `<phone>`, accepted **only** in that user's `consult-{phone}` channel):
  `APPROVE PAYMENT`, `REJECT`, `CLOSE CHAT CONSULT`, `BLOCK`, `UNBLOCK`.
- **Admin-wide** (`LIST`, `STATS`, `HELP`): accepted ONLY in `chinmay-admin-commands`; rejected in `consult-{phone}` channels (DR-13 / SP-03 — corrected 2026-05-31 after live verification; the earlier "any channel" wording was stale CLAUDE.md DR-3a drift).
- **Aliases:** `APPROVE` ≡ `APPROVE PAYMENT`; `REJECT` ≡ `REJECT PAYMENT`;
  `CLOSE` ≡ `CLOSE CONSULT` ≡ `CLOSE CONSULTATION` ≡ `CLOSE CHAT CONSULT`.

### 4c. User state machine + key semantics
- Flow: `(form submitted)` → `payment_pending` → (user taps "Payment Completed") → `payment_submitted`
  → (admin `APPROVE`) → `consultation_active` → (admin `CLOSE`) → `consultation_closed`
  → (`REBOOK`/rebook intent) → `payment_pending`.
- `payment_submitted` → (admin `REJECT`) → `payment_pending`.
- Any state → (admin `BLOCK`) → `blocked`.
- Any state → (user texts `STOP`) → `opted_out`.
- **`opted_out` ≠ `blocked` (Design Rule 4):** `STOP` is user-initiated → `opted_out`; the user
  **re-engages automatically** by messaging again (no admin action needed). `BLOCK` is an admin action
  → `blocked`; reversed only by an explicit admin `UNBLOCK`.
- **Payment (Design Rule 8):** manual UPI, **₹500**, Phase 1 (no Razorpay yet).

### 4d. Answer style (the product behaviour the user picked)
- **Ops questions** → explain plainly. *e.g.* "How do I approve payment?" →
  *"In that user's consult channel, type `APPROVE PAYMENT` (or just `APPROVE`)."*
- **User-advice questions** → **explain the policy AND draft a ready-to-send WhatsApp reply** Chinmay
  can copy-paste to the user. The draft must:
  - be in the service's warm, professional business tone;
  - be clearly marked as a **suggestion** (e.g. a "Suggested reply:" label) so Chinmay knows to review;
  - **never** expose internal jargon — no WF-XX names, DB column names, status enum literals, or system
    field names ([[feedback_admin_message_tone]]). (Explaining *to Chinmay* may name commands like
    `APPROVE`; the **drafted user-facing text** must read as ordinary customer language.)
  - *Worked example* — "User asks me to unsubscribe her, what do I tell her?" →
    *Policy:* "She can opt out herself by texting `STOP`; she'll automatically re-engage if she messages
    again later — you don't need to do anything on your end."
    *Suggested reply:* "Hi 🙏 You can stop messages anytime by replying STOP. If you'd ever like to come
    back, just send us a message and we'll pick up right where we left off. 🌟"
- Keep replies **concise and Slack-friendly** (short paragraphs / light markdown; no walls of text).

## 5. Behaviour matrix

| Input on `free_text` branch | Gemini outcome | Reply posted to channel |
|---|---|---|
| In-scope ops question | success | Plain explanation (which command, where) |
| In-scope user-advice question | success | Policy explanation + labelled suggested WhatsApp draft |
| Off-topic / out-of-domain question | success (Gemini declines per prompt) | Polite "I can only help with consultation-service questions. Type `HELP`." |
| Empty / gibberish | success | Gentle nudge + `HELP` pointer |
| **Gemini API error / timeout / non-200** | **failure** | **Fallback:** "⚠️ I hit a technical glitch and couldn't answer that — please try again in a moment." |

- **Off-topic ≠ error.** Off-topic is a *successful* Gemini call whose answer is a polite decline
  (driven by the system prompt). The **technical-glitch** message is reserved for an actual API
  failure (HTTP node `onError: continueRegularOutput`, then the `Did Gemini succeed?` IF routes to the
  fallback payload). This split is per the user's explicit instruction.

## 6. Reliability / non-functional

- HTTP Request to Gemini: `onError: continueRegularOutput` so a Gemini outage never dead-ends the
  branch; the `Did Gemini succeed?` IF detects missing/invalid response and routes to fallback.
- No retry storm: a single attempt + graceful fallback (Chinmay can just re-ask). Do not add aggressive
  auto-retries that delay the Slack reply.
- typeVersions: when authoring fresh nodes, floor each new node's `typeVersion` to the **highest
  already present in live WF-10 for that node type** ([[feedback_typeversion_floor]]) — do not auto-pick
  latest. (Live WF-10 currently uses Set v3.4, IF v2.2, Switch v3.3, executeWorkflow v1.2.)
- Tech-error handling (alwaysOutputData / onError specifics) is implementation detail for build; this
  spec states the intent (never dead-end, always reply), not the n8n knobs
  ([[feedback_pseudo_tech_separation]]).

## 7. Acceptance criteria

1. Admin types "how do I approve payment?" in a consult channel → reply names `APPROVE PAYMENT`/`APPROVE`
   and says to type it in the user's consult channel.
2. Admin types "a user wants to unsubscribe, what do I tell her?" → reply explains `STOP`/auto-re-engage
   policy **and** includes a labelled, business-tone suggested WhatsApp reply with no internal jargon.
3. Admin types an off-topic question (e.g. "what's the weather?") → polite in-domain decline + `HELP`
   pointer; **not** the technical-glitch message.
4. Simulated Gemini failure (bad key / forced non-200) → the **technical-glitch** fallback is posted;
   the branch never silently drops.
5. Structured commands (`APPROVE`, `LIST`, etc.) are unaffected — they never reach the `free_text`
   branch; regression-check `admin_wide` / `user_targeted` paths still route to WF-11.
6. Reply lands in the **same channel** the admin typed in (not hardcoded to the admin channel).

## 8. Build notes (for plan-sprint / build-sprint)

- **Change type:** Structural, single workflow (WF-10). Add ~5–6 nodes on the `free_text` branch;
  remove or repurpose `Build Help Prompt`. No DB, no schema, no other workflow changed.
- **Pseudo-first:** revise `docs/pseudocode/WF-10.pseudo` for the `free_text` branch before editing live
  ([[feedback_pseudocode_first_refactor]]); then regenerate the AS-IS `.md`.
- **Backup before edit:** `scripts/backup-workflow.sh WF-10` (per CLAUDE.md).
- **Edit mechanics:** nested-array Set assignments — prefer jq-on-disk + curl PUT over MCP `updateNode`
  ([[feedback_n8n_mcp_nested_array_update]]). Write the Gemini system-prompt text via the Write tool to
  a file and splice it in (it contains markup/quotes that must not pass through a shell var)
  (CLAUDE.md "Expression as shell data").
- **Keep the KB prompt in one place** so PDF-02/PDF-03 can extend the same node.
```
