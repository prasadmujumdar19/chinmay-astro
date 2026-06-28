# Sprint: pre-demo-minor-fixes-31May26

**Input source:** docs/artefacts/sprints/pre-demo-minor-fixes-31May26/tasks.md
**Input hash:** 633b9b258285df5821dbe3f1cff90cce62b268b5ae5d3c6efe33fc281579052c
**Planned at:** 2026-05-31T11:19:25Z
**Last updated:** 2026-06-16T08:56:57Z
**Planning complete:** true
**Rolling sprint:** TRUE — `_active` marker is USER-CONTROLLED. build-sprint MUST NOT remove `_active` on batch/queue exhaustion; report "current queue done, sprint still open (rolling)" and stop. Re-invocations of plan-sprint must be ADDITIVE (plan only new PDF-NN items into this file; never destructive full-replan). input_hash mismatch is EXPECTED and is NOT a replan signal. See tasks.md "ROLLING SPRINT" header for full lifecycle/concurrency rules.
**Discover-current-state:** ran at 2026-05-31T11:19:25Z against live WF-10 (`wMh0oBRtJbvhLgOf`, 42 nodes). Result: PDF-01 condition CONFIRMED PRESENT — `Build Help Prompt` + `Call WF-51 (Help Prompt)` nodes and hardcoded "Type `HELP` to see available commands" line both still on the `free_text` branch; ZERO Gemini calls in WF-10. PDF-01 is genuinely pending, not obsolete. PDF-02/PDF-03 extend the not-yet-built PDF-01 → pending. No obsoletes detected.
**Dependency conflicts found:** — (none. PDF-02/03 are P2 and hard-depend on PDF-01 which is P0; the dependency is on a higher-priority item that runs first, so priority order and dependency order agree.)
**Priority adjustments confirmed:** none required — original priority order honoured.

**Additive planning pass — 2026-06-04T23:21:58Z (rolling sprint, append-only).** Planned new items PDF-04..PDF-09 (appended to tasks.md by the 2026-06-02 brainstorm session); existing PDF-01/02/03 history preserved untouched per rolling-sprint rule 2. tasks.md hash is now `e575e0ef0e6592db5d2e94d867759a95ce7a0cbec1add84299b60537afaf87a4` (was `6044e408…`); mismatch is EXPECTED for a rolling sprint and is NOT a replan signal.

**Discover-current-state (PDF-04..09) — ran 2026-06-04T23:21:58Z against live n8n (31 workflows fetched to disk, grepped — no payloads loaded). Fix locations DETERMINED (resolves all six `Change type: TBD`):**
- **PDF-06 / PDF-07 / PDF-08 → ONE root in WF-10 Slack Admin Handler (`wMh0oBRtJbvhLgOf`, 47 nodes).** WF-10 is the SINGLE Slack-events entry point (only workflow with a `slack/events` `event_callback` trigger that calls the relay path). It builds a relay envelope (`Build WF-10 Relay Envelope` → `Dispatch by Kind` → `Build WF-41 Payload` → `Call WF-41 (Admin->User Relay)`) and a transcript-log payload (`Build WF-60 Payload (Slack Inbound)` → `Call WF-60 Message Logger`) for EVERY inbound Slack event — including channel-join / `member_joined_channel` / bot / system / admin-command events. CONFIRMED: zero `member_joined`/`channel_join`/`subtype`/`bot_id` filtering exists anywhere in the 31 live workflows. So a join event becomes a relay candidate (PDF-07 customer-leak), fails the relay-validation guards and fires an admin alert (PDF-06 — `Build Wrong-State Alert` / `Build Phone-Absent Alert` family), and gets logged to the consultation transcript (PDF-08). All three are symptoms of the same missing genuine-message filter in WF-10. CONDITION PRESENT — genuinely pending.
- **PDF-04 / PDF-05 → ONE root across WF-30 / WF-31 / WF-43.** The customer-facing free-text LLM reply is the `Prepare Gemini Response Prompt` → `Gemini General Response` (HTTP) → `Extract Gemini Reply` → `Send …Reply via WF-50` chain, present in exactly three workflows: WF-30 Payment Pending Intent Filter (`gGJBY5fJha0Let8I`), WF-31 Payment Submitted Handler (`HB8nXudAtk9iXz7C`), WF-43 Post-Consultation Handler (`3va0M06kijgyLejf`). The prompt carries no grounded business-facts KB, so it improvises services/pricing (e.g. "yes, we offer video consultations" in payment_pending). Systemic — the grounded-KB + defer-to-astrologer fix must apply to all three consistently. CONDITION PRESENT — genuinely pending. Needs a design pass (KB content + defer rule), analogous to PDF-01 → **Design gate: true.**
- **PDF-09 → systemic surgical string fix across 7 workflows.** "Dr. Chinmay" literal found in WF-21, WF-23, WF-30, WF-31, WF-43, WF-45, WF-62; other messages use plain "Chinmay". One correct form to be picked (pending user confirmation of whether the "Dr." title is accurate) and applied across all 7. CONDITION PRESENT.
- No obsoletes detected among PDF-04..09.

**Dependency conflicts found (PDF-04..09):** none blocking. Two contract/same-root couplings recorded as deps (PDF-07/08 → PDF-06 hard same-fix; PDF-04 → PDF-05 hard same-fix; PDF-04/05 → PDF-09 soft same-workflow WF-30/31/43). WF-10 is also touched by pending PDF-02/03 (admin free_text branch) vs PDF-06/07/08 (relay branch) — different branches, soft sibling; sequential batch execution avoids the concurrent-PUT race (re-fetch live WF-10 at each pickup).

**Priority adjustments confirmed (PDF-04..09):** User directive (2026-06-04) — **execute admin-side noise / low-hanging fruit FIRST**, ahead of the P0 customer-facing items. So the next ACTIONABLE batch is **Batch 4 (WF-10 event filter — PDF-06/07/08)**; the P0 grounded-KB work (PDF-04/05, Batch 6) is deliberately sequenced LAST of the new items and is design-gated. The design-gated P2 batches 2/3 (PDF-02/03) remain deferred. **Batch 4 intentionally mixes P0/P1/P2** because PDF-06 (P1) + PDF-07 (P0) + PDF-08 (P2) are three symptoms of one inseparable WF-10 fix — splitting by priority would mean authoring the same filter three times; collapse authorised by the brainstorm note ("plan-sprint can collapse them into a single change if cleaner") and the user's same-session directive.

**tasks.md reconciliation pass — 2026-06-08T03:08:50Z (rolling sprint, bookkeeping only — NOT a replan).** PDF-10..PDF-14 emerged ad-hoc during live build/validation sessions (Batch 7 + Batch 8) and were planned+built+verified directly into this `state.md`, but were never recorded in the source list `tasks.md`. Backfilled them into `tasks.md` now (5 Summary rows + 5 H3 blocks, marked "emerged during implementation"); also synced the stale `🆕 triaged` statuses of PDF-01..09 in `tasks.md` to match their real state here (done / ⚪ obsolete / planned-pending-build). **No item renumbered** — every `PDF-NN` keeps its ID. `tasks.md` SHA recomputed after the edits and recorded above as the new `Input hash` (`633b9b25…`, was `e575e0ef…` after the PDF-04..09 pass and `6044e408…` at original plan). This file's item set (PDF-01..14) now exactly matches the planned/built history; **PDF-15..PDF-19 are present in `tasks.md` but intentionally NOT yet in this `state.md`** — they are the next additive plan-sprint bunch (the 24h-window deliverability cluster, brainstormed 2026-06-08). Next plan-sprint should plan PDF-15 onward additively and find no orphaned/unaccounted items.

**Additive planning pass — 2026-06-08T06:51:00Z (rolling sprint, append-only).** Planned the 24h-window deliverability cluster **PDF-15..PDF-19** (Batches 9–12) into this `state.md`; existing PDF-01..14 history untouched per rolling-sprint rule 2. `tasks.md` hash unchanged (`633b9b25…`) — PDF-15..19 were already present in the source from the 2026-06-08 brainstorm; this pass only adds them to `state.md`. Grounding spec: `docs/artefacts/specs/2026-06-08-24h-window-deliverability-design.md`.

