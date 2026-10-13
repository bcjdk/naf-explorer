# Story and scenario (decided)

The causal flow below is decided. How it maps to individual on-screen steps ("beats") is for the new build, under the pacing rule at the end of this document. The earlier build used 33 beats: Provision 13, Detect 8, Remediate 12. Revision 2026-10-10 (ADR 0001) added completion signals so Orchestrator controls every job it starts, and split verification into *read back* and *check drift*. Revision 2026-10-11 (ADR 0002) made the apply an Orchestrator work order (*apply request*) in its own step.

## Scenario facts

All protocol choices and values are **illustrative**. NAF does not require SR-MPLS, gNMI or TWAMP, and the UI should say so where Technical detail appears.

| Fact | Value |
|---|---|
| Customer / service | ACME, service `ACME-L3VPN-001`, L3VPN |
| Sites (PE routers) | `CPH01`, `AAR01` |
| Other routers | `ODE01`, `KOL01` |
| Topology | Path A: CPH01 — ODE01 — AAR01 (preferred). Path B: CPH01 — KOL01 — AAR01 (alternate). |
| SLO (part of the service intent) | packet loss < 0.1% |
| SLI | **Defined in Intent** (part of the SLO definition): ACME probe loss, worst direction, per 1-minute interval. **Measured and computed in Observability.** |
| Steering | SR-MPLS policies with colour 100, one per direction; ACME VRF routes coloured 100 |
| VRF | `ACME`, RD/RT `65000:101` |
| Execution | gNMI Set (apply); gNMI Get (read back for verification) |
| Collection | gNMI streaming telemetry from all four links (Rx power, CRC/FCS, oper-status, IS-IS adjacency) and a two-way TWAMP-Light probe CPH01 ↔ AAR01 inside VRF ACME, steered like ACME traffic (colour 100). The probe is part of desired state v1 and configured by Executor; it follows ACME onto path B without reconfiguration. |
| Fault | The **ODE01→CPH01** fibre direction loses light (optical attenuation). Interface `Hu0/0/0/1` on CPH01 faces ODE01. |
| Rx power at CPH01 `Hu0/0/0/1` | baseline −2.4 dBm; degraded −10.9 dBm; low-warning threshold −9.0 dBm |
| CRC/FCS receive errors | baseline 0; degraded ≈1,240/min; they continue after the reroute because the fibre is still faulty |
| Interface oper-status and IS-IS adjacency | **UP the whole time** |
| ACME probe loss | 0.00% (09:12–09:13) · rising but below 0.1% across 10:41–10:45 · **0.4% AAR01→CPH01 (10:45–10:46)** · 0.00% after reroute (10:48–10:49) |
| Remediation policy | `pol-loss-reroute`, **pre-approved**: when an SLO is violated, the evidence implicates a link on the service's current path, and a healthy alternate path exists, request that the service's derived network intent exclude that link |
| Times | Provision 09:10–09:13 · Detect 10:41–10:46 · Remediate 10:47–10:49 |

Direction matters. Low Rx at CPH01 means the **ODE01→CPH01** strand is degraded, so the loss shows up on **AAR01→CPH01** traffic. A one-way CPH01→AAR01 probe would not see it.

## Causal flow

Each line is one causal change. "→" is an artifact handoff; "⇢" is a coordination signal.

### Provision: service intent becomes a working, verified service

