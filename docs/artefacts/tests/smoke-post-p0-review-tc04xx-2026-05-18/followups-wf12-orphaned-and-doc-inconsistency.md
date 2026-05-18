# Followup — WF-12 is an orphaned active workflow; multiple docs disagree on its status

**Severity:** P2 (no runtime impact today, but live-but-unused workflow is a foot-gun + doc inconsistency erodes trust in the registry)
**Found during:** TC-0402 (admin→user relay), 2026-05-18

## What's true (verified against live n8n + JSON)

- `WF-41 Admin -> User Relay` (id `6PzJRZsF7k2d9hV7`, 9 nodes) is the **real** admin→user relay path. WF-10 calls it (see `docs/pseudocode/WF-10.md:42`, node `Call WF-41 (Admin->User Relay)`). Fired live in TC-0402 (exec 1224).
- `WF-12 Admin -> WhatsApp Relay` (id `RjwHs9Dx5cK8Q5wD`, 3 nodes) is **active in n8n** but **not called by anyone**. It's a vestigial simpler relay (`Skip Bots and Commands` → `Call WF-50`). No `executeWorkflow` reference to `RjwHs9Dx5cK8Q5wD` exists in any current workflow JSON.

## What each doc says (inconsistent)

| Source | Claim about WF-12 | Reality |
|---|---|---|
| `docs/workflow-registry.md` | 🟢 Active, P2, "Relays plain-text messages typed by admin in user's Slack channel → WhatsApp during consultation_active. Distinct from command handling. Calls WF-50. Built + activated session 4." | Built & active in n8n — yes. Actually used — **no**. WF-10 routes to WF-41, not WF-12. |
| `docs/pseudocode/INDEX.md:16` | "Admin → WhatsApp Relay (legacy) — Admin — direct relay path (likely superseded by WF-41)" | Correct — this doc has it right. |
| `docs/CONTEXT.md:144` | "Admin types in Slack channel → WF-10 → WF-11 (command) or WF-12 (relay)" | **Wrong.** Should be WF-41. |
| `docs/STATUS.md:109` | "WF-12 Admin Message Relay ❌ Not Built" | **Wrong.** It IS built and active in n8n. Stale snapshot. |
| `docs/STATUS.md:133,158` | "WF-12, WF-51 never built (to assess if still needed)" + "Assess WF-12, WF-51 — still needed or superseded?" | The "never built" claim is wrong; the "still needed?" question is the right one to resolve. |
| `docs/Tech_Debts.md:156` | "WF-12 confirmed to have no Postgres lookup and no status check before calling WF-50." | Accurate technical observation; reinforces that WF-12 is a thinner, older path. |

## Why this matters

1. **Orphaned active workflow** = silent risk. If any future workflow accidentally points at `RjwHs9Dx5cK8Q5wD`, WF-12 will fire — bypassing WF-41's `consultation_active` status check (per `Tech_Debts.md:156`). That's a data-integrity hole waiting for a typo to trigger.
2. **Doc disagreement** kills the value of having a registry. The pseudocode/INDEX is right; registry, CONTEXT, and STATUS are each wrong in different ways.
3. **Operator confusion** — during the smoke test, the handoff itself said "WF-10 → WF-12" because it inherited the wrong mental model from CONTEXT.md.

## Recommended remediation (separate sprint, not blocking smoke test)

1. **Decide WF-12's fate.** Two options:
   - **Deactivate + archive** (recommended) — WF-41 is the canonical relay; no caller wants WF-12's thin path. Mark `active=false` in n8n, move pseudocode to `archive/`, remove from registry.
   - **Repurpose** — only if a real need surfaces for a relay that skips the consultation_active gate (e.g., admin override broadcasts). No such need known today.
2. **Reconcile docs in one pass:**
   - `workflow-registry.md` — flip WF-12 row to 🔴 Orphaned (or remove if deactivated) and add a note: "WF-41 is the live admin→user relay."
   - `CONTEXT.md:144` — change `WF-12 (relay)` → `WF-41 (relay)`.
   - `STATUS.md:109,133,158` — remove "Not Built" claim; either close the "still needed?" item or reflect the deactivation decision.
   - `pseudocode/INDEX.md` — already correct, no action.
3. **Add a guardrail check** to `technical-workflow-review`: flag any workflow that is `active=true` in n8n but has zero inbound `executeWorkflow` references AND is not a webhook entrypoint. WF-12 would have been caught by this.

## Out of scope here

Not fixing in this session — too far from TC-04xx critical path. Filed for the next cleanup sprint.
