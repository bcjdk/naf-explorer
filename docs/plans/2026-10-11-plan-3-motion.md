# Plan 3: Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Executed subagent-driven: Sonnet implements, Opus reviews every task and the whole branch (user preference). Each task has a **Model:** line.

**Goal:** Each beat reached with Next plays in causal order (work → exchanges → artifacts → receivers → status pulses) on top of the end state that is already rendered. Back, jumps, About and reduced motion show that end state at once, and Replay plays the beat again.

**Architecture:** A pure `timeline(n)` in `src/model/timeline.ts` walks the step's events in order and turns them into motion slots `{ kind, target, event, start, duration }`. A small `src/ui/motion.ts` maps each slot to DOM elements and calls `el.animate(keyframes, { delay, duration, fill: 'backwards' })`, so animations only ever lead *into* the rendered end state and never change the DOM. `App.svelte` calls `finishAll()` before every navigation and `play()` after Next and Replay. This replaces the interim CSS line, dot and card animations from plan 2.

**Tech Stack:** Svelte 5, TypeScript (strict), Vite, Vitest, Playwright (Chromium). The Web Animations API is native; no new dependencies.

**Spec:** `docs/specs/2026-10-10-naf-explorer-design.md` §8 (motion), §9 (lines), §11 (focus), §13 (tests), §14 step 3. Task 4 makes it rev 9.

**Builds on:** `main` at 0134f75 (plans 1, 2 and the About window merged). Work on branch `plan-3-motion`.

## Global Constraints

- **The DOM always renders `stateAt(n)`, the end state.** Motion is a WAAPI overlay with `fill: 'backwards'`; no inline style or class changes, no Svelte transitions.
- **The event order within a step is the causal order, and therefore the motion order** (spec §4.1). The timeline walks events one after another; exchanges never overlap.
- **Ordering guarantee (unit-tested):** an `appear` slot starts only after every signal and handoff addressed to its producer earlier in the step has finished. A Network-produced artifact appears just before its own handoff. Pulses finish within the step's length.
- **Navigation:** every navigation first calls `finish()` on all running animations, then renders the target step. Next renders n+1 and starts its timeline; Back and jumps render the end state without animation; Replay re-runs the current timeline; rapid presses land exactly N steps later.
- **Reduced motion** (`prefers-reduced-motion: reduce`): the timeline never starts.
- **About:** opening it finishes any running animation. Story keys stay ignored while it's open.
- **Focus:** Next and Replay keep focus on themselves; focus never drops to `body`. Switching views keeps the step, a running animation and focus.
- **Cards never move across the canvas.** All durations live in one constants table (`TIMING`).
- **Calm look:** no glow, no bounce, no decorative motion. Status pulses are a small scale change, three times.
- Never weaken a test. Every new semantic test is shown failing once before it is accepted (lesson 25).

## Review Focus

1. **Rapid Next presses** (→ held down): the counter lands exactly N later, only the final beat animates, and the settled DOM equals a jump to that beat. *Pinned in Task 3 (rapid presses test).*
2. **Switching Simple/Technical mid-animation:** text swaps in place, the animation keeps running, focus stays on the switch. *Pinned in Task 3.*
3. **Opening About mid-animation:** the beat jumps to its end state under the dialog. *Pinned in Task 3.*
4. **Reduced motion in every beat:** no animation is ever created, and the DOM matches the animated end state. *Pinned in Task 2 (walks all 38 beats).*
5. **A beat that takes too long to follow:** no beat's motion runs past 8 s. *Pinned in Task 1.*

---

### Task 1: The timeline model

**Model:** sonnet

**Files:**
- Modify: `src/model/state.ts` (add `lineKey`, exhaustiveness check)
- Modify: `src/routes.ts:211` (use `lineKey`)
- Create: `src/model/timeline.ts`
- Create: `tests/unit/timeline.test.ts`
- Modify: `tests/unit/routes.test.ts` (one test)

**Interfaces:**
- Produces: `lineKey(e: Exchange): string`, `type Exchange` in `src/model/state.ts`.
- Produces: `TIMING`, `type MotionKind`, `interface MotionSlot`, `timeline(n: number, steps?: readonly Step[]): MotionSlot[]`, `stepLength(slots: MotionSlot[]): number` in `src/model/timeline.ts`.
- Slot targets: `work`/`gain` → a party id or `surface:<id>`; `line` → the route key (`lineKey`); `appear`/`mark` → a version id; `network` → `'network'`; `pulse` → a version id, `surface:<id>` or `'link'`.

