## Stopping Point
Sprint `tech-debts` Batch 8 (P2c) is fully complete; Batch 9 (P2d) has not started.

## Next Action
Run `/n8n-whatsapp-methodology:build-sprint @docs/Tech_Debts.md` — it will reload `.methodology/sprint-tech-debts-state.md`, find the first pending item in Batch 9 (TD-010, WF-11 UNBLOCK command), and continue from there.

Batch 9 items:
- TD-010 (WF-11 add UNBLOCK admin command — UUID from registry: look up WF-11 n8n ID)
- TD-026 (WF-11 UNBLOCK status guard — must follow TD-010, same workflow)
- TD-017 (WF-41? — non-text message forwarding during consultation_active — Documentation change, check what the accepted solution is)

## Blockers
**WF-23 may need stop_intent routing:** Post-batch regression flagged WF-23 (Pre-Form Intent Filter) as a sibling of WF-30/WF-31 with the same intent filtering pattern. If a pre-form user sends an ambiguous opt-out message (not the exact keyword "STOP"), WF-25 may classify it as `stop_intent` but WF-23's `Is Pass-Through Intent?` node does NOT yet exclude `stop_intent`. This means the user's opt-out intent would be silently ignored. Consider adding a new tech debt item or adding TD-028's stop_intent fix to WF-23 before Batch 9 closes.

**removeConnection fails for executeWorkflowTrigger nodes:** Not just nodes with `?` in their names — trigger nodes ("When Executed by Another Workflow") also fail `removeConnection`. Workaround: use `n8n_update_full_workflow` to rewire trigger connections. New pattern for plugin: document that `removeConnection` is unreliable for trigger-type nodes — add note to `build-workflow` skill.

**phoneNumber field name in archive SELECT (carried from Batch 7):** The Postgres SELECT in WF-47 and WF-46 uses `$('When Executed by Another Workflow').item.json.phoneNumber`. Verify during smoke test — if archive doesn't fire, check field name in trigger payload.

## Changed Reference Values
Batch 8 completions:
- WF-25 (eTV1lUcYrXBg2q2T): added Gemini error branch — Handle Gemini Error node at [-800,160] (TD-029)
- WF-30 (gGJBY5fJha0Let8I): stop_intent routing added — Is Stop Intent? + Call WF-47 Unsubscribe nodes at [160,160] and [380,160] (TD-028)
- WF-31 (HB8nXudAtk9iXz7C): same stop_intent fix as WF-30 — nodeCount 8→10 (TD-028)
- WF-44 (Du2CJ3OTohRFZYoA): WF-25 intent classifier inserted before Save Feedback — nodeCount 4→7; rebook_intent → WF-45 (TD-032)
- All batches 1–8 committed to GitHub: `c9c099c` on `prasadmujumdar19/chinmay-astro` main
