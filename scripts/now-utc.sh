#!/bin/bash
# now-utc.sh — emit the current time as UTC ISO 8601 with `Z` suffix.
#
# Usage:   scripts/now-utc.sh
# Output:  e.g. 2026-05-18T14:12:13Z
#
# Project timestamp convention — see CLAUDE.md "Timestamp Convention" section
# and docs/artefacts/specs/2026-05-18-timestamp-convention-design.md.
# Every timestamp written to any artefact in this repo uses this format.
set -euo pipefail
date -u +%Y-%m-%dT%H:%M:%SZ