- [ ] **Step 1: Branch**

```bash
git switch -c plan-3-motion
```

- [ ] **Step 2: Move the route key into the model**

In `src/model/state.ts`, add `version` to the scenario import and add below `Line`:

```ts
export type Exchange = Extract<Event, { t: 'signal' | 'handoff' }>;

/** The key of an exchange's line: shared by the routes (geometry) and the timeline (motion). */
export const lineKey = (e: Exchange): string =>
  `${e.from}>${e.to}:${e.t === 'handoff' ? version(e.version).kind : e.signal}${
    e.t === 'handoff' && e.surface ? `@${e.surface}` : ''
  }`;
```

In `src/routes.ts`, replace the two lines

```ts
    const k = e.t === 'handoff' ? version(e.version).kind : e.signal;
    const key = `${e.from}>${e.to}:${k}${e.t === 'handoff' && e.surface ? `@${e.surface}` : ''}`;
```

with

```ts
    const key = lineKey(e);
```

and import `lineKey` from `./model/state.ts`. Remove `k` only if nothing else uses it.

In `stateAt`'s switch, after `case 'signal': … break;`, add (deferred item, plan 3):

```ts
        default:
          e satisfies never;
```

Run: `npm run check && npm test`
Expected: PASS, unchanged counts.

- [ ] **Step 3: Write the failing tests**

Create `tests/unit/timeline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { STEPS, kind, version } from '../../src/scenario/scenario.ts';
import { lineKey, stateAt, type Slot, type StageState } from '../../src/model/state.ts';
import { stepLength, timeline, type MotionSlot } from '../../src/model/timeline.ts';

const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const end = (s: MotionSlot) => s.start + s.duration;
const status = (id?: string) => (id ? version(id).status : undefined);
const newest = (s: StageState, k: string) =>
  (Object.values(s.slots).flat() as Slot[]).find((x) => x.kind === k)?.versions.at(-1);

describe('timeline (spec §8)', () => {
  it('a beat without events has no motion', () => {
    expect(timeline(at('P1'))).toEqual([]);
  });

  it('draws every signal and handoff as a line, in event order, one after another', () => {
    STEPS.forEach((step, n) => {
      const lines = timeline(n).filter((s) => s.kind === 'line');
      const expected = step.events.flatMap((e, i) =>
        e.t === 'signal' || e.t === 'handoff' ? [[lineKey(e), i]] : [],
      );
      expect(
        lines.map((s) => [s.target, s.event]),
        step.id,
      ).toEqual(expected);
      lines.slice(1).forEach((s, k) => expect(s.start, step.id).toBeGreaterThanOrEqual(end(lines[k]!)));
    });
  });

  it('an artifact appears only after every exchange addressed to its producer earlier in the step', () => {
    STEPS.forEach((step, n) => {
      const slots = timeline(n);
      for (const a of slots.filter((s) => s.kind === 'appear')) {
        const producer = kind(version(a.target).kind).producer;
        for (const l of slots.filter((s) => s.kind === 'line' && s.event < a.event)) {
          const e = step.events[l.event]!;
          if ((e.t === 'signal' || e.t === 'handoff') && e.to === producer)
            expect(a.start, `${step.id} ${a.target}`).toBeGreaterThanOrEqual(end(l));
        }
      }
    });
  });

  it('nothing starts before an earlier exchange in the step has finished', () => {
    STEPS.forEach((step, n) => {
      const slots = timeline(n);
      for (const l of slots.filter((s) => s.kind === 'line'))
        for (const s of slots.filter((x) => x.event > l.event))
          expect(s.start, `${step.id} ${s.kind} ${s.target}`).toBeGreaterThanOrEqual(end(l));
    });
  });

  it('a Network artifact appears just before its own handoff', () => {
    STEPS.forEach((step, n) => {
      const slots = timeline(n);
      for (const a of slots.filter(
        (s) => s.kind === 'appear' && kind(version(s.target).kind).producer === 'network',
      )) {
        const next = step.events[a.event + 1];
        expect(next, `${step.id} ${a.target}`).toMatchObject({ t: 'handoff', version: a.target });
        const line = slots.find((s) => s.kind === 'line' && s.event === a.event + 1)!;
        expect(line.start, `${step.id} ${a.target}`).toBe(end(a));
      }
    });
  });

  it('every status chip whose value changed pulses three times, within the beat', () => {
    STEPS.forEach((step, n) => {
      const before = stateAt(n - 1);
      const now = stateAt(n);
      const expected: string[] = [];
      for (const sl of Object.values(now.slots).flat() as Slot[]) {
        const id = sl.versions.at(-1)!;
        if (status(id) && status(id) !== status(newest(before, sl.kind))) expected.push(id);
      }
      for (const [sf, id] of Object.entries(now.surfaces))
        if (status(id) && status(id) !== status(before.surfaces[sf as keyof typeof before.surfaces]))
          expected.push(`surface:${sf}`);
      if (now.linkDegraded && !before.linkDegraded) expected.push('link');
      const slots = timeline(n);
      const pulses = slots.filter((s) => s.kind === 'pulse');
      expect(pulses.map((p) => p.target).toSorted(), step.id).toEqual(expected.toSorted());
      for (const p of pulses) expect(end(p), step.id).toBeLessThanOrEqual(stepLength(slots));
    });
  });

  it('pulses the moments that matter: the fault, the degraded service, the violation', () => {
    const targets = (id: string) => timeline(at(id)).filter((s) => s.kind === 'pulse').map((s) => s.target);
    expect(targets('D1')).toEqual(['link']);
    expect(targets('D7')).toEqual(expect.arrayContaining(['ss2', 'surface:portal']));
    expect(targets('D8')).toEqual(expect.arrayContaining(['ev-viol', 'surface:faultMgmt']));
  });

  it('a receiver gains the result when the handoff line arrives', () => {
    STEPS.forEach((step, n) => {
      const slots = timeline(n);
      for (const l of slots.filter((s) => s.kind === 'line')) {
        const e = step.events[l.event]!;
        if (e.t !== 'handoff') continue;
        const to = e.surface ? `surface:${e.surface}` : e.to;
        expect(
          slots.some((s) => s.kind === 'gain' && s.target === to && s.start === end(l)),
          `${step.id} ${l.target}`,
        ).toBe(true);
      }
    });
  });

  it('each working party gets one work slot, at its first work in the beat', () => {
    STEPS.forEach((step, n) => {
      const owners = [...new Set(step.events.flatMap((e) => (e.t === 'work' ? [e.owner] : [])))];
      expect(
        timeline(n)
          .filter((s) => s.kind === 'work')
          .map((s) => s.target),
        step.id,
      ).toEqual(owners);
    });
  });

  it('no beat runs longer than 8 s, so a reader can follow it', () => {
    STEPS.forEach((step, n) =>
      expect(stepLength(timeline(n)), step.id).toBeLessThanOrEqual(8000),
    );
  });
});
```