- **Discover-current-state basis:** the SSH tunnel was DOWN this session, so no fresh live grep was run. The 2026-06-08 brainstorm session verified all five conditions against live n8n with fresh `.md` projections (pseudo==live) earlier the same day — that verification is the discover-current-state basis. No obsoletes detected. If a fresh re-grep is wanted, reopen the tunnel before build-sprint Batch 9.
- **Fix-location map (from registry, confirmed live by the brainstorm):** PDF-15/16 → relay path **WF-41 Admin→User Relay** (`6PzJRZsF7k2d9hV7`) → **WF-50 Send WhatsApp** (`BUVun38WEKb12zg9`), in-channel notice via **WF-51** (`wlZRK0YxnhP0b2RL`); window-state from `chinmay_astro.messages` `MAX(created_at) WHERE direction='inbound'`. PDF-17 → **WF-34 Payment Rejection Processor** (`se82n3MUQ9xE5aEr`). PDF-18 → **NEW WF-7x** scheduled job (project's first background workflow). PDF-19 → **WF-42 Consultation Closer** (`fx70vqyJtRdF2DgR`) + the post-close button-tap handler.
- **Design decisions LOCKED this session (no design-gates remain — build-sprint implements directly).** All grounded in Meta docs (citations embedded per item). DD-A: relay stays **window-conditional** — free-form in-window (full fidelity, no constraint, free per M2), template only out-of-window. DD-B window source = `messages` table (no new write on relay path). DD-C out-window path = **pre-process to template-safe** (collapse newlines→spaces per M4 ban, collapse 4+ spaces, split >~900 chars into "(1/N)" parts) then deliver via the relay-reply template — **no bounce-back/retype path**; any residual Meta send failure is surfaced by PDF-16 (the failure backstop). DD-D relay-reply template body = *"Sorry for the delayed response to your message. Here's the response from Dr. Chinmay: {{1}}"* (apology/service framing chosen over a bare `{{1}}` to reduce Meta utility-approval rejection risk + correct customer tone after a gap). DD-E fixed-content messages (rejection PDF-17, close PDF-19) = **always a template** (DD-1), no window logic. DD-F nudge (PDF-18) = threshold **18h**, poll **every 2h**, repeat ~3–4× across the 18→24h stretch, gated on `unanswered` (`last_inbound > last_outbound`), self-terminating at 24h (window closed → relay goes template/charged → nudge has no purpose).
- **Meta grounding records (verified 2026-06-08):** M1 non-template only in-window ([pricing](https://developers.facebook.com/docs/whatsapp/pricing)); M2 utility templates free in-window, charged outside ([July 2025 pricing](https://developers.facebook.com/docs/whatsapp/pricing/updates-to-pricing/)); **M4 template parameters cannot contain newlines / tabs / 4+ consecutive spaces, body ≤1024 chars** ([guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines/), [error-code ref](https://www.heltar.com/blogs/all-meta-error-codes-explained-along-with-complete-troubleshooting-guide-2025-cm69x5e0k000710xtwup66500)); M5 template quick-reply tap arrives in a different webhook shape than an interactive `button_reply` ([template components](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/components)); unused templates are NOT deleted but may need **re-approval after ~90 days inactivity**, and quality-pausing is driven by negative feedback/low engagement, not non-use ([template statuses](https://help.gohighlevel.com/support/solutions/articles/155000001623-whatsapp-template-statuses-and-best-practice), [pacing & pausing](https://academy.insiderone.com/docs/whatsapp-template-pacing-and-pausing)).
- **External prerequisite (gates build, async Meta approval):** 3 templates must be submitted+approved before their builds — **relay-reply** (new, PDF-15 — submit EARLIEST; thin-content utility templates carry elevated rejection risk), **payment-rejection** (new, PDF-17), **consultation_closed_feedback** (existing, PDF-19 — rewrite body to match current close copy + carry all 3 quick-reply buttons). PDF-16 and PDF-18 have NO template dependency.

**Template provisioning update — 2026-06-08T07:45:22Z.** User created the templates in Meta; all **Active** (= approved/sendable; "Quality pending" is just the un-rated new-template state, not a blocker). **Final approved names (supersede the planning-time names above — build MUST target these exact names + language code):**
- **`astrology_service_update`** (Utility) = the relay-reply template for **PDF-15** (renamed from `relay-reply` to read as a genuine utility template). Body retains the apology framing + `{{1}}`.
- **`payment_rejection`** (Utility) = **PDF-17**. Body trimmed by user at creation (starts *"Sorry, but we couldn't verify your pa…"*) — build uses the APPROVED template body verbatim, not the old WF-34 interactive copy.
- **`consultation_closed`** (Utility) = **PDF-19** — NEW template replacing `consultation_closed_feedback`. The original `consultation_closed_feedback`, when its body was edited, was **reclassified by Meta to Marketing** (unusable here — Marketing is also window-gated). User created `consultation_closed` fresh with trimmed body to keep it Utility. **PDF-19 must reference `consultation_closed`, NOT `consultation_closed_feedback`.**
- **`consultation_activated`** (Utility, existing) — payment approval, untouched.
- **OPEN before build (list view hides these; trimmed bodies may have dropped them):** confirm `consultation_closed` still carries all 3 quick-reply buttons (Leave Feedback / Book Again / Done, thanks) + whether it kept a `{{1}}` name var; confirm `payment_rejection` still carries the retry button (Payment Completed ✓) + var count; confirm `astrology_service_update` has exactly one `{{1}}`; confirm the language code matches `consultation_activated` for all sends. Build-sprint Batch 9/10/12 entry must verify the exact approved template structure (name, language, body params, button params) before authoring the WF-50 template send — a mismatch fails the send (Meta error 132000/132001).
- **Dependency conflicts found (PDF-15..19):** none. PDF-16(P1)→PDF-15(P0) and PDF-18(P1)→PDF-15(P0) both point at a higher-priority item that runs first; PDF-19(P2) sibling of PDF-17(P1) runs later — priority order and dependency order agree. Not a single-root cluster (each is a distinct fix in a distinct workflow) → standard priority-tier batches, no mixed-priority collapse.

**Coordinated live smoke COMPLETED — 2026-06-10T11:27:39Z.** The deferred 24h-window deliverability smoke (PDF-15/16/17/18/19 + emergent PDF-20/21) was run end-to-end against a real WhatsApp number (61466927921 / user 41) via the `monitor-test-run` skill. Full log + 3-layer HTML report: `docs/artefacts/tests/smoke-24h-window-deliverability-2026-06-10/report.html`. **Results — all happy paths GREEN:**
- **PDF-17** ✅ payment REJECT → `payment_rejection` template delivered out-of-window; "Payment Completed" retry tap → WF-02 normalizer → re-submit (execs 4105/4118/4119).
- **PDF-15** ✅ in-window relay → free-form text (exec 4141); out-window relay → template (exec 4149).
- **PDF-20** ✅ DECISIVELY verified — WF-41 corrected `transport='wa'` query routed to template despite recent Slack inbound rows (a pre-PDF-20 query would have gone free-form → silent Meta reject). WF-75 side proven via repeat-readiness.
- **PDF-21** ✅ `astrology_service_update_v2` send succeeded (no Meta 132xxx) → v2 name/lang/param match Meta's approved structure; v1 retired (exec 4234). Resolved BUG-01 (v1 buried message + literal `*` asterisks).
- **PDF-19** ✅ CLOSE → `consultation_closed` template + 3 buttons out-of-window; "Done, Thanks." tap → WF-02 → WF-43 (execs 4242/4265/4266). Bonus: reaction handled by WF-61 "text-only" guard.
- **PDF-18** ✅ WF-75 ACTIVATED + manual poll → single advisory nudge to consult channel (exec 4275 → WF-51 4276); repeat-readiness proven (nudge logged `transport=slack`, still matches → won't self-disable). No customer contact, no DB write.
- **Remaining un-exercised (NOT blockers, logged in test followups + below):** PDF-16 failure-visibility notice (no send failed this session to trigger it); WF-75 self-termination (repeat proven, stop logic-proven not live-demoed); PDF-19 "Leave Feedback"/"Book Again" routes (only "Done" tapped).
- **State changes from the smoke:** WF-75 left **ACTIVE** (user decision — keep on; registry needs 🟡→🟢 update). User 41 left fixtured `consultation_active` @ ~20h window. The per-item `DEFERRED — live smoke` notes below are superseded/resolved by this run for PDF-15/17/18/19/20/21.

**Additive planning pass — 2026-06-16T08:56:57Z (rolling sprint, append-only).** Planned the monitoring / observability + DB-backup cluster **PDF-22..PDF-26** (Batches 14–17) into this `state.md`; existing PDF-01..21 history untouched per rolling-sprint rule 2. These five are post-go-live safety nets ("Chinmay finds out before the customer does") that crystallised from the Gemini-key silent-failure incident, brainstormed/appended to `tasks.md` 2026-06-14. `tasks.md` hash mismatch is EXPECTED and is NOT a replan signal.

- **Discover-current-state basis:** Only **PDF-25** references an n8n workflow — **WF-70**, which `docs/workflow-registry.md` lists as `🔵 Build Fresh` (planned, unbuilt shell). The other four are NOT n8n workflows (PDF-22 = off-VPS Claude routine; PDF-23/24/26 = VPS-local cron/scripts), so no live n8n grep applies. No obsoletes detected. **Live re-confirm 2026-06-19 (tunnel reopened by user):** n8n reachable, 33 workflows; **zero `WF-70`/health/monitor workflow exists live → PDF-25 = build-it CONFIRMED, not obsolete.** Build precedent **WF-75** (`YnxDRcnCugnpGY0n`, active) and alert sender **WF-51** (`wlZRK0YxnhP0b2RL`, active) both present, so the PDF-25 build pattern is intact.

- **Decisions locked this session (per [[feedback_lock_decisions_in_plan]]):**
  - **DD-G — shared n8n-independent alert channel = direct Slack incoming-webhook.** PDF-23/24/26 (VPS cron) and PDF-22 (Claude routine) all alert by curl-POSTing a **Slack incoming-webhook URL**, NOT via n8n (n8n may itself be the thing that is down). Keeps Chinmay's single existing surface (Slack); no second app to watch. The webhook URL is a **swappable destination** (one config value, reused by all four). **PDF-23 is the carrier** — it establishes the shared alert helper (curl wrapper + repeat-suppress / alert-once-then-re-alert-after-interval state); PDF-24/26 reuse it; PDF-22 shares the same URL from the cloud side.
  - **DD-H — PDF-26 backup policy (corruption-survivable, validate-before-rotate).** Hourly `pg_dump | gzip` to VPS mounted storage. **Before rotating** (deleting the previous hour's good copy) the new dump is VALIDATED restorable: gunzip to a temp path, restore into a throwaway temp database (or sample-read), verify expected tables + a few sample rows / row counts look sane; **only on success** does it supersede the previous copy. On validation failure → KEEP the previous good copy AND raise a backup-failure alert (never overwrite good-with-bad). Offsite to **Google Drive twice daily (00:00 + 12:00 IST)** via rclone (tiny payload even at ~1k users), rolling **7-day** snapshot retention offsite. Documented restore path from on-VPS-latest OR an offsite snapshot. Any failure (dump / validation / offsite push) alerts via the DD-G helper. *(Validate-before-rotate is the user's 2026-06-16 refinement of the task's "always-latest could overwrite a good copy with a corrupt one" concern.)*

- **Dependencies (PDF-22..26):** no hard deps; three soft deps onto **PDF-23** capturing the shared-alert-helper coupling — PDF-24 (reuse helper + same VPS probe family), PDF-26 (reuse helper for backup-failure alerts), PDF-22 (reuse the same swappable webhook URL from off-VPS, non-blocking). **PDF-25 has no deps** (in-service n8n monitor — alerts via n8n's own Slack path, since n8n is up by definition when WF-70 runs). No same-n8n-workflow siblings (only PDF-25 touches n8n, and it is a brand-new workflow).

- **Priority adjustments confirmed:** none. The only deps point onto PDF-23 (P1) from equal-or-lower-priority items (PDF-24 P1, PDF-26 P1, PDF-22 P2) → priority order and dependency order agree. Within Batch 14, build PDF-23 first (it creates the helper PDF-24 reuses).

- **External prerequisites:** PDF-22 — the routine must reach the DD-G webhook (confirm Claude routines permit outbound HTTP to it; else wire a Slack/webhook connector at claude.ai/customize/connectors, currently none attached). PDF-23/24/26 — a Slack incoming-webhook URL provisioned (separate from the n8n Slack app). PDF-26 — rclone configured on the VPS with a Google-Drive remote. PDF-25 — SSH tunnel open for the build.

## Items

| ID | Status | Batch | Pri | Workflows | Depends On |
|----|--------|-------|-----|-----------|------------|
| PDF-01 | 🟢 done | 1 | P0 | WF-10 | — |
| PDF-02 | ⬜ pending | 2 | P2 | WF-10 | PDF-01 (hard) |
| PDF-03 | ⬜ pending | 3 | P2 | WF-10 | PDF-02 (hard) |
| PDF-06 | 🟢 done | 4 | P1 | WF-10 | — (carrier of the WF-10 event-filter fix) |
| PDF-07 | 🟢 done | 4 | P0 | WF-10 | PDF-06 (hard — same WF-10 fix) |
| PDF-08 | ⚪ obsolete | 4 | P2 | WF-10 | PDF-06 (hard — same WF-10 fix) |
| PDF-09 | 🟢 done | 5 | P2 | WF-20/30/31/32/42/44 | — |
| PDF-05 | 🟢 done | 6 | P0 | WF-30/31/43 | PDF-09 (soft) · Design gate |
| PDF-04 | 🟢 done | 6 | P0 | WF-30/31/43 | PDF-05 (hard — same fix), PDF-09 (soft) |
| PDF-10 | 🟢 done | 7 | P1 | WF-25 | PDF-04/05 (emerged in validation) |
| PDF-11 | 🟢 done | 7 | P2 | WF-30/43 | PDF-04/05 (soft) |
| PDF-12 | 🟢 done | 7 | P2 | WF-30 | PDF-11 (soft) |
| PDF-13 | 🟢 done | 8 | P2 | WF-31 | PDF-12 (soft — same canonical-block pattern) |
| PDF-14 | 🟢 done | 8 | P2 | WF-43 | PDF-11 (soft — same WF-43 reply path) |
| PDF-15 | 🟢 done | 9 | P0 | WF-41/50/51 | template:`astrology_service_update` ✅ Active · PDF-18 (soft — shared window source) · **live smoke ✅ 2026-06-10 (in+out window)** |
| PDF-16 | 🟢 done | 10 | P1 | WF-50/51 | PDF-15 (soft — backstop for its residual send failures) · **smoke NOT triggered 2026-06-10 (no send failed) — remaining** |
| PDF-17 | 🟢 done | 10 | P1 | WF-34/02/00 | template:`payment_rejection` ✅ Active · PDF-16 (soft — same WF-34) · PDF-19 (soft sibling) · **live smoke ✅ 2026-06-10 (reject + retry tap)** |
| PDF-18 | 🟢 done | 11 | P1 | WF-75 (new) | PDF-15 (soft — shared `messages` window source) · **live smoke ✅ 2026-06-10 (activated + match-path + repeat-readiness)** |
| PDF-19 | 🟢 done | 12 | P2 | WF-42 (button handler pre-done by PDF-17) | template:`consultation_closed` ✅ Active (NOT `consultation_closed_feedback` — that one Meta reclassified to Marketing) · PDF-17 (soft sibling — delivered PDF-19's receiving side) · **live smoke ✅ 2026-06-10 (close + "Done" tap; other 2 buttons remaining)** |
| PDF-20 | 🟢 done | 13 | P1 | WF-41/75 | resolves followups adjacent finding (PDF-15 window read not WA-scoped); emerged during PDF-18 build · **live smoke ✅ 2026-06-10 (decisive trap test)** |
| PDF-21 | 🟢 done | 13 | P1 | WF-41 | out-window template repointed `astrology_service_update`→`astrology_service_update_v2` (user retired the old one for a Meta bold-render bug); emerged 2026-06-09 · **live smoke ✅ 2026-06-10 (v2 sends, no 132xxx)** |
| PDF-22 | ⬜ pending | 17 | P2 | — (Claude Cloud routine, off-VPS) | PDF-23 (soft — same swappable Slack-webhook destination, DD-G; non-blocking) |
| PDF-23 | 🟢 done | 14 | P1 | — (VPS cron/script, not an n8n WF) | — (CARRIER — established shared n8n-independent Slack alert + repeat-suppress helper, DD-G; alert via existing bot token) |
| PDF-24 | 🟢 done | 14 | P1 | — (VPS cron/script) | PDF-23 (soft — reuse shared alert helper; same VPS probe family) |
| PDF-25 | 🔵 in-progress | 16 | P2 | WF-70 (new) + health_check_log table | — (design LOCKED 2026-06-28; build pending — see PDF-25 block) |
| PDF-26 | 🔴 blocked | 15 | P1 | — (VPS cron, not an n8n WF) | PDF-23 (soft — reuse shared alert helper) · on-VPS done; OFFSITE blocked on rclone/GDrive remote |

## Batch 1 — P0

- **Items:** 1
- **Description:** PDF-01 — replace WF-10 `free_text` hardcoded HELP reply with a Gemini (`gemini-2.5-flash-lite`) admin assistant answering from a static baked-in KB, posting back via WF-51 to the same channel. Design is LOCKED (spec + verbatim prompt on disk); build is mechanical per spec §3/§8.
- **Estimated size:** M
- **Estimated tokens:** ~40K

## Batch 2 — P2

- **Items:** 1
- **Description:** PDF-02 — extend the PDF-01 assistant with current user-state context (resolve `consult-{phone}` channel → user, fetch status/name/last action, inject a "current user" block into the Gemini prompt). UNDESIGNED — requires a brainstorm/design pass to resolve open questions (no-user-row fallback to PDF-01 static behaviour, exact fields, PII boundary) BEFORE build-sprint executes. Same WF-10 node as PDF-01 → strictly serial after Batch 1.
- **Estimated size:** M
- **Estimated tokens:** ~35K

## Batch 3 — P2

- **Items:** 1
- **Description:** PDF-03 — add recent message/consultation history for the channel's user to the assistant's context. UNDESIGNED — requires a brainstorm/design pass (last-N-messages cap, PII redaction/scope, token/payload cost) BEFORE build-sprint executes. Builds on PDF-02's user-resolution + context block; same WF-10 node → strictly serial after Batch 2.
- **Estimated size:** M
- **Estimated tokens:** ~35K

## PDF-01 — WF-10 free-text → Gemini admin assistant (static knowledge)

**Status:** 🟢 done
**Started:** 2026-05-31T11:31:07Z
**Completed:** 2026-05-31T11:42:48Z
**Actual tokens:** ~95K (large lint/validate MCP responses dominated; build itself ~40K)
**Actual effort:** ~12 min
**Estimate delta:** on-bucket (planned M ~40K; the build/verify reasoning was on-bucket, MCP validate response payloads inflated the raw token count)
**Priority:** P0 | **Batch:** 1
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), `free_text` branch only.
**Build summary:** 42→47 nodes. Route free_text → `Build Gemini Request` (Code, verbatim system prompt) → `Gemini Admin Assistant` (HTTP v4.2, googlePalmApi, onError=continueRegularOutput, single attempt) → `Extract Assistant Answer` (Code, null-guarded → geminiOk/answer) → `Did Gemini Succeed?` (IF v2.2) → TRUE `Build Assistant Reply Payload` / FALSE `Build Fallback Payload` (repurposed Build Help Prompt) → converge on `Call WF-51 (Assistant)` (repurposed Call WF-51 (Help Prompt)). Pseudo-first (WF-10.pseudo Step 14a–14f). MCP strict valid:true (0 errors), lint 0 hard-rejects, dangling 0, tv floor held. jsonBody bracket-adjacency error caught + fixed mid-PUT. Backup `archive/backups/wMh0oBRtJbvhLgOf-2026-05-31-21-36.json`. **Verified live (2026-05-31T11:48Z):** synthetic Slack event_callback ("How do I approve a payment for a user?") → WF-10 exec 3390 (success) → WF-51 exec 3394 → posted to chinmay-admin-commands: "To approve a user's payment, type APPROVE PAYMENT. You must type this command in the user's own consult channel." Acceptance §7 #1 PASS. Error-path design confirmed with user: continueRegularOutput + geminiOk IF (catches 503/timeout/non-200 AND empty/safety-blocked 200), single attempt, no retry — admin-only glitch fallback. Remaining acceptance checks (§7 #2 user-advice draft, #3 off-topic decline, #4 forced-failure glitch) deferred to demo/smoke.
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** —
**Design gate:** false
**Design locked at:** 2026-05-31
**Design locked in:** docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-design.md
**Size:** M
**Estimated tokens:** ~40K

Design LOCKED — plan-ready. Verbatim Gemini system prompt to splice as-is: `docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-prompt.txt`.

Replace the `Route by Kind (Admin)` Switch `free_text` output (currently `Build Help Prompt` → `Call WF-51 (Help Prompt)`, replying "🤖 Type `HELP` to see available commands.") with a Gemini call answering Chinmay's ops + user-advice questions from a static baked-in KB, posting back via WF-51 (`wlZRK0YxnhP0b2RL`, `{channelId, messageText}`) to the same channel.

Locked behaviour: ops question → explain command + where to type it; user-advice question → explain policy AND draft a labelled, business-tone, jargon-free WhatsApp reply ("Suggested reply:"); off-topic → polite in-domain decline + HELP pointer (a SUCCESSFUL Gemini call, not an error); Gemini failure/timeout/non-200 → fallback "⚠️ technical glitch, try again in a moment." Assistant ADVISES ONLY — never executes commands; structured `admin_wide`/`user_targeted` → WF-11 branches untouched.

Build (mechanical, per spec §3 + §8): add ~5–6 nodes on `free_text` (Build Gemini Request → HTTP Gemini [onError continue] → IF success → Extract/Build WF-51 payload / fallback payload → Call WF-51); remove/repurpose `Build Help Prompt`. Reuse the Gemini HTTP pattern from the inbound intent classifier (WF-10 has no LLM call to copy). Pseudo-first on `WF-10.pseudo`; backup WF-10; jq-on-disk + curl PUT for nested-array Set edits; Write the prompt `.txt` into the node (never through a shell var); typeVersion floor to live WF-10 (Set v3.4 / IF v2.2 / Switch v3.3 / executeWorkflow v1.2).

Acceptance: spec §7 — 5 functional checks + regression that structured commands still route to WF-11.

Soft-blocks PDF-02 and PDF-03 (they extend this same Gemini node).

## PDF-02 — Admin assistant: add current user-state context

**Status:** ⬜ pending
**Priority:** P2 | **Batch:** 2
**Change type:** Structural — WF-10 (same `free_text` branch / Gemini node as PDF-01).
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** PDF-01 (hard)
**Design gate:** true
**Size:** M
**Estimated tokens:** ~35K

**Decision required:** UNDESIGNED at plan time — a brainstorm/design pass MUST resolve the open questions below and produce a locked design spec BEFORE build-sprint picks this item up. build-sprint should refuse to build until `Design gate` is cleared to false with a `Design locked in` spec path.

Open design questions:
- No-user-row case (admin-wide channel, orphaned channel): assistant falls back to PDF-01 static-only behaviour — confirm the resolution/branch.
- Exact user fields to include (status, name, last action — and any others).
- PII boundary for what user state may enter the Gemini prompt.

What: resolve `consult-{phone}` channel → user, fetch `status`/`name`/last action, and inject a "current user" context block into the PDF-01 system prompt so "this user…" questions get user-specific answers. Adds a DB-lookup + channel→phone→user resolution step before the Gemini call.

Hard dep on PDF-01 (contract coupling): this item EXTENDS the exact Gemini node PDF-01 creates — the system prompt PDF-01 splices in (`docs/artefacts/specs/2026-05-31-pdf-01-admin-assistant-gemini-prompt.txt`) and PDF-01's `Build Gemini Request` / payload structure are the surface this item modifies. Build only after PDF-01 has landed and re-fetch live WF-10 to see PDF-01's actual node shape; do not author against an assumed prompt/payload. Same-workflow node → strictly serial after PDF-01 (concurrent WF-10 update race otherwise).

## PDF-03 — Admin assistant: add user message/consultation history context

**Status:** ⬜ pending
**Priority:** P2 | **Batch:** 3
**Change type:** Structural — WF-10 (same `free_text` branch / Gemini node).
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** PDF-02 (hard)
**Design gate:** true
**Size:** M
**Estimated tokens:** ~35K

**Decision required:** UNDESIGNED at plan time — a brainstorm/design pass MUST resolve the open questions below and produce a locked design spec BEFORE build-sprint picks this item up. build-sprint should refuse to build until `Design gate` is cleared to false with a `Design locked in` spec path.

Open design questions:
- Last-N-messages cap (how much history is actually useful).
- PII redaction / scope of message + consultation history entering the LLM prompt.
- Token/payload cost of injecting history.

What: add recent message / consultation history for the channel's user to the assistant's context so it can answer questions needing conversation backstory.

Hard dep on PDF-02 (contract coupling): builds on the user-resolution + "current user" context block PDF-02 adds — it appends history to that block. Build only after PDF-02 has landed and re-fetch live WF-10 to see PDF-02's actual resolution + context-block shape; do not author against an assumed structure. Same-workflow node → strictly serial after PDF-02.

## Batch 4 — WF-10 Slack-event genuine-message filter (PDF-06 + PDF-07 + PDF-08) — NEXT ACTIONABLE

- **Items:** 3 (PDF-06 ✅, PDF-07 ✅ — built as ONE WF-10 change; PDF-08 ⚪ obsolete/won't-do 2026-06-06 — admin commands kept in transcript by design, see PDF-08 item)
- **Description:** Single-root fix in WF-10 Slack Admin Handler (`wMh0oBRtJbvhLgOf`). WF-10 currently builds a relay envelope, an admin alert, and a WF-60 transcript-log entry for EVERY inbound Slack event in a consult channel — including channel-join / `member_joined_channel` / bot / system / admin-command events. Add a genuine-message classifier/guard so that ONLY a deliberate astrologer-typed consult-channel message (event.type=`message`, no `subtype`, real human `user`, not a bot, not an admin command) proceeds to the relay (`Call WF-41`), the "not relayed/wrong-state/phone-absent" admin alert, and the WF-60 transcript log. Non-genuine events are dropped silently from all three paths. Resolves: PDF-07 (no join/system event ever forwarded to the customer — P0 leak), PDF-06 (no false "message not relayed" admin alarms on channel open — P1), PDF-08 (transcript contains only real customer↔astrologer messages, not join lines or admin commands — P2).
- **Execution note:** Runs NEXT per the 2026-06-04 user directive ("admin-side noise / low-hanging fruit first"), ahead of design-gated batches 2/3 and the P0 KB batch 6. Mixed priority is intentional & inseparable (see header note). build-sprint: re-fetch live WF-10 first (it was last changed by PDF-01); the relay/log branch is distinct from PDF-01's `free_text` admin-assistant branch.
- **Change type:** Structural — single workflow (WF-10).
- **Estimated size:** M
- **Estimated tokens:** ~32K

## Batch 5 — PDF-09 consistent astrologer naming — DONE (2026-06-05)

- **Items:** 1 (PDF-09) — ✅ done
- **Decision:** User chose **"Dr. Chinmay"** (2026-06-05).
- **Description:** Surgical string fix. Scope corrected during the audit (see PDF-09 item): the 7 workflows that already had "Dr. Chinmay" were verified already-consistent; the fix upgraded plain customer-facing "Chinmay" → "Dr. Chinmay" in 6 OTHER workflows (WF-32/20/31/30/42/44). Brand "Chinmay Astro", UPI payee, and LLM prompts deliberately excluded.
- **Change type:** Surgical / parametric — multi-workflow (6), customer message strings. Batch Surgical (Step 5d), 6× curl PUT all 200.
- **Estimated size:** S (planned) / M (actual — audit-driven)

## Batch 6 — PDF-04 + PDF-05 grounded business-facts KB for customer replies (WF-30/31/43) — DONE (2026-06-06)

- **Items:** 2 (PDF-05 root ✅ + PDF-04 symptom ✅ — built as ONE fix). Scope expanded 3→4 nodes (WF-43 opted-out prompt added per audit, user-approved). Design pass + build collapsed into one session; spec `docs/artefacts/specs/2026-06-06-pdf-04-05-grounded-business-facts-kb-design.md`.
- **Description:** Give the customer-facing free-text LLM reply a single trusted set of business facts (offering = text-only consultation; price; what's included; explicitly NOT offered = video/phone) and a defer-to-astrologer rule for anything outside it. Apply the grounded KB + defer behaviour consistently to the `Prepare Gemini Response Prompt` of WF-30 (`gGJBY5fJha0Let8I`), WF-31 (`HB8nXudAtk9iXz7C`), and WF-43 (`3va0M06kijgyLejf`). Resolves PDF-04 (no fabricated services) and PDF-05 (no improvised/contradictory pricing). **Design-gated** — needs a brainstorm/design pass to author the KB content + defer rule (analogous to PDF-01's locked KB) BEFORE build. Soft dep on PDF-09 (same 3 workflows — let the cosmetic string swap land first, then re-fetch live).
- **Change type:** Structural — multi-workflow (3, in lockstep). KB design pass first.
- **Estimated size:** L
- **Estimated tokens:** ~50K (build) + a separate design/brainstorm session

## PDF-06 — False "message not relayed" alarms shown to admin when a consultation channel opens

**Status:** 🟢 done
**Started:** 2026-06-05T16:22:00Z
**Completed:** 2026-06-05T16:30:00Z
**Actual tokens:** ~60K (shared across PDF-06/07/08 — one WF-10 change; incl. .md regen + 2 large registry-row reads)
**Actual effort:** ~70 min (incl. design Q&A, Option-B decision, two-step go-ahead, live verification)
**Estimate delta:** on-bucket for the shared Batch-4 change (planned M ~32K for all three; raw token count inflated by the large pre-existing WF-10 registry row + AS-IS .md reads, the build itself was ~M)
**Priority:** P1 | **Batch:** 4
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), relay/alert branch.
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** — (this is the CARRIER item for the shared WF-10 event-filter fix; PDF-07 + PDF-08 hard-depend on it)
**Design gate:** false
**Size:** S (carrier; the WF-10 change is shared across PDF-06/07/08 — see Batch 4 ~32K total)
**Estimated tokens:** ~12K (incremental share)

Admin-facing symptom: on consultation-channel creation, members joining the new channel are processed by WF-10 as relay candidates; the relay-validation guards fail on them and fire admin alerts (`Build Wrong-State Alert` / `Build Phone-Absent Alert` family) reading like "⚠️ Message not relayed — WhatsApp send skipped", even though no admin typed anything. The shared fix (a genuine-message classifier in WF-10) drops join/system events before they reach the alert path, so the false alarms stop.

Acceptance: opening a consult channel and people joining it produces NO "message not relayed" warnings; such a warning appears only when the admin actually types a message that genuinely can't be delivered.

Same root as PDF-07 (customer-leak) and PDF-08 (transcript). Build all three as ONE WF-10 PUT.

**Build summary (2026-06-05):** Added one `Genuine Message?` IF (v2.2) in series after `Human Vs Bot Message?` (TRUE), before `Extract Required Fields`. Condition `={{ $json.body.event.type === 'message' && !$json.body.event.subtype && !$json.body.event.bot_id }}` (boolean=true, matches the workflow's `State Match?` single-bool pattern → no strict-validation throw on absent subtype/bot_id). FALSE → silent drop (`lint-allow: if-false-disconnect-bypass` in notes). 47→48 nodes; jq-on-disk + curl PUT (no MCP). Pseudo-first: WF-10.pseudo Step 5→5a/5b + PDF-08 Notes. Backup `archive/backups/wMh0oBRtJbvhLgOf-2026-06-05-16-22.json`. Lint hook exit 0; IF tv floor 2.2 held. Impact: no parents (Slack webhook entry); children WF-11/41/51/60 contracts unchanged; no siblings (zero genuine-message filtering elsewhere in 31 workflows). No nodes removed/renamed → no dangling refs; FALSE dead-ends with no convergence → no conditionally-skipped-node refs. **Verified live:** exec 3555 (member_joined_channel → `Genuine Message?` FALSE `[0,1]` → dropped, zero downstream) + exec 3556 (genuine message → TRUE `[1,0]` → proceeds to Extract Required Fields; downstream `Find Channel` errored only on the synthetic fake channel id, confirming TRUE routing). `messages` table clean (no junk rows). PDF-06 ✅ + PDF-07 ✅ fully resolved; PDF-08 partial (see PDF-08 item).

## PDF-07 — Channel housekeeping events can be delivered to the customer as if from the astrologer

**Status:** 🟢 done
**Started:** 2026-06-05T16:22:00Z
**Completed:** 2026-06-05T16:30:00Z
**Actual tokens:** shared with PDF-06 (one WF-10 change)
**Actual effort:** shared with PDF-06
**Estimate delta:** shared Batch-4 change — on-bucket
**Priority:** P0 | **Batch:** 4
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), relay branch.
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** PDF-06 (hard — SAME WF-10 fix; the genuine-message classifier added for PDF-06 is exactly what stops join events reaching `Call WF-41` → the customer)
**Design gate:** false
**Size:** S (shared WF-10 change)
**Estimated tokens:** ~10K (incremental share)

Customer-facing risk (P0): routine channel events (join/leave/system) are built into a relay envelope and sent to `Call WF-41 (Admin->User Relay)` → WhatsApp. In the observed case it only failed to reach the customer because the consultation wasn't active yet, but mid-consultation a customer could receive "so-and-so has joined the channel". Only deliberate astrologer-typed messages may ever be forwarded.

Acceptance: no automatic channel event (join/leave/system) is ever forwarded to the customer; only deliberate astrologer messages reach WhatsApp.

Hard contract coupling with PDF-06: both resolved by the single WF-10 genuine-message guard. Build together; do not author a separate filter.

## PDF-08 — Consultation transcript polluted with system/command entries

**Status:** ⚪ obsolete
**Obsolete at:** 2026-06-06T21:14:05Z
**Obsolete reason:** WON'T DO — the remaining admin-command-exclusion scope is a non-issue by design. User decision (2026-06-06): the admin's typed commands (APPROVE PAYMENT, CLOSE, etc.) are a legitimate part of the admin↔user conversation and belong in the transcript. They form the audit trail that explains *how* the user reached their current status — excluding them would remove exactly the records that reconstruct the state history. The channel-housekeeping/system/join-line portion of PDF-08's original acceptance was already met by the Batch-4 `Genuine Message?` gate (shipped with PDF-06/07); that part stands. No WF-60 re-wire will be done. Future audits: do NOT re-flag admin commands in the transcript as pollution — they are kept deliberately. See memory [[project_pdf08_admin_commands_in_transcript]].
**Priority:** P2 | **Batch:** 4
**Decision made (2026-06-05, Option B):** User chose to defer the admin-command-exclusion portion of this item. The Batch-4 `Genuine Message?` gate (landed with PDF-06/07) already removes channel-housekeeping/system/join lines from the `chinmay_astro.messages` transcript — that PART of PDF-08's acceptance is met. The REMAINING work (exclude the admin's own typed commands APPROVE/CLOSE from the transcript) requires moving the WF-60 logging side-branch off `Extract Required Fields` onto the validated `relay_text` path so only genuine astrologer→customer consultation messages are persisted; the WF-60 Code node would re-read from `Classify User Channel Message` / `Extract Required Fields` (both always-executed on that branch). Deferred to a later batch to keep the pre-demo blast radius minimal.
**Decision superseded (2026-06-06):** The deferral above is now resolved as WON'T DO (see Obsolete reason). The remaining scope will not be built.
**Change type:** Structural — single workflow (WF-10 `wMh0oBRtJbvhLgOf`), WF-60 logging branch.
**Workflows:** WF-10
**n8n IDs:** `wMh0oBRtJbvhLgOf`
**Depends on:** PDF-06 (hard — SAME WF-10 fix; the genuine-message classifier also gates `Build WF-60 Payload (Slack Inbound)` → `Call WF-60 Message Logger`)
**Design gate:** false
**Size:** S (shared WF-10 change)
**Estimated tokens:** ~10K (incremental share)

Admin-facing record hygiene (P2): the stored consultation transcript (via `Call WF-60 Message Logger`) mixes channel-join lines and the admin's own command keystrokes (e.g. APPROVE PAYMENT) in with real customer↔astrologer dialogue. The same WF-10 genuine-message guard must also gate the WF-60-logging path so only real customer↔astrologer messages are persisted.

Acceptance: the consultation transcript contains only real customer and astrologer messages; channel housekeeping events and admin commands are excluded.

Same root as PDF-06/07. Verify the guard covers BOTH the relay path AND the WF-60-logging path (they are separate downstream branches of the same `Build WF-10 Relay Envelope`).

## PDF-09 — Inconsistent "Dr. Chinmay" vs "Chinmay" naming to the customer

**Status:** 🟢 done
**Started:** 2026-06-05T16:41:00Z
**Completed:** 2026-06-05T16:50:00Z
**Actual tokens:** ~70K (full-corpus audit of 113 unique "Chinmay" contexts to separate person-name from brand/payee/prompt dominated; the swap itself was small)
**Actual effort:** ~25 min
**Estimate delta:** +1 bucket (planned S ~28K, actual ~70K = M-band — the audit to safely scope person-name vs "Chinmay Astro" brand / UPI payee / LLM prompts was larger than a flat 7-workflow string swap; the plan assumed the 7 Dr.-workflows were the only surface, but the real fix was 6 *other* workflows + confirming the 7 already-consistent)
**Priority:** P2 | **Batch:** 5
**Change type:** Surgical / parametric — multi-workflow (6), customer-facing message string(s) per workflow.
**Decision made (2026-06-05):** User chose **"Dr. Chinmay"** as the single correct form, applied consistently to every customer-facing message that names the astrologer.
**Workflows (actually edited):** WF-32, WF-20, WF-31, WF-30, WF-42, WF-44
**n8n IDs:** `emUOLWVZiNVxcOe3` (WF-32), `LgIDj1v4ZbCPlX25` (WF-20), `HB8nXudAtk9iXz7C` (WF-31), `gGJBY5fJha0Let8I` (WF-30), `fx70vqyJtRdF2DgR` (WF-42), `Du2CJ3OTohRFZYoA` (WF-44)
**Depends on:** —
**Design gate:** false
**Size:** S (planned) / M (actual — audit-driven)

**Audit & scope correction:** The plan listed the 7 workflows where "Dr. Chinmay" *already* appeared (WF-21/23/30/31/43/45/62) on the assumption the chosen form might be plain "Chinmay" (which would have *downgraded* them). Since the user chose "Dr. Chinmay", those 7 are already correct — verified their remaining plain "Chinmay" is all brand ("Chinmay Astro"), UPI payee, or LLM-prompt text. The real fix was upgrading plain customer-facing "Chinmay" (the person) → "Dr. Chinmay" in **6 OTHER workflows**: WF-32 ("…approve your consultation"), WF-20 ("will respond" / "will approve it shortly" / "new one with Chinmay" ×3), WF-31 ("will verify"), WF-30 ("will be ready"), WF-42 ("consultation with Chinmay is complete"), WF-44 ("experience with Chinmay's consultation service").

**Deliberately excluded (NOT customer name-of-person):** "Chinmay Astro" (business/brand name — never "Dr. Chinmay Astro"); UPI payee `+91-9653240263 (Chinmay Mujumdar)` (bank account holder name, must match for payments); WF-10 admin-assistant Gemini prompt + intent-classifier prompts (internal LLM instructions, never shown to a customer); credential names, `"authors"` metadata, contact email.

**Build:** Batch Surgical (build-workflow Step 5d) — backed up all 6 (`archive/backups/<uuid>-2026-06-05-16-41.json`), applied per-file `jq walk(gsub(...))` with a `(?<!Dr\. )` lookbehind guard (no double-"Dr."), 6× curl PUT (all 200, doubleDr=0), exported, secrets scan clean, lint clean (20 advisories all pre-existing Contract-First/Step-5g — none from this change). Spot-checked WF-20/42/44 live: replacements correct, brand intact. Final corpus scan: only remaining plain "Chinmay + verb" is inside the WF-10 Gemini prompt (correctly excluded).

Acceptance: ✅ a single correct form of the astrologer's name/title ("Dr. Chinmay") is used consistently in every customer-facing message.

## PDF-05 — Bot improvises service/pricing answers without a reliable source of truth

**Status:** 🟢 done
**Started:** 2026-06-06T21:14:05Z
**Completed:** 2026-06-06T22:23:51Z
**Actual tokens:** ~85K (design pass live trace of WF-25/30/31/43 routing + 4-node prompt authoring + Batch-Surgical build; design+build in one session)
**Actual effort:** ~70 min (live routing trace, 5-point design Q&A, 4th-node scope decision, build + verify)
**Estimate delta:** on-bucket (planned L ~50K build + separate design session; design+build collapsed into one session, ~85K combined)
**Priority:** P0 | **Batch:** 6
**Change type:** Structural — multi-workflow (WF-30/31/43, in lockstep), customer free-text Gemini-reply prompt.
**Workflows:** WF-30, WF-31, WF-43
**n8n IDs:** `gGJBY5fJha0Let8I` (WF-30), `HB8nXudAtk9iXz7C` (WF-31), `3va0M06kijgyLejf` (WF-43)
**Depends on:** PDF-09 (soft — same 3 workflows; let the naming string swap land first)
**Design gate:** false
**Design locked at:** 2026-06-06
**Design locked in:** docs/artefacts/specs/2026-06-06-pdf-04-05-grounded-business-facts-kb-design.md
**Size:** L
**Estimated tokens:** ~50K (build) + separate design session

**Decision made (2026-06-06):** Design pass completed + locked (spec above). User decisions: text-only offering (audio/video/auto-pay "coming soon" only when asked); ₹500 plain (no "introductory"); ONE question/topic scope, multi-message at Dr. Chinmay's discretion until CLOSE; topic-gated defer rule (generic astrology answerable / personal → defer to Dr. Chinmay); single authored source (byte-identical block across nodes). **Scope expanded** from 3 → 4 nodes: audit found WF-43 `Prepare Gemini Prompt (Opted-Out)` with identical fabrication risk; user approved including it.

**Build summary (2026-06-06):** Batch Surgical (build-workflow Step 5d). Grounded `KNOWN FACTS` block + 4-bucket topic-gated `HOW TO RESPOND` rules spliced into 4 `Prepare Gemini …` Code nodes across 3 workflows: WF-30 (1), WF-31 (1), WF-43 (2 — `Prepare Gemini Response Prompt` + `Prepare Gemini Prompt (Opted-Out)`, both keep their `valid_user_message` JSON wrapper + no-pay/REBOOK guard). Routing verified live first: each node reached only on WF-25 `general_enquiry`. jq --rawfile splice (code authored to .txt, never via shell var) → 3× curl PUT (all 200; WF-43 both edits in one PUT). Backups `archive/backups/<uuid>-2026-06-06-22-22.json`. Verified live: factsNodes 1/1/2, defer-line 1/1/2, node counts unchanged (12/15/32), all active; 4× `node --check` JS-OK; export + secrets scan clean. Acceptance (no-fabricated-service / consistent-price / personal-defer / off-topic-no-defer-line) to confirm at demo/smoke.

Root item (PDF-04 is its symptom): the customer-facing free-text LLM reply (`Prepare Gemini Response Prompt` → `Gemini General Response` → `Extract Gemini Reply` → `Send …Reply via WF-50`) exists in WF-30/31/43 with NO grounded KB, so it improvises/contradicts itself on services & pricing. Inject the same trusted business-facts KB + defer rule into all three `Prepare Gemini Response Prompt` nodes consistently. Re-fetch each live workflow at build (post-PDF-09).

Open design questions: exact KB content (canonical offering/price/inclusions + not-offered list); defer-to-astrologer phrasing; whether to share one KB string across the 3 prompts (single source of truth) vs per-state copies; consistency of fallback when Gemini is uncertain.

Acceptance: factual questions about offering/price/inclusions are answered consistently and correctly from the trusted source; anything outside it is deferred to the astrologer, never guessed.

P0 but sequenced LAST of the new items per user directive (admin-side noise first). Same fix covers PDF-04.

## PDF-04 — Bot tells customers it offers services that don't exist

**Status:** 🟢 done
**Started:** 2026-06-06T21:14:05Z
**Completed:** 2026-06-06T22:23:51Z
**Actual tokens:** shared with PDF-05 (one grounded-KB fix across the 4 nodes)
**Actual effort:** shared with PDF-05
**Estimate delta:** shared Batch-6 change — on-bucket
**Priority:** P0 | **Batch:** 6
**Change type:** Structural — multi-workflow (WF-30/31/43), customer free-text Gemini-reply prompt. SAME fix as PDF-05.
**Workflows:** WF-30, WF-31, WF-43
**n8n IDs:** `gGJBY5fJha0Let8I` (WF-30), `HB8nXudAtk9iXz7C` (WF-31), `3va0M06kijgyLejf` (WF-43)
**Depends on:** PDF-05 (hard — SAME grounded-KB fix; the "not-offered" list authored for PDF-05 is exactly what stops the "yes, we offer video consultations" fabrication), PDF-09 (soft — same workflows)
**Design gate:** false (cleared with PDF-05)
**Design locked in:** docs/artefacts/specs/2026-06-06-pdf-04-05-grounded-business-facts-kb-design.md
**Size:** S (shared with PDF-05)
**Estimated tokens:** ~8K (incremental share)

Symptom of PDF-05: with no grounded KB the assistant asserted a non-existent video offering. Resolved by the same fix — the `KNOWN FACTS` "audio/video … NOT available yet — coming soon" entry + the "never invent beyond KNOWN FACTS" rule replace the old narrow "don't invent prices" guard, across all 4 nodes (incl. WF-43 opted-out). See PDF-05 build summary. Acceptance (no "yes, we offer it" for video/audio) to confirm at demo/smoke.

## Batch 8 — reply-style consistency (emerged during PDF-11/12 live validation, 2026-06-07) — DONE

- **Items:** 2 (PDF-13 WF-31 under-review consistency · PDF-14 WF-43 welcome/REBOOK UX). Built pseudo-first (WF-31/43 `.pseudo` revised before live), validated live on user 61466927921.

## PDF-13 — WF-31 payment_submitted replies had two different styles

**Status:** 🟢 done
**Started:** 2026-06-07T08:00:00Z
**Completed:** 2026-06-07T09:22:37Z
**Priority:** P2 | **Batch:** 8
**Change type:** Structural — single workflow (WF-31 `HB8nXudAtk9iXz7C`), reply nodes.
**Workflows:** WF-31
**n8n IDs:** `HB8nXudAtk9iXz7C`
**Depends on:** PDF-12 (soft — mirrors the canonical-block pattern)
**Design gate:** false

The general-enquiry path (Gemini, conversational "being reviewed") and the canned wants_consultation path (templated "⏳ under review") gave two different styles. Fix (mirrors PDF-12): one canonical "⏳ *Your payment is under review.* Dr. Chinmay will confirm it shortly — you don't need to do anything else for now." block, appended to the Gemini reply AND used as the canned reply (byte-identical); Gemini told not to phrase the review status. Text-only (no button/payment block — payment already made). Pseudo-first (`WF-31.pseudo` Steps 6/8). Backup `archive/backups/HB8nXudAtk9iXz7C-2026-06-07-08-00-pre-consistency.json`. PUT 200; JS-OK; verified live (both paths end with the identical block).

## PDF-14 — WF-43 post-consult "Welcome back" incoherence + REBOOK-only CTA

**Status:** 🟢 done
**Started:** 2026-06-07T08:00:00Z
**Completed:** 2026-06-07T09:22:37Z
**Priority:** P2 | **Batch:** 8
**Change type:** Structural — single workflow (WF-43 `3va0M06kijgyLejf`), two Gemini prompt nodes.
**Workflows:** WF-43
**n8n IDs:** `3va0M06kijgyLejf`
**Depends on:** PDF-11 (soft — same WF-43 reply path)
**Design gate:** false

Two UX issues from PDF-11/12 validation: (a) the reply told users to "reply REBOOK" while sending a Book Again button (mentioned only the keyword); (b) the standard returning-user prompt said "welcome back" — incoherent right after a just-closed consultation. Fix: both prompts now offer "tap Book Again below OR reply REBOOK" (both valid); the STANDARD prompt is time-neutral (no "welcome back" — can't know elapsed time); the OPTED-OUT prompt KEEPS welcome-back (a re-engaging opted-out user genuinely returned). Decision (2026-06-07): Option B (time-neutral copy) now; gap-aware welcome via DB last-contact lookup deferred to post-MVP TD-NEW-042 (bundles with PDF-02/03). Pseudo-first (`WF-43.pseudo` Steps 15/16). Backup `archive/backups/3va0M06kijgyLejf-2026-06-07-08-00-pre-rebook-welcome.json`. PUT 200; JS-OK; verified live (time-neutral standard, welcome-back retained for opted-out, both CTAs).

Acceptance: asking about a service that isn't offered never yields a "yes, we offer it" answer; the bot states the actual offering plainly or defers to the astrologer. No fabricated services/capabilities in any automated customer reply.

## Batch 7 — customer-reply UX hardening (emerged during PDF-04/05 live validation, 2026-06-07) — DONE

- **Items:** 3 (PDF-10 WF-25 routing fix · PDF-11 button re-attach · PDF-12 payment-instruction consistency). All surfaced and built during the live test session for PDF-04/05; tested working on user 61466927921 before commit.
- **Change type:** Structural (WF-25 prompt; WF-30/43 reply-payload nodes).

## PDF-10 — WF-25 mis-routes service/non-text/astrology questions away from the grounded reply

**Status:** 🟢 done
**Started:** 2026-06-06T23:00:00Z
**Completed:** 2026-06-06T23:10:00Z
**Priority:** P1 | **Batch:** 7
**Change type:** Structural — single workflow (WF-25 Intent Classifier `eTV1lUcYrXBg2q2T`), classifier prompt.
**Workflows:** WF-25
**n8n IDs:** `eTV1lUcYrXBg2q2T`
**Depends on:** — (emerged during PDF-04/05 validation)
**Design gate:** false

Surfaced in validation: "How much is audio consultation and how do I get it" and "When will I get a job?" classified `wants_consultation` (the def's "or is asking about booking" clause) → routed to the canned payment reminder, bypassing the grounded Gemini KB reply (PDF-04/05). Fix (user-directed scope, 2026-06-06): narrowed `wants_consultation` to ONLY a clear intent to begin the text-based WhatsApp consultation; routed service/offering/pricing/how-to questions, non-text modality requests (audio/video/phone), and astrology-adjacent topics (gems/mantra/remedies/personal life questions) to `general_enquiry` → defer to the Gemini nodes.

**Build summary:** edited `Prepare Intent Request` Code node (2 category defs). Impact analysis cleared all 4 callers: WF-30/31 improve (more questions reach grounded reply), WF-43 unaffected (both categories already → Gemini), WF-40 doesn't branch on intent category. Backup `archive/backups/eTV1lUcYrXBg2q2T-2026-06-06-22-22.json`. PUT 200; JS-OK; verified live — re-test of both messages now routes `general_enquiry` → Gemini (audio "coming soon"; job question deferred to Dr. Chinmay).

## PDF-11 — Action buttons scroll away after general-enquiry Q&A

**Status:** 🟢 done
**Started:** 2026-06-06T23:28:00Z
**Completed:** 2026-06-06T23:35:00Z
**Priority:** P2 | **Batch:** 7
**Change type:** Structural — WF-30 (`gGJBY5fJha0Let8I`) + WF-43 (`3va0M06kijgyLejf`), reply-payload nodes.
**Workflows:** WF-30, WF-43
**n8n IDs:** `gGJBY5fJha0Let8I`, `3va0M06kijgyLejf`
**Depends on:** PDF-04/05 (soft — same reply nodes)
**Design gate:** false

After several general-enquiry replies, the original action button (sent once at form submission / consultation close) is scrolled far up. WF-50 already supports interactive sends (`messageType:'interactive'`, passthrough trigger); button taps match by reply id regardless of carrier message, so re-sending needs no router change.

**Build summary:** WF-30 — `Extract Gemini Reply` (general-enquiry) and `Prepare Payment Reminder` (booking-intent) now send interactive messages re-attaching the `payment_completed` "Payment Completed ✓" button; `Send Payment Reminder via WF-50` switched to passthrough (`workflowInputs.value={}`) so interactivePayload flows through. WF-43 — `Build Reply Payload` converted Set→Code (typeVersion 2, floor), re-attaching the 3 post-consult buttons (`btn_feedback`/`btn_rebook`/`btn_done`). Backups `*-2026-06-06-23-28.json`. PUTs 200; JS-OK; verified live (WF-30 button on enquiry + reminder paths; WF-43 3 buttons on closed-state replies). Scope: WF-31 deliberately excluded (no user action in payment_submitted).

## PDF-12 — Inconsistent payment instructions in payment_pending replies

**Status:** 🟢 done
**Started:** 2026-06-07T00:10:00Z
**Completed:** 2026-06-07T00:21:00Z
**Priority:** P2 | **Batch:** 7
**Change type:** Structural — single workflow (WF-30 `gGJBY5fJha0Let8I`), reply nodes.
**Workflows:** WF-30
**n8n IDs:** `gGJBY5fJha0Let8I`
**Depends on:** PDF-11 (soft — same WF-30 reply nodes)
**Design gate:** false

The general-enquiry path's payment CTA was Gemini-phrased — incomplete (no UPI handle/payee) and inconsistent ("via GPay" vs "via GPay/UPI"), while the reminder path had the full deterministic block. Fix (user chose deterministic-block option, 2026-06-07): one canonical `PAYMENT_DETAILS` block (full UPI handle + payee) appended in code to both `Extract Gemini Reply` and `Prepare Payment Reminder`; the Gemini prompt told to stop phrasing payment (may still state ₹500 price if asked) so it never improvises payment instructions.

**Build summary:** edited 3 WF-30 nodes (`Prepare Gemini Response Prompt`, `Extract Gemini Reply`, `Prepare Payment Reminder`); identical `PAYMENT_DETAILS` literal in both reply nodes (single authored source). Defensive reply-length cap (800 chars) to stay under WhatsApp's 1024-char interactive body limit. Backup `archive/backups/gGJBY5fJha0Let8I-2026-06-06-23-28-pre-paymentconsistency.json`. PUT 200; JS-OK; verified live — every payment_pending reply ends with the identical full payment block + Payment Completed button.

## Batch 9 — PDF-15 relay 24h-window deliverability gate (WF-41) — NEXT ACTIONABLE (P0)

- **Items:** 1 (PDF-15)
- **Description:** Make Dr. Chinmay's relay replies deliverable when the customer's 24h WhatsApp service window has closed. **Window-conditional** (DD-A): read the customer's last inbound from `chinmay_astro.messages` (`MAX(created_at) WHERE direction='inbound'`, DD-B); if <24h → send free-form as today (unchanged, full fidelity, free per M2); if ≥24h → **pre-process to template-safe** (DD-C: newlines→spaces per M4, collapse 4+ spaces, split >~900 chars into "(1/N)" parts) and deliver via the **relay-reply** utility template (DD-D body). No bounce-back/retype path; residual Meta send failures are caught by PDF-16.
- **External prerequisite:** the **relay-reply** template must be approved in Meta first (submit earliest — elevated rejection risk for thin-content utility templates).
- **Change type:** Structural — WF-41 (+ WF-50 send mode), new DB-read for window state.
- **Pseudo-impact:** yes (new branch + send logic on the relay path → revise `WF-41.pseudo` before build).
- **Estimated size:** L
- **Estimated tokens:** ~60K

## Batch 10 — PDF-16 failure-visibility + PDF-17 rejection→template (P1)

- **Items:** 2 (PDF-16 cross-cutting send-failure visibility ⬜ · PDF-17 WF-34 rejection always-template ✅ done 2026-06-09)
- **PDF-17 build note (2026-06-09):** scope expanded S→M at build time (user-steered) — fix is receiving-side, touched WF-34 (send) + WF-02 (new post-filter template-button normalizer) + WF-00 (log nicety); WF-50 UNCHANGED. Also pre-delivered PDF-19's receiving side. See PDF-17 item for full build summary. Live WhatsApp smoke deferred (bundle with PDF-15/PDF-16).
- **Description:** PDF-16 — customer-bound callers stop ignoring WF-50's `success=false` and post a plain-language in-channel notice to Dr. Chinmay (primary surface WF-41 relay; also WF-34/WF-42); this is the backstop beneath PDF-15's app-side gate (DD-4). PDF-17 — convert the WF-34 payment-rejection message from an interactive button message to an **always-template** send (DD-E/DD-1), mirroring how approval already uses `consultation_activated`; no window logic. PDF-16 and PDF-17 overlap on WF-34 (soft same-workflow sibling) → execute sequentially, re-fetch live WF-34 at each pickup.
- **External prerequisite (PDF-17 only):** **payment-rejection** template approved in Meta. PDF-16 has no template dependency.
- **Change type:** Structural — WF-41/34/42 (PDF-16) + WF-34 (PDF-17).
- **Pseudo-impact:** yes (both — new failure-notice branch; send-mechanism swap on rejection).
- **Estimated size:** M
- **Estimated tokens:** ~60K

## Batch 11 — PDF-18 passive window-closing nudge — NEW WF-7x scheduled workflow (P1)

- **Items:** 1 (PDF-18) — project's FIRST scheduled/background workflow (WF-7x range, pulled forward from post-go-live)
- **Description:** Hourly-class scheduled job (poll every 2h) that posts an advisory, non-blocking reminder into the consult channel when a customer's free-reply window is 18–24h old and the last inbound is **unanswered** (`last_inbound > last_outbound`). Repeats ~3–4× across 18→24h (DD-F), self-terminates at 24h or the moment Dr. Chinmay replies. Never contacts the customer, never auto-replies, writes no state.
- **Greenfield note:** author `WF-7x.pseudo` **in this batch** (co-located pseudo-first per plan-sprint §3d greenfield rule — do NOT defer pseudo to a later batch). Live is built from the pseudo in the same session.
- **Change type:** Structural — new workflow (Schedule trigger + Postgres query + WF-51 send).
- **Pseudo-impact:** yes (greenfield — pseudo authored in-batch).
- **Estimated size:** M
- **Estimated tokens:** ~40K

## Batch 12 — PDF-19 close prompt → always-template (P2)

- **Items:** 1 (PDF-19)
- **Description:** Convert the WF-42 consultation-close prompt from an interactive 3-button message to an **always-template** send (DD-E/DD-1) so it always reaches the customer regardless of the 24h window. Two constraints: (a) the template carries all **3** quick-reply buttons with the same ids/wording as today, and a *template* quick-reply tap arrives in a **different webhook shape** than the current interactive `button_reply` (M5) — so the post-close button-tap handler must accept **both shapes**; (b) the post-close experience fixed earlier this sprint (PDF-11 button re-attach, PDF-14 time-neutral copy) must still hold — only the close prompt itself becomes a template. Review/rewrite the existing unused `consultation_closed_feedback` template body to match the current close copy + buttons.
- **External prerequisite:** `consultation_closed_feedback` reviewed/rewritten + approved in Meta.
- **Change type:** Structural — WF-42 (send) + post-close button-tap handler (dual-shape parse).
- **Pseudo-impact:** yes (send-mechanism swap + new inbound tap shape).
- **Estimated size:** M
- **Estimated tokens:** ~35K

## PDF-15 — Astrologer's relay reply silently never reaches the customer if their window is >24h closed

**Status:** 🟢 done
**Started:** 2026-06-08T08:00:24Z
**Completed:** 2026-06-08T08:17:50Z
**Owner session:** build-pre-demo-minor-fixes-8Jun26
**Actual tokens:** ~75K (spec + WF-41/50/10 pseudo+md reads dominated; WF-50.md grep was the largest single input)
**Actual effort:** ~17 min
**Estimate delta:** on-bucket (planned L ~60K, actual ~75K — within L band)
**Priority:** P0 | **Batch:** 9
**Change type:** Structural — WF-41 Admin→User Relay (`6PzJRZsF7k2d9hV7`) + WF-50 send mode; new `messages`-table window-state read; relay-reply template send; out-window pre-process.
**Workflows:** WF-41, WF-50, WF-51
**n8n IDs:** `6PzJRZsF7k2d9hV7` (WF-41) · `BUVun38WEKb12zg9` (WF-50) · `wlZRK0YxnhP0b2RL` (WF-51)
**Depends on:** relay-reply template approval (external, Meta) · PDF-18 (soft — shares the `messages` window-state source) · PDF-16 (soft — PDF-16 is the residual-failure backstop; build close together)
**Design gate:** false (locked this session)
**Size:** L
**Estimated tokens:** ~60K
**Pseudo-impact:** yes — revise `WF-41.pseudo` (new in-window/out-window branch) before build.

**Decisions locked (2026-06-08, grounded in Meta docs):**
- **DD-A window-conditional, NOT always-template.** In-window → free-form unchanged (full fidelity, no M4 constraint, free per **M2**). Out-window → relay-reply template. Rationale: M4 bans newlines / 4+ spaces in template parameters and caps body at 1024 — so *always*-template would strip formatting, force a "Dr. Chinmay:" prefix, and split EVERY reply including the common in-window live exchange, for no cost saving (Meta meters window-state itself). The window check is one cheap SQL + IF; keeping it preserves in-window fidelity.
- **DD-B window source = `chinmay_astro.messages`**, `MAX(created_at) WHERE user_id=X AND direction='inbound'`. The relay path does no `users` write, so `users.last_message_at` is stale — not usable (spec §4).
- **DD-C out-window = pre-process to template-safe + deliver (no bounce-back).** Collapse newlines→spaces (M4), collapse 4+ spaces, split >~900 chars into "(1/N)" parts (≤1024 body incl. fixed prefix), then send via relay-reply template. NO "retype it" path back to Dr. Chinmay. If a send still fails at Meta (paused template, rate limit) → **PDF-16** surfaces it.
- **DD-D relay-reply template body:** *"Sorry for the delayed response to your message. Here's the response from Dr. Chinmay: {{1}}"* — apology/service framing chosen over bare `{{1}}` to (a) reduce Meta utility-approval rejection risk (thin-content templates get flagged) and (b) give correct customer tone after a >24h gap. `{{1}}` budget ≈960 chars after the ~60-char prefix; split at ~900 for margin. Multi-part: the fixed prefix repeats per part; "(1/N)" label rides inside `{{1}}` (build detail).

**Meta grounding:** M1 ([pricing](https://developers.facebook.com/docs/whatsapp/pricing)) · M2 ([July 2025 pricing](https://developers.facebook.com/docs/whatsapp/pricing/updates-to-pricing/)) · M4 ([guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines/), [error-code ref — "parameters cannot include newline characters or more than 4 consecutive spaces"](https://www.heltar.com/blogs/all-meta-error-codes-explained-along-with-complete-troubleshooting-guide-2025-cm69x5e0k000710xtwup66500)) · unused-template re-approval ([template statuses](https://help.gohighlevel.com/support/solutions/articles/155000001623-whatsapp-template-statuses-and-best-practice)).

**Acceptance:** a relay reply sent after the customer's window has closed reaches the customer as the window-safe template (their reply re-opens the window → normal free-form resumes); in-window replies are unchanged free-form; a previously-undeliverable message never alters handling of later messages (stateless gate). Spec DD-2/DD-3.

**Approved template structure — `astrology_service_update` (verified live 2026-06-08T07:52:58Z, lang `en`):**
- Header: TEXT (fixed, no var) — *"Follow-up on your astrology consultation"*.
- Body (134 chars): *"\*Sorry for the delayed response to your message. Here's the response from Dr. Chinmay:\n\*\n{{1}}\n\n\*Please respond at your convenience.\*"* — **one positional var `{{1}}` = the DD-C-sanitized reply** (single-line, ≤~900 chars).
- No footer, no buttons.
- **Send payload:** `components:[{type:"body",parameters:[{type:"text",text:<sanitized reply>}]}]`, `language:{code:"en"}`.
- ℹ️ **Known cosmetic quirk — ACCEPTED, do NOT re-flag or attempt to fix.** The split `*` on lines 1–2 (→ literal asterisks in WhatsApp) is a **Meta template-UI bug**: the editor's Bold control forces the closing `*` onto the next line, so it cannot be authored correctly from the UI (user confirmed 2026-06-08). Not an authoring error, not build-fixable. Left as-is by user decision; build does not touch the template body.

**Build prerequisite:** `astrology_service_update` template APPROVED in Meta ✅ (Active 2026-06-08).

**Build notes (2026-06-08, build-pre-demo-minor-fixes-8Jun26):**
- Implemented in WF-41 only (3→4 nodes); WF-50 and the template untouched. jq-on-disk + curl PUT. Backup `archive/backups/6PzJRZsF7k2d9hV7-2026-06-08-18-10.json`.
- **`Load Last Inbound` Postgres node** (v2.6 = project floor, executeQuery, alwaysOutputData=true, cred `Zomqv5wsowQAhdGl`): `SELECT MAX(created_at) AS last_inbound, (MAX(created_at) > NOW() - INTERVAL '24 hours') AS in_window FROM chinmay_astro.messages WHERE user_id=$1 AND direction='inbound'`, queryReplacement `={{ [$json.user.id] }}`. **24h boolean computed in SQL** (timestamptz vs NOW()) → TZ-correct, no n8n-runtime-TZ dependency. 0-row aggregate → NULL → treated as window-CLOSED.
- **`Prepare WhatsApp Message` Code rewrite:** reads window state from `$input.first()` (Postgres) + envelope from the always-run trigger `$('When Executed by Another Workflow')` (post-Postgres `$json` is the query row, not the envelope). in-window → `{messageType:'text', messageContent}` (byte-identical to prior behaviour). out-window → M4-safe sanitize (newlines/tabs→space, collapse 2+ spaces, trim) then ≤850→one template item / >850→`(i/N)` word-boundary split (hard-split giant words) → N items `{messageType:'template', templateName:'astrology_service_update', templateParams:[part], userId, consultationId}`. Defensive `in_window` read (`=== true || === 'true'`) so any non-true → safe template path.
- **DECISION — WF-50 `mode` `once`→`each` (overrode the user's initial mode-'once' pick after verification).** WF-50's entry guard + every internal Code node use `$input.first()` / `return [{json}]`, collapsing N items to the first. A single mode-'once' call passing N parts would have **silently sent only part (1/N)**. mode-'each' runs WF-50 once per item → all N parts delivered in order; in-window (1 item) → one run, identical to before. User flagged this exact risk; verification confirmed it and the override honours their actual requirement (all parts delivered).
- **Verification:** lint hook exit 0; MCP `n8n_validate_workflow` strict `valid:true` 0 errors; Postgres node strict-validate 0 errors; typeVersion floor held (only new type = pg 2.6); window query run against live data (user 40 `consultation_active` @54.4h out-window → routes to template — the exact PDF-15 failure case); sanitize/split logic unit-tested in node (M4-safe, multi-part labels, hard-split, edge cases). Pseudo revised first + stamped `live_reconciled_at=2026-06-08T08:13:51.036Z` (assert-pseudo-fresh FRESH).
- **DEFERRED — live WhatsApp send smoke** (in-window text + out-window template to a real number) NOT run unilaterally (side-effecting external send to a real customer). Recommend running as a coordinated smoke with the user, ideally alongside PDF-16 (failure backstop) so any residual Meta send error is visible.

## PDF-16 — Failed customer-bound sends are invisible to the astrologer

**Status:** 🟢 done
**Started:** 2026-06-09T10:56:19Z
**Completed:** 2026-06-09T11:11:10Z
**Actual tokens:** ~110K (WF-50 .md/.pseudo reads + 18-caller downstream audit + 2 PUTs + MCP strict/per-node validates)
**Actual effort:** ~15 min
**Estimate delta:** on-bucket (planned M ~35K reasoning; raw count inflated by the large WF-50.md read + MCP validate payloads; the build itself was M)
**Owner session:** build-pre-demo-minor-fixes-8Jun26-3
**Priority:** P1 | **Batch:** 10
**Change type:** Structural — single workflow WF-50 (the outbound chokepoint): catch the Meta rejection as data + post an in-channel failure notice via WF-51. (Re-homed from the planned per-caller scope — see Approach redesign below.)
**Workflows:** WF-50 (catch + report) · WF-51 (notice)
**n8n IDs:** `BUVun38WEKb12zg9` (WF-50) · `wlZRK0YxnhP0b2RL` (WF-51)
**Depends on:** PDF-15 (soft — this is the backstop for PDF-15's residual send failures; build close together) · PDF-17 (soft — same WF-34, sequence within Batch 10) — NOTE both deps now moot: the redesign means PDF-16 no longer touches WF-34/WF-41/WF-42, so no same-workflow sibling coupling remains.
**Design gate:** false
**Size:** M
**Estimated tokens:** ~35K (incremental share within Batch 10)
**Pseudo-impact:** yes — revise `WF-50.pseudo` (catch-error + failure-notice branch). No per-caller `.pseudo` edits needed.

**Decision (DD-4):** any customer-bound send Meta rejects must be surfaced to Dr. Chinmay in the consult channel — no silent drops. Admin-tone rule applies: business language, no WF-XX/field jargon ([[feedback_admin_message_tone]]).

**APPROACH REDESIGN — re-homed to WF-50 (2026-06-09, build-time cross-cutting audit + user steer).** The plan scoped this to 3 named callers (WF-41/34/42) on the premise *"WF-50 already returns `success=false`; the callers just ignore it."* Two build-time findings overturned that scope:
- **Caller-count audit (fresh dependency-map):** WF-50 has **18 callers**, ~15 customer-bound (WF-21/22/30/31/32/33/41/42/34/43/44/45/47…). DD-4's literal principle ("*any* customer-bound send") spans all of them, not 3. Patching N receivers is the wrong shape — WF-50 is the single chokepoint every outbound WhatsApp send flows through, so the detect-and-report belongs there once.
- **Audit-vs-reality drift (verified live):** the 3 send nodes (`Send Text/Interactive/Template`) have `onError:null` (default = stopWorkflow) + `retryOnFail:3`. On a real Meta rejection they retry 3× then **throw**, halting WF-50 — `Process Result` never runs, so WF-50 does **NOT** currently return the `success=false` the plan assumed. A caller-side fix would therefore require every one of ~15 callers to set `continueOnFail` on its WF-50 call AND parse a thrown error — strictly messier. The throw→catch→report has exactly one correct home: WF-50.

**Locked design (user-approved 2026-06-09):**
1. **Catch the Meta error** — make the 3 send nodes surface the rejection as data (so `Process Result` computes `success=false`) instead of throwing; keep `retryOnFail:3` for transient errors.
2. **Report** — after `Process Result`, on `success=false`, post a plain-language notice to Dr. Chinmay via WF-51.
3. **Resolve channel** — WF-50 has `phoneNumber` (always) + `userId` (usually), NOT `slack_channel_id`; failure path does `SELECT slack_channel_id FROM chinmay_astro.users WHERE phone_number=$1`.
   - **DD-16a (locked):** no consult channel (pre-form sends — WF-21 welcome / WF-23 pre-form) → **fall back to admin channel `C0A5B0ZE81E`** (chinmay-admin-commands). No silent drops even pre-consult.
   - **DD-16b (locked):** notice fires on **Meta rejections only** (a send Meta refused). The internal `empty_body_dropped` guard path is a caller-bug class, already logged to WF-60 success=false — left untouched (no Slack notice).
- Notice goes via WF-51 (Slack) → no recursion through WF-50.

**Acceptance:** any customer-bound message WhatsApp rejects produces a clear in-channel notice to Dr. Chinmay (consult channel, or admin channel if pre-form); no customer-bound send fails silently; happy-path sends unchanged. Spec DD-4.

**Build summary (2026-06-09, build-pre-demo-minor-fixes-8Jun26-3):**
- **WF-50 only, 18→22 nodes.** jq-on-disk + curl PUT (2 PUTs). Backup `archive/backups/BUVun38WEKb12zg9-2026-06-09-20-59.json`.
- **Catch:** `Send Text/Interactive/Template` nodes set `onError=continueRegularOutput` (retryOnFail×3 preserved) → a persistent Meta 4xx is now emitted as a `{error}` data item, so `Process Result` computes `success=false` instead of the node throwing + halting the workflow (the root the plan missed).
- **Branch:** new `Send Failed?` IF (v2, WF-50 floor) inserted after `Process Result`. TRUE (`success=false`) → `Lookup Consult Channel` (Postgres v2.6 = project floor from sibling WF-41; executeQuery, alwaysOutputData=true, `SELECT slack_channel_id … WHERE phone_number=$1`, queryReplacement reads `$('Process Result')…phoneNumber`; hardened with onError=continueRegularOutput + retry×3 so a DB hiccup still yields an admin-channel notice) → `Build Failure Notice` (Code v2; channelId = row.slack_channel_id ELSE `C0A5B0ZE81E`; business-tone text naming phone + Meta reason) → `Call WF-51 (Failure Notice)` (executeWorkflow v1.2, defineBelow+value:{}) → converge. FALSE → existing logging path.
- **Convergence robustness:** `Build WF-60 Payload (Outbound)` re-pointed from `$input.first()` → `$('Process Result').first()` (always-executed, upstream of the fork) so the WF-60 log carries the real send result on BOTH branches; `Return Status` already read `$('Process Result')`. So the caller still gets the same `{success,messageId,error,phoneNumber,sentAt}` — WF-50 no longer throws on a Meta rejection.
- **Impact analysis:** 18 WF-50 callers; 16 have downstream-of-send logic (admin-notify prep / control-return / 2nd-message). Behavioral delta (caller now continues past a failed send vs. erroring) is benign-to-beneficial in every case; no state-write gated on send success. Return contract unchanged → no caller edit needed.
- **Verify:** lint hook exit 0; MCP strict `valid:true` 0 errors (35 warnings all advisory/pre-existing — typeVersion-floor holds, IF main[1] false-positive "error output", cachedResultName cosmetic); per-node strict on Postgres + executeWorkflow `valid:true` 0 errors/0 warnings; typeVersion diff = only +postgres 2.6 (new type at documented floor); bypass scan clean (no `$('<conditional-node>')` refs); both code nodes `node --check` OK; secrets clean. `WF-50.pseudo` revised pseudo-first (Steps 13–20 + onError notes), stamped `live_reconciled_at=2026-06-09T11:08:46.493Z` (assert-pseudo-fresh FRESH).
- **Lint advisory accepted:** `Call WF-51 (Failure Notice)` upstream is a Code node (`Build Failure Notice`) not a Set v3.4 — consistent with the existing `Build WF-60 Payload`→`Call WF-60` Code→executeWorkflow pattern in this same workflow; Contract-First advisory only.
- **DEFERRED — live Meta-rejection smoke:** forcing a real Meta 4xx (out-of-window / paused-template send to a real number) is a side-effecting external send — bundle with the deferred PDF-15 + PDF-17 coordinated smoke. Multi-part note: with PDF-15's WF-41 mode='each', a multi-part out-window relay that fails would fire one notice per failed part (acceptable; each part genuinely failed).

## PDF-17 — Payment-rejection message unreachable after a long gap

**Status:** 🟢 done
**Started:** 2026-06-09T09:30:00Z
**Completed:** 2026-06-09T10:22:14Z
**Owner session:** build-pre-demo-minor-fixes-8Jun26-2
**Priority:** P1 | **Batch:** 10
**Change type:** Structural — 3 workflows (scope expanded from WF-34-only at build time; see "Scope correction" below). WF-34 send interactive→template; WF-02 new template-button-tap normalizer; WF-00 log-nicety for template taps.
**Workflows:** WF-34, WF-02, WF-00
**n8n IDs:** `se82n3MUQ9xE5aEr` (WF-34) · `PubCsNTOspF3xqXZ` (WF-02) · `JQu1MkK5vgtUCeNO` (WF-00)
**Depends on:** payment-rejection template approval (external, Meta) ✅ · PDF-16 (soft — same WF-34, sequence within Batch 10) · PDF-19 (soft sibling — PDF-17 delivers the shared receiving-side mechanism PDF-19 reuses)
**Design gate:** false
**Size:** S planned → M actual (audit-driven scope expansion to the receiving side)
**Estimated tokens:** ~25K (planned) / ~140K actual (deep live-trace of the inbound filter chain WF-00→WF-01→WF-02 + 3-workflow build + design sign-off rounds)
**Pseudo-impact:** yes — `WF-34.pseudo` (send step interactive→template), `WF-02.pseudo` (new Step 2 normalizer + renumber), `WF-00.pseudo` (button-type parse note). All three stamped FRESH.

**Scope correction (build-time audit, user-steered 2026-06-09):** Plan sized this WF-34-only. Live trace showed the fix is fundamentally a **receiving-side** change, not just a send swap:
- A template quick-reply tap arrives in a DIFFERENT webhook shape (M5) than an interactive `button_reply` — `message.type='button'` with `message.button.{text,payload}`, no `interactive` object. WF-02 `Detect Route` matches taps on `messageType='interactive' && rawMessage.interactive.type='button_reply'`, so an un-normalized template tap would mis-route as unexpected media (`EXISTING_NON_TEXT`).
- **User steer (do NOT attach a button component to the outgoing template call):** the approved template self-renders its button, so WF-50 stays UNCHANGED. The "template-button → internal-action-id" conversion is a receive-side map keyed on the button label.
- **Filter-placement constraint (user):** the conversion must NOT run for red-flagged-country / blocked traffic. WF-01 applies country (+91/+61 only) + blocked + opted-out filters BEFORE WF-02, so the normalizer was placed in WF-02 (post-filter), between `Validate Inputs` and `Detect Route`.

**Build summary (2026-06-09):**
- **WF-34** `Prepare Rejection Message` (Code) — rewritten to emit `{messageType:'template', templateName:'payment_rejection', templateParams:[], userId, consultationId}`. No button component (template self-renders it). Fixed-body template ⇒ no params. Backup `archive/backups/se82n3MUQ9xE5aEr-2026-06-09-09-49.json`. MCP strict valid:true 0 errors. JS-OK.
- **WF-02** new `Normalize Template-Button Tap` Code node (tv2, floor) inserted `Validate Inputs → Normalize → Detect Route` (23→24 nodes). POST-FILTER. Maps approved button labels → internal ids via BUTTON_MAP {"Payment Completed"→payment_completed (PDF-17); "Leave Feedback"→btn_feedback, "Book Again"→btn_rebook, "Done, Thanks."→btn_done (PDF-19, pre-loaded/inert)}; sets messageType='interactive', messageContent=id, synthesizes `rawMessage.interactive.button_reply` so Detect Route + all downstream are UNCHANGED. Non-button msgs pass through. Backup `archive/backups/PubCsNTOspF3xqXZ-2026-06-09-09-46.json`. MCP strict valid:true 0 errors. Consumer-contract (Step 6c): Route Switch → Call WF-32/WF-43 are direct + passthrough trigger ⇒ normalized envelope reaches the handlers verbatim. JS-OK.
- **WF-00** `Parse WhatsApp Message` (Code) — added `case 'button'` so a template tap is logged by its label (button.text) not `[BUTTON]`; keeps messageType='button' (WF-02 normalizes post-filter). Backup `archive/backups/JQu1MkK5vgtUCeNO-2026-06-09-09-42.json`. Lint advisory-only (Step 5g false-positives on internal code comments). JS-OK.
- **WF-50:** UNCHANGED (template self-renders its button — confirmed `Prepare Template Message` already supports body-only templates; no button-component support needed).
- Lint clean (advisory-only across all three); typeVersion floor held (only new node = Code tv2). All three `.pseudo` revised pseudo-first + stamped `live_reconciled_at` = post-PUT updatedAt (assert-pseudo-fresh FRESH).

**DEFERRED — live WhatsApp smoke:** an actual out-of-window rejection send + a real "Payment Completed" template tap (to confirm the exact Meta inbound field/value the label-map keys on, and end-to-end retry routing). NOT run unilaterally (side-effecting external send). Run coordinated with the user, bundled with the PDF-15 + PDF-16 smoke.

**Decision (DD-E / DD-1):** fixed-content message → **always a template**, one code path, no window branching. Free in-window (M2), cheap outside, always deliverable — exactly how payment **approval** already works (`consultation_activated`). The new **payment-rejection** utility template carries the fixed rejection copy + retry affordance. The retry button becomes a template quick-reply → its tap arrives in the M5 template shape (the inbound handler that processes the retry must accept it — verify at build whether this reuses PDF-19's dual-shape handling or is a separate tap).

**Meta grounding:** M2 (free in-window) · M5 (template quick-reply tap shape). See header grounding block for URLs.

**Approved template structure — `payment_rejection` (verified live 2026-06-08T07:52:58Z, lang `en`):**
- No header, no body vars (fully fixed). Body: *"Sorry, but we couldn't verify your payment. Please check the details and try again.\n\nPayment Instructions:\n- Amount: ₹500\n- Please send via GPay / PhonePe / any UPI app to +91-9653240263 (Chinmay Mujumdar)\n\nAfter payment, tap the button below."*
- 1 quick-reply button (title *"Payment Completed"*, index 0).
- **Send payload:** `components:[{type:"button",sub_type:"quick_reply",index:"0",parameters:[{type:"payload",payload:"payment_completed"}]}]`, `language:{code:"en"}`. **Set payload = `payment_completed`** so the existing handler matches (button title "Payment Completed" — no ✓ — is cosmetic; match on payload, not title). The retry tap now arrives in the **M5 template-tap shape** — verify the payment_completed inbound handler accepts it (same dual-shape concern as PDF-19).

**Acceptance:** a payment rejection always reaches the customer with a way to retry, regardless of their 24h window; behaviour consistent every time. Requires the approved payment-rejection template. Spec DD-1.

## PDF-18 — Passive, non-blocking window-closing nudge (first scheduled job)

**Status:** 🟢 done
**Started:** 2026-06-09T11:45:25Z
**Completed:** 2026-06-09T11:52:17Z
**Owner session:** build-pre-demo-minor-fixes-8Jun26-4
**Actual tokens:** ~75K (greenfield design + `messages`/`users` schema discovery + transport-scoping investigation + SQL dry-run + MCP strict/per-node validates dominated; the 4-node build itself was ~M)
**Actual effort:** ~7 min (build, after the design Q&A + context-gathering that preceded the in-progress stamp)
**Estimate delta:** on-bucket (planned M ~40K; ~75K actual — schema discovery + the WA-scoping correctness investigation + MCP validate payloads inflated the raw count; the build was M-band)
**Priority:** P1 | **Batch:** 11
**Change type:** Workflow-Create — NEW workflow **WF-75** (`YnxDRcnCugnpGY0n`), project's first scheduled/background job: Schedule trigger (every 2h) → Postgres scan → WF-51 advisory. Greenfield, pseudo authored in-batch.
**Workflows:** WF-75 (new) · WF-51 (`wlZRK0YxnhP0b2RL`)
**n8n IDs:** `YnxDRcnCugnpGY0n` (WF-75, created 2026-06-09) · `wlZRK0YxnhP0b2RL` (WF-51)
**Depends on:** PDF-15 (soft — shares the `messages` `MAX(inbound)` window-state source; lock the source once, reuse)
**Design gate:** false
**Size:** M
**Estimated tokens:** ~40K
**Pseudo-impact:** yes — greenfield; author `WF-7x.pseudo` IN this batch (co-located pseudo-first, not deferred).

**Decision (DD-F) — locked algorithm:**
1. Schedule trigger — **every 2h**.
2. Postgres: `status='consultation_active'` AND customer's last inbound (`MAX(created_at) WHERE direction='inbound'`) is **18–24h old** (`<= now−18h AND >= now−24h`) AND **unanswered** (`last_inbound > last_outbound`).
3. Each match → advisory to `slack_channel_id` via WF-51: *"⏳ Heads-up: [Customer]'s free-reply window closes in ~Nh (last message [time]). Reply within the window to answer for free in plain text — after it closes, replies go out as a template. Ignore this if you're done."*
4. No customer contact, no auto-reply, no state write, never blocks.

**Why repeat 18→24h (not single-fire):** user wants a persistent reminder that doesn't get lost (~3–4 nudges at 2h cadence across the 18→24h stretch). Self-terminates two ways: the moment Dr. Chinmay replies (`unanswered` clause flips false) and at 24h (window closed → relay goes template/charged → nudge has no purpose; confirmed it must stop there).
**Build dependency to verify live:** the `unanswered` check needs Dr. Chinmay's outbound relay logged to `messages` with `direction='outbound'` (WF-60 logs Slack-inbound = astrologer→customer, so expected to hold — confirm at build).

**Acceptance:** when a customer's window is close to expiring during an open consultation and Dr. Chinmay hasn't replied, a clear advisory appears in that consult channel; it never blocks, never auto-replies, harmless to ignore, stops at 24h or on reply. Spec DD-5.

**Build summary (2026-06-09, build-pre-demo-minor-fixes-8Jun26-4):**
- **NEW workflow WF-75 `YnxDRcnCugnpGY0n`, 4 nodes, created via n8n API (POST) — INACTIVE.** Greenfield pseudo-first: `docs/pseudocode/WF-75.pseudo` authored before the JSON, stamped `live_reconciled_at=2026-06-09T11:49:38.147Z` (assert-pseudo-fresh FRESH). Registered in `workflow-registry.md` (WF-7x table + id-map). Create body authored on disk (SQL + Code never through a shell var).
- **Topology:** `Every 2 Hours` (scheduleTrigger v1.3 — project's FIRST schedule trigger; tV floored to 1.3 per user sign-off, no prior precedent) → `Load Window-Closing Consults` (Postgres v2.6, executeQuery, alwaysOutputData=true, retryOnFail×3, cred `Zomqv5wsowQAhdGl`) → `Build Nudge Payload` (Code v2) → `Call WF-51 (Send Nudge)` (executeWorkflow v1.2, mode=**each**, canonical __rl shape + cachedResultName).
- **WA-scoped window query (build correction, user-approved 2026-06-09):** one scan, `JOIN LATERAL` aggregate per user — `last_inbound = MAX(created_at) FILTER (direction='inbound' AND message_type IN ('text','interactive'))`, `last_outbound_wa = MAX(... direction='outbound' AND message_type IN ('text','interactive','template'))`. WHERE `status='consultation_active' AND slack_channel_id IS NOT NULL AND last_inbound BETWEEN now-24h AND now-18h AND (last_outbound_wa IS NULL OR last_inbound > last_outbound_wa)`. 24h/18h boundaries in SQL (TZ-correct). **WA-scoping is the key fix vs the planned naive `direction='inbound'`:** the `messages` log records Dr. Chinmay's Slack typing as `inbound/slack_text` and this workflow's own nudge as `outbound/slack_text` — scoping to WhatsApp message_types keeps the astrologer's Slack typing from masquerading as customer inbound AND stops the nudge self-disabling after one fire (so it repeats ~3–4× across 18→24h per DD-F). `hours_until_close` computed for the message copy.
- **Code node** maps each row → `{channelId, messageText, userId, consultationId}`; returns `[]` on the empty 0-row aggregate so Call WF-51 fires 0 times (no spurious nudge). Message copy per DD-F, admin-tone, business language.
- **Verify:** SQL dry-run against live (parses; returns `[]` now — user 40's last WA inbound is ~81h ago, correctly outside the 18–24h band; band logic confirmed). MCP `n8n_validate_workflow` strict `valid:true` 0 errors (3 advisory: Code-can-throw generic, executeWorkflow tV-1.2-floor intentional, generic add-error-handling). Per-node strict on Postgres + executeWorkflow `valid:true` 0 errors/0 warnings. `node --check` on the Code node OK. lint-workflows.py: 1 advisory (Contract-First Code→executeWorkflow upstream — ACCEPTED: per-item interpolation + 0-row→`[]` need real JS; identical to WF-50 `Build Failure Notice`→Call WF-51 and WF-51 `Build WF-60 Payload`→Call WF-60 precedent). Secrets scan 0. Exported `workflows/YnxDRcnCugnpGY0n.json`.
- **Adjacent finding logged (followups.md):** PDF-15's WF-41 `Load Last Inbound` uses the looser, non-WA-scoped `direction='inbound'` — latent window-skew from Slack-inbound rows. NOT changed here (PDF-15 shipped + verified); OPEN for user triage, candidate to fold into the deferred coordinated smoke.
- **DEFERRED (needs user):** (1) **Activation** — WF-75 left INACTIVE; activating a never-smoked scheduled job + the (2) **live match-path smoke** (synthetic 18–24h-old WA inbound → real Slack nudge delivered to a consult channel, then verify repeat + self-terminate on reply/at-24h) are side-effecting and to be run coordinated with the user — bundle with the deferred PDF-15/16/17/19 smoke. The 0-match (no-spurious-nudge) path is proven by the live SQL dry-run.

## PDF-19 — Consultation-close prompt unreachable after a long gap

**Status:** 🟢 done
**Started:** 2026-06-09T11:13:00Z
**Completed:** 2026-06-09T11:18:57Z
**Owner session:** build-pre-demo-minor-fixes-8Jun26-3
**Actual tokens:** ~45K (WF-42 .md/.pseudo + WF-02/WF-00 normalizer verification reads + 2 PUTs)
**Actual effort:** ~6 min
**Estimate delta:** on-bucket (planned M ~35K; shrunk to single-node swap by PDF-17's pre-built receiving side, raw count near plan)
**Priority:** P2 | **Batch:** 12
**Change type:** Structural — WF-42 Consultation Closer (`fx70vqyJtRdF2DgR`) interactive 3-button → always-template; post-close button-tap handler accepts both webhook shapes.
**Workflows:** WF-42 · post-close button-tap handler (pinpoint live at build — WF-43 / inbound router area)
**n8n IDs:** `fx70vqyJtRdF2DgR` (WF-42)
**Depends on:** `consultation_closed_feedback` template review/rewrite + approval (external, Meta) · PDF-17 (soft sibling — reuses PDF-17's always-template send shape) · constraint: must preserve PDF-11 (button re-attach) + PDF-14 (time-neutral copy), both done
**Design gate:** false
**Size:** M
**Estimated tokens:** ~35K
**Pseudo-impact:** yes — `WF-42.pseudo` send step + the button-tap handler's `.pseudo` (new template-tap shape).

**⚡ Receiving side PRE-DELIVERED by PDF-17 (2026-06-09) — PDF-19 reduced to the WF-42 send swap.** PDF-17 built the shared template-button-tap handling that PDF-19's constraint (a) needs, and pre-loaded PDF-19's three button labels:
- **WF-00** (`Parse WhatsApp Message`) already recognises the `button` (template quick-reply) inbound type.
- **WF-02** (`Normalize Template-Button Tap`, post-filter) already maps `"Leave Feedback"→btn_feedback`, `"Book Again"→btn_rebook`, `"Done, Thanks."→btn_done` and reshapes the tap to the interactive `button_reply` form → routes to POST_CONSULT_TEXT (WF-43) exactly like today's interactive close buttons. These map entries are LIVE but inert until WF-42 sends the close as a template.
- **So PDF-19's remaining work = WF-42 send (interactive 3-button → `consultation_closed` template) ONLY.** No separate post-close dual-shape handler is needed (it's done); just verify the 3 labels in the approved `consultation_closed` template EXACTLY match the WF-02 BUTTON_MAP keys (`"Leave Feedback"` / `"Book Again"` / `"Done, Thanks."`) — a label mismatch is the one thing that would break the map. Confirm at the deferred live smoke.

**Decision (DD-E / DD-1 + M5):** close prompt → **always a template** so it always arrives regardless of the 24h window (same single-path approach as PDF-17). Two locked constraints:
- **(a) Dual button-shape (M5), NOT two sets of buttons.** All **3** quick-reply buttons stay (Leave Feedback / Book Again / Done) with the same ids/wording. A *template* quick-reply tap arrives in a different webhook shape than the current interactive `button_reply` — **handled by the shared WF-02 normalizer PDF-17 added** (see the PRE-DELIVERED note above): the normalizer converts the template tap to the interactive `button_reply` form so the existing post-close handler (WF-43) needs no change, and the interactive shape (payment-completed, REBOOK from other flows) is untouched.
- **(b) Preserve the post-close experience** fixed earlier this sprint — only the close prompt itself becomes a template; everything after the customer's first tap is the normal in-window flow (PDF-11 buttons stay available, PDF-14 time-neutral copy), unchanged.
- Rewrite the existing **unused** `consultation_closed_feedback` template (0 sends, body mismatched) to match the current close copy + carry all 3 quick-reply buttons.

**Meta grounding:** M5 template quick-reply tap shape ([template components](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/components)) · M2 free in-window.

**Approved template structure — `consultation_closed` (verified live 2026-06-08T07:52:58Z, lang `en`):**
- Header: TEXT (fixed, no var) — *"Your consultation is closed now."*
- Body (`{{1}}`=name): *"✨ Your consultation with Dr. Chinmay is complete, {{1}}!\n\nFor any follow-ups, either choose below or email chinmay_astro@gmail.com if you need anything we can't help with right now."*
- Footer (fixed): *"Regards, Chinmay Astro"*
- 3 quick-reply buttons: index 0 *"Leave Feedback"*, index 1 *"Book Again"*, index 2 *"Done, Thanks."*
- **Send payload:** body param `{{1}}`=user name; buttons `[{type:"button",sub_type:"quick_reply",index:"0",parameters:[{type:"payload",payload:"btn_feedback"}]},{…index:"1"…payload:"btn_rebook"},{…index:"2"…payload:"btn_done"}]`, `language:{code:"en"}`. **Set payloads `btn_feedback`/`btn_rebook`/`btn_done`** so the existing post-close handler matches (button titles are cosmetic; "Done, Thanks." vs old "Done, thanks" is irrelevant — match on payload). The 3 taps now arrive in the **M5 template shape** → that is exactly the dual-shape parse this item adds.
- Note: the template ADDS a header + footer the current interactive close message doesn't have — accepted (user-authored, trimmed for Utility approval); PDF-11/PDF-14 post-tap experience is unchanged.

**Acceptance:** closing a consultation always delivers the wrap-up prompt with all 3 options working, regardless of the 24h window; the existing post-close experience (buttons available, time-neutral copy) is unchanged. Spec DD-1 §5.

**Build summary (2026-06-09, build-pre-demo-minor-fixes-8Jun26-3):**
- **WF-42 only, 7 nodes unchanged — single-node swap.** `Prepare Feedback Message` (Code) rewritten from the interactive 3-button payload to a template send: `{ phoneNumber, messageType:'template', templateName:'consultation_closed', templateParams:[user.name], userId:user.id, consultationId:user.current_consultation_id }`. jq-on-disk + curl PUT. Backup `archive/backups/fx70vqyJtRdF2DgR-2026-06-09-21-15.json`.
- **Receiving side confirmed pre-built (the PDF-19 build pre-check, state.md line 609):** read live WF-02 `Normalize Template-Button Tap` — it keys on `raw.button.text` (label), and its `BUTTON_MAP` keys `'Leave Feedback'`/`'Book Again'`/`'Done, Thanks.'` EXACTLY match the approved `consultation_closed` template button labels. WF-00 `Parse WhatsApp Message` already logs the `button` (M5) shape by label. So a template tap → WF-00 (log by label) → WF-02 (label→btn_*, reshape to interactive button_reply) → WF-43 routes UNCHANGED. No WF-50 / WF-43 / WF-00 / WF-02 edit needed.
- **WF-50 unchanged** — `Prepare Template Message` sends body-only (`templateParams`→{{1}} body var = customer name); the template self-renders its baked quick-reply buttons (same pattern as PDF-17's payment_rejection). M4-safe (the only param is a name).
- **Verify:** lint hook exit 0; MCP strict `valid:true` 0 errors (11 warnings all pre-existing/advisory — typeVersion floor holds, cachedResultName cosmetic, DB-error-handling advisories on the pre-existing Close/Update UPDATEs which should halt on failure). Consumer-contract (6c): WF-50 template-variant entry guard satisfied (templateName string + templateParams array). `node --check` OK. Caught + fixed mid-build: the MCP `{{...}}`-in-Code-node validator hard-flagged a literal `{{1}}` in a *code comment* → reworded the comment, re-PUT clean. `WF-42.pseudo` revised pseudo-first (Steps 4–5 + Outputs; also corrected two pre-existing pseudo drifts — "two buttons"→three, "Chinmay"→"Dr. Chinmay") and stamped `live_reconciled_at=2026-06-09T11:17:01.248Z` (assert-pseudo-fresh FRESH).
- **DEFERRED — live close→template-tap smoke:** an actual CLOSE → `consultation_closed` template delivery + a real button tap end-to-end (confirms the M5 inbound label value the WF-02 map keys on). Side-effecting external send — bundle with the deferred PDF-15 + PDF-16 + PDF-17 coordinated smoke.

## PDF-20 — Relay/nudge window read must be WhatsApp-scoped (transport), not all-inbound

**Status:** 🟢 done
**Started:** 2026-06-09T20:57:24Z
**Completed:** 2026-06-09T21:00:02Z
**Owner session:** build-pre-demo-minor-fixes-8Jun26-4
**Actual tokens:** ~55K (live data cross-tab + transport-vs-message_type discriminator analysis + 2 jq+PUT + strict/per-node validates)
**Actual effort:** ~10 min
**Estimate delta:** n/a (emergent — not pre-sized)
**Priority:** P1 | **Batch:** 13
**Change type:** Structural / non-parametric — single-node SQL on WF-41 (`6PzJRZsF7k2d9hV7`) + WF-75 (`YnxDRcnCugnpGY0n`); alters the in-window/out-window branch decision (window data contract) → pseudo-first. **Emerged during PDF-18 build** (resolves the adjacent finding logged in followups.md 2026-06-09). Built **Mode B** (inline build-workflow discipline — the WA-scoping pattern just executed in PDF-18, no Skill reload).
**Workflows:** WF-41, WF-75
**n8n IDs:** `6PzJRZsF7k2d9hV7` (WF-41) · `YnxDRcnCugnpGY0n` (WF-75)
**Depends on:** PDF-15 (the WF-41 node this corrects) · PDF-18 (the WF-75 node; both made consistent)
**Design gate:** false
**Pseudo-impact:** yes — `WF-41.pseudo` (window-source note + Step 2 query) + `WF-75.pseudo` (Notes + Step 2 query) revised + re-stamped FRESH.

**Root cause (verified live 2026-06-09):** `chinmay_astro.messages` logs Dr. Chinmay's own Slack typing as `direction='inbound'` `message_type='slack_text'` (`metadata.transport='slack'`), and this workflow's own nudge / relay-side as `direction='outbound'` `slack_text`. WF-41's `Load Last Inbound` (built by PDF-15) read `MAX(created_at) WHERE direction='inbound'` with **no transport filter** → a Slack-inbound row can become the customer's apparent last inbound → window reads freshly-open off the astrologer's message while the customer has actually been silent >24h → relay sends free-form → Meta rejects out-of-window → silent non-delivery (the exact failure PDF-15 exists to prevent). Live proof: user 42 (`consultation_active`) had `MAX(inbound any)=2026-06-09T20:16` (Slack) vs `MAX(inbound wa)=2026-06-09T08:59` — an ~11h skew; as the WA inbound ages past 24h before the Slack row, user 42 enters the failure zone.

**Fix:** scope the window read to WhatsApp via `metadata->>'transport'='wa'` (NOT a `message_type IN (...)` allow-list — `transport` is the correct discriminator because the 24h window re-opens on ANY customer WhatsApp inbound incl. media, which a message_type allow-list would under-count). Applied to BOTH:
- **WF-41 `Load Last Inbound`:** `… AND direction='inbound' AND metadata->>'transport'='wa'`. Verified live: user 42 now reads `last_inbound=08:59` (the real WA message), not the 20:16 Slack row.
- **WF-75 `Load Window-Closing Consults`:** both FILTER halves switched from `message_type IN (…)` to `metadata->>'transport'='wa'` (inbound + outbound), making it identical to WF-41's discriminator and robust to future media inbound. Functionally identical on current data (transport↔message_type is a verified 1:1, `transport` non-null on all rows — WF-60 defaults it 'wa').

**Build:** jq-on-disk + curl PUT ×2 (new query strings spliced via `jq --rawfile` from disk — never through a shell var). Backups `archive/backups/6PzJRZsF7k2d9hV7-2026-06-10-06-57.json` + `archive/backups/YnxDRcnCugnpGY0n-2026-06-10-06-57.json`. Both new queries dry-run against live before PUT (parse + correct behaviour confirmed).

**Verify:** WF-41 updatedAt=2026-06-09T20:59:50.788Z, WF-75 updatedAt=2026-06-09T21:00:02.547Z. MCP strict `valid:true` 0 errors both (warnings all pre-existing/advisory — WF-50/Call-WF-51 tV-1.2 floor, cosmetic cachedResultName, pre-existing Code-node + DB-retry advisories; none introduced). Per-node strict on the WF-41 Postgres node `valid:true` 0 err/0 warn. lint: 1 advisory each (pre-existing/accepted Contract-First Code→executeWorkflow — out of this change's scope). Both `.pseudo` re-stamped + assert-pseudo-fresh FRESH. Secrets clean.

**Acceptance:** the relay in/out-window decision (WF-41) and the nudge window scan (WF-75) key only on the customer's WhatsApp messages; the astrologer's Slack typing and the nudge's own Slack post never skew either read. **Live confirmation that the skew is gone for an at-risk user (42) bundled with the deferred PDF-15/16/17/18/19 coordinated smoke** (which will now exercise the corrected WF-41/WF-75).

## PDF-21 — Out-window relay template repointed to `astrology_service_update_v2`

**Status:** 🟢 done
**Started:** 2026-06-10T10:30:00Z
**Completed:** 2026-06-10T10:32:29Z
**Owner session:** build-pre-demo-minor-fixes-8Jun26-4
**Actual tokens:** ~25K (single-constant swap + grep-all-callsites + strict/node-check verify)
**Actual effort:** ~3 min
**Estimate delta:** n/a (emergent — not pre-sized)
**Priority:** P1 | **Batch:** 13
**Change type:** Surgical — single named constant in WF-41 (`6PzJRZsF7k2d9hV7`) `Prepare WhatsApp Message` Code node. **Pseudo-impact: yes** (the template's documented external interface/copy changed) — `WF-41.pseudo` references + structure note revised + re-stamped FRESH. Built Mode B (inline).
**Workflows:** WF-41
**n8n IDs:** `6PzJRZsF7k2d9hV7`
**Depends on:** PDF-15 / PDF-20 (same out-window relay path) · external: `astrology_service_update_v2` approved in Meta
**Design gate:** false

**Reason (user, 2026-06-09):** the original `astrology_service_update` had a Meta **bold-rendering bug** (the split `*` on the body's lines 1–2 rendered as literal asterisks — the known Meta-UI authoring quirk noted at PDF-15 build). User retired it and created a **new** template `astrology_service_update_v2` with corrected copy. WF-41's out-window send must point at the new name.

**`astrology_service_update_v2` structure (from user screenshot, lang `en`):** Header TEXT fixed *"Follow-up on your consultation"*; Body *"\*Dr. Chinmay has responded to your message:\* {{1}}"* + blank line + *"Thanks, Chinmay Astro"* — **one positional body var `{{1}}` = the sanitized reply** (variable type "Number" = positional `{{1}}`, not a numeric value); no footer var, no buttons. The bold now renders correctly (preview confirms). **Send-payload contract is identical to the old template** (single body text param, lang `en`) → only the template NAME moved.

**Build:** grep confirmed `astrology_service_update` had exactly one functional call site (WF-41 `Prepare WhatsApp Message`, the `const TEMPLATE` constant — the `.md` is a regenerable projection). jq `gsub` swap of the constant → curl PUT. Backup is the PDF-20 backup taken minutes earlier (`archive/backups/6PzJRZsF7k2d9hV7-2026-06-10-06-57.json`, pre-PDF-20/21).

**Verify:** WF-41 updatedAt=2026-06-10T10:31:36.587Z; constant now `'astrology_service_update_v2'` (1 occurrence). MCP strict `valid:true` 0 errors (7 warnings all pre-existing/advisory). `node --check` OK. lint 1 advisory (pre-existing Contract-First). `WF-41.pseudo` re-stamped `live_reconciled_at=2026-06-10T10:31:36.587Z` (FRESH). Secrets clean.

**Acceptance:** an out-window relay reply is delivered via `astrology_service_update_v2` (correct bold rendering, new copy), `{{1}}` = the sanitized reply. **External prerequisite:** `astrology_service_update_v2` must be APPROVED/Active in Meta before the send works (Meta 132000/132001 on a name/lang/param mismatch). Live confirmation bundled with the deferred PDF-15/16/17/18/19 coordinated smoke — the smoke MUST verify the v2 name + `en` lang + single body param against Meta's approved structure before the out-window send.

## Batch 14 — PDF-23 + PDF-24 server-side monitoring + shared alert helper (P1) — NEXT ACTIONABLE

- **Items:** 2 (PDF-23 infra health — CARRIER of the shared alert helper · PDF-24 credential probes)
- **Description:** VPS-local cron-driven safety nets, n8n-independent. **PDF-23** (build first — carrier): a check every few minutes for {core container down, DB unresponsive, disk past threshold, `cloudflared` inactive}; establishes the shared **Slack-incoming-webhook alert helper** (DD-G) with **repeat-suppress** (alert once, re-alert only after a sustained-failure interval) so a multi-hour outage doesn't flood. **PDF-24** reuses that helper: scheduled credential probes — WhatsApp token once daily, Gemini key twice daily (00:00 + 12:00 IST) — alerting the moment a credential is invalid/expired/over-quota (closes the Gemini-key silent-failure incident class). Build PDF-23 first so PDF-24 inherits the helper.
- **Change type:** Infra — VPS cron + shell/script (NOT n8n workflows); shared Slack-webhook alert helper.
- **Pseudo-impact:** no (both) — VPS-local scripts, not n8n workflows; record `pseudo: N/A — VPS-local, not an n8n workflow` at build.
- **External prerequisite:** a Slack incoming-webhook URL provisioned (separate from the n8n Slack app) for DD-G.
- **Estimated size:** M
- **Estimated tokens:** ~55K (PDF-23 ~35K incl. shared-helper + repeat-suppress design; PDF-24 ~20K reusing the helper)

## Batch 15 — PDF-26 automated PostgreSQL backups, validate-before-rotate + offsite (P1)

- **Items:** 1 (PDF-26)
- **Description:** VPS cron backups per DD-H. Hourly `pg_dump | gzip` to mounted storage with **validate-before-rotate** (gunzip → temp restore / sample-row check → supersede previous good copy only on success; on failure keep prior good + alert). Offsite to Google Drive **twice daily (00:00 + 12:00 IST)** via rclone, rolling **7-day** retention. Documented restore path (on-VPS-latest or offsite snapshot). All failures (dump / validate / push) alert via the DD-G Slack-webhook helper (reuses PDF-23's helper).
- **Change type:** Infra — VPS cron + pg_dump/gzip + rclone (NOT an n8n workflow).
- **Pseudo-impact:** no — VPS-local, not an n8n workflow.
- **External prerequisite:** rclone configured on the VPS with a Google-Drive remote; PDF-23's alert helper available (soft).
- **Estimated size:** M
- **Estimated tokens:** ~40K (validate-before-rotate temp-restore logic + retention + restore-doc → top-of-M)

## Batch 16 — PDF-25 build WF-70 in-service health + failure-rate monitor (P2)

- **Items:** 1 (PDF-25) — builds the long-planned WF-70 (registry `🔵 Build Fresh`, currently unbuilt)
- **Description:** New scheduled n8n workflow (WF-70) for business-level signals only n8n can see from the inside: a real DB query succeeds (not just "port answers"), the WhatsApp API responds to a status call, and executions are not silently failing above a baseline rate (catches an error-swallowing node). Alerts via n8n's own Slack path (acceptable — WF-70 only runs when n8n is up; up/down coverage is PDF-22/23's job). Complements, does not replace, PDF-22/23.
- **Greenfield note:** author `WF-70.pseudo` **in this batch** (co-located pseudo-first per plan-sprint §3d greenfield rule — do NOT defer pseudo to a later batch). Mirror the WF-75 build pattern (PDF-18): scheduleTrigger → Postgres + HTTP probes → failure-rate query → conditional WF-51 alert.
- **Change type:** Workflow-Create — NEW WF-70 (Schedule trigger + Postgres query + WhatsApp status HTTP call + execution failure-rate query + alert).
- **Pseudo-impact:** yes (greenfield — pseudo authored in-batch).
- **External prerequisite:** SSH tunnel open for the n8n build.
- **Estimated size:** M
- **Estimated tokens:** ~35K

## Batch 17 — PDF-22 outside-in reachability ping — Claude Cloud routine (P2)

- **Items:** 1 (PDF-22) — the ONLY check that runs OFF the VPS
- **Description:** A minimal Claude Cloud routine, every 2h, that reaches the public service URL and alerts the admin if unreachable — covering the one case all VPS-local checks structurally cannot (the host being completely dead). Scope deliberately minimal: an outside-in "is it alive?" ping. Alert via the same swappable Slack-incoming-webhook destination (DD-G). Low cadence keeps it well within routine usage limits / cost.
- **Constraints:** Claude routines run in Anthropic's cloud, cannot SSH, reach the VPS only over the public URL; min interval 1h (2h chosen); runs draw on the Claude subscription budget with a per-account daily cap (claude.ai/code/routines).
- **Change type:** Infra — Claude Cloud routine config (NOT an n8n workflow, NOT VPS).
- **Pseudo-impact:** no — Claude routine config.
- **External prerequisite:** the routine must deliver to the DD-G Slack webhook — confirm routines permit outbound HTTP; otherwise attach a Slack/webhook connector at claude.ai/customize/connectors (none attached today).
- **Estimated size:** XS
- **Estimated tokens:** ~12K

## PDF-22 — Outside-in reachability check (Claude Cloud routine)

**Status:** ⬜ pending
**Owner session:** —
**Priority:** P2 | **Batch:** 17
**Change type:** Infra — Claude Cloud routine (off-VPS); the only check not on the VPS. Not an n8n workflow.
**Workflows:** — (none; Claude Cloud routine)
**Depends on:** PDF-23 (soft — reuses the same swappable Slack incoming-webhook destination, DD-G; independent execution surface, non-blocking)
**Design gate:** false
**Size:** XS
**Estimated tokens:** ~12K
**Pseudo-impact:** no — Claude routine config, not an n8n workflow.

Every other health check runs on the VPS, so none can report "the whole VPS / tunnel / n8n is down" — a dead host can't alert on its own death. This routine runs every 2h in Anthropic's cloud, hits the public service URL, and alerts via the DD-G Slack webhook if unreachable. Minimal by design — just an "is it alive?" ping; all other checks stay on the VPS.

**Constraints:** cloud-only (no SSH; public URL only); min interval 1h (2h chosen); draws on the Claude subscription budget; per-account daily routine-run cap (claude.ai/code/routines).
**External prerequisite:** routine must reach the DD-G webhook (confirm outbound HTTP allowed; else wire a connector at claude.ai/customize/connectors — none attached today).
**Acceptance:** if the public service URL is unreachable, the admin is alerted within one 2-hour cycle, even when the VPS is fully down.

## PDF-23 — Server-side infrastructure health checks (carrier of shared alert helper)

**Status:** 🟢 done
**Started:** 2026-06-20T05:59:50Z
**Completed:** 2026-06-20T06:11:42Z
**Actual tokens:** ~40K (VPS recon + script authoring + live alert-cycle verification)
**Actual effort:** ~12 min
**Estimate delta:** on-bucket (planned M ~35K, actual ~40K)
**Pseudo:** N/A — VPS-local scripts, not an n8n workflow
**Owner session:** build-pre-demo-minor-fixes-20Jun26
**Priority:** P1 | **Batch:** 14

**Build summary (2026-06-20):** VPS-local cron monitor, n8n-independent. Authored `scripts/monitoring/{alert.sh,health-check.sh,extract-secrets.sh,README.md}` (committed, secret-free); deployed to `/mnt/chinmay-astro-data/monitoring/`. `alert.sh` = shared DD-G helper: `send_alert`/`clear_alert` POST to Slack `chat.postMessage` (channel C0A5B0ZE81E) with the existing n8n Slack bot token (extracted once by `extract-secrets.sh` → root-600 `secrets.env`, read independently of n8n). Repeat-suppress 6h (`state/<key>.alerted`). `health-check.sh` checks: 4 core containers running, Postgres `SELECT 1`, root disk <85%, `cloudflared` systemd active. **Cron: `0 * * * *` (hourly, per user choice — note: detection latency up to ~1h, a deliberate trade-off vs the task's "within minutes" wording).** Host is UTC. **Live-verified:** Slack post `ok:true`; healthy run silent + no state; ghost-container negative test → alert fired once → 2nd run suppressed (timestamp unchanged) → `clear_alert` posted recovery + removed state. jq/curl/docker/systemctl all present on host.
**Acceptance:** ✅ {container down / Postgres unresponsive / disk ≥85% / cloudflared inactive} → ONE repeat-suppressed alert to chinmay-admin-commands over an n8n-independent path; detection cadence hourly (user-chosen).

**DD-G refinement (2026-06-20, user-directed):** alert channel = **reuse the existing n8n Slack bot token via `chat.postMessage`** (NOT a new incoming-webhook). Token extracted ONCE from n8n's encrypted credential store (n8n CLI `export:credentials --decrypted`) into a root-600 `/mnt/chinmay-astro-data/monitoring/secrets.env`, read independently of n8n at alert time (so the alert path still fires when n8n itself is down — confirmed `.env.production` holds only DB creds + `N8N_ENCRYPTION_KEY`, no Slack/Gemini/WA tokens). Alerts post to `chinmay-admin-commands` (C0A5B0ZE81E). The "swappable destination" is now the channel id + token in secrets.env. Locked params: health-check **hourly**, disk threshold **85%**, repeat-suppress **6h**.
**Layout:** `/mnt/chinmay-astro-data/monitoring/` (root-only, mounted storage) — `secrets.env` (600, VPS-only, never committed), `alert.sh` (shared DD-G helper), `health-check.sh` (PDF-23), `cred-check.sh` (PDF-24), `state/` (repeat-suppress). Committed copies (secrets stripped) → repo `scripts/monitoring/`.
**Change type:** Infra — VPS cron + shell/script; establishes the shared n8n-independent Slack-webhook alert helper. Not an n8n workflow.
**Workflows:** — (VPS-local; no n8n workflow)
**Depends on:** — (CARRIER — DD-G: this item creates the shared alert helper that PDF-24/26 reuse and PDF-22 shares the URL with)
**Design gate:** false
**Size:** M
**Estimated tokens:** ~35K
**Pseudo-impact:** no — VPS-local script, not an n8n workflow (record `pseudo: N/A` at build).

Watches the host every few minutes: a core container down (n8n / postgres / encryption-svc), DB unresponsive, disk past a threshold, `cloudflared` service inactive. Alerts the admin over a path that does NOT depend on n8n (DD-G Slack incoming-webhook, curl'd from cron — because n8n may itself be the thing that is down). Repeat-suppress: alert once, re-alert only after a sustained-failure interval so a multi-hour outage doesn't flood.

**Establishes (shared, DD-G):** the alert helper = a small curl wrapper POSTing the swappable Slack-webhook URL + the repeat-suppress state file. PDF-24 and PDF-26 reuse it.
**External prerequisite:** a Slack incoming-webhook URL (separate from the n8n Slack app).
**Why it matters:** the most reliable internal safety net and the cheapest to run; catches failure classes that in-service (n8n) checks structurally cannot.
**Acceptance:** within minutes of {core container down, DB unresponsive, disk past threshold, tunnel inactive}, the admin gets ONE alert (not a flood) over a channel that works even when n8n is down.

## PDF-24 — Scheduled credential-validity checks (Gemini + WhatsApp)

**Status:** 🟢 done
**Started:** 2026-06-20T06:11:42Z
**Completed:** 2026-06-20T06:16:18Z
**Actual tokens:** ~25K (probe authoring + live IP-restriction debug)
**Actual effort:** ~5 min
**Estimate delta:** on-bucket (planned S ~20K, actual ~25K)
**Pseudo:** N/A — VPS-local scripts, not an n8n workflow
**Owner session:** build-pre-demo-minor-fixes-20Jun26
**Priority:** P1 | **Batch:** 14
**Change type:** Infra — VPS cron + shell/script; reuses PDF-23's alert helper. Not an n8n workflow.

**Build summary (2026-06-20):** `scripts/monitoring/cred-check.sh` (committed; deployed to VPS), reuses PDF-23's `alert.sh`. Two probes: Gemini key → `GET generativelanguage…/v1beta/models?key=…` (200=ok); WhatsApp token → `GET graph.facebook.com/v21.0/<WABA_ID>?access_token=…` (200=ok). Both read `secrets.env`; failures alert via DD-G with the failing HTTP code + error message; recover via `clear_alert`. **Cron (UTC host): Gemini `30 6,18 * * *` (=00:00+12:00 IST); WhatsApp `0 7 * * *` (daily ≈12:30 IST).** **Live-verified:** initial Gemini probe returned 403 "API key has IP restriction" — the key (`googlePalmApi`, the one all 14 live Gemini nodes use; `httpQueryAuth` is unused legacy) is **IP-allowlisted to the VPS IPv4**, and the probe had egressed IPv6 → false negative. Fixed with `curl -4` (matches n8n's egress); re-run → Gemini 200 + WhatsApp 200, stale false alert auto-cleared via the recovery path (demonstrated the cred alert+recover cycle live). See [[project_gemini_key_ipv4_restriction]].
**Acceptance:** ✅ an invalid/expired/over-quota Gemini or WhatsApp credential is detected by the next scheduled probe (≤12h Gemini, ≤24h WhatsApp) and alerted to chinmay-admin-commands over an n8n-independent path, before a customer hits a failure.
**Workflows:** — (VPS-local; no n8n workflow)
**Depends on:** PDF-23 (soft — reuse shared DD-G alert helper; same VPS probe family → build after PDF-23)
**Design gate:** false
**Size:** S
**Estimated tokens:** ~20K
**Pseudo-impact:** no — VPS-local script, not an n8n workflow.

Proactively probes API credentials and alerts the moment one stops working — before a customer hits a failed interaction. WhatsApp token: once daily (also passively exercised by every outbound message, so quiet-period coverage is the gap it closes). Gemini key: twice daily at 00:00 + 12:00 IST (Gemini is only exercised on free-form text, mainly during active consultations; on a button-only day it may never be called — hence an active probe; low frequency keeps API cost down). Alerts via the DD-G helper.

**Evidence:** the Gemini key recently went bust and was discovered only when a customer's failed message surfaced in Slack — exactly this silent-failure class. "Chinmay finds out before the customer does."
**Acceptance:** when a credential is invalid/expired/over-quota, the admin is alerted by the next scheduled check (≤12h Gemini, ≤24h WhatsApp), before a customer is hurt; delivery does not depend on n8n.

## PDF-25 — Build WF-70 in-service health + execution failure-rate monitor

**Status:** 🔵 in-progress
**Started:** 2026-06-28T19:25:57Z (design locked this session; build not yet started — author pseudo first)
**Owner session:** (design-lock session 2026-06-28; build to be picked up by a fresh build-sprint session)
**Priority:** P2 | **Batch:** 16
**Change type:** Workflow-Create — NEW n8n workflow WF-70 + NEW append-only audit table `chinmay_astro.health_check_log`. Schedule trigger + real DB query + WhatsApp status HTTP call + execution failure-rate query + edge-triggered conditional alert + audit-log insert.
**Workflows:** WF-70 (new) · WF-51 (alert send, expected)
**Depends on:** — (in-service; alerts via n8n's own Slack path — n8n is up by definition when WF-70 runs)
**Design gate:** false
**Size:** M
**Estimated tokens:** ~35K
**Pseudo-impact:** yes — greenfield; author `WF-70.pseudo` IN this batch (co-located pseudo-first, not deferred).

Business-level signals only n8n can see from the inside: a real DB query succeeds (not just "port answers"), the WhatsApp API responds to a status call, and executions are not silently failing above a baseline rate (catches an error-swallowing node). By design it cannot detect n8n being down (it runs inside n8n) — so it complements PDF-22/23, not replaces them. Lower urgency than the up/down + credential checks, hence P2. Mirror the WF-75 build pattern (PDF-18).

**External prerequisite:** SSH tunnel open for the build.
**Acceptance:** WF-70 runs on a schedule, verifies DB + WhatsApp API responsiveness with real calls, and raises an admin alert when any check (incl. execution errors) fails — edge-triggered per the locked design below.

**Design decisions (LOCKED 2026-06-28 with user — build against THESE verbatim):**
- **Cadence:** hourly Schedule Trigger. **Silent when all healthy.** Mirror the WF-75 scheduled-job build pattern.
- **Three checks; overall health = ALL must pass (any one failing → `unhealthy`):**
  1. **DB reachable** — `SELECT 1 FROM chinmay_astro.users LIMIT 1` (real read, not just port).
  2. **WhatsApp API up** — lightweight GET to the WABA/phone-number endpoint using the existing WhatsApp credential (Graph API answers).
  3. **Execution errors** — **ANY** `execution_entity.status = 'error'` in the trailing 60 min → unhealthy. NO percentage threshold, NO volume floor (user decision: notify even a single/transient failure; the edge-triggered + recovery model below makes transients self-documenting so no login needed). Baseline confirmed ~0.3% (30d: 312 success / 1 error). `execution_entity` cols available: `status` ('success'|'error'), `startedAt`, `stoppedAt`, `workflowId`, `finished`.
- **Notifications — EDGE-TRIGGERED on state change** (via WF-51 → `chinmay-admin-commands` C0A5B0ZE81E; n8n's own Slack path, up by definition):
  - `healthy → unhealthy`: alert immediately — "⚠️ health check failed: <which check(s) + detail>".
  - `unhealthy → healthy`: alert — "✅ recovered".
  - **persistent `unhealthy`:** re-remind at most **every 12h** (user's "twice a day max") — "still failing since <failing_since>" — keeps nagging until resolved, no hourly spam.
  - persistent `healthy`: silent.
  - Worked example (user's): `W,F,F,W,W` (hourly) → exactly **2 alerts** (onset at 1st F; recovery at 1st W; 2nd F is <12h after onset so silent).
- **State / audit store — APPEND-ONLY table `chinmay_astro.health_check_log` (NOT single-row overwrite — user wants a full audit trail):**
  - Each hourly run INSERTs one row. Proposed columns (finalise exact DDL in `WF-70.pseudo`): `id` serial PK, `checked_at` timestamptz, `overall_state` text ('healthy'|'unhealthy'), `failed_checks` jsonb (which of db/whatsapp/exec failed + per-check detail/error text — what/where), `notification_sent` boolean, `notification_type` text ('onset'|'reminder'|'recovery'|null), `failing_since` timestamptz (start of the current unhealthy episode), `resolution` text (set on recovery: `'transient_auto'` if the episode lasted only ~1 check, else `'manual'` — human/claude can't be auto-distinguished; column is manually annotatable later), `resolution_note` text nullable.
  - Edge logic each run reads the **most recent prior row** to get last `overall_state` + `failing_since` + `last notification time`; the append-only history also makes the 12h-reminder query and the "how did it resolve" attribution straightforward, and gives Chinmay/Claude an inspectable record.
- **Build order:** pseudo-first → author `WF-70.pseudo` (greenfield, `pseudo-impact: yes`); create the `health_check_log` table (DDL via docker-exec write path); build WF-70 JSON inline on main thread (Opus — user chose inline authoring for visibility, NOT a generation subagent); typeVersion floor to WF-75's live node versions; backup N/A (new); MCP lint/validate + live activation check + export; regen WF-70.md; re-stamp `WF-70.pseudo` live_reconciled_at (5f.0).
- **Inline vs subagent for the build:** user approved using subagents for read-heavy/research/pure-generation, but chose **inline (main-thread Opus)** for the WF-70 JSON authoring (workflow JSON authoring is the riskiest to delegate; wants visibility). A read-only reference-gathering subagent to distill WF-75's schedule-trigger node shapes + WF-51 call contract is OPTIONAL and fine (keeps WF-75's big JSON out of context) — see handoff + subagent-discipline-notes.md.

## PDF-26 — Automated PostgreSQL backups (validate-before-rotate + offsite)

**Status:** 🔴 blocked
**Started:** 2026-06-20T06:20:00Z
**Blocked at:** 2026-06-20T06:27:43Z
**Blocked reason:** ON-VPS PART DONE & LIVE-VERIFIED (hourly `pg_dump|gzip` + validate-before-rotate + restore-doc, cron `15 * * * *`). The OFFSITE GDrive push (DD-H step 3: twice-daily 00:00+12:00 IST, 7-day rolling retention) is deferred per user decision (2026-06-20) pending the external prereq — **rclone is not installed on the VPS and no Google-Drive remote is configured.** Resume: install rclone, configure a GDrive remote, then wire the offsite cron (stub + intended command already in `backup-db.sh`) + 7-day prune + offsite-failure alert. Then PDF-26 → done.
**Actual tokens:** ~35K (so far — DB recon + script + both validate paths verified)
**Actual effort:** ~8 min (on-VPS part)
**Pseudo:** N/A — VPS-local scripts, not an n8n workflow
**Owner session:** build-pre-demo-minor-fixes-20Jun26
**Priority:** P1 | **Batch:** 15
**Change type:** Infra — VPS cron + pg_dump/gzip + rclone offsite; reuses PDF-23's alert helper. Not an n8n workflow.

**Build summary (2026-06-20, on-VPS part):** `scripts/monitoring/backup-db.sh` (committed; deployed), reuses PDF-23's `alert.sh`. DD-H: hourly `pg_dump n8n | gzip` → `backups/.staging.sql.gz`; **validate-before-rotate** = restore staging into throwaway `n8n_backup_validate` DB + confirm `chinmay_astro.users` queryable; only on success rotate (`n8n-latest.sql.gz`→`n8n-prev.sql.gz`, staging→latest); on any failure keep prior good copy + `send_alert db_backup`. DB is 31 MB, /mnt has 9.3 G free, run ~4 s. **Live-verified all paths:** clean run rotates (latest+prev present); independent restore of `n8n-latest.sql.gz` into a scratch DB → 4 users; **negative test (forced validation failure) → exit 1, good copies UNCHANGED, db_backup alert raised**; clean re-run → recovery posted + state cleared. Restore path documented in `scripts/monitoring/README.md`. **Offsite = remaining (blocked, see above).**
**Workflows:** — (VPS-local; no n8n workflow)
**Depends on:** PDF-23 (soft — reuse shared DD-G alert helper for backup-failure alerts)
**Design gate:** false
**Size:** M
**Estimated tokens:** ~40K
**Pseudo-impact:** no — VPS-local, not an n8n workflow.

**Locked policy (DD-H):**
1. **Hourly** `pg_dump | gzip` to VPS mounted storage.
2. **Validate-before-rotate** — before deleting the previous hour's good copy: gunzip the new dump to a temp path, restore into a throwaway temp database (or sample-read), verify expected tables exist + sample rows / row counts are sane. **Only on success** supersede the previous copy. On validation failure → KEEP the previous good copy AND alert (never overwrite good-with-bad). → corruption-survivable ~1h RPO.
3. **Offsite** to Google Drive **twice daily (00:00 + 12:00 IST)** via rclone (tiny even at ~1k users), rolling **7-day** snapshot retention → survives total VPS loss + logical corruption.
4. **Documented restore path** from on-VPS-latest OR an offsite snapshot.
5. Any failure (dump / validation / offsite push) raises an alert via the DD-G Slack-webhook helper.

**Design origin:** the task flagged that an "always-latest single copy" would let a corrupt hourly dump overwrite the last good copy within the hour. The user's 2026-06-16 refinement (validate-before-rotate + twice-daily offsite) resolves it on-VPS (a bad dump never supersedes a good one) and offsite (rolling snapshots).
**External prerequisite:** rclone configured on the VPS with a Google-Drive remote.
**Acceptance:** an up-to-date, **validated-restorable** backup always exists on VPS storage (≤1h old) and offsite copies exist on Google Drive (twice daily, 7-day rolling); a documented restore path recovers from either; backup failures themselves raise an alert.