1. **Orientation.** One automation system: six responsibilities, The Network beneath them, solid lines for content and dashed lines for coordination. These are roles, not products.
2. **Request.** Through the Portal, ACME requests connectivity between CPH01 and AAR01 with packet loss below 0.1%. Portal → Orchestrator (*service request*). Orchestrator starts the provisioning workflow.
3. **Record.** Orchestrator → Intent (*intent request*). Intent records **service intent** in ACME's terms.
4. **Derive network intent.** Intent derives **network intent**: SR policy colour 100, preferred path A via ODE01, alternate path B via KOL01.
5. **Derive desired state.** Intent derives per-device **desired state** for CPH01 and AAR01. Intent ⇢ Orchestrator: *desired state v1 ready*.
6. **Onboard assurance.** Orchestrator ⇢ Observability: *onboard service assurance*. Intent publishes the **SLO definition** from the service intent; Intent → Observability (*SLO definition*, direct). Observability creates its **SLO rule**. Observability ⇢ Orchestrator: *assurance onboarded*.
7. **Order apply.** Orchestrator → Executor (*apply request*: its own work order naming desired state v1; ADR 0002).
8. **Apply.** Intent → Executor (*desired state v1*, direct). Executor renders and applies the **configuration change** to CPH01 and AAR01, including the TWAMP-Light probe → The Network. ACME's traffic now uses path A. Executor ⇢ Orchestrator: *applied v1* (the commit succeeded; that is not verification).
9. **Read back.** Orchestrator ⇢ Collector: *read back applied state*. The Network → Collector (configuration read back via gNMI Get). Collector → Intent (*observed device state*, direct). Collector ⇢ Orchestrator: *read back done*.
10. **Check drift.** Orchestrator ⇢ Intent: *check drift v1*. Intent's drift check finds **no drift**, so desired state is marked IN SYNC. Intent ⇢ Orchestrator: *in sync*. A mismatch would lead the workflow to roll back.
11. **Collect.** "Configured as intended is not yet a working service." The Network → Collector (raw signals); Collector **normalizes** them.
12. **Enrich.** Collector tags the measurements with service IDs from its cached intent. Collector → Observability (*enriched observations*).
13. **Compute SLI.** Observability computes ACME's SLI: 0.00% loss in the last minute.
14. **Evaluate.** Observability evaluates the SLI against the SLO rule: within objective, so service state is **HEALTHY**.
15. **Report.** Observability → Portal and Orchestrator (*service state HEALTHY*; the provisioning workflow has been waiting for it). Orchestrator completes the provisioning workflow and hands the completed workflow record to the Portal, so ACME's order shows as completed (ADR 0005).

### Detect: network signals become service understanding

1. **Fault (ground truth).** The ODE01→CPH01 fibre strand starts to lose light. CPH01 still sees a signal, so the link stays UP and IS-IS stays up, but frames arrive with bit errors. The automation system doesn't know yet. Show on the topology what fails.
2. **Collect.** Raw signals, each in its own format: falling Rx and rising CRC/FCS from CPH01, loss from ACME's probe, oper-status and IS-IS state from all links. The Network → Collector.
3. **Normalize.** Collector puts the signals into one common shape. The light has dropped, errors are rising and ACME's probe is losing packets, while the interface and routing still say UP.
4. **Enrich.** Collector tags each measurement from its cached intent: `Hu0/0/0/1` → link CPH01–ODE01 → path A → ACME. Collector → Observability.
5. **Compute SLI.** Observability computes ACME's SLI: 0.4% loss in the last minute (worst direction AAR01→CPH01).
6. **Correlate.** Observability correlates the SLI with the light and error signals on path A in the same window. The result is consistent with optical degradation: a strong clue, **not proof**.
7. **Link event.** The evidence points at a backbone link, whatever it carries. Observability raises a **link event** (CPH01–ODE01, suspected optical degradation, no service named, no status) and sends it to Fault Management and to Orchestrator (ADR 0004).
8. **Ticket.** Orchestrator sends ITSM a **repair request** for the link. Only people can repair the fibre; the request needs no answer.
9. **Evaluate.** Observability evaluates the SLI against the SLO rule. 0.4% breaches the < 0.1% objective, so service state is **DEGRADED**, even though the interface is UP and routing is established. Observability → Portal. (No workflow is running, so Orchestrator has no subscription to service state; it acts on the event in the next step.)
10. **Raise event.** Observability raises a **service-impact event** (SLO **VIOLATED**), carrying the implicated link CPH01–ODE01 and ACME's current path A from the evidence, and sends it to Fault Management and to Orchestrator. Lesson: UP does not mean healthy; device state is not service state.

### Remediate: change the network, restore the service, keep the repair visible

