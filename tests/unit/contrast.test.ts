import { describe, expect, it } from 'vitest';
import { TOKENS } from '../../src/theme.ts';

const token = (name: string) => TOKENS[name as keyof typeof TOKENS];
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe('colour tokens meet WCAG AA (spec §10)', () => {
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
    expect(contrast('hatch-text', 'hatch-a')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('hatch-text', 'hatch-b')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('violated-text', 'violated')).toBeGreaterThanOrEqual(4.5);
  });

  it('non-text: step ticks and lines reach 3:1', () => {
    expect(contrast('tick', 'bg')).toBeGreaterThanOrEqual(3);
    for (const bg of ['bg', 'panel', 'card'])
      expect(contrast('line', bg)).toBeGreaterThanOrEqual(3);
  });
});
