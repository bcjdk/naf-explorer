import { expect, test, type Page } from '@playwright/test';
import { STEPS } from '../../src/scenario/scenario.ts';
import { stepLength, timeline } from '../../src/model/timeline.ts';

const counter = (page: Page) => page.getByTestId('counter');
const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const tick = (page: Page, n: number) =>
  page.getByRole('button', { name: `Go to ${STEPS[n]!.id}: ${STEPS[n]!.title}` });
const next = (page: Page) => page.getByRole('button', { name: 'Next ►' });
const running = (page: Page) =>
  page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
const stageHtml = (page: Page) => page.evaluate(() => document.querySelector('.stage')!.innerHTML);

test.beforeEach(async ({ page }) => {
  // About opens on every load (brief 06); tests/e2e/about.spec.ts covers it.
  await page.goto('/');
  await page.keyboard.press('Escape');
});

test('Next plays the new beat, then settles at its end state', async ({ page }) => {
  const n = at('P9');
  await tick(page, n - 1).click();
  expect(await running(page)).toBe(0);
  await next(page).click();
  await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
  expect(await running(page)).toBeGreaterThan(0);
  await expect.poll(() => running(page), { timeout: stepLength(timeline(n)) + 3000 }).toBe(0);
});

test('→ plays the beat like Next', async ({ page }) => {
  await tick(page, at('P8') - 1).click();
  await page.keyboard.press('ArrowRight');
  expect(await running(page)).toBeGreaterThan(0);
});

test('Back and jumps show the end state at once, finishing any running motion', async ({
  page,
}) => {
  await tick(page, at('P8') - 1).click();
  await next(page).click();
  expect(await running(page)).toBeGreaterThan(0);
  await page.keyboard.press('ArrowLeft');
  expect(await running(page)).toBe(0);
  await next(page).click();
  await tick(page, at('D8')).click();
  expect(await running(page)).toBe(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every beat reached with Next shows the animated end state, with no motion', async ({
    page,
  }) => {
    const reduced: string[] = [];
    for (let n = 1; n < STEPS.length; n++) {
      await page.keyboard.press('ArrowRight');
      await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
      expect(await running(page), STEPS[n]!.id).toBe(0);
      reduced.push(await stageHtml(page));
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await tick(page, 0).click();
    for (let n = 1; n < STEPS.length; n++) {
      await page.keyboard.press('ArrowRight');
      await expect(counter(page)).toHaveText(`${n + 1} / ${STEPS.length}`);
      await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
      expect(await stageHtml(page), STEPS[n]!.id).toBe(reduced[n - 1]);
    }
  });
});
