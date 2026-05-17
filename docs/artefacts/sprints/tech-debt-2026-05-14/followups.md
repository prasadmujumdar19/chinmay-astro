# Sprint Followups — tech-debt-2026-05-14

## 2026-05-15 — Functional code review gap decisions (interactive review session)

### TC-0305 — Slack channel not archived on consultation close (documentation action)
**Decision:** No code change. Channel reuse on rebook is intentional design — WF-45 reuses the existing `slack_channel_id` without calling WF-52. Archiving would break rebook.
**Action items:**
- [ ] Update `docs/reference/user_journey_map.html` J-11: remove "Archive Slack channel" step; add note that channel is intentionally kept open for rebook reuse
- [ ] Add to `CLAUDE.md` Design Rules section: *"Consultation channels are intentionally never archived. The same channel is reused when a user rebooks (WF-45). Do not add archival to the close flow (WF-42)."*
- [ ] Add note in `docs/workflow-registry.md` for WF-42 and WF-45 cross-referencing the channel-reuse design

### TC-0704 — WF-00 echo guard (FALSE POSITIVE — already fixed)
**Original finding:** Gap report said WF-00 lacked a sender-phone echo guard, P0 blocker.
**Live code re-verification (2026-05-15):** Guard already exists in `Parse WhatsApp Message` node:
```js
const botPhone = value.metadata.display_phone_number.replace(/\D/g, '');
if (message.from === botPhone) { return { skip: true, reason: 'Bot echo — outbound message reflected back' }; }
```
Dynamic — reads bot phone from webhook metadata, not hardcoded. No action needed.
**Root cause of false positive:** Original D4 subagent inspected the `Duplicate?` (dedup table) node and concluded that was the only guard, without tracing the earlier `Parse WhatsApp Message` node where the check actually lives.
**Lesson:** Always trace the full node list of a workflow before claiming a guard is missing. Do not stop at the node cited in the report.

### TC-0704 — ~~WF-00 missing echo guard (code fix)~~ — SUPERSEDED by false positive entry above
**Decision:** Fix before go-live. Add sender-phone guard in WF-00 parse step.
**Action:** In WF-00, after parsing the inbound payload, check if sender phone == bot WABA number (+919653240263). If yes, drop immediately (before dedup table check). Covers echo loop that messageId dedup alone cannot prevent.

### TC-0312 / TC-0313 — WF-41 relay guards (FALSE POSITIVES — both handled in WF-10)
**Original finding TC-0312:** WF-41 has no status guard — relays admin text to non-consultation_active users.
**Original finding TC-0313:** WF-41 has no null-user guard — admin-commands channel causes null phone_number crash in WF-50.
**Live code re-verification (2026-05-15):**
- **TC-0312:** Guard is in WF-10 (upstream), not WF-41. WF-10 path: `Command - User Channel ?` output 1 → `Load User Status` → `User Consultation Active?` IF → true: `Call WF-41` / false: dead-end. WF-41 only fires for confirmed consultation_active users. Implemented as TD-023 May 2026.
- **TC-0313:** WF-10 routes admin channel and user channel traffic on entirely separate branches (`Admin Vs User Channel?` switch). Admin channel non-commands dead-end at `Command - Admin Channel ?` switch — WF-41 is unreachable from that path. Null phone crash cannot occur.
**Root cause of false positives:** Gap report examined WF-41 in isolation without tracing back to WF-10's routing layer. Both guards are in the calling workflow (WF-10), which is architecturally the correct location.

### TC-0306 — WF-46 Slack channel archive on BLOCK (FALSE POSITIVE — already implemented)
**Original finding:** Gap report said WF-46 retrieved `slack_channel_id` but made no WF-52 call to archive the channel when blocking a user.
**Live code re-verification (2026-05-15):** WF-46 already archives the channel via a direct Slack node:
Full execution chain: `When Executed → Load User by Phone → Update User to Blocked Status → Send a message → Get User Slack Channel → Archive Slack Channel`
The `Archive Slack Channel` node is a native `n8n-nodes-base.slack` node — no WF-52 sub-workflow needed. Same result, different implementation.
**Root cause of false positive:** Gap report expected a WF-52 call (pattern from TC-0305 analysis) but WF-46 uses a direct Slack API node for archival. No action needed.
**Minor edge case (non-blocking):** No null-channel guard between `Get User Slack Channel` and `Archive Slack Channel`. If a user is blocked before completing form submission (no `slack_channel_id`), the archive step may silently error. Not a blocker for MVP.

