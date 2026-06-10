# Story — 24h-Window Deliverability Smoke

### TC-PDF17 — Payment rejection reaches the customer after a long gap  ✅

With user 41 sitting in `payment_submitted` and ~59h out of window, the operator issued `REJECT`. WF-34 fired and the customer's phone received the `payment_rejection` **template** — not the old interactive message — proving the always-template design delivers even with the 24h window long closed (M2 utility-template-out-window). Three Meta status callbacks (sent/delivered/read) corroborated physical delivery, and the message log confirmed `message_type=template`. User dropped to `payment_pending`, payment #27 → rejected.

---

### TC-PDF17b — Retry tap routes through the template-button normalizer  ✅

The operator tapped "Payment Completed" on the rejection template. The tap arrived in the M5 *template* shape (`message_type=button`, logged by label "Payment Completed"), and WF-02 — the shared normalizer — mapped the label to `payment_completed` and handed off to WF-32, which re-submitted the payment and sent the WA acknowledgement plus a Slack alert. This is the exact receiving-side mechanism PDF-19's close buttons reuse, so it de-risked that scenario in advance. A follow-up `APPROVE` then activated the consultation (`consultation_activated` template, channel reused — no new WF-52).

---

### TC-PDF15-in — In-window relay sends free-form text  ✅

With the window freshly re-opened (~2h old WA inbound from the button tap), the operator relayed a plain reply from Slack. WF-41 read the window as OPEN and WF-50 delivered it as free-form WhatsApp **text** — logged `message_type=text`, not a template — exactly the in-window path. This phase alone doesn't isolate the PDF-20 fix (an open window satisfies both old and new query), which is why the out-window phase carried the decisive trap.

---

### TC-PDF15-out / TC-PDF20 — Out-window relay templates, and ignores Slack rows  ✅

The window was backdated to 25h closed while recent Slack inbound rows (the astrologer's own typing, `transport=slack`) were left in place — the precise trap PDF-20 fixes. A pre-PDF-20 query would have latched onto the 0.0h Slack row, read the window OPEN, sent free-form, and had Meta silently reject it. Instead WF-41's corrected `transport='wa'` query read the real WA inbound (25h → CLOSED) and routed to the `astrology_service_update` template. One send proved both PDF-15 out-window deliverability and the PDF-20 WA-scoping in a single shot.

---

### TC-PDF21 — v2 template renders correctly and is wired live  ✅

Mid-session the operator spotted the v1 template buried the reply and rendered literal `*` asterisks (bold span crossing a newline), and shipped **PDF-21**: a new `astrology_service_update_v2` (lighter copy, `{{1}}` inline so bold renders, "Thanks, Chinmay Astro" sign-off) with WF-41 repointed at a single call site. Re-firing the out-window relay (window 36.5h closed) sent v2 successfully — no Meta 132000/132001 — confirming v2's name, `en` language and single body param match Meta's approved structure. Logged as `template:astrology_service_update_v2`; v1 fully retired. Making it a *new* template rather than editing the approved one sidestepped the Meta-reclassification trap that previously hit `consultation_closed_feedback`.

```text
Was:  astrology_service_update      *…:* \n * \n {{1}}      → literal asterisks, message buried
Now:  astrology_service_update_v2   *Dr. Chinmay has responded to your message:* {{1}}  +  Thanks, Chinmay Astro
```

---

### TC-PDF19 — Close prompt templates out-of-window, buttons route  ✅

With the window still closed, `CLOSE` produced the `consultation_closed` template carrying its three quick-reply buttons — delivered despite the closed window (always-template). User 41 → `consultation_closed`. The operator tapped "Done, Thanks."; the template tap arrived as a `button` shape, flowed through the WF-02 normalizer to WF-43, and produced the "Thank you for choosing Chinmay Astro" reply plus a Slack notice. Only one of the three buttons was tapped, so "Leave Feedback" / "Book Again" routing remains individually un-exercised (labels confirmed present; the map keys all three). A stray customer reaction in between was caught cleanly by WF-61's "text messages only" guard — an unplanned but reassuring observation.

---

### TC-PDF18 — Window-closing nudge matches, posts, and will repeat  ✅

User 41 was fixtured back to `consultation_active` with a single unanswered WA inbound at ~20h (a pre-fixture dry-run of WF-75's exact query confirmed 0 baseline matches, so no other channel would get a surprise nudge). WF-75 was activated — the project's first scheduled workflow — and the operator ran one manual poll from the n8n UI. It matched exactly user 41 and posted a single advisory nudge ("…window closes in ~4h…") into the consult channel via WF-51, with no customer-facing send and no DB state write. The decisive detail: a post-nudge dry-run *still* matched, because the nudge is logged `transport=slack` and the WA-scoped query ignores it — so the nudge will correctly **repeat** each poll instead of self-disabling. Self-termination (on a WA reply, or at 24h) is structurally enforced by the query but was not live-demoed.

---
