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
    // An apply request names the desired-state version its answer must be for (ADR 0002).
    return answer ? { answer, from: e.to, version: version(e.version).names } : undefined;
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
