# Plan 4: Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Executed subagent-driven: Sonnet implements, Opus reviews every task and the whole branch (user preference). Each task has a **Model:** line.

**Goal:** Click, or press Enter on, any card, Presentation surface, region title or current line label to open an inspector beside the canvas. It explains what the item is, who produced it, who uses it and why, or what a responsibility does and does not do, all derived from the scenario data.

**Architecture:** A pure `inspect(target, n, view)` in `src/model/inspect.ts` turns a selection target into headed sections of text and links, using only the scenario data and `stateAt`. The UI makes every inspectable element a native button. App keeps one `selected` target, rings the selected element with an `outline` and renders `Inspector.svelte`. That is a 400px non-modal panel on the side opposite the selection, which keeps working while the story steps.

**Tech Stack:** Svelte 5, TypeScript (strict), Vite, Vitest, Playwright (Chromium). No new dependencies.

**Spec:** `docs/specs/2026-10-10-naf-explorer-design.md` §7 (inspector), §3 (panel placement), §11 (keyboard, focus, semantics). Task 4 makes it rev 10.

**Builds on:** `main` at 49392ae (plans 1–3). Work on branch `plan-4-inspector`.

## Decisions (controller, for the user's review)

- **D1. Inspectable things are native buttons.** Cards and surfaces become `<button>` elements. Their block children become `<span>`s styled `display: block`, because a button may hold only phrasing content. Their accessible name is a full sentence, for example "Desired network state v2, by Intent, in sync, 1 earlier version". Region titles get a button around the name inside the `<h2>`. Line labels are already buttons.
- **D2. The selection ring is an `outline`:** dashed, 2px, offset 3px outside, in the text colour. Focus stays a solid white outline inside the element. The gain highlight animates `box-shadow` and the stacked earlier versions use `box-shadow`, so neither touches the ring (deferred item "Selection ring vs gain").
- **D3. Earlier versions** are inspected through the inspector's "Other versions" and "Lineage" links. When one is selected, the ring sits on its slot card, which shows the newest version, and the panel title names the earlier version (deferred item "Inspector and earlier versions").
- **D4. The panel side** is computed from the ringed element's centre: right of the stage's centre → the panel opens on the left; otherwise on the right. Orchestrator and the full-width bands sit at the centre and get the right-hand panel. This matches §3's list. If nothing is ringed (the target isn't drawn in this beat), the side stays where it was.
- **D5. Motion:** selecting finishes running motion, like About does. Focusing a line label also finishes it, so an invisible label can't be focused (deferred item "Invisible labels mid-beat").
- **D6. "Why the receiver needs it"** is new scenario data: `uses: Partial<Record<Party, string>>` on each artifact kind, one sentence per consumer. The draft copy is in Task 1. The user reviews it with the rest of the copy in plan 5.

## Global Constraints

- **NAF invariants (CLAUDE.md) hold in every inspector text.** Orchestrator never owns or carries intended state. Content goes producer → consumer directly. Executor doesn't verify. Collector doesn't judge impact. Presentation only displays.
- **Targets:** artifact cards, Presentation surfaces, region titles (responsibility view) and current-step line labels (signal or handoff view). `inspect(target, n)` produces all content from the data; no story text lives in components.
- **Views:** Artifact (name and version, what it is, produced by, used by with surface names, meaning, status or marker, lineage links, other versions, Technical payload); Responsibility (role, does, does not, in this step, produced so far); Signal (from, to, what it asks, what answers it); Handoff (the artifact version, from, to with surface, why the receiver needs it); Surface (latest received artifact and its sender).
- **Step changes never close the panel or move focus.** The panel updates. A target not drawn in the current beat says so: "Appears in P5", "Handed over in P7", "Signalled in P7".
- **Focus:** opening moves focus to the panel heading. Esc or ✕ closes it and returns focus to the element that opened it (the caption heading if that element is gone). Back with the inspector open keeps focus on Back. → / ← still step the story from anywhere except inside About.
- **Placement:** the panel is 400px wide over y 52–760, on the side opposite the selection. It never covers the selected element or the caption bar.
- **Selection and activity are separate visual systems**, and neither uses provenance colour.
- **Simple and Technical** change text only. Technical adds the payload section.
- Never weaken a test. Each new semantic test is shown failing once before it is accepted (lesson 25).

## Review Focus

1. **Esc with About open** closes only About and leaves the inspector open. *Pinned in Task 3.*
2. **Stepping with the panel open:** the panel stays, its content follows the beat, and focus stays where it was (Next or Back). *Pinned in Task 3.*
3. **Selecting a line label, then stepping away:** the panel says "Handed over in …" or "Signalled in …", and closing returns focus to the caption heading because the label is gone. *Pinned in Task 3.*
4. **A lineage link to an artifact that isn't drawn** (an earlier version): the ring goes to its slot card, and the panel stays on the same side. *Pinned in Task 3.*
5. **Cards as buttons still fit:** no clipped text, no overlap, layout and fit tests unchanged in all beats and both views. *Pinned in Task 2 (existing layout tests must stay green).*

---

### Task 1: Scenario data and the `inspect` model

**Model:** sonnet

**Files:**
- Modify: `src/scenario/types.ts` (`ArtifactKind.uses`)
- Modify: `src/scenario/scenario.ts` (`uses` on every kind that has consumers)
- Modify: `src/model/describe.ts` (`cardName`, `surfaceName`)
- Create: `src/model/inspect.ts`
- Create: `tests/unit/inspect.test.ts`
- Modify: `tests/unit/catalog.test.ts` (one test)

