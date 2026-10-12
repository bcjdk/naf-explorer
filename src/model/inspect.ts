import {
  RESPONSIBILITIES,
  SIGNALS,
  STEPS,
  SURFACES,
  SURFACE_ROLES,
  VERSIONS,
  kind,
  producerOf,
  version,
} from '../scenario/scenario.ts';
import type { Event, KindId, Party, SignalId, Step, Surface, View } from '../scenario/types.ts';
import { MARKER_TEXT, artifactName, describe, statusText } from './describe.ts';
import { lineKey, stateAt, type Exchange } from './state.ts';

/** What the reader can select (spec §7). A line is identified by its beat and its route key. */
export type Target =
  | { t: 'artifact'; version: string }
  | { t: 'responsibility'; party: Party }
  | { t: 'surface'; surface: Surface }
  | { t: 'line'; step: number; key: string };

export interface Item {
  text: string;
  /** Set when the item is a link that moves the selection. */
  target?: Target;
}
export interface Section {
  heading: string;
  items: Item[];
  /** Machine values, shown in monospace. */
  mono?: boolean;
}
export interface Inspection {
  kind: 'Artifact' | 'Responsibility' | 'Signal' | 'Handoff' | 'Surface';
  title: string;
  /** Set when the target isn't drawn in this beat, for example "Appears in P5". */
  note?: string;
  sections: Section[];
}

const name = (p: Party, surface?: Surface) =>
  p === 'presentation' && surface
    ? `${RESPONSIBILITIES.presentation.name} (${SURFACES[surface]})`
    : RESPONSIBILITIES[p].name;
const text = (t: string): Item => ({ text: t });
const link = (id: string): Item => ({
  text: artifactName(id),
  target: { t: 'artifact', version: id },
});
const sec = (heading: string, items: Item[], mono?: boolean): Section[] =>
  items.length ? [{ heading, items, ...(mono ? { mono } : {}) }] : [];
const stepId = (match: (e: Event) => boolean) => STEPS.find((s: Step) => s.events.some(match))?.id;

/** The Presentation surfaces the story hands a kind to, in story order. */
const surfacesFor = (k: KindId) => [
  ...new Set(
    STEPS.flatMap((s) =>
      s.events.flatMap((e) =>
        e.t === 'handoff' && e.to === 'presentation' && e.surface && version(e.version).kind === k
          ? [SURFACES[e.surface]]
          : [],
      ),
    ),
  ),
];

const involves = (e: Event, p: Party) =>
  e.t === 'work'
    ? e.owner === p
    : e.t === 'signal' || e.t === 'handoff'
      ? e.from === p || e.to === p
      : e.t === 'network'
        ? p === 'network'
        : producerOf(e.version) === p;

/** The inspector's content for a target at beat n (spec §7), derived from the scenario data only. */
export function inspect(target: Target, n: number, view: View): Inspection {
  const state = stateAt(n);
  switch (target.t) {
    case 'artifact': {
      const v = version(target.version);
      const k = kind(v.kind);
      const marker = state.markers[v.id];
      const usedBy = k.consumers.map((c) =>
        c === 'presentation'
          ? `${RESPONSIBILITIES.presentation.name} (${surfacesFor(k.id).join(', ')})`
          : RESPONSIBILITIES[c].name,
      );
      return {
        kind: 'Artifact',
        title: artifactName(v.id),
        note: state.visible.includes(v.id)
          ? undefined
          : `Appears in ${stepId((e) => e.t === 'appear' && e.version === v.id)}`,
        sections: [
          ...sec('What it is', [text(k.whatItIs)]),
          ...sec('Produced by', [text(name(k.producer, k.producerSurface))]),
          ...sec(
            'Used by',
            (usedBy.length
              ? usedBy
              : [`Kept by ${RESPONSIBILITIES[k.producer].name} for its own work.`]
            ).map(text),
          ),
          ...sec('Meaning', [text(v.meaning)]),
          ...sec(
            'Status',
            [v.status && statusText(v.status), marker && MARKER_TEXT[marker]]
              .filter((x) => !!x)
              .map((x) => text(x as string)),
          ),
          ...sec('Lineage', v.lineage.map(link)),
          ...sec(
            'Other versions',
            VERSIONS.filter(
              (o) => o.kind === v.kind && o.id !== v.id && state.visible.includes(o.id),
            ).map((o) => link(o.id)),
          ),
          ...(view === 'technical'
            ? sec('Payload (illustrative)', v.technical.map(text), true)
            : []),
        ],
      };
    }
    case 'responsibility': {
      const p = target.party;
      const r = RESPONSIBILITIES[p];
      const now = STEPS[n]!.events.filter((e) => involves(e, p)).map((e) =>
        e.t === 'appear'
          ? { ...link(e.version), text: `New: ${artifactName(e.version)}` }
          : text(describe(e, view)),
      );
      return {
        kind: 'Responsibility',
        title: r.name,
        sections: [
          ...sec('Role', [text(r.role)]),
          ...sec('Does', r.does.map(text)),
          ...sec('Does not', r.doesNot.map(text)),
          ...sec('In this step', now.length ? now : [text('Nothing in this beat.')]),
          ...sec('Produced so far', state.visible.filter((id) => producerOf(id) === p).map(link)),
        ],
      };
    }
    case 'line': {
      const s = STEPS[target.step]!;
      const e = s.events.find(
        (x): x is Exchange => (x.t === 'signal' || x.t === 'handoff') && lineKey(x) === target.key,
      );
      if (!e) throw new Error(`No line ${target.key} in ${s.id}`);
      const elsewhere = target.step !== n;
      if (e.t === 'signal') {
        const info = SIGNALS[e.signal];
        const a = info.answeredBy;
        return {
          kind: 'Signal',
          title: `${info.label}${e.version ? ` ${version(e.version).label}` : ''}`,
          note: elsewhere ? `Signalled in ${s.id}` : undefined,
          sections: [
            ...sec('From', [text(name(e.from))]),
            ...sec('To', [text(name(e.to))]),
            ...sec('Asks', [text(info.asks)]),
            ...sec('About', e.version ? [link(e.version)] : []),
            ...sec('Answered by', [
              text(
                a
                  ? a in SIGNALS
                    ? SIGNALS[a as SignalId].label
                    : kind(a as KindId).name
                  : 'Nothing: it answers an earlier request.',
              ),
            ]),
          ],
        };
      }
      return {
        kind: 'Handoff',
        title: artifactName(e.version),
        note: elsewhere ? `Handed over in ${s.id}` : undefined,
        sections: [
          ...sec('Artifact', [link(e.version)]),
          ...sec('From', [text(name(e.from, e.surface))]),
          ...sec('To', [text(name(e.to, e.surface))]),
          ...sec('Why the receiver needs it', [text(kind(version(e.version).kind).uses![e.to]!)]),
        ],
      };
    }
    case 'surface': {
      const s = target.surface;
      const shown = state.surfaces[s];
      return {
        kind: 'Surface',
        title: SURFACES[s],
        sections: [
          ...sec('What it is', [text(SURFACE_ROLES[s])]),
          ...sec('Showing', [shown ? link(shown) : text('Nothing received yet.')]),
          ...sec('From', shown ? [text(RESPONSIBILITIES[producerOf(shown)].name)] : []),
          ...sec(
            'Its own requests',
            state.visible.filter((id) => kind(version(id).kind).producerSurface === s).map(link),
          ),
        ],
      };
    }
  }
}
