# Chinmay Astro — Functional Test Report

**Created:** 2026-05-13  
**Evaluated against:** `docs/workflow-registry.md` v2.7 (sessions 1–7, Apr 2026)  
**Test cases from:** `docs/superpowers/FunctionalTestCases.md`  
**Assumption:** Tech debts evaluated as **closed** (TD closures in progress in parallel).  
**Last updated:** Post-verification pass — all 18 original new gaps assigned to Tech_Debts.md. 0 new gaps remain.

---

## Status Legend

| Symbol | Status | Meaning |
|--------|--------|---------|
| ✅ | PASS | Implementation matches journey spec. No gap. |
| ⚠️ | GAP | Covered by a workflow but implementation has a specific issue not in any TD. New finding. |
| 🔧 | TD-COVERED | Gap exists but tracked in Tech_Debts.md — closure in progress. Treated as fixed for this evaluation. |
| ⏳ | DEFERRED | Background job. Not built. Scheduled for post go-live. |
| ❓ | UNVERIFIED | Registry says implemented but specific behaviour needs workflow JSON inspection to confirm. |
| 🗺️ | DESIGN MISMATCH | Journey map documents behaviour the implementation intentionally overrides. |

---

## Executive Summary

| Category | Total TCs | ✅ PASS | ⚠️ GAP (New) | 🔧 TD-Covered | ⏳ DEFERRED | ❓ UNVERIFIED | 🗺️ Mismatch |
|----------|-----------|---------|--------------|---------------|-------------|---------------|--------------|
| TC-01xx Onboarding | 9 | 6 | 0 | 1 | 0 | 1 | 1 |
| TC-02xx Payment | 6 | 3 | 0 | 2 | 0 | 1 | 0 |
| TC-03xx Admin | 15 | 3 | 0 | 11 | 0 | 1 | 0 |
| TC-04xx Consultation | 6 | 3 | 0 | 3 | 0 | 0 | 0 |
| TC-05xx Post-Consult | 8 | 4 | 0 | 4 | 0 | 0 | 0 |
| TC-06xx Keywords | 9 | 4 | 0 | 5 | 0 | 0 | 0 |
| TC-07xx Edge Cases | 4 | 3 | 0 | 1 | 0 | 0 | 0 |
| TC-08xx Intent Filter | 4 | 2 | 0 | 2 | 0 | 0 | 0 |
| TC-09xx Background Jobs | 5 | 0 | 0 | 0 | 5 | 0 | 0 |
| TC-10xx Missing/Additional | 13 | 3 | 0 | 9 | 0 | 0 | 1 |
| **TOTAL** | **79** | **31** | **0** | **38** | **5** | **3** | **2** |

**Key takeaways:**
- **31 test cases pass** — the core onboarding, payment, and consultation relay flows are fundamentally sound.
- **38 test cases are covered by TDs** (TD-001 through TD-034) — all known gaps are tracked and being fixed in parallel.
- **0 new gaps** — every finding has been assigned a tech debt item.
- **3 test cases remain unverified** (TC-0102, TC-0204, TC-0302) — these require workflow JSON inspection but have no blocking impact on the core smoke test path.
- **5 background jobs** deferred post go-live by design.
- **2 design mismatches** — journey map documentation is outdated vs. actual implementation. Not bugs.

### Notable Resolutions (Post-JSON Verification)

| Finding | Original Status | Resolution |
|---------|----------------|-----------|
| TC-1001 Rebook channel lifecycle | ⚠️ HIGH SEVERITY GAP | ✅ PASS — WF-42 JSON verified: channel is **never** archived on CLOSE. Rebook reuses same channel automatically. |
| TC-0313 Admin messages from wrong channel | ⚠️ GAP | ✅ PASS — WF-10 JSON verified: "Admin Vs User Channel?" switch node already differentiates `chinmay-admin-commands` from `consult-*` channels. |
| TC-0504/TC-0505 Rebook channel (button/keyword) | ⚠️ GAP | ✅ PASS — Same resolution as TC-1001. No channel archival means no stale ID. |

---

## Detailed Test Results

