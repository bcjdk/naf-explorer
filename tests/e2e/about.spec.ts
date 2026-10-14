import { expect, test } from '@playwright/test';

// Brief 06: About opens on every load and refresh, closes with ✕, Esc or a click outside, and holds the story still.
test('About opens on load with focus on ✕, and again after a refresh', async ({ page }) => {
  await page.goto('/');
  const about = page.getByRole('dialog', { name: 'How Network Automation Works' });
  await expect(about).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close About' })).toBeFocused();
  // It opens on the short welcome.
  await expect(about).toContainText('Follow one ACME service through Provision');
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

test('the notes hold the framing, both liberties with their reasons, and the credits', async ({
  page,
}) => {
  await page.goto('/');
  const about = page.getByRole('dialog');
  await about.getByRole('button', { name: 'Notes and credits →' }).click();
  await expect(page.locator('#about-notes-title')).toBeFocused();
  await expect(about).toContainText('not a prescription for how network automation should look');
  await expect(about).toContainText('Presentation holds more than NAF’s Presentation layer.');
  await expect(about).toContainText('Collector enriches observations.');
  await expect(about.getByText('Why:')).toHaveCount(2);
  await expect(about).toContainText('Made by Brian Strube Jeggesen.');
  await expect(about).toContainText('Thomas Kjær Aabo');
  for (const link of await about.getByRole('link').all())
    await expect(link).toHaveAttribute('target', '_blank');
  await expect(about.getByRole('link')).toHaveCount(4);
  await about.getByRole('button', { name: '← Back' }).click();
  await expect(page.locator('#about-title')).toBeFocused();
  // Closing from the notes reopens on the welcome next time.
  await about.getByRole('button', { name: 'Notes and credits →' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'About', exact: true }).click();
  await expect(about).toContainText('Follow one ACME service through Provision');
});

test('both About views fit a 1440×900 window without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const fits = () =>
    page.evaluate(() => {
      const d = document.querySelector('dialog.about')!;
      return d.scrollHeight <= d.clientHeight;
    });
  expect(await fits()).toBe(true);
  await page.getByRole('button', { name: 'Notes and credits →' }).click();
  expect(await fits()).toBe(true);
});

test('closing the About window that opened on load puts focus on the story, not the page', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('#caption-heading')).toBeFocused();
});
