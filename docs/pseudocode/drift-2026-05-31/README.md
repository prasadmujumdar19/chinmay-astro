# Pseudo-vs-Live Drift — 2026-05-31

One `.drift` file per workflow. **Zero bytes = `.pseudo` (design intent) and `.md` (live AS-IS projection)
match exactly.** A populated file lists each divergence as
`[Dcode·severity] node/step: pseudo says … | live(.md) says …`.

- **pseudo source:** GitHub `main` @ `51ffc97`
- **md source:** regenerated from a fresh full live export; freshness sweep 31/31 fresh (2026-05-31)
- **methodology:** D1–D9 drift taxonomy + caller-contract cross-check (same as `bmx-drift-rerun-opus`); 5 Opus agents
- **headline:** structural categories (D3/D4/D5/D8/D9) **and** the caller-contract cross-check show **zero drift**
  across all 31 workflows — live matches design structurally everywhere. The populated files below are **cosmetic (⚠️)** only.

## Findings
| Workflow | Drift |
|----------|-------|
| WF-11 | 1 ⚠️ — STATS `pending_payments` field description stale (`payments.status='pending_verification'` vs live `users.status='payment_submitted'`) |
| WF-20 | 1 ⚠️ — HELP response: pseudo's defensive null/no-record welcome arm absent in live (unreachable in practice) |
| WF-32 | 2 ⚠️ — payment-confirmation + admin-notification copy: same words/fields, different line-break density & Slack markdown |
| WF-10 | zero-byte — owner handling this workflow separately (findings excluded by request) |
| all others (27) | aligned — zero-byte |
