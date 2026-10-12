import { describe, expect, it } from 'vitest';
import { ALLOWED_WORK, KINDS, SIGNALS, kind } from '../../src/scenario/scenario.ts';

const consumersOf = (p: string) => KINDS.filter((k) => k.consumers.includes(p as never));
const producedBy = (p: string) => KINDS.filter((k) => k.producer === p);

describe('artifact catalog (brief 02, 03; checklist 07)', () => {
  it('has the 20 artifact kinds of brief 03 (ADR 0002), each once', () => {
    expect(KINDS).toHaveLength(20);
    expect(new Set(KINDS.map((k) => k.id)).size).toBe(20);
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

  it('gives Executor only desired state from Intent and apply requests from Orchestrator, and has it produce only configuration changes', () => {
    expect(consumersOf('executor').map((k) => [k.producer, k.id])).toEqual([
      ['intent', 'desiredState'],
      ['orchestrator', 'applyRequest'],
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
    expect(kind('applyRequest').answeredBy).toBe('applied');
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

describe('artifact catalog: inspector', () => {
  it('every consumer of every artifact kind has a reason to use it (inspector handoff view)', () => {
    for (const k of KINDS)
      for (const c of k.consumers) expect(k.uses?.[c], `${k.id} → ${c}`).toMatch(/\S/);
  });
});
