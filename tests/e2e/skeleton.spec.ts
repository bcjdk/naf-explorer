import { expect, test, type Page } from '@playwright/test';
import { linesOf, stateAt } from '../../src/model/state.ts';
import { STEPS } from '../../src/scenario/scenario.ts';

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
      versions: all('[data-version]').map((e) => e.dataset.version!),
      fresh: all('.new[data-version]').map((e) => e.dataset.version!),
      received: Object.fromEntries(
        all('[data-surface]')
          .filter((e) => e.dataset.received)
          .map((e) => [e.dataset.surface!, e.dataset.received!]),
      ),
      link: net.dataset.link,
      path: net.dataset.path,
      lines: all('.exchanges li').length,
    };
  });
  const id = STEPS[n]!.id;
  expect(dom.versions.toSorted(), id).toEqual(s.visible.toSorted());
  expect(dom.fresh.toSorted(), id).toEqual(s.newIds.toSorted());
  expect(dom.received, id).toEqual(s.surfaces);
  expect(dom.link, id).toBe(s.linkDegraded ? 'DEGRADED' : 'OK');
  expect(dom.path, id).toBe(s.acmePath ?? 'none');
  expect(dom.lines, id).toBe(linesOf(n).length);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
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
  await expect(counter(page)).toHaveText('22 / 36');
  await expect(page.locator('[data-surface="faultMgmt"]')).toContainText('✕ VIOLATED');
  await expect(page.locator('[data-version="ev-viol"]')).toBeVisible();
});

test('the exchange list shows the step’s signals, handoffs and work in causal order', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Go to P7: Apply' }).click();
  await expect(page.locator('.exchanges li')).toHaveText([
    'Orchestrator ⇢ Executor: apply desired state v1',
    'Intent → Executor: Desired network state (v1)',
    'Executor: render',
    'Executor: apply',
    'Executor → The Network: Configuration change (v1)',
    'Executor ⇢ Orchestrator: applied v1',
  ]);
});

test('the view switch changes text only, keeps the step and is remembered', async ({ page }) => {
  await page.keyboard.press('ArrowRight');
  const caption = page.locator('.caption p').first();
  await expect(caption).toContainText('Through the Portal');
  await page.getByRole('button', { name: 'Technical' }).click();
  await expect(caption).toContainText('ACME-L3VPN-001');
  await expect(counter(page)).toHaveText('2 / 36');
  await expect(page.getByText('Values illustrative')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Technical' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('switching views keeps every card, surface, network fact, exchange and focus', async ({
  page,
}) => {
  const d8 = stepIndex('D8');
  await tick(page, d8).click();
  const technical = page.getByRole('button', { name: 'Technical' });
  await technical.focus();
  await page.keyboard.press('Enter');
  await expect(technical).toHaveAttribute('aria-pressed', 'true');
  await expect(technical).toBeFocused();
  await expect(page.locator('[data-version="ev-viol"]')).toContainText(
    'event: acme-loss-violation',
  );
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

test('The Network keeps ground truth: degraded link, interface still UP as plain text', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Go to R14: Closing' }).click();
  const net = page.locator('section[data-party="network"]');
  await expect(net).toContainText('▲ DEGRADED');
  await expect(net).toContainText('path B');
  await expect(page.locator('.chip', { hasText: 'UP' })).toHaveCount(0);
});

test('nothing in the stage overflows, in any beat or either view', async ({ page }) => {
  test.setTimeout(120_000);
  for (const view of ['Simple', 'Technical'] as const) {
    await page.getByRole('button', { name: view }).click();
    for (let n = 0; n < STEPS.length; n++) {
      await tick(page, n).click();
      await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
      const over = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.region, .card, .surface, .caption')]
          .filter(
            (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
          )
          .map(
            (el) => el.dataset.party ?? el.dataset.version ?? el.dataset.surface ?? el.className,
          ),
      );
      expect(over, `${STEPS[n]!.id} ${view}`).toEqual([]);
    }
  }
});

// Review Focus 1
test('arrow keys still step the story while a header control has focus', async ({ page }) => {
  const technical = page.getByRole('button', { name: 'Technical' });
  await technical.focus();
  await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toHaveText('2 / 36');
  await expect(technical).toHaveAttribute('aria-pressed', 'false');
  await expect(technical).toBeFocused();
});

// Review Focus 2
test('modified arrows do not step the story', async ({ page }) => {
  for (const key of ['Alt+ArrowRight', 'Shift+ArrowRight', 'Control+ArrowRight']) {
    await page.keyboard.press(key);
    await expect(counter(page)).toHaveText('1 / 36');
  }
});

// Review Focus 3
test('Next on the last beat and Back on the first keep focus and stay put', async ({ page }) => {
  const back = page.getByRole('button', { name: '◄ Back' });
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText('1 / 36');
  await expect(back).toBeFocused();

  await page.getByRole('button', { name: 'Go to R14: Closing' }).click();
  const next = page.getByRole('button', { name: 'Next ►' });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText('36 / 36');
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute('aria-disabled', 'true');
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
    await page.getByRole('button', { name: 'Technical' }).click();
    await expect(page.getByRole('button', { name: 'Technical' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText('2 / 36');
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
