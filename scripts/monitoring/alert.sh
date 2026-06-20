#!/usr/bin/env bash
# alert.sh — shared n8n-independent Slack alert helper (DD-G; PDF-23 carrier).
#
# Source this file, then call:
#     send_alert  <dedupe-key> <message-text>   # raise (repeat-suppressed)
#     clear_alert <dedupe-key>                   # recover (post once, clear state)
#
# Alerts are POSTed straight to Slack's chat.postMessage Web API using the
# bot token n8n already uses (extracted once into secrets.env). This path is
# deliberately INDEPENDENT of n8n — n8n may itself be the thing that is down.
#
# Repeat-suppress: a key alerts at most once per $SUPPRESS_SECONDS while the
# fault persists, so a multi-hour outage does not flood the channel.
#
# Deployed location on VPS: /mnt/chinmay-astro-data/monitoring/alert.sh
# Committed (secret-free) copy: repo scripts/monitoring/alert.sh

MON_DIR="${MON_DIR:-/mnt/chinmay-astro-data/monitoring}"
STATE_DIR="$MON_DIR/state"
SUPPRESS_SECONDS="${SUPPRESS_SECONDS:-21600}"   # 6h re-alert interval

# Load Slack token + channel (and any probe creds) — VPS-only, chmod 600.
if [ -f "$MON_DIR/secrets.env" ]; then
  # shellcheck disable=SC1090,SC1091
  . "$MON_DIR/secrets.env"
fi
mkdir -p "$STATE_DIR"

# _slack_post <text> -> prints "true" on success, anything else on failure.
_slack_post() {
  curl -s -m 15 -X POST https://slack.com/api/chat.postMessage \
    -H "Authorization: Bearer ${SLACK_BOT_TOKEN:-}" \
    -H "Content-Type: application/json; charset=utf-8" \
    --data "$(jq -n --arg ch "${SLACK_ALERT_CHANNEL:-}" --arg t "$1" '{channel:$ch,text:$t}')" \
    2>/dev/null | jq -r '.ok' 2>/dev/null
}

# send_alert <key> <message>
send_alert() {
  local key="$1" msg="$2" now last f
  f="$STATE_DIR/${key}.alerted"
  now=$(date +%s)
  if [ -f "$f" ]; then
    last=$(cat "$f" 2>/dev/null || echo 0)
    if [ $(( now - last )) -lt "$SUPPRESS_SECONDS" ]; then
      return 0   # within suppress window — stay quiet
    fi
  fi
  if [ "$(_slack_post ":rotating_light: *VPS alert* — ${msg}")" = "true" ]; then
    echo "$now" > "$f"
  fi
  # If the post failed we deliberately do NOT record state, so the next run retries.
}

# clear_alert <key> — only speaks if this key had an active alert.
clear_alert() {
  local key="$1" f
  f="$STATE_DIR/${key}.alerted"
  if [ -f "$f" ]; then
    _slack_post ":white_check_mark: *VPS recovered* — ${key}"
    rm -f "$f"
  fi
}
