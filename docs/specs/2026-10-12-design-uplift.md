# Design uplift: design spec

- **Date:** 2026-10-12
- **Status:** built (plan 5, 2026-10-12). See "As built" at the end.
- **Extends:** `docs/specs/2026-10-10-naf-explorer-design.md`. This spec replaces its §10 (Visual design) and the presentation parts of §7 (Inspector). Every other section, and every NAF semantic invariant in `CLAUDE.md`, stands unchanged.
- **Decision record:** `docs/adr/0003-visual-uplift.md` (typefaces as project assets; how far NAF colour reaches).
- **Evidence:** the Impeccable critique of 2026-10-12 (`.impeccable/critique/`, 29/40). Its findings were that provenance colour was too timid to carry identity, the inspector was an untyped bulleted form, type was flat and 10-12px, and activity and "new this step" barely registered.

## 1. Intent

The owner's brief: the whole should be uplifted, more visually stylish and appealing, and the inspector should use the NAF colours appropriately.

Decided with the owner:

- **Refine, don't replace.** The dark technical canvas, the layout, the story and the semantics stay. This is the same app, more sure of itself.
- **NAF colour reaches further:** tints and solid bands, in direction C ("quiet canvas, coloured documents"). Regions stay neutral. Colour concentrates on the documents, the handoff lines and the inspector, so whatever moved this step is what's colourful. Handoff labels use the swatch-pill style.
- **A real typeface at a larger, heavier scale:** Source Sans 3 and Source Code Pro. The owner will review it again on the real canvas.
- **In scope beyond restyling:** coloured handoff lines, a stronger "new this step", a line legend, and opening and ending moments.

**Success:**

- With the labels covered, a viewer can still tell the responsibilities apart, and see what was produced this step, by colour.
- The inspector reads as part of the same visual language as the canvas.
- Text is readable on a projector.
- Every existing test still passes. Layout, contrast and accessibility checks act as the referee for the larger type.

## 2. The visual system

### 2.1 Type

- **Faces:** Source Sans 3 (400, 500, 600, 700) for prose and labels; Source Code Pro (400, 500) for machine values only.
  - Both are SIL Open Font License, Latin-subset WOFF2, committed under `src/assets/fonts/` with their licence file, and loaded with `@font-face` and `font-display: swap`.
  - Fallbacks: `system-ui` and `ui-monospace`.
  - No npm package and no third-party font host.
- **Scale** (px at stage scale 1; the stage still scales to fit the window):

  | Use | Size / weight | Case |
  |---|---|---|
  | Region name | 17 / 700 | sentence case |
  | Region role and work line | 14.5 / 500 | sentence |
  | Card type label | 12.5 / 700, tracking 0.05em | UPPERCASE (the only uppercase on the canvas besides chips) |
  | Card "by <producer>" | 12.5 / 600 | sentence |
  | Card text (Simple) | 15 / 500 | sentence |
  | Machine lines (Technical, payloads) | 13.5 / 500, Source Code Pro | as data |
  | Line labels | 13.5 / 600 | sentence |
  | Status chip | 12.5 / 700 | UPPERCASE (unchanged words and icons) |
  | Caption | 18 / 500 | sentence |
  | Caption heading (chapter · n / N · title) | 12.5 / 700, tracking 0.07em | UPPERCASE |
  | Inspector title | 20 / 700 | sentence |
  | Inspector section label | 12.5 / 700 | UPPERCASE |
  | Inspector body | 15 / 500 | sentence |

- Weight 500 is the floor for running text, because light text on a dark ground reads thin.

### 2.2 Colour: where provenance appears

The meaning is unchanged: **colour = who produced it**. Provenance colour never colours a run of text, never colours status, and never marks selection, focus or activity.

