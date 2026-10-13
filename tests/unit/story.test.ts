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
  it('has the 40 beats of spec §5 in order', () => {
    const ids = [
      ...Array.from({ length: 15 }, (_, i) => `P${i + 1}`),
      ...Array.from({ length: 10 }, (_, i) => `D${i + 1}`),
      ...Array.from({ length: 15 }, (_, i) => `R${i + 1}`),
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
      for (const parent of v.lineage)
        expect(before(appearAt(parent), own), `${v.id} ← ${parent}`).toBe(true);
    }
  });

  it('keeps every artifact visible once it has appeared', () => {
    for (let n = 0; n < last; n++) {
      const next = new Set(stateAt(n + 1).visible);
      for (const id of stateAt(n).visible)
        expect(next.has(id), `${id} at ${STEPS[n + 1]!.id}`).toBe(true);
    }
  });

  it('marks only artifacts that are already visible', () => {
    for (const f of of('mark')) expect(before(appearAt(f.e.version), f)).toBe(true);
  });
});

describe('appearance', () => {
  it('has every version appear in exactly one step, so the inspector can say where', () => {
    for (const v of VERSIONS)
      expect(
        of('appear').filter((f) => f.e.version === v.id),
        v.id,
      ).toHaveLength(1);
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
    remediationDecision: ['event', 'pathHealth'],
    repairRequest: ['event'],
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
        expect(
          newer.map((f) => f.e.version),
          `${v.id} ← stale ${parent}`,
        ).toEqual([]);
      }
    }
  });

  it('links the events, decision and network intent v2 to what caused them', () => {
    const has = (id: string, parents: string[]) =>
      expect(version(id).lineage, id).toEqual(expect.arrayContaining(parents));
    has('ev-viol', ['ss2', 'evid']);
    has('ev-clear', ['ev-viol', 'ss3']);
    has('ev-link', ['evid']);
    expect(version('rr').lineage).toEqual(['ev-link']);
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
      expect(
        [e.from, e.to].filter((p) => p === 'orchestrator'),
        e.signal,
      ).toHaveLength(1);
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

  it('gives Orchestrator’s own artifacts no Intent content: no Intent parent, no configuration values', () => {
    for (const v of VERSIONS.filter((x) => producerOf(x.id) === 'orchestrator')) {
      for (const parent of v.lineage)
        expect(producerOf(parent), `${v.id} ← ${parent}`).not.toBe('intent');
      if (v.kind === 'applyRequest')
        expect(textOf(v.id), v.id).not.toMatch(/sr-policy|vrf|colour|rd\/rt/i);
    }
  });

  it('never hands Intent content to Orchestrator', () => {
    for (const f of of('handoff')) {
      if (producerOf(f.e.version) === 'intent')
        expect(f.e.to, f.e.version).not.toBe('orchestrator');
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
        .filter(
          (f) => f.e.version === v && (f.e.to === 'presentation' || f.e.from === 'presentation'),
        )
        .map((f) => f.e.surface);
    expect(route('sr')).toEqual(['portal']);
    expect(route('ev-viol')).toEqual(['faultMgmt']);
    expect(route('ev-clear')).toEqual(['faultMgmt']);
    expect(route('ev-link')).toEqual(['faultMgmt']);
    expect(route('rr')).toEqual(['itsm']);
    for (const v of ['ss1', 'ss2', 'ss3']) expect(route(v)).toEqual(['portal']);
  });

  it('has every piece of work done by its owner', () => {
    for (const { e } of of('work'))
      expect(ALLOWED_WORK[e.owner], `${e.owner} ${e.verb}`).toContain(e.verb);
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

describe('workflow control (ADR 0001, ADR 0002)', () => {
  // An apply is answered by Executor's "applied" for the desired-state version it took from Intent.
  const applies = of('signal').filter((f) => f.e.signal === 'applied');
  const orders = of('handoff').filter((f) => version(f.e.version).kind === 'applyRequest');
  const isSignal = (e: Event | undefined, signal: string, from: string, to: string, v?: string) =>
    expect(e).toEqual(
      v ? { t: 'signal', signal, from, to, version: v } : { t: 'signal', signal, from, to },
    );

  it('orders each apply in its own beat, then applies, reads back and checks drift for one version', () => {
    expect(applies).toHaveLength(2);
    expect(orders).toHaveLength(2);
    applies.forEach(({ e, si }, k) => {
      const d = e.version!;
      // Orchestrator's own work order goes to Executor in the beat just before the apply (ADR 0002).
      const order = orders[k]!;
      expect(order.si, STEPS[si]!.id).toBe(si - 1);
      expect([order.e.from, order.e.to]).toEqual(['orchestrator', 'executor']);
      // The order names exactly the version Executor then takes from Intent and reports applied.
      expect(version(order.e.version).names).toBe(d);
      expect(version(d).kind).toBe('desiredState');
      const [applyStep, readStep, driftStep] = [STEPS[si]!, STEPS[si + 1]!, STEPS[si + 2]!];

      // Apply: Executor takes this version from Intent, and the change it makes derives from it.
      expect(applyStep.events).toContainEqual({
        t: 'handoff',
        version: d,
        from: 'intent',
        to: 'executor',
      });
      const change = of('appear').find(
        (f) => f.si === si && version(f.e.version).kind === 'configChange',
      )!.e.version;
      expect(version(change).lineage).toEqual([d]);
      isSignal(applyStep.events.at(-1), 'applied', 'executor', 'orchestrator', d);

      // Read back: the observed state handed to Intent is a read-back of that change.
      isSignal(readStep.events[0], 'readBack', 'orchestrator', 'collector');
      const observed = of('handoff').find(
        (f) =>
          f.si === si + 1 && f.e.to === 'intent' && version(f.e.version).kind === 'observedState',
      );
      expect(observed, readStep.id).toBeDefined();
      const readBack = version(observed!.e.version).lineage[0]!;
      expect(version(readBack).lineage, readStep.id).toEqual([change]);
      isSignal(readStep.events.at(-1), 'readBackDone', 'collector', 'orchestrator');

      // Check drift: the same desired-state version is compared and marked in sync.
      isSignal(driftStep.events[0], 'checkDrift', 'orchestrator', 'intent', d);
      expect(driftStep.events).toContainEqual({ t: 'mark', version: d, marker: 'IN_SYNC' });
      isSignal(driftStep.events.at(-1), 'inSync', 'intent', 'orchestrator', d);
    });
  });

  it('applies only after desired state ready for that version, and first after assurance is onboarded', () => {
    applies.forEach((a, k) => {
      const ready = of('signal').find(
        (f) => f.e.signal === 'desiredStateReady' && f.e.version === a.e.version,
      );
      expect(ready && before(ready, orders[k]!), a.e.version).toBe(true);
    });
    const onboarded = of('signal').find((f) => f.e.signal === 'onboarded');
    expect(onboarded && before(onboarded, orders[0]!)).toBe(true);
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
      const inSync = of('signal')
        .filter((f) => f.e.signal === 'inSync' && inside(f))
        .at(-1);
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
    const PATH = /\bpath:? [AB]\b|\bvia (?:ODE|KOL)01\b|CPH01–(?:ODE|KOL)01–AAR01/;
    const PATHS = new RegExp(PATH, 'g'); // for match(); toMatch() needs the non-global form
    const told = new Set<string>();
    for (const { e } of flat) {
      if (e.t === 'handoff' && e.to === 'orchestrator' && e.from === 'observability') {
        for (const m of textOf(e.version).match(PATHS) ?? []) told.add(m);
      }
      if (e.t === 'appear' && producerOf(e.version) === 'orchestrator') {
        for (const m of textOf(e.version).match(PATHS) ?? [])
          expect(told, `${e.version} names ${m}`).toContain(m);
      }
      if (e.t === 'signal' && e.from === 'orchestrator')
        expect(SIGNALS[e.signal].label).not.toMatch(PATH);
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
    for (const id of ['ni2', 'ds2', 'cc2', 'obs2'])
      expect(STEPS[appearAt(id).si]!.chapter, id).toBe('remediate');
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
    const [apply1, reroute] = [stepIndex('P8'), stepIndex('R7')];
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
      const latest = stateAt(n)
        .visible.filter((id) => version(id).kind === 'networkIntent')
        .at(-1)!;
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
    for (const v of VERSIONS.filter((x) => x.kind === 'pathHealth'))
      expect(v.status).toBe('HEALTHY');
    expect(VERSIONS.filter((v) => v.status === 'VIOLATED').map((v) => v.id)).toEqual(['ev-viol']);
    expect(version('ev-clear').status).toBe('CLEARED');
  });

  it('gives evidence, the repair request, Collector and Network artifacts no status', () => {
    const none = VERSIONS.filter(
      (v) =>
        v.kind === 'evidence' ||
        v.kind === 'repairRequest' ||
        v.id === 'ev-link' ||
        ['collector', 'network'].includes(producerOf(v.id)),
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
      expect(
        shown.map((id) => version(id).status),
        STEPS[n]!.id,
      ).not.toContain('VIOLATED');
    }
  });
});

describe('the link repair (ADR 0004, plan 6b)', () => {
  it('asks ITSM for the repair in Detect, from the link event, before any service is judged', () => {
    const link = appearAt('ev-link');
    const ticket = appearAt('rr');
    expect(STEPS[ticket.si]!.chapter).toBe('detect');
    expect(before(link, ticket)).toBe(true);
    expect(before(ticket, appearAt('ss2'))).toBe(true);
    expect(before(ticket, appearAt('ev-viol'))).toBe(true);
    // The link event names no service; the ticket names only what Orchestrator was told.
    expect(textOf('ev-link')).not.toMatch(/ACME|path [AB]/);
    expect(textOf('rr')).not.toMatch(/ACME|path [AB]|HEALTHY|DEGRADED/);
  });
});