In `tests/unit/routes.test.ts`, add `import { timeline } from '../../src/model/timeline.ts';` and this test inside the existing top-level `describe` (or at top level if there is none):

```ts
it('every drawn line has a motion slot with the same key, in order, in both views', () => {
  STEPS.forEach((step, n) => {
    for (const view of ['simple', 'technical'] as const)
      expect(
        routesOf(n, view)
          .filter((r) => r.kind !== 'work')
          .map((r) => r.key),
        `${step.id} ${view}`,
      ).toEqual(
        timeline(n)
          .filter((s) => s.kind === 'line')
          .map((s) => s.target),
      );
  });
});
```

(Import `STEPS` and `routesOf` too if the file doesn't already.)

- [ ] **Step 4: Run the tests to see them fail**

Run: `npx vitest run tests/unit/timeline.test.ts tests/unit/routes.test.ts`
Expected: FAIL, "Failed to resolve import ../../src/model/timeline.ts".

- [ ] **Step 5: Write the timeline**

Create `src/model/timeline.ts`:

```ts
import { STEPS, kind, version } from '../scenario/scenario.ts';
import type { Party, Step } from '../scenario/types.ts';
import { lineKey, stateAt } from './state.ts';

export type MotionKind = 'work' | 'line' | 'appear' | 'mark' | 'network' | 'gain' | 'pulse';

/** One piece of a beat's motion (spec §8). `event` is the index of the step event that causes it. */
export interface MotionSlot {
  kind: MotionKind;
  target: string;
  event: number;
  start: number;
  duration: number;
}

/** Every duration, in ms, in one place. A pulse runs three times within its duration. */
export const TIMING = {
  work: 500,
  line: 1200,
  appear: 500,
  mark: 500,
  network: 700,
  gain: 700,
  pulse: 1800,
} as const;

/**
 * The motion of step n. Events play one after another in their causal order, so an artifact appears only
 * after everything sent to its producer before it has arrived. Receivers gain a handoff when its line
 * arrives, and a status chip whose value changed pulses after it shows.
 */
export function timeline(n: number, steps: readonly Step[] = STEPS): MotionSlot[] {
  const step = steps[n];
  if (!step) return [];
  const before = stateAt(n - 1, steps);
  const status = (id?: string) => (id ? version(id).status : undefined);
  const out: MotionSlot[] = [];
  const add = (kind: MotionKind, target: string, event: number, start: number, duration: number) => {
    out.push({ kind, target, event, start, duration });
    return start + duration;
  };
  const working = new Set<Party>();
  let t = 0;
  step.events.forEach((e, i) => {
    switch (e.t) {
      case 'work':
        // The region lights up and its work label shows once; later work by the same party takes time only.
        if (!working.has(e.owner)) add('work', e.owner, i, t, TIMING.work);
        working.add(e.owner);
        t += TIMING.work;
        break;
      case 'signal':
      case 'handoff': {
        const arrived = add('line', lineKey(e), i, t, TIMING.line);
        if (e.t === 'handoff') {
          const to = e.surface ? `surface:${e.surface}` : e.to;
          add('gain', to, i, arrived, TIMING.gain);
          if (e.surface && status(e.version) && status(e.version) !== status(before.surfaces[e.surface]))
            add('pulse', to, i, arrived, TIMING.pulse);
        }
        t = arrived;
        break;
      }
      case 'appear': {
        const shown = add('appear', e.version, i, t, TIMING.appear);
        const v = version(e.version);
        const was = before.slots[kind(v.kind).producer]?.find((s) => s.kind === v.kind)?.versions.at(-1);
        if (v.status && v.status !== status(was)) add('pulse', e.version, i, shown, TIMING.pulse);
        t = shown;
        break;
      }
      case 'mark':
        t = add('mark', e.version, i, t, TIMING.mark);
        break;
      case 'network': {
        const shown = add('network', 'network', i, t, TIMING.network);
        if (e.link && !before.linkDegraded) add('pulse', 'link', i, shown, TIMING.pulse);
        t = shown;
        break;
      }
      default:
        e satisfies never;
    }
  });
  return out;
}

/** When the beat's last slot ends. */
export const stepLength = (slots: MotionSlot[]): number =>
  Math.max(0, ...slots.map((s) => s.start + s.duration));
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run tests/unit/timeline.test.ts tests/unit/routes.test.ts`
Expected: PASS.

If "no beat runs longer than 8 s" fails, **stop and report** the beat and its length; do not change `TIMING` or the limit.

- [ ] **Step 7: Show the ordering tests can fail (lesson 25)**

Temporarily change `t = arrived;` to `t += 0;` in `timeline.ts`. Run `npx vitest run tests/unit/timeline.test.ts`. Expected: "an artifact appears only after…", "nothing starts before…" and "draws every signal… one after another" FAIL. Restore `t = arrived;` and rerun: PASS. Note the failing test names in the task report.

- [ ] **Step 8: Full checks and commit**

Run: `npm run format && npm run check && npm test`
Expected: PASS.

```bash
git add src/model/state.ts src/model/timeline.ts src/routes.ts tests/unit/timeline.test.ts tests/unit/routes.test.ts
git commit -m "Plan 3: the motion timeline, in causal order"
```

---

### Task 2: The motion overlay, played by Next

**Model:** sonnet

**Files:**
- Create: `src/ui/motion.ts`
- Modify: `src/ui/Lines.svelte` (data attributes, drop CSS delays)
- Modify: `src/app.css` (remove the interim animations)
- Modify: `src/App.svelte` (`go`, Next)
- Create: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `timeline`, `MotionSlot`, `stepLength` from `src/model/timeline.ts`; `TOKENS` from `src/theme.ts`.
- Produces: `play(slots: MotionSlot[]): void`, `finishAll(): void`, `prefersReducedMotion(): boolean` in `src/ui/motion.ts`.
- DOM hooks it relies on (existing unless marked new): `.region[data-party]`, `#h-<party> .work`, `.surface[data-surface]`, `.card[data-version]`, `.mini[data-version]`, `.marker`, `.chip`, `[data-party="network"] .topology .acme|.degraded|.direction`, `[data-party="network"] .facts`, `.label[data-route]`; **new:** `path.route[data-route]`, `.pulse[data-route]`, `path.route.work[data-party]`.

- [ ] **Step 1: Write the failing browser tests**

Create `tests/e2e/motion.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { STEPS } from '../../src/scenario/scenario.ts';
import { stepLength, timeline } from '../../src/model/timeline.ts';

const counter = (page: Page) => page.getByTestId('counter');
const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const tick = (page: Page, n: number) =>
  page.getByRole('button', { name: `Go to ${STEPS[n]!.id}: ${STEPS[n]!.title}` });
const next = (page: Page) => page.getByRole('button', { name: 'Next ►' });
const running = (page: Page) =>
  page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
const stageHtml = (page: Page) => page.evaluate(() => document.querySelector('.stage')!.innerHTML);

test.beforeEach(async ({ page }) => {
  // About opens on every load (brief 06); tests/e2e/about.spec.ts covers it.
  await page.goto('/');
  await page.keyboard.press('Escape');
});

test('Next plays the new beat, then settles at its end state', async ({ page }) => {
  const n = at('P9');
  await tick(page, n - 1).click();
  expect(await running(page)).toBe(0);
  await next(page).click();
  await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
  expect(await running(page)).toBeGreaterThan(0);
  await expect
    .poll(() => running(page), { timeout: stepLength(timeline(n)) + 3000 })
    .toBe(0);
});

test('→ plays the beat like Next', async ({ page }) => {
  await tick(page, at('P8') - 1).click();
  await page.keyboard.press('ArrowRight');
  expect(await running(page)).toBeGreaterThan(0);
});

test('Back and jumps show the end state at once, finishing any running motion', async ({ page }) => {
  await tick(page, at('P8') - 1).click();
  await next(page).click();
  expect(await running(page)).toBeGreaterThan(0);
  await page.keyboard.press('ArrowLeft');
  expect(await running(page)).toBe(0);
  await next(page).click();
  await tick(page, at('D8')).click();
  expect(await running(page)).toBe(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every beat reached with Next shows the animated end state, with no motion', async ({ page }) => {
    const reduced: string[] = [];
    for (let n = 1; n < STEPS.length; n++) {
      await page.keyboard.press('ArrowRight');
      await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
      expect(await running(page), STEPS[n]!.id).toBe(0);
      reduced.push(await stageHtml(page));
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await tick(page, 0).click();
    for (let n = 1; n < STEPS.length; n++) {
      await page.keyboard.press('ArrowRight');
      await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
      await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
      expect(await stageHtml(page), STEPS[n]!.id).toBe(reduced[n - 1]);
    }
  });
});
```

Run: `npx playwright test tests/e2e/motion.spec.ts`
Expected: at least "Back and jumps…" FAILS: the interim CSS animations restart whenever the beat's lines remount, so motion runs after Back and jumps. Record which tests fail.

- [ ] **Step 2: Add the DOM hooks to Lines and drop the interim delays**

In `src/ui/Lines.svelte`:
- delete the `delay` helper and every `style:animation-delay={…}`;
- on the work `<path>` add `data-party={r.ends[0]}`;
- on the drawn `<path>` and on `<span class="pulse">` add `data-route={r.key}` (the label already has it).
- Update the top comment: "Lines are part of the beat's end state; `ui/motion.ts` animates them in (spec §8)."

- [ ] **Step 3: Remove the interim CSS animations**

In `src/app.css`:
- delete `animation: card-in 0.5s ease-out both;` from `.card.new` and the whole `@keyframes card-in` block;
- delete `animation: line-in 0.45s ease-out both;` from `.route` and from `.label` (delete the then-empty `.label { }` rule), and the `@keyframes line-in` block;
- in `.pulse`, replace `animation: travel 1.2s ease-in-out both;` with `opacity: 0;` (the dot is visible only while it travels), and delete the `@keyframes travel` block and the comment above it that describes the CSS animation (keep a one-line comment: "A dot that travels each line once; ui/motion.ts animates it.");
- delete the whole `@media (prefers-reduced-motion: reduce) { … }` block that names `.route`, `.label`, `.card.new` and `.pulse`.

Then `grep -n "animation\|@keyframes\|infinite" src/app.css` must print nothing (`finishAll` would throw on an infinite animation).

- [ ] **Step 4: Write the overlay**

Create `src/ui/motion.ts`:

```ts
import type { MotionSlot } from '../model/timeline.ts';
import { TOKENS } from '../theme.ts';

type Target = [Element, Keyframe[], KeyframeAnimationOptions?];

const FADE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
/** The dot holds at the sender with a blink and a ring, then travels to the receiver (spec rev 6). */
const TRAVEL: Keyframe[] = [
  { offset: 0, offsetDistance: '0%', opacity: 0, transform: 'scale(0.4)' },
  { offset: 0.06, offsetDistance: '0%', opacity: 1, transform: 'scale(2.6)', boxShadow: '0 0 0 0 rgb(230 233 238 / 0.6)' },
  { offset: 0.18, offsetDistance: '0%', transform: 'scale(1.6)', boxShadow: '0 0 0 8px rgb(230 233 238 / 0)' },
  { offset: 0.28, offsetDistance: '0%', transform: 'scale(1)' },
  { offset: 0.88, opacity: 1 },
  { offset: 1, offsetDistance: '100%', transform: 'scale(1)', opacity: 0 },
];
/** The region's idle background; the end state (active or not) is whatever the CSS renders. */
const LIGHT_UP: Keyframe[] = [{ backgroundColor: TOKENS.panel }];
/** "Gains the result": a brief inset edge, neither the activity background nor the selection ring. */
const GAIN: Keyframe[] = [{ offset: 0.35, boxShadow: `inset 0 0 0 1px ${TOKENS['border-new']}` }];
const PULSE: Keyframe[] = [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }];

const place = (t: string) =>
  t.startsWith('surface:') ? `.surface[data-surface="${t.slice(8)}"]` : `.region[data-party="${t}"]`;

function targets(s: MotionSlot): Target[] {
  const each = (sel: string, k: Keyframe[], o?: KeyframeAnimationOptions): Target[] =>
    [...document.querySelectorAll(sel)].map((el) => [el, k, o]);
  const t = s.target;
  switch (s.kind) {
    case 'work':
      return [
        ...each(place(t), LIGHT_UP),
        ...each(`#h-${t} .work, path.route.work[data-party="${t}"]`, FADE),
      ];
    case 'line':
      return [
        ...each(`path.route[data-route="${t}"], .label[data-route="${t}"]`, FADE),
        ...each(`.pulse[data-route="${t}"]`, TRAVEL, { easing: 'ease-in-out' }),
      ];
    case 'appear': {
      const card = document.querySelector(`.card[data-version="${t}"], .mini[data-version="${t}"]`);
      if (!card) return [];
      // A card with earlier versions keeps its stacked edges and fades in its new text; a first one fades in whole.
      return /\bstack-[12]\b/.test(card.className)
        ? [...card.children].map((c): Target => [c, FADE])
        : [[card, FADE]];
    }
    case 'mark':
      return each(`.card[data-version="${t}"] .marker`, FADE);
    case 'network':
      return each(
        ['.acme', '.degraded', '.direction'].map((c) => `[data-party="network"] .topology ${c}`).join(', ') +
          ', [data-party="network"] .facts',
        FADE,
      );
    case 'gain':
      return each(place(t), GAIN);
    case 'pulse': {
      const chip =
        t === 'link'
          ? '[data-party="network"] .facts .chip'
          : t.startsWith('surface:')
            ? `${place(t)} .chip`
            : `.card[data-version="${t}"] .chip`;
      return each(chip, PULSE, { iterations: 3, duration: s.duration / 3 });
    }
  }
}