**Interfaces:**
- Produces: `type Target`, `interface Item`, `interface Section`, `interface Inspection`, `inspect(target: Target, n: number, view: View): Inspection` in `src/model/inspect.ts`.
- Produces: `cardName(id: string, marker?: Marker, earlier?: number): string` and `surfaceName(s: Surface, received?: string): string` in `src/model/describe.ts`.

- [ ] **Step 1: Branch**

```bash
git switch -c plan-4-inspector
```

- [ ] **Step 2: Write the failing tests**

Add to `tests/unit/catalog.test.ts` (import `KINDS` if needed):

```ts
it('every consumer of every artifact kind has a reason to use it (inspector handoff view)', () => {
  for (const k of KINDS)
    for (const c of k.consumers) expect(k.uses?.[c], `${k.id} → ${c}`).toMatch(/\S/);
});
```

Create `tests/unit/inspect.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  KINDS,
  RESPONSIBILITIES,
  SIGNALS,
  STEPS,
  SURFACES,
  kind,
  producerOf,
  version,
} from '../../src/scenario/scenario.ts';
import type { Party } from '../../src/scenario/types.ts';
import { lineKey, stateAt } from '../../src/model/state.ts';
import { cardName, surfaceName } from '../../src/model/describe.ts';
import { inspect, type Inspection } from '../../src/model/inspect.ts';

const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const section = (i: Inspection, heading: string) =>
  i.sections.find((s) => s.heading === heading)?.items ?? [];
const texts = (i: Inspection, heading: string) => section(i, heading).map((x) => x.text);

describe('inspect: artifacts (spec §7)', () => {
  it('names producer and every consumer, with Presentation surfaces, for every visible version', () => {
    STEPS.forEach((step, n) => {
      for (const id of stateAt(n).visible) {
        const k = kind(version(id).kind);
        const i = inspect({ t: 'artifact', version: id }, n, 'simple');
        expect(i.kind).toBe('Artifact');
        expect(i.note, `${step.id} ${id}`).toBeUndefined();
        expect(texts(i, 'Produced by')[0], id).toContain(RESPONSIBILITIES[k.producer].name);
        const used = texts(i, 'Used by').join(' ');
        for (const c of k.consumers) expect(used, `${id} used by ${c}`).toContain(RESPONSIBILITIES[c].name);
      }
    });
    const ss = inspect({ t: 'artifact', version: 'ss1' }, at('P15'), 'simple');
    expect(texts(ss, 'Used by').join(' ')).toContain(SURFACES.portal);
    const ev = inspect({ t: 'artifact', version: 'ev-viol' }, at('D8'), 'simple');
    expect(texts(ev, 'Used by').join(' ')).toContain(SURFACES.faultMgmt);
  });

  it('links each lineage entry to that version', () => {
    for (const id of stateAt(STEPS.length - 1).visible) {
      const i = inspect({ t: 'artifact', version: id }, STEPS.length - 1, 'simple');
      expect(
        section(i, 'Lineage').map((x) => x.target),
        id,
      ).toEqual(version(id).lineage.map((v) => ({ t: 'artifact', version: v })));
    }
  });

  it('says when an artifact is not drawn yet', () => {
    expect(inspect({ t: 'artifact', version: 'ds1' }, at('P2'), 'simple').note).toBe('Appears in P5');
  });

  it('shows the Technical payload only in the Technical view', () => {
    const t = { t: 'artifact', version: 'ds1' } as const;
    expect(section(inspect(t, at('P5'), 'simple'), 'Payload (illustrative)')).toEqual([]);
    expect(texts(inspect(t, at('P5'), 'technical'), 'Payload (illustrative)')).toEqual(
      version('ds1').technical,
    );
  });

  it('shows the marker the version has at that beat', () => {
    expect(texts(inspect({ t: 'artifact', version: 'ds1' }, at('P10'), 'simple'), 'Status')).toEqual([
      '= IN SYNC',
    ]);
  });
});

describe('inspect: responsibilities', () => {
  it('lists exactly the events of this beat that involve the party', () => {
    STEPS.forEach((step, n) => {
      for (const p of Object.keys(RESPONSIBILITIES) as Party[]) {
        const involved = step.events.filter((e) =>
          e.t === 'work'
            ? e.owner === p
            : e.t === 'signal' || e.t === 'handoff'
              ? e.from === p || e.to === p
              : e.t === 'network'
                ? p === 'network'
                : producerOf(e.version) === p,
        );
        const i = inspect({ t: 'responsibility', party: p }, n, 'simple');
        expect(section(i, 'In this step').length, `${step.id} ${p}`).toBe(Math.max(involved.length, 1));
        expect(texts(i, 'Does')).toEqual(RESPONSIBILITIES[p].does);
        expect(texts(i, 'Does not')).toEqual(RESPONSIBILITIES[p].doesNot);
      }
    });
  });

  it('links what the party has produced so far', () => {
    const i = inspect({ t: 'responsibility', party: 'intent' }, at('P5'), 'simple');
    expect(section(i, 'Produced so far').map((x) => x.target)).toEqual(
      ['si', 'ni1', 'ds1'].map((v) => ({ t: 'artifact', version: v })),
    );
  });
});

describe('inspect: lines', () => {
  it('a request signal names what answers it; every handoff says why the receiver needs it', () => {
    STEPS.forEach((step, n) => {
      for (const e of step.events) {
        if (e.t !== 'signal' && e.t !== 'handoff') continue;
        const i = inspect({ t: 'line', step: n, key: lineKey(e) }, n, 'simple');
        expect(i.note).toBeUndefined();
        if (e.t === 'signal') {
          expect(i.kind).toBe('Signal');
          const a = SIGNALS[e.signal].answeredBy;
          if (a) expect(texts(i, 'Answered by')[0]).toBe(a in SIGNALS ? SIGNALS[a as keyof typeof SIGNALS].label : kind(a as (typeof KINDS)[number]['id']).name);
        } else {
          expect(i.kind).toBe('Handoff');
          expect(texts(i, 'Why the receiver needs it')[0]).toBe(kind(version(e.version).kind).uses![e.to]);
        }
      }
    });
  });

  it('says when a line belongs to another beat', () => {
    const p6 = at('P6');
    const handoff = { t: 'line', step: p6, key: 'intent>observability:sloDefinition' } as const;
    expect(inspect(handoff, p6 + 1, 'simple').note).toBe('Handed over in P6');
    const signal = { t: 'line', step: p6, key: 'orchestrator>observability:onboard' } as const;
    expect(inspect(signal, p6 + 1, 'simple').note).toBe('Signalled in P6');
  });
});

describe('inspect: surfaces', () => {
  it('shows the latest received artifact and its sender, and the Portal its own request', () => {
    const i = inspect({ t: 'surface', surface: 'portal' }, at('P15'), 'simple');
    expect(section(i, 'Showing')[0]?.target).toEqual({ t: 'artifact', version: 'ss1' });
    expect(texts(i, 'From')).toEqual(['Observability']);
    expect(section(i, 'Its own requests').map((x) => x.target)).toEqual([{ t: 'artifact', version: 'sr' }]);
    expect(texts(inspect({ t: 'surface', surface: 'api' }, at('P15'), 'simple'), 'Showing')).toEqual([
      'Nothing received yet.',
    ]);
  });
});

describe('accessible names (spec §11)', () => {
  it('cards say what, which version, by whom, and their status, marker and earlier versions', () => {
    expect(cardName('ds1', 'IN_SYNC')).toBe('Desired network state v1, by Intent, in sync');
    expect(cardName('ss2', undefined, 1)).toBe(
      'Service state 10:46, by Observability, degraded, 1 earlier version',
    );
    expect(surfaceName('portal', 'ss1')).toBe(
      'Portal, showing Service state 09:13, by Observability, healthy',
    );
    expect(surfaceName('api')).toBe('API');
  });
});
```

