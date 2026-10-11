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
        for (const c of k.consumers)
          expect(used, `${id} used by ${c}`).toContain(RESPONSIBILITIES[c].name);
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
    expect(inspect({ t: 'artifact', version: 'ds1' }, at('P2'), 'simple').note).toBe(
      'Appears in P5',
    );
  });

  it('shows the Technical payload only in the Technical view', () => {
    const t = { t: 'artifact', version: 'ds1' } as const;
    expect(section(inspect(t, at('P5'), 'simple'), 'Payload (illustrative)')).toEqual([]);
    expect(texts(inspect(t, at('P5'), 'technical'), 'Payload (illustrative)')).toEqual(
      version('ds1').technical,
    );
  });

  it('shows the marker the version has at that beat', () => {
    expect(
      texts(inspect({ t: 'artifact', version: 'ds1' }, at('P10'), 'simple'), 'Status'),
    ).toEqual(['= IN SYNC']);
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
        expect(section(i, 'In this step').length, `${step.id} ${p}`).toBe(
          Math.max(involved.length, 1),
        );
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
          if (a)
            expect(texts(i, 'Answered by')[0]).toBe(
              a in SIGNALS
                ? SIGNALS[a as keyof typeof SIGNALS].label
                : kind(a as (typeof KINDS)[number]['id']).name,
            );
        } else {
          expect(i.kind).toBe('Handoff');
          expect(texts(i, 'Why the receiver needs it')[0]).toBe(
            kind(version(e.version).kind).uses![e.to],
          );
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
    expect(section(i, 'Its own requests').map((x) => x.target)).toEqual([
      { t: 'artifact', version: 'sr' },
    ]);
    expect(
      texts(inspect({ t: 'surface', surface: 'api' }, at('P15'), 'simple'), 'Showing'),
    ).toEqual(['Nothing received yet.']);
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
