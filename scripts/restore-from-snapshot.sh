#!/usr/bin/env bash
# restore-from-snapshot.sh — Selective PUT-restore of n8n workflows from a sprint snapshot.
# Spec: docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/snapshot-restore-design.md
# Invocation:
#   scripts/restore-from-snapshot.sh <sprint> [--workflows WF-50,WF-51 | id1,id2] [--date YYYY-MM-DD] [--dry-run]
set -euo pipefail

SPRINT="${1:-}"
[ -z "$SPRINT" ] && { echo "usage: $0 <sprint> [--workflows ...] [--date YYYY-MM-DD] [--dry-run]" >&2; exit 1; }
shift || true
FILTER=""
DATE=""
DRY=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --workflows) shift; FILTER="$1" ;;
    --workflows=*) FILTER="${a#--workflows=}" ;;
    --date) shift; DATE="$1" ;;
    --date=*) DATE="${a#--date=}" ;;
    *) ;;
  esac
  shift || true
done

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"
[ -f .env ] || { echo "missing .env" >&2; exit 1; }
# shellcheck disable=SC1091
. ./.env
[ -n "${N8N_API_KEY:-}" ] || { echo "N8N_API_KEY missing in .env" >&2; exit 1; }
N8N_BASE="${N8N_BASE:-http://localhost:5678}"

BASE_DIR="workflows/pre-${SPRINT}-workflows"
[ -d "$BASE_DIR" ] || { echo "no snapshots found for sprint $SPRINT at $BASE_DIR" >&2; exit 1; }

if [ -z "$DATE" ]; then
  SNAPSHOT="$(ls -1 "$BASE_DIR" | sort | tail -1)"
else
  SNAPSHOT="$DATE"
fi
SNAP_DIR="$BASE_DIR/$SNAPSHOT"
[ -f "$SNAP_DIR/manifest.json" ] || { echo "missing $SNAP_DIR/manifest.json" >&2; exit 1; }

# Resolve filter → list of wf_ids to operate on.
if [ -n "$FILTER" ]; then
  IFS=',' read -r -a TOKENS <<< "$FILTER"
  IDS=()
  for t in "${TOKENS[@]}"; do
    if [[ "$t" =~ ^WF-[0-9]+$ ]]; then
      match="$(jq -r --arg s "$t" '.workflows[] | select(.wf_short==$s) | .wf_id' "$SNAP_DIR/manifest.json")"
    else
      match="$(jq -r --arg s "$t" '.workflows[] | select(.wf_id==$s) | .wf_id' "$SNAP_DIR/manifest.json")"
    fi
    [ -n "$match" ] || { echo "filter token not in manifest: $t" >&2; exit 1; }
    IDS+=("$match")
  done
else
  mapfile -t IDS < <(jq -r '.workflows[].wf_id' "$SNAP_DIR/manifest.json")
fi

if [ "$DRY" -eq 1 ]; then
  echo "DRY RUN — snapshot=$SNAP_DIR"
  curl -sf -o /dev/null --max-time 5 "$N8N_BASE/healthz" \
    || { echo "n8n unreachable at $N8N_BASE" >&2; exit 3; }
  for id in "${IDS[@]}"; do
    short="$(jq -r --arg id "$id" '.workflows[] | select(.wf_id==$id) | .wf_short' "$SNAP_DIR/manifest.json")"
    snap_json="$SNAP_DIR/json/$id.json"
    jq . "$snap_json" >/dev/null || { echo "  ✗ $short: malformed snapshot JSON"; continue; }
    live="$(curl -sf -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_BASE/api/v1/workflows/$id")" || { echo "  ✗ $short: live fetch failed"; continue; }
    snap_nodes="$(jq -r '[.nodes[].name] | sort | join(",")' "$snap_json")"
    live_nodes="$(echo "$live" | jq -r '[.nodes[].name] | sort | join(",")')"
    if [ "$snap_nodes" = "$live_nodes" ]; then nd="no node-name diff"
    else nd="node-name diff present"; fi
    echo "  ◦ $short ($id): $nd; would overwrite docs/pseudocode/${short}.pseudo + .md"
  done
  echo "DRY RUN complete — no writes."
  exit 0
fi

OK=0; FAIL=0
for id in "${IDS[@]}"; do
  short="$(jq -r --arg id "$id" '.workflows[] | select(.wf_id==$id) | .wf_short' "$SNAP_DIR/manifest.json")"
  snap_json="$SNAP_DIR/json/$id.json"
  if curl -sf -X PUT -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json" \
       --data @"$snap_json" "$N8N_BASE/api/v1/workflows/$id" -o /dev/null; then
    cp "$SNAP_DIR/pseudocode/${short}.pseudo" "docs/pseudocode/${short}.pseudo"
    cp "$SNAP_DIR/md/${short}.md"             "docs/pseudocode/${short}.md"
    echo "  ✓ $short ($id) — restored"
    OK=$((OK+1))
  else
    echo "  ✗ $short ($id) — PUT failed"
    FAIL=$((FAIL+1))
  fi
done
echo "summary: $OK ok, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 5
