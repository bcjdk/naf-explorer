import { afterEach, describe, expect, it } from 'vitest';
import { load, save } from '../../src/storage.ts';

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const install = (get: () => unknown) =>
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get });

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe('storage', () => {
  it('reads and writes when storage works', () => {
    const data = new Map<string, string>();
    install(() => ({
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
    }));
    save('naf.view', 'technical');
    expect(load('naf.view')).toBe('technical');
  });

  it('returns null and does not throw when storage is blocked', () => {
    install(() => {
      throw new Error('SecurityError: storage blocked');
    });
    expect(load('naf.view')).toBeNull();
    expect(() => save('naf.view', 'technical')).not.toThrow();
  });

  it('returns null and does not throw when the storage methods throw', () => {
    install(() => ({
      getItem: () => {
        throw new Error('SecurityError: denied');
      },
      setItem: () => {
        throw new Error('QuotaExceededError: full');
      },
    }));
    expect(load('naf.view')).toBeNull();
    expect(() => save('naf.view', 'technical')).not.toThrow();
  });
});