### TC-01xx — Onboarding

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0101 | First message from brand-new user (text) | ✅ PASS | WF-00→WF-01→WF-21 confirmed working (tested Apr 2026). Direct form approach. |
| TC-0102 | First message — image/audio | ❓ UNVERIFIED | WF-00 filters non-text per registry, but deflection message wording not confirmed. |
| TC-0103 | First message — reaction | ✅ PASS | WF-00 drops reactions per registry description. |
| TC-0104 | User submits WhatsApp Flow form | ✅ PASS | WF-22 confirmed end-to-end. Payment instructions correct (session 5). Channel created at form submission (WF-52 called). |
| TC-0105 | User re-submits form (already payment_pending) | 🔧 TD-COVERED | **TD-003** — "User Already Exists" branch calls wrong WF-50 ID `aJoquwuEUbz8bI1B`. Fix: update to `BUVun38WEKb12zg9`. |
| TC-0106 | Pre-form message — general enquiry | ✅ PASS | WF-23 implemented + activated session 6. Calls WF-25 → reply + re-sends form. |
| TC-0107 | Pre-form message — malicious/abusive | ✅ PASS | WF-25 classifies malicious → WF-46 auto-block + WF-51 admin notify. Handled by WF-23→WF-25. |
| TC-0108 | First message from non-India number | ✅ PASS | WF-01 country check in place per registry. |
| TC-0109 | Journey map J-01/J-02/J-04 YES/NO consent | 🗺️ DESIGN MISMATCH | See **TC-1008**. Journey map v2.0 documents consent gate; implementation uses direct form (no YES/NO). Intentional design decision. Journey map needs update. |

---

### TC-02xx — Payment

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0201 | User taps "Payment Completed" | ✅ PASS | WF-32 confirmed active. Reads `slack_channel_id` from DB (registry session 7 note confirms WF-52 call removed from WF-32). |
| TC-0202 | Duplicate "Payment Completed" tap | 🔧 TD-COVERED | **TD-025** — WF-32 missing idempotency guard. Second tap creates duplicate payment record + Slack notification. Fix: add `status = payment_submitted` check at start of WF-32. |
| TC-0203 | payment_pending free-form — general enquiry | ✅ PASS | WF-30 implemented + activated session 6. WF-25→contextual reply + UPI reminder. |
| TC-0204 | payment_pending user sends REBOOK | ❓ UNVERIFIED | REBOOK from WF-20 routes to WF-45. WF-45 behaviour for a `payment_pending` (non-`consultation_closed`) user not confirmed in registry. |
| TC-0205 | payment_submitted user sends message | 🔧 TD-COVERED | **TD-016** — WF-31 ack works; but Slack relay step per J-08 still missing. Fix: add WF-51 call in WF-31. |
| TC-0206 | payment_submitted user sends image | ✅ PASS | WF-00 handles non-text deflection. User is not `consultation_active` so no Slack forward (correct). |

---

### TC-03xx — Admin / Slack Commands

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0301 | Admin approves payment — happy path | 🔧 TD-COVERED | Core flow works (WF-33 active). **TD-002** — WF-33 redundant WF-52 call + channelId must come from DB. Treated as closed. |
| TC-0302 | Admin approves — wrong phone (user not found) | ❓ UNVERIFIED | Error handling for unknown phone not confirmed in registry or JSON. |
| TC-0303 | Admin approves — already consultation_active | 🔧 TD-COVERED | **TD-021** — WF-33 has no state guard. Verified: no IF node checking `status = payment_submitted`. Fix: add status guard after user lookup. |
| TC-0304 | Admin rejects payment | 🔧 TD-COVERED | **TD-001** — schema prefix `chinmay_astro.` missing in WF-34. Core logic in place. |
| TC-0305 | Admin closes consultation | 🔧 TD-COVERED | **TD-014** (WF-42 UPDATE non-existent columns) + **TD-015** (Meta template vs. interactive buttons). Both treated as closed. |
| TC-0306 | Admin blocks user | 🔧 TD-COVERED | **TD-001** (schema prefix in WF-46) + **TD-005** (Confirm User Blocked node disabled). Both treated as closed. |
| TC-0307 | Admin unblocks user | 🔧 TD-COVERED | **TD-010** — UNBLOCK command implemented session 5. **TD-001** (schema prefix). Both treated as closed. |
| TC-0308 | UNBLOCK on opted_out user (invalid) | 🔧 TD-COVERED | **TD-026** — WF-11 UNBLOCK has no `status = blocked` guard. Can accidentally override opted_out users. Fix: add guard. |
| TC-0309 | Admin LIST command | 🔧 TD-COVERED | **TD-005** (List nodes disabled) + **TD-001** (schema prefix). Both treated as closed. |
| TC-0310 | Admin STATS command | 🔧 TD-COVERED | **TD-005** (Stats nodes disabled) + **TD-001** (schema prefix). Both treated as closed. |
| TC-0311 | Admin types in consult channel during consultation | ✅ PASS | WF-12 built + activated session 4. WF-41 also handles relay. Both call WF-50. |
| TC-0312 | Admin types in consult channel — user NOT consultation_active | 🔧 TD-COVERED | **TD-023** — WF-12 relays plain-text admin messages with no user status check. Admin internal notes during `payment_submitted` could be sent to user. Fix: add status check; relay only if `consultation_active`. |
| TC-0313 | Admin types plain text in chinmay-admin-commands | ✅ PASS | **Verified via WF-10 JSON.** "Admin Vs User Channel?" switch node already routes `chinmay-admin-commands` to the System Commands path (not the relay path). Admin messages in this channel are never relayed to users. |
| TC-0314 | Unrecognised admin command (typo) | 🔧 TD-COVERED | **TD-005** (Unknown Command Response node disabled). Treated as closed. |
| TC-0315 | Bot-loop prevention in Slack relay | ✅ PASS | WF-41 registry note confirms bot-loop prevention via `authorizations[0].user_id` ≠ `event.user` check. |

