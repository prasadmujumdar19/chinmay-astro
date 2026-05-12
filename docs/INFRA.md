# Chinmay Astro — Infrastructure Reference

**Last Updated:** 2026-04-24
**Purpose:** Infrastructure detail — what's running, how it's secured, how to verify/reproduce each control.

---

## Quick Reference — Current Architecture

```
Internet
    │
    ├── chinmaymujumdar.com / www ──► GoDaddy DNS ──► GoDaddy Website Builder (hosting)
    │                                  (GoDaddy nameservers remain authoritative)
    │
    └── n8n UI + webhooks ──► friendlydealfinder.com.au (Cloudflare-managed DNS)
                                        │
                                        ▼
                               Cloudflare Zero Trust
                               (Account: friendlydealfinder.com.au)
                                        │
                         ┌──────────────┴──────────────┐
                         │                             │
              chinmayastro-n8n.friendlydealfinder.com.au
                         │
                  CF Access Applications:
                  ├── /* ──► Email OTP policy (n8n UI)
                  └── /webhook/* ──► Bypass policy (Meta/Slack webhooks)
                         │
                  CF Tunnel: chinmay-astro-mumbai-prod
                  (DNS entry auto-added by CF — do NOT add manually)
                         │
                         ▼
              Linode Mumbai VPS (45.79.125.184)
              Ubuntu 24.04 | No open ports 80/443
                         │
              systemd service (host)
              └── cloudflared (outbound tunnel to CF edge)

              Docker (n8n-network)
              ├── n8n            :5678 (localhost only)
              ├── postgres       :5432 (internal only)
              ├── pgadmin        :5050 (localhost only)
              └── encryption-svc (WhatsApp Flows, localhost only)
```

**Why friendlydealfinder.com.au and NOT chinmaymujumdar.com:**
- `chinmaymujumdar.com` website is built on GoDaddy's Website Builder, which does NOT expose an IP address for its hosting. This makes it impossible to set up a Cloudflare Tunnel CNAME pointing at a GoDaddy-hosted site.
- `friendlydealfinder.com.au` is already fully Cloudflare-managed (nameservers transferred to Cloudflare), so adding new subdomains and tunnels is straightforward.
- Solution: add a second CF Tunnel in the friendlydealfinder.com.au Cloudflare account pointing to the Mumbai VPS, then add subdomains there.

**Key rules for CF Tunnel + DNS:**
1. **Do NOT manually add DNS entries** for tunnel subdomains — Cloudflare adds them automatically when a tunnel hostname is configured.
2. **Subdomain depth matters for free SSL:** `chinmayastro-n8n.friendlydealfinder.com.au` (one level) works fine. `chinmayastro.n8n.friendlydealfinder.com.au` (two levels) requires Advanced Certificate Manager (paid) — avoid.
3. **GoDaddy Website Builder = no IP** — any domain whose website is built with GoDaddy's Website Builder cannot follow this CF Tunnel pattern. Hostinger-hosted domains do expose an IP and can be used.

**DNS model:** `friendlydealfinder.com.au` nameservers are fully managed by Cloudflare. Subdomains for Chinmay Astro are added there.

**Security model:** No nginx. No open ports 80/443. All n8n/webhook traffic enters through Cloudflare Tunnel — an outbound-only connection from the VPS to Cloudflare's edge. The VPS public IP is never directly reachable for web traffic.

**n8n URL (production):** `https://chinmayastro-n8n.friendlydealfinder.com.au`
**n8n API base:** `https://chinmayastro-n8n.friendlydealfinder.com.au/api/v1`

**⚠️ .env.production requirement:** The n8n `WEBHOOK_URL` and `N8N_HOST` env vars in `.env.production` (in the Docker config folder on mounted storage) must be set to the full Cloudflare URL. Without this, n8n appends `:5678` from its internal config, breaking webhook URLs shown in the UI and sent to Meta.

→ For current status of each control, see `STATUS.md` (TD-01 section)

---

## Section 2.1 — Cloudflare Tunnel Setup

### What It Does
Replaces nginx + Let's Encrypt. `cloudflared` runs as a **systemd service** on the host (not Docker), maintaining a persistent outbound connection to Cloudflare's edge. Cloudflare terminates HTTPS and proxies traffic to `localhost:5678` on the VPS — no inbound ports required.

**Why systemd (not Docker):** When cloudflared runs as a Docker container, `localhost` inside the container refers to the container itself — not the host. This causes "connection refused" errors to n8n at `localhost:5678`. Running as a systemd service on the host resolves this cleanly.

### Current Live Setup (Apr 2026)

The tunnel is configured under the **friendlydealfinder.com.au Cloudflare account** (not a separate Chinmay Astro account). Navigate to:
`https://dash.cloudflare.com/9409f1f74ac906f77f87ebd2b1e8a95d/one/networks/connectors`

