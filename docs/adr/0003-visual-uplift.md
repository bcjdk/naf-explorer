# ADR 0003: NAF colour reaches the documents, and the explainer gets its own typeface

- **Status:** proposed, 2026-10-12
- **Amends:** `docs/specs/2026-10-10-naf-explorer-design.md` §10; supersedes the provenance-colour line of `docs/brief/04-experience-and-visual-direction.md` (guidance)

## Context

The owner found the explainer dull, and the inspector especially so. An Impeccable critique (2026-10-12, 29/40) agreed. It found that the NAF colours, the product's identity and its visual grammar, appeared only as a 2px region edge, a swatch and a dimmed card bar. With labels covered, the six responsibilities were six identical grey boxes. Type was `system-ui` at 10–12px, too small for a projector.

Brief 04 said provenance colour is "a thin accent… never fills or text colour". The spec made that rule binding in §10.

## Decision

- **Colour reach.** Provenance colour may appear as:
  - tints (opaque mixes of up to about 14%) on documents and the inspector header;
  - solid bands on the header of a card produced this step, and on the inspector's top edge;
  - the stroke of solid handoff lines;
  - swatches on handoff labels.

  It still never colours a run of text, never colours status, and never marks selection, focus or activity. Regions stay neutral, apart from their edge and swatch (design-uplift spec, direction C).
- **Typeface.** Source Sans 3 and Source Code Pro (SIL Open Font License) are committed as Latin-subset WOFF2 files with their licence, loaded with `@font-face`. They replace `system-ui` and `ui-monospace`, which remain as fallbacks. There is no npm dependency and no third-party font host.

## Consequences

- Text on solid bands has to meet AA for every producer colour. Executor and The Network take white text; the other five take dark text. A unit test enforces this.
- Larger type (card text 15px, caption 18px) means re-tuning card slots, and copy may need shortening; shortenings are listed for plan 6.
- The page now loads about 6 font files (on the order of 150–250 KB). Fallback fonts show until they load.
- Impeccable's detector will keep flagging the 3px provenance edges as "side-tab" accents. They are deliberate.