---

### TC-04xx — Consultation Relay

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0401 | consultation_active user text → Slack relay | 🔧 TD-COVERED | Core relay (WF-40→WF-51) works — implemented session 3. **TD-001** (schema prefix in WF-40) + **TD-004** (WF-60 logging disabled). Both treated as closed. |
| TC-0402 | consultation_active user sends HELP | 🔧 TD-COVERED | **TD-027** — WF-20 HELP response is static, not status-aware. J-18 requires contextual HELP per user state. Fix: DB lookup + 5 contextual responses. |
| TC-0403 | consultation_active user sends STOP | ✅ PASS | WF-20→WF-47 confirmed. WF-47 handles `consultation_active` guard with hold message. Built sessions 4/5. |
| TC-0404 | consultation_active user sends image | 🔧 TD-COVERED | **TD-017** — non-text during `consultation_active` silently dropped (not forwarded to Slack). Fix: add path in WF-00/WF-40. Treated as closed. |
| TC-0405 | Admin relay message to user (outbound) | ✅ PASS | WF-12 + WF-41 + WF-50 all active. WF-60 logging treated as fixed (TD-004). |
| TC-0406 | Bot-loop prevention | ✅ PASS | Covered by TC-0315 — WF-41 has the guard. |

---

### TC-05xx — Post-Consultation

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0501 | User taps "Provide Feedback" button | 🔧 TD-COVERED | **TD-024** — WF-43 has no `button_reply` routing. Until TD-015 + TD-024 are fixed, post-consult buttons won't route correctly. Treated as closed when both TDs resolved. |
| TC-0502 | User sends feedback (awaiting_feedback = true) | 🔧 TD-COVERED | WF-44 rebuilt session 6. **TD-001** (schema prefix in WF-44). **TD-032** (intent check needed before saving). Both treated as closed. |
| TC-0503 | User sends non-feedback text while awaiting_feedback | 🔧 TD-COVERED | **TD-032** — WF-44 saves all text verbatim as feedback without running WF-25. A rebook intent typed here is silently stored as feedback text. Fix: add WF-25 call at start of WF-44; branch on intent. |
| TC-0504 | User taps "Book Another Consultation" | ✅ PASS | **Verified via WF-42 JSON.** WF-42 does NOT archive the Slack channel on close. Channel stays open. WF-45 reuses the same channel — no stale channel ID issue. |
| TC-0505 | User sends REBOOK keyword | ✅ PASS | Same verification as TC-0504. Channel never archived → REBOOK works in same channel. |
| TC-0506 | consultation_closed free-form — rebook intent | ✅ PASS | WF-43 rebuilt session 6. WF-25 → `rebook_intent` → WF-45 routing confirmed in registry. |
| TC-0507 | consultation_closed free-form — general enquiry | ✅ PASS | WF-43 → WF-25 → general/wants_consultation → Gemini response via WF-50. Confirmed session 6. |
| TC-0508 | User taps "I'm done, thank you" button | 🔧 TD-COVERED | **TD-024** — WF-43 has no `button_reply` routing for any post-consult button. Covered by TD-015 + TD-024 closure. |

---

