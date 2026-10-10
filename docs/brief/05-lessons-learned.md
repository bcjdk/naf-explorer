# Lessons learned from the first build

Each item records what went wrong, why it mattered, and how it was resolved. Design these out from the start.

## Semantics

1. **Optics direction.**
   - *What went wrong:* the first scenario put low Rx at CPH01 but measured loss with a one-way CPH01→AAR01 probe.
   - *Why it mattered:* low Rx at CPH01 means the ODE01→CPH01 strand is bad, so the loss is on AAR01→CPH01 traffic, which a one-way CPH01→AAR01 probe can't see. A network-engineer audience notices this immediately.
   - *Resolution:* a two-way probe, with loss reported per direction.
2. **No measurement for an unused path.**
   - *What went wrong:* "path B loss 0.00%" was claimed while no probe ran on path B.
   - *Resolution:* path B health comes from link telemetry only (Rx, errors, UP).
3. **Request routing.**
   - *What went wrong:* the service request first went straight from Presentation to Intent.
   - *Resolution:* the Portal sends it to Orchestrator, which relays its own *intent request*. Orchestrator never forwards someone else's artifact.
4. **Who enriches.**
   - *What went wrong:* enrichment was first placed in Observability.
   - *Resolution:* structural tagging (service IDs) belongs to Collector, from a cached copy of intent. Operational meaning (SLI, correlation, SLO evaluation, events) belongs to Observability. Showing a "service mapping" handoff from Intent to Collector was confusing, so the cache is mentioned but not drawn.
5. **The SLO isn't fetched at evaluation time.**
   - *What went wrong:* the SLO first appeared as a handoff at the moment Observability evaluated.
   - *Resolution:* it is onboarded during Provision (SLO definition → SLO rule), and later evaluation uses the rule.
6. **Make SLI/SLO work visible.**
   - *What went wrong:* service state appeared without visibly being computed.
   - *Resolution:* an explicit SLI artifact, plus labelled work lines for compute → correlate → evaluate → raise.
7. **Orchestrator must sequence.**
   - *What went wrong:* the workflow steps (onboard, apply) started without Orchestrator ever hearing that Intent was ready, and it never learned the drift-check result.
   - *Resolution:* Intent ⇢ Orchestrator *desired state ready* before the jobs, and *in sync* after verification. Content still travels directly.
8. **Two kinds of verification.**
   - *What went wrong:* configuration verification (drift check) and service verification (SLO) were blurred.
   - *Resolution:* they are separate steps, and the caption says so explicitly.
9. **Correlation is not proof.**
   - *What went wrong:* an early draft stated a single root cause.
   - *Resolution:* "consistent with optical degradation; a strong clue, not proof".
10. **Alarm lifecycle.**
    - *What went wrong:* Fault Management kept showing VIOLATED after recovery.
    - *Resolution:* Observability clears the event (CLEARED). Presentation never decides this itself.
11. **Orchestrator wording.**
    - *What went wrong:* early text called Orchestrator "the one that decides".
    - *Resolution:* "the remediation workflow evaluates a pre-approved policy", plus a note that other designs evaluate policy elsewhere.
12. **Device state vs service state works in both directions.**
    - *What went wrong:* the lesson only ran one way.
    - *Resolution:* the ending shows the link DEGRADED while the service is HEALTHY.

## Pacing and readability

13. **Too much at once muddles the story.**
    - *What went wrong:* single beats where one responsibility produced several artifacts were hard to follow.
    - *Resolution:* at most one new artifact per responsibility per step (this added beats). Enforce it with a test.
14. **Lines must be meaningful.**
    - *What went wrong:* region-to-region arrows, long-lived lanes, short gutter stubs with far-away labels, and lines through other regions all confused readers.
    - *Resolution:* card-to-card handoffs, only the current step's lines, and labels next to their lines.
15. **Empty canvas.**
    - *What went wrong:* blank regions at the start meant nothing to a newcomer.
    - *Resolution:* one-line role subtitles on every region.

## Layout and text

16. **Clipped text.**
    - *What went wrong:* fixed-size cards silently cut off text in many beats.
    - *Resolution:* an automated browser test that fails on any overflow, in every step and both views. Wrap Technical lines, put status chips inline with text, and keep card copy short.
17. **Overlaps and labels.** Test that no cards overlap, that cards stay inside their region, and that no label covers a card.
18. **Status hidden in compact cards.**
    - *What went wrong:* Presentation's small cards clipped their status chip, so the Portal showed "Service state" without DEGRADED.
    - *Resolution:* the status must always be visible.

## Accessibility and interaction

19. **Contrast.**
    - *What went wrong:* subduing with 42% opacity, small grey labels, and white text on the magenta VIOLATED chip all failed WCAG AA.
    - *Resolution:* muted colours instead of opacity, brighter greys, and dark text on the magenta.
20. **Focus.**
    - *What went wrong:* remounting the canvas on each step dropped keyboard focus. Closing the inspector during Back sent focus to Next, so the next Enter went forward. Replay removed its own button and lost focus.
    - *Resolution:* preserve or restore focus explicitly, and test each case.
21. **Motion order and pulses.**
    - *What went wrong:* artifacts appeared before the signal that asked for them; for example, path health showed before Orchestrator's query. Settling the step cut the three status pulses short.
    - *Resolution:* compute appearance from inputs, including signals, and size each step to cover fades and pulses.
22. **Reduced motion.** Test that it reaches exactly the same end state.

## Process

23. **Generate the beats and the spec from one definition.**
    - *What went wrong:* hand-editing beat tables in several places drifted out of sync.
    - *Resolution:* one canonical definition from which the data and the spec's tables were generated.
24. **Formatter vs scripted edits.** Automated text edits often missed because the formatter had re-wrapped lines. Prefer structural edits.
25. **Prove tests can fail.** Several tests passed on their first run. Mutation-check new tests: break the code briefly and confirm the test catches it.
26. **Stale preview servers.** A reused local server silently served an old build. Never reuse a server in browser tests.
27. **First-visit dialogs break browser tests.** The About window opened in every fresh browser context, so story tests should start as a returning visitor, with one dedicated first-visit test.
28. **Keep the spec revision log.** Ten design revisions happened through user feedback. Record each as a short "rev N change" note so the reasoning survives.
