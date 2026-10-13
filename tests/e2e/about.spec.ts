import { expect, test } from '@playwright/test';

// Brief 06: About opens on every load and refresh, closes with ✕, Esc or a click outside, and holds the story still.
test('About opens on load with focus on ✕, and again after a refresh', async ({ page }) => {
  await page.goto('/');
  const about = page.getByRole('dialog', { name: 'How Network Automation Works' });
  await expect(about).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close About' })).toBeFocused();
  await expect(about).toContainText('not a prescription for how network automation should look');
  await page.keyboard.press('Escape');
  await expect(about).toBeHidden();
  await page.reload();
  await expect(about).toBeVisible();
});

test('arrow keys do not move the story while About is open', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('counter')).toHaveText('1 / 40');
});

test('the About button reopens it; ✕ and a click outside close it, and focus returns', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  const open = page.getByRole('button', { name: 'About', exact: true });
  const about = page.getByRole('dialog');
  await open.click();
  await expect(about).toBeVisible();
  await page.getByRole('button', { name: 'Close About' }).click();
  await expect(about).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await page.mouse.click(5, 5);
  await expect(about).toBeHidden();
  await expect(open).toBeFocused();
});

test('About links open in a new tab', async ({ page }) => {
  await page.goto('/');
  for (const link of await page.getByRole('dialog').getByRole('link').all()) {
    await expect(link).toHaveAttribute('target', '_blank');
  }
  await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(3);
});