### TC-0107 / TC-0205 / TC-0802 — Malicious intent routing (REASSESSED — verification action)
**Original finding:** State handlers (WF-23, WF-30, WF-31) dead-end on malicious/garbage intents; malicious routed to WF-47 (opt-out) instead of WF-46 (block).
**Reassessment (code-verified 2026-05-15):** WF-25 is NOT a pure classifier. It handles negative intents internally:
- `malicious_abusive` / `inappropriate` → Prepare Block Warning → Send Block Warning (WF-50) → Auto-Block via WF-46 → END (does not return to caller)
- `garbage` → Prepare Garbage Warning → Send Garbage Warning (WF-50) → Notify Admin (WF-51) → END
- Safe intents + `stop_intent` → Return to Caller
State handlers' false branch dead-ends are by design — WF-25 already acted. The "routes to WF-47" observation in TC-0205 may be a static-analysis artefact.
**Action items:**
- [ ] Verify all state handlers (WF-23, WF-30, WF-31) pass `phoneNumber` correctly when calling WF-25 — WF-25's block path reads `phoneNumber` from input; if missing, block silently fails
- [ ] End-to-end smoke test: send a malicious message from a `payment_submitted` user and confirm DB shows `status=blocked` (not `opted_out`) after execution
- [ ] Confirm WF-25's `Prepare Block Warning` message text is appropriate for users in all states (currently generic: "Your message has been flagged as inappropriate...")

### TC-0102 — Non-text message silently dropped with no deflection (code fix)
**Decision:** Fix before go-live. Wire non-text rejection path in WF-01 to WF-50.
**Action:** In WF-01, connect the 'Silent Reject (Message Type)' dead-end branch to WF-50 with deflection message: *"Please send text messages only. Images and audio are not supported."* Applies to all users in all states. One connection + one text node.

### TC-0304 — WF-34 missing user status reset on payment rejection (code fix)
**Decision:** Fix before go-live. Single fix: add `UPDATE users SET status = 'payment_pending'` to WF-34 after recording the rejection. Fresh button is already included in the rejection message — no additional work there.
**Note:** WF-30 handles benign free-form text during payment_pending correctly (wants_consultation → payment reminder; stop_intent → unsubscribe). Malicious/garbage dead-end in WF-30 is the same cross-cutting bug as WF-31 — covered by TC-0107/TC-0205/TC-0802 fix.

### TC-0702 — Blocked user attempt not logged to admin_actions (DEFERRED — post-MVP)
**Decision:** Defer to post-MVP. Silent drop is working correctly. Audit trail is a nice-to-have.
**Live code verified (2026-05-15):** WF-00 and WF-01 both confirmed — no INSERT to `admin_actions` or WF-51 notification on the blocked user path. `Silent Reject (Blacklist)` node in WF-01 is a true dead-end with no outgoing connections.
**Post-MVP fix (P2):** Add one Postgres INSERT node after `Silent Reject (Blacklist)` in WF-01: `INSERT INTO admin_actions (phone_number, event_type, created_at) VALUES ($phone, 'block_attempt', NOW())`.

## 2026-05-15 — UX gap found during functional code review (TC-0304 discussion)

- **WF-30** (Payment Pending Intent Filter) — UX: when a payment_pending user says "I just paid" (intent: `wants_consultation`), the bot responds with a payment reminder that ends with *"tap the 'Payment Completed' button you received earlier."* No fresh button is included in the reply — user must scroll up to find the original button from form submission. For MVP this is acceptable (explicit response is sent). **Tech debt: include a fresh interactive "Payment Completed ✓" button in this reminder response** so users don't have to scroll back. Low effort — change `{ message: paymentMsg }` to an `interactivePayload` with a button in WF-30's "Prepare Payment Reminder" node. Post-MVP / P2.

## 2026-05-14 — Post-batch P0 regression

- **WF-23** (Pre-Form Intent Filter): no `stop_intent` branch — if WF-25 returns stop_intent for an ambiguous pre-form message, WF-23 sends a form re-prompt instead of routing to WF-47. STOP keyword is caught upstream by WF-20 (now wired via TD-NEW-004), so risk is limited to ambiguous phrases only. Previously noted in handoff as low risk pre-go-live.
  - Found while verifying sibling of: TD-NEW-003 (WF-25 stop_intent change)

- **WF-44** (Feedback Recorder): no `stop_intent` branch — if WF-25 returns stop_intent during the feedback flow, WF-44 falls through without routing to WF-47. Low risk (short feedback interaction, STOP keyword caught by WF-20 upstream).
  - Found while verifying sibling of: TD-NEW-003 (WF-25 stop_intent change)

> Note: WF-43 is already tracked as TD-NEW-008 (P1). WF-30 ✅ and WF-31 ✅ confirmed to have stop_intent routing.

## 2026-05-14 — Found during TD-NEW-013 (Batch 3)

- **WF-60** (Message Logger, `6H75p935FpBVBQtV`): disconnected legacy chain present — `Inbound - Prepare Log Entry` / `Inbound - Log Message` / `Outbound - Prepare Log Entry` / `Outbound - Log Message` / `Get User ID` / `Done` are not wired to the trigger (active path is trigger → Extract Message Data → Log to Messages Table → Done). The legacy chain INSERTs into a `chinmay_astro.message_log` table that may not exist (current schema uses `messages`). Dead nodes — recommend deletion in a future hygiene pass (not in current sprint).
  - Found while: implementing TD-NEW-013 (fallback removal)
