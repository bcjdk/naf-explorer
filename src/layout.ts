export const STAGE = { w: 1440, h: 900 } as const;

export function fitScale(w: number, h: number): number {
  return Math.min(w / STAGE.w, h / STAGE.h);
}
