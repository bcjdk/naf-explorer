# ADR 0004: Orchestrator asks ITSM for the repair

- **Status:** accepted, 2026-10-13
- **Amends:** ADR 0002, `CLAUDE.md`, `docs/brief/02-domain-and-semantics.md`, `03-story-and-scenario.md`, `07-acceptance-checklist.md`

## Context

In the owner's walk-through of the Simple view, R15 had Observability send ITSM a repair-needed event. The owner pointed out that Observability doesn't interface with ITSM for this: only Orchestrator knows that ACME was auto-remediated onto path B, because it ran that workflow, and opening a repair ticket is a workflow action, not an observation.

## Decision

- Orchestrator hands over a fourth artifact of its own: a **repair request**, sent to ITSM at the end of the remediation workflow. It names the implicated link and that the service is on path B, both of which Observability told Orchestrator. It derives from the remediation decision and the HEALTHY service state.
- Orchestrator completes the remediation workflow in R15, after the repair request, not in R14.
- Observability no longer produces a repair-needed event. Its service-impact events (raised, cleared) go to Fault Management and Orchestrator.
- The repair request needs no answer. ADR 0001's pairing covers jobs Orchestrator gives responsibilities; Presentation never acts, and the repair itself happens outside automation.

## Consequences

- 21 artifact kinds; the beat count stays 38.
- Orchestrator hands over four artifacts of its own: intent request, remediation decision, apply request and repair request.
