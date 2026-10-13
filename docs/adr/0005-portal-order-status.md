# ADR 0005: Orchestrator tells the Portal the order is complete

- **Status:** accepted, 2026-10-13
- **Amends:** ADR 0002, ADR 0004, `CLAUDE.md`, `docs/brief/02-domain-and-semantics.md`, `03-story-and-scenario.md`, `07-acceptance-checklist.md`

## Context

The Portal's service request stayed "submitted" for the whole story: nothing told the Portal that the order was fulfilled. It showed the service as ✓ HEALTHY, which was enough for the story, so it sat in `docs/deferred-work.md` until the owner asked for it to be fixed.

## Decision

- When Orchestrator completes the provisioning workflow (P15), it hands the completed **workflow record** to the Portal. No new artifact kind: the record is Orchestrator's own artifact, and its completion is what the customer needs to know.
- The Portal keeps showing the latest service state it received, and its own service request reads "completed" (and its accessible name ends ", order completed"). An order status is not a replacement for service state: the two are shown side by side.
- Like the repair request (ADR 0004), the record goes to people through Presentation, so it needs no answer under ADR 0001.
- Only the provisioning workflow is reported: remediation is not a customer order.

## Consequences

- Orchestrator hands over five kinds of its own artifact: intent request, remediation decision, apply request, repair request, and the completed workflow record (to the Portal).
- The beat count stays 40; still 21 artifact kinds.
