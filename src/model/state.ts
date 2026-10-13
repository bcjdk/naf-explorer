import { SIGNALS, STEPS, VERSIONS, WORKFLOW_STEPS, kind, version } from '../scenario/scenario.ts';
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
  /** Earlier versions this step uses: marked or handed on. */
  touched: string[];
  markers: Record<string, Marker>;
  surfaces: Partial<Record<Surface, string>>;
  slots: Partial<Record<Party, Slot[]>>;
  linkDegraded: boolean;
  /** The link degrades in this step: The Network is where something happens, though it does no work. */
  faultNow: boolean;
  acmePath: 'A' | 'B' | null;
  work: Partial<Record<Party, Text[]>>;
  /** The answer Orchestrator is still waiting for at the end of this step, and from whom (ADR 0001). */
  waiting: { answer: string; from: Party } | null;
  /** For each workflow record: the index of its current step in WORKFLOW_STEPS (its length once completed). */
  progress: Record<string, number>;
}

export type Line = Extract<Event, { t: 'signal' | 'handoff' | 'work' }>;

export type Exchange = Extract<Event, { t: 'signal' | 'handoff' }>;

/** The key of an exchange's line: shared by the routes (geometry) and the timeline (motion). */
export const lineKey = (e: Exchange): string =>
  `${e.from}>${e.to}:${e.t === 'handoff' ? version(e.version).kind : e.signal}${
    e.t === 'handoff' && e.surface ? `@${e.surface}` : ''
  }`;

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
    touched: [],
    markers: {},
    surfaces: {},
    slots: {},
    linkDegraded: false,
    faultNow: false,
    acmePath: null,
    work: {},
    waiting: null,
    progress: {},
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
          if (current) s.touched.push(e.version);
          break;
        case 'handoff': {
          const k = kindOf.get(e.version);
          const asks = k && e.from === 'orchestrator' ? kind(k).answeredBy : undefined;
          if (asks) s.waiting = { answer: asks, from: e.to };
          else if (e.to === 'orchestrator' && s.waiting?.answer === k) s.waiting = null;
          if (current && !s.touched.includes(e.version)) s.touched.push(e.version);
          if (e.to === 'presentation' && e.surface) s.surfaces[e.surface] = e.version;
          break;
        }
        case 'network':
          if (e.link) s.linkDegraded = true;
          if (e.link && current) s.faultNow = true;
          if (e.acmePath) s.acmePath = e.acmePath;
          break;
        case 'work':
          if (current) (s.work[e.owner] ??= []).push(e.label);
          break;
        case 'signal':
          if (e.from === 'orchestrator' && SIGNALS[e.signal].answeredBy)
            s.waiting = { answer: SIGNALS[e.signal].answeredBy!, from: e.to };
          else if (e.to === 'orchestrator' && s.waiting?.answer === e.signal) s.waiting = null;
          break;
        default:
          e satisfies never;
      }
    }
  });
  for (const [wf, list] of Object.entries(WORKFLOW_STEPS)) {
    if (!s.visible.includes(wf)) continue;
    const reached = list.filter((x) => {
      const at = steps.findIndex((st) => st.id === x.from);
      return at !== -1 && at <= n;
    }).length;
    s.progress[wf] = s.markers[wf] === 'COMPLETED' ? list.length : reached - 1;
  }
  return s;
}

/** Spec §4.2: the current step's handoffs, signals and work, in causal order. */
export function linesOf(n: number, steps: readonly Step[] = STEPS): Line[] {
  return (steps[n]?.events ?? []).filter(
    (e): e is Line => e.t === 'signal' || e.t === 'handoff' || e.t === 'work',
  );
}
