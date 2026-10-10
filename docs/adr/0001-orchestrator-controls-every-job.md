# ADR 0001: Orchestrator controls every job it starts

- **Status:** accepted, 2026-10-10
- **Amends:** `docs/brief/02-domain-and-semantics.md`, `03-story-and-scenario.md`, `07-acceptance-checklist.md`

## Context

A beat review during brainstorming asked whether Orchestrator actually controls the workflows it sequences. In the original decided flow it didn't, in four places:

1. Executor never reported that an apply had finished, so Orchestrator sent *verify* without knowing whether the apply had succeeded.
2. Observability never confirmed onboarding, so Orchestrator sent *apply* without knowing assurance was ready.
3. *Verify* was addressed to Collector, but the answer (*in sync*) came from Intent, whose drift check was triggered by arriving content rather than by a request.
4. *Query path B health* assumed Orchestrator knew the alternate path. It could only know that by reading derived network intent, which it must never receive.

## Decision

- Every signal that asks a responsibility to do work is answered to Orchestrator. The new signals are *assurance onboarded*, *applied*, *read back done* and *check drift*. *Verify applied state* becomes *read back applied state*.
- Configuration verification becomes two beats per apply: **read back** (Collector) and **check drift** (Intent).
- The query becomes *query alternate-path health*. Observability identifies path B from Collector's enrichment tags. The remediation decision names only the link to exclude, and Intent selects the path.
- The violation event carries the implicated link and the current path, so that the policy's inputs reach Orchestrator through Observability.
- A running workflow subscribes to the outcome it waits for (service state HEALTHY) and unsubscribes on completion. Outside a workflow, Orchestrator reacts to events.
- Orchestrator coordinates work between responsibilities, not the steps inside one. Intent's record → derive → desired state remains one job, answered by *desired state ready*.
- The TWAMP-Light probe is part of desired state v1, so Executor configures it.

**Unchanged:** content still travels directly from producer to consumer and never through Orchestrator.

## Consequences

- There are more signals but no new artifacts, so the pacing rule is unaffected. The story grows from 34 to 36 beats.
- New automated checks cover request/answer pairing, the apply → applied → read back → check drift order, onboarding before the first apply, and Orchestrator never naming a path it wasn't told.
