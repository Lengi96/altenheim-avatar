import { test, expect } from '@playwright/test';

test('admin login page loads', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByText('Altenheim Admin')).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('admin login with valid credentials redirects to residents', async ({ page }) => {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('admin@altenheim.de');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/admin/residents', { timeout: 10_000 });
  await expect(page.getByText('Bewohner')).toBeVisible();
});

test('admin shows residents table', async ({ page }) => {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('admin@altenheim.de');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('/admin/residents');
  await expect(page.getByText('Maria Müller')).toBeVisible();
});
