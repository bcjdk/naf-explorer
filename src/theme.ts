/**
 * Colour tokens, defined once (spec §10, ADR 0003). App.svelte applies them as CSS custom properties;
 * tests/unit/contrast.test.ts checks their contrast. Provenance colours mark who produced a thing: edges, swatches,
 * handoff strokes, bands and opaque tints. They never colour a run of text, status, selection, focus or activity.
 */
export const TOKENS = {
  bg: '#0f1216',
  panel: '#151a20',
  'panel-active': '#1d2631',
  card: '#1b2129',
  'card-earlier': '#161b22',
  /** Hover on anything inspectable (cards, surfaces, labels): one step up from card. */
  'card-hover': '#232a34',
  /** Text on a solid producer band (spec §2.2): dark on the light colours, white on Executor and The Network. */
  'on-band-dark': '#0f1216',
  'on-band-light': '#ffffff',
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
  /** Executor's band fill only: 8% darker, so white text meets AA (4.47:1 on the true colour; plan 5 D1). */
  'executor-band': '#5b5ede',
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
