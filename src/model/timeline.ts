import { STEPS, kind, version } from '../scenario/scenario.ts';
import type { Party, Step } from '../scenario/types.ts';
import { lineKey, stateAt } from './state.ts';

type MotionKind = 'work' | 'line' | 'appear' | 'mark' | 'network' | 'gain' | 'show' | 'pulse';

/** One piece of a beat's motion (spec §8). `event` is the index of the step event that causes it. */
export interface MotionSlot {
  kind: MotionKind;
  target: string;
  event: number;
  start: number;
  duration: number;
}

/** Every duration, in ms, in one place. A pulse runs three times within its duration. */
const TIMING = {
  work: 500,
  line: 1200,
  appear: 500,
  mark: 500,
  network: 700,
  gain: 700,
  pulse: 1800,
} as const;

/**
 * The motion of step n. Events play one after another in their causal order, so an artifact appears only
 * after everything sent to its producer before it has arrived. Receivers gain a handoff when its line
 * arrives, and a status chip whose value changed pulses after it shows.
 */
export function timeline(n: number, steps: readonly Step[] = STEPS): MotionSlot[] {
  const step = steps[n];
  if (!step) return [];
  const before = stateAt(n - 1, steps);
  const status = (id?: string) => (id ? version(id).status : undefined);
  const out: MotionSlot[] = [];
  const add = (
    kind: MotionKind,
    target: string,
    event: number,
    start: number,
    duration: number,
  ) => {
    out.push({ kind, target, event, start, duration });
    return start + duration;
  };
  const working = new Set<Party>();
  let t = 0;
  step.events.forEach((e, i) => {
    switch (e.t) {
      case 'work':
        // The region lights up and its work label shows once; later work by the same party takes time only.
        if (!working.has(e.owner)) add('work', e.owner, i, t, TIMING.work);
        working.add(e.owner);
        t += TIMING.work;
        break;
      case 'signal':
      case 'handoff': {
        const arrived = add('line', lineKey(e), i, t, TIMING.line);
        if (e.t === 'handoff') {
          const to = e.surface ? `surface:${e.surface}` : e.to;
          add('gain', to, i, arrived, TIMING.gain);
          // A surface shows what it received only once the handoff has reached it.
          if (e.surface) add('show', `${e.surface}|${e.version}`, i, arrived, TIMING.gain);
          if (
            e.surface &&
            status(e.version) &&
            status(e.version) !== status(before.surfaces[e.surface])
          )
            add('pulse', to, i, arrived, TIMING.pulse);
        }
        t = arrived;
        break;
      }
      case 'appear': {
        const shown = add('appear', e.version, i, t, TIMING.appear);
        const v = version(e.version);
        const was = before.slots[kind(v.kind).producer]
          ?.find((s) => s.kind === v.kind)
          ?.versions.at(-1);
        if (v.status && v.status !== status(was)) add('pulse', e.version, i, shown, TIMING.pulse);
        t = shown;
        break;
      }
      case 'mark':
        t = add('mark', e.version, i, t, TIMING.mark);
        break;
      case 'network': {
        // One slot per changed field, so motion fades only what the event changed.
        let shown = t;
        if (e.link) shown = add('network', 'link', i, t, TIMING.network);
        if (e.acmePath) shown = add('network', 'path', i, t, TIMING.network);
        if (e.link && !before.linkDegraded) add('pulse', 'link', i, shown, TIMING.pulse);
        t = shown;
        break;
      }
      default:
        e satisfies never;
    }
  });
  return out;
}

/** When the beat's last slot ends. */
export const stepLength = (slots: MotionSlot[]): number =>
  Math.max(0, ...slots.map((s) => s.start + s.duration));
