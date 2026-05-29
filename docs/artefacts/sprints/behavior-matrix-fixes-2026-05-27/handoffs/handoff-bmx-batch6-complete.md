## Stopping Point
Batch 6 (BMX-P2-WF23) complete — WF-23 Pre-Form Intent Filter rebuilt author-fresh (21→45 nodes, same ID `VpCER0Vqq3NYJGpI`, active), verified (lint 0, MCP strict valid:true 0 errors, dangling/runtime/tv-floor clean), post-batch regression PASS, state.md + registry + dependency-map updated. Batches 1–6 ✅ · Batches 7–10 ⬜.

## Next Action
Start Batch 7 (BMX-P3-WF25) — the central safety-net hub. Full-replace rebuild on the SAME ID `eTV1lUcYrXBg2q2T` (4 callers WF-30/31/40/43 reference it by ID — do NOT mint a new ID). Carry over surviving nodes verbatim (Gemini classify HTTP, parse Code, Route switch); generate U1/U2 calls + consultation_active D4 relay-return + clarifier consolidation; unify block on `blocked` + legacy `blocked_reason`/`blocked_at`/`blocked_by`; retire WF-46 from this path. Read `docs/pseudocode/WF-25.pseudo` (Batch 3) as the design source. XL item — built alone, BEFORE its handlers (Batch 8). Use jq+PUT for nested-array edits, verify with re-fetch ([[feedback_n8n_mcp_nested_array_update]]).

## Blockers
- Carried plugin-improvement notes in `followups.md` (flush at sprint close via `flush-plugin-improvements`): (1) Batch-4 consumer-contract acceptance gate at build-workflow Step 6; (2) Batch-4 Step-6a dangling-ref scan should also cover connection TARGET names, not just `$('…')` expression refs.
- New plugin-improvement candidate from this batch (flush at sprint close): a contract-emit/payload Set node placed DOWNSTREAM of an `executeWorkflow` caller in a series chain MUST read its source fields via `$('NamedNode').first().json`, NOT `$json` — after an exec call `$json` is the sub-workflow's return, not the original envelope. Surfaced in WF-23's non-text/alias branches (WF-50 send precedes the U2 escalate). Candidate for build-workflow Step 5f.1/5f.2.
- CLAUDE.md "Key Credential IDs" table WhatsApp Flow ID drift: lists `1408011897720771`; live (and WF-21/WF-23 builds) use `2260297164474475`. Correct at sprint close. (Also a stale ref at registry line ~343 legacy table.)

## Changed Reference Values
None changed this session. (WF-23 retains ID `VpCER0Vqq3NYJGpI`; callee IDs unchanged: U1 `ONzUJ1Lj9hIbUYT0`, U2 `9Zt23yt8k8PQSgji`, U3 `tJknCwk2PzLpEwTX`, WF-50 `BUVun38WEKb12zg9`.)
