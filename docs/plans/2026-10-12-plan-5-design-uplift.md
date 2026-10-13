# Plan 5: Design uplift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Executed subagent-driven: Sonnet implements, Opus reviews every task and the whole branch (user preference). Each task has a **Model:** line. **Stop after Task 4** for the owner's visual check-in.

**Goal:** Make the explainer look sure of itself without changing the story or the semantics:
- a real typeface at a larger, heavier scale;
- NAF colour on the documents, the handoff lines and the inspector (direction C);
- a stronger "new this step";
- a line legend;
- an opening and an ending;
- an inspector that speaks the same visual language as the canvas.

**Architecture:**
- Almost all of the change is CSS in `src/app.css` and markup in the existing Svelte components. Provenance reaches CSS as the existing `--accent` custom property.
- Tints are `color-mix(in srgb, …)` against a fixed surface. The contrast unit test reproduces that mix in TypeScript, so every tint is checked.
- The inspector's model (`inspect()`) gains a little structure: an identity party, a status chip, party links and a "look" per section. `Inspector.svelte` draws each look.
- Geometry stays hard-coded in `src/layout.ts`. It is re-tuned once, with the existing layout browser test as the referee.

**Tech Stack:** Svelte 5 (runes), TypeScript strict, Vite, Vitest, Playwright (Chromium). No new npm dependencies. The two OFL font files are committed project assets (ADR 0003).

**Spec:** `docs/specs/2026-10-12-design-uplift.md`. It extends `docs/specs/2026-10-10-naf-explorer-design.md`; this plan makes that spec rev 11 (Task 7). The decision record is `docs/adr/0003-visual-uplift.md`.

**Builds on:** `main` at 84d692e (plans 1-4). Work on branch `plan-5-design`, which is already cut.

## Decisions (controller, for the owner's review)

- **D1. The Executor band is a shade darker.** White on Executor `#6366f1` is 4.47:1, and dark text is 4.20:1, so neither meets AA for 12.5px bold text. The band fill for Executor only is `--executor-band: #5b5ede` (Executor mixed 92% with black), which gives white text 5.12:1. Edges, strokes, swatches and tints keep `#6366f1`. The difference is not visible beside the true colour.
- **D2. The caption bar grows from 84px to 100px**, which is a small change to the region bands (§3.6 allowed only slot re-tuning).
  - **Why:** at 18px, the longest captions need three lines. Those are R2 Technical at 370 characters, R15 at 348, R2 Simple at 331 and P1 Technical at 316. Three lines plus the heading need about 98px.
  - **How:** the two row gaps go from 30px to 24px (2 × the 12px unit), and the Network → caption hug goes from 16px to 12px. The top lane, which carries two tracks of labels, keeps its 30px. New numbers are in Task 4.
  - **The alternative** is to keep 84px and shorten those four captions in this plan.
- **D3. The completion line sits in the caption bar's top-right slot**, where the hint and the legend sit, rather than "beneath the caption". R15's caption is already three lines, so there is no room beneath it. The legend gives way to the completion line on the last beat.
  - **Draft copy, for the owner's approval:** "Story complete: provisioned and verified, degradation detected, service restored on path B. The link still needs repair."
  - **Sources:** P14 (verified healthy), the Detect chapter (SLO violated), and R15 (path B, link still faulty).
- **D4. Opening intros appear in the five automation regions only.** Presentation always holds its five surfaces and The Network always holds its topology, so neither is ever "empty". The Network keeps its existing note.
- **D5. Lane labels may stay smaller than 13.5px.** The side lanes are fixed at 72px (spec rev 6 and 7). A label that sits in a lane may use the smallest size that fits, but no less than 12px. Task 4 records each one for the check-in.
- **D6. Status and marker move out of the card header into their own line.** A neutral status chip on a solid producer band would fail contrast and blur "status is never a provenance colour". The band holds only the type label and "by <producer>".
- **D7. The artifact inspector keeps "Meaning".** §4.2 lists only "What it is", but Meaning is the card's own sentence, and dropping content is out of scope. "Produced by" becomes the kind line ("■ Artifact · by Intent"), and "Used by" becomes "Handed to".
- **D8. Two tests stay red until geometry is re-tuned.** In Tasks 2 and 3, the layout test ("nothing overflows…") may fail because the bigger type has not been fitted yet. Every other check stays green. Those tasks commit after running e2e with `--grep-invert "nothing overflows"`. Task 4 must make the layout test green, and the whole `npm run verify` green, before the check-in.

## Global Constraints

- **NAF invariants (CLAUDE.md) are untouched.** No change to `src/scenario/` story data, except the new `ENDING` string (Task 3) and the copy shortenings that Task 4 records.
- **Colour = who produced it.** Provenance colour never colours a run of text, never colours status, and never marks selection, focus or activity.
- **Status chips keep their treatment and words:** neutral outline, hatched DEGRADED, magenta VIOLATED. Only their size changes.
- **Four separate visual systems:**
  - selection: dashed outline ring;
  - focus: solid white ring;
  - activity: `--panel-active` region with a `--border-new` border;
  - gain: the motion overlay's inset shadow.

  None borrows another's styling or a provenance colour.
- **Hover and press** stay neutral and instant, with no transitions (plan 4).
- **Type faces:** Source Sans 3 (400-700) and Source Code Pro (400, 500), Latin-subset WOFF2 under `src/assets/fonts/` with `OFL.txt`, loaded with `font-display: swap`. The fallbacks are `system-ui` and `ui-monospace`.
- **Type scale** (px at stage scale 1), verbatim from spec §2.1:

  | Use | Size / weight | Case |
  |---|---|---|
  | Region name | 17 / 700 | sentence case |
  | Region role and work line | 14.5 / 500 | sentence |
  | Card type label | 12.5 / 700, tracking 0.05em | UPPERCASE |
  | Card "by <producer>" | 12.5 / 600 | sentence |
  | Card text (Simple) | 15 / 500 | sentence |
  | Machine lines (Technical, payloads) | 13.5 / 500, Source Code Pro | as data |
  | Line labels | 13.5 / 600 | sentence |
  | Status chip | 12.5 / 700 | UPPERCASE |
  | Caption | 18 / 500 | sentence |
  | Caption heading | 12.5 / 700, tracking 0.07em | UPPERCASE |
  | Inspector title | 20 / 700 | sentence |
  | Inspector section label | 12.5 / 700 | UPPERCASE |
  | Inspector body | 15 / 500 | sentence |

- **Weight 500 is the floor** for running text.
- **Text on bands:** dark `#0f1216` on Presentation, Observability, Orchestrator, Intent and Collector; white `#ffffff` on Executor (on `--executor-band`, D1) and The Network.
- **Tints are opaque mixes:**
  - a new card's body is 12% producer over `--card`, with a border of 60% producer over `--border`;
  - a handoff label's border is 55% producer over `--border`;
  - the inspector header is 14% identity colour over `--panel`.
- **Simple and Technical** change text only.
- **Fixed stage of 1440×952**, scaled to fit. No scrolling, nothing clipped.
- **Never weaken a test.** A test changes only where a selector or rendered text changed by design, and the task report lists each such change.
- **Before every commit:**
  - run `npm run format:check`, `npm run check`, `npm test` and `npm run build`;
  - run e2e, with the D8 exception in Tasks 2 and 3 only.

## Review Focus

1. **Fonts not loaded yet** (`font-display: swap`). The layout test must measure the real faces, not the fallbacks. *Pinned in Task 1:* the layout test waits for `document.fonts.ready`, and a font test checks that the faces are in use.
2. **The longest Technical caption beside the scope note.** In every beat, the moved scope note must not sit on top of the caption's last line. *Pinned in Task 4:* a per-line overlap test over every beat in Technical.
3. **Start over pressed while the last beat is still animating, or pressed by keyboard.** The expected result: it lands on P1 with no running motion, and focus stays on the same button, now named "Next ►". *Pinned in Task 3.*
4. **The P1 intro in a region whose first card is fading in.** The intro must already be gone at time 0 of that beat, so it never shows through the fade. *Pinned in Task 3:* checked at P3 directly after a Next from P2.
5. **A party link inside the panel, when the party's region is behind the panel.** Following the link must not lose focus, and the panel moves to the side opposite the newly ringed region. *Pinned in Task 6.*

---

### Task 1: Fonts and tokens

**Model:** sonnet

**Files:**
- Create: `src/assets/fonts/source-sans-3-latin.woff2`, `src/assets/fonts/source-code-pro-latin.woff2`, `src/assets/fonts/OFL.txt`
- Modify: `src/app.css` (`@font-face` rules, base font, `code`, `.node-name`, `.about`, `.about kbd`)
- Modify: `src/theme.ts`
- Modify: `tests/unit/contrast.test.ts`
- Modify: `tests/e2e/skeleton.spec.ts` (the layout test waits for fonts; a new font test)

**Interfaces:**
- Produces these tokens, as CSS custom properties through `tokenStyle`, for later tasks:
  - `--on-band-dark` and `--on-band-light`;
  - `--executor-band`;
  - `--panel-active` (new value).
- Produces the font family names `'Source Sans 3'` and `'Source Code Pro'`.

- [ ] **Step 1: Download the fonts and the licence**

