# Plan 1: Walking skeleton, implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A navigable end-to-end ACME story. All 36 beats exist as canonical data, the full semantic test suite over that data is green, and a plain stage shows the regions, cards, surfaces, network state, the current step's exchanges (signals, handoffs, work) and the caption, with keyboard navigation and a Simple/Technical switch.

**Architecture:** `src/scenario/scenario.ts` is the single source of story content (catalogs, network text, plus 36 steps with ordered events). `src/model/state.ts` folds the events into the stage state for any step (`stateAt`, including one card slot per artifact kind) and lists the current step's exchanges in causal order (`linesOf`). `src/model/describe.ts` turns an event into one line of text for both the beat table and the stage. Svelte 5 components render that state on a fixed 1440×900 stage, scaled to fit the window. The semantic tests import only the scenario and model, never the UI.

**Execution:** subagent-driven. Implementers use the model named in each task's **Model** line; every review uses Opus.

**Revision:** rev 2 of this plan applies an external review. The disposition of each finding is at the end of this document.

**Tech Stack:** Svelte 5 (runes), TypeScript 6 (`strict`), Vite 8, Vitest 5, Playwright 1.64 (Chromium), Prettier 3 with `prettier-plugin-svelte`, `svelte-check` 4. Node 26 (runs `.ts` scripts natively).

**Spec:** `docs/specs/2026-10-10-naf-explorer-design.md`, §14 delivery step 1. Requirements: `docs/brief/02`, `03`, `07` as amended by `docs/adr/0001-orchestrator-controls-every-job.md`.

This is plan 1 of 5. The later plans (layout and visual design, motion, inspector and About, accessibility and content) are written when this one has merged.

## Global Constraints

- Desktop only. Fixed stage of 1440×900, scaled uniformly with `transform: scale()`, never scrolled. It must fit 1280×720 and 1920×1080 without scrollbars.
- No backend, no analytics, no web fonts. Use `system-ui` for prose and `ui-monospace` for machine values.
- `scenario.ts` is the only place story content is defined. Nothing in `src/ui/` writes story text.
- TypeScript `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly` (no enums or namespaces), and `.ts` extensions in relative imports, so that Node can run the scripts directly.
- Status is always icon + word: `✓ HEALTHY`, `▲ DEGRADED`, `✕ VIOLATED`, `✓ CLEARED`. Device values such as `UP` are plain text, never a chip.
- Content never travels through Orchestrator. Every job Orchestrator starts is answered back to it (ADR 0001).
- At most one new artifact per responsibility per step.
- Simple and Technical render the same events; the view only chooses a text field.
- Nothing inside the stage scrolls or clips. Regions, cards, surfaces and the caption use `overflow: hidden`, and a browser test fails if any of them has more content than room, in any beat and either view.
- **Card visibility policy (spec rev 2):** each producer region has one slot per artifact kind, in order of first appearance. The slot's card shows the kind's newest version: its type, label and status or marker. Earlier versions of that kind stay visible inside the same card as a subdued "earlier:" line, with their status or marker. The body (meaning or Technical lines) is shown only in the step where that version is new. The pacing rule means at most one card per region is expanded at a time.
- Cards are not interactive until plan 4 adds the inspector. They are plain elements, not buttons, so they add no dead tab stops.
- Never weaken a semantic test to make it pass. If the data and a test disagree, check the brief and fix whichever is wrong, then say which one it was.
- Never reuse a running preview server in browser tests (`reuseExistingServer: false`).
- No new dependencies beyond those installed in Task 1 without an ADR.

## Review Focus

These are the most likely failures a person would hit that the spec implies but doesn't spell out. Each one has a test in Task 7.

1. **Arrow keys while a header control has focus** (the view switch or a step tick) must still step the story, not change the view or do nothing.
2. **Modified arrows** (Alt, Shift, Ctrl or Meta + ←/→) belong to the browser and OS and must not step the story.
3. **Pressing Next on the last beat, or Back on the first,** must leave focus on that button and stay put. Native `disabled` would drop focus to `<body>`, so these buttons use `aria-disabled`.
4. **Blocked storage** (private mode or disabled site data, where `localStorage` throws) must not break loading or the view switch.
5. **A window smaller than the targets** (1024×640) must still show the whole stage, with no scrollbars.

**Spec deviation in this plan:** spec §11 calls the view switch a radio group. Native radio groups use ← and → to change the selection, which conflicts with "→ / ← step through the story from anywhere". This plan uses two buttons with `aria-pressed` instead. Task 8 records it as spec rev 2.

---

## File structure

```
package.json, vite.config.ts, svelte.config.js, tsconfig.json, playwright.config.ts
.prettierrc, .prettierignore, index.html
src/main.ts                 mount App
src/app.css                 base styles (tokens arrive in plan 2)
src/vite-env.d.ts           ambient types
src/layout.ts               STAGE, Rect, REGIONS, fitScale
src/storage.ts              load/save that survive blocked storage
src/scenario/types.ts       all scenario types (spec §4.1)
src/scenario/scenario.ts    catalogs, versions, 36 steps, lookups
src/model/state.ts          stateAt (the fold), linesOf (current exchanges)
src/model/describe.ts       one line of text per event; status icons, marker words
src/model/beatTable.ts      Markdown beat table from the data
scripts/beat-table.ts       prints beatTable()
src/App.svelte              step/view state, keyboard, scaling
src/ui/Header.svelte        title, chapters, ticks, view switch
src/ui/Stage.svelte         regions, surfaces, network, slots, exchanges
src/ui/Card.svelte          one slot: newest version, earlier versions, body when new
src/ui/CaptionBar.svelte    caption, counter, Back/Next
tests/unit/layout.test.ts
tests/unit/storage.test.ts
tests/unit/catalog.test.ts
tests/unit/state.test.ts
tests/unit/pairing.ts       request/answer checker (ADR 0001), used by story.test.ts
tests/unit/pairing.test.ts  the checker against wrong, duplicate, unsolicited and missing answers
tests/unit/story.test.ts
tests/unit/beatTable.test.ts
tests/e2e/skeleton.spec.ts
```

---

### Task 1: Project scaffold

**Model:** sonnet

**Files:**
- Create: `package.json`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `playwright.config.ts`, `.prettierrc`, `.prettierignore`, `index.html`, `src/main.ts`, `src/app.css`, `src/vite-env.d.ts`, `src/layout.ts`, `src/App.svelte`
- Test: `tests/unit/layout.test.ts`, `tests/e2e/skeleton.spec.ts`

**Interfaces:**
- Produces: `STAGE: { readonly w: 1440; readonly h: 900 }`, `fitScale(w: number, h: number): number` in `src/layout.ts`. npm scripts: `dev`, `build`, `preview`, `check`, `format`, `format:check`, `test`, `test:e2e`, `beats`, `verify`.

- [ ] **Step 1: Create `package.json` and install dependencies**

```json
{
  "name": "naf-explorer",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json --fail-on-warnings",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "beats": "node scripts/beat-table.ts",
    "verify": "npm run format:check && npm run check && npm test && npm run build && npm run test:e2e"
  }
}
```

Run:

```bash
npm install -D svelte@^5 vite@^8 @sveltejs/vite-plugin-svelte@^7 typescript@^6 svelte-check@^4 vitest@^5 @playwright/test@^1.64 prettier@^3 prettier-plugin-svelte@^4
npx playwright install chromium
```

Expected: installs without peer-dependency errors. (TypeScript is pinned to 6 because `svelte-check` 4 supports TypeScript up to 6.)

- [ ] **Step 2: Create the config files**

`vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: './',
  plugins: [svelte()],
  test: { include: ['tests/unit/**/*.test.ts'] },
});
```

`svelte.config.js`:

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default { preprocess: vitePreprocess() };
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "erasableSyntaxOnly": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests", "scripts", "*.ts"]
}
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4173',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    // Lesson 26: a reused server silently served a stale build.
    reuseExistingServer: false,
  },
});
```

`.prettierrc`:

```json
{ "plugins": ["prettier-plugin-svelte"], "singleQuote": true, "printWidth": 100 }
```

`.prettierignore` (lesson 24: the formatter re-wrapping the docs breaks structural edits):

```
docs/
.superpowers/
dist/
package-lock.json
```

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>How Network Automation Works</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:

```ts
/// <reference types="svelte" />
/// <reference types="vite/client" />
```

`src/main.ts`:

```ts
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

mount(App, { target: document.getElementById('app')! });
```

`src/app.css`:

```css
:root {
  color-scheme: dark;
  --bg: #14171c;
  --panel: #1b1f26;
  --card: #232832;
  --border: #3a414c;
  --text: #e6e9ee;
  --muted: #b3bcc8;
}
html,
body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font: 13px/1.4 system-ui, sans-serif;
}
button {
  font: inherit;
  color: inherit;
}
code {
  font-family: ui-monospace, monospace;
}
:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
.viewport {
  position: fixed;
  inset: 0;
  overflow: hidden;
}
.stage {
  position: absolute;
  left: 50%;
  top: 50%;
}
```

- [ ] **Step 3: Write the failing unit test for `fitScale`**

`tests/unit/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fitScale } from '../../src/layout.ts';

