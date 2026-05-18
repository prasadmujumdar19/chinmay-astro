# P2-2.5 audit — displayed-timestamp expressions across message-send workflows

**Date:** 2026-05-18
**Sprint:** `2026-05-18-timestamp-convention-design`
**Reference decisions:** [D1 in decisions.md](./decisions.md) — relative phrasing preferred, IST fallback. NOT Sydney.

## Scope

Workflows audited: WF-32, WF-33, WF-34, WF-42, WF-43, WF-44, WF-50, WF-51.

For each workflow, every node parameter was extracted from the locally-cached JSON export (`workflows/<id>.json`, dated 18 May 22:24 — pre-Batch-3 export; workflow content unchanged in Batch 3 which only touched container TZ + DB schema). jq-flattened per-node `parameters` blobs were grepped for the following patterns:

| Pattern | Intent |
|---|---|
| `toISOString` | JS time→ISO string rendering |
| `toLocaleString` | JS locale-aware time rendering (would imply user-facing display) |
| `setZone` | luxon DateTime explicit TZ setting |
| `toFormat` | luxon DateTime formatting |
| `DateTime.fromISO` | luxon parse |
| `Asia/Kolkata` / `Asia/Sydney` | explicit TZ literals |
| `$now` | n8n built-in current-time expression |
| `new Date(` | JS Date constructor |

Postgres nodes were separately grepped for SQL `NOW()` / `CURRENT_TIMESTAMP` usage — these are internal DB stores, not display, but documented for completeness.

## Findings — display-timestamp patterns

| Workflow | Display-pattern hits | Classification |
|---|---|---|
| WF-32 Payment Confirmation Receiver | 0 | — |
| WF-33 Payment Approval Processor | 0 | — |
| WF-34 Payment Rejection Processor | 0 | — |
| WF-42 Consultation Closer | 0 | — |
| WF-43 Post-Consultation Handler | 0 | — |
| WF-44 Feedback Recorder | 0 | — |
| WF-50 Send WhatsApp | 2 | `internal-no-action` (see below) |
| WF-51 Send Slack Message | 0 | — |

### WF-50 hits in detail

Two `new Date().toISOString()` references found, both in JS Code nodes that build the payload passed to WF-60 (message logger), not into the WhatsApp message body:

1. **Process Result** code node — adds `sentAt: new Date().toISOString()` to the result object handed to WF-60.
2. **Build Drop Return** code node — adds `sentAt: new Date().toISOString()` on the drop branch (when a message body is empty and dropped).

`JavaScript Date.toISOString()` always emits UTC by spec. These values flow into `chinmay_astro.messages.created_at` (and other log fields) which is now `timestamptz` (Batch 3). The wire format is UTC. The values are never embedded in a WhatsApp or Slack message visible to a user or admin.

**Classification:** `internal-no-action`. Aligned with the convention.

## Findings — SQL `NOW()` usage (internal stores)

| Workflow | Query / column | Target column type (post-Batch-3) | OK? |
|---|---|---|---|
| WF-32 | `UPDATE users SET updated_at = NOW(), last_message_at = NOW()` | `timestamptz` | ✓ |
| WF-33 | `UPDATE payments SET verified_at = NOW(), ...; INSERT consultations VALUES (..., NOW()); UPDATE users SET ... updated_at = NOW()` | all `timestamptz` | ✓ |
| WF-34 | `UPDATE payments SET rejected_at = NOW(), ...; UPDATE users SET status='payment_pending', updated_at = NOW()` | `timestamptz` | ✓ |
| WF-42 | `UPDATE consultations SET ended_at = NOW(), ...; UPDATE users SET ... updated_at = NOW()` | `timestamptz` | ✓ |
| WF-43 | (no SQL NOW() usage) | — | — |
| WF-44 | `UPDATE users SET feedback=$1, stage=NULL, updated_at = NOW()` | `timestamptz` | ✓ |
| WF-50 | (no SQL NOW() usage — uses JS Date.toISOString instead) | — | — |
| WF-51 | (no SQL NOW() usage — pure Slack post node) | — | — |

All `NOW()` resolution now happens under Postgres session TZ = UTC (per Batch 3 P2-2.1). Target columns are all `timestamptz` (post Batch 3 P2-2.2). The UTC instant is stored. No drift.

## Verdict

**Zero user-facing or admin-facing timestamp displays exist in the current 8-workflow surface.** No workflow embeds a timestamp value in a WhatsApp message body, Slack message text, or any other consumer-rendered field. All timestamp usage is internal (DB stores + WF-60 log payload).

Per [D1 in decisions.md](./decisions.md), no action required at this time:
- The preferred approach (relative phrasing) is trivially in effect — no absolute timestamps to convert.
- The IST fallback applies if and when a future feature adds a timestamp display; this audit confirms that future-feature engineers must explicitly choose how to render any new timestamp, per D1.

**AC modifier:** AC for P2-2.5 in the spec was "audit each WF for display patterns". Met with zero findings requiring code change.

**Follow-up:** If any future PR adds a `setZone('Asia/Kolkata')` / `setZone('Asia/Sydney')` / `toFormat(...)` / `toLocaleString(...)` / explicit timestamp-in-message-body pattern to these workflows, re-run this audit and apply D1 (relative phrasing preferred; IST fallback if absolute required; NEVER Sydney).

## Reproduction

The audit script (paraphrased):

```bash
for WF in WF-32 WF-33 WF-34 WF-42 WF-43 WF-44 WF-50 WF-51; do
  jq -r '.nodes[] | "[" + .name + " | " + .type + "]\n" + (.parameters // {} | tostring)' \
    "workflows/${ID}.json" > /tmp/claude-scratch/wf-audit/${WF}-flat.txt
  grep -nE 'toISOString|toLocaleString|setZone|toFormat|DateTime\.fromISO|Asia/Kolkata|Asia/Sydney|\$now\b|new Date\(' \
    /tmp/claude-scratch/wf-audit/${WF}-flat.txt
done
```

Source workflow JSONs at audit time: `workflows/*.json` from prior export (commit `4bf62f2` on `main`). Batch 3 did not change workflow content. P2-2.4 will re-export to align the cache with current live state — no semantic difference expected.
