# ADR 0006: Observability checks configuration conformance

- **Status:** accepted, 2026-10-13
- **Amends:** ADR 0001, `CLAUDE.md`, `docs/brief/02-domain-and-semantics.md`, `03-story-and-scenario.md`, `07-acceptance-checklist.md`

## Context

After an apply, Collector handed the read-back configuration directly to Intent, and Intent checked drift. That put actual network state in the store of intended state, and made Intent judge the network. The NAF reference gives those jobs to Observability: it "persists the actual network state" and "SHOULD … generate events when discrepancies are detected between the actual state (configuration or operational) and the intended state". Intent is "the persistence layer to store the desired state". NAF prescribes no topology; the request/answer shape below is this explorer's choice (ADR 0001).

## Decision

- **Read back (P9, R8):** Orchestrator ⇢ Collector *read back applied state*. Collector reads the devices and hands the **observed device state** to **Observability**, then answers Orchestrator *read back done*.
- **Check conformance (P10, R9):** Orchestrator ⇢ Observability *check config vN*. Intent hands **desired state vN** directly to Observability (never via Orchestrator). Observability compares the observed state with it, semantically rather than as a text diff, and answers Orchestrator *in sync*. A mismatch would lead the workflow to roll back.
- Intent no longer evaluates anything about the network, and desired state no longer carries an "= IN SYNC" marker: Intent owns what should be, Observability owns what is and whether it conforms, Orchestrator owns the workflow and receives the verdict.
- The beat structure is unchanged (40 beats).

## Consequences

- Signals: *check drift* (to Intent) becomes *check config* (id `checkConformance`, to Observability); *in sync* now comes from Observability. Each job is still answered by the responsibility that received it.
- Desired state has two consumers (Executor, Observability); observed device state goes to Observability. Work: Intent records and derives; Observability gains *check conformance*.
- Continuous drift detection remains possible with the same Observability capability (NAF's discrepancy events to Orchestrator) but is not shown. Revision lifecycle (published, targeted, active baselines) and an explicit conformance-result artifact with OUT OF SYNC and INDETERMINATE are out of scope here.