/** Animates the rendered end state in, slot by slot. Elements a beat doesn't draw are skipped. */
export function play(slots: MotionSlot[]): void {
  for (const s of slots)
    for (const [el, keyframes, options] of targets(s))
      el.animate(keyframes, {
        delay: s.start,
        duration: s.duration,
        easing: 'ease-out',
        fill: 'backwards',
        ...options,
      });
}

/** Jumps every running animation to its end, which is the rendered end state. */
export const finishAll = (): void => document.getAnimations().forEach((a) => a.finish());

export const prefersReducedMotion = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
```

If `npm run check` rejects `offsetDistance` in `Keyframe`, cast that array `as Keyframe[]` with a comment; don't loosen anything else.

- [ ] **Step 5: Play on Next and →; finish on every navigation**

In `src/App.svelte`, import `{ timeline }` from `./model/timeline.ts` and `{ finishAll, play, prefersReducedMotion }` from `./ui/motion.ts`, and replace `go` with:

```ts
  /** Every navigation finishes running motion first; only a single step forward plays (spec §8). */
  async function go(n: number, animate = false) {
    finishAll();
    // A focused line label belongs to the old beat and is about to unmount: keep focus on the story.
    const onLabel = document.activeElement?.classList.contains('label');
    const target = Math.max(0, Math.min(STEPS.length - 1, n));
    const from = step;
    step = target;
    await tick();
    // Rapid presses: only the latest navigation plays, once its beat is rendered.
    if (animate && step === target && target === from + 1 && !prefersReducedMotion())
      play(timeline(target));
    if (onLabel)
      (
        document.querySelector<HTMLElement>('.label') ?? document.getElementById('caption-heading')
      )?.focus();
  }
