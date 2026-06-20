#!/usr/bin/env bash
# backup-db.sh — PDF-26 automated PostgreSQL backup with validate-before-rotate.
#
# DD-H policy (on-VPS part; offsite GDrive push is a separate deferred step,
# see OFFSITE stub below — pending rclone configuration):
#   1. pg_dump | gzip the n8n database to a STAGING file.
#   2. VALIDATE the staging dump is restorable BEFORE rotating: restore it into
#      a throwaway temp database and confirm a known table is queryable.
#   3. Only on success: rotate (latest -> prev, staging -> latest). On failure:
#      keep the previous good copy untouched AND alert via the DD-G helper.
#      => a corrupt dump never overwrites the last good copy.
#
# Cron: hourly. Reuses the shared alert helper (alert.sh, PDF-23).
# Deployed at /mnt/chinmay-astro-data/monitoring/backup-db.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DIR/alert.sh"

BACKUP_DIR="${BACKUP_DIR:-/mnt/chinmay-astro-data/backups}"
PG_USER="${PG_USER:-n8n}"
PG_DB="${PG_DB:-n8n}"
VALIDATE_DB="n8n_backup_validate"
VALIDATE_TABLE="${VALIDATE_TABLE:-chinmay_astro.users}"   # a known table that must restore + query

LATEST="$BACKUP_DIR/n8n-latest.sql.gz"
PREV="$BACKUP_DIR/n8n-prev.sql.gz"
STAGING="$BACKUP_DIR/.staging.sql.gz"

mkdir -p "$BACKUP_DIR"

fail() {
  send_alert "db_backup" "Database backup FAILED: $1. The previous good copy was kept."
  rm -f "$STAGING"
  docker exec postgres-prod psql -U "$PG_USER" -d postgres -tAc "DROP DATABASE IF EXISTS $VALIDATE_DB;" >/dev/null 2>&1 || true
  exit 1
}

# 1. Dump -> staging
if ! docker exec postgres-prod pg_dump -U "$PG_USER" -d "$PG_DB" 2>/dev/null | gzip > "$STAGING"; then
  fail "pg_dump/gzip error"
fi
[ -s "$STAGING" ] || fail "dump produced an empty file"

# 2. Validate-before-rotate: restore staging into a throwaway DB and query it.
docker exec postgres-prod psql -U "$PG_USER" -d postgres -tAc "DROP DATABASE IF EXISTS $VALIDATE_DB;" >/dev/null 2>&1
docker exec postgres-prod psql -U "$PG_USER" -d postgres -tAc "CREATE DATABASE $VALIDATE_DB;" >/dev/null 2>&1 \
  || fail "could not create validation database"
if ! gunzip -c "$STAGING" | docker exec -i postgres-prod psql -U "$PG_USER" -d "$VALIDATE_DB" -q >/dev/null 2>&1; then
  fail "restore into validation database failed (corrupt dump)"
fi
ROWS=$(docker exec postgres-prod psql -U "$PG_USER" -d "$VALIDATE_DB" -tAc "SELECT count(*) FROM $VALIDATE_TABLE;" 2>/dev/null | tr -dc '0-9')
docker exec postgres-prod psql -U "$PG_USER" -d postgres -tAc "DROP DATABASE IF EXISTS $VALIDATE_DB;" >/dev/null 2>&1
[ -n "$ROWS" ] || fail "validation query failed ($VALIDATE_TABLE not restorable from the dump)"

# 3. Rotate only on success.
[ -f "$LATEST" ] && mv -f "$LATEST" "$PREV"
mv -f "$STAGING" "$LATEST"
clear_alert "db_backup"

# --- OFFSITE (DD-H step 3) — DEFERRED until rclone + a Google-Drive remote are
# configured on the VPS. Once ready, a twice-daily (00:00 + 12:00 IST) cron will
# push $LATEST to GDrive with a rolling 7-day snapshot retention, e.g.:
#   rclone copyto "$LATEST" "gdrive:chinmay-astro-backups/n8n-$(date +\%Y\%m\%d-\%H\%M).sql.gz"
#   # + prune snapshots older than 7 days; alert via send_alert "db_backup_offsite" on failure.
