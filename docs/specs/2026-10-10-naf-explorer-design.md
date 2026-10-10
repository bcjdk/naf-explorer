# How Network Automation Works: design spec

- **Date:** 2026-10-10
- **Status:** draft, awaiting review
- **Requirements:** `docs/brief/02`, `03`, `06` and `07` (decided), as amended by `docs/adr/0001-orchestrator-controls-every-job.md`. If anything here conflicts with them, the brief wins and the conflict is raised.
- **Guidance used:** `docs/brief/04`, `05`.

## 1. Intent

A desktop-first, self-guided explainer. A reader who knows networking steps through one ACME L3VPN story (Provision → Detect → Remediate) on one persistent canvas. They come away with a mental model of separate NAF responsibilities connected by typed handoffs and coordinated by Orchestrator's signals. It is an example of good automation with NAF as the reference, not a prescription.

**Success:** every item in `07-acceptance-checklist.md` holds. The semantic items are tested over the scenario data, not over the rendering.

**Usage mode:** self-guided, so the reader sets the pace. There is no autoplay. Captions can run to 2–3 full lines. The design target is 1440×900, and the stage must also fit 1280×720 and 1920×1080.

## 2. User experience

- The reader steps through **36 beats** (Provision 14, Detect 8, Remediate 14) with → / ← or Next / Back.
- The header shows the three chapter names with a tick per beat. Clicking a chapter name or tick jumps to that beat and shows its end state. **Replay** animates the current beat.
- **Simple | Technical** changes text only.
- Clicking any card, surface, region title or current line label, or pressing Enter on it, opens the **inspector**.
- **About** opens on the first visit (remembered per browser) and from the About button next to the view switch. It closes with ✕, Esc or a click outside. The content is as in `06`.

## 3. Spatial model

The stage is fixed at 1440×900 and scaled uniformly to fit the window (`transform: scale()`, letterboxed, never scrolled). All positions are hard-coded in `layout.ts`.

| Band | y (px) | Content |
|---|---|---|
| Header | 0–44 | Title · chapters with step ticks · Simple \| Technical · About · Replay |
| Presentation | 52–148 | Full width. Surfaces left to right: Fault Management, ITSM, Portal, Performance Management (idle), API (idle) |
| SLO lane | 156–180 | Route for the SLO definition (Intent → Observability), above Orchestrator and below Presentation. Drawn only in P6 |
| Responsibilities | 180–560 | Left: Observability (180–408) over Collector (416–560). Centre: Orchestrator (180–560). Right: Intent (180–408) over Executor (416–560) |
| The Network | 568–760 | Full width. Labelled "infrastructure, not an automation responsibility" |
| Caption bar | 768–892 | Full width. Chapter · n/N · step title · 2–3 caption lines · Back / Next on the right. Technical adds the scope note |

- **The read path is on the left and the write path on the right.** Altitude comes from the chains inside each region: Intent's derivation descends and Observability's understanding rises.
- **Observability** has two columns: *diagnosis* (path B health, evidence, service-impact event) and *evaluation* (SLO rule, service state). The SLI sits centred beneath both.
- **Each region** shows its name and a one-line role subtitle when idle. When active, the subtitle is replaced by the current work label (for example "● normalize").
- **The Network** is drawn as a stretched diamond: CPH01 at the left point, AAR01 at the right point, ODE01 at the top and KOL01 at the bottom. Path A runs over the top and path B along the bottom.
  - ACME's current path is the thick line.
  - The degraded ODE01→CPH01 strand gets a hatched overlay, a direction arrow and "▲ DEGRADED", never red.
  - `UP` is plain text.
  - Technical adds the Rx values, `Hu0/0/0/1 · oper UP · IS-IS UP`, the SR colour and a dotted line for the two-way probe along the ACME path.
- **Card placement:** each artifact card lives only with its **producer**.
  - Receivers don't get copies. The handoff line, the receiver's "gains the result" highlight and the inspector's "Used by" show the transfer.
  - **Presentation surfaces** show the latest artifact they have received (their job is to display). The Portal also keeps its own service request as a subdued line.
  - Versioned collections (derived intent, desired state, configuration change, observed state) show **v2 stacked over v1**.
- **The inspector** is a 400px panel that overlays the responsibilities zone (y 52–760) on the side **opposite the selection**. It opens on the left when the selection is in Intent, Executor or the right half of Presentation and The Network, and on the right otherwise. It never covers the selected element or the caption bar.