Google Fonts serves one variable WOFF2 file per family and subset when you ask for a weight range. Run the following from the repo root:

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
CSS=$(curl -sA "$UA" 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400..700&family=Source+Code+Pro:wght@400..500&display=swap')
# Each family's "/* latin */" block (not latin-ext) holds its url(...).
SANS=$(printf '%s' "$CSS" | awk '/Source Sans 3/{f=1} f&&/\/\* latin \*\//{l=1} l&&/url\(/{match($0,/url\([^)]*\)/);print substr($0,RSTART+4,RLENGTH-5);exit}')
MONO=$(printf '%s' "$CSS" | awk '/Source Code Pro/{f=1} f&&/\/\* latin \*\//{l=1} l&&/url\(/{match($0,/url\([^)]*\)/);print substr($0,RSTART+4,RLENGTH-5);exit}')
mkdir -p src/assets/fonts
curl -so src/assets/fonts/source-sans-3-latin.woff2 "$SANS"
curl -so src/assets/fonts/source-code-pro-latin.woff2 "$MONO"
curl -s https://raw.githubusercontent.com/adobe-fonts/source-sans/release/LICENSE.md > src/assets/fonts/OFL.txt
printf '\n\n---\n\n' >> src/assets/fonts/OFL.txt
curl -s https://raw.githubusercontent.com/adobe-fonts/source-code-pro/release/LICENSE.md >> src/assets/fonts/OFL.txt
file src/assets/fonts/*.woff2 && ls -l src/assets/fonts
```

Expected: two files reported as `Web Open Font Format (Version 2)`, each 20-120 KB, and an `OFL.txt` that contains "SIL OPEN FONT LICENSE" twice.

If the awk picks a `latin-ext` URL, or the two URLs are the same, open `$CSS` and copy the URL from the right `/* latin */` block by hand. Read the CSS to check that the Source Sans `@font-face` blocks for different weights share one URL (a variable font). If they don't, download the 400, 500, 600 and 700 files separately, and write one `@font-face` rule per weight in Step 5.

- [ ] **Step 2: Write the failing contrast tests**

Replace `tests/unit/contrast.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { TOKENS } from '../../src/theme.ts';

type Token = keyof typeof TOKENS;
const PRODUCERS = [
  'presentation',
  'observability',
  'orchestrator',
  'intent',
  'collector',
  'executor',
  'network',
] as const;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** An opaque sRGB mix, exactly as CSS `color-mix(in srgb, a p%, b)` renders it. */
const mix = (a: string, b: string, p: number) =>
  '#' +
  rgb(a)
    .map((c, i) => Math.round(c * p + rgb(b)[i]! * (1 - p)))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('');
const hex = (c: string) => (c.startsWith('#') ? c : TOKENS[c as Token]);
const luminance = (c: string) => {
  const [r, g, b] = rgb(hex(c)).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};
/** The band fill and its text for each producer (spec §2.2; D1). */
const band = (p: (typeof PRODUCERS)[number]) =>
  p === 'executor'
    ? (['executor-band', 'on-band-light'] as const)
    : p === 'network'
      ? (['network', 'on-band-light'] as const)
      : ([p, 'on-band-dark'] as const);

describe('colour tokens meet WCAG AA (spec §10; design uplift §2.2)', () => {
  it('text and muted text on every surface', () => {
    for (const fg of ['text', 'muted']) {
      for (const bg of ['bg', 'panel', 'panel-active', 'card', 'card-earlier', 'card-hover']) {
        expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('faded text on earlier cards and regions', () => {
    for (const bg of ['card-earlier', 'panel', 'bg'])
      expect(contrast('faded', bg), `faded on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it('status chips', () => {
    for (const bg of ['card', 'card-hover', 'panel'])
      expect(contrast('chip-text', bg)).toBeGreaterThanOrEqual(4.5);
    for (const p of PRODUCERS)
      expect(
        contrast('chip-text', mix(TOKENS[p], TOKENS.card, 0.12)),
        `chip on ${p} tint`,
      ).toBeGreaterThanOrEqual(4.5);
    expect(contrast('hatch-text', 'hatch-a')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('hatch-text', 'hatch-b')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('violated-text', 'violated')).toBeGreaterThanOrEqual(4.5);
  });

  it('text on every solid producer band', () => {
    for (const p of PRODUCERS) {
      const [fill, fg] = band(p);
      expect(contrast(fg, fill), `${fg} on ${fill}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('text and muted text on every tinted card body and inspector header', () => {
    for (const p of PRODUCERS) {
      const body = mix(TOKENS[p], TOKENS.card, 0.12);
      const header = mix(TOKENS[p], TOKENS.panel, 0.14);
      for (const fg of ['text', 'muted']) {
        expect(contrast(fg, body), `${fg} on ${p} card tint`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fg, header), `${fg} on ${p} inspector tint`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('non-text: step ticks, lines and coloured handoff strokes reach 3:1', () => {
    expect(contrast('tick', 'bg')).toBeGreaterThanOrEqual(3);
    for (const bg of ['bg', 'panel', 'card'])
      expect(contrast('line', bg)).toBeGreaterThanOrEqual(3);
    for (const p of PRODUCERS)
      for (const bg of ['bg', 'panel', 'panel-active'])
        expect(contrast(p, bg), `${p} stroke on ${bg}`).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run tests/unit/contrast.test.ts`
Expected: FAIL in "text on every solid producer band", because `executor-band`, `on-band-light` and `on-band-dark` are undefined.

- [ ] **Step 4: Add the tokens**

In `src/theme.ts`, set `'panel-active': '#1d2631',`, and add these after `'card-hover'`:

```ts
  /** Text on a solid producer band (spec §2.2): dark on the light colours, white on Executor and The Network. */
  'on-band-dark': '#0f1216',
  'on-band-light': '#ffffff',
```

Then add this after `executor`:

```ts
  /** Executor's band fill only: 8% darker, so white text meets AA (4.47:1 on the true colour; plan 5 D1). */
  'executor-band': '#5b5ede',
```

Update the doc comment at the top of the file to read:

```ts
/**
 * Colour tokens, defined once (spec §10, ADR 0003). App.svelte applies them as CSS custom properties;
 * tests/unit/contrast.test.ts checks their contrast. Provenance colours mark who produced a thing: edges, swatches,
 * handoff strokes, bands and opaque tints. They never colour a run of text, status, selection, focus or activity.
 */
```

- [ ] **Step 5: Load the faces**

At the top of `src/app.css`, add:

```css
/* Self-hosted, OFL (src/assets/fonts/OFL.txt; ADR 0003). Variable fonts: one file covers each weight range. */
@font-face {
  font-family: 'Source Sans 3';
  src: url('./assets/fonts/source-sans-3-latin.woff2') format('woff2');
  font-weight: 400 700;
  font-display: swap;
}
@font-face {
  font-family: 'Source Code Pro';
  src: url('./assets/fonts/source-code-pro-latin.woff2') format('woff2');
  font-weight: 400 500;
  font-display: swap;
}
```

In the same file:
- The `html, body` font becomes `13px/1.4 'Source Sans 3', system-ui, sans-serif`.
- `code` becomes `font-family: 'Source Code Pro', ui-monospace, monospace;`.
- `.node-name` becomes `font: 500 11px 'Source Code Pro', ui-monospace, monospace;`.
- `.about` becomes `15px/1.6 'Source Sans 3', system-ui, sans-serif`.
- `.about kbd` becomes `600 13px/1.5 'Source Sans 3', system-ui, sans-serif`.

Sizes stay as they are in this task. Task 2 applies the scale.

- [ ] **Step 6: Make the layout test wait for the faces, and pin them**

In `tests/e2e/skeleton.spec.ts`, inside the test `'nothing overflows, cards stay in their region without overlapping, and labels cover no card'`, add this as the first line after `test.setTimeout(120_000);`:

```ts
  await page.evaluate(() => document.fonts.ready);
```

After that test, add:

```ts
test('the explainer uses its own faces, not the fallbacks', async ({ page }) => {
  await page.getByRole('button', { name: 'Technical' }).click();
  await page.getByRole('button', { name: 'Go to P5: Derive desired state' }).click();
  await page.evaluate(() => document.fonts.ready);
  const used = await page.evaluate(() => ({
    sans: document.fonts.check('500 15px "Source Sans 3"'),
    mono: document.fonts.check('500 13px "Source Code Pro"'),
    caption: getComputedStyle(document.querySelector('.caption p')!).fontFamily,
    code: getComputedStyle(document.querySelector('.card code')!).fontFamily,
  }));
  expect(used.sans).toBe(true);
  expect(used.mono).toBe(true);
  expect(used.caption).toMatch(/^"?Source Sans 3/);
  expect(used.code).toMatch(/^"?Source Code Pro/);
});
```

Check the P5 tick name against `STEPS` with `npm run beats`. If the P5 title differs, use `tick(page, stepIndex('P5'))` instead of the literal name.

- [ ] **Step 7: Run everything**

Run: `npx vitest run tests/unit/contrast.test.ts`. Expected: PASS.

Run: `npm run verify`. Expected: all green. Source Sans 3 is narrower than the system faces, so the layout test should still pass at today's sizes. If it doesn't, report the failing beat rather than changing geometry; geometry is Task 4.

- [ ] **Step 8: Commit**

```bash
git add src/assets/fonts src/app.css src/theme.ts tests/unit/contrast.test.ts tests/e2e/skeleton.spec.ts
git commit -m "Plan 5: self-hosted Source Sans 3 and Source Code Pro; band, tint and activity tokens"
```

---

### Task 2: The canvas: regions, cards, surfaces, lines and labels

**Model:** sonnet

**Files:**
- Modify: `src/app.css` (regions, cards, chips, surfaces, lines, labels, About accents)
- Modify: `src/ui/Stage.svelte` (work pill without "●")
- Modify: `src/ui/Card.svelte` (header holds type and by; a status line; `data-producer`)
- Modify: `src/ui/Lines.svelte` (handoff stroke and label swatch colour)
- Modify: `src/layout.ts` (`inside`: the region's top edge is 4px)
- Test: `tests/e2e/skeleton.spec.ts` (a new test)

**Interfaces:**
- Consumes the Task 1 tokens: `--on-band-dark`, `--on-band-light`, `--executor-band` and `--panel-active`.
- Produces:
  - `.card[data-producer="<party>"]`;
  - the card markup `.head > .by + .type`, then an optional `.status` line holding `.chip` and `.marker`, then `.body`;
  - `.label.handoff > .swatch`, styled through `--accent`.

  Task 4 tunes the sizes of all of these.

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/skeleton.spec.ts`:

```ts
test('colour shows who made it: bands on new cards, edges on used ones, coloured handoffs', async ({
  page,
}) => {
  await tick(page, stepIndex('P5')).click();
  const s = stateAt(stepIndex('P5'));
  const fresh = s.newIds[0]!;
  const band = page.locator(`.card[data-version="${fresh}"] .head`);
  // Intent's band: the producer colour behind dark text.
  await expect(band).toHaveCSS('background-color', 'rgb(255, 109, 46)');
  await expect(band).toHaveCSS('color', 'rgb(15, 18, 22)');
  await expect(band).toHaveCSS('text-transform', 'uppercase');
  // Region names are sentence case at 17px bold, with no "●" before the work.
  const h = page.locator('#h-intent');
  await expect(h.locator('.region-name')).toHaveCSS('font-size', '17px');
  await expect(h.locator('.region-name')).toHaveCSS('text-transform', 'none');
  await expect(h.locator('.work')).not.toContainText('●');
  await expect(page.locator('.region[data-party="intent"]')).toHaveCSS('border-top-width', '4px');
  // A handoff line and its label carry the producer's colour; signals stay neutral.
  await tick(page, stepIndex('P6')).click();
  const sd = '[data-route="intent>observability:sloDefinition"]';
  const handoff = page.locator(`path.route${sd}`);
  await expect(handoff).toHaveCSS('stroke', 'rgb(255, 109, 46)');
  await expect(handoff).toHaveCSS('stroke-width', '2.5px');
  await expect(page.locator(`.label${sd} .swatch`)).toHaveCSS(
    'background-color',
    'rgb(255, 109, 46)',
  );
  await expect(page.locator('path.route.signal').first()).toHaveCSS('stroke', 'rgb(154, 165, 180)');
});
```

P5's only new artifact is Intent's desired state v1. P6 holds the Intent → Observability SLO-definition handoff and Orchestrator's onboard signal (`npm run beats`).

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test -g "colour shows who made it"`
Expected: FAIL on the band background (today it is `--card`).

- [ ] **Step 3: Regions**

In `src/app.css`, replace the `/* Regions … */` block, from `.region {` through `.swatch {…}` but keeping `.region-name`, `.selected`, `.selected:focus-visible` and their comments, so that the following rules apply:

```css
/* Regions stay neutral (direction C): provenance is the 4px top edge and the swatch only. */
.region {
  position: absolute;
  box-sizing: border-box;
  background: var(--panel);
  border: 1px solid var(--border);
  border-top: 4px solid var(--accent);
  border-radius: 6px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.3;
}
/* Activity: a lifted neutral panel and a brighter border; the provenance edge stays. */
.region.active {
  background: var(--panel-active);
  border-color: var(--border-new);
  border-top-color: var(--accent);
}
.region h2 {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 4px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
}
.region h2 .role {
  font-size: 14.5px;
  font-weight: 500;
}
.role {
  color: var(--muted);
}
/* The work this beat: a neutral pill beside the name (not a status light). */
.work {
  padding: 0 8px;
  border: 1px solid var(--border-new);
  border-radius: 999px;
  background: var(--card);
  font-size: 14.5px;
  font-weight: 500;
  line-height: 20px;
}
.swatch {
  display: inline-block;
  flex: none;
  width: 11px;
  height: 11px;
  margin-right: 8px;
  background: var(--accent);
  border-radius: 2px;
}
```

Also delete the old `.work { font-style: italic; }` rule. If `white-space: nowrap` makes a header overflow its region, leave it for Task 4, which fits text to space.

In `src/ui/Stage.svelte`, change the work span to:

```svelte
    {#if work(p)}<span class="work">{work(p)}</span>{:else}<span class="role"
        >· {RESPONSIBILITIES[p].role}</span
      >{/if}
```

In `src/ui/Lines.svelte`, change the comment `labelled by the region's work label (● …)` to `labelled by the region's work pill`.

In `src/layout.ts`, `inside` must now allow for the 4px edge:

```ts
/** Children of a region sit inside its border: 1px at the left, 4px (the provenance edge) at the top. */
const inside = (base: Rect, r: Rect): Rect => abs({ ...base, x: base.x + 1, y: base.y + 4 }, r);
```

- [ ] **Step 4: Cards**

In `src/ui/Card.svelte`, add `data-producer={k.producer}` next to `data-version={v.id}`, and replace the `<span class="head">…</span>` block with:

```svelte
  <!-- The header is the producer's band when the card is new; status never sits on a provenance colour (plan 5 D6). -->
  <span class="head">
    <span class="by">by {RESPONSIBILITIES[k.producer].name}</span>
    <span class="type">{k.name} · {v.label}</span>
  </span>
  {#if v.status || marker(v.id)}
    <span class="status">
      {#if v.status}<span class="chip {v.status.toLowerCase()}">{statusText(v.status)}</span>{/if}
      {#if marker(v.id)}<span class="marker">{MARKER_TEXT[marker(v.id)!]}</span>{/if}
    </span>
  {/if}
```

In `src/app.css`, replace the card rules from `/* Cards look like documents; provenance is the left bar. */` down to just before `.card:not(.new):not(.touched) .chip {` with:

```css
/* Cards are documents. Earlier beats fade back: no fill, a faint border, a dimmed edge and the dimmest AA text. */
.card {
  position: absolute;
  box-sizing: border-box;
  padding: 0 8px 4px 10px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--card-earlier);
  border: 1px solid var(--border-faint);
  border-left: 3px solid color-mix(in srgb, var(--accent) 40%, var(--card-earlier));
  color: var(--faded);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  --band: var(--accent);
  --on-band: var(--on-band-dark);
}
.card[data-producer='executor'] {
  --band: var(--executor-band);
  --on-band: var(--on-band-light);
}
.card[data-producer='network'] {
  --on-band: var(--on-band-light);
}
```

Below the two `.card:not(.new):not(.touched) …chip` rules, replace the `.card.touched, .card.new` rule with:

```css
/* Used this beat: a neutral document with a full-strength 4px edge, and no band. */
.card.touched {
  background: var(--card);
  color: var(--text);
  border-color: var(--border-new);
  border-left: 4px solid var(--accent);
}
/* Made this beat: the producer's band, a 12% tint and a 60% border. */
.card.new {
  background: color-mix(in srgb, var(--accent) 12%, var(--card));
  color: var(--text);
  border: 1px solid color-mix(in srgb, var(--accent) 60%, var(--border));
}
.card.new .head {
  background: var(--band);
  color: var(--on-band);
}
```

Replace the `.head`, `.type`, `.by`, `.body`, `.line` and `.marker` rules with:

```css
/* The header bleeds to the card's edges so a new card's band spans it. */
.head {
  display: block;
  margin: 0 -8px 4px -10px;
  padding: 3px 8px 3px 10px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
  text-transform: uppercase;
}
.by {
  float: right;
  margin-left: 8px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  white-space: nowrap;
}
.status {
  display: block;
  margin-bottom: 3px;
}
.body {
  display: block;
}
.line {
  display: block;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.marker {
  margin-right: 6px;
  font-size: 12.5px;
  font-weight: 700;
}
```

Leave the narrow-card `@container` rule as it is for now; Task 4 tunes it. In `.wf-steps`, set `font-size: 13.5px; font-weight: 500;`. In `.waiting`, set `font-size: 13.5px;` and remove `font-style: italic`.

The hover rules (`.card:hover` and the rest) stay unchanged. In the chip rule, set `font-size: 12.5px; line-height: 17px;`.

- [ ] **Step 5: Surfaces**

In `.surface-name`, set `font-size: 14.5px; font-weight: 700;`. In `.surface-name .role` (add the rule), set `font-weight: 500;`. In `.mini`, set `font-size: 12.5px; font-weight: 700; letter-spacing: 0.05em;`. Then add:

```css
/* A Presentation request made this beat stands forward with its full-strength edge. */
.mini.own.new {
  color: var(--text);
  background: color-mix(in srgb, var(--presentation) 12%, var(--card));
}
```

This replaces the existing `.mini.own.new` rule.

- [ ] **Step 6: Lines and labels**

In `src/ui/Lines.svelte`:
- Give each drawn path `style:--accent={r.kind === 'handoff' ? `var(--${r.ends[0]})` : null}`.
- Change the arrow marker path's `fill="var(--line)"` to `fill="context-stroke"`, so each arrowhead takes its line's colour.
- Give the label button the same `style:--accent=…` attribute, and put the swatch before its text:

```svelte
      style:top="{r.at[1]}px"
      >{#if r.kind === 'handoff'}<span class="swatch" aria-hidden="true"></span>{/if}{r.label}</button
    >
```

`r.ends[0]` is the sender. Content goes producer → consumer directly (CLAUDE.md), so for a handoff the sender is the producer.

In `src/app.css`, add this after `.route.work`:

```css
/* Content lines carry their producer's colour; signals and work stay neutral (spec §2.2). */
.route.handoff {
  stroke: var(--accent);
  stroke-width: 2.5;
}
```

Then update `.label`:

```css
.label {
  position: absolute;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}
.label.handoff {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
}
.label .swatch {
  margin-right: 6px;
}
```

The existing `.label:hover` rule stays. Hover brightens to `--border-new` for both kinds; that is the neutral hover from plan 4. In `.label.lane`, keep `display` block-level by adding `display: block;`, and set `font-size: 12px;` (D5: Task 4 raises it where the lane allows).

- [ ] **Step 7: About goes neutral**

In `.about`, change `border-top: 3px solid var(--orchestrator);` to `border-top: 3px solid var(--border-new);`. In `.about blockquote`, change `border-left: 3px solid var(--orchestrator);` to `border-left: 3px solid var(--border-new);`.

- [ ] **Step 8: Run the tests**

Run: `npx playwright test -g "colour shows who made it"`. Expected: PASS.

Run: `npm run format:check && npm run check && npm test && npm run build && npx playwright test --grep-invert "nothing overflows"`. Expected: all green.

Run `npx playwright test -g "nothing overflows"`, and paste its first failure lines into the report for Task 4. It is expected to fail (D8).

If a test outside the layout test fails because of a selector or text change made by design, update it and list it in the report. An example is a test that reads the `.head` text expecting the chip inside it.

- [ ] **Step 9: Commit**

```bash
git add src/app.css src/ui/Stage.svelte src/ui/Card.svelte src/ui/Lines.svelte src/layout.ts tests/e2e/skeleton.spec.ts
git commit -m "Plan 5: canvas in direction C: producer bands and tints, neutral regions, coloured handoffs"
```

---

### Task 3: Header, caption bar, legend, opening and ending

**Model:** sonnet

**Files:**
- Modify: `src/scenario/scenario.ts` (`ENDING`)
- Modify: `src/ui/Header.svelte` (`done` ticks)
- Modify: `src/ui/CaptionBar.svelte` (legend, Start over, ending, primary Next)
- Modify: `src/ui/Stage.svelte` (opening intros)
- Modify: `src/App.svelte` (`onRestart`)
- Modify: `src/app.css` (header, ticks, caption, legend, nav, intros)
- Test: `tests/e2e/skeleton.spec.ts`, `tests/e2e/inspector.spec.ts`

**Interfaces:**
- Consumes `RESPONSIBILITIES[p].does[0]` and `.doesNot[0]`.
- Produces:
  - `ENDING: string` from `scenario.ts`;
  - the CaptionBar prop `onRestart: () => void`;
  - `.caption .legend`, `.caption .ending`, `.caption .scope`, `.intro`, `.tick.done`, `.nav .primary`.

- [ ] **Step 1: Write the failing tests**

In `tests/e2e/skeleton.spec.ts`, replace the test `'Next on the last beat and Back on the first keep focus and stay put'` with:

```ts
test('Back on the first beat stays put; on the last beat Next becomes Start over', async ({
  page,
}) => {
  const back = page.getByRole('button', { name: '◄ Back' });
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText('1 / 38');
  await expect(back).toBeFocused();

  await page.getByRole('button', { name: 'Go to R14: Path health' }).click();
  await page.getByRole('button', { name: 'Next ►' }).click();
  // Pressed while R15 is still animating, by keyboard (Review Focus 3).
  const restart = page.getByRole('button', { name: 'Start over' });
  await restart.focus();
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText('1 / 38');
  const next = page.getByRole('button', { name: 'Next ►' });
  await expect(next).toBeFocused();
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});

test('the last beat completes the story: every tick done, a completion line', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to R15: Closing' }).click();
  await expect(page.locator('.caption .ending')).toHaveText(ENDING);
  await expect(page.locator('.tick:not([aria-current])')).toHaveCount(STEPS.length - 1);
  await expect(page.locator('.tick.done')).toHaveCount(STEPS.length - 1);
});

test('responsibilities introduce themselves until their first card appears', async ({ page }) => {
  const intro = (p: string) => page.locator(`.region[data-party="${p}"] .intro`);
  await expect(intro('intent')).toContainText(RESPONSIBILITIES.intent.does[0]!);
  await expect(intro('intent')).toContainText(RESPONSIBILITIES.intent.doesNot[0]!);
  await expect(page.locator('.intro')).toHaveCount(5);
  await page.getByRole('button', { name: 'Simple' }).click();
  const simple = await intro('observability').textContent();
  await page.getByRole('button', { name: 'Technical' }).click();
  expect(await intro('observability').textContent()).toBe(simple);
  // Intent's first card appears in P3; the intro is gone at time 0 of that beat (Review Focus 4).
  await tick(page, stepIndex('P3') - 1).click();
  await page.getByRole('button', { name: 'Next ►' }).click();
  await expect(intro('intent')).toHaveCount(0);
  await expect(intro('observability')).toHaveCount(1);
});
```

Adjust the imports at the top of the file to:

```ts
import { ENDING, RESPONSIBILITIES, STEPS, version } from '../../src/scenario/scenario.ts';
```

Check the R14 tick title with `npm run beats` (it is the beat before R15). Check also that P3 is where Intent's first card appears and that Observability has none before P6. Both were true at 84d692e.

In `tests/e2e/inspector.spec.ts`, extend the test `'inspectables respond to hover, and the caption hint goes after the first inspection'` by adding this after the line that asserts the hint is gone:

```ts
  // The line legend takes the hint's place.
  const legend = page.locator('.caption .legend');
  await expect(legend).toContainText('artifact handoff');
  await expect(legend).toContainText('coordination signal');
  await expect(legend).toContainText('work inside a responsibility');
```

Read the test first and place this where the hint is first asserted gone.

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test -g "Start over|completes the story|introduce themselves|caption hint"`
Expected: FAIL. `ENDING` doesn't exist, there is no Start over, no `.intro` and no `.legend`.

- [ ] **Step 3: The ending copy**

In `src/scenario/scenario.ts`, after `SCOPE_NOTE`, add:

```ts
/** The caption bar's completion line on the last beat (plan 5 D3; facts from P14, the Detect chapter and R15). */
export const ENDING =
  'Story complete: provisioned and verified, degradation detected, service restored on path B. The link still needs repair.';
```

- [ ] **Step 4: Ticks**

In `src/ui/Header.svelte`, give each tick `class:done={i < step}`. In `src/app.css`, replace the two tick rules with:

```css
/* Each tick is a short dash with a 16×20 hit area: done, current (wider, brightest) or still to come. */
.tick {
  width: 16px;
  height: 20px;
  padding: 0;
  border: 0;
  background: linear-gradient(var(--tick), var(--tick)) center / 12px 3px no-repeat;
  cursor: pointer;
}
.tick.done {
  background-image: linear-gradient(var(--line), var(--line));
}
.tick[aria-current='step'] {
  width: 24px;
  background-image: linear-gradient(var(--text), var(--text));
  background-size: 20px 4px;
}
.tick:hover {
  background-size: 12px 5px;
}
.tick[aria-current='step']:hover {
  background-size: 20px 5px;
}
```

In `.header h1`, set `font-size: 17px; font-weight: 700;`. In `.chapter-name`, add `font-size: 14.5px; font-weight: 600; cursor: pointer;`, and add `.chapter-name:hover { color: var(--text); }`. In `.view button`, add `font-weight: 600; cursor: pointer;`.

- [ ] **Step 5: The caption bar**

Replace `src/ui/CaptionBar.svelte` with:

```svelte
<script lang="ts">
  import { CHAPTERS, ENDING, SCOPE_NOTE, STEPS } from '../scenario/scenario.ts';
  import type { View } from '../scenario/types.ts';

  let {
    step,
    view,
    hint,
    onBack,
    onNext,
    onRestart,
  }: {
    step: number;
    view: View;
    hint: boolean;
    onBack: () => void;
    onNext: () => void;
    onRestart: () => void;
  } = $props();

  const s = $derived(STEPS[step]!);
  const atStart = $derived(step === 0);
  const atEnd = $derived(step === STEPS.length - 1);
</script>

<footer class="caption">
  <h2 id="caption-heading" tabindex="-1">
    {CHAPTERS[s.chapter]} · <span data-testid="counter">{step + 1} / {STEPS.length}</span> · {s.title}
  </h2>
  <p aria-live="polite">{s.caption[view]}</p>
  <!-- One slot at the top right: the hint until the first inspection, then the legend; the ending on the last beat. -->
  {#if atEnd}
    <p class="ending">{ENDING}</p>
  {:else if hint}
    <p class="hint">Click any card, line label or responsibility name to inspect it.</p>
  {:else}
    <p class="legend">
      <span
        ><svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" /></svg
        >artifact handoff</span
      >
      <span
        ><svg width="28" height="8" aria-hidden="true"
          ><line class="signal" x1="0" y1="4" x2="28" y2="4" /></svg
        >coordination signal</span
      >
      <span
        ><svg width="28" height="8" aria-hidden="true"
          ><line class="work" x1="0" y1="4" x2="28" y2="4" /></svg
        >work inside a responsibility</span
      >
    </p>
  {/if}
  {#if view === 'technical'}
    <p class="scope">{SCOPE_NOTE}</p>
  {/if}
  <!-- aria-disabled, not disabled: a disabled button drops keyboard focus to <body>. One forward button, so focus
       stays on it when it turns into Start over and back. -->
  <div class="nav">
    <button aria-disabled={atStart} onclick={() => !atStart && onBack()}>◄ Back</button>
    <button class="primary" onclick={() => (atEnd ? onRestart() : onNext())}
      >{atEnd ? 'Start over' : 'Next ►'}</button
    >
  </div>
</footer>
```

In `src/App.svelte`, pass `onRestart={() => go(0)}` to `CaptionBar`. `go()` already finishes running motion, and a jump back doesn't play.

In `src/app.css`, replace the caption-bar rules (`.caption` through `.nav button[aria-disabled='true']`) with:

```css
/* Caption bar */
.caption {
  position: absolute;
  left: 12px;
  top: 860px;
  width: 1416px;
  height: 84px;
  box-sizing: border-box;
  padding: 6px 214px 4px 14px;
  border-top: 1px solid var(--border);
  overflow: hidden;
}
.caption h2 {
  margin: 0 0 2px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--muted);
}
.caption p {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.35;
}
/* The top-right slot: hint, legend or ending, one line, never under the caption text. */
.caption :is(.hint, .legend, .ending) {
  position: absolute;
  right: 214px;
  top: 6px;
  font-size: 12.5px;
  line-height: 1.3;
  color: var(--muted);
}
.caption .ending {
  color: var(--text);
  font-weight: 600;
}
.legend {
  display: flex;
  gap: 18px;
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.legend line {
  stroke: var(--line);
  stroke-width: 2;
}
.legend line.signal {
  stroke-dasharray: 6 4;
}
.legend line.work {
  stroke-dasharray: 1.5 3;
}
/* Technical scope note: one line at the bottom right, under the buttons. */
.caption .scope {
  position: absolute;
  right: 14px;
  bottom: 6px;
  font-size: 12.5px;
  line-height: 1.3;
  color: var(--muted);
  white-space: nowrap;
}
.nav {
  position: absolute;
  right: 14px;
  top: 8px;
  display: flex;
  gap: 8px;
}
.nav button {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 5px 14px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
}
.nav button:hover {
  border-color: var(--border-new);
}
.nav button[aria-disabled='true'] {
  color: var(--muted);
  cursor: default;
}
.nav button[aria-disabled='true']:hover {
  border-color: var(--border);
}
/* Next (and Start over) is the primary action. */
.nav .primary {
  background: var(--text);
  border-color: var(--text);
  color: var(--bg);
}
.nav .primary:hover {
  background: #ffffff;
}
.nav .primary:focus-visible {
  outline-offset: 2px;
}
```

The `.primary:focus-visible` offset keeps the white focus ring visible against the light fill. The ring must still be visible: check it in the Task 4 screenshots.

- [ ] **Step 6: The opening intros**

In `src/ui/Stage.svelte`, inside the `{#each automation as p (p)}` section, after `{@render header(p)}`, add:

```svelte
    <!-- Until its first card, a region introduces itself from the inspector's data (spec §3.3); no motion. -->
    {#if !(stage.slots[p] ?? []).length}
      <div class="intro">
        <p><span class="intro-label">Does</span> {RESPONSIBILITIES[p].does[0]}</p>
        <p><span class="intro-label">Does not</span> {RESPONSIBILITIES[p].doesNot[0]}</p>
      </div>
    {/if}
```

In `src/app.css`, after the region rules, add:

```css
.intro {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 44px;
  color: var(--muted);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.35;
}
.intro p {
  margin: 0 0 6px;
}
.intro-label {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

- [ ] **Step 7: Run the tests**

Run: `npx playwright test -g "Start over|completes the story|introduce themselves|caption hint"`. Expected: PASS.

Then run `npm run format:check && npm run check && npm test && npm run build && npx playwright test --grep-invert "nothing overflows"`. Expected: all green. Any other test that used the name `'Next ►'` on the last beat, or `aria-disabled` on Next, changed by design: update it and list it.

- [ ] **Step 8: Commit**

```bash
git add src/scenario/scenario.ts src/ui/Header.svelte src/ui/CaptionBar.svelte src/ui/Stage.svelte src/App.svelte src/app.css tests/e2e/skeleton.spec.ts tests/e2e/inspector.spec.ts
git commit -m "Plan 5: ticks as controls, primary Next and Start over, legend, opening intros, ending"
```

---

### Task 4: Geometry re-tune and the owner check-in

**Model:** opus. This task calls for judgment: fitting copy to space against a test.

**Files:**
- Modify: `src/layout.ts` (`REGIONS`, `CAPTION`, `SLOTS`, `WAYPOINTS`, and `LANES` heights only)
- Modify: `src/app.css` (`.caption` top and height, sizes inside narrow cards, lane labels)
- Modify: `src/scenario/scenario.ts` (copy shortenings only where nothing else fits)
- Modify: `docs/deferred-work.md` (every shortening)
- Test: `tests/e2e/skeleton.spec.ts` (the caption vs scope note test)

**Interfaces:**
- Consumes everything from Tasks 2 and 3.
- Produces a fitted layout. `npm run verify` is fully green here, including the layout test.

- [ ] **Step 1: Write the failing caption test**

Add to `tests/e2e/skeleton.spec.ts`:

```ts
test('the caption never runs under the buttons, the scope note or the top-right slot', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.evaluate(() => document.fonts.ready);
  for (const view of ['Technical', 'Simple'] as const) {
    await page.getByRole('button', { name: view }).click();
    for (let n = 0; n < STEPS.length; n++) {
      await tick(page, n).click();
      const clash = await page.evaluate(() => {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector('.caption p[aria-live]')!);
        const lines = [...range.getClientRects()];
        const others = [
          ...document.querySelectorAll('.caption :is(.scope, .nav, .hint, .legend, .ending)'),
        ].map((e) => ({ name: e.className, r: e.getBoundingClientRect() }));
        const hit = (a: DOMRect, b: DOMRect) =>
          a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        return others.filter((o) => lines.some((l) => hit(l, o.r))).map((o) => o.name);
      });
      expect(clash, `${STEPS[n]!.id} ${view}`).toEqual([]);
    }
  }
});
```

Run: `npx playwright test -g "caption never runs|nothing overflows"`. Expected: FAIL, probably at R2 Technical. Record which beats fail.

- [ ] **Step 2: Grow the caption bar (D2)**

In `src/layout.ts`, apply the D2 band change. The two row gaps become 24px and the Network → caption hug becomes 12px; the top lane is unchanged.

```ts
export const REGIONS: Record<Party, Rect> = {
  presentation: { x: 12, y: 52, w: 1416, h: 84 },
  observability: { x: 12, y: 166, w: 488, h: 348 },
  orchestrator: { x: 572, y: 166, w: 296, h: 536 },
  intent: { x: 940, y: 166, w: 488, h: 348 },
  collector: { x: 12, y: 538, w: 488, h: 164 },
  executor: { x: 940, y: 538, w: 488, h: 164 },
  network: { x: 12, y: 726, w: 1416, h: 106 },
};

export const CAPTION: Rect = { x: 12, y: 844, w: 1416, h: 100 };
```

- Update the doc comment above `REGIONS`: the blocks are now 30px apart under Presentation and 24px elsewhere, and the caption bar hugs at 12px (plan 5 D2).
- In `WAYPOINTS['collector>intent:observedState']`, the gutter y becomes `714`, the middle of 702-726. That is `[420, 714], [LANES.right, 714]`; the last point stays.
- In `src/app.css`, `.caption` gets `top: 844px; height: 100px;`.
- Run `npx vitest run tests/unit/routes.test.ts`. It must stay green; if a route now crosses a region, fix its waypoint.

- [ ] **Step 3: Fit, beat by beat**

Loop until `npx playwright test -g "nothing overflows|caption never runs"` passes. Use the tools in this order, and stop at the first that works for each failure:

1. **Move or resize card slots** (`SLOTS`) inside their region. Cards start below the 17px header, at about y 30 instead of 22. Use the dead space in Orchestrator (its region grew to 536px tall) and the region bottoms. Keep the 12px unit where you can, and keep each slot's side and order (the comments in `SLOTS` say why each sits where it does).
2. **Narrow cards** (Collector's pipeline, under 160px): the `@container (max-width: 160px)` rule may step sizes down to card text 13.5, `.head` 11.5 and `.line` 12. It must not go lower. Record each one.
3. **Lane labels** (D5): use the largest size from 13.5 down to 12 that fits.
4. **Region headers** that overflow: the role (`· …`) may be cut with `text-overflow: ellipsis` on `.role`, since the inspector shows it in full. The name and the work pill must never be cut.
5. **Copy shortening**, the last resort. Shorten the scenario string. Keep every substring a test asserts: run `npm test` after each change, because `story.test.ts` and `catalog.test.ts` pin wording. Add each shortening to `docs/deferred-work.md` under a new heading `## Plan 6: shortened for fit (plan 5)`, as `- <id or key>: "<old>" → "<new>"`.

Do not change: the type sizes in Global Constraints (outside of rules 2 and 3), region x positions or widths, the lane widths, or the stage size. If something still can't fit after all five, stop and report it. It goes to the owner at the check-in.

- [ ] **Step 4: Verify everything**

Run: `npm run verify`. Expected: fully green, including the layout test and the new caption test.

- [ ] **Step 5: Screenshots for the check-in**

With `npm run dev` running, take 1440×900 screenshots with Playwright. Close About first. Capture P1, P5, P10, D3, R7 and R15 in Simple, and P10 and R2 in Technical. Save them to the SDD workspace directory, and list their paths in the report.

```bash
npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=1500 http://localhost:5173/ <workspace>/p1.png
```

The CLI cannot step the story, so write a small throwaway script in the workspace instead. It should: open the page; press Escape; for each beat, click its tick, call `document.getAnimations().forEach(a => a.finish())`, and run `page.screenshot({ path })`; and switch views with the Simple/Technical buttons. Do not commit it.

- [ ] **Step 6: Commit**

```bash
git add src/layout.ts src/app.css src/scenario/scenario.ts docs/deferred-work.md tests/e2e/skeleton.spec.ts
git commit -m "Plan 5: geometry re-tuned for the larger type; caption bar 100px (D2)"
```

- [ ] **Step 7: STOP for the owner's visual check-in (spec §5, step 5)**

The controller shows the owner the screenshots, the D1-D5 rulings and the shortenings list, and asks the owner to look at `npm run dev`. Type size is confirmed or changed here, and so is the completion-line copy (D3). Any change becomes a fix round of this task before Task 5 starts.

---

### Task 5: The inspector model

**Model:** sonnet

**Files:**
- Modify: `src/model/inspect.ts`
- Modify: `tests/unit/inspect.test.ts`

**Interfaces:**
- Consumes the existing `Target`, `RESPONSIBILITIES`, `KINDS`, `SIGNALS`, `stateAt` and `lineKey`.
- Produces, for Task 6:

```ts
export interface Item {
  text: string;
  /** Set when the item is a link that moves the selection. */
  target?: Target;
  /** The party whose colour marks the item's edge or swatch. */
  party?: Party;
  /** A second, quieter line: why a consumer needs the artifact. */
  note?: string;
  /** Drawn as the canvas's own status chip. */
  status?: Status;
}
/** How a section is drawn (design uplift §4.2). */
export type Look = 'text' | 'list' | 'blocks' | 'cards' | 'code' | 'highlight';
export interface Section {
  heading: string;
  items: Item[];
  look: Look;
}
export interface Inspection {
  kind: 'Artifact' | 'Responsibility' | 'Signal' | 'Handoff' | 'Surface';
  title: string;
  note?: string;
  /** The identity colour of the header (§4.1). */
  party: Party;
  /** Signals: the header edge is dashed, like the line. */
  dashed?: boolean;
  /** The kind line's "by <party>" for an artifact, or "in Presentation" for a surface. */
  by?: Party;
  /** Lines: sender → receiver, drawn as a strip; `surface` names the receiving Presentation surface. */
  strip?: { from: Party; to: Party; surface?: Surface };
  sections: Section[];
}
```

`mono?: boolean` on `Section` is removed. `look: 'code'` replaces it.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/inspect.test.ts`, make these changes:

1. In `'names producer and every consumer…'`, replace the `Produced by` and `Used by` expectations with:

```ts
        expect(i.party, id).toBe(k.producer);
        expect(i.by, id).toBe(k.producer);
        const handed = section(i, 'Handed to');
        for (const c of k.consumers) {
          const item = handed.find((x) => x.party === c);
          expect(item?.text, `${id} handed to ${c}`).toContain(RESPONSIBILITIES[c].name);
          expect(item?.target, `${id} ${c} link`).toEqual({ t: 'responsibility', party: c });
          expect(item?.note, `${id} ${c} uses`).toBe(k.uses?.[c]);
        }
```

Change the three `texts(…, 'Used by')` checks to `texts(…, 'Handed to')`.

2. Change `'shows the marker the version has at that beat'` to:

```ts
  it('shows the status as a chip and the marker as text', () => {
    const ds = inspect({ t: 'artifact', version: 'ds1' }, at('P10'), 'simple');
    expect(texts(ds, 'Status')).toEqual(['= IN SYNC']);
    const ss = inspect({ t: 'artifact', version: 'ss1' }, at('P15'), 'simple');
    expect(section(ss, 'Status')[0]?.status).toBe(version('ss1').status);
  });
```

3. Add to `describe('inspect: artifacts …')`:

```ts
  it('draws each section in its look, and the payload as code', () => {
    const i = inspect({ t: 'artifact', version: 'ds1' }, at('P5'), 'technical');
    const look = Object.fromEntries(i.sections.map((s) => [s.heading, s.look]));
    expect(look).toMatchObject({
      'What it is': 'text',
      Meaning: 'text',
      'Handed to': 'blocks',
      'Payload (illustrative)': 'code',
    });
    for (const l of section(i, 'Lineage')) expect(l.party).toBe(producerOf(l.target!.version));
  });
```

The `l.target!.version` access needs a narrowing cast: `(l.target as { version: string }).version`.

4. Add a new `describe` for the identity colour and the party links:

```ts
describe('inspect: identity colour and party links (design uplift §4.1, §4.3)', () => {
  it('colours each view by its identity, dashed for signals', () => {
    const n = at('P10');
    expect(inspect({ t: 'responsibility', party: 'collector' }, n, 'simple').party).toBe('collector');
    expect(inspect({ t: 'surface', surface: 'portal' }, n, 'simple').party).toBe('presentation');
    STEPS.forEach((step, k) => {
      for (const e of step.events) {
        if (e.t !== 'signal' && e.t !== 'handoff') continue;
        const i = inspect({ t: 'line', step: k, key: lineKey(e) }, k, 'simple');
        expect(i.strip).toMatchObject({ from: e.from, to: e.to });
        if (e.t === 'signal') {
          expect(i.party).toBe('orchestrator');
          expect(i.dashed).toBe(true);
        } else {
          expect(i.party).toBe(producerOf(e.version));
          expect(i.dashed).toBeFalsy();
        }
      }
    });
  });

  it('every party item links to that responsibility', () => {
    STEPS.forEach((_, n) => {
      for (const id of stateAt(n).visible) {
        const i = inspect({ t: 'artifact', version: id }, n, 'simple');
        for (const it of section(i, 'Handed to').filter((x) => x.party))
          expect(it.target).toEqual({ t: 'responsibility', party: it.party });
      }
    });
  });
});
```

5. In `'a request signal names what answers it…'`, nothing changes. `From` and `To` are no longer sections. The test doesn't read them, so check that no other test does.

6. In `inspect: surfaces`, the `texts(i, 'From')` check stays. `From` is still a section for surfaces, now a `list` whose item links to its party.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/unit/inspect.test.ts`
Expected: FAIL. `party`, `by`, `Handed to`, `look`, `strip` and `status` don't exist yet.

- [ ] **Step 3: Implement**

In `src/model/inspect.ts`:
- Replace the `Item`, `Section` and `Inspection` interfaces with the ones under **Interfaces** above.
- Import `Status` from `../scenario/types.ts`.
- Replace the helpers `text`, `link` and `sec` with:

```ts
const text = (t: string): Item => ({ text: t });
const link = (id: string): Item => ({
  text: artifactName(id),
  target: { t: 'artifact', version: id },
  party: producerOf(id),
});
/** A responsibility named in the panel opens its own view (design uplift §4.3). */
const party = (p: Party, label = RESPONSIBILITIES[p].name, note?: string): Item => ({
  text: label,
  target: { t: 'responsibility', party: p },
  party: p,
  ...(note ? { note } : {}),
});
const sec = (heading: string, items: Item[], look: Look = 'list'): Section[] =>
  items.length ? [{ heading, items, look }] : [];
```

Replace the `artifact` case's `return` with:

```ts
      return {
        kind: 'Artifact',
        title: artifactName(v.id),
        party: k.producer,
        by: k.producer,
        note: state.visible.includes(v.id)
          ? undefined
          : `Appears in ${stepId((e) => e.t === 'appear' && e.version === v.id)}`,
        sections: [
          ...sec('What it is', [text(k.whatItIs)], 'text'),
          ...sec('Meaning', [text(v.meaning)], 'text'),
          ...sec(
            'Handed to',
            k.consumers.length
              ? k.consumers.map((c) =>
                  party(
                    c,
                    c === 'presentation'
                      ? `${RESPONSIBILITIES.presentation.name} (${surfacesFor(k.id).join(', ')})`
                      : RESPONSIBILITIES[c].name,
                    k.uses?.[c],
                  ),
                )
              : [text(`Kept by ${RESPONSIBILITIES[k.producer].name} for its own work.`)],
            'blocks',
          ),
          ...sec(
            'Status',
            [
              ...(v.status ? [{ text: statusText(v.status), status: v.status }] : []),
              ...(marker ? [text(MARKER_TEXT[marker])] : []),
            ],
            'text',
          ),
          ...sec('Lineage', v.lineage.map(link), 'cards'),
          ...sec(
            'Other versions',
            VERSIONS.filter(
              (o) => o.kind === v.kind && o.id !== v.id && state.visible.includes(o.id),
            ).map((o) => link(o.id)),
            'cards',
          ),
          ...(view === 'technical'
            ? sec('Payload (illustrative)', v.technical.map(text), 'code')
            : []),
        ],
      };
```

Delete the now-unused `usedBy` const and the `name()` helper's artifact use; keep `name` if the line case still uses it.

The `responsibility` case returns `party: p` and these sections:

```ts
        sections: [
          ...sec('Role', [text(r.role)], 'text'),
          ...sec('Does', r.does.map(text)),
          ...sec('Does not', r.doesNot.map(text)),
          ...sec('In this step', now.length ? now : [text('Nothing in this beat.')], 'highlight'),
          ...sec(
            'Produced so far',
            state.visible.filter((id) => producerOf(id) === p).map(link),
            'cards',
          ),
        ],
```

The signal branch of the `line` case returns `party: 'orchestrator'`, `dashed: true` and `strip: { from: e.from, to: e.to }`. The strip replaces From and To. Its sections:

```ts
          sections: [
            ...sec('Asks', [text(info.asks)], 'text'),
            ...sec('About', e.version ? [link(e.version)] : [], 'cards'),
            ...sec(
              'Answered by',
              [
                text(
                  a
                    ? a in SIGNALS
                      ? SIGNALS[a as SignalId].label
                      : kind(a as KindId).name
                    : 'Nothing: it answers an earlier request.',
                ),
              ],
              'text',
            ),
          ],
```

The handoff branch returns `party: producerOf(e.version)` and `strip: { from: e.from, to: e.to, surface: e.surface }`. The strip replaces the old From and To sections, and the Inspector names the surface from `surface` (Task 6). Its sections:

```ts
        sections: [
          ...sec('Artifact', [link(e.version)], 'cards'),
          ...sec('Why the receiver needs it', [text(kind(version(e.version).kind).uses![e.to]!)], 'text'),
        ],
```

The `surface` case returns `party: 'presentation'` and `by: 'presentation'`, with these sections:

```ts
        sections: [
          ...sec('Role', [text(SURFACE_ROLES[s])], 'text'),
          ...sec('Showing', [shown ? link(shown) : text('Nothing received yet.')], shown ? 'cards' : 'text'),
          ...sec('From', shown ? [party(producerOf(shown))] : []),
          ...sec(
            'Its own requests',
            state.visible.filter((id) => kind(version(id).kind).producerSurface === s).map(link),
            'cards',
          ),
        ],
```

- [ ] **Step 4: Run them to see them pass**

Run: `npx vitest run tests/unit/inspect.test.ts`. Expected: PASS.

Run: `npm run check`. `Inspector.svelte` still reads `s.mono`. Change it to `s.look === 'code'` so the check passes; Task 6 rewrites the component anyway.

Run: `npm test && npx playwright test tests/e2e/inspector.spec.ts`. The e2e test `'a card opens the inspector opposite it…'` asserts `'Produced by'`. That text changed by design (D7): change it to `'Handed to'` and list it.

- [ ] **Step 5: Commit**

```bash
git add src/model/inspect.ts src/ui/Inspector.svelte tests/unit/inspect.test.ts tests/e2e/inspector.spec.ts
git commit -m "Plan 5: inspector model: identity colour, party links, status chip, section looks"
```

---

### Task 6: The inspector, restyled

**Model:** sonnet

**Files:**
- Modify: `src/ui/Inspector.svelte`
- Modify: `src/app.css` (the inspector block)
- Test: `tests/e2e/inspector.spec.ts`

**Interfaces:**
- Consumes `Inspection`, `Section`, `Item` and `Look` from Task 5, and `statusText` from `describe.ts`.
- Produces:
  - `.inspector-head`, with `--accent` set to the identity colour;
  - `.inspector-head.dashed`;
  - `.inspector-kind .inspector-link`, the party link;
  - `.strip`;
  - the section classes `.look-<look>`.

- [ ] **Step 1: Write the failing tests**

Add to `tests/e2e/inspector.spec.ts`:

```ts
test('the header carries the identity colour; a signal’s edge is dashed', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').click();
  const head = page.locator('.inspector-head');
  await expect(head).toHaveCSS('border-top-color', 'rgb(255, 109, 46)');
  await expect(head).toHaveCSS('border-top-width', '6px');
  await expect(head).toHaveCSS('border-top-style', 'solid');
  await expect(page.getByRole('button', { name: 'Close inspector' })).toHaveCSS('width', /^(3[2-9]|[4-9]\d)px$/);
  await page.locator('.label', { hasText: 'check drift' }).click();
  await expect(head).toHaveCSS('border-top-color', 'rgb(0, 212, 255)');
  await expect(head).toHaveCSS('border-top-style', 'dashed');
});

test('a party link opens that responsibility, and the panel follows the ring', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').click();
  await expect(panel(page)).toHaveClass(/\bleft\b/);
  // Executor is under Handed to; its region is on the right, so the panel stays left.
  await page.locator('.inspector-link', { hasText: 'Executor' }).first().click();
  await expect(heading(page)).toHaveText('Executor');
  await expect(heading(page)).toBeFocused();
  await expect(page.locator('[data-party="executor"]')).toHaveClass(/\bselected\b/);
  // Observability is behind the left panel (Review Focus 5): following it moves the panel right, focus kept.
  await card(page, 'slodef').click();
  await expect(panel(page)).toHaveClass(/\bleft\b/);
  await page.locator('.look-blocks .inspector-link', { hasText: 'Observability' }).click();
  await expect(heading(page)).toHaveText('Observability');
  await expect(heading(page)).toBeFocused();
  await expect(panel(page)).toHaveClass(/\bright\b/);
});

test('the panel is as tall as its content', async ({ page }) => {
  await tick(page, at('P10')).click();
  await page.locator('.surface[data-surface="api"]').click();
  const h = (await panel(page).boundingBox())!.height;
  expect(h).toBeLessThan(400);
});
```

`slodef` is Intent's SLO definition v1 (visible from P6). Its Handed to names Observability, whose region sits behind a left-hand panel.

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test tests/e2e/inspector.spec.ts -g "identity colour|party link|as tall"`
Expected: FAIL. There is no `.inspector-head`, the party names are not links, and the height is fixed at 708px.

- [ ] **Step 3: The component**

Replace `src/ui/Inspector.svelte` with:

```svelte
<script lang="ts">
  import { RESPONSIBILITIES, SURFACES } from '../scenario/scenario.ts';
  import type { Party, View } from '../scenario/types.ts';
  import { inspect, type Item, type Target } from '../model/inspect.ts';

  let {
    target,
    step,
    view,
    side,
    onSelect,
    onClose,
  }: {
    target: Target;
    step: number;
    view: View;
    side: 'left' | 'right';
    onSelect: (t: Target) => void;
    onClose: () => void;
  } = $props();

  const info = $derived(inspect(target, step, view));
  const accent = (p?: Party) => (p ? `var(--${p})` : null);
  const strip = $derived(info.strip);
</script>

{#snippet partyLink(p: Party, label = RESPONSIBILITIES[p].name)}
  <button class="inspector-link" onclick={() => onSelect({ t: 'responsibility', party: p })}
    ><span class="swatch" style:--accent={accent(p)}></span>{label}</button
  >
{/snippet}

{#snippet item(it: Item)}
  {#if it.status}
    <span class="chip {it.status.toLowerCase()}">{it.text}</span>
  {:else if it.target}
    <button class="inspector-link" onclick={() => onSelect(it.target!)}>{it.text}</button>
  {:else}
    {it.text}
  {/if}
  {#if it.note}<span class="inspector-uses">{it.note}</span>{/if}
{/snippet}

<!-- Non-modal (spec §7): the story keeps stepping while it is open, and it follows the beat. -->
<aside class="inspector {side}" aria-labelledby="inspector-title">
  <div class="inspector-head" class:dashed={info.dashed} style:--accent={accent(info.party)}>
    <button class="inspector-close" aria-label="Close inspector" onclick={onClose}>✕</button>
    <p class="inspector-kind">
      <span class="swatch"></span>{info.kind}{#if info.by}
        · {info.kind === 'Surface' ? 'in' : 'by'} {@render partyLink(info.by)}{/if}
    </p>
    <h2 id="inspector-title" tabindex="-1">{info.title}</h2>
    {#if info.note}<p class="inspector-note">{info.note}</p>{/if}
  </div>
  <div class="inspector-body">
    {#if strip}
      <p class="strip" class:dashed={info.dashed} style:--accent={accent(info.party)}>
        {@render partyLink(strip.from)}
        <span class="strip-line" aria-hidden="true"></span>
        <span class="sr-only">to</span>
        {@render partyLink(
          strip.to,
          strip.to === 'presentation' && strip.surface
            ? `${RESPONSIBILITIES.presentation.name} (${SURFACES[strip.surface]})`
            : RESPONSIBILITIES[strip.to].name,
        )}
      </p>
    {/if}
    {#each info.sections as s (s.heading)}
      <section class="look-{s.look}" style:--code={s.look === 'code' ? accent(info.party) : null}>
        <h3>{s.heading}</h3>
        {#if s.look === 'text'}
          {#each s.items as it, i (i)}<p>{@render item(it)}</p>{/each}
        {:else}
          <ul>
            {#each s.items as it, i (i)}
              <li style:--accent={accent(it.party)}>{@render item(it)}</li>
            {/each}
          </ul>
        {/if}
      </section>
    {/each}
  </div>
</aside>
```

In a `blocks` section, a party item renders as a link with its consumer-colour edge, and the `uses` note sits below it. The kind line's "by" link and the strip's links all go through `onSelect` with a responsibility target, so `select()` in `App.svelte` handles the ring, the side and the focus, exactly as for a canvas click.

- [ ] **Step 4: The styles**

In `src/app.css`, replace the inspector block (from `/* Inspector (spec §3, §7) … */` to the end of the file) with:

```css
/* Inspector (spec §3, §7; design uplift §4): 400px over the responsibilities zone, opposite the selection,
   as tall as its content up to 708px. The header carries the identity colour; the body uses the canvas's language. */
.inspector {
  position: absolute;
  top: 52px;
  width: 400px;
  max-height: 708px;
  box-sizing: border-box;
  z-index: 10;
  overflow-y: auto;
  background: var(--panel);
  border: 1px solid var(--border-new);
  border-radius: 6px;
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
}
.inspector.left {
  left: 12px;
}
.inspector.right {
  left: 1028px;
}
.inspector-head {
  position: relative;
  padding: 10px 16px 12px;
  background: color-mix(in srgb, var(--accent) 14%, var(--panel));
  border-top: 6px solid var(--accent);
  border-radius: 5px 5px 0 0;
}
.inspector-head.dashed {
  border-top-style: dashed;
}
.inspector-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  color: var(--muted);
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
}
.inspector-close:hover {
  color: var(--text);
  border-color: var(--border-new);
}
.inspector-close:active {
  background: var(--card-hover);
}
.inspector-kind {
  margin: 0 40px 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.inspector-kind .inspector-link {
  text-transform: none;
  letter-spacing: 0;
}
.inspector h2 {
  margin: 4px 40px 0 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
}
.inspector-note {
  margin: 4px 0 0;
  color: var(--muted);
}
.inspector-body {
  padding: 4px 16px 14px;
}
.inspector h3 {
  margin: 12px 0 4px;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.inspector p {
  margin: 0;
}
.inspector ul {
  margin: 0;
  padding-left: 18px;
}
/* Handed to: one block per consumer, edged in the consumer's colour, with why it needs the artifact. */
.inspector :is(.look-blocks, .look-cards, .look-highlight, .look-code) ul {
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}
.look-blocks li {
  padding: 6px 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent, var(--border-new));
  border-radius: 4px;
}
.inspector-uses {
  display: block;
  margin-top: 2px;
  color: var(--muted);
}
/* Lineage, other versions, produced so far: small documents edged in their producer's colour. */
.look-cards li {
  padding: 4px 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent, var(--border-new));
  border-radius: 4px;
}
.look-highlight ul {
  padding: 8px 10px;
  background: var(--card);
  border: 1px solid var(--border-new);
  border-radius: 4px;
}
.look-code ul {
  padding: 8px 10px;
  background: var(--bg);
  /* The payload's producer edge; the component sets --code on this section. */
  border-left: 3px solid var(--code);
  border-radius: 4px;
  font-family: 'Source Code Pro', ui-monospace, monospace;
  font-size: 13.5px;
  overflow-wrap: anywhere;
}
/* Who handed what to whom, drawn like the line itself. */
.strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 2px;
}
.strip-line {
  flex: 1;
  height: 0;
  border-top: 2.5px solid var(--accent);
  position: relative;
}
.strip.dashed .strip-line {
  border-top: 2px dashed var(--line);
}
.strip-line::after {
  content: '';
  position: absolute;
  right: -1px;
  top: -6px;
  border: 5px solid transparent;
  border-left: 7px solid var(--accent);
}
.strip.dashed .strip-line::after {
  border-left-color: var(--line);
}
.inspector-link {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  text-decoration: underline;
  text-decoration-color: var(--border-new);
  text-underline-offset: 3px;
}
.inspector-link:hover {
  text-decoration-color: currentColor;
}
.inspector-link:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
.inspector-link .swatch {
  width: 10px;
  height: 10px;
  margin-right: 6px;
}
```

- [ ] **Step 5: Run the tests**

Run: `npx playwright test tests/e2e/inspector.spec.ts`. Expected: all pass, including the existing focus, side, stepping and "never covers" tests. `'the panel never covers the selected card or the caption bar'` must still pass with the auto height.

Run: `npm run verify`. Expected: fully green.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Inspector.svelte src/app.css tests/e2e/inspector.spec.ts
git commit -m "Plan 5: inspector in NAF colour: identity header, consumer blocks, strips, party links"
```

---

### Task 7: Impeccable finish and docs

**Model:** the controller runs this task. Agents: `impeccable:impeccable-finish-reviewer` and `impeccable:impeccable-documenter`.

**Files:**
- Modify: whatever the finish reviewer's material fixes touch (one batch)
- Create: `DESIGN.md`, `.impeccable/design.json` (by the documenter)
- Modify: `docs/specs/2026-10-10-naf-explorer-design.md` (rev 11 pointer and log)
- Modify: `docs/specs/2026-10-12-design-uplift.md` (status "built", with the D1-D8 rulings)
- Modify: `docs/adr/0003-visual-uplift.md` (status accepted; D1 under Consequences)
- Modify: `docs/deferred-work.md`
- Modify: `.impeccable/config.json` (drop the brainstorm-mockup ignores); add `.impeccable/critique/`

- [ ] **Step 1: Detector**

Run `"<impeccable skill dir>/scripts/impeccable" detect --json` on the changed UI files: `src/app.css` and `src/ui/*.svelte`.
- Fix any finding that isn't one of the deliberate ones, and give each finding a ruling in the ledger.
- The deliberate ones are the 3-4px provenance edges ("side-tab" and "border-accent-on-rounded"; ADR 0003), and the ✓/▲/✕ status glyphs, which are status words, not icons.

- [ ] **Step 2: Finish reviewer**

Take fresh 1440×900 screenshots with the Task 4 script: P1, P5, P10, D3, R7 and R15 in Simple, and P10 and R2 in Technical, plus an artifact, a responsibility, a signal and a surface inspector. Then dispatch `impeccable:impeccable-finish-reviewer` with:
- the screenshots;
- `docs/specs/2026-10-12-design-uplift.md`;
- ADR 0003;
- the CLAUDE.md invariants.

Apply its material fixes in one batch, then run `npm run verify`.

- [ ] **Step 3: Documenter**

Dispatch `impeccable:impeccable-documenter` to write `DESIGN.md` and `.impeccable/design.json` from the built result. It must derive them from `src/theme.ts`, `src/app.css` and the screenshots, not from the spec.

- [ ] **Step 4: Docs**

- **Main spec:**
  - §10 gets a one-line pointer: "Replaced by `docs/specs/2026-10-12-design-uplift.md` (plan 5) and ADR 0003; the D2 band numbers are in `src/layout.ts`".
  - Add a revision-log line, rev 11: plan 5 design uplift; caption bar 100px; row gaps 24px.
- **Uplift spec:** set the status to "built (plan 5)". Add an "As built" list with D1-D8, the final type size from the check-in, and the approved completion line.
- **ADR 0003:** set the status to "accepted, 2026-10-12". Under Consequences, add the Executor band shade (D1).
- **`docs/deferred-work.md`:**
  - remove the Impeccable flags that plan 5 resolved (3px edges stay deliberate; the About top edge is neutral now);
  - keep the About eyebrow as Plan 6;
  - keep the shortenings list from Task 4.
- **Mockups:** stop the brainstorm server (`scripts/stop-server.sh` in the brainstorming skill directory) and delete `.superpowers/brainstorm/71833-1791789445/`. Remove the three mockup `ignore-value` entries from `.impeccable/config.json`.

- [ ] **Step 5: Verify and commit**

Run: `npm run verify`. Expected: fully green.

```bash
git add DESIGN.md .impeccable docs src tests
git commit -m "Plan 5: Impeccable finish, DESIGN.md, spec rev 11, ADR 0003 accepted"
```

Then come the final whole-branch review (Opus) and finishing-a-development-branch.
