# Workflow Pseudocode Index

Each workflow has two artifacts:
- **`WF-XX.md`** — AS-IS technical view: nodes, parameters, connections (stripped from n8n JSON, no UI noise).
- **`WF-XX.pseudo`** — Human-readable LLD algorithm: step-by-step flow with branches, DB ops, sub-workflow calls.

Source-of-truth status (active/disabled) is in `docs/workflow-registry.md`. Generated 2026-05-20 from a live n8n export (post canonical-executeworkflow-shape-sweep sprint).

| ID | Workflow | Domain |
|----|----------|--------|
| [WF-00](WF-00.pseudo) | Webhook Receiver | Infra — Meta WhatsApp entry, dedup, dispatch to WF-01 |
| [WF-01](WF-01.pseudo) | Message Router | Infra — country + message-type + blacklist filters, dispatch to WF-02 |
| [WF-02](WF-02.pseudo) | User State Router | Infra — route by users.status + message type |
| [WF-10](WF-10.pseudo) | Slack Admin Handler | Admin — Slack Events webhook, dispatch admin commands and relays |
| [WF-11](WF-11.pseudo) | Command Parser | Admin — APPROVE / REJECT / CLOSE / BLOCK / UNBLOCK / LIST / STATS / HELP |
| [WF-12](WF-12.pseudo) | Admin → WhatsApp Relay (legacy) | Admin — direct relay path (likely superseded by WF-41) |
| [WF-20](WF-20.pseudo) | Keyword Handler | Onboarding — STOP / HELP / REBOOK keyword interception |
| [WF-21](WF-21.pseudo) | New User Welcome + Form | Onboarding — sends consent + WhatsApp Flow form, no DB write |
| [WF-22](WF-22.pseudo) | Form Response Handler | Onboarding — first users INSERT + WF-52 channel creation |
| [WF-23](WF-23.pseudo) | Pre-Form Intent Filter | Onboarding — intent classify for users awaiting form |
| [WF-25](WF-25.pseudo) | Intent Classifier | Shared — Gemini 2.0 Flash Lite classifier for free-form text |
| [WF-30](WF-30.pseudo) | Payment Pending Intent Filter | Payment — reminders, stop, pass-through |
| [WF-31](WF-31.pseudo) | Payment Submitted Handler | Payment — under-review reply + Slack relay |
| [WF-32](WF-32.pseudo) | Payment Confirmation Receiver | Payment — "Payment Completed" tap → payment_submitted |
| [WF-33](WF-33.pseudo) | Payment Approval Processor | Payment — APPROVE → consultation_active |
| [WF-34](WF-34.pseudo) | Payment Rejection Processor | Payment — REJECT → payment_pending with retry button |
| [WF-40](WF-40.pseudo) | User → Admin Relay | Consult — user WhatsApp during consult → consult Slack channel |
| [WF-41](WF-41.pseudo) | Admin → User Relay | Consult — Chinmay's Slack reply → user WhatsApp |
| [WF-42](WF-42.pseudo) | Consultation Closer | Consult — CLOSE → consultation_closed, sends feedback/rebook buttons |
| [WF-43](WF-43.pseudo) | Post-Consultation Handler | Consult — feedback/rebook intents + Gemini fallback |
| [WF-44](WF-44.pseudo) | Feedback Recorder | Consult — saves user feedback text |
| [WF-45](WF-45.pseudo) | Rebook Handler | Consult — REBOOK → payment_pending, reuses existing Slack channel |
| [WF-46](WF-46.pseudo) | User Blocker | Admin — BLOCK → users.status='blocked' |
| [WF-47](WF-47.pseudo) | Unsubscribe Handler | Admin — STOP keyword → users.status='opted_out' |
| [WF-50](WF-50.pseudo) | Send WhatsApp | Messaging — text / interactive / template; logs via WF-60 |
| [WF-51](WF-51.pseudo) | Send Slack Message | Messaging — Slack post helper |
| [WF-52](WF-52.pseudo) | Slack Channel Manager | Messaging — create/find consult channel (called from WF-22) |
| [WF-60](WF-60.pseudo) | Message Logger | Data — INSERT INTO message_log |
