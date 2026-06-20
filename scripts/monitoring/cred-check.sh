#!/usr/bin/env bash
# cred-check.sh — PDF-24 scheduled credential-validity probes.
#
# Proactively tests the API credentials that fail silently between customer
# interactions, so the admin hears about an expired/over-quota key BEFORE a
# customer hits a failed message. Reuses the shared DD-G alert helper.
#
#   cred-check.sh gemini    — Gemini API key (cron: 00:00 + 12:00 IST)
#   cred-check.sh whatsapp  — WhatsApp access token (cron: daily)
#   cred-check.sh all       — both (default)
#
# Deployed at /mnt/chinmay-astro-data/monitoring/cred-check.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DIR/alert.sh"

GRAPH_VER="${GRAPH_VER:-v21.0}"

check_gemini() {
  local body code reason
  # -4: egress IPv4 to match production n8n's path — the Gemini key is IP-restricted
  # to the VPS IPv4; an IPv6 call returns 403 (IP restriction), a false negative.
  body=$(curl -4 -s -m 20 -w $'\n%{http_code}' \
    "https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY:-}" 2>/dev/null)
  code=$(printf '%s' "$body" | tail -1)
  if [ "$code" = "200" ]; then
    clear_alert "cred_gemini"
  else
    reason=$(printf '%s' "$body" | sed '$d' | jq -r '.error.message // "unreachable"' 2>/dev/null)
    send_alert "cred_gemini" "Gemini API key check FAILED (HTTP ${code}): ${reason}. Customer free-text replies will fail until this is fixed."
  fi
}

check_whatsapp() {
  local body code reason
  body=$(curl -4 -s -m 20 -w $'\n%{http_code}' \
    "https://graph.facebook.com/${GRAPH_VER}/${WHATSAPP_WABA_ID:-}?access_token=${WHATSAPP_TOKEN:-}" 2>/dev/null)
  code=$(printf '%s' "$body" | tail -1)
  if [ "$code" = "200" ]; then
    clear_alert "cred_whatsapp"
  else
    reason=$(printf '%s' "$body" | sed '$d' | jq -r '.error.message // "unreachable"' 2>/dev/null)
    send_alert "cred_whatsapp" "WhatsApp access token check FAILED (HTTP ${code}): ${reason}. Outbound customer messages will fail until this is fixed."
  fi
}

case "${1:-all}" in
  gemini)   check_gemini ;;
  whatsapp) check_whatsapp ;;
  all)      check_gemini; check_whatsapp ;;
  *) echo "usage: $0 {gemini|whatsapp|all}" >&2; exit 2 ;;
esac
