# Deferred work

- **Portal order status.** The Portal's service request stays "submitted", and no one tells the Portal that the order is complete. The Portal shows the service as ✓ HEALTHY, which is enough for the story. Adding an "order completed" handoff would mean a new artifact.
- **Plan 6: R2's Simple caption** omits Observability answering Orchestrator with path B health. This is a parity item.
- **Plan 6: ds1 probe line.** Write "CPH01 ↔ AAR01 (CPH01 sender, AAR01 stateful reflector)".
- **Plan 6: Copy trimmed to fit (plan 2), for review.** Shortened to fit fixed card slots: ev-viol (meaning, Technical), evid (meaning, Technical), pathB (meaning, Technical), norm-deg (Technical), enr-base/enr-deg/enr-after (Technical, and enr-deg's meaning), obs1 (Technical). The test-required substrings are kept.
- **Impeccable flag kept (plan 6):** the hard offset `box-shadow` of stacked earlier versions (`.card.stack-1/-2`) is the stacked-paper look brief 03 asks for ("v2 stacked over v1"); a soft shadow would read as elevation, not as earlier versions. The About eyebrow was removed in plan 6.
- **Plan 6: Three loose `uses` sentences.** pathHealth: "policy moves the service" should read "decides to move". desiredState: "configuration that the apply request names" should read "the desired-state version that the apply request names". serviceRequest (Orchestrator): "relays the request to Intent" blurs ADR 0002; suggested: "It starts a provisioning workflow and asks Intent, with its own intent request, to create the service."
- **Plan 6: Inspect copy omits surfaces.** The About how-to line and the caption hint say "any card, line label or responsibility name"; Presentation surfaces are inspectable too.
- **Plan 6: Make inspectables look clickable.** The owner kept the caption-bar hint ("Click any card, line label…") for now (2026-10-13) because it reads as a stray navigator note; replace it with styling that shows what can be inspected (cards, line labels, responsibility names, surfaces), then retire or relocate the hint.

## Plan 6: shortened for fit (plan 5)

Shortened so the cards fit at the plan 5 type scale. Multi-line Technical payloads are shown with " / " between lines. Invariant-carrying clauses are kept: "even though the interface is UP" and "device state ≠ service state" (ss2), "not yet measured there" and "link telemetry only" (pathB), "not proof" (evid), the "other links" baseline (raw-deg), and "oper UP, IS-IS UP" (every raw sample).

- P2 work (Technical): "start provision/ACME-L3VPN-001" → "start provision"
- R1 work (Technical): "start remediation under pol-loss-reroute" → "start pol-loss-reroute"
- R3 work (Technical): "evaluate pol-loss-reroute" → "evaluate policy"
- ev-viol meaning: "Loss objective violated; suspect CPH01–ODE01 on the current path A." → "Loss objective violated; suspect CPH01–ODE01 on path A."
- ev-viol technical: "acme-loss-violation / ACME-L3VPN-001 · loss < 0.1% / implicated CPH01–ODE01 · path A" → "acme-loss-violation / suspect CPH01–ODE01 · path A"
- pathB meaning: "Path B’s links via KOL01 look healthy: normal light, no errors, UP. ACME is not yet measured there." → "Path B’s links look healthy; ACME is not yet measured there."
- pathB technical: "path B: CPH01–KOL01–AAR01 / Rx −2.1 to −2.6 dBm, CRC 0, UP / link telemetry only, 10:45–10:46" → "Rx −2.1 to −2.6 dBm / CRC 0, UP, 10:45–10:46 / link telemetry only"
- evid technical: "10:45–10:46 · path A / sli 0.4% · Rx −10.9 dBm · CRC ≈1,240/min / suspect ODE01→CPH01, not proof" → "path A · sli 0.4% / Rx −10.9 dBm, CRC ≈1,240/min / suspect ODE01→CPH01, not proof"
- wf-rem technical (plan 6a, to fit the "request repair" step): "remediate acme-loss-violation / policy pol-loss-reroute, pre-approved" → "policy pol-loss-reroute, pre-approved"
- norm-deg technical: "probe_loss 0.4% AAR01→CPH01" → "probe_loss 0.4%"
- raw-base technical: "all links: oper UP, IS-IS UP / twamp-light loss 0.00% both directions" → "oper UP, IS-IS UP · twamp loss 0.00%"
- raw-deg technical: "CPH01 Hu0/0/0/1 Rx −10.9 dBm, CRC 1,240/min / other links: Rx −2.1 to −2.6 dBm, CRC 0 / all links: oper UP, IS-IS UP / twamp-light AAR01→CPH01 loss 0.4%" → "CPH01 Hu0/0/0/1: Rx −10.9, CRC 1,240/min / other links: Rx −2.1 to −2.6 dBm, CRC 0 / oper UP, IS-IS UP · probe loss 0.4%"
- raw-after technical: "CPH01 Hu0/0/0/1 Rx −10.9 dBm, CRC 1,240/min / other links: Rx −2.1 to −2.6 dBm, CRC 0 / all links: oper UP, IS-IS UP / twamp-light loss 0.00% both directions" → "CPH01 Hu0/0/0/1: Rx −10.9, CRC 1,240/min / oper UP, IS-IS UP · twamp loss 0.00%"
- P1 caption (final review): the line legend now names three kinds. Simple: "Solid lines carry content from the responsibility that produces it to the one that uses it;" → "Thick coloured lines carry content from the responsibility that produces it to the one that uses it, thin ones are work inside a responsibility, and". Technical: "Solid = artifact handoff (producer → consumer); dashed" → "Thick solid = artifact handoff (producer → consumer); thin solid = work inside a responsibility; dashed".
- P14: the SLO rule → service state work line spans the 8px column gap in Observability, so its arrowhead nearly fills it. A minimum length would overlap the cards; only a wider column gap fixes it (layout change, not done in plan 6).
