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
  await page.keyboard.press('Tab');
  await card(page, 'ds1').focus();
  await page.keyboard.press('Enter');
  // Enter moves focus to the inspector heading; return it to the ringed card.
  await card(page, 'ds1').focus();
  await expect(card(page, 'ds1')).toHaveCSS('outline-style', 'solid');
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
  expect(await running(page)).toBeGreaterThan(0);
  await card(page, 'rb-a').click();
  expect(await running(page)).toBe(0);
});

const panel = (page: Page) => page.locator('aside.inspector');
const heading = (page: Page) => page.locator('#inspector-title');

test('a card opens the inspector opposite it, with focus on its heading', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').click();
  await expect(panel(page)).toHaveClass(/\bleft\b/);
  await expect(heading(page)).toBeFocused();
  await expect(heading(page)).toContainText('v1');
  await expect(panel(page)).toContainText('Produced by');
  await expect(panel(page)).toContainText('Executor');
  // The open panel now covers Observability, so use the keyboard, as a reader would.
  await page.locator('.region[data-party="observability"] .region-name').focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toHaveClass(/\bright\b/);
  await expect(panel(page)).toContainText('Does not');
});

test('Esc and ✕ close it and return focus to what opened it', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').focus();
  await page.keyboard.press('Enter');
  await expect(heading(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(card(page, 'ds1')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Close inspector' }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(card(page, 'ds1')).toBeFocused();
});

test('stepping keeps the panel and focus; content follows the beat', async ({ page }) => {
  await tick(page, at('P5')).click();
  await page.getByRole('button', { name: 'Intent', exact: true }).click();
  const back = page.getByRole('button', { name: '◄ Back' });
  await back.focus();
  await back.click();
  await expect(panel(page)).toBeVisible();
  await expect(back).toBeFocused();
  await expect(panel(page)).toContainText('derive network intent');
  await page.keyboard.press('ArrowRight');
  await expect(panel(page)).toContainText('derive desired state');
});

test('a line label shows its signal view, and says so when its beat has passed', async ({
  page,
}) => {
  await tick(page, at('P10')).click();
  await page.locator('.label', { hasText: 'check drift' }).click();
  await expect(panel(page)).toContainText('Answered by');
  await expect(panel(page)).toContainText('in sync');
  await page.keyboard.press('ArrowRight');
  await expect(panel(page)).toContainText('Signalled in P10');
  await page.keyboard.press('Escape');
  await expect(page.locator('#caption-heading')).toBeFocused();
});

test('a lineage link moves the selection; an earlier version rings its slot card', async ({
  page,
}) => {
  await tick(page, at('R7')).click();
  const ds = page.locator('.card[data-version^="ds"]').first();
  await ds.click();
  const side = await panel(page).getAttribute('class');
  await page.locator('.inspector-link', { hasText: 'Desired network state (v1)' }).click();
  await expect(heading(page)).toContainText('v1');
  await expect(heading(page)).toBeFocused();
  await expect(ds).toHaveClass(/\bselected\b/);
  expect(await panel(page).getAttribute('class')).toBe(side);
});

test('Esc with About open closes only About', async ({ page }) => {
  await tick(page, at('P10')).click();
  await card(page, 'ds1').click();
  await page.getByRole('button', { name: 'About' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.about')).not.toHaveAttribute('open');
  await expect(panel(page)).toBeVisible();
});

test('the panel never covers the selected card or the caption bar', async ({ page }) => {
  for (const v of ['ds1', 'slorule', 'wf-prov']) {
    // Close the previous panel first: it may cover the next card.
    await page.keyboard.press('Escape');
    await tick(page, at('P10')).click();
    await card(page, v).click();
    const [a, b, c] = await Promise.all([
      panel(page).boundingBox(),
      card(page, v).boundingBox(),
      page.locator('footer.caption').boundingBox(),
    ]);
    const overlap = (p: typeof a, q: typeof a) =>
      !!p &&
      !!q &&
      p.x < q.x + q.width &&
      q.x < p.x + p.width &&
      p.y < q.y + q.height &&
      q.y < p.y + p.height;
    expect(overlap(a, b), v).toBe(false);
    expect(overlap(a, c), v).toBe(false);
  }
});

test('inspectables respond to hover, and the caption hint goes after the first inspection', async ({
  page,
}) => {
  await tick(page, at('P10')).click();
  await expect(page.locator('.caption .hint')).toBeVisible();
  const portal = page.getByRole('button', { name: /^Portal$/ });
  await expect(portal).toHaveCSS('border-top-color', 'rgb(44, 52, 63)');
  await portal.hover();
  await expect(portal).toHaveCSS('border-top-color', 'rgb(139, 151, 168)');
  await card(page, 'ds1').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.caption .hint')).toHaveCount(0);
  await tick(page, at('P11')).click();
  await expect(page.locator('.caption .hint')).toHaveCount(0);
});

test('stepping from an inspector link that goes away keeps focus in the panel', async ({
  page,
}) => {
  await tick(page, at('P5')).click();
  await page.getByRole('button', { name: 'Intent', exact: true }).click();
  const link = page.locator('.inspector .inspector-link').first();
  await link.focus();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  }
  await expect(page.locator('#inspector-title')).toBeFocused();
});

test('closing after a click that focused nothing returns focus to the ringed element', async ({
  page,
}) => {
  await tick(page, at('P10')).click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  // Safari and Firefox: a click selects without focusing the button.
  await card(page, 'ds1').dispatchEvent('click');
  await page.keyboard.press('Escape');
  await expect(card(page, 'ds1')).toBeFocused();
});

test('closing a region selected by a click that focused nothing returns to its title', async ({
  page,
}) => {
  await tick(page, at('P10')).click();
  const intent = page.getByRole('button', { name: 'Intent', exact: true });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await intent.dispatchEvent('click');
  await page.keyboard.press('Escape');
  await expect(intent).toBeFocused();
});
