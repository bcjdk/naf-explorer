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
    expect(pairingErrors(story(apply, sig('applied', 'executor', 'orchestrator', 'ds1')))).toEqual(
      [],
    );
  });

  it('rejects an answer from the wrong party', () => {
    expect(
      pairingErrors(story(apply, sig('applied', 'collector', 'orchestrator', 'ds1'))),
    ).toHaveLength(2);
  });

  it('rejects an answer for the wrong version', () => {
    expect(
      pairingErrors(story(apply, sig('applied', 'executor', 'orchestrator', 'ds2'))),
    ).toHaveLength(2);
  });

  it('rejects the wrong answer', () => {
    expect(
      pairingErrors(story(apply, sig('inSync', 'executor', 'orchestrator', 'ds1'))),
    ).toHaveLength(2);
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
