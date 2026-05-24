# Slack-n8n Integration Reference

**Purpose:** Technical reference for integrating Slack with n8n via webhooks
**Scope:** Covers infrastructure, Slack API setup, n8n workflow patterns, and troubleshooting
**Last Updated:** April 2026 (updated Section 2 for Cloudflare Tunnel architecture)

---

## 1. Overview

### What This Enables
- **Inbound messaging:** Slack messages → n8n workflows via webhooks
- **Outbound messaging:** n8n → Slack via Bot API
- **Channel management:** Create/archive channels programmatically
- **Command handling:** Route messages based on channel type or content

### Architecture

**Current (Cloudflare Tunnel — production model):**
```
Slack Workspace
      ↓
Slack API (Event Subscriptions)
      ↓
HTTPS POST → https://yourdomain.com/webhook/slack-endpoint
      ↓
Cloudflare Edge
      ↓  (CF Access: Bypass policy on /webhook/* path)
Cloudflare Tunnel (cloudflared systemd service — outbound only)
      ↓
http://localhost:5678/webhook/slack-endpoint  (host network)
      ↓
n8n Webhook Workflow
      ↓
Process & Route Messages
```

**Key difference from nginx model:** There is no nginx, no open ports 80/443 on the VPS. `cloudflared` runs as a **systemd service on the host** (not Docker), making an outbound-only connection to Cloudflare's edge. Slack's webhook POST reaches n8n because the `/webhook/*` path has a CF Access **Bypass** policy — unauthenticated requests pass through without OTP challenge.

**Previous model (nginx — now obsolete):**
```
Slack → HTTPS POST → nginx (SSL termination, port 443) → localhost:5678/webhook/...
```
The nginx model is retired. Do not use this as a reference for new deployments.

---

## 2. Infrastructure Setup (Cloudflare Tunnel)

### 2.1 How Slack Webhooks Reach n8n

| Layer | What Happens |
|-------|-------------|
| Slack | Posts event to configured webhook URL (`https://yourdomain.com/webhook/slack-endpoint`) |
| Cloudflare Edge | Receives HTTPS, checks CF Access policy for `/webhook/*` → Bypass → passes through |
| CF Tunnel | cloudflared systemd service forwards to `http://localhost:5678/webhook/slack-endpoint` (host) |
| n8n | Processes event, responds 200 OK |

### 2.2 CF Access Webhook Bypass Policy

The Slack webhook URL must not be OTP-gated — Slack cannot complete an OTP challenge. The CF Access Bypass application covers this:

- **Application domain:** `yourdomain.com`
- **Path:** `/webhook`  ← covers `/webhook/*` and all sub-paths
- **Policy:** Bypass → Everyone

Without this, Slack receives a 302 redirect to CF Access login and the webhook verification fails.

**Verify the bypass is working:**
```bash
curl -X POST "https://yourdomain.com/webhook/slack-endpoint" \
     -H "Content-Type: application/json" \
     -d '{"type":"url_verification","challenge":"test123"}'
# Expected: {"challenge":"test123"}  (not an HTML redirect page)
```

### 2.3 Cloudflare Tunnel Setup (Summary)

For full CF Tunnel + CF Access setup steps, see `INFRA.md` sections 2.1 and 2.2.

Quick reference for the Slack-relevant parts:
- Tunnel public hostname: `yourdomain.com` → `http://localhost:5678` (host — cloudflared runs as systemd, not Docker)
- n8n container must be bound to `127.0.0.1:5678` (not `0.0.0.0:5678`)
- cloudflared is **not** in Docker Compose — it runs as a systemd service on the host (see `INFRA.md` Section 2.1)

---

## 3. Slack App Configuration

### 3.1 Workspace & App Creation

1. **Create Workspace:** https://slack.com/get-started#/createnew
   - Use admin email for verification
   - Choose workspace name

2. **Create Slack App:** https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - App Name: `[Your Bot Name]`
   - Select your workspace

### 3.2 OAuth & Permissions

**Navigate to:** OAuth & Permissions (left sidebar)

**Required Bot Token Scopes:**

| Scope | Purpose |
|-------|---------|
| `chat:write` | Send messages |
| `channels:manage` | Create public channels |
| `channels:read` | List public channels |
| `channels:history` | Read messages from public channels |
| `groups:write` | Create private channels |
| `groups:read` | List private channels |
| `groups:history` | Read messages from private channels |
| `users:read` | Get user information |

**Add scopes:**
- Scroll to "Scopes" section
- Click "Add an OAuth Scope" under "Bot Token Scopes"
- Add each scope from the table above

