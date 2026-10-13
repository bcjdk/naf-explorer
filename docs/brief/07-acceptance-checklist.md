# Acceptance checklist (decided, stack-independent)

The demo is done when every item holds. Items marked **[auto]** must be automated tests. Run the semantic ones over the canonical scenario data, so they can't be satisfied by the rendering alone.

## Semantics [auto, over scenario data]

- [ ] There is no artifact handoff between Orchestrator and The Network, and a coordination signal can never name The Network.
- [ ] Every coordination signal has Orchestrator as exactly one endpoint.
- [ ] Only Executor sends to The Network (configuration change only), and The Network sends only raw signals, only to Collector.
- [ ] Executor receives only desired state from Intent and apply requests from Orchestrator (ADR 0002), and sends only configuration changes to The Network.
- [ ] Collector receives only raw signals from The Network, sends only enriched observations to Observability and observed device state to Intent, and never produces a status.
- [ ] Every piece of work is done by its owner:
  - **Intent:** record, derive, check drift;
  - **Executor:** render, apply;
  - **Collector:** collect, normalize, enrich, read back;
  - **Observability:** configure SLO, compute SLI, correlate, evaluate SLI vs SLO, raise or clear event, assess path;
  - **Orchestrator:** start or complete workflow, evaluate policy.
- [ ] Intent produces service intent, derived network intent, desired state and the SLO definition, and none of them is ever handed to Orchestrator.
- [ ] The SLO definition goes only Intent → Observability, directly.
- [ ] Service intent has exactly one version, stays visible from when it is recorded to the end, and is marked UNCHANGED during remediation.
- [ ] v2 of derived intent, desired state, configuration change and observed state appears only in Remediate, and derived intent v2 appears only after the remediation decision reaches Intent.
- [ ] Every handoff names an existing artifact version, goes from its producer to a declared consumer, and that version is visible in the step.
- [ ] No artifact version crosses the same boundary twice.
- [ ] Every artifact version is new in exactly one step and never visible before it; lineage only points to earlier or same-step artifacts.
- [ ] Once an artifact appears, it stays visible.
- [ ] Network ground truth:
  - the link is OK before the fault and DEGRADED from the fault onward;
  - the interface and IS-IS are UP throughout;
  - ACME is on path A from provisioning until the reroute, and on path B after it.
- [ ] Status semantics:
  - service state goes HEALTHY → DEGRADED → HEALTHY;
  - path B health is HEALTHY;
  - only the loss-violation event is VIOLATED;
  - the cleared event is CLEARED;
  - evidence, the link event, the repair request and Collector artifacts have no status.
- [ ] The correlation step says "not proof" in both views.
- [ ] Every Presentation handoff names exactly one surface:
  - the request comes from Portal;
  - the violation goes to Fault Management;
  - its clear goes to Fault Management;
  - the link event goes to Fault Management;
  - Orchestrator's repair request, made from the link event in Detect, goes to ITSM (ADR 0004).
- [ ] At most one new artifact per responsibility per step.
- [ ] Every apply is ordered in its own step by Orchestrator → Executor *apply request* (ADR 0002). The apply step ends with Executor ⇢ Orchestrator *applied* for the same version, and is followed immediately by two verify steps:
  - **read back:** Orchestrator ⇢ Collector *read back applied state*, observed state → Intent, then Collector ⇢ Orchestrator *read back done*;
  - **check drift:** Orchestrator ⇢ Intent *check drift*, desired state IN SYNC, and finally Intent ⇢ Orchestrator *in sync*.
- [ ] Every apply request comes after Intent ⇢ Orchestrator *desired state ready* for the same version, and the first comes after Observability ⇢ Orchestrator *assurance onboarded*.
- [ ] Every signal from Orchestrator that requests work is answered to Orchestrator (by a signal or the requested artifact) before Orchestrator sends its next request in that workflow.
- [ ] No signal or Orchestrator artifact names a path that Orchestrator was not told by Observability: the query asks for *alternate-path health*, and the remediation decision names only the link to exclude.
- [ ] The SLO rule exists before the first evaluation; every evaluation produces a service state derived from an SLI computed in an earlier step and the SLO rule.
- [ ] Once the service is healthy again (from the step in which HEALTHY service state reaches Presentation), no Presentation surface shows anything VIOLATED.
- [ ] Every step has non-empty Simple and Technical captions, and every artifact has both a meaning and Technical lines.

## Content [manual review]

- [ ] Simple vs Technical parity: for every step and artifact, Technical adds only identifiers, values, fields, protocol examples or scope notes, never a new causal step.
- [ ] The values are internally consistent (direction of the fault and of the loss, time windows, thresholds).
- [ ] The About window content matches `06`, including the framing statement and the credit.

## Rendering and layout [auto, browser]

- [ ] No card clips its text, in any step, in either view.
- [ ] No cards overlap, every card stays in its region or surface, and no line label covers a card.
- [ ] Every handoff line starts in its source card and ends at its target.
- [ ] The SLO-definition lane never crosses Orchestrator or Presentation.
- [ ] `UP` never appears inside a status chip, and no status chip uses a provenance colour.
- [ ] Every handoff and signal line has a text label.
- [ ] The whole stage fits at 1280×720 and 1920×1080 without scrollbars.

## Interaction and accessibility [auto, browser]

- [ ] The keyboard walks the whole story forward and back; jumping shows the end state; Replay animates.
- [ ] Rapid key presses land exactly N steps later and settle. Toggling the view mid-animation keeps the step, selection and animation.
- [ ] No artifact appears before the signal or handoff that leads to it. Status pulses run to completion.
- [ ] Reduced motion reaches exactly the same end state.
- [ ] The inspector opens on Enter and closes on Esc with focus returned; Back with the inspector open keeps focus on Back; focus never drops to the page.
- [ ] A forward step and Replay keep keyboard focus.
- [ ] The About window opens on every load and refresh and reopens via About; ✕ and Esc close it with focus returned; arrows are blocked while it's open.
- [ ] An automated accessibility scan finds no serious or critical violations at the start, at the SLO breach and at the end (both views), or with About open.
- [ ] Keyboard focus is always visible.
