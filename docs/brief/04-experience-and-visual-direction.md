# Experience and visual direction (guidance)

This is what worked in the first build, offered as a **starting point**. The new build may redesign it, but must keep the principles in `CLAUDE.md` and the decided semantics.

## Spatial model that worked

It followed the NAF reference diagram arrangement:

```
┌─────────────── header: title · chapters with step ticks · Simple|Technical · About · Replay ───────────────┐
├──────────────────────────────── PRESENTATION (full width) ─────────────────────────────────────────────────┤
│ [Fault Management] [ITSM] [Portal] [Performance Management] [API]   ← named surfaces                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│        ◄─── direct lane: SLO definition (Intent → Observability), above Orchestrator ───                    │
│ OBSERVABILITY            │      ORCHESTRATOR (middle)      │                INTENT                           │
│ (read path, left)        │  workflow records, requests     │  (write path, right)                            │
│    COLLECTOR             │                                 │     EXECUTOR                                     │
├────────────────────────────────── THE NETWORK (full width; 4-router topology) ─────────────────────────────┤
├────────────────────────────── narration bar: chapter · n/N · caption · Back / Next ────────────────────────┤
```

- **Read path left, write path right.** Network → Collector → Observability on the left; Intent → Executor → Network on the right. Orchestrator sits in the middle.
- **Presentation is a full-width bar at the top** with five named surfaces. Fault Management, ITSM and Portal are used in the story; Performance Management and API are present but idle.
- **The Network is a full-width bar at the bottom.** It is visually distinct and labelled as infrastructure, not an automation responsibility. It shows the topology, the active ACME path, and what fails ("ODE01→CPH01 fibre losing light" in Simple; the Rx value in Technical).
- **Every region shows a one-line role subtitle** when idle, and its current work ("● normalize · enrich") when active.
- **Altitude** (service at the top, network in the middle, device and signal at the bottom) came from the NAF layers plus the direction of the chains inside regions: Intent's derivation descends, Observability's understanding rises. No swimlanes.
- **Observability as two small pipelines over an SLI row.** A diagnosis column (evidence → impact event) and an evaluation column (SLO rule → service state), with the SLI computed beneath both.
- **Stage geometry.** A fixed stage (about 1440×900) scaled uniformly to fit the window, with hard-coded positions, worked well for a single-scenario demo.

## Lines

- **Solid line:** an artifact handoff, drawn **from the producing card to the consuming card or surface**, never between region edges, and labelled with the artifact name.
- **Dashed line:** a coordination signal involving Orchestrator, labelled with the signal. Start each signal near its label inside Orchestrator; don't leave short stubs in gutters with labels far away.
- **Dotted "work line":** a derivation *inside* one responsibility (for example SLI + SLO rule → service state), labelled with the work.
- **Only the current step's lines are drawn.** Earlier artifacts stay visible, subdued; earlier lines do not.
- **No content line may cross Orchestrator or Presentation** unless one of them is an endpoint. In particular, the SLO-definition lane must not.

## Cards and colour

- **Cards look like documents:** type label, "by <producer>", a short meaning (Simple) or 1–4 machine-readable lines (Technical).
- **Provenance colour:** a thin accent per responsibility (block top edge, swatch, card left bar), never fills or text colour. The NAF brand colours worked: Presentation `#f5c518`, Observability `#00e676`, Orchestrator `#00d4ff`, Intent `#ff6d2e`, Collector `#F43F5E`, Executor `#6366F1`, Infrastructure `#64748b`.
- **Status never reuses a provenance colour.** Collector is red-ish and Observability green-ish, so red/green status would mislead. See `03` for the status treatment.
- **Subdued ancestors** must still meet text contrast. Use a muted text colour rather than transparency.
- **Collections** (per device, per signal) look stacked. v2 stacks over v1.
- **Calm technical look:** dark neutral canvas, thin borders, modest radii, monospace only for machine values. No glow, heavy gradients, glassmorphism or NOC-wall styling.

## Interaction

- **Navigation:** → / ← and Next / Back step through the story. Chapter names and step ticks jump to a step and show its end state, with Replay available to animate it.
- **Animation never blocks navigation.** Navigating mid-animation resolves the current step and moves immediately; there's no second key press.
- **Inspector:** click or Enter on any card, line label or responsibility name opens a side panel opposite the selection.
  - **Artifact view:** what it is, "Produced by", "Used by" (with surface names), meaning, status, lineage, and the illustrative payload in Technical view.
  - **Responsibility view:** Does / Does not, plus "In this step", generated from the step data.
- **Simple ↔ Technical:** changes text only, never the beat, selection or animation.
- **About:** opens on a first visit (remembered per browser) and from an About button next to the view switch. It closes only via a ✕ in the top-right corner, Esc or a click outside; there is no Start button.

## Motion

Each step's motion runs: the active region highlights → work label → handoffs and signals in step order → new artifacts appear when their inputs have arrived → receivers gain the result.

- Cards never fly across the canvas.
- Status chips pulse three times when their value changes, and the step lasts long enough for the pulses to finish.
- Reduced motion shows the same end state with no animation.