**Install App to Workspace:**
- Scroll to top of OAuth & Permissions page
- Click "Install to Workspace"
- Approve permissions
- **Copy the Bot User OAuth Token** (starts with `xoxb-`)
  - Format: `xoxb-XXXXXXXXXXXX-XXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX`
  - Store securely - needed for n8n credentials

### 3.3 Event Subscriptions Setup

**Navigate to:** Event Subscriptions (left sidebar)

**Step 1: Enable Events**
- Toggle "Enable Events" to **ON**

**Step 2: Configure Request URL**
- Before entering URL, ensure n8n webhook workflow is active (see Section 4)
- Request URL: `https://yourdomain.com/webhook/slack-endpoint`
- Slack will send a verification challenge
- Your n8n workflow must respond with the challenge value
- Wait for green "Verified ✓" checkmark

**Troubleshooting verification failure:**
1. Confirm the CF Access Bypass policy covers `/webhook` (Section 2.2)
2. Confirm n8n workflow is activated (not just saved)
3. Confirm `cloudflared` container is running and tunnel shows Healthy in CF dashboard
4. Test bypass manually with the curl command in Section 2.2

**Step 3: Subscribe to Bot Events**

Scroll to "Subscribe to bot events" and add:
- `message.channels` - Messages in public channels
- `message.groups` - Messages in private channels

**Step 4: Save Changes**
- Click "Save Changes" at bottom
- Reinstall app if prompted

**API Reference:** https://api.slack.com/apis/connections/events-api

### 3.4 Bot Installation & Channel Invitation

**Invite bot to channels:**

Method 1 (via command):
```
/invite @YourBotName
```

Method 2 (via UI):
- Click channel name → Integrations tab → Add an App → Select your bot

**Verify bot joined:** You'll see "{Bot} added to #{channel}" message

---

## 4. n8n Webhook Workflow

### 4.1 Workflow Architecture

**Workflow Pattern:** WF-10 (Slack Admin Handler)

**Flow Overview:**
```
Webhook Receiver
    ↓
Event Type Router
    ├─→ URL Verification → Respond with challenge
    └─→ Message Event
            ↓
        Bot Message Filter
            ↓
        Extract Message Data
            ↓
        Get Channel Info (Slack API)
            ↓
        Route by Channel Type
            ├─→ Admin Commands Channel
            ├─→ User Channels (consult-*)
            └─→ Ignore (other channels)
```

### 4.2 Node-by-Node Configuration

#### Node 1: Webhook (Entry Point)

**Node Type:** Webhook
**Configuration:**
- **HTTP Method:** POST
- **Authentication:** None
- **Respond:** Immediately
- **Response Code:** 200

#### Node 2: Switch (Event Type Router)

**Node Type:** Switch
**Purpose:** Handle URL verification vs actual messages

**Routes:**

**Route 1 - URL Verification:**
- Condition: `{{ $json.body.type }}` equals `url_verification`

**Route 2 - Message Event:**
- Condition: `{{ $json.body.type }}` equals `event_callback`

#### Node 3: Respond to Webhook (URL Verification)

**Node Type:** Respond to Webhook
**Connected to:** Switch Route 1 (url_verification)
**Configuration:**
- **Respond With:** JSON
- **Response Code:** 200
- **Response Body:**
```json
{
  "challenge": "={{ $json.body.challenge }}"
}
```

