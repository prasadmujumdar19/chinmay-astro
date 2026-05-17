## Stopping Point
Sprint `tech-debts` Batches 1–4 are fully complete; Batch 5 (P1d) has not started.

## Next Action
Run `/n8n-whatsapp-methodology:build-sprint @docs/Tech_Debts.md` — it will reload `.methodology/sprint-tech-debts-state.md`, find the first pending item in Batch 5 (TD-023, WF-10 status check), and continue from there.

Batch 5 items:
- TD-023 (WF-10 relay path has no user status check — admin notes sent during payment_submitted, UUID `wMh0oBRtJbvhLgOf`)
- TD-024 (WF-43 no button_reply routing for post-consult buttons; hard dep on TD-015 which is now done, UUIDs `3va0M06kijgyLejf` for WF-43 and `PubCsNTOspF3xqXZ` for WF-02)

## Blockers
**CRITICAL for TD-024**: Button IDs defined in TD-015 (now done): `btn_feedback` → WF-44 Feedback Recorder, `btn_rebook` → WF-45 Rebook Handler. WF-02 must route `button_reply` with these IDs to WF-43. WF-43 must then dispatch based on button ID: btn_feedback → WF-44, btn_rebook → WF-45.

WF-45 (Rebook Handler) was flagged by post-batch regression as potentially needing a state guard (similar to WF-33 TD-021, WF-42 TD-022). Not in current sprint plan — note for potential future tech debt.

WF-34 (Payment Rejection Processor) also has no state guard after Load User by Phone (pre-existing gap discovered during Batch 3 regression). Not in current sprint plan.

`backups/` directory: backup scripts create `backups/` in project root, which is blocked by stop hook (allowed dirs: `.claude`, `.methodology`, `.superpowers`, `docs`, `scripts`, `workflows`, `archive`). This session moved `backups/` to `archive/backups/`. Future sessions must do the same or the backup script output path should be changed to `archive/backups/` permanently.

New pattern for plugin: `removeConnection` and `addConnection` operations in `n8n_update_partial_workflow` use flat `source`/`target` fields (not nested under `connection`). For IF nodes, use `branch: "true"/"false"` not `sourceOutput: 0/1`. Document in `build-workflow` skill under Step 5 connection operations.

## Changed Reference Values
Batch 3 completions:
- WF-60 (6H75p935FpBVBQtV): all 6 disabled nodes re-enabled (TD-004)
- WF-11 (GoTYo0GS2y8qjjkw): 9 disabled nodes re-enabled — Confirm Consultation Closure, Confirm User Blocked, Get Active Users, Format List, Send List To Admin, Get Stats, Format Stats, Send Stats To Admin, Unknown Command Response (TD-005)
- WF-33 (NcHZedq9ycnAQ9SW): IF guard "User in Correct State?" added at [656,-200] between Load User by Phone and Update Payment Status; "Notify Admin Wrong State" Slack error node at [900,-200] (TD-021)

Batch 4 completions:
- WF-42 (fx70vqyJtRdF2DgR): "Prepare Feedback Message" patched to interactive buttons (btn_feedback, btn_rebook); IF guard "User in Correct State?" added at [432,-200]; "Notify Admin Wrong State" error Slack at [640,-200] (TD-015, TD-022)
- WF-31 (HB8nXudAtk9iXz7C): Slack relay fan-out added — "Load User for Relay" Postgres at [-600,200], "Prepare Admin Relay" code at [-380,200], "Relay to Admin Slack" executeWorkflow at [-160,200]; trigger now fans out to both WF-25 branch and relay branch (TD-016)
