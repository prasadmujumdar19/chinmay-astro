## Stopping Point
Sprint `tech-debts` is in progress: Batch 1 (P0) and Batch 2 (P1a) are fully complete; Batch 3 (P1b) has not started.

## Next Action
Run `/n8n-whatsapp-methodology:build-sprint @docs/Tech_Debts.md` — it will reload `.methodology/sprint-tech-debts-state.md`, find the first pending item in Batch 3 (TD-004, WF-60 re-enable nodes), and continue from there. Batch 3 items: TD-004 (WF-60 re-enable all logging nodes, UUID `6H75p935FpBVBQtV`), TD-005 (WF-11 re-enable admin confirmation + stats nodes, UUID `GoTYo0GS2y8qjjkw`), TD-021 (WF-33 add state guard IF node after Load User by Phone, UUID `NcHZedq9ycnAQ9SW`).

## Blockers
New pattern for plugin: `executeWorkflow` nodes added via `addNode` require a `workflowInputs` field (`{mappingMode, value, matchingColumns, schema, attemptToConvertTypes, convertFieldsToString}`) — omitting it causes `"propertyValues[itemName] is not iterable"` validation error and rollback. Add to `build-workflow` skill under Step 5 (Make the change) as a "Common addNode pitfalls" note.

New pattern for plugin: `removeNode` in `n8n_update_partial_workflow` auto-removes all connections for the deleted node. Never include an explicit `removeConnection` targeting a node that is also being removed in the same call — the operation order causes a "node already removed" error. Add to `build-workflow` skill.

## Changed Reference Values
- WF-33 (NcHZedq9ycnAQ9SW): removed "Prepare Channel Data" + "Call WF-52 Create Channel" nodes; Notify Admin channelId now reads `$('Load User by Phone').item.json.slack_channel_id`
- WF-22 (dr8QM0m92Ml8MvIh): "Call 'WF-50 Send WhatsApp'1" corrected to workflowId `BUVun38WEKb12zg9`
- WF-32 (emUOLWVZiNVxcOe3): 3 nodes added — "Already Payment Submitted?" IF, "Prepare Reassurance Message" code, "Call WF-50 (Already Submitted)"
- WF-00 (JQu1MkK5vgtUCeNO): bot echo filter added to "Parse WhatsApp Message" code node
- TD-014 marked obsolete: `current_consultation_id` and `total_consultations` already exist in live schema
- TD-006 marked obsolete: stale WF-20 "WRONG" note doesn't exist in current registry
