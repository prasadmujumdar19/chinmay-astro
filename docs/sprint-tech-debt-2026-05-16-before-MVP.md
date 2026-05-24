# Chinmay Astro — Tech Debt: Before MVP · 2026-05-16

**Created:** 2026-05-16  
**Source:** Functional code review gaps (docs/superpowers/FunctionalCodeReview_2026-05-14.html) + .methodology/sprint-tech-debt-2026-05-14-followups.md + docs/Tech_Debt_2026-05-14.md Batch 4 (partial)  
**Scope:** All items to address before smoke test and go-live. Items intentionally deferred post-MVP are NOT in this file — they remain in sprint-tech-debt-2026-05-14-followups.md.

---

## Priority Key

| Level | Meaning |
|-------|---------|
| 🔴 P0 | Functional blocker — breaks a core user journey |
| 🟠 P1 | Functional gap — must be verified/fixed before smoke test |
| 🟡 P2 | Code hygiene — important before go-live but not a smoke-test blocker |
| 🟢 P3 | Documentation — design intent clarification, no n8n changes |

---

## 🔴 P0 — Functional Blockers

### TC-0304 · WF-34 missing user status reset on payment rejection

**Finding (TC-0304):** WF-34 (`se82n3MUQ9xE5aEr`) updates `payments.status='rejected'` but does NOT update `users.status`. After rejection the user remains in `payment_submitted` — cannot retry payment. Admin must manually intervene to unblock the rebook flow.

**Fix:** After the `Update Payment Record` node in WF-34, add a Postgres node:
```sql
UPDATE chinmay_astro.users
SET status = 'payment_pending', updated_at = NOW()
WHERE phone_number = '{{ $json.phoneNumber }}'
```
The rejection message already includes a fresh GPay instructions + "Payment Completed" button — no change needed there.

---

## 🟠 P1 — Functional Gaps

### TC-0102 · WF-01 non-text message silently dropped with no deflection

**Finding (TC-0102):** WF-01 `Non-Text Message Filter` sets `messageTypeAllowed=false` → routes to `Silent Reject (Message Type)` which is a dead-end node — no outgoing connections, no message sent. Affects images, audio, reactions in all user states. User receives no feedback.

**Fix:** Connect `Silent Reject (Message Type)` in WF-01 to a WF-50 call with deflection message: *"Please send text messages only. Images and audio are not supported."* One new connection + one `executeWorkflow` node targeting WF-50 (`BUVun38WEKb12zg9`). Applies to all users regardless of status.

---

### WF-25-VERIFY · Verify phoneNumber wiring in all WF-25 callers

**Finding (TC-0107 / TC-0205 / TC-0802):** WF-25 (`eTV1lUcYrXBg2q2T`) handles `malicious_abusive` and `inappropriate` intents internally — calls WF-46 (block) then ends without returning to the caller. WF-25's internal block path reads `phoneNumber` from its `workflowInputs`. If any state handler omits `phoneNumber` when calling WF-25, the block silently fails and the user is never blocked (status stays unchanged or routes to WF-47 opt-out instead of WF-46 block).

**State handlers to verify:** WF-23 (`VpCER0Vqq3NYJGpI`), WF-30, WF-31. For each: fetch live workflow, inspect the `executeWorkflow` node that calls WF-25, confirm `workflowInputs` includes a populated `phoneNumber` field.

**Fix if missing:** Add `phoneNumber` to the caller's `workflowInputs` for the WF-25 call node. Surgical patch per workflow — no structural change.

**Smoke test:** After verification + any fixes, send a malicious message from a `payment_submitted` user and confirm DB shows `status=blocked` (not `opted_out`) after execution.

---

## 🟡 P2 — Code Hygiene

### TD-NEW-012 · WF-50 hardcoded Meta phone-number-id in HTTP Request URL

**Finding:** WF-50 (`BUVun38WEKb12zg9`) HTTP Request URL contains phone number ID `1104226366097236` as a literal string. WABA phone number changes require manual URL update in WF-50.

**Decision (2026-05-16): Accepted as-is — no action required.** Phone-number-id is a non-sensitive routing identifier, not a credential. It cannot be used to access the Meta account. It is not expected to change. The env var approach would require a VPS session + n8n container restart for no meaningful benefit. If the WABA number ever changes in future, update the HTTP Request URL in WF-50 manually — one field, trivial to find.

---

### TD-NEW-016 · No retry/timeout on WF-50, WF-22 encryption call, WF-43

**Finding:** WF-25 already has `retryOnFail=true, maxTries=3, timeout=10000` on its Gemini HTTP Request. WF-50 (Meta Cloud API call), WF-22 (encryption-svc call), and WF-43 (Gemini call) have no retry or timeout — transient failures cause silent drops or execution errors with no retry.

**Fix:** Add `retryOnFail=true, maxTries=3, timeout=10000` to all three external HTTP Request nodes:
- WF-50: Meta `/messages` HTTP Request node
- WF-22: encryption-svc HTTP Request node
- WF-43: Gemini HTTP Request node

---

### TD-NEW-018 · messages.created_at is timestamp without time zone