## 4. Scenario data model

### 4.1 One canonical source

`src/scenario/scenario.ts` holds everything semantic. Nothing else defines story content.

```ts
type Responsibility = 'presentation' | 'intent' | 'orchestrator' | 'executor' | 'collector' | 'observability';
type Party = Responsibility | 'network';
type Surface = 'faultMgmt' | 'itsm' | 'portal' | 'perfMgmt' | 'api';
type Status = 'HEALTHY' | 'DEGRADED' | 'VIOLATED' | 'CLEARED';
type Marker = 'IN_SYNC' | 'UNCHANGED' | 'COMPLETED';
type View = 'simple' | 'technical';
type Text = Record<View, string>;

interface ResponsibilityInfo { id: Party; name: string; role: string; does: string[]; doesNot: string[] }

interface ArtifactKind {
  id: KindId; name: string; producer: Party; consumers: Party[];
  whatItIs: string; producerSurface?: Surface;     // the Portal for the service request
}

interface ArtifactVersion {
  id: VersionId; kind: KindId; label: string;       // "v2", "degraded", "0.4%"
  status?: Status; lineage: VersionId[];
  meaning: string; technical: string[];             // Simple body; 1–4 Technical lines
}

interface SignalInfo { id: SignalId; label: string; asks: string; answeredBy?: SignalId | KindId }

type Event =
  | { t: 'signal'; signal: SignalId; from: Party; to: Party; version?: string }
  | { t: 'handoff'; version: VersionId; from: Party; to: Party; surface?: Surface }
  | { t: 'work'; owner: Party; verb: WorkVerb; label: Text }
  | { t: 'appear'; version: VersionId }
  | { t: 'mark'; version: VersionId; marker: Marker }
  | { t: 'network'; link?: { id: 'CPH01-ODE01'; status: 'DEGRADED' }; acmePath?: 'A' | 'B' };

interface Step { id: string; chapter: 'provision' | 'detect' | 'remediate'; title: string; caption: Text; events: Event[] }
```

- **`WorkVerb`** is a closed union, and each owner has its own allowed verbs as listed in `07`.
- **The signal vocabulary** is the amended list in `02`. Each request signal declares what answers it (`answeredBy`), for example `apply → applied` and `query alternate-path health → path B health`. Both the inspector and the request/answer test use this.
- **State changes are not artifacts.** IN SYNC, UNCHANGED and workflow COMPLETED are `mark` events and don't count toward the pacing rule. Status values (HEALTHY → DEGRADED → HEALTHY) are separate **versions**.
- **The event order within a step is the causal order**, and therefore the motion order.

### 4.2 What is derived from it (pure functions in `src/model/`)

- **`stateAt(n)`** folds the events of steps 0..n into:
  - the visible versions, with an "is new this step" flag;
  - the markers;
  - each surface's latest received artifact;
  - the network ground truth (link status, ACME path);
  - each responsibility's current work label.
  
  "Once it appears it stays" holds by construction.
- **`linesOf(step)`** gives the current step's handoffs, signals and work lines.
- **`timeline(step)`** gives the motion slots (see §8).
- **`inspect(target, n)`** gives the inspector content (see §7).
- **`scripts/beat-table.ts`** prints the beat table in §5 as Markdown. Once `scenario.ts` exists, the table is regenerated from it and §5 is replaced with the generated output, so the two can never drift apart.

### 4.3 Geometry is separate

`src/layout.ts` maps regions, surfaces, artifact kinds and versions to rectangles, and line routes to anchors and waypoints. The semantic tests never import it, and the layout tests never assert semantics.

## 5. Step breakdown (36 beats)

"New" lists each party's new artifact (at most one per party). Exchanges are in causal order: ⇢ is a signal, → is a handoff. *mark* changes an existing version.

### Provision (09:10–09:13)

