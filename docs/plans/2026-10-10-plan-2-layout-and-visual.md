# Plan 2: Layout and visual design

> Executed natively, with a screenshot comparison after each slice (user's choice, 2026-10-10). One Opus review of the whole branch at the end.

**Goal:** The stage looks and reads like the reference screenshot `image (8).png` (the earlier build, D3): provenance colour, cards that always show their text, labelled arrows for the current beat, and the network diamond. No "This step" box.

**Spec:** `docs/specs/2026-10-10-naf-explorer-design.md` §3, §9, §10. This plan makes it rev 3 (Task 6).

**As built:** routes live in `src/routes.ts`, not `src/model/lines.ts`. Colour tokens live in `src/theme.ts` (TypeScript, so the contrast test can read them), not `theme.css`. Surface roles are `SURFACE_ROLES` in `scenario.ts`. Every exchange with Orchestrator attaches at a labelled dock strip under its cards.

**Builds on:** plan 1, on branch `plan-1-walking-skeleton`. The model (`stateAt`, `linesOf`, `describe`) and the semantic suite stay unchanged.

## Decisions (user, 2026-10-10)

- **Cards always show their body.** Each kind has one fixed slot in its producer's region. The card shows its newest version with the meaning (Simple) or Technical lines. Earlier versions sit **stacked behind** it as visible offset edges. Their label and status stay in the DOM as visually hidden text, so they remain visible versions for 07 and the e2e end-state test. This replaces rev 2's "body only when new / earlier: line" and resolves the §3 vs §6/§8 tension: slots are fixed, so nothing reflows between beats or views.
- **No "This step" box.** The arrows carry the beat.
- **The current beat's arrows are part of its end state.** They are drawn statically, so a screenshot always catches them. Plan 3 animates them in on top.
- **Proportions follow the reference:**
  - taller responsibility regions;
  - Orchestrator starts lower, leaving the SLO lane above it;
  - Collector and Executor are short strips;
  - The Network is a short band, with the raw-signals card on the left and the diamond on the right.

## Global constraints (unchanged from plan 1 unless stated)

- Fixed 1440×900 stage, no scrolling, nothing clipped. The overflow test stays and must pass in every beat and both views.
- Provenance colour is a thin accent only: the region's top edge, the square before the region name, and the card's left bar. It is never a fill or a text colour. Colours: Presentation `#f5c518`, Observability `#00e676`, Orchestrator `#00d4ff`, Intent `#ff6d2e`, Collector `#F43F5E`, Executor `#6366F1`, Infrastructure `#64748b`.
- Status is icon + word, never colour alone, never a provenance colour:
  - ✓ HEALTHY: neutral outline;
  - ▲ DEGRADED: achromatic with a hatch pattern;
  - ✕ VIOLATED: magenta with dark text;
  - ✓ CLEARED: neutral.
- Selection and activity are separate visual systems. Activity is the active region's subtle highlight plus the work label. A new card gets a brighter border. No selection exists until plan 4.
- Story text lives only in `scenario.ts`. Surface roles ("NOC single pane of glass", …) move there too.
- Copy changes are allowed only where a card cannot fit its slot. List each one in the final report for the user's copy review.
- Never weaken a test. Every line has a text label. No content line crosses Orchestrator or Presentation unless it is an endpoint.

## Tasks

### Task 1: Tokens, theme and the look of regions, cards and chips
- `src/theme.css` defines the colour tokens once: neutrals, text, muted, one token per provenance colour, and the status chip colours. Import it from `main.ts`. `app.css` uses only tokens.
- Region:
  - a 2px top edge in its provenance colour;
  - the header is a coloured square, the uppercase name with letter-spacing, and "· role" muted;
  - the active region gets a subtle background lift, and its header shows "● work label".
- Card:
  - a 3px left bar in the producer's colour;
  - an uppercase type label with the version label;
  - "by X" muted on the right;
  - the body below;
  - a status chip inline;
  - the marker as plain text "= IN SYNC".
  
  Older cards use muted text, never opacity. A new card gets a brighter border.
- Chips: per the constraint above. DEGRADED uses a `repeating-linear-gradient` hatch behind dark-on-light text.
- Header:
  - chapter names, each followed by short dash ticks for its beats;
  - a segmented Simple | Technical control;
  - ticks reach 3:1 contrast and have a hit area of at least 16×20px.
- `SURFACES` becomes `Record<Surface, { name: string; role: string }>`, with the roles from the reference.
- Unit test `tests/unit/contrast.test.ts`: every text-on-background token pair used (text, muted, chip text on chip background, VIOLATED) is at least 4.5:1, and the ticks against the background are at least 3:1.
- Delete the `EXCHANGES` box, `.exchanges` CSS, and the e2e exchange-list assertions. `linesOf` stays; Task 4 uses it.

### Task 2: Geometry, with one fixed slot per kind
- `layout.ts`:
  - `REGIONS` follow the reference proportions. Starting values below; tune them while comparing screenshots.

    | Region | x | y | w | h |
    |---|---|---|---|---|
    | header | none | 0 | none | 44 |
    | Presentation | 16 | 52 | 1408 | 84 |
    | Observability | 16 | 148 | 440 | 372 |
    | Intent | 984 | 148 | 440 | 372 |
    | Orchestrator | 472 | 200 | 496 | 320 |
    | Collector | 16 | 532 | 440 | 128 |
    | Executor | 984 | 532 | 440 | 128 |
    | The Network | 16 | 672 | 1408 | 108 |
    | caption | none | 788 | none | to 892 |

  - The SLO lane is y 140-196, above Orchestrator.
  - `SLOTS: Record<KindId, Rect>` is region-relative, one per kind. Observability has a diagnosis column (path health, evidence, event) and an evaluation column (SLO rule, service state), with the SLI full width at the bottom. Intent's derivation descends: service intent and SLO definition, then network intent, then desired state. Presentation's service request is the Portal's own request, inside the Portal surface.
- `Card.svelte`:
  - absolutely positioned at its slot;
  - always shows the newest version's body in the current view;
  - earlier versions render as `<span class="stack" data-version=…>` layers offset 3px down and right behind the card, each carrying visually hidden text "<label> <status> <marker>";
  - the card has `data-version` of its newest version.
- Surfaces: the name plus "· role", the received artifact as a mini card (type label and status chip), and the Portal's own request as a mini card beside it.
- The e2e layout tests are added in this task:
  - in every beat and both views, every card lies inside its region;
  - no two cards overlap;
  - no element overflows (the existing test).

### Task 3: The Network band
- The band holds the raw-signals card at the left (its slot) and an SVG diamond at the right.
  - The diamond: CPH01 at the left point, AAR01 at the right point, ODE01 at the top and KOL01 at the bottom. Node labels are monospace boxes.
  - ACME's current path is drawn thick, with an "ACME · path A|B" label.
  - Once the link is degraded, the ODE01→CPH01 strand gets a hatch pattern, a direction arrow, a `▲ DEGRADED` chip and `NETWORK.linkDegraded[view]`, never red.
  - Technical adds `NETWORK.device.technical` and the dotted probe line along the ACME path.
- `data-link` and `data-path` stay on the section. The network texts come from `NETWORK`.
- The header sits at the right: "■ THE NETWORK · infrastructure, not an automation responsibility".

### Task 4: Lines and labels for the current beat
- `src/model/lines.ts` is pure, and its unit tests are in `tests/unit/lines.test.ts`.

  ```ts
  export interface Route { key: string; kind: 'handoff' | 'signal' | 'work'; points: [number, number][]; label: string; from: Rect; to: Rect }
  export function routesOf(n: number, view: View): Route[];
  ```

  - One route per `linesOf(n)` event, plus one dotted work route for each new version whose lineage parent has the same producer (for example SLI + SLO rule → service state).
  - The label is `describe(e, view)`, without the endpoints for handoffs. For example, "desired state v1" sits on the Intent → Executor line.
- Anchors:
  - A handoff starts at the producing card. It ends at the consuming card when the consumer produces, in this step, a version whose lineage contains this one. Otherwise it ends at the consuming surface, at the network diamond, or at the consumer region's header.
  - A signal starts at the Orchestrator edge facing the other party, and ends at that party's region edge.
  - Endpoints are the midpoint of the facing edges.
  - Lines between the same pair of parties in one beat are offset 10px apart.
- Waypoints: `WAYPOINTS[key]` in `layout.ts` hard-codes the exceptions. The SLO definition runs through the SLO lane, and observed state goes Collector → Intent below Orchestrator.
- Unit tests over every beat:
  - every route has a non-empty label;
  - the first point lies on the `from` rect and the last on the `to` rect;
  - no segment of a content (handoff) route crosses the Orchestrator or Presentation rect unless that party is an endpoint;
  - the SLO-definition route stays inside the lane between the regions.
- `Lines.svelte`:
  - one `aria-hidden` SVG overlay;
  - solid lines with arrowheads for handoffs, dashed for signals, dotted for work;
  - neutral line colour, with a thin provenance tint allowed at the arrowhead only;
  - labels are HTML `<button class="label">` elements positioned at the midpoint of the longest segment. They are focusable, and the click stays a no-op until plan 4.
  - `LABEL_NUDGE[key]` in `layout.ts` fixes collisions.
- e2e, in every beat and both views:
  - the number of `.label` elements equals `routesOf(n).length`;
  - no label overlaps a card;
  - each label's text matches its route.

### Task 5: Screenshot comparison and tuning
- Capture P7, D3, D8, R6 and R14 in both views. Compare D3 with `image (8).png`, and tune geometry and copy until it matches in kind: colours, proportions, arrows and card density. Show the user the screenshots.

### Task 6: Spec rev 3, verify, commit
- Spec:
  - §3 gets the rev 3 card rule (always show the body; earlier versions stacked behind) and the new band table;
  - §9 records that the current beat's lines are part of the end state;
  - §10 is unchanged apart from the new tokens file;
  - add a revision-log entry.
- Remove the resolved items from `docs/deferred-work.md`: card geometry, focus ring clipping, the Presentation literal, the network describe test, headroom and tick contrast.
- Run `npm run verify`.
- Ask the user before committing and pushing.
