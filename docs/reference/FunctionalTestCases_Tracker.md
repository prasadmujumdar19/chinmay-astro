# Functional Test Cases — Execution Tracker

**Generated:** 2026-05-24T00:00:00Z
**Master spec:** `docs/artefacts/reviews/functional-code-review-2026-05-14/test-cases.md` (77 TCs; created 2026-05-13; last revised 2026-05-17)
**Source of coverage data:** TC-ID grep across all `docs/artefacts/tests/<session>/{tldr,story,session}.md` files
**Purpose:** Single source of truth for "which functional test cases have been exercised, in which session, and what remains". Update this tracker at the end of every `monitor-test-run` session.

## Overview

| Metric | Count |
|---|---|
| Total TCs defined | 77 |
| Out of MVP scope (do NOT count as gaps) | 8 |
| In-scope pre-go-live | 69 |
| In-scope and covered (explicit TC tag) | 42 (**61%**) |
| In-scope and pending | 27 (**39%**) |

**Caveat on the 48% figure:** Recent smoke sessions (notably `smoke-wf10-centralized-gate-2026-05-23`) narrate by phase/action rather than TC-ID. The full happy-path admin command matrix WAS exercised end-to-end there, but those runs don't show up in a TC-ID grep — so the real "scenario coverage" is higher. Treat 48% as a *tagged-coverage floor* and use the `Notes` column below to flag implicitly-covered TCs.

**Out-of-scope (8) — do NOT add to remaining work:**
- TC-0508 — DROPPED from MVP (Theme 3 decision 2026-05-17)
- TC-0109 + TC-1008 — Design-mismatch documentation items (YES/NO consent gate removed; not testable)
- TC-0901, 0902, 0903, 0904, 0905 — Background-job workflows (WF-7x range, post-go-live)

---

## Coverage by Category

| Range | Category | Covered / In-scope | Notes |
|---|---|---|---|
| TC-01xx | Onboarding | 3 / 7 | Happy path solid; non-text + free-form pre-form paths pending |
| TC-02xx | Payment | 2 / 5 | Tap-button + dup-tap done; free-form payment_pending paths pending |
| TC-03xx | Admin / Slack | 7 / 13 | Core APPROVE/REJECT/CLOSE/BLOCK/UNBLOCK/LIST exercised; edge-state + admin-channel-text variants pending |
| TC-04xx | Consultation relay | 4 / 4 | ✅ **Full coverage** |
| TC-05xx | Post-consultation | 4 / 6 (TC-0508 dropped) | Happy paths green; awaiting-feedback edges pending |
| TC-06xx | Universal keywords | 2 / 8 | Heavy under-coverage — STOP/HELP/REBOOK matrices await TD-H + sibling retests |
| TC-07xx | Edge / non-text | 1 / 3 | Blocked-user covered; reaction + bot echo pending |
| TC-08xx | Intent filter (WF-25) | 2 / 4 | garbage + abusive done; non-feedback awaiting + Gemini-failure pending |
| TC-09xx | Background jobs | n/a (out of MVP) | ⚪ All 5 post-go-live |
| TC-10xx | Cross-cutting / additional | 1 / 11 | Heaviest gap — most are conformance checks (TD landings, DRs) |

---

## Status Legend

- ✅ **Covered** — Explicit TC-ID mentioned in at least one `monitor-test-run` session log
- 🟡 **Implicit** — Likely exercised by a smoke session but not TC-tagged in its narrative (needs operator confirmation or explicit retest)
- ⏳ **Pending** — Not yet exercised
- ⚪ **Out-of-scope** — Dropped from MVP or post-go-live

## Priority Legend

- 🔴 P0 — Critical-path; must verify before go-live
- 🟠 P1 — Should verify before go-live
- 🟡 P2 — Nice-to-have before go-live; documentation or edge
- ⚪ P3/P4 — Deferred or out of MVP

---

