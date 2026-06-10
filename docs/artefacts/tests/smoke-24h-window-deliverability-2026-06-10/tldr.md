# TL;DR — 24h-Window Deliverability Smoke (PDF-15 → 21)

**Verdict:** All 6 happy paths green end-to-end on a real WhatsApp number. 1 minor copy bug found mid-session and fixed (template v2). 2 paths logged un-exercised (no blocker). WF-75 (project's first scheduled job) activated and live-verified.

## Bugs at a glance

| ID | Sev | Workflow / asset | What broke | Fix applied | Status |
|----|-----|------------------|------------|-------------|--------|
| BUG-01 | [minor] | `astrology_service_update` template (out-window relay) | v1 buried Dr. Chinmay's reply under a heavy apology prefix/suffix; bold `*…*` rendered as **literal asterisks** (the bold span crossed a newline around `{{1}}`) | New **`astrology_service_update_v2`** template (header kept, lighter copy, `{{1}}` inline so bold renders, "Thanks, Chinmay Astro" sign-off). WF-41 repointed to v2 — tracked as **PDF-21**. New template (not an edit) → avoided Meta reclassification risk. | ✅ Fixed & live-verified (Phase D2, exec 4234) |

> Pre-smoke fix **PDF-20** (WF-41/WF-75 window read switched `message_type` proxy → `metadata->>'transport'='wa'`) was not a bug found this session, but was **decisively verified** here (Phase D + Phase F repeat-readiness).

## Test scope

- **Subject:** single real number **61466927921** (user 41, "Test User"), consult channel `C0B567A175W`. Walked forward through the whole lifecycle on one identity.
- **Scenarios exercised (all PASS):**
  - **PDF-17** — payment REJECT → `payment_rejection` template delivered out-of-window; "Payment Completed" retry tap → WF-02 normalizer → re-submit.
  - **PDF-15** — relay **in-window** → free-form text; relay **out-window** → template.
  - **PDF-20** — window read keys on the real WA inbound, ignores recent Slack rows (decisive trap test).
  - **PDF-21** — `astrology_service_update_v2` send succeeds (no Meta 132xxx) → approved & wired.
  - **PDF-19** — CLOSE → `consultation_closed` template + 3 buttons; "Done, Thanks." tap routed via WF-02 → WF-43.
  - **PDF-18** — WF-75 activated + manual poll → single advisory nudge to consult channel; repeat-readiness proven.
- **Bonus observed:** WhatsApp reaction handled gracefully by WF-61 ("text only" guard).

## Remaining / deferred (no blocker)

- **PDF-16 (failure visibility)** — never triggered: every send this session succeeded, so the `success=false` in-channel notice path was not exercised. Needs a forced Meta failure (e.g. paused template). → `followups-remaining-paths.md`.
- **WF-75 self-termination** — repeat proven; *stop* not live-demoed. Structurally enforced by the query (`last_inbound > last_outbound_wa`; 18–24h band). → `followups-remaining-paths.md`.
- **PDF-19 buttons** — only "Done, Thanks." tapped; "Leave Feedback" / "Book Again" routes not individually exercised (labels confirmed present; WF-02 BUTTON_MAP keys all 3).

## State carry-forward

- **WF-75 is ACTIVE** (kept on per decision 2026-06-10) — its every-2h poll is now live in production. ⚠️ **`docs/workflow-registry.md` still shows WF-75 as 🟡 "Built (inactive)" — needs a 🟢 Active update** to match reality.
- **User 41** left **fixtured**: `consultation_active`, last WA inbound ~20h (unanswered), all other WA rows backdated to ~26h. Will keep matching/re-nudging WF-75 every 2h until it crosses 24h or receives a WA reply. Fixture timestamps were not reverted (audit log; harmless).
- **PDF-21 / v2 template** is the live out-window relay template; v1 `astrology_service_update` retired (0 references).
