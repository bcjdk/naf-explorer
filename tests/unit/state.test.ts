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
      { t: 'mark', version: 'a', marker: 'UNCHANGED' },
      { t: 'network', acmePath: 'A' },
      { t: 'network', link: { id: 'CPH01-ODE01', status: 'DEGRADED' } },
      { t: 'handoff', version: 'b', from: 'presentation', to: 'orchestrator', surface: 'portal' },
      {
        t: 'signal',
        signal: 'checkConformance',
        from: 'orchestrator',
        to: 'observability',
        version: 'a',
      },
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
      touched: [],
      markers: {},
      surfaces: {},
      orders: {},
      slots: {},
      linkDegraded: false,
      faultNow: false,
      acmePath: null,
      work: {},
      waiting: null,
      progress: {},
    });
  });

  it('accumulates visible versions and flags only this step’s as new', () => {
    expect(at(0).newIds).toEqual(['a']);
    expect(at(1).visible).toEqual(['a', 'b', 'c']);
    expect(at(1).newIds).toEqual(['b', 'c']);
  });

  it('lists the earlier versions this step marks or hands on', () => {
    expect(at(0).touched).toEqual(['a']);
    expect(at(1).touched).toEqual(['a', 'b']);
  });

  it('tracks the answer Orchestrator is still waiting for', () => {
    expect(at(0).waiting).toBeNull();
    expect(at(1).waiting).toEqual({ answer: 'inSync', from: 'observability' });
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
    expect(s.markers).toEqual({ a: 'UNCHANGED' });
    expect(s.acmePath).toBe('A');
    expect(s.linkDegraded).toBe(true);
    // The fault lights up The Network only in the step it happens.
    expect(s.faultNow).toBe(true);
    expect(at(2).faultNow).toBe(false);
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
      {
        t: 'signal',
        signal: 'checkConformance',
        from: 'orchestrator',
        to: 'observability',
        version: 'a',
      },
    ]);
  });
});

describe('order status (ADR 0005)', () => {
  it('keeps the Portal showing the service state when Orchestrator reports the order complete', async () => {
    const { STEPS: steps } = await import('../../src/scenario/scenario.ts');
    const p15 = steps.findIndex((s) => s.id === 'P15');
    const s = stateAt(p15);
    expect(s.surfaces.portal).toBe('ss1');
    expect(s.orders.portal).toBe('wf-prov');
    expect(stateAt(p15 - 1).orders.portal).toBeUndefined();
  });
});
