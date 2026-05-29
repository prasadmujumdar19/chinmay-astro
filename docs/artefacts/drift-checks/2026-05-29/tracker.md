---
slug: drift-check-2026-05-29
started_at: 2026-05-29T08:23:43Z
last_updated: 2026-05-29T08:23:43Z
status: complete
overall_status: CLEAN
pairs_checked: 28
drift_count: 0
triaged_count: 28
minor_count: 0
clean_count: 0
dispatch_mode: fast-enumeration-haiku
---

# Pseudo vs MD Drift Check — 2026-05-29

## Run intent (read before interpreting this tracker)

This is a **deliberate fast-enumeration pass**, NOT a deep D1–D9 comparison. Rationale (user decision,
2026-05-29): the `behavior-matrix-fixes-2026-05-27` sprint is about to apply **major design changes** to most
workflows (nuanced logic rewrites, utility-for-inline swaps, code becoming redundant, the BMX-06 + safety-net
companion redesigns). Syncing every `.pseudo` to *current* live now would be wasted effort — those pseudos are
about to be rewritten anyway.

**Therefore every pair is marked 🟡 TRIAGED**, with the remediation tracked as part of the active sprint:
- During the sprint, each touched workflow is fixed **pseudo-first** (revise `.pseudo` → impact-analyze → edit
  live), per [[feedback_pseudocode_first_refactor]]. When a WF's `.pseudo` is synced, check it off in the
  worklist below.
- Any workflow **left untouched** at sprint exit gets a **real Sonnet drift-sync** (full D1–D9 pass) before the
  sprint is declared complete — see TD-BMX-07 exit gate.

`.md` files were regenerated fresh from live n8n immediately before this run (re-export + generate-workflow-md,
2026-05-29T08:1x Z), so the `.md` side is accurate-to-live. The deferred work is purely on the `.pseudo` side.

Per the skill roll-up rules, TRIAGED rows do **not** count toward `drift_count`; `overall_status = CLEAN`
because `drift_count = 0` and `minor_count = 0`. The tracked remediation (this sprint) is the gate.

## Pseudo-sync worklist (check off as each `.pseudo` is synced during the sprint)

| WF-ID | Status | Findings | pseudo-synced? | Notes |
|-------|--------|----------|----------------|-------|
| WF-00 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-01 | 🟡 TRIAGED | deferred | ☐ | BMX-06 §5 full rebuild — pseudo-first during sprint |
| WF-02 | 🟡 TRIAGED | deferred | ☐ | BMX-06 / safety-net edits — pseudo-first during sprint |
| WF-10 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-11 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-20 | 🟡 TRIAGED | deferred | ☐ | safety-net + BMX-05 aliases — pseudo-first during sprint |
| WF-21 | 🟡 TRIAGED | deferred | ☐ | BMX-06 new-contact classifier — pseudo-first during sprint |
| WF-22 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-23 | 🟡 TRIAGED | deferred | ☐ | BMX-06 pre-form clarifier — pseudo-first during sprint |
| WF-25 | 🟡 TRIAGED | deferred | ☐ | safety-net hub — pseudo-first during sprint |
| WF-26 | 🟡 TRIAGED | deferred | ☐ | safety-net §6 refine + activate — pseudo-first during sprint |
| WF-30 | 🟡 TRIAGED | deferred | ☐ | safety-net wiring — pseudo-first during sprint |
| WF-31 | 🟡 TRIAGED | deferred | ☐ | safety-net wiring — pseudo-first during sprint |
| WF-32 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-33 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-34 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-40 | 🟡 TRIAGED | deferred | ☐ | safety-net wiring — pseudo-first during sprint |
| WF-41 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-42 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-43 | 🟡 TRIAGED | deferred | ☐ | safety-net wiring — pseudo-first during sprint |
| WF-44 | 🟡 TRIAGED | deferred | ☐ | safety-net wiring — pseudo-first during sprint |
| WF-45 | 🟡 TRIAGED | deferred | ☐ | TD-BMX-01 state guard — pseudo-first during sprint |
| WF-46 | 🟡 TRIAGED | deferred | ☐ | BMX-06 block contract — pseudo-first during sprint |
| WF-47 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-50 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-51 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-52 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |
| WF-60 | 🟡 TRIAGED | deferred | ☐ | pseudo-sync pending — pseudo-first during sprint |

## Roll-up

- **Pairs checked (enumerated):** 28
- **Status counts:** ✅ 0 clean · 🟡 28 triaged · 🔴 0 awaiting · ⚠️ 0 minor
- **Overall status:** CLEAN (drift_count=0; all drift acknowledged + remediation tracked in the active sprint)
- **Dispatch mode:** 1 Haiku subagent (fast enumeration, strict-JSON), parent-written artifacts
- **Remediation owner:** `behavior-matrix-fixes-2026-05-27` sprint — pseudo-first per touched workflow;
  untouched WFs get a real Sonnet D1–D9 sync at the TD-BMX-07 exit gate.

## Exit-gate reminder (for TD-BMX-07)

Before the sprint can be marked complete, the worklist above must be fully resolved:
- every ☐ that the sprint touched → ☑ (pseudo synced pseudo-first, then live edited)
- every WF the sprint did NOT touch → real Sonnet D1–D9 drift-sync, then ☑
At that point, re-run a genuine `pseudo-md-drift-check` to confirm `overall_status = CLEAN` on the merits.
