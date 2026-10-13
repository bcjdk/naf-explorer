# Plan 6b: the link repair ticket comes from Detect

**Source:** owner, during the plan 6 copy review (2026-10-13): the faulty link is a backbone problem, whatever it carries, so its ticket should be raised when the link problem is detected, not at the end of ACME's remediation. **Branch:** `plan-6b`. **ADR:** 0004 (amended).

## Built

- D7 **Link event:** Observability raises a link event (CPH01-ODE01, suspected optical degradation, no service, no status) to Fault Management and Orchestrator.
- D8 **Ticket:** Orchestrator sends ITSM the repair request "Fix suspect link CPH01-ODE01", derived from the link event only.
- Old D7/D8 become D9/D10. The remediation workflow completes in R14 again; R15 is the closing only ("its repair request from Detect is still open in ITSM"). The workflow card drops "request repair".
- "Service-impact event" becomes **Event** (owner's choice): one kind, versions link problem → loss violation → cleared, stacked in the existing card. 40 beats.
- Card headers use `text-wrap: pretty`: with `balance`, Chrome ran the type text under the floated "by" (link event, evidence, decision). The layout test now checks for that overlap.

## Rulings

- The link event's version label is "link problem": "link degradation" can't wrap in the 68px lane.
- Orchestrator does no work pill for the ticket, like the apply requests.
