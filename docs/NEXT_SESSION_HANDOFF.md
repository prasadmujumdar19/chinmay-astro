# Chinmay Astro — Next Session Handoff Prompt

**Copy and paste everything below this line as your first message in the next session.**

---

## Context

We are building a WhatsApp-based Vedic astrology consultation service for Chinmay. All automation runs on n8n (no custom backend). Infrastructure is on Linode Mumbai VPS, now accessible via Cloudflare Tunnel on `chinmayastro-n8n.friendlydealfinder.com.au`.

**Start by reading:** `workflow-registry.md` — it is the single source of truth, updated to v2.7 (24 Apr 2026, session 7). It contains the full WIP action list, all workflow IDs, and design decisions. Do NOT rely on memory alone — always read the registry first.

**n8n access:** Use Chrome MCP (`mcp__Claude_in_Chrome__*`). Navigate to `https://chinmayastro-n8n.friendlydealfinder.com.au`, then use `javascript_tool` with relative URL `/api/v1` and async IIFE pattern. The n8n API key is in memory under "Chinmay Astro — n8n API Key". Direct sandbox curl is blocked by Cloudflare Access — browser is the only route.

**Note on n8n API:** Use PUT (not PATCH) for workflow updates. PATCH returns 405.

---

## What Was Done in Session 7 (24 Apr 2026)