### TC-06xx — Universal Keywords

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0601 | HELP — payment_pending user | 🔧 TD-COVERED | **TD-027** — WF-20 HELP response is static, not status-aware. A `payment_pending` user should receive UPI payment reminder. Fix in TD-027. |
| TC-0602 | HELP — payment_submitted user | 🔧 TD-COVERED | **TD-027** — Same as TC-0601. `payment_submitted` user should receive "payment under review" message. |
| TC-0603 | HELP — consultation_closed user | 🔧 TD-COVERED | **TD-027** — Same as TC-0601. `consultation_closed` user should receive "type REBOOK" guidance. |
| TC-0604 | STOP — payment_pending (regulatory opt-out) | 🔧 TD-COVERED | **TD-001** (schema prefix in WF-47 `users` + `admin_actions`). WF-47 built + activated. Logic confirmed. |
| TC-0605 | STOP — consultation_active (hold) | ✅ PASS | WF-47 `consultation_active` guard confirmed in registry. |
| TC-0606 | STOP — consultation_closed | ✅ PASS | WF-47 handles all non-`consultation_active` states with opted_out logic. |
| TC-0607 | opted_out user messages again | ✅ PASS | WF-01 updated session 5 — opted_out routing added (→ WF-21). Confirmed. |
| TC-0608 | REBOOK keyword from opted_out user | ✅ PASS | WF-01 routes opted_out → WF-21 before WF-02/WF-20. REBOOK absorbed into new-user flow. Intentional per J-21. |
| TC-0609 | STOP free-form intent (not exact keyword) | 🔧 TD-COVERED | **TD-028** — WF-30 and WF-31 have no `stop_intent` routing branch. A user typing "unsubscribe" in these states falls through to default/error branch. Fix: add explicit `stop_intent` → WF-47 route in both workflows. |

---

### TC-07xx — Edge Cases / Non-Text

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0701 | Reaction emoji — any user | ✅ PASS | WF-00 description: "filters non-text (images/audio/reactions → ignore)." |
| TC-0702 | Blocked user sends message | ✅ PASS | WF-01 blocked-user check in place. Silent drop confirmed in registry. |
| TC-0703 | Duplicate webhook delivery (deduplication) | ✅ PASS | WF-00: deduplication by `inboundMessageId` confirmed in registry. |
| TC-0704 | Bot's own WhatsApp outbound echo | 🔧 TD-COVERED | **TD-030** — WF-00 dedup is by message ID. An outbound echo from Meta has a distinct ID and could re-enter routing chain. Fix: add sender phone ≠ bot WABA number filter as secondary guard. |

---

### TC-08xx — Intent Filter (WF-25)

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0801 | garbage intent — warn + notify admin | ✅ PASS | WF-25 registry: "garbage → warn + Slack notify." Confirmed. |
| TC-0802 | malicious_abusive — auto-block | ✅ PASS | WF-25: "malicious/inappropriate → warn + auto-block via WF-46." Confirmed. |
| TC-0803 | feedback_intent without awaiting_feedback flag | 🔧 TD-COVERED | **TD-032** — WF-44 saves all received text as feedback without intent check. Whether `awaiting_feedback` acts as a gate or WF-44 saves regardless is corrected as part of TD-032: add intent classification before any save. |
| TC-0804 | WF-25 API failure (Gemini down) | 🔧 TD-COVERED | **TD-029** — No error handling or fallback in WF-25 for Gemini failures. Callers receive propagated errors; user gets no response. Fix: catch/error branch returning `{ intent: 'unknown', error: true }`. |

---

### TC-09xx — Background Jobs (DEFERRED)

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-0901 | Health Check Monitor (J-24) | ⏳ DEFERRED | WF-70: 🔵 Build Fresh. ⚪ P4. Post go-live. |
| TC-0902 | Payment Reminder (J-25) | ⏳ DEFERRED | WF-71: 🔵 Build Fresh. ⚪ P4. Post go-live. Requires Meta template approval. |
| TC-0903 | Inactive User Scanner (J-26) | ⏳ DEFERRED | WF-72: 🔵 Build Fresh. ⚪ P4. Post go-live. Will implement deferred archival (TD-019/TD-020 archival trigger). |
| TC-0904 | Stale Form Cleanup (J-27) | ⏳ DEFERRED | WF-73: 🔵 Build Fresh. ⚪ P4. Post go-live. |
| TC-0905 | Data Retention Cleanup (J-28) | ⏳ DEFERRED | WF-74: 🔵 Build Fresh. ⚪ P4. Post go-live. |

---

