import { describe, expect, it } from 'vitest';
import {
  KINDS,
  RESPONSIBILITIES,
  SIGNALS,
  STEPS,
  SURFACES,
  SURFACE_ROLES,
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
        expect(i.party, id).toBe(k.producer);
        expect(i.by, id).toBe(k.producer);
        const handed = section(i, 'Handed to');
        for (const c of k.consumers) {
          const item = handed.find((x) => x.party === c);
          expect(item?.text, `${id} handed to ${c}`).toContain(RESPONSIBILITIES[c].name);
          expect(item?.target, `${id} ${c} link`).toEqual({ t: 'responsibility', party: c });
          expect(item?.note, `${id} ${c} uses`).toBe(k.uses?.[c]);
        }
      }
    });
    const ss = inspect({ t: 'artifact', version: 'ss1' }, at('P15'), 'simple');
    expect(texts(ss, 'Handed to').join(' ')).toContain(SURFACES.portal);
    const ev = inspect({ t: 'artifact', version: 'ev-viol' }, at('D10'), 'simple');
    expect(texts(ev, 'Handed to').join(' ')).toContain(SURFACES.faultMgmt);
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

  it('shows the status as a chip and the marker as text', () => {
    const ds = inspect({ t: 'artifact', version: 'ds1' }, at('P10'), 'simple');
    expect(texts(ds, 'Status')).toEqual(['= IN SYNC']);
    const ss = inspect({ t: 'artifact', version: 'ss1' }, at('P15'), 'simple');
    expect(section(ss, 'Status')[0]?.status).toBe(version('ss1').status);
  });

  it('draws each section in its look, and the payload as code', () => {
    const i = inspect({ t: 'artifact', version: 'ds1' }, at('P5'), 'technical');
    const look = Object.fromEntries(i.sections.map((s) => [s.heading, s.look]));
    expect(look).toMatchObject({
      'What it is': 'text',
      Meaning: 'text',
      'Handed to': 'blocks',
      'Payload (illustrative)': 'code',
    });
    for (const l of section(i, 'Lineage'))
      expect(l.party).toBe(producerOf((l.target as { version: string }).version));
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
          expect(texts(i, 'Answered by')[0]).toBe(
            a
              ? a in SIGNALS
                ? SIGNALS[a as keyof typeof SIGNALS].label
                : kind(a as (typeof KINDS)[number]['id']).name
              : 'Nothing: it answers an earlier request.',
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

  it('names answers in plain words, not by mirroring the catalog', () => {
    const p6 = STEPS.findIndex((s) => s.id === 'P6');
    const p8 = STEPS.findIndex((s) => s.id === 'P8');
    const onboard = inspect(
      { t: 'line', step: p6, key: 'orchestrator>observability:onboard' },
      p6,
      'simple',
    );
    expect(texts(onboard, 'Answered by')).toEqual(['assurance onboarded']);
    const applied = inspect(
      { t: 'line', step: p8, key: 'executor>orchestrator:applied' },
      p8,
      'simple',
    );
    expect(texts(applied, 'Answered by')).toEqual(['Nothing: it answers an earlier request.']);
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
  it('explains each surface under "What it is"', () => {
    for (const s of Object.keys(SURFACES) as (keyof typeof SURFACES)[])
      expect(
        texts(inspect({ t: 'surface', surface: s }, at('P15'), 'simple'), 'What it is'),
      ).toEqual([SURFACE_ROLES[s]]);
  });
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

describe('inspect: identity colour and party links (design uplift §4.1, §4.3)', () => {
  it('colours each view by its identity, dashed for signals', () => {
    const n = at('P10');
    expect(inspect({ t: 'responsibility', party: 'collector' }, n, 'simple').party).toBe(
      'collector',
    );
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

describe('inspect: producer surface label', () => {
  it('names the Portal as the service request’s producer surface', () => {
    expect(inspect({ t: 'artifact', version: 'sr' }, at('P15'), 'simple').byLabel).toBe(
      'Presentation (Portal)',
    );
    expect(inspect({ t: 'artifact', version: 'ds1' }, at('P15'), 'simple').byLabel).toBeUndefined();
  });
});