**CF Tunnel + infra:**
- Cloudflare Tunnel setup completed using **friendlydealfinder.com.au** account (not chinmaymujumdar.com — GoDaddy website builder doesn't expose an IP).
- Tunnel: `chinmay-astro-mumbai-prod` → Mumbai VPS `:5678`
- New n8n URL: `https://chinmayastro-n8n.friendlydealfinder.com.au`
- CF Access: Email OTP on `/*`, Bypass on `/webhook*`
- `.env.production` updated with correct `WEBHOOK_URL` + `N8N_HOST` (was causing `:5678` suffix in webhook URLs)

**WF-02 rebuilt:**
- Root cause of smoke test blockage identified: WF-02 had 6 of 8 call nodes **disabled**, pointing to old/renamed workflow IDs (WF-24, WF-25, WF-26, WF-27, WF-28 — all superseded).
- Also: Detect Route code used wrong messageType strings (`'interactive_button'`/`'interactive_flow'`) — actual values from WF-01 are `'interactive'` + `rawMessage.interactive.type` (`'button_reply'`/`'nfm_reply'`).
- Fixed: all 8 routes now correct, all nodes active. Route map: NEW_USER→WF-21, PRE_FORM_TEXT→WF-23, DETAILS_FORM→WF-22, PAYMENT_CONFIRM→WF-32, PAYMENT_PENDING_TEXT→WF-30, PAYMENT_SUBMITTED_TEXT→WF-31, RELAY→WF-40, POST_CONSULT_TEXT→WF-43.

**Smoke test progress:** Steps 1–4 ✅. Blocked at step 5, now unblocked.

---

## What Was Done in Session 6 (15 Apr 2026)

All remaining pre-go-live workflows completed:

- **WF-25** (Intent Classifier, ID: `eTV1lUcYrXBg2q2T`) — created + activated. Gemini 2.0 Flash Lite, API key in URL param. 7 intents. garbage→warn+Slack notify, malicious/inappropriate→warn+auto-block WF-46. ✅
- **WF-43** (Post-Consultation Handler, ID: `3va0M06kijgyLejf`) — rebuilt. WF-25 → rebook→WF-45, feedback→WF-44, general→Gemini response. Active. ✅
- **WF-44** (Feedback Recorder, ID: `Du2CJ3OTohRFZYoA`) — rebuilt. Saves `messageText` to `users.feedback`, clears `stage=NULL`, sends ack. Active. ✅
- **WF-30** (Payment Pending Intent Filter, ID: `gGJBY5fJha0Let8I`) — implemented. WF-25 → contextual reply + UPI payment reminder. Active. ✅
- **WF-31** (Payment Submitted Handler, ID: `HB8nXudAtk9iXz7C`) — fixed. WF-25 → "under review" ack. Active. ✅
- **WF-23** (Pre-Form Intent Filter, ID: `VpCER0Vqq3NYJGpI`) — implemented. WF-25 → text reply + re-send WhatsApp Flow form (flowId: 1408011897720771). Active. ✅

**Build status: 27/27 pre-go-live workflows active. All P1/P2/P3 items done.**

---

## Next Session — Ordered Work List

### 🔴 STEP 1 — Continue smoke test (resume from step 5)

Steps 1–4 confirmed working in session 7. **Resume from step 5.**

1. ✅ **New user** messages → welcome + form sent
2. ✅ **New user sends text** before filling form → WF-23 replies + re-sends form
3. ✅ **Form submitted** → payment instructions with correct UPI (+91-9653240263)
4. ✅ **Payment pending user sends text** → WF-30 replies with payment reminder
5. ❓ **"Payment Completed" button** tapped → payment notification posted to existing consult channel (channel was already created at form submission) ← **START HERE**
6. ❓ **Payment submitted user sends text** → WF-31 replies "under review"
7. ❓ **Admin APPROVE** → consultation active, user notified
8. ❓ **Admin ↔ User relay** (both directions)
9. ❓ **Admin CLOSE** → feedback request sent
10. ❓ **User sends feedback text** → WF-44 saves to DB, sends ack
11. ❓ **User sends STOP** → opted_out, confirmation sent
12. ❓ **opted_out user messages** → WF-21 re-welcome + form
13. ❓ **Admin BLOCK** → blocked, silent
14. ❓ **Admin UNBLOCK** → consultation_closed
15. ❓ **Garbage message** from any state → warning sent + Slack admin notified

### 🟠 STEP 2 — Fix any issues found in smoke test

Document and fix failures as they're found.

### 🟡 STEP 3 — Go-live checklist

- Verify Meta webhook is pointing to WF-00
- Confirm WhatsApp Business account is live
- Test end-to-end with a real phone number
- Confirm Slack workspace + channels are set up
- Brief Chinmay on admin commands: `APPROVE PAYMENT <phone>`, `REJECT PAYMENT <phone>`, `CLOSE CONSULTATION <phone>`, `BLOCK <phone>`, `UNBLOCK <phone>` — all sent in the user's `consult-{phone}` channel (or any Slack channel)

---

## Important Reference Info

| Item | Value |
|------|-------|
| n8n base URL | `https://chinmayastro-n8n.friendlydealfinder.com.au/api/v1` |
| Postgres credential ID | `Zomqv5wsowQAhdGl` |
| Slack credential ID | `WSds5JWe5b6N7myY` |
| Slack admin channel | chinmay-admin-commands (C0A5B0ZE81E) |
| WF-25 (Intent Classifier) ID | `eTV1lUcYrXBg2q2T` |
| WF-50 (Send WhatsApp) ID | `BUVun38WEKb12zg9` |
| WF-51 (Send Slack) ID | `wlZRK0YxnhP0b2RL` |
| WF-46 (User Blocker) ID | `UV62An60fzflU0uD` |
| WF-21 (New User Welcome) ID | `zM8WbxSdt9nXRoLZ` |
| WF-44 (Feedback Recorder) ID | `Du2CJ3OTohRFZYoA` |
| WF-45 (Rebook Handler) ID | `MUG7rPgSHc7UtAE9` |
| WhatsApp Flow ID | `1408011897720771` |
| WhatsApp Flow CTA | `"Fill Details"` |
| Payment UPI | +91-9653240263 (Chinmay Mujumdar) |
| Gemini API Key | see n8n credential "Gemini API Key (Query Auth)" — never commit real keys to git |
| Gemini model | gemini-2.0-flash-lite |

---

## Key Design Rules (do not deviate)

1. `opted_out` ≠ `blocked`. STOP keyword → `opted_out`. Admin BLOCK → `blocked`. WF-01 handles them differently.
2. WF-20 intercepts STOP/HELP/REBOOK before any other routing — exact keyword match, no LLM.
3. Intent classifier (WF-25) runs AFTER keyword intercept. Only handles ambiguous free-form text.
4. First DB write = WF-22 (form submission). No DB write before that.
5. Payment is manual UPI — no Razorpay integration (Phase 2).
6. All workflows must backup before modification (n8n skill checkpoint process).
7. n8n API access requires Chrome MCP — sandbox curl is blocked by CF Access.
8. WF-50 interactive/flow payload: flat structure with `flowId`/`flowCta` camelCase, no nesting. See memory note.
9. Use PUT (not PATCH) for workflow updates via the API.