| Element | Treatment |
|---|---|
| Region (each responsibility, The Network) | Neutral panel. 4px top edge and an 11px swatch in its colour. |
| Card produced this step (`new`) | Solid **header band** in the producer's colour, holding the type label and "by <producer>". Body tinted with 12% of the producer colour over `--card`. Border at 60% of the producer colour. |
| Earlier card used this step (`touched`) | Neutral `--card` body with a full-strength 4px edge in its producer's colour and a `--border-new` border. No band, so "made now" and "used now" read differently. |
| Earlier card, not involved | As today: `--card-earlier`, faint border, dimmed 3px producer edge, `--faded` text. |
| Presentation surface minis | Unchanged structure. Producer edge at full strength when new. |
| Handoff line (solid, content) | Stroke in the producer's colour, 2.5px. |
| Handoff label | Neutral pill (`--bg`) with an 11px producer swatch and a border at 55% of the producer colour. |
| Signal line (dashed) and work line (dotted) | Neutral, as today. Only content carries colour. |
| Inspector | See §4. |
| About dialog | Neutral `--border-new` top edge and quote rule. It no longer borrows Orchestrator cyan. |

- **Text on a solid band:** dark `#0f1216` on Presentation, Observability, Orchestrator, Intent and Collector; white `#ffffff` on Executor and The Network.
- **Tints are opaque mixes** (`color-mix` against a fixed surface), never translucent overlays, so contrast stays deterministic.
- **New tokens** in `src/theme.ts` (exact values are tuned in the build, and must pass the contrast test):
  - `--on-band-dark`, `--on-band-light`;
  - the activity token `--panel-active` (raised to about `#1d2631`);
  - the existing `--card-hover`.

### 2.3 What stays fixed

- **Status chips:** the treatment and words are unchanged (neutral outline, hatched DEGRADED, magenta VIOLATED). Only their size follows §2.1.
- **Four separate visual systems:**
  - selection is the dashed outline ring;
  - focus is the solid white ring;
  - activity is the lifted neutral region (§3.1);
  - gain is the motion overlay's inset shadow.

  None borrows another's styling or a provenance colour.
- **Hover and press** stay as in plan 4: neutral and instant.

## 3. The canvas

### 3.1 Activity and "new this step"

| Element | Treatment |
|---|---|
| Card produced this step | §2.2 header band |
| Earlier card used this step | §2.2 full-strength edge |
| Active region | `--panel-active` background, plus a `--border-new` border on the sides and bottom. The provenance top edge is unchanged. |
| Work label | A neutral pill (`--card` fill, `--border-new` border) holding the work text, beside the region name. The leading "●" goes, because it read as a status light. |

The motion overlay's `LIGHT_UP` keyframe, which starts from `--panel`, is unchanged in behaviour. Its start colour still comes from `TOKENS`.

### 3.2 Line legend

- **What:** one line in the caption bar with three short drawn samples:
  - solid line: "artifact handoff";
  - dashed: "coordination signal";
  - dotted: "work inside a responsibility".

  The samples are neutral strokes, and the legend text uses `--muted` at 12.5px.
- **When:** shown once the first-inspection hint (plan 4) has gone, in the same place. Before that, the hint occupies the slot.

### 3.3 Opening: responsibilities introduce themselves