1. **Start workflow.** Orchestrator starts a remediation workflow for the event, under the pre-approved policy.
2. **Query alternate path.** The event names the implicated link (CPH01–ODE01) and ACME's current path (A). Orchestrator ⇢ Observability: *query alternate-path health* for ACME. Observability identifies the alternate (path B) from Collector's enrichment tags, assesses it from link telemetry (normal Rx, no errors, UP) and sends Observability → Orchestrator (*path B health: HEALTHY*).
3. **Evaluate policy.** The workflow evaluates the policy and sends Orchestrator → Intent (*remediation decision*: exclude CPH01–ODE01 for ACME). The decision names only what to exclude; Intent selects the path. In this scenario the workflow evaluates the policy; other designs may evaluate policy elsewhere.
4. **Record.** **Service intent is UNCHANGED.** Intent records **derived network intent v2**: exclude CPH01–ODE01, select path B.
5. **Derive.** Intent derives **desired state v2**. Intent ⇢ Orchestrator: *desired state v2 ready*.
6. **Order apply.** Orchestrator → Executor (*apply request* naming desired state v2; ADR 0002).
7. **Apply.** Intent → Executor (*desired state v2*, direct). Executor applies the **configuration change v2** → The Network. ACME's traffic moves to path B via KOL01; the probe follows, because it is steered by colour 100. Executor ⇢ Orchestrator: *applied v2*.
8. **Read back.** Orchestrator ⇢ Collector: *read back applied state*. The Network → Collector (read back). Collector → Intent (*observed device state v2*). Collector ⇢ Orchestrator: *read back done*.
9. **Check drift.** Orchestrator ⇢ Intent: *check drift v2*. No drift (IN SYNC). Intent ⇢ Orchestrator: *in sync*.
10. **Collect.** Collector collects and normalizes fresh measurements.
11. **Enrich.** Collector tags them from its updated cached intent: the ACME probe is now on path B, and CPH01–ODE01 no longer carries ACME. Collector → Observability.
12. **Compute SLI.** 0.00% loss in the last minute.
13. **Evaluate.** Against the same, unchanged SLO rule, service state is **HEALTHY**.
14. **Report and clear.** Observability → Portal and Orchestrator (*service state HEALTHY*; the remediation workflow has been waiting for it). Observability **clears** the service-impact event in Fault Management (**CLEARED**). Orchestrator completes the remediation workflow.
15. **Closing.** The fibre is still faulty, and its repair request from Detect is still open in ITSM (ADR 0004). The service is healthy while the link is degraded: device state is not service state, in both directions. "Here the remediation policy was pre-approved, so the loop closes automatically. Another deployment could pause here for operator approval."

## Artifacts

| Artifact | Producer | Consumers | Versions / states |
|---|---|---|---|
| Service request | Presentation (Portal) | Orchestrator | submitted |
| Intent request | Orchestrator | Intent | create service |
| Service intent (includes the SLO) | Intent | — | one version; **never changes** |
| Derived network intent | Intent | — | v1 (path A preferred) · v2 (exclude CPH01–ODE01, path B) |
| Desired network state (per device) | Intent | Executor | v1 · v2 |
| SLO definition | Intent | Observability | one version |
| SLO rule | Observability | — | one version |
| Workflow record: provision / remediation | Orchestrator | Portal (provision, once completed; ADR 0005) | running · completed |
| Remediation decision | Orchestrator | Intent | exclude CPH01–ODE01 |
| Apply request (ADR 0002) | Orchestrator | Executor | v1 · v2 (each names a desired-state version only) |
| Repair request (ADR 0004) | Orchestrator | ITSM | CPH01–ODE01, from the link event (no status) |
| Configuration change (per device) | Executor | The Network | v1 · v2 |
| Raw signals | The Network | Collector | config read-back A · baseline telemetry · degraded · config read-back B · after reroute |
| Observed device state | Collector | Intent | v1 · v2 |
| Normalized observations | Collector | — (internal) | baseline · degraded · after reroute |
| Enriched observations | Collector | Observability | baseline · degraded · after reroute |
| SLI | Observability | — | 0.00% · 0.4% · 0.00% |
| Correlated evidence | Observability | — | suspected optical degradation (no status) |
| Service state | Observability | Portal, Orchestrator | HEALTHY · DEGRADED · HEALTHY |
| Event | Observability | Fault Management, Orchestrator | link problem (link event; no status) · loss violation (service-impact, VIOLATED; carries implicated link and current path) · cleared (CLEARED) |
| Path B health | Observability | Orchestrator | HEALTHY |

Notes:

- Derived intent, desired state, configuration change and observed state show **v2 stacked over v1**.
- Each Presentation surface shows only the latest artifact it has **received**. For example, the Portal still shows HEALTHY until the DEGRADED service state actually reaches it.
- An artifact stays visible, subdued, once it has appeared.

## Statuses and markers

| Word | Meaning | Treatment |
|---|---|---|
| ✓ HEALTHY | service or path meets its objective | neutral |
| ▲ DEGRADED | service state degraded; also the physical link (ground truth) | achromatic or patterned |
| ✕ VIOLATED | SLO breached (on the service-impact event only) | one distinct status hue that no responsibility uses; AA contrast |
| ✓ CLEARED | a raised event has been resolved | neutral, distinct from HEALTHY by its word |
| = UNCHANGED / = IN SYNC | markers, not statuses | neutral |

Device values such as `UP` are plain text, **never** a status chip.

## Pacing rule

- **One new artifact per responsibility per step.** Several responsibilities may each produce one artifact in the same step, and one artifact may be handed to several receivers at once.
- **Causal motion order:** an artifact appears only after every signal or handoff addressed to its producer in that step. Network-produced artifacts appear just before their own handoff.