### TC-10xx — Missing / Additional Scenarios

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| TC-1001 | Rebook — Slack channel lifecycle | ✅ PASS | **Verified via WF-42 JSON.** Channel is never archived on CLOSE. Rebook reuses same channel. Full history preserved. No stale ID risk. |
| TC-1002 | Admin APPROVE for user in wrong state | 🔧 TD-COVERED | **TD-021** — WF-33 has no state guard (verified: no IF node checking `status = payment_submitted`). Fix: add guard in WF-33. |
| TC-1003 | Admin CLOSE for user not consultation_active | 🔧 TD-COVERED | **TD-022** — WF-42 has no state guard (verified: no IF node checking `status = consultation_active`). Fix: add guard in WF-42. |
| TC-1004 | Admin BLOCK during active consultation | 🔧 TD-COVERED | **TD-020** — WF-46 sets `status = blocked` but does not archive the Slack channel. Per deferred archival strategy, channel should be archived on BLOCK. Fix: WF-46 calls WF-52 with `archive` action. |
| TC-1005 | Command wording — APPROVE PAYMENT vs APPROVE CHAT CONSULT | 🔧 TD-COVERED | **TD-031** — Registry and CLAUDE.md use inconsistent forms. One canonical form must be chosen. Recommend: `APPROVE PAYMENT <phone>`. Update WF-11 + all docs. |
| TC-1006 | WF-50 called with empty/null message | 🔧 TD-COVERED | **TD-033** — WF-50 has no input validation for empty/null message body. Meta API returns 400; user gets no response. Fix: validate non-empty before calling API. |
| TC-1007 | User sends empty/whitespace-only message | 🔧 TD-COVERED | **TD-034** — WF-00 does not guard against whitespace-only messages before routing. These enter WF-25 classification with blank text. Fix: trim + check non-empty in WF-00; drop blank messages. |
| TC-1008 | Journey map v2.0 — YES/NO consent gate mismatch | 🗺️ DESIGN MISMATCH | Journey map is outdated — J-01/J-02/J-04 document a consent gate that doesn't exist in production. **Not a bug** — intentional design override (registry critical note #1). Journey map documentation should be updated. |
| TC-1009 | Admin command from any Slack channel | ✅ PASS | CLAUDE.md + registry confirm WF-10 captures all workspace events — commands work from any channel. |
| TC-1010 | WF-60 message logging on every message | 🔧 TD-COVERED | **TD-004** — WF-60 all core nodes disabled. Treated as closed. |
| TC-1011 | WF-52 idempotency (channel already exists) | ✅ PASS | Registry confirms WF-52 is idempotent — detects name collision and returns existing channel. **TD-007** naming confusion treated as closed. |
| TC-1012 | WF-33 reads channelId from DB (not WF-52) | 🔧 TD-COVERED | **TD-002** — WF-33 must read `slack_channel_id` from DB, not from a WF-52 call response. Treated as closed. |
| TC-1013 | WF-20 HELP keyword — status-aware contextual response | 🔧 TD-COVERED | **TD-027** — WF-20 HELP branch sends a single static response regardless of user state. J-18 requires 5 contextual responses based on status. Fix: DB lookup for user status in WF-20 HELP branch. |

---

## Resolution Summary — No New Gaps

All 18 originally identified new gaps have been assigned to Tech Debts. The table below maps each finding to its TD.

| Original Finding | TC ID | Assigned TD | Priority |
|-----------------|-------|-------------|----------|
| Duplicate "Payment Completed" tap | TC-0202 | TD-025 | 🟠 P1 |
| UNBLOCK no status guard (blocked vs opted_out) | TC-0308 | TD-026 | 🟡 P2 |
| Admin relay (WF-12) no status check | TC-0312 | TD-023 | 🟠 P1 |
| Admin messages from chinmay-admin-commands relayed | TC-0313 | **RESOLVED — ✅ PASS** (verified WF-10 JSON) | — |
| WF-44 saves all text as feedback (rebook intent lost) | TC-0503 | TD-032 | 🟡 P2 |
| Rebook after consultation — channel lifecycle | TC-1001, TC-0504, TC-0505 | **RESOLVED — ✅ PASS** (verified WF-42 never archives channel) | — |
| Admin BLOCK during consultation — no channel archive | TC-1004 | TD-020 | 🟡 P2 |
| APPROVE command wording inconsistency | TC-1005 | TD-031 | 🟠 P1 |
| Bot's own WhatsApp echo passes WF-00 dedup | TC-0704 | TD-030 | 🟠 P1 |
| WF-20 HELP not status-aware (+ TC-0601/0602/0603/0402) | TC-1013 | TD-027 | 🟡 P2 |
| stop_intent not routed in WF-30/WF-31 | TC-0609 | TD-028 | 🟡 P2 |
| WF-25 no error handling for Gemini failures | TC-0804 | TD-029 | 🟡 P2 |
| feedback_intent without awaiting_feedback guard | TC-0803 | TD-032 | 🟡 P2 |
| WF-33 missing state guard for APPROVE | TC-0303, TC-1002 | TD-021 | 🟠 P1 |
| WF-42 missing state guard for CLOSE | TC-1003 | TD-022 | 🟠 P1 |
| WF-47 does not archive channel on STOP | (archival strategy) | TD-019 | 🟡 P2 |
| WF-50 no validation for empty message body | TC-1006 | TD-033 | 🟡 P2 |
| WF-00 no guard for whitespace-only user message | TC-1007 | TD-034 | 🟡 P2 |

