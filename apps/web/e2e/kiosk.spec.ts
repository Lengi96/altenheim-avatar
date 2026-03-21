import { test, expect } from '@playwright/test';

test('idle screen loads with greeting and buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Hallo/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Tippen zum Sprechen/i)).toBeVisible();
  await expect(page.getByText(/Video Anruf/i)).toBeVisible();
  await expect(page.getByText(/Spiele/i)).toBeVisible();
  await expect(page.getByText(/Musik/i)).toBeVisible();
});

test('navigates to games screen and shows game options', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Spiele/i).click();
  await expect(page.getByText(/Memory/i)).toBeVisible();
  await expect(page.getByText(/Quiz/i)).toBeVisible();
});

test('navigates to music screen', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Musik/i).click();
  await expect(page.getByText(/Musik/i).first()).toBeVisible();
});

test('memory game card flip works', async ({ page }) => {
  await page.goto('/games');
  await page.getByText(/Memory/i).click();
  const cards = page.locator('button:has-text("?")');
  await expect(cards.first()).toBeVisible();
  await cards.first().click();
  // After click, at least one card shows emoji (not ?)
  const flipped = page.locator('button').filter({ hasNotText: '?' });
  await expect(flipped.first()).toBeVisible();
});
