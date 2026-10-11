// Private windows and blocked site data make localStorage throw; preferences then last one visit.
export function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not persisted; the in-memory value still applies for this visit.
  }
}