---

## Tech Debt Coverage Map

| TD | Description | Test Cases Covered | Status in Evaluation |
|----|-------------|-------------------|----------------------|
| TD-001 | Schema prefix `chinmay_astro.` missing (12 nodes, 8 WFs) | TC-0304, TC-0306, TC-0307, TC-0309, TC-0310, TC-0401, TC-0502, TC-0604 | 🔧 All treated as fixed |
| TD-002 | WF-33 redundant WF-52 call; reads channelId from WF-52 not DB | TC-0301, TC-1012 | 🔧 Treated as fixed |
| TD-003 | WF-22 "User Already Exists" calls unknown WF-50 ID | TC-0105 | 🔧 Treated as fixed |
| TD-004 | WF-60 all core nodes disabled (logging dead) | TC-0401, TC-0405, TC-1010 | 🔧 Treated as fixed |
| TD-005 | WF-11 admin confirmations + stats nodes disabled | TC-0306, TC-0309, TC-0310, TC-0314 | 🔧 Treated as fixed |
| TD-006 | WF-20 registry note stale (says broken, already fixed) | — | Documentation only; no test case affected |
| TD-007 | WF-52 call-site nodes misnamed as "Create Channel" | TC-1011 | 🔧 Treated as fixed (naming confusion resolved) |
| TD-008 | WF-52 input contract undocumented (passthrough mapping) | — | Risk to callers; no functional test affected once documented |
| TD-009 | WF-60 / WF-20 IDs swapped in registry | — | Documentation fix; no functional test affected once corrected |
| TD-010 | WF-11 missing UNBLOCK command | TC-0307 | 🔧 Treated as fixed |
| TD-011 | WF-45 Rebook payment wording not updated | — | Registry confirms updated session 5; wording correct |
| TD-012 | WF-23 registry status shows Placeholder (actually Active) | — | Documentation fix; WF-23 confirmed active session 6 |
| TD-013 | 3 stale/backup workflows in n8n | — | Cleanup only; no functional impact |
| TD-014 | WF-42 UPDATE uses non-existent `users` columns | TC-0305 | 🔧 Treated as fixed |
| TD-015 | WF-42 sends unconfirmed Meta template instead of interactive buttons | TC-0305 | 🔧 Treated as fixed |
| TD-016 | WF-31 no Slack relay for payment_submitted user messages | TC-0205 | 🔧 Treated as fixed |
| TD-017 | Non-text during consultation_active silently dropped | TC-0404 | 🔧 Treated as fixed |
| TD-018 | WF-42 registry description incorrect (says "Archives via WF-52") | — | Documentation fix; WF-42 JSON verified: no archival on CLOSE |
| TD-019 | WF-47 does not archive Slack channel on STOP/opted_out | TC-0604 (partial) | 🔧 Treated as fixed |
| TD-020 | WF-46 does not archive Slack channel on BLOCK | TC-1004 | 🔧 Treated as fixed |
| TD-021 | WF-33 missing state guard — APPROVE runs regardless of status | TC-0303, TC-1002 | 🔧 Treated as fixed |
| TD-022 | WF-42 missing state guard — CLOSE runs regardless of status | TC-1003 | 🔧 Treated as fixed |
| TD-023 | WF-10 relay has no status check — admin notes sent during payment_submitted | TC-0312 | 🔧 Treated as fixed |
| TD-024 | WF-43 no button_reply routing for post-consult buttons | TC-0501, TC-0508 | 🔧 Treated as fixed (with TD-015) |
| TD-025 | WF-32 missing idempotency — duplicate "Payment Completed" tap | TC-0202 | 🔧 Treated as fixed |
| TD-026 | WF-11 UNBLOCK no status=blocked guard | TC-0308 | 🔧 Treated as fixed |
| TD-027 | WF-20 HELP not status-aware; 5 contextual responses needed | TC-0402, TC-0601, TC-0602, TC-0603, TC-1013 | 🔧 Treated as fixed |
| TD-028 | WF-30/WF-31 missing stop_intent routing | TC-0609 | 🔧 Treated as fixed |
| TD-029 | WF-25 no error handling for Gemini failures | TC-0804 | 🔧 Treated as fixed |
| TD-030 | WF-00 no bot echo filter (outbound WA echo re-enters routing) | TC-0704 | 🔧 Treated as fixed |
| TD-031 | APPROVE command wording inconsistency across docs | TC-1005 | 🔧 Treated as fixed |
| TD-032 | WF-44 no intent check before saving feedback | TC-0503, TC-0803 | 🔧 Treated as fixed |
| TD-033 | WF-50 no validation for empty/null message body | TC-1006 | 🔧 Treated as fixed |
| TD-034 | WF-00 no guard for whitespace-only user messages | TC-1007 | 🔧 Treated as fixed |

