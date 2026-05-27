# Handoff — Batch 2.5 added (WF-01 envelope `||` regression + WF-21 Flow ID swap)

**Written at:** 2026-05-27T00:54:52Z

## Stopping Point

TD-PGF-01B Steps 1–4 done (Postgres ALTER, WF-22 INSERT, Meta Flow v2 published). Step 5 end-to-end verify attempted with test phone `61466927921` and surfaced a P0 onboarding blocker independent of TD-PGF-01B's own code: WF-01 `Build WF-01 Envelope` jsCode uses `||` fallback (introduced in commit `a21eb60`, data-contract-discipline Wave 1) which converts `messageContent: ""` → `null` for nfm_reply submissions; WF-02's contract guard then rejects with `messageContent required (string or empty string), got: null`. Also discovered Meta Flow publish-of-clone creates new Flow ID `2260297164474475`; WF-21 still references original Flow ID `1408011897720771`. Three new P0 items added as **Batch 2.5** (TD-PGF-12 audit + TD-PGF-13 fix + TD-PGF-14 WF-21 swap) — must close before any P1 work.

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint @docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/tasks.md`. Resume point is TD-PGF-12 (FIRST item in Batch 2.5) — `||` vs `??` audit across all active workflows. TD-PGF-12 defines TD-PGF-13's expanded scope. Full progress block + remaining-steps detail in `docs/artefacts/sprints/pre-go-live-final-follow-up-2026-05-26/state.md` under the TD-PGF-12/13/14 sections.

## Blockers

- **None — all required user info is captured.** New published Flow ID is `2260297164474475` (recorded in state.md TD-PGF-14 + tasks.md). TD-PGF-14 is straightforward Surgical edit; no further user input needed.
- **Plugin improvement opportunity:** two new methodology learnings captured in `followups.md`:
  1. Meta Flow publish-of-clone creates new Flow ID (preserve original by editing-in-place instead).
  2. `||` vs `??` empty-string regression class (use `??` in data-contract envelope code).
  Apply via `flush-plugin-improvements` skill in a future session.

## Changed Reference Values

- **New published Meta Flow ID:** `2260297164474475` (replaces references to `1408011897720771` in WF-21 — to be updated by TD-PGF-14)
- **WF-22 (`dr8QM0m92Ml8MvIh`) live state:** carries the `email_address` column INSERT mapping deployed in Step 3; will work end-to-end once WF-01 fix + WF-21 Flow ID swap land
- **`chinmay_astro.users.email_address text NULL`** column added (Step 2; still NULL for any rows inserted before live Flow v2 is wired up via TD-PGF-14)
- **Sprint scope:** 3 new items added (TD-PGF-12/13/14, Batch 2.5, P0); TD-PGF-11 final smoke gate dependencies expanded to include 12/13/14
- **Source hash:** `bbe96d3983495229756fb114f40450993c7810b826983cfec4f54110d52d29ac` (mid-sprint re-baseline; original sprint-plan-time hash retained in state.md "Original input hash" line for audit)
- **Test phone `61466927921` state:** wiped clean during this session at 23:51Z; pending_users re-populated at 00:27:57Z when user re-messaged the bot to trigger fresh onboarding; users + messages remain empty (form submission failed at WF-01)