```

Change the ArrowRight branch to `go(step + 1, true);` and the CaptionBar prop to `onNext={() => go(step + 1, true)}`.

Note `target === from + 1`: with rapid presses each press's `from` is the previous press's target, so the last one still plays.

- [ ] **Step 6: Run the browser tests**

Run: `npx playwright test tests/e2e/motion.spec.ts`
Expected: PASS.

- [ ] **Step 7: Full checks and commit**

Run: `npm run verify`
Expected: PASS. If an existing `skeleton.spec.ts` test fails because motion is still running when it reads the page, report it with the failure output; do not add waits or reduced motion to it without the reviewer's agreement.

```bash
git add src/ui/motion.ts src/ui/Lines.svelte src/app.css src/App.svelte tests/e2e/motion.spec.ts
git commit -m "Plan 3: the WAAPI motion overlay, played by Next, with reduced-motion parity"
```

---

### Task 3: Replay, About and navigation during motion

**Model:** sonnet

**Files:**
- Modify: `src/ui/Header.svelte` (Replay button, `onReplay` prop)
- Modify: `src/App.svelte` (`replay`, About finishes motion)
- Modify: `src/app.css` (Replay shares the About button's style)
- Modify: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `play`, `finishAll`, `prefersReducedMotion` from `src/ui/motion.ts`; `timeline` from `src/model/timeline.ts`.
- Produces: Header prop `onReplay: () => void`; a button with accessible name "Replay".

- [ ] **Step 1: Write the failing browser tests**

Append to `tests/e2e/motion.spec.ts`:

```ts
const replay = (page: Page) => page.getByRole('button', { name: 'Replay' });

