# Handoff — SP-03 smoke D-passed; E/F/G + Task #3 pending

_Written 2026-05-23T04:23:00Z_

## Stopping Point

Sprint `inline-20260522-102910` SP-03 smoke test on test phone +61466927921. Completed 12 of 17 scenarios — Phase A (6/6 admin channel), Phase B (1/1 relay text happy), Phase C (3/3 user-targeted rejections), Phase D1 (CLOSE happy — verified after 3 attempts requiring a surgical fix + systemic refactor + secondary v2 patch + duplicate-confirmation removal), Phase D2 (1/1 relay state-wrong on consultation_closed). All SP-03 WF-10/WF-11 systemic refactor work committed and pushed to GitHub as commit `91c0975`. Test phone +61466927921 currently in `consultation_closed` state. Session.md log: `docs/artefacts/tests/smoke-wf10-centralized-gate-2026-05-23/session.md`.

## Next Action

Re-invoke `/n8n-whatsapp-methodology:build-sprint` (no args — `_active` marker auto-resumes). Skill will land on SP-03 (still in-progress). Then resume smoke at **Phase E** with these scenarios in order:

1. **Phase E1 (APPROVE PAYMENT happy)** — DB-reset test phone to `payment_submitted` first:
   ```bash
   ssh root@45.79.125.184 'docker exec -i $(docker ps --format "{{.Names}}" | grep -i postgres | head -1) psql -U n8n -d n8n -v ON_ERROR_STOP=1' <<'EOF'
   UPDATE chinmay_astro.users SET status='payment_submitted', updated_at=NOW() WHERE phone_number='61466927921' RETURNING phone_number, status;
   EOF
   ```
   Then operator types `APPROVE PAYMENT 61466927921` in consult-+61466927921 (channel C0B567A175W). Expected: WF-10 classifies (commandType=APPROVE_PAYMENT, phoneStatus=ok, expectedState=payment_submitted matches) → Build WF-11 Payload → Call WF-11 → Switch APPROVE_PAYMENT → Call WF-33 → user.status flips to consultation_active + payment row updated + Slack confirmation lands.
   - **Watch for:** duplicate "Payment approved" Slack post pattern (BUG-05 sibling). If WF-33 has its own confirmation AND WF-11 has `Confirm Payment Approved`, log it like BUG-05. The fix path is the same — keep the richer one, remove the duplicate from WF-11.

2. **Phase E2 (REJECT PAYMENT happy)** — DB-reset back to `payment_submitted` again, then operator types `REJECT PAYMENT 61466927921`. Expected: WF-34 → user.status=payment_pending. Watch for the same duplicate-confirmation pattern.

3. **Phase F1 (BLOCK happy)** — operator types `BLOCK 61466927921 spam test` (note the optional reason). Expected: WF-46 → user.status=blocked. Confirmation should include the reason.

