#!/bin/bash
# Fix Gap 10 on a workflow: Class A (executeWorkflow mappingMode passthrough → defineBelow+value:null)
# + Class B (Code nodes return { ... } → return [{ json: { ... } }]).
#
# Usage: ./fix-workflow.sh <n8n-workflow-uuid>
# Reads N8N_BASE_URL + N8N_API_KEY from environment (caller must source .env).
# Writes intermediate JSONs to $SCRATCH_DIR; PUTs back to n8n.
# Exits 0 on success, non-zero on failure.

set -euo pipefail
WF_UUID="${1:?usage: fix-workflow.sh <wf-uuid>}"
: "${SCRATCH_DIR:?SCRATCH_DIR must be set}"
: "${N8N_BASE_URL:?N8N_BASE_URL must be set}"
: "${N8N_API_KEY:?N8N_API_KEY must be set}"

PRE="$SCRATCH_DIR/wfx-$WF_UUID-pre.json"
POST="$SCRATCH_DIR/wfx-$WF_UUID-post.json"
PUT_BODY="$SCRATCH_DIR/wfx-$WF_UUID-put.json"
WRAP="$SCRATCH_DIR/wrap-returns.py"

# 1. Fetch live JSON
curl -sf -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_BASE_URL/workflows/$WF_UUID" > "$PRE"

# 2. Identify Class A and Class B targets
CLASSA_COUNT=$(jq '[.nodes[] | select(.type=="n8n-nodes-base.executeWorkflow" and .parameters.workflowInputs.mappingMode == "passthrough")] | length' "$PRE")
CODE_NODES=$(jq -r '.nodes[] | select(.type=="n8n-nodes-base.code") | .name' "$PRE")
echo "  Class A targets: $CLASSA_COUNT"
echo "  Code nodes total: $(echo "$CODE_NODES" | grep -c .)"

# 3. Apply Class B (Code-return wrap) per node — only updates if transform changes the body
cp "$PRE" "$POST"
CLASSB_CHANGED=0
while IFS= read -r name; do
  [ -z "$name" ] && continue
  before=$(jq -r --arg n "$name" '.nodes[] | select(.name==$n) | .parameters.jsCode' "$POST")
  after=$(printf '%s' "$before" | python3 "$WRAP")
  if [ "$before" != "$after" ]; then
    jq --arg n "$name" --rawfile new <(printf '%s' "$after") \
      '(.nodes[] | select(.name==$n) | .parameters.jsCode) = $new' "$POST" > "$POST.tmp"
    mv "$POST.tmp" "$POST"
    CLASSB_CHANGED=$((CLASSB_CHANGED + 1))
    echo "    Class B wrapped: $name"
  fi
done <<< "$CODE_NODES"
echo "  Class B changed: $CLASSB_CHANGED"

# 4. Apply Class A: passthrough → defineBelow + value:null on all matched nodes
jq '
  (.nodes[] | select(.type=="n8n-nodes-base.executeWorkflow" and .parameters.workflowInputs.mappingMode == "passthrough") | .parameters.workflowInputs) |=
    (.mappingMode = "defineBelow" | .value = null)
' "$POST" > "$POST.tmp" && mv "$POST.tmp" "$POST"

# 5. Build PUT body
jq '{name: .name, nodes: .nodes, connections: .connections, settings: (.settings // {})}' \
  "$POST" > "$PUT_BODY"

# 6. PUT
HTTP=$(curl -sf -w '%{http_code}' -X PUT \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"$PUT_BODY" \
  "$N8N_BASE_URL/workflows/$WF_UUID" -o "$SCRATCH_DIR/wfx-$WF_UUID-resp.json")
echo "  PUT HTTP: $HTTP"
[ "$HTTP" = "200" ] || { echo "  FAIL: HTTP $HTTP"; exit 1; }

echo "  OK: $WF_UUID"
