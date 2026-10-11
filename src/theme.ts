/**
 * Colour tokens, defined once (spec §10). App.svelte applies them as CSS custom properties;
 * tests/unit/contrast.test.ts checks their contrast. Provenance colours are accents only,
 * never fills or text; status colours are never provenance colours.
 */
export const TOKENS = {
  bg: '#0f1216',
  panel: '#151a20',
  'panel-active': '#1a2129',
  card: '#1b2129',
  'card-earlier': '#161b22',
  /** Earlier beats' cards: the dimmest text that still meets AA on their background. */
  faded: '#7d8796',
  'border-faint': '#222932',
  border: '#2c343f',
  'border-new': '#8b97a8',
  text: '#e6e9ee',
  muted: '#a3adbb',
  line: '#9aa5b4',
  tick: '#6b7686',
  presentation: '#f5c518',
  observability: '#00e676',
  orchestrator: '#00d4ff',
  intent: '#ff6d2e',
  collector: '#f43f5e',
  executor: '#6366f1',
  network: '#64748b',
  'chip-text': '#e6e9ee',
  'hatch-a': '#d4d9e0',
  'hatch-b': '#aeb6c1',
  'hatch-text': '#0f1216',
  violated: '#e879f9',
  'violated-text': '#0f1216',
} as const;

export const tokenStyle = Object.entries(TOKENS)
  .map(([k, v]) => `--${k}:${v}`)
  .join(';');
