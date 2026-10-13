import type { KindId, Party, Surface } from './scenario/types.ts';

export const STAGE = { w: 1440, h: 952 } as const;

export function fitScale(w: number, h: number): number {
  return Math.min(w / STAGE.w, h / STAGE.h);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Spec §3 bands (rev 7, plan 5 D2), absolute stage coordinates. The blocks are 30px apart under Presentation
 * and 24px elsewhere; the header bar hugs the canvas at 16px, the caption bar at 12px, and the side margins
 * are 12px. The lanes beside Orchestrator (72px) carry its exchanges; Orchestrator lines up with the rows beside it.
 */
export const REGIONS: Record<Party, Rect> = {
  presentation: { x: 12, y: 52, w: 1416, h: 84 },
  observability: { x: 12, y: 166, w: 488, h: 348 },
  orchestrator: { x: 572, y: 166, w: 296, h: 536 },
  intent: { x: 940, y: 166, w: 488, h: 348 },
  collector: { x: 12, y: 538, w: 488, h: 164 },
  executor: { x: 940, y: 538, w: 488, h: 164 },
  network: { x: 12, y: 726, w: 1416, h: 106 },
};

export const CAPTION: Rect = { x: 12, y: 844, w: 1416, h: 100 };

/**
 * Where exchange labels sit: the centre of each side lane. Orchestrator runs the full height, so the left lane
 * serves Observability and Collector and the right lane serves Intent and Executor.
 */
export const LANES = {
  left: 536,
  right: 904,
  /** The top lane under Presentation: Observability → Portal on the upper track, the rest on the lower one. */
  top: 156,
  topHigh: 147,
  /** Widest a lane label may be before it wraps. */
  labelWidth: 68,
} as const;

/** One fixed slot per artifact kind, relative to its producer's region. */
export const SLOTS: Partial<Record<KindId, Rect>> = {
  // Cards start at y 28, under the 17px header and the work pill.
  // Observability: the column facing Orchestrator holds everything it exchanges with Orchestrator.
  sloRule: { x: 8, y: 28, w: 232, h: 100 },
  evidence: { x: 8, y: 128, w: 232, h: 114 },
  sli: { x: 8, y: 242, w: 232, h: 107 },
  serviceState: { x: 248, y: 28, w: 232, h: 109 },
  serviceEvent: { x: 248, y: 137, w: 232, h: 103 },
  pathHealth: { x: 248, y: 240, w: 232, h: 109 },
  // Intent: derivation descends; every card's left edge faces Orchestrator.
  serviceIntent: { x: 8, y: 28, w: 232, h: 114 },
  sloDefinition: { x: 248, y: 28, w: 232, h: 114 },
  networkIntent: { x: 8, y: 142, w: 472, h: 96 },
  desiredState: { x: 8, y: 238, w: 472, h: 111 },
  // Orchestrator: the workflow (with its steps), then its own requests in the order they are made.
  workflow: { x: 8, y: 28, w: 280, h: 136 },
  intentRequest: { x: 8, y: 168, w: 280, h: 86 },
  remediationDecision: { x: 8, y: 258, w: 280, h: 102 },
  applyRequest: { x: 8, y: 364, w: 280, h: 96 },
  repairRequest: { x: 8, y: 464, w: 280, h: 66 },
  // Collector: the telemetry pipeline, then the read-back facing Orchestrator's lane.
  normalized: { x: 8, y: 28, w: 152, h: 137 },
  enriched: { x: 164, y: 28, w: 168, h: 137 },
  observedState: { x: 336, y: 28, w: 144, h: 137 },
  // Executor: under desired state, right of its header so the desired-state line clears the header text.
  configChange: { x: 180, y: 28, w: 300, h: 122 },
  // The Network
  rawSignals: { x: 8, y: 20, w: 320, h: 87 },
};

const SURFACE_ORDER: Surface[] = ['faultMgmt', 'itsm', 'portal', 'perfMgmt', 'api'];
/** Presentation surfaces, relative to the Presentation region. */
export const SURFACE_RECTS = Object.fromEntries(
  SURFACE_ORDER.map((s, i) => [s, { x: 8 + i * 281, y: 20, w: 272, h: 60 }]),
) as Record<Surface, Rect>;

/**
 * The Network band, relative to its region: raw signals on the left, the facts in a mirrored column on the
 * right, and the topology centred on the band's midline between them.
 */
export const DIAMOND: Rect = { x: 332, y: 18, w: 752, h: 86 };
export const FACTS: Rect = { x: 1108, y: 22, w: 296, h: 80 };

export const abs = (base: Rect, r: Rect): Rect => ({
  x: base.x + r.x,
  y: base.y + r.y,
  w: r.w,
  h: r.h,
});

/** Children of a region sit inside its border: 1px at the left, 4px (the provenance edge) at the top. */
const inside = (base: Rect, r: Rect): Rect => abs({ ...base, x: base.x + 1, y: base.y + 4 }, r);

/** The card as drawn: its slot minus the 6px kept for the stacked edges of earlier versions. */
export const cardRect = (k: KindId, producer: Party): Rect => {
  const r = inside(REGIONS[producer], SLOTS[k]!);
  return { ...r, w: r.w - 6, h: r.h - 6 };
};
export const surfaceRect = (s: Surface): Rect => inside(REGIONS.presentation, SURFACE_RECTS[s]);
export const diamondRect = (): Rect => inside(REGIONS.network, DIAMOND);

/**
 * Routes that need the lanes, keyed by "<from>><to>:<artifact kind or signal>[@surface]", in absolute
 * stage coordinates. They keep content lines out of Orchestrator and Presentation (spec §9) and off cards.
 */
export const WAYPOINTS: Record<string, [number, number][]> = {
  // Along the middle of the top lane, down the middle of the stage margin, into the SLO rule's left side.
  'intent>observability:sloDefinition': [
    [1300, LANES.top],
    [6, LANES.top],
    [6, 242],
  ],
  // Up from the service state and along the upper track of the top lane into the Portal.
  'observability>presentation:serviceState@portal': [
    [470, LANES.topHigh],
    [700, LANES.topHigh],
  ],
  // Events climb the gutter inside Observability's right edge, then take the top lane to Fault Management or ITSM.
  'observability>presentation:serviceEvent@faultMgmt': [
    [494, 350],
    [494, LANES.top],
    [160, LANES.top],
  ],
  // The repair request leaves Orchestrator into the left lane and climbs it to the top lane and ITSM.
  'orchestrator>presentation:repairRequest@itsm': [
    [LANES.left, 663],
    [LANES.left, LANES.top],
    [440, LANES.top],
  ],
  // The service request enters Orchestrator right of its header.
  'presentation>orchestrator:serviceRequest@portal': [[812, 151]],
  // Read-back goes from Collector along the gutter above The Network and up the right lane to Intent.
  'collector>intent:observedState': [
    [420, 714],
    [LANES.right, 714],
    [LANES.right, 460],
  ],
};

/** Label offsets for collisions found on screenshots, keyed by route key. */
export const LABEL_NUDGE: Record<string, [number, number]> = {
  // Over Intent rather than over Orchestrator, so it never reads as going into Orchestrator.
  'intent>observability:sloDefinition': [480, 0],
};
