---
name: How Network Automation Works
description: A calm, dark, technical canvas where colour says who produced a thing and nothing else.
colors:
  bg: '#0f1216'
  panel: '#151a20'
  panel-active: '#1d2631'
  card: '#1b2129'
  card-earlier: '#161b22'
  card-hover: '#232a34'
  border-faint: '#222932'
  border: '#2c343f'
  border-new: '#8b97a8'
  text: '#e6e9ee'
  muted: '#a3adbb'
  faded: '#7d8796'
  line: '#9aa5b4'
  tick: '#6b7686'
  focus: '#ffffff'
  presentation: '#f5c518'
  observability: '#00e676'
  orchestrator: '#00d4ff'
  intent: '#ff6d2e'
  collector: '#f43f5e'
  executor: '#6366f1'
  executor-band: '#5b5ede'
  network: '#64748b'
  on-band-dark: '#0f1216'
  on-band-light: '#ffffff'
  hatch-a: '#d4d9e0'
  hatch-b: '#aeb6c1'
  violated: '#e879f9'
  chip-text: '#e6e9ee'
  hatch-text: '#0f1216'
  violated-text: '#0f1216'
typography:
  body:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.4
  caption-text:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: '18px'
    fontWeight: 500
    lineHeight: 1.35
  region-title:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: '17px'
    fontWeight: 700
    lineHeight: 1.3
  inspector-title:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: '20px'
    fontWeight: 700
    lineHeight: 1.25
  inspector-body:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: '15px'
    fontWeight: 500
    lineHeight: 1.4
  card-body:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: '13.5px'
    fontWeight: 500
    lineHeight: 1.2
  card-payload:
    fontFamily: "'Source Code Pro', ui-monospace, monospace"
    fontSize: '12px'
    fontWeight: 500
    lineHeight: 1.2
  card-header:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: '11.5px'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '0.05em'
  label:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: '13.5px'
    fontWeight: 600
    lineHeight: 1.3
  code:
    fontFamily: "'Source Code Pro', ui-monospace, monospace"
    fontSize: '13.5px'
    fontWeight: 400
rounded:
  sm: '3px'
  md: '4px'
  lg: '6px'
  xl: '10px'
  pill: '999px'
spacing:
  stage-margin: '12px'
  band-gap: '24px'
  band-gap-presentation: '30px'
  card-pad-x: '10px'
  inspector-pad: '16px'
components:
  region:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.text}'
    rounded: '{rounded.lg}'
  region-active:
    backgroundColor: '{colors.panel-active}'
  card-earlier:
    backgroundColor: '{colors.card-earlier}'
    textColor: '{colors.faded}'
    rounded: '{rounded.md}'
    padding: '0 8px 4px 10px'
  card-touched:
    backgroundColor: '{colors.card}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
  card-hover:
    backgroundColor: '{colors.card-hover}'
  button-primary:
    backgroundColor: '{colors.text}'
    textColor: '{colors.bg}'
    rounded: '{rounded.md}'
    padding: '5px 14px'
  button-secondary:
    backgroundColor: '{colors.card}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '5px 14px'
  label:
    backgroundColor: '{colors.bg}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '1px 7px'
  inspector:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.text}'
    rounded: '{rounded.lg}'
    width: '400px'
---

# Design System: How Network Automation Works

## Overview

**Creative North Star: "The Annotated Blueprint"**

One fixed 1440x952 stage (scaled to fit the window) holds seven neutral dark regions that never move. Everything on it is a document: a card, a label, a line. The only loud thing is provenance colour, the NAF block colours, and it is spent narrowly so the eye can follow who made what. The rest is quiet slate, Source Sans 3 set larger and heavier than a dashboard would, so it reads from a projector.

The look is calm and technical. Regions are flat panels, not tinted. Cards are paper-like documents that fade as the story moves on. Selection, focus, activity and gain are four separate visual systems so a viewer never has to guess which one they are seeing.

**Key Characteristics:**

- Neutral dark canvas; colour is provenance only.
- Fixed stage geometry, hard-coded per scenario (layout.ts).
- Status is always icon + word, in neutral or non-provenance styling.
- Hover and press are neutral and instant; all motion lives in ui/motion.ts.
- Type is one humanist sans with a monospace only for payloads and node names.