test('Replay plays the current beat again and keeps focus', async ({ page }) => {
  await tick(page, at('P6')).click();
  expect(await running(page)).toBe(0);
  await replay(page).click();
  expect(await running(page)).toBeGreaterThan(0);
  await expect(replay(page)).toBeFocused();
  await expect(counter(page)).toHaveText(`${at('P6') + 1} / ${STEPS.length}`);
});

test('rapid presses land exactly N beats later, play only the last, and settle at its end state', async ({
  page,
}) => {
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toHaveText(`6 / ${STEPS.length}`);
  await expect.poll(() => running(page), { timeout: stepLength(timeline(5)) + 3000 }).toBe(0);
  const animated = await stageHtml(page);
  await tick(page, 4).click();
  await tick(page, 5).click();
  expect(await stageHtml(page)).toBe(animated);
});

test('Next keeps focus through rapid clicks, and focus never drops to body', async ({ page }) => {
  for (let i = 0; i < 3; i++) await next(page).click();
  await expect(next(page)).toBeFocused();
  await expect(counter(page)).toHaveText(`4 / ${STEPS.length}`);
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
});

test('switching views mid-motion keeps the beat, the motion and focus', async ({ page }) => {
  await tick(page, at('P9') - 1).click();
  await next(page).click();
  const technical = page.getByRole('button', { name: 'Technical' });
  await technical.click();
  await expect(counter(page)).toHaveText(`${at('P9') + 1} / ${STEPS.length}`);
  expect(await running(page)).toBeGreaterThan(0);
  await expect(technical).toBeFocused();
});

