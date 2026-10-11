import { describe, expect, it } from 'vitest';
import { REGIONS, cardRect, type Rect } from '../../src/layout.ts';
import { linesOf, stateAt } from '../../src/model/state.ts';
import { labelBox, routesOf, type Pt } from '../../src/routes.ts';
import { STEPS, kind } from '../../src/scenario/scenario.ts';

const views = ['simple', 'technical'] as const;
const all = STEPS.flatMap((s, n) => views.map((v) => ({ id: s.id, n, routes: routesOf(n, v) })));

const within = (r: Rect, [x, y]: Pt, pad = 1) =>
  x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
const crosses = (r: Rect, a: Pt, b: Pt) => {
  const inner = { x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 };
  for (let t = 0; t <= 1; t += 0.01) {
    if (within(inner, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], 0)) return true;
  }
  return false;
};

describe('routesOf (spec §9)', () => {
  it('draws one line per signal and handoff, plus work lines', () => {
    for (const { id, n, routes } of all) {
      const exchanges = linesOf(n).filter((e) => e.t !== 'work').length;
      expect(
        routes.filter((r) => r.kind !== 'work'),
        id,
      ).toHaveLength(exchanges);
    }
    // SLI + SLO rule → service state is drawn as work inside Observability.
    expect(
      routesOf(
        STEPS.findIndex((s) => s.id === 'P14'),
        'simple',
      ).map((r) => r.key),
    ).toEqual(['work:sli1>ss1', 'work:slorule>ss1']);
  });

  it('labels every line', () => {
    for (const { id, routes } of all)
      for (const r of routes) expect(r.label.trim(), `${id} ${r.key}`).not.toBe('');
  });

  it('starts every line on its source and ends it on its target', () => {
    for (const { id, routes } of all) {
      for (const r of routes) {
        expect(within(r.from, r.points[0]!), `${id} ${r.key} start`).toBe(true);
        expect(within(r.to, r.points.at(-1)!), `${id} ${r.key} end`).toBe(true);
      }
    }
  });

  it('keeps content lines out of Orchestrator and Presentation unless they are an endpoint', () => {
    for (const { id, routes } of all) {
      for (const r of routes.filter((x) => x.kind === 'handoff')) {
        for (const p of ['orchestrator', 'presentation'] as const) {
          if (r.ends.includes(p)) continue;
          for (let i = 0; i < r.points.length - 1; i++) {
            expect(
              crosses(REGIONS[p], r.points[i]!, r.points[i + 1]!),
              `${id} ${r.key} crosses ${p}`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it('runs no handoff or signal over a visible card other than its own ends', () => {
    for (const { id, n, routes } of all) {
      const cards = Object.values(stateAt(n).slots).flatMap((slots) =>
        slots.flatMap((sl) => {
          const p = kind(sl.kind).producer;
          return p === 'presentation' ? [] : [cardRect(sl.kind, p)];
        }),
      );
      for (const r of routes.filter((x) => x.kind !== 'work')) {
        const ends = [r.from, r.to];
        for (const c of cards) {
          if (ends.some((e) => e.x === c.x && e.y === c.y)) continue;
          for (let i = 0; i < r.points.length - 1; i++) {
            expect(
              crosses(c, r.points[i]!, r.points[i + 1]!),
              `${id} ${r.key} crosses a card`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it('runs no line under another line’s label', () => {
    for (const { id, routes } of all) {
      const drawn = routes.filter((r) => r.kind !== 'work');
      for (const r of drawn) {
        for (const other of drawn) {
          if (other === r) continue;
          const box = labelBox(other.label, other.at, other.lane);
          for (let i = 0; i < r.points.length - 1; i++) {
            expect(
              crosses(box, r.points[i]!, r.points[i + 1]!),
              `${id} ${r.key} under "${other.label}"`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it('runs the SLO definition through the lane under Presentation', () => {
    const slo = routesOf(
      STEPS.findIndex((s) => s.id === 'P6'),
      'simple',
    ).find((r) => r.key.endsWith(':sloDefinition'))!;
    const lane = slo.points.filter(([, y]) => y < REGIONS.observability.y);
    expect(lane.length).toBeGreaterThan(0);
    for (const [, y] of lane)
      expect(y).toBeGreaterThan(REGIONS.presentation.y + REGIONS.presentation.h);
  });
});
