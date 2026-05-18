#!/bin/bash
# assert-md-fresh.sh — verify docs/pseudocode/WF-XX.md is current vs. live n8n.
#
# Usage:   scripts/assert-md-fresh.sh <WF-XX | n8n-uuid>
# Exit 0:  .md is provably current — safe to load into context.
# Exit 2:  .md is stale or missing — regenerate before loading.
# Exit 1:  argument / env / network error.
#
# Logic: compares mtime of docs/pseudocode/<WF-XX>.md (epoch seconds) against
# live workflow.updatedAt from the n8n API (epoch seconds). Fresh iff the .md
# was modified at-or-after the live updatedAt timestamp.
#
# This is a stopgap implementation. The durable design is to embed live_updated_at
# directly into the .md frontmatter so the check is hermetic (no mtime sensitivity).
# That change goes into the plugin (build-workflow + generate-workflow-md) after
# this sprint via flush-plugin-improvements.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 <WF-XX | n8n-uuid>" >&2
  exit 1
fi

ARG="$1"

if [ -z "${N8N_API_KEY:-}" ] || [ -z "${N8N_BASE_URL:-}" ]; then
  if [ -f .env ]; then
    set -a; . ./.env; set +a
  fi
fi
if [ -z "${N8N_API_KEY:-}" ] || [ -z "${N8N_BASE_URL:-}" ]; then
  echo "error: N8N_API_KEY and N8N_BASE_URL must be set (in .env or env)" >&2
  exit 1
fi

# Resolve WF-XX -> uuid via workflow-registry.md, or accept uuid directly.
if [[ "$ARG" =~ ^WF-[0-9]+$ ]]; then
  WF="$ARG"
  UUID=$(grep -oE "\($ARG[^)]*\([A-Za-z0-9]{16}\)" docs/workflow-registry.md 2>/dev/null | head -1 | grep -oE '[A-Za-z0-9]{16}' | tail -1 || true)
  if [ -z "$UUID" ]; then
    UUID=$(grep -oE "\([A-Za-z0-9]{16}\)" docs/workflow-registry.md | head -1 >/dev/null && \
           grep "$ARG " docs/workflow-registry.md | grep -oE '\([A-Za-z0-9]{16}\)' | head -1 | tr -d '()')
  fi
  if [ -z "$UUID" ]; then
    echo "error: could not resolve $ARG to a uuid via docs/workflow-registry.md" >&2
    exit 1
  fi
else
  UUID="$ARG"
  WF=$(grep -E "\($UUID\)" docs/workflow-registry.md 2>/dev/null | grep -oE 'WF-[0-9]+' | head -1 || echo "WF-?")
fi

MD_PATH="docs/pseudocode/${WF}.md"
if [ ! -f "$MD_PATH" ]; then
  echo "STALE: $MD_PATH does not exist — regenerate first" >&2
  exit 2
fi

# .md mtime (epoch seconds, BSD stat on macOS)
if MD_MTIME=$(stat -f %m "$MD_PATH" 2>/dev/null); then :
elif MD_MTIME=$(stat -c %Y "$MD_PATH" 2>/dev/null); then :
else
  echo "error: cannot stat $MD_PATH" >&2; exit 1
fi

# live updatedAt -> epoch seconds. Curl just the workflow body; jq the field.
LIVE_ISO=$(curl -sf -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_BASE_URL/workflows/$UUID" | jq -r '.updatedAt // empty')
if [ -z "$LIVE_ISO" ]; then
  echo "error: could not fetch updatedAt for $UUID ($WF)" >&2; exit 1
fi

# Convert ISO (always UTC — n8n returns Z-suffixed timestamps) -> epoch seconds.
# BSD `date -j` defaults to local TZ for parsing; force UTC with TZ=UTC to avoid
# off-by-TZ-offset bugs. GNU date handles the trailing Z natively.
ISO_NO_MS="${LIVE_ISO%.*}"          # strip .NNNZ
ISO_NO_MS="${ISO_NO_MS%Z}"          # strip trailing Z so format matches
if LIVE_EPOCH=$(TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%S" "$ISO_NO_MS" "+%s" 2>/dev/null); then :
elif LIVE_EPOCH=$(date -d "$LIVE_ISO" "+%s" 2>/dev/null); then :
else
  echo "error: cannot parse $LIVE_ISO" >&2; exit 1
fi

if [ "$MD_MTIME" -ge "$LIVE_EPOCH" ]; then
  printf 'FRESH: %s mtime=%s live_updated_at=%s (delta=+%ss)\n' \
    "$MD_PATH" "$(date -r "$MD_MTIME" -u +%Y-%m-%dT%H:%M:%SZ)" "$LIVE_ISO" \
    "$((MD_MTIME - LIVE_EPOCH))"
  exit 0
else
  printf 'STALE: %s mtime=%s < live_updated_at=%s (behind by %ss) — regenerate before loading\n' \
    "$MD_PATH" "$(date -r "$MD_MTIME" -u +%Y-%m-%dT%H:%M:%SZ)" "$LIVE_ISO" \
    "$((LIVE_EPOCH - MD_MTIME))" >&2
  exit 2
fi