**Tunnel:** `chinmay-astro-mumbai-prod`
- Routes to: `http://localhost:5678` (n8n on Mumbai VPS)
- Public hostname: `chinmayastro-n8n.friendlydealfinder.com.au`

**CF Access Applications** (under the same account):
| Application | Domain + Path | Policy |
|---|---|---|
| Chinmay Astro n8n UI | `chinmayastro-n8n.friendlydealfinder.com.au/*` | Email OTP |
| Chinmay Astro Webhooks | `chinmayastro-n8n.friendlydealfinder.com.au/webhook*` | Bypass |

**DNS:** Auto-added by Cloudflare when tunnel hostname was configured. Do NOT add manually.

### Setup Steps (for reproduction/disaster recovery)

**1. In the friendlydealfinder.com.au Cloudflare account:**
- Zero Trust → Networks → Tunnels → Create tunnel
- Type: Cloudflared | Name: `chinmay-astro-mumbai-prod`
- Copy the tunnel token shown

**2. Install cloudflared binary on Mumbai VPS host**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

**3. Install and start as systemd service**
```bash
sudo cloudflared service install <TUNNEL_TOKEN>
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

**4. Configure public hostname in Cloudflare dashboard**

Zero Trust → Networks → Tunnels → `chinmay-astro-mumbai-prod` → Public Hostnames:

| Subdomain | Domain | Path | Service |
|---|---|---|---|
| `chinmayastro-n8n` | `friendlydealfinder.com.au` | (blank) | `http://localhost:5678` |

⚠️ DNS record is added automatically — do NOT add it manually in DNS settings.

**5. Set .env.production on the VPS**

In the Docker config folder (mounted storage), add/update `.env.production`:
```
WEBHOOK_URL=https://chinmayastro-n8n.friendlydealfinder.com.au/
N8N_HOST=chinmayastro-n8n.friendlydealfinder.com.au
N8N_PROTOCOL=https
```
Without this, n8n appends `:5678` to webhook URLs, breaking Meta's connectivity.

**6. Verify tunnel is connected**
- Zero Trust → Networks → Tunnels → `chinmay-astro-mumbai-prod` → Status: Healthy
- `sudo systemctl status cloudflared` — should show active (running)

---

## Section 2.2 — Cloudflare Access (OTP + Bypass)

### What It Does
Two CF Access Applications control who can reach what:
- **Admin UI app** (`/*`) — requires email OTP. Blocks all unauthenticated requests to the n8n interface.
- **Webhook bypass app** (`/webhook*`) — Bypass policy. Allows Meta and Slack webhooks to reach n8n without authentication.

Both are configured under the **friendlydealfinder.com.au Cloudflare account**.

### Setup Steps

**Access Application 1 — Admin UI (OTP-gated)**
- Zero Trust → Access → Applications → Add application → Self-hosted
- Application name: `Chinmay Astro n8n UI`
- Session duration: 24 hours
- Application domain: `chinmayastro-n8n.friendlydealfinder.com.au`
- Path: (leave blank — covers `/*`)
- Policy:
  - Policy name: `Email OTP`
  - Action: Allow
  - Include: Emails → authorised email addresses
- Authentication method: One-time PIN (email)

**Access Application 2 — Webhook Bypass**
- Same flow: Add application → Self-hosted
- Application name: `Chinmay Astro Webhooks`
- Application domain: `chinmayastro-n8n.friendlydealfinder.com.au`
- Path: `/webhook`
- Policy:
  - Policy name: `Bypass`
  - Action: Bypass
  - Include: Everyone

**Verify bypass is working:**
```bash
curl -X GET "https://chinmayastro-n8n.friendlydealfinder.com.au/webhook/test"
# Should return n8n response (not CF Access login redirect)
```

**Verify OTP gate is working:**
- Navigate to `https://chinmayastro-n8n.friendlydealfinder.com.au/` in browser → should show CF Access email OTP page

---

## Section 2.3 — Linode Cloud Firewall

### What It Does
Network-level firewall on the Linode account (not UFW on the VPS). Blocks all inbound traffic except SSH. Since web traffic uses Cloudflare Tunnel (outbound only), no inbound HTTP/HTTPS rules are needed.

### Setup Steps

**In Linode Cloud Manager:**
- Firewalls → Create Firewall
- Label: `chinmay-astro-fw`

**Inbound rules:**
| Rule | Protocol | Port | Source | Action |
|------|----------|------|--------|--------|
| Allow SSH | TCP | 22 | All IPv4, All IPv6 | Accept |
| Default | All | All | All | Drop |

**Outbound rules:** Allow all (default)

**Assign firewall to VPS:**
- Firewalls → `chinmay-astro-fw` → Linodes → Add Linode → select Mumbai VPS

**Verify:**
```bash
# From external machine — should time out (not refused, not accepted)
nc -zv 45.79.125.184 80
nc -zv 45.79.125.184 443
# SSH should still work
ssh root@45.79.125.184
```

