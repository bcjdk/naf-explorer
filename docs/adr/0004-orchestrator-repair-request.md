# ADR 0004: Orchestrator asks ITSM for the repair

- **Status:** accepted, 2026-10-13; amended the same day (plan 6b): the request comes from a link event in Detect
- **Amends:** ADR 0002, `CLAUDE.md`, `docs/brief/02-domain-and-semantics.md`, `03-story-and-scenario.md`, `07-acceptance-checklist.md`

## Context

_The amendment at the end supersedes where and when the request is made; the Context and Decision below record the first version._

In the owner's walk-through of the Simple view, R15 had Observability send ITSM a repair-needed event. The owner pointed out that Observability doesn't interface with ITSM for this: only Orchestrator knows that ACME was auto-remediated onto path B, because it ran that workflow, and opening a repair ticket is a workflow action, not an observation.

## Decision

- Orchestrator hands over a fourth artifact of its own: a **repair request**, sent to ITSM at the end of the remediation workflow. It names the implicated link (from the violation event, via the remediation decision) and that the service is healthy (from Observability's service state). It does not name the new path: Intent chose it, and nobody told Orchestrator. It derives from the remediation decision and the HEALTHY service state.
- Orchestrator completes the remediation workflow in R15, after the repair request, not in R14.
- Observability no longer produces a repair-needed event. Its service-impact events (raised, cleared) go to Fault Management and Orchestrator.
- The repair request needs no answer: an exception to ADR 0001. It asks no automation responsibility to do work. ITSM only displays it as a ticket, and people do the repair outside automation, so nothing in the story could answer it.

## Consequences

- 21 artifact kinds; the beat count stays 38.
- Orchestrator hands over four artifacts of its own: intent request, remediation decision, apply request and repair request.

## Amendment (plan 6b, 2026-10-13)

The owner pointed out that the faulty link is a backbone problem, whatever services it carries, so its ticket should not wait for ACME's remediation.

- In Detect, right after correlating, Observability raises a **link event** (CPH01-ODE01, suspected optical degradation, no service named, no status) to Fault Management and Orchestrator (D7).
- Orchestrator turns it into the **repair request** to ITSM straight away (D8). The request derives from the link event only and names only the suspect link.
- The remediation workflow no longer has a repair step: it completes in R14, and R15 is the closing.
- "Service-impact event" becomes **Event**, one kind with three versions stacked in one card: link problem, loss violation, cleared.
- 40 beats (Detect 10); still 21 artifact kinds.