**Finding:** All other timestamp columns in `chinmay_astro` schema use `timestamptz`. `messages.created_at` is `timestamp without time zone` — inconsistent and may produce off-by-offset bugs when comparing across tables.

**Fix:**
```sql
ALTER TABLE chinmay_astro.messages
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at AT TIME ZONE 'UTC';
```

---

### WF-23-STOP · WF-23 missing stop_intent branch

**Finding:** WF-23 (`VpCER0Vqq3NYJGpI`) Pre-Form Intent Filter routes based on WF-25 output but has no `stop_intent` branch. If WF-25 classifies an ambiguous pre-form phrase (not the exact STOP keyword) as `stop_intent`, WF-23 sends a form re-prompt instead of routing to WF-47. Risk is low — explicit STOP keyword is intercepted upstream by WF-20 before WF-23 is reached.

**IMPORTANT — verify before implementing:** Fetch WF-23 live and trace the full execution path when WF-25 returns `stop_intent`. Understand exactly what node handles the false/unmatched branch (dead-end? default text? form re-prompt?). Present findings + proposed solution to user for explicit confirmation before making any changes.

**Fix (tentative, pending verification):** Add `stop_intent` output branch in WF-23's intent switch/router → call WF-47 (Unsubscribe Handler).

---

### WF-44-STOP · WF-44 missing stop_intent branch

**Finding:** WF-44 (`Du2CJ3OTohRFZYoA`) Feedback Recorder runs WF-25 for intent classification but has no `stop_intent` branch. If a user expresses desire to stop during the short feedback flow, WF-44 falls through to default handling (saves the "stop" intent as feedback text). Low risk — short interaction window, and explicit STOP keyword is caught upstream by WF-20 before WF-44 is reached.

**IMPORTANT — verify before implementing:** Same discipline as WF-23-STOP. Fetch WF-44 live, trace the full false-branch path, understand current behavior for unmatched intents. Confirm solution with user before implementing.

**Fix (tentative, pending verification):** Add `stop_intent` output branch in WF-44's intent switch → call WF-47 (Unsubscribe Handler).

---

### WF-60-CLEANUP · WF-60 dead legacy node deletion

**Finding:** WF-60 (`6H75p935FpBVBQtV`) contains 6 disconnected legacy nodes not connected to the trigger: `Inbound - Prepare Log Entry`, `Inbound - Log Message`, `Outbound - Prepare Log Entry`, `Outbound - Log Message`, `Get User ID`, and an old `Done` node. The legacy chain targeted `chinmay_astro.message_log` which does not exist (current schema uses `messages`). Pure dead code — no active path passes through these nodes.

**Fix:** Delete all 6 disconnected legacy nodes from WF-60. The active path (trigger → `Extract Message Data` → `Log to Messages Table` → `Done`) is unaffected.

---

## 🟢 P3 — Documentation

### TC-0305-DOC · Document channel-reuse design (no n8n workflow changes)

**Finding (TC-0305):** WF-42 (close consultation) intentionally does NOT archive the Slack channel. WF-45 (rebook) reuses the existing `slack_channel_id` from DB without calling WF-52 — no channel re-creation needed. This design decision is undocumented: it appears as a gap in journey maps and code review but is correct by design.

**Fix — documentation only, no n8n changes:**
1. **`docs/reference/user_journey_map.html`** — J-11 step: remove "Archive Slack channel"; add note: *"Channel intentionally kept open — reused by WF-45 on rebook."*
2. **`CLAUDE.md`** — Design Rules section: add rule: *"Consultation channels are intentionally never archived. The same channel is reused when a user rebooks (WF-45). Do not add archival to the close flow (WF-42)."*
3. **`docs/workflow-registry.md`** — WF-42 entry: add note cross-referencing WF-45 channel reuse. WF-45 entry: add note that it reuses existing `slack_channel_id` without calling WF-52.

---

## Summary Table

| ID | Issue | Priority |
|----|-------|----------|
| TC-0304 | WF-34 missing user status reset on payment rejection | 🔴 P0 |
| TC-0102 | WF-01 non-text silent drop — no deflection sent to user | 🟠 P1 |
| WF-25-VERIFY | Verify phoneNumber wiring in WF-23 / WF-30 / WF-31 → WF-25 callers | 🟠 P1 |
| TD-NEW-012 | WF-50 hardcoded Meta phone-number-id → ~~env var~~ accepted as-is (2026-05-16) | ~~🟡 P2~~ ⚪ Closed |
| TD-NEW-016 | No retry/timeout on WF-50, WF-22 encryption call, WF-43 | 🟡 P2 |
| TD-NEW-018 | messages.created_at is timestamp (not timestamptz) | 🟡 P2 |
| WF-23-STOP | WF-23 missing stop_intent branch (verify live before implementing) | 🟡 P2 |
| WF-44-STOP | WF-44 missing stop_intent branch (verify live before implementing) | 🟡 P2 |
| WF-60-CLEANUP | WF-60 — delete 6 disconnected legacy nodes | 🟡 P2 |
| TC-0305-DOC | Channel-reuse design: update journey map, CLAUDE.md, workflow-registry | 🟢 P3 |
