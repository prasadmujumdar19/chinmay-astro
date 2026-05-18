# Followup — Three cascading bugs prevent free-text feedback from being captured (WF-43 chain)

**Severity:** [critical] (no free-text feedback can be saved today)
**Found during:** TC-0404 (post-consultation feedback), 2026-05-18 03:32 UTC
**Trigger:** User typed "Amazing service" after a successful CLOSE CONSULT. Expected: WF-43 → WF-44 → feedback saved + ack. Actual: WF-43 failed silently, user got nothing back.

## Failure trace

```
WF-00 (1266 error) ← propagated from below
└── WF-01 (1268 error) ← propagated
    └── WF-02 (1269 error) ← propagated
        └── WF-43 Post-Consultation Handler (1271 error) ← actual failure
            └── Gemini General Response (HTTP node) ← throws "JSON parameter needs to be valid JSON"
```

The trigger executions (1267 WF-60, 1270 WF-20, 1272 WF-25) ran to success in parallel; the failure is on the routing→Gemini branch.

## Three distinct bugs, in cascade order

### Bug 1 — WF-25 returned `intent: null` (intermittent, pre-known)

Per execution 1271 input snapshot, `Call WF-25 Intent Classifier` returned the original payload unchanged, with `intent` not populated. Classifier defaulted/failed.

This matches the **carried-forward caveat #2** from the resume handoff: "WF-25 Gemini intent classifier intermittent errors — defaults to `general_enquiry` when Gemini fails. Also has `userStatus` not flowing into prompt (P3 input-contract bug)."

Because intent was null, WF-43's routing IFs (`Feedback Intent?`, `Rebook Intent?`, `Stop Intent?`) all fell through to the default `Gemini General Response` branch.

**If WF-25 were reliable**, "Amazing service" would have been classified as `feedback`, the proper feedback-saving path would have fired, and Bugs 2 + 3 below would never have been hit. So WF-25 is the proximate trigger.

### Bug 2 — `Prepare Gemini Response Prompt` puts `User: undefined` into the prompt

Inspection of the `Prepare Gemini Response Prompt` node output (exec 1271):

```
geminiPrompt: "You are a helpful assistant for Chinmay's Vedic astrology consultation service on WhatsApp. Answer this question briefly and warmly in 2-3 sentences. If they seem interested in booking, mention they can start fresh by messaging us.\nUser: undefined"
```

The user's actual message ("Amazing service") sits in `$json.messageContent` on the same item — but the template references some other field that resolves to `undefined`. Even if Bug 3 were fixed, Gemini would receive an empty user question and produce a generic reply unrelated to what the user said.

**Fix:** find the variable reference in the node's `jsCode` (or Set field) and point it to `messageContent` or `rawMessage.text.body`.

### Bug 3 — `Gemini General Response` HTTP node — `jsonBody` doesn't escape the prompt

Node config:

```json
{
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "parameters": {
    "jsonBody": "={\"contents\":[{\"parts\":[{\"text\":\"{{ $json.geminiPrompt }}\"}]}],\"generationConfig\":{\"temperature\":0.7,\"maxOutputTokens\":200} }"
  }
}
```

`$json.geminiPrompt` contains a real `\n` character between the system prompt and `User: undefined`. When interpolated raw into the JSON template, the resulting jsonBody has an unescaped newline INSIDE a JSON string literal. JSON spec (RFC 8259) does not permit raw control chars (`U+000A`) in strings — they must be escaped as `\n`. n8n's HttpRequest v4.2 validates jsonBody before sending and rightly throws `"JSON parameter needs to be valid JSON"`.

This breaks for ANY multi-line prompt, ANY prompt with a literal double quote, and ANY prompt with a backslash. It's not specific to the `User: undefined` case — it would fire on any normally-constructed prompt with structure.

**Fix options (recommend A):**
- **A.** Replace `jsonBody` raw-string template with the structured `bodyParameters` UI form, or use an expression that returns a JS object: `={{ {"contents":[{"parts":[{"text": $json.geminiPrompt}]}], "generationConfig":{"temperature":0.7,"maxOutputTokens":200}} }}`. n8n then JSON-encodes the object correctly, escaping the prompt string.
- **B.** Escape the prompt manually: `{{ JSON.stringify($json.geminiPrompt).slice(1,-1) }}` inside the template. Brittle and easy to miss in code review.
- **C.** Switch to the dedicated Google Gemini node (if available in the n8n version in use), which handles serialization internally.

## DB confirms feedback was not captured

```
users.id=28
  status=consultation_closed
  awaiting_feedback=false
  feedback=null            ← user's "Amazing service" never persisted
  current_consultation_id=null
```

`consultations.id=9.feedback` (if exists as a column) — not checked here; worth verifying that no other table captured it either.

## Adjacent observation — `awaiting_feedback` semantics

`users.awaiting_feedback` is still `false` after WF-42 sent the feedback prompt with 2 buttons. Three possible interpretations:

1. The flag is button-payload-driven only (set on button tap, not on prompt send) — then free-text feedback was never intended to be routed via this flag, and the design relies entirely on WF-25 intent classification. This would mean WF-25 reliability is structurally critical to the feedback flow.
2. WF-42 was supposed to set the flag at prompt-send time but doesn't — a bug.
3. The flag is unused/legacy.

Reading WF-43's `Is Button Reply?` IF + `Feedback Intent?` IF suggests interpretation 1 is the design. If so, WF-25 unreliability is not just a P3 nuisance — it's a P0 for the feedback path.

## Recommended fix order

1. **Fix Bug 3 first** (HTTP JSON escape) — biggest blast radius, also surfaces clearer errors when downstream tests run.
2. **Fix Bug 2** (`User: undefined`) — small, contained.
3. **Investigate WF-25 reliability** (Bug 1) — this is the same `followups-wf25-intent-classifier.md` referenced in the resume handoff. May need its own sprint.
4. **Re-test TC-0404** with two cases:
   - Free-text feedback ("Amazing service") → expect WF-25 returns `feedback` → WF-43 → WF-44 → DB persists → user gets ack
   - Off-topic free-text in `consultation_closed` ("when is mercury retrograde") → expect WF-25 returns `general_enquiry` → WF-43 Gemini path runs without errors and replies sensibly

## Plugin improvement candidates from this finding

- `technical-workflow-review` should flag any HTTP node where `specifyBody=json` AND `jsonBody` is a raw string template containing `{{ ... }}` directly inside a JSON string literal — the safe pattern is to interpolate an object via `={{ ... }}` not a string.
- `technical-workflow-review` should flag Set/Code nodes building prompt-like strings where one of the values is `undefined` in the most recent execution. (Harder — needs execution data, not just JSON.) Worth considering for a runtime audit pass rather than static.
