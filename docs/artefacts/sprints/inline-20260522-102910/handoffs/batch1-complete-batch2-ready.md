# Handoff — Batch 1 complete, Batch 2 ready

_Written 2026-05-22T12:07:45Z_

## Stopping Point

Sprint `inline-20260522-102910` — Batch 1 (SP-01 WF-10+WF-41 merged redesign) is **done**, smoke-tested on both branches, and pushed to GitHub as commit `81cd128` on `main`. Sprint is still in progress; Batches 2, 3, 4 remain (9 items).

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint` with no argument — the skill auto-resumes via `_active` marker + sprint state file. It should report:

> "Resuming sprint `inline-20260522-102910` at batch 2 (priority P2): SP-02 — Postgres alwaysOutputData=true remediation across 10 active nodes…"

Batch 2 contains **two items** — SP-02 and SP-03. Per build-sprint Step 2a (≥3-item batch criterion for execution-mode planning), this batch is small enough that the assess step is skipped; default to Mode A (full `build-workflow` Skill) per item.

SP-03 has a soft dependency on SP-01 ("Item 1 establishes the admin-feedback pattern…") — that's now satisfied by the just-shipped `Build Admin Feedback` → `Call WF-51` Set-node pattern in WF-10. Future P2 admin-feedback gaps should follow that shape.

## Blockers

None.

**Plugin improvement candidate (low priority, defer to a slow session):** The n8n PUT API rejects `pinData` in the request body (`"request/body must NOT have additional properties"` → 400). The `build-workflow` Step 5e.2 example projects `{name, nodes, connections, settings}` from the transformed body which is correct — but Step 5e.1's `wf-pre.json` snapshot includes `pinData` and a reader might assume the whole transformed body PUTs cleanly. Worth adding a one-line caveat to Step 5e.2 ("pinData is editor-only state — exclude it from the PUT body, the API rejects it"). Not urgent; the canonical Step 5e.2 jq projection already avoids the trap.

## Changed Reference Values

- **WF-10 node count:** 22 → **25** (added Build WF-41 Payload, Build Admin Feedback, Call WF-51 (Inactive User Feedback))
- **WF-41 node count:** 5 → **3** (removed Extract Phone from Channel, Load User by Phone)
- **WF-10 callees:** added WF-51 (new edge in `docs/dependency-map.md`); was {WF-11, WF-41, WF-60}, now {WF-11, WF-41, WF-51, WF-60}
- **WF-10 Load User Status SELECT:** simplified to `SELECT id, status, name, phone_number FROM chinmay_astro.users WHERE slack_channel_id = $1 LIMIT 1` (single-param queryReplacement)
- **WF-41 input contract:** changed from `{messageText, channelName, status}` (postgres-row passthrough) → `{phoneNumber, adminMessage}` (caller-prepared Set node)

Last commit on `main`: `81cd128`.
