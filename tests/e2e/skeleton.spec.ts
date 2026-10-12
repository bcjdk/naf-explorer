import { expect, test, type Page } from '@playwright/test';
import { stateAt } from '../../src/model/state.ts';
import { routesOf } from '../../src/routes.ts';
import { SLOTS } from '../../src/layout.ts';
import { MARKER_TEXT, statusText } from '../../src/model/describe.ts';
import { ENDING, STEPS, version } from '../../src/scenario/scenario.ts';

const counter = (page: Page) => page.getByTestId('counter');
const stepIndex = (id: string) => STEPS.findIndex((s) => s.id === id);
const tick = (page: Page, n: number) =>
  page.getByRole('button', { name: `Go to ${STEPS[n]!.id}: ${STEPS[n]!.title}` });

/** The DOM shows exactly stateAt(n): every card, new flag, surface, network fact and exchange. */
async function expectEndState(page: Page, n: number) {
  await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
  const s = stateAt(n);
  const dom = await page.evaluate(() => {
    const all = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];
    const net = document.querySelector<HTMLElement>('[data-party="network"]')!;
    return {
      text: Object.fromEntries(
        all('[data-version]').map((e) => [e.dataset.version!, e.textContent!]),
      ),
      chips: all('.chip').map((e) => e.textContent!.trim()),
      versions: all('[data-version]').map((e) => e.dataset.version!),
      fresh: all('.new[data-version]').map((e) => e.dataset.version!),
      received: Object.fromEntries(
        all('[data-surface]')
          .filter((e) => e.dataset.received)
          .map((e) => [e.dataset.surface!, e.dataset.received!]),
      ),
      link: net.dataset.link,
      path: net.dataset.path,
      labels: all('.label').map((e) => e.textContent!.trim()),
    };
  });
  const id = STEPS[n]!.id;
  expect(dom.versions.toSorted(), id).toEqual(s.visible.toSorted());
  expect(dom.fresh.toSorted(), id).toEqual(s.newIds.toSorted());
  expect(dom.received, id).toEqual(s.surfaces);
  expect(dom.link, id).toBe(s.linkDegraded ? 'DEGRADED' : 'OK');
  expect(dom.path, id).toBe(s.acmePath ?? 'none');
  expect(dom.labels, id).toEqual(
    routesOf(n, 'simple')
      .filter((r) => r.kind !== 'work')
      .map((r) => r.label),
  );
  for (const vid of s.visible) {
    const v = version(vid);
    if (v.status) expect(dom.text[vid], `${id} ${vid}`).toContain(statusText(v.status));
    const m = s.markers[vid];
    if (m) expect(dom.text[vid], `${id} ${vid}`).toContain(MARKER_TEXT[m]);
  }
  for (const c of dom.chips) expect(c, id).toMatch(/^(✓ HEALTHY|▲ DEGRADED|✕ VIOLATED|✓ CLEARED)$/);
}

test.beforeEach(async ({ page }) => {
  // About opens on every load (brief 06); story tests close it first. tests/e2e/about.spec.ts covers it.
  await page.goto('/');
  await page.keyboard.press('Escape');
});

test('the app loads at the first beat', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How Network Automation Works');
  await expectEndState(page, 0);
});

test('the keyboard walks the whole story forward and back, showing each beat’s end state', async ({
  page,
}) => {
  for (let n = 1; n < STEPS.length; n++) {
    await page.keyboard.press('ArrowRight');
    await expectEndState(page, n);
  }
  await page.keyboard.press('ArrowRight');
  await expectEndState(page, STEPS.length - 1);
  for (let n = STEPS.length - 2; n >= 0; n--) {
    await page.keyboard.press('ArrowLeft');
    await expectEndState(page, n);
  }
  await page.keyboard.press('ArrowLeft');
  await expectEndState(page, 0);
});

test('jumps in any order show the target beat’s end state', async ({ page }) => {
  for (const id of ['D8', 'P2', 'R14', 'P8', 'P1', 'R6', 'D1', 'R13', 'P14']) {
    await tick(page, stepIndex(id)).click();
    await expectEndState(page, stepIndex(id));
  }
  await page.getByRole('button', { name: 'Remediate' }).click();
  await expectEndState(page, stepIndex('R1'));
});

