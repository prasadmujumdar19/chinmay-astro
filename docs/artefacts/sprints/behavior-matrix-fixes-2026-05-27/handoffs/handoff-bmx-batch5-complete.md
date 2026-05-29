## Stopping Point
Batch 5 (Phase 2b) of the behavior-matrix-fixes sprint is complete: BMX-P2-WF21 (WF-21 brand-new owner) author-fresh rebuild done (4→39 nodes), verified (lint 0 · strict valid:true 0 errors · dangling-ref clean · 6b per-node strict clean · 4 callee contracts verified), post-batch regression PASS. Batches 1–5 ✅, Batches 6–10 ⬜. Batch 5 work committed+pushed this session.

## Next Action
Start Batch 6 (Phase 2c) — BMX-P2-WF23 rebuild (pre-form owner: has pending_users, no users row). Sibling pattern to WF-21 (U2 thr=5 / U3 stage=pre_form / STOP+REBOOK aliases) but with PRE-FORM CLARIFIERS instead of brand-new silence — STOP-aliases → "nothing to opt out of, complete the form"; REBOOK → "no prior booking, complete the form"; U3 stage=pre_form buckets → re-send/Gemini+form/help+form/redirect+form/silent/block. Per the §11 banner, FIRST surface WF-23's pre-form copy (BMX-06 §11.1 "Pre-form (WF-23)" block) for verbatim user sign-off before any n8n write — and apply the SAME "Dr. Chinmay Mujumdar" naming decision locked for WF-21. Reuse the WF-21 author-fresh script as the structural template (build_wf21.py pattern); WF-23's caller is WF-02 (existing-record-but-pre-form route), confirm via dependency map at build.

## Blockers
- Pending plugin-improvement flush (carried from Batch 4, in followups.md): (1) consumer-contract acceptance → explicit build-workflow Step 6 gate for contract producers; (2) Step 6a dangling-ref scan → also cover connection TARGET names, not just $('…') refs. Flush via `flush-plugin-improvements` at a batch boundary when convenient (user offered the option at Batch 5 close; deferred).
- CLAUDE.md credential-table drift: WhatsApp Flow ID listed as `1408011897720771` but live WF-21 (and the rebuild) use `2260297164474475`. Correct CLAUDE.md at sprint end (Batch 10 / sprint-close).

## Changed Reference Values
- WF-21 (`zM8WbxSdt9nXRoLZ`): rebuilt 4→39 nodes, still active=true, same ID. Now triggered DIRECTLY by WF-01 (brand_new route), calls WF-61(U2)/WF-62(U3)/WF-50/WF-53(U1). Flow ID in use: `2260297164474475`.
