import { describe, expect, it } from 'vitest';
import { fitScale } from '../../src/layout.ts';

describe('fitScale', () => {
  it('is 1 at the design size', () => expect(fitScale(1440, 952)).toBe(1));
  it('is limited by the tighter axis', () => {
    expect(fitScale(1280, 720)).toBeCloseTo(0.7563, 3);
    expect(fitScale(1920, 1080)).toBeCloseTo(1.1345, 3);
    expect(fitScale(1024, 640)).toBeCloseTo(0.6723, 3);
  });
});
