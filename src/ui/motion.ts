import type { MotionSlot } from '../model/timeline.ts';
import { TOKENS } from '../theme.ts';

type Target = [Element, Keyframe[], KeyframeAnimationOptions?];

const FADE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
/** The dot holds at the sender with a blink and a ring, then travels to the receiver (spec rev 6). */
const TRAVEL: Keyframe[] = [
  { offset: 0, offsetDistance: '0%', opacity: 0, transform: 'scale(0.4)' },
  {
    offset: 0.06,
    offsetDistance: '0%',
    opacity: 1,
    transform: 'scale(2.6)',
    boxShadow: '0 0 0 0 rgb(230 233 238 / 0.6)',
  },
  {
    offset: 0.18,
    offsetDistance: '0%',
    transform: 'scale(1.6)',
    boxShadow: '0 0 0 8px rgb(230 233 238 / 0)',
  },
  { offset: 0.28, offsetDistance: '0%', transform: 'scale(1)' },
  { offset: 0.88, opacity: 1 },
  { offset: 1, offsetDistance: '100%', transform: 'scale(1)', opacity: 0 },
];
/** The region's idle background; the end state (active or not) is whatever the CSS renders. */
const LIGHT_UP: Keyframe[] = [{ offset: 0, backgroundColor: TOKENS.panel }];
/** "Gains the result": a brief inset edge, neither the activity background nor the selection ring. */
const GAIN: Keyframe[] = [{ offset: 0.35, boxShadow: `inset 0 0 0 1px ${TOKENS['border-new']}` }];
const PULSE: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.18)' },
  { transform: 'scale(1)' },
];

const place = (t: string) =>
  t.startsWith('surface:')
    ? `.surface[data-surface="${t.slice(8)}"]`
    : `.region[data-party="${t}"]`;

function targets(s: MotionSlot): Target[] {
  const each = (sel: string, k: Keyframe[], o?: KeyframeAnimationOptions): Target[] =>
    [...document.querySelectorAll(sel)].map((el) => [el, k, o]);
  const t = s.target;
  switch (s.kind) {
    case 'work':
      return [
        ...each(place(t), LIGHT_UP),
        ...each(`#h-${t} .work, path.route.work[data-party="${t}"]`, FADE),
      ];
    case 'line':
      return [
        ...each(`path.route[data-route="${t}"], .label[data-route="${t}"]`, FADE),
        ...each(`.pulse[data-route="${t}"]`, TRAVEL, { easing: 'ease-in-out' }),
      ];
    case 'appear': {
      const card = document.querySelector(`.card[data-version="${t}"], .mini[data-version="${t}"]`);
      if (!card) return [];
      // A card with earlier versions keeps its stacked edges and fades in its new text; a first one fades in whole.
      return /\bstack-[12]\b/.test(card.className)
        ? [...card.children].map((c): Target => [c, FADE])
        : [[card, FADE]];
    }
    case 'mark':
      return each(`.card[data-version="${t}"] .marker`, FADE);
    case 'network':
      return each(
        t === 'link'
          ? '[data-party="network"] .topology :is(.degraded, .direction), [data-fact="link"]'
          : '[data-party="network"] .topology .acme, [data-fact="path"]',
        FADE,
      );
    case 'gain':
      return each(place(t), GAIN);
    case 'pulse': {
      const chip =
        t === 'link'
          ? '[data-party="network"] .facts .chip'
          : t.startsWith('surface:')
            ? `${place(t)} .chip`
            : `.card[data-version="${t}"] .chip`;
      return each(chip, PULSE, { iterations: 3, duration: s.duration / 3 });
    }
  }
}

/** Animates the rendered end state in, slot by slot. Elements a beat doesn't draw are skipped. */
export function play(slots: MotionSlot[]): void {
  for (const s of slots)
    for (const [el, keyframes, options] of targets(s))
      el.animate(keyframes, {
        delay: s.start,
        duration: s.duration,
        easing: 'ease-out',
        fill: 'backwards',
        ...options,
      });
}

/** Jumps every running animation to its end, which is the rendered end state. */
export const finishAll = (): void => document.getAnimations().forEach((a) => a.finish());

export const prefersReducedMotion = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
