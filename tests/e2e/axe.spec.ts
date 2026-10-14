import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { STEPS } from '../../src/scenario/scenario.ts';

const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const tick = (page: Page, n: number) =>
  page.getByRole('button', { name: `Go to ${STEPS[n]!.id}: ${STEPS[n]!.title}` });

/** Serious and critical violations only, as "rule: first target" lines so a failure names the culprit. */
async function violations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`);
}

test('About, as it opens on load, has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await violations(page)).toEqual([]);
  await page.getByRole('button', { name: 'Notes and credits →' }).click();
  expect(await violations(page), 'notes').toEqual([]);
});

for (const view of ['Simple', 'Technical'] as const) {
  test(`${view}: P1, D10 and R14, with and without the inspector, have no serious violations`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: view }).click();
    for (const id of ['P1', 'D10', 'R14']) {
      await tick(page, at(id)).click();
      await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
      expect(await violations(page), id).toEqual([]);
    }
    await page.locator('.card').first().click();
    await expect(page.locator('.inspector')).toBeVisible();
    expect(await violations(page), 'R14 with the inspector').toEqual([]);
  });
}