test('opening About finishes the running motion, and the story stays put', async ({ page }) => {
  await tick(page, at('P9') - 1).click();
  await next(page).click();
  await page.getByRole('button', { name: 'About' }).click();
  expect(await running(page)).toBe(0);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(counter(page)).toHaveText(`${at('P9') + 1} / ${STEPS.length}`);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Replay does nothing but keeps focus', async ({ page }) => {
    await tick(page, at('P6')).click();
    await replay(page).click();
    expect(await running(page)).toBe(0);
    await expect(replay(page)).toBeFocused();
  });
});
```

Run: `npx playwright test tests/e2e/motion.spec.ts`
Expected: the Replay tests and the About test FAIL (no Replay button; About doesn't finish motion). The rapid-press, focus and view tests may already pass after Task 2; note which.

- [ ] **Step 2: Add Replay to the header**

In `src/ui/Header.svelte`, add `onReplay` to the props (type `() => void`) and, after the About button:

```svelte
  <button class="replay" onclick={onReplay}>Replay</button>
```

In `src/app.css`, add `.replay` to every selector that styles `.about-open` (for example `.about-open, .replay { … }`), so the two buttons look alike. If the header no longer fits in one row at 1440 px, shorten the gap between the About and Replay buttons only; report it.

- [ ] **Step 3: Wire Replay and About in App**

In `src/App.svelte`, add:

```ts
  function replay() {
    finishAll();
    if (!prefersReducedMotion()) play(timeline(step));
  }

  function openAbout() {
    finishAll();
    about?.showModal();
  }
