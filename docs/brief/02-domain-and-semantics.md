# Domain and semantics (decided)

These are requirements. If the build needs to deviate, raise it first.

## The responsibilities

The NAF framework names six responsibilities. In this demo they are **roles**, not products. One product can play several roles, and one role can be spread across several products.

| Responsibility | Does | Does not |
|---|---|---|
| **Presentation** | Lets people and other systems request services and see their state, through surfaces such as a portal, fault management (the NOC's single pane of glass), ITSM (tickets), performance dashboards and APIs. | Decide or act on its own. |
| **Intent** | Records service intent, derives network intent and desired state, and checks drift between observed and desired state. In this scenario it is the source of truth for intended state. | Apply changes to devices. |
| **Orchestrator** | Coordinates workflows across responsibilities using signals. In this scenario it relays requests to Intent, and its remediation workflow evaluates a pre-approved policy and produces the remediation decision; on a link event it asks ITSM for the link's repair. | Configure the network; own service intent, derived network intent or desired state. |
| **Executor** | Renders and applies configuration changes. In this scenario it takes desired state from Intent, which is one common pattern, not a NAF requirement. | Decide what the network should be; verify the outcome. |
| **Collector** | Gathers and normalizes live network state, tags it with service IDs from a locally cached copy of intent, and reads back applied state for drift checks. | Interpret service impact. |
| **Observability** | Turns SLO definitions into SLO rules, computes SLIs, correlates observations and evaluates SLIs against SLOs to understand service state, and raises and clears events. | Change the network. |

**The Network** (infrastructure) sits beneath the six responsibilities and is not one of them. Only Executor writes to it, and only Collector reads from it.

## Signals versus content

There are two different kinds of communication. The demo must keep them visibly distinct.

- **Coordination signals** are workflow messages that always involve Orchestrator: start, *desired state ready*, *onboard service assurance*, *assurance onboarded*, *applied*, *read back applied state*, *read back done*, *check drift*, *in sync*, and *query alternate-path health*. Signals are **not artifacts**.
- **Artifacts** are typed content handed from the responsibility that **produces** them to the one that **uses** them, for example desired state, the SLO definition or observations. Each handoff carries one specific artifact version.

The rules:

- Orchestrator sequences the workflow with signals. **Intent-derived content never travels through Orchestrator.** When Orchestrator hands Executor an apply request (its own work order naming a desired-state version, ADR 0002), Executor takes the desired state directly from Intent. When Orchestrator asks Observability to onboard assurance, Observability takes the SLO definition directly from Intent.
- **Orchestrator stays in control of every job it starts.** Each signal that asks a responsibility to do work is answered to Orchestrator when that work is done (*desired state ready*, *assurance onboarded*, *applied*, *read back done*, *in sync*, or the requested artifact), and Orchestrator sends the next job only after that answer. Orchestrator coordinates work **between** responsibilities, not the steps **inside** one: Intent's record → derive network intent → derive desired state runs as one job, answered by *desired state ready*.
- Orchestrator never learns intended state by reading it. Anything its workflow needs to decide (the implicated link, the current path, whether a healthy alternate exists) reaches it in Observability's artifacts, and its decisions name only what to change (for example "exclude CPH01–ODE01"), never the resulting path: Intent selects that.
- A running workflow that waits for an outcome subscribes to it (for example "wait for service state HEALTHY") and closes the subscription when it completes. Outside a workflow, Orchestrator reacts to **events**, not to raw service state.
- Orchestrator hands over only its **own** artifacts: an *intent request* (relaying a service request to Intent), a *remediation decision* (an intent change request), an *apply request* (a work order naming a desired-state version, ADR 0002) and a *repair request* (asking ITSM for the physical repair automation cannot do, ADR 0004), and tells the Portal its order is complete with the completed provisioning *workflow record* (ADR 0005).
- Every artifact handoff names exactly one artifact version, and must go from that artifact's producer to one of its declared consumers.
- An artifact version is transferred across a given boundary at most once. Re-using it later is "in use", not a new transfer.

## Two kinds of enrichment

- **Structural enrichment (Collector):** tagging measurements with authoritative identifiers, such as interface → link → path → service ID. It comes from Collector's locally cached copy of intent. How that cache stays in sync is out of scope and isn't shown as a handoff. Tagging is not interpretation.
- **Operational enrichment (Observability):** turning observations into meaning:
  - compute the SLI;
  - correlate signals (a strong clue, not proof of root cause);
  - evaluate the SLI against the SLO rule;
  - set the service state;
  - raise link events and raise or clear service-impact events.

## Two kinds of verification

- **Configuration verification:** after Executor signals *applied* (a successful commit, which is not verification), Orchestrator asks Collector to *read back applied state*. Collector reads back the applied configuration, hands the observed device state directly to Intent, and signals Orchestrator *read back done*. Orchestrator then asks Intent to *check drift*. Intent's drift check confirms that the observed state matches the desired state and signals Orchestrator *in sync*. A mismatch would lead Orchestrator's workflow to roll back; the story only mentions this.
- **Service verification:** "configured as intended" is not "working". Observability computes the SLI from live measurements and evaluates it against the SLO rule to decide whether the service is healthy.

## Service assurance onboarding

When a service is provisioned and its desired state is ready, Orchestrator's workflow asks Observability to **onboard service assurance**. Observability takes the **SLO definition** directly from Intent, creates its own **SLO rule**, and signals Orchestrator *assurance onboarded*. Orchestrator applies the configuration only after that, so assurance is watching from the first packet. Evaluation later uses that rule; it does not ask Intent again.

**SLI ownership (decided):** the SLI is *defined* in Intent, as part of the SLO definition: which probe, worst direction, 1-minute window, objective. The SLI is *measured and computed* in Observability, from enriched observations, and evaluated against the SLO rule.

## Alarm lifecycle

- Observability **raises** a link event when correlation points at a suspect link (no service named), and a service-impact event when the SLO is breached. It sends both to fault management and to Orchestrator.
- When the service is healthy again, Observability **clears** that event in fault management. A surface must never keep showing an open violation after recovery.
- The physical fault is reported to ITSM as repair work as soon as it is detected: Orchestrator turns Observability's link event into a repair request (ADR 0004). It is separate from any service's remediation.