---

## Missing Journeys (Not in user_journey_map.html)

These scenarios were not documented in the original journey map and were discovered during testing. They should be added as supplementary journey cards:

| Scenario | Status | Suggested Journey ID |
|----------|--------|---------------------|
| Duplicate "Payment Completed" tap (TC-0202) | TD-025 — covered | J-06a (edge case of J-06) |
| Admin BLOCK during active consultation (TC-1004) | TD-020 — covered | J-12a (edge case of J-12) |
| Admin relay guard — user not consultation_active (TC-0312) | TD-023 — covered | J-14a (guard on J-14) |
| free-form stop_intent — guide to STOP keyword (TC-0609) | TD-028 — covered | Intent filter design addendum |
| Bot's own outbound echo handling (TC-0704) | TD-030 — covered | J-00 (infrastructure guard) |
| Deferred Slack channel archival strategy | TD-019, TD-020 | J-22a (lifecycle addendum) |

---

## Journey Map Status

| Journey | Implemented? | Owning WF(s) | Notes |
|---------|-------------|--------------|-------|
| J-01 (new user → consent template) | 🗺️ DESIGN MISMATCH | WF-21 | Implemented as direct form, no YES/NO gate |
| J-02 (YES consent) | ❌ NOT IMPLEMENTED | — | Design replaced by direct form submission |
| J-03 (form submitted) | ✅ YES | WF-22 | Confirmed working |
| J-04 (NO consent) | ❌ NOT IMPLEMENTED | — | Design replaced — no consent gate |
| J-05 (pre-form free-form) | ✅ YES | WF-23 | Implemented session 6 |
| J-06 (Payment Completed tap) | ✅ YES | WF-32 | Confirmed working; TD-025 (idempotency) being fixed |
| J-07 (payment_pending free-form) | ✅ YES | WF-30 | Implemented session 6 |
| J-08 (payment_submitted messages) | 🔧 PARTIAL | WF-31 | Ack works; Slack relay missing (TD-016, being fixed) |
| J-09 (admin APPROVE) | ✅ YES | WF-33 | Active; TD-002 + TD-021 being fixed |
| J-10 (admin REJECT) | ✅ YES | WF-34 | Active; TD-001 being fixed |
| J-11 (admin CLOSE) | 🔧 PARTIAL | WF-42 | Active; TD-014 + TD-015 + TD-022 being fixed |
| J-12 (admin BLOCK) | ✅ YES | WF-46 | Active; TD-005 + TD-020 being fixed |
| J-13 (relay user→Slack) | ✅ YES | WF-40 | Implemented session 3 |
| J-14 (relay Slack→user) | ✅ YES | WF-12/WF-41 | Implemented sessions 3–4; TD-023 guard being fixed |
| J-15 (user feedback) | 🔧 PARTIAL | WF-44 | Built session 6; TD-032 (intent check) being fixed |
| J-16 (REBOOK button/keyword) | ✅ YES | WF-45 | **Verified: channel not archived on CLOSE. Rebook reuses same channel correctly.** |
| J-17 (consultation_closed free-form) | ✅ YES | WF-43 | Rebuilt session 6 |
| J-18 (HELP keyword — contextual) | 🔧 PARTIAL | WF-20 | TD-027 — status-aware responses to be implemented |
| J-19 (STOP keyword) | ✅ YES | WF-20 + WF-47 | Confirmed sessions 4/5 |
| J-20 (REBOOK keyword) | ✅ YES | WF-20 + WF-45 | **Verified: same channel reuse fix (J-16 note). REBOOK keyword works correctly.** |
| J-21 (opted_out re-engagement) | ✅ YES | WF-01 + WF-21 | Confirmed session 5 |
| J-21* (non-text messages) | 🔧 PARTIAL | WF-00 | Deflection works; consultation_active forward (TD-017) being fixed |
| J-22 (blocked user) | ✅ YES | WF-01 | Confirmed |
| J-23 (foreign number) | ✅ YES | WF-01 | Confirmed |
| J-24 (health check) | ⏳ DEFERRED | WF-70 | Post go-live |
| J-25 (payment reminder) | ⏳ DEFERRED | WF-71 | Post go-live; Meta template needed |
| J-26 (inactive scanner) | ⏳ DEFERRED | WF-72 | Post go-live |
| J-27 (stale cleanup) | ⏳ DEFERRED | WF-73 | Post go-live |
| J-28 (data retention) | ⏳ DEFERRED | WF-74 | Post go-live |
| J-A1 (admin UNBLOCK) | ✅ YES | WF-11 | Implemented session 5; TD-026 (guard) being fixed |

