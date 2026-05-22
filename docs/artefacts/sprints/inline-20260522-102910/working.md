# Drift Review Sprint — Working Copy

**Planned:** 2026-05-22T10:29:10Z
**Slug:** `inline-20260522-102910`
**Source:** Interactive review session of the 2026-05-22 pseudo↔live drift report (6 flagged workflows).

The sprint plan in `state.md` is the authoritative item list. This file is a human-readable summary for skimming.

---

## Items (10 total, in execution order by batch)

### Batch 1 — P1 critical path

- **SP-01** — WF-10 + WF-41 merged redesign (admin-text relay) — pass user data from WF-10 to WF-41 via Set node; remove WF-41's redundant Postgres lookup; connect WF-10 FALSE branch to admin Slack feedback; drop unquoted camelCase aliases in WF-10's SQL.

### Batch 2 — P2 reliability sweeps

- **SP-02** — Postgres `alwaysOutputData=true` remediation across 10 nodes (WF-21, WF-22, WF-32 ×2, WF-34, WF-44, WF-45, WF-47 ×2).
- **SP-03** — Admin-action precondition audit for APPROVE / REJECT / CLOSE / BLOCK / UNBLOCK plus the text-relay path. Remediate silent-drops with admin Slack feedback.

### Batch 3 — P3 doc + cleanup

- **SP-04** — Silent-drop IF FALSE branch sweep (superset of SP-03).
- **SP-05** — WF-25 contract normalization to passthrough (6 callers); audit-sweep for other defineBelow+schema:[] instances.
- **SP-06** — WF-46.pseudo rewrite (drop archival steps per DR-10; add WF-51 call; clean stale notes).
- **SP-07** — WF-51.pseudo rewrite (add WF-60 logging chain post-TD-002) + workflow-registry caller-list updates.
- **SP-08** — WF-60.pseudo rewrite to match post-TD-002 multi-transport live design.
- **SP-09** — WF-12 (Admin → WhatsApp Relay) full purge — workflow + pseudo + md + registry + all references.

### Batch 4 — Plugin update (end of sprint)

- **SP-10** — `build-workflow` skill update — bundle 6 methodology principles (a–f). Done via plugin update-skill workflow per established discipline.

---

## Followups logged (not in this sprint)

- **TD-NEW-027** (in `docs/sprint-tech-debt-2026-05-16-post-MVP.md`) — Periodic pseudo↔live drift health-check infrastructure for maintenance phase.
- **TD-NEW-028** (in `docs/Tech_Debts.md`) — WF-51 Slack failure-path logging; bundle into the planned error-handling sprint.

---

## Drift items NOT in this sprint (resolved during planning)

- **WF-23** original "messageText vs messageContent" finding — investigation showed it works accidentally via passthrough; resolved by SP-05 contract normalization.
- **WF-41 casing inconsistency** (channelname/messagetext lowercase) — folded into SP-01; the redesign removes the affected Code nodes entirely. SQL alias case fix is included in SP-01's WF-10 SELECT rewrite.

---

## Process meta-finding

Two pseudo drifts (WF-51, WF-60) and the WF-51 registry caller-list gap all trace back to **TD-002** (2026-05-19 multi-transport rebuild) — a structural refactor that updated live code thoroughly but missed companion docs. The principle "structural refactors must include matching pseudo updates in the same change set" is encoded in SP-10 (build-workflow plugin update). Maintenance-phase scheduled enforcement is TD-NEW-027.