test('a step tick jumps to that beat and shows its end state', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to D8: Raise event' }).click();
  await expect(counter(page)).toHaveText('23 / 38');
  await expect(page.locator('[data-surface="faultMgmt"]')).toContainText('✕ VIOLATED');
  await expect(page.locator('[data-version="ev-viol"]')).toBeVisible();
});

test('the beat’s lines are drawn and labelled in causal order', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to P8: Apply' }).click();
  await expect(page.locator('.label')).toHaveText([
    'Desired network state (v1)',
    'Configuration change (v1)',
    'applied v1',
  ]);
  await expect(page.locator('path.route.signal')).toHaveCount(1);
  await expect(page.locator('path.route.handoff')).toHaveCount(2);
});

test('Orchestrator orders the apply with its own work order, in its own beat', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to P7: Order apply' }).click();
  await expect(page.locator('.label')).toHaveText(['Apply request (desired state v1)']);
  await expect(page.locator('[data-version="ar1"]')).toHaveClass(/new/);
});

test('the running workflow shows its steps and what Orchestrator is waiting for', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Go to P4: Derive network intent' }).click();
  const wf = page.locator('[data-version="wf-prov"]');
  await expect(wf.locator('.wf-steps .now')).toHaveText('derive');
  await expect(wf.locator('.waiting')).toHaveText('waiting for Intent: desired state ready');
  await page.getByRole('button', { name: 'Go to P15: Report' }).click();
  await expect(wf.locator('.waiting')).toHaveCount(0);
  await expect(wf.locator('.wf-steps .done')).toHaveCount(6);
});

test('the view switch changes text only, keeps the step and is remembered', async ({ page }) => {
  await page.keyboard.press('ArrowRight');
  const caption = page.locator('.caption p').first();
  await expect(caption).toContainText('Through the Portal');
  await page.getByRole('button', { name: 'Technical' }).click();
  await expect(caption).toContainText('ACME-L3VPN-001');
  await expect(counter(page)).toHaveText('2 / 38');
  await expect(page.getByText('Values illustrative')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Technical' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('switching views keeps every card, surface, network fact, line and focus', async ({
  page,
}) => {
  const d8 = stepIndex('D8');
  await tick(page, d8).click();
  const technical = page.getByRole('button', { name: 'Technical' });
  await technical.focus();
  await page.keyboard.press('Enter');
  await expect(technical).toHaveAttribute('aria-pressed', 'true');
  await expect(technical).toBeFocused();
  await expect(page.locator('[data-version="ev-viol"]')).toContainText('acme-loss-violation');
  await expectEndState(page, d8);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Simple' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expectEndState(page, d8);
});

test('Portal shows what it received and keeps its own request', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to D7: Evaluate' }).click();
  const portal = page.locator('[data-surface="portal"]');
  await expect(portal).toContainText('▲ DEGRADED');
  await expect(portal.locator('[data-version="sr"]')).toContainText('Service request');
});

test('earlier versions read as spaced text', async ({ page }) => {
  await tick(page, stepIndex('R14')).click();
  await expect(page.locator('[data-version="ds1"]')).toHaveText('earlier version: v1 = IN SYNC');
  await expect(page.locator('[data-version="wf-prov"]')).toHaveText(
    'earlier version: provision completed',
  );
});

test('The Network keeps ground truth: degraded link, interface still UP as plain text', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Go to R15: Closing' }).click();
  const net = page.locator('section[data-party="network"]');
  await expect(net).toContainText('▲ DEGRADED');
  await expect(net).toContainText('path B');
  await expect(page.locator('.chip', { hasText: 'UP' })).toHaveCount(0);
});