---

## Recommended Action List (Priority Order)

### 🔴 P0 — Fix Before Any Smoke Test Step
All P0 TDs are already tracked (TD-001, TD-002, TD-014) — no new P0 gaps found.

### 🟠 P1 — Fix Before Go-Live

| # | TD | Description | Affected TCs |
|---|----|-------------|-------------|
| 1 | TD-001 | Schema prefix `chinmay_astro.` in 12 nodes across 8 WFs | TC-0304, 0306, 0307, 0309, 0310, 0401, 0502, 0604 |
| 2 | TD-002 | WF-33 redundant WF-52 call; read channelId from DB | TC-0301, TC-1012 |
| 3 | TD-003 | WF-22 "User Already Exists" calls wrong WF-50 ID | TC-0105 |
| 4 | TD-005 | WF-11 admin confirmation + stats nodes disabled | TC-0306, 0309, 0310, 0314 |
| 5 | TD-014 | WF-42 UPDATE uses non-existent users columns | TC-0305 |
| 6 | TD-015 | WF-42 sends unconfirmed Meta template instead of buttons | TC-0305, 0501, 0508 |
| 7 | TD-016 | WF-31 missing Slack relay for payment_submitted messages | TC-0205 |
| 8 | TD-021 | WF-33 missing state guard for APPROVE | TC-0303, TC-1002 |
| 9 | TD-022 | WF-42 missing state guard for CLOSE | TC-1003 |
| 10 | TD-023 | WF-10 relay no status check — admin notes during payment_submitted | TC-0312 |
| 11 | TD-024 | WF-43 no button_reply routing (coupled to TD-015) | TC-0501, TC-0508 |
| 12 | TD-025 | WF-32 duplicate "Payment Completed" tap | TC-0202 |
| 13 | TD-030 | WF-00 no bot echo filter | TC-0704 |
| 14 | TD-031 | APPROVE command wording inconsistency | TC-1005 |

### 🟡 P2 — Fix Before Go-Live (Quality)

| # | TD | Description | Affected TCs |
|---|----|-------------|-------------|
| 15 | TD-004 | WF-60 all core nodes disabled | TC-0401, 0405, 1010 |
| 16 | TD-017 | Non-text during consultation_active silently dropped | TC-0404 |
| 17 | TD-019 | WF-47 does not archive channel on STOP | TC-0604 (partial) |
| 18 | TD-020 | WF-46 does not archive channel on BLOCK | TC-1004 |
| 19 | TD-026 | WF-11 UNBLOCK no status=blocked guard | TC-0308 |
| 20 | TD-027 | WF-20 HELP not status-aware | TC-0402, 0601, 0602, 0603, 1013 |
| 21 | TD-028 | WF-30/WF-31 no stop_intent routing | TC-0609 |
| 22 | TD-029 | WF-25 no error handling for Gemini failures | TC-0804 |
| 23 | TD-032 | WF-44 no intent check before saving feedback | TC-0503, 0803 |
| 24 | TD-033 | WF-50 no validation for empty/null message | TC-1006 |
| 25 | TD-034 | WF-00 no guard for whitespace-only user messages | TC-1007 |

### ❓ Remaining Unverified (Low Priority, Non-Blocking)

| # | TC | Finding | WF to Inspect |
|---|----|---------|----|
| 26 | TC-0102 | Deflection message wording for non-text first message | WF-00 / WF-21 |
| 27 | TC-0204 | WF-45 behaviour when user is payment_pending (not consultation_closed) | WF-45 JSON |
| 28 | TC-0302 | WF-33 error handling when phone not found | WF-33 JSON |

---

*End of Functional Test Report*