4. **Phase F2 (UNBLOCK happy)** — operator types `UNBLOCK 61466927921` in consult-+61466927921 (DR-13: UNBLOCK is user-targeted so it goes in the user's channel — verify WF-10's gate allows admin commands in a blocked user's channel). Expected: WF-11's UNBLOCK flow (now without Blocked User Found? IF — that was removed in SP-03 v1 patch) → Lookup Blocked User → Unblock User → Confirm User Unblocked → user.status=consultation_closed + Slack confirmation "✅ User Abcs (61466927921) has been unblocked...".
   - **Watch for:** the v2 fix changed Lookup Blocked User SQL + Unblock User SQL + Confirm User Unblocked to use `$('When Executed by Another Workflow').item.json.phoneNumber`. If anything mis-references, the failure should be visible. The dangling-name re-scan was clean post-PUT.

5. **Phase G (orphan channel)** — separate channel `consult-orphan-test` (C0B5N87PRDL), operator types any admin command. Expected: WF-10's User Row Exists? FALSE → Build Orphan Channel Alert → WF-51 posts to chinmay-admin-commands (re-verifies SP-11 Test E under new SP-03 gate code path).

6. **Cleanup after E/F/G:** restore +61466927921 to `consultation_active`. Then proceed to **Task #3** (downstream cleanup PUTs on WF-33/34/42) and **Task #4** (SP-03 close + Batch 2 post-batch regression).

## Blockers

None operationally. Smoke continuation is mechanical.

**Plugin improvement candidates (for SP-10 — defer to plugin update sprint, do NOT flush-now because context is heavy):**

- **(n) Series-after-sub-workflow contract preservation pattern.** When a node references `$json.X` for fields originating from the trigger payload, but its immediate predecessor is an `executeWorkflow` / postgres / Code node that produces a new contract shape, the trigger fields are silently dropped. The line data carries the predecessor's output, not the trigger's input. Use `$('TriggerName').item.json.X` cross-node refs for any field that must survive past a sub-workflow boundary. Validated by WF-11 D1 retry #2 failure: Confirm Consultation Closure after Call WF-42 received `{logged, logId}` instead of `{channelId, phoneNumber, ...}`. Same pattern affected Confirm User Blocked (after WF-46), Confirm User Unblocked (after Unblock User postgres), Unblock User SQL (after Lookup Blocked User postgres), and Send List/Stats/Help To Admin (after Format Code nodes). This is a sibling of plugin candidate (g) (Set v3.4 drops upstream fields) — both deal with line data being replaced. Recommend adding as `build-workflow` Step 5f.2.1 or similar — a downstream-consumer side of the input-contract preservation rule.

- **(o) Slack mrkdwn auto-linkification in user-typed phone numbers.** Slack converts phone-like strings (with or without `+`) into `<tel:+xxx|yyy>` markup before sending the message text. Any classifier or parser code that tokenizes on whitespace must strip Slack mrkdwn (`<tel:..|..>`, `<https?://..|..>`) BEFORE phone-pattern matching, otherwise the tel-wrapped token won't match `/^\+?\d{10,15}$/`. Validated by WF-10's Classify User Channel Message: pre-fix the regex couldn't extract typedPhone from the Slack-typed message; post-fix the strip-then-tokenize order works. Should be a noted gotcha alongside the existing "n8n Expression Gotchas" in build-workflow, OR captured as a Slack-input-handling lesson in plugin candidate (l) (validation centralization at boundaries).

- **(p) Single-owner principle for user-facing confirmation messages.** When multiple workflows in a chain can produce a Slack confirmation (e.g., command-handler workflow + parent dispatcher), pick ONE owner — typically the handler that performed the actual operation, since it has the result context (state transition, side effects). Validated by BUG-05: WF-42's confirmation includes customer name + WA-feedback context; WF-11's was phone-only. Removed WF-11's. Recommend documenting in build-workflow as a principle alongside the existing "trust-after-gate" pattern — the handler owns the confirmation; the dispatcher does not duplicate.

## Changed Reference Values

- **WF-10 (`wMh0oBRtJbvhLgOf`):** 28 → **40 nodes** (SP-03 base 38, +1 Build WF-11 Payload surgical fix → 39, +1 Build WF-11 Payload (Admin) systemic fix → 40). live `updatedAt`: 2026-05-23T04:03:23.056Z. versionId: `743003cc-c09c-474b-b11d-c4914ab4ced1`. Backups: `archive/backups/wMh0oBRtJbvhLgOf-2026-05-23-13-44.json` (pre-surgical), `archive/backups/wMh0oBRtJbvhLgOf-2026-05-23-13-56.json` (pre-systemic).
- **WF-11 (`GoTYo0GS2y8qjjkw`):** 23 → **19 nodes** (-3 systemic v1 [Parse Command, Blocked User Found?, No Blocked User Found] -1 BUG-05 [Confirm Consultation Closure]). live `updatedAt`: 2026-05-23T04:21:20.227Z. versionId: `adeb14d5-a250-443c-abbb-4d5120864ca5`. Backups: `archive/backups/GoTYo0GS2y8qjjkw-2026-05-23-13-56.json` (pre-systemic v1), `-2026-05-23-14-09.json` (pre-v2 patch), `-2026-05-23-14-20.json` (pre-BUG-05).
- **Test phone +61466927921 (Abcs):** currently `consultation_closed`. slack_channel_id=C0B567A175W. Reset to `payment_submitted` before E1, then to `payment_submitted` again before E2, then operations naturally progress through Phase F.
- **Test phone +61491370732:** still no records (unchanged from prior session).
- **GitHub commit:** `91c0975 — sprint: SP-03 systemic fix + smoke partial (12/17) + BUG-05 deduplication`. All 13 files (workflows, pseudos, registry, session log, 5 backups) pushed to main.
- **Open bugs awaiting Task #3 batch:**
  - **BUG-01 [minor]** — WF-11 HELP text doesn't indicate which channel each command should be typed in. Sample fix wording from operator: `APPROVE PAYMENT <phone> - Approve payment and activate consultation [Must be sent in respective user channel 'consult-<phone>']` and `STATS - Show today's statistics [Must be sent in admin channel]`. Location: WF-11 `Prepare HELP Text` Code node.
  - **BUG-03 [major]** — WF-11 `Unknown Command Response` → WF-51 Slack post fires with blank `channelId`/`text` if the Unknown branch is ever reached (its inputs aren't validated). Should be defensive — short-circuit on empty. Note: post-SP-03 gate, the Unknown branch should be unreachable in normal flow.
  - **BUG-05 [resolved this session]** — duplicate CLOSE confirmation. Fixed by removing WF-11's `Confirm Consultation Closure`. APPROVE/REJECT/BLOCK likely have the same duplicate-confirmation pattern; surface during E + F and fix in same shape (keep handler's richer message; remove WF-11's parallel post).
- **Sprint state file:** `docs/artefacts/sprints/inline-20260522-102910/state.md`. SP-03 still `in-progress`. SP-01 + SP-02 + SP-11 = done. SP-04 through SP-10 = pending (Batch 3/4).
- **Session.md test log:** `docs/artefacts/tests/smoke-wf10-centralized-gate-2026-05-23/session.md` — full chronological record of all 12 scenarios + all 4 fix passes. Use as cursor source for resuming the test (exec-cursor: 1781, time-cursor: 2026-05-23T04:15:14Z stored in `.cursors/`).
