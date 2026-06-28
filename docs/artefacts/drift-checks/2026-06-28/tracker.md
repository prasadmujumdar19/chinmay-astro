---
slug: drift-check-2026-06-29
started_at: 2026-06-29T00:00:00Z
last_updated: 2026-06-29T00:00:00Z
status: complete
method: parallel Haiku subagent fan-out (11 agents × ~3 pairs), parent live-verification + reconciliation
---

# Pseudo vs MD Drift Check — 2026-06-29

**Headline:** Zero functional bugs in live n8n. Sweep found 14 DRIFT rows, ALL `.pseudo`-lagging-live.
Resolved this session: 8 reconciled (pseudo→live), 9 D8/D9 findings dismissed as not-drift (intermediate
workflows deliberately deferred from the data-contract/envelope uplift — see Resolution). Final: all
32 pairs CLEAN. drift_count = 0 → build-sprint gate clears.

| WF-ID | Status | Findings | Notes |
|-------|--------|----------|-------|
| WF-00 | ✅ CLEAN | 0 | |
| WF-01 | ✅ CLEAN | 0 | |
| WF-02 | ✅ CLEAN | 0 | |
| WF-10 | ✅ CLEAN | 0 | RECONCILED: D1 alert wording `<commandType>`→`<commandHint>` (Steps 25/27/28/29) to match live |
| WF-11 | ✅ CLEAN | 0 | RECONCILED: D5 STATS count state `pending_verification`→`payment_submitted` to match live |
| WF-20 | ✅ CLEAN | 0 | |
| WF-21 | ✅ CLEAN | 0 | |
| WF-22 | ✅ CLEAN | 0 | |
| WF-23 | ✅ CLEAN | 0 | RECONCILED: D1 welcome + help copy (added "with your Vedic astrology consultation", "below", 🙏) |
| WF-25 | ✅ CLEAN | 0 | |
| WF-26 | ✅ CLEAN | 0 | D6 "halts on 0 rows" = n8n onError MECHANISM → deferred-to-tech-sprint, not drift |
| WF-30 | ✅ CLEAN | 0 | |
| WF-31 | ✅ CLEAN | 0 | RECONCILED: D3 Step 4 rewritten to the live 4-way pass-through guard. D9 dismissed (not uplifted) |
| WF-32 | ✅ CLEAN | 0 | RECONCILED: D1 "Dr. Chinmay" + admin-notif Slack-mrkdwn format. D9 dismissed (not uplifted) |
| WF-33 | ✅ CLEAN | 0 | D9 dismissed — intermediate workflow, not yet envelope-uplifted (no first-step envelope guard) |
| WF-34 | ✅ CLEAN | 0 | D9 dismissed — intermediate workflow, not yet envelope-uplifted |
| WF-40 | ✅ CLEAN | 0 | D9 dismissed — intermediate workflow, not yet envelope-uplifted |
| WF-41 | ✅ CLEAN | 0 | D9 dismissed — intermediate workflow, not yet envelope-uplifted |
| WF-42 | ✅ CLEAN | 0 | D8 dismissed — intermediate workflow, not yet envelope-uplifted |
| WF-43 | ✅ CLEAN | 0 | D8 dismissed — intermediate workflow, not yet envelope-uplifted |
| WF-44 | ✅ CLEAN | 0 | RECONCILED: D1 "Dr. Chinmay's consultation service". D8 dismissed (not uplifted) |
| WF-45 | ✅ CLEAN | 0 | |
| WF-46 | ✅ CLEAN | 0 | |
| WF-47 | ✅ CLEAN | 0 | |
| WF-50 | ✅ CLEAN | 0 | |
| WF-51 | ✅ CLEAN | 0 | RECONCILED: D7 return-contract note → live returns WF-60 logger result (terminal node); fire-and-forget callers |
| WF-52 | ✅ CLEAN | 0 | |
| WF-53 | ✅ CLEAN | 0 | (genuinely envelope-uplifted — Entry Guard + explicit Inputs block; CLEAN as found) |
| WF-60 | ✅ CLEAN | 0 | (genuinely envelope-uplifted — Validate Inputs + explicit Inputs block; CLEAN as found) |
| WF-61 | ✅ CLEAN | 0 | (genuinely envelope-uplifted — Entry Guard + explicit Inputs block; CLEAN as found) |
| WF-62 | ✅ CLEAN | 0 | |
| WF-75 | ✅ CLEAN | 0 | RECONCILED: D1 nudge copy "you're done"→"you are done" |

## Resolution

**A. Reconciled pseudo→live (8 WFs) — genuine pseudo-lag, mechanical sync (live was correct):**
WF-10 (D1 alert var), WF-11 (D5 state name), WF-23 (D1 copy ×2), WF-31 (D3 guard description),
WF-32 (D1 copy + admin-notif mrkdwn), WF-44 (D1 copy), WF-51 (D7 return note), WF-75 (D1 copy).
These accumulated since the last drift check (2026-05-29) through PDF-04/05/09/15-21 copy + logic changes
where `.pseudo` was not restamped.

**B. Dismissed D8/D9 (9 WFs) — NOT drift, by the data-contract scope rule (user direction 2026-06-29):**
WF-31/32/33/34/40/41 (D9 "no dedicated Inputs block / references canonical envelope") + WF-42/43/44
(D8 "Inputs list ≠ fields read"). The data-contract/envelope uplift was a DEDICATED, SCOPED effort that
covered ONLY (1) the inbound entry workflows (WhatsApp/Slack) + their immediate downstreams that validate
the core envelope, and (2) the outbound utility workflows that validate a fixed contract as their FIRST
step. INTERMEDIATE workflows were intentionally deferred from the uplift. Objective discriminator applied:
a live first-step envelope-validation guard (e.g. "Validate Inputs"/"Entry Guard"/"contract violation").
All 9 above have NONE (first node is business logic) → not yet uplifted → their `.pseudo` does not need
the new Inputs-spec format yet → finding is expected, not drift. The genuinely-uplifted utilities
(WF-51/53/60/61) DO carry the guard + an explicit Inputs block and came back CLEAN. See
`deferred-envelope-uplift.md` for the tracked list.

**C. Deferred to tech sprint (1):** WF-26 D6 (UPDATE 0-row "halt") — n8n onError mechanism, not a pseudo
concern (pseudo-vs-tech-separation rule). Recorded in `deferred-to-tech-sprint.md`.

## Parent live-verification log (Include C pt4)
- WF-11 D5 — live `.md`: `status='payment_submitted'`. Pseudo stale. (`pending_verification` is a valid PAYMENTS-table status, not users.)
- WF-10 D1 — live `.md`: alert Set nodes use `commandHint` (always populated in both classifiers). Pseudo named wrong var.
- WF-31 D3 — live `.md`: 4-condition AND guard present. Live more defensive than pseudo described.
- WF-51 D7 — live `.md`: `Call WF-60 Message Logger` is terminal node → returns logger result. Harmless for fire-and-forget callers.
- Bucket B uplift status — verified via first-step guard grep: 0/9 have an envelope-validation entry guard → all not-yet-uplifted → D8/D9 not applicable.

## Relevance to PDF-25 (WF-70 build)
WF-75 (precedent) & WF-51 (alert sender WF-70 will call) both CLEAN/reconciled and safe to build against.
