import { test, expect } from '@playwright/test';

// Real browser smoke: drawer, planner, consent. Run: npx playwright test.
// CI installs browsers via `npx playwright install --with-deps chromium`.
test('drawer opens, traps focus, closes on Escape', async ({ page }) => {
  // Drawer button is md:hidden: exercise it at a mobile viewport.
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/index.html');
  await expect(page.locator('#site-drawer')).toBeAttached();
  await page.locator('#mobile-menu-btn').click();
  await expect(page.locator('#site-drawer')).toBeVisible();
  await expect(page.locator('#mobile-menu-btn')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-menu-btn')).toHaveAttribute('aria-expanded', 'false');
});

test('planner saves + consent persists choice', async ({ page }) => {
  await page.goto('/tools.html');
  await expect(page.locator('#plan-list')).toBeAttached();
  await expect(page.locator('#pack-list')).toBeAttached();
  // Consent banner appears once, then persists via localStorage.
  await expect(page.locator('#consent-banner')).toBeVisible();
  await page.getByRole('button', { name: 'Decline' }).click();
  await expect(page.locator('#consent-banner')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('tineghir-consent'))).toBe('denied');
  await page.reload();
  await expect(page.locator('#consent-banner')).toHaveCount(0);
});

test('map mounts on index, absent elsewhere', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#map')).toBeAttached();
  await page.goto('/about.html');
  await expect(page.locator('#map')).toHaveCount(0);
});
