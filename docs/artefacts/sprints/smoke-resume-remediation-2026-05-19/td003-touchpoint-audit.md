# TD-003 audit — WA + Slack touchpoint coverage for `messages` logging

**Conducted:** 2026-05-20T00:11:33Z
**Trigger:** User redirected TD-003 from "admin_actions audit-log" → "messages-table touchpoint coverage" after the original framing was challenged. Premise: `chinmay_astro.messages` is the canonical communication log; `admin_actions` is redundant for single-admin operation. Right fix = close gaps in messages coverage, not build a parallel ledger.
**Method:** Bulk-fetched all 28 active+1 disabled workflows from live n8n. Scanned each for: (1) executeWorkflow → WF-50/51/60; (2) direct `n8n-nodes-base.whatsApp` / `httpRequest → graph.facebook.com` (WA bypass); (3) direct `n8n-nodes-base.slack` message ops (Slack bypass). Cross-referenced against `messages` schema (NOT NULL `user_id`, valid_direction check, `slack_message_ts` column already present).
**Local artefacts:** `/tmp/claude-scratch/td003-audit/all/*.json` (cleaned at session end).

---

## Coverage matrix (interface × surface × WF-60 call)

### WA inbound (1 surface)
| WF | Inbound surface | Calls WF-60? | Status |
|----|-----------------|--------------|--------|
| WF-00 Webhook Receiver | Meta WA webhook | ✅ Yes (post-TD-002) | OK |

