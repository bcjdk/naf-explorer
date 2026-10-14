import {
  NETWORK,
  RESPONSIBILITIES,
  SIGNALS,
  SURFACES,
  kind,
  version,
} from '../scenario/scenario.ts';
import type {
  Event,
  KindId,
  Marker,
  Party,
  SignalId,
  Status,
  Surface,
  View,
} from '../scenario/types.ts';

const STATUS_ICON: Record<Status, string> = {
  HEALTHY: '✓',
  DEGRADED: '▲',
  VIOLATED: '✕',
  CLEARED: '✓',
};

export const statusText = (s: Status): string => `${STATUS_ICON[s]} ${s}`;

export const MARKER_TEXT: Record<Marker, string> = {
  UNCHANGED: '= UNCHANGED',
  COMPLETED: 'completed',
};

const end = (p: Party, surface?: Surface) =>
  p === 'presentation' && surface ? SURFACES[surface] : RESPONSIBILITIES[p].name;

/** A card's accessible name (spec §11): "Service intent v1, by Intent, unchanged". */
export function cardName(id: string, marker?: Marker, earlier = 0): string {
  const v = version(id);
  const k = kind(v.kind);
  return [
    `${k.name} ${v.label}, by ${RESPONSIBILITIES[k.producer].name}`,
    v.status?.toLowerCase(),
    // Spoken as a plain word: "= UNCHANGED" reads as "unchanged".
    marker && MARKER_TEXT[marker].replace(/^= /, '').toLowerCase(),
    earlier > 0 && `${earlier} earlier version${earlier > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(', ');
}

export const surfaceName = (s: Surface, received?: string, order?: string): string =>
  (received ? `${SURFACES[s]}, showing ${cardName(received)}` : SURFACES[s]) +
  (order ? ', order completed' : '');

export const artifactName = (id: string) => `${kind(version(id).kind).name} (${version(id).label})`;

export function describe(e: Exclude<Event, { t: 'appear' }>, view: View): string {
  switch (e.t) {
    case 'signal':
      return `${end(e.from)} ⇢ ${end(e.to)}: ${SIGNALS[e.signal].label}${e.version ? ` ${version(e.version).label}` : ''}`;
    case 'handoff':
      return `${end(e.from, e.surface)} → ${end(e.to, e.surface)}: ${artifactName(e.version)}`;
    case 'work':
      return `${end(e.owner)}: ${e.label[view]}`;
    case 'mark':
      return `${artifactName(e.version)} ${MARKER_TEXT[e.marker]}`;
    case 'network':
      return e.link
        ? `${NETWORK.link} ${statusText(e.link.status)}`
        : NETWORK.acme[e.acmePath ?? 'none'][view];
  }
}

/** What answers a request: a signal's label, or the name of the artifact kind sent back. */
const isSignal = (a: SignalId | KindId): a is SignalId => a in SIGNALS;
export const answerName = (a: SignalId | KindId): string =>
  isSignal(a) ? SIGNALS[a].label : kind(a).name;