| # | Title | New | Events in order |
|---|---|---|---|
| P1 | Orientation | none | none (six responsibilities, The Network, solid content vs dashed signals, roles not products) |
| P2 | Request | Portal: service request · Orch: workflow *provision* (running) | service request Portal → Orch · Orch *start workflow* |
| P3 | Record | Orch: intent request · Intent: service intent | intent request Orch → Intent · Intent *record* |
| P4 | Derive network intent | Intent: network intent v1 | Intent *derive* |
| P5 | Derive desired state | Intent: desired state v1 | Intent *derive* · Intent ⇢ Orch *desired state v1 ready* |
| P6 | Onboard assurance | Intent: SLO definition · Obs: SLO rule | Orch ⇢ Obs *onboard service assurance* · SLO definition Intent → Obs (SLO lane) · Obs *configure SLO* · Obs ⇢ Orch *assurance onboarded* |
| P7 | Apply | Exec: configuration change v1 (incl. probe) | Orch ⇢ Exec *apply desired state v1* · desired state v1 Intent → Exec · Exec *render, apply* · config change v1 Exec → Network · network: ACME on path A · Exec ⇢ Orch *applied v1* |
| P8 | Read back | Network: raw signals (read-back A) · Coll: observed device state v1 | Orch ⇢ Coll *read back applied state* · read-back A Network → Coll · Coll *read back* · observed v1 Coll → Intent · Coll ⇢ Orch *read back done* |
| P9 | Check drift | none | Orch ⇢ Intent *check drift v1* · Intent *check drift* · *mark* desired state v1 IN SYNC · Intent ⇢ Orch *in sync* |
| P10 | Collect | Network: raw signals (baseline) · Coll: normalized (baseline) | raw baseline Network → Coll · Coll *collect, normalize* |
| P11 | Enrich | Coll: enriched (baseline) | Coll *enrich* · enriched baseline Coll → Obs |
| P12 | Compute SLI | Obs: SLI 0.00% | Obs *compute SLI* |
| P13 | Evaluate | Obs: service state HEALTHY | Obs *evaluate SLI vs SLO* |
| P14 | Report | none | service state HEALTHY Obs → Portal, Obs → Orch · Orch *complete workflow* · *mark* provision COMPLETED |

### Detect (10:41–10:46)

| # | Title | New | Events in order |
|---|---|---|---|
| D1 | Fault | none | network: link CPH01–ODE01 DEGRADED (ODE01→CPH01 losing light; interface and IS-IS stay UP) |
| D2 | Collect | Network: raw signals (degraded) | raw degraded Network → Coll · Coll *collect* |
| D3 | Normalize | Coll: normalized (degraded) | Coll *normalize* |
| D4 | Enrich | Coll: enriched (degraded) | Coll *enrich* (`Hu0/0/0/1` → CPH01–ODE01 → path A → ACME) · enriched degraded Coll → Obs |
| D5 | Compute SLI | Obs: SLI 0.4% | Obs *compute SLI* (worst direction AAR01→CPH01) |
| D6 | Correlate | Obs: correlated evidence | Obs *correlate* ("consistent with optical degradation: a strong clue, not proof") |
| D7 | Evaluate | Obs: service state DEGRADED | Obs *evaluate SLI vs SLO* · service state DEGRADED Obs → Portal |
| D8 | Raise event | Obs: service-impact event (VIOLATED) | Obs *raise event* · event Obs → Fault Mgmt, Obs → Orch |

### Remediate (10:47–10:49)

| # | Title | New | Events in order |
|---|---|---|---|
| R1 | Start workflow | Orch: workflow *remediation* (running) | Orch *start workflow* (under `pol-loss-reroute`) |
| R2 | Query alternate path | Obs: path B health HEALTHY | Orch ⇢ Obs *query alternate-path health* · Obs *assess path* · path B health Obs → Orch |
| R3 | Evaluate policy | Orch: remediation decision | Orch *evaluate policy* · decision Orch → Intent |
| R4 | Record | Intent: network intent v2 | Intent *record* · *mark* service intent UNCHANGED |
| R5 | Derive | Intent: desired state v2 | Intent *derive* · Intent ⇢ Orch *desired state v2 ready* |
| R6 | Apply | Exec: configuration change v2 | Orch ⇢ Exec *apply desired state v2* · desired state v2 Intent → Exec · Exec *render, apply* · config change v2 Exec → Network · network: ACME on path B · Exec ⇢ Orch *applied v2* |
| R7 | Read back | Network: raw signals (read-back B) · Coll: observed device state v2 | Orch ⇢ Coll *read back applied state* · read-back B Network → Coll · Coll *read back* · observed v2 Coll → Intent · Coll ⇢ Orch *read back done* |
| R8 | Check drift | none | Orch ⇢ Intent *check drift v2* · Intent *check drift* · *mark* desired state v2 IN SYNC · Intent ⇢ Orch *in sync* |
| R9 | Collect | Network: raw signals (after reroute) · Coll: normalized (after reroute) | raw after-reroute Network → Coll · Coll *collect, normalize* |
| R10 | Enrich | Coll: enriched (after reroute) | Coll *enrich* (probe now on path B) · enriched Coll → Obs |
| R11 | Compute SLI | Obs: SLI 0.00% | Obs *compute SLI* |
| R12 | Evaluate | Obs: service state HEALTHY | Obs *evaluate SLI vs SLO* (same SLO rule) |
| R13 | Report and clear | Obs: service-impact event (CLEARED) | service state HEALTHY Obs → Portal, Obs → Orch · Obs *clear event* · cleared event Obs → Fault Mgmt · Orch *complete workflow* · *mark* remediation COMPLETED |
| R14 | Closing | Obs: service-impact event (repair needed) | Obs *raise event* · repair event Obs → ITSM (auto-remediated onto path B; link needs repair) |