describe('fitScale', () => {
  it('is 1 at the design size', () => expect(fitScale(1440, 900)).toBe(1));
  it('is limited by the tighter axis', () => {
    expect(fitScale(1280, 720)).toBeCloseTo(0.8);
    expect(fitScale(1920, 1080)).toBeCloseTo(1.2);
    expect(fitScale(1024, 640)).toBeCloseTo(0.7111, 3);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run tests/unit/layout.test.ts`
Expected: FAIL, cannot resolve `../../src/layout.ts`.

- [ ] **Step 5: Implement `src/layout.ts`**

```ts
export const STAGE = { w: 1440, h: 900 } as const;

export function fitScale(w: number, h: number): number {
  return Math.min(w / STAGE.w, h / STAGE.h);
}
```

- [ ] **Step 6: Create a minimal `src/App.svelte`**

```svelte
<script lang="ts">
  import { fitScale, STAGE } from './layout.ts';

  let innerWidth = $state(1440);
  let innerHeight = $state(900);
  const scale = $derived(fitScale(innerWidth, innerHeight));
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="viewport">
  <div
    class="stage"
    style:width="{STAGE.w}px"
    style:height="{STAGE.h}px"
    style:transform="translate(-50%, -50%) scale({scale})"
  >
    <h1>How Network Automation Works</h1>
  </div>
</div>
```

- [ ] **Step 7: Write the browser smoke test**

`tests/e2e/skeleton.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('the app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How Network Automation Works');
});
```

- [ ] **Step 8: Run every check**

Run: `npx prettier --write . && npm run check && npm test && npm run test:e2e`
Expected: `svelte-check` reports 0 errors and 0 warnings; Vitest passes 2 tests; Playwright passes 1 test.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vite.config.ts svelte.config.js tsconfig.json playwright.config.ts .prettierrc .prettierignore index.html src tests
git commit -m "chore: scaffold Svelte 5 + TypeScript + Vitest + Playwright"
```

---

### Task 2: Scenario types and catalogs

**Model:** sonnet

**Files:**
- Create: `src/scenario/types.ts`, `src/scenario/scenario.ts`
- Test: `tests/unit/catalog.test.ts`

**Interfaces:**
- Produces (in `types.ts`): `Responsibility`, `Party`, `Surface`, `Status`, `Marker`, `View`, `Text`, `Chapter`, `KindId`, `SignalId`, `WorkVerb`, `ResponsibilityInfo`, `ArtifactKind`, `ArtifactVersion`, `SignalInfo`, `Event`, `Step`.
- Produces (in `scenario.ts`): `TITLE: string`, `SCOPE_NOTE: string`, `NETWORK` (the ground-truth text for The Network region, see Step 4), `CHAPTERS: Record<Chapter, string>`, `RESPONSIBILITIES: Record<Party, ResponsibilityInfo>`, `SURFACES: Record<Surface, string>`, `KINDS: ArtifactKind[]`, `SIGNALS: Record<SignalId, SignalInfo>`, `ALLOWED_WORK: Record<Party, WorkVerb[]>`, `VERSIONS: ArtifactVersion[]` (empty until Task 4), `STEPS: Step[]` (empty until Task 4), `kind(id: KindId): ArtifactKind`, `version(id: string): ArtifactVersion`, `producerOf(versionId: string): Party`.

- [ ] **Step 1: Write `src/scenario/types.ts`**

```ts
export type Responsibility =
  | 'presentation'
  | 'intent'
  | 'orchestrator'
  | 'executor'
  | 'collector'
  | 'observability';
export type Party = Responsibility | 'network';
export type Surface = 'faultMgmt' | 'itsm' | 'portal' | 'perfMgmt' | 'api';
export type Status = 'HEALTHY' | 'DEGRADED' | 'VIOLATED' | 'CLEARED';
export type Marker = 'IN_SYNC' | 'UNCHANGED' | 'COMPLETED';
export type View = 'simple' | 'technical';
export type Text = Record<View, string>;
export type Chapter = 'provision' | 'detect' | 'remediate';

export type KindId =
  | 'serviceRequest'
  | 'intentRequest'
  | 'serviceIntent'
  | 'networkIntent'
  | 'desiredState'
  | 'sloDefinition'
  | 'sloRule'
  | 'workflow'
  | 'remediationDecision'
  | 'configChange'
  | 'rawSignals'
  | 'observedState'
  | 'normalized'
  | 'enriched'
  | 'sli'
  | 'evidence'
  | 'serviceState'
  | 'serviceEvent'
  | 'pathHealth';

/** The amended signal vocabulary of brief 02 (ADR 0001). */
export type SignalId =
  | 'desiredStateReady'
  | 'onboard'
  | 'onboarded'
  | 'apply'
  | 'applied'
  | 'readBack'
  | 'readBackDone'
  | 'checkDrift'
  | 'inSync'
  | 'queryAltPath';

export type WorkVerb =
  | 'record'
  | 'derive'
  | 'checkDrift'
  | 'render'
  | 'apply'
  | 'collect'
  | 'normalize'
  | 'enrich'
  | 'readBack'
  | 'configureSlo'
  | 'computeSli'
  | 'correlate'
  | 'evaluate'
  | 'raiseEvent'
  | 'clearEvent'
  | 'assessPath'
  | 'startWorkflow'
  | 'completeWorkflow'
  | 'evaluatePolicy';

export interface ResponsibilityInfo {
  id: Party;
  name: string;
  role: string;
  does: string[];
  doesNot: string[];
}

export interface ArtifactKind {
  id: KindId;
  name: string;
  producer: Party;
  consumers: Party[];
  whatItIs: string;
  /** The Presentation surface that produces it (the Portal for the service request). */
  producerSurface?: Surface;
  /** For Orchestrator's own artifacts that request work: the signal that answers them. */
  answeredBy?: SignalId;
}

export interface ArtifactVersion {
  id: string;
  kind: KindId;
  label: string;
  status?: Status;
  lineage: string[];
  meaning: string;
  technical: string[];
}

export interface SignalInfo {
  id: SignalId;
  label: string;
  asks: string;
  /** For request signals: the signal or artifact kind that answers them. */
  answeredBy?: SignalId | KindId;
}

export type Event =
  /** `version` is the id of the desired-state version the signal is about, for example 'ds1'. */
  | { t: 'signal'; signal: SignalId; from: Party; to: Party; version?: string }
  | { t: 'handoff'; version: string; from: Party; to: Party; surface?: Surface }
  | { t: 'work'; owner: Party; verb: WorkVerb; label: Text }
  | { t: 'appear'; version: string }
  | { t: 'mark'; version: string; marker: Marker }
  | { t: 'network'; link?: { id: 'CPH01-ODE01'; status: 'DEGRADED' }; acmePath?: 'A' | 'B' };

export interface Step {
  id: string;
  chapter: Chapter;
  title: string;
  caption: Text;
  events: Event[];
}
```

- [ ] **Step 2: Write the failing catalog tests**

`tests/unit/catalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ALLOWED_WORK, KINDS, SIGNALS, kind } from '../../src/scenario/scenario.ts';

const consumersOf = (p: string) => KINDS.filter((k) => k.consumers.includes(p as never));
const producedBy = (p: string) => KINDS.filter((k) => k.producer === p);

describe('artifact catalog (brief 02, 03; checklist 07)', () => {
  it('has the 19 artifact kinds of brief 03, each once', () => {
    expect(KINDS).toHaveLength(19);
    expect(new Set(KINDS.map((k) => k.id)).size).toBe(19);
  });

  it('has no artifact between Orchestrator and The Network', () => {
    for (const k of KINDS) {
      expect(k.producer === 'orchestrator' && k.consumers.includes('network')).toBe(false);
      expect(k.producer === 'network' && k.consumers.includes('orchestrator')).toBe(false);
    }
  });

  it('lets only Executor write to The Network, and The Network send only raw signals to Collector', () => {
    expect(consumersOf('network').map((k) => [k.producer, k.id])).toEqual([
      ['executor', 'configChange'],
    ]);
    expect(producedBy('network').map((k) => [k.id, k.consumers])).toEqual([
      ['rawSignals', ['collector']],
    ]);
  });

  it('gives Executor only desired state from Intent, and has it produce only configuration changes', () => {
    expect(consumersOf('executor').map((k) => [k.producer, k.id])).toEqual([
      ['intent', 'desiredState'],
    ]);
    expect(producedBy('executor').map((k) => [k.id, k.consumers])).toEqual([
      ['configChange', ['network']],
    ]);
  });

  it('gives Collector only raw signals, and has it send enriched observations and observed state only', () => {
    expect(consumersOf('collector').map((k) => k.id)).toEqual(['rawSignals']);
    expect(
      producedBy('collector')
        .filter((k) => k.consumers.length > 0)
        .map((k) => [k.id, k.consumers]),
    ).toEqual([
      ['observedState', ['intent']],
      ['enriched', ['observability']],
    ]);
  });

  it('never hands Intent-produced content to Orchestrator', () => {
    const intent = producedBy('intent');
    expect(intent.map((k) => k.id).sort()).toEqual([
      'desiredState',
      'networkIntent',
      'serviceIntent',
      'sloDefinition',
    ]);
    for (const k of intent) expect(k.consumers).not.toContain('orchestrator');
  });

  it('sends the SLO definition only to Observability', () => {
    expect(kind('sloDefinition').consumers).toEqual(['observability']);
  });

  it('marks the service request as produced by the Portal', () => {
    expect(kind('serviceRequest').producerSurface).toBe('portal');
  });

  it('has every Orchestrator request declare what answers it', () => {
    for (const k of producedBy('orchestrator').filter((k) => k.consumers.length > 0)) {
      expect(k.answeredBy, k.id).toBeDefined();
    }
  });
});

describe('signal catalog (ADR 0001)', () => {
  it('pairs every request signal with its answer', () => {
    expect(SIGNALS.onboard.answeredBy).toBe('onboarded');
    expect(SIGNALS.apply.answeredBy).toBe('applied');
    expect(SIGNALS.readBack.answeredBy).toBe('readBackDone');
    expect(SIGNALS.checkDrift.answeredBy).toBe('inSync');
    expect(SIGNALS.queryAltPath.answeredBy).toBe('pathHealth');
  });

  it('names no specific path in the query', () => {
    expect(SIGNALS.queryAltPath.label).toBe('query alternate-path health');
  });
});

describe('work ownership (checklist 07)', () => {
  it('assigns each kind of work to its owner only', () => {
    expect(ALLOWED_WORK).toEqual({
      presentation: [],
      intent: ['record', 'derive', 'checkDrift'],
      orchestrator: ['startWorkflow', 'completeWorkflow', 'evaluatePolicy'],
      executor: ['render', 'apply'],
      collector: ['collect', 'normalize', 'enrich', 'readBack'],
      observability: [
        'configureSlo',
        'computeSli',
        'correlate',
        'evaluate',
        'raiseEvent',
        'clearEvent',
        'assessPath',
      ],
      network: [],
    });
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run tests/unit/catalog.test.ts`
Expected: FAIL, cannot resolve `../../src/scenario/scenario.ts`.

- [ ] **Step 4: Write the catalog part of `src/scenario/scenario.ts`**

```ts
import type {
  ArtifactKind,
  ArtifactVersion,
  Chapter,
  KindId,
  Party,
  ResponsibilityInfo,
  SignalId,
  SignalInfo,
  Step,
  Surface,
  WorkVerb,
  Text,
} from './types.ts';

const T = (simple: string, technical: string = simple): Text => ({ simple, technical });

export const TITLE = 'How Network Automation Works';
export const SCOPE_NOTE = 'Values illustrative · NAF does not require SR-MPLS, gNMI or TWAMP.';

/** Ground-truth text for The Network region; which entry applies comes from stateAt. */
export const NETWORK = {
  link: 'Link CPH01–ODE01',
  linkOk: T('OK', 'OK · Rx −2.4 dBm at CPH01 Hu0/0/0/1'),
  linkDegraded: T(
    'ODE01→CPH01 losing light',
    'ODE01→CPH01 attenuation · Rx −10.9 dBm at CPH01 Hu0/0/0/1 (warn −9.0)',
  ),
  device: T('Interface and routing: UP', 'CPH01 Hu0/0/0/1 · oper UP · IS-IS UP'),
  acme: {
    none: T('ACME: not provisioned yet'),
    A: T('ACME traffic: path A via ODE01', 'ACME (colour 100) · path A CPH01–ODE01–AAR01'),
    B: T('ACME traffic: path B via KOL01', 'ACME (colour 100) · path B CPH01–KOL01–AAR01'),
  },
};

export const CHAPTERS: Record<Chapter, string> = {
  provision: 'Provision',
  detect: 'Detect',
  remediate: 'Remediate',
};

export const RESPONSIBILITIES: Record<Party, ResponsibilityInfo> = {
  presentation: {
    id: 'presentation',
    name: 'Presentation',
    role: 'where people and systems interact with automation',
    does: [
      'Lets people and other systems request services and see their state: portal, fault management, ITSM, performance dashboards, APIs.',
      'Displays what it receives.',
    ],
    doesNot: ['Decide or act on its own.'],
  },
  intent: {
    id: 'intent',
    name: 'Intent',
    role: 'source of truth for intended state',
    does: [
      'Records service intent.',
      'Derives network intent and desired state.',
      'Checks drift between observed and desired state.',
    ],
    doesNot: ['Apply changes to devices.'],
  },
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'sequences workflows with signals',
    does: [
      'Coordinates workflows across responsibilities using signals, and waits for each job it starts to be answered.',
      'Relays requests to Intent.',
      'Its remediation workflow evaluates a pre-approved policy and produces the remediation decision.',
    ],
    doesNot: [
      'Configure the network.',
      'Own or read service intent, derived network intent or desired state.',
      'Carry other responsibilities’ content.',
    ],
  },
  executor: {
    id: 'executor',
    name: 'Executor',
    role: 'renders and applies configuration',
    does: [
      'Renders and applies configuration changes.',
      'Takes desired state directly from Intent (one common pattern, not a NAF requirement).',
    ],
    doesNot: ['Decide what the network should be.', 'Verify the outcome: a commit is not verification.'],
  },
  collector: {
    id: 'collector',
    name: 'Collector',
    role: 'gathers, normalizes and tags live state',
    does: [
      'Gathers and normalizes live network state.',
      'Tags it with link, path and service IDs from a locally cached copy of intent.',
      'Reads back applied state for drift checks.',
    ],
    doesNot: ['Interpret service impact.'],
  },
  observability: {
    id: 'observability',
    name: 'Observability',
    role: 'turns observations into service meaning',
    does: [
      'Turns SLO definitions into SLO rules.',
      'Computes SLIs, correlates observations and evaluates SLIs against SLOs.',
      'Raises and clears service-impact events.',
    ],
    doesNot: ['Change the network.'],
  },
  network: {
    id: 'network',
    name: 'The Network',
    role: 'infrastructure, not an automation responsibility',
    does: ['Carries traffic.', 'Only Executor writes to it; only Collector reads from it.'],
    doesNot: ['Take part in automation decisions.'],
  },
};

export const SURFACES: Record<Surface, string> = {
  faultMgmt: 'Fault Management',
  itsm: 'ITSM',
  portal: 'Portal',
  perfMgmt: 'Performance Management',
  api: 'API',
};

export const KINDS: ArtifactKind[] = [
  {
    id: 'serviceRequest',
    name: 'Service request',
    producer: 'presentation',
    producerSurface: 'portal',
    consumers: ['orchestrator'],
    whatItIs: 'A customer’s request for a service, made through the Portal.',
  },
  {
    id: 'intentRequest',
    name: 'Intent request',
    producer: 'orchestrator',
    consumers: ['intent'],
    answeredBy: 'desiredStateReady',
    whatItIs: 'Orchestrator’s own request asking Intent to create a service.',
  },
  {
    id: 'serviceIntent',
    name: 'Service intent',
    producer: 'intent',
    consumers: [],
    whatItIs: 'What the customer wants, in the customer’s terms, including the SLO.',
  },
  {
    id: 'networkIntent',
    name: 'Derived network intent',
    producer: 'intent',
    consumers: [],
    whatItIs: 'How the network should deliver the service: policies and paths.',
  },
  {
    id: 'desiredState',
    name: 'Desired network state',
    producer: 'intent',
    consumers: ['executor'],
    whatItIs: 'The per-device configuration intent derived from network intent.',
  },
  {
    id: 'sloDefinition',
    name: 'SLO definition',
    producer: 'intent',
    consumers: ['observability'],
    whatItIs: 'How the service is judged: the SLI definition and its objective.',
  },
  {
    id: 'sloRule',
    name: 'SLO rule',
    producer: 'observability',
    consumers: [],
    whatItIs: 'Observability’s own evaluation rule, created from the SLO definition.',
  },
  {
    id: 'workflow',
    name: 'Workflow record',
    producer: 'orchestrator',
    consumers: [],
    whatItIs: 'Orchestrator’s record of a running or completed workflow.',
  },
  {
    id: 'remediationDecision',
    name: 'Remediation decision',
    producer: 'orchestrator',
    consumers: ['intent'],
    answeredBy: 'desiredStateReady',
    whatItIs: 'An intent change request produced by the remediation workflow’s policy evaluation.',
  },
  {
    id: 'configChange',
    name: 'Configuration change',
    producer: 'executor',
    consumers: ['network'],
    whatItIs: 'Rendered configuration applied to devices.',
  },
  {
    id: 'rawSignals',
    name: 'Raw signals',
    producer: 'network',
    consumers: ['collector'],
    whatItIs: 'Measurements and configuration exactly as devices report them, each in its own format.',
  },
  {
    id: 'observedState',
    name: 'Observed device state',
    producer: 'collector',
    consumers: ['intent'],
    whatItIs: 'Applied configuration as read back from devices, for Intent’s drift check.',
  },
  {
    id: 'normalized',
    name: 'Normalized observations',
    producer: 'collector',
    consumers: [],
    whatItIs: 'Raw signals put into one common shape.',
  },
  {
    id: 'enriched',
    name: 'Enriched observations',
    producer: 'collector',
    consumers: ['observability'],
    whatItIs: 'Normalized observations tagged with link, path and service IDs.',
  },
  {
    id: 'sli',
    name: 'SLI',
    producer: 'observability',
    consumers: [],
    whatItIs: 'The service level indicator, computed from enriched observations.',
  },
  {
    id: 'evidence',
    name: 'Correlated evidence',
    producer: 'observability',
    consumers: [],
    whatItIs: 'Signals that line up in time and place: a strong clue, not proof.',
  },
  {
    id: 'serviceState',
    name: 'Service state',
    producer: 'observability',
    consumers: ['presentation', 'orchestrator'],
    whatItIs: 'Whether the service meets its objective, from the SLI and the SLO rule.',
  },
  {
    id: 'serviceEvent',
    name: 'Service-impact event',
    producer: 'observability',
    consumers: ['presentation', 'orchestrator'],
    whatItIs: 'A raised, cleared or follow-up event about impact on a service.',
  },
  {
    id: 'pathHealth',
    name: 'Path health',
    producer: 'observability',
    consumers: ['orchestrator'],
    whatItIs: 'Health of a path, assessed from link telemetry.',
  },
];

export const SIGNALS: Record<SignalId, SignalInfo> = {
  desiredStateReady: {
    id: 'desiredStateReady',
    label: 'desired state ready',
    asks: 'Tells Orchestrator that a desired-state version is ready, answering its request to Intent.',
  },
  onboard: {
    id: 'onboard',
    label: 'onboard service assurance',
    asks: 'Asks Observability to start assuring the service.',
    answeredBy: 'onboarded',
  },
  onboarded: {
    id: 'onboarded',
    label: 'assurance onboarded',
    asks: 'Tells Orchestrator that assurance is ready.',
  },
  apply: {
    id: 'apply',
    label: 'apply desired state',
    asks: 'Asks Executor to apply a named desired-state version, taken directly from Intent.',
    answeredBy: 'applied',
  },
  applied: {
    id: 'applied',
    label: 'applied',
    asks: 'Tells Orchestrator the commit succeeded. That is not verification.',
  },
  readBack: {
    id: 'readBack',
    label: 'read back applied state',
    asks: 'Asks Collector to read back applied configuration and hand it to Intent.',
    answeredBy: 'readBackDone',
  },
  readBackDone: {
    id: 'readBackDone',
    label: 'read back done',
    asks: 'Tells Orchestrator the observed state has been handed to Intent.',
  },
  checkDrift: {
    id: 'checkDrift',
    label: 'check drift',
    asks: 'Asks Intent to compare observed state with desired state.',
    answeredBy: 'inSync',
  },
  inSync: {
    id: 'inSync',
    label: 'in sync',
    asks: 'Tells Orchestrator the observed state matches the desired state.',
  },
  queryAltPath: {
    id: 'queryAltPath',
    label: 'query alternate-path health',
    asks: 'Asks Observability how healthy the service’s alternate path is.',
    answeredBy: 'pathHealth',
  },
};

export const ALLOWED_WORK: Record<Party, WorkVerb[]> = {
  presentation: [],
  intent: ['record', 'derive', 'checkDrift'],
  orchestrator: ['startWorkflow', 'completeWorkflow', 'evaluatePolicy'],
  executor: ['render', 'apply'],
  collector: ['collect', 'normalize', 'enrich', 'readBack'],
  observability: [
    'configureSlo',
    'computeSli',
    'correlate',
    'evaluate',
    'raiseEvent',
    'clearEvent',
    'assessPath',
  ],
  network: [],
};

// Filled in Task 4.
export const VERSIONS: ArtifactVersion[] = [];
export const STEPS: Step[] = [];

const kindById = new Map(KINDS.map((k) => [k.id, k]));
const versionById = new Map(VERSIONS.map((v) => [v.id, v]));

export function kind(id: KindId): ArtifactKind {
  const k = kindById.get(id);
  if (!k) throw new Error(`Unknown artifact kind: ${id}`);
  return k;
}

export function version(id: string): ArtifactVersion {
  const v = versionById.get(id);
  if (!v) throw new Error(`Unknown artifact version: ${id}`);
  return v;
}

export function producerOf(versionId: string): Party {
  return kind(version(versionId).kind).producer;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/catalog.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 6: Mutation check (lesson 25)**

Temporarily change `desiredState`'s `consumers` to `['executor', 'orchestrator']`. Run `npx vitest run tests/unit/catalog.test.ts`. Expected: "never hands Intent-produced content to Orchestrator" FAILS. Revert the change and re-run. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/scenario tests/unit/catalog.test.ts
git commit -m "feat: scenario types and catalogs with semantic catalog tests"
```

---

### Task 3: State fold (`stateAt`) and current exchanges (`linesOf`)

**Model:** sonnet

**Files:**
- Create: `src/model/state.ts`
- Test: `tests/unit/state.test.ts`

**Interfaces:**
- Consumes: `ArtifactVersion`, `Event`, `KindId`, `Marker`, `Party`, `Step`, `Surface`, `Text` from `types.ts`; `STEPS`, `VERSIONS`, `kind` from `scenario.ts`.
- Produces:

```ts
export interface Slot {
  kind: KindId;
  versions: string[];                         // in order of appearance; the last one is the card
}
export interface StageState {
  visible: string[];                          // version ids, in order of appearance
  newIds: string[];                           // versions that appear in this step
  markers: Record<string, Marker>;            // latest marker per version
  surfaces: Partial<Record<Surface, string>>; // latest version each surface has received
  slots: Partial<Record<Party, Slot[]>>;      // one slot per kind, per producer, in order of first appearance
  linkDegraded: boolean;                      // ground truth for CPH01–ODE01
  acmePath: 'A' | 'B' | null;                 // null before the first apply
  work: Partial<Record<Party, Text[]>>;       // work labels in this step
}
export type Line = Extract<Event, { t: 'signal' | 'handoff' | 'work' }>;
export function stateAt(n: number, steps?: readonly Step[], versions?: readonly ArtifactVersion[]): StageState;
export function linesOf(n: number, steps?: readonly Step[]): Line[];
```

`versions` defaults to `VERSIONS`. The tests pass their own, because `VERSIONS` stays empty until Task 4.

- [ ] **Step 1: Write the failing tests**

`tests/unit/state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { linesOf, stateAt } from '../../src/model/state.ts';
import type { ArtifactVersion, KindId, Step } from '../../src/scenario/types.ts';

const T = (s: string) => ({ simple: s, technical: s });
const v = (id: string, kind: KindId): ArtifactVersion => ({
  id,
  kind,
  label: id,
  lineage: [],
  meaning: id,
  technical: [id],
});
const versions = [v('a', 'serviceState'), v('b', 'serviceRequest'), v('c', 'serviceState')];
const fixture: Step[] = [
  {
    id: 'X1',
    chapter: 'provision',
    title: 'one',
    caption: T('one'),
    events: [
      { t: 'appear', version: 'a' },
      { t: 'handoff', version: 'a', from: 'observability', to: 'presentation', surface: 'portal' },
      { t: 'work', owner: 'observability', verb: 'evaluate', label: T('evaluate') },
    ],
  },
  {
    id: 'X2',
    chapter: 'provision',
    title: 'two',
    caption: T('two'),
    events: [
      { t: 'appear', version: 'b' },
      { t: 'mark', version: 'a', marker: 'IN_SYNC' },
      { t: 'network', acmePath: 'A' },
      { t: 'network', link: { id: 'CPH01-ODE01', status: 'DEGRADED' } },
      { t: 'handoff', version: 'b', from: 'presentation', to: 'orchestrator', surface: 'portal' },
      { t: 'signal', signal: 'apply', from: 'orchestrator', to: 'executor', version: 'a' },
      { t: 'appear', version: 'c' },
    ],
  },
];
const at = (n: number) => stateAt(n, fixture, versions);

describe('stateAt', () => {
  it('starts empty before anything happens', () => {
    expect(stateAt(0, [{ ...fixture[0]!, events: [] }], versions)).toEqual({
      visible: [],
      newIds: [],
      markers: {},
      surfaces: {},
      slots: {},
      linkDegraded: false,
      acmePath: null,
      work: {},
    });
  });

  it('accumulates visible versions and flags only this step’s as new', () => {
    expect(at(0).newIds).toEqual(['a']);
    expect(at(1).visible).toEqual(['a', 'b', 'c']);
    expect(at(1).newIds).toEqual(['b', 'c']);
  });

  it('records what each surface received, ignoring what it sent', () => {
    expect(at(1).surfaces).toEqual({ portal: 'a' });
  });

  it('groups versions into one slot per kind with their producer, newest last', () => {
    expect(at(1).slots).toEqual({
      observability: [{ kind: 'serviceState', versions: ['a', 'c'] }],
      presentation: [{ kind: 'serviceRequest', versions: ['b'] }],
    });
  });

  it('keeps markers and network ground truth', () => {
    const s = at(1);
    expect(s.markers).toEqual({ a: 'IN_SYNC' });
    expect(s.acmePath).toBe('A');
    expect(s.linkDegraded).toBe(true);
  });

  it('reports work for the current step only', () => {
    expect(at(0).work).toEqual({ observability: [T('evaluate')] });
    expect(at(1).work).toEqual({});
  });
});

describe('linesOf', () => {
  it('lists the current step’s signals, handoffs and work in causal order', () => {
    expect(linesOf(0, fixture).map((e) => e.t)).toEqual(['handoff', 'work']);
    expect(linesOf(1, fixture)).toEqual([
      { t: 'handoff', version: 'b', from: 'presentation', to: 'orchestrator', surface: 'portal' },
      { t: 'signal', signal: 'apply', from: 'orchestrator', to: 'executor', version: 'a' },
    ]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/state.test.ts`
Expected: FAIL, cannot resolve `../../src/model/state.ts`.

- [ ] **Step 3: Implement `src/model/state.ts`**

```ts
import { STEPS, VERSIONS, kind } from '../scenario/scenario.ts';
import type {
  ArtifactVersion,
  Event,
  KindId,
  Marker,
  Party,
  Step,
  Surface,
  Text,
} from '../scenario/types.ts';

export interface Slot {
  kind: KindId;
  versions: string[];
}

export interface StageState {
  visible: string[];
  newIds: string[];
  markers: Record<string, Marker>;
  surfaces: Partial<Record<Surface, string>>;
  slots: Partial<Record<Party, Slot[]>>;
  linkDegraded: boolean;
  acmePath: 'A' | 'B' | null;
  work: Partial<Record<Party, Text[]>>;
}

export type Line = Extract<Event, { t: 'signal' | 'handoff' | 'work' }>;

/** The end state of step n: everything that has happened in steps 0..n. */
export function stateAt(
  n: number,
  steps: readonly Step[] = STEPS,
  versions: readonly ArtifactVersion[] = VERSIONS,
): StageState {
  const kindOf = new Map(versions.map((v) => [v.id, v.kind]));
  const s: StageState = {
    visible: [],
    newIds: [],
    markers: {},
    surfaces: {},
    slots: {},
    linkDegraded: false,
    acmePath: null,
    work: {},
  };
  steps.slice(0, n + 1).forEach((step, i) => {
    const current = i === n;
    for (const e of step.events) {
      switch (e.t) {
        case 'appear': {
          s.visible.push(e.version);
          if (current) s.newIds.push(e.version);
          const k = kindOf.get(e.version);
          if (!k) throw new Error(`Unknown artifact version: ${e.version}`);
          const slots = (s.slots[kind(k).producer] ??= []);
          const slot = slots.find((x) => x.kind === k);
          if (slot) slot.versions.push(e.version);
          else slots.push({ kind: k, versions: [e.version] });
          break;
        }
        case 'mark':
          s.markers[e.version] = e.marker;
          break;
        case 'handoff':
          if (e.to === 'presentation' && e.surface) s.surfaces[e.surface] = e.version;
          break;
        case 'network':
          if (e.link) s.linkDegraded = true;
          if (e.acmePath) s.acmePath = e.acmePath;
          break;
        case 'work':
          if (current) (s.work[e.owner] ??= []).push(e.label);
          break;
        case 'signal':
          break;
      }
    }
  });
  return s;
}

/** Spec §4.2: the current step's handoffs, signals and work, in causal order. */
export function linesOf(n: number, steps: readonly Step[] = STEPS): Line[] {
  return (steps[n]?.events ?? []).filter(
    (e): e is Line => e.t === 'signal' || e.t === 'handoff' || e.t === 'work',
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/state.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/model/state.ts tests/unit/state.test.ts
git commit -m "feat: stateAt folds step events into the stage state; linesOf lists current exchanges"
```

---

### Task 4: The ACME story as data, with the full semantic suite

**Model:** opus (when a semantic test fails, deciding whether the data or the test is wrong needs judgement against the brief)

**Files:**
- Modify: `src/scenario/scenario.ts` (replace the `VERSIONS` and `STEPS` placeholders from Task 2)
- Create: `tests/unit/pairing.ts`
- Test: `tests/unit/pairing.test.ts`, `tests/unit/story.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–3.
- Produces: `VERSIONS` (38 versions) and `STEPS` (36 steps: `P1`–`P14`, `D1`–`D8`, `R1`–`R14`), matching spec §5 event for event. Signal `version` fields hold desired-state version ids (`'ds1'`, `'ds2'`). `pairingErrors(steps: readonly Step[]): string[]` in `tests/unit/pairing.ts`.

- [ ] **Step 1: Write the request/answer checker and its tests (ADR 0001)**

The old check only compared answer names. This one also checks that the answer comes from the party that was asked, and is for the same desired-state version when the request names one. It reports wrong, duplicate, unsolicited and missing answers.

`tests/unit/pairing.ts`:

```ts
import { KINDS, SIGNALS, kind, version } from '../../src/scenario/scenario.ts';
import type { Event, Party, Step } from '../../src/scenario/types.ts';

interface Exchange {
  answer: string; // a signal id or an artifact kind id
  from: Party;
  version?: string;
}

const ANSWERS = new Set<string>([
  ...Object.values(SIGNALS).flatMap((s) => (s.answeredBy ? [s.answeredBy] : [])),
  ...KINDS.flatMap((k) => (k.answeredBy ? [k.answeredBy] : [])),
]);

function requestIn(e: Event): Exchange | undefined {
  if (e.t === 'signal' && e.from === 'orchestrator') {
    const answer = SIGNALS[e.signal].answeredBy;
    return answer ? { answer, from: e.to, version: e.version } : undefined;
  }
  if (e.t === 'handoff' && e.from === 'orchestrator') {
    const answer = kind(version(e.version).kind).answeredBy;
    return answer ? { answer, from: e.to } : undefined;
  }
  return undefined;
}

function answerIn(e: Event): Exchange | undefined {
  if (e.t === 'signal' && e.to === 'orchestrator' && ANSWERS.has(e.signal)) {
    return { answer: e.signal, from: e.from, version: e.version };
  }
  if (e.t === 'handoff' && e.to === 'orchestrator' && ANSWERS.has(version(e.version).kind)) {
    return { answer: version(e.version).kind, from: e.from };
  }
  return undefined;
}

const show = (x: Exchange) => `${x.answer} from ${x.from}${x.version ? ` for ${x.version}` : ''}`;

/** ADR 0001: every Orchestrator request is answered by the party it asked, for the same version, before the next request. */
export function pairingErrors(steps: readonly Step[]): string[] {
  const errors: string[] = [];
  let pending: Exchange | null = null;
  for (const step of steps) {
    for (const e of step.events) {
      const got = answerIn(e);
      if (got) {
        if (!pending) errors.push(`${step.id}: unsolicited ${show(got)}`);
        else if (
          got.answer !== pending.answer ||
          got.from !== pending.from ||
          (pending.version !== undefined && got.version !== pending.version)
        )
          errors.push(`${step.id}: expected ${show(pending)}, got ${show(got)}`);
        else pending = null;
      }
      const asked = requestIn(e);
      if (asked) {
        if (pending) errors.push(`${step.id}: new request while waiting for ${show(pending)}`);
        pending = asked;
      }
    }
  }
  if (pending) errors.push(`end: missing ${show(pending)}`);
  return errors;
}
```

`tests/unit/pairing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Event, Party, SignalId, Step } from '../../src/scenario/types.ts';
import { pairingErrors } from './pairing.ts';

const sig = (signal: SignalId, from: Party, to: Party, version?: string): Event =>
  version ? { t: 'signal', signal, from, to, version } : { t: 'signal', signal, from, to };
const story = (...events: Event[]): Step[] => [
  { id: 'S1', chapter: 'provision', title: 's', caption: { simple: 's', technical: 's' }, events },
];
const apply = sig('apply', 'orchestrator', 'executor', 'ds1');

describe('pairingErrors', () => {
  it('accepts a request answered by the party asked, for the same version', () => {
    expect(pairingErrors(story(apply, sig('applied', 'executor', 'orchestrator', 'ds1')))).toEqual([]);
  });

  it('rejects an answer from the wrong party', () => {
    expect(pairingErrors(story(apply, sig('applied', 'collector', 'orchestrator', 'ds1')))).toHaveLength(2);
  });

  it('rejects an answer for the wrong version', () => {
    expect(pairingErrors(story(apply, sig('applied', 'executor', 'orchestrator', 'ds2')))).toHaveLength(2);
  });

  it('rejects the wrong answer', () => {
    expect(pairingErrors(story(apply, sig('inSync', 'executor', 'orchestrator', 'ds1')))).toHaveLength(2);
  });

  it('rejects a duplicate answer', () => {
    const applied = sig('applied', 'executor', 'orchestrator', 'ds1');
    expect(pairingErrors(story(apply, applied, applied))).toEqual([
      'S1: unsolicited applied from executor for ds1',
    ]);
  });

  it('rejects an unsolicited answer', () => {
    expect(pairingErrors(story(sig('readBackDone', 'collector', 'orchestrator')))).toEqual([
      'S1: unsolicited readBackDone from collector',
    ]);
  });

  it('rejects a missing answer, before the next request and at the end', () => {
    expect(pairingErrors(story(apply, sig('readBack', 'orchestrator', 'collector')))).toEqual([
      'S1: new request while waiting for applied from executor for ds1',
      'end: missing readBackDone from collector',
    ]);
  });
});
```

Run: `npx vitest run tests/unit/pairing.test.ts`
Expected: PASS (7 tests). The checker only uses the catalogs from Task 2, so it works before the story exists. (It is test code; this step is the check's own test.)

- [ ] **Step 2: Write the failing semantic suite**

`tests/unit/story.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { stateAt } from '../../src/model/state.ts';
import {
  ALLOWED_WORK,
  NETWORK,
  SIGNALS,
  STEPS,
  VERSIONS,
  kind,
  producerOf,
  version,
} from '../../src/scenario/scenario.ts';
import type { Event, KindId } from '../../src/scenario/types.ts';
import { pairingErrors } from './pairing.ts';

type At = { si: number; ei: number };
type Flat<E extends Event = Event> = At & { e: E };
const flat: Flat[] = STEPS.flatMap((s, si) => s.events.map((e, ei) => ({ e, si, ei })));
const of = <T extends Event['t']>(t: T) =>
  flat.filter((f): f is Flat<Extract<Event, { t: T }>> => f.e.t === t);
const before = (a: At, b: At) => a.si < b.si || (a.si === b.si && a.ei < b.ei);
const stepIndex = (id: string) => STEPS.findIndex((s) => s.id === id);
const appearAt = (v: string) => {
  const f = of('appear').find((x) => x.e.version === v);
  if (!f) throw new Error(`${v} never appears`);
  return f;
};
const last = STEPS.length - 1;
const textOf = (id: string) => {
  const v = version(id);
  return [v.label, v.meaning, ...v.technical].join(' ');
};

describe('story shape', () => {
  it('has the 36 beats of spec §5 in order', () => {
    const ids = [
      ...Array.from({ length: 14 }, (_, i) => `P${i + 1}`),
      ...Array.from({ length: 8 }, (_, i) => `D${i + 1}`),
      ...Array.from({ length: 14 }, (_, i) => `R${i + 1}`),
    ];
    expect(STEPS.map((s) => s.id)).toEqual(ids);
    const chapter = { P: 'provision', D: 'detect', R: 'remediate' } as const;
    for (const s of STEPS) expect(s.chapter).toBe(chapter[s.id[0] as 'P' | 'D' | 'R']);
  });

  it('gives every step a title and non-empty Simple and Technical captions', () => {
    for (const s of STEPS) {
      expect(s.title.trim(), s.id).not.toBe('');
      expect(s.caption.simple.trim(), s.id).not.toBe('');
      expect(s.caption.technical.trim(), s.id).not.toBe('');
    }
  });

  it('gives every artifact a meaning and 1–4 Technical lines', () => {
    for (const v of VERSIONS) {
      expect(v.meaning.trim(), v.id).not.toBe('');
      expect(v.technical.length, v.id).toBeGreaterThanOrEqual(1);
      expect(v.technical.length, v.id).toBeLessThanOrEqual(4);
      for (const line of v.technical) expect(line.trim(), v.id).not.toBe('');
    }
  });

  it('says "not proof" at the correlation step in both views', () => {
    const f = of('work').find((x) => x.e.verb === 'correlate')!;
    const s = STEPS[f.si]!;
    expect(s.caption.simple).toMatch(/not proof/i);
    expect(s.caption.technical).toMatch(/not proof/i);
  });
});

describe('artifact lifecycle', () => {
  it('makes every version new in exactly one step', () => {
    const ids = of('appear').map((f) => f.e.version);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice().sort()).toEqual(VERSIONS.map((v) => v.id).sort());
  });

  it('lets lineage point only to earlier or same-step earlier artifacts', () => {
    for (const v of VERSIONS) {
      const own = appearAt(v.id);
      for (const parent of v.lineage) expect(before(appearAt(parent), own), `${v.id} ← ${parent}`).toBe(true);
    }
  });

  it('keeps every artifact visible once it has appeared', () => {
    for (let n = 0; n < last; n++) {
      const next = new Set(stateAt(n + 1).visible);
      for (const id of stateAt(n).visible) expect(next.has(id), `${id} at ${STEPS[n + 1]!.id}`).toBe(true);
    }
  });

  it('marks only artifacts that are already visible', () => {
    for (const f of of('mark')) expect(before(appearAt(f.e.version), f)).toBe(true);
  });
});

