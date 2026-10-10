import { describe, expect, it } from 'vitest';
import { fitScale } from '../../src/layout.ts';

describe('fitScale', () => {
  it('is 1 at the design size', () => expect(fitScale(1440, 900)).toBe(1));
  it('is limited by the tighter axis', () => {
    expect(fitScale(1280, 720)).toBeCloseTo(0.8);
    expect(fitScale(1920, 1080)).toBeCloseTo(1.2);
    expect(fitScale(1024, 640)).toBeCloseTo(0.7111, 3);
  });
});
