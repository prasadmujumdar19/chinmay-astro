# Phase C — Contract Reconciliation Comparison

Generated from 14 recon JSONs under `recon/`. Review and respond with:
- **Approve all** → I proceed to Phase D (pseudo edits)
- **Approve with edits** → tell me per-WF overrides
- **Defer specific WFs** → I mark them `needs-decision` in state.md

**Finding legend:** td = technical duplicate · fd = functional duplicate · tc = type contradiction · dp = dead-pass · cmr = caller-missing-required (latent bug)

## Summary table

| WF | Input Δ | Existing Input | Revised Input | Output Δ | Existing Output | Revised Output | Findings |
|---|---|---|---|---|---|---|---|
| WF-02 | ➕ additions | { user, pendingUser, messageType, rawMessage.interactive.type, messageContent } | **req**: user, messageType<br>opt: rawMessage, rawMessage.interactive, rawMessage.interactive.type, messageContent, pendingUser, contactName, isNewUser, messageContentUpper, messageId, metadata, phoneNumber, phoneNumberFormatted, routing, timestamp | ✅ no_change | { route, messageType, messageContent, user, pendingUser } | **req**: route<br>opt: user, messageType, messageContent, pendingUser, rawMessage, contactName, isNewUser, messageContentUpper, messageId, metadata, phoneNumber, phoneNumberFormatted, routing, timestamp | 0 |
| WF-21 | ✅ no_change | { phoneNumber, phoneNumberFormatted, contactName, id, messageId, messageContent, wasOptedOut } | **req**: phoneNumber, phoneNumberFormatted, contactName<br>opt: id, messageId, messageContent, wasOptedOut | ➕ additions | — | **req**: success, messageId, error, phoneNumber, sentAt | **1** (1dp) |
| WF-22 | ➕ additions | { phoneNumber, rawMessage } | **req**: messageId, phoneNumber, phoneNumberFormatted, contactName, messageType, messageContent, messageContentUpper, rawMessage, timestamp, metadata, isNewUser, user, pendingUser, route | ➕ additions | — | opt: success, channelId, channelName, channelUrl, isNew, messageId, error, sentAt, id, slack_channel_id | **6** (6dp) |
| WF-25 | ? messageText alias (WF-30) vs messageContent (WF-40/44): not uniformly named across callers | { phoneNumber, userId, messageContent, userStatus } | **req**: phoneNumber, userId<br>opt: userStatus | ? None | { intentResult, phoneNumber, userId, messageContent, userStatus } | **req**: intentResult, phoneNumber, userId<br>opt: messageContent, userStatus | **1** (1fd) |
| WF-40 | ? No delta. Existing contract matches revised contract. All inputs are accounted for by live code + execution evidence. | { phoneNumber, messageContent } | **req**: phoneNumber, messageContent | ? No delta. WF-40 does not emit structured return data; it only executes sub-workflows as side effects. Both main paths (normal relay + stop_intent clarifier) are accounted for in live code and pseudo. | { Slack message posted to user's consult channel, WF-50 clarifier sent for stop_intent } | **req**: Slack message posted<br>opt: Stop clarifier message sent | **1** (1dp) |
| WF-41 | ? No change. Existing contract { phoneNumber, adminMessage } is accurate and required. | { phoneNumber (req), adminMessage (req) } | **req**: phoneNumber, adminMessage | ? WF-41 has no output contract. It is a relay orchestrator (input → WF-50 invocation). Callers do not read WF-41's output; they rely on side-effects (WA message delivery + Slack logging via WF-50/WF-60). | { WhatsApp message sent to user } | opt: Implicit via WF-50 execution | 0 |
| WF-43 | ? FUNCTIONAL DUPLICATE: messageText (pseudo) vs messageContent (runtime); both strings, same semantic field. OPTIONAL FIELDS: intentResult populated by WF-25 passthrough; userId and userStatus passed to sub-WFs but not read in WF-43 decision logic. CALLER provides zero explicit inputs (passthrough mode, empty workflowInputs_schema + empty workflowInputs_value). | { phoneNumber, userId, userStatus, messageType, messageText, rawMessage } | **req**: phoneNumber, messageType<br>opt: messageContent, rawMessage, intentResult, userId, userStatus | ? All outputs are passed downstream to sub-workflows (WF-44, WF-45, WF-47, WF-50). No return contract to caller (WF-02). phoneNumber + message is the implicit sub-contract for WF-50 calls. | { Routes to WF-44 (feedback), Routes to WF-45 (rebook), Routes to WF-47 (unsubscribe), Sends WhatsApp reply via WF-50 (Gemini response or feedback prompt) } | **req**: phoneNumber + message<br>opt: no explicit data return to caller | **5** (1td·1dp·3cmr) |
| WF-45 | ? UNION: 1 sub_reads, 0 exec_inputs, 0 pseudo → 1 total | — | opt: phoneNumber | ? 0 from exec outputs + pseudo | — | — | **1** (1dp) |
| WF-46 | ? MATCH. Trigger reads three fields via passthrough: phoneNumber (required for DB lookup), reason and channelId (both optional with fallbacks). No schema defined in executeWorkflowTrigger (passthrough mode). Both callers (WF-11, WF-25) pass these fields via upstream set_assignments. | { phoneNumber (req), reason, channelId } | **req**: phoneNumber<br>opt: reason, channelId | ? MATCH. Final node (Prepare WF-51 Payload) emits {channelId, messageText}. Call WF-51 Notify Admin uses passthrough (no explicit schema), passing these fields downstream to WF-51. Execution data confirms both fields present in success run. | { channelId (req), messageText (req) } | **req**: channelId, messageText | **1** (1dp) |
| WF-47 | ? No change. Input contract confirmed: (phoneNumber: required string, userId: required string|integer, userStatus: required string). WF-43 uses passthrough mode, which is non-standard (expects full trigger input to match callee schema) — suggests WF-43 may have been added without explicit input mapping update, but no caller-side reads of WF-47 outputs mitigate any gap. | { phoneNumber (req), userId (req), userStatus (req) } | **req**: phoneNumber, userId, userStatus | ? WF-47 has no documented output contract and no caller-side reads. The workflow is terminal (executes Postgres updates and calls sub-WFs but does not return structured data to callers). Output contract remains empty. | { none documented } | unk: N/A — no caller-side reads detected | **2** (1tc·1cmr) |
| WF-50 | ? Existing pseudo has no Inputs section. Revised contract derives from 24 call sites + execution logic. Required intersection = phoneNumber only. Other fields are caller-optional variants (message XOR messageBody XOR interactivePayload). | — | **req**: phoneNumber<br>opt: message, messageType, messageBody, interactivePayload, userId, consultationId, templateParams | ? Existing pseudo has no Outputs section. Final node returns canonical shape for WF-60 logging. All callers implicitly consume messageType+content+phoneNumber (no explicit reads in caller code, but WF-60 depends on shape being consistent). | — | **req**: messageType, content, phoneNumber<br>unk: direction, userId, consultationId, whatsappMessageId, metadata | **6** (1td·2fd·1tc·1dp·1cmr) |
| WF-51 | ? Input contract matches pseudo. All 24 callers use passthrough (no field rename). Runtime execution confirms channelId + messageText only; userId/consultationId optional. | { channelId (req), messageText (req), userId, consultationId } | **req**: channelId, messageText<br>opt: userId, consultationId | ? Output contract matches pseudo. Slack API response (ok, channel, ts) returned to caller. WF-60 result not propagated (passthrough). No contradictions found. | { ok, channel, ts } | unk: ok, channel, ts | 0 |
| WF-52 | ? No changes. All three inputs align across pseudo, sub-workflow reads, and caller-side (WF-22). | { phone_number (or phoneNumber), name (or userName), userId } | **req**: phone_number, name, userId | ? No changes. All six fields (including conditional error) align with pseudo and code emits. | { success (boolean), channelId (string|null), channelName (string), channelUrl (string|null), isNew (boolean), error? (string, on failure) } | **req**: success, channelId, channelName, channelUrl, isNew<br>opt: error | 0 |
| WF-60 | ? No new fields | { transport, direction, messageType, content, userId, consultationId, whatsappMessageId, slackMessageTs, phoneNumber, slackChannelId, rawMessage, timestamp, contactName, success, error, metadata } | opt: consultationId, contactName, content, direction, error, messageType, metadata, phoneNumber, rawMessage, slackChannelId, slackMessageTs, success, timestamp, transport, userId, whatsappMessageId | ? No changes | { logged (boolean), logId (string, when logged=true), reason (string, when logged=false) } | unk: logged (boolean), logId (string, when logged=true), reason (string, when logged=false) | 0 |

## Per-WF findings detail

### WF-02 — findings detail


**Subagent notes:** WF-02 uses passthrough-mode trigger + passthrough-mode sub-WF calls. Input contract = all trigger fields from WF-01 (14 fields in execution sample). Output contract = input + computed route field (9 discrete route values). All calls to sub-WFs (WF-21/22/23/30/31/32/40/43) use passthrough — entire payload flows through. WF-01 single caller uses passthrough via IF node routing; no explicit schema defined in caller (workflowInputs_schema=[]). Pseudo accurately represents the 9 routes; contract matches: required inputs are (user, messageType, rawMessage.interactive.type, pendingUser) for routing logic. No missing fields, no dead-pass, no contradictions. Confidence: HIGH.


### WF-21 — findings detail


**Dead-pass (caller passes a field sub-WF never reads):**
- `messageType` passed by `['WF-01', 'WF-02']`

**Subagent notes:** Bundle bias: only 2 callers, both passthrough mode — required-input set equals existing pseudo Inputs. Final-node emits added to Output contract (existing pseudo Outputs section was empty). Dead-pass on messageType: comes via trigger from both callers but never read by WF-21 code. High confidence: 4 successful execution samples, zero schema drift. Source: written by main thread from subagent text result after Write permission was denied to the subagent.


### WF-22 — findings detail


**Dead-pass (caller passes a field sub-WF never reads):**
- `isNewUser` passed by `['WF-02']`
- `user` passed by `['WF-02']`
- `contactName` passed by `['WF-02']`
- `messageContent` passed by `['WF-02']`
- `messageContentUpper` passed by `['WF-02']`
- `metadata` passed by `['WF-02']`

**Subagent notes:** Only caller is WF-02 in passthrough mode — required-input set equals the full WF-02 trigger payload (14 fields). Per locked Decision #10 (defensive union), all 14 are part of the contract even though WF-22 only reads phoneNumber + rawMessage + parsed form fields. Six dead-pass fields are flagged for Sprint 2+ caller-side cleanup but do not block the Sprint 1 pseudo write. Output contract derived from WF-22's three downstream calls (Postgres insert, WF-52, WF-50) plus their returned fields. High confidence: 5 successful execution samples. Source: written by main thread from subagent text result after Write+Bash permissions were denied to the subagent.


### WF-25 — findings detail


**Functional duplicates:**
- candidates `None` — 

**Subagent notes:** Input contract is stable but has naming inconsistency: WF-30/WF-23 use messageText; WF-40/WF-44/WF-20/WF-41/WF-45 use messageContent. Code reads messageContent. Possible input aliasing in n8n trigger or upstream mismatch—needs verification in live WF-25 trigger node.


### WF-40 — findings detail


**Dead-pass (caller passes a field sub-WF never reads):**
- `messageType` passed by `Build WF-50 Clarifier Payload (hardcoded 'text' in line 570)`

**Subagent notes:** WF-40 is a relay orchestrator with no structured return type — outputs are side effects (Slack posts via WF-51, WhatsApp clarifier via WF-50). Caller (WF-02) uses mappingMode:passthrough, indicating no return data is expected. Trigger input contract verified against 5 execution samples: phoneNumber + messageContent are consistently present and correctly threaded through Load User Record → WF-25 → branching logic. No gaps, no dead fields, no type mismatches detected.


### WF-41 — findings detail


**Subagent notes:** Analysis complete. WF-41 is well-formed: single caller (WF-10) supplies required inputs; no orphaned fields; no output reads expected.


### WF-43 — findings detail

**Technical duplicates:**
- canonical `None` ← aliases `None`, callers: `None`

**Dead-pass (caller passes a field sub-WF never reads):**
- `None` passed by `None`

**Caller-missing-required (sub-WF reads a field NO caller passes — latent bug):**
- `None` — read by sub-WF, no caller supplies it
- `None` — read by sub-WF, no caller supplies it
- `None` — read by sub-WF, no caller supplies it

**Subagent notes:** WF-02 caller uses passthrough mapping (no explicit field assignments); all required inputs come from trigger context. Execution data confirms trigger provides phoneNumber, messageType, messageContent, rawMessage. Sub-WF calls (WF-25, WF-44, WF-45, WF-47, WF-50) are downstream passthrough — no explicit return to caller. Intent classification result (intentResult) is added by WF-25 call and used in downstream conditionals. Audit complete in <90s.


### WF-45 — findings detail


**Dead-pass (caller passes a field sub-WF never reads):**
- `phoneNumber`

**Subagent notes:** Caller sites: {'Route to Rebook': ['phoneNumber', 'userId'], 'Call WF-45 Rebook': ['phoneNumber', 'userId', 'userStatus'], 'Route to Rebook WF-45': []}


### WF-46 — findings detail


**Dead-pass (caller passes a field sub-WF never reads):**
- `commandType, command, subCommand, originalMessage, adminUserId, channelName` passed by `None`

**Subagent notes:** WF-46 contract is clean: required input (phoneNumber) is passed by both callers. Optional inputs (reason, channelId) have in-workflow fallbacks. Output is consumed by WF-51 (passthrough). Dead-pass fields from WF-11 are benign (WF-11's switch output contains routing metadata; WF-46 filters to needed fields). No type contradictions. Pseudo and live implementation align.


### WF-47 — findings detail


**Type contradictions:**
- `userId`: pseudo=`None` runtime=`None` (exec ids: None)

**Caller-missing-required (sub-WF reads a field NO caller passes — latent bug):**
- `None` — read by sub-WF, no caller supplies it

**Subagent notes:** ZERO successful WF-47 executions in runtime sample (executions.json is empty). All inferences are static: (1) input contract derived from defineBelow caller payloads + trigger parameter reads + live.json node expressions; (2) output contract is null because WF-47 does not explicitly return data and no callers read its result; (3) WF-43's passthrough mode is flagged as a potential data-mismatch risk but cannot be validated without runtime or closer inspection of WF-43's final node output schema. Recommend verifying WF-43's execute-node output against trigger schema before testing WF-47 end-to-end.


### WF-50 — findings detail

**Technical duplicates:**
- canonical `phoneNumber` ← aliases `['phoneNumber', 'phoneNumberFormatted']`, callers: `None`

**Functional duplicates:**
- candidates `None` — 
- candidates `None` — 

**Type contradictions:**
- `phoneNumber`: pseudo=`None` runtime=`string` (exec ids: None)

**Dead-pass (caller passes a field sub-WF never reads):**
- `messageType` passed by `None`

**Caller-missing-required (sub-WF reads a field NO caller passes — latent bug):**
- `phoneNumber` — read by sub-WF, no caller supplies it

**Subagent notes:** WF-50 has no documented input/output contract (pseudo is empty). Runtime contract is fragmented: 4 different field-name aliases for message content, 3 variants for phone-number sources. Found 1 MEDIUM severity gap (phoneNumber assumed but not passed explicitly in 20/24 sites). Recommend: (1) audit upstream Set nodes to verify phoneNumber always exists before WF-50 call, (2) establish single canonical field names for {message, phoneNumber, interactivePayload, messageType}, (3) update pseudo with this revised contract, (4) add input validation at WF-50 trigger (error handler if phoneNumber missing).


### WF-52 — findings detail


**Subagent notes:** WF-52 input/output contracts are well-defined and consistent. Pseudo, live.json code, and caller payload (WF-22) all align. No discrepancies detected. phoneNumber variant noted in pseudo but live.json references phone_number throughout — recommend normalizing to snake_case in pseudo doc if not already. All six outputs are accounted for; success is required, error is conditional. Caller (WF-22) reads all six output fields correctly.


### WF-60 — findings detail


**Subagent notes:** WF-60 is a simple logger: receives canonical multi-transport payload, inserts to messages table, returns {logged, logId/reason}. Pseudo accurately documents inputs (14 core + metadata). All high-cardinality fields (phone, slack_channel_id, consultation_id) are present in 5/5 sites. No contradictions detected. Output contract fixed.
