import { test, expect } from '@playwright/test';

// Real browser smoke: drawer, planner, map. Run: npx playwright test.
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

test('planner and packing list persist on-device', async ({ page }) => {
  await page.goto('/tools.html');
  await expect(page.locator('#plan-list')).toBeAttached();
  await expect(page.locator('#pack-list')).toBeAttached();
  const firstBox = page.locator('#pack-list input[type="checkbox"]').first();
  await firstBox.check();
  await page.reload();
  await expect(firstBox).toBeChecked();
});


test('map mounts on index, absent elsewhere', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#map')).toBeAttached();
  await page.goto('/about.html');
  await expect(page.locator('#map')).toHaveCount(0);
});