---

## Section 2.4 — SSH Hardening

### What It Does
Ensures VPS is only accessible via SSH key (no password auth). Ed25519 key preferred for security and brevity.

### Verify Current State
```bash
# On VPS
grep PasswordAuthentication /etc/ssh/sshd_config
# Should show: PasswordAuthentication no

grep PubkeyAuthentication /etc/ssh/sshd_config
# Should show: PubkeyAuthentication yes
```

### If Not Hardened — Steps to Apply
```bash
# 1. Ensure your key is in authorized_keys BEFORE disabling passwords
cat ~/.ssh/authorized_keys  # verify your key is present

# 2. Edit sshd_config
sudo nano /etc/ssh/sshd_config
# Set:
#   PasswordAuthentication no
#   PubkeyAuthentication yes
#   PermitRootLogin prohibit-password  (or 'yes' if root key auth is the model)

# 3. Reload SSH daemon
sudo systemctl reload sshd

# 4. Test from a new terminal (don't close the current session yet)
ssh -i ~/.ssh/your-key root@45.79.125.184
```

### Admin Tunnel (n8n + pgAdmin)
```bash
# Opens localhost:5678 → n8n, localhost:5050 → pgAdmin
ssh -L 5678:localhost:5678 -L 5050:localhost:5050 root@45.79.125.184
```

---

## Section 2.5 — Docker Port Isolation

### What It Does
All Docker containers must bind their ports to `127.0.0.1` only (not `0.0.0.0`). This prevents containers from being directly reachable from the internet even if the Linode firewall is misconfigured.

### Verify
```bash
docker inspect n8n | grep -A5 "HostIp"
# Should show: "HostIp": "127.0.0.1"  (not "0.0.0.0")

# Check all containers at once
docker ps -q | xargs -I {} docker inspect {} --format '{{.Name}}: {{range .NetworkSettings.Ports}}{{.}}{{end}}'
```

### Correct docker-compose.yml Pattern
```yaml
services:
  n8n:
    ports:
      - "127.0.0.1:5678:5678"   # ✅ localhost only
      # NOT - "5678:5678"        # ❌ binds to 0.0.0.0

  pgadmin:
    ports:
      - "127.0.0.1:5050:5050"   # ✅ localhost only

  postgres:
    # No ports exposed — internal Docker network only
    expose:
      - "5432"

  encryption-svc:
    # No ports exposed to host — accessed internally by n8n
    expose:
      - "3000"  # (or whichever port the service uses)
```

**Note:** `cloudflared` is **not** in Docker — it runs as a systemd service on the host. No Docker port mapping needed.

---

## Section 2.6 — Database Backup Plan

### Current State
❌ Not implemented (TD-02). This is a high-priority item — Chinmay Astro stores sensitive personal data (name, DOB, birth time/place, consultation history).

### Target Architecture
- **Frequency:** Daily automated `pg_dump`
- **Primary storage:** Attached Linode Block Storage volume
- **Secondary storage:** Copy to Google Drive (for offsite redundancy)
- **Retention:** 30 days of daily backups

### Implementation Plan

**Step 1 — Attach Linode Block Storage**
- Linode Cloud Manager → Mumbai VPS → Storage → Add Volume
- Size: 10 GB (adjust as data grows)
- Mount at: `/mnt/backups`
- Add to `/etc/fstab` for auto-mount on reboot

**Step 2 — Backup script**
```bash
# /usr/local/bin/db-backup.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/mnt/backups/postgres
mkdir -p $BACKUP_DIR

# Dump chinmay_astro schema
docker exec postgres pg_dump \
  -U postgres \
  -n chinmay_astro \
  chinmay_astro_db \
  | gzip > $BACKUP_DIR/chinmay_astro_$TIMESTAMP.sql.gz

# Retain last 30 days only
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: chinmay_astro_$TIMESTAMP.sql.gz"
```

```bash
chmod +x /usr/local/bin/db-backup.sh
```

**Step 3 — Schedule via cron**
```bash
crontab -e
# Add:
0 2 * * * /usr/local/bin/db-backup.sh >> /var/log/db-backup.log 2>&1
```

**Step 4 — Google Drive copy (optional)**
- Use `rclone` configured with a Google Drive service account
- Append to backup script: `rclone copy $BACKUP_DIR/chinmay_astro_$TIMESTAMP.sql.gz gdrive:chinmay-astro-backups/`

**Step 5 — Verify**
```bash
# Run manually first
/usr/local/bin/db-backup.sh

# Check backup file exists and is non-zero
ls -lh /mnt/backups/postgres/

# Test restore (on dev)
gunzip -c /mnt/backups/postgres/chinmay_astro_<timestamp>.sql.gz | \
  docker exec -i postgres psql -U postgres chinmay_astro_db
```
