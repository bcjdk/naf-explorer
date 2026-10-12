# Deferred work

- **Portal order status.** The Portal's service request stays "submitted", and no one tells the Portal that the order is complete. The Portal shows the service as ✓ HEALTHY, which is enough for the story. Adding an "order completed" handoff would mean a new artifact.
- **No unit test for `describe`'s network branch** (link and path in each view).
- **Plan 6: Path-naming regex** (`tests/unit/story.test.ts`). It misses "path: B" and "via KOL01". Widen it first in the content pass.
- **Plan 6: R2's Simple caption** omits Observability answering Orchestrator with path B health. This is a parity item.
- **Plan 6: ds1 probe line.** Write "CPH01 ↔ AAR01 (CPH01 sender, AAR01 stateful reflector)".
- **Plan 6: beatTable P8 order assertion.** Use `toMatch(/read back applied state.*read back done/)`.
- **Plan 6: Live region.** The caption is announced, but the chapter, counter and title are not.
- **Plan 6: Storage-blocking e2e test** should first assert that storage is actually blocked.
- **Plan 6: Chapter buttons.** Add `aria-current` to the current chapter.
- **Plan 6: Copy trimmed to fit (plan 2), for review.** Shortened to fit fixed card slots: ev-viol (meaning, Technical), evid (meaning, Technical), pathB (meaning, Technical), ev-repair (Technical), norm-deg (Technical), enr-base/enr-deg/enr-after (Technical, and enr-deg's meaning), obs1 (Technical). The test-required substrings are kept.
- **Plan 6: Probe line in R7.** In Technical view, the dotted probe line switches from ODE01 to KOL01 at the start of R7 instead of fading in with the path change (`.probe` in `Network.svelte` is not in the `path` motion target).
- **Plan 6: Impeccable flags (after plan 5).** The 3–6px provenance edges are deliberate (ADR 0003), and the About top edge and quote rule are now neutral. Still open: the hard offset `box-shadow` of stacked earlier versions (`.card.stack-1/-2`) and the "About" eyebrow above the About title.
- **Plan 6: Completion line not announced.** `.caption .ending` sits outside the `aria-live` caption, so screen readers don't hear it on R15; consider `role="status"`.
- **Plan 6: Three loose `uses` sentences.** pathHealth: "policy moves the service" should read "decides to move". desiredState: "configuration that the apply request names" should read "the desired-state version that the apply request names". serviceRequest (Orchestrator): "relays the request to Intent" blurs ADR 0002; suggested: "It starts a provisioning workflow and asks Intent, with its own intent request, to create the service."
- **Plan 6: Inspect copy omits surfaces.** The About how-to line and the caption hint say "any card, line label or responsibility name"; Presentation surfaces are inspectable too.
- **Plan 6: Latent "Appears in undefined".** `inspect.ts` assumes every version has an `appear` event; add a unit assertion.
- **Plan 6: Selection ring at region bottoms.** `.region { overflow: hidden }` may clip the ring on bottom-row cards, and the full-width Presentation and Network rings are partly covered by design. Check once plan 5 has re-tuned the geometry.
- **Plan 6: Inspector side after a target appears.** The panel side isn't recomputed when a target that wasn't drawn later appears in a beat.
- **Plan 6: Test gaps from plan 4.** The Task 2 focus test's Enter is a no-op and doesn't re-assert `.selected`. The responsibility/answeredBy tests mirror the implementation's predicate, and there's no test for the "Nothing: it answers…" text.

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
- ev-repair technical: "repair CPH01–ODE01 (ODE01→CPH01) / Rx −10.9 dBm, CRC ≈1,240/min / ACME auto-remediated to path B" → "repair CPH01–ODE01 / Rx −10.9 dBm, CRC ≈1,240/min / ACME auto-remediated: path B"
- norm-deg technical: "probe_loss 0.4% AAR01→CPH01" → "probe_loss 0.4%"
- raw-base technical: "all links: oper UP, IS-IS UP / twamp-light loss 0.00% both directions" → "oper UP, IS-IS UP · twamp loss 0.00%"
- raw-deg technical: "CPH01 Hu0/0/0/1 Rx −10.9 dBm, CRC 1,240/min / other links: Rx −2.1 to −2.6 dBm, CRC 0 / all links: oper UP, IS-IS UP / twamp-light AAR01→CPH01 loss 0.4%" → "CPH01 Hu0/0/0/1: Rx −10.9, CRC 1,240/min / other links: Rx −2.1 to −2.6 dBm, CRC 0 / oper UP, IS-IS UP · probe loss 0.4%"
- raw-after technical: "CPH01 Hu0/0/0/1 Rx −10.9 dBm, CRC 1,240/min / other links: Rx −2.1 to −2.6 dBm, CRC 0 / all links: oper UP, IS-IS UP / twamp-light loss 0.00% both directions" → "CPH01 Hu0/0/0/1: Rx −10.9, CRC 1,240/min / oper UP, IS-IS UP · twamp loss 0.00%"
- P14: the SLO rule → service state work line is about 14px long, so its arrowhead nearly fills it (plan 5).
