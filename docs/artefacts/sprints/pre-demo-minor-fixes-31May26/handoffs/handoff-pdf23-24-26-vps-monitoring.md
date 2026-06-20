## Stopping Point
Batch 14 (PDF-23 VPS health checks + shared DD-G alert helper, PDF-24 credential probes) is DONE and live-verified; PDF-26's on-VPS hourly backup with validate-before-rotate is DONE and live-verified — stopped with PDF-26's offsite Google-Drive push still 🔴 blocked on rclone. All monitoring lives in `/mnt/chinmay-astro-data/monitoring/` on the VPS (committed secret-free copies in repo `scripts/monitoring/`); 4 cron jobs active. Sprint is rolling and stays open (`_active` retained).

## Next Action
Resume PDF-26 offsite (P1, the highest-priority open item): install `rclone` on the VPS, configure a Google-Drive remote (interactive auth — needs the user), then wire the twice-daily (00:00+12:00 IST = 18:30+06:30 UTC) offsite push (stub + intended command already in `scripts/monitoring/backup-db.sh`), 7-day rolling snapshot prune, and an offsite-failure `send_alert`. If rclone setup isn't ready, instead build PDF-25 (WF-70 in-service health monitor) — fully unblocked, tunnel-only; mirror the WF-75 build pattern, author `WF-70.pseudo` in-batch.

## Blockers
- **PDF-26 offsite** 🔴 blocked on rclone + a Google-Drive remote (external prereq, interactive auth on the user's side). On-VPS backup is fully working without it.
- **PDF-22** (P2) needs a Claude Cloud routine connector/outbound-HTTP to the alert destination — none attached today.
- **PDF-02/03** (P2) design-gated — user said ignore this session.
- **Plugin improvement:** `assert-tasks-state-status-sync.sh` `classify()` (v1.40.0 line 64) doesn't list `blocked` in the OPEN class → a canonical `🔴 blocked` status emits a (non-fatal) WARN. Detail in sprint `followups.md` [2026-06-20]. Apply via `flush-plugin-improvements` before next sprint.

## Changed Reference Values
- **New VPS dir:** `/mnt/chinmay-astro-data/monitoring/` (alert.sh, health-check.sh, cred-check.sh, backup-db.sh, extract-secrets.sh, README.md, state/) + `secrets.env` (root-600, VPS-only, never committed). Backups in `/mnt/chinmay-astro-data/backups/` (n8n-latest.sql.gz + n8n-prev.sql.gz).
- **Root crontab:** now has 4 entries — health-check `0 * * * *`, backup-db `15 * * * *`, cred-check gemini `30 6,18 * * *`, cred-check whatsapp `0 7 * * *` (host is UTC).
- **DD-G refined:** alerts reuse the existing n8n Slack bot token via `chat.postMessage` to `chinmay-admin-commands` (C0A5B0ZE81E), NOT a new incoming-webhook.
- **New memory:** `project_gemini_key_ipv4_restriction` — prod Gemini key (`googlePalmApi`) is IP-restricted to the VPS IPv4; off-n8n probes must `curl -4`.
- **Commit status:** the Batch-14 changeset was already pushed (`2949a4e..748e80c`); the PDF-26 changeset is committed as the same push that carries this handoff — if you're reading this file on `main`, that work is pushed.