```

and pass `onReplay={replay}` and `onAbout={openAbout}` to `<Header>`.

- [ ] **Step 4: Run the browser tests**

Run: `npx playwright test tests/e2e/motion.spec.ts tests/e2e/about.spec.ts`
Expected: PASS.

- [ ] **Step 5: Full checks and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add src/ui/Header.svelte src/App.svelte src/app.css tests/e2e/motion.spec.ts
git commit -m "Plan 3: Replay, and About finishes running motion"
```

---

### Task 4: Tune in the browser, spec rev 9, deferred items

**Model:** opus (native, with the user: timing is judged by eye)

**Files:**
- Modify: `src/model/timeline.ts` (`TIMING` values only)
- Modify: `docs/specs/2026-10-10-naf-explorer-design.md` (§8, §12 file list, revision log)
- Modify: `docs/deferred-work.md`

- [ ] **Step 1: Watch it**

Run `npm run dev`. Step with → through P2, P6, P8, P9, D1, D7, D8, R7 and R14 at 1440×900, and Replay each once. Check:
- the order reads as cause → effect, and no artifact shows before its input arrives;
- the dot's start at the sender is easy to catch;
- the dotted work lines read clearly with only the region's work label (deferred item, plan 3);
- a chip pulse is noticeable but calm;
- the longest beats (P9, R8) don't drag.

Adjust only `TIMING` values. Rerun `npx vitest run tests/unit/timeline.test.ts` after each change; the 8 s limit stays.

- [ ] **Step 2: Spec rev 9**

In §8, after the slot list, add:

> **As built (rev 9):** events play one after another in their causal order, so a work slot (region highlight and work label) comes where the step's work event is, not always first. A party's later work in the same beat takes time but doesn't animate again. A `mark` (IN SYNC, COMPLETED) and a `network` change fade in at their place in the order. A chip pulses when its value at that place (card slot, surface or link) differs from the previous beat, including when it first appears. Slots live in `src/model/timeline.ts`; `src/ui/motion.ts` applies them. Lines are keyed by `lineKey` in `src/model/state.ts`, shared with `routes.ts`.

Add to the revision log:

> - **rev 9 (plan 3):** motion as a WAAPI overlay over the end state, from `timeline(n)`, replacing rev 3a's interim CSS line animation. Replay sits right of About. See §8 "As built".

- [ ] **Step 3: Deferred items**

In `docs/deferred-work.md`, remove the three items tagged **Plan 3** (exhaustiveness check, work-line labels, interim CSS line animation) if they are done; if the work-line labels did not read clearly in Step 1, rewrite that item with what was seen and tag it **Plan 5**.

- [ ] **Step 4: Verify and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add src/model/timeline.ts docs/specs/2026-10-10-naf-explorer-design.md docs/deferred-work.md
git commit -m "Plan 3: tuned timings, spec rev 9"
```

- [ ] **Step 5: Final review**

Dispatch the whole-branch review (Opus) against this plan and spec §8. Then hand over with superpowers:finishing-a-development-branch.
