#!/usr/bin/env bash
# snapshot-for-sprint.sh — Pre-sprint hermetic snapshot of n8n workflows + .pseudo + .md.
# Spec: docs/artefacts/specs/2026-05-24-data-contract-discipline-phase-1/snapshot-restore-design.md
# Invocation: scripts/snapshot-for-sprint.sh <sprint-name> [--force] [--suffix=N]
set -euo pipefail

SPRINT="${1:-}"
[ -z "$SPRINT" ] && { echo "usage: $0 <sprint-name> [--force] [--suffix=N]" >&2; exit 1; }
shift || true
FORCE=0
SUFFIX=""
for a in "$@"; do
  case "$a" in
    --force) FORCE=1 ;;
    --suffix=*) SUFFIX="-${a#--suffix=}" ;;
    *) echo "unknown arg: $a" >&2; exit 1 ;;
  esac
done

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"
[ -f .env ] || { echo "missing .env" >&2; exit 1; }
# shellcheck disable=SC1091
. ./.env
[ -n "${N8N_API_KEY:-}" ] || { echo "N8N_API_KEY missing in .env" >&2; exit 1; }
N8N_BASE="${N8N_BASE:-http://localhost:5678}"

# Sprint-scope workflow IDs — covers every WF in design.md §3 (utilities, routers, guards, consumers).
# Source of truth: docs/artefacts/sprints/2026-05-24-data-contract-discipline-phase-1/state.md
WF_IDS=(
  JQu1MkK5vgtUCeNO  hYGNM97sXvdo1WmI  PubCsNTOspF3xqXZ  wMh0oBRtJbvhLgOf  GoTYo0GS2y8qjjkw
  LgIDj1v4ZbCPlX25  zM8WbxSdt9nXRoLZ  dr8QM0m92Ml8MvIh  VpCER0Vqq3NYJGpI  gGJBY5fJha0Let8I
  HB8nXudAtk9iXz7C  emUOLWVZiNVxcOe3  NcHZedq9ycnAQ9SW  se82n3MUQ9xE5aEr  du32QBZbSQOjfESe
  6PzJRZsF7k2d9hV7  fx70vqyJtRdF2DgR  3va0M06kijgyLejf  Du2CJ3OTohRFZYoA  UV62An60fzflU0uD
  BUVun38WEKb12zg9  wlZRK0YxnhP0b2RL  IO5BZLUxuVmjzk5I  6H75p935FpBVBQtV
)

DATE_UTC="$(date -u +%Y-%m-%d)"
NOW_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
OUT="workflows/pre-${SPRINT}-workflows/${DATE_UTC}${SUFFIX}"

if [ -e "$OUT" ]; then
  if [ "$FORCE" -eq 1 ]; then rm -rf "$OUT"
  else echo "snapshot folder exists: $OUT (pass --force or --suffix=N)" >&2; exit 2
  fi
fi
mkdir -p "$OUT/json" "$OUT/pseudocode" "$OUT/md"

# Probe n8n reachability before starting (clean abort path)
if ! curl -sf -o /dev/null --max-time 5 "$N8N_BASE/healthz"; then
  echo "n8n unreachable at $N8N_BASE" >&2; rm -rf "$OUT"; exit 3
fi

cleanup_fail() { local msg="$1"; echo "FAIL: $msg" >&2; rm -rf "$OUT"; exit 4; }

# Build manifest entries; abort on any per-WF failure.
ENTRIES="[]"
for id in "${WF_IDS[@]}"; do
  body="$(curl -sf -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_BASE/api/v1/workflows/$id")" \
    || cleanup_fail "export failed for $id"
  echo "$body" | jq . > "$OUT/json/$id.json" 2>/dev/null \
    || cleanup_fail "malformed JSON for $id"
  name="$(jq -r '.name' "$OUT/json/$id.json")"
  short="$(echo "$name" | grep -oE 'WF-[0-9]+' | head -1)"
  [ -n "$short" ] || cleanup_fail "could not derive WF-XX short name from name='$name' (id=$id)"
  updated="$(jq -r '.updatedAt' "$OUT/json/$id.json")"
  sha="$(shasum -a 256 "$OUT/json/$id.json" | awk '{print $1}')"
  pseudo_src="docs/pseudocode/${short}.pseudo"
  md_src="docs/pseudocode/${short}.md"
  [ -f "$pseudo_src" ] || cleanup_fail "missing $pseudo_src"
  [ -f "$md_src" ] || cleanup_fail "missing $md_src"
  cp "$pseudo_src" "$OUT/pseudocode/${short}.pseudo"
  cp "$md_src" "$OUT/md/${short}.md"
  ENTRIES="$(echo "$ENTRIES" | jq \
    --arg id "$id" --arg name "$name" --arg short "$short" \
    --arg sha "$sha" --arg upd "$updated" \
    --arg pp "pseudocode/${short}.pseudo" --arg mp "md/${short}.md" \
    '. + [{wf_id:$id, wf_name:$name, wf_short:$short, json_sha256:$sha, json_n8n_updatedAt:$upd, pseudo_path:$pp, md_path:$mp}]')"
  echo "  ✓ $short ($id)"
done

jq -n --arg sprint "$SPRINT" --arg ts "$NOW_UTC" --arg base "$N8N_BASE" --argjson wfs "$ENTRIES" \
  '{sprint:$sprint, snapshot_taken_at:$ts, n8n_base_url:$base, workflows:$wfs}' > "$OUT/manifest.json"

SIZE="$(du -sh "$OUT" | awk '{print $1}')"
echo "snapshot OK — ${#WF_IDS[@]} workflows in $OUT ($SIZE)"