**Critical:** Use `$json.body.challenge` — NOT `$json.challenge`. Slack (via n8n's webhook node) wraps the payload inside `body`.

#### Node 4: IF (Bot Message Filter)

**Node Type:** IF
**Connected to:** Switch Route 2 (event_callback)
**Purpose:** Prevent infinite loops from bot's own messages

**Condition:**
```
{{ $json.body.authorizations[0].user_id }} ≠ {{ $json.body.event.user }}
```

**Logic:**
- **True** = Message from human (continue)
- **False** = Message from bot (ignore)

#### Node 5: Set (Extract Message Data)

**Node Type:** Edit Fields
**Connected to:** IF True branch
**Purpose:** Extract key fields for easier access downstream

**Fields to Set:**

| Field Name | Expression |
|------------|------------|
| `channel_id` | `{{ $json.body.event.channel }}` |
| `user_id` | `{{ $json.body.event.user }}` |
| `message_text` | `{{ $json.body.event.text }}` |
| `timestamp` | `{{ $json.body.event.ts }}` |

#### Node 6: Slack - Get Channel Info

**Node Type:** Slack
**Configuration:**
- **Credential:** Slack API (Bot Token)
- **Resource:** Channel
- **Operation:** Get
- **Channel ID:** `{{ $json.channel_id }}`

**Common Error:** `channel_not_found`
- **Cause:** Missing `groups:read` permission for private channels
- **Fix:** Add `groups:read` scope in OAuth & Permissions, reinstall app

#### Node 7: Switch (Route by Channel Type)

**Node Type:** Switch
**Purpose:** Route messages based on channel name

**Routes:**

**Route 1 - Admin Commands:**
- Condition: `{{ $json.name }}` equals `your-admin-channel-name`

**Route 2 - User Channels:**
- Condition: `{{ $json.name }}` starts with `consult-`

**Route 3 - Default:**
- Fallback route (ignore messages from other channels)

### 4.3 Key Expression Patterns & Data Structure

**Slack Event Payload Structure (as received in n8n):**
```json
{
  "body": {
    "type": "event_callback",
    "event": {
      "type": "message",
      "user": "U0XXXXXXX",
      "channel": "C0XXXXXXX",
      "text": "message content",
      "ts": "1766105596.440959",
      "channel_type": "group"
    },
    "authorizations": [{
      "user_id": "U0XXXXXXX",
      "is_bot": true
    }]
  }
}
```

**Common Expression Patterns:**

| Access | Expression |
|--------|------------|
| Message text | `{{ $json.body.event.text }}` |
| Channel ID | `{{ $json.body.event.channel }}` |
| User ID | `{{ $json.body.event.user }}` |
| Timestamp | `{{ $json.body.event.ts }}` |
| Bot ID check | `{{ $json.body.authorizations[0].user_id }}` |
| Webhook challenge | `{{ $json.body.challenge }}` |

**API Reference:** https://api.slack.com/events/message

### 4.4 Common Troubleshooting

**Issue: Webhook verification fails**
- **Symptom:** "Your request URL didn't respond with the correct challenge value"
- **Possible causes & fixes:**
  1. CF Access Bypass policy missing or not covering `/webhook` path → add Bypass app in CF Zero Trust
  2. Response Body using wrong field → use `{{ $json.body.challenge }}` not `{{ $json.challenge }}`
  3. n8n workflow not activated → toggle workflow ON
  4. Cloudflared tunnel down → check `sudo systemctl status cloudflared`, verify tunnel status in CF dashboard

**Issue: No messages received in n8n**
- **Symptom:** Workflow doesn't trigger when messages sent in Slack
- **Causes:** Bot not invited to channel, or event subscriptions not saved
- **Fix:** Run `/invite @BotName` in the channel; verify Event Subscriptions page shows Verified

**Issue: `channel_not_found` error in Get Channel Info node**
- **Cause:** Missing permissions for private channels
- **Fix:** Add `groups:read` scope, reinstall app to workspace

**Issue: Expression shows `[undefined]`**
- **Cause:** Incorrect data path — remember n8n wraps Slack payload in `body`
- **Fix:** Check INPUT panel in n8n, use `$json.body.event.field` pattern

**Issue: Bot responds to its own messages (infinite loop)**
- **Fix:** Verify IF node condition: `authorizations[0].user_id ≠ event.user`

**Issue: Tunnel-related 502/503 errors**
- **Symptom:** Requests reach Cloudflare but return error
- **Check:** `sudo systemctl status cloudflared` — is service active/running?
- **Check:** CF Zero Trust → Tunnels — is tunnel status Healthy?
- **Fix:** `sudo systemctl restart cloudflared` — tunnel reconnects automatically

---

## 5. Credentials & Tokens

### What to Save

**From Slack API Dashboard:**

1. **Bot User OAuth Token** (OAuth & Permissions page)
   - Format: `xoxb-XXXXXXXXXXXX-XXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX`
   - Used for: All Slack API calls from n8n

2. **Signing Secret** (Basic Information page, App Credentials section)
   - Format: 32-character hex string
   - Used for: Webhook signature verification (TD-04 — post-MVP)

3. **App ID** (Basic Information page)
   - Format: `A0XXXXXXXXX`
   - Used for: Reference only

### Where to Store in n8n

1. In n8n: Settings → Credentials → New Credential
2. Search for "Slack API"
3. **API Token:** Paste Bot User OAuth Token (`xoxb-...`)
4. **Save**

**Use in workflows:** Select this credential in any Slack node.

### Security Notes

- Never commit tokens to git
- Store in n8n credential manager (encrypted)
- Rotate tokens if compromised
- CF Access Bypass policy is path-scoped — admin UI remains OTP-gated

---

## 6. Testing & Verification

### Quick Verification Checklist

**✓ Infrastructure (Cloudflare Tunnel model):**
- [ ] `cloudflared` systemd service running (`sudo systemctl status cloudflared`)
- [ ] Tunnel shows Healthy in CF Zero Trust → Tunnels
- [ ] CF Access Bypass app covers `/webhook` path
- [ ] `curl -X POST https://yourdomain.com/webhook/slack-endpoint -d '{"type":"url_verification","challenge":"abc"}' -H "Content-Type: application/json"` returns `{"challenge":"abc"}` (not a login redirect)

**✓ Slack App:**
- [ ] App created and installed to workspace
- [ ] All required scopes added (Section 3.2)
- [ ] Event Subscriptions URL shows "Verified ✓"
- [ ] Bot subscribed to `message.channels` and `message.groups` events
- [ ] Bot invited to test channel

**✓ n8n Workflow:**
- [ ] Workflow activated (toggle ON)
- [ ] Webhook node listening on correct path
- [ ] URL verification response node configured with `$json.body.challenge`
- [ ] Bot message filter working
- [ ] Slack credential configured with Bot Token

**✓ End-to-End Test:**
1. Send message in Slack channel where bot is member
2. Check n8n execution log — should show triggered workflow
3. Verify data flows through all nodes correctly
4. Check routing goes to correct branch (admin vs user channel)

### Manual Testing Commands

**Test webhook bypass (CF Tunnel):**
```bash
curl -X POST "https://yourdomain.com/webhook/slack-endpoint" \
     -H "Content-Type: application/json" \
     -d '{"type":"url_verification","challenge":"test123"}'
```
Expected: `{"challenge":"test123"}`

**Test Slack API token validity:**
```bash
curl -X POST https://slack.com/api/auth.test \
     -H "Authorization: Bearer xoxb-YOUR-TOKEN"
```
Expected: `{"ok": true, "user": "bot_name", ...}`

**Test private channel access:**
```bash
curl -X GET "https://slack.com/api/conversations.list?types=private_channel" \
     -H "Authorization: Bearer xoxb-YOUR-TOKEN"
```
Expected: List of private channels (verifies `groups:read` permission)

**Check cloudflared tunnel health:**
```bash
sudo systemctl status cloudflared
# Look for: active (running)
sudo journalctl -u cloudflared --since "10 minutes ago"
# Look for: "Connection registered" and no error lines
```

---

## 7. Webhook Signature Verification (Security — TD-04)

### Why Verify Signatures

Slack signs all webhook requests to verify they genuinely come from Slack, not a malicious third party.

**Reference:** https://api.slack.com/authentication/verifying-requests-from-slack

**Status for Chinmay Astro:** TD-04 — medium priority, post-MVP. The CF Access Bypass policy scoped to `/webhook` path provides a first layer; signature verification adds defence-in-depth inside n8n.

### Implementation in n8n

**Add after Webhook node, before processing:**

**Node Type:** Code
**Purpose:** Verify request signature

```javascript
const crypto = require('crypto');

const timestamp = $input.item.json.headers['x-slack-request-timestamp'];
const signature = $input.item.json.headers['x-slack-signature'];
const body = JSON.stringify($input.item.json.body);

// Signing secret from Slack App > Basic Information
const signingSecret = 'YOUR_SIGNING_SECRET_HERE';

// Reject stale requests (replay attack prevention)
const currentTime = Math.floor(Date.now() / 1000);
if (Math.abs(currentTime - timestamp) > 60 * 5) {
  throw new Error('Request timestamp too old');
}

// Verify signature
const sigBaseString = `v0:${timestamp}:${body}`;
const expectedSignature = 'v0=' + crypto
  .createHmac('sha256', signingSecret)
  .update(sigBaseString)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid Slack signature');
}

return $input.item.json;
```

---

## 8. API References

**Slack API Documentation:**
- Main docs: https://api.slack.com/
- Events API: https://api.slack.com/apis/connections/events-api
- Message events: https://api.slack.com/events/message
- OAuth scopes: https://api.slack.com/scopes
- Web API methods: https://api.slack.com/methods

**n8n Documentation:**
- Slack node: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/
- Webhook node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- Expressions: https://docs.n8n.io/code/expressions/

**Cloudflare Documentation:**
- Tunnel setup: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- Access policies: https://developers.cloudflare.com/cloudflare-one/policies/access/

**Useful Slack API Methods:**
- `chat.postMessage`: https://api.slack.com/methods/chat.postMessage
- `conversations.create`: https://api.slack.com/methods/conversations.create
- `conversations.info`: https://api.slack.com/methods/conversations.info
- `conversations.list`: https://api.slack.com/methods/conversations.list

---

**End of Reference Document**
