# Story — Feedback + Rebook + Block exploratory (2026-05-16 evening)

### TC-0501 — Tap "Provide Feedback" button  ❌
Operator tapped the Provide Feedback button from yesterday's consultation-closure message. WF-43 ran cleanly through `Is Button Reply? → Is Rebook Button? → Prompt for Feedback → Send Feedback Prompt via WF-50` and the WhatsApp prompt landed. But the `users` row never moved — `stage` stayed `null` instead of flipping to `awaiting_feedback`. There is no UPDATE node anywhere on the Prompt-for-Feedback branch, so the system has no idea the next message should be treated as feedback. This is BUG-A: a missing DB write, not a logic error elsewhere.

---

### TC-0502 — Submit feedback text  ❌
Operator typed actual feedback. WF-43 routed it into its generic Gemini path (because BUG-A meant `stage` wasn't `awaiting_feedback`), and the `Gemini General Response` HTTP node immediately threw `JSON parameter needs to be valid JSON`. The cause is BUG-B: the jsonBody interpolates `{{ $json.geminiPrompt }}` as raw text inside a JSON string, so any user-typed quote, newline, or backslash breaks the JSON before the HTTP call is made. Reproduced twice — exec 1075 (feedback text) and exec 1081 (free-form rebook text) — same node, same error.

```diff
- ={"contents":[{"parts":[{"text":"{{ $json.geminiPrompt }}"}]}],"generationConfig":{"temperature":0.7,"maxOutputTokens":200} }
+ ={"contents":[{"parts":[{"text":{{ JSON.stringify($json.geminiPrompt) }}}]}],"generationConfig":{"temperature":0.7,"maxOutputTokens":200}}
```

---

### TC-0506 — Free-form "I want another consultation"  ❌
Same BUG-B crash as above (exec 1081). But the bigger finding is BUG-E: even with the JSON fixed, there is no dedicated `rebook_intent` reply in WF-43. Operator's intended contract — capture this verbatim for the fix sprint — is that free-form rebook intent must reply with both options: *"To book another consultation, you can either tap the 'Book Again' button from your last message, or send REBOOK as a new message."* That branch needs to be wired into WF-43 post-classification by WF-25.

---

### TC-0504 — Tap "Book Again" button  ❌
WF-43 correctly routed the `btn_rebook` button to WF-45. Inside WF-45, `Load User Record` and `Set status=payment_pending` ran successfully, then `Send Payment Instructions` died with "Workflow does not exist." This is BUG-C: the executeWorkflow node holds a resource-locator object instead of a plain string — exactly the F-04 class that was supposedly fixed yesterday for WF-47 but never audited across other WFs. The lint hook missed it. The damaging side effect is that the DB mutation happens *before* the failing call, leaving the user stuck in `payment_pending` with no payment prompt ever delivered.

```diff
- "workflowId": {"__rl": true, "value": "BUVun38WEKb12zg9", "mode": "id"}
+ "workflowId": "BUVun38WEKb12zg9"
```

---

### TC-0505 — REBOOK keyword  ⚠️ misleadingly "worked"
Operator sent the bare keyword `REBOOK`. The system replied with payment instructions — looked like success. But the message referenced "the Payment Completed button you received earlier", which is the days-old button from the original consultation, long gone. Investigation showed the keyword was never actually intercepted by WF-20: it fell through to WF-30's payment-pending intent filter, which re-emitted the generic payment reminder. This is two bugs at once — BUG-F (WF-20 silently ignored the keyword; see below) and BUG-D (the payment-pending re-prompt content needs a fresh interactive button, not a reference to a stale one).

---

### TC-0604 — STOP from payment_pending  ❌ → revealed root cause
Operator sent `STOP`. Expected: status → `opted_out`, WF-47 opt-out confirmation. Observed: WF-20 ran, then WF-30 ran, then a generic payment reminder was sent — WF-47 was never called and the user's state was unchanged. Drilling into WF-20's exec 1113 runData revealed BUG-F: the `Normalize Keyword` Set node reads `$json.messageText.trim().toUpperCase()`, but the incoming payload from WF-02 uses `messageContent`. The expression evaluates to `null`, the `Match Keyword` switch always lands on its default `Set Passthrough` branch, and the entire keyword interception layer is silently broken. This single bug explains every "keyword silently ignored" symptom across STOP, HELP, and REBOOK — fixing it should unlock the full TC-06xx surface in one change.

```diff
- ={{ $json.messageText.trim().toUpperCase() }}
+ ={{ ($json.messageContent || '').trim().toUpperCase() }}
```

---

### TC-0306 — Admin BLOCK in consult channel  ❌
Operator typed `BLOCK` (bare keyword, no phone) in the user's consult channel C0B3SA9JALX. WF-11 parsed it as `command=BLOCK, targetPhone=null, phoneNumber=""` and forwarded to WF-46. WF-46's `Load User by Phone` Postgres node then crashed with `there is no parameter $1`. Two bugs interacting: BUG-G is WF-11 not inferring the target phone from the consult channel name (the documented convention per CLAUDE.md Design Rule #3), and BUG-H is WF-46's `Load User by Phone` node not failing closed when given an empty phoneNumber — it throws a Postgres binding error instead of a clean validation message. Both are quick fixes but they're independent; both need to land.

---

### Where we ended the session

Eight bugs identified across the post-consultation, payment, keyword, and admin-command surfaces. The test user is left in an artificially-induced `payment_pending` state (BUG-C side effect) — should be reset to `consultation_closed` in DB before the next live test, or the BUG-C fix should be made to re-emit a fresh button when called against an already-`payment_pending` row. Operator is now moving into a bundled fix sprint covering BUG-A through BUG-H; deferred TCs (TC-0607 re-engagement, TC-0307 UNBLOCK, TC-0702 blocked-message-drop, plus TC-0304 REJECT and TC-0202/0205) will be exercised once the fixes land.
