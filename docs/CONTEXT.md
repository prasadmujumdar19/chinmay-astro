# Chinmay Astro — Project Context

**Last Updated:** April 2026
**Purpose:** Lean entry point — load at the start of every session. Contains just enough to orient quickly. For depth, follow the pointers.

---

## What Is This?

WhatsApp-based Vedic astrology consultation service. Users message a WhatsApp bot, complete onboarding via a WhatsApp Flow form, pay ₹500 via GPay, and then have a live text consultation with the astrologer (Chinmay). The astrologer operates entirely from Slack — no other admin UI.

**Key design decision:** No custom backend code. Everything runs through n8n workflows on a Linode VPS. No nginx — all web traffic enters via Cloudflare Tunnel (outbound-only from VPS). Webhooks bypass CF Access; admin UI is OTP-gated.

---

## Current Status

**Production:** `astro.chinmaymujumdar.com` — Linode Mumbai VPS (45.79.125.184)
**Dev/Staging:** Dev folder in n8n on Mumbai VPS (Sydney VPS retired)

**Core user journey:** Onboarding → Payment → Consultation → Close → Rebook ✅ (fully functional)

**Workflow progress:** 16 built (12 active, 4 inactive) of 32 planned. P1 critical: 9 active, 3 built-inactive, 2 planned.

**Critical open items:**
- VPS hardening (TD-01) — Cloudflare Tunnel setup in progress
- Slack events URL → configure for Mumbai
- Activate all workflows in correct order
- End-to-end smoke test

→ Full status: `STATUS.md` | Full workflow list: `workflow-registry.md`

---

## Infrastructure (Quick Ref)

```
Linode VPS (Ubuntu 24.04) — Mumbai
  └── Docker (n8n-network)
       ├── n8n            — port 5678 (localhost only)
       ├── postgres       — port 5432 (internal only)
       ├── pgadmin        — port 5050 (localhost only)
       ├── cloudflared    — CF Tunnel agent (outbound only)
       └── encryption-svc — WhatsApp Flows encryption
```

**Cloudflare routing:**
- `astro.chinmaymujumdar.com/webhook/*` → CF Bypass → `localhost:5678/webhook/*`
- `astro.chinmaymujumdar.com/*` (admin) → CF Access email OTP → `localhost:5678`
- VPS public IP serves no HTTP traffic at all

**Admin SSH access:**
```bash
ssh -L 5678:localhost:5678 -L 5050:localhost:5050 root@45.79.125.184
# Then: http://localhost:5678 (n8n) | http://localhost:5050 (pgAdmin)
```

→ Full infra detail (CF Tunnel setup, firewall, SSH hardening, DB backups): `INFRA.md`

---

## Database Schema (`chinmay_astro`)

| Table | Key Fields |
|-------|-----------|
| `users` | phone, name, dob, tob, birth_place, status, slack_channel_id, awaiting_feedback (BOOLEAN) |
| `messages` | user_id, direction, content, message_type, timestamp (IST) |
| `consultations` | user_id, status, started_at, closed_at |
| `payments` | user_id, amount, status, submitted_at, approved_at |
| `admin_actions` | user_id, action_type, performed_by, timestamp |

**User state machine:** `new` → `payment_pending` → `payment_submitted` → `consultation_active` → `consultation_closed` → (rebook loops, or `inactive` / `blocked`)

---

## Workflow Overview

| Range | Domain |
|-------|--------|
| WF-0x | Infrastructure — entry, routing |
| WF-1x | Admin — Slack-side command handling |
| WF-2x | Onboarding — new user, consent, form |
| WF-3x | Payment — confirmation, approval, rejection |
| WF-4x | Consultation — relay, close, post-consult, rebook |
| WF-5x | Messaging utilities — WhatsApp/Slack senders, channel manager |
| WF-6x | Data — logging, audit |
| WF-7x | Background jobs — health checks, reminders, cleanup |

→ Full WF-XX table with status, purpose, entry/exit conditions: `workflow-registry.md`

---

## Key Technical Gotchas

**n8n expression syntax:** Use `{{ $json.field }}` — NOT `={{ $json.field }}`. The `=` prefix breaks base64 encoding.

**Slack webhook challenge:** Use `{{ $json.body.challenge }}` (not `$json.challenge` — Slack wraps the payload in `body`).

**Null handling in Postgres:** n8n converts JS `null` to string `"null"`. Fix: `NULLIF({{ $json.field }}, 'null')::integer`

**Bot loop prevention:** Compare `$json.body.authorizations[0].user_id` ≠ `$json.body.event.user`

**WhatsApp Flows encryption:** Requires IV flipping. Handled by `encryption-svc` Docker container — cannot be done natively in n8n Code nodes. Responses must be plain text, not JSON-wrapped.

**awaiting_feedback flag:** Set to `true` when user clicks "Provide Feedback" after consultation close. Next text from user = feedback → logged → flag reset.

---

## Admin Commands (Slack)

All commands can be sent in the user's consultation channel (`consult-{phone}`) or any Slack channel — WF-10 captures all workspace events.

| Command | Action |
|---------|--------|
| `APPROVE PAYMENT <phone>` | Approve payment → `consultation_active` → relay begins |
| `CLOSE CONSULTATION <phone>` | End consultation → send feedback form |
| `REJECT PAYMENT <phone>` | Reject payment → loop user back |
| `BLOCK <phone>` | Block user permanently (silent) |
| `LIST` | Show active consultations |
| `STATS` | System statistics |
| `HELP` | Available commands |

---

## Payment Flow (MVP)

1. User submits form (WF-22) → Slack channel `consult-{phone}` created immediately → bot sends ₹500 payment instructions
2. User pays → taps "Payment Completed" → WF-32 posts payment notification to user's Slack channel
3. Admin verifies in GPay → types `APPROVE PAYMENT <phone>` in the user's Slack channel
4. State → `consultation_active` → relay mode begins

**Phase 2 (post-MVP):** Razorpay integration for automated verification.

**Phase 2 (post-MVP):** Razorpay integration for automated verification.

---

## Entry Points

| Entry | Flow |
|-------|------|
| User texts "Hi" (organic) | WF-00 → WF-01 → WF-02 → WF-21 → sends Welcome + Consent |
| User clicks Facebook ad | Lands in WhatsApp Flow → WF-00 → WF-01 → WF-02 → WF-22 |
| Admin types in Slack channel | WF-10 → WF-11 (command) or WF-12 (relay) |

---

## Document Map

| Document | Purpose |
|----------|---------|
| `CONTEXT.md` | This file — lean entry point |
| `STATUS.md` | Live health dashboard — infra status, workflow status, open items, tech debt |
| `INFRA.md` | Infrastructure detail — CF Tunnel, CF Access, firewall, SSH, Docker, DB backups |
| `workflow-registry.md` | WF-XX master list — status, purpose, priority, n8n mapping |
| `Chinmay_Astro_Technical_Design.md` | Full architecture spec (imported knowledge — read-only) |
| `Slack_n8n_Integration_Reference.md` | Slack + n8n setup reference, updated for CF Tunnel architecture (imported knowledge — read-only) |
| `user_journey_map.html` | Golden copy — user journey map v2.0 |
| `customer_journey_map.html` | Golden copy — customer journey map |

**Retired docs** (superseded, kept for historical reference):
- `chinmay_astro_interaction_flows.md` — old interaction flows, superseded by HTML journey maps
- `Chinmay_Astro_References.md` — nginx/subdomain setup, now obsolete (CF Tunnel architecture used instead)
