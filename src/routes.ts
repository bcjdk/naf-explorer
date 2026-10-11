import {
  RESPONSIBILITIES,
  SIGNALS,
  STEPS,
  kind,
  producerOf,
  version,
} from './scenario/scenario.ts';
import type { Party, Step, Surface, View } from './scenario/types.ts';
import { lineKey, linesOf, stateAt } from './model/state.ts';
import { artifactName, describe } from './model/describe.ts';
import {
  LABEL_NUDGE,
  REGIONS,
  LANES,
  FACTS,
  SURFACE_RECTS,
  abs,
  WAYPOINTS,
  cardRect,
  diamondRect,
  surfaceRect,
  type Rect,
} from './layout.ts';

export type Pt = [number, number];

export interface Route {
  key: string;
  kind: 'handoff' | 'signal' | 'work';
  from: Rect;
  to: Rect;
  /** Parties at the two ends, for the crossing rule. */
  ends: [Party, Party];
  points: Pt[];
  label: string;
  /** Max label width when the label sits in a lane and wraps. */
  lane?: number;
  /** What a screen reader hears: who sends what to whom (the SVG itself is hidden). */
  spoken: string;
  /** Where the label sits: its centre, or its left (start) or right (end) edge for Orchestrator docks. */
  at: Pt;
  align: 'center' | 'start' | 'end';
}

const inSpan = (v: number, lo: number, len: number) => v >= lo && v <= lo + len;

/** The point on r's edge facing p: straight across when p is within r's span, else the edge midpoint. */
function edgeToward(r: Rect, [px, py]: Pt): Pt {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  if (py < r.y) return [inSpan(px, r.x, r.w) ? px : cx, r.y];
  if (py > r.y + r.h) return [inSpan(px, r.x, r.w) ? px : cx, r.y + r.h];
  if (px < r.x) return [r.x, inSpan(py, r.y, r.h) ? py : cy];
  return [r.x + r.w, inSpan(py, r.y, r.h) ? py : cy];
}

/** Facing edges of two rects, straight when their spans overlap. */
function direct(a: Rect, b: Rect): Pt[] {
  const gapX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const gapY = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  if (gapY >= gapX) {
    const lo = Math.max(a.x, b.x);
    const hi = Math.min(a.x + a.w, b.x + b.w);
    const ax = lo < hi ? (lo + hi) / 2 : a.x + a.w / 2;
    const bx = lo < hi ? (lo + hi) / 2 : b.x + b.w / 2;
    return b.y > a.y
      ? [
          [ax, a.y + a.h],
          [bx, b.y],
        ]
      : [
          [ax, a.y],
          [bx, b.y + b.h],
        ];
  }
  const lo = Math.max(a.y, b.y);
  const hi = Math.min(a.y + a.h, b.y + b.h);
  const ay = lo < hi ? (lo + hi) / 2 : a.y + a.h / 2;
  const by = lo < hi ? (lo + hi) / 2 : b.y + b.h / 2;
  return b.x > a.x
    ? [
        [a.x + a.w, ay],
        [b.x, by],
      ]
    : [
        [a.x, ay],
        [b.x + b.w, by],
      ];
}

function path(from: Rect, to: Rect, via: Pt[] | undefined): Pt[] {
  if (!via?.length) return direct(from, to);
  return [edgeToward(from, via[0]!), ...via, edgeToward(to, via.at(-1)!)];
}

const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

/** Whether the segment a–b passes through the inside of r. */
function segmentHits(r: Rect, [ax, ay]: Pt, [bx, by]: Pt): boolean {
  for (let t = 0.02; t < 1; t += 0.02) {
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (x > r.x + 1 && x < r.x + r.w - 1 && y > r.y + 1 && y < r.y + r.h - 1) return true;
  }
  return false;
}

/** The point at fraction t of the polyline's length. */
function along(points: Pt[], t: number): Pt {
  const lens = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i]![0], y - points[i]![1]));
  let d = t * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]! || i === lens.length - 1) {
      const f = lens[i] ? Math.min(1, d / lens[i]!) : 0;
      const [x1, y1] = points[i]!;
      const [x2, y2] = points[i + 1]!;
      return [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f];
    }
    d -= lens[i]!;
  }
  return points[0]!;
}

