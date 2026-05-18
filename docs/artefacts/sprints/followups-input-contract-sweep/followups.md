# Follow-ups discovered during sprint followups-input-contract-sweep


## 2026-05-18 — Batch 6 (P4) ICV audit

- **WF-01 / Silent Reject (Message Type) → Send Non-Text Deflection via WF-50** (`hYGNM97sXvdo1WmI`)
  - Found while: ICV-001 audit of upstream Code node output
  - Issue: Code node returns `{ silentReject: true, reason: 'message_type_not_allowed' }` — no `phoneNumber`, no `messageContent`. Goes directly into `executeWorkflow → WF-50`. WF-50's Prepare Payload defaults `messageType='text'` then falls into `__drop=true` (no content). The non-text deflection message is never actually sent to the user.
  - Design ambiguity: node name "Silent Reject" suggests intentional silent drop, but the existence of `Send Non-Text Deflection via WF-50` downstream suggests a deflection message WAS supposed to go out.
  - **Needs design decision before fixing:**
    - **Option A** — Silent drop is the design: remove the executeWorkflow call to WF-50 and just exit silently. Update node name to remove "Send Non-Text Deflection" misnomer.
    - **Option B** — Send deflection is the design: change the Code node to return `{ phoneNumber: input.phoneNumber, messageContent: "⚠️ Sorry, we only handle text messages right now. Please type your question." }`.

### ICV audit results — heuristic flags resolved (no action needed)

- **WF-25 / Prepare Garbage Warning (ICV-004), WF-25 / Prepare Block Warning (ICV-005), WF-31 / Prepare Under Review Message (ICV-006), WF-43 / Extract Gemini Reply (ICV-013)** all use the `{ phoneNumber, message }` shape. **Not broken** — WF-50's Prepare Payload already aliases `input.message || input.messageBody → messageContent` and defaults `messageType='text'`. Heuristic audit script flagged them because they don't literally contain `messageType`; manual verification confirms WF-50 handles the alias transparently.
- All other ICV-002, 003, 007, 008, 010, 011, 012, 014, 015, 016, 017, 018, 019: pass.

### 2026-05-18T11:30 — ICV-001 RESOLVED via Option B

User chose Option B: send deflection. Code node now returns:
```js
const d = $input.first().json;
return [{ json: { phoneNumber: d.phoneNumber, message: "⚠️ Sorry, we only handle text messages right now. Please type your question." } }];
```
Lives at WF-01 → "Silent Reject (Message Type)" (hYGNM97sXvdo1WmI). Verified live; lint clean.
Note for future audits: caller node name "Send Non-Text Deflection via WF-50" now accurately describes behavior.
