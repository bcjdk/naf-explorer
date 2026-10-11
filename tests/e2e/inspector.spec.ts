import { expect, test, type Page } from '@playwright/test';
import { STEPS } from '../../src/scenario/scenario.ts';

const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const tick = (page: Page, n: number) =>
  page.getByRole('button', { name: `Go to ${STEPS[n]!.id}: ${STEPS[n]!.title}` });
const card = (page: Page, v: string) => page.locator(`.card[data-version="${v}"]`);
const running = (page: Page) =>
  page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
});

test('cards, surfaces and region titles are buttons with full names', async ({ page }) => {
  await tick(page, at('P10')).click();
  await expect(
    page.getByRole('button', { name: /^Desired network state v1, by Intent, in sync$/ }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Portal$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Intent', exact: true })).toBeVisible();
});

test('clicking a card rings it; selection is not focus styling', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').click();
  await expect(card(page, 'ds1')).toHaveClass(/\bselected\b/);
  await expect(card(page, 'ds1')).toHaveAttribute('aria-current', 'true');
  await expect(card(page, 'ds1')).toHaveCSS('outline-style', 'dashed');
});

test('Enter on a region title, a surface and a line label selects them', async ({ page }) => {
  await tick(page, at('P15')).click();
  await page.getByRole('button', { name: 'Intent', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-party="intent"]')).toHaveClass(/\bselected\b/);
  await page.locator('.surface[data-surface="portal"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.surface[data-surface="portal"]')).toHaveClass(/\bselected\b/);
  await expect(page.locator('[data-party="intent"]')).not.toHaveClass(/\bselected\b/);
  const label = page.locator('.label').first();
  await label.focus();
  await page.keyboard.press('Enter');
  await expect(label).toHaveClass(/\bselected\b/);
});

test('selecting, or focusing a line label, finishes running motion', async ({ page }) => {
  await tick(page, at('P9') - 1).click();
  await page.getByRole('button', { name: 'Next ►' }).click();
  expect(await running(page)).toBeGreaterThan(0);
  await page.locator('.label').last().focus();
  expect(await running(page)).toBe(0);
  await tick(page, at('P9') - 1).click();
  await page.getByRole('button', { name: 'Next ►' }).click();
  await card(page, 'rb-a').click();
  expect(await running(page)).toBe(0);
});
