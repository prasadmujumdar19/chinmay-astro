# Deferred: data-contract / envelope uplift for intermediate workflows

**Context (user direction, 2026-06-29):** The data-contract/envelope work was a dedicated, scoped effort:
1. Inbound entry workflows (WhatsApp, Slack) emit a fixed canonical envelope; their **immediate
   downstreams validate** the core envelope (anything extra is fetched by those workflows themselves).
2. Outbound **utility workflows** accept a fixed contract envelope, **validated as their first step** —
   making envelope construction mandatory for all upstream callers.
3. **Intermediate workflows were intentionally deferred** from this uplift, to keep the contract work
   moving without over-investing.

**Consequence for drift-checks:** the D8/D9 Inputs-contract taxonomy (dedicated inline Inputs block,
declared==read) applies ONLY to workflows that HAVE been uplifted (detectable by a live first-step
envelope-validation guard). For not-yet-uplifted intermediate workflows, a missing/loose pseudo Inputs
block is EXPECTED, not drift — do NOT re-flag.

## Not-yet-uplifted intermediate workflows (D8/D9 not applicable until uplifted)
Verified 2026-06-29: none of these has a first-step envelope-validation guard in live.

- WF-31 Payment Submitted Handler (D9)
- WF-32 Payment Confirmation Receiver (D9)
- WF-33 Payment Approval Processor (D9)
- WF-34 Payment Rejection Processor (D9)
- WF-40 User→Admin Relay (D9)
- WF-41 Admin→User Relay (D9)
- WF-42 Consultation Closer (D8)
- WF-43 Post-Consultation Handler (D8)
- WF-44 Feedback Recorder (D8)

## Already uplifted (carry the guard + explicit Inputs block — keep them CLEAN)
WF-51, WF-53, WF-60, WF-61 (and the inbound entry + immediate-downstream set).

## Future work (not scheduled)
When/if these intermediate workflows are uplifted to the envelope convention, their `.pseudo` must gain a
dedicated Inputs section (required/optional, types, validity) at that time — and only then do D8/D9 apply.