## TC-01xx — Onboarding

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-0101 | First message from brand-new user (text) | 🔴 P0 | ✅ Covered | exploratory-pre-smoke-test-2026-05-16; smoke-post-p0-review-2026-05-17 |
| TC-0102 | First message from brand-new user (image or audio) | 🟠 P1 | ⏳ Pending | — |
| TC-0103 | First message from brand-new user (reaction) | 🟡 P2 | ⏳ Pending | — |
| TC-0104 | User submits WhatsApp Flow form (birth details) | 🔴 P0 | ✅ Covered | exploratory-pre-smoke-test-2026-05-16 |
| TC-0105 | User re-submits form when already payment_pending | ⚪ — | ⚪ Obsolete | smoke-pre-golive-p1-2026-05-24 — no real-user path (original form CTA becomes uneditable; WF-21 doesn't re-send to payment_pending). Replaced by future TCs for `RESEND FORM` admin command + `EDIT DETAILS` user keyword (TD-NEW-034) |
| TC-0106 | Pre-form free-form message — general enquiry intent | 🟠 P1 | ⚠️ Partial | smoke-pre-golive-p1-2026-05-24 — form re-prompted ✅ but BUG-P1-02 (no pre-form intent classification) flagged P0 pre-go-live; needs TD-NEW-033 |
| TC-0107 | Pre-form free-form message — malicious/abusive intent | 🟠 P1 | 🚫 Blocked | smoke-pre-golive-p1-2026-05-24 — blocked-by BUG-P1-02 / TD-NEW-033; retest after pre-form intent gate is implemented |
| TC-0108 | First message from disallowed country code | 🟠 P1 | ✅ Covered | smoke-post-p0-review-2026-05-17 |
| TC-0110 | PRE_FORM_TEXT — user with pending_users row sends free-form text (general/abusive/stop intents) | 🟠 P1 | ⏳ Pending | NEW — added 2026-05-24 to fill WF-23 coverage gap; spec body to draft post-session |
| TC-0109 | Journey map J-01/J-02/J-04 — YES/NO consent gate | ⚪ — | ⚪ Out-of-scope | Design mismatch — consent gate removed |

## TC-02xx — Payment

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-0201 | User taps "Payment Completed" button | 🔴 P0 | ✅ Covered | exploratory-pre-smoke-test-2026-05-16 |
| TC-0202 | User taps "Payment Completed" button twice (duplicate tap) | 🟠 P1 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 |
| TC-0203 | payment_pending user sends free-form text (general enquiry) | 🟠 P1 | ⏳ Pending | — |
| TC-0204 | payment_pending user sends REBOOK (invalid/edge state) | 🟠 P1 | ⏳ Pending | — |
| TC-0205 | payment_submitted user sends message while awaiting approval | 🟠 P1 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 |
| TC-0206 | payment_submitted user sends image (e.g., GPay screenshot) | 🟠 P1 | ⏳ Pending | — |
| TC-0207 | payment_submitted user sends free-form text (general enquiry) | 🟡 P2 | ⏳ Pending | NEW — added 2026-05-24 to fill WF-31 text-path coverage; spec body to draft post-session |

## TC-03xx — Admin / Slack Commands

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-0301 | Admin approves payment — happy path | 🔴 P0 | ✅ Covered | exploratory-pre-smoke-test-2026-05-16 (+ implicit: smoke-wf10-centralized-gate-2026-05-23 Phase E1) |
| TC-0302 | Admin approves payment — wrong phone number | 🔴 P0 | ⏳ Pending | — |
| TC-0303 | Admin approves when user is already consultation_active (double APPROVE) | 🟠 P1 | ✅ Covered | smoke-post-p0-review-tc04xx-2026-05-18; smoke-pre-golive-continued-2026-05-20; smoke-pre-golive-resume-2026-05-19 |
| TC-0304 | Admin rejects payment | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 (+ implicit: smoke-wf10-centralized-gate-2026-05-23 Phase E2 with BUG-06 fix) |
| TC-0305 | Admin closes consultation | 🔴 P0 | ✅ Covered | exploratory-pre-smoke-test-2026-05-16 (+ implicit: smoke-wf10-centralized-gate-2026-05-23 Phase D1) |
| TC-0306 | Admin blocks a user | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16; exploratory-pre-smoke-test-2026-05-16 (+ implicit: smoke-wf10-centralized-gate-2026-05-23 Phase F1) |
| TC-0307 | Admin unblocks a user | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16; exploratory-pre-smoke-test-2026-05-16 (+ implicit: smoke-wf10-centralized-gate-2026-05-23 Phase F2 with BUG-07 fix) |
| TC-0308 | Admin attempts UNBLOCK on opted_out user | 🟠 P1 | ⏳ Pending | — |
| TC-0309 | Admin requests LIST of active users | 🟠 P1 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 (+ implicit: smoke-wf10-centralized-gate-2026-05-23 Phase A) |
| TC-0310 | Admin requests STATS | 🟡 P2 | 🟡 Implicit | smoke-wf10-centralized-gate-2026-05-23 Phase A (not TC-tagged) — confirm |
| TC-0311 | Admin types plain text in consult channel during consultation | 🟠 P1 | ✅ Covered | exploratory-pre-smoke-test-2026-05-16 |
| TC-0312 | Admin types plain text in Slack when user NOT consultation_active | 🟠 P1 | ✅ Covered | smoke-pre-golive-p1-2026-05-24 (PASS-by-evidence) |
| TC-0313 | Admin types plain text in chinmay-admin-commands channel | 🟡 P2 | ⏳ Pending | — |
| TC-0314 | Unrecognised admin command (typo) | 🟡 P2 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 |
| TC-0315 | Bot-loop prevention in Slack relay | 🔴 P0 | ⏳ Pending | — |

## TC-04xx — Consultation Relay

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-0401 | consultation_active user sends text — relayed to Slack | 🔴 P0 | ✅ Covered | exploratory-pre-smoke-test-2026-05-16; smoke-post-p0-review-tc04xx-2026-05-18; smoke-pre-golive-resume-2026-05-19 (+ implicit: smoke-wf10-centralized-gate-2026-05-23 Phase B) |
| TC-0402 | consultation_active user sends HELP | 🟠 P1 | ✅ Covered | smoke-post-p0-review-tc04xx-2026-05-18; smoke-pre-golive-resume-2026-05-19 |
| TC-0403 | consultation_active user sends STOP | 🔴 P0 | ✅ Covered | smoke-post-p0-review-tc04xx-2026-05-18; smoke-pre-golive-continued-2026-05-20; smoke-pre-golive-resume-2026-05-19 |
| TC-0404 | consultation_active user sends image or audio | 🟠 P1 | ✅ Covered | smoke-post-p0-review-tc04xx-2026-05-18; smoke-pre-golive-resume-2026-05-19 |

## TC-05xx — Post-Consultation

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-0501 | User taps "Provide Feedback" button | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16; exploratory-pre-smoke-test-2026-05-16; smoke-post-p0-review-tc04xx-2026-05-18; smoke-pre-golive-continued-2026-05-20; smoke-pre-golive-resume-2026-05-19 |
| TC-0502 | User sends feedback text (awaiting_feedback = true) | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16; exploratory-pre-smoke-test-2026-05-16 |
| TC-0503 | User sends non-feedback text while awaiting_feedback | 🟠 P1 | ⏳ Pending | — |
| TC-0504 | User taps "Book Another Consultation" button | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16; exploratory-pre-smoke-test-2026-05-16 |
| TC-0505 | User sends REBOOK keyword (consultation_closed) | 🟠 P1 | ✅ Covered | exploratory-feedback-rebook-2026-05-16; exploratory-pre-smoke-test-2026-05-16 |
| TC-0506 | consultation_closed free-form — rebook intent | 🟠 P1 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 |
| TC-0507 | consultation_closed free-form — general enquiry | 🟠 P1 | ⏳ Pending | — |
| TC-0508 | User taps "I'm done, thank you" button | ⚪ — | ⚪ Out-of-scope | DROPPED FROM MVP |

## TC-06xx — Universal Keywords

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-0601 | HELP — from payment_pending user | 🟠 P1 | ✅ Covered | smoke-pre-golive-p1-2026-05-24 (HELP delivered; BUG-P1-01 = generic text accepted pre-MVP as TD-NEW-032) |
| TC-0602 | HELP — from payment_submitted user | 🟠 P1 | ✅ Covered | smoke-pre-golive-p1-2026-05-24 (HELP delivered; same BUG-P1-01 — generic text) |
| TC-0603 | HELP — from consultation_closed user | 🟠 P1 | ✅ Covered | smoke-pre-golive-p1-2026-05-24 (HELP delivered; same BUG-P1-01 — generic text) |
| TC-0604 | STOP — from payment_pending user (regulatory) | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 (+ TD-B redesigned — re-verification recommended) |
| TC-0605 | STOP — from consultation_active user (hold) | 🔴 P0 | ⏳ Pending | TD-B redesigned to unconditional — needs retest |
| TC-0606 | STOP — from consultation_closed user | 🟠 P1 | ✅ Covered | exploratory-pre-smoke-test-2026-05-16 (+ TD-B redesigned — re-verification recommended) |
| TC-0607 | opted_out user messages again (re-engagement) | 🟠 P1 | ⏳ Pending re-verification | TD-DCP-105/106/107 (2026-05-25) reshaped this path — prior coverage (exploratory-feedback-rebook-2026-05-16; exploratory-pre-smoke-test-2026-05-16) validated the OLD WF-21 form-reissuance behavior which is now classified as BUG-NEW-02. New expected behavior: WF-01 routes opted-out via `Route Opted-Out to WF-26` (NOT WF-21); WF-26 lifts `users.status` to `consultation_closed`; sends personalized welcome-back via WF-50 (NOT the onboarding form); first message forward-routed through WF-02 in same turn; no new `pending_users` row; existing name/DOB/birth-place preserved. Test user 30 (+61466927921) left in `opted_out` with consult channel `C0B567A175W` for re-execution per smoke-pre-golive-2026-05-24 wrap. Re-execute in next smoke session; on PASS update Status back to ✅ Covered with new session ref + mark BUG-NEW-02 resolved in `docs/artefacts/tests/smoke-pre-golive-2026-05-24/followups-bug-new-02-resolution.md`. |
| TC-0608 | REBOOK keyword — from opted_out user | 🟡 P2 | ⏳ Pending | — |
| TC-0609 | STOP — free-form stop intent (not exact keyword) | 🟠 P1 | ✅ Covered | smoke-pre-golive-p1-2026-05-24 (SP-04 clarifier verified from consultation_active; payment_pending WF-30 path not exercised this batch) |

## TC-07xx — Edge Cases / Non-Text

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-0701 | Reaction emoji from any user | 🟡 P2 | ⏳ Pending | — |
| TC-0702 | Blocked user sends message | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 |
| TC-0703 | Duplicate webhook delivery (deduplication) | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16 |
| TC-0704 | WhatsApp message from bot's own number (echo) | 🔴 P0 | ⏳ Pending | TD-030 implemented — needs verification |

## TC-08xx — Intent Filter (WF-25)

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-0801 | garbage intent — warn + notify admin | 🟠 P1 | ✅ Covered | smoke-post-p0-review-tc04xx-2026-05-18 |
| TC-0802 | malicious_abusive intent — auto-block | 🔴 P0 | ✅ Covered | smoke-post-p0-review-tc04xx-2026-05-18; smoke-pre-golive-continued-2026-05-20; smoke-pre-golive-resume-2026-05-19 |
| TC-0803 | feedback_intent from consultation_closed user (no awaiting_feedback flag) | 🟠 P1 | ⏳ Pending | — |
| TC-0804 | WF-25 API failure (Gemini unavailable) | 🟠 P1 | ⏳ Pending | — |

## TC-09xx — Background Jobs (all out-of-scope for MVP)

| TC | Title | Pri | Status |
|---|---|---|---|
| TC-0901 | Health Check Monitor (J-24) | ⚪ P4 | ⚪ Out-of-scope (post-go-live) |
| TC-0902 | Payment Reminder — stale payment_pending (J-25) | ⚪ P4 | ⚪ Out-of-scope (post-go-live) |
| TC-0903 | Inactive User Scanner (J-26) | ⚪ P4 | ⚪ Out-of-scope (post-go-live) |
| TC-0904 | Stale Form Cleanup (J-27) | ⚪ P4 | ⚪ Out-of-scope (post-go-live) |
| TC-0905 | Data Retention Cleanup (J-28) | ⚪ P4 | ⚪ Out-of-scope (post-go-live) |

## TC-10xx — Cross-cutting / Additional Scenarios

| TC | Title | Pri | Status | Last exercised |
|---|---|---|---|---|
| TC-1001 | Rebook — Slack channel lifecycle (archived channel reuse) | 🔴 P0 | ✅ Covered | exploratory-feedback-rebook-2026-05-16; exploratory-pre-smoke-test-2026-05-16 |
| TC-1002 | Admin APPROVE for user in wrong state | 🟠 P1 | ✅ Covered | smoke-pre-golive-p1-2026-05-24 (PASS-by-evidence) |
| TC-1003 | Admin CLOSE for user not consultation_active | 🟠 P1 | 🟡 Implicit | smoke-wf10-centralized-gate-2026-05-23 Phase D2 (relay wrong-state on consultation_closed) — confirm covers CLOSE side |
| TC-1004 | Admin BLOCK a user who is consultation_active (mid-consultation) | 🟠 P1 | ✅ Covered | smoke-pre-golive-p1-2026-05-24 (PASS-by-evidence) |
| TC-1005 | APPROVE PAYMENT command parsing | 🟠 P1 | ✅ Covered | smoke-pre-golive-p1-2026-05-24 (PASS-by-evidence — APPROVE x2 happy path verified) |
| TC-1006 | WF-50 called with empty or null message body | 🔴 P0 | ⏳ Pending | TD-033 guard added — needs verification |
| TC-1007 | User sends empty or whitespace-only message | 🔴 P0 | ⏳ Pending | TD-034 guard added — needs verification |
| TC-1008 | Journey map v2.0 design mismatch — YES/NO consent gate | ⚪ — | ⚪ Out-of-scope | Documentation discrepancy only |
| TC-1009 | Admin-wide commands (LIST, STATS, HELP) accepted in any channel | 🟠 P1 | 🟡 Implicit | smoke-wf10-centralized-gate-2026-05-23 Phase A + C (DR-13) — needs explicit retest matrix |
| TC-1010 | WF-60 message logging on every inbound/outbound message | 🔴 P0 | 🟡 Implicit | smoke-pre-golive-resume-2026-05-19 verified Slack-transport (TD-003 F2); WA-side not TC-tagged |
| TC-1011 | WF-52 idempotency — channel already exists | 🟠 P1 | 🟡 Implicit | smoke-wf10-centralized-gate-2026-05-23 Phase G (orphan channel) — confirm covers idempotency |
| TC-1012 | WF-33 reads channelId from DB (not from WF-52) | 🔴 P0 | ⏳ Pending | DR-2 conformance check |
| TC-1013 | WF-20 routes HELP keyword with status-aware response | 🟠 P1 | ⚠️ Partial | smoke-pre-golive-p1-2026-05-24 — routing verified ✅; status-aware text NOT delivered (BUG-P1-01 → TD-NEW-032, accepted pre-MVP) |

---

## Suggested next-session queue — pre-go-live closeout

Grouped by risk so a single targeted `monitor-test-run` can close the highest-value gaps.

### 🔴 Must-do before go-live (12 P0/critical-path)

1. **TC-0302** — admin APPROVE with wrong phone (error feedback)
2. **TC-0315** — bot-loop prevention in Slack relay
3. **TC-0605** — STOP from consultation_active (TD-B redesigned — verify unconditional opt-out)
4. **TC-0704** — bot echo prevention (TD-030 verification)
5. **TC-1006** — WF-50 empty/null message body guard (TD-033)
6. **TC-1007** — User sends whitespace-only message (TD-034)
7. **TC-1012** — WF-33 reads channelId from DB (DR-2 conformance)
8. **TC-1010 (explicit)** — confirm WA-side WF-60 logging end-to-end (not just Slack transport)
9. **TC-0604 / TC-0606 re-verify** — STOP from payment_pending + consultation_closed under TD-B redesign
10. **TC-0301 / 0304 / 0305 / 0306 / 0307 explicit-tag retro** — operator confirmation that wf10 smoke phases A–F count as TC ticks (low-effort: cross-reference once)

### 🟠 Should-do before go-live (16 P1)

- TC-0102, 0103 — non-text inbound from new user
- TC-0105 — re-submit form already-payment_pending
- TC-0106, 0107 — pre-form free-form (general_enquiry + malicious-abusive)
- TC-0203, 0204, 0206 — payment_pending free-form variants + payment_submitted image
- TC-0308 — admin UNBLOCK on opted_out
- TC-0312 — admin plain text when user NOT consultation_active
- TC-0503 — non-feedback text while awaiting_feedback
- TC-0507 — consultation_closed free-form general_enquiry
- TC-0601, 0602, 0603 — HELP matrix from payment_pending / payment_submitted / consultation_closed (TD-A enables)
- TC-0609 — free-form stop intent (SP-04 clarifier path)
- TC-0803 — feedback_intent from consultation_closed without awaiting_feedback flag
- TC-0804 — WF-25 Gemini failure
- TC-1002, 1003 (explicit), 1004, 1005 — admin-edge-state matrix + APPROVE parsing
- TC-1009 (explicit) — admin-wide commands accepted in any channel (DR-13)
- TC-1011 (explicit) — WF-52 idempotency
- TC-1013 — WF-20 status-aware HELP matrix

### 🟡 Nice-to-have (3 P2)

- TC-0310 — admin STATS (likely implicit from wf10 Phase A; tag explicitly)
- TC-0313 — admin plain text in chinmay-admin-commands channel
- TC-0608 — REBOOK keyword from opted_out user
- TC-0701 — reaction emoji from any user

---

## How to update this tracker

After every `monitor-test-run` session:

1. Open the new session's `tldr.md` / `story.md`.
2. For each TC-XXXX referenced, find its row in the tables above and append the session folder name to the `Last exercised` column (most-recent first).
3. Move ⏳ → ✅ for any TC newly tagged.
4. Move 🟡 Implicit → ✅ for any TC the new session explicitly tagged.
5. Adjust the **Overview** counts at the top.
6. Trim or expand the **Suggested next-session queue** based on remaining risk.

Treat the **Last exercised** column as the audit trail — never delete sessions from it; only prepend new ones.