### WA outbound (1 canonical surface; all routed through WF-50)
| WF | Calls WF-50? | Status |
|----|--------------|--------|
| WF-01, WF-12, WF-20, WF-21, WF-22, WF-23, WF-25, WF-30, WF-31, WF-32, WF-33, WF-34, WF-41, WF-42, WF-43, WF-44, WF-45, WF-47 | ✅ Yes | OK — all WA sends funnel through WF-50, which calls WF-60 (post-TD-002) |
| Any direct `graph.facebook.com` outside WF-50? | — | ✅ None found (WF-50's own 3 nodes are expected — it IS the canonical sender) |

### Slack inbound (1 surface)
| WF | Inbound surface | Calls WF-60? | Status |
|----|-----------------|--------------|--------|
| **WF-10 Slack Admin Handler** | Slack Events webhook | ❌ **No** | **GAP-1** |

### Slack outbound (canonical + multiple bypasses)
| WF | Outbound route | Calls WF-51 or WF-60? | Status |
|----|----------------|----------------------|--------|
| **WF-51 Send Slack Message** | Posts to Slack (canonical sender) | ❌ Does NOT call WF-60 | **GAP-2** (primary — fixing this covers every WF that already routes through WF-51) |
| WF-02, WF-22, WF-25, WF-31, WF-32, WF-33, WF-34, WF-40, WF-42, WF-46 | Send via WF-51 | (covered by GAP-2 fix) | Will be OK once GAP-2 lands |
| **WF-11 Command Parser** | **8 direct `slack` nodes** bypass WF-51 | ❌ Not logged | **GAP-3** — Confirm Consultation Closure, Confirm User Blocked, Send List To Admin, Send Stats To Admin, Unknown Command Response, Confirm User Unblocked, No Blocked User Found, Send Help To Admin |
| **WF-41 Admin → User Relay** | "Post to Slack Channel" direct send bypasses WF-51 | ❌ Not logged | **GAP-4** |
| WF-52 Slack Channel Manager | `channel.create`, `channel.invite`, `channel.getAll` | n/a — channel mgmt ops, not user-facing messages | Out of scope (not communication) |

### Non-issues
- WF-12 (Admin → WhatsApp Relay) is **disabled** (`active=false`). Skip.
- WF-10 has 1 Slack read (`Find Channel`) — read-only, not a communication event. Skip.

---

## Schema constraints that shape the fix

```
messages:
  user_id              integer  NOT NULL  → FK users.id  ON DELETE CASCADE
  consultation_id      integer  NULL      → FK consultations.id  ON DELETE SET NULL
  direction            varchar(20)  NOT NULL  CHECK IN ('inbound','outbound')
  message_type         varchar(50)  NOT NULL
  content              text         NULL
  whatsapp_message_id  varchar(500) NULL    UNIQUE
  slack_message_ts     varchar(50)  NULL
  metadata             jsonb        NULL
  created_at           timestamptz  NOT NULL  default now()
```

Two consequences:

1. **`user_id` is NOT NULL.** This means **admin-wide Slack commands cannot be logged as-is** — LIST, STATS, HELP have no user context. Three options:
   - (a) **Skip them at the WF-60 entry point** (return early, like the existing WA filter-skip path). Recommended — they're operational noise, not user communication.
   - (b) Schema change to allow NULL `user_id`. Larger blast radius (existing queries assume NOT NULL).
   - (c) Synthetic "system" user row. Cosmetic hack; rejected.

2. **`slack_message_ts` column already exists** — schema was designed for both transports. WF-60's canonical-shape mapper (rebuilt in TD-002) needs a small extension to populate it for Slack rows.

---

## Proposed scope for the rewritten TD-003

**Goal:** every WA + Slack message tied to a user lands in `chinmay_astro.messages` with correct `direction`, `user_id`, `slack_message_ts`/`whatsapp_message_id`, and transport hint in `metadata`. Admin-wide commands (LIST/STATS/HELP) are intentionally not logged.

**Items (5 fixes, all P1):**

| # | Fix | WF(s) | Change-type | Notes |
|---|-----|-------|-------------|-------|
| F1 | Extend WF-60 to handle Slack transport — accept `transport='slack'` payloads, resolve `slack_channel_id → user_id` (skip if not found, like the WA `phoneNumber → user_id` lookup), populate `slack_message_ts` instead of `whatsapp_message_id`, set `message_type='slack_text'` (or similar) | WF-60 | Structural | Mirrors the TD-002 WA logic — add a second branch in Extract Message Data + Needs User Lookup |
| F2 | WF-10 — add Slack-inbound mapper + Call WF-60 after Extract Required Fields; skip path for admin-wide commands (LIST/STATS/HELP) | WF-10 | Structural | New canonical mapper Code node + new executeWorkflow node; fire-and-forget |
| F3 | WF-51 — add Slack-outbound mapper + Call WF-60 after the successful Post to Slack response | WF-51 | Structural | Same pattern as WF-50 post-TD-002; covers all WFs already routing through WF-51 |
| F4 | WF-11 — refactor 8 direct Slack send nodes to route through WF-51 (architectural cleanup; once done, F3 covers them) | WF-11 | Structural | High-touch but mechanical: each Slack node → Code mapper (Prepare WF-51 Payload) → executeWorkflow Call WF-51. Some responses are user-channel (consult-{phone}) and have a user; some are admin-channel (LIST/STATS/HELP responses) and don't — relying on F1's `slack_channel_id → user_id` lookup with skip-if-not-found handles both |
| F5 | WF-41 — refactor "Post to Slack Channel" direct node to route through WF-51 (same cleanup) | WF-41 | Structural | Single-node refactor |

**Validation (acceptance):**
1. WA inbound from test user 61466927921 → `messages` row with `direction='inbound'`, `whatsapp_message_id` populated.
2. WA outbound from WF-50 (any path) → `messages` row with `direction='outbound'`, `whatsapp_message_id` populated.
3. Admin types `APPROVE PAYMENT 61466927921` in consult-61466927921 channel → 2 `messages` rows: 1 inbound (the admin's command, with user_id resolved from channel) + 1 outbound (the WF-11 "Confirm Consultation Closure" or equivalent response).
4. Admin types `LIST` in admin channel → NO `messages` rows written (skip path verified via WF-60 execution log: "skipped: no user resolved").
5. WF-60 failure does NOT fail parent chains (preserved from TD-002).

**Out of scope (deferred):**
- `admin_actions` table removal — see [Decision: admin_actions deprecation](#decision-admin_actions-deprecation) below. Logged to followups + post-MVP tech debt file.
- WF-25 / WF-22 metadata enrichment beyond the canonical fields — non-goal here.
- Backfilling historical messages — pre-go-live, no data to recover.

---

## Decision: admin_actions deprecation

**Decision (2026-05-20, user-approved):** `chinmay_astro.admin_actions` table is no longer needed. All admin actions are reconstructible from `messages` (the Slack message that triggered them) plus the `users.status` state machine (the resulting state transition).

**Reasoning:**
1. Single owner-admin (Chinmay) + single test admin (project owner, for ops/support on 61466927921 only) — "who did this action?" is not a meaningful question; the answer is always Chinmay for prod, project owner for test.
2. `messages` + state-machine fully capture what happened (inbound admin command, resulting outbound notification, user state change visible via `users.updated_at`).
3. The `ON DELETE NO ACTION` FK safety is a non-feature in this context — no regulatory retention requirement; clean-slate test wipes already work around it.

**Action:** Do NOT do removal in this sprint. Log to post-MVP tech debt for actual table-drop, and to followups for the existing broken/partial writes (WF-11 Unblock node, WF-47 Log to admin_actions). Those continue to silently no-op until table is dropped — no harm, since nothing reads from admin_actions.

---

## Architectural note (worth surfacing to the user before Step 3)

Items F4 + F5 are real refactors (touching 9 existing send nodes in WF-11 + WF-41 to re-route through WF-51). They are the **right** fix architecturally but expand the sprint's blast radius. Alternative shape if you want a smaller landing:

- **Minimal-scope variant:** Drop F4 + F5. Just do F1 + F2 + F3. Coverage will be ≥80% (every WF that already routes through WF-51 gets logged), with WF-11's 8 admin command responses + WF-41's admin reply remaining unlogged.
- **Trade-off:** smaller batch (3 structural fixes vs 5), but the bypasses persist as latent inconsistency that a future technical-workflow-review will flag again.

I'll set the rewritten TD-003 to include all 5 (F1–F5). When you re-open in Step 3 and review the state.md, you can de-scope F4/F5 there if you prefer the minimal landing.
