import {
  RESPONSIBILITIES,
  SIGNALS,
  STEPS,
  SURFACES,
  SURFACE_ROLES,
  SURFACE_NAF,
  VERSIONS,
  kind,
  producerOf,
  version,
} from '../scenario/scenario.ts';
import type {
  Event,
  KindId,
  Party,
  SignalId,
  Status,
  Step,
  Surface,
  View,
} from '../scenario/types.ts';
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
  /** The party whose colour marks the item's edge or swatch. */
  party?: Party;
  /** A second, quieter line: why a consumer needs the artifact. */
  note?: string;
  /** Drawn as the canvas's own status chip. */
  status?: Status;
}
/** How a section is drawn (design uplift §4.2). */
export type Look = 'text' | 'list' | 'blocks' | 'cards' | 'code' | 'highlight';
export interface Section {
  heading: string;
  items: Item[];
  look: Look;
}
export interface Inspection {
  kind: 'Artifact' | 'Responsibility' | 'Signal' | 'Handoff' | 'Surface';
  title: string;
  /** Set when the target isn't drawn in this beat, for example "Appears in P5". */
  note?: string;
  /** The identity colour of the header (§4.1). */
  party: Party;
  /** Signals: the header edge is dashed, like the line. */
  dashed?: boolean;
  /** The kind line's "by <party>" for an artifact, or "in Presentation" for a surface. */
  by?: Party;
  /** Replaces the name in "by <party>" when the producer is a Presentation surface. */
  byLabel?: string;
  /** Lines: sender → receiver, drawn as a strip; `surface` names the Presentation surface at whichever end is Presentation. */
  strip?: { from: Party; to: Party; surface?: Surface };
  sections: Section[];
}

const text = (t: string): Item => ({ text: t });
const link = (id: string): Item => ({
  text: artifactName(id),
  target: { t: 'artifact', version: id },
  party: producerOf(id),
});
/** A responsibility named in the panel opens its own view (design uplift §4.3). */
const party = (p: Party, label = RESPONSIBILITIES[p].name, note?: string): Item => ({
  text: label,
  target: { t: 'responsibility', party: p },
  party: p,
  ...(note ? { note } : {}),
});
const sec = (heading: string, items: Item[], look: Look = 'list'): Section[] =>
  items.length ? [{ heading, items, look }] : [];
const stepId = (match: (e: Event) => boolean) => STEPS.find((s: Step) => s.events.some(match))?.id;

/** Where the story hands this version: its receivers, and the Presentation surfaces among them, in story order. */
const handoffsOf = (id: string) =>
  STEPS.flatMap((s) => s.events.flatMap((e) => (e.t === 'handoff' && e.version === id ? [e] : [])));
const surfacesFor = (id: string) => [
  ...new Set(handoffsOf(id).flatMap((e) => (e.surface ? [SURFACES[e.surface]] : []))),
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
      const receivers = k.consumers.filter((c) => handoffsOf(v.id).some((e) => e.to === c));
      return {
        kind: 'Artifact',
        title: artifactName(v.id),
        party: k.producer,
        by: k.producer,
        ...(k.producerSurface
          ? { byLabel: `${RESPONSIBILITIES.presentation.name} (${SURFACES[k.producerSurface]})` }
          : {}),
        note: state.visible.includes(v.id)
          ? undefined
          : `Appears in ${stepId((e) => e.t === 'appear' && e.version === v.id)}`,
        sections: [
          ...sec('What it is', [text(k.whatItIs)], 'text'),
          ...sec('Meaning', [text(v.meaning)], 'text'),
          ...sec(
            'Handed to',
            // Per version: the remediation workflow record, unlike the provisioning one, goes nowhere (ADR 0005).
            receivers.length
              ? receivers.map((c) =>
                  party(
                    c,
                    c === 'presentation'
                      ? `${RESPONSIBILITIES.presentation.name} (${surfacesFor(v.id).join(', ')})`
                      : RESPONSIBILITIES[c].name,
                    k.uses?.[c],
                  ),
                )
              : [text(`Kept by ${RESPONSIBILITIES[k.producer].name} for its own work.`)],
            'blocks',
          ),
          ...sec(
            'Status',
            [
              ...(v.status ? [{ text: statusText(v.status), status: v.status }] : []),
              ...(marker ? [text(MARKER_TEXT[marker])] : []),
            ],
            'text',
          ),
          ...sec('Lineage', v.lineage.map(link), 'cards'),
          ...sec(
            'Other versions',
            VERSIONS.filter(
              (o) => o.kind === v.kind && o.id !== v.id && state.visible.includes(o.id),
            ).map((o) => link(o.id)),
            'cards',
          ),
          ...(view === 'technical'
            ? sec('Payload (illustrative)', v.technical.map(text), 'code')
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
        party: p,
        sections: [
          ...sec('Role', [text(r.role)], 'text'),
          ...sec('Does', r.does.map(text)),
          ...sec('Does not', r.doesNot.map(text)),
          ...sec('In this step', now.length ? now : [text('Nothing in this beat.')], 'highlight'),
          ...sec(
            'Produced so far',
            state.visible.filter((id) => producerOf(id) === p).map(link),
            'cards',
          ),
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
          party: 'orchestrator',
          dashed: true,
          strip: { from: e.from, to: e.to },
          sections: [
            ...sec('Asks', [text(info.asks)], 'text'),
            ...sec('About', e.version ? [link(e.version)] : [], 'cards'),
            ...sec(
              'Answered by',
              [
                text(
                  a
                    ? a in SIGNALS
                      ? SIGNALS[a as SignalId].label
                      : kind(a as KindId).name
                    : 'Nothing: it answers an earlier request.',
                ),
              ],
              'text',
            ),
          ],
        };
      }
      return {
        kind: 'Handoff',
        title: artifactName(e.version),
        note: elsewhere ? `Handed over in ${s.id}` : undefined,
        party: producerOf(e.version),
        strip: { from: e.from, to: e.to, surface: e.surface },
        sections: [
          ...sec('Artifact', [link(e.version)], 'cards'),
          ...sec(
            'Why the receiver needs it',
            [text(kind(version(e.version).kind).uses![e.to]!)],
            'text',
          ),
        ],
      };
    }
    case 'surface': {
      const s = target.surface;
      const shown = state.surfaces[s];
      const order = state.orders[s];
      return {
        kind: 'Surface',
        title: SURFACES[s],
        party: 'presentation',
        by: 'presentation',
        sections: [
          ...sec('What it is', [text(SURFACE_ROLES[s])], 'text'),
          ...sec('In NAF terms', [text(SURFACE_NAF[s])], 'text'),
          ...sec(
            'Showing',
            [shown ? link(shown) : text('Nothing received yet.')],
            shown ? 'cards' : 'text',
          ),
          ...sec('From', shown ? [party(producerOf(shown))] : []),
          ...sec(
            'Its own requests',
            state.visible.filter((id) => kind(version(id).kind).producerSurface === s).map(link),
            'cards',
          ),
          ...sec('Order status, from Orchestrator', order ? [link(order)] : [], 'cards'),
        ],
      };
    }
  }
}