test('nothing overflows, cards stay in their region without overlapping, and labels cover no card', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.evaluate(() => document.fonts.ready);
  for (const view of ['Simple', 'Technical'] as const) {
    await page.getByRole('button', { name: view }).click();
    for (let n = 0; n < STEPS.length; n++) {
      await tick(page, n).click();
      await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
      const over = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.region, .card, .surface, .caption, .label')]
          .filter(
            (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
          )
          .map(
            (el) => el.dataset.party ?? el.dataset.version ?? el.dataset.surface ?? el.className,
          ),
      );
      expect(over, `${STEPS[n]!.id} ${view}`).toEqual([]);
      const clash = await page.evaluate(() => {
        const box = (el: Element) => el.getBoundingClientRect();
        const hit = (a: DOMRect, b: DOMRect) =>
          a.left < b.right - 0.5 &&
          b.left < a.right - 0.5 &&
          a.top < b.bottom - 0.5 &&
          b.top < a.bottom - 0.5;
        const inside = (a: DOMRect, b: DOMRect) =>
          a.left >= b.left - 0.5 &&
          a.right <= b.right + 0.5 &&
          a.top >= b.top - 0.5 &&
          a.bottom <= b.bottom + 0.5;
        const cards = [...document.querySelectorAll<HTMLElement>('.card')];
        const out: string[] = [];
        const labels = [...document.querySelectorAll<HTMLElement>('.label')];
        const others = [...document.querySelectorAll<HTMLElement>('.surface, .facts, .net-role')];
        // Region headers: measure the text itself, since the heading box spans the region's width.
        const headers = [...document.querySelectorAll<HTMLElement>('.region h2')].map((h) => {
          const range = document.createRange();
          range.selectNodeContents(h);
          return { name: h.textContent!.trim().slice(0, 24), rect: range.getBoundingClientRect() };
        });
        labels.forEach((l, i) => {
          for (const m of labels.slice(i + 1))
            if (hit(box(l), box(m)))
              out.push(`label "${l.textContent}" overlaps "${m.textContent}"`);
          for (const o of others)
            if (hit(box(l), box(o))) out.push(`label "${l.textContent}" covers ${o.className}`);
          for (const h of headers)
            if (hit(box(l), h.rect)) out.push(`label "${l.textContent}" covers header "${h.name}"`);
        });
        for (const c of cards) {
          const earlier = c.querySelectorAll('[data-version]').length;
          if (!c.classList.contains(`stack-${Math.min(earlier, 2)}`))
            out.push(`${c.dataset.version} not stacked`);
          if (!inside(box(c), box(c.closest('.region')!)))
            out.push(`${c.dataset.version} outside region`);
          for (const d of cards)
            if (c !== d && hit(box(c), box(d)))
              out.push(`${c.dataset.version} overlaps ${d.dataset.version}`);
          for (const l of document.querySelectorAll<HTMLElement>('.label'))
            if (hit(box(l), box(c)))
              out.push(`label "${l.textContent}" covers ${c.dataset.version}`);
        }
        return out;
      });
      expect(clash, `${STEPS[n]!.id} ${view}`).toEqual([]);
    }
  }
});

test('the caption never runs under the buttons, the scope note or the top-right slot', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.evaluate(() => document.fonts.ready);
  for (const view of ['Technical', 'Simple'] as const) {
    await page.getByRole('button', { name: view }).click();
    for (let n = 0; n < STEPS.length; n++) {
      await tick(page, n).click();
      const clash = await page.evaluate(() => {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector('.caption p[aria-live]')!);
        const lines = [...range.getClientRects()];
        const others = [
          ...document.querySelectorAll('.caption :is(.scope, .nav, .hint, .legend, .ending)'),
        ].map((e) => ({ name: e.className, r: e.getBoundingClientRect() }));
        const hit = (a: DOMRect, b: DOMRect) =>
          a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        return others.filter((o) => lines.some((l) => hit(l, o.r))).map((o) => o.name);
      });
      expect(clash, `${STEPS[n]!.id} ${view}`).toEqual([]);
    }
  }
});

