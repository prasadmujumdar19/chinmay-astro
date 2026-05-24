# Story — Pre-Go-Live P0 Smoke

### TC-0606 — STOP from `consultation_closed` (morning session)  ✅

Verified during the morning session. User 28 walked through full happy path to `consultation_closed`, then sent `STOP`. WF-20 intercepted, WF-47 unconditionally flipped status to `opted_out`, admin alert + WA confirmation delivered. SP-04 unconditional-opt-out behavior holds at the `consultation_closed` starting state.

---

### TC-0604 — STOP from `payment_pending`  ✅

After the BUG-NEW-02 incident left user 28 in `opted_out`, DML-wiped that user and re-onboarded as user 29: `hi` → form-submit → STOP (skipping the Payment Completed tap). 36 executions across three waves, all success and sub-3s. WF-22 created the user row in `payment_pending`; WF-52 idempotently returned the preserved channel C0B567A175W (proving DR-10's "channels never archived" rule yields safe reuse, not orphans, on full DB wipes). WF-20 intercepted the STOP keyword before any intent classification could run, WF-47 flipped status to `opted_out`, both admin and user notifications landed. The unconditional opt-out behavior (DR-4 / SP-04) is verified at the second of three intended starting states.

---

### TC-0302 — Admin `APPROVE PAYMENT <wrong-phone>` → admin Slack feedback  ✅ (by reference)

Already covered by SP-03's WF-10 centralized-gate smoke on 2026-05-23. Phase C2 there ran `APPROVE PAYMENT +614999999999` in `consult-+61466927921` and produced exec chain 1731→1732→1733/1734→1735 — terminating at the WF-51 Phone-Mismatch Alert without invoking WF-11 or WF-33. Verified Slack reply text matched the design. Re-running was redundant; operator chose to mark this PASS by reference rather than re-walk.

---

### TC-1012 — WF-33 reads `slack_channel_id` from `users`, does NOT call WF-52  ✅ (by reference)

Also covered by SP-03 smoke, Phase E1 (Attempt 3, execs 1790–1801). The 12-execution APPROVE PAYMENT happy-path chain ran WF-10 → WF-11 → WF-33 → WF-50 → WF-60 → WF-51 → ... with **no WF-52 in the chain** — WF-33 used the existing `users.slack_channel_id` directly. DR-2 + DR-10 both honored. PASS by reference.

---

### TC-0605 — STOP from `consultation_active`  ✅

The most complete state-machine walk of the session: full 5-step path (`hi` → form-submit → tap Payment Completed → admin APPROVE PAYMENT 61466927921 → STOP) on freshly-wiped user 30. 61 executions across five waves, all success and sub-second. Walked the user from no-record through `pending_users` → `payment_pending` → `payment_submitted` → `consultation_active` → `opted_out` cleanly. WF-52 idempotently reused C0B567A175W for the third time this session (28 → 29 → 30 all got the same channel), giving strong empirical confidence in DR-10's reuse semantics. Most importantly: STOP from `consultation_active` triggered the same unconditional WF-47 opt-out as TC-0604 did from `payment_pending` — confirming SP-04's invariant holds across both relevant pre-close states. One minor observation surfaced during the tick: `consultations.id=14.status` remained `active` after the opt-out (logged as O-01 for design discussion — see followups-consultations-stale-active.md).

---

### GAP-01 — Pre-`users`-row WA events not logged in `messages`  ⚠️ design gap, no code change this session

Consistent across both TC-0604 (user 29) and TC-0605 (user 30): the inbound `hi` and the outbound WF-21 form message produced no `messages` rows. The trail only starts at WF-22's payment confirmation because WF-60 currently keys log inserts on `users.id`, which doesn't exist until WF-22 runs. The operator established a principle this session — audit-trail integrity is independent of user-row creation timing — which makes this a real design gap, not just a "works as coded" quirk. A pseudo-first design sprint will define whether `messages.user_id` becomes nullable, whether WF-60 does a phone → user_id lookup with fallback, and whether retroactive backfill is required when the user eventually submits the form. The Slack side already implements the equivalent pattern correctly (admin's `APPROVE PAYMENT` Slack message IS logged as `messages.id=116`), giving the WA-side fix a working sibling to reference. Detailed intake in followups-message-logging-gap.md.

---

### GAP-02 — GDPR / retention maintenance workflows not yet built  ⚠️ post-go-live deferral confirmed

The operator asked whether the project has provision for GDPR-driven cleanup. Registry check confirms yes: WF-73 (Stale Form Cleanup, daily) and WF-74 (Data Retention Cleanup, monthly) are both provisioned in `docs/workflow-registry.md` under the WF-7x post-go-live range, but neither exists in live n8n (verified via API). Once GAP-01 lands, WF-73's scope must broaden to also purge orphan `messages` rows for stale `pending_users` (current FK only cascades from `users` deletion). WF-74 needs a concrete retention-window number before it can be built. Detailed intake in followups-retention-workflows.md.
