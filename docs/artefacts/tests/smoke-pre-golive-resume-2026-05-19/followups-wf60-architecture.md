# Followup — BUG-NEW-01 (escalated): WF-60 Message Logger needs architectural rebuild

**Original severity:** `[major]` (TC-0303 tick)
**Escalated to:** `[critical]` (architectural) — confirmed by operator UI inspection 2026-05-19
**Status across this session:** WF-60 ran 5× across TC-0303 + 3× TC-0401 inbound + 1× CLOSE chain — every invocation completed `success` in 22–101 ms with **zero** rows inserted into `chinmay_astro.messages`.

## Evidence (live, multi-source)

1. **DB:** `SELECT COUNT(*) FROM chinmay_astro.messages` = **0** after 8 message events that should have produced 8+ rows (inbound + outbound for every relay).
2. **n8n executions:** wall-clock durations (22 / 30 / 24 / 101 / ~25 ms) are too short for the workflow's stated path (`Trigger → Extract Message Data → Log to Messages Table → Done`). A genuine Postgres insert alone is typically 30–80 ms.
3. **Operator UI inspection (2026-05-19, verbatim):** "many basic issues like using a variable value in next node but previous code node never returns it. WF-60 needs to be thought through and re-built."
4. **Workflow registry status:** WF-60 was already P1 priority with note "All nodes re-enabled (TD-004 May 2026). Main path: Trigger → Extract Message Data → Log to Messages Table → Done. Schema prefix fixed (TD-001)." — but the *upstream contract* (what fields Extract Message Data emits vs what Log to Messages Table consumes) was never verified.

## Why "rebuild" not "patch"

A patch implies one specific node has one specific wrong reference. Operator's UI walkthrough found the cross-node variable references are systematically wrong — multiple nodes downstream of `Extract Message Data` reference fields that the Code node doesn't emit. Fixing one reference leaves others equally broken.

Recommended approach for the rebuild:
1. **Decide the canonical input contract for WF-60.** It should accept a normalised shape (e.g. `{userId, consultationId, direction, messageType, content, whatsappMessageId, slackMessageTs, metadata}`) — *not* a raw inbound webhook payload or a raw Slack event.
2. **Update every caller** (every workflow that does `Execute Workflow → WF-60`) to emit that canonical shape via a small mapper node — there will be 3-5 callers (inbound webhook chain, WF-50 sender, WF-51 sender, WF-33, WF-43).
3. **WF-60 itself becomes 2 nodes:** a Postgres insert (with array-form `queryReplacement` per BUG-01 convention) + an error branch that logs to executions but doesn't fail the parent chain (logging is non-critical to user flow).
4. **Add the Postgres `messages` table to the technical-workflow-review's schema-alignment check** so future drift surfaces.

## Acceptance

- Send 1 inbound WhatsApp + 1 outbound WhatsApp → 2 rows in `chinmay_astro.messages`, both with correct `direction`, `content`, `whatsapp_message_id`, `created_at` populated.
- Send 1 admin Slack message (relay direction) → 1 row with `direction=outbound`, `slack_message_ts` populated.
- WF-60 failure path (e.g. content too long for column) does not fail the parent chain.

## Why this is pre-go-live blocking

Without `messages` rows, the system has zero conversation history for:
- Compliance / dispute handling
- Re-onboarding context for rebookings
- Any analytics / reporting on consultation activity

User-visible flow works without it, but operationally this is a P0 for any time-period > the first few users.