The expected names were checked against `scenario.ts` (kind `desiredState` is "Desired network state"; `ss1`/`ss2` are labelled by time).

- [ ] **Step 3: Run the tests to see them fail**

Run: `npx vitest run tests/unit/inspect.test.ts tests/unit/catalog.test.ts`
Expected: FAIL. `inspect.ts` does not resolve, and the catalog test fails on the first kind without `uses`.

- [ ] **Step 4: Add `uses` to the data**

In `src/scenario/types.ts`, add to `ArtifactKind`:

```ts
  /** For each consumer: why it needs this artifact (the inspector's handoff view). */
  uses?: Partial<Record<Party, string>>;
```

In `src/scenario/scenario.ts`, add `uses` to each kind with consumers, using exactly these texts:

| kind | consumer | uses |
|---|---|---|
| serviceRequest | orchestrator | 'It starts a provisioning workflow and relays the request to Intent as its own intent request.' |
| intentRequest | intent | 'It records the requested service as service intent, the source of truth for what ACME should get.' |
| desiredState | executor | 'It renders and applies the configuration that Orchestrator’s apply request names. Executor takes it directly from Intent.' |
| sloDefinition | observability | 'It turns the definition into its own SLO rule, so it can evaluate the SLI without asking Intent again.' |
| applyRequest | executor | 'It tells Executor which desired-state version to apply. The order names the version; the content stays with Intent.' |
| remediationDecision | intent | 'It says what to change (exclude the faulty link). Intent updates network intent, selects the path and derives the new desired state.' |
| configChange | network | 'The devices run the new configuration.' |
| rawSignals | collector | 'It gathers them and normalizes them into one shape that can be compared.' |
| observedState | intent | 'It checks drift: does what the devices actually have match the desired state?' |
| enriched | observability | 'It computes the SLI and correlates observations, to understand the service’s state.' |
| serviceState | presentation | 'It displays the service’s state to the people who use it, for example in the Portal.' |
| serviceState | orchestrator | 'A running workflow waits for the service to be HEALTHY before it completes.' |
| serviceEvent | presentation | 'It displays the event: service impact in fault management, repair work in ITSM.' |
| serviceEvent | orchestrator | 'An event, not raw service state, is what starts its remediation workflow.' |
| pathHealth | orchestrator | 'Its remediation policy moves the service only if the alternate path is healthy.' |

If a kind in `scenario.ts` has a consumer not listed here, **stop and report** rather than writing text for it.

- [ ] **Step 5: Accessible names**

In `src/model/describe.ts`, add:

```ts
const MARKER_WORDS: Record<Marker, string> = {
  IN_SYNC: 'in sync',
  UNCHANGED: 'unchanged',
  COMPLETED: 'completed',
};

/** A card's accessible name (spec §11): "Desired network state v2, by Intent, in sync, 1 earlier version". */
export function cardName(id: string, marker?: Marker, earlier = 0): string {
  const v = version(id);
  const k = kind(v.kind);
  return [
    `${k.name} ${v.label}, by ${RESPONSIBILITIES[k.producer].name}`,
    v.status?.toLowerCase(),
    marker && MARKER_WORDS[marker],
    earlier > 0 && `${earlier} earlier version${earlier > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(', ');
}

export const surfaceName = (s: Surface, received?: string): string =>
  received ? `${SURFACES[s]}, showing ${cardName(received)}` : SURFACES[s];
