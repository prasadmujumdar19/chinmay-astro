# Chinmay Astro — Implementation Status

**Last Updated:** April 2026
**Environment:** Mumbai VPS (Production) | Dev folder in n8n on Mumbai (Sydney VPS retired)

> For infrastructure detail (CF Tunnel setup, firewall, SSH hardening, Docker port isolation, DB backups) → see `INFRA.md`

---

## 🚨 CRITICAL TECH DEBT

### [TD-01] Mumbai VPS Hardening — CRITICAL PRIORITY

**Status:** ❌ NOT DONE

The Sydney VPS (Friendly Deal Finder) underwent an exhaustive security hardening process. Mumbai VPS has **not** had this hardening applied yet. This is a significant risk given the production environment handles real user data and payment flows.

**Hardening model (from FDF `infra-security.md`):** Cloudflare Tunnel architecture — no open ports 80/443, no nginx, all web traffic through Cloudflare edge only.

| Control | Status | What to Do |
|---------|--------|------------|
| Cloudflare Tunnel (`cloudflared` container) | ❌ Not Done | Add `cloudflared` Docker container; configure outbound tunnel to Cloudflare for `astro.chinmaymujumdar.com` |
| CF Zero Trust — Admin UI (email OTP) | ❌ Not Done | Create CF Access Application for `/*` (non-webhook paths) with email OTP policy |
| CF Zero Trust — Webhooks (bypass) | ❌ Not Done | Create CF Access Application for `/webhook/*` with Bypass policy (Meta must reach it unauthenticated) |
| Docker port isolation | ❌ Verify | All container ports must be bound to `127.0.0.1` only — not `0.0.0.0` |
| SSH key-only auth | ❌ Verify | Confirm `PasswordAuthentication no` in sshd_config; Ed25519 key preferred |
| Remove nginx | ❌ Verify | If nginx was installed during initial setup, remove it (no inbound ports needed) |
| Linode Cloud Firewall | ❌ Not Done | Create firewall rule: allow SSH (22) inbound; deny everything else inbound |
| Remove stale DNS records | ❌ Verify | Ensure no A records pointing directly to VPS IP for any web-facing subdomain |
| Webhook signature verification (X-Hub-Signature-256) | ❌ Not Done | Implement Meta HMAC-SHA256 verification in WF-00 (also pending in FDF) |
| Automated DB backups | ❌ Not Done | No backup automation in FDF either — post-hardening item |

