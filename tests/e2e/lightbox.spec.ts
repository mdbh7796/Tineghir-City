import { test, expect } from '@playwright/test';

// Keyboard-first lightbox: open from a real link, trap focus, page, close, restore.
test('gallery lightbox is keyboard accessible with prev/next', async ({ page }) => {
  await page.goto('/gallery.html');

  const first = page.locator('.lightbox-trigger').first();
  await expect(first).toHaveAttribute('aria-label', /larger/);

  await first.focus();
  await page.keyboard.press('Enter');

  const dialog = page.locator('#lightbox');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('role', 'dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#lightbox-close')).toBeFocused();

  const img = page.locator('#lightbox-img');
  const src1 = await img.getAttribute('src');
  await page.keyboard.press('ArrowRight');
  await expect(img).not.toHaveAttribute('src', src1 ?? '');
  await expect(page.locator('#lightbox-caption')).not.toBeEmpty();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(first).toBeFocused();
});
