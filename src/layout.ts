import type { Party } from './scenario/types.ts';

export const STAGE = { w: 1440, h: 900 } as const;

export function fitScale(w: number, h: number): number {
  return Math.min(w / STAGE.w, h / STAGE.h);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Spec §3 bands. Rough placement only; plan 2 sets the final geometry and draws lines.
export const REGIONS: Record<Party, Rect> = {
  presentation: { x: 16, y: 52, w: 1408, h: 96 },
  observability: { x: 16, y: 180, w: 500, h: 228 },
  collector: { x: 16, y: 416, w: 500, h: 144 },
  orchestrator: { x: 532, y: 180, w: 376, h: 380 },
  intent: { x: 924, y: 180, w: 500, h: 228 },
  executor: { x: 924, y: 416, w: 500, h: 144 },
  network: { x: 16, y: 568, w: 900, h: 192 },
};

/** The skeleton's list of this step's exchanges, until plan 2 draws them as lines. */
export const EXCHANGES: Rect = { x: 932, y: 568, w: 492, h: 192 };

/** Card columns per region (spec §3: Observability has a diagnosis and an evaluation column). */
export const COLUMNS: Partial<Record<Party, number>> = { observability: 2 };