**Action:** Cloudflare setup is being done fresh (separate CF account under Chinmay's email). See infra-hardening plan for full phase breakdown.

### Additional Gaps Beyond TD-01 (identified Apr 2026)

| # | Item | Priority | Notes |
|---|------|----------|-------|
| TD-02 | **Automated DB backups** | 🔴 High | Chinmay Astro stores sensitive personal data (name, DOB, birth time/place, consultation history). Higher priority than FDF. Daily pg_dump → attached Linode storage volume + copy to Google Drive. |
| TD-03 | **Meta webhook signature verification** (X-Hub-Signature-256) | 🟡 Medium | Implement in WF-00. Post-MVP — not a go-live blocker. |
| TD-04 | **Slack request signing verification** | 🟡 Medium | Slack events URL needs Bypass policy at CF Zero Trust (same as Meta webhooks). Payload authenticity verified inside n8n using `X-Slack-Signature` HMAC check with Slack app signing secret. Post-MVP. |
| TD-05 | **Encryption service container monitoring** | 🟡 Medium | `encryption-svc` is a separate Docker container required for WhatsApp Flows. No health monitoring beyond WF-70 application-level check. Verify localhost-only binding; add container restart policy. |
| TD-06 | **Data retention implementation** | 🟡 Medium | WF-73 (Data Cleanup) is planned post-go-live but higher priority here than FDF given personal data (birth details, consultation records). Implement before significant user volume. |

---

## Infrastructure Status

### Mumbai VPS (Production) — `astro.chinmaymujumdar.com`

| Component | Status | Notes |
|-----------|--------|-------|
| Linode VPS provisioned | ✅ Done | Ubuntu 24.04 |
| Cloudflare Tunnel (`cloudflared`) | ❌ Not Done | Replaces nginx — see TD-01 |
| nginx / Let's Encrypt | ❌ Remove if installed | FDF model: no nginx, use CF Tunnel |
| Docker + n8n container | ⚠️ Unverified | Partial setup reported |
| PostgreSQL container | ⚠️ Unverified | `chinmay_astro` schema required |
| pgAdmin container | ⚠️ Unverified | |
| Encryption service | ⚠️ Unverified | Required for WhatsApp Flows |
| VPS Hardening | ❌ Not Done | See TD-01 above |

> ⚠️ **Note:** Mumbai VPS workflow status could not be verified — no SSH credentials or n8n API key available in current session. Need to connect directly to confirm what's actually deployed.

### Sydney VPS (Retired as Dev)

> ⚠️ **Apr 2026:** Sydney VPS is no longer used as a dev/staging environment. Mumbai VPS is now the sole environment. All future dev/staging work uses the **Dev folder** in n8n on Mumbai VPS.

| Component | Status | Notes |
|-----------|--------|-------|
| n8n (n8n-aus container) | ⚠️ Idle | No longer active dev use |
| PostgreSQL | ⚠️ Idle | |
| pgAdmin | ⚠️ Idle | |
| Encryption service | ⚠️ Idle | |
| nginx + SSL | ✅ Done | Was proxy for `astro.clientdomain.com` |
| VPS Hardening | ✅ Done | Full FDF-equivalent hardening applied |

### Meta / WhatsApp

| Component | Status | Notes |
|-----------|--------|-------|
| Meta Business Portfolio | ✅ Done | "Friendly Deal Finder" portfolio |
| WABA "Friendly Deal Finder" | ✅ Approved | Currency: AUD, Timezone: Sydney |
| Phone Number +61 413 596 319 | ✅ Connected | Messaging limit: 1,000/24hrs |
| Permanent Access Token | ✅ Generated | Never expires — System User |
| Webhook URL configured | ⚠️ Pending | Needs Mumbai VPS URL |
| WhatsApp Flows (encryption svc) | ✅ Working | Tested on Sydney |

### Slack

| Component | Status | Notes |
|-----------|--------|-------|
| Slack App created | ⚠️ Unverified | Need to confirm for Mumbai |
| OAuth scopes configured | ⚠️ Unverified | Needs groups:read, groups:write etc. |
| Webhook URL registered | ⚠️ Unverified | Needs Mumbai VPS URL |

---

## Workflow Implementation Status

> Sydney and Mumbai are in sync — all 20 built workflows are present on both. Only WF-10 is active on Mumbai; all others inactive pending credential setup and testing.

| WF | Name | Built | Mumbai | Notes |
|----|------|-------|--------|-------|
| WF-00 | Webhook Receiver | ✅ | ✅ Imported, inactive | |
| WF-01 | Message Router | ✅ | ✅ Imported, inactive | |
| WF-02 | User State Router | ✅ | ✅ Imported, inactive | |
| WF-10 | Slack Admin Handler | ✅ | ✅ **Active** | Only active WF |
| WF-11 | Command Parser | ✅ | ✅ Imported, inactive | |
| WF-21 | New User Welcome + Form | ❌ Not Built | ❌ | **Redesigned:** single msg — policy URL + WA Flow form. No YES/NO step. DB write only on form submit. Replaces old WF-30. |
| WF-22 | Form Response Handler | ✅ | ✅ Imported, inactive | First DB write (status=payment_pending) happens here. Verify logic aligns with new design. |
| WF-24 | Payment Confirmation Handler | ✅ | ✅ Imported, inactive | |
| WF-25 | Post-Consultation Options | ✅ | ✅ Imported, inactive | |
| WF-26 | Feedback Recorder | ✅ | ✅ Imported, inactive | New — not in original design |
| WF-27 | Payment Review Handler | ✅ | ✅ Imported, inactive | New — not in original design |
| WF-28 | Post-Consultation Text Handler | ✅ | ✅ Imported, inactive | New — not in original design |
| WF-30 | New User Onboarding | ✅ | ✅ Imported, inactive | |
| WF-35 | Active Consultation Relay | ✅ | ✅ Imported, inactive | |
| WF-40 | Payment Approval Processor | ✅ | ✅ Imported, inactive | |
| WF-41 | Payment Rejection Processor | ✅ | ✅ Imported, inactive | |
| WF-42 | Consultation Closer | ✅ | ✅ Imported, inactive | |
| WF-43 | User Blocker | ✅ | ✅ Imported, inactive | |
| WF-50 | Send WhatsApp | ✅ | ✅ Imported, inactive | |
| WF-51 | Slack Sender | ❌ Not Built | ❌ | May be absorbed into other WFs |
| WF-52 | Slack Channel Manager | ✅ | ✅ Imported, inactive | |
| WF-60 | Message Logger | ✅ | ✅ Imported, inactive | |
| WF-70 | Health Check Monitor | ❌ Not Built | ❌ | Maintenance — post go-live |
| WF-71 | Inactive User Scanner | ❌ Not Built | ❌ | Maintenance — post go-live |
| WF-72 | Payment Reminder | ❌ Not Built | ❌ | Maintenance — post go-live |
| WF-73 | Data Cleanup | ❌ Not Built | ❌ | Maintenance — post go-live |
| WF-74 | Consent Cleanup | ❌ Not Built | ❌ | Maintenance — post go-live |

**Summary:** 20+ workflows built and synced Sydney ↔ Mumbai | WF-12 deactivated 2026-05-18 (BUG-05 — superseded by WF-41) | WF-51 active since 12 Apr 2026 | WF-21 active | WF-70–74 post go-live

---

## Open Items / Pending Work

### Before Go-Live (Blocking)

| # | Item | Status | Priority |
|---|------|--------|----------|
| 1 | Mumbai VPS Docker setup (n8n, Postgres) | ✅ Done | — |
| 2 | `chinmay_astro` schema + tables | ✅ Done (incl. admin_actions) | — |
| 3 | 20 workflows imported to Mumbai | ✅ Done | — |
| 4 | Verify/configure n8n credentials (WhatsApp, Slack, Gemini) | ✅ Done | — |
| 5 | Set up encryption service container (WhatsApp Flows) | ✅ Done | — |
| 6 | Generate n8n API key on Mumbai | ⏳ Deferred (no public URL yet) | — |
| 7 | Activate all workflows in correct order | ⏳ In progress | 🔴 Critical |
| 8 | Update Meta webhook URL → `https://astro.chinmaymujumdar.com/webhook/whatsapp-astro-webhook` | ✅ Done | — |
| 9 | Configure Slack app events URL → Mumbai | ❌ | 🔴 Critical |
| 10 | End-to-end smoke test | ❌ | 🔴 Critical |

### Post Go-Live (Non-Blocking)

| # | Item | Priority |
|---|------|----------|
| ~~11~~ | ~~Assess WF-12, WF-51 — still needed or superseded?~~ | ✅ Resolved 2026-05-18: WF-12 deactivated (orphaned, superseded by WF-41) via BUG-05; WF-51 active and in use by WF-40 |
| 12 | Build WF-70 through WF-74 (maintenance workflows) | 🟡 Medium |
| 13 | Set up Cloudflare Tunnel (fresh CF account under Chinmay's email) | 🔴 Critical — in progress |
| 14 | Create Prod/Dev folders in n8n on Mumbai; move all current workflows to Prod | 🔴 Critical — in progress |
| 15 | Non-text messages (images, voice notes, video) sent by users during `consultation_active` are silently dropped — they reach WF-00 and are parsed but WF-41 only relays text. Chinmay will not see these in Slack. Accepted limitation for go-live; forward non-text payloads in a Phase 2 relay upgrade. | 🟡 Medium |

### Phase 2 (Future)

| # | Item |
|---|------|
| 11 | Razorpay integration (automated payment verification) |
| 12 | Multiple consultation packages / tiered pricing |
| 13 | Session credits / multi-session bookings |

---

## Session Log

| Date | Work Done |
|------|-----------|
| Dec 2024 | Initial design, Sydney VPS setup, core workflow build |
| Mar 2026 | CONTEXT.md + STATUS.md created; Mumbai VPS status investigation initiated |
| Apr 2026 | workflow-registry.md created (full WF-XX audit vs journey maps); TD-02–TD-06 identified; Sydney VPS retired as dev; INFRA.md created; documentation restructure (CONTEXT.md rewritten as lean entry point, INFRA.md contains all infra detail, Slack reference updated for CF Tunnel) |