**Key lineage:**
- service state ← SLI + SLO rule;
- violation event ← DEGRADED service state + evidence (it carries the implicated link and the current path);
- path B health ← enriched (degraded);
- decision ← violation event + path B health;
- network intent v2 ← decision + service intent;
- desired state vN ← network intent vN;
- config change vN ← desired state vN;
- observed vN ← read-back;
- cleared event ← violation event + HEALTHY service state;
- repair event ← evidence + enriched (after reroute).

**Fault Management during R12:** it still shows ✕ VIOLATED, because HEALTHY hasn't reached Presentation yet. From R13 on, no surface shows VIOLATED (`07`).

## 6. Simple vs Technical

- **Parity is structural.** Both views render the same events, so the view only chooses a text field: step caption, card body (`meaning` or `technical`), work label and network annotations. Technical can't add a causal step.
- **The content rule stays a manual review item:** Technical adds only identifiers, values, fields, protocol examples and scope notes.
- **Geometry is identical in both views.** Each card is sized to fit the larger of its two bodies, so switching views never moves anything.
- **Technical's caption bar adds a fixed scope note:** "Values illustrative · NAF does not require SR-MPLS, gNMI or TWAMP."
- **Switching views keeps** the step, the selection, a running animation and focus. The chosen view is remembered in `localStorage`, wrapped in try/catch.

## 7. Inspector

- **Targets:** artifact cards, Presentation surfaces, region titles (which open the responsibility view) and current-step line labels (which open the signal or handoff view).
- **Views**, all produced by `inspect(target, n)` from the data:
  - **Artifact:** name and version, what it is, produced by, used by (with surface names), meaning, status or marker, lineage (each entry is a link that moves the selection), other versions, and the Technical payload.
  - **Responsibility:** role, does, does not, *in this step* (its events), and what it has produced so far.
  - **Signal:** from, to, what it asks for, and what answers it (`answeredBy`).
  - **Handoff:** the artifact version, from, to (and surface), and why the receiver needs it.
  - **Surface:** its latest received artifact and its sender.