test('the explainer uses its own faces, not the fallbacks', async ({ page }) => {
  await page.getByRole('button', { name: 'Technical' }).click();
  await tick(page, stepIndex('P5')).click();
  await page.evaluate(() => document.fonts.ready);
  const used = await page.evaluate(() => ({
    sans: document.fonts.check('500 15px "Source Sans 3"'),
    mono: document.fonts.check('500 13px "Source Code Pro"'),
    caption: getComputedStyle(document.querySelector('.caption p')!).fontFamily,
    code: getComputedStyle(document.querySelector('.card code')!).fontFamily,
  }));
  expect(used.sans).toBe(true);
  expect(used.mono).toBe(true);
  expect(used.caption).toMatch(/^"?Source Sans 3/);
  expect(used.code).toMatch(/^"?Source Code Pro/);
});

// Review Focus 1
test('arrow keys still step the story while a header control has focus', async ({ page }) => {
  const technical = page.getByRole('button', { name: 'Technical' });
  await technical.focus();
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toHaveText('2 / 38');
  await expect(technical).toHaveAttribute('aria-pressed', 'false');
  await expect(technical).toBeFocused();
});

test('stepping while a line label has focus keeps focus on the story', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to P8: Apply' }).click();
  await page.locator('.label').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toHaveText('9 / 38');
  const focused = await page.evaluate(
    () =>
      document.activeElement?.classList.contains('label') ||
      document.activeElement?.id === 'caption-heading',
  );
  expect(focused).toBe(true);
});

// Review Focus 2
test('modified arrows do not step the story', async ({ page }) => {
  for (const key of ['Alt+ArrowRight', 'Shift+ArrowRight', 'Control+ArrowRight']) {
    await page.keyboard.press(key);
    await expect(counter(page)).toHaveText('1 / 38');
  }
});

// Review Focus 3
test('Back on the first beat stays put; on the last beat Next becomes Start over', async ({
  page,
}) => {
  const back = page.getByRole('button', { name: 'Back', exact: true });
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText('1 / 38');
  await expect(back).toBeFocused();

  await page.getByRole('button', { name: 'Go to R14: Report and clear' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  // Pressed while R15 is still animating, by keyboard (Review Focus 3).
  const restart = page.getByRole('button', { name: 'Start over' });
  await restart.focus();
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText('1 / 38');
  const next = page.getByRole('button', { name: 'Next', exact: true });
  await expect(next).toBeFocused();
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});

test('the last beat completes the story: every tick done, a completion line', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to R15: Closing' }).click();
  await expect(page.locator('.caption .ending')).toHaveText(ENDING);
  await expect(page.locator('.tick:not([aria-current])')).toHaveCount(STEPS.length - 1);
  await expect(page.locator('.tick.done')).toHaveCount(STEPS.length - 1);
});

// Review Focus 4: blocked storage, either at access or in its methods
const blockers: Record<string, () => void> = {
  'access to storage throws': () => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('SecurityError: storage blocked');
      },
    });
  },
  'the storage methods throw': () => {
    Storage.prototype.getItem = () => {
      throw new Error('SecurityError: denied');
    };
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError: full');
    };
  },
};
for (const [name, block] of Object.entries(blockers)) {
  test(`the app works when ${name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(block);
    await page.goto('/');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Technical' }).click();
    await expect(page.getByRole('button', { name: 'Technical' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText('2 / 38');
    expect(errors).toEqual([]);
  });
}

// Review Focus 5, plus checklist 07 "fits at 1280×720 and 1920×1080"
for (const [w, h] of [
  [1280, 720],
  [1920, 1080],
  [1024, 640],
] as const) {
  test(`the whole stage fits ${w}×${h} without scrollbars`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const box = (await page.locator('.stage').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(-0.5);
    expect(box.y).toBeGreaterThanOrEqual(-0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(w + 0.5);
    expect(box.y + box.height).toBeLessThanOrEqual(h + 0.5);
    const scroll = await page.evaluate(() => {
      const el = document.scrollingElement!;
      return { x: el.scrollWidth - el.clientWidth, y: el.scrollHeight - el.clientHeight };
    });
    expect(scroll).toEqual({ x: 0, y: 0 });
  });
}

test('colour shows who made it: bands on new cards, edges on used ones, coloured handoffs', async ({
  page,
}) => {
  await tick(page, stepIndex('P5')).click();
  const s = stateAt(stepIndex('P5'));
  const fresh = s.newIds[0]!;
  const band = page.locator(`.card[data-version="${fresh}"] .head`);
  // Intent's band: the producer colour behind dark text.
  await expect(band).toHaveCSS('background-color', 'rgb(255, 109, 46)');
  await expect(band).toHaveCSS('color', 'rgb(15, 18, 22)');
  await expect(band).toHaveCSS('text-transform', 'uppercase');
  // Region names are sentence case at 17px bold, with no "●" before the work.
  const h = page.locator('#h-intent');
  await expect(h.locator('.region-name')).toHaveCSS('font-size', '17px');
  await expect(h.locator('.region-name')).toHaveCSS('text-transform', 'none');
  await expect(h.locator('.work')).not.toContainText('●');
  await expect(page.locator('.region[data-party="intent"]')).toHaveCSS('border-top-width', '4px');
  // A handoff line and its label carry the producer's colour; signals stay neutral.
  await tick(page, stepIndex('P6')).click();
  const sd = '[data-route="intent>observability:sloDefinition"]';
  // Arrowheads take their line's colour; `context-stroke` fell back to black.
  const markerFill = (sel: string) =>
    page.evaluate((q) => {
      const el = document.querySelector(q)!;
      const id = getComputedStyle(el).markerEnd.match(/#([^")]+)/)![1];
      return {
        stroke: getComputedStyle(el).stroke,
        fill: getComputedStyle(document.querySelector(`#${id} path`)!).fill,
      };
    }, sel);
  const sameColour = async (sel: string) => {
    const m = await markerFill(sel);
    expect(m.fill).toBe(m.stroke);
  };
  await sameColour(`path.route${sd}`);
  expect((await markerFill('path.route.signal')).fill).toBe('rgb(154, 165, 180)');
  const handoff = page.locator(`path.route${sd}`);
  await expect(handoff).toHaveCSS('stroke', 'rgb(255, 109, 46)');
  await expect(handoff).toHaveCSS('stroke-width', '2.5px');
  await expect(page.locator(`.label${sd} .swatch`)).toHaveCSS(
    'background-color',
    'rgb(255, 109, 46)',
  );
  await expect(page.locator('path.route.signal').first()).toHaveCSS('stroke', 'rgb(154, 165, 180)');
  // Work inside a responsibility is a minor handoff: same producer colour, thinner, solid, smaller arrow.
  await tick(page, stepIndex('P14')).click();
  const work = page.locator('path.route.work[data-party="observability"]').first();
  await expect(work).toHaveCSS('stroke', 'rgb(0, 230, 118)');
  await expect(work).toHaveCSS('stroke-width', '1.5px');
  await expect(work).toHaveCSS('stroke-dasharray', 'none');
  await expect(work).toHaveAttribute('marker-end', /arrow-minor/);
  await sameColour('path.route.work[data-party="observability"]');
  // Executor's band is a shade darker so white text meets AA (plan 5 D1).
  await tick(page, stepIndex('P8')).click();
  const cc = page.locator(`.card[data-version="${stateAt(stepIndex('P8')).newIds[0]}"] .head`);
  await expect(cc).toHaveCSS('background-color', 'rgb(91, 94, 222)');
  await expect(cc).toHaveCSS('color', 'rgb(255, 255, 255)');
  // A card used this beat keeps its full-strength 4px provenance edge.
  // A card both made and used this beat shows as new; the service request sits in Portal, not on a card.
  const onCard = (n: number) =>
    stateAt(n).touched.filter((id) => SLOTS[version(id).kind] && !stateAt(n).newIds.includes(id));
  const used = STEPS.findIndex((_, n) => onCard(n).length > 0);
  await tick(page, used).click();
  await expect(page.locator(`.card[data-version="${onCard(used)[0]}"]`)).toHaveCSS(
    'border-left-width',
    '4px',
  );
});
