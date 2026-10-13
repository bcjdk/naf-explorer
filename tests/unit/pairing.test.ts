import { describe, expect, it } from 'vitest';
import type { Event, Party, SignalId, Step } from '../../src/scenario/types.ts';
import { pairingErrors } from './pairing.ts';

const sig = (signal: SignalId, from: Party, to: Party, version?: string): Event =>
  version ? { t: 'signal', signal, from, to, version } : { t: 'signal', signal, from, to };
const story = (...events: Event[]): Step[] => [
  { id: 'S1', chapter: 'provision', title: 's', caption: { simple: 's', technical: 's' }, events },
];
const check = sig('checkConformance', 'orchestrator', 'observability', 'ds1');

describe('pairingErrors', () => {
  it('accepts a request answered by the party asked, for the same version', () => {
    expect(
      pairingErrors(story(check, sig('inSync', 'observability', 'orchestrator', 'ds1'))),
    ).toEqual([]);
  });

  it('rejects an answer from the wrong party', () => {
    expect(
      pairingErrors(story(check, sig('inSync', 'collector', 'orchestrator', 'ds1'))),
    ).toHaveLength(2);
  });

  it('rejects an answer for the wrong version', () => {
    expect(
      pairingErrors(story(check, sig('inSync', 'observability', 'orchestrator', 'ds2'))),
    ).toHaveLength(2);
  });

  it('rejects the wrong answer', () => {
    expect(
      pairingErrors(story(check, sig('readBackDone', 'observability', 'orchestrator', 'ds1'))),
    ).toHaveLength(2);
  });

  it('rejects a duplicate answer', () => {
    const inSync = sig('inSync', 'observability', 'orchestrator', 'ds1');
    expect(pairingErrors(story(check, inSync, inSync))).toEqual([
      'S1: unsolicited inSync from observability for ds1',
    ]);
  });

  it('rejects an unsolicited answer', () => {
    expect(pairingErrors(story(sig('readBackDone', 'collector', 'orchestrator')))).toEqual([
      'S1: unsolicited readBackDone from collector',
    ]);
  });

  it('checks the version an apply request names (ADR 0002)', () => {
    const order: Event = { t: 'handoff', version: 'ar1', from: 'orchestrator', to: 'executor' };
    expect(pairingErrors(story(order, sig('applied', 'executor', 'orchestrator', 'ds1')))).toEqual(
      [],
    );
    expect(
      pairingErrors(story(order, sig('applied', 'executor', 'orchestrator', 'ds2'))),
    ).toHaveLength(2);
  });

  it('rejects a missing answer, before the next request and at the end', () => {
    expect(pairingErrors(story(check, sig('readBack', 'orchestrator', 'collector')))).toEqual([
      'S1: new request while waiting for inSync from observability for ds1',
      'end: missing readBackDone from collector',
    ]);
  });
});
