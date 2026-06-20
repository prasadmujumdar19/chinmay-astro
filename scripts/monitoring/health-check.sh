#!/usr/bin/env bash
# health-check.sh — PDF-23 VPS infrastructure health check (cron: hourly).
#
# Checks, and alerts via the shared DD-G helper on failure / recovers on clear:
#   1. each core Docker container is running
#   2. PostgreSQL answers a real query (SELECT 1), not just "the port is open"
#   3. root disk usage is under threshold
#   4. the cloudflared host systemd tunnel is active
#
# Alert path is n8n-independent (see alert.sh). Deployed at
# /mnt/chinmay-astro-data/monitoring/health-check.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DIR/alert.sh"

DISK_THRESHOLD="${DISK_THRESHOLD:-85}"
CONTAINERS="${CONTAINERS:-n8n-prod postgres-prod whatsapp-encryption pgadmin-prod}"

# 1. Core containers running?
for c in $CONTAINERS; do
  if [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" = "true" ]; then
    clear_alert "container_${c}"
  else
    send_alert "container_${c}" "Container *${c}* is NOT running on the VPS."
  fi
done

# 2. PostgreSQL responds to a real query (trust auth inside the container).
if docker exec postgres-prod psql -U n8n -d n8n -tAc 'SELECT 1' >/dev/null 2>&1; then
  clear_alert "postgres_query"
else
  send_alert "postgres_query" "PostgreSQL did not answer a test query (SELECT 1) on the VPS."
fi

# 3. Root disk under threshold?
USE=$(df --output=pcent / 2>/dev/null | tail -1 | tr -dc '0-9')
if [ "${USE:-0}" -ge "$DISK_THRESHOLD" ]; then
  send_alert "disk_full" "Disk usage on the VPS is ${USE}% (threshold ${DISK_THRESHOLD}%). Free space before PostgreSQL is affected."
else
  clear_alert "disk_full"
fi

# 4. Cloudflare tunnel (host systemd service, not Docker).
if systemctl is-active --quiet cloudflared; then
  clear_alert "cloudflared"
else
  send_alert "cloudflared" "Cloudflare tunnel (cloudflared) is INACTIVE — the service is unreachable from the internet."
fi