describe('lineage (spec §5 key lineage)', () => {
  // What each kind must be derived from. Telemetry has no inputs; a read-back derives from the change it reads.
  const REQUIRED: Partial<Record<KindId, KindId[]>> = {
    intentRequest: ['serviceRequest'],
    serviceIntent: ['intentRequest'],
    networkIntent: ['serviceIntent'],
    desiredState: ['networkIntent'],
    sloDefinition: ['serviceIntent'],
    sloRule: ['sloDefinition'],
    configChange: ['desiredState'],
    observedState: ['rawSignals'],
    normalized: ['rawSignals'],
    enriched: ['normalized'],
    sli: ['enriched'],
    evidence: ['sli', 'enriched'],
    serviceState: ['sli', 'sloRule'],
    pathHealth: ['enriched'],
    remediationDecision: ['serviceEvent', 'pathHealth'],
  };

  it('derives every version from the inputs its kind requires', () => {
    for (const v of VERSIONS) {
      const kinds = v.lineage.map((id) => version(id).kind);
      for (const k of REQUIRED[v.kind] ?? []) expect(kinds, `${v.id} needs ${k}`).toContain(k);
    }
  });

  it('derives every version from the newest input of each kind available at the time', () => {
    for (const v of VERSIONS) {
      const own = appearAt(v.id);
      for (const parent of v.lineage) {
        const newer = of('appear').filter(
          (f) =>
            version(f.e.version).kind === version(parent).kind &&
            before(appearAt(parent), f) &&
            before(f, own),
        );
        expect(newer.map((f) => f.e.version), `${v.id} ← stale ${parent}`).toEqual([]);
      }
    }
  });

  it('links the events, decision and network intent v2 to what caused them', () => {
    const has = (id: string, parents: string[]) => expect(version(id).lineage, id).toEqual(expect.arrayContaining(parents));
    has('ev-viol', ['ss2', 'evid']);
    has('ev-clear', ['ev-viol', 'ss3']);
    has('ev-repair', ['evid', 'enr-after']);
    has('dec', ['ev-viol', 'pathB']);
    has('ni2', ['dec', 'si']);
    has('wf-prov', ['sr']);
    has('wf-rem', ['ev-viol']);
    expect(version('ss2').status).toBe('DEGRADED');
  });
});