```

- [ ] **Step 6: Write `inspect`**

Create `src/model/inspect.ts`:

```ts
import {
  RESPONSIBILITIES,
  SIGNALS,
  STEPS,
  SURFACES,
  SURFACE_ROLES,
  VERSIONS,
  kind,
  producerOf,
  version,
} from '../scenario/scenario.ts';
import type { Event, KindId, Party, SignalId, Step, Surface, View } from '../scenario/types.ts';
import { MARKER_TEXT, artifactName, describe, statusText } from './describe.ts';
import { lineKey, stateAt, type Exchange } from './state.ts';

/** What the reader can select (spec §7). A line is identified by its beat and its route key. */
export type Target =
  | { t: 'artifact'; version: string }
  | { t: 'responsibility'; party: Party }
  | { t: 'surface'; surface: Surface }
  | { t: 'line'; step: number; key: string };

export interface Item {
  text: string;
  /** Set when the item is a link that moves the selection. */
  target?: Target;
}
export interface Section {
  heading: string;
  items: Item[];
  /** Machine values, shown in monospace. */
  mono?: boolean;
}
export interface Inspection {
  kind: 'Artifact' | 'Responsibility' | 'Signal' | 'Handoff' | 'Surface';
  title: string;
  /** Set when the target isn't drawn in this beat, for example "Appears in P5". */
  note?: string;
  sections: Section[];
}

const name = (p: Party, surface?: Surface) =>
  p === 'presentation' && surface
    ? `${RESPONSIBILITIES.presentation.name} (${SURFACES[surface]})`
    : RESPONSIBILITIES[p].name;
const text = (t: string): Item => ({ text: t });
const link = (id: string): Item => ({ text: artifactName(id), target: { t: 'artifact', version: id } });
const sec = (heading: string, items: Item[], mono?: boolean): Section[] =>
  items.length ? [{ heading, items, ...(mono ? { mono } : {}) }] : [];
const stepId = (match: (e: Event) => boolean) => STEPS.find((s: Step) => s.events.some(match))?.id;

/** The Presentation surfaces the story hands a kind to, in story order. */
const surfacesFor = (k: KindId) => [
  ...new Set(
    STEPS.flatMap((s) =>
      s.events.flatMap((e) =>
        e.t === 'handoff' && e.to === 'presentation' && e.surface && version(e.version).kind === k
          ? [SURFACES[e.surface]]
          : [],
      ),
    ),
  ),
];

const involves = (e: Event, p: Party) =>
  e.t === 'work'
    ? e.owner === p
    : e.t === 'signal' || e.t === 'handoff'
      ? e.from === p || e.to === p
      : e.t === 'network'
        ? p === 'network'
        : producerOf(e.version) === p;

