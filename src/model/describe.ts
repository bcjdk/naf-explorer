import {
  NETWORK,
  RESPONSIBILITIES,
  SIGNALS,
  SURFACES,
  kind,
  version,
} from '../scenario/scenario.ts';
import type { Event, Marker, Party, Status, Surface, View } from '../scenario/types.ts';

export const STATUS_ICON: Record<Status, string> = {
  HEALTHY: '✓',
  DEGRADED: '▲',
  VIOLATED: '✕',
  CLEARED: '✓',
};

export const statusText = (s: Status): string => `${STATUS_ICON[s]} ${s}`;

export const MARKER_TEXT: Record<Marker, string> = {
  IN_SYNC: '= IN SYNC',
  UNCHANGED: '= UNCHANGED',
  COMPLETED: 'completed',
};

const end = (p: Party, surface?: Surface) =>
  p === 'presentation' && surface ? SURFACES[surface] : RESPONSIBILITIES[p].name;

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
