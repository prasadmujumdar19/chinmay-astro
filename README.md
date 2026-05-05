# Chinmay Astro — n8n Workflow Registry

WhatsApp-based Vedic astrology consultation service. Users message a WhatsApp bot,
complete onboarding via a WhatsApp Flow form, pay ₹500 via UPI, then have a live
text consultation with the astrologer (Chinmay). Chinmay operates entirely from Slack.

**Stack:** n8n on Linode Mumbai VPS · WhatsApp Cloud API · Slack · PostgreSQL · Cloudflare Tunnel

---

## Workflow Inventory

| Range | Domain |
|-------|--------|
| WF-0x | Infrastructure — entry, routing |
| WF-1x | Admin — Slack-side command handling |
| WF-2x | Onboarding — new user, consent, form |
| WF-3x | Payment — confirmation, approval, rejection |
| WF-4x | Consultation — relay, close, post-consult, rebook |
| WF-5x | Messaging utilities — WA sender, Slack sender, channel manager |
| WF-6x | Data — message logging, audit |
| WF-7x | Background jobs (post go-live) |

All workflow JSON files are in the `workflows/` directory.
File names match the workflow names in n8n.

## User State Machine

```
[no record] →(form submitted)→ payment_pending →(tap "Payment Completed")→ payment_submitted
    →(admin APPROVE)→ consultation_active →(admin CLOSE)→ consultation_closed
    →(REBOOK or rebook_intent)→ payment_pending [loop]

any state →(admin BLOCK)→ blocked
payment_submitted →(admin REJECT)→ payment_pending
any state →(user sends STOP)→ opted_out
opted_out →(user messages again)→ [treat as new user, route to WF-21]
```

## Admin Commands (Slack)

| Command | Action |
|---------|--------|
| `APPROVE CHAT CONSULT <phone>` | Approve payment → consultation_active → relay begins |
| `CLOSE CHAT CONSULT <phone>` | End consultation → send feedback form |
| `REJECT <phone>` | Reject payment → loop user back |
| `BLOCK <phone>` | Block user permanently |
| `LIST` | Show active consultations |
| `STATS` | System statistics |
| `HELP` | Available commands |

## Infrastructure

```
Linode VPS (Ubuntu 24.04) — Mumbai
  └── systemd: cloudflared (CF Tunnel — outbound only)
  └── Docker (n8n-network)
       ├── n8n            :5678 (localhost only)
       ├── postgres       :5432 (internal only)
       ├── pgadmin        :5050 (localhost only)
       └── encryption-svc (WhatsApp Flows IV flipping)
```