- **Step changes never close the panel or move focus.** The panel updates. If the target isn't drawn in the current step, it says so ("Handed over in P7" or "Appears in P5").
- **Focus:** opening moves focus to the panel heading. Esc or ✕ closes it and returns focus to the element that opened it.
- **Selection** is an outline ring around the selected element. **Activity** (the current step's region) is a subtle background highlight plus the work label. Neither uses the other's styling, and neither uses provenance colour.

## 8. Motion

- **The DOM always renders `stateAt(n)`, the end state.** Motion is an overlay created with the Web Animations API (`el.animate(keyframes, { delay, duration, fill: 'backwards' })`). It animates elements *into* the state that is already rendered. Svelte transitions are not used.
- **`timeline(step)`** turns the step's ordered events into slots `{ target, kind, start, duration }`:
  1. the active region highlights;
  2. the work label appears;
  3. each signal and handoff line draws in event order, with its label;
  4. each new artifact fades in when its inputs have arrived;
  5. receivers get a brief "gains the result" highlight;
  6. each status chip whose value changed pulses three times.
  
  The step's length is the end of its last slot. Cards never move across the canvas. All durations are in one constants table.
- **Ordering guarantee (unit-tested):** an `appear` slot starts only after every signal and handoff addressed to its producer earlier in the step has finished. A Network-produced artifact appears just before its own handoff. Pulses finish within the step's length.
- **Navigation:** every navigation first calls `finish()` on all running animations, then renders the target step. This means:
  - **Next** renders step n+1 and starts its timeline;
  - **Back** and **jumps** render the end state without animation;
  - **Replay** re-runs the current timeline;
  - rapid presses land exactly N steps later.
- **Reduced motion** (`prefers-reduced-motion: reduce`): the timeline never starts. The end state is the same by construction, and a browser test verifies it.
- **About:** opening it finishes any running animation. Story keys are ignored while it's open.

## 9. Lines

- **Only the current step's lines are drawn**, in one SVG overlay above the regions.
- **Line types:**
  - **solid:** artifact handoff, from the producing card to the consuming card or surface;
  - **dashed:** coordination signal, starting next to its label inside Orchestrator;
  - **dotted:** work inside one responsibility (for example SLI + SLO rule → service state).
- **Routes are hard-coded per line in `layout.ts`** as anchor-to-anchor waypoints.
- **No content line crosses Orchestrator or Presentation** unless one of them is an endpoint. The SLO-definition route runs through the SLO lane.
- **Every line has a text label**, rendered as an HTML button positioned next to the line. It can take focus, can be inspected, and is covered by the layout tests. The SVG itself is `aria-hidden`.

## 10. Visual design

- **Canvas:** dark neutral background, thin borders, modest radii. `system-ui` for prose and `ui-monospace` for machine values, so no web fonts are loaded. No glow, heavy gradients, glassmorphism or NOC-wall styling.
- **Provenance colour** is a thin accent only: the region's top edge and the card's left bar. It is never a fill or a text colour. The NAF colours are Presentation `#f5c518`, Observability `#00e676`, Orchestrator `#00d4ff`, Intent `#ff6d2e`, Collector `#F43F5E`, Executor `#6366F1` and Infrastructure `#64748b`.
- **Cards look like documents:** a type label, "by <producer>", the version, and the body (meaning or Technical lines). Status chips sit inline with the text. Subdued earlier artifacts use a muted text colour, never opacity.
- **Status chips** always show an icon and a word:

  | Status | Treatment |
  |---|---|
  | ✓ HEALTHY | neutral outline |
  | ▲ DEGRADED | achromatic with a pattern |
  | ✕ VIOLATED | one magenta hue, used by no responsibility, with dark text |
  | ✓ CLEARED | neutral; distinguished from HEALTHY by its word |
  | = IN SYNC / = UNCHANGED | neutral markers, not chips |

  `UP` never appears in a chip.
- **Colour tokens** are defined once in `theme.css`. A unit test checks the WCAG AA contrast of every text/background token pair, including subdued text and the VIOLATED chip.

## 11. Accessibility and keyboard

- **Keyboard:**
  - → / ← step through the story from anywhere except inside the About dialog;
  - Enter or Space activates the focused item;
  - Esc closes the inspector or About.
- **Tab order:** header (chapters and ticks, view switch, About, Replay) → canvas (Presentation surfaces, Observability, Collector, Orchestrator, Intent, Executor, The Network, then the current line labels) → caption bar (Back, Next).
- **Semantics:**
  - each region is a `<section>` with a heading;
  - cards and surfaces are buttons with a full accessible name, for example "Desired state v2, by Intent, in sync";
  - the caption is `aria-live="polite"`;
  - the view switch is a radio group.
- **Focus is never lost:**
  - keyed elements stay mounted across steps, and the stage never remounts;
  - if the focused element is removed (only a previous step's line label can be), focus moves to the caption heading;
  - Back with the inspector open keeps focus on Back;
  - Next and Replay keep focus on themselves.
- **Focus is always visible:** a 2px high-contrast ring, separate from the selection ring.
- **About** is a native `<dialog>` opened with `showModal()`, which provides the focus trap, Esc, the inert background and focus restoration. Focus starts on ✕. A backdrop click closes it, and links open in a new tab. The first visit is recorded in `localStorage` (wrapped in try/catch; if storage fails, About opens every visit).

## 12. Stack and project layout

- **App:** Svelte 5 with TypeScript (`strict`) and Vite. The output is static and is deployed manually to GitHub Pages with a relative base path. There is no CI/CD until an ADR adds it.
- **Checks:**
  - Prettier with the Svelte plugin;
  - `svelte-check`;
  - Vitest for unit tests;
  - Playwright (Chromium) for browser tests;
  - `@axe-core/playwright` for the accessibility scan.
- **Playwright** always starts its own fresh `vite preview` on a free port and never reuses a running server. Story tests set the "About seen" flag first, and one test covers the first visit.

```
src/
  scenario/types.ts        types from §4.1
  scenario/scenario.ts     catalogs + 36 steps (the only story content)
  model/state.ts           stateAt, linesOf
  model/timeline.ts        timeline + timing constants
  model/inspect.ts         inspector content
  layout.ts                geometry and line routes
  theme.css                colour tokens
  ui/*.svelte              App, Header, Stage, Region, Card, Surface, Network, Lines, CaptionBar, Inspector, About
scripts/beat-table.ts      prints §5 from scenario.ts
tests/unit/                semantics, story, timeline, contrast
tests/e2e/                 walkthrough, navigation, inspector-focus, reduced-motion, layout, a11y, about
```

## 13. Testing (maps to `07`)

- **Unit tests over the data** (`tests/unit/semantics.test.ts`, `story.test.ts`): every item in the `07` Semantics section, including the ADR 0001 additions:
  - request/answer pairing before Orchestrator's next request;
  - apply → applied → read back → check drift;
  - *assurance onboarded* before the first apply;
  - Orchestrator never names a path it wasn't told.
  
  Also tested over the data: the pacing rule, lineage ordering, the status sequences, surface routing, "not proof" in both views, non-empty captions and bodies, and no surface showing VIOLATED from R13 on.
- **Unit tests over the derived model:**
  - `timeline` ordering and pulse completion for every step;
  - `stateAt` monotonic visibility;
  - token contrast.
- **Browser tests:**
  - **walkthrough:** forward through all 36 beats and back;
  - **jumps and Replay;**
  - **rapid presses:** they land on exactly N and settle;
  - **mid-animation:** switching views keeps the step, selection and animation;
  - **inspector:** open, Esc, focus return, and Back with it open;
  - **focus:** Next and Replay keep focus, and focus never drops to `body`;
  - **reduced motion:** the DOM snapshot matches the animated end state in every beat;
  - **layout, per beat and view:** no clipped text (`scrollHeight > clientHeight` or `scrollWidth > clientWidth` on any card fails), no overlapping cards, cards inside their region, no label over a card, line endpoints inside their source and target, the SLO route outside Orchestrator and Presentation, every line labelled, no `UP` chip, and no chip in a provenance colour;
  - **fit:** no scrollbars at 1280×720 and 1920×1080;
  - **axe:** no serious or critical violations at P1, D8 and R14 in both views, and with About open;
  - **About:** first visit only, reopen, ✕ and Esc, focus return, and arrow keys blocked.
- **Mutation check (lesson 25):** each new semantic test is shown failing once, by temporarily breaking the data, before it is accepted.

## 14. Delivery order

1. **Walking skeleton.** The scaffold, `types.ts`, all 36 steps in `scenario.ts`, `stateAt`, the semantic tests green, and a plain stage: regions and cards at rough positions, the caption bar and keyboard navigation. This is a demonstrable end-to-end story.
2. **Layout and visual design.** Final geometry, the network diamond, lines and labels, tokens, the layout and fit tests.
3. **Motion.** `timeline`, the WAAPI overlay, Replay, reduced motion, the navigation-during-animation tests.
4. **Inspector and About**, with the focus tests.
5. **Accessibility hardening and the content pass.** The axe scan, a review of Simple and Technical parity, and the beat table regenerated into §5.

## 15. Deferred

- An "order completed" handoff to the Portal (see `docs/deferred-work.md`).
- An in-app reduced-motion toggle.
- An operator-approval variant of remediation.
- Showing how Collector's cached intent stays in sync.
- Deep links to a step.
- Mobile, touch, analytics, a backend, scenario authoring.

## 16. Open items

- All Simple and Technical copy is drafted in `scenario.ts` during delivery steps 1 and 5, and the user reviews it against the parity rule.
- The exact animation durations are tuned in the browser during step 3, within the constraints in §8.

## Revision log

- **rev 1 (2026-10-10):** initial design from brainstorming. It includes ADR 0001 (Orchestrator controls every job: completion signals, verify split into read back and check drift, alternate-path query). Layout v3: full-width canvas, caption bar under The Network, and an inspector that overlays the side opposite the selection.
