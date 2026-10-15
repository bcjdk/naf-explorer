import { describe, expect, it } from 'vitest';
import { TOKENS } from '../../src/theme.ts';

type Token = keyof typeof TOKENS;
const PRODUCERS = [
  'presentation',
  'observability',
  'orchestrator',
  'intent',
  'collector',
  'executor',
  'network',
] as const;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** An opaque sRGB mix, exactly as CSS `color-mix(in srgb, a p%, b)` renders it. */
const mix = (a: string, b: string, p: number) =>
  '#' +
  rgb(a)
    .map((c, i) => Math.round(c * p + rgb(b)[i]! * (1 - p)))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('');
const hex = (c: string) => (c.startsWith('#') ? c : TOKENS[c as Token]);
const luminance = (c: string) => {
  const [r, g, b] = rgb(hex(c)).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};
/** The band fill and its text for each producer (ADR 0003). */
const band = (p: (typeof PRODUCERS)[number]) =>
  p === 'executor'
    ? (['executor-band', 'on-band-light'] as const)
    : p === 'network'
      ? (['network', 'on-band-light'] as const)
      : ([p, 'on-band-dark'] as const);

describe('colour tokens meet WCAG AA (spec §10; design uplift §2.2)', () => {
  it('text and muted text on every surface', () => {
    for (const fg of ['text', 'muted']) {
      for (const bg of ['bg', 'panel', 'panel-active', 'card', 'card-earlier', 'card-hover']) {
        expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('faded text on earlier cards and regions', () => {
    for (const bg of ['card-earlier', 'panel', 'bg'])
      expect(contrast('faded', bg), `faded on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it('status chips', () => {
    for (const bg of ['card', 'card-hover', 'panel'])
      expect(contrast('chip-text', bg)).toBeGreaterThanOrEqual(4.5);
    for (const p of PRODUCERS)
      expect(
        contrast('chip-text', mix(TOKENS[p], TOKENS.card, 0.12)),
        `chip on ${p} tint`,
      ).toBeGreaterThanOrEqual(4.5);
    expect(contrast('hatch-text', 'hatch-a')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('hatch-text', 'hatch-b')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('violated-text', 'violated')).toBeGreaterThanOrEqual(4.5);
  });

  it('text on every solid producer band', () => {
    for (const p of PRODUCERS) {
      const [fill, fg] = band(p);
      expect(contrast(fg, fill), `${fg} on ${fill}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('text and muted text on every tinted card body and inspector header', () => {
    for (const p of PRODUCERS) {
      const body = mix(TOKENS[p], TOKENS.card, 0.12);
      const hover = mix(TOKENS[p], TOKENS['card-hover'], 0.12);
      const header = mix(TOKENS[p], TOKENS.panel, 0.14);
      for (const fg of ['text', 'muted']) {
        expect(contrast(fg, body), `${fg} on ${p} card tint`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fg, hover), `${fg} on ${p} hovered tint`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fg, header), `${fg} on ${p} inspector tint`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('non-text: step ticks, lines and coloured handoff strokes reach 3:1', () => {
    expect(contrast('tick', 'bg')).toBeGreaterThanOrEqual(3);
    for (const bg of ['bg', 'panel', 'card'])
      expect(contrast('line', bg)).toBeGreaterThanOrEqual(3);
    for (const p of PRODUCERS)
      for (const bg of ['bg', 'panel', 'panel-active'])
        expect(contrast(p, bg), `${p} stroke on ${bg}`).toBeGreaterThanOrEqual(3);
  });
});