/** Approximate label box (11px system-ui) centred on p; a lane label wraps within maxW. */
export const labelBox = (label: string, [x, y]: Pt, maxW?: number): Rect => {
  // Generous per-character width, so estimated boxes never undercut the rendered ones.
  // Lane labels wrap in a smaller type (app.css .label.lane).
  const full = label.length * 6.8 + 16;
  const w = maxW ? Math.min(full, maxW) : full;
  const lines = maxW ? Math.ceil((label.length * 6.2) / (maxW - 8)) : 1;
  const h = lines * (maxW ? 12 : 14) + 4;
  return { x: x - w / 2, y: y - h / 2, w, h };
};
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The first spot along the line where the label covers no card and no other label. */
function placeLabel(label: string, points: Pt[], avoid: Rect[], lines: Pt[][] = []): Pt {
  const ts = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88];
  const free = (p: Pt) => {
    const box = labelBox(label, p);
    if (avoid.some((r) => overlaps(box, r))) return false;
    // Not on top of another line either.
    return !lines.some((pts) => pts.slice(1).some((q, i) => segmentHits(box, pts[i]!, q)));
  };
  for (const t of ts) {
    const p = along(points, t);
    if (free(p)) return p;
  }
  // Then beside the line: left or right of it, or above or below it.
  const w = labelBox(label, [0, 0]).w;
  for (const t of ts) {
    const [x, y] = along(points, t);
    for (const p of [
      [x + w / 2 + 8, y],
      [x - w / 2 - 8, y],
      [x, y - 16],
      [x, y + 16],
    ] as Pt[]) {
      if (free(p)) return p;
    }
  }
  return along(points, 0.5);
}

const cardOf = (id: string) => cardRect(version(id).kind, producerOf(id));

/** The lane each party's exchanges with Orchestrator cross (spec §9, rev 4). */
const SIDE: Partial<Record<Party, 'left' | 'right'>> = {
  observability: 'left',
  collector: 'left',
  intent: 'right',
  executor: 'right',
};

type Draft = Omit<Route, 'at' | 'align'> & { fixed?: Pt };

