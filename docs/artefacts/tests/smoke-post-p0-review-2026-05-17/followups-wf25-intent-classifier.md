# Followup — WF-25 Intent Classifier issues (P2 / P3)

**Surfaced during:** smoke-test-post-p0-review free-form text test on 2026-05-17 ~14:56 UTC.
**Severity:** [major] — runtime fallback (default to `general_enquiry`) keeps the system functioning, but routing decisions for keyword-adjacent intents (`stop_intent`, `wants_consultation`, `rebook_intent`, `feedback_intent`, `garbage`, `malicious_abusive`) are not being made based on actual classification.

## Symptom 1 — Gemini call is erroring (likely credential)

Execution 1190 output shows:

```json
{
  "intentResult": "general_enquiry",
  "geminiError": true
}
```

`geminiError: true` is being set by WF-25's error-handling path. The classifier is returning the safe-default `general_enquiry` instead of an actual Gemini-computed result. Operator (user) reports: "last few executions have been going to error — we may need to check if our credential is working in first place, if that's working then it's some other issue."

**First diagnostic steps:**

1. Check the Gemini API credential `Zoxxxxxxxxxxxx` (whichever credential is wired to WF-25's HTTP Request node). In n8n UI: Credentials → Gemini → Test. If test fails: rotate the API key in Google AI Studio, update the credential, retry.
2. If credential test passes: inspect a recent failed execution of WF-25 — open the HTTP Request node's output panel and look at the actual HTTP status code + body. Common Gemini errors:
   - 429 — quota exhausted on the API key (free tier limits)
   - 403 — API key valid but Gemini API not enabled on the project, or wrong project linked
   - 400 — request shape changed (Gemini API revision; `gemini-2.0-flash-lite` model name may have changed)
3. If quota: switch to a paid tier or rotate to a fresh free-tier key.

## Symptom 2 — `userStatus` not flowing into the prompt

Same execution 1190's `geminiPrompt` shows:

```
User context: Status: unknown
```

But the user IS `payment_submitted` (verified in DB). WF-25's prompt template is reading `userStatus` from somewhere that's not getting populated by the caller (WF-31 in this case).

Likely cause: caller passes `userStatus` in a field name that doesn't match what WF-25's `Prepare Gemini Prompt` Code node reads. Inspect:
- WF-31's `Call WF-25 Intent Classifier` executeWorkflow node — what fields does it pass in `workflowInputs.value`? (Or is it `passthrough` mode, in which case the upstream's full payload is forwarded?)
- WF-25's "When Executed by Another Workflow" input schema — what fields does it expect?
- WF-25's prompt-building Code node — how does it read `userStatus`?

Lower severity (P3) than Symptom 1, but the same fix-side investigation surface.

## Recommended next step

Two separate sprint items:

1. **WF-25 Gemini credential investigation** — Surgical class. Operator should test the credential in n8n UI first; if it's a key issue, rotate and re-test. If it's a deeper Gemini API issue, technical-workflow-review on WF-25 + inspection of recent failed execution payloads.
2. **WF-25 input-contract bug** — Structural class on WF-25 (and possibly WF-31, WF-30, WF-23, WF-44 callers if they all share the wrong field name). Worth running `technical-workflow-review` on WF-25 with focus on the input contract; then fix callers as a Batch Surgical.

Out of scope for this smoke test. Capture both as a sprint pair.
