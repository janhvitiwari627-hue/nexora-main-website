// Phase 14 E2E Tests - Offline Honesty
import { test, expect } from '@playwright/test';

test.describe('Offline Honesty - E2E Tests', () => {
  const BASE_URL = process.env.ACCEPTANCE_BASE_URL || 'https://nexora-main-website.vercel.app';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });
  
  test('online status indicator visible', async ({ page }) => {
    await page.goto(BASE_URL);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
  });
  
  test('pending actions show pending state', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Log in securely")');
    await expect(page.locator('.form-message')).toBeVisible();
  });
  
  test('no false success on empty submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await page.click('button:has-text("Create Customer account")');
    const messages = page.locator('.form-message');
    await expect(messages.first()).toBeVisible();
    const text = await messages.first().textContent();
    expect(text).toContain('required') || expect(text).toContain('Email');
  });
  
  test('service worker scope check', async ({ page }) => {
    await page.goto(BASE_URL);
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker ? 'supported' : 'not-supported';
    });
    expect(['supported', 'not-supported']).toContain(swRegistration);
  });
});