/** The current beat's lines (spec §9): handoffs and signals in causal order, then work lines. */
export function routesOf(n: number, view: View, steps: readonly Step[] = STEPS): Route[] {
  const step = steps[n];
  if (!step) return [];
  const appeared = step.events.flatMap((e) => (e.t === 'appear' ? [e.version] : []));
  const exchanges = linesOf(n, steps).filter(
    (e): e is Extract<typeof e, { t: 'signal' | 'handoff' }> => e.t !== 'work',
  );
  const out: Draft[] = [];
  const O = REGIONS.orchestrator;

  // How many exchanges each party has with Orchestrator in this beat, so they stack evenly in the lane.
  const total = new Map<Party, number>();
  for (const e of exchanges) {
    const other = e.from === 'orchestrator' ? e.to : e.from;
    if ((e.from === 'orchestrator' || e.to === 'orchestrator') && SIDE[other])
      total.set(other, (total.get(other) ?? 0) + 1);
  }
  const seen = new Map<Party, number>();
  const newCardOf = (p: Party) => {
    const id = appeared.find((x) => producerOf(x) === p);
    return id ? cardOf(id) : null;
  };

  for (const e of exchanges) {
    const outbound = e.from === 'orchestrator';
    const other = outbound ? e.to : e.from;
    const label =
      e.t === 'handoff'
        ? artifactName(e.version)
        : `${SIGNALS[e.signal].label}${e.version ? ` ${version(e.version).label}` : ''}`;
    const key = lineKey(e);
    const usedBy =
      e.t === 'handoff'
        ? appeared.find((id) => producerOf(id) === e.to && version(id).lineage.includes(e.version))
        : undefined;
    const side = SIDE[other];

    if ((outbound || e.to === 'orchestrator') && side) {
      // Level with the card the exchange is about, on the other party's side.
      const card =
        e.t === 'signal'
          ? e.version && producerOf(e.version) === other
            ? cardOf(e.version)
            : newCardOf(other)
          : outbound
            ? usedBy
              ? cardOf(usedBy)
              : null
            : cardOf(e.version);
      const R = REGIONS[other];
      const i = seen.get(other) ?? 0;
      seen.set(other, i + 1);
      // Wrapped lane labels are taller, so stacked exchanges sit further apart.
      const off = (i - ((total.get(other) ?? 1) - 1) / 2) * 58;
      const y0 = card ? card.y + card.h / 2 : R.y + R.h / 2;
      // A card faces the lane when it sits in the column next to it (slot margin plus the stack inset).
      const facesLeft = (c: Rect) => c.x + c.w >= R.x + R.w - 18;
      const facesRight = (c: Rect) => c.x <= R.x + 18;
      const facing = card && (side === 'left' ? facesLeft(card) : facesRight(card));
      const near = facing ? card : R;
      const xOther = side === 'left' ? near.x + near.w : near.x;
      const laneX = side === 'left' ? LANES.left : LANES.right;
      const clampTo = (v: number, r: Rect) => Math.min(Math.max(v, r.y + 20), r.y + r.h - 20);
      // Orchestrator's own artifacts leave from their card; everything else meets Orchestrator's edge.
      const own = outbound && e.t === 'handoff' ? cardOf(e.version) : null;
      let pts: Pt[];
      let at: Pt;
      let start: Rect = O;
      if (own) {
        start = own;
        const yA = own.y + own.h / 2;
        const yB = card ? y0 : clampTo(yA, R);
        const x0 = side === 'left' ? own.x : own.x + own.w;
        pts =
          Math.abs(yA - yB) < 2
            ? [
                [x0, yA],
                [xOther, yA],
              ]
            : [
                [x0, yA],
                [laneX, yA],
                [laneX, yB],
                [xOther, yB],
              ];
        at = [laneX, (yA + yB) / 2];
      } else {
        // Straight across the lane, level with the card, between Orchestrator's edge and the other party.
        const y = Math.min(Math.max(y0 + off, O.y + 14), O.y + O.h - 14);
        pts = [
          [side === 'left' ? O.x : O.x + O.w, y],
          [xOther, y],
        ];
        at = [laneX, y];
      }
      out.push({
        key,
        kind: e.t,
        from: outbound ? start : near,
        to: outbound ? near : O,
        ends: [e.from, e.to],
        points: outbound ? pts : pts.reverse(),
        label,
        spoken: describe(e, 'simple'),
        lane: LANES.labelWidth,
        fixed: at,
      });
      continue;
    }

    // Everything else runs card to card (or surface, network, region). Lines into Orchestrator stop at its edge.
    const from =
      e.t === 'signal'
        ? REGIONS[e.from]
        : e.from === 'presentation' && e.surface
          ? surfaceRect(e.surface)
          : cardOf(e.version);
    const to =
      e.t === 'handoff' && e.to === 'presentation' && e.surface
        ? surfaceRect(e.surface)
        : e.to === 'network'
          ? diamondRect()
          : e.to === 'orchestrator'
            ? O
            : usedBy
              ? cardOf(usedBy)
              : REGIONS[e.to];
    out.push({
      key,
      kind: e.t,
      from,
      to,
      ends: [e.from, e.to],
      points: path(from, to, WAYPOINTS[key]),
      label,
      spoken: describe(e, 'simple'),
    });
  }

  // Work lines: a new version derived from an earlier artifact of the same producer.
  const visibleCards = Object.values(stateAt(n, steps).slots).flatMap((slots) =>
    slots.flatMap((sl) => {
      const producer = kind(sl.kind).producer;
      return producer === 'presentation' ? [] : [cardRect(sl.kind, producer)];
    }),
  );
  for (const id of appeared) {
    const p = producerOf(id);
    const work = step.events.find((e) => e.t === 'work' && e.owner === p);
    for (const parent of version(id).lineage) {
      if (producerOf(parent) !== p || version(parent).kind === version(id).kind) continue;
      const from = cardOf(parent);
      const to = cardOf(id);
      const pts = direct(from, to);
      // A work line that would pass under another card reads as the wrong lineage: leave it out.
      const others = visibleCards.filter(
        (c) => c !== from && c !== to && !sameRect(c, from) && !sameRect(c, to),
      );
      if (others.some((c) => segmentHits(c, pts[0]!, pts[1]!))) continue;
      out.push({
        key: `work:${parent}>${id}`,
        kind: 'work',
        from,
        to,
        ends: [p, p],
        points: pts,
        label: work?.t === 'work' ? work.label[view] : kind(version(id).kind).name,
        spoken: '',
      });
    }
  }

  // Labels avoid every visible card, region header, surface, the network facts and labels placed before them.
  // Lane labels sit at their fixed spot in the lane; they are placed first.
  const state = stateAt(n, steps);
  const avoid: Rect[] = [
    ...Object.values(state.slots).flatMap((slots) =>
      slots.flatMap((sl) => {
        const producer = kind(sl.kind).producer;
        return producer === 'presentation' ? [] : [cardRect(sl.kind, producer)];
      }),
    ),
    // Region header text: the name, then the work label when active or the role when idle.
    ...(Object.keys(REGIONS) as Party[]).map((p) => {
      const r = REGIONS[p];
      const rest = state.work[p]
        ? `● ${state.work[p]!.map((l) => l[view]).join(' · ')}`
        : `· ${RESPONSIBILITIES[p].role}`;
      const w = 28 + RESPONSIBILITIES[p].name.length * 9.5 + rest.length * 6.6;
      return { x: r.x, y: r.y + 4, w: Math.min(r.w, w), h: 18 };
    }),
    ...(Object.keys(SURFACE_RECTS) as Surface[]).map(surfaceRect),
    abs(REGIONS.network, FACTS),
    // The Network's role, right-aligned at the top of its band.
    (() => {
      const w = RESPONSIBILITIES.network.role.length * 6.6;
      const N = REGIONS.network;
      return { x: N.x + N.w - 12 - w, y: N.y + 4, w, h: 18 };
    })(),
    ...out.flatMap((r) => (r.fixed ? [labelBox(r.label, r.fixed, r.lane)] : [])),
  ];
  return out.map(({ fixed, ...r }) => {
    const others = out.filter((o) => o.key !== r.key && o.kind !== 'work').map((o) => o.points);
    const [x, y] = fixed ?? placeLabel(r.label, r.points, avoid, others);
    const [dx, dy] = LABEL_NUDGE[r.key] ?? [0, 0];
    const at: Pt = [x + dx, y + dy];
    if (r.kind !== 'work' && !fixed) avoid.push(labelBox(r.label, at, r.lane));
    return { ...r, at, align: 'center' as const };
  });
}

/** An SVG path through the points, with corners rounded to radius r, so lines read as one smooth stroke. */
export function smoothPath(points: Pt[], r = 10): string {
  const [first, ...rest] = points;
  if (!first) return '';
  let d = `M${first[0]},${first[1]}`;
  for (let i = 0; i < rest.length; i++) {
    const p = rest[i]!;
    const next = rest[i + 1];
    const prev = i === 0 ? first : rest[i - 1]!;
    if (!next) {
      d += ` L${p[0]},${p[1]}`;
      break;
    }
    const inLen = Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    const outLen = Math.hypot(next[0] - p[0], next[1] - p[1]);
    const k = Math.min(r, inLen / 2, outLen / 2);
    const a: Pt = [p[0] - ((p[0] - prev[0]) / inLen) * k, p[1] - ((p[1] - prev[1]) / inLen) * k];
    const b: Pt = [p[0] + ((next[0] - p[0]) / outLen) * k, p[1] + ((next[1] - p[1]) / outLen) * k];
    d += ` L${a[0]},${a[1]} Q${p[0]},${p[1]} ${b[0]},${b[1]}`;
  }
  return d;
}