describe('handoffs and signals (brief 02; checklist 07)', () => {
  it('gives every coordination signal Orchestrator as exactly one endpoint, never The Network', () => {
    for (const { e } of of('signal')) {
      expect([e.from, e.to].filter((p) => p === 'orchestrator'), e.signal).toHaveLength(1);
      expect([e.from, e.to], e.signal).not.toContain('network');
    }
  });

  it('sends each handoff from its producer to a declared consumer, after it has appeared', () => {
    for (const f of of('handoff')) {
      const k = kind(version(f.e.version).kind);
      expect(f.e.from, f.e.version).toBe(k.producer);
      expect(k.consumers, f.e.version).toContain(f.e.to);
      expect(before(appearAt(f.e.version), f), f.e.version).toBe(true);
    }
  });

  it('has every signal version name a desired-state version that already exists', () => {
    for (const f of of('signal')) {
      if (f.e.version === undefined) continue;
      expect(version(f.e.version).kind, f.e.signal).toBe('desiredState');
      expect(before(appearAt(f.e.version), f), `${f.e.signal} ${f.e.version}`).toBe(true);
    }
  });

  it('never moves an artifact version across the same boundary twice', () => {
    const keys = of('handoff').map((f) => `${f.e.version}>${f.e.to}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('never hands Intent content to Orchestrator', () => {
    for (const f of of('handoff')) {
      if (producerOf(f.e.version) === 'intent') expect(f.e.to, f.e.version).not.toBe('orchestrator');
    }
  });

  it('sends the SLO definition only Intent → Observability, directly', () => {
    const slo = of('handoff').filter((f) => version(f.e.version).kind === 'sloDefinition');
    expect(slo.map((f) => [f.e.from, f.e.to])).toEqual([['intent', 'observability']]);
  });

  it('names exactly one surface on every Presentation handoff, and routes each to the right one', () => {
    for (const { e } of of('handoff')) {
      const touches = e.from === 'presentation' || e.to === 'presentation';
      expect(Boolean(e.surface), e.version).toBe(touches);
    }
    const route = (v: string) =>
      of('handoff')
        .filter((f) => f.e.version === v && (f.e.to === 'presentation' || f.e.from === 'presentation'))
        .map((f) => f.e.surface);
    expect(route('sr')).toEqual(['portal']);
    expect(route('ev-viol')).toEqual(['faultMgmt']);
    expect(route('ev-clear')).toEqual(['faultMgmt']);
    expect(route('ev-repair')).toEqual(['itsm']);
    for (const v of ['ss1', 'ss2', 'ss3']) expect(route(v)).toEqual(['portal']);
  });

  it('has every piece of work done by its owner', () => {
    for (const { e } of of('work')) expect(ALLOWED_WORK[e.owner], `${e.owner} ${e.verb}`).toContain(e.verb);
  });
});

describe('pacing and causal order (brief 03)', () => {
  it('adds at most one new artifact per responsibility per step', () => {
    for (const s of STEPS) {
      const producers = s.events.flatMap((e) => (e.t === 'appear' ? [producerOf(e.version)] : []));
      expect(new Set(producers).size, s.id).toBe(producers.length);
    }
  });

  it('shows an artifact only after every signal and handoff addressed to its producer in that step', () => {
    for (const s of STEPS) {
      s.events.forEach((e, i) => {
        if (e.t !== 'appear') return;
        const p = producerOf(e.version);
        const later = s.events
          .slice(i + 1)
          .filter((x) => (x.t === 'signal' || x.t === 'handoff') && x.to === p);
        expect(later, `${s.id}: ${e.version}`).toEqual([]);
      });
    }
  });

  it('shows network artifacts just before their own handoff', () => {
    for (const f of of('appear')) {
      if (producerOf(f.e.version) !== 'network') continue;
      expect(STEPS[f.si]!.events[f.ei + 1]).toMatchObject({
        t: 'handoff',
        version: f.e.version,
        from: 'network',
      });
    }
  });
});

describe('workflow control (ADR 0001)', () => {
  const applies = of('signal').filter((f) => f.e.signal === 'apply');
  const isSignal = (e: Event | undefined, signal: string, from: string, to: string, v?: string) =>
    expect(e).toEqual(v ? { t: 'signal', signal, from, to, version: v } : { t: 'signal', signal, from, to });

  it('applies, reads back and checks drift for one and the same version', () => {
    expect(applies).toHaveLength(2);
    for (const { e, si } of applies) {
      const d = e.version!;
      expect(version(d).kind).toBe('desiredState');
      const [applyStep, readStep, driftStep] = [STEPS[si]!, STEPS[si + 1]!, STEPS[si + 2]!];

      // Apply: Executor takes this version from Intent, and the change it makes derives from it.
      expect(applyStep.events).toContainEqual({ t: 'handoff', version: d, from: 'intent', to: 'executor' });
      const change = of('appear').find((f) => f.si === si && version(f.e.version).kind === 'configChange')!.e.version;
      expect(version(change).lineage).toEqual([d]);
      isSignal(applyStep.events.at(-1), 'applied', 'executor', 'orchestrator', d);

      // Read back: the observed state handed to Intent is a read-back of that change.
      isSignal(readStep.events[0], 'readBack', 'orchestrator', 'collector');
      const observed = of('handoff').find(
        (f) => f.si === si + 1 && f.e.to === 'intent' && version(f.e.version).kind === 'observedState',
      );
      expect(observed, readStep.id).toBeDefined();
      const readBack = version(observed!.e.version).lineage[0]!;
      expect(version(readBack).lineage, readStep.id).toEqual([change]);
      isSignal(readStep.events.at(-1), 'readBackDone', 'collector', 'orchestrator');

      // Check drift: the same desired-state version is compared and marked in sync.
      isSignal(driftStep.events[0], 'checkDrift', 'orchestrator', 'intent', d);
      expect(driftStep.events).toContainEqual({ t: 'mark', version: d, marker: 'IN_SYNC' });
      isSignal(driftStep.events.at(-1), 'inSync', 'intent', 'orchestrator', d);
    }
  });

  it('applies only after desired state ready for that version, and first after assurance is onboarded', () => {
    for (const a of applies) {
      const ready = of('signal').find((f) => f.e.signal === 'desiredStateReady' && f.e.version === a.e.version);
      expect(ready && before(ready, a), a.e.version).toBe(true);
    }
    const onboarded = of('signal').find((f) => f.e.signal === 'onboarded');
    expect(onboarded && before(onboarded, applies[0]!)).toBe(true);
  });

  it('declares an answer for every Orchestrator request signal', () => {
    for (const { e } of of('signal')) {
      if (e.from === 'orchestrator') expect(SIGNALS[e.signal].answeredBy, e.signal).toBeDefined();
    }
  });

  it('answers every Orchestrator request, from the party asked and for the same version, before the next one', () => {
    expect(pairingErrors(STEPS)).toEqual([]);
  });

  it('completes each workflow only after its drift check passed and a later HEALTHY service state reached Orchestrator', () => {
    const starts = of('work').filter((f) => f.e.verb === 'startWorkflow');
    const ends = of('work').filter((f) => f.e.verb === 'completeWorkflow');
    expect(starts).toHaveLength(2);
    expect(ends).toHaveLength(2);
    ends.forEach((end, i) => {
      const inside = (f: At) => before(starts[i]!, f) && before(f, end);
      const lastApply = applies.filter(inside).at(-1);
      const inSync = of('signal').filter((f) => f.e.signal === 'inSync' && inside(f)).at(-1);
      expect(lastApply && inSync, STEPS[end.si]!.id).toBeTruthy();
      expect(inSync!.e.version).toBe(lastApply!.e.version);
      const healthy = of('handoff').filter(
        (f) =>
          inside(f) &&
          f.e.to === 'orchestrator' &&
          version(f.e.version).kind === 'serviceState' &&
          version(f.e.version).status === 'HEALTHY',
      );
      expect(healthy, STEPS[end.si]!.id).toHaveLength(1);
      // Service verification follows configuration verification: the state was computed after in sync.
      expect(before(inSync!, appearAt(healthy[0]!.e.version))).toBe(true);
    });
  });

  it('has Orchestrator name only paths Observability told it, and the decision name none', () => {
    const PATH = /\bpath [AB]\b|CPH01–(?:ODE|KOL)01–AAR01/;
    const PATHS = new RegExp(PATH, 'g'); // for match(); toMatch() needs the non-global form
    const told = new Set<string>();
    for (const { e } of flat) {
      if (e.t === 'handoff' && e.to === 'orchestrator' && e.from === 'observability') {
        for (const m of textOf(e.version).match(PATHS) ?? []) told.add(m);
      }
      if (e.t === 'appear' && producerOf(e.version) === 'orchestrator') {
        for (const m of textOf(e.version).match(PATHS) ?? []) expect(told, `${e.version} names ${m}`).toContain(m);
      }
      if (e.t === 'signal' && e.from === 'orchestrator') expect(SIGNALS[e.signal].label).not.toMatch(PATH);
    }
    expect(SIGNALS.queryAltPath.label).toBe('query alternate-path health');
    expect(textOf('dec')).not.toMatch(PATH);
  });
});

describe('intent versions (checklist 07)', () => {
  it('has exactly one service intent, marked UNCHANGED during remediation and kept to the end', () => {
    expect(VERSIONS.filter((v) => v.kind === 'serviceIntent').map((v) => v.id)).toEqual(['si']);
    const m = of('mark').find((f) => f.e.version === 'si')!;
    expect(m.e.marker).toBe('UNCHANGED');
    expect(STEPS[m.si]!.chapter).toBe('remediate');
    expect(stateAt(last).markers.si).toBe('UNCHANGED');
    expect(stateAt(last).visible).toContain('si');
  });

  it('shows v2 only in Remediate, and network intent v2 only after the decision reaches Intent', () => {
    for (const id of ['ni2', 'ds2', 'cc2', 'obs2']) expect(STEPS[appearAt(id).si]!.chapter, id).toBe('remediate');
    const decision = of('handoff').find((f) => f.e.version === 'dec' && f.e.to === 'intent')!;
    expect(before(decision, appearAt('ni2'))).toBe(true);
  });
});

describe('network ground truth (checklist 07)', () => {
  it('keeps the link OK before the fault and DEGRADED from the fault on', () => {
    const fault = stepIndex('D1');
    for (let n = 0; n <= last; n++) expect(stateAt(n).linkDegraded, STEPS[n]!.id).toBe(n >= fault);
  });

  it('puts ACME on path A from provisioning until the reroute, and on path B after it', () => {
    const [apply1, reroute] = [stepIndex('P7'), stepIndex('R6')];
    for (let n = 0; n <= last; n++) {
      const expected = n < apply1 ? null : n < reroute ? 'A' : 'B';
      expect(stateAt(n).acmePath, STEPS[n]!.id).toBe(expected);
    }
  });

  it('reports interface and IS-IS UP in every telemetry sample and in the network text', () => {
    for (const id of ['raw-base', 'raw-deg', 'raw-after']) {
      const text = version(id).technical.join(' ');
      expect(text, id).toMatch(/oper UP/);
      expect(text, id).toMatch(/IS-IS UP/);
    }
    expect(NETWORK.device.technical).toMatch(/oper UP · IS-IS UP/);
  });

  it('enriches from the cached intent that matches the network intent in force', () => {
    for (const v of VERSIONS.filter((x) => x.kind === 'enriched')) {
      const n = appearAt(v.id).si;
      const text = v.technical.join(' ');
      // ACME is tagged to the path it is actually on…
      const tagged = [...text.matchAll(/path ([AB]) → ACME/g)].map((m) => m[1]);
      expect(tagged.length, v.id).toBeGreaterThan(0);
      for (const p of tagged) expect(p, v.id).toBe(stateAt(n).acmePath);
      // …using the newest network intent version, so the cache was current.
      const latest = stateAt(n).visible.filter((id) => version(id).kind === 'networkIntent').at(-1)!;
      expect(text, v.id).toContain(`cached intent (network intent ${version(latest).label})`);
    }
  });

  it('supports path B health with fresh link measurements, and claims link health, not service health', () => {
    const health = version('pathB');
    const source = version(health.lineage[0]!);
    expect(source.technical.join(' ')).toMatch(/→ path B/);
    const raw = version(version(source.lineage[0]!).lineage[0]!);
    expect(raw.technical.join(' ')).toMatch(/other links: Rx −2\.1 to −2\.6 dBm, CRC 0/);
    expect(health.technical.join(' ')).toMatch(/10:45–10:46/);
    expect(health.technical.join(' ')).toMatch(/link telemetry only/);
    const r2 = STEPS[appearAt('pathB').si]!;
    expect(r2.caption.simple).toMatch(/not yet/i);
    expect(r2.caption.technical).toMatch(/link health, not service health/);
  });
});

describe('status semantics (checklist 07)', () => {
  it('moves service state HEALTHY → DEGRADED → HEALTHY', () => {
    const states = of('appear')
      .map((f) => version(f.e.version))
      .filter((v) => v.kind === 'serviceState')
      .map((v) => v.status);
    expect(states).toEqual(['HEALTHY', 'DEGRADED', 'HEALTHY']);
  });

  it('has path B HEALTHY, only the loss violation VIOLATED, and the cleared event CLEARED', () => {
    for (const v of VERSIONS.filter((x) => x.kind === 'pathHealth')) expect(v.status).toBe('HEALTHY');
    expect(VERSIONS.filter((v) => v.status === 'VIOLATED').map((v) => v.id)).toEqual(['ev-viol']);
    expect(version('ev-clear').status).toBe('CLEARED');
  });

  it('gives evidence, the repair event, Collector and Network artifacts no status', () => {
    const none = VERSIONS.filter(
      (v) => v.kind === 'evidence' || v.id === 'ev-repair' || ['collector', 'network'].includes(producerOf(v.id)),
    );
    expect(none.length).toBeGreaterThan(0);
    for (const v of none) expect(v.status, v.id).toBeUndefined();
  });
});

describe('evaluation (checklist 07)', () => {
  it('creates the SLO rule before the first evaluation', () => {
    const firstEval = of('work').find((f) => f.e.verb === 'evaluate')!;
    expect(before(appearAt('slorule'), firstEval)).toBe(true);
  });

  it('derives each evaluation’s service state from an earlier SLI and the SLO rule', () => {
    const evals = of('work').filter((f) => f.e.verb === 'evaluate');
    expect(evals).toHaveLength(3);
    for (const ev of evals) {
      const produced = of('appear').find(
        (f) => f.si === ev.si && f.ei > ev.ei && version(f.e.version).kind === 'serviceState',
      );
      expect(produced, STEPS[ev.si]!.id).toBeDefined();
      const lineage = version(produced!.e.version).lineage;
      expect(lineage).toContain('slorule');
      const sli = lineage.find((id) => version(id).kind === 'sli');
      expect(sli && appearAt(sli).si < ev.si, STEPS[ev.si]!.id).toBe(true);
    }
  });

  it('shows nothing VIOLATED on any surface once HEALTHY has reached Presentation', () => {
    const back = of('handoff').find((f) => f.e.version === 'ss3' && f.e.to === 'presentation')!;
    expect(stateAt(back.si - 1).surfaces.faultMgmt).toBe('ev-viol');
    for (let n = back.si; n <= last; n++) {
      const shown = Object.values(stateAt(n).surfaces).filter((id): id is string => Boolean(id));
      expect(shown.map((id) => version(id).status), STEPS[n]!.id).not.toContain('VIOLATED');
    }
  });
});
```

- [ ] **Step 3: Run the suite to verify it fails**

Run: `npx vitest run tests/unit/story.test.ts`
Expected: FAIL. "has the 36 beats" fails because `STEPS` is empty, and `appearAt('slorule')` and similar throw "never appears".

- [ ] **Step 4: Replace the placeholder block in `scenario.ts` with the story data**

In `src/scenario/scenario.ts`, delete these lines:

```ts
// Filled in Task 4.
export const VERSIONS: ArtifactVersion[] = [];
export const STEPS: Step[] = [];
```

and put the following in their place, above `const kindById`. Also add `Event` and `Marker` to the type import at the top of the file. `T` already exists from Task 2.

```ts
export const VERSIONS: ArtifactVersion[] = [
  // Provision
  {
    id: 'sr', kind: 'serviceRequest', label: 'submitted', lineage: [],
    meaning: 'ACME asks for connectivity between CPH01 and AAR01 with packet loss below 0.1%.',
    technical: ['service: ACME-L3VPN-001 (L3VPN)', 'sites: CPH01, AAR01', 'slo: loss < 0.1%'],
  },
  {
    id: 'wf-prov', kind: 'workflow', label: 'provision', lineage: ['sr'],
    meaning: 'Orchestrator’s record of the provisioning workflow for ACME.',
    technical: ['workflow: provision ACME-L3VPN-001', 'trigger: service request (Portal)'],
  },
  {
    id: 'ir', kind: 'intentRequest', label: 'create service', lineage: ['sr'],
    meaning: 'Orchestrator asks Intent to create ACME’s service.',
    technical: ['op: create-service', 'service: ACME-L3VPN-001'],
  },
  {
    id: 'si', kind: 'serviceIntent', label: 'v1', lineage: ['ir'],
    meaning: 'What ACME wants, in ACME’s terms: connect CPH01 and AAR01 with loss below 0.1%.',
    technical: ['service: ACME-L3VPN-001', 'type: L3VPN, VRF ACME', 'endpoints: CPH01, AAR01', 'slo: loss < 0.1%'],
  },
  {
    id: 'ni1', kind: 'networkIntent', label: 'v1', lineage: ['si'],
    meaning: 'Steer ACME over path A via ODE01, with path B via KOL01 as the alternate.',
    technical: ['sr-policy colour 100, one per direction', 'preferred: CPH01–ODE01–AAR01 (A)', 'alternate: CPH01–KOL01–AAR01 (B)'],
  },
  {
    id: 'ds1', kind: 'desiredState', label: 'v1', lineage: ['ni1'],
    meaning: 'The configuration CPH01 and AAR01 should have for ACME, including its probe.',
    technical: ['CPH01, AAR01: vrf ACME, rd/rt 65000:101', 'sr-policy colour 100 → path A', 'twamp-light CPH01 → AAR01 (stateful reflector), vrf ACME'],
  },
  {
    id: 'slodef', kind: 'sloDefinition', label: 'v1', lineage: ['si'],
    meaning: 'How ACME’s service is judged: probe loss, worst direction, per minute, below 0.1%.',
    technical: ['sli: twamp-light loss, worst direction', 'window: 1 min', 'objective: < 0.1%'],
  },
  {
    id: 'slorule', kind: 'sloRule', label: 'acme-loss', lineage: ['slodef'],
    meaning: 'Observability’s own rule for evaluating ACME’s SLI.',
    technical: ['rule: acme-loss', 'expr: max(loss by direction) over 1m < 0.1%'],
  },
  {
    id: 'cc1', kind: 'configChange', label: 'v1', lineage: ['ds1'],
    meaning: 'The configuration rendered and applied to CPH01 and AAR01.',
    technical: ['gNMI Set → CPH01, AAR01', 'vrf ACME, sr-policy colour 100, twamp-light', 'commit: ok'],
  },
  {
    id: 'rb-a', kind: 'rawSignals', label: 'read-back A', lineage: ['cc1'],
    meaning: 'The configuration exactly as CPH01 and AAR01 report it.',
    technical: ['gNMI Get CPH01, AAR01', 'subtrees: vrf ACME, sr-policy colour 100'],
  },
  {
    id: 'obs1', kind: 'observedState', label: 'v1', lineage: ['rb-a'],
    meaning: 'What CPH01 and AAR01 actually have applied, as read back.',
    technical: ['CPH01, AAR01: vrf ACME 65000:101', 'sr-policy colour 100 → path A', 'source: gNMI Get'],
  },
  {
    id: 'raw-base', kind: 'rawSignals', label: 'baseline', lineage: [],
    meaning: 'Telemetry and probe results from the network, each in its own format.',
    technical: ['CPH01 Hu0/0/0/1: Rx −2.4 dBm, CRC 0', 'other links: Rx −2.1 to −2.6 dBm, CRC 0', 'all links: oper UP, IS-IS UP', 'twamp-light loss 0.00% both directions'],
  },
  {
    id: 'norm-base', kind: 'normalized', label: 'baseline', lineage: ['raw-base'],
    meaning: 'The same measurements in one common shape.',
    technical: ['{metric, device, interface, value, time}', 'window 09:12–09:13'],
  },
  {
    id: 'enr-base', kind: 'enriched', label: 'baseline', lineage: ['norm-base'],
    meaning: 'Measurements tagged with the link, path and service they belong to.',
    technical: ['Hu0/0/0/1 → CPH01–ODE01 → path A → ACME', 'probe → path A → ACME', 'source: cached intent (network intent v1)'],
  },
  {
    id: 'sli1', kind: 'sli', label: '0.00%', lineage: ['enr-base'],
    meaning: 'ACME lost no probe packets in the last minute.',
    technical: ['loss CPH01→AAR01: 0.00%', 'loss AAR01→CPH01: 0.00%', 'sli (worst) = 0.00%, 09:12–09:13'],
  },
  {
    id: 'ss1', kind: 'serviceState', label: '09:13', status: 'HEALTHY', lineage: ['sli1', 'slorule'],
    meaning: 'ACME’s service meets its objective.',
    technical: ['sli 0.00% < 0.1%', 'rule: acme-loss'],
  },
  // Detect
  {
    id: 'raw-deg', kind: 'rawSignals', label: 'degraded', lineage: [],
    meaning: 'Light falling and errors rising at CPH01; ACME’s probe losing packets; links still UP.',
    technical: ['CPH01 Hu0/0/0/1: Rx −10.9 dBm (warn −9.0), CRC/FCS ≈1,240/min', 'other links: Rx −2.1 to −2.6 dBm, CRC 0', 'all links: oper UP, IS-IS UP', 'twamp-light AAR01→CPH01 loss 0.4%'],
  },
  {
    id: 'norm-deg', kind: 'normalized', label: 'degraded', lineage: ['raw-deg'],
    meaning: 'The same signals in one shape: light down, errors up, probe losing packets, everything UP.',
    technical: ['CPH01 Hu0/0/0/1: rx_power −10.9 dBm, crc_errors 1,240/min', 'all 4 links: oper_status UP, isis_adjacency UP', 'probe_loss AAR01→CPH01 0.4%, 10:45–10:46'],
  },
  {
    id: 'enr-deg', kind: 'enriched', label: 'degraded', lineage: ['norm-deg'],
    meaning: 'The CPH01 interface facing ODE01 is tagged to link CPH01–ODE01 on path A, carrying ACME; path B is tagged as ACME’s alternate.',
    technical: ['Hu0/0/0/1 → CPH01–ODE01 → path A → ACME', 'CPH01–KOL01, KOL01–AAR01 → path B (ACME alternate)', 'source: cached intent (network intent v1)'],
  },
  {
    id: 'sli2', kind: 'sli', label: '0.4%', lineage: ['enr-deg'],
    meaning: 'ACME lost 0.4% of probe packets in the last minute, AAR01→CPH01.',
    technical: ['loss CPH01→AAR01: 0.00%', 'loss AAR01→CPH01: 0.4%', 'sli (worst) = 0.4%, 10:45–10:46'],
  },
  {
    id: 'evid', kind: 'evidence', label: 'path A, 10:46', lineage: ['sli2', 'enr-deg'],
    meaning: 'ACME’s loss lines up with low light and errors on CPH01–ODE01: consistent with optical degradation, a strong clue, not proof.',
    technical: ['window 10:45–10:46, path A', 'sli 0.4% with Rx −10.9 dBm and CRC ≈1,240/min', 'suspect: CPH01–ODE01 (ODE01→CPH01), not proof'],
  },
  {
    id: 'ss2', kind: 'serviceState', label: '10:46', status: 'DEGRADED', lineage: ['sli2', 'slorule'],
    meaning: 'ACME’s service misses its objective, even though the interface is UP.',
    technical: ['sli 0.4% ≥ 0.1%', 'interface UP, IS-IS UP: device state ≠ service state'],
  },
  {
    id: 'ev-viol', kind: 'serviceEvent', label: 'loss violation', status: 'VIOLATED', lineage: ['ss2', 'evid'],
    meaning: 'ACME’s loss objective is violated; suspected link CPH01–ODE01 on ACME’s current path A.',
    technical: ['event: acme-loss-violation', 'service: ACME-L3VPN-001, slo: loss < 0.1%', 'implicated: CPH01–ODE01; current path: A'],
  },
  // Remediate
  {
    id: 'wf-rem', kind: 'workflow', label: 'remediation', lineage: ['ev-viol'],
    meaning: 'Orchestrator’s record of the remediation workflow for ACME’s loss violation.',
    technical: ['workflow: remediate acme-loss-violation', 'policy: pol-loss-reroute (pre-approved)'],
  },
  {
    id: 'pathB', kind: 'pathHealth', label: 'path B', status: 'HEALTHY', lineage: ['enr-deg'],
    meaning: 'The links of ACME’s alternate, path B via KOL01, look healthy: normal light, no errors, UP. ACME itself is not yet measured there.',
    technical: ['path B: CPH01–KOL01–AAR01 (from enrichment tags)', 'Rx −2.1 to −2.6 dBm, CRC 0, oper UP (10:45–10:46)', 'link telemetry only; no probe on path B yet'],
  },
  {
    id: 'dec', kind: 'remediationDecision', label: 'exclude CPH01–ODE01', lineage: ['ev-viol', 'pathB'],
    meaning: 'Exclude the implicated link from ACME’s network intent. Intent chooses what replaces it.',
    technical: ['op: intent-change ACME-L3VPN-001', 'exclude-link: CPH01–ODE01', 'policy: pol-loss-reroute'],
  },
  {
    id: 'ni2', kind: 'networkIntent', label: 'v2', lineage: ['dec', 'si'],
    meaning: 'Steer ACME away from CPH01–ODE01, which leaves path B via KOL01.',
    technical: ['exclude: CPH01–ODE01', 'selected: CPH01–KOL01–AAR01 (B)', 'sr-policy colour 100'],
  },
  {
    id: 'ds2', kind: 'desiredState', label: 'v2', lineage: ['ni2'],
    meaning: 'The configuration CPH01 and AAR01 should have to carry ACME over path B.',
    technical: ['CPH01, AAR01: sr-policy colour 100 → path B', 'exclude CPH01–ODE01', 'vrf ACME and probe unchanged'],
  },
  {
    id: 'cc2', kind: 'configChange', label: 'v2', lineage: ['ds2'],
    meaning: 'The change applied to CPH01 and AAR01 that moves ACME to path B.',
    technical: ['gNMI Set → CPH01, AAR01', 'sr-policy colour 100 → path B', 'commit: ok'],
  },
  {
    id: 'rb-b', kind: 'rawSignals', label: 'read-back B', lineage: ['cc2'],
    meaning: 'The new configuration exactly as CPH01 and AAR01 report it.',
    technical: ['gNMI Get CPH01, AAR01', 'subtree: sr-policy colour 100'],
  },
  {
    id: 'obs2', kind: 'observedState', label: 'v2', lineage: ['rb-b'],
    meaning: 'What CPH01 and AAR01 actually have applied after the change.',
    technical: ['CPH01, AAR01: sr-policy colour 100 → path B', 'source: gNMI Get'],
  },
  {
    id: 'raw-after', kind: 'rawSignals', label: 'after reroute', lineage: [],
    meaning: 'Fresh telemetry: errors continue on the faulty fibre, and ACME’s probe is clean.',
    technical: ['CPH01 Hu0/0/0/1: Rx −10.9 dBm, CRC/FCS ≈1,240/min', 'other links: Rx −2.1 to −2.6 dBm, CRC 0', 'all links: oper UP, IS-IS UP', 'twamp-light loss 0.00% both directions'],
  },
  {
    id: 'norm-after', kind: 'normalized', label: 'after reroute', lineage: ['raw-after'],
    meaning: 'The fresh measurements in one common shape.',
    technical: ['{metric, device, interface, value, time}', 'window 10:48–10:49'],
  },
  {
    id: 'enr-after', kind: 'enriched', label: 'after reroute', lineage: ['norm-after'],
    meaning: 'ACME’s probe is tagged to path B; link CPH01–ODE01 no longer carries ACME.',
    technical: ['probe → path B → ACME', 'Hu0/0/0/1 → CPH01–ODE01 → no ACME service', 'source: cached intent (network intent v2)'],
  },
  {
    id: 'sli3', kind: 'sli', label: '0.00%', lineage: ['enr-after'],
    meaning: 'ACME lost no probe packets in the last minute.',
    technical: ['loss CPH01→AAR01: 0.00%', 'loss AAR01→CPH01: 0.00%', 'sli (worst) = 0.00%, 10:48–10:49'],
  },
  {
    id: 'ss3', kind: 'serviceState', label: '10:49', status: 'HEALTHY', lineage: ['sli3', 'slorule'],
    meaning: 'ACME’s service meets its objective again.',
    technical: ['sli 0.00% < 0.1%', 'rule: acme-loss (unchanged)'],
  },
  {
    id: 'ev-clear', kind: 'serviceEvent', label: 'cleared', status: 'CLEARED', lineage: ['ev-viol', 'ss3'],
    meaning: 'ACME’s loss violation is resolved.',
    technical: ['event: acme-loss-violation', 'state: cleared 10:49'],
  },
  {
    id: 'ev-repair', kind: 'serviceEvent', label: 'repair needed', lineage: ['evid', 'enr-after'],
    meaning: 'ACME was auto-remediated onto path B; link CPH01–ODE01 still needs repair.',
    technical: ['event: link-repair-needed CPH01–ODE01', 'ODE01→CPH01: Rx −10.9 dBm, CRC ≈1,240/min', 'ACME-L3VPN-001 auto-remediated onto path B'],
  },
];

const appear = (version: string): Event => ({ t: 'appear', version });
const sig = (signal: SignalId, from: Party, to: Party, v?: string): Event =>
  v ? { t: 'signal', signal, from, to, version: v } : { t: 'signal', signal, from, to };
const hand = (version: string, from: Party, to: Party, surface?: Surface): Event =>
  surface ? { t: 'handoff', version, from, to, surface } : { t: 'handoff', version, from, to };
const work = (owner: Party, verb: WorkVerb, simple: string, technical?: string): Event => ({
  t: 'work',
  owner,
  verb,
  label: T(simple, technical),
});
const mark = (version: string, marker: Marker): Event => ({ t: 'mark', version, marker });

export const STEPS: Step[] = [
  // ── Provision ──
  {
    id: 'P1', chapter: 'provision', title: 'Orientation',
    caption: T(
      'One automation system: six responsibilities, with The Network beneath them. Solid lines carry content from the responsibility that produces it to the one that uses it; dashed lines are Orchestrator’s coordination signals. These are roles, not products.',
      'Six NAF responsibilities: Presentation, Intent, Orchestrator, Executor, Collector, Observability; The Network is infrastructure, not a responsibility. Solid = artifact handoff (producer → consumer); dashed = coordination signal (always involves Orchestrator). Roles, not products: one product can play several roles.',
    ),
    events: [],
  },
  {
    id: 'P2', chapter: 'provision', title: 'Request',
    caption: T(
      'Through the Portal, ACME requests connectivity between its CPH01 and AAR01 sites with packet loss below 0.1%. The request goes to Orchestrator, which starts the provisioning workflow.',
      'Portal → Orchestrator: service request ACME-L3VPN-001 (L3VPN, CPH01 ↔ AAR01, SLO loss < 0.1%). Orchestrator starts workflow provision/ACME-L3VPN-001.',
    ),
    events: [
      appear('sr'),
      hand('sr', 'presentation', 'orchestrator', 'portal'),
      work('orchestrator', 'startWorkflow', 'start workflow', 'start provision/ACME-L3VPN-001'),
      appear('wf-prov'),
    ],
  },
  {
    id: 'P3', chapter: 'provision', title: 'Record',
    caption: T(
      'Orchestrator relays the request to Intent as its own intent request. Intent records the service intent in ACME’s terms: what ACME wants, not how the network delivers it.',
      'Orchestrator → Intent: intent request create-service ACME-L3VPN-001. Intent records service intent v1: L3VPN, VRF ACME, endpoints CPH01 and AAR01, SLO loss < 0.1%.',
    ),
    events: [
      appear('ir'),
      hand('ir', 'orchestrator', 'intent'),
      work('intent', 'record', 'record service intent'),
      appear('si'),
    ],
  },
  {
    id: 'P4', chapter: 'provision', title: 'Derive network intent',
    caption: T(
      'Intent derives network intent: steer ACME’s traffic over path A via ODE01, and keep path B via KOL01 as the alternate.',
      'Intent derives network intent v1: SR-MPLS policy colour 100 per direction; preferred path A CPH01–ODE01–AAR01; alternate path B CPH01–KOL01–AAR01.',
    ),
    events: [work('intent', 'derive', 'derive network intent'), appear('ni1')],
  },
  {
    id: 'P5', chapter: 'provision', title: 'Derive desired state',
    caption: T(
      'Intent derives the desired state for each device, CPH01 and AAR01, and tells Orchestrator it is ready. That signal answers Orchestrator’s intent request.',
      'Intent derives desired state v1 for CPH01 and AAR01: VRF ACME (RD/RT 65000:101), colour-100 policy towards path A, TWAMP-Light probe (CPH01 sender, AAR01 stateful reflector). Intent ⇢ Orchestrator: desired state v1 ready.',
    ),
    events: [
      work('intent', 'derive', 'derive desired state'),
      appear('ds1'),
      sig('desiredStateReady', 'intent', 'orchestrator', 'ds1'),
    ],
  },
  {
    id: 'P6', chapter: 'provision', title: 'Onboard assurance',
    caption: T(
      'Before anything is applied, Orchestrator asks Observability to onboard assurance for ACME. Observability takes the SLO definition directly from Intent, turns it into its own SLO rule, and confirms to Orchestrator that assurance is ready.',
      'Orchestrator ⇢ Observability: onboard service assurance. Intent → Observability: SLO definition (probe loss, worst direction, 1-minute window, < 0.1%), directly, not via Orchestrator. Observability creates rule acme-loss. Observability ⇢ Orchestrator: assurance onboarded.',
    ),
    events: [
      sig('onboard', 'orchestrator', 'observability'),
      appear('slodef'),
      hand('slodef', 'intent', 'observability'),
      work('observability', 'configureSlo', 'configure SLO rule', 'configure rule acme-loss'),
      appear('slorule'),
      sig('onboarded', 'observability', 'orchestrator'),
    ],
  },
  {
    id: 'P7', chapter: 'provision', title: 'Apply',
    caption: T(
      'Orchestrator asks Executor to apply desired state v1. Executor takes it directly from Intent, renders the configuration and applies it to CPH01 and AAR01. ACME’s traffic now uses path A. Executor reports the change applied; a successful commit is not yet verification.',
      'Orchestrator ⇢ Executor: apply desired state v1. Intent → Executor: desired state v1. Executor renders and pushes configuration change v1 with gNMI Set (VRF, colour-100 policy, probe). ACME on path A. Executor ⇢ Orchestrator: applied v1 (commit ok, not verified).',
    ),
    events: [
      sig('apply', 'orchestrator', 'executor', 'ds1'),
      hand('ds1', 'intent', 'executor'),
      work('executor', 'render', 'render', 'render gNMI Set payloads'),
      work('executor', 'apply', 'apply', 'gNMI Set CPH01, AAR01'),
      appear('cc1'),
      hand('cc1', 'executor', 'network'),
      { t: 'network', acmePath: 'A' },
      sig('applied', 'executor', 'orchestrator', 'ds1'),
    ],
  },
  {
    id: 'P8', chapter: 'provision', title: 'Read back',
    caption: T(
      'Configuration verification begins. Orchestrator asks Collector to read back what the devices actually have. Collector hands the observed device state directly to Intent and tells Orchestrator the read-back is done.',
      'Orchestrator ⇢ Collector: read back applied state. Network → Collector: gNMI Get of CPH01 and AAR01. Collector → Intent: observed device state v1. Collector ⇢ Orchestrator: read back done.',
    ),
    events: [
      sig('readBack', 'orchestrator', 'collector'),
      appear('rb-a'),
      hand('rb-a', 'network', 'collector'),
      work('collector', 'readBack', 'read back', 'gNMI Get CPH01, AAR01'),
      appear('obs1'),
      hand('obs1', 'collector', 'intent'),
      sig('readBackDone', 'collector', 'orchestrator'),
    ],
  },
  {
    id: 'P9', chapter: 'provision', title: 'Check drift',
    caption: T(
      'Orchestrator asks Intent to check drift. The observed state matches the desired state, so desired state v1 is in sync, and Intent tells Orchestrator. A mismatch would have led the workflow to roll back.',
      'Orchestrator ⇢ Intent: check drift v1. Intent compares observed device state v1 with desired state v1: no drift, desired state v1 = IN SYNC. Intent ⇢ Orchestrator: in sync. On drift, the workflow would roll back.',
    ),
    events: [
      sig('checkDrift', 'orchestrator', 'intent', 'ds1'),
      work('intent', 'checkDrift', 'check drift', 'compare observed v1 with desired v1'),
      mark('ds1', 'IN_SYNC'),
      sig('inSync', 'intent', 'orchestrator', 'ds1'),
    ],
  },
  {
    id: 'P10', chapter: 'provision', title: 'Collect',
    caption: T(
      'Configured as intended is not yet a working service. The network streams raw measurements to Collector, each in its own format, and Collector normalizes them into one shape.',
      'Network → Collector: gNMI streaming telemetry (Rx power, CRC/FCS, oper-status, IS-IS adjacency) from all four links, and TWAMP-Light results for CPH01 ↔ AAR01 in VRF ACME. Collector normalizes them to {metric, device, interface, value, time}.',
    ),
    events: [
      appear('raw-base'),
      hand('raw-base', 'network', 'collector'),
      work('collector', 'collect', 'collect', 'gNMI subscribe, TWAMP-Light results'),
      work('collector', 'normalize', 'normalize'),
      appear('norm-base'),
    ],
  },
  {
    id: 'P11', chapter: 'provision', title: 'Enrich',
    caption: T(
      'Collector tags each measurement with the link, path and service it belongs to, using its locally cached copy of intent, and hands the enriched observations to Observability. Tagging is not interpretation.',
      'Collector enriches from cached intent: Hu0/0/0/1 → link CPH01–ODE01 → path A → ACME-L3VPN-001; probe → ACME. Collector → Observability: enriched observations (baseline, 09:12–09:13).',
    ),
    events: [
      work('collector', 'enrich', 'enrich', 'tag from cached intent'),
      appear('enr-base'),
      hand('enr-base', 'collector', 'observability'),
    ],
  },
  {
    id: 'P12', chapter: 'provision', title: 'Compute SLI',
    caption: T(
      'Observability computes ACME’s SLI from the probe: no packets lost in the last minute.',
      'Observability computes SLI = max(loss CPH01→AAR01, loss AAR01→CPH01) over 09:12–09:13 = 0.00%.',
    ),
    events: [work('observability', 'computeSli', 'compute SLI'), appear('sli1')],
  },
  {
    id: 'P13', chapter: 'provision', title: 'Evaluate',
    caption: T(
      'Observability evaluates the SLI against its SLO rule. It is within the objective, so ACME’s service is healthy. This is service verification, separate from the configuration check.',
      'Rule acme-loss: 0.00% < 0.1% → service state HEALTHY for ACME-L3VPN-001. Service verification (SLO) is separate from configuration verification (drift check).',
    ),
    events: [work('observability', 'evaluate', 'evaluate SLI against SLO'), appear('ss1')],
  },
  {
    id: 'P14', chapter: 'provision', title: 'Report',
    caption: T(
      'Observability sends the healthy service state to the Portal and to Orchestrator, whose workflow has been waiting for it. Orchestrator completes the provisioning workflow.',
      'Observability → Portal, Orchestrator: service state HEALTHY. The workflow’s wait-for-HEALTHY subscription is satisfied and closes; provision/ACME-L3VPN-001 = COMPLETED.',
    ),
    events: [
      hand('ss1', 'observability', 'presentation', 'portal'),
      hand('ss1', 'observability', 'orchestrator'),
      work('orchestrator', 'completeWorkflow', 'complete workflow'),
      mark('wf-prov', 'COMPLETED'),
    ],
  },
  // ── Detect ──
  {
    id: 'D1', chapter: 'detect', title: 'Fault',
    caption: T(
      'The ODE01→CPH01 fibre strand starts to lose light. CPH01 still sees a signal, so the interface and routing stay up, but frames arrive with bit errors. The automation system does not know yet.',
      'Ground truth: optical attenuation on ODE01→CPH01. Rx at CPH01 Hu0/0/0/1 falls from −2.4 dBm towards −10.9 dBm (low warning −9.0 dBm). oper-status UP, IS-IS adjacency UP. Nothing has been observed yet.',
    ),
    events: [{ t: 'network', link: { id: 'CPH01-ODE01', status: 'DEGRADED' } }],
  },
  {
    id: 'D2', chapter: 'detect', title: 'Collect',
    caption: T(
      'The network streams raw signals to Collector, each in its own format: falling light and rising errors from CPH01, loss from ACME’s probe, and interface and routing state from every link.',
      'Network → Collector: gNMI telemetry (Rx −10.9 dBm and CRC/FCS ≈1,240/min on CPH01 Hu0/0/0/1; oper-status and IS-IS UP on all links) and TWAMP-Light results, 10:41–10:46.',
    ),
    events: [
      appear('raw-deg'),
      hand('raw-deg', 'network', 'collector'),
      work('collector', 'collect', 'collect', 'gNMI subscribe, TWAMP-Light results'),
    ],
  },
  {
    id: 'D3', chapter: 'detect', title: 'Normalize',
    caption: T(
      'Collector puts the signals into one common shape, so they can be compared: the light has dropped, errors are rising and ACME’s probe is losing packets, while the interface and routing still say UP.',
      'Collector normalizes to {metric, device, interface, value, time}: rx_power −10.9 dBm, crc_errors 1,240/min, oper_status UP, isis_adjacency UP, probe_loss AAR01→CPH01 0.4% (10:45–10:46).',
    ),
    events: [work('collector', 'normalize', 'normalize'), appear('norm-deg')],
  },
  {
    id: 'D4', chapter: 'detect', title: 'Enrich',
    caption: T(
      'Collector tags each measurement from its cached intent: the CPH01 interface facing ODE01 belongs to link CPH01–ODE01, on path A, carrying ACME. Path B’s links are tagged as ACME’s alternate. Collector hands the enriched observations to Observability.',
      'Hu0/0/0/1 → CPH01–ODE01 → path A → ACME-L3VPN-001; CPH01–KOL01 and KOL01–AAR01 → path B (ACME alternate). Collector → Observability: enriched observations (degraded).',
    ),
    events: [
      work('collector', 'enrich', 'enrich', 'tag from cached intent'),
      appear('enr-deg'),
      hand('enr-deg', 'collector', 'observability'),
    ],
  },
  {
    id: 'D5', chapter: 'detect', title: 'Compute SLI',
    caption: T(
      'Observability computes ACME’s SLI: 0.4% of probe packets lost in the last minute, all in the AAR01→CPH01 direction. The probe measures each direction separately, so it sees loss on the damaged strand.',
      'SLI = max(loss CPH01→AAR01 0.00%, loss AAR01→CPH01 0.4%) over 10:45–10:46 = 0.4%. TWAMP-Light is sent from CPH01 and reflected by AAR01; the stateful reflector’s sequence numbers separate forward from reverse loss. A one-way CPH01→AAR01 probe would miss this loss.',
    ),
    events: [work('observability', 'computeSli', 'compute SLI'), appear('sli2')],
  },
  {
    id: 'D6', chapter: 'detect', title: 'Correlate',
    caption: T(
      'Observability correlates the loss with the low light and errors on path A in the same minute. The result is consistent with optical degradation on CPH01–ODE01: a strong clue, not proof.',
      'Correlation window 10:45–10:46 on path A: SLI 0.4% with Rx −10.9 dBm and CRC/FCS ≈1,240/min on CPH01 Hu0/0/0/1. Suspected: optical degradation ODE01→CPH01. A strong clue, not proof of root cause.',
    ),
    events: [work('observability', 'correlate', 'correlate'), appear('evid')],
  },
  {
    id: 'D7', chapter: 'detect', title: 'Evaluate',
    caption: T(
      'Observability evaluates the SLI against the SLO rule. 0.4% breaches the objective, so ACME’s service is degraded, even though the interface is UP and routing is established. The Portal now shows it.',
      'Rule acme-loss: 0.4% ≥ 0.1% → service state DEGRADED. Observability → Portal. No workflow is running, so Orchestrator holds no subscription to service state.',
    ),
    events: [
      work('observability', 'evaluate', 'evaluate SLI against SLO'),
      appear('ss2'),
      hand('ss2', 'observability', 'presentation', 'portal'),
    ],
  },
  {
    id: 'D8', chapter: 'detect', title: 'Raise event',
    caption: T(
      'Observability raises a service-impact event: ACME’s loss objective is violated, with the suspected link and ACME’s current path attached. It goes to Fault Management and to Orchestrator. UP does not mean healthy: device state is not service state.',
      'Event acme-loss-violation (VIOLATED): service ACME-L3VPN-001, SLO loss < 0.1%, implicated link CPH01–ODE01, current path A. Observability → Fault Management, Orchestrator.',
    ),
    events: [
      work('observability', 'raiseEvent', 'raise event'),
      appear('ev-viol'),
      hand('ev-viol', 'observability', 'presentation', 'faultMgmt'),
      hand('ev-viol', 'observability', 'orchestrator'),
    ],
  },
  // ── Remediate ──
  {
    id: 'R1', chapter: 'remediate', title: 'Start workflow',
    caption: T(
      'The event starts Orchestrator’s remediation workflow, under a pre-approved policy.',
      'Workflow remediation/acme-loss-violation starts under pol-loss-reroute (pre-approved): if an SLO is violated, the evidence implicates a link on the current path, and a healthy alternate exists, request that the link be excluded.',
    ),
    events: [
      work('orchestrator', 'startWorkflow', 'start workflow', 'start remediation under pol-loss-reroute'),
      appear('wf-rem'),
    ],
  },
  {
    id: 'R2', chapter: 'remediate', title: 'Query alternate path',
    caption: T(
      'The policy needs a healthy alternate. Orchestrator asks Observability about ACME’s alternate path. Observability finds from Collector’s tags that it is path B, and its latest link telemetry looks healthy: normal light, no errors, UP. That shows the links are fine, not yet that ACME will be; ACME’s probe shows that after the move.',
      'Orchestrator ⇢ Observability: query alternate-path health for ACME-L3VPN-001. Observability resolves the alternate from enrichment tags (path B, CPH01–KOL01–AAR01) and assesses it from the 10:45–10:46 telemetry: Rx −2.1 to −2.6 dBm, CRC 0, oper UP. No probe runs on path B, so this is link health, not service health. Observability → Orchestrator: path B health HEALTHY.',
    ),
    events: [
      sig('queryAltPath', 'orchestrator', 'observability'),
      work('observability', 'assessPath', 'assess alternate path', 'assess path B from link telemetry'),
      appear('pathB'),
      hand('pathB', 'observability', 'orchestrator'),
    ],
  },
  {
    id: 'R3', chapter: 'remediate', title: 'Evaluate policy',
    caption: T(
      'The workflow evaluates the policy: the SLO is violated, the evidence implicates CPH01–ODE01 on ACME’s current path, and a healthy alternate exists. It sends Intent a remediation decision to exclude that link; Intent, not Orchestrator, chooses the new path. Other designs might evaluate policy elsewhere.',
      'pol-loss-reroute conditions met. Orchestrator → Intent: remediation decision intent-change ACME-L3VPN-001, exclude-link CPH01–ODE01. The decision names no path. Where policy is evaluated is a design choice.',
    ),
    events: [
      work('orchestrator', 'evaluatePolicy', 'evaluate policy', 'evaluate pol-loss-reroute'),
      appear('dec'),
      hand('dec', 'orchestrator', 'intent'),
    ],
  },
  {
    id: 'R4', chapter: 'remediate', title: 'Record',
    caption: T(
      'Intent records derived network intent v2: exclude CPH01–ODE01, which leaves path B. ACME’s service intent is unchanged; only how the network delivers it changes.',
      'Network intent v2: exclude CPH01–ODE01; selected path B CPH01–KOL01–AAR01; colour 100. Service intent v1 = UNCHANGED (still L3VPN CPH01 ↔ AAR01, loss < 0.1%).',
    ),
    events: [
      work('intent', 'record', 'record network intent v2'),
      appear('ni2'),
      mark('si', 'UNCHANGED'),
    ],
  },
  {
    id: 'R5', chapter: 'remediate', title: 'Derive',
    caption: T(
      'Intent derives desired state v2 and tells Orchestrator it is ready, answering the remediation decision.',
      'Desired state v2 for CPH01 and AAR01: colour-100 policy towards path B, excluding CPH01–ODE01. Intent ⇢ Orchestrator: desired state v2 ready.',
    ),
    events: [
      work('intent', 'derive', 'derive desired state'),
      appear('ds2'),
      sig('desiredStateReady', 'intent', 'orchestrator', 'ds2'),
    ],
  },
  {
    id: 'R6', chapter: 'remediate', title: 'Apply',
    caption: T(
      'Orchestrator asks Executor to apply desired state v2. Executor takes it directly from Intent and applies the change. ACME’s traffic, and its probe, move to path B via KOL01. Executor reports the change applied.',
      'Orchestrator ⇢ Executor: apply desired state v2. Intent → Executor: desired state v2. gNMI Set: configuration change v2 on CPH01 and AAR01. ACME (colour 100) and the probe now on path B. Executor ⇢ Orchestrator: applied v2.',
    ),
    events: [
      sig('apply', 'orchestrator', 'executor', 'ds2'),
      hand('ds2', 'intent', 'executor'),
      work('executor', 'render', 'render', 'render gNMI Set payloads'),
      work('executor', 'apply', 'apply', 'gNMI Set CPH01, AAR01'),
      appear('cc2'),
      hand('cc2', 'executor', 'network'),
      { t: 'network', acmePath: 'B' },
      sig('applied', 'executor', 'orchestrator', 'ds2'),
    ],
  },
  {
    id: 'R7', chapter: 'remediate', title: 'Read back',
    caption: T(
      'Configuration verification again. Orchestrator asks Collector to read back; Collector hands the observed state directly to Intent and reports the read-back done.',
      'Orchestrator ⇢ Collector: read back applied state. Network → Collector: gNMI Get. Collector → Intent: observed device state v2. Collector ⇢ Orchestrator: read back done.',
    ),
    events: [
      sig('readBack', 'orchestrator', 'collector'),
      appear('rb-b'),
      hand('rb-b', 'network', 'collector'),
      work('collector', 'readBack', 'read back', 'gNMI Get CPH01, AAR01'),
      appear('obs2'),
      hand('obs2', 'collector', 'intent'),
      sig('readBackDone', 'collector', 'orchestrator'),
    ],
  },
  {
    id: 'R8', chapter: 'remediate', title: 'Check drift',
    caption: T(
      'Orchestrator asks Intent to check drift. There is no drift: desired state v2 is in sync, and Intent tells Orchestrator.',
      'Orchestrator ⇢ Intent: check drift v2. Observed v2 matches desired v2: = IN SYNC. Intent ⇢ Orchestrator: in sync.',
    ),
    events: [
      sig('checkDrift', 'orchestrator', 'intent', 'ds2'),
      work('intent', 'checkDrift', 'check drift', 'compare observed v2 with desired v2'),
      mark('ds2', 'IN_SYNC'),
      sig('inSync', 'intent', 'orchestrator', 'ds2'),
    ],
  },
  {
    id: 'R9', chapter: 'remediate', title: 'Collect',
    caption: T(
      'Collector collects and normalizes fresh measurements. The fibre is still faulty, so errors continue on CPH01–ODE01, but ACME’s probe now runs over path B.',
      'Network → Collector: telemetry and TWAMP-Light, 10:48–10:49. CRC/FCS ≈1,240/min continues on CPH01 Hu0/0/0/1; probe loss 0.00% in both directions. Normalized to the common shape.',
    ),
    events: [
      appear('raw-after'),
      hand('raw-after', 'network', 'collector'),
      work('collector', 'collect', 'collect', 'gNMI subscribe, TWAMP-Light results'),
      work('collector', 'normalize', 'normalize'),
      appear('norm-after'),
    ],
  },
  {
    id: 'R10', chapter: 'remediate', title: 'Enrich',
    caption: T(
      'Collector tags the measurements from its updated cached intent: ACME’s probe is on path B, and CPH01–ODE01 no longer carries ACME. Collector hands them to Observability.',
      'Probe → path B → ACME-L3VPN-001; Hu0/0/0/1 → CPH01–ODE01 → no ACME service, from cached network intent v2. Collector → Observability: enriched observations (after reroute). How the cache follows Intent is out of scope here.',
    ),
    events: [
      work('collector', 'enrich', 'enrich', 'tag from updated cached intent'),
      appear('enr-after'),
      hand('enr-after', 'collector', 'observability'),
    ],
  },
  {
    id: 'R11', chapter: 'remediate', title: 'Compute SLI',
    caption: T(
      'Observability computes ACME’s SLI: no packets lost in the last minute.',
      'SLI = max(loss CPH01→AAR01 0.00%, loss AAR01→CPH01 0.00%) over 10:48–10:49 = 0.00%.',
    ),
    events: [work('observability', 'computeSli', 'compute SLI'), appear('sli3')],
  },
  {
    id: 'R12', chapter: 'remediate', title: 'Evaluate',
    caption: T(
      'Against the same, unchanged SLO rule, ACME’s service is healthy again. Fault Management still shows the violation, because nothing has told it otherwise yet.',
      'Rule acme-loss (unchanged): 0.00% < 0.1% → service state HEALTHY. Presentation surfaces show only what they have received.',
    ),
    events: [work('observability', 'evaluate', 'evaluate SLI against SLO'), appear('ss3')],
  },
  {
    id: 'R13', chapter: 'remediate', title: 'Report and clear',
    caption: T(
      'Observability sends the healthy state to the Portal and to Orchestrator, and clears the service-impact event in Fault Management. Orchestrator completes the remediation workflow.',
      'Observability → Portal, Orchestrator: service state HEALTHY. Observability → Fault Management: acme-loss-violation CLEARED. remediation/acme-loss-violation = COMPLETED.',
    ),
    events: [
      hand('ss3', 'observability', 'presentation', 'portal'),
      hand('ss3', 'observability', 'orchestrator'),
      work('observability', 'clearEvent', 'clear event'),
      appear('ev-clear'),
      hand('ev-clear', 'observability', 'presentation', 'faultMgmt'),
      work('orchestrator', 'completeWorkflow', 'complete workflow'),
      mark('wf-rem', 'COMPLETED'),
    ],
  },
  {
    id: 'R14', chapter: 'remediate', title: 'Closing',
    caption: T(
      'The fibre is still faulty. Observability tells ITSM that ACME was auto-remediated onto path B and the link needs repair. The service is healthy while the link is degraded: device state is not service state, in both directions. Here the policy was pre-approved, so the loop closed automatically; another deployment could pause for operator approval.',
      'Observability → ITSM: link-repair-needed CPH01–ODE01 (ODE01→CPH01 Rx −10.9 dBm, CRC/FCS ≈1,240/min); ACME-L3VPN-001 auto-remediated onto path B. Closed-loop remediation is one pattern; an approval gate is another.',
    ),
    events: [
      work('observability', 'raiseEvent', 'raise repair event'),
      appear('ev-repair'),
      hand('ev-repair', 'observability', 'presentation', 'itsm'),
    ],
  },
];
```

Then run `npx prettier --write src/scenario/scenario.ts`. It will reflow the compact object literals.

- [ ] **Step 5: Run the whole unit suite**

Run: `npm test`
Expected: PASS (every test in `layout`, `catalog`, `state`, `pairing` and `story`). If a story test fails, compare the data with spec §5 and brief 03, and fix whichever disagrees with the brief. Do not change a test to fit the data.

- [ ] **Step 6: Mutation checks (lesson 25)**

Make each break on its own, run `npx vitest run tests/unit/story.test.ts`, confirm the named test fails, then revert:

1. In P7, change `hand('ds1', 'intent', 'executor')` to `hand('ds1', 'intent', 'orchestrator')`. Expected failures: "sends each handoff … to a declared consumer" and "never hands Intent content to Orchestrator".
2. In P6, delete `sig('onboarded', 'observability', 'orchestrator')`. Expected failures: "applies only after … onboarded" and "answers every Orchestrator request …".
3. In R13, move `appear('ev-clear')` to R12. Expected failure: "adds at most one new artifact per responsibility per step" (R12 would then have two Observability artifacts).
4. In P7, change `sig('applied', 'executor', 'orchestrator', 'ds1')` to come `from: 'collector'`. Expected failure: "answers every Orchestrator request, from the party asked …".
5. Change `pathB`'s lineage to `['enr-base']`. Expected failure: "derives every version from the newest input of each kind available at the time".
6. Change `enr-after`'s last Technical line to `'source: cached intent (network intent v1)'`. Expected failure: "enriches from the cached intent that matches the network intent in force".

After reverting all six, run `npm test`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/scenario/scenario.ts tests/unit/pairing.ts tests/unit/pairing.test.ts tests/unit/story.test.ts
git commit -m "feat: ACME story as canonical data with the full semantic suite"
```

---

### Task 5: Event descriptions and the beat table generated from the data

**Model:** sonnet

**Files:**
- Create: `src/model/describe.ts`, `src/model/beatTable.ts`, `scripts/beat-table.ts`
- Test: `tests/unit/beatTable.test.ts`

**Interfaces:**
- Consumes: `STEPS`, `CHAPTERS`, `NETWORK`, `RESPONSIBILITIES`, `SIGNALS`, `SURFACES`, `kind`, `version` from `scenario.ts`.
- Produces:
  - in `describe.ts`: `STATUS_ICON: Record<Status, string>`, `MARKER_TEXT: Record<Marker, string>`, `artifactName(id: string): string` (for example `"Desired network state (v1)"`), `describe(e: Exclude<Event, { t: 'appear' }>, view: View): string`. The stage's exchange list (Task 7) and the beat table both use `describe`, so they can't disagree.
  - in `beatTable.ts`: `beatTable(steps?: readonly Step[]): string`, the Markdown tables for spec §5. The `npm run beats` script prints them.

- [ ] **Step 1: Write the failing test**

`tests/unit/beatTable.test.ts`:

```ts
import { describe as group, expect, it } from 'vitest';
import { beatTable } from '../../src/model/beatTable.ts';
import { describe } from '../../src/model/describe.ts';

group('describe', () => {
  it('writes signals, handoffs, work and marks as one line each', () => {
    expect(describe({ t: 'signal', signal: 'apply', from: 'orchestrator', to: 'executor', version: 'ds1' }, 'simple')).toBe(
      'Orchestrator ⇢ Executor: apply desired state v1',
    );
    expect(describe({ t: 'handoff', version: 'sr', from: 'presentation', to: 'orchestrator', surface: 'portal' }, 'simple')).toBe(
      'Portal → Orchestrator: Service request (submitted)',
    );
    expect(describe({ t: 'mark', version: 'ds1', marker: 'IN_SYNC' }, 'simple')).toBe('Desired network state (v1) = IN SYNC');
  });

  it('uses the view for work labels', () => {
    const e = { t: 'work', owner: 'executor', verb: 'apply', label: { simple: 'apply', technical: 'gNMI Set' } } as const;
    expect(describe(e, 'simple')).toBe('Executor: apply');
    expect(describe(e, 'technical')).toBe('Executor: gNMI Set');
  });
});

group('beatTable', () => {
  const md = beatTable();
  const rows = md.split('\n').filter((l) => /^\| [PDR]\d+ \|/.test(l));

  it('has one row per beat under three chapter headings', () => {
    expect(rows).toHaveLength(36);
    expect(md).toContain('### Provision');
    expect(md).toContain('### Detect');
    expect(md).toContain('### Remediate');
  });

  it('lists new artifacts and events in order', () => {
    expect(rows[0]).toBe('| P1 | Orientation | none | none |');
    const p8 = rows.find((r) => r.startsWith('| P8 |'))!;
    expect(p8).toContain('Collector: Observed device state (v1)');
    expect(p8.indexOf('read back applied state')).toBeLessThan(p8.indexOf('read back done'));
    expect(rows.find((r) => r.startsWith('| P2 |'))).toContain('Portal → Orchestrator: Service request (submitted)');
  });
});
```

(`describe` is the function under test, so Vitest's `describe` is imported as `group`.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/beatTable.test.ts`
Expected: FAIL, cannot resolve `../../src/model/beatTable.ts`.

- [ ] **Step 3: Implement `src/model/describe.ts`**

```ts
import { NETWORK, RESPONSIBILITIES, SIGNALS, SURFACES, kind, version } from '../scenario/scenario.ts';
import type { Event, Marker, Party, Status, Surface, View } from '../scenario/types.ts';

export const STATUS_ICON: Record<Status, string> = {
  HEALTHY: '✓',
  DEGRADED: '▲',
  VIOLATED: '✕',
  CLEARED: '✓',
};

export const MARKER_TEXT: Record<Marker, string> = {
  IN_SYNC: '= IN SYNC',
  UNCHANGED: '= UNCHANGED',
  COMPLETED: 'completed',
};

const end = (p: Party, surface?: Surface) =>
  p === 'presentation' && surface ? SURFACES[surface] : RESPONSIBILITIES[p].name;

export const artifactName = (id: string) => `${kind(version(id).kind).name} (${version(id).label})`;

export function describe(e: Exclude<Event, { t: 'appear' }>, view: View): string {
  switch (e.t) {
    case 'signal':
      return `${end(e.from)} ⇢ ${end(e.to)}: ${SIGNALS[e.signal].label}${e.version ? ` ${version(e.version).label}` : ''}`;
    case 'handoff':
      return `${end(e.from, e.surface)} → ${end(e.to, e.surface)}: ${artifactName(e.version)}`;
    case 'work':
      return `${end(e.owner)}: ${e.label[view]}`;
    case 'mark':
      return `${artifactName(e.version)} ${MARKER_TEXT[e.marker]}`;
    case 'network':
      return e.link ? `${NETWORK.link} ▲ ${e.link.status}` : NETWORK.acme[e.acmePath ?? 'none'][view];
  }
}
```

- [ ] **Step 4: Implement `src/model/beatTable.ts` and the script**

```ts
import { CHAPTERS, RESPONSIBILITIES, STEPS, kind, version } from '../scenario/scenario.ts';
import type { Chapter, Step } from '../scenario/types.ts';
import { artifactName, describe } from './describe.ts';

/** Spec §5, generated so that it can never drift from scenario.ts (lesson 23). */
export function beatTable(steps: readonly Step[] = STEPS): string {
  const out: string[] = [];
  for (const ch of Object.keys(CHAPTERS) as Chapter[]) {
    out.push(`### ${CHAPTERS[ch]}`, '', '| # | Title | New | Events in order |', '|---|---|---|---|');
    for (const s of steps.filter((x) => x.chapter === ch)) {
      const added = s.events.flatMap((e) =>
        e.t === 'appear'
          ? [`${RESPONSIBILITIES[kind(version(e.version).kind).producer].name}: ${artifactName(e.version)}`]
          : [],
      );
      const events = s.events.flatMap((e) => (e.t === 'appear' ? [] : [describe(e, 'simple')]));
      out.push(`| ${s.id} | ${s.title} | ${added.join(' · ') || 'none'} | ${events.join(' · ') || 'none'} |`);
    }
    out.push('');
  }
  return out.join('\n');
}
```

`scripts/beat-table.ts`:

```ts
import { beatTable } from '../src/model/beatTable.ts';

console.log(beatTable());
```

- [ ] **Step 5: Run the test and the script**

Run: `npx vitest run tests/unit/beatTable.test.ts && npm run beats | head -8`
Expected: the test passes (4 tests), and the script prints `### Provision` followed by the table header and the P1–P4 rows.

- [ ] **Step 6: Commit**

```bash
git add src/model/describe.ts src/model/beatTable.ts scripts/beat-table.ts tests/unit/beatTable.test.ts
git commit -m "feat: describe events once; generate the beat table from scenario data"
```

---

### Task 6: Storage that survives being blocked

**Model:** sonnet

**Files:**
- Create: `src/storage.ts`
- Test: `tests/unit/storage.test.ts`

**Interfaces:**
- Produces: `load(key: string): string | null`, `save(key: string, value: string): void`. Neither ever throws.

- [ ] **Step 1: Write the failing tests**

`tests/unit/storage.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { load, save } from '../../src/storage.ts';

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const install = (get: () => unknown) =>
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get });

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe('storage', () => {
  it('reads and writes when storage works', () => {
    const data = new Map<string, string>();
    install(() => ({ getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) }));
    save('naf.view', 'technical');
    expect(load('naf.view')).toBe('technical');
  });

  it('returns null and does not throw when storage is blocked', () => {
    install(() => {
      throw new Error('SecurityError: storage blocked');
    });
    expect(load('naf.view')).toBeNull();
    expect(() => save('naf.view', 'technical')).not.toThrow();
  });

  it('returns null and does not throw when the storage methods throw', () => {
    install(() => ({
      getItem: () => {
        throw new Error('SecurityError: denied');
      },
      setItem: () => {
        throw new Error('QuotaExceededError: full');
      },
    }));
    expect(load('naf.view')).toBeNull();
    expect(() => save('naf.view', 'technical')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/storage.test.ts`
Expected: FAIL, cannot resolve `../../src/storage.ts`.

- [ ] **Step 3: Implement `src/storage.ts`**

```ts
// Private windows and blocked site data make localStorage throw; preferences then last one visit.
export function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not persisted; the in-memory value still applies for this visit.
  }
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run tests/unit/storage.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/storage.ts tests/unit/storage.test.ts
git commit -m "feat: storage helpers that survive blocked localStorage"
```

---

### Task 7: The plain stage with keyboard navigation and the view switch

**Model:** sonnet

**Files:**
- Modify: `src/layout.ts` (add `Rect`, `REGIONS`, `EXCHANGES`, `COLUMNS`), `src/App.svelte` (replace), `src/app.css` (append), `tests/e2e/skeleton.spec.ts` (replace)
- Create: `src/ui/Header.svelte`, `src/ui/Stage.svelte`, `src/ui/Card.svelte`, `src/ui/CaptionBar.svelte`

**Interfaces:**
- Consumes: `stateAt`, `linesOf`, `StageState`, `Slot`, `Line` (Task 3); `describe`, `STATUS_ICON`, `MARKER_TEXT` (Task 5); `STEPS`, `TITLE`, `SCOPE_NOTE`, `NETWORK`, `CHAPTERS`, `RESPONSIBILITIES`, `SURFACES`, `kind`, `version` (Tasks 2 and 4); `load`, `save` (Task 6); `STAGE`, `fitScale` (Task 1).
- Produces: `REGIONS: Record<Party, Rect>`, `EXCHANGES: Rect`, `COLUMNS: Partial<Record<Party, number>>`. The DOM hooks that later plans and tests rely on:
  - `.stage`;
  - `[data-testid="counter"]` with text `"n / 36"`;
  - `#caption-heading` (focusable with `tabindex="-1"`);
  - `section[data-party="<party>"]`, and on The Network `data-link="OK|DEGRADED"` and `data-path="none|A|B"`;
  - `[data-surface="<surface>"]` with `data-received="<version id>"` (empty when idle);
  - `[data-version="<id>"]`: exactly one element per visible version. A slot's card carries its newest version; each earlier version is a span inside it. `.new` marks the card of a version that is new in this step;
  - `.exchanges li`: the current step's signals, handoffs and work, in order;
  - tick buttons named `"Go to <id>: <title>"`;
  - the view buttons `"Simple"` and `"Technical"` with `aria-pressed`.

This task applies the card visibility policy from Global Constraints. The exchange list is the skeleton's stand-in for lines. Plan 2 replaces it with labelled lines on the canvas, and replaces the rough geometry here with final slot positions.

- [ ] **Step 1: Write the failing browser tests**

Replace `tests/e2e/skeleton.spec.ts` with:

```ts
import { expect, test, type Page } from '@playwright/test';
import { linesOf, stateAt } from '../../src/model/state.ts';
import { STEPS } from '../../src/scenario/scenario.ts';

const counter = (page: Page) => page.getByTestId('counter');
const stepIndex = (id: string) => STEPS.findIndex((s) => s.id === id);
const tick = (page: Page, n: number) =>
  page.getByRole('button', { name: `Go to ${STEPS[n]!.id}: ${STEPS[n]!.title}` });

/** The DOM shows exactly stateAt(n): every card, new flag, surface, network fact and exchange. */
async function expectEndState(page: Page, n: number) {
  await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
  const s = stateAt(n);
  const dom = await page.evaluate(() => {
    const all = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];
    const net = document.querySelector<HTMLElement>('[data-party="network"]')!;
    return {
      versions: all('[data-version]').map((e) => e.dataset.version!),
      fresh: all('.new[data-version]').map((e) => e.dataset.version!),
      received: Object.fromEntries(
        all('[data-surface]')
          .filter((e) => e.dataset.received)
          .map((e) => [e.dataset.surface!, e.dataset.received!]),
      ),
      link: net.dataset.link,
      path: net.dataset.path,
      lines: all('.exchanges li').length,
    };
  });
  const id = STEPS[n]!.id;
  expect(dom.versions.toSorted(), id).toEqual(s.visible.toSorted());
  expect(dom.fresh.toSorted(), id).toEqual(s.newIds.toSorted());
  expect(dom.received, id).toEqual(s.surfaces);
  expect(dom.link, id).toBe(s.linkDegraded ? 'DEGRADED' : 'OK');
  expect(dom.path, id).toBe(s.acmePath ?? 'none');
  expect(dom.lines, id).toBe(linesOf(n).length);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('the app loads at the first beat', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How Network Automation Works');
  await expectEndState(page, 0);
});

test('the keyboard walks the whole story forward and back, showing each beat’s end state', async ({ page }) => {
  for (let n = 1; n < STEPS.length; n++) {
    await page.keyboard.press('ArrowRight');
    await expectEndState(page, n);
  }
  await page.keyboard.press('ArrowRight');
  await expectEndState(page, STEPS.length - 1);
  for (let n = STEPS.length - 2; n >= 0; n--) {
    await page.keyboard.press('ArrowLeft');
    await expectEndState(page, n);
  }
  await page.keyboard.press('ArrowLeft');
  await expectEndState(page, 0);
});

test('jumps in any order show the target beat’s end state', async ({ page }) => {
  for (const id of ['D8', 'P2', 'R14', 'P8', 'P1', 'R6', 'D1', 'R13', 'P14']) {
    await tick(page, stepIndex(id)).click();
    await expectEndState(page, stepIndex(id));
  }
  await page.getByRole('button', { name: 'Remediate' }).click();
  await expectEndState(page, stepIndex('R1'));
});

test('a step tick jumps to that beat and shows its end state', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to D8: Raise event' }).click();
  await expect(counter(page)).toHaveText('22 / 36');
  await expect(page.locator('[data-surface="faultMgmt"]')).toContainText('✕ VIOLATED');
  await expect(page.locator('[data-version="ev-viol"]')).toBeVisible();
});

test('the exchange list shows the step’s signals, handoffs and work in causal order', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to P7: Apply' }).click();
  await expect(page.locator('.exchanges li')).toHaveText([
    'Orchestrator ⇢ Executor: apply desired state v1',
    'Intent → Executor: Desired network state (v1)',
    'Executor: render',
    'Executor: apply',
    'Executor → The Network: Configuration change (v1)',
    'Executor ⇢ Orchestrator: applied v1',
  ]);
});

test('the view switch changes text only, keeps the step and is remembered', async ({ page }) => {
  await page.keyboard.press('ArrowRight');
  const caption = page.locator('.caption p').first();
  await expect(caption).toContainText('Through the Portal');
  await page.getByRole('button', { name: 'Technical' }).click();
  await expect(caption).toContainText('ACME-L3VPN-001');
  await expect(counter(page)).toHaveText('2 / 36');
  await expect(page.getByText('Values illustrative')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Technical' })).toHaveAttribute('aria-pressed', 'true');
});

test('switching views keeps every card, surface, network fact, exchange and focus', async ({ page }) => {
  const d8 = stepIndex('D8');
  await tick(page, d8).click();
  const technical = page.getByRole('button', { name: 'Technical' });
  await technical.focus();
  await page.keyboard.press('Enter');
  await expect(technical).toHaveAttribute('aria-pressed', 'true');
  await expect(technical).toBeFocused();
  await expect(page.locator('[data-version="ev-viol"]')).toContainText('event: acme-loss-violation');
  await expectEndState(page, d8);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Simple' })).toHaveAttribute('aria-pressed', 'true');
  await expectEndState(page, d8);
});

test('Portal shows what it received and keeps its own request', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to D7: Evaluate' }).click();
  const portal = page.locator('[data-surface="portal"]');
  await expect(portal).toContainText('▲ DEGRADED');
  await expect(portal.locator('[data-version="sr"]')).toContainText('Service request');
});

test('The Network keeps ground truth: degraded link, interface still UP as plain text', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to R14: Closing' }).click();
  const net = page.locator('section[data-party="network"]');
  await expect(net).toContainText('▲ DEGRADED');
  await expect(net).toContainText('path B');
  await expect(page.locator('.chip', { hasText: 'UP' })).toHaveCount(0);
});

test('nothing in the stage overflows, in any beat or either view', async ({ page }) => {
  test.setTimeout(120_000);
  for (const view of ['Simple', 'Technical'] as const) {
    await page.getByRole('button', { name: view }).click();
    for (let n = 0; n < STEPS.length; n++) {
      await tick(page, n).click();
      await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
      const over = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.region, .card, .surface, .caption')]
          .filter((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
          .map((el) => el.dataset.party ?? el.dataset.version ?? el.dataset.surface ?? el.className),
      );
      expect(over, `${STEPS[n]!.id} ${view}`).toEqual([]);
    }
  }
});

// Review Focus 1
test('arrow keys still step the story while a header control has focus', async ({ page }) => {
  const technical = page.getByRole('button', { name: 'Technical' });
  await technical.focus();
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toHaveText('2 / 36');
  await expect(technical).toHaveAttribute('aria-pressed', 'false');
  await expect(technical).toBeFocused();
});

// Review Focus 2
test('modified arrows do not step the story', async ({ page }) => {
  for (const key of ['Alt+ArrowRight', 'Shift+ArrowRight', 'Control+ArrowRight']) {
    await page.keyboard.press(key);
    await expect(counter(page)).toHaveText('1 / 36');
  }
});

// Review Focus 3
test('Next on the last beat and Back on the first keep focus and stay put', async ({ page }) => {
  const back = page.getByRole('button', { name: '◄ Back' });
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText('1 / 36');
  await expect(back).toBeFocused();

  await page.getByRole('button', { name: 'Go to R14: Closing' }).click();
  const next = page.getByRole('button', { name: 'Next ►' });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText('36 / 36');
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute('aria-disabled', 'true');
});

// Review Focus 4: blocked storage, either at access or in its methods
const blockers: Record<string, () => void> = {
  'access to storage throws': () => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('SecurityError: storage blocked');
      },
    });
  },
  'the storage methods throw': () => {
    Storage.prototype.getItem = () => {
      throw new Error('SecurityError: denied');
    };
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError: full');
    };
  },
};
for (const [name, block] of Object.entries(blockers)) {
  test(`the app works when ${name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(block);
    await page.goto('/');
    await page.getByRole('button', { name: 'Technical' }).click();
    await expect(page.getByRole('button', { name: 'Technical' })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText('2 / 36');
    expect(errors).toEqual([]);
  });
}

// Review Focus 5, plus checklist 07 "fits at 1280×720 and 1920×1080"
for (const [w, h] of [
  [1280, 720],
  [1920, 1080],
  [1024, 640],
] as const) {
  test(`the whole stage fits ${w}×${h} without scrollbars`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const box = (await page.locator('.stage').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(-0.5);
    expect(box.y).toBeGreaterThanOrEqual(-0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(w + 0.5);
    expect(box.y + box.height).toBeLessThanOrEqual(h + 0.5);
    const scroll = await page.evaluate(() => {
      const el = document.scrollingElement!;
      return { x: el.scrollWidth - el.clientWidth, y: el.scrollHeight - el.clientHeight };
    });
    expect(scroll).toEqual({ x: 0, y: 0 });
  });
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test:e2e`
Expected: most tests FAIL because there is no counter, no ticks, no surfaces and no exchange list yet. The fit tests may already pass.

- [ ] **Step 3: Add the region geometry to `src/layout.ts`**

Append (and add the import at the top of the file):

```ts
import type { Party } from './scenario/types.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Spec §3 bands. Rough placement only; plan 2 sets the final geometry and draws lines.
export const REGIONS: Record<Party, Rect> = {
  presentation: { x: 16, y: 52, w: 1408, h: 96 },
  observability: { x: 16, y: 180, w: 500, h: 228 },
  collector: { x: 16, y: 416, w: 500, h: 144 },
  orchestrator: { x: 532, y: 180, w: 376, h: 380 },
  intent: { x: 924, y: 180, w: 500, h: 228 },
  executor: { x: 924, y: 416, w: 500, h: 144 },
  network: { x: 16, y: 568, w: 900, h: 192 },
};

/** The skeleton's list of this step's exchanges, until plan 2 draws them as lines. */
export const EXCHANGES: Rect = { x: 932, y: 568, w: 492, h: 192 };

/** Card columns per region (spec §3: Observability has a diagnosis and an evaluation column). */
export const COLUMNS: Partial<Record<Party, number>> = { observability: 2 };
```

- [ ] **Step 4: Create `src/ui/Card.svelte`**

```svelte
<script lang="ts">
  import { kind, version } from '../scenario/scenario.ts';
  import type { View } from '../scenario/types.ts';
  import type { Slot, StageState } from '../model/state.ts';
  import { MARKER_TEXT, STATUS_ICON } from '../model/describe.ts';

  let {
    slot,
    stage,
    view,
    compact = false,
  }: { slot: Slot; stage: StageState; view: View; compact?: boolean } = $props();

  const v = $derived(version(slot.versions.at(-1)!));
  const earlier = $derived(slot.versions.slice(0, -1).map(version));
  const isNew = $derived(stage.newIds.includes(v.id));
  const marker = (id: string) => stage.markers[id];
</script>

<!-- A plain element until plan 4's inspector gives cards something to do. -->
<div class="card" class:new={isNew} data-version={v.id}>
  <div class="head">
    <span class="type">{kind(v.kind).name} · {v.label}</span>
    {#if v.status}<span class="chip">{STATUS_ICON[v.status]} {v.status}</span>{/if}
    {#if marker(v.id)}<span class="marker">{MARKER_TEXT[marker(v.id)!]}</span>{/if}
    {#if earlier.length}
      <span class="earlier"
        >earlier:
        {#each earlier as e (e.id)}
          <span data-version={e.id}
            >{e.label}{#if e.status}
              {STATUS_ICON[e.status]} {e.status}{/if}{#if marker(e.id)}
              {MARKER_TEXT[marker(e.id)!]}{/if}</span
          >
        {/each}
      </span>
    {/if}
  </div>
  {#if isNew && !compact}
    {#if view === 'simple'}
      <p class="body">{v.meaning}</p>
    {:else}
      {#each v.technical as line, i (i)}<code class="line">{line}</code>{/each}
    {/if}
  {/if}
</div>
```

`compact` is for the Portal's own request, which the spec keeps as a single subdued line (§3).

- [ ] **Step 5: Create `src/ui/Stage.svelte`**

```svelte
<script lang="ts">
  import { NETWORK, RESPONSIBILITIES, SURFACES, kind, version } from '../scenario/scenario.ts';
  import type { Party, Surface, View } from '../scenario/types.ts';
  import type { Line, StageState } from '../model/state.ts';
  import { STATUS_ICON, describe } from '../model/describe.ts';
  import { COLUMNS, EXCHANGES, REGIONS, type Rect } from '../layout.ts';
  import Card from './Card.svelte';

  let { stage, lines, view }: { stage: StageState; lines: Line[]; view: View } = $props();

  const automation: Party[] = ['observability', 'collector', 'orchestrator', 'intent', 'executor'];
  const surfaces = Object.keys(SURFACES) as Surface[];
  const box = (r: Rect) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
  const subtitle = (p: Party) =>
    stage.work[p] ? `● ${stage.work[p]!.map((l) => l[view]).join(' · ')}` : RESPONSIBILITIES[p].role;
  const ownSlots = (s: Surface) =>
    (stage.slots.presentation ?? []).filter((slot) => kind(slot.kind).producerSurface === s);
</script>

<section
  class="region"
  data-party="presentation"
  aria-labelledby="h-presentation"
  style={box(REGIONS.presentation)}
>
  <h2 id="h-presentation">Presentation <span class="role">· {subtitle('presentation')}</span></h2>
  <div class="surfaces">
    {#each surfaces as s (s)}
      {@const received = stage.surfaces[s] ? version(stage.surfaces[s]!) : undefined}
      <div class="surface" data-surface={s} data-received={stage.surfaces[s] ?? ''}>
        <span class="type">{SURFACES[s]}</span>
        {#if received}
          <span class="received"
            >{kind(received.kind).name} · {received.label}
            {#if received.status}<span class="chip"
                >{STATUS_ICON[received.status]} {received.status}</span
              >{/if}</span
          >
        {:else if ownSlots(s).length === 0}
          <span class="idle">idle</span>
        {/if}
        {#each ownSlots(s) as slot (slot.kind)}
          <Card {slot} {stage} {view} compact />
        {/each}
      </div>
    {/each}
  </div>
</section>

{#each automation as p (p)}
  <section class="region" data-party={p} aria-labelledby="h-{p}" style={box(REGIONS[p])}>
    <h2 id="h-{p}">{RESPONSIBILITIES[p].name} <span class="role">· {subtitle(p)}</span></h2>
    <div class="cards" style:--cols={COLUMNS[p] ?? 1}>
      {#each stage.slots[p] ?? [] as slot (slot.kind)}
        <Card {slot} {stage} {view} />
      {/each}
    </div>
  </section>
{/each}

<section
  class="region network"
  data-party="network"
  data-link={stage.linkDegraded ? 'DEGRADED' : 'OK'}
  data-path={stage.acmePath ?? 'none'}
  aria-labelledby="h-network"
  style={box(REGIONS.network)}
>
  <h2 id="h-network">{RESPONSIBILITIES.network.name} <span class="role">· {subtitle('network')}</span></h2>
  <p>
    {NETWORK.link}:
    {#if stage.linkDegraded}
      <span class="chip">{STATUS_ICON.DEGRADED} DEGRADED</span> {NETWORK.linkDegraded[view]}
    {:else}
      {NETWORK.linkOk[view]}
    {/if}
  </p>
  <p>{NETWORK.device[view]}</p>
  <p>{NETWORK.acme[stage.acmePath ?? 'none'][view]}</p>
  <div class="cards">
    {#each stage.slots.network ?? [] as slot (slot.kind)}
      <Card {slot} {stage} {view} />
    {/each}
  </div>
</section>

<section class="region exchanges" aria-labelledby="h-exchanges" style={box(EXCHANGES)}>
  <h2 id="h-exchanges">This step <span class="role">· in causal order</span></h2>
  {#if lines.length}
    <ol>
      {#each lines as e, i (i)}<li class={e.t}>{describe(e, view)}</li>{/each}
    </ol>
  {:else}
    <p class="idle">no exchanges</p>
  {/if}
</section>
```

- [ ] **Step 6: Create `src/ui/Header.svelte`**

```svelte
<script lang="ts">
  import { CHAPTERS, STEPS, TITLE } from '../scenario/scenario.ts';
  import type { Chapter, View } from '../scenario/types.ts';

  let {
    step,
    view,
    onJump,
    onView,
  }: { step: number; view: View; onJump: (n: number) => void; onView: (v: View) => void } = $props();

  const chapters = Object.keys(CHAPTERS) as Chapter[];
  const indexed = STEPS.map((s, i) => ({ s, i }));
</script>

<header class="header">
  <h1>{TITLE}</h1>
  <nav aria-label="Story">
    {#each chapters as ch (ch)}
      <div class="chapter">
        <button
          class="chapter-name"
          class:current={STEPS[step]?.chapter === ch}
          onclick={() => onJump(STEPS.findIndex((s) => s.chapter === ch))}>{CHAPTERS[ch]}</button
        >
        {#each indexed.filter(({ s }) => s.chapter === ch) as { s, i } (s.id)}
          <button
            class="tick"
            aria-label="Go to {s.id}: {s.title}"
            aria-current={i === step ? 'step' : undefined}
            onclick={() => onJump(i)}
          ></button>
        {/each}
      </div>
    {/each}
  </nav>
  <!-- Toggle buttons, not radios: native radios use ←/→, which belong to the story (spec rev 2). -->
  <div class="view" role="group" aria-label="Detail level">
    <button aria-pressed={view === 'simple'} onclick={() => onView('simple')}>Simple</button>
    <button aria-pressed={view === 'technical'} onclick={() => onView('technical')}>Technical</button>
  </div>
</header>
```

- [ ] **Step 7: Create `src/ui/CaptionBar.svelte`**

```svelte
<script lang="ts">
  import { CHAPTERS, SCOPE_NOTE, STEPS } from '../scenario/scenario.ts';
  import type { View } from '../scenario/types.ts';

  let {
    step,
    view,
    onBack,
    onNext,
  }: { step: number; view: View; onBack: () => void; onNext: () => void } = $props();

  const s = $derived(STEPS[step]!);
  const atStart = $derived(step === 0);
  const atEnd = $derived(step === STEPS.length - 1);
</script>

<footer class="caption">
  <h2 id="caption-heading" tabindex="-1">
    {CHAPTERS[s.chapter]} · <span data-testid="counter">{step + 1} / {STEPS.length}</span> · {s.title}
  </h2>
  <p aria-live="polite">{s.caption[view]}</p>
  {#if view === 'technical'}
    <p class="scope">{SCOPE_NOTE}</p>
  {/if}
  <!-- aria-disabled, not disabled: a disabled button drops keyboard focus to <body>. -->
  <div class="nav">
    <button aria-disabled={atStart} onclick={() => !atStart && onBack()}>◄ Back</button>
    <button aria-disabled={atEnd} onclick={() => !atEnd && onNext()}>Next ►</button>
  </div>
</footer>
```

- [ ] **Step 8: Replace `src/App.svelte`**

```svelte
<script lang="ts">
  import { STEPS } from './scenario/scenario.ts';
  import type { View } from './scenario/types.ts';
  import { linesOf, stateAt } from './model/state.ts';
  import { fitScale, STAGE } from './layout.ts';
  import { load, save } from './storage.ts';
  import Header from './ui/Header.svelte';
  import Stage from './ui/Stage.svelte';
  import CaptionBar from './ui/CaptionBar.svelte';

  const VIEW_KEY = 'naf.view';

  let step = $state(0);
  let view = $state<View>(load(VIEW_KEY) === 'technical' ? 'technical' : 'simple');
  let innerWidth = $state(1440);
  let innerHeight = $state(900);
  const scale = $derived(fitScale(innerWidth, innerHeight));
  const stage = $derived(stateAt(step));
  const lines = $derived(linesOf(step));

  function go(n: number) {
    step = Math.max(0, Math.min(STEPS.length - 1, n));
  }

  function setView(v: View) {
    view = v;
    save(VIEW_KEY, v);
  }

  function onKeydown(e: KeyboardEvent) {
    // Modified arrows belong to the browser and OS (history, text selection, spaces).
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(step + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(step - 1);
    }
  }
</script>

<svelte:window bind:innerWidth bind:innerHeight onkeydown={onKeydown} />

<div class="viewport">
  <div
    class="stage"
    style:width="{STAGE.w}px"
    style:height="{STAGE.h}px"
    style:transform="translate(-50%, -50%) scale({scale})"
  >
    <Header {step} {view} onJump={go} onView={setView} />
    <Stage {stage} {lines} {view} />
    <CaptionBar {step} {view} onBack={() => go(step - 1)} onNext={() => go(step + 1)} />
  </div>
</div>
```

- [ ] **Step 9: Append the skeleton styles to `src/app.css`**

```css
.header {
  position: absolute;
  left: 0;
  top: 0;
  width: 1440px;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 16px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border);
}
.header h1 {
  font-size: 15px;
  margin: 0;
}
.header nav {
  display: flex;
  gap: 16px;
}
.chapter {
  display: flex;
  align-items: center;
  gap: 3px;
}
.chapter-name,
.view button,
.nav button {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 8px;
}
.chapter-name.current {
  border-color: var(--text);
}
.tick {
  width: 8px;
  height: 14px;
  padding: 0;
  background: var(--border);
  border: 0;
  border-radius: 2px;
}
.tick[aria-current='step'] {
  background: var(--text);
}
.view {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.view button[aria-pressed='true'] {
  border-color: var(--text);
  font-weight: 600;
}
/* Nothing scrolls or clips silently: the overflow test fails instead. */
.region {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 10px 6px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.25;
}
.region h2 {
  font-size: 12px;
  margin: 0;
  flex-shrink: 0;
}
.region p {
  margin: 0;
}
.role,
.idle,
.earlier {
  color: var(--muted);
  font-weight: 400;
}
.cards {
  display: grid;
  grid-template-columns: repeat(var(--cols, 1), minmax(0, 1fr));
  gap: 4px;
  align-items: start;
}
.surfaces {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}
.card,
.surface {
  box-sizing: border-box;
  padding: 2px 6px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.surface {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.card:not(.new) {
  color: var(--muted);
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 6px;
}
.type {
  font-weight: 600;
}
.earlier span + span::before {
  content: '· ';
}
.body {
  margin: 2px 0 0;
}
.line {
  display: block;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.chip {
  border: 1px solid currentColor;
  border-radius: 10px;
  padding: 0 6px;
  font-size: 11px;
}
.exchanges ol {
  margin: 0;
  padding-left: 18px;
}
.caption {
  position: absolute;
  left: 16px;
  top: 768px;
  width: 1408px;
  height: 124px;
  box-sizing: border-box;
  padding: 8px 220px 8px 14px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.caption h2 {
  font-size: 13px;
  margin: 0 0 4px;
}
.caption p {
  margin: 0 0 4px;
  font-size: 15px;
  line-height: 1.45;
}
.caption .scope {
  font-size: 12px;
  color: var(--muted);
}
.nav {
  position: absolute;
  right: 14px;
  top: 8px;
  display: flex;
  gap: 8px;
}
.nav button[aria-disabled='true'] {
  color: var(--muted);
}
```

- [ ] **Step 10: Run the browser tests**

Run: `npm run test:e2e`
Expected: PASS (all 18 tests).

If the overflow test fails, its message names the beat, the view and the element. Fix it with skeleton CSS only: columns, padding, gaps, or font sizes down to 11px. Never use `overflow: auto`, ellipsis or `display: none`, and never weaken the test. Fit problems are a layout matter, so don't shorten story copy to pass. If a region can't be made to fit within the spec §3 bands, stop and report which beat and region fail, because plan 2's geometry depends on it.

- [ ] **Step 11: Run the type and format checks**

Run: `npx prettier --write . && npm run check`
Expected: 0 errors and 0 warnings. Cards are plain elements, so there is no interactive-element warning to suppress.

- [ ] **Step 12: Commit**

```bash
git add src tests/e2e
git commit -m "feat: plain stage with slots, exchange list, keyboard navigation and Simple/Technical switch"
```

---

### Task 8: Verify, and record the spec changes

**Model:** sonnet

**Files:**
- Modify: `docs/specs/2026-10-10-naf-explorer-design.md` (§3 card placement, §4.1 signal version, §11 view switch, revision log)

- [ ] **Step 1: Record the spec changes**

In §3, replace

```
  - Versioned collections (derived intent, desired state, configuration change, observed state) show **v2 stacked over v1**.
```

with

```
  - **One slot per artifact kind** in its producer's region. The slot's card shows the kind's newest version (type, label, status or marker). Earlier versions stay visible inside the same card as a subdued "earlier:" line with their status or marker; this generalises "v2 stacked over v1" to every kind with several versions.
  - **A card shows its body** (meaning or Technical lines) only in the step where its version is new. The pacing rule means at most one card per region is expanded at a time; the inspector shows any body later.
  - Nothing on the stage scrolls or clips: regions, cards, surfaces and the caption must fit their content in every beat and both views.
```

In §4.1, replace

```
  | { t: 'signal'; signal: SignalId; from: Party; to: Party; version?: string }
```

with

```
  | { t: 'signal'; signal: SignalId; from: Party; to: Party; version?: VersionId } // a desired-state version
```

In §11, replace

```
  - the view switch is a radio group.
```

with

```
  - the view switch is two toggle buttons with `aria-pressed` inside a labelled group (native radios would consume ← and →).
```

Append to the revision log:

```
- **rev 2 (plan 1, with an external plan review):** the view switch uses toggle buttons with `aria-pressed` instead of a radio group, because native radios use ← and →, which step the story. Card visibility is one slot per kind, with earlier versions on an "earlier:" line and the body shown only when new, because the producer regions can't hold every version's body. A signal's `version` names the desired-state version id, so that request/answer pairing can be checked by version.
```

- [ ] **Step 2: Run the full verification**

Run: `npm run verify`
Expected: Prettier is clean; `svelte-check` reports 0 errors and 0 warnings; all Vitest suites pass; the build succeeds; all Playwright tests pass. If anything fails, fix the cause; do not skip the check.

- [ ] **Step 3: Demo check**

Run `npm run dev` and open the printed URL. Step through P1 → R14 with → and confirm by eye:
- each beat's new cards are highlighted and show their body, while earlier cards show one line;
- the exchange list shows each beat's signals (⇢), handoffs (→) and work in order;
- the Portal moves from HEALTHY to DEGRADED and back to HEALTHY;
- Fault Management shows VIOLATED from D8 and CLEARED from R13;
- ITSM shows the repair event at R14;
- The Network shows ▲ DEGRADED from D1 and path B from R6.

Stop the dev server afterwards.

- [ ] **Step 4: Commit**

```bash
git add docs/specs/2026-10-10-naf-explorer-design.md
git commit -m "docs: spec rev 2, card visibility policy, signal versions, view switch toggles"
```

---

## External review disposition (plan rev 2)

| # | Finding | Disposition |
|---|---|---|
| 1 | `stateAt` drops signals and handoffs | **Accepted; a confirmed gap.** Spec §4.2 already defines `linesOf`, but plan 1 had omitted it. Task 3 adds it, and Task 7 shows the current step's exchanges as an ordered list until plan 2 draws lines. |
| 2 | Cards overflow regions; `overflow: auto` hides it | **Accepted; a confirmed defect.** By R14, Observability holds 12 versions. Spec rev 2 sets the visibility policy (one slot per kind, earlier versions on one line, body only when new). Everything uses `overflow: hidden`, and an overflow test covers every beat in both views (Task 7). |
| 3 | Pairing matched answer names only | **Accepted; a confirmed defect.** `pairingErrors` checks the responder, the answer and the desired-state version, with fixture tests for wrong, duplicate, unsolicited and missing answers (Task 4). Signal versions are now version ids. |
| 4 | Cached intent unexplained | **Partly accepted.** Modelling cache population is **rejected**: brief 02 and lesson 4 decided it is out of scope and not drawn, and spec §15 defers it. Instead, the enriched observations name the network intent version they map from, a test checks that it is the version in force and that ACME is tagged to its actual path, and R10's Technical caption carries the scope note. |
| 5 | Path B health not backed by measurements | **Accepted; a confirmed defect** (lesson 2). The raw, normalized and enriched data now carry the path B link measurements, and path B health names its window and says "link telemetry only". R2 distinguishes link health from service health. Status stays HEALTHY (`07`). |
| 6 | Story text in UI components | **Accepted; a confirmed defect** against the plan's own constraint. `TITLE`, `SCOPE_NOTE` and `NETWORK` move to `scenario.ts`, and status and marker words to `model/describe.ts`. |
| 7 | Raw signals and the Portal request had no card or highlight | **Accepted; a confirmed defect.** The Network renders its raw-signal slot, and the Portal's request is a compact card. A browser test checks that every visible version has exactly one element and every new version is highlighted. |
| 8 | Causal tests too weak; path test too broad | **Accepted.** Added: required lineage per kind, freshness (each input is the newest of its kind), the apply → read back → check drift chain by version id, and verification before workflow completion. The path test is narrowed to `07`'s rule: Orchestrator names only paths that Observability told it, and the decision names none. |
| 9 | D5 statement inaccurate | **Accepted.** The caption now says a one-way CPH01→AAR01 probe would miss the loss, and explains that the stateful reflector's sequence numbers separate the two directions. |
| — | Browser coverage | **Accepted:** backward walk and jumps compared against `stateAt`, full state and focus kept across view switches, the internal overflow test, and storage methods that throw (unit and browser). |
| — | Noninteractive cards | **Accepted.** Cards are plain elements until plan 4. |
| — | Validate a UI slice before all 36 beats | **Declined.** All 36 beats are already authored in this plan, so finishing them costs nothing extra. The risk a slice would catch (content not fitting) is covered by the overflow test over every beat. A fit failure stops Task 7 with a report rather than reshaping copy. |

