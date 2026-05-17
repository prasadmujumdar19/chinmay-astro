# TL;DR — Feedback + Rebook + Block exploratory (2026-05-16 evening)

**Verdict:** ❌ All four attempted test cases (TC-0501/02 feedback, TC-0504/05/06 rebook, TC-0604 STOP, TC-0306 BLOCK) blocked by bugs. **8 bugs identified — 1 critical root cause (BUG-F) explains multiple downstream symptoms.** Full coverage is unreachable without the bundled fix; no manual workarounds applied in-session. Test user left in `payment_pending` (stuck, see remediation).

## Bugs at a glance

| ID | Sev | Workflow | What broke | Fix outline | Status |
|---|---|---|---|---|---|
| **BUG-A** | `[major]` | WF-43 | "Provide Feedback" button branch writes WA prompt but never writes `stage='awaiting_feedback'` in `users`. Subsequent feedback text isn't recognized as feedback. | Add UPDATE node in `Prompt for Feedback` branch (or just before WF-50 call) setting `stage='awaiting_feedback'`. | Open |
| **BUG-B** | `[critical]` | WF-43 | `Gemini General Response` HTTP node — `jsonBody` interpolates `{{ $json.geminiPrompt }}` raw inside a JSON string. Any quote/newline/backslash in user text → "JSON parameter needs to be valid JSON". Reproduced exec 1075 and 1081. | Replace with `={"contents":[{"parts":[{"text":{{ JSON.stringify($json.geminiPrompt) }}}]}],"generationConfig":{"temperature":0.7,"maxOutputTokens":200}}` (drop surrounding quotes around the placeholder). | Open |
| **BUG-C** | `[critical]` | WF-45 | `Send Payment Instructions` executeWorkflow node — `parameters.workflowId` is a resource-locator object `{"__rl":true,"value":"BUVun38WEKb12zg9","mode":"id"}` on typeVersion 1. n8n throws "Workflow does not exist". Same regression class as F-04 (WF-47) supposedly fixed yesterday — lint hook missed it. | Convert to plain string `"BUVun38WEKb12zg9"`. Audit ALL executeWorkflow nodes across all workflows for the same regression. **Side effect:** `Set status=payment_pending` runs before the failing node — user state mutated without any payment-prompt delivery. | Open |
| **BUG-D** | `[major]` | WF-30 / WF-45 | After rebook, the payment-instructions message tells user to "tap the Payment Completed button you received earlier" — that button is from the original consultation flow, days old. For a fresh rebook, user must receive a NEW interactive "Payment Completed ✓" button. Also: free-form messages while in payment_pending (e.g. "I've already paid") hit the same dead button. | WF-45 must (re)send WF-50 with a fresh interactive button as part of payment instructions. WF-30 payment-pending re-prompt must also include a fresh button instead of referring to a stale one. | Open |
| **BUG-E** | `[major]` | WF-43 | Free-form rebook intent (TC-0506) has no dedicated reply. Operator-stated contract: respond with both options — *"To book another consultation, you can either tap the 'Book Again' button from your last message, or send REBOOK as a new message."* | Add a `rebook_intent` branch to WF-43 routing (post-WF-25 classification) that sends the two-options message via WF-50, no DB change. | Open |
| **BUG-F** | `[critical]` ⭐ root cause | WF-20 | `Normalize Keyword` Set node uses `={{ $json.messageText.trim().toUpperCase() }}`. The actual incoming field is `messageContent`. Result: `keyword` is always `null`, the `Match Keyword` switch always falls through to default `Set Passthrough`, and **every keyword (STOP / HELP / REBOOK) is silently ignored.** Confirmed exec 1113 runData. | Change to `={{ ($json.messageContent || '').trim().toUpperCase() }}`. Also verify `phoneNumber` / `userId` mappings — runData shows `userId: null`, so other fields may have drifted too. | Open |
| **BUG-G** | `[major]` | WF-11 | Admin typing bare `BLOCK` in a `consult-<phone>` channel does not infer the target phone from the channel name. WF-11 emits `targetPhone=null, phoneNumber=""` and forwards to WF-46. The Slack convention is that commands in a consult channel target that channel's user implicitly. | Either auto-extract phone from `channelName` when no phone token follows the command, or reject with a clear error message. | Open |
| **BUG-H** | `[major]` | WF-46 | `Load User by Phone` Postgres node fails with `there is no parameter $1` when called with empty `phoneNumber`. Likely missing `queryReplacement` when the value is blank. Even after BUG-G is fixed, this node should fail closed gracefully instead of throwing a Postgres binding error. | Audit the SQL + queryReplacement on `Load User by Phone`; add upstream guard to reject empty phoneNumber before the DB call. | Open |

⭐ BUG-F is the highest-impact fix — it unlocks the entire universal-keyword surface (TC-06xx) in one change.

## Test scope this session

| Scenario | TC | Outcome |
|---|---|---|
| Feedback button tap | TC-0501 | ❌ — BUG-A (stage not written) |
| Feedback text submission | TC-0502 | ❌ — BUG-B (Gemini JSON) |
| Free-form rebook text | TC-0506 | ❌ — BUG-B + BUG-E (no rebook_intent branch) |
| Rebook button tap | TC-0504 | ❌ — BUG-C (resource-locator object) |
| REBOOK keyword | TC-0505 | ⚠️ partial — BUG-F (keyword not intercepted) + BUG-D (stale button) |
| Free-form "I've already paid" | n/a | ⚠️ — BUG-D (stale button referenced) |
| STOP from payment_pending | TC-0604 | ❌ — BUG-F (keyword not intercepted; WF-47 never called) |
| Admin BLOCK from consult channel | TC-0306 | ❌ — BUG-G + BUG-H |

**Deferred to next session** (after fix sprint):
- TC-0607 — re-engagement after opt-out (blocked by BUG-F)
- TC-0307 — admin UNBLOCK (depends on TC-0306 succeeding)
- TC-0702 — blocked-user message dropped
- TC-0304 REJECT, TC-0202 duplicate Payment Completed tap, TC-0205 payment_submitted free-form, TC-0703 webhook dedup, TC-0314 unknown command fallback, TC-0309/0310 LIST/STATS

## State carry-forward

Test user 61466927921 is left in `status=payment_pending, stage=null, slack_channel_id=C0B3SA9JALX`. This is an artificial state caused by BUG-C's partial run. Before the next live test, either reset to `consultation_closed` in DB, or have the BUG-C fix re-deliver a fresh "Payment Completed" button so the existing state can be exercised through the legitimate path.

## Tomorrow's queue

1. Run the **fix sprint** for BUG-A through BUG-H (one workflow per build-workflow invocation, in dependency order: BUG-F first → BUG-C → BUG-B → BUG-A → BUG-E → BUG-D → BUG-G/H).
2. Re-baseline live testing from the resulting state and run TC-0604 → TC-0607 → TC-0306 → TC-0702 → TC-0307 → TC-0304 → TC-0205 → TC-0202.
3. Cross-cutting audit: grep every WF for executeWorkflow nodes still using resource-locator objects (BUG-C class) and for field-name drift between WF-02 outputs and downstream Set nodes (BUG-F class). Both classes should be added to the post-workflow-lint hook.
