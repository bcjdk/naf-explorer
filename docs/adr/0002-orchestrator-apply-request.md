# ADR 0002: Orchestrator orders the apply with its own work order

- **Status:** accepted, 2026-10-11; amended by ADR 0004 (repair request)
- **Amends:** `CLAUDE.md`, `docs/brief/02-domain-and-semantics.md`, `03-story-and-scenario.md`, `07-acceptance-checklist.md`, ADR 0001

## Context

In plan 2's review, the user found that P7 read as Intent triggering Executor directly. The solid desired-state arrow from Intent to Executor dominated the beat, and the coordination signal *apply desired state* was easy to miss. The user wanted the workflow Orchestrator started to come back to Orchestrator, with Orchestrator visibly routing the next job to Executor.

The hard rule stays: Intent's content (desired state) never travels through Orchestrator.

## Decision

- *Apply desired state* is no longer a signal. Orchestrator hands Executor its own artifact, an **apply request**: a work order that names a desired-state version and nothing more. Executor answers it with *applied*, as before.
- Executor still takes the desired state directly from Intent. Content never travels through Orchestrator.
- The apply request gets its own beat, **Order apply** (P7, R6), before the apply beat. A shared beat would break the motion rule: an artifact appears only after everything addressed to its producer in that beat, and *applied* is addressed to Orchestrator.
- Orchestrator now hands over three artifacts of its own: an intent request, a remediation decision and an apply request.

## Consequences

- The story grows from 36 to 38 beats: Provision 15, Detect 8, Remediate 15. There are 20 artifact kinds.
- Executor receives desired state from Intent and apply requests from Orchestrator. The request/answer pairing checks the apply request against *applied*. Every apply still follows *desired state ready* for its version, and the first follows *assurance onboarded*.
