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
