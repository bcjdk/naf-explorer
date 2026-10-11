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

const replay = (page: Page) => page.getByRole('button', { name: 'Replay' });

test('Replay plays the current beat again and keeps focus', async ({ page }) => {
  await tick(page, at('P6')).click();
  expect(await running(page)).toBe(0);
  await replay(page).click();
  expect(await running(page)).toBeGreaterThan(0);
  await expect(replay(page)).toBeFocused();
  await expect(counter(page)).toHaveText(`${at('P6') + 1} / ${STEPS.length}`);
});

test('rapid presses land exactly N beats later, play only the last, and settle at its end state', async ({
  page,
}) => {
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await expect(counter(page)).toHaveText(`6 / ${STEPS.length}`);
  await expect.poll(() => running(page), { timeout: stepLength(timeline(5)) + 3000 }).toBe(0);
  const animated = await stageHtml(page);
  await tick(page, 4).click();
  await tick(page, 5).click();
  expect(await stageHtml(page)).toBe(animated);
});

test('Next keeps focus through rapid clicks, and focus never drops to body', async ({ page }) => {
  for (let i = 0; i < 3; i++) await next(page).click();
  await expect(next(page)).toBeFocused();
  await expect(counter(page)).toHaveText(`4 / ${STEPS.length}`);
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
});

test('switching views mid-motion keeps the beat, the motion and focus', async ({ page }) => {
  await tick(page, at('P9') - 1).click();
  await next(page).click();
  const technical = page.getByRole('button', { name: 'Technical' });
  await technical.click();
  await expect(counter(page)).toHaveText(`${at('P9') + 1} / ${STEPS.length}`);
  expect(await running(page)).toBeGreaterThan(0);
  await expect(technical).toBeFocused();
});

test('opening About finishes the running motion, and the story stays put', async ({ page }) => {
  await tick(page, at('P9') - 1).click();
  await next(page).click();
  await page.getByRole('button', { name: 'About' }).click();
  expect(await running(page)).toBe(0);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(counter(page)).toHaveText(`${at('P9') + 1} / ${STEPS.length}`);
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

  test('Replay does nothing but keeps focus', async ({ page }) => {
    await tick(page, at('P6')).click();
    await replay(page).click();
    expect(await running(page)).toBe(0);
    await expect(replay(page)).toBeFocused();
  });
});