- **Where:** while a responsibility region holds no cards (P1 and the following empty beats), it shows its role inside the empty area as two short lines, "Does …" and "Does not …".
  - The text is 15/500 in `--muted`.
  - It comes from the first `does` and first `doesNot` entry of the responsibility in the scenario data (the inspector's source), so no new copy is written.
  - The Network shows its existing "infrastructure, not an automation responsibility" note, as now.
- **What it must not do:** add a causal step, add motion, or differ between Simple and Technical. It is not interactive beyond the region title, which already opens the inspector.
- **When it goes:** the intro disappears in the beat where the region's first card appears, as part of the end state, with no animation of its own.

### 3.4 Ending

- On the last beat, **Next** becomes **Start over**, which goes to P1. Its focus behaviour matches Next.
- The caption bar adds one completion line beneath the caption. It summarises the three chapters using only facts already stated in the scenario's captions; the exact copy is reviewed in the plan.
- The header ticks all show as complete.

### 3.5 Header and caption

- **Step ticks** read as controls:
  - a hit area at least 16px tall;
  - completed ticks at `--line`, upcoming at `--tick`;
  - the current tick is wider and `--text` coloured, with `aria-current="step"`.
- **Next** (and Start over) is the primary button: `--text` fill with `--bg` text. **Back** stays secondary.
- **Caption bar:**
  - the caption at 18px;
  - the Technical scope note moves out from under the buttons to the bottom-right of the caption bar, in a single line;
  - the hint and legend slot sits at the top-right of the caption bar, as the hint does now.

### 3.6 Geometry

- The larger type must fit the fixed stage (1440×952, scaled to fit).
- Card slot heights and positions in the stage geometry are re-tuned, using the dead space the critique identified in Orchestrator and the region bottoms. The 12px spacing unit and the lane widths from spec rev 6 and 7 stay.
- The existing browser tests (no clipped text, no overlapping cards, every label inside the stage) are the referee.
- Copy that still does not fit is shortened. Each shortening is listed in `docs/deferred-work.md` for plan 6's content review, as plan 2 did. Test-required substrings stay.

## 4. The inspector

Behaviour is unchanged from plan 4: opening and closing, focus, panel side, Esc, stepping while it is open, Simple and Technical, and the earlier-version links. Only its presentation changes, plus party links (§4.3).

### 4.1 Header

- A tint of the **identity colour** (14% over `--panel`), a 6px top edge in that colour, a kind line with a swatch ("■ Artifact · by Intent"), and the 20px title.
- The ✕ button is at least 32×32px.
- The identity colour by view:

  | Inspected | Identity colour | Edge style |
  |---|---|---|
  | Artifact | its producer | solid |
  | Responsibility | its own | solid |
  | Surface | Presentation | solid |
  | Handoff line | its producer | solid |
  | Signal | Orchestrator | **dashed**, echoing the dashed line |

### 4.2 Body by view

- **Artifact:**
  1. What it is (body text).
  2. **Handed to:** one block per consumer, with a 4px edge in the consumer's colour, the consumer's name, and its "why it needs it" sentence (`uses`).
  3. **Status:** the real chip, the same component as on the canvas.
  4. **Lineage** and **Other versions:** small clickable cards, each with a 3px edge in its producer's colour.
  5. **Payload (illustrative):** Technical only. A Source Code Pro block on a darker ground, with a 3px producer edge.
- **Responsibility:**
  - **Does** and **Does not** as two plainly headed lists. There are no ✓/✕ glyphs, because green and red read as Observability and Collector.
  - **In this step** as a highlighted block (`--card` with a `--border-new` border).
  - **Produced so far** as small edged cards.
- **Handoff line:** a one-line strip, "■ Producer ──▶ ■ Consumer", drawn with a solid line in the producer's colour, then what moved and why the receiver needs it.
- **Signal:** the same strip with a neutral dashed line, from the sender to the receiver, then what it asks and what answers it.
- **Surface:** what it shows, then the received artifacts as edged cards.

### 4.3 Party links

Party names in the panel ("Intent" in a kind line, consumers under Handed to, the parties in a strip) are links that open that responsibility's view. This uses the existing `items[].target` mechanism of `inspect()`, with `{t:'responsibility', party}`.

### 4.4 Size

- The panel is sized to its content: `height: auto`, with today's 708px as the maximum, scrolling beyond that.
- The width stays 400px, and the side rules from plan 4 D4 stay.

## 5. Delivery and checks

- **Order:**
  1. Plan 4 is finished and merged first.
  2. This work runs as **plan 5** on branch `plan-5-design`, cut from `main`.
  3. The a11y and content pass becomes **plan 6**. The `Plan 5:` tags in `docs/deferred-work.md` are renamed `Plan 6:`.
- **Build order:**
  1. Fonts and tokens.
  2. Canvas: regions, cards, lines and labels.
  3. Header, caption, legend, opening and ending.
  4. Geometry re-tune.
  5. **Owner's visual check-in on the real canvas.** Type size can still change cheaply here.
  6. Inspector.
  7. Impeccable finish.
- **Unit tests:**
  - contrast of every text-on-band pair, every tint body against its text, and the new tokens;
  - an `inspect()` test that party items carry responsibility targets.
  - Existing semantic and story tests are untouched.
- **Browser tests:**
  - existing layout, focus, motion, reduced-motion and accessibility-scan tests pass unchanged, or are updated only where a selector or rendered text changed by design;
  - new tests:
    - the inspector header carries the identity colour's edge;
    - a party link opens the responsibility view;
    - Start over on the last beat goes to P1 and keeps focus;
    - the legend replaces the hint after the first inspection;
    - the P1 intro is gone once a region has a card.
- **Impeccable finish:**
  - the detector on changed files;
  - a fresh finish reviewer working from 1440×900 screenshots against this spec;
  - its documenter writing `DESIGN.md` and `.impeccable/design.json` from the built result.
- **Docs:**
  - ADR 0003;
  - a pointer and revision-log entry in the main spec;
  - brief 04's provenance line is noted as superseded by ADR 0003. The brief itself is guidance and is not edited.

## 6. Out of scope

- Layout changes beyond slot re-tuning.
- A light theme.
- New motion moments.
- Mobile.
- Content rewrites beyond what fit requires (plan 6).
- The detector's flags on the 3px provenance edges (deliberate, ADR 0003).
- The About "eyebrow" label: plan 6, with the other Impeccable notes in `docs/deferred-work.md`.

## 7. Open items

- **The final type size:** confirmed at the visual check-in (§5).
- **The completion line's copy:** drafted in the plan, approved by the owner.

## As built (plan 5)

Where this list and the sections above disagree, this list wins.

- **D1. Executor's band** is filled with `--executor-band` `#5b5ede` (Executor mixed 92% with black), because white text on `#6366f1` reaches only 4.47:1. Edges, strokes, swatches and tints keep `#6366f1`.
- **D2. The caption bar is 100px.** The two row gaps are 24px and the Network → caption hug is 12px; the top lane keeps 30px.
- **D3. The completion line** sits in the caption bar's top-right slot, not beneath the caption: "Story complete: provisioned and verified, degradation detected, service restored on path B. The link still needs repair."
- **D5. Lane labels** use 12px, the floor.
- **D6. Status and marker** sit on their own line under the card header, never on the band.
- **D7. The artifact inspector** keeps Meaning. "Produced by" became the kind line, and "Used by" became "Handed to".
- **Card type is smaller than §2.1** (owner, at the check-in), because the cards did not fit the fixed stage: card text 13.5px, payload lines 12px, card header 11.5px, card line height 1.2. "by <producer>" shows on new cards only. Narrow Collector cards use 12.5 / 11 / 11, and Presentation minis 11.5. Every other size follows §2.1.
- **13 copy shortenings** made to fit are listed in `docs/deferred-work.md` ("Plan 6: shortened for fit (plan 5)"). No sentence that carries a NAF invariant was cut.
- **§3.3 opening intros were dropped** (owner, at the check-in): "Does" and "Does not" live only in the inspector.
- **Surface subtitles were dropped from the canvas** (owner). The inspector's surface view opens with "What it is", a sentence or two per surface (`SURFACE_ROLES`).
- **Work lines are coloured** (owner), replacing §2.2's "neutral" work line. A work line is a thinner (1.5px) solid line in the producer's colour, with a small arrowhead: a minor version of a handoff. The legend's work sample is a thin solid line.
- **Arrowheads** use one marker per colour, because `context-stroke` does not resolve in the target browser.
- **Back and Next** use an inline SVG triangle, so the accessible names are "Back" and "Next".
- **Open with the owner:** the finish review found the solid Observability (and Orchestrator) band loud on the dark canvas. A band-only deeper shade, like D1, is the suggested option. Not changed.