/** The inspector's content for a target at beat n (spec §7), derived from the scenario data only. */
export function inspect(target: Target, n: number, view: View): Inspection {
  const state = stateAt(n);
  switch (target.t) {
    case 'artifact': {
      const v = version(target.version);
      const k = kind(v.kind);
      const marker = state.markers[v.id];
      const usedBy = k.consumers.map((c) =>
        c === 'presentation'
          ? `${RESPONSIBILITIES.presentation.name} (${surfacesFor(k.id).join(', ')})`
          : RESPONSIBILITIES[c].name,
      );
      return {
        kind: 'Artifact',
        title: artifactName(v.id),
        note: state.visible.includes(v.id)
          ? undefined
          : `Appears in ${stepId((e) => e.t === 'appear' && e.version === v.id)}`,
        sections: [
          ...sec('What it is', [text(k.whatItIs)]),
          ...sec('Produced by', [text(name(k.producer, k.producerSurface))]),
          ...sec('Used by', (usedBy.length ? usedBy : [`Kept by ${RESPONSIBILITIES[k.producer].name} for its own work.`]).map(text)),
          ...sec('Meaning', [text(v.meaning)]),
          ...sec(
            'Status',
            [v.status && statusText(v.status), marker && MARKER_TEXT[marker]].filter((x) => !!x).map((x) => text(x as string)),
          ),
          ...sec('Lineage', v.lineage.map(link)),
          ...sec(
            'Other versions',
            VERSIONS.filter((o) => o.kind === v.kind && o.id !== v.id && state.visible.includes(o.id)).map((o) => link(o.id)),
          ),
          ...(view === 'technical' ? sec('Payload (illustrative)', v.technical.map(text), true) : []),
        ],
      };
    }
    case 'responsibility': {
      const p = target.party;
      const r = RESPONSIBILITIES[p];
      const now = STEPS[n]!.events.filter((e) => involves(e, p)).map((e) =>
        e.t === 'appear' ? { ...link(e.version), text: `New: ${artifactName(e.version)}` } : text(describe(e, view)),
      );
      return {
        kind: 'Responsibility',
        title: r.name,
        sections: [
          ...sec('Role', [text(r.role)]),
          ...sec('Does', r.does.map(text)),
          ...sec('Does not', r.doesNot.map(text)),
          ...sec('In this step', now.length ? now : [text('Nothing in this beat.')]),
          ...sec('Produced so far', state.visible.filter((id) => producerOf(id) === p).map(link)),
        ],
      };
    }
    case 'line': {
      const s = STEPS[target.step]!;
      const e = s.events.find(
        (x): x is Exchange => (x.t === 'signal' || x.t === 'handoff') && lineKey(x) === target.key,
      );
      if (!e) throw new Error(`No line ${target.key} in ${s.id}`);
      const elsewhere = target.step !== n;
      if (e.t === 'signal') {
        const info = SIGNALS[e.signal];
        const a = info.answeredBy;
        return {
          kind: 'Signal',
          title: `${info.label}${e.version ? ` ${version(e.version).label}` : ''}`,
          note: elsewhere ? `Signalled in ${s.id}` : undefined,
          sections: [
            ...sec('From', [text(name(e.from))]),
            ...sec('To', [text(name(e.to))]),
            ...sec('Asks', [text(info.asks)]),
            ...sec('About', e.version ? [link(e.version)] : []),
            ...sec('Answered by', [
              text(a ? (a in SIGNALS ? SIGNALS[a as SignalId].label : kind(a as KindId).name) : 'Nothing: it answers an earlier request.'),
            ]),
          ],
        };
      }
      return {
        kind: 'Handoff',
        title: artifactName(e.version),
        note: elsewhere ? `Handed over in ${s.id}` : undefined,
        sections: [
          ...sec('Artifact', [link(e.version)]),
          ...sec('From', [text(name(e.from, e.surface))]),
          ...sec('To', [text(name(e.to, e.surface))]),
          ...sec('Why the receiver needs it', [text(kind(version(e.version).kind).uses![e.to]!)]),
        ],
      };
    }
    case 'surface': {
      const s = target.surface;
      const shown = state.surfaces[s];
      return {
        kind: 'Surface',
        title: SURFACES[s],
        sections: [
          ...sec('Role', [text(SURFACE_ROLES[s])]),
          ...sec('Showing', [shown ? link(shown) : text('Nothing received yet.')]),
          ...sec('From', shown ? [text(RESPONSIBILITIES[producerOf(shown)].name)] : []),
          ...sec(
            'Its own requests',
            state.visible.filter((id) => kind(version(id).kind).producerSurface === s).map(link),
          ),
        ],
      };
    }
  }
}
```

The handoff "Why" uses the non-null assertion because the catalog test guarantees every consumer has `uses`.

- [ ] **Step 7: Run the tests to see them pass**

Run: `npx vitest run tests/unit/inspect.test.ts tests/unit/catalog.test.ts`
Expected: PASS. If a test fails because of the data (not a typo in the test), stop and report it. Don't change the test's intent.

- [ ] **Step 8: Show the tests can fail (lesson 25)**

Temporarily delete `'presentation',` from `serviceState`'s `consumers` in `scenario.ts`. Run `npx vitest run tests/unit/inspect.test.ts`: "names producer and every consumer…" should FAIL (no Portal under Used by). Restore it. Then temporarily change `involves` to return `false` for `'appear'` events. "lists exactly the events…" should FAIL. Restore, rerun: PASS. Note both in the report.

- [ ] **Step 9: Full checks and commit**

Run: `npm run format && npm run check && npm test`
Expected: PASS. If `npm run format` touches files outside this task, revert those.

```bash
git add src/scenario/types.ts src/scenario/scenario.ts src/model/describe.ts src/model/inspect.ts tests/unit/inspect.test.ts tests/unit/catalog.test.ts
git commit -m "Plan 4: the inspect model, with why each consumer needs each artifact"
```

---

### Task 2: Inspectable buttons and the selection ring

**Model:** sonnet

**Files:**
- Modify: `src/ui/Card.svelte` (root `<button>`, spans, name, selection)
- Modify: `src/ui/Stage.svelte` (surface buttons, region-title buttons, props)
- Modify: `src/ui/Network.svelte` (region-title button, props)
- Modify: `src/ui/Lines.svelte` (label click selects, focus finishes motion)
- Modify: `src/App.svelte` (`selected` state, `select`)
- Modify: `src/app.css` (button resets, `.selected` ring)
- Create: `tests/e2e/inspector.spec.ts`

**Interfaces:**
- Consumes: `Target` from `src/model/inspect.ts`; `cardName`, `surfaceName` from `src/model/describe.ts`; `finishAll` from `src/ui/motion.ts`.
- Produces: props `selected: Target | null` and `onSelect: (t: Target) => void` on `Stage`, `Card`, `Network` and `Lines`. The ringed element has class `selected` and `aria-current="true"`. The region-title button has class `region-name`.

- [ ] **Step 1: Write the failing browser tests**

Create `tests/e2e/inspector.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { STEPS } from '../../src/scenario/scenario.ts';

const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const tick = (page: Page, n: number) =>
  page.getByRole('button', { name: `Go to ${STEPS[n]!.id}: ${STEPS[n]!.title}` });
const card = (page: Page, v: string) => page.locator(`.card[data-version="${v}"]`);
const running = (page: Page) =>
  page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
});