## Colors

A near-black slate base, one cool grey ramp for structure, and seven fixed provenance colours.

### Primary (provenance, by responsibility)

- **Presentation Yellow** (#f5c518), **Observability Green** (#00e676), **Orchestrator Cyan** (#00d4ff), **Intent Orange** (#ff6d2e), **Collector Rose** (#f43f5e), **Executor Indigo** (#6366f1, band fill #5b5ede so white band text meets AA), **Network Slate** (#64748b).

### Neutral

- **Night Slate** (#0f1216): stage, label fill, text on light bands and on the primary button.
- **Panel / Active Panel** (#151a20 / #1d2631): regions at rest / when active.
- **Card, Earlier Card, Hover Card** (#1b2129 / #161b22 / #232a34).
- **Hairline, Border, Bright Border** (#222932 / #2c343f / #8b97a8): faded cards, default edges, "new/active/hover" edges.
- **Ink, Muted, Faded** (#e6e9ee / #a3adbb / #7d8796): text; Faded is the dimmest AA text, used only on earlier cards.
- **Line, Tick** (#9aa5b4 / #6b7686): neutral signal lines, progress ticks, links.
- **Focus White** (#ffffff), **Hatch** (#d4d9e0 / #aeb6c1, DEGRADED), **Violated Magenta** (#e879f9, VIOLATED only).

### Named Rules

**The Provenance-Only Rule.** Colour means who produced a thing, and nothing else. It appears only as: the region's 4px top edge and its swatch; a new card's header band, 12% tint and 60% border; a touched card's 4px left edge (earlier cards: 40% edge); handoff lines (2.5px) and work lines (1.5px) with their same-colour arrowheads (one marker per colour); the handoff label's border and its swatch; the inspector's identity header (6px top edge, 14% tint), consumer-block and lineage edges, and payload edge. It never colours a run of text, a status, a selection, focus or activity.
**The Status Rule.** HEALTHY, DEGRADED, VIOLATED, CLEARED are chips with a glyph and the word: outlined ink for HEALTHY/CLEARED, hatched grey for DEGRADED, magenta fill for VIOLATED. Never a provenance colour, never colour alone.
**The Band Text Rule.** Text on a solid band is dark (#0f1216) on the light colours, white on Executor and The Network.

## Typography

**Display/Body Font:** Source Sans 3 (variable 400-700, self-hosted, with system-ui).
**Mono Font:** Source Code Pro (400-500), only for payload code and topology node names.

**Character:** a humanist sans, medium weight by default, set larger than the 13px base wherever people read it.

### Hierarchy

- **Inspector title** (700, 20px, 1.25) and **inspector body** (500, 15px, 1.4).
- **Caption** (500, 18px, 1.35) with a 12.5px/700/0.07em uppercase muted heading above it.
- **Region title** (700, 17px); role text beside it 14.5px/500 muted; work pill 14.5px/500.
- **Chapter/nav/surface name** (600-700, 14.5px); app title 17px/700.
- **Card body** (500, 13.5px); **payload line** (500, 12px); **card header** (700, 11.5px, 0.05em, uppercase). Narrow cards (container under 160px) step to 11px header, 12.5px body, 11px lines.
- **Label** (600, 13.5px); lane labels 12px, the floor for text.
- **Chip** 12.5px/700 (11.5px inside cards); **code** 13.5px mono.

### Named Rules

**The Smaller-Card Rule.** Card type is deliberately smaller than the spec (13.5 / 12 / 11.5); the inspector, not the card, carries the reading size. Do not go below 11px.

## Layout

A fixed 1440x952 stage, uniformly scaled to fit. Header 36px; regions start at y 52. Side margins 12px; blocks sit 30px apart under Presentation and 24px elsewhere. Presentation spans the top (1416x84); Observability, Orchestrator, Intent in the middle (488 / 296 / 488 wide, 72px lanes between carry exchange labels); Collector and Executor below; The Network (1416x106) at the bottom; the caption bar (100px) sits at y 844. Responsibilities stay in fixed places; cards occupy fixed per-kind slots (about 232px wide) inside their producer's region. The inspector is 400px wide, opens opposite the selection, up to 708px tall. Desktop only.

## Elevation & Depth

Flat and tonal. Depth is a one-step lift in fill (card, then card-hover, panel to panel-active), never a shadow, except the About dialog's single ambient drop. Earlier versions of a card stack behind it as 3px offset layers.

### Four visual systems (never share styling)

- **Selection:** a 2px dashed ink ring: outside a region or line label (offset 3px), just inside a surface (offset −3px); on a card, a dashed overlay 1px inside the border, haloed in the stage colour so it shows over a bright band, because cards sit flush with their region's clipped edges.
- **Focus:** a 2px solid white ring inside the element (offset -2px); 2px outside for text-like controls.
- **Activity:** a lifted panel (#1d2631) with a brighter border; the provenance edge stays.
- **Gain:** a brief 1px inset shadow in the bright border colour, animated only.

### Named Rules

**The Instant Neutral Rule.** Hover and press are neutral fills and brighter borders, applied instantly, with no transitions. They never touch the provenance edge.
**The One Motion File Rule.** All animation (dot travel, light-up, gain, fades, chip pulse) lives in ui/motion.ts; CSS declares end states only.

## Shapes

Small, quiet radii: 3px chips, 4px cards/labels/buttons, 6px regions/inspector/view switch, 10px About dialog, pill only for the work pill. Provenance is expressed as straight edges (4px region top, 3-4px card left, 6px inspector top). Lines are round-capped; signals are dashed (6 4), content handoffs solid 2.5px, work lines solid 1.5px. Arrowheads use the default `markerUnits="strokeWidth"`, so they render at about 9px (work: 6 × 1.5), about 20px (handoff: 8 × 2.5) and about 14px (signal: 8 × 1.75).

## Components

### Region

Neutral panel, 1px border, 4px provenance top edge, swatch (11px square, 2px radius) beside a 17px name that is dotted-underlined as inspectable.

### Card

- **Earlier:** no tint, hairline border, 40% provenance edge, Faded text, no producer name.
- **Touched:** card fill, bright border, full 4px edge, no band.
- **New:** provenance header band bleeding to the card edges, 12% tint, 60% border, and the producer named in the band.
- **Hover:** hover fill and bright border except the edge; earlier text steps to Muted.

### Status chip

Outlined 1.5px, 3px radius, glyph plus word, bold 0.04em.

### Lines and labels

Labels are bg-filled 4px-radius pills on the line; handoff labels carry a producer swatch and 55% border. Signals are neutral (#9aa5b4).

### Caption bar and buttons

Caption left; legend or completion line in the top-right slot; Back/Next top-right at 14.5px/600. Next (and Start over) is the primary: ink fill, dark text. Disabled uses aria-disabled and Muted text.

### Inspector

Identity header: 14% producer tint, 6px producer top edge (dashed for signals), kind line, 20px title, close button. Body: sections with 12.5px uppercase muted h3; consumer blocks edged in the consumer's colour; lineage cards; code block on bg edged in the payload producer's colour; a strip drawn like the line itself.

## Do's and Don'ts

### Do:

- **Do** use a provenance colour only on edges, swatches, bands, tints, borders, lines and arrowheads.
- **Do** write status as glyph + word and keep it out of the provenance palette.
- **Do** keep selection (dashed ring), focus (solid white ring), activity (lifted panel) and gain (inset shadow) distinct.
- **Do** keep hover and press neutral and instant; put motion in ui/motion.ts.
- **Do** check text on bands for AA (white on Executor #5b5ede and Network).

### Don't:

- **Don't** colour a run of text, a status or a selection with a provenance colour.
- **Don't** tint regions; they stay neutral, with only the 4px edge and swatch.
- **Don't** add canvas Does/Does-not intros or surface subtitles; the inspector explains.
- **Don't** add neon, glassmorphism, NOC-wall styling or decorative motion.
- **Don't** add CSS transitions or keyframes outside ui/motion.ts.