test('cards, surfaces and region titles are buttons with full names', async ({ page }) => {
  await tick(page, at('P10')).click();
  await expect(page.getByRole('button', { name: /^Desired network state v1, by Intent, in sync$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Portal$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Intent', exact: true })).toBeVisible();
});

test('clicking a card rings it; selection is not focus styling', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').click();
  await expect(card(page, 'ds1')).toHaveClass(/\bselected\b/);
  await expect(card(page, 'ds1')).toHaveAttribute('aria-current', 'true');
  await expect(card(page, 'ds1')).toHaveCSS('outline-style', 'dashed');
});

test('Enter on a region title, a surface and a line label selects them', async ({ page }) => {
  await tick(page, at('P15')).click();
  await page.getByRole('button', { name: 'Intent', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-party="intent"]')).toHaveClass(/\bselected\b/);
  await page.locator('.surface[data-surface="portal"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.surface[data-surface="portal"]')).toHaveClass(/\bselected\b/);
  await expect(page.locator('[data-party="intent"]')).not.toHaveClass(/\bselected\b/);
  const label = page.locator('.label').first();
  await label.focus();
  await page.keyboard.press('Enter');
  await expect(label).toHaveClass(/\bselected\b/);
});

test('selecting, or focusing a line label, finishes running motion', async ({ page }) => {
  await tick(page, at('P9') - 1).click();
  await page.getByRole('button', { name: 'Next ►' }).click();
  expect(await running(page)).toBeGreaterThan(0);
  await page.locator('.label').last().focus();
  expect(await running(page)).toBe(0);
  await tick(page, at('P9') - 1).click();
  await page.getByRole('button', { name: 'Next ►' }).click();
  await card(page, 'rb-a').click();
  expect(await running(page)).toBe(0);
});
```

Run: `npx playwright test tests/e2e/inspector.spec.ts`
Expected: FAIL (no buttons, no `.selected`).

- [ ] **Step 2: Selection state in App**

In `src/App.svelte`, import `type Target` from `./model/inspect.ts` and add:

```ts
  let selected = $state<Target | null>(null);

  function select(t: Target) {
    finishAll();
    selected = t;
  }
```

Pass `{selected}` and `onSelect={select}` to `<Stage>`. (Task 3 adds the panel, focus and closing.)

- [ ] **Step 3: Cards become buttons**

In `src/ui/Card.svelte`:
- Add props `selected: Target | null` and `onSelect: (t: Target) => void`. Import `cardName` from `../model/describe.ts` and `type Target` from `../model/inspect.ts`.
- Add `const isSelected = $derived(selected?.t === 'artifact' && slot.versions.includes(selected.version));`. Any version in the slot rings the slot card (decision D3).
- Change the root `<div class="card …">` to `<button type="button" class="card …"` with:
  - `class:selected={isSelected}`;
  - `aria-current={isSelected ? 'true' : undefined}`;
  - `aria-label={cardName(v.id, marker(v.id), earlier.length)}`;
  - `onclick={() => onSelect({ t: 'artifact', version: v.id })}`.
- Inside it, change `<div class="head">` and `<div class="body">` to `<span>`, `<ol class="wf-steps" …>` to `<span class="wf-steps" …>` with each `<li>` to `<span class="wf-step">` (keep the `done`/`now` classes), and `<p class="waiting">` to `<span class="waiting">`. Drop the `aria-label` on the steps list (a button's content is presentational; the inspector carries it).

In `src/app.css`:
- Add `display: block` to the `.head`, `.body`, `.wf-steps` and `.waiting` rules if they don't set `display`. Add `display: inline` to `.wf-step`.
- Change the `.wf-steps li + li::before` selector to `.wf-step + .wf-step::before`.
- Add the button reset to `.card`: `font: inherit; text-align: left; cursor: pointer;`.

Keep `data-version`, every class name and every child `data-version` span unchanged. The existing e2e end-state and workflow tests read them.

- [ ] **Step 4: Surfaces and region titles become buttons**

In `src/ui/Stage.svelte`:
- Add props `selected` and `onSelect` and pass both to every `<Card>`, `<Network>` and `<Lines>`.
- The surface `<div class="surface" …>` becomes `<button type="button" class="surface" …>` with:
  - `class:selected`, true when `selected?.t === 'surface' && selected.surface === s`, or when `selected?.t === 'artifact' && kind(version(selected.version).kind).producerSurface === s`;
  - `aria-current` to match;
  - `aria-label={surfaceName(s, stage.surfaces[s])}`;
  - `onclick={() => onSelect({ t: 'surface', surface: s })}`.
  
  Inside it, `.minis` and `.mini` divs become spans.
- In the `header` snippet, wrap `<span class="swatch"></span>{RESPONSIBILITIES[p].name}` in `<button type="button" class="region-name" onclick={() => onSelect({ t: 'responsibility', party: p })}>…</button>`. The `.work`/`.role` spans stay outside the button.
- Each region `<section>` gets `class:selected={selected?.t === 'responsibility' && selected.party === p}` (for Presentation, `'presentation'`) and the matching `aria-current`.

In `src/ui/Network.svelte`, add the same props, pass them to its `<Card>`s, wrap the name in its `<h2>` in the same `region-name` button (party `'network'`), and add `class:selected` and `aria-current` to its `<section>`.

In `src/app.css`:
- `.surface`: add `font: inherit; color: inherit; text-align: left; cursor: pointer; display: block;`.
- `.minis` and `.mini` keep their `display` values (spans take them from the rules).
- `.region-name`: `all: unset; cursor: pointer;` and `.region-name:focus-visible { outline: 2px solid #ffffff; outline-offset: 2px; }`.
- The selection ring, separate from focus (solid, inside) and from activity (background):

```css
/* Selection (spec §7): a dashed ring outside the element. Focus is a solid ring inside it; activity is the
   region's background; the motion overlay's gain uses box-shadow. None of them shares another's styling. */
.selected {
  outline: 2px dashed var(--text);
  outline-offset: 3px;
}
```

- [ ] **Step 5: Line labels select, and focusing one finishes motion**

In `src/ui/Lines.svelte`:
- add props `selected`, `onSelect` and `step` (already present);
- on the label button add `class:selected={selected?.t === 'line' && selected.step === step && selected.key === r.key}`, `aria-current` to match, `onclick={() => onSelect({ t: 'line', step, key: r.key })}` and `onfocus={finishAll}` (import from `./motion.ts`);
- update the comment above the labels: they are now inspectable.

- [ ] **Step 6: Run the tests**

Run: `npx playwright test tests/e2e/inspector.spec.ts tests/e2e/skeleton.spec.ts`
Expected: PASS. The layout and overflow tests in `skeleton.spec.ts` must stay green. If a card or surface now overflows, fix the CSS reset (for example `line-height`, `padding`), not the test.

- [ ] **Step 7: Full checks and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add src/ui/Card.svelte src/ui/Stage.svelte src/ui/Network.svelte src/ui/Lines.svelte src/App.svelte src/app.css tests/e2e/inspector.spec.ts
git commit -m "Plan 4: inspectable buttons and the selection ring"
```

---

### Task 3: The inspector panel

**Model:** sonnet

**Files:**
- Create: `src/ui/Inspector.svelte`
- Modify: `src/App.svelte` (panel, side, focus, Esc)
- Modify: `src/app.css` (panel styles)
- Modify: `tests/e2e/inspector.spec.ts`

**Interfaces:**
- Consumes: `inspect`, `Target`, `Inspection` from `src/model/inspect.ts`; `select` and `selected` in App from Task 2.
- Produces: `<aside class="inspector left|right" aria-labelledby="inspector-title">` with heading `#inspector-title` (`tabindex="-1"`), close button "Close inspector", and link buttons `.inspector-link`.

- [ ] **Step 1: Write the failing browser tests**

Append to `tests/e2e/inspector.spec.ts`:

```ts
const panel = (page: Page) => page.locator('aside.inspector');
const heading = (page: Page) => page.locator('#inspector-title');

test('a card opens the inspector opposite it, with focus on its heading', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').click();
  await expect(panel(page)).toHaveClass(/\bleft\b/);
  await expect(heading(page)).toBeFocused();
  await expect(heading(page)).toContainText('v1');
  await expect(panel(page)).toContainText('Produced by');
  await expect(panel(page)).toContainText('Executor');
  // The open panel now covers Observability, so use the keyboard, as a reader would.
  await page.locator('.region[data-party="observability"] .region-name').focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toHaveClass(/\bright\b/);
  await expect(panel(page)).toContainText('Does not');
});

test('Esc and ✕ close it and return focus to what opened it', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').focus();
  await page.keyboard.press('Enter');
  await expect(heading(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(card(page, 'ds1')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Close inspector' }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(card(page, 'ds1')).toBeFocused();
});

test('stepping keeps the panel and focus; content follows the beat', async ({ page }) => {
  await tick(page, at('P5')).click();
  await page.getByRole('button', { name: 'Intent', exact: true }).click();
  const back = page.getByRole('button', { name: '◄ Back' });
  await back.focus();
  await back.click();
  await expect(panel(page)).toBeVisible();
  await expect(back).toBeFocused();
  await expect(panel(page)).toContainText('derive network intent');
  await page.keyboard.press('ArrowRight');
  await expect(panel(page)).toContainText('derive desired state');
});

test('a line label shows its signal view, and says so when its beat has passed', async ({ page }) => {
  await tick(page, at('P10')).click();
  await page.locator('.label', { hasText: 'check drift' }).click();
  await expect(panel(page)).toContainText('Answered by');
  await expect(panel(page)).toContainText('in sync');
  await page.keyboard.press('ArrowRight');
  await expect(panel(page)).toContainText('Signalled in P10');
  await page.keyboard.press('Escape');
  await expect(page.locator('#caption-heading')).toBeFocused();
});

test('a lineage link moves the selection; an earlier version rings its slot card', async ({ page }) => {
  await tick(page, at('R7')).click();
  const ds = page.locator('.card[data-version^="ds"]').first();
  await ds.click();
  const side = await panel(page).getAttribute('class');
  await page.locator('.inspector-link', { hasText: 'Desired network state (v1)' }).click();
  await expect(heading(page)).toContainText('v1');
  await expect(heading(page)).toBeFocused();
  await expect(ds).toHaveClass(/\bselected\b/);
  expect(await panel(page).getAttribute('class')).toBe(side);
});

test('Esc with About open closes only About', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').click();
  await page.getByRole('button', { name: 'About' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.about')).not.toHaveAttribute('open');
  await expect(panel(page)).toBeVisible();
});

test('the panel never covers the selected card or the caption bar', async ({ page }) => {
  for (const v of ['ds1', 'slorule', 'wf-prov']) {
    // Close the previous panel first: it may cover the next card.
    await page.keyboard.press('Escape');
    await tick(page, at('P10')).click();
    await card(page, v).click();
    const [a, b, c] = await Promise.all([
      panel(page).boundingBox(),
      card(page, v).boundingBox(),
      page.locator('footer.caption').boundingBox(),
    ]);
    const overlap = (p: typeof a, q: typeof a) =>
      !!p && !!q && p.x < q.x + q.width && q.x < p.x + p.width && p.y < q.y + q.height && q.y < p.y + p.height;
    expect(overlap(a, b), v).toBe(false);
    expect(overlap(a, c), v).toBe(false);
  }
});
```

Run: `npx playwright test tests/e2e/inspector.spec.ts`
Expected: the new tests FAIL (no panel).

If the version ids `slorule` or `wf-prov`, or the label texts "check drift" / "in sync", differ in `scenario.ts`, fix the test to the data and say so in the report.

- [ ] **Step 2: The panel component**

Create `src/ui/Inspector.svelte`:

```svelte
<script lang="ts">
  import type { View } from '../scenario/types.ts';
  import { inspect, type Target } from '../model/inspect.ts';

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
</script>

<!-- Non-modal (spec §7): the story keeps stepping while it is open, and it follows the beat. -->
<aside class="inspector {side}" aria-labelledby="inspector-title">
  <button class="inspector-close" aria-label="Close inspector" onclick={onClose}>✕</button>
  <p class="inspector-kind">{info.kind}</p>
  <h2 id="inspector-title" tabindex="-1">{info.title}</h2>
  {#if info.note}<p class="inspector-note">{info.note}</p>{/if}
  {#each info.sections as s (s.heading)}
    <h3>{s.heading}</h3>
    <ul class:mono={s.mono}>
      {#each s.items as it, i (i)}
        <li>
          {#if it.target}
            <button class="inspector-link" onclick={() => onSelect(it.target!)}>{it.text}</button>
          {:else}
            {it.text}
          {/if}
        </li>
      {/each}
    </ul>
  {/each}
</aside>
```

- [ ] **Step 3: Wire it in App**

In `src/App.svelte`, import `Inspector`, and replace Task 2's `select` with:

```ts
  let selected = $state<Target | null>(null);
  let side = $state<'left' | 'right'>('right');
  let opener: HTMLElement | null = null;

  /** Opens or moves the inspector (spec §7): finishes motion, sides it opposite the ring, focuses its heading. */
  async function select(t: Target) {
    finishAll();
    if (!selected) opener = document.activeElement as HTMLElement | null;
    selected = t;
    await tick();
    const ring = document.querySelector('.selected');
    const stageEl = document.querySelector('.stage');
    // Nothing is ringed when the target isn't drawn in this beat: keep the side.
    if (ring && stageEl) {
      const a = ring.getBoundingClientRect();
      const b = stageEl.getBoundingClientRect();
      side = a.left + a.width / 2 > b.left + b.width / 2 ? 'left' : 'right';
    }
    await tick();
    document.getElementById('inspector-title')?.focus();
  }

  async function closeInspector() {
    selected = null;
    await tick();
    (opener?.isConnected ? opener : document.getElementById('caption-heading'))?.focus();
    opener = null;
  }
```

In `onKeydown`, after the `if (about?.open) return;` line, add:

```ts
    if (e.key === 'Escape' && selected) {
      e.preventDefault();
      closeInspector();
      return;
    }
```

The modifier-key guard above it returns early for modified keys. That is fine: plain Esc is what closes.

Inside `.stage`, after `<Stage …/>` and before `<CaptionBar …/>`, add:

```svelte
    {#if selected}
      <Inspector
        target={selected}
        {step}
        {view}
        {side}
        onSelect={select}
        onClose={closeInspector}
      />
    {/if}
```

- [ ] **Step 4: Panel styles**

In `src/app.css`, add (tokens only; no provenance colour):

```css
/* Inspector (spec §3, §7): 400px over the responsibilities zone, opposite the selection. */
.inspector {
  position: absolute;
  top: 52px;
  width: 400px;
  height: 708px;
  box-sizing: border-box;
  z-index: 10;
  overflow-y: auto;
  padding: 12px 16px;
  background: var(--panel);
  border: 1px solid var(--border-new);
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  line-height: 1.4;
}
.inspector.left {
  left: 12px;
}
.inspector.right {
  left: 1028px;
}
.inspector-close {
  position: absolute;
  top: 8px;
  right: 8px;
  font: inherit;
  color: var(--muted);
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
}
.inspector-kind {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.inspector h2 {
  margin: 2px 32px 8px 0;
  font-size: 16px;
}
.inspector-note {
  margin: 0 0 8px;
  color: var(--muted);
  font-style: italic;
}
.inspector h3 {
  margin: 10px 0 2px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.inspector ul {
  margin: 0;
  padding-left: 16px;
}
.inspector ul.mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
}
.inspector-link {
  all: unset;
  cursor: pointer;
  text-decoration: underline;
}
.inspector-link:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
```

- [ ] **Step 5: Run the tests**

Run: `npx playwright test tests/e2e/inspector.spec.ts tests/e2e/about.spec.ts`
Expected: PASS.

- [ ] **Step 6: Full checks and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add src/ui/Inspector.svelte src/App.svelte src/app.css tests/e2e/inspector.spec.ts
git commit -m "Plan 4: the inspector panel"
```

---

### Task 4: Look at it, spec rev 10, deferred items

**Model:** opus (native, with the user)

**Files:**
- Modify: `docs/specs/2026-10-10-naf-explorer-design.md` (§7, §12, revision log)
- Modify: `docs/deferred-work.md`

- [ ] **Step 1: Look at it** at 1440×900 in both views: a card, an earlier version through Lineage, a region title, a surface, a signal label and a handoff label. Check that the panel text is readable, that the ring is distinct from focus and from activity, and that the panel covers nothing it shouldn't. Show the user, and record cosmetic findings in `docs/deferred-work.md` (tag **Plan 5**).

- [ ] **Step 2: Spec rev 10.** Under §7 add an "As built (rev 10)" paragraph naming decisions D1–D6 from this plan in one sentence each. Add `model/inspect.ts` and `ui/Inspector.svelte` to the §12 tree if missing. Add a revision-log line: "**rev 10 (plan 4):** the inspector, from `inspect(target, n, view)`; cards and surfaces are buttons; the selection ring is a dashed outline. See §7 "As built"."

- [ ] **Step 3: Deferred items.** Remove the **Plan 4** items that are done:
  - inspector and earlier versions (D3);
  - Orchestrator's `does` text (already reworded in `scenario.ts`);
  - keyboard gate (already in `App.svelte`: `if (about?.open) return`);
  - line labels without action;
  - selection ring vs gain (D2);
  - invisible labels mid-beat (D5).

- [ ] **Step 4: Verify and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add docs/specs/2026-10-10-naf-explorer-design.md docs/deferred-work.md
git commit -m "Plan 4: spec rev 10, deferred items"
```

- [ ] **Step 5: Final review.** Dispatch the whole-branch review (Opus) against this plan and spec §7. Then use superpowers:finishing-a-development-branch.
